import express from 'express';
import { register,sendOtp,isverified, checkEmail, login, verifyEmail, forgotPassword, resetPassword, logout ,checkUser} from '../controllers/AuthController.js';
import rateLimit from 'express-rate-limit';
import {IsUser} from "../middleware/verifyToken.js"

const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // Limit each IP to 5 requests per windowMs
    message: "Too many login attempts from this IP, please try again later."
});


const AuthRouter = express.Router();

// Registration route
AuthRouter.post('/register', register);

AuthRouter.post('/check-email', checkEmail);



// Email verification route
AuthRouter.post('/verify-email', verifyEmail);

// Login route
AuthRouter.post('/login', loginLimiter, login); // Apply rate limiting if needed
AuthRouter.post('/check-verification', isverified);
AuthRouter.post('/send-otp', sendOtp);

AuthRouter.get('/CheckUser', IsUser, checkUser);


// Forgot password route
AuthRouter.post('/forgot-password', forgotPassword);

// Reset password route
AuthRouter.post('/reset-password', resetPassword);

// Logout route
AuthRouter.post('/logout', logout);

export default AuthRouter;
