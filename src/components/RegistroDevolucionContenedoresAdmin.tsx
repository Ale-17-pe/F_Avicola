import { useMemo, useState } from 'react';
import { CheckCircle2, ClipboardCheck, Search, XCircle } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { useTheme, t } from '../contexts/ThemeContext';
import { toast } from 'sonner';

interface RegistroDevolucionContenedoresProps {
  readOnly?: boolean;
}

export function RegistroDevolucionContenedoresAdmin({ readOnly = false }: RegistroDevolucionContenedoresProps) {
  const { recojosContenedores, pedidosConfirmados, updateRecojoContenedor } = useApp();
  const { isDark } = useTheme();
  const c = t(isDark);

  const [filtroCliente, setFiltroCliente] = useState('');
  const [filtroZona, setFiltroZona] = useState('');

  const filas = useMemo(() => {
    return recojosContenedores
      .map((r) => {
        const pedido = pedidosConfirmados.find((p) => p.id === r.pedidoId);
        const jabasUtilizadas = pedido?.contenedoresDetalle || [];
        const totalJabas = jabasUtilizadas.reduce((s, d) => s + (d.cantidad || 0), 0);
        const estadoRevision = r.estadoRevision || 'Pendiente';

        return {
          recojo: r,
          pedido,
          cliente: r.cliente,
          tipo: pedido?.tipoAve || 'Sin tipo',
          presentacion: pedido?.presentacion || 'Sin pres.',
          cantidadPedido: pedido?.cantidad || 0,
          jabasUtilizadas,
          totalJabas,
          zona: r.zonaEntrega || pedido?.zonaEntrega || 'Sin zona',
          conductor: r.conductor || pedido?.conductor || 'Sin conductor',
          estadoRevision,
        };
      })
      .filter((f) => {
        const okCliente = !filtroCliente || f.cliente.toLowerCase().includes(filtroCliente.toLowerCase());
        const okZona = !filtroZona || f.zona.toLowerCase().includes(filtroZona.toLowerCase());
        return okCliente && okZona;
      })
      .sort((a, b) => new Date(b.recojo.fechaRecepcion).getTime() - new Date(a.recojo.fechaRecepcion).getTime());
  }, [recojosContenedores, pedidosConfirmados, filtroCliente, filtroZona]);

  const zonas = useMemo(() => {
    return Array.from(new Set(filas.map((f) => f.zona).filter(Boolean))).sort((a, b) => a.localeCompare(b));
  }, [filas]);

  const confirmarRecojo = (id: string) => {
    const fila = filas.find((f) => f.recojo.id === id);
    if (!fila) return;

    if (!window.confirm('Confirma aprobar este registro de devolución de contenedores?')) return;

    updateRecojoContenedor({
      ...fila.recojo,
      estadoRevision: 'Confirmado',
      fechaRevision: new Date().toISOString(),
      revisadoPor: 'Administrador',
      motivoRechazo: undefined,
      notificadoConductor: true,
    });

    toast.success('Registro confirmado correctamente');
  };

  const rechazarRecojo = (id: string) => {
    const fila = filas.find((f) => f.recojo.id === id);
    if (!fila) return;

    const motivo = window.prompt('Indique motivo de rechazo para notificar al conductor:')?.trim() || '';
    if (!motivo) {
      toast.error('Debe ingresar un motivo para rechazar');
      return;
    }

    if (!window.confirm('Confirma rechazar este registro?')) return;

    updateRecojoContenedor({
      ...fila.recojo,
      estadoRevision: 'Rechazado',
      fechaRevision: new Date().toISOString(),
      revisadoPor: 'Administrador',
      motivoRechazo: motivo,
      notificadoConductor: false,
    });

    toast.success('Registro rechazado y notificacion enviada al conductor');
  };

  const estadoBadge = (estado: string) => {
    if (estado === 'Confirmado') return { bg: 'rgba(34,197,94,0.15)', text: '#22c55e' };
    if (estado === 'Rechazado') return { bg: 'rgba(239,68,68,0.15)', text: '#ef4444' };
    return { bg: 'rgba(245,158,11,0.15)', text: '#f59e0b' };
  };

  const totalPendientes = useMemo(() => filas.filter((f) => f.estadoRevision === 'Pendiente').length, [filas]);
  const totalConfirmados = useMemo(() => filas.filter((f) => f.estadoRevision === 'Confirmado').length, [filas]);
  const totalRechazados = useMemo(() => filas.filter((f) => f.estadoRevision === 'Rechazado').length, [filas]);

  return (
    <div className="max-w-7xl mx-auto space-y-5 pb-10 px-4">
      <div className="rounded-2xl overflow-hidden" style={{ background: c.bgCard, border: `1px solid ${c.border}` }}>
        <div className="h-1.5 w-full" style={{ background: 'linear-gradient(90deg, #3b82f6, #22c55e, #f59e0b)' }} />
        <div className="p-4 sm:p-5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(59,130,246,0.15)' }}>
            <ClipboardCheck className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold" style={{ color: c.text }}>Registro de devolucion de contenedores</h1>
            <p className="text-xs sm:text-sm" style={{ color: c.textSecondary }}>
              {readOnly
                ? 'Consulta de estado de recojos registrados (solo lectura)'
                : 'Revision administrativa de recojos registrados por conductores'}
            </p>
          </div>
        </div>
          <span className="text-[11px] px-2.5 py-1 rounded-full font-bold" style={{ background: readOnly ? 'rgba(168,85,247,0.14)' : 'rgba(34,197,94,0.14)', color: readOnly ? '#a78bfa' : '#22c55e', border: readOnly ? '1px solid rgba(168,85,247,0.35)' : '1px solid rgba(34,197,94,0.35)' }}>
            {readOnly ? 'SOLO LECTURA' : 'GESTION ADMIN'}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="rounded-xl p-4" style={{ background: c.bgCard, border: `1px solid ${c.border}` }}>
          <p className="text-[10px] uppercase tracking-wider" style={{ color: c.textMuted }}>Registros</p>
          <p className="text-2xl font-bold mt-1" style={{ color: c.text }}>{filas.length}</p>
        </div>
        <div className="rounded-xl p-4" style={{ background: c.bgCard, border: `1px solid ${c.border}` }}>
          <p className="text-[10px] uppercase tracking-wider" style={{ color: c.textMuted }}>Pendientes</p>
          <p className="text-2xl font-bold mt-1" style={{ color: '#f59e0b' }}>{totalPendientes}</p>
        </div>
        <div className="rounded-xl p-4" style={{ background: c.bgCard, border: `1px solid ${c.border}` }}>
          <p className="text-[10px] uppercase tracking-wider" style={{ color: c.textMuted }}>Confirmados</p>
          <p className="text-2xl font-bold mt-1" style={{ color: '#22c55e' }}>{totalConfirmados}</p>
        </div>
        <div className="rounded-xl p-4" style={{ background: c.bgCard, border: `1px solid ${c.border}` }}>
          <p className="text-[10px] uppercase tracking-wider" style={{ color: c.textMuted }}>Rechazados</p>
          <p className="text-2xl font-bold mt-1" style={{ color: '#ef4444' }}>{totalRechazados}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="rounded-xl p-3 space-y-1" style={{ background: c.bgCard, border: `1px solid ${c.border}` }}>
          <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: c.textMuted }}>Filtrar por cliente</p>
          <div className="flex items-center gap-2">
            <Search className="w-4 h-4" style={{ color: c.textMuted }} />
            <input
              value={filtroCliente}
              onChange={(e) => setFiltroCliente(e.target.value)}
              placeholder="Nombre del cliente"
              className="w-full bg-transparent text-sm focus:outline-none"
              style={{ color: c.text }}
            />
          </div>
        </div>

        <div className="rounded-xl p-3 space-y-1" style={{ background: c.bgCard, border: `1px solid ${c.border}` }}>
          <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: c.textMuted }}>Filtrar por zona</p>
          <select
            value={filtroZona}
            onChange={(e) => setFiltroZona(e.target.value)}
            className="w-full bg-transparent text-sm focus:outline-none"
            style={{ color: c.text }}
          >
            <option value="">Todas las zonas</option>
            {zonas.map((z) => (
              <option key={z} value={z}>{z}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="rounded-2xl overflow-hidden" style={{ background: c.bgCard, border: `1px solid ${c.border}` }}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm" style={{ minWidth: '1200px' }}>
            <thead style={{ background: c.bgCardAlt, borderBottom: `1px solid ${c.borderSubtle}` }}>
              <tr>
                <th className="px-3 py-2 text-left text-[10px] uppercase tracking-widest" style={{ color: c.textMuted, width: '16%' }}>Cliente</th>
                <th className="px-3 py-2 text-left text-[10px] uppercase tracking-widest" style={{ color: c.textMuted, width: '12%' }}>Tipo</th>
                <th className="px-3 py-2 text-left text-[10px] uppercase tracking-widest" style={{ color: c.textMuted, width: '10%' }}>Pres.</th>
                <th className="px-3 py-2 text-right text-[10px] uppercase tracking-widest" style={{ color: c.textMuted, width: '8%' }}>Cant. pedido</th>
                <th className="px-3 py-2 text-left text-[10px] uppercase tracking-widest" style={{ color: c.textMuted, width: '18%' }}>Jabas utilizadas</th>
                <th className="px-3 py-2 text-right text-[10px] uppercase tracking-widest" style={{ color: c.textMuted, width: '8%' }}>Cant. jabas</th>
                <th className="px-3 py-2 text-left text-[10px] uppercase tracking-widest" style={{ color: c.textMuted, width: '10%' }}>Zona</th>
                <th className="px-3 py-2 text-left text-[10px] uppercase tracking-widest" style={{ color: c.textMuted, width: '12%' }}>Conductor</th>
                <th className="px-3 py-2 text-left text-[10px] uppercase tracking-widest" style={{ color: c.textMuted, width: '12%' }}>Estado</th>
                {!readOnly && <th className="px-3 py-2 text-left text-[10px] uppercase tracking-widest" style={{ color: c.textMuted, width: '14%' }}>Acciones</th>}
              </tr>
            </thead>
            <tbody>
              {filas.length === 0 && (
                <tr>
                  <td colSpan={readOnly ? 9 : 10} className="px-3 py-8 text-center" style={{ color: c.textMuted }}>
                    No hay registros para mostrar
                  </td>
                </tr>
              )}

              {filas.map((f) => {
                const badge = estadoBadge(f.estadoRevision);
                const esPendiente = f.estadoRevision === 'Pendiente';
                const detalleTipos = f.jabasUtilizadas.length > 0
                  ? f.jabasUtilizadas.map((j) => j.tipo).join(', ')
                  : 'Sin registro';
                return (
                  <tr key={f.recojo.id} style={{ borderTop: `1px solid ${c.borderSubtle}`, background: filas.indexOf(f) % 2 === 0 ? 'transparent' : c.bgCardAlt }}>
                    <td className="px-3 py-2.5" style={{ color: c.text }}>
                      <p className="font-semibold text-sm">{f.cliente}</p>
                      <p className="text-[11px]" style={{ color: c.textMuted }}>#{f.recojo.id.slice(-6)}</p>
                    </td>
                    <td className="px-3 py-2.5" style={{ color: c.text }}>{f.tipo}</td>
                    <td className="px-3 py-2.5" style={{ color: c.text }}>{f.presentacion}</td>
                    <td className="px-3 py-2.5 text-right" style={{ color: c.text }}>
                      <span className="font-bold tabular-nums">{f.cantidadPedido}</span>
                    </td>
                    <td className="px-3 py-2.5" style={{ color: c.text }}>{detalleTipos}</td>
                    <td className="px-3 py-2.5 text-right" style={{ color: c.text }}>
                      <span className="font-bold tabular-nums" style={{ color: '#f59e0b' }}>{f.totalJabas}</span>
                    </td>
                    <td className="px-3 py-2.5" style={{ color: c.text }}>{f.zona}</td>
                    <td className="px-3 py-2.5" style={{ color: c.text }}>{f.conductor}</td>
                    <td className="px-3 py-2">
                      <span className="px-2 py-1 rounded-full text-xs font-bold" style={{ background: badge.bg, color: badge.text }}>
                        {f.estadoRevision}{f.recojo.esParcial ? ' · Parcial' : ' · Total'}
                      </span>
                    </td>
                    {!readOnly && (
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => confirmarRecojo(f.recojo.id)}
                            disabled={!esPendiente}
                            className="px-2.5 py-1.5 rounded-lg text-xs font-bold disabled:opacity-40"
                            style={{ background: 'rgba(34,197,94,0.15)', color: '#22c55e' }}
                          >
                            <span className="inline-flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> Confirmar</span>
                          </button>
                          <button
                            onClick={() => rechazarRecojo(f.recojo.id)}
                            disabled={!esPendiente}
                            className="px-2.5 py-1.5 rounded-lg text-xs font-bold disabled:opacity-40"
                            style={{ background: 'rgba(239,68,68,0.15)', color: '#ef4444' }}
                          >
                            <span className="inline-flex items-center gap-1"><XCircle className="w-3.5 h-3.5" /> Rechazar</span>
                          </button>
                        </div>
                        {f.recojo.motivoRechazo && (
                          <p className="text-[11px] mt-1" style={{ color: '#f87171' }}>Motivo: {f.recojo.motivoRechazo}</p>
                        )}
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
