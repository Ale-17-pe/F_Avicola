import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Search, Filter, Package, User, Calendar, CheckCircle, Clock, Settings, Scale, TrendingUp, PieChart as PieChartIcon, X, Eye, Layers, Truck, Box, Tag, AlertCircle, ChevronRight, Grid3x3 } from 'lucide-react';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import { ModalContenedores } from './ModalContenedores';
import { useApp } from '../contexts/AppContext';
import { toast } from 'sonner';

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
  estado: 'Pendiente' | 'En Producción' | 'Pesaje' | 'En Despacho' | 'Entregado' | 'Completado' | 'Cancelado';
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

  // Estados
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [pedidosAgrupados, setPedidosAgrupados] = useState<PedidoAgrupado[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEstado, setFilterEstado] = useState<string>('all');
  const [filterCliente, setFilterCliente] = useState<string>('all');
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
        estado: 'Pesaje'
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
    const matchesCliente = filterCliente === 'all' || pedido.cliente === filterCliente;
    const matchesTipoAve = filterTipoAve === 'all' || pedido.tipoAve === filterTipoAve;
    return matchesSearch && matchesEstado && matchesCliente && matchesTipoAve;
  });

  // ============ ESTADÍSTICAS ============
  const totalPedidos = filteredPedidos.length;
  const pedidosPendientes = filteredPedidos.filter(p => p.estado === 'Pendiente').length;
  const pedidosProduccion = filteredPedidos.filter(p => p.estado === 'En Producción').length;
  const pedidosPesaje = filteredPedidos.filter(p => p.estado === 'Pesaje').length;
  const pedidosCompletados = filteredPedidos.filter(p => p.estado === 'Completado').length;
  const pedidosCancelados = filteredPedidos.filter(p => p.estado === 'Cancelado').length;

  const mermaTotal = pedidos.reduce((acc, p) => acc + p.mermaTotal, 0);
  const pesoTotalGeneral = pedidos.reduce((acc, p) => acc + p.pesoTotalPedido, 0);
  const cantidadTotalAves = pedidos.reduce((acc, p) => acc + p.cantidad, 0);

  // Datos para gráficos
  const pedidosPorEstado = [
    { name: 'Pendiente', value: pedidosPendientes, color: '#f59e0b' },
    { name: 'Producción', value: pedidosProduccion, color: '#3b82f6' },
    { name: 'Pesaje', value: pedidosPesaje, color: '#a855f7' },
    { name: 'Completado', value: pedidosCompletados, color: '#10b981' },
    { name: 'Cancelado', value: pedidosCancelados, color: '#ef4444' }
  ];

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'Pendiente':
        return { bg: 'from-amber-900/20 to-amber-800/20', border: 'border-amber-700/30', text: 'text-amber-300' };
      case 'En Producción':
        return { bg: 'from-blue-900/20 to-blue-800/20', border: 'border-blue-700/30', text: 'text-blue-300' };
      case 'Pesaje':
        return { bg: 'from-purple-900/20 to-purple-800/20', border: 'border-purple-700/30', text: 'text-purple-300' };
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
    <div className="min-h-screen bg-black p-4 sm:p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
          <div className="space-y-2">
            <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-3">
              <div className="p-3 bg-black/50 border border-amber-500/20 rounded-xl">
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
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                <span>{pedidosAgrupados.length} Clientes</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                <span>{totalPedidos} Pedidos activos</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                <span>{cantidadTotalAves} Aves totales</span>
              </div>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-3">
            <div className="bg-black/50 border border-gray-800 rounded-xl px-4 py-2 flex items-center gap-3">
              <div className="text-center">
                <div className="text-sm text-gray-400">Pendientes</div>
                <div className="text-2xl font-bold text-amber-400">{pedidosPendientes}</div>
              </div>
              <div className="h-8 w-px bg-gray-800"></div>
              <div className="text-center">
                <div className="text-sm text-gray-400">Producción</div>
                <div className="text-2xl font-bold text-blue-400">{pedidosProduccion}</div>
              </div>
              <div className="h-8 w-px bg-gray-800"></div>
              <div className="text-center">
                <div className="text-sm text-gray-400">Pesaje</div>
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
        <div className="bg-black/50 border border-gray-800 rounded-2xl p-5 mb-8">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar cliente, número, ave..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-black/30 border border-gray-800 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20"
              />
            </div>

            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <select
                value={filterCliente}
                onChange={(e) => setFilterCliente(e.target.value)}
                className="w-full pl-10 pr-10 py-3 bg-black/30 border border-gray-800 rounded-xl text-white appearance-none focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500/20"
              >
                <option value="all" className="bg-black">Todos los clientes</option>
                {Array.from(new Set(pedidos.map(p => p.cliente))).map(cliente => (
                  <option key={cliente} value={cliente} className="bg-black">
                    {cliente}
                  </option>
                ))}
              </select>
            </div>

            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <select
                value={filterEstado}
                onChange={(e) => setFilterEstado(e.target.value)}
                className="w-full pl-10 pr-10 py-3 bg-black/30 border border-gray-800 rounded-xl text-white appearance-none focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/20"
              >
                <option value="all" className="bg-black">Todos</option>
                <option value="Pendiente" className="bg-black">Pendiente</option>
                <option value="En Producción" className="bg-black">En Producción</option>
                <option value="Pesaje" className="bg-black">Pesaje</option>
                <option value="Completado" className="bg-black">Completado</option>
                <option value="Cancelado" className="bg-black">Cancelado</option>
              </select>
            </div>

            <div className="relative">
              <Package className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <select
                value={filterTipoAve}
                onChange={(e) => setFilterTipoAve(e.target.value)}
                className="w-full pl-10 pr-10 py-3 bg-black/30 border border-gray-800 rounded-xl text-white appearance-none focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/20"
              >
                <option value="all" className="bg-black">Todos los tipos</option>
                {Array.from(new Set(pedidos.map(p => p.tipoAve))).map(tipo => (
                  <option key={tipo} value={tipo} className="bg-black">
                    {tipo}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Métricas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-black/50 border border-amber-700/30 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-400">Total de Aves</p>
            <TrendingUp className="w-5 h-5 text-amber-400" />
          </div>
          <p className="text-2xl font-bold text-amber-400">{cantidadTotalAves}</p>
          <p className="text-xs text-gray-400">unidades totales</p>
        </div>

        <div className="bg-black/50 border border-red-700/30 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-400">Merma Total</p>
            <Scale className="w-5 h-5 text-red-400" />
          </div>
          <p className="text-2xl font-bold text-red-400">{mermaTotal.toFixed(2)} kg</p>
          <p className="text-xs text-gray-400">kilogramos</p>
        </div>

        <div className="bg-black/50 border border-green-700/30 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-400">Peso Total</p>
            <Package className="w-5 h-5 text-green-400" />
          </div>
          <p className="text-2xl font-bold text-green-400">{pesoTotalGeneral.toFixed(2)} kg</p>
          <p className="text-xs text-gray-400">kilogramos (estimado)</p>
        </div>
      </div>

      {/* Grupos de Clientes */}
      {vistaGrupos && pedidosAgrupados.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <User className="w-5 h-5 text-blue-400" />
            Agrupado por Cliente ({pedidosAgrupados.length} clientes)
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {pedidosAgrupados.map(grupo => (
              <div
                key={grupo.numeroCliente}
                className="bg-black/50 border border-gray-800 rounded-2xl p-5 hover:border-gray-700 transition-all"
              >
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <div className="text-white font-bold text-lg">{grupo.cliente}</div>
                    <div className="text-sm text-blue-400 font-mono">{grupo.numeroCliente}</div>
                  </div>
                  <div className="px-3 py-1 bg-amber-900/20 border border-amber-700/30 rounded-lg">
                    <span className="text-amber-400 text-sm">{grupo.pedidos.length} pedidos</span>
                  </div>
                </div>

                <div className="space-y-3 mb-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Total aves:</span>
                    <span className="text-white font-bold">{grupo.totalAves}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Pendientes:</span>
                    <span className="text-amber-400 font-bold">{grupo.pedidosPendientes}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">En producción:</span>
                    <span className="text-blue-400 font-bold">{grupo.pedidosEnProduccion}</span>
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-800">
                  <div className="space-y-2">
                    {grupo.pedidos.slice(0, 3).map(pedido => (
                      <div key={pedido.id} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <div className={`w-6 h-6 rounded flex items-center justify-center text-xs font-bold ${
                            getEstadoColor(pedido.estado).bg
                          } ${getEstadoColor(pedido.estado).text}`}>
                            {pedido.subNumero}
                          </div>
                          <span className="text-white">{pedido.tipoAve}</span>
                          {pedido.variedad && (
                            <span className="text-[10px] text-amber-400">{pedido.variedad}</span>
                          )}
                        </div>
                        <div className="text-right">
                          <div className="text-white font-medium">{pedido.cantidad} aves</div>
                          <div className="text-xs text-gray-400">{pedido.estado}</div>
                        </div>
                      </div>
                    ))}
                    {grupo.pedidos.length > 3 && (
                      <div className="text-center text-sm text-gray-400">
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
      <div className="bg-black/50 border border-gray-800 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-black border-b border-gray-800">
                <th className="px-6 py-4 text-left">
                  <div className="text-xs font-semibold text-gray-400 uppercase">Orden</div>
                </th>
                <th className="px-6 py-4 text-left">
                  <div className="text-xs font-semibold text-gray-400 uppercase">N° Pedido</div>
                </th>
                <th className="px-6 py-4 text-left">
                  <div className="text-xs font-semibold text-gray-400 uppercase">Cliente</div>
                </th>
                <th className="px-6 py-4 text-left">
                  <div className="text-xs font-semibold text-gray-400 uppercase">Producto</div>
                </th>
                <th className="px-6 py-4 text-left">
                  <div className="text-xs font-semibold text-gray-400 uppercase">Cantidad</div>
                </th>
                <th className="px-6 py-4 text-left">
                  <div className="text-xs font-semibold text-gray-400 uppercase">Presentación</div>
                </th>
                <th className="px-6 py-4 text-left">
                  <div className="text-xs font-semibold text-gray-400 uppercase">Estado</div>
                </th>
                <th className="px-6 py-4 text-left">
                  <div className="text-xs font-semibold text-gray-400 uppercase">Acciones</div>
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredPedidos.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center">
                    <div className="text-gray-500">
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
                      className={`border-b border-gray-800/50 hover:bg-gray-900/30 transition-colors ${
                        pedido.estado === 'Cancelado' ? 'opacity-60' : ''
                      }`}
                    >
                      <td className="px-6 py-4">
                        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${priorityStyle.bg} border ${priorityStyle.border} flex items-center justify-center font-bold ${priorityStyle.text}`}>
                          {pedido.prioridadBase}
                        </div>
                      </td>
                      
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <div className="font-mono font-bold text-white">{pedido.numeroPedido}</div>
                          <div className="text-xs text-gray-500">
                            {pedido.fecha} {pedido.hora}
                          </div>
                        </div>
                      </td>
                      
                      <td className="px-6 py-4">
                        <div className="text-white font-medium">{pedido.cliente}</div>
                        <div className="text-xs text-gray-500">Cliente {pedido.numeroCliente}</div>
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
                        <div className="text-white font-bold text-lg">{pedido.cantidad}</div>
                        {esVivo && pedido.cantidadJabas && (
                          <div className="text-[10px] px-2 py-0.5 rounded-full inline-flex items-center gap-1 mt-1"
                            style={{ background: 'rgba(245,158,11,0.12)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.2)' }}>
                            <Grid3x3 className="w-3 h-3" />
                            {pedido.cantidadJabas} jabas × {pedido.unidadesPorJaba} u
                          </div>
                        )}
                      </td>
                      
                      <td className="px-6 py-4">
                        <div className="text-white">{pedido.presentacion}</div>
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
          background: 'rgba(0, 0, 0, 0.85)'
        }}>
          <div className="bg-black border border-gray-800 rounded-2xl w-full max-w-md">
            <div className="p-6 border-b border-gray-800">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-white">Detalle del Pedido</h3>
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
                  <div className="text-sm text-gray-400">N° Pedido</div>
                  <div className="text-white font-mono font-bold">{pedidoSeleccionado.numeroPedido}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-400">Cliente</div>
                  <div className="text-white font-medium">{pedidoSeleccionado.cliente}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-400">Producto</div>
                  <div className="text-emerald-300 font-medium">{pedidoSeleccionado.tipoAve}</div>
                  {pedidoSeleccionado.variedad && (
                    <div className="text-xs text-amber-400">{pedidoSeleccionado.variedad}</div>
                  )}
                </div>
                <div>
                  <div className="text-sm text-gray-400">Cantidad</div>
                  <div className="text-white font-bold">{pedidoSeleccionado.cantidad} aves</div>
                  {pedidoSeleccionado.cantidadJabas && (
                    <div className="text-xs text-amber-400">
                      {pedidoSeleccionado.cantidadJabas} jabas × {pedidoSeleccionado.unidadesPorJaba} u
                    </div>
                  )}
                </div>
                <div>
                  <div className="text-sm text-gray-400">Presentación</div>
                  <div className="text-white">{pedidoSeleccionado.presentacion}</div>
                </div>
              </div>
              
              <div className="pt-4 border-t border-gray-800">
                <div className="text-sm text-gray-400 mb-2">Resumen de Pesos</div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-black/30 rounded-lg p-3">
                    <div className="text-xs text-gray-400">Merma Total</div>
                    <div className="text-red-400 font-bold">{pedidoSeleccionado.mermaTotal.toFixed(2)} kg</div>
                  </div>
                  <div className="bg-black/30 rounded-lg p-3">
                    <div className="text-xs text-gray-400">Peso Estimado</div>
                    <div className="text-green-400 font-bold">{pedidoSeleccionado.pesoTotalPedido.toFixed(2)} kg</div>
                  </div>
                </div>
              </div>
              
              <div className="pt-4 border-t border-gray-800">
                <div className="text-sm text-gray-400 mb-2">Información Adicional</div>
                <div className="text-sm text-gray-300 space-y-1">
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
          background: 'rgba(0, 0, 0, 0.85)'
        }}>
          <div className="bg-black border border-gray-800 rounded-2xl w-full max-w-md">
            <div className="p-6 border-b border-gray-800">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-white">Editar Pedido</h3>
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
              <div className="bg-black/30 border border-gray-800 rounded-xl p-4">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <div className="text-gray-400">N° Pedido</div>
                    <div className="text-white font-mono">{pedidoSeleccionado.numeroPedido}</div>
                  </div>
                  <div>
                    <div className="text-gray-400">Cliente</div>
                    <div className="text-white">{pedidoSeleccionado.cliente}</div>
                  </div>
                  <div>
                    <div className="text-gray-400">Producto</div>
                    <div className="text-emerald-300">{pedidoSeleccionado.tipoAve}</div>
                  </div>
                  <div>
                    <div className="text-gray-400">Presentación</div>
                    <div className="text-white">{pedidoSeleccionado.presentacion}</div>
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
                    <label className="block text-sm font-medium text-gray-400 mb-2">
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
                      className="w-full px-4 py-3 bg-black/30 border border-gray-800 rounded-lg text-white focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/20"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">
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
                      className="w-full px-4 py-3 bg-black/30 border border-gray-800 rounded-lg text-white focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/20"
                    />
                  </div>
                  <div className="bg-amber-900/10 border border-amber-700/30 rounded-lg p-3">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Total aves:</span>
                      <span className="text-amber-400 font-bold text-xl">
                        {(edicionJabas.cantidadJabas || 0) * (edicionJabas.unidadesPorJaba || 0)}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
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
                    className="w-full px-4 py-3 bg-black/30 border border-gray-800 rounded-lg text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20"
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
                  className="px-4 py-3 bg-black/30 border border-gray-800 rounded-lg text-white font-semibold hover:bg-black/50 transition-colors"
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
          background: 'rgba(0, 0, 0, 0.85)'
        }}>
          <div className="bg-black border border-gray-800 rounded-2xl w-full max-w-md">
            <div className="p-6 border-b border-gray-800">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-white">Cancelar Pedido</h3>
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
              <div className="bg-black/30 border border-gray-800 rounded-xl p-4">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <div className="text-gray-400">N° Pedido</div>
                    <div className="text-white font-mono">{pedidoSeleccionado.numeroPedido}</div>
                  </div>
                  <div>
                    <div className="text-gray-400">Cliente</div>
                    <div className="text-white">{pedidoSeleccionado.cliente}</div>
                  </div>
                  <div>
                    <div className="text-gray-400">Producto</div>
                    <div className="text-emerald-300">{pedidoSeleccionado.tipoAve}</div>
                  </div>
                  <div>
                    <div className="text-gray-400">Cantidad</div>
                    <div className="text-white">{pedidoSeleccionado.cantidad} aves</div>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Motivo de Cancelación
                </label>
                <textarea
                  value={motivoCancelacion}
                  onChange={(e) => setMotivoCancelacion(e.target.value)}
                  placeholder="Ingrese el motivo de la cancelación..."
                  rows={3}
                  className="w-full px-4 py-3 bg-black/30 border border-gray-800 rounded-lg text-white focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500/20"
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
                  className="px-4 py-3 bg-black/30 border border-gray-800 rounded-lg text-white font-semibold hover:bg-black/50 transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="mt-8 bg-black/50 border border-gray-800 rounded-xl p-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="text-center p-3">
            <div className="text-sm text-gray-400 mb-1">Pedidos totales</div>
            <div className="text-2xl font-bold text-blue-400">{pedidos.length}</div>
          </div>
          <div className="text-center p-3">
            <div className="text-sm text-gray-400 mb-1">Total aves</div>
            <div className="text-2xl font-bold text-green-400">{cantidadTotalAves}</div>
          </div>
          <div className="text-center p-3">
            <div className="text-sm text-gray-400 mb-1">Clientes activos</div>
            <div className="text-2xl font-bold text-amber-400">{pedidosAgrupados.length}</div>
          </div>
          <div className="text-center p-3">
            <div className="text-sm text-gray-400 mb-1">Peso estimado</div>
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