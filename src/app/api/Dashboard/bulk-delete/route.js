// app/api/delete-multiple/route.js or route.ts
import { NextResponse } from 'next/server';
import connectToMongo from "../../../lib/mongodb_connection";
import CustomersDevice from '../../../Models/CustomersDevice';
import Device from '../../../Models/Device';
import Customers from '../../../Models/Customers';
import DeviceLog from '../../../Models/DeviceLog';

// Map of valid collections
const modelMap = {
  Customers,
  CustomersDevice,
  Device,
  DeviceLog,
};

export async function DELETE(request) {
  try {
    const body = await request.json(); // ✅ Extract JSON body properly
    const { table, ids } = body;
    console.log(table);
    console.log(ids);

    if (!table || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { success: false, message: "Model and IDs are required." },
        { status: 400 }
      );
    }

    // Check API key for DeviceLog table
    if (table === 'DeviceLog') {
      const url = new URL(request.url);
      const apiKey = url.searchParams.get('api_key');
      if (apiKey !== process.env.API_KEY) {
        return NextResponse.json(
          { success: false, message: 'Unauthorized: Invalid API key' },
          { status: 401 }
        );
      }
    }

    const model = modelMap[table];
    console.log(model);
    if (!model) {
      return NextResponse.json(
        { success: false, message: "Invalid model name." },
        { status: 400 }
      );
    }

    await connectToMongo();

    const result = await model.deleteMany({ _id: { $in: ids } });

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { success: false, message: "No records deleted." },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: `${result.deletedCount} record(s) deleted successfully.`,
        deletedCount: result.deletedCount,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("❌ Error:", error);
    return NextResponse.json(
      { success: false, message: "Internal Server Error", error: error.message },
      { status: 500 }
    );
  }
}