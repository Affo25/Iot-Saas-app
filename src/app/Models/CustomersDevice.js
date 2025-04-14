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
    type: Number,
    enum: [0, 1],
    default: 0,
  },
  description: {
    type: String,
    required: true,
    trim: true,
    default: '',
  },
  m1: {
    type: String,
    required: true,
    trim: true,
    default: '',
  },
  m2: {
    type: String,
    required: true,
    trim: true,
    default: '',
  },
  inp1: {
    type: String,
    required: true,
    trim: true,
    default: '',
  },
  inp2: {
    type: String,
    required: true,
    trim: true,
    default: '',
  },
  inp3: {
    type: String,
    required: true,
    trim: true,
    default: '',
  },
  inp4: {
    type: String,
    required: true,
    trim: true,
    default: '',
  },
  outp1: {
    type: String,
    required: true,
    trim: true,
    default: '',
  },
  outp2: {
    type: String,
    required: true,
    trim: true,
    default: '',
  },
  outp3: {
    type: String,
    required: true,
    trim: true,
    default: '',
  },
  outp4: {
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
  updated_at: {
    type: Date,
    default: Date.now,
    immutable: true,
  },
}, {
  timestamps: false,
});

// Ensure the model is exported as 'CustomersDevices'
export default mongoose.models.CustomersDevices || mongoose.model('CustomersDevices', CustomersDeviceSchema);
