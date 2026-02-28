import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
  Scale, MapPin, User, Printer, CheckCircle, Package, X, FileText, Usb, Wifi,
  RotateCcw, Monitor, Box, Plus, Lock, ChevronRight, ChevronDown, Clock,
  ArrowLeft, Layers, Users,
} from 'lucide-react';
import { useApp, PedidoConfirmado, BloquePesaje } from '../contexts/AppContext';
import { toast } from 'sonner';

// ===================== CONSTANTES =====================

const CONDUCTORES = [
  { id: '1', nombre: 'Juan Pérez', placa: 'ABC-123' },
  { id: '2', nombre: 'Miguel Torres', placa: 'DEF-456' },
  { id: '3', nombre: 'Roberto Sánchez', placa: 'GHI-789' },
  { id: '4', nombre: 'Luis García', placa: 'JKL-012' },
];

const ZONAS = [
  { id: '1', nombre: 'Zona 1 - Independencia' },
  { id: '2', nombre: 'Zona 2 - Provincia' },
  { id: '3', nombre: 'Zona 3 - Jicamarca' },
  { id: '4', nombre: 'Zona 4 - Sedapal, Zona Alta, Zona Baja, Corralito, Plumas' },
  { id: '5', nombre: 'Zona 5 - Vencedores' },
  { id: '6', nombre: 'Zona 6 - Montenegro, 10 de Octubre, Motupe, Mariscal, Mariátegui, Trébol' },
  { id: '7', nombre: 'Zona 7 - Valle Sagrado, Saruta' },
  { id: '8', nombre: 'Zona 8 - Bayovar, Huáscar, Peladero, Sta. María' },
];

const JABA_ESTANDAR = { id: 'jaba-std', tipo: 'Jaba Estándar', peso: 6.9 };

// ===================== INTERFACES =====================

interface PesadaParcial {
  numero: number;
  peso: number;
  jabas?: number;
}

interface ContenedorOpcion {
  id: string;
  tipo: string;
  peso: number;
}

interface ResultadoPesajeOrden {
  pedidoId: string;
  pedido: PedidoConfirmado;
  pesadas: PesadaParcial[];
  pesoBrutoTotal: number;
  contenedorId: string;
  tipoContenedor: string;
  cantidadContenedores: number;
  pesoUnitarioContenedor: number;
  pesoContenedoresTotal: number;
  pesoNetoTotal: number;
}

interface ConsolidatedTicketData {
  grupoId: string;
  cliente: string;
  pedidos: ResultadoPesajeOrden[];
  totales: {
    pesoBrutoTotal: number;
    pesoContenedoresTotal: number;
    pesoNetoTotal: number;
  };
  conductor: string;
  conductorPlaca: string;
  zona: string;
  fechaEmision: string;
  horaEmision: string;
  numeroTicket: string;
}

interface GrupoPesaje {
  grupoId: string;
  pedidos: PedidoConfirmado[];
}

interface ClienteEnPesaje {
  cliente: string;
  totalPedidos: number;
  grupos: GrupoPesaje[];
  primeraLlegada: number;
}

// ===================== HOOK: useSerialScale =====================

function useSerialScale() {
  const [port, setPort] = useState<any>(null);
  const [connected, setConnected] = useState(false);
  const [currentWeight, setCurrentWeight] = useState<number>(0);
  const [stable, setStable] = useState(false);
  const readerRef = useRef<any>(null);
  const broadcastRef = useRef<BroadcastChannel | null>(null);

  useEffect(() => {
    broadcastRef.current = new BroadcastChannel('pesaje-display');
    return () => broadcastRef.current?.close();
  }, []);

  const broadcastWeight = useCallback((weight: number, isStable: boolean) => {
    broadcastRef.current?.postMessage({ type: 'weight-update', weight, stable: isStable, timestamp: Date.now() });
  }, []);

  const parseWeightData = useCallback((data: string): { weight: number; stable: boolean } | null => {
    const cleaned = data.replace(/[^\d.\-+SsTtGg,\s]/g, '').trim();
    const isStable = /^S[Tt]|^S\s/i.test(data);
    const match = cleaned.match(/([\d]+\.?\d*)/);
    if (match) {
      const weight = parseFloat(match[1]);
      if (!isNaN(weight)) return { weight, stable: isStable };
    }
    return null;
  }, []);

  const connect = useCallback(async () => {
    try {
      if (!('serial' in navigator)) { toast.error('Web Serial API no disponible. Use Chrome o Edge.'); return false; }
      const selectedPort = await (navigator as any).serial.requestPort();
      await selectedPort.open({ baudRate: 9600 });
      setPort(selectedPort);
      setConnected(true);
      toast.success('Balanza conectada correctamente');
      const reader = selectedPort.readable.getReader();
      readerRef.current = reader;
      let buffer = '';
      const readLoop = async () => {
        try {
          while (true) {
            const { value, done } = await reader.read();
            if (done) break;
            const text = new TextDecoder().decode(value);
            buffer += text;
            const lines = buffer.split(/[\r\n]+/);
            buffer = lines.pop() || '';
            for (const line of lines) {
              if (line.trim()) {
                const parsed = parseWeightData(line);
                if (parsed) { setCurrentWeight(parsed.weight); setStable(parsed.stable); broadcastWeight(parsed.weight, parsed.stable); }
              }
            }
          }
        } catch (err: any) { if (err.name !== 'NetworkError') console.error('Error leyendo balanza:', err); }
      };
      readLoop();
      return true;
    } catch (err: any) {
      if (err.name !== 'NotFoundError') { toast.error('Error al conectar la balanza'); console.error(err); }
      return false;
    }
  }, [parseWeightData, broadcastWeight]);

  const disconnect = useCallback(async () => {
    try {
      if (readerRef.current) { await readerRef.current.cancel(); readerRef.current = null; }
      if (port) await port.close();
      setPort(null); setConnected(false); setCurrentWeight(0); setStable(false);
      toast.success('Balanza desconectada');
    } catch (err) { console.error('Error al desconectar:', err); }
  }, [port]);

  return { connected, currentWeight, stable, connect, disconnect };
}

// ===================== COMPONENTE PRINCIPAL =====================

export function PesajeOperador() {
  const { pedidosConfirmados, updatePedidoConfirmado, contenedores, clientes } = useApp();
  const scale = useSerialScale();

  // ── Vista principal ──
  const [vista, setVista] = useState<'clientes' | 'pesaje' | 'entrega'>('clientes');
  const [clienteExpandido, setClienteExpandido] = useState<string | null>(null);

  // ── Pesaje de grupo ──
  const [grupoActual, setGrupoActual] = useState<GrupoPesaje | null>(null);
  const [ordenActualIdx, setOrdenActualIdx] = useState(0);
  const [resultadosCompletos, setResultadosCompletos] = useState<ResultadoPesajeOrden[]>([]);

  // ── Estado de pesaje de la orden actual ──
  const [modoManual, setModoManual] = useState(true);
  const [pesoManualInput, setPesoManualInput] = useState('');
  const [pesadas, setPesadas] = useState<PesadaParcial[]>([]);
  const [faseOrden, setFaseOrden] = useState<'pesando' | 'confirmando-contenedor'>('pesando');

  // Contenedor
  const [contenedorFinalId, setContenedorFinalId] = useState('');
  const [cantidadContenedoresInput, setCantidadContenedoresInput] = useState('');
  const [cantidadBloqueada, setCantidadBloqueada] = useState(false);

  // Jabas (Vivo)
  const [jabasEnEstaPesada, setJabasEnEstaPesada] = useState('');
  const [pesoJabaEditable, setPesoJabaEditable] = useState(JABA_ESTANDAR.peso);

  // Entrega (compartido para todo el grupo)
  const [conductorId, setConductorId] = useState('');
  const [zonaId, setZonaId] = useState('');
  const [zonaBloqueada, setZonaBloqueada] = useState(false);

  // Ticket
  const [ticketVisible, setTicketVisible] = useState<ConsolidatedTicketData | null>(null);
  const ticketRef = useRef<HTMLDivElement>(null);
  const broadcastRef = useRef<BroadcastChannel | null>(null);

  useEffect(() => {
    broadcastRef.current = new BroadcastChannel('pesaje-display');
    return () => broadcastRef.current?.close();
  }, []);

  // ── Datos derivados ──
  const pedidosEnPesaje = pedidosConfirmados
    .filter(p => p.estado === 'En Pesaje')
    .sort((a, b) => a.prioridad - b.prioridad);

  const clientesEnPesaje: ClienteEnPesaje[] = useMemo(() => {
    const map = new Map<string, PedidoConfirmado[]>();
    pedidosEnPesaje.forEach(p => {
      if (!map.has(p.cliente)) map.set(p.cliente, []);
      map.get(p.cliente)!.push(p);
    });
    return Array.from(map.entries())
      .map(([cliente, pedidos]) => {
        const gruposMap = new Map<string, PedidoConfirmado[]>();
        pedidos.forEach(p => {
          const key = p.grupoDespacho || `individual-${p.id}`;
          if (!gruposMap.has(key)) gruposMap.set(key, []);
          gruposMap.get(key)!.push(p);
        });
        return {
          cliente,
          totalPedidos: pedidos.length,
          primeraLlegada: Math.min(...pedidos.map(p => p.prioridad)),
          grupos: Array.from(gruposMap.entries()).map(([grupoId, grupoPedidos]) => ({
            grupoId,
            pedidos: grupoPedidos.sort((a, b) => {
              const aNum = parseInt((a.numeroPedido || '').split('.')[1] || '0');
              const bNum = parseInt((b.numeroPedido || '').split('.')[1] || '0');
              return aNum - bNum;
            }),
          })),
        };
      })
      .sort((a, b) => a.primeraLlegada - b.primeraLlegada);
  }, [pedidosEnPesaje]);

  // Orden actual
  const ordenActual = grupoActual?.pedidos[ordenActualIdx] || null;
  const esVivo = !!ordenActual?.presentacion?.toLowerCase().includes('vivo');

  const opcionesContenedor: ContenedorOpcion[] = esVivo
    ? [JABA_ESTANDAR]
    : [JABA_ESTANDAR, ...contenedores.filter(c => c.tipo !== 'Jaba Estándar').map(c => ({ id: c.id, tipo: c.tipo, peso: c.peso }))];

  const pesoActual = modoManual ? parseFloat(pesoManualInput) || 0 : scale.currentWeight;
  const pesoBrutoTotal = pesadas.reduce((sum, p) => sum + p.peso, 0);

  // Jabas tracking
  const totalJabasPedido = ordenActual?.cantidadJabas || 0;
  const unidadesPorJaba = ordenActual?.unidadesPorJaba || 0;
  const totalAvesPedido = totalJabasPedido * unidadesPorJaba;
  const jabasPesadas = pesadas.reduce((sum, p) => sum + (p.jabas || 0), 0);
  const jabasRestantes = totalJabasPedido - jabasPesadas;
  const jabasInput = parseInt(jabasEnEstaPesada) || 0;

  // Container preview
  const contSeleccionadoPreview = opcionesContenedor.find(c => c.id === contenedorFinalId);
  const cantidadPreview = parseInt(cantidadContenedoresInput) || 0;
  const taraPreview = esVivo ? pesoJabaEditable * cantidadPreview : (contSeleccionadoPreview?.peso || 0) * cantidadPreview;
  const netoPreview = pesoBrutoTotal - taraPreview;

  const zonaSeleccionada = ZONAS.find(z => z.id === zonaId);

  // ── Handlers ──

  const resetearOrdenActual = () => {
    setPesadas([]);
    setFaseOrden('pesando');
    setPesoManualInput('');
    setContenedorFinalId('');
    setCantidadContenedoresInput('');
    setCantidadBloqueada(false);
    setJabasEnEstaPesada('');
    setPesoJabaEditable(JABA_ESTANDAR.peso);
  };

  const prepararOrden = (pedido: PedidoConfirmado) => {
    const esVivoP = !!pedido.presentacion?.toLowerCase().includes('vivo');
    if (esVivoP) {
      setContenedorFinalId(JABA_ESTANDAR.id);
      if (pedido.cantidadJabas && pedido.cantidadJabas > 0) {
        setCantidadContenedoresInput(String(pedido.cantidadJabas));
        setCantidadBloqueada(true);
      }
    } else {
      const contDef = contenedores.find(c => c.tipo === pedido.contenedor);
      if (contDef) setContenedorFinalId(contDef.id);
    }
    broadcastRef.current?.postMessage({
      type: 'pedido-selected',
      pedido: { cliente: pedido.cliente, tipoAve: pedido.tipoAve, cantidad: pedido.cantidad, presentacion: pedido.presentacion },
    });
  };

  const iniciarPesajeGrupo = (grupo: GrupoPesaje) => {
    setGrupoActual(grupo);
    setOrdenActualIdx(0);
    setResultadosCompletos([]);
    setVista('pesaje');
    resetearOrdenActual();
    setConductorId('');
    setZonaId('');
    setZonaBloqueada(false);

    // Zona del cliente
    const pedido = grupo.pedidos[0];
    const clienteObj = clientes.find(c => c.nombre === pedido.cliente);
    if (clienteObj?.zona) {
      const zonaMatch = ZONAS.find(z =>
        z.id === clienteObj.zona ||
        z.nombre.toLowerCase().includes(clienteObj.zona.toLowerCase())
      );
      if (zonaMatch) { setZonaId(zonaMatch.id); setZonaBloqueada(true); }
    }
    prepararOrden(pedido);
  };

  const handleVolver = () => {
    if (resultadosCompletos.length > 0 || pesadas.length > 0) {
      if (!window.confirm('¿Salir del pesaje? Se perderán los datos no guardados.')) return;
    }
    setVista('clientes');
    setGrupoActual(null);
    setOrdenActualIdx(0);
    setResultadosCompletos([]);
    resetearOrdenActual();
  };

  const sumarPesada = () => {
    if (pesoActual <= 0) { toast.error('El peso debe ser mayor a 0'); return; }
    if (esVivo && totalJabasPedido > 0) {
      if (jabasInput <= 0) { toast.error('Ingrese cuántas jabas se pesan en esta tanda'); return; }
      if (jabasInput > jabasRestantes) { toast.error(`Solo quedan ${jabasRestantes} jabas por pesar`); return; }
    }
    const nueva: PesadaParcial = {
      numero: pesadas.length + 1,
      peso: pesoActual,
      ...(esVivo && totalJabasPedido > 0 ? { jabas: jabasInput } : {}),
    };
    const nuevasPesadas = [...pesadas, nueva];
    setPesadas(nuevasPesadas);
    setPesoManualInput('');
    setJabasEnEstaPesada('');
    const acum = nuevasPesadas.reduce((s, p) => s + p.peso, 0);
    broadcastRef.current?.postMessage({ type: 'weight-update', weight: acum, stable: true, timestamp: Date.now() });
    const jabasMsg = nueva.jabas ? ` (${nueva.jabas} jabas)` : '';
    toast.success(`Pesada ${nueva.numero}: ${pesoActual.toFixed(2)} kg${jabasMsg} → Acumulado: ${acum.toFixed(2)} kg`);
  };

  const quitarUltimaPesada = () => {
    if (pesadas.length === 0) return;
    setPesadas(pesadas.slice(0, -1));
    toast.info('Última pesada eliminada');
  };

  const terminarPesaje = () => {
    if (pesadas.length === 0) { toast.error('Debe registrar al menos una pesada'); return; }
    setFaseOrden('confirmando-contenedor');
  };

  const confirmarContenedorYAvanzar = () => {
    if (!ordenActual || !grupoActual) return;
    if (!contenedorFinalId) { toast.error('Seleccione el tipo de contenedor'); return; }
    if (!cantidadPreview || cantidadPreview <= 0) { toast.error('Ingrese la cantidad de contenedores'); return; }

    const contFinal = opcionesContenedor.find(c => c.id === contenedorFinalId);
    if (!contFinal) return;

    const pesoUnitCont = esVivo ? pesoJabaEditable : contFinal.peso;
    const pesoTotalCont = pesoUnitCont * cantidadPreview;
    const pesoNeto = pesoBrutoTotal - pesoTotalCont;

    const resultado: ResultadoPesajeOrden = {
      pedidoId: ordenActual.id,
      pedido: ordenActual,
      pesadas: [...pesadas],
      pesoBrutoTotal,
      contenedorId: contenedorFinalId,
      tipoContenedor: contFinal.tipo,
      cantidadContenedores: cantidadPreview,
      pesoUnitarioContenedor: pesoUnitCont,
      pesoContenedoresTotal: pesoTotalCont,
      pesoNetoTotal: pesoNeto,
    };

    const nuevosResultados = [...resultadosCompletos, resultado];
    setResultadosCompletos(nuevosResultados);

    const nextIdx = ordenActualIdx + 1;
    if (nextIdx < grupoActual.pedidos.length) {
      setOrdenActualIdx(nextIdx);
      resetearOrdenActual();
      prepararOrden(grupoActual.pedidos[nextIdx]);
      toast.success(`Pedido ${ordenActualIdx + 1}/${grupoActual.pedidos.length} completado. Siguiente pedido...`);
    } else {
      setVista('entrega');
      toast.success('¡Todos los pedidos del grupo han sido pesados!');
    }
  };

  const handleConfirmarDespacho = () => {
    if (!grupoActual) return;
    if (!conductorId) { toast.error('Seleccione un conductor'); return; }
    if (!zonaId) { toast.error('Seleccione una zona de entrega'); return; }

    const conductor = CONDUCTORES.find(c => c.id === conductorId);
    const zona = ZONAS.find(z => z.id === zonaId);
    if (!conductor || !zona) return;

    const ahora = new Date();
    const peru = new Date(ahora.toLocaleString('en-US', { timeZone: 'America/Lima' }));
    const fechaPeru = `${peru.getFullYear()}-${String(peru.getMonth() + 1).padStart(2, '0')}-${String(peru.getDate()).padStart(2, '0')}`;
    const numeroTicket = `TK-${ahora.getFullYear()}${(ahora.getMonth() + 1).toString().padStart(2, '0')}${ahora.getDate().toString().padStart(2, '0')}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    // Actualizar cada pedido del grupo
    resultadosCompletos.forEach(resultado => {
      const bloquesPesaje: BloquePesaje[] = resultado.pesadas.map((p, i) => ({
        numero: i + 1,
        tamano: 0,
        pesoBruto: p.peso,
        tipoContenedor: resultado.tipoContenedor,
        pesoContenedor: 0,
        cantidadContenedores: 0,
      }));

      const pedidoActualizado: PedidoConfirmado = {
        ...resultado.pedido,
        pesoBrutoTotal: resultado.pesoBrutoTotal,
        pesoNetoTotal: resultado.pesoNetoTotal,
        pesoKg: resultado.pesoNetoTotal,
        pesoTotalContenedores: resultado.pesoContenedoresTotal,
        cantidadTotalContenedores: resultado.cantidadContenedores,
        bloquesPesaje,
        conductor: conductor.nombre,
        zonaEntrega: zona.nombre,
        estado: 'En Despacho',
        ticketEmitido: true,
        fechaPesaje: fechaPeru,
        horaPesaje: ahora.toTimeString().slice(0, 5),
        numeroTicket,
      };

      updatePedidoConfirmado(resultado.pedidoId, pedidoActualizado);
    });

    // Generar datos del ticket consolidado
    const totales = {
      pesoBrutoTotal: resultadosCompletos.reduce((s, r) => s + r.pesoBrutoTotal, 0),
      pesoContenedoresTotal: resultadosCompletos.reduce((s, r) => s + r.pesoContenedoresTotal, 0),
      pesoNetoTotal: resultadosCompletos.reduce((s, r) => s + r.pesoNetoTotal, 0),
    };

    setTicketVisible({
      grupoId: grupoActual.grupoId,
      cliente: grupoActual.pedidos[0].cliente,
      pedidos: resultadosCompletos,
      totales,
      conductor: conductor.nombre,
      conductorPlaca: conductor.placa,
      zona: zona.nombre,
      fechaEmision: ahora.toLocaleDateString('es-PE'),
      horaEmision: ahora.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' }),
      numeroTicket,
    });

    // Reset
    setVista('clientes');
    setGrupoActual(null);
    setOrdenActualIdx(0);
    setResultadosCompletos([]);
    resetearOrdenActual();
    setConductorId('');
    setZonaId('');
    setZonaBloqueada(false);
    broadcastRef.current?.postMessage({ type: 'ticket-emitido', ticket: numeroTicket, pesoTotal: totales.pesoBrutoTotal });
    toast.success(`Ticket ${numeroTicket} emitido — ${resultadosCompletos.length} pedido(s)`);
  };

  const abrirPantallaDisplay = () => {
    window.open(`${window.location.origin}/pesaje-display`, 'PesajeDisplay', 'width=800,height=600,menubar=no,toolbar=no');
  };

  const handlePrint = () => {
    if (!ticketRef.current) return;
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.write(`<!DOCTYPE html><html><head><title>Ticket</title>
      <style>
        *{margin:0;padding:0;box-sizing:border-box;}
        body{font-family:sans-serif;background:#fff;color:#000;display:flex;justify-content:center;padding:10px;}
        body>div{display:grid;grid-template-columns:1fr 1fr;gap:20px;width:100%;max-width:750px;}
        .ticket{border:2px solid #ccc;border-radius:12px;padding:18px;page-break-inside:avoid;}
        .ticket *{color:#000!important;background:transparent!important;border-color:#ccc!important;}
        table{width:100%;font-size:10px;border-collapse:collapse;}
        table th,table td{border:1px solid #ddd;padding:3px 5px;}
        table th{background:#f5f5f5!important;font-weight:700;}
        @media print{body{padding:0;}}
      </style></head><body>
      ${ticketRef.current.innerHTML}
      <script>window.onload=function(){window.print();window.onafterprint=function(){window.close();};};<\/script>
    </body></html>`);
    printWindow.document.close();
  };

  // ===================== RENDER =====================
  return (
    <div className="space-y-4">

      {/* ══════════ HEADER ══════════ */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {vista !== 'clientes' && (
            <button onClick={handleVolver} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-gray-400 hover:text-white transition-colors" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <ArrowLeft className="w-3.5 h-3.5" /> Volver
            </button>
          )}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg" style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.15)' }}>
            <Package className="w-4 h-4 text-amber-500" />
            <span className="text-sm font-bold text-amber-400">{pedidosEnPesaje.length}</span>
            <span className="text-xs text-gray-500">en cola</span>
          </div>
          {vista !== 'clientes' && grupoActual && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg" style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.15)' }}>
              <Users className="w-4 h-4 text-green-500" />
              <span className="text-sm font-semibold text-green-400">{grupoActual.pedidos[0].cliente}</span>
              <span className="text-[10px] text-gray-500">·</span>
              <span className="text-xs text-gray-400">{vista === 'entrega' ? 'Asignando entrega' : `Pedido ${ordenActualIdx + 1} de ${grupoActual.pedidos.length}`}</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button onClick={abrirPantallaDisplay} className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold" style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)', color: '#60a5fa' }}>
            <Monitor className="w-3.5 h-3.5" /> Display
          </button>
          <button
            onClick={() => { if (scale.connected) { scale.disconnect(); setModoManual(true); } else { scale.connect().then(ok => { if (ok) setModoManual(false); }); } }}
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold"
            style={{ background: scale.connected ? 'rgba(34,197,94,0.08)' : 'rgba(245,158,11,0.08)', border: `1px solid ${scale.connected ? 'rgba(34,197,94,0.2)' : 'rgba(245,158,11,0.2)'}`, color: scale.connected ? '#22c55e' : '#f59e0b' }}
          >
            {scale.connected ? <Wifi className="w-3.5 h-3.5" /> : <Usb className="w-3.5 h-3.5" />}
            {scale.connected ? 'Conectada' : 'Balanza'}
          </button>
        </div>
      </div>

      {/* ══════════ VISTA: LISTA DE CLIENTES ══════════ */}
      {vista === 'clientes' && (
        <div className="space-y-2">
          {clientesEnPesaje.length === 0 ? (
            <div className="flex-1 rounded-xl p-10 text-center" style={{ background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.06)' }}>
              <Scale className="w-10 h-10 mx-auto mb-3 text-gray-800" />
              <p className="text-gray-600 text-sm">Sin pedidos en cola de pesaje</p>
              <p className="text-gray-700 text-xs mt-1">Los pedidos llegarán aquí desde Seguimiento de Pedidos</p>
            </div>
          ) : (
            clientesEnPesaje.map((clienteData, cIdx) => (
              <div key={clienteData.cliente} className="rounded-xl overflow-hidden transition-all duration-200" style={{ background: 'rgba(255,255,255,0.02)', border: clienteExpandido === clienteData.cliente ? '2px solid rgba(34,197,94,0.3)' : '1px solid rgba(255,255,255,0.06)' }}>
                {/* Cabecera del cliente */}
                <button
                  onClick={() => setClienteExpandido(clienteExpandido === clienteData.cliente ? null : clienteData.cliente)}
                  className="w-full flex items-center gap-4 px-5 py-4 text-left hover:bg-white/[0.02] transition-colors"
                >
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black flex-shrink-0"
                    style={{ background: clienteExpandido === clienteData.cliente ? 'rgba(34,197,94,0.15)' : 'rgba(255,255,255,0.05)', color: clienteExpandido === clienteData.cliente ? '#22c55e' : '#555' }}>
                    {cIdx + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-base font-bold text-white truncate">{clienteData.cliente}</div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] text-gray-500">{clienteData.totalPedidos} pedido{clienteData.totalPedidos > 1 ? 's' : ''}</span>
                      <span className="text-[10px] text-gray-700">·</span>
                      <span className="text-[10px] text-gray-500">{clienteData.grupos.length} lote{clienteData.grupos.length > 1 ? 's' : ''}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="px-2.5 py-1 rounded-lg text-xs font-bold" style={{ background: 'rgba(245,158,11,0.1)', color: '#f59e0b' }}>
                      {clienteData.totalPedidos}
                    </span>
                    {clienteExpandido === clienteData.cliente ? <ChevronDown className="w-4 h-4 text-green-400" /> : <ChevronRight className="w-4 h-4 text-gray-600" />}
                  </div>
                </button>

                {/* Contenido expandido: grupos/lotes */}
                {clienteExpandido === clienteData.cliente && (
                  <div className="px-5 pb-4 space-y-3" style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                    {clienteData.grupos.map((grupo, gIdx) => (
                      <div key={grupo.grupoId} className="rounded-xl p-4 space-y-3" style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.05)' }}>
                        {/* Header del lote */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Layers className="w-4 h-4 text-blue-400/60" />
                            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Lote {gIdx + 1}</span>
                            <span className="text-[10px] text-gray-600">· {grupo.pedidos.length} pedido{grupo.pedidos.length > 1 ? 's' : ''}</span>
                          </div>
                          <button
                            onClick={() => iniciarPesajeGrupo(grupo)}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black text-white transition-all hover:scale-[1.03]"
                            style={{ background: 'linear-gradient(135deg, #0d4a24, #22c55e)', boxShadow: '0 4px 12px rgba(34,197,94,0.3)' }}
                          >
                            <Scale className="w-3.5 h-3.5" /> PESAR
                          </button>
                        </div>

                        {/* Lista de pedidos del lote */}
                        <div className="space-y-1.5">
                          {grupo.pedidos.map((pedido, pIdx) => (
                            <div key={pedido.id} className="flex items-center gap-3 px-3 py-2 rounded-lg" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.03)' }}>
                              <div className="w-5 h-5 rounded flex items-center justify-center text-[9px] font-black flex-shrink-0" style={{ background: 'rgba(59,130,246,0.1)', color: '#3b82f6' }}>
                                {pIdx + 1}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="text-xs font-mono text-gray-400">{pedido.numeroPedido || 'S/N'}</span>
                                  <span className="text-xs font-semibold text-white truncate">{pedido.tipoAve}</span>
                                </div>
                                <div className="flex items-center gap-2 mt-0.5">
                                  <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: 'rgba(59,130,246,0.08)', color: '#3b82f6' }}>{pedido.presentacion}</span>
                                  <span className="text-[10px] text-gray-600">{pedido.cantidad} unids.</span>
                                  {pedido.cantidadJabas && (
                                    <span className="text-[10px] font-bold flex items-center gap-0.5" style={{ color: '#f59e0b' }}>
                                      <Lock className="w-2.5 h-2.5" />{pedido.cantidadJabas}j
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* ══════════ VISTA: PESAJE SECUENCIAL ══════════ */}
      {vista === 'pesaje' && grupoActual && ordenActual && (
        <div className="space-y-4">

          {/* Barra de progreso del grupo */}
          <div className="rounded-xl p-3" style={{ background: 'rgba(34,197,94,0.04)', border: '1px solid rgba(34,197,94,0.12)' }}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold text-green-500 uppercase tracking-wider">Progreso del Lote</span>
              <span className="text-xs font-bold text-green-400">{resultadosCompletos.length}/{grupoActual.pedidos.length}</span>
            </div>
            <div className="flex gap-1">
              {grupoActual.pedidos.map((p, i) => (
                <div key={p.id} className="flex-1 h-2 rounded-full transition-all duration-300" style={{
                  background: i < resultadosCompletos.length ? '#22c55e' : i === ordenActualIdx ? 'rgba(245,158,11,0.6)' : 'rgba(255,255,255,0.06)',
                }} />
              ))}
            </div>
            {/* Mini lista de pedidos con estado */}
            <div className="flex flex-wrap gap-1.5 mt-2">
              {grupoActual.pedidos.map((p, i) => (
                <span key={p.id} className="text-[10px] px-2 py-0.5 rounded-full font-mono" style={{
                  background: i < resultadosCompletos.length ? 'rgba(34,197,94,0.1)' : i === ordenActualIdx ? 'rgba(245,158,11,0.1)' : 'rgba(255,255,255,0.03)',
                  color: i < resultadosCompletos.length ? '#22c55e' : i === ordenActualIdx ? '#f59e0b' : '#555',
                  border: `1px solid ${i < resultadosCompletos.length ? 'rgba(34,197,94,0.2)' : i === ordenActualIdx ? 'rgba(245,158,11,0.2)' : 'rgba(255,255,255,0.05)'}`,
                }}>
                  {i < resultadosCompletos.length ? '✓' : i === ordenActualIdx ? '●' : '○'} {p.numeroPedido || `#${i + 1}`}
                </span>
              ))}
            </div>
          </div>

          {/* Cabecera del pedido actual */}
          <div className="rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3" style={{ background: 'rgba(34,197,94,0.04)', border: '1px solid rgba(34,197,94,0.15)' }}>
            <div className="flex items-center gap-4">
              <div className="p-2.5 rounded-xl" style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)' }}>
                <User className="w-5 h-5 text-green-400" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">{ordenActual.cliente}</h2>
                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                  <span className="text-xs font-mono px-2 py-0.5 rounded-md" style={{ background: 'rgba(255,255,255,0.06)', color: '#aaa' }}>{ordenActual.numeroPedido || 'S/N'}</span>
                  <span className="px-2 py-0.5 rounded-md text-xs font-semibold" style={{ background: 'rgba(34,197,94,0.12)', color: '#22c55e' }}>{ordenActual.tipoAve}</span>
                  <span className="px-2 py-0.5 rounded-md text-xs" style={{ background: 'rgba(59,130,246,0.1)', color: '#3b82f6' }}>{ordenActual.presentacion}</span>
                  <span className="px-2 py-0.5 rounded-md text-xs" style={{ background: 'rgba(168,85,247,0.1)', color: '#a855f7' }}>{ordenActual.cantidad} unids.</span>
                  {ordenActual.cantidadJabas && (
                    <span className="px-2 py-0.5 rounded-md text-xs font-bold flex items-center gap-1" style={{ background: 'rgba(245,158,11,0.15)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.3)' }}>
                      <Lock className="w-3 h-3" /> {ordenActual.cantidadJabas} jabas
                    </span>
                  )}
                  {zonaBloqueada && zonaSeleccionada && (
                    <span className="px-2 py-0.5 rounded-md text-xs font-bold flex items-center gap-1" style={{ background: 'rgba(168,85,247,0.12)', color: '#a855f7', border: '1px solid rgba(168,85,247,0.3)' }}>
                      <Lock className="w-3 h-3" /> {zonaSeleccionada.nombre.split(' - ')[0]}
                    </span>
                  )}
                </div>
              </div>
            </div>
            {faseOrden === 'pesando' && (
              <button onClick={() => setModoManual(!modoManual)} className="text-xs px-3 py-1.5 rounded-lg font-semibold self-start sm:self-auto"
                style={{ background: modoManual ? 'rgba(34,197,94,0.1)' : 'rgba(245,158,11,0.1)', border: `1px solid ${modoManual ? 'rgba(34,197,94,0.25)' : 'rgba(245,158,11,0.25)'}`, color: modoManual ? '#22c55e' : '#f59e0b' }}>
                {modoManual ? '⌨ Manual' : '⚖ Balanza'}
              </button>
            )}
          </div>

          {/* Info jabas Vivo */}
          {esVivo && totalJabasPedido > 0 && (
            <div className="grid grid-cols-3 gap-2 rounded-xl p-3" style={{ background: 'rgba(245,158,11,0.04)', border: '1px solid rgba(245,158,11,0.15)' }}>
              <div className="text-center rounded-lg py-2 px-3" style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(245,158,11,0.1)' }}>
                <div className="text-[10px] text-amber-500/70 font-bold uppercase tracking-wider">Total Jabas</div>
                <div className="text-2xl font-black text-amber-400 tabular-nums">{totalJabasPedido}</div>
              </div>
              <div className="text-center rounded-lg py-2 px-3" style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(34,197,94,0.1)' }}>
                <div className="text-[10px] text-green-500/70 font-bold uppercase tracking-wider">Aves/Jaba</div>
                <div className="text-2xl font-black text-green-400 tabular-nums">{unidadesPorJaba || '—'}</div>
              </div>
              <div className="text-center rounded-lg py-2 px-3" style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(59,130,246,0.1)' }}>
                <div className="text-[10px] text-blue-500/70 font-bold uppercase tracking-wider">Total Aves</div>
                <div className="text-2xl font-black text-blue-400 tabular-nums">{totalAvesPedido || '—'}</div>
              </div>
            </div>
          )}

          {/* ─────────── FASE: PESANDO ─────────── */}
          {faseOrden === 'pesando' && (
            <div className="rounded-2xl relative overflow-hidden"
              style={{
                background: 'linear-gradient(160deg, #080808, #111)',
                border: modoManual ? '2px solid rgba(59,130,246,0.35)' : scale.stable ? '2px solid rgba(34,197,94,0.5)' : '2px solid rgba(245,158,11,0.4)',
                boxShadow: modoManual ? '0 0 20px rgba(59,130,246,0.06)' : scale.stable ? '0 0 30px rgba(34,197,94,0.1)' : '0 0 20px rgba(245,158,11,0.06)',
              }}
            >
              {/* Status bar */}
              <div className="flex items-center justify-between px-5 py-3 flex-wrap gap-2" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                <span className="text-[10px] font-black uppercase tracking-[0.2em] px-3 py-1 rounded-full"
                  style={{ background: 'rgba(59,130,246,0.1)', color: '#60a5fa', border: '1px solid rgba(59,130,246,0.2)' }}>
                  {pesadas.length === 0 ? 'LISTO PARA PESAR' : `${pesadas.length} PESADA${pesadas.length > 1 ? 'S' : ''}`}
                </span>
                <div className="flex items-center gap-2">
                  {esVivo && totalJabasPedido > 0 && (
                    <span className="text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full"
                      style={{
                        background: jabasRestantes === 0 ? 'rgba(34,197,94,0.15)' : 'rgba(245,158,11,0.15)',
                        color: jabasRestantes === 0 ? '#22c55e' : '#f59e0b',
                        border: `1px solid ${jabasRestantes === 0 ? 'rgba(34,197,94,0.3)' : 'rgba(245,158,11,0.3)'}`,
                      }}>
                      {jabasRestantes === 0 ? '✓ TODAS PESADAS' : `${jabasRestantes} jabas restantes`}
                    </span>
                  )}
                  {pesadas.length > 0 && (
                    <span className="text-xs font-bold font-mono px-3 py-1 rounded-full"
                      style={{ background: 'rgba(34,197,94,0.1)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.2)' }}>
                      Acumulado: {pesoBrutoTotal.toFixed(2)} kg
                    </span>
                  )}
                </div>
              </div>

              {/* Weight display */}
              <div className="px-6 py-8 text-center">
                {modoManual ? (
                  <div>
                    <div className="relative max-w-xl mx-auto">
                      <Scale className="absolute left-5 top-1/2 -translate-y-1/2 w-7 h-7 text-blue-400/30" />
                      <input
                        type="number" step="0.01" min="0"
                        value={pesoManualInput}
                        onChange={(e) => setPesoManualInput(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter' && pesoActual > 0) sumarPesada(); }}
                        placeholder="0.00"
                        className="w-full pl-16 pr-16 py-6 rounded-2xl text-white text-6xl md:text-7xl font-black font-mono text-center placeholder-gray-800 focus:ring-2 focus:ring-blue-500/30 transition-all"
                        style={{ background: 'rgba(0,0,0,0.6)', border: '1px solid rgba(59,130,246,0.25)' }}
                        autoFocus
                      />
                      <span className="absolute right-5 top-1/2 -translate-y-1/2 text-xl font-bold text-blue-400/30">Kg</span>
                    </div>
                    <p className="text-xs text-gray-600 mt-2">
                      <kbd className="px-1.5 py-0.5 bg-gray-800 rounded text-white text-[10px]">Enter</kbd> para sumar
                    </p>
                  </div>
                ) : (
                  <div>
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <div className={`w-2.5 h-2.5 rounded-full ${scale.connected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
                      <span className="text-xs text-gray-500">{scale.connected ? 'Balanza conectada' : 'Sin conexión'}</span>
                      {scale.connected && (scale.stable
                        ? <span className="text-xs text-green-400 flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Estable</span>
                        : <span className="text-xs text-amber-400">Estabilizando...</span>
                      )}
                    </div>
                    <p className="text-7xl font-black font-mono tabular-nums" style={{ color: scale.stable ? '#22c55e' : '#f59e0b' }}>
                      {scale.currentWeight.toFixed(2)}
                    </p>
                    <p className="text-xl font-light text-gray-600 mt-1">Kilogramos</p>
                  </div>
                )}
              </div>

              {/* Jabas input — solo Vivo */}
              {esVivo && totalJabasPedido > 0 && jabasRestantes > 0 && (
                <div className="px-6 pb-2">
                  <div className="max-w-xs mx-auto flex items-center gap-3 p-3 rounded-xl"
                    style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.2)' }}>
                    <Box className="w-5 h-5 text-amber-400/60 flex-shrink-0" />
                    <div className="flex-1">
                      <label className="text-[10px] text-amber-400 font-bold uppercase tracking-wider">Jabas en esta pesada</label>
                      <input type="number" min="1" max={jabasRestantes}
                        value={jabasEnEstaPesada}
                        onChange={(e) => setJabasEnEstaPesada(e.target.value)}
                        placeholder={`1-${jabasRestantes}`}
                        className="w-full mt-1 px-3 py-2 rounded-lg text-white text-xl font-black font-mono text-center placeholder-gray-700 focus:ring-2 focus:ring-amber-500/30 transition-all"
                        style={{ background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(245,158,11,0.3)' }} />
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="text-[10px] text-gray-500">quedan</div>
                      <div className="text-lg font-black text-amber-400 tabular-nums">{jabasRestantes}</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Pesadas chips */}
              {pesadas.length > 0 && (
                <div className="flex items-center justify-center gap-1.5 flex-wrap px-6 pb-3">
                  {pesadas.map(p => (
                    <span key={p.numero} className="text-[11px] font-mono px-2.5 py-1 rounded-full"
                      style={{ background: 'rgba(34,197,94,0.08)', color: '#4ade80', border: '1px solid rgba(34,197,94,0.15)' }}>
                      #{p.numero}: {p.peso.toFixed(2)}kg{p.jabas ? ` (${p.jabas}j)` : ''}
                    </span>
                  ))}
                </div>
              )}

              {/* Action buttons */}
              {(() => {
                const sumarDisabled = pesoActual <= 0 || (esVivo && totalJabasPedido > 0 && (jabasInput <= 0 || jabasInput > jabasRestantes));
                const sumarActive = !sumarDisabled;
                const terminarDisabled = pesadas.length === 0 || (esVivo && totalJabasPedido > 0 && jabasRestantes > 0);
                const terminarActive = !terminarDisabled;
                return (
                  <div className="grid grid-cols-2 gap-3 px-6 pb-6">
                    <button onClick={sumarPesada} disabled={sumarDisabled}
                      className="py-4 rounded-xl font-black text-white text-base transition-all hover:scale-[1.02] disabled:opacity-20 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      style={{ background: sumarActive ? 'linear-gradient(165deg, #1e3a5f, #1d4ed8)' : 'rgba(255,255,255,0.03)', boxShadow: sumarActive ? '0 8px 20px -6px rgba(37,99,235,0.4)' : 'none' }}>
                      <Plus className="w-5 h-5" /> SUMAR
                      {sumarActive && <span className="text-sm font-mono bg-white/15 px-2 py-0.5 rounded-lg">{pesoActual.toFixed(2)}{jabasInput > 0 ? ` · ${jabasInput}j` : ''}</span>}
                    </button>
                    <button onClick={terminarPesaje} disabled={terminarDisabled}
                      className="py-4 rounded-xl font-black text-white text-base transition-all hover:scale-[1.02] disabled:opacity-20 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      style={{ background: terminarActive ? 'linear-gradient(165deg, #0a4d2a, #22c55e)' : 'rgba(255,255,255,0.03)', boxShadow: terminarActive ? '0 8px 20px -6px rgba(34,197,94,0.4)' : 'none' }}>
                      <CheckCircle className="w-5 h-5" /> TERMINAR
                      {terminarActive && <span className="text-sm font-mono bg-white/15 px-2 py-0.5 rounded-lg">{pesoBrutoTotal.toFixed(2)}</span>}
                    </button>
                  </div>
                );
              })()}

              {pesadas.length > 0 && (
                <div className="text-center pb-4">
                  <button onClick={quitarUltimaPesada} className="text-xs text-gray-600 hover:text-amber-400 transition-colors flex items-center gap-1 mx-auto">
                    <RotateCcw className="w-3 h-3" /> Deshacer última
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ─────────── FASE: CONFIRMAR CONTENEDOR ─────────── */}
          {faseOrden === 'confirmando-contenedor' && (
            <div className="rounded-2xl overflow-hidden"
              style={{ background: 'linear-gradient(160deg, #080808, #111)', border: '2px solid rgba(245,158,11,0.35)' }}>

              <div className="px-5 py-4 text-center" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full mb-2" style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)' }}>
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  <span className="text-xs font-bold text-green-400">PESAJE COMPLETADO</span>
                </div>
                <p className="text-4xl font-black font-mono text-white tabular-nums">
                  {pesoBrutoTotal.toFixed(2)} <span className="text-lg text-gray-500 font-light">kg bruto</span>
                </p>
                <div className="flex justify-center gap-1.5 flex-wrap mt-2">
                  {pesadas.map(p => (
                    <span key={p.numero} className="text-[10px] font-mono px-2 py-0.5 rounded-full"
                      style={{ background: 'rgba(34,197,94,0.06)', color: '#4ade80', border: '1px solid rgba(34,197,94,0.1)' }}>
                      #{p.numero}: {p.peso.toFixed(2)}{p.jabas ? ` (${p.jabas}j)` : ''}
                    </span>
                  ))}
                </div>
              </div>

              <div className="p-6 space-y-5">
                <div className="text-center">
                  <p className="text-amber-300 text-lg font-black uppercase tracking-wide">
                    {esVivo ? 'Tipo de jaba utilizada' : '¿Qué tipo de contenedor se usó?'}
                  </p>
                  {esVivo && cantidadBloqueada && ordenActual?.cantidadJabas && (
                    <div className="flex items-center justify-center gap-2 mt-1 text-xs text-amber-500">
                      <Lock className="w-3.5 h-3.5" />
                      <span>Cantidad bloqueada: <strong>{ordenActual.cantidadJabas} jabas</strong></span>
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap gap-2 justify-center">
                  {opcionesContenedor.map(cont => (
                    <button key={cont.id}
                      onClick={() => !esVivo && setContenedorFinalId(cont.id)}
                      className={`px-4 py-2.5 rounded-xl font-bold transition-all text-center ${!esVivo ? 'hover:scale-105 cursor-pointer' : 'cursor-default'}`}
                      style={{
                        background: contenedorFinalId === cont.id ? 'rgba(245,158,11,0.15)' : 'rgba(255,255,255,0.03)',
                        border: `2px solid ${contenedorFinalId === cont.id ? 'rgba(245,158,11,0.5)' : 'rgba(255,255,255,0.06)'}`,
                        color: contenedorFinalId === cont.id ? '#f59e0b' : '#666',
                      }}>
                      <div className="flex items-center gap-2">
                        {esVivo && <Lock className="w-3 h-3 opacity-50" />}
                        <div>
                          <div className="text-sm">{cont.tipo}</div>
                          <div className="text-[10px] opacity-50 font-mono">{esVivo ? `${pesoJabaEditable} kg/u` : `${cont.peso} kg/u`}</div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>

                <div>
                  <p className="text-center text-sm font-medium text-gray-400 mb-3">
                    {esVivo ? 'Cantidad de jabas' : '¿Cuántos contenedores?'}
                  </p>
                  {cantidadBloqueada ? (
                    <div className="relative max-w-xs mx-auto flex items-center justify-center gap-3 py-4 rounded-xl"
                      style={{ background: 'rgba(245,158,11,0.06)', border: '2px solid rgba(245,158,11,0.3)' }}>
                      <Lock className="w-5 h-5 text-amber-400" />
                      <span className="text-4xl font-black font-mono text-amber-400 tabular-nums">{cantidadContenedoresInput}</span>
                      <div className="text-left">
                        <div className="text-xs text-amber-500 font-bold">jabas</div>
                        <div className="text-[10px] text-gray-600">según pedido</div>
                      </div>
                    </div>
                  ) : (
                    <div className="relative max-w-xs mx-auto">
                      <Box className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-amber-400/30" />
                      <input type="number" min="1"
                        value={cantidadContenedoresInput}
                        onChange={(e) => setCantidadContenedoresInput(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') confirmarContenedorYAvanzar(); }}
                        placeholder="Ej: 5"
                        className="w-full pl-12 pr-6 py-4 rounded-xl text-white text-4xl font-black font-mono text-center placeholder-gray-700 focus:ring-2 focus:ring-amber-500/30 transition-all"
                        style={{ background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(245,158,11,0.3)' }}
                        autoFocus
                      />
                    </div>
                  )}
                </div>

                {contenedorFinalId && cantidadPreview > 0 && (
                  <div className="grid grid-cols-3 gap-2 p-3 rounded-xl text-center"
                    style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <div>
                      <div className="text-[10px] text-gray-500 mb-0.5">Peso Bruto</div>
                      <div className="text-white font-bold font-mono tabular-nums">{pesoBrutoTotal.toFixed(2)} kg</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-gray-500 mb-0.5">Tara ({cantidadPreview}×{esVivo ? pesoJabaEditable : contSeleccionadoPreview?.peso})</div>
                      <div className="text-amber-400 font-bold font-mono tabular-nums">{taraPreview.toFixed(2)} kg</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-gray-500 mb-0.5">Peso Neto</div>
                      <div className="text-green-400 font-black font-mono text-lg tabular-nums">{netoPreview.toFixed(2)} kg</div>
                    </div>
                  </div>
                )}

                <div className="flex gap-3">
                  <button onClick={() => setFaseOrden('pesando')}
                    className="flex-1 py-3 rounded-xl text-gray-400 font-semibold flex items-center justify-center gap-2 hover:bg-white/5 transition-all"
                    style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
                    <RotateCcw className="w-4 h-4" /> Volver
                  </button>
                  <button onClick={confirmarContenedorYAvanzar} disabled={!contenedorFinalId || cantidadPreview <= 0}
                    className="flex-[2] py-3 rounded-xl text-white font-black text-base transition-all hover:scale-[1.01] disabled:opacity-20 flex items-center justify-center gap-2"
                    style={{ background: 'linear-gradient(135deg, #78350f, #d97706)', boxShadow: '0 4px 15px rgba(245,158,11,0.25)' }}>
                    <CheckCircle className="w-5 h-5" />
                    {ordenActualIdx < (grupoActual?.pedidos.length || 1) - 1 ? 'CONFIRMAR Y SIGUIENTE' : 'CONFIRMAR Y FINALIZAR'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ══════════ VISTA: ASIGNAR ENTREGA ══════════ */}
      {vista === 'entrega' && grupoActual && (
        <div className="space-y-4">
          {/* Resumen de todos los pedidos pesados */}
          <div className="rounded-2xl overflow-hidden"
            style={{ background: 'linear-gradient(160deg, rgba(34,197,94,0.03), #080808)', border: '2px solid rgba(34,197,94,0.3)' }}>

            <div className="px-5 py-4 text-center" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full mb-3" style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)' }}>
                <CheckCircle className="w-4 h-4 text-green-400" />
                <span className="text-xs font-bold text-green-400">TODOS LOS PEDIDOS PESADOS</span>
              </div>

              {/* Resumen por pedido */}
              <div className="space-y-2 mb-4">
                {resultadosCompletos.map((r, i) => (
                  <div key={r.pedidoId} className="flex items-center justify-between px-4 py-2.5 rounded-xl" style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-black" style={{ background: 'rgba(34,197,94,0.12)', color: '#22c55e' }}>
                        {i + 1}
                      </span>
                      <div className="text-left">
                        <div className="text-xs font-semibold text-white">{r.pedido.tipoAve}</div>
                        <div className="text-[10px] text-gray-500">{r.pedido.presentacion} · {r.pesadas.length} pesada{r.pesadas.length > 1 ? 's' : ''}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-black text-white tabular-nums">{r.pesoBrutoTotal.toFixed(2)} kg</div>
                      <div className="text-[10px] text-gray-600">bruto</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Totales generales */}
              <div className="flex justify-center">
                <div className="rounded-xl p-4 min-w-[160px]" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <div className="text-[10px] text-gray-500 mb-0.5 text-center">Bruto Total</div>
                  <div className="text-2xl font-black text-white tabular-nums text-center">
                    {resultadosCompletos.reduce((s, r) => s + r.pesoBrutoTotal, 0).toFixed(2)}
                  </div>
                  <div className="text-[10px] text-gray-600 text-center">kg</div>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Asignar Entrega (para todo el lote)</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Conductor */}
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-400" />
                  <select value={conductorId} onChange={(e) => setConductorId(e.target.value)}
                    className="w-full pl-10 pr-3 py-3 rounded-xl text-white text-sm appearance-none"
                    style={{ background: 'rgba(0,0,0,0.35)', border: '1px solid rgba(59,130,246,0.2)' }}>
                    <option value="">Seleccionar conductor...</option>
                    {CONDUCTORES.map(c => <option key={c.id} value={c.id} className="bg-gray-900">{c.nombre} — {c.placa}</option>)}
                  </select>
                </div>

                {/* Zona */}
                {zonaBloqueada ? (
                  <div className="flex items-center gap-3 px-4 py-3 rounded-xl"
                    style={{ background: 'rgba(168,85,247,0.06)', border: '2px solid rgba(168,85,247,0.3)' }}>
                    <Lock className="w-4 h-4 text-purple-400 flex-shrink-0" />
                    <div className="min-w-0">
                      <div className="text-[10px] text-purple-500 font-bold uppercase tracking-wide">Zona (del cliente)</div>
                      <div className="text-white text-xs font-semibold truncate">{zonaSeleccionada?.nombre}</div>
                    </div>
                  </div>
                ) : (
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-400" />
                    <select value={zonaId} onChange={(e) => setZonaId(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 rounded-xl text-white appearance-none"
                      style={{ background: 'rgba(0,0,0,0.35)', border: '1px solid rgba(168,85,247,0.2)' }}>
                      <option value="">Seleccionar zona...</option>
                      {ZONAS.map(z => <option key={z.id} value={z.id} className="bg-gray-900">{z.nombre}</option>)}
                    </select>
                  </div>
                )}
              </div>

              <div className="flex gap-3">
                <button onClick={() => {
                  // Volver al pesaje del último pedido (deshacer último resultado)
                  if (resultadosCompletos.length > 0) {
                    const lastResult = resultadosCompletos[resultadosCompletos.length - 1];
                    setResultadosCompletos(resultadosCompletos.slice(0, -1));
                    setOrdenActualIdx(grupoActual.pedidos.findIndex(p => p.id === lastResult.pedidoId));
                    setPesadas(lastResult.pesadas);
                    setFaseOrden('confirmando-contenedor');
                    setContenedorFinalId(lastResult.contenedorId);
                    setCantidadContenedoresInput(String(lastResult.cantidadContenedores));
                    setVista('pesaje');
                  }
                }}
                  className="px-5 py-3 rounded-xl text-gray-400 font-semibold flex items-center gap-2 hover:bg-white/5 transition-all"
                  style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
                  <RotateCcw className="w-4 h-4" /> Volver
                </button>
                <button onClick={handleConfirmarDespacho}
                  className="flex-1 py-3.5 rounded-xl font-black text-white text-base transition-all hover:scale-[1.01] flex items-center justify-center gap-2"
                  style={{ background: 'linear-gradient(135deg, #0d4a24, #166534, #22c55e)', boxShadow: '0 6px 20px -5px rgba(34,197,94,0.35)' }}>
                  <Printer className="w-5 h-5" /> CONFIRMAR Y EMITIR TICKET
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Placeholder cuando no hay selección */}
      {vista === 'clientes' && clientesEnPesaje.length > 0 && !clienteExpandido && (
        <div className="flex items-center justify-center rounded-2xl"
          style={{ background: 'rgba(255,255,255,0.01)', border: '1px dashed rgba(255,255,255,0.05)', minHeight: '30vh' }}>
          <div className="text-center">
            <Users className="w-12 h-12 mx-auto mb-3" style={{ color: 'rgba(34,197,94,0.08)' }} />
            <p className="text-gray-500 text-sm font-medium">Seleccione un cliente de la lista</p>
            <p className="text-gray-700 text-xs mt-1">Expanda el cliente → seleccione un lote → inicie el pesaje</p>
          </div>
        </div>
      )}

      {/* ═══════ MODAL TICKET CONSOLIDADO ═══════ */}
      {ticketVisible && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.85)' }}>
          <div className="bg-gray-950 rounded-3xl border border-gray-800 p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto"
            style={{ boxShadow: '0 0 60px rgba(0,0,0,0.8)' }}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-green-400" /> Tickets de Despacho
              </h2>
              <button onClick={() => setTicketVisible(null)} className="p-2 rounded-xl hover:bg-white/10">
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <div ref={ticketRef} className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {(['CLIENTE', 'NEGOCIO'] as const).map((tipo) => (
                <div key={tipo} className="ticket rounded-2xl p-5 relative overflow-hidden"
                  style={{ background: 'rgba(10,10,10,0.95)', border: '2px solid rgba(51,51,51,0.6)' }}>
                  <div className="absolute top-0 left-0 right-0 h-1"
                    style={{ background: tipo === 'CLIENTE' ? 'linear-gradient(to right, #22c55e, #3b82f6)' : 'linear-gradient(to right, #ccaa00, #f97316)' }} />

                  {/* Encabezado */}
                  <div className="text-center mb-3 pb-2" style={{ borderBottom: '1px dashed #333' }}>
                    <h3 className="text-lg font-extrabold tracking-widest">
                      <span style={{ color: '#22c55e' }}>AVÍCOLA </span><span style={{ color: '#ccaa00' }}>JOSSY</span>
                    </h3>
                    <p className="text-[9px] text-gray-500 tracking-[0.2em] mt-0.5 uppercase">Ticket de Despacho</p>
                  </div>

                  {/* N° ticket */}
                  <div className="text-center py-1.5 px-3 rounded-lg mb-3 font-mono text-xs"
                    style={{ background: 'rgba(204,170,0,0.08)', border: '1px solid rgba(204,170,0,0.2)', color: 'white' }}>
                    {ticketVisible.numeroTicket}
                  </div>

                  {/* Cliente */}
                  <div className="text-center mb-3 pb-2" style={{ borderBottom: '1px dashed #222' }}>
                    <div className="text-[9px] text-gray-600 uppercase tracking-[0.15em] mb-1">Cliente</div>
                    <div className="text-sm font-bold text-white">{ticketVisible.cliente}</div>
                  </div>

                  {/* Bloques de pedidos */}
                  {ticketVisible.pedidos.map((resultado, idx) => (
                    <div key={resultado.pedidoId} className="mb-3 pb-3" style={{ borderBottom: '1px dashed #222' }}>
                      {/* Encabezado del pedido */}
                      <div className="flex items-center gap-2 mb-2">
                        <span className="w-5 h-5 rounded flex items-center justify-center text-[9px] font-black" style={{ background: 'rgba(59,130,246,0.1)', color: '#3b82f6' }}>
                          {idx + 1}
                        </span>
                        <span className="text-[9px] text-gray-500 uppercase tracking-[0.15em] font-bold">
                          {idx === 0 ? 'Pedido Principal' : `Sub-Pedido ${idx}`}
                        </span>
                      </div>

                      {/* Datos del pedido */}
                      <div className="mb-2 pb-1.5" style={{ borderBottom: '1px dotted rgba(255,255,255,0.06)' }}>
                        <p className="text-[8px] text-gray-600 uppercase tracking-[0.15em] mb-1">Detalle del Pedido</p>
                        {[
                          ['Producto', resultado.pedido.tipoAve],
                          ['Presentación', resultado.pedido.presentacion],
                          ['Cantidad', `${resultado.pedido.cantidad} unids.`],
                        ].map(([label, value]) => (
                          <div key={label} className="flex justify-between text-[11px]">
                            <span className="text-gray-500">{label}</span>
                            <span className="text-white font-bold">{value}</span>
                          </div>
                        ))}
                      </div>

                      {/* Detalle de pesaje */}
                      <div>
                        <p className="text-[8px] text-gray-600 uppercase tracking-[0.15em] mb-1">Detalle del Pesaje</p>
                        <table className="w-full text-[10px]">
                          <thead>
                            <tr>
                              <th className="text-left text-gray-500 pb-1 font-semibold">Pesada</th>
                              <th className="text-right text-gray-500 pb-1 font-semibold">Peso (kg)</th>
                            </tr>
                          </thead>
                          <tbody>
                            {resultado.pesadas.map(p => (
                              <tr key={p.numero} style={{ borderTop: '1px solid rgba(255,255,255,0.03)' }}>
                                <td className="py-0.5 text-gray-400">Pesada {p.numero}</td>
                                <td className="py-0.5 text-right font-mono font-bold text-white">{p.peso.toFixed(2)}</td>
                              </tr>
                            ))}
                            <tr style={{ borderTop: '2px solid rgba(255,255,255,0.1)' }}>
                              <td className="py-0.5 text-gray-300 font-bold text-[10px]">BRUTO</td>
                              <td className="py-0.5 text-right font-mono font-black text-white">{resultado.pesoBrutoTotal.toFixed(2)}</td>
                            </tr>

                          </tbody>
                        </table>
                      </div>
                    </div>
                  ))}

                  {/* Totales generales (si hay más de 1 pedido) */}
                  {ticketVisible.pedidos.length > 1 && (
                    <div className="mb-3 pb-2 rounded-lg p-2" style={{ background: 'rgba(34,197,94,0.04)', border: '1px solid rgba(34,197,94,0.1)' }}>
                      <p className="text-[8px] text-green-500 uppercase tracking-[0.15em] mb-1 font-bold">Totales Generales</p>
                      {[
                        ['Peso Bruto Total', `${ticketVisible.totales.pesoBrutoTotal.toFixed(2)} kg`],
                      ].map(([label, value]) => (
                        <div key={label} className="flex justify-between text-[11px]">
                          <span className="text-gray-400">{label}</span>
                          <span className="text-white font-black">{value}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Datos de Entrega (uno solo para todo) */}
                  <div className="mb-3 pb-2" style={{ borderBottom: '1px dashed #222' }}>
                    <p className="text-[9px] text-gray-600 uppercase tracking-[0.15em] mb-1.5">Datos de Entrega</p>
                    {[
                      ['Conductor', ticketVisible.conductor],
                      ['Placa', ticketVisible.conductorPlaca],
                      ['Zona', ticketVisible.zona],
                    ].map(([label, value]) => (
                      <div key={label} className="flex justify-between text-[11px]">
                        <span className="text-gray-500">{label}</span>
                        <span className="text-white font-bold">{value}</span>
                      </div>
                    ))}
                  </div>

                  <div className="text-center pt-1">
                    <p className="text-[10px] text-gray-500">{ticketVisible.fechaEmision} — {ticketVisible.horaEmision}</p>
                    <p className="text-[8px] text-gray-700 mt-1 tracking-[0.2em] uppercase">Avícola Jossy — Sistema de Gestión</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-3 mt-5">
              <button onClick={handlePrint}
                className="flex-1 py-3.5 rounded-2xl font-bold text-white transition-all hover:scale-[1.02] flex items-center justify-center gap-2"
                style={{ background: 'linear-gradient(135deg, #0d4a24, #22c55e)', boxShadow: '0 6px 18px rgba(34,197,94,0.3)' }}>
                <Printer className="w-5 h-5" /> Imprimir Tickets
              </button>
              <button onClick={() => setTicketVisible(null)}
                className="px-6 py-3.5 rounded-2xl font-bold text-gray-400 flex items-center justify-center"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
