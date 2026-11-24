import crypto from 'node:crypto';
import type { FastifyReply, FastifyRequest } from 'fastify';
import { getPool } from '../db/pool.js';
import { getEnv } from '../config/env.js';

export const SESSION_COOKIE_NAME = 'npnu_session';
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export interface AuthenticatedUser {
  id: string;
  email: string;
  fullName: string;
  role: 'student' | 'reviewer' | 'admin';
}

declare module 'fastify' {
  interface FastifyRequest {
    authUser: AuthenticatedUser | null;
    sessionId: string | null;
  }
}

export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.randomBytes(16).toString('hex');
  const derived = await new Promise<Buffer>((resolve, reject) => {
    crypto.scrypt(password, salt, 64, (err, buf) => (err ? reject(err) : resolve(buf)));
  });
  return `scrypt$${salt}$${derived.toString('hex')}`;
}

export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  const parts = storedHash.split('$');
  if (parts.length !== 3 || parts[0] !== 'scrypt') return false;
  const [, salt, hex] = parts;
  if (!salt || !hex) return false;
  const expected = Buffer.from(hex, 'hex');
  const derived = await new Promise<Buffer>((resolve, reject) => {
    crypto.scrypt(password, salt, 64, (err, buf) => (err ? reject(err) : resolve(buf)));
  });
  if (expected.length !== derived.length) return false;
  return crypto.timingSafeEqual(expected, derived);
}

export function hashSessionToken(rawToken: string): string {
  const env = getEnv();
  return crypto.createHmac('sha256', env.SESSION_SECRET).update(rawToken).digest('hex');
}

export async function createSession(
  userId: string,
  ipAddress: string | undefined,
  userAgent: string | undefined
): Promise<{ rawToken: string; expiresAt: Date }> {
  const rawToken = crypto.randomBytes(32).toString('base64url');
  const tokenHash = hashSessionToken(rawToken);
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);

  await getPool().query(
    `INSERT INTO user_sessions (user_id, token_hash, expires_at, ip_address, user_agent)
     VALUES ($1, $2, $3, $4, $5)`,
    [userId, tokenHash, expiresAt.toISOString(), ipAddress ?? null, userAgent?.slice(0, 300) ?? null]
  );

  return { rawToken, expiresAt };
}

export function setSessionCookie(reply: FastifyReply, rawToken: string, expiresAt: Date): void {
  const env = getEnv();
  reply.setCookie(SESSION_COOKIE_NAME, rawToken, {
    path: '/',
    httpOnly: true,
    sameSite: 'lax',
    secure: env.COOKIE_SECURE || env.NODE_ENV === 'production',
    expires: expiresAt,
  });
}

export function clearSessionCookie(reply: FastifyReply): void {
  reply.clearCookie(SESSION_COOKIE_NAME, { path: '/' });
}

export async function attachAuthUser(request: FastifyRequest): Promise<void> {
  request.authUser = null;
  request.sessionId = null;

  const bearer = request.headers.authorization?.startsWith('Bearer ')
    ? request.headers.authorization.slice(7).trim()
    : null;
  const cookieToken = request.cookies[SESSION_COOKIE_NAME] ?? null;
  const rawToken = cookieToken || bearer;
  if (!rawToken) return;

  const tokenHash = hashSessionToken(rawToken);
  const res = await getPool().query<{
    session_id: string;
    id: string;
    email: string;
    full_name: string;
    role: 'student' | 'reviewer' | 'admin';
    is_active: boolean;
  }>(
    `SELECT s.id AS session_id, u.id, u.email, u.full_name, u.role, u.is_active
     FROM user_sessions s
     JOIN users u ON u.id = s.user_id
     WHERE s.token_hash = $1 AND s.expires_at > NOW()`,
    [tokenHash]
  );

  const row = res.rows[0];
  if (!row || !row.is_active) return;

  request.sessionId = row.session_id;
  request.authUser = {
    id: row.id,
    email: row.email,
    fullName: row.full_name,
    role: row.role,
  };
}

export async function requireAuth(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  if (!request.authUser) {
    return reply.code(401).send({ error: 'UNAUTHORIZED', message: 'Authentication is required.' });
  }
}

export function requireRole(roles: Array<'student' | 'reviewer' | 'admin'>) {
  return async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    if (!request.authUser) {
      return reply.code(401).send({ error: 'UNAUTHORIZED', message: 'Authentication is required.' });
    }
    if (!roles.includes(request.authUser.role)) {
      return reply.code(403).send({ error: 'FORBIDDEN', message: 'Insufficient role permissions.' });
    }
  };
}
