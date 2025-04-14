// models/DeviceLog.js
import mongoose from 'mongoose';

const deviceLogSchema = new mongoose.Schema({
  device_code: {
    type: String,
    required: true,
    trim: true,
  },
  humidity: {
    type: Number,
    required: true,
    default: 0,
  },
  temperature: {
    type: Number,
    required: true,
    default: 0,
  },
  meta: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
  created_at: {
    type: Date,
    default: Date.now,
    immutable: true,
  },
  updated_at: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: false,
});

export default mongoose.models.DeviceLog || mongoose.model('DeviceLog', deviceLogSchema);
