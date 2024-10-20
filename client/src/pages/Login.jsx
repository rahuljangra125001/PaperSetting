import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { post } from '../services/ApiEndpoint';
import { toast } from 'react-hot-toast';
import { useDispatch } from 'react-redux';
import { setUser } from '../redux/AuthSlice';
import { motion } from 'framer-motion';
import Input from '../components/Input';
import { Mail, Lock, Loader, Key,} from 'lucide-react';
import ReCAPTCHA from 'react-google-recaptcha';
import { validatePasswordStrength } from '../utils/validators';
import Cookies from 'js-cookie';
import '../styles/login.css';
import { IconButton } from '@mui/material'; // Using Material UI for styling
import { Visibility, VisibilityOff } from '@mui/icons-material'; 

export default function Login() {
    const dispatch = useDispatch();
    const [identifier, setIdentifier] = useState('');
    const [password, setPassword] = useState('');
    const [emailOtp, setEmailOtp] = useState('');
    const [smsOtp, setSmsOtp] = useState('');
    const [step, setStep] = useState('LOGIN');
    const [loading, setLoading] = useState(false);
    const [resendLoading, setResendLoading] = useState(false);
    const [recaptchaToken, setRecaptchaToken] = useState(null);
    const [otpAttempts, setOtpAttempts] = useState(0);
    const [errors, setErrors] = useState({});
    const [showPassword, setShowPassword] = useState(false);
    const navigate = useNavigate();
    const recaptchaRef = useRef(null);

    const handleRecaptcha = (token) => {
        setRecaptchaToken(token);
    };

    const resetFields = () => {
        setIdentifier('');
        setPassword('');
        setEmailOtp('');
        setSmsOtp('');
        setRecaptchaToken(null);
        setErrors({});
    };

    const validateForm = () => {
        const errors = {};
        // if (!validateEmail(identifier)) errors.identifier = 'Invalid email address.';
        if (!validatePasswordStrength(password)) errors.password = 'Password is too weak.';
        setErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleResendOtp = async (e) => {
        e.preventDefault();

        if (otpAttempts >= 3) {
            toast.error("Max OTP resend attempts reached.");
            return;
        }
        try {
            setResendLoading(true);

            const response = await post('/api/auth/send-otp', {
                identifier,
                recaptchaToken,
                resend: true,
            });

            if (response.status === 200 && response.data.step === 'OTP_REQUIRED') {
                setOtpAttempts((prev) => prev + 1);
                toast.success('OTP has been resent.');
            } else {
                toast.error(response.data.message || 'Error resending OTP.');
            }
        } catch (error) {
            console.error('Error resending OTP:', error);
            toast.error(error.response?.data?.message || 'Failed to resend OTP.');
        } finally {
            setResendLoading(false);
            recaptchaRef.current.reset();
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!recaptchaToken) {
            toast.error('Please complete the CAPTCHA.');
            return;
        }

        if (step === 'OTP' && (!emailOtp || !smsOtp)) {
            toast.error('Please enter both OTPs.');
            return;
        }

        if (step === 'LOGIN' && !validateForm()) {
            return;
        }

        setLoading(true);
        try {
            const request = await post('/api/auth/login', {
                identifier,
                password,
                emailOtp,
                smsOtp,
                recaptchaToken,
                resend: false,
            });

            if (request.status === 200) {
                const response = request.data;
                if (response.step === 'OTP_REQUIRED') {
                    setStep('OTP');
                    recaptchaRef.current.reset();
                    toast.success('OTP sent. Please verify.');
                } else if (response.success) {
                    Cookies.set('token', response.token, { 
                        expires: 1, // Expires in 1 day
                        path: '/', 
                        // secure: false, // Omit this in development if not using HTTPS
                        sameSite: 'Lax' // Use 'Lax' for flexibility
                    });
                    
                    dispatch(setUser(response.user));
                    toast.success(response.message);
                    
                    switch (response.user.role) {
                        case 'COE':
                            navigate('/COEDashboard');
                            break;
                        case 'Chairperson':
                            navigate('/ChairpersonDashboard');
                            break;
                        case 'PanelMember':
                            navigate('/PanelDashboard');
                            break;
                        case 'User':
                            navigate('/UserDashboard');
                            break;
                        default:
                            navigate('/Login');
                            break;
                    }
                    resetFields();
                }else {
                    toast.error('Login failed. Please check your credentials.');
                }
            }else if (request.status === 543){
                toast.error("Please verify your email before logging in.")
                navigate('/verify-email');
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Login failed. Please try again.');
        } finally {
            setLoading(false);
            recaptchaRef.current.reset();
        }
    };

    const handleBack = () => {
        setStep('LOGIN');
        resetFields();
    };

    const handleTogglePassword = () => {
        setShowPassword(!showPassword);
      };

    const handleRegister = () => navigate('/register');
    const handleForgetPassword = () => navigate('/forget-password');

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className='max-w-md w-full bg-gray-800 bg-opacity-50 backdrop-filter backdrop-blur-xl rounded-2xl shadow-xl overflow-hidden'
        >
            <div className='p-8'>
                <h2 className='text-3xl font-bold mb-6 text-center bg-gradient-to-r from-green-400 to-emerald-500 text-transparent bg-clip-text'>
                    {step === 'LOGIN' ? 'Welcome Back' : 'Enter OTP'}
                </h2>
                <form onSubmit={handleSubmit}>
                    {step === 'LOGIN' && (
                        <>
                            <Input
                                id="identifier"  
                                name="identifier" 
                                icon={Mail}
                                type='text'
                                placeholder='Email Address or User Name'
                                value={identifier}
                                onChange={(e) => setIdentifier(e.target.value)}
                                aria-label='Email Address or User Name'
                                error={errors.identifier}
                            />
                            <div className="relative">
                                <Input
                                    id="password" 
                                    name="password"
                                    icon={Lock}
                                    type={showPassword ? 'text' : 'password'}
                                    placeholder='Password'
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    aria-label='Password'
                                    error={errors.password}
                                />
                                <IconButton
                                    onClick={handleTogglePassword}
                                    style={{
                                        position: 'absolute',
                                        left: '65%',
                                        top: '53%',
                                        transform: 'translateY(-110%)',
                                        backgroundColor: 'transparent', // Background color for the button
                                        border: 'none', // Remove default border
                                        outline: 'none', // Remove outline on focus
                                        padding: '0', // Remove padding
                                        transition: 'transform 0.2s ease', // Transition for hover effect
                                        boxShadow: 'none', // Default shadow
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.boxShadow = '0 2px 2px rgba(0, 0, 0, 0.2)'; // Small shadow on hover
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.boxShadow = 'none'; // Remove shadow when not hovered
                                    }}
                                >
                                    {showPassword ? <VisibilityOff /> : <Visibility />}
                                </IconButton>

                            </div>
                            <ReCAPTCHA
                                ref={recaptchaRef}
                                sitekey="6LerIVwqAAAAAK72GIiKW0uhHkUDig0vu1OSvFpb" // Replace with your site key
                                onChange={handleRecaptcha}
                            />
                        </>
                    )}

                    {step === 'OTP' && (
                        <>
                            <Input
                                icon={Key}
                                type='text'
                                placeholder='Enter Email OTP'
                                value={emailOtp}
                                onChange={(e) => setEmailOtp(e.target.value)}
                                aria-label='Email OTP'
                            />
                            <Input
                                icon={Key}
                                type='text'
                                placeholder='Enter SMS OTP'
                                value={smsOtp}
                                onChange={(e) => setSmsOtp(e.target.value)}
                                aria-label='SMS OTP'
                            />
                            <ReCAPTCHA
                                ref={recaptchaRef}
                                sitekey="6LerIVwqAAAAAK72GIiKW0uhHkUDig0vu1OSvFpb" // Replace with your site key
                                onChange={handleRecaptcha}
                            />
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                className='w-full py-3 px-4 mt-4 bg-gradient-to-r from-gray-500 to-gray-600 text-white font-bold rounded-lg shadow-lg hover:from-gray-600 hover:to-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 focus:ring-offset-gray-900 transition duration-200'
                                onClick={handleResendOtp}
                                disabled={resendLoading || otpAttempts >= 3}
                            >
                                {resendLoading ? <Loader className='w-6 h-6 animate-spin mx-auto' /> : 'Resend OTP'}
                            </motion.button>
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                type='button'
                                onClick={handleBack}
                                className='w-full py-3 px-4 mt-4 bg-red-500 text-white font-bold rounded-lg shadow-lg hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-gray-900 transition duration-200'
                            >
                                Back to Login
                            </motion.button>
                        </>
                    )}

                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        type='submit'
                        className='w-full py-3 px-4 mt-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-bold rounded-lg shadow-lg hover:from-blue-600 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900 transition duration-200'
                        disabled={loading}
                    >
                        {loading ? <Loader className='w-6 h-6 animate-spin mx-auto' /> : step === 'LOGIN' ? 'Login' : 'Verify OTP'}
                    </motion.button>
                </form>

                <div className='flex justify-between mt-4'>
                    <button onClick={handleRegister} className='text-sm text-blue-400 hover:underline'>
                        Register
                    </button>
                    <button onClick={handleForgetPassword} className='text-sm text-blue-400 hover:underline'>
                        Forgot Password?
                    </button>
                </div>
            </div>
        </motion.div>
    );
}
