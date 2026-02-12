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
  Info,
  History,
  Image as ImageIcon,
  X,
  PackageCheck
} from "lucide-react";
import { useApp } from "../contexts/AppContext";
import { toast } from "sonner";

interface FotoRegistro {
  tipo: 'repesada' | 'devolucion' | 'entrega' | 'asignacion';
  url: string;
  fecha: string;
}

interface RegistroConductor {
  pedidoId: string;
  pesoRepesada?: number;
  pesoDevolucion?: number;
  pesoAnadido?: number;
  motivoDevolucion?: string;
  nuevoClienteId?: string;
  fotos: FotoRegistro[];
  estado: 'Pendiente' | 'Completado' | 'Con Incidencia';
}

export function GestionConductor() {
  const { pedidosConfirmados, clientes } = useApp();
  const [selectedPedido, setSelectedPedido] = useState<any | null>(null);
  const [modo, setModo] = useState<'LISTA' | 'DETALLE' | 'REPESADA' | 'DEVOLUCION' | 'ASIGNACION'>('LISTA');
  
  // Estados para formularios
  const [formWeight, setFormWeight] = useState("");
  const [formReason, setFormReason] = useState("");
  const [capturedPhotos, setCapturedPhotos] = useState<string[]>([]);
  const [newClientId, setNewClientId] = useState("");
  
  // Historial local de registros (simulado)
  const [registros, setRegistros] = useState<RegistroConductor[]>([]);

  // Filtrar pedidos que están en estado 'Pesaje' o 'Entregado' (que el conductor debe gestionar)
  const pedidosRuta = pedidosConfirmados.filter((p: any) => p.estado === 'Pesaje' || p.estado === 'Entregado');

  const handleCapturePhoto = () => {
    // Simulación de captura de foto
    const mockPhoto = `https://images.unsplash.com/photo-${Math.floor(Math.random() * 1000000)}?w=400`;
    setCapturedPhotos([...capturedPhotos, mockPhoto]);
    toast.info("Foto capturada correctamente");
  };

  const resetForm = () => {
    setFormWeight("");
    setFormReason("");
    setCapturedPhotos([]);
    setNewClientId("");
  };

  const handleRepesada = () => {
    if (!formWeight || capturedPhotos.length === 0) {
      toast.error("Debe ingresar el peso y capturar al menos una foto");
      return;
    }

    const nuevoRegistro: RegistroConductor = {
      pedidoId: selectedPedido.id,
      pesoRepesada: parseFloat(formWeight),
      fotos: capturedPhotos.map(url => ({ tipo: 'repesada', url, fecha: new Date().toISOString() })),
      estado: 'Completado'
    };

    setRegistros([...registros, nuevoRegistro]);
    toast.success("Repesada registrada con éxito");
    setModo('DETALLE');
    resetForm();
  };

  const handleDevolucion = () => {
    if (!formWeight || !formReason || capturedPhotos.length === 0) {
      toast.error("Complete todos los campos y capture una foto");
      return;
    }

    const nuevoRegistro: RegistroConductor = {
      pedidoId: selectedPedido.id,
      pesoDevolucion: parseFloat(formWeight),
      motivoDevolucion: formReason,
      fotos: capturedPhotos.map(url => ({ tipo: 'devolucion', url, fecha: new Date().toISOString() })),
      estado: 'Con Incidencia'
    };

    setRegistros([...registros, nuevoRegistro]);
    toast.warning("Devolución registrada");
    setModo('DETALLE');
    resetForm();
  };

  const handleAsignacion = () => {
    if (!formWeight || !newClientId || capturedPhotos.length === 0) {
      toast.error("Complete la cantidad, el cliente y la foto");
      return;
    }

    const clienteObj = clientes.find((c: any) => c.id === newClientId);

    const nuevoRegistro: RegistroConductor = {
      pedidoId: selectedPedido.id,
      pesoAnadido: parseFloat(formWeight),
      nuevoClienteId: newClientId,
      fotos: capturedPhotos.map(url => ({ tipo: 'asignacion', url, fecha: new Date().toISOString() })),
      estado: 'Completado'
    };

    setRegistros([...registros, nuevoRegistro]);
    toast.success(`Asignado a ${clienteObj?.nombre}`);
    setModo('DETALLE');
    resetForm();
  };

  const getRegistroPedido = (id: string) => registros.filter(r => r.pedidoId === id);

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      {/* Header */}
      <div className="flex items-center justify-between">
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
              <p>No tienes pedidos asignados para entrega</p>
            </div>
          ) : (
            pedidosRuta.map((pedido: any) => (
              <div 
                key={pedido.id}
                onClick={() => { setSelectedPedido(pedido); setModo('DETALLE'); }}
                className="bg-gray-900 border border-gray-800 rounded-2xl p-5 hover:border-emerald-500/50 transition-all cursor-pointer group relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 p-4">
                  <ChevronRight className="w-5 h-5 text-gray-600 group-hover:text-emerald-400 transition-colors" />
                </div>
                
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${pedido.estado === 'Pesaje' ? 'bg-amber-900/20 text-amber-400' : 'bg-blue-900/20 text-blue-400'}`}>
                    <Truck className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-xs text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded">
                        {pedido.numeroPedido || 'S/N'}
                      </span>
                      <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${pedido.estado === 'Pesaje' ? 'bg-amber-400/10 text-amber-400' : 'bg-blue-400/10 text-blue-400'}`}>
                        {pedido.estado}
                      </span>
                    </div>
                    <h3 className="text-white font-bold text-lg">{pedido.cliente}</h3>
                    <div className="flex items-center gap-4 mt-2 text-sm text-gray-400 font-medium">
                      <div className="flex items-center gap-1">
                        <Scale className="w-4 h-4 text-gray-600" /> {pedido.pesoKg?.toFixed(1) || '--'} kg
                      </div>
                      <div className="flex items-center gap-1">
                        <RotateCcw className="w-4 h-4 text-gray-600" /> {getRegistroPedido(pedido.id).length} inc.
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {modo === 'DETALLE' && selectedPedido && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
          {/* Info Card */}
          <div className="bg-linear-to-br from-gray-900 to-black border border-gray-800 rounded-2xl p-6 relative overflow-hidden shadow-2xl">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full -mr-16 -mt-16 blur-3xl"></div>
            
            <div className="flex justify-between items-start mb-6">
              <div>
                <p className="text-xs text-emerald-400 font-mono uppercase tracking-widest mb-1">Orden de Entrega</p>
                <h2 className="text-3xl font-black text-white">{selectedPedido.cliente}</h2>
                <div className="flex items-center gap-3 mt-2 text-gray-400 text-sm">
                  <span className="bg-gray-800 px-3 py-1 rounded-full">{selectedPedido.tipoAve}</span>
                  <span className="bg-gray-800 px-3 py-1 rounded-full">{selectedPedido.cantidad} unidades</span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-black text-white">{selectedPedido.pesoKg?.toFixed(1) || '--'} <span className="text-sm text-gray-500 font-normal">KG</span></div>
                <p className="text-xs text-gray-500">Peso Original</p>
              </div>
            </div>

            {/* Acciones Rápidas */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <button 
                onClick={() => setModo('REPESADA')}
                className="flex flex-col items-center gap-2 p-4 bg-blue-900/20 border border-blue-500/30 rounded-2xl text-blue-300 hover:bg-blue-900/30 transition-all font-bold group"
              >
                <Scale className="w-6 h-6 group-hover:scale-110 transition-transform" />
                <span className="text-xs">REPESADA</span>
              </button>
              <button 
                onClick={() => setModo('DEVOLUCION')}
                className="flex flex-col items-center gap-2 p-4 bg-orange-900/20 border border-orange-500/30 rounded-2xl text-orange-300 hover:bg-orange-900/30 transition-all font-bold group"
              >
                <RotateCcw className="w-6 h-6 group-hover:scale-110 transition-transform" />
                <span className="text-xs">DEVOLUCIÓN</span>
              </button>
              <button 
                onClick={() => setModo('ASIGNACION')}
                className="flex flex-col items-center gap-2 p-4 bg-emerald-900/20 border border-emerald-500/30 rounded-2xl text-emerald-300 hover:bg-emerald-900/30 transition-all font-bold group col-span-2 sm:col-span-1"
              >
                <UserPlus className="w-6 h-6 group-hover:scale-110 transition-transform" />
                <span className="text-xs">ASIGNAR DEV.</span>
              </button>
            </div>
          </div>

          {/* Historial de incidencias en este pedido */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2 px-1">
              <History className="w-5 h-5 text-gray-500" /> Registro de Movimientos
            </h3>
            {getRegistroPedido(selectedPedido.id).length === 0 ? (
              <div className="bg-gray-900/30 border border-dashed border-gray-800 rounded-2xl p-8 text-center text-gray-600">
                Sin movimientos registrados aún
              </div>
            ) : (
              getRegistroPedido(selectedPedido.id).map((reg, idx) => (
                <div key={idx} className="bg-gray-900/50 border border-gray-800 rounded-2xl p-4 space-y-3">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                       {reg.pesoRepesada && <span className="bg-blue-500/10 text-blue-400 text-[10px] font-bold px-2 py-0.5 rounded uppercase">Repesada</span>}
                       {reg.pesoDevolucion && <span className="bg-orange-500/10 text-orange-400 text-[10px] font-bold px-2 py-0.5 rounded uppercase">Devolución</span>}
                       {reg.pesoAnadido && <span className="bg-emerald-500/10 text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded uppercase">Asignación</span>}
                    </div>
                    <span className="text-xs text-gray-500">{new Date().toLocaleTimeString()}</span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-500 font-bold mb-1 uppercase tracking-wider">Detalles</p>
                      {reg.pesoRepesada && <p className="text-xl font-bold text-white">{reg.pesoRepesada} kg</p>}
                      {reg.pesoDevolucion && (
                        <div>
                          <p className="text-xl font-bold text-white">{reg.pesoDevolucion} kg</p>
                          <p className="text-xs text-gray-400 mt-1 italic">"{reg.motivoDevolucion}"</p>
                        </div>
                      )}
                      {reg.pesoAnadido && (
                        <div>
                          <p className="text-xl font-bold text-white">{reg.pesoAnadido} kg</p>
                          <p className="text-xs text-gray-400 mt-1">Nuevo Cliente: <span className="text-white font-bold">{clientes.find((c: any) => c.id === reg.nuevoClienteId)?.nombre}</span></p>
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 font-bold mb-2 uppercase tracking-wider">Evidencia</p>
                      <div className="flex gap-2">
                        {reg.fotos.map((f, fi) => (
                          <div key={fi} className="w-12 h-12 rounded-lg bg-gray-800 border border-gray-700 overflow-hidden relative">
                             <img src={f.url} className="w-full h-full object-cover" />
                             <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 bg-black/60 transition-opacity cursor-pointer">
                               <Camera className="w-4 h-4 text-white" />
                             </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {(modo === 'REPESADA' || modo === 'DEVOLUCION' || modo === 'ASIGNACION') && (
        <div className="bg-linear-to-br from-gray-900 to-black border border-emerald-500/30 rounded-2xl p-6 space-y-6 shadow-2xl relative">
          <div className="absolute top-0 right-0 p-4">
            <button onClick={() => setModo('DETALLE')} className="p-2 text-gray-500 hover:text-white transition-colors">
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${modo === 'REPESADA' ? 'bg-blue-900/30 text-blue-400' : modo === 'DEVOLUCION' ? 'bg-orange-900/30 text-orange-400' : 'bg-emerald-900/30 text-emerald-400'}`}>
               {modo === 'REPESADA' && <Scale className="w-6 h-6" />}
               {modo === 'DEVOLUCION' && <RotateCcw className="w-6 h-6" />}
               {modo === 'ASIGNACION' && <UserPlus className="w-6 h-6" />}
            </div>
            <div>
              <h2 className="text-xl font-black text-white uppercase tracking-tight">
                {modo === 'REPESADA' ? 'Registrar Repesada' : modo === 'DEVOLUCION' ? 'Registrar Devolución' : 'Asignar Devolución'}
              </h2>
              <p className="text-xs text-gray-500">Asegúrese de que el peso sea exacto antes de confirmar</p>
            </div>
          </div>

          <div className="space-y-4">
            {modo === 'ASIGNACION' && (
              <div>
                <label className="block text-xs font-bold text-emerald-400 uppercase tracking-widest mb-2">Seleccionar Nuevo Cliente</label>
                <select 
                  value={newClientId}
                  onChange={(e) => setNewClientId(e.target.value)}
                  className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500 transition-colors"
                >
                  <option value="">-- Seleccionar --</option>
                  {clientes.map((c: any) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                </select>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-1">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">
                  {modo === 'ASIGNACION' ? 'Peso a Añadir' : 'Peso Registrado (KG)'}
                </label>
                <input 
                  type="number" 
                  step="0.1"
                  value={formWeight}
                  onChange={(e) => setFormWeight(e.target.value)}
                  placeholder="0.0"
                  className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-3 text-white text-2xl font-black focus:outline-none focus:border-emerald-500 transition-colors"
                />
              </div>
              <div className="col-span-1">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Capturar Evidencia</label>
                <button 
                  onClick={handleCapturePhoto}
                  className="w-full h-[58px] bg-gray-800 border border-gray-700 rounded-xl flex items-center justify-center gap-2 text-gray-300 hover:bg-gray-700 transition-all font-bold"
                >
                  <Camera className="w-5 h-5 text-emerald-400" /> Tomar Foto
                </button>
              </div>
            </div>

            {modo === 'DEVOLUCION' && (
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Motivo de la Devolución</label>
                <textarea 
                  value={formReason}
                  onChange={(e) => setFormReason(e.target.value)}
                  className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500 transition-colors h-24"
                  placeholder="Detalle por qué se está devolviendo el producto..."
                />
              </div>
            )}

            {capturedPhotos.length > 0 && (
              <div className="flex flex-wrap gap-2 p-3 bg-black/40 border border-gray-800 rounded-xl">
                 {capturedPhotos.map((p, i) => (
                   <div key={i} className="relative group w-16 h-16">
                      <img src={p} className="w-full h-full object-cover rounded-lg border border-gray-700" />
                      <button 
                        onClick={() => setCapturedPhotos(capturedPhotos.filter((_, idx) => idx !== i))}
                        className="absolute -top-1 -right-1 bg-red-500 rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-3 h-3 text-white" />
                      </button>
                   </div>
                 ))}
              </div>
            )}

            <button 
              onClick={modo === 'REPESADA' ? handleRepesada : modo === 'DEVOLUCION' ? handleDevolucion : handleAsignacion}
              className={`w-full py-4 rounded-xl font-black shadow-2xl transition-all hover:scale-[1.02] flex items-center justify-center gap-2 ${
                modo === 'REPESADA' ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-500/20' :
                modo === 'DEVOLUCION' ? 'bg-orange-600 hover:bg-orange-500 text-white shadow-orange-500/20' :
                'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-500/20'
              }`}
            >
              <CheckCircle2 className="w-5 h-5" /> CONFIRMAR REGISTRO
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
