import { NextResponse } from 'next/server';
import connectToMongo from '../../../../lib/mongodb_connection';
import systemUsers from '../../../../Models/systemUsers';
import { validateApiKey } from '../../../../lib/mongodb';

export async function GET(request) {
  if (!validateApiKey(request)) {
    return NextResponse.json(
      { success: false, message: 'Unauthorized: Invalid API key' },
      { status: 401 }
    );
  }

  try {
    await connectToMongo();
    
    // Get all customer users (userRole = 'Customer')
    const customerUsers = await systemUsers.find({ 
      userRole: 'Customer' 
    }).select('-password').sort({ created_at: -1 });
    
    console.log("📌 Customer Users Data:", customerUsers.length, "customers found");

    return NextResponse.json(
      {
        success: true,
        message: "Customer users retrieved successfully",
        data: customerUsers
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("❌ GET error:", error);
    return NextResponse.json(
      { success: false, message: "Internal Server Error", error: error.message },
      { status: 500 }
    );
  }
} 