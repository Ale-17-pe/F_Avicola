import { useState } from 'react';
import { FileText, Download, ChevronDown, ChevronUp, Package, Users, ShoppingCart, DollarSign, Truck, TrendingUp, UserCheck, Calendar } from 'lucide-react';
import { useApp } from '../contexts/AppContext';

interface Modulo {
  id: string;
  nombre: string;
  icono: React.ReactNode;
  color: string;
  submodulos: Submodulo[];
}

interface Submodulo {
  id: string;
  nombre: string;
  descripcion: string;
  generarDatos: () => any[];
  columnas: string[];
}

export function Informes() {
  const { empleados, clientes, tiposAve, costosClientes } = useApp();
  const [moduloExpandido, setModuloExpandido] = useState<string | null>(null);

  // Función para convertir datos a CSV
  const convertirACSV = (datos: any[], columnas: string[]): string => {
    if (datos.length === 0) return '';

    // Encabezados
    const headers = columnas.join(',');

    // Filas
    const rows = datos.map(item => {
      return columnas.map(col => {
        const valor = item[col];
        // Escapar valores que contengan comas o comillas
        if (typeof valor === 'string' && (valor.includes(',') || valor.includes('"'))) {
          return `"${valor.replace(/"/g, '""')}"`;
        }
        return valor ?? '';
      }).join(',');
    });

    return [headers, ...rows].join('\n');
  };

  // Función para descargar CSV
  const descargarCSV = (datos: any[], columnas: string[], nombreArchivo: string) => {
    const csv = convertirACSV(datos, columnas);
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', `${nombreArchivo}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Datos vacíos - se llenarán con datos reales del contexto
  const proveedoresMock: any[] = [];

  const avesMock: any[] = [];

  const pedidosMock: any[] = [];

  const clientesMock = clientes.map(c => ({
    nombre: c.nombre,
    contacto: c.contacto,
    telefono: c.telefono,
    direccion: '',
    estado: c.estado
  }));

  const costosClientesMock = costosClientes.map(cc => ({
    cliente: cc.clienteNombre,
    tipoAve: cc.tipoAveNombre,
    precioPorKg: cc.precioPorKg,
    fecha: cc.fecha
  }));

  const enviosMock: any[] = [];

  const controlEnviosMock: any[] = [];

  const ingresosMock: any[] = [];

  const cobranzasMock: any[] = [];

  const empleadosData = empleados.map(emp => ({
    nombre: `${emp.nombre} ${emp.apellidos}`,
    dni: emp.dni,
    telefono: emp.telefono,
    direccion: emp.direccion,
    cargo: emp.cargo,
    fechaContratacion: emp.fechaContratacion,
    salario: emp.salario,
    estado: emp.estado,
    email: emp.email || 'N/A'
  }));

  const asistenciaMock: any[] = [];

  // Definición de módulos
  const modulos: Modulo[] = [
    {
      id: 'inventario',
      nombre: 'Inventario',
      icono: <Package className="w-6 h-6" />,
      color: 'from-blue-500 to-blue-600',
      submodulos: [
        {
          id: 'proveedores',
          nombre: 'Proveedores',
          descripcion: 'Listado completo de proveedores registrados',
          generarDatos: () => proveedoresMock,
          columnas: ['nombre', 'contacto', 'telefono', 'email', 'direccion', 'tipoAves', 'estado']
        },
        {
          id: 'aves',
          nombre: 'Aves',
          descripcion: 'Inventario de aves con precios y stock',
          generarDatos: () => avesMock,
          columnas: ['tipoAve', 'proveedor', 'sexo', 'presentacion', 'pesoPromedio', 'merma', 'precioCompra', 'stock']
        }
      ]
    },
    {
      id: 'pedidos',
      nombre: 'Pedidos',
      icono: <ShoppingCart className="w-6 h-6" />,
      color: 'from-green-500 to-green-600',
      submodulos: [
        {
          id: 'pedidos',
          nombre: 'Todos los Pedidos',
          descripcion: 'Historial completo de pedidos',
          generarDatos: () => pedidosMock,
          columnas: ['numeroPedido', 'cliente', 'tipoAve', 'cantidad', 'fechaPedido', 'fechaEntrega', 'estado', 'total']
        }
      ]
    },
    {
      id: 'clientes',
      nombre: 'Clientes',
      icono: <Users className="w-6 h-6" />,
      color: 'from-purple-500 to-purple-600',
      submodulos: [
        {
          id: 'clientes',
          nombre: 'Todos los Clientes',
          descripcion: 'Base de datos de clientes',
          generarDatos: () => clientesMock,
          columnas: ['nombre', 'contacto', 'telefono', 'direccion', 'estado']
        },
        {
          id: 'costos',
          nombre: 'Costos de Clientes',
          descripcion: 'Precios por cliente y tipo de ave',
          generarDatos: () => costosClientesMock,
          columnas: ['cliente', 'tipoAve', 'precioPorKg', 'fecha']
        }
      ]
    },
    {
      id: 'distribucion',
      nombre: 'Distribución',
      icono: <Truck className="w-6 h-6" />,
      color: 'from-orange-500 to-orange-600',
      submodulos: [
        {
          id: 'envios',
          nombre: 'Envíos',
          descripcion: 'Registro de envíos y entregas',
          generarDatos: () => enviosMock,
          columnas: ['numeroEnvio', 'pedido', 'cliente', 'chofer', 'vehiculo', 'fechaSalida', 'estado']
        },
        {
          id: 'control',
          nombre: 'Control de Envíos',
          descripcion: 'Monitoreo en tiempo real de envíos',
          generarDatos: () => controlEnviosMock,
          columnas: ['numeroEnvio', 'ubicacionActual', 'temperatura', 'estadoVehiculo', 'horaActualizacion']
        }
      ]
    },
    {
      id: 'finanzas',
      nombre: 'Finanzas',
      icono: <DollarSign className="w-6 h-6" />,
      color: 'from-emerald-500 to-emerald-600',
      submodulos: [
        {
          id: 'ingresos',
          nombre: 'Ingresos',
          descripcion: 'Registro de ingresos por ventas',
          generarDatos: () => ingresosMock,
          columnas: ['fecha', 'concepto', 'cliente', 'cantidad', 'precioUnitario', 'total']
        },
        {
          id: 'cobranzas',
          nombre: 'Cobranzas',
          descripcion: 'Estado de facturas y pagos',
          generarDatos: () => cobranzasMock,
          columnas: ['numeroFactura', 'cliente', 'fechaEmision', 'fechaVencimiento', 'monto', 'montoPagado', 'estado']
        }
      ]
    },
    {
      id: 'rrhh',
      nombre: 'Recursos Humanos',
      icono: <UserCheck className="w-6 h-6" />,
      color: 'from-pink-500 to-pink-600',
      submodulos: [
        {
          id: 'empleados',
          nombre: 'Empleados',
          descripcion: 'Nómina de empleados',
          generarDatos: () => empleadosData,
          columnas: ['nombre', 'dni', 'telefono', 'direccion', 'cargo', 'fechaContratacion', 'salario', 'estado', 'email']
        },
        {
          id: 'asistencia',
          nombre: 'Asistencia',
          descripcion: 'Registro de asistencia diaria',
          generarDatos: () => asistenciaMock,
          columnas: ['empleado', 'cargo', 'fecha', 'horaEntrada', 'horaSalida', 'estado']
        }
      ]
    }
  ];

  const toggleModulo = (moduloId: string) => {
    setModuloExpandido(moduloExpandido === moduloId ? null : moduloId);
  };

  const handleDescargar = (submodulo: Submodulo, nombreModulo: string) => {
    const datos = submodulo.generarDatos();
    const nombreArchivo = `${nombreModulo}_${submodulo.nombre}`;
    descargarCSV(datos, submodulo.columnas, nombreArchivo);
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl text-white flex items-center gap-3">
            <FileText className="w-8 h-8 text-amber-400" />
            Informes
          </h1>
          <p className="text-gray-400 mt-1">
            Descarga reportes de todos los módulos del sistema
          </p>
        </div>
      </div>

      {/* Información */}
      <div className="bg-gradient-to-r from-amber-500/10 to-amber-600/10 border border-amber-500/30 rounded-xl p-5">
        <div className="flex items-start gap-3">
          <TrendingUp className="w-6 h-6 text-amber-400 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-amber-200 mb-1">Exportación de Datos</h3>
            <p className="text-amber-300/80 text-sm">
              Selecciona el módulo que deseas exportar. Los archivos se descargarán en formato CSV compatible con Excel y Google Sheets.
              Cada archivo incluye la fecha de generación en el nombre.
            </p>
          </div>
        </div>
      </div>

      {/* Módulos */}
      <div className="grid grid-cols-1 gap-4">
        {modulos.map((modulo) => (
          <div
            key={modulo.id}
            className="bg-gradient-to-br from-zinc-900 to-zinc-800 border border-zinc-700 rounded-xl overflow-hidden"
          >
            {/* Header del Módulo */}
            <button
              onClick={() => toggleModulo(modulo.id)}
              className="w-full px-5 py-4 flex items-center justify-between hover:bg-zinc-800/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className={`bg-gradient-to-r ${modulo.color} p-3 rounded-lg text-white`}>
                  {modulo.icono}
                </div>
                <div className="text-left">
                  <h3 className="text-white text-lg">{modulo.nombre}</h3>
                  <p className="text-gray-400 text-sm">
                    {modulo.submodulos.length} {modulo.submodulos.length === 1 ? 'reporte' : 'reportes'} disponibles
                  </p>
                </div>
              </div>
              {moduloExpandido === modulo.id ? (
                <ChevronUp className="w-5 h-5 text-gray-400" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-400" />
              )}
            </button>

            {/* Submódulos */}
            {moduloExpandido === modulo.id && (
              <div className="border-t border-zinc-700 bg-zinc-900/50">
                {modulo.submodulos.map((submodulo) => (
                  <div
                    key={submodulo.id}
                    className="px-5 py-4 border-b border-zinc-800 last:border-b-0 hover:bg-zinc-800/30 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <h4 className="text-white mb-1">{submodulo.nombre}</h4>
                        <p className="text-gray-400 text-sm mb-3">
                          {submodulo.descripcion}
                        </p>
                        <div className="flex flex-wrap gap-2">
                          <span className="text-xs text-gray-500 bg-zinc-800 px-2 py-1 rounded">
                            {submodulo.generarDatos().length} registros
                          </span>
                          <span className="text-xs text-gray-500 bg-zinc-800 px-2 py-1 rounded">
                            {submodulo.columnas.length} columnas
                          </span>
                          <span className="text-xs text-gray-500 bg-zinc-800 px-2 py-1 rounded">
                            Formato CSV
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDescargar(submodulo, modulo.nombre)}
                        className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-black px-4 py-2 rounded-lg flex items-center gap-2 transition-all shadow-lg shadow-amber-500/20 whitespace-nowrap flex-shrink-0"
                      >
                        <Download className="w-4 h-4" />
                        Descargar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Estadísticas Generales */}
      <div className="bg-gradient-to-br from-zinc-900 to-zinc-800 border border-zinc-700 rounded-xl p-6">
        <h3 className="text-white mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-amber-400" />
          Resumen de Datos Disponibles
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {modulos.map((modulo) => {
            const totalRegistros = modulo.submodulos.reduce(
              (acc, sub) => acc + sub.generarDatos().length,
              0
            );
            return (
              <div key={modulo.id} className="text-center">
                <div className={`bg-gradient-to-r ${modulo.color} p-2 rounded-lg text-white inline-flex mb-2`}>
                  {modulo.icono}
                </div>
                <p className="text-2xl text-white mb-1">{totalRegistros}</p>
                <p className="text-gray-400 text-sm">{modulo.nombre}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}