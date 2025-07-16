# Stripe Payment Intent API Documentation

## Overview

The enhanced Payment Intent API now supports payment methods and card details integration. This allows for more flexible payment processing with support for card storage, customer management, and detailed payment method handling.

## API Endpoints

### 1. Create Payment Intent - `/api/stripe/payment-intent` (POST)

Creates a new payment intent with optional payment method and card details.

#### Request Body Options:

##### Basic Payment Intent (Client-side card collection)
```json
{
  "amount": 29.99,
  "currency": "usd",
  "metadata": {
    "order_id": "order_123",
    "customer_email": "user@example.com"
  }
}
```

##### Payment Intent with Card Details (Server-side processing)
```json
{
  "amount": 29.99,
  "currency": "usd",
  "card_details": {
    "number": "4242424242424242",
    "exp_month": 12,
    "exp_year": 2025,
    "cvc": "123",
    "billing_details": {
      "name": "John Doe",
      "email": "john@example.com",
      "address": {
        "line1": "123 Main St",
        "city": "New York",
        "state": "NY",
        "postal_code": "10001",
        "country": "US"
      }
    }
  },
  "confirm": true,
  "save_payment_method": true,
  "customer_id": "cus_customer123"
}
```

##### Payment Intent with Existing Payment Method
```json
{
  "amount": 29.99,
  "currency": "usd",
  "payment_method": "pm_1234567890",
  "confirm": true,
  "customer_id": "cus_customer123"
}
```

#### Parameters:

- `amount` (required): Amount in decimal format (e.g., 29.99)
- `currency` (optional): Currency code (default: "usd")
- `metadata` (optional): Additional metadata object
- `card_details` (optional): Card information object
- `payment_method` (optional): Existing payment method ID
- `customer_id` (optional): Stripe customer ID
- `payment_method_types` (optional): Array of payment method types (default: ["card"])
- `confirm` (optional): Whether to confirm the payment immediately (default: false)
- `save_payment_method` (optional): Whether to save the payment method for future use (default: false)

#### Response:

```json
{
  "success": true,
  "clientSecret": "pi_1234567890_secret_abcdef",
  "paymentIntentId": "pi_1234567890",
  "amount": 2999,
  "currency": "usd",
  "status": "requires_payment_method",
  "payment_method": {
    "id": "pm_1234567890",
    "type": "card",
    "card": {
      "brand": "visa",
      "last4": "4242",
      "exp_month": 12,
      "exp_year": 2025,
      "funding": "credit"
    },
    "billing_details": {
      "name": "John Doe",
      "email": "john@example.com"
    }
  }
}
```

### 2. Get Payment Intent - `/api/stripe/payment-intent` (GET)

Retrieves an existing payment intent with detailed information.

#### Query Parameters:

- `payment_intent_id` (required): The payment intent ID

#### Example Request:
```
GET /api/stripe/payment-intent?payment_intent_id=pi_1234567890
```

#### Response:

```json
{
  "success": true,
  "paymentIntent": {
    "id": "pi_1234567890",
    "amount": 2999,
    "currency": "usd",
    "status": "succeeded",
    "metadata": {
      "order_id": "order_123"
    },
    "created": 1640995200,
    "client_secret": "pi_1234567890_secret_abcdef",
    "payment_method_types": ["card"],
    "payment_method": {
      "id": "pm_1234567890",
      "type": "card",
      "card": {
        "brand": "visa",
        "last4": "4242",
        "exp_month": 12,
        "exp_year": 2025,
        "funding": "credit",
        "country": "US"
      },
      "billing_details": {
        "name": "John Doe",
        "email": "john@example.com"
      }
    },
    "customer": {
      "id": "cus_customer123",
      "email": "john@example.com",
      "name": "John Doe"
    }
  }
}
```

### 3. Payment Methods Management - `/api/stripe/payment-methods`

#### Create Payment Method (POST)

```json
{
  "type": "card",
  "card": {
    "number": "4242424242424242",
    "exp_month": 12,
    "exp_year": 2025,
    "cvc": "123"
  },
  "billing_details": {
    "name": "John Doe",
    "email": "john@example.com"
  },
  "customer_id": "cus_customer123"
}
```

#### Get Payment Method (GET)

```
GET /api/stripe/payment-methods?payment_method_id=pm_1234567890
```

#### Get Customer Payment Methods (GET)

```
GET /api/stripe/payment-methods?customer_id=cus_customer123
```

#### Update Payment Method (PUT)

```json
{
  "payment_method_id": "pm_1234567890",
  "billing_details": {
    "name": "John Updated",
    "email": "john.updated@example.com"
  }
}
```

#### Delete Payment Method (DELETE)

```
DELETE /api/stripe/payment-methods?payment_method_id=pm_1234567890
```

## Frontend Integration Examples

### React Component Example

```jsx
import { useState } from 'react';

const PaymentForm = () => {
  const [paymentData, setPaymentData] = useState({
    amount: '',
    card_details: {
      number: '',
      exp_month: '',
      exp_year: '',
      cvc: '',
      billing_details: {
        name: '',
        email: ''
      }
    }
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const response = await fetch('/api/stripe/payment-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...paymentData,
          confirm: true,
          save_payment_method: true
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        console.log('Payment successful:', result);
        // Handle success
      } else {
        console.error('Payment failed:', result.error);
        // Handle error
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="number"
        placeholder="Amount"
        value={paymentData.amount}
        onChange={(e) => setPaymentData({
          ...paymentData,
          amount: parseFloat(e.target.value)
        })}
      />
      
      <input
        type="text"
        placeholder="Card Number"
        value={paymentData.card_details.number}
        onChange={(e) => setPaymentData({
          ...paymentData,
          card_details: {
            ...paymentData.card_details,
            number: e.target.value
          }
        })}
      />
      
      <input
        type="number"
        placeholder="Exp Month"
        value={paymentData.card_details.exp_month}
        onChange={(e) => setPaymentData({
          ...paymentData,
          card_details: {
            ...paymentData.card_details,
            exp_month: parseInt(e.target.value)
          }
        })}
      />
      
      <input
        type="number"
        placeholder="Exp Year"
        value={paymentData.card_details.exp_year}
        onChange={(e) => setPaymentData({
          ...paymentData,
          card_details: {
            ...paymentData.card_details,
            exp_year: parseInt(e.target.value)
          }
        })}
      />
      
      <input
        type="text"
        placeholder="CVC"
        value={paymentData.card_details.cvc}
        onChange={(e) => setPaymentData({
          ...paymentData,
          card_details: {
            ...paymentData.card_details,
            cvc: e.target.value
          }
        })}
      />
      
      <button type="submit">Pay Now</button>
    </form>
  );
};
```

### JavaScript/Fetch Example

```javascript
// Create payment intent with card details
const createPaymentIntent = async (paymentData) => {
  try {
    const response = await fetch('/api/stripe/payment-intent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(paymentData),
    });

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error creating payment intent:', error);
    throw error;
  }
};

// Usage
const paymentData = {
  amount: 29.99,
  currency: 'usd',
  card_details: {
    number: '4242424242424242',
    exp_month: 12,
    exp_year: 2025,
    cvc: '123',
    billing_details: {
      name: 'John Doe',
      email: 'john@example.com'
    }
  },
  confirm: true
};

createPaymentIntent(paymentData)
  .then(result => {
    console.log('Success:', result);
  })
  .catch(error => {
    console.error('Error:', error);
  });
```

## Security Notes

1. **PCI Compliance**: When handling card details server-side, ensure your server is PCI compliant
2. **Environment Variables**: Keep your Stripe secret keys secure in environment variables
3. **Input Validation**: Always validate and sanitize input data
4. **HTTPS**: Use HTTPS in production for all payment-related endpoints
5. **Error Handling**: Don't expose sensitive error details to clients

## Error Handling

The API returns structured error responses:

```json
{
  "error": "Failed to create payment intent",
  "details": "Your card was declined."
}
```

Common error scenarios:
- Invalid card details
- Insufficient funds
- Card declined
- Network issues
- Invalid API keys
- Missing required parameters

## Testing

Use Stripe's test card numbers:
- `4242424242424242` - Visa (succeeds)
- `4000000000000002` - Visa (declined)
- `4000000000009995` - Visa (insufficient funds)
- `5555555555554444` - Mastercard (succeeds)

## Next Steps

1. Implement frontend card validation using the utility functions
2. Add webhook handling for payment confirmations
3. Implement customer management
4. Add support for additional payment methods (Apple Pay, Google Pay, etc.)
5. Implement subscription billing if needed