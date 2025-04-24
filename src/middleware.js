import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const publicRoutes = [
  '/Auth/Login',
  '/Dashboard',
  '/api/Auth/Login',
  '/api/Auth/Register',
  '/api/Auth/Verify',
  '/api/Devicelog'
];

const verifyToken = async (token) => {
  const secret = new TextEncoder().encode(process.env.JWT_SECRET);

  try {
    const { payload } = await jwtVerify(token, secret);
    return payload;
  } catch (error) {
    console.error("[JWT Error] Verification failed:", error.message);
    throw error;
  }
};

export async function middleware(request) {
  const { pathname } = request.nextUrl;

  // ✅ Allow public routes without auth
  if (publicRoutes.includes(pathname)) {
    return NextResponse.next();
  }

  // ✅ Try getting token from cookie
  let token = request.cookies.get('token')?.value;

  // ✅ Fallback: Try from Authorization header
  if (!token) {
    const authHeader = request.headers.get('authorization');
    if (authHeader?.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    }
  }

  console.log('🔒 JWT Token:', token || 'Not found');

  const isApiRoute = pathname.startsWith('/api');

  // 🔒 If token missing
  if (!token) {
    if (isApiRoute) {
      return new NextResponse(
        JSON.stringify({ error: 'Unauthorized: Token not provided' }),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    } else {
      return NextResponse.redirect(new URL('/Auth/Login', request.url));
    }
  }

  // 🔐 If token exists, verify
  try {
    await verifyToken(token);
    return NextResponse.next();
  } catch (err) {
    if (isApiRoute) {
      return new NextResponse(
        JSON.stringify({ error: 'Unauthorized: Invalid or expired token' }),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    } else {
      return NextResponse.redirect(new URL('/Auth/Login', request.url));
    }
  }
}

export const config = {
  matcher: ['/api/:path*', '/Dashboard/:path*'],
};
