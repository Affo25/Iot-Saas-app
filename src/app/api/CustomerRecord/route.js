import { NextResponse } from "next/server";
import { connectToMongo } from "../../mongodb_connection";
import Customers from "../../Models/Customers";
import { ObjectId } from "mongodb";

export async function GET(request) {
  try {
    await connectToMongo();

    const { searchParams } = new URL(request.url);
    const customerId = searchParams.get('customer_id');

    if (!customerId) {
      return NextResponse.json(
        { success: false, message: "customer_id is required" },
        { status: 400 }
      );
    }

    // Convert customerId to ObjectId
    let objectId;
    try {
      objectId = new ObjectId(customerId);
    } catch (err) {
      return NextResponse.json(
        { success: false, message: "Invalid customer_id format" },
        { status: 400 }
      );
    }

    const customer = await Customers.findOne({ _id: objectId });

    if (!customer) {
      return NextResponse.json(
        { success: false, message: "Customer not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          customer: {
            _id: customer._id,
            full_name: customer.full_name,
            email: customer.email,
            contact: customer.contact,
            package_name: customer.package_name,
            package_expiry: customer.package_expiry,
            status: customer.status,
            created_at: customer.created_at,
            devices: customer.devices || [],
          }
        }
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("❌ Error fetching customer:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch customer" },
      { status: 500 }
    );
  }
}
