import crypto from 'crypto';
import { Role, User } from '../src/types/crm';

export interface UserCredential {
  userId: string;
  email: string;
  passwordHash: string;
  salt: string;
  resetToken?: string;
  resetTokenExpires?: string;
}

export interface SessionRecord {
  token: string;
  userId: string;
  createdAt: string;
  expiresAt: string;
  rememberMe: boolean;
}

/**
 * Standard, secure PBKDF2 with SHA-512, 100,000 iterations and 64-byte key length.
 * Zero plain-text passwords stored.
 */
export function hashPassword(password: string, customSalt?: string): { hash: string; salt: string } {
  const salt = customSalt || crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
  return { hash, salt };
}

/**
 * Timing-safe comparison to prevent timing attacks
 */
export function verifyPassword(password: string, hash: string, salt: string): boolean {
  try {
    const verifyHash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
    const storedBuffer = Buffer.from(hash, 'hex');
    const verifyBuffer = Buffer.from(verifyHash, 'hex');
    if (storedBuffer.length !== verifyBuffer.length) return false;
    return crypto.timingSafeEqual(storedBuffer, verifyBuffer);
  } catch (err) {
    return false;
  }
}

/**
 * Generate a cryptographically secure 256-bit random session token
 */
export function generateSessionToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Generate a secure 192-bit password reset token
 */
export function generateResetToken(): string {
  return crypto.randomBytes(24).toString('hex');
}

/**
 * RBAC Role Permissions Map
 */
export const ROLE_PERMISSIONS: Record<Role, {
  modules: string[];
  canManageUsers: boolean;
  canManageSettings: boolean;
  canManageFinancials: boolean;
  canModifyPipeline: boolean;
}> = {
  super_admin: {
    modules: ['dashboard', 'leads', 'customers', 'deals', 'pipeline', 'tasks', 'followups', 'calendar', 'appointments', 'products', 'invoices', 'payments', 'communications', 'documents', 'reports', 'team', 'ai_assistant', 'settings'],
    canManageUsers: true,
    canManageSettings: true,
    canManageFinancials: true,
    canModifyPipeline: true,
  },
  admin: {
    modules: ['dashboard', 'leads', 'customers', 'deals', 'pipeline', 'tasks', 'followups', 'calendar', 'appointments', 'products', 'invoices', 'payments', 'communications', 'documents', 'reports', 'team', 'ai_assistant', 'settings'],
    canManageUsers: true,
    canManageSettings: true,
    canManageFinancials: true,
    canModifyPipeline: true,
  },
  manager: {
    modules: ['dashboard', 'leads', 'customers', 'deals', 'pipeline', 'tasks', 'followups', 'calendar', 'appointments', 'products', 'invoices', 'payments', 'communications', 'documents', 'reports', 'team', 'ai_assistant'],
    canManageUsers: false,
    canManageSettings: false,
    canManageFinancials: false, // view only
    canModifyPipeline: true,
  },
  sales_executive: {
    modules: ['dashboard', 'leads', 'customers', 'deals', 'pipeline', 'tasks', 'followups', 'calendar', 'appointments', 'products', 'communications', 'documents', 'ai_assistant'],
    canManageUsers: false,
    canManageSettings: false,
    canManageFinancials: false,
    canModifyPipeline: true,
  },
  support_agent: {
    modules: ['dashboard', 'customers', 'tasks', 'appointments', 'communications', 'documents', 'ai_assistant'],
    canManageUsers: false,
    canManageSettings: false,
    canManageFinancials: false,
    canModifyPipeline: false,
  },
  accountant: {
    modules: ['dashboard', 'products', 'invoices', 'payments', 'reports', 'documents', 'customers'],
    canManageUsers: false,
    canManageSettings: false,
    canManageFinancials: true,
    canModifyPipeline: false,
  },
};
