import { NextResponse } from 'next/server';

export async function POST() {
  try {
    // Create a response
    const response = NextResponse.json({
      success: true,
      message: 'Logged out successfully',
    });

    // Clear the token cookie
    response.cookies.set('token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      sameSite: 'lax',
      maxAge: 0, // Expire immediately
    });

    return response;
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { success: false, message: 'Server error during logout' },
      { status: 500 }
    );
  }
}