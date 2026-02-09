import { useState } from 'react';
import { ClipboardCheck, Scale, RotateCcw, PlusCircle, Eye, X, AlertTriangle, CheckCircle, TrendingDown, TrendingUp, Package, User, Calendar, MapPin, Bird, Weight, Camera, Image as ImageIcon } from 'lucide-react';

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

interface Repesaje {
  pesoOriginal: number;
  pesoFinal: number;
  diferencia: number;
  observaciones: string;
  fotos: string[];
}

interface Devolucion {
  cantidad: number;
  motivo: string;
  pesoDevuelto: number;
  fotos: string[];
}

interface Adicion {
  tipoAve: string;
  cantidad: number;
  presentacion: string;
  pesoAdicional: number;
  observaciones: string;
  clienteOrigen: string;
  cantidadOriginalDevuelta: number;
  fotos: string[];
}

interface ControlDespacho {
  id: string;
  pedidoId: string;
  fechaControl: string;
  horaControl: string;
  conductor: string;
  destino: string;
  repesaje?: Repesaje;
  devoluciones: Devolucion[];
  adiciones: Adicion[];
  estadoControl: 'Conforme' | 'Con Observaciones' | 'Con Diferencias';
  responsableControl: string;
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
    fecha: '2025-02-01',
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
    fecha: '2025-02-01',
    hora: '11:30',
    estado: 'Completado',
    autoConfirmado: true
  }
];

export function Control() {
  const [controles] = useState<ControlDespacho[]>([
    {
      id: '1',
      pedidoId: '1',
      fechaControl: '2025-02-02',
      horaControl: '11:30',
      conductor: 'Roberto Sánchez',
      destino: 'Av. Principal 123, Lima',
      repesaje: {
        pesoOriginal: 92.5,
        pesoFinal: 91.8,
        diferencia: -0.7,
        observaciones: 'Diferencia dentro del rango aceptable',
        fotos: ['https://example.com/repesaje1.jpg']
      },
      devoluciones: [],
      adiciones: [],
      estadoControl: 'Conforme',
      responsableControl: 'Luis Hernández'
    },
    {
      id: '2',
      pedidoId: '2',
      fechaControl: '2025-02-02',
      horaControl: '13:45',
      conductor: 'Miguel Ángel Torres',
      destino: 'Jr. Los Olivos 456, Trujillo',
      repesaje: {
        pesoOriginal: 183.5,
        pesoFinal: 174.5,
        diferencia: -9.0,
        observaciones: 'Diferencia por devolución de 5 jabas que no cumplían especificaciones',
        fotos: ['https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=400', 'https://images.unsplash.com/photo-1590856029826-c7a73142bbf1?w=400']
      },
      devoluciones: [
        {
          cantidad: 5,
          motivo: 'Cliente detectó que 5 jabas no cumplen especificaciones de peso requerido',
          pesoDevuelto: 9.0,
          fotos: ['https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?w=400', 'https://images.unsplash.com/photo-1598257006458-087169a1f08d?w=400']
        }
      ],
      adiciones: [],
      estadoControl: 'Con Observaciones',
      responsableControl: 'Pedro Castro'
    },
    {
      id: '3',
      pedidoId: '3',
      fechaControl: '2025-02-02',
      horaControl: '16:20',
      conductor: 'Miguel Ángel Torres',
      destino: 'Av. Central 789, Lima',
      repesaje: {
        pesoOriginal: 62.0,
        pesoFinal: 65.3,
        diferencia: 3.3,
        observaciones: 'Peso aumentó por adición de producto devuelto previamente',
        fotos: ['https://images.unsplash.com/photo-1604242692760-0bd4a9c2e7e3?w=400']
      },
      devoluciones: [],
      adiciones: [
        {
          tipoAve: 'Pollo',
          cantidad: 3,
          presentacion: 'Pelado',
          pesoAdicional: 5.4,
          observaciones: 'Cliente aceptó 3 de las 5 jabas devueltas por Pollería Don José',
          clienteOrigen: 'Pollería Don José',
          cantidadOriginalDevuelta: 5,
          fotos: ['https://images.unsplash.com/photo-1587593810167-a84920ea0781?w=400', 'https://images.unsplash.com/photo-1612892483236-52d32a0e0ac1?w=400']
        }
      ],
      estadoControl: 'Conforme',
      responsableControl: 'Luis Hernández'
    },
    {
      id: '4',
      pedidoId: '4',
      fechaControl: '2025-02-01',
      horaControl: '10:15',
      conductor: 'Luis Fernández',
      destino: 'Jr. Comercio 321, Chiclayo',
      repesaje: {
        pesoOriginal: 138.5,
        pesoFinal: 138.5,
        diferencia: 0,
        observaciones: 'Peso exacto, sin diferencias',
        fotos: ['https://images.unsplash.com/photo-1611348586804-61bf6c080437?w=400']
      },
      devoluciones: [],
      adiciones: [],
      estadoControl: 'Conforme',
      responsableControl: 'Pedro Castro'
    }
  ]);

  const [selectedControl, setSelectedControl] = useState<ControlDespacho | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const getPedidoById = (pedidoId: string): Pedido | undefined => {
    return pedidosEjemplo.find(p => p.id === pedidoId);
  };

  const handleVerDetalle = (control: ControlDespacho) => {
    setSelectedControl(control);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedControl(null);
  };

  // Calcular estadísticas
  const totalControles = controles.length;
  const totalRepesajes = controles.filter(c => c.repesaje).length;
  const totalDevoluciones = controles.reduce((acc, c) => acc + c.devoluciones.length, 0);
  const totalAdiciones = controles.reduce((acc, c) => acc + c.adiciones.length, 0);
  
  const controlesConformes = controles.filter(c => c.estadoControl === 'Conforme').length;
  const controlesConObservaciones = controles.filter(c => c.estadoControl === 'Con Observaciones').length;
  const controlesConDiferencias = controles.filter(c => c.estadoControl === 'Con Diferencias').length;

  const pesoTotalDevoluciones = controles.reduce((acc, c) => 
    acc + c.devoluciones.reduce((sum, d) => sum + d.pesoDevuelto, 0), 0
  );
  const pesoTotalAdiciones = controles.reduce((acc, c) => 
    acc + c.adiciones.reduce((sum, a) => sum + a.pesoAdicional, 0), 0
  );

  const getEstadoStyle = (estado: string) => {
    switch (estado) {
      case 'Conforme':
        return { bg: 'rgba(34, 197, 94, 0.2)', color: '#22c55e', border: 'rgba(34, 197, 94, 0.3)' };
      case 'Con Observaciones':
        return { bg: 'rgba(251, 146, 60, 0.2)', color: '#fb923c', border: 'rgba(251, 146, 60, 0.3)' };
      case 'Con Diferencias':
        return { bg: 'rgba(239, 68, 68, 0.2)', color: '#ef4444', border: 'rgba(239, 68, 68, 0.3)' };
      default:
        return { bg: 'rgba(255, 255, 255, 0.1)', color: '#ffffff', border: 'rgba(255, 255, 255, 0.2)' };
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6 p-2 sm:p-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-white mb-1 sm:mb-2">Control de Despacho</h1>
          <p className="text-xs sm:text-sm text-gray-400">Visualización de repesajes, devoluciones y adiciones</p>
        </div>
      </div>

      {/* Dashboard de Métricas Principales */}
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3 md:gap-4">
        <div className="backdrop-blur-xl rounded-xl p-3 sm:p-4 md:p-6" style={{
          background: 'rgba(0, 0, 0, 0.3)',
          border: '1px solid rgba(255, 255, 255, 0.2)'
        }}>
          <div className="flex items-center justify-between mb-2 sm:mb-3">
            <p className="text-xs sm:text-sm text-gray-400 font-medium">Total Controles</p>
            <ClipboardCheck className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
          </div>
          <p className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-white">{totalControles}</p>
          <p className="text-xs sm:text-sm text-gray-400 mt-1">Registrados</p>
        </div>

        <div className="backdrop-blur-xl rounded-xl p-3 sm:p-4 md:p-6" style={{
          background: 'rgba(0, 0, 0, 0.3)',
          border: '1px solid rgba(59, 130, 246, 0.3)'
        }}>
          <div className="flex items-center justify-between mb-2 sm:mb-3">
            <p className="text-xs sm:text-sm text-gray-400 font-medium">Repesajes</p>
            <Scale className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: '#3b82f6' }} />
          </div>
          <p className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold" style={{ color: '#3b82f6' }}>{totalRepesajes}</p>
          <p className="text-xs sm:text-sm" style={{ color: '#3b82f6' }}>Realizados</p>
        </div>

        <div className="backdrop-blur-xl rounded-xl p-3 sm:p-4 md:p-6" style={{
          background: 'rgba(0, 0, 0, 0.3)',
          border: '1px solid rgba(239, 68, 68, 0.3)'
        }}>
          <div className="flex items-center justify-between mb-2 sm:mb-3">
            <p className="text-xs sm:text-sm text-gray-400 font-medium">Devoluciones</p>
            <RotateCcw className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: '#ef4444' }} />
          </div>
          <p className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold" style={{ color: '#ef4444' }}>{totalDevoluciones}</p>
          <p className="text-xs sm:text-sm" style={{ color: '#ef4444' }}>{pesoTotalDevoluciones.toFixed(2)} kg</p>
        </div>

        <div className="backdrop-blur-xl rounded-xl p-3 sm:p-4 md:p-6" style={{
          background: 'rgba(0, 0, 0, 0.3)',
          border: '1px solid rgba(34, 197, 94, 0.3)'
        }}>
          <div className="flex items-center justify-between mb-2 sm:mb-3">
            <p className="text-xs sm:text-sm text-gray-400 font-medium">Adiciones</p>
            <PlusCircle className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: '#22c55e' }} />
          </div>
          <p className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold" style={{ color: '#22c55e' }}>{totalAdiciones}</p>
          <p className="text-xs sm:text-sm" style={{ color: '#22c55e' }}>{pesoTotalAdiciones.toFixed(2)} kg</p>
        </div>
      </div>

      {/* Métricas de Estado */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3 md:gap-4">
        <div className="backdrop-blur-xl rounded-xl p-3 sm:p-4 md:p-6" style={{
          background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.2), rgba(0, 0, 0, 0.3))',
          border: '1px solid rgba(34, 197, 94, 0.3)'
        }}>
          <div className="flex items-center justify-between mb-2 sm:mb-3">
            <p className="text-xs sm:text-sm text-gray-300 font-medium">Conformes</p>
            <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: '#22c55e' }} />
          </div>
          <p className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold" style={{ color: '#22c55e' }}>{controlesConformes}</p>
          <p className="text-xs text-gray-400 mt-1">Sin observaciones</p>
        </div>

        <div className="backdrop-blur-xl rounded-xl p-3 sm:p-4 md:p-6" style={{
          background: 'linear-gradient(135deg, rgba(251, 146, 60, 0.2), rgba(0, 0, 0, 0.3))',
          border: '1px solid rgba(251, 146, 60, 0.3)'
        }}>
          <div className="flex items-center justify-between mb-2 sm:mb-3">
            <p className="text-xs sm:text-sm text-gray-300 font-medium">Observaciones</p>
            <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: '#fb923c' }} />
          </div>
          <p className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold" style={{ color: '#fb923c' }}>{controlesConObservaciones}</p>
          <p className="text-xs text-gray-400 mt-1">Requieren atención</p>
        </div>

        <div className="backdrop-blur-xl rounded-xl p-3 sm:p-4 md:p-6" style={{
          background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.2), rgba(0, 0, 0, 0.3))',
          border: '1px solid rgba(239, 68, 68, 0.3)'
        }}>
          <div className="flex items-center justify-between mb-2 sm:mb-3">
            <p className="text-xs sm:text-sm text-gray-300 font-medium">Diferencias</p>
            <TrendingDown className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: '#ef4444' }} />
          </div>
          <p className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold" style={{ color: '#ef4444' }}>{controlesConDiferencias}</p>
          <p className="text-xs text-gray-400 mt-1">Pesos no coinciden</p>
        </div>
      </div>

      {/* Tabla de Controles */}
      <div className="backdrop-blur-xl rounded-xl overflow-hidden" style={{
        background: 'rgba(0, 0, 0, 0.3)',
        border: '1px solid rgba(204, 170, 0, 0.3)'
      }}>
        <div className="px-4 sm:px-6 py-3 sm:py-4 border-b" style={{ 
          background: 'rgba(0, 0, 0, 0.4)',
          borderColor: 'rgba(204, 170, 0, 0.3)' 
        }}>
          <h2 className="text-base sm:text-lg md:text-xl font-bold text-white flex items-center gap-2">
            <ClipboardCheck className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" style={{ color: '#ccaa00' }} />
            <span className="hidden xs:inline">Registro de Controles de Despacho</span>
            <span className="xs:hidden">Controles de Despacho</span>
          </h2>
        </div>

        {/* Desktop Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr style={{ background: 'rgba(0, 0, 0, 0.4)', borderBottom: '1px solid rgba(204, 170, 0, 0.3)' }}>
                <th className="px-4 lg:px-6 py-3 text-left font-bold text-xs sm:text-sm" style={{ color: '#ccaa00' }}>Cliente</th>
                <th className="px-4 lg:px-6 py-3 text-left font-bold text-xs sm:text-sm" style={{ color: '#ccaa00' }}>Conductor</th>
                <th className="px-4 lg:px-6 py-3 text-left font-bold text-xs sm:text-sm" style={{ color: '#ccaa00' }}>Fecha/Hora</th>
                <th className="px-4 lg:px-6 py-3 text-left font-bold text-xs sm:text-sm" style={{ color: '#ccaa00' }}>Repesaje</th>
                <th className="px-4 lg:px-6 py-3 text-left font-bold text-xs sm:text-sm" style={{ color: '#ccaa00' }}>Devoluciones</th>
                <th className="px-4 lg:px-6 py-3 text-left font-bold text-xs sm:text-sm" style={{ color: '#ccaa00' }}>Adiciones</th>
                <th className="px-4 lg:px-6 py-3 text-left font-bold text-xs sm:text-sm" style={{ color: '#ccaa00' }}>Estado</th>
                <th className="px-4 lg:px-6 py-3 text-center font-bold text-xs sm:text-sm" style={{ color: '#ccaa00' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {controles.map((control) => {
                const pedido = getPedidoById(control.pedidoId);
                const estadoStyle = getEstadoStyle(control.estadoControl);
                
                return (
                  <tr 
                    key={control.id}
                    className="border-b transition-colors hover:bg-white/5"
                    style={{ borderColor: 'rgba(255, 255, 255, 0.05)' }}
                  >
                    <td className="px-4 lg:px-6 py-3">
                      <span className="text-white font-medium text-sm">{pedido?.cliente || 'N/A'}</span>
                    </td>
                    <td className="px-4 lg:px-6 py-3">
                      <div className="flex items-center gap-1 sm:gap-2">
                        <User className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400 flex-shrink-0" />
                        <span className="text-white text-sm truncate">{control.conductor}</span>
                      </div>
                    </td>
                    <td className="px-4 lg:px-6 py-3">
                      <div className="text-xs sm:text-sm">
                        <p className="text-white">{control.fechaControl}</p>
                        <p className="text-gray-400">{control.horaControl}</p>
                      </div>
                    </td>
                    <td className="px-4 lg:px-6 py-3">
                      {control.repesaje ? (
                        <div className="text-xs sm:text-sm">
                          <p className="text-white font-medium">
                            {control.repesaje.pesoOriginal} → {control.repesaje.pesoFinal} kg
                          </p>
                          <div className="flex items-center gap-1 mt-1">
                            {control.repesaje.diferencia < 0 ? (
                              <>
                                <TrendingDown className="w-3 h-3" style={{ color: '#ef4444' }} />
                                <span className="text-xs" style={{ color: '#ef4444' }}>
                                  {control.repesaje.diferencia.toFixed(2)} kg
                                </span>
                              </>
                            ) : control.repesaje.diferencia > 0 ? (
                              <>
                                <TrendingUp className="w-3 h-3" style={{ color: '#22c55e' }} />
                                <span className="text-xs" style={{ color: '#22c55e' }}>
                                  +{control.repesaje.diferencia.toFixed(2)} kg
                                </span>
                              </>
                            ) : (
                              <span className="text-xs text-gray-400">Sin diferencia</span>
                            )}
                          </div>
                        </div>
                      ) : (
                        <span className="text-gray-400 text-xs sm:text-sm">-</span>
                      )}
                    </td>
                    <td className="px-4 lg:px-6 py-3">
                      {control.devoluciones.length > 0 ? (
                        <div className="text-xs sm:text-sm">
                          <p className="font-bold" style={{ color: '#ef4444' }}>
                            {control.devoluciones.length}
                          </p>
                          <p className="text-gray-400 text-xs">
                            {control.devoluciones.reduce((acc, d) => acc + d.pesoDevuelto, 0).toFixed(2)} kg
                          </p>
                        </div>
                      ) : (
                        <span className="text-gray-400 text-xs sm:text-sm">-</span>
                      )}
                    </td>
                    <td className="px-4 lg:px-6 py-3">
                      {control.adiciones.length > 0 ? (
                        <div className="text-xs sm:text-sm">
                          <p className="font-bold" style={{ color: '#22c55e' }}>
                            {control.adiciones.length}
                          </p>
                          <p className="text-gray-400 text-xs">
                            {control.adiciones.reduce((acc, a) => acc + a.pesoAdicional, 0).toFixed(2)} kg
                          </p>
                        </div>
                      ) : (
                        <span className="text-gray-400 text-xs sm:text-sm">-</span>
                      )}
                    </td>
                    <td className="px-4 lg:px-6 py-3">
                      <span className="px-2 py-1 rounded-full text-xs font-bold" style={{
                        background: estadoStyle.bg,
                        color: estadoStyle.color,
                        border: `1px solid ${estadoStyle.border}`
                      }}>
                        {control.estadoControl}
                      </span>
                    </td>
                    <td className="px-4 lg:px-6 py-3">
                      <div className="flex items-center justify-center">
                        <button
                          onClick={() => handleVerDetalle(control)}
                          className="px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg font-medium transition-all hover:scale-105 flex items-center gap-1 sm:gap-2 text-xs sm:text-sm"
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
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="md:hidden">
          {controles.map((control) => {
            const pedido = getPedidoById(control.pedidoId);
            const estadoStyle = getEstadoStyle(control.estadoControl);
            
            return (
              <div 
                key={control.id}
                className="p-3 sm:p-4 border-b transition-colors hover:bg-white/5"
                style={{ borderColor: 'rgba(255, 255, 255, 0.05)' }}
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <p className="text-white font-medium text-sm">{pedido?.cliente || 'N/A'}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <User className="w-3 h-3 text-gray-400 flex-shrink-0" />
                      <p className="text-gray-300 text-xs truncate">{control.conductor}</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className="px-2 py-1 rounded-full text-xs font-bold" style={{
                      background: estadoStyle.bg,
                      color: estadoStyle.color,
                      border: `1px solid ${estadoStyle.border}`
                    }}>
                      {control.estadoControl}
                    </span>
                    <button
                      onClick={() => handleVerDetalle(control)}
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
                </div>
                
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <p className="text-gray-400 mb-1">Fecha/Hora</p>
                    <p className="text-white">{control.fechaControl}</p>
                    <p className="text-gray-400">{control.horaControl}</p>
                  </div>
                  
                  <div>
                    <p className="text-gray-400 mb-1">Repesaje</p>
                    {control.repesaje ? (
                      <div>
                        <p className="text-white font-medium">{control.repesaje.pesoFinal} kg</p>
                        <div className="flex items-center gap-1">
                          {control.repesaje.diferencia < 0 ? (
                            <span className="text-xs" style={{ color: '#ef4444' }}>
                              {control.repesaje.diferencia.toFixed(2)} kg
                            </span>
                          ) : control.repesaje.diferencia > 0 ? (
                            <span className="text-xs" style={{ color: '#22c55e' }}>
                              +{control.repesaje.diferencia.toFixed(2)} kg
                            </span>
                          ) : (
                            <span className="text-xs text-gray-400">Sin diferencia</span>
                          )}
                        </div>
                      </div>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </div>
                  
                  <div>
                    <p className="text-gray-400 mb-1">Devoluciones</p>
                    {control.devoluciones.length > 0 ? (
                      <div>
                        <p className="font-bold" style={{ color: '#ef4444' }}>{control.devoluciones.length}</p>
                        <p className="text-gray-400 text-xs">
                          {control.devoluciones.reduce((acc, d) => acc + d.pesoDevuelto, 0).toFixed(2)} kg
                        </p>
                      </div>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </div>
                  
                  <div>
                    <p className="text-gray-400 mb-1">Adiciones</p>
                    {control.adiciones.length > 0 ? (
                      <div>
                        <p className="font-bold" style={{ color: '#22c55e' }}>{control.adiciones.length}</p>
                        <p className="text-gray-400 text-xs">
                          {control.adiciones.reduce((acc, a) => acc + a.pesoAdicional, 0).toFixed(2)} kg
                        </p>
                      </div>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {controles.length === 0 && (
          <div className="text-center py-8 sm:py-12">
            <ClipboardCheck className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 text-gray-600" />
            <p className="text-gray-400 text-sm sm:text-base">No hay controles registrados</p>
          </div>
        )}
      </div>

      {/* Modal de Detalle Completo */}
      {isModalOpen && selectedControl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4" style={{ background: 'rgba(0, 0, 0, 0.85)' }}>
          <div 
            className="backdrop-blur-xl rounded-xl sm:rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto mx-2"
            style={{
              background: 'rgba(0, 0, 0, 0.6)',
              border: '1px solid rgba(204, 170, 0, 0.3)',
              boxShadow: '0 20px 40px -12px rgba(0, 0, 0, 0.5)'
            }}
          >
            {(() => {
              const pedido = getPedidoById(selectedControl.pedidoId);
              const estadoStyle = getEstadoStyle(selectedControl.estadoControl);

              return (
                <>
                  {/* Header del Modal */}
                  <div className="sticky top-0 px-4 sm:px-6 py-3 sm:py-4 border-b" style={{ 
                    background: 'rgba(0, 0, 0, 0.8)',
                    borderColor: 'rgba(204, 170, 0, 0.3)' 
                  }}>
                    <div className="flex items-center justify-between">
                      <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
                        <ClipboardCheck className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" style={{ color: '#ccaa00' }} />
                        <span className="hidden xs:inline">Detalle del Control</span>
                        <span className="xs:hidden">Control</span>
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
                    {/* Estado del Control */}
                    <div className="flex items-center justify-between p-3 sm:p-4 rounded-xl" style={{
                      background: estadoStyle.bg,
                      border: `1px solid ${estadoStyle.border}`
                    }}>
                      <div className="flex items-center gap-2 sm:gap-3">
                        {selectedControl.estadoControl === 'Conforme' ? (
                          <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6" style={{ color: estadoStyle.color }} />
                        ) : (
                          <AlertTriangle className="w-5 h-5 sm:w-6 sm:h-6" style={{ color: estadoStyle.color }} />
                        )}
                        <span className="text-base sm:text-lg md:text-xl font-bold" style={{ color: estadoStyle.color }}>
                          {selectedControl.estadoControl}
                        </span>
                      </div>
                      <div className="text-right">
                        <p className="text-xs sm:text-sm text-gray-400">Responsable</p>
                        <p className="text-white font-medium text-sm sm:text-base">{selectedControl.responsableControl}</p>
                      </div>
                    </div>

                    {/* Información del Pedido Original */}
                    {pedido && (
                      <div className="backdrop-blur-xl rounded-xl p-3 sm:p-4 md:p-6" style={{
                        background: 'rgba(0, 0, 0, 0.3)',
                        border: '1px solid rgba(59, 130, 246, 0.3)'
                      }}>
                        <h3 className="text-base sm:text-lg font-bold mb-3 sm:mb-4" style={{ color: '#3b82f6' }}>Pedido Original</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
                          <div>
                            <p className="text-xs sm:text-sm text-gray-400 mb-1">Cliente</p>
                            <p className="text-white font-bold text-sm sm:text-base">{pedido.cliente}</p>
                          </div>
                          <div>
                            <p className="text-xs sm:text-sm text-gray-400 mb-1">Tipo de Ave</p>
                            <div className="flex items-center gap-1 sm:gap-2">
                              <Bird className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: '#3b82f6' }} />
                              <p className="text-white font-medium text-sm sm:text-base">{pedido.tipoAve} - {pedido.presentacion}</p>
                            </div>
                          </div>
                          <div>
                            <p className="text-xs sm:text-sm text-gray-400 mb-1">Cantidad</p>
                            <p className="text-white font-bold text-base sm:text-lg">{pedido.cantidad} <span className="text-xs sm:text-sm text-gray-400">aves</span></p>
                          </div>
                          <div>
                            <p className="text-xs sm:text-sm text-gray-400 mb-1">Peso Total</p>
                            <div className="flex items-center gap-1 sm:gap-2">
                              <Weight className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: '#3b82f6' }} />
                              <p className="text-white font-bold text-sm sm:text-base">{pedido.pesoTotalPedido.toFixed(2)} kg</p>
                            </div>
                          </div>
                          <div>
                            <p className="text-xs sm:text-sm text-gray-400 mb-1">Fecha Pedido</p>
                            <p className="text-white font-medium text-sm sm:text-base">{pedido.fecha} - {pedido.hora}</p>
                          </div>
                          <div>
                            <p className="text-xs sm:text-sm text-gray-400 mb-1">Empleado</p>
                            <p className="text-white font-medium text-sm sm:text-base">{pedido.empleado}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Información del Control */}
                    <div className="backdrop-blur-xl rounded-xl p-3 sm:p-4 md:p-6" style={{
                      background: 'rgba(0, 0, 0, 0.3)',
                      border: '1px solid rgba(204, 170, 0, 0.3)'
                    }}>
                      <h3 className="text-base sm:text-lg font-bold mb-3 sm:mb-4" style={{ color: '#ccaa00' }}>Datos del Control</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                        <div>
                          <p className="text-xs sm:text-sm text-gray-400 mb-1">Conductor</p>
                          <div className="flex items-center gap-1 sm:gap-2">
                            <User className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: '#ccaa00' }} />
                            <p className="text-white font-medium text-sm sm:text-base">{selectedControl.conductor}</p>
                          </div>
                        </div>
                        <div>
                          <p className="text-xs sm:text-sm text-gray-400 mb-1">Fecha/Hora</p>
                          <div className="flex items-center gap-1 sm:gap-2">
                            <Calendar className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: '#ccaa00' }} />
                            <p className="text-white font-medium text-sm sm:text-base">{selectedControl.fechaControl} - {selectedControl.horaControl}</p>
                          </div>
                        </div>
                        <div className="sm:col-span-2">
                          <p className="text-xs sm:text-sm text-gray-400 mb-1">Destino</p>
                          <div className="flex items-center gap-1 sm:gap-2">
                            <MapPin className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: '#ccaa00' }} />
                            <p className="text-white font-medium text-sm sm:text-base">{selectedControl.destino}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Repesaje */}
                    {selectedControl.repesaje && (
                      <div className="backdrop-blur-xl rounded-xl p-3 sm:p-4 md:p-6" style={{
                        background: 'rgba(0, 0, 0, 0.3)',
                        border: '1px solid rgba(59, 130, 246, 0.3)'
                      }}>
                        <h3 className="text-base sm:text-lg font-bold mb-3 sm:mb-4 flex items-center gap-1 sm:gap-2" style={{ color: '#3b82f6' }}>
                          <Scale className="w-5 h-5 sm:w-6 sm:h-6" />
                          Repesaje
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                          <div>
                            <p className="text-xs sm:text-sm text-gray-400 mb-1">Peso Original</p>
                            <p className="text-white font-bold text-base sm:text-lg md:text-xl">{selectedControl.repesaje.pesoOriginal.toFixed(2)} <span className="text-xs sm:text-sm">kg</span></p>
                          </div>
                          <div>
                            <p className="text-xs sm:text-sm text-gray-400 mb-1">Peso Final</p>
                            <p className="text-white font-bold text-base sm:text-lg md:text-xl">{selectedControl.repesaje.pesoFinal.toFixed(2)} <span className="text-xs sm:text-sm">kg</span></p>
                          </div>
                          <div>
                            <p className="text-xs sm:text-sm text-gray-400 mb-1">Diferencia</p>
                            <div className="flex items-center gap-1 sm:gap-2">
                              {selectedControl.repesaje.diferencia < 0 ? (
                                <>
                                  <TrendingDown className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" style={{ color: '#ef4444' }} />
                                  <p className="font-bold text-base sm:text-lg md:text-xl" style={{ color: '#ef4444' }}>
                                    {selectedControl.repesaje.diferencia.toFixed(2)} kg
                                  </p>
                                </>
                              ) : selectedControl.repesaje.diferencia > 0 ? (
                                <>
                                  <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" style={{ color: '#22c55e' }} />
                                  <p className="font-bold text-base sm:text-lg md:text-xl" style={{ color: '#22c55e' }}>
                                    +{selectedControl.repesaje.diferencia.toFixed(2)} kg
                                  </p>
                                </>
                              ) : (
                                <p className="font-bold text-base sm:text-lg md:text-xl text-white">0.00 kg</p>
                              )}
                            </div>
                          </div>
                          <div className="sm:col-span-3">
                            <p className="text-xs sm:text-sm text-gray-400 mb-1">Observaciones</p>
                            <p className="text-white text-sm sm:text-base">{selectedControl.repesaje.observaciones}</p>
                          </div>
                          {selectedControl.repesaje.fotos.length > 0 && (
                            <div className="sm:col-span-3">
                              <p className="text-xs sm:text-sm text-gray-400 mb-1">Fotos del Repesaje</p>
                              <div className="flex flex-wrap items-center gap-2">
                                {selectedControl.repesaje.fotos.map((foto, index) => (
                                  <div key={index} className="relative w-12 h-12 sm:w-14 sm:h-14">
                                    <ImageIcon className="w-full h-full text-gray-400" />
                                    <div className="absolute top-0 left-0 w-full h-full bg-black/50 flex items-center justify-center rounded">
                                      <Camera className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Devoluciones */}
                    {selectedControl.devoluciones.length > 0 && (
                      <div className="backdrop-blur-xl rounded-xl p-3 sm:p-4 md:p-6" style={{
                        background: 'rgba(0, 0, 0, 0.3)',
                        border: '1px solid rgba(239, 68, 68, 0.3)'
                      }}>
                        <h3 className="text-base sm:text-lg font-bold mb-3 sm:mb-4 flex items-center gap-1 sm:gap-2" style={{ color: '#ef4444' }}>
                          <RotateCcw className="w-5 h-5 sm:w-6 sm:h-6" />
                          Devoluciones ({selectedControl.devoluciones.length})
                        </h3>
                        <div className="space-y-3 sm:space-y-4">
                          {selectedControl.devoluciones.map((devolucion, index) => (
                            <div key={index} className="p-3 sm:p-4 rounded-lg" style={{
                              background: 'rgba(239, 68, 68, 0.1)',
                              border: '1px solid rgba(239, 68, 68, 0.2)'
                            }}>
                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                                <div>
                                  <p className="text-xs sm:text-sm text-gray-400 mb-1">Cantidad</p>
                                  <p className="text-white font-bold text-sm sm:text-base">{devolucion.cantidad} unidades</p>
                                </div>
                                <div>
                                  <p className="text-xs sm:text-sm text-gray-400 mb-1">Peso Devuelto</p>
                                  <p className="font-bold text-sm sm:text-base" style={{ color: '#ef4444' }}>{devolucion.pesoDevuelto.toFixed(2)} kg</p>
                                </div>
                                <div className="sm:col-span-3">
                                  <p className="text-xs sm:text-sm text-gray-400 mb-1">Motivo</p>
                                  <p className="text-white text-sm sm:text-base">{devolucion.motivo}</p>
                                </div>
                                {devolucion.fotos.length > 0 && (
                                  <div className="sm:col-span-3">
                                    <p className="text-xs sm:text-sm text-gray-400 mb-1">Fotos</p>
                                    <div className="flex flex-wrap items-center gap-2">
                                      {devolucion.fotos.map((foto, index) => (
                                        <div key={index} className="relative w-12 h-12 sm:w-14 sm:h-14">
                                          <ImageIcon className="w-full h-full text-gray-400" />
                                          <div className="absolute top-0 left-0 w-full h-full bg-black/50 flex items-center justify-center rounded">
                                            <Camera className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Adiciones */}
                    {selectedControl.adiciones.length > 0 && (
                      <div className="backdrop-blur-xl rounded-xl p-3 sm:p-4 md:p-6" style={{
                        background: 'rgba(0, 0, 0, 0.3)',
                        border: '1px solid rgba(34, 197, 94, 0.3)'
                      }}>
                        <h3 className="text-base sm:text-lg font-bold mb-3 sm:mb-4 flex items-center gap-1 sm:gap-2" style={{ color: '#22c55e' }}>
                          <PlusCircle className="w-5 h-5 sm:w-6 sm:h-6" />
                          Adiciones ({selectedControl.adiciones.length})
                        </h3>
                        <div className="space-y-3 sm:space-y-4">
                          {selectedControl.adiciones.map((adicion, index) => (
                            <div key={index} className="p-3 sm:p-4 rounded-lg" style={{
                              background: 'rgba(34, 197, 94, 0.1)',
                              border: '1px solid rgba(34, 197, 94, 0.2)'
                            }}>
                              {adicion.clienteOrigen && (
                                <div className="mb-3 p-2 sm:p-3 rounded-lg" style={{
                                  background: 'rgba(251, 146, 60, 0.15)',
                                  border: '1px solid rgba(251, 146, 60, 0.3)'
                                }}>
                                  <div className="flex items-center gap-1 sm:gap-2">
                                    <RotateCcw className="w-3 h-3 sm:w-4 sm:h-4" style={{ color: '#fb923c' }} />
                                    <div>
                                      <p className="text-xs text-gray-400">Producto Devuelto por:</p>
                                      <p className="font-bold text-xs sm:text-sm" style={{ color: '#fb923c' }}>{adicion.clienteOrigen}</p>
                                    </div>
                                  </div>
                                </div>
                              )}
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                                <div>
                                  <p className="text-xs sm:text-sm text-gray-400 mb-1">Tipo de Ave</p>
                                  <p className="text-white font-bold text-sm sm:text-base">{adicion.tipoAve} - {adicion.presentacion}</p>
                                </div>
                                <div>
                                  <p className="text-xs sm:text-sm text-gray-400 mb-1">Cantidad</p>
                                  <p className="text-white font-bold text-sm sm:text-base">{adicion.cantidad} unidades</p>
                                </div>
                                <div>
                                  <p className="text-xs sm:text-sm text-gray-400 mb-1">Peso Adicional</p>
                                  <p className="font-bold text-sm sm:text-base" style={{ color: '#22c55e' }}>{adicion.pesoAdicional.toFixed(2)} kg</p>
                                </div>
                                <div className="sm:col-span-2">
                                  <p className="text-xs sm:text-sm text-gray-400 mb-1">Observaciones</p>
                                  <p className="text-white text-sm sm:text-base">{adicion.observaciones}</p>
                                </div>
                                {adicion.fotos.length > 0 && (
                                  <div className="sm:col-span-2">
                                    <p className="text-xs sm:text-sm text-gray-400 mb-1">Fotos</p>
                                    <div className="flex flex-wrap items-center gap-2">
                                      {adicion.fotos.map((foto, index) => (
                                        <div key={index} className="relative w-12 h-12 sm:w-14 sm:h-14">
                                          <ImageIcon className="w-full h-full text-gray-400" />
                                          <div className="absolute top-0 left-0 w-full h-full bg-black/50 flex items-center justify-center rounded">
                                            <Camera className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
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