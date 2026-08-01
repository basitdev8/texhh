import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

const JWT_SECRET = process.env.JWT_SECRET;
const TOKEN_NAME = 'techchasers_token';
const TOKEN_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

// Fail fast on a missing or well-known placeholder secret. If this string
// ever reached production, anyone could forge an admin JWT and take over.
const WEAK_SECRETS = [
  'techhh-super-secret-jwt-key-2024-change-in-production',
  'techchasers-super-secret-jwt-key-2024-change-in-production',
  'your-secret-key',
  'secret',
];

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET is not set. Define a strong random value in the environment.');
}
if (JWT_SECRET.length < 32 || WEAK_SECRETS.includes(JWT_SECRET)) {
  const msg =
    'JWT_SECRET is weak or a known default. Set a strong random value (e.g. `openssl rand -base64 48`).';
  if (process.env.NODE_ENV === 'production') {
    throw new Error(msg);
  } else {
    console.warn(`⚠️  ${msg}`);
  }
}

export interface JWTPayload {
  userId: string;
  email: string;
  role: 'admin' | 'customer';
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

// Narrowed to `string` — the guards above throw/warn if it's unusable.
const SECRET: string = JWT_SECRET;

export function createToken(payload: JWTPayload): string {
  return jwt.sign(payload, SECRET, { expiresIn: TOKEN_MAX_AGE });
}

export function verifyToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, SECRET) as unknown as JWTPayload;
  } catch {
    return null;
  }
}

export async function getSession(): Promise<JWTPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(TOKEN_NAME)?.value;

  if (!token) return null;

  return verifyToken(token);
}

export function getTokenFromRequest(request: Request): string | null {
  const cookieHeader = request.headers.get('cookie');
  if (!cookieHeader) return null;

  const cookies = cookieHeader.split(';').map(c => c.trim());
  const tokenCookie = cookies.find(c => c.startsWith(`${TOKEN_NAME}=`));
  if (!tokenCookie) return null;

  return tokenCookie.split('=')[1];
}

// `Secure` in production so the session cookie is never sent over plain HTTP.
const SECURE_FLAG = process.env.NODE_ENV === 'production' ? ' Secure;' : '';

export function createTokenCookie(token: string): string {
  return `${TOKEN_NAME}=${token}; Path=/; HttpOnly;${SECURE_FLAG} SameSite=Lax; Max-Age=${TOKEN_MAX_AGE}`;
}

export function clearTokenCookie(): string {
  return `${TOKEN_NAME}=; Path=/; HttpOnly;${SECURE_FLAG} SameSite=Lax; Max-Age=0`;
}
