import { useState } from 'react';
import { Shield, Search, Filter, Calendar, User, Activity, FileText, Eye, Clock, CheckCircle, XCircle, AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react';
import { useApp } from '../contexts/AppContext';

interface AuditoriaLog {
  id: string;
  usuario: string;
  cargo: string;
  accion: string;
  modulo: string;
  detalles: string;
  fecha: string;
  hora: string;
  tipo: 'crear' | 'editar' | 'eliminar' | 'ver' | 'exportar' | 'acceso';
  estado: 'exitoso' | 'fallido' | 'advertencia';
  ip?: string;
}

interface LogsPorDia {
  fecha: string;
  fechaFormateada: string;
  logs: AuditoriaLog[];
  estadisticas: {
    total: number;
    exitosos: number;
    fallidos: number;
    advertencias: number;
  };
}

export function Auditoria() {
  const { empleados } = useApp();
  const [busqueda, setBusqueda] = useState('');
  const [filtroUsuario, setFiltroUsuario] = useState('');
  const [filtroModulo, setFiltroModulo] = useState('');
  const [filtroTipo, setFiltroTipo] = useState('');
  const [filtroFecha, setFiltroFecha] = useState('');
  const [diasExpandidos, setDiasExpandidos] = useState<Set<string>>(new Set(['2025-02-03']));
  const [mostrarDetalles, setMostrarDetalles] = useState<string | null>(null);

  // Logs de auditoría - se llenarán con acciones reales del sistema
  const logsAuditoria: AuditoriaLog[] = [];

  // Filtrar logs
  const logsFiltrados = logsAuditoria.filter(log => {
    const matchBusqueda = 
      log.usuario.toLowerCase().includes(busqueda.toLowerCase()) ||
      log.accion.toLowerCase().includes(busqueda.toLowerCase()) ||
      log.detalles.toLowerCase().includes(busqueda.toLowerCase());
    
    const matchUsuario = !filtroUsuario || log.usuario === filtroUsuario;
    const matchModulo = !filtroModulo || log.modulo === filtroModulo;
    const matchTipo = !filtroTipo || log.tipo === filtroTipo;
    const matchFecha = !filtroFecha || log.fecha === filtroFecha;

    return matchBusqueda && matchUsuario && matchModulo && matchTipo && matchFecha;
  });

  // Agrupar logs por día
  const logsPorDia: LogsPorDia[] = [];
  const diasMap = new Map<string, AuditoriaLog[]>();

  logsFiltrados.forEach(log => {
    if (!diasMap.has(log.fecha)) {
      diasMap.set(log.fecha, []);
    }
    diasMap.get(log.fecha)?.push(log);
  });

  // Convertir a array y ordenar por fecha (más reciente primero)
  Array.from(diasMap.entries())
    .sort(([fechaA], [fechaB]) => fechaB.localeCompare(fechaA))
    .forEach(([fecha, logs]) => {
      // Ordenar logs del día por hora (más reciente primero)
      logs.sort((a, b) => b.hora.localeCompare(a.hora));

      const exitosos = logs.filter(l => l.estado === 'exitoso').length;
      const fallidos = logs.filter(l => l.estado === 'fallido').length;
      const advertencias = logs.filter(l => l.estado === 'advertencia').length;

      // Formatear fecha
      const [year, month, day] = fecha.split('-');
      const fechaObj = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      const diasSemana = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
      const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
      const fechaFormateada = `${diasSemana[fechaObj.getDay()]}, ${day} de ${meses[parseInt(month) - 1]} de ${year}`;

      logsPorDia.push({
        fecha,
        fechaFormateada,
        logs,
        estadisticas: {
          total: logs.length,
          exitosos,
          fallidos,
          advertencias
        }
      });
    });

  // Obtener listas únicas para filtros
  const usuariosUnicos = Array.from(new Set(logsAuditoria.map(log => log.usuario)));
  const modulosUnicos = Array.from(new Set(logsAuditoria.map(log => log.modulo)));

  // Obtener fechas únicas para acceso rápido
  const fechasDisponibles = Array.from(new Set(logsAuditoria.map(log => log.fecha))).sort((a, b) => b.localeCompare(a));

  // Estadísticas generales
  const estadisticasGenerales = {
    total: logsAuditoria.length,
    exitosos: logsAuditoria.filter(l => l.estado === 'exitoso').length,
    fallidos: logsAuditoria.filter(l => l.estado === 'fallido').length,
    advertencias: logsAuditoria.filter(l => l.estado === 'advertencia').length,
  };

  const getTipoColor = (tipo: string) => {
    switch (tipo) {
      case 'crear': return 'text-green-400 bg-green-500/10 border-green-500/30';
      case 'editar': return 'text-blue-400 bg-blue-500/10 border-blue-500/30';
      case 'eliminar': return 'text-red-400 bg-red-500/10 border-red-500/30';
      case 'ver': return 'text-purple-400 bg-purple-500/10 border-purple-500/30';
      case 'exportar': return 'text-amber-400 bg-amber-500/10 border-amber-500/30';
      case 'acceso': return 'text-gray-400 bg-gray-500/10 border-gray-500/30';
      default: return 'text-gray-400 bg-gray-500/10 border-gray-500/30';
    }
  };

  const getTipoIcono = (tipo: string) => {
    switch (tipo) {
      case 'crear': return '+';
      case 'editar': return '✎';
      case 'eliminar': return '×';
      case 'ver': return '👁';
      case 'exportar': return '↓';
      case 'acceso': return '→';
      default: return '•';
    }
  };

  const getEstadoIcon = (estado: string) => {
    switch (estado) {
      case 'exitoso': return <CheckCircle className="w-5 h-5 text-green-400" />;
      case 'fallido': return <XCircle className="w-5 h-5 text-red-400" />;
      case 'advertencia': return <AlertTriangle className="w-5 h-5 text-amber-400" />;
      default: return <CheckCircle className="w-5 h-5 text-gray-400" />;
    }
  };

  const limpiarFiltros = () => {
    setBusqueda('');
    setFiltroUsuario('');
    setFiltroModulo('');
    setFiltroTipo('');
    setFiltroFecha('');
  };

  const toggleDia = (fecha: string) => {
    const newSet = new Set(diasExpandidos);
    if (newSet.has(fecha)) {
      newSet.delete(fecha);
    } else {
      newSet.add(fecha);
    }
    setDiasExpandidos(newSet);
  };

  const expandirTodos = () => {
    setDiasExpandidos(new Set(logsPorDia.map(d => d.fecha)));
  };

  const contraerTodos = () => {
    setDiasExpandidos(new Set());
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl text-white flex items-center gap-3">
            <Shield className="w-8 h-8 text-amber-400" />
            Auditoría del Sistema
          </h1>
          <p className="text-gray-400 mt-1">
            Registro completo de acciones organizadas por día
          </p>
        </div>
      </div>

      {/* Estadísticas Generales */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-zinc-900 to-zinc-800 border border-zinc-700 rounded-xl p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm mb-1">Total Acciones</p>
              <p className="text-3xl text-white">{estadisticasGenerales.total}</p>
            </div>
            <Activity className="w-10 h-10 text-amber-400 opacity-50" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-zinc-900 to-zinc-800 border border-zinc-700 rounded-xl p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm mb-1">Exitosas</p>
              <p className="text-3xl text-green-400">{estadisticasGenerales.exitosos}</p>
            </div>
            <CheckCircle className="w-10 h-10 text-green-400 opacity-50" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-zinc-900 to-zinc-800 border border-zinc-700 rounded-xl p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm mb-1">Fallidas</p>
              <p className="text-3xl text-red-400">{estadisticasGenerales.fallidos}</p>
            </div>
            <XCircle className="w-10 h-10 text-red-400 opacity-50" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-zinc-900 to-zinc-800 border border-zinc-700 rounded-xl p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm mb-1">Advertencias</p>
              <p className="text-3xl text-amber-400">{estadisticasGenerales.advertencias}</p>
            </div>
            <AlertTriangle className="w-10 h-10 text-amber-400 opacity-50" />
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-gradient-to-br from-zinc-900 to-zinc-800 border border-zinc-700 rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-5 h-5 text-amber-400" />
          <h3 className="text-white">Filtros de Búsqueda</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Búsqueda General */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* Filtro Usuario */}
          <select
            value={filtroUsuario}
            onChange={(e) => setFiltroUsuario(e.target.value)}
            className="px-4 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-amber-500"
          >
            <option value="">Todos los usuarios</option>
            {usuariosUnicos.map(usuario => (
              <option key={usuario} value={usuario}>{usuario}</option>
            ))}
          </select>

          {/* Filtro Módulo */}
          <select
            value={filtroModulo}
            onChange={(e) => setFiltroModulo(e.target.value)}
            className="px-4 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-amber-500"
          >
            <option value="">Todos los módulos</option>
            {modulosUnicos.map(modulo => (
              <option key={modulo} value={modulo}>{modulo}</option>
            ))}
          </select>

          {/* Filtro Tipo */}
          <select
            value={filtroTipo}
            onChange={(e) => setFiltroTipo(e.target.value)}
            className="px-4 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-amber-500"
          >
            <option value="">Todos los tipos</option>
            <option value="crear">Crear</option>
            <option value="editar">Editar</option>
            <option value="eliminar">Eliminar</option>
            <option value="ver">Ver</option>
            <option value="exportar">Exportar</option>
            <option value="acceso">Acceso</option>
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
            Mostrando {logsFiltrados.length} de {logsAuditoria.length} registros
          </p>
          <div className="flex gap-3">
            <button
              onClick={limpiarFiltros}
              className="text-amber-400 hover:text-amber-300 text-sm transition-colors"
            >
              Limpiar filtros
            </button>
            <span className="text-gray-600">|</span>
            <button
              onClick={expandirTodos}
              className="text-amber-400 hover:text-amber-300 text-sm transition-colors"
            >
              Expandir todos
            </button>
            <button
              onClick={contraerTodos}
              className="text-amber-400 hover:text-amber-300 text-sm transition-colors"
            >
              Contraer todos
            </button>
          </div>
        </div>
      </div>

      {/* Acceso Rápido por Fecha */}
      <div className="bg-gradient-to-br from-zinc-900 to-zinc-800 border border-zinc-700 rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="w-5 h-5 text-amber-400" />
          <h3 className="text-white">Acceso Rápido por Fecha</h3>
        </div>

        <div className="flex flex-wrap gap-3">
          {fechasDisponibles.map((fecha) => {
            const [year, month, day] = fecha.split('-');
            const fechaObj = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
            const diasSemana = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
            const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
            const fechaCorta = `${diasSemana[fechaObj.getDay()]} ${day} ${meses[parseInt(month) - 1]}`;
            
            const logsDelDia = logsAuditoria.filter(log => log.fecha === fecha);
            const exitosos = logsDelDia.filter(l => l.estado === 'exitoso').length;
            const fallidos = logsDelDia.filter(l => l.estado === 'fallido').length;
            const advertencias = logsDelDia.filter(l => l.estado === 'advertencia').length;

            return (
              <button
                key={fecha}
                onClick={() => {
                  setFiltroFecha(fecha);
                  setDiasExpandidos(new Set([fecha]));
                }}
                className={`px-4 py-3 rounded-xl border transition-all ${
                  filtroFecha === fecha
                    ? 'bg-gradient-to-br from-amber-500 to-amber-600 border-amber-400 text-black'
                    : 'bg-zinc-800 border-zinc-700 text-white hover:border-amber-500 hover:bg-zinc-700'
                }`}
              >
                <div className="flex flex-col items-center">
                  <span className="text-sm font-medium mb-1">{fechaCorta}</span>
                  <div className="flex items-center gap-2 text-xs">
                    <span className={filtroFecha === fecha ? 'text-black/70' : 'text-gray-400'}>
                      {logsDelDia.length} acciones
                    </span>
                  </div>
                  {(fallidos > 0 || advertencias > 0) && (
                    <div className="flex items-center gap-1 mt-1">
                      {fallidos > 0 && (
                        <span className={`text-xs ${filtroFecha === fecha ? 'text-black' : 'text-red-400'}`}>
                          ⚠ {fallidos}
                        </span>
                      )}
                      {advertencias > 0 && (
                        <span className={`text-xs ${filtroFecha === fecha ? 'text-black' : 'text-amber-400'}`}>
                          ⚡ {advertencias}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Timeline por día */}
      <div className="space-y-4">
        {logsPorDia.map((dia) => (
          <div
            key={dia.fecha}
            className="bg-gradient-to-br from-zinc-900 to-zinc-800 border border-zinc-700 rounded-xl overflow-hidden"
          >
            {/* Header del día */}
            <button
              onClick={() => toggleDia(dia.fecha)}
              className="w-full px-6 py-5 flex items-center justify-between hover:bg-zinc-800/50 transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className="bg-gradient-to-br from-amber-500 to-amber-600 p-3 rounded-xl text-black">
                  <Calendar className="w-6 h-6" />
                </div>
                <div className="text-left">
                  <h3 className="text-white text-lg">{dia.fechaFormateada}</h3>
                  <div className="flex items-center gap-4 mt-1">
                    <span className="text-gray-400 text-sm flex items-center gap-1.5">
                      <Activity className="w-4 h-4" />
                      {dia.estadisticas.total} acciones
                    </span>
                    <span className="text-green-400 text-sm flex items-center gap-1.5">
                      <CheckCircle className="w-4 h-4" />
                      {dia.estadisticas.exitosos}
                    </span>
                    {dia.estadisticas.fallidos > 0 && (
                      <span className="text-red-400 text-sm flex items-center gap-1.5">
                        <XCircle className="w-4 h-4" />
                        {dia.estadisticas.fallidos}
                      </span>
                    )}
                    {dia.estadisticas.advertencias > 0 && (
                      <span className="text-amber-400 text-sm flex items-center gap-1.5">
                        <AlertTriangle className="w-4 h-4" />
                        {dia.estadisticas.advertencias}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              {diasExpandidos.has(dia.fecha) ? (
                <ChevronUp className="w-6 h-6 text-gray-400" />
              ) : (
                <ChevronDown className="w-6 h-6 text-gray-400" />
              )}
            </button>

            {/* Logs del día */}
            {diasExpandidos.has(dia.fecha) && (
              <div className="border-t border-zinc-700">
                {dia.logs.map((log, index) => (
                  <div
                    key={log.id}
                    className={`border-b border-zinc-800 last:border-b-0 ${
                      mostrarDetalles === log.id ? 'bg-zinc-800/30' : ''
                    }`}
                  >
                    <div className="px-6 py-4 hover:bg-zinc-800/20 transition-colors">
                      <div className="flex items-start gap-4">
                        {/* Timeline indicator */}
                        <div className="flex flex-col items-center">
                          <div className="flex items-center justify-center">
                            {getEstadoIcon(log.estado)}
                          </div>
                          {index < dia.logs.length - 1 && (
                            <div className="w-px h-full bg-zinc-700 mt-2"></div>
                          )}
                        </div>

                        {/* Contenido */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              {/* Usuario y hora */}
                              <div className="flex items-center gap-3 mb-2">
                                <div className="flex items-center gap-2">
                                  <User className="w-4 h-4 text-gray-400" />
                                  <span className="text-white">{log.usuario}</span>
                                  <span className="text-gray-500 text-sm">({log.cargo})</span>
                                </div>
                                <span className="text-gray-600">•</span>
                                <div className="flex items-center gap-1.5 text-gray-400 text-sm">
                                  <Clock className="w-4 h-4" />
                                  {log.hora}
                                </div>
                              </div>

                              {/* Acción */}
                              <div className="flex items-center gap-3 mb-2">
                                <span className={`px-3 py-1 rounded-lg text-xs border ${getTipoColor(log.tipo)}`}>
                                  <span className="mr-1.5">{getTipoIcono(log.tipo)}</span>
                                  {log.tipo}
                                </span>
                                <span className="text-white">{log.accion}</span>
                                <span className="text-gray-600">en</span>
                                <span className="text-amber-400">{log.modulo}</span>
                              </div>

                              {/* Detalles expandibles */}
                              {mostrarDetalles === log.id && (
                                <div className="mt-3 pt-3 border-t border-zinc-700">
                                  <div className="flex items-start gap-2 mb-2">
                                    <FileText className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
                                    <div>
                                      <p className="text-gray-400 text-sm mb-1">Detalles:</p>
                                      <p className="text-white text-sm">{log.detalles}</p>
                                    </div>
                                  </div>
                                  {log.ip && (
                                    <div className="flex items-center gap-2 mt-2">
                                      <Activity className="w-4 h-4 text-gray-400" />
                                      <p className="text-gray-400 text-sm">
                                        Dirección IP: <span className="text-white">{log.ip}</span>
                                      </p>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>

                            {/* Botón ver detalles */}
                            <button
                              onClick={() => setMostrarDetalles(mostrarDetalles === log.id ? null : log.id)}
                              className="text-amber-400 hover:text-amber-300 transition-colors flex-shrink-0"
                            >
                              <Eye className="w-5 h-5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}

        {logsPorDia.length === 0 && (
          <div className="bg-gradient-to-br from-zinc-900 to-zinc-800 border border-zinc-700 rounded-xl p-12 text-center">
            <Shield className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400">No se encontraron registros con los filtros aplicados</p>
          </div>
        )}
      </div>
    </div>
  );
}