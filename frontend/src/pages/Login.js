import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";

const Login = () => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    role: "user",
  });
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // If user is already logged in, redirect to dashboard
  useEffect(() => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');
    if (token) {
      if (role === 'admin') {
        navigate('/admin-dashboard');
      } else {
        navigate('/dashboard');
      }
    }
  }, [navigate]);

  useEffect(() => {
    // Clear any existing tokens on component mount
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('userId');
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      console.log('Attempting login with:', { email: formData.email, password: formData.password, role: formData.role });
      const response = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: formData.email, password: formData.password, role: formData.role }),
      });

      const data = await response.json();
      console.log('Login response:', data);

      if (response.ok) {
        console.log('Login role:', data.role);
        console.log('Login token:', data.token);
        localStorage.setItem('token', data.token);
        localStorage.setItem('userRole', data.role);
        localStorage.setItem('userId', data.userId);
        
        // Use replace instead of push to prevent back navigation
        if (data.role === 'admin') {
          console.log('Redirecting to admin dashboard');
          navigate('/admin-dashboard', { replace: true });
        } else if (data.role === 'institution') {
          console.log('Redirecting to dashboard');
          navigate('/dashboard', { replace: true });
        } else {
          console.log('Redirecting to matches');
          navigate('/matches', { replace: true });
        }
      } else {
        console.error('Login failed:', data.message);
        setError(data.message || 'Login failed');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('An error occurred during login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-split-layout">
        {/* Left side - Content/Image */}
        <div className="auth-hero">
          <div className="auth-hero-content">
            <h1>Welcome Back</h1>
            <p>Your mental health journey continues here</p>
          </div>
        </div>

        {/* Right side - Login Form */}
        <div className="auth-form-container">
          <div className="auth-form-content">
            <h2>Sign In</h2>
            <form onSubmit={handleSubmit} className="auth-form">
              <div className="form-group">
                <input
                  type="email"
                  name="email"
                  placeholder="Email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="auth-input"
                  autoComplete="email"
                />
              </div>
              
              <div className="form-group">
                <input
                  type="password"
                  name="password"
                  placeholder="Password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  className="auth-input"
                  autoComplete="current-password"
                />
              </div>
              
              <div className="form-group">
                <select 
                  name="role" 
                  value={formData.role}
                  onChange={handleChange}
                  className="auth-select"
                >
                  <option value="user">User</option>
                  <option value="institution">Institution</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              
              <button type="submit" className="auth-button">
                Login
              </button>
            </form>
            
            <p className="auth-footer">
              Don't have an account? <Link to="/signup" className="auth-link">Sign Up</Link>
            </p>
            
            <Link to="/" className="back-to-home">
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
