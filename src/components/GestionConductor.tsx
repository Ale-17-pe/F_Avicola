import { useState, useEffect, useMemo } from "react";
import {
  Truck, Scale, RotateCcw, Camera, CheckCircle2, AlertTriangle, UserPlus,
  ArrowRight, ChevronRight, History, Camera as CameraIcon, X, PackageCheck,
  FileText, User, MapPin, Clock, Weight, AlertCircle, Package, Calendar, Plus,
  ChevronDown, Layers,
} from "lucide-react";
import { useApp, PedidoConfirmado } from "../contexts/AppContext";
import { toast } from "sonner";

// ===================== INTERFACES =====================

interface FotoRegistro {
  tipo: 'repesada' | 'devolucion' | 'entrega' | 'asignacion';
  url: string;
  fecha: string;
}

interface RegistroConductor {
  id: string;
  pedidoId: string;
  tipo: 'repesada' | 'devolucion' | 'asignacion' | 'entrega';
  peso?: number;
  motivo?: string;
  nuevoClienteId?: string;
  nuevoClienteNombre?: string;
  fotos: FotoRegistro[];
  fecha: string;
  estado: 'Pendiente' | 'Completado' | 'Con Incidencia';
}

interface GrupoDespacho {
  grupoId: string;
  cliente: string;
  pedidos: PedidoConfirmado[];
  pesoBrutoTotal: number;
  pesoNetoTotal: number;
  conductor?: string;
  zonaEntrega?: string;
  numeroTicket?: string;
  tieneIncidencia: boolean;
  todosEntregados: boolean;
}

// ===================== COMPONENTE PRINCIPAL =====================

export function GestionConductor() {
  const { pedidosConfirmados, clientes, updatePedidoConfirmado } = useApp();

  // ── Vista ──
  const [modo, setModo] = useState<'LISTA' | 'GRUPO' | 'DETALLE' | 'REPESADA' | 'DEVOLUCION' | 'ASIGNACION'>('LISTA');
  const [grupoSeleccionado, setGrupoSeleccionado] = useState<GrupoDespacho | null>(null);
  const [selectedPedido, setSelectedPedido] = useState<PedidoConfirmado | null>(null);

  // ── Formularios ──
  const [formWeight, setFormWeight] = useState("");
  const [formReason, setFormReason] = useState("");
  const [capturedPhotos, setCapturedPhotos] = useState<string[]>([]);
  const [newClientId, setNewClientId] = useState("");
  const [sessionBlocks, setSessionBlocks] = useState<{ peso: number; foto: string }[]>([]);
  const [showReasonStep, setShowReasonStep] = useState(false);

  // ── Registros ──
  const [registros, setRegistros] = useState<RegistroConductor[]>(() => {
    const saved = localStorage.getItem('registrosConductor');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('registrosConductor', JSON.stringify(registros));
  }, [registros]);

  // ── Pedidos en ruta ──
  const pedidosRuta = pedidosConfirmados.filter((p) =>
    p.estado === 'En Despacho' || p.estado === 'Despachando' || p.estado === 'En Ruta' ||
    p.estado === 'Con Incidencia' || p.estado === 'Devolución' || p.estado === 'Confirmado con Adición'
  );

  // ── Agrupar por grupoDespacho ──
  const gruposDespacho: GrupoDespacho[] = useMemo(() => {
    const map = new Map<string, PedidoConfirmado[]>();
    pedidosRuta.forEach(p => {
      const key = p.grupoDespacho || `individual-${p.id}`;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(p);
    });
    return Array.from(map.entries()).map(([grupoId, pedidos]) => {
      const sorted = pedidos.sort((a, b) => {
        const aNum = parseInt((a.numeroPedido || '').split('.')[1] || '0');
        const bNum = parseInt((b.numeroPedido || '').split('.')[1] || '0');
        return aNum - bNum;
      });
      return {
        grupoId,
        cliente: sorted[0].cliente,
        pedidos: sorted,
        pesoBrutoTotal: sorted.reduce((s, p) => s + (p.pesoBrutoTotal || 0), 0),
        pesoNetoTotal: sorted.reduce((s, p) => s + (p.pesoNetoTotal || p.pesoKg || 0), 0),
        conductor: sorted[0].conductor,
        zonaEntrega: sorted[0].zonaEntrega,
        numeroTicket: sorted[0].numeroTicket,
        tieneIncidencia: sorted.some(p => p.estado === 'Con Incidencia' || p.estado === 'Devolución'),
        todosEntregados: sorted.every(p => p.estado === 'Entregado'),
      };
    });
  }, [pedidosRuta]);

  // ── Helpers ──
  const getFreshPedido = () => {
    if (!selectedPedido) return null;
    return pedidosConfirmados.find(p => p.id === selectedPedido.id) || selectedPedido;
  };

  const getFreshGrupo = () => {
    if (!grupoSeleccionado) return null;
    return gruposDespacho.find(g => g.grupoId === grupoSeleccionado.grupoId) || grupoSeleccionado;
  };

  const generarId = () => `REG-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  const getRegistrosPedido = (id: string) =>
    registros.filter(r => r.pedidoId === id).sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());

  const handleCapturePhoto = () => {
    const mockPhoto = `https://images.unsplash.com/photo-${Math.floor(Math.random() * 1000000)}?w=400&t=${Date.now()}`;
    setCapturedPhotos([...capturedPhotos, mockPhoto]);
    toast.success("Foto capturada correctamente");
  };

  const resetForm = () => {
    setFormWeight(""); setFormReason(""); setCapturedPhotos([]); setNewClientId("");
  };

  // ── Acciones de pesada ──
  const handleAddBlock = () => {
    if (!formWeight || capturedPhotos.length === 0) { toast.error("Debe ingresar el peso y capturar una foto"); return; }
    setSessionBlocks([...sessionBlocks, { peso: parseFloat(formWeight), foto: capturedPhotos[0] }]);
    setFormWeight(""); setCapturedPhotos([]);
    toast.success("Pesada agregada");
  };

  const handleFinishRepesada = () => {
    if (sessionBlocks.length === 0) { toast.error("Debe agregar al menos una pesada"); return; }
    const pesoTotalRepesada = sessionBlocks.reduce((acc, b) => acc + b.peso, 0);
    const fresh = getFreshPedido();
    const pesoOriginal = fresh?.pesoBrutoTotal || 0;
    const diferencia = Math.abs(pesoOriginal - pesoTotalRepesada);
    const margenTolerancia = 0.5;

    setRegistros(prev => [...prev, {
      id: generarId(), pedidoId: selectedPedido!.id, tipo: 'repesada',
      peso: pesoTotalRepesada,
      fotos: sessionBlocks.map(b => ({ tipo: 'repesada' as const, url: b.foto, fecha: new Date().toISOString() })),
      fecha: new Date().toISOString(),
      estado: diferencia <= margenTolerancia ? 'Completado' : 'Con Incidencia',
    }]);

    updatePedidoConfirmado(selectedPedido!.id, {
      ...fresh!,
      estado: diferencia <= margenTolerancia ? 'En Ruta' : 'Con Incidencia',
      pesoRepesada: pesoTotalRepesada,
      ultimaIncidencia: diferencia <= margenTolerancia ? null : 'Diferencia de peso detectada',
    });

    toast.success(`Repesada finalizada: ${pesoTotalRepesada.toFixed(1)} kg totales`);
    setModo('DETALLE'); setSessionBlocks([]); resetForm();
  };

  const handleFinishDevolucion = () => {
    if (sessionBlocks.length === 0) { toast.error("Debe agregar al menos una pesada de devolución"); return; }
    if (!formReason) { toast.error("Debe ingresar el motivo de la devolución"); return; }
    const pesoTotalDevolucion = sessionBlocks.reduce((acc, b) => acc + b.peso, 0);
    const fresh = getFreshPedido();

    setRegistros(prev => [...prev, {
      id: generarId(), pedidoId: selectedPedido!.id, tipo: 'devolucion',
      peso: pesoTotalDevolucion, motivo: formReason,
      fotos: sessionBlocks.map(b => ({ tipo: 'devolucion' as const, url: b.foto, fecha: new Date().toISOString() })),
      fecha: new Date().toISOString(), estado: 'Con Incidencia',
    }]);

    updatePedidoConfirmado(selectedPedido!.id, {
      ...fresh!, estado: 'Devolución', pesoDevolucion: pesoTotalDevolucion,
      motivoDevolucion: formReason, ultimaIncidencia: 'Producto devuelto',
    });

    toast.warning(`Devolución finalizada: ${pesoTotalDevolucion.toFixed(1)} kg totales`);
    setModo('DETALLE'); setSessionBlocks([]); resetForm();
  };

  const handleFinishAsignacion = () => {
    if (sessionBlocks.length === 0) { toast.error("Debe agregar al menos una pesada"); return; }
    if (!newClientId) { toast.error("Debe seleccionar un cliente"); return; }
    const pesoTotalAsignacion = sessionBlocks.reduce((acc, b) => acc + b.peso, 0);
    const clienteObj = clientes.find(c => c.id === newClientId);
    const fresh = getFreshPedido();

    setRegistros(prev => [...prev, {
      id: generarId(), pedidoId: selectedPedido!.id, tipo: 'asignacion',
      peso: pesoTotalAsignacion, nuevoClienteId: newClientId, nuevoClienteNombre: clienteObj?.nombre,
      fotos: sessionBlocks.map(b => ({ tipo: 'asignacion' as const, url: b.foto, fecha: new Date().toISOString() })),
      fecha: new Date().toISOString(), estado: 'Completado',
    }]);

    updatePedidoConfirmado(selectedPedido!.id, {
      ...fresh!, estado: 'Confirmado con Adición', pesoAdicional: pesoTotalAsignacion,
      clienteAdicionalId: newClientId, ultimaIncidencia: `Adición para ${clienteObj?.nombre}`,
    });

    toast.success(`Adición finalizada: ${pesoTotalAsignacion.toFixed(1)} kg para ${clienteObj?.nombre}`);
    setModo('DETALLE'); setSessionBlocks([]); resetForm();
  };

  const handleConfirmarEntregaPedido = (pedido: PedidoConfirmado) => {
    const fresh = pedidosConfirmados.find(p => p.id === pedido.id) || pedido;
    setRegistros(prev => [...prev, {
      id: generarId(), pedidoId: pedido.id, tipo: 'entrega', fotos: [],
      fecha: new Date().toISOString(), estado: 'Completado',
    }]);
    updatePedidoConfirmado(pedido.id, { ...fresh, estado: 'Entregado' });
    toast.success('Entrega confirmada para este pedido');
  };

  const handleConfirmarEntregaTotal = () => {
    const freshGrupo = getFreshGrupo();
    if (!freshGrupo) return;
    freshGrupo.pedidos.forEach(p => {
      if (p.estado !== 'Entregado') {
        const fresh = pedidosConfirmados.find(fp => fp.id === p.id) || p;
        setRegistros(prev => [...prev, {
          id: generarId(), pedidoId: p.id, tipo: 'entrega', fotos: [],
          fecha: new Date().toISOString(), estado: 'Completado',
        }]);
        updatePedidoConfirmado(p.id, { ...fresh, estado: 'Entregado' });
      }
    });
    toast.success('¡Entrega total confirmada para todo el despacho!');
    setModo('LISTA'); setGrupoSeleccionado(null);
  };

  // ── UI Helpers ──
  const getEstadoBadge = (estado: string) => {
    switch (estado) {
      case 'Devolución': return 'bg-red-500/15 text-red-400 ring-red-500/25';
      case 'Con Incidencia': return 'bg-amber-500/15 text-amber-400 ring-amber-500/25';
      case 'Despachando': return 'bg-blue-500/15 text-blue-400 ring-blue-500/25';
      case 'Confirmado con Adición': return 'bg-teal-500/15 text-teal-400 ring-teal-500/25';
      case 'En Ruta': return 'bg-purple-500/15 text-purple-400 ring-purple-500/25';
      case 'Entregado': return 'bg-green-500/15 text-green-400 ring-green-500/25';
      default: return 'bg-emerald-500/15 text-emerald-400 ring-emerald-500/25';
    }
  };

  const getAccentColor = (grupo: GrupoDespacho) => {
    if (grupo.todosEntregados) return 'border-l-green-500';
    if (grupo.tieneIncidencia) return 'border-l-amber-500';
    return 'border-l-emerald-500';
  };

  const getTipoIcon = (tipo: string) => {
    switch (tipo) {
      case 'repesada': return <Scale className="w-4 h-4 text-blue-400" />;
      case 'devolucion': return <RotateCcw className="w-4 h-4 text-orange-400" />;
      case 'asignacion': return <UserPlus className="w-4 h-4 text-emerald-400" />;
      case 'entrega': return <CheckCircle2 className="w-4 h-4 text-green-400" />;
      default: return <FileText className="w-4 h-4 text-gray-400" />;
    }
  };

  const getTipoLabel = (tipo: string, id?: string) => {
    if (tipo === 'repesada' && id && selectedPedido) {
      const allReps = registros.filter(r => r.pedidoId === selectedPedido.id && r.tipo === 'repesada')
        .sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime());
      const index = allReps.findIndex(r => r.id === id);
      return index !== -1 ? `${index + 1}° Repesaje` : 'Repesaje';
    }
    switch (tipo) {
      case 'repesada': return 'Repesaje';
      case 'devolucion': return 'Devolución';
      case 'asignacion': return 'Adición';
      case 'entrega': return 'Entrega';
      default: return tipo;
    }
  };

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'Completado': return 'text-emerald-400 bg-emerald-400/10';
      case 'Con Incidencia': return 'text-amber-400 bg-amber-400/10';
      case 'Devolución': return 'text-red-400 bg-red-400/10';
      default: return 'text-gray-400 bg-gray-400/10';
    }
  };

  // ===================== RENDER =====================

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20 px-4">

      {/* ═══════ HEADER ═══════ */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Truck className="text-emerald-400" /> Gestión de Entregas
          </h1>
          <p className="text-gray-400 text-sm">Control de ruta, repesadas y devoluciones</p>
        </div>
        {modo !== 'LISTA' && (
          <button
            onClick={() => {
              if (modo === 'DETALLE') { setModo('GRUPO'); setSelectedPedido(null); }
              else if (modo === 'GRUPO') { setModo('LISTA'); setGrupoSeleccionado(null); }
              else { setModo('DETALLE'); setShowReasonStep(false); setSessionBlocks([]); resetForm(); }
            }}
            className="px-4 py-2 bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors flex items-center gap-2"
          >
            <ArrowRight className="w-4 h-4 rotate-180" /> Volver
          </button>
        )}
      </div>

      {/* ═══════ LISTA DE DESPACHOS (GRUPOS) ═══════ */}
      {modo === 'LISTA' && (
        <div className="space-y-5">
          {gruposDespacho.length > 0 && (
            <div className="flex items-center justify-between bg-gray-900/60 border border-gray-800 rounded-xl px-5 py-3">
              <span className="text-sm text-gray-400 flex items-center gap-2">
                <Package className="w-4 h-4 text-emerald-400" />
                <span className="text-white font-semibold">{gruposDespacho.length}</span> despacho{gruposDespacho.length !== 1 && 's'} en ruta
              </span>
              <span className="text-xs text-gray-600 hidden sm:block">
                Toque un despacho para ver los pedidos
              </span>
            </div>
          )}

          {gruposDespacho.length === 0 ? (
            <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-16 text-center text-gray-500">
              <PackageCheck className="w-14 h-14 mx-auto mb-5 opacity-20" />
              <p className="text-lg font-semibold text-gray-400">No tienes despachos asignados</p>
              <p className="text-sm text-gray-600 mt-1">Los despachos aparecerán aquí cuando sean emitidos desde Pesaje</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {gruposDespacho.map(grupo => {
                const totalRegistros = grupo.pedidos.reduce((s, p) => s + getRegistrosPedido(p.id).length, 0);
                return (
                  <div
                    key={grupo.grupoId}
                    onClick={() => {
                      // Marcar como "Despachando" si es primera vez
                      grupo.pedidos.forEach(p => {
                        if (p.estado === 'En Despacho') {
                          const fresh = pedidosConfirmados.find(fp => fp.id === p.id) || p;
                          updatePedidoConfirmado(p.id, { ...fresh, estado: 'Despachando' });
                        }
                      });
                      setGrupoSeleccionado(grupo);
                      setModo('GRUPO');
                    }}
                    className={`group relative bg-gray-900/80 border border-gray-800/80 rounded-xl overflow-hidden cursor-pointer
                      hover:border-gray-700 hover:shadow-lg hover:shadow-black/30 transition-all duration-200
                      border-l-[3px] ${getAccentColor(grupo)}`}
                  >
                    <div className="p-5">
                      {/* Top row */}
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex flex-wrap items-center gap-2">
                          {grupo.numeroTicket && (
                            <span className="font-mono text-[11px] text-emerald-400/80 bg-emerald-400/5 border border-emerald-500/20 px-2 py-0.5 rounded-md">
                              {grupo.numeroTicket}
                            </span>
                          )}
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 ring-1 ring-blue-500/20">
                            {grupo.pedidos.length} pedido{grupo.pedidos.length > 1 ? 's' : ''}
                          </span>
                          {grupo.tieneIncidencia && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 ring-1 ring-amber-500/25">
                              Incidencia
                            </span>
                          )}
                          {grupo.todosEntregados && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-500/15 text-green-400 ring-1 ring-green-500/25">
                              Entregado
                            </span>
                          )}
                        </div>
                        <ChevronRight className="w-4 h-4 text-gray-700 group-hover:text-emerald-400 transition-colors shrink-0" />
                      </div>

                      {/* Client name */}
                      <h3 className="text-white font-bold text-base leading-tight mb-3 group-hover:text-emerald-50 transition-colors">
                        {grupo.cliente}
                      </h3>

                      {/* Metrics */}
                      <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-[13px]">
                        <div className="flex items-center gap-1.5 text-gray-400">
                          <Layers className="w-3.5 h-3.5 text-gray-600 shrink-0" />
                          <span>{grupo.pedidos.length} pedido{grupo.pedidos.length > 1 ? 's' : ''}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-gray-400">
                          <Weight className="w-3.5 h-3.5 text-gray-600 shrink-0" />
                          <span className="font-semibold text-gray-300">{grupo.pesoNetoTotal.toFixed(1)} kg neto</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-gray-400">
                          <MapPin className="w-3.5 h-3.5 text-gray-600 shrink-0" />
                          <span className="truncate">{grupo.zonaEntrega || '—'}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-gray-400">
                          <History className="w-3.5 h-3.5 text-gray-600 shrink-0" />
                          <span>{totalRegistros} mov.</span>
                        </div>
                      </div>

                      {/* Pedidos preview */}
                      <div className="flex flex-wrap gap-1 mt-3">
                        {grupo.pedidos.map(p => (
                          <span key={p.id} className={`text-[10px] font-bold px-2 py-0.5 rounded-full ring-1 ring-current/20 ${getEstadoBadge(p.estado || 'En Despacho')}`}>
                            {p.numeroPedido || 'S/N'}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ═══════ VISTA DE GRUPO (PEDIDOS DEL DESPACHO) ═══════ */}
      {modo === 'GRUPO' && grupoSeleccionado && (
        <div className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-300">

          {/* Info del grupo */}
          <div className="bg-gray-900/90 border border-gray-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="h-1 w-full bg-emerald-500" />
            <div className="p-6">
              <div className="flex flex-col sm:flex-row justify-between items-start gap-5 mb-5">
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] text-emerald-400/70 font-mono uppercase tracking-[0.15em] mb-1">Despacho Consolidado</p>
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-white leading-tight truncate">{grupoSeleccionado.cliente}</h2>
                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    {grupoSeleccionado.numeroTicket && (
                      <span className="font-mono text-xs text-emerald-400/80 bg-emerald-400/5 border border-emerald-500/20 px-2 py-0.5 rounded-md">
                        {grupoSeleccionado.numeroTicket}
                      </span>
                    )}
                    <span className="text-xs text-gray-500">{grupoSeleccionado.conductor}</span>
                    <span className="text-xs text-gray-600">·</span>
                    <span className="text-xs text-gray-500">{grupoSeleccionado.zonaEntrega}</span>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="bg-black/40 border border-gray-700/50 rounded-xl px-4 py-3 text-center">
                    <p className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold mb-0.5">Neto Total</p>
                    <div className="text-2xl font-black text-green-400 tabular-nums">
                      {grupoSeleccionado.pesoNetoTotal.toFixed(1)}<span className="text-xs text-gray-500 font-normal ml-0.5">kg</span>
                    </div>
                  </div>
                  <div className="bg-black/40 border border-gray-700/50 rounded-xl px-4 py-3 text-center">
                    <p className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold mb-0.5">Bruto Total</p>
                    <div className="text-2xl font-black text-white tabular-nums">
                      {grupoSeleccionado.pesoBrutoTotal.toFixed(1)}<span className="text-xs text-gray-500 font-normal ml-0.5">kg</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Confirmar entrega total */}
              {!grupoSeleccionado.todosEntregados && (
                <button
                  onClick={handleConfirmarEntregaTotal}
                  className="w-full py-3.5 rounded-xl font-black text-white text-base transition-all hover:scale-[1.01] flex items-center justify-center gap-2 mb-3"
                  style={{ background: 'linear-gradient(135deg, #0d4a24, #166534, #22c55e)', boxShadow: '0 6px 20px -5px rgba(34,197,94,0.35)' }}
                >
                  <CheckCircle2 className="w-5 h-5" /> CONFIRMAR ENTREGA TOTAL
                </button>
              )}
            </div>
          </div>

          {/* Lista de pedidos del grupo */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest px-1">
              Pedidos del Despacho ({grupoSeleccionado.pedidos.length})
            </h3>
            {grupoSeleccionado.pedidos.map((pedido, idx) => {
              const regs = getRegistrosPedido(pedido.id);
              const freshP = pedidosConfirmados.find(p => p.id === pedido.id) || pedido;
              return (
                <div key={pedido.id} className="bg-gray-900/80 border border-gray-800/80 rounded-xl overflow-hidden">
                  <div className="p-4">
                    {/* Header del pedido */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <span className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black" style={{ background: 'rgba(59,130,246,0.1)', color: '#3b82f6' }}>
                          {idx + 1}
                        </span>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-white">{freshP.tipoAve}</span>
                            <span className="font-mono text-[10px] text-gray-500">{freshP.numeroPedido}</span>
                          </div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[10px] text-gray-500">{freshP.presentacion}</span>
                            <span className="text-[10px] text-gray-600">·</span>
                            <span className="text-[10px] text-gray-500">{freshP.cantidad} unids.</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`text-[10px] uppercase font-bold px-2.5 py-0.5 rounded-full ring-1 ring-current/20 ${getEstadoBadge(freshP.estado || 'En Despacho')}`}>
                          {freshP.estado}
                        </span>
                      </div>
                    </div>

                    {/* Metrics del pedido */}
                    <div className="grid grid-cols-3 gap-2 mb-3">
                      <div className="rounded-lg p-2 text-center" style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.04)' }}>
                        <div className="text-[9px] text-gray-500 uppercase">Bruto</div>
                        <div className="text-sm font-black text-white tabular-nums">{(freshP.pesoBrutoTotal || 0).toFixed(1)} kg</div>
                      </div>
                      <div className="rounded-lg p-2 text-center" style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.04)' }}>
                        <div className="text-[9px] text-gray-500 uppercase">Neto</div>
                        <div className="text-sm font-black text-green-400 tabular-nums">{(freshP.pesoNetoTotal || freshP.pesoKg || 0).toFixed(1)} kg</div>
                      </div>
                      <div className="rounded-lg p-2 text-center" style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.04)' }}>
                        <div className="text-[9px] text-gray-500 uppercase">Movs.</div>
                        <div className="text-sm font-black text-gray-300 tabular-nums">{regs.length}</div>
                      </div>
                    </div>

                    {/* Botones de acción individuales */}
                    {freshP.estado !== 'Entregado' && (
                      <div className="grid grid-cols-4 gap-2">
                        <button
                          onClick={(e) => { e.stopPropagation(); setSelectedPedido(freshP); setSessionBlocks([]); resetForm(); setModo('REPESADA'); }}
                          className="flex flex-col items-center gap-1 p-2.5 rounded-lg transition-all text-[9px] font-bold bg-blue-900/10 ring-1 ring-blue-500/20 text-blue-300 hover:bg-blue-900/25"
                        >
                          <Scale className="w-4 h-4" />REPESADA
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); setSelectedPedido(freshP); setSessionBlocks([]); resetForm(); setShowReasonStep(false); setModo('DEVOLUCION'); }}
                          className="flex flex-col items-center gap-1 p-2.5 rounded-lg transition-all text-[9px] font-bold bg-orange-900/10 ring-1 ring-orange-500/20 text-red-300 hover:bg-orange-900/25"
                        >
                          <RotateCcw className="w-4 h-4" />DEVOLUCIÓN
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); setSelectedPedido(freshP); setSessionBlocks([]); resetForm(); setModo('ASIGNACION'); }}
                          className="flex flex-col items-center gap-1 p-2.5 rounded-lg transition-all text-[9px] font-bold bg-emerald-900/10 ring-1 ring-emerald-500/20 text-emerald-300 hover:bg-emerald-900/25"
                        >
                          <UserPlus className="w-4 h-4" />ADICIÓN
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleConfirmarEntregaPedido(freshP); }}
                          className="flex flex-col items-center gap-1 p-2.5 rounded-lg transition-all text-[9px] font-bold bg-green-900/10 ring-1 ring-green-500/20 text-green-300 hover:bg-green-900/25"
                        >
                          <CheckCircle2 className="w-4 h-4" />ENTREGA
                        </button>
                      </div>
                    )}

                    {/* Historial del pedido */}
                    {regs.length > 0 && (
                      <div className="mt-3 pt-3 space-y-2" style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                        <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">Historial</p>
                        {regs.slice(0, 3).map(reg => (
                          <div key={reg.id} className="flex items-center justify-between px-3 py-2 rounded-lg" style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.03)' }}>
                            <div className="flex items-center gap-2">
                              {getTipoIcon(reg.tipo)}
                              <span className="text-xs font-bold text-white">{getTipoLabel(reg.tipo, reg.id)}</span>
                              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${getEstadoColor(reg.estado)}`}>{reg.estado}</span>
                            </div>
                            <div className="flex items-center gap-2 text-[10px] text-gray-500">
                              {reg.peso && <span className="font-mono font-bold text-white">{reg.peso.toFixed(1)} kg</span>}
                              <span>{new Date(reg.fecha).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                          </div>
                        ))}
                        {regs.length > 3 && (
                          <button
                            onClick={() => { setSelectedPedido(freshP); setModo('DETALLE'); }}
                            className="text-[10px] text-emerald-400 font-bold hover:underline"
                          >
                            Ver {regs.length - 3} más →
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ═══════ DETALLE INDIVIDUAL (timeline completo) ═══════ */}
      {modo === 'DETALLE' && selectedPedido && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="bg-gray-900/90 border border-gray-800 rounded-2xl overflow-hidden shadow-xl">
            <div className={`h-1 w-full ${
              selectedPedido.estado === 'Devolución' ? 'bg-red-500' :
              selectedPedido.estado === 'Con Incidencia' ? 'bg-amber-500' : 'bg-emerald-500'
            }`} />
            <div className="p-6">
              <div className="flex justify-between items-start gap-4 mb-4">
                <div>
                  <p className="text-[11px] text-emerald-400/70 font-mono uppercase tracking-[0.15em] mb-1">Detalle del Pedido</p>
                  <h2 className="text-xl font-extrabold text-white">{selectedPedido.cliente}</h2>
                  <div className="flex flex-wrap items-center gap-2 mt-1">
                    <span className="bg-gray-800/80 border border-gray-700/50 px-2 py-0.5 rounded-md text-xs text-gray-300">{selectedPedido.tipoAve}</span>
                    <span className="bg-gray-800/80 border border-gray-700/50 px-2 py-0.5 rounded-md text-xs text-gray-300">{selectedPedido.presentacion}</span>
                    <span className="font-mono text-[10px] text-gray-500">{selectedPedido.numeroPedido}</span>
                  </div>
                </div>
                <div className="bg-black/40 border border-gray-700/50 rounded-xl px-4 py-3 text-center">
                  <p className="text-[10px] text-gray-500 uppercase">Peso Bruto</p>
                  <div className="text-2xl font-black text-white tabular-nums">{(selectedPedido.pesoBrutoTotal || 0).toFixed(1)}<span className="text-xs text-gray-500 ml-0.5">kg</span></div>
                </div>
              </div>

              <div className={`mb-4 flex items-center gap-3 bg-gray-800/40 border border-gray-700/40 rounded-xl px-4 py-3`}>
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                  selectedPedido.estado === 'Devolución' ? 'bg-red-500/15' :
                  selectedPedido.estado === 'Con Incidencia' ? 'bg-amber-500/15' : 'bg-emerald-500/15'
                }`}>
                  {selectedPedido.estado === 'Devolución' ? <RotateCcw className="w-4 h-4 text-red-400" /> :
                   selectedPedido.estado === 'Con Incidencia' ? <AlertCircle className="w-4 h-4 text-amber-400" /> :
                   <Truck className="w-4 h-4 text-emerald-400" />}
                </div>
                <div>
                  <p className="text-[10px] text-gray-500 uppercase tracking-wider">Estado</p>
                  <p className={`text-sm font-bold ${
                    selectedPedido.estado === 'Devolución' ? 'text-red-400' :
                    selectedPedido.estado === 'Con Incidencia' ? 'text-amber-400' : 'text-emerald-400'
                  }`}>{selectedPedido.estado}</p>
                </div>
              </div>

              {selectedPedido.estado !== 'Entregado' && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button onClick={() => { setSessionBlocks([]); resetForm(); setModo('REPESADA'); }}
                    className="flex flex-col items-center gap-1.5 p-3 rounded-xl text-[10px] font-bold bg-blue-900/10 ring-1 ring-blue-500/25 text-blue-300 hover:bg-blue-900/25">
                    <Scale className="w-5 h-5" />REPESADA
                  </button>
                  <button onClick={() => { setSessionBlocks([]); resetForm(); setShowReasonStep(false); setModo('DEVOLUCION'); }}
                    className="flex flex-col items-center gap-1.5 p-3 rounded-xl text-[10px] font-bold bg-orange-900/10 ring-1 ring-orange-500/25 text-red-300 hover:bg-orange-900/25">
                    <RotateCcw className="w-5 h-5" />DEVOLUCIÓN
                  </button>
                  <button onClick={() => { setSessionBlocks([]); resetForm(); setModo('ASIGNACION'); }}
                    className="flex flex-col items-center gap-1.5 p-3 rounded-xl text-[10px] font-bold bg-emerald-900/10 ring-1 ring-emerald-500/25 text-emerald-300 hover:bg-emerald-900/25">
                    <UserPlus className="w-5 h-5" />ADICIÓN
                  </button>
                  <button onClick={() => handleConfirmarEntregaPedido(selectedPedido)}
                    className="flex flex-col items-center gap-1.5 p-3 rounded-xl text-[10px] font-bold bg-green-900/10 ring-1 ring-green-500/25 text-green-300 hover:bg-green-900/25">
                    <CheckCircle2 className="w-5 h-5" />ENTREGA
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Timeline completo */}
          <div className="space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2 px-1">
              <History className="w-4 h-4 text-gray-500" /> Registro de Movimientos
            </h3>
            {getRegistrosPedido(selectedPedido.id).length === 0 ? (
              <div className="bg-gray-900/30 border border-dashed border-gray-800 rounded-xl p-14 text-center">
                <History className="w-10 h-10 mx-auto mb-3 text-gray-700" />
                <p className="text-gray-500 text-sm">Sin movimientos registrados aún</p>
              </div>
            ) : (
              <div className="relative pl-6">
                <div className="absolute left-[10px] top-2 bottom-2 w-px bg-gray-800" />
                <div className="space-y-4">
                  {getRegistrosPedido(selectedPedido.id).map(reg => (
                    <div key={reg.id} className="relative">
                      <div className={`absolute -left-6 top-5 w-[9px] h-[9px] rounded-full ring-2 ring-gray-900 z-10 ${
                        reg.tipo === 'repesada' ? 'bg-blue-400' :
                        reg.tipo === 'devolucion' ? 'bg-orange-400' :
                        reg.tipo === 'asignacion' ? 'bg-emerald-400' :
                        reg.tipo === 'entrega' ? 'bg-green-400' : 'bg-gray-500'
                      }`} />
                      <div className="bg-gray-900/50 border border-gray-800/70 rounded-xl p-4 hover:border-gray-700 transition-colors">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          {getTipoIcon(reg.tipo)}
                          <span className="text-sm font-bold text-white">{getTipoLabel(reg.tipo, reg.id)}</span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ring-1 ring-current/20 ${getEstadoColor(reg.estado)}`}>{reg.estado}</span>
                          <span className="ml-auto text-[11px] text-gray-500 flex items-center gap-1 tabular-nums">
                            <Calendar className="w-3 h-3" />{new Date(reg.fecha).toLocaleDateString()}
                            <span className="text-gray-700 mx-0.5">·</span>
                            <Clock className="w-3 h-3" />{new Date(reg.fecha).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <div className="space-y-1">
                          {reg.peso && (
                            <div className="flex items-center gap-2 text-sm text-gray-300">
                              <Weight className="w-4 h-4 text-gray-600" />Peso: <span className="text-white font-bold">{reg.peso.toFixed(1)} kg</span>
                            </div>
                          )}
                          {reg.motivo && (
                            <p className="text-sm text-orange-300 bg-orange-900/15 border border-orange-500/15 px-3 py-1.5 rounded-lg">"{reg.motivo}"</p>
                          )}
                          {reg.nuevoClienteNombre && (
                            <div className="flex items-center gap-2 text-sm text-gray-300">
                              <User className="w-4 h-4 text-gray-600" />Cliente: <span className="text-emerald-400 font-bold">{reg.nuevoClienteNombre}</span>
                            </div>
                          )}
                        </div>
                        {reg.fotos.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mt-2">
                            {reg.fotos.map((f, fi) => (
                              <div key={fi} className="w-14 h-14 rounded-lg bg-gray-800 border border-gray-700 overflow-hidden cursor-pointer hover:border-emerald-500/60 transition-all"
                                onClick={() => window.open(f.url, '_blank')}>
                                <img src={f.url} alt="" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).src = 'https://via.placeholder.com/64?text=No+Image'; }} />
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═══════ FORMULARIOS DE ACCIÓN (REPESADA / DEVOLUCION / ASIGNACION) ═══════ */}
      {(modo === 'REPESADA' || modo === 'DEVOLUCION' || modo === 'ASIGNACION') && selectedPedido && (
        <div className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="bg-gray-900/90 border border-gray-800 rounded-2xl overflow-hidden shadow-xl">
            <div className={`h-1 w-full ${modo === 'REPESADA' ? 'bg-blue-500' : modo === 'DEVOLUCION' ? 'bg-orange-500' : 'bg-emerald-500'}`} />
            <div className="p-6 space-y-6 relative">
              <button onClick={() => { setModo('GRUPO'); setShowReasonStep(false); }} className="absolute top-4 right-4 p-1.5 text-gray-600 hover:text-white transition-colors rounded-lg hover:bg-gray-800">
                <X className="w-5 h-5" />
              </button>

              {/* Title */}
              <div className="flex items-center gap-3 pr-8">
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
                  modo === 'REPESADA' ? 'bg-blue-500/15 text-blue-400' :
                  modo === 'DEVOLUCION' ? 'bg-orange-500/15 text-orange-400' : 'bg-emerald-500/15 text-emerald-400'
                }`}>
                  {modo === 'REPESADA' && <Scale className="w-5 h-5" />}
                  {modo === 'DEVOLUCION' && <RotateCcw className="w-5 h-5" />}
                  {modo === 'ASIGNACION' && <UserPlus className="w-5 h-5" />}
                </div>
                <div>
                  <h2 className="text-lg font-extrabold text-white uppercase tracking-tight">
                    {modo === 'REPESADA' ? 'Registrar Repesada' : modo === 'DEVOLUCION' ? (showReasonStep ? 'Motivo de Devolución' : 'Registrar Devolución') : 'Registrar Adición'}
                  </h2>
                  <p className="text-xs text-gray-500">Pedido: {selectedPedido.numeroPedido} · {selectedPedido.tipoAve}</p>
                </div>
              </div>

              {/* Info del pedido */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-black/30 border border-gray-800/80 rounded-xl p-3 text-center">
                  <p className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">Cliente</p>
                  <p className="text-sm font-bold text-white truncate mt-0.5">{selectedPedido.cliente}</p>
                </div>
                <div className="bg-black/30 border border-gray-800/80 rounded-xl p-3 text-center">
                  <p className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">Producto</p>
                  <p className="text-sm font-bold text-white truncate mt-0.5">{selectedPedido.presentacion}</p>
                </div>
                <div className="bg-emerald-900/15 border border-emerald-500/25 rounded-xl p-3 text-center">
                  <p className="text-[10px] text-emerald-400 uppercase tracking-wider font-bold">Peso Bruto</p>
                  <p className="text-lg font-black text-emerald-400 mt-0.5">{(selectedPedido.pesoBrutoTotal || 0).toFixed(1)} kg</p>
                </div>
                <div className="bg-blue-900/15 border border-blue-500/25 rounded-xl p-3 text-center">
                  <p className="text-[10px] text-blue-400 uppercase tracking-wider font-bold">Peso Neto</p>
                  <p className="text-lg font-black text-blue-400 mt-0.5">{(selectedPedido.pesoNetoTotal || selectedPedido.pesoKg || 0).toFixed(1)} kg</p>
                </div>
              </div>

              {/* Client selector (ASIGNACION) */}
              {modo === 'ASIGNACION' && (
                <div>
                  <label className="block text-xs font-bold text-emerald-400 uppercase tracking-widest mb-2">Nuevo Cliente <span className="text-red-400">*</span></label>
                  <select value={newClientId} onChange={(e) => setNewClientId(e.target.value)}
                    className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500 transition-all">
                    <option value="">-- Seleccionar cliente --</option>
                    {clientes.filter(c => c.id !== selectedPedido?.id).map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                  </select>
                </div>
              )}

              {/* Weight + Photo */}
              {!showReasonStep && (
                <div className="space-y-4">
                  {formWeight && capturedPhotos.length === 0 && (
                    <div className="bg-amber-500/10 border-2 border-amber-500/50 rounded-xl p-4 flex items-center gap-3 animate-bounce">
                      <AlertTriangle className="w-6 h-6 text-amber-500 shrink-0" />
                      <p className="text-amber-200 font-bold text-sm uppercase">¡Debe tomar la foto de evidencia antes de sumar!</p>
                    </div>
                  )}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">
                        {modo === 'ASIGNACION' ? 'Peso a Añadir (KG)' : 'Peso Registrado (KG)'} <span className="text-red-400">*</span>
                      </label>
                      <div className="relative">
                        <input type="number" step="0.1" min="0" value={formWeight} onChange={(e) => setFormWeight(e.target.value)} placeholder="0.0"
                          className="w-full bg-gray-950 border-2 border-gray-800 rounded-xl px-4 py-4 text-white text-3xl font-black focus:outline-none focus:border-emerald-500 transition-all pr-12 shadow-inner" />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold text-lg">kg</span>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-emerald-400 uppercase tracking-widest mb-2">Evidencia <span className="text-red-400">*</span></label>
                      <button onClick={handleCapturePhoto}
                        className={`w-full h-[68px] border-2 rounded-xl flex items-center justify-center gap-3 transition-all font-black text-lg group shadow-lg active:scale-95 ${
                          capturedPhotos.length > 0 ? 'bg-emerald-900/30 border-emerald-500 text-emerald-400' : 'bg-gray-800 border-amber-500/50 text-white hover:bg-gray-700'
                        }`}>
                        <Camera className={`w-6 h-6 group-hover:scale-110 transition-transform ${capturedPhotos.length > 0 ? 'text-emerald-400' : 'text-amber-400'}`} />
                        {capturedPhotos.length > 0 ? 'FOTO CAPTURADA' : 'TOMAR FOTO'}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Photo preview */}
              {capturedPhotos.length > 0 && (
                <div className="flex flex-wrap gap-2 p-3 bg-black/30 border border-gray-800/70 rounded-xl">
                  {capturedPhotos.map((p, i) => (
                    <div key={i} className="relative group">
                      <div className="w-16 h-16 rounded-lg overflow-hidden border border-gray-700">
                        <img src={p} alt="" className="w-full h-full object-cover" />
                      </div>
                      <button onClick={() => setCapturedPhotos([])} className="absolute -top-1 -right-1 bg-red-500 rounded-full p-0.5"><X className="w-3 h-3 text-white" /></button>
                    </div>
                  ))}
                </div>
              )}

              {/* Action area */}
              <div className="space-y-4">
                {!showReasonStep && (
                  <button onClick={handleAddBlock} disabled={!formWeight || capturedPhotos.length === 0}
                    className={`w-full py-5 border-2 rounded-2xl font-black text-xl flex items-center justify-center gap-3 transition-all shadow-xl active:scale-[0.98] disabled:opacity-30 disabled:grayscale ${
                      modo === 'REPESADA' ? 'bg-blue-600/90 border-blue-400/60 text-white hover:bg-blue-500/90' :
                      modo === 'DEVOLUCION' ? 'bg-orange-600/90 border-orange-400/60 text-white hover:bg-orange-500/90' :
                      'bg-emerald-600/90 border-emerald-400/60 text-white hover:bg-emerald-500/90'
                    }`}>
                    <Plus className="w-7 h-7" /> SUMAR {modo === 'REPESADA' ? 'PESADA' : 'BLOQUE'}
                  </button>
                )}

                {sessionBlocks.length > 0 && (
                  <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4 space-y-3">
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Registros ({sessionBlocks.length})</p>
                    <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto pr-1">
                      {sessionBlocks.map((b, i) => (
                        <div key={i} className="flex items-center justify-between bg-black/40 border border-gray-700/60 rounded-lg p-3">
                          <div className="flex items-center gap-3">
                            <div className="w-11 h-11 rounded-lg overflow-hidden border border-gray-600/60 shrink-0">
                              <img src={b.foto} className="w-full h-full object-cover" />
                            </div>
                            <span className="text-white font-bold">{i + 1}° Bloque</span>
                          </div>
                          <span className={`text-xl font-black tabular-nums ${
                            modo === 'REPESADA' ? 'text-blue-400' : modo === 'DEVOLUCION' ? 'text-orange-400' : 'text-emerald-400'
                          }`}>{b.peso.toFixed(1)} kg</span>
                        </div>
                      ))}
                    </div>
                    <div className={`p-4 border rounded-xl flex justify-between items-center ${
                      modo === 'REPESADA' ? 'bg-blue-900/25 border-blue-500/30' :
                      modo === 'DEVOLUCION' ? 'bg-orange-900/25 border-orange-500/30' : 'bg-emerald-900/25 border-emerald-500/30'
                    }`}>
                      <span className="text-white font-extrabold text-sm uppercase tracking-wider">Total</span>
                      <span className="text-2xl font-black text-white tabular-nums">{sessionBlocks.reduce((a, b) => a + b.peso, 0).toFixed(1)} kg</span>
                    </div>
                  </div>
                )}

                {/* Devolucion reason */}
                {modo === 'DEVOLUCION' && showReasonStep && (
                  <div className="bg-orange-500/5 border border-orange-500/20 rounded-xl p-5">
                    <label className="block text-sm font-bold text-orange-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4" /> ¿Cuál es el motivo? <span className="text-red-400">*</span>
                    </label>
                    <textarea value={formReason} autoFocus onChange={(e) => setFormReason(e.target.value)}
                      className="w-full bg-black/50 border border-gray-700 rounded-xl px-4 py-3 text-white text-base focus:outline-none focus:border-orange-500 transition-all h-32 resize-none placeholder:text-gray-600"
                      placeholder="Ej: Producto dañado, cliente no aceptó..." maxLength={200} />
                    <div className="flex justify-between items-center mt-2">
                      <button onClick={() => setShowReasonStep(false)} className="text-xs text-orange-400/50 hover:text-orange-400 font-bold uppercase underline transition-colors">Volver a pesar</button>
                      <p className="text-[10px] text-gray-500 font-mono tabular-nums">{formReason.length}/200</p>
                    </div>
                  </div>
                )}

                {/* Finish buttons */}
                {(modo === 'REPESADA' || (modo === 'ASIGNACION' && !showReasonStep)) && (
                  <button onClick={modo === 'REPESADA' ? handleFinishRepesada : handleFinishAsignacion}
                    className={`w-full py-4 rounded-xl font-extrabold text-lg shadow-xl transition-all flex items-center justify-center gap-3 active:scale-[0.98] ${
                      sessionBlocks.length > 0 && (modo !== 'ASIGNACION' || newClientId) ? 'bg-emerald-600 hover:bg-emerald-500 text-white' : 'bg-gray-800 text-gray-500 cursor-not-allowed opacity-50'
                    }`} disabled={sessionBlocks.length === 0 || (modo === 'ASIGNACION' && !newClientId)}>
                    <CheckCircle2 className="w-5 h-5" /> FINALIZAR {modo === 'REPESADA' ? 'REPESADA' : 'ADICIÓN'}
                  </button>
                )}

                {modo === 'DEVOLUCION' && (
                  showReasonStep ? (
                    <button onClick={handleFinishDevolucion}
                      className={`w-full py-5 rounded-xl font-extrabold text-xl shadow-xl transition-all flex items-center justify-center gap-3 active:scale-[0.98] ${
                        formReason.length >= 3 ? 'bg-emerald-600 hover:bg-emerald-500 text-white' : 'bg-gray-800 text-gray-500 cursor-not-allowed opacity-50'
                      }`} disabled={formReason.length < 3}>
                      <CheckCircle2 className="w-6 h-6" /> CONFIRMAR DEVOLUCIÓN
                    </button>
                  ) : (
                    <button onClick={() => { if (sessionBlocks.length > 0) setShowReasonStep(true); else toast.error("Debe agregar al menos una pesada"); }}
                      className={`w-full py-4 rounded-xl font-extrabold text-lg shadow-xl transition-all flex items-center justify-center gap-3 active:scale-[0.98] ${
                        sessionBlocks.length > 0 ? 'bg-orange-600 hover:bg-orange-500 text-white' : 'bg-gray-800 text-gray-500 cursor-not-allowed opacity-50'
                      }`} disabled={sessionBlocks.length === 0}>
                      <ArrowRight className="w-5 h-5" /> CONTINUAR A MOTIVO
                    </button>
                  )
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
