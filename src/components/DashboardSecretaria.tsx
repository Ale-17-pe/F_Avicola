import { useState, useEffect } from 'react';
import { FileSpreadsheet, DollarSign, Scale, Package, Save, Edit3, CheckCircle, Calendar, Download, RefreshCw, Search, ChevronDown, ChevronUp } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { toast } from 'sonner';

// Interfaz para cada fila de la cartera de cobro
interface FilaCartera {
  id: string;
  pedidoId: string;
  cliente: string;
  tipo: string; // Tipo de ave/producto
  presentacion: string;
  cantidad: number; // Jabas si vivo, unidades M/H si destripado/desplumado
  cantidadLabel: string; // "jabas" o "unids M/H"
  merma: number; // merma por presentación (kg)
  tara: number; // peso del contenedor (kg)
  contenedorTipo: string;
  devolucionPeso: number; // peso de lo devuelto
  devolucionCantidad: number; // unidades devueltas
  repesada: number; // lo que pesó el cliente (kg)
  pesoPedido: number; // peso neto del pedido (sin contenedores)
  pesoContenedor: number; // peso de los contenedores
  pesoBruto: number; // peso total del pedido (incluye contenedores)
  pesoNeto: number; // pesoPedido + merma - devolucionPeso
  precio: number; // precio por kg del tipo de producto
  total: number; // pesoNeto * precio
  confirmado: boolean;
  editando: boolean;
  fecha: string; // YYYY-MM-DD
  zona: string; // Zona de entrega
  conductor: string; // Nombre del conductor
}

// Interfaz de la data de pesaje que viene de ListaPedidos
interface PedidoPesajeData {
  id: string;
  numeroPedido: string;
  cliente: string;
  producto: string;
  cantidad: number;
  cantidadJabas?: number;
  unidadesPorJaba?: number;
  presentacion: string;
  contenedor: string;
  numeroContenedores?: number;
  pesoContenedores?: number;
  pesoBruto?: number;
  conductor?: any;
  estadoPesaje: string;
  fechaPesaje?: string;
  horaPesaje?: string;
  cantidadMachos?: number;
  cantidadHembras?: number;
  variedad?: string;
}

const hoyStr = () => new Date().toISOString().split('T')[0];

export function DashboardSecretaria() {
  const { costosClientes, presentaciones, contenedores, clientes, tiposAve } = useApp();

  const [filasCartera, setFilasCartera] = useState<FilaCartera[]>([]);
  const [fechaSeleccionada, setFechaSeleccionada] = useState(hoyStr());
  const [busqueda, setBusqueda] = useState('');
  const [editandoAll, setEditandoAll] = useState(false);
  const [sortColumn, setSortColumn] = useState<string>('');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  // Key de localStorage por día
  const storageKey = (fecha: string) => `carteraCobro_${fecha}`;

  // Cargar datos del día seleccionado
  useEffect(() => {
    try {
      const data = localStorage.getItem(storageKey(fechaSeleccionada));
      if (data) {
        setFilasCartera(JSON.parse(data));
      } else {
        // Intentar generar desde los datos de pesaje del día
        generarDesdePesajeControl();
      }
    } catch {
      setFilasCartera([]);
    }
  }, [fechaSeleccionada]);

  // Generar filas desde pedidosPesajeControl (datos completados)
  const generarDesdePesajeControl = () => {
    try {
      const raw = localStorage.getItem('pedidosPesajeControl');
      if (!raw) { setFilasCartera([]); return; }

      const pesajeData: PedidoPesajeData[] = JSON.parse(raw);
      const delDia = pesajeData.filter(p => p.fechaPesaje === fechaSeleccionada);

      if (delDia.length === 0) { setFilasCartera([]); return; }

      const nuevasFilas: FilaCartera[] = delDia.map(p => {
        const esVivo = p.presentacion?.toLowerCase().includes('vivo');

        // Cantidad: jabas si vivo, unidades M/H si destripado/desplumado
        const cantidadDisplay = esVivo
          ? (p.cantidadJabas || p.cantidad)
          : p.cantidad;
        const cantidadLabel = esVivo ? 'jabas' : `unids${p.cantidadMachos ? ` (${p.cantidadMachos}M/${p.cantidadHembras || 0}H)` : ''}`;

        // Merma: buscar en presentaciones
        const pres = presentaciones.find(pr =>
          pr.tipoAve.toLowerCase() === p.producto.toLowerCase() &&
          pr.nombre.toLowerCase() === p.presentacion.toLowerCase()
        );
        const mermaPorUnidad = pres?.mermaKg || 0;
        const mermaTotal = mermaPorUnidad * p.cantidad;

        // Tara: peso del contenedor (ya viene calculado desde pesaje)
        const pesoContenedor = p.pesoContenedores || 0;

        // Peso Pedido: peso bruto - peso contenedores (lo que realmente pesa el producto)
        const pesoBruto = p.pesoBruto || 0;
        const pesoPedido = pesoBruto - pesoContenedor;

        // Peso neto para cobro: pesoPedido + mermaTotal - devolucion
        const pesoNeto = pesoPedido + mermaTotal;

        // Precio: buscar en costosClientes de forma más robusta
        let precio = 0;

        // 1. Buscar IDs de cliente y tipo de ave
        const clienteObj = clientes.find(c => c.nombre === p.cliente);
        const tipoAveObj = tiposAve.find(t => t.nombre === p.producto || t.nombre === p.tipo); // p.producto o p.tipo según historial

        if (clienteObj && tipoAveObj) {
          // 2. Determinar sexo del pedido
          let sexoPedido = 'Mixto';
          if (p.cantidadMachos > 0 && (!p.cantidadHembras || p.cantidadHembras === 0)) sexoPedido = 'Macho';
          else if (p.cantidadHembras > 0 && (!p.cantidadMachos || p.cantidadMachos === 0)) sexoPedido = 'Hembra';

          // 3. Buscar precio específico
          // Prioridad 1: Coincidencia exacta (Cliente + Tipo + Variedad + Sexo)
          // Prioridad 2: Sin variedad (Cliente + Tipo + Sexo)
          // Prioridad 3: Sin sexo (Cliente + Tipo + Variedad)
          // Prioridad 4: Solo Tipo (Cliente + Tipo)

          // Limpiar variedad del pedido (quitar parentesis si existen)
          const variedadPedido = p.presentacion?.includes('(')
            ? p.presentacion.match(/\((.*?)\)/)?.[1]
            : null; // La variedad suele estar en el nombre del tipoAve o presentación? 
          // En p.producto viene "Pollo (Cobb)", "Pollo", etc.

          const variedadReal = p.producto.includes('(')
            ? p.producto.match(/\((.*?)\)/)?.[1]
            : p.variedad;

          const costosDelCliente = costosClientes.filter(cc => cc.clienteId === clienteObj.id && cc.tipoAveId === tipoAveObj.id);

          // Intentar encontrar el mejor precio
          let costoEncontrado = costosDelCliente.find(cc =>
            (cc.variedad === variedadReal || (!cc.variedad && !variedadReal)) &&
            (cc.sexo === sexoPedido || cc.sexo === 'Mixto' || !cc.sexo)
          );

          if (!costoEncontrado && variedadReal) {
            // Intentar sin variedad pero con sexo
            costoEncontrado = costosDelCliente.find(cc => !cc.variedad && cc.sexo === sexoPedido);
          }

          if (!costoEncontrado) {
            // Intentar cualquiera del mismo tipo
            costoEncontrado = costosDelCliente.find(cc => !cc.variedad && (!cc.sexo || cc.sexo === 'Mixto'));
          }

          if (costoEncontrado) {
            precio = costoEncontrado.precioPorKg;
          }
        } else {
          // Fallback búsqueda simple por nombre si faltan IDs (compatibilidad)
          const costoCliente = costosClientes.find(cc =>
            cc.clienteNombre.toLowerCase() === p.cliente.toLowerCase() &&
            cc.tipoAveNombre.toLowerCase() === p.producto.toLowerCase()
          );
          if (costoCliente) precio = costoCliente.precioPorKg;
        }

        // Zona del conductor
        const zonaCompleta = typeof p.conductor === 'object' ? p.conductor?.zonaAsignada : '';
        const zonaMatch = zonaCompleta?.match(/(\d+)/);
        const zona = zonaMatch ? `Zona ${zonaMatch[1]}` : (zonaCompleta || '—');

        // Nombre del conductor
        const conductorNombre = typeof p.conductor === 'object' ? p.conductor?.nombre : p.conductor || '—';

        // Total
        const total = pesoNeto * precio;

        return {
          id: p.id,
          pedidoId: p.numeroPedido || p.id,
          cliente: p.cliente,
          tipo: p.producto,
          presentacion: p.presentacion,
          cantidad: cantidadDisplay,
          cantidadLabel,
          merma: mermaTotal,
          tara: 0, // Ya no usamos tara separada, viene en pesoContenedor
          contenedorTipo: p.contenedor,
          devolucionPeso: 0,
          devolucionCantidad: 0,
          repesada: 0,
          pesoPedido: Math.max(0, pesoPedido),
          pesoContenedor,
          pesoBruto,
          pesoNeto: Math.max(0, pesoNeto),
          precio,
          total: Math.max(0, total),
          confirmado: false,
          editando: false,
          fecha: fechaSeleccionada,
          zona,
          conductor: conductorNombre,
        };
      });

      setFilasCartera(nuevasFilas);
    } catch {
      setFilasCartera([]);
    }
  };

  // Guardar automáticamente cuando cambian las filas
  useEffect(() => {
    if (filasCartera.length > 0) {
      localStorage.setItem(storageKey(fechaSeleccionada), JSON.stringify(filasCartera));
    }
  }, [filasCartera, fechaSeleccionada]);

  // Recalcular fila cuando cambian valores editables
  const recalcularFila = (fila: FilaCartera): FilaCartera => {
    // Peso Neto = Peso Pedido + Merma - Devolución
    const pesoNeto = fila.pesoPedido + fila.merma - fila.devolucionPeso;
    const total = Math.max(0, pesoNeto) * fila.precio;
    return { ...fila, pesoNeto: Math.max(0, pesoNeto), total };
  };

  // Actualizar un campo editable
  const actualizarCampo = (id: string, campo: keyof FilaCartera, valor: any) => {
    setFilasCartera(prev => prev.map(f => {
      if (f.id !== id) return f;
      const updated = { ...f, [campo]: valor };
      return recalcularFila(updated);
    }));
  };

  // Confirmar fila
  const confirmarFila = (id: string) => {
    setFilasCartera(prev => prev.map(f =>
      f.id === id ? { ...f, confirmado: true, editando: false } : f
    ));
    toast.success('Fila confirmada');
  };

  // Habilitar edición de fila
  const editarFila = (id: string) => {
    setFilasCartera(prev => prev.map(f =>
      f.id === id ? { ...f, editando: true, confirmado: false } : f
    ));
  };

  // Confirmar todas
  const confirmarTodas = () => {
    setFilasCartera(prev => prev.map(f => ({ ...f, confirmado: true, editando: false })));
    setEditandoAll(false);
    toast.success('Todas las filas confirmadas');
  };

  // Editar todas
  const editarTodas = () => {
    setFilasCartera(prev => prev.map(f => ({ ...f, editando: true, confirmado: false })));
    setEditandoAll(true);
  };

  // Refrescar desde pesaje
  const refrescar = () => {
    generarDesdePesajeControl();
    toast.success('Datos actualizados desde pesaje');
  };

  // Exportar CSV
  const exportarCSV = () => {
    const headers = ['Cliente', 'Tipo', 'Presentación', 'Cantidad', 'Peso Pedido (kg)', 'Peso Contenedor (kg)', 'Peso Bruto (kg)', 'Merma (kg)', 'Devolución (kg)', 'Peso Neto (kg)', 'Precio S/', 'Total S/', 'Zona', 'Conductor'];
    const rows = filasFiltradas.map(f => [
      f.cliente, f.tipo, f.presentacion, `${f.cantidad} ${f.cantidadLabel}`,
      f.pesoPedido.toFixed(2), f.pesoContenedor.toFixed(2), f.pesoBruto.toFixed(2),
      f.merma.toFixed(2), f.devolucionPeso.toFixed(2),
      f.pesoNeto.toFixed(2), f.precio.toFixed(2), f.total.toFixed(2),
      f.zona, f.conductor
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `cartera_cobro_${fechaSeleccionada}.csv`;
    link.click();
  };

  // Filtrar
  const filasFiltradas = filasCartera.filter(f => {
    if (!busqueda) return true;
    const q = busqueda.toLowerCase();
    return f.cliente.toLowerCase().includes(q) || f.tipo.toLowerCase().includes(q);
  });

  // Ordenar
  const filasOrdenadas = [...filasFiltradas].sort((a, b) => {
    if (!sortColumn) return 0;
    const va = (a as any)[sortColumn];
    const vb = (b as any)[sortColumn];
    if (va < vb) return sortDir === 'asc' ? -1 : 1;
    if (va > vb) return sortDir === 'asc' ? 1 : -1;
    return 0;
  });

  const handleSort = (col: string) => {
    if (sortColumn === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortColumn(col); setSortDir('asc'); }
  };

  // Estadísticas
  const totalVentas = filasCartera.reduce((s, f) => s + f.total, 0);
  const totalPesoPedido = filasCartera.reduce((s, f) => s + f.pesoPedido, 0);
  const totalPesoContenedor = filasCartera.reduce((s, f) => s + f.pesoContenedor, 0);
  const totalPesoBruto = filasCartera.reduce((s, f) => s + f.pesoBruto, 0);
  const totalPesoNeto = filasCartera.reduce((s, f) => s + f.pesoNeto, 0);

  // Input editable
  const EditInput = ({ value, onChange, disabled = false, type = 'number', step = '0.01', min = '0', className = '' }: { value: number | string; onChange: (v: any) => void; disabled?: boolean; type?: string; step?: string; min?: string; className?: string }) => (
    <input
      type={type}
      step={step}
      min={min}
      value={value}
      onChange={(e) => onChange(type === 'number' ? parseFloat(e.target.value) || 0 : e.target.value)}
      disabled={disabled}
      className={`w-full px-2 py-1.5 rounded-lg text-sm text-right font-mono transition-all ${disabled ? 'bg-transparent text-gray-400 cursor-default' : 'bg-zinc-800 border border-amber-500/30 text-white focus:border-amber-500 focus:outline-none'} ${className}`}
    />
  );

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl" style={{ background: 'rgba(204,170,0,0.08)', border: '1px solid rgba(204,170,0,0.25)', boxShadow: '0 0 20px rgba(204,170,0,0.1)' }}>
            <DollarSign className="w-6 h-6" style={{ color: '#ccaa00' }} />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">Cartera de Cobro</h1>
            <p className="text-gray-500 text-xs">Registro diario de pesajes y cobros · Se reinicia cada día</p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Selector de fecha */}
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl" style={{ background: 'rgba(204,170,0,0.08)', border: '1px solid rgba(204,170,0,0.2)' }}>
            <Calendar className="w-4 h-4" style={{ color: '#ccaa00' }} />
            <input
              type="date"
              value={fechaSeleccionada}
              onChange={(e) => setFechaSeleccionada(e.target.value)}
              className="bg-transparent text-white text-sm outline-none"
            />
          </div>
          <button onClick={refrescar} className="px-3 py-2 rounded-xl text-xs font-semibold transition-all hover:scale-105 flex items-center gap-1.5" style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.25)', color: '#3b82f6' }}>
            <RefreshCw className="w-3.5 h-3.5" /> Actualizar
          </button>
          <button onClick={exportarCSV} className="px-3 py-2 rounded-xl text-xs font-semibold transition-all hover:scale-105 flex items-center gap-1.5" style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.25)', color: '#22c55e' }}>
            <Download className="w-3.5 h-3.5" /> CSV
          </button>
        </div>
      </div>

      {/* Métricas */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: 'Total Ventas', value: `S/ ${totalVentas.toFixed(2)}`, icon: DollarSign, color: '#22c55e', border: 'rgba(34,197,94,0.3)' },
          { label: 'Peso Pedido', value: `${totalPesoPedido.toFixed(1)} kg`, icon: Scale, color: '#22c55e', border: 'rgba(34,197,94,0.3)' },
          { label: 'Peso Contenedor', value: `${totalPesoContenedor.toFixed(1)} kg`, icon: Package, color: '#ef4444', border: 'rgba(239,68,68,0.3)' },
          { label: 'Peso Bruto', value: `${totalPesoBruto.toFixed(1)} kg`, icon: Scale, color: '#f59e0b', border: 'rgba(245,158,11,0.3)' },
          { label: 'Peso Neto', value: `${totalPesoNeto.toFixed(1)} kg`, icon: Package, color: '#06b6d4', border: 'rgba(6,182,212,0.3)' },
        ].map(m => (
          <div key={m.label} className="backdrop-blur-xl rounded-xl p-4" style={{ background: 'rgba(0,0,0,0.3)', border: `1px solid ${m.border}` }}>
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">{m.label}</p>
              <m.icon className="w-4 h-4" style={{ color: m.color }} />
            </div>
            <p className="text-xl md:text-2xl font-bold" style={{ color: m.color }}>{m.value}</p>
          </div>
        ))}
      </div>

      {/* Controles */}
      <div className="flex items-center justify-between gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            placeholder="Buscar cliente, tipo..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm text-white placeholder-gray-500 outline-none"
            style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(204,170,0,0.15)' }}
          />
        </div>
        <div className="flex items-center gap-2">
          <button onClick={editarTodas} className="px-4 py-2 rounded-xl text-xs font-bold transition-all hover:scale-105 flex items-center gap-1.5" style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', color: '#f59e0b' }}>
            <Edit3 className="w-3.5 h-3.5" /> Editar Todo
          </button>
          <button onClick={confirmarTodas} className="px-4 py-2 rounded-xl text-xs font-bold transition-all hover:scale-105 flex items-center gap-1.5" style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)', color: '#22c55e' }}>
            <Save className="w-3.5 h-3.5" /> Confirmar Todo
          </button>
        </div>
      </div>

      {/* Indicador de día */}
      <div className="flex items-center gap-2 px-3 py-2 rounded-xl" style={{ background: 'rgba(204,170,0,0.04)', border: '1px solid rgba(204,170,0,0.1)' }}>
        <Calendar className="w-4 h-4" style={{ color: '#ccaa00' }} />
        <span className="text-xs text-gray-400">Mostrando datos de</span>
        <span className="text-sm font-bold" style={{ color: '#ccaa00' }}>{fechaSeleccionada === hoyStr() ? 'HOY' : fechaSeleccionada}</span>
        <span className="text-xs text-gray-500 ml-auto">{filasCartera.length} registros</span>
      </div>

      {/* TABLA PRINCIPAL - CARTERA DE COBRO */}
      <div className="backdrop-blur-xl rounded-xl overflow-hidden" style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(204,170,0,0.2)', boxShadow: '0 0 30px rgba(204,170,0,0.04)' }}>

        <div className="px-5 py-3 border-b flex items-center justify-between" style={{ background: 'linear-gradient(to right, rgba(204,170,0,0.06), rgba(0,0,0,0.3))', borderColor: 'rgba(204,170,0,0.15)' }}>
          <h2 className="text-sm md:text-base font-bold text-white flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5" style={{ color: '#ccaa00' }} />
            Cartera de Cobro - Detalle
          </h2>
          <span className="text-xs px-2.5 py-1 rounded-full font-bold" style={{ background: 'rgba(204,170,0,0.1)', color: '#ccaa00', border: '1px solid rgba(204,170,0,0.2)' }}>
            {filasOrdenadas.length} filas
          </span>
        </div>

        {filasOrdenadas.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <FileSpreadsheet className="w-16 h-16 mx-auto mb-4 text-gray-700" />
            <p className="text-gray-400 text-base mb-2">No hay registros para este día</p>
            <p className="text-gray-600 text-sm mb-4">Los datos se generan automáticamente desde el módulo de pesaje</p>
            <button onClick={refrescar} className="px-4 py-2 rounded-xl text-sm font-semibold transition-all hover:scale-105" style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.25)', color: '#3b82f6' }}>
              <RefreshCw className="w-4 h-4 inline mr-2" /> Cargar desde pesaje
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full" style={{ minWidth: '1600px' }}>
              <thead>
                <tr style={{ background: 'rgba(204,170,0,0.04)', borderBottom: '2px solid rgba(204,170,0,0.15)' }}>
                  {[
                    { key: 'cliente', label: 'CLIENTE', w: 'w-36' },
                    { key: 'tipo', label: 'TIPO', w: 'w-24' },
                    { key: 'presentacion', label: 'PRES.', w: 'w-20' },
                    { key: 'cantidad', label: 'CANTIDAD', w: 'w-20' },
                    { key: 'pesoPedido', label: 'P. PEDIDO (kg)', w: 'w-24' },
                    { key: 'pesoContenedor', label: 'P. CONT. (kg)', w: 'w-24' },
                    { key: 'pesoBruto', label: 'P. BRUTO (kg)', w: 'w-24' },
                    { key: 'merma', label: 'MERMA (kg)', w: 'w-20' },
                    { key: 'devolucionPeso', label: 'DEVOL. (kg)', w: 'w-20' },
                    { key: 'pesoNeto', label: 'P. NETO (kg)', w: 'w-24' },
                    { key: 'precio', label: 'PRECIO S/', w: 'w-20' },
                    { key: 'total', label: 'TOTAL S/', w: 'w-24' },
                    { key: 'zona', label: 'ZONA', w: 'w-20' },
                    { key: 'conductor', label: 'CONDUCTOR', w: 'w-28' },
                    { key: 'acciones', label: '', w: 'w-16' },
                  ].map(col => (
                    <th
                      key={col.key}
                      className={`px-2 py-3 text-left ${col.w} cursor-pointer select-none hover:bg-amber-900/5 transition-colors`}
                      onClick={() => col.key !== 'acciones' && col.key !== 'diferencia' && handleSort(col.key)}
                    >
                      <div className="flex items-center gap-1">
                        <span className="text-[9px] font-bold uppercase tracking-widest" style={{ color: '#ccaa00' }}>
                          {col.label}
                        </span>
                        {sortColumn === col.key && (
                          sortDir === 'asc' ? <ChevronUp className="w-3 h-3 text-amber-400" /> : <ChevronDown className="w-3 h-3 text-amber-400" />
                        )}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filasOrdenadas.map((fila, idx) => {
                  const puedeEditar = fila.editando || editandoAll;

                  return (
                    <tr
                      key={fila.id}
                      className={`border-b transition-colors duration-150 hover:bg-amber-900/5 ${fila.confirmado ? 'opacity-90' : ''}`}
                      style={{
                        borderColor: 'rgba(204,170,0,0.06)',
                        background: idx % 2 === 0 ? 'transparent' : 'rgba(204,170,0,0.015)'
                      }}
                    >
                      {/* CLIENTE - no editable */}
                      <td className="px-2 py-2.5">
                        <span className="text-white font-semibold text-sm truncate block max-w-[150px]">{fila.cliente}</span>
                      </td>

                      {/* TIPO - no editable */}
                      <td className="px-2 py-2.5">
                        <span className="text-emerald-300 font-medium text-sm">{fila.tipo}</span>
                      </td>

                      {/* PRESENTACIÓN - no editable */}
                      <td className="px-2 py-2.5">
                        <span className={`text-xs font-medium ${fila.presentacion?.toLowerCase().includes('vivo') ? 'text-amber-300' : 'text-gray-300'}`}>
                          {fila.presentacion}
                        </span>
                      </td>

                      {/* CANTIDAD */}
                      <td className="px-2 py-2.5">
                        <div className="text-white font-bold text-sm tabular-nums">{fila.cantidad}</div>
                        <div className="text-[9px] text-gray-500">{fila.cantidadLabel}</div>
                      </td>

                      {/* PESO PEDIDO - no editable (viene de pesaje) */}
                      <td className="px-2 py-2.5 text-right">
                        <span className="text-green-400 font-bold text-sm tabular-nums">{fila.pesoPedido.toFixed(2)}</span>
                      </td>

                      {/* PESO CONTENEDOR - no editable */}
                      <td className="px-2 py-2.5 text-right">
                        <span className="text-red-300 text-sm tabular-nums">{fila.pesoContenedor.toFixed(2)}</span>
                        <div className="text-[9px] text-gray-600 text-right">{fila.contenedorTipo}</div>
                      </td>

                      {/* PESO BRUTO - no editable */}
                      <td className="px-2 py-2.5 text-right">
                        <span className="text-amber-300 font-bold text-sm tabular-nums">{fila.pesoBruto.toFixed(2)}</span>
                      </td>

                      {/* MERMA - editable */}
                      <td className="px-2 py-2.5">
                        <EditInput value={fila.merma.toFixed(2)} onChange={(v: number) => actualizarCampo(fila.id, 'merma', v)} disabled={!puedeEditar} />
                      </td>

                      {/* DEVOLUCION - editable */}
                      <td className="px-2 py-2.5">
                        <EditInput value={fila.devolucionPeso.toFixed(2)} onChange={(v: number) => actualizarCampo(fila.id, 'devolucionPeso', v)} disabled={!puedeEditar} />
                      </td>

                      {/* PESO NETO - calculado, no editable */}
                      <td className="px-2 py-2.5 text-right">
                        <span className="text-cyan-400 font-bold text-sm tabular-nums">{fila.pesoNeto.toFixed(2)}</span>
                      </td>

                      {/* PRECIO - editable */}
                      <td className="px-2 py-2.5">
                        <EditInput value={fila.precio.toFixed(2)} onChange={(v: number) => actualizarCampo(fila.id, 'precio', v)} disabled={!puedeEditar} />
                      </td>

                      {/* TOTAL - no editable (calculado) */}
                      <td className="px-2 py-2.5 text-right">
                        <span className="text-amber-400 font-black text-sm tabular-nums">S/ {fila.total.toFixed(2)}</span>
                      </td>

                      {/* ZONA */}
                      <td className="px-2 py-2.5">
                        <span className="text-purple-300 text-xs font-semibold">{fila.zona}</span>
                      </td>

                      {/* CONDUCTOR */}
                      <td className="px-2 py-2.5">
                        <span className="text-white text-xs truncate block max-w-[100px]">{fila.conductor}</span>
                      </td>

                      {/* ACCIONES */}
                      <td className="px-2 py-2.5">
                        <div className="flex items-center gap-1">
                          {fila.confirmado ? (
                            <button onClick={() => editarFila(fila.id)} className="p-1.5 rounded-lg transition-all hover:scale-110 hover:bg-amber-900/20" title="Editar">
                              <Edit3 className="w-3.5 h-3.5 text-amber-400" />
                            </button>
                          ) : (
                            <button onClick={() => confirmarFila(fila.id)} className="p-1.5 rounded-lg transition-all hover:scale-110 hover:bg-green-900/20" title="Confirmar">
                              <CheckCircle className="w-3.5 h-3.5 text-green-400" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>

              {/* TOTALES */}
              <tfoot>
                <tr style={{ background: 'rgba(204,170,0,0.06)', borderTop: '2px solid rgba(204,170,0,0.15)' }}>
                  <td className="px-2 py-3" colSpan={4}>
                    <span className="text-amber-400 font-bold text-xs uppercase tracking-wider">TOTALES</span>
                  </td>
                  <td className="px-2 py-3 text-right">
                    <span className="text-green-400 font-bold text-sm">{filasOrdenadas.reduce((s, f) => s + f.pesoPedido, 0).toFixed(2)}</span>
                  </td>
                  <td className="px-2 py-3 text-right">
                    <span className="text-red-300 font-bold text-sm">{filasOrdenadas.reduce((s, f) => s + f.pesoContenedor, 0).toFixed(2)}</span>
                  </td>
                  <td className="px-2 py-3 text-right">
                    <span className="text-amber-300 font-bold text-sm">{filasOrdenadas.reduce((s, f) => s + f.pesoBruto, 0).toFixed(2)}</span>
                  </td>
                  <td className="px-2 py-3 text-right">
                    <span className="text-white font-bold text-sm">{filasOrdenadas.reduce((s, f) => s + f.merma, 0).toFixed(2)}</span>
                  </td>
                  <td className="px-2 py-3 text-right">
                    <span className="text-red-400 font-bold text-sm">{filasOrdenadas.reduce((s, f) => s + f.devolucionPeso, 0).toFixed(2)}</span>
                  </td>
                  <td className="px-2 py-3 text-right">
                    <span className="text-cyan-400 font-bold text-sm">{filasOrdenadas.reduce((s, f) => s + f.pesoNeto, 0).toFixed(2)}</span>
                  </td>
                  <td className="px-2 py-3"></td>
                  <td className="px-2 py-3 text-right">
                    <span className="text-amber-400 font-black text-base">S/ {filasOrdenadas.reduce((s, f) => s + f.total, 0).toFixed(2)}</span>
                  </td>
                  <td colSpan={3}></td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}