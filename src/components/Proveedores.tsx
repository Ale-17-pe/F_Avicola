import { useState } from 'react';
import { Plus, Edit2, Trash2, Search, X, TrendingUp, Package, DollarSign } from 'lucide-react';

interface Proveedor {
  id: string;
  nombre: string;
  ruc: string;
  direccion: string;
  telefono: string;
}

export function Proveedores() {
  const [proveedores, setProveedores] = useState<Proveedor[]>([
    {
      id: '1',
      nombre: 'Distribuidora San Martín',
      ruc: '20123456789',
      direccion: 'Av. Principal 123, Lima',
      telefono: '987654321'
    },
    {
      id: '2',
      nombre: 'Avícola del Norte SAC',
      ruc: '20987654321',
      direccion: 'Jr. Los Andes 456, Trujillo',
      telefono: '945678912'
    }
  ]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProveedor, setEditingProveedor] = useState<Proveedor | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    nombre: '',
    ruc: '',
    direccion: '',
    telefono: ''
  });

  const filteredProveedores = proveedores.filter(p =>
    p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.ruc.includes(searchTerm) ||
    p.telefono.includes(searchTerm)
  );

  const handleOpenModal = (proveedor?: Proveedor) => {
    if (proveedor) {
      setEditingProveedor(proveedor);
      setFormData({
        nombre: proveedor.nombre,
        ruc: proveedor.ruc,
        direccion: proveedor.direccion,
        telefono: proveedor.telefono
      });
    } else {
      setEditingProveedor(null);
      setFormData({ nombre: '', ruc: '', direccion: '', telefono: '' });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingProveedor(null);
    setFormData({ nombre: '', ruc: '', direccion: '', telefono: '' });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingProveedor) {
      setProveedores(proveedores.map(p =>
        p.id === editingProveedor.id ? { ...p, ...formData } : p
      ));
    } else {
      const newProveedor: Proveedor = {
        id: Date.now().toString(),
        ...formData
      };
      setProveedores([...proveedores, newProveedor]);
    }
    
    handleCloseModal();
  };

  const handleDelete = (id: string) => {
    if (confirm('¿Está seguro de eliminar este proveedor?')) {
      setProveedores(proveedores.filter(p => p.id !== id));
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Proveedores</h1>
          <p className="text-gray-400">Gestión de proveedores de la avícola</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 px-6 py-3 rounded-lg font-bold transition-all hover:scale-105"
          style={{
            background: 'linear-gradient(to right, #0d4a24, #166534, #b8941e, #ccaa00)',
            color: '#ffffff'
          }}
        >
          <Plus className="w-5 h-5" />
          Nuevo Proveedor
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
            <TrendingUp className="w-5 h-5" style={{ color: '#22c55e' }} />
          </div>
          <p className="text-3xl font-bold text-white mb-1">{proveedores.length}</p>
          <p className="text-sm" style={{ color: '#22c55e' }}>Activos en el sistema</p>
        </div>

        <div className="backdrop-blur-xl rounded-xl p-6" style={{
          background: 'rgba(0, 0, 0, 0.3)',
          border: '1px solid rgba(204, 170, 0, 0.3)'
        }}>
          <div className="flex items-center justify-between mb-3">
            <p className="text-gray-400 text-sm font-medium">Total Aves Suministradas</p>
            <Package className="w-5 h-5" style={{ color: '#ccaa00' }} />
          </div>
          <p className="text-3xl font-bold text-white mb-1">7,548</p>
          <p className="text-sm" style={{ color: '#ccaa00' }}>En el último mes</p>
        </div>

        <div className="backdrop-blur-xl rounded-xl p-6" style={{
          background: 'rgba(0, 0, 0, 0.3)',
          border: '1px solid rgba(59, 130, 246, 0.3)'
        }}>
          <div className="flex items-center justify-between mb-3">
            <p className="text-gray-400 text-sm font-medium">Valor Total Compras</p>
            <DollarSign className="w-5 h-5" style={{ color: '#3b82f6' }} />
          </div>
          <p className="text-3xl font-bold text-white mb-1">S/ 264,150</p>
          <p className="text-sm" style={{ color: '#3b82f6' }}>En el último mes</p>
        </div>
      </div>

      {/* Lista de Proveedores con Buscador Integrado */}
      <div className="backdrop-blur-xl rounded-xl overflow-hidden" style={{
        background: 'rgba(0, 0, 0, 0.3)',
        border: '1px solid rgba(255, 255, 255, 0.1)'
      }}>
        {/* Buscador dentro del contenedor de la tabla */}
        <div className="p-4 border-b" style={{ borderColor: 'rgba(204, 170, 0, 0.2)' }}>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por nombre, RUC o teléfono..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 rounded-lg text-white placeholder-gray-400"
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)'
              }}
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
              <tr style={{ background: 'rgba(0, 0, 0, 0.4)', borderBottom: '1px solid rgba(204, 170, 0, 0.3)' }}>
                <th className="px-6 py-4 text-left font-bold" style={{ color: '#ccaa00' }}>Nombre</th>
                <th className="px-6 py-4 text-left font-bold" style={{ color: '#ccaa00' }}>RUC</th>
                <th className="px-6 py-4 text-left font-bold" style={{ color: '#ccaa00' }}>Dirección</th>
                <th className="px-6 py-4 text-left font-bold" style={{ color: '#ccaa00' }}>Teléfono</th>
                <th className="px-6 py-4 text-center font-bold" style={{ color: '#ccaa00' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredProveedores.map((proveedor) => (
                <tr 
                  key={proveedor.id}
                  className="border-b transition-colors hover:bg-white/5"
                  style={{ borderColor: 'rgba(255, 255, 255, 0.05)' }}
                >
                  <td className="px-6 py-4 text-white font-medium">{proveedor.nombre}</td>
                  <td className="px-6 py-4 text-gray-300">{proveedor.ruc}</td>
                  <td className="px-6 py-4 text-gray-300">{proveedor.direccion}</td>
                  <td className="px-6 py-4 text-gray-300">{proveedor.telefono}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => handleOpenModal(proveedor)}
                        className="p-2 rounded-lg transition-all hover:scale-110"
                        style={{
                          background: 'rgba(34, 197, 94, 0.2)',
                          border: '1px solid rgba(34, 197, 94, 0.3)'
                        }}
                      >
                        <Edit2 className="w-4 h-4" style={{ color: '#22c55e' }} />
                      </button>
                      <button
                        onClick={() => handleDelete(proveedor.id)}
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
              ))}
            </tbody>
          </table>
        </div>

        {filteredProveedores.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-400">No se encontraron proveedores</p>
          </div>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0, 0, 0, 0.8)' }}>
          <div 
            className="backdrop-blur-xl rounded-2xl w-full max-w-md p-6"
            style={{
              background: 'rgba(0, 0, 0, 0.6)',
              border: '1px solid rgba(204, 170, 0, 0.3)',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
            }}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">
                {editingProveedor ? 'Editar Proveedor' : 'Nuevo Proveedor'}
              </h2>
              <button
                onClick={handleCloseModal}
                className="p-2 rounded-lg transition-all hover:scale-110"
                style={{ background: 'rgba(255, 255, 255, 0.1)' }}
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: '#ccaa00' }}>
                  Nombre *
                </label>
                <input
                  type="text"
                  required
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg text-white placeholder-gray-400"
                  style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)'
                  }}
                  placeholder="Ingrese el nombre"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: '#ccaa00' }}>
                  RUC *
                </label>
                <input
                  type="text"
                  required
                  value={formData.ruc}
                  onChange={(e) => setFormData({ ...formData, ruc: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg text-white placeholder-gray-400"
                  style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)'
                  }}
                  placeholder="20123456789"
                  maxLength={11}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: '#ccaa00' }}>
                  Dirección *
                </label>
                <input
                  type="text"
                  required
                  value={formData.direccion}
                  onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg text-white placeholder-gray-400"
                  style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)'
                  }}
                  placeholder="Av. Principal 123"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: '#ccaa00' }}>
                  Teléfono *
                </label>
                <input
                  type="tel"
                  required
                  value={formData.telefono}
                  onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg text-white placeholder-gray-400"
                  style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)'
                  }}
                  placeholder="987654321"
                  maxLength={9}
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="flex-1 px-4 py-3 rounded-lg font-bold transition-all hover:scale-105"
                  style={{
                    background: 'rgba(255, 255, 255, 0.1)',
                    color: '#ffffff',
                    border: '1px solid rgba(255, 255, 255, 0.2)'
                  }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-3 rounded-lg font-bold transition-all hover:scale-105"
                  style={{
                    background: 'linear-gradient(to right, #0d4a24, #166534, #b8941e, #ccaa00)',
                    color: '#ffffff'
                  }}
                >
                  {editingProveedor ? 'Actualizar' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}