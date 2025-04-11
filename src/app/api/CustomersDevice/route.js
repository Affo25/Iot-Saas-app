// app/api/customers-device/route.js or customers-device/route.js

import { NextResponse } from 'next/server';
import { connectToMongo } from '../../mongodb_connection';
import CustomersDevice from '@/app/Models/CustomersDevice';


// ✅ CREATE Device
export async function POST(request) {
  try {
    await connectToMongo();
    const body = await request.json();
    console.log("📩 Device POST body:", body);

    const {
      title,
      device_serial_number,
      device_code,
      customer_id,
      status = "Active",
      description = ''
    } = body;

    if (!title || !device_serial_number || !device_code || !customer_id) {
      return NextResponse.json(
        { success: false, message: "Missing required fields" },
        { status: 400 }
      );
    }

    const newDevice = new CustomersDevice({
      title,
      device_serial_number,
      device_code,
      customer_id,
      status,
      description
    });

    await newDevice.save();

    return NextResponse.json(
      { success: true, message: "Device created successfully", data: newDevice },
      { status: 201 }
    );

  } catch (error) {
    console.error("❌ POST error:", error);
    return NextResponse.json(
      { success: false, message: "Internal Server Error" },
      { status: 500 }
    );
  }
}


// ✅ READ Devices
export async function GET() {
  try {
    await connectToMongo();

    const devices = await CustomersDevice.find({});
    return NextResponse.json(
      { success: true, data: devices },
      { status: 200 }
    );
  } catch (error) {
    console.error("❌ GET error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch devices" },
      { status: 500 }
    );
  }
}


// ✅ DELETE Device
export async function DELETE(request) {
  try {
    const url = new URL(request.url);
    const id = url.searchParams.get('_id');

    if (!id) {
      return NextResponse.json(
        { success: false, message: "Device ID is required" },
        { status: 400 }
      );
    }

    await connectToMongo();
    const deleted = await CustomersDevice.findByIdAndDelete(id);

    if (!deleted) {
      return NextResponse.json(
        { success: false, message: "Device not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: true, message: "Device deleted successfully", id },
      { status: 200 }
    );

  } catch (error) {
    console.error("❌ DELETE error:", error);
    return NextResponse.json(
      { success: false, message: "Internal Server Error" },
      { status: 500 }
    );
  }
}


// ✅ UPDATE Device
export async function PUT(request) {
  try {
    await connectToMongo();
    const body = await request.json();

    const {
      _id,
      title,
      device_serial_number,
      device_code,
      customer_id,
      status,
      description
    } = body;

    if (!_id || !title || !device_serial_number || !device_code || !customer_id) {
      return NextResponse.json(
        { success: false, message: "Missing required fields" },
        { status: 400 }
      );
    }

    const updatedDevice = await CustomersDevice.findByIdAndUpdate(
      _id,
      {
        title,
        device_serial_number,
        device_code,
        customer_id,
        status,
        description
      },
      { new: true }
    );

    if (!updatedDevice) {
      return NextResponse.json(
        { success: false, message: "Device not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: true, message: "Device updated successfully", data: updatedDevice },
      { status: 200 }
    );

  } catch (error) {
    console.error("❌ PUT error:", error);
    return NextResponse.json(
      { success: false, message: "Internal Server Error" },
      { status: 500 }
    );
  }
}



