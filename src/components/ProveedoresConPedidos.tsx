import { useState } from 'react';
import { Plus, Edit2, Trash2, Search, X, ShoppingCart, Calendar, Bird, Phone, MapPin, FileText } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { toast } from 'sonner@2.0.3';

interface Proveedor {
  id: string;
  nombre: string;
  ruc: string;
  direccion: string;
  telefono: string;
  contacto?: string;
}

interface Pedido {
  id: string;
  proveedorId: string;
  proveedorNombre: string;
  tipoAve: string;
  variedad?: string;
  cantidadJavas: number;
  avesPorJava: number;
  cantidad: number;
  cantidadMachos?: number;
  cantidadHembras?: number;
  fechaIngreso: string;
  horaIngreso: string;
}

export function ProveedoresConPedidos() {
  const { tiposAve } = useApp();
  
  const [proveedores] = useState<Proveedor[]>([
    {
      id: '1',
      nombre: 'Distribuidora San Martín',
      ruc: '20123456789',
      direccion: 'Av. Principal 123, Lima',
      telefono: '987654321',
      contacto: 'Juan Pérez'
    },
    {
      id: '2',
      nombre: 'Avícola del Norte SAC',
      ruc: '20987654321',
      direccion: 'Jr. Los Andes 456, Trujillo',
      telefono: '945678912',
      contacto: 'María García'
    },
    {
      id: '3',
      nombre: 'Granja La Esperanza EIRL',
      ruc: '20456789123',
      direccion: 'Calle Las Flores 789, Chiclayo',
      telefono: '956123789',
      contacto: 'Carlos López'
    }
  ]);

  const [pedidos, setPedidos] = useState<Pedido[]>([
    {
      id: '1',
      proveedorId: '1',
      proveedorNombre: 'Distribuidora San Martín',
      tipoAve: 'Pollo',
      variedad: 'Blancos',
      cantidadJavas: 3,
      avesPorJava: 50,
      cantidad: 150,
      fechaIngreso: '2025-02-01',
      horaIngreso: '08:30'
    },
    {
      id: '2',
      proveedorId: '2',
      proveedorNombre: 'Avícola del Norte SAC',
      tipoAve: 'Gallina',
      variedad: 'Rojas',
      cantidadJavas: 2,
      avesPorJava: 40,
      cantidad: 80,
      fechaIngreso: '2025-02-03',
      horaIngreso: '09:00'
    }
  ]);

  const [isPedidoModalOpen, setIsPedidoModalOpen] = useState(false);
  const [editingPedido, setEditingPedido] = useState<Pedido | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterProveedor, setFilterProveedor] = useState<string>('all');
  
  const [pedidoFormData, setPedidoFormData] = useState({
    proveedorId: '',
    tipoAve: 'Pollo',
    variedad: undefined as string | undefined,
    cantidadJavas: '',
    avesPorJava: '',
    cantidadMachos: '',
    cantidadHembras: '',
    fechaIngreso: new Date().toISOString().split('T')[0],
    horaIngreso: new Date().toISOString().split('T')[1].slice(0, 5)
  });

  const filteredPedidos = pedidos.filter(pedido => {
    const matchesSearch = pedido.proveedorNombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          pedido.tipoAve.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterProveedor === 'all' || pedido.proveedorId === filterProveedor;
    return matchesSearch && matchesFilter;
  });

  const stats = {
    totalProveedores: proveedores.length,
    pedidosPendientes: pedidos.length,
    ultimoPedido: pedidos.length > 0 ? pedidos[pedidos.length - 1].fechaIngreso : '-'
  };

  const handleOpenPedidoModal = (pedido?: Pedido) => {
    if (pedido) {
      setEditingPedido(pedido);
      setPedidoFormData({
        proveedorId: pedido.proveedorId,
        tipoAve: pedido.tipoAve,
        variedad: pedido.variedad,
        cantidadJavas: pedido.cantidadJavas.toString(),
        avesPorJava: pedido.avesPorJava.toString(),
        cantidadMachos: pedido.cantidadMachos?.toString() || '',
        cantidadHembras: pedido.cantidadHembras?.toString() || '',
        fechaIngreso: pedido.fechaIngreso,
        horaIngreso: pedido.horaIngreso
      });
    } else {
      setEditingPedido(null);
      setPedidoFormData({
        proveedorId: '',
        tipoAve: 'Pollo',
        variedad: undefined,
        cantidadJavas: '',
        avesPorJava: '',
        cantidadMachos: '',
        cantidadHembras: '',
        fechaIngreso: new Date().toISOString().split('T')[0],
        horaIngreso: new Date().toISOString().split('T')[1].slice(0, 5)
      });
    }
    setIsPedidoModalOpen(true);
  };

  const handleClosePedidoModal = () => {
    setIsPedidoModalOpen(false);
    setEditingPedido(null);
  };

  const handleSubmitPedido = (e: React.FormEvent) => {
    e.preventDefault();
    
    const proveedor = proveedores.find(p => p.id === pedidoFormData.proveedorId);
    if (!proveedor) return;

    const totalAves = parseInt(pedidoFormData.cantidadJavas) * parseInt(pedidoFormData.avesPorJava);

    const pedidoData: Pedido = {
      id: editingPedido?.id || Date.now().toString(),
      proveedorId: pedidoFormData.proveedorId,
      proveedorNombre: proveedor.nombre,
      tipoAve: pedidoFormData.tipoAve,
      variedad: pedidoFormData.variedad,
      cantidadJavas: parseInt(pedidoFormData.cantidadJavas),
      avesPorJava: parseInt(pedidoFormData.avesPorJava),
      cantidad: totalAves,
      cantidadMachos: pedidoFormData.cantidadMachos ? parseInt(pedidoFormData.cantidadMachos) : undefined,
      cantidadHembras: pedidoFormData.cantidadHembras ? parseInt(pedidoFormData.cantidadHembras) : undefined,
      fechaIngreso: pedidoFormData.fechaIngreso,
      horaIngreso: pedidoFormData.horaIngreso
    };

    if (editingPedido) {
      setPedidos(pedidos.map(p => p.id === editingPedido.id ? pedidoData : p));
      toast.success('Pedido actualizado exitosamente');
    } else {
      setPedidos([...pedidos, pedidoData]);
      toast.success('Pedido registrado exitosamente');
    }
    
    handleClosePedidoModal();
  };

  const handleDeletePedido = (id: string) => {
    if (confirm('¿Está seguro de eliminar este pedido?')) {
      setPedidos(pedidos.filter(p => p.id !== id));
      toast.success('Pedido eliminado exitosamente');
    }
  };

  const tipoAveSeleccionado = tiposAve.find(t => t.nombre === pedidoFormData.tipoAve);

  return (
    <div className="space-y-6 p-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Gestión de Proveedores</h1>
          <p className="text-gray-400">Registro de pedidos de abastecimiento</p>
        </div>
        <button
          onClick={() => handleOpenPedidoModal()}
          className="flex items-center gap-2 px-6 py-3 rounded-lg font-bold transition-all hover:scale-105"
          style={{
            background: 'linear-gradient(to right, #0d4a24, #166534, #b8941e, #ccaa00)',
            color: '#ffffff',
            boxShadow: '0 4px 12px rgba(204, 170, 0, 0.4)'
          }}
        >
          <Plus className="w-5 h-5" />
          Nuevo Pedido
        </button>
      </div>

      {/* Métricas Clave */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="backdrop-blur-xl rounded-xl p-6" style={{
          background: 'rgba(0, 0, 0, 0.3)',
          border: '1px solid rgba(34, 197, 94, 0.3)'
        }}>
          <div className="flex items-center justify-between mb-3">
            <p className="text-gray-400 text-sm font-medium">Total Proveedores</p>
            <Phone className="w-5 h-5" style={{ color: '#22c55e' }} />
          </div>
          <p className="text-3xl font-bold text-white mb-1">{stats.totalProveedores}</p>
          <p className="text-sm" style={{ color: '#22c55e' }}>Activos en el sistema</p>
        </div>

        <div className="backdrop-blur-xl rounded-xl p-6" style={{
          background: 'rgba(0, 0, 0, 0.3)',
          border: '1px solid rgba(204, 170, 0, 0.3)'
        }}>
          <div className="flex items-center justify-between mb-3">
            <p className="text-gray-400 text-sm font-medium">Pedidos Registrados</p>
            <FileText className="w-5 h-5" style={{ color: '#ccaa00' }} />
          </div>
          <p className="text-3xl font-bold text-white mb-1">{stats.pedidosPendientes}</p>
          <p className="text-sm" style={{ color: '#ccaa00' }}>Total de pedidos</p>
        </div>

        <div className="backdrop-blur-xl rounded-xl p-6" style={{
          background: 'rgba(0, 0, 0, 0.3)',
          border: '1px solid rgba(59, 130, 246, 0.3)'
        }}>
          <div className="flex items-center justify-between mb-3">
            <p className="text-gray-400 text-sm font-medium">Último Pedido</p>
            <Calendar className="w-5 h-5" style={{ color: '#3b82f6' }} />
          </div>
          <p className="text-3xl font-bold text-white mb-1">{stats.ultimoPedido}</p>
          <p className="text-sm" style={{ color: '#3b82f6' }}>Fecha de ingreso</p>
        </div>
      </div>

      {/* Lista de Proveedores */}
      <div className="backdrop-blur-xl rounded-xl p-6" style={{
        background: 'rgba(0, 0, 0, 0.3)',
        border: '1px solid rgba(255, 255, 255, 0.1)'
      }}>
        <h2 className="text-xl font-bold text-white mb-4">Proveedores Registrados</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr style={{ background: 'rgba(0, 0, 0, 0.4)', borderBottom: '1px solid rgba(204, 170, 0, 0.3)' }}>
                <th className="px-6 py-3 text-left font-bold" style={{ color: '#ccaa00' }}>Nombre</th>
                <th className="px-6 py-3 text-left font-bold" style={{ color: '#ccaa00' }}>RUC</th>
                <th className="px-6 py-3 text-left font-bold" style={{ color: '#ccaa00' }}>Contacto</th>
                <th className="px-6 py-3 text-left font-bold" style={{ color: '#ccaa00' }}>Teléfono</th>
                <th className="px-6 py-3 text-left font-bold" style={{ color: '#ccaa00' }}>Dirección</th>
              </tr>
            </thead>
            <tbody>
              {proveedores.map((proveedor) => (
                <tr 
                  key={proveedor.id}
                  className="border-b transition-colors hover:bg-white/5"
                  style={{ borderColor: 'rgba(255, 255, 255, 0.05)' }}
                >
                  <td className="px-6 py-4 text-white font-medium">{proveedor.nombre}</td>
                  <td className="px-6 py-4 text-gray-300">{proveedor.ruc}</td>
                  <td className="px-6 py-4 text-gray-300">{proveedor.contacto || '-'}</td>
                  <td className="px-6 py-4 text-gray-300">{proveedor.telefono}</td>
                  <td className="px-6 py-4 text-gray-300">{proveedor.direccion}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pedidos */}
      <div className="backdrop-blur-xl rounded-xl overflow-hidden" style={{
        background: 'rgba(0, 0, 0, 0.3)',
        border: '1px solid rgba(255, 255, 255, 0.1)'
      }}>
        <div className="p-4 border-b" style={{ borderColor: 'rgba(204, 170, 0, 0.2)' }}>
          <h2 className="text-xl font-bold text-white mb-4">Historial de Pedidos</h2>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por proveedor o tipo de ave..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 rounded-lg text-white placeholder-gray-400"
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)'
                }}
              />
            </div>
            <select
              value={filterProveedor}
              onChange={(e) => setFilterProveedor(e.target.value)}
              className="px-4 py-3 rounded-lg text-white"
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)'
              }}
            >
              <option value="all" style={{ background: '#1a1a1a' }}>Todos los proveedores</option>
              {proveedores.map((proveedor) => (
                <option key={proveedor.id} value={proveedor.id} style={{ background: '#1a1a1a' }}>
                  {proveedor.nombre}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr style={{ background: 'rgba(0, 0, 0, 0.4)', borderBottom: '1px solid rgba(204, 170, 0, 0.3)' }}>
                <th className="px-6 py-4 text-left font-bold" style={{ color: '#ccaa00' }}>Proveedor</th>
                <th className="px-6 py-4 text-left font-bold" style={{ color: '#ccaa00' }}>Tipo de Ave</th>
                <th className="px-6 py-4 text-left font-bold" style={{ color: '#ccaa00' }}>Detalle</th>
                <th className="px-6 py-4 text-left font-bold" style={{ color: '#ccaa00' }}>Cantidad</th>
                <th className="px-6 py-4 text-left font-bold" style={{ color: '#ccaa00' }}>Fecha</th>
                <th className="px-6 py-4 text-center font-bold" style={{ color: '#ccaa00' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredPedidos.map((pedido) => {
                const tipoAve = tiposAve.find(t => t.nombre === pedido.tipoAve);
                return (
                  <tr 
                    key={pedido.id}
                    className="border-b transition-colors hover:bg-white/5"
                    style={{ borderColor: 'rgba(255, 255, 255, 0.05)' }}
                  >
                    <td className="px-6 py-4 text-white">{pedido.proveedorNombre}</td>
                    <td className="px-6 py-4">
                      <span 
                        className="px-2 py-1 rounded-full text-xs font-medium"
                        style={{
                          background: tipoAve?.color ? `${tipoAve.color}20` : 'rgba(34, 197, 94, 0.2)',
                          color: tipoAve?.color || '#22c55e',
                          border: `1px solid ${tipoAve?.color ? `${tipoAve.color}40` : 'rgba(34, 197, 94, 0.3)'}`
                        }}
                      >
                        {pedido.tipoAve}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-300 text-sm">
                      {pedido.variedad && <div className="mb-1">{pedido.variedad}</div>}
                      <div className="text-xs space-x-2">
                        <span style={{ color: '#3b82f6' }}>Javas {pedido.cantidadJavas}</span>
                        <span>|</span>
                        <span style={{ color: '#ec4899' }}>Aves/Java {pedido.avesPorJava}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-white font-bold">{pedido.cantidad}</td>
                    <td className="px-6 py-4 text-gray-300 text-sm">
                      <div>{pedido.fechaIngreso}</div>
                      <div className="text-xs">{pedido.horaIngreso}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleOpenPedidoModal(pedido)}
                          className="p-2 rounded-lg transition-all hover:scale-110"
                          style={{
                            background: 'rgba(34, 197, 94, 0.2)',
                            border: '1px solid rgba(34, 197, 94, 0.3)'
                          }}
                        >
                          <Edit2 className="w-4 h-4" style={{ color: '#22c55e' }} />
                        </button>
                        <button
                          onClick={() => handleDeletePedido(pedido.id)}
                          className="p-2 rounded-lg transition-all hover:scale-110"
                          style={{
                            background: 'rgba(239, 68, 68, 0.2)',
                            border: '1px solid rgba(239, 68, 68, 0.3)'
                          }}
                        >
                          <Trash2 className="w-4 h-4" style={{ color: '#ef4444' }} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Nuevo Pedido */}
      {isPedidoModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0, 0, 0, 0.85)' }}>
          <div className="backdrop-blur-2xl rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden" style={{
            background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.7) 0%, rgba(13, 74, 36, 0.3) 50%, rgba(0, 0, 0, 0.7) 100%)',
            border: '2px solid rgba(204, 170, 0, 0.3)',
            boxShadow: '0 20px 40px -12px rgba(0, 0, 0, 0.8)'
          }}>
            {/* Header */}
            <div className="p-6 border-b" style={{ borderColor: 'rgba(204, 170, 0, 0.2)' }}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-12 h-12 rounded-xl flex items-center justify-center"
                    style={{
                      background: 'linear-gradient(135deg, #ccaa00, #b8941e)',
                      boxShadow: '0 10px 30px rgba(204, 170, 0, 0.4)'
                    }}
                  >
                    <ShoppingCart className="w-6 h-6 text-black" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">
                      {editingPedido ? 'Editar Pedido' : 'Nuevo Pedido de Abastecimiento'}
                    </h2>
                    <p className="text-sm text-gray-300">Registro de aves del proveedor</p>
                  </div>
                </div>
                <button
                  onClick={handleClosePedidoModal}
                  className="p-2 rounded-xl transition-all hover:scale-110 hover:rotate-90"
                  style={{ 
                    background: 'rgba(239, 68, 68, 0.2)',
                    border: '1px solid rgba(239, 68, 68, 0.3)'
                  }}
                >
                  <X className="w-5 h-5" style={{ color: '#ef4444' }} />
                </button>
              </div>
            </div>

            {/* Form */}
            <div className="overflow-y-auto p-6" style={{ maxHeight: 'calc(90vh - 100px)' }}>
              <form onSubmit={handleSubmitPedido} className="space-y-6">
                {/* Proveedor */}
                <div>
                  <label className="block text-sm font-medium mb-2 text-white">Proveedor *</label>
                  <select
                    required
                    value={pedidoFormData.proveedorId}
                    onChange={(e) => setPedidoFormData({ ...pedidoFormData, proveedorId: e.target.value })}
                    className="w-full px-4 py-3 rounded-lg text-white"
                    style={{
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.1)'
                    }}
                  >
                    <option value="" style={{ background: '#1a1a1a' }}>Seleccionar proveedor</option>
                    {proveedores.map((proveedor) => (
                      <option key={proveedor.id} value={proveedor.id} style={{ background: '#1a1a1a' }}>
                        {proveedor.nombre}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Tipo de Ave */}
                <div>
                  <label className="block text-sm font-medium mb-2 text-white">Tipo de Ave *</label>
                  <select
                    required
                    value={pedidoFormData.tipoAve}
                    onChange={(e) => setPedidoFormData({ ...pedidoFormData, tipoAve: e.target.value, variedad: undefined })}
                    className="w-full px-4 py-3 rounded-lg text-white"
                    style={{
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.1)'
                    }}
                  >
                    {tiposAve.map((tipo) => (
                      <option key={tipo.id} value={tipo.nombre} style={{ background: '#1a1a1a' }}>
                        {tipo.nombre}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Variedad (si aplica) */}
                {tipoAveSeleccionado?.tieneVariedad && tipoAveSeleccionado.variedades && (
                  <div>
                    <label className="block text-sm font-medium mb-2 text-white">Variedad *</label>
                    <select
                      required
                      value={pedidoFormData.variedad || ''}
                      onChange={(e) => setPedidoFormData({ ...pedidoFormData, variedad: e.target.value })}
                      className="w-full px-4 py-3 rounded-lg text-white"
                      style={{
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid rgba(255, 255, 255, 0.1)'
                      }}
                    >
                      <option value="" style={{ background: '#1a1a1a' }}>Seleccionar variedad</option>
                      {tipoAveSeleccionado.variedades.map((variedad) => (
                        <option key={variedad} value={variedad} style={{ background: '#1a1a1a' }}>
                          {variedad}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Cantidad de Javas y Aves por Java */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2 text-white">Cantidad de Javas *</label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={pedidoFormData.cantidadJavas}
                      onChange={(e) => setPedidoFormData({ ...pedidoFormData, cantidadJavas: e.target.value })}
                      className="w-full px-4 py-3 rounded-lg text-white"
                      style={{
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid rgba(255, 255, 255, 0.1)'
                      }}
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2 text-white">Aves por Java *</label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={pedidoFormData.avesPorJava}
                      onChange={(e) => setPedidoFormData({ ...pedidoFormData, avesPorJava: e.target.value })}
                      className="w-full px-4 py-3 rounded-lg text-white"
                      style={{
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid rgba(255, 255, 255, 0.1)'
                      }}
                      placeholder="0"
                    />
                  </div>
                </div>

                {/* Total calculado */}
                {pedidoFormData.cantidadJavas && pedidoFormData.avesPorJava && (
                  <div className="p-4 rounded-lg" style={{ background: 'rgba(34, 197, 94, 0.1)', border: '1px solid rgba(34, 197, 94, 0.3)' }}>
                    <p className="text-sm text-gray-300">Total de aves:</p>
                    <p className="text-2xl font-bold" style={{ color: '#22c55e' }}>
                      {parseInt(pedidoFormData.cantidadJavas) * parseInt(pedidoFormData.avesPorJava)} aves
                    </p>
                  </div>
                )}

                {/* Sexo (si aplica) */}
                {tipoAveSeleccionado?.tieneSexo && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2 text-white">Cantidad Machos</label>
                      <input
                        type="number"
                        min="0"
                        value={pedidoFormData.cantidadMachos}
                        onChange={(e) => {
                          const machos = e.target.value;
                          const totalAves = pedidoFormData.cantidadJavas && pedidoFormData.avesPorJava 
                            ? parseInt(pedidoFormData.cantidadJavas) * parseInt(pedidoFormData.avesPorJava) 
                            : 0;
                          
                          // Auto-rellenar hembras con el restante
                          const hembras = machos && totalAves > 0 
                            ? Math.max(0, totalAves - parseInt(machos)).toString() 
                            : '';
                          
                          setPedidoFormData({ 
                            ...pedidoFormData, 
                            cantidadMachos: machos,
                            cantidadHembras: hembras
                          });
                        }}
                        className="w-full px-4 py-3 rounded-lg text-white"
                        style={{
                          background: 'rgba(255, 255, 255, 0.05)',
                          border: '1px solid rgba(255, 255, 255, 0.1)'
                        }}
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2 text-white">Cantidad Hembras</label>
                      <input
                        type="number"
                        min="0"
                        value={pedidoFormData.cantidadHembras}
                        onChange={(e) => setPedidoFormData({ ...pedidoFormData, cantidadHembras: e.target.value })}
                        className="w-full px-4 py-3 rounded-lg text-white"
                        style={{
                          background: 'rgba(255, 255, 255, 0.05)',
                          border: '1px solid rgba(255, 255, 255, 0.1)'
                        }}
                        placeholder="0"
                      />
                    </div>
                  </div>
                )}

                {/* Fecha y Hora */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2 text-white">Fecha de Ingreso *</label>
                    <input
                      type="date"
                      required
                      value={pedidoFormData.fechaIngreso}
                      onChange={(e) => setPedidoFormData({ ...pedidoFormData, fechaIngreso: e.target.value })}
                      className="w-full px-4 py-3 rounded-lg text-white"
                      style={{
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid rgba(255, 255, 255, 0.1)'
                      }}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2 text-white">Hora de Ingreso *</label>
                    <input
                      type="time"
                      required
                      value={pedidoFormData.horaIngreso}
                      onChange={(e) => setPedidoFormData({ ...pedidoFormData, horaIngreso: e.target.value })}
                      className="w-full px-4 py-3 rounded-lg text-white"
                      style={{
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid rgba(255, 255, 255, 0.1)'
                      }}
                    />
                  </div>
                </div>

                {/* Botones */}
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={handleClosePedidoModal}
                    className="flex-1 px-6 py-3 rounded-lg font-bold transition-all hover:scale-105"
                    style={{
                      background: 'rgba(239, 68, 68, 0.2)',
                      border: '1px solid rgba(239, 68, 68, 0.3)',
                      color: '#ef4444'
                    }}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-6 py-3 rounded-lg font-bold transition-all hover:scale-105"
                    style={{
                      background: 'linear-gradient(to right, #0d4a24, #166534, #b8941e, #ccaa00)',
                      color: 'white'
                    }}
                  >
                    {editingPedido ? 'Actualizar Pedido' : 'Registrar Pedido'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}