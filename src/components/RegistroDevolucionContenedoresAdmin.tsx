import { useMemo, useState } from 'react';
import { CheckCircle2, ClipboardCheck, Eye, EyeOff, Search, UserCheck, XCircle } from 'lucide-react';
import { useApp, PedidoConfirmado, RecojoContenedor } from '../contexts/AppContext';
import { useTheme, t } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';

interface RegistroDevolucionContenedoresProps {
  readOnly?: boolean;
}

type DetalleItem = { tipo: string; cantidad: number; pesoUnit: number; pesoTotal: number };
type Movimiento = NonNullable<RecojoContenedor['movimientos']>[number];

interface RegistroConsolidado extends RecojoContenedor {
  sourceIds: string[];
  pedido?: PedidoConfirmado;
  movimientos: Movimiento[];
}

function toMap(detalle: DetalleItem[] = []): Record<string, number> {
  return detalle.reduce<Record<string, number>>((acc, d) => {
    const k = (d.tipo || '').trim();
    if (!k) return acc;
    acc[k] = (acc[k] || 0) + (d.cantidad || 0);
    return acc;
  }, {});
}

function totalUnidades(detalle: DetalleItem[] = []) {
  return detalle.reduce((s, d) => s + (d.cantidad || 0), 0);
}

function detalleFromMap(map: Record<string, number>, base: DetalleItem[] = []): DetalleItem[] {
  return Object.entries(map)
    .filter(([, qty]) => qty > 0)
    .map(([tipo, cantidad]) => {
      const ref = base.find((b) => b.tipo === tipo);
      const pesoUnit = ref?.pesoUnit || 0;
      return {
        tipo,
        cantidad,
        pesoUnit,
        pesoTotal: pesoUnit * cantidad,
      };
    });
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

function consolidarRecojos(
  recojos: RecojoContenedor[],
  pedidos: PedidoConfirmado[],
): RegistroConsolidado[] {
  const map = new Map<string, RegistroConsolidado>();

  recojos.forEach((r) => {
    const key = r.pedidoId;
    const pedido = pedidos.find((p) => p.id === key);
    const movs = movimientosFromRecojo(r);

    const actual = map.get(key);
    if (!actual) {
      map.set(key, {
        ...r,
        id: `REC-${key}`,
        sourceIds: [r.id],
        pedido,
        movimientos: [...movs].sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime()),
        conductores: Array.from(new Set([...(r.conductores || []), r.conductor || ''])).filter(Boolean),
      });
      return;
    }

    map.set(key, {
      ...actual,
      sourceIds: [...actual.sourceIds, r.id],
      pedido: actual.pedido || pedido,
      fechaRecepcion: new Date(r.fechaRecepcion) > new Date(actual.fechaRecepcion) ? r.fechaRecepcion : actual.fechaRecepcion,
      movimientos: [...actual.movimientos, ...movs].sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime()),
      conductores: Array.from(new Set([...(actual.conductores || []), ...(r.conductores || []), r.conductor || ''])).filter(Boolean),
    });
  });

  return Array.from(map.values()).sort(
    (a, b) => new Date(b.fechaRecepcion).getTime() - new Date(a.fechaRecepcion).getTime(),
  );
}

export function RegistroDevolucionContenedoresAdmin({ readOnly = false }: RegistroDevolucionContenedoresProps) {
  const { recojosContenedores, pedidosConfirmados, contenedores, setRecojosContenedores, setContenedores } = useApp();
  const { user } = useAuth();
  const { isDark } = useTheme();
  const c = t(isDark);

  const [filtroCliente, setFiltroCliente] = useState('');
  const [filtroZona, setFiltroZona] = useState('');
  const [soloMisRegistros, setSoloMisRegistros] = useState(false);
  const [abiertos, setAbiertos] = useState<Record<string, boolean>>({});

  const registros = useMemo(
    () => consolidarRecojos(recojosContenedores, pedidosConfirmados),
    [recojosContenedores, pedidosConfirmados],
  );

  const zonas = useMemo(() => {
    return Array.from(new Set(registros.map((r) => r.zonaEntrega || r.pedido?.zonaEntrega || 'Sin zona'))).sort((a, b) => a.localeCompare(b));
  }, [registros]);

  const filas = useMemo(() => {
    return registros.filter((r) => {
      const cliente = (r.cliente || '').toLowerCase();
      const zona = (r.zonaEntrega || r.pedido?.zonaEntrega || 'Sin zona').toLowerCase();
      const okCliente = !filtroCliente || cliente.includes(filtroCliente.toLowerCase());
      const okZona = !filtroZona || zona === filtroZona.toLowerCase();

      const esConductor = readOnly && user?.rol === 'conductor';
      const uid = user?.conductorRegistradoId || user?.id || '';
      const nombre = `${user?.nombre || ''} ${user?.apellido || ''}`.trim().toLowerCase();

      const participa = !soloMisRegistros || !esConductor || r.movimientos.some((m) => {
        const byId = uid && m.conductorId === uid;
        const byName = nombre && (m.conductor || '').toLowerCase().includes(nombre);
        return byId || byName;
      });

      return okCliente && okZona && participa;
    });
  }, [registros, filtroCliente, filtroZona, soloMisRegistros, user, readOnly]);

  const resumen = (r: RegistroConsolidado) => {
    const base = (r.pedido?.contenedoresDetalle || []).map((d) => ({
      tipo: d.tipo,
      cantidad: d.cantidad,
      pesoUnit: d.pesoUnit,
      pesoTotal: d.pesoTotal,
    }));

    const esperadoMap = toMap(base);
    const confirmadoMap: Record<string, number> = {};
    const pendienteMap: Record<string, number> = {};
    const rechazadoMap: Record<string, number> = {};

    r.movimientos.forEach((m) => {
      m.contenedores.forEach((d) => {
        const k = d.tipo;
        if (m.estado === 'Confirmado') confirmadoMap[k] = (confirmadoMap[k] || 0) + d.cantidad;
        if (m.estado === 'Pendiente') pendienteMap[k] = (pendienteMap[k] || 0) + d.cantidad;
        if (m.estado === 'Rechazado') rechazadoMap[k] = (rechazadoMap[k] || 0) + d.cantidad;
      });
    });

    const restanteMap: Record<string, number> = {};
    Object.keys(esperadoMap).forEach((k) => {
      const restante = Math.max(0, esperadoMap[k] - (confirmadoMap[k] || 0) - (pendienteMap[k] || 0));
      if (restante > 0) restanteMap[k] = restante;
    });

    const debe = totalUnidades(base);
    const entregando = Object.values(pendienteMap).reduce((s, n) => s + n, 0);
    const confirmado = Object.values(confirmadoMap).reduce((s, n) => s + n, 0);
    const rechazado = Object.values(rechazadoMap).reduce((s, n) => s + n, 0);
    const restante = Object.values(restanteMap).reduce((s, n) => s + n, 0);

    let estado: RecojoContenedor['estadoRevision'] = 'Pendiente';
    if (entregando > 0) estado = 'Pendiente';
    else if (confirmado > 0 && restante === 0) estado = 'Confirmado Completo';
    else if (confirmado > 0) estado = 'Confirmado Parcial';
    else if (rechazado > 0 && restante > 0) estado = 'Rechazado Parcial';
    else if (rechazado > 0) estado = 'Rechazado';

    return {
      estado,
      debe,
      entregando,
      confirmado,
      restante,
      base,
      debeDetalle: base,
      entregandoDetalle: detalleFromMap(pendienteMap, base),
      confirmadoDetalle: detalleFromMap(confirmadoMap, base),
      restanteDetalle: detalleFromMap(restanteMap, base),
    };
  };

  const persistirRegistro = (registroActualizado: RegistroConsolidado) => {
    const { sourceIds: _sourceIds, pedido: _pedido, ...rest } = registroActualizado;
    const limpio: RecojoContenedor = {
      ...rest,
      id: `REC-${registroActualizado.pedidoId}`,
    };

    setRecojosContenedores([
      ...recojosContenedores.filter((r) => r.pedidoId !== registroActualizado.pedidoId),
      limpio,
    ]);
  };

  const getRevisor = () => (user?.rol === 'operador' ? 'Operador' : 'Administrador');

  const confirmarMovimiento = (registro: RegistroConsolidado, mov: Movimiento) => {
    if (mov.estado !== 'Pendiente') return;
    if (!window.confirm('Confirmar este movimiento de devoluci�n? Esto actualizar� stock.')) return;

    const ahora = new Date().toISOString();
    const actualizado: RegistroConsolidado = {
      ...registro,
      movimientos: registro.movimientos.map((m) =>
        m.id === mov.id
          ? { ...m, estado: 'Confirmado', fechaRevision: ahora, revisadoPor: getRevisor(), motivoRechazo: undefined }
          : m,
      ),
      fechaRevision: ahora,
      revisadoPor: getRevisor(),
      notificadoConductor: true,
    };

    const r = resumen(actualizado);
    actualizado.estadoRevision = r.estado;
    actualizado.esParcial = r.restante > 0;
    actualizado.cantidadRecogida = r.confirmado + r.entregando;
    actualizado.cantidadPendiente = r.restante;
    actualizado.contenedores = mov.contenedores;
    actualizado.conductor = Array.from(new Set((actualizado.movimientos || []).map((m) => m.conductor))).join(', ');
    actualizado.conductores = Array.from(new Set((actualizado.movimientos || []).map((m) => m.conductor)));

    const nextContenedores = [...contenedores];
    mov.contenedores.forEach((item) => {
      const idx = nextContenedores.findIndex((c) => c.tipo.trim().toLowerCase() === item.tipo.trim().toLowerCase());
      if (idx >= 0) {
        nextContenedores[idx] = { ...nextContenedores[idx], stock: (nextContenedores[idx].stock || 0) + item.cantidad };
      }
    });
    setContenedores(nextContenedores);

    persistirRegistro(actualizado);
    toast.success('Movimiento confirmado y stock actualizado');
  };

  const rechazarMovimiento = (registro: RegistroConsolidado, mov: Movimiento) => {
    if (mov.estado !== 'Pendiente') return;

    const motivo = window.prompt('Indique motivo de rechazo para notificar al conductor:')?.trim() || '';
    if (!motivo) {
      toast.error('Debe ingresar un motivo para rechazar');
      return;
    }

    if (!window.confirm('Confirmar rechazo de este movimiento?')) return;

    const ahora = new Date().toISOString();
    const actualizado: RegistroConsolidado = {
      ...registro,
      movimientos: registro.movimientos.map((m) =>
        m.id === mov.id
          ? { ...m, estado: 'Rechazado', motivoRechazo: motivo, fechaRevision: ahora, revisadoPor: getRevisor() }
          : m,
      ),
      fechaRevision: ahora,
      revisadoPor: getRevisor(),
      motivoRechazo: motivo,
      notificadoConductor: false,
    };

    const r = resumen(actualizado);
    actualizado.estadoRevision = r.estado;
    actualizado.esParcial = r.restante > 0;
    actualizado.cantidadRecogida = r.confirmado + r.entregando;
    actualizado.cantidadPendiente = r.restante;
    actualizado.conductor = Array.from(new Set((actualizado.movimientos || []).map((m) => m.conductor))).join(', ');
    actualizado.conductores = Array.from(new Set((actualizado.movimientos || []).map((m) => m.conductor)));

    persistirRegistro(actualizado);
    toast.success('Movimiento rechazado; el pedido vuelve con pendiente disponible para recojo');
  };

  const estadoBadge = (estado: RecojoContenedor['estadoRevision']) => {
    if (estado === 'Confirmado Completo') return { bg: 'rgba(34,197,94,0.15)', text: '#22c55e', label: 'Confirmado Completo' };
    if (estado === 'Confirmado Parcial') return { bg: 'rgba(16,185,129,0.15)', text: '#10b981', label: 'Confirmado Parcial' };
    if (estado === 'Rechazado' || estado === 'Rechazado Parcial') return { bg: 'rgba(239,68,68,0.15)', text: '#ef4444', label: estado };
    return { bg: 'rgba(245,158,11,0.15)', text: '#f59e0b', label: 'Pendiente Revisi�n' };
  };

  const totalPendientes = useMemo(() => filas.filter((f) => resumen(f).estado === 'Pendiente').length, [filas]);

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
                {readOnly ? 'Consulta detallada por pedido y por conductor' : 'Revision por movimiento y confirmacion de stock'}
              </p>
            </div>
          </div>
          <span className="text-[11px] px-2.5 py-1 rounded-full font-bold" style={{ background: readOnly ? 'rgba(168,85,247,0.14)' : 'rgba(34,197,94,0.14)', color: readOnly ? '#a78bfa' : '#22c55e', border: readOnly ? '1px solid rgba(168,85,247,0.35)' : '1px solid rgba(34,197,94,0.35)' }}>
            {readOnly ? 'SOLO LECTURA' : user?.rol === 'operador' ? 'GESTION OPERADOR' : 'GESTION ADMIN'}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
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

        {readOnly && user?.rol === 'conductor' && (
          <button
            onClick={() => setSoloMisRegistros((s) => !s)}
            className="rounded-xl p-3 flex items-center justify-center gap-2 text-sm font-bold"
            style={{
              background: soloMisRegistros ? 'rgba(59,130,246,0.15)' : c.bgCard,
              border: `1px solid ${soloMisRegistros ? 'rgba(59,130,246,0.4)' : c.border}`,
              color: soloMisRegistros ? '#3b82f6' : c.text,
            }}
          >
            <UserCheck className="w-4 h-4" />
            {soloMisRegistros ? 'Mostrando mis registros' : 'Ver mis registros'}
          </button>
        )}
      </div>

      <div className="rounded-xl p-3" style={{ background: c.bgCard, border: `1px solid ${c.border}` }}>
        <p className="text-sm" style={{ color: c.textSecondary }}>
          Registros: <span className="font-bold" style={{ color: c.text }}>{filas.length}</span>
          {' � '}Pendientes: <span className="font-bold" style={{ color: '#f59e0b' }}>{totalPendientes}</span>
        </p>
      </div>

      <div className="space-y-4">
        {filas.length === 0 && (
          <div className="rounded-xl p-8 text-center" style={{ background: c.bgCard, border: `1px solid ${c.border}` }}>
            <p style={{ color: c.textMuted }}>No hay registros para mostrar</p>
          </div>
        )}

        {filas.map((r) => {
          const info = resumen(r);
          const badge = estadoBadge(info.estado);
          const abierta = !!abiertos[r.pedidoId];
          const tienePendiente = r.movimientos.some((m) => m.estado === 'Pendiente');

          return (
            <div key={r.pedidoId} className="rounded-2xl overflow-hidden" style={{ background: c.bgCard, border: `1px solid ${c.border}` }}>
              <div className="p-4" style={{ borderBottom: `1px solid ${c.borderSubtle}`, background: c.bgCardAlt }}>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="font-extrabold" style={{ color: c.text }}>{r.cliente}</h3>
                    <p className="text-xs" style={{ color: c.textSecondary }}>
                      Pedido: {r.pedido?.numeroPedido || 'S/N'} � Ticket: {r.numeroTicket || r.pedido?.numeroTicket || 'S/N'} � Zona: {r.zonaEntrega || r.pedido?.zonaEntrega || 'Sin zona'}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="px-2 py-1 rounded-full text-xs font-bold" style={{ background: badge.bg, color: badge.text }}>
                      {badge.label}
                    </span>
                    <button
                      onClick={() => setAbiertos((prev) => ({ ...prev, [r.pedidoId]: !prev[r.pedidoId] }))}
                      className="px-2.5 py-1.5 rounded-lg text-xs font-bold inline-flex items-center gap-1"
                      style={{ background: 'rgba(59,130,246,0.15)', color: '#3b82f6', border: '1px solid rgba(59,130,246,0.35)' }}
                    >
                      {abierta ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      {abierta ? 'Ocultar detalle' : 'Ver detalle'}
                    </button>
                  </div>
                </div>
              </div>

              <div className="p-4 grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="rounded-lg p-3" style={{ background: c.bgCardAlt, border: `1px solid ${c.borderSubtle}` }}>
                  <p className="text-[10px] uppercase tracking-widest" style={{ color: c.textMuted }}>Debe devolver</p>
                  <p className="text-lg font-bold" style={{ color: c.text }}>{info.debe}</p>
                </div>
                <div className="rounded-lg p-3" style={{ background: c.bgCardAlt, border: `1px solid ${c.borderSubtle}` }}>
                  <p className="text-[10px] uppercase tracking-widest" style={{ color: c.textMuted }}>Entregando</p>
                  <p className="text-lg font-bold" style={{ color: '#f59e0b' }}>{info.entregando}</p>
                </div>
                <div className="rounded-lg p-3" style={{ background: c.bgCardAlt, border: `1px solid ${c.borderSubtle}` }}>
                  <p className="text-[10px] uppercase tracking-widest" style={{ color: c.textMuted }}>Confirmado</p>
                  <p className="text-lg font-bold" style={{ color: '#22c55e' }}>{info.confirmado}</p>
                </div>
                <div className="rounded-lg p-3" style={{ background: c.bgCardAlt, border: `1px solid ${c.borderSubtle}` }}>
                  <p className="text-[10px] uppercase tracking-widest" style={{ color: c.textMuted }}>Restante</p>
                  <p className="text-lg font-bold" style={{ color: info.restante > 0 ? '#ef4444' : '#22c55e' }}>{info.restante}</p>
                </div>
              </div>

              {abierta && (
                <div className="px-4 pb-4 space-y-3">
                  <div className="rounded-xl p-3" style={{ background: c.bgCardAlt, border: `1px solid ${c.borderSubtle}` }}>
                    <p className="text-xs font-bold mb-2" style={{ color: c.text }}>Detalle por tipo</p>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-2 text-xs">
                      <div>
                        <p className="font-semibold" style={{ color: c.textSecondary }}>Debe devolver</p>
                        <p style={{ color: c.text }}>{info.debeDetalle.map((d) => `${d.tipo}: ${d.cantidad}`).join(' � ') || '0'}</p>
                      </div>
                      <div>
                        <p className="font-semibold" style={{ color: c.textSecondary }}>Entregando</p>
                        <p style={{ color: '#f59e0b' }}>{info.entregandoDetalle.map((d) => `${d.tipo}: ${d.cantidad}`).join(' � ') || '0'}</p>
                      </div>
                      <div>
                        <p className="font-semibold" style={{ color: c.textSecondary }}>Confirmado</p>
                        <p style={{ color: '#22c55e' }}>{info.confirmadoDetalle.map((d) => `${d.tipo}: ${d.cantidad}`).join(' � ') || '0'}</p>
                      </div>
                      <div>
                        <p className="font-semibold" style={{ color: c.textSecondary }}>Restante</p>
                        <p style={{ color: '#ef4444' }}>{info.restanteDetalle.map((d) => `${d.tipo}: ${d.cantidad}`).join(' � ') || '0'}</p>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-xl overflow-hidden" style={{ border: `1px solid ${c.borderSubtle}` }}>
                    <div className="px-3 py-2" style={{ background: c.bgCardAlt, borderBottom: `1px solid ${c.borderSubtle}` }}>
                      <p className="text-xs font-bold" style={{ color: c.text }}>Historial de movimientos (multi-conductor)</p>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs" style={{ minWidth: '760px' }}>
                        <thead style={{ background: c.bgCardAlt }}>
                          <tr>
                            <th className="px-3 py-2 text-left" style={{ color: c.textMuted }}>Fecha</th>
                            <th className="px-3 py-2 text-left" style={{ color: c.textMuted }}>Conductor</th>
                            <th className="px-3 py-2 text-left" style={{ color: c.textMuted }}>Tipo</th>
                            <th className="px-3 py-2 text-left" style={{ color: c.textMuted }}>Contenedores</th>
                            <th className="px-3 py-2 text-left" style={{ color: c.textMuted }}>Estado</th>
                            {!readOnly && <th className="px-3 py-2 text-left" style={{ color: c.textMuted }}>Acciones</th>}
                          </tr>
                        </thead>
                        <tbody>
                          {r.movimientos.map((m, idx) => (
                            <tr key={m.id} style={{ borderTop: `1px solid ${c.borderSubtle}`, background: idx % 2 === 0 ? 'transparent' : c.bgCardAlt }}>
                              <td className="px-3 py-2" style={{ color: c.textSecondary }}>{new Date(m.fecha).toLocaleString()}</td>
                              <td className="px-3 py-2" style={{ color: c.text }}>{m.conductor}</td>
                              <td className="px-3 py-2" style={{ color: c.text }}>{m.tipo}</td>
                              <td className="px-3 py-2" style={{ color: c.text }}>{m.contenedores.map((d) => `${d.tipo}: ${d.cantidad}`).join(' � ')}</td>
                              <td className="px-3 py-2">
                                <span
                                  className="px-2 py-1 rounded-full font-bold"
                                  style={{
                                    background: m.estado === 'Confirmado' ? 'rgba(34,197,94,0.15)' : m.estado === 'Rechazado' ? 'rgba(239,68,68,0.15)' : 'rgba(245,158,11,0.15)',
                                    color: m.estado === 'Confirmado' ? '#22c55e' : m.estado === 'Rechazado' ? '#ef4444' : '#f59e0b',
                                  }}
                                >
                                  {m.estado}
                                </span>
                                {m.motivoRechazo && <p className="mt-1" style={{ color: '#ef4444' }}>Motivo: {m.motivoRechazo}</p>}
                              </td>
                              {!readOnly && (
                                <td className="px-3 py-2">
                                  <div className="flex items-center gap-2">
                                    <button
                                      onClick={() => confirmarMovimiento(r, m)}
                                      disabled={m.estado !== 'Pendiente'}
                                      className="px-2 py-1 rounded-md font-bold disabled:opacity-40"
                                      style={{ background: 'rgba(34,197,94,0.15)', color: '#22c55e' }}
                                    >
                                      <span className="inline-flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> Confirmar</span>
                                    </button>
                                    <button
                                      onClick={() => rechazarMovimiento(r, m)}
                                      disabled={m.estado !== 'Pendiente'}
                                      className="px-2 py-1 rounded-md font-bold disabled:opacity-40"
                                      style={{ background: 'rgba(239,68,68,0.15)', color: '#ef4444' }}
                                    >
                                      <span className="inline-flex items-center gap-1"><XCircle className="w-3.5 h-3.5" /> Rechazar</span>
                                    </button>
                                  </div>
                                </td>
                              )}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {!readOnly && !tienePendiente && (
                    <p className="text-xs" style={{ color: c.textSecondary }}>
                      No hay movimientos pendientes en este pedido.
                    </p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
