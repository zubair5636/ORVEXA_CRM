import type { IncomingMessage, ServerResponse } from 'http';
import { db } from '../../server/db';
import { getSafeEnvStatus } from '../../server/routes';

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') {
    res.statusCode = 200;
    res.end(JSON.stringify({ status: 'ok' }));
    return;
  }

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

  const user = db.getUserById(session.userId);
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
}
