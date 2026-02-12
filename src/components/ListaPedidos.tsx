import { useState, useEffect } from 'react';
import { Search, Filter, Package, ListOrdered, User, Tag, Edit2, Trash2, Plus, X, Truck, Box, Users, Layers, History, Calendar, Merge, Check, AlertCircle, Save, RotateCcw, Eye, Weight, CheckCircle, User as UserIcon, Truck as TruckIcon, Wrench } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { toast } from 'sonner'

// Interfaces
interface PedidoConfirmado {
  id: string;
  cliente: string;
  tipoAve: string;
  variedad?: string;
  presentacion: string;
  cantidad: number;
  cantidadJabas?: number;
  unidadesPorJaba?: number;
  contenedor: string;
  fecha: string;
  hora: string;
  prioridad: number;
  numeroPedido?: string;
  numeroCliente?: string;
  esSubPedido?: boolean;
  estado?: 'Pendiente' | 'En Producción' | 'Pesaje' | 'Entregado' | 'Completado' | 'Cancelado';
}

interface PedidoLista {
  id: string;
  numeroPedido: string;
  numeroCliente: string;
  cliente: string;
  tipoAve: string;
  variedad?: string;
  cantidad: number;
  cantidadJabas?: number;
  unidadesPorJaba?: number;
  cantidadMachos?: number;
  cantidadHembras?: number;
  presentacion: string;
  mermaUnitaria: number;
  mermaTotal: number;
  contenedor: string;
  pesoContenedor: number;
  pesoTotalPedido: number;
  empleado: string;
  fecha: string;
  hora: string;
  estado: 'Pendiente' | 'En Producción' | 'Pesaje' | 'Entregado' | 'Completado' | 'Cancelado';
  autoConfirmado: boolean;
  esSubPedido: boolean;
  prioridadBase: number;
  subNumero: number;
  ordenProduccion: number;
}

interface PedidoAgrupado {
  cliente: string;
  numeroCliente: string;
  pedidos: PedidoLista[];
  totalAves: number;
  pedidosPendientes: number;
}

interface ModificacionPedido {
  id: string;
  pedidoOriginalId: string;
  tipo: 'CANCELACION' | 'MODIFICACION' | 'AUMENTO' | 'CONSOLIDACION' | 'EDICION_MULTIPLE';
  cantidadAnterior: number;
  cantidadNueva: number;
  fecha: string;
  hora: string;
  motivo?: string;
  detalles?: string;
  pedidosAfectados?: string[];
}

interface ConsolidacionSugerida {
  clave: string;
  pedidos: PedidoLista[];
  totalCantidad: number;
  puedeConsolidar: boolean;
  motivo?: string;
}

// Interface para formulario de pedido rÃ¡pido
interface NuevoPedidoRapido {
  cliente: string;
  numeroCliente: string;
  tipoAve: string;
  variedad?: string;
  cantidadMachos: string;
  cantidadHembras: string;
  presentacion: string;
  contenedor: string;
}

// NUEVAS INTERFACES PARA PESAJE
interface PedidoPesaje {
  id: string;
  numeroPedido: string;
  cliente: string;
  producto: string;
  cantidad: number;
  cantidadJabas?: number;
  unidadesPorJaba?: number;
  presentacion: string;
  contenedor: string;
  pesoContenedores?: number;
  numeroContenedores?: number;
  pesoBruto?: number;
  conductor?: Conductor;
  estadoPesaje: 'Pendiente' | 'Completado' | 'Verificado';
  fechaPesaje?: string;
  horaPesaje?: string;
  cantidadMachos?: number;
  cantidadHembras?: number;
}

interface Conductor {
  id: string;
  nombre: string;
  licencia: string;
  vehiculo: string;
  zonaAsignada: string;
  telefono?: string;
}

interface EdicionPedidoForm {
  id: string;
  cantidad: number;
  presentacion: string;
  contenedor: string;
  tipoAve?: string;
}

// FunciÃ³n helper para extraer informaciÃ³n de gÃ©nero del string tipoAve
const extraerInfoGenero = (tipoAve: string): { machos: number; hembras: number } | null => {
  const match = tipoAve.match(/\(M:(\d+),\s*H:(\d+)\)/);
  if (match) {
    return {
      machos: parseInt(match[1]),
      hembras: parseInt(match[2])
    };
  }
  return null;
};

export function ListaPedidos() {
  const { pedidosConfirmados, tiposAve, presentaciones, contenedores, clientes, updatePedidoConfirmado, removePedidoConfirmado, addPedidoConfirmado } = useApp();
  
  // Estados principales
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCliente, setFilterCliente] = useState<string>('all');
  const [filterTipoAve, setFilterTipoAve] = useState<string>('all');
  const [filterEstado, setFilterEstado] = useState<string>('all');
  const [pedidosLista, setPedidosLista] = useState<PedidoLista[]>([]);
  const [pedidosAgrupados, setPedidosAgrupados] = useState<PedidoAgrupado[]>([]);
  
  // Estados para gestiÃ³n de pedidos
  const [clienteSeleccionado, setClienteSeleccionado] = useState<PedidoAgrupado | null>(null);
  const [modoEdicion, setModoEdicion] = useState<'EDITAR' | 'CANCELAR' | 'AUMENTAR' | 'CONSOLIDAR' | 'NUEVO_SUB' | null>(null);
  const [pedidosSeleccionados, setPedidosSeleccionados] = useState<PedidoLista[]>([]);
  const [cantidadesEditadas, setCantidadesEditadas] = useState<{[key: string]: string}>({});
  const [motivoCancelacion, setMotivoCancelacion] = useState<string>('');
  
  // Estados para consolidaciÃ³n inteligente
  const [consolidacionesSugeridas, setConsolidacionesSugeridas] = useState<ConsolidacionSugerida[]>([]);
  const [mostrarSugerencias, setMostrarSugerencias] = useState(false);
  const [pedidosAEditar, setPedidosAEditar] = useState<PedidoLista[]>([]);
  const [editandoMultiple, setEditandoMultiple] = useState(false);
  
  // Estados para UI
  const [modificacionesHistorial, setModificacionesHistorial] = useState<ModificacionPedido[]>(() => {
    try {
      const saved = localStorage.getItem('modificacionesHistorial');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [vistaGrupos, setVistaGrupos] = useState(true);
  const [mostrarHistorial, setMostrarHistorial] = useState(false);
  const [mostrarDetallePedido, setMostrarDetallePedido] = useState<PedidoLista | null>(null);
  
  // NUEVOS ESTADOS PARA PESAJE Y EDICIÃ“N
  const [pedidoAEditar, setPedidoAEditar] = useState<PedidoLista | null>(null);
  const [formEdicion, setFormEdicion] = useState<EdicionPedidoForm | null>(null);
  
  // Estado para nuevo sub-pedido
  const [nuevoSubPedido, setNuevoSubPedido] = useState<Partial<PedidoConfirmado>>({
    cliente: '',
    tipoAve: '',
    presentacion: '',
    cantidad: 0,
    contenedor: '',
    fecha: new Date().toISOString().split('T')[0],
    hora: new Date().toTimeString().slice(0, 5),
    prioridad: 1,
    estado: 'Pendiente'
  });

  // Estados para pedidos en pesaje
  const [pedidosPesaje, setPedidosPesaje] = useState<PedidoPesaje[]>(() => {
    try {
      const saved = localStorage.getItem('pedidosPesaje');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Estados para conductores
  const [conductores, setConductores] = useState<Conductor[]>([
    { id: '1', nombre: 'Juan Pérez', licencia: 'A1234567', vehiculo: 'CamiÃ³n F350', zonaAsignada: 'Zona Norte', telefono: '555-0101' },
    { id: '2', nombre: 'María García', licencia: 'B2345678', vehiculo: 'CamiÃ³n F250', zonaAsignada: 'Zona Sur', telefono: '555-0102' },
    { id: '3', nombre: 'Carlos López', licencia: 'C3456789', vehiculo: 'CamiÃ³n F150', zonaAsignada: 'Zona Este', telefono: '555-0103' },
    { id: '4', nombre: 'Ana Martínez', licencia: 'D4567890', vehiculo: 'CamiÃ³n F450', zonaAsignada: 'Zona Oeste', telefono: '555-0104' }
  ]);

  const [conductorSeleccionado, setConductorSeleccionado] = useState<Conductor | null>(null);
  
  // Estados para modal de nuevo pedido rÃ¡pido (Aumentar)
  const [mostrarModalNuevoPedido, setMostrarModalNuevoPedido] = useState(false);
  const [nuevoPedidoRapido, setNuevoPedidoRapido] = useState<NuevoPedidoRapido>({
    cliente: '',
    numeroCliente: '',
    tipoAve: '',
    variedad: '',
    cantidadMachos: '',
    cantidadHembras: '',
    presentacion: '',
    contenedor: ''
  });
  
  // Guardar historial automÃ¡ticamente
  useEffect(() => {
    localStorage.setItem('modificacionesHistorial', JSON.stringify(modificacionesHistorial));
  }, [modificacionesHistorial]);

  // Sincronizar datos de pesaje desde PedidoConfirmado (cuando PesajeOperador confirma)
  useEffect(() => {
    if (!pedidosConfirmados || pedidosPesaje.length === 0) return;
    
    setPedidosPesaje(prev => prev.map(pp => {
      // Buscar el pedido confirmado correspondiente
      const original = pedidosConfirmados.find(pc => 
        pc.numeroPedido === pp.numeroPedido && pc.cliente === pp.cliente
      );
      if (!original) return pp;
      
      // Si tiene pesoKg y conductor, el pesaje fue completado en PesajeOperador
      if (original.pesoKg && original.conductor && original.zonaEntrega) {
        const conductorObj = conductores.find(c => c.nombre === original.conductor);
        
        // Calcular contenedores: para Vivo = cantidadJabas, para otros = bloques pesados
        const esVivoP = original.presentacion?.toLowerCase().includes('vivo');
        const numCont = esVivoP && original.cantidadJabas 
          ? original.cantidadJabas 
          : Math.ceil(original.cantidad / 10);
        
        return {
          ...pp,
          pesoBruto: original.pesoKg,
          numeroContenedores: numCont,
          pesoContenedores: original.pesoContenedores || 0,
          conductor: conductorObj || {
            id: 'pesaje',
            nombre: original.conductor,
            licencia: '',
            vehiculo: '',
            zonaAsignada: original.zonaEntrega || '',
          },
          estadoPesaje: 'Completado' as const,
          cantidadMachos: extraerInfoGenero(original.tipoAve)?.machos,
          cantidadHembras: extraerInfoGenero(original.tipoAve)?.hembras
        };  
      }
      return pp;
    }));
  }, [pedidosConfirmados]);

  // Guardar pedidos en pesaje automÃ¡ticamente
  useEffect(() => {
    localStorage.setItem('pedidosPesaje', JSON.stringify(pedidosPesaje));
  }, [pedidosPesaje]);

  // ============ PROCESAR PEDIDOS DESDE EL CONTEXTO ============
  useEffect(() => {
    const procesarPedidos = () => {
      const pedidosProcesados: PedidoLista[] = [];
      
      if (!pedidosConfirmados || pedidosConfirmados.length === 0) {
        setPedidosLista([]);
        setPedidosAgrupados([]);
        return;
      }
      
      pedidosConfirmados.forEach((pedido, index) => {
        let numeroPedido = '';
        let numeroCliente = '';
        let prioridadBase = 1;
        let subNumero = 1;
        let esSubPedido = false;
        
        if (pedido.numeroPedido && pedido.numeroPedido.includes('C')) {
          const match = pedido.numeroPedido.match(/^C(\d{3})\.(\d+)$/);
          if (match) {
            numeroCliente = `C${match[1]}`;
            prioridadBase = parseInt(match[1]);
            subNumero = parseInt(match[2]);
            numeroPedido = pedido.numeroPedido;
            esSubPedido = subNumero > 1;
          }
        }
        
        if (!numeroPedido) {
          numeroCliente = `C${pedido.prioridad.toString().padStart(3, '0')}`;
          prioridadBase = pedido.prioridad;
          subNumero = 1;
          numeroPedido = `${numeroCliente}.${subNumero}`;
        }
        
        const pedidoProcesado = crearPedidoLista(pedido, index, {
          numeroPedido,
          numeroCliente,
          prioridadBase,
          subNumero,
          esSubPedido
        });
        
        pedidosProcesados.push(pedidoProcesado);
      });
      
      const pedidosOrdenados = pedidosProcesados.sort((a, b) => {
        if (a.prioridadBase !== b.prioridadBase) {
          return a.prioridadBase - b.prioridadBase;
        }
        return a.subNumero - b.subNumero;
      });
      
      const pedidosConOrden = pedidosOrdenados.map((pedido, index) => ({
        ...pedido,
        ordenProduccion: index + 1
      }));
      
      setPedidosLista(pedidosConOrden);
      
      // Agrupar por cliente
      const agrupados: {[key: string]: PedidoAgrupado} = {};
      
      pedidosConOrden.forEach(pedido => {
        if (!agrupados[pedido.numeroCliente]) {
          agrupados[pedido.numeroCliente] = {
            cliente: pedido.cliente,
            numeroCliente: pedido.numeroCliente,
            pedidos: [],
            totalAves: 0,
            pedidosPendientes: 0
          };
        }
        
        agrupados[pedido.numeroCliente].pedidos.push(pedido);
        agrupados[pedido.numeroCliente].totalAves += pedido.cantidad;
        if (pedido.estado === 'Pendiente') {
          agrupados[pedido.numeroCliente].pedidosPendientes++;
        }
      });
      
      setPedidosAgrupados(Object.values(agrupados));
      
      // Buscar consolidaciones sugeridas
      buscarConsolidacionesSugeridas(pedidosConOrden);
    };
    
    procesarPedidos();
  }, [pedidosConfirmados]);

  const crearPedidoLista = (
    pedido: PedidoConfirmado, 
    index: number, 
    numeracion: {
      numeroPedido: string,
      numeroCliente: string,
      prioridadBase: number,
      subNumero: number,
      esSubPedido: boolean
    }
  ): PedidoLista => {
    const mermaPorPresentacion = (presentacion: string): number => {
      const presentacionEncontrada = presentaciones?.find(p => p.nombre === presentacion);
      return presentacionEncontrada ? presentacionEncontrada.mermaKg : 0;
    };
    
    const mermaUnitaria = mermaPorPresentacion(pedido.presentacion);
    const mermaTotal = pedido.cantidad * mermaUnitaria;
    const contenedorInfo = contenedores?.find(c => c.tipo === pedido.contenedor);
    const pesoContenedor = contenedorInfo?.peso || 2.5;
    const pesoPromedioAve = 1.8;
    const pesoTotalPedido = (pedido.cantidad * pesoPromedioAve) + pesoContenedor - mermaTotal;
    
    // Extraer informaciÃ³n de gÃ©nero
    const infoGenero = extraerInfoGenero(pedido.tipoAve);
    
    // Extraer variedad si existe
    const extraerVariedad = (tipo: string): string | null => {
      // Intentar extraer de parÃ©ntesis (viejo formato)
      const matchParen = tipo.match(/\((?!M:|H:)(.*?)\)/);
      if (matchParen) return matchParen[1];
      
      // Intentar extraer de " - Variedad" (nuevo formato)
      const matchDash = tipo.match(/ - ([^(]+)/);
      if (matchDash) return matchDash[1].trim();
      
      return null;
    };
    const variedad = pedido.variedad || extraerVariedad(pedido.tipoAve);
    
    // Extraer tipo de ave base (sin sexo/variedad)
    const tipoAveBase = pedido.tipoAve.replace(/\(M:\d+,\s*H:\d+\)/g, '').replace(/\(.*?\)/g, '').replace(/-.*$/, '').trim();
    
    return {
      id: pedido.id,
      numeroPedido: numeracion.numeroPedido,
      numeroCliente: numeracion.numeroCliente,
      cliente: pedido.cliente,
      tipoAve: tipoAveBase,
      variedad: variedad || undefined,
      cantidad: pedido.cantidad,
      cantidadJabas: pedido.cantidadJabas,
      unidadesPorJaba: pedido.unidadesPorJaba,
      cantidadMachos: infoGenero?.machos,
      cantidadHembras: infoGenero?.hembras,
      presentacion: pedido.presentacion,
      mermaUnitaria,
      mermaTotal,
      contenedor: pedido.contenedor,
      pesoContenedor,
      pesoTotalPedido,
      empleado: 'Sistema',
      fecha: pedido.fecha,
      hora: pedido.hora,
      estado: pedido.estado || 'Pendiente',
      autoConfirmado: true,
      esSubPedido: numeracion.esSubPedido,
      prioridadBase: numeracion.prioridadBase,
      subNumero: numeracion.subNumero,
      ordenProduccion: index + 1
    };
  };

  // ============ FUNCIONES DE GESTIÃ“N INTELIGENTE ============

  // FunciÃ³n para verificar si pedidos son similares (para consolidar)
  const sonPedidosSimilares = (pedido1: PedidoLista, pedido2: PedidoLista): boolean => {
    // Solo consolidar pedidos pendientes
    if (pedido1.estado !== 'Pendiente' || pedido2.estado !== 'Pendiente') {
      return false;
    }
    
    // Verificar si son del mismo cliente
    if (pedido1.cliente !== pedido2.cliente) {
      return false;
    }
    
    // Extraer informaciÃ³n base del tipo de ave (sin sexo/variedad)
    const tipoAve1 = pedido1.tipoAve.toLowerCase();
    const tipoAve2 = pedido2.tipoAve.toLowerCase();
    
    // Verificar tipo de ave, presentaciÃ³n y contenedor
    return (
      tipoAve1 === tipoAve2 &&
      pedido1.presentacion === pedido2.presentacion &&
      pedido1.contenedor === pedido2.contenedor
    );
  };

  // Buscar consolidaciones sugeridas automÃ¡ticamente
  const buscarConsolidacionesSugeridas = (pedidos: PedidoLista[]) => {
    const grupos: { [key: string]: PedidoLista[] } = {};
    
    pedidos.forEach(pedido => {
      if (pedido.estado !== 'Pendiente') return;
      
      const clave = `${pedido.cliente}-${pedido.tipoAve}-${pedido.presentacion}-${pedido.contenedor}`;
      
      if (!grupos[clave]) {
        grupos[clave] = [];
      }
      grupos[clave].push(pedido);
    });
    
    const sugerencias: ConsolidacionSugerida[] = [];
    
    Object.entries(grupos).forEach(([clave, grupoPedidos]) => {
      if (grupoPedidos.length > 1) {
        const totalCantidad = grupoPedidos.reduce((sum, p) => sum + p.cantidad, 0);
        
        sugerencias.push({
          clave,
          pedidos: grupoPedidos,
          totalCantidad,
          puedeConsolidar: true,
          motivo: `${grupoPedidos.length} pedidos similares del mismo cliente`
        });
      }
    });
    
    setConsolidacionesSugeridas(sugerencias);
  };

  // Consolidar pedidos automÃ¡ticamente
  const consolidarPedidosAutomaticamente = () => {
    if (consolidacionesSugeridas.length === 0) {
      toast.info('No hay pedidos similares para consolidar');
      return;
    }
    
    const ahora = new Date();
    const fecha = ahora.toISOString().split('T')[0];
    const hora = ahora.toTimeString().split(' ')[0].slice(0, 5);
    
    let consolidadosCount = 0;
    
    consolidacionesSugeridas.forEach(sugerencia => {
      if (sugerencia.pedidos.length > 1) {
        // Tomar el primer pedido como base
        const pedidoBase = sugerencia.pedidos[0];
        const pedidosParaConsolidar = sugerencia.pedidos.slice(1);
        
        // Calcular nueva cantidad
        const nuevaCantidad = sugerencia.totalCantidad;
        
        // Buscar pedido original en el contexto
        const pedidoOriginal = pedidosConfirmados?.find(p => p.id === pedidoBase.id);
        
        if (pedidoOriginal) {
          // Actualizar el pedido base con la suma total
          updatePedidoConfirmado(pedidoBase.id, {
            ...pedidoOriginal,
            cantidad: nuevaCantidad
          });
          
          // Eliminar los pedidos consolidados
          pedidosParaConsolidar.forEach(pedido => {
            removePedidoConfirmado(pedido.id);
          });
          
          // Registrar en historial
          setModificacionesHistorial(prev => [...prev, {
            id: `consolidado-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            pedidoOriginalId: pedidoBase.id,
            tipo: 'CONSOLIDACION',
            cantidadAnterior: pedidoBase.cantidad,
            cantidadNueva: nuevaCantidad,
            fecha,
            hora,
            motivo: 'ConsolidaciÃ³n automÃ¡tica de pedidos similares',
            detalles: `Se consolidaron ${sugerencia.pedidos.length} pedidos`,
            pedidosAfectados: sugerencia.pedidos.map(p => p.numeroPedido)
          }]);
          
          consolidadosCount++;
        }
      }
    });
    
    if (consolidadosCount > 0) {
      toast.success(`${consolidadosCount} grupos de pedidos consolidados`);
      setConsolidacionesSugeridas([]);
      setMostrarSugerencias(false);
    }
  };

  // Consolidar pedidos seleccionados manualmente
  const consolidarPedidosSeleccionados = () => {
    if (pedidosSeleccionados.length < 2) {
      toast.error('Seleccione al menos 2 pedidos para consolidar');
      return;
    }
    
    // Verificar que todos sean similares
    const primerPedido = pedidosSeleccionados[0];
    const todosSimilares = pedidosSeleccionados.every(pedido => 
      sonPedidosSimilares(primerPedido, pedido)
    );
    
    if (!todosSimilares) {
      toast.error('Los pedidos seleccionados no son similares');
      return;
    }
    
    const ahora = new Date();
    const fecha = ahora.toISOString().split('T')[0];
    const hora = ahora.toTimeString().split(' ')[0].slice(0, 5);
    
    // Calcular nueva cantidad
    const nuevaCantidad = pedidosSeleccionados.reduce((sum, p) => sum + p.cantidad, 0);
    
    // Buscar pedido original del primero
    const pedidoOriginal = pedidosConfirmados?.find(p => p.id === primerPedido.id);
    
    if (pedidoOriginal) {
      // Actualizar el primer pedido con la suma total
      updatePedidoConfirmado(primerPedido.id, {
        ...pedidoOriginal,
        cantidad: nuevaCantidad
      });
      
      // Eliminar los demÃ¡s pedidos
      pedidosSeleccionados.slice(1).forEach(pedido => {
        removePedidoConfirmado(pedido.id);
      });
      
      // Registrar en historial
      setModificacionesHistorial(prev => [...prev, {
        id: `consolidado-manual-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        pedidoOriginalId: primerPedido.id,
        tipo: 'CONSOLIDACION',
        cantidadAnterior: primerPedido.cantidad,
        cantidadNueva: nuevaCantidad,
        fecha,
        hora,
        motivo: 'ConsolidaciÃ³n manual de pedidos seleccionados',
        detalles: `Se consolidaron ${pedidosSeleccionados.length} pedidos`,
        pedidosAfectados: pedidosSeleccionados.map(p => p.numeroPedido)
      }]);
      
      toast.success(`Se consolidaron ${pedidosSeleccionados.length} pedidos`);
      setModoEdicion(null);
      setPedidosSeleccionados([]);
    }
  };

  // Aumentar pedido con verificaciÃ³n de similares
  const manejarAumentoPedido = (pedidoExistente: PedidoLista, cantidadAumento: number): boolean => {
    // Buscar pedidos similares pendientes
    const pedidosSimilares = pedidosLista.filter(p => 
      sonPedidosSimilares(p, pedidoExistente) && 
      p.id !== pedidoExistente.id &&
      p.estado === 'Pendiente'
    );
    
    if (pedidosSimilares.length > 0) {
      const confirmarSuma = window.confirm(
        `Se encontraron ${pedidosSimilares.length} pedido(s) similares pendientes.\n\nÂ¿Desea sumar la cantidad a uno existente en lugar de crear uno nuevo?\n\nPedidos similares:\n${pedidosSimilares.map(p => `â€¢ ${p.numeroPedido} - ${p.cantidad} aves`).join('\n')}`
      );
      
      if (confirmarSuma) {
        // Sumar al primer pedido similar encontrado
        const pedidoASumar = pedidosSimilares[0];
        const pedidoOriginal = pedidosConfirmados?.find(p => p.id === pedidoASumar.id);
        
        if (pedidoOriginal) {
          const nuevaCantidad = pedidoASumar.cantidad + cantidadAumento;
          const ahora = new Date();
          const fecha = ahora.toISOString().split('T')[0];
          const hora = ahora.toTimeString().split(' ')[0].slice(0, 5);
          
          updatePedidoConfirmado(pedidoASumar.id, {
            ...pedidoOriginal,
            cantidad: nuevaCantidad
          });
          
          setModificacionesHistorial(prev => [...prev, {
            id: `suma-${Date.now()}-${pedidoASumar.id}`,
            pedidoOriginalId: pedidoASumar.id,
            tipo: 'AUMENTO',
            cantidadAnterior: pedidoASumar.cantidad,
            cantidadNueva: nuevaCantidad,
            fecha,
            hora,
            motivo: `Sumado desde pedido similar ${pedidoExistente.numeroPedido}`,
            detalles: `Se sumaron ${cantidadAumento} aves al pedido existente`
          }]);
          
          toast.success(`Cantidad sumada al pedido existente ${pedidoASumar.numeroPedido}`);
          return true;
        }
      }
    }
    
    return false;
  };

  // ============ NUEVAS FUNCIONALIDADES PARA PESAJE ============

  // 1. FUNCIÃ“N PARA CREAR NUEVO SUB-PEDIDO
  const abrirNuevoSubPedido = (pedidoBase: PedidoLista) => {
    setNuevoSubPedido({
      cliente: pedidoBase.cliente,
      tipoAve: pedidoBase.tipoAve,
      presentacion: pedidoBase.presentacion,
      contenedor: pedidoBase.contenedor,
      cantidad: 0,
      fecha: new Date().toISOString().split('T')[0],
      hora: new Date().toTimeString().slice(0, 5),
      prioridad: pedidoBase.prioridadBase,
      estado: 'Pendiente'
    });
    setModoEdicion('NUEVO_SUB');
  };

  const crearNuevoSubPedido = () => {
    if (!nuevoSubPedido.cantidad || nuevoSubPedido.cantidad <= 0) {
      toast.error('Ingrese una cantidad válida');
      return;
    }

    const ahora = new Date();
    const fecha = ahora.toISOString().split('T')[0];
    const hora = ahora.toTimeString().slice(0, 5);
    
    // Obtener el siguiente nÃºmero de sub-pedido
    const pedidosDelCliente = pedidosLista.filter(p => p.cliente === nuevoSubPedido.cliente);
    const ultimoSubNumero = Math.max(...pedidosDelCliente.map(p => p.subNumero), 0);
    const nuevoSubNumero = ultimoSubNumero + 1;
    const numeroCliente = pedidosDelCliente[0]?.numeroCliente || `C${nuevoSubPedido.prioridad!.toString().padStart(3, '0')}`;
    const numeroPedido = `${numeroCliente}.${nuevoSubNumero}`;

    const nuevoPedido: PedidoConfirmado = {
      id: `pedido-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      cliente: nuevoSubPedido.cliente!,
      tipoAve: nuevoSubPedido.tipoAve!,
      presentacion: nuevoSubPedido.presentacion!,
      cantidad: nuevoSubPedido.cantidad!,
      contenedor: nuevoSubPedido.contenedor!,
      fecha,
      hora,
      prioridad: nuevoSubPedido.prioridad!,
      numeroPedido,
      numeroCliente,
      esSubPedido: true,
      estado: 'Pendiente'
    };

    addPedidoConfirmado(nuevoPedido);

    setModificacionesHistorial(prev => [...prev, {
      id: `nuevo-sub-${Date.now()}`,
      pedidoOriginalId: nuevoPedido.id,
      tipo: 'MODIFICACION',
      cantidadAnterior: 0,
      cantidadNueva: nuevoPedido.cantidad,
      fecha,
      hora,
      motivo: 'Nuevo sub-pedido creado',
      detalles: `Sub-pedido ${numeroPedido} creado para cliente ${nuevoPedido.cliente}`
    }]);

    toast.success(`Nuevo sub-pedido ${numeroPedido} creado`);
    setModoEdicion(null);
    setNuevoSubPedido({
      cliente: '',
      tipoAve: '',
      presentacion: '',
      cantidad: 0,
      contenedor: '',
      fecha: new Date().toISOString().split('T')[0],
      hora: new Date().toTimeString().slice(0, 5),
      prioridad: 1,
      estado: 'Pendiente'
    });
  };

  // FunciÃ³n para abrir modal de nuevo pedido rÃ¡pido (Aumentar)
  const abrirModalNuevoPedido = (grupo: PedidoAgrupado) => {
    setNuevoPedidoRapido({
      cliente: grupo.cliente,
      numeroCliente: grupo.numeroCliente,
      tipoAve: '',
      variedad: '',
      cantidadMachos: '',
      cantidadHembras: '',
      presentacion: '',
      contenedor: ''
    });
    setMostrarModalNuevoPedido(true);
  };

  // FunciÃ³n para confirmar pedido rÃ¡pido desde modal
  const confirmarPedidoRapido = () => {
    const cantMachos = parseInt(nuevoPedidoRapido.cantidadMachos) || 0;
    const cantHembras = parseInt(nuevoPedidoRapido.cantidadHembras) || 0;
    const cantidadTotal = cantMachos + cantHembras;

    if (!nuevoPedidoRapido.tipoAve) {
      toast.error('Seleccione un tipo de ave');
      return;
    }
    if (cantidadTotal <= 0) {
      toast.error('Ingrese una cantidad válida');
      return;
    }
    if (!nuevoPedidoRapido.presentacion) {
      toast.error('Seleccione una presentación');
      return;
    }
    if (!nuevoPedidoRapido.contenedor) {
      toast.error('Seleccione un contenedor');
      return;
    }

    const ahora = new Date();
    const fecha = ahora.toISOString().split('T')[0];
    const hora = ahora.toTimeString().slice(0, 5);
    
    // Obtener el siguiente nÃºmero de sub-pedido para este cliente
    const pedidosDelCliente = pedidosLista.filter(p => p.cliente === nuevoPedidoRapido.cliente);
    const ultimoSubNumero = Math.max(...pedidosDelCliente.map(p => p.subNumero), 0);
    const nuevoSubNumero = ultimoSubNumero + 1;
    const numeroPedido = `${nuevoPedidoRapido.numeroCliente}.${nuevoSubNumero}`;

    // Obtener prioridad base del cliente
    const prioridadBase = pedidosDelCliente[0]?.prioridadBase || pedidosAgrupados.length + 1;

    const variedadInfo = nuevoPedidoRapido.variedad ? ` - ${nuevoPedidoRapido.variedad}` : '';
    const detalleSexo = cantidadTotal > 0 && (cantMachos > 0 || cantHembras > 0) 
      ? ` (M:${cantMachos}, H:${cantHembras})` 
      : '';

    const nuevoPedido: PedidoConfirmado = {
      id: `pedido-rapido-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      cliente: nuevoPedidoRapido.cliente,
      tipoAve: `${nuevoPedidoRapido.tipoAve}${variedadInfo}${detalleSexo}`,
      variedad: nuevoPedidoRapido.variedad,
      presentacion: nuevoPedidoRapido.presentacion,
      cantidad: cantidadTotal,
      contenedor: nuevoPedidoRapido.contenedor,
      fecha,
      hora,
      prioridad: prioridadBase,
      numeroPedido,
      numeroCliente: nuevoPedidoRapido.numeroCliente,
      esSubPedido: true,
      estado: 'Pendiente'
    };

    addPedidoConfirmado(nuevoPedido);

    setModificacionesHistorial(prev => [...prev, {
      id: `aumento-rapido-${Date.now()}`,
      pedidoOriginalId: nuevoPedido.id,
      tipo: 'AUMENTO',
      cantidadAnterior: 0,
      cantidadNueva: cantidadTotal,
      fecha,
      hora,
      motivo: 'Nuevo pedido rápido desde Aumentar',
      detalles: `Pedido ${numeroPedido}: ${cantidadTotal} ${nuevoPedidoRapido.tipoAve} (M:${cantMachos} H:${cantHembras})`
    }]);

    toast.success(`Nuevo pedido ${numeroPedido} creado para ${nuevoPedidoRapido.cliente}`);
    setMostrarModalNuevoPedido(false);
    setNuevoPedidoRapido({
      cliente: '',
      numeroCliente: '',
      tipoAve: '',
      variedad: '',
      cantidadMachos: '',
      cantidadHembras: '',
      presentacion: '',
      contenedor: ''
    });
  };

  // Obtener presentaciones por tipo de ave
  const getPresentacionesPorTipoAve = (tipoAve: string) => {
    // Retorna las presentaciones disponibles
    return presentaciones || [];
  };

  // 2. FUNCIÓN PARA EDITAR PEDIDO INDIVIDUAL
  const abrirEdicionPedido = (pedido: PedidoLista) => {
    if (pedido.estado === 'Completado') {
      toast.error('No se puede editar un pedido completado');
      return;
    }

    setPedidoAEditar(pedido);
    setFormEdicion({
      id: pedido.id,
      cantidad: pedido.cantidad,
      presentacion: pedido.presentacion,
      contenedor: pedido.contenedor,
      tipoAve: pedido.tipoAve
    });
  };

  const guardarEdicionPedido = () => {
    if (!pedidoAEditar || !formEdicion) return;

    const pedidoOriginal = pedidosConfirmados?.find(p => p.id === pedidoAEditar.id);
    if (!pedidoOriginal) {
      toast.error('No se encontró el pedido original');
      return;
    }

    const cambios: Partial<PedidoConfirmado> = {};
    const cambiosRealizados: string[] = [];

    if (formEdicion.cantidad !== pedidoAEditar.cantidad) {
      cambios.cantidad = formEdicion.cantidad;
      cambiosRealizados.push(`Cantidad: ${pedidoAEditar.cantidad} â†’ ${formEdicion.cantidad}`);
    }

    if (formEdicion.presentacion !== pedidoAEditar.presentacion) {
      cambios.presentacion = formEdicion.presentacion;
      cambiosRealizados.push(`Presentación: ${pedidoAEditar.presentacion} â†’ ${formEdicion.presentacion}`);
    }

    if (formEdicion.contenedor !== pedidoAEditar.contenedor) {
      cambios.contenedor = formEdicion.contenedor;
      cambiosRealizados.push(`Contenedor: ${pedidoAEditar.contenedor} â†’ ${formEdicion.contenedor}`);
    }

    if (cambiosRealizados.length === 0) {
      toast.info('No se realizaron cambios');
      setPedidoAEditar(null);
      setFormEdicion(null);
      return;
    }

    updatePedidoConfirmado(pedidoAEditar.id, {
      ...pedidoOriginal,
      ...cambios
    });

    const ahora = new Date();
    setModificacionesHistorial(prev => [...prev, {
      id: `edicion-${Date.now()}-${pedidoAEditar.id}`,
      pedidoOriginalId: pedidoAEditar.id,
      tipo: 'MODIFICACION',
      cantidadAnterior: pedidoAEditar.cantidad,
      cantidadNueva: formEdicion.cantidad,
      fecha: ahora.toISOString().split('T')[0],
      hora: ahora.toTimeString().slice(0, 5),
      motivo: 'Edición manual de pedido',
      detalles: `Cambios: ${cambiosRealizados.join(', ')}`
    }]);

    toast.success('Pedido actualizado correctamente');
    setPedidoAEditar(null);
    setFormEdicion(null);
  };

  // 3. FUNCIÓN PARA MOVER A PESAJE
  const moverAPesaje = (pedido: PedidoLista) => {
    if (pedido.estado !== 'En Producción') {
      toast.error('Solo se pueden mover a pesaje pedidos en producción');
      return;
    }

    const ahora = new Date();
    const fecha = ahora.toISOString().split('T')[0];
    const hora = ahora.toTimeString().slice(0, 5);

    // NO pre-llenar peso, contenedores ni conductor â€” se llenarÃ¡n en Pesaje
    const nuevoPedidoPesaje: PedidoPesaje = {
      id: `pesaje-${Date.now()}-${pedido.id}`,
      numeroPedido: pedido.numeroPedido,
      cliente: pedido.cliente,
      producto: pedido.tipoAve,
      cantidad: pedido.cantidad,
      cantidadJabas: pedido.cantidadJabas,
      unidadesPorJaba: pedido.unidadesPorJaba,
      presentacion: pedido.presentacion,
      contenedor: pedido.contenedor,
      estadoPesaje: 'Pendiente',
      fechaPesaje: fecha,
      horaPesaje: hora
    };

    // Actualizar estado del pedido original
    const pedidoOriginal = pedidosConfirmados?.find(p => p.id === pedido.id);
    if (pedidoOriginal) {
      updatePedidoConfirmado(pedido.id, {
        ...pedidoOriginal,
        estado: 'Pesaje'
      });
    }

    // Agregar a lista de pesaje
    setPedidosPesaje(prev => [...prev, nuevoPedidoPesaje]);

    // Registrar en historial
    setModificacionesHistorial(prev => [...prev, {
      id: `pesaje-${Date.now()}-${pedido.id}`,
      pedidoOriginalId: pedido.id,
      tipo: 'MODIFICACION',
      cantidadAnterior: pedido.cantidad,
      cantidadNueva: pedido.cantidad,
      fecha,
      hora,
      motivo: 'Movido a pesaje',
      detalles: `Pedido ${pedido.numeroPedido} movido a área de pesaje`
    }]);

    toast.success(`Pedido ${pedido.numeroPedido} movido a pesaje`);
  };

  // 4. FUNCIÓN PARA COMPLETAR PESAJE
  const completarPesaje = (pedidoPesajeId: string) => {
    setPedidosPesaje(prev => prev.map(p => 
      p.id === pedidoPesajeId 
        ? { ...p, estadoPesaje: 'Completado' }
        : p
    ));
    toast.success('Pesaje completado');
  };

  // 5. FUNCIÓN PARA ELIMINAR DE PESAJE (volver a producción)
  const eliminarDePesaje = (pedidoPesajeId: string) => {
    const pedidoPesaje = pedidosPesaje.find(p => p.id === pedidoPesajeId);
    if (!pedidoPesaje) return;

    // Buscar y actualizar el pedido original a En Producción
    const pedidoOriginal = pedidosConfirmados?.find(p => p.numeroPedido === pedidoPesaje.numeroPedido);
    if (pedidoOriginal) {
      updatePedidoConfirmado(pedidoOriginal.id, {
        ...pedidoOriginal,
        estado: 'En Producción'
      });
    }

    // Eliminar de la lista de pesaje
    setPedidosPesaje(prev => prev.filter(p => p.id !== pedidoPesajeId));
    toast.success('Pedido regresado a producción');
  };

  // ============ FUNCIONES DE GESTIÓN BÁSICA ============

  // Abrir modal para editar todos los pedidos de un cliente
  const abrirEdicionCliente = (cliente: PedidoAgrupado, modo: 'EDITAR' | 'CANCELAR' | 'AUMENTAR' | 'CONSOLIDAR') => {
    setClienteSeleccionado(cliente);
    setModoEdicion(modo);
    
    // Filtrar pedidos según el modo
    let pedidosFiltrados = cliente.pedidos;
    
    if (modo === 'EDITAR') {
      pedidosFiltrados = cliente.pedidos.filter(p => p.estado === 'Pendiente');
    } else if (modo === 'AUMENTAR') {
      pedidosFiltrados = cliente.pedidos.filter(p => p.estado === 'Pendiente');
    } else if (modo === 'CANCELAR') {
      pedidosFiltrados = cliente.pedidos;
    } else if (modo === 'CONSOLIDAR') {
      pedidosFiltrados = cliente.pedidos.filter(p => p.estado === 'Pendiente');
    }
    
    setPedidosSeleccionados(pedidosFiltrados);
    
    // Inicializar cantidades editadas
    const nuevasCantidades: {[key: string]: string} = {};
    pedidosFiltrados.forEach(pedido => {
      nuevasCantidades[pedido.id] = pedido.cantidad.toString();
    });
    setCantidadesEditadas(nuevasCantidades);
    setMotivoCancelacion('');
  };

  // Aplicar cambios a múltiples pedidos
  const aplicarCambiosMultiples = () => {
    if (!clienteSeleccionado) return;
    
    let cambiosAplicados = 0;
    const ahora = new Date();
    const fecha = ahora.toISOString().split('T')[0];
    const hora = ahora.toTimeString().split(' ')[0].slice(0, 5);
    
    pedidosSeleccionados.forEach(pedido => {
      const pedidoOriginal = pedidosConfirmados?.find(p => p.id === pedido.id);
      if (!pedidoOriginal) return;
      
      switch (modoEdicion) {
        case 'EDITAR':
          const nuevaCantidad = parseInt(cantidadesEditadas[pedido.id] || '0');
          if (nuevaCantidad !== pedido.cantidad && nuevaCantidad > 0) {
            updatePedidoConfirmado(pedido.id, {
              ...pedidoOriginal,
              cantidad: nuevaCantidad
            });
            
            setModificacionesHistorial(prev => [...prev, {
              id: `mod-${Date.now()}-${pedido.id}`,
              pedidoOriginalId: pedido.id,
              tipo: 'MODIFICACION',
              cantidadAnterior: pedido.cantidad,
              cantidadNueva: nuevaCantidad,
              fecha,
              hora,
              motivo: 'Edición manual de cantidad',
              detalles: `Cambio de ${pedido.cantidad} a ${nuevaCantidad} aves`
            }]);
            cambiosAplicados++;
          }
          break;
          
        case 'AUMENTAR':
          const aumentoCantidad = parseInt(cantidadesEditadas[pedido.id] || '0');
          const diferencia = aumentoCantidad - pedido.cantidad;
          
          if (diferencia > 0) {
            // Verificar si hay pedidos similares para sumar
            const sumado = manejarAumentoPedido(pedido, diferencia);
            
            if (!sumado) {
              // Si no se sumÃ³, actualizar el pedido original
              updatePedidoConfirmado(pedido.id, {
                ...pedidoOriginal,
                cantidad: aumentoCantidad
              });
              
              setModificacionesHistorial(prev => [...prev, {
                id: `aumento-${Date.now()}-${pedido.id}`,
                pedidoOriginalId: pedido.id,
                tipo: 'AUMENTO',
                cantidadAnterior: pedido.cantidad,
                cantidadNueva: aumentoCantidad,
                fecha,
                hora,
                motivo: 'Aumento de pedido',
                detalles: `Aumento de ${diferencia} aves`
              }]);
              cambiosAplicados++;
            }
          }
          break;
          
        case 'CANCELAR':
          if (!motivoCancelacion.trim()) {
            toast.error('Debe ingresar un motivo para cancelar');
            return;
          }
          
          updatePedidoConfirmado(pedido.id, {
            ...pedidoOriginal,
            estado: 'Cancelado'
          });
          
          setModificacionesHistorial(prev => [...prev, {
            id: `cancel-${Date.now()}-${pedido.id}`,
            pedidoOriginalId: pedido.id,
            tipo: 'CANCELACION',
            cantidadAnterior: pedido.cantidad,
            cantidadNueva: 0,
            fecha,
            hora,
            motivo: motivoCancelacion,
            detalles: 'Pedido cancelado'
          }]);
          cambiosAplicados++;
          break;
          
        case 'CONSOLIDAR':
          // La consolidaciÃ³n se maneja en otra funciÃ³n
          break;
      }
    });
    
    // Notificar resultado
    if (cambiosAplicados > 0) {
      if (modoEdicion === 'AUMENTAR') {
        toast.success(`${cambiosAplicados} aumento(s) aplicado(s)`);
      } else if (modoEdicion === 'CANCELAR') {
        toast.success(`${cambiosAplicados} pedido(s) cancelado(s)`);
      } else {
        toast.success(`${cambiosAplicados} pedido(s) editado(s)`);
      }
    } else {
      toast.info('No se realizaron cambios');
    }
    
    // Limpiar estado
    setModoEdicion(null);
    setClienteSeleccionado(null);
    setPedidosSeleccionados([]);
    setCantidadesEditadas({});
    setMotivoCancelacion('');
  };

  // Eliminar pedido individual
  const eliminarPedido = (id: string) => {
    if (confirm('¿Estás seguro de eliminar este pedido? Esta acción no se puede deshacer.')) {
      removePedidoConfirmado(id);
      
      const ahora = new Date();
      const fecha = ahora.toISOString().split('T')[0];
      const hora = ahora.toTimeString().split(' ')[0].slice(0, 5);
      
      setModificacionesHistorial(prev => [...prev, {
        id: `eliminado-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        pedidoOriginalId: id,
        tipo: 'CANCELACION',
        cantidadAnterior: 0,
        cantidadNueva: 0,
        fecha,
        hora,
        motivo: 'Eliminación manual',
        detalles: 'Pedido eliminado del sistema'
      }]);
      
      toast.success('Pedido eliminado correctamente');
    }
  };

  // Mover a producción
  const moverAProduccion = (pedido: PedidoLista) => {
    const pedidoOriginal = pedidosConfirmados?.find(p => p.id === pedido.id);
    if (pedidoOriginal) {
      updatePedidoConfirmado(pedido.id, {
        ...pedidoOriginal,
        estado: 'En Producción'
      });
      
      const ahora = new Date();
      const fecha = ahora.toISOString().split('T')[0];
      const hora = ahora.toTimeString().split(' ')[0].slice(0, 5);
      
      setModificacionesHistorial(prev => [...prev, {
        id: `produccion-${Date.now()}-${pedido.id}`,
        pedidoOriginalId: pedido.id,
        tipo: 'MODIFICACION',
        cantidadAnterior: pedido.cantidad,
        cantidadNueva: pedido.cantidad,
        fecha,
        hora,
        motivo: 'Enviado a producción',
        detalles: 'Estado cambiado a "En Producción"'
      }]);
      
      toast.success(`Pedido ${pedido.numeroPedido} enviado a producción`);
    }
  };

  // Editar mÃºltiples pedidos manualmente (seleccionando checkboxes)
  const iniciarEdicionMultiple = () => {
    const pedidosPendientes = pedidosLista.filter(p => p.estado === 'Pendiente');
    if (pedidosPendientes.length === 0) {
      toast.error('No hay pedidos pendientes para editar');
      return;
    }
    
    setPedidosAEditar(pedidosPendientes);
    setEditandoMultiple(true);
    
    // Inicializar cantidades editadas
    const nuevasCantidades: {[key: string]: string} = {};
    pedidosPendientes.forEach(pedido => {
      nuevasCantidades[pedido.id] = pedido.cantidad.toString();
    });
    setCantidadesEditadas(nuevasCantidades);
  };

  const guardarEdicionMultiple = () => {
    let cambiosAplicados = 0;
    const ahora = new Date();
    const fecha = ahora.toISOString().split('T')[0];
    const hora = ahora.toTimeString().split(' ')[0].slice(0, 5);
    
    const pedidosModificados: string[] = [];
    
    pedidosAEditar.forEach(pedido => {
      const nuevaCantidad = parseInt(cantidadesEditadas[pedido.id] || '0');
      if (nuevaCantidad !== pedido.cantidad && nuevaCantidad > 0) {
        const pedidoOriginal = pedidosConfirmados?.find(p => p.id === pedido.id);
        if (pedidoOriginal) {
          updatePedidoConfirmado(pedido.id, {
            ...pedidoOriginal,
            cantidad: nuevaCantidad
          });
          
          pedidosModificados.push(pedido.numeroPedido);
          cambiosAplicados++;
        }
      }
    });
    
    if (cambiosAplicados > 0) {
      setModificacionesHistorial(prev => [...prev, {
        id: `edicion-multiple-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        pedidoOriginalId: 'multiple',
        tipo: 'EDICION_MULTIPLE',
        cantidadAnterior: 0,
        cantidadNueva: 0,
        fecha,
        hora,
        motivo: 'EdiciÃ³n mÃºltiple de pedidos',
        detalles: `${cambiosAplicados} pedidos modificados`,
        pedidosAfectados: pedidosModificados
      }]);
      
      toast.success(`${cambiosAplicados} pedido(s) actualizado(s)`);
    } else {
      toast.info('No se realizaron cambios');
    }
    
    setEditandoMultiple(false);
    setPedidosAEditar([]);
    setCantidadesEditadas({});
  };

  // ============ FILTRAR Y BUSCAR ============
  const pedidosFiltrados = pedidosLista.filter(pedido => {
    const matchesSearch = 
      pedido.cliente.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pedido.tipoAve.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pedido.numeroPedido.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pedido.contenedor.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCliente = filterCliente === 'all' || pedido.cliente === filterCliente;
    const matchesTipoAve = filterTipoAve === 'all' || pedido.tipoAve === filterTipoAve;
    const matchesEstado = filterEstado === 'all' || pedido.estado === filterEstado;
    return matchesSearch && matchesCliente && matchesTipoAve && matchesEstado;
  });

  // Consolidar pedidos automÃ¡ticamente para mostrar
  const pedidosConsolidados = (() => {
    if (!vistaGrupos) return pedidosFiltrados;
    
    const grupos: { [key: string]: PedidoLista[] } = {};
    const consolidados: PedidoLista[] = [];
    
    pedidosFiltrados.forEach(pedido => {
      if (pedido.estado !== 'Pendiente') {
        consolidados.push(pedido);
        return;
      }
      
      const clave = `${pedido.cliente}-${pedido.tipoAve}-${pedido.presentacion}-${pedido.contenedor}`;
      
      if (!grupos[clave]) {
        grupos[clave] = [];
      }
      grupos[clave].push(pedido);
    });
    
    Object.values(grupos).forEach(grupo => {
      if (grupo.length > 1) {
        const pedidoConsolidado = {
          ...grupo[0],
          id: `consolidado-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          cantidad: grupo.reduce((sum, p) => sum + p.cantidad, 0),
          numeroPedido: `${grupo[0].numeroCliente}.${grupo.map(p => p.subNumero).join('+')}`,
          esSubPedido: true
        };
        consolidados.push(pedidoConsolidado);
      } else {
        consolidados.push(grupo[0]);
      }
    });
    
    return consolidados;
  })();

  const pedidosMostrar = pedidosConsolidados;

  // Filtrar pedidos por estado para cada secciÃ³n
  const pedidosPendientes = pedidosMostrar.filter(p => p.estado === 'Pendiente');
  const pedidosEnProduccion = pedidosMostrar.filter(p => p.estado === 'En Producción');
  const pedidosEnEntrega = pedidosMostrar.filter(p => p.estado === 'Entregado');
  const pedidosEntregados = pedidosMostrar.filter(p => p.estado === 'Completado');

  // Tabla de producciÃ³n combinada (para backward compat)
  const pedidosProduccion = pedidosLista.filter(p => p.estado !== 'Completado');

  // ============ ESTADÃ STICAS ============
  const totalPedidos = pedidosMostrar.length;
  const cantidadTotal = pedidosMostrar.reduce((acc, p) => acc + p.cantidad, 0);
  const clientesUnicos = Array.from(new Set(pedidosMostrar.map(p => p.cliente)));
  const enProduccion = pedidosMostrar.filter(p => p.estado === 'En Producción').length;
  const pendientes = pedidosMostrar.filter(p => p.estado === 'Pendiente').length;
  const cancelados = pedidosMostrar.filter(p => p.estado === 'Cancelado').length;
  const completados = pedidosLista.filter(p => p.estado === 'Completado').length;
  const enPesaje = pedidosPesaje.length;

  // Obtener clientes Ãºnicos para filtro
  const clientesParaFiltro = Array.from(new Set(pedidosLista.map(p => p.cliente)));
  const tiposAveParaFiltro = Array.from(new Set(pedidosLista.map(p => p.tipoAve)));

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
          <div className="space-y-2">
            <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-3">
              <div className="p-3 bg-black border border-amber-500/20 rounded-xl">
                <ListOrdered className="w-6 h-6 text-amber-400" />
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6">
                <div className="text-white tracking-tight">Lista de Pedidos</div>
                <div className="flex items-center gap-2 px-3 py-1 bg-gray-900/50 border border-gray-800 rounded-lg shadow-inner">
                  <Calendar className="w-3.5 h-3.5 text-gray-500" />
                  <div className="text-sm font-bold text-gray-400 tracking-wider">
                    {new Date().toLocaleDateString('es-PE', { weekday: 'long', day: 'numeric', month: 'long' }).toUpperCase()}
                  </div>
                </div>
              </div>
            </h1>
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                <span>{clientesUnicos.length} Clientes</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                <span>{pendientes} Pendientes</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                <span>{enPesaje} En pesaje</span>
              </div>
              {consolidacionesSugeridas.length > 0 && (
                <div className="flex items-center gap-2 text-sm text-green-400">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                  <span>{consolidacionesSugeridas.length} Consolidaciones sugeridas</span>
                </div>
              )}
            </div>
          </div>
          
          <div className="flex flex-wrap gap-3">
            <div className="bg-black border border-gray-800 rounded-xl px-4 py-2 flex items-center gap-3">
              <div className="text-center">
                <div className="text-sm text-gray-400">Pendientes</div>
                <div className="text-2xl font-bold text-amber-400">{pendientes}</div>
              </div>
              <div className="h-8 w-px bg-gray-800"></div>
              <div className="text-center">
                <div className="text-sm text-gray-400">Producción</div>
                <div className="text-2xl font-bold text-blue-400">{enProduccion}</div>
              </div>
              <div className="h-8 w-px bg-gray-800"></div>
              <div className="text-center">
                <div className="text-sm text-gray-400">Pesaje</div>
                <div className="text-2xl font-bold text-purple-400">{enPesaje}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Controles de Vista */}
        <div className="flex flex-wrap gap-3 mb-4">
          <button
            onClick={() => setVistaGrupos(!vistaGrupos)}
            className={`px-4 py-2 rounded-lg border flex items-center gap-2 ${
              vistaGrupos
                ? 'bg-amber-900/20 border-amber-700/30 text-amber-400'
                : 'bg-blue-900/20 border-blue-700/30 text-blue-400'
            }`}
          >
            <Layers className="w-4 h-4" />
            {vistaGrupos ? 'Vista Consolidada' : 'Vista Individual'}
          </button>
          
          <button
            onClick={() => setMostrarHistorial(!mostrarHistorial)}
            className="px-4 py-2 bg-black border border-gray-800 rounded-lg text-white flex items-center gap-2"
          >
            <History className="w-4 h-4" />
            Historial ({modificacionesHistorial.length})
          </button>
          
          {consolidacionesSugeridas.length > 0 && (
            <button
              onClick={() => setMostrarSugerencias(!mostrarSugerencias)}
              className={`px-4 py-2 rounded-lg border flex items-center gap-2 ${
                mostrarSugerencias
                  ? 'bg-green-900/30 border-green-700/30 text-green-400'
                  : 'bg-green-900/20 border-green-700/20 text-green-300'
              }`}
            >
              <Merge className="w-4 h-4" />
              Consolidaciones ({consolidacionesSugeridas.length})
            </button>
          )}
          
          <button
            onClick={iniciarEdicionMultiple}
            className="px-4 py-2 bg-blue-900/20 border border-blue-700/30 rounded-lg text-blue-400 flex items-center gap-2"
          >
            <Edit2 className="w-4 h-4" />
            Editar Múltiple
          </button>
          
          <button
            onClick={() => window.open('/pantalla-produccion', '_blank')}
            className="px-4 py-2 bg-amber-900/20 border border-amber-700/30 rounded-lg text-amber-400 flex items-center gap-2 hover:bg-amber-900/30 transition-colors"
          >
            <Eye className="w-4 h-4" />
            Pantalla Producción
          </button>
        </div>

        {/* Filtros */}
        <div className="bg-black border border-gray-800 rounded-2xl p-5 mb-8">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar cliente, número, ave..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-black/30 border border-gray-800 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20"
              />
            </div>

            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <select
                value={filterCliente}
                onChange={(e) => setFilterCliente(e.target.value)}
                className="w-full pl-10 pr-10 py-3 bg-black/30 border border-gray-800 rounded-xl text-white appearance-none focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500/20"
              >
                <option value="all" className="bg-black">Todos los clientes</option>
                {clientesParaFiltro.map(cliente => (
                  <option key={cliente} value={cliente} className="bg-black">
                    {cliente}
                  </option>
                ))}
              </select>
            </div>

            <div className="relative">
              <Package className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <select
                value={filterTipoAve}
                onChange={(e) => setFilterTipoAve(e.target.value)}
                className="w-full pl-10 pr-10 py-3 bg-black/30 border border-gray-800 rounded-xl text-white appearance-none focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/20"
              >
                <option value="all" className="bg-black">Todos los tipos</option>
                {tiposAveParaFiltro.map(tipo => (
                  <option key={tipo} value={tipo} className="bg-black">
                    {tipo}
                  </option>
                ))}
              </select>
            </div>

            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <select
                value={filterEstado}
                onChange={(e) => setFilterEstado(e.target.value)}
                className="w-full pl-10 pr-10 py-3 bg-black/30 border border-gray-800 rounded-xl text-white appearance-none focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/20"
              >
                <option value="all" className="bg-black">Todos</option>
                <option value="Pendiente" className="bg-black">Pendiente</option>
                <option value="En Producción" className="bg-black">En Producción</option>
                <option value="Completado" className="bg-black">Completado</option>
                <option value="Cancelado" className="bg-black">Cancelado</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Sugerencias de Consolidación */}
      {mostrarSugerencias && consolidacionesSugeridas.length > 0 && (
        <div className="mb-8 bg-green-900/10 border border-green-700/30 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Merge className="w-5 h-5 text-green-400" />
              <h2 className="text-xl font-bold text-white">Pedidos similares detectados</h2>
            </div>
            <button
              onClick={consolidarPedidosAutomaticamente}
              className="px-4 py-2 bg-green-900/30 border border-green-700/30 rounded-lg text-green-400 hover:bg-green-900/40 transition-colors flex items-center gap-2"
            >
              <Check className="w-4 h-4" />
              Consolidar Todos
            </button>
          </div>
          
          <div className="space-y-3">
            {consolidacionesSugeridas.map((sugerencia, index) => (
              <div key={sugerencia.clave} className="bg-black/30 border border-gray-800 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-green-900/20 border border-green-700/30 flex items-center justify-center">
                      <span className="text-sm font-bold text-green-400">{sugerencia.pedidos.length}</span>
                    </div>
                    <div>
                      <div className="text-white font-medium">{sugerencia.pedidos[0].cliente}</div>
                      <div className="text-xs text-gray-400">
                        {sugerencia.pedidos[0].tipoAve} â€¢ {sugerencia.pedidos[0].presentacion} â€¢ {sugerencia.pedidos[0].contenedor}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-400">Total si se consolida</div>
                    <div className="text-green-400 font-bold text-xl">{sugerencia.totalCantidad} aves</div>
                  </div>
                </div>
                
                <div className="mt-3 pt-3 border-t border-gray-800">
                  <div className="text-xs text-gray-400 mb-1">Pedidos individuales:</div>
                  <div className="flex flex-wrap gap-2">
                    {sugerencia.pedidos.map(pedido => (
                      <div key={pedido.id} className="px-2 py-1 bg-black border border-gray-800 rounded text-xs">
                        <span className="text-blue-400">{pedido.numeroPedido}</span>
                        <span className="text-gray-400 mx-1">â€¢</span>
                        <span className="text-white">{pedido.cantidad} aves</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-4 pt-4 border-t border-gray-800 text-sm text-gray-400">
            <AlertCircle className="w-4 h-4 inline mr-2" />
            Los pedidos similares se consolidan automáticamente sumando sus cantidades en un solo pedido.
          </div>
        </div>
      )}

      {/* Grupos de Clientes */}
      {/*{vistaGrupos && pedidosAgrupados.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-400" />
            Agrupado por Cliente ({pedidosAgrupados.length} clientes)
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {pedidosAgrupados.map(grupo => (
              <div
                key={grupo.numeroCliente}
                className="bg-black border border-gray-800 rounded-2xl p-5 hover:border-gray-700 transition-all"
              >
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <div className="text-white font-bold text-lg">{grupo.cliente}</div>
                    <div className="text-sm text-blue-400 font-mono">{grupo.numeroCliente}</div>
                  </div>
                  <div className="px-3 py-1 bg-amber-900/20 border border-amber-700/30 rounded-lg">
                    <span className="text-amber-400 text-sm">{grupo.pedidos.length} pedidos</span>
                  </div>
                </div>

                <div className="space-y-3 mb-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Total aves:</span>
                    <span className="text-white font-bold">{grupo.totalAves}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Pendientes:</span>
                    <span className="text-amber-400 font-bold">{grupo.pedidosPendientes}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">En producción:</span>
                    <span className="text-blue-400 font-bold">
                      {grupo.pedidos.filter(p => p.estado === 'En Producción').length}
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 pt-4 border-t border-gray-800">
                  {grupo.pedidosPendientes > 0 && (
                    <>
                      <button
                        onClick={() => abrirEdicionCliente(grupo, 'EDITAR')}
                        className="flex-1 px-3 py-2 bg-blue-900/20 border border-blue-700/30 rounded-lg hover:bg-blue-900/30 transition-colors flex items-center justify-center gap-1"
                      >
                        <Edit2 className="w-4 h-4 text-blue-400" />
                        <span className="text-xs text-white">Editar Todos</span>
                      </button>
                      <button
                        onClick={() => abrirModalNuevoPedido(grupo)}
                        className="flex-1 px-3 py-2 bg-green-900/20 border border-green-700/30 rounded-lg hover:bg-green-900/30 transition-colors flex items-center justify-center gap-1"
                      >
                        <Plus className="w-4 h-4 text-green-400" />
                        <span className="text-xs text-white">Nuevo Pedido</span>
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => abrirEdicionCliente(grupo, 'CANCELAR')}
                    className="flex-1 px-3 py-2 bg-red-900/20 border border-red-700/30 rounded-lg hover:bg-red-900/30 transition-colors flex items-center justify-center gap-1"
                  >
                    <X className="w-4 h-4 text-red-400" />
                    <span className="text-xs text-white">Cancelar</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}*/}

      {/* ========== SECCIONES ANTES DE PESAJE ========== */}
      {[
        { titulo: 'Pedidos Pendientes', datos: pedidosPendientes, color: '#f59e0b', borderColor: 'border-amber-500/40', bgGlow: 'rgba(245,158,11,0.05)', iconColor: 'text-amber-400', emptyMsg: 'No hay pedidos pendientes', dotColor: 'bg-amber-500' },
        { titulo: 'Pedidos en Producción', datos: pedidosEnProduccion, color: '#3b82f6', borderColor: 'border-blue-500/40', bgGlow: 'rgba(59,130,246,0.05)', iconColor: 'text-blue-400', emptyMsg: 'No hay pedidos en producción', dotColor: 'bg-blue-500' },
      ].map((seccion) => (
        <div key={seccion.titulo} className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-white flex items-center gap-3 group cursor-default">
              <div className="p-2.5 rounded-xl transition-all duration-300 group-hover:scale-110" style={{ background: `${seccion.bgGlow}`, border: `1px solid ${seccion.color}33`, boxShadow: `0 0 20px ${seccion.color}15` }}>
                <Package className={`w-5 h-5 ${seccion.iconColor}`} />
              </div>
              <span className="tracking-tight">{seccion.titulo}</span>
            </h2>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full" style={{ background: `${seccion.color}15`, border: `1px solid ${seccion.color}30` }}>
              <div className={`w-2 h-2 rounded-full ${seccion.dotColor} animate-pulse`}></div>
              <span className="text-sm font-bold" style={{ color: seccion.color }}>{seccion.datos.length}</span>
            </div>
          </div>
          
          <div className={`bg-black/80 backdrop-blur-sm border ${seccion.borderColor} rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-lg`} style={{ boxShadow: `0 0 30px ${seccion.color}08` }}>
            {seccion.datos.length === 0 ? (
              <div className="px-6 py-12 text-center">
                <div className="text-gray-600 text-lg mb-1">∅</div>
                <div className="text-gray-500 text-sm">{seccion.emptyMsg}</div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr style={{ background: `linear-gradient(to right, ${seccion.color}08, transparent)`, borderBottom: `1px solid ${seccion.color}20` }}>
                      {editandoMultiple && (
                        <th className="px-6 py-4 text-left w-12">
                          <div className="text-xs font-semibold text-white uppercase">#</div>
                        </th>
                      )}
                      <th className="px-6 py-4 text-left"><div className="text-xs font-semibold text-white uppercase">Orden</div></th>
                      <th className="px-6 py-4 text-left"><div className="text-xs font-semibold text-white uppercase">Pedido</div></th>
                      <th className="px-6 py-4 text-left"><div className="text-xs font-semibold text-white uppercase">Cliente</div></th>
                      <th className="px-6 py-4 text-left"><div className="text-xs font-semibold text-white uppercase">Producto</div></th>
                      <th className="px-6 py-4 text-left"><div className="text-xs font-semibold text-white uppercase">Cantidad</div></th>
                      <th className="px-6 py-4 text-center"><div className="text-[10px] font-bold text-blue-400 uppercase tracking-wider">Machos</div></th>
                      <th className="px-6 py-4 text-center"><div className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">Hembras</div></th>
                      <th className="px-6 py-4 text-left"><div className="text-xs font-semibold text-white uppercase">Contenedor</div></th>
                      <th className="px-6 py-4 text-left"><div className="text-xs font-semibold text-white uppercase">Estado</div></th>
                      <th className="px-6 py-4 text-left"><div className="text-xs font-semibold text-white uppercase">Acciones</div></th>
                    </tr>
                  </thead>
                  <tbody>
                    {seccion.datos.map((pedido) => (
                      <tr 
                        key={pedido.id}
                        className={`border-b border-gray-800/50 hover:bg-white/[0.02] transition-colors duration-200 ${
                          pedido.estado === 'Cancelado' ? 'opacity-60' : ''
                        } ${pedido.esSubPedido && vistaGrupos ? 'bg-green-900/10' : ''}`}
                      >
                        {editandoMultiple && (
                          <td className="px-6 py-4">
                            <div className="flex items-center">
                              <input type="checkbox" checked={pedidosAEditar.some(p => p.id === pedido.id)} onChange={(e) => { if (e.target.checked) { setPedidosAEditar(prev => [...prev, pedido]); } else { setPedidosAEditar(prev => prev.filter(p => p.id !== pedido.id)); } }} className="w-4 h-4 rounded border-gray-700 bg-gray-800" />
                            </div>
                          </td>
                        )}
                        <td className="px-6 py-4">
                          <div className={`w-10 h-10 rounded-xl ${pedido.prioridadBase <= 3 ? 'bg-gradient-to-br from-red-900/20 to-red-800/20 border border-red-700/30 text-red-300' : pedido.prioridadBase <= 6 ? 'bg-gradient-to-br from-yellow-900/20 to-yellow-800/20 border border-yellow-700/30 text-yellow-300' : 'bg-gradient-to-br from-green-900/20 to-green-800/20 border border-green-700/30 text-green-300'} flex items-center justify-center font-bold`}>
                            {pedido.ordenProduccion}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="space-y-1">
                            <div className="font-mono font-bold text-white">{pedido.numeroPedido}</div>
                            <div className="text-xs text-gray-500">{pedido.fecha} {pedido.hora}</div>
                            {pedido.esSubPedido && vistaGrupos && (<div className="text-xs text-green-400 flex items-center gap-1"><Merge className="w-3 h-3" />Consolidado</div>)}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-white font-medium">{pedido.cliente}</div>
                          <div className="text-xs text-gray-500">Cliente {pedido.numeroCliente}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="space-y-1.5">
                            <div className="text-emerald-300 font-bold uppercase tracking-tight">{pedido.tipoAve.replace(/\(.*?\)/g, '').replace(/-.*$/, '').trim()}</div>
                            {pedido.variedad ? (
                              <div className={`px-3 py-1.5 rounded-lg text-sm font-black uppercase inline-block shadow-lg tracking-wider ${pedido.cantidadMachos === undefined && pedido.cantidadHembras === undefined ? 'text-white border-2' : 'bg-amber-900/40 text-amber-300 border border-amber-500/30'}`}>{pedido.variedad}</div>
                            ) : (<div className="text-[10px] text-gray-600 italic">Estándar</div>)}
                            <div className={`text-xs font-semibold ${pedido.presentacion?.toLowerCase().includes('vivo') ? 'text-white' : 'text-gray-500'}`}>{pedido.presentacion}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {editandoMultiple && pedidosAEditar.some(p => p.id === pedido.id) ? (
                            <input type="number" value={formEdicion?.id === pedido.id ? formEdicion.cantidad : pedido.cantidad} onChange={(e) => setFormEdicion(prev => prev ? {...prev, cantidad: parseInt(e.target.value) || 0} : null)} className="w-24 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-center" />
                          ) : (
                            <div>
                              <div className="text-white font-bold text-lg">{pedido.cantidad}</div>
                              {pedido.cantidadJabas && pedido.unidadesPorJaba && (
                                <div className="text-[10px] px-1.5 py-0.5 rounded mt-0.5 inline-block" style={{ background: 'rgba(245,158,11,0.12)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.2)' }}>{pedido.cantidadJabas} jabas × {pedido.unidadesPorJaba} c/u</div>
                              )}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 text-center">
                          {pedido.cantidadMachos !== undefined ? (
                            <div className="inline-flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg bg-blue-900/20 border border-blue-700/30">
                              <span className="text-white font-black text-base tabular-nums">{pedido.cantidadMachos}</span>
                            </div>
                          ) : (
                            <span className="text-white font-mono">—</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-center">
                          {pedido.cantidadHembras !== undefined ? (
                            <div className="inline-flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg bg-amber-900/20 border border-amber-700/30">
                              <span className="text-white font-black text-base tabular-nums">{pedido.cantidadHembras}</span>
                            </div>
                          ) : (
                            <span className="text-white font-mono">—</span>
                          )}
                        </td>
                        <td className="px-6 py-4"><div className="text-sm text-gray-300">{pedido.contenedor}</div></td>
                        <td className="px-6 py-4">
                          <div className={`px-3 py-1.5 rounded-lg text-sm font-medium inline-block ${pedido.estado === 'Pendiente' ? 'bg-amber-900/20 border border-amber-700/30 text-amber-300' : pedido.estado === 'En Producción' ? 'bg-blue-900/20 border border-blue-700/30 text-blue-300' : pedido.estado === 'Entregado' ? 'bg-orange-900/20 border border-orange-700/30 text-orange-300' : pedido.estado === 'Completado' ? 'bg-green-900/20 border border-green-700/30 text-green-300' : pedido.estado === 'Cancelado' ? 'bg-red-900/20 border border-red-700/30 text-red-300' : 'bg-gray-900/20 border border-gray-700/30 text-gray-300'}`}>
                            {pedido.estado}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1.5">
                            {pedido.estado === 'Pendiente' && !editandoMultiple && (<button onClick={() => moverAProduccion(pedido)} className="p-2 bg-amber-900/20 border border-amber-700/30 rounded-lg hover:bg-amber-900/30 transition-colors" title="Enviar a producción"><Truck className="w-4 h-4 text-amber-400" /></button>)}
                            {pedido.estado === 'En Producción' && !editandoMultiple && (<button onClick={() => moverAPesaje(pedido)} className="p-2 bg-purple-900/20 border border-purple-700/30 rounded-lg hover:bg-purple-900/30 transition-colors" title="Mover a pesaje"><Weight className="w-4 h-4 text-purple-400" /></button>)}
                            {!editandoMultiple && (<button onClick={() => setMostrarDetallePedido(pedido)} className="p-2 bg-gray-800/50 border border-gray-700/30 rounded-lg hover:bg-gray-800 transition-colors" title="Ver detalles"><Eye className="w-4 h-4 text-gray-400" /></button>)}
                            {!editandoMultiple && (<button onClick={() => eliminarPedido(pedido.id)} className="p-2 bg-gray-800/50 border border-gray-700/30 rounded-lg hover:bg-gray-800 transition-colors" title="Eliminar pedido"><Trash2 className="w-4 h-4 text-gray-400" /></button>)}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      ))}

      {/* ========== 3. PEDIDOS EN PESAJE ========== */}
      <div className="mb-10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-white flex items-center gap-3 group cursor-default">
            <div className="p-2.5 rounded-xl transition-all duration-300 group-hover:scale-110" style={{ background: 'rgba(168,85,247,0.05)', border: '1px solid rgba(168,85,247,0.2)', boxShadow: '0 0 20px rgba(168,85,247,0.1)' }}>
              <Weight className="w-5 h-5 text-purple-400" />
            </div>
            <span className="tracking-tight"> Pedidos en Pesaje</span>
          </h2>
          <div className="flex items-center gap-3">
            <div className="text-sm text-gray-400">{pedidosPesaje.reduce((acc, p) => acc + p.cantidad, 0)} aves totales</div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full" style={{ background: 'rgba(168,85,247,0.1)', border: '1px solid rgba(168,85,247,0.25)' }}>
              <div className="w-2 h-2 rounded-full bg-purple-500 animate-pulse"></div>
              <span className="text-sm font-bold text-purple-400">{pedidosPesaje.length}</span>
            </div>
          </div>
        </div>

        <div className="bg-black/80 backdrop-blur-sm border border-purple-500/40 rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-lg" style={{ boxShadow: '0 0 30px rgba(168,85,247,0.06)' }}>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-black border-b border-purple-800/30">
                  <th className="px-6 py-4 text-left">
                    <div className="text-xs font-semibold text-white uppercase">N° Pedido</div>
                  </th>
                  <th className="px-6 py-4 text-left">
                    <div className="text-xs font-semibold text-white uppercase">Cliente</div>
                  </th>
                  <th className="px-6 py-4 text-left">
                    <div className="text-xs font-semibold text-white uppercase">Producto</div>
                  </th>
                  <th className="px-6 py-4 text-left">
                    <div className="text-xs font-semibold text-white uppercase">Cantidad</div>
                  </th>
                  <th className="px-6 py-4 text-left">
                    <div className="text-xs font-semibold text-white uppercase">Presentación</div>
                  </th>
                  <th className="px-6 py-4 text-center">
                    <div className="text-[10px] font-bold text-blue-400 uppercase tracking-wider">Machos</div>
                  </th>
                  <th className="px-6 py-4 text-center">
                    <div className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">Hembras</div>
                  </th>
                  <th className="px-6 py-4 text-left">
                    <div className="text-xs font-semibold text-white uppercase">Contenedores</div>
                  </th>
                  <th className="px-6 py-4 text-left">
                    <div className="text-xs font-semibold text-white uppercase">Peso Bruto</div>
                  </th>
                  <th className="px-6 py-4 text-left">
                    <div className="text-xs font-semibold text-white uppercase">Conductor</div>
                  </th>
                  <th className="px-6 py-4 text-left">
                    <div className="text-xs font-semibold text-white uppercase">Estado</div>
                  </th>
                  <th className="px-6 py-4 text-left">
                    <div className="text-xs font-semibold text-white uppercase">Acciones</div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {pedidosPesaje.length === 0 ? (
                  <tr>
                    <td colSpan={12} className="px-6 py-12 text-center">
                      <div className="text-white-500">
                        No hay pedidos en proceso de pesaje
                      </div>
                    </td>
                  </tr>
                ) : (
                  pedidosPesaje.map((pedido) => (
                    <tr 
                      key={pedido.id}
                      className="border-b border-purple-800/20 hover:bg-purple-900/10"
                    >
                      <td className="px-6 py-4">
                        <div className="font-mono font-bold text-white">{pedido.numeroPedido}</div>
                      </td>
                      
                      <td className="px-6 py-4">
                        <div className="text-white font-medium">{pedido.cliente}</div>
                      </td>
                      
                      <td className="px-6 py-4">
                        <div className="text-emerald-300 font-medium">{pedido.producto}</div>
                      </td>
                      
                      <td className="px-6 py-4">
                        <div className="text-white font-bold">{pedido.cantidad}</div>
                        <div className="text-xs text-white-500">aves</div>
                      </td>
                      
                      <td className="px-6 py-4">
                        <div className="text-white">{pedido.presentacion}</div>
                      </td>
                      
                      <td className="px-6 py-4 text-center">
                        {pedido.cantidadMachos !== undefined ? (
                          <div className="inline-flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg bg-blue-900/20 border border-blue-700/30">
                            <span className="text-blue-300 font-black text-base tabular-nums">{pedido.cantidadMachos}</span>
                          </div>
                        ) : (
                          <span className="text-white-600 font-mono">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        {pedido.cantidadHembras !== undefined ? (
                          <div className="inline-flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg bg-amber-900/20 border border-amber-700/30">
                            <span className="text-amber-300 font-black text-base tabular-nums">{pedido.cantidadHembras}</span>
                          </div>
                        ) : (
                          <span className="text-white-600 font-mono">—</span>
                        )}
                      </td>
                      
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <div className="text-white font-medium">{pedido.contenedor}</div>
                          {pedido.numeroContenedores ? (
                            <div className="text-xs text-white-400">
                              {pedido.numeroContenedores} cont. · {(pedido.pesoContenedores || 0).toFixed(1)} kg
                            </div>
                          ) : (
                            <div className="text-xs text-white-600">Pendiente de pesaje</div>
                          )}
                        </div>
                      </td>
                      
                      <td className="px-6 py-4">
                        {pedido.pesoBruto ? (
                          <div className="text-white font-bold">{pedido.pesoBruto.toFixed(1)} kg</div>
                        ) : (
                          <span className="text-white-600">—</span>
                        )}
                      </td>
                      
                      <td className="px-6 py-4">
                        {pedido.conductor ? (
                          <button
                            onClick={() => setConductorSeleccionado(pedido.conductor!)}
                            className="text-left hover:bg-gray-800/30 p-2 rounded-lg transition-colors w-full"
                          >
                            <div className="text-white font-medium truncate">{pedido.conductor.nombre}</div>
                            <div className="text-xs text-white-400">{pedido.conductor.vehiculo}</div>
                            <div className="text-xs text-blue-400">{pedido.conductor.zonaAsignada}</div>
                          </button>
                        ) : (
                          <span className="text-white-600 text-xs">Sin asignar</span>
                        )}
                      </td>
                      
                      <td className="px-6 py-4">
                        <div className={`px-3 py-1.5 rounded-lg text-sm font-medium inline-block ${
                          pedido.estadoPesaje === 'Pendiente'
                            ? 'bg-amber-900/20 border border-amber-700/30 text-amber-300'
                            : pedido.estadoPesaje === 'Completado'
                            ? 'bg-green-900/20 border border-green-700/30 text-green-300'
                            : 'bg-blue-900/20 border border-blue-700/30 text-blue-300'
                        }`}>
                          {pedido.estadoPesaje}
                        </div>
                      </td>
                      
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {/* BotÃ³n para cambiar conductor */}
                          <button
                            onClick={() => pedido.conductor && setConductorSeleccionado(pedido.conductor)}
                            className="p-2 bg-blue-900/20 border border-blue-700/30 rounded-lg hover:bg-blue-900/30 transition-colors"
                            title="Ver/editar conductor"
                          >
                            <UserIcon className="w-4 h-4 text-blue-400" />
                          </button>
                          
                          {/* BotÃ³n para completar pesaje */}
                          {pedido.estadoPesaje === 'Pendiente' && (
                            <button
                              onClick={() => completarPesaje(pedido.id)}
                              className="p-2 bg-green-900/20 border border-green-700/30 rounded-lg hover:bg-green-900/30 transition-colors"
                              title="Completar pesaje"
                            >
                              <CheckCircle className="w-4 h-4 text-green-400" />
                            </button>
                          )}
                          
                          {/* BotÃ³n para regresar a producciÃ³n */}
                          <button
                            onClick={() => eliminarDePesaje(pedido.id)}
                            className="p-2 bg-amber-900/20 border border-amber-700/30 rounded-lg hover:bg-amber-900/30 transition-colors"
                            title="Regresar a producciÃ³n"
                          >
                            <RotateCcw className="w-4 h-4 text-amber-400" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ========== 4 & 5. SECCIONES DESPUÉS DE PESAJE ========== */}
      {[
        { titulo: 'Pedidos en Entrega', datos: pedidosEnEntrega, color: '#f97316', borderColor: 'border-orange-500/40', bgGlow: 'rgba(249,115,22,0.05)', iconColor: 'text-orange-400', emptyMsg: 'No hay pedidos en entrega', dotColor: 'bg-orange-500' },
        { titulo: 'Pedidos Entregados', datos: pedidosEntregados, color: '#22c55e', borderColor: 'border-green-500/40', bgGlow: 'rgba(34,197,94,0.05)', iconColor: 'text-green-400', emptyMsg: 'No hay pedidos entregados', dotColor: 'bg-green-500' },
      ].map((seccion) => (
        <div key={seccion.titulo} className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-white flex items-center gap-3 group cursor-default">
              <div className="p-2.5 rounded-xl transition-all duration-300 group-hover:scale-110" style={{ background: `${seccion.bgGlow}`, border: `1px solid ${seccion.color}33`, boxShadow: `0 0 20px ${seccion.color}15` }}>
                <Package className={`w-5 h-5 ${seccion.iconColor}`} />
              </div>
              <span className="tracking-tight">{seccion.titulo}</span>
            </h2>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full" style={{ background: `${seccion.color}15`, border: `1px solid ${seccion.color}30` }}>
              <div className={`w-2 h-2 rounded-full ${seccion.dotColor} animate-pulse`}></div>
              <span className="text-sm font-bold" style={{ color: seccion.color }}>{seccion.datos.length}</span>
            </div>
          </div>
          
          <div className={`bg-black/80 backdrop-blur-sm border ${seccion.borderColor} rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-lg`} style={{ boxShadow: `0 0 30px ${seccion.color}08` }}>
            {seccion.datos.length === 0 ? (
              <div className="px-6 py-12 text-center">
                <div className="text-gray-600 text-lg mb-1">∅</div>
                <div className="text-gray-500 text-sm">{seccion.emptyMsg}</div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr style={{ background: `linear-gradient(to right, ${seccion.color}08, transparent)`, borderBottom: `1px solid ${seccion.color}20` }}>
                      <th className="px-6 py-4 text-left"><div className="text-xs font-semibold text-white uppercase">Orden</div></th>
                      <th className="px-6 py-4 text-left"><div className="text-xs font-semibold text-white uppercase">Pedido</div></th>
                      <th className="px-6 py-4 text-left"><div className="text-xs font-semibold text-white uppercase">Cliente</div></th>
                      <th className="px-6 py-4 text-left"><div className="text-xs font-semibold text-white uppercase">Producto</div></th>
                      <th className="px-6 py-4 text-left"><div className="text-xs font-semibold text-white uppercase">Cantidad</div></th>
                      <th className="px-6 py-4 text-center"><div className="text-[10px] font-bold text-blue-400 uppercase tracking-wider">Machos</div></th>
                      <th className="px-6 py-4 text-center"><div className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">Hembras</div></th>
                      <th className="px-6 py-4 text-left"><div className="text-xs font-semibold text-white uppercase">Contenedor</div></th>
                      <th className="px-6 py-4 text-left"><div className="text-xs font-semibold text-white uppercase">Estado</div></th>
                      <th className="px-6 py-4 text-left"><div className="text-xs font-semibold text-white uppercase">Acciones</div></th>
                    </tr>
                  </thead>
                  <tbody>
                    {seccion.datos.map((pedido: PedidoLista) => (
                      <tr key={pedido.id} className="border-b border-gray-800/50 hover:bg-white/[0.02] transition-colors duration-200">
                        <td className="px-6 py-4">
                          <div className={`w-10 h-10 rounded-xl ${pedido.prioridadBase <= 3 ? 'bg-gradient-to-br from-red-900/20 to-red-800/20 border border-red-700/30 text-red-300' : pedido.prioridadBase <= 6 ? 'bg-gradient-to-br from-yellow-900/20 to-yellow-800/20 border border-yellow-700/30 text-yellow-300' : 'bg-gradient-to-br from-green-900/20 to-green-800/20 border border-green-700/30 text-green-300'} flex items-center justify-center font-bold`}>
                            {pedido.ordenProduccion}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-mono font-bold text-white">{pedido.numeroPedido}</div>
                          <div className="text-xs text-gray-500">{pedido.fecha} {pedido.hora}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-white font-medium">{pedido.cliente}</div>
                          <div className="text-xs text-gray-500">Cliente {pedido.numeroCliente}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-emerald-300 font-bold uppercase tracking-tight">{pedido.tipoAve.replace(/\(.*?\)/g, '').replace(/-.*$/, '').trim()}</div>
                          <div className={`text-xs font-semibold ${pedido.presentacion?.toLowerCase().includes('vivo') ? 'text-white' : 'text-gray-500'}`}>{pedido.presentacion}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-white font-bold text-lg">{pedido.cantidad}</div>
                          {pedido.cantidadJabas && pedido.unidadesPorJaba && (
                            <div className="text-[10px] px-1.5 py-0.5 rounded mt-0.5 inline-block" style={{ background: 'rgba(245,158,11,0.12)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.2)' }}>{pedido.cantidadJabas} jabas × {pedido.unidadesPorJaba} c/u</div>
                          )}
                        </td>
                        <td className="px-6 py-4 text-center">
                          {pedido.cantidadMachos !== undefined ? (
                            <div className="inline-flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg bg-blue-900/20 border border-blue-700/30">
                              <span className="text-white font-black text-base tabular-nums">{pedido.cantidadMachos}</span>
                            </div>
                          ) : (
                            <span className="text-white font-mono">—</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-center">
                          {pedido.cantidadHembras !== undefined ? (
                            <div className="inline-flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg bg-amber-900/20 border border-amber-700/30">
                              <span className="text-white font-black text-base tabular-nums">{pedido.cantidadHembras}</span>
                            </div>
                          ) : (
                            <span className="text-white font-mono">—</span>
                          )}
                        </td>
                        <td className="px-6 py-4"><div className="text-sm text-gray-300">{pedido.contenedor}</div></td>
                        <td className="px-6 py-4">
                          <div className={`px-3 py-1.5 rounded-lg text-sm font-medium inline-block ${pedido.estado === 'Entregado' ? 'bg-orange-900/20 border border-orange-700/30 text-orange-300' : 'bg-green-900/20 border border-green-700/30 text-green-300'}`}>
                            {pedido.estado}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1.5">
                            <button onClick={() => setMostrarDetallePedido(pedido)} className="p-2 bg-gray-800/50 border border-gray-700/30 rounded-lg hover:bg-gray-800 transition-colors" title="Ver detalles"><Eye className="w-4 h-4 text-gray-400" /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      ))}

      {/* Barra de ediciÃ³n mÃºltiple */}
      {editandoMultiple && (
        <div className="fixed bottom-0 left-0 right-0 bg-black/90 border-t border-gray-800 p-4">
          <div className="container mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Edit2 className="w-5 h-5 text-blue-400" />
              <div>
                <div className="text-white font-medium">Editando {pedidosAEditar.length} pedidos</div>
                <div className="text-xs text-gray-400">
                  Cambie las cantidades en la tabla y guarde los cambios
                </div>
              </div>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={guardarEdicionMultiple}
                className="px-4 py-2 bg-blue-900/30 border border-blue-700/30 rounded-lg text-white hover:bg-blue-900/40 transition-colors flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                Guardar Cambios
              </button>
              <button
                onClick={() => {
                  setEditandoMultiple(false);
                  setPedidosAEditar([]);
                  setCantidadesEditadas({});
                }}
                className="px-4 py-2 bg-gray-800/50 border border-gray-700/30 rounded-lg text-gray-300 hover:bg-gray-800/70 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de EdiciÃ³n MÃºltiple */}
      {modoEdicion && clienteSeleccionado && modoEdicion !== 'NUEVO_SUB' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{
          background: 'rgba(0, 0, 0, 0.85)'
        }}>
          <div className="bg-black border border-gray-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
            <div className="p-6 border-b border-gray-800">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-white">
                    {modoEdicion === 'EDITAR' && `Editar Pedidos - ${clienteSeleccionado.cliente}`}
                    {modoEdicion === 'CANCELAR' && `Cancelar Pedidos - ${clienteSeleccionado.cliente}`}
                    {modoEdicion === 'AUMENTAR' && `Aumentar Pedidos - ${clienteSeleccionado.cliente}`}
                    {modoEdicion === 'CONSOLIDAR' && `Consolidar Pedidos - ${clienteSeleccionado.cliente}`}
                  </h3>
                  <p className="text-sm text-gray-400 mt-1">
                    Cliente: {clienteSeleccionado.numeroCliente} â€¢ {pedidosSeleccionados.length} pedidos seleccionados
                  </p>
                </div>
                <button
                  onClick={() => {
                    setModoEdicion(null);
                    setClienteSeleccionado(null);
                  }}
                  className="p-2 rounded-lg hover:bg-gray-800 transition-colors"
                >
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>
            </div>

            <div className="p-6 overflow-y-auto max-h-[60vh]">
              {modoEdicion === 'CANCELAR' && (
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Motivo de CancelaciÃ³n
                  </label>
                  <textarea
                    value={motivoCancelacion}
                    onChange={(e) => setMotivoCancelacion(e.target.value)}
                    placeholder="Ingrese el motivo para cancelar estos pedidos..."
                    rows={3}
                    className="w-full px-4 py-3 bg-black/30 border border-gray-800 rounded-lg text-white focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500/20"
                  />
                </div>
              )}

              {modoEdicion === 'CONSOLIDAR' && (
                <div className="mb-6 bg-blue-900/10 border border-blue-700/30 rounded-xl p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <Merge className="w-5 h-5 text-blue-400" />
                    <h4 className="text-white font-medium">Consolidar Pedidos Similares</h4>
                  </div>
                  <p className="text-sm text-gray-400 mb-3">
                    Los pedidos similares se sumarÃ¡n en un solo pedido. Esto reduce duplicados.
                  </p>
                  <button
                    onClick={consolidarPedidosSeleccionados}
                    className="w-full px-4 py-3 bg-blue-900/30 border border-blue-700/30 rounded-lg text-white font-semibold hover:bg-blue-900/40 transition-colors"
                  >
                    Consolidar {pedidosSeleccionados.length} Pedidos
                  </button>
                </div>
              )}

              <div className="space-y-4">
                {pedidosSeleccionados.map(pedido => (
                  <div
                    key={pedido.id}
                    className="bg-black/30 border border-gray-800 rounded-xl p-4"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="space-y-1">
                        <div className="font-mono font-bold text-white">{pedido.numeroPedido}</div>
                        <div className="text-xs text-gray-500">
                          {pedido.tipoAve} â€¢ {pedido.presentacion} â€¢ {pedido.contenedor}
                        </div>
                      </div>
                      <div className="text-sm text-gray-400">
                        Estado: <span className={`${
                          pedido.estado === 'Pendiente' ? 'text-amber-400' :
                          pedido.estado === 'En Producción' ? 'text-blue-400' :
                          pedido.estado === 'Completado' ? 'text-green-400' : 'text-red-400'
                        }`}>
                          {pedido.estado}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm text-gray-400">Cantidad actual</div>
                        <div className="text-white font-bold">{pedido.cantidad} aves</div>
                        {pedido.cantidadJabas && pedido.unidadesPorJaba && (
                          <div className="text-[10px] mt-0.5" style={{ color: '#f59e0b' }}>
                            ({pedido.cantidadJabas} jabas Ã— {pedido.unidadesPorJaba} c/u)
                          </div>
                        )}
                      </div>
                      
                      {(modoEdicion === 'EDITAR' || modoEdicion === 'AUMENTAR') && (
                        <div className="flex items-center gap-2">
                          <div className="text-sm text-gray-400">Nueva cantidad:</div>
                          <input
                            type="number"
                            value={cantidadesEditadas[pedido.id] || pedido.cantidad}
                            onChange={(e) => setCantidadesEditadas(prev => ({
                              ...prev,
                              [pedido.id]: e.target.value
                            }))}
                            min={modoEdicion === 'AUMENTAR' ? pedido.cantidad + 1 : 1}
                            className="w-24 px-3 py-1.5 bg-black border border-gray-800 rounded-lg text-white text-center"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 pt-6 border-t border-gray-800">
                <div className="flex gap-3">
                  <button
                    onClick={aplicarCambiosMultiples}
                    className={`flex-1 px-4 py-3 rounded-lg font-semibold transition-all hover:scale-[1.02] ${
                      modoEdicion === 'CANCELAR'
                        ? 'bg-gradient-to-r from-red-900/30 to-red-800/30 border border-red-700/30 hover:from-red-900/40 hover:to-red-800/40 text-white'
                        : modoEdicion === 'AUMENTAR'
                        ? 'bg-gradient-to-r from-green-900/30 to-green-800/30 border border-green-700/30 hover:from-green-900/40 hover:to-green-800/40 text-white'
                        : 'bg-gradient-to-r from-blue-900/30 to-blue-800/30 border border-blue-700/30 hover:from-blue-900/40 hover:to-blue-800/40 text-white'
                    }`}
                  >
                    {modoEdicion === 'CANCELAR' ? 'Confirmar Cancelación' :
                     modoEdicion === 'AUMENTAR' ? 'Aplicar Aumentos' :
                     modoEdicion === 'CONSOLIDAR' ? 'Consolidar Pedidos' : 'Aplicar Cambios'}
                  </button>
                  <button
                    onClick={() => {
                      setModoEdicion(null);
                      setClienteSeleccionado(null);
                    }}
                    className="px-4 py-3 bg-black/30 border border-gray-800 rounded-lg text-white font-semibold hover:bg-black/50 transition-colors"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL PARA NUEVO SUB-PEDIDO */}
      {modoEdicion === 'NUEVO_SUB' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{
          background: 'rgba(0, 0, 0, 0.85)'
        }}>
          <div className="bg-black border border-gray-800 rounded-2xl w-full max-w-md">
            <div className="p-6 border-b border-gray-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Plus className="w-6 h-6 text-green-400" />
                  <div>
                    <h3 className="text-xl font-bold text-white">Nuevo Pedido</h3>
                    <p className="text-sm text-gray-400">Cliente: {nuevoSubPedido.cliente}</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setModoEdicion(null);
                    setNuevoSubPedido({
                      cliente: '',
                      tipoAve: '',
                      presentacion: '',
                      cantidad: 0,
                      contenedor: '',
                      fecha: new Date().toISOString().split('T')[0],
                      hora: new Date().toTimeString().slice(0, 5),
                      prioridad: 1,
                      estado: 'Pendiente'
                    });
                  }}
                  className="p-2 rounded-lg hover:bg-gray-800 transition-colors"
                >
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Cantidad</label>
                <input
                  type="number"
                  value={nuevoSubPedido.cantidad || ''}
                  onChange={(e) => setNuevoSubPedido(prev => ({ ...prev, cantidad: parseInt(e.target.value) || 0 }))}
                  min="1"
                  className="w-full px-4 py-2 bg-black/30 border border-gray-800 rounded-lg text-white"
                />
              </div>

              <div className="pt-4">
                <button
                  onClick={crearNuevoSubPedido}
                  className="w-full px-4 py-3 bg-green-900/30 border border-green-700/30 rounded-lg text-white font-semibold hover:bg-green-900/40 transition-colors"
                >
                  Crear Nuevo Pedido
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL PARA EDITAR PEDIDO INDIVIDUAL */}
      {pedidoAEditar && formEdicion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{
          background: 'rgba(0, 0, 0, 0.85)'
        }}>
          <div className="bg-black border border-gray-800 rounded-2xl w-full max-w-md">
            <div className="p-6 border-b border-gray-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Wrench className="w-6 h-6 text-blue-400" />
                  <div>
                    <h3 className="text-xl font-bold text-white">Editar Pedido</h3>
                    <p className="text-sm text-gray-400">{pedidoAEditar.numeroPedido}</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setPedidoAEditar(null);
                    setFormEdicion(null);
                  }}
                  className="p-2 rounded-lg hover:bg-gray-800 transition-colors"
                >
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Cantidad</label>
                <input
                  type="number"
                  value={formEdicion.cantidad}
                  onChange={(e) => setFormEdicion(prev => prev ? { ...prev, cantidad: parseInt(e.target.value) || 0 } : null)}
                  min="1"
                  className="w-full px-4 py-2 bg-black/30 border border-gray-800 rounded-lg text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Presentación</label>
                <select
                  value={formEdicion.presentacion}
                  onChange={(e) => setFormEdicion(prev => prev ? { ...prev, presentacion: e.target.value } : null)}
                  className="w-full px-4 py-2 bg-black/30 border border-gray-800 rounded-lg text-white"
                >
                  <option value="">Seleccionar...</option>
                  {presentaciones?.map(pres => (
                    <option key={pres.id} value={pres.nombre}>{pres.nombre}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Contenedor</label>
                <select
                  value={formEdicion.contenedor}
                  onChange={(e) => setFormEdicion(prev => prev ? { ...prev, contenedor: e.target.value } : null)}
                  className="w-full px-4 py-2 bg-black/30 border border-gray-800 rounded-lg text-white"
                >
                  <option value="">Seleccionar...</option>
                  {contenedores?.map(cont => (
                    <option key={cont.id} value={cont.tipo}>{cont.tipo}</option>
                  ))}
                </select>
              </div>

              <div className="pt-4">
                <button
                  onClick={guardarEdicionPedido}
                  className="w-full px-4 py-3 bg-blue-900/30 border border-blue-700/30 rounded-lg text-white font-semibold hover:bg-blue-900/40 transition-colors"
                >
                  Guardar Cambios
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL PARA INFORMACIÃ“N DEL CONDUCTOR */}
      {conductorSeleccionado && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{
          background: 'rgba(0, 0, 0, 0.85)'
        }}>
          <div className="bg-black border border-gray-800 rounded-2xl w-full max-w-md">
            <div className="p-6 border-b border-gray-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <TruckIcon className="w-6 h-6 text-blue-400" />
                  <div>
                    <h3 className="text-xl font-bold text-white">InformaciÃ³n del Conductor</h3>
                    <p className="text-sm text-gray-400">Datos completos</p>
                  </div>
                </div>
                <button
                  onClick={() => setConductorSeleccionado(null)}
                  className="p-2 rounded-lg hover:bg-gray-800 transition-colors"
                >
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm font-medium text-gray-400 mb-1">Nombre</div>
                  <div className="text-white font-medium">{conductorSeleccionado.nombre}</div>
                </div>
                
                <div>
                  <div className="text-sm font-medium text-gray-400 mb-1">Licencia</div>
                  <div className="text-white font-mono">{conductorSeleccionado.licencia}</div>
                </div>
              </div>

              <div>
                <div className="text-sm font-medium text-gray-400 mb-1">Vehículo</div>
                <div className="text-white font-medium">{conductorSeleccionado.vehiculo}</div>
              </div>

              <div>
                <div className="text-sm font-medium text-gray-400 mb-1">Zona Asignada</div>
                <div className="text-blue-400 font-medium">{conductorSeleccionado.zonaAsignada}</div>
              </div>

              {conductorSeleccionado.telefono && (
                <div>
                  <div className="text-sm font-medium text-gray-400 mb-1">Teléfono</div>
                  <div className="text-white">{conductorSeleccionado.telefono}</div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal de Detalle del Pedido */}
      {mostrarDetallePedido && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{
          background: 'rgba(0, 0, 0, 0.85)'
        }}>
          <div className="bg-black border border-gray-800 rounded-2xl w-full max-w-md overflow-hidden">
            <div className="p-6 border-b border-gray-800">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-white">Detalles del Pedido</h3>
                <button
                  onClick={() => setMostrarDetallePedido(null)}
                  className="p-2 rounded-lg hover:bg-gray-800 transition-colors"
                >
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-xs text-gray-400">Número de Pedido</div>
                  <div className="text-white font-mono font-bold">{mostrarDetallePedido.numeroPedido}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-400">Cliente</div>
                  <div className="text-white font-medium">{mostrarDetallePedido.cliente}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-400">Tipo de Ave</div>
                  <div className="text-emerald-300">{mostrarDetallePedido.tipoAve}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-400">Cantidad</div>
                  <div className="text-white font-bold">{mostrarDetallePedido.cantidad} aves</div>
                </div>
                <div>
                  <div className="text-xs text-gray-400">Presentación</div>
                  <div className="text-white">{mostrarDetallePedido.presentacion}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-400">Contenedor</div>
                  <div className="text-white">{mostrarDetallePedido.contenedor}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-400">Merma Total</div>
                  <div className="text-amber-400">{mostrarDetallePedido.mermaTotal.toFixed(1)} kg</div>
                </div>
                <div>
                  <div className="text-xs text-gray-400">Peso Total</div>
                  <div className="text-green-400">{mostrarDetallePedido.pesoTotalPedido.toFixed(1)} kg</div>
                </div>
                <div className="col-span-2">
                  <div className="text-xs text-gray-400">Estado</div>
                  <div className={`px-3 py-1.5 rounded-lg text-sm font-medium inline-block ${
                    mostrarDetallePedido.estado === 'Pendiente' 
                      ? 'bg-amber-900/20 border border-amber-700/30 text-amber-300' 
                      : mostrarDetallePedido.estado === 'En Producción'
                      ? 'bg-blue-900/20 border border-blue-700/30 text-blue-300'
                      : mostrarDetallePedido.estado === 'Pesaje'
                      ? 'bg-purple-900/20 border border-purple-700/30 text-purple-300'
                      : mostrarDetallePedido.estado === 'Entregado'
                      ? 'bg-emerald-900/20 border border-emerald-700/30 text-emerald-300'
                      : mostrarDetallePedido.estado === 'Completado'
                      ? 'bg-green-900/20 border border-green-700/30 text-green-300'
                      : 'bg-red-900/20 border border-red-700/30 text-red-300'
                  }`}>
                    {mostrarDetallePedido.estado}
                  </div>
                </div>
              </div>
              
              <div className="pt-4 border-t border-gray-800">
                <div className="text-xs text-gray-400">Fecha y Hora</div>
                <div className="text-white">{mostrarDetallePedido.fecha} {mostrarDetallePedido.hora}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Historial de Modificaciones */}
      {mostrarHistorial && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{
          background: 'rgba(0, 0, 0, 0.85)'
        }}>
          <div className="bg-black border border-gray-800 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
            <div className="p-6 border-b border-gray-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <History className="w-6 h-6 text-amber-400" />
                  <h3 className="text-xl font-bold text-white">Historial de Modificaciones</h3>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-400">{modificacionesHistorial.length} registros</span>
                  <button
                    onClick={() => setMostrarHistorial(false)}
                    className="p-2 rounded-lg hover:bg-gray-800 transition-colors"
                  >
                    <X className="w-5 h-5 text-gray-400" />
                  </button>
                </div>
              </div>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[70vh]">
              {modificacionesHistorial.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  No hay registros en el historial
                </div>
              ) : (
                <div className="space-y-3">
                  {modificacionesHistorial.slice().reverse().map(mod => (
                    <div
                      key={mod.id}
                      className="bg-black/30 border border-gray-800 rounded-xl p-4 hover:border-gray-700 transition-all"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <div className={`text-sm font-medium flex items-center gap-2 ${
                            mod.tipo === 'CANCELACION' ? 'text-red-400' :
                            mod.tipo === 'MODIFICACION' ? 'text-blue-400' :
                            mod.tipo === 'AUMENTO' ? 'text-green-400' :
                            mod.tipo === 'CONSOLIDACION' ? 'text-purple-400' : 'text-amber-400'
                          }`}>
                            {mod.tipo === 'CANCELACION' && 'âŒ CancelaciÃ³n'}
                            {mod.tipo === 'MODIFICACION' && 'âœï¸ ModificaciÃ³n'}
                            {mod.tipo === 'AUMENTO' && 'ðŸ“ˆ Aumento'}
                            {mod.tipo === 'CONSOLIDACION' && 'ðŸ”„ ConsolidaciÃ³n'}
                            {mod.tipo === 'EDICION_MULTIPLE' && 'ðŸ“‹ EdiciÃ³n MÃºltiple'}
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            {mod.fecha} {mod.hora}
                          </div>
                        </div>
                        <div className="text-right">
                          {(mod.tipo === 'MODIFICACION' || mod.tipo === 'AUMENTO' || mod.tipo === 'CONSOLIDACION') && (
                            <>
                              <div className="text-sm text-gray-400">Cantidad</div>
                              <div className="text-white font-bold">
                                {mod.cantidadAnterior} â†’ {mod.cantidadNueva}
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                      
                      {mod.motivo && (
                        <div className="mt-2 pt-2 border-t border-gray-800/50">
                          <div className="text-xs text-gray-400">Motivo:</div>
                          <div className="text-sm text-gray-300">{mod.motivo}</div>
                        </div>
                      )}
                      
                      {mod.detalles && (
                        <div className="mt-2">
                          <div className="text-xs text-gray-400">Detalles:</div>
                          <div className="text-sm text-gray-300">{mod.detalles}</div>
                        </div>
                      )}
                      
                      {mod.pedidosAfectados && mod.pedidosAfectados.length > 0 && (
                        <div className="mt-2">
                          <div className="text-xs text-gray-400">Pedidos afectados:</div>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {mod.pedidosAfectados.map(numero => (
                              <span key={numero} className="px-2 py-1 bg-black/50 rounded text-xs text-blue-400">
                                {numero}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Footer con estadÃ­sticas */}
      <div className="mt-8 bg-black border border-gray-800 rounded-xl p-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4">
          <div className="text-center p-3">
            <div className="text-sm text-gray-400 mb-1">Pedidos totales</div>
            <div className="text-2xl font-bold text-blue-400">{totalPedidos}</div>
          </div>
          <div className="text-center p-3">
            <div className="text-sm text-gray-400 mb-1">Total aves</div>
            <div className="text-2xl font-bold text-green-400">{cantidadTotal}</div>
          </div>
          <div className="text-center p-3">
            <div className="text-sm text-gray-400 mb-1">Clientes activos</div>
            <div className="text-2xl font-bold text-amber-400">{clientesUnicos.length}</div>
          </div>
          <div className="text-center p-3">
            <div className="text-sm text-gray-400 mb-1">Modificaciones</div>
            <div className="text-2xl font-bold text-purple-400">{modificacionesHistorial.length}</div>
          </div>
          <div className="text-center p-3">
            <div className="text-sm text-gray-400 mb-1">Pendientes</div>
            <div className="text-2xl font-bold text-amber-400">{pendientes}</div>
          </div>
          <div className="text-center p-3">
            <div className="text-sm text-gray-400 mb-1">En pesaje</div>
            <div className="text-2xl font-bold text-purple-400">{enPesaje}</div>
          </div>
        </div>
        
        <div className="mt-4 pt-4 border-t border-gray-800 text-center">
          <div className="text-xs text-gray-500">
            Sistema inteligente de gestiÃ³n de pedidos â€¢ Los datos se guardan automÃ¡ticamente
          </div>
        </div>
      </div>

      {/* Modal de Nuevo Pedido RÃ¡pido */}
      {mostrarModalNuevoPedido && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-amber-500/30 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            {/* Header del Modal */}
            <div className="sticky top-0 bg-zinc-900 border-b border-amber-500/30 p-4 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Plus className="w-6 h-6 text-green-400" />
                  Nuevo Pedido RÃ¡pido
                </h2>
                <p className="text-sm text-gray-400 mt-1">
                  Cliente: <span className="text-amber-400 font-medium">{nuevoPedidoRapido.cliente}</span>
                  <span className="text-gray-500 ml-2">({nuevoPedidoRapido.numeroCliente})</span>
                </p>
              </div>
              <button
                onClick={() => setMostrarModalNuevoPedido(false)}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <X className="w-6 h-6 text-gray-400" />
              </button>
            </div>

            {/* Formulario */}
            <div className="p-6 space-y-6">
              {/* Tipo de Ave */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Tipo de Ave *</label>
                <select
                  value={nuevoPedidoRapido.tipoAve}
                  onChange={(e) => setNuevoPedidoRapido(prev => ({ ...prev, tipoAve: e.target.value, presentacion: '' }))}
                  className="w-full px-4 py-3 bg-black border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                >
                  <option value="">Seleccionar tipo de ave...</option>
                  {tiposAve?.map(tipo => (
                    <option key={tipo.nombre} value={tipo.nombre}>{tipo.nombre}</option>
                  ))}
                </select>
              </div>

              {/* Variedad - solo si el tipo tiene variedades */}
              {(() => {
                const tipoAveInfo = tiposAve?.find(t => t.nombre === nuevoPedidoRapido.tipoAve);
                return tipoAveInfo?.tieneVariedad && tipoAveInfo?.variedades ? (
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Variedad *</label>
                    <select
                      value={nuevoPedidoRapido.variedad || ''}
                      onChange={(e) => setNuevoPedidoRapido(prev => ({ ...prev, variedad: e.target.value }))}
                      className="w-full px-4 py-3 bg-black border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    >
                      <option value="">Seleccionar variedad...</option>
                      {tipoAveInfo.variedades.map((variedad: string) => (
                        <option key={variedad} value={variedad}>{variedad}</option>
                      ))}
                    </select>
                  </div>
                ) : null;
              })()}

              {/* Cantidad Machos y Hembras - solo si tipo tiene sexo */}
              {(() => {
                const tipoAveInfo = tiposAve?.find(t => t.nombre === nuevoPedidoRapido.tipoAve);
                return tipoAveInfo?.tieneSexo ? (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          <span className="flex items-center gap-2">
                            <span className="w-3 h-3 bg-blue-500 rounded-full"></span>
                            Cantidad Machos
                          </span>
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={nuevoPedidoRapido.cantidadMachos}
                          onChange={(e) => setNuevoPedidoRapido(prev => ({ ...prev, cantidadMachos: e.target.value }))}
                          placeholder="0"
                          className="w-full px-4 py-3 bg-black border border-gray-700 rounded-lg text-white text-center text-xl font-bold focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          <span className="flex items-center gap-2">
                            <span className="w-3 h-3 bg-pink-500 rounded-full"></span>
                            Cantidad Hembras
                          </span>
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={nuevoPedidoRapido.cantidadHembras}
                          onChange={(e) => setNuevoPedidoRapido(prev => ({ ...prev, cantidadHembras: e.target.value }))}
                          placeholder="0"
                          className="w-full px-4 py-3 bg-black border border-gray-700 rounded-lg text-white text-center text-xl font-bold focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                    <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-4">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-300">Total de aves:</span>
                        <span className="text-3xl font-bold text-green-400">
                          {(parseInt(nuevoPedidoRapido.cantidadMachos) || 0) + (parseInt(nuevoPedidoRapido.cantidadHembras) || 0)}
                        </span>
                      </div>
                    </div>
                  </>
                ) : nuevoPedidoRapido.tipoAve ? (
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Cantidad Total *</label>
                    <input
                      type="number"
                      min="1"
                      value={nuevoPedidoRapido.cantidadMachos}
                      onChange={(e) => setNuevoPedidoRapido(prev => ({ ...prev, cantidadMachos: e.target.value, cantidadHembras: '0' }))}
                      placeholder="0"
                      className="w-full px-4 py-3 bg-black border border-gray-700 rounded-lg text-white text-center text-xl font-bold focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>
                ) : null;
              })()}

              {/* PresentaciÃ³n */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">PresentaciÃ³n *</label>
                <select
                  value={nuevoPedidoRapido.presentacion}
                  onChange={(e) => setNuevoPedidoRapido(prev => ({ ...prev, presentacion: e.target.value }))}
                  className="w-full px-4 py-3 bg-black border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                >
                  <option value="">Seleccionar presentaciÃ³n...</option>
                  {getPresentacionesPorTipoAve(nuevoPedidoRapido.tipoAve).map((pres: any) => (
                    <option key={pres.nombre || pres} value={pres.nombre || pres}>{pres.nombre || pres}</option>
                  ))}
                </select>
              </div>

              {/* Contenedor */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Contenedor *</label>
                <select
                  value={nuevoPedidoRapido.contenedor}
                  onChange={(e) => setNuevoPedidoRapido(prev => ({ ...prev, contenedor: e.target.value }))}
                  className="w-full px-4 py-3 bg-black border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                >
                  <option value="">Seleccionar contenedor...</option>
                  {contenedores?.map((cont: any) => (
                    <option key={cont.id || cont.tipo || cont} value={cont.tipo || cont}>{cont.tipo || cont}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Footer del Modal */}
            <div className="sticky bottom-0 bg-zinc-900 border-t border-gray-800 p-4 flex gap-3">
              <button
                onClick={() => setMostrarModalNuevoPedido(false)}
                className="flex-1 px-4 py-3 bg-gray-800 hover:bg-gray-700 border border-gray-600 rounded-lg text-white font-medium transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={confirmarPedidoRapido}
                className="flex-1 px-4 py-3 bg-green-600 hover:bg-green-500 rounded-lg text-white font-bold transition-colors flex items-center justify-center gap-2"
              >
                <CheckCircle className="w-5 h-5" />
                Confirmar Pedido
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
