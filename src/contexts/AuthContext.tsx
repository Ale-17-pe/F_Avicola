import { createContext, useContext, useState, ReactNode } from 'react';

export interface User {
  id: string;
  username: string;
  nombre: string;
  apellido: string;
  rol: 'administrador' | 'super-secretaria' | 'secretaria' | 'vendedor' | 'contador' | 'operador' | 'conductor' | 'cobranza' | 'seguridad';
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
    username: 'supersecretaria',
    password: 'super123',
    nombre: 'Super',
    apellido: 'Secretaria',
    rol: 'super-secretaria' as const,
    email: 'super.secretaria@avicolajossy.com'
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

    // Buscar en empleados registrados dinámicamente (RRHH)
    try {
      const empleadosStr = localStorage.getItem('avicola_empleados');
      if (empleadosStr) {
        const empleados = JSON.parse(empleadosStr) as {
          id: string;
          nombre: string;
          apellidos: string;
          usuario?: string;
          clave?: string;
          estado: 'Activo' | 'Descanso';
          rolSistema?: 'secretaria' | 'operador' | 'cobranza' | 'seguridad' | 'conductor';
          cargo?: 'Secretaria' | 'Producción' | 'Pesaje' | 'Seguridad' | 'Operadora' | 'Cobranza' | 'Conductor';
        }[];

        const emp = empleados.find(e => e.usuario === username && e.clave === password && e.estado === 'Activo');
        if (emp) {
          const rolMapFromCargo: Record<string, User['rol']> = {
            Secretaria: 'secretaria',
            Operadora: 'operador',
            Seguridad: 'seguridad',
            Cobranza: 'cobranza',
            Conductor: 'conductor',
          };

          const rol = (emp.rolSistema as User['rol'] | undefined) || (emp.cargo ? rolMapFromCargo[emp.cargo] : undefined);
          if (rol) {
            setUser({
              id: `empleado-${emp.id}`,
              username: emp.usuario || username,
              nombre: emp.nombre,
              apellido: emp.apellidos,
              rol,
              conductorRegistradoId: rol === 'conductor' ? emp.id : undefined,
            });
            return true;
          }
        }
      }
    } catch (_) { /* ignore parse errors */ }

    // Buscar en conductores registrados dinámicamente
    try {
      const conductoresStr = localStorage.getItem('avicola_conductoresRegistrados');
      if (conductoresStr) {
        const conductores = JSON.parse(conductoresStr) as { id: string; nombre: string; usuario: string; clave: string }[];
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
