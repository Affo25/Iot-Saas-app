import { NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16',
});

// Create a new subscription
export async function POST(request) {
  try {
    const { 
      customerId, 
      priceId, 
      paymentMethodId, 
      metadata = {},
      trialPeriodDays = null 
    } = await request.json();

    // Validate required fields
    if (!customerId || !priceId) {
      return NextResponse.json(
        { error: 'Customer ID and Price ID are required' },
        { status: 400 }
      );
    }

    // Attach payment method to customer if provided
    if (paymentMethodId) {
      await stripe.paymentMethods.attach(paymentMethodId, {
        customer: customerId,
      });

      // Set as default payment method
      await stripe.customers.update(customerId, {
        invoice_settings: {
          default_payment_method: paymentMethodId,
        },
      });
    }

    // Create subscription
    const subscriptionParams = {
      customer: customerId,
      items: [{ price: priceId }],
      metadata: {
        ...metadata,
        created_at: new Date().toISOString(),
      },
      expand: ['latest_invoice.payment_intent'],
    };

    if (trialPeriodDays) {
      subscriptionParams.trial_period_days = trialPeriodDays;
    }

    const subscription = await stripe.subscriptions.create(subscriptionParams);

    return NextResponse.json({
      success: true,
      subscription: {
        id: subscription.id,
        status: subscription.status,
        current_period_start: subscription.current_period_start,
        current_period_end: subscription.current_period_end,
        trial_start: subscription.trial_start,
        trial_end: subscription.trial_end,
        customer: subscription.customer,
        items: subscription.items.data,
        metadata: subscription.metadata,
        latest_invoice: subscription.latest_invoice,
      }
    });

  } catch (error) {
    console.error('Error creating subscription:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to create subscription',
        details: error.message 
      },
      { status: 500 }
    );
  }
}

// Get subscription by ID or customer ID
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const subscriptionId = searchParams.get('subscription_id');
    const customerId = searchParams.get('customer_id');

    if (!subscriptionId && !customerId) {
      return NextResponse.json(
        { error: 'Subscription ID or Customer ID is required' },
        { status: 400 }
      );
    }

    if (subscriptionId) {
      // Get specific subscription
      const subscription = await stripe.subscriptions.retrieve(subscriptionId, {
        expand: ['latest_invoice.payment_intent'],
      });

      return NextResponse.json({
        success: true,
        subscription: {
          id: subscription.id,
          status: subscription.status,
          current_period_start: subscription.current_period_start,
          current_period_end: subscription.current_period_end,
          trial_start: subscription.trial_start,
          trial_end: subscription.trial_end,
          customer: subscription.customer,
          items: subscription.items.data,
          metadata: subscription.metadata,
          latest_invoice: subscription.latest_invoice,
        }
      });
    } else {
      // Get all subscriptions for customer
      const subscriptions = await stripe.subscriptions.list({
        customer: customerId,
        expand: ['data.latest_invoice.payment_intent'],
      });

      return NextResponse.json({
        success: true,
        subscriptions: subscriptions.data.map(sub => ({
          id: sub.id,
          status: sub.status,
          current_period_start: sub.current_period_start,
          current_period_end: sub.current_period_end,
          trial_start: sub.trial_start,
          trial_end: sub.trial_end,
          customer: sub.customer,
          items: sub.items.data,
          metadata: sub.metadata,
          latest_invoice: sub.latest_invoice,
        })),
        has_more: subscriptions.has_more,
      });
    }

  } catch (error) {
    console.error('Error retrieving subscription:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to retrieve subscription',
        details: error.message 
      },
      { status: 500 }
    );
  }
}

// Update subscription
export async function PUT(request) {
  try {
    const { 
      subscriptionId, 
      priceId, 
      metadata = {},
      cancelAtPeriodEnd = false 
    } = await request.json();

    if (!subscriptionId) {
      return NextResponse.json(
        { error: 'Subscription ID is required' },
        { status: 400 }
      );
    }

    const updateData = {
      metadata: {
        ...metadata,
        updated_at: new Date().toISOString(),
      },
      cancel_at_period_end: cancelAtPeriodEnd,
    };

    if (priceId) {
      // Get current subscription to update items
      const currentSubscription = await stripe.subscriptions.retrieve(subscriptionId);
      
      updateData.items = [{
        id: currentSubscription.items.data[0].id,
        price: priceId,
      }];
    }

    const subscription = await stripe.subscriptions.update(subscriptionId, updateData);

    return NextResponse.json({
      success: true,
      subscription: {
        id: subscription.id,
        status: subscription.status,
        current_period_start: subscription.current_period_start,
        current_period_end: subscription.current_period_end,
        cancel_at_period_end: subscription.cancel_at_period_end,
        customer: subscription.customer,
        items: subscription.items.data,
        metadata: subscription.metadata,
      }
    });

  } catch (error) {
    console.error('Error updating subscription:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to update subscription',
        details: error.message 
      },
      { status: 500 }
    );
  }
}

// Cancel subscription
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const subscriptionId = searchParams.get('subscription_id');
    const immediate = searchParams.get('immediate') === 'true';

    if (!subscriptionId) {
      return NextResponse.json(
        { error: 'Subscription ID is required' },
        { status: 400 }
      );
    }

    let subscription;

    if (immediate) {
      // Cancel immediately
      subscription = await stripe.subscriptions.cancel(subscriptionId);
    } else {
      // Cancel at period end
      subscription = await stripe.subscriptions.update(subscriptionId, {
        cancel_at_period_end: true,
      });
    }

    return NextResponse.json({
      success: true,
      subscription: {
        id: subscription.id,
        status: subscription.status,
        canceled_at: subscription.canceled_at,
        cancel_at_period_end: subscription.cancel_at_period_end,
        current_period_end: subscription.current_period_end,
      }
    });

  } catch (error) {
    console.error('Error canceling subscription:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to cancel subscription',
        details: error.message 
      },
      { status: 500 }
    );
  }
}