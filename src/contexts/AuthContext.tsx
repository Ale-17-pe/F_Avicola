import { createContext, useContext, useState, ReactNode } from 'react';

export interface User {
  id: string;
  username: string;
  nombre: string;
  apellido: string;
  rol: 'administrador' | 'secretaria' | 'vendedor' | 'contador' | 'operador' | 'conductor' | 'cobranza';
  email?: string;
  conductorRegistradoId?: string;
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
  },
  {
    id: '4',
    username: 'conductor',
    password: 'conductor123',
    nombre: 'Jorge',
    apellido: 'Pérez Silva',
    rol: 'conductor' as const,
    email: 'jorge.perez@avicolajossy.com'
  },
  {
    id: '5',
    username: 'cobranza',
    password: 'cobranza123',
    nombre: 'Maria',
    apellido: 'Lopez',
    rol: 'cobranza' as const,
    email: 'maria.lopez@avicolajossy.com'
  }
];

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  const login = (username: string, password: string): boolean => {
    // Primero buscar en usuarios fijos del sistema
    const usuarioEncontrado = usuarios.find(
      u => u.username === username && u.password === password
    );

    if (usuarioEncontrado) {
      const { password: _, ...userWithoutPassword } = usuarioEncontrado;
      setUser(userWithoutPassword);
      return true;
    }

    // Buscar en conductores registrados dinámicamente
    try {
      const conductoresStr = localStorage.getItem('avicola_conductoresRegistrados');
      if (conductoresStr) {
        const conductores = JSON.parse(conductoresStr) as { id: string; nombre: string; usuario: string; clave: string; placa: string }[];
        const conductorEncontrado = conductores.find(
          c => c.usuario === username && c.clave === password
        );
        if (conductorEncontrado) {
          const partes = conductorEncontrado.nombre.trim().split(' ');
          const nombre = partes[0] || conductorEncontrado.nombre;
          const apellido = partes.slice(1).join(' ') || '';
          setUser({
            id: `conductor-${conductorEncontrado.id}`,
            username: conductorEncontrado.usuario,
            nombre,
            apellido,
            rol: 'conductor',
            conductorRegistradoId: conductorEncontrado.id,
          });
          return true;
        }
      }
    } catch (_) { /* ignore parse errors */ }
    
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
