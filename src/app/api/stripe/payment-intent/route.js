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

export async function POST(request) {
  try {
    const { 
      amount, 
      currency = 'usd', 
      metadata = {},
      payment_method,
      card_details,
      customer_id,
      payment_method_types = ['card'],
      confirm = false,
      save_payment_method = false
    } = await request.json();

    // Validate required fields
    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: 'Amount is required and must be greater than 0' },
        { status: 400 }
      );
    }

    const stripe = getStripe();
    
    // Payment Intent configuration
    const paymentIntentData = {
      amount: Math.round(amount * 100), // Convert to cents
      currency: currency.toLowerCase(),
      metadata: {
        ...metadata,
        timestamp: new Date().toISOString(),
      },
      payment_method_types,
    };

    // Handle different payment method scenarios
    if (payment_method) {
      // Use existing payment method
      paymentIntentData.payment_method = payment_method;
      paymentIntentData.confirm = confirm;
    } else if (card_details) {
      // Create new payment method with card details
      const paymentMethod = await stripe.paymentMethods.create({
        type: 'card',
        card: {
          number: card_details.number,
          exp_month: card_details.exp_month,
          exp_year: card_details.exp_year,
          cvc: card_details.cvc,
        },
        billing_details: card_details.billing_details || {},
      });

      paymentIntentData.payment_method = paymentMethod.id;
      paymentIntentData.confirm = confirm;

      // Attach to customer if provided and save_payment_method is true
      if (customer_id && save_payment_method) {
        await stripe.paymentMethods.attach(paymentMethod.id, {
          customer: customer_id,
        });
      }
    } else {
      // Use automatic payment methods
      paymentIntentData.automatic_payment_methods = {
        enabled: true,
      };
    }

    // Add customer if provided
    if (customer_id) {
      paymentIntentData.customer = customer_id;
    }

    // Setup future usage if save_payment_method is true
    if (save_payment_method) {
      paymentIntentData.setup_future_usage = 'off_session';
    }

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create(paymentIntentData);

    // Prepare response data
    const responseData = {
      success: true,
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      status: paymentIntent.status,
    };

    // Include payment method details if available
    if (paymentIntent.payment_method) {
      const paymentMethod = await stripe.paymentMethods.retrieve(paymentIntent.payment_method);
      responseData.payment_method = {
        id: paymentMethod.id,
        type: paymentMethod.type,
        card: paymentMethod.card ? {
          brand: paymentMethod.card.brand,
          last4: paymentMethod.card.last4,
          exp_month: paymentMethod.card.exp_month,
          exp_year: paymentMethod.card.exp_year,
          funding: paymentMethod.card.funding,
        } : null,
        billing_details: paymentMethod.billing_details,
      };
    }

    return NextResponse.json(responseData);

  } catch (error) {
    console.error('Error creating payment intent:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to create payment intent',
        details: error.message 
      },
      { status: 500 }
    );
  }
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const paymentIntentId = searchParams.get('payment_intent_id');

    if (!paymentIntentId) {
      return NextResponse.json(
        { error: 'Payment intent ID is required' },
        { status: 400 }
      );
    }

    // Retrieve payment intent
    const stripe = getStripe();
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    // Prepare response data
    const responseData = {
      success: true,
      paymentIntent: {
        id: paymentIntent.id,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
        status: paymentIntent.status,
        metadata: paymentIntent.metadata,
        created: paymentIntent.created,
        client_secret: paymentIntent.client_secret,
        payment_method_types: paymentIntent.payment_method_types,
      }
    };

    // Include payment method details if available
    if (paymentIntent.payment_method) {
      try {
        const paymentMethod = await stripe.paymentMethods.retrieve(paymentIntent.payment_method);
        responseData.paymentIntent.payment_method = {
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
        };
      } catch (pmError) {
        console.warn('Could not retrieve payment method details:', pmError.message);
      }
    }

    // Include customer information if available
    if (paymentIntent.customer) {
      try {
        const customer = await stripe.customers.retrieve(paymentIntent.customer);
        responseData.paymentIntent.customer = {
          id: customer.id,
          email: customer.email,
          name: customer.name,
          created: customer.created,
        };
      } catch (customerError) {
        console.warn('Could not retrieve customer details:', customerError.message);
      }
    }

    return NextResponse.json(responseData);

  } catch (error) {
    console.error('Error retrieving payment intent:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to retrieve payment intent',
        details: error.message 
      },
      { status: 500 }
    );
  }
}