import { Users, Bird, TrendingUp, Package } from 'lucide-react';
import { Link } from 'react-router';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export function Dashboard() {
  // Datos para gráficas
  const avesData = [
    { name: 'Pollo', cantidad: 450, valor: 11475 },
    { name: 'Gallina', cantidad: 380, valor: 13300 },
    { name: 'Pato', cantidad: 280, valor: 8960 },
    { name: 'Pavo', cantidad: 138, valor: 6900 },
  ];

  const tendenciaData = [
    { mes: 'Ago', cantidad: 850, valor: 28500 },
    { mes: 'Sep', cantidad: 920, valor: 31200 },
    { mes: 'Oct', cantidad: 1050, valor: 36800 },
    { mes: 'Nov', cantidad: 1180, valor: 39500 },
    { mes: 'Dic', cantidad: 1150, valor: 38900 },
    { mes: 'Ene', cantidad: 1248, valor: 40635 },
  ];

  const distribucionData = [
    { name: 'Pollo Macho', value: 250, color: '#22c55e' },
    { name: 'Pollo Hembra', value: 200, color: '#16a34a' },
    { name: 'Gallina Rojas', value: 200, color: '#ec4899' },
    { name: 'Gallina Doble P.', value: 180, color: '#db2777' },
    { name: 'Pato', value: 280, color: '#3b82f6' },
    { name: 'Pavo', value: 138, color: '#8b5cf6' },
  ];

  const proveedoresData = [
    { name: 'Dist. San Martín', aves: 520, valor: 18200 },
    { name: 'Avícola Norte', value: 380, valor: 13100 },
    { name: 'Granja El Sol', value: 220, valor: 7800 },
    { name: 'Otros', value: 128, valor: 1535 },
  ];

  const stats = [
    { 
      label: 'Total Proveedores', 
      value: '12', 
      icon: Users, 
      color: '#22c55e',
      link: '/dashboard/proveedores'
    },
    { 
      label: 'Total Aves', 
      value: '1,248', 
      icon: Bird, 
      color: '#ccaa00',
      link: '/dashboard/aves'
    },
    { 
      label: 'Tipos de Aves', 
      value: '4', 
      icon: Package, 
      color: '#3b82f6',
      link: '/dashboard/aves'
    },
    { 
      label: 'Crecimiento Mensual', 
      value: '+15%', 
      icon: TrendingUp, 
      color: '#8b5cf6',
      link: '/dashboard'
    },
  ];

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="backdrop-blur-xl rounded-lg p-3" style={{
          background: 'rgba(0, 0, 0, 0.8)',
          border: '1px solid rgba(204, 170, 0, 0.3)'
        }}>
          <p className="text-white font-bold mb-1">{label || payload[0].name}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }} className="text-sm">
              {entry.name}: {entry.value}
              {entry.name === 'valor' && ' S/'}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">Dashboard</h1>
        <p className="text-sm sm:text-base text-gray-400">Sistema de Gestión de Inventario - Avícola Jossy</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Link
              key={index}
              to={stat.link}
              className="backdrop-blur-xl rounded-xl p-4 sm:p-6 transition-all hover:scale-105 cursor-pointer"
              style={{
                background: 'rgba(0, 0, 0, 0.3)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)'
              }}
            >
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <div 
                  className="p-2 sm:p-3 rounded-lg"
                  style={{ 
                    background: `${stat.color}20`,
                    border: `1px solid ${stat.color}40`
                  }}
                >
                  <Icon className="w-5 h-5 sm:w-6 sm:h-6" style={{ color: stat.color }} />
                </div>
              </div>
              <div>
                <p className="text-gray-400 text-xs sm:text-sm mb-1">{stat.label}</p>
                <p className="text-2xl sm:text-3xl font-bold text-white">{stat.value}</p>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Gráficas principales */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Gráfico de Barras - Aves por Tipo */}
        <div className="backdrop-blur-xl rounded-xl p-4 sm:p-6" style={{
          background: 'rgba(0, 0, 0, 0.3)',
          border: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
          <h2 className="text-lg sm:text-xl font-bold text-white mb-4 sm:mb-6">Inventario por Tipo de Ave</h2>
          <div style={{ width: '100%', height: '250px', minHeight: '250px', minWidth: 0 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={avesData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
                <XAxis 
                  dataKey="name" 
                  stroke="#9ca3af"
                  style={{ fontSize: '11px' }}
                />
                <YAxis 
                  stroke="#9ca3af"
                  style={{ fontSize: '11px' }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend 
                  wrapperStyle={{ color: '#9ca3af', fontSize: '11px' }}
                />
                <Bar dataKey="cantidad" fill="#22c55e" name="Cantidad" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Gráfico de Líneas - Tendencia */}
        <div className="backdrop-blur-xl rounded-xl p-4 sm:p-6" style={{
          background: 'rgba(0, 0, 0, 0.3)',
          border: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
          <h2 className="text-lg sm:text-xl font-bold text-white mb-4 sm:mb-6">Tendencia de Inventario (6 meses)</h2>
          <div style={{ width: '100%', height: '250px', minHeight: '250px', minWidth: 0 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={tendenciaData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
                <XAxis 
                  dataKey="mes" 
                  stroke="#9ca3af"
                  style={{ fontSize: '11px' }}
                />
                <YAxis 
                  stroke="#9ca3af"
                  style={{ fontSize: '11px' }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend 
                  wrapperStyle={{ color: '#9ca3af', fontSize: '11px' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="cantidad" 
                  stroke="#ccaa00" 
                  strokeWidth={3}
                  dot={{ fill: '#ccaa00', r: 5 }}
                  name="Total Aves"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Segunda fila de gráficas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Gráfico Circular - Distribución */}
        <div className="backdrop-blur-xl rounded-xl p-4 sm:p-6" style={{
          background: 'rgba(0, 0, 0, 0.3)',
          border: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
          <h2 className="text-lg sm:text-xl font-bold text-white mb-4 sm:mb-6">Distribución del Inventario</h2>
          <div style={{ width: '100%', height: '220px', minHeight: '220px', minWidth: 0 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={distribucionData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={false}
                  innerRadius={40}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {distribucionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs sm:text-sm">
            {distribucionData.map((item, index) => (
              <div key={index} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: item.color }} />
                <span className="text-gray-300 truncate">{item.name}</span>
                <span className="font-bold text-white ml-auto">{item.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Métricas Financieras */}
        <div className="backdrop-blur-xl rounded-xl p-4 sm:p-6" style={{
          background: 'rgba(0, 0, 0, 0.3)',
          border: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
          <h2 className="text-lg sm:text-xl font-bold text-white mb-4 sm:mb-6">Métricas Financieras</h2>
          <div className="space-y-3 sm:space-y-4">
            <div className="p-3 sm:p-4 rounded-lg" style={{ background: 'rgba(34, 197, 94, 0.1)', border: '1px solid rgba(34, 197, 94, 0.3)' }}>
              <p className="text-gray-400 text-xs sm:text-sm mb-1">Valor Total del Inventario</p>
              <p className="text-2xl sm:text-3xl font-bold" style={{ color: '#22c55e' }}>S/ 40,635</p>
              <p className="text-xs sm:text-sm text-gray-400 mt-2">↑ 8.5% vs mes anterior</p>
            </div>
            
            <div className="p-3 sm:p-4 rounded-lg" style={{ background: 'rgba(204, 170, 0, 0.1)', border: '1px solid rgba(204, 170, 0, 0.3)' }}>
              <p className="text-gray-400 text-xs sm:text-sm mb-1">Precio Promedio por Ave</p>
              <p className="text-2xl sm:text-3xl font-bold" style={{ color: '#ccaa00' }}>S/ 32.56</p>
              <p className="text-xs sm:text-sm text-gray-400 mt-2">↑ 2.1% vs mes anterior</p>
            </div>

            <div className="p-3 sm:p-4 rounded-lg" style={{ background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.3)' }}>
              <p className="text-gray-400 text-xs sm:text-sm mb-1">Ingresos este mes</p>
              <p className="text-2xl sm:text-3xl font-bold" style={{ color: '#3b82f6' }}>S/ 12,480</p>
              <p className="text-xs sm:text-sm text-gray-400 mt-2">385 nuevas aves</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="backdrop-blur-xl rounded-xl p-4 sm:p-6" style={{
        background: 'rgba(0, 0, 0, 0.3)',
        border: '1px solid rgba(255, 255, 255, 0.1)'
      }}>
        <h2 className="text-lg sm:text-xl font-bold text-white mb-4 sm:mb-6">Acciones Rápidas</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
          <Link
            to="/dashboard/proveedores"
            className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-lg transition-all hover:scale-105"
            style={{
              background: 'linear-gradient(135deg, #22c55e20, #22c55e10)',
              border: '1px solid #22c55e40'
            }}
          >
            <Users className="w-6 h-6 sm:w-8 sm:h-8 flex-shrink-0" style={{ color: '#22c55e' }} />
            <div>
              <p className="font-bold text-white text-sm sm:text-base">Gestionar Proveedores</p>
              <p className="text-xs sm:text-sm text-gray-400">Añadir, editar o eliminar proveedores</p>
            </div>
          </Link>

          <Link
            to="/dashboard/aves"
            className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-lg transition-all hover:scale-105"
            style={{
              background: 'linear-gradient(135deg, #ccaa0020, #ccaa0010)',
              border: '1px solid #ccaa0040'
            }}
          >
            <Bird className="w-6 h-6 sm:w-8 sm:h-8 flex-shrink-0" style={{ color: '#ccaa00' }} />
            <div>
              <p className="font-bold text-white text-sm sm:text-base">Gestionar Aves</p>
              <p className="text-xs sm:text-sm text-gray-400">Registrar y actualizar inventario de aves</p>
            </div>
          </Link>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="backdrop-blur-xl rounded-xl p-4 sm:p-6" style={{
        background: 'rgba(0, 0, 0, 0.3)',
        border: '1px solid rgba(255, 255, 255, 0.1)'
      }}>
        <h2 className="text-lg sm:text-xl font-bold text-white mb-4 sm:mb-6">Actividad Reciente</h2>
        <div className="space-y-3 sm:space-y-4">
          {[
            { action: 'Nuevo proveedor registrado', detail: 'Distribuidora San Martín', time: 'Hace 2 horas' },
            { action: 'Ingreso de aves', detail: '150 Pollos machos', time: 'Hace 5 horas' },
            { action: 'Actualización de inventario', detail: 'Gallinas rojas', time: 'Ayer' },
          ].map((activity, index) => (
            <div 
              key={index}
              className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-3 sm:p-4 rounded-lg"
              style={{ background: 'rgba(255, 255, 255, 0.05)' }}
            >
              <div>
                <p className="font-medium text-white text-sm sm:text-base">{activity.action}</p>
                <p className="text-xs sm:text-sm text-gray-400">{activity.detail}</p>
              </div>
              <p className="text-xs sm:text-sm" style={{ color: '#ccaa00' }}>{activity.time}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}