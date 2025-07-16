import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { headers } from 'next/headers';

// Function to get Stripe instance
const getStripe = () => {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY is not configured');
  }
  return new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2023-10-16',
  });
};

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

export async function POST(request) {
  const body = await request.text();
  const headersList = headers();
  const sig = headersList.get('stripe-signature');

  let event;

  try {
    const stripe = getStripe();
    event = stripe.webhooks.constructEvent(body, sig, endpointSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return NextResponse.json(
      { error: 'Webhook signature verification failed' },
      { status: 400 }
    );
  }

  // Handle the event
  try {
    switch (event.type) {
      case 'payment_intent.succeeded':
        const paymentIntent = event.data.object;
        console.log('Payment succeeded:', paymentIntent.id);
        
        // Handle successful payment
        await handlePaymentSuccess(paymentIntent);
        break;

      case 'payment_intent.payment_failed':
        const failedPayment = event.data.object;
        console.log('Payment failed:', failedPayment.id);
        
        // Handle failed payment
        await handlePaymentFailure(failedPayment);
        break;

      case 'payment_intent.canceled':
        const canceledPayment = event.data.object;
        console.log('Payment canceled:', canceledPayment.id);
        
        // Handle canceled payment
        await handlePaymentCancellation(canceledPayment);
        break;

      case 'payment_intent.created':
        const createdPayment = event.data.object;
        console.log('Payment intent created:', createdPayment.id);
        
        // Handle payment intent creation
        await handlePaymentIntentCreated(createdPayment);
        break;

      case 'payment_method.attached':
        const paymentMethod = event.data.object;
        console.log('Payment method attached:', paymentMethod.id);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({
      success: true,
      received: true,
      eventType: event.type
    });

  } catch (error) {
    console.error('Error processing webhook:', error);
    return NextResponse.json(
      { error: 'Error processing webhook' },
      { status: 500 }
    );
  }
}

// Helper functions for handling different payment states
async function handlePaymentSuccess(paymentIntent) {
  try {
    // Here you can:
    // 1. Update your database with payment confirmation
    // 2. Send confirmation email to customer
    // 3. Fulfill the order
    // 4. Update user subscription status
    
    const paymentData = {
      paymentIntentId: paymentIntent.id,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      status: 'succeeded',
      metadata: paymentIntent.metadata,
      timestamp: new Date().toISOString(),
    };

    // Example: Save to database (implement your own database logic)
    // await savePaymentToDatabase(paymentData);
    
    // Example: Send confirmation email (implement your own email logic)
    // await sendPaymentConfirmationEmail(paymentData);

    console.log('Payment success processed:', paymentData);
    
  } catch (error) {
    console.error('Error handling payment success:', error);
  }
}

async function handlePaymentFailure(paymentIntent) {
  try {
    const paymentData = {
      paymentIntentId: paymentIntent.id,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      status: 'failed',
      metadata: paymentIntent.metadata,
      timestamp: new Date().toISOString(),
      lastPaymentError: paymentIntent.last_payment_error,
    };

    // Handle payment failure
    // await updatePaymentStatus(paymentData);
    // await sendPaymentFailureEmail(paymentData);

    console.log('Payment failure processed:', paymentData);
    
  } catch (error) {
    console.error('Error handling payment failure:', error);
  }
}

async function handlePaymentCancellation(paymentIntent) {
  try {
    const paymentData = {
      paymentIntentId: paymentIntent.id,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      status: 'canceled',
      metadata: paymentIntent.metadata,
      timestamp: new Date().toISOString(),
    };

    // Handle payment cancellation
    // await updatePaymentStatus(paymentData);
    
    console.log('Payment cancellation processed:', paymentData);
    
  } catch (error) {
    console.error('Error handling payment cancellation:', error);
  }
}

async function handlePaymentIntentCreated(paymentIntent) {
  try {
    const paymentData = {
      paymentIntentId: paymentIntent.id,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      status: 'created',
      metadata: paymentIntent.metadata,
      timestamp: new Date().toISOString(),
    };

    // Handle payment intent creation
    // await logPaymentIntent(paymentData);
    
    console.log('Payment intent creation processed:', paymentData);
    
  } catch (error) {
    console.error('Error handling payment intent creation:', error);
  }
}