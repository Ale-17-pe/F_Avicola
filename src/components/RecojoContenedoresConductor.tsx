import { useEffect, useMemo, useState } from 'react';
import { Box, CheckCircle2, ClipboardList, Eye, Package, Search, User } from 'lucide-react';
import { useApp, PedidoConfirmado, RecojoContenedor } from '../contexts/AppContext';
import { useAuth } from '../contexts/AuthContext';
import { useTheme, t } from '../contexts/ThemeContext';
import { toast } from 'sonner';

type DetalleMap = Record<string, number>;

interface DetallePendiente {
  tipo: string;
  cantidad: number;
  pesoUnit: number;
}

function totalContenedores(detalle: { tipo: string; cantidad: number }[] = []) {
  return detalle.reduce((s, i) => s + (i.cantidad || 0), 0);
}

function sumarPorTipo(
  detalle: { tipo: string; cantidad: number; pesoUnit?: number }[] = [],
  base?: DetalleMap,
): DetalleMap {
  const out: DetalleMap = base ? { ...base } : {};
  detalle.forEach((d) => {
    const key = (d.tipo || '').trim();
    if (!key) return;
    out[key] = (out[key] || 0) + (d.cantidad || 0);
  });
  return out;
}

export function RecojoContenedoresConductor() {
  const { pedidosConfirmados, recojosContenedores, addRecojoContenedor } = useApp();
  const { user } = useAuth();
  const { isDark } = useTheme();
  const c = t(isDark);

  const [pedidoSeleccionado, setPedidoSeleccionado] = useState<PedidoConfirmado | null>(null);
  const [filtroZona, setFiltroZona] = useState('');
  const [filtroCliente, setFiltroCliente] = useState('');
  const [cantidadesRecojo, setCantidadesRecojo] = useState<DetalleMap>({});

  const conductorIdActual = user?.conductorRegistradoId || user?.id || null;
  const conductorNombreActual = `${user?.nombre || ''} ${user?.apellido || ''}`.trim();

  const pedidosEntregadosConContenedores = useMemo(() => {
    return pedidosConfirmados
      .filter((p) => p.ticketEmitido)
      .filter((p) => p.estado === 'Entregado')
      .filter((p) => (p.contenedoresDetalle || []).length > 0);
  }, [pedidosConfirmados]);

  const recojosPorPedido = useMemo(() => {
    const map = new Map<string, RecojoContenedor[]>();
    recojosContenedores.forEach((r) => {
      const list = map.get(r.pedidoId) || [];
      list.push(r);
      map.set(r.pedidoId, list);
    });
    return map;
  }, [recojosContenedores]);

  const zonasDisponibles = useMemo(() => {
    return Array.from(
      new Set(pedidosEntregadosConContenedores.map((p) => p.zonaEntrega || 'Sin zona')),
    ).sort((a, b) => a.localeCompare(b));
  }, [pedidosEntregadosConContenedores]);

  const getPendienteDetalle = (pedido: PedidoConfirmado): DetallePendiente[] => {
    const base = pedido.contenedoresDetalle || [];
    const recojos = recojosPorPedido.get(pedido.id) || [];
    const validos = recojos.filter((r) => (r.estadoRevision || 'Pendiente') !== 'Rechazado');

    const recogidoPorTipo = validos.reduce<DetalleMap>((acc, r) => {
      return sumarPorTipo(r.contenedores || [], acc);
    }, {});

    return base
      .map((b) => {
        const tipo = (b.tipo || '').trim();
        const recogido = recogidoPorTipo[tipo] || 0;
        const pendiente = Math.max(0, (b.cantidad || 0) - recogido);
        return {
          tipo,
          cantidad: pendiente,
          pesoUnit: b.pesoUnit || 0,
        };
      })
      .filter((d) => d.cantidad > 0);
  };

  const pedidosPendientes = useMemo(() => {
    return pedidosEntregadosConContenedores
      .map((p) => ({ pedido: p, pendiente: getPendienteDetalle(p) }))
      .filter((x) => totalContenedores(x.pendiente) > 0)
      .filter((x) => {
        const okZona = !filtroZona || (x.pedido.zonaEntrega || 'Sin zona') === filtroZona;
        const okCliente = !filtroCliente || x.pedido.cliente.toLowerCase().includes(filtroCliente.toLowerCase());
        return okZona && okCliente;
      });
  }, [pedidosEntregadosConContenedores, recojosPorPedido, filtroZona, filtroCliente]);

  const historialRecojos = useMemo(() => {
    return [...recojosContenedores].sort(
      (a, b) => new Date(b.fechaRecepcion).getTime() - new Date(a.fechaRecepcion).getTime(),
    );
  }, [recojosContenedores]);

  useEffect(() => {
    if (!pedidoSeleccionado) {
      setCantidadesRecojo({});
      return;
    }
    const pendiente = getPendienteDetalle(pedidoSeleccionado);
    const inicial: DetalleMap = {};
    pendiente.forEach((d) => {
      inicial[d.tipo] = d.cantidad;
    });
    setCantidadesRecojo(inicial);
  }, [pedidoSeleccionado, recojosPorPedido]);

  const registrarRecojo = (pedido: PedidoConfirmado, forzarTotal: boolean) => {
    const pendiente = getPendienteDetalle(pedido);
    if (pendiente.length === 0) {
      toast.info('Este pedido ya no tiene contenedores pendientes de recojo');
      return;
    }

    const detalleRecogido = pendiente
      .map((p) => {
        const cantidad = forzarTotal ? p.cantidad : Math.max(0, Math.min(p.cantidad, Number(cantidadesRecojo[p.tipo] || 0)));
        return {
          tipo: p.tipo,
          cantidad,
          pesoUnit: p.pesoUnit,
          pesoTotal: p.pesoUnit * cantidad,
        };
      })
      .filter((d) => d.cantidad > 0);

    if (detalleRecogido.length === 0) {
      toast.error('Debe ingresar al menos una cantidad para registrar el recojo');
      return;
    }

    const totalPendienteAntes = totalContenedores(pendiente);
    const totalRecogido = totalContenedores(detalleRecogido);
    const totalPendienteDespues = Math.max(0, totalPendienteAntes - totalRecogido);

    const nuevo: RecojoContenedor = {
      id: `REC-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
      pedidoId: pedido.id,
      cliente: pedido.cliente,
      conductorId: conductorIdActual || 'SIN_CONDUCTOR',
      conductor: conductorNombreActual || 'Conductor',
      zonaEntregaId: pedido.zonaEntregaId || 'SIN_ZONA',
      zonaEntrega: pedido.zonaEntrega,
      numeroTicket: pedido.numeroTicket,
      contenedores: detalleRecogido,
      fechaRecepcion: new Date().toISOString(),
      estadoRevision: 'Pendiente',
      esParcial: totalPendienteDespues > 0,
      cantidadRecogida: totalRecogido,
      cantidadPendiente: totalPendienteDespues,
      notificadoConductor: true,
    };

    addRecojoContenedor(nuevo);

    if (totalPendienteDespues > 0) {
      toast.success(`Recojo parcial registrado (${totalRecogido}). Quedan ${totalPendienteDespues} pendientes.`);
    } else {
      toast.success('Recojo total registrado correctamente.');
    }

    const freshPendiente = getPendienteDetalle(pedido);
    const freshTot = totalContenedores(freshPendiente);
    if (freshTot - totalRecogido <= 0) {
      setPedidoSeleccionado(null);
      setCantidadesRecojo({});
      return;
    }

    const nuevoMap: DetalleMap = {};
    freshPendiente.forEach((d) => {
      const recogidoAhora = detalleRecogido.find((x) => x.tipo === d.tipo)?.cantidad || 0;
      nuevoMap[d.tipo] = Math.max(0, d.cantidad - recogidoAhora);
    });
    setCantidadesRecojo(nuevoMap);
  };

  const badgeEstado = (rec: RecojoContenedor) => {
    const estado = rec.estadoRevision || 'Pendiente';
    if (estado === 'Confirmado') return { txt: rec.esParcial ? 'Confirmado Parcial' : 'Confirmado Total', bg: 'rgba(34,197,94,0.15)', color: '#22c55e' };
    if (estado === 'Rechazado') return { txt: 'Rechazado', bg: 'rgba(239,68,68,0.15)', color: '#ef4444' };
    return { txt: rec.esParcial ? 'Pendiente Parcial' : 'Pendiente', bg: 'rgba(245,158,11,0.15)', color: '#f59e0b' };
  };

  const totalPendienteUnidades = useMemo(() => {
    return pedidosPendientes.reduce((s, p) => s + totalContenedores(p.pendiente), 0);
  }, [pedidosPendientes]);

  const totalRechazados = useMemo(() => {
    return historialRecojos.filter((r) => (r.estadoRevision || 'Pendiente') === 'Rechazado').length;
  }, [historialRecojos]);

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-20 px-4">
      <div className="rounded-2xl overflow-hidden" style={{ background: c.bgCard, border: `1px solid ${c.border}` }}>
        <div className="h-1.5 w-full" style={{ background: 'linear-gradient(90deg, #3b82f6, #22c55e, #a855f7)' }} />
        <div className="p-4 sm:p-5 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold flex items-center gap-2" style={{ color: c.text }}>
              <ClipboardList className="text-blue-400" /> Recojo de Contenedores
            </h1>
            <p className="text-xs sm:text-sm mt-0.5" style={{ color: c.textSecondary }}>
              Vista global para todos los conductores, con registro total o parcial y seguimiento en tiempo real.
            </p>
          </div>
          <span className="text-[11px] px-2.5 py-1 rounded-full font-bold" style={{ background: 'rgba(59,130,246,0.14)', color: '#3b82f6', border: '1px solid rgba(59,130,246,0.3)' }}>
            OPERACION GLOBAL
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="rounded-xl p-3 space-y-1" style={{ background: c.bgCard, border: `1px solid ${c.border}` }}>
          <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: c.textMuted }}>Filtrar por zona</p>
          <select
            value={filtroZona}
            onChange={(e) => setFiltroZona(e.target.value)}
            className="w-full bg-transparent text-sm focus:outline-none"
            style={{ color: c.text }}
          >
            <option value="">Todas las zonas</option>
            {zonasDisponibles.map((z) => (
              <option key={z} value={z}>{z}</option>
            ))}
          </select>
        </div>
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
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="rounded-xl p-4" style={{ background: c.bgCard, border: `1px solid ${c.border}` }}>
          <p className="text-[10px] uppercase tracking-wider" style={{ color: c.textMuted }}>Clientes con pendientes</p>
          <p className="text-2xl font-bold mt-1" style={{ color: '#f59e0b' }}>{pedidosPendientes.length}</p>
        </div>
        <div className="rounded-xl p-4" style={{ background: c.bgCard, border: `1px solid ${c.border}` }}>
          <p className="text-[10px] uppercase tracking-wider" style={{ color: c.textMuted }}>Pendiente por recoger</p>
          <p className="text-2xl font-bold mt-1" style={{ color: '#a78bfa' }}>{totalPendienteUnidades}</p>
        </div>
        <div className="rounded-xl p-4" style={{ background: c.bgCard, border: `1px solid ${c.border}` }}>
          <p className="text-[10px] uppercase tracking-wider" style={{ color: c.textMuted }}>Registros pendientes revisión</p>
          <p className="text-2xl font-bold mt-1" style={{ color: '#3b82f6' }}>
            {historialRecojos.filter(r => (r.estadoRevision || 'Pendiente') === 'Pendiente').length}
          </p>
        </div>
        <div className="rounded-xl p-4" style={{ background: c.bgCard, border: `1px solid ${c.border}` }}>
          <p className="text-[10px] uppercase tracking-wider" style={{ color: c.textMuted }}>Registros rechazados</p>
          <p className="text-2xl font-bold mt-1" style={{ color: '#ef4444' }}>
            {totalRechazados}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-xl overflow-hidden" style={{ background: c.bgCard, border: `1px solid ${c.border}` }}>
          <div className="px-4 py-3" style={{ borderBottom: `1px solid ${c.borderSubtle}`, background: c.bgCardAlt }}>
            <h3 className="font-bold" style={{ color: c.text }}>Lista Global de Recojos Pendientes</h3>
          </div>

          {pedidosPendientes.length === 0 ? (
            <div className="p-6 text-center">
              <Package className="w-10 h-10 mx-auto mb-2" style={{ color: c.textMuted }} />
              <p className="text-sm" style={{ color: c.textSecondary }}>No hay contenedores pendientes en este momento</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full" style={{ minWidth: '640px' }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${c.borderSubtle}`, background: c.bgCardAlt }}>
                    <th className="px-3 py-2 text-left text-[10px] uppercase tracking-widest" style={{ color: c.textMuted }}>Cliente</th>
                    <th className="px-3 py-2 text-left text-[10px] uppercase tracking-widest" style={{ color: c.textMuted }}>Zona</th>
                    <th className="px-3 py-2 text-left text-[10px] uppercase tracking-widest" style={{ color: c.textMuted }}>Ticket</th>
                    <th className="px-3 py-2 text-right text-[10px] uppercase tracking-widest" style={{ color: c.textMuted }}>Pend.</th>
                    <th className="px-3 py-2 text-right text-[10px] uppercase tracking-widest" style={{ color: c.textMuted }}>Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {pedidosPendientes.map(({ pedido, pendiente }, idx) => (
                    <tr key={pedido.id} style={{ borderBottom: `1px solid ${c.borderSubtle}`, background: idx % 2 === 0 ? 'transparent' : c.bgCardAlt }}>
                      <td className="px-3 py-2.5 text-sm font-semibold" style={{ color: c.text }}>{pedido.cliente}</td>
                      <td className="px-3 py-2.5 text-xs" style={{ color: c.textSecondary }}>{pedido.zonaEntrega || 'Sin zona'}</td>
                      <td className="px-3 py-2.5 text-xs" style={{ color: c.textSecondary }}>{pedido.numeroTicket || 'S/N'}</td>
                      <td className="px-3 py-2.5 text-right">
                        <span className="px-2 py-0.5 rounded-md text-xs font-bold" style={{ background: 'rgba(245,158,11,0.12)', color: '#f59e0b' }}>
                          {totalContenedores(pendiente)}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-right">
                        <button
                          onClick={() => setPedidoSeleccionado(pedido)}
                          className="px-2.5 py-1.5 rounded-lg text-xs font-bold inline-flex items-center gap-1"
                          style={{ background: 'rgba(59,130,246,0.15)', color: '#3b82f6', border: '1px solid rgba(59,130,246,0.35)' }}
                        >
                          <Eye className="w-3.5 h-3.5" /> Detalle
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="rounded-xl overflow-hidden" style={{ background: c.bgCard, border: `1px solid ${c.border}` }}>
          <div className="px-4 py-3" style={{ borderBottom: `1px solid ${c.borderSubtle}`, background: c.bgCardAlt }}>
            <h3 className="font-bold" style={{ color: c.text }}>Detalle del Recojo</h3>
          </div>

          {!pedidoSeleccionado ? (
            <div className="p-6 text-center">
              <User className="w-10 h-10 mx-auto mb-2" style={{ color: c.textMuted }} />
              <p className="text-sm" style={{ color: c.textSecondary }}>Selecciona un cliente para registrar el recojo</p>
            </div>
          ) : (
            <div className="p-4 space-y-4">
              <div className="rounded-lg p-3" style={{ background: c.bgCardAlt, border: `1px solid ${c.borderSubtle}` }}>
                <p className="font-semibold" style={{ color: c.text }}>{pedidoSeleccionado.cliente}</p>
                <p className="text-xs mt-1" style={{ color: c.textSecondary }}>
                  Pedido: {pedidoSeleccionado.numeroPedido || 'S/N'} · Ticket: {pedidoSeleccionado.numeroTicket || 'S/N'}
                </p>
                <p className="text-xs" style={{ color: c.textSecondary }}>
                  Zona: {pedidoSeleccionado.zonaEntrega || 'Sin zona'}
                </p>
              </div>

              <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
                {getPendienteDetalle(pedidoSeleccionado).map((item, idx) => (
                  <div key={`${item.tipo}-${idx}`} className="rounded-lg px-3 py-2" style={{ background: c.bgCardAlt, border: `1px solid ${c.borderSubtle}` }}>
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2 min-w-0">
                        <Box className="w-4 h-4 text-blue-400 shrink-0" />
                        <span className="text-sm truncate" style={{ color: c.text }}>{item.tipo}</span>
                      </div>
                      <span className="text-xs font-bold" style={{ color: '#f59e0b' }}>Pendiente: {item.cantidad}</span>
                    </div>
                    <div className="mt-2">
                      <label className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: c.textMuted }}>Cantidad a recoger ahora</label>
                      <input
                        type="number"
                        min={0}
                        max={item.cantidad}
                        value={cantidadesRecojo[item.tipo] ?? 0}
                        onChange={(e) => {
                          const v = Math.max(0, Math.min(item.cantidad, Number(e.target.value || 0)));
                          setCantidadesRecojo((prev) => ({ ...prev, [item.tipo]: v }));
                        }}
                        className="w-full mt-1 rounded-lg px-3 py-2 text-sm font-bold focus:outline-none"
                        style={{ background: c.bgInput, border: `1px solid ${c.border}`, color: c.text }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  onClick={() => registrarRecojo(pedidoSeleccionado, true)}
                  className="w-full py-3 rounded-xl font-bold text-white flex items-center justify-center gap-2"
                  style={{ background: 'linear-gradient(135deg, #0d4a24, #22c55e)' }}
                >
                  <CheckCircle2 className="w-4 h-4" /> Recibir Contenedores
                </button>
                <button
                  onClick={() => registrarRecojo(pedidoSeleccionado, false)}
                  className="w-full py-3 rounded-xl font-bold"
                  style={{ background: 'rgba(59,130,246,0.15)', color: '#3b82f6', border: '1px solid rgba(59,130,246,0.35)' }}
                >
                  Registrar Parcial
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="rounded-xl overflow-hidden" style={{ background: c.bgCard, border: `1px solid ${c.border}` }}>
        <div className="px-4 py-3" style={{ borderBottom: `1px solid ${c.borderSubtle}`, background: c.bgCardAlt }}>
          <h3 className="font-bold" style={{ color: c.text }}>Historial de Recojos Registrados</h3>
        </div>

        {historialRecojos.length === 0 ? (
          <div className="p-6 text-center">
            <Package className="w-10 h-10 mx-auto mb-2" style={{ color: c.textMuted }} />
            <p className="text-sm" style={{ color: c.textSecondary }}>Aun no se registran recojos de contenedores</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full" style={{ minWidth: '900px' }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${c.borderSubtle}`, background: c.bgCardAlt }}>
                  <th className="px-3 py-2 text-left text-[10px] uppercase tracking-widest" style={{ color: c.textMuted }}>Cliente</th>
                  <th className="px-3 py-2 text-left text-[10px] uppercase tracking-widest" style={{ color: c.textMuted }}>Ticket</th>
                  <th className="px-3 py-2 text-right text-[10px] uppercase tracking-widest" style={{ color: c.textMuted }}>Recogido</th>
                  <th className="px-3 py-2 text-left text-[10px] uppercase tracking-widest" style={{ color: c.textMuted }}>Zona</th>
                  <th className="px-3 py-2 text-left text-[10px] uppercase tracking-widest" style={{ color: c.textMuted }}>Conductor</th>
                  <th className="px-3 py-2 text-left text-[10px] uppercase tracking-widest" style={{ color: c.textMuted }}>Fecha</th>
                  <th className="px-3 py-2 text-left text-[10px] uppercase tracking-widest" style={{ color: c.textMuted }}>Estado</th>
                </tr>
              </thead>
              <tbody>
                {historialRecojos.map((rec, idx) => {
                  const badge = badgeEstado(rec);
                  const total = totalContenedores(rec.contenedores);
                  return (
                    <tr key={rec.id} style={{ borderBottom: `1px solid ${c.borderSubtle}`, background: idx % 2 === 0 ? 'transparent' : c.bgCardAlt }}>
                      <td className="px-3 py-2.5 text-sm font-semibold" style={{ color: c.text }}>{rec.cliente}</td>
                      <td className="px-3 py-2.5 text-xs" style={{ color: c.textSecondary }}>{rec.numeroTicket || 'S/N'}</td>
                      <td className="px-3 py-2.5 text-right">
                        <span className="text-xs font-bold" style={{ color: '#3b82f6' }}>{total}</span>
                      </td>
                      <td className="px-3 py-2.5 text-xs" style={{ color: c.textSecondary }}>{rec.zonaEntrega || 'Sin zona'}</td>
                      <td className="px-3 py-2.5 text-xs" style={{ color: c.textSecondary }}>{rec.conductor || 'Sin conductor'}</td>
                      <td className="px-3 py-2.5 text-xs" style={{ color: c.textMuted }}>{new Date(rec.fechaRecepcion).toLocaleString('es-PE')}</td>
                      <td className="px-3 py-2.5">
                        <span className="text-[11px] px-2 py-1 rounded-full" style={{ background: badge.bg, color: badge.color }}>
                          {badge.txt}
                        </span>
                        {rec.motivoRechazo && (
                          <p className="text-[11px] mt-1" style={{ color: '#f87171' }}>Motivo: {rec.motivoRechazo}</p>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
