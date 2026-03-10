import { useState, useMemo } from 'react';
import {
  CheckCircle, XCircle, Clock, Eye, User, Calendar,
  DollarSign, Smartphone, Banknote, CreditCard,
  AlertTriangle, ChevronDown, ChevronUp, Search, Filter,
  MessageSquare
} from 'lucide-react';
import { useApp, Pago } from '../contexts/AppContext';
import { useTheme, t } from '../contexts/ThemeContext';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

// ─── DESIGN TOKENS ────────────────────────────────────────────────
const GOLD = '#ccaa00';

const METODO_CONFIG: Record<string, { color: string; icon: any; label: string; tipo: 'fisico' | 'digital' }> = {
  Efectivo:  { color: '#10b981', icon: Banknote,   label: 'Efectivo',   tipo: 'fisico' },
  Yape:      { color: '#7B2D8E', icon: Smartphone, label: 'YAPE',       tipo: 'digital' },
  Plin:      { color: '#00BCD4', icon: Smartphone, label: 'PLIN',       tipo: 'digital' },
  BCP:       { color: '#FF6600', icon: CreditCard, label: 'BCP',        tipo: 'digital' },
  Interbank: { color: '#009A3E', icon: CreditCard, label: 'INTERBANK',  tipo: 'digital' },
  BBVA:      { color: '#004481', icon: CreditCard, label: 'BBVA',       tipo: 'digital' },
};

const DIGITAL_METHODS = ['Yape', 'Plin', 'BCP', 'Interbank', 'BBVA'] as const;

const formatFecha = (fecha: string) => {
  try {
    const d = new Date(fecha + 'T00:00:00');
    return d.toLocaleDateString('es-PE', { weekday: 'short', day: 'numeric', month: 'short' });
  } catch { return fecha; }
};

const getFechaHoyPeru = () => {
  const now = new Date();
  const peru = new Date(now.toLocaleString('en-US', { timeZone: 'America/Lima' }));
  const y = peru.getFullYear();
  const m = String(peru.getMonth() + 1).padStart(2, '0');
  const d = String(peru.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

// ─── COMPONENT ────────────────────────────────────────────────────
export function ValidacionPagos() {
  const { isDark } = useTheme();
  const c = t(isDark);
  const { pagos, updatePago } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [filtro, setFiltro] = useState<'pendientes' | 'todos' | 'confirmados'>('pendientes');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{ pago: Pago; accion: 'confirmar' | 'rechazar' } | null>(null);
  const [previewFoto, setPreviewFoto] = useState<string | null>(null);
  const [filterFecha, setFilterFecha] = useState(getFechaHoyPeru);

  // ─── TIPO DE PAGO FILTER ─────────────────────────────────────
  const [filtroTipoPago, setFiltroTipoPago] = useState<'todos' | 'fisico' | 'digital'>('todos');
  const [filtroMetodoDigital, setFiltroMetodoDigital] = useState<string>('todos');

  // ─── REJECTION REASON ────────────────────────────────────────
  const [rechazarDialog, setRechazarDialog] = useState<{ pago: Pago } | null>(null);
  const [motivoRechazo, setMotivoRechazo] = useState('');
  const [confirmarRechazo, setConfirmarRechazo] = useState(false);

  const pagosFiltrados = useMemo(() => {
    let lista = [...pagos].sort((a, b) => {
      // Pendientes first, then by date desc
      if (a.estado === 'Pendiente' && b.estado !== 'Pendiente') return -1;
      if (a.estado !== 'Pendiente' && b.estado === 'Pendiente') return 1;
      return (b.fecha + b.hora).localeCompare(a.fecha + a.hora);
    });

    // Date filter — always use current date
    const fechaHoy = getFechaHoyPeru();
    if (filterFecha) lista = lista.filter(p => p.fecha === filterFecha);

    // Payment type filter (fisico / digital)
    if (filtroTipoPago === 'fisico') {
      lista = lista.filter(p => METODO_CONFIG[p.metodo]?.tipo === 'fisico');
    } else if (filtroTipoPago === 'digital') {
      lista = lista.filter(p => METODO_CONFIG[p.metodo]?.tipo === 'digital');
      // Sub-filter by specific digital method
      if (filtroMetodoDigital !== 'todos') {
        lista = lista.filter(p => p.metodo === filtroMetodoDigital);
      }
    }

    if (filtro === 'pendientes') lista = lista.filter(p => p.estado === 'Pendiente');
    else if (filtro === 'confirmados') lista = lista.filter(p => p.estado === 'Confirmado');

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      lista = lista.filter(p =>
        p.clienteNombre.toLowerCase().includes(term) ||
        p.metodo.toLowerCase().includes(term)
      );
    }

    return lista;
  }, [pagos, filtro, searchTerm, filterFecha, filtroTipoPago, filtroMetodoDigital]);

  // Group payments by day (chronological, most recent first)
  const pagosPorDia = useMemo(() => {
    const grouped = new Map<string, Pago[]>();
    pagosFiltrados.forEach(pago => {
      const f = pago.fecha;
      if (!grouped.has(f)) grouped.set(f, []);
      grouped.get(f)!.push(pago);
    });
    return Array.from(grouped.entries())
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([fecha, pagos]) => ({
        fecha,
        pagos: pagos.sort((a, b) => b.hora.localeCompare(a.hora)),
        totalMonto: pagos.reduce((s, p) => s + p.monto, 0),
        pendientesDia: pagos.filter(p => p.estado === 'Pendiente').length,
        confirmadosDia: pagos.filter(p => p.estado === 'Confirmado').length,
      }));
  }, [pagosFiltrados]);

  const pendientes = pagos.filter(p => p.estado === 'Pendiente').length;

  const handleValidar = (pago: Pago, accion: 'confirmar' | 'rechazar') => {
    if (accion === 'rechazar') {
      // Open rejection reason dialog instead
      setRechazarDialog({ pago });
      setMotivoRechazo('');
      setConfirmarRechazo(false);
    } else {
      setConfirmDialog({ pago, accion });
    }
  };

  const ejecutarAccion = () => {
    if (!confirmDialog) return;
    const { pago, accion } = confirmDialog;

    updatePago({
      ...pago,
      estado: 'Confirmado',
    });

    toast.success(`Pago de S/ ${pago.monto.toFixed(2)} confirmado para ${pago.clienteNombre}`);
    setConfirmDialog(null);
    setExpandedId(null);
  };

  const ejecutarRechazo = () => {
    if (!rechazarDialog || !motivoRechazo.trim()) return;
    const { pago } = rechazarDialog;

    updatePago({
      ...pago,
      estado: 'Rechazado',
      motivoRechazo: motivoRechazo.trim(),
    });

    toast.success(`Pago de S/ ${pago.monto.toFixed(2)} rechazado`);
    setRechazarDialog(null);
    setMotivoRechazo('');
    setConfirmarRechazo(false);
    setExpandedId(null);
  };

  return (
    <div className="space-y-5 pb-20">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: 'rgba(204,170,0,0.12)', border: `1px solid rgba(204,170,0,0.30)` }}>
            <DollarSign className="w-5 h-5" style={{ color: GOLD }} />
          </div>
          <div>
            <h2 className="text-lg font-bold" style={{ color: c.text }}>Validación de Pagos</h2>
            <p className="text-xs" style={{ color: c.textMuted }}>
              {pendientes > 0
                ? <span className="text-amber-400 font-bold">{pendientes} pago{pendientes > 1 ? 's' : ''} pendiente{pendientes > 1 ? 's' : ''}</span>
                : <span className="text-emerald-400">Sin pagos pendientes</span>}
            </p>
          </div>
        </div>
      </div>

      {/* Search + Filters */}
      <div className="flex gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: c.textMuted }} />
          <input
            type="text"
            placeholder="Buscar por cliente..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm placeholder-gray-600 outline-none transition-all"
            style={{ color: c.text, background: c.g06, border: `1px solid ${c.g15}` }}
            onFocus={e => (e.target.style.borderColor = `${GOLD}60`)}
            onBlur={e => (e.target.style.borderColor = c.g15)}
          />
        </div>

        <div className="flex gap-1.5">
          {([
            { key: 'pendientes', label: 'Pendientes', color: '#f59e0b' },
            { key: 'confirmados', label: 'Confirmados', color: '#10b981' },
            { key: 'todos', label: 'Todos', color: '#9ca3af' },
          ] as const).map(f => (
            <button
              key={f.key}
              onClick={() => setFiltro(f.key)}
              className="px-3 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all"
              style={{
                background: filtro === f.key ? f.color + '20' : c.g06,
                border: `1px solid ${filtro === f.key ? f.color + '50' : c.g15}`,
                color: filtro === f.key ? f.color : c.textMuted,
              }}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Date filter */}
      <div className="flex items-center gap-2 flex-wrap">
        <Calendar className="w-3.5 h-3.5" style={{ color: c.textMuted }} />
        <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: c.textMuted }}>Fecha</span>
        <input
          type="date"
          value={filterFecha}
          onChange={e => setFilterFecha(e.target.value || getFechaHoyPeru())}
          className="px-2.5 py-1.5 rounded-lg text-xs outline-none"
          style={{ color: c.text, background: c.g08, border: `1px solid ${c.g15}` }}
        />
        {filterFecha !== getFechaHoyPeru() && (
          <button
            onClick={() => setFilterFecha(getFechaHoyPeru())}
            className="px-2.5 py-1.5 rounded-lg text-[10px] font-bold transition-colors"
            style={{ color: c.textSecondary, background: c.g08, border: `1px solid ${c.g15}` }}
          >
            Hoy
          </button>
        )}
        {filterFecha && (
          <button
            onClick={() => setFilterFecha('')}
            className="px-2.5 py-1.5 rounded-lg text-[10px] font-bold transition-colors"
            style={{ color: c.textSecondary, background: c.g08, border: `1px solid ${c.g15}` }}
          >
            Ver todos
          </button>
        )}
      </div>

      {/* Payment type filter */}
      <div className="flex items-center gap-2 flex-wrap">
        <Filter className="w-3.5 h-3.5" style={{ color: c.textMuted }} />
        <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: c.textMuted }}>Tipo</span>
        <div className="flex gap-1.5">
          {([
            { key: 'todos', label: 'Todos', color: '#9ca3af' },
            { key: 'fisico', label: 'Físico', color: '#10b981' },
            { key: 'digital', label: 'Digital', color: '#8b5cf6' },
          ] as const).map(f => (
            <button
              key={f.key}
              onClick={() => { setFiltroTipoPago(f.key); if (f.key !== 'digital') setFiltroMetodoDigital('todos'); }}
              className="px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all"
              style={{
                background: filtroTipoPago === f.key ? f.color + '20' : c.g06,
                border: `1px solid ${filtroTipoPago === f.key ? f.color + '50' : c.g15}`,
                color: filtroTipoPago === f.key ? f.color : c.textMuted,
              }}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Digital sub-filter */}
        {filtroTipoPago === 'digital' && (
          <div className="flex gap-1.5 ml-1">
            <span className="text-[10px] font-bold self-center" style={{ color: c.textMuted }}>→</span>
            <button
              onClick={() => setFiltroMetodoDigital('todos')}
              className="px-2.5 py-1.5 rounded-lg text-[10px] font-bold transition-all"
              style={{
                background: filtroMetodoDigital === 'todos' ? '#8b5cf620' : c.g06,
                border: `1px solid ${filtroMetodoDigital === 'todos' ? '#8b5cf650' : c.g15}`,
                color: filtroMetodoDigital === 'todos' ? '#8b5cf6' : c.textMuted,
              }}
            >
              Todos
            </button>
            {DIGITAL_METHODS.map(m => {
              const cfg = METODO_CONFIG[m];
              return (
                <button
                  key={m}
                  onClick={() => setFiltroMetodoDigital(m)}
                  className="px-2.5 py-1.5 rounded-lg text-[10px] font-bold transition-all"
                  style={{
                    background: filtroMetodoDigital === m ? cfg.color + '20' : c.g06,
                    border: `1px solid ${filtroMetodoDigital === m ? cfg.color + '50' : c.g15}`,
                    color: filtroMetodoDigital === m ? cfg.color : c.textMuted,
                  }}
                >
                  {cfg.label}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Payments grouped by day */}
      <div className="space-y-5">
        {pagosPorDia.map(({ fecha, pagos: pagosDia, totalMonto, pendientesDia, confirmadosDia }) => (
          <div key={fecha} className="space-y-2">
            {/* Day header */}
            <div className="flex items-center justify-between px-1 py-1">
              <div className="flex items-center gap-2.5">
                <Calendar className="w-3.5 h-3.5" style={{ color: c.textMuted }} />
                <span className="text-xs font-bold" style={{ color: c.text }}>{formatFecha(fecha)}</span>
                <span className="text-[10px]" style={{ color: c.textMuted }}>{pagosDia.length} pago{pagosDia.length > 1 ? 's' : ''}</span>
                {pendientesDia > 0 && (
                  <span className="text-[9px] font-semibold text-amber-400/80 tabular-nums">
                    {pendientesDia} pend.
                  </span>
                )}
                {confirmadosDia > 0 && pendientesDia === 0 && (
                  <span className="text-[9px] font-semibold text-emerald-400/80 flex items-center gap-0.5">
                    <CheckCircle className="w-2.5 h-2.5" />OK
                  </span>
                )}
              </div>
              <span className="text-xs font-black tabular-nums font-mono" style={{ color: c.textSecondary }}>
                S/ {totalMonto.toFixed(2)}
              </span>
            </div>

            {/* Payment cards for this day */}
            <div className="space-y-2">
              <AnimatePresence>
                {pagosDia.map((pago, idx) => {
                  const metodo = METODO_CONFIG[pago.metodo] || METODO_CONFIG.Efectivo;
                  const MetodoIcon = metodo.icon;
                  const isExpanded = expandedId === pago.id;

                  return (
                    <motion.div
                      key={pago.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ delay: idx * 0.02 }}
                      className="rounded-2xl overflow-hidden"
                      style={{
                        background: c.g04,
                        border: `1px solid ${pago.estado === 'Pendiente' ? 'rgba(245,158,11,0.25)' : pago.estado === 'Confirmado' ? 'rgba(16,185,129,0.20)' : 'rgba(239,68,68,0.20)'}`,
                      }}
                    >
                      {/* Card header */}
                      <button
                        onClick={() => setExpandedId(isExpanded ? null : pago.id)}
                        className="w-full flex items-center justify-between px-4 py-3.5 transition-all"
                        style={{ background: 'transparent' }}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                            style={{ background: metodo.color + '15', border: `1px solid ${metodo.color}30` }}>
                            <MetodoIcon className="w-4.5 h-4.5" style={{ color: metodo.color }} />
                          </div>
                          <div className="text-left">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-bold" style={{ color: c.text }}>{pago.clienteNombre}</span>
                              {pago.estado === 'Pendiente' && (
                                <span className="text-[9px] font-semibold text-amber-500 flex items-center gap-0.5">
                                  <Clock className="w-2.5 h-2.5" /> Pendiente
                                </span>
                              )}
                              {pago.estado === 'Confirmado' && (
                                <span className="text-[9px] font-semibold text-emerald-500 flex items-center gap-0.5">
                                  <CheckCircle className="w-2.5 h-2.5" /> Confirmado
                                </span>
                              )}
                              {pago.estado === 'Rechazado' && (
                                <span className="text-[9px] font-semibold text-red-500 flex items-center gap-0.5">
                                  <XCircle className="w-2.5 h-2.5" /> Rechazado
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-3 text-[10px] mt-0.5" style={{ color: c.textMuted }}>
                              <span className="font-bold" style={{ color: metodo.color }}>{metodo.label}</span>
                              <span>{pago.hora.slice(0, 5)}</span>
                              {pago.fechasCubiertas && pago.fechasCubiertas.length > 0 && (
                                <span style={{ color: c.textMuted }}>{pago.fechasCubiertas.length} día{pago.fechasCubiertas.length > 1 ? 's' : ''}</span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-base font-black tabular-nums font-mono" style={{ color: c.text }}>
                            S/ {pago.monto.toFixed(2)}
                          </span>
                          {isExpanded ? <ChevronUp className="w-3.5 h-3.5" style={{ color: c.textMuted }} /> : <ChevronDown className="w-3.5 h-3.5" style={{ color: c.textMuted }} />}
                        </div>
                      </button>

                      {/* Expanded details */}
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                          >
                            <div className="px-4 pb-4 space-y-3" style={{ borderTop: `1px solid ${c.g10}` }}>
                              <div className="pt-3 grid grid-cols-2 gap-3">
                                <div className="rounded-xl p-3 space-y-2" style={{ background: c.g06, border: `1px solid ${c.g10}` }}>
                                  <div className="flex justify-between text-[10px]">
                                    <span style={{ color: c.textMuted }}>Método</span>
                                    <span className="font-bold" style={{ color: metodo.color }}>{metodo.label}</span>
                                  </div>
                                  <div className="flex justify-between text-[10px]">
                                    <span style={{ color: c.textMuted }}>Monto</span>
                                    <span className="font-black font-mono" style={{ color: c.text }}>S/ {pago.monto.toFixed(2)}</span>
                                  </div>
                                  <div className="flex justify-between text-[10px]">
                                    <span style={{ color: c.textMuted }}>Hora</span>
                                    <span style={{ color: c.textSecondary }}>{pago.hora.slice(0, 5)}</span>
                                  </div>
                                  {pago.numeroOperacion && (
                                    <div className="flex justify-between text-[10px]">
                                      <span style={{ color: c.textMuted }}>Nro. Operación</span>
                                      <span className="font-bold font-mono" style={{ color: metodo.color }}>{pago.numeroOperacion}</span>
                                    </div>
                                  )}
                                  {pago.fechasCubiertas && pago.fechasCubiertas.length > 0 && (
                                    <div className="text-[10px]">
                                      <span style={{ color: c.textMuted }}>Días cubiertos:</span>
                                      <div className="flex flex-wrap gap-1 mt-1">
                                        {pago.fechasCubiertas.map(fc => (
                                          <span key={fc} className="text-[9px] px-1.5 py-0.5 rounded-md font-mono" style={{ background: c.g04, color: c.textSecondary }}>
                                            {formatFecha(fc)}
                                          </span>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>
                                <div className="rounded-xl p-3" style={{ background: c.g06, border: `1px solid ${c.g10}` }}>
                                  <p className="text-[9px] uppercase tracking-widest font-bold mb-1" style={{ color: c.textMuted }}>Observaciones</p>
                                  <p className="text-xs leading-relaxed" style={{ color: c.textSecondary }}>
                                    {pago.observaciones || <span className="italic" style={{ color: c.textMuted }}>Sin observaciones</span>}
                                  </p>
                                </div>
                              </div>

                              {pago.foto && (
                                <div className="rounded-xl overflow-hidden cursor-pointer group relative"
                                  style={{ border: `1px solid ${c.g15}` }}
                                  onClick={() => setPreviewFoto(pago.foto || null)}
                                >
                                  <img src={pago.foto} alt="Comprobante" className="w-full max-h-48 object-cover" />
                                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <Eye className="w-6 h-6 text-white" />
                                  </div>
                                </div>
                              )}

                              {pago.estado === 'Pendiente' && (
                                <div className="grid grid-cols-2 gap-2.5 pt-1">
                                  <motion.button
                                    whileHover={{ scale: 1.03 }}
                                    whileTap={{ scale: 0.97 }}
                                    onClick={() => handleValidar(pago, 'rechazar')}
                                    className="py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all"
                                    style={{
                                      background: 'rgba(239,68,68,0.10)',
                                      border: '1px solid rgba(239,68,68,0.30)',
                                      color: '#ef4444',
                                    }}
                                  >
                                    <XCircle className="w-3.5 h-3.5" />
                                    Rechazar
                                  </motion.button>
                                  <motion.button
                                    whileHover={{ scale: 1.03 }}
                                    whileTap={{ scale: 0.97 }}
                                    onClick={() => handleValidar(pago, 'confirmar')}
                                    className="py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 text-black transition-all"
                                    style={{
                                      background: 'linear-gradient(135deg, #10b981, #059669)',
                                      boxShadow: '0 4px 16px rgba(16,185,129,0.30)',
                                    }}
                                  >
                                    <CheckCircle className="w-3.5 h-3.5" />
                                    Validar Pago
                                  </motion.button>
                                </div>
                              )}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          </div>
        ))}

        {pagosFiltrados.length === 0 && (
          <div className="text-center py-16">
            <DollarSign className="w-12 h-12 mx-auto mb-3" style={{ color: c.textMuted }} />
            <p className="text-sm" style={{ color: c.textMuted }}>
              {filtro === 'pendientes'
                ? 'No hay pagos pendientes de validación'
                : filtro === 'confirmados'
                  ? 'No hay pagos confirmados'
                  : 'No hay pagos registrados'}
            </p>
          </div>
        )}
      </div>

      {/* ─── CONFIRMATION DIALOG ──────────────────────────────────── */}
      <AnimatePresence>
        {confirmDialog && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[70] flex items-center justify-center p-4"
            style={{ background: c.bgModalOverlay }}
            onClick={() => setConfirmDialog(null)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-sm rounded-2xl p-6 space-y-5"
              style={{
                background: c.bgModal,
                border: '2px solid rgba(16,185,129,0.30)',
                boxShadow: c.shadowLg,
              }}
            >
              <div className="text-center">
                <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-3"
                  style={{
                    background: 'rgba(16,185,129,0.12)',
                    border: '2px solid rgba(16,185,129,0.30)',
                  }}>
                  <CheckCircle className="w-7 h-7 text-emerald-400" />
                </div>
                <h4 className="font-bold text-sm mb-1" style={{ color: c.text }}>
                  ¿Validar este pago?
                </h4>
                <p className="text-xs" style={{ color: c.textSecondary }}>
                  Confirma que se recibió el dinero correctamente.
                </p>
              </div>

              <div className="rounded-xl p-3 space-y-1.5" style={{ background: c.g06, border: `1px solid ${c.g10}` }}>
                <div className="flex justify-between text-[10px]">
                  <span style={{ color: c.textMuted }}>Cliente</span>
                  <span className="font-bold" style={{ color: c.text }}>{confirmDialog.pago.clienteNombre}</span>
                </div>
                <div className="flex justify-between text-[10px]">
                  <span style={{ color: c.textMuted }}>Monto</span>
                  <span className="font-black font-mono" style={{ color: c.text }}>S/ {confirmDialog.pago.monto.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-[10px]">
                  <span style={{ color: c.textMuted }}>Método</span>
                  <span className="font-bold" style={{ color: METODO_CONFIG[confirmDialog.pago.metodo]?.color || '#999' }}>
                    {METODO_CONFIG[confirmDialog.pago.metodo]?.label || confirmDialog.pago.metodo}
                  </span>
                </div>
                {confirmDialog.pago.numeroOperacion && (
                  <div className="flex justify-between text-[10px]">
                    <span style={{ color: c.textMuted }}>Nro. Operación</span>
                    <span className="font-bold font-mono" style={{ color: METODO_CONFIG[confirmDialog.pago.metodo]?.color || '#999' }}>
                      {confirmDialog.pago.numeroOperacion}
                    </span>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <button
                  onClick={() => setConfirmDialog(null)}
                  className="py-2.5 rounded-xl font-bold text-xs transition-all"
                  style={{ color: c.textSecondary, background: c.g08, border: `1px solid ${c.g15}` }}
                >
                  Cancelar
                </button>
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={ejecutarAccion}
                  className="py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all"
                  style={{
                    background: 'linear-gradient(135deg, #10b981, #059669)',
                    color: '#fff',
                    boxShadow: '0 4px 12px rgba(16,185,129,0.30)',
                  }}
                >
                  <CheckCircle className="w-3.5 h-3.5" /> Sí, Validar
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── REJECTION REASON DIALOG ─────────────────────────────── */}
      <AnimatePresence>
        {rechazarDialog && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[70] flex items-center justify-center p-4"
            style={{ background: c.bgModalOverlay }}
            onClick={() => { setRechazarDialog(null); setMotivoRechazo(''); setConfirmarRechazo(false); }}
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-sm rounded-2xl p-6 space-y-5"
              style={{
                background: c.bgModal,
                border: '2px solid rgba(239,68,68,0.30)',
                boxShadow: c.shadowLg,
              }}
            >
              <div className="text-center">
                <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-3"
                  style={{
                    background: 'rgba(239,68,68,0.12)',
                    border: '2px solid rgba(239,68,68,0.30)',
                  }}>
                  <AlertTriangle className="w-7 h-7 text-red-400" />
                </div>
                <h4 className="font-bold text-sm mb-1" style={{ color: c.text }}>
                  Rechazar Pago
                </h4>
                <p className="text-xs" style={{ color: c.textSecondary }}>
                  Indique el motivo del rechazo. Este mensaje será visto por el cobrador.
                </p>
              </div>

              <div className="rounded-xl p-3 space-y-1.5" style={{ background: c.g06, border: `1px solid ${c.g10}` }}>
                <div className="flex justify-between text-[10px]">
                  <span style={{ color: c.textMuted }}>Cliente</span>
                  <span className="font-bold" style={{ color: c.text }}>{rechazarDialog.pago.clienteNombre}</span>
                </div>
                <div className="flex justify-between text-[10px]">
                  <span style={{ color: c.textMuted }}>Monto</span>
                  <span className="font-black font-mono" style={{ color: c.text }}>S/ {rechazarDialog.pago.monto.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-[10px]">
                  <span style={{ color: c.textMuted }}>Método</span>
                  <span className="font-bold" style={{ color: METODO_CONFIG[rechazarDialog.pago.metodo]?.color || '#999' }}>
                    {METODO_CONFIG[rechazarDialog.pago.metodo]?.label || rechazarDialog.pago.metodo}
                  </span>
                </div>
              </div>

              {/* Motivo textarea */}
              <div>
                <label className="text-[10px] uppercase tracking-widest font-bold mb-2 block" style={{ color: c.textMuted }}>
                  <MessageSquare className="w-3 h-3 inline mr-1" />
                  Motivo del rechazo *
                </label>
                <textarea
                  value={motivoRechazo}
                  onChange={e => { setMotivoRechazo(e.target.value); setConfirmarRechazo(false); }}
                  placeholder="Escriba el motivo del rechazo..."
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl text-sm placeholder-gray-600 outline-none resize-none transition-all"
                  style={{ color: c.text, background: c.g06, border: `1px solid ${c.g15}` }}
                  onFocus={e => (e.target.style.borderColor = 'rgba(239,68,68,0.5)')}
                  onBlur={e => (e.target.style.borderColor = c.g15)}
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <button
                  onClick={() => { setRechazarDialog(null); setMotivoRechazo(''); setConfirmarRechazo(false); }}
                  className="py-2.5 rounded-xl font-bold text-xs transition-all"
                  style={{ color: c.textSecondary, background: c.g08, border: `1px solid ${c.g15}` }}
                >
                  Cancelar
                </button>
                {!confirmarRechazo ? (
                  <motion.button
                    whileHover={motivoRechazo.trim() ? { scale: 1.03 } : {}}
                    whileTap={motivoRechazo.trim() ? { scale: 0.97 } : {}}
                    onClick={() => { if (motivoRechazo.trim()) setConfirmarRechazo(true); }}
                    disabled={!motivoRechazo.trim()}
                    className="py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all"
                    style={{
                      background: motivoRechazo.trim() ? 'rgba(239,68,68,0.15)' : c.g08,
                      border: `1px solid ${motivoRechazo.trim() ? 'rgba(239,68,68,0.40)' : c.g15}`,
                      color: motivoRechazo.trim() ? '#ef4444' : '#555',
                      cursor: motivoRechazo.trim() ? 'pointer' : 'not-allowed',
                    }}
                  >
                    <XCircle className="w-3.5 h-3.5" /> Rechazar
                  </motion.button>
                ) : (
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={ejecutarRechazo}
                    className="py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all"
                    style={{
                      background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                      color: '#fff',
                      boxShadow: '0 4px 12px rgba(239,68,68,0.30)',
                    }}
                  >
                    <AlertTriangle className="w-3.5 h-3.5" /> Confirmar Rechazo
                  </motion.button>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── PHOTO PREVIEW MODAL ──────────────────────────────────── */}
      <AnimatePresence>
        {previewFoto && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[80] flex items-center justify-center p-4 cursor-pointer"
            style={{ background: c.bgModalOverlay }}
            onClick={() => setPreviewFoto(null)}
          >
            <motion.img
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              src={previewFoto}
              alt="Comprobante"
              className="max-w-full max-h-[85vh] rounded-xl object-contain"
              style={{ border: `2px solid ${c.g20}` }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
