import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { post } from '../services/ApiEndpoint';
import { toast } from 'react-hot-toast';
import ReCAPTCHA from 'react-google-recaptcha'; // Google ReCAPTCHA
import { motion } from 'framer-motion'; // Framer Motion for animations
import {
  TextField,
  Button,
  Box,
  Typography,
  Grid,
  InputAdornment,
  CircularProgress,
} from '@mui/material';
import { CheckCircle, Error } from '@mui/icons-material';
import zxcvbn from 'zxcvbn';
import "../styles/register.css";

export default function Register() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: '',
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    mobile: '',
    address: '',
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [captchaValid, setCaptchaValid] = useState(false);
  const [isEmailValid, setIsEmailValid] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(null);
  const [profile, setProfile] = useState(null); // For profile picture

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleEmailChange = async (e) => {
    const value = e.target.value;
    setFormData({ ...formData, email: value });
    setIsLoading(true);

    try {
      const response = await post('/api/auth/check-email', { email: value });
      setIsEmailValid(!response.data.exists);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordChange = (e) => {
    const value = e.target.value;
    setFormData({ ...formData, password: value });
    const result = zxcvbn(value);
    setPasswordStrength(result);
  };

  // eslint-disable-next-line no-unused-vars
  const handleCaptcha = (value) => {
    setCaptchaValid(true); // Validate when the user successfully completes the captcha
  };

  const handleProfileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfile(file); // Store the selected file
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.username) newErrors.username = 'Username is required';
    if (!formData.email) newErrors.email = 'Email is required';
    if (!formData.password) newErrors.password = 'Password is required';
    if (!formData.mobile) newErrors.mobile = 'Mobile number is required';
    if (!captchaValid) newErrors.captcha = 'Please complete the CAPTCHA';
    if (!isEmailValid) newErrors.emailExists = 'Email already exists';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    const formDataToSubmit = new FormData();
    Object.entries(formData).forEach(([key, value]) => {
      formDataToSubmit.append(key, value);
    });
    if (profile) {
      formDataToSubmit.append('profile', profile); // Append profile file if exists
    }

    setLoading(true);
    try {
      const response = await post('/api/auth/register', formDataToSubmit, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      if (response.status === 201) {
        toast.success('Registered successfully! Please verify your email.');
        navigate('/verify-email'); // Redirect to email verification page
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      className="max-w-lg mx-auto p-10 bg-white shadow-xl rounded-2xl mt-10"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
    >
      <Typography variant="h4" mb={3} textAlign="center" fontWeight="bold">
        Register
      </Typography>
      <form onSubmit={handleSubmit}>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Username"
              variant="outlined"
              name="username"
              onChange={handleChange}
              required
            />
            {errors.username && <p className="text-red-500 text-sm">{errors.username}</p>}
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="First Name"
              variant="outlined"
              name="firstName"
              onChange={handleChange}
              required
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Last Name"
              variant="outlined"
              name="lastName"
              onChange={handleChange}
              required
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Email"
              variant="outlined"
              name="email"
              onChange={handleEmailChange}
              required
              InputProps={{
                endAdornment: isLoading ? (
                  <InputAdornment position="end">
                    <CircularProgress size={20} />
                  </InputAdornment>
                ) : (
                  <InputAdornment position="end">
                    {isEmailValid ? <CheckCircle color="success" /> : <Error color="error" />}
                  </InputAdornment>
                ),
              }}
            />
            {errors.email && <p className="text-red-500 text-sm">{errors.email}</p>}
            {errors.emailExists && <p className="text-red-500 text-sm">{errors.emailExists}</p>}
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              type="password"
              label="Password"
              variant="outlined"
              name="password"
              onChange={handlePasswordChange}
              required
            />
            {passwordStrength && (
              <Box mt={1}>
                <Typography variant="body2" color={passwordStrength.score < 3 ? 'error' : 'success'}>
                  Password strength: {['Weak', 'Fair', 'Good', 'Strong'][passwordStrength.score]}
                </Typography>
                <progress value={passwordStrength.score} max="4" style={{ width: '100%' }} />
              </Box>
            )}
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Mobile"
              variant="outlined"
              name="mobile"
              onChange={handleChange}
              required
            />
            {errors.mobile && <p className="text-red-500 text-sm">{errors.mobile}</p>}
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Address"
              variant="outlined"
              name="address"
              onChange={handleChange}
              required
            />
          </Grid>

          <Grid item xs={12}>
            <input
              accept="image/*"
              style={{ display: 'none' }}
              id="profile-upload"
              type="file"
              onChange={handleProfileChange}
            />
            <label htmlFor="profile-upload">
              <Button variant="outlined" component="span" fullWidth>
                Upload Profile Picture
              </Button>
            </label>
            {profile && (
              <Typography variant="body2" mt={2}>
                {profile.name} selected
              </Typography>
            )}
          </Grid>
        </Grid>

        <ReCAPTCHA
          sitekey="6LerIVwqAAAAAK72GIiKW0uhHkUDig0vu1OSvFpb" // Replace with your site key
          onChange={handleCaptcha}
        />

        <Button
          type="submit"
          variant="contained"
          fullWidth
          color="primary"
          sx={{ marginTop: 2, paddingY: 1.5 }}
          disabled={loading}
        >
          {loading ? <CircularProgress size={24} /> : 'Register'}
        </Button>

        <Typography variant="body2" align="center" mt={2}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: '#1976D2', textDecoration: 'none', fontWeight: 'bold' }}>
            Login here
          </Link>
        </Typography>
      </form>
    </motion.div>
  );
}
