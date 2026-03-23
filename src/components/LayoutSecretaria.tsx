import {
  Outlet,
  Link,
  useLocation,
  useNavigate,
} from "react-router";
import {
  Users,
  DollarSign,
  LogOut,
  FileSpreadsheet,
  Package,
  ShoppingCart,
  UserCircle,
  Truck,
  ClipboardList,
  Wallet,
  Briefcase,
  Sun,
  Moon,
} from "lucide-react";
import { useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import logoImage from "../assets/AvicolaLogo.png";
import { useTheme, t } from '../contexts/ThemeContext';

interface MenuItem {
  label: string;
  path: string;
  icon: any;
}

export function LayoutSecretaria() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const c = t(isDark);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const baseNavigationItems: MenuItem[] = [
    {
      label: "Cartera de Cobro",
      path: "/dashboard-secretaria",
      icon: DollarSign,
    },
    {
      label: "Validación de Pagos",
      path: "/dashboard-secretaria/validacion-pagos",
      icon: Wallet,
    },
    {
      label: "Nuevo Pedido",
      path: "/dashboard-secretaria/nuevo-pedido",
      icon: ShoppingCart,
    },
    {
      label: "Seguimiento de Pedidos",
      path: "/dashboard-secretaria/lista-pedidos",
      icon: ClipboardList,
    },
    {
      label: "Compras y Almacén",
      path: "/dashboard-secretaria/inventario",
      icon: Package,
    },
    {
      label: "Consulta de Clientes",
      path: "/dashboard-secretaria/clientes",
      icon: Users,
    },
    {
      label: "Gestión Logística",
      path: "/dashboard-secretaria/logistica",
      icon: Truck,
    },
    {
      label: "Control de Pedidos",
      path: "/dashboard-secretaria/control",
      icon: FileSpreadsheet,
    },
  ];

  const navigationItems: MenuItem[] = user?.rol === 'super-secretaria'
    ? [
        ...baseNavigationItems,
        {
          label: "RRHH",
          path: "/dashboard-secretaria/rrhh",
          icon: Briefcase,
        },
      ]
    : baseNavigationItems;

  const isActive = (path: string) => location.pathname === path;

  // Obtener el título de la página actual
  const getCurrentTitle = () => {
    for (const item of navigationItems) {
      if (item.path && (location.pathname === item.path || location.pathname === item.path + '/')) return item.label;
    }
    if (location.pathname === '/dashboard-secretaria') return "Cartera de Cobro";
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
          boxShadow: c.shadowHeader,
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
              <button
                onClick={toggleTheme}
                className="p-1.5 sm:p-2 rounded-lg transition-all duration-200 hover:scale-110"
                style={{ background: c.g10, color: '#ccaa00' }}
                title={isDark ? 'Modo claro' : 'Modo oscuro'}
              >
                {isDark ? <Sun className="w-4 h-4 sm:w-5 sm:h-5" /> : <Moon className="w-4 h-4 sm:w-5 sm:h-5" />}
              </button>
              <div className="text-right hidden sm:block">
                <p className="text-xs sm:text-sm font-medium" style={{ color: c.text }}>
                  {user?.nombre} {user?.apellido}
                </p>
                <p className="text-xs capitalize" style={{ color: c.textSecondary }}>
                  {user?.rol}
                </p>
              </div>
              <div
                className="w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ background: "linear-gradient(135deg, #ccaa00, #b8941e)" }}
              >
                <UserCircle className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
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
      <main className="flex-1 overflow-y-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6">
        <Outlet />
      </main>
    </div>
  );
}