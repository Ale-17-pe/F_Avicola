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
  ChevronDown,
  ChevronRight,
  Package,
  ShoppingCart,
  DollarSign,
  TrendingUp,
  FileText,
  Settings,
  Egg,
  Truck,
  Users as UsersIcon,
  Menu,
  X,
  PackageOpen,
} from "lucide-react";
import { useState, useEffect } from "react";
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
  const [expandedGroups, setExpandedGroups] = useState<string[]>(
    ["Inventario"]
  );
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Detectar si es móvil
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
      if (window.innerWidth < 1024) {
        setIsSidebarOpen(false);
      } else {
        setIsSidebarOpen(true);
      }
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const handleLogout = () => {
    navigate("/");
  };

  const toggleGroup = (label: string) => {
    setExpandedGroups((prev) =>
      prev.includes(label)
        ? prev.filter((g) => g !== label)
        : [...prev, label]
    );
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

  const SidebarContent = ({ isMobile = false }) => (
    <div className="flex flex-col h-full">
      {/* Header móvil */}
      {isMobile && (
        <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: "rgba(204, 170, 0, 0.2)" }}>
          <div className="flex items-center gap-3">
            <img
              src={logoImage}
              alt="Avícola Jossy"
              className="w-8 h-8 sm:w-10 sm:h-10"
              style={{
                filter: "drop-shadow(0 4px 8px rgba(255, 215, 0, 0.3))",
              }}
            />
            <div>
              <h1 className="font-bold text-base sm:text-lg">
                <span style={{ color: "#22c55e" }}>AVÍCOLA </span>
                <span style={{ color: "#ccaa00" }}>JOSSY</span>
              </h1>
              <p className="text-xs text-gray-400">Sistema de Gestión</p>
            </div>
          </div>
          <button
            onClick={() => setIsMobileSidebarOpen(false)}
            className="p-2 rounded-lg hover:bg-white/5"
            style={{ color: "#ccaa00" }}
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Logo desktop */}
      {!isMobile && (
        <div
          className="p-3 sm:p-4 border-b"
          style={{ borderColor: "rgba(204, 170, 0, 0.2)" }}
        >
          <div className="flex items-center gap-3">
            <img
              src={logoImage}
              alt="Avícola Jossy"
              className="w-8 h-8 sm:w-10 sm:h-10 flex-shrink-0"
              style={{
                filter: "drop-shadow(0 4px 8px rgba(255, 215, 0, 0.3))",
              }}
            />
            {(isSidebarOpen || isMobile) && (
              <div className="min-w-0">
                <h1 className="font-bold text-sm sm:text-base lg:text-lg truncate">
                  <span style={{ color: "#22c55e" }}>AVÍCOLA </span>
                  <span style={{ color: "#ccaa00" }}>JOSSY</span>
                </h1>
                <p className="text-xs text-gray-400 hidden sm:block truncate">
                  Sistema de Gestión
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-2 sm:p-3 lg:p-4 space-y-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const hasChildren =
            item.children && item.children.length > 0;
          const isExpanded = expandedGroups.includes(item.label);
          const groupActive = isGroupActive(item.children);

          return (
            <div key={item.label} className="relative">
              {/* Parent Item */}
              {item.path ? (
                <Link
                  to={item.path}
                  onClick={() => isMobile && setIsMobileSidebarOpen(false)}
                  className={`flex items-center gap-2 sm:gap-3 px-2 sm:px-3 py-2 sm:py-2.5 rounded-lg transition-all group ${!isSidebarOpen && !isMobile ? "justify-center" : ""}`}
                  style={{
                    background: isActive(item.path)
                      ? "linear-gradient(to right, #0d4a24, #ccaa00)"
                      : "transparent",
                    color: isActive(item.path)
                      ? "#ffffff"
                      : "#9ca3af",
                  }}
                  title={!isSidebarOpen && !isMobile ? item.label : ""}
                >
                  <Icon className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                  {(isSidebarOpen || isMobile) && (
                    <span className="font-medium text-xs sm:text-sm lg:text-base truncate">
                      {item.label}
                    </span>
                  )}
                </Link>
              ) : (
                <button
                  onClick={() => {
                    toggleGroup(item.label);
                    if (isMobile && !hasChildren) {
                      setIsMobileSidebarOpen(false);
                    }
                  }}
                  className={`w-full flex items-center ${!isSidebarOpen && !isMobile ? "justify-center" : "justify-between"} gap-2 sm:gap-3 px-2 sm:px-3 py-2 sm:py-2.5 rounded-lg transition-all group`}
                  style={{
                    background: groupActive
                      ? "rgba(34, 197, 94, 0.1)"
                      : "transparent",
                    color: groupActive ? "#22c55e" : "#9ca3af",
                  }}
                  title={!isSidebarOpen && !isMobile ? item.label : ""}
                >
                  <div className="flex items-center gap-2 sm:gap-3">
                    <Icon className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                    {(isSidebarOpen || isMobile) && (
                      <span className="font-medium text-xs sm:text-sm lg:text-base truncate">
                        {item.label}
                      </span>
                    )}
                  </div>
                  {(isSidebarOpen || isMobile) &&
                    hasChildren &&
                    (isExpanded ? (
                      <ChevronDown className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                    ) : (
                      <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                    ))}
                </button>
              )}

              {/* Tooltip para sidebar colapsada */}
              {!isSidebarOpen && !isMobile && (
                <div className="absolute left-full ml-2 px-2 py-1 bg-black/90 text-white text-xs rounded-md opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50 border border-gray-700">
                  {item.label}
                </div>
              )}

              {/* Children Items */}
              {hasChildren &&
                isExpanded &&
                (isSidebarOpen || isMobile) && (
                  <div
                    className={`ml-${!isSidebarOpen && !isMobile ? "0" : "3 sm:ml-4"} mt-1 space-y-1 ${!isSidebarOpen && !isMobile ? "" : "border-l pl-3 sm:pl-4"}`}
                    style={{
                      borderColor: "rgba(255, 255, 255, 0.1)",
                    }}
                  >
                    {item.children!.map((child) => {
                      const ChildIcon = child.icon;
                      return (
                        <Link
                          key={child.path}
                          to={child.path}
                          onClick={() => setIsMobileSidebarOpen(false)}
                          className={`flex items-center gap-2 sm:gap-3 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg transition-all ${!isSidebarOpen && !isMobile ? "justify-center" : ""}`}
                          style={{
                            background: isActive(child.path)
                              ? "linear-gradient(to right, #0d4a24, #ccaa00)"
                              : "transparent",
                            color: isActive(child.path)
                              ? "#ffffff"
                              : "#9ca3af",
                          }}
                          title={!isSidebarOpen && !isMobile ? child.label : ""}
                        >
                          <ChildIcon className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                          {(isSidebarOpen || isMobile) && (
                            <span className="font-medium text-xs sm:text-sm truncate">
                              {child.label}
                            </span>
                          )}
                        </Link>
                      );
                    })}
                  </div>
                )}
            </div>
          );
        })}
      </nav>

      {/* User Section */}
      <div
        className={`p-2 sm:p-3 lg:p-4 border-t ${!isSidebarOpen && !isMobile ? "flex justify-center" : ""}`}
        style={{ borderColor: "rgba(204, 170, 0, 0.2)" }}
      >
        <button
          onClick={handleLogout}
          className={`flex items-center gap-2 sm:gap-3 px-2 sm:px-3 py-2 sm:py-2.5 rounded-lg transition-all hover:scale-105 ${!isSidebarOpen && !isMobile ? "justify-center w-10 h-10" : "w-full"}`}
          style={{
            background: "rgba(239, 68, 68, 0.1)",
            color: "#ef4444",
            border: "1px solid rgba(239, 68, 68, 0.3)",
          }}
          title={!isSidebarOpen && !isMobile ? "Cerrar Sesión" : ""}
        >
          <LogOut className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
          {(isSidebarOpen || isMobile) && (
            <span className="font-medium text-xs sm:text-sm lg:text-base">
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
        background: "#000000",
      }}
    >
      {/* Desktop Sidebar */}
      <aside
        className={`hidden lg:flex flex-col backdrop-blur-xl border-r transition-all duration-300 fixed left-0 top-0 bottom-0 z-40 ${isSidebarOpen ? "w-[220px] xl:w-[280px]" : "w-[70px] xl:w-[80px]"}`}
        style={{
          background: "rgba(0, 0, 0, 0.8)",
          borderColor: "rgba(204, 170, 0, 0.2)",
          boxShadow: "4px 0 20px rgba(0, 0, 0, 0.5)",
        }}
      >
        <SidebarContent isMobile={false} />
      </aside>

      {/* Mobile & Tablet Sidebar */}
      {isMobileSidebarOpen && (
        <>
          <div
            className="lg:hidden fixed inset-0 z-40 bg-black/80 backdrop-blur-sm animate-fade-in"
            onClick={() => setIsMobileSidebarOpen(false)}
          />
          <aside
            className="lg:hidden fixed inset-y-0 left-0 z-50 w-[280px] sm:w-[320px] backdrop-blur-xl border-r animate-slide-in"
            style={{
              background: "rgba(0, 0, 0, 0.95)",
              borderColor: "rgba(204, 170, 0, 0.2)",
              boxShadow: "4px 0 20px rgba(0, 0, 0, 0.8)",
            }}
          >
            <SidebarContent isMobile={true} />
          </aside>
        </>
      )}

      {/* Main Content */}
      <div
        className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${isSidebarOpen ? "lg:ml-[220px] xl:ml-[280px]" : "lg:ml-[70px] xl:ml-[80px]"}`}
      >
        {/* Top Header */}
        <header
          className={`backdrop-blur-xl border-b fixed top-0 z-30 transition-all duration-300 ${isSidebarOpen ? "lg:left-[220px] xl:left-[280px]" : "lg:left-[70px] xl:left-[80px]"} left-0 right-0`}
          style={{
            background: "rgba(0, 0, 0, 0.8)",
            borderColor: "rgba(204, 170, 0, 0.2)",
            boxShadow: "0 4px 20px rgba(0, 0, 0, 0.3)",
          }}
        >
          <div className="px-3 sm:px-4 lg:px-6">
            <div className="flex items-center justify-between h-12 sm:h-14 lg:h-16">
              {/* Mobile Menu Button */}
              <button
                onClick={() => setIsMobileSidebarOpen(true)}
                className="lg:hidden p-1.5 sm:p-2 rounded-lg hover:bg-white/5 transition-colors flex-shrink-0"
                style={{ color: "#ccaa00" }}
              >
                <Menu className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>

              {/* Desktop Collapse Button */}
              <button
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="hidden lg:flex p-1.5 sm:p-2 rounded-lg hover:bg-white/5 transition-colors flex-shrink-0"
                style={{ color: "#ccaa00" }}
                title={isSidebarOpen ? "Contraer menú" : "Expandir menú"}
              >
                <Menu className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>

              {/* Logo Mobile */}
              <div className="lg:hidden flex items-center gap-2">
                <img
                  src={logoImage}
                  alt="Avícola Jossy"
                  className="w-8 h-8 sm:w-10 sm:h-10"
                  style={{
                    filter: "drop-shadow(0 4px 8px rgba(255, 215, 0, 0.3))",
                  }}
                />
              </div>

              {/* Título de Página Dinámico */}
              <div className="flex-1 flex justify-center lg:justify-start lg:ml-6">
                <h2 className="text-base sm:text-lg lg:text-xl font-bold text-white tracking-tight">
                  <span className="text-amber-400 lg:hidden mr-2">|</span>
                  {currentTitle}
                </h2>
              </div>

              {/* User Info */}
              <div className="flex items-center gap-2 sm:gap-3 lg:gap-4">
                <div className="text-right hidden sm:block min-w-0">
                  <p className="text-xs sm:text-sm font-medium text-white truncate">
                    Usuario Admin
                  </p>
                  <p className="text-xs text-gray-400 truncate">
                    Administrador
                  </p>
                </div>
                <div
                  className="w-8 h-8 sm:w-9 sm:h-9 lg:w-10 lg:h-10 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{
                    background: "linear-gradient(135deg, #22c55e, #ccaa00)",
                    boxShadow: "0 4px 12px rgba(34, 197, 94, 0.3)",
                  }}
                >
                  <UsersIcon className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className={`flex-1 overflow-y-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-5 lg:py-6 mt-12 sm:mt-14 lg:mt-16 ${isMobile ? "pb-20" : ""}`}>
          <Outlet />
        </main>

        {/* Mobile Bottom Navigation (Opcional) */}
        {isMobile && (
          <div className="lg:hidden fixed bottom-0 left-0 right-0 backdrop-blur-xl border-t p-2 z-30" style={{
            background: "rgba(0, 0, 0, 0.9)",
            borderColor: "rgba(204, 170, 0, 0.2)",
            boxShadow: "0 -4px 20px rgba(0, 0, 0, 0.5)"
          }}>
            <div className="flex justify-around">
              <button
                onClick={() => setIsMobileSidebarOpen(true)}
                className="flex flex-col items-center p-2 rounded-lg transition-colors"
                style={{ color: "#ccaa00" }}
              >
                <Menu className="w-5 h-5" />
                <span className="text-xs mt-1">Menú</span>
              </button>
              <Link
                to="/dashboard"
                className="flex flex-col items-center p-2 rounded-lg transition-colors"
                style={{ color: location.pathname === "/dashboard" ? "#22c55e" : "#9ca3af" }}
              >
                <LayoutDashboard className="w-5 h-5" />
                <span className="text-xs mt-1">Inicio</span>
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Estilos para animaciones */}
      <style>{`
        @keyframes slide-in {
          from {
            transform: translateX(-100%);
          }
          to {
            transform: translateX(0);
          }
        }
        
        @keyframes fade-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        
        .animate-slide-in {
          animation: slide-in 0.3s ease-out;
        }
        
        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
        
        /* Scrollbar personalizado */
        ::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }
        
        ::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 10px;
        }
        
        ::-webkit-scrollbar-thumb {
          background: rgba(204, 170, 0, 0.5);
          border-radius: 10px;
        }
        
        ::-webkit-scrollbar-thumb:hover {
          background: rgba(204, 170, 0, 0.7);
        }
      `}</style>
    </div>
  );
}