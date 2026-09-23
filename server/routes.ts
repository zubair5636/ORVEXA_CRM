import { Router, Request, Response, NextFunction } from 'express';
import { db } from './db';
import { processCrmAiQuery } from './ai';
import { hashPassword, verifyPassword, generateResetToken } from './auth';
import { Role, User } from '../src/types/crm';

export const apiRouter = Router();

// Extend Request to include authenticated user
export interface AuthenticatedRequest extends Request {
  user?: User;
  sessionToken?: string;
}

// ============================================================================
// AUTHENTICATION & AUTHORIZATION MIDDLEWARE
// ============================================================================

export const authenticateUser = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ')
    ? authHeader.substring(7).trim()
    : (req.headers['x-session-token'] as string)?.trim();

  if (!token) {
    return res.status(401).json({ error: 'Authentication required. Please sign in.' });
  }

  const session = db.getSession(token);
  if (!session) {
    return res.status(401).json({ error: 'Session expired or invalid. Please sign in again.' });
  }

  const user = db.getUserById(session.userId);
  if (!user) {
    return res.status(401).json({ error: 'User account not found.' });
  }

  if (user.active === false) {
    return res.status(403).json({ error: 'Account has been deactivated. Please contact an administrator.' });
  }

  req.user = user;
  req.sessionToken = token;
  next();
};

export const requireRoles = (...allowedRoles: Role[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required.' });
    }

    // Super Admin always has full access
    if (req.user.role === 'super_admin') {
      return next();
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: `Access denied. Role '${req.user.role.replace('_', ' ')}' does not have permission for this resource.`,
      });
    }

    next();
  };
};

// ============================================================================
// AUTHENTICATION ROUTES (PUBLIC & PROTECTED)
// ============================================================================

/**
 * Public: Log in with email and password
 */
apiRouter.post('/auth/login', (req: Request, res: Response) => {
  try {
    const { email, password, rememberMe } = req.body;

    if (!email || typeof email !== 'string' || !password || typeof password !== 'string') {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const trimmedEmail = email.trim().toLowerCase();
    const user = db.getUserByEmail(trimmedEmail);
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    if (user.active === false) {
      return res.status(403).json({ error: 'This account has been disabled. Please contact your administrator.' });
    }

    const cred = db.getCredentialByEmail(trimmedEmail);
    if (!cred) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const isValid = verifyPassword(password, cred.passwordHash, cred.salt);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const session = db.createSession(user.id, !!rememberMe);

    res.json({
      success: true,
      token: session.token,
      user,
      expiresAt: session.expiresAt,
      company: db.getCompany(),
    });
  } catch (err: any) {
    console.error('[AUTH] Login failure:', err);
    res.status(500).json({ error: 'Internal authentication service error.' });
  }
});

/**
 * Protected: Get current session user
 */
apiRouter.get('/auth/me', authenticateUser, (req: AuthenticatedRequest, res: Response) => {
  res.json({
    success: true,
    user: req.user,
    company: db.getCompany(),
    allUsers: db.getUsers(), // Directory list for team assignees
  });
});

/**
 * Protected: Logout and destroy session
 */
apiRouter.post('/auth/logout', authenticateUser, (req: AuthenticatedRequest, res: Response) => {
  if (req.sessionToken) {
    db.deleteSession(req.sessionToken);
  }
  res.json({ success: true, message: 'Logged out successfully.' });
});

/**
 * Public: Request password reset link / token
 */
apiRouter.post('/auth/forgot-password', (req: Request, res: Response) => {
  const { email } = req.body;
  if (!email || typeof email !== 'string') {
    return res.status(400).json({ error: 'A valid email address is required.' });
  }

  const trimmed = email.trim().toLowerCase();
  const user = db.getUserByEmail(trimmed);

  if (user) {
    const token = generateResetToken();
    db.setResetToken(trimmed, token, 60); // 60 min expiration
    return res.json({
      success: true,
      message: `Password reset instructions and token issued for ${trimmed}.`,
      resetToken: token,
    });
  }

  // Consistent message to prevent email enumeration
  res.json({
    success: true,
    message: 'If an account exists with that email, password reset instructions have been generated.',
  });
});

/**
 * Public: Reset password with token
 */
apiRouter.post('/auth/reset-password', (req: Request, res: Response) => {
  const { token, newPassword } = req.body;

  if (!token || typeof token !== 'string') {
    return res.status(400).json({ error: 'Reset token is missing or invalid.' });
  }

  if (!newPassword || typeof newPassword !== 'string' || newPassword.length < 6) {
    return res.status(400).json({ error: 'New password must be at least 6 characters long.' });
  }

  const { hash, salt } = hashPassword(newPassword);
  const result = db.resetPasswordWithToken(token.trim(), hash, salt);

  if (!result.success) {
    return res.status(400).json({ error: result.error || 'Failed to reset password.' });
  }

  res.json({
    success: true,
    message: 'Your password has been reset successfully. Please log in with your new password.',
  });
});

/**
 * Public: Provide demo accounts catalogue for instant testing
 */
apiRouter.get('/auth/demo-accounts', (_req: Request, res: Response) => {
  const demoUsers = db.getUsers().map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    title: u.title,
    department: u.department,
  }));
  res.json(demoUsers);
});

/**
 * Protected: Update own user profile
 */
apiRouter.post('/auth/profile', authenticateUser, (req: AuthenticatedRequest, res: Response) => {
  const { name, phone, title, avatar } = req.body;
  const updated = db.updateUserProfile(req.user!.id, {
    ...(name ? { name } : {}),
    ...(phone !== undefined ? { phone } : {}),
    ...(title ? { title } : {}),
    ...(avatar !== undefined ? { avatar } : {}),
  });
  res.json({ success: true, user: updated });
});

// ============================================================================
// CRM PROTECTED ENDPOINTS
// ============================================================================

// --- Dashboard & Metrics ---
apiRouter.get('/dashboard', authenticateUser, (req: AuthenticatedRequest, res: Response) => {
  const timeRange = (req.query.range as string) || '30d';
  const metrics = db.getDashboardMetrics(timeRange);
  res.json(metrics);
});

// --- Global Search ---
apiRouter.get('/search', authenticateUser, (req: AuthenticatedRequest, res: Response) => {
  const q = (req.query.q as string) || '';
  const results = db.globalSearch(q);
  res.json(results);
});

// --- Leads ---
apiRouter.get('/leads', authenticateUser, (req: AuthenticatedRequest, res: Response) => {
  let leads = db.getLeads();
  // Role-based visibility: sales_executives can see assigned leads or all team leads
  if (req.user?.role === 'sales_executive' && req.query.mine === 'true') {
    leads = leads.filter((l) => l.assignedTo === req.user!.id);
  }
  res.json(leads);
});

apiRouter.get('/leads/:id', authenticateUser, (req: AuthenticatedRequest, res: Response) => {
  const lead = db.getLeadById(req.params.id);
  if (!lead) return res.status(404).json({ error: 'Lead not found' });
  res.json(lead);
});

apiRouter.post(
  '/leads',
  authenticateUser,
  requireRoles('super_admin', 'admin', 'manager', 'sales_executive'),
  (req: AuthenticatedRequest, res: Response) => {
    try {
      const lead = db.createLead(req.body, req.user!.id);
      res.status(201).json(lead);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  }
);

apiRouter.put(
  '/leads/:id',
  authenticateUser,
  requireRoles('super_admin', 'admin', 'manager', 'sales_executive'),
  (req: AuthenticatedRequest, res: Response) => {
    const updated = db.updateLead(req.params.id, req.body, req.user!.id);
    if (!updated) return res.status(404).json({ error: 'Lead not found' });
    res.json(updated);
  }
);

apiRouter.delete(
  '/leads/:id',
  authenticateUser,
  requireRoles('super_admin', 'admin', 'manager'),
  (req: AuthenticatedRequest, res: Response) => {
    const ok = db.deleteLead(req.params.id);
    if (!ok) return res.status(404).json({ error: 'Lead not found' });
    res.json({ success: true });
  }
);

apiRouter.post(
  '/leads/:id/convert',
  authenticateUser,
  requireRoles('super_admin', 'admin', 'manager', 'sales_executive'),
  (req: AuthenticatedRequest, res: Response) => {
    try {
      const result = db.convertLeadToCustomer(req.params.id, req.body, req.user!.id);
      res.json({ success: true, ...result });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  }
);

apiRouter.post(
  '/leads/bulk/assign',
  authenticateUser,
  requireRoles('super_admin', 'admin', 'manager'),
  (req: AuthenticatedRequest, res: Response) => {
    const { leadIds, assignedTo } = req.body;
    const count = db.bulkAssignLeads(leadIds, assignedTo, req.user!.id);
    res.json({ success: true, count });
  }
);

apiRouter.post(
  '/leads/bulk/status',
  authenticateUser,
  requireRoles('super_admin', 'admin', 'manager', 'sales_executive'),
  (req: AuthenticatedRequest, res: Response) => {
    const { leadIds, status } = req.body;
    const count = db.bulkUpdateLeadStatus(leadIds, status, req.user!.id);
    res.json({ success: true, count });
  }
);

// --- Customers & Customer 360 ---
apiRouter.get('/customers', authenticateUser, (req: AuthenticatedRequest, res: Response) => {
  res.json(db.getCustomers());
});

apiRouter.get('/customers/:id', authenticateUser, (req: AuthenticatedRequest, res: Response) => {
  const customer = db.getCustomerById(req.params.id);
  if (!customer) return res.status(404).json({ error: 'Customer not found' });
  res.json(customer);
});

apiRouter.get('/customers/:id/360', authenticateUser, (req: AuthenticatedRequest, res: Response) => {
  const profile = db.getCustomer360(req.params.id);
  if (!profile) return res.status(404).json({ error: 'Customer not found' });
  res.json(profile);
});

apiRouter.post(
  '/customers',
  authenticateUser,
  requireRoles('super_admin', 'admin', 'manager', 'sales_executive'),
  (req: AuthenticatedRequest, res: Response) => {
    try {
      const cust = db.createCustomer(req.body, req.user!.id);
      res.status(201).json(cust);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  }
);

apiRouter.put(
  '/customers/:id',
  authenticateUser,
  requireRoles('super_admin', 'admin', 'manager', 'sales_executive', 'support_agent'),
  (req: AuthenticatedRequest, res: Response) => {
    const updated = db.updateCustomer(req.params.id, req.body);
    if (!updated) return res.status(404).json({ error: 'Customer not found' });
    res.json(updated);
  }
);

apiRouter.delete(
  '/customers/:id',
  authenticateUser,
  requireRoles('super_admin', 'admin'),
  (req: AuthenticatedRequest, res: Response) => {
    const ok = db.deleteCustomer(req.params.id);
    if (!ok) return res.status(404).json({ error: 'Customer not found' });
    res.json({ success: true });
  }
);

// --- Deals & Pipeline ---
apiRouter.get('/deals', authenticateUser, (req: AuthenticatedRequest, res: Response) => {
  res.json(db.getDeals());
});

apiRouter.get('/deals/:id', authenticateUser, (req: AuthenticatedRequest, res: Response) => {
  const deal = db.getDealById(req.params.id);
  if (!deal) return res.status(404).json({ error: 'Deal not found' });
  res.json(deal);
});

apiRouter.post(
  '/deals',
  authenticateUser,
  requireRoles('super_admin', 'admin', 'manager', 'sales_executive'),
  (req: AuthenticatedRequest, res: Response) => {
    try {
      const deal = db.createDeal(req.body, req.user!.id);
      res.status(201).json(deal);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  }
);

apiRouter.put(
  '/deals/:id',
  authenticateUser,
  requireRoles('super_admin', 'admin', 'manager', 'sales_executive'),
  (req: AuthenticatedRequest, res: Response) => {
    const updated = db.updateDeal(req.params.id, req.body, req.user!.id);
    if (!updated) return res.status(404).json({ error: 'Deal not found' });
    res.json(updated);
  }
);

apiRouter.put(
  '/deals/:id/stage',
  authenticateUser,
  requireRoles('super_admin', 'admin', 'manager', 'sales_executive'),
  (req: AuthenticatedRequest, res: Response) => {
    const { stage } = req.body;
    const updated = db.updateDeal(req.params.id, { stage }, req.user!.id);
    if (!updated) return res.status(404).json({ error: 'Deal not found' });
    res.json(updated);
  }
);

apiRouter.delete(
  '/deals/:id',
  authenticateUser,
  requireRoles('super_admin', 'admin', 'manager'),
  (req: AuthenticatedRequest, res: Response) => {
    const ok = db.deleteDeal(req.params.id);
    if (!ok) return res.status(404).json({ error: 'Deal not found' });
    res.json({ success: true });
  }
);

apiRouter.get('/pipeline', authenticateUser, (_req: AuthenticatedRequest, res: Response) => {
  res.json(db.getDeals());
});

// --- Tasks ---
apiRouter.get('/tasks', authenticateUser, (_req: AuthenticatedRequest, res: Response) => {
  res.json(db.getTasks());
});

apiRouter.post('/tasks', authenticateUser, (req: AuthenticatedRequest, res: Response) => {
  try {
    const task = db.createTask(req.body, req.user!.id);
    res.status(201).json(task);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

apiRouter.put('/tasks/:id', authenticateUser, (req: AuthenticatedRequest, res: Response) => {
  const updated = db.updateTask(req.params.id, req.body, req.user!.id);
  if (!updated) return res.status(404).json({ error: 'Task not found' });
  res.json(updated);
});

apiRouter.delete('/tasks/:id', authenticateUser, (req: AuthenticatedRequest, res: Response) => {
  const ok = db.deleteTask(req.params.id);
  if (!ok) return res.status(404).json({ error: 'Task not found' });
  res.json({ success: true });
});

// --- Follow-ups ---
apiRouter.get('/follow-ups', authenticateUser, (_req: AuthenticatedRequest, res: Response) => {
  res.json(db.getFollowUps());
});

apiRouter.post('/follow-ups', authenticateUser, (req: AuthenticatedRequest, res: Response) => {
  try {
    const fu = db.createFollowUp(req.body);
    res.status(201).json(fu);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

apiRouter.put('/follow-ups/:id', authenticateUser, (req: AuthenticatedRequest, res: Response) => {
  const updated = db.updateFollowUp(req.params.id, req.body);
  if (!updated) return res.status(404).json({ error: 'Follow-up not found' });
  res.json(updated);
});

// --- Appointments ---
apiRouter.get('/appointments', authenticateUser, (_req: AuthenticatedRequest, res: Response) => {
  res.json(db.getAppointments());
});

apiRouter.post('/appointments', authenticateUser, (req: AuthenticatedRequest, res: Response) => {
  try {
    const appt = db.createAppointment(req.body);
    res.status(201).json(appt);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

apiRouter.put('/appointments/:id', authenticateUser, (req: AuthenticatedRequest, res: Response) => {
  const updated = db.updateAppointment(req.params.id, req.body);
  if (!updated) return res.status(404).json({ error: 'Appointment not found' });
  res.json(updated);
});

// --- Products & Services ---
apiRouter.get('/products', authenticateUser, (req: AuthenticatedRequest, res: Response) => {
  res.json(db.getProducts());
});

apiRouter.post(
  '/products',
  authenticateUser,
  requireRoles('super_admin', 'admin', 'accountant'),
  (req: AuthenticatedRequest, res: Response) => {
    try {
      const prod = db.createProduct(req.body);
      res.status(201).json(prod);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  }
);

apiRouter.put(
  '/products/:id',
  authenticateUser,
  requireRoles('super_admin', 'admin', 'accountant'),
  (req: AuthenticatedRequest, res: Response) => {
    const updated = db.updateProduct(req.params.id, req.body);
    if (!updated) return res.status(404).json({ error: 'Product not found' });
    res.json(updated);
  }
);

// --- Invoices ---
apiRouter.get(
  '/invoices',
  authenticateUser,
  requireRoles('super_admin', 'admin', 'manager', 'accountant'),
  (req: AuthenticatedRequest, res: Response) => {
    res.json(db.getInvoices());
  }
);

apiRouter.get(
  '/invoices/:id',
  authenticateUser,
  requireRoles('super_admin', 'admin', 'manager', 'accountant'),
  (req: AuthenticatedRequest, res: Response) => {
    const inv = db.getInvoiceById(req.params.id);
    if (!inv) return res.status(404).json({ error: 'Invoice not found' });
    res.json(inv);
  }
);

apiRouter.post(
  '/invoices',
  authenticateUser,
  requireRoles('super_admin', 'admin', 'accountant'),
  (req: AuthenticatedRequest, res: Response) => {
    try {
      const inv = db.createInvoice(req.body, req.user!.id);
      res.status(201).json(inv);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  }
);

apiRouter.put(
  '/invoices/:id',
  authenticateUser,
  requireRoles('super_admin', 'admin', 'accountant'),
  (req: AuthenticatedRequest, res: Response) => {
    const updated = db.updateInvoice(req.params.id, req.body);
    if (!updated) return res.status(404).json({ error: 'Invoice not found' });
    res.json(updated);
  }
);

// --- Payments ---
apiRouter.get(
  '/payments',
  authenticateUser,
  requireRoles('super_admin', 'admin', 'manager', 'accountant'),
  (req: AuthenticatedRequest, res: Response) => {
    res.json(db.getPayments());
  }
);

apiRouter.post(
  '/payments',
  authenticateUser,
  requireRoles('super_admin', 'admin', 'accountant'),
  (req: AuthenticatedRequest, res: Response) => {
    try {
      const payment = db.recordPayment(req.body, req.user!.id);
      res.status(201).json(payment);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  }
);

// --- Activities & Audit Logs ---
apiRouter.get('/activities', authenticateUser, (req: AuthenticatedRequest, res: Response) => {
  res.json(db.getActivities());
});

apiRouter.post('/activities', authenticateUser, (req: AuthenticatedRequest, res: Response) => {
  try {
    const act = db.createActivity({
      ...req.body,
      performedBy: req.user!.id,
      performedByName: req.user!.name,
    });
    res.status(201).json(act);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// --- Documents ---
apiRouter.get('/documents', authenticateUser, (req: AuthenticatedRequest, res: Response) => {
  res.json(db.getDocuments());
});

apiRouter.post('/documents', authenticateUser, (req: AuthenticatedRequest, res: Response) => {
  try {
    const doc = db.createDocument({
      ...req.body,
      uploadedBy: req.user!.id,
      uploadedByName: req.user!.name,
    });
    res.status(201).json(doc);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

apiRouter.delete(
  '/documents/:id',
  authenticateUser,
  requireRoles('super_admin', 'admin', 'manager'),
  (req: AuthenticatedRequest, res: Response) => {
    const ok = db.deleteDocument(req.params.id);
    if (!ok) return res.status(404).json({ error: 'Document not found' });
    res.json({ success: true });
  }
);

// --- Communications ---
apiRouter.get('/communications', authenticateUser, (req: AuthenticatedRequest, res: Response) => {
  res.json(db.getCommunications());
});

apiRouter.post('/communications', authenticateUser, (req: AuthenticatedRequest, res: Response) => {
  try {
    const comm = db.logCommunication({
      ...req.body,
      loggedBy: req.user!.id,
      loggedByName: req.user!.name,
    });
    res.status(201).json(comm);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// --- Notifications ---
apiRouter.get('/notifications', authenticateUser, (req: AuthenticatedRequest, res: Response) => {
  res.json(db.getNotifications());
});

apiRouter.put('/notifications/:id/read', authenticateUser, (req: AuthenticatedRequest, res: Response) => {
  const ok = db.markNotificationAsRead(req.params.id);
  res.json({ success: ok });
});

apiRouter.post('/notifications/read-all', authenticateUser, (req: AuthenticatedRequest, res: Response) => {
  db.markAllNotificationsAsRead();
  res.json({ success: true });
});

// --- Users & Team Management ---
apiRouter.get('/users', authenticateUser, (req: AuthenticatedRequest, res: Response) => {
  res.json(db.getUsers());
});

apiRouter.post(
  '/users',
  authenticateUser,
  requireRoles('super_admin', 'admin'),
  (req: AuthenticatedRequest, res: Response) => {
    try {
      const { user } = db.createUserWithCredentials({
        name: req.body.name,
        email: req.body.email,
        role: req.body.role || 'sales_executive',
        title: req.body.title || 'Staff Member',
        department: req.body.department || 'Operations',
        phone: req.body.phone,
        active: req.body.active !== false,
      }, req.body.password || 'Orvexa2026!');
      res.status(201).json(user);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  }
);

// --- Settings ---
apiRouter.get('/settings', authenticateUser, (req: AuthenticatedRequest, res: Response) => {
  const crmSettings = db.getSettings();
  res.json({
    companyName: crmSettings.company.name,
    currency: crmSettings.company.currency,
    timezone: crmSettings.company.timezone,
    taxRate: 18,
    industry: crmSettings.company.industry,
    logo: crmSettings.company.logo,
    raw: crmSettings,
  });
});

apiRouter.put(
  '/settings',
  authenticateUser,
  requireRoles('super_admin', 'admin'),
  (req: AuthenticatedRequest, res: Response) => {
    const updated = db.updateSettings(req.body);
    res.json(updated);
  }
);

// Custom fields in-memory store
const inMemoryCustomFields = [
  { id: 'cf_1', entity: 'lead', label: 'Budget Authorization Level', name: 'budget_level', type: 'dropdown', required: false, options: ['Under $10k', '$10k-$50k', '$50k+'] },
  { id: 'cf_2', entity: 'customer', label: 'Primary Tech Stack', name: 'tech_stack', type: 'text', required: false },
  { id: 'cf_3', entity: 'deal', label: 'Security Review Sign-off', name: 'sec_signoff', type: 'dropdown', required: false, options: ['Pending', 'Approved', 'Waived'] },
];

apiRouter.get('/custom-fields', authenticateUser, (req: AuthenticatedRequest, res: Response) => {
  res.json(inMemoryCustomFields);
});

apiRouter.post(
  '/custom-fields',
  authenticateUser,
  requireRoles('super_admin', 'admin'),
  (req: AuthenticatedRequest, res: Response) => {
    const newField = {
      id: `cf_${Date.now()}`,
      ...req.body,
      createdAt: new Date().toISOString(),
    };
    inMemoryCustomFields.push(newField);
    res.status(201).json(newField);
  }
);

apiRouter.delete(
  '/custom-fields/:id',
  authenticateUser,
  requireRoles('super_admin', 'admin'),
  (req: AuthenticatedRequest, res: Response) => {
    const idx = inMemoryCustomFields.findIndex((f) => f.id === req.params.id);
    if (idx !== -1) inMemoryCustomFields.splice(idx, 1);
    res.json({ success: true });
  }
);

// --- AI Assistant ---
apiRouter.post('/ai/query', authenticateUser, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { prompt } = req.body;
    if (!prompt) return res.status(400).json({ error: 'Prompt is required' });
    const result = await processCrmAiQuery(prompt, req.user!.role);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.post('/ai/email', authenticateUser, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { recipientName, company, type, context } = req.body;
    const prompt = `Write a professional B2B SaaS executive email for ORVEXA CRM to ${recipientName} at ${company}.
Email Type: ${type}
Context / Talking Points: ${context}
Format as a clean, polished email ready to send with Subject: and Body:.`;
    const result = await processCrmAiQuery(prompt, req.user!.role);
    res.json({ emailDraft: result.answer });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.post('/ai/extract-tasks', authenticateUser, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { notes } = req.body;
    const prompt = `Extract all action items or tasks from these client notes:
"${notes}"
Respond with a JSON array of objects with keys: "title", "priority" ('low'|'medium'|'high'|'urgent'), and "dueDate" (YYYY-MM-DD format). If dates are ambiguous, pick plausible upcoming dates.`;
    const result = await processCrmAiQuery(prompt, req.user!.role);

    let tasks = [];
    try {
      const match = result.answer.match(/\[[\s\S]*\]/);
      if (match) {
        tasks = JSON.parse(match[0]);
      }
    } catch (e) {
      tasks = [
        { title: 'Follow up on proposal feedback', priority: 'high', dueDate: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0] },
        { title: 'Coordinate technical discovery call', priority: 'medium', dueDate: new Date(Date.now() + 86400000 * 4).toISOString().split('T')[0] },
      ];
    }
    res.json({ tasks });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// --- Database Management & Export ---
apiRouter.get(
  '/database/export-sql',
  authenticateUser,
  requireRoles('super_admin', 'admin'),
  (req: AuthenticatedRequest, res: Response) => {
    const sql = db.exportPostgreSQLDump();
    res.setHeader('Content-Type', 'application/sql');
    res.setHeader('Content-Disposition', 'attachment; filename="orvexa_crm_postgresql_supabase_schema.sql"');
    res.send(sql);
  }
);

apiRouter.post(
  '/database/reset',
  authenticateUser,
  requireRoles('super_admin'),
  (req: AuthenticatedRequest, res: Response) => {
    const refreshed = db.resetSeed();
    res.json({
      success: true,
      message: 'Database reset to default seed data successfully.',
      counts: {
        leads: refreshed.leads.length,
        customers: refreshed.customers.length,
        deals: refreshed.deals.length,
        invoices: refreshed.invoices.length,
        payments: refreshed.payments.length,
      },
    });
  }
);
