import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const publicRoutes = [
  '/Pages/Auth/Login',
  '/Pages/Auth/CustomerLogin',
  '/api/Auth/Login',
  '/api/Auth/Register',
  '/api/Auth/Verify',
  '/api/Dashboard/Devicelog',
];

const verifyToken = async (token) => {
  const secret = new TextEncoder().encode(process.env.JWT_SECRET);
  try {
    const { payload } = await jwtVerify(token, secret);
    return payload;
  } catch (error) {
    console.error('[JWT Error] Verification failed:', error.message);
    throw error;
  }
};

export async function middleware(request) {
  const { pathname } = request.nextUrl;

  // ✅ 1. Skip public routes
  if (publicRoutes.includes(pathname)) {
    return NextResponse.next();
  }

  // ✅ 2. Extract token (cookie or header)
  let token = request.cookies.get('token')?.value;

  if (!token) {
    const authHeader = request.headers.get('authorization');
    if (authHeader?.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    }
  }

  const isApiRoute = pathname.startsWith('/api');

  // ✅ 3. No token at all
  if (!token) {
    const loginPath = pathname.includes('/CustomersDevice') || pathname.includes('/Reports')
      ? '/Pages/Auth/CustomerLogin'
      : '/Pages/Auth/Login';

    return isApiRoute
      ? new NextResponse(JSON.stringify({ error: 'Unauthorized: Token not provided' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        })
      : NextResponse.redirect(new URL(loginPath, request.url));
  }

  try {
    // ✅ 4. Verify token and expiry
    const payload = await verifyToken(token);

    if (payload.exp && payload.exp < Date.now() / 1000) {
      const loginPath = payload.role === 'Customer'
        ? '/Pages/Auth/CustomerLogin'
        : '/Pages/Auth/Login';

      return isApiRoute
        ? new NextResponse(JSON.stringify({ error: 'Unauthorized: Token expired' }), {
            status: 401,
            headers: { 'Content-Type': 'application/json' },
          })
        : NextResponse.redirect(new URL(loginPath, request.url));
    }

    const userRole = payload.role;
    const isDashboardRoute = pathname.startsWith('/Pages');

    // ✅ 5. Role-based access handling
    if (userRole === 'Customer') {
      const isCustomerPageAllowed =
        pathname === '/Pages/customersdevice' ||
        pathname === '/Pages/reports' ||
        pathname === '/Pages';

      if (!isCustomerPageAllowed && isDashboardRoute) {
        return NextResponse.redirect(new URL('/Pages/customersdevice', request.url));
      }
    }

    if (userRole === 'Admin') {
      // Allow full access to dashboard
      return NextResponse.next();
    }

    // ✅ 6. Block unknown roles accessing dashboard
    // if (isDashboardRoute) {
    //   const fallbackLogin = userRole === 'Customer'
    //     ? '/Pages/Auth/CustomerLogin'
    //     : '/Pages/Auth/Login';

    //   return NextResponse.redirect(new URL(fallbackLogin, request.url));
    // }

    // Check if the route is a protected dashboard route
    if (
      pathname === '/Pages/customersdevice' ||
      pathname === '/Pages/reports' ||
      pathname === '/Pages' ||
      pathname === '/Pages/devicelogs' ||
      pathname === '/Pages/customers' ||
      pathname === '/Pages/device'
    ) {
      return NextResponse.redirect(new URL('/Pages/customersdevice', request.url));
    }

    // ✅ 7. Allow by default if not protected
    return NextResponse.next();
  } catch (err) {
    const fallbackLogin = pathname.includes('/CustomersDevice') || pathname.includes('/Reports')
      ? '/Pages/Auth/CustomerLogin'
      : '/Pages/Auth/Login';

    return isApiRoute
      ? new NextResponse(JSON.stringify({ error: 'Unauthorized: Invalid or expired token' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        })
      : NextResponse.redirect(new URL(fallbackLogin, request.url));
  }
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
