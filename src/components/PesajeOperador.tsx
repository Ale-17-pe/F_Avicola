import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
  Scale, MapPin, User, Printer, CheckCircle, Package, X, FileText, Usb, Wifi,
  RotateCcw, Monitor, Box, Plus, Lock, ChevronLeft, ChevronRight,
  ArrowLeft, Layers, Users, Truck, XCircle,
} from 'lucide-react';
import { useApp, PedidoConfirmado, BloquePesaje } from '../contexts/AppContext';
import { useTheme, t } from '../contexts/ThemeContext';
import { toast } from 'sonner';

// ===================== CONSTANTES =====================

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
const NUM_SLOTS = 4;

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
  stock: number;
}

// Entry in the multi-container selection for non-Vivo
interface ContenedorSeleccion {
  contenedorId: string;
  cantidad: number;
}

interface SubPedidoEstado {
  pesadas: PesadaParcial[];
  completado: boolean;
  // Vivo flow: single jaba reference
  contenedorId: string;
  cantidadContenedores: number;
  pesoJabaEditable: number;
  faseConfirmandoContenedor: boolean;
  cantidadContenedoresInput: string;
  // Non-Vivo flow: multiple container types
  contenedoresMultiple: ContenedorSeleccion[];
  stockInsuficiente: boolean;
}

interface SlotData {
  grupoId: string;
  cliente: string;
  pedidos: PedidoConfirmado[];
  currentSubIdx: number;
  subEstados: Record<string, SubPedidoEstado>;
  conductorId: string;
  zonaId: string;
  zonaBloqueada: boolean;
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
  // For multi-container (non-Vivo)
  contenedoresDetalle: { tipo: string; cantidad: number; pesoUnit: number; pesoTotal: number }[];
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
  conductorVehiculo: string;
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

// ===================== HELPERS =====================

function getAbreviacion(pedido: PedidoConfirmado): string {
  const pres = pedido.presentacion?.toLowerCase() || '';
  const presLetra = pres.charAt(0).toUpperCase();
  let abbr = pedido.tipoAve || '';
  abbr += ` ${presLetra}`;
  if (pedido.tipoAve?.toLowerCase().includes('gallina') && pedido.variedad) {
    abbr += `-${pedido.variedad.charAt(0).toUpperCase()}`;
  }
  abbr += `-${pedido.cantidad}`;
  return abbr;
}

function crearSubEstado(pedido: PedidoConfirmado, allContenedores: ContenedorOpcion[]): SubPedidoEstado {
  const esVivo = !!pedido.presentacion?.toLowerCase().includes('vivo');
  let contenedorId = '';
  let cantidadContenedores = 0;
  let cantidadContenedoresInput = '';
  let stockInsuficiente = false;

  if (esVivo) {
    contenedorId = JABA_ESTANDAR.id;
    if (pedido.cantidadJabas && pedido.cantidadJabas > 0) {
      cantidadContenedores = pedido.cantidadJabas;
      cantidadContenedoresInput = String(pedido.cantidadJabas);
      // Check jaba stock
      const jabaEnAlmacen = allContenedores.find(ct => ct.tipo.toLowerCase().includes('jaba'));
      if (jabaEnAlmacen) {
        stockInsuficiente = (jabaEnAlmacen.stock ?? 0) < pedido.cantidadJabas;
      }
    }
  } else if (pedido.contenedor) {
    const contDef = allContenedores.find(ct => ct.tipo === pedido.contenedor);
    if (contDef) contenedorId = contDef.id;
  }

  return {
    pesadas: [],
    completado: false,
    contenedorId,
    cantidadContenedores,
    pesoJabaEditable: JABA_ESTANDAR.peso,
    faseConfirmandoContenedor: false,
    cantidadContenedoresInput,
    contenedoresMultiple: [],
    stockInsuficiente,
  };
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
  const { pedidosConfirmados, updatePedidoConfirmado, contenedores, setContenedores, clientes, conductoresRegistrados, vehiculos } = useApp();
  const { isDark } = useTheme();
  const c = t(isDark);
  const scale = useSerialScale();
  const broadcastRef = useRef<BroadcastChannel | null>(null);
  const ticketRef = useRef<HTMLDivElement>(null);
  const balanzaInputRef = useRef<HTMLInputElement>(null);

  // Conductores disponibles (solo los que están en estado "Esperando")
  const CONDUCTORES = useMemo(() =>
    conductoresRegistrados
      .filter(cd => cd.estado === 'Esperando')
      .map(cd => ({ id: cd.id, nombre: cd.nombre })),
    [conductoresRegistrados]
  );

  useEffect(() => {
    broadcastRef.current = new BroadcastChannel('pesaje-display');
    return () => broadcastRef.current?.close();
  }, []);

  // ── State ──
  const [slots, setSlots] = useState<(SlotData | null)[]>(Array(NUM_SLOTS).fill(null));
  const [activeSlotIdx, setActiveSlotIdx] = useState<number | null>(null);
  const [modoManual, setModoManual] = useState(true);
  const [pesoManualInput, setPesoManualInput] = useState('');
  const [jabasEnEstaPesada, setJabasEnEstaPesada] = useState('');
  const [selectedClienteBottom, setSelectedClienteBottom] = useState<string | null>(null);
  const [bottomMode, setBottomMode] = useState<'clientes' | 'registro'>('clientes');
  const [ticketVisible, setTicketVisible] = useState<ConsolidatedTicketData | null>(null);

  // ── Derived data ──
  const pedidosEnPesaje = pedidosConfirmados
    .filter(p => p.estado === 'En Pesaje')
    .sort((a, b) => a.prioridad - b.prioridad);

  const pedidosIdsCargados = useMemo(() => {
    const ids = new Set<string>();
    slots.forEach(slot => {
      if (slot) slot.pedidos.forEach(p => ids.add(p.id));
    });
    return ids;
  }, [slots]);

  const pedidosDisponibles = pedidosEnPesaje.filter(p => !pedidosIdsCargados.has(p.id));

  const clientesEnPesaje: ClienteEnPesaje[] = useMemo(() => {
    const map = new Map<string, PedidoConfirmado[]>();
    pedidosDisponibles.forEach(p => {
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
  }, [pedidosDisponibles]);

  // Active slot derived data
  const activeSlot = activeSlotIdx !== null ? slots[activeSlotIdx] : null;
  const activeSubPedido = activeSlot ? activeSlot.pedidos[activeSlot.currentSubIdx] : null;
  const activeSubEstado = activeSlot && activeSubPedido ? activeSlot.subEstados[activeSubPedido.id] : null;
  const esVivoActivo = !!activeSubPedido?.presentacion?.toLowerCase().includes('vivo');
  const pesoActual = modoManual ? parseFloat(pesoManualInput) || 0 : scale.currentWeight;
  const totalJabasActivo = activeSubPedido?.cantidadJabas || 0;
  const jabasPesadasActivo = activeSubEstado?.pesadas.reduce((s, p) => s + (p.jabas || 0), 0) || 0;
  const jabasRestantesActivo = totalJabasActivo - jabasPesadasActivo;
  const jabasInput = parseInt(jabasEnEstaPesada) || 0;
  const pesoBrutoActivoActual = activeSubEstado?.pesadas.reduce((s, p) => s + p.peso, 0) || 0;

  // ── Slot management ──

  const updateSlot = useCallback((idx: number, updater: (slot: SlotData) => SlotData) => {
    setSlots(prev => {
      const next = [...prev];
      if (next[idx]) next[idx] = updater(next[idx]!);
      return next;
    });
  }, []);

  const loadGrupoIntoSlot = useCallback((grupo: GrupoPesaje) => {
    const emptyIdx = slots.findIndex(s => s === null);
    if (emptyIdx === -1) {
      toast.error('Todos los slots están ocupados. Retire un pedido primero.');
      return;
    }
    const contsDisp: ContenedorOpcion[] = contenedores.map(ct => ({ id: ct.id, tipo: ct.tipo, peso: ct.peso }));
    const subEstados: Record<string, SubPedidoEstado> = {};
    grupo.pedidos.forEach(p => {
      subEstados[p.id] = crearSubEstado(p, contsDisp);
    });

    const clienteObj = clientes.find(cl => cl.nombre === grupo.pedidos[0]?.cliente);
    let zonaId = '';
    let zonaBloqueada = false;
    if (clienteObj?.zona) {
      const zonaMatch = ZONAS.find(z =>
        z.id === clienteObj.zona ||
        z.nombre.toLowerCase().includes(clienteObj.zona.toLowerCase())
      );
      if (zonaMatch) { zonaId = zonaMatch.id; zonaBloqueada = true; }
    }

    const slotData: SlotData = {
      grupoId: grupo.grupoId,
      cliente: grupo.pedidos[0]?.cliente || '',
      pedidos: grupo.pedidos,
      currentSubIdx: 0,
      subEstados,
      conductorId: '',
      zonaId,
      zonaBloqueada,
    };

    setSlots(prev => {
      const next = [...prev];
      next[emptyIdx] = slotData;
      return next;
    });
    setActiveSlotIdx(emptyIdx);
    setBottomMode('registro');
    setPesoManualInput('');
    setJabasEnEstaPesada('');

    broadcastRef.current?.postMessage({
      type: 'pedido-selected',
      pedido: {
        cliente: grupo.pedidos[0]?.cliente,
        tipoAve: grupo.pedidos[0]?.tipoAve,
        cantidad: grupo.pedidos[0]?.cantidad,
        presentacion: grupo.pedidos[0]?.presentacion,
      },
    });
    toast.success(`Bloque cargado en slot ${emptyIdx + 1}`);
    setTimeout(() => balanzaInputRef.current?.focus(), 100);
  }, [slots, contenedores, clientes]);

  const unloadSlot = useCallback((idx: number) => {
    const slot = slots[idx];
    if (!slot) return;
    const hasPesadas = Object.values(slot.subEstados).some(s => s.pesadas.length > 0);
    if (hasPesadas) {
      if (!window.confirm('¿Retirar este pedido? Se perderán las pesadas registradas.')) return;
    }
    setSlots(prev => {
      const next = [...prev];
      next[idx] = null;
      return next;
    });
    if (activeSlotIdx === idx) {
      setActiveSlotIdx(null);
      setBottomMode('clientes');
    }
    toast.info('Pedido retirado del slot');
  }, [slots, activeSlotIdx]);

  const activateSlot = useCallback((idx: number) => {
    if (!slots[idx]) return;
    setActiveSlotIdx(idx);
    setBottomMode('registro');
    setPesoManualInput('');
    setJabasEnEstaPesada('');
    setTimeout(() => balanzaInputRef.current?.focus(), 50);
  }, [slots]);

  const navigateSubOrder = useCallback((slotIdx: number, direction: number) => {
    updateSlot(slotIdx, slot => {
      const newIdx = slot.currentSubIdx + direction;
      if (newIdx < 0 || newIdx >= slot.pedidos.length) return slot;
      return { ...slot, currentSubIdx: newIdx };
    });
    setPesoManualInput('');
    setJabasEnEstaPesada('');
  }, [updateSlot]);

  // ── Pesaje handlers ──

  const sumarPesada = useCallback(() => {
    if (activeSlotIdx === null || !activeSlot || !activeSubPedido || !activeSubEstado) return;
    if (activeSubEstado.completado || activeSubEstado.faseConfirmandoContenedor) return;
    if (pesoActual <= 0) { toast.error('El peso debe ser mayor a 0'); return; }

    if (esVivoActivo && totalJabasActivo > 0) {
      if (jabasInput <= 0) { toast.error('Ingrese cuántas jabas se pesan en esta tanda'); return; }
      if (jabasInput > jabasRestantesActivo) { toast.error(`Solo quedan ${jabasRestantesActivo} jabas por pesar`); return; }
    }

    const nueva: PesadaParcial = {
      numero: activeSubEstado.pesadas.length + 1,
      peso: pesoActual,
      ...(esVivoActivo && totalJabasActivo > 0 ? { jabas: jabasInput } : {}),
    };

    const slotIdx = activeSlotIdx;
    const pedidoId = activeSubPedido.id;
    updateSlot(slotIdx, slot => {
      const subEst = { ...slot.subEstados[pedidoId] };
      subEst.pesadas = [...subEst.pesadas, nueva];
      if (esVivoActivo && totalJabasActivo > 0) {
        const newJabasPesadas = subEst.pesadas.reduce((s, p) => s + (p.jabas || 0), 0);
        if (newJabasPesadas >= totalJabasActivo) {
          subEst.completado = true;
        }
      }
      return { ...slot, subEstados: { ...slot.subEstados, [pedidoId]: subEst } };
    });

    setPesoManualInput('');
    setJabasEnEstaPesada('');
    const jabasMsg = nueva.jabas ? ` (${nueva.jabas} jabas)` : '';
    const acum = pesoBrutoActivoActual + pesoActual;
    toast.success(`P-${nueva.numero}: ${pesoActual.toFixed(2)} kg${jabasMsg} → Acum: ${acum.toFixed(2)} kg`);
    broadcastRef.current?.postMessage({ type: 'weight-update', weight: acum, stable: true, timestamp: Date.now() });
    setTimeout(() => balanzaInputRef.current?.focus(), 50);
  }, [activeSlotIdx, activeSlot, activeSubPedido, activeSubEstado, pesoActual, esVivoActivo, totalJabasActivo, jabasInput, jabasRestantesActivo, pesoBrutoActivoActual, updateSlot]);

  const quitarUltimaPesada = useCallback(() => {
    if (activeSlotIdx === null || !activeSubPedido || !activeSubEstado) return;
    if (activeSubEstado.pesadas.length === 0) return;
    const pedidoId = activeSubPedido.id;
    updateSlot(activeSlotIdx, slot => {
      const subEst = { ...slot.subEstados[pedidoId] };
      subEst.pesadas = subEst.pesadas.slice(0, -1);
      subEst.completado = false;
      return { ...slot, subEstados: { ...slot.subEstados, [pedidoId]: subEst } };
    });
    toast.info('Última pesada eliminada');
  }, [activeSlotIdx, activeSubPedido, activeSubEstado, updateSlot]);

  const terminarSubOrden = useCallback(() => {
    if (activeSlotIdx === null || !activeSubPedido || !activeSubEstado) return;
    if (activeSubEstado.pesadas.length === 0) { toast.error('Registre al menos una pesada'); return; }
    const pedidoId = activeSubPedido.id;
    updateSlot(activeSlotIdx, slot => ({
      ...slot,
      subEstados: {
        ...slot.subEstados,
        [pedidoId]: { ...slot.subEstados[pedidoId], faseConfirmandoContenedor: true },
      },
    }));
  }, [activeSlotIdx, activeSubPedido, activeSubEstado, updateSlot]);

  const confirmarContenedorSub = useCallback((slotIdx: number, pedidoId: string) => {
    const slot = slots[slotIdx];
    if (!slot) return;
    const subEst = slot.subEstados[pedidoId];
    if (!subEst) return;
    const pedido = slot.pedidos.find(p => p.id === pedidoId);
    const esVivo = !!pedido?.presentacion?.toLowerCase().includes('vivo');

    if (esVivo) {
      // Vivo: single jaba type
      if (!subEst.contenedorId) { toast.error('Seleccione un contenedor'); return; }
      const cant = parseInt(subEst.cantidadContenedoresInput) || 0;
      if (cant <= 0) { toast.error('Ingrese cantidad de contenedores'); return; }
      // Consume stock from global
      const jabaEnAlmacen = contenedores.find(ct => ct.tipo.toLowerCase().includes('jaba'));
      if (jabaEnAlmacen) {
        if ((jabaEnAlmacen.stock ?? 0) < cant) {
          toast.error(`Stock insuficiente de jabas. Disponible: ${jabaEnAlmacen.stock ?? 0}, Requerido: ${cant}`);
          return;
        }
        setContenedores(contenedores.map(ct =>
          ct.id === jabaEnAlmacen.id ? { ...ct, stock: (ct.stock ?? 0) - cant } : ct
        ));
      }
      updateSlot(slotIdx, s => ({
        ...s,
        subEstados: {
          ...s.subEstados,
          [pedidoId]: { ...s.subEstados[pedidoId], completado: true, faseConfirmandoContenedor: false, cantidadContenedores: cant, stockInsuficiente: false },
        },
      }));
    } else {
      // Non-Vivo: multiple container types
      const selecciones = subEst.contenedoresMultiple.filter(s => s.contenedorId && s.cantidad > 0);
      if (selecciones.length === 0) { toast.error('Agregue al menos un tipo de contenedor'); return; }
      // Validate stock
      for (const sel of selecciones) {
        const ct = contenedores.find(c => c.id === sel.contenedorId);
        if (!ct) { toast.error('Contenedor no encontrado'); return; }
        if ((ct.stock ?? 0) < sel.cantidad) {
          toast.error(`Stock insuficiente de "${ct.tipo}". Disponible: ${ct.stock ?? 0}, Requerido: ${sel.cantidad}`);
          return;
        }
      }
      // Consume stock
      const nuevosCont = contenedores.map(ct => {
        const sel = selecciones.find(s => s.contenedorId === ct.id);
        if (sel) return { ...ct, stock: (ct.stock ?? 0) - sel.cantidad };
        return ct;
      });
      setContenedores(nuevosCont);
      const totalCant = selecciones.reduce((s, sel) => s + sel.cantidad, 0);
      updateSlot(slotIdx, s => ({
        ...s,
        subEstados: {
          ...s.subEstados,
          [pedidoId]: { ...s.subEstados[pedidoId], completado: true, faseConfirmandoContenedor: false, cantidadContenedores: totalCant, contenedoresMultiple: selecciones },
        },
      }));
    }
    toast.success('Sub-pedido pesado y confirmado');
  }, [slots, updateSlot, contenedores, setContenedores]);

  const cancelarConfirmacion = useCallback(() => {
    if (activeSlotIdx === null || !activeSubPedido) return;
    const pedidoId = activeSubPedido.id;
    updateSlot(activeSlotIdx, s => ({
      ...s,
      subEstados: {
        ...s.subEstados,
        [pedidoId]: { ...s.subEstados[pedidoId], faseConfirmandoContenedor: false },
      },
    }));
  }, [activeSlotIdx, activeSubPedido, updateSlot]);

  const updateSubField = useCallback((slotIdx: number, pedidoId: string, field: keyof SubPedidoEstado, value: any) => {
    updateSlot(slotIdx, s => ({
      ...s,
      subEstados: {
        ...s.subEstados,
        [pedidoId]: { ...s.subEstados[pedidoId], [field]: value },
      },
    }));
  }, [updateSlot]);

  // Helper to add/update/remove entries in contenedoresMultiple
  const updateMultiContenedor = useCallback((slotIdx: number, pedidoId: string, index: number, field: 'contenedorId' | 'cantidad', value: string | number) => {
    updateSlot(slotIdx, s => {
      const subEst = s.subEstados[pedidoId];
      if (!subEst) return s;
      const arr = [...subEst.contenedoresMultiple];
      if (!arr[index]) arr[index] = { contenedorId: '', cantidad: 0 };
      arr[index] = { ...arr[index], [field]: field === 'cantidad' ? (parseInt(String(value)) || 0) : value };
      return { ...s, subEstados: { ...s.subEstados, [pedidoId]: { ...subEst, contenedoresMultiple: arr } } };
    });
  }, [updateSlot]);

  const addMultiContenedor = useCallback((slotIdx: number, pedidoId: string) => {
    updateSlot(slotIdx, s => {
      const subEst = s.subEstados[pedidoId];
      if (!subEst) return s;
      return { ...s, subEstados: { ...s.subEstados, [pedidoId]: { ...subEst, contenedoresMultiple: [...subEst.contenedoresMultiple, { contenedorId: '', cantidad: 0 }] } } };
    });
  }, [updateSlot]);

  const removeMultiContenedor = useCallback((slotIdx: number, pedidoId: string, index: number) => {
    updateSlot(slotIdx, s => {
      const subEst = s.subEstados[pedidoId];
      if (!subEst) return s;
      const arr = subEst.contenedoresMultiple.filter((_, i) => i !== index);
      return { ...s, subEstados: { ...s.subEstados, [pedidoId]: { ...subEst, contenedoresMultiple: arr } } };
    });
  }, [updateSlot]);

  // ── Build resultado ──

  const buildResultado = useCallback((pedido: PedidoConfirmado, subEst: SubPedidoEstado): ResultadoPesajeOrden => {
    const esVivo = !!pedido.presentacion?.toLowerCase().includes('vivo');
    const pesoBrutoTotal = subEst.pesadas.reduce((s, p) => s + p.peso, 0);
    let tipoContenedor = '';
    let pesoUnitContenedor = 0;
    let pesoContenedoresTotal = 0;
    let cantidad = subEst.cantidadContenedores;
    const contenedoresDetalle: { tipo: string; cantidad: number; pesoUnit: number; pesoTotal: number }[] = [];

    if (esVivo) {
      tipoContenedor = JABA_ESTANDAR.tipo;
      pesoUnitContenedor = subEst.pesoJabaEditable;
      pesoContenedoresTotal = pesoUnitContenedor * cantidad;
      contenedoresDetalle.push({ tipo: tipoContenedor, cantidad, pesoUnit: pesoUnitContenedor, pesoTotal: pesoContenedoresTotal });
    } else {
      // Multi-container: sum each type's weight contribution
      const selecciones = subEst.contenedoresMultiple.filter(s => s.contenedorId && s.cantidad > 0);
      if (selecciones.length > 0) {
        for (const sel of selecciones) {
          const ct = contenedores.find(c => c.id === sel.contenedorId);
          if (ct) {
            const pesoSel = ct.peso * sel.cantidad;
            pesoContenedoresTotal += pesoSel;
            contenedoresDetalle.push({ tipo: ct.tipo, cantidad: sel.cantidad, pesoUnit: ct.peso, pesoTotal: pesoSel });
          }
        }
        tipoContenedor = contenedoresDetalle.map(d => `${d.cantidad}x ${d.tipo}`).join(', ');
        pesoUnitContenedor = contenedoresDetalle.length === 1 ? contenedoresDetalle[0].pesoUnit : 0;
      } else {
        // Fallback: single container (legacy)
        const cont = contenedores.find(ct => ct.id === subEst.contenedorId);
        tipoContenedor = cont?.tipo || '';
        pesoUnitContenedor = cont?.peso || 0;
        pesoContenedoresTotal = pesoUnitContenedor * cantidad;
        if (cont) contenedoresDetalle.push({ tipo: cont.tipo, cantidad, pesoUnit: pesoUnitContenedor, pesoTotal: pesoContenedoresTotal });
      }
    }
    const pesoNetoTotal = pesoBrutoTotal - pesoContenedoresTotal;
    return {
      pedidoId: pedido.id, pedido, pesadas: subEst.pesadas, pesoBrutoTotal,
      contenedorId: subEst.contenedorId, tipoContenedor, cantidadContenedores: cantidad,
      pesoUnitarioContenedor: pesoUnitContenedor, pesoContenedoresTotal, pesoNetoTotal,
      contenedoresDetalle,
    };
  }, [contenedores]);

  // ── Confirmar / Pendiente ──

  const slotTodosCompletos = useCallback((slotIdx: number): boolean => {
    const slot = slots[slotIdx];
    if (!slot) return false;
    return slot.pedidos.every(p => slot.subEstados[p.id]?.completado);
  }, [slots]);

  const slotListoParaConfirmar = useCallback((slotIdx: number): boolean => {
    const slot = slots[slotIdx];
    if (!slot) return false;
    return slotTodosCompletos(slotIdx) && !!slot.conductorId;
  }, [slots, slotTodosCompletos]);

  const generarTicketYDespachar = useCallback((slot: SlotData, pedidosADespachar: PedidoConfirmado[], slotIdx: number) => {
    // Buscar en todos los conductores registrados (no solo los disponibles)
    const conductor = conductoresRegistrados.find(cd => cd.id === slot.conductorId);
    const zona = ZONAS.find(z => z.id === slot.zonaId);
    if (!conductor) { toast.error('Asigne un conductor'); return null; }

    // Buscar vehículo asignado a la zona seleccionada
    const vehiculoZona = vehiculos.find(v => v.zona === slot.zonaId && v.estado !== 'Mantenimiento');

    const ahora = new Date();
    const peru = new Date(ahora.toLocaleString('en-US', { timeZone: 'America/Lima' }));
    const fechaPeru = `${peru.getFullYear()}-${String(peru.getMonth() + 1).padStart(2, '0')}-${String(peru.getDate()).padStart(2, '0')}`;
    const numeroTicket = `TK-${ahora.getFullYear()}${(ahora.getMonth() + 1).toString().padStart(2, '0')}${ahora.getDate().toString().padStart(2, '0')}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    const resultados: ResultadoPesajeOrden[] = [];
    pedidosADespachar.forEach(pedido => {
      const subEst = slot.subEstados[pedido.id];
      if (!subEst?.completado) return;
      const resultado = buildResultado(pedido, subEst);
      resultados.push(resultado);

      const bloquesPesaje: BloquePesaje[] = resultado.pesadas.map((p, i) => ({
        numero: i + 1, tamano: 0, pesoBruto: p.peso,
        tipoContenedor: resultado.tipoContenedor,
        pesoContenedor: resultado.pesoContenedoresTotal,
        cantidadContenedores: resultado.cantidadContenedores,
      }));

      updatePedidoConfirmado(pedido.id, {
        ...pedido,
        contenedor: resultado.tipoContenedor,
        pesoBrutoTotal: resultado.pesoBrutoTotal,
        pesoNetoTotal: resultado.pesoNetoTotal,
        pesoKg: resultado.pesoNetoTotal,
        pesoTotalContenedores: resultado.pesoContenedoresTotal,
        cantidadTotalContenedores: resultado.cantidadContenedores,
        contenedoresDetalle: resultado.contenedoresDetalle,
        bloquesPesaje,
        conductor: conductor.nombre,
        zonaEntrega: zona?.nombre || '',
        estado: 'En Despacho',
        ticketEmitido: true,
        fechaPesaje: fechaPeru,
        horaPesaje: ahora.toTimeString().slice(0, 5),
        numeroTicket,
      });
    });

    if (resultados.length === 0) return null;

    const totales = {
      pesoBrutoTotal: resultados.reduce((s, r) => s + r.pesoBrutoTotal, 0),
      pesoContenedoresTotal: resultados.reduce((s, r) => s + r.pesoContenedoresTotal, 0),
      pesoNetoTotal: resultados.reduce((s, r) => s + r.pesoNetoTotal, 0),
    };

    const ticketData: ConsolidatedTicketData = {
      grupoId: slot.grupoId, cliente: slot.cliente, pedidos: resultados, totales,
      conductor: conductor.nombre, conductorPlaca: vehiculoZona?.placa || '—',
      conductorVehiculo: vehiculoZona ? `${vehiculoZona.marca} ${vehiculoZona.modelo} (${vehiculoZona.placa})` : '—',
      zona: zona?.nombre || '',
      fechaEmision: ahora.toLocaleDateString('es-PE'),
      horaEmision: ahora.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' }),
      numeroTicket,
    };

    broadcastRef.current?.postMessage({ type: 'ticket-emitido', ticket: numeroTicket, pesoTotal: totales.pesoBrutoTotal });
    return ticketData;
  }, [buildResultado, updatePedidoConfirmado, conductoresRegistrados, vehiculos]);

  const confirmarSlot = useCallback((slotIdx: number) => {
    const slot = slots[slotIdx];
    if (!slot) return;
    if (!slotListoParaConfirmar(slotIdx)) {
      if (!slot.conductorId) toast.error('Asigne un conductor en el panel inferior');
      else toast.error('No todos los sub-pedidos están completados');
      return;
    }
    const ticketData = generarTicketYDespachar(slot, slot.pedidos, slotIdx);
    if (ticketData) {
      setTicketVisible(ticketData);
      setSlots(prev => { const next = [...prev]; next[slotIdx] = null; return next; });
      if (activeSlotIdx === slotIdx) { setActiveSlotIdx(null); setBottomMode('clientes'); }
      toast.success(`Ticket ${ticketData.numeroTicket} emitido — ${ticketData.pedidos.length} pedido(s)`);
    }
  }, [slots, activeSlotIdx, slotListoParaConfirmar, generarTicketYDespachar]);

  const pendienteSlot = useCallback((slotIdx: number) => {
    const slot = slots[slotIdx];
    if (!slot) return;
    const completados = slot.pedidos.filter(p => slot.subEstados[p.id]?.completado);
    const noCompletados = slot.pedidos.filter(p => !slot.subEstados[p.id]?.completado);

    if (completados.length === 0) {
      setSlots(prev => { const next = [...prev]; next[slotIdx] = null; return next; });
      if (activeSlotIdx === slotIdx) { setActiveSlotIdx(null); setBottomMode('clientes'); }
      toast.info('Pedidos devueltos a pendiente');
      return;
    }

    if (slot.conductorId) {
      const ticketData = generarTicketYDespachar(slot, completados, slotIdx);
      if (ticketData) {
        setTicketVisible(ticketData);
        toast.success(`${completados.length} pedido(s) despachados, ${noCompletados.length} devueltos a pendiente`);
      }
    } else {
      toast.info(`${noCompletados.length} sub-pedido(s) devueltos a pendiente`);
    }

    setSlots(prev => { const next = [...prev]; next[slotIdx] = null; return next; });
    if (activeSlotIdx === slotIdx) { setActiveSlotIdx(null); setBottomMode('clientes'); }
  }, [slots, activeSlotIdx, generarTicketYDespachar]);

  // ── Misc ──

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

  // Number of loaded slots
  const slotsOcupados = slots.filter(s => s !== null).length;

  // ===================== RENDER =====================
  return (
    <div className="flex flex-col gap-3" style={{ minHeight: 'calc(100vh - 80px)' }}>

      {/* ═══════ HEADER BAR ═══════ */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg" style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.15)' }}>
            <Package className="w-4 h-4 text-amber-500" />
            <span className="text-sm font-bold text-amber-400">{pedidosEnPesaje.length}</span>
            <span className="text-xs" style={{ color: c.textMuted }}>en cola</span>
          </div>
          {slotsOcupados > 0 && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg" style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.15)' }}>
              <Scale className="w-4 h-4 text-green-500" />
              <span className="text-sm font-bold text-green-400">{slotsOcupados}</span>
              <span className="text-xs" style={{ color: c.textMuted }}>en pesaje</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setModoManual(!modoManual)} className="text-xs px-3 py-2 rounded-xl font-semibold"
            style={{ background: modoManual ? 'rgba(59,130,246,0.08)' : 'rgba(34,197,94,0.08)', border: `1px solid ${modoManual ? 'rgba(59,130,246,0.2)' : 'rgba(34,197,94,0.2)'}`, color: modoManual ? '#60a5fa' : '#22c55e' }}>
            {modoManual ? '⌨ Manual' : '⚖ Balanza'}
          </button>
          <button onClick={abrirPantallaDisplay} className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold"
            style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)', color: '#60a5fa' }}>
            <Monitor className="w-3.5 h-3.5" /> Display
          </button>
          <button
            onClick={() => { if (scale.connected) { scale.disconnect(); setModoManual(true); } else { scale.connect().then(ok => { if (ok) setModoManual(false); }); } }}
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold"
            style={{ background: scale.connected ? 'rgba(34,197,94,0.08)' : 'rgba(245,158,11,0.08)', border: `1px solid ${scale.connected ? 'rgba(34,197,94,0.2)' : 'rgba(245,158,11,0.2)'}`, color: scale.connected ? '#22c55e' : '#f59e0b' }}>
            {scale.connected ? <Wifi className="w-3.5 h-3.5" /> : <Usb className="w-3.5 h-3.5" />}
            {scale.connected ? 'Conectada' : 'Balanza'}
          </button>
        </div>
      </div>

      {/* ═══════ BALANZA ═══════ */}
      <div className="rounded-2xl relative overflow-hidden"
        style={{
          background: isDark ? 'linear-gradient(160deg, #0a0a0a, #141414)' : c.bgCard,
          border: activeSlotIdx !== null ? '2px solid rgba(34,197,94,0.4)' : '2px solid ' + c.borderSubtle,
          boxShadow: activeSlotIdx !== null ? '0 0 25px rgba(34,197,94,0.08)' : 'none',
        }}>

        {/* Balanza label */}
        <div className="flex items-center justify-between px-5 py-2" style={{ borderBottom: '1px solid ' + c.g04 }}>
          <span className="text-[11px] font-black uppercase tracking-[0.2em]" style={{ color: c.textMuted }}>BALANZA</span>
          {activeSlot && (
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: 'rgba(34,197,94,0.1)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.2)' }}>
              Slot {(activeSlotIdx ?? 0) + 1} · {activeSlot.cliente}
            </span>
          )}
          {!activeSlot && (
            <span className="text-[10px]" style={{ color: c.textMuted }}>Seleccione un slot para pesar</span>
          )}
        </div>

        {/* Weight input area */}
        <div className="px-5 py-4">
          {modoManual ? (
            <div className="relative max-w-2xl mx-auto">
              <Scale className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-blue-400/30" />
              <input
                ref={balanzaInputRef}
                type="number" step="0.01" min="0"
                value={pesoManualInput}
                onChange={(e) => setPesoManualInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && pesoActual > 0) sumarPesada(); }}
                placeholder="0.00"
                disabled={activeSlotIdx === null || !activeSubEstado || activeSubEstado.completado || activeSubEstado.faseConfirmandoContenedor}
                className="w-full pl-14 pr-14 py-5 rounded-2xl text-5xl font-black font-mono text-center placeholder-gray-700 focus:ring-2 focus:ring-blue-500/30 transition-all disabled:opacity-40"
                style={{ background: c.bgCardAlt, border: '1px solid rgba(59,130,246,0.25)', color: c.text }}
                autoFocus
              />
              <span className="absolute right-5 top-1/2 -translate-y-1/2 text-lg font-bold text-blue-400/30">Kg</span>
            </div>
          ) : (
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-1">
                <div className={`w-2 h-2 rounded-full ${scale.connected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
                <span className="text-xs" style={{ color: c.textMuted }}>{scale.connected ? (scale.stable ? 'Estable' : 'Estabilizando...') : 'Sin conexión'}</span>
              </div>
              <p className="text-5xl font-black font-mono tabular-nums" style={{ color: scale.stable ? '#22c55e' : '#f59e0b' }}>
                {scale.currentWeight.toFixed(2)}
              </p>
              <p className="text-sm font-light" style={{ color: c.textMuted }}>Kg</p>
            </div>
          )}

          {/* Jabas input (only for active Vivo sub-order) */}
          {activeSubPedido && esVivoActivo && totalJabasActivo > 0 && !activeSubEstado?.completado && !activeSubEstado?.faseConfirmandoContenedor && (
            <div className="max-w-md mx-auto mt-3 flex items-center gap-3 p-2.5 rounded-xl"
              style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.2)' }}>
              <Box className="w-5 h-5 text-amber-400/60 flex-shrink-0" />
              <div className="flex-1">
                <label className="text-[10px] text-amber-400 font-bold uppercase tracking-wider">Jabas en esta pesada</label>
                <input type="number" min="1" max={jabasRestantesActivo}
                  value={jabasEnEstaPesada}
                  onChange={(e) => setJabasEnEstaPesada(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter' && pesoActual > 0) sumarPesada(); }}
                  placeholder={`1-${jabasRestantesActivo}`}
                  className="w-full mt-1 px-3 py-1.5 rounded-lg text-lg font-black font-mono text-center placeholder-gray-700 focus:ring-2 focus:ring-amber-500/30"
                  style={{ color: c.text, background: c.bgCardAlt, border: '1px solid rgba(245,158,11,0.3)' }}
                />
              </div>
              <div className="text-right flex-shrink-0">
                <div className="text-[9px]" style={{ color: c.textMuted }}>quedan</div>
                <div className="text-lg font-black text-amber-400 tabular-nums">{jabasRestantesActivo}</div>
              </div>
            </div>
          )}

          {/* Quick info & actions */}
          <div className="flex items-center justify-center gap-3 mt-2 flex-wrap">
            <p className="text-[10px]" style={{ color: c.textMuted }}>
              <kbd className="px-1.5 py-0.5 rounded text-[10px]" style={{ background: c.bgCard, color: c.text }}>Enter</kbd> sumar pesada
            </p>
            {activeSubEstado && activeSubEstado.pesadas.length > 0 && !activeSubEstado.completado && (
              <button onClick={quitarUltimaPesada} className="text-[10px] flex items-center gap-1 hover:text-amber-400 transition-colors" style={{ color: c.textMuted }}>
                <RotateCcw className="w-3 h-3" /> Deshacer
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ═══════ SLOTS: Tarjetas estilo NuevoPedido (columnas verticales) ═══════ */}
      <div className="flex flex-row gap-4 flex-shrink-0">
        {slots.map((slot, idx) => {
          const isActive = activeSlotIdx === idx;
          const listo = slot ? slotListoParaConfirmar(idx) : false;
          const slotColors = ['#22c55e', '#3b82f6', '#a855f7', '#f59e0b'];
          const slotColor = slotColors[idx % slotColors.length];

          return (
            <div key={`col-${idx}`}
              className="flex-1 border rounded-2xl p-4 relative transition-all duration-300 flex flex-col"
              style={{
                background: isActive ? (isDark ? c.bgCardAlt : '#f0fdf4') : c.bgCardAlt,
                borderColor: isActive ? `${slotColor}80` : slot ? c.border : (isDark ? 'rgba(255,255,255,0.06)' : c.border),
                boxShadow: isActive ? `0 10px 40px -10px ${slotColor}40` : slot ? c.shadowMd : 'none',
                minWidth: 0,
              }}>

              {/* Status dot (top-right) */}
              <div className="absolute top-3 right-3 z-10">
                {slot ? (
                  slot.pedidos.every(p => slot.subEstados[p.id]?.completado)
                    ? <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" /><span className="text-[10px] font-medium" style={{ color: isDark ? '#4ade80' : '#166534' }}>Listo</span></div>
                    : slot.pedidos.some(p => slot.subEstados[p.id]?.pesadas.length > 0)
                      ? <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-amber-500" /><span className="text-[10px]" style={{ color: isDark ? '#fbbf24' : '#b45309' }}>Pesando</span></div>
                      : <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full" style={{ background: c.borderSubtle }} /><span className="text-[10px]" style={{ color: c.textMuted }}>Cargado</span></div>
                ) : (
                  <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full" style={{ background: c.borderSubtle }} /><span className="text-[10px]" style={{ color: c.textMuted }}>Vacío</span></div>
                )}
              </div>

              {/* Card header: number badge + title */}
              <div className="mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-white shadow-lg flex-shrink-0"
                    style={{ background: `linear-gradient(135deg, ${slotColor}, ${slotColor}dd)`, border: `1px solid ${slotColor}80` }}>
                    {idx + 1}
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-bold text-sm truncate" style={{ color: c.text }}>
                      {slot ? slot.cliente : `Slot ${idx + 1}`}
                    </h3>
                    <p className="text-[10px]" style={{ color: c.textSecondary }}>
                      {slot
                        ? `${slot.pedidos.filter(p => slot.subEstados[p.id]?.completado).length}/${slot.pedidos.length} completados`
                        : 'Sin pedido cargado'}
                    </p>
                  </div>
                </div>
              </div>

              {/* ── Confirmar button ── */}
              <button
                onClick={() => confirmarSlot(idx)}
                disabled={!listo}
                className="w-full py-2.5 rounded-xl font-black text-sm transition-all disabled:opacity-30 disabled:cursor-not-allowed hover:scale-[1.02] active:scale-[0.98] touch-manipulation mb-3 flex items-center justify-center gap-2"
                style={{
                  background: listo ? 'linear-gradient(135deg, #0d4a24, #22c55e)' : (isDark ? c.g04 : '#e5e7eb'),
                  color: listo ? '#fff' : c.textMuted,
                  boxShadow: listo ? '0 4px 12px rgba(34,197,94,0.3)' : 'none',
                  border: listo ? 'none' : '1px solid ' + c.borderSubtle,
                }}>
                <CheckCircle className="w-4 h-4" />
                Confirmar
              </button>

              {/* ── Slot content (center) ── */}
              <div className="flex-1 flex flex-col min-h-0">
                {!slot ? (
                  /* Empty slot */
                  <div
                    onClick={() => {/* empty — users load from bottom panel */}}
                    className="flex-1 rounded-xl flex flex-col items-center justify-center cursor-default select-none touch-manipulation border-2 border-dashed"
                    style={{
                      borderColor: c.borderSubtle,
                      background: isDark ? 'rgba(255,255,255,0.01)' : 'rgba(0,0,0,0.02)',
                      minHeight: '160px',
                    }}>
                    <Scale className="w-10 h-10 mb-2" style={{ color: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.08)' }} />
                    <span className="text-[11px] font-medium" style={{ color: c.textMuted }}>Cargue un pedido</span>
                    <span className="text-[9px] mt-0.5" style={{ color: c.textMuted }}>desde el panel inferior</span>
                  </div>
                ) : (() => {
                  const subPed = slot.pedidos[slot.currentSubIdx];
                  const subEst = subPed ? slot.subEstados[subPed.id] : null;
                  const esVivo = !!subPed?.presentacion?.toLowerCase().includes('vivo');
                  const brutoSub = subEst?.pesadas.reduce((s, p) => s + p.peso, 0) || 0;

                  return (
                    <div
                      onClick={() => activateSlot(idx)}
                      className="flex-1 rounded-xl overflow-hidden flex flex-col cursor-pointer select-none transition-all touch-manipulation border"
                      style={{
                        background: isActive ? (isDark ? 'rgba(34,197,94,0.04)' : '#f0fdf4') : c.bgCard,
                        borderColor: isActive ? `${slotColor}50` : c.border,
                        minHeight: '160px',
                      }}>

                      {/* Unload button */}
                      <div className="flex items-center justify-end px-2 pt-1.5">
                        <button onClick={(e) => { e.stopPropagation(); unloadSlot(idx); }}
                          className="p-1.5 rounded-full bg-red-900/20 border border-red-700/30 hover:bg-red-900/30 hover:scale-110 transition-all touch-manipulation"
                          title="Retirar">
                          <X className="w-3.5 h-3.5 text-red-400" />
                        </button>
                      </div>

                      {/* Sub-order navigation */}
                      {slot.pedidos.length > 1 && (
                        <div className="flex items-center justify-center gap-3 px-2 py-1">
                          <button onClick={(e) => { e.stopPropagation(); navigateSubOrder(idx, -1); }}
                            disabled={slot.currentSubIdx <= 0}
                            className="p-1.5 rounded-lg disabled:opacity-20 hover:bg-white/10 transition-colors touch-manipulation border"
                            style={{ borderColor: c.border }}>
                            <ChevronLeft className="w-4 h-4" style={{ color: c.textSecondary }} />
                          </button>
                          <span className="text-xs font-bold font-mono px-2 py-0.5 rounded-lg" style={{ color: c.text, background: c.bgCardAlt, border: `1px solid ${c.border}` }}>
                            {slot.currentSubIdx + 1}/{slot.pedidos.length}
                          </span>
                          <button onClick={(e) => { e.stopPropagation(); navigateSubOrder(idx, 1); }}
                            disabled={slot.currentSubIdx >= slot.pedidos.length - 1}
                            className="p-1.5 rounded-lg disabled:opacity-20 hover:bg-white/10 transition-colors touch-manipulation border"
                            style={{ borderColor: c.border }}>
                            <ChevronRight className="w-4 h-4" style={{ color: c.textSecondary }} />
                          </button>
                        </div>
                      )}

                      {/* Sub-order details */}
                      {subPed && subEst && (
                        <div className="flex-1 flex flex-col px-3 py-2 gap-2 overflow-y-auto">
                          {/* Abbreviated product name */}
                          <div className="text-center py-1">
                            <span className="text-sm font-black" style={{ color: isActive ? '#4ade80' : c.text }}>
                              {getAbreviacion(subPed)}
                            </span>
                          </div>

                          {/* Jabas info for Vivo + stock warning */}
                          {esVivo && (subPed.cantidadJabas || 0) > 0 && (
                            <div className="flex flex-col items-center gap-1">
                              <div className="flex items-center justify-center gap-1.5">
                                <span className="text-[9px] px-1.5 py-0.5 rounded font-bold" style={{ background: 'rgba(245,158,11,0.1)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.2)' }}>
                                  <Lock className="w-2.5 h-2.5 inline mr-0.5" />{subPed.cantidadJabas}j
                                </span>
                                {!subEst.completado && (
                                  <span className="text-[9px]" style={{ color: c.textMuted }}>
                                    restan {(subPed.cantidadJabas || 0) - subEst.pesadas.reduce((s, p) => s + (p.jabas || 0), 0)}
                                  </span>
                                )}
                              </div>
                              {subEst.stockInsuficiente && !subEst.completado && (
                                <span className="text-[9px] px-1.5 py-0.5 rounded font-bold bg-red-900/20 text-red-400 border border-red-700/30">
                                  ⚠ Stock insuficiente — use Pendiente
                                </span>
                              )}
                            </div>
                          )}

                          {/* Pesadas list */}
                          {subEst.pesadas.length > 0 && (
                            <div className="space-y-0.5">
                              {subEst.pesadas.map(p => (
                                <div key={p.numero} className="flex items-center justify-between px-2 py-1 rounded-lg text-[10px] font-mono"
                                  style={{ background: c.bgCardAlt, border: `1px solid ${c.border}` }}>
                                  <span style={{ color: '#4ade80' }}>P-{p.numero}</span>
                                  <span style={{ color: c.text }}>{p.peso.toFixed(2)}{p.jabas ? ` (${p.jabas}j)` : ''}</span>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Gross weight summary */}
                          {subEst.pesadas.length > 0 && (
                            <div className="text-center py-1.5 rounded-xl mt-auto" style={{ background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.15)' }}>
                              <div className="text-[9px] font-bold uppercase" style={{ color: c.textMuted }}>Bruto</div>
                              <div className="text-lg font-black font-mono tabular-nums" style={{ color: '#22c55e' }}>
                                {brutoSub.toFixed(2)}
                              </div>
                            </div>
                          )}

                          {/* Status / Container confirmation for non-Vivo */}
                          {subEst.completado && (
                            <div className="text-center py-1.5">
                              <span className="text-[10px] font-bold text-green-400 flex items-center justify-center gap-1">
                                <CheckCircle className="w-3.5 h-3.5" /> Completado
                              </span>
                            </div>
                          )}

                          {subEst.faseConfirmandoContenedor && !subEst.completado && (
                            <div className="space-y-2 mt-auto rounded-xl p-2.5" style={{ background: c.bgCardAlt, border: `1px solid rgba(245,158,11,0.3)` }} onClick={(e) => e.stopPropagation()}>
                              <div className="text-[10px] font-bold text-amber-400 uppercase text-center">
                                {esVivo ? 'Confirmar Jabas' : 'Seleccionar Contenedores'}
                              </div>

                              {esVivo ? (
                                /* ── Vivo: single jaba with quantity ── */
                                <>
                                  <input type="number" min="1"
                                    value={subEst.cantidadContenedoresInput}
                                    onChange={(e) => updateSubField(idx, subPed.id, 'cantidadContenedoresInput', e.target.value)}
                                    placeholder="Cantidad jabas"
                                    className="w-full px-2 py-1.5 rounded-lg text-sm font-mono text-center"
                                    style={{ background: c.bgCard, border: `1px solid ${c.border}`, color: c.text }}
                                  />
                                  {(() => {
                                    const jabaStock = contenedores.find(ct => ct.tipo.toLowerCase().includes('jaba'));
                                    return jabaStock ? (
                                      <div className="text-[9px] text-center" style={{ color: (jabaStock.stock ?? 0) >= (parseInt(subEst.cantidadContenedoresInput) || 0) ? '#4ade80' : '#ef4444' }}>
                                        Stock: {jabaStock.stock ?? 0} jabas
                                      </div>
                                    ) : null;
                                  })()}
                                </>
                              ) : (
                                /* ── Non-Vivo: multi-container selection ── */
                                <>
                                  {subEst.contenedoresMultiple.map((sel, selIdx) => {
                                    const ctSel = contenedores.find(ct => ct.id === sel.contenedorId);
                                    return (
                                      <div key={selIdx} className="flex gap-1 items-center">
                                        <select
                                          value={sel.contenedorId}
                                          onChange={(e) => updateMultiContenedor(idx, subPed.id, selIdx, 'contenedorId', e.target.value)}
                                          className="flex-1 px-1.5 py-1.5 rounded-lg text-[10px] appearance-none min-w-0"
                                          style={{ background: c.bgCard, border: `1px solid ${c.border}`, color: c.text }}>
                                          <option value="">Tipo...</option>
                                          {contenedores.map(ct => (
                                            <option key={ct.id} value={ct.id} className="bg-gray-900">
                                              {ct.tipo} ({ct.stock ?? 0})
                                            </option>
                                          ))}
                                        </select>
                                        <input type="number" min="1"
                                          value={sel.cantidad || ''}
                                          onChange={(e) => updateMultiContenedor(idx, subPed.id, selIdx, 'cantidad', e.target.value)}
                                          placeholder="#"
                                          className="w-14 px-1.5 py-1.5 rounded-lg text-[10px] font-mono text-center"
                                          style={{ background: c.bgCard, border: `1px solid ${c.border}`, color: c.text }}
                                        />
                                        <button onClick={(e) => { e.stopPropagation(); removeMultiContenedor(idx, subPed.id, selIdx); }}
                                          className="p-1 rounded-md hover:bg-red-900/20 flex-shrink-0">
                                          <X className="w-3 h-3 text-red-400" />
                                        </button>
                                        {ctSel && sel.cantidad > 0 && (
                                          <span className="text-[8px] font-mono flex-shrink-0" style={{ color: (ctSel.stock ?? 0) >= sel.cantidad ? '#4ade80' : '#ef4444' }}>
                                            {(ctSel.stock ?? 0) >= sel.cantidad ? '✓' : '✗'}
                                          </span>
                                        )}
                                      </div>
                                    );
                                  })}
                                  <button onClick={(e) => { e.stopPropagation(); addMultiContenedor(idx, subPed.id); }}
                                    className="w-full py-1 rounded-lg text-[9px] font-bold flex items-center justify-center gap-1 hover:bg-white/5 transition-colors"
                                    style={{ border: `1px dashed ${c.border}`, color: c.textSecondary }}>
                                    <Plus className="w-3 h-3" /> Agregar tipo
                                  </button>
                                  {/* Tara preview */}
                                  {subEst.contenedoresMultiple.filter(s => s.contenedorId && s.cantidad > 0).length > 0 && (
                                    <div className="text-[9px] text-center py-1 rounded-lg" style={{ background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.15)', color: '#60a5fa' }}>
                                      Tara: {subEst.contenedoresMultiple.reduce((sum, s) => {
                                        const ct = contenedores.find(c => c.id === s.contenedorId);
                                        return sum + (ct ? ct.peso * s.cantidad : 0);
                                      }, 0).toFixed(2)} kg
                                      {' · Neto: '}
                                      {(brutoSub - subEst.contenedoresMultiple.reduce((sum, s) => {
                                        const ct = contenedores.find(c => c.id === s.contenedorId);
                                        return sum + (ct ? ct.peso * s.cantidad : 0);
                                      }, 0)).toFixed(2)} kg
                                    </div>
                                  )}
                                </>
                              )}

                              <div className="flex gap-1.5">
                                <button onClick={(e) => { e.stopPropagation(); cancelarConfirmacion(); }}
                                  className="flex-1 py-1.5 rounded-lg text-[10px] font-semibold"
                                  style={{ border: `1px solid ${c.border}`, color: c.textMuted }}>
                                  Volver
                                </button>
                                <button onClick={(e) => { e.stopPropagation(); confirmarContenedorSub(idx, subPed.id); }}
                                  className="flex-1 py-1.5 rounded-lg text-[10px] font-bold text-white"
                                  style={{ background: 'linear-gradient(135deg, #78350f, #d97706)' }}>
                                  OK
                                </button>
                              </div>
                            </div>
                          )}

                          {/* Terminar button for non-Vivo */}
                          {!esVivo && !subEst.completado && !subEst.faseConfirmandoContenedor && subEst.pesadas.length > 0 && isActive && (
                            <button onClick={(e) => { e.stopPropagation(); terminarSubOrden(); }}
                              className="mt-auto py-2 rounded-xl text-[11px] font-bold text-white transition-all hover:scale-[1.02] touch-manipulation flex items-center justify-center gap-1.5"
                              style={{ background: 'linear-gradient(135deg, #0a4d2a, #22c55e)' }}>
                              <CheckCircle className="w-3.5 h-3.5" /> Terminar pesaje
                            </button>
                          )}

                          {/* Empty state */}
                          {subEst.pesadas.length === 0 && !subEst.completado && (
                            <div className="flex-1 flex items-center justify-center">
                              <span className="text-[10px]" style={{ color: c.textMuted }}>
                                {isActive ? 'Ingrese peso en la balanza' : 'Toque para activar'}
                              </span>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Active indicator bar */}
                      {isActive && (
                        <div className="h-1" style={{ background: `linear-gradient(to right, ${slotColor}, ${slotColor}88)` }} />
                      )}
                    </div>
                  );
                })()}
              </div>

              {/* ── Pendiente button ── */}
              <button
                onClick={() => pendienteSlot(idx)}
                disabled={!slot}
                className="w-full py-2.5 rounded-xl font-black text-[11px] uppercase tracking-wider transition-all disabled:opacity-20 disabled:cursor-not-allowed hover:scale-[1.02] active:scale-[0.98] touch-manipulation mt-3 flex items-center justify-center gap-2"
                style={{
                  background: slot ? 'rgba(245,158,11,0.08)' : (isDark ? c.g03 : '#f3f4f6'),
                  border: slot ? '1px solid rgba(245,158,11,0.25)' : `1px solid ${c.borderSubtle}`,
                  color: slot ? '#f59e0b' : c.textMuted,
                }}>
                PENDIENTE
              </button>

            </div>
          );
        })}
      </div>

      {/* ═══════ BOTTOM PANEL ═══════ */}
      <div className="rounded-2xl overflow-hidden flex-1 flex min-h-0" style={{ background: c.g02, border: '1px solid ' + c.borderSubtle, minHeight: '250px' }}>

        {/* Left: Client list */}
        <div className="flex-shrink-0 overflow-y-auto" style={{ width: '180px', borderRight: '1px solid ' + c.g04 }}>
          <div className="px-3 py-2 sticky top-0" style={{ background: c.g02, borderBottom: '1px solid ' + c.g04 }}>
            <span className="text-[10px] font-black uppercase tracking-wider" style={{ color: c.textMuted }}>Clientes</span>
          </div>
          {clientesEnPesaje.length === 0 ? (
            <div className="px-3 py-6 text-center">
              <Users className="w-6 h-6 mx-auto mb-1" style={{ color: c.g08 }} />
              <span className="text-[10px]" style={{ color: c.textMuted }}>Sin pedidos pendientes</span>
            </div>
          ) : (
            clientesEnPesaje.map((cl) => (
              <button key={cl.cliente}
                onClick={() => { setSelectedClienteBottom(cl.cliente); setBottomMode('clientes'); }}
                className="w-full text-left px-3 py-3 transition-colors hover:bg-white/5 touch-manipulation"
                style={{
                  borderBottom: '1px solid ' + c.g04,
                  background: selectedClienteBottom === cl.cliente && bottomMode === 'clientes' ? 'rgba(34,197,94,0.08)' : 'transparent',
                }}>
                <div className="text-xs font-bold truncate" style={{ color: selectedClienteBottom === cl.cliente && bottomMode === 'clientes' ? '#22c55e' : c.text }}>
                  {cl.cliente}
                </div>
                <div className="text-[10px] mt-0.5" style={{ color: c.textMuted }}>
                  {cl.totalPedidos} pedido{cl.totalPedidos > 1 ? 's' : ''} · {cl.grupos.length} bloque{cl.grupos.length > 1 ? 's' : ''}
                </div>
              </button>
            ))
          )}
        </div>

        {/* Right: Content area */}
        <div className="flex-1 overflow-y-auto">

          {/* Registro mode: active slot detail */}
          {bottomMode === 'registro' && activeSlot && activeSlotIdx !== null ? (
            <div className="p-4 space-y-4">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-green-400" />
                  <span className="text-sm font-bold" style={{ color: c.text }}>Registro — Slot {activeSlotIdx + 1}</span>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: 'rgba(34,197,94,0.1)', color: '#22c55e' }}>{activeSlot.cliente}</span>
                </div>
                <button onClick={() => setBottomMode('clientes')} className="text-[10px] px-2 py-1 rounded-lg hover:bg-white/5 touch-manipulation" style={{ color: c.textMuted, border: '1px solid ' + c.g06 }}>
                  Ver clientes
                </button>
              </div>

              {/* Conductor & Zona assignment */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="relative">
                  <Truck className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-400" />
                  <select value={activeSlot.conductorId}
                    onChange={(e) => updateSlot(activeSlotIdx, s => ({ ...s, conductorId: e.target.value }))}
                    className="w-full pl-10 pr-3 py-2.5 rounded-xl text-sm appearance-none"
                    style={{ background: c.bgCard, border: '1px solid rgba(59,130,246,0.2)', color: c.text }}>
                    <option value="">Asignar conductor...</option>
                    {CONDUCTORES.map(cd => <option key={cd.id} value={cd.id} className="bg-gray-900">{cd.nombre}</option>)}
                  </select>
                </div>
                {activeSlot.zonaBloqueada ? (
                  <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl" style={{ background: 'rgba(168,85,247,0.06)', border: '1px solid rgba(168,85,247,0.2)' }}>
                    <Lock className="w-3.5 h-3.5 text-purple-400 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <div className="text-[9px] text-purple-500 font-bold uppercase">Zona</div>
                      <div className="text-xs font-semibold truncate" style={{ color: c.text }}>{ZONAS.find(z => z.id === activeSlot.zonaId)?.nombre || '—'}</div>
                      {(() => {
                        const veh = vehiculos.find(v => v.zona === activeSlot.zonaId && v.estado !== 'Mantenimiento');
                        return veh ? (
                          <div className="text-[9px] mt-0.5 truncate" style={{ color: '#3b82f6' }}>
                            🚛 {veh.marca} {veh.modelo} — {veh.placa}
                          </div>
                        ) : null;
                      })()}
                    </div>
                  </div>
                ) : (
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-400" />
                    <select value={activeSlot.zonaId}
                      onChange={(e) => updateSlot(activeSlotIdx, s => ({ ...s, zonaId: e.target.value }))}
                      className="w-full pl-10 pr-3 py-2.5 rounded-xl text-sm appearance-none"
                      style={{ background: c.bgCard, border: '1px solid rgba(168,85,247,0.2)', color: c.text }}>
                      <option value="">Zona de entrega...</option>
                      {ZONAS.map(z => <option key={z.id} value={z.id} className="bg-gray-900">{z.nombre}</option>)}
                    </select>
                  </div>
                )}
              </div>

              {/* Sub-orders summary */}
              <div className="space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: c.textMuted }}>Pedidos del bloque</span>
                {activeSlot.pedidos.map((ped, pIdx) => {
                  const sEst = activeSlot.subEstados[ped.id];
                  const bruto = sEst?.pesadas.reduce((s, p) => s + p.peso, 0) || 0;
                  return (
                    <div key={ped.id} className="rounded-xl overflow-hidden" style={{ background: c.bgCard, border: '1px solid ' + c.borderSubtle }}>
                      {/* Sub-order header */}
                      <div className="flex items-center justify-between px-3 py-2" style={{ borderBottom: sEst && sEst.pesadas.length > 0 ? '1px solid ' + c.g04 : 'none' }}>
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded flex items-center justify-center text-[9px] font-black" style={{
                            background: sEst?.completado ? 'rgba(34,197,94,0.12)' : 'rgba(59,130,246,0.1)',
                            color: sEst?.completado ? '#22c55e' : '#3b82f6',
                          }}>{pIdx + 1}</span>
                          <span className="text-xs font-bold" style={{ color: c.text }}>{getAbreviacion(ped)}</span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: 'rgba(59,130,246,0.08)', color: '#3b82f6' }}>{ped.presentacion}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {sEst?.completado ? (
                            <span className="text-[10px] font-bold text-green-400 flex items-center gap-1">
                              <CheckCircle className="w-3 h-3" /> Listo
                            </span>
                          ) : sEst && sEst.pesadas.length > 0 ? (
                            <span className="text-[10px] font-bold text-amber-400">Pesando...</span>
                          ) : (
                            <span className="text-[10px]" style={{ color: c.textMuted }}>Pendiente</span>
                          )}
                          {bruto > 0 && (
                            <span className="text-xs font-black font-mono tabular-nums" style={{ color: c.text }}>{bruto.toFixed(2)} kg</span>
                          )}
                        </div>
                      </div>

                      {/* Pesadas detail */}
                      {sEst && sEst.pesadas.length > 0 && (
                        <div className="px-3 py-2">
                          <div className="flex flex-wrap gap-1">
                            {sEst.pesadas.map(p => (
                              <span key={p.numero} className="text-[10px] font-mono px-2 py-0.5 rounded-full"
                                style={{ background: 'rgba(34,197,94,0.06)', color: '#4ade80', border: '1px solid rgba(34,197,94,0.1)' }}>
                                P-{p.numero}: {p.peso.toFixed(2)}{p.jabas ? ` (${p.jabas}j)` : ''}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Totals */}
                {activeSlot.pedidos.some(p => activeSlot.subEstados[p.id]?.pesadas.length > 0) && (
                  <div className="rounded-xl p-3 text-center" style={{ background: 'rgba(34,197,94,0.04)', border: '1px solid rgba(34,197,94,0.15)' }}>
                    <div className="text-[9px] font-bold uppercase" style={{ color: c.textMuted }}>Peso bruto total del bloque</div>
                    <div className="text-2xl font-black font-mono tabular-nums" style={{ color: '#22c55e' }}>
                      {activeSlot.pedidos.reduce((s, p) => s + (activeSlot.subEstados[p.id]?.pesadas.reduce((s2, pp) => s2 + pp.peso, 0) || 0), 0).toFixed(2)} kg
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : bottomMode === 'clientes' && selectedClienteBottom ? (
            /* Clientes mode: show selected client's blocks */
            <div className="p-4 space-y-3">
              <div className="flex items-center gap-2 mb-1">
                <User className="w-4 h-4 text-green-400" />
                <span className="text-sm font-bold" style={{ color: c.text }}>{selectedClienteBottom}</span>
              </div>

              {(() => {
                const clienteData = clientesEnPesaje.find(cl => cl.cliente === selectedClienteBottom);
                if (!clienteData) return (
                  <div className="text-center py-8">
                    <span className="text-xs" style={{ color: c.textMuted }}>No hay pedidos disponibles para este cliente</span>
                  </div>
                );
                return clienteData.grupos.map((grupo, gIdx) => (
                  <div key={grupo.grupoId} className="rounded-xl p-3 space-y-2" style={{ background: c.bgCard, border: '1px solid ' + c.borderSubtle }}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Layers className="w-4 h-4 text-blue-400/60" />
                        <span className="text-xs font-bold uppercase tracking-wider" style={{ color: c.textSecondary }}>Bloque {gIdx + 1}</span>
                        <span className="text-[10px]" style={{ color: c.textMuted }}>· {grupo.pedidos.length} pedido{grupo.pedidos.length > 1 ? 's' : ''}</span>
                      </div>
                      <button
                        onClick={() => loadGrupoIntoSlot(grupo)}
                        disabled={slots.every(s => s !== null)}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-black text-white transition-all hover:scale-[1.03] disabled:opacity-40 touch-manipulation"
                        style={{ background: 'linear-gradient(135deg, #0d4a24, #22c55e)', boxShadow: '0 4px 12px rgba(34,197,94,0.3)' }}>
                        <Scale className="w-3.5 h-3.5" /> CARGAR
                      </button>
                    </div>

                    <div className="space-y-1">
                      {grupo.pedidos.map((pedido, pIdx) => (
                        <div key={pedido.id} className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg" style={{ background: c.g02, border: '1px solid ' + c.g03 }}>
                          <span className="w-5 h-5 rounded flex items-center justify-center text-[9px] font-black flex-shrink-0" style={{ background: 'rgba(59,130,246,0.1)', color: '#3b82f6' }}>
                            {pIdx + 1}
                          </span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-xs font-semibold" style={{ color: c.text }}>{getAbreviacion(pedido)}</span>
                              <span className="text-[10px] font-mono" style={{ color: c.textMuted }}>{pedido.numeroPedido || 'S/N'}</span>
                            </div>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: 'rgba(59,130,246,0.08)', color: '#3b82f6' }}>{pedido.presentacion}</span>
                              <span className="text-[10px]" style={{ color: c.textMuted }}>{pedido.cantidad} unids.</span>
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
                ));
              })()}
            </div>
          ) : (
            /* Empty placeholder */
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <FileText className="w-10 h-10 mx-auto mb-2" style={{ color: c.g08 }} />
                <p className="text-sm font-medium" style={{ color: c.textMuted }}>
                  {slotsOcupados > 0 ? 'Toque un slot para ver el registro' : 'Seleccione un cliente para ver sus pedidos'}
                </p>
                <p className="text-xs mt-1" style={{ color: c.textMuted }}>
                  {slotsOcupados > 0 ? 'O seleccione un cliente a la izquierda' : 'Luego cargue un bloque en un slot de pesaje'}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ═══════ TICKET MODAL ═══════ */}
      {ticketVisible && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: c.bgModalOverlay }}>
          <div className="rounded-3xl border p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto"
            style={{ background: c.bgModal, borderColor: c.border, boxShadow: c.shadowLg }}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-bold flex items-center gap-2" style={{ color: c.text }}>
                <FileText className="w-5 h-5 text-green-400" /> Tickets de Despacho
              </h2>
              <button onClick={() => setTicketVisible(null)} className="p-2 rounded-xl hover:bg-white/10 touch-manipulation">
                <X className="w-5 h-5" style={{ color: c.textSecondary }} />
              </button>
            </div>

            <div ref={ticketRef} className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {(['CLIENTE', 'NEGOCIO'] as const).map((tipo) => (
                <div key={tipo} className="ticket rounded-2xl p-5 relative overflow-hidden"
                  style={{ background: c.bgModal, border: '2px solid ' + c.border }}>
                  <div className="absolute top-0 left-0 right-0 h-1"
                    style={{ background: tipo === 'CLIENTE' ? 'linear-gradient(to right, #22c55e, #3b82f6)' : 'linear-gradient(to right, #ccaa00, #f97316)' }} />

                  <div className="text-center mb-3 pb-2" style={{ borderBottom: '1px dashed #333' }}>
                    <h3 className="text-lg font-extrabold tracking-widest">
                      <span style={{ color: '#22c55e' }}>AVÍCOLA </span><span style={{ color: '#ccaa00' }}>JOSSY</span>
                    </h3>
                    <p className="text-[9px] tracking-[0.2em] mt-0.5 uppercase" style={{ color: c.textMuted }}>Ticket de Despacho</p>
                  </div>

                  <div className="text-center py-1.5 px-3 rounded-lg mb-3 font-mono text-xs"
                    style={{ background: 'rgba(204,170,0,0.08)', border: '1px solid ' + c.borderGold, color: c.text }}>
                    {ticketVisible.numeroTicket}
                  </div>

                  <div className="text-center mb-3 pb-2" style={{ borderBottom: '1px dashed #222' }}>
                    <div className="text-[9px] text-gray-600 uppercase tracking-[0.15em] mb-1">Cliente</div>
                    <div className="text-sm font-bold" style={{ color: c.text }}>{ticketVisible.cliente}</div>
                  </div>

                  {ticketVisible.pedidos.map((resultado, idx) => (
                    <div key={resultado.pedidoId} className="mb-3 pb-3" style={{ borderBottom: '1px dashed #222' }}>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="w-5 h-5 rounded flex items-center justify-center text-[9px] font-black" style={{ background: 'rgba(59,130,246,0.1)', color: '#3b82f6' }}>{idx + 1}</span>
                        <span className="text-[9px] uppercase tracking-[0.15em] font-bold" style={{ color: c.textMuted }}>
                          {idx === 0 ? 'Pedido Principal' : `Sub-Pedido ${idx}`}
                        </span>
                      </div>

                      <div className="mb-2 pb-1.5" style={{ borderBottom: '1px dotted rgba(255,255,255,0.06)' }}>
                        <p className="text-[8px] text-gray-600 uppercase tracking-[0.15em] mb-1">Detalle del Pedido</p>
                        {[
                          ['Producto', resultado.pedido.tipoAve],
                          ['Presentación', resultado.pedido.presentacion],
                          ['Cantidad', `${resultado.pedido.cantidad} unids.`],
                        ].map(([label, value]) => (
                          <div key={label} className="flex justify-between text-[11px]">
                            <span style={{ color: c.textMuted }}>{label}</span>
                            <span className="font-bold" style={{ color: c.text }}>{value}</span>
                          </div>
                        ))}
                      </div>

                      <div>
                        <p className="text-[8px] text-gray-600 uppercase tracking-[0.15em] mb-1">Detalle del Pesaje</p>
                        <table className="w-full text-[10px]">
                          <thead>
                            <tr>
                              <th className="text-left pb-1 font-semibold" style={{ color: c.textMuted }}>Pesada</th>
                              <th className="text-right pb-1 font-semibold" style={{ color: c.textMuted }}>Peso (kg)</th>
                            </tr>
                          </thead>
                          <tbody>
                            {resultado.pesadas.map(p => (
                              <tr key={p.numero} style={{ borderTop: '1px solid rgba(255,255,255,0.03)' }}>
                                <td className="py-0.5" style={{ color: c.textSecondary }}>Pesada {p.numero}{p.jabas ? ` (${p.jabas}j)` : ''}</td>
                                <td className="py-0.5 text-right font-mono font-bold" style={{ color: c.text }}>{p.peso.toFixed(2)}</td>
                              </tr>
                            ))}
                            <tr style={{ borderTop: '2px solid rgba(255,255,255,0.1)' }}>
                              <td className="py-0.5 font-bold text-[10px]" style={{ color: c.textSecondary }}>BRUTO</td>
                              <td className="py-0.5 text-right font-mono font-black" style={{ color: c.text }}>{resultado.pesoBrutoTotal.toFixed(2)}</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ))}

                  {ticketVisible.pedidos.length > 1 && (
                    <div className="mb-3 pb-2 rounded-lg p-2" style={{ background: 'rgba(34,197,94,0.04)', border: '1px solid rgba(34,197,94,0.1)' }}>
                      <p className="text-[8px] text-green-500 uppercase tracking-[0.15em] mb-1 font-bold">Totales Generales</p>
                      <div className="flex justify-between text-[11px]">
                        <span style={{ color: c.textSecondary }}>Peso Bruto Total</span>
                        <span className="font-black" style={{ color: c.text }}>{ticketVisible.totales.pesoBrutoTotal.toFixed(2)} kg</span>
                      </div>
                    </div>
                  )}

                  <div className="mb-3 pb-2" style={{ borderBottom: '1px dashed #222' }}>
                    <p className="text-[9px] text-gray-600 uppercase tracking-[0.15em] mb-1.5">Datos de Entrega</p>
                    {[
                      ['Conductor', ticketVisible.conductor],
                      ['Vehículo', ticketVisible.conductorVehiculo],
                      ['Zona', ticketVisible.zona],
                    ].map(([label, value]) => (
                      <div key={label} className="flex justify-between text-[11px]">
                        <span style={{ color: c.textMuted }}>{label}</span>
                        <span className="font-bold" style={{ color: c.text }}>{value}</span>
                      </div>
                    ))}
                  </div>

                  <div className="text-center pt-1">
                    <p className="text-[10px]" style={{ color: c.textMuted }}>{ticketVisible.fechaEmision} — {ticketVisible.horaEmision}</p>
                    <p className="text-[8px] text-gray-700 mt-1 tracking-[0.2em] uppercase">Avícola Jossy — Sistema de Gestión</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-3 mt-5">
              <button onClick={handlePrint}
                className="flex-1 py-3.5 rounded-2xl font-bold text-white transition-all hover:scale-[1.02] flex items-center justify-center gap-2 touch-manipulation"
                style={{ background: 'linear-gradient(135deg, #0d4a24, #22c55e)', boxShadow: '0 6px 18px rgba(34,197,94,0.3)' }}>
                <Printer className="w-5 h-5" /> Imprimir Tickets
              </button>
              <button onClick={() => setTicketVisible(null)}
                className="px-6 py-3.5 rounded-2xl font-bold flex items-center justify-center touch-manipulation"
                style={{ background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)', border: isDark ? '1px solid rgba(255,255,255,0.1)' : `1px solid ${c.border}`, color: c.textSecondary }}>
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
