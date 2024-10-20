import UserModel from "../models/User.js"; // Corrected 'modals' to 'models'
import bcrypt from "bcryptjs"; // Use 'bcrypt' instead of 'bcryptjs' for clarity
import crypto from "crypto";
import axios from 'axios';
import jwt from 'jsonwebtoken';

import { sendOTP } from '../utils/otpService.js';
import {
    sendVerificationEmail,
    sendResetPasswordEmail
} from '../utils/securityUtils.js';

const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit OTP
};

// Register user with email verification
export const register = async (req, res) => {
    try {
        const { username, password, email, firstName, lastName, mobile, address, profile, role } = req.body;

        // Check if username or email already exists
        const existingUser = await UserModel.findOne({ username });
        if (existingUser) {
            return res.status(400).json({ success: false, message: "Username already exists." });
        }

        const existingEmail = await UserModel.findOne({ email });
        if (existingEmail) {
            return res.status(400).json({ success: false, message: "Email already exists." });
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 12);
        const verificationToken = crypto.randomInt(100000, 1000000).toString(); // Ensure token is string

        // Create new user
        const newUser = new UserModel({
            username,
            firstName,
            lastName,
            email,
            password: hashedPassword,
            role:"User",
            mobile,
            address,
            profile,
            verificationToken,
            isVerified: false,
            verificationTokenExpiresAt: Date.now() + 24 * 60 * 60 * 1000, // 24 hours expiration
        });

        await newUser.save();

        // Send verification email
        await sendVerificationEmail(newUser.email, verificationToken);

        res.status(201).json({ 
            success: true,
            message: "User registered successfully. Please verify your email.",
        });
    } catch (error) {
        console.error("Registration Error:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

// Email Verification Handler
export const verifyEmail = async (req, res) => {
    try {
        const { email, otp } = req.body;

        const user = await UserModel.findOne({ email, verificationToken: otp });

        if (!user || user.verificationTokenExpiresAt < Date.now()) {

            if (user.verificationTokenExpiresAt < Date.now()){
                const newOtp = generateOTP(); // Implement this function to generate a new OTP
                user.verificationToken = newOtp;
                user.verificationTokenExpiresAt = Date.now() + 15 * 60 * 1000; // 15 minutes expiration

                await user.save(); // Save the updated user with new OTP and expiration time

                // Send the new OTP to the user's email
                await sendVerificationEmail(email, newOtp);

                 return res.status(400).json({
                    success: false,
                    message: "OTP is Expired. A new OTP has been sent to your email.",
            
                });
            }
            return res.status(400).json({ success: false, message: "Invalid token." });
        }

        user.isVerified = true; // Mark user as verified
        user.verificationToken = undefined; // Clear token after verification
        user.verificationTokenExpiresAt = undefined;
        await user.save();

        res.status(200).json({ success: true, message: "Email verified successfully." });
    } catch (error) {
        console.error("Email Verification Error:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

// Login user with enhanced security
export const login = async (req, res) => {
    try {
        const { identifier, password,recaptchaToken, emailOtp, smsOtp } = req.body;

        // Verify reCAPTCHA token
        const secretKey = process.env.RECAPTCHA_SECRET_KEY;
        const recaptchaResponse = await axios.post(`https://www.google.com/recaptcha/api/siteverify`, null, {
            params: {
                secret: secretKey,
                response: recaptchaToken,
            },
        });

        if (!recaptchaResponse.data.success) {
            return res.status(400).json({ success: false, message: "reCAPTCHA verification failed." });
        }

        // Check if identifier and password are provided
        if (!identifier || !password) {
            return res.status(400).json({ success: false, message: "Email/username and password are required." });
        }

        // Find the user by email or username
        const user = await UserModel.findOne({
            $or: [{ email: identifier }, { username: identifier }]
        });

        if (!user) {
            return res.status(404).json({ success: false, message: "User not found." });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ success: false, message: "Invalid credentials." });
        }

        // Check if the user is verified
        if (!user.isVerified) {
            return res.status(543).json({ success: false, message: "Please verify your email before logging in." });
        }

        // OTP Verification Logic
        if (emailOtp && smsOtp) {
            const isEmailOtpValid = await bcrypt.compare(emailOtp, user.emailOtp);
            const isSmsOtpValid = await bcrypt.compare(smsOtp, user.smsOtp);

            // Check Email OTP validity
            if (!isEmailOtpValid || Date.now() > user.emailOtpExpiresAt) {
                user.otpAttempts += 1;  // Increment attempts for email OTP
                await user.save();

                if (user.otpAttempts >= 3) {
                    return res.status(429).json({ success: false, message: "Too many incorrect Email OTP attempts. Please request a new OTP." });
                }

                return res.status(401).json({ success: false, message: "Invalid or expired Email OTP." });
            }

            // Check SMS OTP validity
            if (!isSmsOtpValid || Date.now() > user.smsOtpExpiresAt) {
                user.otpAttempts += 1;  // Increment attempts for SMS OTP
                await user.save();

                if (user.otpAttempts >= 3) {
                    return res.status(429).json({ success: false, message: "Too many incorrect SMS OTP attempts. Please request a new OTP." });
                }

                return res.status(401).json({ success: false, message: "Invalid or expired SMS OTP." });
            }

            // Both OTPs are valid, reset OTP fields and attempts
            user.emailOtp = "";
            user.emailOtpExpiresAt = "";
            user.smsOtp = "";
            user.smsOtpExpiresAt = "";
            user.otpAttempts = 0;  // Reset attempts after successful verification
            await user.save();

            // Generate tokens after successful OTP validation
            const accessToken = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
            const refreshToken = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });

            user.refreshToken = refreshToken;
            await user.save();

            res.cookie('token', accessToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'Strict',
                maxAge: 3600000,
            });

            return res.status(200).json({ success: true, message: "Login successful.", user: { role: user.role , name: user.name} });
        } else {
            // If OTPs are not provided, ask for OTP verification
            await sendOTP(user);
            return res.status(200).json({ success: true, message: "OTP sent. Please verify.", step: "OTP_REQUIRED" });
        }
    } catch (error) {
        console.error("Login Error:", error);
        return res.status(500).json({ success: false, message: "Internal server error." });
    }
};

export const isverified = async (req, res) => {
    const { identifier } = req.body;

    try {
        // Find the user by email or username
        const user = await User.findOne({
            $or: [{ email: identifier }, { username: identifier }],
        });

        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }

        // Check if the user is verified
        if (user.isVerified) {
            return res.status(200).json({ isVerified: true });
        } else {
            return res.status(200).json({ isVerified: false });
        }
    } catch (error) {
        console.error('Error checking verification status:', error);
        return res.status(500).json({ message: 'Server error. Please try again later.' });
    }
};

export const sendOtp = async (req, res) => {
    try {
        const { identifier, recaptchaToken, resend } = req.body;

        // Check if reCAPTCHA token is provided
        if (!recaptchaToken) {
            return res.status(400).json({ success: false, message: "reCAPTCHA verification is required." });
        }

        // Verify reCAPTCHA token
        const secretKey = process.env.RECAPTCHA_SECRET_KEY;
        const recaptchaResponse = await axios.post(`https://www.google.com/recaptcha/api/siteverify`, null, {
            params: {
                secret: secretKey,
                response: recaptchaToken,
            },
        });

        if (!recaptchaResponse.data.success) {
            return res.status(400).json({ success: false, message: "reCAPTCHA verification failed." });
        }

        // Find the user by email or username
        const user = await UserModel.findOne({
            $or: [{ email: identifier }, { username: identifier }]
        });

        if (!user) {
            return res.status(404).json({ success: false, message: "User not found." });
        }

        const currentTime = Date.now();

        // Handle OTP resend logic
        if (resend) {
            // Check if the resend limit has been exceeded
            if (user.otpResendTimestamp && (currentTime - user.otpResendTimestamp < 60000)) {
                return res.status(429).json({ success: false, message: "Please wait before requesting a new OTP." });
            }

            // Reset OTP attempts when resending
            user.otpAttempts = 0;
            await sendOTP(user); // Function to send OTPs
            user.otpResendTimestamp = currentTime; // Set the timestamp for resend
            await user.save();

            return res.status(200).json({ success: true, message: "New OTPs sent. Please verify.", step: "OTP_REQUIRED" });
        }

        // If it's not a resend, send OTP for the first time
        await sendOTP(user);
        return res.status(200).json({ success: true, message: "OTP sent. Please verify.", step: "OTP_REQUIRED" });
    } catch (error) {
        console.error("Send OTP Error:", error);
        return res.status(500).json({ success: false, message: "Internal server error." });
    }
};



export const checkUser = async (req, res) => {
    try {
        const user = req.user; // Assuming you have middleware that sets req.user
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        res.status(200).json({ success: true, user });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

// Forgot Password Handler
export const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;

        const user = await UserModel.findOne({ email });
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found." });
        }

        const resetToken = crypto.randomBytes(32).toString("hex");
        user.resetPasswordToken = resetToken;
        user.resetPasswordExpiresAt = Date.now() + 3600000; // 1 hour expiration
        await user.save();

        const resetLink = `https://myapp.com/reset-password/${resetToken}`;
        await sendResetPasswordEmail(user.email, resetLink);

        res.status(200).json({ success: true, message: "Reset password email sent." });
    } catch (error) {
        console.error("Forgot Password Error:", error);
        res.status(500).json({ success: false, message: "Internal server error." });
    }
};

// Reset Password Handler
export const resetPassword = async (req, res) => {
    try {
        const { token, newPassword } = req.body;

        const user = await UserModel.findOne({ resetPasswordToken: token });
        if (!user || user.resetPasswordExpiresAt < Date.now()) {
            return res.status(400).json({ success: false, message: "Invalid or expired token." });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 12);
        user.password = hashedPassword;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpiresAt = undefined;
        await user.save();

        res.status(200).json({ success: true, message: "Password reset successful." });
    } catch (error) {
        console.error("Reset Password Error:", error);
        res.status(500).json({ success: false, message: "Internal server error." });
    }
};

// Logout user
export const logout = async (req, res) => {
    try {
        const token = req.cookies.token;
        if (!token) {
            return res.status(400).json({ success: false, message: "No token found." });
        }

        // Invalidate the refresh token (if used)
        const user = await UserModel.findOne({ refreshToken: token });
        if (user) {
            user.refreshToken = undefined;
            await user.save();
        }

        res.clearCookie("token");
        res.status(200).json({ success: true, message: "Logout successful." });
    } catch (error) {
        console.error("Logout Error:", error);
        res.status(500).json({ success: false, message: "Internal server error." });
    }
};

export const checkEmail = async (req, res) => {
    try {
      const { email } = req.body;
  
      if (!email) {
        return res.status(400).json({ success: false, message: 'Email is required' });
      }
  
      // Check if the email exists in the database
      const existingUser = await UserModel.findOne({ email });
  
      if (existingUser) {
        return res.status(200).json({ success: true, exists: true, message: 'Email already in use' });
      }
  
      return res.status(200).json({ success: true, exists: false, message: 'Email is available' });
    } catch (error) {
      console.error("Error checking email:", error);
      return res.status(500).json({ success: false, message: 'Internal server error' });
    }
  };
