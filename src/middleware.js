import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const publicRoutes = [
  '/Auth/Login',
  '/Dashboard',
  '/api/Auth/Login',
  '/api/Auth/Register',
  '/api/Auth/Verify',
];

const verifyToken = async (token) => {
  if (!process.env.JWT_SECRET) {
    const err = new Error("JWT secret is not configured");
    console.log("[JWT Error] Configuration:", err.message); // Log error
    throw err; // Still throw it
  }

  const secret = new TextEncoder().encode(process.env.JWT_SECRET);

  try {
    const { payload } = await jwtVerify(token, secret);
    return payload;
  } catch (error) {
    // Log the full error for debugging
    console.log("[JWT Error] Verification failed:", error.message);

    // More specific error handling
    if (error.code === 'ERR_JWT_EXPIRED') {
      const err = new Error("Token has expired");
      console.log("[JWT Error] Expired token"); // Specific log
      throw err;
    } else if (error.code === 'ERR_JWS_INVALID') {
      const err = new Error("Invalid token signature");
      console.log("[JWT Error] Invalid signature"); // Specific log
      throw err;
    }

    const err = new Error("Token verification failed");
    console.log("[JWT Error] General failure:", error.message); // Fallback log
    throw err;
  }
};

export async function middleware(request) {
  const { pathname } = request.nextUrl;

  // Allow access to public routes
  if (publicRoutes.includes(pathname)) {
    return NextResponse.next();
  }

  // Get token from cookies
  const token = request.cookies.get('token')?.value;
  console.log("middleware Cookie get token",token);

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

// Middleware only runs on these routes
export const config = {
  matcher: [
    '/api/',
    '/Dashboard/:path*',
  ],
};
