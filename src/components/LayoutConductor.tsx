import {
  Outlet,
  useNavigate,
} from "react-router";
import {
  LogOut,
  Truck,
  Sun,
  Moon,
} from "lucide-react";
import { useEffect, useMemo } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useApp } from "../contexts/AppContext";
import { useTheme, t } from '../contexts/ThemeContext';
import logoImage from "../assets/AvicolaLogo.png";
import { toast } from 'sonner';

export function LayoutConductor() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { conductoresRegistrados, updateConductorRegistrado } = useApp();
  const { isDark, toggleTheme } = useTheme();
  const c = t(isDark);

  // Buscar al conductor actual por su ID de registro
  const conductorActual = useMemo(() => {
    if (!user?.conductorRegistradoId) return null;
    return conductoresRegistrados.find(cd => cd.id === user.conductorRegistradoId) || null;
  }, [user, conductoresRegistrados]);

  const estaConduciendo = conductorActual?.estado === 'Conduciendo';

  const toggleEstadoConductor = () => {
    if (!conductorActual) {
      toast.error('No estás registrado como conductor en el sistema');
      return;
    }
    const nuevoEstado = estaConduciendo ? 'Esperando' : 'Conduciendo';
    updateConductorRegistrado({ ...conductorActual, estado: nuevoEstado });
    toast.success(nuevoEstado === 'Conduciendo' ? '¡En camino! Estado actualizado a Conduciendo' : 'Estado actualizado a Esperando');
  };

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  useEffect(() => {
    document.title = `Entregas | Avícola Jossy`;
  }, []);

  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      .custom-scrollbar::-webkit-scrollbar { width: 4px; }
      .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
      .custom-scrollbar::-webkit-scrollbar-thumb { background: ${c.borderGold}; border-radius: 10px; }
    `;
    document.head.appendChild(style);
    document.body.style.backgroundColor = isDark ? '#000000' : '#f3f4f6';
    return () => { document.head.removeChild(style); };
  }, [isDark, c.borderGold]);

  return (
    <div className="min-h-screen flex flex-col" style={{ background: c.bgPage, color: c.text, transition: 'background 0.25s ease, color 0.25s ease' }}>
      {/* Header compacto sin sidebar */}
      <header
        className="backdrop-blur-xl border-b sticky top-0 z-30"
        style={{ background: c.bgHeader, borderColor: c.borderGold, boxShadow: c.shadowHeader }}
      >
        <div className="px-4 sm:px-6">
          <div className="flex items-center justify-between h-14 sm:h-16">
            {/* Logo + Title */}
            <div className="flex items-center gap-3">
              <img
                src={logoImage}
                alt="Avícola Jossy"
                className="w-8 h-8"
                style={{ filter: "drop-shadow(0 4px 8px rgba(255, 215, 0, 0.3))" }}
              />
              <div>
                <h1 className="font-bold text-sm sm:text-base leading-tight">
                  <span style={{ color: "#22c55e" }}>AVÍCOLA </span>
                  <span style={{ color: "#ccaa00" }}>JOSSY</span>
                </h1>
                <p className="text-[10px] hidden sm:block" style={{ color: c.textSecondary }}>Panel de Entregas</p>
              </div>
            </div>

            {/* Status Toggle + User */}
            <div className="flex items-center gap-3">
              <button
                onClick={toggleEstadoConductor}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full transition-all hover:scale-105 cursor-pointer"
                style={{
                  background: estaConduciendo ? "rgba(34, 197, 94, 0.1)" : "rgba(245, 158, 11, 0.1)",
                  border: `1px solid ${estaConduciendo ? "rgba(34, 197, 94, 0.3)" : "rgba(245, 158, 11, 0.3)"}`,
                }}
                title={estaConduciendo ? 'Cambiar a Esperando' : 'Cambiar a Conduciendo'}
              >
                <div
                  className="relative w-8 h-4 rounded-full transition-all"
                  style={{ background: estaConduciendo ? 'rgba(34,197,94,0.4)' : 'rgba(245,158,11,0.4)' }}
                >
                  <div
                    className="absolute top-0.5 w-3 h-3 rounded-full transition-all"
                    style={{
                      background: estaConduciendo ? '#22c55e' : '#f59e0b',
                      left: estaConduciendo ? '18px' : '2px',
                    }}
                  />
                </div>
                {estaConduciendo && <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />}
                <span className="text-xs font-medium" style={{ color: estaConduciendo ? '#22c55e' : '#f59e0b' }}>
                  {estaConduciendo ? 'Conduciendo' : 'Esperando'}
                </span>
              </button>

              {user && (
                <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg" style={{ background: c.g04 }}>
                  <div className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: "linear-gradient(135deg, #22c55e, #166534)" }}>
                    <Truck className="w-3.5 h-3.5 text-white" />
                  </div>
                  <span className="text-xs font-medium" style={{ color: c.text }}>{user.nombre} {user.apellido}</span>
                </div>
              )}

              <button
                onClick={toggleTheme}
                className="p-1.5 sm:p-2 rounded-lg transition-all duration-200 hover:scale-110"
                style={{ background: c.g10, color: '#ccaa00' }}
                title={isDark ? 'Modo claro' : 'Modo oscuro'}
              >
                {isDark ? <Sun className="w-4 h-4 sm:w-5 sm:h-5" /> : <Moon className="w-4 h-4 sm:w-5 sm:h-5" />}
              </button>

              <button
                onClick={handleLogout}
                className="p-2 rounded-lg transition-all hover:scale-105"
                style={{ background: "rgba(239, 68, 68, 0.1)", color: "#ef4444", border: "1px solid rgba(239, 68, 68, 0.2)" }}
                title="Cerrar sesión"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Content - Full width */}
      <main className="flex-1 overflow-y-auto px-3 sm:px-5 lg:px-8 py-4 sm:py-6">
        <Outlet />
      </main>
    </div>
  );
}
