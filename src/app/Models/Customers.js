// models/Customer.js
import { type } from 'jquery';
import mongoose from 'mongoose';

const customerSchema = new mongoose.Schema({
  full_name: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    match: [/.+\@.+\..+/, 'Please enter a valid email'], // Basic email validation
  },
  contact: {
    type: String,
    required: true,
    trim: true,
  },
  package_name: {
    type: String,
    required: true,
    enum: ['Basic', 'Standard', 'Premium'], // Example package types (modify as needed)
  },
  package_expiry: {
    type: Date,
    required: true,
  },
  status: {
    type: String,
    enum: ['Active', 'Inactive', 'Pending', 'Expired'],
    default: 'Active',
  },
  password: {
    type: String,
    required: true,
    minlength: 6,  // Ensures the password is at least 6 characters
    maxlength: 10,  // Ensures the password does not exceed 6 characters
  },
  created_at: {
    type: Date,
    default: Date.now, // Automatically set on creation
    immutable: true,   // Prevents modification after creation
  },
  login_time: {
    type: Date,
    default: null,     // Will be updated on login
  },
  devices:{
    type:[String],
    default:[]
  },
}, {
  timestamps: false,   // Disable default Mongoose timestamps (since we have custom ones)
});

// Update login_time on every successful login
customerSchema.methods.updateLoginTime = async function() {
  this.login_time = new Date();
  await this.save();
};

export default mongoose.models.Customers || mongoose.model('Customers', customerSchema);