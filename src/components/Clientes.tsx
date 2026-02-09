import { useState } from 'react';
import { Plus, Edit2, Trash2, Search, User, Phone, MapPin, Mail, TrendingUp, ShoppingCart, X, Building2, Users, DollarSign } from 'lucide-react';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { CostosClientes } from './CostosClientes';
import { useApp } from '../contexts/AppContext';

export function Clientes() {
  const { clientes, addCliente, updateCliente, deleteCliente } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterEstado, setFilterEstado] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCliente, setEditingCliente] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'clientes' | 'costos'>('clientes');
  const [formData, setFormData] = useState({
    nombre: '',
    contacto: '',
    telefono: '',
    email: '',
    zona: '',
    estado: 'Activo' as 'Activo' | 'Inactivo'
  });

  const filteredClientes = clientes.filter(cliente => {
    const matchesSearch = 
      cliente.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cliente.contacto.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cliente.telefono.includes(searchTerm);
    const matchesEstado = filterEstado === 'all' || cliente.estado === filterEstado;
    return matchesSearch && matchesEstado;
  });

  const handleOpenModal = (cliente?: any) => {
    if (cliente) {
      setEditingCliente(cliente);
      setFormData({
        nombre: cliente.nombre,
        contacto: cliente.contacto,
        telefono: cliente.telefono,
        email: cliente.email,
        zona: cliente.zona,
        estado: cliente.estado
      });
    } else {
      setEditingCliente(null);
      setFormData({
        nombre: '',
        contacto: '',
        telefono: '',
        email: '',
        zona: '',
        estado: 'Activo'
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingCliente(null);
    setFormData({
      nombre: '',
      contacto: '',
      telefono: '',
      email: '',
      zona: '',
      estado: 'Activo'
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (editingCliente) {
      const clienteActualizado: any = {
        ...editingCliente,
        nombre: formData.nombre,
        contacto: formData.contacto,
        telefono: formData.telefono,
        email: formData.email,
        zona: formData.zona,
        estado: formData.estado
      };
      updateCliente(clienteActualizado);
    } else {
      const nuevoCliente: any = {
        id: Date.now().toString(),
        nombre: formData.nombre,
        contacto: formData.contacto,
        telefono: formData.telefono,
        email: formData.email,
        zona: formData.zona,
        totalPedidos: 0,
        ultimoPedido: '-',
        estado: formData.estado
      };
      addCliente(nuevoCliente);
    }

    handleCloseModal();
  };

  const handleEliminar = (id: string) => {
    if (confirm('¿Está seguro de eliminar este cliente?')) {
      deleteCliente(id);
    }
  };

  // Estadísticas
  const totalClientes = clientes.length;
  const clientesActivos = clientes.filter(c => c.estado === 'Activo').length;
  const clientesInactivos = clientes.filter(c => c.estado === 'Inactivo').length;
  const totalPedidosGeneral = clientes.reduce((acc, c) => acc + c.totalPedidos, 0);

  // Datos para gráficos
  const clientesPorEstado = [
    { name: 'Activos', value: clientesActivos, color: '#22c55e' },
    { name: 'Inactivos', value: clientesInactivos, color: '#ef4444' }
  ];

  const topClientes = [...clientes]
    .sort((a, b) => b.totalPedidos - a.totalPedidos)
    .slice(0, 5)
    .map(c => ({ nombre: c.nombre, pedidos: c.totalPedidos }));

  return (
    <div className="space-y-4 sm:space-y-6 p-2 sm:p-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
        <div className="w-full sm:w-auto">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-white mb-1 sm:mb-2">Gestión de Clientes</h1>
          <p className="text-xs sm:text-sm md:text-base text-gray-400">Administra la base de datos de clientes y precios</p>
        </div>
        {activeTab === 'clientes' && (
          <button
            onClick={() => handleOpenModal()}
            className="w-full sm:w-auto px-3 sm:px-4 md:px-6 py-2 sm:py-2.5 md:py-3 rounded-lg font-bold transition-all hover:scale-105 flex items-center justify-center gap-1 sm:gap-2"
            style={{
              background: 'linear-gradient(to right, #0d4a24, #166534, #b8941e, #ccaa00)',
              color: 'white',
              boxShadow: '0 4px 15px rgba(204, 170, 0, 0.4)'
            }}
          >
            <Plus className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5" />
            <span className="text-xs sm:text-sm md:text-base">Agregar Cliente</span>
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="backdrop-blur-xl rounded-lg sm:rounded-xl p-1" style={{
        background: 'rgba(0, 0, 0, 0.3)',
        border: '1px solid rgba(255, 255, 255, 0.1)'
      }}>
        <div className="grid grid-cols-2 gap-1">
          <button
            onClick={() => setActiveTab('clientes')}
            className="px-3 sm:px-4 py-2 sm:py-2.5 md:py-3 rounded-lg font-bold transition-all flex items-center justify-center gap-1 sm:gap-2"
            style={{
              background: activeTab === 'clientes' 
                ? 'linear-gradient(to right, #0d4a24, #166534, #b8941e, #ccaa00)'
                : 'transparent',
              color: activeTab === 'clientes' ? 'white' : '#888',
              boxShadow: activeTab === 'clientes' ? '0 4px 15px rgba(204, 170, 0, 0.3)' : 'none'
            }}
          >
            <Users className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5" />
            <span className="text-xs sm:text-sm md:text-base truncate">Clientes</span>
          </button>
          <button
            onClick={() => setActiveTab('costos')}
            className="px-3 sm:px-4 py-2 sm:py-2.5 md:py-3 rounded-lg font-bold transition-all flex items-center justify-center gap-1 sm:gap-2"
            style={{
              background: activeTab === 'costos' 
                ? 'linear-gradient(to right, #0d4a24, #166534, #b8941e, #ccaa00)'
                : 'transparent',
              color: activeTab === 'costos' ? 'white' : '#888',
              boxShadow: activeTab === 'costos' ? '0 4px 15px rgba(204, 170, 0, 0.3)' : 'none'
            }}
          >
            <DollarSign className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5" />
            <span className="text-xs sm:text-sm md:text-base truncate">Costos</span>
          </button>
        </div>
      </div>

      {/* Contenido según tab activo */}
      {activeTab === 'clientes' ? (
        <>
          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            <div className="backdrop-blur-xl rounded-xl p-4 sm:p-6" style={{
              background: 'rgba(0, 0, 0, 0.3)',
              border: '1px solid rgba(255, 255, 255, 0.2)'
            }}>
              <div className="flex items-center justify-between mb-2">
                <p className="text-gray-400 text-xs sm:text-sm">Total Clientes</p>
                <User className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
              </div>
              <p className="text-2xl sm:text-3xl font-bold text-white">{totalClientes}</p>
            </div>

            <div className="backdrop-blur-xl rounded-xl p-4 sm:p-6" style={{
              background: 'rgba(0, 0, 0, 0.3)',
              border: '1px solid rgba(34, 197, 94, 0.3)'
            }}>
              <div className="flex items-center justify-between mb-2">
                <p className="text-gray-400 text-xs sm:text-sm">Activos</p>
                <User className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: '#22c55e' }} />
              </div>
              <p className="text-2xl sm:text-3xl font-bold" style={{ color: '#22c55e' }}>{clientesActivos}</p>
            </div>

            <div className="backdrop-blur-xl rounded-xl p-4 sm:p-6" style={{
              background: 'rgba(0, 0, 0, 0.3)',
              border: '1px solid rgba(239, 68, 68, 0.3)'
            }}>
              <div className="flex items-center justify-between mb-2">
                <p className="text-gray-400 text-xs sm:text-sm">Inactivos</p>
                <User className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: '#ef4444' }} />
              </div>
              <p className="text-2xl sm:text-3xl font-bold" style={{ color: '#ef4444' }}>{clientesInactivos}</p>
            </div>

            <div className="backdrop-blur-xl rounded-xl p-4 sm:p-6" style={{
              background: 'rgba(0, 0, 0, 0.3)',
              border: '1px solid rgba(204, 170, 0, 0.3)'
            }}>
              <div className="flex items-center justify-between mb-2">
                <p className="text-gray-400 text-xs sm:text-sm">Total Pedidos</p>
                <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: '#ccaa00' }} />
              </div>
              <p className="text-2xl sm:text-3xl font-bold" style={{ color: '#ccaa00' }}>{totalPedidosGeneral}</p>
            </div>
          </div>

          {/* Filtros */}
          <div className="backdrop-blur-xl rounded-xl p-3 sm:p-4" style={{
            background: 'rgba(0, 0, 0, 0.3)',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar por nombre, contacto o teléfono..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 sm:pl-12 pr-3 sm:pr-4 py-2.5 sm:py-3 rounded-lg text-sm sm:text-base text-white placeholder-gray-400"
                  style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)'
                  }}
                />
              </div>

              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
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
                  <option value="Activo" style={{ background: '#1a1a1a', color: 'white' }}>Activo</option>
                  <option value="Inactivo" style={{ background: '#1a1a1a', color: 'white' }}>Inactivo</option>
                </select>
              </div>
            </div>
          </div>

          {/* Gráficos */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            {/* Distribución por Estado */}
            <div className="backdrop-blur-xl rounded-xl p-4 sm:p-6" style={{
              background: 'rgba(0, 0, 0, 0.3)',
              border: '1px solid rgba(204, 170, 0, 0.3)'
            }}>
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: '#ccaa00' }} />
                <h3 className="text-base sm:text-lg font-bold text-white truncate">Distribución por Estado</h3>
              </div>
              <div style={{ width: '100%', height: '240px', minHeight: '240px', minWidth: 0 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={clientesPorEstado}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name}: ${value}`}
                      outerRadius={60}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {clientesPorEstado.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        background: 'rgba(0, 0, 0, 0.9)', 
                        border: '1px solid rgba(204, 170, 0, 0.5)',
                        borderRadius: '8px'
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Top Clientes por Pedidos */}
            <div className="backdrop-blur-xl rounded-xl p-4 sm:p-6" style={{
              background: 'rgba(0, 0, 0, 0.3)',
              border: '1px solid rgba(204, 170, 0, 0.3)'
            }}>
              <div className="flex items-center gap-2 mb-4">
                <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: '#ccaa00' }} />
                <h3 className="text-base sm:text-lg font-bold text-white truncate">Top 5 Clientes</h3>
              </div>
              <div style={{ width: '100%', height: '240px', minHeight: '240px', minWidth: 0 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topClientes} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                    <XAxis type="number" stroke="#888" />
                    <YAxis 
                      dataKey="nombre" 
                      type="category" 
                      stroke="#888" 
                      width={80}
                      tick={{ fontSize: 12 }}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        background: 'rgba(0, 0, 0, 0.9)', 
                        border: '1px solid rgba(204, 170, 0, 0.5)',
                        borderRadius: '8px'
                      }}
                      labelStyle={{ color: '#fff' }}
                    />
                    <Bar dataKey="pedidos" fill="#ccaa00" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Tabla de Clientes */}
          <div className="backdrop-blur-xl rounded-xl overflow-hidden" style={{
            background: 'rgba(0, 0, 0, 0.3)',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[800px] sm:min-w-full">
                <thead>
                  <tr style={{ background: 'rgba(0, 0, 0, 0.4)', borderBottom: '1px solid rgba(204, 170, 0, 0.3)' }}>
                    <th className="px-4 py-3 text-left font-bold text-xs sm:text-sm" style={{ color: '#ccaa00' }}>Cliente</th>
                    <th className="px-4 py-3 text-left font-bold text-xs sm:text-sm hidden sm:table-cell" style={{ color: '#ccaa00' }}>Contacto</th>
                    <th className="px-4 py-3 text-left font-bold text-xs sm:text-sm" style={{ color: '#ccaa00' }}>Teléfono</th>
                    <th className="px-4 py-3 text-left font-bold text-xs sm:text-sm hidden md:table-cell" style={{ color: '#ccaa00' }}>Email</th>
                    <th className="px-4 py-3 text-left font-bold text-xs sm:text-sm hidden lg:table-cell" style={{ color: '#ccaa00' }}>Zona</th>
                    <th className="px-4 py-3 text-left font-bold text-xs sm:text-sm" style={{ color: '#ccaa00' }}>Pedidos</th>
                    <th className="px-4 py-3 text-left font-bold text-xs sm:text-sm hidden md:table-cell" style={{ color: '#ccaa00' }}>Último Pedido</th>
                    <th className="px-4 py-3 text-left font-bold text-xs sm:text-sm" style={{ color: '#ccaa00' }}>Estado</th>
                    <th className="px-4 py-3 text-center font-bold text-xs sm:text-sm" style={{ color: '#ccaa00' }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredClientes.map((cliente) => (
                    <tr 
                      key={cliente.id}
                      className="border-b transition-colors hover:bg-white/5"
                      style={{ borderColor: 'rgba(255, 255, 255, 0.05)' }}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center flex-shrink-0" style={{
                            background: 'linear-gradient(135deg, #ccaa00, #b8941e)'
                          }}>
                            <User className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-white text-sm truncate">{cliente.nombre}</p>
                            <p className="text-gray-400 text-xs sm:hidden">{cliente.contacto}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-300 text-sm hidden sm:table-cell">
                        {cliente.contacto}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 sm:gap-2">
                          <Phone className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" style={{ color: '#ccaa00' }} />
                          <span className="text-white text-xs sm:text-sm truncate">{cliente.telefono}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <div className="flex items-center gap-1 sm:gap-2">
                          <Mail className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" style={{ color: '#ccaa00' }} />
                          <span className="text-gray-300 text-sm truncate">{cliente.email}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell">
                        <div className="flex items-center gap-1 sm:gap-2">
                          <MapPin className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" style={{ color: '#ccaa00' }} />
                          <span className="text-gray-300 text-sm truncate">{cliente.zona}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-lg sm:text-xl font-bold" style={{ color: '#ccaa00' }}>
                          {cliente.totalPedidos}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-300 text-sm hidden md:table-cell">
                        {cliente.ultimoPedido}
                      </td>
                      <td className="px-4 py-3">
                        <span 
                          className="px-2 sm:px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap"
                          style={{
                            background: cliente.estado === 'Activo' 
                              ? 'rgba(34, 197, 94, 0.2)' 
                              : 'rgba(239, 68, 68, 0.2)',
                            color: cliente.estado === 'Activo' ? '#22c55e' : '#ef4444',
                            border: `1px solid ${cliente.estado === 'Activo' ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`
                          }}
                        >
                          {cliente.estado}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-1 sm:gap-2">
                          <button
                            onClick={() => handleOpenModal(cliente)}
                            className="p-1.5 sm:p-2 rounded-lg transition-all hover:scale-110"
                            style={{
                              background: 'rgba(245, 158, 11, 0.2)',
                              border: '1px solid rgba(245, 158, 11, 0.3)'
                            }}
                          >
                            <Edit2 className="w-3 h-3 sm:w-4 sm:h-4" style={{ color: '#f59e0b' }} />
                          </button>
                          <button
                            onClick={() => handleEliminar(cliente.id)}
                            className="p-1.5 sm:p-2 rounded-lg transition-all hover:scale-110"
                            style={{
                              background: 'rgba(239, 68, 68, 0.2)',
                              border: '1px solid rgba(239, 68, 68, 0.3)'
                            }}
                          >
                            <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" style={{ color: '#ef4444' }} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {filteredClientes.length === 0 && (
              <div className="text-center py-8 sm:py-12">
                <User className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 text-gray-600" />
                <p className="text-gray-400 text-sm sm:text-base">No se encontraron clientes</p>
              </div>
            )}
          </div>

          {/* Modal Agregar/Editar Cliente */}
          {isModalOpen && (
            <div 
              className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 overflow-y-auto"
              style={{ background: 'rgba(0, 0, 0, 0.85)' }}
              onClick={handleCloseModal}
            >
              <div 
                className="backdrop-blur-2xl rounded-xl sm:rounded-2xl md:rounded-3xl w-full max-w-sm sm:max-w-md md:max-w-lg lg:max-w-3xl mx-2 sm:mx-4 p-3 sm:p-4 md:p-6 max-h-[90vh] overflow-y-auto"
                style={{
                  background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.7) 0%, rgba(13, 74, 36, 0.3) 50%, rgba(0, 0, 0, 0.7) 100%)',
                  border: '2px solid rgba(204, 170, 0, 0.3)',
                  boxShadow: '0 30px 60px -12px rgba(0, 0, 0, 0.8), 0 0 100px rgba(204, 170, 0, 0.15)'
                }}
                onClick={(e) => e.stopPropagation()}
              >
                {/* Header */}
                <div className="flex items-center justify-between mb-3 sm:mb-6 pb-3 sm:pb-4 border-b" style={{ borderColor: 'rgba(204, 170, 0, 0.2)' }}>
                  <div className="flex items-center gap-2 sm:gap-3 md:gap-4">
                    <div 
                      className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-lg sm:rounded-xl md:rounded-2xl flex items-center justify-center flex-shrink-0"
                      style={{
                        background: 'linear-gradient(135deg, #ccaa00, #b8941e)',
                        boxShadow: '0 10px 30px rgba(204, 170, 0, 0.4)'
                      }}
                    >
                      <User className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 text-black" />
                    </div>
                    <div className="min-w-0">
                      <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-white truncate">
                        {editingCliente ? 'Editar Cliente' : 'Registrar Cliente'}
                      </h2>
                      <p className="text-xs text-gray-400 hidden sm:block truncate">Complete los datos del cliente</p>
                    </div>
                  </div>
                  <button
                    onClick={handleCloseModal}
                    className="p-1.5 sm:p-2 md:p-3 rounded-lg sm:rounded-xl transition-all hover:scale-110 hover:rotate-90 flex-shrink-0"
                    style={{ 
                      background: 'rgba(239, 68, 68, 0.2)',
                      border: '1px solid rgba(239, 68, 68, 0.3)'
                    }}
                  >
                    <X className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" style={{ color: '#ef4444' }} />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-xs sm:text-sm font-bold mb-1 sm:mb-2" style={{ color: '#ccaa00' }}>
                        Nombre del Cliente / Negocio *
                      </label>
                      <div className="relative">
                        <Building2 className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 text-gray-400" />
                        <input
                          type="text"
                          required
                          value={formData.nombre}
                          onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                          className="w-full pl-9 sm:pl-10 md:pl-12 pr-3 py-2 sm:py-2.5 md:py-3 rounded-lg text-xs sm:text-sm md:text-base text-white placeholder-gray-400 transition-all focus:ring-2"
                          style={{
                            background: 'rgba(255, 255, 255, 0.08)',
                            border: '1.5px solid rgba(204, 170, 0, 0.3)',
                            outlineColor: '#ccaa00'
                          }}
                          placeholder="Ej: Restaurante El Sabor"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs sm:text-sm font-bold mb-1 sm:mb-2" style={{ color: '#ccaa00' }}>
                        Persona de Contacto *
                      </label>
                      <div className="relative">
                        <User className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 text-gray-400" />
                        <input
                          type="text"
                          required
                          value={formData.contacto}
                          onChange={(e) => setFormData({ ...formData, contacto: e.target.value })}
                          className="w-full pl-9 sm:pl-10 md:pl-12 pr-3 py-2 sm:py-2.5 md:py-3 rounded-lg text-xs sm:text-sm md:text-base text-white placeholder-gray-400 transition-all focus:ring-2"
                          style={{
                            background: 'rgba(255, 255, 255, 0.08)',
                            border: '1.5px solid rgba(59, 130, 246, 0.3)',
                            outlineColor: '#3b82f6'
                          }}
                          placeholder="Ej: Carlos Mendoza"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs sm:text-sm font-bold mb-1 sm:mb-2" style={{ color: '#ccaa00' }}>
                        Teléfono *
                      </label>
                      <div className="relative">
                        <Phone className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 text-gray-400" />
                        <input
                          type="tel"
                          required
                          value={formData.telefono}
                          onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                          className="w-full pl-9 sm:pl-10 md:pl-12 pr-3 py-2 sm:py-2.5 md:py-3 rounded-lg text-xs sm:text-sm md:text-base text-white placeholder-gray-400 transition-all focus:ring-2"
                          style={{
                            background: 'rgba(255, 255, 255, 0.08)',
                            border: '1.5px solid rgba(34, 197, 94, 0.3)',
                            outlineColor: '#22c55e'
                          }}
                          placeholder="Ej: 987 654 321"
                        />
                      </div>
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-xs sm:text-sm font-bold mb-1 sm:mb-2" style={{ color: '#ccaa00' }}>
                        Email
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 text-gray-400" />
                        <input
                          type="email"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          className="w-full pl-9 sm:pl-10 md:pl-12 pr-3 py-2 sm:py-2.5 md:py-3 rounded-lg text-xs sm:text-sm md:text-base text-white placeholder-gray-400 transition-all focus:ring-2"
                          style={{
                            background: 'rgba(255, 255, 255, 0.08)',
                            border: '1.5px solid rgba(236, 72, 153, 0.3)',
                            outlineColor: '#ec4899'
                          }}
                          placeholder="Ej: contacto@cliente.com"
                        />
                      </div>
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-xs sm:text-sm font-bold mb-1 sm:mb-2" style={{ color: '#ccaa00' }}>
                        Zona *
                      </label>
                      <div className="relative">
                        <MapPin className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 text-gray-400" />
                        <select
                          required
                          value={formData.zona}
                          onChange={(e) => setFormData({ ...formData, zona: e.target.value })}
                          className="w-full pl-9 sm:pl-10 md:pl-12 pr-3 py-2 sm:py-2.5 md:py-3 rounded-lg text-xs sm:text-sm md:text-base text-white placeholder-gray-400 transition-all focus:ring-2"
                          style={{
                            background: 'rgba(255, 255, 255, 0.08)',
                            border: '1.5px solid rgba(204, 170, 0, 0.3)',
                            outlineColor: '#ccaa00'
                          }}
                        >
                          <option value="" style={{ background: '#1a1a1a', color: 'white' }}>Seleccionar zona...</option>
                          <option value="1" style={{ background: '#1a1a1a', color: 'white' }}>Zona 1</option>
                          <option value="2" style={{ background: '#1a1a1a', color: 'white' }}>Zona 2</option>
                          <option value="3" style={{ background: '#1a1a1a', color: 'white' }}>Zona 3</option>
                          <option value="4" style={{ background: '#1a1a1a', color: 'white' }}>Zona 4</option>
                          <option value="5" style={{ background: '#1a1a1a', color: 'white' }}>Zona 5</option>
                          <option value="6" style={{ background: '#1a1a1a', color: 'white' }}>Zona 6</option>
                        </select>
                      </div>
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-xs sm:text-sm font-bold mb-1 sm:mb-2" style={{ color: '#ccaa00' }}>
                        Estado *
                      </label>
                      <select
                        value={formData.estado}
                        onChange={(e) => setFormData({ ...formData, estado: e.target.value as 'Activo' | 'Inactivo' })}
                        className="w-full px-3 py-2 sm:py-2.5 md:py-3 rounded-lg text-xs sm:text-sm md:text-base text-white transition-all focus:ring-2"
                        style={{
                          background: 'rgba(255, 255, 255, 0.08)',
                          border: '1.5px solid rgba(204, 170, 0, 0.3)',
                          outlineColor: '#ccaa00'
                        }}
                      >
                        <option value="Activo" style={{ background: '#1a1a1a', color: 'white' }}>✓ Activo</option>
                        <option value="Inactivo" style={{ background: '#1a1a1a', color: 'white' }}>✗ Inactivo</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-3 sm:pt-4">
                    <button
                      type="button"
                      onClick={handleCloseModal}
                      className="w-full sm:flex-1 px-4 py-2.5 sm:py-3 rounded-lg text-sm sm:text-base font-bold transition-all hover:scale-105"
                      style={{
                        background: 'rgba(255, 255, 255, 0.1)',
                        color: '#ffffff',
                        border: '1.5px solid rgba(255, 255, 255, 0.2)'
                      }}
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="w-full sm:flex-1 px-4 py-2.5 sm:py-3 rounded-lg text-sm sm:text-base font-bold transition-all hover:scale-105 shadow-lg"
                      style={{
                        background: 'linear-gradient(135deg, #0d4a24, #166534, #b8941e, #ccaa00)',
                        color: '#ffffff',
                        boxShadow: '0 10px 30px rgba(204, 170, 0, 0.4)'
                      }}
                    >
                      {editingCliente ? 'Actualizar Cliente' : 'Guardar Cliente'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </>
      ) : (
        <CostosClientes />
      )}
    </div>
  );
}