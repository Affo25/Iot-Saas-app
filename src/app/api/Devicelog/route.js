import { NextResponse } from 'next/server';
import { connectToMongo } from "../../mongodb_connection";
import DeviceLog from '@/app/Models/DeviceLog';


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
    const existingCustomer = await DeviceLog.findOne({ email: body.email });
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
    const customer = new DeviceLog({
      device_code: body.device_code,
      humidity: body.humidity,
      temperature: body.temperature,
      meta: body.meta,
      created_at: new Date()
    });

    // Save customer to the database
    await customer.save();

    return NextResponse.json(
      { success: true, message: "Degvice log added successfully", customerId: customer._id },
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
    const customers = await DeviceLog.find({});
    console.log("📌 DeviceLog Data:", customers);

    return NextResponse.json(
      { 
        success: true, 
        message: "DeviceLog retrieved successfully",
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
    console.error("Error retrieving DeviceLog:", error);
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
        { success: false, message: "DeviceLog ID is required" },
        { status: 400 }
      );
    }

    await connectToMongo();

    // Find and delete the customer by their ID
    const deletedCustomer = await DeviceLog.findByIdAndDelete(customerId);

    if (!deletedCustomer) {
      return NextResponse.json(
        { success: false, message: "DeviceLog not found" },
        { status: 404 }
      );
    }

    console.log(`DeviceLog with ID ${customerId} deleted successfully`);

    return NextResponse.json(
      {
        success: true,
        message: "DeviceLog deleted successfully",
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
      device_code,
      humidity,
      temperature,
      meta,
    } = body;


    // ✅ Validate required fields
    if (!_id ||!humidity || device_code ||!temperature ||!meta) {
      return NextResponse.json(
        { success: false, message: 'All required fields must be provided' },
        { status: 400 }
      );
    }

    // ✅ Check for existing customer (excluding the current one)
    const existingCustomer = await DeviceLog.findOne({
      _id: { $ne: _id }
    });

    if (existingCustomer) {
      return NextResponse.json(
        { success: false, message: "Another Device log with this id already exists" },
        { status: 409 }
      );
    }

    // ✅ Build updated data
    const updatedCustomerData = {
      device_code,
      humidity,
      temperature,
      meta,
      updatedAt: new Date()
    };

    console.log("Updating device log with ID:", _id);
    console.log("Update data:", updatedCustomerData);

    // ✅ Update the customer
    const updatedCustomer = await DeviceLog.findByIdAndUpdate(
      _id,
      updatedCustomerData,
      { new: true }
    );

    if (!updatedCustomer) {
      return NextResponse.json(
        { success: false, message: 'Device Log not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: true, message: 'Device Log updated successfully', customer: updatedCustomer },
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
