import {
  Outlet,
  Link,
  useLocation,
  useNavigate,
} from "react-router";
import {
  LogOut,
  Menu,
  Truck,
  RotateCcw,
  History,
  UserCircle,
  PackageCheck,
  Camera,
  Scale
} from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import logoImage from "../assets/13b9ee6c6158fcf1eb469a6ceee3d03ba686bb7d.png";

interface MenuItem {
  label: string;
  path: string;
  icon: any;
}

export function LayoutConductor() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Detectar si es pantalla pequeña para ajustar el estado inicial del sidebar
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setIsSidebarOpen(false);
      } else {
        setIsSidebarOpen(true);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const navigationItems: MenuItem[] = [
    {
      label: "Mis Entregas",
      path: "/dashboard-conductor/entregas",
      icon: Truck,
    },
    {
      label: "Repesadas",
      path: "/dashboard-conductor/repesadas",
      icon: Scale,
    },
    {
      label: "Devoluciones",
      path: "/dashboard-conductor/devoluciones",
      icon: RotateCcw,
    },
    {
      label: "Historial",
      path: "/dashboard-conductor/historial",
      icon: History,
    },
  ];

  const isActive = (path: string) => location.pathname === path;

  // Estilo de animación para el sidebar móvil
  const slideInStyle = {
    animation: 'slideIn 0.3s ease-out',
  };

  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes slideIn {
        from { transform: translateX(-100%); }
        to { transform: translateX(0); }
      }
      .custom-scrollbar::-webkit-scrollbar { width: 4px; }
      .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
      .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(204, 170, 0, 0.2); border-radius: 10px; }
    `;
    document.head.appendChild(style);
    return () => { document.head.removeChild(style); };
  }, []);

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="p-4 sm:p-6 border-b flex-shrink-0" style={{ borderColor: "rgba(204, 170, 0, 0.2)" }}>
        <div className="flex items-center gap-3">
          <img
            src={logoImage}
            alt="Avícola Jossy"
            className="w-8 h-8 sm:w-10 sm:h-10"
            style={{ filter: "drop-shadow(0 4px 8px rgba(255, 215, 0, 0.3))" }}
          />
          {(isSidebarOpen || isMobileSidebarOpen) && (
            <div className="lg:block truncate">
              <h1 className="font-bold text-base sm:text-lg">
                <span style={{ color: "#22c55e" }}>AVÍCOLA </span>
                <span style={{ color: "#ccaa00" }}>JOSSY</span>
              </h1>
              <p className="text-xs text-white hidden sm:block">Panel Conductor</p>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-1 custom-scrollbar">
        {navigationItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.label}
              to={item.path}
              onClick={() => setIsMobileSidebarOpen(false)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all group"
              style={{
                background: isActive(item.path)
                  ? "linear-gradient(to right, #0d4a24, #ccaa00)"
                  : "transparent",
                color: isActive(item.path) ? "#ffffff" : "#9ca3af",
              }}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              {(isSidebarOpen || isMobileSidebarOpen) && (
                <span className="font-medium text-sm sm:text-base whitespace-nowrap">
                  {item.label}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* User Section */}
      <div className="p-3 sm:p-4 border-t space-y-2 flex-shrink-0" style={{ borderColor: "rgba(204, 170, 0, 0.2)" }}>
        {(isSidebarOpen || isMobileSidebarOpen) && user && (
          <div className="px-3 py-2 rounded-lg" style={{ background: "rgba(204, 170, 0, 0.1)" }}>
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ background: "linear-gradient(135deg, #22c55e, #166534)" }}
              >
                <Truck className="w-5 h-5 text-white" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-white truncate">
                  {user.nombre} {user.apellido}
                </p>
                <p className="text-xs text-gray-400 capitalize truncate">{user.rol}</p>
              </div>
            </div>
          </div>
        )}

        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all hover:scale-105"
          style={{ background: "rgba(239, 68, 68, 0.1)", color: "#ef4444", border: "1px solid rgba(239, 68, 68, 0.3)" }}
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          {(isSidebarOpen || isMobileSidebarOpen) && (
            <span className="font-medium text-sm sm:text-base whitespace-nowrap">Cerrar Sesión</span>
          )}
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex" style={{ background: "#000000" }}>
      <aside
        className={`hidden lg:flex flex-col backdrop-blur-xl border-r transition-all duration-300 fixed left-0 top-0 bottom-0 z-40 ${isSidebarOpen ? "w-[280px]" : "w-[80px]"}`}
        style={{ background: "rgba(0, 0, 0, 0.6)", borderColor: "rgba(204, 170, 0, 0.2)" }}
      >
        <SidebarContent />
      </aside>

      {isMobileSidebarOpen && (
        <>
          <div className="lg:hidden fixed inset-0 z-40 bg-black/80 backdrop-blur-sm" onClick={() => setIsMobileSidebarOpen(false)} />
          <aside
            className="lg:hidden fixed inset-y-0 left-0 z-50 w-[280px] sm:w-[320px] backdrop-blur-xl border-r"
            style={{ background: "rgba(0, 0, 0, 0.95)", borderColor: "rgba(204, 170, 0, 0.2)", ...slideInStyle }}
          >
            <SidebarContent />
          </aside>
        </>
      )}

      <div className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${isSidebarOpen ? "lg:ml-[280px]" : "lg:ml-[80px]"}`}>
        <header
          className={`backdrop-blur-xl border-b fixed top-0 z-30 right-0 transition-all duration-300 ${isSidebarOpen ? "lg:left-[280px]" : "lg:left-[80px]"} left-0`}
          style={{ background: "rgba(0, 0, 0, 0.6)", borderColor: "rgba(204, 170, 0, 0.2)" }}
        >
          <div className="px-3 sm:px-5 lg:px-6">
            <div className="flex items-center justify-between h-14 sm:h-16">
              <button
                onClick={() => setIsMobileSidebarOpen(true)}
                className="lg:hidden p-2 rounded-lg hover:bg-white/5 transition-colors"
                style={{ color: "#ccaa00" }}
              >
                <Menu className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>

              <button
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="hidden lg:block p-2 rounded-lg hover:bg-white/5 transition-colors"
                style={{ color: "#ccaa00" }}
              >
                <Menu className="w-6 h-6" />
              </button>

              <div className="lg:hidden w-10" />

              <div className="flex items-center gap-2 sm:gap-3">
                <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full" style={{ background: "rgba(34, 197, 94, 0.1)", border: "1px solid rgba(34, 197, 94, 0.3)" }}>
                  <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
                  <span className="text-xs font-medium" style={{ color: "#3b82f6" }}>En Ruta</span>
                </div>
                <div className="hidden md:block text-right">
                  <p className="text-xs sm:text-sm font-medium text-white truncate max-w-[150px]">{user?.nombre} {user?.apellido}</p>
                  <p className="text-xs text-gray-400 capitalize truncate">{user?.rol}</p>
                </div>
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: "linear-gradient(135deg, #22c55e, #166534)" }}>
                  <Truck className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto px-3 sm:px-5 lg:px-6 py-4 sm:py-6 lg:py-8 mt-14 sm:mt-16">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
