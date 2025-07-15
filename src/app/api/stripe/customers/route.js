import { NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16',
});

// Create a new customer
export async function POST(request) {
  try {
    const { email, name, phone, metadata = {} } = await request.json();

    // Validate required fields
    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Check if customer already exists
    const existingCustomers = await stripe.customers.list({
      email: email,
      limit: 1,
    });

    if (existingCustomers.data.length > 0) {
      return NextResponse.json({
        success: true,
        customer: existingCustomers.data[0],
        message: 'Customer already exists'
      });
    }

    // Create new customer
    const customer = await stripe.customers.create({
      email,
      name,
      phone,
      metadata: {
        ...metadata,
        created_at: new Date().toISOString(),
      },
    });

    return NextResponse.json({
      success: true,
      customer: {
        id: customer.id,
        email: customer.email,
        name: customer.name,
        phone: customer.phone,
        metadata: customer.metadata,
        created: customer.created,
      }
    });

  } catch (error) {
    console.error('Error creating customer:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to create customer',
        details: error.message 
      },
      { status: 500 }
    );
  }
}

// Get customer by ID or email
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const customerId = searchParams.get('customer_id');
    const email = searchParams.get('email');

    if (!customerId && !email) {
      return NextResponse.json(
        { error: 'Customer ID or email is required' },
        { status: 400 }
      );
    }

    let customer;

    if (customerId) {
      // Get customer by ID
      customer = await stripe.customers.retrieve(customerId);
    } else if (email) {
      // Get customer by email
      const customers = await stripe.customers.list({
        email: email,
        limit: 1,
      });
      
      if (customers.data.length === 0) {
        return NextResponse.json(
          { error: 'Customer not found' },
          { status: 404 }
        );
      }
      
      customer = customers.data[0];
    }

    return NextResponse.json({
      success: true,
      customer: {
        id: customer.id,
        email: customer.email,
        name: customer.name,
        phone: customer.phone,
        metadata: customer.metadata,
        created: customer.created,
      }
    });

  } catch (error) {
    console.error('Error retrieving customer:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to retrieve customer',
        details: error.message 
      },
      { status: 500 }
    );
  }
}

// Update customer
export async function PUT(request) {
  try {
    const { customerId, email, name, phone, metadata = {} } = await request.json();

    if (!customerId) {
      return NextResponse.json(
        { error: 'Customer ID is required' },
        { status: 400 }
      );
    }

    const updateData = {};
    if (email) updateData.email = email;
    if (name) updateData.name = name;
    if (phone) updateData.phone = phone;
    if (Object.keys(metadata).length > 0) {
      updateData.metadata = {
        ...metadata,
        updated_at: new Date().toISOString(),
      };
    }

    const customer = await stripe.customers.update(customerId, updateData);

    return NextResponse.json({
      success: true,
      customer: {
        id: customer.id,
        email: customer.email,
        name: customer.name,
        phone: customer.phone,
        metadata: customer.metadata,
        created: customer.created,
      }
    });

  } catch (error) {
    console.error('Error updating customer:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to update customer',
        details: error.message 
      },
      { status: 500 }
    );
  }
}

// Delete customer
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const customerId = searchParams.get('customer_id');

    if (!customerId) {
      return NextResponse.json(
        { error: 'Customer ID is required' },
        { status: 400 }
      );
    }

    const deletedCustomer = await stripe.customers.del(customerId);

    return NextResponse.json({
      success: true,
      deleted: deletedCustomer.deleted,
      customerId: deletedCustomer.id,
    });

  } catch (error) {
    console.error('Error deleting customer:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to delete customer',
        details: error.message 
      },
      { status: 500 }
    );
  }
}