import { useState, useEffect, useMemo } from 'react';
import {
  Wallet, MapPin, Search, User, ChevronLeft,
  Calendar, DollarSign, ArrowLeft, CreditCard,
  ChevronDown, ChevronUp, Lock, Package, Clock, CheckCircle, X,
  Eye, MessageSquare
} from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { useTheme, t } from '../contexts/ThemeContext';
import { motion, AnimatePresence } from 'framer-motion';
import { ModalPago } from './ModalPago';

// ─── TYPES ────────────────────────────────────────────────────────────────────
interface FilaCartera {
  id: string; pedidoId: string; cliente: string; tipo: string;
  presentacion: string; cantidad: number; cantidadLabel: string;
  merma: number; tara: number; contenedorTipo: string;
  devolucionPeso: number; devolucionCantidad: number;
  devolucionFoto?: string; devolucionMotivo?: string;
  repesada: number;
  pesoPedido: number; pesoContenedor: number; pesoBruto: number;
  pesoNeto: number; precio: number; total: number;
  confirmado: boolean; editando: boolean; fecha: string;
  zona: string; conductor: string;
  cantidadContenedores: number; contenedorPesoUnit: number;
  contenedorRecalculado?: boolean;
  recalcLines?: any[];
}

interface PagosDia {
  [fecha: string]: boolean; // true = pagado
}

// ─── DESIGN TOKENS ────────────────────────────────────────────────────────────
const GOLD   = '#ccaa00';

const COL = {
  tipo:       '#a78bfa',
  devolucion: '#f87171',
  neto:       '#22d3ee',
  total:      '#fbbf24',
};

// ─── HELPERS ──────────────────────────────────────────────────────────────────
const hoyStr = () => new Date().toISOString().split('T')[0];

/** Buscar todas las keys carteraCobro_* en localStorage */
const getAllCarteraKeys = (): string[] => {
  const keys: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k && k.startsWith('carteraCobro_')) keys.push(k);
  }
  return keys.sort(); // sort chronologically
};

/** Parsear filas liquidadas de un día para un cliente */
const getFilasLiquidadasPorCliente = (clienteNombre: string): Map<string, FilaCartera[]> => {
  const keys = getAllCarteraKeys();
  const porDia = new Map<string, FilaCartera[]>();

  for (const key of keys) {
    try {
      const data = localStorage.getItem(key);
      if (!data) continue;
      const filas: FilaCartera[] = JSON.parse(data);
      const liquidadas = filas.filter(f => f.confirmado && f.cliente === clienteNombre);
      if (liquidadas.length > 0) {
        const fecha = key.replace('carteraCobro_', '');
        porDia.set(fecha, liquidadas);
      }
    } catch (_) { /* ignore parse errors */ }
  }

  return porDia;
};

/** Obtener todos los clientes que tienen pedidos liquidados */
const getClientesConPedidosLiquidados = (): Set<string> => {
  const nombres = new Set<string>();
  const keys = getAllCarteraKeys();
  for (const key of keys) {
    try {
      const data = localStorage.getItem(key);
      if (!data) continue;
      const filas: FilaCartera[] = JSON.parse(data);
      filas.filter(f => f.confirmado).forEach(f => nombres.add(f.cliente));
    } catch (_) {}
  }
  return nombres;
};

const formatFecha = (fecha: string) => {
  try {
    const d = new Date(fecha + 'T00:00:00');
    return d.toLocaleDateString('es-PE', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
  } catch { return fecha; }
};

// ─── COMPONENT ────────────────────────────────────────────────────────────────
export function GestionCobranza() {
  const { clientes, pedidosConfirmados, pagos } = useApp();
  const { isDark } = useTheme();
  const c = t(isDark);

  // ─── DESIGN TOKENS (theme-aware) ─────────────────────────────────
  const G04 = c.g04;
  const G06 = c.g06;
  const G08 = c.g08;
  const G10 = c.g10;
  const G15 = c.g15;
  const G20 = c.g20;
  const G30 = c.g30;

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCliente, setSelectedCliente] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');
  const [filtroPago, setFiltroPago] = useState<'todos' | 'pagado' | 'parcial' | 'no'>('todos');

  // ─── MODAL PAGO STATE ───────────────────────────────────────────
  const [modalPagoOpen, setModalPagoOpen] = useState(false);
  const [modalPagoMonto, setModalPagoMonto] = useState(0);
  const [modalPagoFechas, setModalPagoFechas] = useState<string[]>([]);

  /** Get payment info for a specific client-day: handles partial payments & saldo.
   * ALL non-rejected payments count as "money received" for the cobrador:
   *  - Efectivo Pendiente = cash in hand
   *  - Digital Pendiente = already sent, awaiting Secretaría
   *  - Confirmado = validated */
  const getDiaPagoInfo = (clienteNombre: string, fecha: string, totalDia: number) => {
    const pagosCliente = pagos.filter(p =>
      p.clienteNombre === clienteNombre &&
      p.fechasCubiertas?.includes(fecha) &&
      p.estado !== 'Rechazado'
    );
    const montoPagado = pagosCliente.reduce((s, p) => s + p.monto, 0);
    const restante = Math.max(0, totalDia - montoPagado);
    const hayPendienteDigital = pagosCliente.some(p => p.estado === 'Pendiente' && p.metodo !== 'Efectivo');

    let estadoPago: 'pagado' | 'parcial' | 'pendiente' | 'no';
    if (pagosCliente.length === 0) {
      estadoPago = 'no';
    } else if (restante <= 0.01) {
      // Fully covered
      estadoPago = hayPendienteDigital ? 'pendiente' : 'pagado';
    } else {
      estadoPago = montoPagado > 0.01 ? 'parcial' : 'no';
    }

    return { montoPagado, restante, estadoPago };
  };

  const abrirPagoDia = (fecha: string, monto: number) => {
    setModalPagoMonto(monto);
    setModalPagoFechas([fecha]);
    setModalPagoOpen(true);
  };

  const abrirPagoTodo = (fechas: string[], monto: number) => {
    setModalPagoMonto(monto);
    setModalPagoFechas(fechas);
    setModalPagoOpen(true);
  };

  // Get unique clients who made orders (from pedidosConfirmados) + also from cartera
  const clientesConPedidos = useMemo(() => {
    const nombresSet = new Set<string>();

    // Clientes con pedidosConfirmados
    (pedidosConfirmados || []).forEach(p => {
      if (p.cliente) nombresSet.add(p.cliente);
    });

    // Also add clients who have liquidated entries in cartera
    const liquidados = getClientesConPedidosLiquidados();
    liquidados.forEach(n => nombresSet.add(n));

    // Map to client objects, filter active + search
    return clientes
      .filter(c => nombresSet.has(c.nombre))
      .filter(c =>
        !searchTerm ||
        c.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.zona.toLowerCase().includes(searchTerm.toLowerCase())
      )
      .sort((a, b) => a.nombre.localeCompare(b.nombre));
  }, [clientes, pedidosConfirmados, searchTerm, refreshKey]);

  // Data for selected client
  const clienteData = useMemo(() => {
    if (!selectedCliente) return null;

    const porDia = getFilasLiquidadasPorCliente(selectedCliente);

    // Sort dates ascending for saldo calculation
    let fechasAsc = Array.from(porDia.keys()).sort();

    // Apply date range filter
    if (fechaDesde) fechasAsc = fechasAsc.filter(f => f >= fechaDesde);
    if (fechaHasta) fechasAsc = fechasAsc.filter(f => f <= fechaHasta);

    // Calculate per-day totals and accumulated saldo
    let saldoAcumulado = 0;

    const diasData = fechasAsc.map(fecha => {
      const filas = porDia.get(fecha) || [];
      const totalDia = filas.reduce((s, f) => s + f.total, 0);
      const { montoPagado, restante, estadoPago } = getDiaPagoInfo(selectedCliente!, fecha, totalDia);

      const saldoAnterior = saldoAcumulado;
      saldoAcumulado += restante;

      return { fecha, filas, totalDia, estadoPago, saldoAnterior, montoPagado, restante };
    });

    // Reverse to show most recent first
    const diasDataDesc = [...diasData].reverse();

    // Grand total = sum of all remaining (unpaid/partially paid)
    const totalPendiente = diasData.reduce((s, d) => s + d.restante, 0);

    return { fechas: diasDataDesc, totalPendiente, saldoAcumulado };
  }, [selectedCliente, refreshKey, pagos, fechaDesde, fechaHasta]);

  const clienteObj = clientes.find(c => c.nombre === selectedCliente);

  // ─── CLIENT LIST VIEW ────────────────────────────────────────────────────
  if (!selectedCliente) {
    return (
      <div className="space-y-5 pb-20">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.30)' }}>
              <Wallet className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold" style={{ color: c.text }}>Gestión de Cobranza</h2>
              <p className="text-xs" style={{ color: c.textMuted }}>{clientesConPedidos.length} clientes con pedidos</p>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: c.textMuted }} />
          <input
            type="text"
            placeholder="Buscar cliente por nombre o zona..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-xl text-sm outline-none transition-all"
            style={{ background: G06, border: `1px solid ${G15}`, color: c.text }}
            onFocus={e => (e.target.style.borderColor = 'rgba(16,185,129,0.5)')}
            onBlur={e => (e.target.style.borderColor = G15)}
          />
        </div>

        {/* Client Cards */}
        <div className="grid gap-3">
          <AnimatePresence>
            {clientesConPedidos.map((cliente, idx) => {
              // Quick check for pending amounts
              const porDia = getFilasLiquidadasPorCliente(cliente.nombre);
              let totalPendiente = 0;
              let diasPendientes = 0;
              porDia.forEach((filas, fecha) => {
                const totalDia = filas.reduce((s, f) => s + f.total, 0);
                const { restante } = getDiaPagoInfo(cliente.nombre, fecha, totalDia);
                if (restante > 0.01) {
                  totalPendiente += restante;
                  diasPendientes++;
                }
              });

              return (
                <motion.div
                  key={cliente.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ delay: idx * 0.03 }}
                  onClick={() => setSelectedCliente(cliente.nombre)}
                  className="group cursor-pointer rounded-2xl p-4 transition-all hover:scale-[1.01]"
                  style={{
                    background: G04,
                    border: `1px solid ${G10}`,
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.borderColor = 'rgba(16,185,129,0.40)';
                    e.currentTarget.style.background = G08;
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.borderColor = G10;
                    e.currentTarget.style.background = G04;
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                        style={{ background: G08, border: `1px solid ${G15}` }}>
                        <User className="w-5 h-5 text-gray-400 group-hover:text-emerald-400 transition-colors" />
                      </div>
                      <div>
                        <h3 className="font-bold text-sm" style={{ color: c.text }}>{cliente.nombre}</h3>
                        <div className="flex items-center gap-3 text-[11px] mt-0.5" style={{ color: c.textMuted }}>
                          <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {cliente.zona || '—'}</span>
                          {diasPendientes > 0 && (
                            <span className="flex items-center gap-1 text-amber-500">
                              <Calendar className="w-3 h-3" /> {diasPendientes} día{diasPendientes > 1 ? 's' : ''} pendiente{diasPendientes > 1 ? 's' : ''}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      {totalPendiente > 0 ? (
                        <>
                          <p className="text-[9px] uppercase tracking-wider font-bold" style={{ color: c.textMuted }}>Pendiente</p>
                          <p className="text-lg font-black text-red-400">S/ {totalPendiente.toFixed(2)}</p>
                        </>
                      ) : (
                        <>
                          <p className="text-[9px] uppercase tracking-wider font-bold" style={{ color: c.textMuted }}>Estado</p>
                          <p className="text-sm font-bold text-emerald-400">Al día</p>
                        </>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {clientesConPedidos.length === 0 && (
            <div className="text-center py-16">
              <Package className="w-12 h-12 mx-auto mb-3" style={{ color: c.textMuted }} />
              <p className="text-sm" style={{ color: c.textMuted }}>No hay clientes con pedidos</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ─── CLIENT DETAIL VIEW — Pedidos Liquidados por Día ──────────────────────
  return (
    <div className="space-y-5 pb-20">
      {/* Back header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => setSelectedCliente(null)}
            className="p-2 rounded-xl transition-all hover:scale-105"
            style={{ background: G08, border: `1px solid ${G15}` }}>
            <ArrowLeft className="w-4 h-4" style={{ color: c.textSecondary }} />
          </button>
          <div>
            <h2 className="text-lg font-bold" style={{ color: c.text }}>{selectedCliente}</h2>
            <div className="flex items-center gap-3 text-[11px]" style={{ color: c.textMuted }}>
              {clienteObj && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {clienteObj.zona || '—'}</span>}
              {clienteObj?.telefono && <span>{clienteObj.telefono}</span>}
            </div>
          </div>
        </div>
      </div>

      {/* Date range filter */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <Calendar className="w-3.5 h-3.5" style={{ color: c.textMuted }} />
          <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: c.textMuted }}>Desde</span>
          <input
            type="date"
            value={fechaDesde}
            onChange={e => setFechaDesde(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg text-xs outline-none"
            style={{ background: G08, border: `1px solid ${G15}`, color: c.text }}
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: c.textMuted }}>Hasta</span>
          <input
            type="date"
            value={fechaHasta}
            onChange={e => setFechaHasta(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg text-xs outline-none"
            style={{ background: G08, border: `1px solid ${G15}`, color: c.text }}
          />
        </div>
        {(fechaDesde || fechaHasta) && (
          <button
            onClick={() => { setFechaDesde(''); setFechaHasta(''); }}
            className="px-2.5 py-1.5 rounded-lg text-[10px] font-bold transition-colors"
            style={{ background: G08, border: `1px solid ${G15}`, color: c.textSecondary }}
          >
            <X className="w-3 h-3 inline mr-1" />Limpiar
          </button>
        )}
      </div>

      {/* Payment status filter */}
      <div className="flex gap-1.5 flex-wrap">
        {([
          { key: 'todos', label: 'Todos', color: '#9ca3af' },
          { key: 'no', label: 'Sin Pagar', color: '#ef4444' },
          { key: 'parcial', label: 'Parcial', color: '#f97316' },
          { key: 'pagado', label: 'Pagado', color: '#10b981' },
        ] as const).map(f => (
          <button
            key={f.key}
            onClick={() => setFiltroPago(f.key)}
            className="px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all"
            style={{
              background: filtroPago === f.key ? f.color + '20' : G06,
              border: `1px solid ${filtroPago === f.key ? f.color + '50' : G15}`,
              color: filtroPago === f.key ? f.color : c.textMuted,
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* No data */}
      {!clienteData || clienteData.fechas.length === 0 ? (
        <div className="text-center py-20">
          <Lock className="w-12 h-12 mx-auto mb-3" style={{ color: c.textMuted }} />
          <p className="text-sm" style={{ color: c.textMuted }}>No hay pedidos liquidados para este cliente</p>
          <p className="text-[10px] mt-1" style={{ color: c.textMuted }}>Los pedidos aparecerán aquí cuando sean liquidados en Cartera de Cobro</p>
        </div>
      ) : (
        <>
          {/* Day-by-day tables */}
          {clienteData.fechas
            .filter(d => filtroPago === 'todos' || d.estadoPago === filtroPago ||
              (filtroPago === 'pagado' && d.estadoPago === 'pendiente'))
            .map(({ fecha, filas, totalDia, estadoPago, saldoAnterior, montoPagado, restante }) => (
            <DiaTable
              key={fecha}
              fecha={fecha}
              filas={filas}
              totalDia={totalDia}
              saldoAnterior={saldoAnterior}
              estadoPago={estadoPago}
              montoPagado={montoPagado}
              restante={restante}
              onPagar={() => abrirPagoDia(fecha, restante)}
            />
          ))}

          {/* ─── RESUMEN FINAL ─────────────────────────────────────────────── */}
          <div className="rounded-2xl overflow-hidden"
            style={{ background: G04, border: `1px solid ${G20}` }}>
            <div className="p-5 space-y-3">

              {/* TOTAL A PAGAR */}
              <div className="flex items-center justify-between">
                <span className="text-sm font-black uppercase tracking-wider" style={{ color: GOLD }}>Total a Pagar</span>
                <span className="text-2xl font-black tabular-nums" style={{ color: GOLD }}>
                  S/ {clienteData.totalPendiente.toFixed(2)}
                </span>
              </div>

              {/* Pagar Todo button */}
              {clienteData.totalPendiente > 0 && (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    const fechasConRestante = clienteData.fechas.filter(d => d.restante > 0.01).map(d => d.fecha);
                    abrirPagoTodo(fechasConRestante, clienteData.totalPendiente);
                  }}
                  className="w-full py-3.5 mt-2 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all text-black"
                  style={{
                    background: `linear-gradient(135deg, #10b981, #059669)`,
                    boxShadow: '0 4px 20px rgba(16,185,129,0.30)',
                  }}
                >
                  <CreditCard className="w-4 h-4" />
                  PAGAR TODO — S/ {clienteData.totalPendiente.toFixed(2)}
                </motion.button>
              )}

              {clienteData.totalPendiente === 0 && (
                <div className="text-center py-2">
                  <span className="text-emerald-400 text-sm font-bold">✓ Todo pagado — Sin saldo pendiente</span>
                </div>
              )}
            </div>
          </div>

          {/* ─── MODAL PAGO ──────────────────────────────────────────── */}
          {selectedCliente && (
            <ModalPago
              isOpen={modalPagoOpen}
              onClose={() => { setModalPagoOpen(false); setRefreshKey(k => k + 1); }}
              clienteNombre={selectedCliente}
              clienteId={clienteObj?.id || ''}
              monto={modalPagoMonto}
              fechasCubiertas={modalPagoFechas}
              onPagoRegistrado={() => setRefreshKey(k => k + 1)}
            />
          )}
        </>
      )}
    </div>
  );
}

// ─── Column config for alignment ──────────────────────────────────────────────
const TH_COLS: { label: string; align: 'left' | 'right'; width?: string }[] = [
  { label: 'TIPO',       align: 'left',  width: '22%' },
  { label: 'PRES.',      align: 'left',  width: '14%' },
  { label: 'CANT.',      align: 'right', width: '10%' },
  { label: 'DEVOL. kg',  align: 'right', width: '12%' },
  { label: 'P.NETO kg',  align: 'right', width: '14%' },
  { label: 'PRECIO S/',  align: 'right', width: '12%' },
  { label: 'TOTAL S/',   align: 'right', width: '16%' },
];

// ─── DiaTable — Table for a single day ────────────────────────────────────────
function DiaTable({ fecha, filas, totalDia, saldoAnterior, estadoPago, montoPagado, restante, onPagar }: {
  fecha: string;
  filas: FilaCartera[];
  totalDia: number;
  saldoAnterior: number;
  estadoPago: 'pagado' | 'parcial' | 'pendiente' | 'no';
  montoPagado: number;
  restante: number;
  onPagar: () => void;
}) {
  const { isDark } = useTheme();
  const c = t(isDark);
  const G04 = c.g04;
  const G06 = c.g06;
  const G08 = c.g08;
  const G10 = c.g10;
  const G15 = c.g15;
  const G20 = c.g20;
  const G30 = c.g30;

  const [collapsed, setCollapsed] = useState(true);
  const [devFotoModal, setDevFotoModal] = useState<{ foto: string; motivo: string; peso: number } | null>(null);
  const totalConSaldo = restante + saldoAnterior;

  const esPagado = estadoPago === 'pagado';
  const esPendiente = estadoPago === 'pendiente';
  const esParcial = estadoPago === 'parcial';
  const borderColor = esPagado
    ? 'rgba(16,185,129,0.25)'
    : esPendiente
      ? 'rgba(245,158,11,0.25)'
      : esParcial
        ? 'rgba(249,115,22,0.25)'
        : G15;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl overflow-hidden"
      style={{
        background: G04,
        border: `1px solid ${borderColor}`,
        opacity: esPagado ? 0.7 : 1,
      }}
    >
      {/* Day header */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="w-full flex items-center justify-between px-4 py-3 transition-all hover:bg-white/[0.02]"
        style={{ borderBottom: collapsed ? 'none' : `1px solid ${G10}` }}
      >
        <div className="flex items-center gap-2.5">
          <Calendar className="w-4 h-4" style={{ color: c.textMuted }} />
          <span className="text-sm font-bold" style={{ color: c.text }}>{formatFecha(fecha)}</span>
          <span className="text-[10px] font-mono" style={{ color: c.textMuted }}>{filas.length} pedido{filas.length > 1 ? 's' : ''}</span>
          {esPagado && (
            <span className="text-[9px] font-bold text-emerald-400 uppercase tracking-wider px-2 py-0.5 rounded-full"
              style={{ background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.25)' }}>
              <CheckCircle className="w-3 h-3 inline mr-1" />Pagado
            </span>
          )}
          {esPendiente && (
            <span className="text-[9px] font-bold text-amber-400 uppercase tracking-wider px-2 py-0.5 rounded-full flex items-center gap-1"
              style={{ background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.25)' }}>
              <Clock className="w-3 h-3" /> En espera
            </span>
          )}
          {esParcial && (
            <span className="text-[9px] font-bold text-orange-400 uppercase tracking-wider px-2 py-0.5 rounded-full flex items-center gap-1"
              style={{ background: 'rgba(249,115,22,0.12)', border: '1px solid rgba(249,115,22,0.25)' }}>
              <DollarSign className="w-3 h-3" /> Parcial
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm font-black tabular-nums" style={{ color: esPagado ? '#10b981' : esPendiente ? '#f59e0b' : esParcial ? '#f97316' : COL.total }}>
            S/ {restante.toFixed(2)}
          </span>
          {collapsed ? <ChevronDown className="w-3.5 h-3.5" style={{ color: c.textMuted }} /> : <ChevronUp className="w-3.5 h-3.5" style={{ color: c.textMuted }} />}
        </div>
      </button>

      {/* Table */}
      <AnimatePresence>
        {!collapsed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="overflow-x-auto">
              <table className="w-full" style={{ borderCollapse: 'collapse', tableLayout: 'fixed' }}>
                <thead>
                  <tr style={{ background: G06 }}>
                    {TH_COLS.map(col => (
                      <th key={col.label}
                        className={`px-3 py-2.5 ${col.align === 'right' ? 'text-right' : 'text-left'}`}
                        style={{ width: col.width }}>
                        <span className="text-[9px] font-bold uppercase tracking-widest" style={{ color: GOLD }}>{col.label}</span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filas.map((fila, idx) => (
                    <tr key={fila.id}
                      style={{
                        borderBottom: `1px solid ${G06}`,
                        background: idx % 2 !== 0 ? G04 : 'transparent',
                      }}>
                      <td className="px-3 py-2.5">
                        <span className="text-xs font-semibold truncate block" style={{ color: COL.tipo }}>{fila.tipo}</span>
                      </td>
                      <td className="px-3 py-2.5">
                        <span className="text-xs truncate block" style={{ color: c.textSecondary }}>{fila.presentacion}</span>
                      </td>
                      <td className="px-3 py-2.5 text-right">
                        <span className="font-bold text-xs tabular-nums" style={{ color: c.text }}>{fila.cantidad}</span>
                        <span className="text-[9px] ml-0.5" style={{ color: c.textMuted }}>{fila.cantidadLabel}</span>
                      </td>
                      <td className="px-3 py-2.5 text-right">
                        {fila.devolucionPeso > 0 && fila.devolucionFoto ? (
                          <button
                            onClick={() => setDevFotoModal({ foto: fila.devolucionFoto!, motivo: fila.devolucionMotivo || '', peso: fila.devolucionPeso })}
                            className="inline-flex items-center gap-1 text-xs tabular-nums font-mono transition-colors hover:opacity-80 cursor-pointer"
                            style={{ color: COL.devolucion }}
                            title="Ver foto de devolución"
                          >
                            <Eye className="w-3 h-3" />
                            {fila.devolucionPeso.toFixed(2)}
                          </button>
                        ) : (
                          <span className="text-xs tabular-nums font-mono" style={{ color: fila.devolucionPeso > 0 ? COL.devolucion : c.textMuted }}>
                            {fila.devolucionPeso.toFixed(2)}
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-2.5 text-right">
                        <span className="font-bold text-xs tabular-nums font-mono px-1.5 py-0.5 rounded-md inline-block"
                          style={{ background: 'rgba(6,182,212,0.10)', border: '1px solid rgba(6,182,212,0.25)', color: COL.neto }}>
                          {fila.pesoNeto.toFixed(2)}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-right">
                        <span className="text-xs tabular-nums font-mono" style={{ color: c.textSecondary }}>{fila.precio.toFixed(2)}</span>
                      </td>
                      <td className="px-3 py-2.5 text-right">
                        <span className="font-black text-xs tabular-nums font-mono" style={{ color: COL.total }}>
                          S/ {fila.total.toFixed(2)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  {/* Total del día */}
                  <tr style={{ borderTop: `2px solid ${G20}`, background: G08 }}>
                    <td colSpan={6} className="px-3 py-2.5 text-right">
                      <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: GOLD }}>Total del día</span>
                    </td>
                    <td className="px-3 py-2.5 text-right">
                      <span className="text-sm font-black tabular-nums" style={{ color: COL.total }}>
                        S/ {totalDia.toFixed(2)}
                      </span>
                    </td>
                  </tr>
                  {/* Saldo anterior */}
                  <tr style={{ background: G06 }}>
                    <td colSpan={6} className="px-3 py-2 text-right">
                      <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: c.textMuted }}>Saldo anterior</span>
                    </td>
                    <td className="px-3 py-2 text-right">
                      <span className="text-xs font-bold tabular-nums" style={{ color: saldoAnterior > 0 ? '#f87171' : c.textMuted }}>
                        S/ {saldoAnterior.toFixed(2)}
                      </span>
                    </td>
                  </tr>
                  {/* Pagado (if partial or full) */}
                  {montoPagado > 0.01 && (
                    <tr style={{ background: G06 }}>
                      <td colSpan={6} className="px-3 py-2 text-right">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-500">Pagado</span>
                      </td>
                      <td className="px-3 py-2 text-right">
                        <span className="text-xs font-bold tabular-nums text-emerald-400">
                          - S/ {montoPagado.toFixed(2)}
                        </span>
                      </td>
                    </tr>
                  )}
                  {/* Total a pagar este día (restante + saldo) */}
                  <tr style={{ background: G08, borderTop: `1px solid ${G15}` }}>
                    <td colSpan={6} className="px-3 py-2.5 text-right">
                      <span className="text-[10px] font-black uppercase tracking-wider" style={{ color: GOLD }}>Total a pagar</span>
                    </td>
                    <td className="px-3 py-2.5 text-right">
                      <span className="text-sm font-black tabular-nums" style={{ color: GOLD }}>
                        S/ {totalConSaldo.toFixed(2)}
                      </span>
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Pay this day button / status */}
            {(estadoPago === 'no' || estadoPago === 'parcial') && (
              <div className="px-4 py-3" style={{ borderTop: `1px solid ${G10}` }}>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={onPagar}
                  className="w-full py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all"
                  style={{
                    background: esParcial ? 'rgba(249,115,22,0.10)' : 'rgba(16,185,129,0.10)',
                    border: `1px solid ${esParcial ? 'rgba(249,115,22,0.30)' : 'rgba(16,185,129,0.30)'}`,
                    color: esParcial ? '#f97316' : '#10b981',
                  }}
                >
                  <DollarSign className="w-3.5 h-3.5" />
                  {esParcial
                    ? `Pagar restante — S/ ${restante.toFixed(2)}`
                    : `Pagar este día — S/ ${totalDia.toFixed(2)}`}
                </motion.button>
              </div>
            )}
            {estadoPago === 'pendiente' && (
              <div className="px-4 py-3 flex items-center justify-center gap-2" style={{ borderTop: `1px solid ${G10}` }}>
                <Clock className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                <span className="text-xs font-bold text-amber-400">Pago en espera de validación</span>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal foto devolución */}
      {devFotoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.75)' }}
          onClick={() => setDevFotoModal(null)}>
          <div className="rounded-2xl max-w-sm w-full shadow-2xl animate-in fade-in zoom-in-95 duration-200 overflow-hidden"
            style={{ background: isDark ? '#1a1a2e' : '#fff', border: `1px solid ${G20}` }}
            onClick={e => e.stopPropagation()}>
            <div className="p-4 flex items-center justify-between" style={{ borderBottom: `1px solid ${G10}` }}>
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4" style={{ color: COL.devolucion }} />
                <span className="text-sm font-bold" style={{ color: c.text }}>Devolución — {devFotoModal.peso.toFixed(2)} kg</span>
              </div>
              <button onClick={() => setDevFotoModal(null)} className="p-1 rounded-lg hover:bg-white/10 transition-colors">
                <X className="w-4 h-4" style={{ color: c.textMuted }} />
              </button>
            </div>
            <div className="p-4 space-y-3">
              <img src={devFotoModal.foto} alt="Foto devolución" className="w-full rounded-xl object-contain max-h-72" style={{ border: `1px solid ${G15}` }} />
              {devFotoModal.motivo && (
                <div className="rounded-xl p-3" style={{ background: G06, border: `1px solid ${G15}` }}>
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <MessageSquare className="w-3.5 h-3.5" style={{ color: COL.devolucion }} />
                    <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: COL.devolucion }}>Motivo</span>
                  </div>
                  <p className="text-sm" style={{ color: c.text }}>{devFotoModal.motivo}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}