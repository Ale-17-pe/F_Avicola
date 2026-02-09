import { useState } from 'react';
import { Plus, Edit2, Trash2, Bird, Settings, X } from 'lucide-react';

interface TipoAve {
  id: string;
  nombre: string;
  tieneSexo: boolean;
  tieneVariedad: boolean;
  variedades?: string[];
  color: string;
}

export function Configuracion() {
  const [tiposAve, setTiposAve] = useState<TipoAve[]>([
    {
      id: '1',
      nombre: 'Pollo',
      tieneSexo: true,
      tieneVariedad: false,
      color: '#22c55e'
    },
    {
      id: '2',
      nombre: 'Pato',
      tieneSexo: true,
      tieneVariedad: false,
      color: '#3b82f6'
    },
    {
      id: '3',
      nombre: 'Pavo',
      tieneSexo: true,
      tieneVariedad: false,
      color: '#8b5cf6'
    },
    {
      id: '4',
      nombre: 'Gallina',
      tieneSexo: false,
      tieneVariedad: true,
      variedades: ['Rojas', 'Doble Pechuga'],
      color: '#ec4899'
    }
  ]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTipo, setEditingTipo] = useState<TipoAve | null>(null);
  const [formData, setFormData] = useState({
    nombre: '',
    tieneSexo: true,
    tieneVariedad: false,
    variedades: '',
    color: '#22c55e'
  });

  const handleOpenModal = (tipo?: TipoAve) => {
    if (tipo) {
      setEditingTipo(tipo);
      setFormData({
        nombre: tipo.nombre,
        tieneSexo: tipo.tieneSexo,
        tieneVariedad: tipo.tieneVariedad,
        variedades: tipo.variedades?.join(', ') || '',
        color: tipo.color
      });
    } else {
      setEditingTipo(null);
      setFormData({
        nombre: '',
        tieneSexo: true,
        tieneVariedad: false,
        variedades: '',
        color: '#22c55e'
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingTipo(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const newTipo: TipoAve = {
      id: editingTipo?.id || Date.now().toString(),
      nombre: formData.nombre,
      tieneSexo: formData.tieneSexo,
      tieneVariedad: formData.tieneVariedad,
      variedades: formData.tieneVariedad ? formData.variedades.split(',').map(v => v.trim()).filter(v => v) : undefined,
      color: formData.color
    };

    if (editingTipo) {
      setTiposAve(tiposAve.map(t => t.id === editingTipo.id ? newTipo : t));
    } else {
      setTiposAve([...tiposAve, newTipo]);
    }
    
    handleCloseModal();
  };

  const handleDelete = (id: string) => {
    if (confirm('¿Está seguro de eliminar este tipo de ave?')) {
      setTiposAve(tiposAve.filter(t => t.id !== id));
    }
  };

  const colorPresets = [
    '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#ef4444', '#10b981', '#6366f1', '#d946ef', '#f97316'
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Configuración</h1>
          <p className="text-gray-400">Gestión de tipos de aves y configuración del sistema</p>
        </div>
      </div>

      {/* Sección: Tipos de Aves */}
      <div className="backdrop-blur-xl rounded-xl p-6" style={{
        background: 'rgba(0, 0, 0, 0.3)',
        border: '1px solid rgba(255, 255, 255, 0.1)'
      }}>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Bird className="w-6 h-6" style={{ color: '#ccaa00' }} />
            <h2 className="text-xl font-bold text-white">Tipos de Aves</h2>
          </div>
          <button
            onClick={() => handleOpenModal()}
            className="flex items-center gap-2 px-4 py-2 rounded-lg font-bold transition-all hover:scale-105"
            style={{
              background: 'linear-gradient(to right, #0d4a24, #166534, #b8941e, #ccaa00)',
              color: '#ffffff'
            }}
          >
            <Plus className="w-4 h-4" />
            Agregar Tipo
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {tiposAve.map((tipo) => (
            <div
              key={tipo.id}
              className="p-4 rounded-lg relative"
              style={{
                background: `linear-gradient(135deg, ${tipo.color}20, ${tipo.color}10)`,
                border: `1px solid ${tipo.color}40`
              }}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ background: tipo.color }}
                  />
                  <h3 className="font-bold text-white text-lg">{tipo.nombre}</h3>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => handleOpenModal(tipo)}
                    className="p-1.5 rounded transition-all hover:scale-110"
                    style={{
                      background: 'rgba(34, 197, 94, 0.2)',
                      border: '1px solid rgba(34, 197, 94, 0.3)'
                    }}
                  >
                    <Edit2 className="w-3.5 h-3.5" style={{ color: '#22c55e' }} />
                  </button>
                  <button
                    onClick={() => handleDelete(tipo.id)}
                    className="p-1.5 rounded transition-all hover:scale-110"
                    style={{
                      background: 'rgba(239, 68, 68, 0.2)',
                      border: '1px solid rgba(239, 68, 68, 0.3)'
                    }}
                  >
                    <Trash2 className="w-3.5 h-3.5" style={{ color: '#ef4444' }} />
                  </button>
                </div>
              </div>
              
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-gray-400">Diferencia por sexo:</span>
                  <span className={tipo.tieneSexo ? 'text-green-400' : 'text-gray-500'}>
                    {tipo.tieneSexo ? '✓ Sí' : '✗ No'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-400">Tiene variedades:</span>
                  <span className={tipo.tieneVariedad ? 'text-green-400' : 'text-gray-500'}>
                    {tipo.tieneVariedad ? '✓ Sí' : '✗ No'}
                  </span>
                </div>
                {tipo.tieneVariedad && tipo.variedades && (
                  <div className="mt-2 pt-2" style={{ borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
                    <p className="text-gray-400 text-xs mb-1">Variedades:</p>
                    <div className="flex flex-wrap gap-1">
                      {tipo.variedades.map((variedad, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 rounded text-xs"
                          style={{
                            background: `${tipo.color}30`,
                            color: tipo.color,
                            border: `1px solid ${tipo.color}50`
                          }}
                        >
                          {variedad}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0, 0, 0, 0.8)' }}>
          <div 
            className="backdrop-blur-xl rounded-2xl w-full max-w-lg p-6"
            style={{
              background: 'rgba(0, 0, 0, 0.6)',
              border: '1px solid rgba(204, 170, 0, 0.3)',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
            }}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">
                {editingTipo ? 'Editar Tipo de Ave' : 'Nuevo Tipo de Ave'}
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
                  Nombre del Tipo *
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
                  placeholder="Ej: Codorniz, Ganso, etc."
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-3" style={{ color: '#ccaa00' }}>
                  Color de Identificación *
                </label>
                <div className="flex flex-wrap gap-2 mb-3">
                  {colorPresets.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setFormData({ ...formData, color })}
                      className="w-10 h-10 rounded-lg transition-all hover:scale-110"
                      style={{
                        background: color,
                        border: formData.color === color ? '3px solid white' : '1px solid rgba(255, 255, 255, 0.2)',
                        boxShadow: formData.color === color ? '0 0 0 2px rgba(204, 170, 0, 0.5)' : 'none'
                      }}
                    />
                  ))}
                </div>
                <input
                  type="color"
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  className="w-full h-10 rounded-lg cursor-pointer"
                  style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)'
                  }}
                />
              </div>

              <div className="flex items-center gap-3 p-3 rounded-lg" style={{
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.1)'
              }}>
                <input
                  type="checkbox"
                  id="tieneSexo"
                  checked={formData.tieneSexo}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    tieneSexo: e.target.checked,
                    tieneVariedad: e.target.checked ? false : formData.tieneVariedad
                  })}
                  className="w-5 h-5 rounded cursor-pointer"
                  style={{ accentColor: '#ccaa00' }}
                />
                <label htmlFor="tieneSexo" className="text-white cursor-pointer flex-1">
                  Diferenciar por sexo (Macho/Hembra)
                </label>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-lg" style={{
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.1)'
              }}>
                <input
                  type="checkbox"
                  id="tieneVariedad"
                  checked={formData.tieneVariedad}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    tieneVariedad: e.target.checked,
                    tieneSexo: e.target.checked ? false : formData.tieneSexo
                  })}
                  className="w-5 h-5 rounded cursor-pointer"
                  style={{ accentColor: '#ccaa00' }}
                />
                <label htmlFor="tieneVariedad" className="text-white cursor-pointer flex-1">
                  Tiene variedades
                </label>
              </div>

              {formData.tieneVariedad && (
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#ccaa00' }}>
                    Variedades (separadas por coma)
                  </label>
                  <input
                    type="text"
                    value={formData.variedades}
                    onChange={(e) => setFormData({ ...formData, variedades: e.target.value })}
                    className="w-full px-4 py-3 rounded-lg text-white placeholder-gray-400"
                    style={{
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.1)'
                    }}
                    placeholder="Ej: Rojas, Blancas, Doble Pechuga"
                  />
                  <p className="text-xs text-gray-400 mt-1">Separa las variedades con comas</p>
                </div>
              )}

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
                  {editingTipo ? 'Actualizar' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
