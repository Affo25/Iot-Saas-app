import Stripe from 'stripe';

// Initialize Stripe with your secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16',
});

// Function to check if Stripe is properly configured
export const isStripeConfigured = () => {
  return !!(process.env.STRIPE_SECRET_KEY && process.env.STRIPE_SECRET_KEY.length > 0);
};

// Function to get a validated Stripe instance
export const getStripe = () => {
  if (!isStripeConfigured()) {
    throw new Error('Stripe is not configured. Please check your STRIPE_SECRET_KEY environment variable.');
  }
  return stripe;
};

export default stripe;