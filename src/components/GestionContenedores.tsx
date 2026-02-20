import { useState } from 'react';
import { Package, Settings, Scale, Box, Layers, ArrowUpDown } from 'lucide-react';
import { ModalContenedores } from './ModalContenedores';
import { useApp } from '../contexts/AppContext';

export function GestionContenedores() {
  const { contenedores, setContenedores } = useApp();
  const [isContenedoresModalOpen, setIsContenedoresModalOpen] = useState(false);

  // Cálculos precisos
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

  return (
    <div className="space-y-5 sm:space-y-6 p-2 sm:p-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 mb-2 sm:mb-4">
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-white mb-1 sm:mb-2">
            Gestión de Contenedores
          </h1>
          <p className="text-xs sm:text-sm text-gray-400">
            Registro y control de tipos de contenedores disponibles
          </p>
        </div>
        <button
          onClick={() => setIsContenedoresModalOpen(true)}
          className="px-3 sm:px-5 md:px-6 py-2.5 sm:py-3 rounded-xl font-bold transition-all hover:scale-105 active:scale-95 flex items-center gap-2 text-sm sm:text-base"
          style={{
            background: 'linear-gradient(135deg, #0d4a24, #166534, #b8941e, #ccaa00)',
            color: 'white',
            boxShadow: '0 6px 20px rgba(204, 170, 0, 0.35), inset 0 1px 0 rgba(255,255,255,0.15)'
          }}
        >
          <Settings className="w-4 h-4 sm:w-5 sm:h-5" />
          <span className="hidden sm:inline">Gestionar Contenedores</span>
          <span className="sm:hidden">Gestionar</span>
        </button>
      </div>

      {/* Resumen Rápido */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Registrados */}
        <div
          className="backdrop-blur-xl rounded-xl p-4 sm:p-5 transition-all hover:scale-[1.02]"
          style={{
            background: 'linear-gradient(135deg, rgba(204, 170, 0, 0.12), rgba(0, 0, 0, 0.35))',
            border: '1px solid rgba(204, 170, 0, 0.3)',
            boxShadow: '0 4px 20px rgba(0,0,0,0.3)'
          }}
        >
          <div className="flex items-center justify-between mb-2.5">
            <p className="text-xs sm:text-sm text-gray-300 font-medium">Tipos Registrados</p>
            <div
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center"
              style={{ background: 'rgba(204, 170, 0, 0.15)', border: '1px solid rgba(204, 170, 0, 0.25)' }}
            >
              <Layers className="w-4 h-4 sm:w-[18px] sm:h-[18px]" style={{ color: '#ccaa00' }} />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-bold" style={{ color: '#ccaa00' }}>
            {totalContenedores}
          </p>
          <p className="text-[10px] sm:text-xs text-gray-500 mt-1">contenedores</p>
        </div>

        {/* Peso Promedio */}
        <div
          className="backdrop-blur-xl rounded-xl p-4 sm:p-5 transition-all hover:scale-[1.02]"
          style={{
            background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(0, 0, 0, 0.35))',
            border: '1px solid rgba(59, 130, 246, 0.25)',
            boxShadow: '0 4px 20px rgba(0,0,0,0.3)'
          }}
        >
          <div className="flex items-center justify-between mb-2.5">
            <p className="text-xs sm:text-sm text-gray-300 font-medium">Peso Promedio</p>
            <div
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center"
              style={{ background: 'rgba(59, 130, 246, 0.15)', border: '1px solid rgba(59, 130, 246, 0.25)' }}
            >
              <Scale className="w-4 h-4 sm:w-[18px] sm:h-[18px]" style={{ color: '#3b82f6' }} />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-bold" style={{ color: '#3b82f6' }}>
            {pesoPromedio.toFixed(2)}
          </p>
          <p className="text-[10px] sm:text-xs text-gray-500 mt-1">kg por unidad</p>
        </div>

        {/* Rango de Pesos */}
        <div
          className="backdrop-blur-xl rounded-xl p-4 sm:p-5 transition-all hover:scale-[1.02]"
          style={{
            background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.1), rgba(0, 0, 0, 0.35))',
            border: '1px solid rgba(34, 197, 94, 0.25)',
            boxShadow: '0 4px 20px rgba(0,0,0,0.3)'
          }}
        >
          <div className="flex items-center justify-between mb-2.5">
            <p className="text-xs sm:text-sm text-gray-300 font-medium">Rango de Pesos</p>
            <div
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center"
              style={{ background: 'rgba(34, 197, 94, 0.15)', border: '1px solid rgba(34, 197, 94, 0.25)' }}
            >
              <ArrowUpDown className="w-4 h-4 sm:w-[18px] sm:h-[18px]" style={{ color: '#22c55e' }} />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-bold" style={{ color: '#22c55e' }}>
            {pesoMin.toFixed(2)} – {pesoMax.toFixed(2)}
          </p>
          <p className="text-[10px] sm:text-xs text-gray-500 mt-1">kg (mín – máx)</p>
        </div>

        {/* Peso Total Flota */}
        <div
          className="backdrop-blur-xl rounded-xl p-4 sm:p-5 transition-all hover:scale-[1.02]"
          style={{
            background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.1), rgba(0, 0, 0, 0.35))',
            border: '1px solid rgba(168, 85, 247, 0.25)',
            boxShadow: '0 4px 20px rgba(0,0,0,0.3)'
          }}
        >
          <div className="flex items-center justify-between mb-2.5">
            <p className="text-xs sm:text-sm text-gray-300 font-medium">Peso Total</p>
            <div
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center"
              style={{ background: 'rgba(168, 85, 247, 0.15)', border: '1px solid rgba(168, 85, 247, 0.25)' }}
            >
              <Package className="w-4 h-4 sm:w-[18px] sm:h-[18px]" style={{ color: '#a855f7' }} />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-bold" style={{ color: '#a855f7' }}>
            {pesoTotalFlota.toFixed(2)}
          </p>
          <p className="text-[10px] sm:text-xs text-gray-500 mt-1">kg acumulado</p>
        </div>
      </div>

      {/* Tabla de Contenedores Registrados — Desktop */}
      <div
        className="hidden md:block backdrop-blur-xl rounded-xl overflow-hidden"
        style={{
          background: 'rgba(0, 0, 0, 0.3)',
          border: '1px solid rgba(204, 170, 0, 0.25)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.3)'
        }}
      >
        {/* Encabezado de sección */}
        <div
          className="px-6 py-4 flex items-center justify-between"
          style={{
            background: 'linear-gradient(135deg, rgba(204, 170, 0, 0.1), rgba(0, 0, 0, 0.4))',
            borderBottom: '1px solid rgba(204, 170, 0, 0.2)'
          }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #ccaa00, #b8941e)', boxShadow: '0 4px 12px rgba(204,170,0,0.3)' }}
            >
              <Package className="w-5 h-5 text-black" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Contenedores Registrados</h3>
              <p className="text-xs text-gray-400">Detalle de tipos y pesos configurados</p>
            </div>
          </div>
          <span
            className="px-3 py-1 rounded-full text-sm font-bold"
            style={{ background: 'rgba(204, 170, 0, 0.15)', color: '#ccaa00', border: '1px solid rgba(204, 170, 0, 0.3)' }}
          >
            {totalContenedores} tipo{totalContenedores !== 1 ? 's' : ''}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr style={{ background: 'rgba(0, 0, 0, 0.5)', borderBottom: '1px solid rgba(204, 170, 0, 0.15)' }}>
                <th className="px-6 py-3.5 text-left font-bold text-xs tracking-wider uppercase" style={{ color: '#ccaa00' }}>#</th>
                <th className="px-6 py-3.5 text-left font-bold text-xs tracking-wider uppercase" style={{ color: '#ccaa00' }}>Tipo de Contenedor</th>
                <th className="px-6 py-3.5 text-right font-bold text-xs tracking-wider uppercase" style={{ color: '#ccaa00' }}>Peso Unitario</th>
                <th className="px-6 py-3.5 text-right font-bold text-xs tracking-wider uppercase" style={{ color: '#ccaa00' }}>×10 unidades</th>
                <th className="px-6 py-3.5 text-right font-bold text-xs tracking-wider uppercase" style={{ color: '#ccaa00' }}>×50 unidades</th>
                <th className="px-6 py-3.5 text-right font-bold text-xs tracking-wider uppercase" style={{ color: '#ccaa00' }}>×100 unidades</th>
              </tr>
            </thead>
            <tbody>
              {contenedores.map((contenedor, index) => (
                <tr
                  key={contenedor.id}
                  className="transition-colors hover:bg-white/[0.04]"
                  style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}
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
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2.5">
                      <Box className="w-4 h-4 flex-shrink-0" style={{ color: '#ccaa00' }} />
                      <span className="text-white font-semibold text-sm">{contenedor.tipo}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className="font-bold text-sm" style={{ color: '#ccaa00' }}>
                      {contenedor.peso.toFixed(2)} kg
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className="text-gray-300 text-sm">
                      {(contenedor.peso * 10).toFixed(2)} kg
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className="text-gray-300 text-sm">
                      {(contenedor.peso * 50).toFixed(2)} kg
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className="text-gray-300 text-sm">
                      {(contenedor.peso * 100).toFixed(2)} kg
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
            {/* Footer totals */}
            <tfoot>
              <tr style={{ background: 'rgba(204, 170, 0, 0.06)', borderTop: '1.5px solid rgba(204, 170, 0, 0.2)' }}>
                <td className="px-6 py-3.5" colSpan={2}>
                  <span className="text-xs font-bold uppercase tracking-wider" style={{ color: '#ccaa00' }}>
                    Totales acumulados
                  </span>
                </td>
                <td className="px-6 py-3.5 text-right">
                  <span className="font-bold text-sm" style={{ color: '#ccaa00' }}>
                    {pesoTotalFlota.toFixed(2)} kg
                  </span>
                </td>
                <td className="px-6 py-3.5 text-right">
                  <span className="text-gray-300 font-medium text-sm">
                    {(pesoTotalFlota * 10).toFixed(2)} kg
                  </span>
                </td>
                <td className="px-6 py-3.5 text-right">
                  <span className="text-gray-300 font-medium text-sm">
                    {(pesoTotalFlota * 50).toFixed(2)} kg
                  </span>
                </td>
                <td className="px-6 py-3.5 text-right">
                  <span className="text-gray-300 font-medium text-sm">
                    {(pesoTotalFlota * 100).toFixed(2)} kg
                  </span>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {contenedores.length === 0 && (
          <div className="text-center py-12">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
              style={{ background: 'rgba(204, 170, 0, 0.1)', border: '2px dashed rgba(204, 170, 0, 0.3)' }}
            >
              <Package className="w-8 h-8" style={{ color: '#ccaa00', opacity: 0.5 }} />
            </div>
            <p className="text-gray-400 text-sm font-medium">No hay contenedores registrados</p>
            <p className="text-gray-500 text-xs mt-1">Haz clic en "Gestionar Contenedores" para agregar el primero</p>
          </div>
        )}
      </div>

      {/* Cards de Contenedores — Mobile */}
      <div className="md:hidden space-y-3">
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Package className="w-4 h-4" style={{ color: '#ccaa00' }} />
            Contenedores Registrados
          </h3>
          <span
            className="px-2.5 py-0.5 rounded-full text-xs font-bold"
            style={{ background: 'rgba(204, 170, 0, 0.15)', color: '#ccaa00', border: '1px solid rgba(204, 170, 0, 0.3)' }}
          >
            {totalContenedores}
          </span>
        </div>

        {contenedores.map((contenedor, index) => (
          <div
            key={contenedor.id}
            className="backdrop-blur-xl rounded-xl p-4 transition-all"
            style={{
              background: 'linear-gradient(135deg, rgba(204, 170, 0, 0.06), rgba(0, 0, 0, 0.3))',
              border: '1px solid rgba(204, 170, 0, 0.2)',
              boxShadow: '0 4px 16px rgba(0,0,0,0.2)'
            }}
          >
            {/* Header del card */}
            <div className="flex items-center gap-3 mb-3 pb-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center font-bold text-sm flex-shrink-0"
                style={{
                  background: 'linear-gradient(135deg, #ccaa00, #b8941e)',
                  color: '#000',
                  boxShadow: '0 3px 10px rgba(204,170,0,0.3)'
                }}
              >
                {index + 1}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-bold text-sm truncate">{contenedor.tipo}</p>
                <p className="text-xs font-semibold mt-0.5" style={{ color: '#ccaa00' }}>
                  {contenedor.peso.toFixed(2)} kg / unidad
                </p>
              </div>
            </div>

            {/* Datos calculados */}
            <div className="grid grid-cols-3 gap-2">
              <div className="p-2.5 rounded-lg text-center" style={{ background: 'rgba(0, 0, 0, 0.25)' }}>
                <p className="text-[10px] text-gray-400 mb-1">×10</p>
                <p className="text-white text-xs font-bold">{(contenedor.peso * 10).toFixed(2)}</p>
                <p className="text-[10px] text-gray-500">kg</p>
              </div>
              <div className="p-2.5 rounded-lg text-center" style={{ background: 'rgba(0, 0, 0, 0.25)' }}>
                <p className="text-[10px] text-gray-400 mb-1">×50</p>
                <p className="text-white text-xs font-bold">{(contenedor.peso * 50).toFixed(2)}</p>
                <p className="text-[10px] text-gray-500">kg</p>
              </div>
              <div className="p-2.5 rounded-lg text-center" style={{ background: 'rgba(0, 0, 0, 0.25)' }}>
                <p className="text-[10px] text-gray-400 mb-1">×100</p>
                <p className="text-white text-xs font-bold">{(contenedor.peso * 100).toFixed(2)}</p>
                <p className="text-[10px] text-gray-500">kg</p>
              </div>
            </div>
          </div>
        ))}

        {contenedores.length === 0 && (
          <div
            className="text-center py-10 backdrop-blur-xl rounded-xl"
            style={{
              background: 'rgba(0, 0, 0, 0.3)',
              border: '1px solid rgba(204, 170, 0, 0.2)'
            }}
          >
            <Package className="w-12 h-12 mx-auto mb-3" style={{ color: '#ccaa00', opacity: 0.4 }} />
            <p className="text-gray-400 text-sm">No hay contenedores registrados</p>
          </div>
        )}
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