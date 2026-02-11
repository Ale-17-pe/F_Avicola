import { createContext, useContext, useState, ReactNode } from 'react';

interface User {
  id: string;
  username: string;
  nombre: string;
  apellido: string;
  rol: 'administrador' | 'secretaria' | 'vendedor' | 'contador' | 'operador';
  email?: string;
}

interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => boolean;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Usuarios del sistema
const usuarios = [
  {
    id: '1',
    username: 'admin',
    password: 'admin123',
    nombre: 'Administrador',
    apellido: 'Sistema',
    rol: 'administrador' as const,
    email: 'admin@avicolajossy.com'
  },
  {
    id: '2',
    username: 'secretaria',
    password: 'secretaria123',
    nombre: 'Ana',
    apellido: 'García López',
    rol: 'secretaria' as const,
    email: 'ana.garcia@avicolajossy.com'
  },
  {
    id: '3',
    username: 'operador',
    password: 'operador123',
    nombre: 'Carlos',
    apellido: 'Mendoza Torres',
    rol: 'operador' as const,
    email: 'carlos.mendoza@avicolajossy.com'
  }
];

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  const login = (username: string, password: string): boolean => {
    const usuarioEncontrado = usuarios.find(
      u => u.username === username && u.password === password
    );

    if (usuarioEncontrado) {
      const { password: _, ...userWithoutPassword } = usuarioEncontrado;
      setUser(userWithoutPassword);
      return true;
    }
    
    return false;
  };

  const logout = () => {
    setUser(null);
  };

  return (
    <AuthContext.Provider 
      value={{ 
        user, 
        login, 
        logout, 
        isAuthenticated: !!user 
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de AuthProvider');
  }
  return context;
}
