import { useMemo, useState } from 'react';
import { User, Search, Phone, CreditCard, Truck } from 'lucide-react';
import { useApp, ConductorRegistrado } from '../contexts/AppContext';
import { useTheme, t } from '../contexts/ThemeContext';
import { toast } from 'sonner';

export function ConductoresSecretaria() {
  const { conductoresRegistrados, empleados, updateConductorRegistrado } = useApp();
  const { isDark } = useTheme();
  const c = t(isDark);

  const [searchTerm, setSearchTerm] = useState('');

  const conductoresRRHH = useMemo(
    () => {
      const idsConductoresRRHH = new Set(
        empleados.filter(e => e.rolSistema === 'conductor').map(e => e.id)
      );
      return conductoresRegistrados.filter(cd => idsConductoresRRHH.has(cd.id));
    },
    [empleados, conductoresRegistrados]
  );

  const filtered = useMemo(
    () =>
      conductoresRRHH.filter(
        (cd) =>
          cd.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
          cd.licencia.toLowerCase().includes(searchTerm.toLowerCase()) ||
          cd.usuario.toLowerCase().includes(searchTerm.toLowerCase())
      ),
    [conductoresRRHH, searchTerm]
  );

  const toggleEstado = (conductor: ConductorRegistrado) => {
    const nuevoEstado = conductor.estado === 'Esperando' ? 'Conduciendo' : 'Esperando';
    updateConductorRegistrado({ ...conductor, estado: nuevoEstado });
    toast.success(`${conductor.nombre} ahora está ${nuevoEstado}`);
  };

  const totalConductores = conductoresRRHH.length;
  const conduciendo = conductoresRRHH.filter(c => c.estado === 'Conduciendo').length;
  const esperando = conductoresRRHH.filter(c => c.estado === 'Esperando').length;

  return (
    <div className="space-y-4 sm:space-y-6 p-2 sm:p-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold mb-1 sm:mb-2" style={{ color: c.text }}>Conductores</h1>
          <p className="text-xs sm:text-sm" style={{ color: c.textSecondary }}>
            Conductores registrados desde RRHH (super-secretaria)
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3 md:gap-4">
        <div className="backdrop-blur-xl rounded-xl p-3 sm:p-4 md:p-6" style={{ background: c.bgCard, border: '1px solid ' + c.g20 }}>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs sm:text-sm" style={{ color: c.textSecondary }}>Total</p>
            <User className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: c.textSecondary }} />
          </div>
          <p className="text-lg sm:text-2xl md:text-3xl font-bold" style={{ color: c.text }}>{totalConductores}</p>
        </div>
        <div className="backdrop-blur-xl rounded-xl p-3 sm:p-4 md:p-6" style={{ background: c.bgCard, border: '1px solid rgba(34,197,94,0.3)' }}>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs sm:text-sm" style={{ color: c.textSecondary }}>Conduciendo</p>
            <Truck className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: '#22c55e' }} />
          </div>
          <p className="text-lg sm:text-2xl md:text-3xl font-bold" style={{ color: '#22c55e' }}>{conduciendo}</p>
        </div>
        <div className="backdrop-blur-xl rounded-xl p-3 sm:p-4 md:p-6" style={{ background: c.bgCard, border: '1px solid rgba(245,158,11,0.3)' }}>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs sm:text-sm" style={{ color: c.textSecondary }}>Esperando</p>
            <User className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: '#f59e0b' }} />
          </div>
          <p className="text-lg sm:text-2xl md:text-3xl font-bold" style={{ color: '#f59e0b' }}>{esperando}</p>
        </div>
      </div>

      <div className="backdrop-blur-xl rounded-xl p-3" style={{ background: c.bgCard, border: '1px solid ' + c.border }}>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar conductor por nombre, licencia o usuario..."
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
                  <th className="text-left px-4 py-3 font-bold text-xs uppercase tracking-wider" style={{ color: '#ccaa00' }}>ID</th>
                  <th className="text-left px-4 py-3 font-bold text-xs uppercase tracking-wider" style={{ color: '#ccaa00' }}>Nombre</th>
                  <th className="text-left px-4 py-3 font-bold text-xs uppercase tracking-wider" style={{ color: '#ccaa00' }}>Teléfono</th>
                  <th className="text-left px-4 py-3 font-bold text-xs uppercase tracking-wider" style={{ color: '#ccaa00' }}>Licencia</th>
                  <th className="text-left px-4 py-3 font-bold text-xs uppercase tracking-wider" style={{ color: '#ccaa00' }}>Usuario</th>
                  <th className="text-center px-4 py-3 font-bold text-xs uppercase tracking-wider" style={{ color: '#ccaa00' }}>Estado</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((conductor, idx) => (
                  <tr key={conductor.id} style={{ borderBottom: '1px solid ' + c.borderSubtle, background: idx % 2 === 0 ? 'transparent' : (isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)') }}>
                    <td className="px-4 py-3">
                      <span className="text-xs font-mono px-2 py-1 rounded" style={{ background: c.g10, color: c.textSecondary }}>
                        #{conductor.id.slice(-4)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: 'linear-gradient(135deg, #22c55e, #166534)' }}>
                          <User className="w-4 h-4 text-white" />
                        </div>
                        <span className="font-medium" style={{ color: c.text }}>{conductor.nombre}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3" style={{ color: c.textSecondary }}>
                      <div className="flex items-center gap-1">
                        <Phone className="w-3 h-3" />
                        {conductor.telefono}
                      </div>
                    </td>
                    <td className="px-4 py-3" style={{ color: c.textSecondary }}>
                      <div className="flex items-center gap-1">
                        <CreditCard className="w-3 h-3" />
                        {conductor.licencia}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs px-2 py-1 rounded" style={{ background: 'rgba(168,85,247,0.1)', color: '#a855f7', border: '1px solid rgba(168,85,247,0.2)' }}>
                        {conductor.usuario}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => toggleEstado(conductor)}
                        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold transition-all hover:scale-105 cursor-pointer"
                        style={{
                          background: conductor.estado === 'Conduciendo' ? 'rgba(34,197,94,0.15)' : 'rgba(245,158,11,0.15)',
                          color: conductor.estado === 'Conduciendo' ? '#22c55e' : '#f59e0b',
                          border: `1px solid ${conductor.estado === 'Conduciendo' ? 'rgba(34,197,94,0.3)' : 'rgba(245,158,11,0.3)'}`,
                        }}
                      >
                        <div className="relative w-8 h-4 rounded-full transition-all" style={{ background: conductor.estado === 'Conduciendo' ? 'rgba(34,197,94,0.4)' : 'rgba(245,158,11,0.4)' }}>
                          <div
                            className="absolute top-0.5 w-3 h-3 rounded-full transition-all"
                            style={{
                              background: conductor.estado === 'Conduciendo' ? '#22c55e' : '#f59e0b',
                              left: conductor.estado === 'Conduciendo' ? '18px' : '2px',
                            }}
                          />
                        </div>
                        {conductor.estado}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12">
            <User className="w-16 h-16 mx-auto mb-4" style={{ color: c.textMuted }} />
            <p className="text-base" style={{ color: c.textSecondary }}>
              {searchTerm ? 'No se encontraron conductores' : 'No hay conductores registrados en RRHH'}
            </p>
            <p className="text-sm mt-1" style={{ color: c.textMuted }}>
              Los conductores se crean desde el módulo RRHH de la super-secretaria
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
