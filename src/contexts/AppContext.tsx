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
}

export interface TipoAve {
  id: string;
  nombre: string;
  tieneSexo: boolean;
  tieneVariedad: boolean;
  variedades?: string[];
  color: string;
}

export interface CostoCliente {
  id: string;
  clienteId: string;
  clienteNombre: string;
  tipoAveId: string;
  tipoAveNombre: string;
  precioPorKg: number;
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

export interface PedidoConfirmado {
  id: string;
  cliente: string;
  tipoAve: string;
  variedad?: string;
  presentacion: string;
  cantidad: number;
  contenedor: string;
  fecha: string;
  hora: string;
  prioridad: number;
  numeroPedido?: string;
  numeroCliente?: string;
  esSubPedido?: boolean;
  estado?: 'Pendiente' | 'En Producción' | 'Completado' | 'Cancelado';
}

export interface Presentacion {
  id: string;
  tipoAve: string;
  nombre: string;
  mermaKg: number;
}

export interface Contenedor {
  id: string;
  tipo: string;
  peso: number;
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
}

const AppContext = createContext<AppContextType | undefined>(undefined);

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
    loadFromStorage('avicola_clientes', [
      {
        id: '1',
        nombre: 'Restaurante El Sabor',
        contacto: 'Carlos Mendoza',
        telefono: '987 654 321',
        email: 'contacto@elsabor.com',
        zona: '1',
        totalPedidos: 45,
        ultimoPedido: '2025-02-01',
        estado: 'Activo'
      },
      {
        id: '2',
        nombre: 'Pollería Don José',
        contacto: 'José Ramirez',
        telefono: '912 345 678',
        email: 'jose@polleriadonjose.com',
        zona: '2',
        totalPedidos: 32,
        ultimoPedido: '2025-01-30',
        estado: 'Activo'
      },
      {
        id: '3',
        nombre: 'Mercado Central',
        contacto: 'Ana Torres',
        telefono: '998 765 432',
        email: 'ana@mercadocentral.com',
        zona: '3',
        totalPedidos: 18,
        ultimoPedido: '2025-01-25',
        estado: 'Inactivo'
      }
    ])
  );

  // Estado inicial de Tipos de Ave
  const [tiposAve, setTiposAve] = useState<TipoAve[]>(() => 
    loadFromStorage('avicola_tiposAve', [
      { id: '1', nombre: 'Pollo', tieneSexo: true, tieneVariedad: false, color: '#22c55e' },
      { id: '2', nombre: 'Pato', tieneSexo: true, tieneVariedad: false, color: '#3b82f6' },
      { id: '3', nombre: 'Pavo', tieneSexo: true, tieneVariedad: false, color: '#8b5cf6' },
      { id: '4', nombre: 'Gallina', tieneSexo: false, tieneVariedad: true, variedades: ['Rojas', 'Doble Pechuga'], color: '#ec4899' }
    ])
  );

  // Estado inicial de Costos de Clientes
  const [costosClientes, setCostosClientes] = useState<CostoCliente[]>(() => 
    loadFromStorage('avicola_costosClientes', [
      {
        id: '1',
        clienteId: '1',
        clienteNombre: 'Restaurante El Sabor',
        tipoAveId: '1',
        tipoAveNombre: 'Pollo',
        precioPorKg: 8.50,
        fecha: '2025-02-02'
      }
    ])
  );

  // Estado inicial de Empleados
  const [empleados, setEmpleados] = useState<Empleado[]>(() => 
    loadFromStorage('avicola_empleados', [
      {
        id: '1',
        nombre: 'Ana',
        apellidos: 'García López',
        dni: '12345678',
        telefono: '987654321',
        direccion: 'Av. Principal 123, Lima',
        cargo: 'Secretaria',
        fechaContratacion: '2023-01-15',
        salario: 1500,
        estado: 'Activo',
        email: 'ana.garcia@avicolajossy.com',
        foto: 'https://images.unsplash.com/photo-1610387694365-19fafcc86d86?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400'
      }
    ])
  );

  // Estado inicial de Pedidos Confirmados
  const [pedidosConfirmados, setPedidosConfirmados] = useState<PedidoConfirmado[]>(() => 
    loadFromStorage('avicola_pedidosConfirmados', [
      {
        id: '1',
        cliente: 'Restaurante El Sabor',
        tipoAve: 'Pollo',
        presentacion: 'Entero',
        cantidad: 10,
        contenedor: 'Caja',
        fecha: '2025-02-02',
        hora: '10:00',
        prioridad: 1,
        estado: 'Pendiente'
      },
      {
        id: '2',
        cliente: 'Pollería Don José',
        tipoAve: 'Pavo',
        presentacion: 'Entero',
        cantidad: 5,
        contenedor: 'Caja',
        fecha: '2025-02-02',
        hora: '11:00',
        prioridad: 2,
        estado: 'Pendiente'
      },
      {
        id: '3',
        cliente: 'Restaurante El Sabor',
        tipoAve: 'Gallina',
        presentacion: 'Pelado',
        cantidad: 8,
        contenedor: 'Javas Viejas',
        fecha: '2025-02-02',
        hora: '12:00',
        prioridad: 1,
        estado: 'En Producción'
      }
    ])
  );

  // Estado inicial de Presentaciones
  const [presentaciones, setPresentaciones] = useState<Presentacion[]>(() => 
    loadFromStorage('avicola_presentaciones', [
      { id: '1', tipoAve: 'Pollo', nombre: 'Vivo', mermaKg: 0 },
      { id: '2', tipoAve: 'Pollo', nombre: 'Pelado', mermaKg: 0.15 },
      { id: '3', tipoAve: 'Pollo', nombre: 'Destripado', mermaKg: 0.20 },
      { id: '4', tipoAve: 'Gallina', nombre: 'Vivo', mermaKg: 0 },
      { id: '5', tipoAve: 'Gallina', nombre: 'Pelado', mermaKg: 0.15 },
      { id: '6', tipoAve: 'Gallina', nombre: 'Destripado', mermaKg: 0.20 }
    ])
  );

  // Estado inicial de Contenedores
  const [contenedores, setContenedores] = useState<Contenedor[]>(() => 
    loadFromStorage('avicola_contenedores', [
      { id: '1', tipo: 'Javas Nuevas', peso: 2.5 },
      { id: '2', tipo: 'Javas Viejas', peso: 2.0 },
      { id: '3', tipo: 'Tinas Verdes', peso: 3.5 },
      { id: '4', tipo: 'Bolsas', peso: 0.05 }
    ])
  );

  // Efectos para guardar en localStorage cuando cambian los estados
  useEffect(() => localStorage.setItem('avicola_clientes', JSON.stringify(clientes)), [clientes]);
  useEffect(() => localStorage.setItem('avicola_tiposAve', JSON.stringify(tiposAve)), [tiposAve]);
  useEffect(() => localStorage.setItem('avicola_costosClientes', JSON.stringify(costosClientes)), [costosClientes]);
  useEffect(() => localStorage.setItem('avicola_empleados', JSON.stringify(empleados)), [empleados]);
  useEffect(() => localStorage.setItem('avicola_pedidosConfirmados', JSON.stringify(pedidosConfirmados)), [pedidosConfirmados]);
  useEffect(() => localStorage.setItem('avicola_presentaciones', JSON.stringify(presentaciones)), [presentaciones]);
  useEffect(() => localStorage.setItem('avicola_contenedores', JSON.stringify(contenedores)), [contenedores]);

  // Escuchar cambios desde otras pestañas
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
          // ... se pueden agregar más si es necesario
        }
      } catch (err) {
        console.error('Error parsing storage event data:', err);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
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
    setTiposAve(prev => prev.map(t => t.id === tipo.id ? tipo : t));
    // Actualizar nombre en costos si cambió
    setCostosClientes(prev => prev.map(costo => 
      costo.tipoAveId === tipo.id 
        ? { ...costo, tipoAveNombre: tipo.nombre }
        : costo
    ));
  };

  const deleteTipoAve = (id: string) => {
    setTiposAve(prev => prev.filter(t => t.id !== id));
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