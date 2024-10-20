import { useEffect, useState } from 'react';
import { post, get } from '../services/ApiEndpoint';
import { Logout } from '../redux/AuthSlice';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import '../styles/COEDashboard.css'; // Custom CSS for styling

const COEDashboard = () => {
    const user = useSelector((state) => state.Auth.user);
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const [tasks, setTasks] = useState([]); // State for tasks

    const handleLogout = async () => {
        try {
            const response = await post('/api/auth/logout');
            if (response.status === 200) {
                dispatch(Logout());
                navigate('/login');
            }
        } catch (error) {
            console.error('Failed to log out:', error);
            alert('Logout failed, please try again.');
        }
    };

    useEffect(() => {
        const fetchTasks = async () => {
            try {
                const response = await get('/api/coe/tasks');
                setTasks(response.data);
            } catch (error) {
                console.error('Failed to fetch tasks:', error);
                alert('Could not load tasks, please try again later.');
            }
        };

        fetchTasks();
    }, []);

    const handleAssign = async (taskId, professorId) => {
        try {
            await post(`/api/coe/assign/${taskId}`, { professorId });
            alert('Task assigned successfully!');
            // Refresh tasks after assignment
            // eslint-disable-next-line no-undef
            fetchTasks();
        } catch (error) {
            console.error('Failed to assign task:', error);
            alert('Task assignment failed! Please try again.');
        }
    };

    return (
        <div className={`dashboard-container`}>
            <aside className="sidebar">
                <h2>COE Dashboard</h2>
                <div className="sidebar-buttons">
                    <button className="logout-btn" onClick={handleLogout}>Logout</button>
                </div>
            </aside>

            <main className="main-content">
                <div className="profile-section">
                    <h3>Welcome, {user?.name}!</h3>
                </div>

                <div>
                    <h3>Pending Tasks</h3>
                    {tasks.length > 0 ? (
                        tasks.map((task) => (
                            <div key={task.id}>
                                <h4>{task.subject}</h4>
                                {task.professors && task.professors.map((professor) => (
                                    <button key={professor.id} onClick={() => handleAssign(task.id, professor.id)}>
                                        Assign {professor.name}
                                    </button>
                                ))}
                            </div>
                        ))
                    ) : (
                        <p>No pending tasks available.</p>
                    )}
                </div>
            </main>
        </div>
    );
};

export default COEDashboard;
