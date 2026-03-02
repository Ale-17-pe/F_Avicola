import { useState, useEffect, useMemo } from "react";
import {
  Truck, Scale, RotateCcw, Camera, CheckCircle2, AlertTriangle,
  ArrowRight, ChevronRight, History, X, PackageCheck,
  FileText, User, MapPin, Clock, Weight, AlertCircle, Package, Calendar, Plus,
  ChevronDown, Layers, ArrowLeftRight, Hash, Minus, Eye,
} from "lucide-react";
import { useApp, PedidoConfirmado } from "../contexts/AppContext";
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
  const { pedidosConfirmados, clientes, updatePedidoConfirmado, addPedidoConfirmado } = useApp();

  // ── Vista ──
  const [modo, setModo] = useState<'LISTA' | 'GRUPO' | 'DETALLE' | 'REPESADA' | 'DEVOLUCION' | 'ADICION'>('LISTA');
  const [grupoSeleccionado, setGrupoSeleccionado] = useState<GrupoDespacho | null>(null);
  const [selectedPedido, setSelectedPedido] = useState<PedidoConfirmado | null>(null);

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
  const [adicionGrupoDestinoId, setAdicionGrupoDestinoId] = useState("");
  const [adicionCantidad, setAdicionCantidad] = useState("");
  const [adicionPeso, setAdicionPeso] = useState("");
  const [adicionFoto, setAdicionFoto] = useState("");

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
  const resetAdicion = () => { setAdicionStep('lista'); setAdicionSeleccionada(null); setAdicionGrupoDestinoId(""); setAdicionCantidad(""); setAdicionPeso(""); setAdicionFoto(""); };

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
  const handleFinishAdicion = () => {
    if (!adicionSeleccionada) return;
    const cantidad = parseInt(adicionCantidad);
    const peso = parseFloat(adicionPeso);
    if (!cantidad || cantidad <= 0 || cantidad > adicionSeleccionada.cantidadDisponible) {
      toast.error(`Cantidad inválida (máx. ${adicionSeleccionada.cantidadDisponible})`); return;
    }
    if (!peso || peso <= 0) { toast.error("Ingrese peso válido"); return; }
    if (!adicionFoto) { toast.error("Debe tomar foto de evidencia"); return; }
    if (!adicionGrupoDestinoId) { toast.error("Seleccione el cliente destino"); return; }

    const grupoDestino = gruposDespacho.find(g => g.grupoId === adicionGrupoDestinoId);
    if (!grupoDestino) { toast.error("Grupo destino no encontrado"); return; }

    // Crear registro de adición
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

    // Crear nuevo pedido para el cliente destino
    const nuevoPedidoId = `ADICION-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
    const numeroPedido = `AD-${grupoDestino.pedidos.length + 1}`;
    const nuevoPedido: PedidoConfirmado = {
      id: nuevoPedidoId,
      cliente: grupoDestino.cliente,
      tipoAve: adicionSeleccionada.tipoAve,
      variedad: adicionSeleccionada.variedad,
      presentacion: adicionSeleccionada.presentacion,
      cantidad: cantidad,
      contenedor: '',
      fecha: new Date().toISOString().split('T')[0],
      hora: new Date().toTimeString().slice(0, 5),
      prioridad: 999,
      numeroPedido,
      estado: 'Confirmado con Adición',
      pesoBrutoTotal: peso,
      pesoNetoTotal: peso,
      pesoKg: peso,
      grupoDespacho: grupoDestino.grupoId,
      conductor: grupoDestino.conductor,
      zonaEntrega: grupoDestino.zonaEntrega,
      numeroTicket: grupoDestino.numeroTicket,
      ultimaIncidencia: `Adición desde ${adicionSeleccionada.clienteOrigen} (${adicionSeleccionada.pedidoNumero})`,
    };

    addPedidoConfirmado(nuevoPedido);
    toast.success(`Adición creada: ${cantidad} unids. de ${adicionSeleccionada.tipoAve} → ${grupoDestino.cliente}`);
    setModo('LISTA'); resetAdicion();
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
      <div className={`bg-black/40 border border-gray-800/80 rounded-xl ${compact ? 'p-3' : 'p-4'}`}>
        <div className="flex items-start justify-between mb-2">
          <div className="min-w-0 flex-1">
            <h3 className={`font-black text-white leading-tight ${compact ? 'text-sm' : 'text-base'}`}>
              {pedido.tipoAve}
            </h3>
            {pedido.variedad && (
              <p className="text-[11px] text-gray-400 mt-0.5">{pedido.variedad}</p>
            )}
          </div>
          <span className="font-mono text-[10px] text-gray-500 bg-gray-800/80 px-2 py-0.5 rounded shrink-0 ml-2">
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
        <div className="flex flex-wrap items-center gap-3 text-[11px] text-gray-500">
          <span className="flex items-center gap-1">
            <Weight className="w-3 h-3" />
            <span className="text-white font-bold">{(pedido.pesoBrutoTotal || 0).toFixed(1)} kg</span> bruto
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
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Truck className="text-emerald-400" /> Gestión de Entregas
          </h1>
          <p className="text-gray-400 text-sm">Control de ruta, repesajes y devoluciones</p>
        </div>
        {modo !== 'LISTA' && (
          <button
            onClick={() => {
              if (modo === 'DETALLE') { setModo('GRUPO'); setSelectedPedido(null); }
              else if (modo === 'GRUPO') { setModo('LISTA'); setGrupoSeleccionado(null); setExpandedPedidos(new Set()); }
              else if (modo === 'ADICION') { setModo('LISTA'); resetAdicion(); }
              else { setModo('GRUPO'); setSelectedPedido(null); resetRepesaje(); resetDevolucion(); }
            }}
            className="px-4 py-2 bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors flex items-center gap-2"
          >
            <ArrowRight className="w-4 h-4 rotate-180" /> Volver
          </button>
        )}
      </div>

      {/* ═══════ LISTA DE DESPACHOS ═══════ */}
      {modo === 'LISTA' && (
        <div className="space-y-5">
          {/* Botón global de Adición */}
          {devolucionesDisponibles.length > 0 && (
            <button
              onClick={() => { resetAdicion(); setModo('ADICION'); }}
              className="w-full py-3.5 rounded-xl font-bold text-white text-sm transition-all hover:scale-[1.01] flex items-center justify-center gap-3 relative overflow-hidden group"
              style={{ background: 'linear-gradient(135deg, #0d3d4a, #164e63, #06b6d4)', boxShadow: '0 6px 20px -5px rgba(6,182,212,0.35)' }}
            >
              <ArrowLeftRight className="w-5 h-5" />
              ADICIONES DISPONIBLES
              <span className="ml-1 bg-white/20 text-white text-xs font-black px-2 py-0.5 rounded-full">{devolucionesDisponibles.length}</span>
            </button>
          )}

          {gruposDespacho.length > 0 && (
            <div className="flex items-center justify-between bg-gray-900/60 border border-gray-800 rounded-xl px-5 py-3">
              <span className="text-sm text-gray-400 flex items-center gap-2">
                <Package className="w-4 h-4 text-emerald-400" />
                <span className="text-white font-semibold">{gruposDespacho.length}</span> despacho{gruposDespacho.length !== 1 && 's'} en ruta
              </span>
              <span className="text-xs text-gray-600 hidden sm:block">Toque un despacho para gestionar</span>
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
                  className={`group relative bg-gray-900/80 border border-gray-800/80 rounded-xl overflow-hidden cursor-pointer
                    hover:border-gray-700 hover:shadow-lg hover:shadow-black/30 transition-all duration-200
                    border-l-[3px] ${getAccentColor(grupo)}`}
                >
                  <div className="p-5">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex flex-wrap items-center gap-2">
                        {grupo.numeroTicket && (
                          <span className="font-mono text-[11px] text-white bg-emerald-400/10 border border-emerald-500/30 px-2 py-0.5 rounded-md">
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
                    <h3 className="text-white font-bold text-base leading-tight mb-3 group-hover:text-emerald-50 transition-colors">
                      {grupo.cliente}
                    </h3>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-[13px]">
                      <div className="flex items-center gap-1.5 text-gray-400">
                        <Layers className="w-3.5 h-3.5 text-gray-600 shrink-0" />
                        <span>{grupo.pedidos.length} pedido{grupo.pedidos.length > 1 ? 's' : ''}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-gray-400">
                        <Weight className="w-3.5 h-3.5 text-gray-600 shrink-0" />
                        <span className="font-semibold text-gray-300">{grupo.pesoBrutoTotal.toFixed(1)} kg bruto</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-gray-400">
                        <MapPin className="w-3.5 h-3.5 text-gray-600 shrink-0" />
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
          <div className="bg-gray-900/90 border border-gray-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="h-1 w-full bg-emerald-500" />
            <div className="p-6">
              <div className="flex flex-col sm:flex-row justify-between items-start gap-5 mb-5">
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] text-white font-mono uppercase tracking-[0.15em] mb-1">Despacho Consolidado</p>
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-white leading-tight truncate">{grupoSeleccionado.cliente}</h2>
                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    {grupoSeleccionado.numeroTicket && (
                      <span className="font-mono text-xs text-white bg-emerald-500/10 border border-emerald-500/40 px-2 py-0.5 rounded-md">
                        {grupoSeleccionado.numeroTicket}
                      </span>
                    )}
                    <span className="text-xs text-gray-500">{grupoSeleccionado.conductor}</span>
                    <span className="text-xs text-gray-600">·</span>
                    <span className="text-xs text-gray-500">{grupoSeleccionado.zonaEntrega}</span>
                  </div>
                </div>
                <div className="bg-black/40 border border-gray-700/50 rounded-xl px-5 py-3 text-center">
                  <p className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold mb-0.5">Bruto Total</p>
                  <div className="text-2xl font-black text-white tabular-nums">
                    {grupoSeleccionado.pesoBrutoTotal.toFixed(1)}<span className="text-xs text-gray-500 font-normal ml-0.5">kg</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setShowConfirmEntregaTotal(true)}
                className="w-full py-3.5 rounded-xl font-black text-white text-base transition-all hover:scale-[1.01] flex items-center justify-center gap-2 mb-3"
                style={{ background: 'linear-gradient(135deg, #0d4a24, #166534, #22c55e)', boxShadow: '0 6px 20px -5px rgba(34,197,94,0.35)' }}
              >
                <CheckCircle2 className="w-5 h-5" /> CONFIRMAR ENTREGA TOTAL
              </button>
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
                    background: 'rgba(0, 0, 0, 0.3)',
                    border: pedidoCompletado ? '1px solid rgba(34, 197, 94, 0.3)' : '1px solid rgba(255, 255, 255, 0.08)',
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
                            <span className="text-sm font-bold text-white">{freshP.tipoAve}</span>
                            {freshP.variedad && <span className="text-[10px] text-gray-500">({freshP.variedad})</span>}
                            <span className="font-mono text-[10px] text-gray-500">{freshP.numeroPedido}</span>
                            <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ring-1 ring-current/20 ${getEstadoBadge(freshP.estado || 'En Despacho')}`}>
                              {freshP.estado}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                            <span className="text-[10px] text-gray-500">{freshP.presentacion}</span>
                            <span className="text-[10px] text-gray-600">·</span>
                            <span className={`text-[10px] font-bold ${vivo ? 'text-amber-400' : 'text-purple-400'}`}>
                              {vivo ? `${freshP.cantidadJabas || 0} jabas` : `${freshP.cantidad} unids.`}
                            </span>
                            <span className="text-[10px] text-gray-600">·</span>
                            <span className="text-[10px] font-bold text-white">{(freshP.pesoBrutoTotal || 0).toFixed(1)} kg</span>
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); toggleExpand(); }}
                        className="p-2 rounded-lg transition-all hover:scale-105 shrink-0"
                        style={{ background: 'rgba(255, 255, 255, 0.06)', border: '1px solid rgba(255, 255, 255, 0.1)' }}
                      >
                        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                      </button>
                    </div>
                  </div>

                  {/* Contenido expandido */}
                  {isExpanded && (
                    <div className="px-4 pb-4 pt-2" style={{ borderTop: '1px solid rgba(255, 255, 255, 0.06)' }}>

                      {/* Info de producto concisa */}
                      <ProductInfoCard pedido={freshP} compact />

                      {/* Registros existentes */}
                      {regs.length > 0 && (
                        <div className="space-y-2 mt-3 mb-3">
                          {regs.slice(0, 3).map(reg => (
                            <div key={reg.id} className="flex items-center justify-between px-3 py-2 rounded-lg"
                              style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.03)' }}>
                              <div className="flex items-center gap-2">
                                {getTipoIcon(reg.tipo)}
                                <span className="text-xs font-bold text-white">{getTipoLabel(reg.tipo, reg.id)}</span>
                                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${getEstadoColor(reg.estado)}`}>{reg.estado}</span>
                              </div>
                              <div className="flex items-center gap-2 text-[10px] text-gray-500">
                                {reg.cantidadUnidades && <span className="text-orange-300">{reg.cantidadUnidades} unids.</span>}
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
        </div>
      )}

      {/* ═══════ DETALLE INDIVIDUAL (timeline completo) ═══════ */}
      {modo === 'DETALLE' && selectedPedido && (() => {
        const freshSP = pedidosConfirmados.find(p => p.id === selectedPedido.id) || selectedPedido;
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="bg-gray-900/90 border border-gray-800 rounded-2xl overflow-hidden shadow-xl">
              <div className={`h-1 w-full ${freshSP.estado === 'Devolución' ? 'bg-red-500' :
                freshSP.estado === 'Con Incidencia' ? 'bg-amber-500' : 'bg-emerald-500'
                }`} />
              <div className="p-6">
                <p className="text-[11px] text-emerald-400/70 font-mono uppercase tracking-[0.15em] mb-3">Detalle del Pedido</p>
                <ProductInfoCard pedido={freshSP} />

                <div className={`mt-4 flex items-center gap-3 bg-gray-800/40 border border-gray-700/40 rounded-xl px-4 py-3`}>
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${freshSP.estado === 'Devolución' ? 'bg-red-500/15' :
                    freshSP.estado === 'Con Incidencia' ? 'bg-amber-500/15' : 'bg-emerald-500/15'
                    }`}>
                    {freshSP.estado === 'Devolución' ? <RotateCcw className="w-4 h-4 text-red-400" /> :
                      freshSP.estado === 'Con Incidencia' ? <AlertCircle className="w-4 h-4 text-amber-400" /> :
                        <Truck className="w-4 h-4 text-emerald-400" />}
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-500 uppercase tracking-wider">Estado</p>
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
              <h3 className="text-base font-bold text-white flex items-center gap-2 px-1">
                <History className="w-4 h-4 text-gray-500" /> Registro de Movimientos
              </h3>
              {getRegistrosPedido(selectedPedido.id).length === 0 ? (
                <div className="bg-gray-900/30 border border-dashed border-gray-800 rounded-xl p-14 text-center">
                  <History className="w-10 h-10 mx-auto mb-3 text-gray-700" />
                  <p className="text-gray-500 text-sm">Sin movimientos registrados</p>
                </div>
              ) : (
                <div className="relative pl-6">
                  <div className="absolute left-[10px] top-2 bottom-2 w-px bg-gray-800" />
                  <div className="space-y-4">
                    {getRegistrosPedido(selectedPedido.id).map(reg => (
                      <div key={reg.id} className="relative">
                        <div className={`absolute -left-6 top-5 w-[9px] h-[9px] rounded-full ring-2 ring-gray-900 z-10 ${reg.tipo === 'repesada' ? 'bg-blue-400' :
                          reg.tipo === 'devolucion' ? 'bg-orange-400' :
                            (reg.tipo === 'adicion' || reg.tipo === 'asignacion') ? 'bg-teal-400' :
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
                            {reg.cantidadUnidades && (
                              <div className="flex items-center gap-2 text-sm text-gray-300">
                                <Hash className="w-4 h-4 text-gray-600" />Cantidad: <span className="text-white font-bold">{reg.cantidadUnidades} unids.</span>
                              </div>
                            )}
                            {reg.peso && (
                              <div className="flex items-center gap-2 text-sm text-gray-300">
                                <Weight className="w-4 h-4 text-gray-600" />Peso: <span className="text-white font-bold">{reg.peso.toFixed(1)} kg</span>
                              </div>
                            )}
                            {reg.motivo && (
                              <p className="text-sm text-orange-300 bg-orange-900/15 border border-orange-500/15 px-3 py-1.5 rounded-lg">"{reg.motivo}"</p>
                            )}
                            {reg.clienteDestinoNombre && (
                              <div className="flex items-center gap-2 text-sm text-gray-300">
                                <User className="w-4 h-4 text-gray-600" />Destino: <span className="text-teal-400 font-bold">{reg.clienteDestinoNombre}</span>
                              </div>
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
            <div className="bg-gray-900/90 border border-gray-800 rounded-2xl overflow-hidden shadow-xl">
              <div className="h-1 w-full bg-blue-500" />
              <div className="p-5 space-y-4">

                {/* Header */}
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/15 flex items-center justify-center shrink-0">
                    <Scale className="w-5 h-5 text-blue-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="text-lg font-extrabold text-white uppercase tracking-tight">Repesaje</h2>
                    <p className="text-[11px] text-gray-500">{freshP.cliente} · {freshP.numeroPedido}</p>
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
                      <p className="text-[11px] text-gray-400">
                        {freshP.cantidadJabas || 0} jabas · {freshP.unidadesPorJaba || 0} aves/jaba ·{' '}
                        {(freshP.cantidadJabas || 0) * (freshP.unidadesPorJaba || 0)} aves total
                      </p>
                    </div>
                  </div>
                )}

                {/* Peso original vs acumulado */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-gray-800/40 border border-gray-700/40 rounded-xl p-3 text-center">
                    <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider mb-0.5">Peso Original</p>
                    <p className="text-xl font-black text-gray-300 tabular-nums">{pesoOriginal.toFixed(1)}<span className="text-xs text-gray-500 ml-0.5">kg</span></p>
                  </div>
                  <div className={`border rounded-xl p-3 text-center ${pesoAcumulado > 0
                    ? (Math.abs(diferencia) <= 0.5 ? 'bg-green-900/15 border-green-500/25' : 'bg-amber-900/15 border-amber-500/25')
                    : 'bg-blue-900/15 border-blue-500/25'
                    }`}>
                    <p className="text-[10px] text-blue-400 uppercase font-bold tracking-wider mb-0.5">Repesaje Total</p>
                    <p className="text-xl font-black text-white tabular-nums">{pesoAcumulado.toFixed(1)}<span className="text-xs text-gray-500 ml-0.5">kg</span></p>
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
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">
                      Peso de esta tanda (kg) <span className="text-red-400">*</span>
                    </label>
                    <div className="relative">
                      <input type="number" inputMode="decimal" step="0.1" min="0" value={formWeight}
                        onChange={(e) => setFormWeight(e.target.value)} placeholder="0.0"
                        className="w-full bg-gray-950 border-2 border-gray-800 rounded-xl px-4 py-4 text-white text-3xl font-black focus:outline-none focus:border-blue-500 transition-all pr-12 shadow-inner" />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold text-lg">kg</span>
                    </div>
                  </div>
                  <button onClick={() => handleCapturePhoto(setCapturedPhoto)}
                    className={`w-full h-14 border-2 rounded-xl flex items-center justify-center gap-3 transition-all font-black text-base active:scale-95 ${capturedPhoto
                      ? 'bg-emerald-900/30 border-emerald-500 text-emerald-400'
                      : 'bg-gray-800 border-gray-600 text-white hover:bg-gray-700 hover:border-amber-500/50'
                      }`}>
                    <Camera className={`w-5 h-5 ${capturedPhoto ? 'text-emerald-400' : 'text-amber-400'}`} />
                    {capturedPhoto ? '✓ FOTO LISTA' : 'TOMAR FOTO'}
                  </button>
                </div>

                {/* Preview foto */}
                {capturedPhoto && (
                  <div className="flex items-center gap-3 p-2 bg-black/30 border border-gray-800/70 rounded-xl">
                    <div className="w-14 h-14 rounded-lg overflow-hidden border border-gray-700 shrink-0">
                      <img src={capturedPhoto} alt="" className="w-full h-full object-cover" />
                    </div>
                    <p className="text-xs text-gray-500 flex-1">Foto de evidencia capturada</p>
                    <button onClick={() => setCapturedPhoto("")} className="p-1 bg-red-500/20 rounded-full"><X className="w-3 h-3 text-red-400" /></button>
                  </div>
                )}

                {/* Botón sumar tanda */}
                <button onClick={handleAddTanda}
                  disabled={!formWeight || !capturedPhoto}
                  className="w-full py-4 border-2 rounded-xl font-black text-lg flex items-center justify-center gap-3 transition-all active:scale-[0.98] disabled:opacity-30 disabled:grayscale bg-blue-600/90 border-blue-400/60 text-white hover:bg-blue-500/90">
                  <Plus className="w-6 h-6" /> SUMAR TANDA
                </button>

                {/* Lista de tandas */}
                {tandasRepesaje.length > 0 && (
                  <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Tandas ({tandasRepesaje.length})</p>
                      <button onClick={handleQuitarUltimaTanda} className="text-[10px] text-red-400/70 hover:text-red-400 font-bold flex items-center gap-1">
                        <Minus className="w-3 h-3" /> Quitar última
                      </button>
                    </div>
                    <div className="space-y-1.5 max-h-48 overflow-y-auto">
                      {tandasRepesaje.map((t, i) => (
                        <div key={i} className="flex items-center justify-between bg-black/40 border border-gray-700/50 rounded-lg p-2.5">
                          <div className="flex items-center gap-2">
                            <div className="w-9 h-9 rounded-lg overflow-hidden border border-gray-600/50 shrink-0">
                              <img src={t.foto} className="w-full h-full object-cover" />
                            </div>
                            <span className="text-white font-bold text-sm">Tanda {t.numero}</span>
                          </div>
                          <span className="text-lg font-black text-blue-400 tabular-nums">{t.peso.toFixed(1)} kg</span>
                        </div>
                      ))}
                    </div>
                    <div className="bg-blue-900/25 border border-blue-500/30 rounded-xl p-3 flex justify-between items-center">
                      <span className="text-white font-extrabold text-sm uppercase tracking-wider">Total Repesaje</span>
                      <span className="text-2xl font-black text-white tabular-nums">{pesoAcumulado.toFixed(1)} kg</span>
                    </div>
                  </div>
                )}

                {/* Finalizar */}
                <button onClick={handleFinishRepesaje}
                  disabled={tandasRepesaje.length === 0}
                  className={`w-full py-4 rounded-xl font-extrabold text-lg shadow-xl transition-all flex items-center justify-center gap-3 active:scale-[0.98] ${tandasRepesaje.length > 0 ? 'bg-emerald-600 hover:bg-emerald-500 text-white' : 'bg-gray-800 text-gray-500 cursor-not-allowed opacity-50'
                    }`}>
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
            <div className="bg-gray-900/90 border border-gray-800 rounded-2xl overflow-hidden shadow-xl">
              <div className="h-1 w-full bg-orange-500" />
              <div className="p-5 space-y-4">

                {/* Header */}
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-orange-500/15 flex items-center justify-center shrink-0">
                    <RotateCcw className="w-5 h-5 text-orange-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="text-lg font-extrabold text-white uppercase tracking-tight">
                      {devStep === 'datos' ? 'Registrar Devolución' : 'Motivo de Devolución'}
                    </h2>
                    <p className="text-[11px] text-gray-500">{freshP.cliente} · {freshP.numeroPedido}</p>
                  </div>
                </div>

                {/* Info del producto */}
                <ProductInfoCard pedido={freshP} compact />

                {/* Aviso: devoluciones siempre en unidades */}
                {vivo && (
                  <div className="bg-orange-500/8 border border-orange-500/20 rounded-xl p-3 flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 text-orange-400 shrink-0" />
                    <p className="text-[11px] text-orange-300">
                      <span className="font-bold">Importante:</span> Aunque el despacho es en jabas, la devolución se registra en <span className="font-bold text-white">unidades</span>.
                    </p>
                  </div>
                )}

                {devStep === 'datos' ? (
                  <>
                    {/* Cantidad + Peso */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">
                          Cantidad (unids.) <span className="text-red-400">*</span>
                        </label>
                        <input type="number" inputMode="numeric" min="1" value={devCantidad}
                          onChange={(e) => setDevCantidad(e.target.value)} placeholder="0"
                          className="w-full bg-gray-950 border-2 border-gray-800 rounded-xl px-4 py-3.5 text-white text-2xl font-black focus:outline-none focus:border-orange-500 transition-all text-center" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">
                          Peso (kg) <span className="text-red-400">*</span>
                        </label>
                        <div className="relative">
                          <input type="number" inputMode="decimal" step="0.1" min="0" value={devPeso}
                            onChange={(e) => setDevPeso(e.target.value)} placeholder="0.0"
                            className="w-full bg-gray-950 border-2 border-gray-800 rounded-xl px-4 py-3.5 text-white text-2xl font-black focus:outline-none focus:border-orange-500 transition-all text-center pr-10" />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 font-bold text-sm">kg</span>
                        </div>
                      </div>
                    </div>

                    {/* Foto */}
                    <div>
                      <label className="block text-[10px] font-bold text-orange-400 uppercase tracking-widest mb-1.5">Foto de Evidencia <span className="text-red-400">*</span></label>
                      <button onClick={() => handleCapturePhoto(setDevFoto)}
                        className={`w-full h-14 border-2 rounded-xl flex items-center justify-center gap-3 transition-all font-black text-base active:scale-95 ${devFoto
                          ? 'bg-emerald-900/30 border-emerald-500 text-emerald-400'
                          : 'bg-gray-800 border-gray-600 text-white hover:bg-gray-700 hover:border-orange-500/50'
                          }`}>
                        <Camera className={`w-5 h-5 ${devFoto ? 'text-emerald-400' : 'text-orange-400'}`} />
                        {devFoto ? '✓ FOTO LISTA' : 'TOMAR FOTO'}
                      </button>
                    </div>

                    {/* Preview foto */}
                    {devFoto && (
                      <div className="flex items-center gap-3 p-2 bg-black/30 border border-gray-800/70 rounded-xl">
                        <div className="w-14 h-14 rounded-lg overflow-hidden border border-gray-700 shrink-0">
                          <img src={devFoto} alt="" className="w-full h-full object-cover" />
                        </div>
                        <p className="text-xs text-gray-500 flex-1">Foto de evidencia</p>
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
                      className={`w-full py-4 rounded-xl font-extrabold text-lg shadow-xl transition-all flex items-center justify-center gap-3 active:scale-[0.98] ${devCantidad && devPeso && devFoto
                        ? 'bg-orange-600 hover:bg-orange-500 text-white'
                        : 'bg-gray-800 text-gray-500 cursor-not-allowed opacity-50'
                        }`}>
                      <ArrowRight className="w-5 h-5" /> CONTINUAR
                    </button>
                  </>
                ) : (
                  <>
                    {/* Resumen de datos */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-orange-900/15 border border-orange-500/25 rounded-xl p-3 text-center">
                        <p className="text-[10px] text-orange-400 uppercase font-bold">Cantidad</p>
                        <p className="text-xl font-black text-white">{devCantidad} <span className="text-xs text-gray-500">unids.</span></p>
                      </div>
                      <div className="bg-orange-900/15 border border-orange-500/25 rounded-xl p-3 text-center">
                        <p className="text-[10px] text-orange-400 uppercase font-bold">Peso</p>
                        <p className="text-xl font-black text-white">{parseFloat(devPeso).toFixed(1)} <span className="text-xs text-gray-500">kg</span></p>
                      </div>
                    </div>

                    {/* Motivo */}
                    <div>
                      <label className="block text-sm font-bold text-orange-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                        <AlertCircle className="w-4 h-4" /> Motivo <span className="text-red-400">*</span>
                      </label>
                      <textarea value={devMotivo} autoFocus onChange={(e) => setDevMotivo(e.target.value)}
                        className="w-full bg-black/50 border border-gray-700 rounded-xl px-4 py-3 text-white text-base focus:outline-none focus:border-orange-500 transition-all h-28 resize-none placeholder:text-gray-600"
                        placeholder="Ej: Producto dañado, cliente no aceptó..." maxLength={200} />
                      <div className="flex justify-between items-center mt-1.5">
                        <button onClick={() => setDevStep('datos')} className="text-xs text-orange-400/50 hover:text-orange-400 font-bold uppercase underline transition-colors">
                          Volver a datos
                        </button>
                        <p className="text-[10px] text-gray-500 font-mono tabular-nums">{devMotivo.length}/200</p>
                      </div>
                    </div>

                    {/* Confirmar */}
                    <button onClick={handleFinishDevolucion}
                      disabled={devMotivo.length < 3}
                      className={`w-full py-5 rounded-xl font-extrabold text-xl shadow-xl transition-all flex items-center justify-center gap-3 active:scale-[0.98] ${devMotivo.length >= 3
                        ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                        : 'bg-gray-800 text-gray-500 cursor-not-allowed opacity-50'
                        }`}>
                      <CheckCircle2 className="w-6 h-6" /> CONFIRMAR DEVOLUCIÓN
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        );
      })()}

      {/* ═══════ MÓDULO DE ADICIÓN (INDEPENDIENTE) ═══════ */}
      {modo === 'ADICION' && (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-300">

          {adicionStep === 'lista' ? (
            /* ── Lista de devoluciones disponibles ── */
            <div className="space-y-4">
              <div className="bg-gray-900/90 border border-gray-800 rounded-2xl overflow-hidden shadow-xl">
                <div className="h-1 w-full bg-cyan-500" />
                <div className="p-5">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-cyan-500/15 flex items-center justify-center shrink-0">
                      <ArrowLeftRight className="w-5 h-5 text-cyan-400" />
                    </div>
                    <div>
                      <h2 className="text-lg font-extrabold text-white uppercase tracking-tight">Adiciones Disponibles</h2>
                      <p className="text-[11px] text-gray-500">Productos devueltos que pueden ofrecerse a otros clientes</p>
                    </div>
                  </div>

                  {devolucionesDisponibles.length === 0 ? (
                    <div className="bg-gray-900/30 border border-dashed border-gray-800 rounded-xl p-12 text-center">
                      <ArrowLeftRight className="w-10 h-10 mx-auto mb-3 text-gray-700" />
                      <p className="text-gray-500 text-sm">No hay productos disponibles para adición</p>
                      <p className="text-[11px] text-gray-600 mt-1">Las adiciones aparecerán cuando se registren devoluciones</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {devolucionesDisponibles.map(dev => (
                        <div key={dev.registroId}
                          className="bg-black/30 border border-gray-800 rounded-xl p-4 hover:border-cyan-500/30 transition-all cursor-pointer active:scale-[0.99]"
                          onClick={() => { setAdicionSeleccionada(dev); setAdicionStep('formulario'); }}
                        >
                          {/* Origen */}
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-[10px] font-bold text-white uppercase bg-cyan-500/15 px-2 py-0.5 rounded-full border border-cyan-500/30">
  Dev. de {dev.clienteOrigen}
</span>
                            <span className="font-mono text-[10px] text-gray-500">{dev.pedidoNumero}</span>
                          </div>

                          {/* Info producto */}
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0 flex-1">
                              <h4 className="text-sm font-bold text-white">{dev.tipoAve}</h4>
                              {dev.variedad && <p className="text-[10px] text-gray-500">{dev.variedad}</p>}
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
                              <p className="text-xs text-gray-500 uppercase font-bold">Disponible</p>
                              <p className="text-lg font-black text-cyan-400">{dev.cantidadDisponible} <span className="text-xs text-gray-500">unids.</span></p>
                              <p className="text-sm font-bold text-white">{dev.pesoDisponible.toFixed(1)} kg</p>
                            </div>
                          </div>

                          <div className="flex items-center justify-end mt-2">
                            <span className="text-[10px] text-white font-bold flex items-center gap-1">
                              Seleccionar <ChevronRight className="w-3 h-3" />
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : adicionSeleccionada && (
            /* ── Formulario de Adición ── */
            <div className="bg-gray-900/90 border border-gray-800 rounded-2xl overflow-hidden shadow-xl">
              <div className="h-1 w-full bg-cyan-500" />
              <div className="p-5 space-y-4">

                {/* Header */}
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-cyan-500/15 flex items-center justify-center shrink-0">
                    <ArrowLeftRight className="w-5 h-5 text-cyan-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="text-lg font-extrabold text-white uppercase tracking-tight">Confirmar Adición</h2>
                    <p className="text-[11px] text-gray-500">Asignar producto devuelto a otro cliente</p>
                  </div>
                  <button onClick={() => setAdicionStep('lista')} className="p-1.5 text-gray-600 hover:text-white transition-colors rounded-lg hover:bg-gray-800">
                    <ArrowRight className="w-4 h-4 rotate-180" />
                  </button>
                </div>

                {/* Origen del producto */}
                <div className="bg-cyan-900/10 border border-cyan-500/20 rounded-xl p-4">
                  <p className="text-[10px] font-bold text-white uppercase tracking-widest mb-2">Producto de Devolución</p>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <h4 className="text-base font-black text-white">{adicionSeleccionada.tipoAve}</h4>
                      {adicionSeleccionada.variedad && <p className="text-[11px] text-gray-400">{adicionSeleccionada.variedad}</p>}
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
                      <p className="text-[11px] text-gray-500 mt-1.5">
                        <span className="text-gray-400">Origen:</span> {adicionSeleccionada.clienteOrigen} · {adicionSeleccionada.pedidoNumero}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-[10px] text-cyan-400 uppercase font-bold">Disponible</p>
                      <p className="text-xl font-black text-cyan-400">{adicionSeleccionada.cantidadDisponible}</p>
                      <p className="text-xs text-gray-400">{adicionSeleccionada.pesoDisponible.toFixed(1)} kg</p>
                    </div>
                  </div>
                </div>

                {/* Selector de cliente destino */}
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">
                    Cliente Destino <span className="text-red-400">*</span>
                  </label>
                  <select value={adicionGrupoDestinoId} onChange={(e) => setAdicionGrupoDestinoId(e.target.value)}
                    className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-500 transition-all">
                    <option value="">-- Seleccionar cliente --</option>
                    {gruposDespacho
                      .filter(g => g.cliente !== adicionSeleccionada.clienteOrigen && !g.todosEntregados)
                      .map(g => (
                        <option key={g.grupoId} value={g.grupoId}>{g.cliente} ({g.zonaEntrega || 'S/Z'})</option>
                      ))
                    }
                  </select>
                </div>

                {/* Cantidad + Peso */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">
                      Cantidad (unids.) <span className="text-red-400">*</span>
                    </label>
                    <input type="number" inputMode="numeric" min="1" max={adicionSeleccionada.cantidadDisponible}
                      value={adicionCantidad} onChange={(e) => setAdicionCantidad(e.target.value)}
                      placeholder={`Máx. ${adicionSeleccionada.cantidadDisponible}`}
                      className="w-full bg-gray-950 border-2 border-gray-800 rounded-xl px-4 py-3.5 text-white text-2xl font-black focus:outline-none focus:border-cyan-500 transition-all text-center" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">
                      Peso (kg) <span className="text-red-400">*</span>
                    </label>
                    <div className="relative">
                      <input type="number" inputMode="decimal" step="0.1" min="0"
                        value={adicionPeso} onChange={(e) => setAdicionPeso(e.target.value)} placeholder="0.0"
                        className="w-full bg-gray-950 border-2 border-gray-800 rounded-xl px-4 py-3.5 text-white text-2xl font-black focus:outline-none focus:border-cyan-500 transition-all text-center pr-10" />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 font-bold text-sm">kg</span>
                    </div>
                  </div>
                </div>

                {/* Foto */}
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">Foto de Evidencia <span className="text-red-400">*</span></label>
                  <button onClick={() => handleCapturePhoto(setAdicionFoto)}
                    className={`w-full h-14 border-2 rounded-xl flex items-center justify-center gap-3 transition-all font-black text-base active:scale-95 ${adicionFoto
                      ? 'bg-emerald-900/30 border-emerald-500 text-emerald-400'
                      : 'bg-gray-800 border-gray-600 text-white hover:bg-gray-700 hover:border-cyan-500/50'
                      }`}>
                    <Camera className={`w-5 h-5 ${adicionFoto ? 'text-emerald-400' : 'text-cyan-400'}`} />
                    {adicionFoto ? '✓ FOTO LISTA' : 'TOMAR FOTO'}
                  </button>
                </div>

                {adicionFoto && (
                  <div className="flex items-center gap-3 p-2 bg-black/30 border border-gray-800/70 rounded-xl">
                    <div className="w-14 h-14 rounded-lg overflow-hidden border border-gray-700 shrink-0">
                      <img src={adicionFoto} alt="" className="w-full h-full object-cover" />
                    </div>
                    <p className="text-xs text-gray-500 flex-1">Foto de evidencia</p>
                    <button onClick={() => setAdicionFoto("")} className="p-1 bg-red-500/20 rounded-full"><X className="w-3 h-3 text-red-400" /></button>
                  </div>
                )}

                {/* Confirmar */}
                <button onClick={handleFinishAdicion}
                  disabled={!adicionGrupoDestinoId || !adicionCantidad || !adicionPeso || !adicionFoto}
                  className={`w-full py-5 rounded-xl font-extrabold text-xl shadow-xl transition-all flex items-center justify-center gap-3 active:scale-[0.98] ${adicionGrupoDestinoId && adicionCantidad && adicionPeso && adicionFoto
                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                    : 'bg-gray-800 text-gray-500 cursor-not-allowed opacity-50'
                    }`}>
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
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ background: 'rgba(0,0,0,0.75)' }}>
            <div className="bg-gray-900 border border-gray-700 rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl animate-in fade-in zoom-in-95 duration-200">
              <div className="p-6 space-y-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-green-500/15 flex items-center justify-center">
                    <CheckCircle2 className="w-5 h-5 text-green-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-extrabold text-white">Confirmar Entrega Total</h3>
                    <p className="text-xs text-gray-500">{freshGrupo.cliente} · {freshGrupo.pedidos.length} pedido{freshGrupo.pedidos.length > 1 ? 's' : ''}</p>
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
                      <div key={p.id} className="bg-black/30 border border-gray-800 rounded-xl p-3">
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-white">{freshP.tipoAve}</span>
                            {freshP.variedad && <span className="text-[10px] text-gray-500">({freshP.variedad})</span>}
                            <span className="font-mono text-[10px] text-gray-500">{freshP.numeroPedido}</span>
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
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${tieneRepesaje ? 'bg-blue-500/15 text-blue-400' : 'bg-gray-800 text-gray-600'}`}>
                            {tieneRepesaje ? '✓' : '✗'} Repesaje
                          </span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${tieneDevolucion ? 'bg-orange-500/15 text-orange-400' : 'bg-gray-800 text-gray-600'}`}>
                            {tieneDevolucion ? '✓' : '✗'} Devolución
                          </span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${tieneEntrega ? 'bg-green-500/15 text-green-400' : 'bg-gray-800 text-gray-600'}`}>
                            {tieneEntrega ? '✓' : '✗'} Entrega
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="flex gap-3">
                  <button onClick={() => setShowConfirmEntregaTotal(false)}
                    className="flex-1 py-3 rounded-xl font-bold text-gray-400 bg-gray-800 hover:bg-gray-700 transition-colors">
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
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ background: 'rgba(0,0,0,0.75)' }}>
            <div className="bg-gray-900 border border-gray-700 rounded-2xl max-w-sm w-full shadow-2xl animate-in fade-in zoom-in-95 duration-200">
              <div className="p-6 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-green-500/15 flex items-center justify-center">
                    <CheckCircle2 className="w-5 h-5 text-green-400" />
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-white">Confirmar Entrega</h3>
                    <p className="text-xs text-gray-500">{pedidoToConfirm.numeroPedido} · {pedidoToConfirm.tipoAve}</p>
                  </div>
                </div>
                <ProductInfoCard pedido={pedidoToConfirm} compact />
                <p className="text-sm text-gray-400">¿Confirmar la entrega de este pedido?</p>
                <div className="flex gap-3">
                  <button onClick={() => setConfirmEntregaPedidoId(null)}
                    className="flex-1 py-2.5 rounded-xl font-bold text-gray-400 bg-gray-800 hover:bg-gray-700 transition-colors text-sm">
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
