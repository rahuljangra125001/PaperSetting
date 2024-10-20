import express from 'express';
import { getTasks, acceptTask, rejectTask } from '../controllers/panelController.js';

const PanelRoutes = express.Router();

PanelRoutes.get('/tasks', getTasks);
PanelRoutes.post('/accept/:taskId', acceptTask);
PanelRoutes.post('/reject/:taskId', rejectTask);

export default PanelRoutes;
