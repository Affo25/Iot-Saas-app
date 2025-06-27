import { NextResponse } from 'next/server';
import connectToMongo from '../../lib/mongodb_connection';
import DeviceLog from '../../Models/DeviceLog';

export async function POST(request) {
  const url = new URL(request.url);
  const apiKey = url.searchParams.get('api_key');

  if (apiKey !== process.env.API_KEY) {
    return NextResponse.json(
      { success: false, message: 'Unauthorized: Invalid API key' },
      { status: 401 }
    );
  }

  try {
    await connectToMongo();
    const body = await request.json();
    console.log("📩 DeviceLog POST body:", body);

    const { serial_code, humidity, temperature, meta = {} } = body;

    if (!serial_code) {
      return NextResponse.json(
        { success: false, message: "Device code is required" },
        { status: 400 }
      );
    }

    let metaObject = meta;
    if (typeof meta === 'string') {
      try {
        metaObject = JSON.parse(meta);
      } catch {
        return NextResponse.json(
          { success: false, message: "Meta must be a valid JSON object" },
          { status: 400 }
        );
      }
    }

    const deviceLog = new DeviceLog({
      serial_code,
      humidity: Number(humidity) || 0,
      temperature: Number(temperature) || 0,
      meta: metaObject,
      created_at: new Date()
    });

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