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

// Create a refund
export async function POST(request) {
  try {
    const { 
      paymentIntentId, 
      chargeId, 
      amount, 
      reason = 'requested_by_customer',
      metadata = {} 
    } = await request.json();

    // Validate required fields
    if (!paymentIntentId && !chargeId) {
      return NextResponse.json(
        { error: 'Payment Intent ID or Charge ID is required' },
        { status: 400 }
      );
    }

    const refundData = {
      reason,
      metadata: {
        ...metadata,
        created_at: new Date().toISOString(),
      },
    };

    // Add payment intent or charge
    if (paymentIntentId) {
      refundData.payment_intent = paymentIntentId;
    } else {
      refundData.charge = chargeId;
    }

    // Add amount if specified (partial refund)
    if (amount && amount > 0) {
      refundData.amount = Math.round(amount * 100); // Convert to cents
    }

    // Create refund
    const refund = await stripe.refunds.create(refundData);

    return NextResponse.json({
      success: true,
      refund: {
        id: refund.id,
        amount: refund.amount,
        charge: refund.charge,
        created: refund.created,
        currency: refund.currency,
        metadata: refund.metadata,
        reason: refund.reason,
        receipt_number: refund.receipt_number,
        status: refund.status,
      }
    });

  } catch (error) {
    console.error('Error creating refund:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to create refund',
        details: error.message 
      },
      { status: 500 }
    );
  }
}

// Get refund by ID or list refunds
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const refundId = searchParams.get('refund_id');
    const chargeId = searchParams.get('charge_id');
    const limit = searchParams.get('limit') || 10;

    if (refundId) {
      // Get specific refund
      const refund = await stripe.refunds.retrieve(refundId);

      return NextResponse.json({
        success: true,
        refund: {
          id: refund.id,
          amount: refund.amount,
          charge: refund.charge,
          created: refund.created,
          currency: refund.currency,
          metadata: refund.metadata,
          reason: refund.reason,
          receipt_number: refund.receipt_number,
          status: refund.status,
        }
      });
    } else {
      // List refunds
      const listParams = {
        limit: parseInt(limit),
      };

      if (chargeId) {
        listParams.charge = chargeId;
      }

      const refunds = await stripe.refunds.list(listParams);

      return NextResponse.json({
        success: true,
        refunds: refunds.data.map(refund => ({
          id: refund.id,
          amount: refund.amount,
          charge: refund.charge,
          created: refund.created,
          currency: refund.currency,
          metadata: refund.metadata,
          reason: refund.reason,
          receipt_number: refund.receipt_number,
          status: refund.status,
        })),
        has_more: refunds.has_more,
      });
    }

  } catch (error) {
    console.error('Error retrieving refunds:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to retrieve refunds',
        details: error.message 
      },
      { status: 500 }
    );
  }
}

// Update refund metadata
export async function PUT(request) {
  try {
    const { refundId, metadata = {} } = await request.json();

    if (!refundId) {
      return NextResponse.json(
        { error: 'Refund ID is required' },
        { status: 400 }
      );
    }

    const refund = await stripe.refunds.update(refundId, {
      metadata: {
        ...metadata,
        updated_at: new Date().toISOString(),
      },
    });

    return NextResponse.json({
      success: true,
      refund: {
        id: refund.id,
        amount: refund.amount,
        charge: refund.charge,
        created: refund.created,
        currency: refund.currency,
        metadata: refund.metadata,
        reason: refund.reason,
        receipt_number: refund.receipt_number,
        status: refund.status,
      }
    });

  } catch (error) {
    console.error('Error updating refund:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to update refund',
        details: error.message 
      },
      { status: 500 }
    );
  }
}