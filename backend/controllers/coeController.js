import Task from '../models/Task.js';

export const getTasks = async (req, res) => {
    try {
        const tasks = await Task.find({ status: 'pending' });
        res.status(200).json(tasks);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching tasks', error });
    }
};

export const assignTask = async (req, res) => {
    const { taskId } = req.params;
    const { professorId } = req.body; // Get the professor ID from the request body

    try {
        const task = await Task.findByIdAndUpdate(taskId, { professorId, status: 'assigned' });
        res.status(200).json(task);
    } catch (error) {
        res.status(500).json({ message: 'Error assigning task', error });
    }
};

