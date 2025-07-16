/**
 * Stripe utility functions for payment processing
 */

/**
 * Validate card number using Luhn algorithm
 */
export const validateCardNumber = (cardNumber) => {
  // Remove spaces and hyphens
  const cleaned = cardNumber.replace(/[\s-]/g, '');
  
  // Check if all digits
  if (!/^\d+$/.test(cleaned)) {
    return false;
  }
  
  // Check length
  if (cleaned.length < 13 || cleaned.length > 19) {
    return false;
  }
  
  // Luhn algorithm
  let sum = 0;
  let isEven = false;
  
  for (let i = cleaned.length - 1; i >= 0; i--) {
    let digit = parseInt(cleaned[i]);
    
    if (isEven) {
      digit *= 2;
      if (digit > 9) {
        digit -= 9;
      }
    }
    
    sum += digit;
    isEven = !isEven;
  }
  
  return sum % 10 === 0;
};

/**
 * Validate expiration date
 */
export const validateExpirationDate = (month, year) => {
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth() + 1;
  const currentYear = currentDate.getFullYear();
  
  // Convert to numbers
  const expMonth = parseInt(month);
  const expYear = parseInt(year);
  
  // Check valid month
  if (expMonth < 1 || expMonth > 12) {
    return false;
  }
  
  // Check if expired
  if (expYear < currentYear || (expYear === currentYear && expMonth < currentMonth)) {
    return false;
  }
  
  return true;
};

/**
 * Validate CVC
 */
export const validateCVC = (cvc, cardBrand = '') => {
  if (!cvc || !/^\d+$/.test(cvc)) {
    return false;
  }
  
  // American Express has 4 digits, others have 3
  if (cardBrand.toLowerCase() === 'amex' || cardBrand.toLowerCase() === 'american express') {
    return cvc.length === 4;
  }
  
  return cvc.length === 3;
};

/**
 * Get card brand from card number
 */
export const getCardBrand = (cardNumber) => {
  const cleaned = cardNumber.replace(/[\s-]/g, '');
  
  // Visa
  if (/^4/.test(cleaned)) {
    return 'visa';
  }
  
  // MasterCard
  if (/^5[1-5]/.test(cleaned) || /^2[2-7]/.test(cleaned)) {
    return 'mastercard';
  }
  
  // American Express
  if (/^3[47]/.test(cleaned)) {
    return 'amex';
  }
  
  // Discover
  if (/^6/.test(cleaned)) {
    return 'discover';
  }
  
  // Diners Club
  if (/^3[0689]/.test(cleaned)) {
    return 'diners';
  }
  
  // JCB
  if (/^35/.test(cleaned)) {
    return 'jcb';
  }
  
  return 'unknown';
};

/**
 * Format card number for display
 */
export const formatCardNumber = (cardNumber) => {
  const cleaned = cardNumber.replace(/[\s-]/g, '');
  const brand = getCardBrand(cleaned);
  
  if (brand === 'amex') {
    // American Express: 4-6-5 format
    return cleaned.replace(/(\d{4})(\d{6})(\d{5})/, '$1 $2 $3');
  } else {
    // Most cards: 4-4-4-4 format
    return cleaned.replace(/(\d{4})(\d{4})(\d{4})(\d{4})/, '$1 $2 $3 $4');
  }
};

/**
 * Mask card number for display
 */
export const maskCardNumber = (cardNumber) => {
  const cleaned = cardNumber.replace(/[\s-]/g, '');
  const last4 = cleaned.slice(-4);
  const brand = getCardBrand(cleaned);
  
  if (brand === 'amex') {
    return `**** ****** *${last4}`;
  } else {
    return `**** **** **** ${last4}`;
  }
};

/**
 * Validate complete card details
 */
export const validateCardDetails = (cardDetails) => {
  const errors = {};
  
  // Validate card number
  if (!cardDetails.number || !validateCardNumber(cardDetails.number)) {
    errors.number = 'Invalid card number';
  }
  
  // Validate expiration
  if (!validateExpirationDate(cardDetails.exp_month, cardDetails.exp_year)) {
    errors.expiration = 'Invalid or expired date';
  }
  
  // Validate CVC
  const brand = getCardBrand(cardDetails.number || '');
  if (!validateCVC(cardDetails.cvc, brand)) {
    errors.cvc = 'Invalid CVC';
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    brand
  };
};

/**
 * Convert amount to Stripe format (cents)
 */
export const toStripeAmount = (amount, currency = 'usd') => {
  // Currencies with zero decimal places
  const zeroDecimalCurrencies = ['bif', 'clp', 'djf', 'gnf', 'jpy', 'kmf', 'krw', 'mga', 'pyg', 'rwf', 'ugx', 'vnd', 'vuv', 'xaf', 'xof', 'xpf'];
  
  if (zeroDecimalCurrencies.includes(currency.toLowerCase())) {
    return Math.round(amount);
  }
  
  return Math.round(amount * 100);
};

/**
 * Convert from Stripe format to regular amount
 */
export const fromStripeAmount = (amount, currency = 'usd') => {
  // Currencies with zero decimal places
  const zeroDecimalCurrencies = ['bif', 'clp', 'djf', 'gnf', 'jpy', 'kmf', 'krw', 'mga', 'pyg', 'rwf', 'ugx', 'vnd', 'vuv', 'xaf', 'xof', 'xpf'];
  
  if (zeroDecimalCurrencies.includes(currency.toLowerCase())) {
    return amount;
  }
  
  return amount / 100;
};

/**
 * Format amount for display
 */
export const formatAmount = (amount, currency = 'usd') => {
  const actualAmount = fromStripeAmount(amount, currency);
  
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(actualAmount);
};