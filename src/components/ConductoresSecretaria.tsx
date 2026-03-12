import { useState } from 'react';
import { User, Plus, Edit2, Trash2, X, Save, Search, Phone, CreditCard, Truck, KeyRound } from 'lucide-react';
import { useApp, ConductorRegistrado } from '../contexts/AppContext';
import { useTheme, t } from '../contexts/ThemeContext';
import { toast } from 'sonner';

export function ConductoresSecretaria() {
  const { conductoresRegistrados, addConductorRegistrado, updateConductorRegistrado, deleteConductorRegistrado } = useApp();
  const { isDark } = useTheme();
  const c = t(isDark);

  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingConductor, setEditingConductor] = useState<ConductorRegistrado | null>(null);
  const [form, setForm] = useState({ nombre: '', placa: '', telefono: '', licencia: '', usuario: '', clave: '' });

  const filtered = conductoresRegistrados.filter(cd =>
    cd.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cd.placa.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cd.licencia.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cd.usuario.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleOpen = (conductor?: ConductorRegistrado) => {
    if (conductor) {
      setEditingConductor(conductor);
      setForm({ nombre: conductor.nombre, placa: conductor.placa, telefono: conductor.telefono, licencia: conductor.licencia, usuario: conductor.usuario, clave: conductor.clave });
    } else {
      setEditingConductor(null);
      setForm({ nombre: '', placa: '', telefono: '', licencia: '', usuario: '', clave: '' });
    }
    setIsModalOpen(true);
  };

  const handleClose = () => {
    setIsModalOpen(false);
    setEditingConductor(null);
    setForm({ nombre: '', placa: '', telefono: '', licencia: '', usuario: '', clave: '' });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Validar usuario único
    const usuarioExistente = conductoresRegistrados.find(
      cd => cd.usuario.toLowerCase() === form.usuario.toLowerCase() && cd.id !== editingConductor?.id
    );
    if (usuarioExistente) {
      toast.error('Ya existe un conductor con ese nombre de usuario');
      return;
    }
    if (editingConductor) {
      updateConductorRegistrado({ ...editingConductor, ...form });
      toast.success('Conductor actualizado');
    } else {
      const nuevo: ConductorRegistrado = {
        id: Date.now().toString(),
        nombre: form.nombre,
        placa: form.placa,
        telefono: form.telefono,
        licencia: form.licencia,
        usuario: form.usuario,
        clave: form.clave,
        estado: 'Esperando',
      };
      addConductorRegistrado(nuevo);
      toast.success('Conductor registrado');
    }
    handleClose();
  };

  const handleDelete = (id: string) => {
    if (confirm('¿Está seguro de eliminar este conductor?')) {
      deleteConductorRegistrado(id);
      toast.success('Conductor eliminado');
    }
  };

  const toggleEstado = (conductor: ConductorRegistrado) => {
    const nuevoEstado = conductor.estado === 'Esperando' ? 'Conduciendo' : 'Esperando';
    updateConductorRegistrado({ ...conductor, estado: nuevoEstado });
    toast.success(`${conductor.nombre} ahora está ${nuevoEstado}`);
  };

  const totalConductores = conductoresRegistrados.length;
  const conduciendo = conductoresRegistrados.filter(c => c.estado === 'Conduciendo').length;
  const esperando = conductoresRegistrados.filter(c => c.estado === 'Esperando').length;

  return (
    <div className="space-y-4 sm:space-y-6 p-2 sm:p-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold mb-1 sm:mb-2" style={{ color: c.text }}>Conductores</h1>
          <p className="text-xs sm:text-sm" style={{ color: c.textSecondary }}>Gestión y control de conductores</p>
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
          <span className="text-sm">Nuevo Conductor</span>
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3 md:gap-4">
        <div className="backdrop-blur-xl rounded-xl p-3 sm:p-4 md:p-6" style={{ background: c.bgCard, border: '1px solid ' + c.g20 }}>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs sm:text-sm" style={{ color: c.textSecondary }}>Total</p>
            <User className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: c.textSecondary }} />
          </div>
          <p className="text-lg sm:text-2xl md:text-3xl font-bold" style={{ color: c.text }}>{totalConductores}</p>
        </div>
        <div className="backdrop-blur-xl rounded-xl p-3 sm:p-4 md:p-6" style={{ background: c.bgCard, border: '1px solid rgba(34,197,94,0.3)' }}>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs sm:text-sm" style={{ color: c.textSecondary }}>Conduciendo</p>
            <Truck className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: '#22c55e' }} />
          </div>
          <p className="text-lg sm:text-2xl md:text-3xl font-bold" style={{ color: '#22c55e' }}>{conduciendo}</p>
        </div>
        <div className="backdrop-blur-xl rounded-xl p-3 sm:p-4 md:p-6" style={{ background: c.bgCard, border: '1px solid rgba(245,158,11,0.3)' }}>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs sm:text-sm" style={{ color: c.textSecondary }}>Esperando</p>
            <User className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: '#f59e0b' }} />
          </div>
          <p className="text-lg sm:text-2xl md:text-3xl font-bold" style={{ color: '#f59e0b' }}>{esperando}</p>
        </div>
      </div>

      {/* Búsqueda */}
      <div className="backdrop-blur-xl rounded-xl p-3" style={{ background: c.bgCard, border: '1px solid ' + c.border }}>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar conductor por nombre, placa o licencia..."
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
                  <th className="text-left px-4 py-3 font-bold text-xs uppercase tracking-wider" style={{ color: '#ccaa00' }}>ID</th>
                  <th className="text-left px-4 py-3 font-bold text-xs uppercase tracking-wider" style={{ color: '#ccaa00' }}>Nombre</th>
                  <th className="text-left px-4 py-3 font-bold text-xs uppercase tracking-wider" style={{ color: '#ccaa00' }}>Placa</th>
                  <th className="text-left px-4 py-3 font-bold text-xs uppercase tracking-wider" style={{ color: '#ccaa00' }}>Teléfono</th>
                  <th className="text-left px-4 py-3 font-bold text-xs uppercase tracking-wider" style={{ color: '#ccaa00' }}>Licencia</th>
                  <th className="text-left px-4 py-3 font-bold text-xs uppercase tracking-wider" style={{ color: '#ccaa00' }}>Usuario</th>
                  <th className="text-center px-4 py-3 font-bold text-xs uppercase tracking-wider" style={{ color: '#ccaa00' }}>Estado</th>
                  <th className="text-center px-4 py-3 font-bold text-xs uppercase tracking-wider" style={{ color: '#ccaa00' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((conductor, idx) => (
                  <tr key={conductor.id} style={{ borderBottom: '1px solid ' + c.borderSubtle, background: idx % 2 === 0 ? 'transparent' : (isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)') }}>
                    <td className="px-4 py-3">
                      <span className="text-xs font-mono px-2 py-1 rounded" style={{ background: c.g10, color: c.textSecondary }}>
                        #{conductor.id.slice(-4)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: 'linear-gradient(135deg, #22c55e, #166534)' }}>
                          <User className="w-4 h-4 text-white" />
                        </div>
                        <span className="font-medium" style={{ color: c.text }}>{conductor.nombre}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs px-2 py-1 rounded" style={{ background: 'rgba(59,130,246,0.1)', color: '#3b82f6', border: '1px solid rgba(59,130,246,0.2)' }}>
                        {conductor.placa}
                      </span>
                    </td>
                    <td className="px-4 py-3" style={{ color: c.textSecondary }}>
                      <div className="flex items-center gap-1">
                        <Phone className="w-3 h-3" />
                        {conductor.telefono}
                      </div>
                    </td>
                    <td className="px-4 py-3" style={{ color: c.textSecondary }}>
                      <div className="flex items-center gap-1">
                        <CreditCard className="w-3 h-3" />
                        {conductor.licencia}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs px-2 py-1 rounded" style={{ background: 'rgba(168,85,247,0.1)', color: '#a855f7', border: '1px solid rgba(168,85,247,0.2)' }}>
                        {conductor.usuario}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => toggleEstado(conductor)}
                        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold transition-all hover:scale-105 cursor-pointer"
                        style={{
                          background: conductor.estado === 'Conduciendo' ? 'rgba(34,197,94,0.15)' : 'rgba(245,158,11,0.15)',
                          color: conductor.estado === 'Conduciendo' ? '#22c55e' : '#f59e0b',
                          border: `1px solid ${conductor.estado === 'Conduciendo' ? 'rgba(34,197,94,0.3)' : 'rgba(245,158,11,0.3)'}`,
                        }}
                      >
                        <div
                          className="relative w-8 h-4 rounded-full transition-all"
                          style={{ background: conductor.estado === 'Conduciendo' ? 'rgba(34,197,94,0.4)' : 'rgba(245,158,11,0.4)' }}
                        >
                          <div
                            className="absolute top-0.5 w-3 h-3 rounded-full transition-all"
                            style={{
                              background: conductor.estado === 'Conduciendo' ? '#22c55e' : '#f59e0b',
                              left: conductor.estado === 'Conduciendo' ? '18px' : '2px',
                            }}
                          />
                        </div>
                        {conductor.estado}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => handleOpen(conductor)}
                          className="p-1.5 rounded-lg transition-all hover:scale-110"
                          style={{ background: 'rgba(245,158,11,0.2)', border: '1px solid rgba(245,158,11,0.3)' }}
                          title="Editar"
                        >
                          <Edit2 className="w-3.5 h-3.5" style={{ color: '#f59e0b' }} />
                        </button>
                        <button
                          onClick={() => handleDelete(conductor.id)}
                          className="p-1.5 rounded-lg transition-all hover:scale-110"
                          style={{ background: 'rgba(239,68,68,0.2)', border: '1px solid rgba(239,68,68,0.3)' }}
                          title="Eliminar"
                        >
                          <Trash2 className="w-3.5 h-3.5" style={{ color: '#ef4444' }} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12">
            <User className="w-16 h-16 mx-auto mb-4" style={{ color: c.textMuted }} />
            <p className="text-base" style={{ color: c.textSecondary }}>
              {searchTerm ? 'No se encontraron conductores' : 'No hay conductores registrados'}
            </p>
            <p className="text-sm mt-1" style={{ color: c.textMuted }}>
              {searchTerm ? 'Intente con otro término de búsqueda' : 'Agregue conductores usando el botón "Nuevo Conductor"'}
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
                  <User className="w-6 h-6 text-black" />
                </div>
                <div>
                  <h2 className="text-xl font-bold" style={{ color: c.text }}>{editingConductor ? 'Editar Conductor' : 'Nuevo Conductor'}</h2>
                  <p className="text-xs" style={{ color: c.textSecondary }}>Datos del conductor</p>
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
                <label className="block text-sm font-bold mb-2" style={{ color: '#ccaa00' }}>Nombre Completo *</label>
                <input
                  type="text"
                  required
                  value={form.nombre}
                  onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-lg text-sm placeholder-gray-400"
                  style={{ background: c.g08, border: '1.5px solid rgba(204,170,0,0.3)', color: c.text }}
                  placeholder="Ej: Juan Pérez"
                />
              </div>
              <div>
                <label className="block text-sm font-bold mb-2" style={{ color: '#ccaa00' }}>Placa del Vehículo *</label>
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
              <div>
                <label className="block text-sm font-bold mb-2" style={{ color: '#ccaa00' }}>Teléfono *</label>
                <input
                  type="text"
                  required
                  value={form.telefono}
                  onChange={(e) => setForm({ ...form, telefono: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-lg text-sm placeholder-gray-400"
                  style={{ background: c.g08, border: '1.5px solid rgba(204,170,0,0.3)', color: c.text }}
                  placeholder="Ej: 999 888 777"
                />
              </div>
              <div>
                <label className="block text-sm font-bold mb-2" style={{ color: '#ccaa00' }}>Nro. de Licencia *</label>
                <input
                  type="text"
                  required
                  value={form.licencia}
                  onChange={(e) => setForm({ ...form, licencia: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-lg text-sm placeholder-gray-400"
                  style={{ background: c.g08, border: '1.5px solid rgba(204,170,0,0.3)', color: c.text }}
                  placeholder="Ej: Q12345678"
                />
              </div>
              <div className="pt-2 border-t" style={{ borderColor: c.borderGold }}>
                <div className="flex items-center gap-2 mb-3">
                  <KeyRound className="w-4 h-4" style={{ color: '#a855f7' }} />
                  <span className="text-sm font-bold" style={{ color: '#a855f7' }}>Credenciales de Acceso</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-bold mb-2" style={{ color: '#ccaa00' }}>Usuario *</label>
                    <input
                      type="text"
                      required
                      value={form.usuario}
                      onChange={(e) => setForm({ ...form, usuario: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-lg text-sm placeholder-gray-400"
                      style={{ background: c.g08, border: '1.5px solid rgba(168,85,247,0.3)', color: c.text }}
                      placeholder="Ej: jperez"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold mb-2" style={{ color: '#ccaa00' }}>Contraseña *</label>
                    <input
                      type="text"
                      required
                      value={form.clave}
                      onChange={(e) => setForm({ ...form, clave: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-lg text-sm placeholder-gray-400"
                      style={{ background: c.g08, border: '1.5px solid rgba(168,85,247,0.3)', color: c.text }}
                      placeholder="Ej: conductor123"
                    />
                  </div>
                </div>
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
                  {editingConductor ? 'Actualizar' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
