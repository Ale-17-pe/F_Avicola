import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Search, Filter, Package, User, Calendar, CheckCircle, Clock, Settings, Scale, TrendingUp, PieChart as PieChartIcon, X, Eye, Layers, Truck, Box, Tag, AlertCircle, ChevronRight, Grid3x3, MapPin, RotateCcw } from 'lucide-react';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import { ModalContenedores } from './ModalContenedores';
import { useApp } from '../contexts/AppContext';
import { toast } from 'sonner';
import { useTheme, t } from '../contexts/ThemeContext';

interface Pedido {
  id: string;
  numeroPedido: string;
  numeroCliente: string;
  cliente: string;
  tipoAve: string;
  variedad?: string;
  cantidad: number;
  cantidadJabas?: number;
  unidadesPorJaba?: number;
  presentacion: string;
  mermaUnitaria: number;
  mermaTotal: number;
  contenedor: string; // Solo referencia interna
  pesoContenedor: number;
  pesoTotalPedido: number;
  empleado: string;
  fecha: string;
  hora: string;
  estado: 'Pendiente' | 'En Producción' | 'En Pesaje' | 'En Despacho' | 'Despachando' | 'En Ruta' | 'Con Incidencia' | 'Entregado' | 'Completado' | 'Cancelado';
  autoConfirmado: boolean;
  esSubPedido: boolean;
  prioridadBase: number;
  subNumero: number;
}

interface PedidoAgrupado {
  cliente: string;
  numeroCliente: string;
  pedidos: Pedido[];
  totalAves: number;
  pedidosPendientes: number;
  pedidosEnProduccion: number;
}

interface EdicionJabasForm {
  tipo: 'JABAS' | 'UNIDADES';
  cantidadJabas?: number;
  unidadesPorJaba?: number;
  cantidadTotal?: number;
}

export function Pedidos() {
  const { 
    pedidosConfirmados, 
    tiposAve, 
    presentaciones, 
    contenedores: contenedoresContext, 
    clientes,
    updatePedidoConfirmado,
    removePedidoConfirmado
  } = useApp();
  const { isDark } = useTheme();
  const c = t(isDark);

  // Estados
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [pedidosAgrupados, setPedidosAgrupados] = useState<PedidoAgrupado[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEstado, setFilterEstado] = useState<string>('all');
  const [filterVariedad, setFilterVariedad] = useState<string>('all');
  const [filterPresentacion, setFilterPresentacion] = useState<string>('all');
  const [filterTipoAve, setFilterTipoAve] = useState<string>('all');
  const [isContenedoresModalOpen, setIsContenedoresModalOpen] = useState(false);
  const [pedidoSeleccionado, setPedidoSeleccionado] = useState<Pedido | null>(null);
  const [mostrarDetalle, setMostrarDetalle] = useState(false);
  const [vistaGrupos, setVistaGrupos] = useState(false);
  const [modoEdicion, setModoEdicion] = useState<'EDITAR' | 'CANCELAR' | null>(null);
  const [edicionJabas, setEdicionJabas] = useState<EdicionJabasForm | null>(null);
  const [motivoCancelacion, setMotivoCancelacion] = useState<string>('');

  // ============ PROCESAR PEDIDOS DEL CONTEXTO ============
  useEffect(() => {
    const procesarPedidos = () => {
      if (!pedidosConfirmados || pedidosConfirmados.length === 0) {
        setPedidos([]);
        setPedidosAgrupados([]);
        return;
      }

      const pedidosProcesados: Pedido[] = pedidosConfirmados.map((pedido, index) => {
        // Procesar numeración
        let numeroPedido = '';
        let numeroCliente = '';
        let prioridadBase = 1;
        let subNumero = 1;
        let esSubPedido = false;

        if (pedido.numeroPedido && pedido.numeroPedido.includes('C')) {
          const match = pedido.numeroPedido.match(/^C(\d{3})\.(\d+)$/);
          if (match) {
            numeroCliente = `C${match[1]}`;
            prioridadBase = parseInt(match[1]);
            subNumero = parseInt(match[2]);
            numeroPedido = pedido.numeroPedido;
            esSubPedido = subNumero > 1;
          }
        }

        if (!numeroPedido) {
          numeroCliente = `C${pedido.prioridad.toString().padStart(3, '0')}`;
          prioridadBase = pedido.prioridad;
          subNumero = 1;
          numeroPedido = `${numeroCliente}.${subNumero}`;
        }

        // Calcular merma basada en presentación
        const presentacionData = presentaciones?.find(p => p.nombre === pedido.presentacion);
        const mermaUnitaria = presentacionData ? presentacionData.mermaKg : 0;
        const mermaTotal = mermaUnitaria * pedido.cantidad;

        // Calcular peso total (solo para referencia)
        const contenedorData = contenedoresContext?.find(c => c.tipo === pedido.contenedor);
        const pesoContenedor = contenedorData?.peso || 2.5;
        const pesoPromedioAve = 1.8;
        const pesoTotalPedido = (pedido.cantidad * pesoPromedioAve) + pesoContenedor - mermaTotal;

        // Extraer tipo base sin variedad
        const tipoBase = pedido.tipoAve.replace(/\(M:\d+,\s*H:\d+\)/g, '').replace(/\(.*?\)/g, '').replace(/-.*$/, '').trim();

        return {
          id: pedido.id,
          numeroPedido,
          numeroCliente,
          cliente: pedido.cliente,
          tipoAve: tipoBase,
          variedad: pedido.variedad,
          cantidad: pedido.cantidad,
          cantidadJabas: pedido.cantidadJabas,
          unidadesPorJaba: pedido.unidadesPorJaba,
          presentacion: pedido.presentacion,
          mermaUnitaria,
          mermaTotal,
          contenedor: pedido.contenedor,
          pesoContenedor,
          pesoTotalPedido,
          empleado: 'Sistema',
          fecha: pedido.fecha,
          hora: pedido.hora,
          estado: (pedido.estado as any) || 'Pendiente',
          autoConfirmado: true,
          esSubPedido: esSubPedido,
          prioridadBase,
          subNumero,
        };
      });

      // Ordenar pedidos
      const pedidosOrdenados = pedidosProcesados.sort((a, b) => {
        if (a.prioridadBase !== b.prioridadBase) {
          return a.prioridadBase - b.prioridadBase;
        }
        return a.subNumero - b.subNumero;
      });

      setPedidos(pedidosOrdenados);

      // Agrupar por cliente
      const agrupados: { [key: string]: PedidoAgrupado } = {};

      pedidosOrdenados.forEach(pedido => {
        if (!agrupados[pedido.numeroCliente]) {
          agrupados[pedido.numeroCliente] = {
            cliente: pedido.cliente,
            numeroCliente: pedido.numeroCliente,
            pedidos: [],
            totalAves: 0,
            pedidosPendientes: 0,
            pedidosEnProduccion: 0
          };
        }

        agrupados[pedido.numeroCliente].pedidos.push(pedido);
        agrupados[pedido.numeroCliente].totalAves += pedido.cantidad;
        
        if (pedido.estado === 'Pendiente') {
          agrupados[pedido.numeroCliente].pedidosPendientes++;
        } else if (pedido.estado === 'En Producción') {
          agrupados[pedido.numeroCliente].pedidosEnProduccion++;
        }
      });

      setPedidosAgrupados(Object.values(agrupados));
    };

    procesarPedidos();
  }, [pedidosConfirmados, presentaciones, contenedoresContext]);

  // ============ FUNCIONES DE GESTIÓN ============

  const abrirDetalle = (pedido: Pedido) => {
    setPedidoSeleccionado(pedido);
    setMostrarDetalle(true);
  };

  const iniciarEdicion = (pedido: Pedido) => {
    setPedidoSeleccionado(pedido);
    setModoEdicion('EDITAR');
    
    // Inicializar formulario de edición según el tipo de producto
    const esVivo = pedido.presentacion.toLowerCase().includes('vivo');
    if (esVivo && pedido.cantidadJabas) {
      setEdicionJabas({
        tipo: 'JABAS',
        cantidadJabas: pedido.cantidadJabas,
        unidadesPorJaba: pedido.unidadesPorJaba,
        cantidadTotal: pedido.cantidad
      });
    } else {
      setEdicionJabas({
        tipo: 'UNIDADES',
        cantidadTotal: pedido.cantidad
      });
    }
    
    setMotivoCancelacion('');
  };

  const aplicarEdicion = () => {
    if (!pedidoSeleccionado || !edicionJabas) return;

    const pedidoOriginal = pedidosConfirmados?.find(p => p.id === pedidoSeleccionado.id);
    if (!pedidoOriginal) return;

    let cantidadActualizada = pedidoSeleccionado.cantidad;
    let cantidadJabasActualizada = pedidoSeleccionado.cantidadJabas;
    let unidadesPorJabaActualizada = pedidoSeleccionado.unidadesPorJaba;

    // Calcular nueva cantidad según el tipo de edición
    if (edicionJabas.tipo === 'JABAS' && edicionJabas.cantidadJabas && edicionJabas.unidadesPorJaba) {
      cantidadJabasActualizada = edicionJabas.cantidadJabas;
      unidadesPorJabaActualizada = edicionJabas.unidadesPorJaba;
      cantidadActualizada = cantidadJabasActualizada * unidadesPorJabaActualizada;
    } else if (edicionJabas.tipo === 'UNIDADES' && edicionJabas.cantidadTotal) {
      cantidadActualizada = edicionJabas.cantidadTotal;
      // Si es vivo pero se edita por unidades, recalcular jabas aproximadas
      if (pedidoSeleccionado.presentacion.toLowerCase().includes('vivo')) {
        const jabasAproximadas = Math.ceil(cantidadActualizada / (pedidoSeleccionado.unidadesPorJaba || 10));
        cantidadJabasActualizada = jabasAproximadas;
        unidadesPorJabaActualizada = pedidoSeleccionado.unidadesPorJaba || 10;
      }
    }

    // Solo actualizar si hay cambios
    if (cantidadActualizada !== pedidoSeleccionado.cantidad) {
      updatePedidoConfirmado(pedidoSeleccionado.id, {
        ...pedidoOriginal,
        cantidad: cantidadActualizada,
        cantidadJabas: cantidadJabasActualizada,
        unidadesPorJaba: unidadesPorJabaActualizada
      });
      toast.success('Pedido actualizado correctamente');
    }

    setModoEdicion(null);
    setPedidoSeleccionado(null);
    setEdicionJabas(null);
  };

  const iniciarCancelacion = (pedido: Pedido) => {
    setPedidoSeleccionado(pedido);
    setModoEdicion('CANCELAR');
    setMotivoCancelacion('');
  };

  const aplicarCancelacion = () => {
    if (!pedidoSeleccionado) return;

    const pedidoOriginal = pedidosConfirmados?.find(p => p.id === pedidoSeleccionado.id);
    if (!pedidoOriginal) return;

    if (!motivoCancelacion.trim()) {
      toast.error('Debe ingresar un motivo para cancelar');
      return;
    }

    updatePedidoConfirmado(pedidoSeleccionado.id, {
      ...pedidoOriginal,
      estado: 'Cancelado'
    });
    toast.success('Pedido cancelado correctamente');

    setModoEdicion(null);
    setPedidoSeleccionado(null);
    setMotivoCancelacion('');
  };

  const eliminarPedido = (id: string) => {
    if (confirm('¿Está seguro de eliminar este pedido? Esta acción no se puede deshacer.')) {
      removePedidoConfirmado(id);
      toast.success('Pedido eliminado correctamente');
    }
  };

  const moverAProduccion = (pedido: Pedido) => {
    const pedidoOriginal = pedidosConfirmados?.find(p => p.id === pedido.id);
    if (pedidoOriginal) {
      updatePedidoConfirmado(pedido.id, {
        ...pedidoOriginal,
        estado: 'En Producción'
      });
      toast.success(`Pedido ${pedido.numeroPedido} enviado a producción`);
    }
  };

  const moverAPesaje = (pedido: Pedido) => {
    const pedidoOriginal = pedidosConfirmados?.find(p => p.id === pedido.id);
    if (pedidoOriginal) {
      updatePedidoConfirmado(pedido.id, {
        ...pedidoOriginal,
        estado: 'En Pesaje'
      });
      toast.success(`Pedido ${pedido.numeroPedido} enviado a pesaje`);
    }
  };

  // ============ FILTRAR PEDIDOS ============
  const filteredPedidos = pedidos.filter(pedido => {
    const matchesSearch = 
      pedido.cliente.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pedido.tipoAve.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pedido.numeroPedido.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesEstado = filterEstado === 'all' || pedido.estado === filterEstado;
    const matchesVariedad = filterVariedad === 'all' || (pedido.variedad || '') === filterVariedad;
    const matchesPresentacion = filterPresentacion === 'all' || pedido.presentacion === filterPresentacion;
    const matchesTipoAve = filterTipoAve === 'all' || pedido.tipoAve === filterTipoAve;
    return matchesSearch && matchesEstado && matchesVariedad && matchesPresentacion && matchesTipoAve;
  });

  // ============ ESTADÍSTICAS ============
  const totalPedidos = filteredPedidos.length;
  const pedidosPendientes = filteredPedidos.filter(p => p.estado === 'Pendiente').length;
  const pedidosProduccion = filteredPedidos.filter(p => p.estado === 'En Producción').length;
  const pedidosPesaje = filteredPedidos.filter(p => p.estado === 'En Pesaje').length;
  const pedidosDespachando = filteredPedidos.filter(p => p.estado === 'Despachando').length;
  const pedidosCompletados = filteredPedidos.filter(p => ['Entregado', 'Completado', 'Completado con alerta', 'Devolución'].includes(p.estado)).length;
  const pedidosCancelados = filteredPedidos.filter(p => p.estado === 'Cancelado').length;

  const mermaTotal = pedidos.reduce((acc, p) => acc + p.mermaTotal, 0);
  const pesoTotalGeneral = pedidos.reduce((acc, p) => acc + p.pesoTotalPedido, 0);
  const cantidadTotalAves = pedidos.reduce((acc, p) => acc + p.cantidad, 0);

  // Datos para gráficos
  const pedidosPorEstado = [
    { name: 'Pendiente', value: pedidosPendientes, color: '#f59e0b' },
    { name: 'Producción', value: pedidosProduccion, color: '#3b82f6' },
    { name: 'En Pesaje', value: pedidosPesaje, color: '#a855f7' },
    { name: 'Despachando', value: pedidosDespachando, color: '#3b82f6' },
    { name: 'Completado', value: pedidosCompletados, color: '#10b981' },
    { name: 'Cancelado', value: pedidosCancelados, color: '#ef4444' }
  ];

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'Pendiente':
        return { bg: 'from-amber-900/20 to-amber-800/20', border: 'border-amber-700/30', text: 'text-amber-300' };
      case 'En Producción':
        return { bg: 'from-blue-900/20 to-blue-800/20', border: 'border-blue-700/30', text: 'text-blue-300' };
      case 'En Pesaje':
        return { bg: 'from-purple-900/20 to-purple-800/20', border: 'border-purple-700/30', text: 'text-purple-300' };
      case 'En Despacho':
      case 'Despachando':
        return { bg: 'from-blue-900/20 to-blue-800/20', border: 'border-blue-700/30', text: 'text-blue-300' };
      case 'Entregado':
      case 'Completado':
        return { bg: 'from-green-900/20 to-green-800/20', border: 'border-green-700/30', text: 'text-green-300' };
      case 'Cancelado':
        return { bg: 'from-red-900/20 to-red-800/20', border: 'border-red-700/30', text: 'text-red-300' };
      default:
        return { bg: 'from-gray-900/20 to-gray-800/20', border: 'border-gray-700/30', text: 'text-gray-300' };
    }
  };

  const getPriorityColor = (prioridadBase: number) => {
    if (prioridadBase <= 3) {
      return { bg: 'from-red-900/20 to-red-800/20', border: 'border-red-700/30', text: 'text-red-300' };
    } else if (prioridadBase <= 6) {
      return { bg: 'from-yellow-900/20 to-yellow-800/20', border: 'border-yellow-700/30', text: 'text-yellow-300' };
    } else {
      return { bg: 'from-green-900/20 to-green-800/20', border: 'border-green-700/30', text: 'text-green-300' };
    }
  };

  return (
    <div className="min-h-screen p-4 sm:p-6" style={{ background: c.bgPage }}>
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
          <div className="space-y-2">
            <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-3" style={{ color: c.text }}>
              <div className="p-3 border border-amber-500/20 rounded-xl" style={{ background: c.bgCardAlt }}>
                <Package className="w-6 h-6 text-amber-400" />
              </div>
              <div>
                <div>Gestión de Pedidos</div>
                <div className="text-sm font-normal text-amber-400 flex items-center gap-2 mt-1">
                  <Tag className="w-4 h-4" />
                  Sistema: C001.1 → C001.2 → C002.1
                </div>
              </div>
            </h1>
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 text-sm" style={{ color: c.textSecondary }}>
                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                <span>{pedidosAgrupados.length} Clientes</span>
              </div>
              <div className="flex items-center gap-2 text-sm" style={{ color: c.textSecondary }}>
                <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                <span>{totalPedidos} Pedidos activos</span>
              </div>
              <div className="flex items-center gap-2 text-sm" style={{ color: c.textSecondary }}>
                <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                <span>{cantidadTotalAves} Aves totales</span>
              </div>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-3">
            <div className="border rounded-xl px-4 py-2 flex items-center gap-3" style={{ background: c.bgCardAlt, borderColor: c.border }}>
              <div className="text-center">
                <div className="text-sm" style={{ color: c.textSecondary }}>Pendientes</div>
                <div className="text-2xl font-bold text-amber-400">{pedidosPendientes}</div>
              </div>
              <div className="h-8 w-px" style={{ background: c.border }}></div>
              <div className="text-center">
                <div className="text-sm" style={{ color: c.textSecondary }}>Producción</div>
                <div className="text-2xl font-bold text-blue-400">{pedidosProduccion}</div>
              </div>
              <div className="h-8 w-px" style={{ background: c.border }}></div>
              <div className="text-center">
                <div className="text-sm" style={{ color: c.textSecondary }}>En Pesaje</div>
                <div className="text-2xl font-bold text-purple-400">{pedidosPesaje}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Controles de Vista */}
        <div className="flex flex-wrap gap-3 mb-4">
          <button
            onClick={() => setVistaGrupos(!vistaGrupos)}
            className={`px-4 py-2 rounded-lg border flex items-center gap-2 ${
              vistaGrupos
                ? 'bg-amber-900/20 border-amber-700/30 text-amber-400'
                : 'bg-blue-900/20 border-blue-700/30 text-blue-400'
            }`}
          >
            <Layers className="w-4 h-4" />
            {vistaGrupos ? 'Vista Grupos' : 'Vista Individual'}
          </button>
          
          <button
            onClick={() => setIsContenedoresModalOpen(true)}
            className="px-4 py-2 bg-black/50 border border-gray-800 rounded-lg text-white flex items-center gap-2"
          >
            <Settings className="w-4 h-4" />
            Contenedores
          </button>
        </div>

        {/* Filtros */}
        <div className="border rounded-2xl p-5 mb-8" style={{ background: c.bgCardAlt, borderColor: c.border }}>
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar cliente, número, ave..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border rounded-xl placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20"
                style={{ background: c.bgCard, borderColor: c.border, color: c.text }}
              />
            </div>

            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <select
                value={filterEstado}
                onChange={(e) => setFilterEstado(e.target.value)}
                className="w-full pl-10 pr-10 py-3 border rounded-xl appearance-none focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/20"
                style={{ background: c.bgCard, borderColor: c.border, color: c.text }}
              >
                <option value="all" style={{ background: isDark ? '#000' : '#fff', color: c.text }}>Todos</option>
                <option value="Pendiente" style={{ background: isDark ? '#000' : '#fff', color: c.text }}>Pendiente</option>
                <option value="En Producción" style={{ background: isDark ? '#000' : '#fff', color: c.text }}>En Producción</option>
                <option value="En Pesaje" style={{ background: isDark ? '#000' : '#fff', color: c.text }}>En Pesaje</option>
                <option value="En Despacho" style={{ background: isDark ? '#000' : '#fff', color: c.text }}>En Despacho</option>
                <option value="Despachando" style={{ background: isDark ? '#000' : '#fff', color: c.text }}>Despachando</option>
                <option value="Completado" style={{ background: isDark ? '#000' : '#fff', color: c.text }}>Completado</option>
                <option value="Cancelado" style={{ background: isDark ? '#000' : '#fff', color: c.text }}>Cancelado</option>
              </select>
            </div>

            <div className="relative">
              <Package className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <select
                value={filterTipoAve}
                onChange={(e) => { setFilterTipoAve(e.target.value); setFilterVariedad('all'); setFilterPresentacion('all'); }}
                className="w-full pl-10 pr-10 py-3 border rounded-xl appearance-none focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/20"
                style={{ background: c.bgCard, borderColor: c.border, color: c.text }}
              >
                <option value="all" style={{ background: isDark ? '#000' : '#fff', color: c.text }}>Todos los tipos</option>
                {Array.from(new Set(pedidos.map(p => p.tipoAve))).map(tipo => (
                  <option key={tipo} value={tipo} style={{ background: isDark ? '#000' : '#fff', color: c.text }}>
                    {tipo}
                  </option>
                ))}
              </select>
            </div>

            <div className="relative">
              <Layers className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <select
                value={filterVariedad}
                onChange={(e) => setFilterVariedad(e.target.value)}
                disabled={filterTipoAve === 'all' || (() => { const variedades = Array.from(new Set(pedidos.filter(p => p.tipoAve === filterTipoAve && p.variedad).map(p => p.variedad!))); return variedades.length === 0; })()}
                className="w-full pl-10 pr-10 py-3 border rounded-xl appearance-none focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/20 disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ background: c.bgCard, borderColor: c.border, color: c.text }}
              >
                <option value="all" style={{ background: isDark ? '#000' : '#fff', color: c.text }}>Todas las variedades</option>
                {Array.from(new Set(pedidos.filter(p => filterTipoAve === 'all' || p.tipoAve === filterTipoAve).filter(p => p.variedad).map(p => p.variedad!))).map(v => (
                  <option key={v} value={v} style={{ background: isDark ? '#000' : '#fff', color: c.text }}>{v}</option>
                ))}
              </select>
            </div>

            <div className="relative">
              <Tag className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <select
                value={filterPresentacion}
                onChange={(e) => setFilterPresentacion(e.target.value)}
                disabled={filterTipoAve === 'all'}
                className="w-full pl-10 pr-10 py-3 border rounded-xl appearance-none focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ background: c.bgCard, borderColor: c.border, color: c.text }}
              >
                <option value="all" style={{ background: isDark ? '#000' : '#fff', color: c.text }}>Todas las presentaciones</option>
                {Array.from(new Set(pedidos.filter(p => filterTipoAve === 'all' || p.tipoAve === filterTipoAve).map(p => p.presentacion))).map(pres => (
                  <option key={pres} value={pres} style={{ background: isDark ? '#000' : '#fff', color: c.text }}>{pres}</option>
                ))}
              </select>
            </div>

            {(searchTerm || filterEstado !== 'all' || filterTipoAve !== 'all' || filterVariedad !== 'all' || filterPresentacion !== 'all') && (
              <button
                onClick={() => { setSearchTerm(''); setFilterEstado('all'); setFilterTipoAve('all'); setFilterVariedad('all'); setFilterPresentacion('all'); }}
                className="flex items-center gap-2 px-4 py-3 rounded-xl border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
                Limpiar
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Métricas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-8">
        <div className="border border-amber-700/30 rounded-xl p-4" style={{ background: c.bgCardAlt }}>
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm" style={{ color: c.textSecondary }}>Total de Aves</p>
            <TrendingUp className="w-5 h-5 text-amber-400" />
          </div>
          <p className="text-2xl font-bold text-amber-400">{cantidadTotalAves}</p>
          <p className="text-xs" style={{ color: c.textSecondary }}>unidades totales</p>
        </div>

        <div className="border border-red-700/30 rounded-xl p-4" style={{ background: c.bgCardAlt }}>
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm" style={{ color: c.textSecondary }}>Merma Total</p>
            <Scale className="w-5 h-5 text-red-400" />
          </div>
          <p className="text-2xl font-bold text-red-400">{mermaTotal.toFixed(2)} kg</p>
          <p className="text-xs" style={{ color: c.textSecondary }}>kilogramos</p>
        </div>

        <div className="border border-green-700/30 rounded-xl p-4" style={{ background: c.bgCardAlt }}>
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm" style={{ color: c.textSecondary }}>Peso Total</p>
            <Package className="w-5 h-5 text-green-400" />
          </div>
          <p className="text-2xl font-bold text-green-400">{pesoTotalGeneral.toFixed(2)} kg</p>
          <p className="text-xs" style={{ color: c.textSecondary }}>kilogramos (estimado)</p>
        </div>
      </div>

      {/* Grupos de Clientes */}
      {vistaGrupos && pedidosAgrupados.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2" style={{ color: c.text }}>
            <User className="w-5 h-5 text-blue-400" />
            Agrupado por Cliente ({pedidosAgrupados.length} clientes)
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {pedidosAgrupados.map(grupo => (
              <div
                key={grupo.numeroCliente}
                className="border rounded-2xl p-5 transition-all"
                style={{ background: c.bgCardAlt, borderColor: c.border }}
              >
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <div className="font-bold text-lg" style={{ color: c.text }}>{grupo.cliente}</div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-blue-400 font-mono">{grupo.numeroCliente}</span>
                      {(() => {
                        const cl = clientes.find(c => c.nombre === grupo.cliente);
                        const zona = cl?.zona;
                        if (!zona) return null;
                        const m = zona.match(/(\d+)/);
                        const label = m ? `Zona ${m[1]}` : zona;
                        return (
                          <span className="text-[10px] font-medium px-1.5 py-0.5 rounded inline-flex items-center gap-1"
                            style={{ background: 'rgba(168,85,247,0.1)', border: '1px solid rgba(168,85,247,0.2)', color: '#a855f7' }}>
                            <MapPin className="w-3 h-3" />{label}
                          </span>
                        );
                      })()}
                    </div>
                  </div>
                  <div className="px-3 py-1 bg-amber-900/20 border border-amber-700/30 rounded-lg">
                    <span className="text-amber-400 text-sm">{grupo.pedidos.length} pedidos</span>
                  </div>
                </div>

                <div className="space-y-3 mb-4">
                  <div className="flex justify-between items-center">
                    <span style={{ color: c.textSecondary }}>Total aves:</span>
                    <span className="font-bold" style={{ color: c.text }}>{grupo.totalAves}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span style={{ color: c.textSecondary }}>Pendientes:</span>
                    <span className="text-amber-400 font-bold">{grupo.pedidosPendientes}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span style={{ color: c.textSecondary }}>En producción:</span>
                    <span className="text-blue-400 font-bold">{grupo.pedidosEnProduccion}</span>
                  </div>
                </div>

                <div className="pt-4 border-t" style={{ borderColor: c.border }}>
                  <h4 className="text-xs font-semibold mb-2" style={{ color: c.textSecondary }}>Pedidos:</h4>
                  <div className="space-y-2">
                    {grupo.pedidos.slice(0, 3).map((pedido) => (
                      <div key={pedido.subNumero} className="flex items-center justify-between p-2 rounded-lg" style={{ background: c.g04 }}>
                        <div className="flex items-center gap-2">
                          <div className={`w-6 h-6 rounded flex items-center justify-center text-xs font-bold ${
                            getEstadoColor(pedido.estado).bg
                          } ${getEstadoColor(pedido.estado).text}`}>
                            {pedido.subNumero}
                          </div>
                          <span style={{ color: c.text }}>{pedido.tipoAve}</span>
                          {pedido.variedad && (
                            <span className="text-[10px] text-amber-400">{pedido.variedad}</span>
                          )}
                        </div>
                        <div className="text-right">
                          <div className="font-medium" style={{ color: c.text }}>{pedido.cantidad} aves</div>
                          <div className="text-xs" style={{ color: c.textSecondary }}>{pedido.estado}</div>
                        </div>
                      </div>
                    ))}
                    {grupo.pedidos.length > 3 && (
                      <div className="text-center text-sm" style={{ color: c.textSecondary }}>
                        + {grupo.pedidos.length - 3} pedidos más
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tabla de Pedidos */}
      <div className="border rounded-2xl overflow-hidden" style={{ background: c.bgCardAlt, borderColor: c.border }}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b" style={{ background: c.bgTableHeader, borderColor: c.border }}>
                <th className="px-6 py-4 text-left">
                  <div className="text-xs font-semibold uppercase" style={{ color: c.textSecondary }}>Orden</div>
                </th>
                <th className="px-6 py-4 text-left">
                  <div className="text-xs font-semibold uppercase" style={{ color: c.textSecondary }}>N° Pedido</div>
                </th>
                <th className="px-6 py-4 text-left">
                  <div className="text-xs font-semibold uppercase" style={{ color: c.textSecondary }}>Cliente</div>
                </th>
                <th className="px-6 py-4 text-left">
                  <div className="text-xs font-semibold uppercase" style={{ color: c.textSecondary }}>Zona</div>
                </th>
                <th className="px-6 py-4 text-left">
                  <div className="text-xs font-semibold uppercase" style={{ color: c.textSecondary }}>Producto</div>
                </th>
                <th className="px-6 py-4 text-left">
                  <div className="text-xs font-semibold uppercase" style={{ color: c.textSecondary }}>Cantidad</div>
                </th>
                <th className="px-6 py-4 text-left">
                  <div className="text-xs font-semibold uppercase" style={{ color: c.textSecondary }}>Presentación</div>
                </th>
                <th className="px-6 py-4 text-left">
                  <div className="text-xs font-semibold uppercase" style={{ color: c.textSecondary }}>Estado</div>
                </th>
                <th className="px-6 py-4 text-left">
                  <div className="text-xs font-semibold uppercase" style={{ color: c.textSecondary }}>Acciones</div>
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredPedidos.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center">
                    <div style={{ color: c.textMuted }}>
                      {pedidos.length === 0 
                        ? 'No hay pedidos confirmados' 
                        : 'No hay pedidos que coincidan con los filtros'}
                    </div>
                  </td>
                </tr>
              ) : (
                filteredPedidos.map((pedido) => {
                  const priorityStyle = getPriorityColor(pedido.prioridadBase);
                  const estadoStyle = getEstadoColor(pedido.estado);
                  const esVivo = pedido.presentacion.toLowerCase().includes('vivo');

                  return (
                    <tr 
                      key={pedido.id}
                      className={`border-b transition-colors ${
                        pedido.estado === 'Cancelado' ? 'opacity-60' : ''
                      }`}
                      style={{ borderColor: c.borderSubtle }}
                    >
                      <td className="px-6 py-4">
                        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${priorityStyle.bg} border ${priorityStyle.border} flex items-center justify-center font-bold ${priorityStyle.text}`}>
                          {pedido.prioridadBase}
                        </div>
                      </td>
                      
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <div className="font-mono font-bold" style={{ color: c.text }}>{pedido.numeroPedido}</div>
                          <div className="text-xs" style={{ color: c.textMuted }}>
                            {pedido.fecha} {pedido.hora}
                          </div>
                        </div>
                      </td>
                      
                      <td className="px-6 py-4">
                        <div className="font-medium" style={{ color: c.text }}>{pedido.cliente}</div>
                        <div className="text-xs" style={{ color: c.textMuted }}>Cliente {pedido.numeroCliente}</div>
                      </td>

                      <td className="px-6 py-4">
                        {(() => {
                          const cl = clientes.find(cl => cl.nombre === pedido.cliente);
                          const zona = cl?.zona;
                          if (!zona) return <span className="text-xs" style={{ color: c.textMuted }}>—</span>;
                          const m = zona.match(/(\d+)/);
                          const label = m ? `Zona ${m[1]}` : zona;
                          return (
                            <span className="text-xs font-medium px-2 py-1 rounded-md inline-flex items-center gap-1"
                              style={{ background: 'rgba(168,85,247,0.1)', border: '1px solid rgba(168,85,247,0.2)', color: '#a855f7' }}>
                              <MapPin className="w-3 h-3" />{label}
                            </span>
                          );
                        })()}
                      </td>
                      
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <div className="text-emerald-300 font-medium">{pedido.tipoAve}</div>
                          {pedido.variedad && (
                            <div className="text-xs text-amber-400">{pedido.variedad}</div>
                          )}
                        </div>
                      </td>
                      
                      <td className="px-6 py-4">
                        <div className="font-bold text-lg" style={{ color: c.text }}>{pedido.cantidad}</div>
                        {esVivo && pedido.cantidadJabas && (
                          <div className="text-[10px] px-2 py-0.5 rounded-full inline-flex items-center gap-1 mt-1"
                            style={{ background: 'rgba(245,158,11,0.12)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.2)' }}>
                            <Grid3x3 className="w-3 h-3" />
                            {pedido.cantidadJabas} jabas × {pedido.unidadesPorJaba} u
                          </div>
                        )}
                      </td>
                      
                      <td className="px-6 py-4">
                        <div style={{ color: c.text }}>{pedido.presentacion}</div>
                      </td>
                      
                      <td className="px-6 py-4">
                        <div className={`px-3 py-1.5 rounded-lg text-sm font-medium inline-block bg-gradient-to-br ${estadoStyle.bg} border ${estadoStyle.border} ${estadoStyle.text}`}>
                          {pedido.estado}
                        </div>
                      </td>
                      
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => abrirDetalle(pedido)}
                            className="p-2 bg-blue-900/20 border border-blue-700/30 rounded-lg hover:bg-blue-900/30 transition-colors"
                            title="Ver detalle"
                          >
                            <Eye className="w-4 h-4 text-blue-400" />
                          </button>
                          
                          {pedido.estado === 'Pendiente' && (
                            <>
                              <button
                                onClick={() => iniciarEdicion(pedido)}
                                className="p-2 bg-green-900/20 border border-green-700/30 rounded-lg hover:bg-green-900/30 transition-colors"
                                title="Editar pedido"
                              >
                                <Edit2 className="w-4 h-4 text-green-400" />
                              </button>
                              <button
                                onClick={() => moverAProduccion(pedido)}
                                className="p-2 bg-amber-900/20 border border-amber-700/30 rounded-lg hover:bg-amber-900/30 transition-colors"
                                title="Enviar a producción"
                              >
                                <Truck className="w-4 h-4 text-amber-400" />
                              </button>
                            </>
                          )}
                          
                          {pedido.estado === 'En Producción' && (
                            <button
                              onClick={() => moverAPesaje(pedido)}
                              className="p-2 bg-purple-900/20 border border-purple-700/30 rounded-lg hover:bg-purple-900/30 transition-colors"
                              title="Enviar a pesaje"
                            >
                              <Scale className="w-4 h-4 text-purple-400" />
                            </button>
                          )}
                          
                          <button
                            onClick={() => iniciarCancelacion(pedido)}
                            className="p-2 bg-red-900/20 border border-red-700/30 rounded-lg hover:bg-red-900/30 transition-colors"
                            title="Cancelar pedido"
                          >
                            <X className="w-4 h-4 text-red-400" />
                          </button>
                          
                          <button
                            onClick={() => eliminarPedido(pedido.id)}
                            className="p-2 bg-gray-800/50 border border-gray-700/30 rounded-lg hover:bg-gray-800 transition-colors"
                            title="Eliminar pedido"
                          >
                            <Trash2 className="w-4 h-4 text-gray-400" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Detalle */}
      {mostrarDetalle && pedidoSeleccionado && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{
          background: c.bgModalOverlay
        }}>
          <div className="border rounded-2xl w-full max-w-md" style={{ background: c.bgModal, borderColor: c.border }}>
            <div className="p-6 border-b" style={{ borderColor: c.border }}>
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold" style={{ color: c.text }}>Detalle del Pedido</h3>
                <button
                  onClick={() => setMostrarDetalle(false)}
                  className="p-2 rounded-lg hover:bg-gray-800 transition-colors"
                >
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm" style={{ color: c.textSecondary }}>N° Pedido</div>
                  <div className="font-mono font-bold" style={{ color: c.text }}>{pedidoSeleccionado.numeroPedido}</div>
                </div>
                <div>
                  <div className="text-sm" style={{ color: c.textSecondary }}>Cliente</div>
                  <div className="font-medium" style={{ color: c.text }}>{pedidoSeleccionado.cliente}</div>
                </div>
                <div>
                  <div className="text-sm" style={{ color: c.textSecondary }}>Producto</div>
                  <div className="text-emerald-300 font-medium">{pedidoSeleccionado.tipoAve}</div>
                  {pedidoSeleccionado.variedad && (
                    <div className="text-xs text-amber-400">{pedidoSeleccionado.variedad}</div>
                  )}
                </div>
                <div>
                  <div className="text-sm" style={{ color: c.textSecondary }}>Cantidad</div>
                  <div className="font-bold" style={{ color: c.text }}>{pedidoSeleccionado.cantidad} aves</div>
                  {pedidoSeleccionado.cantidadJabas && (
                    <div className="text-xs text-amber-400">
                      {pedidoSeleccionado.cantidadJabas} jabas × {pedidoSeleccionado.unidadesPorJaba} u
                    </div>
                  )}
                </div>
                <div>
                  <div className="text-sm" style={{ color: c.textSecondary }}>Presentación</div>
                  <div style={{ color: c.text }}>{pedidoSeleccionado.presentacion}</div>
                </div>
              </div>
              
              <div className="pt-4 border-t" style={{ borderColor: c.border }}>
                <div className="text-sm mb-2" style={{ color: c.textSecondary }}>Resumen de Pesos</div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg p-3" style={{ background: c.bgCard }}>
                    <div className="text-xs" style={{ color: c.textSecondary }}>Merma Total</div>
                    <div className="text-red-400 font-bold">{pedidoSeleccionado.mermaTotal.toFixed(2)} kg</div>
                  </div>
                  <div className="rounded-lg p-3" style={{ background: c.bgCard }}>
                    <div className="text-xs" style={{ color: c.textSecondary }}>Peso Estimado</div>
                    <div className="text-green-400 font-bold">{pedidoSeleccionado.pesoTotalPedido.toFixed(2)} kg</div>
                  </div>
                </div>
              </div>
              
              <div className="pt-4 border-t" style={{ borderColor: c.border }}>
                <div className="text-sm mb-2" style={{ color: c.textSecondary }}>Información Adicional</div>
                <div className="text-sm space-y-1" style={{ color: c.textSecondary }}>
                  <div>Fecha: {pedidoSeleccionado.fecha} {pedidoSeleccionado.hora}</div>
                  <div>Estado: {pedidoSeleccionado.estado}</div>
                  {pedidoSeleccionado.esSubPedido && (
                    <div className="text-blue-400">Este es un sub-pedido</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Edición por Jabas/Unidades */}
      {modoEdicion === 'EDITAR' && pedidoSeleccionado && edicionJabas && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{
          background: c.bgModalOverlay
        }}>
          <div className="border rounded-2xl w-full max-w-md" style={{ background: c.bgModal, borderColor: c.border }}>
            <div className="p-6 border-b" style={{ borderColor: c.border }}>
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold" style={{ color: c.text }}>Editar Pedido</h3>
                <button
                  onClick={() => {
                    setModoEdicion(null);
                    setPedidoSeleccionado(null);
                    setEdicionJabas(null);
                  }}
                  className="p-2 rounded-lg hover:bg-gray-800 transition-colors"
                >
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div className="rounded-xl p-4" style={{ background: c.bgCard, border: '1px solid ' + c.border }}>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <div style={{ color: c.textSecondary }}>N° Pedido</div>
                    <div className="font-mono" style={{ color: c.text }}>{pedidoSeleccionado.numeroPedido}</div>
                  </div>
                  <div>
                    <div style={{ color: c.textSecondary }}>Cliente</div>
                    <div style={{ color: c.text }}>{pedidoSeleccionado.cliente}</div>
                  </div>
                  <div>
                    <div style={{ color: c.textSecondary }}>Producto</div>
                    <div className="text-emerald-300">{pedidoSeleccionado.tipoAve}</div>
                  </div>
                  <div>
                    <div style={{ color: c.textSecondary }}>Presentación</div>
                    <div style={{ color: c.text }}>{pedidoSeleccionado.presentacion}</div>
                  </div>
                </div>
              </div>

              {/* Selector de tipo de edición para productos vivos */}
              {pedidoSeleccionado.presentacion.toLowerCase().includes('vivo') && (
                <div className="flex gap-2">
                  <button
                    onClick={() => setEdicionJabas({ tipo: 'JABAS', cantidadJabas: pedidoSeleccionado.cantidadJabas, unidadesPorJaba: pedidoSeleccionado.unidadesPorJaba, cantidadTotal: pedidoSeleccionado.cantidad })}
                    className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${
                      edicionJabas.tipo === 'JABAS'
                        ? 'bg-amber-900/30 border border-amber-500/30 text-amber-400'
                        : 'bg-gray-800/50 border border-gray-700 text-gray-400'
                    }`}
                  >
                    Editar por Jabas
                  </button>
                  <button
                    onClick={() => setEdicionJabas({ tipo: 'UNIDADES', cantidadTotal: pedidoSeleccionado.cantidad })}
                    className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${
                      edicionJabas.tipo === 'UNIDADES'
                        ? 'bg-blue-900/30 border border-blue-500/30 text-blue-400'
                        : 'bg-gray-800/50 border border-gray-700 text-gray-400'
                    }`}
                  >
                    Editar por Unidades
                  </button>
                </div>
              )}

              {/* Formulario según tipo */}
              {edicionJabas.tipo === 'JABAS' ? (
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: c.textSecondary }}>
                      Cantidad de Jabas
                    </label>
                    <input
                      type="number"
                      value={edicionJabas.cantidadJabas || ''}
                      onChange={(e) => {
                        const jabas = parseInt(e.target.value) || 0;
                        const porJaba = edicionJabas.unidadesPorJaba || 10;
                        setEdicionJabas({
                          ...edicionJabas,
                          tipo: 'JABAS',
                          cantidadJabas: jabas,
                          cantidadTotal: jabas * porJaba
                        });
                      }}
                      min="1"
                      className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/20"
                      style={{ background: c.bgCard, borderColor: c.border, color: c.text }}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: c.textSecondary }}>
                      Unidades por Jaba
                    </label>
                    <input
                      type="number"
                      value={edicionJabas.unidadesPorJaba || ''}
                      onChange={(e) => {
                        const porJaba = parseInt(e.target.value) || 0;
                        const jabas = edicionJabas.cantidadJabas || 0;
                        setEdicionJabas({
                          ...edicionJabas,
                          tipo: 'JABAS',
                          unidadesPorJaba: porJaba,
                          cantidadTotal: jabas * porJaba
                        });
                      }}
                      min="1"
                      className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/20"
                      style={{ background: c.bgCard, borderColor: c.border, color: c.text }}
                    />
                  </div>
                  <div className="bg-amber-900/10 border border-amber-700/30 rounded-lg p-3">
                    <div className="flex justify-between items-center">
                      <span style={{ color: c.textSecondary }}>Total aves:</span>
                      <span className="text-amber-400 font-bold text-xl">
                        {(edicionJabas.cantidadJabas || 0) * (edicionJabas.unidadesPorJaba || 0)}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: c.textSecondary }}>
                    Nueva Cantidad (aves)
                  </label>
                  <input
                    type="number"
                    value={edicionJabas.cantidadTotal || ''}
                    onChange={(e) => {
                      const total = parseInt(e.target.value) || 0;
                      setEdicionJabas({
                        tipo: 'UNIDADES',
                        cantidadTotal: total
                      });
                    }}
                    min="1"
                    className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20"
                    style={{ background: c.bgCard, borderColor: c.border, color: c.text }}
                  />
                  {pedidoSeleccionado.presentacion.toLowerCase().includes('vivo') && (
                    <p className="text-xs text-gray-500 mt-2">
                      Se recalcularán las jabas automáticamente (aprox. {Math.ceil((edicionJabas.cantidadTotal || 0) / (pedidoSeleccionado.unidadesPorJaba || 10))} jabas)
                    </p>
                  )}
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  onClick={aplicarEdicion}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-900/30 to-blue-800/30 border border-blue-700/30 rounded-lg text-white font-semibold hover:from-blue-900/40 hover:to-blue-800/40 transition-all hover:scale-[1.02]"
                >
                  Aplicar Cambios
                </button>
                <button
                  onClick={() => {
                    setModoEdicion(null);
                    setPedidoSeleccionado(null);
                    setEdicionJabas(null);
                  }}
                  className="px-4 py-3 border rounded-lg font-semibold transition-colors"
                  style={{ background: c.bgCard, borderColor: c.border, color: c.text }}
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Cancelación */}
      {modoEdicion === 'CANCELAR' && pedidoSeleccionado && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{
          background: c.bgModalOverlay
        }}>
          <div className="border rounded-2xl w-full max-w-md" style={{ background: c.bgModal, borderColor: c.border }}>
            <div className="p-6 border-b" style={{ borderColor: c.border }}>
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold" style={{ color: c.text }}>Cancelar Pedido</h3>
                <button
                  onClick={() => {
                    setModoEdicion(null);
                    setPedidoSeleccionado(null);
                  }}
                  className="p-2 rounded-lg hover:bg-gray-800 transition-colors"
                >
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div className="rounded-xl p-4" style={{ background: c.bgCard, border: '1px solid ' + c.border }}>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <div style={{ color: c.textSecondary }}>N° Pedido</div>
                    <div className="font-mono" style={{ color: c.text }}>{pedidoSeleccionado.numeroPedido}</div>
                  </div>
                  <div>
                    <div style={{ color: c.textSecondary }}>Cliente</div>
                    <div style={{ color: c.text }}>{pedidoSeleccionado.cliente}</div>
                  </div>
                  <div>
                    <div style={{ color: c.textSecondary }}>Producto</div>
                    <div className="text-emerald-300">{pedidoSeleccionado.tipoAve}</div>
                  </div>
                  <div>
                    <div style={{ color: c.textSecondary }}>Cantidad</div>
                    <div style={{ color: c.text }}>{pedidoSeleccionado.cantidad} aves</div>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: c.textSecondary }}>
                  Motivo de Cancelación
                </label>
                <textarea
                  value={motivoCancelacion}
                  onChange={(e) => setMotivoCancelacion(e.target.value)}
                  placeholder="Ingrese el motivo de la cancelación..."
                  rows={3}
                  className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500/20"
                  style={{ background: c.bgCard, borderColor: c.border, color: c.text }}
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={aplicarCancelacion}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-red-900/30 to-red-800/30 border border-red-700/30 rounded-lg text-white font-semibold hover:from-red-900/40 hover:to-red-800/40 transition-all hover:scale-[1.02]"
                >
                  Confirmar Cancelación
                </button>
                <button
                  onClick={() => {
                    setModoEdicion(null);
                    setPedidoSeleccionado(null);
                  }}
                  className="px-4 py-3 border rounded-lg font-semibold transition-colors"
                  style={{ background: c.bgCard, borderColor: c.border, color: c.text }}
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="mt-8 border rounded-xl p-4" style={{ background: c.bgCardAlt, borderColor: c.border }}>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="text-center p-3">
            <div className="text-sm mb-1" style={{ color: c.textSecondary }}>Pedidos totales</div>
            <div className="text-2xl font-bold text-blue-400">{pedidos.length}</div>
          </div>
          <div className="text-center p-3">
            <div className="text-sm mb-1" style={{ color: c.textSecondary }}>Total aves</div>
            <div className="text-2xl font-bold text-green-400">{cantidadTotalAves}</div>
          </div>
          <div className="text-center p-3">
            <div className="text-sm mb-1" style={{ color: c.textSecondary }}>Clientes activos</div>
            <div className="text-2xl font-bold text-amber-400">{pedidosAgrupados.length}</div>
          </div>
          <div className="text-center p-3">
            <div className="text-sm mb-1" style={{ color: c.textSecondary }}>Peso estimado</div>
            <div className="text-2xl font-bold text-emerald-400">{pesoTotalGeneral.toFixed(0)} kg</div>
          </div>
        </div>
      </div>

      {/* Modal Contenedores */}
      <ModalContenedores
        isOpen={isContenedoresModalOpen}
        onClose={() => setIsContenedoresModalOpen(false)}
        contenedores={contenedoresContext || []}
        setContenedores={() => {}}
      />
    </div>
  );
}