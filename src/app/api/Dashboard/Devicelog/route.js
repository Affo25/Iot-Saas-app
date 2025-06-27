import { NextResponse } from 'next/server';
import connectToMongo from '../../../lib/mongodb_connection';
import DeviceLog from '../../../Models/DeviceLog';
import CustomersDevice from '../../../Models/CustomersDevice';


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

export async function GET(request) {
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
    const deviceLogs = await DeviceLog.find({}).limit(100);
    console.log("📌 DeviceLog Data:", deviceLogs.length, "records found");

    return NextResponse.json(
      {
        success: true,
        message: "All device logs retrieved successfully",
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

export async function DELETE(request) {
  const url = new URL(request.url);
  const apiKey = url.searchParams.get('api_key');

  if (apiKey !== process.env.API_KEY) {
    return NextResponse.json(
      { success: false, message: 'Unauthorized: Invalid API key' },
      { status: 401 }
    );
  }

  try {
    const id = url.searchParams.get('_id');

    if (!id) {
      return NextResponse.json(
        { success: false, message: "Device log ID is required" },
        { status: 400 }
      );
    }

    await connectToMongo();

    const deletedDeviceLog = await DeviceLog.findByIdAndDelete(id);

    if (!deletedDeviceLog) {
      return NextResponse.json(
        { success: false, message: "Device log not found" },
        { status: 404 }
      );
    }

    console.log(`✅ Device log with ID ${id} deleted successfully`);

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

export async function PUT(request) {
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
    console.log("📩 DeviceLog PUT body:", body);

    const { _id, serial_code, humidity, temperature, meta } = body;

    if (!_id) {
      return NextResponse.json(
        { success: false, message: "Device log ID is required" },
        { status: 400 }
      );
    }

    let metaObject = meta;
    if (meta && typeof meta === 'string') {
      try {
        metaObject = JSON.parse(meta);
      } catch {
        return NextResponse.json(
          { success: false, message: "Meta data must be a valid JSON object" },
          { status: 400 }
        );
      }
    }

    const updateData = {
      updated_at: new Date()
    };

    if (serial_code) updateData.serial_code = serial_code;
    if (humidity !== undefined) updateData.humidity = Number(humidity);
    if (temperature !== undefined) updateData.temperature = Number(temperature);
    if (meta !== undefined) updateData.meta = metaObject;

    console.log("🔧 Updating device log with ID:", _id);
    console.log("Update data:", updateData);

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



 // // Fetch all device logs or filter by device code
  // fetchDeviceLogs: async (deviceCode = "pk-112232") => {
  //   try {
  //     set({ loading: true });

  //     let url = '/api/DeviceLog';
  //     if (deviceCode) {
  //       url += `?device_code=${deviceCode}`;
  //     }

  //     const response = await axios.get(url);

  //     if (response.data && response.data.data) {
  //       set({ deviceLogs: response.data.data, loading: false });
  //     } else {
  //       set({ deviceLogs: [], loading: false });
  //       console.error('Unexpected API response format:', response.data);
  //     }
  //   } catch (error) {
  //     const errorMessage = error.response?.data?.message || 'Failed to fetch device logs';
  //     toast.error(errorMessage);
  //     console.error('Error fetching device logs:', error);
  //     set({ error: errorMessage, loading: false });
  //   }
  // },
