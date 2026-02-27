import { useState, useEffect } from "react";
import {
  Truck,
  Scale,
  RotateCcw,
  Camera,
  CheckCircle2,
  AlertTriangle,
  UserPlus,
  ArrowRight,
  ChevronRight,
  History,
  Camera as CameraIcon,
  X,
  PackageCheck,
  FileText,
  User,
  MapPin,
  Clock,
  Weight,
  AlertCircle,
  Package,
  Download,
  Calendar,
  Plus
} from "lucide-react";
import { useApp } from "../contexts/AppContext";
import { toast } from "sonner";

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

export function GestionConductor() {
  const { pedidosConfirmados, clientes, updatePedidoConfirmado } = useApp();
  const [selectedPedido, setSelectedPedido] = useState<any | null>(null);
  const [modo, setModo] = useState<'LISTA' | 'DETALLE' | 'REPESADA' | 'DEVOLUCION' | 'ASIGNACION'>('LISTA');

  // Estados para formularios
  const [formWeight, setFormWeight] = useState("");
  const [formReason, setFormReason] = useState("");
  const [capturedPhotos, setCapturedPhotos] = useState<string[]>([]);
  const [newClientId, setNewClientId] = useState("");
  const [sessionBlocks, setSessionBlocks] = useState<{ peso: number; foto: string }[]>([]);
  const [showReasonStep, setShowReasonStep] = useState(false);

  // Historial local de registros
  const [registros, setRegistros] = useState<RegistroConductor[]>(() => {
    const saved = localStorage.getItem('registrosConductor');
    return saved ? JSON.parse(saved) : [];
  });

  // Estado para doble confirmaciÃ³n de entrega
  const [confirmStep, setConfirmStep] = useState<0 | 1 | 2>(0);

  // Guardar registros en localStorage
  useEffect(() => {
    localStorage.setItem('registrosConductor', JSON.stringify(registros));
  }, [registros]);

  // Filtrar pedidos en ruta del conductor
  const pedidosRuta = pedidosConfirmados.filter((p: any) => 
    p.estado === 'En Despacho' || p.estado === 'Despachando' || p.estado === 'En Ruta' || p.estado === 'Con Incidencia' || p.estado === 'Devolución' || p.estado === 'Confirmado con Adición'
  );

  // Helper: obtener datos frescos del pedido desde el contexto (evita estado local obsoleto)
  const getFreshPedido = () => {
    if (!selectedPedido) return null;
    return pedidosConfirmados.find((p: any) => p.id === selectedPedido.id) || selectedPedido;
  };

  const handleCapturePhoto = () => {
    // SimulaciÃ³n de captura de foto con timestamp
    const mockPhoto = `https://images.unsplash.com/photo-${Math.floor(Math.random() * 1000000)}?w=400&t=${Date.now()}`;
    setCapturedPhotos([...capturedPhotos, mockPhoto]);
    toast.success("Foto capturada correctamente");
  };

  const resetForm = () => {
    setFormWeight("");
    setFormReason("");
    setCapturedPhotos([]);
    setNewClientId("");
  };

  const generarId = () => `REG-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  const handleAddBlock = () => {
    if (!formWeight || capturedPhotos.length === 0) {
      toast.error("Debe ingresar el peso y capturar una foto");
      return;
    }
    setSessionBlocks([...sessionBlocks, { peso: parseFloat(formWeight), foto: capturedPhotos[0] }]);
    setFormWeight("");
    setCapturedPhotos([]);
    toast.success("Pesada agregada");
  };

  const handleFinishRepesada = () => {
    if (sessionBlocks.length === 0) {
      toast.error("Debe agregar al menos una pesada");
      return;
    }

    const pesoTotalRepesada = sessionBlocks.reduce((acc, b) => acc + b.peso, 0);
    const fresh = getFreshPedido();
    const pesoOriginal = fresh?.pesoBrutoTotal || 0;
    const diferencia = Math.abs(pesoOriginal - pesoTotalRepesada);
    const margenTolerancia = 0.5;

    const nuevoRegistro: RegistroConductor = {
      id: generarId(),
      pedidoId: selectedPedido.id,
      tipo: 'repesada',
      peso: pesoTotalRepesada,
      fotos: sessionBlocks.map(b => ({ 
        tipo: 'repesada', 
        url: b.foto, 
        fecha: new Date().toISOString() 
      })),
      fecha: new Date().toISOString(),
      estado: diferencia <= margenTolerancia ? 'Completado' : 'Con Incidencia'
    };

    setRegistros([...registros, nuevoRegistro]);

    const updatedPedido = {
      ...fresh,
      estado: diferencia <= margenTolerancia ? 'En Ruta' : 'Con Incidencia',
      pesoRepesada: pesoTotalRepesada,
      ultimaIncidencia: diferencia <= margenTolerancia ? null : 'Diferencia de peso detectada'
    };
    console.log(`[CONDUCTOR] Enviando repesada: pedidoId=${selectedPedido.id}, pesoRepesada=${pesoTotalRepesada}, fechaPesaje=${fresh?.fechaPesaje}, ticketEmitido=${fresh?.ticketEmitido}`);
    updatePedidoConfirmado(selectedPedido.id, updatedPedido);
    setSelectedPedido(updatedPedido);

    toast.success(`Repesada finalizada: ${pesoTotalRepesada.toFixed(1)} kg totales`);
    setModo('DETALLE');
    setSessionBlocks([]);
    resetForm();
  };

  const handleFinishDevolucion = () => {
    if (sessionBlocks.length === 0) {
      toast.error("Debe agregar al menos una pesada de devoluciÃ³n");
      return;
    }
    if (!formReason) {
      toast.error("Debe ingresar el motivo de la devoluciÃ³n");
      return;
    }

    const pesoTotalDevolucion = sessionBlocks.reduce((acc, b) => acc + b.peso, 0);
    const fresh = getFreshPedido();

    const nuevoRegistro: RegistroConductor = {
      id: generarId(),
      pedidoId: selectedPedido.id,
      tipo: 'devolucion',
      peso: pesoTotalDevolucion,
      motivo: formReason,
      fotos: sessionBlocks.map(b => ({ 
        tipo: 'devolucion', 
        url: b.foto, 
        fecha: new Date().toISOString() 
      })),
      fecha: new Date().toISOString(),
      estado: 'Con Incidencia'
    };

    setRegistros([...registros, nuevoRegistro]);

    const updatedPedido = {
      ...fresh,
      estado: 'DevoluciÃ³n',
      pesoDevolucion: pesoTotalDevolucion,
      motivoDevolucion: formReason,
      ultimaIncidencia: 'Producto devuelto'
    };
    updatePedidoConfirmado(selectedPedido.id, updatedPedido);
    setSelectedPedido(updatedPedido);

    toast.warning(`DevoluciÃ³n finalizada: ${pesoTotalDevolucion.toFixed(1)} kg totales`);
    setModo('DETALLE');
    setSessionBlocks([]);
    resetForm();
  };

  const handleFinishAsignacion = () => {
    if (sessionBlocks.length === 0) {
      toast.error("Debe agregar al menos una pesada");
      return;
    }
    if (!newClientId) {
      toast.error("Debe seleccionar un cliente");
      return;
    }

    const pesoTotalAsignacion = sessionBlocks.reduce((acc, b) => acc + b.peso, 0);
    const clienteObj = clientes.find((c: any) => c.id === newClientId);
    const fresh = getFreshPedido();

    const nuevoRegistro: RegistroConductor = {
      id: generarId(),
      pedidoId: selectedPedido.id,
      tipo: 'asignacion',
      peso: pesoTotalAsignacion,
      nuevoClienteId: newClientId,
      nuevoClienteNombre: clienteObj?.nombre,
      fotos: sessionBlocks.map(b => ({ 
        tipo: 'asignacion', 
        url: b.foto, 
        fecha: new Date().toISOString() 
      })),
      fecha: new Date().toISOString(),
      estado: 'Completado'
    };

    setRegistros([...registros, nuevoRegistro]);

    const updatedPedido = {
      ...fresh,
      estado: 'Confirmado con AdiciÃ³n',
      pesoAdicional: pesoTotalAsignacion,
      clienteAdicionalId: newClientId,
      ultimaIncidencia: `AdiciÃ³n para ${clienteObj?.nombre}`
    };
    updatePedidoConfirmado(selectedPedido.id, updatedPedido);
    setSelectedPedido(updatedPedido);

    toast.success(`AdiciÃ³n finalizada: ${pesoTotalAsignacion.toFixed(1)} kg para ${clienteObj?.nombre}`);
    setModo('DETALLE');
    setSessionBlocks([]);
    resetForm();
  };

  const getRegistrosPedido = (id: string) => {
    return registros
      .filter(r => r.pedidoId === id)
      .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
  };

  // Confirmar entrega directa con advertencia simple
  const handleConfirmarEntrega = () => {
    if (!selectedPedido) return;
    
    const nuevoRegistro: RegistroConductor = {
      id: generarId(),
      pedidoId: selectedPedido.id,
      tipo: 'entrega',
      fotos: [],
      fecha: new Date().toISOString(),
      estado: 'Completado'
    };

    setRegistros([...registros, nuevoRegistro]);

    const fresh = getFreshPedido();
    updatePedidoConfirmado(selectedPedido.id, {
      ...fresh,
      estado: 'Entregado',
      fechaEntrega: new Date().toISOString()
    });

    toast.success('Entrega confirmada exitosamente');
    setConfirmStep(0);
    setModo('LISTA');
    setSelectedPedido(null);
  };

  const cancelarConfirmacion = () => {
    setConfirmStep(0);
  };

  const getEstadoColor = (estado: string) => {
    switch(estado) {
      case 'Completado': return 'text-emerald-400 bg-emerald-400/10';
      case 'Con Incidencia': return 'text-amber-400 bg-amber-400/10';
      case 'DevoluciÃ³n': return 'text-red-400 bg-red-400/10';
      default: return 'text-gray-400 bg-gray-400/10';
    }
  };

  const getTipoIcon = (tipo: string) => {
    switch(tipo) {
      case 'repesada': return <Scale className="w-4 h-4 text-blue-400" />;
      case 'devolucion': return <RotateCcw className="w-4 h-4 text-orange-400" />;
      case 'asignacion': return <UserPlus className="w-4 h-4 text-emerald-400" />;
      case 'entrega': return <CheckCircle2 className="w-4 h-4 text-green-400" />;
      default: return <FileText className="w-4 h-4 text-gray-400" />;
    }
  };

  const getTipoLabel = (tipo: string, id?: string) => {
    if (tipo === 'repesada' && id && selectedPedido) {
      const allReps = registros
        .filter(r => r.pedidoId === selectedPedido.id && r.tipo === 'repesada')
        .sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime());
      const index = allReps.findIndex(r => r.id === id);
      return index !== -1 ? `${index + 1}Â° Repesaje` : 'Repesaje';
    }
    switch(tipo) {
      case 'repesada': return 'Repesaje';
      case 'devolucion': return 'DevoluciÃ³n';
      case 'asignacion': return 'AdiciÃ³n';
      case 'entrega': return 'Entrega';
      default: return tipo;
    }
  };


  // ── helpers for estado badge colors used in LISTA cards ──
  const getEstadoBadge = (estado: string) => {
    switch (estado) {
      case 'Devolución':
        return 'bg-red-500/15 text-red-400 ring-red-500/25';
      case 'Con Incidencia':
        return 'bg-amber-500/15 text-amber-400 ring-amber-500/25';
      case 'Despachando':
        return 'bg-blue-500/15 text-blue-400 ring-blue-500/25';
      case 'Confirmado con Adición':
        return 'bg-teal-500/15 text-teal-400 ring-teal-500/25';
      case 'En Ruta':
        return 'bg-purple-500/15 text-purple-400 ring-purple-500/25';
      default:
        return 'bg-emerald-500/15 text-emerald-400 ring-emerald-500/25';
    }
  };

  const getAccentColor = (estado: string) => {
    switch (estado) {
      case 'Devolución': return 'border-l-red-500';
      case 'Con Incidencia': return 'border-l-amber-500';
      case 'Despachando': return 'border-l-blue-500';
      case 'Confirmado con Adición': return 'border-l-teal-500';
      default: return 'border-l-emerald-500';
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20 px-4">
      {/* ═══════════════════════  HEADER  ═══════════════════════ */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Truck className="text-emerald-400" /> Gestión de Entregas
          </h1>
          <p className="text-gray-400 text-sm">Control de ruta, repesadas y devoluciones</p>
        </div>
        {modo !== 'LISTA' && (
          <button
            onClick={() => { setModo('LISTA'); setSelectedPedido(null); }}
            className="px-4 py-2 bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors flex items-center gap-2"
          >
            <ArrowRight className="w-4 h-4 rotate-180" /> Volver
          </button>
        )}
      </div>

      {/* ═══════════════════════  LISTA  ═══════════════════════ */}
      {modo === 'LISTA' && (
        <div className="space-y-5">
          {/* Counter bar */}
          {pedidosRuta.length > 0 && (
            <div className="flex items-center justify-between bg-gray-900/60 border border-gray-800 rounded-xl px-5 py-3">
              <span className="text-sm text-gray-400 flex items-center gap-2">
                <Package className="w-4 h-4 text-emerald-400" />
                <span className="text-white font-semibold">{pedidosRuta.length}</span> pedido{pedidosRuta.length !== 1 && 's'} en ruta
              </span>
              <span className="text-xs text-gray-600 hidden sm:block">
                Toque un pedido para ver detalles
              </span>
            </div>
          )}

          {pedidosRuta.length === 0 ? (
            <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-16 text-center text-gray-500">
              <PackageCheck className="w-14 h-14 mx-auto mb-5 opacity-20" />
              <p className="text-lg font-semibold text-gray-400">No tienes pedidos asignados</p>
              <p className="text-sm text-gray-600 mt-1">Los pedidos aparecerán aquí cuando sean despachados</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {pedidosRuta.map((pedido: any) => {
                const registrosPedido = getRegistrosPedido(pedido.id);
                const ultimoRegistro = registrosPedido[0];

                return (
                  <div
                    key={pedido.id}
                    onClick={() => {
                      if (pedido.estado === 'En Despacho') {
                        const updatedPedido = { ...pedido, estado: 'Despachando' };
                        updatePedidoConfirmado(pedido.id, updatedPedido);
                        setSelectedPedido(updatedPedido);
                      } else {
                        setSelectedPedido(pedido);
                      }
                      setModo('DETALLE');
                    }}
                    className={`group relative bg-gray-900/80 border border-gray-800/80 rounded-xl overflow-hidden cursor-pointer
                      hover:border-gray-700 hover:shadow-lg hover:shadow-black/30 transition-all duration-200
                      border-l-[3px] ${getAccentColor(pedido.estado)}`}
                  >
                    <div className="p-5">
                      {/* Top row: badge + timestamp + chevron */}
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono text-[11px] text-emerald-400/80 bg-emerald-400/5 border border-emerald-500/20 px-2 py-0.5 rounded-md">
                            #{pedido.numeroPedido || 'S/N'}
                          </span>
                          <span className={`text-[10px] uppercase font-bold px-2.5 py-0.5 rounded-full ring-1 ${getEstadoBadge(pedido.estado)}`}>
                            {pedido.estado === 'Despachando' ? 'Despachando…' : pedido.estado}
                          </span>
                        </div>
                        <ChevronRight className="w-4 h-4 text-gray-700 group-hover:text-emerald-400 transition-colors shrink-0" />
                      </div>

                      {/* Client name */}
                      <h3 className="text-white font-bold text-base leading-tight mb-3 group-hover:text-emerald-50 transition-colors">
                        {pedido.cliente}
                      </h3>

                      {/* Metrics row */}
                      <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-[13px]">
                        <div className="flex items-center gap-1.5 text-gray-400">
                          <Package className="w-3.5 h-3.5 text-gray-600 shrink-0" />
                          <span>{pedido.cantidad} unid.</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-gray-400">
                          <Weight className="w-3.5 h-3.5 text-gray-600 shrink-0" />
                          <span className="font-semibold text-gray-300">{pedido.pesoBrutoTotal?.toFixed(1)} kg</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-gray-400">
                          <MapPin className="w-3.5 h-3.5 text-gray-600 shrink-0" />
                          <span className="truncate">{pedido.zonaEntrega || '—'}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-gray-400">
                          <History className="w-3.5 h-3.5 text-gray-600 shrink-0" />
                          <span>{registrosPedido.length} mov.</span>
                          {ultimoRegistro && (
                            <span className="text-gray-600 text-[11px] ml-1">
                              · {new Date(ultimoRegistro.fecha).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Incidence alert */}
                      {pedido.ultimaIncidencia && (
                        <div className="mt-3 flex items-start gap-2 text-xs bg-amber-500/5 border border-amber-500/15 rounded-lg px-3 py-2">
                          <AlertCircle className="w-3.5 h-3.5 text-amber-400 mt-0.5 shrink-0" />
                          <span className="text-amber-300/90 leading-snug">{pedido.ultimaIncidencia}</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ═══════════════════════  DETALLE  ═══════════════════════ */}
      {modo === 'DETALLE' && selectedPedido && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
          {/* ── Main info card ── */}
          <div className="bg-gray-900/90 border border-gray-800 rounded-2xl overflow-hidden shadow-xl">
            {/* Accent strip at top */}
            <div className={`h-1 w-full ${
              selectedPedido.estado === 'Devolución' ? 'bg-red-500' :
              selectedPedido.estado === 'Con Incidencia' ? 'bg-amber-500' :
              selectedPedido.estado === 'Despachando' ? 'bg-blue-500' :
              'bg-emerald-500'
            }`} />

            <div className="p-6">
              {/* Top section: client + peso bruto */}
              <div className="flex flex-col sm:flex-row justify-between items-start gap-5 mb-6">
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] text-emerald-400/70 font-mono uppercase tracking-[0.15em] mb-1">
                    Orden de Entrega
                  </p>
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-white leading-tight truncate">
                    {selectedPedido.cliente}
                  </h2>
                  <div className="flex flex-wrap items-center gap-2 mt-2.5">
                    <span className="bg-gray-800/80 border border-gray-700/50 px-2.5 py-1 rounded-md text-xs text-gray-300">
                      {selectedPedido.tipoAve}
                    </span>
                    <span className="bg-gray-800/80 border border-gray-700/50 px-2.5 py-1 rounded-md text-xs text-gray-300">
                      {selectedPedido.presentacion}
                    </span>
                  </div>
                </div>

                {/* Peso bruto highlight */}
                <div className="bg-black/40 border border-gray-700/50 rounded-xl px-5 py-4 text-center shrink-0 min-w-[140px]">
                  <p className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold mb-1">Peso Bruto</p>
                  <div className="text-3xl font-black text-white tabular-nums">
                    {selectedPedido.pesoBrutoTotal?.toFixed(1) || '--'}
                    <span className="text-sm text-gray-500 font-normal ml-1">kg</span>
                  </div>
                </div>
              </div>

              {/* Estado pill */}
              <div className="mb-6 flex items-center gap-3 bg-gray-800/40 border border-gray-700/40 rounded-xl px-4 py-3">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                  selectedPedido.estado === 'Devolución' ? 'bg-red-500/15' :
                  selectedPedido.estado === 'Con Incidencia' ? 'bg-amber-500/15' :
                  selectedPedido.estado === 'Despachando' ? 'bg-blue-500/15' :
                  'bg-emerald-500/15'
                }`}>
                  {selectedPedido.estado === 'Devolución' ? <RotateCcw className="w-4 h-4 text-red-400" /> :
                   selectedPedido.estado === 'Con Incidencia' ? <AlertCircle className="w-4 h-4 text-amber-400" /> :
                   <Truck className="w-4 h-4 text-emerald-400" />}
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] text-gray-500 uppercase tracking-wider">Estado actual</p>
                  <p className={`text-sm font-bold ${
                    selectedPedido.estado === 'Devolución' ? 'text-red-400' :
                    selectedPedido.estado === 'Con Incidencia' ? 'text-amber-400' :
                    selectedPedido.estado === 'Despachando' ? 'text-blue-400' :
                    'text-emerald-400'
                  }`}>
                    {selectedPedido.estado}
                  </p>
                  {selectedPedido.motivoDevolucion && (
                    <p className="text-xs text-gray-400 mt-0.5 truncate">
                      Motivo: {selectedPedido.motivoDevolucion}
                    </p>
                  )}
                </div>
              </div>

              {/* ── Action buttons ── */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <button
                  onClick={() => { setSessionBlocks([]); setModo('REPESADA'); }}
                  disabled={selectedPedido.estado === 'Entregado'}
                  className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl transition-all duration-150 font-bold group disabled:opacity-30 disabled:pointer-events-none bg-blue-900/10 ring-1 ring-blue-500/25 text-blue-300 hover:bg-blue-900/25 hover:ring-blue-500/40"
                >
                  <span className="group-hover:scale-110 transition-transform"><Scale className="w-5 h-5" /></span>
                  <span className="text-[10px] leading-tight text-center">REPESADA</span>
                </button>

                <button
                  onClick={() => { setSessionBlocks([]); setModo('DEVOLUCION'); }}
                  disabled={selectedPedido.estado === 'Entregado'}
                  className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl transition-all duration-150 font-bold group disabled:opacity-30 disabled:pointer-events-none bg-orange-900/10 ring-1 ring-orange-500/25 text-red-300 hover:bg-orange-900/25 hover:ring-orange-500/40"
                >
                  <span className="group-hover:scale-110 transition-transform"><RotateCcw className="w-5 h-5" /></span>
                  <span className="text-[10px] leading-tight text-center">DEVOLUCIÓN</span>
                </button>

                <button
                  onClick={() => { setSessionBlocks([]); setModo('ASIGNACION'); }}
                  disabled={selectedPedido.estado === 'Entregado'}
                  className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl transition-all duration-150 font-bold group disabled:opacity-30 disabled:pointer-events-none bg-emerald-900/10 ring-1 ring-emerald-500/25 text-emerald-300 hover:bg-emerald-900/25 hover:ring-emerald-500/40"
                >
                  <span className="group-hover:scale-110 transition-transform"><UserPlus className="w-5 h-5" /></span>
                  <span className="text-[10px] leading-tight text-center">ADICIÓN</span>
                </button>

                <button
                  onClick={handleConfirmarEntrega}
                  disabled={selectedPedido.estado === 'Entregado'}
                  className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl transition-all duration-150 font-bold group disabled:opacity-30 disabled:pointer-events-none bg-green-900/10 ring-1 ring-green-500/25 text-green-300 hover:bg-green-900/25 hover:ring-green-500/40"
                >
                  <span className="group-hover:scale-110 transition-transform"><CheckCircle2 className="w-5 h-5" /></span>
                  <span className="text-[10px] leading-tight text-center">CONFIRMAR ENTREGA</span>
                </button>
              </div>
            </div>
          </div>

          {/* ── History / timeline ── */}
          <div className="space-y-4">
            <div className="flex items-center justify-between px-1">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <History className="w-4 h-4 text-gray-500" />
                Registro de Movimientos
              </h3>
              <span className="text-xs text-gray-500 tabular-nums">
                {getRegistrosPedido(selectedPedido.id).length} registro{getRegistrosPedido(selectedPedido.id).length !== 1 && 's'}
              </span>
            </div>

            {getRegistrosPedido(selectedPedido.id).length === 0 ? (
              <div className="bg-gray-900/30 border border-dashed border-gray-800 rounded-xl p-14 text-center">
                <History className="w-10 h-10 mx-auto mb-3 text-gray-700" />
                <p className="text-gray-500 text-sm">Sin movimientos registrados aún</p>
                <p className="text-xs text-gray-600 mt-1">Use los botones de acción para registrar repesadas, devoluciones o adiciones</p>
              </div>
            ) : (
              <div className="relative pl-6">
                {/* Vertical timeline line */}
                <div className="absolute left-[10px] top-2 bottom-2 w-px bg-gray-800" />

                <div className="space-y-4">
                  {getRegistrosPedido(selectedPedido.id).map((reg, idx) => (
                    <div key={reg.id} className="relative">
                      {/* Timeline dot */}
                      <div className={`absolute -left-6 top-5 w-[9px] h-[9px] rounded-full ring-2 ring-gray-900 z-10 ${
                        reg.tipo === 'repesada'   ? 'bg-blue-400'   :
                        reg.tipo === 'devolucion'  ? 'bg-orange-400'  :
                        reg.tipo === 'asignacion'  ? 'bg-emerald-400' :
                        reg.tipo === 'entrega'     ? 'bg-green-400'   : 'bg-gray-500'
                      }`} />

                      <div className="bg-gray-900/50 border border-gray-800/70 rounded-xl p-4 hover:border-gray-700 transition-colors">
                        {/* Header row */}
                        <div className="flex flex-wrap items-center gap-2 mb-3">
                          <div className="flex items-center gap-1.5">
                            {getTipoIcon(reg.tipo)}
                            <span className="text-sm font-bold text-white">
                              {getTipoLabel(reg.tipo, reg.id)}
                            </span>
                          </div>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ring-1 ring-current/20 ${getEstadoColor(reg.estado)}`}>
                            {reg.estado}
                          </span>
                          <span className="ml-auto text-[11px] text-gray-500 flex items-center gap-1 tabular-nums">
                            <Calendar className="w-3 h-3" />
                            {new Date(reg.fecha).toLocaleDateString()}
                            <span className="text-gray-700 mx-0.5">·</span>
                            <Clock className="w-3 h-3" />
                            {new Date(reg.fecha).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>

                        {/* Body */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            {reg.peso && (
                              <div className="flex items-center gap-2">
                                <Weight className="w-4 h-4 text-gray-600" />
                                <span className="text-sm text-gray-300">
                                  Peso: <span className="text-white font-bold">{reg.peso.toFixed(1)} kg</span>
                                </span>
                              </div>
                            )}

                            {reg.tipo === 'devolucion' && reg.motivo && (
                              <div className="flex items-start gap-2">
                                <AlertCircle className="w-4 h-4 text-gray-600 mt-0.5" />
                                <div>
                                  <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-0.5">Motivo</p>
                                  <p className="text-sm text-orange-300 bg-orange-900/15 border border-orange-500/15 px-3 py-1.5 rounded-lg">
                                    "{reg.motivo}"
                                  </p>
                                </div>
                              </div>
                            )}

                            {reg.tipo === 'asignacion' && reg.nuevoClienteNombre && (
                              <div className="flex items-center gap-2">
                                <User className="w-4 h-4 text-gray-600" />
                                <span className="text-sm text-gray-300">
                                  Nuevo cliente: <span className="text-emerald-400 font-bold">{reg.nuevoClienteNombre}</span>
                                </span>
                              </div>
                            )}
                          </div>

                          {reg.fotos && reg.fotos.length > 0 && (
                            <div>
                              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-2 flex items-center gap-1">
                                <CameraIcon className="w-3 h-3" /> Evidencia ({reg.fotos.length})
                              </p>
                              <div className="flex flex-wrap gap-1.5">
                                {reg.fotos.map((f, fi) => (
                                  <div
                                    key={fi}
                                    className="relative group/thumb w-14 h-14 rounded-lg bg-gray-800 border border-gray-700 overflow-hidden cursor-pointer hover:border-emerald-500/60 transition-all"
                                    onClick={() => window.open(f.url, '_blank')}
                                  >
                                    <img
                                      src={f.url}
                                      alt={`Evidencia ${fi + 1}`}
                                      className="w-full h-full object-cover"
                                      onError={(e) => {
                                        (e.target as HTMLImageElement).src = 'https://via.placeholder.com/64?text=No+Image';
                                      }}
                                    />
                                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover/thumb:opacity-100 transition-opacity flex items-center justify-center">
                                      <CameraIcon className="w-4 h-4 text-white" />
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═══════════════════════  ACTION FORMS (REPESADA / DEVOLUCION / ASIGNACION)  ═══════════════════════ */}
      {(modo === 'REPESADA' || modo === 'DEVOLUCION' || modo === 'ASIGNACION') && (
        <div className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-300">
          {/* Form card */}
          <div className="bg-gray-900/90 border border-gray-800 rounded-2xl overflow-hidden shadow-xl">
            {/* Accent strip */}
            <div className={`h-1 w-full ${
              modo === 'REPESADA' ? 'bg-blue-500' :
              modo === 'DEVOLUCION' ? 'bg-orange-500' :
              'bg-emerald-500'
            }`} />

            <div className="p-6 space-y-6 relative">
              {/* Close btn */}
              <button
                onClick={() => { setModo('DETALLE'); setShowReasonStep(false); }}
                className="absolute top-4 right-4 p-1.5 text-gray-600 hover:text-white transition-colors rounded-lg hover:bg-gray-800"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Title */}
              <div className="flex items-center gap-3 pr-8">
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
                  modo === 'REPESADA' ? 'bg-blue-500/15 text-blue-400' :
                  modo === 'DEVOLUCION' ? 'bg-orange-500/15 text-orange-400' :
                  'bg-emerald-500/15 text-emerald-400'
                }`}>
                  {modo === 'REPESADA' && <Scale className="w-5 h-5" />}
                  {modo === 'DEVOLUCION' && <RotateCcw className="w-5 h-5" />}
                  {modo === 'ASIGNACION' && <UserPlus className="w-5 h-5" />}
                </div>
                <div>
                  <h2 className="text-lg font-extrabold text-white uppercase tracking-tight">
                    {modo === 'REPESADA' ? 'Registrar Repesada' :
                     modo === 'DEVOLUCION' ? (showReasonStep ? 'Motivo de Devolución' : 'Registrar Devolución') :
                     'Registrar Adición'}
                  </h2>
                  <p className="text-xs text-gray-500">
                    {modo === 'REPESADA' ? 'Verifique el peso actual del producto' :
                     modo === 'DEVOLUCION' ? (showReasonStep ? 'Indique la razón de la devolución' : 'Registre el producto que se devuelve') :
                     'Asigne parte del pedido a otro cliente'}
                  </p>
                </div>
              </div>

              {/* Info del pedido + Peso Bruto Original */}
              {selectedPedido && (
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
              )}

              {/* ── Client selector (ASIGNACION only) ── */}
              {modo === 'ASIGNACION' && (
                <div>
                  <label className="block text-xs font-bold text-emerald-400 uppercase tracking-widest mb-2">
                    Nuevo Cliente <span className="text-red-400">*</span>
                  </label>
                  <select
                    value={newClientId}
                    onChange={(e) => setNewClientId(e.target.value)}
                    className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/50 transition-all"
                  >
                    <option value="">-- Seleccionar cliente --</option>
                    {clientes
                      .filter((c: any) => c.id !== selectedPedido?.clienteId)
                      .map((c: any) => (
                        <option key={c.id} value={c.id}>{c.nombre}</option>
                      ))}
                  </select>
                </div>
              )}

              {/* ── Weight + Photo inputs ── */}
              {!showReasonStep && (
                <div className="space-y-4">
                  {formWeight && capturedPhotos.length === 0 && (
                    <div className="bg-amber-500/10 border-2 border-amber-500/50 rounded-xl p-4 flex items-center gap-3 animate-bounce">
                      <AlertTriangle className="w-6 h-6 text-amber-500 shrink-0" />
                      <p className="text-amber-200 font-bold text-sm leading-tight uppercase">
                        ¡Atención! Debe tomar la foto de evidencia antes de poder sumar el peso.
                      </p>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">
                        {modo === 'ASIGNACION' ? 'Peso a Añadir (KG)' : 'Peso Registrado (KG)'}
                        <span className="text-red-400 ml-1">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          step="0.1"
                          min="0"
                          value={formWeight}
                          onChange={(e) => setFormWeight(e.target.value)}
                          placeholder="0.0"
                          className="w-full bg-gray-950 border-2 border-gray-800 rounded-xl px-4 py-4 text-white text-3xl font-black focus:outline-none focus:border-emerald-500 transition-all pr-12 shadow-inner"
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold text-lg">kg</span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-emerald-400 uppercase tracking-widest mb-2">
                        Evidencia Obligatoria <span className="text-red-400">*</span>
                      </label>
                      <button
                        onClick={handleCapturePhoto}
                        className={`w-full h-[68px] border-2 rounded-xl flex items-center justify-center gap-3 transition-all font-black text-lg group shadow-lg active:scale-95 ${
                          capturedPhotos.length > 0
                          ? 'bg-emerald-900/30 border-emerald-500 text-emerald-400'
                          : 'bg-gray-800 border-amber-500/50 text-white hover:bg-gray-700'
                        }`}
                      >
                        <Camera className={`w-6 h-6 group-hover:scale-110 transition-transform ${capturedPhotos.length > 0 ? 'text-emerald-400' : 'text-amber-400'}`} />
                        {capturedPhotos.length > 0 ? 'FOTO CAPTURADA' : 'TOMAR FOTO'}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* ── Photo preview ── */}
              {capturedPhotos.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Evidencia actual</p>
                  <div className="flex flex-wrap gap-2 p-3 bg-black/30 border border-gray-800/70 rounded-xl">
                    {capturedPhotos.map((p, i) => (
                      <div key={i} className="relative group">
                        <div className="w-16 h-16 rounded-lg overflow-hidden border border-gray-700">
                          <img src={p} alt={`Foto ${i + 1}`} className="w-full h-full object-cover" />
                        </div>
                        <button
                          onClick={() => setCapturedPhotos([])}
                          className="absolute -top-1 -right-1 bg-red-500 rounded-full p-0.5"
                        >
                          <X className="w-3 h-3 text-white" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ── Accumulated blocks + action buttons ── */}
              {(modo === 'REPESADA' || modo === 'DEVOLUCION' || modo === 'ASIGNACION') ? (
                <div className="space-y-4">
                  {/* Add block button */}
                  {!showReasonStep && (
                    <button
                      onClick={handleAddBlock}
                      className={`w-full py-5 border-2 rounded-2xl font-black text-xl flex items-center justify-center gap-3 transition-all shadow-xl active:scale-[0.98] disabled:opacity-30 disabled:grayscale ${
                        modo === 'REPESADA'   ? 'bg-blue-600/90 border-blue-400/60 text-white hover:bg-blue-500/90' :
                        modo === 'DEVOLUCION'  ? 'bg-orange-600/90 border-orange-400/60 text-white hover:bg-orange-500/90' :
                        'bg-emerald-600/90 border-emerald-400/60 text-white hover:bg-emerald-500/90'
                      }`}
                      disabled={!formWeight || capturedPhotos.length === 0}
                    >
                      <Plus className="w-7 h-7" />
                      SUMAR {modo === 'REPESADA' ? 'PESADA' : 'BLOQUE'}
                    </button>
                  )}

                  {/* Session blocks list */}
                  {sessionBlocks.length > 0 && (
                    <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4 space-y-3">
                      <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                        Registros acumulados ({sessionBlocks.length})
                      </p>
                      <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
                        {sessionBlocks.map((b, i) => (
                          <div key={i} className="flex items-center justify-between bg-black/40 border border-gray-700/60 rounded-lg p-3">
                            <div className="flex items-center gap-3">
                              <div className="w-11 h-11 rounded-lg overflow-hidden border border-gray-600/60 shrink-0">
                                <img src={b.foto} className="w-full h-full object-cover" />
                              </div>
                              <span className="text-white font-bold">{i + 1}° Bloque</span>
                            </div>
                            <span className={`text-xl font-black tabular-nums ${
                              modo === 'REPESADA' ? 'text-blue-400' :
                              modo === 'DEVOLUCION' ? 'text-orange-400' :
                              'text-emerald-400'
                            }`}>{b.peso.toFixed(1)} kg</span>
                          </div>
                        ))}
                      </div>

                      {/* Total bar */}
                      <div className={`p-4 border rounded-xl flex justify-between items-center ${
                        modo === 'REPESADA'   ? 'bg-blue-900/25 border-blue-500/30' :
                        modo === 'DEVOLUCION'  ? 'bg-orange-900/25 border-orange-500/30' :
                        'bg-emerald-900/25 border-emerald-500/30'
                      }`}>
                        <span className="text-white font-extrabold text-sm uppercase tracking-wider">Total</span>
                        <span className="text-2xl font-black text-white tabular-nums">
                          {sessionBlocks.reduce((acc, b) => acc + b.peso, 0).toFixed(1)} kg
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Devolucion reason step */}
                  {modo === 'DEVOLUCION' && showReasonStep && (
                    <div className="pt-2 animate-in zoom-in-95 duration-300">
                      <div className="bg-orange-500/5 border border-orange-500/20 rounded-xl p-5">
                        <label className="block text-sm font-bold text-orange-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                          <AlertCircle className="w-4 h-4" />
                          ¿Cuál es el motivo de la devolución? <span className="text-red-400">*</span>
                        </label>
                        <textarea
                          value={formReason}
                          autoFocus
                          onChange={(e) => setFormReason(e.target.value)}
                          className="w-full bg-black/50 border border-gray-700 rounded-xl px-4 py-3 text-white text-base focus:outline-none focus:border-orange-500 transition-all h-32 resize-none placeholder:text-gray-600"
                          placeholder="Ej: Producto dañado, cliente no aceptó, etc..."
                          maxLength={200}
                        />
                        <div className="flex justify-between items-center mt-2">
                          <button
                            onClick={() => setShowReasonStep(false)}
                            className="text-xs text-orange-400/50 hover:text-orange-400 font-bold uppercase underline transition-colors"
                          >
                            Volver a pesar
                          </button>
                          <p className="text-[10px] text-gray-500 font-mono tabular-nums">{formReason.length}/200</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Finish buttons */}
                  {(modo === 'REPESADA' || (modo === 'ASIGNACION' && !showReasonStep)) && (
                    <button
                      onClick={modo === 'REPESADA' ? handleFinishRepesada : handleFinishAsignacion}
                      className={`w-full py-4 rounded-xl font-extrabold text-lg shadow-xl transition-all flex items-center justify-center gap-3 active:scale-[0.98] ${
                        sessionBlocks.length > 0 && (modo !== 'ASIGNACION' || newClientId)
                        ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-900/30'
                        : 'bg-gray-800 text-gray-500 cursor-not-allowed border border-gray-700 opacity-50'
                      }`}
                      disabled={sessionBlocks.length === 0 || (modo === 'ASIGNACION' && !newClientId)}
                    >
                      <CheckCircle2 className="w-5 h-5" /> FINALIZAR {modo === 'REPESADA' ? 'REPESADA' : 'ADICIÓN'}
                    </button>
                  )}

                  {modo === 'DEVOLUCION' && (
                    showReasonStep ? (
                      <button
                        onClick={handleFinishDevolucion}
                        className={`w-full py-5 rounded-xl font-extrabold text-xl shadow-xl transition-all flex items-center justify-center gap-3 active:scale-[0.98] ${
                          formReason.length >= 3
                          ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-900/30'
                          : 'bg-gray-800 text-gray-500 cursor-not-allowed border border-gray-700 opacity-50'
                        }`}
                        disabled={formReason.length < 3}
                      >
                        <CheckCircle2 className="w-6 h-6" /> CONFIRMAR DEVOLUCIÓN
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          if (sessionBlocks.length > 0) setShowReasonStep(true);
                          else toast.error("Debe agregar al menos una pesada");
                        }}
                        className={`w-full py-4 rounded-xl font-extrabold text-lg shadow-xl transition-all flex items-center justify-center gap-3 active:scale-[0.98] ${
                          sessionBlocks.length > 0
                          ? 'bg-orange-600 hover:bg-orange-500 text-white shadow-orange-900/30'
                          : 'bg-gray-800 text-gray-500 cursor-not-allowed border border-gray-700 opacity-50'
                        }`}
                        disabled={sessionBlocks.length === 0}
                      >
                        <ArrowRight className="w-5 h-5" /> CONTINUAR A MOTIVO
                      </button>
                    )
                  )}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      )}

      {/* Modal de confirmación eliminado por solicitud */}
    </div>
  );
}
