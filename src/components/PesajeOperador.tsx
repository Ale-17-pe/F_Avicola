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
  Weight,
  Usb,
  Wifi,
  RotateCcw,
  ChevronRight,
  Monitor,
} from 'lucide-react';

import { useApp, PedidoConfirmado } from '../contexts/AppContext';
import { toast } from 'sonner';

// ===================== CONSTANTES =====================

const CONDUCTORES = [
  { id: '1', nombre: 'Juan Pérez', placa: 'ABC-123' },
  { id: '2', nombre: 'Miguel Torres', placa: 'DEF-456' },
  { id: '3', nombre: 'Roberto Sánchez', placa: 'GHI-789' },
  { id: '4', nombre: 'Luis García', placa: 'JKL-012' },
];

const ZONAS = [
  { id: '1', nombre: 'Zona Norte' },
  { id: '2', nombre: 'Zona Sur' },
  { id: '3', nombre: 'Zona Este' },
  { id: '4', nombre: 'Zona Oeste' },
  { id: '5', nombre: 'Zona Centro' },
  { id: '6', nombre: 'Zona Industrial' },
];

const BLOCK_SIZE = 10;

// ===================== INTERFACES =====================

interface BloquesPeso {
  numero: number;
  tamaño: number;
  peso: number | null;
  pesoContenedor: number;
  contenedorTipo: string;
  pesado: boolean;
}

interface TicketData {
  pedido: PedidoConfirmado;
  bloques: BloquesPeso[];
  pesoTotal: number;
  pesoContenedores: number;
  pesoNeto: number;
  esVivo: boolean;
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
    broadcastRef.current?.postMessage({
      type: 'weight-update',
      weight,
      stable: isStable,
      timestamp: Date.now(),
    });
  }, []);

  const parseWeightData = useCallback((data: string): { weight: number; stable: boolean } | null => {
    // Formatos comunes de balanzas digitales:
    // "ST,GS,  12.34 kg" | "  12.34" | "S  12.34 kg" | "12.34\r\n"
    const cleaned = data.replace(/[^\d.\-+SsTtGg,\s]/g, '').trim();
    const isStable = /^S[Tt]|^S\s/i.test(data);
    const match = cleaned.match(/([\d]+\.?\d*)/);
    if (match) {
      const weight = parseFloat(match[1]);
      if (!isNaN(weight)) {
        return { weight, stable: isStable };
      }
    }
    return null;
  }, []);

  const connect = useCallback(async () => {
    try {
      if (!('serial' in navigator)) {
        toast.error('Web Serial API no disponible. Use Chrome o Edge.');
        return false;
      }

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
                if (parsed) {
                  setCurrentWeight(parsed.weight);
                  setStable(parsed.stable);
                  broadcastWeight(parsed.weight, parsed.stable);
                }
              }
            }
          }
        } catch (err: any) {
          if (err.name !== 'NetworkError') {
            console.error('Error leyendo balanza:', err);
          }
        }
      };

      readLoop();
      return true;
    } catch (err: any) {
      if (err.name !== 'NotFoundError') {
        toast.error('Error al conectar la balanza');
        console.error(err);
      }
      return false;
    }
  }, [parseWeightData, broadcastWeight]);

  const disconnect = useCallback(async () => {
    try {
      if (readerRef.current) {
        await readerRef.current.cancel();
        readerRef.current = null;
      }
      if (port) {
        await port.close();
      }
      setPort(null);
      setConnected(false);
      setCurrentWeight(0);
      setStable(false);
      toast.success('Balanza desconectada');
    } catch (err) {
      console.error('Error al desconectar:', err);
    }
  }, [port]);

  return { connected, currentWeight, stable, connect, disconnect };
}

// ===================== COMPONENTE PRINCIPAL =====================

export function PesajeOperador() {
  const { pedidosConfirmados, updatePedidoConfirmado, contenedores } = useApp();
  const scale = useSerialScale();

  // Estado principal
  const [selectedPedido, setSelectedPedido] = useState<PedidoConfirmado | null>(null);
  const [modoManual, setModoManual] = useState(true);
  const [pesoManualInput, setPesoManualInput] = useState('');

  // Bloques
  const [bloques, setBloques] = useState<BloquesPeso[]>([]);
  const [bloqueActual, setBloqueActual] = useState(0);

  // Contenedor seleccionado para el bloque actual
  const [contenedorBloqueId, setContenedorBloqueId] = useState('');

  // Conductor y zona
  const [conductorId, setConductorId] = useState('');
  const [zonaId, setZonaId] = useState('');

  // Ticket
  const [ticketVisible, setTicketVisible] = useState<TicketData | null>(null);
  const ticketRef = useRef<HTMLDivElement>(null);

  // BroadcastChannel para la pantalla display
  const broadcastRef = useRef<BroadcastChannel | null>(null);

  useEffect(() => {
    broadcastRef.current = new BroadcastChannel('pesaje-display');
    return () => broadcastRef.current?.close();
  }, []);

  // Filtrar pedidos en estado "Pesaje"
  const pedidosEnPesaje = pedidosConfirmados
    .filter((p) => p.estado === 'Pesaje')
    .sort((a, b) => a.prioridad - b.prioridad);

  // Pedidos ya pesados
  const pedidosPesados = pedidosConfirmados
    .filter((p) => p.ticketEmitido && (p.estado === 'Entregado' || p.estado === 'Completado'))
    .slice(-10)
    .reverse();

  // Detectar si es presentación "Vivo"
  const esVivo = selectedPedido?.presentacion?.toLowerCase().includes('vivo') ?? false;

  // Obtener peso del contenedor del pedido original
  const contenedorOriginal = contenedores.find(c => c.tipo === selectedPedido?.contenedor);
  const pesoContenedorDefault = contenedorOriginal?.peso ?? 0;

  // Calcular bloques cuando se cambia el pedido
  const generarBloques = (cantidad: number, contTipo: string, contPeso: number): BloquesPeso[] => {
    const numBloquesFull = Math.floor(cantidad / BLOCK_SIZE);
    const resto = cantidad % BLOCK_SIZE;
    const bloquesArr: BloquesPeso[] = [];

    for (let i = 0; i < numBloquesFull; i++) {
      bloquesArr.push({
        numero: i + 1,
        tamaño: BLOCK_SIZE,
        peso: null,
        pesoContenedor: contPeso,
        contenedorTipo: contTipo,
        pesado: false,
      });
    }

    if (resto > 0) {
      bloquesArr.push({
        numero: numBloquesFull + 1,
        tamaño: resto,
        peso: null,
        pesoContenedor: contPeso,
        contenedorTipo: contTipo,
        pesado: false,
      });
    }

    return bloquesArr;
  };

  const handleSelectPedido = (pedido: PedidoConfirmado) => {
    setSelectedPedido(pedido);
    const cont = contenedores.find(c => c.tipo === pedido.contenedor);
    
    // Para Vivo: 1 bloque por jaba (cada bloque = 1 jaba)
    const esVivoP = pedido.presentacion?.toLowerCase().includes('vivo');
    let nuevos: BloquesPeso[];
    
    if (esVivoP && pedido.cantidadJabas) {
      // Cada jaba es un bloque individual
      nuevos = Array.from({ length: pedido.cantidadJabas }, (_, i) => ({
        numero: i + 1,
        tamaño: pedido.unidadesPorJaba || 1,
        peso: null,
        pesoContenedor: cont?.peso || 0,
        contenedorTipo: cont?.tipo || pedido.contenedor,
        pesado: false,
      }));
    } else {
      nuevos = generarBloques(pedido.cantidad, cont?.tipo || pedido.contenedor, cont?.peso || 0);
    }
    
    setBloques(nuevos);
    setBloqueActual(0);
    setPesoManualInput('');
    setContenedorBloqueId(cont?.id || '');
    setConductorId('');
    setZonaId('');
    setTicketVisible(null);

    // Broadcast al display
    broadcastRef.current?.postMessage({
      type: 'pedido-selected',
      pedido: {
        cliente: pedido.cliente,
        tipoAve: pedido.tipoAve,
        cantidad: pedido.cantidad,
        presentacion: pedido.presentacion,
      },
      totalBloques: nuevos.length,
      bloqueActual: 1,
    });
  };

  const pesoActual = modoManual
    ? parseFloat(pesoManualInput) || 0
    : scale.currentWeight;

  const pesoTotalAcumulado = bloques.reduce((sum, b) => sum + (b.peso || 0), 0);
  const bloquesCompletados = bloques.filter((b) => b.pesado).length;
  const todosCompletados = bloques.length > 0 && bloques.every((b) => b.pesado);

  // Registrar peso del bloque actual
  const registrarPesoBloque = () => {
    if (bloqueActual >= bloques.length) return;

    const peso = pesoActual;
    if (peso <= 0) {
      toast.error('El peso debe ser mayor a 0');
      return;
    }

    // Obtener contenedor seleccionado para este bloque
    const contSeleccionado = contenedores.find(c => c.id === contenedorBloqueId);
    const contTipo = contSeleccionado?.tipo || bloques[bloqueActual].contenedorTipo;
    const contPeso = contSeleccionado?.peso || bloques[bloqueActual].pesoContenedor;

    const nuevosBloques = [...bloques];
    nuevosBloques[bloqueActual] = {
      ...nuevosBloques[bloqueActual],
      peso,
      contenedorTipo: contTipo,
      pesoContenedor: contPeso,
      pesado: true,
    };
    setBloques(nuevosBloques);

    const siguienteBloque = bloqueActual + 1;
    setBloqueActual(siguienteBloque);
    setPesoManualInput('');

    const nuevoTotal = nuevosBloques.reduce((sum, b) => sum + (b.peso || 0), 0);

    // Broadcast
    broadcastRef.current?.postMessage({
      type: 'bloque-registrado',
      bloque: bloqueActual + 1,
      peso,
      contenedor: contTipo,
      totalBloques: bloques.length,
      siguienteBloque: siguienteBloque + 1,
      pesoTotal: nuevoTotal,
      completado: siguienteBloque >= bloques.length,
    });

    if (siguienteBloque >= bloques.length) {
      toast.success(`¡Todos los bloques pesados! Total: ${nuevoTotal.toFixed(2)} Kg`);
    } else {
      toast.success(`Bloque ${bloqueActual + 1} registrado: ${peso.toFixed(2)} Kg`);
    }
  };

  // Corregir peso de un bloque ya pesado
  const corregirBloque = (index: number) => {
    const nuevosBloques = [...bloques];
    nuevosBloques[index] = {
      ...nuevosBloques[index],
      peso: null,
      pesado: false,
    };
    setBloques(nuevosBloques);
    setBloqueActual(index);
    setPesoManualInput('');
    // Restaurar contenedor del bloque para edición
    const cont = contenedores.find(c => c.tipo === nuevosBloques[index].contenedorTipo);
    if (cont) setContenedorBloqueId(cont.id);
    toast.info(`Bloque ${index + 1} listo para repesar`);
  };

  // Confirmar y emitir ticket
  const handleConfirmar = () => {
    if (!selectedPedido) return;
    if (!todosCompletados) {
      toast.error('Debe pesar todos los bloques antes de confirmar');
      return;
    }
    if (!conductorId) {
      toast.error('Seleccione un conductor');
      return;
    }
    if (!zonaId) {
      toast.error('Seleccione una zona de entrega');
      return;
    }

    const conductor = CONDUCTORES.find((c) => c.id === conductorId);
    const zona = ZONAS.find((z) => z.id === zonaId);
    if (!conductor || !zona) return;

    const ahora = new Date();
    const numeroTicket = `TK-${ahora.getFullYear()}${(ahora.getMonth() + 1).toString().padStart(2, '0')}${ahora.getDate().toString().padStart(2, '0')}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    // Calcular peso total de contenedores (solo si es vivo)
    const totalPesoContenedores = esVivo
      ? bloques.reduce((sum, b) => sum + b.pesoContenedor, 0)
      : 0;
    const pesoNeto = pesoTotalAcumulado - totalPesoContenedores;

    const pedidoActualizado: PedidoConfirmado = {
      ...selectedPedido,
      pesoKg: pesoTotalAcumulado,
      pesoContenedores: totalPesoContenedores,
      conductor: conductor.nombre,
      zonaEntrega: zona.nombre,
      estado: 'Entregado',
      ticketEmitido: true,
    };

    updatePedidoConfirmado(selectedPedido.id, pedidoActualizado);

    const ticket: TicketData = {
      pedido: pedidoActualizado,
      bloques: [...bloques],
      pesoTotal: pesoTotalAcumulado,
      pesoContenedores: totalPesoContenedores,
      pesoNeto,
      esVivo,
      conductor: conductor.nombre,
      conductorPlaca: conductor.placa,
      zona: zona.nombre,
      fechaEmision: ahora.toLocaleDateString('es-PE'),
      horaEmision: ahora.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' }),
      numeroTicket,
    };

    setTicketVisible(ticket);
    setSelectedPedido(null);
    setBloques([]);
    setBloqueActual(0);
    setPesoManualInput('');
    setConductorId('');
    setZonaId('');

    // Broadcast ticket emitido
    broadcastRef.current?.postMessage({
      type: 'ticket-emitido',
      ticket: numeroTicket,
      pesoTotal: pesoTotalAcumulado,
    });

    toast.success(`Ticket ${numeroTicket} emitido correctamente`);
  };

  // Abrir pantalla display
  const abrirPantallaDisplay = () => {
    const url = `${window.location.origin}/pesaje-display`;
    window.open(url, 'PesajeDisplay', 'width=800,height=600,menubar=no,toolbar=no');
  };

  // Imprimir ticket
  const handlePrint = () => {
    if (!ticketRef.current) return;
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Tickets de Pesaje</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700&family=Inter:wght@400;600;700;800&display=swap');
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Inter', sans-serif; background: #fff; color: #000; display: flex; justify-content: center; padding: 10px; }
          body > div { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; width: 100%; max-width: 750px; }
          .ticket { width: 100%; border: 2px solid #ccc; border-radius: 12px; padding: 18px; page-break-inside: avoid; background: #fff; color: #000; }
          .ticket > div:first-child { display: none; }
          .ticket * { color: #000 !important; background: transparent !important; border-color: #ccc !important; }
          .ticket span, .ticket p, .ticket td, .ticket th, .ticket h2, .ticket h3 { color: #000 !important; }
          .section { margin-bottom: 10px; padding-bottom: 10px; border-bottom: 1px dashed #ddd; }
          .section:last-child { border-bottom: none; }
          table { width: 100%; font-size: 10px; border-collapse: collapse; }
          table th, table td { border: 1px solid #ddd; padding: 3px 5px; text-align: center; }
          table th { background: #f5f5f5 !important; font-weight: 700; }
          @media print { body { padding: 0; } .ticket { border: 1.5px solid #999; } }
        </style>
      </head>
      <body>
        ${ticketRef.current.innerHTML}
        <script>
          window.onload = function() { window.print(); window.onafterprint = function() { window.close(); }; };
        <\/script>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  // ===================== RENDER MEJORADO =====================
  return (
    <div className="space-y-5">
      {/* ===== HEADER COMPACTO ===== */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl" style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)', boxShadow: '0 0 20px rgba(34,197,94,0.1)' }}>
            <Scale className="w-6 h-6" style={{ color: '#22c55e' }} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Pesaje de Pedidos</h1>
            <p className="text-gray-500 text-xs">Bloques de {BLOCK_SIZE} unidades · Operador</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={abrirPantallaDisplay} className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-all hover:scale-105" style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.25)', color: '#60a5fa' }}>
            <Monitor className="w-3.5 h-3.5" /> Display
          </button>
          <button onClick={() => { if (scale.connected) { scale.disconnect(); setModoManual(true); } else { scale.connect().then((ok) => { if (ok) setModoManual(false); }); } }} className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-all hover:scale-105" style={{ background: scale.connected ? 'rgba(34,197,94,0.1)' : 'rgba(245,158,11,0.1)', border: `1px solid ${scale.connected ? 'rgba(34,197,94,0.25)' : 'rgba(245,158,11,0.25)'}`, color: scale.connected ? '#22c55e' : '#f59e0b' }}>
            {scale.connected ? <Wifi className="w-3.5 h-3.5" /> : <Usb className="w-3.5 h-3.5" />}
            {scale.connected ? 'Conectada' : 'Balanza'}
          </button>
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl" style={{ background: 'rgba(204,170,0,0.08)', border: '1px solid rgba(204,170,0,0.2)' }}>
            <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></div>
            <span className="text-xs font-bold" style={{ color: '#ccaa00' }}>{pedidosEnPesaje.length}</span>
          </div>
        </div>
      </div>

      {/* ===== LAYOUT PRINCIPAL ===== */}
      <div className="flex gap-5" style={{ minHeight: '80vh' }}>

        {/* ===== PANEL IZQUIERDO: COLA DE PEDIDOS ===== */}
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
                    className="w-full text-left rounded-xl px-4 py-3 transition-all duration-200 cursor-pointer group"
                    style={{
                      background: selectedPedido?.id === pedido.id ? 'rgba(34,197,94,0.08)' : 'rgba(255,255,255,0.02)',
                      border: selectedPedido?.id === pedido.id ? '2px solid rgba(34,197,94,0.4)' : '1px solid rgba(255,255,255,0.06)',
                      boxShadow: selectedPedido?.id === pedido.id ? '0 0 20px rgba(34,197,94,0.08)' : 'none',
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black flex-shrink-0" style={{
                        background: selectedPedido?.id === pedido.id ? 'rgba(34,197,94,0.15)' : 'rgba(255,255,255,0.05)',
                        color: selectedPedido?.id === pedido.id ? '#22c55e' : '#666',
                      }}>
                        {idx + 1}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-semibold text-white truncate group-hover:text-green-300 transition-colors">{pedido.cliente}</div>
                        <div className="text-[10px] text-gray-600 truncate">{pedido.cantidad} · {pedido.presentacion}</div>
                      </div>
                      {selectedPedido?.id === pedido.id && (
                        <ChevronRight className="w-4 h-4 text-green-400 flex-shrink-0" />
                      )}
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>

        {/* ===== PANEL DERECHO: PESAJE POR BLOQUES (MEJORADO) ===== */}
        <div className="flex-1 min-w-0">
          {selectedPedido ? (
            <div className="space-y-4">
              {/* Info del pedido seleccionado */}
              <div className="rounded-2xl p-4 flex items-center justify-between" style={{ background: 'rgba(34,197,94,0.04)', border: '1px solid rgba(34,197,94,0.15)' }}>
                <div className="flex items-center gap-4">
                  <div className="p-2.5 rounded-xl" style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)' }}>
                    <User className="w-5 h-5 text-green-400" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white">{selectedPedido.cliente}</h2>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs font-mono px-2 py-0.5 rounded-md" style={{ background: 'rgba(255,255,255,0.06)', color: '#aaa' }}>{selectedPedido.numeroPedido || 'S/N'}</span>
                      <span className="px-2 py-0.5 rounded-md text-xs font-semibold" style={{ background: 'rgba(34,197,94,0.12)', color: '#22c55e' }}>{selectedPedido.tipoAve}</span>
                      <span className="px-2 py-0.5 rounded-md text-xs" style={{ background: 'rgba(59,130,246,0.1)', color: '#3b82f6' }}>{selectedPedido.presentacion}</span>
                      <span className="px-2 py-0.5 rounded-md text-xs" style={{ background: 'rgba(168,85,247,0.1)', color: '#a855f7' }}>{selectedPedido.cantidad} unids.</span>
                      {selectedPedido.cantidadJabas && (
                        <span className="px-2 py-0.5 rounded-md text-xs" style={{ background: 'rgba(245,158,11,0.1)', color: '#f59e0b' }}>{selectedPedido.cantidadJabas} jabas</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => setModoManual(!modoManual)} className="text-xs px-3 py-1.5 rounded-lg font-semibold transition-all hover:scale-105" style={{ background: modoManual ? 'rgba(34,197,94,0.1)' : 'rgba(245,158,11,0.1)', border: `1px solid ${modoManual ? 'rgba(34,197,94,0.25)' : 'rgba(245,158,11,0.25)'}`, color: modoManual ? '#22c55e' : '#f59e0b' }}>
                    {modoManual ? 'Usar Balanza' : 'Modo Manual'}
                  </button>
                  <span className="text-xs px-2 py-1 rounded-full" style={{ background: modoManual ? 'rgba(245,158,11,0.1)' : 'rgba(34,197,94,0.1)', color: modoManual ? '#f59e0b' : '#22c55e' }}>
                    {modoManual ? '⌨ Manual' : '⚖ Balanza'}
                  </span>
                </div>
              </div>

              {/* ===== DISPLAY DE PESO - PROTAGONISTA ===== */}
              <div 
                className="rounded-3xl p-8 text-center relative overflow-hidden transition-all duration-300"
                style={{
                  background: todosCompletados 
                    ? 'linear-gradient(145deg, rgba(34,197,94,0.12), rgba(0,0,0,0.7))' 
                    : 'linear-gradient(145deg, #0a0a0a, #1a1a1a)',
                  border: todosCompletados
                    ? '3px solid rgba(34,197,94,0.6)'
                    : bloqueActual < bloques.length
                      ? scale.connected && !modoManual
                        ? scale.stable
                          ? '3px solid #22c55e'
                          : '3px solid #f59e0b'
                        : '3px solid #3b82f6'
                      : '3px solid rgba(255,255,255,0.1)',
                  boxShadow: todosCompletados
                    ? '0 0 40px rgba(34,197,94,0.3)'
                    : scale.connected && !modoManual && scale.stable
                      ? '0 0 50px rgba(34,197,94,0.25)'
                      : '0 0 30px rgba(0,0,0,0.5)',
                }}
              >
                {/* Indicador de bloque actual */}
                {!todosCompletados && bloqueActual < bloques.length && (
                  <div className="absolute top-4 left-4 right-4 flex justify-between items-center">
                    <span 
                      className="text-xs font-black uppercase tracking-[0.25em] px-5 py-2 rounded-full"
                      style={{
                        background: 'rgba(204,170,0,0.15)',
                        color: '#ccaa00',
                        border: '1px solid rgba(204,170,0,0.4)',
                        backdropFilter: 'blur(4px)',
                      }}
                    >
                      BLOQUE {bloqueActual + 1} DE {bloques.length} — {bloques[bloqueActual]?.tamaño} UNIDS.
                    </span>
                    
                    {/* Barra de progreso compacta */}
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-400">Progreso</span>
                      <div className="w-24 h-2 bg-gray-800 rounded-full overflow-hidden">
                        <div 
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${(bloquesCompletados / bloques.length) * 100}%`,
                            background: 'linear-gradient(90deg, #22c55e, #4ade80)',
                          }}
                        />
                      </div>
                      <span className="text-xs font-mono text-green-400">
                        {bloquesCompletados}/{bloques.length}
                      </span>
                    </div>
                  </div>
                )}

                {/* Contenido principal: PESO */}
                {todosCompletados ? (
                  <div className="py-6">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/20 border border-green-500/40 mb-4">
                      <CheckCircle className="w-5 h-5 text-green-400" />
                      <span className="text-sm font-semibold text-green-400">PESAJE COMPLETADO</span>
                    </div>
                    <p className="text-7xl md:text-8xl font-black font-mono tracking-tight text-white">
                      {pesoTotalAcumulado.toFixed(2)}
                      <span className="text-3xl ml-3 text-gray-400 font-light">Kg</span>
                    </p>
                    <p className="text-gray-500 mt-2 text-sm">Peso total acumulado</p>
                  </div>
                ) : modoManual ? (
                  <div className="py-4">
                    <div className="flex items-center justify-center gap-2 mb-2 text-blue-400">
                      <Usb className="w-5 h-5" />
                      <span className="text-xs font-semibold uppercase tracking-wider">Modo Manual</span>
                    </div>
                    <div className="relative max-w-2xl mx-auto">
                      <Scale className="absolute left-6 top-1/2 -translate-y-1/2 w-8 h-8 text-blue-400/60" />
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={pesoManualInput}
                        onChange={(e) => {
                          setPesoManualInput(e.target.value);
                          const val = parseFloat(e.target.value) || 0;
                          broadcastRef.current?.postMessage({
                            type: 'weight-update',
                            weight: val,
                            stable: true,
                            timestamp: Date.now(),
                          });
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && pesoActual > 0) {
                            registrarPesoBloque();
                          }
                        }}
                        placeholder="0.00"
                        className="w-full pl-20 pr-20 py-8 rounded-3xl text-white text-7xl md:text-8xl font-black font-mono text-center placeholder-gray-700 focus:ring-4 transition-all"
                        style={{
                          background: 'rgba(0,0,0,0.8)',
                          border: '2px solid rgba(59,130,246,0.5)',
                          boxShadow: '0 0 30px rgba(59,130,246,0.2)',
                        }}
                        autoFocus
                      />
                      <span className="absolute right-6 top-1/2 -translate-y-1/2 text-2xl font-bold text-blue-400/60">
                        Kg
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-3">
                      Presiona <kbd className="px-2 py-1 bg-gray-800 rounded-md text-white">Enter</kbd> para registrar
                    </p>
                  </div>
                ) : (
                  <div className="py-4">
                    {/* Estado de la balanza */}
                    <div className="flex items-center justify-center gap-3 mb-2">
                      <div className="flex items-center gap-1.5">
                        <div 
                          className={`w-3 h-3 rounded-full ${scale.connected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}
                        />
                        <span className="text-xs text-gray-400">
                          {scale.connected ? 'Balanza conectada' : 'Sin conexión'}
                        </span>
                      </div>
                      {scale.connected && (
                        <div className="flex items-center gap-1.5">
                          {scale.stable ? (
                            <>
                              <CheckCircle className="w-3.5 h-3.5 text-green-400" />
                              <span className="text-xs text-green-400">Estable</span>
                            </>
                          ) : (
                            <>
                              <div className="w-3.5 h-3.5 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
                              <span className="text-xs text-amber-400">Estabilizando...</span>
                            </>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Peso en vivo */}
                    <p className="text-8xl md:text-9xl font-black font-mono tracking-tight leading-none">
                      <span style={{ color: scale.stable ? '#22c55e' : '#f59e0b' }}>
                        {scale.currentWeight.toFixed(2)}
                      </span>
                    </p>
                    <p className="text-2xl font-light text-gray-500 mt-2">
                      Kilogramos
                    </p>

                    {/* Indicador de cambio de peso */}
                    {!scale.stable && (
                      <div className="mt-4 flex justify-center">
                        <div className="flex gap-1">
                          <div className="w-2 h-2 bg-amber-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                          <div className="w-2 h-2 bg-amber-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                          <div className="w-2 h-2 bg-amber-400 rounded-full animate-bounce" />
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Botón de acción principal */}
                {!todosCompletados && bloqueActual < bloques.length && (
                  <div className="mt-6">
                    <button
                      onClick={registrarPesoBloque}
                      disabled={pesoActual <= 0}
                      className="group relative w-full py-6 rounded-2xl font-black text-white text-xl md:text-2xl transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl disabled:opacity-30 disabled:hover:scale-100 disabled:cursor-not-allowed overflow-hidden"
                      style={{
                        background: pesoActual > 0
                          ? 'linear-gradient(165deg, #0a4d2a, #1a6e3c, #2e8b57)'
                          : 'rgba(255,255,255,0.05)',
                        boxShadow: pesoActual > 0
                          ? '0 20px 35px -8px rgba(34,197,94,0.5)'
                          : 'none',
                      }}
                    >
                      <span className="relative z-10 flex items-center justify-center gap-4">
                        <CheckCircle className="w-8 h-8" />
                        REGISTRAR BLOQUE {bloqueActual + 1}
                        <span className="text-2xl font-mono bg-white/20 px-4 py-1 rounded-xl">
                          {pesoActual > 0 ? `${pesoActual.toFixed(2)} Kg` : '0.00 Kg'}
                        </span>
                      </span>
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                    </button>
                  </div>
                )}
              </div>

              {/* Selector de contenedor (solo vivos) */}
              {esVivo && !todosCompletados && bloqueActual < bloques.length && (
                <div 
                  className="rounded-2xl p-5 backdrop-blur-sm"
                  style={{
                    background: 'rgba(245,158,11,0.05)',
                    border: '1px solid rgba(245,158,11,0.25)',
                    boxShadow: '0 0 25px rgba(245,158,11,0.05)',
                  }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                      <Package className="w-3.5 h-3.5" /> Contenedor — Bloque {bloqueActual + 1}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: 'rgba(245,158,11,0.12)', color: '#f59e0b' }}>
                      Tara: {(contenedores.find(c => c.id === contenedorBloqueId)?.peso || 0).toFixed(1)} kg
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {contenedores.map((cont) => (
                      <button key={cont.id} onClick={() => setContenedorBloqueId(cont.id)} className="px-3 py-2 rounded-lg text-xs font-semibold transition-all hover:scale-105"
                        style={{ background: contenedorBloqueId === cont.id ? 'rgba(245,158,11,0.15)' : 'rgba(255,255,255,0.04)', border: `1px solid ${contenedorBloqueId === cont.id ? 'rgba(245,158,11,0.4)' : 'rgba(255,255,255,0.06)'}`, color: contenedorBloqueId === cont.id ? '#f59e0b' : '#888' }}>
                        {cont.tipo} <span className="ml-1 opacity-60">({cont.peso} kg)</span>
                      </button>
                    ))}
                  </div>
                  {contenedorBloqueId && contenedores.find(c => c.id === contenedorBloqueId)?.tipo !== selectedPedido?.contenedor && (
                    <p className="text-[10px] text-amber-400 mt-2">⚠ Contenedor diferente al pedido original ({selectedPedido?.contenedor})</p>
                  )}
                </div>
              )}

              {/* Tabla de bloques pesados */}
              {(bloquesCompletados > 0 || todosCompletados) && (
                <div 
                  className="rounded-2xl overflow-hidden"
                  style={{
                    background: 'rgba(20,20,30,0.6)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    backdropFilter: 'blur(8px)',
                  }}
                >
                  <div className="p-3 flex items-center justify-between" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Bloques ({bloquesCompletados}/{bloques.length})</span>
                    <span className="text-sm font-black font-mono" style={{ color: '#22c55e' }}>Total: {pesoTotalAcumulado.toFixed(2)} Kg</span>
                  </div>
                  <div className="max-h-60 overflow-y-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr style={{ background: 'rgba(255,255,255,0.02)' }}>
                          <th className="px-4 py-2 text-left text-gray-500 font-semibold">#</th>
                          <th className="px-4 py-2 text-center text-gray-500 font-semibold">Unids.</th>
                          <th className="px-4 py-2 text-center text-gray-500 font-semibold">Peso (Kg)</th>
                          <th className="px-4 py-2 text-center text-gray-500 font-semibold">Estado</th>
                          <th className="px-4 py-2 text-center text-gray-500 font-semibold"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {bloques.map((bloque, idx) => (
                          <tr key={idx} className={`transition-colors ${idx === bloqueActual && !bloque.pesado ? 'bg-green-900/10' : ''}`} style={{ borderTop: '1px solid rgba(255,255,255,0.03)' }}>
                            <td className="px-4 py-2">
                              <span className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold" style={{ background: bloque.pesado ? 'rgba(34,197,94,0.15)' : idx === bloqueActual ? 'rgba(204,170,0,0.15)' : 'rgba(255,255,255,0.04)', color: bloque.pesado ? '#22c55e' : idx === bloqueActual ? '#ccaa00' : '#555' }}>
                                {bloque.numero}
                              </span>
                            </td>
                            <td className="px-4 py-2 text-center text-gray-400">{bloque.tamaño}</td>
                            <td className="px-4 py-2 text-center">
                              {bloque.pesado ? (
                                <span className="font-bold font-mono text-sm" style={{ color: '#22c55e' }}>{bloque.peso?.toFixed(2)}</span>
                              ) : idx === bloqueActual ? (
                                <span className="text-amber-400 animate-pulse">⏳</span>
                              ) : (
                                <span className="text-gray-700">—</span>
                              )}
                            </td>
                            <td className="px-4 py-2 text-center">
                              {bloque.pesado ? (
                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-900/20 text-green-400 border border-green-800/30">✓</span>
                              ) : idx === bloqueActual ? (
                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-900/20 text-amber-400 border border-amber-800/30">Pesando</span>
                              ) : (
                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-900/30 text-gray-600 border border-gray-800/30">Espera</span>
                              )}
                            </td>
                            <td className="px-4 py-2 text-center">
                              {bloque.pesado && (
                                <button onClick={() => corregirBloque(idx)} className="p-1 rounded-md hover:bg-amber-900/20 transition-colors" title="Repesar bloque">
                                  <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Conductor y Zona + Confirmar */}
              {todosCompletados && (
                <div className="rounded-2xl p-5 space-y-4" style={{ background: 'rgba(34,197,94,0.03)', border: '1px solid rgba(34,197,94,0.12)' }}>
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Asignar Entrega</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#3b82f6' }} />
                      <select value={conductorId} onChange={(e) => setConductorId(e.target.value)} className="w-full pl-10 pr-3 py-3 rounded-xl text-white text-sm appearance-none cursor-pointer focus:ring-2 transition-all" style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(59,130,246,0.2)', outlineColor: '#3b82f6' }}>
                        <option value="">Conductor...</option>
                        {CONDUCTORES.map((c) => (<option key={c.id} value={c.id}>{c.nombre} — {c.placa}</option>))}
                      </select>
                    </div>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#a855f7' }} />
                      <select value={zonaId} onChange={(e) => setZonaId(e.target.value)} className="w-full pl-10 pr-3 py-3 rounded-xl text-white text-sm appearance-none cursor-pointer focus:ring-2 transition-all" style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(168,85,247,0.2)', outlineColor: '#a855f7' }}>
                        <option value="">Zona...</option>
                        {ZONAS.map((z) => (<option key={z.id} value={z.id}>{z.nombre}</option>))}
                      </select>
                    </div>
                  </div>
                  <button onClick={handleConfirmar} className="w-full py-4 rounded-2xl font-black text-white text-lg transition-all hover:scale-[1.01] flex items-center justify-center gap-3"
                    style={{ background: 'linear-gradient(135deg, #0d4a24, #166534, #22c55e)', boxShadow: '0 8px 25px -5px rgba(34,197,94,0.4)' }}>
                    <Printer className="w-6 h-6" />
                    CONFIRMAR Y EMITIR TICKETS — {pesoTotalAcumulado.toFixed(2)} Kg
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* Estado vacío cuando no hay pedido seleccionado */
            <div className="h-full flex items-center justify-center rounded-2xl" style={{ background: 'rgba(255,255,255,0.015)', border: '1px dashed rgba(255,255,255,0.06)', minHeight: '60vh' }}>
              <div className="text-center">
                <Scale className="w-20 h-20 mx-auto mb-4" style={{ color: 'rgba(34,197,94,0.1)' }} />
                <p className="text-gray-500 text-base font-medium">Seleccione un pedido de la cola</p>
                <p className="text-gray-700 text-xs mt-1">El pesaje se realiza en bloques de {BLOCK_SIZE} unidades</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ===== MODAL TICKET (2 copias: Cliente + Negocio) ===== */}
      {ticketVisible && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.85)' }}>
          <div className="bg-gray-950 rounded-3xl border border-gray-800 p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto" style={{ boxShadow: '0 0 60px rgba(0,0,0,0.8)' }}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-green-400" />
                Tickets Emitidos
              </h2>
              <button onClick={() => setTicketVisible(null)} className="p-2 rounded-xl hover:bg-white/10 transition-colors">
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            {/* 2 tickets lado a lado */}
            <div ref={ticketRef} className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {['CLIENTE', 'NEGOCIO'].map((tipo) => (
                <div key={tipo} className="ticket rounded-2xl p-5 relative overflow-hidden" style={{ background: 'rgba(10,10,10,0.95)', border: '2px solid rgba(51,51,51,0.6)' }}>
                  <div className="absolute top-0 left-0 right-0 h-1" style={{ background: tipo === 'CLIENTE' ? 'linear-gradient(to right, #22c55e, #3b82f6)' : 'linear-gradient(to right, #ccaa00, #f97316)' }} />
                  
                  {/* Tipo de copia */}
                  <div className="text-center mb-1">
                    <span className="text-[9px] font-black uppercase tracking-[0.3em] px-3 py-1 rounded-full" style={{ background: tipo === 'CLIENTE' ? 'rgba(34,197,94,0.1)' : 'rgba(204,170,0,0.1)', color: tipo === 'CLIENTE' ? '#22c55e' : '#ccaa00', border: `1px solid ${tipo === 'CLIENTE' ? 'rgba(34,197,94,0.2)' : 'rgba(204,170,0,0.2)'}` }}>
                      Copia {tipo}
                    </span>
                  </div>

                  {/* Header */}
                  <div className="text-center mb-3 pb-2" style={{ borderBottom: '1px dashed #333' }}>
                    <h3 className="text-lg font-extrabold tracking-widest">
                      <span style={{ color: '#22c55e' }}>AVÍCOLA </span>
                      <span style={{ color: '#ccaa00' }}>JOSSY</span>
                    </h3>
                    <p className="text-[9px] text-gray-500 tracking-[0.2em] mt-0.5 uppercase">Ticket de Despacho</p>
                  </div>

                  {/* Ticket number */}
                  <div className="text-center py-1.5 px-3 rounded-lg mb-3 font-mono text-xs" style={{ background: 'rgba(204,170,0,0.08)', border: '1px solid rgba(204,170,0,0.2)', color: '#ccaa00' }}>
                    {ticketVisible.numeroTicket}
                  </div>

                  {/* Datos pedido */}
                  <div className="mb-3 pb-2" style={{ borderBottom: '1px dashed #222' }}>
                    <p className="text-[9px] text-gray-600 uppercase tracking-[0.15em] mb-1.5">Datos del Pedido</p>
                    <div className="space-y-0.5">
                      {[
                        ['Cliente', ticketVisible.pedido.cliente],
                        ['Producto', ticketVisible.pedido.tipoAve],
                        ['Presentación', ticketVisible.pedido.presentacion],
                        ['Cantidad', `${ticketVisible.pedido.cantidad} unids.`],
                        ['Contenedor', ticketVisible.pedido.contenedor],
                      ].map(([label, value]) => (
                        <div key={label} className="flex justify-between text-[11px]">
                          <span className="text-gray-500">{label}</span>
                          <span className="text-white font-bold">{value}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Tabla bloques */}
                  <div className="mb-3 pb-2" style={{ borderBottom: '1px dashed #222' }}>
                    <p className="text-[9px] text-gray-600 uppercase tracking-[0.15em] mb-1.5">Detalle por Bloques</p>
                    <table className="w-full text-[10px]">
                      <thead>
                        <tr>
                          <th className="text-left text-gray-500 pb-1">Bloque</th>
                          <th className="text-center text-gray-500 pb-1">Unids.</th>
                          <th className="text-right text-gray-500 pb-1">Peso (Kg)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {ticketVisible.bloques.map((b) => (
                          <tr key={b.numero} style={{ borderTop: '1px solid rgba(255,255,255,0.03)' }}>
                            <td className="py-0.5 text-gray-400">Bloque {b.numero}</td>
                            <td className="py-0.5 text-center text-gray-400">{b.tamaño}</td>
                            <td className="py-0.5 text-right font-mono font-bold text-white">{b.peso?.toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Peso total */}
                  <div className="text-center p-3 rounded-xl mb-3" style={{ background: 'rgba(34,197,94,0.08)', border: '2px solid rgba(34,197,94,0.25)' }}>
                    <p className="text-[9px] uppercase tracking-[0.2em] mb-0.5" style={{ color: '#22c55e' }}>Peso Total</p>
                    <p className="text-3xl font-extrabold font-mono" style={{ color: '#22c55e' }}>
                      {ticketVisible.pesoTotal.toFixed(2)}
                      <span className="text-xs ml-1" style={{ color: '#22c55e60' }}>Kg</span>
                    </p>
                    {ticketVisible.esVivo && ticketVisible.pesoContenedores > 0 && (
                      <div className="flex justify-center gap-3 mt-1 text-[10px]">
                        <span className="text-gray-500">Contenedores: -{ticketVisible.pesoContenedores.toFixed(2)} Kg</span>
                        <span className="text-green-300 font-bold">Neto: {ticketVisible.pesoNeto.toFixed(2)} Kg</span>
                      </div>
                    )}
                  </div>

                  {/* Datos entrega */}
                  <div className="mb-3 pb-2" style={{ borderBottom: '1px dashed #222' }}>
                    <p className="text-[9px] text-gray-600 uppercase tracking-[0.15em] mb-1.5">Datos de Entrega</p>
                    <div className="space-y-0.5">
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
                  </div>

                  {/* Footer */}
                  <div className="text-center pt-1">
                    <p className="text-[10px] text-gray-500">{ticketVisible.fechaEmision} — {ticketVisible.horaEmision}</p>
                    <p className="text-[8px] text-gray-700 mt-1 tracking-[0.2em] uppercase">Avícola Jossy — Sistema de Gestión</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Botones del modal */}
            <div className="flex gap-3 mt-5">
              <button onClick={handlePrint} className="flex-1 py-3.5 rounded-2xl font-bold text-white transition-all hover:scale-[1.02] flex items-center justify-center gap-2"
                style={{ background: 'linear-gradient(135deg, #0d4a24, #22c55e)', boxShadow: '0 6px 18px rgba(34,197,94,0.3)' }}>
                <Printer className="w-5 h-5" />
                Imprimir Tickets (2 copias)
              </button>
              <button onClick={() => setTicketVisible(null)} className="px-6 py-3.5 rounded-2xl font-bold text-gray-400 transition-all hover:scale-[1.02]" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}