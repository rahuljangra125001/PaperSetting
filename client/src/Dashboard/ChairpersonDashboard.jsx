import { useState } from 'react';
import { post } from '../services/ApiEndpoint';
import { Logout } from '../redux/AuthSlice';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
// import '../styles/ChairpersonDashboard.css'; // Custom styles

const ChairpersonDashboard = () => {
    const user = useSelector((state) => state.Auth.user);
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const [professors, setProfessors] = useState([{ name: '', subject: '', email: '', phone: '' }]);
    const [syllabus, setSyllabus] = useState(null);
    const [schemes, setSchemes] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleChange = (index, event) => {
        const { name, value } = event.target;
        const newProfessors = [...professors];
        newProfessors[index][name] = value;
        setProfessors(newProfessors);
    };

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

    const handleAddProfessor = () => {
        setProfessors([...professors, { name: '', subject: '', email: '', phone: '' }]);
    };

    const handleRemoveProfessor = (index) => {
        const newProfessors = professors.filter((_, i) => i !== index);
        setProfessors(newProfessors);
    };

    const handleFileUpload = (e) => {
        const { name, files } = e.target;
        if (name === 'syllabus') setSyllabus(files[0]);
        if (name === 'schemes') setSchemes(files[0]);
    };

    const handleSubmit = async () => {
        if (professors.some(prof => !prof.name || !prof.subject || !prof.email || !prof.phone) || !syllabus || !schemes) {
            setError('Please fill in all fields and upload both files.');
            return;
        }
        setError('');
        setLoading(true);
        
        const formData = new FormData();
        formData.append('professors', JSON.stringify(professors));
        formData.append('syllabus', syllabus);
        formData.append('schemes', schemes);

        try {
            await post('/api/chairperson/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            alert('Data submitted successfully!');
            // Optionally, reset the form here
            setProfessors([{ name: '', subject: '', email: '', phone: '' }]);
            setSyllabus(null);
            setSchemes(null);
        } catch (error) {
            console.error('Submission failed:', error);
            alert('Submission failed! Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="dashboard-container">
            <h1>Chairperson Dashboard</h1>
            <h3>Welcome, {user?.name}!</h3>
            <button className="logout-btn" onClick={handleLogout}>Logout</button>
            <h3>Professors List</h3>
            {error && <p className="error-message">{error}</p>}
            {professors.map((professor, index) => (
                <div key={index} className="professor-item">
                    <input type="text" name="name" placeholder="Name" value={professor.name} onChange={(e) => handleChange(index, e)} required />
                    <input type="text" name="subject" placeholder="Subject" value={professor.subject} onChange={(e) => handleChange(index, e)} required />
                    <input type="email" name="email" placeholder="Email" value={professor.email} onChange={(e) => handleChange(index, e)} required />
                    <input type="text" name="phone" placeholder="Phone" value={professor.phone} onChange={(e) => handleChange(index, e)} required />
                    <button onClick={() => handleRemoveProfessor(index)}>Remove</button>
                </div>
            ))}
            <button onClick={handleAddProfessor}>Add Professor</button>
            <div>
                <label>Syllabus (PDF):</label>
                <input type="file" name="syllabus" accept="application/pdf" onChange={handleFileUpload} required />
            </div>
            <div>
                <label>Schemes (PDF):</label>
                <input type="file" name="schemes" accept="application/pdf" onChange={handleFileUpload} required />
            </div>
            <button onClick={handleSubmit} disabled={loading}>
                {loading ? 'Submitting...' : 'Submit to COE'}
            </button>
        </div>
    );
};

export default ChairpersonDashboard;
