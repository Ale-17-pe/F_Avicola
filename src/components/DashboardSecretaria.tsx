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
        const tipoAveObj = tiposAve.find(t => t.nombre === p.producto || t.nombre === p.tipo);

        if (clienteObj && tipoAveObj) {
          // 2. Determinar sexo del pedido
          let sexoPedido = 'Mixto';
          if (p.cantidadMachos > 0 && (!p.cantidadHembras || p.cantidadHembras === 0)) sexoPedido = 'Macho';
          else if (p.cantidadHembras > 0 && (!p.cantidadMachos || p.cantidadMachos === 0)) sexoPedido = 'Hembra';

          // 3. Buscar precio específico
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
            costoEncontrado = costosDelCliente.find(cc => !cc.variedad && cc.sexo === sexoPedido);
          }

          if (!costoEncontrado) {
            costoEncontrado = costosDelCliente.find(cc => !cc.variedad && (!cc.sexo || cc.sexo === 'Mixto'));
          }

          if (costoEncontrado) {
            precio = costoEncontrado.precioPorKg;
          }
        } else {
          // Fallback búsqueda simple por nombre si faltan IDs
          const costoCliente = costosClientes.find(cc =>
            cc.clienteNombre?.toLowerCase() === p.cliente.toLowerCase() &&
            cc.tipoAveNombre?.toLowerCase() === p.producto.toLowerCase()
          );
          if (costoCliente) precio = costoCliente.precioPorKg;
        }

        // Zona del conductor - mejor formateada
        let zona = '—';
        if (typeof p.conductor === 'object' && p.conductor) {
          const zonaAsignada = p.conductor.zonaAsignada || '';
          const zonaMatch = zonaAsignada.match(/(\d+)/);
          zona = zonaMatch ? `Zona ${zonaMatch[1]}` : (zonaAsignada || '—');
        } else if (typeof p.conductor === 'string' && p.conductor) {
          zona = p.conductor;
        }

        // Nombre del conductor
        const conductorNombre = typeof p.conductor === 'object' ? p.conductor?.nombre || '—' : p.conductor || '—';

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
          tara: 0,
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
    } catch (error) {
      console.error('Error generando cartera:', error);
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
    return f.cliente.toLowerCase().includes(q) || f.tipo.toLowerCase().includes(q) || f.conductor.toLowerCase().includes(q);
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

  // Input editable con estilos mejorados para fondo negro
  const EditInput = ({ value, onChange, disabled = false, type = 'number', step = '0.01', min = '0', className = '' }: { value: number | string; onChange: (v: any) => void; disabled?: boolean; type?: string; step?: string; min?: string; className?: string }) => (
    <input
      type={type}
      step={step}
      min={min}
      value={value}
      onChange={(e) => onChange(type === 'number' ? parseFloat(e.target.value) || 0 : e.target.value)}
      disabled={disabled}
      className={`w-full px-1 sm:px-2 py-1 rounded-lg text-xs sm:text-sm text-right font-mono transition-all ${
        disabled 
          ? 'bg-gray-900 text-gray-500 cursor-default border border-gray-800' 
          : 'bg-black text-white border border-amber-600/50 hover:border-amber-500 focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-500/50'
      } ${className}`}
    />
  );

  return (
    <div className="space-y-4 sm:space-y-5 bg-black min-h-screen p-4 sm:p-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-amber-900/30 to-amber-950/30 border border-amber-700/30 shadow-lg shadow-amber-900/20">
            <DollarSign className="w-5 h-5 sm:w-6 sm:h-6 text-amber-400" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-white tracking-tight">Cartera de Cobro</h1>
            <p className="text-gray-500 text-[10px] sm:text-xs">Registro diario de pesajes y cobros · Se reinicia cada día</p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Selector de fecha */}
          <div className="flex items-center gap-2 px-2 sm:px-3 py-2 rounded-xl bg-gray-900 border border-amber-700/30 hover:border-amber-600/50 transition-colors">
            <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400" />
            <input
              type="date"
              value={fechaSeleccionada}
              onChange={(e) => setFechaSeleccionada(e.target.value)}
              className="bg-transparent text-white text-xs sm:text-sm outline-none w-28 sm:w-auto"
            />
          </div>
          <button onClick={refrescar} className="px-2 sm:px-3 py-2 rounded-xl text-xs font-semibold transition-all hover:scale-105 flex items-center gap-1.5 bg-blue-950/30 border border-blue-700/30 text-blue-400 hover:bg-blue-900/40 hover:border-blue-600">
            <RefreshCw className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> <span className="hidden xs:inline">Actualizar</span>
          </button>
          <button onClick={exportarCSV} className="px-2 sm:px-3 py-2 rounded-xl text-xs font-semibold transition-all hover:scale-105 flex items-center gap-1.5 bg-green-950/30 border border-green-700/30 text-green-400 hover:bg-green-900/40 hover:border-green-600">
            <Download className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> <span className="hidden xs:inline">CSV</span>
          </button>
        </div>
      </div>

      {/* Métricas - Estilos mejorados para fondo negro */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-2 sm:gap-3">
        {[
          { label: 'Total Ventas', value: `S/ ${totalVentas.toFixed(2)}`, icon: DollarSign, color: '#22c55e', bg: 'from-green-950/30 to-green-950/10', border: 'border-green-700/30' },
          { label: 'Peso Pedido', value: `${totalPesoPedido.toFixed(1)} kg`, icon: Scale, color: '#22c55e', bg: 'from-green-950/30 to-green-950/10', border: 'border-green-700/30' },
          { label: 'Peso Contenedor', value: `${totalPesoContenedor.toFixed(1)} kg`, icon: Package, color: '#ef4444', bg: 'from-red-950/30 to-red-950/10', border: 'border-red-700/30' },
          { label: 'Peso Bruto', value: `${totalPesoBruto.toFixed(1)} kg`, icon: Scale, color: '#f59e0b', bg: 'from-amber-950/30 to-amber-950/10', border: 'border-amber-700/30' },
          { label: 'Peso Neto', value: `${totalPesoNeto.toFixed(1)} kg`, icon: Package, color: '#06b6d4', bg: 'from-cyan-950/30 to-cyan-950/10', border: 'border-cyan-700/30' },
        ].map(m => (
          <div key={m.label} className={`bg-gradient-to-br ${m.bg} backdrop-blur-xl rounded-xl p-2 sm:p-4 border ${m.border} shadow-lg`}>
            <div className="flex items-center justify-between mb-1 sm:mb-2">
              <p className="text-[8px] sm:text-[10px] text-gray-400 font-medium uppercase tracking-wider">{m.label}</p>
              <m.icon className="w-3 h-3 sm:w-4 sm:h-4" style={{ color: m.color }} />
            </div>
            <p className="text-sm sm:text-xl md:text-2xl font-bold truncate" style={{ color: m.color }}>{m.value}</p>
          </div>
        ))}
      </div>

      {/* Controles */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="relative w-full sm:flex-1 sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            placeholder="Buscar cliente, tipo, conductor..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm text-white placeholder-gray-500 outline-none bg-gray-900 border border-amber-700/30 focus:border-amber-500 focus:ring-1 focus:ring-amber-500/50 transition-all"
          />
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button onClick={editarTodas} className="flex-1 sm:flex-none px-3 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all hover:scale-105 flex items-center justify-center gap-1.5 bg-amber-950/30 border border-amber-700/30 text-amber-400 hover:bg-amber-900/40 hover:border-amber-600">
            <Edit3 className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> Editar Todo
          </button>
          <button onClick={confirmarTodas} className="flex-1 sm:flex-none px-3 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all hover:scale-105 flex items-center justify-center gap-1.5 bg-green-950/30 border border-green-700/30 text-green-400 hover:bg-green-900/40 hover:border-green-600">
            <Save className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> Confirmar Todo
          </button>
        </div>
      </div>

      {/* Indicador de día */}
      <div className="flex items-center gap-2 px-3 py-2 rounded-xl flex-wrap bg-gray-900/80 border border-amber-700/30 shadow-lg">
        <Calendar className="w-4 h-4 text-amber-400" />
        <span className="text-xs text-gray-400">Mostrando datos de</span>
        <span className="text-xs sm:text-sm font-bold text-amber-400">{fechaSeleccionada === hoyStr() ? 'HOY' : fechaSeleccionada}</span>
        <span className="text-xs text-gray-500 sm:ml-auto">{filasCartera.length} registros</span>
      </div>

      {/* TABLA PRINCIPAL - CARTERA DE COBRO */}
      <div className="bg-gray-900/80 backdrop-blur-xl rounded-xl overflow-hidden border border-amber-700/30 shadow-2xl shadow-amber-900/10">

        <div className="px-4 sm:px-5 py-3 border-b border-amber-700/30 flex items-center justify-between bg-gradient-to-r from-amber-950/30 to-gray-900">
          <h2 className="text-xs sm:text-sm md:text-base font-bold text-white flex items-center gap-2">
            <FileSpreadsheet className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400" />
            Cartera de Cobro - Detalle
          </h2>
          <span className="text-[10px] sm:text-xs px-2 sm:px-2.5 py-1 rounded-full font-bold bg-amber-950/30 text-amber-400 border border-amber-700/30">
            {filasOrdenadas.length} filas
          </span>
        </div>

        {filasOrdenadas.length === 0 ? (
          <div className="px-4 sm:px-6 py-10 sm:py-16 text-center">
            <FileSpreadsheet className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 text-gray-700" />
            <p className="text-gray-400 text-sm sm:text-base mb-2">No hay registros para este día</p>
            <p className="text-gray-600 text-xs sm:text-sm mb-4">Los datos se generan automáticamente desde el módulo de pesaje</p>
            <button onClick={refrescar} className="px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all hover:scale-105 bg-blue-950/30 border border-blue-700/30 text-blue-400 hover:bg-blue-900/40">
              <RefreshCw className="w-3 h-3 sm:w-4 sm:h-4 inline mr-2" /> Cargar desde pesaje
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full table-fixed" style={{ minWidth: '1400px' }}>
              <thead>
                <tr className="bg-gradient-to-r from-amber-950/20 to-gray-900 border-b-2 border-amber-700/30">
                  {[
                    { key: 'cliente', label: 'CLIENTE', width: '110px' },
                    { key: 'tipo', label: 'TIPO', width: '90px' },
                    { key: 'presentacion', label: 'PRESENTACIÓN', width: '100px' },
                    { key: 'cantidad', label: 'CANTIDAD', width: '90px' },
                    { key: 'pesoPedido', label: 'P. PEDIDO', width: '90px' },
                    { key: 'pesoContenedor', label: 'P. CONT.', width: '80px' },
                    { key: 'pesoBruto', label: 'P. BRUTO', width: '80px' },
                    { key: 'merma', label: 'MERMA', width: '70px' },
                    { key: 'devolucionPeso', label: 'DEVOL.', width: '70px' },
                    { key: 'pesoNeto', label: 'P. NETO', width: '80px' },
                    { key: 'precio', label: 'PRECIO', width: '70px' },
                    { key: 'total', label: 'TOTAL', width: '100px' },
                    { key: 'zona', label: 'ZONA', width: '80px' },
                    { key: 'conductor', label: 'CONDUCTOR', width: '120px' },
                    { key: 'acciones', label: '', width: '50px' },
                  ].map(col => (
                    <th
                      key={col.key}
                      style={{ width: col.width }}
                      className={`px-1 sm:px-2 py-2 sm:py-3 text-left cursor-pointer select-none hover:bg-amber-900/20 transition-colors ${
                        col.key === 'total' || col.key === 'precio' || col.key === 'pesoPedido' || 
                        col.key === 'pesoContenedor' || col.key === 'pesoBruto' || col.key === 'merma' || 
                        col.key === 'devolucionPeso' || col.key === 'pesoNeto' ? 'text-right' : 'text-left'
                      }`}
                      onClick={() => col.key !== 'acciones' && handleSort(col.key)}
                    >
                      <div className={`flex items-center gap-1 ${
                        col.key === 'total' || col.key === 'precio' || col.key === 'pesoPedido' || 
                        col.key === 'pesoContenedor' || col.key === 'pesoBruto' || col.key === 'merma' || 
                        col.key === 'devolucionPeso' || col.key === 'pesoNeto' ? 'justify-end' : 'justify-start'
                      }`}>
                        <span className="text-[8px] sm:text-[9px] font-bold uppercase tracking-widest truncate text-amber-400">
                          {col.label}
                        </span>
                        {sortColumn === col.key && (
                          sortDir === 'asc' ? 
                            <ChevronUp className="w-2 h-2 sm:w-3 sm:h-3 flex-shrink-0 text-amber-400" /> : 
                            <ChevronDown className="w-2 h-2 sm:w-3 sm:h-3 flex-shrink-0 text-amber-400" />
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
                      className={`border-b border-amber-900/20 transition-colors duration-150 hover:bg-amber-900/10 ${
                        fila.confirmado ? 'opacity-90 bg-green-950/10' : ''
                      }`}
                    >
                      {/* CLIENTE - no editable */}
                      <td className="px-1 sm:px-2 py-2">
                        <span className="text-white font-semibold text-xs sm:text-sm block truncate" title={fila.cliente}>{fila.cliente}</span>
                      </td>

                      {/* TIPO - no editable */}
                      <td className="px-1 sm:px-2 py-2">
                        <span className="text-emerald-400 font-medium text-xs sm:text-sm block truncate" title={fila.tipo}>{fila.tipo}</span>
                      </td>

                      {/* PRESENTACIÓN - no editable */}
                      <td className="px-1 sm:px-2 py-2">
                        <span className={`text-[10px] sm:text-xs font-medium block truncate ${
                          fila.presentacion?.toLowerCase().includes('vivo') ? 'text-amber-400' : 'text-gray-300'
                        }`} title={fila.presentacion}>
                          {fila.presentacion}
                        </span>
                      </td>

                      {/* CANTIDAD */}
                      <td className="px-1 sm:px-2 py-2 text-right">
                        <div className="text-white font-bold text-xs sm:text-sm tabular-nums">{fila.cantidad}</div>
                        <div className="text-[7px] sm:text-[9px] text-gray-500 truncate">{fila.cantidadLabel}</div>
                      </td>

                      {/* PESO PEDIDO - no editable */}
                      <td className="px-1 sm:px-2 py-2 text-right">
                        <span className="text-green-400 font-bold text-xs sm:text-sm tabular-nums">{fila.pesoPedido.toFixed(2)}</span>
                      </td>

                      {/* PESO CONTENEDOR - no editable */}
                      <td className="px-1 sm:px-2 py-2 text-right">
                        <span className="text-red-400 text-xs sm:text-sm tabular-nums">{fila.pesoContenedor.toFixed(2)}</span>
                        <div className="text-[7px] sm:text-[9px] text-gray-600 truncate" title={fila.contenedorTipo}>{fila.contenedorTipo}</div>
                      </td>

                      {/* PESO BRUTO - no editable */}
                      <td className="px-1 sm:px-2 py-2 text-right">
                        <span className="text-amber-400 font-bold text-xs sm:text-sm tabular-nums">{fila.pesoBruto.toFixed(2)}</span>
                      </td>

                      {/* MERMA - editable */}
                      <td className="px-1 sm:px-2 py-2">
                        <EditInput value={fila.merma.toFixed(2)} onChange={(v: number) => actualizarCampo(fila.id, 'merma', v)} disabled={!puedeEditar} />
                      </td>

                      {/* DEVOLUCION - editable */}
                      <td className="px-1 sm:px-2 py-2">
                        <EditInput value={fila.devolucionPeso.toFixed(2)} onChange={(v: number) => actualizarCampo(fila.id, 'devolucionPeso', v)} disabled={!puedeEditar} />
                      </td>

                      {/* PESO NETO - calculado, no editable */}
                      <td className="px-1 sm:px-2 py-2 text-right">
                        <span className="text-white font-bold text-xs sm:text-sm tabular-nums">{fila.pesoNeto.toFixed(2)}</span>
                      </td>

                      {/* PRECIO - editable */}
                      <td className="px-1 sm:px-2 py-2">
                        <EditInput value={fila.precio.toFixed(2)} onChange={(v: number) => actualizarCampo(fila.id, 'precio', v)} disabled={!puedeEditar} />
                      </td>

                      {/* TOTAL - no editable */}
                      <td className="px-1 sm:px-2 py-2 text-right">
                        <span className="text-amber-400 font-black text-xs sm:text-sm tabular-nums">S/ {fila.total.toFixed(2)}</span>
                      </td>

                      {/* ZONA - como lista visible */}
                      <td className="px-1 sm:px-2 py-2">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-medium bg-purple-950/50 text-purple-400 border border-purple-700/30">
                          {fila.zona}
                        </span>
                      </td>

                      {/* CONDUCTOR */}
                      <td className="px-1 sm:px-2 py-2">
                        <span className="text-white text-[10px] sm:text-xs block truncate" title={fila.conductor}>{fila.conductor}</span>
                      </td>

                      {/* ACCIONES */}
                      <td className="px-1 sm:px-2 py-2">
                        <div className="flex items-center justify-center">
                          {fila.confirmado ? (
                            <button onClick={() => editarFila(fila.id)} className="p-1 sm:p-1.5 rounded-lg transition-all hover:scale-110 hover:bg-amber-900/30" title="Editar">
                              <Edit3 className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-400" />
                            </button>
                          ) : (
                            <button onClick={() => confirmarFila(fila.id)} className="p-1 sm:p-1.5 rounded-lg transition-all hover:scale-110 hover:bg-green-900/30" title="Confirmar">
                              <CheckCircle className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-green-400" />
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
                <tr className="bg-gradient-to-r from-amber-950/30 to-gray-900 border-t-2 border-amber-700/30">
                  <td className="px-1 sm:px-2 py-2 sm:py-3" colSpan={4}>
                    <span className="text-amber-400 font-bold text-[10px] sm:text-xs uppercase tracking-wider">TOTALES</span>
                  </td>
                  <td className="px-1 sm:px-2 py-2 sm:py-3 text-right">
                    <span className="text-green-400 font-bold text-xs sm:text-sm">{filasOrdenadas.reduce((s, f) => s + f.pesoPedido, 0).toFixed(2)}</span>
                  </td>
                  <td className="px-1 sm:px-2 py-2 sm:py-3 text-right">
                    <span className="text-red-400 font-bold text-xs sm:text-sm">{filasOrdenadas.reduce((s, f) => s + f.pesoContenedor, 0).toFixed(2)}</span>
                  </td>
                  <td className="px-1 sm:px-2 py-2 sm:py-3 text-right">
                    <span className="text-amber-400 font-bold text-xs sm:text-sm">{filasOrdenadas.reduce((s, f) => s + f.pesoBruto, 0).toFixed(2)}</span>
                  </td>
                  <td className="px-1 sm:px-2 py-2 sm:py-3 text-right">
                    <span className="text-white font-bold text-xs sm:text-sm">{filasOrdenadas.reduce((s, f) => s + f.merma, 0).toFixed(2)}</span>
                  </td>
                  <td className="px-1 sm:px-2 py-2 sm:py-3 text-right">
                    <span className="text-red-400 font-bold text-xs sm:text-sm">{filasOrdenadas.reduce((s, f) => s + f.devolucionPeso, 0).toFixed(2)}</span>
                  </td>
                  <td className="px-1 sm:px-2 py-2 sm:py-3 text-right">
                    <span className="text-white font-bold text-xs sm:text-sm">{filasOrdenadas.reduce((s, f) => s + f.pesoNeto, 0).toFixed(2)}</span>
                  </td>
                  <td className="px-1 sm:px-2 py-2 sm:py-3" colSpan={2}></td>
                  <td className="px-1 sm:px-2 py-2 sm:py-3 text-right" colSpan={2}>
                    <span className="text-amber-400 font-black text-sm sm:text-base">S/ {filasOrdenadas.reduce((s, f) => s + f.total, 0).toFixed(2)}</span>
                  </td>
                  <td className="px-1 sm:px-2 py-2 sm:py-3" colSpan={3}></td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}