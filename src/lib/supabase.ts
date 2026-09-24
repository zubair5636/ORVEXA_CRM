import { createClient, SupabaseClient, User as SupabaseUser, Session } from '@supabase/supabase-js';
import { User, Role, Company } from '../types/crm';

// Read public credentials safely across Vite and Node build environments
const supabaseUrl =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_URL) ||
  (typeof process !== 'undefined' && process.env?.SUPABASE_URL) ||
  '';

const supabaseAnonKey =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_ANON_KEY) ||
  (typeof process !== 'undefined' && process.env?.SUPABASE_ANON_KEY) ||
  '';

export const isSupabaseConfigured = (): boolean => {
  return Boolean(
    supabaseUrl &&
      supabaseAnonKey &&
      supabaseUrl.startsWith('https://') &&
      !supabaseUrl.includes('your-project-id')
  );
};

// Create the browser client (only if valid credentials, else mock/lazy)
export const supabase: SupabaseClient | null = isSupabaseConfigured()
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null;

// Helper: Map Supabase Auth user & profile row into CRM User interface
export function mapProfileToCrmUser(
  sbUser: SupabaseUser,
  profile?: any
): User {
  const meta = sbUser.user_metadata || {};
  const role: Role = (profile?.role || meta.role || 'sales_executive') as Role;

  return {
    id: sbUser.id,
    name: profile?.name || meta.name || sbUser.email?.split('@')[0] || 'User',
    email: sbUser.email || '',
    role: role,
    title: profile?.title || meta.title || 'Enterprise Associate',
    department: profile?.department || meta.department || 'Operations',
    avatar: profile?.avatar || meta.avatar,
    phone: profile?.phone || meta.phone,
    active: profile?.active !== undefined ? profile.active : true,
    createdAt: profile?.created_at || sbUser.created_at,
  };
}

/**
 * Fetch profile from public.profiles table
 */
export async function fetchUserProfile(userId: string): Promise<any | null> {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.warn('[Supabase] Profile lookup warning:', error.message);
      return null;
    }
    return data;
  } catch (err) {
    console.error('[Supabase] Profile lookup exception:', err);
    return null;
  }
}

/**
 * Fetch company from public.companies table
 */
export async function fetchCompany(companyId?: string): Promise<Company | null> {
  if (!supabase) return null;
  try {
    let query = supabase.from('companies').select('*');
    if (companyId) {
      query = query.eq('id', companyId);
    }
    const { data, error } = await query.limit(1).single();
    if (error) return null;

    return {
      id: data.id,
      name: data.name,
      logo: data.logo,
      address: data.address || '',
      phone: data.phone || '',
      email: data.email || '',
      taxId: data.tax_id || '',
      currency: data.currency || 'USD',
      currencySymbol: data.currency_symbol || '$',
      timezone: data.timezone || 'America/Los_Angeles',
      industry: data.industry || 'digital_agency',
    };
  } catch (err) {
    return null;
  }
}

/**
 * Fetch all team users in same company
 */
export async function fetchCompanyTeam(companyId?: string): Promise<User[]> {
  if (!supabase) return [];
  try {
    let query = supabase.from('profiles').select('*');
    if (companyId) {
      query = query.eq('company_id', companyId);
    }
    const { data, error } = await query.order('name');
    if (error || !data) return [];

    return data.map((row) => ({
      id: row.id,
      name: row.name,
      email: row.email,
      role: row.role,
      title: row.title || '',
      department: row.department || '',
      avatar: row.avatar,
      phone: row.phone,
      active: row.active,
      createdAt: row.created_at,
    }));
  } catch {
    return [];
  }
}
