import { useState, useEffect } from 'react';
import {
  ClipboardList,
  Scale,
  Truck,
  TrendingUp,
  CheckCircle,
  Clock,
  AlertTriangle,
  Package,
  Wrench,
  Activity,
  ShoppingCart,
} from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router';

export function DashboardOperador() {
  const { pedidosConfirmados } = useApp();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Estadísticas calculadas
  const hoy = new Date().toISOString().split('T')[0];
  const pedidosHoy = pedidosConfirmados.filter((p) => p.fecha === hoy);
  const pedidosPendientes = pedidosConfirmados.filter(
    (p) => p.estado === 'Pendiente' || !p.estado
  );
  const pedidosEnProduccion = pedidosConfirmados.filter(
    (p) => p.estado === 'En Producción'
  );
  const pedidosCompletados = pedidosConfirmados.filter(
    (p) => p.estado === 'Completado' || p.estado === 'Entregado'
  );

  const stats = [
    {
      label: 'Pedidos del Día',
      value: pedidosHoy.length,
      icon: ClipboardList,
      color: '#ccaa00',
      bg: 'rgba(204, 170, 0, 0.1)',
      border: 'rgba(204, 170, 0, 0.3)',
    },
    {
      label: 'Pendientes',
      value: pedidosPendientes.length,
      icon: Clock,
      color: '#f59e0b',
      bg: 'rgba(245, 158, 11, 0.1)',
      border: 'rgba(245, 158, 11, 0.3)',
    },
    {
      label: 'En Producción',
      value: pedidosEnProduccion.length,
      icon: Scale,
      color: '#3b82f6',
      bg: 'rgba(59, 130, 246, 0.1)',
      border: 'rgba(59, 130, 246, 0.3)',
    },
    {
      label: 'Completados',
      value: pedidosCompletados.length,
      icon: CheckCircle,
      color: '#22c55e',
      bg: 'rgba(34, 197, 94, 0.1)',
      border: 'rgba(34, 197, 94, 0.3)',
    },
  ];

  const quickActions = [
    {
      label: 'Nuevo Pedido',
      description: 'Crear un nuevo pedido',
      icon: ShoppingCart,
      path: '/dashboard-operador/nuevo-pedido',
      color: '#f59e0b',
    },
    {
      label: 'Ver Pedidos',
      description: 'Lista completa de pedidos',
      icon: ClipboardList,
      path: '/dashboard-operador/lista-pedidos',
      color: '#ccaa00',
    },
    {
      label: 'Pesaje',
      description: 'Pesaje de pedidos',
      icon: Scale,
      path: '/dashboard-operador/pesaje',
      color: '#3b82f6',
    },
    {
      label: 'Envíos',
      description: 'Gestión de envíos',
      icon: Truck,
      path: '/dashboard-operador/envios',
      color: '#22c55e',
    },
    {
      label: 'Control',
      description: 'Control operativo',
      icon: TrendingUp,
      path: '/dashboard-operador/control',
      color: '#a855f7',
    },
  ];

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header de bienvenida */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">
            ¡Bienvenido, {user?.nombre}!
          </h1>
          <p className="text-gray-400 mt-1 flex items-center gap-2">
            <Wrench className="w-4 h-4" style={{ color: '#22c55e' }} />
            Panel de Operador — Acceso directo sin verificación 2FA
          </p>
        </div>

        {/* Reloj digital */}
        <div
          className="text-right px-4 py-3 rounded-xl"
          style={{
            background: 'rgba(0, 0, 0, 0.4)',
            border: '1px solid rgba(204, 170, 0, 0.2)',
          }}
        >
          <p className="text-2xl sm:text-3xl font-mono font-bold" style={{ color: '#ccaa00' }}>
            {currentTime.toLocaleTimeString('es-PE', {
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
            })}
          </p>
          <p className="text-xs text-gray-400">
            {currentTime.toLocaleDateString('es-PE', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
          </p>
        </div>
      </div>

      {/* Cards de estadísticas */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className="rounded-xl p-4 sm:p-5 transition-all hover:scale-105"
              style={{
                background: stat.bg,
                border: `1px solid ${stat.border}`,
              }}
            >
              <div className="flex items-center justify-between mb-3">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center"
                  style={{
                    background: `${stat.color}20`,
                  }}
                >
                  <Icon className="w-5 h-5" style={{ color: stat.color }} />
                </div>
                <Activity className="w-4 h-4 text-gray-600" />
              </div>
              <p
                className="text-2xl sm:text-3xl font-bold"
                style={{ color: stat.color }}
              >
                {stat.value}
              </p>
              <p className="text-xs sm:text-sm text-gray-400 mt-1">
                {stat.label}
              </p>
            </div>
          );
        })}
      </div>

      {/* Acciones rápidas */}
      <div>
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Package className="w-5 h-5" style={{ color: '#ccaa00' }} />
          Acciones Rápidas
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <button
                key={action.label}
                onClick={() => navigate(action.path)}
                className="text-left rounded-xl p-5 transition-all hover:scale-105 group cursor-pointer"
                style={{
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                }}
              >
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-all group-hover:scale-110"
                  style={{
                    background: `${action.color}15`,
                    border: `1px solid ${action.color}30`,
                  }}
                >
                  <Icon
                    className="w-6 h-6"
                    style={{ color: action.color }}
                  />
                </div>
                <h3 className="text-white font-medium mb-1">
                  {action.label}
                </h3>
                <p className="text-xs text-gray-500">{action.description}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Actividad reciente */}
      <div>
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Activity className="w-5 h-5" style={{ color: '#ccaa00' }} />
          Pedidos Recientes
        </h2>
        <div
          className="rounded-xl overflow-hidden"
          style={{
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
          }}
        >
          {pedidosConfirmados.length === 0 ? (
            <div className="p-8 text-center">
              <AlertTriangle
                className="w-12 h-12 mx-auto mb-3"
                style={{ color: '#ccaa0060' }}
              />
              <p className="text-gray-400">No hay pedidos registrados</p>
            </div>
          ) : (
            <div className="divide-y" style={{ borderColor: 'rgba(255, 255, 255, 0.05)' }}>
              {pedidosConfirmados.slice(-5).reverse().map((pedido) => (
                <div
                  key={pedido.id}
                  className="flex items-center justify-between px-4 sm:px-6 py-3 hover:bg-white/5 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{
                        background:
                          pedido.estado === 'Completado' || pedido.estado === 'Entregado'
                            ? '#22c55e'
                            : pedido.estado === 'En Producción'
                              ? '#3b82f6'
                              : '#f59e0b',
                      }}
                    />
                    <div>
                      <p className="text-sm text-white font-medium">
                        {pedido.cliente}
                      </p>
                      <p className="text-xs text-gray-500">
                        {pedido.tipoAve} — {pedido.cantidad} unids. — {pedido.fecha}
                      </p>
                    </div>
                  </div>
                  <span
                    className="text-xs px-2.5 py-1 rounded-full font-medium"
                    style={{
                      background:
                        pedido.estado === 'Completado' || pedido.estado === 'Entregado'
                          ? 'rgba(34, 197, 94, 0.15)'
                          : pedido.estado === 'En Producción'
                            ? 'rgba(59, 130, 246, 0.15)'
                            : 'rgba(245, 158, 11, 0.15)',
                      color:
                        pedido.estado === 'Completado' || pedido.estado === 'Entregado'
                          ? '#22c55e'
                          : pedido.estado === 'En Producción'
                            ? '#3b82f6'
                            : '#f59e0b',
                    }}
                  >
                    {pedido.estado || 'Pendiente'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
