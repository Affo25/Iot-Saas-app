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
    
    // Get all device logs
    const deviceLogs = await DeviceLog.find({}).sort({ created_at: -1 }).limit(100);
    
    // Get all customer devices for mapping
    const customerDevices = await CustomersDevice.find({});
    
    // Create a map of device_code to customer device info
    const deviceMap = {};
    customerDevices.forEach(device => {
      deviceMap[device.device_code] = {
        title: device.title,
        device_serial_number: device.device_serial_number,
        customer_id: device.customer_id,
        status: device.status
      };
    });
    
    // Enhance device logs with customer device information
    const enhancedDeviceLogs = deviceLogs.map(log => ({
      ...log.toObject(),
      device_title: deviceMap[log.device_code]?.title || 'Unknown Device',
      device_serial_number: deviceMap[log.device_code]?.device_serial_number || 'N/A',
      customer_id: deviceMap[log.device_code]?.customer_id || 'N/A',
      device_status: deviceMap[log.device_code]?.status || 0
    }));

    console.log("📌 Enhanced DeviceLog Data:", enhancedDeviceLogs.length, "records found");

    return NextResponse.json(
      {
        success: true,
        message: "Enhanced device logs retrieved successfully",
        data: enhancedDeviceLogs
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