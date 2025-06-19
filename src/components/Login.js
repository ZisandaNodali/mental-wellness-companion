// src/components/Login.js
import React, { useState } from 'react';
import { auth, db } from '../firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    try {
      // Step 1: Look up email from username
      const q = query(collection(db, 'users'), where('username', '==', username));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        throw new Error('Username not found');
      }

      const userDoc = querySnapshot.docs[0];
      const email = userDoc.data().email;

      // Step 2: Use email to sign in
      await signInWithEmailAndPassword(auth, email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div style={containerStyle}>
      <div style={formContainerStyle}>
        <h2 style={titleStyle}>Welcome Back</h2>
        <p style={subtitleStyle}>Sign in to continue your wellness journey</p>
        
        {error && <div style={errorStyle}>{error}</div>}
        
        <form onSubmit={handleLogin} style={formStyle}>
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={e => setUsername(e.target.value)}
            required
            style={inputStyle}
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            style={inputStyle}
          />
          <button type="submit" style={buttonStyle}>
            Sign In
          </button>
        </form>
        
        <p style={linkTextStyle}>
          Don't have an account? 
          <span 
            onClick={() => navigate('/signup')} 
            style={linkStyle}
          >
            Create one here
          </span>
        </p>
      </div>
    </div>
  );
}

const containerStyle = {
  minHeight: '100vh',
  background: 'linear-gradient(135deg, #6B46C1 0%, #9333EA 50%, #C026D3 100%)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '20px',
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
};

const formContainerStyle = {
  background: 'rgba(255, 255, 255, 0.95)',
  backdropFilter: 'blur(20px)',
  borderRadius: '20px',
  padding: '40px',
  width: '100%',
  maxWidth: '400px',
  boxShadow: '0 20px 40px rgba(0, 0, 0, 0.2)',
  border: '1px solid rgba(255, 255, 255, 0.3)'
};

const titleStyle = {
  fontSize: '2rem',
  fontWeight: '700',
  color: '#374151',
  textAlign: 'center',
  marginBottom: '8px'
};

const subtitleStyle = {
  fontSize: '1rem',
  color: '#6B7280',
  textAlign: 'center',
  marginBottom: '30px',
  fontWeight: '400'
};

const formStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '20px'
};

const inputStyle = {
  padding: '15px 20px',
  fontSize: '16px',
  border: '2px solid #E5E7EB',
  borderRadius: '12px',
  outline: 'none',
  transition: 'all 0.3s ease',
  backgroundColor: '#F9FAFB',
  color: '#374151',
  fontFamily: 'inherit'
};

const buttonStyle = {
  padding: '15px 20px',
  fontSize: '16px',
  fontWeight: '600',
  borderRadius: '12px',
  border: 'none',
  background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
  color: 'white',
  cursor: 'pointer',
  transition: 'all 0.3s ease',
  boxShadow: '0 4px 15px rgba(16, 185, 129, 0.4)',
  transform: 'translateY(0)',
  marginTop: '10px'
};

const errorStyle = {
  background: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)',
  color: 'white',
  padding: '12px 16px',
  borderRadius: '8px',
  fontSize: '14px',
  fontWeight: '500',
  textAlign: 'center',
  marginBottom: '20px',
  boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)'
};

const linkTextStyle = {
  textAlign: 'center',
  marginTop: '25px',
  color: '#6B7280',
  fontSize: '14px'
};

const linkStyle = {
  color: '#9333EA',
  cursor: 'pointer',
  fontWeight: '600',
  marginLeft: '5px',
  textDecoration: 'none'
};

// Add these hover effects with CSS-in-JS or a stylesheet:
// inputStyle:focus { border-color: #9333EA; box-shadow: 0 0 0 3px rgba(147, 51, 234, 0.1); }
// buttonStyle:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(16, 185, 129, 0.6); }
// linkStyle:hover { text-decoration: underline; }

// This code allows users to log in using their username and password.