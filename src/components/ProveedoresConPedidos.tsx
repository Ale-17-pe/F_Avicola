import { useMemo, useState } from 'react';
import { Bird, Calendar, ClipboardList, Grid3x3, Plus, Search, Store, UserPlus, Users } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { useTheme, t } from '../contexts/ThemeContext';
import { toast } from 'sonner';

type SubTab = 'nuevo-proveedor' | 'nuevo-pedido';

export function ProveedoresConPedidos() {
  const { tiposAve, proveedores, addProveedor, pedidosProveedor, addPedidoProveedor } = useApp();
  const { isDark } = useTheme();
  const c = t(isDark);

  const [subTab, setSubTab] = useState<SubTab>('nuevo-proveedor');
  const [searchPedido, setSearchPedido] = useState('');

  const [proveedorForm, setProveedorForm] = useState({
    nombre: '',
    ruc: '',
    direccion: '',
    telefono: '',
    contacto: '',
  });

  const [pedidoForm, setPedidoForm] = useState({
    proveedorId: '',
    tipoAve: '',
    variedad: '',
    presentacion: '',
    sexo: 'Mixto' as 'Macho' | 'Hembra' | 'Mixto',
    cantidadJabas: '',
    unidadesPorJaba: '',
    unidadesPorJabaMachos: '',
    unidadesPorJabaHembras: '',
    cantidadDirecta: '',
  });

  const tipoAveSeleccionado = useMemo(
    () => tiposAve.find(t => t.nombre === pedidoForm.tipoAve),
    [tiposAve, pedidoForm.tipoAve],
  );

  const esVivo = pedidoForm.presentacion.toLowerCase().includes('vivo');

  const totalAvesEstimadas = useMemo(() => {
    if (!esVivo) return parseInt(pedidoForm.cantidadDirecta, 10) || 0;
    const jabas = parseInt(pedidoForm.cantidadJabas, 10) || 0;
    if (jabas <= 0) return 0;

    if (tipoAveSeleccionado?.tieneSexo && pedidoForm.sexo === 'Mixto') {
      const m = parseInt(pedidoForm.unidadesPorJabaMachos, 10) || 0;
      const h = parseInt(pedidoForm.unidadesPorJabaHembras, 10) || 0;
      return jabas * (m + h);
    }

    const upj = parseInt(pedidoForm.unidadesPorJaba, 10) || 0;
    return jabas * upj;
  }, [
    esVivo,
    pedidoForm.cantidadDirecta,
    pedidoForm.cantidadJabas,
    pedidoForm.unidadesPorJaba,
    pedidoForm.unidadesPorJabaMachos,
    pedidoForm.unidadesPorJabaHembras,
    pedidoForm.sexo,
    tipoAveSeleccionado,
  ]);

  const historial = useMemo(() => {
    return [...pedidosProveedor]
      .filter(p => {
        const q = searchPedido.trim().toLowerCase();
        if (!q) return true;
        return (
          p.proveedorNombre.toLowerCase().includes(q) ||
          p.tipoAve.toLowerCase().includes(q) ||
          p.estado.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => b.prioridad - a.prioridad);
  }, [pedidosProveedor, searchPedido]);

  const handleSubmitProveedor = (e: React.FormEvent) => {
    e.preventDefault();

    if (!proveedorForm.nombre.trim() || !proveedorForm.ruc.trim()) {
      toast.error('Ingrese nombre y RUC del proveedor');
      return;
    }

    const existeRuc = proveedores.some(p => p.ruc.trim() === proveedorForm.ruc.trim());
    if (existeRuc) {
      toast.error('Ya existe un proveedor con ese RUC');
      return;
    }

    addProveedor({
      id: `prov-${Date.now()}`,
      nombre: proveedorForm.nombre.trim(),
      ruc: proveedorForm.ruc.trim(),
      direccion: proveedorForm.direccion.trim(),
      telefono: proveedorForm.telefono.trim(),
      contacto: proveedorForm.contacto.trim() || undefined,
      estado: 'Activo',
    });

    setProveedorForm({ nombre: '', ruc: '', direccion: '', telefono: '', contacto: '' });
    toast.success('Proveedor registrado correctamente');
  };

  const handleSubmitPedido = (e: React.FormEvent) => {
    e.preventDefault();

    const proveedor = proveedores.find(p => p.id === pedidoForm.proveedorId);
    if (!proveedor) {
      toast.error('Seleccione un proveedor');
      return;
    }
    if (!pedidoForm.tipoAve || !pedidoForm.presentacion) {
      toast.error('Complete tipo de ave y presentacion');
      return;
    }

    const ahora = new Date();
    const fecha = ahora.toISOString().split('T')[0];
    const hora = ahora.toTimeString().slice(0, 5);

    let cantidad = 0;
    let cantidadJabas: number | undefined;
    let unidadesPorJaba: number | undefined;
    let unidadesPorJabaMachos: number | undefined;
    let unidadesPorJabaHembras: number | undefined;

    if (esVivo) {
      const jabas = parseInt(pedidoForm.cantidadJabas, 10) || 0;
      if (jabas <= 0) {
        toast.error('Ingrese una cantidad de jabas valida');
        return;
      }
      cantidadJabas = jabas;

      if (tipoAveSeleccionado?.tieneSexo && pedidoForm.sexo === 'Mixto') {
        const mach = parseInt(pedidoForm.unidadesPorJabaMachos, 10) || 0;
        const hem = parseInt(pedidoForm.unidadesPorJabaHembras, 10) || 0;
        if (mach <= 0 || hem <= 0) {
          toast.error('Ingrese unidades por jaba de machos y hembras');
          return;
        }
        unidadesPorJabaMachos = mach;
        unidadesPorJabaHembras = hem;
        cantidad = jabas * (mach + hem);
      } else {
        const upj = parseInt(pedidoForm.unidadesPorJaba, 10) || 0;
        if (upj <= 0) {
          toast.error('Ingrese unidades por jaba');
          return;
        }
        unidadesPorJaba = upj;
        cantidad = jabas * upj;
      }
    } else {
      cantidad = parseInt(pedidoForm.cantidadDirecta, 10) || 0;
      if (cantidad <= 0) {
        toast.error('Ingrese una cantidad valida');
        return;
      }
    }

    addPedidoProveedor({
      id: `pp-${Date.now()}`,
      proveedorId: proveedor.id,
      proveedorNombre: proveedor.nombre,
      tipoAve: pedidoForm.tipoAve,
      variedad: tipoAveSeleccionado?.tieneVariedad ? (pedidoForm.variedad || undefined) : undefined,
      presentacion: pedidoForm.presentacion,
      sexo: tipoAveSeleccionado?.tieneSexo ? pedidoForm.sexo : undefined,
      cantidad,
      cantidadJabas,
      unidadesPorJaba,
      unidadesPorJabaMachos,
      unidadesPorJabaHembras,
      fecha,
      hora,
      prioridad: Date.now(),
      estado: 'Pendiente Pesaje',
      pesadas: [],
    });

    setPedidoForm({
      proveedorId: '',
      tipoAve: '',
      variedad: '',
      presentacion: '',
      sexo: 'Mixto',
      cantidadJabas: '',
      unidadesPorJaba: '',
      unidadesPorJabaMachos: '',
      unidadesPorJabaHembras: '',
      cantidadDirecta: '',
    });

    toast.success('Pedido de proveedor enviado a Pesaje');
  };

  const totalPendientes = pedidosProveedor.filter(p => p.estado === 'Pendiente Pesaje' || p.estado === 'En Pesaje').length;
  const totalPesados = pedidosProveedor.filter(p => p.estado === 'Pesado').length;

  return (
    <div className="min-h-screen" style={{ color: c.text }}>
      <div className="mb-8">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
          <div className="space-y-2">
            <h1 className="text-4xl font-black" style={{ color: c.text }}>Gestión de Proveedores</h1>
            <p className="text-lg" style={{ color: c.textSecondary }}>Flujo de proveedores con diseño tipo Nuevo Pedido</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="px-4 py-3 rounded-xl" style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)' }}>
              <div className="text-xs uppercase font-bold" style={{ color: '#60a5fa' }}>En Pesaje</div>
              <div className="text-2xl font-black" style={{ color: c.text }}>{totalPendientes}</div>
            </div>
            <div className="px-4 py-3 rounded-xl" style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)' }}>
              <div className="text-xs uppercase font-bold" style={{ color: '#22c55e' }}>Pesados</div>
              <div className="text-2xl font-black" style={{ color: c.text }}>{totalPesados}</div>
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => setSubTab('nuevo-proveedor')}
            className="px-6 py-3 rounded-xl font-bold transition-all hover:scale-[1.02] flex items-center gap-2"
            style={{
              background: subTab === 'nuevo-proveedor' ? 'linear-gradient(to right, #0d4a24, #22c55e)' : c.g10,
              color: subTab === 'nuevo-proveedor' ? '#ffffff' : c.textSecondary,
              border: subTab === 'nuevo-proveedor' ? 'none' : `1px solid ${c.border}`,
            }}
          >
            <UserPlus className="w-4 h-4" /> Nuevo Proveedor
          </button>
          <button
            onClick={() => setSubTab('nuevo-pedido')}
            className="px-6 py-3 rounded-xl font-bold transition-all hover:scale-[1.02] flex items-center gap-2"
            style={{
              background: subTab === 'nuevo-pedido' ? 'linear-gradient(to right, #1e3a8a, #2563eb)' : c.g10,
              color: subTab === 'nuevo-pedido' ? '#ffffff' : c.textSecondary,
              border: subTab === 'nuevo-pedido' ? 'none' : `1px solid ${c.border}`,
            }}
          >
            <Plus className="w-4 h-4" /> Nuevo Pedido
          </button>
        </div>
      </div>

      {subTab === 'nuevo-proveedor' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="rounded-2xl p-6" style={{ background: c.bgCard, border: `1px solid ${c.border}` }}>
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2" style={{ color: c.text }}>
              <UserPlus className="w-5 h-5 text-green-400" /> Registro de Proveedor
            </h2>

            <form onSubmit={handleSubmitProveedor} className="space-y-3">
              <input value={proveedorForm.nombre} onChange={e => setProveedorForm(prev => ({ ...prev, nombre: e.target.value }))} placeholder="Nombre comercial" className="w-full px-4 py-3 rounded-lg" style={{ background: c.bgCardAlt, border: `1px solid ${c.border}`, color: c.text }} />
              <input value={proveedorForm.ruc} onChange={e => setProveedorForm(prev => ({ ...prev, ruc: e.target.value }))} placeholder="RUC" className="w-full px-4 py-3 rounded-lg" style={{ background: c.bgCardAlt, border: `1px solid ${c.border}`, color: c.text }} />
              <input value={proveedorForm.contacto} onChange={e => setProveedorForm(prev => ({ ...prev, contacto: e.target.value }))} placeholder="Contacto" className="w-full px-4 py-3 rounded-lg" style={{ background: c.bgCardAlt, border: `1px solid ${c.border}`, color: c.text }} />
              <input value={proveedorForm.telefono} onChange={e => setProveedorForm(prev => ({ ...prev, telefono: e.target.value }))} placeholder="Telefono" className="w-full px-4 py-3 rounded-lg" style={{ background: c.bgCardAlt, border: `1px solid ${c.border}`, color: c.text }} />
              <input value={proveedorForm.direccion} onChange={e => setProveedorForm(prev => ({ ...prev, direccion: e.target.value }))} placeholder="Direccion" className="w-full px-4 py-3 rounded-lg" style={{ background: c.bgCardAlt, border: `1px solid ${c.border}`, color: c.text }} />

              <button type="submit" className="w-full px-4 py-3 rounded-xl font-semibold transition-all hover:scale-[1.02]" style={{ background: 'linear-gradient(to right, #0d4a24, #22c55e)', color: c.text }}>
                Guardar Proveedor
              </button>
            </form>
          </div>

          <div className="rounded-2xl p-6" style={{ background: c.bgCard, border: `1px solid ${c.border}` }}>
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2" style={{ color: c.text }}>
              <Store className="w-5 h-5 text-blue-400" /> Proveedores Registrados
            </h2>
            <div className="space-y-2 max-h-[460px] overflow-y-auto pr-1">
              {proveedores.length === 0 && <p className="text-sm" style={{ color: c.textMuted }}>No hay proveedores registrados.</p>}
              {proveedores.map(p => (
                <div key={p.id} className="p-4 rounded-xl" style={{ background: c.bgCardAlt, border: `1px solid ${c.borderSubtle}` }}>
                  <div className="flex items-center justify-between">
                    <p className="font-bold" style={{ color: c.text }}>{p.nombre}</p>
                    <span className="text-[10px] px-2 py-1 rounded-full" style={{ background: 'rgba(34,197,94,0.12)', color: '#22c55e' }}>{p.estado}</span>
                  </div>
                  <p className="text-xs mt-1" style={{ color: c.textSecondary }}>RUC: {p.ruc}</p>
                  <p className="text-xs mt-1" style={{ color: c.textMuted }}>{p.contacto || '-'} · {p.telefono || '-'}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {subTab === 'nuevo-pedido' && (
        <div className="space-y-6">
          <div className="rounded-2xl p-6" style={{ background: c.bgCard, border: `1px solid ${c.border}` }}>
            <div className="flex items-center gap-2 mb-4">
              <Bird className="w-5 h-5 text-amber-400" />
              <h2 className="text-xl font-bold" style={{ color: c.text }}>Nuevo Pedido de Proveedor</h2>
            </div>

            <form onSubmit={handleSubmitPedido} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium mb-2" style={{ color: c.textSecondary }}>Proveedor</label>
                  <select value={pedidoForm.proveedorId} onChange={e => setPedidoForm(prev => ({ ...prev, proveedorId: e.target.value }))} className="w-full px-4 py-3 border rounded-lg text-sm" style={{ background: c.bgCardAlt, borderColor: c.border, color: c.text }}>
                    <option value="" style={{ background: c.bgPage, color: c.text }}>Seleccionar...</option>
                    {proveedores.map(p => <option key={p.id} value={p.id} style={{ background: c.bgPage, color: c.text }}>{p.nombre}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium mb-2" style={{ color: c.textSecondary }}>Producto</label>
                  <select value={pedidoForm.tipoAve} onChange={e => setPedidoForm(prev => ({ ...prev, tipoAve: e.target.value, variedad: '', presentacion: '', sexo: 'Mixto' }))} className="w-full px-4 py-3 border rounded-lg text-sm" style={{ background: c.bgCardAlt, borderColor: c.border, color: c.text }}>
                    <option value="" style={{ background: c.bgPage, color: c.text }}>Seleccionar...</option>
                    {tiposAve.map(t => <option key={t.id} value={t.nombre} style={{ background: c.bgPage, color: c.text }}>{t.nombre}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {tipoAveSeleccionado?.tieneVariedad && (
                  <div>
                    <label className="block text-xs font-medium mb-2" style={{ color: c.textSecondary }}>Variedad</label>
                    <select value={pedidoForm.variedad} onChange={e => setPedidoForm(prev => ({ ...prev, variedad: e.target.value }))} className="w-full px-4 py-3 border rounded-lg text-sm" style={{ background: c.bgCardAlt, borderColor: c.border, color: c.text }}>
                      <option value="" style={{ background: c.bgPage, color: c.text }}>Seleccionar...</option>
                      {(tipoAveSeleccionado.variedades || []).map(v => <option key={v} value={v} style={{ background: c.bgPage, color: c.text }}>{v}</option>)}
                    </select>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-medium mb-2" style={{ color: c.textSecondary }}>Presentación</label>
                  <select value={pedidoForm.presentacion} onChange={e => setPedidoForm(prev => ({ ...prev, presentacion: e.target.value }))} disabled={!pedidoForm.tipoAve} className="w-full px-4 py-3 border rounded-lg text-sm disabled:opacity-50" style={{ background: c.bgCardAlt, borderColor: c.border, color: c.text }}>
                    <option value="" style={{ background: c.bgPage, color: c.text }}>Seleccionar...</option>
                    <option value="Vivo" style={{ background: c.bgPage, color: c.text }}>Vivo</option>
                    <option value="Pelado" style={{ background: c.bgPage, color: c.text }}>Pelado</option>
                    <option value="Destripado" style={{ background: c.bgPage, color: c.text }}>Destripado</option>
                  </select>
                </div>
              </div>

              {tipoAveSeleccionado?.tieneSexo && (
                <div>
                  <label className="block text-xs font-medium mb-2" style={{ color: c.textSecondary }}>Sexo</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['Mixto', 'Macho', 'Hembra'] as const).map(s => (
                      <button key={s} type="button" onClick={() => setPedidoForm(prev => ({ ...prev, sexo: s }))}
                        className="px-3 py-2 rounded-lg text-sm font-semibold transition-all"
                        style={{
                          background: pedidoForm.sexo === s ? 'rgba(59,130,246,0.16)' : c.bgCardAlt,
                          color: pedidoForm.sexo === s ? '#60a5fa' : c.textSecondary,
                          border: pedidoForm.sexo === s ? '1px solid rgba(59,130,246,0.45)' : `1px solid ${c.border}`,
                        }}>
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {esVivo ? (
                <>
                  <div>
                    <label className="block text-xs font-medium mb-2" style={{ color: c.textSecondary }}>Cantidad de Jabas</label>
                    <input type="number" min="1" value={pedidoForm.cantidadJabas} onChange={e => setPedidoForm(prev => ({ ...prev, cantidadJabas: e.target.value }))}
                      className="w-full px-4 py-3 border rounded-lg text-sm" style={{ background: c.bgCardAlt, borderColor: c.border, color: c.text }} placeholder="N° de jabas" />
                  </div>

                  {tipoAveSeleccionado?.tieneSexo && pedidoForm.sexo === 'Mixto' ? (
                    <div>
                      <label className="block text-xs font-medium mb-2 flex items-center gap-1" style={{ color: c.textSecondary }}>
                        <Grid3x3 className="w-3 h-3" /> Aves por Jaba (por sexo)
                      </label>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[10px] mb-1" style={{ color: isDark ? '#60a5fa' : '#1d4ed8' }}>♂ Machos / jaba</label>
                          <input type="number" min="1" value={pedidoForm.unidadesPorJabaMachos} onChange={e => setPedidoForm(prev => ({ ...prev, unidadesPorJabaMachos: e.target.value }))}
                            className="w-full px-3 py-2.5 border border-blue-800/30 rounded-lg text-sm" style={{ background: c.bgCardAlt, color: c.text }} placeholder="Ej: 8" />
                        </div>
                        <div>
                          <label className="block text-[10px] mb-1" style={{ color: isDark ? '#fbbf24' : '#b45309' }}>♀ Hembras / jaba</label>
                          <input type="number" min="1" value={pedidoForm.unidadesPorJabaHembras} onChange={e => setPedidoForm(prev => ({ ...prev, unidadesPorJabaHembras: e.target.value }))}
                            className="w-full px-3 py-2.5 border border-amber-800/30 rounded-lg text-sm" style={{ background: c.bgCardAlt, color: c.text }} placeholder="Ej: 8" />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <label className="block text-xs font-medium mb-2 flex items-center gap-1" style={{ color: c.textSecondary }}>
                        <Grid3x3 className="w-3 h-3" /> Unidades por Jaba
                      </label>
                      <input type="number" min="1" value={pedidoForm.unidadesPorJaba} onChange={e => setPedidoForm(prev => ({ ...prev, unidadesPorJaba: e.target.value }))}
                        className="w-full px-4 py-3 border border-amber-800/30 rounded-lg text-sm" style={{ background: c.bgCardAlt, color: c.text }} placeholder="Ej: 10" />
                    </div>
                  )}

                  {totalAvesEstimadas > 0 && (
                    <div className="px-3 py-2 rounded-lg text-xs font-semibold flex items-center justify-between" style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)' }}>
                      <span style={{ color: c.textSecondary }}>Total aves estimadas</span>
                      <span className="font-bold font-mono" style={{ color: isDark ? '#4ade80' : '#166534' }}>🐔 {totalAvesEstimadas} unidades</span>
                    </div>
                  )}
                </>
              ) : (
                <div>
                  <label className="block text-xs font-medium mb-2" style={{ color: c.textSecondary }}>Cantidad Total</label>
                  <input type="number" min="1" value={pedidoForm.cantidadDirecta} onChange={e => setPedidoForm(prev => ({ ...prev, cantidadDirecta: e.target.value }))}
                    className="w-full px-4 py-3 border rounded-lg text-sm" style={{ background: c.bgCardAlt, borderColor: c.border, color: c.text }} placeholder="0" />
                </div>
              )}

              <button type="submit" className="w-full px-4 py-3 rounded-xl font-semibold transition-all hover:scale-[1.02] flex items-center justify-center gap-2" style={{ background: 'linear-gradient(to right, #1e3a8a, #2563eb)', color: c.text }}>
                <Plus className="w-4 h-4" /> Enviar Pedido a Pesaje
              </button>
            </form>
          </div>

          <div className="rounded-2xl overflow-hidden" style={{ background: c.bgCard, border: `1px solid ${c.border}` }}>
            <div className="p-4 border-b" style={{ borderColor: c.borderGold }}>
              <h3 className="text-lg font-bold mb-3" style={{ color: c.text }}>Historial de Pedidos de Proveedor</h3>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: c.textMuted }} />
                <input value={searchPedido} onChange={e => setSearchPedido(e.target.value)} placeholder="Buscar por proveedor, tipo o estado"
                  className="w-full pl-9 pr-3 py-2 rounded-lg" style={{ background: c.bgCardAlt, border: `1px solid ${c.border}`, color: c.text }} />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ background: c.bgTableHeader }}>
                    <th className="px-4 py-3 text-left" style={{ color: c.textSecondary }}><Users className="w-3.5 h-3.5 inline mr-1" />Proveedor</th>
                    <th className="px-4 py-3 text-left" style={{ color: c.textSecondary }}><Bird className="w-3.5 h-3.5 inline mr-1" />Producto</th>
                    <th className="px-4 py-3 text-left" style={{ color: c.textSecondary }}>Detalle</th>
                    <th className="px-4 py-3 text-left" style={{ color: c.textSecondary }}><Calendar className="w-3.5 h-3.5 inline mr-1" />Fecha</th>
                    <th className="px-4 py-3 text-left" style={{ color: c.textSecondary }}><ClipboardList className="w-3.5 h-3.5 inline mr-1" />Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {historial.map(p => (
                    <tr key={p.id} className="border-t" style={{ borderColor: c.borderSubtle }}>
                      <td className="px-4 py-3" style={{ color: c.text }}>{p.proveedorNombre}</td>
                      <td className="px-4 py-3" style={{ color: c.textSecondary }}>{p.tipoAve}{p.variedad ? ` - ${p.variedad}` : ''}</td>
                      <td className="px-4 py-3" style={{ color: c.textSecondary }}>{p.presentacion} · {p.cantidadJabas ? `${p.cantidadJabas} jabas` : p.cantidad} · {p.cantidad} aves</td>
                      <td className="px-4 py-3" style={{ color: c.textMuted }}>{p.fecha} {p.hora}</td>
                      <td className="px-4 py-3">
                        <span className="text-[11px] font-bold px-2 py-1 rounded-full"
                          style={{
                            background: p.estado === 'Pesado' ? 'rgba(34,197,94,0.16)' : p.estado === 'En Pesaje' ? 'rgba(245,158,11,0.16)' : 'rgba(59,130,246,0.16)',
                            color: p.estado === 'Pesado' ? '#22c55e' : p.estado === 'En Pesaje' ? '#f59e0b' : '#60a5fa',
                          }}>
                          {p.estado}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {historial.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center" style={{ color: c.textMuted }}>No hay pedidos para mostrar.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
