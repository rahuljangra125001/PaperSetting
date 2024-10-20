import nodemailer from 'nodemailer';
import twilio from 'twilio';
import bcrypt from "bcryptjs"; 
import UserModel from '../models/User.js';
import dotenv from 'dotenv';
dotenv.config();


const formatPhoneNumber = (phoneNumber) => {
    // Check if the phone number starts with a + (for E.164 format)
    if (!phoneNumber.startsWith('+')) {
        // Assuming you want to send to Indian numbers, prepend +91 for India
        return `+91${phoneNumber}`;
    }
    return phoneNumber;
};


// Twilio setup
const twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

// Nodemailer setup
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASSWORD
    }
});

const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit OTP
};

export const sendOTP = async (user) => {
    try {
        const emailOtp = generateOTP();
        const smsOtp = generateOTP();

        // Hash both OTPs before storing
        user.emailOtp = await bcrypt.hash(emailOtp, 10);
        user.emailOtpExpiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes expiration
        user.smsOtp = await bcrypt.hash(smsOtp, 10);
        user.smsOtpExpiresAt = Date.now() + 5 * 60 * 1000;   // 5 minutes expiration
        user.otpSentAt = Date.now();
        user.otpAttempts = 0; // Reset OTP attempts
        await user.save();

        // Send OTP via Email
        const mailOptions = {
            from: process.env.GMAIL_USER,
            to: user.email,
            subject: 'Your Email OTP for Login',
            text: `Your Email OTP is ${emailOtp}. It is valid for 5 minutes.`
        };
        await transporter.sendMail(mailOptions);

        // Send OTP via SMS
        const formattedPhoneNumber = formatPhoneNumber(user.mobile);
        await twilioClient.messages.create({
            body: `Your SMS OTP is ${smsOtp}. It is valid for 5 minutes.`,
            from: process.env.TWILIO_PHONE_NUMBER,
            to: formattedPhoneNumber
        });

        return true;
    } catch (error) {
        console.error('Error sending OTPs:', error);
        return false;
    }
};
