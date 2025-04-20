import mongoose from 'mongoose';

const ReportsSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Report title is required'],
    trim: true,
  },
  description: {
    type: String,
    trim: true,
  },
  customer_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customers',
    required: [true, 'Customer ID is required'],
  },
  device_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Devices',
  },
  report_type: {
    type: String,
    required: [true, 'Report type is required'],
    enum: ['Daily', 'Weekly', 'Monthly', 'Custom'],
  },
  report_data: {
    type: mongoose.Schema.Types.Mixed,
  },
  date: {
    type: Date,
    default: Date.now,
  },
  file_url: {
    type: String,
  },
  status: {
    type: String,
    enum: ['Pending', 'Completed', 'Failed'],
    default: 'Pending',
  },
}, {
  timestamps: true,
});

const Reports = mongoose.models.Reports || mongoose.model('Reports', ReportsSchema);

export default Reports; 