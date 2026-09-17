import React, { useState } from "react";
import "./ForgotPassword.css";

const ForgotPassword = () => {
  const [error, setError] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();

    const newPassword = e.target.newPassword.value;
    const confirmPassword = e.target.confirmPassword.value;

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setError("");
  };

  return (
    <div className="forgot-page">
      <div className="forgot-card">
        <div className="brand">
          <b>Bridge</b>
          <b>Tech</b>
        </div>

        <h2>Reset your password</h2>
        <p className="sub">
          Enter your email and choose a new password for your account.
        </p>

        {error && <div className="error-message visible">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">Email address</label>
            <input id="email" name="email" type="email" placeholder="you@example.com" required/>
          </div>

          <div className="form-group">
            <label htmlFor="newPassword">New password</label>
            <input id="newPassword" name="newPassword" type="password" placeholder="Enter new password" required/>
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm password</label>
            <input id="confirmPassword" name="confirmPassword" type="password" placeholder="Re-enter new password" required/>
          </div>

          <button type="submit" className="btn blue submit-btn">
            Reset password
          </button>
        </form>

        <div className="back-to-login">
          Remembered your password? <a className="login-link" href="/login">Log in</a>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;