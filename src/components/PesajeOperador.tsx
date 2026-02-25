import { useState, useRef, useEffect, useCallback } from 'react';
import {
  Scale,
  MapPin,
  User,
  Printer,
  CheckCircle,
  Package,
  X,
  FileText,
  Usb,
  Wifi,
  RotateCcw,
  ChevronRight,
  Monitor,
  Box,
  Info,
  Plus,
  Lock,
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
}

interface ContenedorOpcion {
  id: string;
  tipo: string;
  peso: number;
}

interface TicketData {
  pedido: PedidoConfirmado;
  pesadas: PesadaParcial[];
  pesoBrutoTotal: number;
  pesoContenedoresTotal: number;
  pesoNetoTotal: number;
  tipoContenedor: string;
  cantidadContenedores: number;
  pesoUnitarioContenedor: number;
  conductor: string;
  conductorPlaca: string;
  zona: string;
  fechaEmision: string;
  horaEmision: string;
  numeroTicket: string;
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

  const [selectedPedido, setSelectedPedido] = useState<PedidoConfirmado | null>(null);
  const [modoManual, setModoManual] = useState(true);
  const [pesoManualInput, setPesoManualInput] = useState('');

  const [pesadas, setPesadas] = useState<PesadaParcial[]>([]);
  const [fase, setFase] = useState<'pesando' | 'confirmando-contenedor' | 'asignando-entrega'>('pesando');

  const [contenedorFinalId, setContenedorFinalId] = useState('');
  const [cantidadContenedoresInput, setCantidadContenedoresInput] = useState('');
  const [cantidadBloqueada, setCantidadBloqueada] = useState(false);

  const [conductorId, setConductorId] = useState('');
  const [zonaId, setZonaId] = useState('');
  const [zonaBloqueada, setZonaBloqueada] = useState(false); // ← NUEVO

  const [ticketVisible, setTicketVisible] = useState<TicketData | null>(null);
  const ticketRef = useRef<HTMLDivElement>(null);
  const broadcastRef = useRef<BroadcastChannel | null>(null);

  useEffect(() => {
    broadcastRef.current = new BroadcastChannel('pesaje-display');
    return () => broadcastRef.current?.close();
  }, []);

  const pedidosEnPesaje = pedidosConfirmados
    .filter((p) => p.estado === 'En Pesaje')
    .sort((a, b) => a.prioridad - b.prioridad);

  // Vivo → siempre Jaba Estándar; cualquier otra presentación → contenedores del sistema
  const esVivo = !!selectedPedido?.presentacion?.toLowerCase().includes('vivo');

  const opcionesContenedor: ContenedorOpcion[] = esVivo
    ? [JABA_ESTANDAR]
    : contenedores.map(c => ({ id: c.id, tipo: c.tipo, peso: c.peso }));

  const resetearTodo = () => {
    setPesadas([]);
    setFase('pesando');
    setPesoManualInput('');
    setContenedorFinalId('');
    setCantidadContenedoresInput('');
    setCantidadBloqueada(false);
    setConductorId('');
    setZonaId('');
    setZonaBloqueada(false);
  };

  const handleSelectPedido = (pedido: PedidoConfirmado) => {
    setSelectedPedido(pedido);
    resetearTodo();
    setTicketVisible(null);

    // ── Zona: buscar del cliente y bloquear si existe ─────────────
    const clienteObj = clientes.find(c => c.nombre === pedido.cliente);
    if (clienteObj?.zona) {
      const zonaMatch = ZONAS.find(z =>
        z.id === clienteObj.zona ||
        z.nombre.toLowerCase().includes(clienteObj.zona.toLowerCase())
      );
      if (zonaMatch) {
        setZonaId(zonaMatch.id);
        setZonaBloqueada(true); // ← bloquear
      }
    }

    // ── Contenedor: Vivo → Jaba Estándar, otros → contenedores del sistema ──
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

  const pesoActual = modoManual ? parseFloat(pesoManualInput) || 0 : scale.currentWeight;
  const pesoBrutoTotal = pesadas.reduce((sum, p) => sum + p.peso, 0);

  const contSeleccionadoPreview = opcionesContenedor.find(c => c.id === contenedorFinalId);
  const cantidadPreview = parseInt(cantidadContenedoresInput) || 0;
  const taraPreview = (contSeleccionadoPreview?.peso || 0) * cantidadPreview;
  const netoPreview = pesoBrutoTotal - taraPreview;

  const zonaSeleccionada = ZONAS.find(z => z.id === zonaId);

  const sumarPesada = () => {
    if (pesoActual <= 0) { toast.error('El peso debe ser mayor a 0'); return; }
    const nueva: PesadaParcial = { numero: pesadas.length + 1, peso: pesoActual };
    const nuevasPesadas = [...pesadas, nueva];
    setPesadas(nuevasPesadas);
    setPesoManualInput('');
    const acum = nuevasPesadas.reduce((s, p) => s + p.peso, 0);
    broadcastRef.current?.postMessage({ type: 'weight-update', weight: acum, stable: true, timestamp: Date.now() });
    toast.success(`Pesada ${nueva.numero}: ${pesoActual.toFixed(2)} kg → Acumulado: ${acum.toFixed(2)} kg`);
  };

  const quitarUltimaPesada = () => {
    if (pesadas.length === 0) return;
    setPesadas(pesadas.slice(0, -1));
    toast.info('Última pesada eliminada');
  };

  const terminarPesaje = () => {
    if (pesadas.length === 0) { toast.error('Debe registrar al menos una pesada'); return; }
    setFase('confirmando-contenedor');
  };

  const confirmarContenedor = () => {
    if (!contenedorFinalId) { toast.error('Seleccione el tipo de contenedor'); return; }
    if (!cantidadPreview || cantidadPreview <= 0) { toast.error('Ingrese la cantidad de contenedores'); return; }
    setFase('asignando-entrega');
  };

  const handleConfirmar = () => {
    if (!selectedPedido) return;
    if (!conductorId) { toast.error('Seleccione un conductor'); return; }
    if (!zonaId) { toast.error('Seleccione una zona de entrega'); return; }

    const conductor = CONDUCTORES.find(c => c.id === conductorId);
    const zona = ZONAS.find(z => z.id === zonaId);
    const contFinal = opcionesContenedor.find(c => c.id === contenedorFinalId);
    if (!conductor || !zona || !contFinal) return;

    const pesoTotalContenedores = contFinal.peso * cantidadPreview;
    const pesoNeto = pesoBrutoTotal - pesoTotalContenedores;

    const ahora = new Date();
    const numeroTicket = `TK-${ahora.getFullYear()}${(ahora.getMonth() + 1).toString().padStart(2, '0')}${ahora.getDate().toString().padStart(2, '0')}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    const bloquesPesaje: BloquePesaje[] = pesadas.map((p, i) => ({
      numero: i + 1,
      tamano: 0,
      pesoBruto: p.peso,
      tipoContenedor: contFinal.tipo,
      pesoContenedor: 0,
      cantidadContenedores: 0,
    }));

    // Fecha de Lima (America/Lima) para alinear con Cartera y reportes
    const peru = new Date(ahora.toLocaleString('en-US', { timeZone: 'America/Lima' }));
    const fechaPeru = `${peru.getFullYear()}-${String(peru.getMonth() + 1).padStart(2, '0')}-${String(peru.getDate()).padStart(2, '0')}`;

    const pedidoActualizado: PedidoConfirmado = {
      ...selectedPedido,
      pesoBrutoTotal,
      pesoNetoTotal: pesoNeto,
      pesoKg: pesoNeto,
      pesoTotalContenedores,
      cantidadTotalContenedores: cantidadPreview,
      bloquesPesaje,
      conductor: conductor.nombre,
      zonaEntrega: zona.nombre,
      estado: 'En Despacho',
      ticketEmitido: true,
      fechaPesaje: fechaPeru,
      horaPesaje: ahora.toTimeString().slice(0, 5),
      numeroTicket,
    };

    updatePedidoConfirmado(selectedPedido.id, pedidoActualizado);

    setTicketVisible({
      pedido: pedidoActualizado,
      pesadas: [...pesadas],
      pesoBrutoTotal,
      pesoContenedoresTotal: pesoTotalContenedores,
      pesoNetoTotal: pesoNeto,
      tipoContenedor: contFinal.tipo,
      cantidadContenedores: cantidadPreview,
      pesoUnitarioContenedor: contFinal.peso,
      conductor: conductor.nombre,
      conductorPlaca: conductor.placa,
      zona: zona.nombre,
      fechaEmision: ahora.toLocaleDateString('es-PE'),
      horaEmision: ahora.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' }),
      numeroTicket,
    });

    setSelectedPedido(null);
    resetearTodo();
    broadcastRef.current?.postMessage({ type: 'ticket-emitido', ticket: numeroTicket, pesoTotal: pesoBrutoTotal });
    toast.success(`Ticket ${numeroTicket} emitido correctamente`);
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
    <div className="space-y-5">

      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button onClick={abrirPantallaDisplay} className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold" style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.25)', color: '#60a5fa' }}>
            <Monitor className="w-3.5 h-3.5" /> Display
          </button>
          <button
            onClick={() => { if (scale.connected) { scale.disconnect(); setModoManual(true); } else { scale.connect().then(ok => { if (ok) setModoManual(false); }); } }}
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold"
            style={{ background: scale.connected ? 'rgba(34,197,94,0.1)' : 'rgba(245,158,11,0.1)', border: `1px solid ${scale.connected ? 'rgba(34,197,94,0.25)' : 'rgba(245,158,11,0.25)'}`, color: scale.connected ? '#22c55e' : '#f59e0b' }}
          >
            {scale.connected ? <Wifi className="w-3.5 h-3.5" /> : <Usb className="w-3.5 h-3.5" />}
            {scale.connected ? 'Conectada' : 'Balanza'}
          </button>
        </div>
      </div>

      {/* LAYOUT */}
      <div className="flex gap-5" style={{ minHeight: '80vh' }}>

        {/* COLA */}
        <div className="w-72 flex-shrink-0">
          <div className="sticky top-4">
            <div className="flex items-center gap-2 mb-3">
              <Package className="w-4 h-4" style={{ color: '#f59e0b' }} />
              <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Cola de Pesaje</span>
              <span className="ml-auto text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: 'rgba(245,158,11,0.12)', color: '#f59e0b' }}>{pedidosEnPesaje.length}</span>
            </div>
            <div className="space-y-1.5 max-h-[75vh] overflow-y-auto pr-1" style={{ scrollbarWidth: 'thin' }}>
              {pedidosEnPesaje.length === 0 ? (
                <div className="rounded-xl p-8 text-center" style={{ background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.08)' }}>
                  <Scale className="w-10 h-10 mx-auto mb-2" style={{ color: 'rgba(255,255,255,0.06)' }} />
                  <p className="text-gray-600 text-xs">Sin pedidos en cola</p>
                </div>
              ) : (
                pedidosEnPesaje.map((pedido, idx) => (
                  <button
                    key={pedido.id}
                    onClick={() => handleSelectPedido(pedido)}
                    className="w-full text-left rounded-xl px-4 py-3 transition-all duration-200 group"
                    style={{
                      background: selectedPedido?.id === pedido.id ? 'rgba(34,197,94,0.08)' : 'rgba(255,255,255,0.02)',
                      border: selectedPedido?.id === pedido.id ? '2px solid rgba(34,197,94,0.4)' : '1px solid rgba(255,255,255,0.06)',
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black flex-shrink-0"
                        style={{ background: selectedPedido?.id === pedido.id ? 'rgba(34,197,94,0.15)' : 'rgba(255,255,255,0.05)', color: selectedPedido?.id === pedido.id ? '#22c55e' : '#666' }}>
                        {idx + 1}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-semibold text-white truncate group-hover:text-green-300 transition-colors">{pedido.cliente}</div>
                        <div className="text-[10px] text-gray-600 truncate">{pedido.cantidad} · {pedido.presentacion}</div>
                        {pedido.cantidadJabas && (
                          <div className="text-[10px] font-bold flex items-center gap-1" style={{ color: '#f59e0b' }}>
                            <Lock className="w-2.5 h-2.5" /> {pedido.cantidadJabas} jabas
                          </div>
                        )}
                      </div>
                      {selectedPedido?.id === pedido.id && <ChevronRight className="w-4 h-4 text-green-400 flex-shrink-0" />}
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>

        {/* PANEL DERECHO */}
        <div className="flex-1 min-w-0">
          {selectedPedido ? (
            <div className="space-y-4">

              {/* Cabecera del pedido */}
              <div className="rounded-2xl p-4 flex items-center justify-between" style={{ background: 'rgba(34,197,94,0.04)', border: '1px solid rgba(34,197,94,0.15)' }}>
                <div className="flex items-center gap-4">
                  <div className="p-2.5 rounded-xl" style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)' }}>
                    <User className="w-5 h-5 text-green-400" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white">{selectedPedido.cliente}</h2>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      <span className="text-xs font-mono px-2 py-0.5 rounded-md" style={{ background: 'rgba(255,255,255,0.06)', color: '#aaa' }}>{selectedPedido.numeroPedido || 'S/N'}</span>
                      <span className="px-2 py-0.5 rounded-md text-xs font-semibold" style={{ background: 'rgba(34,197,94,0.12)', color: '#22c55e' }}>{selectedPedido.tipoAve}</span>
                      <span className="px-2 py-0.5 rounded-md text-xs" style={{ background: 'rgba(59,130,246,0.1)', color: '#3b82f6' }}>{selectedPedido.presentacion}</span>
                      <span className="px-2 py-0.5 rounded-md text-xs" style={{ background: 'rgba(168,85,247,0.1)', color: '#a855f7' }}>{selectedPedido.cantidad} unids.</span>
                      {selectedPedido.cantidadJabas && (
                        <span className="px-2 py-0.5 rounded-md text-xs font-bold flex items-center gap-1" style={{ background: 'rgba(245,158,11,0.15)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.3)' }}>
                          <Lock className="w-3 h-3" /> {selectedPedido.cantidadJabas} jabas
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
                {fase === 'pesando' && (
                  <button onClick={() => setModoManual(!modoManual)} className="text-xs px-3 py-1.5 rounded-lg font-semibold"
                    style={{ background: modoManual ? 'rgba(34,197,94,0.1)' : 'rgba(245,158,11,0.1)', border: `1px solid ${modoManual ? 'rgba(34,197,94,0.25)' : 'rgba(245,158,11,0.25)'}`, color: modoManual ? '#22c55e' : '#f59e0b' }}>
                    {modoManual ? '⌨ Manual' : '⚖ Balanza'}
                  </button>
                )}
              </div>

              {/* ─────────────── FASE 1: PESANDO ─────────────── */}
              {fase === 'pesando' && (
                <div
                  className="rounded-3xl p-8 text-center relative overflow-hidden"
                  style={{
                    background: 'linear-gradient(145deg, #0a0a0a, #1a1a1a)',
                    border: modoManual ? '3px solid rgba(59,130,246,0.5)' : scale.stable ? '3px solid #22c55e' : '3px solid #f59e0b',
                    boxShadow: modoManual ? '0 0 30px rgba(59,130,246,0.12)' : scale.stable ? '0 0 40px rgba(34,197,94,0.2)' : '0 0 25px rgba(245,158,11,0.1)',
                  }}
                >
                  <div className="absolute top-4 left-4 right-4 flex justify-between items-center flex-wrap gap-2">
                    <span className="text-xs font-black uppercase tracking-[0.2em] px-4 py-1.5 rounded-full"
                      style={{ background: 'rgba(59,130,246,0.12)', color: '#60a5fa', border: '1px solid rgba(59,130,246,0.3)' }}>
                      {pesadas.length === 0 ? 'LISTO PARA PESAR' : `${pesadas.length} PESADA${pesadas.length > 1 ? 'S' : ''}`}
                    </span>
                    {pesadas.length > 0 && (
                      <span className="text-sm font-black font-mono px-4 py-1.5 rounded-full"
                        style={{ background: 'rgba(34,197,94,0.12)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.3)' }}>
                        Acumulado: {pesoBrutoTotal.toFixed(2)} kg
                      </span>
                    )}
                  </div>

                  {modoManual ? (
                    <div className="py-4 mt-10">
                      <div className="relative max-w-2xl mx-auto">
                        <Scale className="absolute left-6 top-1/2 -translate-y-1/2 w-8 h-8 text-blue-400/40" />
                        <input
                          type="number" step="0.01" min="0"
                          value={pesoManualInput}
                          onChange={(e) => setPesoManualInput(e.target.value)}
                          onKeyDown={(e) => { if (e.key === 'Enter' && pesoActual > 0) sumarPesada(); }}
                          placeholder="0.00"
                          className="w-full pl-20 pr-20 py-8 rounded-3xl text-white text-7xl md:text-8xl font-black font-mono text-center placeholder-gray-700 focus:ring-4 transition-all"
                          style={{ background: 'rgba(0,0,0,0.8)', border: '2px solid rgba(59,130,246,0.35)' }}
                          autoFocus
                        />
                        <span className="absolute right-6 top-1/2 -translate-y-1/2 text-2xl font-bold text-blue-400/40">Kg</span>
                      </div>
                      <p className="text-xs text-gray-600 mt-3">
                        <kbd className="px-2 py-0.5 bg-gray-800 rounded text-white text-[10px]">Enter</kbd> o botón <strong className="text-blue-400">+ Sumar</strong>
                      </p>
                    </div>
                  ) : (
                    <div className="py-4 mt-10">
                      <div className="flex items-center justify-center gap-3 mb-3">
                        <div className={`w-3 h-3 rounded-full ${scale.connected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
                        <span className="text-xs text-gray-400">{scale.connected ? 'Balanza conectada' : 'Sin conexión'}</span>
                        {scale.connected && (scale.stable
                          ? <span className="text-xs text-green-400 flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Estable</span>
                          : <span className="text-xs text-amber-400">Estabilizando...</span>
                        )}
                      </div>
                      <p className="text-8xl font-black font-mono" style={{ color: scale.stable ? '#22c55e' : '#f59e0b' }}>
                        {scale.currentWeight.toFixed(2)}
                      </p>
                      <p className="text-2xl font-light text-gray-500 mt-1">Kilogramos</p>
                    </div>
                  )}

                  {pesadas.length > 0 && (
                    <div className="flex items-center justify-center gap-2 flex-wrap mt-3 mb-1">
                      {pesadas.map(p => (
                        <span key={p.numero} className="text-xs font-mono px-3 py-1.5 rounded-full"
                          style={{ background: 'rgba(34,197,94,0.1)', color: '#4ade80', border: '1px solid rgba(34,197,94,0.2)' }}>
                          #{p.numero}: {p.peso.toFixed(2)} kg
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="flex gap-3 max-w-2xl mx-auto mt-5">
                    <button onClick={sumarPesada} disabled={pesoActual <= 0}
                      className="flex-1 py-5 rounded-2xl font-black text-white text-xl transition-all hover:scale-[1.02] disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-3"
                      style={{ background: pesoActual > 0 ? 'linear-gradient(165deg, #1e3a5f, #1d4ed8)' : 'rgba(255,255,255,0.04)', boxShadow: pesoActual > 0 ? '0 12px 25px -8px rgba(37,99,235,0.5)' : 'none' }}>
                      <Plus className="w-7 h-7" />
                      SUMAR
                      {pesoActual > 0 && <span className="text-base font-mono bg-white/20 px-3 py-1 rounded-xl">{pesoActual.toFixed(2)} kg</span>}
                    </button>
                    <button onClick={terminarPesaje} disabled={pesadas.length === 0}
                      className="flex-1 py-5 rounded-2xl font-black text-white text-xl transition-all hover:scale-[1.02] disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-3"
                      style={{ background: pesadas.length > 0 ? 'linear-gradient(165deg, #0a4d2a, #1a6e3c, #2e8b57)' : 'rgba(255,255,255,0.04)', boxShadow: pesadas.length > 0 ? '0 12px 25px -8px rgba(34,197,94,0.5)' : 'none' }}>
                      <CheckCircle className="w-7 h-7" />
                      TERMINAR PESAJE
                      {pesadas.length > 0 && <span className="text-base font-mono bg-white/20 px-3 py-1 rounded-xl">{pesoBrutoTotal.toFixed(2)} kg</span>}
                    </button>
                  </div>

                  {pesadas.length > 0 && (
                    <button onClick={quitarUltimaPesada} className="mt-3 text-xs text-gray-600 hover:text-amber-400 transition-colors flex items-center gap-1 mx-auto">
                      <RotateCcw className="w-3 h-3" /> Deshacer última pesada
                    </button>
                  )}
                </div>
              )}

              {/* ─────────── FASE 2: CONFIRMAR CONTENEDOR ──────────── */}
              {fase === 'confirmando-contenedor' && (
                <div className="rounded-3xl p-8"
                  style={{ background: 'linear-gradient(145deg, #0a0a0a, #1a1a1a)', border: '3px solid rgba(245,158,11,0.45)', boxShadow: '0 0 40px rgba(245,158,11,0.08)' }}>

                  <div className="text-center mb-8">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-3" style={{ background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.3)' }}>
                      <CheckCircle className="w-5 h-5 text-green-400" />
                      <span className="text-sm font-bold text-green-400">PESAJE COMPLETADO</span>
                    </div>
                    <p className="text-6xl font-black font-mono text-white">
                      {pesoBrutoTotal.toFixed(2)} <span className="text-2xl text-gray-500 font-light">kg bruto</span>
                    </p>
                    <div className="flex justify-center gap-2 flex-wrap mt-3">
                      {pesadas.map(p => (
                        <span key={p.numero} className="text-xs font-mono px-3 py-1 rounded-full"
                          style={{ background: 'rgba(34,197,94,0.08)', color: '#4ade80', border: '1px solid rgba(34,197,94,0.15)' }}>
                          #{p.numero}: {p.peso.toFixed(2)} kg
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="max-w-lg mx-auto space-y-6">
                    <div className="text-center">
                      <p className="text-amber-300 text-xl font-black uppercase tracking-wide mb-1">
                        {esVivo ? 'Tipo de jaba utilizada' : '¿Qué tipo de contenedor se usó?'}
                      </p>
                      {esVivo && cantidadBloqueada && selectedPedido?.cantidadJabas && (
                        <div className="flex items-center justify-center gap-2 mt-1 text-xs" style={{ color: '#f59e0b' }}>
                          <Lock className="w-3.5 h-3.5" />
                          <span>Cantidad bloqueada: el pedido indica <strong>{selectedPedido.cantidadJabas} jabas</strong></span>
                        </div>
                      )}
                    </div>

                    {/* Selector de contenedor */}
                    <div className="flex flex-wrap gap-3 justify-center">
                      {opcionesContenedor.map(cont => (
                        <button key={cont.id}
                          onClick={() => !esVivo && setContenedorFinalId(cont.id)}
                          className={`px-5 py-3 rounded-xl font-bold transition-all text-center ${!esVivo ? 'hover:scale-105 cursor-pointer' : 'cursor-default'}`}
                          style={{
                            background: contenedorFinalId === cont.id ? 'rgba(245,158,11,0.18)' : 'rgba(255,255,255,0.04)',
                            border: `2px solid ${contenedorFinalId === cont.id ? 'rgba(245,158,11,0.6)' : 'rgba(255,255,255,0.08)'}`,
                            color: contenedorFinalId === cont.id ? '#f59e0b' : '#777',
                            boxShadow: contenedorFinalId === cont.id ? '0 0 20px rgba(245,158,11,0.12)' : 'none',
                          }}>
                          <div className="flex items-center gap-2">
                            {esVivo && <Lock className="w-3.5 h-3.5 opacity-60" />}
                            <div>
                              <div className="text-base">{cont.tipo}</div>
                              <div className="text-xs opacity-60 font-mono">{cont.peso} kg/u</div>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>

                    {/* Cantidad */}
                    <div>
                      <p className="text-center text-sm font-bold text-gray-300 mb-3">
                        {esVivo ? 'Cantidad de jabas' : '¿Cuántos contenedores?'}
                      </p>
                      {cantidadBloqueada ? (
                        <div className="relative max-w-xs mx-auto flex items-center justify-center gap-3 py-5 rounded-2xl"
                          style={{ background: 'rgba(245,158,11,0.08)', border: '2px solid rgba(245,158,11,0.35)' }}>
                          <Lock className="w-6 h-6 text-amber-400" />
                          <span className="text-5xl font-black font-mono text-amber-400">{cantidadContenedoresInput}</span>
                          <div className="text-left">
                            <div className="text-xs text-amber-500 font-bold">jabas</div>
                            <div className="text-[10px] text-gray-600">según pedido</div>
                          </div>
                        </div>
                      ) : (
                        <div className="relative max-w-xs mx-auto">
                          <Box className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-amber-400/40" />
                          <input type="number" min="1"
                            value={cantidadContenedoresInput}
                            onChange={(e) => setCantidadContenedoresInput(e.target.value)}
                            onKeyDown={(e) => { if (e.key === 'Enter') confirmarContenedor(); }}
                            placeholder="Ej: 5"
                            className="w-full pl-12 pr-6 py-5 rounded-2xl text-white text-5xl font-black font-mono text-center placeholder-gray-700 focus:ring-4 transition-all"
                            style={{ background: 'rgba(0,0,0,0.6)', border: '2px solid rgba(245,158,11,0.4)' }}
                            autoFocus
                          />
                        </div>
                      )}
                    </div>

                    {/* Preview tara/neto */}
                    {contenedorFinalId && cantidadPreview > 0 && (
                      <div className="grid grid-cols-3 gap-3 p-4 rounded-2xl text-center"
                        style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.06)' }}>
                        <div>
                          <div className="text-xs text-gray-500 mb-1">Peso Bruto</div>
                          <div className="text-white font-bold font-mono">{pesoBrutoTotal.toFixed(2)} kg</div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500 mb-1">Tara ({cantidadPreview} × {contSeleccionadoPreview?.peso} kg)</div>
                          <div className="text-amber-400 font-bold font-mono">{taraPreview.toFixed(2)} kg</div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500 mb-1">Peso Neto</div>
                          <div className="text-green-400 font-black font-mono text-lg">{netoPreview.toFixed(2)} kg</div>
                        </div>
                      </div>
                    )}

                    <div className="flex gap-3">
                      <button onClick={() => setFase('pesando')}
                        className="flex-1 py-3 rounded-xl text-gray-400 font-semibold flex items-center justify-center gap-2 hover:bg-white/10 transition-all"
                        style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
                        <RotateCcw className="w-4 h-4" /> Volver a pesar
                      </button>
                      <button onClick={confirmarContenedor} disabled={!contenedorFinalId || cantidadPreview <= 0}
                        className="flex-[2] py-3 rounded-xl text-white font-black text-lg transition-all hover:scale-[1.02] disabled:opacity-30 flex items-center justify-center gap-2"
                        style={{ background: 'linear-gradient(135deg, #78350f, #d97706, #f59e0b)', boxShadow: '0 6px 20px rgba(245,158,11,0.3)' }}>
                        <CheckCircle className="w-5 h-5" /> Confirmar
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* ─────────── FASE 3: ASIGNAR ENTREGA ───────────── */}
              {fase === 'asignando-entrega' && (
                <div className="rounded-3xl p-8 space-y-6"
                  style={{ background: 'linear-gradient(145deg, rgba(34,197,94,0.04), rgba(0,0,0,0.85))', border: '3px solid rgba(34,197,94,0.4)', boxShadow: '0 0 40px rgba(34,197,94,0.08)' }}>

                  <div className="text-center mb-2">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-5" style={{ background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.3)' }}>
                      <CheckCircle className="w-5 h-5 text-green-400" />
                      <span className="text-sm font-bold text-green-400">LISTO PARA DESPACHO</span>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="rounded-2xl p-4" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                        <div className="text-xs text-gray-500 mb-1">Pesadas</div>
                        <div className="text-3xl font-black text-white">{pesadas.length}</div>
                        <div className="text-[10px] text-gray-600 mt-1">{pesadas.map(p => p.peso.toFixed(1)).join(' + ')} kg</div>
                      </div>
                      <div className="rounded-2xl p-4" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                        <div className="text-xs text-gray-500 mb-1">{esVivo ? 'Jabas' : 'Contenedores'}</div>
                        <div className="text-3xl font-black text-amber-400 flex items-center justify-center gap-1">
                          {cantidadBloqueada && <Lock className="w-5 h-5" />}
                          {cantidadPreview}
                        </div>
                        <div className="text-[10px] text-gray-600 mt-1">{contSeleccionadoPreview?.tipo}</div>
                      </div>
                      <div className="rounded-2xl p-4" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                        <div className="text-xs text-gray-500 mb-1">Tara total</div>
                        <div className="text-3xl font-black text-orange-400">{taraPreview.toFixed(2)}</div>
                        <div className="text-[10px] text-gray-600 mt-1">kg</div>
                      </div>
                      <div className="rounded-2xl p-4" style={{ background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.2)' }}>
                        <div className="text-xs text-green-600 mb-1">Peso Neto</div>
                        <div className="text-3xl font-black text-green-400">{netoPreview.toFixed(2)}</div>
                        <div className="text-[10px] text-green-700 mt-1">kg neto</div>
                      </div>
                    </div>
                  </div>

                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Asignar Entrega</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Conductor */}
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-400" />
                      <select value={conductorId} onChange={(e) => setConductorId(e.target.value)}
                        className="w-full pl-10 pr-3 py-3 rounded-xl text-white text-sm appearance-none"
                        style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(59,130,246,0.25)' }}>
                        <option value="">Seleccionar conductor...</option>
                        {CONDUCTORES.map(c => <option key={c.id} value={c.id} className="bg-gray-900">{c.nombre} — {c.placa}</option>)}
                      </select>
                    </div>

                    {/* Zona: bloqueada o editable */}
                    {zonaBloqueada ? (
                      <div className="flex items-center gap-3 px-4 py-3 rounded-xl"
                        style={{ background: 'rgba(168,85,247,0.08)', border: '2px solid rgba(168,85,247,0.35)' }}>
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
                          style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(168,85,247,0.25)' }}>
                          <option value="">Seleccionar zona...</option>
                          {ZONAS.map(z => <option key={z.id} value={z.id} className="bg-gray-900">{z.nombre}</option>)}
                        </select>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-3">
                    <button onClick={() => setFase('confirmando-contenedor')}
                      className="px-5 py-3 rounded-xl text-gray-400 font-semibold flex items-center gap-2 hover:bg-white/10 transition-all"
                      style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
                      <RotateCcw className="w-4 h-4" /> Volver
                    </button>
                    <button onClick={handleConfirmar}
                      className="flex-1 py-4 rounded-2xl font-black text-white text-lg transition-all hover:scale-[1.01] flex items-center justify-center gap-3"
                      style={{ background: 'linear-gradient(135deg, #0d4a24, #166534, #22c55e)', boxShadow: '0 8px 25px -5px rgba(34,197,94,0.4)' }}>
                      <Printer className="w-6 h-6" />
                      CONFIRMAR Y EMITIR TICKET
                    </button>
                  </div>
                </div>
              )}

            </div>
          ) : (
            <div className="h-full flex items-center justify-center rounded-2xl"
              style={{ background: 'rgba(255,255,255,0.015)', border: '1px dashed rgba(255,255,255,0.06)', minHeight: '60vh' }}>
              <div className="text-center">
                <Scale className="w-20 h-20 mx-auto mb-4" style={{ color: 'rgba(34,197,94,0.1)' }} />
                <p className="text-gray-500 text-base font-medium">Seleccione un pedido de la cola</p>
                <p className="text-gray-700 text-xs mt-1">Suma las pesadas → confirma jabas/contenedores → emite ticket</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ===== MODAL TICKET ===== */}
      {ticketVisible && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.85)' }}>
          <div className="bg-gray-950 rounded-3xl border border-gray-800 p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto"
            style={{ boxShadow: '0 0 60px rgba(0,0,0,0.8)' }}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-green-400" /> Tickets Emitidos  
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
                    <p className="text-[9px] text-gray-500 tracking-[0.2em] mt-0.5 uppercase">Ticket de Pedido</p>
                  </div>

                  {/* N° ticket */}
                  <div className="text-center py-1.5 px-3 rounded-lg mb-3 font-mono text-xs"
                    style={{ background: 'rgba(204,170,0,0.08)', border: '1px solid rgba(204,170,0,0.2)', color: 'white' }}>
                    {ticketVisible.numeroTicket}
                  </div>

                  {/* Datos pedido */}
                  <div className="mb-3 pb-2" style={{ borderBottom: '1px dashed #222' }}>
                    <p className="text-[9px] text-gray-600 uppercase tracking-[0.15em] mb-1.5">Datos del Pedido</p>
                    {[
                      ['Cliente', ticketVisible.pedido.cliente],
                      ['Producto', ticketVisible.pedido.tipoAve],
                      ['Presentación', ticketVisible.pedido.presentacion],
                    ].map(([label, value]) => (
                      <div key={label} className="flex justify-between text-[11px]">
                        <span className="text-gray-500">{label}</span>
                        <span className="text-white font-bold">{value}</span>
                      </div>
                    ))}
                  </div>

                  {/* Detalle pesadas */}
                  <div className="mb-3 pb-2" style={{ borderBottom: '1px dashed #222' }}>
                    <p className="text-[9px] text-gray-600 uppercase tracking-[0.15em] mb-1.5">Detalle de Pesaje</p>
                    <table className="w-full text-[10px]">
                      <thead>
                        <tr>
                          <th className="text-left text-gray-500 pb-1 font-semibold">Pesada</th>
                          <th className="text-right text-gray-500 pb-1 font-semibold">Peso (kg)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {ticketVisible.pesadas.map(p => (
                          <tr key={p.numero} style={{ borderTop: '1px solid rgba(255,255,255,0.03)' }}>
                            <td className="py-0.5 text-gray-400">Pesada {p.numero}</td>
                            <td className="py-0.5 text-right font-mono font-bold text-white">{p.peso.toFixed(2)}</td>
                          </tr>
                        ))}
                        <tr style={{ borderTop: '2px solid rgba(255,255,255,0.1)' }}>
                          <td className="py-1 text-gray-300 font-bold text-xs">TOTAL BRUTO</td>
                          <td className="py-1 text-right font-mono font-black text-white text-sm">{ticketVisible.pesoBrutoTotal.toFixed(2)}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

               

                  {/* Datos de entrega */}
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