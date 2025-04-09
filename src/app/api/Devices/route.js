import Customers from '@/app/Models/Customers';
import { NextResponse } from 'next/server';
import { connectToMongo } from "../../mongodb_connection";
import Device from '@/app/Models/Device';


// POST API to Create Device
export async function POST(request) {
  try {
    await connectToMongo();
    
    const body = await request.json();

    // Validation
    if (!body.device_name || !body.device_code || !body.description) {
      return NextResponse.json(
        { success: false, message: "Device name, code, and description are required" },
        { status: 400 }
      );
    }

    // Check if device already exists
    const existingDevice = await Device.findOne({ device_name: body.device_name });
    if (existingDevice) {
      return NextResponse.json(
        { success: false, message: "Device with this name already exists" },
        { status: 409 }
      );
    }

    const device = new Device({
      device_name: body.device_name,
      device_code: body.device_code,
      description: body.description,
      status: body.status || 'Active',
      created_at: new Date()
    });
    
    await device.save();

    return NextResponse.json(
      { 
        success: true, 
        message: "Device added successfully",
        deviceId: device._id 
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("❌ Detailed Error:", {
      message: error.message,
      stack: error.stack,  // Shows where error occurred
      fullError: error     // Complete error object
    });
    console.error("Error saving Devices:", error);
    return NextResponse.json(
      { success: false, message: "Internal Server Error" },
      { status: 500 }
    );
  }
}

// GET API to Retrieve Devices
export async function GET(request) {
  try {
    await connectToMongo();

    // Retrieve all devices
    const devices = await Device.find({});
    console.log("📌 Device Data:", devices);

    return NextResponse.json(
      { 
        success: true, 
        message: "Devices retrieved successfully",
        devices: devices
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("❌ Detailed Error:", {
      message: error.message,
      stack: error.stack,
      fullError: error
    });
    console.error("Error retrieving devices:", error);
    return NextResponse.json(
      { success: false, message: "Internal Server Error" },
      { status: 500 }
    );
  }
}


// PUT API to Update a Device


// DELETE API to Remove a Device
export async function DELETE(request) {
  try {
    // Extract the device ID from the URL
    const url = new URL(request.url);
    const deviceId = url.searchParams.get('_id');

    if (!deviceId) {
      return NextResponse.json(
        { success: false, message: "Device ID is required" },
        { status: 400 }
      );
    }

    await connectToMongo();

    // Find and delete the device by its ID
    const deletedDevice = await Device.findByIdAndDelete(deviceId);

    if (!deletedDevice) {
      return NextResponse.json(
        { success: false, message: "Device not found" },
        { status: 404 }
      );
    }

    console.log(`Device with ID ${deviceId} deleted successfully`);

    return NextResponse.json(
      {
        success: true,
        message: "Device deleted successfully",
        deviceId: deviceId,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("❌ Detailed Error:", {
      message: error.message,
      stack: error.stack,
      fullError: error
    });
    console.error("Error deleting Device:", error);
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

    // Extract the device ID and other fields
    const { _id, device_name, device_code, description, status } = body;

    // Validate the data
    if (!_id || !device_name || !device_code || !description || !status) {
      return NextResponse.json(
        { success: false, message: 'All fields are required' },
        { status: 400 }
      );
    }

    // Check if another device already has this name (excluding the current device)
    const existingDevice = await Device.findOne({
      device_name: device_name,
      _id: { $ne: _id }
    });

    if (existingDevice) {
      return NextResponse.json(
        { success: false, message: "Another device with this name already exists" },
        { status: 409 }
      );
    }

    // Prepare the updated fields
    const updatedDeviceData = {
      device_name,
      device_code,
      description,
      status
    };

    console.log("Updating device with ID:", _id);
    console.log("Update data:", updatedDeviceData);

    // Update the device's fields using findByIdAndUpdate method
    const updatedDevice = await Device.findByIdAndUpdate(
      _id,    // Find device by ID
      updatedDeviceData,  // Fields to update
      { new: true }  // Return the updated document
    );

    if (!updatedDevice) {
      console.log("Device not found with ID:", _id);
      return NextResponse.json(
        { success: false, message: 'Device not found' },
        { status: 404 }
      );
    }

    console.log("Device updated successfully:", updatedDevice);

    return NextResponse.json(
      { success: true, message: 'Device updated successfully', device: updatedDevice },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error updating Device:', error);
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
