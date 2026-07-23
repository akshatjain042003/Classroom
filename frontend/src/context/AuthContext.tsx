import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types/user';
import api from '../api/axios';

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (token: string, refreshToken: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('AuthProvider mounted, checking for stored token...');
    const storedToken = localStorage.getItem('token');
    const storedRefreshToken = localStorage.getItem('refreshToken');
    
    if (storedToken && storedRefreshToken) {
      console.log('Found stored tokens, fetching profile...');
      setToken(storedToken);
      fetchUserProfile(storedToken);
    } else {
      console.log('No stored tokens found');
      setLoading(false);
    }
  }, []);

  const fetchUserProfile = async (authToken: string) => {
    try {
      console.log('Fetching user profile with token:', authToken.substring(0, 20) + '...'); // Debug
      const response = await api.get<User>('/users/profile', {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });
      console.log('User profile fetched successfully:', response.data); // Debug
      setUser(response.data);
    } catch (error: any) {
      console.error('Failed to fetch user profile:', error.response?.data || error.message);
      // Don't clear token immediately - might be a temporary network issue
      // Only clear if it's a 401 (unauthorized)
      if (error.response?.status === 401) {
        console.error('Token is invalid (401), clearing...');
        localStorage.removeItem('token');
        setToken(null);
      }
    } finally {
      setLoading(false);
    }
  };

  const login = async (newToken: string, refreshToken: string) => {
    console.log('Login called with new tokens - clearing old state first');
    // Clear old state first
    setUser(null);
    setToken(null);
    
    // Set new tokens
    setToken(newToken);
    localStorage.setItem('token', newToken);
    localStorage.setItem('refreshToken', refreshToken);
    
    // Fetch new user profile
    await fetchUserProfile(newToken);
  };

  const logout = () => {
    console.log('Logout called - clearing all auth data');
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    // Force reload to clear any cached state
    window.location.href = '/login';
  };

  console.log('AuthContext state:', { hasUser: !!user, hasToken: !!token, loading, isAuthenticated: !!token });

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        login,
        logout,
        isAuthenticated: !!token,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
