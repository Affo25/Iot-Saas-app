import { NextResponse } from 'next/server';
import connectToMongo from '../../../../lib/mongodb_connection';
import DeviceLog from '../../../../Models/DeviceLog';
import CustomersDevice from '../../../../Models/CustomersDevice';

// Utility to check API key
function validateApiKey(request) {
  const url = new URL(request.url);
  const apiKey = url.searchParams.get('api_key');
  return apiKey === process.env.API_KEY;
}

export async function GET(request) {
  if (!validateApiKey(request)) {
    return NextResponse.json(
      { success: false, message: 'Unauthorized: Invalid API key' },
      { status: 401 }
    );
  }

  try {
    await connectToMongo();
    
    const url = new URL(request.url);
    const deviceCode = url.searchParams.get('device_code');
    
    if (!deviceCode) {
      return NextResponse.json(
        { success: false, message: 'Device code is required' },
        { status: 400 }
      );
    }

    console.log("🔍 Filtering device logs for device_code:", deviceCode);
    
    // Get device logs filtered by device_code
    const deviceLogs = await DeviceLog.find({ device_code: deviceCode })
      .sort({ created_at: -1 })
      .limit(100);
    
    // Get customer device info for this device_code
    const customerDevice = await CustomersDevice.findOne({ device_code: deviceCode });
    
    // Enhance device logs with customer device information
    const enhancedDeviceLogs = deviceLogs.map(log => ({
      ...log.toObject(),
      device_title: customerDevice?.title || 'Unknown Device',
      device_serial_number: customerDevice?.device_serial_number || 'N/A',
      customer_id: customerDevice?.customer_id || 'N/A',
      device_status: customerDevice?.status || 0
    }));

    console.log("📌 Filtered DeviceLog Data:", enhancedDeviceLogs.length, "records found for device_code:", deviceCode);

    return NextResponse.json(
      {
        success: true,
        message: "Device logs filtered successfully",
        data: enhancedDeviceLogs,
        device_code: deviceCode
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