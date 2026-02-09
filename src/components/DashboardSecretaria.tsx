import { useState } from 'react';
import { Plus, Edit2, Trash2, Search, Filter, Download, FileSpreadsheet, User, Calendar, Package, TrendingUp, DollarSign, CheckCircle, Clock, X } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { ModalNuevoPedido } from './ModalNuevoPedido';
import { Fragment } from 'react';

interface PedidoItem {
  tipoAve: string;
  variedad?: string;
  sexo?: string;
  presentacion: string;
  cantidad: number;
  pesoKg: number;
  precioUnitario: number;
  subtotal: number;
}

interface Pedido {
  id: string;
  numero: string;
  fecha: string;
  hora: string;
  vendedor: string;
  vendedorId: string;
  cliente: string;
  clienteId: string;
  items: PedidoItem[];
  total: number;
  estado: 'pendiente' | 'proceso' | 'completado' | 'cancelado';
  notas?: string;
}

export function DashboardSecretaria() {
  const { aves, tiposAve, empleados } = useApp();
  
  const [pedidos, setPedidos] = useState<Pedido[]>([
    {
      id: '1',
      numero: 'PED-001',
      fecha: '2025-02-03',
      hora: '09:30',
      vendedor: 'Ana García López',
      vendedorId: '1',
      cliente: 'Restaurante El Sabor',
      clienteId: '1',
      items: [
        {
          tipoAve: 'Pollo',
          variedad: 'Blanco',
          sexo: 'Macho',
          presentacion: 'Pelado',
          cantidad: 20,
          pesoKg: 50.0,
          precioUnitario: 8.50,
          subtotal: 425.00
        },
        {
          tipoAve: 'Pollo',
          variedad: 'Blanco',
          sexo: 'Hembra',
          presentacion: 'Destripado',
          cantidad: 15,
          pesoKg: 30.0,
          precioUnitario: 9.00,
          subtotal: 270.00
        }
      ],
      total: 695.00,
      estado: 'completado'
    },
    {
      id: '2',
      numero: 'PED-002',
      fecha: '2025-02-03',
      hora: '11:15',
      vendedor: 'Ana García López',
      vendedorId: '1',
      cliente: 'Pollería Don José',
      clienteId: '2',
      items: [
        {
          tipoAve: 'Gallina',
          variedad: 'Roja',
          presentacion: 'Vivo',
          cantidad: 30,
          pesoKg: 75.0,
          precioUnitario: 7.80,
          subtotal: 585.00
        }
      ],
      total: 585.00,
      estado: 'proceso'
    },
    {
      id: '3',
      numero: 'PED-003',
      fecha: '2025-02-03',
      hora: '14:00',
      vendedor: 'Ana García López',
      vendedorId: '1',
      cliente: 'Mercado Central',
      clienteId: '3',
      items: [
        {
          tipoAve: 'Pollo',
          variedad: 'Blanco',
          sexo: 'Macho',
          presentacion: 'Vivo',
          cantidad: 50,
          pesoKg: 125.0,
          precioUnitario: 7.50,
          subtotal: 937.50
        },
        {
          tipoAve: 'Pato',
          presentacion: 'Pelado',
          cantidad: 10,
          pesoKg: 25.0,
          precioUnitario: 12.00,
          subtotal: 300.00
        }
      ],
      total: 1237.50,
      estado: 'pendiente'
    }
  ]);

  const [busqueda, setBusqueda] = useState('');
  const [filtroEstado, setFiltroEstado] = useState<string>('todos');
  const [filtroFecha, setFiltroFecha] = useState('');
  const [mostrarModalNuevo, setMostrarModalNuevo] = useState(false);
  const [pedidoExpandido, setPedidoExpandido] = useState<string | null>(null);

  // Filtrar pedidos
  const pedidosFiltrados = pedidos.filter(pedido => {
    const matchBusqueda = 
      pedido.numero.toLowerCase().includes(busqueda.toLowerCase()) ||
      pedido.cliente.toLowerCase().includes(busqueda.toLowerCase()) ||
      pedido.vendedor.toLowerCase().includes(busqueda.toLowerCase());
    
    const matchEstado = filtroEstado === 'todos' || pedido.estado === filtroEstado;
    const matchFecha = !filtroFecha || pedido.fecha === filtroFecha;

    return matchBusqueda && matchEstado && matchFecha;
  });

  // Estadísticas
  const estadisticas = {
    totalPedidos: pedidos.length,
    pedidosHoy: pedidos.filter(p => p.fecha === '2025-02-03').length,
    ventasHoy: pedidos
      .filter(p => p.fecha === '2025-02-03' && p.estado === 'completado')
      .reduce((sum, p) => sum + p.total, 0),
    pendientes: pedidos.filter(p => p.estado === 'pendiente').length,
  };

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'completado': return 'bg-green-500/10 text-green-400 border-green-500/30';
      case 'proceso': return 'bg-blue-500/10 text-blue-400 border-blue-500/30';
      case 'pendiente': return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
      case 'cancelado': return 'bg-red-500/10 text-red-400 border-red-500/30';
      default: return 'bg-gray-500/10 text-gray-400 border-gray-500/30';
    }
  };

  const getEstadoIcon = (estado: string) => {
    switch (estado) {
      case 'completado': return <CheckCircle className="w-4 h-4" />;
      case 'proceso': return <Clock className="w-4 h-4" />;
      case 'pendiente': return <Clock className="w-4 h-4" />;
      case 'cancelado': return <X className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const exportarCSV = () => {
    const headers = ['N° Pedido', 'Fecha', 'Hora', 'Vendedor', 'Cliente', 'Total S/', 'Estado'];
    const rows = pedidosFiltrados.map(p => [
      p.numero,
      p.fecha,
      p.hora,
      p.vendedor,
      p.cliente,
      p.total.toFixed(2),
      p.estado
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `pedidos_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl text-white flex items-center gap-3">
            <FileSpreadsheet className="w-8 h-8 text-amber-400" />
            Panel de Control - Secretaría
          </h1>
          <p className="text-gray-400 mt-1">
            Gestión ejecutiva de pedidos y ventas
          </p>
        </div>
        <button
          onClick={() => setMostrarModalNuevo(true)}
          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-black font-medium rounded-xl transition-all shadow-lg hover:shadow-xl"
        >
          <Plus className="w-5 h-5" />
          Nuevo Pedido
        </button>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-black border border-zinc-700 rounded-xl p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm mb-1">Pedidos de Hoy</p>
              <p className="text-3xl text-white">{estadisticas.pedidosHoy}</p>
            </div>
            <Package className="w-10 h-10 text-amber-400 opacity-50" />
          </div>
        </div>

        <div className="bg-black border border-zinc-700 rounded-xl p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm mb-1">Ventas de Hoy</p>
              <p className="text-3xl text-green-400">S/ {estadisticas.ventasHoy.toFixed(2)}</p>
            </div>
            <DollarSign className="w-10 h-10 text-green-400 opacity-50" />
          </div>
        </div>

        <div className="bg-black border border-zinc-700 rounded-xl p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm mb-1">Pendientes</p>
              <p className="text-3xl text-amber-400">{estadisticas.pendientes}</p>
            </div>
            <Clock className="w-10 h-10 text-amber-400 opacity-50" />
          </div>
        </div>

        <div className="bg-black border border-zinc-700 rounded-xl p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm mb-1">Total Pedidos</p>
              <p className="text-3xl text-white">{estadisticas.totalPedidos}</p>
            </div>
            <TrendingUp className="w-10 h-10 text-blue-400 opacity-50" />
          </div>
        </div>
      </div>

      {/* Filtros y Búsqueda */}
      <div className="bg-black border border-zinc-700 rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-5 h-5 text-amber-400" />
          <h3 className="text-white">Filtros de Búsqueda</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Búsqueda */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por pedido, cliente o vendedor..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* Filtro Estado */}
          <select
            value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.target.value)}
            className="px-4 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-amber-500"
          >
            <option value="todos">Todos los estados</option>
            <option value="pendiente">Pendiente</option>
            <option value="proceso">En Proceso</option>
            <option value="completado">Completado</option>
            <option value="cancelado">Cancelado</option>
          </select>

          {/* Filtro Fecha */}
          <input
            type="date"
            value={filtroFecha}
            onChange={(e) => setFiltroFecha(e.target.value)}
            className="px-4 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-amber-500"
          />
        </div>

        <div className="flex items-center justify-between mt-4">
          <p className="text-gray-400 text-sm">
            Mostrando {pedidosFiltrados.length} de {pedidos.length} pedidos
          </p>
          <button
            onClick={exportarCSV}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
          >
            <Download className="w-4 h-4" />
            Exportar CSV
          </button>
        </div>
      </div>

      {/* Tabla Principal Tipo Excel */}
      <div className="bg-black border border-zinc-700 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-amber-500/20 to-amber-600/20 border-b-2 border-amber-500/50">
              <tr>
                <th className="text-left px-4 py-4 text-amber-400 font-bold text-sm">N° PEDIDO</th>
                <th className="text-left px-4 py-4 text-amber-400 font-bold text-sm">FECHA/HORA</th>
                <th className="text-left px-4 py-4 text-amber-400 font-bold text-sm">VENDEDOR</th>
                <th className="text-left px-4 py-4 text-amber-400 font-bold text-sm">CLIENTE</th>
                <th className="text-left px-4 py-4 text-amber-400 font-bold text-sm">ITEMS</th>
                <th className="text-right px-4 py-4 text-amber-400 font-bold text-sm">TOTAL</th>
                <th className="text-center px-4 py-4 text-amber-400 font-bold text-sm">ESTADO</th>
                <th className="text-center px-4 py-4 text-amber-400 font-bold text-sm">ACCIONES</th>
              </tr>
            </thead>
            <tbody>
              {pedidosFiltrados.map((pedido, index) => (
                <Fragment key={pedido.id}>
                  <tr 
                    className={`border-b border-zinc-800 hover:bg-zinc-800/30 transition-colors ${
                      index % 2 === 0 ? 'bg-zinc-900/30' : 'bg-zinc-900/10'
                    }`}
                  >
                    <td className="px-4 py-4">
                      <span className="text-white font-medium">{pedido.numero}</span>
                    </td>
                    <td className="px-4 py-4">
                      <div>
                        <p className="text-white text-sm flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-gray-400" />
                          {pedido.fecha}
                        </p>
                        <p className="text-gray-400 text-xs mt-0.5 flex items-center gap-1.5">
                          <Clock className="w-3 h-3" />
                          {pedido.hora}
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-amber-400" />
                        <span className="text-white text-sm">{pedido.vendedor}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-white text-sm">{pedido.cliente}</span>
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-gray-400 text-sm">{pedido.items.length} producto(s)</span>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <span className="text-green-400 font-bold text-base">
                        S/ {pedido.total.toFixed(2)}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex justify-center">
                        <span className={`px-3 py-1.5 rounded-lg text-xs border flex items-center gap-1.5 ${getEstadoColor(pedido.estado)}`}>
                          {getEstadoIcon(pedido.estado)}
                          <span className="capitalize">{pedido.estado}</span>
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => setPedidoExpandido(pedidoExpandido === pedido.id ? null : pedido.id)}
                          className="p-2 hover:bg-zinc-700 rounded-lg transition-colors text-blue-400"
                          title="Ver detalles"
                        >
                          <Package className="w-4 h-4" />
                        </button>
                        <button
                          className="p-2 hover:bg-zinc-700 rounded-lg transition-colors text-amber-400"
                          title="Editar"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          className="p-2 hover:bg-zinc-700 rounded-lg transition-colors text-red-400"
                          title="Eliminar"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                  
                  {/* Fila expandida con detalles */}
                  {pedidoExpandido === pedido.id && (
                    <tr className="bg-zinc-800/50 border-b border-zinc-700">
                      <td colSpan={8} className="px-4 py-4">
                        <div className="space-y-3">
                          <h4 className="text-amber-400 font-medium mb-3">Detalle de Items</h4>
                          <div className="overflow-x-auto">
                            <table className="w-full">
                              <thead className="bg-zinc-900/50">
                                <tr>
                                  <th className="text-left px-3 py-2 text-gray-400 text-xs">TIPO AVE</th>
                                  <th className="text-left px-3 py-2 text-gray-400 text-xs">VARIEDAD</th>
                                  <th className="text-left px-3 py-2 text-gray-400 text-xs">SEXO</th>
                                  <th className="text-left px-3 py-2 text-gray-400 text-xs">PRESENTACIÓN</th>
                                  <th className="text-right px-3 py-2 text-gray-400 text-xs">CANTIDAD</th>
                                  <th className="text-right px-3 py-2 text-gray-400 text-xs">PESO (KG)</th>
                                  <th className="text-right px-3 py-2 text-gray-400 text-xs">PRECIO/KG</th>
                                  <th className="text-right px-3 py-2 text-gray-400 text-xs">SUBTOTAL</th>
                                </tr>
                              </thead>
                              <tbody>
                                {pedido.items.map((item, itemIndex) => (
                                  <tr key={itemIndex} className="border-t border-zinc-700">
                                    <td className="px-3 py-2 text-white text-sm">{item.tipoAve}</td>
                                    <td className="px-3 py-2 text-gray-300 text-sm">{item.variedad || '-'}</td>
                                    <td className="px-3 py-2 text-gray-300 text-sm">{item.sexo || '-'}</td>
                                    <td className="px-3 py-2 text-gray-300 text-sm">{item.presentacion}</td>
                                    <td className="px-3 py-2 text-right text-white text-sm">{item.cantidad}</td>
                                    <td className="px-3 py-2 text-right text-white text-sm">{item.pesoKg.toFixed(2)}</td>
                                    <td className="px-3 py-2 text-right text-white text-sm">S/ {item.precioUnitario.toFixed(2)}</td>
                                    <td className="px-3 py-2 text-right text-green-400 font-medium text-sm">S/ {item.subtotal.toFixed(2)}</td>
                                  </tr>
                                ))}
                              </tbody>
                              <tfoot className="bg-zinc-900/50 border-t-2 border-amber-500/30">
                                <tr>
                                  <td colSpan={7} className="px-3 py-3 text-right text-amber-400 font-bold">TOTAL:</td>
                                  <td className="px-3 py-3 text-right text-green-400 font-bold text-base">S/ {pedido.total.toFixed(2)}</td>
                                </tr>
                              </tfoot>
                            </table>
                          </div>
                          {pedido.notas && (
                            <div className="mt-3 p-3 bg-zinc-900/50 rounded-lg border border-zinc-700">
                              <p className="text-gray-400 text-sm">
                                <span className="text-amber-400 font-medium">Notas:</span> {pedido.notas}
                              </p>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>

        {pedidosFiltrados.length === 0 && (
          <div className="text-center py-12">
            <FileSpreadsheet className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400">No se encontraron pedidos con los filtros aplicados</p>
          </div>
        )}
      </div>

      {/* Modal Nuevo Pedido */}
      <ModalNuevoPedido
        isOpen={mostrarModalNuevo}
        onClose={() => setMostrarModalNuevo(false)}
        onSubmit={(nuevoPedido) => {
          setPedidos([...pedidos, { ...nuevoPedido, id: Date.now().toString() }]);
          setMostrarModalNuevo(false);
        }}
      />
    </div>
  );
}