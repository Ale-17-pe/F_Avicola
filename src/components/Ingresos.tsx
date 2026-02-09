import { useState } from 'react';
import { DollarSign, CheckCircle, User, Calendar, Package, CreditCard, Banknote, Eye, X, Camera, Search } from 'lucide-react';

interface PagoDigital {
  metodo: 'BCP' | 'Transferencia' | 'Yape' | 'Plin' | 'Otro';
  comprobanteFoto: string;
  numeroOperacion?: string;
}

interface PagoFisico {
  metodo: 'Efectivo' | 'Cheque';
  reciboNumero?: string;
}

interface PedidoCompletado {
  id: string;
  cliente: string;
  tipoAve: string;
  cantidad: number;
  presentacion: string;
  pesoTotal: number;
  montoTotal: number;
  trabajadorCobranza: string;
  fechaPago: string;
  horaPago: string;
  tipoPago: 'Digital' | 'Físico';
  pagoDigital?: PagoDigital;
  pagoFisico?: PagoFisico;
  fechaPedido: string;
  empleadoPedido: string;
}

export function Ingresos() {
  const [pedidosCompletados] = useState<PedidoCompletado[]>([
    {
      id: '1',
      cliente: 'Restaurante El Sabor',
      tipoAve: 'Gallina',
      cantidad: 50,
      presentacion: 'Destripado',
      pesoTotal: 92.5,
      montoTotal: 1850.00,
      trabajadorCobranza: 'Carlos Méndez',
      fechaPago: '2025-02-03',
      horaPago: '14:30',
      tipoPago: 'Digital',
      pagoDigital: {
        metodo: 'Yape',
        comprobanteFoto: 'https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=400',
        numeroOperacion: 'YP-2025020314301234'
      },
      fechaPedido: '2025-02-03',
      empleadoPedido: 'Juan Pérez'
    },
    {
      id: '2',
      cliente: 'Pollería Don José',
      tipoAve: 'Pollo',
      cantidad: 100,
      presentacion: 'Pelado',
      pesoTotal: 183.5,
      montoTotal: 3670.00,
      trabajadorCobranza: 'María Torres',
      fechaPago: '2025-02-03',
      horaPago: '16:45',
      tipoPago: 'Digital',
      pagoDigital: {
        metodo: 'BCP',
        comprobanteFoto: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=400',
        numeroOperacion: 'BCP-002-2025-789456'
      },
      fechaPedido: '2025-02-03',
      empleadoPedido: 'María García'
    },
    {
      id: '3',
      cliente: 'Mercado Central',
      tipoAve: 'Pato',
      cantidad: 30,
      presentacion: 'Vivo',
      pesoTotal: 62.0,
      montoTotal: 1240.00,
      trabajadorCobranza: 'Roberto Silva',
      fechaPago: '2025-02-03',
      horaPago: '11:20',
      tipoPago: 'Físico',
      pagoFisico: {
        metodo: 'Efectivo',
        reciboNumero: 'REC-001-2025'
      },
      fechaPedido: '2025-02-03',
      empleadoPedido: 'Carlos López'
    },
    {
      id: '4',
      cliente: 'Distribuidora La Familia',
      tipoAve: 'Pollo',
      cantidad: 75,
      presentacion: 'Destripado',
      pesoTotal: 138.5,
      montoTotal: 2770.00,
      trabajadorCobranza: 'Carlos Méndez',
      fechaPago: '2025-02-02',
      horaPago: '15:00',
      tipoPago: 'Digital',
      pagoDigital: {
        metodo: 'Plin',
        comprobanteFoto: 'https://images.unsplash.com/photo-1607863680198-23d4b2565df0?w=400',
        numeroOperacion: 'PLN-789456123'
      },
      fechaPedido: '2025-02-02',
      empleadoPedido: 'Ana Martínez'
    },
    {
      id: '5',
      cliente: 'Cevichería El Puerto',
      tipoAve: 'Gallina',
      cantidad: 40,
      presentacion: 'Pelado',
      pesoTotal: 74.0,
      montoTotal: 1480.00,
      trabajadorCobranza: 'María Torres',
      fechaPago: '2025-02-02',
      horaPago: '10:15',
      tipoPago: 'Digital',
      pagoDigital: {
        metodo: 'Transferencia',
        comprobanteFoto: 'https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=400',
        numeroOperacion: 'TRANS-2025020210154567'
      },
      fechaPedido: '2025-02-02',
      empleadoPedido: 'Luis Ramírez'
    },
    {
      id: '6',
      cliente: 'Restaurante La Casa',
      tipoAve: 'Pollo',
      cantidad: 60,
      presentacion: 'Vivo',
      pesoTotal: 108.0,
      montoTotal: 2160.00,
      trabajadorCobranza: 'Roberto Silva',
      fechaPago: '2025-02-01',
      horaPago: '17:30',
      tipoPago: 'Físico',
      pagoFisico: {
        metodo: 'Efectivo',
        reciboNumero: 'REC-002-2025'
      },
      fechaPedido: '2025-02-01',
      empleadoPedido: 'Patricia Vega'
    },
    {
      id: '7',
      cliente: 'Restaurant El Buen Gusto',
      tipoAve: 'Pollo',
      cantidad: 80,
      presentacion: 'Destripado',
      pesoTotal: 145.0,
      montoTotal: 2900.00,
      trabajadorCobranza: 'Carlos Méndez',
      fechaPago: '2025-02-03',
      horaPago: '09:15',
      tipoPago: 'Físico',
      pagoFisico: {
        metodo: 'Efectivo',
        reciboNumero: 'REC-003-2025'
      },
      fechaPedido: '2025-02-03',
      empleadoPedido: 'Juan Pérez'
    }
  ]);

  const [fechaSeleccionada, setFechaSeleccionada] = useState('2025-02-03');
  const [searchCliente, setSearchCliente] = useState('');
  const [selectedPedido, setSelectedPedido] = useState<PedidoCompletado | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);

  const handleVerDetalle = (pedido: PedidoCompletado) => {
    setSelectedPedido(pedido);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedPedido(null);
  };

  const handleVerImagen = (imagenUrl: string) => {
    setSelectedImage(imagenUrl);
    setIsImageModalOpen(true);
  };

  const handleCloseImageModal = () => {
    setIsImageModalOpen(false);
    setSelectedImage(null);
  };

  // Filtrar pedidos por fecha seleccionada
  const pedidosDelDia = pedidosCompletados.filter(p => p.fechaPago === fechaSeleccionada);

  // Filtrar por búsqueda de cliente
  const pedidosFiltrados = pedidosDelDia.filter(p => 
    p.cliente.toLowerCase().includes(searchCliente.toLowerCase())
  );

  // Calcular totales del día
  const totalIngresosDia = pedidosDelDia.reduce((acc, p) => acc + p.montoTotal, 0);
  const cantidadPagosDigitales = pedidosDelDia.filter(p => p.tipoPago === 'Digital').length;
  const cantidadPagosFisicos = pedidosDelDia.filter(p => p.tipoPago === 'Físico').length;
  const totalPedidosDia = pedidosDelDia.length;

  // Agrupar por trabajador de cobranza
  const cobranzasPorTrabajador = pedidosDelDia.reduce((acc, p) => {
    if (!acc[p.trabajadorCobranza]) {
      acc[p.trabajadorCobranza] = { total: 0, cantidad: 0 };
    }
    acc[p.trabajadorCobranza].total += p.montoTotal;
    acc[p.trabajadorCobranza].cantidad += 1;
    return acc;
  }, {} as Record<string, { total: number; cantidad: number }>);

  const getMetodoPagoColor = (metodo: string) => {
    switch (metodo) {
      case 'Yape':
        return { bg: 'rgba(138, 43, 226, 0.2)', color: '#8a2be2', border: 'rgba(138, 43, 226, 0.3)' };
      case 'Plin':
        return { bg: 'rgba(0, 191, 255, 0.2)', color: '#00bfff', border: 'rgba(0, 191, 255, 0.3)' };
      case 'BCP':
        return { bg: 'rgba(0, 76, 151, 0.2)', color: '#004c97', border: 'rgba(0, 76, 151, 0.3)' };
      case 'Transferencia':
        return { bg: 'rgba(34, 197, 94, 0.2)', color: '#22c55e', border: 'rgba(34, 197, 94, 0.3)' };
      case 'Efectivo':
      case 'Cheque':
        return { bg: 'rgba(251, 146, 60, 0.2)', color: '#fb923c', border: 'rgba(251, 146, 60, 0.3)' };
      default:
        return { bg: 'rgba(156, 163, 175, 0.2)', color: '#9ca3af', border: 'rgba(156, 163, 175, 0.3)' };
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6 p-2 sm:p-4">
      {/* Selector de Fecha */}
      <div className="backdrop-blur-xl rounded-xl p-4 sm:p-6" style={{
        background: 'linear-gradient(135deg, rgba(204, 170, 0, 0.2), rgba(0, 0, 0, 0.3))',
        border: '2px solid rgba(204, 170, 0, 0.4)',
        boxShadow: '0 8px 32px rgba(204, 170, 0, 0.3)'
      }}>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
          <div>
            <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-white mb-1 flex items-center gap-2">
              <Calendar className="w-5 h-5 sm:w-6 sm:h-6" style={{ color: '#ccaa00' }} />
              <span className="hidden xs:inline">Filtro de Ingresos por Fecha</span>
              <span className="xs:hidden">Filtro por Fecha</span>
            </h2>
            <p className="text-gray-300 text-xs sm:text-sm font-medium">
              Visualiza todos los ingresos, métricas y rendimiento del día seleccionado
            </p>
          </div>
          <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
            <label className="text-xs sm:text-sm font-bold whitespace-nowrap" style={{ color: '#ccaa00' }}>Fecha:</label>
            <input
              type="date"
              value={fechaSeleccionada}
              onChange={(e) => setFechaSeleccionada(e.target.value)}
              className="px-3 py-2 sm:px-4 sm:py-3 rounded-lg text-white font-bold text-sm sm:text-lg w-full sm:w-auto"
              style={{
                background: 'rgba(0, 0, 0, 0.5)',
                border: '2px solid rgba(204, 170, 0, 0.6)',
                boxShadow: '0 4px 15px rgba(204, 170, 0, 0.2)'
              }}
            />
          </div>
        </div>
      </div>

      {/* Dashboard de Métricas del Día */}
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3 md:gap-4">
        <div className="backdrop-blur-xl rounded-xl p-3 sm:p-4 md:p-6" style={{
          background: 'linear-gradient(135deg, rgba(204, 170, 0, 0.2), rgba(0, 0, 0, 0.3))',
          border: '1px solid rgba(204, 170, 0, 0.3)',
          boxShadow: '0 8px 32px rgba(204, 170, 0, 0.2)'
        }}>
          <div className="flex items-center justify-between mb-2 sm:mb-3">
            <p className="text-xs sm:text-sm text-gray-300 font-medium">Total del Día</p>
            <DollarSign className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" style={{ color: '#ccaa00' }} />
          </div>
          <p className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold" style={{ color: '#ccaa00' }}>
            S/ {totalIngresosDia.toFixed(2)}
          </p>
          <p className="text-xs text-gray-400 mt-1">{totalPedidosDia} pedidos</p>
        </div>

        <div className="backdrop-blur-xl rounded-xl p-3 sm:p-4 md:p-6" style={{
          background: 'rgba(0, 0, 0, 0.3)',
          border: '1px solid rgba(59, 130, 246, 0.3)'
        }}>
          <div className="flex items-center justify-between mb-2 sm:mb-3">
            <p className="text-xs sm:text-sm text-gray-400 font-medium">Pagos Digitales</p>
            <CreditCard className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: '#3b82f6' }} />
          </div>
          <p className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold" style={{ color: '#3b82f6' }}>
            {cantidadPagosDigitales}
          </p>
          <p className="text-xs text-gray-500 mt-1">Transacciones digitales</p>
        </div>

        <div className="backdrop-blur-xl rounded-xl p-3 sm:p-4 md:p-6" style={{
          background: 'rgba(0, 0, 0, 0.3)',
          border: '1px solid rgba(251, 146, 60, 0.3)'
        }}>
          <div className="flex items-center justify-between mb-2 sm:mb-3">
            <p className="text-xs sm:text-sm text-gray-400 font-medium">Pagos Físicos</p>
            <Banknote className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: '#fb923c' }} />
          </div>
          <p className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold" style={{ color: '#fb923c' }}>
            {cantidadPagosFisicos}
          </p>
          <p className="text-xs text-gray-500 mt-1">Pagos en la avícola</p>
        </div>

        <div className="backdrop-blur-xl rounded-xl p-3 sm:p-4 md:p-6" style={{
          background: 'rgba(0, 0, 0, 0.3)',
          border: '1px solid rgba(34, 197, 94, 0.3)'
        }}>
          <div className="flex items-center justify-between mb-2 sm:mb-3">
            <p className="text-xs sm:text-sm text-gray-400 font-medium">Trabajadores</p>
            <User className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: '#22c55e' }} />
          </div>
          <p className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold" style={{ color: '#22c55e' }}>
            {Object.keys(cobranzasPorTrabajador).length}
          </p>
          <p className="text-xs text-gray-500 mt-1">Activos hoy</p>
        </div>
      </div>

      {/* Rendimiento por Trabajador del Día */}
      {Object.keys(cobranzasPorTrabajador).length > 0 && (
        <div className="backdrop-blur-xl rounded-xl p-4 sm:p-6" style={{
          background: 'rgba(0, 0, 0, 0.3)',
          border: '1px solid rgba(204, 170, 0, 0.3)'
        }}>
          <h3 className="text-base sm:text-lg md:text-xl font-bold text-white mb-3 sm:mb-4 flex items-center gap-2">
            <User className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" style={{ color: '#ccaa00' }} />
            <span className="hidden xs:inline">Rendimiento por Trabajador del Día</span>
            <span className="xs:hidden">Rendimiento por Trabajador</span>
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
            {Object.entries(cobranzasPorTrabajador).map(([trabajador, data]) => (
              <div 
                key={trabajador}
                className="p-3 sm:p-4 rounded-lg"
                style={{
                  background: 'linear-gradient(135deg, rgba(204, 170, 0, 0.1), rgba(0, 0, 0, 0.2))',
                  border: '1px solid rgba(204, 170, 0, 0.2)'
                }}
              >
                <p className="text-xs text-gray-400 mb-1">Trabajador</p>
                <p className="text-white font-bold text-sm sm:text-base mb-2 sm:mb-3 truncate">{trabajador}</p>
                <div className="grid grid-cols-2 gap-2 sm:gap-3">
                  <div>
                    <p className="text-xs text-gray-400">Total Recaudado</p>
                    <p className="text-sm sm:text-base md:text-lg font-bold" style={{ color: '#ccaa00' }}>
                      S/ {data.total.toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Pedidos</p>
                    <p className="text-sm sm:text-base md:text-lg font-bold text-white">{data.cantidad}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Listado de Pedidos Completados del Día */}
      <div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 mb-3 sm:mb-4">
          <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-white flex items-center gap-2">
            <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" style={{ color: '#22c55e' }} />
            <span className="hidden xs:inline">Pedidos del Día - {fechaSeleccionada}</span>
            <span className="xs:hidden">Pedidos - {fechaSeleccionada.split('-')[2]}/{fechaSeleccionada.split('-')[1]}</span>
          </h2>

          {/* Buscador de Clientes */}
          {pedidosDelDia.length > 0 && (
            <div className="relative w-full sm:max-w-md">
              <Search className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar cliente..."
                value={searchCliente}
                onChange={(e) => setSearchCliente(e.target.value)}
                className="w-full pl-9 sm:pl-12 pr-3 sm:pr-4 py-2 sm:py-3 rounded-lg sm:rounded-xl text-sm sm:text-base text-white placeholder-gray-400 font-medium"
                style={{
                  background: 'rgba(0, 0, 0, 0.4)',
                  border: '1px solid rgba(204, 170, 0, 0.3)'
                }}
              />
            </div>
          )}
        </div>

        {pedidosFiltrados.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {pedidosFiltrados.map((pedido) => {
              const metodoPago = pedido.tipoPago === 'Digital' 
                ? pedido.pagoDigital?.metodo 
                : pedido.pagoFisico?.metodo;
              const metodoPagoStyle = getMetodoPagoColor(metodoPago || '');

              return (
                <div 
                  key={pedido.id}
                  className="backdrop-blur-xl rounded-xl overflow-hidden transition-all hover:scale-[1.02]"
                  style={{
                    background: 'rgba(0, 0, 0, 0.4)',
                    border: '1px solid rgba(204, 170, 0, 0.3)',
                    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)'
                  }}
                >
                  {/* Header del Panel */}
                  <div className="p-3 sm:p-4 border-b" style={{
                    background: 'linear-gradient(135deg, rgba(204, 170, 0, 0.15), rgba(0, 0, 0, 0.3))',
                    borderColor: 'rgba(204, 170, 0, 0.2)'
                  }}>
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-gray-400 mb-1">Cliente</p>
                        <p className="text-white font-bold text-base sm:text-lg truncate">{pedido.cliente}</p>
                      </div>
                      <div 
                        className="px-2 py-1 rounded-full text-xs font-bold flex-shrink-0"
                        style={{
                          background: metodoPagoStyle.bg,
                          color: metodoPagoStyle.color,
                          border: `1px solid ${metodoPagoStyle.border}`
                        }}
                      >
                        {metodoPago?.substring(0, 4)}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 sm:gap-2 text-xs text-gray-400">
                      <Calendar className="w-3 h-3" />
                      <span>{pedido.horaPago}</span>
                    </div>
                  </div>

                  {/* Contenido del Panel */}
                  <div className="p-3 sm:p-4 space-y-2 sm:space-y-3">
                    {/* Detalle del Pedido */}
                    <div>
                      <p className="text-xs text-gray-400 mb-1 sm:mb-2">Detalle del Pedido</p>
                      <div className="flex items-center gap-1 sm:gap-2 mb-1">
                        <Package className="w-3 h-3 sm:w-4 sm:h-4" style={{ color: '#ccaa00' }} />
                        <p className="text-white font-medium text-sm sm:text-base truncate">
                          {pedido.tipoAve} - {pedido.presentacion}
                        </p>
                      </div>
                      <div className="grid grid-cols-2 gap-1 sm:gap-2 text-xs sm:text-sm">
                        <div>
                          <p className="text-gray-400 text-xs">Cantidad</p>
                          <p className="text-white font-bold">{pedido.cantidad} aves</p>
                        </div>
                        <div>
                          <p className="text-gray-400 text-xs">Peso Total</p>
                          <p className="text-white font-bold">{pedido.pesoTotal.toFixed(2)} kg</p>
                        </div>
                      </div>
                    </div>

                    {/* Monto Total */}
                    <div 
                      className="p-2 sm:p-3 rounded-lg"
                      style={{
                        background: 'linear-gradient(135deg, rgba(204, 170, 0, 0.2), rgba(0, 0, 0, 0.3))',
                        border: '1px solid rgba(204, 170, 0, 0.3)'
                      }}
                    >
                      <p className="text-xs text-gray-400 mb-1">Monto Total</p>
                      <p className="text-xl sm:text-2xl md:text-3xl font-bold" style={{ color: '#ccaa00' }}>
                        S/ {pedido.montoTotal.toFixed(2)}
                      </p>
                    </div>

                    {/* Trabajador de Cobranza */}
                    <div className="flex items-center gap-2 p-2 rounded-lg" style={{
                      background: 'rgba(34, 197, 94, 0.1)',
                      border: '1px solid rgba(34, 197, 94, 0.2)'
                    }}>
                      <User className="w-3 h-3 sm:w-4 sm:h-4" style={{ color: '#22c55e' }} />
                      <div className="min-w-0">
                        <p className="text-xs text-gray-400 truncate">Cobrador</p>
                        <p className="text-white font-medium text-xs sm:text-sm truncate">{pedido.trabajadorCobranza}</p>
                      </div>
                    </div>

                    {/* Comprobante Digital */}
                    {pedido.tipoPago === 'Digital' && pedido.pagoDigital && (
                      <div 
                        className="p-2 sm:p-3 rounded-lg"
                        style={{
                          background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.15), rgba(0, 0, 0, 0.3))',
                          border: '1px solid rgba(59, 130, 246, 0.3)'
                        }}
                      >
                        <div className="flex items-center gap-1 sm:gap-2 mb-1">
                          <Camera className="w-3 h-3 sm:w-4 sm:h-4" style={{ color: '#3b82f6' }} />
                          <p className="text-xs sm:text-sm font-bold truncate" style={{ color: '#3b82f6' }}>
                            Comprobante Digital
                          </p>
                        </div>
                        <p className="text-white text-xs sm:text-sm truncate">Comprobante disponible</p>
                      </div>
                    )}

                    {/* Pago Físico */}
                    {pedido.tipoPago === 'Físico' && pedido.pagoFisico && (
                      <div 
                        className="p-2 sm:p-3 rounded-lg"
                        style={{
                          background: 'rgba(251, 146, 60, 0.15)',
                          border: '1px solid rgba(251, 146, 60, 0.3)'
                        }}
                      >
                        <div className="flex items-center gap-1 sm:gap-2 mb-1">
                          <Banknote className="w-3 h-3 sm:w-4 sm:h-4" style={{ color: '#fb923c' }} />
                          <p className="text-xs sm:text-sm font-bold truncate" style={{ color: '#fb923c' }}>
                            Pago Presencial
                          </p>
                        </div>
                        <p className="text-white text-xs sm:text-sm truncate">Pago en la avícola</p>
                      </div>
                    )}

                    {/* Botón Ver Detalle */}
                    <button
                      onClick={() => handleVerDetalle(pedido)}
                      className="w-full px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg font-medium transition-all hover:scale-105 flex items-center justify-center gap-1 sm:gap-2 text-xs sm:text-sm"
                      style={{
                        background: 'linear-gradient(to right, #0d4a24, #166534, #b8941e, #ccaa00)',
                        color: '#ffffff'
                      }}
                    >
                      <Eye className="w-3 h-3 sm:w-4 sm:h-4" />
                      <span className="hidden sm:inline">Ver Detalle</span>
                      <span className="sm:hidden">Ver</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8 sm:py-12 backdrop-blur-xl rounded-xl" style={{
            background: 'rgba(0, 0, 0, 0.3)',
            border: '1px solid rgba(204, 170, 0, 0.3)'
          }}>
            <Calendar className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 text-gray-600" />
            <p className="text-gray-400 text-sm sm:text-lg">No hay pedidos registrados para esta fecha</p>
            <p className="text-gray-500 text-xs sm:text-sm mt-2">Selecciona otra fecha para ver los ingresos</p>
          </div>
        )}
      </div>

      {/* Modal de Detalle Completo */}
      {isModalOpen && selectedPedido && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4" style={{ background: 'rgba(0, 0, 0, 0.85)' }}>
          <div 
            className="backdrop-blur-xl rounded-xl sm:rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto mx-2"
            style={{
              background: 'rgba(0, 0, 0, 0.6)',
              border: '1px solid rgba(204, 170, 0, 0.3)',
              boxShadow: '0 20px 40px -12px rgba(0, 0, 0, 0.5)'
            }}
          >
            {/* Header */}
            <div className="sticky top-0 px-4 sm:px-6 py-3 sm:py-4 border-b" style={{ 
              background: 'rgba(0, 0, 0, 0.8)',
              borderColor: 'rgba(204, 170, 0, 0.3)' 
            }}>
              <div className="flex items-center justify-between">
                <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-white flex items-center gap-2">
                  <DollarSign className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" style={{ color: '#ccaa00' }} />
                  <span className="hidden xs:inline">Detalle del Pago</span>
                  <span className="xs:hidden">Pago</span>
                </h2>
                <button
                  onClick={handleCloseModal}
                  className="p-1.5 sm:p-2 rounded-lg transition-all hover:scale-110"
                  style={{ background: 'rgba(255, 255, 255, 0.1)' }}
                >
                  <X className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                </button>
              </div>
            </div>

            <div className="p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6">
              {/* Información del Cliente */}
              <div className="backdrop-blur-xl rounded-xl p-3 sm:p-4 md:p-6" style={{
                background: 'rgba(0, 0, 0, 0.3)',
                border: '1px solid rgba(204, 170, 0, 0.3)'
              }}>
                <h3 className="text-base sm:text-lg font-bold mb-3 sm:mb-4" style={{ color: '#ccaa00' }}>Información del Cliente</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <p className="text-xs sm:text-sm text-gray-400 mb-1">Cliente</p>
                    <p className="text-white font-bold text-sm sm:text-base md:text-lg">{selectedPedido.cliente}</p>
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm text-gray-400 mb-1">Fecha de Pago</p>
                    <p className="text-white font-medium text-sm sm:text-base">{selectedPedido.fechaPago} - {selectedPedido.horaPago}</p>
                  </div>
                </div>
              </div>

              {/* Detalle del Pedido */}
              <div className="backdrop-blur-xl rounded-xl p-3 sm:p-4 md:p-6" style={{
                background: 'rgba(0, 0, 0, 0.3)',
                border: '1px solid rgba(59, 130, 246, 0.3)'
              }}>
                <h3 className="text-base sm:text-lg font-bold mb-3 sm:mb-4" style={{ color: '#3b82f6' }}>Detalle del Pedido</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <p className="text-xs sm:text-sm text-gray-400 mb-1">Tipo de Ave</p>
                    <p className="text-white font-bold text-sm sm:text-base">{selectedPedido.tipoAve}</p>
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm text-gray-400 mb-1">Presentación</p>
                    <p className="text-white font-bold text-sm sm:text-base">{selectedPedido.presentacion}</p>
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm text-gray-400 mb-1">Cantidad</p>
                    <p className="text-white font-bold text-base sm:text-lg">{selectedPedido.cantidad} aves</p>
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm text-gray-400 mb-1">Peso Total</p>
                    <p className="text-white font-bold text-base sm:text-lg">{selectedPedido.pesoTotal.toFixed(2)} kg</p>
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm text-gray-400 mb-1">Fecha del Pedido</p>
                    <p className="text-white font-medium text-sm sm:text-base">{selectedPedido.fechaPedido}</p>
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm text-gray-400 mb-1">Empleado que Registró</p>
                    <p className="text-white font-medium text-sm sm:text-base">{selectedPedido.empleadoPedido}</p>
                  </div>
                </div>
              </div>

              {/* Información de Pago */}
              <div className="backdrop-blur-xl rounded-xl p-3 sm:p-4 md:p-6" style={{
                background: 'linear-gradient(135deg, rgba(204, 170, 0, 0.2), rgba(0, 0, 0, 0.3))',
                border: '1px solid rgba(204, 170, 0, 0.3)'
              }}>
                <h3 className="text-base sm:text-lg font-bold mb-3 sm:mb-4" style={{ color: '#ccaa00' }}>Información de Pago</h3>
                <div className="space-y-3 sm:space-y-4">
                  <div>
                    <p className="text-xs sm:text-sm text-gray-400 mb-1">Tipo de Pago</p>
                    <p className="text-white font-bold text-base sm:text-lg">{selectedPedido.tipoPago}</p>
                  </div>
                  
                  {selectedPedido.tipoPago === 'Digital' && selectedPedido.pagoDigital && (
                    <>
                      <div>
                        <p className="text-xs sm:text-sm text-gray-400 mb-1">Método de Pago</p>
                        <p className="text-white font-bold text-sm sm:text-base">{selectedPedido.pagoDigital.metodo}</p>
                      </div>
                      {selectedPedido.pagoDigital.numeroOperacion && (
                        <div>
                          <p className="text-xs sm:text-sm text-gray-400 mb-1">Número de Operación</p>
                          <p className="text-white font-mono text-xs sm:text-sm break-all">{selectedPedido.pagoDigital.numeroOperacion}</p>
                        </div>
                      )}
                      <div>
                        <p className="text-xs sm:text-sm text-gray-400 mb-2 sm:mb-3">Comprobante de Pago</p>
                        <div 
                          className="aspect-video bg-black/30 rounded-lg overflow-hidden cursor-pointer hover:scale-105 transition-all"
                          onClick={() => handleVerImagen(selectedPedido.pagoDigital!.comprobanteFoto)}
                        >
                          <img 
                            src={selectedPedido.pagoDigital.comprobanteFoto} 
                            alt="Comprobante"
                            className="w-full h-full object-cover"
                          />
                        </div>
                      </div>
                    </>
                  )}

                  {selectedPedido.tipoPago === 'Físico' && selectedPedido.pagoFisico && (
                    <>
                      <div>
                        <p className="text-xs sm:text-sm text-gray-400 mb-1">Método de Pago</p>
                        <p className="text-white font-bold text-sm sm:text-base">{selectedPedido.pagoFisico.metodo}</p>
                      </div>
                      {selectedPedido.pagoFisico.reciboNumero && (
                        <div>
                          <p className="text-xs sm:text-sm text-gray-400 mb-1">Número de Recibo</p>
                          <p className="text-white font-mono text-xs sm:text-sm">{selectedPedido.pagoFisico.reciboNumero}</p>
                        </div>
                      )}
                      <div 
                        className="p-3 sm:p-4 rounded-lg text-center"
                        style={{
                          background: 'rgba(251, 146, 60, 0.15)',
                          border: '1px solid rgba(251, 146, 60, 0.3)'
                        }}
                      >
                        <Banknote className="w-8 h-8 sm:w-12 sm:h-12 mx-auto mb-2" style={{ color: '#fb923c' }} />
                        <p className="text-white font-medium text-sm sm:text-base">Pago realizado presencialmente en la avícola</p>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Trabajador de Cobranza */}
              <div className="backdrop-blur-xl rounded-xl p-3 sm:p-4 md:p-6" style={{
                background: 'rgba(0, 0, 0, 0.3)',
                border: '1px solid rgba(34, 197, 94, 0.3)'
              }}>
                <h3 className="text-base sm:text-lg font-bold mb-3 sm:mb-4" style={{ color: '#22c55e' }}>Trabajador de Cobranza</h3>
                <div className="flex items-center gap-2 sm:gap-3">
                  <div 
                    className="w-12 h-12 sm:w-16 sm:h-16 rounded-full flex items-center justify-center"
                    style={{
                      background: 'linear-gradient(135deg, #22c55e, #16a34a)',
                      boxShadow: '0 8px 24px rgba(34, 197, 94, 0.3)'
                    }}
                  >
                    <User className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm text-gray-400">Responsable de Cobranza</p>
                    <p className="text-white font-bold text-sm sm:text-base md:text-lg truncate">{selectedPedido.trabajadorCobranza}</p>
                  </div>
                </div>
              </div>

              {/* Monto Total */}
              <div 
                className="backdrop-blur-xl rounded-xl p-4 sm:p-6 md:p-8 text-center"
                style={{
                  background: 'linear-gradient(135deg, rgba(204, 170, 0, 0.3), rgba(0, 0, 0, 0.4))',
                  border: '2px solid rgba(204, 170, 0, 0.5)',
                  boxShadow: '0 10px 40px rgba(204, 170, 0, 0.3)'
                }}
              >
                <p className="text-xs sm:text-sm text-gray-300 mb-1 sm:mb-2">MONTO TOTAL PAGADO</p>
                <p className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold" style={{ color: '#ccaa00' }}>
                  S/ {selectedPedido.montoTotal.toFixed(2)}
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 px-4 sm:px-6 py-3 sm:py-4 border-t" style={{ 
              background: 'rgba(0, 0, 0, 0.8)',
              borderColor: 'rgba(204, 170, 0, 0.3)' 
            }}>
              <button
                onClick={handleCloseModal}
                className="w-full px-4 py-2.5 sm:py-3 rounded-lg font-bold transition-all hover:scale-105 text-sm sm:text-base"
                style={{
                  background: 'linear-gradient(to right, #0d4a24, #166534, #b8941e, #ccaa00)',
                  color: '#ffffff'
                }}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Imagen Ampliada */}
      {isImageModalOpen && selectedImage && (
        <div 
          className="fixed inset-0 z-[60] flex items-center justify-center p-2 sm:p-4" 
          style={{ background: 'rgba(0, 0, 0, 0.95)' }}
          onClick={handleCloseImageModal}
        >
          <div className="relative max-w-4xl w-full">
            <button
              onClick={handleCloseImageModal}
              className="absolute -top-10 sm:-top-12 right-0 p-2 sm:p-3 rounded-full transition-all hover:scale-110"
              style={{ 
                background: 'rgba(239, 68, 68, 0.2)',
                border: '1px solid rgba(239, 68, 68, 0.3)'
              }}
            >
              <X className="w-5 h-5 sm:w-6 sm:h-6" style={{ color: '#ef4444' }} />
            </button>
            <img 
              src={selectedImage} 
              alt="Comprobante Ampliado"
              className="w-full h-auto rounded-xl sm:rounded-2xl"
              style={{
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8)'
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}