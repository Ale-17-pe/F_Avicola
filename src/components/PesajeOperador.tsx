import { useState, useRef, useEffect, useCallback } from 'react';
import {
  Scale,
  Truck,
  MapPin,
  User,
  Printer,
  CheckCircle,
  AlertTriangle,
  Package,
  X,
  FileText,
  Clock,
  Weight,
  Usb,
  Wifi,
  WifiOff,
  RotateCcw,
  ChevronRight,
  Layers,
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

      // Leer datos continuamente
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

            // Procesar líneas completas
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
    const nuevos = generarBloques(pedido.cantidad, cont?.tipo || pedido.contenedor, cont?.peso || 0);
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
        <title>Ticket de Pesaje</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700&family=Inter:wght@400;600;700;800&display=swap');
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Inter', sans-serif; background: #fff; color: #000; display: flex; justify-content: center; padding: 20px; }
          .ticket { width: 350px; border: 2px solid #ccc; border-radius: 12px; padding: 20px; }
          .ticket::before { content: ''; display: block; height: 3px; background: linear-gradient(to right, #16a34a, #ca8a04); border-radius: 2px; margin-bottom: 16px; }
          .header { text-align: center; margin-bottom: 16px; padding-bottom: 12px; border-bottom: 1px dashed #ccc; }
          .header h1 { font-size: 16px; font-weight: 800; letter-spacing: 2px; }
          .header .subtitle { font-size: 10px; color: #888; margin-top: 4px; letter-spacing: 1px; }
          .ticket-number { text-align: center; font-family: 'JetBrains Mono', monospace; font-size: 12px; color: #000; background: #f0f0f0; border: 1px solid #ccc; border-radius: 6px; padding: 6px; margin-bottom: 12px; }
          .section { margin-bottom: 12px; padding-bottom: 12px; border-bottom: 1px dashed #ddd; }
          .section:last-child { border-bottom: none; }
          .section-title { font-size: 9px; color: #888; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 6px; }
          .row { display: flex; justify-content: space-between; margin-bottom: 4px; font-size: 11px; }
          .row .label { color: #666; }
          .row .value { font-weight: 700; }
          .bloques-table { width: 100%; font-size: 10px; border-collapse: collapse; margin: 6px 0; }
          .bloques-table th, .bloques-table td { border: 1px solid #ddd; padding: 4px 6px; text-align: center; }
          .bloques-table th { background: #f5f5f5; font-weight: 700; }
          .peso-highlight { text-align: center; background: #f0fdf4; border: 2px solid #22c55e; border-radius: 8px; padding: 12px; margin: 12px 0; }
          .peso-highlight .label { font-size: 9px; color: #16a34a; text-transform: uppercase; letter-spacing: 2px; }
          .peso-highlight .value { font-size: 28px; font-weight: 800; color: #16a34a; font-family: 'JetBrains Mono', monospace; }
          .peso-highlight .unit { font-size: 12px; }
          .footer { text-align: center; padding-top: 12px; border-top: 1px dashed #ccc; }
          .footer .date { font-size: 10px; color: #888; }
          .footer .msg { font-size: 9px; color: #aaa; margin-top: 6px; letter-spacing: 1px; }
          @media print { body { padding: 0; } .ticket { border: none; } }
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

  // ===================== RENDER =====================
  return (
    <div className="space-y-5">
      {/* ===== HEADER ===== */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: 'rgba(34, 197, 94, 0.15)', border: '1px solid rgba(34, 197, 94, 0.3)' }}
            >
              <Scale className="w-5 h-5" style={{ color: '#22c55e' }} />
            </div>
            Pesaje de Pedidos
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            Pese por bloques de {BLOCK_SIZE}, asigne conductor y zona, y emita el ticket
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Botón pantalla display */}
          <button
            onClick={abrirPantallaDisplay}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all hover:scale-105"
            style={{
              background: 'rgba(59, 130, 246, 0.15)',
              border: '1px solid rgba(59, 130, 246, 0.3)',
              color: '#60a5fa',
            }}
          >
            <Monitor className="w-4 h-4" />
            Pantalla Display
          </button>

          {/* Botón conectar/desconectar balanza */}
          <button
            onClick={() => {
              if (scale.connected) {
                scale.disconnect();
                setModoManual(true);
              } else {
                scale.connect().then((ok) => {
                  if (ok) setModoManual(false);
                });
              }
            }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all hover:scale-105"
            style={{
              background: scale.connected ? 'rgba(34, 197, 94, 0.15)' : 'rgba(245, 158, 11, 0.15)',
              border: `1px solid ${scale.connected ? 'rgba(34, 197, 94, 0.3)' : 'rgba(245, 158, 11, 0.3)'}`,
              color: scale.connected ? '#22c55e' : '#f59e0b',
            }}
          >
            {scale.connected ? <Wifi className="w-4 h-4" /> : <Usb className="w-4 h-4" />}
            {scale.connected ? 'Balanza conectada' : 'Conectar Balanza'}
          </button>

          {/* Badge de pedidos en espera */}
          <div
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl"
            style={{ background: 'rgba(204, 170, 0, 0.1)', border: '1px solid rgba(204, 170, 0, 0.3)' }}
          >
            <Clock className="w-4 h-4" style={{ color: '#ccaa00' }} />
            <span className="text-sm font-bold" style={{ color: '#ccaa00' }}>
              {pedidosEnPesaje.length} en espera
            </span>
          </div>
        </div>
      </div>

      {/* ===== CONTENIDO PRINCIPAL ===== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* ===== COL 1: COLA DE PEDIDOS ===== */}
        <div className="lg:col-span-3">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
            <Package className="w-4 h-4" style={{ color: '#f59e0b' }} />
            Cola de Pesaje
          </h2>
          <div className="space-y-2 max-h-[70vh] overflow-y-auto pr-1">
            {pedidosEnPesaje.length === 0 ? (
              <div
                className="rounded-xl p-6 text-center"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}
              >
                <AlertTriangle className="w-8 h-8 mx-auto mb-2" style={{ color: '#ccaa0040' }} />
                <p className="text-gray-500 text-sm">No hay pedidos en pesaje</p>
                <p className="text-gray-600 text-xs mt-1">Los pedidos aparecerán aquí al moverlos a "Pesaje"</p>
              </div>
            ) : (
              pedidosEnPesaje.map((pedido) => (
                <button
                  key={pedido.id}
                  onClick={() => handleSelectPedido(pedido)}
                  className="w-full text-left rounded-xl p-3.5 transition-all hover:scale-[1.01] cursor-pointer"
                  style={{
                    background: selectedPedido?.id === pedido.id
                      ? 'rgba(34, 197, 94, 0.1)' : 'rgba(255, 255, 255, 0.03)',
                    border: selectedPedido?.id === pedido.id
                      ? '2px solid rgba(34, 197, 94, 0.5)' : '1px solid rgba(255, 255, 255, 0.08)',
                  }}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-white font-semibold text-sm">{pedido.cliente}</span>
                    <span
                      className="text-xs px-2 py-0.5 rounded-full font-mono"
                      style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b' }}
                    >
                      P{pedido.prioridad}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 text-xs">
                    <span className="px-2 py-0.5 rounded-md" style={{ background: 'rgba(34,197,94,0.1)', color: '#22c55e' }}>
                      {pedido.tipoAve}
                    </span>
                    <span className="text-gray-400">{pedido.cantidad} unids.</span>
                    <span className="text-gray-500">{pedido.presentacion}</span>
                  </div>
                  <div className="flex items-center justify-between mt-1.5">
                    <span className="text-xs text-gray-600">{pedido.fecha} · {pedido.hora}</span>
                    <span className="text-xs font-bold px-2 py-0.5 rounded-md"
                      style={{ background: 'rgba(168,85,247,0.15)', color: '#a855f7' }}
                    >
                      {Math.ceil(pedido.cantidad / BLOCK_SIZE)} bloques
                    </span>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* ===== COL 2: PESAJE POR BLOQUES ===== */}
        <div className="lg:col-span-5">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
            <Layers className="w-4 h-4" style={{ color: '#22c55e' }} />
            Pesaje por Bloques
            {selectedPedido && (
              <span className="ml-auto text-xs px-2 py-0.5 rounded-full"
                style={{
                  background: modoManual ? 'rgba(245,158,11,0.15)' : 'rgba(34,197,94,0.15)',
                  color: modoManual ? '#f59e0b' : '#22c55e',
                }}
              >
                {modoManual ? '⌨ Manual' : '⚖ Balanza'}
              </span>
            )}
          </h2>

          {selectedPedido ? (
            <div className="space-y-4">
              <div className="rounded-xl p-4" style={{ background: 'rgba(204,170,0,0.08)', border: '1px solid rgba(204,170,0,0.2)' }}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white font-bold text-base">{selectedPedido.cliente}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs px-2 py-0.5 rounded-md bg-white/10 text-gray-300 font-mono">
                        {selectedPedido.numeroPedido || 'S/N'}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setModoManual(!modoManual)}
                      className="text-xs px-3 py-1.5 rounded-lg font-semibold transition-all hover:scale-105"
                      style={{
                        background: modoManual ? 'rgba(34,197,94,0.15)' : 'rgba(245,158,11,0.15)',
                        border: `1px solid ${modoManual ? 'rgba(34,197,94,0.3)' : 'rgba(245,158,11,0.3)'}`,
                        color: modoManual ? '#22c55e' : '#f59e0b',
                      }}
                    >
                      {modoManual ? 'Usar Balanza' : 'Modo Manual'}
                    </button>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 mt-3 text-xs">
                  <span className="px-2 py-1 rounded-md" style={{ background: 'rgba(34,197,94,0.15)', color: '#22c55e' }}>
                    {selectedPedido.tipoAve}
                  </span>
                  <span className="px-2 py-1 rounded-md" style={{ background: 'rgba(59,130,246,0.15)', color: '#3b82f6' }}>
                    {selectedPedido.presentacion}
                  </span>
                  <span className="px-2 py-1 rounded-md" style={{ background: 'rgba(168,85,247,0.15)', color: '#a855f7' }}>
                    {selectedPedido.cantidad} unids.
                  </span>
                  {selectedPedido.cantidadJabas && (
                    <span className="px-2 py-1 rounded-md" style={{ background: 'rgba(245,158,11,0.15)', color: '#f59e0b' }}>
                      {selectedPedido.cantidadJabas} jabas
                    </span>
                  )}
                </div>
              </div>

              {/* Lectura peso actual */}
              <div
                className="rounded-xl p-5 text-center relative overflow-hidden"
                style={{
                  background: todosCompletados
                    ? 'rgba(34,197,94,0.08)'
                    : 'rgba(0,0,0,0.4)',
                  border: `2px solid ${todosCompletados
                    ? 'rgba(34,197,94,0.4)'
                    : bloqueActual < bloques.length ? 'rgba(34,197,94,0.3)' : 'rgba(255,255,255,0.1)'}`,
                }}
              >
                {!todosCompletados && bloqueActual < bloques.length && (
                  <div className="mb-3">
                    <span className="text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full"
                      style={{ background: 'rgba(204,170,0,0.15)', color: '#ccaa00' }}
                    >
                      Bloque {bloqueActual + 1} de {bloques.length} — {bloques[bloqueActual]?.tamaño} unidades
                    </span>
                  </div>
                )}

                {todosCompletados ? (
                  <div>
                    <p className="text-xs text-green-400 uppercase tracking-widest mb-1">✓ Todos los bloques pesados</p>
                    <p className="text-4xl font-extrabold font-mono" style={{ color: '#22c55e' }}>
                      {pesoTotalAcumulado.toFixed(2)}
                      <span className="text-lg ml-1" style={{ color: '#22c55e80' }}>Kg Total</span>
                    </p>
                  </div>
                ) : modoManual ? (
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-widest mb-2">Peso del bloque (manual)</p>
                    <div className="relative max-w-xs mx-auto">
                      <Scale className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: '#22c55e' }} />
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
                        placeholder="0.00"
                        className="w-full pl-11 pr-12 py-4 rounded-xl text-white text-3xl font-bold font-mono text-center placeholder-gray-700 focus:ring-2 transition-all"
                        style={{
                          background: 'rgba(0,0,0,0.5)',
                          border: '1px solid rgba(34,197,94,0.3)',
                          outlineColor: '#22c55e',
                        }}
                        autoFocus
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-bold" style={{ color: '#22c55e80' }}>
                        Kg
                      </span>
                    </div>
                  </div>
                ) : (
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">Lectura de balanza</p>
                    <p className="text-5xl font-extrabold font-mono" style={{ color: scale.stable ? '#22c55e' : '#f59e0b' }}>
                      {scale.currentWeight.toFixed(2)}
                      <span className="text-lg ml-1" style={{ color: scale.stable ? '#22c55e80' : '#f59e0b80' }}>Kg</span>
                    </p>
                    {!scale.stable && (
                      <p className="text-xs text-amber-400 mt-1 animate-pulse">Estabilizando...</p>
                    )}
                  </div>
                )}
              </div>

              {/* Selector de contenedor (solo para vivos) */}
              {esVivo && !todosCompletados && bloqueActual < bloques.length && (
                <div className="rounded-xl p-3" style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.15)' }}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                      <Package className="w-3.5 h-3.5" />
                      Contenedor / Jaba — Bloque {bloqueActual + 1}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: 'rgba(245,158,11,0.15)', color: '#f59e0b' }}>
                      Tara: {(contenedores.find(c => c.id === contenedorBloqueId)?.peso || 0).toFixed(1)} kg
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {contenedores.map((cont) => (
                      <button
                        key={cont.id}
                        onClick={() => setContenedorBloqueId(cont.id)}
                        className="px-3 py-2 rounded-lg text-xs font-semibold transition-all hover:scale-105"
                        style={{
                          background: contenedorBloqueId === cont.id ? 'rgba(245,158,11,0.2)' : 'rgba(255,255,255,0.05)',
                          border: `1px solid ${contenedorBloqueId === cont.id ? 'rgba(245,158,11,0.5)' : 'rgba(255,255,255,0.08)'}`,
                          color: contenedorBloqueId === cont.id ? '#f59e0b' : '#888',
                        }}
                      >
                        {cont.tipo}
                        <span className="ml-1 opacity-60">({cont.peso} kg)</span>
                      </button>
                    ))}
                  </div>
                  {contenedorBloqueId && contenedores.find(c => c.id === contenedorBloqueId)?.tipo !== selectedPedido?.contenedor && (
                    <p className="text-[10px] text-amber-400 mt-2">
                      ⚠ Contenedor diferente al pedido original ({selectedPedido?.contenedor})
                    </p>
                  )}
                </div>
              )}

              {/* Botón registrar bloque */}
              {!todosCompletados && bloqueActual < bloques.length && (
                <button
                  onClick={registrarPesoBloque}
                  disabled={pesoActual <= 0}
                  className="w-full py-3.5 rounded-xl font-bold text-white transition-all hover:scale-[1.02] flex items-center justify-center gap-2 disabled:opacity-40 disabled:hover:scale-100"
                  style={{
                    background: pesoActual > 0
                      ? 'linear-gradient(to right, #0d4a24, #166534, #22c55e)'
                      : 'rgba(255,255,255,0.05)',
                    boxShadow: pesoActual > 0 ? '0 6px 16px -4px rgba(34,197,94,0.4)' : 'none',
                  }}
                >
                  <CheckCircle className="w-5 h-5" />
                  REGISTRAR BLOQUE {bloqueActual + 1} — {pesoActual > 0 ? `${pesoActual.toFixed(2)} Kg` : 'Ingrese peso'}
                </button>
              )}

              {/* Tabla de bloques - SOLO mostrar si hay bloques pesados */}
              {(bloquesCompletados > 0 || todosCompletados) && (
                <div
                  className="rounded-xl overflow-hidden mt-4 animate-in fade-in slide-in-from-bottom-4 duration-500"
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}
                >
                  <div className="p-3 flex items-center justify-between"
                    style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
                  >
                    <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      Bloques ({bloquesCompletados}/{bloques.length})
                    </span>
                    <span className="text-sm font-bold font-mono" style={{ color: '#22c55e' }}>
                      Total: {pesoTotalAcumulado.toFixed(2)} Kg
                    </span>
                  </div>
                <div className="max-h-48 overflow-y-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr style={{ background: 'rgba(255,255,255,0.03)' }}>
                        <th className="px-3 py-2 text-left text-gray-500 font-semibold">#</th>
                        <th className="px-3 py-2 text-center text-gray-500 font-semibold">Unids.</th>
                        <th className="px-3 py-2 text-center text-gray-500 font-semibold">Peso (Kg)</th>
                        <th className="px-3 py-2 text-center text-gray-500 font-semibold">Estado</th>
                        <th className="px-3 py-2 text-center text-gray-500 font-semibold"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {bloques.map((bloque, idx) => (
                        <tr
                          key={idx}
                          className={`transition-colors ${
                            idx === bloqueActual && !bloque.pesado ? 'bg-green-900/10' : ''
                          }`}
                          style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}
                        >
                          <td className="px-3 py-2">
                            <span
                              className="w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold"
                              style={{
                                background: bloque.pesado
                                  ? 'rgba(34,197,94,0.2)'
                                  : idx === bloqueActual
                                  ? 'rgba(204,170,0,0.2)'
                                  : 'rgba(255,255,255,0.05)',
                                color: bloque.pesado ? '#22c55e' : idx === bloqueActual ? '#ccaa00' : '#666',
                              }}
                            >
                              {bloque.numero}
                            </span>
                          </td>
                          <td className="px-3 py-2 text-center text-gray-400">{bloque.tamaño}</td>
                          <td className="px-3 py-2 text-center">
                            {bloque.pesado ? (
                              <span className="font-bold font-mono" style={{ color: '#22c55e' }}>
                                {bloque.peso?.toFixed(2)}
                              </span>
                            ) : idx === bloqueActual ? (
                              <span className="text-amber-400 animate-pulse">⏳</span>
                            ) : (
                              <span className="text-gray-700">—</span>
                            )}
                          </td>
                          <td className="px-3 py-2 text-center">
                            {bloque.pesado ? (
                              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-green-900/20 text-green-400 border border-green-800/30">
                                ✓
                              </span>
                            ) : idx === bloqueActual ? (
                              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-900/20 text-amber-400 border border-amber-800/30">
                                Pesando
                              </span>
                            ) : (
                              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-gray-900/30 text-gray-600 border border-gray-800/30">
                                Espera
                              </span>
                            )}
                          </td>
                          <td className="px-3 py-2 text-center">
                            {bloque.pesado && (
                              <button
                                onClick={() => corregirBloque(idx)}
                                className="p-1 rounded-md hover:bg-amber-900/20 transition-colors"
                                title="Repesar bloque"
                              >
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

              {/* Conductor y Zona (solo cuando todos bloques están pesados) */}
              {todosCompletados && (
                <div className="space-y-3 p-4 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Asignar Entrega</h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Conductor */}
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#3b82f6' }} />
                      <select
                        value={conductorId}
                        onChange={(e) => setConductorId(e.target.value)}
                        className="w-full pl-10 pr-3 py-3 rounded-lg text-white text-sm appearance-none cursor-pointer focus:ring-2 transition-all"
                        style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(59,130,246,0.3)', outlineColor: '#3b82f6' }}
                      >
                        <option value="">Conductor...</option>
                        {CONDUCTORES.map((c) => (
                          <option key={c.id} value={c.id}>{c.nombre} — {c.placa}</option>
                        ))}
                      </select>
                    </div>

                    {/* Zona */}
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#a855f7' }} />
                      <select
                        value={zonaId}
                        onChange={(e) => setZonaId(e.target.value)}
                        className="w-full pl-10 pr-3 py-3 rounded-lg text-white text-sm appearance-none cursor-pointer focus:ring-2 transition-all"
                        style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(168,85,247,0.3)', outlineColor: '#a855f7' }}
                      >
                        <option value="">Zona...</option>
                        {ZONAS.map((z) => (
                          <option key={z.id} value={z.id}>{z.nombre}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Botón confirmar */}
                  <button
                    onClick={handleConfirmar}
                    className="w-full py-4 rounded-xl font-bold text-white transition-all hover:scale-[1.02] flex items-center justify-center gap-2"
                    style={{
                      background: 'linear-gradient(to right, #0d4a24, #166534, #22c55e)',
                      boxShadow: '0 8px 20px -4px rgba(34, 197, 94, 0.4)',
                    }}
                  >
                    <Printer className="w-5 h-5" />
                    CONFIRMAR Y EMITIR TICKET — {pesoTotalAcumulado.toFixed(2)} Kg
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="rounded-xl p-10 text-center" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <Scale className="w-14 h-14 mx-auto mb-3" style={{ color: '#22c55e20' }} />
              <p className="text-gray-500 text-sm">Seleccione un pedido de la cola para comenzar</p>
              <p className="text-gray-600 text-xs mt-1">
                El pesaje se realiza en bloques de {BLOCK_SIZE} unidades
              </p>
            </div>
          )}
        </div>

        {/* ===== COL 3: TICKET / HISTORIAL ===== */}
        <div className="lg:col-span-4">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
            <FileText className="w-4 h-4" style={{ color: '#ccaa00' }} />
            {ticketVisible ? 'Ticket Emitido' : 'Historial'}
          </h2>

          {ticketVisible ? (
            <div className="space-y-3">
              {/* Ticket visual */}
              <div
                ref={ticketRef}
                className="rounded-xl p-5 relative overflow-hidden"
                style={{ background: 'rgba(10,10,10,0.9)', border: '2px solid rgba(51,51,51,0.8)' }}
              >
                <div className="absolute top-0 left-0 right-0 h-1" style={{ background: 'linear-gradient(to right, #22c55e, #ccaa00)' }} />
                <div className="ticket">
                  {/* Header */}
                  <div className="text-center mb-4 pb-3" style={{ borderBottom: '1px dashed #333' }}>
                    <h3 className="text-lg font-extrabold tracking-widest">
                      <span style={{ color: '#22c55e' }}>AVÍCOLA </span>
                      <span style={{ color: '#ccaa00' }}>JOSSY</span>
                    </h3>
                    <p className="text-[10px] text-gray-500 tracking-widest mt-1 uppercase">Ticket de Despacho</p>
                  </div>

                  {/* Ticket number */}
                  <div className="text-center py-2 px-3 rounded-lg mb-3 font-mono text-xs"
                    style={{ background: 'rgba(204,170,0,0.1)', border: '1px solid rgba(204,170,0,0.3)', color: '#ccaa00' }}
                  >
                    {ticketVisible.numeroTicket}
                  </div>

                  {/* Datos pedido */}
                  <div className="mb-3 pb-3" style={{ borderBottom: '1px dashed #222' }}>
                    <p className="text-[10px] text-gray-600 uppercase tracking-widest mb-2">Datos del Pedido</p>
                    <div className="space-y-1">
                      {[
                        ['Cliente', ticketVisible.pedido.cliente],
                        ['Producto', ticketVisible.pedido.tipoAve],
                        ['Presentación', ticketVisible.pedido.presentacion],
                        ['Cantidad', `${ticketVisible.pedido.cantidad} unids.`],
                        ['Contenedor', ticketVisible.pedido.contenedor],
                      ].map(([label, value]) => (
                        <div key={label} className="flex justify-between text-xs">
                          <span className="text-gray-500">{label}</span>
                          <span className="text-white font-bold">{value}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Tabla de bloques en ticket */}
                  <div className="mb-3 pb-3" style={{ borderBottom: '1px dashed #222' }}>
                    <p className="text-[10px] text-gray-600 uppercase tracking-widest mb-2">Detalle por Bloques</p>
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
                  <div className="text-center p-3 rounded-xl mb-3"
                    style={{ background: 'rgba(34,197,94,0.1)', border: '2px solid rgba(34,197,94,0.3)' }}
                  >
                    <p className="text-[10px] uppercase tracking-widest mb-1" style={{ color: '#22c55e' }}>Peso Total</p>
                    <p className="text-3xl font-extrabold font-mono" style={{ color: '#22c55e' }}>
                      {ticketVisible.pesoTotal.toFixed(2)}
                      <span className="text-sm ml-1" style={{ color: '#22c55e80' }}>Kg</span>
                    </p>
                  </div>

                  {/* Datos entrega */}
                  <div className="mb-3 pb-3" style={{ borderBottom: '1px dashed #222' }}>
                    <p className="text-[10px] text-gray-600 uppercase tracking-widest mb-2">Datos de Entrega</p>
                    <div className="space-y-1">
                      {[
                        ['Conductor', ticketVisible.conductor],
                        ['Placa', ticketVisible.conductorPlaca],
                        ['Zona', ticketVisible.zona],
                      ].map(([label, value]) => (
                        <div key={label} className="flex justify-between text-xs">
                          <span className="text-gray-500">{label}</span>
                          <span className="text-white font-bold">{value}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="text-center pt-2">
                    <p className="text-[11px] text-gray-500">{ticketVisible.fechaEmision} — {ticketVisible.horaEmision}</p>
                    <p className="text-[9px] text-gray-700 mt-2 tracking-widest uppercase">Avícola Jossy — Sistema de Gestión</p>
                  </div>
                </div>
              </div>

              {/* Botones */}
              <div className="flex gap-2">
                <button onClick={handlePrint}
                  className="flex-1 py-3 rounded-xl font-bold text-white transition-all hover:scale-105 flex items-center justify-center gap-2"
                  style={{ background: 'linear-gradient(to right, #0d4a24, #22c55e)', boxShadow: '0 4px 12px rgba(34,197,94,0.3)' }}
                >
                  <Printer className="w-4 h-4" />
                  Imprimir
                </button>
                <button onClick={() => setTicketVisible(null)}
                  className="px-4 py-3 rounded-xl font-bold text-gray-400 transition-all hover:scale-105"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            <div className="rounded-xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
              {pedidosPesados.length === 0 ? (
                <div className="p-8 text-center">
                  <FileText className="w-10 h-10 mx-auto mb-3" style={{ color: '#ccaa0030' }} />
                  <p className="text-gray-500 text-sm">Sin tickets emitidos aún</p>
                </div>
              ) : (
                <div className="divide-y" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
                  {pedidosPesados.map((pedido) => (
                    <div key={pedido.id} className="flex items-center justify-between px-4 py-3 hover:bg-white/5 transition-colors">
                      <div>
                        <p className="text-sm text-white font-medium">{pedido.cliente}</p>
                        <p className="text-xs text-gray-500">{pedido.tipoAve} · {pedido.cantidad} unids.</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold font-mono" style={{ color: '#22c55e' }}>
                          {pedido.pesoKg?.toFixed(2)} Kg
                        </p>
                        <p className="text-xs text-gray-600">{pedido.conductor}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
