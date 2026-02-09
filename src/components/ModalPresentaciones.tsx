import { Plus, Edit2, Trash2, X, PackageOpen, Scale, Check, Box } from 'lucide-react';

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

interface ModalPresentacionesProps {
  isOpen: boolean;
  onClose: () => void;
  tiposAve: TipoAve[];
  presentaciones: Presentacion[];
  setPresentaciones: (presentaciones: Presentacion[]) => void;
  editingPresentacion: Presentacion | null;
  setEditingPresentacion: (presentacion: Presentacion | null) => void;
  nuevaPresentacionForm: {
    tipoAve: string;
    nombre: string;
    mermaKg: string;
    esVariable: boolean;
  };
  setNuevaPresentacionForm: (form: any) => void;
  filtroPresentacionTipo: string;
  setFiltroPresentacionTipo: (tipo: string) => void;
}

export function ModalPresentaciones({
  isOpen,
  onClose,
  tiposAve,
  presentaciones,
  setPresentaciones,
  editingPresentacion,
  setEditingPresentacion,
  nuevaPresentacionForm,
  setNuevaPresentacionForm,
  filtroPresentacionTipo,
  setFiltroPresentacionTipo
}: ModalPresentacionesProps) {
  if (!isOpen) return null;

  const presentacionesFiltradas = filtroPresentacionTipo === 'all' 
    ? presentaciones 
    : presentaciones.filter(p => p.tipoAve === filtroPresentacionTipo);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingPresentacion) {
      // Modo edición
      const presentacionActualizada: Presentacion = {
        id: editingPresentacion.id,
        tipoAve: nuevaPresentacionForm.tipoAve,
        nombre: nuevaPresentacionForm.nombre.trim(),
        mermaKg: parseFloat(nuevaPresentacionForm.mermaKg),
        esVariable: nuevaPresentacionForm.esVariable
      };
      setPresentaciones(presentaciones.map(p => p.id === editingPresentacion.id ? presentacionActualizada : p));
      setEditingPresentacion(null);
      setNuevaPresentacionForm({ tipoAve: 'Pollo', nombre: '', mermaKg: '', esVariable: false });
    } else {
      // Validar que no exista ya una presentación con ese nombre para el mismo tipo
      const nombreNormalizado = nuevaPresentacionForm.nombre.trim().toLowerCase();
      const existe = presentaciones.some(
        p => p.nombre.toLowerCase() === nombreNormalizado && p.tipoAve === nuevaPresentacionForm.tipoAve
      );
      
      if (existe) {
        alert(`La presentación "${nuevaPresentacionForm.nombre}" ya está registrada para ${nuevaPresentacionForm.tipoAve}.`);
        return;
      }
      
      const nuevaPresentacion: Presentacion = {
        id: Date.now().toString(),
        tipoAve: nuevaPresentacionForm.tipoAve,
        nombre: nuevaPresentacionForm.nombre.trim(),
        mermaKg: parseFloat(nuevaPresentacionForm.mermaKg),
        esVariable: nuevaPresentacionForm.esVariable
      };
      setPresentaciones([...presentaciones, nuevaPresentacion]);
      setNuevaPresentacionForm({ tipoAve: 'Pollo', nombre: '', mermaKg: '', esVariable: false });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4" style={{ background: 'rgba(0, 0, 0, 0.85)' }}>
      <div 
        className="backdrop-blur-2xl rounded-2xl sm:rounded-3xl w-full max-w-6xl max-h-[98vh] sm:max-h-[95vh] overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.7) 0%, rgba(13, 74, 36, 0.3) 50%, rgba(0, 0, 0, 0.7) 100%)',
          border: '2px solid rgba(204, 170, 0, 0.3)',
          boxShadow: '0 30px 60px -12px rgba(0, 0, 0, 0.8), 0 0 100px rgba(204, 170, 0, 0.15)'
        }}
      >
        {/* Header Responsive */}
        <div 
          className="px-4 sm:px-6 md:px-8 py-4 sm:py-5 md:py-6 border-b"
          style={{
            background: 'linear-gradient(135deg, rgba(204, 170, 0, 0.15), rgba(0, 0, 0, 0.4))',
            borderColor: 'rgba(204, 170, 0, 0.2)'
          }}
        >
          <div className="flex items-center justify-between gap-2 sm:gap-4">
            <div className="flex items-center gap-2 sm:gap-3 md:gap-4 flex-1 min-w-0">
              <div 
                className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-xl sm:rounded-2xl flex items-center justify-center flex-shrink-0"
                style={{
                  background: 'linear-gradient(135deg, #ccaa00, #b8941e)',
                  boxShadow: '0 10px 30px rgba(204, 170, 0, 0.4)'
                }}
              >
                <PackageOpen className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 text-black" />
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="text-lg sm:text-2xl md:text-3xl font-bold text-white mb-0 sm:mb-1 truncate">Gestión de Presentaciones</h2>
                <p className="text-xs sm:text-sm text-gray-300 hidden sm:block">Configure presentaciones con merma por ave</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 sm:p-3 rounded-lg sm:rounded-xl transition-all hover:scale-110 hover:rotate-90 flex-shrink-0"
              style={{ 
                background: 'rgba(239, 68, 68, 0.2)',
                border: '1px solid rgba(239, 68, 68, 0.3)'
              }}
            >
              <X className="w-5 h-5 sm:w-6 sm:h-6" style={{ color: '#ef4444' }} />
            </button>
          </div>
        </div>

        {/* Contenido Responsive */}
        <div className="overflow-y-auto p-3 sm:p-5 md:p-6 lg:p-8" style={{ maxHeight: 'calc(98vh - 140px)' }}>
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 sm:gap-6 lg:gap-8">
            {/* Formulario - Responsive */}
            <div className="lg:col-span-2">
              <div 
                className="backdrop-blur-xl rounded-xl sm:rounded-2xl p-4 sm:p-5 md:p-6 h-full"
                style={{
                  background: 'linear-gradient(135deg, rgba(204, 170, 0, 0.12), rgba(0, 0, 0, 0.4))',
                  border: '1px solid rgba(204, 170, 0, 0.25)',
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
                }}
              >
                {/* Título del Formulario */}
                <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-5 md:mb-6">
                  {editingPresentacion ? (
                    <>
                      <div 
                        className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl flex items-center justify-center"
                        style={{ background: 'rgba(245, 158, 11, 0.2)', border: '1px solid rgba(245, 158, 11, 0.4)' }}
                      >
                        <Edit2 className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: '#f59e0b' }} />
                      </div>
                      <h3 className="text-base sm:text-lg md:text-xl font-bold" style={{ color: '#f59e0b' }}>Editar Presentación</h3>
                    </>
                  ) : (
                    <>
                      <div 
                        className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl flex items-center justify-center"
                        style={{ background: 'rgba(34, 197, 94, 0.2)', border: '1px solid rgba(34, 197, 94, 0.4)' }}
                      >
                        <Plus className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: '#22c55e' }} />
                      </div>
                      <h3 className="text-base sm:text-lg md:text-xl font-bold" style={{ color: '#22c55e' }}>Nueva Presentación</h3>
                    </>
                  )}
                </div>
                
                <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4 md:space-y-5">
                  {/* Tipo de Ave */}
                  <div>
                    <label className="block text-xs sm:text-sm font-bold mb-2 sm:mb-3" style={{ color: '#ccaa00' }}>
                      <div className="flex items-center gap-2">
                        <Box className="w-3 h-3 sm:w-4 sm:h-4" />
                        Tipo de Ave *
                      </div>
                    </label>
                    <select
                      required
                      value={nuevaPresentacionForm.tipoAve}
                      onChange={(e) => setNuevaPresentacionForm({ ...nuevaPresentacionForm, tipoAve: e.target.value })}
                      className="w-full px-3 py-3 sm:px-4 sm:py-4 rounded-lg sm:rounded-xl text-sm sm:text-base text-white transition-all focus:ring-2 focus:ring-offset-2"
                      style={{
                        background: 'rgba(255, 255, 255, 0.08)',
                        border: '1.5px solid rgba(204, 170, 0, 0.3)',
                        outlineColor: '#ccaa00',
                        ringColor: '#ccaa00',
                        ringOffsetColor: 'transparent'
                      }}
                    >
                      {tiposAve.map(tipo => (
                        <option key={tipo.id} value={tipo.nombre} style={{ background: '#1a1a1a', color: 'white' }}>
                          {tipo.nombre}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Nombre de Presentación */}
                  <div>
                    <label className="block text-xs sm:text-sm font-bold mb-2 sm:mb-3" style={{ color: '#ccaa00' }}>
                      <div className="flex items-center gap-2">
                        <PackageOpen className="w-3 h-3 sm:w-4 sm:h-4" />
                        Nombre de la Presentación *
                      </div>
                    </label>
                    <input
                      type="text"
                      required
                      value={nuevaPresentacionForm.nombre}
                      onChange={(e) => setNuevaPresentacionForm({ ...nuevaPresentacionForm, nombre: e.target.value })}
                      className="w-full px-3 py-3 sm:px-4 sm:py-4 rounded-lg sm:rounded-xl text-sm sm:text-base text-white placeholder-gray-400 transition-all focus:ring-2 focus:ring-offset-2"
                      style={{
                        background: 'rgba(255, 255, 255, 0.08)',
                        border: '1.5px solid rgba(204, 170, 0, 0.3)',
                        outlineColor: '#ccaa00',
                        ringColor: '#ccaa00',
                        ringOffsetColor: 'transparent'
                      }}
                      placeholder="Ej: Pelado, Destripado, Vivo"
                    />
                  </div>

                  {/* Merma por Unidad */}
                  <div>
                    <label className="block text-xs sm:text-sm font-bold mb-2 sm:mb-3" style={{ color: '#ccaa00' }}>
                      <div className="flex items-center gap-2">
                        <Scale className="w-3 h-3 sm:w-4 sm:h-4" />
                        Merma por Unidad (kg) *
                      </div>
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        required
                        min="0"
                        step="0.01"
                        value={nuevaPresentacionForm.mermaKg}
                        onChange={(e) => setNuevaPresentacionForm({ ...nuevaPresentacionForm, mermaKg: e.target.value })}
                        className="w-full px-3 py-3 sm:px-4 sm:py-4 rounded-lg sm:rounded-xl text-sm sm:text-base text-white placeholder-gray-400 transition-all focus:ring-2 focus:ring-offset-2"
                        style={{
                          background: 'rgba(255, 255, 255, 0.08)',
                          border: '1.5px solid rgba(204, 170, 0, 0.3)',
                          outlineColor: '#ccaa00',
                          ringColor: '#ccaa00',
                          ringOffsetColor: 'transparent'
                        }}
                        placeholder="Ej: 0.15, 0.20, 0"
                      />
                      <div 
                        className="absolute right-3 sm:right-4 top-1/2 transform -translate-y-1/2 px-2 sm:px-3 py-1 rounded-md sm:rounded-lg text-xs font-bold"
                        style={{ background: 'rgba(204, 170, 0, 0.2)', color: '#ccaa00' }}
                      >
                        KG
                      </div>
                    </div>
                    <p className="text-xs text-gray-400 mt-2 flex items-center gap-2">
                      <span>💡</span>
                      <span>Merma en kg por ave. Ej: 0.15 kg = 150 gramos</span>
                    </p>
                  </div>

                  {/* Checkbox Variable */}
                  <div 
                    className="flex items-center gap-2 sm:gap-3 p-3 sm:p-4 rounded-lg sm:rounded-xl cursor-pointer transition-all hover:scale-[1.01]" 
                    style={{ background: 'rgba(255, 255, 255, 0.05)', border: '1.5px solid rgba(204, 170, 0, 0.2)' }}
                    onClick={() => setNuevaPresentacionForm({ ...nuevaPresentacionForm, esVariable: !nuevaPresentacionForm.esVariable })}
                  >
                    <input
                      type="checkbox"
                      id="esVariable"
                      checked={nuevaPresentacionForm.esVariable}
                      onChange={(e) => setNuevaPresentacionForm({ ...nuevaPresentacionForm, esVariable: e.target.checked })}
                      className="w-4 h-4 sm:w-5 sm:h-5 cursor-pointer"
                      onClick={(e) => e.stopPropagation()}
                    />
                    <label htmlFor="esVariable" className="text-xs sm:text-sm text-white cursor-pointer flex-1 font-medium">
                      ¿La merma es variable? (Para presentación "Vivo")
                    </label>
                  </div>

                  {/* Calculadora Visual */}
                  {nuevaPresentacionForm.mermaKg && parseFloat(nuevaPresentacionForm.mermaKg) >= 0 && (
                    <div 
                      className="backdrop-blur-xl rounded-lg sm:rounded-xl p-3 sm:p-4 md:p-5"
                      style={{
                        background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.1), rgba(22, 101, 52, 0.15))',
                        border: '1.5px solid rgba(34, 197, 94, 0.3)'
                      }}
                    >
                      <p className="text-xs font-bold mb-2 sm:mb-3" style={{ color: '#22c55e' }}>
                        📊 CALCULADORA DE MERMA
                      </p>
                      <div className="grid grid-cols-2 gap-2 sm:gap-3 md:gap-4">
                        <div 
                          className="p-2 sm:p-3 rounded-lg"
                          style={{ background: 'rgba(0, 0, 0, 0.3)' }}
                        >
                          <p className="text-xs text-gray-400 mb-1">Merma por Ave</p>
                          <p className="text-lg sm:text-xl md:text-2xl font-bold" style={{ color: '#22c55e' }}>
                            {parseFloat(nuevaPresentacionForm.mermaKg).toFixed(2)}
                          </p>
                          <p className="text-xs text-gray-500">kilogramos {nuevaPresentacionForm.esVariable && '(variable)'}</p>
                        </div>
                        <div 
                          className="p-2 sm:p-3 rounded-lg"
                          style={{ background: 'rgba(0, 0, 0, 0.3)' }}
                        >
                          <p className="text-xs text-gray-400 mb-1">100 Aves</p>
                          <p className="text-lg sm:text-xl md:text-2xl font-bold text-white">
                            {(100 * parseFloat(nuevaPresentacionForm.mermaKg)).toFixed(2)}
                          </p>
                          <p className="text-xs text-gray-500">kilogramos</p>
                        </div>
                      </div>
                      <div className="mt-2 sm:mt-3 p-2 rounded-lg text-center" style={{ background: 'rgba(204, 170, 0, 0.1)' }}>
                        <p className="text-xs font-medium" style={{ color: '#ccaa00' }}>
                          500 aves = {(500 * parseFloat(nuevaPresentacionForm.mermaKg)).toFixed(2)} kg de merma
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Botones */}
                  <div className="space-y-2 sm:space-y-3 pt-2">
                    <button
                      type="submit"
                      className="w-full px-4 py-3 sm:px-6 sm:py-4 rounded-lg sm:rounded-xl text-sm sm:text-base font-bold transition-all hover:scale-[1.02] flex items-center justify-center gap-2 sm:gap-3 shadow-lg"
                      style={{
                        background: 'linear-gradient(135deg, #0d4a24, #166534, #b8941e, #ccaa00)',
                        color: 'white',
                        boxShadow: '0 10px 30px rgba(204, 170, 0, 0.4)'
                      }}
                    >
                      {editingPresentacion ? (
                        <>
                          <Check className="w-4 h-4 sm:w-5 sm:h-5" />
                          Actualizar
                        </>
                      ) : (
                        <>
                          <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
                          Agregar
                        </>
                      )}
                    </button>
                    
                    {editingPresentacion && (
                      <button
                        type="button"
                        onClick={() => {
                          setEditingPresentacion(null);
                          setNuevaPresentacionForm({ tipoAve: 'Pollo', nombre: '', mermaKg: '', esVariable: false });
                        }}
                        className="w-full px-4 py-3 sm:px-6 sm:py-4 rounded-lg sm:rounded-xl text-sm sm:text-base font-medium transition-all hover:scale-[1.02]"
                        style={{
                          background: 'rgba(255, 255, 255, 0.05)',
                          color: '#ffffff',
                          border: '1.5px solid rgba(255, 255, 255, 0.2)'
                        }}
                      >
                        Cancelar
                      </button>
                    )}
                  </div>
                </form>
              </div>
            </div>

            {/* Lista - Responsive */}
            <div className="lg:col-span-3">
              <div 
                className="backdrop-blur-xl rounded-xl sm:rounded-2xl p-4 sm:p-5 md:p-6"
                style={{
                  background: 'rgba(0, 0, 0, 0.4)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
                }}
              >
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 mb-4 sm:mb-5 md:mb-6">
                  <h3 className="text-base sm:text-lg md:text-xl font-bold text-white flex items-center gap-2">
                    <PackageOpen className="w-5 h-5 sm:w-6 sm:h-6" style={{ color: '#ccaa00' }} />
                    <span className="hidden sm:inline">Presentaciones Registradas</span>
                    <span className="sm:hidden">Registradas</span>
                    <span 
                      className="px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-xs sm:text-sm"
                      style={{ background: 'rgba(204, 170, 0, 0.2)', color: '#ccaa00' }}
                    >
                      {presentacionesFiltradas.length}
                    </span>
                  </h3>
                  <select
                    value={filtroPresentacionTipo}
                    onChange={(e) => setFiltroPresentacionTipo(e.target.value)}
                    className="w-full sm:w-auto px-3 py-2 sm:px-4 sm:py-2 rounded-lg sm:rounded-xl text-white text-xs sm:text-sm"
                    style={{
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(204, 170, 0, 0.3)'
                    }}
                  >
                    <option value="all" style={{ background: '#1a1a1a', color: 'white' }}>Todos</option>
                    {tiposAve.map(tipo => (
                      <option key={tipo.id} value={tipo.nombre} style={{ background: '#1a1a1a', color: 'white' }}>
                        {tipo.nombre}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="space-y-2 sm:space-y-3" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                  {presentacionesFiltradas.length === 0 && (
                    <div 
                      className="text-center py-8 sm:py-12 md:py-16 rounded-lg sm:rounded-xl"
                      style={{ background: 'rgba(255, 255, 255, 0.02)' }}
                    >
                      <div 
                        className="w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4"
                        style={{ background: 'rgba(204, 170, 0, 0.1)', border: '2px dashed rgba(204, 170, 0, 0.3)' }}
                      >
                        <PackageOpen className="w-7 h-7 sm:w-8 sm:h-8 md:w-10 md:h-10" style={{ color: '#ccaa00', opacity: 0.5 }} />
                      </div>
                      <p className="text-sm sm:text-base text-gray-400 font-medium mb-2">No hay presentaciones</p>
                      <p className="text-xs text-gray-500">Agrega una nueva presentación</p>
                    </div>
                  )}
                  
                  {presentacionesFiltradas.map((presentacion, index) => (
                    <div 
                      key={presentacion.id}
                      className="group p-3 sm:p-4 md:p-5 rounded-lg sm:rounded-xl transition-all hover:scale-[1.01]"
                      style={{
                        background: 'linear-gradient(135deg, rgba(204, 170, 0, 0.08), rgba(0, 0, 0, 0.3))',
                        border: '1.5px solid rgba(204, 170, 0, 0.25)',
                        boxShadow: '0 4px 15px rgba(0, 0, 0, 0.2)'
                      }}
                    >
                      <div className="flex items-center justify-between gap-2 sm:gap-3 md:gap-4">
                        <div className="flex items-center gap-2 sm:gap-3 md:gap-4 flex-1 min-w-0">
                          {/* Número índice */}
                          <div 
                            className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-lg sm:rounded-xl flex items-center justify-center font-bold text-sm sm:text-base md:text-xl flex-shrink-0"
                            style={{
                              background: 'linear-gradient(135deg, #ccaa00, #b8941e)',
                              color: '#000',
                              boxShadow: '0 4px 15px rgba(204, 170, 0, 0.3)'
                            }}
                          >
                            {index + 1}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-1 sm:gap-2 mb-1 sm:mb-2">
                              <PackageOpen className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" style={{ color: '#ccaa00' }} />
                              <p className="font-bold text-white text-sm sm:text-base md:text-lg truncate">{presentacion.nombre}</p>
                              <span 
                                className="text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0" 
                                style={{
                                  background: 'rgba(59, 130, 246, 0.2)',
                                  color: '#3b82f6',
                                  border: '1px solid rgba(59, 130, 246, 0.3)'
                                }}
                              >
                                {presentacion.tipoAve}
                              </span>
                            </div>
                            <div className="flex flex-wrap items-center gap-1 sm:gap-2">
                              <Scale className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400 flex-shrink-0" />
                              <span 
                                className="text-xs sm:text-sm font-bold"
                                style={{ color: '#ccaa00' }}
                              >
                                {presentacion.mermaKg.toFixed(2)} kg
                              </span>
                              <span className="text-xs text-gray-400">por ave</span>
                              {presentacion.esVariable && (
                                <span className="text-xs px-2 py-0.5 rounded-full flex-shrink-0" style={{
                                  background: 'rgba(34, 197, 94, 0.2)',
                                  color: '#22c55e'
                                }}>
                                  variable
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Botones */}
                        <div className="flex gap-1 sm:gap-2 flex-shrink-0">
                          <button
                            onClick={() => {
                              setEditingPresentacion(presentacion);
                              setNuevaPresentacionForm({
                                tipoAve: presentacion.tipoAve,
                                nombre: presentacion.nombre,
                                mermaKg: presentacion.mermaKg.toString(),
                                esVariable: presentacion.esVariable
                              });
                            }}
                            className="p-2 sm:p-3 rounded-lg sm:rounded-xl transition-all hover:scale-110"
                            style={{
                              background: 'rgba(245, 158, 11, 0.15)',
                              border: '1.5px solid rgba(245, 158, 11, 0.4)'
                            }}
                            title="Editar"
                          >
                            <Edit2 className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: '#f59e0b' }} />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`¿Eliminar "${presentacion.nombre}"?`)) {
                                setPresentaciones(presentaciones.filter(p => p.id !== presentacion.id));
                              }
                            }}
                            className="p-2 sm:p-3 rounded-lg sm:rounded-xl transition-all hover:scale-110"
                            style={{
                              background: 'rgba(239, 68, 68, 0.15)',
                              border: '1.5px solid rgba(239, 68, 68, 0.4)'
                            }}
                            title="Eliminar"
                          >
                            <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: '#ef4444' }} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Responsive */}
        <div 
          className="px-4 sm:px-6 md:px-8 py-3 sm:py-4 md:py-5 border-t flex flex-col sm:flex-row justify-between items-center gap-3 sm:gap-4"
          style={{
            background: 'rgba(0, 0, 0, 0.4)',
            borderColor: 'rgba(204, 170, 0, 0.2)'
          }}
        >
          <p className="text-xs sm:text-sm text-gray-400">
            Total: <span className="font-bold" style={{ color: '#ccaa00' }}>{presentaciones.length}</span> presentaciones
          </p>
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-6 py-2.5 sm:px-8 sm:py-3 rounded-lg sm:rounded-xl text-sm sm:text-base font-bold transition-all hover:scale-105 shadow-lg"
            style={{
              background: 'linear-gradient(135deg, #0d4a24, #166534, #b8941e, #ccaa00)',
              color: 'white',
              boxShadow: '0 10px 30px rgba(204, 170, 0, 0.3)'
            }}
          >
            Cerrar y Guardar
          </button>
        </div>
      </div>
    </div>
  );
}
