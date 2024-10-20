import express from 'express';
import { isCOE, isChairperson, isPanelMember, IsUser } from '../middleware/verifyToken.js';

const protectedRoutes  = express.Router();

// Example route for COE only
protectedRoutes .get('/COEDashboard', isCOE, (req, res) => {
    res.status(200).json({ message: `Welcome, COE ${req.user.username}` });
});

// Example route for Chairperson only
protectedRoutes .get('/ChairpersonDashboard', isChairperson, (req, res) => {
    res.status(200).json({ message: `Welcome, Chairperson ${req.user.username}` });
});

// Example route for Panel Member only
protectedRoutes .get('/PanelDashboard', isPanelMember, (req, res) => {
    res.status(200).json({ message: `Welcome, Panel Member ${req.user.username}` });
});

// Example route for any authenticated user
protectedRoutes .get('/UserDashboard', IsUser, (req, res) => {
    res.status(200).json({ message: `Welcome, ${req.user.username}` });
});

export default protectedRoutes ;
