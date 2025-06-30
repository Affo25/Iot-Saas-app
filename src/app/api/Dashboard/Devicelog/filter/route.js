import { NextResponse } from 'next/server';
import connectToMongo from '../../../../lib/mongodb_connection';
import DeviceLog from '../../../../Models/DeviceLog';

export async function GET(request) {
  // if (!validateApiKey(request)) {
  //   return NextResponse.json(
  //     { success: false, message: 'Unauthorized: Invalid API key' },
  //     { status: 401 }
  //   );
  // }

  try {
    await connectToMongo();
    
    const url = new URL(request.url);
    const serialCode = url.searchParams.get('serialCode');
    console.log("serialCode get from UI",serialCode);
    
    if (!serialCode) {
      return NextResponse.json(
        { success: false, message: 'serialCode is required' },
        { status: 400 }
      );
    }

    console.log("🔍 Filtering device logs for serial code:", serialCode);
    
    // Find the customer device by serial code
    const customerDevice = await DeviceLog.find({ serial_code: serialCode });
    console.log("customerDevice",customerDevice);
    
    if (!customerDevice) {
      return NextResponse.json(
        { success: false, message: 'Device not found for this serial code' },
        { status: 404 }
      );
    }

    // Get device logs using the device_serial_number from customer device
    const deviceLogs = await DeviceLog.find({ 
      serial_code: serialCode
    })
      .sort({ created_at: -1 })
    
    const enhancedDeviceLogs = deviceLogs.map(log => ({
      ...log.toObject(),
      device_title: customerDevice.title || 'Unknown Device',
      device_serial_number: customerDevice.device_serial_number || 'N/A',
      customer_id: customerDevice.customer_id || 'N/A',
      device_status: customerDevice.status || 0
    }));

    return NextResponse.json(
      {
        success: true,
        message: "Device logs filtered successfully",
        deviceLogs: deviceLogs,
        searchParam: serialCode
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("❌ GET filter error:", error);
    return NextResponse.json(
      { success: false, message: "Internal Server Error", error: error.message },
      { status: 500 }
    );
  }
} 