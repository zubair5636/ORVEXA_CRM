import type { IncomingMessage, ServerResponse } from 'http';
import { db } from '../../server/db';

function getSafeEnvStatus() {
  return {
    SUPABASE_URL_PRESENT: !!process.env.SUPABASE_URL,
    SUPABASE_ANON_KEY_PRESENT: !!process.env.SUPABASE_ANON_KEY,
    SUPABASE_SERVICE_ROLE_KEY_PRESENT: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    VERCEL_PRESENT: !!process.env.VERCEL,
    NODE_ENV: process.env.NODE_ENV || 'production',
  };
}

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') {
    res.statusCode = 200;
    res.end(JSON.stringify({ status: 'ok' }));
    return;
  }

  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ')
      ? authHeader.substring(7).trim()
      : (req.headers['x-session-token'] as string)?.trim();

    if (!token) {
      res.statusCode = 401;
      res.end(JSON.stringify({
        success: false,
        error: 'AUTH_DEBUG',
        stage: 'session',
        message: 'Authentication session token is required.',
        env_status: getSafeEnvStatus(),
      }));
      return;
    }

    let user = null;

    // If token is a Supabase JWT
    if (token.split('.').length === 3 && process.env.SUPABASE_URL && (process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY)) {
      try {
        const sbUrl = process.env.SUPABASE_URL.replace(/\/$/, '');
        const sbKey = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || '';
        const userRes = await fetch(`${sbUrl}/auth/v1/user`, {
          headers: {
            apikey: sbKey,
            Authorization: `Bearer ${token}`,
          },
        });
        if (userRes.ok) {
          const sbUserData = await userRes.json();
          if (sbUserData?.id) {
            user = db.getUserByEmail(sbUserData.email || '') || {
              id: sbUserData.id,
              name: sbUserData.user_metadata?.name || sbUserData.email?.split('@')[0] || 'User',
              email: sbUserData.email || '',
              role: sbUserData.user_metadata?.role || 'sales_executive',
              title: sbUserData.user_metadata?.title || 'Team Member',
              department: sbUserData.user_metadata?.department || 'Operations',
              active: true,
              createdAt: sbUserData.created_at || new Date().toISOString(),
            };
          }
        }
      } catch (err) {
        console.warn('[AUTH DEBUG] Supabase /auth/v1/user fetch error:', err);
      }
    }

    if (!user) {
      const session = db.getSession(token);
      if (!session) {
        res.statusCode = 401;
        res.end(JSON.stringify({
          success: false,
          error: 'AUTH_DEBUG',
          stage: 'session',
          message: 'Session has expired or is invalid. Please sign in again.',
          env_status: getSafeEnvStatus(),
        }));
        return;
      }

      user = db.getUserById(session.userId);
    }

    if (!user || user.active === false) {
      res.statusCode = 403;
      res.end(JSON.stringify({
        success: false,
        error: 'AUTH_DEBUG',
        stage: 'user_profile',
        message: 'User account is inactive or disabled.',
        env_status: getSafeEnvStatus(),
      }));
      return;
    }

    res.statusCode = 200;
    res.end(JSON.stringify({
      success: true,
      user,
      company: db.getCompany(),
      allUsers: db.getUsers(),
    }));
  } catch (err: any) {
    console.error('[AUTH DEBUG] Error in /api/auth/me:', err?.message || err);
    res.statusCode = 500;
    res.end(JSON.stringify({
      success: false,
      error: 'AUTH_DEBUG',
      stage: 'session',
      message: 'A safe internal server error occurred.',
      env_status: getSafeEnvStatus(),
    }));
  }
}
