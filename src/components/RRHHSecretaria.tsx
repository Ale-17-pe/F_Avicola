import { useMemo, useState } from 'react';
import { Briefcase, Plus, Edit2, Trash2, X, Save, Search, KeyRound, User, Shield } from 'lucide-react';
import { toast } from 'sonner';
import { useApp, Empleado } from '../contexts/AppContext';
import { useAuth } from '../contexts/AuthContext';
import { useTheme, t } from '../contexts/ThemeContext';

type RolSistema = 'secretaria' | 'operador' | 'cobranza' | 'seguridad' | 'conductor';

const ROLES: { value: RolSistema; label: string; cargo: Empleado['cargo'] }[] = [
  { value: 'secretaria', label: 'Secretaria', cargo: 'Secretaria' },
  { value: 'operador', label: 'Operador', cargo: 'Operadora' },
  { value: 'cobranza', label: 'Cobranza', cargo: 'Cobranza' },
  { value: 'seguridad', label: 'Seguridad', cargo: 'Seguridad' },
  { value: 'conductor', label: 'Conductor', cargo: 'Conductor' },
];

export function RRHHSecretaria() {
  const { user } = useAuth();
  const {
    empleados,
    addEmpleado,
    updateEmpleado,
    deleteEmpleado,
    conductoresRegistrados,
    addConductorRegistrado,
    updateConductorRegistrado,
    deleteConductorRegistrado,
  } = useApp();
  const { isDark } = useTheme();
  const c = t(isDark);

  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEmpleado, setEditingEmpleado] = useState<Empleado | null>(null);
  const [form, setForm] = useState({
    nombre: '',
    apellidos: '',
    dni: '',
    telefono: '',
    direccion: '',
    usuario: '',
    clave: '',
    licencia: '',
    rolSistema: 'secretaria' as RolSistema,
    estado: 'Activo' as Empleado['estado'],
  });

  const esSuperSecretaria = user?.rol === 'super-secretaria';

  const colaboradores = useMemo(
    () => empleados.filter(e => !!e.usuario && !!e.clave && !!e.rolSistema),
    [empleados]
  );

  const filtered = colaboradores.filter((e) =>
    [e.nombre, e.apellidos, e.usuario || '', e.rolSistema || '']
      .join(' ')
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  );

  const total = colaboradores.length;
  const activos = colaboradores.filter(e => e.estado === 'Activo').length;
  const secretarias = colaboradores.filter(e => e.rolSistema === 'secretaria').length;
  const operadores = colaboradores.filter(e => e.rolSistema === 'operador').length;

  const handleOpen = (empleado?: Empleado) => {
    if (empleado) {
      setEditingEmpleado(empleado);
      setForm({
        nombre: empleado.nombre,
        apellidos: empleado.apellidos,
        dni: empleado.dni,
        telefono: empleado.telefono,
        direccion: empleado.direccion,
        usuario: empleado.usuario || '',
        clave: empleado.clave || '',
        licencia: empleado.licencia || '',
        rolSistema: (empleado.rolSistema || 'secretaria') as RolSistema,
        estado: empleado.estado,
      });
    } else {
      setEditingEmpleado(null);
      setForm({
        nombre: '',
        apellidos: '',
        dni: '',
        telefono: '',
        direccion: '',
        usuario: '',
        clave: '',
        licencia: '',
        rolSistema: 'secretaria',
        estado: 'Activo',
      });
    }
    setIsModalOpen(true);
  };

  const handleClose = () => {
    setIsModalOpen(false);
    setEditingEmpleado(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!esSuperSecretaria) {
      toast.error('Solo la super-secretaria puede gestionar RRHH');
      return;
    }

    const usuarioEnUso = empleados.find(
      emp =>
        emp.usuario?.toLowerCase() === form.usuario.toLowerCase() &&
        emp.id !== editingEmpleado?.id
    );

    if (usuarioEnUso) {
      toast.error('Ese nombre de usuario ya está registrado');
      return;
    }

    const rolInfo = ROLES.find(r => r.value === form.rolSistema);
    if (!rolInfo) {
      toast.error('Rol inválido');
      return;
    }

    if (editingEmpleado) {
      const eraConductor = editingEmpleado.rolSistema === 'conductor';
      const ahoraConductor = form.rolSistema === 'conductor';

      updateEmpleado({
        ...editingEmpleado,
        ...form,
        cargo: rolInfo.cargo,
        fechaContratacion: editingEmpleado.fechaContratacion,
        salario: editingEmpleado.salario,
      });

      if (ahoraConductor) {
        const existente = conductoresRegistrados.find(c => c.id === editingEmpleado.id);
        const dataConductor = {
          id: editingEmpleado.id,
          nombre: `${form.nombre} ${form.apellidos}`.trim(),
          telefono: form.telefono,
          licencia: form.licencia,
          usuario: form.usuario,
          clave: form.clave,
          estado: existente?.estado || 'Esperando' as const,
        };
        if (existente) {
          updateConductorRegistrado(dataConductor);
        } else {
          addConductorRegistrado(dataConductor);
        }
      } else if (eraConductor && !ahoraConductor) {
        deleteConductorRegistrado(editingEmpleado.id);
      }

      toast.success('Trabajador actualizado');
    } else {
      const nuevo: Empleado = {
        id: Date.now().toString(),
        nombre: form.nombre,
        apellidos: form.apellidos,
        dni: form.dni,
        telefono: form.telefono,
        direccion: form.direccion,
        cargo: rolInfo.cargo,
        fechaContratacion: new Date().toISOString().slice(0, 10),
        salario: 0,
        estado: form.estado,
        usuario: form.usuario,
        clave: form.clave,
        licencia: form.licencia,
        rolSistema: form.rolSistema,
      };
      addEmpleado(nuevo);

      if (form.rolSistema === 'conductor') {
        addConductorRegistrado({
          id: nuevo.id,
          nombre: `${form.nombre} ${form.apellidos}`.trim(),
          telefono: form.telefono,
          licencia: form.licencia,
          usuario: form.usuario,
          clave: form.clave,
          estado: 'Esperando',
        });
      }

      toast.success('Trabajador registrado');
    }

    handleClose();
  };

  const handleDelete = (id: string) => {
    if (!esSuperSecretaria) {
      toast.error('Solo la super-secretaria puede gestionar RRHH');
      return;
    }
    if (confirm('¿Eliminar este trabajador?')) {
      deleteEmpleado(id);
      deleteConductorRegistrado(id);
      toast.success('Trabajador eliminado');
    }
  };

  if (!esSuperSecretaria) {
    return (
      <div className="space-y-4 sm:space-y-6 p-2 sm:p-4">
        <div className="backdrop-blur-xl rounded-xl p-6 text-center" style={{ background: c.bgCard, border: '1px solid ' + c.border }}>
          <Shield className="w-12 h-12 mx-auto mb-3" style={{ color: '#f59e0b' }} />
          <h2 className="text-xl font-bold mb-2" style={{ color: c.text }}>Acceso Restringido</h2>
          <p style={{ color: c.textSecondary }}>
            Este módulo de RRHH solo está disponible para la super-secretaria.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 p-2 sm:p-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold mb-1 sm:mb-2" style={{ color: c.text }}>RRHH</h1>
          <p className="text-xs sm:text-sm" style={{ color: c.textSecondary }}>
            Gestión de trabajadores, credenciales y roles del sistema
          </p>
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
          <span className="text-sm">Nuevo Trabajador</span>
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 md:gap-4">
        <div className="backdrop-blur-xl rounded-xl p-3 sm:p-4 md:p-6" style={{ background: c.bgCard, border: '1px solid ' + c.g20 }}>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs sm:text-sm" style={{ color: c.textSecondary }}>Total</p>
            <Briefcase className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: c.textSecondary }} />
          </div>
          <p className="text-lg sm:text-2xl md:text-3xl font-bold" style={{ color: c.text }}>{total}</p>
        </div>
        <div className="backdrop-blur-xl rounded-xl p-3 sm:p-4 md:p-6" style={{ background: c.bgCard, border: '1px solid rgba(34,197,94,0.3)' }}>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs sm:text-sm" style={{ color: c.textSecondary }}>Activos</p>
            <User className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: '#22c55e' }} />
          </div>
          <p className="text-lg sm:text-2xl md:text-3xl font-bold" style={{ color: '#22c55e' }}>{activos}</p>
        </div>
        <div className="backdrop-blur-xl rounded-xl p-3 sm:p-4 md:p-6" style={{ background: c.bgCard, border: '1px solid rgba(59,130,246,0.3)' }}>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs sm:text-sm" style={{ color: c.textSecondary }}>Secretarias</p>
            <User className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: '#3b82f6' }} />
          </div>
          <p className="text-lg sm:text-2xl md:text-3xl font-bold" style={{ color: '#3b82f6' }}>{secretarias}</p>
        </div>
        <div className="backdrop-blur-xl rounded-xl p-3 sm:p-4 md:p-6" style={{ background: c.bgCard, border: '1px solid rgba(245,158,11,0.3)' }}>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs sm:text-sm" style={{ color: c.textSecondary }}>Operadores</p>
            <User className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: '#f59e0b' }} />
          </div>
          <p className="text-lg sm:text-2xl md:text-3xl font-bold" style={{ color: '#f59e0b' }}>{operadores}</p>
        </div>
      </div>

      <div className="backdrop-blur-xl rounded-xl p-3" style={{ background: c.bgCard, border: '1px solid ' + c.border }}>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por nombre, usuario o rol..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-lg text-sm placeholder-gray-400"
            style={{ background: c.bgInput, border: '1px solid ' + c.border, color: c.text }}
          />
        </div>
      </div>

      <div className="backdrop-blur-xl rounded-xl overflow-hidden" style={{ background: c.bgCard, border: '1px solid ' + c.border }}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: isDark ? 'rgba(204,170,0,0.08)' : 'rgba(204,170,0,0.05)', borderBottom: '1px solid ' + c.borderGold }}>
                <th className="text-left px-4 py-3 font-bold text-xs uppercase tracking-wider" style={{ color: '#ccaa00' }}>Nombre</th>
                <th className="text-left px-4 py-3 font-bold text-xs uppercase tracking-wider" style={{ color: '#ccaa00' }}>Usuario</th>
                <th className="text-left px-4 py-3 font-bold text-xs uppercase tracking-wider" style={{ color: '#ccaa00' }}>Rol</th>
                <th className="text-center px-4 py-3 font-bold text-xs uppercase tracking-wider" style={{ color: '#ccaa00' }}>Estado</th>
                <th className="text-center px-4 py-3 font-bold text-xs uppercase tracking-wider" style={{ color: '#ccaa00' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((empleado, idx) => (
                <tr key={empleado.id} style={{ borderBottom: '1px solid ' + c.borderSubtle, background: idx % 2 === 0 ? 'transparent' : (isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)') }}>
                  <td className="px-4 py-3" style={{ color: c.text }}>
                    {empleado.nombre} {empleado.apellidos}
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-mono text-xs px-2 py-1 rounded" style={{ background: 'rgba(168,85,247,0.1)', color: '#a855f7', border: '1px solid rgba(168,85,247,0.2)' }}>
                      {empleado.usuario}
                    </span>
                  </td>
                  <td className="px-4 py-3" style={{ color: c.textSecondary }}>
                    {ROLES.find(r => r.value === empleado.rolSistema)?.label || empleado.rolSistema}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="px-2 py-1 rounded-full text-xs font-bold" style={{
                      background: empleado.estado === 'Activo' ? 'rgba(34,197,94,0.15)' : 'rgba(245,158,11,0.15)',
                      color: empleado.estado === 'Activo' ? '#22c55e' : '#f59e0b',
                      border: `1px solid ${empleado.estado === 'Activo' ? 'rgba(34,197,94,0.3)' : 'rgba(245,158,11,0.3)'}`,
                    }}>
                      {empleado.estado}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => handleOpen(empleado)}
                        className="p-1.5 rounded-lg transition-all hover:scale-110"
                        style={{ background: 'rgba(245,158,11,0.2)', border: '1px solid rgba(245,158,11,0.3)' }}
                        title="Editar"
                      >
                        <Edit2 className="w-3.5 h-3.5" style={{ color: '#f59e0b' }} />
                      </button>
                      <button
                        onClick={() => handleDelete(empleado.id)}
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
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: c.bgModalOverlay }} onClick={handleClose}>
          <div
            className="backdrop-blur-2xl rounded-2xl w-full max-w-lg p-6"
            style={{
              background: isDark
                ? 'linear-gradient(135deg, rgba(0,0,0,0.7) 0%, rgba(13,74,36,0.3) 50%, rgba(0,0,0,0.7) 100%)'
                : '#ffffff',
              border: '2px solid rgba(204,170,0,0.3)',
              boxShadow: c.shadowLg,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6 pb-4 border-b" style={{ borderColor: c.borderGold }}>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{
                  background: 'linear-gradient(135deg, #ccaa00, #b8941e)',
                  boxShadow: '0 10px 30px rgba(204,170,0,0.4)'
                }}>
                  <KeyRound className="w-6 h-6 text-black" />
                </div>
                <div>
                  <h2 className="text-xl font-bold" style={{ color: c.text }}>
                    {editingEmpleado ? 'Editar Trabajador' : 'Nuevo Trabajador'}
                  </h2>
                  <p className="text-xs" style={{ color: c.textSecondary }}>Credenciales del sistema</p>
                </div>
              </div>
              <button onClick={handleClose} className="p-2 rounded-xl transition-all hover:scale-110" style={{
                background: 'rgba(239,68,68,0.2)', border: '1px solid rgba(239,68,68,0.3)'
              }}>
                <X className="w-5 h-5" style={{ color: '#ef4444' }} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-bold mb-2" style={{ color: '#ccaa00' }}>Nombre *</label>
                  <input
                    type="text"
                    required
                    value={form.nombre}
                    onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-lg text-sm placeholder-gray-400"
                    style={{ background: c.g08, border: '1.5px solid rgba(204,170,0,0.3)', color: c.text }}
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold mb-2" style={{ color: '#ccaa00' }}>Apellidos *</label>
                  <input
                    type="text"
                    required
                    value={form.apellidos}
                    onChange={(e) => setForm({ ...form, apellidos: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-lg text-sm placeholder-gray-400"
                    style={{ background: c.g08, border: '1.5px solid rgba(204,170,0,0.3)', color: c.text }}
                  />
                </div>
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
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-bold mb-2" style={{ color: '#ccaa00' }}>Rol *</label>
                  <select
                    required
                    value={form.rolSistema}
                    onChange={(e) => setForm({ ...form, rolSistema: e.target.value as RolSistema })}
                    className="w-full px-4 py-2.5 rounded-lg text-sm appearance-none"
                    style={{ background: c.g08, border: '1.5px solid rgba(204,170,0,0.3)', color: c.text }}
                  >
                    {ROLES.map((r) => (
                      <option key={r.value} value={r.value}>{r.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold mb-2" style={{ color: '#ccaa00' }}>Estado *</label>
                  <select
                    required
                    value={form.estado}
                    onChange={(e) => setForm({ ...form, estado: e.target.value as Empleado['estado'] })}
                    className="w-full px-4 py-2.5 rounded-lg text-sm appearance-none"
                    style={{ background: c.g08, border: '1.5px solid rgba(204,170,0,0.3)', color: c.text }}
                  >
                    <option value="Activo">Activo</option>
                    <option value="Descanso">Descanso</option>
                  </select>
                </div>
              </div>

              {form.rolSistema === 'conductor' && (
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
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-bold mb-2" style={{ color: '#ccaa00' }}>DNI</label>
                  <input
                    type="text"
                    value={form.dni}
                    onChange={(e) => setForm({ ...form, dni: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-lg text-sm placeholder-gray-400"
                    style={{ background: c.g08, border: '1.5px solid rgba(204,170,0,0.3)', color: c.text }}
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold mb-2" style={{ color: '#ccaa00' }}>Teléfono</label>
                  <input
                    type="text"
                    value={form.telefono}
                    onChange={(e) => setForm({ ...form, telefono: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-lg text-sm placeholder-gray-400"
                    style={{ background: c.g08, border: '1.5px solid rgba(204,170,0,0.3)', color: c.text }}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold mb-2" style={{ color: '#ccaa00' }}>Dirección</label>
                <input
                  type="text"
                  value={form.direccion}
                  onChange={(e) => setForm({ ...form, direccion: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-lg text-sm placeholder-gray-400"
                  style={{ background: c.g08, border: '1.5px solid rgba(204,170,0,0.3)', color: c.text }}
                />
              </div>

              <div className="flex gap-3 pt-2">
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
                  {editingEmpleado ? 'Actualizar' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
