import { useState } from 'react';
import { Package, Settings, Scale, Box, Layers, ArrowUpDown, Edit3, Trash2, AlertCircle, TrendingUp, Weight, BarChart3, X, Check, History } from 'lucide-react';
import { ModalContenedores } from './ModalContenedores';
import { useApp } from '../contexts/AppContext';
import { toast } from 'sonner';

// Interfaz para el contenedor
interface Contenedor {
  id: string;
  tipo: string;
  peso: number;
}

export function GestionContenedores() {
  const { contenedores, setContenedores, pedidosConfirmados } = useApp();
  const [isContenedoresModalOpen, setIsContenedoresModalOpen] = useState(false);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [editTipo, setEditTipo] = useState('');
  const [editPeso, setEditPeso] = useState('');
  const [eliminandoId, setEliminandoId] = useState<string | null>(null);

  // Cálculos precisos con estadísticas avanzadas
  const totalContenedores = contenedores.length;
  const pesoPromedio = totalContenedores > 0
    ? contenedores.reduce((acc, c) => acc + c.peso, 0) / totalContenedores
    : 0;
  const pesoMin = totalContenedores > 0
    ? Math.min(...contenedores.map(c => c.peso))
    : 0;
  const pesoMax = totalContenedores > 0
    ? Math.max(...contenedores.map(c => c.peso))
    : 0;
  const pesoTotalFlota = contenedores.reduce((acc, c) => acc + c.peso, 0);
  
  // Estadísticas adicionales
  const desviacionEstandar = totalContenedores > 1
    ? Math.sqrt(contenedores.reduce((acc, c) => acc + Math.pow(c.peso - pesoPromedio, 2), 0) / totalContenedores)
    : 0;
  
  const mediana = totalContenedores > 0
    ? [...contenedores].sort((a, b) => a.peso - b.peso)[Math.floor(totalContenedores / 2)].peso
    : 0;

  const distribucion = {
    livianos: contenedores.filter(c => c.peso < 2).length,
    medios: contenedores.filter(c => c.peso >= 2 && c.peso < 5).length,
    pesados: contenedores.filter(c => c.peso >= 5).length
  };

  // Uso acumulado por tipo de contenedor
  const usoPorTipo = contenedores.map(c => {
    const weighings = pedidosConfirmados.filter((p: any) => p.contenedor === c.tipo && (p.ticketEmitido || p.estado === 'En Pesaje'));
    const cantidadTotal = weighings.reduce((acc: number, p: any) => acc + (p.cantidadTotalContenedores || 0), 0);
    const pesoTotal = weighings.reduce((acc: number, p: any) => acc + (p.pesoTotalContenedores || 0), 0);
    return {
      tipo: c.tipo,
      cantidadTotal,
      pesoTotal,
      frecuencia: weighings.length
    };
  });

  // Función para iniciar edición
  const iniciarEdicion = (contenedor: Contenedor) => {
    setEditandoId(contenedor.id);
    setEditTipo(contenedor.tipo);
    setEditPeso(contenedor.peso.toString());
  };

  // Función para cancelar edición
  const cancelarEdicion = () => {
    setEditandoId(null);
    setEditTipo('');
    setEditPeso('');
  };

  // Función para guardar edición
  const guardarEdicion = (id: string) => {
    if (!editTipo.trim()) {
      toast.error('El tipo de contenedor es requerido');
      return;
    }

    const pesoNum = parseFloat(editPeso);
    if (isNaN(pesoNum) || pesoNum <= 0) {
      toast.error('El peso debe ser un número positivo');
      return;
    }

    const contenedoresActualizados = contenedores.map(c => 
      c.id === id 
        ? { ...c, tipo: editTipo.trim(), peso: pesoNum }
        : c
    );

    setContenedores(contenedoresActualizados);
    toast.success('Contenedor actualizado correctamente');
    cancelarEdicion();
  };

  // Función para eliminar contenedor
  const eliminarContenedor = (id: string) => {
    const contenedoresActualizados = contenedores.filter(c => c.id !== id);
    setContenedores(contenedoresActualizados);
    setEliminandoId(null);
    toast.success('Contenedor eliminado correctamente');
  };

  return (
    <div className="space-y-5 sm:space-y-6 p-2 sm:p-4 bg-black min-h-screen">
      {/* Header con degradado mejorado */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-amber-900/20 via-transparent to-transparent pointer-events-none" />
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 mb-2 sm:mb-4 relative z-10">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-amber-900/30 to-amber-950/30 border border-amber-700/30 shadow-lg shadow-amber-900/20">
                <Package className="w-5 h-5 sm:w-6 sm:h-6 text-amber-400" />
              </div>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-white tracking-tight">
                Gestión de Contenedores
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-gray-500 ml-1">
              Registro y control de tipos de contenedores disponibles
            </p>
          </div>
          
          <button
            onClick={() => setIsContenedoresModalOpen(true)}
            className="group relative px-3 sm:px-5 md:px-6 py-2.5 sm:py-3 rounded-xl font-bold transition-all duration-300 hover:scale-105 active:scale-95 flex items-center gap-2 text-sm sm:text-base overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, #0d4a24, #166534, #b8941e, #ccaa00)',
              color: 'white',
              boxShadow: '0 6px 20px rgba(204, 170, 0, 0.35), inset 0 1px 0 rgba(255,255,255,0.15)'
            }}
          >
            <span className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
            <Settings className="w-4 h-4 sm:w-5 sm:h-5 relative z-10" />
            <span className="hidden sm:inline relative z-10">Gestionar Contenedores</span>
            <span className="sm:hidden relative z-10">Gestionar</span>
          </button>
        </div>
      </div>

      {/* Resumen Rápido con tarjetas mejoradas */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        {/* Total Registrados */}
        <div
          className="group relative backdrop-blur-xl rounded-xl p-4 sm:p-5 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, rgba(204, 170, 0, 0.12), rgba(0, 0, 0, 0.6))',
            border: '1px solid rgba(204, 170, 0, 0.3)',
            boxShadow: '0 4px 20px rgba(0,0,0,0.5)'
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-amber-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <div className="flex items-center justify-between mb-2.5">
            <p className="text-xs sm:text-sm text-gray-300 font-medium">Tipos Registrados</p>
            <div
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-300"
              style={{ background: 'rgba(204, 170, 0, 0.15)', border: '1px solid rgba(204, 170, 0, 0.25)' }}
            >
              <Layers className="w-4 h-4 sm:w-[18px] sm:h-[18px]" style={{ color: '#ccaa00' }} />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-amber-400">
            {totalContenedores}
          </p>
          <p className="text-[10px] sm:text-xs text-gray-500 mt-1">contenedores configurados</p>
        </div>

        {/* Peso Promedio */}
        <div
          className="group relative backdrop-blur-xl rounded-xl p-4 sm:p-5 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(0, 0, 0, 0.6))',
            border: '1px solid rgba(59, 130, 246, 0.25)',
            boxShadow: '0 4px 20px rgba(0,0,0,0.5)'
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <div className="flex items-center justify-between mb-2.5">
            <p className="text-xs sm:text-sm text-gray-300 font-medium">Peso Promedio</p>
            <div
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-300"
              style={{ background: 'rgba(59, 130, 246, 0.15)', border: '1px solid rgba(59, 130, 246, 0.25)' }}
            >
              <Scale className="w-4 h-4 sm:w-[18px] sm:h-[18px]" style={{ color: '#3b82f6' }} />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-blue-400">
            {pesoPromedio.toFixed(2)}
          </p>
          <p className="text-[10px] sm:text-xs text-gray-500 mt-1">kg por unidad</p>
        </div>

        {/* Rango de Pesos */}
        <div
          className="group relative backdrop-blur-xl rounded-xl p-4 sm:p-5 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.1), rgba(0, 0, 0, 0.6))',
            border: '1px solid rgba(34, 197, 94, 0.25)',
            boxShadow: '0 4px 20px rgba(0,0,0,0.5)'
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-green-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <div className="flex items-center justify-between mb-2.5">
            <p className="text-xs sm:text-sm text-gray-300 font-medium">Rango de Pesos</p>
            <div
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-300"
              style={{ background: 'rgba(34, 197, 94, 0.15)', border: '1px solid rgba(34, 197, 94, 0.25)' }}
            >
              <ArrowUpDown className="w-4 h-4 sm:w-[18px] sm:h-[18px]" style={{ color: '#22c55e' }} />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-green-400">
            {pesoMin.toFixed(2)} – {pesoMax.toFixed(2)}
          </p>
          <p className="text-[10px] sm:text-xs text-gray-500 mt-1">kg (mín – máx)</p>
        </div>

        {/* Peso Total Flota */}
        <div
          className="group relative backdrop-blur-xl rounded-xl p-4 sm:p-5 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.1), rgba(0, 0, 0, 0.6))',
            border: '1px solid rgba(168, 85, 247, 0.25)',
            boxShadow: '0 4px 20px rgba(0,0,0,0.5)'
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <div className="flex items-center justify-between mb-2.5">
            <p className="text-xs sm:text-sm text-gray-300 font-medium">Peso Total</p>
            <div
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-300"
              style={{ background: 'rgba(168, 85, 247, 0.15)', border: '1px solid rgba(168, 85, 247, 0.25)' }}
            >
              <Package className="w-4 h-4 sm:w-[18px] sm:h-[18px]" style={{ color: '#a855f7' }} />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-purple-400">
            {pesoTotalFlota.toFixed(2)}
          </p>
          <p className="text-[10px] sm:text-xs text-gray-500 mt-1">kg acumulado</p>
        </div>

        {/* Jabas Usadas Hoy */}
        <div
          className="group relative backdrop-blur-xl rounded-xl p-4 sm:p-5 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.1), rgba(0, 0, 0, 0.6))',
            border: '1px solid rgba(251, 191, 36, 0.25)',
            boxShadow: '0 4px 20px rgba(0,0,0,0.5)'
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-amber-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <div className="flex items-center justify-between mb-2.5">
            <p className="text-xs sm:text-sm text-gray-300 font-medium">Jabas Usadas (Hoy)</p>
            <div
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-300"
              style={{ background: 'rgba(251, 191, 36, 0.15)', border: '1px solid rgba(251, 191, 36, 0.25)' }}
            >
              <TrendingUp className="w-4 h-4 sm:w-[18px] sm:h-[18px]" style={{ color: '#fbbf24' }} />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-amber-500">
            {pedidosConfirmados
              .filter((p: any) => (p.fechaPesaje === new Date().toISOString().split('T')[0] || p.fecha === new Date().toISOString().split('T')[0]) && p.ticketEmitido)
              .reduce((acc: number, p: any) => acc + (p.cantidadTotalContenedores || 0), 0)
            }
          </p>
          <p className="text-[10px] sm:text-xs text-gray-500 mt-1">unidades en circulación</p>
        </div>
      </div>

      {/* Estadísticas Avanzadas (visible solo si hay datos) */}
      {totalContenedores > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
          {/* Desviación Estándar */}
          <div
            className="backdrop-blur-xl rounded-xl p-4"
            style={{
              background: 'rgba(0, 0, 0, 0.4)',
              border: '1px solid rgba(255, 255, 255, 0.06)',
            }}
          >
            <div className="flex items-center gap-3 mb-2">
              <TrendingUp className="w-4 h-4 text-amber-400" />
              <p className="text-xs text-gray-300">Desviación Estándar</p>
            </div>
            <p className="text-lg font-bold text-white">
              {desviacionEstandar.toFixed(3)} kg
            </p>
            <p className="text-[10px] text-gray-500">variabilidad del peso</p>
          </div>

          {/* Mediana */}
          <div
            className="backdrop-blur-xl rounded-xl p-4"
            style={{
              background: 'rgba(0, 0, 0, 0.4)',
              border: '1px solid rgba(255, 255, 255, 0.06)',
            }}
          >
            <div className="flex items-center gap-3 mb-2">
              <BarChart3 className="w-4 h-4 text-blue-400" />
              <p className="text-xs text-gray-300">Mediana</p>
            </div>
            <p className="text-lg font-bold text-white">
              {mediana.toFixed(2)} kg
            </p>
            <p className="text-[10px] text-gray-500">valor central</p>
          </div>

          {/* Distribución */}
          <div
            className="backdrop-blur-xl rounded-xl p-4"
            style={{
              background: 'rgba(0, 0, 0, 0.4)',
              border: '1px solid rgba(255, 255, 255, 0.06)',
            }}
          >
            <div className="flex items-center gap-3 mb-2">
              <Weight className="w-4 h-4 text-purple-400" />
              <p className="text-xs text-gray-300">Distribución</p>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="text-green-400">L:{distribucion.livianos}</span>
              <span className="text-gray-500">|</span>
              <span className="text-amber-400">M:{distribucion.medios}</span>
              <span className="text-gray-500">|</span>
              <span className="text-red-400">P:{distribucion.pesados}</span>
            </div>
            <p className="text-[10px] text-gray-500 mt-1">liviano &lt;2kg | medio 2-5kg | pesado &gt;5kg</p>
          </div>
        </div>
      )}

      {/* Tabla de Contenedores Registrados — Desktop Mejorada */}
      <div
        className="hidden md:block backdrop-blur-xl rounded-xl overflow-hidden border border-amber-800/30 shadow-2xl shadow-amber-900/10"
        style={{
          background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0.9))',
        }}
      >
        {/* Encabezado de sección mejorado */}
        <div
          className="px-6 py-4 flex items-center justify-between border-b border-amber-800/30"
          style={{
            background: 'linear-gradient(135deg, rgba(204, 170, 0, 0.15), rgba(0, 0, 0, 0.6))',
          }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center"
              style={{ 
                background: 'linear-gradient(135deg, #ccaa00, #b8941e)',
                boxShadow: '0 4px 15px rgba(204,170,0,0.4)'
              }}
            >
              <Package className="w-5 h-5 text-black" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                Contenedores Registrados
                <span className="text-xs font-normal px-2 py-0.5 rounded-full bg-amber-900/30 text-amber-400 border border-amber-700/30">
                  {totalContenedores} {totalContenedores === 1 ? 'tipo' : 'tipos'}
                </span>
              </h3>
              <p className="text-xs text-gray-500">Detalle de tipos y pesos configurados</p>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-black/50 border-b border-amber-800/20">
                <th className="px-6 py-4 text-left font-bold text-xs tracking-wider uppercase text-amber-400">#</th>
                <th className="px-6 py-4 text-left font-bold text-xs tracking-wider uppercase text-amber-400">Tipo de Contenedor</th>
                <th className="px-6 py-4 text-right font-bold text-xs tracking-wider uppercase text-amber-400">Peso Unitario</th>
                <th className="px-6 py-4 text-right font-bold text-xs tracking-wider uppercase text-amber-400">×10 unid.</th>
                <th className="px-6 py-4 text-right font-bold text-xs tracking-wider uppercase text-amber-400">×50 unid.</th>
                <th className="px-6 py-4 text-right font-bold text-xs tracking-wider uppercase text-amber-400">×100 unid.</th>
                <th className="px-6 py-4 text-center font-bold text-xs tracking-wider uppercase text-amber-400">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {contenedores.map((contenedor, index) => (
                <tr
                  key={contenedor.id}
                  className="transition-all duration-200 hover:bg-amber-900/10"
                  style={{ borderBottom: '1px solid rgba(204, 170, 0, 0.06)' }}
                >
                  <td className="px-6 py-4">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm"
                      style={{
                        background: 'linear-gradient(135deg, rgba(204, 170, 0, 0.2), rgba(204, 170, 0, 0.08))',
                        color: '#ccaa00',
                        border: '1px solid rgba(204, 170, 0, 0.25)'
                      }}
                    >
                      {index + 1}
                    </div>
                  </td>
                  
                  {editandoId === contenedor.id ? (
                    // Modo edición
                    <>
                      <td className="px-6 py-4">
                        <input
                          type="text"
                          value={editTipo}
                          onChange={(e) => setEditTipo(e.target.value)}
                          className="w-full bg-black/60 border border-amber-600/50 rounded-lg px-3 py-1.5 text-white text-sm focus:outline-none focus:border-amber-400"
                          placeholder="Tipo de contenedor"
                          autoFocus
                        />
                      </td>
                      <td className="px-6 py-4">
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={editPeso}
                          onChange={(e) => setEditPeso(e.target.value)}
                          className="w-full bg-black/60 border border-amber-600/50 rounded-lg px-3 py-1.5 text-white text-sm text-right focus:outline-none focus:border-amber-400"
                          placeholder="0.00"
                        />
                      </td>
                      <td className="px-6 py-4 text-right text-gray-300 text-sm">
                        {(parseFloat(editPeso || '0') * 10).toFixed(2)} kg
                      </td>
                      <td className="px-6 py-4 text-right text-gray-300 text-sm">
                        {(parseFloat(editPeso || '0') * 50).toFixed(2)} kg
                      </td>
                      <td className="px-6 py-4 text-right text-gray-300 text-sm">
                        {(parseFloat(editPeso || '0') * 100).toFixed(2)} kg
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => guardarEdicion(contenedor.id)}
                            className="p-1.5 rounded-lg bg-green-600/20 hover:bg-green-600/40 transition-colors"
                            title="Guardar"
                          >
                            <Check className="w-4 h-4 text-green-400" />
                          </button>
                          <button
                            onClick={cancelarEdicion}
                            className="p-1.5 rounded-lg bg-red-600/20 hover:bg-red-600/40 transition-colors"
                            title="Cancelar"
                          >
                            <X className="w-4 h-4 text-red-400" />
                          </button>
                        </div>
                      </td>
                    </>
                  ) : (
                    // Modo vista
                    <>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <Box className="w-4 h-4 flex-shrink-0 text-amber-500/70" />
                          <span className="text-white font-medium text-sm">{contenedor.tipo}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="font-bold text-sm text-amber-400">
                          {contenedor.peso.toFixed(2)} kg
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right text-gray-300 text-sm">
                        {(contenedor.peso * 10).toFixed(2)} kg
                      </td>
                      <td className="px-6 py-4 text-right text-gray-300 text-sm">
                        {(contenedor.peso * 50).toFixed(2)} kg
                      </td>
                      <td className="px-6 py-4 text-right text-gray-300 text-sm">
                        {(contenedor.peso * 100).toFixed(2)} kg
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => iniciarEdicion(contenedor)}
                            className="p-1.5 rounded-lg hover:bg-amber-900/30 transition-colors"
                            title="Editar"
                          >
                            <Edit3 className="w-4 h-4 text-amber-400" />
                          </button>
                          {eliminandoId === contenedor.id ? (
                            <>
                              <button
                                onClick={() => eliminarContenedor(contenedor.id)}
                                className="p-1.5 rounded-lg bg-red-600/20 hover:bg-red-600/40 transition-colors"
                                title="Confirmar eliminación"
                              >
                                <Check className="w-4 h-4 text-red-400" />
                              </button>
                              <button
                                onClick={() => setEliminandoId(null)}
                                className="p-1.5 rounded-lg bg-gray-600/20 hover:bg-gray-600/40 transition-colors"
                                title="Cancelar"
                              >
                                <X className="w-4 h-4 text-gray-400" />
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={() => setEliminandoId(contenedor.id)}
                              className="p-1.5 rounded-lg hover:bg-red-900/30 transition-colors"
                              title="Eliminar"
                            >
                              <Trash2 className="w-4 h-4 text-red-400" />
                            </button>
                          )}
                        </div>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
            
            {/* Footer con totales mejorado */}
            {contenedores.length > 0 && (
              <tfoot>
                <tr className="bg-gradient-to-r from-amber-950/30 to-black/90 border-t-2 border-amber-700/30">
                  <td className="px-6 py-4" colSpan={2}>
                    <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
                      Totales acumulados
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className="font-bold text-sm text-amber-400">
                      {pesoTotalFlota.toFixed(2)} kg
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className="text-gray-300 font-medium text-sm">
                      {(pesoTotalFlota * 10).toFixed(2)} kg
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className="text-gray-300 font-medium text-sm">
                      {(pesoTotalFlota * 50).toFixed(2)} kg
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className="text-gray-300 font-medium text-sm">
                      {(pesoTotalFlota * 100).toFixed(2)} kg
                    </span>
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>

        {contenedores.length === 0 && (
          <div className="text-center py-16">
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse"
              style={{ background: 'rgba(204, 170, 0, 0.1)', border: '2px dashed rgba(204, 170, 0, 0.3)' }}
            >
              <AlertCircle className="w-8 h-8 text-amber-600/50" />
            </div>
            <p className="text-gray-300 text-base font-medium mb-2">No hay contenedores registrados</p>
            <p className="text-gray-500 text-sm">Haz clic en "Gestionar Contenedores" para agregar el primero</p>
          </div>
        )}
      </div>

      {/* Cards de Contenedores — Mobile Mejoradas */}
      <div className="md:hidden space-y-3">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Package className="w-4 h-4 text-amber-400" />
            Contenedores Registrados
          </h3>
          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-900/30 text-amber-400 border border-amber-700/30">
            {totalContenedores}
          </span>
        </div>

        {contenedores.map((contenedor, index) => (
          <div
            key={contenedor.id}
            className="group relative backdrop-blur-xl rounded-xl p-4 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, rgba(204, 170, 0, 0.08), rgba(0, 0, 0, 0.7))',
              border: '1px solid rgba(204, 170, 0, 0.2)',
              boxShadow: '0 4px 16px rgba(0,0,0,0.3)'
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-amber-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            
            {editandoId === contenedor.id ? (
              // Modo edición mobile
              <div className="space-y-3">
                <input
                  type="text"
                  value={editTipo}
                  onChange={(e) => setEditTipo(e.target.value)}
                  className="w-full bg-black/60 border border-amber-600/50 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-amber-400"
                  placeholder="Tipo de contenedor"
                  autoFocus
                />
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={editPeso}
                  onChange={(e) => setEditPeso(e.target.value)}
                  className="w-full bg-black/60 border border-amber-600/50 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-amber-400"
                  placeholder="Peso (kg)"
                />
                <div className="flex items-center justify-end gap-2 mt-2">
                  <button
                    onClick={() => guardarEdicion(contenedor.id)}
                    className="px-3 py-1.5 rounded-lg bg-green-600/20 hover:bg-green-600/40 text-green-400 text-sm font-medium flex items-center gap-1"
                  >
                    <Check className="w-4 h-4" /> Guardar
                  </button>
                  <button
                    onClick={cancelarEdicion}
                    className="px-3 py-1.5 rounded-lg bg-red-600/20 hover:bg-red-600/40 text-red-400 text-sm font-medium flex items-center gap-1"
                  >
                    <X className="w-4 h-4" /> Cancelar
                  </button>
                </div>
              </div>
            ) : (
              <>
                {/* Header del card */}
                <div className="flex items-center gap-3 mb-3 pb-3 border-b border-amber-800/20">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm flex-shrink-0"
                    style={{
                      background: 'linear-gradient(135deg, #ccaa00, #b8941e)',
                      color: '#000',
                      boxShadow: '0 3px 15px rgba(204,170,0,0.3)'
                    }}
                  >
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-white font-bold text-sm truncate">{contenedor.tipo}</p>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => iniciarEdicion(contenedor)}
                          className="p-1.5 rounded-lg hover:bg-amber-900/30"
                        >
                          <Edit3 className="w-3.5 h-3.5 text-amber-400" />
                        </button>
                        {eliminandoId === contenedor.id ? (
                          <>
                            <button
                              onClick={() => eliminarContenedor(contenedor.id)}
                              className="p-1.5 rounded-lg bg-red-600/20"
                            >
                              <Check className="w-3.5 h-3.5 text-red-400" />
                            </button>
                            <button
                              onClick={() => setEliminandoId(null)}
                              className="p-1.5 rounded-lg bg-gray-600/20"
                            >
                              <X className="w-3.5 h-3.5 text-gray-400" />
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => setEliminandoId(contenedor.id)}
                            className="p-1.5 rounded-lg hover:bg-red-900/30"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-red-400" />
                          </button>
                        )}
                      </div>
                    </div>
                    <p className="text-xs font-semibold mt-0.5 text-amber-400">
                      {contenedor.peso.toFixed(2)} kg / unidad
                    </p>
                  </div>
                </div>

                {/* Datos calculados con diseño mejorado */}
                <div className="grid grid-cols-3 gap-2">
                  <div className="p-2.5 rounded-lg text-center bg-black/40 border border-amber-800/20">
                    <p className="text-[10px] text-gray-400 mb-1">×10</p>
                    <p className="text-white text-xs font-bold">{(contenedor.peso * 10).toFixed(2)}</p>
                    <p className="text-[10px] text-gray-500">kg</p>
                  </div>
                  <div className="p-2.5 rounded-lg text-center bg-black/40 border border-amber-800/20">
                    <p className="text-[10px] text-gray-400 mb-1">×50</p>
                    <p className="text-white text-xs font-bold">{(contenedor.peso * 50).toFixed(2)}</p>
                    <p className="text-[10px] text-gray-500">kg</p>
                  </div>
                  <div className="p-2.5 rounded-lg text-center bg-black/40 border border-amber-800/20">
                    <p className="text-[10px] text-gray-400 mb-1">×100</p>
                    <p className="text-white text-xs font-bold">{(contenedor.peso * 100).toFixed(2)}</p>
                    <p className="text-[10px] text-gray-500">kg</p>
                  </div>
                </div>
              </>
            )}
          </div>
        ))}

        {contenedores.length === 0 && (
          <div
            className="text-center py-12 backdrop-blur-xl rounded-xl border border-amber-800/20"
            style={{
              background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.7))',
            }}
          >
            <AlertCircle className="w-12 h-12 mx-auto mb-3 text-amber-600/40" />
            <p className="text-gray-300 text-sm font-medium">No hay contenedores registrados</p>
            <p className="text-gray-500 text-xs mt-1">Toca "Gestionar" para agregar</p>
          </div>
        )}
      </div>

      {/* Uso Reciente de Contenedores (Log de Pesajes) */}
      <div 
        className="backdrop-blur-xl rounded-xl overflow-hidden border border-amber-800/30 shadow-2xl shadow-amber-900/10"
        style={{ background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0.9))' }}
      >
        <div className="px-6 py-4 flex items-center justify-between border-b border-amber-800/30"
          style={{ background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.15), rgba(0, 0, 0, 0.6))' }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)', boxShadow: '0 4px 15px rgba(59,130,246,0.4)' }}>
              <History className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Uso Reciente de Contenedores</h3>
              <p className="text-xs text-gray-500">Últimos pesajes registrados en el sistema</p>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-black/50 border-b border-amber-800/20">
                <th className="px-6 py-4 text-left font-bold text-xs tracking-wider uppercase text-amber-400">Fecha/Hora</th>
                <th className="px-6 py-4 text-left font-bold text-xs tracking-wider uppercase text-amber-400">Cliente</th>
                <th className="px-6 py-4 text-left font-bold text-xs tracking-wider uppercase text-amber-400">Contenedor</th>
                <th className="px-6 py-4 text-center font-bold text-xs tracking-wider uppercase text-amber-400">Cant.</th>
                <th className="px-6 py-4 text-right font-bold text-xs tracking-wider uppercase text-amber-400">Tara Total</th>
                <th className="px-6 py-4 text-right font-bold text-xs tracking-wider uppercase text-amber-400">Peso Neto</th>
              </tr>
            </thead>
            <tbody>
              {pedidosConfirmados
                .filter(p => (p.ticketEmitido || p.estado === 'En Pesaje') && p.contenedor !== 'Por definir en pesaje')
                .sort((a, b) => {
                  const dateA = new Date(`${a.fechaPesaje || a.fecha} ${a.horaPesaje || a.hora}`).getTime();
                  const dateB = new Date(`${b.fechaPesaje || b.fecha} ${b.horaPesaje || b.hora}`).getTime();
                  return dateB - dateA;
                })
                .slice(0, 10)
                .map((pedido) => (
                  <tr key={pedido.id} className="transition-all duration-200 hover:bg-white/5 border-b border-white/5">
                    <td className="px-6 py-4">
                      <div className="text-white text-xs font-medium">{pedido.fechaPesaje || pedido.fecha}</div>
                      <div className="text-[10px] text-gray-500">{pedido.horaPesaje || pedido.hora}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-white font-semibold text-sm truncate max-w-[150px]">{pedido.cliente}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Box className="w-3.5 h-3.5 text-amber-500/70" />
                        <span className="text-blue-300 font-medium text-xs">{pedido.contenedor}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-white font-bold text-sm">{pedido.cantidadTotalContenedores || '—'}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-red-400 font-mono text-sm font-bold">
                        {pedido.pesoTotalContenedores ? `-${pedido.pesoTotalContenedores.toFixed(1)} kg` : '—'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-green-400 font-mono text-sm font-bold">
                        {pedido.pesoNetoTotal ? `${pedido.pesoNetoTotal.toFixed(1)} kg` : '—'}
                      </span>
                    </td>
                  </tr>
                ))}
              {pedidosConfirmados.filter(p => (p.ticketEmitido || p.estado === 'En Pesaje') && p.contenedor !== 'Por definir en pesaje').length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-gray-500 italic text-sm">
                    No hay registros de uso de contenedores aún
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Gestionar Contenedores */}
      <ModalContenedores
        isOpen={isContenedoresModalOpen}
        onClose={() => setIsContenedoresModalOpen(false)}
        contenedores={contenedores}
        setContenedores={setContenedores}
      />
    </div>
  );
} 