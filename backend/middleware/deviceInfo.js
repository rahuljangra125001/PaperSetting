// middleware/deviceInfo.js

import device from 'express-device';

const deviceInfoMiddleware = (req, res, next) => {
    const userAgent = req.headers['user-agent'];
    device.capture(req);
    if (!userAgent) {
        req.device = { name: 'Unknown' }; // Default value if no user agent is found
    } else {
        req.device = {
            name: userAgent, // Or parse it as needed
        };
    }

    next();
};



// const deviceInfoMiddleware = (req, res, next) => {
//     try {
//         // Capture device information
//         device.capture(req);

//         // Extract device details
//         const { device: deviceDetails } = req;

//         // Structuring device info for easier access
//         req.deviceInfo = {
//             name: deviceDetails.name || 'unknown',
//             type: deviceDetails.type || 'unknown',
//             version: deviceDetails.version || 'unknown',
//             os: deviceDetails.os || 'unknown',
//             isMobile: deviceDetails.isMobile || false,
//             isTablet: deviceDetails.isTablet || false,
//             isDesktop: deviceDetails.isDesktop || false,
//         };

//         // Log the device information (for debugging or monitoring)
//         console.log('Device Info:', req.deviceInfo);

//         // Proceed to the next middleware
//         next();
//     } catch (error) {
//         // Handle errors gracefully
//         console.error('Error capturing device information:', error);
//         // Optionally, attach an error message to the request object
//         req.deviceInfo = { error: 'Failed to capture device information' };
//         next();
//     }
// };

export default deviceInfoMiddleware;
