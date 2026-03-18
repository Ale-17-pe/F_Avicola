import { useState, useEffect, useMemo } from "react";
import {
  Truck, Scale, RotateCcw, Camera, CheckCircle2, AlertTriangle,
  ArrowRight, ChevronRight, History, X, PackageCheck,
  FileText, User, MapPin, Clock, Weight, AlertCircle, Package, Calendar, Plus,
  ChevronDown, Layers, Hash, Minus, Eye, ShoppingCart, Trash2,
} from "lucide-react";
import { useApp, PedidoConfirmado } from "../contexts/AppContext";
import { useAuth } from "../contexts/AuthContext";
import { useTheme, t } from "../contexts/ThemeContext";
import { toast } from "sonner";

// ===================== INTERFACES =====================

interface FotoRegistro {
  tipo: 'repesada' | 'devolucion' | 'entrega';
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
  tipo: 'repesada' | 'devolucion' | 'entrega' | 'asignacion';
  peso?: number;
  cantidadUnidades?: number;
  motivo?: string;
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
  const { pedidosConfirmados, clientes, vehiculos, updatePedidoConfirmado, addMultiplePedidosConfirmados, tiposAve, presentaciones, costosClientes } = useApp();
  const { user } = useAuth();
  const { isDark } = useTheme();
  const c = t(isDark);

  // ── Identidad del conductor logueado ──
  const conductorIdActual = user?.conductorRegistradoId || null;
  const conductorNombreActual = `${user?.nombre || ''} ${user?.apellido || ''}`.trim();

  // ── Vista ──
  const [modo, setModo] = useState<'LISTA' | 'GRUPO' | 'DETALLE' | 'REPESADA' | 'DEVOLUCION' | 'NUEVO_PEDIDO'>('LISTA');
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
  const [devFotos, setDevFotos] = useState<string[]>([]);
  const [devFotoActual, setDevFotoActual] = useState("");
  const [devMotivo, setDevMotivo] = useState("");
  const [devStep, setDevStep] = useState<'datos' | 'motivo'>('datos');

  // ── Nuevo Pedido ──
  interface SubPedidoConductor {
    id: string;
    tipoAve: string;
    variedad?: string;
    presentacion: string;
    cantidad: string;
    cantidadJabas?: string;
    unidadesPorJaba?: string;
  }
  const [npSubPedidos, setNpSubPedidos] = useState<SubPedidoConductor[]>([]);
  const [npTipoAve, setNpTipoAve] = useState('');
  const [npVariedad, setNpVariedad] = useState('');
  const [npPresentacion, setNpPresentacion] = useState('');
  const [npCantidad, setNpCantidad] = useState('');
  const [npCantidadJabas, setNpCantidadJabas] = useState('');
  const [npUnidadesPorJaba, setNpUnidadesPorJaba] = useState('');

  // ── UI ──
  const [expandedPedidos, setExpandedPedidos] = useState<Set<string>>(new Set());
  const [showConfirmEntregaTotal, setShowConfirmEntregaTotal] = useState(false);

  // ── Registros ──
  const [registros, setRegistros] = useState<RegistroConductor[]>(() => {
    const saved = localStorage.getItem('registrosConductor');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('registrosConductor', JSON.stringify(registros));
  }, [registros]);

  const extraerZonaId = (zona?: string, zonaId?: string) => {
    if (zonaId) return zonaId;
    if (!zona) return '';
    const match = zona.match(/Zona\s*(\d+)/i);
    return match?.[1] || '';
  };

  // ── Pedidos asignados al conductor ──
  const pedidosAsignadosConductor = pedidosConfirmados.filter((p) => {
    const esEstadoRuta =
      p.estado === 'En Despacho' || p.estado === 'Despachando' || p.estado === 'En Ruta' ||
      p.estado === 'Con Incidencia' || p.estado === 'Devolución';

    if (!esEstadoRuta) return false;
    if (!conductorIdActual && !conductorNombreActual) return false;

    // Priorizar vínculo por ID para evitar cruces entre conductores
    if (p.conductorId && conductorIdActual) return p.conductorId === conductorIdActual;

    // Fallback legacy por nombre para pedidos antiguos
    return p.conductor === conductorNombreActual;
  });

  // Apertura real: solo cuando Seguridad pone el vehículo de la zona en "En Ruta"
  const pedidosRuta = pedidosAsignadosConductor.filter((pedido) => {
    const zonaId = extraerZonaId(pedido.zonaEntrega, pedido.zonaEntregaId);
    if (!zonaId) return false;
    const vehiculoZona = vehiculos.find((v) => v.zona === zonaId);
    return vehiculoZona?.estado === 'En Ruta';
  });

  const tieneDespachosAsignadosSinApertura = pedidosAsignadosConductor.length > 0 && pedidosRuta.length === 0;

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
  const resetDevolucion = () => { setDevCantidad(""); setDevPeso(""); setDevFotos([]); setDevFotoActual(""); setDevMotivo(""); setDevStep('datos'); };
  const resetNuevoPedido = () => { setNpSubPedidos([]); setNpTipoAve(''); setNpVariedad(''); setNpPresentacion(''); setNpCantidad(''); setNpCantidadJabas(''); setNpUnidadesPorJaba(''); };

  // ── UI Helpers ──
  const getEstadoBadge = (estado: string) => {
    switch (estado) {
      case 'Devolución': return 'bg-red-500/15 text-red-400 ring-red-500/25';
      case 'Con Incidencia': return 'bg-amber-500/15 text-amber-400 ring-amber-500/25';
      case 'Despachando': return 'bg-blue-500/15 text-blue-400 ring-blue-500/25';
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
    const peso = formWeight ? parseFloat(formWeight) : 0;
    if (isNaN(peso) || peso < 0) { toast.error("Peso inválido"); return; }
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
    const cantidad = devCantidad ? parseInt(devCantidad) : 0;
    const peso = devPeso ? parseFloat(devPeso) : 0;
    if (devFotos.length === 0) { toast.error("Debe tomar al menos una foto de evidencia"); return; }
    if (!devMotivo || devMotivo.length < 3) { toast.error("Ingrese el motivo (mín. 3 caracteres)"); return; }
    const fresh = getFreshPedido();

    setRegistros(prev => [...prev, {
      id: generarId(), pedidoId: selectedPedido!.id, tipo: 'devolucion',
      peso, cantidadUnidades: cantidad, motivo: devMotivo,
      fotos: devFotos.map(url => ({ tipo: 'devolucion' as const, url, fecha: new Date().toISOString() })),
      fecha: new Date().toISOString(), estado: 'Con Incidencia',
    }]);

    updatePedidoConfirmado(selectedPedido!.id, {
      ...fresh!, estado: 'Devolución', pesoDevolucion: peso,
      motivoDevolucion: devMotivo,
      ultimaIncidencia: `Devolución: ${cantidad} unids. (${peso.toFixed(1)} kg)`,
    });

    toast.warning(`Devolución registrada: ${cantidad} unids. · ${peso.toFixed(1)} kg`);
    setModo('GRUPO'); resetDevolucion();
  };

  // ── Nuevo Pedido helpers ──
  const tiposAveActivos = tiposAve.filter(t => t.estado !== 'Inactivo');

  const getProductosParaCliente = (nombreCliente: string) => {
    if (!nombreCliente) return tiposAveActivos;
    const cliente = clientes.find(c => c.nombre === nombreCliente);
    if (!cliente) return tiposAveActivos;
    const costosDelCliente = costosClientes.filter(cc => cc.clienteId === cliente.id);
    if (costosDelCliente.length === 0) return tiposAveActivos;
    const tipoIdsConCosto = [...new Set(costosDelCliente.map(cc => cc.tipoAveId))];
    return tiposAveActivos.filter(t => tipoIdsConCosto.includes(t.id));
  };

  const getVariedadesParaCliente = (nombreCliente: string, tipoAveNombre: string): string[] => {
    const info = tiposAve.find(t => t.nombre === tipoAveNombre);
    if (!info?.tieneVariedad || !info.variedades?.length) return [];
    if (!nombreCliente) return info.variedades;
    const cliente = clientes.find(c => c.nombre === nombreCliente);
    if (!cliente) return info.variedades;
    const costosDelCliente = costosClientes.filter(cc => cc.clienteId === cliente.id && cc.tipoAveId === info.id);
    if (costosDelCliente.length === 0) return info.variedades;
    const variedadesConCosto = [...new Set(costosDelCliente.filter(cc => cc.variedad).map(cc => cc.variedad!))];
    return variedadesConCosto.length > 0 ? variedadesConCosto : info.variedades;
  };

  const getPresentacionesParaFormulario = (tipoAveNombre: string, variedad?: string) => {
    const filtered = presentaciones.filter(p => {
      if (p.tipoAve.toLowerCase() !== tipoAveNombre.toLowerCase()) return false;
      if (variedad && p.variedad && p.variedad !== variedad) return false;
      return true;
    });
    // Deduplicate by nombre (e.g. avoid duplicates from Macho/Hembra variants)
    const seen = new Set<string>();
    return filtered.filter(p => {
      if (seen.has(p.nombre)) return false;
      seen.add(p.nombre);
      return true;
    });
  };

  const npEsVivo = npPresentacion?.toLowerCase().includes('vivo');

  const handleAgregarSubPedido = () => {
    if (!npTipoAve) { toast.error('Seleccione tipo de ave'); return; }
    if (!npPresentacion) { toast.error('Seleccione presentación'); return; }
    if (npEsVivo) {
      if (!npCantidadJabas || parseInt(npCantidadJabas) <= 0) { toast.error('Ingrese cantidad de jabas'); return; }
      if (!npUnidadesPorJaba || parseInt(npUnidadesPorJaba) <= 0) { toast.error('Ingrese unidades por jaba'); return; }
    } else {
      if (!npCantidad || parseInt(npCantidad) <= 0) { toast.error('Ingrese cantidad'); return; }
    }

    const nuevo: SubPedidoConductor = {
      id: `sub-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      tipoAve: npTipoAve,
      variedad: npVariedad || undefined,
      presentacion: npPresentacion,
      cantidad: npEsVivo ? String(parseInt(npCantidadJabas) * parseInt(npUnidadesPorJaba)) : npCantidad,
      cantidadJabas: npEsVivo ? npCantidadJabas : undefined,
      unidadesPorJaba: npEsVivo ? npUnidadesPorJaba : undefined,
    };
    setNpSubPedidos(prev => [...prev, nuevo]);
    setNpTipoAve(''); setNpVariedad(''); setNpPresentacion(''); setNpCantidad(''); setNpCantidadJabas(''); setNpUnidadesPorJaba('');
    toast.success('Sub-pedido agregado');
  };

  const handleConfirmarNuevoPedido = () => {
    if (!grupoSeleccionado || npSubPedidos.length === 0) return;
    const ahora = new Date();
    const fecha = ahora.toISOString().split('T')[0];
    const hora = ahora.toTimeString().split(' ')[0].slice(0, 5);
    const grupoDespacho = `despacho-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;

    // Get or create numeroCliente from localStorage
    let clientesNumerados: { nombre: string; numeroCliente: string; siguienteSubNumero: number }[] = [];
    try {
      const saved = localStorage.getItem('clientesNumerados');
      if (saved) clientesNumerados = JSON.parse(saved);
    } catch { /* ignore */ }

    let clienteData = clientesNumerados.find(c => c.nombre === grupoSeleccionado.cliente);
    if (!clienteData) {
      const maxNum = clientesNumerados.length > 0
        ? Math.max(...clientesNumerados.map(c => parseInt(c.numeroCliente.replace('C', '')) || 0))
        : 0;
      clienteData = { nombre: grupoSeleccionado.cliente, numeroCliente: `C${String(maxNum + 1).padStart(3, '0')}`, siguienteSubNumero: 1 };
      clientesNumerados.push(clienteData);
    }

    const confirmar = npSubPedidos.map((sub, idx) => {
      const subNum = clienteData!.siguienteSubNumero + idx;
      return {
        id: `confirmed-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        numeroPedido: `${clienteData!.numeroCliente}.${subNum}`,
        numeroCliente: clienteData!.numeroCliente,
        cliente: grupoSeleccionado.cliente,
        tipoAve: sub.tipoAve + (sub.variedad ? ` - ${sub.variedad}` : ''),
        variedad: sub.variedad,
        presentacion: sub.presentacion,
        cantidad: parseInt(sub.cantidad),
        cantidadJabas: sub.cantidadJabas ? parseInt(sub.cantidadJabas) : undefined,
        unidadesPorJaba: sub.unidadesPorJaba ? parseInt(sub.unidadesPorJaba) : undefined,
        contenedor: '',
        fecha, hora,
        prioridad: parseInt(clienteData!.numeroCliente.replace('C', '')),
        esSubPedido: npSubPedidos.length > 1,
        grupoDespacho,
      };
    });

    // Update siguienteSubNumero
    clienteData!.siguienteSubNumero += npSubPedidos.length;
    try { localStorage.setItem('clientesNumerados', JSON.stringify(clientesNumerados)); } catch { /* ignore */ }

    addMultiplePedidosConfirmados(confirmar);
    toast.success(`${confirmar.length} pedido(s) creado(s) para ${grupoSeleccionado.cliente}`);
    resetNuevoPedido();
    setModo('GRUPO');
  };

  // ── Entrega ──
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
              else if (modo === 'NUEVO_PEDIDO') {
                setModo('GRUPO'); resetNuevoPedido();
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

      {/* ═══════ BLOQUEO: apertura desde Seguridad (vehiculo en ruta) ═══════ */}
      {tieneDespachosAsignadosSinApertura && modo === 'LISTA' && (
        <div className="rounded-2xl p-8 sm:p-12 text-center" style={{ background: c.bgCard, border: '1px solid rgba(245,158,11,0.3)' }}>
          <div className="w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center" style={{ background: 'rgba(245,158,11,0.1)', border: '2px solid rgba(245,158,11,0.3)' }}>
            <Truck className="w-10 h-10" style={{ color: '#f59e0b' }} />
          </div>
          <h2 className="text-xl font-bold mb-2" style={{ color: c.text }}>Despacho aun no aperturado</h2>
          <p className="text-sm mb-4" style={{ color: c.textSecondary }}>
            Seguridad debe cambiar el vehiculo de tu zona a <strong style={{ color: '#3b82f6' }}>&quot;En Ruta&quot;</strong> para habilitar tus despachos.
          </p>
          <p className="text-xs" style={{ color: c.textMuted }}>
            Si el vehiculo esta en &quot;Disponible&quot;, este panel permanece cerrado.
          </p>
        </div>
      )}

      {/* ═══════ LISTA DE DESPACHOS ═══════ */}
      {modo === 'LISTA' && !tieneDespachosAsignadosSinApertura && (
        <div className="space-y-5">

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
              {(() => {
                const todosRepesados = grupoSeleccionado.pedidos.every(p => {
                  const regs = getRegistrosPedido(p.id);
                  return regs.some(r => r.tipo === 'repesada');
                });
                return (
              <div className="flex gap-3">
                <button
                  onClick={() => todosRepesados && setShowConfirmEntregaTotal(true)}
                  disabled={!todosRepesados}
                  className="flex-1 py-3.5 rounded-xl font-black text-sm transition-all flex items-center justify-center gap-2 disabled:cursor-not-allowed"
                  style={todosRepesados
                    ? { background: 'linear-gradient(135deg, #0d4a24, #166534, #22c55e)', boxShadow: '0 6px 20px -5px rgba(34,197,94,0.35)', color: '#fff' }
                    : { background: isDark ? '#1f2937' : '#d1d5db', color: isDark ? '#6b7280' : '#9ca3af', opacity: 0.7 }
                  }
                  title={!todosRepesados ? 'Todos los pedidos deben tener repesada completada' : ''}
                >
                  <CheckCircle2 className="w-5 h-5" /> ENTREGA TOTAL
                  {!todosRepesados && <span className="text-[9px] ml-1">(Faltan repesadas)</span>}
                </button>
                <button
                  onClick={() => { resetNuevoPedido(); setModo('NUEVO_PEDIDO'); }}
                  className="py-3.5 px-5 rounded-xl font-bold text-white text-sm transition-all hover:scale-[1.01] flex items-center gap-2"
                  style={{ background: 'linear-gradient(135deg, #4a1d96, #6d28d9, #8b5cf6)', boxShadow: '0 4px 15px -3px rgba(139,92,246,0.3)' }}
                >
                  <ShoppingCart className="w-5 h-5" /> NUEVO PEDIDO
                </button>
              </div>
                );
              })()}
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

                      {/* Acciones: Repesaje, Devolución, Entrega */}
                      {pedidoCompletado ? (
                        <div className="flex items-center justify-center gap-2 py-3 rounded-xl mt-3"
                          style={{ background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.2)' }}>
                          <CheckCircle2 className="w-5 h-5 text-green-400" />
                          <span className="text-green-400 font-black text-sm uppercase tracking-wider">Entregado</span>
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 gap-2 mt-3">
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
                  <div className="grid grid-cols-2 gap-2 mt-4">
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
                {!capturedPhoto && (
                  <div className="bg-amber-500/10 border border-amber-500/40 rounded-xl p-3 flex items-center gap-3">
                    <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
                    <p className="text-amber-200 font-bold text-xs uppercase">Tome la foto antes de sumar la tanda</p>
                  </div>
                )}

                {/* Input peso + foto */}
                <div className="grid grid-cols-1 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest mb-1.5" style={{ color: c.textMuted }}>
                      Peso de esta tanda (kg)
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
                  disabled={!capturedPhoto}
                  className="w-full py-4 border-2 rounded-xl font-black text-lg flex items-center justify-center gap-3 transition-all active:scale-[0.98] disabled:cursor-not-allowed"
                  style={capturedPhoto
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
                          Cantidad (unids.)
                        </label>
                        <input type="number" inputMode="numeric" min="0" value={devCantidad}
                          onChange={(e) => setDevCantidad(e.target.value)} placeholder="0"
                          className="w-full rounded-xl px-4 py-3.5 text-2xl font-black focus:outline-none focus:border-orange-500 transition-all text-center" style={{ background: c.bgInput, border: `2px solid ${c.border}`, color: c.text }} />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-widest mb-1.5" style={{ color: c.textMuted }}>
                          Peso (kg)
                        </label>
                        <div className="relative">
                          <input type="number" inputMode="decimal" step="0.1" min="0" value={devPeso}
                            onChange={(e) => setDevPeso(e.target.value)} placeholder="0.0"
                            className="w-full rounded-xl px-4 py-3.5 text-2xl font-black focus:outline-none focus:border-orange-500 transition-all text-center pr-10" style={{ background: c.bgInput, border: `2px solid ${c.border}`, color: c.text }} />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 font-bold text-sm" style={{ color: c.textMuted }}>kg</span>
                        </div>
                      </div>
                    </div>

                    {/* Fotos de evidencia */}
                    <div>
                      <label className="block text-[10px] font-bold text-orange-400 uppercase tracking-widest mb-1.5">Fotos de Evidencia <span className="text-red-400">*</span> <span className="text-[9px]" style={{ color: c.textMuted }}>({devFotos.length} capturada{devFotos.length !== 1 ? 's' : ''})</span></label>
                      <button onClick={() => handleCapturePhoto((url: string) => setDevFotos(prev => [...prev, url]))}
                        className="w-full h-14 border-2 rounded-xl flex items-center justify-center gap-3 transition-all font-black text-base active:scale-95"
                        style={{ background: isDark ? '#1f2937' : c.bgInput, border: `2px solid ${c.border}`, color: c.text }}>
                        <Camera className="w-5 h-5 text-orange-400" />
                        TOMAR FOTO
                      </button>
                    </div>

                    {/* Lista de fotos capturadas */}
                    {devFotos.length > 0 && (
                      <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-3 space-y-2">
                        <div className="flex items-center justify-between">
                          <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: c.textMuted }}>Fotos ({devFotos.length})</p>
                          <button onClick={() => setDevFotos(prev => prev.slice(0, -1))} className="text-[10px] text-red-400/70 hover:text-red-400 font-bold flex items-center gap-1">
                            <Minus className="w-3 h-3" /> Quitar última
                          </button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {devFotos.map((foto, i) => (
                            <div key={i} className="relative">
                              <div className="w-16 h-16 rounded-lg overflow-hidden border border-gray-700 shrink-0">
                                <img src={foto} alt="" className="w-full h-full object-cover" />
                              </div>
                              <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-orange-500 flex items-center justify-center">
                                <span className="text-[9px] font-black text-white">{i + 1}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Continuar a motivo */}
                    <button onClick={() => {
                      if (devFotos.length === 0) { toast.error("Tome al menos una foto de evidencia"); return; }
                      setDevStep('motivo');
                    }}
                      disabled={devFotos.length === 0}
                      className="w-full py-4 rounded-xl font-extrabold text-lg shadow-xl transition-all flex items-center justify-center gap-3 active:scale-[0.98] disabled:cursor-not-allowed"
                      style={devFotos.length > 0
                        ? { background: '#ea580c', color: '#fff' }
                        : { background: isDark ? '#1f2937' : '#d1d5db', color: c.textMuted, opacity: 0.6 }
                      }>
                      <ArrowRight className="w-5 h-5" /> CONTINUAR
                    </button>
                  </>
                ) : (
                  <>
                    {/* Resumen de datos */}
                    <div className="grid grid-cols-3 gap-3">
                      <div className="bg-orange-900/15 border border-orange-500/25 rounded-xl p-3 text-center">
                        <p className="text-[10px] text-orange-400 uppercase font-bold">Cantidad</p>
                        <p className="text-xl font-black" style={{ color: c.text }}>{devCantidad || '0'} <span className="text-xs" style={{ color: c.textMuted }}>unids.</span></p>
                      </div>
                      <div className="bg-orange-900/15 border border-orange-500/25 rounded-xl p-3 text-center">
                        <p className="text-[10px] text-orange-400 uppercase font-bold">Peso</p>
                        <p className="text-xl font-black" style={{ color: c.text }}>{devPeso ? parseFloat(devPeso).toFixed(1) : '0.0'} <span className="text-xs" style={{ color: c.textMuted }}>kg</span></p>
                      </div>
                      <div className="bg-orange-900/15 border border-orange-500/25 rounded-xl p-3 text-center">
                        <p className="text-[10px] text-orange-400 uppercase font-bold">Fotos</p>
                        <p className="text-xl font-black" style={{ color: c.text }}>{devFotos.length}</p>
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

      {/* ═══════ MÓDULO DE NUEVO PEDIDO ═══════ */}
      {modo === 'NUEVO_PEDIDO' && grupoSeleccionado && (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="rounded-2xl overflow-hidden shadow-xl" style={{ background: c.bgCard, border: `1px solid ${c.border}` }}>
            <div className="h-1 w-full bg-violet-500" />
            <div className="p-5 space-y-4">

              {/* Header */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-violet-500/15 flex items-center justify-center shrink-0">
                  <ShoppingCart className="w-5 h-5 text-violet-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-lg font-extrabold uppercase tracking-tight" style={{ color: c.text }}>Nuevo Pedido</h2>
                  <p className="text-[11px]" style={{ color: c.textMuted }}>Para <span className="text-violet-400 font-bold">{grupoSeleccionado.cliente}</span></p>
                </div>
              </div>

              {/* Cliente (auto) */}
              <div className="bg-violet-900/10 border border-violet-500/20 rounded-xl p-3 flex items-center gap-3">
                <User className="w-5 h-5 text-violet-400 shrink-0" />
                <div>
                  <p className="text-[10px] text-violet-400 uppercase font-bold">Cliente</p>
                  <p className="text-sm font-bold" style={{ color: c.text }}>{grupoSeleccionado.cliente}</p>
                </div>
              </div>

              {/* Formulario sub-pedido */}
              <div className="space-y-3 rounded-xl p-4" style={{ background: c.bgCardAlt, border: `1px solid ${c.border}` }}>
                <p className="text-[10px] font-bold uppercase tracking-widest text-violet-400">Agregar Producto</p>

                {/* Tipo de Ave */}
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: c.textMuted }}>Tipo de Ave <span className="text-red-400">*</span></label>
                  <select value={npTipoAve} onChange={e => { setNpTipoAve(e.target.value); setNpVariedad(''); setNpPresentacion(''); }}
                    className="w-full rounded-lg px-3 py-2.5 text-sm focus:outline-none"
                    style={{ background: c.bgInput, border: `1px solid ${c.border}`, color: c.text }}>
                    <option value="">Seleccionar...</option>
                    {getProductosParaCliente(grupoSeleccionado.cliente).map(t => (
                      <option key={t.id} value={t.nombre}>{t.nombre}</option>
                    ))}
                  </select>
                </div>

                {/* Variedad */}
                {npTipoAve && getVariedadesParaCliente(grupoSeleccionado.cliente, npTipoAve).length > 0 && (
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: c.textMuted }}>Variedad</label>
                    <select value={npVariedad} onChange={e => { setNpVariedad(e.target.value); setNpPresentacion(''); }}
                      className="w-full rounded-lg px-3 py-2.5 text-sm focus:outline-none"
                      style={{ background: c.bgInput, border: `1px solid ${c.border}`, color: c.text }}>
                      <option value="">Seleccionar...</option>
                      {getVariedadesParaCliente(grupoSeleccionado.cliente, npTipoAve).map(v => (
                        <option key={v} value={v}>{v}</option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Presentación */}
                {npTipoAve && (
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: c.textMuted }}>Presentación <span className="text-red-400">*</span></label>
                    <select value={npPresentacion} onChange={e => setNpPresentacion(e.target.value)}
                      className="w-full rounded-lg px-3 py-2.5 text-sm focus:outline-none"
                      style={{ background: c.bgInput, border: `1px solid ${c.border}`, color: c.text }}>
                      <option value="">Seleccionar...</option>
                      {getPresentacionesParaFormulario(npTipoAve, npVariedad || undefined).map(p => (
                        <option key={p.id} value={p.nombre}>{p.nombre}</option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Cantidad */}
                {npPresentacion && (
                  npEsVivo ? (
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: c.textMuted }}>Jabas <span className="text-red-400">*</span></label>
                        <input type="number" inputMode="numeric" min="1" value={npCantidadJabas}
                          onChange={e => setNpCantidadJabas(e.target.value)} placeholder="0"
                          className="w-full rounded-lg px-3 py-2.5 text-lg font-black text-center focus:outline-none"
                          style={{ background: c.bgInput, border: `1px solid ${c.border}`, color: c.text }} />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: c.textMuted }}>Aves/Jaba <span className="text-red-400">*</span></label>
                        <input type="number" inputMode="numeric" min="1" value={npUnidadesPorJaba}
                          onChange={e => setNpUnidadesPorJaba(e.target.value)} placeholder="0"
                          className="w-full rounded-lg px-3 py-2.5 text-lg font-black text-center focus:outline-none"
                          style={{ background: c.bgInput, border: `1px solid ${c.border}`, color: c.text }} />
                      </div>
                      {npCantidadJabas && npUnidadesPorJaba && parseInt(npCantidadJabas) > 0 && parseInt(npUnidadesPorJaba) > 0 && (
                        <div className="col-span-2 text-center text-xs font-bold text-violet-400">
                          Total: {parseInt(npCantidadJabas) * parseInt(npUnidadesPorJaba)} aves
                        </div>
                      )}
                    </div>
                  ) : (
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: c.textMuted }}>Cantidad (unids.) <span className="text-red-400">*</span></label>
                      <input type="number" inputMode="numeric" min="1" value={npCantidad}
                        onChange={e => setNpCantidad(e.target.value)} placeholder="0"
                        className="w-full rounded-lg px-3 py-2.5 text-lg font-black text-center focus:outline-none"
                        style={{ background: c.bgInput, border: `1px solid ${c.border}`, color: c.text }} />
                    </div>
                  )
                )}

                {/* Botón agregar */}
                <button onClick={handleAgregarSubPedido}
                  disabled={!npTipoAve || !npPresentacion}
                  className="w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:cursor-not-allowed"
                  style={(npTipoAve && npPresentacion)
                    ? { background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.4)', color: '#a78bfa' }
                    : { background: isDark ? '#1f2937' : '#e5e7eb', color: c.textMuted, opacity: 0.6 }
                  }>
                  <Plus className="w-4 h-4" /> AGREGAR SUB-PEDIDO
                </button>
              </div>

              {/* Lista de sub-pedidos agregados */}
              {npSubPedidos.length > 0 && (
                <div className="space-y-2">
                  <p className="text-[10px] font-bold uppercase tracking-widest px-1" style={{ color: c.textMuted }}>
                    Productos ({npSubPedidos.length})
                  </p>
                  {npSubPedidos.map((sub, idx) => {
                    const esVivo = sub.presentacion?.toLowerCase().includes('vivo');
                    return (
                      <div key={sub.id} className="flex items-center justify-between rounded-xl p-3"
                        style={{ background: c.bgCardAlt, border: `1px solid ${c.border}` }}>
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <span className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black shrink-0 bg-violet-500/12 text-violet-400">
                            {idx + 1}
                          </span>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-sm font-bold" style={{ color: c.text }}>{sub.tipoAve}</span>
                              {sub.variedad && <span className="text-[10px]" style={{ color: c.textMuted }}>({sub.variedad})</span>}
                            </div>
                            <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
                              <span className="text-[10px] text-blue-400">{sub.presentacion}</span>
                              <span className="text-[10px]" style={{ color: c.textMuted }}>·</span>
                              <span className={`text-[10px] font-bold ${esVivo ? 'text-amber-400' : 'text-purple-400'}`}>
                                {esVivo ? `${sub.cantidadJabas} jabas × ${sub.unidadesPorJaba} = ${sub.cantidad} aves` : `${sub.cantidad} unids.`}
                              </span>
                            </div>
                          </div>
                        </div>
                        <button onClick={() => setNpSubPedidos(prev => prev.filter(s => s.id !== sub.id))}
                          className="p-1.5 rounded-lg hover:bg-red-500/10 transition-colors shrink-0">
                          <Trash2 className="w-4 h-4 text-red-400" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Confirmar */}
              <button onClick={handleConfirmarNuevoPedido}
                disabled={npSubPedidos.length === 0}
                className="w-full py-5 rounded-xl font-extrabold text-xl shadow-xl transition-all flex items-center justify-center gap-3 active:scale-[0.98] disabled:cursor-not-allowed"
                style={npSubPedidos.length > 0
                  ? { background: 'linear-gradient(135deg, #4a1d96, #6d28d9, #8b5cf6)', color: '#fff', boxShadow: '0 6px 20px -5px rgba(139,92,246,0.35)' }
                  : { background: isDark ? '#1f2937' : '#d1d5db', color: c.textMuted, opacity: 0.6 }
                }>
                <CheckCircle2 className="w-6 h-6" /> CONFIRMAR PEDIDO ({npSubPedidos.length})
              </button>
            </div>
          </div>
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

    </div>
  );
}
