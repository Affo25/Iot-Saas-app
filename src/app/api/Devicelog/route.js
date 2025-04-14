import { NextResponse } from 'next/server';
import { connectToMongo } from "../../mongodb_connection";
import DeviceLog from '@/app/Models/DeviceLog';

export async function POST(request) {
  try {
    // Connect to MongoDB
    await connectToMongo();
    
    const body = await request.json();
    console.log("📩 DeviceLog POST body:", body);

    const {
      device_code,
      humidity,
      temperature,
      meta = {},
    } = body;

    // Validate the request body
    if (!device_code) {
      return NextResponse.json(
        { success: false, message: "Device code is required" },
        { status: 400 }
      );
    }

    // Validate that meta is a valid JSON object
    let metaObject = meta;
    if (typeof meta === 'string') {
      try {
        metaObject = JSON.parse(meta);
      } catch (error) {
        return NextResponse.json(
          { success: false, message: "Meta data must be a valid JSON object" },
          { status: 400 }
        );
      }
    }

    // Create new device log
    const deviceLog = new DeviceLog({
      device_code,
      humidity: Number(humidity) || 0,
      temperature: Number(temperature) || 0,
      meta: metaObject,
      created_at: new Date()
    });

    // Save device log to the database
    await deviceLog.save();

    return NextResponse.json(
      { success: true, message: "Device log added successfully", data: deviceLog },
      { status: 201 }
    );
  } catch (error) {
    console.error("❌ POST error:", error);
    return NextResponse.json(
      { success: false, message: "Internal Server Error", error: error.message },
      { status: 500 }
    );
  }
}


// GET API to Retrieve Device Logs
export async function GET(request) {
  try {
    await connectToMongo();
    const url = new URL(request.url);
    const device_code = url.searchParams.get('device_code');
    
    let query = {};
    if (device_code) {
      query.device_code = device_code;
    }

    // Retrieve device logs with optional filtering
    const deviceLogs = await DeviceLog.find(query).sort({ created_at: -1 });
    console.log("📌 DeviceLog Data:", deviceLogs.length, "records found");

    return NextResponse.json(
      { 
        success: true, 
        message: "Device logs retrieved successfully",
        data: deviceLogs
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


// DELETE API to Remove a Device Log
export async function DELETE(request) {
  try {
    const url = new URL(request.url);
    const id = url.searchParams.get('_id');

    if (!id) {
      return NextResponse.json(
        { success: false, message: "Device log ID is required" },
        { status: 400 }
      );
    }

    await connectToMongo();

    // Find and delete the device log by ID
    const deletedDeviceLog = await DeviceLog.findByIdAndDelete(id);

    if (!deletedDeviceLog) {
      return NextResponse.json(
        { success: false, message: "Device log not found" },
        { status: 404 }
      );
    }

    console.log(`Device log with ID ${id} deleted successfully`);

    return NextResponse.json(
      {
        success: true,
        message: "Device log deleted successfully",
        id: id,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("❌ DELETE error:", error);
    return NextResponse.json(
      { success: false, message: "Internal Server Error", error: error.message },
      { status: 500 }
    );
  }
}

// PUT API to Update a Device Log
export async function PUT(request) {
  try {
    await connectToMongo();
    const body = await request.json();
    console.log("📩 DeviceLog PUT body:", body);

    const {
      _id,
      device_code,
      humidity,
      temperature,
      meta,
    } = body;

    // Validate required fields
    if (!_id) {
      return NextResponse.json(
        { success: false, message: "Device log ID is required" },
        { status: 400 }
      );
    }

    // Validate that meta is a valid JSON object if provided
    let metaObject = meta;
    if (meta && typeof meta === 'string') {
      try {
        metaObject = JSON.parse(meta);
      } catch (error) {
        return NextResponse.json(
          { success: false, message: "Meta data must be a valid JSON object" },
          { status: 400 }
        );
      }
    }

    // Build updated data
    const updateData = {
      updated_at: new Date()
    };

    if (device_code) updateData.device_code = device_code;
    if (humidity !== undefined) updateData.humidity = Number(humidity);
    if (temperature !== undefined) updateData.temperature = Number(temperature);
    if (meta !== undefined) updateData.meta = metaObject;

    console.log("Updating device log with ID:", _id);
    console.log("Update data:", updateData);

    // Update the device log
    const updatedDeviceLog = await DeviceLog.findByIdAndUpdate(
      _id,
      updateData,
      { new: true }
    );

    if (!updatedDeviceLog) {
      return NextResponse.json(
        { success: false, message: "Device log not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: true, message: "Device log updated successfully", data: updatedDeviceLog },
      { status: 200 }
    );
  } catch (error) {
    console.error("❌ PUT error:", error);
    return NextResponse.json(
      { success: false, message: "Internal Server Error", error: error.message },
      { status: 500 }
    );
  }
}
