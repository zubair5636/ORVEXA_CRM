import { Router, Request, Response } from 'express';
import { db } from './db';
import { processCrmAiQuery } from './ai';

export const apiRouter = Router();

// Current active session state for demonstration (simulating user session with role switcher)
let currentActiveUserId = 'usr_super_admin';

// --- Auth & Session ---
apiRouter.get('/auth/me', (req: Request, res: Response) => {
  const user = db.getUserById(currentActiveUserId) || db.getUsers()[0];
  res.json({ user, allUsers: db.getUsers() });
});

apiRouter.post('/auth/switch-role', (req: Request, res: Response) => {
  const { userId } = req.body;
  const target = db.getUserById(userId);
  if (!target) {
    return res.status(404).json({ error: 'User not found' });
  }
  currentActiveUserId = userId;
  res.json({ success: true, user: target });
});

// --- Dashboard & Metrics ---
apiRouter.get('/dashboard', (req: Request, res: Response) => {
  const timeRange = (req.query.range as string) || '30d';
  const metrics = db.getDashboardMetrics(timeRange);
  res.json(metrics);
});

// --- Global Search ---
apiRouter.get('/search', (req: Request, res: Response) => {
  const q = (req.query.q as string) || '';
  const results = db.globalSearch(q);
  res.json(results);
});

// --- Leads ---
apiRouter.get('/leads', (req: Request, res: Response) => {
  res.json(db.getLeads());
});

apiRouter.get('/leads/:id', (req: Request, res: Response) => {
  const lead = db.getLeadById(req.params.id);
  if (!lead) return res.status(404).json({ error: 'Lead not found' });
  res.json(lead);
});

apiRouter.post('/leads', (req: Request, res: Response) => {
  try {
    const lead = db.createLead(req.body, currentActiveUserId);
    res.status(201).json(lead);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

apiRouter.put('/leads/:id', (req: Request, res: Response) => {
  const updated = db.updateLead(req.params.id, req.body, currentActiveUserId);
  if (!updated) return res.status(404).json({ error: 'Lead not found' });
  res.json(updated);
});

apiRouter.delete('/leads/:id', (req: Request, res: Response) => {
  const ok = db.deleteLead(req.params.id);
  if (!ok) return res.status(404).json({ error: 'Lead not found' });
  res.json({ success: true });
});

apiRouter.post('/leads/:id/convert', (req: Request, res: Response) => {
  try {
    const result = db.convertLeadToCustomer(req.params.id, req.body, currentActiveUserId);
    res.json({ success: true, ...result });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

apiRouter.post('/leads/bulk/assign', (req: Request, res: Response) => {
  const { leadIds, assignedTo } = req.body;
  const count = db.bulkAssignLeads(leadIds, assignedTo, currentActiveUserId);
  res.json({ success: true, count });
});

apiRouter.post('/leads/bulk/status', (req: Request, res: Response) => {
  const { leadIds, status } = req.body;
  const count = db.bulkUpdateLeadStatus(leadIds, status, currentActiveUserId);
  res.json({ success: true, count });
});

// --- Customers & Customer 360 ---
apiRouter.get('/customers', (req: Request, res: Response) => {
  res.json(db.getCustomers());
});

apiRouter.get('/customers/:id', (req: Request, res: Response) => {
  const customer = db.getCustomerById(req.params.id);
  if (!customer) return res.status(404).json({ error: 'Customer not found' });
  res.json(customer);
});

apiRouter.get('/customers/:id/360', (req: Request, res: Response) => {
  const profile = db.getCustomer360(req.params.id);
  if (!profile) return res.status(404).json({ error: 'Customer not found' });
  res.json(profile);
});

apiRouter.post('/customers', (req: Request, res: Response) => {
  try {
    const cust = db.createCustomer(req.body, currentActiveUserId);
    res.status(201).json(cust);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

apiRouter.put('/customers/:id', (req: Request, res: Response) => {
  const updated = db.updateCustomer(req.params.id, req.body);
  if (!updated) return res.status(404).json({ error: 'Customer not found' });
  res.json(updated);
});

apiRouter.delete('/customers/:id', (req: Request, res: Response) => {
  const ok = db.deleteCustomer(req.params.id);
  if (!ok) return res.status(404).json({ error: 'Customer not found' });
  res.json({ success: true });
});

// --- Deals & Pipeline ---
apiRouter.get('/deals', (req: Request, res: Response) => {
  res.json(db.getDeals());
});

apiRouter.post('/deals', (req: Request, res: Response) => {
  try {
    const deal = db.createDeal(req.body, currentActiveUserId);
    res.status(201).json(deal);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

apiRouter.put('/deals/:id', (req: Request, res: Response) => {
  const updated = db.updateDeal(req.params.id, req.body, currentActiveUserId);
  if (!updated) return res.status(404).json({ error: 'Deal not found' });
  res.json(updated);
});

apiRouter.delete('/deals/:id', (req: Request, res: Response) => {
  const ok = db.deleteDeal(req.params.id);
  if (!ok) return res.status(404).json({ error: 'Deal not found' });
  res.json({ success: true });
});

// --- Tasks ---
apiRouter.get('/tasks', (req: Request, res: Response) => {
  res.json(db.getTasks());
});

apiRouter.post('/tasks', (req: Request, res: Response) => {
  try {
    const task = db.createTask(req.body, currentActiveUserId);
    res.status(201).json(task);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

apiRouter.put('/tasks/:id', (req: Request, res: Response) => {
  const updated = db.updateTask(req.params.id, req.body, currentActiveUserId);
  if (!updated) return res.status(404).json({ error: 'Task not found' });
  res.json(updated);
});

apiRouter.delete('/tasks/:id', (req: Request, res: Response) => {
  const ok = db.deleteTask(req.params.id);
  if (!ok) return res.status(404).json({ error: 'Task not found' });
  res.json({ success: true });
});

// --- Follow Ups ---
apiRouter.get('/follow-ups', (req: Request, res: Response) => {
  res.json(db.getFollowUps());
});

apiRouter.post('/follow-ups', (req: Request, res: Response) => {
  try {
    const fu = db.createFollowUp(req.body);
    res.status(201).json(fu);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

apiRouter.put('/follow-ups/:id', (req: Request, res: Response) => {
  const updated = db.updateFollowUp(req.params.id, req.body);
  if (!updated) return res.status(404).json({ error: 'Follow-up not found' });
  res.json(updated);
});

apiRouter.delete('/follow-ups/:id', (req: Request, res: Response) => {
  const ok = db.deleteFollowUp(req.params.id);
  if (!ok) return res.status(404).json({ error: 'Follow-up not found' });
  res.json({ success: true });
});

// --- Appointments ---
apiRouter.get('/appointments', (req: Request, res: Response) => {
  res.json(db.getAppointments());
});

apiRouter.post('/appointments', (req: Request, res: Response) => {
  try {
    const appt = db.createAppointment(req.body);
    res.status(201).json(appt);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

apiRouter.put('/appointments/:id', (req: Request, res: Response) => {
  const updated = db.updateAppointment(req.params.id, req.body);
  if (!updated) return res.status(404).json({ error: 'Appointment not found' });
  res.json(updated);
});

apiRouter.delete('/appointments/:id', (req: Request, res: Response) => {
  const ok = db.deleteAppointment(req.params.id);
  if (!ok) return res.status(404).json({ error: 'Appointment not found' });
  res.json({ success: true });
});

// --- Products & Services ---
apiRouter.get('/products', (req: Request, res: Response) => {
  res.json(db.getProducts());
});

apiRouter.post('/products', (req: Request, res: Response) => {
  try {
    const prod = db.createProduct(req.body);
    res.status(201).json(prod);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

apiRouter.put('/products/:id', (req: Request, res: Response) => {
  const updated = db.updateProduct(req.params.id, req.body);
  if (!updated) return res.status(404).json({ error: 'Product not found' });
  res.json(updated);
});

apiRouter.delete('/products/:id', (req: Request, res: Response) => {
  const ok = db.deleteProduct(req.params.id);
  if (!ok) return res.status(404).json({ error: 'Product not found' });
  res.json({ success: true });
});

// --- Invoices ---
apiRouter.get('/invoices', (req: Request, res: Response) => {
  res.json(db.getInvoices());
});

apiRouter.get('/invoices/:id', (req: Request, res: Response) => {
  const inv = db.getInvoiceById(req.params.id);
  if (!inv) return res.status(404).json({ error: 'Invoice not found' });
  res.json(inv);
});

apiRouter.post('/invoices', (req: Request, res: Response) => {
  try {
    const inv = db.createInvoice(req.body, currentActiveUserId);
    res.status(201).json(inv);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

apiRouter.put('/invoices/:id', (req: Request, res: Response) => {
  const updated = db.updateInvoice(req.params.id, req.body);
  if (!updated) return res.status(404).json({ error: 'Invoice not found' });
  res.json(updated);
});

apiRouter.delete('/invoices/:id', (req: Request, res: Response) => {
  const ok = db.deleteInvoice(req.params.id);
  if (!ok) return res.status(404).json({ error: 'Invoice not found' });
  res.json({ success: true });
});

// --- Payments ---
apiRouter.get('/payments', (req: Request, res: Response) => {
  res.json(db.getPayments());
});

apiRouter.post('/payments', (req: Request, res: Response) => {
  try {
    const pay = db.recordPayment(req.body, currentActiveUserId);
    res.status(201).json(pay);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// --- Activities & Audit Timeline ---
apiRouter.get('/activities', (req: Request, res: Response) => {
  res.json(db.getActivities());
});

apiRouter.post('/activities', (req: Request, res: Response) => {
  try {
    const user = db.getUserById(currentActiveUserId);
    const act = db.createActivity({
      ...req.body,
      performedBy: currentActiveUserId,
      performedByName: user?.name || 'System User',
    });
    res.status(201).json(act);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// --- Documents ---
apiRouter.get('/documents', (req: Request, res: Response) => {
  res.json(db.getDocuments());
});

apiRouter.post('/documents', (req: Request, res: Response) => {
  try {
    const user = db.getUserById(currentActiveUserId);
    const doc = db.createDocument({
      ...req.body,
      uploadedBy: user?.name || 'Staff Member',
    });
    res.status(201).json(doc);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

apiRouter.delete('/documents/:id', (req: Request, res: Response) => {
  const ok = db.deleteDocument(req.params.id);
  if (!ok) return res.status(404).json({ error: 'Document not found' });
  res.json({ success: true });
});

// --- Communications ---
apiRouter.get('/communications', (req: Request, res: Response) => {
  res.json(db.getCommunications());
});

apiRouter.post('/communications', (req: Request, res: Response) => {
  try {
    const user = db.getUserById(currentActiveUserId);
    const comm = db.logCommunication({
      ...req.body,
      loggedBy: currentActiveUserId,
      loggedByName: user?.name || 'Staff Member',
    });
    res.status(201).json(comm);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// --- Notifications ---
apiRouter.get('/notifications', (req: Request, res: Response) => {
  res.json(db.getNotifications());
});

apiRouter.put('/notifications/:id/read', (req: Request, res: Response) => {
  const ok = db.markNotificationAsRead(req.params.id);
  res.json({ success: ok });
});

apiRouter.post('/notifications/read-all', (req: Request, res: Response) => {
  db.markAllNotificationsAsRead();
  res.json({ success: true });
});

// --- Users & Team ---
apiRouter.get('/users', (req: Request, res: Response) => {
  res.json(db.getUsers());
});

apiRouter.post('/users', (req: Request, res: Response) => {
  try {
    const newUser = {
      id: `usr_${Date.now()}`,
      name: req.body.name,
      email: req.body.email,
      role: req.body.role || 'sales_executive',
      title: req.body.title || 'Staff Member',
      department: req.body.department || 'Operations',
      active: true,
      createdAt: new Date().toISOString(),
    };
    db.getUsers().push(newUser as any);
    res.status(201).json(newUser);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// --- Settings ---
apiRouter.get('/settings', (req: Request, res: Response) => {
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

apiRouter.put('/settings', (req: Request, res: Response) => {
  const updated = db.updateSettings(req.body);
  res.json(updated);
});

// Custom fields in-memory store
const inMemoryCustomFields = [
  { id: 'cf_1', entity: 'lead', label: 'Budget Authorization Level', name: 'budget_level', type: 'dropdown', required: false, options: ['Under $10k', '$10k-$50k', '$50k+'] },
  { id: 'cf_2', entity: 'customer', label: 'Primary Tech Stack', name: 'tech_stack', type: 'text', required: false },
  { id: 'cf_3', entity: 'deal', label: 'Security Review Sign-off', name: 'sec_signoff', type: 'dropdown', required: false, options: ['Pending', 'Approved', 'Waived'] },
];

apiRouter.get('/custom-fields', (req: Request, res: Response) => {
  res.json(inMemoryCustomFields);
});

apiRouter.post('/custom-fields', (req: Request, res: Response) => {
  const newField = {
    id: `cf_${Date.now()}`,
    ...req.body,
    createdAt: new Date().toISOString(),
  };
  inMemoryCustomFields.push(newField);
  res.status(201).json(newField);
});

apiRouter.delete('/custom-fields/:id', (req: Request, res: Response) => {
  const idx = inMemoryCustomFields.findIndex((f) => f.id === req.params.id);
  if (idx !== -1) inMemoryCustomFields.splice(idx, 1);
  res.json({ success: true });
});

// --- AI Assistant ---
apiRouter.post('/ai/query', async (req: Request, res: Response) => {
  try {
    const { prompt } = req.body;
    if (!prompt) return res.status(400).json({ error: 'Prompt is required' });
    const user = db.getUserById(currentActiveUserId);
    const result = await processCrmAiQuery(prompt, user?.role || 'super_admin');
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.post('/ai/email', async (req: Request, res: Response) => {
  try {
    const { recipientName, company, type, context } = req.body;
    const prompt = `Write a professional B2B SaaS executive email for ORVEXA CRM to ${recipientName} at ${company}.
Email Type: ${type}
Context / Talking Points: ${context}
Format as a clean, polished email ready to send with Subject: and Body:.`;
    const result = await processCrmAiQuery(prompt, 'sales_executive');
    res.json({ emailDraft: result.answer });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.post('/ai/extract-tasks', async (req: Request, res: Response) => {
  try {
    const { notes } = req.body;
    const prompt = `Extract all action items or tasks from these client notes:
"${notes}"
Respond with a JSON array of objects with keys: "title", "priority" ('low'|'medium'|'high'|'urgent'), and "dueDate" (YYYY-MM-DD format). If dates are ambiguous, pick plausible upcoming dates.`;
    const result = await processCrmAiQuery(prompt, 'sales_executive');
    
    // Parse tasks or fallback
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
apiRouter.get('/database/export-sql', (req: Request, res: Response) => {
  const sql = db.exportPostgreSQLDump();
  res.setHeader('Content-Type', 'application/sql');
  res.setHeader('Content-Disposition', 'attachment; filename="orvexa_crm_postgresql_supabase_schema.sql"');
  res.send(sql);
});

apiRouter.post('/database/reset', (req: Request, res: Response) => {
  const refreshed = db.resetSeed();
  res.json({ success: true, message: 'Database reset to default seed data successfully.', counts: {
    leads: refreshed.leads.length,
    customers: refreshed.customers.length,
    deals: refreshed.deals.length,
    invoices: refreshed.invoices.length,
    payments: refreshed.payments.length,
  }});
});
