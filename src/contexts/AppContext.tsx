import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Interfaces
export interface Cliente {
  id: string;
  nombre: string;
  contacto: string;
  telefono: string;
  email: string;
  zona: string;
  totalPedidos: number;
  ultimoPedido: string;
  estado: 'Activo' | 'Inactivo';
  saldoPendiente?: number;
}

export interface TipoAve {
  id: string;
  nombre: string;
  tieneSexo: boolean;
  tieneVariedad: boolean;
  variedades?: string[];
  color: string;
  categoria?: 'Ave' | 'Otro';
  estado?: 'Activo' | 'Inactivo';
}

export interface CostoCliente {
  id: string;
  clienteId: string;
  clienteNombre: string;
  tipoAveId: string;
  tipoAveNombre: string;
  variedad?: string;
  sexo?: 'Macho' | 'Hembra';
  precioPorKg: number;
  precioVivo?: number;
  precioPelado?: number;
  precioDestripado?: number;
  presentacion?: string;
  fecha: string;
}

export interface Empleado {
  id: string;
  nombre: string;
  apellidos: string;
  dni: string;
  telefono: string;
  direccion: string;
  cargo: 'Secretaria' | 'Producción' | 'Pesaje' | 'Seguridad' | 'Operadora';
  fechaContratacion: string;
  salario: number;
  estado: 'Activo' | 'Descanso';
  email?: string;
  foto?: string;
}

export interface BloquePesaje {
  numero: number;
  tamano: number;
  pesoBruto: number;
  tipoContenedor: string;
  pesoContenedor: number;
  cantidadContenedores: number;
}

export interface PedidoConfirmado {
  id: string;
  cliente: string;
  tipoAve: string;
  variedad?: string;
  presentacion: string;
  cantidad: number;
  cantidadJabas?: number;
  unidadesPorJaba?: number;
  contenedor: string; // Referencia del tipo de contenedor (criterio interno)
  fecha: string;
  hora: string;
  prioridad: number;
  numeroPedido?: string;
  numeroCliente?: string;
  esSubPedido?: boolean;
  estado?: 'Pendiente' | 'En Producción' | 'En Pesaje' | 'En Despacho' | 'Despachando' | 'En Ruta' | 'Con Incidencia' | 'Entregado' | 'Completado' | 'Completado con alerta' | 'Devolución' | 'Confirmado con Adición' | 'Cancelado';
  
  // CAMPOS DE PESAJE (se llenan en PesajeOperador)
  pesoBrutoTotal?: number; // Suma de todos los bloques
  pesoNetoTotal?: number; // pesoBrutoTotal - pesoTotalContenedores
  // Peso de referencia mostrado en Conductor (kg netos del ticket)
  pesoKg?: number;
  
  // Datos de contenedores por bloque (para tener trazabilidad)
  bloquesPesaje?: BloquePesaje[];
  
  // Totales de contenedores
  pesoTotalContenedores?: number;
  cantidadTotalContenedores?: number;
  
  // Datos de entrega
  conductor?: string;
  zonaEntrega?: string;
  ticketEmitido?: boolean;
  fechaPesaje?: string;
  horaPesaje?: string;
  numeroTicket?: string;

  // NUEVOS: Campos de acciones del conductor en ruta
  pesoRepesada?: number;
  pesoDevolucion?: number;
  motivoDevolucion?: string;
  pesoAdicional?: number;
  clienteAdicionalId?: string;
  clienteAdicionalNombre?: string;
  ultimaIncidencia?: string | null;
  // Merma calculada del pedido
  mermaTotal?: number;
  sexo?: 'Macho' | 'Hembra' | 'Mixto';
}

export interface Presentacion {
  id: string;
  tipoAve: string;
  nombre: string;
  mermaKg: number;
  variedad?: string;
  sexo?: 'Macho' | 'Hembra';
}

export interface Contenedor {
  id: string;
  tipo: string;
  peso: number;
}

export interface Pago {
  id: string;
  clienteId: string;
  clienteNombre: string;
  monto: number;
  metodo: 'Efectivo' | 'Transferencia' | 'Yape' | 'Plin' | 'Otro';
  fecha: string;
  hora: string;
  referencia?: string; // Para números de operación o notas
  foto?: string; // URL de la foto del comprobante
  estado: 'Pendiente' | 'Confirmado' | 'Rechazado';
  registradoPor: string;
}

interface AppContextType {
  // Clientes
  clientes: Cliente[];
  setClientes: (clientes: Cliente[]) => void;
  addCliente: (cliente: Cliente) => void;
  updateCliente: (cliente: Cliente) => void;
  deleteCliente: (id: string) => void;

  // Tipos de Ave
  tiposAve: TipoAve[];
  setTiposAve: (tipos: TipoAve[]) => void;
  addTipoAve: (tipo: TipoAve) => void;
  updateTipoAve: (tipo: TipoAve) => void;
  deleteTipoAve: (id: string) => void;

  // Costos de Clientes
  costosClientes: CostoCliente[];
  setCostosClientes: (costos: CostoCliente[]) => void;
  addCostoCliente: (costo: CostoCliente) => void;
  updateCostoCliente: (costo: CostoCliente) => void;
  deleteCostoCliente: (id: string) => void;

  // Empleados
  empleados: Empleado[];
  setEmpleados: (empleados: Empleado[]) => void;
  addEmpleado: (empleado: Empleado) => void;
  updateEmpleado: (empleado: Empleado) => void;
  deleteEmpleado: (id: string) => void;

  // Pedidos Confirmados
  pedidosConfirmados: PedidoConfirmado[];
  setPedidosConfirmados: (pedidos: PedidoConfirmado[]) => void;
  addPedidoConfirmado: (pedido: PedidoConfirmado) => void;
  addMultiplePedidosConfirmados: (pedidos: PedidoConfirmado[]) => void;
  updatePedidoConfirmado: (id: string, pedido: PedidoConfirmado) => void;
  removePedidoConfirmado: (id: string) => void;

  // Presentaciones
  presentaciones: Presentacion[];
  setPresentaciones: (presentaciones: Presentacion[]) => void;
  addPresentacion: (presentacion: Presentacion) => void;
  updatePresentacion: (presentacion: Presentacion) => void;
  deletePresentacion: (id: string) => void;

  // Contenedores
  contenedores: Contenedor[];
  setContenedores: (contenedores: Contenedor[]) => void;
  addContenedor: (contenedor: Contenedor) => void;
  updateContenedor: (contenedor: Contenedor) => void;
  deleteContenedor: (id: string) => void;

  // Pagos
  pagos: Pago[];
  setPagos: (pagos: Pago[]) => void;
  addPago: (pago: Pago) => void;
  updatePago: (pago: Pago) => void;
  deletePago: (id: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// Limpieza única de datos precargados anteriores
const CLEAN_VERSION = 'v2_clean';
if (localStorage.getItem('avicola_clean_version') !== CLEAN_VERSION) {
  // Eliminar todas las claves avicola_* para empezar desde cero
  const keysToRemove = Object.keys(localStorage).filter(k => k.startsWith('avicola_') || k.startsWith('cartera_'));
  keysToRemove.forEach(k => localStorage.removeItem(k));
  localStorage.setItem('avicola_clean_version', CLEAN_VERSION);
}

// Función auxiliar para cargar de localStorage
const loadFromStorage = <T,>(key: string, defaultValue: T): T => {
  try {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : defaultValue;
  } catch (error) {
    console.error(`Error loading ${key} from storage:`, error);
    return defaultValue;
  }
};

export function AppProvider({ children }: { children: ReactNode }) {
  // Estado inicial de Clientes
  const [clientes, setClientes] = useState<Cliente[]>(() =>
    loadFromStorage('avicola_clientes', [] as Cliente[])
  );

  // Estado inicial de Tipos de Ave
  const [tiposAve, setTiposAve] = useState<TipoAve[]>(() =>
    loadFromStorage('avicola_tiposAve', [] as TipoAve[])
  );

  // Estado inicial de Costos de Clientes
  const [costosClientes, setCostosClientes] = useState<CostoCliente[]>(() =>
    loadFromStorage('avicola_costosClientes', [] as CostoCliente[])
  );

  // Estado inicial de Empleados
  const [empleados, setEmpleados] = useState<Empleado[]>(() =>
    loadFromStorage('avicola_empleados', [] as Empleado[])
  );

  // Estado inicial de Pedidos Confirmados
  const [pedidosConfirmados, setPedidosConfirmados] = useState<PedidoConfirmado[]>(() =>
    loadFromStorage('avicola_pedidosConfirmados', [] as PedidoConfirmado[])
  );

  // Estado inicial de Presentaciones
  const [presentaciones, setPresentaciones] = useState<Presentacion[]>(() =>
    loadFromStorage('avicola_presentaciones', [] as Presentacion[])
  );

  // Estado inicial de Contenedores
  const [contenedores, setContenedores] = useState<Contenedor[]>(() =>
    loadFromStorage('avicola_contenedores', [] as Contenedor[])
  );

  // Estado inicial de Pagos
  const [pagos, setPagos] = useState<Pago[]>(() =>
    loadFromStorage('avicola_pagos', [])
  );

  // Efectos para guardar en localStorage cuando cambian los estados
  useEffect(() => localStorage.setItem('avicola_clientes', JSON.stringify(clientes)), [clientes]);
  useEffect(() => localStorage.setItem('avicola_tiposAve', JSON.stringify(tiposAve)), [tiposAve]);
  useEffect(() => localStorage.setItem('avicola_costosClientes', JSON.stringify(costosClientes)), [costosClientes]);
  useEffect(() => localStorage.setItem('avicola_empleados', JSON.stringify(empleados)), [empleados]);
  useEffect(() => localStorage.setItem('avicola_pedidosConfirmados', JSON.stringify(pedidosConfirmados)), [pedidosConfirmados]);
  useEffect(() => localStorage.setItem('avicola_presentaciones', JSON.stringify(presentaciones)), [presentaciones]);
  useEffect(() => localStorage.setItem('avicola_contenedores', JSON.stringify(contenedores)), [contenedores]);
  useEffect(() => localStorage.setItem('avicola_pagos', JSON.stringify(pagos)), [pagos]);

  // MIGRACIÓN removida: las presentaciones ahora se crean desde cero por el usuario

  // Escuchar cambios desde otras pestañas (storage event)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (!e.newValue) return;

      try {
        const data = JSON.parse(e.newValue);
        switch (e.key) {
          case 'avicola_pedidosConfirmados':
            setPedidosConfirmados(data);
            break;
          case 'avicola_clientes':
            setClientes(data);
            break;
          case 'avicola_tiposAve':
            setTiposAve(data);
            break;
          case 'avicola_costosClientes':
            setCostosClientes(data);
            break;
          case 'avicola_pagos':
            setPagos(data);
            break;
        }
      } catch (err) {
        console.error('Error parsing storage event data:', err);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // SYNC CROSS-TAB: Re-leer datos de localStorage al volver a la pestaña
  // Esto asegura que los cambios del conductor se reflejen al instante
  // cuando la secretaria cambia a su pestaña
  useEffect(() => {
    const reloadFromStorage = () => {
      try {
        const pedidosStr = localStorage.getItem('avicola_pedidosConfirmados');
        if (pedidosStr) setPedidosConfirmados(JSON.parse(pedidosStr));

        const clientesStr = localStorage.getItem('avicola_clientes');
        if (clientesStr) setClientes(JSON.parse(clientesStr));

        const costosStr = localStorage.getItem('avicola_costosClientes');
        if (costosStr) setCostosClientes(JSON.parse(costosStr));

        const pagosStr = localStorage.getItem('avicola_pagos');
        if (pagosStr) setPagos(JSON.parse(pagosStr));
      } catch (err) {
        console.error('Error recargando datos desde localStorage:', err);
      }
    };

    // Al volver a la pestaña, recargar datos
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        reloadFromStorage();
      }
    };

    // Polling cada 2s para mantener sync en tiempo real entre pestañas
    const interval = setInterval(() => {
      try {
        const fresh = localStorage.getItem('avicola_pedidosConfirmados');
        if (fresh) {
          const parsed = JSON.parse(fresh);
          setPedidosConfirmados(prev => {
            // Solo actualizar si los datos realmente cambiaron
            const prevStr = JSON.stringify(prev);
            if (prevStr !== fresh) return parsed;
            return prev;
          });
        }
      } catch (_) { /* ignore */ }
    }, 2000);

    document.addEventListener('visibilitychange', handleVisibility);
    // También recargar al recibir focus (backup para visibilitychange)
    window.addEventListener('focus', reloadFromStorage);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('focus', reloadFromStorage);
      clearInterval(interval);
    };
  }, []);

  // ============ FUNCIONES PARA CLIENTES ============
  const addCliente = (cliente: Cliente) => {
    setClientes(prev => [...prev, cliente]);
  };

  const updateCliente = (cliente: Cliente) => {
    setClientes(prev => prev.map(c => c.id === cliente.id ? cliente : c));
    // Actualizar nombre en costos si cambió
    setCostosClientes(prev => prev.map(costo =>
      costo.clienteId === cliente.id
        ? { ...costo, clienteNombre: cliente.nombre }
        : costo
    ));
  };

  const deleteCliente = (id: string) => {
    setClientes(prev => prev.filter(c => c.id !== id));
    // Eliminar costos asociados
    setCostosClientes(prev => prev.filter(costo => costo.clienteId !== id));
  };

  // ============ FUNCIONES PARA TIPOS DE AVE ============
  const addTipoAve = (tipo: TipoAve) => {
    setTiposAve(prev => [...prev, tipo]);
  };

  const updateTipoAve = (tipo: TipoAve) => {
    const prevTipo = tiposAve.find(t => t.id === tipo.id);
    setTiposAve(prev => prev.map(t => t.id === tipo.id ? tipo : t));
    // Actualizar nombre en costos si cambió
    setCostosClientes(prev => prev.map(costo =>
      costo.tipoAveId === tipo.id
        ? { ...costo, tipoAveNombre: tipo.nombre }
        : costo
    ));
    // Limpiar variedades eliminadas: presentaciones y costos huérfanos
    if (prevTipo?.tieneVariedad && prevTipo.variedades) {
      const nuevasVariedades = tipo.tieneVariedad && tipo.variedades ? tipo.variedades : [];
      const variedadesEliminadas = prevTipo.variedades.filter(v => !nuevasVariedades.includes(v));
      if (variedadesEliminadas.length > 0) {
        setPresentaciones(prev => prev.filter(p =>
          !(p.tipoAve === prevTipo.nombre && p.variedad && variedadesEliminadas.includes(p.variedad))
        ));
        setCostosClientes(prev => prev.filter(costo =>
          !(costo.tipoAveId === tipo.id && costo.variedad && variedadesEliminadas.includes(costo.variedad))
        ));
      }
    }
  };

  const deleteTipoAve = (id: string) => {
    const tipo = tiposAve.find(t => t.id === id);
    setTiposAve(prev => prev.filter(t => t.id !== id));
    // Eliminar presentaciones asociadas
    if (tipo) {
      setPresentaciones(prev => prev.filter(p => p.tipoAve !== tipo.nombre));
    }
    // Eliminar costos asociados
    setCostosClientes(prev => prev.filter(costo => costo.tipoAveId !== id));
  };

  // ============ FUNCIONES PARA COSTOS DE CLIENTES ============
  const addCostoCliente = (costo: CostoCliente) => {
    setCostosClientes(prev => [...prev, costo]);
  };

  const updateCostoCliente = (costo: CostoCliente) => {
    setCostosClientes(prev => prev.map(c => c.id === costo.id ? costo : c));
  };

  const deleteCostoCliente = (id: string) => {
    setCostosClientes(prev => prev.filter(c => c.id !== id));
  };

  // ============ FUNCIONES PARA EMPLEADOS ============
  const addEmpleado = (empleado: Empleado) => {
    setEmpleados(prev => [...prev, empleado]);
  };

  const updateEmpleado = (empleado: Empleado) => {
    setEmpleados(prev => prev.map(e => e.id === empleado.id ? empleado : e));
  };

  const deleteEmpleado = (id: string) => {
    setEmpleados(prev => prev.filter(e => e.id !== id));
  };

  // ============ FUNCIONES PARA PEDIDOS CONFIRMADOS ============
  const addPedidoConfirmado = (pedido: PedidoConfirmado) => {
    setPedidosConfirmados(prev => [...prev, pedido]);
  };

  const addMultiplePedidosConfirmados = (pedidos: PedidoConfirmado[]) => {
    setPedidosConfirmados(prev => [...prev, ...pedidos]);
  };

  // FUNCIÓN NUEVA: Actualizar un pedido existente
  const updatePedidoConfirmado = (id: string, pedido: PedidoConfirmado) => {
    setPedidosConfirmados(prev => prev.map(p => p.id === id ? pedido : p));
  };

  // FUNCIÓN NUEVA: Eliminar un pedido
  const removePedidoConfirmado = (id: string) => {
    setPedidosConfirmados(prev => prev.filter(p => p.id !== id));
  };

  // ============ FUNCIONES PARA PRESENTACIONES ============
  const addPresentacion = (presentacion: Presentacion) => {
    setPresentaciones(prev => [...prev, presentacion]);
  };

  const updatePresentacion = (presentacion: Presentacion) => {
    setPresentaciones(prev => prev.map(p => p.id === presentacion.id ? presentacion : p));
  };

  const deletePresentacion = (id: string) => {
    setPresentaciones(prev => prev.filter(p => p.id !== id));
  };

  // ============ FUNCIONES PARA CONTENEDORES ============
  const addContenedor = (contenedor: Contenedor) => {
    setContenedores(prev => [...prev, contenedor]);
  };

  const updateContenedor = (contenedor: Contenedor) => {
    setContenedores(prev => prev.map(c => c.id === contenedor.id ? contenedor : c));
  };

  const deleteContenedor = (id: string) => {
    setContenedores(prev => prev.filter(c => c.id !== id));
  };

  // ============ FUNCIONES PARA PAGOS ============
  const addPago = (pago: Pago) => {
    setPagos(prev => [...prev, pago]);
  };

  const updatePago = (pago: Pago) => {
    setPagos(prev => prev.map(p => p.id === pago.id ? pago : p));
  };

  const deletePago = (id: string) => {
    setPagos(prev => prev.filter(p => p.id !== id));
  };

  const value: AppContextType = {
    // Clientes
    clientes,
    setClientes,
    addCliente,
    updateCliente,
    deleteCliente,

    // Tipos de Ave
    tiposAve,
    setTiposAve,
    addTipoAve,
    updateTipoAve,
    deleteTipoAve,

    // Costos de Clientes
    costosClientes,
    setCostosClientes,
    addCostoCliente,
    updateCostoCliente,
    deleteCostoCliente,

    // Empleados
    empleados,
    setEmpleados,
    addEmpleado,
    updateEmpleado,
    deleteEmpleado,

    // Pedidos Confirmados
    pedidosConfirmados,
    setPedidosConfirmados,
    addPedidoConfirmado,
    addMultiplePedidosConfirmados,
    updatePedidoConfirmado,
    removePedidoConfirmado,

    // Presentaciones
    presentaciones,
    setPresentaciones,
    addPresentacion,
    updatePresentacion,
    deletePresentacion,

    // Contenedores
    contenedores,
    setContenedores,
    addContenedor,
    updateContenedor,
    deleteContenedor,

    // Pagos
    pagos,
    setPagos,
    addPago,
    updatePago,
    deletePago,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp debe ser usado dentro de un AppProvider');
  }
  return context;
}