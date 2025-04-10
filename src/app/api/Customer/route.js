import Customers from '@/app/Models/Customers';
import { NextResponse } from 'next/server';
import { connectToMongo } from "../../mongodb_connection";


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
    const existingCustomer = await Customers.findOne({ email: body.email });
    if (existingCustomer) {
      return NextResponse.json(
        { success: false, message: "Customer with this email already exists" },
        { status: 409 }
      );
    }

    // Ensure devices is always an array
    let devicesList = [];
    
    // Handle different formats of devices data
    if (Array.isArray(body.devices)) {
      devicesList = body.devices; // Use devices as is if it's already an array
    } else if (typeof body.devices === 'string' && body.devices.trim() !== "") {
      // If it's a string, just use it as a single device
      devicesList = [body.devices];
    }

    // Add new field to the customer (newField can be any field)
    const newFieldValue = body.newField || 'default value'; // Set a default value if not provided

    // Log devices list to verify
    console.log("Devices List:", devicesList);
    console.log("Devices List Type:", typeof devicesList);
    console.log("Is Devices List Array:", Array.isArray(devicesList));
    console.log("Devices List Length:", devicesList.length);

    // Create new customer with the new field
    const customer = new Customers({
      full_name: body.full_name,
      email: body.email,
      contact: body.contact,
      package_name: body.package_name,
      package_expiry: body.package_expiry,
      status: body.status,
      password: body.password,
      devices: devicesList,
      newField: newFieldValue,  // Add the new field here
      created_at: new Date()
    });

    // Save customer to the database
    await customer.save();

    return NextResponse.json(
      { success: true, message: "Customer added successfully", customerId: customer._id },
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


// GET API to Retrieve Customers
export async function GET(request) {
  try {
    await connectToMongo();

    // Retrieve all customers with populated devices
    const customers = await Customers.find({});
    console.log("📌 Customers Data:", customers);

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

// PUT API to Update a Customer
export async function PUT(request) {
  try {
    await connectToMongo(); // Ensure MongoDB is connected

    const body = await request.json();
    console.log("Received update request with body:", body);
    console.log("Received rry list request with body:", body.devicesList);

    const {
      _id,
      full_name,
      email,
      contact,
      package_name,
      package_expiry,
      status,
      password,
      devices,
    } = body;


    // ✅ Validate required fields
    if (
      !_id ||
      !full_name ||
      !email ||
      !contact ||
      !package_name ||
      !package_expiry || !password || !devices ||
      !status
    ) {
      return NextResponse.json(
        { success: false, message: 'All required fields must be provided' },
        { status: 400 }
      );
    }

    // ✅ Check for existing customer (excluding the current one)
    const existingCustomer = await Customers.findOne({
      email,
      _id: { $ne: _id }
    });

    if (existingCustomer) {
      return NextResponse.json(
        { success: false, message: "Another customer with this email already exists" },
        { status: 409 }
      );
    }

    // ✅ Build updated data
    const updatedCustomerData = {
      full_name,
      email,
      contact,
      package_name,
      package_expiry: new Date(package_expiry),
      status,
      password,
      devices,
      updatedAt: new Date()
    };

    console.log("Updating customer with ID:", _id);
    console.log("Update data:", updatedCustomerData);

    // ✅ Update the customer
    const updatedCustomer = await Customers.findByIdAndUpdate(
      _id,
      updatedCustomerData,
      { new: true }
    );

    if (!updatedCustomer) {
      return NextResponse.json(
        { success: false, message: 'Customer not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: true, message: 'Customer updated successfully', customer: updatedCustomer },
      { status: 200 }
    );
  } catch (error) {
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
