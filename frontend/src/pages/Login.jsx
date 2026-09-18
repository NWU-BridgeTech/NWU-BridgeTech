import React from 'react';  
import './Login.css'; 

const Login = () => {
  return (
    
    <div className="login-page">
      <div className="login-card">
        <div className="hero-image">
            <span className="hero-text">Helping to build a better future </span>
            <img 
                src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=800&q=80" 
                alt="Helping to build a better future"
            />
            </div>
            
        <div className="brand">
          <b>Bridge</b><b>Tech</b>
        </div>
        <h2>Login</h2>
        <form>
          <div className="form-group">
            <label htmlFor="email">Email:</label>
            <input type="email" id="email" placeholder="name@gmail.com" required />
          </div>
          <div className="form-group">
            <label htmlFor="password">Password:</label>
            <input type="password" id="password" placeholder="Enter your password" required />
              <a href="/forgot-password" className="forgot-password-link">
              Forgot password?
            </a>
          </div>
          <div className="login-Footer">
            <p>Don't have an account? <a href="/signup">Sign up</a></p>
          </div>
          <button type="submit" className="btn blue submit-btn">
            Login
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;