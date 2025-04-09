// models/Customer.js
import mongoose from 'mongoose';

const DeviceSchema = new mongoose.Schema({
    device_name: {
    type: String,
    required: true,
    trim: true,
  },
  device_code: {
    type: String,
    required: true,
    trim: true,
  },
 
  description: {
    type: String,
    required: true,
    trim: true,
  },
  status: {
    type: String,
    enum: ['Active', 'Inactive'],
    default: 'Active',
  },
  created_at: {
    type: Date,
    default: Date.now, // Automatically set on creation
    immutable: true,   // Prevents modification after creation
  },
 
}, {
  timestamps: false,   // Disable default Mongoose timestamps (since we have custom ones)
});



export default mongoose.models.Devices || mongoose.model('Devices', DeviceSchema);