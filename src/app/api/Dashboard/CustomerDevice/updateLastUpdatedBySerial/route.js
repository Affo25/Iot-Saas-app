import { NextRequest, NextResponse } from 'next/server';
import connectToMongo from '../../../../lib/mongodb_connection';
import CustomerDevice from '../../../../Models/CustomersDevice';

export async function POST(request) {
    try {
    
    await connectToMongo();

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
    
    if (existingDevice) {
      console.log(`📋 Device details:`, {
        _id: existingDevice._id,
        title: existingDevice.title,
        device_serial_number: existingDevice.device_serial_number,
        current_last_updated: existingDevice.last_updated
      });
    }
    
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
    console.log(`📋 Updated device:`, {
      _id: updatedCustomerDevice._id,
      title: updatedCustomerDevice.title,
      device_serial_number: updatedCustomerDevice.device_serial_number,
      new_last_updated: updatedCustomerDevice.last_updated,
      updated_at: updatedCustomerDevice.updated_at
    });

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