import Customers from '@/app/Models/Customers';
import { NextResponse } from 'next/server';
import { connectToMongo } from "../../mongodb_connection";


// POST API to Create Student
export async function POST(request) {
  try {
    await connectToMongo();
    
   
    const body = await request.json();

    // Validation
    if (!body.email) {
      return NextResponse.json(
        { success: false, message: "Name and Email are required" },
        { status: 400 }
      );
    }

    // Check if student already exists
    const existingStudent = await Customers.findOne({ email: body.email });
    if (existingStudent) {
      return NextResponse.json(
        { success: false, message: "Customers with this email already exists" },
        { status: 409 }
      );
    }

    const student = new Customers({
      ...body,
      userId: Math.floor(Math.random() * 1000),
      createdAt: new Date()
    });
    
    await student.save();

    return NextResponse.json(
      { 
        success: true, 
        message: "Customers added successfully",
        studentId: student.userId 
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("❌ Detailed Error:", {
      message: error.message,
      stack: error.stack,  // Shows where error occurred
      fullError: error     // Complete error object
    });
    console.error("Error saving Customers:", error);
    return NextResponse.json(
      { success: false, message: "Internal Server Error" },
      { status: 500 }
    );
  }
}

// GET API to Retrieve Customers
export async function GET(request) {
  try {
    await connectToMongo();

    // Retrieve all customers
    const customers = await Customers.find({});
    console.log("📌 Students Data:", customers);

    return NextResponse.json(
      { 
        success: true, 
        message: "Customers retrieved successfully",
        customers: customers
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("❌ Detailed Error:", {
      message: error.message,
      stack: error.stack,
      fullError: error
    });
    console.error("Error retrieving customers:", error);
    return NextResponse.json(
      { success: false, message: "Internal Server Error" },
      { status: 500 }
    );
  }
}


// PUT API to Update a Customer


// DELETE API to Remove a Customer
export async function DELETE(request) {
  try {
    // Extract the customer ID from the URL
    const url = new URL(request.url);
    const customerId = url.searchParams.get('_id');

    if (!customerId) {
      return NextResponse.json(
        { success: false, message: "Customer ID is required" },
        { status: 400 }
      );
    }

    await connectToMongo();

    // Find and delete the customer by their ID
    const deletedCustomer = await Customers.findByIdAndDelete(customerId);

    if (!deletedCustomer) {
      return NextResponse.json(
        { success: false, message: "Customer not found" },
        { status: 404 }
      );
    }

    console.log(`Customer with ID ${customerId} deleted successfully`);

    return NextResponse.json(
      {
        success: true,
        message: "Customer deleted successfully",
        customerId: customerId,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("❌ Detailed Error:", {
      message: error.message,
      stack: error.stack,
      fullError: error
    });
    console.error("Error deleting customer:", error);
    return NextResponse.json(
      { success: false, message: "Internal Server Error" },
      { status: 500 }
    );
  }
}



export async function PUT(request) {
  try {
    await connectToMongo(); // Make sure MongoDB is connected

    // Get the data from the request body
    const body = await request.json();
    console.log("Received update request with body:", body);

    // Extract the customer ID and other fields
    const { _id, full_name, email, contact, package_name, package_expiry, status } = body;

    // Validate the data
    if (!_id || !full_name || !email || !contact || !package_name || !package_expiry || !status) {
      return NextResponse.json(
        { success: false, message: 'All fields are required' },
        { status: 400 }
      );
    }

    // Check if another customer already has this email (excluding the current customer)
    const existingCustomer = await Customers.findOne({
      email: email,
      _id: { $ne: _id }
    });

    if (existingCustomer) {
      return NextResponse.json(
        { success: false, message: "Another customer with this email already exists" },
        { status: 409 }
      );
    }

    // Prepare the updated fields
    const updatedCustomerData = {
      full_name,
      email,
      contact,
      package_name,
      package_expiry: new Date(package_expiry), // Convert to Date if it's a string
      status,
      updatedAt: new Date()
    };

    console.log("Updating customer with ID:", _id);
    console.log("Update data:", updatedCustomerData);

    // Update the customer's fields using findByIdAndUpdate method
    const updatedCustomer = await Customers.findByIdAndUpdate(
      _id,    // Find customer by ID
      updatedCustomerData,  // Fields to update
      { new: true }  // Return the updated document
    );

    if (!updatedCustomer) {
      console.log("Customer not found with ID:", _id);
      return NextResponse.json(
        { success: false, message: 'Customer not found' },
        { status: 404 }
      );
    }

    console.log("Customer updated successfully:", updatedCustomer);

    return NextResponse.json(
      { success: true, message: 'Customer updated successfully', customer: updatedCustomer },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error updating customer:', error);
    console.error("❌ Detailed Error:", {
      message: error.message,
      stack: error.stack,
      fullError: error
    });
    return NextResponse.json(
      { success: false, message: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
