import { useState } from 'react';
import { Truck, Package, CheckCircle, Clock, Eye, X, User, Car, Calendar, MapPin, Weight, Bird } from 'lucide-react';

// Tipos relacionados con pedidos
interface Pedido {
  id: string;
  cliente: string;
  tipoAve: string;
  cantidad: number;
  presentacion: string;
  mermaUnitaria: number;
  mermaTotal: number;
  contenedor: string;
  pesoContenedor: number;
  pesoTotalPedido: number;
  empleado: string;
  fecha: string;
  hora: string;
  estado: 'Pendiente' | 'En Producción' | 'Completado';
  autoConfirmado: boolean;
}

interface Envio {
  id: string;
  pedidoId: string;
  conductor: string;
  vehiculo: string;
  placa: string;
  estado: 'En Curso' | 'Entregado';
  fechaEnvio: string;
  horaEnvio: string;
  destino: string;
}

// Datos de ejemplo de pedidos
const pedidosEjemplo: Pedido[] = [
  {
    id: '1',
    cliente: 'Restaurante El Sabor',
    tipoAve: 'Gallina',
    cantidad: 50,
    presentacion: 'Destripado',
    mermaUnitaria: 0.20,
    mermaTotal: 10.0,
    contenedor: 'Javas Nuevas',
    pesoContenedor: 2.5,
    pesoTotalPedido: 92.5,
    empleado: 'Juan Pérez',
    fecha: '2025-02-02',
    hora: '08:30',
    estado: 'Completado',
    autoConfirmado: true
  },
  {
    id: '2',
    cliente: 'Pollería Don José',
    tipoAve: 'Pollo',
    cantidad: 100,
    presentacion: 'Pelado',
    mermaUnitaria: 0.15,
    mermaTotal: 15.0,
    contenedor: 'Tinas Verdes',
    pesoContenedor: 3.5,
    pesoTotalPedido: 183.5,
    empleado: 'María García',
    fecha: '2025-02-02',
    hora: '09:15',
    estado: 'Completado',
    autoConfirmado: true
  },
  {
    id: '3',
    cliente: 'Mercado Central',
    tipoAve: 'Pato',
    cantidad: 30,
    presentacion: 'Vivo',
    mermaUnitaria: 0,
    mermaTotal: 0,
    contenedor: 'Javas Viejas',
    pesoContenedor: 2.0,
    pesoTotalPedido: 62.0,
    empleado: 'Carlos López',
    fecha: '2025-02-02',
    hora: '10:00',
    estado: 'Completado',
    autoConfirmado: true
  },
  {
    id: '4',
    cliente: 'Distribuidora La Familia',
    tipoAve: 'Pollo',
    cantidad: 75,
    presentacion: 'Destripado',
    mermaUnitaria: 0.20,
    mermaTotal: 15.0,
    contenedor: 'Tinas Verdes',
    pesoContenedor: 3.5,
    pesoTotalPedido: 138.5,
    empleado: 'Ana Martínez',
    fecha: '2025-02-02',
    hora: '11:30',
    estado: 'Completado',
    autoConfirmado: true
  }
];

export function Envios() {
  const [envios] = useState<Envio[]>([
    {
      id: '1',
      pedidoId: '1',
      conductor: 'Roberto Sánchez',
      vehiculo: 'Toyota Hilux',
      placa: 'ABC-123',
      estado: 'En Curso',
      fechaEnvio: '2025-02-02',
      horaEnvio: '09:00',
      destino: 'Av. Principal 123, Lima'
    },
    {
      id: '2',
      pedidoId: '2',
      conductor: 'Miguel Ángel Torres',
      vehiculo: 'Nissan Frontier',
      placa: 'XYZ-456',
      estado: 'En Curso',
      fechaEnvio: '2025-02-02',
      horaEnvio: '10:30',
      destino: 'Jr. Los Olivos 456, Trujillo'
    },
    {
      id: '3',
      pedidoId: '3',
      conductor: 'Pedro Ramírez',
      vehiculo: 'Ford Ranger',
      placa: 'DEF-789',
      estado: 'Entregado',
      fechaEnvio: '2025-02-01',
      horaEnvio: '14:00',
      destino: 'Av. Central 789, Lima'
    },
    {
      id: '4',
      pedidoId: '4',
      conductor: 'Luis Fernández',
      vehiculo: 'Chevrolet D-MAX',
      placa: 'GHI-321',
      estado: 'Entregado',
      fechaEnvio: '2025-02-01',
      horaEnvio: '08:00',
      destino: 'Jr. Comercio 321, Chiclayo'
    }
  ]);

  const [selectedEnvio, setSelectedEnvio] = useState<Envio | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const getPedidoByEnvio = (pedidoId: string): Pedido | undefined => {
    return pedidosEjemplo.find(p => p.id === pedidoId);
  };

  const handleVerInformacion = (envio: Envio) => {
    setSelectedEnvio(envio);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedEnvio(null);
  };

  // Calcular estadísticas
  const enviosEnCurso = envios.filter(e => e.estado === 'En Curso').length;
  const enviosEntregados = envios.filter(e => e.estado === 'Entregado').length;
  const totalEnvios = envios.length;
  const tasaEntrega = totalEnvios > 0 ? ((enviosEntregados / totalEnvios) * 100).toFixed(1) : '0';

  const getEstadoStyle = (estado: string) => {
    switch (estado) {
      case 'En Curso':
        return { bg: 'rgba(59, 130, 246, 0.2)', color: '#3b82f6', border: 'rgba(59, 130, 246, 0.3)' };
      case 'Entregado':
        return { bg: 'rgba(34, 197, 94, 0.2)', color: '#22c55e', border: 'rgba(34, 197, 94, 0.3)' };
      default:
        return { bg: 'rgba(255, 255, 255, 0.1)', color: '#ffffff', border: 'rgba(255, 255, 255, 0.2)' };
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6 p-2 sm:p-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-white mb-1 sm:mb-2">Envíos</h1>
          <p className="text-xs sm:text-sm text-gray-400">Control de distribución y entregas</p>
        </div>
      </div>

      {/* Dashboard de Métricas */}
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3 md:gap-4">
        <div className="backdrop-blur-xl rounded-xl p-3 sm:p-4 md:p-6" style={{
          background: 'rgba(0, 0, 0, 0.3)',
          border: '1px solid rgba(255, 255, 255, 0.2)'
        }}>
          <div className="flex items-center justify-between mb-2 sm:mb-3">
            <p className="text-xs sm:text-sm text-gray-400 font-medium">Total Envíos</p>
            <Truck className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
          </div>
          <p className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-white">{totalEnvios}</p>
          <p className="text-xs sm:text-sm text-gray-400 mt-1">Registrados</p>
        </div>

        <div className="backdrop-blur-xl rounded-xl p-3 sm:p-4 md:p-6" style={{
          background: 'rgba(0, 0, 0, 0.3)',
          border: '1px solid rgba(59, 130, 246, 0.3)'
        }}>
          <div className="flex items-center justify-between mb-2 sm:mb-3">
            <p className="text-xs sm:text-sm text-gray-400 font-medium">En Curso</p>
            <Clock className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: '#3b82f6' }} />
          </div>
          <p className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold" style={{ color: '#3b82f6' }}>{enviosEnCurso}</p>
          <p className="text-xs sm:text-sm" style={{ color: '#3b82f6' }}>En tránsito</p>
        </div>

        <div className="backdrop-blur-xl rounded-xl p-3 sm:p-4 md:p-6" style={{
          background: 'rgba(0, 0, 0, 0.3)',
          border: '1px solid rgba(34, 197, 94, 0.3)'
        }}>
          <div className="flex items-center justify-between mb-2 sm:mb-3">
            <p className="text-xs sm:text-sm text-gray-400 font-medium">Entregados</p>
            <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: '#22c55e' }} />
          </div>
          <p className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold" style={{ color: '#22c55e' }}>{enviosEntregados}</p>
          <p className="text-xs sm:text-sm" style={{ color: '#22c55e' }}>Completados</p>
        </div>

        <div className="backdrop-blur-xl rounded-xl p-3 sm:p-4 md:p-6" style={{
          background: 'rgba(0, 0, 0, 0.3)',
          border: '1px solid rgba(204, 170, 0, 0.3)'
        }}>
          <div className="flex items-center justify-between mb-2 sm:mb-3">
            <p className="text-xs sm:text-sm text-gray-400 font-medium">Tasa de Entrega</p>
            <Package className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: '#ccaa00' }} />
          </div>
          <p className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold" style={{ color: '#ccaa00' }}>{tasaEntrega}%</p>
          <p className="text-xs sm:text-sm" style={{ color: '#ccaa00' }}>Efectividad</p>
        </div>
      </div>

      {/* Sección: Pedidos en Curso */}
      <div className="backdrop-blur-xl rounded-xl overflow-hidden" style={{
        background: 'rgba(0, 0, 0, 0.3)',
        border: '1px solid rgba(59, 130, 246, 0.3)'
      }}>
        <div className="px-4 sm:px-6 py-3 sm:py-4 border-b" style={{ 
          background: 'rgba(59, 130, 246, 0.1)',
          borderColor: 'rgba(59, 130, 246, 0.3)' 
        }}>
          <h2 className="text-base sm:text-lg md:text-xl font-bold text-white flex items-center gap-2">
            <Clock className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" style={{ color: '#3b82f6' }} />
            <span className="hidden xs:inline">Pedidos en Curso</span>
            <span className="xs:hidden">En Curso</span>
            <span className="ml-2 px-2 py-1 rounded-full text-xs font-bold" style={{
              background: 'rgba(59, 130, 246, 0.3)',
              color: '#3b82f6'
            }}>
              {enviosEnCurso}
            </span>
          </h2>
        </div>

        {/* Desktop Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr style={{ background: 'rgba(0, 0, 0, 0.4)', borderBottom: '1px solid rgba(59, 130, 246, 0.3)' }}>
                <th className="px-4 lg:px-6 py-3 text-left font-bold text-xs sm:text-sm" style={{ color: '#3b82f6' }}>Conductor</th>
                <th className="px-4 lg:px-6 py-3 text-left font-bold text-xs sm:text-sm" style={{ color: '#3b82f6' }}>Vehículo</th>
                <th className="px-4 lg:px-6 py-3 text-left font-bold text-xs sm:text-sm" style={{ color: '#3b82f6' }}>Placa</th>
                <th className="px-4 lg:px-6 py-3 text-left font-bold text-xs sm:text-sm" style={{ color: '#3b82f6' }}>Cliente</th>
                <th className="px-4 lg:px-6 py-3 text-left font-bold text-xs sm:text-sm" style={{ color: '#3b82f6' }}>Destino</th>
                <th className="px-4 lg:px-6 py-3 text-left font-bold text-xs sm:text-sm" style={{ color: '#3b82f6' }}>Fecha/Hora</th>
                <th className="px-4 lg:px-6 py-3 text-center font-bold text-xs sm:text-sm" style={{ color: '#3b82f6' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {envios.filter(e => e.estado === 'En Curso').map((envio) => {
                const pedido = getPedidoByEnvio(envio.pedidoId);
                return (
                  <tr 
                    key={envio.id}
                    className="border-b transition-colors hover:bg-white/5"
                    style={{ borderColor: 'rgba(255, 255, 255, 0.05)' }}
                  >
                    <td className="px-4 lg:px-6 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center" style={{
                          background: 'linear-gradient(135deg, #3b82f6, #2563eb)'
                        }}>
                          <User className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                        </div>
                        <span className="text-white font-medium text-sm truncate">{envio.conductor}</span>
                      </div>
                    </td>
                    <td className="px-4 lg:px-6 py-3">
                      <div className="flex items-center gap-1 sm:gap-2">
                        <Car className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400 flex-shrink-0" />
                        <span className="text-white text-sm truncate">{envio.vehiculo}</span>
                      </div>
                    </td>
                    <td className="px-4 lg:px-6 py-3">
                      <span className="px-2 py-1 rounded-lg text-xs font-bold" style={{
                        background: 'rgba(255, 255, 255, 0.1)',
                        color: '#ccaa00',
                        border: '1px solid rgba(204, 170, 0, 0.3)'
                      }}>
                        {envio.placa}
                      </span>
                    </td>
                    <td className="px-4 lg:px-6 py-3">
                      <span className="text-white font-medium text-sm truncate">{pedido?.cliente || 'N/A'}</span>
                    </td>
                    <td className="px-4 lg:px-6 py-3">
                      <div className="flex items-start gap-1 sm:gap-2">
                        <MapPin className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                        <span className="text-gray-300 text-xs truncate">{envio.destino}</span>
                      </div>
                    </td>
                    <td className="px-4 lg:px-6 py-3">
                      <div className="text-xs sm:text-sm">
                        <p className="text-white">{envio.fechaEnvio}</p>
                        <p className="text-gray-400">{envio.horaEnvio}</p>
                      </div>
                    </td>
                    <td className="px-4 lg:px-6 py-3">
                      <div className="flex items-center justify-center">
                        <button
                          onClick={() => handleVerInformacion(envio)}
                          className="px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg font-medium transition-all hover:scale-105 flex items-center gap-1 sm:gap-2 text-xs sm:text-sm"
                          style={{
                            background: 'linear-gradient(to right, #0d4a24, #166534, #b8941e, #ccaa00)',
                            color: '#ffffff'
                          }}
                        >
                          <Eye className="w-3 h-3 sm:w-4 sm:h-4" />
                          <span className="hidden sm:inline">Ver Info</span>
                          <span className="sm:hidden">Ver</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="md:hidden">
          {envios.filter(e => e.estado === 'En Curso').map((envio) => {
            const pedido = getPedidoByEnvio(envio.pedidoId);
            return (
              <div 
                key={envio.id}
                className="p-3 sm:p-4 border-b transition-colors hover:bg-white/5"
                style={{ borderColor: 'rgba(255, 255, 255, 0.05)' }}
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{
                        background: 'linear-gradient(135deg, #3b82f6, #2563eb)'
                      }}>
                        <User className="w-3 h-3 text-white" />
                      </div>
                      <div>
                        <p className="text-white font-medium text-sm">{envio.conductor}</p>
                        <div className="flex items-center gap-2">
                          <Car className="w-3 h-3 text-gray-400" />
                          <p className="text-gray-300 text-xs">{envio.vehiculo}</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="px-2 py-1 rounded-lg text-xs font-bold" style={{
                        background: 'rgba(255, 255, 255, 0.1)',
                        color: '#ccaa00',
                        border: '1px solid rgba(204, 170, 0, 0.3)'
                      }}>
                        {envio.placa}
                      </span>
                      <span className="text-white text-xs bg-blue-500/20 px-2 py-1 rounded-full">
                        En Curso
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleVerInformacion(envio)}
                    className="px-3 py-1.5 rounded-lg font-medium transition-all hover:scale-105 flex items-center gap-1 text-xs"
                    style={{
                      background: 'linear-gradient(to right, #0d4a24, #166534, #b8941e, #ccaa00)',
                      color: '#ffffff'
                    }}
                  >
                    <Eye className="w-3 h-3" />
                    Ver
                  </button>
                </div>
                
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <p className="text-gray-400 mb-1">Cliente</p>
                    <p className="text-white truncate">{pedido?.cliente || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 mb-1">Fecha/Hora</p>
                    <div>
                      <p className="text-white">{envio.fechaEnvio}</p>
                      <p className="text-gray-400">{envio.horaEnvio}</p>
                    </div>
                  </div>
                  <div className="col-span-2">
                    <p className="text-gray-400 mb-1">Destino</p>
                    <div className="flex items-start gap-1">
                      <MapPin className="w-3 h-3 text-gray-400 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-300 text-xs">{envio.destino}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {enviosEnCurso === 0 && (
          <div className="text-center py-8 sm:py-12">
            <Clock className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4" style={{ color: '#3b82f6', opacity: 0.3 }} />
            <p className="text-gray-400 text-sm sm:text-base">No hay envíos en curso</p>
          </div>
        )}
      </div>

      {/* Sección: Envíos Entregados */}
      <div className="backdrop-blur-xl rounded-xl overflow-hidden" style={{
        background: 'rgba(0, 0, 0, 0.3)',
        border: '1px solid rgba(34, 197, 94, 0.3)'
      }}>
        <div className="px-4 sm:px-6 py-3 sm:py-4 border-b" style={{ 
          background: 'rgba(34, 197, 94, 0.1)',
          borderColor: 'rgba(34, 197, 94, 0.3)' 
        }}>
          <h2 className="text-base sm:text-lg md:text-xl font-bold text-white flex items-center gap-2">
            <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" style={{ color: '#22c55e' }} />
            <span className="hidden xs:inline">Envíos Entregados</span>
            <span className="xs:hidden">Entregados</span>
            <span className="ml-2 px-2 py-1 rounded-full text-xs font-bold" style={{
              background: 'rgba(34, 197, 94, 0.3)',
              color: '#22c55e'
            }}>
              {enviosEntregados}
            </span>
          </h2>
        </div>

        {/* Desktop Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr style={{ background: 'rgba(0, 0, 0, 0.4)', borderBottom: '1px solid rgba(34, 197, 94, 0.3)' }}>
                <th className="px-4 lg:px-6 py-3 text-left font-bold text-xs sm:text-sm" style={{ color: '#22c55e' }}>Conductor</th>
                <th className="px-4 lg:px-6 py-3 text-left font-bold text-xs sm:text-sm" style={{ color: '#22c55e' }}>Vehículo</th>
                <th className="px-4 lg:px-6 py-3 text-left font-bold text-xs sm:text-sm" style={{ color: '#22c55e' }}>Placa</th>
                <th className="px-4 lg:px-6 py-3 text-left font-bold text-xs sm:text-sm" style={{ color: '#22c55e' }}>Cliente</th>
                <th className="px-4 lg:px-6 py-3 text-left font-bold text-xs sm:text-sm" style={{ color: '#22c55e' }}>Destino</th>
                <th className="px-4 lg:px-6 py-3 text-left font-bold text-xs sm:text-sm" style={{ color: '#22c55e' }}>Fecha/Hora</th>
                <th className="px-4 lg:px-6 py-3 text-center font-bold text-xs sm:text-sm" style={{ color: '#22c55e' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {envios.filter(e => e.estado === 'Entregado').map((envio) => {
                const pedido = getPedidoByEnvio(envio.pedidoId);
                return (
                  <tr 
                    key={envio.id}
                    className="border-b transition-colors hover:bg-white/5"
                    style={{ borderColor: 'rgba(255, 255, 255, 0.05)' }}
                  >
                    <td className="px-4 lg:px-6 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center" style={{
                          background: 'linear-gradient(135deg, #22c55e, #16a34a)'
                        }}>
                          <User className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                        </div>
                        <span className="text-white font-medium text-sm truncate">{envio.conductor}</span>
                      </div>
                    </td>
                    <td className="px-4 lg:px-6 py-3">
                      <div className="flex items-center gap-1 sm:gap-2">
                        <Car className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400 flex-shrink-0" />
                        <span className="text-white text-sm truncate">{envio.vehiculo}</span>
                      </div>
                    </td>
                    <td className="px-4 lg:px-6 py-3">
                      <span className="px-2 py-1 rounded-lg text-xs font-bold" style={{
                        background: 'rgba(255, 255, 255, 0.1)',
                        color: '#ccaa00',
                        border: '1px solid rgba(204, 170, 0, 0.3)'
                      }}>
                        {envio.placa}
                      </span>
                    </td>
                    <td className="px-4 lg:px-6 py-3">
                      <span className="text-white font-medium text-sm truncate">{pedido?.cliente || 'N/A'}</span>
                    </td>
                    <td className="px-4 lg:px-6 py-3">
                      <div className="flex items-start gap-1 sm:gap-2">
                        <MapPin className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                        <span className="text-gray-300 text-xs truncate">{envio.destino}</span>
                      </div>
                    </td>
                    <td className="px-4 lg:px-6 py-3">
                      <div className="text-xs sm:text-sm">
                        <p className="text-white">{envio.fechaEnvio}</p>
                        <p className="text-gray-400">{envio.horaEnvio}</p>
                      </div>
                    </td>
                    <td className="px-4 lg:px-6 py-3">
                      <div className="flex items-center justify-center">
                        <button
                          onClick={() => handleVerInformacion(envio)}
                          className="px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg font-medium transition-all hover:scale-105 flex items-center gap-1 sm:gap-2 text-xs sm:text-sm"
                          style={{
                            background: 'linear-gradient(to right, #0d4a24, #166534, #b8941e, #ccaa00)',
                            color: '#ffffff'
                          }}
                        >
                          <Eye className="w-3 h-3 sm:w-4 sm:h-4" />
                          <span className="hidden sm:inline">Ver Info</span>
                          <span className="sm:hidden">Ver</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="md:hidden">
          {envios.filter(e => e.estado === 'Entregado').map((envio) => {
            const pedido = getPedidoByEnvio(envio.pedidoId);
            return (
              <div 
                key={envio.id}
                className="p-3 sm:p-4 border-b transition-colors hover:bg-white/5"
                style={{ borderColor: 'rgba(255, 255, 255, 0.05)' }}
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{
                        background: 'linear-gradient(135deg, #22c55e, #16a34a)'
                      }}>
                        <User className="w-3 h-3 text-white" />
                      </div>
                      <div>
                        <p className="text-white font-medium text-sm">{envio.conductor}</p>
                        <div className="flex items-center gap-2">
                          <Car className="w-3 h-3 text-gray-400" />
                          <p className="text-gray-300 text-xs">{envio.vehiculo}</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="px-2 py-1 rounded-lg text-xs font-bold" style={{
                        background: 'rgba(255, 255, 255, 0.1)',
                        color: '#ccaa00',
                        border: '1px solid rgba(204, 170, 0, 0.3)'
                      }}>
                        {envio.placa}
                      </span>
                      <span className="text-white text-xs bg-green-500/20 px-2 py-1 rounded-full">
                        Entregado
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleVerInformacion(envio)}
                    className="px-3 py-1.5 rounded-lg font-medium transition-all hover:scale-105 flex items-center gap-1 text-xs"
                    style={{
                      background: 'linear-gradient(to right, #0d4a24, #166534, #b8941e, #ccaa00)',
                      color: '#ffffff'
                    }}
                  >
                    <Eye className="w-3 h-3" />
                    Ver
                  </button>
                </div>
                
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <p className="text-gray-400 mb-1">Cliente</p>
                    <p className="text-white truncate">{pedido?.cliente || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 mb-1">Fecha/Hora</p>
                    <div>
                      <p className="text-white">{envio.fechaEnvio}</p>
                      <p className="text-gray-400">{envio.horaEnvio}</p>
                    </div>
                  </div>
                  <div className="col-span-2">
                    <p className="text-gray-400 mb-1">Destino</p>
                    <div className="flex items-start gap-1">
                      <MapPin className="w-3 h-3 text-gray-400 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-300 text-xs">{envio.destino}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {enviosEntregados === 0 && (
          <div className="text-center py-8 sm:py-12">
            <CheckCircle className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4" style={{ color: '#22c55e', opacity: 0.3 }} />
            <p className="text-gray-400 text-sm sm:text-base">No hay envíos entregados</p>
          </div>
        )}
      </div>

      {/* Modal de Información del Pedido */}
      {isModalOpen && selectedEnvio && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4" style={{ background: 'rgba(0, 0, 0, 0.85)' }}>
          <div 
            className="backdrop-blur-xl rounded-xl sm:rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto mx-2"
            style={{
              background: 'rgba(0, 0, 0, 0.6)',
              border: '1px solid rgba(204, 170, 0, 0.3)',
              boxShadow: '0 20px 40px -12px rgba(0, 0, 0, 0.5)'
            }}
          >
            {(() => {
              const pedido = getPedidoByEnvio(selectedEnvio.pedidoId);
              const estadoEnvio = getEstadoStyle(selectedEnvio.estado);

              return (
                <>
                  {/* Header del Modal */}
                  <div className="sticky top-0 px-4 sm:px-6 py-3 sm:py-4 border-b" style={{ 
                    background: 'rgba(0, 0, 0, 0.8)',
                    borderColor: 'rgba(204, 170, 0, 0.3)' 
                  }}>
                    <div className="flex items-center justify-between">
                      <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
                        <Package className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" style={{ color: '#ccaa00' }} />
                        <span className="hidden xs:inline">Información del Pedido</span>
                        <span className="xs:hidden">Info Pedido</span>
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
                    {/* Estado del Envío */}
                    <div className="flex items-center justify-between p-3 sm:p-4 rounded-xl" style={{
                      background: estadoEnvio.bg,
                      border: `1px solid ${estadoEnvio.border}`
                    }}>
                      <div className="flex items-center gap-2 sm:gap-3">
                        {selectedEnvio.estado === 'En Curso' ? (
                          <Clock className="w-5 h-5 sm:w-6 sm:h-6" style={{ color: estadoEnvio.color }} />
                        ) : (
                          <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6" style={{ color: estadoEnvio.color }} />
                        )}
                        <span className="text-base sm:text-lg md:text-xl font-bold" style={{ color: estadoEnvio.color }}>
                          {selectedEnvio.estado}
                        </span>
                      </div>
                    </div>

                    {/* Información del Envío */}
                    <div className="backdrop-blur-xl rounded-xl p-3 sm:p-4 md:p-6" style={{
                      background: 'rgba(0, 0, 0, 0.3)',
                      border: '1px solid rgba(204, 170, 0, 0.3)'
                    }}>
                      <h3 className="text-base sm:text-lg font-bold mb-3 sm:mb-4" style={{ color: '#ccaa00' }}>Datos del Envío</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                        <div>
                          <p className="text-xs sm:text-sm text-gray-400 mb-1">Conductor</p>
                          <div className="flex items-center gap-1 sm:gap-2">
                            <User className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: '#ccaa00' }} />
                            <p className="text-white font-medium text-sm sm:text-base">{selectedEnvio.conductor}</p>
                          </div>
                        </div>
                        <div>
                          <p className="text-xs sm:text-sm text-gray-400 mb-1">Vehículo</p>
                          <div className="flex items-center gap-1 sm:gap-2">
                            <Car className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: '#ccaa00' }} />
                            <p className="text-white font-medium text-sm sm:text-base">{selectedEnvio.vehiculo} - {selectedEnvio.placa}</p>
                          </div>
                        </div>
                        <div>
                          <p className="text-xs sm:text-sm text-gray-400 mb-1">Fecha/Hora</p>
                          <div className="flex items-center gap-1 sm:gap-2">
                            <Calendar className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: '#ccaa00' }} />
                            <p className="text-white font-medium text-sm sm:text-base">{selectedEnvio.fechaEnvio} - {selectedEnvio.horaEnvio}</p>
                          </div>
                        </div>
                        <div>
                          <p className="text-xs sm:text-sm text-gray-400 mb-1">Destino</p>
                          <div className="flex items-center gap-1 sm:gap-2">
                            <MapPin className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: '#ccaa00' }} />
                            <p className="text-white font-medium text-sm sm:text-base">{selectedEnvio.destino}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Información del Pedido */}
                    {pedido && (
                      <>
                        <div className="backdrop-blur-xl rounded-xl p-3 sm:p-4 md:p-6" style={{
                          background: 'rgba(0, 0, 0, 0.3)',
                          border: '1px solid rgba(34, 197, 94, 0.3)'
                        }}>
                          <h3 className="text-base sm:text-lg font-bold mb-3 sm:mb-4" style={{ color: '#22c55e' }}>Información del Pedido</h3>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                            <div>
                              <p className="text-xs sm:text-sm text-gray-400 mb-1">Cliente</p>
                              <p className="text-white font-bold text-sm sm:text-base md:text-lg">{pedido.cliente}</p>
                            </div>
                            <div>
                              <p className="text-xs sm:text-sm text-gray-400 mb-1">Empleado</p>
                              <p className="text-white font-medium text-sm sm:text-base">{pedido.empleado}</p>
                            </div>
                            <div>
                              <p className="text-xs sm:text-sm text-gray-400 mb-1">Fecha/Hora</p>
                              <p className="text-white font-medium text-sm sm:text-base">{pedido.fecha} - {pedido.hora}</p>
                            </div>
                            <div>
                              <p className="text-xs sm:text-sm text-gray-400 mb-1">Estado</p>
                              <span className="px-2 py-1 rounded-full text-xs sm:text-sm font-medium" style={{
                                background: 'rgba(34, 197, 94, 0.2)',
                                color: '#22c55e',
                                border: '1px solid rgba(34, 197, 94, 0.3)'
                              }}>
                                {pedido.estado}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Detalles del Producto */}
                        <div className="backdrop-blur-xl rounded-xl p-3 sm:p-4 md:p-6" style={{
                          background: 'rgba(0, 0, 0, 0.3)',
                          border: '1px solid rgba(59, 130, 246, 0.3)'
                        }}>
                          <h3 className="text-base sm:text-lg font-bold mb-3 sm:mb-4" style={{ color: '#3b82f6' }}>Detalles del Producto</h3>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                            <div>
                              <p className="text-xs sm:text-sm text-gray-400 mb-1">Tipo de Ave</p>
                              <div className="flex items-center gap-1 sm:gap-2">
                                <Bird className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: '#3b82f6' }} />
                                <p className="text-white font-bold text-sm sm:text-base">{pedido.tipoAve}</p>
                              </div>
                            </div>
                            <div>
                              <p className="text-xs sm:text-sm text-gray-400 mb-1">Presentación</p>
                              <p className="text-white font-bold text-sm sm:text-base">{pedido.presentacion}</p>
                            </div>
                            <div>
                              <p className="text-xs sm:text-sm text-gray-400 mb-1">Cantidad</p>
                              <p className="text-white font-bold text-base sm:text-lg md:text-xl">{pedido.cantidad} <span className="text-xs sm:text-sm text-gray-400">aves</span></p>
                            </div>
                          </div>
                        </div>

                        {/* Pesos y Merma */}
                        <div className="backdrop-blur-xl rounded-xl p-3 sm:p-4 md:p-6" style={{
                          background: 'rgba(0, 0, 0, 0.3)',
                          border: '1px solid rgba(251, 146, 60, 0.3)'
                        }}>
                          <h3 className="text-base sm:text-lg font-bold mb-3 sm:mb-4" style={{ color: '#fb923c' }}>Pesos y Merma</h3>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                            <div>
                              <p className="text-xs sm:text-sm text-gray-400 mb-1">Contenedor</p>
                              <p className="text-white font-medium text-sm sm:text-base">{pedido.contenedor}</p>
                              <p className="text-xs sm:text-sm text-gray-400">Peso: {pedido.pesoContenedor} kg</p>
                            </div>
                            <div>
                              <p className="text-xs sm:text-sm text-gray-400 mb-1">Peso Total</p>
                              <div className="flex items-center gap-1 sm:gap-2">
                                <Weight className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: '#22c55e' }} />
                                <p className="text-white font-bold text-base sm:text-lg md:text-xl">{pedido.pesoTotalPedido.toFixed(2)} <span className="text-xs sm:text-sm">kg</span></p>
                              </div>
                            </div>
                            <div>
                              <p className="text-xs sm:text-sm text-gray-400 mb-1">Merma Unitaria</p>
                              <p className="text-white font-medium text-sm sm:text-base">{pedido.mermaUnitaria} kg/ave</p>
                            </div>
                            <div>
                              <p className="text-xs sm:text-sm text-gray-400 mb-1">Merma Total</p>
                              <p className="font-bold text-base sm:text-lg md:text-xl" style={{ color: '#fb923c' }}>{pedido.mermaTotal.toFixed(2)} kg</p>
                            </div>
                          </div>
                        </div>

                        {/* Confirmación de Stock */}
                        {pedido.autoConfirmado && (
                          <div className="flex items-center gap-2 p-3 sm:p-4 rounded-xl" style={{
                            background: 'rgba(34, 197, 94, 0.1)',
                            border: '1px solid rgba(34, 197, 94, 0.3)'
                          }}>
                            <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: '#22c55e' }} />
                            <span className="text-white font-medium text-sm sm:text-base">Stock confirmado automáticamente</span>
                          </div>
                        )}
                      </>
                    )}

                    {!pedido && (
                      <div className="text-center py-6 sm:py-8">
                        <Package className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 text-gray-600" />
                        <p className="text-gray-400 text-sm sm:text-base">No se encontró información del pedido</p>
                      </div>
                    )}
                  </div>

                  {/* Footer del Modal */}
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
                </>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
}