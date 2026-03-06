import { useState, useRef, useCallback, useEffect } from 'react';
import {
  X, DollarSign, Smartphone, CreditCard, Camera, QrCode, Copy,
  CheckCircle, AlertTriangle, Loader2, ChevronLeft, Eye, Trash2,
  Banknote, Clock
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp, Pago } from '../contexts/AppContext';
import { toast } from 'sonner';

// ─── TYPES ────────────────────────────────────────────────────────
type MetodoPago = Pago['metodo'];
type Paso = 'metodo' | 'efectivo' | 'digital-sub' | 'digital-detalle' | 'preconfirm' | 'esperando' | 'completado';

interface ModalPagoProps {
  isOpen: boolean;
  onClose: () => void;
  clienteNombre: string;
  clienteId: string;
  monto: number;
  fechasCubiertas: string[];
  onPagoRegistrado?: () => void;
}

// ─── DESIGN TOKENS ────────────────────────────────────────────────
const GOLD = '#ccaa00';
const G04 = 'rgba(255,255,255,0.04)';
const G06 = 'rgba(255,255,255,0.06)';
const G08 = 'rgba(255,255,255,0.08)';
const G10 = 'rgba(255,255,255,0.10)';
const G15 = 'rgba(255,255,255,0.15)';
const G20 = 'rgba(255,255,255,0.20)';

// ─── DIGITAL SUB-METHODS CONFIG ───────────────────────────────────
const DIGITAL_METHODS: {
  id: MetodoPago;
  label: string;
  color: string;
  tipo: 'wallet' | 'banco';
  cuentaLabel?: string;
  cuentaNumero?: string;
}[] = [
  { id: 'Yape',      label: 'YAPE',      color: '#7B2D8E', tipo: 'wallet' },
  { id: 'Plin',      label: 'PLIN',      color: '#00BCD4', tipo: 'wallet' },
  { id: 'BCP',       label: 'BCP',       color: '#FF6600', tipo: 'banco', cuentaLabel: 'CCI BCP',       cuentaNumero: '002-19312345678901-36' },
  { id: 'Interbank', label: 'INTERBANK', color: '#009A3E', tipo: 'banco', cuentaLabel: 'CCI Interbank', cuentaNumero: '003-19312345678902-37' },
  { id: 'BBVA',      label: 'BBVA',      color: '#004481', tipo: 'banco', cuentaLabel: 'CCI BBVA',      cuentaNumero: '011-19312345678903-38' },
];

// ─── COMPONENT ────────────────────────────────────────────────────
export function ModalPago({ isOpen, onClose, clienteNombre, clienteId, monto, fechasCubiertas, onPagoRegistrado }: ModalPagoProps) {
  const { addPago, pagos } = useApp();

  const [paso, setPaso] = useState<Paso>('metodo');
  const [metodoSeleccionado, setMetodoSeleccionado] = useState<MetodoPago | null>(null);
  const [observaciones, setObservaciones] = useState('');
  const [fotoBase64, setFotoBase64] = useState<string | null>(null);
  const [pagoRegistradoId, setPagoRegistradoId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ─── REAL-TIME: Watch for confirmation from Secretaría ─────────
  useEffect(() => {
    if (paso !== 'esperando' || !pagoRegistradoId) return;
    const pagoActual = pagos.find(p => p.id === pagoRegistradoId);
    if (pagoActual && pagoActual.estado === 'Confirmado') {
      setPaso('completado');
    }
  }, [pagos, paso, pagoRegistradoId]);

  // Reset state when opening
  const resetState = useCallback(() => {
    setPaso('metodo');
    setMetodoSeleccionado(null);
    setObservaciones('');
    setFotoBase64(null);
    setPagoRegistradoId(null);
  }, []);

  const handleClose = () => {
    if (paso === 'esperando') return; // Can't close while waiting for digital
    resetState();
    onClose();
  };

  // ─── FOTO CAPTURE ──────────────────────────────────────────────
  const handleCapturarFoto = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Compress and convert to base64
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX = 800;
        let w = img.width, h = img.height;
        if (w > MAX || h > MAX) {
          if (w > h) { h = Math.round(h * MAX / w); w = MAX; }
          else { w = Math.round(w * MAX / h); h = MAX; }
        }
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, w, h);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
        setFotoBase64(dataUrl);
        toast.success('Foto capturada correctamente');
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);

    // Reset input so same file can be re-selected
    e.target.value = '';
  };

  // ─── COPY CCI ──────────────────────────────────────────────────
  const copiarCCI = (numero: string) => {
    navigator.clipboard.writeText(numero.replace(/-/g, '')).then(() => {
      toast.success('Número de cuenta copiado al portapapeles');
    }).catch(() => {
      toast.error('No se pudo copiar');
    });
  };

  // ─── CONFIRM PAYMENT ──────────────────────────────────────────
  const confirmarPago = () => {
    if (!metodoSeleccionado) return;

    const esEfectivo = metodoSeleccionado === 'Efectivo';
    const now = new Date();
    const pagoId = `pago-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
    const nuevoPago: Pago = {
      id: pagoId,
      clienteId,
      clienteNombre,
      monto,
      metodo: metodoSeleccionado,
      fecha: now.toISOString().split('T')[0],
      hora: now.toTimeString().slice(0, 8),
      observaciones: observaciones.trim() || undefined,
      foto: fotoBase64 || undefined,
      estado: 'Pendiente',
      registradoPor: 'Cobranza',
      fechasCubiertas,
    };

    addPago(nuevoPago);
    setPagoRegistradoId(pagoId);
    onPagoRegistrado?.();

    if (esEfectivo) {
      // Efectivo: show completed immediately (cobrador sees it as done)
      setPaso('completado');
      toast.success('Pago en efectivo registrado — Dinero recibido');
    } else {
      // Digital: wait for Secretaría validation
      setPaso('esperando');
      toast.success('Pago registrado — En espera de validación');
    }
  };

  // ─── DIGITAL METHOD INFO ───────────────────────────────────────
  const metodoDigitalInfo = DIGITAL_METHODS.find(m => m.id === metodoSeleccionado);
  const esBanco = metodoDigitalInfo?.tipo === 'banco';
  const requiereFoto = metodoSeleccionado !== 'Efectivo' && metodoSeleccionado !== null;
  const puedeConfirmar = metodoSeleccionado === 'Efectivo' || (requiereFoto && !!fotoBase64);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-3"
      style={{ background: 'rgba(0,0,0,0.85)' }}
      onClick={(e) => e.target === e.currentTarget && paso !== 'esperando' && paso !== 'completado' && handleClose()}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-lg max-h-[92vh] overflow-y-auto rounded-2xl"
        style={{
          background: 'linear-gradient(160deg, #0a0a0a, #111)',
          border: '2px solid rgba(16,185,129,0.30)',
          boxShadow: '0 30px 60px rgba(0,0,0,0.8), 0 0 80px rgba(16,185,129,0.08)',
        }}
      >
        {/* Hidden file input for camera/gallery */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={handleFileChange}
        />

        {/* ─── HEADER ─────────────────────────────────────────────── */}
        <div className="flex items-center justify-between px-5 py-4"
          style={{ borderBottom: `1px solid ${G10}` }}>
          <div className="flex items-center gap-3">
            {paso !== 'metodo' && paso !== 'esperando' && paso !== 'completado' && (
              <button onClick={() => {
                if (paso === 'preconfirm') setPaso(metodoSeleccionado === 'Efectivo' ? 'efectivo' : 'digital-detalle');
                else if (paso === 'digital-detalle') { setPaso('digital-sub'); setFotoBase64(null); }
                else if (paso === 'digital-sub') { setPaso('metodo'); setMetodoSeleccionado(null); }
                else if (paso === 'efectivo') { setPaso('metodo'); setMetodoSeleccionado(null); }
              }}
                className="p-1.5 rounded-lg transition-all hover:bg-white/10">
                <ChevronLeft className="w-4 h-4 text-gray-400" />
              </button>
            )}
            <div>
              <h3 className="text-white font-bold text-sm">
                {paso === 'metodo' && 'Método de Pago'}
                {paso === 'efectivo' && 'Pago en Efectivo'}
                {paso === 'digital-sub' && 'Pago Digital'}
                {paso === 'digital-detalle' && `Pago con ${metodoDigitalInfo?.label || ''}`}
                {paso === 'preconfirm' && 'Confirmar Pago'}
                {paso === 'esperando' && 'Pago Registrado'}
                {paso === 'completado' && 'Pago Completado'}
              </h3>
              <p className="text-[10px] text-gray-500">{clienteNombre}</p>
            </div>
          </div>
          {paso !== 'esperando' && paso !== 'completado' && (
            <button onClick={handleClose}
              className="p-2 rounded-lg transition-all hover:bg-white/10">
              <X className="w-4 h-4 text-gray-400" />
            </button>
          )}
        </div>

        {/* ─── MONTO DISPLAY ──────────────────────────────────────── */}
        {paso !== 'esperando' && paso !== 'completado' && (
          <div className="px-5 py-4 text-center" style={{ borderBottom: `1px solid ${G06}` }}>
            <p className="text-[10px] uppercase tracking-widest text-gray-500 font-bold mb-1">Monto a pagar</p>
            <p className="text-3xl font-black text-white tabular-nums font-mono">
              S/ {monto.toFixed(2)}
            </p>
          </div>
        )}

        {/* ─── PASO 1: MÉTODO ─────────────────────────────────────── */}
        <AnimatePresence mode="wait">
          {paso === 'metodo' && (
            <motion.div
              key="metodo"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="p-5 space-y-3"
            >
              <p className="text-xs text-gray-400 text-center font-bold uppercase tracking-wider mb-4">
                Seleccione el método de pago
              </p>

              {/* Efectivo */}
              <button
                onClick={() => { setMetodoSeleccionado('Efectivo'); setPaso('efectivo'); }}
                className="w-full p-4 rounded-xl flex items-center gap-4 transition-all hover:scale-[1.02] group"
                style={{ background: G06, border: `1px solid ${G15}` }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(16,185,129,0.5)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = G15; }}
              >
                <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.25)' }}>
                  <Banknote className="w-6 h-6 text-emerald-400" />
                </div>
                <div className="text-left">
                  <p className="text-white font-bold text-sm">Efectivo</p>
                  <p className="text-[10px] text-gray-500">Pago en efectivo con confirmación inmediata</p>
                </div>
              </button>

              {/* Digital */}
              <button
                onClick={() => { setPaso('digital-sub'); }}
                className="w-full p-4 rounded-xl flex items-center gap-4 transition-all hover:scale-[1.02] group"
                style={{ background: G06, border: `1px solid ${G15}` }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(139,92,246,0.5)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = G15; }}
              >
                <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: 'rgba(139,92,246,0.12)', border: '1px solid rgba(139,92,246,0.25)' }}>
                  <Smartphone className="w-6 h-6 text-violet-400" />
                </div>
                <div className="text-left">
                  <p className="text-white font-bold text-sm">Digital</p>
                  <p className="text-[10px] text-gray-500">Yape, Plin, BCP, Interbank, BBVA</p>
                </div>
              </button>
            </motion.div>
          )}

          {/* ─── PASO 2a: EFECTIVO ────────────────────────────────── */}
          {paso === 'efectivo' && (
            <motion.div
              key="efectivo"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="p-5 space-y-4"
            >
              <div className="flex items-center justify-center gap-2 mb-2">
                <Banknote className="w-5 h-5 text-emerald-400" />
                <span className="text-sm font-bold text-emerald-400 uppercase tracking-wider">Pago en Efectivo</span>
              </div>

              {/* Observaciones */}
              <div>
                <label className="text-[10px] uppercase tracking-widest text-gray-500 font-bold mb-2 block">
                  Observaciones (opcional)
                </label>
                <textarea
                  value={observaciones}
                  onChange={e => setObservaciones(e.target.value)}
                  placeholder="Comentarios adicionales sobre el pago..."
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder-gray-600 outline-none resize-none transition-all"
                  style={{ background: G06, border: `1px solid ${G15}` }}
                  onFocus={e => (e.target.style.borderColor = 'rgba(16,185,129,0.5)')}
                  onBlur={e => (e.target.style.borderColor = G15)}
                />
              </div>

              {/* Confirmar */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setPaso('preconfirm')}
                className="w-full py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 text-black transition-all"
                style={{
                  background: 'linear-gradient(135deg, #10b981, #059669)',
                  boxShadow: '0 4px 20px rgba(16,185,129,0.30)',
                }}
              >
                <CheckCircle className="w-4 h-4" />
                Confirmar Pago — S/ {monto.toFixed(2)}
              </motion.button>
            </motion.div>
          )}

          {/* ─── PASO 2b: DIGITAL SUB-METHODS ────────────────────── */}
          {paso === 'digital-sub' && (
            <motion.div
              key="digital-sub"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="p-5 space-y-3"
            >
              <p className="text-xs text-gray-400 text-center font-bold uppercase tracking-wider mb-3">
                Seleccione la plataforma
              </p>

              <div className="grid grid-cols-2 gap-2.5">
                {DIGITAL_METHODS.map(m => (
                  <button
                    key={m.id}
                    onClick={() => { setMetodoSeleccionado(m.id); setPaso('digital-detalle'); }}
                    className="p-3.5 rounded-xl flex flex-col items-center gap-2 transition-all hover:scale-[1.03]"
                    style={{
                      background: G06,
                      border: `2px solid ${G15}`,
                    }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = m.color + '80'; e.currentTarget.style.background = m.color + '15'; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = G15; e.currentTarget.style.background = G06; }}
                  >
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                      style={{ background: m.color + '20', border: `1px solid ${m.color}40` }}>
                      {m.tipo === 'wallet'
                        ? <Smartphone className="w-5 h-5" style={{ color: m.color }} />
                        : <CreditCard className="w-5 h-5" style={{ color: m.color }} />}
                    </div>
                    <span className="text-xs font-black tracking-wider" style={{ color: m.color }}>
                      {m.label}
                    </span>
                    <span className="text-[9px] text-gray-600">
                      {m.tipo === 'wallet' ? 'Billetera digital' : 'Transferencia'}
                    </span>
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {/* ─── PASO 3: DIGITAL DETAIL ──────────────────────────── */}
          {paso === 'digital-detalle' && metodoDigitalInfo && (
            <motion.div
              key="digital-detalle"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="p-5 space-y-4"
            >
              <div className="flex items-center justify-center gap-2 mb-1">
                {metodoDigitalInfo.tipo === 'wallet'
                  ? <Smartphone className="w-5 h-5" style={{ color: metodoDigitalInfo.color }} />
                  : <CreditCard className="w-5 h-5" style={{ color: metodoDigitalInfo.color }} />}
                <span className="text-sm font-bold uppercase tracking-wider" style={{ color: metodoDigitalInfo.color }}>
                  {metodoDigitalInfo.label}
                </span>
              </div>

              {/* Action buttons: FOTO + QR/CCI */}
              <div className="grid grid-cols-2 gap-3">
                {/* Foto */}
                <button
                  onClick={handleCapturarFoto}
                  className="relative p-4 rounded-xl flex flex-col items-center gap-2 transition-all hover:scale-[1.02] overflow-hidden"
                  style={{
                    background: fotoBase64 ? 'rgba(16,185,129,0.10)' : G06,
                    border: `2px solid ${fotoBase64 ? 'rgba(16,185,129,0.40)' : G15}`,
                  }}
                >
                  {fotoBase64 ? (
                    <>
                      <CheckCircle className="w-6 h-6 text-emerald-400" />
                      <span className="text-[10px] font-bold text-emerald-400 uppercase">Foto Lista</span>
                    </>
                  ) : (
                    <>
                      <Camera className="w-6 h-6 text-amber-400" />
                      <span className="text-[10px] font-bold text-amber-400 uppercase">Tomar Foto</span>
                    </>
                  )}
                  <span className="text-[9px] text-gray-500">Comprobante *</span>
                </button>

                {/* QR / CCI */}
                {esBanco ? (
                  <button
                    onClick={() => copiarCCI(metodoDigitalInfo.cuentaNumero || '')}
                    className="p-4 rounded-xl flex flex-col items-center gap-2 transition-all hover:scale-[1.02]"
                    style={{ background: G06, border: `2px solid ${G15}` }}
                  >
                    <Copy className="w-6 h-6" style={{ color: metodoDigitalInfo.color }} />
                    <span className="text-[10px] font-bold uppercase" style={{ color: metodoDigitalInfo.color }}>
                      Copiar {metodoDigitalInfo.cuentaLabel}
                    </span>
                    <span className="text-[9px] text-gray-500 font-mono break-all text-center leading-tight">
                      {metodoDigitalInfo.cuentaNumero}
                    </span>
                  </button>
                ) : (
                  <button
                    onClick={() => toast.info('Muestre este QR al cliente para que realice el pago')}
                    className="p-4 rounded-xl flex flex-col items-center gap-2 transition-all hover:scale-[1.02]"
                    style={{ background: G06, border: `2px solid ${G15}` }}
                  >
                    <QrCode className="w-6 h-6" style={{ color: metodoDigitalInfo.color }} />
                    <span className="text-[10px] font-bold uppercase" style={{ color: metodoDigitalInfo.color }}>
                      Mostrar QR
                    </span>
                    <span className="text-[9px] text-gray-500">Código de pago</span>
                  </button>
                )}
              </div>

              {/* Photo preview */}
              {fotoBase64 && (
                <div className="relative rounded-xl overflow-hidden" style={{ border: `1px solid ${G15}` }}>
                  <img src={fotoBase64} alt="Comprobante" className="w-full max-h-40 object-cover" />
                  <div className="absolute top-2 right-2 flex gap-1.5">
                    <button onClick={() => {
                      const win = window.open();
                      if (win) { win.document.write(`<img src="${fotoBase64}" style="max-width:100%"/>`); }
                    }}
                      className="p-1.5 rounded-lg bg-black/60 hover:bg-black/80 transition-all">
                      <Eye className="w-3.5 h-3.5 text-white" />
                    </button>
                    <button onClick={() => setFotoBase64(null)}
                      className="p-1.5 rounded-lg bg-black/60 hover:bg-red-900/80 transition-all">
                      <Trash2 className="w-3.5 h-3.5 text-red-400" />
                    </button>
                  </div>
                </div>
              )}

              {/* Observaciones */}
              <div>
                <label className="text-[10px] uppercase tracking-widest text-gray-500 font-bold mb-2 block">
                  Observaciones (opcional)
                </label>
                <textarea
                  value={observaciones}
                  onChange={e => setObservaciones(e.target.value)}
                  placeholder="Nro. de operación, notas..."
                  rows={2}
                  className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder-gray-600 outline-none resize-none transition-all"
                  style={{ background: G06, border: `1px solid ${G15}` }}
                  onFocus={e => (e.target.style.borderColor = metodoDigitalInfo.color + '80')}
                  onBlur={e => (e.target.style.borderColor = G15)}
                />
              </div>

              {/* Aviso de foto obligatoria */}
              {!fotoBase64 && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg"
                  style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.20)' }}>
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                  <span className="text-[10px] text-amber-400">Debe adjuntar foto del comprobante para confirmar el pago</span>
                </div>
              )}

              {/* Confirmar */}
              <motion.button
                whileHover={puedeConfirmar ? { scale: 1.02 } : {}}
                whileTap={puedeConfirmar ? { scale: 0.98 } : {}}
                onClick={() => puedeConfirmar && setPaso('preconfirm')}
                disabled={!puedeConfirmar}
                className="w-full py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all"
                style={{
                  background: puedeConfirmar
                    ? `linear-gradient(135deg, ${metodoDigitalInfo.color}, ${metodoDigitalInfo.color}cc)`
                    : G08,
                  color: puedeConfirmar ? '#fff' : '#555',
                  boxShadow: puedeConfirmar ? `0 4px 20px ${metodoDigitalInfo.color}40` : 'none',
                  cursor: puedeConfirmar ? 'pointer' : 'not-allowed',
                  opacity: puedeConfirmar ? 1 : 0.6,
                }}
              >
                <CheckCircle className="w-4 h-4" />
                Confirmar Pago — S/ {monto.toFixed(2)}
              </motion.button>
            </motion.div>
          )}

          {/* ─── PRE-CONFIRMACIÓN ─────────────────────────────────── */}
          {paso === 'preconfirm' && (
            <motion.div
              key="preconfirm"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="p-6 space-y-5"
            >
              <div className="text-center">
                <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                  style={{ background: 'rgba(245,158,11,0.12)', border: '2px solid rgba(245,158,11,0.30)' }}>
                  <AlertTriangle className="w-8 h-8 text-amber-400" />
                </div>
                <h4 className="text-white font-bold text-base mb-2">¿Confirmar el pago?</h4>
                <p className="text-gray-400 text-xs">
                  Se registrará un pago de <strong className="text-white">S/ {monto.toFixed(2)}</strong> para{' '}
                  <strong className="text-white">{clienteNombre}</strong> mediante{' '}
                  <strong style={{ color: metodoSeleccionado === 'Efectivo' ? '#10b981' : metodoDigitalInfo?.color }}>
                    {metodoSeleccionado === 'Efectivo' ? 'Efectivo' : metodoDigitalInfo?.label}
                  </strong>.
                </p>
              </div>

              {/* Summary card */}
              <div className="rounded-xl p-4 space-y-2" style={{ background: G06, border: `1px solid ${G15}` }}>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">Cliente</span>
                  <span className="text-white font-bold">{clienteNombre}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">Método</span>
                  <span className="font-bold" style={{ color: metodoSeleccionado === 'Efectivo' ? '#10b981' : metodoDigitalInfo?.color }}>
                    {metodoSeleccionado === 'Efectivo' ? 'Efectivo' : metodoDigitalInfo?.label}
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">Monto</span>
                  <span className="text-white font-black font-mono tabular-nums">S/ {monto.toFixed(2)}</span>
                </div>
                {observaciones.trim() && (
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500">Observaciones</span>
                    <span className="text-gray-300 text-right max-w-[60%]">{observaciones.trim()}</span>
                  </div>
                )}
                {fotoBase64 && (
                  <div className="flex justify-between text-xs items-center">
                    <span className="text-gray-500">Comprobante</span>
                    <span className="text-emerald-400 flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Adjuntado</span>
                  </div>
                )}
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">Días cubiertos</span>
                  <span className="text-gray-300">{fechasCubiertas.length} día{fechasCubiertas.length > 1 ? 's' : ''}</span>
                </div>
              </div>

              {/* Buttons */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setPaso(metodoSeleccionado === 'Efectivo' ? 'efectivo' : 'digital-detalle')}
                  className="py-3 rounded-xl font-bold text-xs transition-all hover:bg-white/10"
                  style={{ background: G08, border: `1px solid ${G15}`, color: '#999' }}
                >
                  Cancelar
                </button>
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={confirmarPago}
                  className="py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 text-black transition-all"
                  style={{
                    background: 'linear-gradient(135deg, #10b981, #059669)',
                    boxShadow: '0 4px 16px rgba(16,185,129,0.30)',
                  }}
                >
                  <CheckCircle className="w-3.5 h-3.5" />
                  Sí, Confirmar
                </motion.button>
              </div>
            </motion.div>
          )}

          {/* ─── ESTADO DE ESPERA (Digital) ───────────────────────── */}
          {paso === 'esperando' && (
            <motion.div
              key="esperando"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-8 text-center space-y-5"
            >
              <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto"
                style={{ background: 'rgba(245,158,11,0.10)', border: '2px solid rgba(245,158,11,0.25)' }}>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 3, ease: 'linear' }}
                >
                  <Clock className="w-10 h-10 text-amber-400" />
                </motion.div>
              </div>

              <div>
                <h4 className="text-white font-bold text-lg mb-2">Pago en Espera</h4>
                <p className="text-gray-400 text-xs leading-relaxed">
                  Su pago de <strong className="text-white">S/ {monto.toFixed(2)}</strong> ha sido registrado
                  exitosamente. La secretaria validará la recepción del pago para completar el proceso.
                </p>
              </div>

              <div className="rounded-xl p-4 space-y-2" style={{ background: G06, border: `1px solid ${G15}` }}>
                <div className="flex items-center gap-2 text-amber-400">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-xs font-bold">Esperando validación en tiempo real...</span>
                </div>
                <p className="text-[10px] text-gray-500">
                  Esta pantalla se actualizará automáticamente cuando secretaría confirme la recepción.
                </p>
              </div>
            </motion.div>
          )}

          {/* ─── COMPLETADO (Efectivo inmediato + Digital confirmado) ─ */}
          {paso === 'completado' && (
            <motion.div
              key="completado"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-8 text-center space-y-5"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.1 }}
                className="w-20 h-20 rounded-full flex items-center justify-center mx-auto"
                style={{ background: 'rgba(16,185,129,0.12)', border: '2px solid rgba(16,185,129,0.30)' }}
              >
                <CheckCircle className="w-10 h-10 text-emerald-400" />
              </motion.div>

              <div>
                <h4 className="text-white font-bold text-lg mb-2">
                  {metodoSeleccionado === 'Efectivo' ? 'Dinero Recibido' : 'Pago Confirmado'}
                </h4>
                <p className="text-gray-400 text-xs leading-relaxed">
                  {metodoSeleccionado === 'Efectivo'
                    ? <>El pago en efectivo de <strong className="text-white">S/ {monto.toFixed(2)}</strong> ha sido registrado. El dinero será validado por secretaría al recibirlo en el local.</>
                    : <>El pago de <strong className="text-white">S/ {monto.toFixed(2)}</strong> ha sido <strong className="text-emerald-400">confirmado por secretaría</strong>. La transacción está completa.</>}
                </p>
              </div>

              <div className="rounded-xl p-4" style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.25)' }}>
                <div className="flex items-center justify-center gap-2 text-emerald-400">
                  <CheckCircle className="w-4 h-4" />
                  <span className="text-xs font-bold">
                    {metodoSeleccionado === 'Efectivo' ? 'Pago registrado correctamente' : 'Validación completada'}
                  </span>
                </div>
              </div>

              <button
                onClick={() => { resetState(); onClose(); }}
                className="w-full py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 text-black transition-all"
                style={{
                  background: 'linear-gradient(135deg, #10b981, #059669)',
                  boxShadow: '0 4px 16px rgba(16,185,129,0.30)',
                }}
              >
                <CheckCircle className="w-3.5 h-3.5" />
                Cerrar
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
