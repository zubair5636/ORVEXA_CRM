export type Role =
  | 'super_admin'
  | 'admin'
  | 'manager'
  | 'sales_executive'
  | 'support_agent'
  | 'accountant';

export type LeadStatus =
  | 'new'
  | 'contacted'
  | 'qualified'
  | 'proposal'
  | 'negotiation'
  | 'won'
  | 'lost';

export type Priority = 'low' | 'medium' | 'high' | 'urgent';

export type DealStage =
  | 'new'
  | 'qualified'
  | 'proposal'
  | 'negotiation'
  | 'won'
  | 'lost';

export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';

export type FollowUpType = 'call' | 'whatsapp' | 'email' | 'meeting' | 'other';
export type FollowUpStatus = 'pending' | 'completed' | 'cancelled';

export type AppointmentStatus =
  | 'scheduled'
  | 'confirmed'
  | 'completed'
  | 'cancelled'
  | 'no_show';

export type InvoiceStatus =
  | 'draft'
  | 'sent'
  | 'partially_paid'
  | 'paid'
  | 'overdue'
  | 'cancelled';

export type PaymentMethod =
  | 'cash'
  | 'bank_transfer'
  | 'upi'
  | 'card'
  | 'other';

export type ActivityType =
  | 'call'
  | 'email'
  | 'meeting'
  | 'note'
  | 'status_change'
  | 'assignment'
  | 'deal_update'
  | 'payment'
  | 'invoice'
  | 'task_completion';

export type DocumentCategory =
  | 'proposal'
  | 'contract'
  | 'invoice'
  | 'id_proof'
  | 'report'
  | 'other';

export type IndustryType =
  | 'digital_agency'
  | 'real_estate'
  | 'clinics'
  | 'gyms'
  | 'coaching'
  | 'automotive'
  | 'professional_services'
  | 'general';

export interface Company {
  id: string;
  name: string;
  logo?: string;
  address: string;
  phone: string;
  email: string;
  taxId: string;
  currency: string;
  currencySymbol: string;
  timezone: string;
  industry: IndustryType;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  title: string;
  department: string;
  avatar?: string;
  phone?: string;
  active: boolean;
  createdAt: string;
}

export interface Lead {
  id: string;
  fullName: string;
  company: string;
  email: string;
  phone: string;
  altPhone?: string;
  source: string;
  status: LeadStatus;
  priority: Priority;
  leadScore: number;
  assignedTo: string; // user id
  assignedUserName?: string;
  expectedValue: number;
  nextFollowUp?: string; // YYYY-MM-DD
  notes: string;
  tags: string[];
  convertedCustomerId?: string;
  industry?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Customer {
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  alternatePhone?: string;
  address: string;
  city?: string;
  country?: string;
  status: 'active' | 'inactive' | 'lead_converted';
  lifetimeValue: number;
  industry: string;
  tags: string[];
  notes: string;
  assignedTo: string;
  assignedUserName?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Deal {
  id: string;
  name: string;
  customerId: string;
  customerName: string;
  value: number;
  currency: string;
  stage: DealStage;
  probability: number; // 0-100
  expectedCloseDate: string; // YYYY-MM-DD
  assignedTo: string;
  assignedUserName?: string;
  productIds?: string[];
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  priority: Priority;
  status: TaskStatus;
  dueDate: string; // YYYY-MM-DD
  assignedTo: string;
  assignedUserName?: string;
  relatedLeadId?: string;
  relatedLeadName?: string;
  relatedCustomerId?: string;
  relatedCustomerName?: string;
  relatedDealId?: string;
  relatedDealName?: string;
  createdAt: string;
  updatedAt: string;
}

export interface FollowUp {
  id: string;
  title: string;
  type: FollowUpType;
  relatedType: 'lead' | 'customer';
  relatedId: string;
  relatedName: string;
  assignedTo: string;
  assignedUserName?: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  notes: string;
  status: FollowUpStatus;
  createdAt: string;
}

export interface Appointment {
  id: string;
  title: string;
  customerId?: string;
  customerName?: string;
  leadId?: string;
  leadName?: string;
  employeeId: string;
  employeeName: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  type: 'demo' | 'consultation' | 'closing' | 'review' | 'site_visit';
  location: string;
  notes: string;
  reminderMinutes: number;
  status: AppointmentStatus;
  createdAt: string;
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  type: 'product' | 'service';
  description: string;
  price: number;
  taxRate: number; // percentage e.g. 18
  discount: number; // percentage e.g. 0
  active: boolean;
  category: string;
  createdAt: string;
}

export interface InvoiceItem {
  id: string;
  productId?: string;
  description: string;
  quantity: number;
  unitPrice: number;
  discount: number; // percentage
  taxRate: number; // percentage
  total: number;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  customerAddress?: string;
  issueDate: string; // YYYY-MM-DD
  dueDate: string; // YYYY-MM-DD
  items: InvoiceItem[];
  subtotal: number;
  discountTotal: number;
  taxTotal: number;
  total: number;
  amountPaid: number;
  balanceDue: number;
  status: InvoiceStatus;
  notes: string;
  createdAt: string;
}

export interface Payment {
  id: string;
  customerId: string;
  customerName: string;
  invoiceId: string;
  invoiceNumber: string;
  amount: number;
  paymentDate: string; // YYYY-MM-DD
  method: PaymentMethod;
  reference: string;
  notes: string;
  createdAt: string;
}

export interface Activity {
  id: string;
  entityType: 'lead' | 'customer' | 'deal' | 'invoice' | 'task' | 'general';
  entityId: string;
  type: ActivityType;
  title: string;
  description: string;
  performedBy: string;
  performedByName: string;
  createdAt: string;
}

export interface CompanySettings {
  companyName: string;
  currency: string;
  currencySymbol?: string;
  timezone: string;
  taxRate: number;
  industry: string;
  logo?: string;
}

export interface CustomField {
  id: string;
  entity: 'lead' | 'customer' | 'deal';
  label: string;
  name: string;
  type: 'text' | 'number' | 'dropdown' | 'date';
  required: boolean;
  options?: string[];
  createdAt?: string;
}

export interface Document {
  id: string;
  name?: string;
  title?: string;
  fileName?: string;
  fileSize: string;
  fileType?: string;
  category?: DocumentCategory;
  type?: 'contract' | 'proposal' | 'invoice' | 'other' | string;
  relatedType?: 'lead' | 'customer' | 'deal' | 'invoice';
  relatedId?: string;
  relatedName?: string;
  customerId?: string;
  customerName?: string;
  url?: string;
  fileUrl?: string;
  tags?: string[];
  uploadedBy?: string;
  createdAt: string;
}

export interface CommunicationLog {
  id: string;
  type?: 'call' | 'email' | 'whatsapp' | 'sms' | 'meeting' | 'note';
  channel?: 'call' | 'email' | 'whatsapp' | 'sms' | 'meeting' | 'note';
  direction?: 'inbound' | 'outbound';
  recipientName?: string;
  recipientContact?: string;
  customerName?: string;
  customerId?: string;
  relatedType?: 'lead' | 'customer';
  relatedId?: string;
  subject: string;
  content: string;
  durationMinutes?: number;
  status?: 'completed' | 'scheduled' | 'failed';
  loggedBy?: string;
  loggedByName?: string;
  userName?: string;
  timestamp?: string;
  createdAt: string;
}


export interface Notification {
  id: string;
  title: string;
  message: string;
  type:
    | 'lead_assigned'
    | 'followup_due'
    | 'task_overdue'
    | 'deal_won'
    | 'invoice_overdue'
    | 'payment_received'
    | 'appointment_reminder'
    | 'system';
  read: boolean;
  link?: string;
  createdAt: string;
}

export interface CRMSettings {
  company: Company;
  leadSources: string[];
  leadTags: string[];
  pipelineStages: { id: DealStage; label: string; probability: number }[];
  industries: { id: IndustryType; name: string; description: string }[];
}

export interface DashboardMetrics {
  totalRevenue: number;
  monthlyRevenue: number;
  totalLeads: number;
  qualifiedLeads: number;
  conversionRate: number;
  activeDeals: number;
  pendingPayments: number;
  followupsToday: number;
  pipelineTotalValue: number;
  weightedPipelineValue: number;
  revenueTrend: { month: string; revenue: number; target: number }[];
  leadsBySource: { source: string; count: number; percentage: number }[];
  conversionFunnel: { stage: string; count: number; value: number }[];
  pipelineByStage: { stage: string; count: number; value: number }[];
  teamPerformance: { name: string; dealsWon: number; revenue: number; leadsHandled: number }[];
  wonVsLost: { status: string; count: number; value: number }[];
  recentActivities: Activity[];
  todaysFollowups: FollowUp[];
  upcomingAppointments: Appointment[];
  recentDeals: Deal[];
  outstandingInvoices: Invoice[];
  recentPayments: Payment[];
}
