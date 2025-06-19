import React from 'react';
import { Link } from 'react-router-dom';

export default function Home() {
  return (
    <div style={containerStyle}>
      {/* Hero Section */}
      <div style={heroStyle}>
        <div style={iconContainerStyle}>
          <div style={iconStyle}>❤️</div>
        </div>
        <h1 style={titleStyle}>Mental Wellness Companion</h1>
        <p style={subtitleStyle}>
          Your AI-powered mental health support tool designed to help you track moods, 
          journal thoughts, and maintain emotional wellbeing on your personal journey
        </p>
        
        {/* CTA Buttons */}
        <div style={ctaContainerStyle}>
          <Link to="/signup">
            <button style={primaryButtonStyle}>
              Get Started Free
              <span style={buttonArrowStyle}>→</span>
            </button>
          </Link>
          <Link to="/login">
            <button style={secondaryButtonStyle}>
              Sign In
            </button>
          </Link>
        </div>

        {/* Trust Indicators */}
        {/* <div style={trustIndicatorsStyle}>
          <div style={trustItemStyle}>
            <span style={trustIconStyle}>🔒</span>
            <span style={trustTextStyle}>Privacy Protected</span>
          </div>
          <div style={trustItemStyle}>
            <span style={trustIconStyle}>⚡</span>
            <span style={trustTextStyle}>Instant Insights</span>
          </div>
          <div style={trustItemStyle}>
            <span style={trustIconStyle}>🤝</span>
            <span style={trustTextStyle}>24/7 Support</span>
          </div>
        </div> */}
      </div>

      {/* Floating Elements */}
      <div style={floatingElement1}></div>
      <div style={floatingElement2}></div>
      <div style={floatingElement3}></div>
    </div>
  );
}

const containerStyle = {
  minHeight: '100vh',
  background: 'linear-gradient(135deg, #6B46C1 0%, #9333EA 50%, #C026D3 100%)',
  color: 'white',
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  position: 'relative',
  overflow: 'hidden',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
};

const heroStyle = {
  textAlign: 'center',
  padding: '60px 20px',
  maxWidth: '800px',
  margin: '0 auto',
  position: 'relative',
  zIndex: 10
};

const iconContainerStyle = {
  marginBottom: '30px'
};

const iconStyle = {
  fontSize: '5rem',
  display: 'inline-block',
  background: 'rgba(255,255,255,0.2)',
  borderRadius: '50%',
  width: '120px',
  height: '120px',
  lineHeight: '120px',
  backdropFilter: 'blur(20px)',
  border: '2px solid rgba(255,255,255,0.3)',
  boxShadow: '0 12px 40px rgba(0,0,0,0.3)'
};

const titleStyle = {
  fontSize: 'clamp(3rem, 6vw, 5rem)',
  fontWeight: '800',
  marginBottom: '30px',
  textShadow: '0 4px 12px rgba(0,0,0,0.4)',
  lineHeight: '1.1',
  background: 'linear-gradient(135deg, #FFFFFF 0%, #F3E8FF 100%)',
  backgroundClip: 'text',
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent'
};

const subtitleStyle = {
  fontSize: 'clamp(1.2rem, 3vw, 1.5rem)',
  opacity: '0.95',
  marginBottom: '60px',
  fontWeight: '400',
  maxWidth: '650px',
  margin: '0 auto 60px auto',
  lineHeight: '1.7',
  textShadow: '0 2px 4px rgba(0,0,0,0.2)'
};

const ctaContainerStyle = {
  display: 'flex',
  flexDirection: 'row',
  gap: '25px',
  justifyContent: 'center',
  alignItems: 'center',
  marginBottom: '60px',
  flexWrap: 'wrap'
};

const primaryButtonStyle = {
  padding: '20px 40px',
  fontSize: '20px',
  fontWeight: '700',
  borderRadius: '50px',
  border: 'none',
  background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
  color: 'white',
  cursor: 'pointer',
  transition: 'all 0.3s ease',
  boxShadow: '0 8px 25px rgba(16, 185, 129, 0.5)',
  transform: 'translateY(0)',
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  textDecoration: 'none'
};

const secondaryButtonStyle = {
  padding: '20px 40px',
  fontSize: '20px',
  fontWeight: '600',
  borderRadius: '50px',
  border: '3px solid rgba(255,255,255,0.4)',
  backgroundColor: 'rgba(255,255,255,0.15)',
  color: 'white',
  cursor: 'pointer',
  transition: 'all 0.3s ease',
  backdropFilter: 'blur(15px)',
  transform: 'translateY(0)',
  textDecoration: 'none'
};

const buttonArrowStyle = {
  fontSize: '22px',
  transition: 'transform 0.3s ease'
};

const trustIndicatorsStyle = {
  display: 'flex',
  justifyContent: 'center',
  gap: '50px',
  flexWrap: 'wrap',
  opacity: '0.9'
};

const trustItemStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
  background: 'rgba(255,255,255,0.1)',
  padding: '12px 20px',
  borderRadius: '25px',
  backdropFilter: 'blur(10px)',
  border: '1px solid rgba(255,255,255,0.2)'
};

const trustIconStyle = {
  fontSize: '1.4rem'
};

const trustTextStyle = {
  fontSize: '1rem',
  fontWeight: '600'
};

// Floating background elements
const floatingElement1 = {
  position: 'absolute',
  top: '15%',
  left: '8%',
  width: '300px',
  height: '300px',
  background: 'radial-gradient(circle, rgba(255,255,255,0.08) 0%, transparent 70%)',
  borderRadius: '50%',
  filter: 'blur(60px)',
  animation: 'float 8s ease-in-out infinite'
};

const floatingElement2 = {
  position: 'absolute',
  bottom: '15%',
  right: '10%',
  width: '250px',
  height: '250px',
  background: 'radial-gradient(circle, rgba(16,185,129,0.15) 0%, transparent 70%)',
  borderRadius: '50%',
  filter: 'blur(50px)',
  animation: 'float 10s ease-in-out infinite reverse'
};

const floatingElement3 = {
  position: 'absolute',
  top: '50%',
  right: '5%',
  width: '150px',
  height: '150px',
  background: 'radial-gradient(circle, rgba(255,255,255,0.05) 0%, transparent 70%)',
  borderRadius: '50%',
  filter: 'blur(40px)',
  animation: 'float 12s ease-in-out infinite'
};

// Add these hover effects and animations with CSS:
// @keyframes float {
//   0%, 100% { transform: translateY(0px) rotate(0deg); }
//   50% { transform: translateY(-30px) rotate(5deg); }
// }
// 
// primaryButtonStyle:hover { 
//   transform: translateY(-4px); 
//   box-shadow: 0 12px 35px rgba(16, 185, 129, 0.7);
// }
// 
// secondaryButtonStyle:hover { 
//   background-color: rgba(255,255,255,0.25); 
//   border-color: rgba(255,255,255,0.7);
//   transform: translateY(-3px);
// }
//
// buttonArrowStyle (in hover): { transform: translateX(5px); }