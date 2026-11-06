import React, { useEffect } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider, QueryCache } from '@tanstack/react-query';
import { notification } from 'antd';
import { AuthProvider } from './contexts/AuthContext';
import { AppSettingsProvider } from './contexts/AppSettingsContext';
import { AppThemeProvider } from './contexts/ThemeColorContext';
import { LanguageProvider } from './contexts/LanguageContext';
import AppRoutes from './routes';

// Initialize TanStack React Query Client with global QueryCache error handler
const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error) => {
      const errMsg = error.response?.data?.message || error.message || 'An error occurred while communicating with the server.';
      notification.error({
        message: 'API Request Failed',
        description: errMsg,
        placement: 'topRight',
      });
    },
  }),
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false, // Prevents aggressive queries refetching on tab focus
      retry: 1, // Retries failed requests once before showing error
      staleTime: 5 * 60 * 1000, // Data remains fresh for 5 minutes
    },
  },
});

function App() {
  // Ask the user to confirm before the window closes (prevents accidental exit on the X).
  // Only in the packaged build so the dev browser isn't nagged on every reload.
  useEffect(() => {
    if (!import.meta.env.PROD) return undefined;
    const confirmExit = (e) => { e.preventDefault(); e.returnValue = ''; };
    window.addEventListener('beforeunload', confirmExit);
    return () => window.removeEventListener('beforeunload', confirmExit);
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <AppThemeProvider>
          <AuthProvider>
            <AppSettingsProvider>
              <BrowserRouter>
                <AppRoutes />
              </BrowserRouter>
            </AppSettingsProvider>
          </AuthProvider>
        </AppThemeProvider>
      </LanguageProvider>
    </QueryClientProvider>
  );
}

export default App;
