// middleware/verifyToken.js
import jwt from 'jsonwebtoken';
import UserModel from '../models/User.js';

// Helper function to verify token and get user
const getUserFromToken = async (req) => {
    const token = req.cookies.token; // Retrieve token from cookies

    if (!token) {
        throw new Error("Unauthorized: No token provided");
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await UserModel.findById(decoded.userId);
        if (!user) {
            throw new Error("User not found");
        }
        return user;
    } catch (error) {
        throw new Error("Invalid token");
    }
};

// COE Middleware
const isCOE = async (req, res, next) => {
    try {
        const user = await getUserFromToken(req);
        if (user.role !== 'COE') {
            return res.status(403).json({ message: 'Unauthorized: User is not COE' });
        }
        req.user = user;
        next();
    } catch (error) {
        console.error(error);
        res.status(401).json({ message: error.message });
    }
};

// Chairperson Middleware
const isChairperson = async (req, res, next) => {
    try {
        const user = await getUserFromToken(req);
        if (user.role !== 'Chairperson') {
            return res.status(403).json({ message: 'Unauthorized: User is not Chairperson' });
        }
        req.user = user;
        next();
    } catch (error) {
        console.error(error);
        res.status(401).json({ message: error.message });
    }
};

// Panel Member Middleware
const isPanelMember = async (req, res, next) => {
    try {
        const user = await getUserFromToken(req);
        if (user.role !== 'PanelMember') {
            return res.status(403).json({ message: 'Unauthorized: User is not Panel Member' });
        }
        req.user = user;
        next();
    } catch (error) {
        console.error(error);
        res.status(401).json({ message: error.message });
    }
};

// General User Middleware
const IsUser = async (req, res, next) => {
    try {
        const user = await getUserFromToken(req);
        req.user = user;
        if (!user){
            return res.status(404).json({message:"User not Found"})
        }
    } catch (error) {
        console.error(error);
        res.status(401).json({ message: error.message });
    }
};


export { isCOE, isChairperson, isPanelMember, IsUser };
