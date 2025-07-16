import { NextResponse } from 'next/server';
import Stripe from 'stripe';

// Function to get Stripe instance
const getStripe = () => {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY is not configured');
  }
  return new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2023-10-16',
  });
};

// CREATE - Create a new payment method
export async function POST(request) {
  try {
    const { 
      type = 'card',
      card,
      billing_details = {},
      customer_id
    } = await request.json();

    // Validate required fields
    if (type === 'card' && !card) {
      return NextResponse.json(
        { error: 'Card details are required for card payment method' },
        { status: 400 }
      );
    }

    const stripe = getStripe();

    // Create payment method
    const paymentMethodData = {
      type,
      billing_details,
    };

    if (type === 'card') {
      paymentMethodData.card = {
        number: card.number,
        exp_month: card.exp_month,
        exp_year: card.exp_year,
        cvc: card.cvc,
      };
    }

    const paymentMethod = await stripe.paymentMethods.create(paymentMethodData);

    // Attach to customer if provided
    if (customer_id) {
      await stripe.paymentMethods.attach(paymentMethod.id, {
        customer: customer_id,
      });
    }

    return NextResponse.json({
      success: true,
      payment_method: {
        id: paymentMethod.id,
        type: paymentMethod.type,
        card: paymentMethod.card ? {
          brand: paymentMethod.card.brand,
          last4: paymentMethod.card.last4,
          exp_month: paymentMethod.card.exp_month,
          exp_year: paymentMethod.card.exp_year,
          funding: paymentMethod.card.funding,
          country: paymentMethod.card.country,
        } : null,
        billing_details: paymentMethod.billing_details,
        created: paymentMethod.created,
      }
    });

  } catch (error) {
    console.error('Error creating payment method:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to create payment method',
        details: error.message 
      },
      { status: 500 }
    );
  }
}

// READ - Get payment method details
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const paymentMethodId = searchParams.get('payment_method_id');
    const customerId = searchParams.get('customer_id');

    const stripe = getStripe();

    if (paymentMethodId) {
      // Get specific payment method
      const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId);

      return NextResponse.json({
        success: true,
        payment_method: {
          id: paymentMethod.id,
          type: paymentMethod.type,
          card: paymentMethod.card ? {
            brand: paymentMethod.card.brand,
            last4: paymentMethod.card.last4,
            exp_month: paymentMethod.card.exp_month,
            exp_year: paymentMethod.card.exp_year,
            funding: paymentMethod.card.funding,
            country: paymentMethod.card.country,
          } : null,
          billing_details: paymentMethod.billing_details,
          created: paymentMethod.created,
        }
      });

    } else if (customerId) {
      // Get all payment methods for a customer
      const paymentMethods = await stripe.paymentMethods.list({
        customer: customerId,
        type: 'card',
      });

      return NextResponse.json({
        success: true,
        payment_methods: paymentMethods.data.map(pm => ({
          id: pm.id,
          type: pm.type,
          card: pm.card ? {
            brand: pm.card.brand,
            last4: pm.card.last4,
            exp_month: pm.card.exp_month,
            exp_year: pm.card.exp_year,
            funding: pm.card.funding,
            country: pm.card.country,
          } : null,
          billing_details: pm.billing_details,
          created: pm.created,
        }))
      });

    } else {
      return NextResponse.json(
        { error: 'Either payment_method_id or customer_id is required' },
        { status: 400 }
      );
    }

  } catch (error) {
    console.error('Error retrieving payment method:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to retrieve payment method',
        details: error.message 
      },
      { status: 500 }
    );
  }
}

// UPDATE - Update payment method
export async function PUT(request) {
  try {
    const { 
      payment_method_id,
      billing_details
    } = await request.json();

    if (!payment_method_id) {
      return NextResponse.json(
        { error: 'Payment method ID is required' },
        { status: 400 }
      );
    }

    const stripe = getStripe();

    // Update payment method
    const paymentMethod = await stripe.paymentMethods.update(
      payment_method_id,
      { billing_details }
    );

    return NextResponse.json({
      success: true,
      payment_method: {
        id: paymentMethod.id,
        type: paymentMethod.type,
        card: paymentMethod.card ? {
          brand: paymentMethod.card.brand,
          last4: paymentMethod.card.last4,
          exp_month: paymentMethod.card.exp_month,
          exp_year: paymentMethod.card.exp_year,
          funding: paymentMethod.card.funding,
          country: paymentMethod.card.country,
        } : null,
        billing_details: paymentMethod.billing_details,
        created: paymentMethod.created,
      }
    });

  } catch (error) {
    console.error('Error updating payment method:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to update payment method',
        details: error.message 
      },
      { status: 500 }
    );
  }
}

// DELETE - Detach payment method
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const paymentMethodId = searchParams.get('payment_method_id');

    if (!paymentMethodId) {
      return NextResponse.json(
        { error: 'Payment method ID is required' },
        { status: 400 }
      );
    }

    const stripe = getStripe();

    // Detach payment method
    await stripe.paymentMethods.detach(paymentMethodId);

    return NextResponse.json({
      success: true,
      message: 'Payment method detached successfully'
    });

  } catch (error) {
    console.error('Error detaching payment method:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to detach payment method',
        details: error.message 
      },
      { status: 500 }
    );
  }
}