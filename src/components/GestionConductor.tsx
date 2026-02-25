import { useState, useEffect } from "react";
import {
  Truck,
  Scale,
  RotateCcw,
  Camera,
  CheckCircle2,
  AlertTriangle,
  UserPlus,
  ArrowRight,
  ChevronRight,
  History,
  Camera as CameraIcon,
  X,
  PackageCheck,
  FileText,
  User,
  MapPin,
  Clock,
  Weight,
  AlertCircle,
  Package,
  Download,
  Calendar,
  Plus
} from "lucide-react";
import { useApp } from "../contexts/AppContext";
import { toast } from "sonner";

interface FotoRegistro {
  tipo: 'repesada' | 'devolucion' | 'entrega' | 'asignacion';
  url: string;
  fecha: string;
}

interface RegistroConductor {
  id: string;
  pedidoId: string;
  tipo: 'repesada' | 'devolucion' | 'asignacion' | 'entrega';
  peso?: number;
  motivo?: string;
  nuevoClienteId?: string;
  nuevoClienteNombre?: string;
  fotos: FotoRegistro[];
  fecha: string;
  estado: 'Pendiente' | 'Completado' | 'Con Incidencia';
}

export function GestionConductor() {
  const { pedidosConfirmados, clientes, updatePedidoConfirmado } = useApp();
  const [selectedPedido, setSelectedPedido] = useState<any | null>(null);
  const [modo, setModo] = useState<'LISTA' | 'DETALLE' | 'REPESADA' | 'DEVOLUCION' | 'ASIGNACION'>('LISTA');

  // Estados para formularios
  const [formWeight, setFormWeight] = useState("");
  const [formReason, setFormReason] = useState("");
  const [capturedPhotos, setCapturedPhotos] = useState<string[]>([]);
  const [newClientId, setNewClientId] = useState("");
  const [sessionBlocks, setSessionBlocks] = useState<{ peso: number; foto: string }[]>([]);
  const [showReasonStep, setShowReasonStep] = useState(false);

  // Historial local de registros
  const [registros, setRegistros] = useState<RegistroConductor[]>(() => {
    const saved = localStorage.getItem('registrosConductor');
    return saved ? JSON.parse(saved) : [];
  });

  // Estado para doble confirmación de entrega
  const [confirmStep, setConfirmStep] = useState<0 | 1 | 2>(0);

  // Guardar registros en localStorage
  useEffect(() => {
    localStorage.setItem('registrosConductor', JSON.stringify(registros));
  }, [registros]);

  // Filtrar pedidos que están en estado 'En Despacho' (despachados pero sin confirmar entrega)
  // Filtrar  estado?: 'Pendiente' | 'En Producción' | 'En Pesaje' | 'En Despacho' | 'Despachando' | 'En Ruta' | 'Con Incidencia' | 'Entregado' | 'Completado' | 'Completado con alerta' | 'Devolución' | 'Confirmado con Adición' | 'Cancelado';
  const pedidosRuta = pedidosConfirmados.filter((p: any) => 
    p.estado === 'En Despacho' || p.estado === 'Despachando' || p.estado === 'En Ruta' || p.estado === 'Con Incidencia'
  );

  // Helper: obtener datos frescos del pedido desde el contexto (evita estado local obsoleto)
  const getFreshPedido = () => {
    if (!selectedPedido) return null;
    return pedidosConfirmados.find((p: any) => p.id === selectedPedido.id) || selectedPedido;
  };

  const handleCapturePhoto = () => {
    // Simulación de captura de foto con timestamp
    const mockPhoto = `https://images.unsplash.com/photo-${Math.floor(Math.random() * 1000000)}?w=400&t=${Date.now()}`;
    setCapturedPhotos([...capturedPhotos, mockPhoto]);
    toast.success("Foto capturada correctamente");
  };

  const resetForm = () => {
    setFormWeight("");
    setFormReason("");
    setCapturedPhotos([]);
    setNewClientId("");
  };

  const generarId = () => `REG-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  const handleAddBlock = () => {
    if (!formWeight || capturedPhotos.length === 0) {
      toast.error("Debe ingresar el peso y capturar una foto");
      return;
    }
    setSessionBlocks([...sessionBlocks, { peso: parseFloat(formWeight), foto: capturedPhotos[0] }]);
    setFormWeight("");
    setCapturedPhotos([]);
    toast.success("Pesada agregada");
  };

  const handleFinishRepesada = () => {
    if (sessionBlocks.length === 0) {
      toast.error("Debe agregar al menos una pesada");
      return;
    }

    const pesoTotalRepesada = sessionBlocks.reduce((acc, b) => acc + b.peso, 0);
    const fresh = getFreshPedido();
    const pesoOriginal = fresh?.pesoBrutoTotal || 0;
    const diferencia = Math.abs(pesoOriginal - pesoTotalRepesada);
    const margenTolerancia = 0.5;

    const nuevoRegistro: RegistroConductor = {
      id: generarId(),
      pedidoId: selectedPedido.id,
      tipo: 'repesada',
      peso: pesoTotalRepesada,
      fotos: sessionBlocks.map(b => ({ 
        tipo: 'repesada', 
        url: b.foto, 
        fecha: new Date().toISOString() 
      })),
      fecha: new Date().toISOString(),
      estado: diferencia <= margenTolerancia ? 'Completado' : 'Con Incidencia'
    };

    setRegistros([...registros, nuevoRegistro]);

    const updatedPedido = {
      ...fresh,
      estado: diferencia <= margenTolerancia ? 'En Ruta' : 'Con Incidencia',
      pesoRepesada: pesoTotalRepesada,
      ultimaIncidencia: diferencia <= margenTolerancia ? null : 'Diferencia de peso detectada'
    };
    console.log(`[CONDUCTOR] Enviando repesada: pedidoId=${selectedPedido.id}, pesoRepesada=${pesoTotalRepesada}, fechaPesaje=${fresh?.fechaPesaje}, ticketEmitido=${fresh?.ticketEmitido}`);
    updatePedidoConfirmado(selectedPedido.id, updatedPedido);
    setSelectedPedido(updatedPedido);

    toast.success(`Repesada finalizada: ${pesoTotalRepesada.toFixed(1)} kg totales`);
    setModo('DETALLE');
    setSessionBlocks([]);
    resetForm();
  };

  const handleFinishDevolucion = () => {
    if (sessionBlocks.length === 0) {
      toast.error("Debe agregar al menos una pesada de devolución");
      return;
    }
    if (!formReason) {
      toast.error("Debe ingresar el motivo de la devolución");
      return;
    }

    const pesoTotalDevolucion = sessionBlocks.reduce((acc, b) => acc + b.peso, 0);
    const fresh = getFreshPedido();

    const nuevoRegistro: RegistroConductor = {
      id: generarId(),
      pedidoId: selectedPedido.id,
      tipo: 'devolucion',
      peso: pesoTotalDevolucion,
      motivo: formReason,
      fotos: sessionBlocks.map(b => ({ 
        tipo: 'devolucion', 
        url: b.foto, 
        fecha: new Date().toISOString() 
      })),
      fecha: new Date().toISOString(),
      estado: 'Con Incidencia'
    };

    setRegistros([...registros, nuevoRegistro]);

    const updatedPedido = {
      ...fresh,
      estado: 'Devolución',
      pesoDevolucion: pesoTotalDevolucion,
      motivoDevolucion: formReason,
      ultimaIncidencia: 'Producto devuelto'
    };
    updatePedidoConfirmado(selectedPedido.id, updatedPedido);
    setSelectedPedido(updatedPedido);

    toast.warning(`Devolución finalizada: ${pesoTotalDevolucion.toFixed(1)} kg totales`);
    setModo('DETALLE');
    setSessionBlocks([]);
    resetForm();
  };

  const handleFinishAsignacion = () => {
    if (sessionBlocks.length === 0) {
      toast.error("Debe agregar al menos una pesada");
      return;
    }
    if (!newClientId) {
      toast.error("Debe seleccionar un cliente");
      return;
    }

    const pesoTotalAsignacion = sessionBlocks.reduce((acc, b) => acc + b.peso, 0);
    const clienteObj = clientes.find((c: any) => c.id === newClientId);
    const fresh = getFreshPedido();

    const nuevoRegistro: RegistroConductor = {
      id: generarId(),
      pedidoId: selectedPedido.id,
      tipo: 'asignacion',
      peso: pesoTotalAsignacion,
      nuevoClienteId: newClientId,
      nuevoClienteNombre: clienteObj?.nombre,
      fotos: sessionBlocks.map(b => ({ 
        tipo: 'asignacion', 
        url: b.foto, 
        fecha: new Date().toISOString() 
      })),
      fecha: new Date().toISOString(),
      estado: 'Completado'
    };

    setRegistros([...registros, nuevoRegistro]);

    const updatedPedido = {
      ...fresh,
      estado: 'Confirmado con Adición',
      pesoAdicional: pesoTotalAsignacion,
      clienteAdicionalId: newClientId,
      ultimaIncidencia: `Adición para ${clienteObj?.nombre}`
    };
    updatePedidoConfirmado(selectedPedido.id, updatedPedido);
    setSelectedPedido(updatedPedido);

    toast.success(`Adición finalizada: ${pesoTotalAsignacion.toFixed(1)} kg para ${clienteObj?.nombre}`);
    setModo('DETALLE');
    setSessionBlocks([]);
    resetForm();
  };

  const getRegistrosPedido = (id: string) => {
    return registros
      .filter(r => r.pedidoId === id)
      .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
  };

  // Confirmar entrega directa con advertencia simple
  const handleConfirmarEntrega = () => {
    if (!selectedPedido) return;
    
    const nuevoRegistro: RegistroConductor = {
      id: generarId(),
      pedidoId: selectedPedido.id,
      tipo: 'entrega',
      fotos: [],
      fecha: new Date().toISOString(),
      estado: 'Completado'
    };

    setRegistros([...registros, nuevoRegistro]);

    const fresh = getFreshPedido();
    updatePedidoConfirmado(selectedPedido.id, {
      ...fresh,
      estado: 'Entregado',
      fechaEntrega: new Date().toISOString()
    });

    toast.success('Entrega confirmada exitosamente');
    setConfirmStep(0);
    setModo('LISTA');
    setSelectedPedido(null);
  };

  const cancelarConfirmacion = () => {
    setConfirmStep(0);
  };

  const getEstadoColor = (estado: string) => {
    switch(estado) {
      case 'Completado': return 'text-emerald-400 bg-emerald-400/10';
      case 'Con Incidencia': return 'text-amber-400 bg-amber-400/10';
      case 'Devolución': return 'text-red-400 bg-red-400/10';
      default: return 'text-gray-400 bg-gray-400/10';
    }
  };

  const getTipoIcon = (tipo: string) => {
    switch(tipo) {
      case 'repesada': return <Scale className="w-4 h-4 text-blue-400" />;
      case 'devolucion': return <RotateCcw className="w-4 h-4 text-orange-400" />;
      case 'asignacion': return <UserPlus className="w-4 h-4 text-emerald-400" />;
      case 'entrega': return <CheckCircle2 className="w-4 h-4 text-green-400" />;
      default: return <FileText className="w-4 h-4 text-gray-400" />;
    }
  };

  const getTipoLabel = (tipo: string, id?: string) => {
    if (tipo === 'repesada' && id && selectedPedido) {
      const allReps = registros
        .filter(r => r.pedidoId === selectedPedido.id && r.tipo === 'repesada')
        .sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime());
      const index = allReps.findIndex(r => r.id === id);
      return index !== -1 ? `${index + 1}° Repesaje` : 'Repesaje';
    }
    switch(tipo) {
      case 'repesada': return 'Repesaje';
      case 'devolucion': return 'Devolución';
      case 'asignacion': return 'Adición';
      case 'entrega': return 'Entrega';
      default: return tipo;
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20 px-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Truck className="text-emerald-400" /> Gestión de Entregas
          </h1>
          <p className="text-gray-400 text-sm">Control de ruta, repesadas y devoluciones</p>
        </div>
        {modo !== 'LISTA' && (
          <button
            onClick={() => { setModo('LISTA'); setSelectedPedido(null); }}
            className="px-4 py-2 bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors flex items-center gap-2"
          >
            <ArrowRight className="w-4 h-4 rotate-180" /> Volver
          </button>
        )}
      </div>

      {modo === 'LISTA' && (
        <div className="grid gap-4">
          {pedidosRuta.length === 0 ? (
            <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-12 text-center text-gray-500">
              <PackageCheck className="w-12 h-12 mx-auto mb-4 opacity-20" />
              <p className="text-lg font-medium">No tienes pedidos asignados</p>
              <p className="text-sm text-gray-600">Los pedidos aparecerán aquí cuando sean despachados</p>
            </div>
          ) : (
            pedidosRuta.map((pedido: any) => {
              const registrosPedido = getRegistrosPedido(pedido.id);
              const ultimoRegistro = registrosPedido[0];
              
              return (
                <div
                  key={pedido.id}
                  onClick={() => { 
                    // Cambiar estado a 'Despachando' si está 'En Despacho'
                    if (pedido.estado === 'En Despacho') {
                      const updatedPedido = { ...pedido, estado: 'Despachando' };
                      updatePedidoConfirmado(pedido.id, updatedPedido);
                      setSelectedPedido(updatedPedido);
                    } else {
                      setSelectedPedido(pedido);
                    }
                    setModo('DETALLE');
                  }}
                  className="bg-gray-900 border border-gray-800 rounded-2xl p-5 hover:border-emerald-500/50 transition-all cursor-pointer group relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 p-4">
                    <ChevronRight className="w-5 h-5 text-gray-600 group-hover:text-emerald-400 transition-colors" />
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                      pedido.estado === 'Devolución' ? 'bg-red-900/20 text-red-400' :
                      pedido.estado === 'Con Incidencia' ? 'bg-amber-900/20 text-amber-400' :
                      pedido.estado === 'Despachando' ? 'bg-blue-900/20 text-blue-400' :
                      'bg-emerald-900/20 text-emerald-400'
                    }`}>
                      <Truck className="w-6 h-6" />
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <span className="font-mono text-xs text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded">
                          #{pedido.numeroPedido || 'S/N'}
                        </span>
                        <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${
                          pedido.estado === 'Devolución' ? 'bg-red-400/10 text-red-400' :
                          pedido.estado === 'Con Incidencia' ? 'bg-amber-400/10 text-amber-400' :
                          pedido.estado === 'Despachando' ? 'bg-blue-400/10 text-blue-400' :
                          'bg-purple-400/10 text-purple-400'
                        }`}>
                          {pedido.estado === 'Despachando' ? 'Despachando...' : pedido.estado}
                        </span>
                        {ultimoRegistro && (
                          <span className="text-[10px] text-gray-500 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {new Date(ultimoRegistro.fecha).toLocaleTimeString()}
                          </span>
                        )}
                      </div>
                      
                      <h3 className="text-white font-bold text-lg mb-2">{pedido.cliente}</h3>
                      
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                        <div className="flex items-center gap-1 text-gray-400">
                          <Package className="w-4 h-4 text-gray-600" />
                          <span>{pedido.cantidad} unid.</span>
                        </div>
                        <div className="flex items-center gap-1 text-gray-400">
                          <Weight className="w-4 h-4 text-gray-600" />
                          <span>{pedido.pesoBrutoTotal?.toFixed(1)} kg</span>
                        </div>
                        <div className="flex items-center gap-1 text-gray-400">
                          <MapPin className="w-4 h-4 text-gray-600" />
                          <span className="truncate">{pedido.zona || '—'}</span>
                        </div>
                        <div className="flex items-center gap-1 text-gray-400">
                          <History className="w-4 h-4 text-gray-600" />
                          <span>{registrosPedido.length} movimientos</span>
                        </div>
                      </div>

                      {pedido.ultimaIncidencia && (
                        <div className="mt-3 flex items-center gap-2 text-xs bg-amber-400/5 border border-amber-400/20 rounded-lg px-3 py-2">
                          <AlertCircle className="w-3 h-3 text-amber-400" />
                          <span className="text-amber-300">{pedido.ultimaIncidencia}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {modo === 'DETALLE' && selectedPedido && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
          {/* Info Card */}
          <div className="bg-gradient-to-br from-gray-900 to-black border border-gray-800 rounded-2xl p-6 relative overflow-hidden shadow-2xl">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full -mr-16 -mt-16 blur-3xl"></div>

            <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-6">
              <div>
                <p className="text-xs text-emerald-400 font-mono uppercase tracking-widest mb-1">Orden de Entrega</p>
                <h2 className="text-2xl sm:text-3xl font-black text-white">{selectedPedido.cliente}</h2>
                <div className="flex flex-wrap items-center gap-2 mt-2">
                  <span className="bg-gray-800 px-3 py-1 rounded-full text-xs text-gray-300">
                    {selectedPedido.tipoAve}
                  </span>
                  <span className="bg-gray-800 px-3 py-1 rounded-full text-xs text-gray-300">
                    {selectedPedido.presentacion}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className="text-3xl font-black text-white">
                    {selectedPedido.pesoBrutoTotal?.toFixed(1) || '--'} 
                    <span className="text-sm text-gray-500 font-normal ml-1">KG</span>
                  </div>
                  <p className="text-xs text-gray-500">Peso Bruto</p>
                </div>
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                  selectedPedido.estado === 'Devolución' ? 'bg-red-900/20 text-red-400' :
                  selectedPedido.estado === 'Con Incidencia' ? 'bg-amber-900/20 text-amber-400' :
                  selectedPedido.estado === 'Despachando' ? 'bg-blue-900/20 text-blue-400' :
                  'bg-emerald-900/20 text-emerald-400'
                }`}>
                  <Package className="w-6 h-6" />
                </div>
              </div>
            </div>

            {/* Estado actual */}
            <div className="mb-6 p-4 bg-gray-800/50 rounded-xl border border-gray-700">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  selectedPedido.estado === 'Devolución' ? 'bg-red-900/20' :
                  selectedPedido.estado === 'Con Incidencia' ? 'bg-amber-900/20' :
                  selectedPedido.estado === 'Despachando' ? 'bg-blue-900/20' :
                  'bg-emerald-900/20'
                }`}>
                  {selectedPedido.estado === 'Devolución' ? <RotateCcw className="w-5 h-5 text-red-400" /> :
                   selectedPedido.estado === 'Con Incidencia' ? <AlertCircle className="w-5 h-5 text-amber-400" /> :
                   <Truck className="w-5 h-5 text-emerald-400" />}
                </div>
                <div>
                  <p className="text-xs text-gray-500">Estado actual</p>
                  <p className={`text-lg font-bold ${
                    selectedPedido.estado === 'Devolución' ? 'text-red-400' :
                    selectedPedido.estado === 'Con Incidencia' ? 'text-amber-400' :
                    selectedPedido.estado === 'Despachando' ? 'text-blue-400' :
                    'text-emerald-400'
                  }`}>
                    {selectedPedido.estado}
                  </p>
                  {selectedPedido.motivoDevolucion && (
                    <p className="text-sm text-gray-400 mt-1">
                      Motivo: {selectedPedido.motivoDevolucion}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Acciones Rápidas */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <button
                onClick={() => {
                  setSessionBlocks([]);
                  setModo('REPESADA');
                }}
                className="flex flex-col items-center gap-2 p-4 bg-blue-900/20 border border-blue-500/30 rounded-2xl text-blue-300 hover:bg-blue-900/30 transition-all font-bold group"
                disabled={selectedPedido.estado === 'Entregado'}
              >
                <Scale className="w-6 h-6 group-hover:scale-110 transition-transform" />
                <span className="text-xs">REPESADA</span>
              </button>
              
              <button
                onClick={() => {
                  setSessionBlocks([]);
                  setModo('DEVOLUCION');
                }}
                className="flex flex-col items-center gap-2 p-4 bg-orange-900/20 border border-red-500/30 rounded-2xl text-red-300 hover:bg-orange-900/30 transition-all font-bold group"
                disabled={selectedPedido.estado === 'Entregado'}
              >
                <RotateCcw className="w-6 h-6 group-hover:scale-110 transition-transform" />
                <span className="text-xs">DEVOLUCIÓN</span>
              </button>
              
              <button
                onClick={() => {
                  setSessionBlocks([]);
                  setModo('ASIGNACION');
                }}
                className="flex flex-col items-center gap-2 p-4 bg-emerald-900/20 border border-emerald-500/30 rounded-2xl text-emerald-300 hover:bg-emerald-900/30 transition-all font-bold group"
                disabled={selectedPedido.estado === 'Entregado'}
              >
                <UserPlus className="w-6 h-6 group-hover:scale-110 transition-transform" />
                <span className="text-xs">ADICIÓN</span>
              </button>
              
              <button
                onClick={handleConfirmarEntrega}
                className="flex flex-col items-center gap-2 p-4 bg-green-900/20 border border-green-500/30 rounded-2xl text-green-300 hover:bg-green-900/30 transition-all font-bold group"
                disabled={selectedPedido.estado === 'Entregado' || selectedPedido.estado === 'Devolución'}
              >
                <CheckCircle2 className="w-6 h-6 group-hover:scale-110 transition-transform" />
                <span className="text-xs">CONFIRMAR ENTREGA</span>
              </button>
            </div>
          </div>

          {/* Historial de movimientos */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2 px-1">
              <History className="w-5 h-5 text-gray-500" /> 
              Registro de Movimientos
              <span className="text-xs font-normal text-gray-500 ml-2">
                ({getRegistrosPedido(selectedPedido.id).length} registros)
              </span>
            </h3>
            
            {getRegistrosPedido(selectedPedido.id).length === 0 ? (
              <div className="bg-gray-900/30 border border-dashed border-gray-800 rounded-2xl p-12 text-center">
                <History className="w-12 h-12 mx-auto mb-4 text-gray-700" />
                <p className="text-gray-500 text-sm">Sin movimientos registrados aún</p>
                <p className="text-xs text-gray-600 mt-1">Use los botones de acción para registrar repesadas, devoluciones o adiciones</p>
              </div>
            ) : (
              <div className="space-y-3">
                {getRegistrosPedido(selectedPedido.id).map((reg, idx) => (
                  <div 
                    key={reg.id} 
                    className="bg-gray-900/50 border border-gray-800 rounded-2xl p-5 hover:border-gray-700 transition-all"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-2 mb-3">
                          <div className="flex items-center gap-1.5">
                            {getTipoIcon(reg.tipo)}
                            <span className="text-sm font-bold text-white">
                              {getTipoLabel(reg.tipo, reg.id)}
                            </span>
                          </div>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${getEstadoColor(reg.estado)}`}>
                            {reg.estado}
                          </span>
                          <span className="text-xs text-gray-500 flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(reg.fecha).toLocaleDateString()}
                          </span>
                          <span className="text-xs text-gray-500 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {new Date(reg.fecha).toLocaleTimeString()}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            {reg.peso && (
                              <div className="flex items-center gap-2">
                                <Weight className="w-4 h-4 text-gray-600" />
                                <span className="text-sm text-gray-300">
                                  Peso: <span className="text-white font-bold">{reg.peso.toFixed(1)} kg</span>
                                </span>
                              </div>
                            )}
                            
                            {reg.tipo === 'devolucion' && reg.motivo && (
                              <div className="flex items-start gap-2">
                                <AlertCircle className="w-4 h-4 text-gray-600 mt-0.5" />
                                <div>
                                  <p className="text-xs text-gray-500">Motivo de devolución</p>
                                  <p className="text-sm text-orange-300 bg-orange-900/20 px-3 py-1.5 rounded-lg border border-orange-500/20">
                                    "{reg.motivo}"
                                  </p>
                                </div>
                              </div>
                            )}

                            {reg.tipo === 'asignacion' && reg.nuevoClienteNombre && (
                              <div className="flex items-center gap-2">
                                <User className="w-4 h-4 text-gray-600" />
                                <span className="text-sm text-gray-300">
                                  Nuevo cliente: <span className="text-emerald-400 font-bold">{reg.nuevoClienteNombre}</span>
                                </span>
                              </div>
                            )}
                          </div>

                          {reg.fotos && reg.fotos.length > 0 && (
                            <div>
                              <p className="text-xs text-gray-500 font-bold mb-2 uppercase tracking-wider flex items-center gap-1">
                                <CameraIcon className="w-3 h-3" /> Evidencia ({reg.fotos.length})
                              </p>
                              <div className="flex flex-wrap gap-2">
                                {reg.fotos.map((f, fi) => (
                                  <div 
                                    key={fi} 
                                    className="relative group w-16 h-16 rounded-lg bg-gray-800 border border-gray-700 overflow-hidden cursor-pointer hover:border-emerald-500 transition-all"
                                    onClick={() => window.open(f.url, '_blank')}
                                  >
                                    <img 
                                      src={f.url} 
                                      alt={`Evidencia ${fi + 1}`}
                                      className="w-full h-full object-cover"
                                      onError={(e) => {
                                        (e.target as HTMLImageElement).src = 'https://via.placeholder.com/64?text=No+Image';
                                      }}
                                    />
                                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                      <CameraIcon className="w-5 h-5 text-white" />
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Formularios de acción */}
      {(modo === 'REPESADA' || modo === 'DEVOLUCION' || modo === 'ASIGNACION') && (
        <div className="bg-gradient-to-br from-gray-900 to-black border border-emerald-500/30 rounded-2xl p-6 space-y-6 shadow-2xl relative">
          <div className="absolute top-0 right-0 p-4">
            <button 
              onClick={() => {
                setModo('DETALLE');
                setShowReasonStep(false);
              }} 
              className="p-2 text-gray-500 hover:text-white transition-colors rounded-lg hover:bg-gray-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
              modo === 'REPESADA' ? 'bg-blue-900/30 text-blue-400' : 
              modo === 'DEVOLUCION' ? 'bg-orange-900/30 text-orange-400' : 
              'bg-emerald-900/30 text-emerald-400'
            }`}>
              {modo === 'REPESADA' && <Scale className="w-6 h-6" />}
              {modo === 'DEVOLUCION' && <RotateCcw className="w-6 h-6" />}
              {modo === 'ASIGNACION' && <UserPlus className="w-6 h-6" />}
            </div>
            <div>
              <h2 className="text-xl font-black text-white uppercase tracking-tight">
                {modo === 'REPESADA' ? 'Registrar Repesada' : 
                 modo === 'DEVOLUCION' ? (showReasonStep ? 'Motivo de Devolución' : 'Registrar Devolución') : 
                 'Registrar Adición'}
              </h2>
              <p className="text-xs text-gray-500">
                {modo === 'REPESADA' ? 'Verifique el peso actual del producto' :
                 modo === 'DEVOLUCION' ? (showReasonStep ? 'Indique la razón de la devolución' : 'Registre el producto que se devuelve') :
                 'Asigne parte del pedido a otro cliente'}
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {modo === 'ASIGNACION' && (
              <div>
                <label className="block text-xs font-bold text-emerald-400 uppercase tracking-widest mb-2">
                  Nuevo Cliente <span className="text-red-400">*</span>
                </label>
                <select
                  value={newClientId}
                  onChange={(e) => setNewClientId(e.target.value)}
                  className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/50 transition-all"
                >
                  <option value="">-- Seleccionar cliente --</option>
                  {clientes
                    .filter((c: any) => c.id !== selectedPedido?.clienteId)
                    .map((c: any) => (
                      <option key={c.id} value={c.id}>{c.nombre}</option>
                    ))}
                </select>
              </div>
            )}

            {!showReasonStep && (
              <div className="space-y-4">
                {formWeight && capturedPhotos.length === 0 && (
                  <div className="bg-amber-500/10 border-2 border-amber-500/50 rounded-xl p-4 flex items-center gap-3 animate-bounce">
                    <AlertTriangle className="w-6 h-6 text-amber-500 shrink-0" />
                    <p className="text-amber-200 font-bold text-sm leading-tight uppercase">
                      ¡Atención! Debe tomar la foto de evidencia antes de poder sumar el peso.
                    </p>
                  </div>
                )}
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">
                      {modo === 'ASIGNACION' ? 'Peso a Añadir (KG)' : 'Peso Registrado (KG)'}
                      <span className="text-red-400 ml-1">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        value={formWeight}
                        onChange={(e) => setFormWeight(e.target.value)}
                        placeholder="0.0"
                        className="w-full bg-gray-950 border-2 border-gray-800 rounded-xl px-4 py-4 text-white text-3xl font-black focus:outline-none focus:border-emerald-500 transition-all pr-12 shadow-inner"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold text-lg">kg</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 text-emerald-400">
                      Evidencia Obligatoria <span className="text-red-400">*</span>
                    </label>
                    <button
                      onClick={handleCapturePhoto}
                      className={`w-full h-[68px] border-2 rounded-xl flex items-center justify-center gap-3 transition-all font-black text-lg group shadow-lg active:scale-95 ${
                        capturedPhotos.length > 0 
                        ? 'bg-emerald-900/30 border-emerald-500 text-emerald-400' 
                        : 'bg-gray-800 border-amber-500/50 text-white hover:bg-gray-700'
                      }`}
                    >
                      <Camera className={`w-6 h-6 group-hover:scale-110 transition-transform ${capturedPhotos.length > 0 ? 'text-emerald-400' : 'text-amber-400'}`} /> 
                      {capturedPhotos.length > 0 ? 'FOTO CAPTURADA' : 'TOMAR FOTO'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            

            {capturedPhotos.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">
                  Evidencia actual
                </p>
                <div className="flex flex-wrap gap-2 p-3 bg-black/40 border border-gray-800 rounded-xl">
                  {capturedPhotos.map((p, i) => (
                    <div key={i} className="relative group">
                      <div className="w-16 h-16 rounded-lg overflow-hidden border border-gray-700">
                        <img 
                          src={p} 
                          alt={`Foto ${i + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <button
                        onClick={() => setCapturedPhotos([])}
                        className="absolute -top-1 -right-1 bg-red-500 rounded-full p-0.5"
                      >
                        <X className="w-3 h-3 text-white" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {(modo === 'REPESADA' || modo === 'DEVOLUCION' || modo === 'ASIGNACION') ? (
              <div className="space-y-4">
                {!showReasonStep && (
                  <button
                    onClick={handleAddBlock}
                    className={`w-full py-6 border-4 rounded-3xl font-black text-2xl flex items-center justify-center gap-4 transition-all shadow-2xl active:scale-95 disabled:opacity-30 disabled:grayscale ${
                      modo === 'REPESADA' ? 'bg-blue-600 border-blue-400 text-white hover:bg-blue-500' :
                      modo === 'DEVOLUCION' ? 'bg-orange-600 border-orange-400 text-white hover:bg-orange-500' :
                      'bg-emerald-600 border-emerald-400 text-white hover:bg-emerald-500'
                    }`}
                    disabled={!formWeight || capturedPhotos.length === 0}
                  >
                    <Plus className="w-8 h-8" /> 
                    SUMAR {modo === 'REPESADA' ? 'PESADA' : 'BLOQUE'}
                  </button>
                )}

                {sessionBlocks.length > 0 && (
                  <div className="space-y-3 bg-white/5 p-4 rounded-2xl border border-white/10">
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">
                      REGISTROS ACUMULADOS ({sessionBlocks.length})
                    </p>
                    <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                      {sessionBlocks.map((b, i) => (
                        <div key={i} className="flex items-center justify-between bg-black/40 border border-gray-700 rounded-xl p-3">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-lg overflow-hidden border-2 border-gray-600">
                              <img src={b.foto} className="w-full h-full object-cover" />
                            </div>
                            <span className="text-white font-bold text-lg">{i + 1}° Bloque</span>
                          </div>
                          <span className={`text-2xl font-black ${
                            modo === 'REPESADA' ? 'text-blue-400' : 
                            modo === 'DEVOLUCION' ? 'text-orange-400' : 
                            'text-emerald-400'
                          }`}>{b.peso.toFixed(1)} kg</span>
                        </div>
                      ))}
                    </div>
                    <div className={`p-5 border-2 rounded-2xl flex justify-between items-center ${
                      modo === 'REPESADA' ? 'bg-blue-900/40 border-blue-500/50' : 
                      modo === 'DEVOLUCION' ? 'bg-orange-900/40 border-orange-500/50' : 
                      'bg-emerald-900/40 border-emerald-500/50'
                    }`}>
                      <span className="text-white font-black text-lg">TOTAL:</span>
                      <span className="text-3xl font-black text-white">{sessionBlocks.reduce((acc, b) => acc + b.peso, 0).toFixed(1)} kg</span>
                    </div>
                  </div>
                )}

                {modo === 'DEVOLUCION' && showReasonStep && (
                  <div className="pt-4 animate-in zoom-in-95 duration-300">
                    <div className="bg-orange-500/10 border-2 border-orange-500/30 rounded-2xl p-6 shadow-2xl">
                      <label className="block text-sm font-bold text-orange-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                        <AlertCircle className="w-5 h-5" />
                        ¿Cuál es el motivo de la devolución? <span className="text-red-400">*</span>
                      </label>
                      <textarea
                        value={formReason}
                        autoFocus
                        onChange={(e) => setFormReason(e.target.value)}
                        className="w-full bg-black/60 border-2 border-gray-700 rounded-2xl px-5 py-4 text-white text-lg focus:outline-none focus:border-orange-500 transition-all h-36 resize-none shadow-inner placeholder:text-gray-600"
                        placeholder="Ej: Producto dañado, cliente no aceptó, etc..."
                        maxLength={200}
                      />
                      <div className="flex justify-between items-center mt-3">
                        <button 
                          onClick={() => setShowReasonStep(false)}
                          className="text-xs text-orange-400/50 hover:text-orange-400 font-bold uppercase underline"
                        >
                          Volver a pesar
                        </button>
                        <p className="text-[10px] text-gray-500 font-mono">
                          {formReason.length}/200 caracteres
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {(modo === 'REPESADA' || (modo === 'ASIGNACION' && !showReasonStep)) && (
                  <button
                    onClick={modo === 'REPESADA' ? handleFinishRepesada : handleFinishAsignacion}
                    className={`w-full py-5 rounded-2xl font-black text-xl shadow-2xl transition-all flex items-center justify-center gap-3 active:scale-95 ${
                      sessionBlocks.length > 0 && (modo !== 'ASIGNACION' || newClientId)
                      ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-500/20'
                      : 'bg-gray-800 text-gray-500 cursor-not-allowed border border-gray-700 opacity-50'
                    }`}
                    disabled={sessionBlocks.length === 0 || (modo === 'ASIGNACION' && !newClientId)}
                  >
                    <CheckCircle2 className="w-6 h-6" /> FINALIZAR {modo === 'REPESADA' ? 'REPESADA' : 'ADICIÓN'}
                  </button>
                )}

                {modo === 'DEVOLUCION' && (
                  showReasonStep ? (
                    <button
                      onClick={handleFinishDevolucion}
                      className={`w-full py-6 rounded-2xl font-black text-2xl shadow-2xl transition-all flex items-center justify-center gap-3 active:scale-95 ${
                        formReason.length >= 3
                        ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-500/20'
                        : 'bg-gray-800 text-gray-500 cursor-not-allowed border border-gray-700 opacity-50'
                      }`}
                      disabled={formReason.length < 3}
                    >
                      <CheckCircle2 className="w-7 h-7" /> CONFIRMAR DEVOLUCIÓN
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        if (sessionBlocks.length > 0) setShowReasonStep(true);
                        else toast.error("Debe agregar al menos una pesada");
                      }}
                      className={`w-full py-5 rounded-2xl font-black text-xl shadow-2xl transition-all flex items-center justify-center gap-3 active:scale-95 ${
                        sessionBlocks.length > 0
                        ? 'bg-orange-600 hover:bg-orange-500 text-white shadow-orange-500/20'
                        : 'bg-gray-800 text-gray-500 cursor-not-allowed border border-gray-700 opacity-50'
                      }`}
                      disabled={sessionBlocks.length === 0}
                    >
                      <ArrowRight className="w-6 h-6" /> CONTINUAR A MOTIVO
                    </button>
                  )
                )}
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* Modal de confirmación eliminado por solicitud */}
    </div>
  );
}