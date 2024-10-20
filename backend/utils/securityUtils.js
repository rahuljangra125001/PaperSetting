import nodemailer from 'nodemailer';
import pkg from 'twilio'; // Directly import Twilio
import crypto from 'crypto';
import dotenv from 'dotenv';
import UserModel from '../models/User.js';

dotenv.config();

const { Twilio } = pkg;

// Create the Nodemailer transporter using Gmail and an App Password
const transporter = nodemailer.createTransport({
    service: 'gmail',
    host: 'smtp.gmail.com',
    port: 587,
    secure: false, // Set to true if you're using port 465
    auth: {
        user: process.env.EMAIL_USER, // Your Gmail address
        pass: process.env.EMAIL_PASS, // Your Gmail App password
    },
});

// Twilio setup for sending SMS
const twilioClient = new Twilio(process.env.TWILIO_SID, process.env.TWILIO_AUTH_TOKEN);

// Generate a random 6-digit OTP
const generateOTP = () => crypto.randomInt(100000, 999999).toString(); // Ensure it's a string

// Send Security Alert Email
export const sendSecurityAlert = async (email, ip, deviceInfo) => {
    try {
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Security Alert: New Login Detected',
            html: `
                <h4>Security Alert</h4>
                <p>We noticed a login to your account from a new device or IP:</p>
                <ul>
                    <li><strong>IP Address:</strong> ${ip}</li>
                    <li><strong>Device:</strong> ${deviceInfo.name}</li>
                    <li><strong>OS:</strong> ${deviceInfo.os}</li>
                </ul>
                <p>If this was not you, please secure your account immediately.</p>
            `,
        };
        await transporter.sendMail(mailOptions);
        console.log(`Security alert sent to ${email}`);
    } catch (error) {
        console.error(`Error sending security alert email to ${email}:`, error.message);
    }
};

// Send OTP to Email
export const sendEmailOTP = async (email, otp) => {
    try {
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Your OTP Code',
            html: `
                <h4>Verification Code</h4>
                <p>Your OTP for multi-factor authentication is:</p>
                <h2>${otp}</h2>
                <p>This code is valid for 10 minutes. Do not share this with anyone.</p>
            `,
        };
        await transporter.sendMail(mailOptions);
        console.log(`OTP email sent to ${email}`);
    } catch (error) {
        console.error(`Error sending email OTP to ${email}:`, error.message);
    }
};

// Send OTP to Phone (via Twilio SMS)
export const sendPhoneOTP = async (phone, otp) => {
    try {
        await twilioClient.messages.create({
            body: `Your OTP for multi-factor authentication is: ${otp}. It is valid for 10 minutes.`,
            from: process.env.TWILIO_PHONE_NUMBER, // Your Twilio number
            to: phone,
        });
        console.log(`OTP SMS sent to ${phone}`);
    } catch (error) {
        console.error(`Error sending SMS OTP to ${phone}:`, error.message);
    }
};

// Send Verification Email for Account Activation
export const sendVerificationEmail = async (email, verificationToken) => {
    try {
        const verificationLink = `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`;

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Email Verification - Activate Your Account',
            html: `
                <h4>Welcome to Our Platform!</h4>
                <p>Please verify your email by clicking the link below:</p>
                <a href="${verificationLink}">Verify Email</a>
                <p>This link will expire in 24 hours. If you did not register for an account, you can ignore this email.</p>
            `,
        };
        await transporter.sendMail(mailOptions);
        console.log(`Verification email sent to ${email}`);
    } catch (error) {
        console.error(`Error sending verification email to ${email}:`, error.message);
    }
};

// Verify OTP for MFA
export const verifyOTP = async (userId, otp) => {
    try {
        const user = await UserModel.findById(userId);

        if (!user) {
            console.log(`User with ID ${userId} not found`);
            return false; // User not found
        }

        const currentTime = Date.now();
        const otpExpiryTime = user.otpExpiresAt;

        // Check if OTP is still valid
        if (currentTime > otpExpiryTime) {
            console.log(`OTP for user ${userId} expired`);
            return false; // OTP expired
        }

        // Check if OTP matches
        if (user.otp === otp) {
            // Clear OTP after successful verification
            user.otp = null;
            user.otpExpiresAt = null;
            await user.save();
            console.log(`OTP for user ${userId} verified successfully`);
            return true;
        }

        console.log(`Invalid OTP for user ${userId}`);
        return false;
    } catch (error) {
        console.error(`Error verifying OTP for user ${userId}:`, error.message);
        return false;
    }
};

// Generate and send OTP for MFA (both phone and email)
export const sendOTP = async (user) => {
    try {
        const otp = generateOTP();
        const otpExpiry = Date.now() + 10 * 60 * 1000; // OTP expires in 10 minutes

        // Save OTP and expiration time to user record
        user.otp = otp;
        user.otpExpiresAt = otpExpiry;
        await user.save();

        // Send OTP to both email and phone
        await Promise.all([
            sendEmailOTP(user.email, otp),
            sendPhoneOTP(user.mobile, otp),
        ]);
        console.log(`OTP sent to both email and phone for user ${user._id}`);
    } catch (error) {
        console.error(`Error sending OTP for user ${user._id}:`, error.message);
    }
};

// Send Reset Password Email
export const sendResetPasswordEmail = async (email, resetLink) => {
    try {
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Reset Password Request',
            text: `You requested to reset your password. Click the link below to reset your password:\n${resetLink}`,
        };

        await transporter.sendMail(mailOptions);
        console.log(`Reset password email sent to ${email}`);
    } catch (error) {
        console.error(`Error sending reset password email to ${email}:`, error.message);
    }
};
