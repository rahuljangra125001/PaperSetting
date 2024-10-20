import Task from '../models/Task.js'; // Assume you have a Task model

export const getTasks = async (req, res) => {
    try {
        const tasks = await Task.find({ status: 'assigned', professorId: req.user.id }); // Assuming req.user.id is the logged-in panel member's ID
        res.status(200).json(tasks);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching tasks', error });
    }
};

export const acceptTask = async (req, res) => {
    const { taskId } = req.params;

    try {
        const task = await Task.findByIdAndUpdate(taskId, { status: 'accepted' });
        res.status(200).json(task);
    } catch (error) {
        res.status(500).json({ message: 'Error accepting task', error });
    }
};

export const rejectTask = async (req, res) => {
    const { taskId } = req.params;

    try {
        await Task.findByIdAndDelete(taskId); // Assuming you want to remove the task on rejection
        res.status(200).json({ message: 'Task rejected successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error rejecting task', error });
    }
};
