import { useMemo, useRef, useState } from 'react';
import { CheckCircle, ChevronLeft, ChevronRight, ClipboardList, FileText, Package, RotateCcw, Scale, Store, Users } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { useTheme, t } from '../contexts/ThemeContext';
import { toast } from 'sonner';

export function PesajeProveedores() {
  const { pedidosProveedor, updatePedidoProveedor } = useApp();
  const { isDark } = useTheme();
  const c = t(isDark);

  const balanzaInputRef = useRef<HTMLInputElement>(null);

  const [modoManual] = useState(true);
  const [pesoManualInput, setPesoManualInput] = useState('');
  const [jabasEnEstaPesada, setJabasEnEstaPesada] = useState('');
  const [currentIdx, setCurrentIdx] = useState(0);

  const pendientes = useMemo(
    () => pedidosProveedor
      .filter(p => p.estado === 'Pendiente Pesaje' || p.estado === 'En Pesaje')
      .sort((a, b) => a.prioridad - b.prioridad),
    [pedidosProveedor],
  );

  const historialPesados = useMemo(
    () => pedidosProveedor
      .filter(p => p.estado === 'Pesado')
      .sort((a, b) => (b.fechaPesaje || b.fecha).localeCompare(a.fechaPesaje || a.fecha)),
    [pedidosProveedor],
  );

  const pedidoActivo = pendientes[currentIdx] || null;
  const pesadas = pedidoActivo?.pesadas || [];
  const pesoActual = parseFloat(pesoManualInput) || 0;
  const esVivo = !!pedidoActivo?.presentacion.toLowerCase().includes('vivo');
  const totalJabas = pedidoActivo?.cantidadJabas || 0;
  const jabasPesadas = pesadas.reduce((s, p) => s + (p.jabas || 0), 0);
  const jabasRestantes = Math.max(0, totalJabas - jabasPesadas);
  const jabasInput = parseInt(jabasEnEstaPesada, 10) || 0;

  const statusColor = (estado: string) => {
    if (estado === 'Pesado') return '#22c55e';
    if (estado === 'En Pesaje') return '#f59e0b';
    return '#60a5fa';
  };

  const seleccionarPedido = (index: number) => {
    const pedido = pendientes[index];
    if (!pedido) return;

    if (pedido.estado === 'Pendiente Pesaje') {
      updatePedidoProveedor(pedido.id, { ...pedido, estado: 'En Pesaje' });
    }

    setCurrentIdx(index);
    setPesoManualInput('');
    setJabasEnEstaPesada('');
    setTimeout(() => balanzaInputRef.current?.focus(), 50);
  };

  const sumarPesada = () => {
    if (!pedidoActivo) return;
    if (pesoActual <= 0) {
      toast.error('El peso debe ser mayor a 0');
      return;
    }

    if (esVivo && totalJabas > 0) {
      if (jabasInput <= 0) {
        toast.error('Ingrese cuantas jabas van en esta pesada');
        return;
      }
      if (jabasInput > jabasRestantes) {
        toast.error(`Solo quedan ${jabasRestantes} jabas por pesar`);
        return;
      }
    }

    updatePedidoProveedor(pedidoActivo.id, {
      ...pedidoActivo,
      estado: 'En Pesaje',
      pesadas: [
        ...pesadas,
        {
          numero: pesadas.length + 1,
          peso: pesoActual,
          ...(esVivo && totalJabas > 0 ? { jabas: jabasInput } : {}),
        },
      ],
    });

    setPesoManualInput('');
    setJabasEnEstaPesada('');
    toast.success('Pesada registrada');
    setTimeout(() => balanzaInputRef.current?.focus(), 50);
  };

  const quitarUltimaPesada = () => {
    if (!pedidoActivo || pesadas.length === 0) return;
    updatePedidoProveedor(pedidoActivo.id, {
      ...pedidoActivo,
      pesadas: pesadas.slice(0, -1),
    });
    toast.info('Ultima pesada eliminada');
  };

  const confirmarPedido = () => {
    if (!pedidoActivo) return;
    if (pesadas.length === 0) {
      toast.error('Registre al menos una pesada');
      return;
    }
    if (esVivo && totalJabas > 0 && jabasPesadas !== totalJabas) {
      toast.error(`Debe completar todas las jabas (${jabasPesadas}/${totalJabas})`);
      return;
    }

    const ahora = new Date();
    const pesoBrutoTotal = pesadas.reduce((s, p) => s + p.peso, 0);

    updatePedidoProveedor(pedidoActivo.id, {
      ...pedidoActivo,
      estado: 'Pesado',
      pesoBrutoTotal,
      pesoNetoTotal: pesoBrutoTotal,
      fechaPesaje: ahora.toISOString().split('T')[0],
      horaPesaje: ahora.toTimeString().slice(0, 5),
    });

    toast.success('Pedido proveedor confirmado sin ticket');

    const nuevosPendientes = pedidosProveedor
      .filter(p => p.estado === 'Pendiente Pesaje' || p.estado === 'En Pesaje')
      .sort((a, b) => a.prioridad - b.prioridad)
      .filter(p => p.id !== pedidoActivo.id);

    if (nuevosPendientes.length === 0) {
      setCurrentIdx(0);
    } else if (currentIdx >= nuevosPendientes.length) {
      setCurrentIdx(nuevosPendientes.length - 1);
    }

    setPesoManualInput('');
    setJabasEnEstaPesada('');
  };

  const totalBruto = pesadas.reduce((s, p) => s + p.peso, 0);

  return (
    <div className="flex flex-col gap-3" style={{ minHeight: 'calc(100vh - 140px)' }}>
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg" style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.15)' }}>
            <Package className="w-4 h-4 text-amber-500" />
            <span className="text-sm font-bold text-amber-400">{pendientes.length}</span>
            <span className="text-xs" style={{ color: c.textMuted }}>en cola</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg" style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.15)' }}>
            <CheckCircle className="w-4 h-4 text-green-500" />
            <span className="text-sm font-bold text-green-400">{historialPesados.length}</span>
            <span className="text-xs" style={{ color: c.textMuted }}>pesados</span>
          </div>
        </div>

        {pedidoActivo && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentIdx(prev => Math.max(0, prev - 1))}
              disabled={currentIdx <= 0}
              className="p-2 rounded-lg disabled:opacity-30"
              style={{ background: c.g10, border: `1px solid ${c.border}` }}
            >
              <ChevronLeft className="w-4 h-4" style={{ color: c.textSecondary }} />
            </button>
            <span className="text-xs font-bold px-2 py-1 rounded" style={{ background: c.bgCardAlt, border: `1px solid ${c.border}`, color: c.text }}>
              {currentIdx + 1}/{pendientes.length || 1}
            </span>
            <button
              onClick={() => setCurrentIdx(prev => Math.min(Math.max(0, pendientes.length - 1), prev + 1))}
              disabled={currentIdx >= pendientes.length - 1}
              className="p-2 rounded-lg disabled:opacity-30"
              style={{ background: c.g10, border: `1px solid ${c.border}` }}
            >
              <ChevronRight className="w-4 h-4" style={{ color: c.textSecondary }} />
            </button>
          </div>
        )}
      </div>

      <div className="rounded-2xl relative overflow-hidden" style={{ background: isDark ? 'linear-gradient(160deg, #0a0a0a, #141414)' : c.bgCard, border: '2px solid ' + c.borderSubtle }}>
        <div className="flex items-center justify-between px-5 py-2" style={{ borderBottom: '1px solid ' + c.g04 }}>
          <span className="text-[11px] font-black uppercase tracking-[0.2em]" style={{ color: c.textMuted }}>BALANZA PROVEEDOR</span>
          {pedidoActivo ? (
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: 'rgba(34,197,94,0.1)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.2)' }}>
              {pedidoActivo.proveedorNombre}
            </span>
          ) : (
            <span className="text-[10px]" style={{ color: c.textMuted }}>Seleccione un pedido para pesar</span>
          )}
        </div>

        <div className="px-5 pt-2 pb-4">
          {modoManual && (
            <div className="relative w-full">
              <Scale className="absolute left-5 top-1/2 -translate-y-1/2 w-8 h-8 text-blue-400/30" />
              <input
                ref={balanzaInputRef}
                type="number"
                step="0.01"
                min="0"
                value={pesoManualInput}
                onChange={(e) => setPesoManualInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && pesoActual > 0) sumarPesada(); }}
                placeholder="0.00"
                disabled={!pedidoActivo}
                className="w-full min-h-[260px] pl-16 pr-16 py-12 rounded-2xl text-[8rem] leading-none font-black font-mono text-center placeholder-gray-700 focus:ring-2 focus:ring-blue-500/30 transition-all disabled:opacity-40"
                style={{ background: c.bgCardAlt, border: '2px solid rgba(59,130,246,0.28)', color: c.text }}
              />
              <span className="absolute right-6 top-1/2 -translate-y-1/2 text-xl font-bold text-blue-400/30">Kg</span>
            </div>
          )}

          {pedidoActivo && esVivo && totalJabas > 0 && (
            <div className="max-w-md mx-auto mt-3 flex items-center gap-3 p-2.5 rounded-xl" style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.2)' }}>
              <div className="flex-1">
                <label className="text-[10px] text-amber-400 font-bold uppercase tracking-wider">Jabas en esta pesada</label>
                <input
                  type="number"
                  min="1"
                  max={jabasRestantes}
                  value={jabasEnEstaPesada}
                  onChange={(e) => setJabasEnEstaPesada(e.target.value)}
                  className="w-full mt-1 px-3 py-1.5 rounded-lg text-lg font-black font-mono text-center"
                  style={{ color: c.text, background: c.bgCardAlt, border: '1px solid rgba(245,158,11,0.3)' }}
                />
              </div>
              <div className="text-right flex-shrink-0">
                <div className="text-[9px]" style={{ color: c.textMuted }}>quedan</div>
                <div className="text-lg font-black text-amber-400 tabular-nums">{jabasRestantes}</div>
              </div>
            </div>
          )}

          <button
            onClick={sumarPesada}
            disabled={!pedidoActivo || pesoActual <= 0}
            className="w-full mt-4 h-16 rounded-xl transition-all hover:scale-[1.01] disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center"
            style={{
              background: 'linear-gradient(135deg, #0d4a24, #22c55e)',
              color: '#ffffff',
              border: '2px solid rgba(34,197,94,0.55)',
              boxShadow: '0 10px 24px rgba(34,197,94,0.28)',
            }}
          >
            <span className="text-2xl font-black tracking-wider">PESAR</span>
          </button>
        </div>
      </div>

      <div className="rounded-2xl overflow-hidden flex-1 flex min-h-0" style={{ background: c.g02, border: '1px solid ' + c.borderSubtle, minHeight: '280px' }}>
        <div className="flex-shrink-0 overflow-y-auto" style={{ width: '260px', borderRight: '1px solid ' + c.g04 }}>
          <div className="px-3 py-2 sticky top-0" style={{ background: c.g02, borderBottom: '1px solid ' + c.g04 }}>
            <span className="text-[10px] font-black uppercase tracking-wider" style={{ color: c.textMuted }}>Proveedores</span>
          </div>

          {pendientes.length === 0 ? (
            <div className="px-3 py-6 text-center">
              <Users className="w-6 h-6 mx-auto mb-1" style={{ color: c.g08 }} />
              <span className="text-[10px]" style={{ color: c.textMuted }}>Sin pedidos pendientes</span>
            </div>
          ) : (
            pendientes.map((p, idx) => (
              <button
                key={p.id}
                onClick={() => seleccionarPedido(idx)}
                className="w-full text-left px-3 py-3 transition-colors hover:bg-white/5"
                style={{
                  borderBottom: '1px solid ' + c.g04,
                  background: idx === currentIdx ? 'rgba(34,197,94,0.08)' : 'transparent',
                }}
              >
                <div className="text-xs font-bold truncate" style={{ color: idx === currentIdx ? '#22c55e' : c.text }}>
                  {p.proveedorNombre}
                </div>
                <div className="text-[10px] mt-0.5" style={{ color: c.textMuted }}>
                  {p.tipoAve} · {p.presentacion}
                </div>
                <div className="text-[10px] mt-0.5" style={{ color: statusColor(p.estado) }}>
                  {p.estado}
                </div>
              </button>
            ))
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {!pedidoActivo ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <Store className="w-10 h-10 mx-auto mb-2" style={{ color: c.g08 }} />
                <p className="text-sm font-medium" style={{ color: c.textMuted }}>Seleccione un pedido de proveedor para iniciar</p>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold" style={{ color: c.text }}>{pedidoActivo.proveedorNombre}</h3>
                  <p className="text-xs" style={{ color: c.textSecondary }}>
                    {pedidoActivo.tipoAve}{pedidoActivo.variedad ? ` - ${pedidoActivo.variedad}` : ''} · {pedidoActivo.presentacion} · {pedidoActivo.cantidad} aves
                  </p>
                </div>
                <span className="text-[10px] font-bold px-2 py-1 rounded-full" style={{ background: 'rgba(59,130,246,0.16)', color: '#60a5fa' }}>
                  SIN TICKET / SIN ZONA / SIN CONDUCTOR
                </span>
              </div>

              <div className="space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: c.textMuted }}>Pesadas del pedido</span>
                {pesadas.length === 0 && <p className="text-xs" style={{ color: c.textMuted }}>Aun no hay pesadas registradas.</p>}
                {pesadas.map(p => (
                  <div key={p.numero} className="flex items-center justify-between px-2 py-1.5 rounded-lg text-[11px] font-mono" style={{ background: c.bgCardAlt, border: `1px solid ${c.border}` }}>
                    <span style={{ color: '#4ade80' }}>P-{p.numero}{p.jabas ? ` (${p.jabas}j)` : ''}</span>
                    <span style={{ color: c.text }}>{p.peso.toFixed(2)} kg</span>
                  </div>
                ))}
              </div>

              <div className="rounded-xl p-3" style={{ background: 'rgba(34,197,94,0.04)', border: '1px solid rgba(34,197,94,0.15)' }}>
                <div className="text-[10px] font-bold uppercase" style={{ color: c.textMuted }}>Peso bruto total</div>
                <div className="text-2xl font-black font-mono tabular-nums" style={{ color: '#22c55e' }}>{totalBruto.toFixed(2)} kg</div>
                {esVivo && totalJabas > 0 && (
                  <div className="text-xs mt-1" style={{ color: c.textSecondary }}>
                    Jabas: {jabasPesadas}/{totalJabas}
                  </div>
                )}
              </div>

              <div className="flex flex-wrap gap-2">
                <button onClick={quitarUltimaPesada} disabled={pesadas.length === 0} className="px-4 py-2 rounded-xl font-bold text-sm disabled:opacity-40" style={{ background: c.g10, color: c.textSecondary, border: `1px solid ${c.border}` }}>
                  <RotateCcw className="w-4 h-4 inline mr-1" /> Deshacer
                </button>
                <button onClick={confirmarPedido} className="px-4 py-2 rounded-xl font-bold text-sm text-white" style={{ background: 'linear-gradient(135deg, #0a4d2a, #22c55e)' }}>
                  <CheckCircle className="w-4 h-4 inline mr-1" /> Confirmar Pedido
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="rounded-2xl overflow-hidden" style={{ background: c.bgCard, border: `1px solid ${c.border}` }}>
        <div className="p-4 border-b" style={{ borderColor: c.borderGold }}>
          <h3 className="font-bold" style={{ color: c.text }}><FileText className="w-4 h-4 inline mr-1" /> Historial de Proveedores Pesados</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: c.bgTableHeader }}>
                <th className="px-4 py-3 text-left" style={{ color: c.textSecondary }}><Store className="w-3.5 h-3.5 inline mr-1" />Proveedor</th>
                <th className="px-4 py-3 text-left" style={{ color: c.textSecondary }}>Detalle</th>
                <th className="px-4 py-3 text-left" style={{ color: c.textSecondary }}><Scale className="w-3.5 h-3.5 inline mr-1" />Bruto</th>
                <th className="px-4 py-3 text-left" style={{ color: c.textSecondary }}><ClipboardList className="w-3.5 h-3.5 inline mr-1" />Fecha</th>
              </tr>
            </thead>
            <tbody>
              {historialPesados.map(p => (
                <tr key={p.id} className="border-t" style={{ borderColor: c.borderSubtle }}>
                  <td className="px-4 py-3" style={{ color: c.text }}>{p.proveedorNombre}</td>
                  <td className="px-4 py-3" style={{ color: c.textSecondary }}>{p.tipoAve} · {p.presentacion}</td>
                  <td className="px-4 py-3 font-bold" style={{ color: c.text }}>{(p.pesoBrutoTotal || 0).toFixed(2)} kg</td>
                  <td className="px-4 py-3" style={{ color: c.textMuted }}>{p.fechaPesaje || '-'} {p.horaPesaje || ''}</td>
                </tr>
              ))}
              {historialPesados.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center" style={{ color: c.textMuted }}>Aun no hay pedidos proveedor pesados.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
