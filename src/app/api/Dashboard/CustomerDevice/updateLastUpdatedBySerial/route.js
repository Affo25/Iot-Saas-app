import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '../../../../../lib/mongodb';
import CustomerDevice from '../../../../../Models/CustomersDevice';
import { authenticate } from '../../../../../lib/auth';

export async function POST(request) {
  try {
    // Authenticate the user
    const authResult = await authenticate(request);
    if (!authResult.authenticated) {
      return NextResponse.json({ success: false, message: authResult.message }, { status: 401 });
    }

    await dbConnect();

    const { device_serial_number, last_updated } = await request.json();

    if (!device_serial_number || !last_updated) {
      return NextResponse.json(
        { success: false, message: 'Device serial number and last_updated are required' },
        { status: 400 }
      );
    }

    console.log(`🔍 Searching for customer device with serial: ${device_serial_number}`);
    
    // First, check if the device exists
    const existingDevice = await CustomerDevice.findOne({ device_serial_number: device_serial_number });
    console.log(`📋 Existing device found:`, existingDevice ? 'Yes' : 'No');
    
    if (!existingDevice) {
      return NextResponse.json(
        { success: false, message: `No customer device found with serial number: ${device_serial_number}` },
        { status: 404 }
      );
    }

    // Find and update the customer device by serial number
    const updatedCustomerDevice = await CustomerDevice.findOneAndUpdate(
      { device_serial_number: device_serial_number },
      { 
        last_updated: new Date(last_updated),
        updated_at: new Date()
      },
      { 
        new: true, // Return the updated document
        runValidators: false // Disable validation to avoid conflicts
      }
    );

    console.log(`✅ Updated last_updated for customer device with serial: ${device_serial_number}`);

    return NextResponse.json({
      success: true,
      message: 'Customer device last_updated field updated successfully',
      data: {
        _id: updatedCustomerDevice._id,
        device_serial_number: updatedCustomerDevice.device_serial_number,
        last_updated: updatedCustomerDevice.last_updated,
        title: updatedCustomerDevice.title
      }
    });

  } catch (error) {
    console.error('Error updating customer device last_updated:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error', error: error.message },
      { status: 500 }
    );
  }
}