import { useState, useEffect } from 'react';
import { FileSpreadsheet, DollarSign, Scale, Package, Save, Edit3, CheckCircle, Calendar, Download, RefreshCw, Search, ChevronDown, ChevronUp, AlertTriangle } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { toast } from 'sonner';

// Interfaz para cada fila de la cartera de cobro
interface FilaCartera {
  id: string;
  pedidoId: string;
  cliente: string;
  tipo: string;
  presentacion: string;
  cantidad: number;
  cantidadLabel: string;
  merma: number;
  tara: number;
  contenedorTipo: string;
  devolucionPeso: number;
  devolucionCantidad: number;
  repesada: number;
  adicionPeso: number;
  clienteAdicional?: string;
  pesoPedido: number;
  pesoContenedor: number;
  pesoBruto: number;
  pesoNeto: number;
  precio: number;
  total: number;
  confirmado: boolean;
  editando: boolean;
  fecha: string;
  zona: string;
  conductor: string;
  numeroPedidoOriginal?: string;
}

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
  const { costosClientes, presentaciones, contenedores, clientes, tiposAve, pedidosConfirmados } = useApp();

  const [filasCartera, setFilasCartera] = useState<FilaCartera[]>([]);
  const [loading, setLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [fechaSeleccionada, setFechaSeleccionada] = useState(hoyStr());
  const [busqueda, setBusqueda] = useState('');
  const [editandoAll, setEditandoAll] = useState(false);
  const [confirmModal, setConfirmModal] = useState<{ open: boolean; filaId: string | null; cliente: string }>({
    open: false,
    filaId: null,
    cliente: ''
  });
  const [sortColumn, setSortColumn] = useState<string>('');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  const storageKey = (fecha: string) => `carteraCobro_${fecha}`;

  useEffect(() => {
    try {
      const data = localStorage.getItem(storageKey(fechaSeleccionada));
      if (data) {
        const parsed = JSON.parse(data);
        const migradas = parsed.map((f: any) => ({
          ...f,
          repesada: f.repesada ?? 0,
          merma: f.merma ?? 0,
          devolucionPeso: f.devolucionPeso ?? 0,
          adicionPeso: f.adicionPeso ?? 0,
          pesoNeto: f.pesoNeto ?? 0,
          precio: f.precio ?? 0,
          total: f.total ?? 0,
          pesoPedido: f.pesoPedido ?? 0,
          pesoBruto: f.pesoBruto ?? 0,
          pesoContenedor: f.pesoContenedor ?? 0
        }));
        setFilasCartera(migradas);
      } else {
        generarDesdePesajeControl();
      }
    } catch {
      setFilasCartera([]);
    }
  }, [fechaSeleccionada]);

  const generarDesdePesajeControl = () => {
    try {
      const delDia = pedidosConfirmados.filter(p => 
        p.ticketEmitido && p.fechaPesaje === fechaSeleccionada
      );

      if (delDia.length === 0) { setFilasCartera([]); return; }

      const nuevasFilas: FilaCartera[] = delDia.map(p => {
        const esVivo = p.presentacion?.toLowerCase().includes('vivo');
        const cantidadDisplay = p.cantidad;
        const cantidadLabel = esVivo ? `${p.cantidadJabas || 0} jabas` : 'unids';

        const pres = presentaciones.find(pr =>
          pr.tipoAve.toLowerCase() === p.tipoAve.toLowerCase() &&
          pr.nombre.toLowerCase() === p.presentacion.toLowerCase()
        );
        const mermaPorUnidad = pres?.mermaKg || 0;
        const mermaTotal = mermaPorUnidad * p.cantidad;

        const pesoContenedor = p.pesoTotalContenedores || 0;
        const pesoBruto = p.pesoBrutoTotal || 0;
        const pesoPedido = pesoBruto - pesoContenedor;
        const pesoNeto = pesoPedido + mermaTotal;

        let precio = 0;
        const clienteObj = clientes.find(c => c.nombre === p.cliente);
        const tipoAveObj = tiposAve.find(t => t.nombre === p.tipoAve);

        if (clienteObj && tipoAveObj) {
          const costosDelCliente = costosClientes.filter(cc => cc.clienteId === clienteObj.id && cc.tipoAveId === tipoAveObj.id);
          let costoEncontrado = costosDelCliente.find(cc =>
            (cc.variedad === p.variedad || (!cc.variedad && !p.variedad))
          );

          if (!costoEncontrado) {
            costoEncontrado = costosDelCliente.find(cc => !cc.variedad);
          }

          if (costoEncontrado) {
            precio = costoEncontrado.precioPorKg;
          }
        }

        const total = pesoNeto * precio;

        return {
          id: p.id,
          pedidoId: p.numeroPedido || p.id,
          cliente: p.cliente,
          tipo: p.tipoAve + (p.variedad ? ` (${p.variedad})` : ''),
          presentacion: p.presentacion,
          cantidad: cantidadDisplay,
          cantidadLabel,
          merma: mermaTotal,
          tara: pesoContenedor,
          contenedorTipo: p.contenedor,
          devolucionPeso: p.pesoDevolucion || 0,
          devolucionCantidad: 0,
          repesada: p.pesoRepesada || 0,
          adicionPeso: p.pesoAdicional || 0,
          clienteAdicional: p.clienteAdicionalNombre || '',
          pesoPedido: Math.max(0, pesoPedido),
          pesoContenedor,
          pesoBruto: pesoBruto,
          pesoNeto: Math.max(0, pesoNeto),
          precio,
          total: Math.max(0, total),
          confirmado: false,
          editando: false,
          fecha: fechaSeleccionada,
          zona: p.zonaEntrega || '—',
          conductor: p.conductor || '—',
        };
      });

      setFilasCartera(nuevasFilas);
    } catch (error) {
      console.error('Error generando cartera:', error);
      setFilasCartera([]);
    }
  };

  useEffect(() => {
    if (filasCartera.length > 0) {
      localStorage.setItem(storageKey(fechaSeleccionada), JSON.stringify(filasCartera));
    }
  }, [filasCartera, fechaSeleccionada]);

  const recalcularFila = (fila: FilaCartera): FilaCartera => {
    const n = (v: any) => parseFloat(v) || 0;
    const basePeso = (n(fila.repesada) > 0) ? n(fila.repesada) : n(fila.pesoBruto);
    const pesoNeto = basePeso + n(fila.merma) - n(fila.tara) - n(fila.devolucionPeso) + n(fila.adicionPeso);
    const total = Math.max(0, pesoNeto) * n(fila.precio);
    return { 
      ...fila, 
      repesada: n(fila.repesada),
      merma: n(fila.merma),
      tara: n(fila.tara),
      devolucionPeso: n(fila.devolucionPeso),
      adicionPeso: n(fila.adicionPeso),
      pesoNeto: Math.max(0, pesoNeto), 
      total 
    };
  };

  const actualizarCampo = (id: string, campo: keyof FilaCartera, valor: any) => {
    setFilasCartera(prev => prev.map(f => {
      if (f.id !== id) return f;
      const updated = { ...f, [campo]: valor };
      return recalcularFila(updated);
    }));
  };

  const prepararConfirmacion = (id: string) => {
    const fila = filasCartera.find(f => f.id === id);
    if (fila) {
      setConfirmModal({ open: true, filaId: id, cliente: fila.cliente });
    }
  };

  const ejecutarConfirmacion = () => {
    if (!confirmModal.filaId) return;

    setFilasCartera(prev => prev.map(f => 
      f.id === confirmModal.filaId ? { ...f, confirmado: true, editando: false } : f
    ));
    toast.success(`Boleta emitida para ${confirmModal.cliente}`, {
      description: "El registro ha sido bloqueado y enviado a contabilidad.",
      className: "bg-green-950 border-green-500 text-green-200"
    });
    setConfirmModal({ open: false, filaId: null, cliente: '' });
  };

  const editarFila = (id: string) => {
    setFilasCartera(prev => prev.map(f => 
      f.id === id ? { ...f, editando: !f.editando } : f
    ));
  };

  const confirmarTodas = () => {
    setFilasCartera(prev => prev.map(f => ({ ...f, confirmado: true, editando: false })));
    setEditandoAll(false);
    toast.success('Todas las filas confirmadas');
  };

  const editarTodas = () => {
    setFilasCartera(prev => prev.map(f => ({ ...f, editando: true, confirmado: false })));
    setEditandoAll(true);
  };

  const refrescar = () => {
    generarDesdePesajeControl();
    toast.success('Datos actualizados desde pesaje');
  };

  const exportarCSV = () => {
    const headers = ['Cliente', 'Tipo', 'Presentación', 'Peso Planta (kg)', 'Repesada (kg)', 'Merma (kg)', 'Devolución (kg)', 'Adición (kg)', 'Peso Neto (kg)', 'Precio S/', 'Total S/', 'Conductor'];
    const rows = filasFiltradas.map(f => [
      f.cliente, f.tipo, f.presentacion,
      f.pesoPedido.toFixed(2), f.repesada.toFixed(2),
      f.merma.toFixed(2), f.devolucionPeso.toFixed(2), f.adicionPeso.toFixed(2),
      f.pesoNeto.toFixed(2), f.precio.toFixed(2), f.total.toFixed(2),
      f.conductor
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `cartera_cobro_${fechaSeleccionada}.csv`;
    link.click();
  };

  const filasFiltradas = filasCartera.filter(f => {
    if (!busqueda) return true;
    const q = busqueda.toLowerCase();
    return f.cliente.toLowerCase().includes(q) || f.tipo.toLowerCase().includes(q) || f.conductor.toLowerCase().includes(q);
  });

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

  const totalVentas = filasCartera.reduce((s, f) => s + f.total, 0);
  const totalPesoPedido = filasCartera.reduce((s, f) => s + f.pesoPedido, 0);
  const totalPesoContenedor = filasCartera.reduce((s, f) => s + f.pesoContenedor, 0);
  const totalPesoBruto = filasCartera.reduce((s, f) => s + f.pesoBruto, 0);
  const totalPesoNeto = filasCartera.reduce((s, f) => s + f.pesoNeto, 0);

  const EditInput = ({ value, onChange, disabled = false, type = 'number', step = '0.01', min = '0', className = '' }: { value: number | string; onChange: (v: any) => void; disabled?: boolean; type?: string; step?: string; min?: string; className?: string }) => (
    <div className="relative group">
      <input
        type={type}
        step={step}
        min={min}
        value={value}
        onChange={(e) => onChange(type === 'number' ? parseFloat(e.target.value) || 0 : e.target.value)}
        disabled={disabled}
        className={`w-full h-9 sm:h-10 px-2 rounded-xl text-xs sm:text-sm text-right font-black tracking-tight transition-all ${
          disabled 
            ? 'bg-transparent text-gray-500 cursor-default border border-transparent' 
            : 'bg-gray-800 text-white border-2 border-amber-500/30 hover:border-amber-400 focus:border-amber-300 focus:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-amber-500/20 shadow-lg'
        } ${className}`}
      />
    </div>
  );

  return (
    <div className="space-y-4 sm:space-y-5 bg-gradient-to-br from-gray-950 via-black to-gray-950 min-h-screen p-4 sm:p-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-amber-500/20 to-amber-600/10 border border-amber-500/30 shadow-lg shadow-amber-500/10">
            <DollarSign className="w-5 h-5 sm:w-6 sm:h-6 text-amber-400" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-white tracking-tight">Cartera de Cobro</h1>
            <p className="text-gray-400 text-[10px] sm:text-xs">Registro diario de pesajes y cobros</p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-2 px-2 sm:px-3 py-2 rounded-xl bg-gray-900 border border-gray-700 hover:border-amber-500/50 transition-colors">
            <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400" />
            <input
              type="date"
              value={fechaSeleccionada}
              onChange={(e) => setFechaSeleccionada(e.target.value)}
              className="bg-transparent text-white text-xs sm:text-sm outline-none w-28 sm:w-auto"
            />
          </div>
          <button onClick={refrescar} className="px-2 sm:px-3 py-2 rounded-xl text-xs font-semibold transition-all hover:scale-105 flex items-center gap-1.5 bg-blue-500/10 border border-blue-500/30 text-blue-400 hover:bg-blue-500/20 hover:border-blue-400">
            <RefreshCw className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> <span className="hidden xs:inline">Actualizar</span>
          </button>
          <button onClick={exportarCSV} className="px-2 sm:px-3 py-2 rounded-xl text-xs font-semibold transition-all hover:scale-105 flex items-center gap-1.5 bg-green-500/10 border border-green-500/30 text-green-400 hover:bg-green-500/20 hover:border-green-400">
            <Download className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> <span className="hidden xs:inline">CSV</span>
          </button>
        </div>
      </div>

      {/* Métricas mejoradas */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-2 sm:gap-3">
        <div className="bg-gradient-to-br from-green-500/10 to-green-600/5 backdrop-blur-xl rounded-xl p-2 sm:p-4 border border-green-500/30 shadow-lg shadow-green-500/5">
          <div className="flex items-center justify-between mb-1 sm:mb-2">
            <p className="text-[8px] sm:text-[10px] text-gray-400 font-medium uppercase tracking-wider">Total Ventas</p>
            <DollarSign className="w-3 h-3 sm:w-4 sm:h-4 text-green-400" />
          </div>
          <p className="text-sm sm:text-xl md:text-2xl font-bold text-green-400">S/ {totalVentas.toFixed(2)}</p>
        </div>

        <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 backdrop-blur-xl rounded-xl p-2 sm:p-4 border border-blue-500/30 shadow-lg shadow-blue-500/5">
          <div className="flex items-center justify-between mb-1 sm:mb-2">
            <p className="text-[8px] sm:text-[10px] text-gray-400 font-medium uppercase tracking-wider">Peso Pedido</p>
            <Scale className="w-3 h-3 sm:w-4 sm:h-4 text-blue-400" />
          </div>
          <p className="text-sm sm:text-xl md:text-2xl font-bold text-blue-400">{totalPesoPedido.toFixed(1)} kg</p>
        </div>

        <div className="bg-gradient-to-br from-red-500/10 to-red-600/5 backdrop-blur-xl rounded-xl p-2 sm:p-4 border border-red-500/30 shadow-lg shadow-red-500/5">
          <div className="flex items-center justify-between mb-1 sm:mb-2">
            <p className="text-[8px] sm:text-[10px] text-gray-400 font-medium uppercase tracking-wider">Peso Contenedor</p>
            <Package className="w-3 h-3 sm:w-4 sm:h-4 text-red-400" />
          </div>
          <p className="text-sm sm:text-xl md:text-2xl font-bold text-red-400">{totalPesoContenedor.toFixed(1)} kg</p>
        </div>

        <div className="bg-gradient-to-br from-amber-500/10 to-amber-600/5 backdrop-blur-xl rounded-xl p-2 sm:p-4 border border-amber-500/30 shadow-lg shadow-amber-500/5">
          <div className="flex items-center justify-between mb-1 sm:mb-2">
            <p className="text-[8px] sm:text-[10px] text-gray-400 font-medium uppercase tracking-wider">Peso Bruto</p>
            <Scale className="w-3 h-3 sm:w-4 sm:h-4 text-amber-400" />
          </div>
          <p className="text-sm sm:text-xl md:text-2xl font-bold text-amber-400">{totalPesoBruto.toFixed(1)} kg</p>
        </div>

        <div className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 backdrop-blur-xl rounded-xl p-2 sm:p-4 border border-purple-500/30 shadow-lg shadow-purple-500/5">
          <div className="flex items-center justify-between mb-1 sm:mb-2">
            <p className="text-[8px] sm:text-[10px] text-gray-400 font-medium uppercase tracking-wider">Peso Neto</p>
            <Package className="w-3 h-3 sm:w-4 sm:h-4 text-purple-400" />
          </div>
          <p className="text-sm sm:text-xl md:text-2xl font-bold text-purple-400">{totalPesoNeto.toFixed(1)} kg</p>
        </div>
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
            className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm text-white placeholder-gray-500 outline-none bg-gray-900 border border-gray-700 focus:border-amber-500 focus:ring-1 focus:ring-amber-500/50 transition-all"
          />
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button onClick={editarTodas} className="flex-1 sm:flex-none px-3 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all hover:scale-105 flex items-center justify-center gap-1.5 bg-amber-500/10 border border-amber-500/30 text-amber-400 hover:bg-amber-500/20 hover:border-amber-400">
            <Edit3 className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> Editar Todo
          </button>
          <button onClick={confirmarTodas} className="flex-1 sm:flex-none px-3 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all hover:scale-105 flex items-center justify-center gap-1.5 bg-green-500/10 border border-green-500/30 text-green-400 hover:bg-green-500/20 hover:border-green-400">
            <Save className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> Confirmar Todo
          </button>
        </div>
      </div>

      {/* Indicador de día */}
      <div className="flex items-center gap-2 px-3 py-2 rounded-xl flex-wrap bg-gray-900/80 border border-gray-700 shadow-lg">
        <Calendar className="w-4 h-4 text-amber-400" />
        <span className="text-xs text-gray-400">Mostrando datos de</span>
        <span className="text-xs sm:text-sm font-bold text-amber-400">{fechaSeleccionada === hoyStr() ? 'HOY' : fechaSeleccionada}</span>
        <span className="text-xs text-gray-500 sm:ml-auto">{filasCartera.length} registros</span>
      </div>

      {/* TABLA PRINCIPAL */}
      <div className="bg-gray-900/80 backdrop-blur-xl rounded-xl overflow-hidden border border-gray-700 shadow-2xl">
        <div className="px-4 sm:px-5 py-3 border-b border-gray-700 flex items-center justify-between bg-gradient-to-r from-gray-800 to-gray-900">
          <h2 className="text-xs sm:text-sm md:text-base font-bold text-white flex items-center gap-2">
            <FileSpreadsheet className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400" />
            Cartera de Cobro - Detalle
          </h2>
          <span className="text-[10px] sm:text-xs px-2 sm:px-2.5 py-1 rounded-full font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30">
            {filasOrdenadas.length} filas
          </span>
        </div>

        {filasOrdenadas.length === 0 ? (
          <div className="px-4 sm:px-6 py-10 sm:py-16 text-center">
            <FileSpreadsheet className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 text-gray-600" />
            <p className="text-gray-300 text-sm sm:text-base mb-2">No hay registros para este día</p>
            <p className="text-gray-500 text-xs sm:text-sm mb-4">Los datos se generan automáticamente desde el módulo de pesaje</p>
            <button onClick={refrescar} className="px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all hover:scale-105 bg-blue-500/10 border border-blue-500/30 text-blue-400 hover:bg-blue-500/20">
              <RefreshCw className="w-3 h-3 sm:w-4 sm:h-4 inline mr-2" /> Cargar desde pesaje
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full table-fixed" style={{ minWidth: '1600px' }}>
              <thead>
                <tr className="bg-gray-800 border-b-2 border-gray-700">
                  {[
                    { key: 'cliente', label: 'CLIENTE', width: '150px' },
                    { key: 'tipo', label: 'PRODUCTO', width: '130px' },
                    { key: 'cantidad', label: 'DIF / CANT', width: '100px' },
                    { key: 'presentacion', label: 'PRES.', width: '90px' },
                    { key: 'repesada', label: 'REPESADA', width: '100px' },
                    { key: 'pesoBruto', label: 'P. BRUTO', width: '110px' },
                    { key: 'merma', label: 'MERMA', width: '90px' },
                    { key: 'tara', label: 'TARA', width: '100px' },
                    { key: 'devolucionPeso', label: 'DEVOL.', width: '100px' },
                    { key: 'adicionPeso', label: 'ASIGNADO', width: '110px' },
                    { key: 'pesoNeto', label: 'P. NETO', width: '110px' },
                    { key: 'precio', label: 'PRECIO', width: '90px' },
                    { key: 'total', label: 'TOTAL', width: '130px' },
                    { key: 'zona', label: 'ZONA', width: '80px' },
                    { key: 'conductor', label: 'CONDUCTOR', width: '140px' },
                    { key: 'acciones', label: 'ACC.', width: '70px' },
                  ].map(col => (
                    <th
                      key={col.key}
                      style={{ width: col.width }}
                      className={`px-1 sm:px-2 py-2 sm:py-3 text-left cursor-pointer select-none hover:bg-gray-700 transition-colors ${
                        col.key === 'total' || col.key === 'precio' || col.key === 'pesoPedido' || 
                        col.key === 'repesada' || col.key === 'merma' || col.key === 'tara' || col.key === 'pesoBruto' ||
                        col.key === 'devolucionPeso' || col.key === 'adicionPeso' || col.key === 'pesoNeto' || col.key === 'cantidad' ? 'text-right' : 'text-left'
                      }`}
                      onClick={() => col.key !== 'acciones' && handleSort(col.key)}
                    >
                      <div className={`flex items-center gap-1.5 ${
                        col.key === 'total' || col.key === 'precio' || col.key === 'pesoPedido' || 
                        col.key === 'repesada' || col.key === 'merma' || col.key === 'tara' || col.key === 'pesoBruto' ||
                        col.key === 'devolucionPeso' || col.key === 'adicionPeso' || col.key === 'pesoNeto' || col.key === 'cantidad' ? 'justify-end' : 'justify-start'
                      }`}>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-gray-300">
                          {col.label}
                        </span>
                        {sortColumn === col.key && (
                          sortDir === 'asc' ? 
                            <ChevronUp className="w-3.5 h-3.5 flex-shrink-0 text-amber-400" /> : 
                            <ChevronDown className="w-3.5 h-3.5 flex-shrink-0 text-amber-400" />
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
                      className={`border-b border-gray-700 transition-colors duration-150 hover:bg-gray-800/50 ${
                        fila.confirmado ? 'bg-green-950/20' : ''
                      }`}
                    >
                      <td className="px-3 py-3 align-middle">
                        <span className="text-white font-bold text-xs sm:text-sm block leading-tight truncate" title={fila.cliente}>
                          {fila.cliente}
                        </span>
                        <span className="text-[8px] text-gray-500 font-mono mt-0.5 block">#{fila.pedidoId.slice(-4).toUpperCase()}</span>
                      </td>

                      <td className="px-3 py-3 align-middle">
                        <span className="text-emerald-400 font-bold text-xs sm:text-[13px] block leading-tight truncate" title={fila.tipo}>
                          {fila.tipo}
                        </span>
                      </td>

                      <td className="px-3 py-3 align-middle text-right">
                        <div className={`text-sm font-bold tabular-nums ${
                          (fila.repesada - fila.pesoBruto) > 0.5 ? 'text-green-400' : 
                          (fila.repesada - fila.pesoBruto) < -0.5 ? 'text-red-400' : 'text-gray-300'
                        }`}>
                          {fila.repesada > 0 ? (fila.repesada - fila.pesoBruto).toFixed(1) : '0.0'}
                        </div>
                        <div className="text-[9px] text-gray-500 font-bold uppercase tracking-wider">
                          {fila.cantidad} {fila.cantidadLabel.split(' ')[0]}
                        </div>
                      </td>

                      <td className="px-3 py-3 align-middle text-center">
                        <span className={`px-2 py-1 rounded-lg text-[10px] sm:text-[11px] font-bold inline-block tracking-tighter ${
                          fila.presentacion?.toLowerCase().includes('vivo') 
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' 
                            : 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                        }`}>
                          {fila.presentacion.split(' ')[0]}
                        </span>
                      </td>

                      <td className="px-2 py-3 align-middle">
                        <EditInput value={fila.repesada.toFixed(2)} onChange={(v: number) => actualizarCampo(fila.id, 'repesada', v)} disabled={!puedeEditar} className="text-sky-300 font-bold" />
                      </td>

                      <td className="px-2 py-3 align-middle text-right">
                        <div className="px-2 py-2 rounded-xl bg-gray-800 border border-gray-600 text-amber-300 font-bold text-xs sm:text-sm tabular-nums">
                          {fila.pesoBruto.toFixed(2)}
                        </div>
                      </td>

                      <td className="px-2 py-3 align-middle">
                        <EditInput value={fila.merma.toFixed(2)} onChange={(v: number) => actualizarCampo(fila.id, 'merma', v)} disabled={!puedeEditar} className="text-gray-300" />
                      </td>

                      <td className="px-2 py-3 align-middle">
                        <EditInput value={fila.tara > 0 ? fila.tara.toFixed(2) : fila.pesoContenedor.toFixed(2)} onChange={(v: number) => actualizarCampo(fila.id, 'tara', v)} disabled={!puedeEditar} className="text-red-300 font-bold" />
                      </td>

                      <td className="px-2 py-3 align-middle">
                        <EditInput value={fila.devolucionPeso.toFixed(2)} onChange={(v: number) => actualizarCampo(fila.id, 'devolucionPeso', v)} disabled={!puedeEditar} className="text-orange-300 font-bold" />
                      </td>

                      <td className="px-2 py-3 align-middle">
                        <EditInput value={fila.adicionPeso.toFixed(2)} onChange={(v: number) => actualizarCampo(fila.id, 'adicionPeso', v)} disabled={!puedeEditar} className="text-emerald-300 font-bold" />
                      </td>

                      <td className="px-3 py-3 align-middle text-right bg-gray-800/50 ring-1 ring-inset ring-gray-700">
                        <span className="text-white font-bold text-sm sm:text-lg tabular-nums leading-none">
                          {fila.pesoNeto.toFixed(2)}
                        </span>
                      </td>

                      <td className="px-2 py-3 align-middle">
                        <EditInput value={fila.precio.toFixed(2)} onChange={(v: number) => actualizarCampo(fila.id, 'precio', v)} disabled={!puedeEditar} className="text-amber-300 font-bold" />
                      </td>

                      <td className="px-3 py-3 align-middle text-right bg-amber-500/10 border-x border-amber-500/20">
                        <span className="text-amber-300 font-bold text-sm sm:text-lg tabular-nums leading-none">
                          S/ {fila.total.toFixed(2)}
                        </span>
                      </td>

                      <td className="px-2 py-3 align-middle text-center">
                        <span className="px-2 py-1 rounded-lg text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30 uppercase tracking-tighter block truncate">
                          {fila.zona.split(' ')[0]}
                        </span>
                      </td>

                      <td className="px-3 py-3 align-middle">
                        <div className="flex items-center gap-2 overflow-hidden bg-gray-800/50 p-1.5 rounded-xl border border-gray-700">
                           <div className="w-7 h-7 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center flex-shrink-0">
                              <span className="text-[11px] font-bold text-amber-300">{fila.conductor?.charAt(0) || '—'}</span>
                           </div>
                           <span className="text-white text-[11px] font-bold tracking-tight truncate leading-none">{fila.conductor || 'Sin asignar'}</span>
                        </div>
                      </td>

                      <td className="px-3 py-3 align-middle">
                        <div className="flex items-center justify-center gap-2">
                          {fila.confirmado && !fila.editando ? (
                            <button 
                              onClick={() => editarFila(fila.id)} 
                              className="p-2 rounded-xl transition-all hover:scale-110 bg-amber-500/10 border border-amber-500/30 hover:bg-amber-500/20 group/btn" 
                              title="Desbloquear para Editar"
                            >
                              <Edit3 className="w-4 h-4 text-amber-300 group-hover/btn:text-amber-200" />
                            </button>
                          ) : (
                            <button 
                              onClick={() => prepararConfirmacion(fila.id)} 
                              className="p-2 rounded-xl transition-all hover:scale-110 bg-green-500/10 border border-green-500/30 hover:bg-green-500/20 group/btn" 
                              title={fila.confirmado ? "Re-emitir Boleta" : "Emitir Boleta"}
                            >
                              <CheckCircle className="w-4 h-4 text-green-300 group-hover/btn:text-green-200" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>

              <tfoot>
                <tr className="bg-gray-800 border-t-2 border-gray-700">
                  <td className="px-3 py-4" colSpan={4}>
                    <span className="text-amber-400 font-bold text-xs sm:text-sm uppercase tracking-wider">Resumen de Totales</span>
                  </td>
                  <td className="px-2 py-4 text-right">
                    <span className="text-sky-300 font-bold text-xs sm:text-[16px] tabular-nums">{(filasOrdenadas.reduce((s, f) => s + (f.repesada || 0), 0)).toFixed(1)}</span>
                  </td>
                  <td className="px-2 py-4 text-right">
                    <span className="text-amber-300 font-bold text-xs sm:text-[16px] tabular-nums">{(filasOrdenadas.reduce((s, f) => s + (f.pesoBruto || 0), 0)).toFixed(1)}</span>
                  </td>
                  <td className="px-2 py-4 text-right">
                    <span className="text-gray-300 font-bold text-xs sm:text-[16px] tabular-nums">{(filasOrdenadas.reduce((s, f) => s + (f.merma || 0), 0)).toFixed(1)}</span>
                  </td>
                  <td className="px-2 py-4 text-right">
                    <span className="text-red-300 font-bold text-xs sm:text-[16px] tabular-nums">{(filasOrdenadas.reduce((s, f) => s + (f.tara || f.pesoContenedor || 0), 0)).toFixed(1)}</span>
                  </td>
                  <td className="px-2 py-4 text-right">
                    <span className="text-orange-300 font-bold text-xs sm:text-[16px] tabular-nums">{(filasOrdenadas.reduce((s, f) => s + (f.devolucionPeso || 0), 0)).toFixed(1)}</span>
                  </td>
                  <td className="px-2 py-4 text-right">
                    <span className="text-emerald-300 font-bold text-xs sm:text-[16px] tabular-nums">{(filasOrdenadas.reduce((s, f) => s + (f.adicionPeso || 0), 0)).toFixed(1)}</span>
                  </td>
                  <td className="px-3 py-4 text-right bg-gray-700/50 ring-1 ring-gray-700">
                    <span className="text-white font-bold text-sm sm:text-[18px] tabular-nums">{(filasOrdenadas.reduce((s, f) => s + (f.pesoNeto || 0), 0)).toFixed(1)}</span>
                  </td>
                  <td colSpan={1}></td>
                  <td className="px-3 py-4 text-right bg-amber-500/20 border-l border-amber-500/30">
                    <span className="text-amber-300 font-bold text-lg sm:text-2xl tabular-nums">S/ {(filasOrdenadas.reduce((s, f) => s + (f.total || 0), 0)).toFixed(2)}</span>
                  </td>
                  <td className="px-1 sm:px-2 py-2 sm:py-3" colSpan={3}></td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>

      {/* MODAL DE CONFIRMACIÓN */}
      {confirmModal.open && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl animate-in fade-in duration-500">
          <div className="bg-gray-900 border-2 border-amber-500/40 rounded-2xl p-8 sm:p-10 max-w-md w-full shadow-2xl transform animate-in zoom-in-90 duration-300">
            <div className="w-20 h-20 bg-amber-500/10 rounded-full flex items-center justify-center mx-auto mb-8 border border-amber-500/30">
              <AlertTriangle className="w-10 h-10 text-amber-400" />
            </div>
            
            <h3 className="text-2xl sm:text-3xl font-bold text-white text-center mb-3">
              ¿CONFIRMAR LIQUIDACIÓN?
            </h3>
            
            <p className="text-gray-300 text-center text-base sm:text-lg mb-10">
              Estás por liquidar la cuenta de <span className="text-amber-400 font-bold underline decoration-amber-500/50">{confirmModal.cliente}</span>
            </p>

            <p className="text-red-400 font-bold mb-8 p-3 bg-red-500/10 rounded-xl border border-red-500/20 text-xs uppercase tracking-wider text-center">
              ⚠️ SE EMITIRÁ LA BOLETA AL CONFIRMAR
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button 
                onClick={() => setConfirmModal({ open: false, filaId: null, cliente: '' })}
                className="px-8 py-5 rounded-xl font-bold text-gray-300 hover:text-white hover:bg-gray-800 transition-all text-xs uppercase tracking-wider border border-gray-700"
              >
                Volver
              </button>
              <button 
                onClick={ejecutarConfirmacion}
                className="px-8 py-5 rounded-xl font-bold bg-amber-500 text-black hover:bg-amber-400 hover:scale-[1.05] active:scale-95 transition-all text-xs uppercase tracking-wider shadow-lg shadow-amber-500/30"
              >
                EMITIR YA
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}