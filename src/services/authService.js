import axiosInstance from './axios';

/**
 * Authentication service for managing user sessions.
 */
export const authService = {
  /**
   * Logs in a user with their credentials.
   * Calls POST /api/auth/login and returns standard session object.
   * 
   * @param {string} username - User credentials identifier
   * @param {string} password - User credentials password
   * @returns {Promise<{token: string, user: {id: string, name: string, email: string, role: string}}>}
   */
  login: async (username, password) => {
    const response = await axiosInstance.post('/auth/login', { username, password });
    const responseData = response.data;
    
    if (responseData.success && responseData.data) {
      return {
        token: responseData.data.token || 'mock_jwt_token_skr_garments_erp',
        user: {
          id: responseData.data.userId,
          name: responseData.data.fullName,
          email: responseData.data.username,
          role: responseData.data.role,
        },
      };
    }
    throw new Error(responseData.message || 'Login failed');
  },

  /** Change the logged-in user's password. */
  changePassword: async (username, currentPassword, newPassword) => {
    const response = await axiosInstance.post('/auth/change-password', { username, currentPassword, newPassword });
    return response.data;
  },
};
