import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { verifyEmail } from '../../actions/authActions';

const VerifyEmail = () => {
  const [email, setEmail] = useState('');
  const dispatch = useDispatch();
  const { error, successMessage, loading } = useSelector(state => state.auth); // Access loading and messages

  const handleSubmit = (e) => {
    e.preventDefault();
    if (email) {
      dispatch(verifyEmail(email)); // Dispatch verify email action
    }
  };

  return (
    <div className="verify-email-container">
      <h2>Verify Your Email</h2>
      {error && <p className="error-message">{error}</p>}
      {successMessage && <p className="success-message">{successMessage}</p>}
      <form onSubmit={handleSubmit}>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter your email"
          required
          aria-label="Email for verification"
        />
        <button type="submit" disabled={loading}>
          {loading ? 'Verifying...' : 'Verify Email'}
        </button>
      </form>
    </div>
  );
};

export default VerifyEmail;
