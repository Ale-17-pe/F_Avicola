import { useMemo, useState } from 'react';
import { Box, CheckCircle2, ClipboardList, Package, Truck, User, Clock } from 'lucide-react';
import { useApp, PedidoConfirmado, RecojoContenedor } from '../contexts/AppContext';
import { useAuth } from '../contexts/AuthContext';
import { useTheme, t } from '../contexts/ThemeContext';
import { toast } from 'sonner';

const extraerZonaId = (zona?: string, zonaId?: string) => {
  if (zonaId) return zonaId;
  if (!zona) return '';
  const match = zona.match(/Zona\s*(\d+)/i);
  return match?.[1] || '';
};

export function RecojoContenedoresConductor() {
  const {
    pedidosConfirmados,
    vehiculos,
    recojosContenedores,
    addRecojoContenedor,
  } = useApp();
  const { user } = useAuth();
  const { isDark } = useTheme();
  const c = t(isDark);

  const [pedidoSeleccionado, setPedidoSeleccionado] = useState<PedidoConfirmado | null>(null);

  const conductorIdActual = user?.conductorRegistradoId || null;
  const conductorNombreActual = `${user?.nombre || ''} ${user?.apellido || ''}`.trim();

  const pedidosAsignadosConductor = useMemo(() => {
    return pedidosConfirmados.filter((p) => {
      if (!p.ticketEmitido) return false;
      if (!conductorIdActual && !conductorNombreActual) return false;

      if (p.conductorId && conductorIdActual) return p.conductorId === conductorIdActual;
      return p.conductor === conductorNombreActual;
    });
  }, [pedidosConfirmados, conductorIdActual, conductorNombreActual]);

  const moduloHabilitado = useMemo(() => {
    const zonasConductor = new Set(
      pedidosAsignadosConductor
        .map((p) => extraerZonaId(p.zonaEntrega, p.zonaEntregaId))
        .filter(Boolean)
    );

    return Array.from(zonasConductor).some((zonaId) =>
      vehiculos.some((v) => v.zona === zonaId && v.estado === 'En Ruta')
    );
  }, [pedidosAsignadosConductor, vehiculos]);

  const recojosPorPedidoId = useMemo(() => {
    const map = new Map<string, RecojoContenedor>();
    recojosContenedores.forEach((r) => map.set(r.pedidoId, r));
    return map;
  }, [recojosContenedores]);

  const pedidosListosParaRecojo = useMemo(() => {
    return pedidosAsignadosConductor
      .filter((p) => p.estado === 'Entregado')
      .filter((p) => (p.contenedoresDetalle || []).length > 0);
  }, [pedidosAsignadosConductor]);

  const pendientesRecepcion = useMemo(() => {
    return pedidosListosParaRecojo.filter((p) => !recojosPorPedidoId.has(p.id));
  }, [pedidosListosParaRecojo, recojosPorPedidoId]);

  const recepcionesRegistradas = useMemo(() => {
    return recojosContenedores
      .filter((r) => {
        if (!conductorIdActual && !conductorNombreActual) return false;
        if (conductorIdActual && r.conductorId) return r.conductorId === conductorIdActual;
        return r.conductor === conductorNombreActual;
      })
      .sort((a, b) => new Date(b.fechaRecepcion).getTime() - new Date(a.fechaRecepcion).getTime());
  }, [recojosContenedores, conductorIdActual, conductorNombreActual]);

  const registrarRecojo = (pedido: PedidoConfirmado) => {
    if (!moduloHabilitado) {
      toast.error('Recojo inhabilitado: Seguridad debe mantener el vehiculo en En Ruta');
      return;
    }

    if (!pedido.conductorId || !pedido.zonaEntregaId) {
      toast.error('Pedido sin asignacion completa de conductor o zona');
      return;
    }

    const detalle = pedido.contenedoresDetalle || [];
    if (detalle.length === 0) {
      toast.error('Este pedido no tiene contenedores registrados');
      return;
    }

    const nuevo: RecojoContenedor = {
      id: `REC-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
      pedidoId: pedido.id,
      cliente: pedido.cliente,
      conductorId: pedido.conductorId,
      conductor: pedido.conductor,
      zonaEntregaId: pedido.zonaEntregaId,
      zonaEntrega: pedido.zonaEntrega,
      numeroTicket: pedido.numeroTicket,
      contenedores: detalle,
      fechaRecepcion: new Date().toISOString(),
      estado: 'Pendiente Ingreso',
    };

    addRecojoContenedor(nuevo);
    toast.success('Recojo registrado. Se ingresara al almacen cuando Seguridad cambie a Disponible');
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20 px-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2" style={{ color: c.text }}>
            <ClipboardList className="text-blue-400" /> Recojo de Contenedores
          </h1>
          <p className="text-sm" style={{ color: c.textSecondary }}>
            Registra contenedores recibidos en clientes. El ingreso al almacen se aplica cuando Seguridad cambia a Disponible.
          </p>
        </div>
      </div>

      {!moduloHabilitado && (
        <div className="rounded-2xl p-8 sm:p-10 text-center" style={{ background: c.bgCard, border: '1px solid rgba(245,158,11,0.3)' }}>
          <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center" style={{ background: 'rgba(245,158,11,0.1)', border: '2px solid rgba(245,158,11,0.3)' }}>
            <Truck className="w-8 h-8" style={{ color: '#f59e0b' }} />
          </div>
          <h2 className="text-xl font-bold mb-2" style={{ color: c.text }}>Recojo no aperturado</h2>
          <p className="text-sm" style={{ color: c.textSecondary }}>
            Seguridad debe tener el vehiculo de tu zona en <strong style={{ color: '#3b82f6' }}>En Ruta</strong> para habilitar este modulo.
          </p>
        </div>
      )}

      {moduloHabilitado && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="rounded-xl p-4" style={{ background: c.bgCard, border: `1px solid ${c.border}` }}>
              <p className="text-xs uppercase tracking-wider" style={{ color: c.textMuted }}>Pendientes de Recepcion</p>
              <p className="text-2xl font-bold mt-1" style={{ color: '#f59e0b' }}>{pendientesRecepcion.length}</p>
            </div>
            <div className="rounded-xl p-4" style={{ background: c.bgCard, border: `1px solid ${c.border}` }}>
              <p className="text-xs uppercase tracking-wider" style={{ color: c.textMuted }}>Registrados Pendiente Ingreso</p>
              <p className="text-2xl font-bold mt-1" style={{ color: '#3b82f6' }}>
                {recepcionesRegistradas.filter(r => r.estado === 'Pendiente Ingreso').length}
              </p>
            </div>
            <div className="rounded-xl p-4" style={{ background: c.bgCard, border: `1px solid ${c.border}` }}>
              <p className="text-xs uppercase tracking-wider" style={{ color: c.textMuted }}>Ingresados en Almacen</p>
              <p className="text-2xl font-bold mt-1" style={{ color: '#22c55e' }}>
                {recepcionesRegistradas.filter(r => r.estado === 'Ingresado Almacen').length}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="rounded-xl overflow-hidden" style={{ background: c.bgCard, border: `1px solid ${c.border}` }}>
              <div className="px-4 py-3" style={{ borderBottom: `1px solid ${c.borderSubtle}` }}>
                <h3 className="font-bold" style={{ color: c.text }}>Clientes Pendientes de Recojo</h3>
              </div>

              {pendientesVacios(pendientesRecepcion) ? (
                <div className="p-6 text-center">
                  <Package className="w-10 h-10 mx-auto mb-2" style={{ color: c.textMuted }} />
                  <p className="text-sm" style={{ color: c.textSecondary }}>No hay pedidos entregados pendientes de recepcion</p>
                </div>
              ) : (
                <div className="divide-y" style={{ borderColor: c.borderSubtle }}>
                  {pendientesRecepcion.map((pedido) => (
                    <button
                      key={pedido.id}
                      onClick={() => setPedidoSeleccionado(pedido)}
                      className="w-full text-left px-4 py-3 hover:bg-white/5 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold" style={{ color: c.text }}>{pedido.cliente}</p>
                          <p className="text-xs" style={{ color: c.textSecondary }}>
                            Ticket: {pedido.numeroTicket || 'S/N'} · Zona: {pedido.zonaEntrega || 'Sin zona'}
                          </p>
                        </div>
                        <span className="text-[11px] px-2 py-1 rounded-full" style={{ background: 'rgba(245,158,11,0.12)', color: '#f59e0b' }}>
                          Pendiente
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-xl overflow-hidden" style={{ background: c.bgCard, border: `1px solid ${c.border}` }}>
              <div className="px-4 py-3" style={{ borderBottom: `1px solid ${c.borderSubtle}` }}>
                <h3 className="font-bold" style={{ color: c.text }}>Detalle del Recojo</h3>
              </div>

              {!pedidoSeleccionado ? (
                <div className="p-6 text-center">
                  <User className="w-10 h-10 mx-auto mb-2" style={{ color: c.textMuted }} />
                  <p className="text-sm" style={{ color: c.textSecondary }}>Selecciona un cliente para revisar sus contenedores</p>
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

                  <div className="space-y-2">
                    {(pedidoSeleccionado.contenedoresDetalle || []).map((item, idx) => (
                      <div key={`${item.tipo}-${idx}`} className="rounded-lg px-3 py-2 flex items-center justify-between" style={{ background: c.bgCardAlt, border: `1px solid ${c.borderSubtle}` }}>
                        <div className="flex items-center gap-2">
                          <Box className="w-4 h-4 text-blue-400" />
                          <span className="text-sm" style={{ color: c.text }}>{item.tipo}</span>
                        </div>
                        <div className="text-xs text-right" style={{ color: c.textSecondary }}>
                          <div>{item.cantidad} und</div>
                          <div>{item.pesoTotal.toFixed(2)} kg tara</div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={() => {
                      registrarRecojo(pedidoSeleccionado);
                      setPedidoSeleccionado(null);
                    }}
                    className="w-full py-2.5 rounded-xl font-bold text-white flex items-center justify-center gap-2"
                    style={{ background: 'linear-gradient(135deg, #0d4a24, #22c55e)' }}
                  >
                    <CheckCircle2 className="w-4 h-4" /> Recibir Contenedores
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="rounded-xl overflow-hidden" style={{ background: c.bgCard, border: `1px solid ${c.border}` }}>
            <div className="px-4 py-3" style={{ borderBottom: `1px solid ${c.borderSubtle}` }}>
              <h3 className="font-bold" style={{ color: c.text }}>Recepciones Registradas</h3>
            </div>

            {recepcionesRegistradas.length === 0 ? (
              <div className="p-6 text-center">
                <Clock className="w-10 h-10 mx-auto mb-2" style={{ color: c.textMuted }} />
                <p className="text-sm" style={{ color: c.textSecondary }}>Aun no registras recepciones de contenedores</p>
              </div>
            ) : (
              <div className="divide-y" style={{ borderColor: c.borderSubtle }}>
                {recepcionesRegistradas.map((rec) => (
                  <div key={rec.id} className="px-4 py-3 flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold" style={{ color: c.text }}>{rec.cliente}</p>
                      <p className="text-xs" style={{ color: c.textSecondary }}>
                        Ticket: {rec.numeroTicket || 'S/N'} · Contenedores: {rec.contenedores.reduce((s, i) => s + i.cantidad, 0)} und
                      </p>
                      <p className="text-xs" style={{ color: c.textMuted }}>
                        Recepcion: {new Date(rec.fechaRecepcion).toLocaleString('es-PE')}
                        {rec.fechaIngreso ? ` · Ingreso: ${new Date(rec.fechaIngreso).toLocaleString('es-PE')}` : ''}
                      </p>
                    </div>
                    <span
                      className="text-[11px] px-2 py-1 rounded-full"
                      style={rec.estado === 'Ingresado Almacen'
                        ? { background: 'rgba(34,197,94,0.12)', color: '#22c55e' }
                        : { background: 'rgba(59,130,246,0.12)', color: '#3b82f6' }}
                    >
                      {rec.estado}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function pendientesVacios(pendientes: PedidoConfirmado[]) {
  return pendientes.length === 0;
}
