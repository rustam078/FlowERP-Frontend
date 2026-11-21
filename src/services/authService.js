import axiosInstance from './axios';

// Backend session → the user object kept in AuthContext / localStorage.
const toUser = (d) => ({
  id: d.userId,
  name: d.fullName,
  email: d.email,
  role: d.role,
  portfolioId: d.portfolioId || null, // null = SUPER_ADMIN who hasn't picked a portfolio yet
  portfolioName: d.portfolioName || null,
});

const unwrap = (response, fallback) => {
  const body = response.data;
  if (body.success && body.data) return body.data;
  throw new Error(body.message || fallback);
};

/** Sign in / out and session helpers (server-side session token). */
export const authService = {
  /** POST /api/auth/login → { token, user }. */
  login: async (email, password) => {
    const data = unwrap(await axiosInstance.post('/auth/login', { email, password }), 'Login failed');
    return { token: data.token, user: toUser(data) };
  },

  /** Ends the session on the server (the token stops working everywhere it was copied). */
  logout: async () => {
    await axiosInstance.post('/auth/logout');
  },

  /** Current session (user + portfolio being worked in). */
  me: async () => toUser(unwrap(await axiosInstance.get('/auth/me'), 'Session check failed')),

  /** SUPER_ADMIN only: enter another portfolio (null = back to the picker). */
  switchPortfolio: async (portfolioId) =>
    toUser(unwrap(await axiosInstance.post('/auth/switch-portfolio', { portfolioId }), 'Could not switch portfolio')),

  /** Change the signed-in user's own password. */
  changePassword: async (currentPassword, newPassword) => {
    const response = await axiosInstance.post('/auth/change-password', { currentPassword, newPassword });
    return response.data;
  },
};
