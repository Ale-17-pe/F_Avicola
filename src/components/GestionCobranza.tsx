import { useState, useRef } from 'react';
import { 
  Wallet, 
  MapPin, 
  Clock, 
  TrendingUp, 
  Search, 
  Filter,
  DollarSign,
  Plus,
  RotateCcw,
  ShoppingCart,
  Receipt,
  CheckCircle2,
  X,
  CreditCard,
  Banknote,
  Camera,
  User,
  Image as ImageIcon,
  ChevronDown
} from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { toast } from 'sonner';

export function GestionCobranza() {
  const { clientes, updateCliente, addPago, addPedidoConfirmado } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCliente, setSelectedCliente] = useState<any>(null);
  const [modalType, setModalType] = useState<'PAGO' | 'DEVOLUCION' | 'PEDIDO' | null>(null);
  const [statsCollapsed, setStatsCollapsed] = useState(true);
  
  // Estados para Pago
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'Efectivo' | 'Transferencia' | 'Yape' | 'Plin' | 'Otro'>('Efectivo');
  const [paymentPhoto, setPaymentPhoto] = useState<string | null>(null);
  const [note, setNote] = useState('');
  
  // Estados para Pedido
  const [pedidoTipoAve, setPedidoTipoAve] = useState('Pollo');
  const [pedidoCantidad, setPedidoCantidad] = useState('');

  // Filtrar clientes
  const clientesFiltrados = clientes
    .filter(c => 
      c.estado === 'Activo' && 
      (c.nombre.toLowerCase().includes(searchTerm.toLowerCase()) || 
       c.zona.includes(searchTerm))
    )
    .sort((a, b) => (b.saldoPendiente || 0) - (a.saldoPendiente || 0));

  const totalPorCobrar = clientes.reduce((acc, c) => acc + (c.saldoPendiente || 0), 0);

  const handleCapturePhoto = () => {
    // Simulación de captura
    const mockPhoto = `https://images.unsplash.com/photo-${Math.floor(Math.random() * 1000000)}?w=400`;
    setPaymentPhoto(mockPhoto);
    toast.success("Foto del comprobante capturada");
  };

  const handleTransaction = () => {
    if (!amount || parseFloat(amount) <= 0) {
      toast.error('Ingrese un monto válido');
      return;
    }

    const valor = parseFloat(amount);
    
    if (modalType === 'PAGO') {
      if (paymentMethod !== 'Efectivo' && !paymentPhoto) {
        toast.error('Para pagos digitales debe adjuntar foto del comprobante');
        return;
      }

      // Registrar el Pago
      addPago({
        id: crypto.randomUUID(),
        clienteId: selectedCliente.id,
        clienteNombre: selectedCliente.nombre,
        monto: valor,
        metodo: paymentMethod,
        fecha: new Date().toISOString().split('T')[0],
        hora: new Date().toLocaleTimeString(),
        referencia: note,
        foto: paymentPhoto || undefined,
        estado: 'Pendiente', // Siempre pendiente hasta conf. de secretaria
        registradoPor: 'Cobranza'
      });
      
      // Si es Efectivo, se descuenta de inmediato visualmente, pero igual el estado del pago es pendiente en BD
      // Para efectos prácticos, lo descontamos del saldoCliente para que vea su "nuevo saldo"
      const nuevoSaldo = (selectedCliente.saldoPendiente || 0) - valor;
      updateCliente({
        ...selectedCliente,
        saldoPendiente: nuevoSaldo,
        ultimoPedido: new Date().toISOString().split('T')[0]
      });

      toast.success('Pago registrado correctamente', {
        description: 'Pendiente de validación por secretaría'
      });

    } else if (modalType === 'DEVOLUCION') {
      const nuevoSaldo = (selectedCliente.saldoPendiente || 0) - valor;
      updateCliente({
        ...selectedCliente,
        saldoPendiente: nuevoSaldo
      });
      toast.info('Devolución registrada');

    } else if (modalType === 'PEDIDO') {
       // Lógica simple para agregar deuda, el pedido real iría a pedidosConfirmados
      const nuevoSaldo = (selectedCliente.saldoPendiente || 0) + valor;
      updateCliente({
        ...selectedCliente,
        saldoPendiente: nuevoSaldo
      });
      
      // Crear pedido básico
      addPedidoConfirmado({
        id: crypto.randomUUID(),
        cliente: selectedCliente.nombre,
        tipoAve: pedidoTipoAve,
        presentacion: 'Vivo',
        cantidad: parseInt(pedidoCantidad) || 10,
        contenedor: 'Jabas Nuevas',
        fecha: new Date().toISOString().split('T')[0],
        hora: new Date().toLocaleTimeString(),
        prioridad: 2,
        estado: 'Pendiente'
      });

      toast.success('Pedido registrado y cargado a cuenta');
    }

    closeModal();
  };

  const closeModal = () => {
    setModalType(null);
    setAmount('');
    setNote('');
    setPaymentMethod('Efectivo');
    setPaymentPhoto(null);
    setPedidoCantidad('');
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Header Stats - Collapsible */}
      <div>
        <button 
          onClick={() => setStatsCollapsed(!statsCollapsed)}
          className="flex items-center gap-2 mb-2 text-xs font-semibold uppercase tracking-wider transition-colors hover:text-emerald-400"
          style={{ color: 'rgba(156,163,175,0.7)' }}
        >
          {statsCollapsed ? <ChevronDown className="w-3.5 h-3.5 -rotate-90" /> : <ChevronDown className="w-3.5 h-3.5" />}
          Estadísticas {statsCollapsed ? '(expandir)' : ''}
        </button>
        {!statsCollapsed && (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-gray-900 to-black border border-gray-800 rounded-2xl p-5 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Wallet className="w-16 h-16 text-emerald-500" />
          </div>
          <p className="text-gray-400 text-sm font-medium uppercase tracking-wider">Total por Cobrar</p>
          <h3 className="text-3xl font-black text-white mt-1">S/ {totalPorCobrar.toLocaleString('es-PE', { minimumFractionDigits: 2 })}</h3>
          <div className="flex items-center gap-2 mt-2 text-emerald-400 text-xs font-bold">
            <TrendingUp className="w-3 h-3" /> +12% vs mes anterior
          </div>
        </div>
      </div>
        )}
      </div>

      {/* Buscador y Filtros */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
          <input 
            type="text" 
            placeholder="Buscar cliente por nombre o zona..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-gray-900 border border-gray-800 rounded-xl pl-12 pr-4 py-3 text-white focus:outline-none focus:border-emerald-500 transition-colors"
          />
        </div>
      </div>

      {/* Lista de Clientes */}
      <div className="grid gap-4">
        {clientesFiltrados.map((cliente) => (
          <div 
            key={cliente.id}
            className="group bg-gray-900 border border-gray-800 rounded-2xl p-5 hover:border-emerald-500/50 transition-all relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-full bg-gradient-to-l from-black/50 to-transparent pointer-events-none" />
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-gray-800 flex items-center justify-center shrink-0 border border-gray-700 group-hover:border-emerald-500/30 transition-colors">
                  <User className="w-6 h-6 text-gray-400 group-hover:text-emerald-400 transition-colors" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-white font-bold text-lg">{cliente.nombre}</h3>
                    {cliente.saldoPendiente && cliente.saldoPendiente > 0 && (
                      <span className="bg-red-500/10 text-red-400 text-[10px] font-bold px-2 py-0.5 rounded uppercase border border-red-500/20">
                        Deuda
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-400">
                    <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> Zona {cliente.zona}</span>
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> Últ. Mov: {cliente.ultimoPedido}</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:items-end gap-1">
                <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Saldo Pendiente</p>
                <div className={`text-2xl font-black ${(cliente.saldoPendiente || 0) > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                  S/ {(cliente.saldoPendiente || 0).toFixed(2)}
                </div>
              </div>

              {/* Botones de Acción */}
              <div className="flex items-center gap-2 pt-4 sm:pt-0 sm:border-l border-gray-800 sm:pl-4">
                <button 
                  onClick={() => { setSelectedCliente(cliente); setModalType('PAGO'); }}
                  className="flex-1 sm:flex-none py-2 px-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition-all"
                >
                  <DollarSign className="w-4 h-4" /> Cobrar
                </button>
                <button 
                  onClick={() => { setSelectedCliente(cliente); setModalType('PEDIDO'); }}
                  className="p-2 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-600/30 rounded-lg transition-colors"
                  title="Nuevo Pedido"
                >
                  <ShoppingCart className="w-5 h-5" />
                </button>
                <button 
                  onClick={() => { setSelectedCliente(cliente); setModalType('DEVOLUCION'); }}
                  className="p-2 bg-orange-600/20 hover:bg-orange-600/30 text-orange-400 border border-orange-600/30 rounded-lg transition-colors"
                  title="Registrar Devolución"
                >
                  <RotateCcw className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal de Acciones */}
      {modalType && selectedCliente && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-md p-6 relative shadow-2xl animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto custom-scrollbar">
            <button 
              onClick={closeModal}
              className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-6">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                modalType === 'PAGO' ? 'bg-emerald-500/20 text-emerald-500' :
                modalType === 'PEDIDO' ? 'bg-blue-500/20 text-blue-500' :
                'bg-orange-500/20 text-orange-500'
              }`}>
                {modalType === 'PAGO' && <DollarSign className="w-6 h-6" />}
                {modalType === 'PEDIDO' && <ShoppingCart className="w-6 h-6" />}
                {modalType === 'DEVOLUCION' && <RotateCcw className="w-6 h-6" />}
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">
                  {modalType === 'PAGO' ? 'Registrar Cobranza' :
                   modalType === 'PEDIDO' ? 'Nuevo Pedido' :
                   'Registrar Devolución'}
                </h2>
                <p className="text-sm text-gray-400">{selectedCliente.nombre}</p>
              </div>
            </div>

            <div className="space-y-4">
              
              {/* Campos específicos para Pago */}
              {modalType === 'PAGO' && (
                <div className="grid grid-cols-2 gap-2 mb-4">
                  {['Efectivo', 'Transferencia', 'Yape', 'Plin', 'Otro'].map(metodo => (
                    <button
                      key={metodo}
                      onClick={() => setPaymentMethod(metodo as any)}
                      className={`py-2 px-3 rounded-xl border text-sm font-medium transition-all ${
                        paymentMethod === metodo 
                          ? 'bg-emerald-600 border-emerald-500 text-white' 
                          : 'bg-gray-800 border-gray-700 text-gray-400 hover:bg-gray-700'
                      }`}
                    >
                      {metodo}
                    </button>
                  ))}
                </div>
              )}

              {/* Campos específicos para Pedido */}
              {modalType === 'PEDIDO' && (
                <div className="mb-4 space-y-3">
                   <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Tipo de Ave</label>
                    <select 
                      value={pedidoTipoAve}
                      onChange={(e) => setPedidoTipoAve(e.target.value)}
                      className="w-full bg-black/50 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500"
                    >
                      <option>Pollo</option>
                      <option>Pato</option>
                      <option>Pavo</option>
                      <option>Gallina</option>
                    </select>
                   </div>
                   <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Cantidad (Unidades)</label>
                    <input 
                      type="number" 
                      value={pedidoCantidad}
                      onChange={(e) => setPedidoCantidad(e.target.value)}
                      className="w-full bg-black/50 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500"
                      placeholder="Ej: 50"
                    />
                   </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">
                  {modalType === 'PEDIDO' ? 'Monto Estimado (S/)' : 'Monto (S/)'}
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">S/</span>
                  <input 
                    type="number" 
                    step="0.10"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full bg-black/50 border border-gray-700 rounded-xl pl-10 pr-4 py-4 text-white text-xl font-bold focus:outline-none focus:border-emerald-500 transition-colors"
                    autoFocus
                  />
                </div>
              </div>

              {/* Foto Comprobante (Solo Pagos Digitales) */}
              {modalType === 'PAGO' && paymentMethod !== 'Efectivo' && (
                <div>
                   <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Foto del Comprobante (Obligatorio)</label>
                   {paymentPhoto ? (
                     <div className="relative h-32 rounded-xl border border-gray-700 overflow-hidden group">
                       <img src={paymentPhoto} alt="Comprobante" className="w-full h-full object-cover" />
                       <button 
                         onClick={() => setPaymentPhoto(null)} 
                         className="absolute top-2 right-2 p-1 bg-black/50 rounded-full text-white hover:bg-black/80"
                       >
                         <X className="w-4 h-4" />
                       </button>
                     </div>
                   ) : (
                     <button 
                       onClick={handleCapturePhoto}
                       className="w-full h-32 border-2 border-dashed border-gray-700 rounded-xl flex flex-col items-center justify-center gap-2 text-gray-500 hover:border-emerald-500 hover:text-emerald-500 transition-colors hover:bg-emerald-900/10"
                     >
                       <Camera className="w-8 h-8" />
                       <span className="text-xs font-bold">TOMAR FOTO / SUBIR</span>
                     </button>
                   )}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">
                  Nota / Detalle
                </label>
                <textarea 
                  placeholder={modalType === 'PAGO' ? "Nro Operación, Observaciones..." : "Detalles adicionales..."}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="w-full bg-black/50 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500 transition-colors h-20 resize-none"
                />
              </div>

              <div className="pt-2">
                <button 
                  onClick={handleTransaction}
                  className={`w-full py-4 rounded-xl font-bold shadow-lg transition-all hover:scale-[1.02] flex items-center justify-center gap-2 text-white ${
                    modalType === 'PAGO' ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-500/20' :
                    modalType === 'PEDIDO' ? 'bg-blue-600 hover:bg-blue-500 shadow-blue-500/20' :
                    'bg-orange-600 hover:bg-orange-500 shadow-orange-500/20'
                  }`}
                >
                  <CheckCircle2 className="w-5 h-5" /> CONFIRMAR
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
