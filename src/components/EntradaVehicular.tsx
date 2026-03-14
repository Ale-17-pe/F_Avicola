import { Car, Search, ShieldCheck, MapPin, Wrench, Route } from 'lucide-react';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { useApp, Vehiculo } from '../contexts/AppContext';
import { useTheme, t } from '../contexts/ThemeContext';

const ZONAS = [
  { id: '1', nombre: 'Zona 1 - Independencia' },
  { id: '2', nombre: 'Zona 2 - Provincia' },
  { id: '3', nombre: 'Zona 3 - Jicamarca' },
  { id: '4', nombre: 'Zona 4 - Sedapal, Zona Alta, Zona Baja, Corralito, Plumas' },
  { id: '5', nombre: 'Zona 5 - Vencedores' },
  { id: '6', nombre: 'Zona 6 - Montenegro, 10 de Octubre, Motupe, Mariscal, Mariátegui, Trébol' },
  { id: '7', nombre: 'Zona 7 - Valle Sagrado, Saruta' },
  { id: '8', nombre: 'Zona 8 - Bayovar, Huáscar, Peladero, Sta. María' },
];

export function EntradaVehicular() {
  const { vehiculos, updateVehiculo } = useApp();
  const { isDark } = useTheme();
  const c = t(isDark);

  const [searchTerm, setSearchTerm] = useState('');

  const filtered = useMemo(
    () =>
      vehiculos.filter((v) =>
        [v.placa, v.tipo, v.marca, v.modelo, v.zona]
          .join(' ')
          .toLowerCase()
          .includes(searchTerm.toLowerCase())
      ),
    [vehiculos, searchTerm]
  );

  const disponibles = vehiculos.filter((v) => v.estado === 'Disponible').length;
  const enRuta = vehiculos.filter((v) => v.estado === 'En Ruta').length;
  const enMantenimiento = vehiculos.filter((v) => v.estado === 'Mantenimiento').length;

  const estadoColor = (estado: Vehiculo['estado']) => {
    switch (estado) {
      case 'Disponible':
        return { bg: 'rgba(34,197,94,0.15)', color: '#22c55e', border: 'rgba(34,197,94,0.3)' };
      case 'En Ruta':
        return { bg: 'rgba(59,130,246,0.15)', color: '#3b82f6', border: 'rgba(59,130,246,0.3)' };
      case 'Mantenimiento':
        return { bg: 'rgba(239,68,68,0.15)', color: '#ef4444', border: 'rgba(239,68,68,0.3)' };
      default:
        return { bg: c.g10, color: c.text, border: c.g20 };
    }
  };

  const updateEstado = (vehiculo: Vehiculo, estado: Vehiculo['estado']) => {
    if (vehiculo.estado === estado) return;
    updateVehiculo({ ...vehiculo, estado });
    toast.success(`Estado actualizado: ${vehiculo.placa} -> ${estado}`);
  };

  return (
    <div className="space-y-4 sm:space-y-6 p-2 sm:p-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold mb-1 sm:mb-2" style={{ color: c.text }}>
            Entrada Vehicular
          </h1>
          <p className="text-xs sm:text-sm" style={{ color: c.textSecondary }}>
            Control de ingresos y gestión de estado de los vehículos registrados
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 md:gap-4">
        <div className="backdrop-blur-xl rounded-xl p-3 sm:p-4 md:p-6" style={{ background: c.bgCard, border: '1px solid ' + c.g20 }}>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs sm:text-sm" style={{ color: c.textSecondary }}>Total</p>
            <Car className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: c.textSecondary }} />
          </div>
          <p className="text-lg sm:text-2xl md:text-3xl font-bold" style={{ color: c.text }}>{vehiculos.length}</p>
        </div>

        <div className="backdrop-blur-xl rounded-xl p-3 sm:p-4 md:p-6" style={{ background: c.bgCard, border: '1px solid rgba(34,197,94,0.3)' }}>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs sm:text-sm" style={{ color: c.textSecondary }}>Disponible</p>
            <ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: '#22c55e' }} />
          </div>
          <p className="text-lg sm:text-2xl md:text-3xl font-bold" style={{ color: '#22c55e' }}>{disponibles}</p>
        </div>

        <div className="backdrop-blur-xl rounded-xl p-3 sm:p-4 md:p-6" style={{ background: c.bgCard, border: '1px solid rgba(59,130,246,0.3)' }}>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs sm:text-sm" style={{ color: c.textSecondary }}>En Ruta</p>
            <Route className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: '#3b82f6' }} />
          </div>
          <p className="text-lg sm:text-2xl md:text-3xl font-bold" style={{ color: '#3b82f6' }}>{enRuta}</p>
        </div>

        <div className="backdrop-blur-xl rounded-xl p-3 sm:p-4 md:p-6" style={{ background: c.bgCard, border: '1px solid rgba(239,68,68,0.3)' }}>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs sm:text-sm" style={{ color: c.textSecondary }}>Mantenimiento</p>
            <Wrench className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: '#ef4444' }} />
          </div>
          <p className="text-lg sm:text-2xl md:text-3xl font-bold" style={{ color: '#ef4444' }}>{enMantenimiento}</p>
        </div>
      </div>

      <div className="backdrop-blur-xl rounded-xl p-3" style={{ background: c.bgCard, border: '1px solid ' + c.border }}>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por placa, tipo, marca, modelo o zona..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-lg text-sm placeholder-gray-400"
            style={{ background: c.bgInput, border: '1px solid ' + c.border, color: c.text }}
          />
        </div>
      </div>

      <div className="backdrop-blur-xl rounded-xl overflow-hidden" style={{ background: c.bgCard, border: '1px solid ' + c.border }}>
        {filtered.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: isDark ? 'rgba(204,170,0,0.08)' : 'rgba(204,170,0,0.05)', borderBottom: '1px solid ' + c.borderGold }}>
                  <th className="text-left px-4 py-3 font-bold text-xs uppercase tracking-wider" style={{ color: '#ccaa00' }}>Placa</th>
                  <th className="text-left px-4 py-3 font-bold text-xs uppercase tracking-wider" style={{ color: '#ccaa00' }}>Tipo</th>
                  <th className="text-left px-4 py-3 font-bold text-xs uppercase tracking-wider" style={{ color: '#ccaa00' }}>Marca / Modelo</th>
                  <th className="text-left px-4 py-3 font-bold text-xs uppercase tracking-wider" style={{ color: '#ccaa00' }}>Zona Asignada</th>
                  <th className="text-center px-4 py-3 font-bold text-xs uppercase tracking-wider" style={{ color: '#ccaa00' }}>Estado</th>
                  <th className="text-center px-4 py-3 font-bold text-xs uppercase tracking-wider" style={{ color: '#ccaa00' }}>Cambiar Estado</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((vehiculo, idx) => {
                  const ec = estadoColor(vehiculo.estado);
                  const zonaNombre = ZONAS.find((z) => z.id === vehiculo.zona)?.nombre || vehiculo.zona || '—';

                  return (
                    <tr
                      key={vehiculo.id}
                      style={{
                        borderBottom: '1px solid ' + c.borderSubtle,
                        background: idx % 2 === 0 ? 'transparent' : isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)',
                      }}
                    >
                      <td className="px-4 py-3">
                        <span className="font-mono text-xs font-bold px-2 py-1 rounded" style={{ background: 'rgba(59,130,246,0.1)', color: '#3b82f6', border: '1px solid rgba(59,130,246,0.2)' }}>
                          {vehiculo.placa}
                        </span>
                      </td>
                      <td className="px-4 py-3" style={{ color: c.text }}>{vehiculo.tipo}</td>
                      <td className="px-4 py-3" style={{ color: c.textSecondary }}>{vehiculo.marca} {vehiculo.modelo}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-purple-400 flex-shrink-0" />
                          <span className="text-xs" style={{ color: c.text }}>{zonaNombre}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="px-2 py-1 rounded-full text-xs font-bold" style={{ background: ec.bg, color: ec.color, border: `1px solid ${ec.border}` }}>
                          {vehiculo.estado}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <select
                          value={vehiculo.estado}
                          onChange={(e) => updateEstado(vehiculo, e.target.value as Vehiculo['estado'])}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold appearance-none"
                          style={{ background: c.bgInput, border: '1px solid ' + c.border, color: c.text }}
                        >
                          <option value="Disponible">Disponible</option>
                          <option value="En Ruta">En Ruta</option>
                          <option value="Mantenimiento">Mantenimiento</option>
                        </select>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12">
            <Car className="w-16 h-16 mx-auto mb-4" style={{ color: c.textMuted }} />
            <p className="text-base" style={{ color: c.textSecondary }}>
              {searchTerm ? 'No se encontraron vehículos' : 'No hay vehículos registrados'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
