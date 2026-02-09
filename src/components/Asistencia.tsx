import { useState } from 'react';
import { Calendar, Clock, UserCheck, Users, CheckCircle, XCircle, Search, ScanLine, ChevronLeft, ChevronRight, User, AlertCircle } from 'lucide-react';
import { useApp } from '../contexts/AppContext';

interface RegistroAsistencia {
  id: string;
  empleadoId: string;
  empleadoNombre: string;
  empleadoCargo: 'Secretaria' | 'Producción' | 'Pesaje' | 'Seguridad' | 'Operadora';
  empleadoFoto?: string;
  fecha: string;
  horaEntrada: string;
  horaSalida: string | null;
  estado: 'Presente' | 'Ausente' | 'Tardanza';
}

// Generar datos históricos
const generarAsistenciaHistorica = (empleados: any[]) => {
  const registros: RegistroAsistencia[] = [];
  const diasPasados = 7;
  
  for (let dia = 1; dia <= diasPasados; dia++) {
    const fecha = new Date();
    fecha.setDate(fecha.getDate() - dia);
    const fechaStr = fecha.toISOString().split('T')[0];
    
    empleados.forEach((emp) => {
      const random = Math.random();
      if (random > 0.15) { // 85% de asistencia
        const horaBase = 8 + Math.floor(Math.random() * 2);
        const minutos = Math.floor(Math.random() * 60);
        const horaEntrada = `${horaBase.toString().padStart(2, '0')}:${minutos.toString().padStart(2, '0')}`;
        
        const horaSalidaBase = 17 + Math.floor(Math.random() * 2);
        const minutosSalida = Math.floor(Math.random() * 60);
        const horaSalida = `${horaSalidaBase.toString().padStart(2, '0')}:${minutosSalida.toString().padStart(2, '0')}`;
        
        registros.push({
          id: `${fechaStr}-${emp.id}`,
          empleadoId: emp.id,
          empleadoNombre: `${emp.nombre} ${emp.apellidos}`,
          empleadoCargo: emp.cargo,
          empleadoFoto: emp.foto,
          fecha: fechaStr,
          horaEntrada: horaEntrada,
          horaSalida: horaSalida,
          estado: horaBase >= 9 ? 'Tardanza' : 'Presente'
        });
      }
    });
  }
  
  return registros;
};

const hoy = new Date().toISOString().split('T')[0];

export function Asistencia() {
  const { empleados } = useApp();
  
  const [registrosAsistencia, setRegistrosAsistencia] = useState<RegistroAsistencia[]>(() => {
    // Generar datos históricos al iniciar
    return generarAsistenciaHistorica(empleados);
  });
  
  const [fechaSeleccionada, setFechaSeleccionada] = useState<string>(hoy);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEstado, setFilterEstado] = useState<string>('all');
  const [isScanModalOpen, setIsScanModalOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [scanInput, setScanInput] = useState('');
  const [empleadoParaConfirmar, setEmpleadoParaConfirmar] = useState<any>(null);
  const [tipoRegistro, setTipoRegistro] = useState<'entrada' | 'salida'>('entrada');

  // Filtrar registros por fecha seleccionada
  const registrosDia = registrosAsistencia.filter(r => r.fecha === fechaSeleccionada);
  
  // Filtrar por búsqueda y estado
  const registrosFiltrados = registrosDia.filter(registro => {
    const matchesSearch = registro.empleadoNombre.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesEstado = filterEstado === 'all' || registro.estado === filterEstado;
    return matchesSearch && matchesEstado;
  });

  // Calcular métricas del día seleccionado
  const totalEmpleados = empleados.length;
  const presentes = registrosDia.filter(r => r.estado === 'Presente' || r.estado === 'Tardanza').length;
  const ausentes = totalEmpleados - presentes;
  const tardanzas = registrosDia.filter(r => r.estado === 'Tardanza').length;

  // Obtener empleados que no han registrado asistencia
  const empleadosPresentesIds = registrosDia.map(r => r.empleadoId);
  const empleadosAusentes = empleados.filter(emp => !empleadosPresentesIds.includes(emp.id));

  const handleOpenScanModal = () => {
    setScanInput('');
    setIsScanModalOpen(true);
  };

  const handleScanSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Buscar empleado por ID
    const empleado = empleados.find(emp => emp.id === scanInput.trim());
    
    if (!empleado) {
      alert('ID de empleado no válido. Por favor verifique el ID.');
      return;
    }

    // Verificar si ya registró entrada hoy
    const yaRegistrado = registrosDia.find(r => r.empleadoId === empleado.id);
    
    if (yaRegistrado && !yaRegistrado.horaSalida) {
      // Va a registrar salida
      setTipoRegistro('salida');
      setEmpleadoParaConfirmar(empleado);
      setIsScanModalOpen(false);
      setIsConfirmModalOpen(true);
    } else if (yaRegistrado && yaRegistrado.horaSalida) {
      alert('Este empleado ya completó su registro de hoy (entrada y salida)');
      setScanInput('');
    } else {
      // Va a registrar entrada
      setTipoRegistro('entrada');
      setEmpleadoParaConfirmar(empleado);
      setIsScanModalOpen(false);
      setIsConfirmModalOpen(true);
    }
  };

  const confirmarRegistro = () => {
    if (!empleadoParaConfirmar) return;

    const yaRegistrado = registrosDia.find(r => r.empleadoId === empleadoParaConfirmar.id);
    const ahora = new Date();
    const horaActual = `${ahora.getHours().toString().padStart(2, '0')}:${ahora.getMinutes().toString().padStart(2, '0')}`;

    if (tipoRegistro === 'salida' && yaRegistrado) {
      // Registrar salida
      setRegistrosAsistencia(prev => prev.map(r => 
        r.id === yaRegistrado.id ? { ...r, horaSalida: horaActual } : r
      ));
      alert(`Salida registrada para ${empleadoParaConfirmar.nombre} ${empleadoParaConfirmar.apellidos}`);
    } else {
      // Registrar entrada
      const hora = ahora.getHours();
      const estado: 'Presente' | 'Tardanza' = hora >= 9 ? 'Tardanza' : 'Presente';
      
      const nuevoRegistro: RegistroAsistencia = {
        id: `${Date.now()}-${empleadoParaConfirmar.id}`,
        empleadoId: empleadoParaConfirmar.id,
        empleadoNombre: `${empleadoParaConfirmar.nombre} ${empleadoParaConfirmar.apellidos}`,
        empleadoCargo: empleadoParaConfirmar.cargo,
        empleadoFoto: empleadoParaConfirmar.foto,
        fecha: fechaSeleccionada,
        horaEntrada: horaActual,
        horaSalida: null,
        estado: estado
      };
      
      setRegistrosAsistencia(prev => [...prev, nuevoRegistro]);
      alert(`Entrada registrada para ${empleadoParaConfirmar.nombre} ${empleadoParaConfirmar.apellidos}`);
    }
    
    setIsConfirmModalOpen(false);
    setEmpleadoParaConfirmar(null);
    setScanInput('');
  };

  const cancelarRegistro = () => {
    setIsConfirmModalOpen(false);
    setEmpleadoParaConfirmar(null);
    setScanInput('');
    setIsScanModalOpen(true);
  };

  // Navegación de fechas
  const cambiarFecha = (dias: number) => {
    const nuevaFecha = new Date(fechaSeleccionada);
    nuevaFecha.setDate(nuevaFecha.getDate() + dias);
    setFechaSeleccionada(nuevaFecha.toISOString().split('T')[0]);
  };

  const irAHoy = () => {
    setFechaSeleccionada(hoy);
  };

  const getCargoColor = (cargo: string) => {
    switch (cargo) {
      case 'Secretaria':
        return 'bg-purple-500/20 text-purple-200 border-purple-500/30';
      case 'Producción':
        return 'bg-blue-500/20 text-blue-200 border-blue-500/30';
      case 'Pesaje':
        return 'bg-green-500/20 text-green-200 border-green-500/30';
      case 'Seguridad':
        return 'bg-red-500/20 text-red-200 border-red-500/30';
      case 'Operadora':
        return 'bg-amber-500/20 text-amber-200 border-amber-500/30';
      default:
        return 'bg-gray-500/20 text-gray-200 border-gray-500/30';
    }
  };

  const formatearFecha = (fecha: string) => {
    const f = new Date(fecha + 'T00:00:00');
    return f.toLocaleDateString('es-PE', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl text-white flex items-center gap-3">
            <UserCheck className="w-8 h-8 text-amber-400" />
            Asistencia
          </h1>
          <p className="text-gray-400 mt-1">
            Control de asistencia de empleados
          </p>
        </div>
        <button
          onClick={handleOpenScanModal}
          className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-black px-4 py-2.5 rounded-lg flex items-center gap-2 transition-all shadow-lg shadow-amber-500/20 whitespace-nowrap"
        >
          <ScanLine className="w-5 h-5" />
          Registrar Asistencia
        </button>
      </div>

      {/* Navegación de Fechas */}
      <div className="bg-gradient-to-br from-zinc-900 to-zinc-800 border border-zinc-700 rounded-xl p-5">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => cambiarFecha(-1)}
              className="p-2 hover:bg-zinc-700 rounded-lg transition-colors text-gray-300"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            
            <div className="text-center px-4">
              <div className="flex items-center justify-center gap-3 mb-2">
                <Calendar className="w-5 h-5 text-amber-400" />
                <h2 className="text-xl text-white capitalize">
                  {formatearFecha(fechaSeleccionada)}
                </h2>
              </div>
              {fechaSeleccionada !== hoy && (
                <button
                  onClick={irAHoy}
                  className="text-sm text-amber-400 hover:text-amber-300 transition-colors"
                >
                  Ir a hoy
                </button>
              )}
            </div>
            
            <button
              onClick={() => cambiarFecha(1)}
              className="p-2 hover:bg-zinc-700 rounded-lg transition-colors text-gray-300"
              disabled={fechaSeleccionada >= hoy}
            >
              <ChevronRight className={`w-5 h-5 ${fechaSeleccionada >= hoy ? 'opacity-30' : ''}`} />
            </button>
          </div>

          {/* Selector rápido de fecha */}
          <div className="flex items-center gap-2">
            <label className="text-gray-400 text-sm whitespace-nowrap">Ir a fecha:</label>
            <input
              type="date"
              value={fechaSeleccionada}
              onChange={(e) => setFechaSeleccionada(e.target.value)}
              max={hoy}
              className="bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500"
            />
          </div>
        </div>
      </div>

      {/* Métricas del Día */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-zinc-900 to-zinc-800 border border-zinc-700 rounded-xl p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Total Empleados</p>
              <p className="text-3xl text-white mt-1">{totalEmpleados}</p>
            </div>
            <div className="bg-amber-500/20 p-3 rounded-lg">
              <Users className="w-8 h-8 text-amber-400" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-zinc-900 to-zinc-800 border border-zinc-700 rounded-xl p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Presentes</p>
              <p className="text-3xl text-white mt-1">{presentes}</p>
            </div>
            <div className="bg-green-500/20 p-3 rounded-lg">
              <CheckCircle className="w-8 h-8 text-green-400" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-zinc-900 to-zinc-800 border border-zinc-700 rounded-xl p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Ausentes</p>
              <p className="text-3xl text-white mt-1">{ausentes}</p>
            </div>
            <div className="bg-red-500/20 p-3 rounded-lg">
              <XCircle className="w-8 h-8 text-red-400" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-zinc-900 to-zinc-800 border border-zinc-700 rounded-xl p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Tardanzas</p>
              <p className="text-3xl text-white mt-1">{tardanzas}</p>
            </div>
            <div className="bg-orange-500/20 p-3 rounded-lg">
              <Clock className="w-8 h-8 text-orange-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-gradient-to-br from-zinc-900 to-zinc-800 border border-zinc-700 rounded-xl p-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Búsqueda */}
          <div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Buscar empleado..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg pl-10 pr-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500"
              />
            </div>
          </div>

          {/* Filtro por Estado */}
          <div>
            <select
              value={filterEstado}
              onChange={(e) => setFilterEstado(e.target.value)}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500"
            >
              <option value="all">Todos los estados</option>
              <option value="Presente">Presentes</option>
              <option value="Tardanza">Tardanzas</option>
            </select>
          </div>
        </div>
      </div>

      {/* Empleados Ausentes (solo si hay ausentes hoy) */}
      {fechaSeleccionada === hoy && empleadosAusentes.length > 0 && (
        <div className="bg-gradient-to-br from-red-900/20 to-red-800/10 border border-red-500/30 rounded-xl p-5">
          <h3 className="text-white flex items-center gap-2 mb-3">
            <XCircle className="w-5 h-5 text-red-400" />
            Empleados sin Registro de Entrada ({empleadosAusentes.length})
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {empleadosAusentes.map(emp => (
              <div key={emp.id} className="bg-zinc-900/50 border border-zinc-700 rounded-lg p-3 flex items-center gap-3">
                {emp.foto ? (
                  <img 
                    src={emp.foto} 
                    alt={emp.nombre}
                    className="w-10 h-10 rounded-full object-cover border-2 border-red-500/30"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-zinc-800 border-2 border-zinc-700 flex items-center justify-center">
                    <User className="w-5 h-5 text-gray-500" />
                  </div>
                )}
                <div className="flex-1">
                  <p className="text-white text-sm">{emp.nombre} {emp.apellidos}</p>
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border ${getCargoColor(emp.cargo)}`}>
                    {emp.cargo}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Lista de Asistencia */}
      <div className="bg-gradient-to-br from-zinc-900 to-zinc-800 border border-zinc-700 rounded-xl overflow-hidden">
        {/* Desktop View */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full">
            <thead className="bg-zinc-800/50 border-b border-zinc-700">
              <tr>
                <th className="text-left px-6 py-4 text-gray-400 text-sm">Empleado</th>
                <th className="text-left px-6 py-4 text-gray-400 text-sm">Cargo</th>
                <th className="text-left px-6 py-4 text-gray-400 text-sm">Hora Entrada</th>
                <th className="text-left px-6 py-4 text-gray-400 text-sm">Hora Salida</th>
                <th className="text-left px-6 py-4 text-gray-400 text-sm">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {registrosFiltrados.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                    No hay registros de asistencia para este día
                  </td>
                </tr>
              ) : (
                registrosFiltrados.map((registro) => (
                  <tr key={registro.id} className="hover:bg-zinc-800/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {registro.empleadoFoto ? (
                          <img 
                            src={registro.empleadoFoto} 
                            alt={registro.empleadoNombre}
                            className="w-10 h-10 rounded-full object-cover border-2 border-amber-500/30"
                          />
                        ) : (
                          <div className="bg-amber-500/20 p-2 rounded-full">
                            <UserCheck className="w-6 h-6 text-amber-400" />
                          </div>
                        )}
                        <p className="text-white">{registro.empleadoNombre}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm border ${getCargoColor(registro.empleadoCargo)}`}>
                        {registro.empleadoCargo}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-gray-300">
                        <Clock className="w-4 h-4 text-gray-500" />
                        {registro.horaEntrada}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {registro.horaSalida ? (
                        <div className="flex items-center gap-2 text-gray-300">
                          <Clock className="w-4 h-4 text-gray-500" />
                          {registro.horaSalida}
                        </div>
                      ) : (
                        <span className="text-gray-500 text-sm">Pendiente</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm border ${
                        registro.estado === 'Presente'
                          ? 'bg-green-500/20 text-green-200 border-green-500/30'
                          : registro.estado === 'Tardanza'
                          ? 'bg-orange-500/20 text-orange-200 border-orange-500/30'
                          : 'bg-red-500/20 text-red-200 border-red-500/30'
                      }`}>
                        {registro.estado === 'Presente' && <CheckCircle className="w-4 h-4" />}
                        {registro.estado === 'Tardanza' && <Clock className="w-4 h-4" />}
                        {registro.estado === 'Ausente' && <XCircle className="w-4 h-4" />}
                        {registro.estado}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile/Tablet View */}
        <div className="lg:hidden divide-y divide-zinc-800">
          {registrosFiltrados.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              No hay registros de asistencia para este día
            </div>
          ) : (
            registrosFiltrados.map((registro) => (
              <div key={registro.id} className="p-5 hover:bg-zinc-800/30 transition-colors">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    {registro.empleadoFoto ? (
                      <img 
                        src={registro.empleadoFoto} 
                        alt={registro.empleadoNombre}
                        className="w-12 h-12 rounded-full object-cover border-2 border-amber-500/30"
                      />
                    ) : (
                      <div className="bg-amber-500/20 p-2 rounded-full">
                        <UserCheck className="w-6 h-6 text-amber-400" />
                      </div>
                    )}
                    <div>
                      <p className="text-white">{registro.empleadoNombre}</p>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border mt-1 ${getCargoColor(registro.empleadoCargo)}`}>
                        {registro.empleadoCargo}
                      </span>
                    </div>
                  </div>
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs border ${
                    registro.estado === 'Presente'
                      ? 'bg-green-500/20 text-green-200 border-green-500/30'
                      : registro.estado === 'Tardanza'
                      ? 'bg-orange-500/20 text-orange-200 border-orange-500/30'
                      : 'bg-red-500/20 text-red-200 border-red-500/30'
                  }`}>
                    {registro.estado === 'Presente' && <CheckCircle className="w-3 h-3" />}
                    {registro.estado === 'Tardanza' && <Clock className="w-3 h-3" />}
                    {registro.estado === 'Ausente' && <XCircle className="w-3 h-3" />}
                    {registro.estado}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-gray-500 mb-1">Entrada</p>
                    <div className="flex items-center gap-2 text-gray-300">
                      <Clock className="w-4 h-4 text-gray-500" />
                      {registro.horaEntrada}
                    </div>
                  </div>
                  <div>
                    <p className="text-gray-500 mb-1">Salida</p>
                    {registro.horaSalida ? (
                      <div className="flex items-center gap-2 text-gray-300">
                        <Clock className="w-4 h-4 text-gray-500" />
                        {registro.horaSalida}
                      </div>
                    ) : (
                      <span className="text-gray-500 text-sm">Pendiente</span>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Modal de Registro (Escáner/Manual) */}
      {isScanModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-zinc-900 to-zinc-800 border border-zinc-700 rounded-xl w-full max-w-md">
            <div className="border-b border-zinc-700 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl text-white flex items-center gap-2">
                <ScanLine className="w-6 h-6 text-amber-400" />
                Registrar Asistencia
              </h2>
              <button
                onClick={() => {
                  setIsScanModalOpen(false);
                  setScanInput('');
                }}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleScanSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-gray-400 text-sm mb-2">
                  ID del Empleado
                </label>
                <input
                  type="text"
                  value={scanInput}
                  onChange={(e) => setScanInput(e.target.value)}
                  placeholder="Ingrese o escanee el ID..."
                  autoFocus
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-white text-center text-2xl tracking-wider focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500"
                />
              </div>

              <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                <p className="text-blue-200 text-sm mb-2">
                  <strong>Instrucciones:</strong>
                </p>
                <ul className="text-blue-300 text-xs space-y-1 list-disc list-inside">
                  <li>Escanee el ID del empleado con el lector</li>
                  <li>O ingrese manualmente el ID si el empleado lo olvidó</li>
                  <li>El sistema mostrará la foto para confirmar identidad</li>
                </ul>
              </div>

              {empleados.length > 0 && (
                <div className="bg-zinc-800/50 border border-zinc-700 rounded-lg p-3 max-h-48 overflow-y-auto">
                  <p className="text-gray-400 text-xs mb-2">IDs disponibles:</p>
                  <div className="space-y-1">
                    {empleados.map(emp => (
                      <button
                        key={emp.id}
                        type="button"
                        onClick={() => setScanInput(emp.id)}
                        className="w-full text-left text-xs text-gray-300 hover:text-amber-400 transition-colors px-2 py-1 hover:bg-zinc-700 rounded"
                      >
                        ID {emp.id}: {emp.nombre} {emp.apellidos}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsScanModalOpen(false);
                    setScanInput('');
                  }}
                  className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-white px-6 py-3 rounded-lg transition-colors border border-zinc-700"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-black px-6 py-3 rounded-lg transition-all shadow-lg shadow-amber-500/20"
                >
                  Continuar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Confirmación con Foto */}
      {isConfirmModalOpen && empleadoParaConfirmar && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-zinc-900 to-zinc-800 border border-zinc-700 rounded-xl w-full max-w-lg">
            <div className="border-b border-zinc-700 px-6 py-4">
              <h2 className="text-xl text-white flex items-center gap-2">
                <AlertCircle className="w-6 h-6 text-amber-400" />
                Confirmar Identidad
              </h2>
            </div>

            <div className="p-6">
              <div className="flex flex-col items-center text-center space-y-4">
                {/* Foto del empleado */}
                {empleadoParaConfirmar.foto ? (
                  <img 
                    src={empleadoParaConfirmar.foto} 
                    alt={empleadoParaConfirmar.nombre}
                    className="w-32 h-32 rounded-full object-cover border-4 border-amber-500/50 shadow-lg"
                  />
                ) : (
                  <div className="w-32 h-32 rounded-full bg-zinc-800 border-4 border-amber-500/50 flex items-center justify-center">
                    <User className="w-16 h-16 text-gray-500" />
                  </div>
                )}

                {/* Información del empleado */}
                <div>
                  <h3 className="text-2xl text-white mb-1">
                    {empleadoParaConfirmar.nombre} {empleadoParaConfirmar.apellidos}
                  </h3>
                  <p className="text-gray-400 mb-2">DNI: {empleadoParaConfirmar.dni}</p>
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm border ${getCargoColor(empleadoParaConfirmar.cargo)}`}>
                    {empleadoParaConfirmar.cargo}
                  </span>
                </div>

                {/* Tipo de registro */}
                <div className={`w-full p-4 rounded-lg border ${
                  tipoRegistro === 'entrada'
                    ? 'bg-green-500/10 border-green-500/30'
                    : 'bg-blue-500/10 border-blue-500/30'
                }`}>
                  <p className={`text-lg ${tipoRegistro === 'entrada' ? 'text-green-200' : 'text-blue-200'}`}>
                    Registrando: <strong className="uppercase">{tipoRegistro}</strong>
                  </p>
                  <p className="text-gray-400 text-sm mt-1">
                    {new Date().toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>

                {/* Pregunta de confirmación */}
                <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4 w-full">
                  <p className="text-amber-200">
                    ¿Es esta la persona que está registrando {tipoRegistro}?
                  </p>
                </div>
              </div>

              {/* Botones de acción */}
              <div className="flex gap-3 mt-6">
                <button
                  onClick={cancelarRegistro}
                  className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-white px-6 py-3 rounded-lg transition-colors border border-zinc-700"
                >
                  No, Cancelar
                </button>
                <button
                  onClick={confirmarRegistro}
                  className="flex-1 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-6 py-3 rounded-lg transition-all shadow-lg shadow-green-500/20"
                >
                  Sí, Confirmar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}