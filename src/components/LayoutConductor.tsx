import {
  Outlet,
  useNavigate,
} from "react-router";
import {
  LogOut,
  Truck,
} from "lucide-react";
import { useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import logoImage from "../assets/AvicolaLogo.png";

export function LayoutConductor() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

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
      .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(204, 170, 0, 0.2); border-radius: 10px; }
    `;
    document.head.appendChild(style);
    return () => { document.head.removeChild(style); };
  }, []);

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#000000" }}>
      {/* Header compacto sin sidebar */}
      <header
        className="backdrop-blur-xl border-b sticky top-0 z-30"
        style={{ background: "rgba(0, 0, 0, 0.8)", borderColor: "rgba(204, 170, 0, 0.15)" }}
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
                <p className="text-[10px] text-gray-500 hidden sm:block">Panel de Entregas</p>
              </div>
            </div>

            {/* Status + User */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full" style={{ background: "rgba(34, 197, 94, 0.1)", border: "1px solid rgba(34, 197, 94, 0.3)" }}>
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs font-medium text-emerald-400">En Ruta</span>
              </div>

              {user && (
                <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg" style={{ background: "rgba(255,255,255,0.04)" }}>
                  <div className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: "linear-gradient(135deg, #22c55e, #166534)" }}>
                    <Truck className="w-3.5 h-3.5 text-white" />
                  </div>
                  <span className="text-xs font-medium text-white">{user.nombre} {user.apellido}</span>
                </div>
              )}

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
