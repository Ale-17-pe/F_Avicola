import {
  Outlet,
  Link,
  useLocation,
  useNavigate,
} from "react-router";
import {
  LayoutDashboard,
  LogOut,
  Users,
  Bird,
  Package,
  ShoppingCart,
  DollarSign,
  TrendingUp,
  FileText,
  Settings,
  Truck,
  Users as UsersIcon,
  PackageOpen,
  ClipboardList,
  SlidersHorizontal,
  Sun,
  Moon,
} from "lucide-react";
import { useEffect } from "react";
import { useTheme, t } from "../contexts/ThemeContext";
import logoImage from "../assets/AvicolaLogo.png";

interface MenuItem {
  label: string;
  path: string;
  icon: any;
}

export function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { isDark, toggleTheme } = useTheme();
  const c = t(isDark);

  const handleLogout = () => {
    navigate("/");
  };

  const menuItems: MenuItem[] = [
    {
      label: "Dashboard",
      path: "/dashboard",
      icon: LayoutDashboard,
    },
    {
      label: "Proveedores",
      path: "/dashboard/proveedores",
      icon: Users,
    },
    {
      label: "Aves",
      path: "/dashboard/aves",
      icon: Bird,
    },
    {
      label: "Inventario",
      path: "/dashboard/inventario-completo",
      icon: Package,
    },
    {
      label: "Pedidos",
      path: "/dashboard/ventas/pedidos",
      icon: ShoppingCart,
    },
    {
      label: "Clientes",
      path: "/dashboard/ventas/clientes",
      icon: UsersIcon,
    },
    {
      label: "Envíos",
      path: "/dashboard/distribucion/envios",
      icon: Truck,
    },
    {
      label: "Control",
      path: "/dashboard/distribucion/control",
      icon: FileText,
    },
    {
      label: "Reg. Devoluciones",
      path: "/dashboard/distribucion/registro-devoluciones",
      icon: ClipboardList,
    },
    {
      label: "Ingresos",
      path: "/dashboard/finanzas/ingresos",
      icon: TrendingUp,
    },
    {
      label: "Gastos",
      path: "/dashboard/finanzas/gastos",
      icon: DollarSign,
    },
    {
      label: "Empleados",
      path: "/dashboard/rrhh/empleados",
      icon: UsersIcon,
    },
    {
      label: "Asistencia",
      path: "/dashboard/rrhh/asistencia",
      icon: ClipboardList,
    },
    {
      label: "Informes",
      path: "/dashboard/reportes/informes",
      icon: FileText,
    },
    {
      label: "Auditoría",
      path: "/dashboard/auditoria",
      icon: Settings,
    },
    {
      label: "Configuración",
      path: "/dashboard/configuracion",
      icon: SlidersHorizontal,
    },
  ];

  const isActive = (path: string) => location.pathname === path;

  // Obtener el título de la página actual
  const getCurrentTitle = () => {
    for (const item of menuItems) {
      if (location.pathname === item.path) return item.label;
    }
    if (location.pathname.includes('/configuracion')) return "Configuración";
    if (location.pathname === '/dashboard') return "Dashboard";
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
          background: c.bgHeader,
          borderColor: c.borderGold,
          boxShadow: c.shadowHeader,
        }}
      >
        <div className="px-3 sm:px-4 lg:px-6">
          <div className="flex items-center justify-between h-14 sm:h-16 gap-2 sm:gap-3">
            {/* Logo */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <img
                src={logoImage}
                alt="Avícola Jossy"
                className="w-8 h-8"
                style={{ filter: "drop-shadow(0 4px 8px rgba(255, 215, 0, 0.3))" }}
              />
            </div>

            {/* Right side */}
            <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
              {/* Theme Toggle */}
              <button
                onClick={toggleTheme}
                className="p-1.5 sm:p-2 rounded-lg transition-all duration-200 hover:scale-110"
                style={{ background: c.g10, color: '#ccaa00' }}
                title={isDark ? 'Modo claro' : 'Modo oscuro'}
              >
                {isDark ? <Sun className="w-4 h-4 sm:w-5 sm:h-5" /> : <Moon className="w-4 h-4 sm:w-5 sm:h-5" />}
              </button>
              <div className="text-right hidden sm:block min-w-0">
                <p className="text-xs sm:text-sm font-medium truncate" style={{ color: c.text }}>
                  Usuario Admin
                </p>
                <p className="text-xs truncate" style={{ color: c.textSecondary }}>
                  Administrador
                </p>
              </div>
              <div
                className="w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center flex-shrink-0"
                style={{
                  background: "linear-gradient(135deg, #22c55e, #ccaa00)",
                  boxShadow: "0 4px 12px rgba(34, 197, 94, 0.3)",
                }}
              >
                <UsersIcon className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
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

          <div className="pb-3">
            <nav className="flex flex-wrap items-center gap-1.5">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.path);
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className="px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition-all inline-flex items-center gap-1.5"
                    style={{
                      background: active ? "linear-gradient(to right, #0d4a24, #ccaa00)" : c.g04,
                      color: active ? "#ffffff" : c.textSecondary,
                      border: `1px solid ${active ? 'rgba(204,170,0,0.35)' : c.borderSubtle}`,
                    }}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
      </header>

      {/* Page Content */}
      <main className="flex-1 overflow-y-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-5 lg:py-6">
        <Outlet />
      </main>
    </div>
  );
}