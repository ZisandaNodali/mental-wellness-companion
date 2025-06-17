import React from 'react';
import { Link } from 'react-router-dom';

export default function Home() {
  return (
    <div style={{ textAlign: 'center', paddingTop: '100px' }}>
      <h1>Welcome to Mental Wellness Companion</h1>
      <p>Your AI-powered mental health support tool</p>
      <div style={{ marginTop: '40px' }}>
        <Link to="/signup">
          <button style={buttonStyle}>Sign Up</button>
        </Link>
        <Link to="/login" style={{ marginLeft: '20px' }}>
          <button style={buttonStyle}>Log In</button>
        </Link>
      </div>
    </div>
  );
}

const buttonStyle = {
  padding: '10px 25px',
  fontSize: '16px',
  borderRadius: '8px',
  border: 'none',
  backgroundColor: '#1e88e5',
  color: 'white',
  cursor: 'pointer',
};
