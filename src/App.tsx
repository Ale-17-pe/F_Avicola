import { RouterProvider } from 'react-router';
import { router } from './routes';
import { AppProvider } from './contexts/AppContext';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { Toaster } from 'sonner';

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppProvider>
          <RouterProvider router={router} />
          <Toaster 
            position="top-right" 
            toastOptions={{
              style: {
                background: 'var(--background)',
                border: '1px solid rgba(204, 170, 0, 0.5)',
                color: 'var(--foreground)',
              },
              className: 'backdrop-blur-xl',
            }}
          />
        </AppProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}