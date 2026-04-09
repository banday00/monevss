import { auth } from '@/lib/auth/config';
import { NextResponse } from 'next/server';

export default auth((req) => {
  const isLoggedIn  = !!req.auth;
  const { pathname } = req.nextUrl;

  const isLoginPage  = pathname === '/login';
  const isApiRoute   = pathname.startsWith('/api/');
  const isStaticFile = pathname.startsWith('/_next/') || pathname === '/favicon.ico';

  // Biarkan static files & API routes lewat
  if (isStaticFile || isApiRoute) return NextResponse.next();

  // ── Jika sudah login tapi akses /login → redirect ke beranda ──────
  if (isLoggedIn && isLoginPage) {
    return NextResponse.redirect(new URL('/', req.url));
  }

  // ── Jika belum login dan bukan di /login → redirect ke login ──────
  if (!isLoggedIn && !isLoginPage) {
    const loginUrl = new URL('/login', req.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
});

// Terapkan middleware ke semua route kecuali static Next.js & favicon
export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
