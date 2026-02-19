import { RouterProvider } from 'react-router';
import { router } from './routes';
import { AppProvider } from './contexts/AppContext';
import { AuthProvider } from './contexts/AuthContext';
import { Toaster } from 'sonner';

export default function App() {
  return (
    <AuthProvider>
      <AppProvider>
        <RouterProvider router={router} />
        <Toaster 
          position="top-right" 
          toastOptions={{
            style: {
              background: 'rgba(0, 0, 0, 0.9)',
              border: '1px solid rgba(204, 170, 0, 0.5)',
              color: '#ffffff',
            },
            className: 'backdrop-blur-xl',
          }}
        />
      </AppProvider>
    </AuthProvider>
  );
}