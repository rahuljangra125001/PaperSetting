import express from 'express';
import { upload, uploadHandler } from '../controllers/chairpersonController.js';


const ChairpersonRoutes = express.Router();

ChairpersonRoutes.post('/upload', upload.fields([{ name: 'syllabus' }, { name: 'schemes' }]), uploadHandler);

export default ChairpersonRoutes;
