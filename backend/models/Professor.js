import mongoose from 'mongoose';

const professorSchema = new mongoose.Schema({
    name: { type: String, required: true },
    subject: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
});

const Professor = mongoose.model('Professor', professorSchema);

export default Professor;