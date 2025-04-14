// models/Customer.js
import mongoose from 'mongoose';

const deviceLogSchema = new mongoose.Schema({

  
  device_code: {
    type: text,
    default: "",
  },
  humidity: {
    type: Number,
    default: 0,
  },
  temperature: {
    type: Number,
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

}, {
  timestamps: false,
});


export default mongoose.models.deviceLog || mongoose.model('deviceLog', deviceLogSchema);
