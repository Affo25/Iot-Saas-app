import { NextResponse } from 'next/server';

const publicRoutes = [
  '/Auth/Login',
  '/Dashboard',
  '/api/Auth/Login',
  '/api/Auth/Register',
  '/api/Auth/Verify',
  "/api/Customer",
  "/api/systemUsers",
  '/api/Device',
  '/api/CustomersDevice',
  '/api/DeviceLogs'
];

const verifyToken = async (token) => {
  const secret = new TextEncoder().encode(process.env.JWT_SECRET);
  return await jwtVerify(token, secret);
};

export async function middleware(request) {
  const { pathname } = request.nextUrl;

  // Allow access to public routes
  if (publicRoutes.includes(pathname)) {
    return NextResponse.next();
  }

  // Get token from cookies
  const token = request.cookies.get('token')?.value;

  if (!token) {
    return NextResponse.redirect(new URL('/Auth/Login', request.url));
  }

  try {
    await verifyToken(token);
    return NextResponse.next();
  } catch (err) {
    return NextResponse.redirect(new URL('/Auth/Login', request.url));
  }
}

export const config = {
  matcher: ['/api/:path*', '/api/Customer/:path*', "/api/CustomersDevice/:path*", "/Dashboard/:path*"]
};
