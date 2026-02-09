import { useState } from 'react';
import { Plus, Edit2, Trash2, X, Bird, PackageOpen } from 'lucide-react';
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

export function AvesSecretaria() {
  const { tiposAve, addTipoAve, updateTipoAve, deleteTipoAve } = useApp();
  
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

  const presentacionesFiltradas = filtroPresentacionTipo === 'all' 
    ? presentaciones 
    : presentaciones.filter(p => p.tipoAve === filtroPresentacionTipo);

  const handleDeleteTipo = (id: string) => {
    if (confirm('¿Está seguro de eliminar este tipo de ave?')) {
      deleteTipoAve(id);
    }
  };

  const handleEditTipo = (tipo: TipoAve) => {
    setEditingTipo(tipo);
    setNuevoTipoForm({
      nombre: tipo.nombre,
      tieneSexo: tipo.tieneSexo,
      tieneVariedad: tipo.tieneVariedad,
      variedades: tipo.variedades ? tipo.variedades.join(', ') : '',
      color: tipo.color
    });
    setIsAddTipoModalOpen(true);
  };

  const handleSubmitTipo = (e: React.FormEvent) => {
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
    setIsAddTipoModalOpen(false);
  };

  const handleSubmitPresentacion = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingPresentacion) {
      setPresentaciones(presentaciones.map(p =>
        p.id === editingPresentacion.id
          ? {
              ...p,
              tipoAve: nuevaPresentacionForm.tipoAve,
              nombre: nuevaPresentacionForm.nombre,
              mermaKg: parseFloat(nuevaPresentacionForm.mermaKg),
              esVariable: nuevaPresentacionForm.esVariable
            }
          : p
      ));
      setEditingPresentacion(null);
    } else {
      const nuevaPresentacion: Presentacion = {
        id: Date.now().toString(),
        tipoAve: nuevaPresentacionForm.tipoAve,
        nombre: nuevaPresentacionForm.nombre,
        mermaKg: parseFloat(nuevaPresentacionForm.mermaKg),
        esVariable: nuevaPresentacionForm.esVariable
      };
      setPresentaciones([...presentaciones, nuevaPresentacion]);
    }
    
    setNuevaPresentacionForm({ tipoAve: 'Pollo', nombre: '', mermaKg: '', esVariable: false });
  };

  const handleDeletePresentacion = (id: string) => {
    if (confirm('¿Está seguro de eliminar esta presentación?')) {
      setPresentaciones(presentaciones.filter(p => p.id !== id));
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">Gestión de Aves</h1>
          <p className="text-sm text-gray-400">Tipos de aves y presentaciones de la avícola</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => setIsAddTipoModalOpen(true)}
            className="px-4 py-2.5 rounded-lg text-sm font-bold transition-all hover:scale-105 flex items-center gap-2"
            style={{
              background: 'linear-gradient(to right, #0d4a24, #166534, #b8941e, #ccaa00)',
              color: 'white',
              boxShadow: '0 4px 12px rgba(204, 170, 0, 0.4)'
            }}
          >
            <Plus className="w-4 h-4" />
            Agregar Tipos de Aves
          </button>
          <button
            onClick={() => setIsPresentacionesModalOpen(true)}
            className="px-4 py-2.5 rounded-lg text-sm font-bold transition-all hover:scale-105 flex items-center gap-2"
            style={{
              background: 'linear-gradient(to right, #0d4a24, #166534, #b8941e, #ccaa00)',
              color: 'white',
              boxShadow: '0 4px 12px rgba(204, 170, 0, 0.4)'
            }}
          >
            <PackageOpen className="w-4 h-4" />
            Agregar Presentaciones
          </button>
        </div>
      </div>

      {/* Tipos de Aves Section */}
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
        <h2 className="text-xl font-bold text-white mb-4">Tipos de Aves</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {tiposAve.map((tipo) => (
            <div
              key={tipo.id}
              className="bg-zinc-800/50 border rounded-lg p-4 hover:bg-zinc-800/70 transition-all"
              style={{ borderColor: `${tipo.color}40` }}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center"
                    style={{ background: `${tipo.color}20`, border: `1px solid ${tipo.color}40` }}
                  >
                    <Bird className="w-5 h-5" style={{ color: tipo.color }} />
                  </div>
                  <div>
                    <h3 className="text-white font-bold">{tipo.nombre}</h3>
                    <p className="text-xs text-gray-400">
                      {tipo.tieneSexo ? 'Con sexo' : tipo.tieneVariedad ? 'Con variedad' : 'Simple'}
                    </p>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => handleEditTipo(tipo)}
                    className="p-2 rounded-lg hover:bg-amber-500/20 transition-colors"
                  >
                    <Edit2 className="w-4 h-4 text-amber-400" />
                  </button>
                  <button
                    onClick={() => handleDeleteTipo(tipo.id)}
                    className="p-2 rounded-lg hover:bg-red-500/20 transition-colors"
                  >
                    <Trash2 className="w-4 h-4 text-red-400" />
                  </button>
                </div>
              </div>
              
              {tipo.tieneVariedad && tipo.variedades && (
                <div className="mt-2">
                  <p className="text-xs text-gray-400 mb-1">Variedades:</p>
                  <div className="flex flex-wrap gap-1">
                    {tipo.variedades.map((v, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-1 rounded text-xs"
                        style={{ background: `${tipo.color}20`, color: tipo.color }}
                      >
                        {v}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Presentaciones Section */}
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-white">Presentaciones</h2>
          <select
            value={filtroPresentacionTipo}
            onChange={(e) => setFiltroPresentacionTipo(e.target.value)}
            className="px-4 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white text-sm"
          >
            <option value="all">Todas</option>
            {tiposAve.map((tipo) => (
              <option key={tipo.id} value={tipo.nombre}>{tipo.nombre}</option>
            ))}
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-zinc-800/50 border-b border-zinc-700">
                <th className="text-left px-4 py-3 text-amber-400 font-bold text-sm">Tipo de Ave</th>
                <th className="text-left px-4 py-3 text-amber-400 font-bold text-sm">Presentación</th>
                <th className="text-right px-4 py-3 text-amber-400 font-bold text-sm">Merma (kg)</th>
                <th className="text-center px-4 py-3 text-amber-400 font-bold text-sm">Tipo</th>
                <th className="text-center px-4 py-3 text-amber-400 font-bold text-sm">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {presentacionesFiltradas.map((pres) => (
                <tr key={pres.id} className="border-b border-zinc-800 hover:bg-zinc-800/30 transition-colors">
                  <td className="px-4 py-3 text-white">{pres.tipoAve}</td>
                  <td className="px-4 py-3 text-white">{pres.nombre}</td>
                  <td className="px-4 py-3 text-right text-green-400 font-medium">{pres.mermaKg.toFixed(2)}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`px-2 py-1 rounded text-xs ${pres.esVariable ? 'bg-blue-500/20 text-blue-400' : 'bg-gray-500/20 text-gray-400'}`}>
                      {pres.esVariable ? 'Variable' : 'Fija'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => {
                          setEditingPresentacion(pres);
                          setNuevaPresentacionForm({
                            tipoAve: pres.tipoAve,
                            nombre: pres.nombre,
                            mermaKg: pres.mermaKg.toString(),
                            esVariable: pres.esVariable
                          });
                          setIsPresentacionesModalOpen(true);
                        }}
                        className="p-2 rounded-lg hover:bg-amber-500/20 transition-colors"
                      >
                        <Edit2 className="w-4 h-4 text-amber-400" />
                      </button>
                      <button
                        onClick={() => handleDeletePresentacion(pres.id)}
                        className="p-2 rounded-lg hover:bg-red-500/20 transition-colors"
                      >
                        <Trash2 className="w-4 h-4 text-red-400" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Agregar Tipo */}
      {isAddTipoModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0, 0, 0, 0.85)' }}>
          <div className="bg-zinc-900 border border-zinc-700 rounded-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white">
                {editingTipo ? 'Editar Tipo de Ave' : 'Nuevo Tipo de Ave'}
              </h3>
              <button
                onClick={() => {
                  setIsAddTipoModalOpen(false);
                  setEditingTipo(null);
                  setNuevoTipoForm({ nombre: '', tieneSexo: true, tieneVariedad: false, variedades: '', color: '#22c55e' });
                }}
                className="p-2 rounded-lg hover:bg-red-500/20 transition-colors"
              >
                <X className="w-5 h-5 text-red-400" />
              </button>
            </div>

            <form onSubmit={handleSubmitTipo} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-white">Nombre *</label>
                <input
                  type="text"
                  required
                  value={nuevoTipoForm.nombre}
                  onChange={(e) => setNuevoTipoForm({ ...nuevoTipoForm, nombre: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-lg bg-zinc-800 border border-zinc-700 text-white"
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
                    className="w-12 h-10 rounded-lg cursor-pointer"
                  />
                  <input
                    type="text"
                    value={nuevoTipoForm.color}
                    onChange={(e) => setNuevoTipoForm({ ...nuevoTipoForm, color: e.target.value })}
                    className="flex-1 px-3 py-2.5 rounded-lg bg-zinc-800 border border-zinc-700 text-white"
                    placeholder="#22c55e"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-3">
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

                <div className="flex items-center gap-3">
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
                    className="w-full px-3 py-2.5 rounded-lg bg-zinc-800 border border-zinc-700 text-white"
                    placeholder="Ej: Roja, Blanca, Negra"
                  />
                </div>
              )}

              <button
                type="submit"
                className="w-full px-4 py-3 rounded-lg font-bold transition-all hover:scale-105"
                style={{
                  background: 'linear-gradient(to right, #0d4a24, #166534, #b8941e, #ccaa00)',
                  color: 'white'
                }}
              >
                {editingTipo ? 'Actualizar' : 'Agregar'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal Agregar Presentación */}
      {isPresentacionesModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0, 0, 0, 0.85)' }}>
          <div className="bg-zinc-900 border border-zinc-700 rounded-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white">
                {editingPresentacion ? 'Editar Presentación' : 'Nueva Presentación'}
              </h3>
              <button
                onClick={() => {
                  setIsPresentacionesModalOpen(false);
                  setEditingPresentacion(null);
                  setNuevaPresentacionForm({ tipoAve: 'Pollo', nombre: '', mermaKg: '', esVariable: false });
                }}
                className="p-2 rounded-lg hover:bg-red-500/20 transition-colors"
              >
                <X className="w-5 h-5 text-red-400" />
              </button>
            </div>

            <form onSubmit={handleSubmitPresentacion} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-white">Tipo de Ave *</label>
                <select
                  value={nuevaPresentacionForm.tipoAve}
                  onChange={(e) => setNuevaPresentacionForm({ ...nuevaPresentacionForm, tipoAve: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-lg bg-zinc-800 border border-zinc-700 text-white"
                  required
                >
                  {tiposAve.map((tipo) => (
                    <option key={tipo.id} value={tipo.nombre}>{tipo.nombre}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-white">Nombre de Presentación *</label>
                <input
                  type="text"
                  required
                  value={nuevaPresentacionForm.nombre}
                  onChange={(e) => setNuevaPresentacionForm({ ...nuevaPresentacionForm, nombre: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-lg bg-zinc-800 border border-zinc-700 text-white"
                  placeholder="Ej: Vivo, Pelado, Destripado"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-white">Merma (kg) *</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={nuevaPresentacionForm.mermaKg}
                  onChange={(e) => setNuevaPresentacionForm({ ...nuevaPresentacionForm, mermaKg: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-lg bg-zinc-800 border border-zinc-700 text-white"
                  placeholder="0.00"
                />
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="esVariable"
                  checked={nuevaPresentacionForm.esVariable}
                  onChange={(e) => setNuevaPresentacionForm({ ...nuevaPresentacionForm, esVariable: e.target.checked })}
                  className="w-5 h-5 cursor-pointer"
                />
                <label htmlFor="esVariable" className="text-sm text-white cursor-pointer">
                  Merma variable (puede cambiar)
                </label>
              </div>

              <button
                type="submit"
                className="w-full px-4 py-3 rounded-lg font-bold transition-all hover:scale-105"
                style={{
                  background: 'linear-gradient(to right, #0d4a24, #166534, #b8941e, #ccaa00)',
                  color: 'white'
                }}
              >
                {editingPresentacion ? 'Actualizar' : 'Agregar'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
