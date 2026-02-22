import { useState, useEffect } from 'react';
import { useApp } from '../contexts/AppContext';
import { Factory, Clock, Monitor, Layers, Package, Users, Truck, Box, Hash, User as UserIcon, AlertCircle, CheckCircle, Calendar, ChevronRight, Play, Pause } from 'lucide-react';
import logo from '../assets/AvicolaLogo.png';

export function PantallaProduccion() {
  const { pedidosConfirmados } = useApp();
  const [horaActual, setHoraActual] = useState(new Date());
  const [produccionActiva, setProduccionActiva] = useState(true);
  const [tiempoTranscurrido, setTiempoTranscurrido] = useState(0);

  useEffect(() => {
    document.title = "Cola de Producción | Avícola Jossy";
  }, []);
  
  // Contador de tiempo de producción
  useEffect(() => {
    const intervalo = setInterval(() => {
      setTiempoTranscurrido(prev => prev + 1);
    }, 1000);
    
    return () => clearInterval(intervalo);
  }, []);

  // Formatear tiempo transcurrido
  const formatearTiempoTranscurrido = (segundos: number) => {
    const horas = Math.floor(segundos / 3600);
    const minutos = Math.floor((segundos % 3600) / 60);
    const segs = segundos % 60;
    
    return `${horas.toString().padStart(2, '0')}:${minutos.toString().padStart(2, '0')}:${segs.toString().padStart(2, '0')}`;
  };

  // Forzar fondo negro
  useEffect(() => {
    document.body.style.backgroundColor = '#000000';
    document.body.style.backgroundImage = 'radial-gradient(circle at 50% 50%, rgba(30, 30, 30, 0.3) 0%, rgba(0, 0, 0, 1) 70%)';
    return () => {
      document.body.style.backgroundColor = '';
      document.body.style.backgroundImage = '';
    };
  }, []);

  // Actualizar hora cada segundo
  useEffect(() => {
    const timer = setInterval(() => {
      setHoraActual(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Filtrar y ordenar pedidos en producción (cola FIFO por prioridad)
  const pedidosEnProduccion = pedidosConfirmados
    .filter(p => p.estado === 'En Producción')
    .sort((a, b) => {
      if (a.prioridad !== b.prioridad) return a.prioridad - b.prioridad;
      return (a.hora || '').localeCompare(b.hora || '');
    });

  // Función para extraer información de género del string tipoAve
  const extraerInfoGenero = (tipoAve: string): { machos: number; hembras: number } | null => {
    const match = tipoAve.match(/\(M:(\d+),\s*H:(\d+)\)/);
    if (match) {
      return {
        machos: parseInt(match[1]),
        hembras: parseInt(match[2])
      };
    }
    return null;
  };

  // Extraer variedad si existe
  const extraerVariedad = (tipoAve: string): string | null => {
    const matchParen = tipoAve.match(/\((?!M:|H:)(.*?)\)/);
    if (matchParen) return matchParen[1];
    
    const matchDash = tipoAve.match(/ - ([^(]+)/);
    if (matchDash) return matchDash[1].trim();
    
    return null;
  };

  // Extraer tipo de ave base (sin sexo/variedad)
  const extraerTipoAveBase = (tipoAve: string): string => {
    const sinGenero = tipoAve.replace(/\(M:\d+,\s*H:\d+\)/g, '').trim();
    const sinVariedad = sinGenero.replace(/\(.*?\)/g, '').trim();
    const tipoBase = sinVariedad.replace(/-.*$/, '').trim();
    return tipoBase || tipoAve;
  };

  // Calcular totales
  const totalAves = pedidosEnProduccion.reduce((acc, p) => acc + p.cantidad, 0);
  const totalMachos = pedidosEnProduccion.reduce((acc, p) => {
    const info = extraerInfoGenero(p.tipoAve);
    return acc + (info?.machos || 0);
  }, 0);
  const totalHembras = pedidosEnProduccion.reduce((acc, p) => {
    const info = extraerInfoGenero(p.tipoAve);
    return acc + (info?.hembras || 0);
  }, 0);

  // Formatear hora
  const formatearHora = (date: Date) => {
    return date.toLocaleTimeString('es-PE', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
  };

  const formatearFecha = (date: Date) => {
    return date.toLocaleDateString('es-PE', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    }).toUpperCase();
  };

  // Obtener hora actual para el reloj analógico
  const horas = horaActual.getHours() % 12;
  const minutos = horaActual.getMinutes();
  const segundos = horaActual.getSeconds();

  return (
    <div className="fixed inset-0 bg-black text-gray-300 font-sans overflow-hidden p-4 md:p-6">
      {/* Header mejorado */}
      <div className="mb-6 md:mb-8">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-4">
          <div className="space-y-2 flex-1">
            <div className="flex items-center gap-4">
              <div className="p-1 bg-black border border-amber-500/30 rounded-xl shadow-lg overflow-hidden flex items-center justify-center w-14 h-14 md:w-20 md:h-20">
                <img src={logo} alt="Avícola Rocío" className="w-full h-full object-contain" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white tracking-tight">
                COLA DE PEDIDOS
                </h1>
                <p className="text-gray-400 text-sm md:text-base mt-1">
                  Monitoreo de pedidos
                </p>
              </div>
            </div>
          </div>
          
          {/* Reloj digital grande y destacado CON LOGO */}
          <div className="flex flex-col items-end space-y-2">
            <div className="text-right">
              <div className="flex items-center justify-end gap-2 mb-1">
                <Calendar className="w-4 h-4 text-amber-400" />
                <div className="text-sm md:text-base text-gray-300 font-semibold tracking-wide">
                  {formatearFecha(horaActual)}
                </div>
              </div>
              <div className="flex items-center gap-4 md:gap-6">
                {/* Logo de la empresa - A la izquierda del reloj */}
                <div className="hidden md:flex items-center">
                  <div className="relative">

                    {/* Efecto de brillo */}
                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-amber-500/10 via-transparent to-amber-500/5 pointer-events-none"></div>
                  </div>
                  {/* Separador decorativo */}
                  <div className="h-20 w-px bg-gradient-to-b from-transparent via-gray-800 to-transparent mx-4"></div>
                </div>
                {/* Reloj */}
                <div className="flex items-center gap-3 md:gap-4">
                  {/* Reloj analógico */}
                
                  {/* Reloj digital */}
                  <div className="text-right">
                    <div className="text-3xl md:text-4xl lg:text-5xl font-bold text-white font-mono tracking-tighter leading-none">
                      {formatearHora(horaActual)}
                    </div>
                    <div className="text-xs md:text-sm text-gray-400 mt-1 flex items-center justify-end gap-2">
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse shadow-lg"></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Indicadores de estado */}
        <div className="flex flex-wrap items-center gap-4 mt-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${produccionActiva ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
              <span className="text-sm font-semibold">{produccionActiva ? 'PRODUCCIÓN ACTIVA' : 'PRODUCCIÓN PAUSADA'}</span>
            </div>
          </div>
          <div className="flex-1"></div>
        </div>
      </div>
      
      {/* Lista de Pedidos - Mejorada */}
      <div className="mb-6 md:mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl md:text-2xl font-bold text-white flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-blue-900/30 to-blue-900/10 rounded-lg border border-blue-700/30">
              <Layers className="w-5 h-5 md:w-6 md:h-6 text-blue-400" />
            </div>
            <span>Cola de Producción</span>
            <span className="px-3 py-1 bg-gradient-to-r from-blue-900/30 to-blue-900/10 text-blue-300 text-sm font-bold rounded-full border border-blue-700/30">
              {pedidosEnProduccion.length}
            </span>
          </h2>
        </div>
        
        <div className="bg-gradient-to-b from-gray-900/20 to-black border border-gray-800 rounded-2xl overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gradient-to-r from-gray-900/80 to-black border-b border-gray-800">
                  <th className="px-4 md:px-6 py-3 md:py-4 text-left">
                    <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">Cliente</div>
                  </th>
                  <th className="px-4 md:px-6 py-3 md:py-4 text-left">
                    <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">Producto</div>
                  </th>
                  <th className="px-4 md:px-6 py-3 md:py-4 text-left">
                    <div className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Variedad</div>
                  </th>
                  <th className="px-4 md:px-6 py-3 md:py-4 text-left">
                    <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">Cantidad</div>
                  </th>
                  <th className="px-4 md:px-6 py-3 md:py-4 text-center">
                    <div className="text-xs font-bold text-blue-400 uppercase tracking-wider">Machos</div>
                  </th>
                  <th className="px-4 md:px-6 py-3 md:py-4 text-center">
                    <div className="text-xs font-bold text-amber-400 uppercase tracking-wider">Hembras</div>
                  </th>
                  <th className="px-4 md:px-6 py-3 md:py-4 text-left">
                    <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">Presentación</div>
                  </th>
                  <th className="px-4 md:px-6 py-3 md:py-4 text-left">
                    <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">Contenedor</div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {pedidosEnProduccion.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center">
                      <div className="text-gray-500 flex flex-col items-center max-w-md mx-auto">
                        <div className="relative mb-4">
                          <Monitor className="w-20 h-20 text-gray-800" />
                          <div className="absolute inset-0 flex items-center justify-center">
                            <AlertCircle className="w-10 h-10 text-gray-700" />
                          </div>
                        </div>
                        <h3 className="text-xl font-bold text-gray-700 mb-2">SIN PEDIDOS EN PRODUCCIÓN</h3>
                        <p className="text-gray-600 text-center">
                          La línea de producción está esperando nuevas órdenes.
                          Los pedidos aparecerán aquí automáticamente cuando sean confirmados.
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  pedidosEnProduccion.map((pedido, idx) => {
                    const infoGenero = extraerInfoGenero(pedido.tipoAve);
                    const variedad = pedido.variedad || extraerVariedad(pedido.tipoAve);
                    const tipoAveBase = extraerTipoAveBase(pedido.tipoAve);
                    const esPrimero = idx === 0;
                    
                    return (
                      <tr 
                        key={pedido.id}
                        className={`border-b border-gray-800/30 transition-all duration-300 ${
                          esPrimero 
                            ? 'bg-gradient-to-r from-amber-900/20 via-amber-900/10 to-transparent border-l-4 border-l-amber-500' 
                            : idx % 2 === 0 
                              ? 'bg-gray-900/5 hover:bg-gray-900/20' 
                              : 'bg-black/30 hover:bg-gray-900/10'
                        }`}
                      >
                        {/* Cliente */}
                        <td className="px-4 md:px-6 py-3 md:py-4">
                          <div className="flex items-center gap-3">
                            {esPrimero && (
                              <div className="relative">
                                <div className="w-2 h-2 bg-amber-400 rounded-full animate-ping absolute"></div>
                                <div className="w-2 h-2 bg-amber-400 rounded-full"></div>
                              </div>
                            )}
                            <div>
                              <div className="text-white font-bold text-base md:text-lg uppercase tracking-tight">
                                {pedido.cliente}
                              </div>
                              {pedido.numeroCliente && (
                                <div className="text-xs text-gray-500 font-mono tracking-wider">
                                  #{pedido.numeroCliente}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        
                        {/* Producto */}
                        <td className="px-4 md:px-6 py-3 md:py-4">
                          <div className="text-emerald-300 font-bold text-base md:text-lg uppercase tracking-tight">
                            {tipoAveBase}
                          </div>
                        </td>

                        {/* Variedad */}
                        <td className="px-4 md:px-6 py-3 md:py-4">
                          {variedad ? (
                            <div className={`px-3 md:px-4 py-1.5 md:py-2 rounded-lg text-sm font-black uppercase inline-block tracking-wider shadow-lg transition-all ${
                              esPrimero
                                ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-black animate-pulse-subtle border-2 border-emerald-400'
                                : 'bg-emerald-900/40 text-emerald-300 border border-emerald-500/30 hover:border-emerald-500/50'
                            }`}>
                              {variedad}
                            </div>
                          ) : (
                            <span className="text-gray-500 text-sm">—</span>
                          )}
                        </td>
                        
                        {/* Cantidad Total */}
                        <td className="px-4 md:px-6 py-3 md:py-4">
                          <div className="flex flex-col">
                            <div className="text-white font-black text-2xl md:text-3xl tabular-nums">
                              {pedido.cantidad.toLocaleString()}
                            </div>
                            <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-1">
                              unidades
                            </div>
                          </div>
                        </td>
                        
                        {/* Machos */}
                        <td className="px-4 md:px-6 py-3 md:py-4 text-center">
                          {infoGenero ? (
                            <div className={`inline-flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-all ${
                              esPrimero
                                ? 'bg-gradient-to-br from-blue-900/40 to-blue-900/20 border-2 border-blue-600/50'
                                : 'bg-blue-900/20 border border-blue-700/30 hover:border-blue-700/50'
                            }`}>
                              <span className="text-blue-300 font-black text-lg md:text-xl tabular-nums">
                                {infoGenero.machos.toLocaleString()}
                              </span>
                              <div className="text-[10px] text-blue-400/80 uppercase tracking-wider">M</div>
                            </div>
                          ) : (
                            <span className="text-gray-500">—</span>
                          )}
                        </td>
                        
                        {/* Hembras */}
                        <td className="px-4 md:px-6 py-3 md:py-4 text-center">
                          {infoGenero ? (
                            <div className={`inline-flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-all ${
                              esPrimero
                                ? 'bg-gradient-to-br from-amber-900/40 to-amber-900/20 border-2 border-amber-600/50'
                                : 'bg-amber-900/20 border border-amber-700/30 hover:border-amber-700/50'
                            }`}>
                              <span className="text-amber-300 font-black text-lg md:text-xl tabular-nums">
                                {infoGenero.hembras.toLocaleString()}
                              </span>
                              <div className="text-[10px] text-amber-400/80 uppercase tracking-wider">H</div>
                            </div>
                          ) : (
                            <span className="text-gray-500">—</span>
                          )}
                        </td>
                        
                        {/* Presentación */}
                        <td className="px-4 md:px-6 py-3 md:py-4">
                          <span className={`inline-block px-3 py-1.5 rounded-lg text-sm font-black uppercase tracking-wider transition-all ${
                            esPrimero
                              ? 'bg-gradient-to-r from-blue-600/20 to-blue-900/20 border-2 border-blue-500/50'
                              : 'bg-blue-900/20 border border-blue-700/30 hover:border-blue-700/50'
                          }`}>
                            {pedido.presentacion}
                          </span>
                        </td>
                        
                        {/* Contenedor */}
                        <td className="px-4 md:px-6 py-3 md:py-4">
                          <div className="flex items-center gap-2">
                            <div className={`p-1.5 rounded-lg ${
                              esPrimero 
                                ? 'bg-gradient-to-br from-amber-900/30 to-amber-900/20 border border-amber-700/50' 
                                : 'bg-gray-800/30 border border-gray-700/30'
                            }`}>
                              <Box className="w-4 h-4 md:w-5 md:h-5 text-amber-400" />
                            </div>
                            <div className="text-white font-bold text-sm md:text-base uppercase tracking-tight">
                              {pedido.contenedor}
                            </div>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}