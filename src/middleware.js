import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const publicRoutes = [
  '/Pages/Auth/Login',
  '/Pages/Auth/CustomerLogin',
  '/api/Auth/Login',
  '/api/Auth/Register',
  '/api/Auth/Verify',
  '/api/Dashboard/Devicelog',
  '/api/Devicelog',
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

  // ✅ Allow public routes
  if (publicRoutes.includes(pathname)) {
    return NextResponse.next();
  }

  // ✅ Try to get token from cookies or header
  let token = request.cookies.get('token')?.value;
  if (!token) {
    const authHeader = request.headers.get('authorization');
    if (authHeader?.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    }
  }

  const isApiRoute = pathname.startsWith('/api');

  // 🔒 No token provided
  if (!token) {
    const loginPath = pathname.includes('customersdevice') || pathname.includes('reports')
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

    // ✅ Role-based access
    if (userRole === 'Customer') {
      const customerAllowedRoutes = [
        '/Pages/customersdevice',
        '/Pages/devicelogs',
        '/Pages/reports/temperature-humidity',
        '/Pages/reports/device-performance', 
        '/Pages/reports/activity-logs',
      ];

      const isAllowed = customerAllowedRoutes.some(route => pathname.startsWith(route));
      if (!isAllowed && isDashboardRoute) {
        return NextResponse.redirect(new URL('/Pages/customersdevice', request.url));
      }
    }

    if (userRole === 'Admin') {
      return NextResponse.next(); // Allow all routes
    }

    // 🔐 Unknown role - restrict dashboard access
    // if (isDashboardRoute) {
    //   const fallbackLogin = '/Pages/Auth/Login';
    //   return NextResponse.redirect(new URL(fallbackLogin, request.url));
    // }

    return NextResponse.next();
  } catch (err) {
    // const fallbackLogin = pathname.includes('customersdevice') || pathname.includes('reports')
    //   ? '/Pages/Auth/CustomerLogin'
    //   : '/Pages/Auth/Login';

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
