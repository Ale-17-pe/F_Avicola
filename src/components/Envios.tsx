import { useState, useEffect } from 'react';
import { Truck, Package, Plus, Edit2, Trash2, X, MapPin, Clock, CheckCircle, Eye, User, Search, Save, ChevronDown, ChevronUp } from 'lucide-react';
import { useApp } from '../contexts/AppContext';

interface Zona {
  id: string;
  nombre: string;
  descripcion: string;
  color: string;
}

const COLORES_ZONA = [
  '#3b82f6', '#22c55e', '#8b5cf6', '#f59e0b', '#ef4444', '#ec4899',
  '#06b6d4', '#84cc16', '#f97316', '#6366f1'
];

const ZONAS_DEFAULT: Zona[] = [
  { id: '1', nombre: 'Zona 1', descripcion: 'Independencia, Provincia, Jicamarca', color: '#3b82f6' },
  { id: '2', nombre: 'Zona 2', descripcion: 'Provincia', color: '#3b82f6' },
  { id: '3', nombre: 'Zona 3', descripcion: 'Jicamarca', color: '#3b82f6' },
  { id: '4', nombre: 'Zona 4', descripcion: 'Sedapal, Zona Alta, Zona Baja, Corralito, Plumas', color: '#22c55e' },
  { id: '5', nombre: 'Zona 5', descripcion: 'Vencedores', color: '#8b5cf6' },
  { id: '6', nombre: 'Zona 6', descripcion: 'Montenegro, 10 de Octubre, Motupe, Mariscal, Mariátegui, Trébol', color: '#f59e0b' },
  { id: '7', nombre: 'Zona 7', descripcion: 'Valle Sagrado, Saruta', color: '#ef4444' },
  { id: '8', nombre: 'Zona 8', descripcion: 'Bayovar, Huáscar, Peladero, Sta. María', color: '#ec4899' },
];

export function Envios() {
  const { pedidosConfirmados } = useApp();

  // Zonas CRUD state
  const [zonas, setZonas] = useState<Zona[]>(() => {
    try {
      const stored = localStorage.getItem('avicola_zonas');
      return stored ? JSON.parse(stored) : ZONAS_DEFAULT;
    } catch { return ZONAS_DEFAULT; }
  });

  useEffect(() => {
    localStorage.setItem('avicola_zonas', JSON.stringify(zonas));
  }, [zonas]);

  const [isZonaModalOpen, setIsZonaModalOpen] = useState(false);
  const [editingZona, setEditingZona] = useState<Zona | null>(null);
  const [zonaForm, setZonaForm] = useState({ nombre: '', descripcion: '', color: '#3b82f6' });
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedZonas, setExpandedZonas] = useState<Set<string>>(new Set(['1']));
  const [selectedPedido, setSelectedPedido] = useState<(typeof pedidosConfirmados)[0] | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // Filtrar pedidos del día de hoy
  const hoy = new Date().toISOString().split('T')[0];
  const pedidosDelDia = pedidosConfirmados.filter(p => p.fecha === hoy);

  // Agrupar pedidos por zona
  const pedidosPorZona = (zonaId: string, zonaNombre: string) => {
    return pedidosDelDia.filter(p => {
      const zonaP = p.zonaEntrega || '';
      return zonaP.includes(zonaNombre) || zonaP.includes(`Zona ${zonaId}`);
    });
  };

  // Pedidos sin zona asignada
  const pedidosSinZona = pedidosDelDia.filter(p => {
    if (!p.zonaEntrega) return true;
    return !zonas.some(z => p.zonaEntrega!.includes(z.nombre) || p.zonaEntrega!.includes(`Zona ${z.id}`));
  });

  // Stats
  const totalPedidos = pedidosDelDia.length;
  const pedidosEntregados = pedidosDelDia.filter(p => p.estado === 'Entregado' || p.estado === 'Completado').length;
  const pedidosEnCurso = pedidosDelDia.filter(p => p.estado === 'Pesaje' || p.estado === 'En Producción' || p.estado === 'En Despacho').length;
  const pedidosPendientes = pedidosDelDia.filter(p => p.estado === 'Pendiente').length;

  // Zone CRUD handlers
  const handleOpenZonaModal = (zona?: Zona) => {
    if (zona) {
      setEditingZona(zona);
      setZonaForm({ nombre: zona.nombre, descripcion: zona.descripcion, color: zona.color });
    } else {
      setEditingZona(null);
      setZonaForm({ nombre: '', descripcion: '', color: COLORES_ZONA[zonas.length % COLORES_ZONA.length] });
    }
    setIsZonaModalOpen(true);
  };

  const handleCloseZonaModal = () => {
    setIsZonaModalOpen(false);
    setEditingZona(null);
    setZonaForm({ nombre: '', descripcion: '', color: '#3b82f6' });
  };

  const handleSubmitZona = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingZona) {
      setZonas(zonas.map(z => z.id === editingZona.id ? { ...z, ...zonaForm } : z));
    } else {
      const nueva: Zona = {
        id: Date.now().toString(),
        nombre: zonaForm.nombre,
        descripcion: zonaForm.descripcion,
        color: zonaForm.color,
      };
      setZonas([...zonas, nueva]);
    }
    handleCloseZonaModal();
  };

  const handleDeleteZona = (id: string) => {
    if (confirm('¿Está seguro de eliminar esta zona?')) {
      setZonas(zonas.filter(z => z.id !== id));
    }
  };

  const toggleZonaExpansion = (zonaId: string) => {
    const next = new Set(expandedZonas);
    if (next.has(zonaId)) next.delete(zonaId);
    else next.add(zonaId);
    setExpandedZonas(next);
  };

  const handleVerPedido = (pedido: (typeof pedidosConfirmados)[0]) => {
    setSelectedPedido(pedido);
    setIsDetailModalOpen(true);
  };

  const estadoStyle = (estado?: string) => {
    switch (estado) {
      case 'Completado': case 'Entregado':
        return { bg: 'rgba(34,197,94,0.2)', color: '#22c55e', border: 'rgba(34,197,94,0.3)' };
      case 'En Despacho':
        return { bg: 'rgba(168,85,247,0.2)', color: '#a855f7', border: 'rgba(168,85,247,0.3)' };
      case 'Pesaje': case 'En Producción':
        return { bg: 'rgba(59,130,246,0.2)', color: '#3b82f6', border: 'rgba(59,130,246,0.3)' };
      case 'Pendiente':
        return { bg: 'rgba(245,158,11,0.2)', color: '#f59e0b', border: 'rgba(245,158,11,0.3)' };
      default:
        return { bg: 'rgba(255,255,255,0.1)', color: '#fff', border: 'rgba(255,255,255,0.2)' };
    }
  };

  const filteredZonas = zonas.filter(z =>
    z.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    z.descripcion.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-4 sm:space-y-6 p-2 sm:p-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-white mb-1 sm:mb-2">Envíos y Zonas</h1>
          <p className="text-xs sm:text-sm text-gray-400">Control de distribución por zonas — {hoy}</p>
        </div>
        <button
          onClick={() => handleOpenZonaModal()}
          className="w-full sm:w-auto px-4 py-2.5 rounded-lg font-bold transition-all hover:scale-105 flex items-center justify-center gap-2"
          style={{
            background: 'linear-gradient(to right, #0d4a24, #166534, #b8941e, #ccaa00)',
            color: 'white',
            boxShadow: '0 4px 15px rgba(204, 170, 0, 0.4)'
          }}
        >
          <Plus className="w-4 h-4" />
          <span className="text-sm">Nueva Zona</span>
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 md:gap-4">
        <div className="backdrop-blur-xl rounded-xl p-3 sm:p-4 md:p-6" style={{
          background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.2)'
        }}>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs sm:text-sm text-gray-400">Total Pedidos</p>
            <Package className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
          </div>
          <p className="text-lg sm:text-2xl md:text-3xl font-bold text-white">{totalPedidos}</p>
        </div>
        <div className="backdrop-blur-xl rounded-xl p-3 sm:p-4 md:p-6" style={{
          background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(245,158,11,0.3)'
        }}>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs sm:text-sm text-gray-400">Pendientes</p>
            <Clock className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: '#f59e0b' }} />
          </div>
          <p className="text-lg sm:text-2xl md:text-3xl font-bold" style={{ color: '#f59e0b' }}>{pedidosPendientes}</p>
        </div>
        <div className="backdrop-blur-xl rounded-xl p-3 sm:p-4 md:p-6" style={{
          background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(59,130,246,0.3)'
        }}>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs sm:text-sm text-gray-400">En Curso</p>
            <Truck className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: '#3b82f6' }} />
          </div>
          <p className="text-lg sm:text-2xl md:text-3xl font-bold" style={{ color: '#3b82f6' }}>{pedidosEnCurso}</p>
        </div>
        <div className="backdrop-blur-xl rounded-xl p-3 sm:p-4 md:p-6" style={{
          background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(34,197,94,0.3)'
        }}>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs sm:text-sm text-gray-400">Entregados</p>
            <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: '#22c55e' }} />
          </div>
          <p className="text-lg sm:text-2xl md:text-3xl font-bold" style={{ color: '#22c55e' }}>{pedidosEntregados}</p>
        </div>
      </div>

      {/* Búsqueda */}
      <div className="backdrop-blur-xl rounded-xl p-3" style={{
        background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)'
      }}>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar zona..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-lg text-sm text-white placeholder-gray-400"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
          />
        </div>
      </div>

      {/* Zonas con pedidos */}
      <div className="space-y-4">
        {filteredZonas.map((zona) => {
          const pedidosZona = pedidosPorZona(zona.id, zona.nombre);
          const isExpanded = expandedZonas.has(zona.id);

          return (
            <div key={zona.id} className="backdrop-blur-xl rounded-xl overflow-hidden" style={{
              background: 'rgba(0,0,0,0.3)', border: `1px solid ${zona.color}40`
            }}>
              {/* Zona Header */}
              <div className="px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between" style={{
                background: `${zona.color}15`, borderBottom: `1px solid ${zona.color}30`
              }}>
                <div className="flex items-center gap-3 flex-1 cursor-pointer" onClick={() => toggleZonaExpansion(zona.id)}>
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: zona.color }}>
                    <MapPin className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-base sm:text-lg font-bold text-white">{zona.nombre}</h3>
                      <span className="px-2 py-0.5 rounded-full text-xs font-bold" style={{
                        background: `${zona.color}30`, color: zona.color
                      }}>
                        {pedidosZona.length} pedidos
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 truncate">{zona.descripcion}</p>
                  </div>
                  {isExpanded ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
                </div>
                <div className="flex items-center gap-1 ml-2">
                  <button
                    onClick={(e) => { e.stopPropagation(); handleOpenZonaModal(zona); }}
                    className="p-1.5 rounded-lg transition-all hover:scale-110"
                    style={{ background: 'rgba(245,158,11,0.2)', border: '1px solid rgba(245,158,11,0.3)' }}
                  >
                    <Edit2 className="w-3.5 h-3.5" style={{ color: '#f59e0b' }} />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDeleteZona(zona.id); }}
                    className="p-1.5 rounded-lg transition-all hover:scale-110"
                    style={{ background: 'rgba(239,68,68,0.2)', border: '1px solid rgba(239,68,68,0.3)' }}
                  >
                    <Trash2 className="w-3.5 h-3.5" style={{ color: '#ef4444' }} />
                  </button>
                </div>
              </div>

              {/* Pedidos de esta zona */}
              {isExpanded && (
                <div>
                  {pedidosZona.length > 0 ? (
                    <div className="divide-y" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
                      {pedidosZona.map((pedido) => {
                        const est = estadoStyle(pedido.estado);
                        return (
                          <div key={pedido.id} className="px-4 sm:px-6 py-3 flex items-center justify-between hover:bg-white/5 transition-colors">
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{
                                background: `linear-gradient(135deg, ${zona.color}, ${zona.color}90)`
                              }}>
                                <Package className="w-4 h-4 text-white" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-white font-medium text-sm truncate">{pedido.cliente}</p>
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="text-xs text-gray-400">{pedido.tipoAve} — {pedido.presentacion} — {pedido.cantidad} unids</span>
                                  {pedido.conductor && (
                                    <span className="text-xs flex items-center gap-1" style={{ color: zona.color }}>
                                      <User className="w-3 h-3" />{pedido.conductor}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 ml-2">
                              <span className="px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap" style={{
                                background: est.bg, color: est.color, border: `1px solid ${est.border}`
                              }}>
                                {pedido.estado || 'Pendiente'}
                              </span>
                              <button
                                onClick={() => handleVerPedido(pedido)}
                                className="p-1.5 rounded-lg transition-all hover:scale-110"
                                style={{ background: `${zona.color}20`, border: `1px solid ${zona.color}40` }}
                              >
                                <Eye className="w-3.5 h-3.5" style={{ color: zona.color }} />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-6">
                      <Package className="w-10 h-10 mx-auto mb-2" style={{ color: zona.color, opacity: 0.3 }} />
                      <p className="text-gray-500 text-sm">No hay pedidos para esta zona hoy</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {/* Pedidos sin zona */}
        {pedidosSinZona.length > 0 && (
          <div className="backdrop-blur-xl rounded-xl overflow-hidden" style={{
            background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.2)'
          }}>
            <div className="px-4 sm:px-6 py-3 sm:py-4" style={{
              background: 'rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.1)'
            }}>
              <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                <MapPin className="w-5 h-5 text-gray-400" />
                Sin Zona Asignada
                <span className="px-2 py-0.5 rounded-full text-xs font-bold" style={{
                  background: 'rgba(255,255,255,0.15)', color: '#fff'
                }}>
                  {pedidosSinZona.length}
                </span>
              </h3>
            </div>
            <div className="divide-y" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
              {pedidosSinZona.map((pedido) => {
                const est = estadoStyle(pedido.estado);
                return (
                  <div key={pedido.id} className="px-4 sm:px-6 py-3 flex items-center justify-between hover:bg-white/5 transition-colors">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.1)' }}>
                        <Package className="w-4 h-4 text-gray-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-medium text-sm truncate">{pedido.cliente}</p>
                        <span className="text-xs text-gray-400">{pedido.tipoAve} — {pedido.presentacion} — {pedido.cantidad} unids</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-2">
                      <span className="px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap" style={{
                        background: est.bg, color: est.color, border: `1px solid ${est.border}`
                      }}>
                        {pedido.estado || 'Pendiente'}
                      </span>
                      <button
                        onClick={() => handleVerPedido(pedido)}
                        className="p-1.5 rounded-lg transition-all hover:scale-110"
                        style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)' }}
                      >
                        <Eye className="w-3.5 h-3.5 text-gray-400" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Sin pedidos */}
        {totalPedidos === 0 && (
          <div className="text-center py-12 backdrop-blur-xl rounded-xl" style={{
            background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)'
          }}>
            <Truck className="w-16 h-16 mx-auto mb-4 text-gray-600" />
            <p className="text-gray-400 text-base">No hay pedidos para hoy</p>
            <p className="text-gray-500 text-sm mt-1">Los pedidos confirmados aparecerán aquí agrupados por zona</p>
          </div>
        )}
      </div>

      {/* Modal CRUD Zona */}
      {isZonaModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.85)' }} onClick={handleCloseZonaModal}>
          <div
            className="backdrop-blur-2xl rounded-2xl w-full max-w-md p-6"
            style={{
              background: 'linear-gradient(135deg, rgba(0,0,0,0.7) 0%, rgba(13,74,36,0.3) 50%, rgba(0,0,0,0.7) 100%)',
              border: '2px solid rgba(204,170,0,0.3)',
              boxShadow: '0 30px 60px -12px rgba(0,0,0,0.8)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6 pb-4 border-b" style={{ borderColor: 'rgba(204,170,0,0.2)' }}>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{
                  background: 'linear-gradient(135deg, #ccaa00, #b8941e)',
                  boxShadow: '0 10px 30px rgba(204,170,0,0.4)'
                }}>
                  <MapPin className="w-6 h-6 text-black" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">{editingZona ? 'Editar Zona' : 'Nueva Zona'}</h2>
                  <p className="text-xs text-gray-400">Configure la zona de entrega</p>
                </div>
              </div>
              <button onClick={handleCloseZonaModal} className="p-2 rounded-xl transition-all hover:scale-110" style={{
                background: 'rgba(239,68,68,0.2)', border: '1px solid rgba(239,68,68,0.3)'
              }}>
                <X className="w-5 h-5" style={{ color: '#ef4444' }} />
              </button>
            </div>

            <form onSubmit={handleSubmitZona} className="space-y-4">
              <div>
                <label className="block text-sm font-bold mb-2" style={{ color: '#ccaa00' }}>Nombre *</label>
                <input
                  type="text"
                  required
                  value={zonaForm.nombre}
                  onChange={(e) => setZonaForm({ ...zonaForm, nombre: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-lg text-sm text-white placeholder-gray-400"
                  style={{ background: 'rgba(255,255,255,0.08)', border: '1.5px solid rgba(204,170,0,0.3)' }}
                  placeholder="Ej: Zona 7"
                />
              </div>
              <div>
                <label className="block text-sm font-bold mb-2" style={{ color: '#ccaa00' }}>Descripción *</label>
                <input
                  type="text"
                  required
                  value={zonaForm.descripcion}
                  onChange={(e) => setZonaForm({ ...zonaForm, descripcion: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-lg text-sm text-white placeholder-gray-400"
                  style={{ background: 'rgba(255,255,255,0.08)', border: '1.5px solid rgba(204,170,0,0.3)' }}
                  placeholder="Ej: Canto Grande, Huaycán"
                />
              </div>
              <div>
                <label className="block text-sm font-bold mb-2" style={{ color: '#ccaa00' }}>Color</label>
                <div className="flex gap-2 flex-wrap">
                  {COLORES_ZONA.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setZonaForm({ ...zonaForm, color: c })}
                      className="w-8 h-8 rounded-lg transition-all hover:scale-110"
                      style={{
                        backgroundColor: c,
                        border: zonaForm.color === c ? '3px solid white' : '2px solid transparent',
                        boxShadow: zonaForm.color === c ? `0 0 10px ${c}` : 'none'
                      }}
                    />
                  ))}
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={handleCloseZonaModal}
                  className="flex-1 px-4 py-2.5 rounded-lg font-bold transition-all hover:scale-105 text-sm"
                  style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff' }}
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
                  {editingZona ? 'Actualizar' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Detalle Pedido */}
      {isDetailModalOpen && selectedPedido && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.85)' }} onClick={() => setIsDetailModalOpen(false)}>
          <div
            className="backdrop-blur-2xl rounded-2xl w-full max-w-lg p-6 max-h-[85vh] overflow-y-auto"
            style={{
              background: 'linear-gradient(135deg, rgba(0,0,0,0.7) 0%, rgba(13,74,36,0.3) 50%, rgba(0,0,0,0.7) 100%)',
              border: '2px solid rgba(204,170,0,0.3)',
              boxShadow: '0 30px 60px -12px rgba(0,0,0,0.8)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4 pb-4 border-b" style={{ borderColor: 'rgba(204,170,0,0.2)' }}>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{
                  background: 'linear-gradient(135deg, #ccaa00, #b8941e)'
                }}>
                  <Package className="w-6 h-6 text-black" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">Detalle del Pedido</h2>
                  <p className="text-xs text-gray-400">#{selectedPedido.numeroPedido || selectedPedido.id}</p>
                </div>
              </div>
              <button onClick={() => setIsDetailModalOpen(false)} className="p-2 rounded-xl transition-all hover:scale-110" style={{
                background: 'rgba(239,68,68,0.2)', border: '1px solid rgba(239,68,68,0.3)'
              }}>
                <X className="w-5 h-5" style={{ color: '#ef4444' }} />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-lg" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(204,170,0,0.2)' }}>
                  <p className="text-xs text-gray-400 mb-1">Cliente</p>
                  <p className="text-white font-bold text-sm">{selectedPedido.cliente}</p>
                </div>
                <div className="p-3 rounded-lg" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(204,170,0,0.2)' }}>
                  <p className="text-xs text-gray-400 mb-1">Estado</p>
                  <span className="px-2 py-1 rounded-full text-xs font-medium" style={{
                    ...(() => { const s = estadoStyle(selectedPedido.estado); return { background: s.bg, color: s.color, border: `1px solid ${s.border}` }; })()
                  }}>
                    {selectedPedido.estado || 'Pendiente'}
                  </span>
                </div>
                <div className="p-3 rounded-lg" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(59,130,246,0.2)' }}>
                  <p className="text-xs text-gray-400 mb-1">Tipo de Ave</p>
                  <p className="text-white font-bold text-sm">{selectedPedido.tipoAve}</p>
                </div>
                <div className="p-3 rounded-lg" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(59,130,246,0.2)' }}>
                  <p className="text-xs text-gray-400 mb-1">Presentación</p>
                  <p className="text-white font-bold text-sm">{selectedPedido.presentacion}</p>
                </div>
                <div className="p-3 rounded-lg" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(34,197,94,0.2)' }}>
                  <p className="text-xs text-gray-400 mb-1">Cantidad</p>
                  <p className="text-white font-bold text-sm">{selectedPedido.cantidad} unids</p>
                </div>
                <div className="p-3 rounded-lg" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(34,197,94,0.2)' }}>
                  <p className="text-xs text-gray-400 mb-1">Contenedor</p>
                  <p className="text-white font-bold text-sm">{selectedPedido.contenedor}</p>
                </div>
                {selectedPedido.conductor && (
                  <div className="p-3 rounded-lg" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(204,170,0,0.2)' }}>
                    <p className="text-xs text-gray-400 mb-1">Conductor</p>
                    <p className="text-white font-bold text-sm">{selectedPedido.conductor}</p>
                  </div>
                )}
                {selectedPedido.zonaEntrega && (
                  <div className="p-3 rounded-lg" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(204,170,0,0.2)' }}>
                    <p className="text-xs text-gray-400 mb-1">Zona</p>
                    <p className="text-white font-bold text-sm">{selectedPedido.zonaEntrega}</p>
                  </div>
                )}
                <div className="p-3 rounded-lg" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
                  <p className="text-xs text-gray-400 mb-1">Fecha/Hora</p>
                  <p className="text-white font-bold text-sm">{selectedPedido.fecha} — {selectedPedido.hora}</p>
                </div>
                {selectedPedido.pesoKg && (
                  <div className="p-3 rounded-lg" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(251,146,60,0.2)' }}>
                    <p className="text-xs text-gray-400 mb-1">Peso</p>
                    <p className="text-white font-bold text-sm">{selectedPedido.pesoKg.toFixed(2)} kg</p>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-6">
              <button
                onClick={() => setIsDetailModalOpen(false)}
                className="w-full px-4 py-2.5 rounded-lg font-bold transition-all hover:scale-105 text-sm"
                style={{
                  background: 'linear-gradient(to right, #0d4a24, #166534, #b8941e, #ccaa00)',
                  color: '#ffffff'
                }}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}