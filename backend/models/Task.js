import mongoose from 'mongoose';

const taskSchema = new mongoose.Schema({
    subject: { type: String, required: true },
    status: { type: String, enum: ['pending', 'assigned', 'accepted'], default: 'pending' },
    professorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Professor' }
});

const Task = mongoose.model('Task', taskSchema);

export default Task;