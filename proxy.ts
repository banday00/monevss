import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Biarkan static files, API auth, dan favicon lewat tanpa cek
  if (
    pathname.startsWith('/api/auth') ||
    pathname.startsWith('/_next/') ||
    pathname === '/favicon.ico' ||
    pathname === '/logo_kota_bogor.png'
  ) {
    return NextResponse.next();
  }

  // Cek session cookie (NextAuth v5)
  const sessionToken =
    request.cookies.get('authjs.session-token') ||
    request.cookies.get('__Secure-authjs.session-token');

  const isLoggedIn  = !!sessionToken;
  const isLoginPage = pathname === '/login';

  // Sudah login tapi akses /login → redirect ke beranda
  if (isLoggedIn && isLoginPage) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // Belum login dan bukan di /login → redirect ke login
  if (!isLoggedIn && !isLoginPage) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|logo_kota_bogor.png).*)'],
};
