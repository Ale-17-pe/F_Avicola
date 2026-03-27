import { useEffect, useMemo, useState } from 'react';
import { Box, CheckCircle2, ClipboardList, Eye, Search, User } from 'lucide-react';
import { useApp, PedidoConfirmado, RecojoContenedor } from '../contexts/AppContext';
import { useAuth } from '../contexts/AuthContext';
import { useTheme, t } from '../contexts/ThemeContext';
import { toast } from 'sonner';

type DetalleMap = Record<string, number>;

type DetalleItem = { tipo: string; cantidad: number; pesoUnit: number; pesoTotal: number };
type Movimiento = NonNullable<RecojoContenedor['movimientos']>[number];

interface PedidoPendienteRow {
  pedido: PedidoConfirmado;
  pendiente: DetalleItem[];
}

function toMap(detalle: DetalleItem[] = []): DetalleMap {
  return detalle.reduce<DetalleMap>((acc, d) => {
    const k = (d.tipo || '').trim();
    if (!k) return acc;
    acc[k] = (acc[k] || 0) + (d.cantidad || 0);
    return acc;
  }, {});
}

function sumMap(a: DetalleMap, b: DetalleMap): DetalleMap {
  const out: DetalleMap = { ...a };
  Object.entries(b).forEach(([k, v]) => {
    out[k] = (out[k] || 0) + (v || 0);
  });
  return out;
}

function totalUnidades(detalle: DetalleItem[] = []) {
  return detalle.reduce((s, d) => s + (d.cantidad || 0), 0);
}

function movimientosFromRecojo(r: RecojoContenedor): Movimiento[] {
  if (r.movimientos && r.movimientos.length > 0) return r.movimientos;

  const legacyEstado = r.estadoRevision === 'Rechazado'
    ? 'Rechazado'
    : r.estadoRevision === 'Confirmado' || r.estado === 'Ingresado Almacen'
      ? 'Confirmado'
      : 'Pendiente';

  return [{
    id: `${r.id}-legacy`,
    fecha: r.fechaRecepcion,
    conductorId: r.conductorId,
    conductor: r.conductor || 'Conductor',
    tipo: r.esParcial ? 'Parcial' : 'Completo',
    estado: legacyEstado,
    contenedores: r.contenedores || [],
    motivoRechazo: r.motivoRechazo,
    fechaRevision: r.fechaRevision,
    revisadoPor: r.revisadoPor,
  }];
}

function consolidateByPedido(recojos: RecojoContenedor[]) {
  const map = new Map<string, RecojoContenedor>();

  recojos.forEach((r) => {
    const key = r.pedidoId;
    const base = map.get(key);
    const movs = movimientosFromRecojo(r);

    if (!base) {
      map.set(key, {
        ...r,
        id: `REC-${key}`,
        movimientos: [...movs],
        conductores: Array.from(new Set([...(r.conductores || []), r.conductor || 'Conductor'])).filter(Boolean),
      });
      return;
    }

    map.set(key, {
      ...base,
      fechaRecepcion: new Date(r.fechaRecepcion) > new Date(base.fechaRecepcion) ? r.fechaRecepcion : base.fechaRecepcion,
      movimientos: [...(base.movimientos || []), ...movs],
      conductores: Array.from(new Set([...(base.conductores || []), ...(r.conductores || []), r.conductor || '', base.conductor || ''])).filter(Boolean),
    });
  });

  return map;
}

function expectedDetalle(pedido: PedidoConfirmado): DetalleItem[] {
  return (pedido.contenedoresDetalle || []).map((d) => ({
    tipo: d.tipo,
    cantidad: d.cantidad,
    pesoUnit: d.pesoUnit,
    pesoTotal: d.pesoTotal,
  }));
}

export function RecojoContenedoresConductor() {
  const { pedidosConfirmados, recojosContenedores, addRecojoContenedor, updateRecojoContenedor } = useApp();
  const { user } = useAuth();
  const { isDark } = useTheme();
  const c = t(isDark);

  const [pedidoSeleccionado, setPedidoSeleccionado] = useState<PedidoConfirmado | null>(null);
  const [filtroZona, setFiltroZona] = useState('');
  const [filtroCliente, setFiltroCliente] = useState('');
  const [cantidadesRecojo, setCantidadesRecojo] = useState<DetalleMap>({});

  const conductorIdActual = user?.conductorRegistradoId || user?.id || null;
  const conductorNombreActual = `${user?.nombre || ''} ${user?.apellido || ''}`.trim() || 'Conductor';

  const pedidosEntregadosConContenedores = useMemo(() => {
    return pedidosConfirmados
      .filter((p) => p.ticketEmitido)
      .filter((p) => p.estado === 'Entregado')
      .filter((p) => (p.contenedoresDetalle || []).length > 0);
  }, [pedidosConfirmados]);

  const recojosConsolidados = useMemo(() => consolidateByPedido(recojosContenedores), [recojosContenedores]);

  const zonasDisponibles = useMemo(() => {
    return Array.from(
      new Set(pedidosEntregadosConContenedores.map((p) => p.zonaEntrega || 'Sin zona')),
    ).sort((a, b) => a.localeCompare(b));
  }, [pedidosEntregadosConContenedores]);

  const getDetallePendiente = (pedido: PedidoConfirmado): DetalleItem[] => {
    const expected = expectedDetalle(pedido);
    const expectedMap = toMap(expected);

    const rec = recojosConsolidados.get(pedido.id);
    const movs = rec ? (rec.movimientos || []) : [];

    const descontar = movs
      .filter((m) => m.estado !== 'Rechazado')
      .reduce((acc, m) => sumMap(acc, toMap(m.contenedores as DetalleItem[])), {} as DetalleMap);

    return expected
      .map((e) => {
        const restante = Math.max(0, (expectedMap[e.tipo] || 0) - (descontar[e.tipo] || 0));
        return {
          tipo: e.tipo,
          cantidad: restante,
          pesoUnit: e.pesoUnit,
          pesoTotal: e.pesoUnit * restante,
        };
      })
      .filter((d) => d.cantidad > 0);
  };

  const pedidosPendientes = useMemo<PedidoPendienteRow[]>(() => {
    return pedidosEntregadosConContenedores
      .map((p) => ({ pedido: p, pendiente: getDetallePendiente(p) }))
      .filter((x) => totalUnidades(x.pendiente) > 0)
      .filter((x) => {
        const okZona = !filtroZona || (x.pedido.zonaEntrega || 'Sin zona') === filtroZona;
        const okCliente = !filtroCliente || x.pedido.cliente.toLowerCase().includes(filtroCliente.toLowerCase());
        return okZona && okCliente;
      });
  }, [pedidosEntregadosConContenedores, filtroZona, filtroCliente, recojosConsolidados]);

  useEffect(() => {
    if (!pedidoSeleccionado) {
      setCantidadesRecojo({});
      return;
    }
    const pendiente = getDetallePendiente(pedidoSeleccionado);
    const initial: DetalleMap = {};
    pendiente.forEach((d) => { initial[d.tipo] = d.cantidad; });
    setCantidadesRecojo(initial);
  }, [pedidoSeleccionado, recojosConsolidados]);

  const registrarRecojo = (pedido: PedidoConfirmado, forzarTotal: boolean) => {
    const pendiente = getDetallePendiente(pedido);
    if (pendiente.length === 0) {
      toast.info('Este pedido ya no tiene contenedores pendientes de recojo');
      return;
    }

    const detalleRecogido = pendiente
      .map((p) => {
        const cantidad = forzarTotal
          ? p.cantidad
          : Math.max(0, Math.min(p.cantidad, Number(cantidadesRecojo[p.tipo] || 0)));
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

    const totalPendienteAntes = totalUnidades(pendiente);
    const totalRecogido = totalUnidades(detalleRecogido);
    const totalPendienteDespues = Math.max(0, totalPendienteAntes - totalRecogido);

    const isCompleto = totalPendienteDespues === 0;
    const confirmarTxt = isCompleto
      ? `Confirmar recojo completo de ${totalRecogido} contenedores?`
      : `Confirmar recojo parcial de ${totalRecogido} contenedores? Quedarán ${totalPendienteDespues} pendientes.`;

    if (!window.confirm(confirmarTxt)) return;

    const movimiento: Movimiento = {
      id: `MOV-${Date.now()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`,
      fecha: new Date().toISOString(),
      conductorId: conductorIdActual || 'SIN_CONDUCTOR',
      conductor: conductorNombreActual,
      tipo: isCompleto ? 'Completo' : 'Parcial',
      estado: 'Pendiente',
      contenedores: detalleRecogido,
    };

    const existente = recojosConsolidados.get(pedido.id);
    if (existente) {
      const actualizado: RecojoContenedor = {
        ...existente,
        conductorId: existente.conductorId || (conductorIdActual || 'SIN_CONDUCTOR'),
        conductor: Array.from(new Set([...(existente.conductores || []), conductorNombreActual])).join(', '),
        conductores: Array.from(new Set([...(existente.conductores || []), conductorNombreActual])),
        contenedores: detalleRecogido,
        movimientos: [...(existente.movimientos || []), movimiento],
        fechaRecepcion: movimiento.fecha,
        estadoRevision: 'Pendiente',
        esParcial: !isCompleto,
        cantidadRecogida: totalRecogido,
        cantidadPendiente: totalPendienteDespues,
        motivoRechazo: undefined,
        notificadoConductor: true,
      };
      updateRecojoContenedor(actualizado);
    } else {
      const nuevo: RecojoContenedor = {
        id: `REC-${pedido.id}`,
        pedidoId: pedido.id,
        cliente: pedido.cliente,
        conductorId: conductorIdActual || 'SIN_CONDUCTOR',
        conductor: conductorNombreActual,
        conductores: [conductorNombreActual],
        zonaEntregaId: pedido.zonaEntregaId || 'SIN_ZONA',
        zonaEntrega: pedido.zonaEntrega,
        numeroTicket: pedido.numeroTicket,
        contenedores: detalleRecogido,
        movimientos: [movimiento],
        fechaRecepcion: movimiento.fecha,
        estadoRevision: 'Pendiente',
        esParcial: !isCompleto,
        cantidadRecogida: totalRecogido,
        cantidadPendiente: totalPendienteDespues,
        notificadoConductor: true,
      };
      addRecojoContenedor(nuevo);
    }

    toast.success(isCompleto ? 'Recojo completo enviado a revisión' : 'Recojo parcial enviado a revisión');

    if (totalPendienteDespues === 0) {
      setPedidoSeleccionado(null);
      setCantidadesRecojo({});
      return;
    }

    const newMap: DetalleMap = {};
    pendiente.forEach((d) => {
      const rec = detalleRecogido.find((x) => x.tipo === d.tipo)?.cantidad || 0;
      newMap[d.tipo] = Math.max(0, d.cantidad - rec);
    });
    setCantidadesRecojo(newMap);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-5 pb-20 px-4">
      <div className="rounded-2xl overflow-hidden" style={{ background: c.bgCard, border: `1px solid ${c.border}` }}>
        <div className="h-1.5 w-full" style={{ background: 'linear-gradient(90deg, #3b82f6, #22c55e, #a855f7)' }} />
        <div className="p-4 sm:p-5 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold flex items-center gap-2" style={{ color: c.text }}>
              <ClipboardList className="text-blue-400" /> Recojo de Contenedores
            </h1>
            <p className="text-xs sm:text-sm mt-0.5" style={{ color: c.textSecondary }}>
              Vista global de clientes con pendientes para recojo total o parcial.
            </p>
          </div>
          <span className="text-[11px] px-2.5 py-1 rounded-full font-bold" style={{ background: 'rgba(59,130,246,0.14)', color: '#3b82f6', border: '1px solid rgba(59,130,246,0.3)' }}>
            RECOJO GLOBAL
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-xl overflow-hidden" style={{ background: c.bgCard, border: `1px solid ${c.border}` }}>
          <div className="px-4 py-3" style={{ borderBottom: `1px solid ${c.borderSubtle}`, background: c.bgCardAlt }}>
            <h3 className="font-bold" style={{ color: c.text }}>Clientes pendientes de recojo</h3>
          </div>

          {pedidosPendientes.length === 0 ? (
            <div className="p-6 text-center">
              <User className="w-10 h-10 mx-auto mb-2" style={{ color: c.textMuted }} />
              <p className="text-sm" style={{ color: c.textSecondary }}>No hay clientes pendientes por recojo</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full" style={{ minWidth: '640px' }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${c.borderSubtle}`, background: c.bgCardAlt }}>
                    <th className="px-3 py-2 text-left text-[10px] uppercase tracking-widest" style={{ color: c.textMuted }}>Cliente</th>
                    <th className="px-3 py-2 text-left text-[10px] uppercase tracking-widest" style={{ color: c.textMuted }}>Zona</th>
                    <th className="px-3 py-2 text-left text-[10px] uppercase tracking-widest" style={{ color: c.textMuted }}>Ticket</th>
                    <th className="px-3 py-2 text-right text-[10px] uppercase tracking-widest" style={{ color: c.textMuted }}>Pendiente</th>
                    <th className="px-3 py-2 text-right text-[10px] uppercase tracking-widest" style={{ color: c.textMuted }}>Detalle</th>
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
                          {totalUnidades(pendiente)}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-right">
                        <button
                          onClick={() => setPedidoSeleccionado(pedido)}
                          className="px-2.5 py-1.5 rounded-lg text-xs font-bold inline-flex items-center gap-1"
                          style={{ background: 'rgba(59,130,246,0.15)', color: '#3b82f6', border: '1px solid rgba(59,130,246,0.35)' }}
                        >
                          <Eye className="w-3.5 h-3.5" /> Ver
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
            <h3 className="font-bold" style={{ color: c.text }}>Detalle y registro de recojo</h3>
          </div>

          {!pedidoSeleccionado ? (
            <div className="p-6 text-center">
              <Box className="w-10 h-10 mx-auto mb-2" style={{ color: c.textMuted }} />
              <p className="text-sm" style={{ color: c.textSecondary }}>Selecciona un cliente para registrar recojo</p>
            </div>
          ) : (
            <div className="p-4 space-y-4">
              <div className="rounded-lg p-3" style={{ background: c.bgCardAlt, border: `1px solid ${c.borderSubtle}` }}>
                <p className="font-semibold" style={{ color: c.text }}>{pedidoSeleccionado.cliente}</p>
                <p className="text-xs mt-1" style={{ color: c.textSecondary }}>
                  Pedido: {pedidoSeleccionado.numeroPedido || 'S/N'} · Ticket: {pedidoSeleccionado.numeroTicket || 'S/N'}
                </p>
                <p className="text-xs" style={{ color: c.textSecondary }}>Zona: {pedidoSeleccionado.zonaEntrega || 'Sin zona'}</p>
              </div>

              <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
                {getDetallePendiente(pedidoSeleccionado).map((item, idx) => (
                  <div key={`${item.tipo}-${idx}`} className="rounded-lg px-3 py-2" style={{ background: c.bgCardAlt, border: `1px solid ${c.borderSubtle}` }}>
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2 min-w-0">
                        <Box className="w-4 h-4 text-blue-400 shrink-0" />
                        <span className="text-sm truncate" style={{ color: c.text }}>{item.tipo}</span>
                      </div>
                      <span className="text-xs font-bold" style={{ color: '#f59e0b' }}>Pendiente: {item.cantidad}</span>
                    </div>
                    <div className="mt-2">
                      <label className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: c.textMuted }}>
                        Cantidad a recoger ahora
                      </label>
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
    </div>
  );
}
