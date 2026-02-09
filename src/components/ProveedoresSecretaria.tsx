import { useState } from 'react';
import { Search, Phone, MapPin, FileText, Calendar } from 'lucide-react';

interface Proveedor {
  id: string;
  nombre: string;
  ruc: string;
  direccion: string;
  telefono: string;
  ultimoPedido?: string;
  pedidosPendientes?: number;
  contacto?: string;
}

export function ProveedoresSecretaria() {
  const [proveedores] = useState<Proveedor[]>([
    {
      id: '1',
      nombre: 'Distribuidora San Martín',
      ruc: '20123456789',
      direccion: 'Av. Principal 123, Lima',
      telefono: '987654321',
      ultimoPedido: '2025-02-01',
      pedidosPendientes: 2,
      contacto: 'Juan Pérez'
    },
    {
      id: '2',
      nombre: 'Avícola del Norte SAC',
      ruc: '20987654321',
      direccion: 'Jr. Los Andes 456, Trujillo',
      telefono: '945678912',
      ultimoPedido: '2025-01-28',
      pedidosPendientes: 1,
      contacto: 'María García'
    },
    {
      id: '3',
      nombre: 'Granja La Esperanza EIRL',
      ruc: '20456789123',
      direccion: 'Calle Las Flores 789, Chiclayo',
      telefono: '956123789',
      ultimoPedido: '2025-02-03',
      pedidosPendientes: 3,
      contacto: 'Carlos López'
    }
  ]);

  const [searchTerm, setSearchTerm] = useState('');

  const filteredProveedores = proveedores.filter(p =>
    p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.ruc.includes(searchTerm) ||
    p.telefono.includes(searchTerm) ||
    p.contacto?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = {
    totalProveedores: proveedores.length,
    pedidosPendientesTotal: proveedores.reduce((sum, p) => sum + (p.pedidosPendientes || 0), 0),
    proveedoresActivos: proveedores.filter(p => p.ultimoPedido && new Date(p.ultimoPedido) > new Date('2025-01-15')).length
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold text-white">Gestión de Proveedores</h1>
        <p className="text-gray-400">Información de proveedores y pedidos de abastecimiento</p>
      </div>

      {/* Métricas Clave */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-zinc-900 to-zinc-800 border border-zinc-700 rounded-xl p-6">
          <div className="flex items-center justify-between mb-3">
            <p className="text-gray-400 text-sm font-medium">Total Proveedores</p>
            <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: 'rgba(34, 197, 94, 0.2)' }}>
              <Phone className="w-5 h-5 text-green-400" />
            </div>
          </div>
          <p className="text-3xl font-bold text-white mb-1">{stats.totalProveedores}</p>
          <p className="text-sm text-green-400">Activos en el sistema</p>
        </div>

        <div className="bg-gradient-to-br from-zinc-900 to-zinc-800 border border-zinc-700 rounded-xl p-6">
          <div className="flex items-center justify-between mb-3">
            <p className="text-gray-400 text-sm font-medium">Pedidos Pendientes</p>
            <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: 'rgba(204, 170, 0, 0.2)' }}>
              <FileText className="w-5 h-5 text-amber-400" />
            </div>
          </div>
          <p className="text-3xl font-bold text-white mb-1">{stats.pedidosPendientesTotal}</p>
          <p className="text-sm text-amber-400">Por gestionar</p>
        </div>

        <div className="bg-gradient-to-br from-zinc-900 to-zinc-800 border border-zinc-700 rounded-xl p-6">
          <div className="flex items-center justify-between mb-3">
            <p className="text-gray-400 text-sm font-medium">Proveedores Activos</p>
            <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: 'rgba(59, 130, 246, 0.2)' }}>
              <Calendar className="w-5 h-5 text-blue-400" />
            </div>
          </div>
          <p className="text-3xl font-bold text-white mb-1">{stats.proveedoresActivos}</p>
          <p className="text-sm text-blue-400">En los últimos 20 días</p>
        </div>
      </div>

      {/* Lista de Proveedores */}
      <div className="bg-gradient-to-br from-zinc-900 to-zinc-800 border border-zinc-700 rounded-xl overflow-hidden">
        {/* Buscador */}
        <div className="p-4 border-b border-zinc-700">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por nombre, RUC, teléfono o contacto..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 rounded-lg bg-zinc-800 border border-zinc-700 text-white placeholder-gray-400 focus:outline-none focus:border-amber-500"
            />
          </div>
          {searchTerm && (
            <p className="text-sm text-gray-400 mt-2">
              {filteredProveedores.length} resultado{filteredProveedores.length !== 1 ? 's' : ''} encontrado{filteredProveedores.length !== 1 ? 's' : ''}
            </p>
          )}
        </div>

        {/* Tabla */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-zinc-900/50 border-b border-zinc-700">
                <th className="px-6 py-4 text-left font-bold text-amber-400">Nombre</th>
                <th className="px-6 py-4 text-left font-bold text-amber-400">RUC</th>
                <th className="px-6 py-4 text-left font-bold text-amber-400">Contacto</th>
                <th className="px-6 py-4 text-left font-bold text-amber-400">Teléfono</th>
                <th className="px-6 py-4 text-left font-bold text-amber-400">Dirección</th>
                <th className="px-6 py-4 text-center font-bold text-amber-400">Pedidos Pendientes</th>
                <th className="px-6 py-4 text-left font-bold text-amber-400">Último Pedido</th>
              </tr>
            </thead>
            <tbody>
              {filteredProveedores.map((proveedor) => (
                <tr
                  key={proveedor.id}
                  className="border-b border-zinc-800 transition-colors hover:bg-zinc-800/30"
                >
                  <td className="px-6 py-4 text-white font-medium">{proveedor.nombre}</td>
                  <td className="px-6 py-4 text-gray-300">{proveedor.ruc}</td>
                  <td className="px-6 py-4 text-gray-300">{proveedor.contacto || '-'}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-gray-300">
                      <Phone className="w-4 h-4 text-green-400" />
                      {proveedor.telefono}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-gray-300">
                      <MapPin className="w-4 h-4 text-blue-400" />
                      <span className="max-w-xs truncate">{proveedor.direccion}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    {proveedor.pedidosPendientes && proveedor.pedidosPendientes > 0 ? (
                      <span className="px-3 py-1 rounded-full text-xs font-medium bg-amber-500/20 text-amber-400 border border-amber-500/30">
                        {proveedor.pedidosPendientes} pendiente{proveedor.pedidosPendientes !== 1 ? 's' : ''}
                      </span>
                    ) : (
                      <span className="px-3 py-1 rounded-full text-xs font-medium bg-gray-500/20 text-gray-400 border border-gray-500/30">
                        Sin pendientes
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-gray-300">
                      <Calendar className="w-4 h-4 text-purple-400" />
                      {proveedor.ultimoPedido || '-'}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredProveedores.length === 0 && (
          <div className="text-center py-12">
            <Search className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400">No se encontraron proveedores</p>
          </div>
        )}
      </div>
    </div>
  );
}
