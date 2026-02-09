import { useState } from 'react';
import { Plus, Edit2, Trash2, Search, Filter, Package, User, Calendar, CheckCircle, Clock, Settings, Scale, TrendingUp, PieChart as PieChartIcon } from 'lucide-react';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { ModalContenedores } from './ModalContenedores';

interface TipoAve {
  id: string;
  nombre: string;
}

interface Presentacion {
  id: string;
  tipoAve: string;
  nombre: string;
  mermaKg: number;
  esVariable: boolean;
}

interface Contenedor {
  id: string;
  tipo: string;
  pesoKg: number;
}

interface Pedido {
  id: string;
  cliente: string;
  tipoAve: string;
  cantidad: number;
  presentacion: string;
  mermaUnitaria: number;
  mermaTotal: number;
  contenedor: string;
  pesoContenedor: number;
  pesoTotalPedido: number;
  empleado: string;
  fecha: string;
  hora: string;
  estado: 'Pendiente' | 'En Producción' | 'Completado';
  autoConfirmado: boolean;
}

// Datos de ejemplo
const clientesEjemplo = [
  'Restaurante El Sabor',
  'Pollería Don José',
  'Mercado Central',
  'Distribuidora La Familia',
  'Restaurant Los Andes'
];

const empleadosEjemplo = [
  'Juan Pérez',
  'María García',
  'Carlos López',
  'Ana Martínez'
];

export function GestionContenedores() {
  // Estados para contenedores
  const [contenedores, setContenedores] = useState<Contenedor[]>([
    { id: '1', tipo: 'Javas Nuevas', pesoKg: 2.5 },
    { id: '2', tipo: 'Javas Viejas', pesoKg: 2.0 },
    { id: '3', tipo: 'Tinas Verdes', pesoKg: 3.5 },
    { id: '4', tipo: 'Bolsas', pesoKg: 0.05 }
  ]);
  const [isContenedoresModalOpen, setIsContenedoresModalOpen] = useState(false);

  // Tipos de ave y presentaciones
  const [tiposAve] = useState<TipoAve[]>([
    { id: '1', nombre: 'Pollo' },
    { id: '2', nombre: 'Gallina' },
    { id: '3', nombre: 'Pato' },
    { id: '4', nombre: 'Pavo' }
  ]);

  const [presentaciones] = useState<Presentacion[]>([
    { id: '1', tipoAve: 'Pollo', nombre: 'Vivo', mermaKg: 0, esVariable: true },
    { id: '2', tipoAve: 'Pollo', nombre: 'Pelado', mermaKg: 0.15, esVariable: false },
    { id: '3', tipoAve: 'Pollo', nombre: 'Destripado', mermaKg: 0.20, esVariable: false },
    { id: '4', tipoAve: 'Gallina', nombre: 'Vivo', mermaKg: 0, esVariable: true },
    { id: '5', tipoAve: 'Gallina', nombre: 'Pelado', mermaKg: 0.15, esVariable: false },
    { id: '6', tipoAve: 'Gallina', nombre: 'Destripado', mermaKg: 0.20, esVariable: false },
    { id: '7', tipoAve: 'Pato', nombre: 'Vivo', mermaKg: 0, esVariable: true },
    { id: '8', tipoAve: 'Pato', nombre: 'Pelado', mermaKg: 0.15, esVariable: false },
    { id: '9', tipoAve: 'Pato', nombre: 'Destripado', mermaKg: 0.20, esVariable: false },
    { id: '10', tipoAve: 'Pavo', nombre: 'Vivo', mermaKg: 0, esVariable: true },
    { id: '11', tipoAve: 'Pavo', nombre: 'Pelado', mermaKg: 0.15, esVariable: false },
    { id: '12', tipoAve: 'Pavo', nombre: 'Destripado', mermaKg: 0.20, esVariable: false }
  ]);

  // Inventario simulado
  const [inventarioAves] = useState([
    { tipoAve: 'Pollo', cantidad: 150 },
    { tipoAve: 'Gallina', cantidad: 80 },
    { tipoAve: 'Pato', cantidad: 50 },
    { tipoAve: 'Pavo', cantidad: 30 }
  ]);

  const [pedidos, setPedidos] = useState<Pedido[]>([
    {
      id: '1',
      cliente: 'Restaurante El Sabor',
      tipoAve: 'Gallina',
      cantidad: 50,
      presentacion: 'Destripado',
      mermaUnitaria: 0.20,
      mermaTotal: 10.0,
      contenedor: 'Javas Nuevas',
      pesoContenedor: 2.5,
      pesoTotalPedido: 92.5,
      empleado: 'Juan Pérez',
      fecha: '2025-02-01',
      hora: '08:30',
      estado: 'Pendiente',
      autoConfirmado: true
    },
    {
      id: '2',
      cliente: 'Pollería Don José',
      tipoAve: 'Pollo',
      cantidad: 100,
      presentacion: 'Pelado',
      mermaUnitaria: 0.15,
      mermaTotal: 15.0,
      contenedor: 'Tinas Verdes',
      pesoContenedor: 3.5,
      pesoTotalPedido: 183.5,
      empleado: 'María García',
      fecha: '2025-02-01',
      hora: '09:15',
      estado: 'En Producción',
      autoConfirmado: true
    }
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterEstado, setFilterEstado] = useState<string>('all');
  const [filterCliente, setFilterCliente] = useState<string>('all');

  const filteredPedidos = pedidos.filter(pedido => {
    const matchesSearch = 
      pedido.cliente.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pedido.tipoAve.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pedido.empleado.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesEstado = filterEstado === 'all' || pedido.estado === filterEstado;
    const matchesCliente = filterCliente === 'all' || pedido.cliente === filterCliente;
    return matchesSearch && matchesEstado && matchesCliente;
  });

  const handleCambiarEstado = (id: string, nuevoEstado: 'Pendiente' | 'En Producción' | 'Completado') => {
    setPedidos(pedidos.map(p => p.id === id ? { ...p, estado: nuevoEstado } : p));
  };

  const handleEliminarPedido = (id: string) => {
    if (confirm('¿Está seguro de eliminar este pedido?')) {
      setPedidos(pedidos.filter(p => p.id !== id));
    }
  };

  // Calcular estadísticas
  const totalPedidos = filteredPedidos.length;
  const pedidosPendientes = filteredPedidos.filter(p => p.estado === 'Pendiente').length;
  const pedidosProduccion = filteredPedidos.filter(p => p.estado === 'En Producción').length;
  const pedidosCompletados = filteredPedidos.filter(p => p.estado === 'Completado').length;

  // Datos para gráficos
  const pedidosPorTipoAve = tiposAve.map(tipo => ({
    nombre: tipo.nombre,
    cantidad: pedidos.filter(p => p.tipoAve === tipo.nombre).reduce((acc, p) => acc + p.cantidad, 0)
  }));

  const pedidosPorEstado = [
    { name: 'Pendiente', value: pedidosPendientes, color: '#fb923c' },
    { name: 'En Producción', value: pedidosProduccion, color: '#3b82f6' },
    { name: 'Completado', value: pedidosCompletados, color: '#22c55e' }
  ];

  const pedidosPorCliente = clientesEjemplo.map(cliente => ({
    cliente,
    pedidos: pedidos.filter(p => p.cliente === cliente).length
  })).filter(c => c.pedidos > 0);

  const mermaTotal = pedidos.reduce((acc, p) => acc + p.mermaTotal, 0);
  const pesoTotalGeneral = pedidos.reduce((acc, p) => acc + p.pesoTotalPedido, 0);
  const cantidadTotalAves = pedidos.reduce((acc, p) => acc + p.cantidad, 0);

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'Pendiente':
        return { bg: 'rgba(251, 146, 60, 0.2)', color: '#fb923c', border: 'rgba(251, 146, 60, 0.3)' };
      case 'En Producción':
        return { bg: 'rgba(59, 130, 246, 0.2)', color: '#3b82f6', border: 'rgba(59, 130, 246, 0.3)' };
      case 'Completado':
        return { bg: 'rgba(34, 197, 94, 0.2)', color: '#22c55e', border: 'rgba(34, 197, 94, 0.3)' };
      default:
        return { bg: 'rgba(255, 255, 255, 0.1)', color: '#ffffff', border: 'rgba(255, 255, 255, 0.2)' };
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6 p-2 sm:p-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 mb-4 sm:mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-white mb-1 sm:mb-2">Gestión de Contenedores</h1>
          <p className="text-xs sm:text-sm text-gray-400">Visualiza todos los pedidos realizados por operaciones</p>
        </div>
        <button
          onClick={() => setIsContenedoresModalOpen(true)}
          className="px-3 sm:px-4 md:px-6 py-2 sm:py-2.5 md:py-3 rounded-lg font-bold transition-all hover:scale-105 flex items-center gap-1 sm:gap-2 text-sm sm:text-base"
          style={{
            background: 'linear-gradient(to right, #0d4a24, #166534, #b8941e, #ccaa00)',
            color: 'white',
            boxShadow: '0 4px 15px rgba(204, 170, 0, 0.4)'
          }}
        >
          <Settings className="w-4 h-4 sm:w-5 sm:h-5" />
          <span className="hidden sm:inline">Gestionar Contenedores</span>
          <span className="sm:hidden">Contenedores</span>
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3 md:gap-4">
        <div className="backdrop-blur-xl rounded-xl p-3 sm:p-4 md:p-6" style={{
          background: 'rgba(0, 0, 0, 0.3)',
          border: '1px solid rgba(255, 255, 255, 0.2)'
        }}>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs sm:text-sm text-gray-400">Total Pedidos</p>
            <Package className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
          </div>
          <p className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-white">{totalPedidos}</p>
        </div>

        <div className="backdrop-blur-xl rounded-xl p-3 sm:p-4 md:p-6" style={{
          background: 'rgba(0, 0, 0, 0.3)',
          border: '1px solid rgba(251, 146, 60, 0.3)'
        }}>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs sm:text-sm text-gray-400">Pendientes</p>
            <Clock className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: '#fb923c' }} />
          </div>
          <p className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold" style={{ color: '#fb923c' }}>{pedidosPendientes}</p>
        </div>

        <div className="backdrop-blur-xl rounded-xl p-3 sm:p-4 md:p-6" style={{
          background: 'rgba(0, 0, 0, 0.3)',
          border: '1px solid rgba(59, 130, 246, 0.3)'
        }}>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs sm:text-sm text-gray-400">En Producción</p>
            <Scale className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: '#3b82f6' }} />
          </div>
          <p className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold" style={{ color: '#3b82f6' }}>{pedidosProduccion}</p>
        </div>

        <div className="backdrop-blur-xl rounded-xl p-3 sm:p-4 md:p-6" style={{
          background: 'rgba(0, 0, 0, 0.3)',
          border: '1px solid rgba(34, 197, 94, 0.3)'
        }}>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs sm:text-sm text-gray-400">Completados</p>
            <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: '#22c55e' }} />
          </div>
          <p className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold" style={{ color: '#22c55e' }}>{pedidosCompletados}</p>
        </div>
      </div>

      {/* Filtros */}
      <div className="backdrop-blur-xl rounded-xl p-3 sm:p-4" style={{
        background: 'rgba(0, 0, 0, 0.3)',
        border: '1px solid rgba(255, 255, 255, 0.1)'
      }}>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar cliente, ave o empleado..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 sm:pl-12 pr-3 py-2.5 sm:py-3 rounded-lg text-sm sm:text-base text-white placeholder-gray-400"
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)'
              }}
            />
          </div>

          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
            <select
              value={filterEstado}
              onChange={(e) => setFilterEstado(e.target.value)}
              className="w-full pl-10 sm:pl-12 pr-8 py-2.5 sm:py-3 rounded-lg text-sm sm:text-base text-white appearance-none cursor-pointer"
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)'
              }}
            >
              <option value="all" style={{ background: '#1a1a1a', color: 'white' }}>Todos los estados</option>
              <option value="Pendiente" style={{ background: '#1a1a1a', color: 'white' }}>Pendiente</option>
              <option value="En Producción" style={{ background: '#1a1a1a', color: 'white' }}>En Producción</option>
              <option value="Completado" style={{ background: '#1a1a1a', color: 'white' }}>Completado</option>
            </select>
          </div>

          <div className="relative">
            <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
            <select
              value={filterCliente}
              onChange={(e) => setFilterCliente(e.target.value)}
              className="w-full pl-10 sm:pl-12 pr-8 py-2.5 sm:py-3 rounded-lg text-sm sm:text-base text-white appearance-none cursor-pointer"
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)'
              }}
            >
              <option value="all" style={{ background: '#1a1a1a', color: 'white' }}>Todos los clientes</option>
              {clientesEjemplo.map(cliente => (
                <option key={cliente} value={cliente} style={{ background: '#1a1a1a', color: 'white' }}>
                  {cliente}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Métricas Adicionales */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
        <div className="backdrop-blur-xl rounded-xl p-3 sm:p-4 md:p-6" style={{
          background: 'linear-gradient(135deg, rgba(204, 170, 0, 0.2), rgba(0, 0, 0, 0.3))',
          border: '1px solid rgba(204, 170, 0, 0.3)'
        }}>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs sm:text-sm text-gray-300 font-medium">Total de Aves Pedidas</p>
            <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: '#ccaa00' }} />
          </div>
          <p className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold" style={{ color: '#ccaa00' }}>{cantidadTotalAves}</p>
          <p className="text-xs text-gray-400 mt-1">unidades</p>
        </div>

        <div className="backdrop-blur-xl rounded-xl p-3 sm:p-4 md:p-6" style={{
          background: 'linear-gradient(135deg, rgba(251, 146, 60, 0.2), rgba(0, 0, 0, 0.3))',
          border: '1px solid rgba(251, 146, 60, 0.3)'
        }}>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs sm:text-sm text-gray-300 font-medium">Merma Total</p>
            <Scale className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: '#fb923c' }} />
          </div>
          <p className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold" style={{ color: '#fb923c' }}>{mermaTotal.toFixed(2)}</p>
          <p className="text-xs text-gray-400 mt-1">kilogramos</p>
        </div>

        <div className="backdrop-blur-xl rounded-xl p-3 sm:p-4 md:p-6" style={{
          background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.2), rgba(0, 0, 0, 0.3))',
          border: '1px solid rgba(34, 197, 94, 0.3)'
        }}>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs sm:text-sm text-gray-300 font-medium">Peso Total Pedidos</p>
            <Package className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: '#22c55e' }} />
          </div>
          <p className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold" style={{ color: '#22c55e' }}>{pesoTotalGeneral.toFixed(2)}</p>
          <p className="text-xs text-gray-400 mt-1">kilogramos</p>
        </div>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Gráfico de Pedidos por Tipo de Ave */}
        <div className="backdrop-blur-xl rounded-xl p-3 sm:p-4 md:p-6" style={{
          background: 'rgba(0, 0, 0, 0.3)',
          border: '1px solid rgba(204, 170, 0, 0.3)'
        }}>
          <div className="flex items-center gap-2 mb-3 sm:mb-4">
            <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: '#ccaa00' }} />
            <h3 className="text-sm sm:text-base md:text-lg font-bold text-white">Pedidos por Tipo de Ave</h3>
          </div>
          <div style={{ width: '100%', height: '240px', minHeight: '240px', minWidth: 0 }}>
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={240}>
              <BarChart data={pedidosPorTipoAve}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis 
                  dataKey="nombre" 
                  stroke="#888" 
                  tick={{ fontSize: 12 }}
                />
                <YAxis 
                  stroke="#888" 
                  tick={{ fontSize: 12 }}
                />
                <Tooltip 
                  contentStyle={{ 
                    background: 'rgba(0, 0, 0, 0.9)', 
                    border: '1px solid rgba(204, 170, 0, 0.5)',
                    borderRadius: '8px',
                    fontSize: '12px'
                  }}
                  labelStyle={{ color: '#fff', fontSize: '12px' }}
                />
                <Bar dataKey="cantidad" fill="#ccaa00" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Gráfico de Pedidos por Estado */}
        <div className="backdrop-blur-xl rounded-xl p-3 sm:p-4 md:p-6" style={{
          background: 'rgba(0, 0, 0, 0.3)',
          border: '1px solid rgba(204, 170, 0, 0.3)'
        }}>
          <div className="flex items-center gap-2 mb-3 sm:mb-4">
            <PieChartIcon className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: '#ccaa00' }} />
            <h3 className="text-sm sm:text-base md:text-lg font-bold text-white">Distribución por Estado</h3>
          </div>
          <div style={{ width: '100%', height: '240px', minHeight: '240px', minWidth: 0 }}>
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={240}>
              <PieChart>
                <Pie
                  data={pedidosPorEstado}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={60}
                  innerRadius={30}
                  fill="#8884d8"
                  dataKey="value"
                  strokeWidth={2}
                >
                  {pedidosPorEstado.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    background: 'rgba(0, 0, 0, 0.9)', 
                    border: '1px solid rgba(204, 170, 0, 0.5)',
                    borderRadius: '8px',
                    fontSize: '12px'
                  }}
                />
                <Legend 
                  wrapperStyle={{ fontSize: '12px' }}
                  layout="horizontal"
                  verticalAlign="bottom"
                  align="center"
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Gráfico de Pedidos por Cliente */}
        {pedidosPorCliente.length > 0 && (
          <div className="backdrop-blur-xl rounded-xl p-3 sm:p-4 md:p-6 lg:col-span-2" style={{
            background: 'rgba(0, 0, 0, 0.3)',
            border: '1px solid rgba(204, 170, 0, 0.3)'
          }}>
            <div className="flex items-center gap-2 mb-3 sm:mb-4">
              <User className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: '#ccaa00' }} />
              <h3 className="text-sm sm:text-base md:text-lg font-bold text-white">Pedidos por Cliente</h3>
            </div>
            <div style={{ width: '100%', height: '288px', minHeight: '288px', minWidth: 0 }}>
              <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={288}>
                <BarChart data={pedidosPorCliente} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis type="number" stroke="#888" tick={{ fontSize: 12 }} />
                  <YAxis 
                    dataKey="cliente" 
                    type="category" 
                    stroke="#888" 
                    width={80}
                    tick={{ fontSize: 10 }}
                    tickFormatter={(value) => value.length > 15 ? `${value.substring(0, 15)}...` : value}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      background: 'rgba(0, 0, 0, 0.9)', 
                      border: '1px solid rgba(204, 170, 0, 0.5)',
                      borderRadius: '8px',
                      fontSize: '12px'
                    }}
                    labelStyle={{ color: '#fff', fontSize: '12px' }}
                  />
                  <Bar dataKey="pedidos" fill="#22c55e" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>

      {/* Tabla de Pedidos - Desktop */}
      <div className="hidden md:block backdrop-blur-xl rounded-xl overflow-hidden" style={{
        background: 'rgba(0, 0, 0, 0.3)',
        border: '1px solid rgba(255, 255, 255, 0.1)'
      }}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr style={{ background: 'rgba(0, 0, 0, 0.4)', borderBottom: '1px solid rgba(204, 170, 0, 0.3)' }}>
                <th className="px-4 lg:px-6 py-3 text-left font-bold text-xs sm:text-sm" style={{ color: '#ccaa00' }}>Cliente</th>
                <th className="px-4 lg:px-6 py-3 text-left font-bold text-xs sm:text-sm" style={{ color: '#ccaa00' }}>Producto</th>
                <th className="px-4 lg:px-6 py-3 text-left font-bold text-xs sm:text-sm" style={{ color: '#ccaa00' }}>Cantidad</th>
                <th className="px-4 lg:px-6 py-3 text-left font-bold text-xs sm:text-sm" style={{ color: '#ccaa00' }}>Presentación</th>
                <th className="px-4 lg:px-6 py-3 text-left font-bold text-xs sm:text-sm" style={{ color: '#ccaa00' }}>Merma</th>
                <th className="px-4 lg:px-6 py-3 text-left font-bold text-xs sm:text-sm" style={{ color: '#ccaa00' }}>Contenedor</th>
                <th className="px-4 lg:px-6 py-3 text-left font-bold text-xs sm:text-sm" style={{ color: '#ccaa00' }}>Peso Total</th>
                <th className="px-4 lg:px-6 py-3 text-left font-bold text-xs sm:text-sm" style={{ color: '#ccaa00' }}>Empleado</th>
                <th className="px-4 lg:px-6 py-3 text-left font-bold text-xs sm:text-sm" style={{ color: '#ccaa00' }}>Estado</th>
                <th className="px-4 lg:px-6 py-3 text-center font-bold text-xs sm:text-sm" style={{ color: '#ccaa00' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredPedidos.map((pedido) => {
                const estadoStyle = getEstadoColor(pedido.estado);
                return (
                  <tr 
                    key={pedido.id}
                    className="border-b transition-colors hover:bg-white/5"
                    style={{ borderColor: 'rgba(255, 255, 255, 0.05)' }}
                  >
                    <td className="px-4 lg:px-6 py-3">
                      <div>
                        <p className="text-white font-medium text-sm truncate">{pedido.cliente}</p>
                        {pedido.autoConfirmado && (
                          <span className="text-xs px-2 py-0.5 rounded-full" style={{
                            background: 'rgba(34, 197, 94, 0.2)',
                            color: '#22c55e',
                            border: '1px solid rgba(34, 197, 94, 0.3)'
                          }}>
                            ✓ Stock
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 lg:px-6 py-3">
                      <span className="text-white font-medium text-sm">{pedido.tipoAve}</span>
                    </td>
                    <td className="px-4 lg:px-6 py-3">
                      <span className="text-white font-bold text-sm">{pedido.cantidad}</span>
                      <span className="text-gray-400 text-xs ml-1">aves</span>
                    </td>
                    <td className="px-4 lg:px-6 py-3">
                      <span className="text-white text-sm truncate">{pedido.presentacion}</span>
                    </td>
                    <td className="px-4 lg:px-6 py-3">
                      <div className="text-xs sm:text-sm">
                        <p className="text-gray-300">{pedido.mermaUnitaria} kg/ave</p>
                        <p className="font-bold" style={{ color: '#fb923c' }}>
                          {pedido.mermaTotal.toFixed(2)} kg
                        </p>
                      </div>
                    </td>
                    <td className="px-4 lg:px-6 py-3">
                      <div className="text-xs sm:text-sm">
                        <p className="text-white truncate">{pedido.contenedor}</p>
                        <p className="text-gray-400">{pedido.pesoContenedor} kg</p>
                      </div>
                    </td>
                    <td className="px-4 lg:px-6 py-3">
                      <p className="text-sm sm:text-base font-bold" style={{ color: '#22c55e' }}>
                        {pedido.pesoTotalPedido.toFixed(2)} kg
                      </p>
                    </td>
                    <td className="px-4 lg:px-6 py-3">
                      <div className="text-xs sm:text-sm">
                        <p className="text-white truncate">{pedido.empleado}</p>
                        <p className="text-gray-400">{pedido.fecha} {pedido.hora}</p>
                      </div>
                    </td>
                    <td className="px-4 lg:px-6 py-3">
                      <select
                        value={pedido.estado}
                        onChange={(e) => handleCambiarEstado(pedido.id, e.target.value as any)}
                        className="px-2 py-1 rounded-full text-xs sm:text-sm font-medium cursor-pointer min-w-[120px]"
                        style={{
                          background: estadoStyle.bg,
                          color: estadoStyle.color,
                          border: `1px solid ${estadoStyle.border}`
                        }}
                      >
                        <option value="Pendiente" style={{ background: '#1a1a1a', color: 'white' }}>Pendiente</option>
                        <option value="En Producción" style={{ background: '#1a1a1a', color: 'white' }}>En Producción</option>
                        <option value="Completado" style={{ background: '#1a1a1a', color: 'white' }}>Completado</option>
                      </select>
                    </td>
                    <td className="px-4 lg:px-6 py-3">
                      <div className="flex items-center justify-center gap-1 sm:gap-2">
                        <button
                          onClick={() => handleEliminarPedido(pedido.id)}
                          className="p-1.5 sm:p-2 rounded-lg transition-all hover:scale-110"
                          style={{
                            background: 'rgba(239, 68, 68, 0.2)',
                            border: '1px solid rgba(239, 68, 68, 0.3)'
                          }}
                        >
                          <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" style={{ color: '#ef4444' }} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredPedidos.length === 0 && (
          <div className="text-center py-8 sm:py-12">
            <Package className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 text-gray-600" />
            <p className="text-gray-400 text-sm sm:text-base">No se encontraron pedidos</p>
          </div>
        )}
      </div>

      {/* Cards de Pedidos - Mobile */}
      <div className="md:hidden space-y-3">
        {filteredPedidos.map((pedido) => {
          const estadoStyle = getEstadoColor(pedido.estado);
          return (
            <div 
              key={pedido.id}
              className="backdrop-blur-xl rounded-xl p-4"
              style={{
                background: 'rgba(0, 0, 0, 0.3)',
                border: '1px solid rgba(255, 255, 255, 0.1)'
              }}
            >
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                  <p className="text-white font-bold text-sm truncate">{pedido.cliente}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="px-2 py-1 rounded-full text-xs font-bold" style={{
                      background: estadoStyle.bg,
                      color: estadoStyle.color,
                      border: `1px solid ${estadoStyle.border}`
                    }}>
                      {pedido.estado}
                    </span>
                    {pedido.autoConfirmado && (
                      <span className="text-xs px-2 py-1 rounded-full" style={{
                        background: 'rgba(34, 197, 94, 0.2)',
                        color: '#22c55e',
                        border: '1px solid rgba(34, 197, 94, 0.3)'
                      }}>
                        ✓ Stock
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => handleEliminarPedido(pedido.id)}
                  className="p-2 rounded-lg transition-all hover:scale-110 flex-shrink-0"
                  style={{
                    background: 'rgba(239, 68, 68, 0.2)',
                    border: '1px solid rgba(239, 68, 68, 0.3)'
                  }}
                >
                  <Trash2 className="w-4 h-4" style={{ color: '#ef4444' }} />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs mb-3">
                <div>
                  <p className="text-gray-400 mb-1">Producto</p>
                  <p className="text-white font-medium">{pedido.tipoAve} - {pedido.presentacion}</p>
                </div>
                <div>
                  <p className="text-gray-400 mb-1">Cantidad</p>
                  <p className="text-white font-bold">{pedido.cantidad} aves</p>
                </div>
                <div>
                  <p className="text-gray-400 mb-1">Merma</p>
                  <div>
                    <p className="text-white">{pedido.mermaUnitaria} kg/ave</p>
                    <p className="font-bold" style={{ color: '#fb923c' }}>
                      {pedido.mermaTotal.toFixed(2)} kg
                    </p>
                  </div>
                </div>
                <div>
                  <p className="text-gray-400 mb-1">Contenedor</p>
                  <div>
                    <p className="text-white truncate">{pedido.contenedor}</p>
                    <p className="text-gray-400">{pedido.pesoContenedor} kg</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs mb-4">
                <div>
                  <p className="text-gray-400 mb-1">Peso Total</p>
                  <p className="font-bold text-sm" style={{ color: '#22c55e' }}>
                    {pedido.pesoTotalPedido.toFixed(2)} kg
                  </p>
                </div>
                <div>
                  <p className="text-gray-400 mb-1">Empleado</p>
                  <div>
                    <p className="text-white truncate">{pedido.empleado}</p>
                    <p className="text-gray-400">{pedido.fecha} {pedido.hora}</p>
                  </div>
                </div>
              </div>

              <select
                value={pedido.estado}
                onChange={(e) => handleCambiarEstado(pedido.id, e.target.value as any)}
                className="w-full px-3 py-2 rounded-lg text-sm font-medium cursor-pointer"
                style={{
                  background: estadoStyle.bg,
                  color: estadoStyle.color,
                  border: `1px solid ${estadoStyle.border}`
                }}
              >
                <option value="Pendiente" style={{ background: '#1a1a1a', color: 'white' }}>Pendiente</option>
                <option value="En Producción" style={{ background: '#1a1a1a', color: 'white' }}>En Producción</option>
                <option value="Completado" style={{ background: '#1a1a1a', color: 'white' }}>Completado</option>
              </select>
            </div>
          );
        })}

        {filteredPedidos.length === 0 && (
          <div className="text-center py-8 backdrop-blur-xl rounded-xl" style={{
            background: 'rgba(0, 0, 0, 0.3)',
            border: '1px solid rgba(204, 170, 0, 0.3)'
          }}>
            <Package className="w-12 h-12 mx-auto mb-3 text-gray-600" />
            <p className="text-gray-400 text-sm">No se encontraron pedidos</p>
          </div>
        )}
      </div>

      {/* Modal Gestionar Contenedores */}
      <ModalContenedores
        isOpen={isContenedoresModalOpen}
        onClose={() => setIsContenedoresModalOpen(false)}
        contenedores={contenedores}
        setContenedores={setContenedores}
      />
    </div>
  );
}