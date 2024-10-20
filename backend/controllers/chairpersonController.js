import Professor from '../models/Professor.js';
import multer from 'multer';
import path from'path';
// import fs from 'fs';

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);
    }
});

export const upload = multer({ storage });

export const uploadHandler = async (req, res) => {
    try {
        const professorsData = JSON.parse(req.body.professors);
        const syllabusPath = path.join(__dirname, 'uploads', req.files.syllabus[0].filename);
        const schemesPath = path.join(__dirname, 'uploads', req.files.schemes[0].filename);

        const professors = await Professor.insertMany(professorsData);

        // Implement encryption for syllabus and schemes if needed

        res.status(201).send({ message: 'Files uploaded and professors saved successfully!', professors });
    } catch (error) {
        console.error(error);
        res.status(500).send({ message: 'Error uploading data', error });
    }
};

