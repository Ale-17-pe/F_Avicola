import { useState, useEffect } from 'react';
import { ClipboardCheck, Scale, Download, Search, Filter, Weight, Package, User, Calendar, ChevronDown, ChevronUp, RefreshCw, Trash2, FileSpreadsheet, X, Eye } from 'lucide-react';
import { useApp, PedidoConfirmado } from '../contexts/AppContext';
import { useTheme, t } from '../contexts/ThemeContext';
import { toast } from 'sonner';

// Interface para datos de pesaje que vienen de ListaPedidos/PesajeOperador
interface Conductor {
  id: string;
  nombre: string;
  licencia: string;
  vehiculo: string;
  zonaAsignada: string;
  telefono?: string;
}

interface PedidoPesajeControl {
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
  conductor?: Conductor;
  estadoPesaje: 'Pendiente' | 'Completado' | 'Verificado';
  fechaPesaje?: string;
  horaPesaje?: string;
  cantidadMachos?: number;
  cantidadHembras?: number;
}

export function Control() {
  const { pedidosConfirmados, removePedidoConfirmado, clientes } = useApp();
  const { isDark } = useTheme();
  const c = t(isDark);
  const [pedidosPesaje, setPedidosPesaje] = useState<PedidoConfirmado[]>([]);
  const [subModulo, setSubModulo] = useState<'pesaje' | 'entregados'>('pesaje');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCliente, setFilterCliente] = useState('all');
  const [filterFecha, setFilterFecha] = useState(() => {
    const now = new Date();
    const peru = new Date(now.toLocaleString('en-US', { timeZone: 'America/Lima' }));
    const y = peru.getFullYear();
    const m = String(peru.getMonth() + 1).padStart(2, '0');
    const d = String(peru.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  });
  const [sortColumn, setSortColumn] = useState<string>('fechaPesaje');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [selectedPedido, setSelectedPedido] = useState<PedidoConfirmado | null>(null);
  const [statsCollapsed, setStatsCollapsed] = useState(true);

  // Cargar datos de pesaje completados y en proceso desde AppContext
  useEffect(() => {
    const pesados = pedidosConfirmados.filter((p) => 
      p.estado === 'En Pesaje' || 
      p.estado === 'En Despacho' || 
      p.estado === 'Despachando' || 
      p.estado === 'En Ruta' || 
      p.estado === 'Con Incidencia' ||
      (p.pesoBrutoTotal || 0) > 0
    );
    setPedidosPesaje(pesados);
  }, [pedidosConfirmados]);

  const pedidosEntregadosControl = pedidosConfirmados.filter((p) =>
    p.estado === 'Entregado' ||
    p.estado === 'Completado' ||
    p.estado === 'Completado con alerta' ||
    p.estado === 'Devolución'
  );

  const registrosActivos = subModulo === 'pesaje' ? pedidosPesaje : pedidosEntregadosControl;

  // Clientes únicos para filtro
  const clientesUnicos = Array.from(new Set(registrosActivos.map(p => p.cliente))).sort();

  // Filtrar y buscar
  const pedidosFiltrados = registrosActivos.filter(p => {
    const matchSearch = searchTerm === '' ||
      (p.numeroPedido || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.cliente.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.tipoAve.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.conductor || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchCliente = filterCliente === 'all' || p.cliente === filterCliente;
    const matchFecha = !filterFecha || (p.fechaPesaje === filterFecha || p.fecha === filterFecha);
    return matchSearch && matchCliente && matchFecha;
  });

  // Ordenar
  const pedidosOrdenados = [...pedidosFiltrados].sort((a, b) => {
    let valA: any, valB: any;
    switch (sortColumn) {
      case 'numeroPedido': valA = a.numeroPedido || ''; valB = b.numeroPedido || ''; break;
      case 'cliente': valA = a.cliente; valB = b.cliente; break;
      case 'tipoAve': valA = a.tipoAve; valB = b.tipoAve; break;
      case 'cantidad': valA = a.cantidad; valB = b.cantidad; break;
      case 'pesoBruto': valA = a.pesoBrutoTotal || 0; valB = b.pesoBrutoTotal || 0; break;
      case 'pesoContenedores': valA = a.pesoTotalContenedores || 0; valB = b.pesoTotalContenedores || 0; break;
      case 'conductor': valA = a.conductor || ''; valB = b.conductor || ''; break;
      case 'fechaPesaje': valA = a.fechaPesaje || ''; valB = b.fechaPesaje || ''; break;
      default: valA = a.fechaPesaje || ''; valB = b.fechaPesaje || '';
    }
    if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
    if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const SortIcon = ({ column }: { column: string }) => {
    if (sortColumn !== column) return <ChevronDown className="w-3 h-3 opacity-0 group-hover:opacity-50" style={{ color: c.textMuted }} />;
    return sortDirection === 'asc'
      ? <ChevronUp className="w-3 h-3 text-yellow-400" />
      : <ChevronDown className="w-3 h-3 text-yellow-400" />;
  };

  // Estadísticas
  const totalPedidos = registrosActivos.length;
  const totalAves = registrosActivos.reduce((acc, p) => acc + p.cantidad, 0);
  const totalPesoBruto = registrosActivos.reduce((acc, p) => acc + (p.pesoBrutoTotal || 0), 0);
  const totalPesoContenedores = registrosActivos.reduce((acc, p) => acc + (p.pesoTotalContenedores || 0), 0);
  const totalPesoPedido = totalPesoBruto - totalPesoContenedores;

  // Función para extraer número de zona (ej: "Zona Norte 1" -> "Zona 1")
  const formatearZona = (zonaCompleta: string | undefined): string => {
    if (!zonaCompleta) return '—';
    const match = zonaCompleta.match(/(\d+)/);
    return match ? `Zona ${match[1]}` : zonaCompleta;
  };

  // Limpiar registros (solo oculta localmente o elimina si se desea)
  const limpiarRegistros = () => {
    const tipoRegistro = subModulo === 'pesaje' ? 'de pesaje' : 'de pedidos entregados';
    if (confirm(`¿Estás seguro de que deseas limpiar los registros ${tipoRegistro}? Se eliminarán permanentemente del sistema.`)) {
      registrosActivos.forEach(p => removePedidoConfirmado(p.id));
      toast.success('Registros eliminados');
    }
  };

  const refrescarDatos = () => {
    // No hace falta con useApp, pero lo dejamos por consistencia
    toast.info('Datos actualizados automáticamente');
  };

  return (
    <div className="space-y-4 sm:space-y-6 p-1 sm:p-2">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold mb-1 sm:mb-2 flex items-center gap-3" style={{ color: c.text }}>
            <div className="p-2.5 rounded-xl" style={{ background: 'rgba(168,85,247,0.08)', border: '1px solid rgba(168,85,247,0.25)', boxShadow: '0 0 20px rgba(168,85,247,0.1)' }}>
              <FileSpreadsheet className="w-6 h-6 text-purple-400" />
            </div>
            Control de Pedidos
          </h1>
          <p className="text-xs sm:text-sm" style={{ color: c.textSecondary }}>
            {subModulo === 'pesaje'
              ? 'Submódulo: Control de Pesaje'
              : 'Submódulo: Control de Pedidos Entregados'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={refrescarDatos}
            className="px-3 py-2 rounded-lg text-sm font-medium transition-all hover:scale-105 flex items-center gap-2"
            style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.3)', color: '#3b82f6' }}
          >
            <RefreshCw className="w-4 h-4" />
            <span className="hidden sm:inline">Actualizar</span>
          </button>
          <button
            onClick={limpiarRegistros}
            className="px-3 py-2 rounded-lg text-sm font-medium transition-all hover:scale-105 flex items-center gap-2"
            style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444' }}
          >
            <Trash2 className="w-4 h-4" />
            <span className="hidden sm:inline">Limpiar</span>
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setSubModulo('pesaje')}
          className="px-3 py-2 rounded-lg text-sm font-semibold transition-all"
          style={subModulo === 'pesaje'
            ? { background: 'rgba(168,85,247,0.15)', border: '1px solid rgba(168,85,247,0.35)', color: '#a855f7' }
            : { background: c.bgInput, border: `1px solid ${c.border}`, color: c.textSecondary }}
        >
          Control de Pesaje
        </button>
        <button
          onClick={() => setSubModulo('entregados')}
          className="px-3 py-2 rounded-lg text-sm font-semibold transition-all"
          style={subModulo === 'entregados'
            ? { background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.35)', color: '#22c55e' }
            : { background: c.bgInput, border: `1px solid ${c.border}`, color: c.textSecondary }}
        >
          Control de Pedidos Entregados
        </button>
      </div>

      {/* Dashboard de Métricas - Collapsible */}
      <div>
        <button 
          onClick={() => setStatsCollapsed(!statsCollapsed)}
          className="flex items-center gap-2 mb-2 text-xs font-semibold uppercase tracking-wider transition-colors hover:text-amber-400"
          style={{ color: c.textMuted }}
        >
          {statsCollapsed ? <ChevronDown className="w-3.5 h-3.5 -rotate-90" /> : <ChevronDown className="w-3.5 h-3.5" />}
          Estadísticas {statsCollapsed ? '(expandir)' : ''}
        </button>
        {!statsCollapsed && (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 sm:gap-3">
        {[
          { label: 'Total Registros', value: totalPedidos, icon: ClipboardCheck, color: '#a855f7', border: 'rgba(168,85,247,0.3)' },
          { label: 'Total Aves', value: totalAves.toLocaleString(), icon: Package, color: '#3b82f6', border: 'rgba(59,130,246,0.3)' },
          { label: 'Peso Pedido', value: `${totalPesoPedido.toFixed(1)} kg`, icon: Scale, color: '#22c55e', border: 'rgba(34,197,94,0.3)' },
          { label: 'Peso Contenedor', value: `${totalPesoContenedores.toFixed(1)} kg`, icon: Weight, color: '#ef4444', border: 'rgba(239,68,68,0.3)' },
          { label: 'Peso Bruto', value: `${totalPesoBruto.toFixed(1)} kg`, icon: Scale, color: '#f59e0b', border: 'rgba(245,158,11,0.3)' },
        ].map((metric) => (
          <div key={metric.label} className="backdrop-blur-xl rounded-xl p-3 sm:p-4" style={{
            background: c.bgCard,
            border: `1px solid ${metric.border}`
          }}>
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] sm:text-xs font-medium uppercase tracking-wider" style={{ color: c.textSecondary }}>{metric.label}</p>
              <metric.icon className="w-4 h-4" style={{ color: metric.color }} />
            </div>
            <p className="text-lg sm:text-xl md:text-2xl font-bold" style={{ color: metric.color }}>{metric.value}</p>
          </div>
        ))}
      </div>
        )}
      </div>

      {/* Filtros y Búsqueda */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: c.textMuted }} />
          <input
            type="text"
            placeholder="Buscar por pedido, cliente, producto, conductor..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-lg text-sm placeholder-gray-500 outline-none transition-all focus:ring-1"
            style={{ background: c.bgInput, border: '1px solid rgba(168,85,247,0.2)', color: c.text }}
          />
        </div>
        <div className="flex gap-2">
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: c.textMuted }} />
            <select
              value={filterCliente}
              onChange={(e) => setFilterCliente(e.target.value)}
              className="pl-10 pr-8 py-2.5 rounded-lg text-sm outline-none appearance-none cursor-pointer"
              style={{ background: c.bgInput, border: '1px solid rgba(168,85,247,0.2)', color: c.text }}
            >
              <option value="all">Todos los clientes</option>
              {clientesUnicos.map(cl => <option key={cl} value={cl}>{cl}</option>)}
            </select>
          </div>
          <div className="relative flex items-center gap-1">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: c.textMuted }} />
            <input
              type="date"
              value={filterFecha}
              onChange={(e) => setFilterFecha(e.target.value)}
              className="pl-10 pr-4 py-2.5 rounded-lg text-sm outline-none"
              style={{ background: c.bgInput, border: '1px solid rgba(168,85,247,0.2)', color: c.text }}
            />
            {filterFecha && (
              <button
                onClick={() => setFilterFecha('')}
                className="px-2 py-2.5 rounded-lg text-xs transition-colors"
                style={{ background: c.bgInput, border: '1px solid rgba(168,85,247,0.2)', color: c.textSecondary }}
                title="Ver todos los días"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Tabla Excel-like */}
      <div className="backdrop-blur-xl rounded-xl overflow-hidden" style={{
        background: c.bgCard,
        border: '1px solid rgba(168,85,247,0.25)',
        boxShadow: '0 0 30px rgba(168,85,247,0.06)'
      }}>
        {/* Header de la tabla */}
        <div className="px-4 sm:px-6 py-3 sm:py-4 border-b flex items-center justify-between" style={{
          background: `linear-gradient(to right, rgba(168,85,247,0.08), ${c.bgCardAlt})`,
          borderColor: 'rgba(168,85,247,0.2)'
        }}>
          <h2 className="text-sm sm:text-base md:text-lg font-bold flex items-center gap-2" style={{ color: c.text }}>
            <FileSpreadsheet className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: '#a855f7' }} />
            {subModulo === 'pesaje' ? 'Registro de Pesajes' : 'Registro de Pedidos Entregados'}
          </h2>
          <div className="flex items-center gap-2 px-3 py-1 rounded-full" style={{ background: 'rgba(168,85,247,0.1)', border: '1px solid rgba(168,85,247,0.25)' }}>
            <div className="w-2 h-2 rounded-full bg-purple-500 animate-pulse"></div>
            <span className="text-xs font-bold text-purple-400">{pedidosOrdenados.length} registros</span>
          </div>
        </div>

        {pedidosOrdenados.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <FileSpreadsheet className="w-16 h-16 mx-auto mb-4" style={{ color: c.textMuted }} />
            <p className="text-base mb-2" style={{ color: c.textSecondary }}>
              {subModulo === 'pesaje' ? 'No hay registros de pesaje' : 'No hay registros de pedidos entregados'}
            </p>
            <p className="text-sm" style={{ color: c.textMuted }}>
              {subModulo === 'pesaje'
                ? 'Los pedidos pesados aparecerán aquí automáticamente'
                : 'Los pedidos entregados aparecerán aquí automáticamente'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full" style={{ minWidth: '1100px' }}>
              <thead>
                <tr style={{ background: 'rgba(168,85,247,0.06)', borderBottom: '2px solid rgba(168,85,247,0.2)' }}>
                  {[
                    { key: 'numeroPedido', label: 'N° Pedido', width: 'w-28' },
                    { key: 'fechaPesaje', label: 'Fecha', width: 'w-24' },
                    { key: 'cliente', label: 'Cliente', width: 'w-40' },
                    { key: 'tipoAve', label: 'Producto', width: 'w-32' },
                    { key: 'presentacion', label: 'Presentación', width: 'w-28' },
                    { key: 'cantidad', label: 'Cantidad', width: 'w-24' },
                    { key: 'machos_hembras', label: 'M/H', width: 'w-28' },
                    { key: 'contenedor', label: 'Contenedor', width: 'w-28' },
                    { key: 'pesoPedido', label: 'Peso Neto (kg)', width: 'w-28' },
                    { key: 'pesoContenedores', label: 'Tara (kg)', width: 'w-28' },
                    { key: 'pesoBruto', label: 'Peso Bruto (kg)', width: 'w-28' },
                    { key: 'conductor', label: 'Conductor', width: 'w-32' },
                    { key: 'zonaEntrega', label: 'Zona', width: 'w-20' },
                    { key: 'acciones', label: '', width: 'w-16' },
                  ].map(col => (
                    <th
                      key={col.key}
                      className={`px-3 py-3 text-center ${col.width} group cursor-pointer select-none hover:bg-purple-900/10 transition-colors`}
                      onClick={() => col.key !== 'acciones' && col.key !== 'pesoPedido' && handleSort(col.key)}
                    >
                      <div className="flex items-center justify-center gap-1">
                        <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: '#a855f7' }}>
                          {col.label}
                        </span>
                        {col.key !== 'acciones' && col.key !== 'pesoPedido' && <SortIcon column={col.key} />}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pedidosOrdenados.map((pedido, idx) => {
                  const pesoPedidoRow = (pedido.pesoBrutoTotal || 0) - (pedido.pesoTotalContenedores || 0);
                  return (
                    <tr
                      key={pedido.id}
                      className="border-b transition-colors duration-150 hover:bg-purple-900/5"
                      style={{
                        borderColor: 'rgba(168,85,247,0.08)',
                        background: idx % 2 === 0 ? 'transparent' : 'rgba(168,85,247,0.02)'
                      }}
                    >
                      {/* N° Pedido */}
                      <td className="px-3 py-2.5 text-center">
                        <span className="font-mono font-bold text-sm" style={{ color: c.text }}>{pedido.numeroPedido || 'S/N'}</span>
                      </td>

                      {/* Fecha */}
                      <td className="px-3 py-2.5 text-center">
                        <span className="text-xs" style={{ color: c.textSecondary }}>{pedido.fechaPesaje || '—'}</span>
                        {pedido.horaPesaje && (
                          <div className="text-[10px]" style={{ color: c.textMuted }}>{pedido.horaPesaje}</div>
                        )}
                      </td>

                      {/* Cliente */}
                      <td className="px-3 py-2.5 text-center">
                        <span className="font-medium text-sm truncate block max-w-[160px]" style={{ color: c.text }}>{pedido.cliente}</span>
                      </td>

                      {/* Producto */}
                      <td className="px-3 py-2.5 text-center">
                        <div className="text-emerald-300 font-medium text-sm">{pedido.tipoAve.replace(/\(.*?\)/g, '').replace(/-.*$/, '').trim()}</div>
                        {pedido.variedad && (
                          <div className="text-[10px]" style={{ color: c.textSecondary }}>{pedido.variedad}</div>
                        )}
                      </td>

                      {/* Presentación */}
                      <td className="px-3 py-2.5 text-center">
                        <span className={`text-sm ${pedido.presentacion?.toLowerCase().includes('vivo') ? 'text-amber-300 font-semibold' : ''}`} style={pedido.presentacion?.toLowerCase().includes('vivo') ? undefined : { color: c.textSecondary }}>
                          {pedido.presentacion}
                        </span>
                      </td>

                      {/* Cantidad */}
                      <td className="px-3 py-2.5 text-center">
                        <span className="font-bold text-sm tabular-nums" style={{ color: c.text }}>{pedido.cantidad}</span>
                        {pedido.cantidadJabas && (
                          <div className="text-[10px]" style={{ color: c.textMuted }}>{pedido.cantidadJabas} jabas</div>
                        )}
                      </td>

                      {/* M/H (Machos y Hembras) */}
                      <td className="px-3 py-2.5 text-center">
                        {(() => {
                          const mh = pedido.tipoAve.match(/\(M:(\d+),\s*H:(\d+)\)/);
                          if (!mh) return <span className="text-xs" style={{ color: c.textMuted }}>—</span>;
                          return (
                            <div className="flex items-center justify-center gap-1.5">
                              <span className="text-xs font-bold px-1.5 py-0.5 rounded" style={{ background: 'rgba(59,130,246,0.15)', color: '#93c5fd', border: '1px solid rgba(59,130,246,0.25)' }}>M:{mh[1]}</span>
                              <span className="text-xs font-bold px-1.5 py-0.5 rounded" style={{ background: 'rgba(245,158,11,0.15)', color: '#fcd34d', border: '1px solid rgba(245,158,11,0.25)' }}>H:{mh[2]}</span>
                            </div>
                          );
                        })()}
                      </td>

                      {/* Contenedor */}
                      <td className="px-3 py-2.5 text-center">
                        <span className="text-sm" style={{ color: c.textSecondary }}>{pedido.contenedor || '—'}</span>
                        {pedido.cantidadTotalContenedores && (
                          <div className="text-[10px]" style={{ color: c.textMuted }}>{pedido.cantidadTotalContenedores} tandas</div>
                        )}
                      </td>

                      {/* Peso Neto (sin contenedores) */}
                      <td className="px-3 py-2.5 text-center">
                        <span className="text-green-400 font-bold text-sm tabular-nums">
                          {pedido.pesoBrutoTotal ? pesoPedidoRow.toFixed(1) : '—'}
                        </span>
                      </td>

                      {/* Tara (Peso Contenedores) */}
                      <td className="px-3 py-2.5 text-center">
                        <span className="text-red-300 text-sm tabular-nums">
                          {pedido.pesoTotalContenedores ? pedido.pesoTotalContenedores.toFixed(1) : '—'}
                        </span>
                      </td>

                      {/* Peso Bruto (total) */}
                      <td className="px-3 py-2.5 text-center">
                        <span className="text-amber-300 font-bold text-sm tabular-nums">
                          {pedido.pesoBrutoTotal ? pedido.pesoBrutoTotal.toFixed(1) : '—'}
                        </span>
                      </td>

                      {/* Conductor */}
                      <td className="px-3 py-2.5 text-center">
                        {pedido.conductor ? (
                          <span className="text-sm truncate block max-w-[120px]" style={{ color: c.text }}>{pedido.conductor}</span>
                        ) : (
                          <span className="text-sm" style={{ color: c.textMuted }}>—</span>
                        )}
                      </td>

                      {/* Zona (del cliente) */}
                      <td className="px-3 py-2.5 text-center">
                        <span className="text-purple-300 text-xs font-semibold">
                          {(() => {
                            const clienteObj = clientes.find(cl => cl.nombre === pedido.cliente);
                            return formatearZona(clienteObj?.zona);
                          })()}
                        </span>
                      </td>

                      {/* Acciones */}
                      <td className="px-3 py-2.5 text-center">
                        <button
                          onClick={() => setSelectedPedido(pedido)}
                          className="p-1.5 rounded-lg transition-all hover:scale-110 hover:bg-purple-900/20"
                          title="Ver detalle"
                        >
                          <Eye className="w-4 h-4 text-purple-400" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>

              {/* Footer de totales */}
              <tfoot>
                <tr style={{ background: 'rgba(168,85,247,0.06)', borderTop: '2px solid rgba(168,85,247,0.2)' }}>
                  <td className="px-3 py-3 text-center" colSpan={5}>
                    <span className="text-purple-400 font-bold text-xs uppercase tracking-wider">TOTALES</span>
                  </td>
                  <td className="px-3 py-3 text-center">
                    <span className="font-bold text-sm" style={{ color: c.text }}>{pedidosOrdenados.reduce((s, p) => s + p.cantidad, 0)}</span>
                  </td>
                  <td className="px-3 py-3"></td>
                  <td className="px-3 py-3 text-center">
                    <span className="text-xs" style={{ color: c.textSecondary }}>{pedidosOrdenados.reduce((s, p) => s + (p.cantidadTotalContenedores || 0), 0)} tandas</span>
                  </td>
                  <td className="px-3 py-3 text-center">
                    <span className="text-green-400 font-bold text-sm">
                      {(pedidosOrdenados.reduce((s, p) => s + (p.pesoBrutoTotal || 0), 0) - pedidosOrdenados.reduce((s, p) => s + (p.pesoTotalContenedores || 0), 0)).toFixed(1)}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-center">
                    <span className="text-red-300 font-bold text-sm">{pedidosOrdenados.reduce((s, p) => s + (p.pesoTotalContenedores || 0), 0).toFixed(1)}</span>
                  </td>
                  <td className="px-3 py-3 text-center">
                    <span className="text-amber-300 font-bold text-sm">{pedidosOrdenados.reduce((s, p) => s + (p.pesoBrutoTotal || 0), 0).toFixed(1)}</span>
                  </td>
                  <td colSpan={3}></td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>

      {/* Mobile Cards (visible en pantallas muy pequeñas) */}
      <div className="md:hidden space-y-3">
        {pedidosOrdenados.length > 0 && (
          <div className="text-xs text-center py-2" style={{ color: c.textSecondary }}>
            Desplaza horizontalmente la tabla para ver todos los datos ↔
          </div>
        )}
      </div>

      {/* Modal de Detalle */}
      {selectedPedido && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: c.bgModalOverlay }}>
          <div
            className="backdrop-blur-xl rounded-2xl w-full max-w-2xl max-h-[85vh] overflow-y-auto"
            style={{
              background: c.bgModal,
              border: '1px solid rgba(168,85,247,0.3)',
              boxShadow: '0 20px 60px -12px rgba(168,85,247,0.15)'
            }}
          >
            {/* Header */}
            <div className="sticky top-0 px-6 py-4 border-b flex items-center justify-between" style={{
              background: c.bgModal,
              borderColor: 'rgba(168,85,247,0.2)'
            }}>
              <h2 className="text-lg font-bold flex items-center gap-2" style={{ color: c.text }}>
                <Scale className="w-5 h-5 text-purple-400" />
                Detalle de Pesaje - {selectedPedido.numeroPedido}
              </h2>
              <button
                onClick={() => setSelectedPedido(null)}
                className="p-2 rounded-lg hover:bg-white/5 transition-colors"
              >
                <X className="w-5 h-5" style={{ color: c.textSecondary }} />
              </button>
            </div>

            {/* Contenido */}
            <div className="p-6 space-y-6">
              {/* Info del pedido */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                 {[
                  { label: 'Cliente', value: selectedPedido.cliente, color: c.text },
                  { label: 'Producto', value: `${selectedPedido.tipoAve}${selectedPedido.variedad && !selectedPedido.tipoAve.includes(selectedPedido.variedad) ? ` (${selectedPedido.variedad})` : ''}`, color: '#34d399' },
                  { label: 'Presentación', value: selectedPedido.presentacion, color: '#fbbf24' },
                  { label: 'Cantidad', value: `${selectedPedido.cantidad} aves`, color: c.text },
                ].map(item => (
                  <div key={item.label}>
                    <p className="text-[10px] uppercase tracking-wider mb-1" style={{ color: c.textMuted }}>{item.label}</p>
                    <p className="text-sm font-semibold" style={{ color: item.color }}>{item.value}</p>
                  </div>
                ))}
              </div>

              {/* Separador */}
              <div className="border-t" style={{ borderColor: 'rgba(168,85,247,0.15)' }}></div>

              {/* Pesos */}
              <div>
                <h3 className="text-sm font-bold text-purple-400 mb-3 uppercase tracking-wider">Datos de Pesaje</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                   {[
                    { label: 'Peso Pedido', value: selectedPedido.pesoBrutoTotal ? `${((selectedPedido.pesoBrutoTotal || 0) - (selectedPedido.pesoTotalContenedores || 0)).toFixed(1)} kg` : '—', color: '#22c55e' },
                    { label: 'Peso Contenedor', value: selectedPedido.pesoTotalContenedores ? `${selectedPedido.pesoTotalContenedores.toFixed(1)} kg` : '—', color: '#ef4444' },
                    { label: 'Peso Bruto', value: selectedPedido.pesoBrutoTotal ? `${selectedPedido.pesoBrutoTotal.toFixed(1)} kg` : '—', color: '#f59e0b' },
                    { label: 'Tandas', value: selectedPedido.cantidadTotalContenedores ? `${selectedPedido.cantidadTotalContenedores}` : '—', color: '#a855f7' },
                  ].map(item => (
                    <div key={item.label} className="p-3 rounded-lg" style={{ background: 'rgba(168,85,247,0.05)', border: '1px solid rgba(168,85,247,0.15)' }}>
                      <p className="text-[10px] uppercase tracking-wider mb-1" style={{ color: c.textMuted }}>{item.label}</p>
                      <p className="text-lg font-bold" style={{ color: item.color }}>{item.value}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Separador */}
              <div className="border-t" style={{ borderColor: 'rgba(168,85,247,0.15)' }}></div>

              {/* Conductor y Entrega */}
              <div>
                <h3 className="text-sm font-bold text-purple-400 mb-3 uppercase tracking-wider">Entrega</h3>
                <div className="grid grid-cols-2 gap-4">
                  {selectedPedido.conductor ? (
                    <>
                       <div>
                        <p className="text-[10px] uppercase tracking-wider mb-1" style={{ color: c.textMuted }}>Conductor</p>
                        <p className="text-sm font-semibold" style={{ color: c.text }}>{selectedPedido.conductor || '—'}</p>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase tracking-wider mb-1" style={{ color: c.textMuted }}>Zona Entrega</p>
                        <p className="text-sm font-semibold text-purple-300">{selectedPedido.zonaEntrega || '—'}</p>
                      </div>
                    </>
                  ) : (
                    <div className="col-span-2">
                      <p className="text-sm" style={{ color: c.textMuted }}>Sin conductor asignado</p>
                    </div>
                  )}
                  <div>
                    <p className="text-[10px] uppercase tracking-wider mb-1" style={{ color: c.textMuted }}>Fecha de Pesaje</p>
                    <p className="text-sm font-semibold" style={{ color: c.text }}>{selectedPedido.fechaPesaje || '—'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wider mb-1" style={{ color: c.textMuted }}>Hora de Pesaje</p>
                    <p className="text-sm font-semibold" style={{ color: c.text }}>{selectedPedido.horaPesaje || '—'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wider mb-1" style={{ color: c.textMuted }}>Contenedor</p>
                    <p className="text-sm font-semibold" style={{ color: c.text }}>{selectedPedido.contenedor}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wider mb-1" style={{ color: c.textMuted }}>Estado</p>
                     <span className="px-2.5 py-1 rounded-full text-xs font-bold" style={{ background: 'rgba(34,197,94,0.15)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.3)' }}>
                      {selectedPedido.estado}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}