import React, { createContext, useContext, useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { authService } from '../services/authService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check local storage for session recovery
    const savedToken = localStorage.getItem('skr_token');
    const savedUser = localStorage.getItem('skr_user');
    
    if (savedToken && savedUser) {
      try {
        setUser(JSON.parse(savedUser));
        setIsAuthenticated(true);
      } catch (e) {
        // Clear corrupt storage
        localStorage.removeItem('skr_token');
        localStorage.removeItem('skr_user');
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (email, password) => {
    setIsLoading(true);
    try {
      const data = await authService.login(email, password);

      localStorage.setItem('skr_token', data.token);
      localStorage.setItem('skr_user', JSON.stringify(data.user));

      setUser(data.user);
      setIsAuthenticated(true);
      // Drop every cached query (another user's / portfolio's data must never show), then load
      // settings (incl. ROLE_PERMISSIONS) for THIS session before continuing.
      queryClient.clear();
      try {
        await queryClient.refetchQueries({ queryKey: ['appSettings'] });
      } catch { /* non-fatal; provider will retry */ }
      setIsLoading(false);
      return { success: true };
    } catch (error) {
      setIsLoading(false);
      return { success: false, error: error.message || 'Login failed' };
    }
  };

  // Close the server session first (the request needs the token), then clear everything locally.
  const logout = async () => {
    try { await authService.logout(); } catch { /* session may already be gone */ }
    localStorage.removeItem('skr_token');
    localStorage.removeItem('skr_user');
    setUser(null);
    setIsAuthenticated(false);
    queryClient.clear();
  };

  // After a portfolio switch: store the new session view and drop all cached data.
  const updateSession = (nextUser) => {
    localStorage.setItem('skr_user', JSON.stringify(nextUser));
    setUser(nextUser);
    queryClient.clear();
  };

  const value = {
    user,
    isAuthenticated,
    isLoading,
    login,
    logout,
    updateSession,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
