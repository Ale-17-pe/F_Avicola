import { useState, useMemo, useEffect } from 'react';
import { Plus, Edit2, Trash2, Search, User, Phone, MapPin, Mail, TrendingUp, ShoppingCart, X, Building2, Users, DollarSign, Bird, CheckSquare, Square } from 'lucide-react';
import { CostosClientes } from './CostosClientes';
import { useApp } from '../contexts/AppContext';
import { toast } from 'sonner';
import { useTheme, t } from '../contexts/ThemeContext';

interface ProductoSeleccionado {
  key: string; // tipoAveId_variedad
  tipoAveId: string;
  tipoAveNombre: string;
  variedad: string;
  color: string;
  presentaciones: Set<'Vivo' | 'Pelado' | 'Destripado'>;
}

export function Clientes() {
  const { clientes, addCliente, updateCliente, deleteCliente, tiposAve, costosClientes, setCostosClientes } = useApp();
  const { isDark } = useTheme();
  const c = t(isDark);

  // Zonas dinámicas desde localStorage (sincronizadas con Envíos)
  const [zonasEnvios, setZonasEnvios] = useState<{ id: string; nombre: string; descripcion: string; color: string }[]>(() => {
    try {
      const stored = localStorage.getItem('avicola_zonas');
      return stored ? JSON.parse(stored) : [];
    } catch { return []; }
  });

  // Polling para sincronizar zonas en tiempo real
  useEffect(() => {
    const interval = setInterval(() => {
      try {
        const stored = localStorage.getItem('avicola_zonas');
        if (stored) {
          const parsed = JSON.parse(stored);
          setZonasEnvios(prev => {
            if (JSON.stringify(prev) !== JSON.stringify(parsed)) return parsed;
            return prev;
          });
        }
      } catch { /* ignore */ }
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCliente, setEditingCliente] = useState<any>(null);
  const [formData, setFormData] = useState({
    nombre: '',
    contacto: '',
    telefono: '',
    email: '',
    zona: '',
    estado: 'Activo' as 'Activo' | 'Inactivo'
  });
  const [productosSeleccionados, setProductosSeleccionados] = useState<ProductoSeleccionado[]>([]);

  // Aves activas para seleccion de productos
  const avesActivas = useMemo(
    () => tiposAve.filter((t) => (t.categoria === 'Ave' || !t.categoria) && t.estado !== 'Inactivo'),
    [tiposAve]
  );

  // Generar lista de productos disponibles
  const productosDisponibles = useMemo(() => {
    const items: { key: string; tipoAveId: string; nombre: string; variedad: string; color: string }[] = [];
    avesActivas.forEach((tipo) => {
      if (tipo.tieneSexo && !tipo.tieneVariedad) {
        items.push({ key: `${tipo.id}_Mixto`, tipoAveId: tipo.id, nombre: tipo.nombre, variedad: 'Mixto', color: tipo.color });
      } else if (tipo.tieneVariedad && tipo.variedades) {
        tipo.variedades.forEach((v) => {
          items.push({ key: `${tipo.id}_${v}`, tipoAveId: tipo.id, nombre: tipo.nombre, variedad: v, color: tipo.color });
        });
      } else {
        items.push({ key: `${tipo.id}_-`, tipoAveId: tipo.id, nombre: tipo.nombre, variedad: '-', color: tipo.color });
      }
    });
    return items;
  }, [avesActivas]);

  const toggleProducto = (item: typeof productosDisponibles[0]) => {
    setProductosSeleccionados(prev => {
      const exists = prev.find(p => p.key === item.key);
      if (exists) {
        return prev.filter(p => p.key !== item.key);
      }
      return [...prev, {
        key: item.key,
        tipoAveId: item.tipoAveId,
        tipoAveNombre: item.nombre,
        variedad: item.variedad,
        color: item.color,
        presentaciones: new Set<'Vivo' | 'Pelado' | 'Destripado'>(['Vivo', 'Pelado', 'Destripado']),
      }];
    });
  };

  const togglePresentacion = (key: string, pres: 'Vivo' | 'Pelado' | 'Destripado') => {
    setProductosSeleccionados(prev => prev.map(p => {
      if (p.key !== key) return p;
      const newSet = new Set(p.presentaciones);
      if (newSet.has(pres)) newSet.delete(pres);
      else newSet.add(pres);
      return { ...p, presentaciones: newSet };
    }));
  };

  const handleOpenModal = (cliente?: any) => {
    if (cliente) {
      setEditingCliente(cliente);
      setFormData({
        nombre: cliente.nombre,
        contacto: cliente.contacto,
        telefono: cliente.telefono,
        email: cliente.email,
        zona: cliente.zona,
        estado: cliente.estado
      });
      setProductosSeleccionados([]);
    } else {
      setEditingCliente(null);
      setFormData({
        nombre: '',
        contacto: '',
        telefono: '',
        email: '',
        zona: '',
        estado: 'Activo'
      });
      setProductosSeleccionados([]);
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingCliente(null);
    setFormData({
      nombre: '',
      contacto: '',
      telefono: '',
      email: '',
      zona: '',
      estado: 'Activo'
    });
    setProductosSeleccionados([]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (editingCliente) {
      const clienteActualizado: any = {
        ...editingCliente,
        nombre: formData.nombre,
        contacto: formData.contacto,
        telefono: formData.telefono,
        email: formData.email,
        zona: formData.zona,
        estado: formData.estado
      };
      updateCliente(clienteActualizado);
    } else {
      const clienteId = Date.now().toString();
      const nuevoCliente: any = {
        id: clienteId,
        nombre: formData.nombre,
        contacto: formData.contacto,
        telefono: formData.telefono,
        email: formData.email,
        zona: formData.zona,
        totalPedidos: 0,
        ultimoPedido: '-',
        estado: formData.estado
      };
      addCliente(nuevoCliente);

      // Crear costos iniciales desde precios generales
      if (productosSeleccionados.length > 0) {
        const hoy = new Date().toISOString().split('T')[0];
        let saved: any[] = [];
        try {
          const raw = localStorage.getItem('avicola_preciosGenerales');
          if (raw) saved = JSON.parse(raw);
        } catch { /* ignore */ }

        const nuevosCostos = [...costosClientes];
        productosSeleccionados.forEach((prod) => {
          const general = saved.find(
            (g: any) => g.tipoAveId === prod.tipoAveId && g.variedad === prod.variedad
          );
          const precioVivo = prod.presentaciones.has('Vivo') ? (general?.precioVivo || 0) : 0;
          const precioPelado = prod.presentaciones.has('Pelado') ? (general?.precioPelado || 0) : 0;
          const precioDestripado = prod.presentaciones.has('Destripado') ? (general?.precioDestripado || 0) : 0;

          if (precioVivo === 0 && precioPelado === 0 && precioDestripado === 0 && !general) {
            // Si no hay precios generales, igual crear con 0 para que aparezca
          }

          const label = prod.variedad !== '-' && prod.variedad !== 'Mixto'
            ? `${prod.tipoAveNombre} - ${prod.variedad}`
            : prod.tipoAveNombre;

          nuevosCostos.push({
            id: `${Date.now()}-${clienteId}-${prod.tipoAveId}-${prod.variedad}-${Math.random()}`,
            clienteId,
            clienteNombre: formData.nombre,
            tipoAveId: prod.tipoAveId,
            tipoAveNombre: label,
            variedad: prod.variedad !== '-' ? prod.variedad : undefined,
            precioPorKg: precioVivo || precioPelado || precioDestripado,
            precioVivo,
            precioPelado,
            precioDestripado,
            fecha: hoy,
          });
        });
        setCostosClientes(nuevosCostos);
        toast.success(`Cliente registrado con ${productosSeleccionados.length} producto(s)`);
      }
    }

    handleCloseModal();
  };

  const handleEliminar = (id: string) => {
    if (confirm('¿Está seguro de eliminar este cliente?')) {
      deleteCliente(id);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6 p-2 sm:p-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
        <div className="w-full sm:w-auto">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold mb-1 sm:mb-2" style={{ color: c.text }}>Gestión de Clientes</h1>
          <p className="text-xs sm:text-sm md:text-base" style={{ color: c.textSecondary }}>Administra la base de datos de clientes y precios</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="w-full sm:w-auto px-3 sm:px-4 md:px-6 py-2 sm:py-2.5 md:py-3 rounded-lg font-bold transition-all hover:scale-105 flex items-center justify-center gap-1 sm:gap-2"
          style={{
            background: 'linear-gradient(to right, #0d4a24, #166534, #b8941e, #ccaa00)',
            color: 'white',
            boxShadow: '0 4px 15px rgba(204, 170, 0, 0.4)'
          }}
        >
          <Plus className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5" />
          <span className="text-xs sm:text-sm md:text-base">Agregar Cliente</span>
        </button>
      </div>

      <CostosClientes />

      {/* Modal Agregar/Editar Cliente */}
      {isModalOpen && (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 overflow-y-auto"
              style={{ background: c.bgModalOverlay }}
              onClick={handleCloseModal}
            >
              <div
                className="backdrop-blur-2xl rounded-xl sm:rounded-2xl md:rounded-3xl w-full max-w-sm sm:max-w-md md:max-w-lg lg:max-w-3xl mx-2 sm:mx-4 p-3 sm:p-4 md:p-6 max-h-[90vh] overflow-y-auto"
                style={{
                  background: isDark
                    ? 'linear-gradient(135deg, rgba(0, 0, 0, 0.7) 0%, rgba(13, 74, 36, 0.3) 50%, rgba(0, 0, 0, 0.7) 100%)'
                    : '#ffffff',
                  border: '2px solid rgba(204, 170, 0, 0.3)',
                  boxShadow: c.shadowLg
                }}
                onClick={(e) => e.stopPropagation()}
              >
                {/* Header */}
                <div className="flex items-center justify-between mb-3 sm:mb-6 pb-3 sm:pb-4 border-b" style={{ borderColor: c.borderGold }}>
                  <div className="flex items-center gap-2 sm:gap-3 md:gap-4">
                    <div
                      className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-lg sm:rounded-xl md:rounded-2xl flex items-center justify-center flex-shrink-0"
                      style={{
                        background: 'linear-gradient(135deg, #ccaa00, #b8941e)',
                        boxShadow: '0 10px 30px rgba(204, 170, 0, 0.4)'
                      }}
                    >
                      <User className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 text-black" />
                    </div>
                    <div className="min-w-0">
                      <h2 className="text-lg sm:text-xl md:text-2xl font-bold truncate" style={{ color: c.text }}>
                        {editingCliente ? 'Editar Cliente' : 'Registrar Cliente'}
                      </h2>
                      <p className="text-xs hidden sm:block truncate" style={{ color: c.textSecondary }}>Complete los datos del cliente</p>
                    </div>
                  </div>
                  <button
                    onClick={handleCloseModal}
                    className="p-1.5 sm:p-2 md:p-3 rounded-lg sm:rounded-xl transition-all hover:scale-110 hover:rotate-90 flex-shrink-0"
                    style={{
                      background: 'rgba(239, 68, 68, 0.2)',
                      border: '1px solid rgba(239, 68, 68, 0.3)'
                    }}
                  >
                    <X className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" style={{ color: '#ef4444' }} />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-xs sm:text-sm font-bold mb-1 sm:mb-2" style={{ color: '#ccaa00' }}>
                        Nombre del Cliente / Negocio *
                      </label>
                      <div className="relative">
                        <Building2 className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 text-gray-400" />
                        <input
                          type="text"
                          required
                          value={formData.nombre}
                          onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                          className="w-full pl-9 sm:pl-10 md:pl-12 pr-3 py-2 sm:py-2.5 md:py-3 rounded-lg text-xs sm:text-sm md:text-base placeholder-gray-400 transition-all focus:ring-2"
                          style={{
                            background: c.g08,
                            border: '1.5px solid rgba(204, 170, 0, 0.3)',
                            outlineColor: '#ccaa00',
                            color: c.text
                          }}
                          placeholder="Ej: Restaurante El Sabor"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs sm:text-sm font-bold mb-1 sm:mb-2" style={{ color: '#ccaa00' }}>
                        Persona de Contacto *
                      </label>
                      <div className="relative">
                        <User className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 text-gray-400" />
                        <input
                          type="text"
                          required
                          value={formData.contacto}
                          onChange={(e) => setFormData({ ...formData, contacto: e.target.value })}
                          className="w-full pl-9 sm:pl-10 md:pl-12 pr-3 py-2 sm:py-2.5 md:py-3 rounded-lg text-xs sm:text-sm md:text-base placeholder-gray-400 transition-all focus:ring-2"
                          style={{
                            background: c.g08,
                            border: '1.5px solid rgba(59, 130, 246, 0.3)',
                            outlineColor: '#3b82f6',
                            color: c.text
                          }}
                          placeholder="Ej: Carlos Mendoza"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs sm:text-sm font-bold mb-1 sm:mb-2" style={{ color: '#ccaa00' }}>
                        Teléfono *
                      </label>
                      <div className="relative">
                        <Phone className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 text-gray-400" />
                        <input
                          type="tel"
                          required
                          value={formData.telefono}
                          onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                          className="w-full pl-9 sm:pl-10 md:pl-12 pr-3 py-2 sm:py-2.5 md:py-3 rounded-lg text-xs sm:text-sm md:text-base placeholder-gray-400 transition-all focus:ring-2"
                          style={{
                            background: c.g08,
                            border: '1.5px solid rgba(34, 197, 94, 0.3)',
                            outlineColor: '#22c55e',
                            color: c.text
                          }}
                          placeholder="Ej: 987 654 321"
                        />
                      </div>
                    </div>



                    <div className="md:col-span-2">
                      <label className="block text-xs sm:text-sm font-bold mb-1 sm:mb-2" style={{ color: '#ccaa00' }}>
                        Zona *
                      </label>
                      <div className="relative">
                        <MapPin className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 text-gray-400" />
                        <select
                          required
                          value={formData.zona}
                          onChange={(e) => setFormData({ ...formData, zona: e.target.value })}
                          className="w-full pl-9 sm:pl-10 md:pl-12 pr-3 py-2 sm:py-2.5 md:py-3 rounded-lg text-xs sm:text-sm md:text-base placeholder-gray-400 transition-all focus:ring-2"
                          style={{
                            background: c.g08,
                            border: '1.5px solid rgba(204, 170, 0, 0.3)',
                            outlineColor: '#ccaa00',
                            color: c.text
                          }}
                        >
                          <option value="" style={{ background: isDark ? '#1a1a1a' : '#ffffff', color: c.text }}>Seleccionar zona...</option>
                          {zonasEnvios.map(z => (
                            <option key={z.id} value={z.nombre} style={{ background: isDark ? '#1a1a1a' : '#ffffff', color: c.text }}>
                              {z.nombre}{z.descripcion ? ` - ${z.descripcion}` : ''}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Seleccion de productos para nuevo cliente */}
                    {!editingCliente && (
                      <div className="md:col-span-2">
                        <label className="block text-xs sm:text-sm font-bold mb-1 sm:mb-2" style={{ color: '#ccaa00' }}>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Bird className="w-4 h-4" />
                              Productos Iniciales (opcional)
                            </div>
                            {productosDisponibles.length > 0 && (
                              <button
                                type="button"
                                onClick={() => {
                                  if (productosSeleccionados.length === productosDisponibles.length) {
                                    setProductosSeleccionados([]);
                                  } else {
                                    setProductosSeleccionados(productosDisponibles.map(item => ({
                                      key: item.key,
                                      tipoAveId: item.tipoAveId,
                                      tipoAveNombre: item.nombre,
                                      variedad: item.variedad,
                                      color: item.color,
                                      presentaciones: new Set<'Vivo' | 'Pelado' | 'Destripado'>(['Vivo', 'Pelado', 'Destripado']),
                                    })));
                                  }
                                }}
                                className="px-2 py-0.5 rounded text-[10px] sm:text-xs font-bold transition-all hover:scale-105"
                                style={{
                                  background: productosSeleccionados.length === productosDisponibles.length ? 'rgba(239, 68, 68, 0.15)' : 'rgba(204, 170, 0, 0.15)',
                                  border: productosSeleccionados.length === productosDisponibles.length ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid rgba(204, 170, 0, 0.3)',
                                  color: productosSeleccionados.length === productosDisponibles.length ? '#ef4444' : '#ccaa00',
                                }}
                              >
                                {productosSeleccionados.length === productosDisponibles.length ? 'Quitar todos' : 'Seleccionar todos'}
                              </button>
                            )}
                          </div>
                        </label>
                        <p className="text-xs text-gray-500 mb-2">
                          Seleccione los tipos de ave y presentaciones que este cliente maneja. Los precios se obtienen de la tabla general.
                        </p>
                        <div className="space-y-2 max-h-52 overflow-y-auto pr-1 rounded-lg p-2" style={{ background: c.bgTableRow, border: '1px solid ' + c.g08 }}>
                          {productosDisponibles.map((item) => {
                            const isSelected = productosSeleccionados.some(p => p.key === item.key);
                            const productoSel = productosSeleccionados.find(p => p.key === item.key);
                            return (
                              <div key={item.key} className={`rounded-lg transition-all ${isSelected ? 'ring-1 ring-amber-500/40' : ''}`} style={{ background: isSelected ? 'rgba(204, 170, 0, 0.08)' : 'transparent' }}>
                                <button
                                  type="button"
                                  onClick={() => toggleProducto(item)}
                                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left transition-all hover:bg-white/5"
                                >
                                  {isSelected
                                    ? <CheckSquare className="w-4 h-4 text-amber-400 flex-shrink-0" />
                                    : <Square className="w-4 h-4 text-gray-600 flex-shrink-0" />
                                  }
                                  <div className="w-6 h-6 rounded flex items-center justify-center flex-shrink-0" style={{ background: `${item.color}20`, border: `1px solid ${item.color}40` }}>
                                    <Bird className="w-3 h-3" style={{ color: item.color }} />
                                  </div>
                                  <span className="text-xs sm:text-sm font-medium" style={{ color: c.text }}>{item.nombre}</span>
                                  {item.variedad !== '-' && (
                                    <span className="text-xs" style={{ color: c.textSecondary }}>({item.variedad})</span>
                                  )}
                                </button>
                                {isSelected && productoSel && (
                                  <div className="flex items-center gap-2 px-3 pb-2 pl-11">
                                    {(['Vivo', 'Pelado', 'Destripado'] as const).map((pres) => {
                                      const active = productoSel.presentaciones.has(pres);
                                      return (
                                        <button
                                          key={pres}
                                          type="button"
                                          onClick={() => togglePresentacion(item.key, pres)}
                                          className={`px-2.5 py-1 rounded text-xs font-bold transition-all ${active ? 'scale-105' : 'opacity-50'}`}
                                          style={{
                                            background: active ? 'rgba(204, 170, 0, 0.2)' : c.bgInput,
                                            border: active ? '1px solid rgba(204, 170, 0, 0.4)' : '1px solid ' + c.border,
                                            color: active ? '#ccaa00' : '#666',
                                          }}
                                        >
                                          {pres}
                                        </button>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                          {productosDisponibles.length === 0 && (
                            <p className="text-center text-xs py-3" style={{ color: c.textMuted }}>No hay aves activas registradas</p>
                          )}
                        </div>
                        {productosSeleccionados.length > 0 && (
                          <p className="text-xs text-amber-400 mt-1.5">
                            {productosSeleccionados.length} producto(s) seleccionado(s)
                          </p>
                        )}
                      </div>
                    )}

                    {editingCliente && (
                      <div className="md:col-span-2">
                        <label className="block text-xs sm:text-sm font-bold mb-1 sm:mb-2" style={{ color: '#ccaa00' }}>
                          Estado (Click para cambiar)
                        </label>
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, estado: formData.estado === 'Activo' ? 'Inactivo' : 'Activo' })}
                          className="w-full px-3 py-2 sm:py-2.5 md:py-3 rounded-lg text-xs sm:text-sm md:text-base font-bold transition-all hover:scale-105 flex items-center justify-center gap-2"
                          style={{
                            background: formData.estado === 'Activo' 
                              ? 'rgba(34, 197, 94, 0.2)' 
                              : 'rgba(239, 68, 68, 0.2)',
                            border: formData.estado === 'Activo'
                              ? '1.5px solid rgba(34, 197, 94, 0.5)'
                              : '1.5px solid rgba(239, 68, 68, 0.5)',
                            color: formData.estado === 'Activo' ? '#22c55e' : '#ef4444'
                          }}
                        >
                          {formData.estado === 'Activo' ? (
                            <>
                              <span className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
                              Cliente Activo
                            </>
                          ) : (
                            <>
                              <X className="w-4 h-4" />
                              Cliente Inactivo
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-3 sm:pt-4">
                    <button
                      type="button"
                      onClick={handleCloseModal}
                      className="w-full sm:flex-1 px-4 py-2.5 sm:py-3 rounded-lg text-sm sm:text-base font-bold transition-all hover:scale-105"
                      style={{
                        background: c.g10,
                        color: c.text,
                        border: '1.5px solid ' + c.g20
                      }}
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="w-full sm:flex-1 px-4 py-2.5 sm:py-3 rounded-lg text-sm sm:text-base font-bold transition-all hover:scale-105 shadow-lg"
                      style={{
                        background: 'linear-gradient(135deg, #0d4a24, #166534, #b8941e, #ccaa00)',
                        color: '#ffffff',
                        boxShadow: '0 10px 30px rgba(204, 170, 0, 0.4)'
                      }}
                    >
                      {editingCliente ? 'Actualizar Cliente' : 'Guardar Cliente'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
    </div>
  );
}