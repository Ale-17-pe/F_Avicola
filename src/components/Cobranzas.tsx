import { useState } from 'react';
import { Users, Plus, Edit2, Trash2, Search, User, Bike, Phone, MapPin, Calendar, CheckCircle, QrCode, X } from 'lucide-react';

interface Moto {
  placa: string;
  marca: string;
  modelo: string;
  año: number;
  color: string;
}

interface TrabajadorCobranza {
  id: string;
  nombre: string;
  apellidos: string;
  dni: string;
  telefono: string;
  direccion: string;
  fechaContratacion: string;
  moto: Moto;
  estado: 'Activo' | 'Inactivo';
}

interface CodigoQR {
  id: string;
  metodo: 'Yape' | 'Plin';
  imagenQR: string;
  nombreTitular: string;
  telefono?: string;
  fechaRegistro: string;
  activo: boolean;
}

export function Cobranzas() {
  const [trabajadores, setTrabajadores] = useState<TrabajadorCobranza[]>([
    {
      id: '1',
      nombre: 'Carlos',
      apellidos: 'Méndez Vargas',
      dni: '12345678',
      telefono: '987654321',
      direccion: 'Av. Los Pinos 123, Lima',
      fechaContratacion: '2024-01-15',
      moto: {
        placa: 'ABC-123',
        marca: 'Honda',
        modelo: 'Wave 110',
        año: 2022,
        color: 'Rojo'
      },
      estado: 'Activo'
    },
    {
      id: '2',
      nombre: 'María',
      apellidos: 'Torres Sánchez',
      dni: '87654321',
      telefono: '912345678',
      direccion: 'Jr. Las Flores 456, Trujillo',
      fechaContratacion: '2024-03-20',
      moto: {
        placa: 'XYZ-789',
        marca: 'Yamaha',
        modelo: 'Crypton',
        año: 2023,
        color: 'Azul'
      },
      estado: 'Activo'
    },
    {
      id: '3',
      nombre: 'Roberto',
      apellidos: 'Silva Castro',
      dni: '45678912',
      telefono: '998877665',
      direccion: 'Calle Los Robles 789, Chiclayo',
      fechaContratacion: '2023-11-10',
      moto: {
        placa: 'DEF-456',
        marca: 'Bajaj',
        modelo: 'Pulsar 125',
        año: 2021,
        color: 'Negro'
      },
      estado: 'Activo'
    }
  ]);

  const [codigosQR, setCodigosQR] = useState<CodigoQR[]>([
    {
      id: '1',
      metodo: 'Yape',
      imagenQR: 'https://images.unsplash.com/photo-1612852098516-55d01c75769a?w=400',
      nombreTitular: 'Avícola Jossy SAC',
      telefono: '987654321',
      fechaRegistro: '2024-01-10',
      activo: true
    },
    {
      id: '2',
      metodo: 'Plin',
      imagenQR: 'https://images.unsplash.com/photo-1617789278650-a1f08420a0c5?w=400',
      nombreTitular: 'Avícola Jossy SAC',
      telefono: '987654321',
      fechaRegistro: '2024-01-10',
      activo: true
    }
  ]);

  const [activeTab, setActiveTab] = useState<'trabajadores' | 'qr'>('trabajadores');
  const [searchTerm, setSearchTerm] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTrabajador, setEditingTrabajador] = useState<TrabajadorCobranza | null>(null);
  const [formData, setFormData] = useState({
    nombre: '',
    apellidos: '',
    dni: '',
    telefono: '',
    direccion: '',
    fechaContratacion: '',
    placa: '',
    marca: '',
    modelo: '',
    año: '',
    color: ''
  });

  // Estados para QR
  const [isQRFormOpen, setIsQRFormOpen] = useState(false);
  const [editingQR, setEditingQR] = useState<CodigoQR | null>(null);
  const [qrFormData, setQRFormData] = useState({
    metodo: 'Yape' as 'Yape' | 'Plin',
    imagenQR: '',
    nombreTitular: '',
    telefono: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (editingTrabajador) {
      const trabajadorActualizado: TrabajadorCobranza = {
        id: editingTrabajador.id,
        nombre: formData.nombre.trim(),
        apellidos: formData.apellidos.trim(),
        dni: formData.dni.trim(),
        telefono: formData.telefono.trim(),
        direccion: formData.direccion.trim(),
        fechaContratacion: formData.fechaContratacion,
        moto: {
          placa: formData.placa.trim().toUpperCase(),
          marca: formData.marca.trim(),
          modelo: formData.modelo.trim(),
          año: parseInt(formData.año),
          color: formData.color.trim()
        },
        estado: editingTrabajador.estado
      };
      setTrabajadores(trabajadores.map(t => t.id === editingTrabajador.id ? trabajadorActualizado : t));
      setEditingTrabajador(null);
    } else {
      const nuevoTrabajador: TrabajadorCobranza = {
        id: Date.now().toString(),
        nombre: formData.nombre.trim(),
        apellidos: formData.apellidos.trim(),
        dni: formData.dni.trim(),
        telefono: formData.telefono.trim(),
        direccion: formData.direccion.trim(),
        fechaContratacion: formData.fechaContratacion,
        moto: {
          placa: formData.placa.trim().toUpperCase(),
          marca: formData.marca.trim(),
          modelo: formData.modelo.trim(),
          año: parseInt(formData.año),
          color: formData.color.trim()
        },
        estado: 'Activo'
      };
      setTrabajadores([...trabajadores, nuevoTrabajador]);
    }

    resetForm();
  };

  const handleEditar = (trabajador: TrabajadorCobranza) => {
    setEditingTrabajador(trabajador);
    setFormData({
      nombre: trabajador.nombre,
      apellidos: trabajador.apellidos,
      dni: trabajador.dni,
      telefono: trabajador.telefono,
      direccion: trabajador.direccion,
      fechaContratacion: trabajador.fechaContratacion,
      placa: trabajador.moto.placa,
      marca: trabajador.moto.marca,
      modelo: trabajador.moto.modelo,
      año: trabajador.moto.año.toString(),
      color: trabajador.moto.color
    });
    setIsFormOpen(true);
  };

  const handleEliminar = (id: string) => {
    if (confirm('¿Está seguro de eliminar este trabajador de cobranza?')) {
      setTrabajadores(trabajadores.filter(t => t.id !== id));
    }
  };

  const resetForm = () => {
    setFormData({
      nombre: '',
      apellidos: '',
      dni: '',
      telefono: '',
      direccion: '',
      fechaContratacion: '',
      placa: '',
      marca: '',
      modelo: '',
      año: '',
      color: ''
    });
    setIsFormOpen(false);
    setEditingTrabajador(null);
  };

  // Funciones para QR
  const handleQRSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (editingQR) {
      const qrActualizado: CodigoQR = {
        ...editingQR,
        metodo: qrFormData.metodo,
        imagenQR: qrFormData.imagenQR,
        nombreTitular: qrFormData.nombreTitular.trim(),
        telefono: qrFormData.telefono.trim()
      };
      setCodigosQR(codigosQR.map(q => q.id === editingQR.id ? qrActualizado : q));
    } else {
      const nuevoQR: CodigoQR = {
        id: Date.now().toString(),
        metodo: qrFormData.metodo,
        imagenQR: qrFormData.imagenQR,
        nombreTitular: qrFormData.nombreTitular.trim(),
        telefono: qrFormData.telefono.trim(),
        fechaRegistro: new Date().toISOString().split('T')[0],
        activo: true
      };
      setCodigosQR([...codigosQR, nuevoQR]);
    }

    resetQRForm();
  };

  const handleEditarQR = (qr: CodigoQR) => {
    setEditingQR(qr);
    setQRFormData({
      metodo: qr.metodo,
      imagenQR: qr.imagenQR,
      nombreTitular: qr.nombreTitular,
      telefono: qr.telefono || ''
    });
    setIsQRFormOpen(true);
  };

  const handleEliminarQR = (id: string) => {
    if (confirm('¿Está seguro de eliminar este código QR?')) {
      setCodigosQR(codigosQR.filter(q => q.id !== id));
    }
  };

  const handleToggleActivoQR = (id: string) => {
    setCodigosQR(codigosQR.map(q => 
      q.id === id ? { ...q, activo: !q.activo } : q
    ));
  };

  const resetQRForm = () => {
    setQRFormData({
      metodo: 'Yape',
      imagenQR: '',
      nombreTitular: '',
      telefono: ''
    });
    setIsQRFormOpen(false);
    setEditingQR(null);
  };

  // Filtrar trabajadores
  const trabajadoresFiltrados = trabajadores.filter(t =>
    t.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.apellidos.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.dni.includes(searchTerm) ||
    t.moto.placa.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Calcular métricas
  const totalTrabajadores = trabajadores.length;
  const trabajadoresActivos = trabajadores.filter(t => t.estado === 'Activo').length;
  const trabajadoresInactivos = trabajadores.filter(t => t.estado === 'Inactivo').length;

  return (
    <div className="space-y-4 sm:space-y-6 p-2 sm:p-4">
      {/* Tabs Container */}
      <div className="relative">
        {/* Mobile Tabs (Scrollable) */}
        <div className="sm:hidden overflow-x-auto pb-2">
          <div className="flex min-w-max gap-2 px-1">
            <button
              onClick={() => setActiveTab('trabajadores')}
              className="px-4 py-2.5 rounded-lg font-bold transition-all flex items-center gap-2 whitespace-nowrap"
              style={{
                background: activeTab === 'trabajadores' 
                  ? 'linear-gradient(to right, #0d4a24, #166534, #b8941e, #ccaa00)'
                  : 'rgba(255, 255, 255, 0.1)',
                color: activeTab === 'trabajadores' ? 'white' : '#9ca3af',
                boxShadow: activeTab === 'trabajadores' ? '0 4px 15px rgba(204, 170, 0, 0.3)' : 'none',
                border: activeTab === 'trabajadores' ? 'none' : '1px solid rgba(255, 255, 255, 0.2)'
              }}
            >
              <Users className="w-4 h-4 flex-shrink-0" />
              <span className="text-sm">Trabajadores</span>
            </button>
            <button
              onClick={() => setActiveTab('qr')}
              className="px-4 py-2.5 rounded-lg font-bold transition-all flex items-center gap-2 whitespace-nowrap"
              style={{
                background: activeTab === 'qr' 
                  ? 'linear-gradient(to right, #0d4a24, #166534, #b8941e, #ccaa00)'
                  : 'rgba(255, 255, 255, 0.1)',
                color: activeTab === 'qr' ? 'white' : '#9ca3af',
                boxShadow: activeTab === 'qr' ? '0 4px 15px rgba(204, 170, 0, 0.3)' : 'none',
                border: activeTab === 'qr' ? 'none' : '1px solid rgba(255, 255, 255, 0.2)'
              }}
            >
              <QrCode className="w-4 h-4 flex-shrink-0" />
              <span className="text-sm">Códigos QR</span>
            </button>
          </div>
        </div>

        {/* Desktop Tabs */}
        <div className="hidden sm:flex border-b" style={{ borderColor: 'rgba(204, 170, 0, 0.3)' }}>
          <button
            onClick={() => setActiveTab('trabajadores')}
            className="px-4 sm:px-6 py-2 sm:py-3 font-bold transition-all flex items-center gap-1 sm:gap-2 relative group"
            style={{
              color: activeTab === 'trabajadores' ? '#ccaa00' : '#9ca3af',
              borderBottom: activeTab === 'trabajadores' ? '3px solid #ccaa00' : '3px solid transparent'
            }}
          >
            <Users className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
            <span className="text-sm sm:text-base">Trabajadores</span>
            <span 
              className="absolute bottom-0 left-0 w-full h-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
              style={{ backgroundColor: '#ccaa00' }}
            />
          </button>
          <button
            onClick={() => setActiveTab('qr')}
            className="px-4 sm:px-6 py-2 sm:py-3 font-bold transition-all flex items-center gap-1 sm:gap-2 relative group"
            style={{
              color: activeTab === 'qr' ? '#ccaa00' : '#9ca3af',
              borderBottom: activeTab === 'qr' ? '3px solid #ccaa00' : '3px solid transparent'
            }}
          >
            <QrCode className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
            <span className="text-sm sm:text-base">Códigos QR</span>
            <span 
              className="absolute bottom-0 left-0 w-full h-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
              style={{ backgroundColor: '#ccaa00' }}
            />
          </button>
        </div>
      </div>

      {/* Contenido de Trabajadores */}
      {activeTab === 'trabajadores' && (
        <>
          {/* Métricas */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
            <div className="backdrop-blur-xl rounded-xl p-4 sm:p-6" style={{
              background: 'rgba(0, 0, 0, 0.3)',
              border: '1px solid rgba(204, 170, 0, 0.3)'
            }}>
              <div className="flex items-center justify-between mb-2 sm:mb-3">
                <p className="text-gray-400 text-xs sm:text-sm font-medium">Total</p>
                <Users className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: '#ccaa00' }} />
              </div>
              <p className="text-xl sm:text-2xl md:text-3xl font-bold text-white">{totalTrabajadores}</p>
              <p className="text-xs sm:text-sm text-gray-400 mt-1">Registrados</p>
            </div>

            <div className="backdrop-blur-xl rounded-xl p-4 sm:p-6" style={{
              background: 'rgba(0, 0, 0, 0.3)',
              border: '1px solid rgba(34, 197, 94, 0.3)'
            }}>
              <div className="flex items-center justify-between mb-2 sm:mb-3">
                <p className="text-gray-400 text-xs sm:text-sm font-medium">Activos</p>
                <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: '#22c55e' }} />
              </div>
              <p className="text-xl sm:text-2xl md:text-3xl font-bold" style={{ color: '#22c55e' }}>{trabajadoresActivos}</p>
              <p className="text-xs sm:text-sm" style={{ color: '#22c55e' }}>En servicio</p>
            </div>

            <div className="backdrop-blur-xl rounded-xl p-4 sm:p-6" style={{
              background: 'rgba(0, 0, 0, 0.3)',
              border: '1px solid rgba(156, 163, 175, 0.3)'
            }}>
              <div className="flex items-center justify-between mb-2 sm:mb-3">
                <p className="text-gray-400 text-xs sm:text-sm font-medium">Inactivos</p>
                <User className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
              </div>
              <p className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-400">{trabajadoresInactivos}</p>
              <p className="text-xs sm:text-sm text-gray-500">Fuera de servicio</p>
            </div>
          </div>

          {/* Barra de Acciones */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por nombre, DNI o placa..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 sm:pl-12 pr-3 sm:pr-4 py-2.5 sm:py-3 rounded-lg sm:rounded-xl text-sm sm:text-base text-white placeholder-gray-400"
                style={{
                  background: 'rgba(0, 0, 0, 0.3)',
                  border: '1px solid rgba(204, 170, 0, 0.3)'
                }}
              />
            </div>

            <button
              onClick={() => setIsFormOpen(true)}
              className="w-full sm:w-auto px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg sm:rounded-xl font-bold transition-all hover:scale-105 flex items-center gap-1 sm:gap-2 justify-center"
              style={{
                background: 'linear-gradient(to right, #0d4a24, #166534, #b8941e, #ccaa00)',
                color: '#ffffff',
                boxShadow: '0 4px 15px rgba(204, 170, 0, 0.3)'
              }}
            >
              <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="text-sm sm:text-base">Nuevo Trabajador</span>
            </button>
          </div>

          {/* Listado de Trabajadores */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
            {trabajadoresFiltrados.map((trabajador) => (
              <div 
                key={trabajador.id}
                className="backdrop-blur-xl rounded-xl overflow-hidden"
                style={{
                  background: 'rgba(0, 0, 0, 0.4)',
                  border: '1px solid rgba(204, 170, 0, 0.3)',
                  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)'
                }}
              >
                {/* Header con Estado */}
                <div className="px-4 sm:px-6 py-3 sm:py-4 border-b" style={{
                  background: 'linear-gradient(135deg, rgba(204, 170, 0, 0.15), rgba(0, 0, 0, 0.3))',
                  borderColor: 'rgba(204, 170, 0, 0.2)'
                }}>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <div 
                        className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center flex-shrink-0"
                        style={{
                          background: 'linear-gradient(135deg, #ccaa00, #b8941e)',
                          boxShadow: '0 4px 15px rgba(204, 170, 0, 0.3)'
                        }}
                      >
                        <User className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-black" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-white font-bold text-sm sm:text-base md:text-lg truncate">
                          {trabajador.nombre} {trabajador.apellidos}
                        </h3>
                        <p className="text-xs text-gray-400">DNI: {trabajador.dni}</p>
                      </div>
                    </div>
                    <span 
                      className="px-2 sm:px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap ml-2"
                      style={{
                        background: trabajador.estado === 'Activo' 
                          ? 'rgba(34, 197, 94, 0.2)' 
                          : 'rgba(156, 163, 175, 0.2)',
                        color: trabajador.estado === 'Activo' ? '#22c55e' : '#9ca3af',
                        border: trabajador.estado === 'Activo' 
                          ? '1px solid rgba(34, 197, 94, 0.3)' 
                          : '1px solid rgba(156, 163, 175, 0.3)'
                      }}
                    >
                      {trabajador.estado}
                    </span>
                  </div>
                </div>

                {/* Contenido */}
                <div className="p-3 sm:p-4 md:p-6 space-y-3 sm:space-y-4">
                  {/* Información Personal */}
                  <div>
                    <p className="text-xs font-bold mb-2 sm:mb-3" style={{ color: '#ccaa00' }}>INFORMACIÓN PERSONAL</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                      <div className="flex items-start gap-1 sm:gap-2">
                        <Phone className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-xs text-gray-400">Teléfono</p>
                          <p className="text-white font-medium text-sm sm:text-base">{trabajador.telefono}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-1 sm:gap-2">
                        <Calendar className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-xs text-gray-400">Fecha</p>
                          <p className="text-white font-medium text-sm sm:text-base">{trabajador.fechaContratacion}</p>
                        </div>
                      </div>
                      <div className="col-span-1 sm:col-span-2 flex items-start gap-1 sm:gap-2">
                        <MapPin className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="text-xs text-gray-400">Dirección</p>
                          <p className="text-white font-medium text-sm sm:text-base truncate">{trabajador.direccion}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Información de la Moto */}
                  <div 
                    className="p-3 sm:p-4 rounded-lg"
                    style={{
                      background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.15), rgba(0, 0, 0, 0.3))',
                      border: '1px solid rgba(59, 130, 246, 0.3)'
                    }}
                  >
                    <p className="text-xs font-bold mb-2 sm:mb-3 flex items-center gap-1 sm:gap-2" style={{ color: '#3b82f6' }}>
                      <Bike className="w-3 h-3 sm:w-4 sm:h-4" />
                      MOTO ASIGNADA
                    </p>
                    <div className="grid grid-cols-2 gap-2 sm:gap-3">
                      <div>
                        <p className="text-xs text-gray-400">Placa</p>
                        <p className="text-white font-bold text-base sm:text-lg md:text-xl">{trabajador.moto.placa}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400">Marca / Modelo</p>
                        <p className="text-white font-medium text-sm sm:text-base truncate">
                          {trabajador.moto.marca} {trabajador.moto.modelo}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400">Año</p>
                        <p className="text-white font-medium text-sm sm:text-base">{trabajador.moto.año}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400">Color</p>
                        <p className="text-white font-medium text-sm sm:text-base">{trabajador.moto.color}</p>
                      </div>
                    </div>
                  </div>

                  {/* Botones de Acción */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEditar(trabajador)}
                      className="flex-1 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg font-medium transition-all hover:scale-105 flex items-center justify-center gap-1 sm:gap-2"
                      style={{
                        background: 'rgba(245, 158, 11, 0.2)',
                        color: '#f59e0b',
                        border: '1px solid rgba(245, 158, 11, 0.3)'
                      }}
                    >
                      <Edit2 className="w-3 h-3 sm:w-4 sm:h-4" />
                      <span className="text-xs sm:text-sm">Editar</span>
                    </button>
                    <button
                      onClick={() => handleEliminar(trabajador.id)}
                      className="flex-1 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg font-medium transition-all hover:scale-105 flex items-center justify-center gap-1 sm:gap-2"
                      style={{
                        background: 'rgba(239, 68, 68, 0.2)',
                        color: '#ef4444',
                        border: '1px solid rgba(239, 68, 68, 0.3)'
                      }}
                    >
                      <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                      <span className="text-xs sm:text-sm">Eliminar</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {trabajadoresFiltrados.length === 0 && (
            <div className="text-center py-8 sm:py-12 backdrop-blur-xl rounded-xl" style={{
              background: 'rgba(0, 0, 0, 0.3)',
              border: '1px solid rgba(204, 170, 0, 0.3)'
            }}>
              <Users className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 text-gray-600" />
              <p className="text-gray-400 text-sm sm:text-base">No se encontraron trabajadores</p>
            </div>
          )}
        </>
      )}

      {/* Contenido de Códigos QR */}
      {activeTab === 'qr' && (
        <>
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
            <div>
              <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-white mb-1 sm:mb-2">Gestión de Códigos QR</h2>
              <p className="text-xs sm:text-sm text-gray-400">Administra códigos QR para pagos digitales</p>
            </div>
            <button
              onClick={() => setIsQRFormOpen(true)}
              className="w-full sm:w-auto px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg sm:rounded-xl font-bold transition-all hover:scale-105 flex items-center gap-1 sm:gap-2 justify-center"
              style={{
                background: 'linear-gradient(to right, #0d4a24, #166534, #b8941e, #ccaa00)',
                color: '#ffffff',
                boxShadow: '0 4px 15px rgba(204, 170, 0, 0.3)'
              }}
            >
              <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="text-sm sm:text-base">Agregar QR</span>
            </button>
          </div>

          {/* Listado de Códigos QR */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {codigosQR.map((qr) => (
              <div 
                key={qr.id}
                className="backdrop-blur-xl rounded-xl overflow-hidden"
                style={{
                  background: 'rgba(0, 0, 0, 0.4)',
                  border: `1px solid ${qr.metodo === 'Yape' ? 'rgba(138, 43, 226, 0.3)' : 'rgba(0, 191, 255, 0.3)'}`,
                  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)'
                }}
              >
                {/* Header */}
                <div className="px-4 sm:px-6 py-3 sm:py-4 border-b" style={{
                  background: qr.metodo === 'Yape' 
                    ? 'linear-gradient(135deg, rgba(138, 43, 226, 0.15), rgba(0, 0, 0, 0.3))' 
                    : 'linear-gradient(135deg, rgba(0, 191, 255, 0.15), rgba(0, 0, 0, 0.3))',
                  borderColor: qr.metodo === 'Yape' ? 'rgba(138, 43, 226, 0.2)' : 'rgba(0, 191, 255, 0.2)'
                }}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <div 
                        className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{
                          background: qr.metodo === 'Yape' 
                            ? 'linear-gradient(135deg, #8a2be2, #7b1fa2)' 
                            : 'linear-gradient(135deg, #00bfff, #0099cc)',
                          boxShadow: `0 4px 15px ${qr.metodo === 'Yape' ? 'rgba(138, 43, 226, 0.3)' : 'rgba(0, 191, 255, 0.3)'}`
                        }}
                      >
                        <QrCode className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-white" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-white font-bold text-sm sm:text-base md:text-lg truncate">{qr.metodo}</h3>
                        <p className="text-xs text-gray-400 truncate">{qr.nombreTitular}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleToggleActivoQR(qr.id)}
                      className="px-2 sm:px-3 py-1 rounded-full text-xs font-bold transition-all hover:scale-105 whitespace-nowrap"
                      style={{
                        background: qr.activo 
                          ? 'rgba(34, 197, 94, 0.2)' 
                          : 'rgba(156, 163, 175, 0.2)',
                        color: qr.activo ? '#22c55e' : '#9ca3af',
                        border: qr.activo 
                          ? '1px solid rgba(34, 197, 94, 0.3)' 
                          : '1px solid rgba(156, 163, 175, 0.3)'
                      }}
                    >
                      {qr.activo ? 'Activo' : 'Inactivo'}
                    </button>
                  </div>
                </div>

                {/* Imagen del QR */}
                <div className="p-3 sm:p-4 md:p-6 space-y-3 sm:space-y-4">
                  <div className="aspect-square bg-white rounded-lg overflow-hidden">
                    <img 
                      src={qr.imagenQR} 
                      alt={`Código QR ${qr.metodo}`}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400?text=QR+no+disponible';
                      }}
                    />
                  </div>

                  {/* Información */}
                  <div className="space-y-1 sm:space-y-2">
                    {qr.telefono && (
                      <div className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
                        <Phone className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400 flex-shrink-0" />
                        <span className="text-white truncate">{qr.telefono}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
                      <Calendar className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400 flex-shrink-0" />
                      <span className="text-gray-400 truncate">Registrado: {qr.fechaRegistro}</span>
                    </div>
                  </div>

                  {/* Botones */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEditarQR(qr)}
                      className="flex-1 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg font-medium transition-all hover:scale-105 flex items-center justify-center gap-1 sm:gap-2"
                      style={{
                        background: 'rgba(245, 158, 11, 0.2)',
                        color: '#f59e0b',
                        border: '1px solid rgba(245, 158, 11, 0.3)'
                      }}
                    >
                      <Edit2 className="w-3 h-3 sm:w-4 sm:h-4" />
                      <span className="text-xs sm:text-sm">Editar</span>
                    </button>
                    <button
                      onClick={() => handleEliminarQR(qr.id)}
                      className="flex-1 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg font-medium transition-all hover:scale-105 flex items-center justify-center gap-1 sm:gap-2"
                      style={{
                        background: 'rgba(239, 68, 68, 0.2)',
                        color: '#ef4444',
                        border: '1px solid rgba(239, 68, 68, 0.3)'
                      }}
                    >
                      <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                      <span className="text-xs sm:text-sm">Eliminar</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {codigosQR.length === 0 && (
            <div className="text-center py-8 sm:py-12 backdrop-blur-xl rounded-xl" style={{
              background: 'rgba(0, 0, 0, 0.3)',
              border: '1px solid rgba(204, 170, 0, 0.3)'
            }}>
              <QrCode className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 text-gray-600" />
              <p className="text-gray-400 text-sm sm:text-base">No hay códigos QR registrados</p>
            </div>
          )}
        </>
      )}

      {/* Modal de Formulario de Trabajadores */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4" style={{ background: 'rgba(0, 0, 0, 0.85)' }}>
          <div 
            className="backdrop-blur-2xl rounded-xl sm:rounded-2xl w-full max-w-xs sm:max-w-sm md:max-w-2xl lg:max-w-4xl max-h-[90vh] overflow-y-auto mx-2 sm:mx-4"
            style={{
              background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.7) 0%, rgba(13, 74, 36, 0.3) 50%, rgba(0, 0, 0, 0.7) 100%)',
              border: '2px solid rgba(204, 170, 0, 0.3)',
              boxShadow: '0 30px 60px -12px rgba(0, 0, 0, 0.8), 0 0 100px rgba(204, 170, 0, 0.1)'
            }}
          >
            {/* Header */}
            <div className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 md:py-5 border-b" style={{
              background: 'linear-gradient(135deg, rgba(204, 170, 0, 0.15), rgba(0, 0, 0, 0.4))',
              borderColor: 'rgba(204, 170, 0, 0.2)'
            }}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div 
                    className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{
                      background: 'linear-gradient(135deg, #ccaa00, #b8941e)',
                      boxShadow: '0 8px 20px rgba(204, 170, 0, 0.3)'
                    }}
                  >
                    {editingTrabajador ? (
                      <Edit2 className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-black" />
                    ) : (
                      <Plus className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-black" />
                    )}
                  </div>
                  <h2 className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-white truncate">
                    {editingTrabajador ? 'Editar Trabajador' : 'Nuevo Trabajador'}
                  </h2>
                </div>
                <button
                  onClick={resetForm}
                  className="p-1.5 sm:p-2 rounded-lg transition-all hover:scale-110 flex-shrink-0"
                  style={{ background: 'rgba(239, 68, 68, 0.2)', border: '1px solid rgba(239, 68, 68, 0.3)' }}
                >
                  <X className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: '#ef4444' }} />
                </button>
              </div>
            </div>

            {/* Formulario */}
            <form onSubmit={handleSubmit} className="p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6">
              {/* Información Personal */}
              <div className="backdrop-blur-xl rounded-xl p-3 sm:p-4 md:p-6" style={{
                background: 'rgba(0, 0, 0, 0.3)',
                border: '1px solid rgba(204, 170, 0, 0.3)'
              }}>
                <h3 className="text-sm sm:text-base md:text-lg font-bold mb-3 sm:mb-4 flex items-center gap-1 sm:gap-2" style={{ color: '#ccaa00' }}>
                  <User className="w-4 h-4 sm:w-5 sm:h-5" />
                  Información Personal
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <label className="block text-xs sm:text-sm font-bold mb-1 sm:mb-2" style={{ color: '#ccaa00' }}>
                      Nombre *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.nombre}
                      onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                      className="w-full px-3 sm:px-4 py-2 sm:py-3 rounded-lg sm:rounded-xl text-sm sm:text-base text-white placeholder-gray-400"
                      style={{
                        background: 'rgba(255, 255, 255, 0.08)',
                        border: '1.5px solid rgba(204, 170, 0, 0.3)'
                      }}
                      placeholder="Ej: Carlos"
                    />
                  </div>
                  <div>
                    <label className="block text-xs sm:text-sm font-bold mb-1 sm:mb-2" style={{ color: '#ccaa00' }}>
                      Apellidos *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.apellidos}
                      onChange={(e) => setFormData({ ...formData, apellidos: e.target.value })}
                      className="w-full px-3 sm:px-4 py-2 sm:py-3 rounded-lg sm:rounded-xl text-sm sm:text-base text-white placeholder-gray-400"
                      style={{
                        background: 'rgba(255, 255, 255, 0.08)',
                        border: '1.5px solid rgba(204, 170, 0, 0.3)'
                      }}
                      placeholder="Ej: Méndez Vargas"
                    />
                  </div>
                  <div>
                    <label className="block text-xs sm:text-sm font-bold mb-1 sm:mb-2" style={{ color: '#ccaa00' }}>
                      DNI *
                    </label>
                    <input
                      type="text"
                      required
                      pattern="[0-9]{8}"
                      maxLength={8}
                      value={formData.dni}
                      onChange={(e) => setFormData({ ...formData, dni: e.target.value })}
                      className="w-full px-3 sm:px-4 py-2 sm:py-3 rounded-lg sm:rounded-xl text-sm sm:text-base text-white placeholder-gray-400"
                      style={{
                        background: 'rgba(255, 255, 255, 0.08)',
                        border: '1.5px solid rgba(204, 170, 0, 0.3)'
                      }}
                      placeholder="12345678"
                    />
                  </div>
                  <div>
                    <label className="block text-xs sm:text-sm font-bold mb-1 sm:mb-2" style={{ color: '#ccaa00' }}>
                      Teléfono *
                    </label>
                    <input
                      type="tel"
                      required
                      pattern="[0-9]{9}"
                      maxLength={9}
                      value={formData.telefono}
                      onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                      className="w-full px-3 sm:px-4 py-2 sm:py-3 rounded-lg sm:rounded-xl text-sm sm:text-base text-white placeholder-gray-400"
                      style={{
                        background: 'rgba(255, 255, 255, 0.08)',
                        border: '1.5px solid rgba(204, 170, 0, 0.3)'
                      }}
                      placeholder="987654321"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs sm:text-sm font-bold mb-1 sm:mb-2" style={{ color: '#ccaa00' }}>
                      Dirección *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.direccion}
                      onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                      className="w-full px-3 sm:px-4 py-2 sm:py-3 rounded-lg sm:rounded-xl text-sm sm:text-base text-white placeholder-gray-400"
                      style={{
                        background: 'rgba(255, 255, 255, 0.08)',
                        border: '1.5px solid rgba(204, 170, 0, 0.3)'
                      }}
                      placeholder="Ej: Av. Los Pinos 123, Lima"
                    />
                  </div>
                  <div>
                    <label className="block text-xs sm:text-sm font-bold mb-1 sm:mb-2" style={{ color: '#ccaa00' }}>
                      Fecha de Contratación *
                    </label>
                    <input
                      type="date"
                      required
                      value={formData.fechaContratacion}
                      onChange={(e) => setFormData({ ...formData, fechaContratacion: e.target.value })}
                      className="w-full px-3 sm:px-4 py-2 sm:py-3 rounded-lg sm:rounded-xl text-sm sm:text-base text-white"
                      style={{
                        background: 'rgba(255, 255, 255, 0.08)',
                        border: '1.5px solid rgba(204, 170, 0, 0.3)'
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Información de la Moto */}
              <div className="backdrop-blur-xl rounded-xl p-3 sm:p-4 md:p-6" style={{
                background: 'rgba(0, 0, 0, 0.3)',
                border: '1px solid rgba(59, 130, 246, 0.3)'
              }}>
                <h3 className="text-sm sm:text-base md:text-lg font-bold mb-3 sm:mb-4 flex items-center gap-1 sm:gap-2" style={{ color: '#3b82f6' }}>
                  <Bike className="w-4 h-4 sm:w-5 sm:h-5" />
                  Información de la Moto
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <label className="block text-xs sm:text-sm font-bold mb-1 sm:mb-2" style={{ color: '#3b82f6' }}>
                      Placa *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.placa}
                      onChange={(e) => setFormData({ ...formData, placa: e.target.value.toUpperCase() })}
                      className="w-full px-3 sm:px-4 py-2 sm:py-3 rounded-lg sm:rounded-xl text-sm sm:text-base text-white placeholder-gray-400 uppercase"
                      style={{
                        background: 'rgba(255, 255, 255, 0.08)',
                        border: '1.5px solid rgba(59, 130, 246, 0.3)'
                      }}
                      placeholder="ABC-123"
                      maxLength={7}
                    />
                  </div>
                  <div>
                    <label className="block text-xs sm:text-sm font-bold mb-1 sm:mb-2" style={{ color: '#3b82f6' }}>
                      Marca *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.marca}
                      onChange={(e) => setFormData({ ...formData, marca: e.target.value })}
                      className="w-full px-3 sm:px-4 py-2 sm:py-3 rounded-lg sm:rounded-xl text-sm sm:text-base text-white placeholder-gray-400"
                      style={{
                        background: 'rgba(255, 255, 255, 0.08)',
                        border: '1.5px solid rgba(59, 130, 246, 0.3)'
                      }}
                      placeholder="Ej: Honda"
                    />
                  </div>
                  <div>
                    <label className="block text-xs sm:text-sm font-bold mb-1 sm:mb-2" style={{ color: '#3b82f6' }}>
                      Modelo *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.modelo}
                      onChange={(e) => setFormData({ ...formData, modelo: e.target.value })}
                      className="w-full px-3 sm:px-4 py-2 sm:py-3 rounded-lg sm:rounded-xl text-sm sm:text-base text-white placeholder-gray-400"
                      style={{
                        background: 'rgba(255, 255, 255, 0.08)',
                        border: '1.5px solid rgba(59, 130, 246, 0.3)'
                      }}
                      placeholder="Ej: Wave 110"
                    />
                  </div>
                  <div>
                    <label className="block text-xs sm:text-sm font-bold mb-1 sm:mb-2" style={{ color: '#3b82f6' }}>
                      Año *
                    </label>
                    <input
                      type="number"
                      required
                      min="2000"
                      max="2025"
                      value={formData.año}
                      onChange={(e) => setFormData({ ...formData, año: e.target.value })}
                      className="w-full px-3 sm:px-4 py-2 sm:py-3 rounded-lg sm:rounded-xl text-sm sm:text-base text-white placeholder-gray-400"
                      style={{
                        background: 'rgba(255, 255, 255, 0.08)',
                        border: '1.5px solid rgba(59, 130, 246, 0.3)'
                      }}
                      placeholder="2023"
                    />
                  </div>
                  <div>
                    <label className="block text-xs sm:text-sm font-bold mb-1 sm:mb-2" style={{ color: '#3b82f6' }}>
                      Color *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.color}
                      onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                      className="w-full px-3 sm:px-4 py-2 sm:py-3 rounded-lg sm:rounded-xl text-sm sm:text-base text-white placeholder-gray-400"
                      style={{
                        background: 'rgba(255, 255, 255, 0.08)',
                        border: '1.5px solid rgba(59, 130, 246, 0.3)'
                      }}
                      placeholder="Ej: Rojo"
                    />
                  </div>
                </div>
              </div>

              {/* Botones */}
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                <button
                  type="button"
                  onClick={resetForm}
                  className="w-full sm:flex-1 px-3 sm:px-4 md:px-6 py-2.5 sm:py-3 rounded-lg sm:rounded-xl text-sm sm:text-base font-bold transition-all hover:scale-105"
                  style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    color: '#ffffff',
                    border: '1.5px solid rgba(255, 255, 255, 0.2)'
                  }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="w-full sm:flex-1 px-3 sm:px-4 md:px-6 py-2.5 sm:py-3 rounded-lg sm:rounded-xl text-sm sm:text-base font-bold transition-all hover:scale-105 flex items-center justify-center gap-1 sm:gap-2"
                  style={{
                    background: 'linear-gradient(to right, #0d4a24, #166534, #b8941e, #ccaa00)',
                    color: '#ffffff',
                    boxShadow: '0 10px 30px rgba(204, 170, 0, 0.4)'
                  }}
                >
                  {editingTrabajador ? (
                    <>
                      <Edit2 className="w-4 h-4 sm:w-5 sm:h-5" />
                      <span>Actualizar</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
                      <span>Registrar</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Formulario de QR */}
      {isQRFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4" style={{ background: 'rgba(0, 0, 0, 0.85)' }}>
          <div 
            className="backdrop-blur-2xl rounded-xl sm:rounded-2xl w-full max-w-xs sm:max-w-sm md:max-w-lg max-h-[90vh] overflow-y-auto mx-2 sm:mx-4"
            style={{
              background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.7) 0%, rgba(13, 74, 36, 0.3) 50%, rgba(0, 0, 0, 0.7) 100%)',
              border: '2px solid rgba(204, 170, 0, 0.3)',
              boxShadow: '0 30px 60px -12px rgba(0, 0, 0, 0.8), 0 0 100px rgba(204, 170, 0, 0.1)'
            }}
          >
            {/* Header */}
            <div className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 border-b" style={{
              background: 'linear-gradient(135deg, rgba(204, 170, 0, 0.15), rgba(0, 0, 0, 0.4))',
              borderColor: 'rgba(204, 170, 0, 0.2)'
            }}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div 
                    className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{
                      background: 'linear-gradient(135deg, #ccaa00, #b8941e)',
                      boxShadow: '0 8px 20px rgba(204, 170, 0, 0.3)'
                    }}
                  >
                    <QrCode className="w-4 h-4 sm:w-5 sm:h-5 text-black" />
                  </div>
                  <h2 className="text-base sm:text-lg md:text-xl font-bold text-white truncate">
                    {editingQR ? 'Editar QR' : 'Agregar QR'}
                  </h2>
                </div>
                <button
                  onClick={resetQRForm}
                  className="p-1.5 sm:p-2 rounded-lg transition-all hover:scale-110 flex-shrink-0"
                  style={{ background: 'rgba(239, 68, 68, 0.2)', border: '1px solid rgba(239, 68, 68, 0.3)' }}
                >
                  <X className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: '#ef4444' }} />
                </button>
              </div>
            </div>

            {/* Formulario */}
            <form onSubmit={handleQRSubmit} className="p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6">
              <div className="backdrop-blur-xl rounded-xl p-3 sm:p-4 md:p-6" style={{
                background: 'rgba(0, 0, 0, 0.3)',
                border: '1px solid rgba(204, 170, 0, 0.3)'
              }}>
                <div className="space-y-3 sm:space-y-4">
                  <div>
                    <label className="block text-xs sm:text-sm font-bold mb-1 sm:mb-2" style={{ color: '#ccaa00' }}>
                      Método de Pago *
                    </label>
                    <select
                      required
                      value={qrFormData.metodo}
                      onChange={(e) => setQRFormData({ ...qrFormData, metodo: e.target.value as 'Yape' | 'Plin' })}
                      className="w-full px-3 sm:px-4 py-2 sm:py-3 rounded-lg sm:rounded-xl text-sm sm:text-base text-white"
                      style={{
                        background: 'rgba(255, 255, 255, 0.08)',
                        border: '1.5px solid rgba(204, 170, 0, 0.3)'
                      }}
                    >
                      <option value="Yape" className="bg-gray-800">Yape</option>
                      <option value="Plin" className="bg-gray-800">Plin</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs sm:text-sm font-bold mb-1 sm:mb-2" style={{ color: '#ccaa00' }}>
                      Nombre del Titular *
                    </label>
                    <input
                      type="text"
                      required
                      value={qrFormData.nombreTitular}
                      onChange={(e) => setQRFormData({ ...qrFormData, nombreTitular: e.target.value })}
                      className="w-full px-3 sm:px-4 py-2 sm:py-3 rounded-lg sm:rounded-xl text-sm sm:text-base text-white placeholder-gray-400"
                      style={{
                        background: 'rgba(255, 255, 255, 0.08)',
                        border: '1.5px solid rgba(204, 170, 0, 0.3)'
                      }}
                      placeholder="Ej: Avícola Jossy SAC"
                    />
                  </div>

                  <div>
                    <label className="block text-xs sm:text-sm font-bold mb-1 sm:mb-2" style={{ color: '#ccaa00' }}>
                      Teléfono (Opcional)
                    </label>
                    <input
                      type="tel"
                      pattern="[0-9]{9}"
                      maxLength={9}
                      value={qrFormData.telefono}
                      onChange={(e) => setQRFormData({ ...qrFormData, telefono: e.target.value })}
                      className="w-full px-3 sm:px-4 py-2 sm:py-3 rounded-lg sm:rounded-xl text-sm sm:text-base text-white placeholder-gray-400"
                      style={{
                        background: 'rgba(255, 255, 255, 0.08)',
                        border: '1.5px solid rgba(204, 170, 0, 0.3)'
                      }}
                      placeholder="987654321"
                    />
                  </div>

                  <div>
                    <label className="block text-xs sm:text-sm font-bold mb-1 sm:mb-2" style={{ color: '#ccaa00' }}>
                      URL de la Imagen del QR *
                    </label>
                    <input
                      type="url"
                      required
                      value={qrFormData.imagenQR}
                      onChange={(e) => setQRFormData({ ...qrFormData, imagenQR: e.target.value })}
                      className="w-full px-3 sm:px-4 py-2 sm:py-3 rounded-lg sm:rounded-xl text-sm sm:text-base text-white placeholder-gray-400"
                      style={{
                        background: 'rgba(255, 255, 255, 0.08)',
                        border: '1.5px solid rgba(204, 170, 0, 0.3)'
                      }}
                      placeholder="https://ejemplo.com/mi-qr.png"
                    />
                    <p className="text-xs text-gray-400 mt-1 sm:mt-2">
                      Sube la imagen a un servicio de alojamiento y pega la URL aquí
                    </p>
                  </div>

                  {/* Vista Previa */}
                  {qrFormData.imagenQR && (
                    <div>
                      <p className="text-xs sm:text-sm font-bold mb-1 sm:mb-2" style={{ color: '#ccaa00' }}>Vista Previa</p>
                      <div className="aspect-square max-w-xs sm:max-w-sm mx-auto bg-white rounded-lg overflow-hidden">
                        <img 
                          src={qrFormData.imagenQR} 
                          alt="Vista previa del QR"
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400?text=Error+al+cargar';
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Botones */}
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                <button
                  type="button"
                  onClick={resetQRForm}
                  className="w-full sm:flex-1 px-3 sm:px-4 md:px-6 py-2.5 sm:py-3 rounded-lg sm:rounded-xl text-sm sm:text-base font-bold transition-all hover:scale-105"
                  style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    color: '#ffffff',
                    border: '1.5px solid rgba(255, 255, 255, 0.2)'
                  }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="w-full sm:flex-1 px-3 sm:px-4 md:px-6 py-2.5 sm:py-3 rounded-lg sm:rounded-xl text-sm sm:text-base font-bold transition-all hover:scale-105 flex items-center justify-center gap-1 sm:gap-2"
                  style={{
                    background: 'linear-gradient(to right, #0d4a24, #166534, #b8941e, #ccaa00)',
                    color: '#ffffff',
                    boxShadow: '0 10px 30px rgba(204, 170, 0, 0.4)'
                  }}
                >
                  {editingQR ? (
                    <>
                      <Edit2 className="w-4 h-4 sm:w-5 sm:h-5" />
                      <span>Actualizar</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
                      <span>Registrar</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}