import { NextResponse } from 'next/server';
import  connectToMongo  from "../../../lib/mongodb_connection";
import CustomersDevice from '../../../Models/CustomersDevice';
const { Int32 } = require('bson');


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
      status = 0,
      description = '',
      warning_points = '',
      last_updated,
      m1 = '',
      m2 = '',
      inp1 = '',
      inp2 = '',
      inp3 = '',
      inp4 = '',
      outp1 = '',
      outp2 = '',
      outp3 = '',
      outp4 = '',
    } = body;

    if (!title || !device_serial_number || !device_code) {
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
      status : new Int32(parseInt(body.status)),
      description,
      warning_points,
      last_updated: last_updated ? new Date(last_updated) : new Date(),
      m1,
      m2,
      inp1,
      inp2,
      inp3,
      inp4,
      outp1,
      outp2,
      outp3,
      outp4,
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
export async function GET(req) {
  try {
    await connectToMongo();

    // Extract `id` from query params
    const { searchParams } = new URL(req.url);
    const customerId = searchParams.get('_id');

    if (!customerId) {
      return NextResponse.json(
        { success: false, message: "Customer ID is required" },
        { status: 400 }
      );
    }

    let devices;
    
    if (customerId) {
      // If customerId is provided, filter by customer
      console.log("📌 Fetching devices for customer:", customerId);
      devices = await CustomersDevice.find({ customer_id: customerId });
    } else {
      // If no customerId, fetch all devices
      console.log("📌 Fetching all customer devices");
      devices = await CustomersDevice.find({});
    }

    return NextResponse.json(
      { success: true, data: devices },
      { status: 200 }
    );
  } catch (error) {
    console.error('❌ GET error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch devices' },
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
      description,
      warning_points,
      last_updated,
      m1,
      m2,
      inp1,
      inp2,
      inp3,
      inp4,
      outp1,
      outp2,
      outp3,
      outp4
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
        status: new Int32(parseInt(status)),
        description,
        warning_points,
        last_updated: last_updated ? new Date(last_updated) : new Date(),
        m1,
        m2,
        inp1,
        inp2,
        inp3,
        inp4,
        outp1,
        outp2,
        outp3,
        outp4,
        updated_at: new Date(),
      },
      { new: true, runValidators: false }
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
