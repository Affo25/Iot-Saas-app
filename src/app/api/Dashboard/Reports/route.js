import { NextResponse } from 'next/server';
import  connectToMongo  from "../../../lib/mongodb_connection";
import Reports from '../../../Models/Reports';

// GET /api/Reports
export async function GET(request) {
  try {
    // Get customerId from query parameters
    const { searchParams } = new URL(request.url);
    const customerId = searchParams.get('customerId');

    if (!customerId) {
      return NextResponse.json(
        { error: 'Customer ID is required' },
        { status: 400 }
      );
    }

    await connectToMongo();
    
    // Find reports for the specific customer
    const reports = await Reports.find({ customer_id: customerId });
    
    return NextResponse.json(reports);
  } catch (error) {
    console.error('Error fetching reports:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reports' },
      { status: 500 }
    );
  }
}

// POST /api/Reports
export async function POST(request) {
  try {
    const body = await request.json();
    const {
      title,
      description,
      customer_id,
      device_id,
      report_type,
      report_data,
      date
    } = body;

    // Validate required fields
    if (!title || !customer_id || !report_type) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    await connectToMongo();

    // Create new report
    const report = await Reports.create({
      title,
      description,
      customer_id,
      device_id,
      report_type,
      report_data,
      date: date || new Date()
    });

    return NextResponse.json(report);
  } catch (error) {
    console.error('Error creating report:', error);
    return NextResponse.json(
      { error: 'Failed to create report' },
      { status: 500 }
    );
  }
} 