import React, { useState } from 'react';
import { API_URL, apiRequest } from '../../api/api';

const Login = ({ onLoginSuccess, onBackToLanding }) => {
  const [formData, setFormData] = useState({
    userId: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validate input
    if (!formData.userId || !formData.password) {
      setError('Please enter both User ID and Password');
      setLoading(false);
      return;
    }

    try {
      // Make API call using centralized apiRequest function
      const data = await apiRequest('/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          userId: formData.userId.trim(),
          password: formData.password
        }),
      });

      if (data && data.success) {
        // Store both token and user data
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        localStorage.setItem('userRole', data.user.role);
        
        // Call success callback
        onLoginSuccess();
      } else {
        // Handle login errors from backend
        setError(data?.message || 'Invalid credentials. Please try again.');
      }
    } catch (error) {
      console.error('Login error:', error);
      setError('Unable to connect to server. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '20px',
        padding: '40px',
        maxWidth: '400px',
        width: '100%',
        boxShadow: '0 20px 60px rgba(0,0,0,0.1)'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <h1 style={{
            color: '#333',
            fontSize: '28px',
            fontWeight: 'bold',
            margin: '0 0 10px 0'
          }}>
            Welcome Back
          </h1>
          <p style={{ color: '#666', margin: 0 }}>
            Sign in to your Elevate Network account
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              color: '#333',
              fontWeight: '500'
            }}>
              User ID
            </label>
            <input
              type="text"
              placeholder="Enter your User ID (e.g., ELV10001)"
              value={formData.userId}
              onChange={(e) => setFormData({...formData, userId: e.target.value})}
              disabled={loading}
              style={{
                width: '100%',
                padding: '12px 16px',
                border: '2px solid #e1e5e9',
                borderRadius: '12px',
                fontSize: '16px',
                outline: 'none',
                transition: 'border-color 0.3s',
                boxSizing: 'border-box',
                backgroundColor: loading ? '#f8f9fa' : 'white'
              }}
              onFocus={(e) => !loading && (e.target.style.borderColor = '#667eea')}
              onBlur={(e) => e.target.style.borderColor = '#e1e5e9'}
            />
          </div>

          <div style={{ marginBottom: '25px' }}>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              color: '#333',
              fontWeight: '500'
            }}>
              Password
            </label>
            <input
              type="password"
              placeholder="Enter your password"
              value={formData.password}
              onChange={(e) => setFormData({...formData, password: e.target.value})}
              disabled={loading}
              style={{
                width: '100%',
                padding: '12px 16px',
                border: '2px solid #e1e5e9',
                borderRadius: '12px',
                fontSize: '16px',
                outline: 'none',
                transition: 'border-color 0.3s',
                boxSizing: 'border-box',
                backgroundColor: loading ? '#f8f9fa' : 'white'
              }}
              onFocus={(e) => !loading && (e.target.style.borderColor = '#667eea')}
              onBlur={(e) => e.target.style.borderColor = '#e1e5e9'}
            />
          </div>

          {error && (
            <div style={{
              backgroundColor: '#fee',
              color: '#c33',
              padding: '12px',
              borderRadius: '8px',
              marginBottom: '20px',
              fontSize: '14px',
              border: '1px solid #fcc'
            }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '14px',
              backgroundColor: loading ? '#ccc' : '#667eea',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'background-color 0.3s',
              position: 'relative'
            }}
            onMouseOver={(e) => !loading && (e.target.style.backgroundColor = '#5a67d8')}
            onMouseOut={(e) => !loading && (e.target.style.backgroundColor = '#667eea')}
          >
            {loading ? (
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{
                  width: '20px',
                  height: '20px',
                  border: '2px solid #ffffff40',
                  borderTop: '2px solid #ffffff',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite',
                  marginRight: '10px'
                }}></span>
                Signing In...
              </span>
            ) : 'Sign In'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '25px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button
            type="button"
            onClick={onBackToLanding}
            disabled={loading}
            style={{
              background: 'none',
              border: 'none',
              color: loading ? '#ccc' : '#667eea',
              textDecoration: 'none',
              fontSize: '14px',
              cursor: loading ? 'not-allowed' : 'pointer',
              padding: '5px'
            }}
          >
            ← Back to Home
          </button>
          <button
            type="button"
            disabled={loading}
            style={{
              background: 'none',
              border: 'none',
              color: loading ? '#ccc' : '#667eea',
              textDecoration: 'none',
              fontSize: '14px',
              cursor: loading ? 'not-allowed' : 'pointer',
              padding: '5px'
            }}
            onClick={() => {
              if (!loading) {
                alert('Please contact support to reset your password.');
              }
            }}
          >
            Forgot password?
          </button>
        </div>

        {/* Development helper - remove in production */}
        {process.env.NODE_ENV === 'development' && (
          <div style={{
            marginTop: '20px',
            padding: '10px',
            backgroundColor: '#f8f9fa',
            borderRadius: '8px',
            fontSize: '12px',
            color: '#666'
          }}>
            <strong>Development Mode:</strong><br />
            Test with any valid User ID and password from your database
          </div>
        )}
      </div>

      {/* CSS for loading spinner animation */}
      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default Login;