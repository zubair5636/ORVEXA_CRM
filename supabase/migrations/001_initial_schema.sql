-- ==============================================================================
-- ORVEXA CRM - MULTI-TENANT POSTGRESQL SCHEMA FOR SUPABASE
-- Version: 2.0.0
-- ==============================================================================

-- 1. Enable Required Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Custom Types & Enums
DO $$ BEGIN
    CREATE TYPE crm_role AS ENUM (
        'super_admin',
        'admin',
        'manager',
        'sales_executive',
        'support_agent',
        'accountant'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE lead_status AS ENUM (
        'new',
        'contacted',
        'qualified',
        'proposal',
        'negotiation',
        'won',
        'lost'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE priority_level AS ENUM (
        'low',
        'medium',
        'high',
        'urgent'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE deal_stage AS ENUM (
        'new',
        'qualified',
        'proposal',
        'negotiation',
        'won',
        'lost'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE task_status AS ENUM (
        'pending',
        'in_progress',
        'completed',
        'cancelled'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE followup_type AS ENUM (
        'call',
        'whatsapp',
        'email',
        'meeting',
        'other'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE followup_status AS ENUM (
        'pending',
        'completed',
        'cancelled'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE appointment_status AS ENUM (
        'scheduled',
        'confirmed',
        'completed',
        'cancelled',
        'no_show'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE invoice_status AS ENUM (
        'draft',
        'sent',
        'partially_paid',
        'paid',
        'overdue',
        'cancelled'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE payment_method AS ENUM (
        'cash',
        'bank_transfer',
        'upi',
        'card',
        'other'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE activity_type AS ENUM (
        'call',
        'email',
        'meeting',
        'note',
        'status_change',
        'assignment',
        'deal_update',
        'payment',
        'invoice',
        'task_completion'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ==============================================================================
-- 3. CORE MULTI-TENANCY: COMPANIES (WORKSPACES)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    logo TEXT,
    address TEXT NOT NULL DEFAULT '',
    phone TEXT NOT NULL DEFAULT '',
    email TEXT NOT NULL DEFAULT '',
    tax_id TEXT NOT NULL DEFAULT '',
    currency TEXT NOT NULL DEFAULT 'USD',
    currency_symbol TEXT NOT NULL DEFAULT '$',
    timezone TEXT NOT NULL DEFAULT 'America/New_York',
    industry TEXT NOT NULL DEFAULT 'general',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index on company lookup
CREATE INDEX IF NOT EXISTS idx_companies_name ON public.companies(name);

-- ==============================================================================
-- 4. USERS & PROFILES (Linked to Supabase auth.users)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    role crm_role NOT NULL DEFAULT 'sales_executive',
    title TEXT NOT NULL DEFAULT '',
    department TEXT NOT NULL DEFAULT '',
    avatar TEXT,
    phone TEXT,
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_profiles_company ON public.profiles(company_id);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);

-- ==============================================================================
-- 5. HELPER FUNCTIONS FOR ROW LEVEL SECURITY (RLS)
-- ==============================================================================
-- Returns the current authenticated user's company ID
CREATE OR REPLACE FUNCTION public.auth_company_id()
RETURNS UUID AS $$
    SELECT company_id FROM public.profiles WHERE id = auth.uid() LIMIT 1;
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

-- Returns the current authenticated user's role
CREATE OR REPLACE FUNCTION public.auth_user_role()
RETURNS crm_role AS $$
    SELECT role FROM public.profiles WHERE id = auth.uid() LIMIT 1;
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

-- Check if user is Super Admin or Admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() 
          AND role IN ('super_admin', 'admin')
    );
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

-- ==============================================================================
-- 6. LEADS TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    company TEXT NOT NULL DEFAULT '',
    email TEXT NOT NULL DEFAULT '',
    phone TEXT NOT NULL DEFAULT '',
    alt_phone TEXT,
    source TEXT NOT NULL DEFAULT 'Direct',
    status lead_status NOT NULL DEFAULT 'new',
    priority priority_level NOT NULL DEFAULT 'medium',
    lead_score INT NOT NULL DEFAULT 30,
    assigned_to UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    expected_value NUMERIC(12, 2) NOT NULL DEFAULT 0,
    next_follow_up DATE,
    notes TEXT NOT NULL DEFAULT '',
    tags TEXT[] NOT NULL DEFAULT '{}',
    converted_customer_id UUID,
    industry TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_leads_company ON public.leads(company_id);
CREATE INDEX IF NOT EXISTS idx_leads_status ON public.leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_assigned ON public.leads(assigned_to);

-- ==============================================================================
-- 7. CUSTOMERS TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    company TEXT NOT NULL DEFAULT '',
    email TEXT NOT NULL DEFAULT '',
    phone TEXT NOT NULL DEFAULT '',
    alternate_phone TEXT,
    address TEXT NOT NULL DEFAULT '',
    city TEXT,
    country TEXT,
    status TEXT NOT NULL DEFAULT 'active', -- 'active' | 'inactive' | 'lead_converted'
    lifetime_value NUMERIC(12, 2) NOT NULL DEFAULT 0,
    industry TEXT NOT NULL DEFAULT 'general',
    tags TEXT[] NOT NULL DEFAULT '{}',
    notes TEXT NOT NULL DEFAULT '',
    assigned_to UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_customers_company ON public.customers(company_id);
CREATE INDEX IF NOT EXISTS idx_customers_assigned ON public.customers(assigned_to);
CREATE INDEX IF NOT EXISTS idx_customers_email ON public.customers(email);

-- ==============================================================================
-- 8. CONTACTS TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES public.customers(id) ON DELETE CASCADE,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL DEFAULT '',
    email TEXT NOT NULL DEFAULT '',
    phone TEXT NOT NULL DEFAULT '',
    title TEXT,
    is_primary BOOLEAN NOT NULL DEFAULT false,
    notes TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_contacts_company ON public.contacts(company_id);
CREATE INDEX IF NOT EXISTS idx_contacts_customer ON public.contacts(customer_id);

-- ==============================================================================
-- 9. DEALS TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.deals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    customer_id UUID REFERENCES public.customers(id) ON DELETE CASCADE,
    customer_name TEXT NOT NULL DEFAULT '',
    value NUMERIC(12, 2) NOT NULL DEFAULT 0,
    currency TEXT NOT NULL DEFAULT 'USD',
    stage deal_stage NOT NULL DEFAULT 'new',
    probability INT NOT NULL DEFAULT 20, -- 0 to 100
    expected_close_date DATE NOT NULL,
    assigned_to UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    product_ids TEXT[] NOT NULL DEFAULT '{}',
    notes TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_deals_company ON public.deals(company_id);
CREATE INDEX IF NOT EXISTS idx_deals_stage ON public.deals(stage);
CREATE INDEX IF NOT EXISTS idx_deals_customer ON public.deals(customer_id);

-- ==============================================================================
-- 10. PRODUCTS & SERVICES TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    sku TEXT NOT NULL DEFAULT '',
    type TEXT NOT NULL DEFAULT 'product', -- 'product' | 'service'
    description TEXT NOT NULL DEFAULT '',
    price NUMERIC(12, 2) NOT NULL DEFAULT 0,
    tax_rate NUMERIC(5, 2) NOT NULL DEFAULT 0,
    discount NUMERIC(5, 2) NOT NULL DEFAULT 0,
    active BOOLEAN NOT NULL DEFAULT true,
    category TEXT NOT NULL DEFAULT 'General',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_products_company ON public.products(company_id);
CREATE INDEX IF NOT EXISTS idx_products_sku ON public.products(sku);

-- ==============================================================================
-- 11. INVOICES TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    invoice_number TEXT NOT NULL,
    customer_id UUID REFERENCES public.customers(id) ON DELETE CASCADE,
    customer_name TEXT NOT NULL DEFAULT '',
    customer_email TEXT NOT NULL DEFAULT '',
    customer_address TEXT,
    issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
    due_date DATE NOT NULL,
    subtotal NUMERIC(12, 2) NOT NULL DEFAULT 0,
    discount_total NUMERIC(12, 2) NOT NULL DEFAULT 0,
    tax_total NUMERIC(12, 2) NOT NULL DEFAULT 0,
    total NUMERIC(12, 2) NOT NULL DEFAULT 0,
    amount_paid NUMERIC(12, 2) NOT NULL DEFAULT 0,
    balance_due NUMERIC(12, 2) NOT NULL DEFAULT 0,
    status invoice_status NOT NULL DEFAULT 'draft',
    notes TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_invoices_company ON public.invoices(company_id);
CREATE INDEX IF NOT EXISTS idx_invoices_customer ON public.invoices(customer_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON public.invoices(status);

-- ==============================================================================
-- 12. INVOICE ITEMS TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.invoice_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
    description TEXT NOT NULL,
    quantity NUMERIC(10, 2) NOT NULL DEFAULT 1,
    unit_price NUMERIC(12, 2) NOT NULL DEFAULT 0,
    discount NUMERIC(5, 2) NOT NULL DEFAULT 0,
    tax_rate NUMERIC(5, 2) NOT NULL DEFAULT 0,
    total NUMERIC(12, 2) NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice ON public.invoice_items(invoice_id);

-- ==============================================================================
-- 13. PAYMENTS TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES public.customers(id) ON DELETE CASCADE,
    customer_name TEXT NOT NULL DEFAULT '',
    invoice_id UUID REFERENCES public.invoices(id) ON DELETE CASCADE,
    invoice_number TEXT NOT NULL DEFAULT '',
    amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
    payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
    method payment_method NOT NULL DEFAULT 'bank_transfer',
    reference TEXT NOT NULL DEFAULT '',
    notes TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_payments_company ON public.payments(company_id);
CREATE INDEX IF NOT EXISTS idx_payments_customer ON public.payments(customer_id);
CREATE INDEX IF NOT EXISTS idx_payments_invoice ON public.payments(invoice_id);

-- ==============================================================================
-- 14. TASKS TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    priority priority_level NOT NULL DEFAULT 'medium',
    status task_status NOT NULL DEFAULT 'pending',
    due_date DATE NOT NULL,
    assigned_to UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    related_lead_id UUID REFERENCES public.leads(id) ON DELETE CASCADE,
    related_customer_id UUID REFERENCES public.customers(id) ON DELETE CASCADE,
    related_deal_id UUID REFERENCES public.deals(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tasks_company ON public.tasks(company_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned ON public.tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON public.tasks(status);

-- ==============================================================================
-- 15. FOLLOW-UPS TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.follow_ups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    type followup_type NOT NULL DEFAULT 'call',
    related_type TEXT NOT NULL, -- 'lead' | 'customer'
    related_id UUID NOT NULL,
    related_name TEXT NOT NULL DEFAULT '',
    assigned_to UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    date DATE NOT NULL,
    time TEXT NOT NULL DEFAULT '10:00',
    notes TEXT NOT NULL DEFAULT '',
    status followup_status NOT NULL DEFAULT 'pending',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_follow_ups_company ON public.follow_ups(company_id);
CREATE INDEX IF NOT EXISTS idx_follow_ups_assigned ON public.follow_ups(assigned_to);
CREATE INDEX IF NOT EXISTS idx_follow_ups_date ON public.follow_ups(date);

-- ==============================================================================
-- 16. APPOINTMENTS TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.appointments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    customer_id UUID REFERENCES public.customers(id) ON DELETE CASCADE,
    customer_name TEXT,
    lead_id UUID REFERENCES public.leads(id) ON DELETE CASCADE,
    lead_name TEXT,
    employee_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    employee_name TEXT NOT NULL DEFAULT '',
    date DATE NOT NULL,
    start_time TEXT NOT NULL,
    end_time TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'consultation',
    location TEXT NOT NULL DEFAULT '',
    notes TEXT NOT NULL DEFAULT '',
    reminder_minutes INT NOT NULL DEFAULT 15,
    status appointment_status NOT NULL DEFAULT 'scheduled',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_appointments_company ON public.appointments(company_id);
CREATE INDEX IF NOT EXISTS idx_appointments_employee ON public.appointments(employee_id);
CREATE INDEX IF NOT EXISTS idx_appointments_date ON public.appointments(date);

-- ==============================================================================
-- 17. ACTIVITIES & AUDIT LOGS
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    entity_type TEXT NOT NULL, -- 'lead' | 'customer' | 'deal' | 'invoice' | 'task' | 'general'
    entity_id UUID NOT NULL,
    type activity_type NOT NULL DEFAULT 'note',
    title TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    performed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    performed_by_name TEXT NOT NULL DEFAULT 'System',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_activities_company ON public.activities(company_id);
CREATE INDEX IF NOT EXISTS idx_activities_entity ON public.activities(entity_type, entity_id);

CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id TEXT,
    details JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_company ON public.audit_logs(company_id);

-- ==============================================================================
-- 18. DOCUMENTS & COMMUNICATIONS
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    file_name TEXT NOT NULL,
    file_size TEXT NOT NULL DEFAULT '0 KB',
    file_type TEXT NOT NULL DEFAULT 'application/pdf',
    category TEXT NOT NULL DEFAULT 'proposal',
    type TEXT NOT NULL DEFAULT 'proposal',
    related_type TEXT,
    related_id UUID,
    customer_id UUID REFERENCES public.customers(id) ON DELETE CASCADE,
    file_url TEXT NOT NULL,
    tags TEXT[] NOT NULL DEFAULT '{}',
    uploaded_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_documents_company ON public.documents(company_id);

CREATE TABLE IF NOT EXISTS public.communications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    channel TEXT NOT NULL DEFAULT 'call',
    direction TEXT NOT NULL DEFAULT 'outbound',
    recipient_name TEXT NOT NULL DEFAULT '',
    recipient_contact TEXT NOT NULL DEFAULT '',
    customer_id UUID REFERENCES public.customers(id) ON DELETE CASCADE,
    related_type TEXT,
    related_id UUID,
    subject TEXT NOT NULL DEFAULT '',
    content TEXT NOT NULL,
    duration_minutes INT DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'completed',
    logged_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_communications_company ON public.communications(company_id);

-- ==============================================================================
-- 19. NOTIFICATIONS & SETTINGS
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'system',
    read BOOLEAN NOT NULL DEFAULT false,
    link TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id, read);

CREATE TABLE IF NOT EXISTS public.company_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL UNIQUE REFERENCES public.companies(id) ON DELETE CASCADE,
    lead_sources TEXT[] NOT NULL DEFAULT '{"Website", "Referral", "Google Inbound", "LinkedIn", "Outreach", "Partner"}'::TEXT[],
    lead_tags TEXT[] NOT NULL DEFAULT '{"Enterprise", "High Value", "Urgent", "SMB", "International"}'::TEXT[],
    pipeline_stages JSONB NOT NULL DEFAULT '[
        {"id": "new", "label": "Discovery & Qualification", "probability": 20},
        {"id": "qualified", "label": "Technical Scoping", "probability": 40},
        {"id": "proposal", "label": "Proposal Submitted", "probability": 60},
        {"id": "negotiation", "label": "Executive Negotiation", "probability": 80},
        {"id": "won", "label": "Closed Won", "probability": 100},
        {"id": "lost", "label": "Closed Lost", "probability": 0}
    ]'::JSONB,
    industries JSONB NOT NULL DEFAULT '[]'::JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ==============================================================================
-- 20. ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.follow_ups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.communications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_settings ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------------------------
-- Companies RLS
-- ------------------------------------------------------------------------------
CREATE POLICY "Users can read own company"
    ON public.companies FOR SELECT
    USING (id = public.auth_company_id());

CREATE POLICY "Admins can update own company"
    ON public.companies FOR UPDATE
    USING (id = public.auth_company_id() AND public.is_admin());

-- ------------------------------------------------------------------------------
-- Profiles RLS
-- ------------------------------------------------------------------------------
CREATE POLICY "Users can read profiles in same company"
    ON public.profiles FOR SELECT
    USING (company_id = public.auth_company_id());

CREATE POLICY "Users can update own profile"
    ON public.profiles FOR UPDATE
    USING (id = auth.uid());

CREATE POLICY "Admins can manage profiles in same company"
    ON public.profiles FOR ALL
    USING (company_id = public.auth_company_id() AND public.is_admin());

-- ------------------------------------------------------------------------------
-- Leads RLS
-- ------------------------------------------------------------------------------
CREATE POLICY "Tenant isolation for leads"
    ON public.leads FOR ALL
    USING (company_id = public.auth_company_id())
    WITH CHECK (company_id = public.auth_company_id());

-- ------------------------------------------------------------------------------
-- Customers RLS
-- ------------------------------------------------------------------------------
CREATE POLICY "Tenant isolation for customers"
    ON public.customers FOR ALL
    USING (company_id = public.auth_company_id())
    WITH CHECK (company_id = public.auth_company_id());

-- ------------------------------------------------------------------------------
-- Contacts RLS
-- ------------------------------------------------------------------------------
CREATE POLICY "Tenant isolation for contacts"
    ON public.contacts FOR ALL
    USING (company_id = public.auth_company_id())
    WITH CHECK (company_id = public.auth_company_id());

-- ------------------------------------------------------------------------------
-- Deals RLS
-- ------------------------------------------------------------------------------
CREATE POLICY "Tenant isolation for deals"
    ON public.deals FOR ALL
    USING (company_id = public.auth_company_id())
    WITH CHECK (company_id = public.auth_company_id());

-- ------------------------------------------------------------------------------
-- Products RLS
-- ------------------------------------------------------------------------------
CREATE POLICY "Tenant isolation for products"
    ON public.products FOR ALL
    USING (company_id = public.auth_company_id())
    WITH CHECK (company_id = public.auth_company_id());

-- ------------------------------------------------------------------------------
-- Invoices RLS
-- ------------------------------------------------------------------------------
CREATE POLICY "Tenant isolation for invoices"
    ON public.invoices FOR ALL
    USING (company_id = public.auth_company_id())
    WITH CHECK (company_id = public.auth_company_id());

-- ------------------------------------------------------------------------------
-- Invoice Items RLS
-- ------------------------------------------------------------------------------
CREATE POLICY "Tenant isolation for invoice items"
    ON public.invoice_items FOR ALL
    USING (
        invoice_id IN (SELECT id FROM public.invoices WHERE company_id = public.auth_company_id())
    )
    WITH CHECK (
        invoice_id IN (SELECT id FROM public.invoices WHERE company_id = public.auth_company_id())
    );

-- ------------------------------------------------------------------------------
-- Payments RLS
-- ------------------------------------------------------------------------------
CREATE POLICY "Tenant isolation for payments"
    ON public.payments FOR ALL
    USING (company_id = public.auth_company_id())
    WITH CHECK (company_id = public.auth_company_id());

-- ------------------------------------------------------------------------------
-- Tasks RLS
-- ------------------------------------------------------------------------------
CREATE POLICY "Tenant isolation for tasks"
    ON public.tasks FOR ALL
    USING (company_id = public.auth_company_id())
    WITH CHECK (company_id = public.auth_company_id());

-- ------------------------------------------------------------------------------
-- Follow-ups RLS
-- ------------------------------------------------------------------------------
CREATE POLICY "Tenant isolation for follow_ups"
    ON public.follow_ups FOR ALL
    USING (company_id = public.auth_company_id())
    WITH CHECK (company_id = public.auth_company_id());

-- ------------------------------------------------------------------------------
-- Appointments RLS
-- ------------------------------------------------------------------------------
CREATE POLICY "Tenant isolation for appointments"
    ON public.appointments FOR ALL
    USING (company_id = public.auth_company_id())
    WITH CHECK (company_id = public.auth_company_id());

-- ------------------------------------------------------------------------------
-- Activities RLS
-- ------------------------------------------------------------------------------
CREATE POLICY "Tenant isolation for activities"
    ON public.activities FOR ALL
    USING (company_id = public.auth_company_id())
    WITH CHECK (company_id = public.auth_company_id());

-- ------------------------------------------------------------------------------
-- Documents RLS
-- ------------------------------------------------------------------------------
CREATE POLICY "Tenant isolation for documents"
    ON public.documents FOR ALL
    USING (company_id = public.auth_company_id())
    WITH CHECK (company_id = public.auth_company_id());

-- ------------------------------------------------------------------------------
-- Communications RLS
-- ------------------------------------------------------------------------------
CREATE POLICY "Tenant isolation for communications"
    ON public.communications FOR ALL
    USING (company_id = public.auth_company_id())
    WITH CHECK (company_id = public.auth_company_id());

-- ------------------------------------------------------------------------------
-- Notifications RLS
-- ------------------------------------------------------------------------------
CREATE POLICY "Users can read and update own notifications"
    ON public.notifications FOR ALL
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- ------------------------------------------------------------------------------
-- Company Settings RLS
-- ------------------------------------------------------------------------------
CREATE POLICY "Tenant isolation for company_settings"
    ON public.company_settings FOR ALL
    USING (company_id = public.auth_company_id())
    WITH CHECK (company_id = public.auth_company_id());

-- ==============================================================================
-- 21. AUTH USER PROFILE SYNC TRIGGER
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    default_company_id UUID;
    user_role crm_role;
    user_name TEXT;
BEGIN
    -- Look for existing company or default to primary workspace
    SELECT id INTO default_company_id FROM public.companies ORDER BY created_at ASC LIMIT 1;
    
    -- Fallback: Create company if none exists
    IF default_company_id IS NULL THEN
        INSERT INTO public.companies (name, industry, currency, currency_symbol)
        VALUES ('ORVEXA Enterprise Suite', 'digital_agency', 'USD', '$')
        RETURNING id INTO default_company_id;
    END IF;

    -- Extract role from raw_user_meta_data if passed, else default
    user_role := COALESCE((new.raw_user_meta_data->>'role')::crm_role, 'sales_executive'::crm_role);
    user_name := COALESCE(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1));

    INSERT INTO public.profiles (id, company_id, name, email, role, title, department)
    VALUES (
        new.id,
        default_company_id,
        user_name,
        new.email,
        user_role,
        COALESCE(new.raw_user_meta_data->>'title', 'Enterprise User'),
        COALESCE(new.raw_user_meta_data->>'department', 'Operations')
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        name = COALESCE(EXCLUDED.name, public.profiles.name),
        updated_at = now();

    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on auth.users insert
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
