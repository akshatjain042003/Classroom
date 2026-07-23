import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const GoogleCallback: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [error, setError] = useState('');
  const hasProcessed = useRef(false); // Prevent double processing

  useEffect(() => {
    // Prevent running twice in StrictMode
    if (hasProcessed.current) return;
    hasProcessed.current = true;

    const handleCallback = async () => {
      try {
        // Get the tokens from URL query params
        const urlParams = new URLSearchParams(window.location.search);
        const token = urlParams.get('token');
        const refreshToken = urlParams.get('refresh_token');

        console.log('Tokens from URL:', { token: token?.substring(0, 20), refreshToken: refreshToken?.substring(0, 20) }); // Debug log

        if (token && refreshToken) {
          // Wait for login to complete
          await login(token, refreshToken);
          console.log('Login successful, redirecting to dashboard'); // Debug log
          navigate('/dashboard', { replace: true });
        } else {
          console.error('No tokens found in URL'); // Debug log
          setError('No authentication tokens received');
          setTimeout(() => {
            navigate('/login', { state: { error: 'Google authentication failed' } });
          }, 2000);
        }
      } catch (err) {
        console.error('Login error:', err); // Debug log
        setError('Authentication failed');
        setTimeout(() => {
          navigate('/login', { state: { error: 'Google authentication failed' } });
        }, 2000);
      }
    };

    handleCallback();
  }, []); // Empty dependency array - only run once

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="text-center">
        {error ? (
          <>
            <div className="text-red-600 text-xl mb-4">❌</div>
            <p className="text-red-600 font-medium">{error}</p>
            <p className="text-gray-600 mt-2">Redirecting to login...</p>
          </>
        ) : (
          <>
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">Completing Google sign in...</p>
          </>
        )}
      </div>
    </div>
  );
};

export default GoogleCallback;
