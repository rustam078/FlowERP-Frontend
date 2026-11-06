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

  const login = async (username, password) => {
    setIsLoading(true);
    try {
      const data = await authService.login(username, password);

      localStorage.setItem('skr_token', data.token);
      localStorage.setItem('skr_user', JSON.stringify(data.user));
      
      setUser(data.user);
      setIsAuthenticated(true);
      // Settings (incl. ROLE_PERMISSIONS) must be refetched with THIS user's X-User-Id
      // header before we proceed, so menus/permissions reflect the new user immediately
      // (not the previous user's cached values). Drop stale cache, then await a fresh fetch.
      queryClient.removeQueries({ queryKey: ['appSettings'] });
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

  const logout = () => {
    localStorage.removeItem('skr_token');
    localStorage.removeItem('skr_user');
    setUser(null);
    setIsAuthenticated(false);
    queryClient.removeQueries({ queryKey: ['appSettings'] });
  };

  const value = {
    user,
    isAuthenticated,
    isLoading,
    login,
    logout,
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
