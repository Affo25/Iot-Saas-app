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


    created_at: {
        type: Date,
        default: Date.now,
        immutable: true,
    },
}, {
    timestamps: false,
});

export default mongoose.models.systemUsers || mongoose.model('systemUsers', systemUsersSchema);
