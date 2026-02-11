import { useState, useEffect } from 'react';
import { ShoppingCart, Eye, Plus, CheckCircle, X, Users, Bird, Package, Layers, ChevronRight, Tag, Trash2, RotateCcw } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { useApp } from '../contexts/AppContext';
import { toast } from 'sonner';

interface SubPedido {
  id: string;
  tipoAve: string;
  variedad?: string;
  cantidadMachos?: string;
  cantidadHembras?: string;
  cantidadTotal: string;
  unidadesPorJaba?: string;
  presentacion: string;
  contenedor: string;
}

interface FormularioPedido {
  id: string;
  cliente: string;
  tipoAve: string;
  variedad?: string;
  cantidadMachos?: string;
  cantidadHembras?: string;
  cantidadTotal: string;
  unidadesPorJaba?: string;
  presentacion: string;
  contenedor: string;
  completado: boolean;
}

interface ClienteNumerado {
  nombre: string;
  numeroCliente: string;
  siguienteSubNumero: number;
}

interface PedidoEnCola {
  id: string;
  cliente: string;
  numeroCliente: string;
  numeroPedido: string;
  subPedidos: SubPedido[];
  timestamp: number;
  prioridadBase: number;
  subNumero: number;
}

export function NuevoPedido() {
  const { addMultiplePedidosConfirmados, tiposAve, clientes, presentaciones, contenedores } = useApp();

  const [numeroClienteActual, setNumeroClienteActual] = useState(1);
  const [clientesNumerados, setClientesNumerados] = useState<ClienteNumerado[]>(() => {
    // Cargar clientes numerados guardados
    try {
      const saved = localStorage.getItem('clientesNumerados');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Encontrar el número más alto de cliente
          const maxNum = Math.max(...parsed.map(c => 
            parseInt(c.numeroCliente.replace('C', '')) || 0
          ));
          setNumeroClienteActual(maxNum + 1);
          return parsed;
        }
      }
    } catch (error) {
      console.error('Error al cargar clientes numerados:', error);
    }
    
    // Inicializar desde clientes del contexto
    return clientes.map((cliente, index) => ({
      nombre: cliente.nombre,
      numeroCliente: `C${String(index + 1).padStart(3, '0')}`,
      siguienteSubNumero: 1
    }));
  });

  // Guardar clientes numerados automáticamente
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        localStorage.setItem('clientesNumerados', JSON.stringify(clientesNumerados));
      } catch (error) {
        console.error('Error al guardar clientes numerados:', error);
      }
    }, 500);
    
    return () => clearTimeout(timer);
  }, [clientesNumerados]);

  // Estado inicial que carga datos guardados de formularios
  const [formularios, setFormularios] = useState<FormularioPedido[]>(() => {
    try {
      const savedData = localStorage.getItem('nuevoPedidoDraft');
      if (savedData) {
        const parsed = JSON.parse(savedData);
        if (Array.isArray(parsed) && parsed.length === 4) {
          return parsed;
        }
      }
    } catch (error) {
      console.error('Error al cargar datos guardados:', error);
    }
    
    // Datos por defecto
    return [
      { id: '1', cliente: '', tipoAve: '', variedad: '', cantidadMachos: '', cantidadHembras: '', cantidadTotal: '', presentacion: '', contenedor: '', completado: false },
      { id: '2', cliente: '', tipoAve: '', variedad: '', cantidadMachos: '', cantidadHembras: '', cantidadTotal: '', presentacion: '', contenedor: '', completado: false },
      { id: '3', cliente: '', tipoAve: '', variedad: '', cantidadMachos: '', cantidadHembras: '', cantidadTotal: '', presentacion: '', contenedor: '', completado: false },
      { id: '4', cliente: '', tipoAve: '', variedad: '', cantidadMachos: '', cantidadHembras: '', cantidadTotal: '', presentacion: '', contenedor: '', completado: false }
    ];
  });

  // Guardar automáticamente cuando cambien los formularios
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        localStorage.setItem('nuevoPedidoDraft', JSON.stringify(formularios));
      } catch (error) {
        console.error('Error al guardar datos:', error);
      }
    }, 500);
    
    return () => clearTimeout(timer);
  }, [formularios]);

  // También guardar pedidos en cola
  const [pedidosEnCola, setPedidosEnCola] = useState<PedidoEnCola[]>(() => {
    try {
      const savedQueue = localStorage.getItem('pedidosEnCola');
      if (savedQueue) {
        const parsed = JSON.parse(savedQueue);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      }
    } catch (error) {
      console.error('Error al cargar cola de pedidos:', error);
    }
    return [];
  });

  // Guardar cola automáticamente
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        localStorage.setItem('pedidosEnCola', JSON.stringify(pedidosEnCola));
      } catch (error) {
        console.error('Error al guardar cola:', error);
      }
    }, 500);
    
    return () => clearTimeout(timer);
  }, [pedidosEnCola]);

  const [pedidoSeleccionado, setPedidoSeleccionado] = useState<PedidoEnCola | null>(null);
  const [nuevoSubPedido, setNuevoSubPedido] = useState<Partial<SubPedido>>({
    tipoAve: '',
    variedad: '',
    cantidadMachos: '',
    cantidadHembras: '',
    cantidadTotal: '',
    presentacion: '',
    contenedor: ''
  });

  const [searchTerm, setSearchTerm] = useState<string>('');

  // Función para limpiar TODOS los datos guardados
  const limpiarTodoLosDatos = () => {
    if (window.confirm('¿Está seguro de limpiar TODOS los datos? Se perderán formularios, pedidos en cola y numeración de clientes.')) {
      localStorage.removeItem('nuevoPedidoDraft');
      localStorage.removeItem('pedidosEnCola');
      localStorage.removeItem('clientesNumerados');
      
      setFormularios([
        { id: '1', cliente: '', tipoAve: '', variedad: '', cantidadMachos: '', cantidadHembras: '', cantidadTotal: '', presentacion: '', contenedor: '', completado: false },
        { id: '2', cliente: '', tipoAve: '', variedad: '', cantidadMachos: '', cantidadHembras: '', cantidadTotal: '', presentacion: '', contenedor: '', completado: false },
        { id: '3', cliente: '', tipoAve: '', variedad: '', cantidadMachos: '', cantidadHembras: '', cantidadTotal: '', presentacion: '', contenedor: '', completado: false },
        { id: '4', cliente: '', tipoAve: '', variedad: '', cantidadMachos: '', cantidadHembras: '', cantidadTotal: '', presentacion: '', contenedor: '', completado: false }
      ]);
      
      setPedidosEnCola([]);
      setNumeroClienteActual(1);
      setClientesNumerados(
        clientes.map((cliente, index) => ({
          nombre: cliente.nombre,
          numeroCliente: `C${String(index + 1).padStart(3, '0')}`,
          siguienteSubNumero: 1
        }))
      );
      
      toast.success('Todos los datos han sido limpiados');
    }
  };

  // Función para limpiar solo formularios (mantener pedidos en cola)
  const limpiarFormulariosSolo = () => {
    if (window.confirm('¿Limpiar solo los formularios? Los pedidos en cola se mantendrán.')) {
      setFormularios([
        { id: '1', cliente: '', tipoAve: '', variedad: '', cantidadMachos: '', cantidadHembras: '', cantidadTotal: '', presentacion: '', contenedor: '', completado: false },
        { id: '2', cliente: '', tipoAve: '', variedad: '', cantidadMachos: '', cantidadHembras: '', cantidadTotal: '', presentacion: '', contenedor: '', completado: false },
        { id: '3', cliente: '', tipoAve: '', variedad: '', cantidadMachos: '', cantidadHembras: '', cantidadTotal: '', presentacion: '', contenedor: '', completado: false },
        { id: '4', cliente: '', tipoAve: '', variedad: '', cantidadMachos: '', cantidadHembras: '', cantidadTotal: '', presentacion: '', contenedor: '', completado: false }
      ]);
      toast.success('Formularios limpiados');
    }
  };

  const obtenerNumeroCliente = (nombreCliente: string): string => {
    const clienteExistente = clientesNumerados.find(c => c.nombre === nombreCliente);
    
    if (clienteExistente) {
      return clienteExistente.numeroCliente;
    }
    
    const nuevoNumero = `C${String(numeroClienteActual).padStart(3, '0')}`;
    const nuevoCliente: ClienteNumerado = {
      nombre: nombreCliente,
      numeroCliente: nuevoNumero,
      siguienteSubNumero: 1
    };
    
    setClientesNumerados(prev => [...prev, nuevoCliente]);
    setNumeroClienteActual(prev => prev + 1);
    
    return nuevoNumero;
  };

  const obtenerNumeracionPedido = (cliente: string): {numeroCliente: string, numeroPedido: string, prioridadBase: number, subNumero: number} => {
    const numeroCliente = obtenerNumeroCliente(cliente);
    const prioridadBase = parseInt(numeroCliente.replace('C', ''));
    
    let clienteIndex = clientesNumerados.findIndex(c => c.nombre === cliente);
    
    if (clienteIndex === -1) {
      const nuevoCliente: ClienteNumerado = {
        nombre: cliente,
        numeroCliente,
        siguienteSubNumero: 1
      };
      setClientesNumerados(prev => [...prev, nuevoCliente]);
      clienteIndex = clientesNumerados.length;
    }
    
    const clienteData = clientesNumerados.find(c => c.nombre === cliente);
    let subNumero = clienteData ? clienteData.siguienteSubNumero : 1;
    
    if (clienteData) {
      setClientesNumerados(prev => 
        prev.map(c => 
          c.nombre === cliente 
            ? { ...c, siguienteSubNumero: subNumero + 1 }
            : c
        )
      );
    }
    
    const numeroPedido = `${numeroCliente}.${subNumero}`;
    
    return {
      numeroCliente,
      numeroPedido,
      prioridadBase,
      subNumero
    };
  };

  const getTipoAveInfo = (nombreAve: string) => {
    return tiposAve.find(ave => ave.nombre === nombreAve);
  };

  const getPresentacionesPorTipo = (tipoAve: string) => {
    return presentaciones.filter(p => p.tipoAve === tipoAve);
  };

  const calcularTotal = (machos: string, hembras: string) => {
    const m = parseInt(machos) || 0;
    const h = parseInt(hembras) || 0;
    return (m + h).toString();
  };

  const getFormColor = (index: number) => {
    const colors = [
      '#0d4a24',  // Verde oscuro principal
      '#166534',  // Verde medio
      '#b8941e',  // Ámbar dorado
      '#ccaa00'   // Ámbar brillante
    ];
    return colors[index % colors.length];
  };

  const actualizarFormulario = (id: string, campo: string, valor: string) => {
    setFormularios(prev => prev.map(form => {
      if (form.id === id) {
        const formActualizado = { ...form, [campo]: valor };
        
        if (campo === 'tipoAve') {
          formActualizado.variedad = '';
          formActualizado.cantidadMachos = '';
          formActualizado.cantidadHembras = '';
          formActualizado.cantidadTotal = '';
          formActualizado.presentacion = '';
        }

        if (campo === 'cantidadMachos' || campo === 'cantidadHembras') {
          formActualizado.cantidadTotal = calcularTotal(
            campo === 'cantidadMachos' ? valor : formActualizado.cantidadMachos || '',
            campo === 'cantidadHembras' ? valor : formActualizado.cantidadHembras || ''
          );
        }
        
        const tipoAveInfo = getTipoAveInfo(formActualizado.tipoAve);
        const necesitaVariedad = tipoAveInfo?.tieneVariedad;
        const necesitaSexo = tipoAveInfo?.tieneSexo;
        
        const completado = 
          formActualizado.cliente !== '' &&
          formActualizado.tipoAve !== '' &&
          formActualizado.presentacion !== '' &&
          formActualizado.contenedor !== '' &&
          (!necesitaVariedad || formActualizado.variedad !== '') &&
          (!necesitaSexo || (formActualizado.cantidadMachos !== '' || formActualizado.cantidadHembras !== '')) &&
          (necesitaSexo || formActualizado.cantidadTotal !== '');
          
        return { ...formActualizado, completado };
      }
      return form;
    }));
  };
  
  const mandarACola = () => {
    const formulariosCompletados = formularios.filter(f => f.completado);
    
    if (formulariosCompletados.length === 0) {
      toast.error('No hay pedidos completados para enviar a la cola');
      return;
    }

    const pedidosPorCliente: { [cliente: string]: FormularioPedido[] } = {};
    formulariosCompletados.forEach(form => {
      if (!pedidosPorCliente[form.cliente]) {
        pedidosPorCliente[form.cliente] = [];
      }
      pedidosPorCliente[form.cliente].push(form);
    });

    const nuevosPedidos: PedidoEnCola[] = Object.entries(pedidosPorCliente).map(([cliente, forms]) => {
      const numeracion = obtenerNumeracionPedido(cliente);
      
      return {
        id: `pedido-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        cliente,
        numeroCliente: numeracion.numeroCliente,
        numeroPedido: numeracion.numeroPedido,
        timestamp: Date.now(),
        prioridadBase: numeracion.prioridadBase,
        subNumero: numeracion.subNumero,
        subPedidos: forms.map(f => ({
          id: `sub-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          tipoAve: f.tipoAve,
          variedad: f.variedad,
          cantidadMachos: f.cantidadMachos,
          cantidadHembras: f.cantidadHembras,
          cantidadTotal: f.cantidadTotal,
          unidadesPorJaba: f.unidadesPorJaba,
          presentacion: f.presentacion,
          contenedor: f.contenedor
        }))
      };
    });

    setPedidosEnCola(prev => [...prev, ...nuevosPedidos]);
    
    setFormularios(prev => prev.map(f => 
      f.completado 
        ? { ...f, cliente: '', tipoAve: '', variedad: '', cantidadMachos: '', cantidadHembras: '', cantidadTotal: '', unidadesPorJaba: '', presentacion: '', contenedor: '', completado: false }
        : f
    ));

    toast.success(`${nuevosPedidos.length} pedido(s) agregado(s) a la cola`);
  };

  const confirmarPedidos = () => {
    if (pedidosEnCola.length === 0) {
      toast.error('No hay pedidos en la cola para confirmar');
      return;
    }

    const ahora = new Date();
    const fecha = ahora.toISOString().split('T')[0];
    const hora = ahora.toTimeString().split(' ')[0].slice(0, 5);

    const pedidosOrdenados = [...pedidosEnCola].sort((a, b) => {
      if (a.prioridadBase !== b.prioridadBase) {
        return a.prioridadBase - b.prioridadBase;
      }
      return a.subNumero - b.subNumero;
    });

    const pedidosConfirmar = pedidosOrdenados.flatMap((pedido) => 
      pedido.subPedidos.map((sub, index) => {
        const variedadInfo = sub.variedad ? ` - ${sub.variedad}` : '';
        
        // DEBUG: ver qué datos llegan del sub-pedido
        console.log('SUB-PEDIDO DATA:', JSON.stringify(sub, null, 2));
        
        let cantidadFinal = 0;
        let detalleSexo = '';
        let jabas: number | undefined = undefined;
        let uPorJaba: number | undefined = undefined;
        const esVivo = sub.presentacion?.toLowerCase().includes('vivo');
        
        if (sub.cantidadMachos || sub.cantidadHembras) {
          const machos = parseInt(sub.cantidadMachos || '0');
          const hembras = parseInt(sub.cantidadHembras || '0');
          cantidadFinal = machos + hembras;
          detalleSexo = ` (M:${machos}, H:${hembras})`;
        } else if (esVivo && sub.unidadesPorJaba && parseInt(sub.unidadesPorJaba) > 0) {
          // Para Vivo: cantidad = jabas × unidades por jaba
          jabas = parseInt(sub.cantidadTotal);
          uPorJaba = parseInt(sub.unidadesPorJaba);
          cantidadFinal = jabas * uPorJaba;
          console.log(`VIVO CALC: ${jabas} jabas × ${uPorJaba} = ${cantidadFinal}`);
        } else {
          cantidadFinal = parseInt(sub.cantidadTotal);
          console.log(`ELSE PATH: cantidadFinal = ${cantidadFinal}, esVivo=${esVivo}, unidadesPorJaba=${sub.unidadesPorJaba}`);
        }
        
        const subNumero = index + 1;
        const numeroPedidoCompleto = `${pedido.numeroCliente}.${subNumero}`;
        
        return {
          id: `confirmed-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          numeroPedido: numeroPedidoCompleto,
          numeroCliente: pedido.numeroCliente,
          cliente: pedido.cliente,
          tipoAve: `${sub.tipoAve}${variedadInfo}${detalleSexo}`,
          variedad: sub.variedad,
          presentacion: sub.presentacion,
          cantidad: cantidadFinal,
          cantidadJabas: jabas,
          unidadesPorJaba: uPorJaba,
          contenedor: sub.contenedor,
          fecha,
          hora,
          prioridad: pedido.prioridadBase,
          esSubPedido: pedido.subPedidos.length > 1
        };
      })
    );

    addMultiplePedidosConfirmados(pedidosConfirmar);
    
    // Limpiar datos guardados después de confirmar
    localStorage.removeItem('nuevoPedidoDraft');
    localStorage.removeItem('pedidosEnCola');
    setPedidosEnCola([]);
    
    toast.success(`${pedidosConfirmar.length} pedido(s) confirmado(s) y enviado(s) a Lista de Pedidos`);
  };

  const eliminarDeCola = (id: string) => {
    if (window.confirm('¿Eliminar este pedido de la cola?')) {
      setPedidosEnCola(prev => prev.filter(p => p.id !== id));
      toast.info('Pedido eliminado de la cola');
    }
  };

  const abrirDetalle = (pedido: PedidoEnCola) => {
    setPedidoSeleccionado(pedido);
    setNuevoSubPedido({
      tipoAve: '',
      variedad: '',
      cantidadMachos: '',
      cantidadHembras: '',
      cantidadTotal: '',
      presentacion: '',
      contenedor: ''
    });
  };

  const eliminarSubPedido = (subPedidoId: string) => {
    if (!pedidoSeleccionado) return;

    if (window.confirm('¿Eliminar este sub-pedido?')) {
      setPedidosEnCola(prev => prev.map(pedido => {
        if (pedido.id === pedidoSeleccionado.id) {
          const nuevosSubPedidos = pedido.subPedidos.filter(sub => sub.id !== subPedidoId);
          
          if (nuevosSubPedidos.length === 0) {
            return null;
          }
          
          return {
            ...pedido,
            subPedidos: nuevosSubPedidos
          };
        }
        return pedido;
      }).filter(p => p !== null) as PedidoEnCola[]);

      const pedidoActualizado = pedidosEnCola.find(p => p.id === pedidoSeleccionado.id);
      if (pedidoActualizado) {
        const nuevosSubPedidos = pedidoActualizado.subPedidos.filter(sub => sub.id !== subPedidoId);
        if (nuevosSubPedidos.length === 0) {
          setPedidoSeleccionado(null);
        } else {
          setPedidoSeleccionado({ ...pedidoActualizado, subPedidos: nuevosSubPedidos });
        }
      }

      toast.info('Sub-pedido eliminado');
    }
  };

  const agregarSubPedidoAlPedido = () => {
    if (!pedidoSeleccionado) return;

    if (!nuevoSubPedido.tipoAve || !nuevoSubPedido.presentacion || !nuevoSubPedido.contenedor) {
      toast.error('Complete todos los campos obligatorios del sub-pedido');
      return;
    }

    const tipoAveInfo = getTipoAveInfo(nuevoSubPedido.tipoAve);
    
    if (tipoAveInfo?.tieneVariedad && !nuevoSubPedido.variedad) {
      toast.error('Seleccione una variedad para este tipo de ave');
      return;
    }

    if (tipoAveInfo?.tieneSexo && !nuevoSubPedido.cantidadMachos && !nuevoSubPedido.cantidadHembras) {
      toast.error('Ingrese al menos la cantidad de machos o hembras');
      return;
    }

    if (!tipoAveInfo?.tieneSexo && !nuevoSubPedido.cantidadTotal) {
      toast.error('Ingrese la cantidad total');
      return;
    }

    const nuevoSub: SubPedido = {
      id: `sub-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      tipoAve: nuevoSubPedido.tipoAve!,
      variedad: nuevoSubPedido.variedad,
      cantidadMachos: nuevoSubPedido.cantidadMachos,
      cantidadHembras: nuevoSubPedido.cantidadHembras,
      cantidadTotal: tipoAveInfo?.tieneSexo 
        ? calcularTotal(nuevoSubPedido.cantidadMachos || '', nuevoSubPedido.cantidadHembras || '')
        : nuevoSubPedido.cantidadTotal!,
      presentacion: nuevoSubPedido.presentacion!,
      contenedor: nuevoSubPedido.contenedor!
    };

    setPedidosEnCola(prev => prev.map(pedido => {
      if (pedido.id === pedidoSeleccionado.id) {
        return {
          ...pedido,
          subPedidos: [...pedido.subPedidos, nuevoSub]
        };
      }
      return pedido;
    }));

    setPedidoSeleccionado({
      ...pedidoSeleccionado,
      subPedidos: [...pedidoSeleccionado.subPedidos, nuevoSub]
    });

    setNuevoSubPedido({
      tipoAve: '',
      variedad: '',
      cantidadMachos: '',
      cantidadHembras: '',
      cantidadTotal: '',
      presentacion: '',
      contenedor: ''
    });

    toast.success('Sub-pedido agregado al pedido');
  };

  // Función para restaurar desde backup automático
  const restaurarDesdeBackup = () => {
    try {
      const savedBackup = localStorage.getItem('nuevoPedidoBackup');
      if (savedBackup) {
        const parsed = JSON.parse(savedBackup);
        if (Array.isArray(parsed)) {
          setFormularios(parsed);
          toast.success('Formularios restaurados desde backup');
        }
      } else {
        toast.info('No hay backup disponible');
      }
    } catch (error) {
      console.error('Error al restaurar backup:', error);
      toast.error('Error al restaurar backup');
    }
  };

  // Crear backup periódico (cada 10 segundos de cambios)
  useEffect(() => {
    const backupTimer = setInterval(() => {
      try {
        localStorage.setItem('nuevoPedidoBackup', JSON.stringify(formularios));
      } catch (error) {
        console.error('Error al crear backup:', error);
      }
    }, 10000); // Backup cada 10 segundos
    
    return () => clearInterval(backupTimer);
  }, [formularios]);

  return (
    <div className="min-h-screen">
      {/* Header Principal */}
      <div className="mb-8">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
          <div className="space-y-2">
            <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-3">
              <div className="p-3 bg-black/50 border border-amber-500/20 rounded-xl backdrop-blur-sm">
                <ShoppingCart className="w-6 h-6 text-amber-400" />
              </div>
              <div>
                <div>Nuevo Pedido</div>
                <div className="text-sm font-normal text-amber-400 flex items-center gap-2 mt-1">
                  <Tag className="w-4 h-4" />
                  Sistema de numeración: C001.1 → C001.2 → C002.1
                </div>
              </div>
            </h1>
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 text-sm">
                <div className="px-2 py-1 bg-black/50 border border-green-700/30 rounded text-green-400 font-mono">
                  C001.1
                </div>
                <span className="text-gray-400">Primer pedido cliente</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <div className="px-2 py-1 bg-black/50 border border-amber-700/30 rounded text-amber-400 font-mono">
                  C001.2
                </div>
                <span className="text-gray-400">Segundo pedido</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <div className="px-2 py-1 bg-black/50 border border-blue-700/30 rounded text-blue-400 font-mono">
                  C002.1
                </div>
                <span className="text-gray-400">Nuevo cliente</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-amber-400 ml-4">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                <span>Datos se guardan automáticamente</span>
              </div>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-3">
            <div className="bg-black/50 border border-gray-800 rounded-xl px-4 py-2 flex items-center gap-3">
              <div className="text-center">
                <div className="text-sm text-gray-400">Clientes únicos</div>
                <div className="text-2xl font-bold text-amber-400">
                  {[...new Set(pedidosEnCola.map(p => p.numeroCliente))].length}
                </div>
              </div>
              <div className="h-8 w-px bg-gray-800"></div>
              <div className="text-center">
                <div className="text-sm text-gray-400">Total pedidos</div>
                <div className="text-2xl font-bold text-green-400">
                  {pedidosEnCola.reduce((acc, p) => acc + p.subPedidos.length, 0)}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Barra de Búsqueda y Filtros */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Buscar pedido por cliente o número..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-black/50 border border-gray-800 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/20"
            />
            <ShoppingCart className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-amber-400" />
          </div>
        </div>

        {/* Estadísticas en Tiempo Real */}
        {pedidosEnCola.length > 0 && (
          <div className="mb-6 bg-black/50 border border-gray-800 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                <span className="text-sm font-medium text-white">Numeración generada</span>
              </div>
              <div className="text-xs text-gray-500">
                Actualizado: {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {pedidosEnCola.map(pedido => (
                <div key={pedido.id} className="relative group">
                  <div className={`px-3 py-2 rounded-lg border text-sm font-mono transition-all hover:scale-105 ${
                    pedido.subPedidos.length > 1
                      ? 'bg-blue-900/10 border-blue-700/20 text-blue-300 hover:border-blue-600/40'
                      : 'bg-green-900/10 border-green-700/20 text-green-300 hover:border-green-600/40'
                  }`}>
                    <div className="flex items-center gap-2">
                      <span>{pedido.numeroPedido}</span>
                      {pedido.subPedidos.length > 1 && (
                        <span className="text-xs bg-black/30 px-1.5 py-0.5 rounded">
                          +{pedido.subPedidos.length}
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-gray-400 truncate">{pedido.cliente}</div>
                  </div>
                  <div className="absolute top-full left-0 mt-2 w-48 bg-black/90 border border-gray-800 rounded-lg p-3 shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                    <div className="text-xs text-gray-400 mb-1">Cliente</div>
                    <div className="text-sm text-white font-medium mb-2">{pedido.cliente}</div>
                    <div className="text-xs text-gray-400 mb-1">Sub-pedidos</div>
                    <div className="text-sm text-amber-400 font-bold">{pedido.subPedidos.length}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Botones de Acción Principales */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 mb-8">
          <button
            onClick={mandarACola}
            className="px-6 py-4 bg-black/50 border border-blue-700/30 rounded-xl font-semibold transition-all hover:bg-black/70 hover:border-blue-600/50 hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-3 text-white group"
          >
            <div className="p-2 bg-blue-900/30 rounded-lg group-hover:bg-blue-900/40 transition-colors">
              <ShoppingCart className="w-5 h-5 text-blue-400" />
            </div>
            <span>Enviar a Cola de Pedidos</span>
            <ChevronRight className="w-5 h-5 text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity" />
          </button>

          <button
            onClick={confirmarPedidos}
            disabled={pedidosEnCola.length === 0}
            className={`px-6 py-4 rounded-xl font-semibold transition-all hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-3 group ${
              pedidosEnCola.length > 0
                ? 'bg-black/50 border border-amber-700/30 hover:bg-black/70 hover:border-amber-600/50 text-white'
                : 'bg-black/30 border border-gray-800 text-gray-500 cursor-not-allowed'
            }`}
          >
            <div className={`p-2 rounded-lg transition-colors ${
              pedidosEnCola.length > 0
                ? 'bg-amber-900/30 group-hover:bg-amber-900/40'
                : 'bg-gray-800/30'
            }`}>
              <CheckCircle className={`w-5 h-5 ${
                pedidosEnCola.length > 0 ? 'text-amber-400' : 'text-gray-600'
              }`} />
            </div>
            <span className="flex items-center gap-2">
              Confirmar Pedidos
              {pedidosEnCola.length > 0 && (
                <span className="px-2 py-1 text-xs bg-amber-900/30 text-amber-300 rounded-lg">
                  {pedidosEnCola.reduce((acc, p) => acc + p.subPedidos.length, 0)}
                </span>
              )}
            </span>
            {pedidosEnCola.length > 0 && (
              <ChevronRight className="w-5 h-5 text-amber-400 opacity-0 group-hover:opacity-100 transition-opacity" />
            )}
          </button>

          <button
            onClick={limpiarFormulariosSolo}
            className="px-6 py-4 bg-black/50 border border-gray-700/30 rounded-xl font-semibold transition-all hover:bg-black/70 hover:border-gray-600/50 hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-3 text-gray-300 group"
          >
            <div className="p-2 bg-gray-800/30 rounded-lg group-hover:bg-gray-800/40 transition-colors">
              <RotateCcw className="w-5 h-5" />
            </div>
            <span>Limpiar Formularios</span>
          </button>

          <button
            onClick={limpiarTodoLosDatos}
            className="px-6 py-4 bg-black/50 border border-red-700/30 rounded-xl font-semibold transition-all hover:bg-black/70 hover:border-red-600/50 hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-3 text-red-400 group"
          >
            <div className="p-2 bg-red-900/30 rounded-lg group-hover:bg-red-900/40 transition-colors">
              <Trash2 className="w-5 h-5" />
            </div>
            <span>Limpiar Todo</span>
          </button>
        </div>

        {/* Indicador de datos guardados */}
        <div className="flex items-center justify-between mb-4 text-sm">
          <div className="flex items-center gap-2 text-green-400">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
            <span>Datos guardados automáticamente</span>
          </div>
          <button
            onClick={restaurarDesdeBackup}
            className="text-amber-400 hover:text-amber-300 transition-colors text-xs flex items-center gap-1"
          >
            <RotateCcw className="w-3 h-3" />
            Restaurar backup
          </button>
        </div>
      </div>

      {/* Formularios Simultáneos - DISEÑO EMPRESARIAL */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        {formularios.map((form, index) => {
          const tipoAveInfo = getTipoAveInfo(form.tipoAve);
          const necesitaVariedad = tipoAveInfo?.tieneVariedad;
          const necesitaSexo = tipoAveInfo?.tieneSexo;
          const presentacionesTipo = form.tipoAve ? getPresentacionesPorTipo(form.tipoAve) : [];
          const formColor = getFormColor(index);

          return (
            <div
              key={form.id}
              className="bg-black/50 border rounded-2xl p-5 relative overflow-hidden group transition-all duration-300 hover:border-opacity-60"
              style={{
                borderColor: form.completado 
                  ? `${formColor}80` 
                  : '#374151',
                boxShadow: form.completado 
                  ? `0 10px 40px -10px ${formColor}40`
                  : '0 4px 20px -5px rgba(0, 0, 0, 0.5)'
              }}
            >
              {/* Indicador de estado */}
              <div className="absolute top-4 right-4 z-10">
                {form.completado ? (
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                    <span className="text-xs text-green-400 font-medium">Listo</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                    <span className="text-xs text-amber-400">En progreso</span>
                  </div>
                )}
              </div>

              {/* Header del formulario */}
              <div className="mb-5">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white shadow-lg"
                    style={{ 
                      background: `linear-gradient(135deg, ${formColor}, ${formColor.replace('#', '#')}dd)`,
                      border: `1px solid ${formColor}80`
                    }}
                  >
                    {index + 1}
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-lg">Pedido {index + 1}</h3>
                    <p className="text-xs text-gray-400">Complete todos los campos</p>
                  </div>
                </div>
              </div>

              {/* Campos del formulario */}
              <div className="space-y-3">
                {/* Cliente */}
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-2 flex items-center gap-2">
                    <Users className="w-4 h-4 text-blue-400" />
                    Cliente
                  </label>
                  <select
                    value={form.cliente}
                    onChange={(e) => actualizarFormulario(form.id, 'cliente', e.target.value)}
                    className="w-full px-4 py-3 bg-black/30 border border-gray-800 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-all"
                  >
                    <option value="" className="bg-black">Seleccionar cliente...</option>
                    {clientes.map(cliente => (
                      <option key={cliente.id} value={cliente.nombre} className="bg-black">
                        {cliente.nombre}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Tipo de Ave */}
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-2 flex items-center gap-2">
                    <Bird className="w-4 h-4 text-green-400" />
                    Tipo de Ave
                  </label>
                  <select
                    value={form.tipoAve}
                    onChange={(e) => actualizarFormulario(form.id, 'tipoAve', e.target.value)}
                    className="w-full px-4 py-3 bg-black/30 border border-gray-800 rounded-lg text-white text-sm focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500/20 transition-all"
                  >
                    <option value="" className="bg-black">Seleccionar tipo...</option>
                    {tiposAve.map(tipo => (
                      <option key={tipo.id} value={tipo.nombre} className="bg-black">
                        {tipo.nombre}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Variedad */}
                {necesitaVariedad && tipoAveInfo?.variedades && (
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-2">
                      Variedad
                    </label>
                    <select
                      value={form.variedad || ''}
                      onChange={(e) => actualizarFormulario(form.id, 'variedad', e.target.value)}
                      className="w-full px-4 py-3 bg-black/30 border border-gray-800 rounded-lg text-white text-sm focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/20 transition-all"
                    >
                      <option value="" className="bg-black">Seleccionar variedad...</option>
                      {tipoAveInfo.variedades.map(variedad => (
                        <option key={variedad} value={variedad} className="bg-black">
                          {variedad}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Cantidad por Sexo */}
                {necesitaSexo && (
                  <>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs font-medium text-gray-400 mb-2">
                          Machos
                        </label>
                        <input
                          type="number"
                          value={form.cantidadMachos || ''}
                          onChange={(e) => actualizarFormulario(form.id, 'cantidadMachos', e.target.value)}
                          placeholder="0"
                          min="0"
                          className="w-full px-4 py-3 bg-black/30 border border-gray-800 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-400 mb-2">
                          Hembras
                        </label>
                        <input
                          type="number"
                          value={form.cantidadHembras || ''}
                          onChange={(e) => actualizarFormulario(form.id, 'cantidadHembras', e.target.value)}
                          placeholder="0"
                          min="0"
                          className="w-full px-4 py-3 bg-black/30 border border-gray-800 rounded-lg text-white text-sm focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500/20 transition-all"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-400 mb-2">
                        Total {form.presentacion?.toLowerCase().includes('vivo') ? '(Jabas)' : ''}
                      </label>
                      <input
                        type="text"
                        value={form.cantidadTotal}
                        readOnly
                        className="w-full px-4 py-3 bg-green-900/20 border border-green-800/30 rounded-lg text-green-400 text-sm font-bold text-center"
                      />
                    </div>
                  </>
                )}

                {/* Presentación */}
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-2 flex items-center gap-2">
                    <Package className="w-4 h-4 text-amber-400" />
                    Presentación
                  </label>
                  <select
                    value={form.presentacion}
                    onChange={(e) => actualizarFormulario(form.id, 'presentacion', e.target.value)}
                    disabled={!form.tipoAve}
                    className="w-full px-4 py-3 bg-black/30 border border-gray-800 rounded-lg text-white text-sm focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <option value="" className="bg-black">Seleccionar presentación...</option>
                    {presentacionesTipo.map(pres => (
                      <option key={pres.id} value={pres.nombre} className="bg-black">
                        {pres.nombre}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Cantidad Total / Jabas */}
                {!necesitaSexo && form.tipoAve && (
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-2">
                      {form.presentacion?.toLowerCase().includes('vivo') ? 'Cantidad de Jabas' : 'Cantidad Total'}
                    </label>
                    <input
                      type="number"
                      value={form.cantidadTotal}
                      onChange={(e) => actualizarFormulario(form.id, 'cantidadTotal', e.target.value)}
                      placeholder={form.presentacion?.toLowerCase().includes('vivo') ? 'Nº de jabas' : '0'}
                      min="1"
                      className="w-full px-4 py-3 bg-black/30 border border-gray-800 rounded-lg text-white text-sm focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500/20 transition-all"
                    />
                    {form.presentacion?.toLowerCase().includes('vivo') && form.cantidadTotal && (
                      <p className="text-[10px] text-amber-400 mt-1 flex items-center gap-1">
                        🐔 {form.cantidadTotal} jaba(s) se pesarán por bloque en Pesaje
                      </p>
                    )}
                  </div>
                )}

                {/* Unidades por Jaba (solo Vivo) */}
                {form.presentacion?.toLowerCase().includes('vivo') && form.cantidadTotal && (
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-2">
                      Unidades por Jaba
                    </label>
                    <input
                      type="number"
                      value={form.unidadesPorJaba || ''}
                      onChange={(e) => actualizarFormulario(form.id, 'unidadesPorJaba', e.target.value)}
                      placeholder="Ej: 8, 10, 12..."
                      min="1"
                      className="w-full px-4 py-3 bg-black/30 border border-amber-800/30 rounded-lg text-white text-sm focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/20 transition-all"
                    />
                    {form.unidadesPorJaba && parseInt(form.unidadesPorJaba) > 0 && (
                      <div className="mt-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-between"
                        style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)' }}
                      >
                        <span className="text-gray-400">Total aves</span>
                        <span className="text-green-400 font-bold font-mono">
                          {parseInt(form.cantidadTotal) * parseInt(form.unidadesPorJaba)} unidades
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {/* Contenedor */}
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-2">
                    Contenedor
                  </label>
                  <select
                    value={form.contenedor}
                    onChange={(e) => actualizarFormulario(form.id, 'contenedor', e.target.value)}
                    className="w-full px-4 py-3 bg-black/30 border border-gray-800 rounded-lg text-white text-sm focus:outline-none focus:border-gray-600 focus:ring-1 focus:ring-gray-600/20 transition-all"
                  >
                    <option value="" className="bg-black">Seleccionar contenedor...</option>
                    {contenedores.map(cont => (
                      <option key={cont.id} value={cont.tipo} className="bg-black">
                        {cont.tipo}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Contador de caracteres/clicks */}
              <div className="mt-4 pt-3 border-t border-gray-800">
                <div className="text-xs text-gray-500">
                  Cambios guardados automáticamente
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Cola de Pedidos - DISEÑO EMPRESARIAL */}
      {pedidosEnCola.length > 0 && (
        <div className="bg-black/50 border border-gray-800 rounded-2xl p-5 mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-black/50 border border-amber-700/30 rounded-xl">
                <Layers className="w-6 h-6 text-amber-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Pedidos en Cola</h2>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-sm text-gray-400">
                    {pedidosEnCola.length} cliente(s) - {pedidosEnCola.reduce((acc, p) => acc + p.subPedidos.length, 0)} pedidos
                  </span>
                  <div className="w-1 h-1 rounded-full bg-gray-700"></div>
                  <span className="text-sm text-amber-400 font-medium">
                    Listos para confirmar
                  </span>
                </div>
              </div>
            </div>
            <div className="px-3 py-1 bg-amber-900/20 border border-amber-700/30 rounded-lg">
              <span className="text-sm text-amber-400 font-medium">
                Total: {pedidosEnCola.length}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {pedidosEnCola.map((pedido) => (
              <div
                key={pedido.id}
                className="bg-black/30 border border-gray-800 rounded-xl p-4 hover:border-gray-700 transition-all group relative overflow-hidden"
              >
                {/* Botón de eliminar */}
                <button
                  onClick={() => eliminarDeCola(pedido.id)}
                  className="absolute top-3 right-3 w-8 h-8 rounded-full bg-red-900/20 border border-red-700/30 flex items-center justify-center transition-all hover:bg-red-900/30 hover:border-red-600/40 hover:scale-110 z-10"
                >
                  <X className="w-4 h-4 text-red-400" />
                </button>

                {/* Información del cliente */}
                <div className="mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="w-4 h-4 text-blue-400" />
                    <span className="text-xs text-gray-400">Cliente</span>
                  </div>
                  <p className="text-white font-medium truncate">{pedido.cliente}</p>
                  <p className="text-xs text-blue-400 font-mono mt-1">{pedido.numeroPedido}</p>
                </div>

                {/* Información de sub-pedidos */}
                <div className="mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Package className="w-4 h-4 text-green-400" />
                    <span className="text-xs text-gray-400">Sub-pedidos</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-2xl font-bold text-green-400">
                      {pedido.subPedidos.length}
                    </div>
                    <div className="flex-1">
                      <div className="h-2 bg-gray-900 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-green-600 to-amber-500 rounded-full"
                          style={{ width: `${Math.min(100, (pedido.subPedidos.length / 10) * 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Botón ver detalle */}
                <Dialog>
                  <DialogTrigger asChild>
                    <button
                      onClick={() => abrirDetalle(pedido)}
                      className="w-full px-4 py-2.5 bg-black/50 border border-gray-800 rounded-lg text-white font-medium transition-all hover:bg-black/70 hover:border-gray-700 hover:scale-[1.02] flex items-center justify-center gap-2 group"
                    >
                      <Eye className="w-4 h-4" />
                      Ver Detalle
                      <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[600px] bg-black border border-gray-800 rounded-2xl overflow-hidden">
                    <DialogHeader className="p-6 border-b border-gray-800">
                      <DialogTitle className="text-white text-xl flex items-center gap-3">
                        <div className="p-2 bg-black/50 border border-amber-700/30 rounded-lg">
                          <Users className="w-5 h-5 text-amber-400" />
                        </div>
                        <div>
                          <div>Detalle del Pedido</div>
                          <div className="text-sm font-normal text-gray-400">
                            Cliente: {pedidoSeleccionado?.cliente}
                          </div>
                        </div>
                      </DialogTitle>
                    </DialogHeader>

                    {pedidoSeleccionado && (
                      <div className="p-6 space-y-6">
                        {/* Lista de Sub-pedidos */}
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <h3 className="text-lg font-bold text-white flex items-center gap-2">
                              <Layers className="w-5 h-5 text-amber-400" />
                              Sub-pedidos ({pedidoSeleccionado.subPedidos.length})
                            </h3>
                          </div>

                          <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                            {pedidoSeleccionado.subPedidos.map((sub, index) => (
                              <div 
                                key={sub.id} 
                                className="bg-black/30 border border-gray-800 rounded-xl p-4 hover:border-gray-700 transition-all"
                              >
                                <div className="flex justify-between items-start mb-3">
                                  <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-black/50 border border-blue-700/30 flex items-center justify-center">
                                      <span className="text-sm font-bold text-blue-400">#{index + 1}</span>
                                    </div>
                                    <div>
                                      <div className="text-white font-medium">
                                        {sub.tipoAve}{sub.variedad ? ` - ${sub.variedad}` : ''}
                                      </div>
                                      <div className="text-xs text-gray-400 flex items-center gap-2 mt-1">
                                        <Package className="w-3 h-3" />
                                        {sub.presentacion} • {sub.contenedor}
                                      </div>
                                    </div>
                                  </div>
                                  <button
                                    onClick={() => eliminarSubPedido(sub.id)}
                                    className="p-1.5 hover:bg-red-900/20 rounded-lg transition-colors"
                                  >
                                    <X className="w-4 h-4 text-red-400" />
                                  </button>
                                </div>

                                <div className="grid grid-cols-2 gap-3 text-sm">
                                  {sub.cantidadMachos || sub.cantidadHembras ? (
                                    <>
                                      <div className="bg-black/50 rounded-lg p-2">
                                        <div className="text-xs text-gray-400">Machos</div>
                                        <div className="text-white font-medium">{sub.cantidadMachos || 0}</div>
                                      </div>
                                      <div className="bg-black/50 rounded-lg p-2">
                                        <div className="text-xs text-gray-400">Hembras</div>
                                        <div className="text-white font-medium">{sub.cantidadHembras || 0}</div>
                                      </div>
                                      <div className="col-span-2 bg-green-900/20 rounded-lg p-2">
                                        <div className="text-xs text-gray-400">Total</div>
                                        <div className="text-green-400 font-bold">{sub.cantidadTotal} {sub.presentacion?.toLowerCase().includes('vivo') ? 'jabas' : 'unidades'}</div>
                                      </div>
                                    </>
                                  ) : (
                                    <div className="col-span-2 bg-green-900/20 rounded-lg p-2">
                                      <div className="text-xs text-gray-400">{sub.presentacion?.toLowerCase().includes('vivo') ? 'Cantidad de Jabas' : 'Cantidad Total'}</div>
                                      <div className="text-green-400 font-bold">{sub.cantidadTotal} {sub.presentacion?.toLowerCase().includes('vivo') ? 'jabas' : 'unidades'}</div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Agregar nuevo sub-pedido */}
                        <div className="bg-black/30 border border-gray-800 rounded-xl p-5">
                          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                            <Plus className="w-5 h-5 text-green-400" />
                            Agregar Otro Pedido
                          </h3>

                          <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label className="block text-xs font-medium text-gray-400 mb-2">
                                  Tipo de Ave
                                </label>
                                <select
                                  value={nuevoSubPedido.tipoAve || ''}
                                  onChange={(e) => setNuevoSubPedido(prev => ({ ...prev, tipoAve: e.target.value, variedad: '', cantidadMachos: '', cantidadHembras: '', cantidadTotal: '' }))}
                                  className="w-full px-4 py-3 bg-black/50 border border-gray-800 rounded-lg text-white text-sm"
                                >
                                  <option value="" className="bg-black">Seleccionar...</option>
                                  {tiposAve.map(tipo => (
                                    <option key={tipo.id} value={tipo.nombre} className="bg-black">
                                      {tipo.nombre}
                                    </option>
                                  ))}
                                </select>
                              </div>

                              {nuevoSubPedido.tipoAve && getTipoAveInfo(nuevoSubPedido.tipoAve)?.tieneVariedad && (
                                <div>
                                  <label className="block text-xs font-medium text-gray-400 mb-2">
                                    Variedad
                                  </label>
                                  <select
                                    value={nuevoSubPedido.variedad || ''}
                                    onChange={(e) => setNuevoSubPedido(prev => ({ ...prev, variedad: e.target.value }))}
                                    className="w-full px-4 py-3 bg-black/50 border border-gray-800 rounded-lg text-white text-sm"
                                  >
                                    <option value="" className="bg-black">Seleccionar...</option>
                                    {getTipoAveInfo(nuevoSubPedido.tipoAve)?.variedades?.map(variedad => (
                                      <option key={variedad} value={variedad} className="bg-black">
                                        {variedad}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                              )}
                            </div>

                            {nuevoSubPedido.tipoAve && getTipoAveInfo(nuevoSubPedido.tipoAve)?.tieneSexo ? (
                              <>
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <label className="block text-xs font-medium text-gray-400 mb-2">
                                      Machos
                                    </label>
                                    <input
                                      type="number"
                                      value={nuevoSubPedido.cantidadMachos || ''}
                                      onChange={(e) => setNuevoSubPedido(prev => ({ 
                                        ...prev, 
                                        cantidadMachos: e.target.value,
                                        cantidadTotal: calcularTotal(e.target.value, prev.cantidadHembras || '')
                                      }))}
                                      min="0"
                                      placeholder="0"
                                      className="w-full px-4 py-3 bg-black/50 border border-gray-800 rounded-lg text-white text-sm"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-xs font-medium text-gray-400 mb-2">
                                      Hembras
                                    </label>
                                    <input
                                      type="number"
                                      value={nuevoSubPedido.cantidadHembras || ''}
                                      onChange={(e) => setNuevoSubPedido(prev => ({ 
                                        ...prev, 
                                        cantidadHembras: e.target.value,
                                        cantidadTotal: calcularTotal(prev.cantidadMachos || '', e.target.value)
                                      }))}
                                      min="0"
                                      placeholder="0"
                                      className="w-full px-4 py-3 bg-black/50 border border-gray-800 rounded-lg text-white text-sm"
                                    />
                                  </div>
                                </div>
                                <div>
                                  <label className="block text-xs font-medium text-gray-400 mb-2">
                                    Total
                                  </label>
                                  <input
                                    type="text"
                                    value={nuevoSubPedido.cantidadTotal || '0'}
                                    readOnly
                                    className="w-full px-4 py-3 bg-green-900/20 border border-green-800/30 rounded-lg text-green-400 text-sm font-bold text-center"
                                  />
                                </div>
                              </>
                            ) : nuevoSubPedido.tipoAve && (
                              <div>
                                <label className="block text-xs font-medium text-gray-400 mb-2">
                                  {nuevoSubPedido.presentacion?.toLowerCase().includes('vivo') ? 'Cantidad de Jabas' : 'Cantidad Total'}
                                </label>
                                <input
                                  type="number"
                                  value={nuevoSubPedido.cantidadTotal || ''}
                                  onChange={(e) => setNuevoSubPedido(prev => ({ ...prev, cantidadTotal: e.target.value }))}
                                  min="1"
                                  placeholder={nuevoSubPedido.presentacion?.toLowerCase().includes('vivo') ? 'Nº de jabas' : '0'}
                                  className="w-full px-4 py-3 bg-black/50 border border-gray-800 rounded-lg text-white text-sm"
                                />
                              </div>
                            )}

                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label className="block text-xs font-medium text-gray-400 mb-2">
                                  Presentación
                                </label>
                                <select
                                  value={nuevoSubPedido.presentacion || ''}
                                  onChange={(e) => setNuevoSubPedido(prev => ({ ...prev, presentacion: e.target.value }))}
                                  disabled={!nuevoSubPedido.tipoAve}
                                  className="w-full px-4 py-3 bg-black/50 border border-gray-800 rounded-lg text-white text-sm disabled:opacity-50"
                                >
                                  <option value="" className="bg-black">Seleccionar...</option>
                                  {nuevoSubPedido.tipoAve && getPresentacionesPorTipo(nuevoSubPedido.tipoAve).map(pres => (
                                    <option key={pres.id} value={pres.nombre} className="bg-black">
                                      {pres.nombre}
                                    </option>
                                  ))}
                                </select>
                              </div>

                              <div>
                                <label className="block text-xs font-medium text-gray-400 mb-2">
                                  Contenedor
                                </label>
                                <select
                                  value={nuevoSubPedido.contenedor || ''}
                                  onChange={(e) => setNuevoSubPedido(prev => ({ ...prev, contenedor: e.target.value }))}
                                  className="w-full px-4 py-3 bg-black/50 border border-gray-800 rounded-lg text-white text-sm"
                                >
                                  <option value="" className="bg-black">Seleccionar...</option>
                                  {contenedores.map(cont => (
                                    <option key={cont.id} value={cont.tipo} className="bg-black">
                                      {cont.tipo}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            </div>

                            <button
                              onClick={agregarSubPedidoAlPedido}
                              className="w-full px-4 py-3 bg-gradient-to-r from-green-900/30 to-amber-900/30 border border-green-700/30 rounded-xl text-white font-semibold transition-all hover:from-green-900/40 hover:to-amber-900/40 hover:border-green-600/40 hover:scale-[1.02] flex items-center justify-center gap-2"
                            >
                              <Plus className="w-5 h-5" />
                              Agregar Sub-Pedido
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </DialogContent>
                </Dialog>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Footer con estadísticas */}
      <div className="bg-black/50 border border-gray-800 rounded-xl p-4">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="text-center p-3">
            <div className="text-sm text-gray-400 mb-1">Formularios activos</div>
            <div className="text-2xl font-bold text-blue-400">
              {formularios.filter(f => f.completado).length}/{formularios.length}
            </div>
          </div>
          <div className="text-center p-3">
            <div className="text-sm text-gray-400 mb-1">Clientes en cola</div>
            <div className="text-2xl font-bold text-green-400">
              {[...new Set(pedidosEnCola.map(p => p.numeroCliente))].length}
            </div>
          </div>
          <div className="text-center p-3">
            <div className="text-sm text-gray-400 mb-1">Total pedidos</div>
            <div className="text-2xl font-bold text-amber-400">
              {pedidosEnCola.reduce((acc, p) => acc + p.subPedidos.length, 0)}
            </div>
          </div>
          <div className="text-center p-3">
            <div className="text-sm text-gray-400 mb-1">Datos guardados</div>
            <div className="text-2xl font-bold text-purple-400">
              {(() => {
                try {
                  const draft = localStorage.getItem('nuevoPedidoDraft');
                  const queue = localStorage.getItem('pedidosEnCola');
                  return (draft ? 1 : 0) + (queue ? 1 : 0);
                } catch {
                  return 0;
                }
              })()}/2
            </div>
          </div>
        </div>
        
        {/* Indicador de estado de guardado */}
        <div className="mt-4 pt-4 border-t border-gray-800">
          <div className="text-xs text-center text-gray-500">
            Los datos se guardan automáticamente cada 500ms. 
            {formularios.some(f => f.completado) && (
              <span className="text-green-400 ml-2">✓ Datos guardados</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}