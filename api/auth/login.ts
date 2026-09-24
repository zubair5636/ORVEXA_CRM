import type { IncomingMessage, ServerResponse } from 'http';
import { db } from '../../server/db';
import { verifyPassword, ROLE_PERMISSIONS } from '../../server/auth';
import { getSafeEnvStatus } from '../../server/routes';

// Helper to safely extract JSON body across Node stream or pre-parsed Vercel serverless request
async function getRequestBody(req: IncomingMessage): Promise<any> {
  if ((req as any).body && typeof (req as any).body === 'object') {
    return (req as any).body;
  }
  return new Promise((resolve) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
    });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch {
        resolve({});
      }
    });
    req.on('error', () => {
      resolve({});
    });
  });
}

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  let stage = 'request_validation';

  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') {
    res.statusCode = 200;
    res.end(JSON.stringify({ status: 'ok' }));
    return;
  }

  if (req.method !== 'POST') {
    res.statusCode = 405;
    res.end(JSON.stringify({
      success: false,
      error: 'AUTH_DEBUG',
      stage: 'request_validation',
      message: 'Method Not Allowed. Expected POST.',
      env_status: getSafeEnvStatus(),
    }));
    return;
  }

  try {
    const body = await getRequestBody(req);
    const { email, password, rememberMe } = body || {};

    // 1. Request Validation
    if (!email || typeof email !== 'string' || !password || typeof password !== 'string') {
      res.statusCode = 400;
      res.end(JSON.stringify({
        success: false,
        error: 'AUTH_DEBUG',
        stage: 'request_validation',
        message: 'Email and password are required string fields.',
        env_status: getSafeEnvStatus(),
      }));
      return;
    }

    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail.includes('@') || password.length === 0) {
      res.statusCode = 400;
      res.end(JSON.stringify({
        success: false,
        error: 'AUTH_DEBUG',
        stage: 'request_validation',
        message: 'Invalid email address format.',
        env_status: getSafeEnvStatus(),
      }));
      return;
    }

    // 2. Env & Provider Initialization
    stage = 'env_initialization';
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
    const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey);

    // 3. Supabase Auth (if configured)
    if (isSupabaseConfigured) {
      stage = 'supabase_initialization';
      try {
        stage = 'supabase_auth';
        const supabaseRes = await fetch(`${supabaseUrl.replace(/\/$/, '')}/auth/v1/token?grant_type=password`, {
          method: 'POST',
          headers: {
            apikey: supabaseAnonKey,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email: trimmedEmail, password }),
        });

        const supabaseData = await supabaseRes.json().catch(() => ({}));
        if (!supabaseRes.ok) {
          res.statusCode = 401;
          res.end(JSON.stringify({
            success: false,
            error: 'AUTH_DEBUG',
            stage: 'supabase_auth',
            message: supabaseData?.error_description || supabaseData?.msg || 'Supabase authentication failed. Please verify credentials.',
            env_status: getSafeEnvStatus(),
          }));
          return;
        }
      } catch (sbErr: any) {
        res.statusCode = 500;
        res.end(JSON.stringify({
          success: false,
          error: 'AUTH_DEBUG',
          stage: 'supabase_initialization',
          message: `Unable to reach Supabase Auth endpoint: ${sbErr?.message || 'Network error'}`,
          env_status: getSafeEnvStatus(),
        }));
        return;
      }
    }

    // 4. User Profile & Local Authentication
    stage = 'user_profile';
    let user = db.getUserByEmail(trimmedEmail);

    if (!isSupabaseConfigured) {
      stage = 'authentication';
      if (!user) {
        res.statusCode = 401;
        res.end(JSON.stringify({
          success: false,
          error: 'AUTH_DEBUG',
          stage: 'authentication',
          message: 'Invalid email or password.',
          env_status: getSafeEnvStatus(),
        }));
        return;
      }

      if (user.active === false) {
        res.statusCode = 403;
        res.end(JSON.stringify({
          success: false,
          error: 'AUTH_DEBUG',
          stage: 'user_profile',
          message: 'This account has been disabled. Please contact your administrator.',
          env_status: getSafeEnvStatus(),
        }));
        return;
      }

      const cred = db.getCredentialByEmail(trimmedEmail);
      if (!cred) {
        res.statusCode = 401;
        res.end(JSON.stringify({
          success: false,
          error: 'AUTH_DEBUG',
          stage: 'authentication',
          message: 'Invalid email or password.',
          env_status: getSafeEnvStatus(),
        }));
        return;
      }

      const isValid = verifyPassword(password, cred.passwordHash, cred.salt);
      if (!isValid) {
        res.statusCode = 401;
        res.end(JSON.stringify({
          success: false,
          error: 'AUTH_DEBUG',
          stage: 'authentication',
          message: 'Invalid email or password.',
          env_status: getSafeEnvStatus(),
        }));
        return;
      }
    } else {
      // Supabase authenticated: provision/load CRM user profile
      if (!user) {
        user = {
          id: `usr_${Date.now()}`,
          name: trimmedEmail.split('@')[0].replace(/[._]/g, ' '),
          email: trimmedEmail,
          role: 'super_admin',
          title: 'System Administrator',
          department: 'Executive Leadership',
          active: true,
          createdAt: new Date().toISOString(),
        };
        db.addUser(user);
      }
    }

    if (!user) {
      res.statusCode = 401;
      res.end(JSON.stringify({
        success: false,
        error: 'AUTH_DEBUG',
        stage: 'user_profile',
        message: 'Profile record could not be loaded.',
        env_status: getSafeEnvStatus(),
      }));
      return;
    }

    // 5. Workspace Lookup
    stage = 'workspace';
    const company = db.getCompany();
    if (!company) {
      res.statusCode = 500;
      res.end(JSON.stringify({
        success: false,
        error: 'AUTH_DEBUG',
        stage: 'workspace',
        message: 'Company workspace metadata is uninitialized.',
        env_status: getSafeEnvStatus(),
      }));
      return;
    }

    // 6. RBAC Verification
    stage = 'rbac';
    if (!user.role || !ROLE_PERMISSIONS[user.role]) {
      res.statusCode = 500;
      res.end(JSON.stringify({
        success: false,
        error: 'AUTH_DEBUG',
        stage: 'rbac',
        message: `User role '${user.role}' has no valid permissions configuration.`,
        env_status: getSafeEnvStatus(),
      }));
      return;
    }

    // 7. Session Creation
    stage = 'session';
    const session = db.createSession(user.id, !!rememberMe);
    if (!session || !session.token) {
      res.statusCode = 500;
      res.end(JSON.stringify({
        success: false,
        error: 'AUTH_DEBUG',
        stage: 'session',
        message: 'Failed to generate session record.',
        env_status: getSafeEnvStatus(),
      }));
      return;
    }

    res.statusCode = 200;
    res.end(JSON.stringify({
      success: true,
      token: session.token,
      user,
      expiresAt: session.expiresAt,
      company,
    }));
  } catch (err: any) {
    console.error(`[API /auth/login] Exception at stage '${stage}':`, err?.stack || err?.message || err);
    res.statusCode = 500;
    res.end(JSON.stringify({
      success: false,
      error: 'AUTH_DEBUG',
      stage,
      message: `Server exception during ${stage}: ${err?.message || 'Unknown error'}`,
      env_status: getSafeEnvStatus(),
    }));
  }
}
