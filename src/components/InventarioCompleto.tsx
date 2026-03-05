import { useState } from 'react';
import { Users, Package, Container } from 'lucide-react';
import { useTheme, t } from '../contexts/ThemeContext';
import { ProveedoresConPedidos } from './ProveedoresConPedidos';
import { AvesSimplificado } from './AvesSimplificado';
import { GestionContenedores } from './GestionContenedores';

type InventarioTab = 'proveedores' | 'productos' | 'contenedores';

export function InventarioCompleto() {
  const { isDark } = useTheme();
  const c = t(isDark);
  const [activeTab, setActiveTab] = useState<InventarioTab>('productos');

  return (
    <div className="space-y-4 sm:space-y-6 p-2 sm:p-4">
      {/* Header */}
      <div className="px-1 sm:px-0">
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold mb-1 sm:mb-2" style={{ color: c.text }}>
          Compras y Almacén
        </h1>
        <p className="text-xs sm:text-sm md:text-base" style={{ color: c.textSecondary }}>
          Gestión de proveedores, productos y contenedores de la avícola
        </p>
      </div>

      {/* Tabs Container */}
      <div className="relative">
        {/* Mobile Tabs (Scrollable) */}
        <div className="sm:hidden overflow-x-auto pb-2">
          <div className="flex min-w-max gap-2 px-1">
            <button
              onClick={() => setActiveTab('productos')}
              className="px-4 py-2.5 rounded-lg font-bold transition-all flex items-center gap-2 whitespace-nowrap"
              style={{
                background: activeTab === 'productos'
                  ? 'linear-gradient(to right, #0d4a24, #166534, #b8941e, #ccaa00)'
                  : c.g10,
                color: activeTab === 'productos' ? c.text : c.textSecondary,
                boxShadow: activeTab === 'productos' ? '0 4px 15px rgba(204, 170, 0, 0.3)' : 'none',
                border: activeTab === 'productos' ? 'none' : `1px solid ${c.border}`
              }}
            >
              <Package className="w-4 h-4 flex-shrink-0" />
              <span className="text-sm">Gestión de Productos</span>
            </button>
            <button
              onClick={() => setActiveTab('proveedores')}
              className="px-4 py-2.5 rounded-lg font-bold transition-all flex items-center gap-2 whitespace-nowrap"
              style={{
                background: activeTab === 'proveedores'
                  ? 'linear-gradient(to right, #0d4a24, #166534, #b8941e, #ccaa00)'
                  : c.g10,
                color: activeTab === 'proveedores' ? c.text : c.textSecondary,
                boxShadow: activeTab === 'proveedores' ? '0 4px 15px rgba(204, 170, 0, 0.3)' : 'none',
                border: activeTab === 'proveedores' ? 'none' : `1px solid ${c.border}`
              }}
            >
              <Users className="w-4 h-4 flex-shrink-0" />
              <span className="text-sm">Gestión de Proveedores</span>
            </button>
            <button
              onClick={() => setActiveTab('contenedores')}
              className="px-4 py-2.5 rounded-lg font-bold transition-all flex items-center gap-2 whitespace-nowrap"
              style={{
                background: activeTab === 'contenedores'
                  ? 'linear-gradient(to right, #0d4a24, #166534, #b8941e, #ccaa00)'
                  : c.g10,
                color: activeTab === 'contenedores' ? c.text : c.textSecondary,
                boxShadow: activeTab === 'contenedores' ? '0 4px 15px rgba(204, 170, 0, 0.3)' : 'none',
                border: activeTab === 'contenedores' ? 'none' : `1px solid ${c.border}`
              }}
            >
              <Container className="w-4 h-4 flex-shrink-0" />
              <span className="text-sm">Gestión de Contenedores</span>
            </button>
          </div>
        </div>

        {/* Desktop/Tablet Tabs */}
        <div className="hidden sm:flex gap-3 mb-6">
          <button
            onClick={() => setActiveTab('productos')}
            className="px-6 py-3 rounded-lg font-bold transition-all flex items-center gap-3"
            style={{
              background: activeTab === 'productos'
                ? 'linear-gradient(to right, #0d4a24, #166534, #b8941e, #ccaa00)'
                : c.g10,
              color: activeTab === 'productos' ? c.text : c.textSecondary,
              boxShadow: activeTab === 'productos' ? '0 4px 15px rgba(204, 170, 0, 0.3)' : 'none',
              border: activeTab === 'productos' ? 'none' : `1px solid ${c.border}`
            }}
          >
            <Package className="w-5 h-5 flex-shrink-0" />
            <span className="text-base">Gestión de Productos</span>
          </button>
          <button
            onClick={() => setActiveTab('proveedores')}
            className="px-6 py-3 rounded-lg font-bold transition-all flex items-center gap-3"
            style={{
              background: activeTab === 'proveedores'
                ? 'linear-gradient(to right, #0d4a24, #166534, #b8941e, #ccaa00)'
                : c.g10,
              color: activeTab === 'proveedores' ? c.text : c.textSecondary,
              boxShadow: activeTab === 'proveedores' ? '0 4px 15px rgba(204, 170, 0, 0.3)' : 'none',
              border: activeTab === 'proveedores' ? 'none' : `1px solid ${c.border}`
            }}
          >
            <Users className="w-5 h-5 flex-shrink-0" />
            <span className="text-base">Gestión de Proveedores</span>
          </button>
          <button
            onClick={() => setActiveTab('contenedores')}
            className="px-6 py-3 rounded-lg font-bold transition-all flex items-center gap-3"
            style={{
              background: activeTab === 'contenedores'
                ? 'linear-gradient(to right, #0d4a24, #166534, #b8941e, #ccaa00)'
                : c.g10,
              color: activeTab === 'contenedores' ? c.text : c.textSecondary,
              boxShadow: activeTab === 'contenedores' ? '0 4px 15px rgba(204, 170, 0, 0.3)' : 'none',
              border: activeTab === 'contenedores' ? 'none' : `1px solid ${c.border}`
            }}
          >
            <Container className="w-5 h-5 flex-shrink-0" />
            <span className="text-base">Gestión de Contenedores</span>
          </button>
        </div>
      </div>

      {/* Tab Content */}
      <div className="mt-4 sm:mt-6">
        {activeTab === 'productos' && <AvesSimplificado />}
        {activeTab === 'proveedores' && <ProveedoresConPedidos />}
        {activeTab === 'contenedores' && <GestionContenedores />}
      </div>
    </div>
  );
}