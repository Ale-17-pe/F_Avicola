import { useState } from 'react';
import { Plus, Edit2, Trash2, Search, User, Phone, MapPin, Calendar, CheckCircle, Coffee, Users, Briefcase, FileText, Shield, UserCheck, Upload, X } from 'lucide-react';
import { useApp, Empleado } from '../contexts/AppContext';
import { useTheme, t } from '../contexts/ThemeContext';

export function Empleados() {
  const { empleados, addEmpleado, updateEmpleado, deleteEmpleado } = useApp();
  const { isDark } = useTheme();
  const c = t(isDark);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterCargo, setFilterCargo] = useState<string>('all');
  const [filterEstado, setFilterEstado] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEmpleado, setEditingEmpleado] = useState<Empleado | null>(null);
  const [formData, setFormData] = useState({
    nombre: '',
    apellidos: '',
    dni: '',
    telefono: '',
    direccion: '',
    cargo: 'Producción' as Empleado['cargo'],
    fechaContratacion: '',
    salario: '',
    email: '',
    foto: ''
  });

  // Filtrado de empleados
  const filteredEmpleados = empleados.filter(empleado => {
    const matchesSearch = 
      empleado.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      empleado.apellidos.toLowerCase().includes(searchTerm.toLowerCase()) ||
      empleado.dni.includes(searchTerm) ||
      empleado.telefono.includes(searchTerm);
    const matchesCargo = filterCargo === 'all' || empleado.cargo === filterCargo;
    const matchesEstado = filterEstado === 'all' || empleado.estado === filterEstado;
    return matchesSearch && matchesCargo && matchesEstado;
  });

  // Métricas
  const totalEmpleados = empleados.length;
  const empleadosActivos = empleados.filter(e => e.estado === 'Activo').length;
  const empleadosDescanso = empleados.filter(e => e.estado === 'Descanso').length;

  // Distribución por cargo
  const distribucionCargos = {
    'Secretaria': empleados.filter(e => e.cargo === 'Secretaria').length,
    'Producción': empleados.filter(e => e.cargo === 'Producción').length,
    'Pesaje': empleados.filter(e => e.cargo === 'Pesaje').length,
    'Seguridad': empleados.filter(e => e.cargo === 'Seguridad').length,
    'Operadora': empleados.filter(e => e.cargo === 'Operadora').length,
  };

  const handleOpenModal = (empleado?: Empleado) => {
    if (empleado) {
      setEditingEmpleado(empleado);
      setFormData({
        nombre: empleado.nombre,
        apellidos: empleado.apellidos,
        dni: empleado.dni,
        telefono: empleado.telefono,
        direccion: empleado.direccion,
        cargo: empleado.cargo,
        fechaContratacion: empleado.fechaContratacion,
        salario: empleado.salario.toString(),
        email: empleado.email || '',
        foto: empleado.foto || ''
      });
    } else {
      setEditingEmpleado(null);
      setFormData({
        nombre: '',
        apellidos: '',
        dni: '',
        telefono: '',
        direccion: '',
        cargo: 'Producción',
        fechaContratacion: '',
        salario: '',
        email: '',
        foto: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingEmpleado(null);
    setFormData({
      nombre: '',
      apellidos: '',
      dni: '',
      telefono: '',
      direccion: '',
      cargo: 'Producción',
      fechaContratacion: '',
      salario: '',
      email: '',
      foto: ''
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (editingEmpleado) {
      // Editar empleado existente
      const empleadoActualizado: Empleado = {
        ...editingEmpleado,
        nombre: formData.nombre.trim(),
        apellidos: formData.apellidos.trim(),
        dni: formData.dni.trim(),
        telefono: formData.telefono.trim(),
        direccion: formData.direccion.trim(),
        cargo: formData.cargo,
        fechaContratacion: formData.fechaContratacion,
        salario: parseFloat(formData.salario),
        email: formData.email.trim() || undefined,
        foto: formData.foto.trim() || undefined
      };
      updateEmpleado(empleadoActualizado);
    } else {
      // Agregar nuevo empleado
      const nuevoEmpleado: Empleado = {
        id: Date.now().toString(),
        nombre: formData.nombre.trim(),
        apellidos: formData.apellidos.trim(),
        dni: formData.dni.trim(),
        telefono: formData.telefono.trim(),
        direccion: formData.direccion.trim(),
        cargo: formData.cargo,
        fechaContratacion: formData.fechaContratacion,
        salario: parseFloat(formData.salario),
        estado: 'Activo',
        email: formData.email.trim() || undefined,
        foto: formData.foto.trim() || undefined
      };
      addEmpleado(nuevoEmpleado);
    }

    handleCloseModal();
  };

  const handleDelete = (id: string) => {
    if (confirm('¿Está seguro de eliminar este empleado?')) {
      deleteEmpleado(id);
    }
  };

  const toggleEstado = (empleado: Empleado) => {
    const empleadoActualizado: Empleado = {
      ...empleado,
      estado: empleado.estado === 'Activo' ? 'Descanso' : 'Activo'
    };
    updateEmpleado(empleadoActualizado);
  };

  const getCargoIcon = (cargo: Empleado['cargo']) => {
    switch (cargo) {
      case 'Secretaria':
        return <FileText className="w-4 h-4" />;
      case 'Producción':
        return <Briefcase className="w-4 h-4" />;
      case 'Pesaje':
        return <UserCheck className="w-4 h-4" />;
      case 'Seguridad':
        return <Shield className="w-4 h-4" />;
      case 'Operadora':
        return <User className="w-4 h-4" />;
    }
  };

  const getCargoColor = (cargo: Empleado['cargo']) => {
    switch (cargo) {
      case 'Secretaria':
        return 'bg-purple-500/20 text-purple-200 border-purple-500/30';
      case 'Producción':
        return 'bg-blue-500/20 text-blue-200 border-blue-500/30';
      case 'Pesaje':
        return 'bg-green-500/20 text-green-200 border-green-500/30';
      case 'Seguridad':
        return 'bg-red-500/20 text-red-200 border-red-500/30';
      case 'Operadora':
        return 'bg-amber-500/20 text-amber-200 border-amber-500/30';
    }
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl flex items-center gap-3" style={{ color: c.text }}>
            <Users className="w-8 h-8 text-amber-400" />
            Empleados
          </h1>
          <p className="mt-1" style={{ color: c.textSecondary }}>
            Gestión de personal de Avícola Jossy
          </p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-black px-4 py-2.5 rounded-lg flex items-center gap-2 transition-all shadow-lg shadow-amber-500/20 whitespace-nowrap"
        >
          <Plus className="w-5 h-5" />
          Nuevo Empleado
        </button>
      </div>

      {/* Métricas */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl p-5" style={{ background: c.bgCard, border: `1px solid ${c.border}` }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm" style={{ color: c.textSecondary }}>Total Empleados</p>
              <p className="text-3xl mt-1" style={{ color: c.text }}>{totalEmpleados}</p>
            </div>
            <div className="bg-amber-500/20 p-3 rounded-lg">
              <Users className="w-8 h-8 text-amber-400" />
            </div>
          </div>
        </div>

        <div className="rounded-xl p-5" style={{ background: c.bgCard, border: `1px solid ${c.border}` }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm" style={{ color: c.textSecondary }}>Activos</p>
              <p className="text-3xl mt-1" style={{ color: c.text }}>{empleadosActivos}</p>
            </div>
            <div className="bg-green-500/20 p-3 rounded-lg">
              <CheckCircle className="w-8 h-8 text-green-400" />
            </div>
          </div>
        </div>

        <div className="rounded-xl p-5" style={{ background: c.bgCard, border: `1px solid ${c.border}` }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm" style={{ color: c.textSecondary }}>En Descanso</p>
              <p className="text-3xl mt-1" style={{ color: c.text }}>{empleadosDescanso}</p>
            </div>
            <div className="bg-orange-500/20 p-3 rounded-lg">
              <Coffee className="w-8 h-8 text-orange-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Distribución por Cargo */}
      <div className="rounded-xl p-5" style={{ background: c.bgCard, border: `1px solid ${c.border}` }}>
        <h3 className="text-lg mb-4 flex items-center gap-2" style={{ color: c.text }}>
          <Briefcase className="w-5 h-5 text-amber-400" />
          Distribución por Cargo
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-4 text-center">
            <div className="flex items-center justify-center gap-2 text-purple-200 text-sm mb-2">
              <FileText className="w-4 h-4" />
              Secretaria
            </div>
            <p className="text-2xl" style={{ color: c.text }}>{distribucionCargos['Secretaria']}</p>
          </div>
          
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 text-center">
            <div className="flex items-center justify-center gap-2 text-blue-200 text-sm mb-2">
              <Briefcase className="w-4 h-4" />
              Producción
            </div>
            <p className="text-2xl" style={{ color: c.text }}>{distribucionCargos['Producción']}</p>
          </div>
          
          <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 text-center">
            <div className="flex items-center justify-center gap-2 text-green-200 text-sm mb-2">
              <UserCheck className="w-4 h-4" />
              Pesaje
            </div>
            <p className="text-2xl" style={{ color: c.text }}>{distribucionCargos['Pesaje']}</p>
          </div>
          
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 text-center">
            <div className="flex items-center justify-center gap-2 text-red-200 text-sm mb-2">
              <Shield className="w-4 h-4" />
              Seguridad
            </div>
            <p className="text-2xl" style={{ color: c.text }}>{distribucionCargos['Seguridad']}</p>
          </div>
          
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4 text-center">
            <div className="flex items-center justify-center gap-2 text-amber-200 text-sm mb-2">
              <User className="w-4 h-4" />
              Operadora
            </div>
            <p className="text-2xl" style={{ color: c.text }}>{distribucionCargos['Operadora']}</p>
          </div>
        </div>
      </div>

      {/* Filtros y Búsqueda */}
      <div className="rounded-xl p-5" style={{ background: c.bgCard, border: `1px solid ${c.border}` }}>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Búsqueda */}
          <div className="lg:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Buscar por nombre, DNI o teléfono..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-lg pl-10 pr-4 py-2.5 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500"
                style={{ background: c.bgInput, border: `1px solid ${c.border}`, color: c.text }}
              />
            </div>
          </div>

          {/* Filtro por Cargo */}
          <div>
            <select
              value={filterCargo}
              onChange={(e) => setFilterCargo(e.target.value)}
              className="w-full rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500"
              style={{ background: c.bgInput, border: `1px solid ${c.border}`, color: c.text }}
            >
              <option value="all">Todos los cargos</option>
              <option value="Secretaria">Secretaria</option>
              <option value="Producción">Producción</option>
              <option value="Pesaje">Pesaje</option>
              <option value="Seguridad">Seguridad</option>
              <option value="Operadora">Operadora</option>
            </select>
          </div>

          {/* Filtro por Estado */}
          <div>
            <select
              value={filterEstado}
              onChange={(e) => setFilterEstado(e.target.value)}
              className="w-full rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500"
              style={{ background: c.bgInput, border: `1px solid ${c.border}`, color: c.text }}
            >
              <option value="all">Todos los estados</option>
              <option value="Activo">Activos</option>
              <option value="Descanso">En Descanso</option>
            </select>
          </div>
        </div>
      </div>

      {/* Lista de Empleados */}
      <div className="rounded-xl overflow-hidden" style={{ background: c.bgCard, border: `1px solid ${c.border}` }}>
        {/* Desktop View */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full">
            <thead style={{ background: c.bgTableHeader, borderBottom: `1px solid ${c.border}` }}>
              <tr>
                <th className="text-left px-6 py-4 text-sm" style={{ color: c.textSecondary }}>Empleado</th>
                <th className="text-left px-6 py-4 text-sm" style={{ color: c.textSecondary }}>DNI</th>
                <th className="text-left px-6 py-4 text-sm" style={{ color: c.textSecondary }}>Contacto</th>
                <th className="text-left px-6 py-4 text-sm" style={{ color: c.textSecondary }}>Cargo</th>
                <th className="text-left px-6 py-4 text-sm" style={{ color: c.textSecondary }}>Fecha Contratación</th>
                <th className="text-left px-6 py-4 text-sm" style={{ color: c.textSecondary }}>Salario</th>
                <th className="text-left px-6 py-4 text-sm" style={{ color: c.textSecondary }}>Estado</th>
                <th className="text-left px-6 py-4 text-sm" style={{ color: c.textSecondary }}>Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {filteredEmpleados.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                    No se encontraron empleados
                  </td>
                </tr>
              ) : (
                filteredEmpleados.map((empleado) => (
                  <tr key={empleado.id} className="hover:bg-zinc-800/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {empleado.foto ? (
                          <img 
                            src={empleado.foto} 
                            alt={empleado.nombre}
                            className="w-10 h-10 rounded-full object-cover border-2 border-amber-500/30"
                          />
                        ) : (
                          <div className="bg-amber-500/20 p-2 rounded-full">
                            <User className="w-6 h-6 text-amber-400" />
                          </div>
                        )}
                        <div>
                          <p style={{ color: c.text }}>{empleado.nombre} {empleado.apellidos}</p>
                          {empleado.email && (
                            <p className="text-sm" style={{ color: c.textMuted }}>{empleado.email}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4" style={{ color: c.textSecondary }}>{empleado.dni}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2" style={{ color: c.textSecondary }}>
                        <Phone className="w-4 h-4" style={{ color: c.textMuted }} />
                        {empleado.telefono}
                      </div>
                      <div className="flex items-center gap-2 text-sm mt-1" style={{ color: c.textMuted }}>
                        <MapPin className="w-3 h-3" />
                        {empleado.direccion}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm border ${getCargoColor(empleado.cargo)}`}>
                        {getCargoIcon(empleado.cargo)}
                        {empleado.cargo}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2" style={{ color: c.textSecondary }}>
                        <Calendar className="w-4 h-4" style={{ color: c.textMuted }} />
                        {new Date(empleado.fechaContratacion).toLocaleDateString('es-PE')}
                      </div>
                    </td>
                    <td className="px-6 py-4" style={{ color: c.text }}>
                      S/ {empleado.salario.toFixed(2)}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => toggleEstado(empleado)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm border transition-all ${
                          empleado.estado === 'Activo'
                            ? 'bg-green-500/20 text-green-200 border-green-500/30 hover:bg-green-500/30'
                            : 'bg-orange-500/20 text-orange-200 border-orange-500/30 hover:bg-orange-500/30'
                        }`}
                      >
                        {empleado.estado === 'Activo' ? (
                          <CheckCircle className="w-4 h-4" />
                        ) : (
                          <Coffee className="w-4 h-4" />
                        )}
                        {empleado.estado}
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleOpenModal(empleado)}
                          className="p-2 hover:bg-zinc-700 rounded-lg transition-colors text-blue-400 hover:text-blue-300"
                          title="Editar"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(empleado.id)}
                          className="p-2 hover:bg-zinc-700 rounded-lg transition-colors text-red-400 hover:text-red-300"
                          title="Eliminar"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile/Tablet View */}
        <div className="lg:hidden divide-y divide-zinc-800">
          {filteredEmpleados.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              No se encontraron empleados
            </div>
          ) : (
            filteredEmpleados.map((empleado) => (
              <div key={empleado.id} className="p-5 hover:bg-zinc-800/30 transition-colors">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    {empleado.foto ? (
                      <img 
                        src={empleado.foto} 
                        alt={empleado.nombre}
                        className="w-12 h-12 rounded-full object-cover border-2 border-amber-500/30"
                      />
                    ) : (
                      <div className="bg-amber-500/20 p-2 rounded-full">
                        <User className="w-6 h-6 text-amber-400" />
                      </div>
                    )}
                    <div>
                      <p style={{ color: c.text }}>{empleado.nombre} {empleado.apellidos}</p>
                      <p className="text-sm" style={{ color: c.textMuted }}>DNI: {empleado.dni}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => toggleEstado(empleado)}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs border ${
                      empleado.estado === 'Activo'
                        ? 'bg-green-500/20 text-green-200 border-green-500/30'
                        : 'bg-orange-500/20 text-orange-200 border-orange-500/30'
                    }`}
                  >
                    {empleado.estado === 'Activo' ? (
                      <CheckCircle className="w-3 h-3" />
                    ) : (
                      <Coffee className="w-3 h-3" />
                    )}
                    {empleado.estado}
                  </button>
                </div>

                <div className="space-y-2 mb-3">
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm border ${getCargoColor(empleado.cargo)}`}>
                    {getCargoIcon(empleado.cargo)}
                    {empleado.cargo}
                  </span>
                  
                  <div className="flex items-center gap-2 text-sm" style={{ color: c.textSecondary }}>
                    <Phone className="w-4 h-4" style={{ color: c.textMuted }} />
                    {empleado.telefono}
                  </div>

                  {empleado.email && (
                    <div className="text-sm" style={{ color: c.textMuted }}>{empleado.email}</div>
                  )}

                  <div className="flex items-center gap-2 text-sm" style={{ color: c.textMuted }}>
                    <MapPin className="w-4 h-4" />
                    {empleado.direccion}
                  </div>

                  <div className="flex items-center gap-2 text-sm" style={{ color: c.textSecondary }}>
                    <Calendar className="w-4 h-4" />
                    Contratado: {new Date(empleado.fechaContratacion).toLocaleDateString('es-PE')}
                  </div>

                  <div style={{ color: c.text }}>
                    Salario: S/ {empleado.salario.toFixed(2)}
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-3 border-t" style={{ borderColor: c.border }}>
                  <button
                    onClick={() => handleOpenModal(empleado)}
                    className="flex-1 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 px-4 py-2 rounded-lg flex items-center justify-center gap-2 transition-colors border border-blue-500/30"
                  >
                    <Edit2 className="w-4 h-4" />
                    Editar
                  </button>
                  <button
                    onClick={() => handleDelete(empleado.id)}
                    className="flex-1 bg-red-500/20 hover:bg-red-500/30 text-red-300 px-4 py-2 rounded-lg flex items-center justify-center gap-2 transition-colors border border-red-500/30"
                  >
                    <Trash2 className="w-4 h-4" />
                    Eliminar
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Modal de Formulario */}
      {isModalOpen && (
        <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50 p-4" style={{ background: c.bgModalOverlay }}>
          <div className="rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" style={{ background: c.bgCard, border: `1px solid ${c.border}` }}>
            {/* Header del Modal */}
            <div className="sticky top-0 backdrop-blur-sm px-6 py-4 flex items-center justify-between" style={{ background: c.bgModal, borderBottom: `1px solid ${c.border}` }}>
              <h2 className="text-xl flex items-center gap-2" style={{ color: c.text }}>
                <User className="w-6 h-6 text-amber-400" />
                {editingEmpleado ? 'Editar Empleado' : 'Nuevo Empleado'}
              </h2>
              <button
                onClick={handleCloseModal}
                className="transition-colors p-1 rounded-lg" style={{ color: c.textSecondary }}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Formulario */}
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {/* Foto */}
              <div className="space-y-4">
                <h3 className="flex items-center gap-2 pb-2 border-b" style={{ color: c.text, borderColor: c.border }}>
                  <Upload className="w-5 h-5 text-amber-400" />
                  Fotografía
                </h3>

                <div className="flex items-center gap-4">
                  {formData.foto ? (
                    <img 
                      src={formData.foto} 
                      alt="Preview"
                      className="w-24 h-24 rounded-full object-cover border-2 border-amber-500/30"
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-full flex items-center justify-center" style={{ background: c.bgInput, border: `2px solid ${c.border}` }}>
                      <User className="w-12 h-12" style={{ color: c.textMuted }} />
                    </div>
                  )}
                  
                  <div className="flex-1">
                    <label className="block text-sm mb-2" style={{ color: c.textSecondary }}>
                      URL de la Foto
                    </label>
                    <input
                      type="url"
                      value={formData.foto}
                      onChange={(e) => setFormData({ ...formData, foto: e.target.value })}
                      className="w-full rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500"
                      style={{ background: c.bgInput, border: `1px solid ${c.border}`, color: c.text }}
                      placeholder="https://ejemplo.com/foto.jpg"
                    />
                  </div>
                </div>
              </div>

              {/* Información Personal */}
              <div className="space-y-4">
                <h3 className="flex items-center gap-2 pb-2 border-b" style={{ color: c.text, borderColor: c.border }}>
                  <User className="w-5 h-5 text-amber-400" />
                  Información Personal
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm mb-2" style={{ color: c.textSecondary }}>
                      Nombre <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.nombre}
                      onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                      className="w-full rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500"
                      style={{ background: c.bgInput, border: `1px solid ${c.border}`, color: c.text }}
                      placeholder="Ej: Juan"
                    />
                  </div>

                  <div>
                    <label className="block text-sm mb-2" style={{ color: c.textSecondary }}>
                      Apellidos <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.apellidos}
                      onChange={(e) => setFormData({ ...formData, apellidos: e.target.value })}
                      className="w-full rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500"
                      style={{ background: c.bgInput, border: `1px solid ${c.border}`, color: c.text }}
                      placeholder="Ej: Pérez García"
                    />
                  </div>

                  <div>
                    <label className="block text-sm mb-2" style={{ color: c.textSecondary }}>
                      DNI <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.dni}
                      onChange={(e) => setFormData({ ...formData, dni: e.target.value })}
                      className="w-full rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500"
                      style={{ background: c.bgInput, border: `1px solid ${c.border}`, color: c.text }}
                      placeholder="12345678"
                      maxLength={8}
                    />
                  </div>

                  <div>
                    <label className="block text-sm mb-2" style={{ color: c.textSecondary }}>
                      Teléfono <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      required
                      value={formData.telefono}
                      onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                      className="w-full rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500"
                      style={{ background: c.bgInput, border: `1px solid ${c.border}`, color: c.text }}
                      placeholder="987654321"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm mb-2" style={{ color: c.textSecondary }}>
                      Email
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500"
                      style={{ background: c.bgInput, border: `1px solid ${c.border}`, color: c.text }}
                      placeholder="empleado@avicolajossy.com"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm mb-2" style={{ color: c.textSecondary }}>
                      Dirección <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.direccion}
                      onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                      className="w-full rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500"
                      style={{ background: c.bgInput, border: `1px solid ${c.border}`, color: c.text }}
                      placeholder="Av. Principal 123, Lima"
                    />
                  </div>
                </div>
              </div>

              {/* Información Laboral */}
              <div className="space-y-4">
                <h3 className="flex items-center gap-2 pb-2 border-b" style={{ color: c.text, borderColor: c.border }}>
                  <Briefcase className="w-5 h-5 text-amber-400" />
                  Información Laboral
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm mb-2" style={{ color: c.textSecondary }}>
                      Cargo <span className="text-red-500">*</span>
                    </label>
                    <select
                      required
                      value={formData.cargo}
                      onChange={(e) => setFormData({ ...formData, cargo: e.target.value as Empleado['cargo'] })}
                      className="w-full rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500"
                      style={{ background: c.bgInput, border: `1px solid ${c.border}`, color: c.text }}
                    >
                      <option value="Secretaria">Secretaria</option>
                      <option value="Producción">Producción</option>
                      <option value="Pesaje">Pesaje</option>
                      <option value="Seguridad">Seguridad</option>
                      <option value="Operadora">Operadora</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm mb-2" style={{ color: c.textSecondary }}>
                      Fecha de Contratación <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      required
                      value={formData.fechaContratacion}
                      onChange={(e) => setFormData({ ...formData, fechaContratacion: e.target.value })}
                      className="w-full rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500"
                      style={{ background: c.bgInput, border: `1px solid ${c.border}`, color: c.text }}
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm mb-2" style={{ color: c.textSecondary }}>
                      Salario Mensual (S/) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      required
                      step="0.01"
                      min="0"
                      value={formData.salario}
                      onChange={(e) => setFormData({ ...formData, salario: e.target.value })}
                      className="w-full rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500"
                      style={{ background: c.bgInput, border: `1px solid ${c.border}`, color: c.text }}
                      placeholder="1200.00"
                    />
                  </div>
                </div>
              </div>

              {/* Botones */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="flex-1 px-6 py-3 rounded-lg transition-colors" style={{ background: c.bgInput, border: `1px solid ${c.border}`, color: c.text }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-black px-6 py-3 rounded-lg transition-all shadow-lg shadow-amber-500/20"
                >
                  {editingEmpleado ? 'Guardar Cambios' : 'Registrar Empleado'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}