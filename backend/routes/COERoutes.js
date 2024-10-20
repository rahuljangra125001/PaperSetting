import express from 'express';
import { getTasks, assignTask } from '../controllers/coeController.js';
const COERoutes = express.Router();


COERoutes.get('/tasks', getTasks);
COERoutes.post('/assign/:taskId', assignTask);

export default COERoutes;
