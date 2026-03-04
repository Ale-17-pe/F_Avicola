import { useState, useMemo } from 'react';
import {
  CheckCircle, XCircle, Clock, Eye, User, Calendar,
  DollarSign, Smartphone, Banknote, CreditCard,
  AlertTriangle, ChevronDown, ChevronUp, Search, Filter
} from 'lucide-react';
import { useApp, Pago } from '../contexts/AppContext';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

// ─── DESIGN TOKENS ────────────────────────────────────────────────
const GOLD = '#ccaa00';
const G04 = 'rgba(255,255,255,0.04)';
const G06 = 'rgba(255,255,255,0.06)';
const G08 = 'rgba(255,255,255,0.08)';
const G10 = 'rgba(255,255,255,0.10)';
const G15 = 'rgba(255,255,255,0.15)';
const G20 = 'rgba(255,255,255,0.20)';

const METODO_CONFIG: Record<string, { color: string; icon: any; label: string }> = {
  Efectivo:  { color: '#10b981', icon: Banknote,   label: 'Efectivo' },
  Yape:      { color: '#7B2D8E', icon: Smartphone, label: 'YAPE' },
  Plin:      { color: '#00BCD4', icon: Smartphone, label: 'PLIN' },
  BCP:       { color: '#FF6600', icon: CreditCard, label: 'BCP' },
  Interbank: { color: '#009A3E', icon: CreditCard, label: 'INTERBANK' },
  BBVA:      { color: '#004481', icon: CreditCard, label: 'BBVA' },
};

const formatFecha = (fecha: string) => {
  try {
    const d = new Date(fecha + 'T00:00:00');
    return d.toLocaleDateString('es-PE', { weekday: 'short', day: 'numeric', month: 'short' });
  } catch { return fecha; }
};

// ─── COMPONENT ────────────────────────────────────────────────────
export function ValidacionPagos() {
  const { pagos, updatePago } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [filtro, setFiltro] = useState<'pendientes' | 'todos' | 'confirmados'>('pendientes');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{ pago: Pago; accion: 'confirmar' | 'rechazar' } | null>(null);
  const [previewFoto, setPreviewFoto] = useState<string | null>(null);
  const [filterFecha, setFilterFecha] = useState(() => {
    const now = new Date();
    const peru = new Date(now.toLocaleString('en-US', { timeZone: 'America/Lima' }));
    const y = peru.getFullYear();
    const m = String(peru.getMonth() + 1).padStart(2, '0');
    const d = String(peru.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  });

  const pagosFiltrados = useMemo(() => {
    let lista = [...pagos].sort((a, b) => {
      // Pendientes first, then by date desc
      if (a.estado === 'Pendiente' && b.estado !== 'Pendiente') return -1;
      if (a.estado !== 'Pendiente' && b.estado === 'Pendiente') return 1;
      return (b.fecha + b.hora).localeCompare(a.fecha + a.hora);
    });

    // Date filter
    if (filterFecha) lista = lista.filter(p => p.fecha === filterFecha);

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
  }, [pagos, filtro, searchTerm, filterFecha]);

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
    setConfirmDialog({ pago, accion });
  };

  const ejecutarAccion = () => {
    if (!confirmDialog) return;
    const { pago, accion } = confirmDialog;

    updatePago({
      ...pago,
      estado: accion === 'confirmar' ? 'Confirmado' : 'Rechazado',
    });

    toast.success(accion === 'confirmar'
      ? `Pago de S/ ${pago.monto.toFixed(2)} confirmado para ${pago.clienteNombre}`
      : `Pago de S/ ${pago.monto.toFixed(2)} rechazado`
    );
    setConfirmDialog(null);
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
            <h2 className="text-lg font-bold text-white">Validación de Pagos</h2>
            <p className="text-xs text-gray-500">
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
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            placeholder="Buscar por cliente..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm text-white placeholder-gray-600 outline-none transition-all"
            style={{ background: G06, border: `1px solid ${G15}` }}
            onFocus={e => (e.target.style.borderColor = `${GOLD}60`)}
            onBlur={e => (e.target.style.borderColor = G15)}
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
                background: filtro === f.key ? f.color + '20' : G06,
                border: `1px solid ${filtro === f.key ? f.color + '50' : G15}`,
                color: filtro === f.key ? f.color : '#666',
              }}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Date filter */}
      <div className="flex items-center gap-2 flex-wrap">
        <Calendar className="w-3.5 h-3.5 text-gray-500" />
        <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Fecha</span>
        <input
          type="date"
          value={filterFecha}
          onChange={e => setFilterFecha(e.target.value)}
          className="px-2.5 py-1.5 rounded-lg text-xs text-white outline-none"
          style={{ background: G08, border: `1px solid ${G15}` }}
        />
        {filterFecha && (
          <button
            onClick={() => setFilterFecha('')}
            className="px-2.5 py-1.5 rounded-lg text-[10px] font-bold text-gray-400 hover:text-white transition-colors"
            style={{ background: G08, border: `1px solid ${G15}` }}
          >
            Ver todos
          </button>
        )}
      </div>

      {/* Payments grouped by day */}
      <div className="space-y-5">
        {pagosPorDia.map(({ fecha, pagos: pagosDia, totalMonto, pendientesDia, confirmadosDia }) => (
          <div key={fecha} className="space-y-2">
            {/* Day header */}
            <div className="flex items-center justify-between px-1 py-1">
              <div className="flex items-center gap-2.5">
                <Calendar className="w-3.5 h-3.5 text-gray-500" />
                <span className="text-xs font-bold text-white">{formatFecha(fecha)}</span>
                <span className="text-[10px] text-gray-600">{pagosDia.length} pago{pagosDia.length > 1 ? 's' : ''}</span>
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
              <span className="text-xs font-black text-gray-400 tabular-nums font-mono">
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
                        background: G04,
                        border: `1px solid ${pago.estado === 'Pendiente' ? 'rgba(245,158,11,0.25)' : pago.estado === 'Confirmado' ? 'rgba(16,185,129,0.20)' : 'rgba(239,68,68,0.20)'}`,
                      }}
                    >
                      {/* Card header */}
                      <button
                        onClick={() => setExpandedId(isExpanded ? null : pago.id)}
                        className="w-full flex items-center justify-between px-4 py-3.5 transition-all hover:bg-white/[0.02]"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                            style={{ background: metodo.color + '15', border: `1px solid ${metodo.color}30` }}>
                            <MetodoIcon className="w-4.5 h-4.5" style={{ color: metodo.color }} />
                          </div>
                          <div className="text-left">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-bold text-white">{pago.clienteNombre}</span>
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
                            <div className="flex items-center gap-3 text-[10px] text-gray-500 mt-0.5">
                              <span className="font-bold" style={{ color: metodo.color }}>{metodo.label}</span>
                              <span>{pago.hora.slice(0, 5)}</span>
                              {pago.fechasCubiertas && pago.fechasCubiertas.length > 0 && (
                                <span className="text-gray-600">{pago.fechasCubiertas.length} día{pago.fechasCubiertas.length > 1 ? 's' : ''}</span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-base font-black text-white tabular-nums font-mono">
                            S/ {pago.monto.toFixed(2)}
                          </span>
                          {isExpanded ? <ChevronUp className="w-3.5 h-3.5 text-gray-500" /> : <ChevronDown className="w-3.5 h-3.5 text-gray-500" />}
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
                            <div className="px-4 pb-4 space-y-3" style={{ borderTop: `1px solid ${G10}` }}>
                              <div className="pt-3 grid grid-cols-2 gap-3">
                                <div className="rounded-xl p-3 space-y-2" style={{ background: G06, border: `1px solid ${G10}` }}>
                                  <div className="flex justify-between text-[10px]">
                                    <span className="text-gray-500">Método</span>
                                    <span className="font-bold" style={{ color: metodo.color }}>{metodo.label}</span>
                                  </div>
                                  <div className="flex justify-between text-[10px]">
                                    <span className="text-gray-500">Monto</span>
                                    <span className="text-white font-black font-mono">S/ {pago.monto.toFixed(2)}</span>
                                  </div>
                                  <div className="flex justify-between text-[10px]">
                                    <span className="text-gray-500">Hora</span>
                                    <span className="text-gray-300">{pago.hora.slice(0, 5)}</span>
                                  </div>
                                  {pago.fechasCubiertas && pago.fechasCubiertas.length > 0 && (
                                    <div className="text-[10px]">
                                      <span className="text-gray-500">Días cubiertos:</span>
                                      <div className="flex flex-wrap gap-1 mt-1">
                                        {pago.fechasCubiertas.map(fc => (
                                          <span key={fc} className="text-[9px] px-1.5 py-0.5 rounded-md bg-white/5 text-gray-400 font-mono">
                                            {formatFecha(fc)}
                                          </span>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>
                                <div className="rounded-xl p-3" style={{ background: G06, border: `1px solid ${G10}` }}>
                                  <p className="text-[9px] uppercase tracking-widest text-gray-500 font-bold mb-1">Observaciones</p>
                                  <p className="text-xs text-gray-300 leading-relaxed">
                                    {pago.observaciones || <span className="text-gray-600 italic">Sin observaciones</span>}
                                  </p>
                                </div>
                              </div>

                              {pago.foto && (
                                <div className="rounded-xl overflow-hidden cursor-pointer group relative"
                                  style={{ border: `1px solid ${G15}` }}
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
            <DollarSign className="w-12 h-12 mx-auto mb-3 text-gray-700" />
            <p className="text-gray-500 text-sm">
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
            style={{ background: 'rgba(0,0,0,0.85)' }}
            onClick={() => setConfirmDialog(null)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-sm rounded-2xl p-6 space-y-5"
              style={{
                background: 'linear-gradient(160deg, #0a0a0a, #111)',
                border: `2px solid ${confirmDialog.accion === 'confirmar' ? 'rgba(16,185,129,0.30)' : 'rgba(239,68,68,0.30)'}`,
                boxShadow: `0 20px 40px rgba(0,0,0,0.8)`,
              }}
            >
              <div className="text-center">
                <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-3"
                  style={{
                    background: confirmDialog.accion === 'confirmar' ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)',
                    border: `2px solid ${confirmDialog.accion === 'confirmar' ? 'rgba(16,185,129,0.30)' : 'rgba(239,68,68,0.30)'}`,
                  }}>
                  {confirmDialog.accion === 'confirmar'
                    ? <CheckCircle className="w-7 h-7 text-emerald-400" />
                    : <AlertTriangle className="w-7 h-7 text-red-400" />}
                </div>
                <h4 className="text-white font-bold text-sm mb-1">
                  {confirmDialog.accion === 'confirmar' ? '¿Validar este pago?' : '¿Rechazar este pago?'}
                </h4>
                <p className="text-gray-400 text-xs">
                  {confirmDialog.accion === 'confirmar'
                    ? 'Confirma que se recibió el dinero correctamente.'
                    : 'El pago será marcado como rechazado y el cliente deberá volver a registrarlo.'
                  }
                </p>
              </div>

              <div className="rounded-xl p-3 space-y-1.5" style={{ background: G06, border: `1px solid ${G10}` }}>
                <div className="flex justify-between text-[10px]">
                  <span className="text-gray-500">Cliente</span>
                  <span className="text-white font-bold">{confirmDialog.pago.clienteNombre}</span>
                </div>
                <div className="flex justify-between text-[10px]">
                  <span className="text-gray-500">Monto</span>
                  <span className="text-white font-black font-mono">S/ {confirmDialog.pago.monto.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-[10px]">
                  <span className="text-gray-500">Método</span>
                  <span className="font-bold" style={{ color: METODO_CONFIG[confirmDialog.pago.metodo]?.color || '#999' }}>
                    {METODO_CONFIG[confirmDialog.pago.metodo]?.label || confirmDialog.pago.metodo}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <button
                  onClick={() => setConfirmDialog(null)}
                  className="py-2.5 rounded-xl font-bold text-xs transition-all hover:bg-white/10 text-gray-400"
                  style={{ background: G08, border: `1px solid ${G15}` }}
                >
                  Cancelar
                </button>
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={ejecutarAccion}
                  className="py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all"
                  style={{
                    background: confirmDialog.accion === 'confirmar'
                      ? 'linear-gradient(135deg, #10b981, #059669)'
                      : 'linear-gradient(135deg, #ef4444, #dc2626)',
                    color: '#fff',
                    boxShadow: `0 4px 12px ${confirmDialog.accion === 'confirmar' ? 'rgba(16,185,129,0.30)' : 'rgba(239,68,68,0.30)'}`,
                  }}
                >
                  {confirmDialog.accion === 'confirmar'
                    ? <><CheckCircle className="w-3.5 h-3.5" /> Sí, Validar</>
                    : <><XCircle className="w-3.5 h-3.5" /> Sí, Rechazar</>}
                </motion.button>
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
            style={{ background: 'rgba(0,0,0,0.90)' }}
            onClick={() => setPreviewFoto(null)}
          >
            <motion.img
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              src={previewFoto}
              alt="Comprobante"
              className="max-w-full max-h-[85vh] rounded-xl object-contain"
              style={{ border: `2px solid ${G20}` }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
