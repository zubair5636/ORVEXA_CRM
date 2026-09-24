import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const supabaseUrl = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('[MIGRATION] Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set to run this migration.');
  console.log('Usage: SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... npx tsx scripts/migrate-json-to-supabase.ts');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false },
});

async function runMigration() {
  console.log('[MIGRATION] Starting JSON to Supabase PostgreSQL migration...');

  const jsonPath = path.resolve(process.cwd(), 'data', 'orvexa_crm_db.json');
  if (!fs.existsSync(jsonPath)) {
    console.error(`[MIGRATION] File not found: ${jsonPath}`);
    process.exit(1);
  }

  const raw = fs.readFileSync(jsonPath, 'utf-8');
  const dbData = JSON.parse(raw);

  // 1. Company
  console.log('[MIGRATION] Inserting company workspace...');
  const comp = dbData.company || {};
  const { data: companyRecord, error: compErr } = await supabase
    .from('companies')
    .upsert({
      name: comp.name || 'ORVEXA Technologies Inc.',
      address: comp.address || '',
      phone: comp.phone || '',
      email: comp.email || '',
      tax_id: comp.taxId || '',
      currency: comp.currency || 'USD',
      currency_symbol: comp.currencySymbol || '$',
      timezone: comp.timezone || 'America/Los_Angeles',
      industry: comp.industry || 'digital_agency',
    })
    .select()
    .single();

  if (compErr) {
    console.error('[MIGRATION] Error upserting company:', compErr.message);
    process.exit(1);
  }

  const companyId = companyRecord.id;
  console.log(`[MIGRATION] Active Company ID: ${companyId}`);

  // 2. Products
  if (Array.isArray(dbData.products) && dbData.products.length > 0) {
    console.log(`[MIGRATION] Migrating ${dbData.products.length} products...`);
    const productsToInsert = dbData.products.map((p: any) => ({
      company_id: companyId,
      name: p.name,
      sku: p.sku || '',
      type: p.type || 'product',
      description: p.description || '',
      price: p.price || 0,
      tax_rate: p.taxRate || 0,
      discount: p.discount || 0,
      active: p.active !== undefined ? p.active : true,
      category: p.category || 'General',
    }));

    const { error: prodErr } = await supabase.from('products').insert(productsToInsert);
    if (prodErr) console.warn('[MIGRATION] Products insert warning:', prodErr.message);
  }

  // 3. Customers
  if (Array.isArray(dbData.customers) && dbData.customers.length > 0) {
    console.log(`[MIGRATION] Migrating ${dbData.customers.length} customers...`);
    const customersToInsert = dbData.customers.map((c: any) => ({
      company_id: companyId,
      name: c.name,
      company: c.company || '',
      email: c.email || '',
      phone: c.phone || '',
      address: c.address || '',
      city: c.city,
      country: c.country,
      status: c.status || 'active',
      lifetime_value: c.lifetimeValue || 0,
      industry: c.industry || 'general',
      tags: c.tags || [],
      notes: c.notes || '',
    }));

    const { error: custErr } = await supabase.from('customers').insert(customersToInsert);
    if (custErr) console.warn('[MIGRATION] Customers insert warning:', custErr.message);
  }

  // 4. Leads
  if (Array.isArray(dbData.leads) && dbData.leads.length > 0) {
    console.log(`[MIGRATION] Migrating ${dbData.leads.length} leads...`);
    const leadsToInsert = dbData.leads.map((l: any) => ({
      company_id: companyId,
      full_name: l.fullName || l.name,
      company: l.company || '',
      email: l.email || '',
      phone: l.phone || '',
      source: l.source || 'Direct',
      status: l.status || 'new',
      priority: l.priority || 'medium',
      lead_score: l.leadScore || 30,
      expected_value: l.expectedValue || 0,
      next_follow_up: l.nextFollowUp || null,
      notes: l.notes || '',
      tags: l.tags || [],
      industry: l.industry,
    }));

    const { error: leadErr } = await supabase.from('leads').insert(leadsToInsert);
    if (leadErr) console.warn('[MIGRATION] Leads insert warning:', leadErr.message);
  }

  console.log('[MIGRATION] Migration complete! PostgreSQL database is now populated.');
}

runMigration().catch((err) => {
  console.error('[MIGRATION] Unexpected failure:', err);
  process.exit(1);
});
