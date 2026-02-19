import { useState } from 'react';
import { Plus, Edit2, Trash2, X, Package, Scale, Box, Check } from 'lucide-react';
import type { Contenedor } from '../contexts/AppContext';

interface ModalContenedoresProps {
  isOpen: boolean;
  onClose: () => void;
  contenedores: Contenedor[];
  setContenedores: (contenedores: Contenedor[]) => void;
}

export function ModalContenedores({
  isOpen,
  onClose,
  contenedores,
  setContenedores
}: ModalContenedoresProps) {
  const [editingContenedor, setEditingContenedor] = useState<Contenedor | null>(null);
  const [formData, setFormData] = useState({
    tipo: '',
    peso: ''
  });

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (editingContenedor) {
      // Editar contenedor existente
      const contenedorActualizado: Contenedor = {
        id: editingContenedor.id,
        tipo: formData.tipo.trim(),
        peso: parseFloat(formData.peso)
      };
      setContenedores(contenedores.map(c => c.id === editingContenedor.id ? contenedorActualizado : c));
      setEditingContenedor(null);
      setFormData({ tipo: '', peso: '' });
    } else {
      // Agregar nuevo contenedor
      const nuevoContenedor: Contenedor = {
        id: Date.now().toString(),
        tipo: formData.tipo.trim(),
        peso: parseFloat(formData.peso)
      };
      setContenedores([...contenedores, nuevoContenedor]);
      setFormData({ tipo: '', peso: '' });
    }
  };

  const handleEditar = (contenedor: Contenedor) => {
    setEditingContenedor(contenedor);
    setFormData({
      tipo: contenedor.tipo,
      peso: contenedor.peso.toString()
    });
  };

  const handleEliminar = (id: string) => {
    if (confirm('¿Está seguro de eliminar este tipo de contenedor?')) {
      setContenedores(contenedores.filter(c => c.id !== id));
    }
  };

  const handleCancelarEdicion = () => {
    setEditingContenedor(null);
    setFormData({ tipo: '', peso: '' });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4" style={{ background: 'rgba(0, 0, 0, 0.85)' }}>
      <div 
        className="backdrop-blur-2xl rounded-2xl sm:rounded-3xl w-full max-w-6xl max-h-[95vh] overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.7) 0%, rgba(13, 74, 36, 0.3) 50%, rgba(0, 0, 0, 0.7) 100%)',
          border: '2px solid rgba(204, 170, 0, 0.3)',
          boxShadow: '0 30px 60px -12px rgba(0, 0, 0, 0.8), 0 0 100px rgba(204, 170, 0, 0.1)'
        }}
      >
        {/* Header Mejorado */}
        <div 
          className="px-4 sm:px-6 lg:px-8 py-4 sm:py-5 lg:py-6 border-b"
          style={{
            background: 'linear-gradient(135deg, rgba(204, 170, 0, 0.15), rgba(0, 0, 0, 0.4))',
            borderColor: 'rgba(204, 170, 0, 0.2)'
          }}
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 sm:gap-3 lg:gap-4 flex-1 min-w-0">
              <div 
                className="w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 rounded-xl sm:rounded-2xl flex items-center justify-center shrink-0"
                style={{
                  background: 'linear-gradient(135deg, #ccaa00, #b8941e)',
                  boxShadow: '0 10px 30px rgba(204, 170, 0, 0.4)'
                }}
              >
                <Package className="w-5 h-5 sm:w-6 sm:h-6 lg:w-7 lg:h-7 text-black" />
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="text-lg sm:text-2xl lg:text-3xl font-bold text-white mb-0.5 sm:mb-1 truncate">Gestión de Contenedores</h2>
                <p className="text-xs sm:text-sm text-gray-300 hidden sm:block">Configure el peso de cada tipo de contenedor para cálculos precisos</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 sm:p-3 rounded-lg sm:rounded-xl transition-all hover:scale-110 hover:rotate-90 shrink-0"
              style={{ 
                background: 'rgba(239, 68, 68, 0.2)',
                border: '1px solid rgba(239, 68, 68, 0.3)'
              }}
            >
              <X className="w-5 h-5 sm:w-6 sm:h-6" style={{ color: '#ef4444' }} />
            </button>
          </div>
        </div>

        {/* Contenido con Scroll */}
        <div className="overflow-y-auto p-3 sm:p-4 lg:p-8" style={{ maxHeight: 'calc(95vh - 140px)' }}>
          <div className="grid grid-cols-1 xl:grid-cols-5 gap-4 sm:gap-6 lg:gap-8">
            {/* Formulario - 2 columnas */}
            <div className="xl:col-span-2">
              <div 
                className="backdrop-blur-xl rounded-xl sm:rounded-2xl p-4 sm:p-5 lg:p-6 h-full"
                style={{
                  background: 'linear-gradient(135deg, rgba(204, 170, 0, 0.12), rgba(0, 0, 0, 0.4))',
                  border: '1px solid rgba(204, 170, 0, 0.25)',
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
                }}
              >
                {/* Título del Formulario */}
                <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-5 lg:mb-6">
                  {editingContenedor ? (
                    <>
                      <div 
                        className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl flex items-center justify-center shrink-0"
                        style={{ background: 'rgba(245, 158, 11, 0.2)', border: '1px solid rgba(245, 158, 11, 0.4)' }}
                      >
                        <Edit2 className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: '#f59e0b' }} />
                      </div>
                      <h3 className="text-base sm:text-lg lg:text-xl font-bold" style={{ color: '#f59e0b' }}>Editar Contenedor</h3>
                    </>
                  ) : (
                    <>
                      <div 
                        className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl flex items-center justify-center shrink-0"
                        style={{ background: 'rgba(34, 197, 94, 0.2)', border: '1px solid rgba(34, 197, 94, 0.4)' }}
                      >
                        <Plus className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: '#22c55e' }} />
                      </div>
                      <h3 className="text-base sm:text-lg lg:text-xl font-bold" style={{ color: '#22c55e' }}>Nuevo Contenedor</h3>
                    </>
                  )}
                </div>

                <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
                  {/* Tipo de Contenedor */}
                  <div>
                    <label className="block text-xs sm:text-sm font-bold mb-2 sm:mb-3" style={{ color: '#ccaa00' }}>
                      <div className="flex items-center gap-2">
                        <Box className="w-3 h-3 sm:w-4 sm:h-4" />
                        Tipo de Contenedor *
                      </div>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.tipo}
                      onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
                      className="w-full px-3 sm:px-4 py-3 sm:py-4 rounded-lg sm:rounded-xl text-sm sm:text-base text-white placeholder-gray-400 transition-all focus:ring-2 focus:ring-offset-2"
                      style={{
                        background: 'rgba(255, 255, 255, 0.08)',
                        border: '1.5px solid rgba(204, 170, 0, 0.3)',
                        outlineColor: '#ccaa00',
                      }}
                      placeholder="Ej: Jabas Nuevas, Bandeja Amarilla"
                    />
                  </div>

                  {/* Peso del Contenedor */}
                  <div>
                    <label className="block text-xs sm:text-sm font-bold mb-2 sm:mb-3" style={{ color: '#ccaa00' }}>
                      <div className="flex items-center gap-2">
                        <Scale className="w-3 h-3 sm:w-4 sm:h-4" />
                        Peso del Contenedor (kg) *
                      </div>
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        required
                        min="0"
                        step="0.01"
                        value={formData.peso}
                        onChange={(e) => setFormData({ ...formData, peso: e.target.value })}
                        className="w-full px-3 sm:px-4 py-3 sm:py-4 rounded-lg sm:rounded-xl text-sm sm:text-base text-white placeholder-gray-400 transition-all focus:ring-2 focus:ring-offset-2"
                        style={{
                          background: 'rgba(255, 255, 255, 0.08)',
                          border: '1.5px solid rgba(204, 170, 0, 0.3)',
                          outlineColor: '#ccaa00',
                        }}
                        placeholder="Ej: 2.5, 3.5, 0.05"
                      />
                      <div 
                        className="absolute right-3 sm:right-4 top-1/2 transform -translate-y-1/2 px-2 sm:px-3 py-0.5 sm:py-1 rounded text-xs font-bold"
                        style={{ background: 'rgba(204, 170, 0, 0.2)', color: '#ccaa00' }}
                      >
                        KG
                      </div>
                    </div>
                    <p className="text-xs text-gray-400 mt-2 flex items-center gap-2">
                      <span>💡</span>
                      <span>Peso unitario del contenedor vacío</span>
                    </p>
                  </div>

                  {/* Calculadora Visual */}
                  {formData.peso && parseFloat(formData.peso) > 0 && (
                    <div 
                      className="backdrop-blur-xl rounded-lg sm:rounded-xl p-3 sm:p-4 lg:p-5"
                      style={{
                        background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.1), rgba(22, 101, 52, 0.15))',
                        border: '1.5px solid rgba(34, 197, 94, 0.3)'
                      }}
                    >
                      <p className="text-xs font-bold mb-2 sm:mb-3" style={{ color: '#22c55e' }}>
                        📊 CALCULADORA DE PESO
                      </p>
                      <div className="grid grid-cols-2 gap-2 sm:gap-3 lg:gap-4">
                        <div 
                          className="p-2 sm:p-3 rounded-lg"
                          style={{ background: 'rgba(0, 0, 0, 0.3)' }}
                        >
                          <p className="text-xs text-gray-400 mb-1">Peso Unitario</p>
                          <p className="text-xl sm:text-2xl font-bold" style={{ color: '#ccaa00' }}>
                            {parseFloat(formData.peso).toFixed(2)}
                          </p>
                          <p className="text-xs text-gray-500">kilogramos</p>
                        </div>
                        <div 
                          className="p-2 sm:p-3 rounded-lg"
                          style={{ background: 'rgba(0, 0, 0, 0.3)' }}
                        >
                          <p className="text-xs text-gray-400 mb-1">10 Unidades</p>
                          <p className="text-xl sm:text-2xl font-bold text-white">
                            {(10 * parseFloat(formData.peso)).toFixed(2)}
                          </p>
                          <p className="text-xs text-gray-500">kilogramos</p>
                        </div>
                      </div>
                      <div className="mt-2 sm:mt-3 p-2 rounded-lg text-center" style={{ background: 'rgba(204, 170, 0, 0.1)' }}>
                        <p className="text-xs font-medium" style={{ color: '#ccaa00' }}>
                          50 unidades = {(50 * parseFloat(formData.peso)).toFixed(2)} kg
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Botones */}
                  <div className="space-y-2 sm:space-y-3 pt-2">
                    <button
                      type="submit"
                      className="w-full px-4 sm:px-6 py-3 sm:py-4 rounded-lg sm:rounded-xl text-sm sm:text-base font-bold transition-all hover:scale-[1.02] flex items-center justify-center gap-2 sm:gap-3 shadow-lg"
                      style={{
                        background: editingContenedor 
                          ? 'linear-gradient(135deg, #f59e0b, #d97706)' 
                          : 'linear-gradient(135deg, #0d4a24, #166534, #b8941e, #ccaa00)',
                        color: 'white',
                        boxShadow: editingContenedor
                          ? '0 10px 30px rgba(245, 158, 11, 0.4)'
                          : '0 10px 30px rgba(204, 170, 0, 0.4)'
                      }}
                    >
                      {editingContenedor ? (
                        <>
                          <Check className="w-4 h-4 sm:w-5 sm:h-5" />
                          Actualizar Contenedor
                        </>
                      ) : (
                        <>
                          <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
                          Agregar Contenedor
                        </>
                      )}
                    </button>

                    {editingContenedor && (
                      <button
                        type="button"
                        onClick={handleCancelarEdicion}
                        className="w-full px-4 sm:px-6 py-3 sm:py-4 rounded-lg sm:rounded-xl text-sm sm:text-base font-medium transition-all hover:scale-[1.02]"
                        style={{
                          background: 'rgba(255, 255, 255, 0.05)',
                          color: '#ffffff',
                          border: '1.5px solid rgba(255, 255, 255, 0.2)'
                        }}
                      >
                        Cancelar Edición
                      </button>
                    )}
                  </div>
                </form>
              </div>
            </div>

            {/* Lista de Contenedores - 3 columnas */}
            <div className="xl:col-span-3">
              <div 
                className="backdrop-blur-xl rounded-xl sm:rounded-2xl p-4 sm:p-5 lg:p-6"
                style={{
                  background: 'rgba(0, 0, 0, 0.4)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
                }}
              >
                <div className="flex items-center justify-between mb-4 sm:mb-5 lg:mb-6">
                  <h3 className="text-base sm:text-lg lg:text-xl font-bold text-white flex items-center gap-2">
                    <Package className="w-5 h-5 sm:w-6 sm:h-6" style={{ color: '#ccaa00' }} />
                    <span className="hidden sm:inline">Contenedores Registrados</span>
                    <span className="sm:hidden">Registrados</span>
                    <span 
                      className="ml-1 sm:ml-2 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-xs sm:text-sm"
                      style={{ background: 'rgba(204, 170, 0, 0.2)', color: '#ccaa00' }}
                    >
                      {contenedores.length}
                    </span>
                  </h3>
                </div>

                <div className="space-y-2 sm:space-y-3" style={{ maxHeight: '500px', overflowY: 'auto' }}>
                  {contenedores.length === 0 && (
                    <div 
                      className="text-center py-8 sm:py-12 lg:py-16 rounded-lg sm:rounded-xl"
                      style={{ background: 'rgba(255, 255, 255, 0.02)' }}
                    >
                      <div 
                        className="w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4"
                        style={{ background: 'rgba(204, 170, 0, 0.1)', border: '2px dashed rgba(204, 170, 0, 0.3)' }}
                      >
                        <Package className="w-8 h-8 sm:w-10 sm:h-10" style={{ color: '#ccaa00', opacity: 0.5 }} />
                      </div>
                      <p className="text-sm sm:text-base text-gray-400 font-medium mb-1 sm:mb-2">No hay contenedores registrados</p>
                      <p className="text-xs text-gray-500">Agrega tu primer contenedor usando el formulario</p>
                    </div>
                  )}

                  {contenedores.map((contenedor, index) => (
                    <div 
                      key={contenedor.id}
                      className="group p-3 sm:p-4 lg:p-5 rounded-lg sm:rounded-xl transition-all hover:scale-[1.01]"
                      style={{
                        background: 'linear-gradient(135deg, rgba(204, 170, 0, 0.08), rgba(0, 0, 0, 0.3))',
                        border: '1.5px solid rgba(204, 170, 0, 0.25)',
                        boxShadow: '0 4px 15px rgba(0, 0, 0, 0.2)'
                      }}
                    >
                      <div className="flex items-center justify-between gap-2 sm:gap-3">
                        <div className="flex items-center gap-2 sm:gap-3 lg:gap-4 flex-1 min-w-0">
                          {/* Número de índice */}
                          <div 
                            className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl flex items-center justify-center font-bold text-lg sm:text-xl shrink-0"
                            style={{
                              background: 'linear-gradient(135deg, #ccaa00, #b8941e)',
                              color: '#000',
                              boxShadow: '0 4px 15px rgba(204, 170, 0, 0.3)'
                            }}
                          >
                            {index + 1}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 sm:gap-2 mb-1 sm:mb-2">
                              <Box className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" style={{ color: '#ccaa00' }} />
                              <p className="font-bold text-white text-sm sm:text-base lg:text-lg truncate">{contenedor.tipo}</p>
                            </div>
                            <div className="flex items-center gap-1.5 sm:gap-2">
                              <Scale className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400 shrink-0" />
                              <span className="text-xs sm:text-sm font-bold" style={{ color: '#ccaa00' }}>
                                {contenedor.peso.toFixed(2)} kg
                              </span>
                              <span className="text-xs text-gray-400 hidden sm:inline">por unidad</span>
                            </div>
                          </div>
                        </div>

                        {/* Botones de Acción */}
                        <div className="flex gap-1.5 sm:gap-2 shrink-0">
                          <button
                            onClick={() => handleEditar(contenedor)}
                            className="p-2 sm:p-3 rounded-lg sm:rounded-xl transition-all hover:scale-110"
                            style={{
                              background: 'rgba(245, 158, 11, 0.15)',
                              border: '1.5px solid rgba(245, 158, 11, 0.4)'
                            }}
                            title="Editar contenedor"
                          >
                            <Edit2 className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: '#f59e0b' }} />
                          </button>
                          <button
                            onClick={() => handleEliminar(contenedor.id)}
                            className="p-2 sm:p-3 rounded-lg sm:rounded-xl transition-all hover:scale-110"
                            style={{
                              background: 'rgba(239, 68, 68, 0.15)',
                              border: '1.5px solid rgba(239, 68, 68, 0.4)'
                            }}
                            title="Eliminar contenedor"
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

        {/* Footer */}
        <div 
          className="px-4 sm:px-6 lg:px-8 py-3 sm:py-4 lg:py-5 border-t flex flex-col sm:flex-row justify-between items-center gap-3"
          style={{
            background: 'rgba(0, 0, 0, 0.4)',
            borderColor: 'rgba(204, 170, 0, 0.2)'
          }}
        >
          <p className="text-xs sm:text-sm text-gray-400">
            Total de contenedores: <span className="font-bold" style={{ color: '#ccaa00' }}>{contenedores.length}</span>
          </p>
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-6 sm:px-8 py-2.5 sm:py-3 rounded-lg sm:rounded-xl text-sm sm:text-base font-bold transition-all hover:scale-105 shadow-lg"
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