import { useState, useEffect, useMemo } from "react";
import {
  Truck, Scale, RotateCcw, Camera, CheckCircle2, AlertTriangle,
  ArrowRight, ChevronRight, History, X, PackageCheck,
  FileText, User, MapPin, Clock, Weight, AlertCircle, Package, Calendar, Plus,
  ChevronDown, Layers, ArrowLeftRight, Hash, Minus, Eye,
} from "lucide-react";
import { useApp, PedidoConfirmado } from "../contexts/AppContext";
import { useTheme, t } from "../contexts/ThemeContext";
import { toast } from "sonner";

// ===================== INTERFACES =====================

interface FotoRegistro {
  tipo: 'repesada' | 'devolucion' | 'entrega' | 'adicion';
  url: string;
  fecha: string;
}

interface TandaRepesaje {
  numero: number;
  peso: number;
  foto: string;
}

interface RegistroConductor {
  id: string;
  pedidoId: string;
  tipo: 'repesada' | 'devolucion' | 'adicion' | 'entrega' | 'asignacion';
  peso?: number;
  cantidadUnidades?: number;
  motivo?: string;
  // Adición fields
  clienteDestinoId?: string;
  clienteDestinoNombre?: string;
  devolucionOrigenId?: string;
  clienteOrigenNombre?: string;
  pedidoOrigenId?: string;
  pedidoOrigenNumero?: string;
  // Legacy
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

interface DevolucionDisponible {
  registroId: string;
  pedidoId: string;
  pedidoNumero: string;
  clienteOrigen: string;
  grupoOrigenId: string;
  tipoAve: string;
  variedad?: string;
  presentacion: string;
  esVivo: boolean;
  cantidadTotal: number;
  cantidadDisponible: number;
  pesoTotal: number;
  pesoDisponible: number;
  foto: string;
}

// ===================== COMPONENTE PRINCIPAL =====================

export function GestionConductor() {
  const { pedidosConfirmados, clientes, updatePedidoConfirmado } = useApp();
  const { isDark } = useTheme();
  const c = t(isDark);

  // ── Vista ──
  const [modo, setModo] = useState<'LISTA' | 'GRUPO' | 'DETALLE' | 'REPESADA' | 'DEVOLUCION' | 'ADICION'>('LISTA');
  const [grupoSeleccionado, setGrupoSeleccionado] = useState<GrupoDespacho | null>(null);
  const [selectedPedido, setSelectedPedido] = useState<PedidoConfirmado | null>(null);
  const [showDevolucionesInfo, setShowDevolucionesInfo] = useState(false);

  // ── Repesaje ──
  const [tandasRepesaje, setTandasRepesaje] = useState<TandaRepesaje[]>([]);
  const [formWeight, setFormWeight] = useState("");
  const [capturedPhoto, setCapturedPhoto] = useState("");

  // ── Devolución ──
  const [devCantidad, setDevCantidad] = useState("");
  const [devPeso, setDevPeso] = useState("");
  const [devFoto, setDevFoto] = useState("");
  const [devMotivo, setDevMotivo] = useState("");
  const [devStep, setDevStep] = useState<'datos' | 'motivo'>('datos');

  // ── Adición ──
  const [adicionStep, setAdicionStep] = useState<'lista' | 'formulario'>('lista');
  const [adicionSeleccionada, setAdicionSeleccionada] = useState<DevolucionDisponible | null>(null);
  const [adicionCantidad, setAdicionCantidad] = useState("");
  const [adicionPeso, setAdicionPeso] = useState("");
  const [adicionFoto, setAdicionFoto] = useState("");
  const [adicionFromGrupo, setAdicionFromGrupo] = useState(false);

  // ── UI ──
  const [expandedPedidos, setExpandedPedidos] = useState<Set<string>>(new Set());
  const [showConfirmEntregaTotal, setShowConfirmEntregaTotal] = useState(false);
  const [confirmEntregaPedidoId, setConfirmEntregaPedidoId] = useState<string | null>(null);

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

  // ── Devoluciones disponibles para Adición ──
  const devolucionesDisponibles: DevolucionDisponible[] = useMemo(() => {
    const devoluciones = registros.filter(r => r.tipo === 'devolucion' && r.cantidadUnidades && r.cantidadUnidades > 0);
    return devoluciones.map(dev => {
      const pedido = pedidosConfirmados.find(p => p.id === dev.pedidoId);
      if (!pedido) return null;
      const adicionesDesdeEsta = registros
        .filter(r => r.tipo === 'adicion' && r.devolucionOrigenId === dev.id)
        .reduce((sum, r) => sum + (r.cantidadUnidades || 0), 0);
      const cantidadDisponible = (dev.cantidadUnidades || 0) - adicionesDesdeEsta;
      if (cantidadDisponible <= 0) return null;
      const pesoPorUnidad = (dev.peso || 0) / (dev.cantidadUnidades || 1);
      const pesoDisponible = pesoPorUnidad * cantidadDisponible;
      const grupo = gruposDespacho.find(g => g.pedidos.some(p => p.id === pedido.id));
      return {
        registroId: dev.id,
        pedidoId: pedido.id,
        pedidoNumero: pedido.numeroPedido || 'S/N',
        clienteOrigen: pedido.cliente,
        grupoOrigenId: grupo?.grupoId || '',
        tipoAve: pedido.tipoAve,
        variedad: pedido.variedad,
        presentacion: pedido.presentacion,
        esVivo: checkEsVivo(pedido),
        cantidadTotal: dev.cantidadUnidades || 0,
        cantidadDisponible,
        pesoTotal: dev.peso || 0,
        pesoDisponible: parseFloat(pesoDisponible.toFixed(2)),
        foto: dev.fotos[0]?.url || '',
      } as DevolucionDisponible;
    }).filter(Boolean) as DevolucionDisponible[];
  }, [registros, pedidosConfirmados, gruposDespacho]);

  // ── Helpers ──
  function checkEsVivo(pedido: PedidoConfirmado) {
    return !!pedido.presentacion?.toLowerCase().includes('vivo');
  }

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

  const getTipoDespacho = (pedido: PedidoConfirmado) =>
    checkEsVivo(pedido) ? 'Jabas' : 'Unidades';

  const handleCapturePhoto = (setter: (url: string) => void) => {
    const mockPhoto = `https://images.unsplash.com/photo-${Math.floor(Math.random() * 1000000)}?w=400&t=${Date.now()}`;
    setter(mockPhoto);
    toast.success("Foto capturada");
  };

  const resetRepesaje = () => { setTandasRepesaje([]); setFormWeight(""); setCapturedPhoto(""); };
  const resetDevolucion = () => { setDevCantidad(""); setDevPeso(""); setDevFoto(""); setDevMotivo(""); setDevStep('datos'); };
  const resetAdicion = () => { setAdicionStep('lista'); setAdicionSeleccionada(null); setAdicionCantidad(""); setAdicionPeso(""); setAdicionFoto(""); setAdicionFromGrupo(false); };

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
      case 'adicion': case 'asignacion': return <ArrowLeftRight className="w-4 h-4 text-teal-400" />;
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
      case 'adicion': case 'asignacion': return 'Adición';
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

  // ===================== HANDLERS =====================

  // ── Repesaje ──
  const handleAddTanda = () => {
    const peso = parseFloat(formWeight);
    if (!formWeight || isNaN(peso) || peso <= 0) { toast.error("Ingrese un peso válido"); return; }
    if (!capturedPhoto) { toast.error("Debe tomar la foto de evidencia"); return; }
    const nueva: TandaRepesaje = { numero: tandasRepesaje.length + 1, peso, foto: capturedPhoto };
    const nuevas = [...tandasRepesaje, nueva];
    setTandasRepesaje(nuevas);
    setFormWeight(""); setCapturedPhoto("");
    const acum = nuevas.reduce((s, t) => s + t.peso, 0);
    toast.success(`Tanda ${nueva.numero}: ${peso.toFixed(1)} kg → Total: ${acum.toFixed(1)} kg`);
  };

  const handleQuitarUltimaTanda = () => {
    if (tandasRepesaje.length === 0) return;
    setTandasRepesaje(prev => prev.slice(0, -1));
    toast.info('Última tanda eliminada');
  };

  const handleFinishRepesaje = () => {
    if (tandasRepesaje.length === 0) { toast.error("Registre al menos una tanda"); return; }
    const pesoTotal = tandasRepesaje.reduce((acc, t) => acc + t.peso, 0);
    const fresh = getFreshPedido();
    const pesoOriginal = fresh?.pesoBrutoTotal || 0;
    const diferencia = Math.abs(pesoOriginal - pesoTotal);
    const margenTolerancia = 0.5;

    setRegistros(prev => [...prev, {
      id: generarId(), pedidoId: selectedPedido!.id, tipo: 'repesada',
      peso: pesoTotal,
      fotos: tandasRepesaje.map(t => ({ tipo: 'repesada' as const, url: t.foto, fecha: new Date().toISOString() })),
      fecha: new Date().toISOString(),
      estado: diferencia <= margenTolerancia ? 'Completado' : 'Con Incidencia',
    }]);

    updatePedidoConfirmado(selectedPedido!.id, {
      ...fresh!, estado: diferencia <= margenTolerancia ? 'En Ruta' : 'Con Incidencia',
      pesoRepesada: pesoTotal,
      ultimaIncidencia: diferencia <= margenTolerancia ? null : `Diferencia de peso: ${diferencia.toFixed(1)} kg`,
    });

    toast.success(`Repesaje completado: ${pesoTotal.toFixed(1)} kg (Original: ${pesoOriginal.toFixed(1)} kg)`);
    setModo('GRUPO'); resetRepesaje();
  };

  // ── Devolución ──
  const handleFinishDevolucion = () => {
    const cantidad = parseInt(devCantidad);
    const peso = parseFloat(devPeso);
    if (!cantidad || cantidad <= 0) { toast.error("Ingrese cantidad válida"); return; }
    if (!peso || peso <= 0) { toast.error("Ingrese peso válido"); return; }
    if (!devFoto) { toast.error("Debe tomar foto de evidencia"); return; }
    if (!devMotivo || devMotivo.length < 3) { toast.error("Ingrese el motivo (mín. 3 caracteres)"); return; }
    const fresh = getFreshPedido();

    setRegistros(prev => [...prev, {
      id: generarId(), pedidoId: selectedPedido!.id, tipo: 'devolucion',
      peso, cantidadUnidades: cantidad, motivo: devMotivo,
      fotos: [{ tipo: 'devolucion' as const, url: devFoto, fecha: new Date().toISOString() }],
      fecha: new Date().toISOString(), estado: 'Con Incidencia',
    }]);

    updatePedidoConfirmado(selectedPedido!.id, {
      ...fresh!, estado: 'Devolución', pesoDevolucion: peso,
      motivoDevolucion: devMotivo,
      ultimaIncidencia: `Devolución: ${cantidad} unids. (${peso.toFixed(1)} kg)`,
    });

    toast.warning(`Devolución: ${cantidad} unids. · ${peso.toFixed(1)} kg`);
    setModo('GRUPO'); resetDevolucion();
  };

  // ── Adición ──
  const getAdicionesParaGrupo = (grupoId: string) => {
    const grupo = gruposDespacho.find(g => g.grupoId === grupoId);
    if (!grupo) return [];
    return devolucionesDisponibles.filter(d => d.clienteOrigen !== grupo.cliente);
  };

  // Obtener registros de adiciones ya confirmadas para un grupo destino
  const getAdicionesRegistradasParaGrupo = (grupoId: string) => {
    return registros.filter(r => r.tipo === 'adicion' && r.clienteDestinoId === grupoId);
  };

  const handleFinishAdicion = () => {
    if (!adicionSeleccionada || !grupoSeleccionado) return;
    const cantidad = parseInt(adicionCantidad);
    const peso = parseFloat(adicionPeso);
    if (!cantidad || cantidad <= 0 || cantidad > adicionSeleccionada.cantidadDisponible) {
      toast.error(`Cantidad inválida (máx. ${adicionSeleccionada.cantidadDisponible})`); return;
    }
    if (!peso || peso <= 0) { toast.error("Ingrese peso válido"); return; }
    if (!adicionFoto) { toast.error("Debe tomar foto de evidencia"); return; }

    const grupoDestino = grupoSeleccionado;

    // Solo crear registro local — NO se crea pedido nuevo
    // La adición se integrará al pedido del cliente al confirmar entrega total
    setRegistros(prev => [...prev, {
      id: generarId(),
      pedidoId: adicionSeleccionada.pedidoId,
      tipo: 'adicion',
      peso, cantidadUnidades: cantidad,
      devolucionOrigenId: adicionSeleccionada.registroId,
      clienteOrigenNombre: adicionSeleccionada.clienteOrigen,
      pedidoOrigenId: adicionSeleccionada.pedidoId,
      pedidoOrigenNumero: adicionSeleccionada.pedidoNumero,
      clienteDestinoId: grupoDestino.grupoId,
      clienteDestinoNombre: grupoDestino.cliente,
      fotos: [{ tipo: 'adicion' as const, url: adicionFoto, fecha: new Date().toISOString() }],
      fecha: new Date().toISOString(), estado: 'Completado',
    }]);

    toast.success(`Adición registrada: ${cantidad} unids. (${peso.toFixed(1)} kg) → ${grupoDestino.cliente}. Se enviará a Cartera al confirmar entrega.`);
    setModo('GRUPO'); resetAdicion();
  };

  // ── Entrega ──
  const handleConfirmarEntregaPedido = (pedido: PedidoConfirmado) => {
    const fresh = pedidosConfirmados.find(p => p.id === pedido.id) || pedido;
    setRegistros(prev => [...prev, {
      id: generarId(), pedidoId: pedido.id, tipo: 'entrega', fotos: [],
      fecha: new Date().toISOString(), estado: 'Completado',
    }]);
    updatePedidoConfirmado(pedido.id, { ...fresh, estado: 'Entregado' });
    toast.success('Entrega confirmada');
  };

  const handleConfirmarEntregaTotal = () => {
    const freshGrupo = getFreshGrupo();
    if (!freshGrupo) return;

    // Marcar todos los pedidos como Entregado
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

    // Integrar adiciones al primer pedido del grupo → Cartera de Cobro
    const adicionesDelGrupo = getAdicionesRegistradasParaGrupo(freshGrupo.grupoId);
    if (adicionesDelGrupo.length > 0) {
      const pesoTotalAdiciones = adicionesDelGrupo.reduce((sum, r) => sum + (r.peso || 0), 0);
      // Escribir pesoAdicional en el primer pedido del grupo
      const primerPedido = pedidosConfirmados.find(fp => fp.id === freshGrupo.pedidos[0].id) || freshGrupo.pedidos[0];
      const pesoAdicionPrevio = primerPedido.pesoAdicional || 0;
      updatePedidoConfirmado(primerPedido.id, {
        ...primerPedido,
        estado: 'Entregado',
        pesoAdicional: pesoAdicionPrevio + pesoTotalAdiciones,
      });
    }

    toast.success('¡Entrega total confirmada!');
    setModo('LISTA'); setGrupoSeleccionado(null);
  };

  // ── Sub-componente: Tarjeta de Producto ──
  const ProductInfoCard = ({ pedido, compact = false }: { pedido: PedidoConfirmado; compact?: boolean }) => {
    const vivo = checkEsVivo(pedido);
    const jabas = pedido.cantidadJabas || 0;
    const unidadesPorJaba = pedido.unidadesPorJaba || 0;
    const totalAves = jabas * unidadesPorJaba;
    return (
      <div className={`bg-black/40 border border-gray-800/80 rounded-xl ${compact ? 'p-3' : 'p-4'}`} style={{ background: c.bgCardAlt, borderColor: c.border }}>
        <div className="flex items-start justify-between mb-2">
          <div className="min-w-0 flex-1">
            <h3 className={`font-black leading-tight ${compact ? 'text-sm' : 'text-base'}`} style={{ color: c.text }}>
              {pedido.tipoAve}
            </h3>
            {pedido.variedad && (
              <p className="text-[11px] mt-0.5" style={{ color: c.textSecondary }}>{pedido.variedad}</p>
            )}
          </div>
          <span className="font-mono text-[10px] px-2 py-0.5 rounded shrink-0 ml-2" style={{ color: c.textMuted, background: isDark ? 'rgba(31,41,55,0.8)' : 'rgba(243,244,246,0.8)' }}>
            {pedido.numeroPedido || 'S/N'}
          </span>
        </div>
        <div className="flex flex-wrap gap-1.5 mb-2">
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
            {pedido.presentacion}
          </span>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${vivo
            ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
            : 'bg-purple-500/10 text-purple-400 border-purple-500/20'
            }`}>
            {vivo ? `Jabas · ${jabas} jabas` : `Unidades · ${pedido.cantidad} unids.`}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-[11px]" style={{ color: c.textMuted }}>
          <span className="flex items-center gap-1">
            <Weight className="w-3 h-3" />
            <span className="font-bold" style={{ color: c.text }}>{(pedido.pesoBrutoTotal || 0).toFixed(1)} kg</span> bruto
          </span>
          {vivo && unidadesPorJaba > 0 && (
            <span>{unidadesPorJaba} aves/jaba · {totalAves} aves</span>
          )}
          {!compact && pedido.cliente && (
            <span className="flex items-center gap-1">
              <User className="w-3 h-3" /> {pedido.cliente}
            </span>
          )}
        </div>
      </div>
    );
  };

  // ===================== RENDER =====================
  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20 px-4">

      {/* ═══════ HEADER ═══════ */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2" style={{ color: c.text }}>
            <Truck className="text-emerald-400" /> Gestión de Entregas
          </h1>
          <p className="text-sm" style={{ color: c.textSecondary }}>Control de ruta, repesajes y devoluciones</p>
        </div>
        {modo !== 'LISTA' && (
          <button
            onClick={() => {
              if (modo === 'DETALLE') { setModo('GRUPO'); setSelectedPedido(null); }
              else if (modo === 'GRUPO') { setModo('LISTA'); setGrupoSeleccionado(null); setExpandedPedidos(new Set()); }
              else if (modo === 'ADICION') {
                if (adicionFromGrupo) { setModo('GRUPO'); } else { setModo('LISTA'); }
                resetAdicion();
              }
              else { setModo('GRUPO'); setSelectedPedido(null); resetRepesaje(); resetDevolucion(); }
            }}
            className="px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
            style={{ background: c.bgCardAlt, color: c.textSecondary }}
          >
            <ArrowRight className="w-4 h-4 rotate-180" /> Volver
          </button>
        )}
      </div>

      {/* ═══════ LISTA DE DESPACHOS ═══════ */}
      {modo === 'LISTA' && (
        <div className="space-y-5">
          {/* Panel informativo de devoluciones disponibles para adición */}
          {devolucionesDisponibles.length > 0 && (
            <div className="rounded-xl overflow-hidden" style={{ background: c.bgCard, border: `1px solid rgba(6,182,212,0.2)` }}>
              <button
                onClick={() => setShowDevolucionesInfo(!showDevolucionesInfo)}
                className="w-full px-5 py-3 flex items-center justify-between hover:bg-cyan-500/5 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-cyan-500/10 flex items-center justify-center shrink-0">
                    <ArrowLeftRight className="w-4 h-4 text-cyan-400" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-bold" style={{ color: c.text }}>Productos devueltos disponibles</p>
                    <p className="text-[11px]" style={{ color: c.textMuted }}>{devolucionesDisponibles.length} producto{devolucionesDisponibles.length > 1 ? 's' : ''} · Puede adicionarlos desde cada despacho</p>
                  </div>
                </div>
                <ChevronDown className={`w-4 h-4 transition-transform ${showDevolucionesInfo ? 'rotate-180' : ''}`} style={{ color: c.textMuted }} />
              </button>
              {showDevolucionesInfo && (
                <div className="px-5 pb-4 space-y-2" style={{ borderTop: `1px solid ${c.borderSubtle}` }}>
                  {devolucionesDisponibles.map(dev => (
                    <div key={dev.registroId} className="rounded-lg p-3" style={{ background: c.bgCardAlt, border: `1px solid ${c.border}` }}>
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="text-[10px] font-bold text-cyan-300 uppercase bg-cyan-500/10 px-2 py-0.5 rounded-full">Dev. de {dev.clienteOrigen}</span>
                        <span className="font-mono text-[10px]" style={{ color: c.textMuted }}>{dev.pedidoNumero}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold" style={{ color: c.text }}>{dev.tipoAve}</span>
                          {dev.variedad && <span className="text-[10px]" style={{ color: c.textMuted }}>({dev.variedad})</span>}
                          <span className="text-[10px]" style={{ color: c.textMuted }}>·</span>
                          <span className="text-[10px] text-blue-400">{dev.presentacion}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-sm font-bold text-cyan-400">{dev.cantidadDisponible} unids.</span>
                          <span className="text-[10px] ml-1.5" style={{ color: c.textMuted }}>{dev.pesoDisponible.toFixed(1)} kg</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {gruposDespacho.length > 0 && (
            <div className="flex items-center justify-between rounded-xl px-5 py-3" style={{ background: c.bgCard, border: `1px solid ${c.border}` }}>
              <span className="text-sm flex items-center gap-2" style={{ color: c.textSecondary }}>
                <Package className="w-4 h-4 text-emerald-400" />
                <span className="font-semibold" style={{ color: c.text }}>{gruposDespacho.length}</span> despacho{gruposDespacho.length !== 1 && 's'} en ruta
              </span>
              <span className="text-xs hidden sm:block" style={{ color: c.textMuted }}>Toque un despacho para gestionar</span>
            </div>
          )}

          {gruposDespacho.length === 0 ? (
            <div className="rounded-2xl p-16 text-center" style={{ background: c.bgCard, border: `1px solid ${c.border}` }}>
              <PackageCheck className="w-14 h-14 mx-auto mb-5 opacity-20" style={{ color: c.textMuted }} />
              <p className="text-lg font-semibold" style={{ color: c.textSecondary }}>No tienes despachos asignados</p>
              <p className="text-sm mt-1" style={{ color: c.textMuted }}>Los despachos aparecerán aquí cuando sean emitidos desde Pesaje</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {gruposDespacho.map(grupo => (
                <div
                  key={grupo.grupoId}
                  onClick={() => {
                    grupo.pedidos.forEach(p => {
                      if (p.estado === 'En Despacho') {
                        const fresh = pedidosConfirmados.find(fp => fp.id === p.id) || p;
                        updatePedidoConfirmado(p.id, { ...fresh, estado: 'Despachando' });
                      }
                    });
                    setGrupoSeleccionado(grupo); setModo('GRUPO');
                  }}
                  className={`group relative rounded-xl overflow-hidden cursor-pointer
                    hover:shadow-lg hover:shadow-black/30 transition-all duration-200
                    border-l-[3px] ${getAccentColor(grupo)}`}
                  style={{ background: c.bgCard, border: `1px solid ${c.border}` }}
                >
                  <div className="p-5">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex flex-wrap items-center gap-2">
                        {grupo.numeroTicket && (
                          <span className="font-mono text-[11px] px-2 py-0.5 rounded-md" style={{ color: isDark ? '#fff' : '#065f46', background: isDark ? 'rgba(52,211,153,0.1)' : 'rgba(209,250,229,0.8)', border: '1px solid rgba(16,185,129,0.3)' }}>
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
                    <h3 className="font-bold text-base leading-tight mb-3 group-hover:text-emerald-50 transition-colors" style={{ color: c.text }}>
                      {grupo.cliente}
                    </h3>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-[13px]">
                      <div className="flex items-center gap-1.5" style={{ color: c.textSecondary }}>
                        <Layers className="w-3.5 h-3.5 shrink-0" style={{ color: c.textMuted }} />
                        <span>{grupo.pedidos.length} pedido{grupo.pedidos.length > 1 ? 's' : ''}</span>
                      </div>
                      <div className="flex items-center gap-1.5" style={{ color: c.textSecondary }}>
                        <Weight className="w-3.5 h-3.5 shrink-0" style={{ color: c.textMuted }} />
                        <span className="font-semibold" style={{ color: c.textSecondary }}>{grupo.pesoBrutoTotal.toFixed(1)} kg bruto</span>
                      </div>
                      <div className="flex items-center gap-1.5" style={{ color: c.textSecondary }}>
                        <MapPin className="w-3.5 h-3.5 shrink-0" style={{ color: c.textMuted }} />
                        <span className="truncate">{grupo.zonaEntrega || '—'}</span>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1 mt-3">
                      {grupo.pedidos.map(p => (
                        <span key={p.id} className={`text-[10px] font-bold px-2 py-0.5 rounded-full ring-1 ring-current/20 ${getEstadoBadge(p.estado || 'En Despacho')}`}>
                          {p.numeroPedido || 'S/N'}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ═══════ VISTA DE GRUPO (PEDIDOS DEL DESPACHO) ═══════ */}
      {modo === 'GRUPO' && grupoSeleccionado && (
        <div className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-300">

          {/* Info del grupo */}
          <div className="rounded-2xl overflow-hidden shadow-xl" style={{ background: c.bgCard, border: `1px solid ${c.border}` }}>
            <div className="h-1 w-full bg-emerald-500" />
            <div className="p-6">
              <div className="flex flex-col sm:flex-row justify-between items-start gap-5 mb-5">
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-mono uppercase tracking-[0.15em] mb-1" style={{ color: c.text }}>Despacho Consolidado</p>
                  <h2 className="text-2xl sm:text-3xl font-extrabold leading-tight truncate" style={{ color: c.text }}>{grupoSeleccionado.cliente}</h2>
                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    {grupoSeleccionado.numeroTicket && (
                      <span className="font-mono text-xs bg-emerald-500/10 border border-emerald-500/40 px-2 py-0.5 rounded-md" style={{ color: c.text }}>
                        {grupoSeleccionado.numeroTicket}
                      </span>
                    )}
                    <span className="text-xs" style={{ color: c.textMuted }}>{grupoSeleccionado.conductor}</span>
                    <span className="text-xs" style={{ color: c.textMuted }}>·</span>
                    <span className="text-xs" style={{ color: c.textMuted }}>{grupoSeleccionado.zonaEntrega}</span>
                  </div>
                </div>
                <div className="rounded-xl px-5 py-3 text-center" style={{ background: c.bgCardAlt, border: `1px solid ${c.border}` }}>
                  <p className="text-[10px] uppercase tracking-wider font-semibold mb-0.5" style={{ color: c.textMuted }}>Bruto Total</p>
                  <div className="text-2xl font-black tabular-nums" style={{ color: c.text }}>
                    {grupoSeleccionado.pesoBrutoTotal.toFixed(1)}<span className="text-xs font-normal ml-0.5" style={{ color: c.textMuted }}>kg</span>
                  </div>
                </div>
              </div>
              {/* Botones de acción del grupo */}
              <div className="flex gap-3">
                <button
                  onClick={() => setShowConfirmEntregaTotal(true)}
                  className="flex-1 py-3.5 rounded-xl font-black text-white text-sm transition-all hover:scale-[1.01] flex items-center justify-center gap-2"
                  style={{ background: 'linear-gradient(135deg, #0d4a24, #166534, #22c55e)', boxShadow: '0 6px 20px -5px rgba(34,197,94,0.35)' }}
                >
                  <CheckCircle2 className="w-5 h-5" /> ENTREGA TOTAL
                </button>
                {(() => {
                  const adicionesParaEsteGrupo = getAdicionesParaGrupo(grupoSeleccionado.grupoId);
                  if (adicionesParaEsteGrupo.length === 0) return null;
                  return (
                    <button
                      onClick={() => { resetAdicion(); setAdicionFromGrupo(true); setModo('ADICION'); }}
                      className="py-3.5 px-5 rounded-xl font-bold text-white text-sm transition-all hover:scale-[1.01] flex items-center gap-2 relative"
                      style={{ background: 'linear-gradient(135deg, #0d3d4a, #164e63, #06b6d4)', boxShadow: '0 4px 15px -3px rgba(6,182,212,0.3)' }}
                    >
                      <ArrowLeftRight className="w-5 h-5" /> ADICIÓN
                      <span className="bg-white/20 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full">{adicionesParaEsteGrupo.length}</span>
                    </button>
                  );
                })()}
              </div>
            </div>
          </div>

          {/* Lista de pedidos del grupo */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold uppercase tracking-widest px-1" style={{ color: c.textSecondary }}>
              Pedidos del Despacho ({grupoSeleccionado.pedidos.length})
            </h3>
            {grupoSeleccionado.pedidos.map((pedido, idx) => {
              const regs = getRegistrosPedido(pedido.id);
              const freshP = pedidosConfirmados.find(p => p.id === pedido.id) || pedido;
              const isExpanded = expandedPedidos.has(pedido.id);
              const pedidoCompletado = freshP.estado === 'Entregado';
              const vivo = checkEsVivo(freshP);

              const toggleExpand = () => {
                const next = new Set(expandedPedidos);
                if (next.has(pedido.id)) next.delete(pedido.id); else next.add(pedido.id);
                setExpandedPedidos(next);
              };

              return (
                <div key={pedido.id}
                  className="backdrop-blur-xl rounded-xl overflow-hidden transition-all"
                  style={{
                    background: c.bgCard,
                    border: pedidoCompletado ? '1px solid rgba(34, 197, 94, 0.3)' : `1px solid ${c.border}`,
                  }}
                >
                  {/* Header clickeable */}
                  <div className="p-4 cursor-pointer" onClick={toggleExpand}>
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <span className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black shrink-0"
                          style={{ background: pedidoCompletado ? 'rgba(34,197,94,0.12)' : 'rgba(59,130,246,0.1)', color: pedidoCompletado ? '#22c55e' : '#3b82f6' }}>
                          {pedidoCompletado ? <CheckCircle2 className="w-4 h-4" /> : idx + 1}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-bold" style={{ color: c.text }}>{freshP.tipoAve}</span>
                            {freshP.variedad && <span className="text-[10px]" style={{ color: c.textMuted }}>({freshP.variedad})</span>}
                            <span className="font-mono text-[10px]" style={{ color: c.textMuted }}>{freshP.numeroPedido}</span>
                            <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ring-1 ring-current/20 ${getEstadoBadge(freshP.estado || 'En Despacho')}`}>
                              {freshP.estado}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                            <span className="text-[10px]" style={{ color: c.textMuted }}>{freshP.presentacion}</span>
                            <span className="text-[10px]" style={{ color: c.textMuted }}>·</span>
                            <span className={`text-[10px] font-bold ${vivo ? 'text-amber-400' : 'text-purple-400'}`}>
                              {vivo ? `${freshP.cantidadJabas || 0} jabas` : `${freshP.cantidad} unids.`}
                            </span>
                            <span className="text-[10px]" style={{ color: c.textMuted }}>·</span>
                            <span className="text-[10px] font-bold" style={{ color: c.text }}>{(freshP.pesoBrutoTotal || 0).toFixed(1)} kg</span>
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); toggleExpand(); }}
                        className="p-2 rounded-lg transition-all hover:scale-105 shrink-0"
                        style={{ background: c.g06, border: `1px solid ${c.border}` }}
                      >
                        <ChevronDown className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} style={{ color: c.textSecondary }} />
                      </button>
                    </div>
                  </div>

                  {/* Contenido expandido */}
                  {isExpanded && (
                    <div className="px-4 pb-4 pt-2" style={{ borderTop: `1px solid ${c.borderSubtle}` }}>

                      {/* Info de producto concisa */}
                      <ProductInfoCard pedido={freshP} compact />

                      {/* Registros existentes */}
                      {regs.length > 0 && (
                        <div className="space-y-2 mt-3 mb-3">
                          {regs.slice(0, 3).map(reg => (
                            <div key={reg.id} className="flex items-center justify-between px-3 py-2 rounded-lg"
                              style={{ background: c.bgCardAlt, border: `1px solid ${c.borderSubtle}` }}>
                              <div className="flex items-center gap-2">
                                {getTipoIcon(reg.tipo)}
                                <span className="text-xs font-bold" style={{ color: c.text }}>{getTipoLabel(reg.tipo, reg.id)}</span>
                                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${getEstadoColor(reg.estado)}`}>{reg.estado}</span>
                              </div>
                              <div className="flex items-center gap-2 text-[10px]" style={{ color: c.textMuted }}>
                                {reg.cantidadUnidades && <span className="text-orange-300">{reg.cantidadUnidades} unids.</span>}
                                {reg.peso && <span className="font-mono font-bold" style={{ color: c.text }}>{reg.peso.toFixed(1)} kg</span>}
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

                      {/* Acciones: Repesaje, Devolución, Entrega (SIN ADICIÓN) */}
                      {pedidoCompletado ? (
                        <div className="flex items-center justify-center gap-2 py-3 rounded-xl mt-3"
                          style={{ background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.2)' }}>
                          <CheckCircle2 className="w-5 h-5 text-green-400" />
                          <span className="text-green-400 font-black text-sm uppercase tracking-wider">Entregado</span>
                        </div>
                      ) : (
                        <div className="grid grid-cols-3 gap-2 mt-3">
                          <button
                            onClick={(e) => { e.stopPropagation(); setSelectedPedido(freshP); resetRepesaje(); setModo('REPESADA'); }}
                            className="flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl transition-all hover:scale-[1.03] active:scale-[0.97]"
                            style={{ background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.18)' }}
                          >
                            <Scale className="w-5 h-5 text-blue-400" />
                            <span className="text-[10px] font-bold text-blue-300 uppercase">Repesaje</span>
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); setSelectedPedido(freshP); resetDevolucion(); setModo('DEVOLUCION'); }}
                            className="flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl transition-all hover:scale-[1.03] active:scale-[0.97]"
                            style={{ background: 'rgba(249,115,22,0.06)', border: '1px solid rgba(249,115,22,0.18)' }}
                          >
                            <RotateCcw className="w-5 h-5 text-orange-400" />
                            <span className="text-[10px] font-bold text-orange-300 uppercase">Devolución</span>
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); setConfirmEntregaPedidoId(freshP.id); }}
                            className="flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl transition-all hover:scale-[1.03] active:scale-[0.97]"
                            style={{ background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.2)' }}
                          >
                            <CheckCircle2 className="w-5 h-5 text-green-400" />
                            <span className="text-[10px] font-bold text-green-300 uppercase">Entrega</span>
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Adiciones registradas para este grupo (sub-items visuales) */}
          {(() => {
            const adicionesGrupo = getAdicionesRegistradasParaGrupo(grupoSeleccionado.grupoId);
            if (adicionesGrupo.length === 0) return null;
            const pesoTotalAdiciones = adicionesGrupo.reduce((sum, r) => sum + (r.peso || 0), 0);
            return (
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-cyan-400 uppercase tracking-widest px-1 flex items-center gap-2">
                  <ArrowLeftRight className="w-4 h-4" /> Adiciones ({adicionesGrupo.length})
                  <span className="text-[10px] font-normal normal-case ml-auto" style={{ color: c.textMuted }}>
                    Total: {pesoTotalAdiciones.toFixed(1)} kg · Se integran al confirmar entrega
                  </span>
                </h3>
                {adicionesGrupo.map(reg => (
                  <div key={reg.id}
                    className="backdrop-blur-xl rounded-xl overflow-hidden"
                    style={{
                      background: c.bgCard,
                      border: '1px solid rgba(6, 182, 212, 0.25)',
                    }}
                  >
                    <div className="p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <span className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black shrink-0"
                            style={{ background: 'rgba(6,182,212,0.12)', color: '#06b6d4' }}>
                            <ArrowLeftRight className="w-4 h-4" />
                          </span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-sm font-bold" style={{ color: c.text }}>Adición</span>
                              <span className="text-[10px] text-cyan-300 bg-cyan-500/10 px-2 py-0.5 rounded-full border border-cyan-500/20 font-bold">
                                desde {reg.clienteOrigenNombre}
                              </span>
                              <span className="font-mono text-[10px]" style={{ color: c.textMuted }}>{reg.pedidoOrigenNumero}</span>
                              <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ring-1 ring-green-500/25 bg-green-500/15 text-green-400">
                                Entregado
                              </span>
                            </div>
                            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                              <span className="text-[10px] font-bold text-cyan-400">{reg.cantidadUnidades} unids.</span>
                              <span className="text-[10px]" style={{ color: c.textMuted }}>·</span>
                              <span className="text-[10px] font-bold" style={{ color: c.text }}>{(reg.peso || 0).toFixed(1)} kg</span>
                              <span className="text-[10px]" style={{ color: c.textMuted }}>·</span>
                              <span className="text-[10px]" style={{ color: c.textMuted }}>{new Date(reg.fecha).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      {/* Sin botones de acción — auto-entregado */}
                      <div className="flex items-center justify-center gap-2 py-2 rounded-xl mt-3"
                        style={{ background: 'rgba(6,182,212,0.06)', border: '1px solid rgba(6,182,212,0.15)' }}>
                        <CheckCircle2 className="w-4 h-4 text-cyan-400" />
                        <span className="text-cyan-400 font-bold text-[11px] uppercase tracking-wider">Adición · Se integra con Entrega Total</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            );
          })()}
        </div>
      )}

      {/* ═══════ DETALLE INDIVIDUAL (timeline completo) ═══════ */}
      {modo === 'DETALLE' && selectedPedido && (() => {
        const freshSP = pedidosConfirmados.find(p => p.id === selectedPedido.id) || selectedPedido;
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="rounded-2xl overflow-hidden shadow-xl" style={{ background: c.bgCard, border: `1px solid ${c.border}` }}>
              <div className={`h-1 w-full ${freshSP.estado === 'Devolución' ? 'bg-red-500' :
                freshSP.estado === 'Con Incidencia' ? 'bg-amber-500' : 'bg-emerald-500'
                }`} />
              <div className="p-6">
                <p className="text-[11px] text-emerald-400/70 font-mono uppercase tracking-[0.15em] mb-3">Detalle del Pedido</p>
                <ProductInfoCard pedido={freshSP} />

                <div className={`mt-4 flex items-center gap-3 rounded-xl px-4 py-3`} style={{ background: c.bgCardAlt, border: `1px solid ${c.border}` }}>
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${freshSP.estado === 'Devolución' ? 'bg-red-500/15' :
                    freshSP.estado === 'Con Incidencia' ? 'bg-amber-500/15' : 'bg-emerald-500/15'
                    }`}>
                    {freshSP.estado === 'Devolución' ? <RotateCcw className="w-4 h-4 text-red-400" /> :
                      freshSP.estado === 'Con Incidencia' ? <AlertCircle className="w-4 h-4 text-amber-400" /> :
                        <Truck className="w-4 h-4 text-emerald-400" />}
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wider" style={{ color: c.textMuted }}>Estado</p>
                    <p className={`text-sm font-bold ${freshSP.estado === 'Devolución' ? 'text-red-400' :
                      freshSP.estado === 'Con Incidencia' ? 'text-amber-400' : 'text-emerald-400'
                      }`}>{freshSP.estado}</p>
                  </div>
                </div>

                {freshSP.estado !== 'Entregado' && (
                  <div className="grid grid-cols-3 gap-2 mt-4">
                    <button onClick={() => { resetRepesaje(); setModo('REPESADA'); }}
                      className="flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl transition-all hover:scale-[1.03] active:scale-[0.97]"
                      style={{ background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.18)' }}>
                      <Scale className="w-5 h-5 text-blue-400" />
                      <span className="text-[10px] font-bold text-blue-300 uppercase">Repesaje</span>
                    </button>
                    <button onClick={() => { resetDevolucion(); setModo('DEVOLUCION'); }}
                      className="flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl transition-all hover:scale-[1.03] active:scale-[0.97]"
                      style={{ background: 'rgba(249,115,22,0.06)', border: '1px solid rgba(249,115,22,0.18)' }}>
                      <RotateCcw className="w-5 h-5 text-orange-400" />
                      <span className="text-[10px] font-bold text-orange-300 uppercase">Devolución</span>
                    </button>
                    <button onClick={() => setConfirmEntregaPedidoId(freshSP.id)}
                      className="flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl transition-all hover:scale-[1.03] active:scale-[0.97]"
                      style={{ background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.2)' }}>
                      <CheckCircle2 className="w-5 h-5 text-green-400" />
                      <span className="text-[10px] font-bold text-green-300 uppercase">Entrega</span>
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Timeline completo */}
            <div className="space-y-4">
              <h3 className="text-base font-bold flex items-center gap-2 px-1" style={{ color: c.text }}>
                <History className="w-4 h-4" style={{ color: c.textMuted }} /> Registro de Movimientos
              </h3>
              {getRegistrosPedido(selectedPedido.id).length === 0 ? (
                <div className="rounded-xl p-14 text-center" style={{ background: c.bgCard, border: `1px dashed ${c.border}` }}>
                  <History className="w-10 h-10 mx-auto mb-3" style={{ color: c.textMuted }} />
                  <p className="text-sm" style={{ color: c.textMuted }}>Sin movimientos registrados</p>
                </div>
              ) : (
                <div className="relative pl-6">
                  <div className="absolute left-[10px] top-2 bottom-2 w-px" style={{ background: isDark ? '#1f2937' : '#e5e7eb' }} />
                  <div className="space-y-4">
                    {getRegistrosPedido(selectedPedido.id).map(reg => (
                      <div key={reg.id} className="relative">
                        <div className={`absolute -left-6 top-5 w-[9px] h-[9px] rounded-full ring-2 ring-gray-900 z-10 ${reg.tipo === 'repesada' ? 'bg-blue-400' :
                          reg.tipo === 'devolucion' ? 'bg-orange-400' :
                            (reg.tipo === 'adicion' || reg.tipo === 'asignacion') ? 'bg-teal-400' :
                              reg.tipo === 'entrega' ? 'bg-green-400' : 'bg-gray-500'
                          }`} />
                        <div className="rounded-xl p-4 transition-colors" style={{ background: c.bgCard, border: `1px solid ${c.border}` }}>
                          <div className="flex flex-wrap items-center gap-2 mb-2">
                            {getTipoIcon(reg.tipo)}
                            <span className="text-sm font-bold" style={{ color: c.text }}>{getTipoLabel(reg.tipo, reg.id)}</span>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ring-1 ring-current/20 ${getEstadoColor(reg.estado)}`}>{reg.estado}</span>
                            <span className="ml-auto text-[11px] flex items-center gap-1 tabular-nums" style={{ color: c.textMuted }}>
                              <Calendar className="w-3 h-3" />{new Date(reg.fecha).toLocaleDateString()}
                              <span className="text-gray-700 mx-0.5">·</span>
                              <Clock className="w-3 h-3" />{new Date(reg.fecha).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <div className="space-y-1">
                            {reg.cantidadUnidades && (
                              <div className="flex items-center gap-2 text-sm" style={{ color: c.textSecondary }}>
                                <Hash className="w-4 h-4" style={{ color: c.textMuted }} />Cantidad: <span className="font-bold" style={{ color: c.text }}>{reg.cantidadUnidades} unids.</span>
                              </div>
                            )}
                            {reg.peso && (
                              <div className="flex items-center gap-2 text-sm" style={{ color: c.textSecondary }}>
                                <Weight className="w-4 h-4" style={{ color: c.textMuted }} />Peso: <span className="font-bold" style={{ color: c.text }}>{reg.peso.toFixed(1)} kg</span>
                              </div>
                            )}
                            {reg.motivo && (
                              <p className="text-sm text-orange-300 bg-orange-900/15 border border-orange-500/15 px-3 py-1.5 rounded-lg">"{reg.motivo}"</p>
                            )}
                            {reg.clienteDestinoNombre && (
                              <div className="flex items-center gap-2 text-sm" style={{ color: c.textSecondary }}>
                                <User className="w-4 h-4" style={{ color: c.textMuted }} />Destino: <span className="text-teal-400 font-bold">{reg.clienteDestinoNombre}</span>
                              </div>
                            )}
                            {reg.nuevoClienteNombre && (
                              <div className="flex items-center gap-2 text-sm" style={{ color: c.textSecondary }}>
                                <User className="w-4 h-4" style={{ color: c.textMuted }} />Cliente: <span className="text-emerald-400 font-bold">{reg.nuevoClienteNombre}</span>
                              </div>
                            )}
                          </div>
                          {reg.fotos.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mt-2">
                              {reg.fotos.map((f, fi) => (
                                <div key={fi} className="w-14 h-14 rounded-lg overflow-hidden cursor-pointer hover:border-emerald-500/60 transition-all" style={{ background: isDark ? '#1f2937' : '#f3f4f6', border: `1px solid ${c.border}` }}
                                  onClick={() => window.open(f.url, '_blank')}>
                                  <img src={f.url} alt="" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).src = 'https://via.placeholder.com/64?text=Foto'; }} />
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
        );
      })()}

      {/* ═══════ MÓDULO DE REPESAJE ═══════ */}
      {modo === 'REPESADA' && selectedPedido && (() => {
        const freshP = getFreshPedido() || selectedPedido;
        const vivo = checkEsVivo(freshP);
        const pesoOriginal = freshP.pesoBrutoTotal || 0;
        const pesoAcumulado = tandasRepesaje.reduce((s, t) => s + t.peso, 0);
        const diferencia = pesoAcumulado > 0 ? pesoAcumulado - pesoOriginal : 0;

        return (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="rounded-2xl overflow-hidden shadow-xl" style={{ background: c.bgCard, border: `1px solid ${c.border}` }}>
              <div className="h-1 w-full bg-blue-500" />
              <div className="p-5 space-y-4">

                {/* Header */}
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/15 flex items-center justify-center shrink-0">
                    <Scale className="w-5 h-5 text-blue-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="text-lg font-extrabold uppercase tracking-tight" style={{ color: c.text }}>Repesaje</h2>
                    <p className="text-[11px]" style={{ color: c.textMuted }}>{freshP.cliente} · {freshP.numeroPedido}</p>
                  </div>
                </div>

                {/* Info del producto */}
                <ProductInfoCard pedido={freshP} compact />

                {/* Contexto de jabas/unidades */}
                {vivo && (
                  <div className="bg-amber-500/5 border border-amber-500/15 rounded-xl p-3 flex items-center gap-3">
                    <Package className="w-5 h-5 text-amber-400 shrink-0" />
                    <div>
                      <p className="text-xs font-bold text-amber-300">Despacho en Jabas</p>
                      <p className="text-[11px]" style={{ color: c.textSecondary }}>
                        {freshP.cantidadJabas || 0} jabas · {freshP.unidadesPorJaba || 0} aves/jaba ·{' '}
                        {(freshP.cantidadJabas || 0) * (freshP.unidadesPorJaba || 0)} aves total
                      </p>
                    </div>
                  </div>
                )}

                {/* Peso original vs acumulado */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl p-3 text-center" style={{ background: c.bgCardAlt, border: `1px solid ${c.border}` }}>
                    <p className="text-[10px] uppercase font-bold tracking-wider mb-0.5" style={{ color: c.textMuted }}>Peso Original</p>
                    <p className="text-xl font-black tabular-nums" style={{ color: c.textSecondary }}>{pesoOriginal.toFixed(1)}<span className="text-xs ml-0.5" style={{ color: c.textMuted }}>kg</span></p>
                  </div>
                  <div className={`border rounded-xl p-3 text-center ${pesoAcumulado > 0
                    ? (Math.abs(diferencia) <= 0.5 ? 'bg-green-900/15 border-green-500/25' : 'bg-amber-900/15 border-amber-500/25')
                    : 'bg-blue-900/15 border-blue-500/25'
                    }`}>
                    <p className="text-[10px] text-blue-400 uppercase font-bold tracking-wider mb-0.5">Repesaje Total</p>
                    <p className="text-xl font-black tabular-nums" style={{ color: c.text }}>{pesoAcumulado.toFixed(1)}<span className="text-xs ml-0.5" style={{ color: c.textMuted }}>kg</span></p>
                  </div>
                </div>

                {/* Diferencia en tiempo real */}
                {pesoAcumulado > 0 && (
                  <div className={`flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-bold ${Math.abs(diferencia) <= 0.5 ? 'text-green-400 bg-green-500/10' : diferencia > 0 ? 'text-amber-400 bg-amber-500/10' : 'text-red-400 bg-red-500/10'
                    }`}>
                    {Math.abs(diferencia) <= 0.5 ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                    Diferencia: {diferencia > 0 ? '+' : ''}{diferencia.toFixed(1)} kg
                    {Math.abs(diferencia) <= 0.5 && ' (dentro del margen)'}
                  </div>
                )}

                {/* Alerta: foto obligatoria */}
                {formWeight && !capturedPhoto && (
                  <div className="bg-amber-500/10 border border-amber-500/40 rounded-xl p-3 flex items-center gap-3">
                    <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
                    <p className="text-amber-200 font-bold text-xs uppercase">Tome la foto antes de sumar la tanda</p>
                  </div>
                )}

                {/* Input peso + foto */}
                <div className="grid grid-cols-1 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest mb-1.5" style={{ color: c.textMuted }}>
                      Peso de esta tanda (kg) <span className="text-red-400">*</span>
                    </label>
                    <div className="relative">
                      <input type="number" inputMode="decimal" step="0.1" min="0" value={formWeight}
                        onChange={(e) => setFormWeight(e.target.value)} placeholder="0.0"
                        className="w-full rounded-xl px-4 py-4 text-3xl font-black focus:outline-none focus:border-blue-500 transition-all pr-12 shadow-inner" style={{ background: c.bgInput, border: `2px solid ${c.border}`, color: c.text }} />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 font-bold text-lg" style={{ color: c.textMuted }}>kg</span>
                    </div>
                  </div>
                  <button onClick={() => handleCapturePhoto(setCapturedPhoto)}
                    className={`w-full h-14 border-2 rounded-xl flex items-center justify-center gap-3 transition-all font-black text-base active:scale-95 ${capturedPhoto
                      ? 'bg-emerald-900/30 border-emerald-500 text-emerald-400'
                      : ''
                      }`}
                    style={!capturedPhoto ? { background: isDark ? '#1f2937' : c.bgInput, border: `2px solid ${c.border}`, color: c.text } : undefined}>
                    <Camera className={`w-5 h-5 ${capturedPhoto ? 'text-emerald-400' : 'text-amber-400'}`} />
                    {capturedPhoto ? '✓ FOTO LISTA' : 'TOMAR FOTO'}
                  </button>
                </div>

                {/* Preview foto */}
                {capturedPhoto && (
                  <div className="flex items-center gap-3 p-2 rounded-xl" style={{ background: isDark ? 'rgba(0,0,0,0.3)' : 'rgba(243,244,246,0.8)', border: `1px solid ${c.border}` }}>
                    <div className="w-14 h-14 rounded-lg overflow-hidden border border-gray-700 shrink-0">
                      <img src={capturedPhoto} alt="" className="w-full h-full object-cover" />
                    </div>
                    <p className="text-xs flex-1" style={{ color: c.textMuted }}>Foto de evidencia capturada</p>
                    <button onClick={() => setCapturedPhoto("")} className="p-1 bg-red-500/20 rounded-full"><X className="w-3 h-3 text-red-400" /></button>
                  </div>
                )}

                {/* Botón sumar tanda */}
                <button onClick={handleAddTanda}
                  disabled={!formWeight || !capturedPhoto}
                  className="w-full py-4 border-2 rounded-xl font-black text-lg flex items-center justify-center gap-3 transition-all active:scale-[0.98] disabled:cursor-not-allowed"
                  style={formWeight && capturedPhoto
                    ? { background: 'rgba(37, 99, 235, 0.9)', borderColor: 'rgba(96, 165, 250, 0.6)', color: '#fff' }
                    : { background: isDark ? 'rgba(255,255,255,0.06)' : '#d1d5db', borderColor: isDark ? 'rgba(255,255,255,0.1)' : '#9ca3af', color: c.textMuted, opacity: 0.6 }
                  }>
                  <Plus className="w-6 h-6" /> SUMAR TANDA
                </button>

                {/* Lista de tandas */}
                {tandasRepesaje.length > 0 && (
                  <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: c.textMuted }}>Tandas ({tandasRepesaje.length})</p>
                      <button onClick={handleQuitarUltimaTanda} className="text-[10px] text-red-400/70 hover:text-red-400 font-bold flex items-center gap-1">
                        <Minus className="w-3 h-3" /> Quitar última
                      </button>
                    </div>
                    <div className="space-y-1.5 max-h-48 overflow-y-auto">
                      {tandasRepesaje.map((t, i) => (
                        <div key={i} className="flex items-center justify-between rounded-lg p-2.5" style={{ background: isDark ? 'rgba(0,0,0,0.4)' : c.bgCardAlt, border: `1px solid ${c.borderSubtle}` }}>
                          <div className="flex items-center gap-2">
                            <div className="w-9 h-9 rounded-lg overflow-hidden border border-gray-600/50 shrink-0">
                              <img src={t.foto} className="w-full h-full object-cover" />
                            </div>
                            <span className="font-bold text-sm" style={{ color: c.text }}>Tanda {t.numero}</span>
                          </div>
                          <span className="text-lg font-black text-blue-400 tabular-nums">{t.peso.toFixed(1)} kg</span>
                        </div>
                      ))}
                    </div>
                    <div className="bg-blue-900/25 border border-blue-500/30 rounded-xl p-3 flex justify-between items-center">
                      <span className="font-extrabold text-sm uppercase tracking-wider" style={{ color: c.text }}>Total Repesaje</span>
                      <span className="text-2xl font-black tabular-nums" style={{ color: c.text }}>{pesoAcumulado.toFixed(1)} kg</span>
                    </div>
                  </div>
                )}

                {/* Finalizar */}
                <button onClick={handleFinishRepesaje}
                  disabled={tandasRepesaje.length === 0}
                  className="w-full py-4 rounded-xl font-extrabold text-lg shadow-xl transition-all flex items-center justify-center gap-3 active:scale-[0.98] disabled:cursor-not-allowed"
                  style={tandasRepesaje.length > 0
                    ? { background: '#059669', color: '#fff' }
                    : { background: isDark ? '#1f2937' : '#d1d5db', color: c.textMuted, opacity: 0.6 }
                  }>
                  <CheckCircle2 className="w-5 h-5" /> FINALIZAR REPESAJE
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ═══════ MÓDULO DE DEVOLUCIÓN ═══════ */}
      {modo === 'DEVOLUCION' && selectedPedido && (() => {
        const freshP = getFreshPedido() || selectedPedido;
        const vivo = checkEsVivo(freshP);

        return (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="rounded-2xl overflow-hidden shadow-xl" style={{ background: c.bgCard, border: `1px solid ${c.border}` }}>
              <div className="h-1 w-full bg-orange-500" />
              <div className="p-5 space-y-4">

                {/* Header */}
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-orange-500/15 flex items-center justify-center shrink-0">
                    <RotateCcw className="w-5 h-5 text-orange-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="text-lg font-extrabold uppercase tracking-tight" style={{ color: c.text }}>
                      {devStep === 'datos' ? 'Registrar Devolución' : 'Motivo de Devolución'}
                    </h2>
                    <p className="text-[11px]" style={{ color: c.textMuted }}>{freshP.cliente} · {freshP.numeroPedido}</p>
                  </div>
                </div>

                {/* Info del producto */}
                <ProductInfoCard pedido={freshP} compact />

                {/* Aviso: devoluciones siempre en unidades */}
                {vivo && (
                  <div className="bg-orange-500/8 border border-orange-500/20 rounded-xl p-3 flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 text-orange-400 shrink-0" />
                    <p className="text-[11px] text-orange-300">
                      <span className="font-bold">Importante:</span> Aunque el despacho es en jabas, la devolución se registra en <span className="font-bold" style={{ color: c.text }}>unidades</span>.
                    </p>
                  </div>
                )}

                {devStep === 'datos' ? (
                  <>
                    {/* Cantidad + Peso */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-widest mb-1.5" style={{ color: c.textMuted }}>
                          Cantidad (unids.) <span className="text-red-400">*</span>
                        </label>
                        <input type="number" inputMode="numeric" min="1" value={devCantidad}
                          onChange={(e) => setDevCantidad(e.target.value)} placeholder="0"
                          className="w-full rounded-xl px-4 py-3.5 text-2xl font-black focus:outline-none focus:border-orange-500 transition-all text-center" style={{ background: c.bgInput, border: `2px solid ${c.border}`, color: c.text }} />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-widest mb-1.5" style={{ color: c.textMuted }}>
                          Peso (kg) <span className="text-red-400">*</span>
                        </label>
                        <div className="relative">
                          <input type="number" inputMode="decimal" step="0.1" min="0" value={devPeso}
                            onChange={(e) => setDevPeso(e.target.value)} placeholder="0.0"
                            className="w-full rounded-xl px-4 py-3.5 text-2xl font-black focus:outline-none focus:border-orange-500 transition-all text-center pr-10" style={{ background: c.bgInput, border: `2px solid ${c.border}`, color: c.text }} />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 font-bold text-sm" style={{ color: c.textMuted }}>kg</span>
                        </div>
                      </div>
                    </div>

                    {/* Foto */}
                    <div>
                      <label className="block text-[10px] font-bold text-orange-400 uppercase tracking-widest mb-1.5">Foto de Evidencia <span className="text-red-400">*</span></label>
                      <button onClick={() => handleCapturePhoto(setDevFoto)}
                        className={`w-full h-14 border-2 rounded-xl flex items-center justify-center gap-3 transition-all font-black text-base active:scale-95 ${devFoto
                          ? 'bg-emerald-900/30 border-emerald-500 text-emerald-400'
                          : ''
                          }`}
                        style={!devFoto ? { background: isDark ? '#1f2937' : c.bgInput, border: `2px solid ${c.border}`, color: c.text } : undefined}>
                        <Camera className={`w-5 h-5 ${devFoto ? 'text-emerald-400' : 'text-orange-400'}`} />
                        {devFoto ? '✓ FOTO LISTA' : 'TOMAR FOTO'}
                      </button>
                    </div>

                    {/* Preview foto */}
                    {devFoto && (
                      <div className="flex items-center gap-3 p-2 rounded-xl" style={{ background: isDark ? 'rgba(0,0,0,0.3)' : 'rgba(243,244,246,0.8)', border: `1px solid ${c.border}` }}>
                        <div className="w-14 h-14 rounded-lg overflow-hidden border border-gray-700 shrink-0">
                          <img src={devFoto} alt="" className="w-full h-full object-cover" />
                        </div>
                        <p className="text-xs flex-1" style={{ color: c.textMuted }}>Foto de evidencia</p>
                        <button onClick={() => setDevFoto("")} className="p-1 bg-red-500/20 rounded-full"><X className="w-3 h-3 text-red-400" /></button>
                      </div>
                    )}

                    {/* Continuar a motivo */}
                    <button onClick={() => {
                      if (!devCantidad || parseInt(devCantidad) <= 0) { toast.error("Ingrese cantidad"); return; }
                      if (!devPeso || parseFloat(devPeso) <= 0) { toast.error("Ingrese peso"); return; }
                      if (!devFoto) { toast.error("Tome la foto de evidencia"); return; }
                      setDevStep('motivo');
                    }}
                      disabled={!devCantidad || !devPeso || !devFoto}
                      className="w-full py-4 rounded-xl font-extrabold text-lg shadow-xl transition-all flex items-center justify-center gap-3 active:scale-[0.98] disabled:cursor-not-allowed"
                      style={(devCantidad && devPeso && devFoto)
                        ? { background: '#ea580c', color: '#fff' }
                        : { background: isDark ? '#1f2937' : '#d1d5db', color: c.textMuted, opacity: 0.6 }
                      }>
                      <ArrowRight className="w-5 h-5" /> CONTINUAR
                    </button>
                  </>
                ) : (
                  <>
                    {/* Resumen de datos */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-orange-900/15 border border-orange-500/25 rounded-xl p-3 text-center">
                        <p className="text-[10px] text-orange-400 uppercase font-bold">Cantidad</p>
                        <p className="text-xl font-black" style={{ color: c.text }}>{devCantidad} <span className="text-xs" style={{ color: c.textMuted }}>unids.</span></p>
                      </div>
                      <div className="bg-orange-900/15 border border-orange-500/25 rounded-xl p-3 text-center">
                        <p className="text-[10px] text-orange-400 uppercase font-bold">Peso</p>
                        <p className="text-xl font-black" style={{ color: c.text }}>{parseFloat(devPeso).toFixed(1)} <span className="text-xs" style={{ color: c.textMuted }}>kg</span></p>
                      </div>
                    </div>

                    {/* Motivo */}
                    <div>
                      <label className="block text-sm font-bold text-orange-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                        <AlertCircle className="w-4 h-4" /> Motivo <span className="text-red-400">*</span>
                      </label>
                      <textarea value={devMotivo} autoFocus onChange={(e) => setDevMotivo(e.target.value)}
                        className="w-full rounded-xl px-4 py-3 text-base focus:outline-none focus:border-orange-500 transition-all h-28 resize-none placeholder:text-gray-600"
                        style={{ background: c.bgInput, border: `1px solid ${c.border}`, color: c.text }}                        placeholder="Ej: Producto dañado, cliente no aceptó..." maxLength={200} />
                      <div className="flex justify-between items-center mt-1.5">
                        <button onClick={() => setDevStep('datos')} className="text-xs text-orange-400/50 hover:text-orange-400 font-bold uppercase underline transition-colors">
                          Volver a datos
                        </button>
                        <p className="text-[10px] font-mono tabular-nums" style={{ color: c.textMuted }}>{devMotivo.length}/200</p>
                      </div>
                    </div>

                    {/* Confirmar */}
                    <button onClick={handleFinishDevolucion}
                      disabled={devMotivo.length < 3}
                      className="w-full py-5 rounded-xl font-extrabold text-xl shadow-xl transition-all flex items-center justify-center gap-3 active:scale-[0.98] disabled:cursor-not-allowed"
                      style={devMotivo.length >= 3
                        ? { background: '#059669', color: '#fff' }
                        : { background: isDark ? '#1f2937' : '#d1d5db', color: c.textMuted, opacity: 0.6 }
                      }>
                      <CheckCircle2 className="w-6 h-6" /> CONFIRMAR DEVOLUCIÓN
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        );
      })()}

      {/* ═══════ MÓDULO DE ADICIÓN (DESDE GRUPO) ═══════ */}
      {modo === 'ADICION' && grupoSeleccionado && (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-300">

          {adicionStep === 'lista' ? (
            /* ── Lista de devoluciones disponibles para este cliente ── */
            <div className="space-y-4">
              <div className="rounded-2xl overflow-hidden shadow-xl" style={{ background: c.bgCard, border: `1px solid ${c.border}` }}>
                <div className="h-1 w-full bg-cyan-500" />
                <div className="p-5">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-cyan-500/15 flex items-center justify-center shrink-0">
                      <ArrowLeftRight className="w-5 h-5 text-cyan-400" />
                    </div>
                    <div>
                      <h2 className="text-lg font-extrabold uppercase tracking-tight" style={{ color: c.text }}>Adición para {grupoSeleccionado.cliente}</h2>
                      <p className="text-[11px]" style={{ color: c.textMuted }}>Seleccione un producto devuelto para adicionar a este despacho</p>
                    </div>
                  </div>

                  {(() => {
                    const disponibles = getAdicionesParaGrupo(grupoSeleccionado.grupoId);
                    return disponibles.length === 0 ? (
                      <div className="rounded-xl p-12 text-center" style={{ background: c.bgCard, border: `1px dashed ${c.border}` }}>
                        <ArrowLeftRight className="w-10 h-10 mx-auto mb-3" style={{ color: c.textMuted }} />
                        <p className="text-sm" style={{ color: c.textMuted }}>No hay productos disponibles para adición</p>
                        <p className="text-[11px] mt-1" style={{ color: c.textMuted }}>Las adiciones aparecerán cuando otros clientes registren devoluciones</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {disponibles.map(dev => (
                          <div key={dev.registroId}
                            className="rounded-xl p-4 transition-all cursor-pointer active:scale-[0.99]"
                            style={{ background: c.bgCardAlt, border: `1px solid ${c.border}` }}
                            onClick={() => { setAdicionSeleccionada(dev); setAdicionStep('formulario'); }}
                          >
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-[10px] font-bold text-cyan-300 uppercase bg-cyan-500/10 px-2 py-0.5 rounded-full border border-cyan-500/20">
                                Dev. de {dev.clienteOrigen}
                              </span>
                              <span className="font-mono text-[10px]" style={{ color: c.textMuted }}>{dev.pedidoNumero}</span>
                            </div>
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0 flex-1">
                                <h4 className="text-sm font-bold" style={{ color: c.text }}>{dev.tipoAve}</h4>
                                {dev.variedad && <p className="text-[10px]" style={{ color: c.textMuted }}>{dev.variedad}</p>}
                                <div className="flex flex-wrap gap-1.5 mt-1.5">
                                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                                    {dev.presentacion}
                                  </span>
                                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${dev.esVivo
                                    ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                                    : 'bg-purple-500/10 text-purple-400 border-purple-500/20'
                                    }`}>
                                    {dev.esVivo ? 'Jabas' : 'Unidades'}
                                  </span>
                                </div>
                              </div>
                              <div className="text-right shrink-0">
                                <p className="text-xs uppercase font-bold" style={{ color: c.textMuted }}>Disponible</p>
                                <p className="text-lg font-black text-cyan-400">{dev.cantidadDisponible} <span className="text-xs" style={{ color: c.textMuted }}>unids.</span></p>
                                <p className="text-sm font-bold" style={{ color: c.text }}>{dev.pesoDisponible.toFixed(1)} kg</p>
                              </div>
                            </div>
                            <div className="flex items-center justify-end mt-2">
                              <span className="text-[10px] text-cyan-400 font-bold flex items-center gap-1">
                                Seleccionar <ChevronRight className="w-3 h-3" />
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    );
                  })()}
                </div>
              </div>
            </div>
          ) : adicionSeleccionada && (
            /* ── Formulario de Adición ── */
            <div className="rounded-2xl overflow-hidden shadow-xl" style={{ background: c.bgCard, border: `1px solid ${c.border}` }}>
              <div className="h-1 w-full bg-cyan-500" />
              <div className="p-5 space-y-4">

                {/* Header */}
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-cyan-500/15 flex items-center justify-center shrink-0">
                    <ArrowLeftRight className="w-5 h-5 text-cyan-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="text-lg font-extrabold uppercase tracking-tight" style={{ color: c.text }}>Confirmar Adición</h2>
                    <p className="text-[11px]" style={{ color: c.textMuted }}>Para <span className="text-cyan-400 font-bold">{grupoSeleccionado.cliente}</span></p>
                  </div>
                  <button onClick={() => { setAdicionStep('lista'); setAdicionSeleccionada(null); setAdicionCantidad(''); setAdicionPeso(''); setAdicionFoto(''); }} className="p-1.5 transition-colors rounded-lg" style={{ color: c.textMuted }}>
                    <ArrowRight className="w-4 h-4 rotate-180" />
                  </button>
                </div>

                {/* Origen del producto */}
                <div className="bg-cyan-900/10 border border-cyan-500/20 rounded-xl p-4">
                  <p className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest mb-2">Producto de Devolución</p>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <h4 className="text-base font-black" style={{ color: c.text }}>{adicionSeleccionada.tipoAve}</h4>
                      {adicionSeleccionada.variedad && <p className="text-[11px]" style={{ color: c.textSecondary }}>{adicionSeleccionada.variedad}</p>}
                      <div className="flex flex-wrap gap-1.5 mt-1.5">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                          {adicionSeleccionada.presentacion}
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${adicionSeleccionada.esVivo
                          ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                          : 'bg-purple-500/10 text-purple-400 border-purple-500/20'
                          }`}>
                          {adicionSeleccionada.esVivo ? 'Jabas' : 'Unidades'}
                        </span>
                      </div>
                      <p className="text-[11px] mt-1.5" style={{ color: c.textMuted }}>
                        <span style={{ color: c.textSecondary }}>Origen:</span> {adicionSeleccionada.clienteOrigen} · {adicionSeleccionada.pedidoNumero}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-[10px] text-cyan-400 uppercase font-bold">Disponible</p>
                      <p className="text-xl font-black text-cyan-400">{adicionSeleccionada.cantidadDisponible}</p>
                      <p className="text-xs" style={{ color: c.textSecondary }}>{adicionSeleccionada.pesoDisponible.toFixed(1)} kg</p>
                    </div>
                  </div>
                </div>

                {/* Destino (auto-seleccionado) */}
                <div className="bg-emerald-900/10 border border-emerald-500/20 rounded-xl p-3 flex items-center gap-3">
                  <User className="w-5 h-5 text-emerald-400 shrink-0" />
                  <div>
                    <p className="text-[10px] text-emerald-400 uppercase font-bold">Cliente Destino</p>
                    <p className="text-sm font-bold" style={{ color: c.text }}>{grupoSeleccionado.cliente}</p>
                  </div>
                </div>

                {/* Cantidad */}
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest mb-1.5" style={{ color: c.textMuted }}>
                    Cantidad (unids.) <span className="text-red-400">*</span>
                    <span className="text-cyan-400 ml-2">Máx. {adicionSeleccionada.cantidadDisponible}</span>
                  </label>
                  <input type="number" inputMode="numeric" min="1" max={adicionSeleccionada.cantidadDisponible}
                    value={adicionCantidad}
                    onChange={(e) => {
                      const val = e.target.value;
                      const num = parseInt(val);
                      if (val === '' || (num >= 0 && num <= adicionSeleccionada.cantidadDisponible)) {
                        setAdicionCantidad(val);
                      }
                    }}
                    placeholder={`1 - ${adicionSeleccionada.cantidadDisponible}`}
                    className="w-full rounded-xl px-4 py-3.5 text-2xl font-black focus:outline-none focus:border-cyan-500 transition-all text-center" style={{ background: c.bgInput, border: `2px solid ${c.border}`, color: c.text }} />
                  {adicionCantidad && parseInt(adicionCantidad) > 0 && parseInt(adicionCantidad) < adicionSeleccionada.cantidadDisponible && (
                    <p className="text-[10px] mt-1 text-center" style={{ color: c.textMuted }}>
                      Quedarán {adicionSeleccionada.cantidadDisponible - parseInt(adicionCantidad)} unids. disponibles para otros clientes
                    </p>
                  )}
                  {adicionCantidad && parseInt(adicionCantidad) === adicionSeleccionada.cantidadDisponible && (
                    <p className="text-[10px] text-cyan-400 mt-1 text-center font-bold">
                      Se adicionará todo el producto disponible
                    </p>
                  )}
                </div>

                {/* Peso - siempre obligatorio (pesaje real) */}
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest mb-1.5" style={{ color: c.textMuted }}>
                    Peso real pesado (kg) <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <input type="number" inputMode="decimal" step="0.1" min="0"
                      value={adicionPeso} onChange={(e) => setAdicionPeso(e.target.value)} placeholder="0.0"
                      className="w-full rounded-xl px-4 py-3.5 text-2xl font-black focus:outline-none focus:border-cyan-500 transition-all text-center pr-12" style={{ background: c.bgInput, border: `2px solid ${c.border}`, color: c.text }} />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 font-bold text-lg" style={{ color: c.textMuted }}>kg</span>
                  </div>
                  <p className="text-[10px] mt-1 text-center" style={{ color: c.textMuted }}>Pese el producto y registre el peso real de la balanza</p>
                </div>

                {/* Foto - obligatoria */}
                <div>
                  <label className="block text-[10px] font-bold text-cyan-400 uppercase tracking-widest mb-1.5">Foto de Pesaje <span className="text-red-400">*</span></label>
                  <button onClick={() => handleCapturePhoto(setAdicionFoto)}
                    className={`w-full h-14 border-2 rounded-xl flex items-center justify-center gap-3 transition-all font-black text-base active:scale-95 ${adicionFoto
                      ? 'bg-emerald-900/30 border-emerald-500 text-emerald-400'
                      : ''
                      }`}
                    style={!adicionFoto ? { background: isDark ? '#1f2937' : c.bgInput, border: `2px solid ${c.border}`, color: c.text } : undefined}>
                    <Camera className={`w-5 h-5 ${adicionFoto ? 'text-emerald-400' : 'text-cyan-400'}`} />
                    {adicionFoto ? '✓ FOTO LISTA' : 'TOMAR FOTO'}
                  </button>
                </div>

                {adicionFoto && (
                  <div className="flex items-center gap-3 p-2 rounded-xl" style={{ background: isDark ? 'rgba(0,0,0,0.3)' : 'rgba(243,244,246,0.8)', border: `1px solid ${c.border}` }}>
                    <div className="w-14 h-14 rounded-lg overflow-hidden border border-gray-700 shrink-0">
                      <img src={adicionFoto} alt="" className="w-full h-full object-cover" />
                    </div>
                    <p className="text-xs flex-1" style={{ color: c.textMuted }}>Foto de evidencia del pesaje</p>
                    <button onClick={() => setAdicionFoto("")} className="p-1 bg-red-500/20 rounded-full"><X className="w-3 h-3 text-red-400" /></button>
                  </div>
                )}

                {/* Resumen antes de confirmar */}
                {adicionCantidad && adicionPeso && parseInt(adicionCantidad) > 0 && parseFloat(adicionPeso) > 0 && (
                  <div className="bg-cyan-900/10 border border-cyan-500/20 rounded-xl p-3">
                    <p className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest mb-2">Resumen de Adición</p>
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div>
                        <p className="text-[10px]" style={{ color: c.textMuted }}>Cantidad</p>
                        <p className="text-lg font-black" style={{ color: c.text }}>{adicionCantidad}</p>
                      </div>
                      <div>
                        <p className="text-[10px]" style={{ color: c.textMuted }}>Peso</p>
                        <p className="text-lg font-black" style={{ color: c.text }}>{parseFloat(adicionPeso).toFixed(1)} kg</p>
                      </div>
                      <div>
                        <p className="text-[10px]" style={{ color: c.textMuted }}>Destino</p>
                        <p className="text-sm font-bold text-cyan-400 truncate">{grupoSeleccionado.cliente}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Confirmar */}
                <button onClick={handleFinishAdicion}
                  disabled={!adicionCantidad || !adicionPeso || !adicionFoto || parseInt(adicionCantidad) <= 0 || parseFloat(adicionPeso) <= 0}
                  className="w-full py-5 rounded-xl font-extrabold text-xl shadow-xl transition-all flex items-center justify-center gap-3 active:scale-[0.98] disabled:cursor-not-allowed"
                  style={(adicionCantidad && adicionPeso && adicionFoto && parseInt(adicionCantidad) > 0 && parseFloat(adicionPeso) > 0)
                    ? { background: '#059669', color: '#fff' }
                    : { background: isDark ? '#1f2937' : '#d1d5db', color: c.textMuted, opacity: 0.6 }
                  }>
                  <CheckCircle2 className="w-6 h-6" /> CONFIRMAR ADICIÓN
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ═══════ MODAL: CONFIRMAR ENTREGA TOTAL ═══════ */}
      {showConfirmEntregaTotal && grupoSeleccionado && (() => {
        const freshGrupo = getFreshGrupo() || grupoSeleccionado;
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ background: c.bgModalOverlay }}>
            <div className="rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl animate-in fade-in zoom-in-95 duration-200" style={{ background: c.bgModal, border: `1px solid ${c.border}` }}>
              <div className="p-6 space-y-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-green-500/15 flex items-center justify-center">
                    <CheckCircle2 className="w-5 h-5 text-green-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-extrabold" style={{ color: c.text }}>Confirmar Entrega Total</h3>
                    <p className="text-xs" style={{ color: c.textMuted }}>{freshGrupo.cliente} · {freshGrupo.pedidos.length} pedido{freshGrupo.pedidos.length > 1 ? 's' : ''}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  {freshGrupo.pedidos.map(p => {
                    const freshP = pedidosConfirmados.find(fp => fp.id === p.id) || p;
                    const regs = getRegistrosPedido(p.id);
                    const tieneRepesaje = regs.some(r => r.tipo === 'repesada');
                    const tieneDevolucion = regs.some(r => r.tipo === 'devolucion');
                    const tieneEntrega = freshP.estado === 'Entregado';
                    const vivo = checkEsVivo(freshP);
                    return (
                      <div key={p.id} className="rounded-xl p-3" style={{ background: c.bgCardAlt, border: `1px solid ${c.border}` }}>
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold" style={{ color: c.text }}>{freshP.tipoAve}</span>
                            {freshP.variedad && <span className="text-[10px]" style={{ color: c.textMuted }}>({freshP.variedad})</span>}
                            <span className="font-mono text-[10px]" style={{ color: c.textMuted }}>{freshP.numeroPedido}</span>
                          </div>
                          <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ring-1 ring-current/20 ${getEstadoBadge(freshP.estado || 'En Despacho')}`}>
                            {freshP.estado}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-1.5 mb-1.5">
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400">{freshP.presentacion}</span>
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${vivo ? 'bg-amber-500/10 text-amber-400' : 'bg-purple-500/10 text-purple-400'}`}>
                            {vivo ? `${freshP.cantidadJabas || 0} jabas` : `${freshP.cantidad} unids.`}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${tieneRepesaje ? 'bg-blue-500/15 text-blue-400' : ''}`}
                            style={!tieneRepesaje ? { background: isDark ? '#1f2937' : '#e5e7eb', color: c.textMuted } : undefined}>
                            {tieneRepesaje ? '✓' : '✗'} Repesaje
                          </span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${tieneDevolucion ? 'bg-orange-500/15 text-orange-400' : ''}`}
                            style={!tieneDevolucion ? { background: isDark ? '#1f2937' : '#e5e7eb', color: c.textMuted } : undefined}>
                            {tieneDevolucion ? '✓' : '✗'} Devolución
                          </span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${tieneEntrega ? 'bg-green-500/15 text-green-400' : ''}`}
                            style={!tieneEntrega ? { background: isDark ? '#1f2937' : '#e5e7eb', color: c.textMuted } : undefined}>
                            {tieneEntrega ? '✓' : '✗'} Entrega
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Adiciones que se integrarán */}
                {(() => {
                  const adicionesModal = getAdicionesRegistradasParaGrupo(freshGrupo.grupoId);
                  if (adicionesModal.length === 0) return null;
                  const pesoTotalAd = adicionesModal.reduce((s, r) => s + (r.peso || 0), 0);
                  return (
                    <div className="bg-cyan-900/10 border border-cyan-500/20 rounded-xl p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <p className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest flex items-center gap-1.5">
                          <ArrowLeftRight className="w-3.5 h-3.5" /> Adiciones a integrar
                        </p>
                        <span className="text-sm font-black text-cyan-400">{pesoTotalAd.toFixed(1)} kg</span>
                      </div>
                      {adicionesModal.map(ad => (
                        <div key={ad.id} className="flex items-center justify-between text-[11px] rounded-lg px-2.5 py-1.5" style={{ background: isDark ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.04)' }}>
                          <span style={{ color: c.textSecondary }}>Desde <span className="text-cyan-300 font-bold">{ad.clienteOrigenNombre}</span> · {ad.cantidadUnidades} unids.</span>
                          <span className="font-bold" style={{ color: c.text }}>{(ad.peso || 0).toFixed(1)} kg</span>
                        </div>
                      ))}
                      <p className="text-[10px] italic" style={{ color: c.textMuted }}>Se sumarán como Adición Kg en Cartera de Cobro</p>
                    </div>
                  );
                })()}

                <div className="flex gap-3">
                  <button onClick={() => setShowConfirmEntregaTotal(false)}
                    className="flex-1 py-3 rounded-xl font-bold transition-colors"
                    style={{ color: c.textSecondary, background: isDark ? '#1f2937' : '#e5e7eb' }}>
                    Cancelar
                  </button>
                  <button onClick={() => { setShowConfirmEntregaTotal(false); handleConfirmarEntregaTotal(); }}
                    className="flex-1 py-3 rounded-xl font-black text-white transition-all hover:scale-[1.01]"
                    style={{ background: 'linear-gradient(135deg, #0d4a24, #166534, #22c55e)', boxShadow: '0 4px 15px -3px rgba(34,197,94,0.3)' }}>
                    Confirmar Entrega
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ═══════ MODAL: CONFIRMAR ENTREGA INDIVIDUAL ═══════ */}
      {confirmEntregaPedidoId && (() => {
        const pedidoToConfirm = pedidosConfirmados.find(p => p.id === confirmEntregaPedidoId);
        if (!pedidoToConfirm) return null;
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ background: c.bgModalOverlay }}>
            <div className="rounded-2xl max-w-sm w-full shadow-2xl animate-in fade-in zoom-in-95 duration-200" style={{ background: c.bgModal, border: `1px solid ${c.border}` }}>
              <div className="p-6 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-green-500/15 flex items-center justify-center">
                    <CheckCircle2 className="w-5 h-5 text-green-400" />
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold" style={{ color: c.text }}>Confirmar Entrega</h3>
                    <p className="text-xs" style={{ color: c.textMuted }}>{pedidoToConfirm.numeroPedido} · {pedidoToConfirm.tipoAve}</p>
                  </div>
                </div>
                <ProductInfoCard pedido={pedidoToConfirm} compact />
                <p className="text-sm" style={{ color: c.textSecondary }}>¿Confirmar la entrega de este pedido?</p>
                <div className="flex gap-3">
                  <button onClick={() => setConfirmEntregaPedidoId(null)}
                    className="flex-1 py-2.5 rounded-xl font-bold transition-colors text-sm"
                    style={{ color: c.textSecondary, background: isDark ? '#1f2937' : '#e5e7eb' }}>
                    Cancelar
                  </button>
                  <button onClick={() => { handleConfirmarEntregaPedido(pedidoToConfirm); setConfirmEntregaPedidoId(null); }}
                    className="flex-1 py-2.5 rounded-xl font-black text-white text-sm transition-all hover:scale-[1.01]"
                    style={{ background: 'linear-gradient(135deg, #0d4a24, #166534, #22c55e)' }}>
                    Confirmar
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
