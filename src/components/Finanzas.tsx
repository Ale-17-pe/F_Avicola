import { useState } from 'react';
import { DollarSign, Users } from 'lucide-react';
import { Ingresos } from './Ingresos';
import { Cobranzas } from './Cobranzas';

type FinanzasTab = 'ingresos' | 'cobranzas';

export function Finanzas() {
  const [activeTab, setActiveTab] = useState<FinanzasTab>('ingresos');

  return (
    <div className="space-y-4 sm:space-y-6 p-2 sm:p-4">
      {/* Header */}
      <div className="px-1 sm:px-0">
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-white mb-1 sm:mb-2">Finanzas</h1>
        <p className="text-xs sm:text-sm md:text-base text-gray-400">Gestión de ingresos y trabajadores de cobranza</p>
      </div>

      {/* Tabs Container */}
      <div className="relative">
        {/* Mobile Tabs (Scrollable) */}
        <div className="sm:hidden overflow-x-auto pb-2">
          <div className="flex min-w-max gap-2 px-1">
            <button
              onClick={() => setActiveTab('ingresos')}
              className="px-4 py-2.5 rounded-lg font-bold transition-all flex items-center gap-2 whitespace-nowrap"
              style={{
                background: activeTab === 'ingresos' 
                  ? 'linear-gradient(to right, #0d4a24, #166534, #b8941e, #ccaa00)'
                  : 'rgba(255, 255, 255, 0.1)',
                color: activeTab === 'ingresos' ? 'white' : '#9ca3af',
                boxShadow: activeTab === 'ingresos' ? '0 4px 15px rgba(204, 170, 0, 0.3)' : 'none',
                border: activeTab === 'ingresos' ? 'none' : '1px solid rgba(255, 255, 255, 0.2)'
              }}
            >
              <DollarSign className="w-4 h-4 flex-shrink-0" />
              <span className="text-sm">Ingresos</span>
            </button>
            <button
              onClick={() => setActiveTab('cobranzas')}
              className="px-4 py-2.5 rounded-lg font-bold transition-all flex items-center gap-2 whitespace-nowrap"
              style={{
                background: activeTab === 'cobranzas' 
                  ? 'linear-gradient(to right, #0d4a24, #166534, #b8941e, #ccaa00)'
                  : 'rgba(255, 255, 255, 0.1)',
                color: activeTab === 'cobranzas' ? 'white' : '#9ca3af',
                boxShadow: activeTab === 'cobranzas' ? '0 4px 15px rgba(204, 170, 0, 0.3)' : 'none',
                border: activeTab === 'cobranzas' ? 'none' : '1px solid rgba(255, 255, 255, 0.2)'
              }}
            >
              <Users className="w-4 h-4 flex-shrink-0" />
              <span className="text-sm">Cobranzas</span>
            </button>
          </div>
        </div>

        {/* Desktop Tabs */}
        <div className="hidden sm:flex border-b" style={{ borderColor: 'rgba(204, 170, 0, 0.3)' }}>
          <button
            onClick={() => setActiveTab('ingresos')}
            className="px-4 sm:px-6 py-2 sm:py-3 font-bold transition-all flex items-center gap-1 sm:gap-2 relative group"
            style={{
              color: activeTab === 'ingresos' ? '#ccaa00' : '#9ca3af',
              borderBottom: activeTab === 'ingresos' ? '3px solid #ccaa00' : '3px solid transparent'
            }}
          >
            <DollarSign className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
            <span className="text-sm sm:text-base">Ingresos</span>
            {/* Hover effect for desktop */}
            <span 
              className="absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-ccaa00 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"
              style={{ backgroundColor: '#ccaa00' }}
            />
          </button>
          <button
            onClick={() => setActiveTab('cobranzas')}
            className="px-4 sm:px-6 py-2 sm:py-3 font-bold transition-all flex items-center gap-1 sm:gap-2 relative group"
            style={{
              color: activeTab === 'cobranzas' ? '#ccaa00' : '#9ca3af',
              borderBottom: activeTab === 'cobranzas' ? '3px solid #ccaa00' : '3px solid transparent'
            }}
          >
            <Users className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
            <span className="text-sm sm:text-base">Cobranzas</span>
            {/* Hover effect for desktop */}
            <span 
              className="absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-ccaa00 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"
              style={{ backgroundColor: '#ccaa00' }}
            />
          </button>
        </div>
      </div>

      {/* Active Tab Indicator for Mobile */}
      <div className="sm:hidden flex items-center justify-center">
        <div className="flex items-center gap-2">
          <div 
            className={`w-2 h-2 rounded-full ${activeTab === 'ingresos' ? 'bg-ccaa00' : 'bg-gray-600'}`}
            style={{ backgroundColor: activeTab === 'ingresos' ? '#ccaa00' : '#4b5563' }}
          />
          <div 
            className={`w-2 h-2 rounded-full ${activeTab === 'cobranzas' ? 'bg-ccaa00' : 'bg-gray-600'}`}
            style={{ backgroundColor: activeTab === 'cobranzas' ? '#ccaa00' : '#4b5563' }}
          />
        </div>
      </div>

      {/* Content */}
      <div className="mt-2 sm:mt-4">
        {activeTab === 'ingresos' && <Ingresos />}
        {activeTab === 'cobranzas' && <Cobranzas />}
      </div>
    </div>
  );
}