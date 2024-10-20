// middleware/logger.js

import morgan from 'morgan';
import fs from 'fs';
import path from 'path';
import { format } from 'date-fns';

// Create a function to get the __dirname equivalent
const __dirname = path.dirname(new URL(import.meta.url).pathname);

// Create a write stream (in append mode) for access logs
const accessLogStream = fs.createWriteStream(path.join(__dirname, '../logs/access.log'), { flags: 'a' });
const errorLogStream = fs.createWriteStream(path.join(__dirname, '../logs/error.log'), { flags: 'a' });

// Request logging middleware
export const requestLogger = morgan('combined', {
    stream: accessLogStream,
});

// Error logging middleware
export const errorLogger = (err, req, res, next) => {
    const timestamp = format(new Date(), 'yyyy-MM-dd HH:mm:ss');
    const logMessage = `${timestamp} - ERROR: ${err.message} - ${req.method} ${req.originalUrl} - IP: ${req.ip}\n`;

    // Log to error log file
    errorLogStream.write(logMessage);
    
    // Log to the console
    console.error(logMessage);

    // Pass the error to the next middleware
    next(err);
};
