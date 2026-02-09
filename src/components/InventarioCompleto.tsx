import { useState } from 'react';
import { Users, Bird } from 'lucide-react';
import { ProveedoresConPedidos } from './ProveedoresConPedidos';
import { AvesSimplificado } from './AvesSimplificado';

type InventarioTab = 'proveedores' | 'aves';

export function InventarioCompleto() {
  const [activeTab, setActiveTab] = useState<InventarioTab>('aves');

  return (
    <div className="space-y-4 sm:space-y-6 p-2 sm:p-4">
      {/* Header */}
      <div className="px-1 sm:px-0">
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-white mb-1 sm:mb-2">
          Compras y Almacén
        </h1>
        <p className="text-xs sm:text-sm md:text-base text-gray-400">
          Gestión de proveedores y aves de la avícola
        </p>
      </div>

      {/* Tabs Container */}
      <div className="relative">
        {/* Mobile Tabs (Scrollable) */}
        <div className="sm:hidden overflow-x-auto pb-2">
          <div className="flex min-w-max gap-2 px-1">
            <button
              onClick={() => setActiveTab('aves')}
              className="px-4 py-2.5 rounded-lg font-bold transition-all flex items-center gap-2 whitespace-nowrap"
              style={{
                background: activeTab === 'aves' 
                  ? 'linear-gradient(to right, #0d4a24, #166534, #b8941e, #ccaa00)'
                  : 'rgba(255, 255, 255, 0.1)',
                color: activeTab === 'aves' ? 'white' : '#9ca3af',
                boxShadow: activeTab === 'aves' ? '0 4px 15px rgba(204, 170, 0, 0.3)' : 'none',
                border: activeTab === 'aves' ? 'none' : '1px solid rgba(255, 255, 255, 0.2)'
              }}
            >
              <Bird className="w-4 h-4 flex-shrink-0" />
              <span className="text-sm">Gestión de Aves</span>
            </button>
            <button
              onClick={() => setActiveTab('proveedores')}
              className="px-4 py-2.5 rounded-lg font-bold transition-all flex items-center gap-2 whitespace-nowrap"
              style={{
                background: activeTab === 'proveedores' 
                  ? 'linear-gradient(to right, #0d4a24, #166534, #b8941e, #ccaa00)'
                  : 'rgba(255, 255, 255, 0.1)',
                color: activeTab === 'proveedores' ? 'white' : '#9ca3af',
                boxShadow: activeTab === 'proveedores' ? '0 4px 15px rgba(204, 170, 0, 0.3)' : 'none',
                border: activeTab === 'proveedores' ? 'none' : '1px solid rgba(255, 255, 255, 0.2)'
              }}
            >
              <Users className="w-4 h-4 flex-shrink-0" />
              <span className="text-sm">Gestión de Proveedores</span>
            </button>
          </div>
        </div>

        {/* Desktop/Tablet Tabs */}
        <div className="hidden sm:flex gap-3 mb-6">
          <button
            onClick={() => setActiveTab('aves')}
            className="px-6 py-3 rounded-lg font-bold transition-all flex items-center gap-3"
            style={{
              background: activeTab === 'aves' 
                ? 'linear-gradient(to right, #0d4a24, #166534, #b8941e, #ccaa00)'
                : 'rgba(255, 255, 255, 0.1)',
              color: activeTab === 'aves' ? 'white' : '#9ca3af',
              boxShadow: activeTab === 'aves' ? '0 4px 15px rgba(204, 170, 0, 0.3)' : 'none',
              border: activeTab === 'aves' ? 'none' : '1px solid rgba(255, 255, 255, 0.2)'
            }}
          >
            <Bird className="w-5 h-5 flex-shrink-0" />
            <span className="text-base">Gestión de Aves</span>
          </button>
          <button
            onClick={() => setActiveTab('proveedores')}
            className="px-6 py-3 rounded-lg font-bold transition-all flex items-center gap-3"
            style={{
              background: activeTab === 'proveedores' 
                ? 'linear-gradient(to right, #0d4a24, #166534, #b8941e, #ccaa00)'
                : 'rgba(255, 255, 255, 0.1)',
              color: activeTab === 'proveedores' ? 'white' : '#9ca3af',
              boxShadow: activeTab === 'proveedores' ? '0 4px 15px rgba(204, 170, 0, 0.3)' : 'none',
              border: activeTab === 'proveedores' ? 'none' : '1px solid rgba(255, 255, 255, 0.2)'
            }}
          >
            <Users className="w-5 h-5 flex-shrink-0" />
            <span className="text-base">Gestión de Proveedores</span>
          </button>
        </div>
      </div>

      {/* Tab Content */}
      <div className="mt-4 sm:mt-6">
        {activeTab === 'aves' && <AvesSimplificado />}
        {activeTab === 'proveedores' && <ProveedoresConPedidos />}
      </div>
    </div>
  );
}