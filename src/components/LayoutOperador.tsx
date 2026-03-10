import {
  Outlet,
  Link,
  useLocation,
  useNavigate,
} from "react-router";
import {
  LogOut,
  ClipboardList,
  Scale,
  Truck,
  Wrench,
  ShoppingCart,
  Sun,
  Moon,
} from "lucide-react";
import { useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useTheme, t } from "../contexts/ThemeContext";
import logoImage from "../assets/AvicolaLogo.png";

interface MenuItem {
  label: string;
  path: string;
  icon: any;
}

export function LayoutOperador() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const c = t(isDark);

  // Redirigir a nuevo-pedido si estamos en la raíz del dashboard-operador
  useEffect(() => {
    if (location.pathname === '/dashboard-operador') {
      navigate('/dashboard-operador/nuevo-pedido', { replace: true });
    }
  }, [location.pathname, navigate]);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const navigationItems: MenuItem[] = [
    {
      label: "Nuevo Pedido",
      path: "/dashboard-operador/nuevo-pedido",
      icon: ShoppingCart,
    },
    {
      label: "Seguimiento de Pedidos",
      path: "/dashboard-operador/lista-pedidos",
      icon: ClipboardList,
    },
    {
      label: "Pesaje",
      path: "/dashboard-operador/pesaje",
      icon: Scale,
    },
    {
      label: "Envíos",
      path: "/dashboard-operador/envios",
      icon: Truck,
    },
  ];

  const isActive = (path: string) => location.pathname === path;

  // Obtener el título de la página actual
  const getCurrentTitle = () => {
    for (const item of navigationItems) {
      if (item.path && location.pathname === item.path) return item.label;
    }
    if (location.pathname === '/dashboard-operador') return "Nuevo Pedido";
    return "Avícola Jossy";
  };

  const currentTitle = getCurrentTitle();

  // Actualizar el título del documento
  useEffect(() => {
    document.title = `${currentTitle} | Avícola Jossy`;
  }, [currentTitle]);

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{
        background: c.bgPage,
        color: c.text,
        transition: 'background 0.25s ease, color 0.25s ease',
      }}
    >
      {/* Top Navigation Bar */}
      <header
        className="backdrop-blur-xl border-b sticky top-0 z-30"
        style={{
          background: c.bgSidebarAlt,
          borderColor: c.borderGold,
        }}
      >
        <div className="px-3 sm:px-6">
          <div className="flex items-center h-14 sm:h-16 gap-2 sm:gap-4">
            {/* Logo */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <img
                src={logoImage}
                alt="Avícola Jossy"
                className="w-8 h-8"
                style={{ filter: "drop-shadow(0 4px 8px rgba(255, 215, 0, 0.3))" }}
              />
            </div>

            {/* Separator */}
            <div className="w-px h-8 flex-shrink-0" style={{ background: c.borderGold }} />

            {/* Navigation Icons */}
            <nav className="flex items-center gap-1 overflow-x-auto flex-1 min-w-0 py-1">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.label}
                    to={item.path}
                    title={item.label}
                    className="p-2 sm:p-2.5 rounded-lg transition-all flex-shrink-0 hover:scale-110"
                    style={{
                      background: isActive(item.path)
                        ? "linear-gradient(to right, #0d4a24, #ccaa00)"
                        : "transparent",
                      color: isActive(item.path) ? "#ffffff" : c.inactiveNav,
                    }}
                  >
                    <Icon className="w-5 h-5" />
                  </Link>
                );
              })}
            </nav>

            {/* Right side */}
            <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
              {/* Badge de rol */}
              <div
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full"
                style={{
                  background: "rgba(34, 197, 94, 0.1)",
                  border: "1px solid rgba(34, 197, 94, 0.3)",
                }}
              >
                <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                <span className="text-xs font-medium" style={{ color: "#22c55e" }}>
                  Operador
                </span>
              </div>

              {/* Info usuario */}
              <div className="hidden md:block text-right">
                <p className="text-xs sm:text-sm font-medium truncate max-w-[150px]" style={{ color: c.text }}>
                  {user?.nombre} {user?.apellido}
                </p>
                <p className="text-xs capitalize truncate" style={{ color: c.textSecondary }}>
                  {user?.rol}
                </p>
              </div>

              {/* Theme Toggle */}
              <button
                onClick={toggleTheme}
                className="p-1.5 sm:p-2 rounded-lg transition-all duration-200 hover:scale-110"
                style={{ background: c.g10, color: '#ccaa00' }}
                title={isDark ? 'Modo claro' : 'Modo oscuro'}
              >
                {isDark ? <Sun className="w-4 h-4 sm:w-5 sm:h-5" /> : <Moon className="w-4 h-4 sm:w-5 sm:h-5" />}
              </button>

              {/* Avatar */}
              <div
                className="w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ background: "linear-gradient(135deg, #22c55e, #166534)" }}
              >
                <Wrench className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>

              {/* Logout */}
              <button
                onClick={handleLogout}
                className="p-2 rounded-lg transition-all hover:scale-105"
                style={{
                  background: "rgba(239, 68, 68, 0.1)",
                  color: "#ef4444",
                  border: "1px solid rgba(239, 68, 68, 0.2)",
                }}
                title="Cerrar Sesión"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Page Content */}
      <main className="flex-1 overflow-y-auto px-3 sm:px-5 lg:px-6 py-4 sm:py-6">
        <Outlet />
      </main>
    </div>
  );
}