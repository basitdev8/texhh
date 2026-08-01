import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const TOKEN_NAME = 'techchasers_token';

const secretKey = process.env.JWT_SECRET
  ? new TextEncoder().encode(process.env.JWT_SECRET)
  : null;

interface TokenClaims {
  userId?: string;
  role?: 'admin' | 'customer';
}

// Verify the JWT signature at the edge (jose works in the edge runtime;
// jsonwebtoken does not). Returns the claims only if the signature is valid.
async function getVerifiedClaims(token: string): Promise<TokenClaims | null> {
  if (!secretKey) return null;
  try {
    const { payload } = await jwtVerify(token, secretKey);
    return payload as TokenClaims;
  } catch {
    return null;
  }
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(TOKEN_NAME)?.value;

  const loginRedirect = () => {
    const loginUrl = new URL('/auth/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  };

  // Protect admin routes — require a valid signature AND the admin role.
  if (pathname.startsWith('/admin')) {
    if (!token) return loginRedirect();
    const claims = await getVerifiedClaims(token);
    if (!claims) return loginRedirect();
    if (claims.role !== 'admin') {
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  // Protect account routes — require a valid signature.
  if (pathname.startsWith('/account')) {
    if (!token) return loginRedirect();
    const claims = await getVerifiedClaims(token);
    if (!claims) return loginRedirect();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/account/:path*'],
};
