import { useState } from 'react';
import { Car, Plus, Edit2, Trash2, X, Save, Search, Calendar, Weight } from 'lucide-react';
import { useApp, Vehiculo } from '../contexts/AppContext';
import { useTheme, t } from '../contexts/ThemeContext';
import { toast } from 'sonner';

export function VehiculosSecretaria() {
  const { vehiculos, addVehiculo, updateVehiculo, deleteVehiculo } = useApp();
  const { isDark } = useTheme();
  const c = t(isDark);

  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVehiculo, setEditingVehiculo] = useState<Vehiculo | null>(null);
  const [form, setForm] = useState({ placa: '', marca: '', modelo: '', anio: '', capacidadKg: '', estado: 'Disponible' as Vehiculo['estado'] });

  const filtered = vehiculos.filter(v =>
    v.placa.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.marca.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.modelo.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleOpen = (vehiculo?: Vehiculo) => {
    if (vehiculo) {
      setEditingVehiculo(vehiculo);
      setForm({ placa: vehiculo.placa, marca: vehiculo.marca, modelo: vehiculo.modelo, anio: vehiculo.anio, capacidadKg: vehiculo.capacidadKg.toString(), estado: vehiculo.estado });
    } else {
      setEditingVehiculo(null);
      setForm({ placa: '', marca: '', modelo: '', anio: '', capacidadKg: '', estado: 'Disponible' });
    }
    setIsModalOpen(true);
  };

  const handleClose = () => {
    setIsModalOpen(false);
    setEditingVehiculo(null);
    setForm({ placa: '', marca: '', modelo: '', anio: '', capacidadKg: '', estado: 'Disponible' });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingVehiculo) {
      updateVehiculo({ ...editingVehiculo, ...form, capacidadKg: parseFloat(form.capacidadKg) || 0 });
      toast.success('Vehículo actualizado');
    } else {
      const nuevo: Vehiculo = {
        id: Date.now().toString(),
        placa: form.placa,
        marca: form.marca,
        modelo: form.modelo,
        anio: form.anio,
        capacidadKg: parseFloat(form.capacidadKg) || 0,
        estado: form.estado,
      };
      addVehiculo(nuevo);
      toast.success('Vehículo registrado');
    }
    handleClose();
  };

  const handleDelete = (id: string) => {
    if (confirm('¿Está seguro de eliminar este vehículo?')) {
      deleteVehiculo(id);
      toast.success('Vehículo eliminado');
    }
  };

  const estadoColor = (estado: string) => {
    switch (estado) {
      case 'Disponible': return { bg: 'rgba(34,197,94,0.15)', color: '#22c55e', border: 'rgba(34,197,94,0.3)' };
      case 'En Ruta': return { bg: 'rgba(59,130,246,0.15)', color: '#3b82f6', border: 'rgba(59,130,246,0.3)' };
      case 'Mantenimiento': return { bg: 'rgba(239,68,68,0.15)', color: '#ef4444', border: 'rgba(239,68,68,0.3)' };
      default: return { bg: c.g10, color: c.text, border: c.g20 };
    }
  };

  const totalVehiculos = vehiculos.length;
  const disponibles = vehiculos.filter(v => v.estado === 'Disponible').length;
  const enRuta = vehiculos.filter(v => v.estado === 'En Ruta').length;

  return (
    <div className="space-y-4 sm:space-y-6 p-2 sm:p-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold mb-1 sm:mb-2" style={{ color: c.text }}>Vehículos</h1>
          <p className="text-xs sm:text-sm" style={{ color: c.textSecondary }}>Gestión de flota vehicular</p>
        </div>
        <button
          onClick={() => handleOpen()}
          className="w-full sm:w-auto px-4 py-2.5 rounded-lg font-bold transition-all hover:scale-105 flex items-center justify-center gap-2"
          style={{
            background: 'linear-gradient(to right, #0d4a24, #166534, #b8941e, #ccaa00)',
            color: 'white',
            boxShadow: '0 4px 15px rgba(204, 170, 0, 0.4)'
          }}
        >
          <Plus className="w-4 h-4" />
          <span className="text-sm">Nuevo Vehículo</span>
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3 md:gap-4">
        <div className="backdrop-blur-xl rounded-xl p-3 sm:p-4 md:p-6" style={{ background: c.bgCard, border: '1px solid ' + c.g20 }}>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs sm:text-sm" style={{ color: c.textSecondary }}>Total</p>
            <Car className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: c.textSecondary }} />
          </div>
          <p className="text-lg sm:text-2xl md:text-3xl font-bold" style={{ color: c.text }}>{totalVehiculos}</p>
        </div>
        <div className="backdrop-blur-xl rounded-xl p-3 sm:p-4 md:p-6" style={{ background: c.bgCard, border: '1px solid rgba(34,197,94,0.3)' }}>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs sm:text-sm" style={{ color: c.textSecondary }}>Disponibles</p>
            <Car className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: '#22c55e' }} />
          </div>
          <p className="text-lg sm:text-2xl md:text-3xl font-bold" style={{ color: '#22c55e' }}>{disponibles}</p>
        </div>
        <div className="backdrop-blur-xl rounded-xl p-3 sm:p-4 md:p-6" style={{ background: c.bgCard, border: '1px solid rgba(59,130,246,0.3)' }}>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs sm:text-sm" style={{ color: c.textSecondary }}>En Ruta</p>
            <Car className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: '#3b82f6' }} />
          </div>
          <p className="text-lg sm:text-2xl md:text-3xl font-bold" style={{ color: '#3b82f6' }}>{enRuta}</p>
        </div>
      </div>

      {/* Búsqueda */}
      <div className="backdrop-blur-xl rounded-xl p-3" style={{ background: c.bgCard, border: '1px solid ' + c.border }}>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por placa, marca o modelo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-lg text-sm placeholder-gray-400"
            style={{ background: c.bgInput, border: '1px solid ' + c.border, color: c.text }}
          />
        </div>
      </div>

      {/* Tabla */}
      <div className="backdrop-blur-xl rounded-xl overflow-hidden" style={{ background: c.bgCard, border: '1px solid ' + c.border }}>
        {filtered.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: isDark ? 'rgba(204,170,0,0.08)' : 'rgba(204,170,0,0.05)', borderBottom: '1px solid ' + c.borderGold }}>
                  <th className="text-left px-4 py-3 font-bold text-xs uppercase tracking-wider" style={{ color: '#ccaa00' }}>Placa</th>
                  <th className="text-left px-4 py-3 font-bold text-xs uppercase tracking-wider" style={{ color: '#ccaa00' }}>Marca</th>
                  <th className="text-left px-4 py-3 font-bold text-xs uppercase tracking-wider" style={{ color: '#ccaa00' }}>Modelo</th>
                  <th className="text-left px-4 py-3 font-bold text-xs uppercase tracking-wider" style={{ color: '#ccaa00' }}>Año</th>
                  <th className="text-left px-4 py-3 font-bold text-xs uppercase tracking-wider" style={{ color: '#ccaa00' }}>Capacidad</th>
                  <th className="text-center px-4 py-3 font-bold text-xs uppercase tracking-wider" style={{ color: '#ccaa00' }}>Estado</th>
                  <th className="text-center px-4 py-3 font-bold text-xs uppercase tracking-wider" style={{ color: '#ccaa00' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((vehiculo, idx) => {
                  const ec = estadoColor(vehiculo.estado);
                  return (
                    <tr key={vehiculo.id} style={{ borderBottom: '1px solid ' + c.borderSubtle, background: idx % 2 === 0 ? 'transparent' : (isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)') }}>
                      <td className="px-4 py-3">
                        <span className="font-mono text-xs font-bold px-2 py-1 rounded" style={{ background: 'rgba(59,130,246,0.1)', color: '#3b82f6', border: '1px solid rgba(59,130,246,0.2)' }}>
                          {vehiculo.placa}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-medium" style={{ color: c.text }}>{vehiculo.marca}</td>
                      <td className="px-4 py-3" style={{ color: c.textSecondary }}>{vehiculo.modelo}</td>
                      <td className="px-4 py-3" style={{ color: c.textSecondary }}>
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {vehiculo.anio}
                        </div>
                      </td>
                      <td className="px-4 py-3" style={{ color: c.textSecondary }}>
                        <div className="flex items-center gap-1">
                          <Weight className="w-3 h-3" />
                          {vehiculo.capacidadKg} kg
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="px-2 py-1 rounded-full text-xs font-bold" style={{ background: ec.bg, color: ec.color, border: `1px solid ${ec.border}` }}>
                          {vehiculo.estado}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => handleOpen(vehiculo)}
                            className="p-1.5 rounded-lg transition-all hover:scale-110"
                            style={{ background: 'rgba(245,158,11,0.2)', border: '1px solid rgba(245,158,11,0.3)' }}
                            title="Editar"
                          >
                            <Edit2 className="w-3.5 h-3.5" style={{ color: '#f59e0b' }} />
                          </button>
                          <button
                            onClick={() => handleDelete(vehiculo.id)}
                            className="p-1.5 rounded-lg transition-all hover:scale-110"
                            style={{ background: 'rgba(239,68,68,0.2)', border: '1px solid rgba(239,68,68,0.3)' }}
                            title="Eliminar"
                          >
                            <Trash2 className="w-3.5 h-3.5" style={{ color: '#ef4444' }} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12">
            <Car className="w-16 h-16 mx-auto mb-4" style={{ color: c.textMuted }} />
            <p className="text-base" style={{ color: c.textSecondary }}>
              {searchTerm ? 'No se encontraron vehículos' : 'No hay vehículos registrados'}
            </p>
            <p className="text-sm mt-1" style={{ color: c.textMuted }}>
              {searchTerm ? 'Intente con otro término de búsqueda' : 'Agregue vehículos usando el botón "Nuevo Vehículo"'}
            </p>
          </div>
        )}
      </div>

      {/* Modal CRUD */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: c.bgModalOverlay }} onClick={handleClose}>
          <div
            className="backdrop-blur-2xl rounded-2xl w-full max-w-md p-6"
            style={{
              background: isDark
                ? 'linear-gradient(135deg, rgba(0,0,0,0.7) 0%, rgba(13,74,36,0.3) 50%, rgba(0,0,0,0.7) 100%)'
                : '#ffffff',
              border: '2px solid rgba(204,170,0,0.3)',
              boxShadow: c.shadowLg
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6 pb-4 border-b" style={{ borderColor: c.borderGold }}>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{
                  background: 'linear-gradient(135deg, #ccaa00, #b8941e)',
                  boxShadow: '0 10px 30px rgba(204,170,0,0.4)'
                }}>
                  <Car className="w-6 h-6 text-black" />
                </div>
                <div>
                  <h2 className="text-xl font-bold" style={{ color: c.text }}>{editingVehiculo ? 'Editar Vehículo' : 'Nuevo Vehículo'}</h2>
                  <p className="text-xs" style={{ color: c.textSecondary }}>Datos del vehículo</p>
                </div>
              </div>
              <button onClick={handleClose} className="p-2 rounded-xl transition-all hover:scale-110" style={{
                background: 'rgba(239,68,68,0.2)', border: '1px solid rgba(239,68,68,0.3)'
              }}>
                <X className="w-5 h-5" style={{ color: '#ef4444' }} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-bold mb-2" style={{ color: '#ccaa00' }}>Placa *</label>
                <input
                  type="text"
                  required
                  value={form.placa}
                  onChange={(e) => setForm({ ...form, placa: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-lg text-sm placeholder-gray-400"
                  style={{ background: c.g08, border: '1.5px solid rgba(204,170,0,0.3)', color: c.text }}
                  placeholder="Ej: ABC-123"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-bold mb-2" style={{ color: '#ccaa00' }}>Marca *</label>
                  <input
                    type="text"
                    required
                    value={form.marca}
                    onChange={(e) => setForm({ ...form, marca: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-lg text-sm placeholder-gray-400"
                    style={{ background: c.g08, border: '1.5px solid rgba(204,170,0,0.3)', color: c.text }}
                    placeholder="Ej: Toyota"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold mb-2" style={{ color: '#ccaa00' }}>Modelo *</label>
                  <input
                    type="text"
                    required
                    value={form.modelo}
                    onChange={(e) => setForm({ ...form, modelo: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-lg text-sm placeholder-gray-400"
                    style={{ background: c.g08, border: '1.5px solid rgba(204,170,0,0.3)', color: c.text }}
                    placeholder="Ej: Hilux"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-bold mb-2" style={{ color: '#ccaa00' }}>Año</label>
                  <input
                    type="text"
                    value={form.anio}
                    onChange={(e) => setForm({ ...form, anio: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-lg text-sm placeholder-gray-400"
                    style={{ background: c.g08, border: '1.5px solid rgba(204,170,0,0.3)', color: c.text }}
                    placeholder="Ej: 2022"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold mb-2" style={{ color: '#ccaa00' }}>Capacidad (kg)</label>
                  <input
                    type="number"
                    value={form.capacidadKg}
                    onChange={(e) => setForm({ ...form, capacidadKg: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-lg text-sm placeholder-gray-400"
                    style={{ background: c.g08, border: '1.5px solid rgba(204,170,0,0.3)', color: c.text }}
                    placeholder="Ej: 3000"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold mb-2" style={{ color: '#ccaa00' }}>Estado</label>
                <select
                  value={form.estado}
                  onChange={(e) => setForm({ ...form, estado: e.target.value as Vehiculo['estado'] })}
                  className="w-full px-4 py-2.5 rounded-lg text-sm appearance-none"
                  style={{ background: c.g08, border: '1.5px solid rgba(204,170,0,0.3)', color: c.text }}
                >
                  <option value="Disponible">Disponible</option>
                  <option value="En Ruta">En Ruta</option>
                  <option value="Mantenimiento">Mantenimiento</option>
                </select>
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={handleClose}
                  className="flex-1 px-4 py-2.5 rounded-lg font-bold transition-all hover:scale-105 text-sm"
                  style={{ background: c.g10, border: '1px solid ' + c.g20, color: c.text }}
                >Cancelar</button>
                <button type="submit"
                  className="flex-1 px-4 py-2.5 rounded-lg font-bold transition-all hover:scale-105 text-sm flex items-center justify-center gap-2"
                  style={{
                    background: 'linear-gradient(to right, #0d4a24, #166534, #b8941e, #ccaa00)',
                    color: 'white',
                    boxShadow: '0 4px 15px rgba(204,170,0,0.4)'
                  }}
                >
                  <Save className="w-4 h-4" />
                  {editingVehiculo ? 'Actualizar' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
