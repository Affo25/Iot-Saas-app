# Stripe Payment Integration API Routes

This folder contains all the API routes for Stripe payment integration in your Next.js application.

## Setup Instructions

### 1. Install Required Dependencies

```bash
npm install stripe
```

### 2. Environment Variables

Add the following environment variables to your `.env.local` file:

```env
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key_here
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

### 3. Get Your Stripe Keys

1. Go to [Stripe Dashboard](https://dashboard.stripe.com/)
2. Navigate to Developers → API Keys
3. Copy your Publishable key and Secret key
4. For webhook secret, create a webhook endpoint in Stripe Dashboard

## API Routes Overview

### 1. Payment Intent (`/api/stripe/payment-intent`)

**Create Payment Intent**
```javascript
POST /api/stripe/payment-intent
{
  "amount": 50.00,
  "currency": "usd",
  "metadata": {
    "orderId": "order_123",
    "customerId": "cus_123"
  }
}
```

**Get Payment Intent**
```javascript
GET /api/stripe/payment-intent?payment_intent_id=pi_xxxxx
```

### 2. Customers (`/api/stripe/customers`)

**Create Customer**
```javascript
POST /api/stripe/customers
{
  "email": "customer@example.com",
  "name": "John Doe",
  "phone": "+1234567890",
  "metadata": {
    "userId": "user_123"
  }
}
```

**Get Customer**
```javascript
GET /api/stripe/customers?customer_id=cus_xxxxx
GET /api/stripe/customers?email=customer@example.com
```

**Update Customer**
```javascript
PUT /api/stripe/customers
{
  "customerId": "cus_xxxxx",
  "name": "John Smith",
  "metadata": {
    "updated": "true"
  }
}
```

**Delete Customer**
```javascript
DELETE /api/stripe/customers?customer_id=cus_xxxxx
```

### 3. Subscriptions (`/api/stripe/subscriptions`)

**Create Subscription**
```javascript
POST /api/stripe/subscriptions
{
  "customerId": "cus_xxxxx",
  "priceId": "price_xxxxx",
  "paymentMethodId": "pm_xxxxx",
  "trialPeriodDays": 7,
  "metadata": {
    "planType": "premium"
  }
}
```

**Get Subscription**
```javascript
GET /api/stripe/subscriptions?subscription_id=sub_xxxxx
GET /api/stripe/subscriptions?customer_id=cus_xxxxx
```

**Update Subscription**
```javascript
PUT /api/stripe/subscriptions
{
  "subscriptionId": "sub_xxxxx",
  "priceId": "price_new_xxxxx",
  "cancelAtPeriodEnd": false
}
```

**Cancel Subscription**
```javascript
DELETE /api/stripe/subscriptions?subscription_id=sub_xxxxx&immediate=false
```

### 4. Products (`/api/stripe/products`)

**Create Product**
```javascript
POST /api/stripe/products
{
  "name": "Premium Plan",
  "description": "Access to premium features",
  "images": ["https://example.com/image.jpg"],
  "metadata": {
    "category": "subscription"
  },
  "prices": [
    {
      "unit_amount": 2999,
      "currency": "usd",
      "recurring": {
        "interval": "month"
      }
    }
  ]
}
```

**Get Products**
```javascript
GET /api/stripe/products
GET /api/stripe/products?product_id=prod_xxxxx
GET /api/stripe/products?active=true&limit=20
```

**Update Product**
```javascript
PUT /api/stripe/products
{
  "productId": "prod_xxxxx",
  "name": "Updated Premium Plan",
  "description": "Updated description",
  "active": true
}
```

**Delete Product**
```javascript
DELETE /api/stripe/products?product_id=prod_xxxxx
```

### 5. Refunds (`/api/stripe/refunds`)

**Create Refund**
```javascript
POST /api/stripe/refunds
{
  "paymentIntentId": "pi_xxxxx",
  "amount": 25.00,
  "reason": "requested_by_customer",
  "metadata": {
    "refundReason": "Product defect"
  }
}
```

**Get Refunds**
```javascript
GET /api/stripe/refunds?refund_id=re_xxxxx
GET /api/stripe/refunds?charge_id=ch_xxxxx
```

**Update Refund**
```javascript
PUT /api/stripe/refunds
{
  "refundId": "re_xxxxx",
  "metadata": {
    "processed": "true"
  }
}
```

### 6. Confirm Payment (`/api/stripe/confirm-payment`)

**Confirm Payment**
```javascript
POST /api/stripe/confirm-payment
{
  "paymentIntentId": "pi_xxxxx",
  "paymentMethodId": "pm_xxxxx"
}
```

**Get Payment Status**
```javascript
GET /api/stripe/confirm-payment?payment_intent_id=pi_xxxxx
```

### 7. Webhooks (`/api/stripe/webhook`)

This endpoint automatically handles Stripe webhooks for events like:
- `payment_intent.succeeded`
- `payment_intent.payment_failed`
- `payment_intent.canceled`
- `payment_method.attached`

Configure your webhook endpoint in Stripe Dashboard to: `https://yourdomain.com/api/stripe/webhook`

## Frontend Integration Example

### Using Payment Intent with Stripe Elements

```javascript
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);

function PaymentForm() {
  const stripe = useStripe();
  const elements = useElements();

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!stripe || !elements) return;

    // Create payment intent
    const response = await fetch('/api/stripe/payment-intent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: 50.00,
        currency: 'usd',
      }),
    });

    const { clientSecret } = await response.json();

    // Confirm payment
    const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
      payment_method: {
        card: elements.getElement(CardElement),
      },
    });

    if (error) {
      console.error('Payment failed:', error);
    } else {
      console.log('Payment successful:', paymentIntent);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <CardElement />
      <button type="submit" disabled={!stripe}>
        Pay Now
      </button>
    </form>
  );
}

export default function Payment() {
  return (
    <Elements stripe={stripePromise}>
      <PaymentForm />
    </Elements>
  );
}
```

## Error Handling

All API routes include comprehensive error handling and return consistent response formats:

```javascript
// Success Response
{
  "success": true,
  "data": {...}
}

// Error Response
{
  "error": "Error message",
  "details": "Detailed error information"
}
```

## Security Notes

1. **Never expose your secret key** - Only use it on the server side
2. **Validate webhook signatures** - Always verify webhook authenticity
3. **Use HTTPS in production** - Required for PCI compliance
4. **Implement proper authentication** - Protect your API endpoints
5. **Log payment events** - Keep audit trails for compliance

## Testing

Use Stripe's test card numbers for testing:
- `4242424242424242` - Visa (Success)
- `4000000000000002` - Card declined
- `4000000000009995` - Insufficient funds

## Support

For issues with Stripe integration, check:
1. Stripe Dashboard logs
2. Your application logs
3. Webhook endpoint logs
4. [Stripe Documentation](https://stripe.com/docs)