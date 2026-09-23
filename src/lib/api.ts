import {
  User,
  Lead,
  Customer,
  Deal,
  Task,
  FollowUp,
  Appointment,
  Product,
  Invoice,
  Payment,
  Activity,
  Document,
  CommunicationLog,
  Notification,
  CRMSettings,
  DashboardMetrics,
  LeadStatus,
  DealStage,
  CustomField,
} from '../types/crm';

class ApiClient {
  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const res = await fetch(`/api${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(options?.headers || {}),
      },
    });

    if (!res.ok) {
      let errorMsg = `API Error ${res.status}: ${res.statusText}`;
      try {
        const errJson = await res.json();
        if (errJson.error) errorMsg = errJson.error;
      } catch (_) {}
      throw new Error(errorMsg);
    }

    return res.json();
  }

  // Auth
  async getCurrentUser(): Promise<{ user: User; allUsers: User[] }> {
    return this.request('/auth/me');
  }

  async switchRole(userId: string): Promise<{ success: boolean; user: User }> {
    return this.request('/auth/switch-role', {
      method: 'POST',
      body: JSON.stringify({ userId }),
    });
  }

  // Dashboard
  async getDashboard(range = '30d'): Promise<DashboardMetrics> {
    return this.request(`/dashboard?range=${range}`);
  }

  // Global Search
  async search(query: string): Promise<{
    leads: Lead[];
    customers: Customer[];
    deals: Deal[];
    tasks: Task[];
    invoices: Invoice[];
    products: Product[];
  }> {
    return this.request(`/search?q=${encodeURIComponent(query)}`);
  }

  // Leads
  async getLeads(): Promise<Lead[]> {
    return this.request('/leads');
  }

  async getLead(id: string): Promise<Lead> {
    return this.request(`/leads/${id}`);
  }

  async createLead(lead: Partial<Lead>): Promise<Lead> {
    return this.request('/leads', {
      method: 'POST',
      body: JSON.stringify(lead),
    });
  }

  async updateLead(id: string, updates: Partial<Lead>): Promise<Lead> {
    return this.request(`/leads/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async deleteLead(id: string): Promise<{ success: boolean }> {
    return this.request(`/leads/${id}`, { method: 'DELETE' });
  }

  async convertLead(leadId: string, options: { createDeal?: boolean; dealName?: string; dealValue?: number }): Promise<{ success: boolean; customer: Customer; deal?: Deal }> {
    return this.request(`/leads/${leadId}/convert`, {
      method: 'POST',
      body: JSON.stringify(options),
    });
  }

  async bulkAssignLeads(leadIds: string[], assignedTo: string): Promise<{ success: boolean; count: number }> {
    return this.request('/leads/bulk/assign', {
      method: 'POST',
      body: JSON.stringify({ leadIds, assignedTo }),
    });
  }

  async bulkUpdateLeadStatus(leadIds: string[], status: LeadStatus): Promise<{ success: boolean; count: number }> {
    return this.request('/leads/bulk/status', {
      method: 'POST',
      body: JSON.stringify({ leadIds, status }),
    });
  }

  // Customers
  async getCustomers(): Promise<Customer[]> {
    return this.request('/customers');
  }

  async getCustomer(id: string): Promise<Customer> {
    return this.request(`/customers/${id}`);
  }

  async getCustomer360(id: string): Promise<{
    customer: Customer;
    deals: Deal[];
    invoices: Invoice[];
    payments: Payment[];
    tasks: Task[];
    appointments: Appointment[];
    documents: Document[];
    communications: CommunicationLog[];
    activities: Activity[];
    financialSummary: { totalInvoiced: number; totalPaid: number; totalOutstanding: number };
  }> {
    return this.request(`/customers/${id}/360`);
  }

  async createCustomer(customer: Partial<Customer>): Promise<Customer> {
    return this.request('/customers', {
      method: 'POST',
      body: JSON.stringify(customer),
    });
  }

  async updateCustomer(id: string, updates: Partial<Customer>): Promise<Customer> {
    return this.request(`/customers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async deleteCustomer(id: string): Promise<{ success: boolean }> {
    return this.request(`/customers/${id}`, { method: 'DELETE' });
  }

  // Deals
  async getDeals(): Promise<Deal[]> {
    return this.request('/deals');
  }

  async createDeal(deal: Partial<Deal>): Promise<Deal> {
    return this.request('/deals', {
      method: 'POST',
      body: JSON.stringify(deal),
    });
  }

  async updateDeal(id: string, updates: Partial<Deal>): Promise<Deal> {
    return this.request(`/deals/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async updateDealStage(id: string, stage: DealStage, closeReason?: string): Promise<Deal> {
    return this.request(`/deals/${id}/stage`, {
      method: 'PUT',
      body: JSON.stringify({ stage, closeReason }),
    });
  }

  async deleteDeal(id: string): Promise<{ success: boolean }> {
    return this.request(`/deals/${id}`, { method: 'DELETE' });
  }

  // Users
  async getUsers(): Promise<User[]> {
    return this.request('/users');
  }

  async createUser(user: Partial<User>): Promise<User> {
    return this.request('/users', {
      method: 'POST',
      body: JSON.stringify(user),
    });
  }

  // Communications
  async getCommunications(): Promise<CommunicationLog[]> {
    return this.request('/communications');
  }

  async createCommunication(comm: Partial<CommunicationLog>): Promise<CommunicationLog> {
    return this.request('/communications', {
      method: 'POST',
      body: JSON.stringify(comm),
    });
  }

  async logCommunication(comm: Partial<CommunicationLog>): Promise<CommunicationLog> {
    return this.request('/communications', {
      method: 'POST',
      body: JSON.stringify(comm),
    });
  }

  // Custom Fields
  async getCustomFields(): Promise<CustomField[]> {
    return this.request('/custom-fields');
  }

  async createCustomField(field: Partial<CustomField>): Promise<CustomField> {
    return this.request('/custom-fields', {
      method: 'POST',
      body: JSON.stringify(field),
    });
  }

  async deleteCustomField(id: string): Promise<{ success: boolean }> {
    return this.request(`/custom-fields/${id}`, { method: 'DELETE' });
  }

  // AI Assistant
  async askAi(prompt: string): Promise<{ answer: string; suggestions?: string[] }> {
    return this.request('/ai/query', {
      method: 'POST',
      body: JSON.stringify({ prompt }),
    });
  }

  async askAiCopilot(prompt: string): Promise<{ answer: string; suggestions?: string[] }> {
    return this.request('/ai/query', {
      method: 'POST',
      body: JSON.stringify({ prompt }),
    });
  }

  async generateAiEmail(params: { recipientName: string; company: string; type: string; context: string }): Promise<{ emailDraft: string }> {
    return this.request('/ai/email', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  async extractTasksFromNotes(notes: string): Promise<{ tasks: any[] }> {
    return this.request('/ai/extract-tasks', {
      method: 'POST',
      body: JSON.stringify({ notes }),
    });
  }


  // Tasks
  async getTasks(): Promise<Task[]> {
    return this.request('/tasks');
  }

  async createTask(task: Partial<Task>): Promise<Task> {
    return this.request('/tasks', {
      method: 'POST',
      body: JSON.stringify(task),
    });
  }

  async updateTask(id: string, updates: Partial<Task>): Promise<Task> {
    return this.request(`/tasks/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async deleteTask(id: string): Promise<{ success: boolean }> {
    return this.request(`/tasks/${id}`, { method: 'DELETE' });
  }

  // Follow Ups
  async getFollowUps(): Promise<FollowUp[]> {
    return this.request('/follow-ups');
  }

  async createFollowUp(fu: Partial<FollowUp>): Promise<FollowUp> {
    return this.request('/follow-ups', {
      method: 'POST',
      body: JSON.stringify(fu),
    });
  }

  async updateFollowUp(id: string, updates: Partial<FollowUp>): Promise<FollowUp> {
    return this.request(`/follow-ups/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async deleteFollowUp(id: string): Promise<{ success: boolean }> {
    return this.request(`/follow-ups/${id}`, { method: 'DELETE' });
  }

  // Appointments
  async getAppointments(): Promise<Appointment[]> {
    return this.request('/appointments');
  }

  async createAppointment(appt: Partial<Appointment>): Promise<Appointment> {
    return this.request('/appointments', {
      method: 'POST',
      body: JSON.stringify(appt),
    });
  }

  async updateAppointment(id: string, updates: Partial<Appointment>): Promise<Appointment> {
    return this.request(`/appointments/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async deleteAppointment(id: string): Promise<{ success: boolean }> {
    return this.request(`/appointments/${id}`, { method: 'DELETE' });
  }

  // Products
  async getProducts(): Promise<Product[]> {
    return this.request('/products');
  }

  async createProduct(product: Partial<Product>): Promise<Product> {
    return this.request('/products', {
      method: 'POST',
      body: JSON.stringify(product),
    });
  }

  async updateProduct(id: string, updates: Partial<Product>): Promise<Product> {
    return this.request(`/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async deleteProduct(id: string): Promise<{ success: boolean }> {
    return this.request(`/products/${id}`, { method: 'DELETE' });
  }

  // Invoices
  async getInvoices(): Promise<Invoice[]> {
    return this.request('/invoices');
  }

  async getInvoice(id: string): Promise<Invoice> {
    return this.request(`/invoices/${id}`);
  }

  async createInvoice(invoice: Partial<Invoice>): Promise<Invoice> {
    return this.request('/invoices', {
      method: 'POST',
      body: JSON.stringify(invoice),
    });
  }

  async updateInvoice(id: string, updates: Partial<Invoice>): Promise<Invoice> {
    return this.request(`/invoices/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async deleteInvoice(id: string): Promise<{ success: boolean }> {
    return this.request(`/invoices/${id}`, { method: 'DELETE' });
  }

  // Payments
  async getPayments(): Promise<Payment[]> {
    return this.request('/payments');
  }

  async recordPayment(payment: Partial<Payment>): Promise<Payment> {
    return this.request('/payments', {
      method: 'POST',
      body: JSON.stringify(payment),
    });
  }

  // Activities
  async getActivities(): Promise<Activity[]> {
    return this.request('/activities');
  }

  async createActivity(act: Partial<Activity>): Promise<Activity> {
    return this.request('/activities', {
      method: 'POST',
      body: JSON.stringify(act),
    });
  }

  // Documents
  async getDocuments(): Promise<Document[]> {
    return this.request('/documents');
  }

  async createDocument(doc: Partial<Document>): Promise<Document> {
    return this.request('/documents', {
      method: 'POST',
      body: JSON.stringify(doc),
    });
  }

  async deleteDocument(id: string): Promise<{ success: boolean }> {
    return this.request(`/documents/${id}`, { method: 'DELETE' });
  }

  // Notifications
  async getNotifications(): Promise<Notification[]> {
    return this.request('/notifications');
  }

  async markNotificationRead(id: string): Promise<{ success: boolean }> {
    return this.request(`/notifications/${id}/read`, { method: 'PUT' });
  }

  async markAllNotificationsRead(): Promise<{ success: boolean }> {
    return this.request('/notifications/read-all', { method: 'POST' });
  }

  // Settings
  async getSettings(): Promise<CRMSettings> {
    return this.request('/settings');
  }

  async updateSettings(settings: Partial<CRMSettings>): Promise<CRMSettings> {
    return this.request('/settings', {
      method: 'PUT',
      body: JSON.stringify(settings),
    });
  }

  // Database Management
  async resetDatabase(): Promise<{ success: boolean; message: string; counts: any }> {
    return this.request('/database/reset', { method: 'POST' });
  }
}

export const api = new ApiClient();
