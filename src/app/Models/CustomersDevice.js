// models/CustomersDevices.js
import mongoose from 'mongoose';

const CustomersDeviceSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  device_serial_number: {
    type: String,
    required: true,
    trim: true,
  },
  device_code: {
    type: String,
    required: true,
    trim: true,
  },
  customer_id: {
    type: String,
    required: true,
    trim: true,
  },
  status: {
    type: String,
    enum: ['Active', 'Inactive'],
    default: 'Active',
  },
  description: {
    type: String,
    required: true,
    trim: true,
    default: '',
  },
  created_at: {
    type: Date,
    default: Date.now,
    immutable: true,
  },
}, {
  timestamps: false,
});

// Ensure the model is exported as 'CustomersDevices'
export default mongoose.models.CustomersDevices || mongoose.model('CustomersDevices', CustomersDeviceSchema);
