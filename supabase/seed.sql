-- ==============================================================================
-- ORVEXA CRM - SEED DATA FOR SUPABASE POSTGRESQL
-- ==============================================================================

DO $$
DECLARE
    v_company_id UUID;
BEGIN
    -- 1. Create Default Workspace / Company
    INSERT INTO public.companies (
        id,
        name,
        address,
        phone,
        email,
        tax_id,
        currency,
        currency_symbol,
        timezone,
        industry
    ) VALUES (
        'a0000000-0000-0000-0000-000000000001',
        'ORVEXA Technologies Inc.',
        '100 Montgomery St, Suite 2400, San Francisco, CA 94104',
        '+1 (415) 890-2300',
        'contact@orvexa.io',
        'US-94-3829102',
        'USD',
        '$',
        'America/Los_Angeles',
        'digital_agency'
    )
    ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name
    RETURNING id INTO v_company_id;

    -- 2. Company Settings
    INSERT INTO public.company_settings (
        company_id,
        lead_sources,
        lead_tags,
        pipeline_stages
    ) VALUES (
        v_company_id,
        ARRAY['Website Inbound', 'Referral', 'Google Inbound', 'LinkedIn Enterprise', 'Direct Outreach', 'Strategic Partner'],
        ARRAY['Enterprise', 'High Value', 'Urgent Closing', 'SMB', 'Tier-1 Account', 'Expansion'],
        '[
            {"id": "new", "label": "Discovery & Qualification", "probability": 20},
            {"id": "qualified", "label": "Technical Scoping", "probability": 40},
            {"id": "proposal", "label": "Proposal Submitted", "probability": 60},
            {"id": "negotiation", "label": "Executive Negotiation", "probability": 80},
            {"id": "won", "label": "Closed Won", "probability": 100},
            {"id": "lost", "label": "Closed Lost", "probability": 0}
        ]'::jsonb
    )
    ON CONFLICT (company_id) DO NOTHING;

    -- 3. Standard Products & Services
    INSERT INTO public.products (id, company_id, name, sku, type, description, price, tax_rate, discount, active, category)
    VALUES
        ('b0000000-0000-0000-0000-000000000001', v_company_id, 'Enterprise CRM Annual License', 'ORV-ENT-ANN', 'product', 'Dedicated cloud CRM deployment with custom API access, RBAC, and priority SLA.', 18000, 8.5, 10, true, 'Software Subscriptions'),
        ('b0000000-0000-0000-0000-000000000002', v_company_id, 'Custom ERP & Integration Onboarding', 'ORV-SRV-ONB', 'service', 'Full white-glove migration, legacy database schema mapping, and pipeline automation setup.', 6500, 8.5, 0, true, 'Professional Services'),
        ('b0000000-0000-0000-0000-000000000003', v_company_id, 'Dedicated Account Success Manager', 'ORV-SRV-TAM', 'service', 'Assigned technical architect with monthly revenue architecture reviews and custom reporting.', 3200, 8.5, 0, true, 'Support & Retainers'),
        ('b0000000-0000-0000-0000-000000000004', v_company_id, 'Growth Tier CRM - Quarterly Seat Pack (25 Users)', 'ORV-GRW-QTR', 'product', 'Scalable sales seat pack for growing sales and customer support divisions.', 4500, 8.5, 5, true, 'Software Subscriptions'),
        ('b0000000-0000-0000-0000-000000000005', v_company_id, 'Security & Compliance Vault Add-on', 'ORV-SEC-VLT', 'product', 'SOC-2 Type II audit logging, strict tenant data isolation, and encrypted document storage.', 2400, 8.5, 0, true, 'Security')
    ON CONFLICT (id) DO NOTHING;

    -- 4. Sample Customers
    INSERT INTO public.customers (
        id, company_id, name, company, email, phone, address, city, country, status, lifetime_value, industry, tags, notes
    ) VALUES
        ('c0000000-0000-0000-0000-000000000001', v_company_id, 'Aura Health & Biotech Solutions', 'Aura Therapeutics Ltd.', 'procurement@aurabio.com', '+1 (650) 412-8800', '400 Gateway Blvd, Suite 300', 'South San Francisco', 'United States', 'active', 52000, 'clinics', ARRAY['Enterprise', 'Healthcare', 'High SLA'], 'Flagship enterprise client operating 18 clinics. Migrated from legacy ERP.'),
        ('c0000000-0000-0000-0000-000000000002', v_company_id, 'Apex Urban Realty Group', 'Apex Urban Estates Corp.', 'partnerships@apexurban.com', '+1 (212) 774-9020', '885 Third Ave, 31st Floor', 'New York', 'United States', 'active', 38500, 'real_estate', ARRAY['Real Estate', 'Multi-Agent', 'Tier-1'], 'Commercial brokerage with 75 agents across Manhattan and Brooklyn.'),
        ('c0000000-0000-0000-0000-000000000003', v_company_id, 'Velocity Digital Media Group', 'Velocity Creative LLC', 'ops@velocitydigital.io', '+1 (310) 902-3341', '1450 Ocean Ave, 4th Floor', 'Santa Monica', 'United States', 'active', 29000, 'digital_agency', ARRAY['Agency', 'Marketing Retainer'], 'Fast-scaling performance marketing agency handling global DTC brands.'),
        ('c0000000-0000-0000-0000-000000000004', v_company_id, 'Pulse Fitness Franchise Network', 'Pulse Holdings LLC', 'finance@pulsefitcorp.com', '+1 (305) 604-1188', '701 Brickell Ave, Suite 1200', 'Miami', 'United States', 'active', 21500, 'gyms', ARRAY['Franchise', 'Recurring'], 'Boutique gym chain with 12 active studios and 6 in development.')
    ON CONFLICT (id) DO NOTHING;

    -- 5. Sample Leads
    INSERT INTO public.leads (
        id, company_id, full_name, company, email, phone, source, status, priority, lead_score, expected_value, next_follow_up, notes, tags
    ) VALUES
        ('d0000000-0000-0000-0000-000000000001', v_company_id, 'Julian Vance', 'HyperScale Cloud Logistics', 'julian.vance@hyperscalelog.com', '+1 (206) 881-9920', 'Google Inbound', 'negotiation', 'urgent', 92, 45000, CURRENT_DATE + INTERVAL '1 day', 'Final contract review in legal. Key decision maker confirmed budget.', ARRAY['Enterprise', 'Logistics', 'Q1 Closing']),
        ('d0000000-0000-0000-0000-000000000002', v_company_id, 'Evelyn Reed', 'Summit Wealth & Asset Advisory', 'evelyn@summitassetmgmt.com', '+1 (312) 993-4411', 'Referral', 'proposal', 'high', 78, 28000, CURRENT_DATE + INTERVAL '2 days', 'Sent customized enterprise security scope with SOC2 certification overview.', ARRAY['Finance', 'Tier-1 Account']),
        ('d0000000-0000-0000-0000-000000000003', v_company_id, 'Tariq Al-Mansoor', 'NexGen Autonomous Systems', 'tariq@nexgenmobility.io', '+1 (408) 772-1090', 'Website', 'qualified', 'medium', 65, 34000, CURRENT_DATE + INTERVAL '3 days', 'Initial discovery completed. Team is expanding sales division by 40 reps.', ARRAY['Automotive', 'Robotics']),
        ('d0000000-0000-0000-0000-000000000004', v_company_id, 'Camila Santos', 'Lumina Aesthetic Clinics Group', 'camila.s@luminaaesthetic.com', '+1 (786) 431-8902', 'LinkedIn Enterprise', 'contacted', 'medium', 54, 19500, CURRENT_DATE + INTERVAL '4 days', 'Requested product demonstration focusing on automated customer follow-ups and WhatsApp integration.', ARRAY['Healthcare', 'SMB'])
    ON CONFLICT (id) DO NOTHING;

    -- 6. Sample Deals
    INSERT INTO public.deals (
        id, company_id, name, customer_id, customer_name, value, currency, stage, probability, expected_close_date, notes
    ) VALUES
        ('e0000000-0000-0000-0000-000000000001', v_company_id, 'HyperScale 200-Seat Migration & CRM Rollout', 'c0000000-0000-0000-0000-000000000001', 'Aura Health & Biotech Solutions', 45000, 'USD', 'negotiation', 85, CURRENT_DATE + INTERVAL '14 days', 'Contract is in legal with security redlines accepted.'),
        ('e0000000-0000-0000-0000-000000000002', v_company_id, 'Apex Urban Multi-Office Expansion License', 'c0000000-0000-0000-0000-000000000002', 'Apex Urban Estates Corp.', 28000, 'USD', 'proposal', 60, CURRENT_DATE + INTERVAL '21 days', 'Proposal submitted to managing partners.'),
        ('e0000000-0000-0000-0000-000000000003', v_company_id, 'Velocity Media Annual Enterprise Renewal', 'c0000000-0000-0000-0000-000000000003', 'Velocity Creative LLC', 32000, 'USD', 'won', 100, CURRENT_DATE - INTERVAL '10 days', 'Annual contract renewed for year 2.'),
        ('e0000000-0000-0000-0000-000000000004', v_company_id, 'Pulse Fitness Multi-Studio Automation Retainer', 'c0000000-0000-0000-0000-000000000004', 'Pulse Holdings LLC', 18500, 'USD', 'qualified', 40, CURRENT_DATE + INTERVAL '30 days', 'Technical scoping session scheduled with CIO.')
    ON CONFLICT (id) DO NOTHING;

    -- 7. Sample Tasks
    INSERT INTO public.tasks (
        id, company_id, title, description, priority, status, due_date
    ) VALUES
        ('f0000000-0000-0000-0000-000000000001', v_company_id, 'Conduct security compliance demo with HyperScale legal team', 'Present SOC-2 Type II audit report and review dedicated data residency compliance.', 'urgent', 'in_progress', CURRENT_DATE + INTERVAL '1 day'),
        ('f0000000-0000-0000-0000-000000000002', v_company_id, 'Finalize revised commercial proposal for Apex Urban Group', 'Incorporate 10% multi-year discount and submit to CFO.', 'high', 'pending', CURRENT_DATE + INTERVAL '2 days'),
        ('f0000000-0000-0000-0000-000000000003', v_company_id, 'Review Q1 enterprise pipeline forecast with Sales Leadership', 'Prepare conversion velocity metrics and lead attribution breakdown.', 'medium', 'pending', CURRENT_DATE + INTERVAL '3 days')
    ON CONFLICT (id) DO NOTHING;

    -- 8. Sample Invoices
    INSERT INTO public.invoices (
        id, company_id, invoice_number, customer_id, customer_name, customer_email, issue_date, due_date, subtotal, discount_total, tax_total, total, amount_paid, balance_due, status, notes
    ) VALUES
        ('g0000000-0000-0000-0000-000000000001', v_company_id, 'INV-2026-0089', 'c0000000-0000-0000-0000-000000000003', 'Velocity Creative LLC', 'ops@velocitydigital.io', CURRENT_DATE - INTERVAL '15 days', CURRENT_DATE + INTERVAL '15 days', 32000, 3200, 2448, 31248, 31248, 0, 'paid', 'Annual enterprise license renewal.'),
        ('g0000000-0000-0000-0000-000000000002', v_company_id, 'INV-2026-0090', 'c0000000-0000-0000-0000-000000000001', 'Aura Health & Biotech Solutions', 'procurement@aurabio.com', CURRENT_DATE - INTERVAL '5 days', CURRENT_DATE + INTERVAL '25 days', 18000, 1800, 1377, 17577, 0, 17577, 'sent', 'Initial onboarding invoice.')
    ON CONFLICT (id) DO NOTHING;

END $$;
