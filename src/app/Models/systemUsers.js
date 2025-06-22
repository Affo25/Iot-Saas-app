// models/DeviceLog.js
import mongoose from 'mongoose';

const systemUsersSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true,
        match: [/.+\@.+\..+/, 'Please enter a valid email'], // Basic email validation
    },
    userRole: {
        type: String,
        enum: ['Admin', 'Customer'],
        default: 'Admin',
    },
    password: {
        type: String,
        required: true,
        minlength: 6,  // Ensures the password is at least 6 characters
        maxlength: 10,  // Ensures the password does not exceed 6 characters
    },
    customer_id: {
        type: String,
        default: "No Customer",
        required: false,
    },

    created_at: {
        type: Date,
        default: Date.now,
        immutable: true,
    },
}, {
    timestamps: false,
});

// Clear the model if it exists to ensure schema changes are applied
if (mongoose.models.systemUsers) {
  delete mongoose.models.systemUsers;
}

export default mongoose.model('systemUsers', systemUsersSchema);
