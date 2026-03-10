import {
  Outlet,
  Link,
  useLocation,
  useNavigate,
} from "react-router";
import {
  Users,
  Bird,
  LayoutDashboard,
  LogOut,
  Package,
  ShoppingCart,
  DollarSign,
  TrendingUp,
  FileText,
  Settings,
  Truck,
  Users as UsersIcon,
  PackageOpen,
  Sun,
  Moon,
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useTheme, t } from "../contexts/ThemeContext";
import logoImage from "../assets/AvicolaLogo.png";

interface MenuItem {
  label: string;
  path?: string;
  icon: any;
  children?: { label: string; path: string; icon: any }[];
}

export function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { isDark, toggleTheme } = useTheme();
  const c = t(isDark);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Cerrar dropdown al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Cerrar dropdown al cambiar de ruta
  useEffect(() => {
    setOpenDropdown(null);
  }, [location.pathname]);

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
      label: "Inventario",
      icon: Package,
      children: [
        {
          label: "Proveedores",
          path: "/dashboard/proveedores",
          icon: Users,
        },
        {
          label: "Aves",
          path: "/dashboard/aves",
          icon: Bird
        },
        {
          label: "Contenedores",
          path: "/dashboard-secretaria/contenedores",
          icon: PackageOpen,
        },
      ],
    },
    {
      label: "Ventas",
      icon: ShoppingCart,
      children: [
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
      ],
    },
    {
      label: "Distribución",
      icon: Truck,
      children: [
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
      ],
    },
    {
      label: "Finanzas",
      icon: DollarSign,
      children: [
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
      ],
    },
    {
      label: "Recursos Humanos",
      icon: UsersIcon,
      children: [
        {
          label: "Empleados",
          path: "/dashboard/rrhh/empleados",
          icon: UsersIcon,
        },
        {
          label: "Asistencia",
          path: "/dashboard/rrhh/asistencia",
          icon: FileText,
        },
      ],
    },
    {
      label: "Reportes",
      icon: FileText,
      children: [
        {
          label: "Informes",
          path: "/dashboard/reportes/informes",
          icon: FileText,
        },
      ],
    },
    {
      label: "Auditoría",
      path: "/dashboard/auditoria",
      icon: Settings,
    },
  ];

  const isActive = (path: string) => location.pathname === path;
  const isGroupActive = (children?: { path: string }[]) => {
    if (!children) return false;
    return children.some(
      (child) => location.pathname === child.path
    );
  };

  // Obtener el título de la página actual
  const getCurrentTitle = () => {
    for (const item of menuItems) {
      if (item.path && location.pathname === item.path) return item.label;
      if (item.children) {
        const child = item.children.find(c => location.pathname === c.path);
        if (child) return child.label;
      }
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
          <div className="flex items-center h-14 sm:h-16 gap-2 sm:gap-3">
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
            <nav ref={dropdownRef} className="flex items-center gap-1 overflow-x-auto flex-1 min-w-0 py-1">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const hasChildren = item.children && item.children.length > 0;
                const groupActive = isGroupActive(item.children);

                if (item.path) {
                  // Direct link item
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
                }

                // Group item with dropdown
                return (
                  <div key={item.label} className="relative flex-shrink-0">
                    <button
                      onClick={() => setOpenDropdown(openDropdown === item.label ? null : item.label)}
                      title={item.label}
                      className="p-2 sm:p-2.5 rounded-lg transition-all hover:scale-110"
                      style={{
                        background: groupActive
                          ? "rgba(34, 197, 94, 0.15)"
                          : openDropdown === item.label
                            ? (isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)")
                            : "transparent",
                        color: groupActive ? "#22c55e" : c.inactiveNav,
                      }}
                    >
                      <Icon className="w-5 h-5" />
                    </button>

                    {/* Dropdown */}
                    {openDropdown === item.label && hasChildren && (
                      <div
                        className="absolute top-full left-0 mt-1 py-1 rounded-lg border min-w-[180px] z-50"
                        style={{
                          background: isDark ? "rgba(15, 15, 15, 0.98)" : "rgba(255, 255, 255, 0.98)",
                          borderColor: c.borderGold,
                          boxShadow: "0 8px 24px rgba(0,0,0,0.3)",
                        }}
                      >
                        <div className="px-3 py-1.5 text-xs font-semibold uppercase tracking-wider" style={{ color: c.textSecondary }}>
                          {item.label}
                        </div>
                        {item.children!.map((child) => {
                          const ChildIcon = child.icon;
                          return (
                            <Link
                              key={child.path}
                              to={child.path}
                              className="flex items-center gap-2.5 px-3 py-2 mx-1 rounded-md transition-all"
                              style={{
                                background: isActive(child.path)
                                  ? "linear-gradient(to right, #0d4a24, #ccaa00)"
                                  : "transparent",
                                color: isActive(child.path) ? "#ffffff" : c.text,
                              }}
                            >
                              <ChildIcon className="w-4 h-4 flex-shrink-0" />
                              <span className="text-sm font-medium">{child.label}</span>
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </nav>

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
        </div>
      </header>

      {/* Page Content */}
      <main className="flex-1 overflow-y-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-5 lg:py-6">
        <Outlet />
      </main>
    </div>
  );
}