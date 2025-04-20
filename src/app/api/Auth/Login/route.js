import { NextResponse } from 'next/server';
import { connectToMongo } from '../../../lib/mongodb_connection';
import jwt from 'jsonwebtoken';
import Customers from '../../../Models/Customers';
import bcrypt from 'bcryptjs';
import systemUsers from '../../../Models/systemUsers';

export async function POST(request) {
  try {
    const dbInstance = await connectToMongo();


    const body = await request.json();

    if (!body.email || !body.password || !body.userRole) {
      return NextResponse.json(
        { success: false, message: 'Email and password are required or select user role' },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(body.email)) {
      return NextResponse.json(
        { success: false, message: 'Invalid email format' },
        { status: 400 }
      );
    }

    if (body.password.length < 6) {
      return NextResponse.json(
        { success: false, message: 'Password must be at least 6 characters' },
        { status: 400 }
      );
    }

    const { email, password,userRole } = body;
    console.log("body data",body);

    
   
    // ✅ Check if systemUsers collection exists
    const db = dbInstance.connection.db; // now it's safe
    const collections = await db.listCollections().toArray();
    const collectionNames = collections.map((col) => col.name.toLowerCase());

    if (!collectionNames.includes('systemusers')) {
      return NextResponse.json(
        { success: false, message: 'systemUsers collection does not exist' },
        { status: 404 }
      );
    }

    const customer = await systemUsers.findOne({ email});
   

    if (!customer) {
      return NextResponse.json(
        { success: false, message: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Uncomment this in production
    // const isPasswordValid = await bcrypt.compare(password, customer.password);
    // if (!isPasswordValid) {
    //   return NextResponse.json(
    //     { success: false, message: 'Incorrect password' },
    //     { status: 401 }
    //   );
    // }

    const token = jwt.sign(
      {
        userId: customer._id.toString(),
        email: customer.email,
        role: customer.userRole,
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '1d' }
    );

    const customerObj = customer.toObject();
    const { password: _, ...customerWithoutPassword } = customerObj;

    const response = NextResponse.json({
      success: true,
      message: 'Login successful',
      user: customerWithoutPassword,
    });

    // Set the token as an HttpOnly cookie
    response.cookies.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24, // 1 day
    });
     console.log(response);
    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { success: false, message: 'Server error during login' },
      { status: 500 }
    );
  }
}
