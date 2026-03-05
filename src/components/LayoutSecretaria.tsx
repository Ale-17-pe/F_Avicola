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
  Menu,
  FileSpreadsheet,
  Package,
  ShoppingCart,
  Search,
  UserCircle,
  Truck,
  ClipboardList,
  Wallet,
  Sun,
  Moon,
} from "lucide-react";
import { useState, useEffect } from "react";
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
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // 👈 CAMBIADO A false (inicia cerrado)
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const { isDark, toggleTheme } = useTheme();
  const c = t(isDark);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const navigationItems: MenuItem[] = [
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
      label: "Envíos",
      path: "/dashboard-secretaria/envios",
      icon: Truck,
    },
    {
      label: "Control de Pesaje",
      path: "/dashboard-secretaria/control",
      icon: FileSpreadsheet,
    },
  ];

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

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div
        className="p-4 sm:p-6 border-b"
        style={{ borderColor: c.borderGold }}
      >
        <div className="flex items-center gap-3">
          <img
            src={logoImage}
            alt="Avícola Jossy"
            className="w-8 h-8 sm:w-10 sm:h-10"
            style={{
              filter: "drop-shadow(0 4px 8px rgba(255, 215, 0, 0.3))",
            }}
          />
          {(isSidebarOpen || isMobileSidebarOpen) && (
            <div className="lg:block">
              <h1 className="font-bold text-base sm:text-lg">
                <span style={{ color: "#22c55e" }}>AVÍCOLA </span>
                <span style={{ color: "#ccaa00" }}>JOSSY</span>
              </h1>
              <p className="text-xs hidden sm:block" style={{ color: c.textSecondary }}>
                Panel de Secretaría
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-1">
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
                color: isActive(item.path) ? "#ffffff" : c.inactiveNav,
              }}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              {(isSidebarOpen || isMobileSidebarOpen) && (
                <span className="font-medium text-sm sm:text-base">
                  {item.label}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* User Section */}
      <div
        className="p-3 sm:p-4 border-t space-y-2"
        style={{ borderColor: c.borderGold }}
      >
        {/* User Info */}
        {(isSidebarOpen || isMobileSidebarOpen) && user && (
          <div className="px-3 py-2 rounded-lg" style={{ background: c.g10 }}>
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center"
                style={{
                  background: "linear-gradient(135deg, #ccaa00, #b8941e)",
                }}
              >
                <UserCircle className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium" style={{ color: c.text }}>
                  {user.nombre} {user.apellido}
                </p>
                <p className="text-xs capitalize" style={{ color: c.textSecondary }}>{user.rol}</p>
              </div>
            </div>
          </div>
        )}

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all hover:scale-105"
          style={{
            background: "rgba(239, 68, 68, 0.1)",
            color: "#ef4444",
            border: "1px solid rgba(239, 68, 68, 0.3)",
          }}
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          {(isSidebarOpen || isMobileSidebarOpen) && (
            <span className="font-medium text-sm sm:text-base">
              Cerrar Sesión
            </span>
          )}
        </button>
      </div>
    </div>
  );

  return (
    <div
      className="min-h-screen flex"
      style={{
        background: c.bgPage,
        color: c.text,
        transition: 'background 0.25s ease, color 0.25s ease',
      }}
    >
      {/* Desktop Sidebar */}
      <aside
        className={`hidden lg:flex flex-col backdrop-blur-xl border-r transition-all duration-300 fixed left-0 top-0 bottom-0 z-40 ${isSidebarOpen ? "w-[280px]" : "w-[80px]"}`}
        style={{
          background: c.bgSidebarAlt,
          borderColor: c.borderGold,
          boxShadow: c.shadowSidebar,
        }}
      >
        <SidebarContent />
      </aside>

      {/* Mobile & Tablet Sidebar */}
      {isMobileSidebarOpen && (
        <>
          <div
            className="lg:hidden fixed inset-0 z-40 backdrop-blur-sm"
            onClick={() => setIsMobileSidebarOpen(false)}
            style={{ background: isDark ? 'rgba(0,0,0,0.8)' : 'rgba(0,0,0,0.3)' }}
          />
          <aside
            className="lg:hidden fixed inset-y-0 left-0 z-50 w-[280px] sm:w-[320px] backdrop-blur-xl border-r animate-slide-in"
            style={{
              background: c.bgSidebarMobile,
              borderColor: c.borderGold,
              boxShadow: c.shadowSidebar,
            }}
          >
            <SidebarContent />
          </aside>
        </>
      )}

      {/* Main Content */}
      <div
        className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${isSidebarOpen ? "lg:ml-[280px]" : "lg:ml-[80px]"}`}
      >
        {/* Top Header */}
        <header
          className={`backdrop-blur-xl border-b fixed top-0 z-30 right-0 transition-all duration-300 ${isSidebarOpen ? "lg:left-[280px]" : "lg:left-[80px]"} left-0`}
          style={{
            background: c.bgSidebarAlt,
            borderColor: c.borderGold,
            boxShadow: c.shadowHeader,
          }}
        >
          <div className="px-3 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-14 sm:h-16">
              {/* Mobile Menu Button */}
              <button
                onClick={() => setIsMobileSidebarOpen(true)}
                className="lg:hidden p-2 rounded-lg hover:bg-white/5 transition-colors"
                style={{ color: "#ccaa00" }}
              >
                <Menu className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>

              {/* Desktop Collapse Button */}
              <button
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="hidden lg:block p-2 rounded-lg hover:bg-white/5 transition-colors"
                style={{ color: "#ccaa00" }}
              >
                <Menu className="w-6 h-6" />
              </button>

              {/* Título de Página Dinámico */}
              <div className="flex-1 flex justify-center lg:justify-start lg:ml-6">
                <h2 className="text-base sm:text-lg lg:text-xl font-bold tracking-tight" style={{ color: c.text }}>
                  <span className="text-amber-400 lg:hidden mr-2">|</span>
                  {currentTitle}
                </h2>
              </div>

              <div className="flex items-center gap-2 sm:gap-4">
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
                  className="w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center"
                  style={{
                    background: "linear-gradient(135deg, #ccaa00, #b8941e)",
                  }}
                >
                  <UserCircle className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-8 mt-14 sm:mt-16">
          <Outlet />
        </main>
      </div>
    </div>
  );
}