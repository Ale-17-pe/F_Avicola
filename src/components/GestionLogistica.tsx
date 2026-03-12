import { useState } from 'react';
import { Truck, MapPin, User, Car } from 'lucide-react';
import { Envios } from './Envios';
import { ConductoresSecretaria } from './ConductoresSecretaria';
import { VehiculosSecretaria } from './VehiculosSecretaria';
import { useTheme, t } from '../contexts/ThemeContext';

type SubModulo = 'envios' | 'conductores' | 'vehiculos';

const TABS: { key: SubModulo; label: string; icon: typeof Truck }[] = [
  { key: 'envios', label: 'Envíos y Zonas', icon: MapPin },
  { key: 'conductores', label: 'Conductores', icon: User },
  { key: 'vehiculos', label: 'Vehículos', icon: Car },
];

export function GestionLogistica() {
  const [activeTab, setActiveTab] = useState<SubModulo>('envios');
  const { isDark } = useTheme();
  const c = t(isDark);

  return (
    <div className="space-y-0">
      {/* Tabs de sub-módulos */}
      <div className="backdrop-blur-xl rounded-xl p-1 mb-4 sm:mb-6 flex gap-1" style={{
        background: c.bgCard,
        border: '1px solid ' + c.border,
      }}>
        {TABS.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-xs sm:text-sm font-bold transition-all"
              style={{
                background: isActive
                  ? 'linear-gradient(to right, #0d4a24, #ccaa00)'
                  : 'transparent',
                color: isActive ? '#ffffff' : c.textSecondary,
              }}
            >
              <Icon className="w-4 h-4" />
              <span className="hidden sm:inline">{tab.label}</span>
              <span className="sm:hidden">{tab.label.split(' ')[0]}</span>
            </button>
          );
        })}
      </div>

      {/* Contenido del sub-módulo activo */}
      {activeTab === 'envios' && <Envios />}
      {activeTab === 'conductores' && <ConductoresSecretaria />}
      {activeTab === 'vehiculos' && <VehiculosSecretaria />}
    </div>
  );
}
