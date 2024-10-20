import express from "express";
import helmet from "helmet";
import mongoose from "mongoose";
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import AuthRouter from "./routes/AuthRoutes.js";
import COERoutes from "./routes/COERoutes.js";
import ChairpersonRoutes from "./routes/ChairpersonRoutes.js";
import PanelRoutes from "./routes/PanelRoutes.js";
import { authenticateToken } from './middleware/authMiddleware.js';
import xssClean from 'xss-clean';
import hpp from 'hpp';
import mongoSanitize from 'express-mongo-sanitize';
import compression from 'compression';
import csrf from 'csurf';
import cors from 'cors';
import deviceInfoMiddleware from './middleware/deviceInfo.js';
import { Server } from 'socket.io';
import winston from 'winston'; // For error logging
import { createStream } from 'rotating-file-stream'; // Log rotation
import morgan from 'morgan'; // Import morgan for logging HTTP requests

dotenv.config();

const PORT = process.env.PORT || 4000;

// Database connection
import DbCon from './utils/db.js';
DbCon();

// Initialize the app
const app = express();

// CORS configuration to allow frontend requests
const corsOptions = {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    methods: 'GET,POST,PUT,DELETE,OPTIONS',
    credentials: true, // Enable cookies from frontend
    optionsSuccessStatus: 200,
};
app.use(cors(corsOptions));

// Middleware for device information
app.use(deviceInfoMiddleware);

// Body parser middleware for handling JSON payloads
app.use(express.json()); // Replacing bodyParser.json()

// Security middleware
app.use(helmet({
    contentSecurityPolicy: false, // You can customize this based on your app's requirements
}));
app.use(compression());
app.use(cookieParser());
app.use(xssClean());
app.use(mongoSanitize());
app.use(hpp());

// Rate limiting for API routes and stricter rate limiting for login-related routes
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit to 100 requests per window per IP
    message: 'Too many requests, please try again later.',
});
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5, // Limit to 5 login attempts per 15 minutes per IP
    message: 'Too many login attempts, please try again later.',
});
app.use('/api/auth/login', authLimiter); // Apply stricter limits to login route
app.use('/api', apiLimiter);

// CSRF protection using cookie-based tokens
const csrfProtection = csrf({ cookie: true });
app.get('/api/csrf-token', csrfProtection, (req, res) => {
    res.json({ csrfToken: req.csrfToken() });
});

// Socket.io setup
const server = app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
const io = new Server(server);
io.on('connection', (socket) => {
    console.log('A user connected');
    socket.emit('newNotification', { message: 'Welcome to COE Dashboard!' });
    socket.on('disconnect', () => {
        console.log('User disconnected');
    });
});

// Winston logger setup for error logging
const logger = winston.createLogger({
    level: 'error',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    ),
    transports: [
        new winston.transports.Console(),
        new winston.transports.File({ filename: 'error.log' }) // Save errors in a log file
    ],
});

// Rotating log file for requests using rotating-file-stream
const accessLogStream = createStream('access.log', {
    size: '10M', // Rotate logs every 10MB
    interval: '1d', // Rotate daily
    compress: 'gzip' // Compress rotated files
});

// Use morgan middleware for logging HTTP requests
app.use(morgan('combined', { stream: accessLogStream })); // Combined format with rotating logs

// Test server route
app.get('/', (req, res) => {
    res.send('Server is running');
});

// Routes
app.use('/api/auth', AuthRouter);
app.use('/api/coe', COERoutes);
app.use('/api/chairperson', ChairpersonRoutes);
app.use('/api/panel', PanelRoutes);


// Example protected route with authentication
app.use('/api/protected', authenticateToken, (req, res) => {
    res.send('This is a protected route.');
});

// Global error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    logger.error({
        message: err.message,
        stack: err.stack,
        route: req.originalUrl,
        method: req.method,
        statusCode: err.status || 500
    });
    const status = err.status || 500;
    res.status(status).send({ success: false, message: err.message || "Internal server error." });
});

// Handle unhandled promise rejections globally
process.on('unhandledRejection', (error) => {
    console.error('Unhandled promise rejection:', error);
    logger.error('Unhandled promise rejection:', error);
});

// Graceful server shutdown
process.on('SIGINT', () => {
    console.log('Shutting down server...');
    server.close(() => {
        console.log('Server closed');
        mongoose.connection.close();
        process.exit(0);
    });
});
