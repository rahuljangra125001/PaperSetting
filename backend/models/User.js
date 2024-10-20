import mongoose from "mongoose";

const Schema = mongoose.Schema;

const userSchema = new Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true, minlength: 8 },
    email: { type: String, required: true, unique: true },
    mobile: { type: String, required: true },
    role: { type: String, enum: ['COE', 'Chairperson', 'PanelMember', 'User'], default: 'User' },
    isVerified: { type: Boolean, default: false },
    refreshToken: { type: String },
    lastLogin: { type: Date, default: Date.now },
    otpAttempts: { type: Number, default: 0 },  // Track OTP attempts

    // Fields for Email OTP
    emailOtp: { type: String },
    emailOtpExpiresAt: { type: Date },
    
    // Fields for SMS OTP
    smsOtp: { type: String },
    smsOtpExpiresAt: { type: Date },

    otpSentAt: { type: Date },  // Tracks when OTPs were last sent

    // Password reset and email verification tokens (if applicable)
    resetPasswordToken: String,
    resetPasswordExpiresAt: Date,
    verificationToken: String,
    verificationTokenExpiresAt: Date,
}, { timestamps: true });



const UserModel = mongoose.model('User', userSchema);
export default UserModel;
