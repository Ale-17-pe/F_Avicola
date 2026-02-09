import { useState } from 'react';
import { Plus, Edit2, Trash2, Search, X, Filter, Bird, PackageOpen } from 'lucide-react';
import { AvesMetrics } from './AvesMetrics';
import { ModalPresentaciones } from './ModalPresentaciones';
import { useApp } from '../contexts/AppContext';

interface TipoAve {
  id: string;
  nombre: string;
  tieneSexo: boolean;
  tieneVariedad: boolean;
  variedades?: string[];
  color: string;
}

interface Presentacion {
  id: string;
  tipoAve: string;
  nombre: string;
  mermaKg: number;
  esVariable: boolean;
}

interface Ave {
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

const proveedoresEjemplo = [
  { id: '1', nombre: 'Distribuidora San Martín' },
  { id: '2', nombre: 'Avícola del Norte SAC' }
];

export function Aves() {
  const { tiposAve, addTipoAve, updateTipoAve, deleteTipoAve } = useApp();
  
  const [aves, setAves] = useState<Ave[]>([
    {
      id: '1',
      proveedorId: '1',
      proveedorNombre: 'Distribuidora San Martín',
      tipoAve: 'Pollo',
      variedad: 'Blancos',
      cantidadJavas: 3,
      avesPorJava: 50,
      cantidad: 150,
      fechaIngreso: '2025-01-20',
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
      fechaIngreso: '2025-01-22',
      horaIngreso: '09:00'
    }
  ]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAve, setEditingAve] = useState<Ave | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTipo, setFilterTipo] = useState<string>('all');
  
  const [isAddTipoModalOpen, setIsAddTipoModalOpen] = useState(false);
  const [editingTipo, setEditingTipo] = useState<TipoAve | null>(null);
  const [nuevoTipoForm, setNuevoTipoForm] = useState({
    nombre: '',
    tieneSexo: true,
    tieneVariedad: false,
    variedades: '',
    color: '#22c55e'
  });
  
  const [isPresentacionesModalOpen, setIsPresentacionesModalOpen] = useState(false);
  const [presentaciones, setPresentaciones] = useState<Presentacion[]>([
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
    { id: '12', tipoAve: 'Pavo', nombre: 'Destripado', mermaKg: 0.20, esVariable: false },
  ]);
  const [editingPresentacion, setEditingPresentacion] = useState<Presentacion | null>(null);
  const [nuevaPresentacionForm, setNuevaPresentacionForm] = useState({
    tipoAve: 'Pollo',
    nombre: '',
    mermaKg: '',
    esVariable: false
  });
  const [filtroPresentacionTipo, setFiltroPresentacionTipo] = useState<string>('all');
  
  const [formData, setFormData] = useState({
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

  const filteredAves = aves.filter(ave => {
    const matchesSearch = ave.proveedorNombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          ave.tipoAve.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterTipo === 'all' || ave.tipoAve === filterTipo;
    return matchesSearch && matchesFilter;
  });

  const handleOpenModal = (ave?: Ave) => {
    if (ave) {
      setEditingAve(ave);
      setFormData({
        proveedorId: ave.proveedorId,
        tipoAve: ave.tipoAve,
        variedad: ave.variedad,
        cantidadJavas: ave.cantidadJavas.toString(),
        avesPorJava: ave.avesPorJava.toString(),
        cantidadMachos: ave.cantidadMachos?.toString() || '',
        cantidadHembras: ave.cantidadHembras?.toString() || '',
        fechaIngreso: ave.fechaIngreso,
        horaIngreso: ave.horaIngreso
      });
    } else {
      setEditingAve(null);
      setFormData({
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
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingAve(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const proveedor = proveedoresEjemplo.find(p => p.id === formData.proveedorId);
    if (!proveedor) return;

    const totalAves = parseInt(formData.cantidadJavas) * parseInt(formData.avesPorJava);

    const aveData: Ave = {
      id: editingAve?.id || Date.now().toString(),
      proveedorId: formData.proveedorId,
      proveedorNombre: proveedor.nombre,
      tipoAve: formData.tipoAve,
      variedad: formData.variedad,
      cantidadJavas: parseInt(formData.cantidadJavas),
      avesPorJava: parseInt(formData.avesPorJava),
      cantidad: totalAves,
      cantidadMachos: formData.cantidadMachos ? parseInt(formData.cantidadMachos) : undefined,
      cantidadHembras: formData.cantidadHembras ? parseInt(formData.cantidadHembras) : undefined,
      fechaIngreso: formData.fechaIngreso,
      horaIngreso: formData.horaIngreso
    };

    if (editingAve) {
      setAves(aves.map(a => a.id === editingAve.id ? aveData : a));
    } else {
      setAves([...aves, aveData]);
    }
    
    handleCloseModal();
  };

  const handleDelete = (id: string) => {
    if (confirm('¿Está seguro de eliminar este registro?')) {
      setAves(aves.filter(a => a.id !== id));
    }
  };

  const getTotalCantidad = () => {
    return filteredAves.reduce((sum, ave) => sum + ave.cantidad, 0);
  };

  const tiposUnicos = [...new Set(tiposAve.map(t => t.nombre))];

  return (
    <div className="space-y-4 sm:space-y-6 p-2 sm:p-4">
      {/* Header con botón de registro */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 mb-4 sm:mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-white mb-1 sm:mb-2">Gestión de Aves</h1>
          <p className="text-xs sm:text-sm text-gray-400">Tipos de aves y presentaciones de la avícola</p>
        </div>
        <div className="flex flex-wrap gap-2 sm:gap-3">
          <button
            onClick={() => setIsAddTipoModalOpen(true)}
            className="flex-1 sm:flex-none px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg text-xs sm:text-sm font-medium sm:font-bold transition-all hover:scale-105 flex items-center justify-center gap-2"
            style={{
              background: 'linear-gradient(to right, #0d4a24, #166534, #b8941e, #ccaa00)',
              color: 'white',
              boxShadow: '0 4px 12px rgba(204, 170, 0, 0.4)'
            }}
          >
            <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">Agregar Tipos de Aves</span>
            <span className="sm:hidden">Tipos de Aves</span>
          </button>
          <button
            onClick={() => setIsPresentacionesModalOpen(true)}
            className="flex-1 sm:flex-none px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg text-xs sm:text-sm font-medium sm:font-bold transition-all hover:scale-105 flex items-center justify-center gap-2"
            style={{
              background: 'linear-gradient(to right, #0d4a24, #166534, #b8941e, #ccaa00)',
              color: 'white',
              boxShadow: '0 4px 12px rgba(204, 170, 0, 0.4)'
            }}
          >
            <PackageOpen className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">Agregar Presentaciones</span>
            <span className="sm:hidden">Presentaciones</span>
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4">
        <div className="backdrop-blur-xl rounded-xl p-4 sm:p-6" style={{
          background: 'rgba(0, 0, 0, 0.3)',
          border: '1px solid rgba(34, 197, 94, 0.3)'
        }}>
          <p className="text-sm text-gray-400 mb-2">Total de Aves Registradas</p>
          <p className="text-3xl sm:text-4xl font-bold" style={{ color: '#22c55e' }}>{getTotalCantidad()}</p>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="backdrop-blur-xl rounded-xl p-3 sm:p-4" style={{
        background: 'rgba(0, 0, 0, 0.3)',
        border: '1px solid rgba(255, 255, 255, 0.1)'
      }}>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por proveedor o tipo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 sm:pl-12 pr-3 py-2.5 sm:py-3 rounded-lg text-sm text-white placeholder-gray-400"
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)'
              }}
            />
          </div>
          <div className="relative flex-shrink-0">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
            <select
              value={filterTipo}
              onChange={(e) => setFilterTipo(e.target.value)}
              className="pl-10 sm:pl-12 pr-8 py-2.5 sm:py-3 rounded-lg text-sm text-white appearance-none cursor-pointer w-full sm:w-auto min-w-[150px]"
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)'
              }}
            >
              <option value="all" style={{ background: '#1a1a1a', color: 'white' }}>Todos los tipos</option>
              {tiposUnicos.map(tipo => (
                <option key={tipo} value={tipo} style={{ background: '#1a1a1a', color: 'white' }}>{tipo}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Table - Mobile Cards y Desktop Table */}
      <div className="backdrop-blur-xl rounded-xl overflow-hidden" style={{
        background: 'rgba(0, 0, 0, 0.3)',
        border: '1px solid rgba(255, 255, 255, 0.1)'
      }}>
        {/* Desktop Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr style={{ background: 'rgba(0, 0, 0, 0.4)', borderBottom: '1px solid rgba(204, 170, 0, 0.3)' }}>
                <th className="px-4 lg:px-6 py-3 text-left font-bold text-sm" style={{ color: '#ccaa00' }}>Proveedor</th>
                <th className="px-4 lg:px-6 py-3 text-left font-bold text-sm" style={{ color: '#ccaa00' }}>Tipo de Ave</th>
                <th className="px-4 lg:px-6 py-3 text-left font-bold text-sm" style={{ color: '#ccaa00' }}>Detalle</th>
                <th className="px-4 lg:px-6 py-3 text-left font-bold text-sm" style={{ color: '#ccaa00' }}>Cantidad</th>
                <th className="px-4 lg:px-6 py-3 text-left font-bold text-sm" style={{ color: '#ccaa00' }}>Fecha</th>
                <th className="px-4 lg:px-6 py-3 text-center font-bold text-sm" style={{ color: '#ccaa00' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredAves.map((ave) => {
                const tipoAve = tiposAve.find(t => t.nombre === ave.tipoAve);
                return (
                  <tr 
                    key={ave.id}
                    className="border-b transition-colors hover:bg-white/5"
                    style={{ borderColor: 'rgba(255, 255, 255, 0.05)' }}
                  >
                    <td className="px-4 lg:px-6 py-3 text-white text-sm">{ave.proveedorNombre}</td>
                    <td className="px-4 lg:px-6 py-3">
                      <span 
                        className="px-2 py-1 rounded-full text-xs font-medium"
                        style={{
                          background: tipoAve?.color ? `${tipoAve.color}20` : 'rgba(34, 197, 94, 0.2)',
                          color: tipoAve?.color || '#22c55e',
                          border: `1px solid ${tipoAve?.color ? `${tipoAve.color}40` : 'rgba(34, 197, 94, 0.3)'}`
                        }}
                      >
                        {ave.tipoAve}
                      </span>
                    </td>
                    <td className="px-4 lg:px-6 py-3 text-gray-300 text-sm">
                      {ave.variedad && <div className="mb-1">{ave.variedad}</div>}
                      <div className="text-xs space-x-2">
                        <span style={{ color: '#3b82f6' }}>Java {ave.cantidadJavas}</span>
                        <span>|</span>
                        <span style={{ color: '#ec4899' }}>Aves/Java {ave.avesPorJava}</span>
                      </div>
                    </td>
                    <td className="px-4 lg:px-6 py-3 text-white font-bold text-sm">{ave.cantidad}</td>
                    <td className="px-4 lg:px-6 py-3 text-gray-300 text-sm">
                      <div>{ave.fechaIngreso}</div>
                      <div className="text-xs">{ave.horaIngreso}</div>
                    </td>
                    <td className="px-4 lg:px-6 py-3">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleOpenModal(ave)}
                          className="p-1.5 sm:p-2 rounded-lg transition-all hover:scale-110"
                          style={{
                            background: 'rgba(34, 197, 94, 0.2)',
                            border: '1px solid rgba(34, 197, 94, 0.3)'
                          }}
                        >
                          <Edit2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" style={{ color: '#22c55e' }} />
                        </button>
                        <button
                          onClick={() => handleDelete(ave.id)}
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

        {/* Mobile Cards */}
        <div className="md:hidden">
          {filteredAves.map((ave) => {
            const tipoAve = tiposAve.find(t => t.nombre === ave.tipoAve);
            return (
              <div 
                key={ave.id}
                className="p-4 border-b transition-colors hover:bg-white/5"
                style={{ borderColor: 'rgba(255, 255, 255, 0.05)' }}
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <p className="text-white font-medium text-sm">{ave.proveedorNombre}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span 
                        className="px-2 py-1 rounded-full text-xs font-medium"
                        style={{
                          background: tipoAve?.color ? `${tipoAve.color}20` : 'rgba(34, 197, 94, 0.2)',
                          color: tipoAve?.color || '#22c55e',
                          border: `1px solid ${tipoAve?.color ? `${tipoAve.color}40` : 'rgba(34, 197, 94, 0.3)'}`
                        }}
                      >
                        {ave.tipoAve}
                      </span>
                      <span className="text-gray-400 text-xs">{ave.variedad}</span>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => handleOpenModal(ave)}
                      className="p-1.5 rounded-lg transition-all hover:scale-110"
                      style={{
                        background: 'rgba(34, 197, 94, 0.2)',
                        border: '1px solid rgba(34, 197, 94, 0.3)'
                      }}
                    >
                      <Edit2 className="w-3.5 h-3.5" style={{ color: '#22c55e' }} />
                    </button>
                    <button
                      onClick={() => handleDelete(ave.id)}
                      className="p-1.5 rounded-lg transition-all hover:scale-110"
                      style={{
                        background: 'rgba(239, 68, 68, 0.2)',
                        border: '1px solid rgba(239, 68, 68, 0.3)'
                      }}
                    >
                      <Trash2 className="w-3.5 h-3.5" style={{ color: '#ef4444' }} />
                    </button>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-gray-400 text-xs mb-1">Cantidad</p>
                    <p className="text-white font-bold">{ave.cantidad} aves</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-xs mb-1">Detalle</p>
                    <div className="text-xs space-y-1">
                      <div style={{ color: '#3b82f6' }}>Java {ave.cantidadJavas}</div>
                      <div style={{ color: '#ec4899' }}>Aves/Java {ave.avesPorJava}</div>
                    </div>
                  </div>
                  <div className="col-span-2">
                    <p className="text-gray-400 text-xs mb-1">Fecha</p>
                    <div className="flex items-center gap-2">
                      <span className="text-white text-sm">{ave.fechaIngreso}</span>
                      <span className="text-gray-400 text-xs">{ave.horaIngreso}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {filteredAves.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-400">No se encontraron registros</p>
          </div>
        )}
      </div>

      {/* Modal - Mejorado para móvil */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4" style={{ background: 'rgba(0, 0, 0, 0.85)' }}>
          <div 
            className="backdrop-blur-2xl rounded-xl sm:rounded-2xl w-full max-w-2xl mx-2 max-h-[90vh] overflow-y-auto"
            style={{
              background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.7) 0%, rgba(13, 74, 36, 0.3) 50%, rgba(0, 0, 0, 0.7) 100%)',
              border: '2px solid rgba(204, 170, 0, 0.3)',
              boxShadow: '0 20px 40px -12px rgba(0, 0, 0, 0.8), 0 0 80px rgba(204, 170, 0, 0.15)'
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b sticky top-0 bg-black/30 backdrop-blur-xl z-10" style={{ borderColor: 'rgba(204, 170, 0, 0.2)' }}>
              <div className="flex items-center gap-3">
                <div 
                  className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{
                    background: 'linear-gradient(135deg, #ccaa00, #b8941e)',
                    boxShadow: '0 10px 30px rgba(204, 170, 0, 0.4)'
                  }}
                >
                  <Bird className="w-5 h-5 sm:w-6 sm:h-6 text-black" />
                </div>
                <div>
                  <h2 className="text-lg sm:text-xl font-bold text-white">
                    {editingAve ? 'Editar Ave' : 'Registrar Ave'}
                  </h2>
                </div>
              </div>
              <button
                onClick={handleCloseModal}
                className="p-2 rounded-xl transition-all hover:scale-110 hover:rotate-90"
                style={{ 
                  background: 'rgba(239, 68, 68, 0.2)',
                  border: '1px solid rgba(239, 68, 68, 0.3)'
                }}
              >
                <X className="w-5 h-5" style={{ color: '#ef4444' }} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-4 sm:p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                {/* Proveedor */}
                <div className="sm:col-span-2">
                  <label className="block text-sm font-bold mb-2" style={{ color: '#ccaa00' }}>
                    Proveedor *
                  </label>
                  <select
                    required
                    value={formData.proveedorId}
                    onChange={(e) => setFormData({ ...formData, proveedorId: e.target.value })}
                    className="w-full px-3 py-3 rounded-lg text-sm text-white transition-all"
                    style={{
                      background: 'rgba(255, 255, 255, 0.08)',
                      border: '1.5px solid rgba(204, 170, 0, 0.3)'
                    }}
                  >
                    <option value="">Seleccione proveedor</option>
                    {proveedoresEjemplo.map(p => (
                      <option key={p.id} value={p.id} style={{ background: '#1a1a1a', color: 'white' }}>{p.nombre}</option>
                    ))}
                  </select>
                </div>

                {/* Tipo de Ave */}
                <div className="sm:col-span-2">
                  <label className="block text-sm font-bold mb-2" style={{ color: '#ccaa00' }}>
                    Tipo de Ave *
                  </label>
                  <select
                    required
                    value={formData.tipoAve}
                    onChange={(e) => {
                      const tipoSeleccionado = tiposAve.find(t => t.nombre === e.target.value);
                      if (tipoSeleccionado) {
                        if (tipoSeleccionado.tieneVariedad) {
                          setFormData({
                            ...formData,
                            tipoAve: tipoSeleccionado.nombre,
                            variedad: tipoSeleccionado.variedades?.[0]
                          });
                        } else if (tipoSeleccionado.tieneSexo) {
                          setFormData({
                            ...formData,
                            tipoAve: tipoSeleccionado.nombre,
                            variedad: undefined
                          });
                        } else {
                          setFormData({
                            ...formData,
                            tipoAve: tipoSeleccionado.nombre,
                            variedad: undefined
                          });
                        }
                      }
                    }}
                    className="w-full px-3 py-3 rounded-lg text-sm text-white transition-all"
                    style={{
                      background: 'rgba(255, 255, 255, 0.08)',
                      border: '1.5px solid rgba(204, 170, 0, 0.3)'
                    }}
                  >
                    {tiposAve.map(tipo => (
                      <option key={tipo.id} value={tipo.nombre} style={{ background: '#1a1a1a', color: 'white' }}>
                        {tipo.nombre}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Variedad si aplica */}
                {(() => {
                  const tipoActual = tiposAve.find(t => t.nombre === formData.tipoAve);
                  
                  if (tipoActual?.tieneVariedad && tipoActual.variedades) {
                    return (
                      <div className="sm:col-span-2">
                        <label className="block text-sm font-bold mb-2" style={{ color: '#ccaa00' }}>
                          Variedad *
                        </label>
                        <select
                          required
                          value={formData.variedad}
                          onChange={(e) => setFormData({ ...formData, variedad: e.target.value })}
                          className="w-full px-3 py-3 rounded-lg text-sm text-white transition-all"
                          style={{
                            background: 'rgba(255, 255, 255, 0.08)',
                            border: '1.5px solid rgba(204, 170, 0, 0.3)'
                          }}
                        >
                          {tipoActual.variedades.map(variedad => (
                            <option key={variedad} value={variedad} style={{ background: '#1a1a1a', color: 'white' }}>
                              {variedad}
                            </option>
                          ))}
                        </select>
                      </div>
                    );
                  }
                  return null;
                })()}

                {/* Javas y Aves por Java */}
                <div>
                  <label className="block text-sm font-bold mb-2" style={{ color: '#ccaa00' }}>
                    Javas *
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={formData.cantidadJavas}
                    onChange={(e) => setFormData({ ...formData, cantidadJavas: e.target.value })}
                    className="w-full px-3 py-3 rounded-lg text-sm text-white placeholder-gray-400"
                    style={{
                      background: 'rgba(255, 255, 255, 0.08)',
                      border: '1.5px solid rgba(59, 130, 246, 0.3)'
                    }}
                    placeholder="Número"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold mb-2" style={{ color: '#ccaa00' }}>
                    Aves/Java *
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={formData.avesPorJava}
                    onChange={(e) => setFormData({ ...formData, avesPorJava: e.target.value })}
                    className="w-full px-3 py-3 rounded-lg text-sm text-white placeholder-gray-400"
                    style={{
                      background: 'rgba(255, 255, 255, 0.08)',
                      border: '1.5px solid rgba(236, 72, 153, 0.3)'
                    }}
                    placeholder="Número"
                  />
                </div>

                {/* Total calculado */}
                <div className="sm:col-span-2">
                  <div 
                    className="rounded-xl p-4" 
                    style={{
                      background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.1), rgba(22, 101, 52, 0.15))',
                      border: '1.5px solid rgba(34, 197, 94, 0.3)',
                    }}
                  >
                    <p className="text-sm text-gray-300 mb-2 font-medium">Total de Aves</p>
                    <p className="text-2xl font-bold" style={{ color: '#22c55e' }}>
                      {(parseInt(formData.cantidadJavas || '0') * parseInt(formData.avesPorJava || '0'))} aves
                    </p>
                  </div>
                </div>

                {/* Campos de sexo si aplica */}
                {(() => {
                  const tipoActual = tiposAve.find(t => t.nombre === formData.tipoAve);
                  
                  if (tipoActual?.tieneSexo) {
                    const totalAves = parseInt(formData.cantidadJavas || '0') * parseInt(formData.avesPorJava || '0');
                    const machos = parseInt(formData.cantidadMachos || '0');
                    const hembras = parseInt(formData.cantidadHembras || '0');
                    const suma = machos + hembras;
                    const diferencia = totalAves - suma;
                    
                    return (
                      <>
                        <div>
                          <label className="block text-sm font-bold mb-2" style={{ color: '#ccaa00' }}>
                            Machos *
                          </label>
                          <input
                            type="number"
                            required
                            min="0"
                            max={totalAves}
                            value={formData.cantidadMachos}
                            onChange={(e) => {
                              const machos = parseInt(e.target.value) || 0;
                              const hembrasCalculadas = totalAves - machos;
                              setFormData({ 
                                ...formData, 
                                cantidadMachos: e.target.value,
                                cantidadHembras: hembrasCalculadas >= 0 ? hembrasCalculadas.toString() : '0'
                              });
                            }}
                            className="w-full px-3 py-3 rounded-lg text-sm text-white placeholder-gray-400"
                            style={{
                              background: 'rgba(255, 255, 255, 0.08)',
                              border: '1.5px solid rgba(59, 130, 246, 0.3)'
                            }}
                            placeholder="Número"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-bold mb-2" style={{ color: '#ccaa00' }}>
                            Hembras *
                          </label>
                          <input
                            type="number"
                            required
                            min="0"
                            max={totalAves}
                            value={formData.cantidadHembras}
                            onChange={(e) => setFormData({ ...formData, cantidadHembras: e.target.value })}
                            className="w-full px-3 py-3 rounded-lg text-sm text-white placeholder-gray-400"
                            style={{
                              background: 'rgba(255, 255, 255, 0.08)',
                              border: '1.5px solid rgba(236, 72, 153, 0.3)'
                            }}
                            placeholder="Auto"
                            readOnly
                          />
                        </div>

                        {/* Validación */}
                        <div className="sm:col-span-2">
                          <div 
                            className="rounded-xl p-4" 
                            style={{
                              background: diferencia === 0 && suma > 0 
                                ? 'linear-gradient(135deg, rgba(34, 197, 94, 0.1), rgba(22, 101, 52, 0.15))' 
                                : 'linear-gradient(135deg, rgba(239, 68, 68, 0.1), rgba(185, 28, 28, 0.15))',
                              border: diferencia === 0 && suma > 0 
                                ? '1.5px solid rgba(34, 197, 94, 0.3)' 
                                : '1.5px solid rgba(239, 68, 68, 0.3)',
                            }}
                          >
                            <p className="text-sm text-gray-300 mb-2">
                              {diferencia === 0 && suma > 0 ? '✓ Distribución correcta' : '⚠️ Distribución'}
                            </p>
                            <p 
                              className="text-lg font-bold"
                              style={{ color: diferencia === 0 && suma > 0 ? '#22c55e' : '#ef4444' }}
                            >
                              {machos}M + {hembras}H = {suma} aves
                            </p>
                          </div>
                        </div>
                      </>
                    );
                  }
                  return null;
                })()}

                {/* Fecha y Hora */}
                <div>
                  <label className="block text-sm font-bold mb-2" style={{ color: '#ccaa00' }}>
                    Fecha *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.fechaIngreso}
                    onChange={(e) => setFormData({ ...formData, fechaIngreso: e.target.value })}
                    className="w-full px-3 py-3 rounded-lg text-sm text-white"
                    style={{
                      background: 'rgba(255, 255, 255, 0.08)',
                      border: '1.5px solid rgba(204, 170, 0, 0.3)'
                    }}
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold mb-2" style={{ color: '#ccaa00' }}>
                    Hora *
                  </label>
                  <input
                    type="time"
                    required
                    value={formData.horaIngreso}
                    onChange={(e) => setFormData({ ...formData, horaIngreso: e.target.value })}
                    className="w-full px-3 py-3 rounded-lg text-sm text-white"
                    style={{
                      background: 'rgba(255, 255, 255, 0.08)',
                      border: '1.5px solid rgba(204, 170, 0, 0.3)'
                    }}
                  />
                </div>
              </div>

              {/* Botones */}
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-4 sm:pt-6 mt-4 border-t" style={{ borderColor: 'rgba(204, 170, 0, 0.2)' }}>
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="w-full sm:w-1/2 px-4 py-3 rounded-lg text-sm font-bold transition-all hover:scale-105"
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
                  className="w-full sm:w-1/2 px-4 py-3 rounded-lg text-sm font-bold transition-all hover:scale-105 shadow-lg"
                  style={{
                    background: 'linear-gradient(135deg, #0d4a24, #166534, #b8941e, #ccaa00)',
                    color: '#ffffff',
                    boxShadow: '0 10px 30px rgba(204, 170, 0, 0.4)'
                  }}
                >
                  {editingAve ? 'Actualizar' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Agregar Tipo de Ave - Responsive */}
      {isAddTipoModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4" style={{ background: 'rgba(0, 0, 0, 0.85)' }}>
          <div 
            className="backdrop-blur-2xl rounded-xl sm:rounded-2xl w-full max-w-6xl max-h-[95vh] overflow-hidden mx-2"
            style={{
              background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.7) 0%, rgba(13, 74, 36, 0.3) 50%, rgba(0, 0, 0, 0.7) 100%)',
              border: '2px solid rgba(204, 170, 0, 0.3)',
              boxShadow: '0 20px 40px -12px rgba(0, 0, 0, 0.8), 0 0 80px rgba(204, 170, 0, 0.15)'
            }}
          >
            {/* Header */}
            <div 
              className="px-4 sm:px-6 py-4 border-b"
              style={{
                background: 'linear-gradient(135deg, rgba(204, 170, 0, 0.15), rgba(0, 0, 0, 0.4))',
                borderColor: 'rgba(204, 170, 0, 0.2)'
              }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{
                      background: 'linear-gradient(135deg, #ccaa00, #b8941e)',
                      boxShadow: '0 10px 30px rgba(204, 170, 0, 0.4)'
                    }}
                  >
                    <Bird className="w-5 h-5 sm:w-6 sm:h-6 text-black" />
                  </div>
                  <div>
                    <h2 className="text-lg sm:text-xl font-bold text-white">Gestión de Tipos de Ave</h2>
                    <p className="text-xs sm:text-sm text-gray-300 hidden sm:block">Configure los tipos de aves</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setIsAddTipoModalOpen(false);
                    setNuevoTipoForm({ nombre: '', tieneSexo: true, tieneVariedad: false, variedades: '', color: '#22c55e' });
                  }}
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

            {/* Contenido */}
            <div className="overflow-y-auto p-4 sm:p-6" style={{ maxHeight: 'calc(95vh - 100px)' }}>
              <div className="flex flex-col lg:flex-row gap-4 sm:gap-6">
                {/* Formulario */}
                <div className="lg:w-2/5">
                  <div 
                    className="backdrop-blur-xl rounded-xl p-4 sm:p-6"
                    style={{
                      background: 'linear-gradient(135deg, rgba(204, 170, 0, 0.12), rgba(0, 0, 0, 0.4))',
                      border: '1px solid rgba(204, 170, 0, 0.25)'
                    }}
                  >
                    <div className="flex items-center gap-3 mb-4">
                      {editingTipo ? (
                        <>
                          <div 
                            className="w-8 h-8 rounded-lg flex items-center justify-center"
                            style={{ background: 'rgba(245, 158, 11, 0.2)', border: '1px solid rgba(245, 158, 11, 0.4)' }}
                          >
                            <Edit2 className="w-4 h-4" style={{ color: '#f59e0b' }} />
                          </div>
                          <h3 className="text-base font-bold" style={{ color: '#f59e0b' }}>Editar Tipo</h3>
                        </>
                      ) : (
                        <>
                          <div 
                            className="w-8 h-8 rounded-lg flex items-center justify-center"
                            style={{ background: 'rgba(34, 197, 94, 0.2)', border: '1px solid rgba(34, 197, 94, 0.4)' }}
                          >
                            <Plus className="w-4 h-4" style={{ color: '#22c55e' }} />
                          </div>
                          <h3 className="text-base font-bold" style={{ color: '#22c55e' }}>Nuevo Tipo</h3>
                        </>
                      )}
                    </div>

                    <form onSubmit={(e) => {
                      e.preventDefault();
                      
                      if (editingTipo) {
                        const tipoActualizado: TipoAve = {
                          id: editingTipo.id,
                          nombre: nuevoTipoForm.nombre.trim(),
                          tieneSexo: nuevoTipoForm.tieneSexo,
                          tieneVariedad: nuevoTipoForm.tieneVariedad,
                          variedades: nuevoTipoForm.tieneVariedad ? nuevoTipoForm.variedades.split(',').map(v => v.trim()) : undefined,
                          color: nuevoTipoForm.color
                        };
                        updateTipoAve(tipoActualizado);
                        setEditingTipo(null);
                        setNuevoTipoForm({ nombre: '', tieneSexo: true, tieneVariedad: false, variedades: '', color: '#22c55e' });
                      } else {
                        const nombreNormalizado = nuevoTipoForm.nombre.trim().toLowerCase();
                        const existe = tiposAve.some(t => t.nombre.toLowerCase() === nombreNormalizado);
                        
                        if (existe) {
                          alert(`El tipo "${nuevoTipoForm.nombre}" ya existe.`);
                          return;
                        }
                        
                        const nuevoTipo: TipoAve = {
                          id: Date.now().toString(),
                          nombre: nuevoTipoForm.nombre.trim(),
                          tieneSexo: nuevoTipoForm.tieneSexo,
                          tieneVariedad: nuevoTipoForm.tieneVariedad,
                          variedades: nuevoTipoForm.tieneVariedad ? nuevoTipoForm.variedades.split(',').map(v => v.trim()) : undefined,
                          color: nuevoTipoForm.color
                        };
                        addTipoAve(nuevoTipo);
                        setNuevoTipoForm({ nombre: '', tieneSexo: true, tieneVariedad: false, variedades: '', color: '#22c55e' });
                      }
                    }} className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium mb-2 text-white">Nombre *</label>
                        <input
                          type="text"
                          required
                          value={nuevoTipoForm.nombre}
                          onChange={(e) => setNuevoTipoForm({ ...nuevoTipoForm, nombre: e.target.value })}
                          className="w-full px-3 py-2.5 rounded-lg text-sm text-white placeholder-gray-400"
                          style={{
                            background: 'rgba(255, 255, 255, 0.05)',
                            border: '1px solid rgba(255, 255, 255, 0.1)'
                          }}
                          placeholder="Ej: Codorniz, Ganso"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2 text-white">Color</label>
                        <div className="flex gap-2">
                          <input
                            type="color"
                            value={nuevoTipoForm.color}
                            onChange={(e) => setNuevoTipoForm({ ...nuevoTipoForm, color: e.target.value })}
                            className="w-12 h-10 rounded-lg cursor-pointer flex-shrink-0"
                            style={{ border: '1px solid rgba(255, 255, 255, 0.2)' }}
                          />
                          <input
                            type="text"
                            value={nuevoTipoForm.color}
                            onChange={(e) => setNuevoTipoForm({ ...nuevoTipoForm, color: e.target.value })}
                            className="flex-1 px-3 py-2.5 rounded-lg text-sm text-white"
                            style={{
                              background: 'rgba(255, 255, 255, 0.05)',
                              border: '1px solid rgba(255, 255, 255, 0.1)'
                            }}
                            placeholder="#22c55e"
                          />
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-center gap-3 p-3 rounded-lg" style={{ background: 'rgba(255, 255, 255, 0.05)' }}>
                          <input
                            type="checkbox"
                            id="tieneSexo"
                            checked={nuevoTipoForm.tieneSexo}
                            onChange={(e) => setNuevoTipoForm({ ...nuevoTipoForm, tieneSexo: e.target.checked, tieneVariedad: e.target.checked ? false : nuevoTipoForm.tieneVariedad })}
                            className="w-5 h-5 cursor-pointer"
                          />
                          <label htmlFor="tieneSexo" className="text-sm text-white cursor-pointer">
                            Tiene sexo (Macho/Hembra)
                          </label>
                        </div>

                        <div className="flex items-center gap-3 p-3 rounded-lg" style={{ background: 'rgba(255, 255, 255, 0.05)' }}>
                          <input
                            type="checkbox"
                            id="tieneVariedad"
                            checked={nuevoTipoForm.tieneVariedad}
                            onChange={(e) => setNuevoTipoForm({ ...nuevoTipoForm, tieneVariedad: e.target.checked, tieneSexo: e.target.checked ? false : nuevoTipoForm.tieneSexo })}
                            className="w-5 h-5 cursor-pointer"
                          />
                          <label htmlFor="tieneVariedad" className="text-sm text-white cursor-pointer">
                            Tiene variedades
                          </label>
                        </div>
                      </div>

                      {nuevoTipoForm.tieneVariedad && (
                        <div>
                          <label className="block text-sm font-medium mb-2 text-white">Variedades (separadas por comas)</label>
                          <input
                            type="text"
                            value={nuevoTipoForm.variedades}
                            onChange={(e) => setNuevoTipoForm({ ...nuevoTipoForm, variedades: e.target.value })}
                            className="w-full px-3 py-2.5 rounded-lg text-sm text-white placeholder-gray-400"
                            style={{
                              background: 'rgba(255, 255, 255, 0.05)',
                              border: '1px solid rgba(255, 255, 255, 0.1)'
                            }}
                            placeholder="Blancas, Negras, Pintadas"
                          />
                        </div>
                      )}

                      <button
                        type="submit"
                        className="w-full px-4 py-3 rounded-lg text-sm font-bold transition-all hover:scale-105 flex items-center justify-center gap-2"
                        style={{
                          background: editingTipo ? 'linear-gradient(135deg, #f59e0b, #d97706)' : 'linear-gradient(135deg, #0d4a24, #166534, #b8941e, #ccaa00)',
                          color: 'white'
                        }}
                      >
                        {editingTipo ? (
                          <>
                            <Edit2 className="w-4 h-4" />
                            Actualizar
                          </>
                        ) : (
                          <>
                            <Plus className="w-4 h-4" />
                            Agregar
                          </>
                        )}
                      </button>
                      
                      {editingTipo && (
                        <button
                          type="button"
                          onClick={() => {
                            setEditingTipo(null);
                            setNuevoTipoForm({ nombre: '', tieneSexo: true, tieneVariedad: false, variedades: '', color: '#22c55e' });
                          }}
                          className="w-full px-4 py-3 rounded-lg text-sm font-medium transition-all hover:scale-105"
                          style={{
                            background: 'rgba(255, 255, 255, 0.1)',
                            color: '#ffffff',
                            border: '1px solid rgba(255, 255, 255, 0.2)'
                          }}
                        >
                          Cancelar
                        </button>
                      )}
                    </form>
                  </div>
                </div>

                {/* Lista de tipos */}
                <div className="lg:w-3/5">
                  <div className="backdrop-blur-xl rounded-xl p-4 sm:p-6 h-full" style={{
                    background: 'rgba(0, 0, 0, 0.3)',
                    border: '1px solid rgba(255, 255, 255, 0.1)'
                  }}>
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-base font-bold text-white">Tipos Registrados</h3>
                      <span className="text-sm" style={{ color: '#ccaa00' }}>{tiposAve.length}</span>
                    </div>
                    
                    <div className="space-y-3 max-h-[300px] sm:max-h-[400px] overflow-y-auto">
                      {tiposAve.map((tipo) => (
                        <div 
                          key={tipo.id}
                          className="p-3 sm:p-4 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                          style={{
                            background: `linear-gradient(135deg, ${tipo.color}20, ${tipo.color}10)`,
                            border: `1px solid ${tipo.color}40`
                          }}
                        >
                          <div className="flex items-center gap-3 flex-1">
                            <div 
                              className="w-4 h-4 rounded-full flex-shrink-0"
                              style={{ background: tipo.color }}
                            />
                            <div className="flex-1 min-w-0">
                              <p className="font-bold text-white text-sm truncate">{tipo.nombre}</p>
                              <p className="text-xs text-gray-400 truncate">
                                {tipo.tieneSexo && 'Con sexo'}
                                {tipo.tieneVariedad && `Variedades: ${tipo.variedades?.join(', ')}`}
                              </p>
                            </div>
                          </div>
                          <div className="flex gap-2 self-end sm:self-center">
                            <button
                              onClick={() => {
                                setEditingTipo(tipo);
                                setNuevoTipoForm({
                                  nombre: tipo.nombre,
                                  tieneSexo: tipo.tieneSexo,
                                  tieneVariedad: tipo.tieneVariedad,
                                  variedades: tipo.variedades?.join(', ') || '',
                                  color: tipo.color
                                });
                              }}
                              className="p-2 rounded-lg transition-all hover:scale-110"
                              style={{
                                background: 'rgba(245, 158, 11, 0.2)',
                                border: '1px solid rgba(245, 158, 11, 0.3)'
                              }}
                            >
                              <Edit2 className="w-4 h-4" style={{ color: '#f59e0b' }} />
                            </button>
                            <button
                              onClick={() => {
                                if (confirm(`¿Eliminar tipo "${tipo.nombre}"?`)) {
                                  deleteTipoAve(tipo.id);
                                }
                              }}
                              className="p-2 rounded-lg transition-all hover:scale-110"
                              style={{
                                background: 'rgba(239, 68, 68, 0.2)',
                                border: '1px solid rgba(239, 68, 68, 0.3)'
                              }}
                            >
                              <Trash2 className="w-4 h-4" style={{ color: '#ef4444' }} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div 
              className="px-4 sm:px-6 py-4 border-t"
              style={{ 
                background: 'rgba(0, 0, 0, 0.4)',
                borderColor: 'rgba(204, 170, 0, 0.2)'
              }}
            >
              <button
                onClick={() => {
                  setIsAddTipoModalOpen(false);
                  setNuevoTipoForm({ nombre: '', tieneSexo: true, tieneVariedad: false, variedades: '', color: '#22c55e' });
                }}
                className="w-full px-4 py-3 rounded-lg font-bold transition-all hover:scale-105"
                style={{ 
                  background: 'linear-gradient(135deg, #0d4a24, #166534, #b8941e, #ccaa00)',
                  color: 'white'
                }}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Presentaciones */}
      <ModalPresentaciones
        isOpen={isPresentacionesModalOpen}
        onClose={() => {
          setIsPresentacionesModalOpen(false);
          setEditingPresentacion(null);
          setNuevaPresentacionForm({ tipoAve: 'Pollo', nombre: '', mermaKg: '', esVariable: false });
        }}
        tiposAve={tiposAve}
        presentaciones={presentaciones}
        setPresentaciones={setPresentaciones}
        editingPresentacion={editingPresentacion}
        setEditingPresentacion={setEditingPresentacion}
        nuevaPresentacionForm={nuevaPresentacionForm}
        setNuevaPresentacionForm={setNuevaPresentacionForm}
        filtroPresentacionTipo={filtroPresentacionTipo}
        setFiltroPresentacionTipo={setFiltroPresentacionTipo}
      />
    </div>
  );
}