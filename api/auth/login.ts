import type { IncomingMessage, ServerResponse } from 'http';
import { db } from '../../server/db';
import { verifyPassword, ROLE_PERMISSIONS } from '../../server/auth';

function getSafeEnvStatus() {
  return {
    SUPABASE_URL_PRESENT: !!process.env.SUPABASE_URL,
    SUPABASE_ANON_KEY_PRESENT: !!process.env.SUPABASE_ANON_KEY,
    SUPABASE_SERVICE_ROLE_KEY_PRESENT: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    VERCEL_PRESENT: !!process.env.VERCEL,
    NODE_ENV: process.env.NODE_ENV || 'production',
  };
}

// Helper to safely extract JSON body across Node stream or pre-parsed Vercel serverless request
async function getRequestBody(req: IncomingMessage): Promise<any> {
  const reqAny = req as any;
  if (reqAny.body) {
    if (typeof reqAny.body === 'object') return reqAny.body;
    if (typeof reqAny.body === 'string') {
      try { return JSON.parse(reqAny.body); } catch { return {}; }
    }
    if (Buffer.isBuffer(reqAny.body)) {
      try { return JSON.parse(reqAny.body.toString('utf-8')); } catch { return {}; }
    }
  }

  if (reqAny.readableEnded || reqAny.complete) {
    return {};
  }

  return new Promise((resolve) => {
    let body = '';
    const timer = setTimeout(() => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch {
        resolve({});
      }
    }, 400);

    req.on('data', (chunk: any) => {
      body += chunk;
    });
    req.on('end', () => {
      clearTimeout(timer);
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch {
        resolve({});
      }
    });
    req.on('error', () => {
      clearTimeout(timer);
      resolve({});
    });
  });
}

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  let stage = 'request_validation';
  console.log('[AUTH DEBUG] login request received');

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
    console.log('[AUTH DEBUG] environment initialized');
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
    const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey);

    // 3. Supabase Auth (if configured)
    if (isSupabaseConfigured) {
      stage = 'supabase_initialization';
      console.log('[AUTH DEBUG] Supabase client initialized');
      try {
        stage = 'supabase_auth';
        console.log('[AUTH DEBUG] authentication started (Supabase)');
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
          console.log('[AUTH DEBUG] authentication failed (Supabase credentials rejected)');
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
        console.log('[AUTH DEBUG] authentication completed (Supabase)');
      } catch (sbErr: any) {
        console.error('[AUTH DEBUG] Supabase connection error:', sbErr?.message);
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
    console.log('[AUTH DEBUG] profile lookup started');
    let user = db.getUserByEmail(trimmedEmail);

    if (!isSupabaseConfigured) {
      stage = 'authentication';
      console.log('[AUTH DEBUG] authentication started (Local CRM)');
      if (!user) {
        console.log('[AUTH DEBUG] authentication failed: user not found');
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
        console.log('[AUTH DEBUG] user inactive');
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
        console.log('[AUTH DEBUG] authentication failed: missing credentials');
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
        console.log('[AUTH DEBUG] authentication failed: password mismatch');
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
      console.log('[AUTH DEBUG] authentication completed (Local CRM)');
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
    console.log('[AUTH DEBUG] profile lookup completed');

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
    console.log('[AUTH DEBUG] workspace lookup completed');

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
    console.log('[AUTH DEBUG] rbac verification completed');

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
    console.log('[AUTH DEBUG] session creation completed');

    res.statusCode = 200;
    res.end(JSON.stringify({
      success: true,
      token: session.token,
      user,
      expiresAt: session.expiresAt,
      company,
    }));
  } catch (err: any) {
    console.error(`[AUTH DEBUG] Server exception during ${stage}:`, err?.message || err);
    res.statusCode = 500;
    res.end(JSON.stringify({
      success: false,
      error: 'AUTH_DEBUG',
      stage,
      message: 'A safe internal server error occurred. Please check function logs.',
      env_status: getSafeEnvStatus(),
    }));
  }
}
