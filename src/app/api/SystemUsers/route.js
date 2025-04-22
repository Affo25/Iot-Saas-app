
import { NextResponse } from 'next/server';
import  connectToMongo  from "../../lib/mongodb_connection";
import systemUsers from '../../Models/systemUsers';


export async function POST(request) {
    try {
      // Connect to MongoDB
      await connectToMongo();
      
      const body = await request.json();
      console.log("Received create request with body:", body);
  
      // Validate the request body
      if (!body.email) {
        return NextResponse.json(
          { success: false, message: "Email is required" },
          { status: 400 }
        );
      }
  
      // Check if the customer already exists by email
      const existingCustomer = await systemUsers.findOne({ email: body.email });
      if (existingCustomer) {
        return NextResponse.json(
          { success: false, message: "User with this email already exists" },
          { status: 409 }
        );
      }
  
  
      // Create new customer with the new field
      const customer = new systemUsers({
        email: body.email,
        password: body.password,
        userRole: body.userRole,
        created_at: new Date()
      });
  
      // Save customer to the database
      await customer.save();
  
      return NextResponse.json(
        { success: true, message: "New User added successfully", userRole: customer.userRole },
        { status: 201 }
      );
    } catch (error) {
      console.error("❌ Detailed Error:", {
        message: error.message,
        stack: error.stack,
        fullError: error
      });
  
      return NextResponse.json(
        { success: false, message: "Internal Server Error" },
        { status: 500 }
      );
    }
  }
  
  