import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState(localStorage.getItem('intellmeet_theme') || 'dark');

  // Sync theme to document element
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('intellmeet_theme', theme);
  }, [theme]);

  // Check current session on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await api.get('/auth/me');
        if (res.data?.success && res.data?.user) {
          setUser(res.data.user);
          if (res.data.user.settings?.theme) {
            setTheme(res.data.user.settings.theme);
          }
        }
      } catch (err) {
        // Not logged in or expired session
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    if (res.data?.success && res.data?.user) {
      setUser(res.data.user);
      if (res.data.user.settings?.theme) {
        setTheme(res.data.user.settings.theme);
      }
      return res.data.user;
    }
    throw new Error(res.data?.message || 'Login failed');
  };

  const register = async (userData) => {
    const res = await api.post('/auth/register', userData);
    if (res.data?.success && res.data?.user) {
      setUser(res.data.user);
      return res.data.user;
    }
    throw new Error(res.data?.message || 'Registration failed');
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (err) {
      console.warn('Logout error:', err.message);
    } finally {
      setUser(null);
    }
  };

  const updateProfile = async (updates) => {
    const res = await api.put('/auth/profile', updates);
    if (res.data?.success && res.data?.user) {
      setUser(res.data.user);
      return res.data.user;
    }
    throw new Error(res.data?.message || 'Update failed');
  };

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        theme,
        toggleTheme,
        login,
        register,
        logout,
        updateProfile,
        isAuthenticated: Boolean(user),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
