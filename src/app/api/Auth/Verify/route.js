import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

export async function GET(request) {
  try {
    // Get token from Authorization header
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, message: 'No token provided' },
        { status: 401 }
      );
    }

    const token = authHeader.split(' ')[1];

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');

    // Return success if token is valid
    return NextResponse.json({
      success: true,
      user: {
        id: decoded.userId,
        email: decoded.email,
        role: decoded.role
      }
    });

  } catch (error) {
    console.error('Token verification error:', error);
    return NextResponse.json(
      { success: false, message: 'Invalid token' },
      { status: 401 }
    );
  }
} 