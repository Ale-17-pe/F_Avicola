import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export function AvesMetrics() {
  // Datos para las métricas y gráficas
  const sexoData = [
    { name: 'Machos', value: 380, color: '#3b82f6' },
    { name: 'Hembras', value: 350, color: '#ec4899' },
    { name: 'Gallinas', value: 380, color: '#f59e0b' },
  ];

  const precioComparativoData = [
    { tipo: 'Pollo', precioMin: 22, precioMax: 28, promedio: 25.5 },
    { tipo: 'Gallina', precioMin: 30, precioMax: 40, promedio: 35 },
    { tipo: 'Pato', precioMin: 28, precioMax: 35, promedio: 32 },
    { tipo: 'Pavo', precioMin: 45, precioMax: 55, promedio: 50 },
  ];

  const proveedorAvesData = [
    { nombre: 'D. San Martín', cantidad: 520, color: '#22c55e' },
    { nombre: 'Avícola Norte', cantidad: 380, color: '#ccaa00' },
    { nombre: 'Granja El Sol', cantidad: 220, color: '#3b82f6' },
    { nombre: 'Otros', cantidad: 128, color: '#8b5cf6' },
  ];

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="backdrop-blur-xl rounded-lg p-3" style={{
          background: 'rgba(0, 0, 0, 0.9)',
          border: '1px solid rgba(204, 170, 0, 0.3)'
        }}>
          <p className="text-white font-bold mb-1">{payload[0].payload.name || payload[0].payload.tipo || payload[0].payload.nombre}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }} className="text-sm">
              {entry.name}: {entry.value}{entry.name.includes('precio') ? ' S/' : ''}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
      {/* Distribución por Sexo */}
      <div className="backdrop-blur-xl rounded-xl p-6" style={{
        background: 'rgba(0, 0, 0, 0.3)',
        border: '1px solid rgba(255, 255, 255, 0.1)'
      }}>
        <h3 className="text-lg font-bold text-white mb-4">Distribución por Sexo</h3>
        <div style={{ width: '100%', height: '200px', minHeight: '200px', minWidth: 0 }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={sexoData}
                cx="50%"
                cy="50%"
                innerRadius={40}
                outerRadius={70}
                paddingAngle={5}
                dataKey="value"
              >
                {sexoData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-4 space-y-2">
          {sexoData.map((item, index) => (
            <div key={index} className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ background: item.color }} />
                <span className="text-gray-300">{item.name}</span>
              </div>
              <span className="font-bold text-white">{item.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Precio Promedio por Tipo */}
      <div className="backdrop-blur-xl rounded-xl p-6" style={{
        background: 'rgba(0, 0, 0, 0.3)',
        border: '1px solid rgba(255, 255, 255, 0.1)'
      }}>
        <h3 className="text-lg font-bold text-white mb-4">Precios Promedio (S/)</h3>
        <div style={{ width: '100%', height: '200px', minHeight: '200px', minWidth: 0 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={precioComparativoData} layout="horizontal">
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
              <XAxis type="number" stroke="#9ca3af" style={{ fontSize: '10px' }} />
              <YAxis dataKey="tipo" type="category" stroke="#9ca3af" style={{ fontSize: '10px' }} width={60} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="promedio" fill="#ccaa00" radius={[0, 4, 4, 0]} name="Precio Prom." />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-4 p-3 rounded-lg" style={{ background: 'rgba(204, 170, 0, 0.1)' }}>
          <p className="text-gray-400 text-xs">Precio General Promedio</p>
          <p className="text-xl font-bold" style={{ color: '#ccaa00' }}>S/ 35.62</p>
        </div>
      </div>

      {/* Aves por Proveedor */}
      <div className="backdrop-blur-xl rounded-xl p-6" style={{
        background: 'rgba(0, 0, 0, 0.3)',
        border: '1px solid rgba(255, 255, 255, 0.1)'
      }}>
        <h3 className="text-lg font-bold text-white mb-4">Aves por Proveedor</h3>
        <div style={{ width: '100%', height: '200px', minHeight: '200px', minWidth: 0 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={proveedorAvesData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
              <XAxis dataKey="nombre" stroke="#9ca3af" style={{ fontSize: '9px' }} angle={-15} textAnchor="end" height={60} />
              <YAxis stroke="#9ca3af" style={{ fontSize: '10px' }} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="cantidad" name="Aves" radius={[8, 8, 0, 0]}>
                {proveedorAvesData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}