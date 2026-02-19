import { createBrowserRouter, Navigate } from "react-router";
import { Layout } from "./components/Layout";
import { LayoutSecretaria } from "./components/LayoutSecretaria";
import { Dashboard } from "./components/Dashboard";
import { Proveedores } from "./components/Proveedores";
import { Aves } from "./components/Aves";
import { InventarioCompleto } from "./components/InventarioCompleto";
import { Pedidos } from "./components/Pedidos";
import { NuevoPedido } from "./components/NuevoPedido";
import { ListaPedidos } from "./components/ListaPedidos";
import { Clientes } from "./components/Clientes";
import { Login } from "./components/Login";
import { Configuracion } from "./components/Configuracion";
import { ComingSoon } from "./components/ComingSoon";
import { Envios } from "./components/Envios";
import { Control } from "./components/Control";
import { Finanzas } from "./components/Finanzas";
import { Empleados } from "./components/Empleados";
import { Asistencia } from "./components/Asistencia";
import { Informes } from "./components/Informes";
import { Auditoria } from "./components/Auditoria";
import { DashboardSecretaria } from "./components/DashboardSecretaria";
import { GestionContenedores } from "./components/GestionContenedores";
import { PantallaProduccion } from "./components/PantallaProduccion";
import { Egg, Package, ShoppingCart, Users, Truck, TrendingUp, DollarSign, FileText } from "lucide-react";
import { PesajeOperador } from "./components/PesajeOperador";
import { PesajeDisplay } from "./components/PesajeDisplay";
import { LayoutOperador } from "./components/LayoutOperador";
import { LayoutConductor } from "./components/LayoutConductor";
import { GestionConductor } from "./components/GestionConductor";
import { LayoutCobranza } from "./components/LayoutCobranza";
import { GestionCobranza } from "./components/GestionCobranza";
import { History as HistoryIcon } from "lucide-react";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Login,
  },
  {
    path: "/pantalla-produccion",
    Component: PantallaProduccion,
  },
  {
    path: "/pesaje-display",
    Component: PesajeDisplay,
  },
  {
    path: "/dashboard",
    Component: Layout,
    children: [
      { index: true, Component: Dashboard },
      
      // Inventario
      { path: "proveedores", Component: Proveedores },
      { path: "aves", Component: Aves },
      { path: "inventario-completo", Component: InventarioCompleto },
      
      // Producción
      { 
        path: "produccion/huevos", 
        element: <ComingSoon title="Recolección de Huevos" description="Módulo de recolección y registro de huevos" icon={Egg} />
      },
      { 
        path: "produccion/alimento", 
        element: <ComingSoon title="Control de Alimento" description="Gestión y control de alimentación" icon={Package} />
      },
      
      // Ventas
      { 
        path: "ventas/pedidos", 
        Component: Pedidos
      },
      { 
        path: "ventas/clientes", 
        Component: Clientes
      },
      
      // Distribución
      { 
        path: "distribucion/envios", 
        Component: Envios
      },
      { 
        path: "distribucion/control", 
        Component: Control
      },
      
      // Finanzas
      { 
        path: "finanzas/ingresos", 
        Component: Finanzas
      },
      { 
        path: "finanzas/gastos", 
        element: <ComingSoon title="Gastos" description="Registro y control de gastos" icon={DollarSign} />
      },
      
      // Recursos Humanos
      { 
        path: "rrhh/empleados", 
        Component: Empleados
      },
      { 
        path: "rrhh/asistencia", 
        Component: Asistencia
      },
      
      // Reportes
      { 
        path: "reportes/informes", 
        Component: Informes
      },
      
      // Auditoría
      { 
        path: "auditoria", 
        Component: Auditoria
      },
      
      // Configuración
      { path: "configuracion", Component: Configuracion },
    ],
  },
  {
    path: "/dashboard-secretaria",
    Component: LayoutSecretaria,
    children: [
      { index: true, Component: DashboardSecretaria },
      
      // Nuevo Pedido
      { 
        path: "nuevo-pedido", 
        Component: NuevoPedido 
      },
      
      // Lista de Pedidos
      { 
        path: "lista-pedidos", 
        Component: ListaPedidos 
      },
      
      // Inventario Completo (Proveedores + Aves)
      { 
        path: "inventario", 
        Component: InventarioCompleto 
      },
      
      // Redirección desde la ruta eliminada de pedidos a contenedores
      { 
        path: "pedidos", 
        element: <Navigate to="/dashboard-secretaria/contenedores" replace /> 
      },
      
      // Gestión de Contenedores
      { 
        path: "contenedores", 
        Component: GestionContenedores 
      },
      
      // Consulta de Clientes (solo lectura)
      { 
        path: "clientes", 
        Component: Clientes 
      },
      
      // Distribución - Envíos
      { 
        path: "envios", 
        Component: Envios 
      },
      
      // Distribución - Control
      { 
        path: "control", 
        Component: Control 
      },
    ],
  },
  {
    path: "/dashboard-operador",
    Component: LayoutOperador,
    children: [
      
      // Nuevo Pedido
      { 
        path: "nuevo-pedido", 
        Component: NuevoPedido 
      },
      
      // Lista de Pedidos
      { 
        path: "lista-pedidos", 
        Component: ListaPedidos 
      },
      
      // Pesaje
      { 
        path: "pesaje", 
        Component: PesajeOperador 
      },
      
      // Envíos
      { 
        path: "envios", 
        Component: Envios 
      },
    ],
  },
  {
    path: "/dashboard-conductor",
    Component: LayoutConductor,
    children: [
      {
        index: true,
        element: <Navigate to="/dashboard-conductor/entregas" replace />
      },
      {
        path: "entregas",
        Component: GestionConductor
      },
      {
        path: "repesadas",
        Component: GestionConductor
      },
      {
        path: "devoluciones",
        Component: GestionConductor
      },
      {
        path: "historial",
        element: <ComingSoon title="Historial de Entregas" description="Próximamente: Consulta tus entregas pasadas" icon={HistoryIcon} />
      }
    ]
  },
  {
    path: "/dashboard-cobranza",
    Component: LayoutCobranza,
    children: [
      {
        index: true,
        element: <Navigate to="/dashboard-cobranza/gestion" replace />
      },
      {
        path: "gestion",
        Component: GestionCobranza
      },
      {
        path: "historial",
        element: <ComingSoon title="Historial de Pagos" description="Próximamente: Historial detallado de transacciones" icon={HistoryIcon} />
      }
    ]
  },
]);