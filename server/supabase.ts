import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { User, Role, Company } from '../src/types/crm';

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || '';

export const isServerSupabaseConfigured = (): boolean => {
  return Boolean(
    supabaseUrl &&
      supabaseKey &&
      supabaseUrl.startsWith('https://') &&
      !supabaseUrl.includes('your-project-id')
  );
};

export const serverSupabase: SupabaseClient | null = isServerSupabaseConfigured()
  ? createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  : null;

/**
 * Verify incoming Bearer token against Supabase Auth
 */
export async function verifySupabaseToken(token: string): Promise<User | null> {
  if (!serverSupabase || !token) return null;

  try {
    const { data: { user }, error } = await serverSupabase.auth.getUser(token);
    if (error || !user) {
      return null;
    }

    // Lookup profile from public.profiles table
    const { data: profile } = await serverSupabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    const meta = user.user_metadata || {};
    const role: Role = (profile?.role || meta.role || 'sales_executive') as Role;

    return {
      id: user.id,
      name: profile?.name || meta.name || user.email?.split('@')[0] || 'User',
      email: user.email || '',
      role,
      title: profile?.title || meta.title || 'Enterprise Associate',
      department: profile?.department || meta.department || 'Operations',
      avatar: profile?.avatar || meta.avatar,
      phone: profile?.phone || meta.phone,
      active: profile?.active !== undefined ? profile.active : true,
      createdAt: profile?.created_at || user.created_at,
    };
  } catch (err) {
    console.error('[Supabase Server] Token verification error:', err);
    return null;
  }
}
