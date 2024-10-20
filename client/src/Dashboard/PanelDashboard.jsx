import { useEffect, useState } from 'react';
import { post, get } from '../services/ApiEndpoint';
import { Logout } from '../redux/AuthSlice';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
// import '../styles/PanelDashboard.css'; // Include your custom styles

const PanelDashboard = () => {
    const user = useSelector((state) => state.Auth.user);
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const [tasks, setTasks] = useState([]);

    useEffect(() => {
        const fetchTasks = async () => {
            try {
                const response = await get('/api/panel/tasks');
                setTasks(response.data);
            } catch (error) {
                console.error('Failed to fetch tasks:', error);
                alert('Could not load tasks, please try again later.');
            }
        };

        fetchTasks();
    }, []);

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

    const handleAccept = async (taskId) => {
        try {
            await post(`/api/panel/accept/${taskId}`);
            alert('Task accepted successfully!');
            // Refresh tasks after accepting
            // eslint-disable-next-line no-undef
            fetchTasks();
        } catch (error) {
            console.error('Failed to accept task:', error);
            alert('Task acceptance failed! Please try again.');
        }
    };

    const handleReject = async (taskId) => {
        try {
            await post(`/api/panel/reject/${taskId}`);
            alert('Task rejected successfully!');
            // Refresh tasks after rejecting
            // eslint-disable-next-line no-undef
            fetchTasks();
        } catch (error) {
            console.error('Failed to reject task:', error);
            alert('Task rejection failed! Please try again.');
        }
    };

    return (
        <div className="dashboard-container">
            <h1>Panel Member Dashboard</h1>
            <div className="profile-section">
                <h3>Welcome, {user?.name}!</h3>
            </div>
            <h3>Your Tasks</h3>
            {tasks.length > 0 ? (
                tasks.map((task) => (
                    <div key={task.id} className="task-item">
                        <h4>{task.subject}</h4>
                        <button onClick={() => handleAccept(task.id)}>Accept</button>
                        <button onClick={() => handleReject(task.id)}>Reject</button>
                    </div>
                ))
            ) : (
                <p>No tasks available at the moment.</p>
            )}
            <button className="logout-btn" onClick={handleLogout}>Logout</button>
        </div>
    );
};

export default PanelDashboard;
