import { useState, useEffect, useRef } from 'react';
import { ShoppingCart, Eye, Plus, CheckCircle, X, Users, Bird, Package, Layers, ChevronRight, Tag, Trash2, RotateCcw, Grid3x3, Edit2, Save, MapPin } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { useApp } from '../contexts/AppContext';
import { useTheme, t } from '../contexts/ThemeContext';
import { toast } from 'sonner';

interface SubPedido {
  id: string;
  tipoAve: string;
  variedad?: string;
  cantidadMachos?: string;
  cantidadHembras?: string;
  cantidadTotal: string;
  unidadesPorJaba?: string;
  totalAves?: string; // ← NUEVO: jabas × unidadesPorJaba calculado
  presentacion: string;
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
  totalAves?: string;
  presentacion: string;
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

const emptySubForm = (): Partial<SubPedido> => ({
  tipoAve: '', variedad: '', cantidadMachos: '', cantidadHembras: '',
  cantidadTotal: '', unidadesPorJaba: '', totalAves: '', presentacion: '',
});

export function NuevoPedido() {
  const { addMultiplePedidosConfirmados, tiposAve, clientes, presentaciones, contenedores, costosClientes } = useApp();
  const { isDark } = useTheme(); const c = t(isDark);

  // Filtrar solo clientes y productos activos
  const clientesActivos = clientes.filter(c => c.estado !== 'Inactivo');
  const tiposAveActivos = tiposAve.filter(t => t.estado !== 'Inactivo');

  // Zonas desde localStorage
  const [zonasDisponibles, setZonasDisponibles] = useState<string[]>([]);
  useEffect(() => {
    try {
      const saved = localStorage.getItem('avicola_zonas');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) setZonasDisponibles(parsed.map((z: { nombre: string }) => z.nombre));
      }
    } catch { }
  }, []);

  // Estado de filtro de zona y autocompletado de cliente por formulario
  const [zonaFiltros, setZonaFiltros] = useState<string[]>(['', '', '', '']);
  const [clienteSearches, setClienteSearches] = useState<string[]>(['', '', '', '']);
  const [clienteDropdowns, setClienteDropdowns] = useState<boolean[]>([false, false, false, false]);
  const clienteRefs = useRef<(HTMLDivElement | null)[]>([null, null, null, null]);

  // Cerrar dropdown al hacer click fuera
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      clienteRefs.current.forEach((ref, i) => {
        if (ref && !ref.contains(e.target as Node)) {
          setClienteDropdowns(prev => { const n = [...prev]; n[i] = false; return n; });
        }
      });
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Filtrar clientes según zona y texto de búsqueda
  const getClientesFiltrados = (index: number) => {
    let lista = clientesActivos;
    const zona = zonaFiltros[index];
    if (zona) lista = lista.filter(cl => cl.zona === zona);
    const texto = clienteSearches[index]?.toLowerCase().trim();
    if (texto) lista = lista.filter(cl => cl.nombre.toLowerCase().includes(texto));
    return lista;
  };

  // Filtrar productos según costos asignados al cliente
  const getProductosParaCliente = (nombreCliente: string) => {
    if (!nombreCliente) return tiposAveActivos;
    const cliente = clientes.find(c => c.nombre === nombreCliente);
    if (!cliente) return tiposAveActivos;
    const costosDelCliente = costosClientes.filter(cc => cc.clienteId === cliente.id);
    if (costosDelCliente.length === 0) return tiposAveActivos;
    const tipoIdsConCosto = [...new Set(costosDelCliente.map(cc => cc.tipoAveId))];
    return tiposAveActivos.filter(t => tipoIdsConCosto.includes(t.id));
  };

  // Filtrar variedades según costos asignados al cliente para un tipo específico
  const getVariedadesParaCliente = (nombreCliente: string, tipoAveNombre: string): string[] => {
    const info = getTipoAveInfo(tipoAveNombre);
    if (!info?.tieneVariedad || !info.variedades?.length) return [];
    if (!nombreCliente) return info.variedades;
    const cliente = clientes.find(c => c.nombre === nombreCliente);
    if (!cliente) return info.variedades;
    const costosDelCliente = costosClientes.filter(cc => cc.clienteId === cliente.id && cc.tipoAveId === info.id);
    if (costosDelCliente.length === 0) return info.variedades;
    // Filtrar solo variedades que el cliente tiene asignadas
    const variedadesConCosto = [...new Set(costosDelCliente.filter(cc => cc.variedad).map(cc => cc.variedad!))];
    return variedadesConCosto.length > 0 ? variedadesConCosto : info.variedades;
  };

  const [numeroClienteActual, setNumeroClienteActual] = useState(1);
  const [clientesNumerados, setClientesNumerados] = useState<ClienteNumerado[]>(() => {
    try {
      const saved = localStorage.getItem('clientesNumerados');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const maxNum = Math.max(...parsed.map(c => parseInt(c.numeroCliente.replace('C', '')) || 0));
          setNumeroClienteActual(maxNum + 1);
          return parsed;
        }
      }
    } catch { }
    return clientes.map((cliente, index) => ({
      nombre: cliente.nombre,
      numeroCliente: `C${String(index + 1).padStart(3, '0')}`,
      siguienteSubNumero: 1
    }));
  });

  useEffect(() => {
    const t = setTimeout(() => {
      try { localStorage.setItem('clientesNumerados', JSON.stringify(clientesNumerados)); } catch { }
    }, 500);
    return () => clearTimeout(t);
  }, [clientesNumerados]);

  const [formularios, setFormularios] = useState<FormularioPedido[]>(() => {
    try {
      const saved = localStorage.getItem('nuevoPedidoDraft');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length === 4) return parsed;
      }
    } catch { }
    return [
      { id: '1', cliente: '', tipoAve: '', variedad: '', cantidadMachos: '', cantidadHembras: '', cantidadTotal: '', presentacion: '', completado: false },
      { id: '2', cliente: '', tipoAve: '', variedad: '', cantidadMachos: '', cantidadHembras: '', cantidadTotal: '', presentacion: '', completado: false },
      { id: '3', cliente: '', tipoAve: '', variedad: '', cantidadMachos: '', cantidadHembras: '', cantidadTotal: '', presentacion: '', completado: false },
      { id: '4', cliente: '', tipoAve: '', variedad: '', cantidadMachos: '', cantidadHembras: '', cantidadTotal: '', presentacion: '', completado: false }
    ];
  });

  useEffect(() => {
    const t = setTimeout(() => {
      try { localStorage.setItem('nuevoPedidoDraft', JSON.stringify(formularios)); } catch { }
    }, 500);
    return () => clearTimeout(t);
  }, [formularios]);

  const [pedidosEnCola, setPedidosEnCola] = useState<PedidoEnCola[]>(() => {
    try {
      const saved = localStorage.getItem('pedidosEnCola');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch { }
    return [];
  });

  useEffect(() => {
    const t = setTimeout(() => {
      try { localStorage.setItem('pedidosEnCola', JSON.stringify(pedidosEnCola)); } catch { }
    }, 500);
    return () => clearTimeout(t);
  }, [pedidosEnCola]);

  const [pedidoSeleccionado, setPedidoSeleccionado] = useState<PedidoEnCola | null>(null);
  const [nuevoSubPedido, setNuevoSubPedido] = useState<Partial<SubPedido>>(emptySubForm());
  const [editandoSubId, setEditandoSubId] = useState<string | null>(null);
  const [editandoSubData, setEditandoSubData] = useState<Partial<SubPedido>>(emptySubForm());
  const [searchTerm, setSearchTerm] = useState('');

  const limpiarTodoLosDatos = () => {
    if (window.confirm('¿Está seguro de limpiar TODOS los datos?')) {
      localStorage.removeItem('nuevoPedidoDraft');
      localStorage.removeItem('pedidosEnCola');
      localStorage.removeItem('clientesNumerados');
      setFormularios([
        { id: '1', cliente: '', tipoAve: '', variedad: '', cantidadMachos: '', cantidadHembras: '', cantidadTotal: '', presentacion: '', completado: false },
        { id: '2', cliente: '', tipoAve: '', variedad: '', cantidadMachos: '', cantidadHembras: '', cantidadTotal: '', presentacion: '', completado: false },
        { id: '3', cliente: '', tipoAve: '', variedad: '', cantidadMachos: '', cantidadHembras: '', cantidadTotal: '', presentacion: '', completado: false },
        { id: '4', cliente: '', tipoAve: '', variedad: '', cantidadMachos: '', cantidadHembras: '', cantidadTotal: '', presentacion: '', completado: false }
      ]);
      setPedidosEnCola([]);
      setNumeroClienteActual(1);
      setClientesNumerados(clientes.map((c, i) => ({ nombre: c.nombre, numeroCliente: `C${String(i + 1).padStart(3, '0')}`, siguienteSubNumero: 1 })));
      setZonaFiltros(['', '', '', '']);
      setClienteSearches(['', '', '', '']);
      setClienteDropdowns([false, false, false, false]);
      toast.success('Todos los datos han sido limpiados');
    }
  };

  const obtenerNumeroCliente = (nombreCliente: string): string => {
    const existente = clientesNumerados.find(c => c.nombre === nombreCliente);
    if (existente) return existente.numeroCliente;
    const nuevo = `C${String(numeroClienteActual).padStart(3, '0')}`;
    setClientesNumerados(prev => [...prev, { nombre: nombreCliente, numeroCliente: nuevo, siguienteSubNumero: 1 }]);
    setNumeroClienteActual(prev => prev + 1);
    return nuevo;
  };

  const obtenerNumeracionPedido = (cliente: string) => {
    const numeroCliente = obtenerNumeroCliente(cliente);
    const prioridadBase = parseInt(numeroCliente.replace('C', ''));
    const clienteData = clientesNumerados.find(c => c.nombre === cliente);
    const subNumero = clienteData ? clienteData.siguienteSubNumero : 1;
    if (clienteData) {
      setClientesNumerados(prev => prev.map(c => c.nombre === cliente ? { ...c, siguienteSubNumero: subNumero + 1 } : c));
    }
    return { numeroCliente, numeroPedido: `${numeroCliente}.${subNumero}`, prioridadBase, subNumero };
  };

  const getTipoAveInfo = (nombre: string) => tiposAve.find(t => t.nombre === nombre);

  // Obtener presentaciones filtradas por variedad y costos del cliente (sin duplicados)
  const getPresentacionesParaFormulario = (cliente: string, tipoAve: string, variedad: string) => {
    if (!tipoAve) return [];
    const info = getTipoAveInfo(tipoAve);

    // 1. Filtrar por tipoAve
    let pres = presentaciones.filter(p => p.tipoAve === tipoAve);

    // 2. Si tiene variedad seleccionada, filtrar por esa variedad
    if (info?.tieneVariedad && variedad) {
      const presConVariedad = pres.filter(p => p.variedad === variedad);
      if (presConVariedad.length > 0) pres = presConVariedad;
    }

    // 3. Deduplicar por nombre de presentación
    const seen = new Set<string>();
    pres = pres.filter(p => {
      if (seen.has(p.nombre)) return false;
      seen.add(p.nombre);
      return true;
    });

    // 4. Filtrar según precios del cliente (si tiene costos asignados)
    if (cliente) {
      const clienteObj = clientes.find(c => c.nombre === cliente);
      if (clienteObj && info) {
        const costosMatch = costosClientes.filter(cc =>
          cc.clienteId === clienteObj.id &&
          cc.tipoAveId === info.id &&
          (!info.tieneVariedad || !variedad || cc.variedad === variedad)
        );
        if (costosMatch.length > 0) {
          const presPermitidas: string[] = [];
          costosMatch.forEach(cm => {
            if ((cm.precioVivo || 0) > 0) presPermitidas.push('Vivo');
            if ((cm.precioPelado || 0) > 0) presPermitidas.push('Pelado');
            if ((cm.precioDestripado || 0) > 0) presPermitidas.push('Destripado');
          });
          const unicas = [...new Set(presPermitidas)];
          if (unicas.length > 0) {
            pres = pres.filter(p => unicas.includes(p.nombre));
          }
        }
      }
    }

    return pres;
  };

  const calcularTotal = (m: string, h: string) => ((parseInt(m) || 0) + (parseInt(h) || 0)).toString();

  const recalcularTotalAves = (jabas: string, uPJ: string) => {
    const j = parseInt(jabas) || 0;
    const u = parseInt(uPJ) || 0;
    return j > 0 && u > 0 ? (j * u).toString() : '';
  };

  const getFormColor = (index: number) => ['#0d4a24', '#166534', '#b8941e', '#ccaa00'][index % 4];

  // ── Actualizar formulario principal ──────────────────────────────
  const actualizarFormulario = (id: string, campo: string, valor: string) => {
    setFormularios(prev => prev.map(form => {
      if (form.id !== id) return form;
      const f = { ...form, [campo]: valor };

      // Al cambiar cliente, verificar si el producto seleccionado sigue disponible
      if (campo === 'cliente' && f.tipoAve) {
        const productosDelCliente = getProductosParaCliente(valor);
        if (!productosDelCliente.some(p => p.nombre === f.tipoAve)) {
          Object.assign(f, { tipoAve: '', variedad: '', cantidadMachos: '', cantidadHembras: '', cantidadTotal: '', unidadesPorJaba: '', totalAves: '', presentacion: '' });
        } else if (f.variedad) {
          // Verificar si la variedad sigue disponible para el nuevo cliente
          const variedadesDisponibles = getVariedadesParaCliente(valor, f.tipoAve);
          if (!variedadesDisponibles.includes(f.variedad)) {
            f.variedad = '';
          }
        }
      }

      if (campo === 'tipoAve') {
        Object.assign(f, { variedad: '', cantidadMachos: '', cantidadHembras: '', cantidadTotal: '', unidadesPorJaba: '', totalAves: '', presentacion: '' });
      }
      if (campo === 'variedad') {
        f.presentacion = '';
      }
      if (campo === 'cantidadMachos' || campo === 'cantidadHembras') {
        f.cantidadTotal = calcularTotal(campo === 'cantidadMachos' ? valor : f.cantidadMachos || '', campo === 'cantidadHembras' ? valor : f.cantidadHembras || '');
      }
      // ← FIX PRINCIPAL: recalcular totalAves al cambiar jabas o unidades/jaba
      if (campo === 'cantidadTotal' || campo === 'unidadesPorJaba') {
        const jabas = campo === 'cantidadTotal' ? valor : f.cantidadTotal;
        const uPJ = campo === 'unidadesPorJaba' ? valor : (f.unidadesPorJaba || '');
        f.totalAves = recalcularTotalAves(jabas, uPJ);
      }

      const info = getTipoAveInfo(f.tipoAve);
      f.completado = !!(
        f.cliente && f.tipoAve && f.presentacion &&
        (!info?.tieneVariedad || f.variedad) &&
        (!info?.tieneSexo || f.cantidadMachos || f.cantidadHembras) &&
        (info?.tieneSexo || f.cantidadTotal)
      );
      return f;
    }));
  };

  // ── Actualizar sub-form (nuevo o edición) con recalculo ──────────
  const actualizarSubForm = (
    data: Partial<SubPedido>,
    setData: (v: Partial<SubPedido>) => void,
    campo: string,
    valor: string
  ) => {
    let next = { ...data, [campo]: valor };
    if (campo === 'tipoAve') {
      next = { ...next, variedad: '', cantidadMachos: '', cantidadHembras: '', cantidadTotal: '', unidadesPorJaba: '', totalAves: '', presentacion: '' };
    }
    if (campo === 'variedad') {
      next = { ...next, presentacion: '' };
    }
    if (campo === 'cantidadMachos' || campo === 'cantidadHembras') {
      next.cantidadTotal = calcularTotal(
        campo === 'cantidadMachos' ? valor : (data.cantidadMachos || ''),
        campo === 'cantidadHembras' ? valor : (data.cantidadHembras || '')
      );
    }
    // ← FIX: recalculo en sub-form también
    if (campo === 'cantidadTotal' || campo === 'unidadesPorJaba') {
      const jabas = campo === 'cantidadTotal' ? valor : (data.cantidadTotal || '');
      const uPJ = campo === 'unidadesPorJaba' ? valor : (data.unidadesPorJaba || '');
      next.totalAves = recalcularTotalAves(jabas, uPJ);
    }
    setData(next);
  };

  // ── Cola ─────────────────────────────────────────────────────────
  const mandarACola = () => {
    const listos = formularios.filter(f => f.completado);
    if (!listos.length) { toast.error('No hay pedidos completados para enviar a la cola'); return; }

    const porCliente: Record<string, FormularioPedido[]> = {};
    listos.forEach(f => { (porCliente[f.cliente] ??= []).push(f); });

    const nuevos: PedidoEnCola[] = Object.entries(porCliente).map(([cliente, forms]) => {
      const num = obtenerNumeracionPedido(cliente);
      return {
        id: `pedido-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        cliente, ...num, timestamp: Date.now(),
        subPedidos: forms.map(f => {
          const esVivo = f.presentacion?.toLowerCase().includes('vivo');
          return {
            id: `sub-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            tipoAve: f.tipoAve, variedad: f.variedad,
            cantidadMachos: f.cantidadMachos, cantidadHembras: f.cantidadHembras,
            cantidadTotal: f.cantidadTotal, unidadesPorJaba: f.unidadesPorJaba,
            totalAves: esVivo ? recalcularTotalAves(f.cantidadTotal, f.unidadesPorJaba || '') : '',
            presentacion: f.presentacion,
          } as SubPedido;
        })
      };
    });

    setPedidosEnCola(prev => [...prev, ...nuevos]);
    setFormularios(prev => prev.map((f, i) => {
      if (f.completado) {
        setZonaFiltros(prev => { const n = [...prev]; n[i] = ''; return n; });
        setClienteSearches(prev => { const n = [...prev]; n[i] = ''; return n; });
        return { id: f.id, cliente: '', tipoAve: '', variedad: '', cantidadMachos: '', cantidadHembras: '', cantidadTotal: '', unidadesPorJaba: '', totalAves: '', presentacion: '', completado: false };
      }
      return f;
    }));
    toast.success(`${nuevos.length} pedido(s) agregado(s) a la cola`);
  };

  const confirmarPedidos = () => {
    if (!pedidosEnCola.length) { toast.error('No hay pedidos en la cola para confirmar'); return; }
    const ahora = new Date();
    const fecha = ahora.toISOString().split('T')[0];
    const hora = ahora.toTimeString().split(' ')[0].slice(0, 5);

    const ordenados = [...pedidosEnCola].sort((a, b) =>
      a.prioridadBase !== b.prioridadBase ? a.prioridadBase - b.prioridadBase : a.subNumero - b.subNumero
    );

    const baseTimestamp = Date.now();
    const confirmar = ordenados.flatMap((pedido, pedidoIdx) => {
      const grupoDespacho = `despacho-${baseTimestamp}-${pedidoIdx}-${Math.random().toString(36).substr(2, 6)}`;
      return pedido.subPedidos.map((sub, idx) => {
        const varInfo = sub.variedad ? ` - ${sub.variedad}` : '';
        let cantidadFinal = 0, detalleSexo = '', jabas: number | undefined, uPorJaba: number | undefined;
        const esVivo = sub.presentacion?.toLowerCase().includes('vivo');

        if (sub.cantidadMachos || sub.cantidadHembras) {
          const m = parseInt(sub.cantidadMachos || '0');
          const h = parseInt(sub.cantidadHembras || '0');
          cantidadFinal = m + h;
          detalleSexo = ` (M:${m}, H:${h})`;
          if (esVivo && sub.unidadesPorJaba && parseInt(sub.unidadesPorJaba) > 0) {
            jabas = cantidadFinal; // total jabas = M + H
            uPorJaba = parseInt(sub.unidadesPorJaba);
            cantidadFinal = jabas * uPorJaba; // total aves
          }
        } else if (esVivo && sub.unidadesPorJaba && parseInt(sub.unidadesPorJaba) > 0) {
          jabas = parseInt(sub.cantidadTotal);
          uPorJaba = parseInt(sub.unidadesPorJaba);
          cantidadFinal = jabas * uPorJaba; // ← FIX: total aves correcto
        } else {
          cantidadFinal = parseInt(sub.cantidadTotal);
        }

        return {
          id: `confirmed-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          numeroPedido: `${pedido.numeroCliente}.${idx + 1}`,
          numeroCliente: pedido.numeroCliente, cliente: pedido.cliente,
          tipoAve: `${sub.tipoAve}${varInfo}${detalleSexo}`,
          variedad: sub.variedad, presentacion: sub.presentacion,
          cantidad: cantidadFinal, cantidadJabas: jabas, unidadesPorJaba: uPorJaba,
          contenedor: '', fecha, hora,
          prioridad: pedido.prioridadBase, esSubPedido: pedido.subPedidos.length > 1,
          grupoDespacho,
        };
      });
    });

    addMultiplePedidosConfirmados(confirmar);
    localStorage.removeItem('nuevoPedidoDraft');
    localStorage.removeItem('pedidosEnCola');
    setPedidosEnCola([]);
    toast.success(`${confirmar.length} pedido(s) confirmado(s) y enviado(s) a Lista de Pedidos`);
  };

  const eliminarDeCola = (id: string) => {
    if (window.confirm('¿Eliminar este pedido de la cola?')) {
      setPedidosEnCola(prev => prev.filter(p => p.id !== id));
      toast.info('Pedido eliminado de la cola');
    }
  };

  const abrirDetalle = (pedido: PedidoEnCola) => {
    setPedidoSeleccionado(pedido);
    setNuevoSubPedido(emptySubForm());
    setEditandoSubId(null);
  };

  // ── Sub-pedido CRUD ──────────────────────────────────────────────
  const eliminarSubPedido = (subId: string) => {
    if (!pedidoSeleccionado || !window.confirm('¿Eliminar este sub-pedido?')) return;
    const nuevos = pedidoSeleccionado.subPedidos.filter(s => s.id !== subId);
    if (nuevos.length === 0) {
      setPedidosEnCola(prev => prev.filter(p => p.id !== pedidoSeleccionado.id));
      setPedidoSeleccionado(null);
    } else {
      const act = { ...pedidoSeleccionado, subPedidos: nuevos };
      setPedidosEnCola(prev => prev.map(p => p.id === pedidoSeleccionado.id ? act : p));
      setPedidoSeleccionado(act);
    }
    toast.info('Sub-pedido eliminado');
  };

  const iniciarEdicion = (sub: SubPedido) => {
    setEditandoSubId(sub.id);
    setEditandoSubData({ ...sub });
  };

  const guardarEdicion = () => {
    if (!pedidoSeleccionado || !editandoSubId) return;
    if (!editandoSubData.tipoAve || !editandoSubData.presentacion) { toast.error('Complete tipo de ave y presentación'); return; }

    const info = getTipoAveInfo(editandoSubData.tipoAve!);
    const esVivo = editandoSubData.presentacion?.toLowerCase().includes('vivo');
    const jabas = editandoSubData.cantidadTotal || '';
    const uPJ = editandoSubData.unidadesPorJaba || '';

    const updated: SubPedido = {
      id: editandoSubId,
      tipoAve: editandoSubData.tipoAve!,
      variedad: editandoSubData.variedad,
      cantidadMachos: editandoSubData.cantidadMachos,
      cantidadHembras: editandoSubData.cantidadHembras,
      cantidadTotal: info?.tieneSexo
        ? calcularTotal(editandoSubData.cantidadMachos || '', editandoSubData.cantidadHembras || '')
        : jabas,
      unidadesPorJaba: uPJ,
      totalAves: esVivo ? recalcularTotalAves(jabas, uPJ) : '',
      presentacion: editandoSubData.presentacion!,
    };

    const act = { ...pedidoSeleccionado, subPedidos: pedidoSeleccionado.subPedidos.map(s => s.id === editandoSubId ? updated : s) };
    setPedidosEnCola(prev => prev.map(p => p.id === pedidoSeleccionado.id ? act : p));
    setPedidoSeleccionado(act);
    setEditandoSubId(null);
    setEditandoSubData(emptySubForm());
    toast.success('Sub-pedido actualizado');
  };

  const agregarSubPedidoAlPedido = () => {
    if (!pedidoSeleccionado) return;
    if (!nuevoSubPedido.tipoAve || !nuevoSubPedido.presentacion) { toast.error('Complete todos los campos obligatorios'); return; }

    const info = getTipoAveInfo(nuevoSubPedido.tipoAve);
    if (info?.tieneVariedad && !nuevoSubPedido.variedad) { toast.error('Seleccione una variedad'); return; }
    if (info?.tieneSexo && !nuevoSubPedido.cantidadMachos && !nuevoSubPedido.cantidadHembras) { toast.error('Ingrese machos o hembras'); return; }
    if (!info?.tieneSexo && !nuevoSubPedido.cantidadTotal) { toast.error('Ingrese la cantidad total'); return; }

    const esVivo = nuevoSubPedido.presentacion?.toLowerCase().includes('vivo');
    const jabas = nuevoSubPedido.cantidadTotal || '';
    const uPJ = nuevoSubPedido.unidadesPorJaba || '';

    const nuevo: SubPedido = {
      id: `sub-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      tipoAve: nuevoSubPedido.tipoAve!,
      variedad: nuevoSubPedido.variedad,
      cantidadMachos: nuevoSubPedido.cantidadMachos,
      cantidadHembras: nuevoSubPedido.cantidadHembras,
      cantidadTotal: info?.tieneSexo
        ? calcularTotal(nuevoSubPedido.cantidadMachos || '', nuevoSubPedido.cantidadHembras || '')
        : jabas,
      unidadesPorJaba: uPJ,
      totalAves: esVivo ? recalcularTotalAves(jabas, uPJ) : '', // ← FIX
      presentacion: nuevoSubPedido.presentacion!,
    };

    const act = { ...pedidoSeleccionado, subPedidos: [...pedidoSeleccionado.subPedidos, nuevo] };
    setPedidosEnCola(prev => prev.map(p => p.id === pedidoSeleccionado.id ? act : p));
    setPedidoSeleccionado(act);
    setNuevoSubPedido(emptySubForm());
    toast.success('Sub-pedido agregado al pedido');
  };

  const restaurarDesdeBackup = () => {
    try {
      const b = localStorage.getItem('nuevoPedidoBackup');
      if (b) { setFormularios(JSON.parse(b)); toast.success('Formularios restaurados desde backup'); }
      else toast.info('No hay backup disponible');
    } catch { toast.error('Error al restaurar backup'); }
  };

  useEffect(() => {
    const t = setInterval(() => {
      try { localStorage.setItem('nuevoPedidoBackup', JSON.stringify(formularios)); } catch { }
    }, 10000);
    return () => clearInterval(t);
  }, [formularios]);

  // ── Renderer del sub-form (reutilizable para nuevo y edición) ────
  const renderSubForm = (
    data: Partial<SubPedido>,
    setData: (v: Partial<SubPedido>) => void,
    onSubmit: () => void,
    submitContent: React.ReactNode,
    submitClassName: string,
    clienteDelPedido?: string
  ) => {
    const productosDisponibles = clienteDelPedido ? getProductosParaCliente(clienteDelPedido) : tiposAveActivos;
    const info = getTipoAveInfo(data.tipoAve || '');
    const necesitaVariedad = info?.tieneVariedad;
    const necesitaSexo = info?.tieneSexo;
    const presDisponibles = data.tipoAve ? getPresentacionesParaFormulario(clienteDelPedido || '', data.tipoAve, data.variedad || '') : [];
    const esVivo = data.presentacion?.toLowerCase().includes('vivo');
    const esCatOtro = info?.categoria === 'Otro';

    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium mb-2" style={{ color: c.textSecondary }}>Producto</label>
            <select value={data.tipoAve || ''}
              onChange={e => actualizarSubForm(data, setData, 'tipoAve', e.target.value)}
              className="w-full px-4 py-3 border rounded-lg text-sm"
              style={{ background: c.bgCardAlt, borderColor: c.border, color: c.text }}>
              <option value="" style={{ background: c.bgPage, color: c.text }}>Seleccionar...</option>
              {productosDisponibles.map(t => <option key={t.id} value={t.nombre} style={{ background: c.bgPage, color: c.text }}>{t.nombre}</option>)}
            </select>
          </div>

          {necesitaVariedad && (
            <div>
              <label className="block text-xs font-medium mb-2" style={{ color: c.textSecondary }}>Variedad</label>
              <select value={data.variedad || ''}
                onChange={e => actualizarSubForm(data, setData, 'variedad', e.target.value)}
                className="w-full px-4 py-3 border rounded-lg text-sm"
                style={{ background: c.bgCardAlt, borderColor: c.border, color: c.text }}>
                <option value="" style={{ background: c.bgPage, color: c.text }}>Seleccionar...</option>
                {getVariedadesParaCliente(clienteDelPedido || '', data.tipoAve || '').map((v: string) => <option key={v} value={v} style={{ background: c.bgPage, color: c.text }}>{v}</option>)}
              </select>
            </div>
          )}
        </div>

        {/* Presentación ANTES de cantidades para que esVivo se evalúe correctamente */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium mb-2" style={{ color: c.textSecondary }}>Presentación</label>
            <select value={data.presentacion || ''}
              onChange={e => actualizarSubForm(data, setData, 'presentacion', e.target.value)}
              disabled={!data.tipoAve}
              className="w-full px-4 py-3 border rounded-lg text-sm disabled:opacity-50"
              style={{ background: c.bgCardAlt, borderColor: c.border, color: c.text }}>
              <option value="" style={{ background: c.bgPage, color: c.text }}>Seleccionar...</option>
              {presDisponibles.map(p => <option key={p.id} value={p.nombre} style={{ background: c.bgPage, color: c.text }}>{p.nombre}</option>)}
            </select>
          </div>
          <div className="rounded-lg p-3 flex items-center justify-center text-xs" style={{ background: isDark ? 'rgba(30,58,138,0.1)' : 'rgba(59,130,246,0.08)', border: `1px solid ${isDark ? 'rgba(30,64,175,0.3)' : 'rgba(59,130,246,0.2)'}`, color: isDark ? '#60a5fa' : '#1d4ed8' }}>
            Contenedor se asigna en pesaje
          </div>
        </div>

        {/* Sexo */}
        {necesitaSexo && (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium mb-2" style={{ color: c.textSecondary }}>{esVivo ? 'Jabas de Machos' : 'Machos'}</label>
                <input type="number" min="0" placeholder="0" value={data.cantidadMachos || ''}
                  onChange={e => actualizarSubForm(data, setData, 'cantidadMachos', e.target.value)}
                  className="w-full px-4 py-3 border rounded-lg text-sm"
                  style={{ background: c.bgCardAlt, borderColor: c.border, color: c.text }} />
              </div>
              <div>
                <label className="block text-xs font-medium mb-2" style={{ color: c.textSecondary }}>{esVivo ? 'Jabas de Hembras' : 'Hembras'}</label>
                <input type="number" min="0" placeholder="0" value={data.cantidadHembras || ''}
                  onChange={e => actualizarSubForm(data, setData, 'cantidadHembras', e.target.value)}
                  className="w-full px-4 py-3 border rounded-lg text-sm"
                  style={{ background: c.bgCardAlt, borderColor: c.border, color: c.text }} />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium mb-2" style={{ color: c.textSecondary }}>Total</label>
              <input type="text" readOnly value={data.cantidadTotal || '0'}
                className="w-full px-4 py-3 rounded-lg text-sm font-bold text-center"
                style={{ background: isDark ? 'rgba(20,83,45,0.2)' : 'rgba(22,163,74,0.08)', border: `1px solid ${isDark ? 'rgba(22,101,52,0.3)' : 'rgba(22,163,74,0.25)'}`, color: isDark ? '#4ade80' : '#166534' }} />
            </div>
          </>
        )}

        {/* Cantidad sin sexo */}
        {!necesitaSexo && data.tipoAve && (
          <div>
            <label className="block text-xs font-medium mb-2" style={{ color: c.textSecondary }}>
              {esVivo || esCatOtro ? 'Cantidad de Jabas' : 'Cantidad Total'}
            </label>
            <input type="number" min="1"
              placeholder={esVivo || esCatOtro ? 'Nº de jabas' : '0'}
              value={data.cantidadTotal || ''}
              onChange={e => actualizarSubForm(data, setData, 'cantidadTotal', e.target.value)}
              className="w-full px-4 py-3 border rounded-lg text-sm"
              style={{ background: c.bgCardAlt, borderColor: c.border, color: c.text }} />
            {(esVivo || esCatOtro) && data.cantidadTotal && (
              <p className="text-[10px] mt-1 flex items-center gap-1" style={{ color: isDark ? '#fbbf24' : '#b45309' }}>
                {esCatOtro ? '🥚' : '🐔'} {data.cantidadTotal} jaba(s){!esCatOtro ? ' se pesarán por bloque en Pesaje' : ''}
              </p>
            )}
          </div>
        )}

        {/* Unidades por Jaba — SOLO cuando es vivo Y hay jabas ingresadas */}
        {esVivo && data.cantidadTotal && parseInt(data.cantidadTotal) > 0 && (
          <div>
            <label className="block text-xs font-medium mb-2 flex items-center gap-1" style={{ color: c.textSecondary }}>
              <Grid3x3 className="w-3 h-3" /> Unidades por Jaba
            </label>
            <input type="number" min="1" placeholder="Ej: 8, 10, 12..."
              value={data.unidadesPorJaba || ''}
              onChange={e => actualizarSubForm(data, setData, 'unidadesPorJaba', e.target.value)}
              className="w-full px-4 py-3 border border-amber-800/30 rounded-lg text-sm focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/20 transition-all"
              style={{ background: c.bgCardAlt, color: c.text }} />
            {data.totalAves && parseInt(data.totalAves) > 0 && (
              <div className="mt-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-between"
                style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)' }}>
                <span style={{ color: c.textSecondary }}>Total aves estimadas</span>
                <span className="font-bold font-mono" style={{ color: isDark ? '#4ade80' : '#166534' }}>🐔 {data.totalAves} unidades</span>
              </div>
            )}
          </div>
        )}

        <button onClick={onSubmit}
          className={`w-full px-4 py-3 ${submitClassName} rounded-xl font-semibold transition-all hover:scale-[1.02] flex items-center justify-center gap-2`}
          style={{ color: c.text }}>
          {submitContent}
        </button>
      </div>
    );
  };

  return (
    <div className="min-h-screen" style={{ color: c.text }}>
      {/* ── Header ─────────────────────────────────────────────── */}
      <div className="mb-8">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
          <div className="space-y-2">
            <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-3" style={{ color: c.text }}>
              <div className="p-3 border rounded-xl backdrop-blur-sm" style={{ background: c.bgCardAlt, borderColor: c.border }}>
                <ShoppingCart className="w-6 h-6 text-amber-400" />
              </div>
              <div>
                <div>Nuevo Pedido</div>
              </div>
            </h1>
            <div className="flex flex-wrap items-center gap-3">
              {[['C001.1', '#166534', 'text-green-400', 'Primer pedido cliente'], ['C001.2', '#b8941e', 'text-amber-400', 'Segundo pedido'], ['C002.1', '#1e3a8a', 'text-blue-400', 'Nuevo cliente']].map(([code, bg, col, label]) => (
                <div key={code} className="flex items-center gap-2 text-sm">
                  <div className={`px-2 py-1 border rounded text-xs font-mono ${col}`} style={{ background: c.bgCardAlt, borderColor: `${bg}50` }}>{code}</div>
                  <span style={{ color: c.textSecondary }}>{label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <div className="border rounded-xl px-4 py-2 flex items-center gap-3" style={{ background: c.bgCardAlt, borderColor: c.border }}>
              <div className="text-center">
                <div className="text-sm" style={{ color: c.textSecondary }}>Clientes únicos</div>
                <div className="text-2xl font-bold" style={{ color: isDark ? '#fbbf24' : '#b45309' }}>{[...new Set(pedidosEnCola.map(p => p.numeroCliente))].length}</div>
              </div>
              <div className="h-8 w-px" style={{ background: c.border }} />
              <div className="text-center">
                <div className="text-sm" style={{ color: c.textSecondary }}>Total pedidos</div>
                <div className="text-2xl font-bold" style={{ color: isDark ? '#4ade80' : '#166534' }}>{pedidosEnCola.reduce((acc, p) => acc + p.subPedidos.length, 0)}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Barra de búsqueda */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <input type="text" placeholder="Buscar pedido por cliente o número..."
              value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border rounded-xl placeholder-gray-500 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/20"
              style={{ background: c.bgInput, borderColor: c.border, color: c.text }} />
            <ShoppingCart className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-amber-400" />
          </div>
        </div>
      </div>

      {/* ── Formularios ─────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        {formularios.map((form, index) => {
          const info = getTipoAveInfo(form.tipoAve);
          const necesitaVariedad = info?.tieneVariedad;
          const necesitaSexo = info?.tieneSexo;
          const presentacionesTipo = form.tipoAve ? getPresentacionesParaFormulario(form.cliente, form.tipoAve, form.variedad || '') : [];
          const formColor = getFormColor(index);
          const esVivo = form.presentacion?.toLowerCase().includes('vivo');
          const esCatOtro = info?.categoria === 'Otro';

          return (
            <div key={form.id} className="border rounded-2xl p-5 relative transition-all duration-300"
              style={{ background: c.bgCardAlt, borderColor: form.completado ? `${formColor}80` : c.border, boxShadow: form.completado ? `0 10px 40px -10px ${formColor}40` : c.shadowMd }}>

              <div className="absolute top-4 right-4 z-10">
                {form.completado
                  ? <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" /><span className="text-xs font-medium" style={{ color: isDark ? '#4ade80' : '#166534' }}>Listo</span></div>
                  : <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-amber-500" /><span className="text-xs" style={{ color: isDark ? '#fbbf24' : '#b45309' }}>En progreso</span></div>}
              </div>

              <div className="mb-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white shadow-lg"
                    style={{ background: `linear-gradient(135deg, ${formColor}, ${formColor}dd)`, border: `1px solid ${formColor}80` }}>
                    {index + 1}
                  </div>
                  <div>
                    <h3 className="font-bold text-lg" style={{ color: c.text }}>Pedido {index + 1}</h3>
                    <p className="text-xs" style={{ color: c.textSecondary }}>Complete los campos</p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                {/* Zona (filtro) */}
                <div>
                  <label className="block text-xs font-medium mb-2 flex items-center gap-2" style={{ color: c.textSecondary }}><MapPin className="w-4 h-4 text-purple-400" /> Zona</label>
                  <select value={zonaFiltros[index]} onChange={e => {
                    const val = e.target.value;
                    setZonaFiltros(prev => { const n = [...prev]; n[index] = val; return n; });
                    // Si el cliente actual no pertenece a la nueva zona, limpiarlo
                    if (val && form.cliente) {
                      const cl = clientesActivos.find(c => c.nombre === form.cliente);
                      if (cl && cl.zona !== val) {
                        actualizarFormulario(form.id, 'cliente', '');
                        setClienteSearches(prev => { const n = [...prev]; n[index] = ''; return n; });
                      }
                    }
                  }}
                    className="w-full px-4 py-3 border rounded-lg text-sm focus:outline-none focus:border-purple-500 transition-all"
                    style={{ background: c.bgCard, borderColor: c.border, color: c.text }}>
                    <option value="" style={{ background: c.bgPage, color: c.text }}>Todas las zonas</option>
                    {zonasDisponibles.map(z => <option key={z} value={z} style={{ background: c.bgPage, color: c.text }}>{z}</option>)}
                  </select>
                </div>

                {/* Cliente (autocompletado) */}
                <div ref={el => { clienteRefs.current[index] = el; }} className="relative">
                  <label className="block text-xs font-medium mb-2 flex items-center gap-2" style={{ color: c.textSecondary }}><Users className="w-4 h-4 text-blue-400" /> Cliente</label>
                  <input type="text"
                    value={clienteSearches[index] || form.cliente}
                    onChange={e => {
                      const val = e.target.value;
                      setClienteSearches(prev => { const n = [...prev]; n[index] = val; return n; });
                      setClienteDropdowns(prev => { const n = [...prev]; n[index] = true; return n; });
                      // Si se borra el texto, limpiar el cliente seleccionado
                      if (!val) actualizarFormulario(form.id, 'cliente', '');
                    }}
                    onFocus={() => setClienteDropdowns(prev => { const n = [...prev]; n[index] = true; return n; })}
                    placeholder="Escriba para buscar cliente..."
                    className="w-full px-4 py-3 border rounded-lg text-sm focus:outline-none focus:border-blue-500 transition-all"
                    style={{ background: c.bgCard, borderColor: c.border, color: c.text }} />
                  {form.cliente && (
                    <button onClick={() => { actualizarFormulario(form.id, 'cliente', ''); setClienteSearches(prev => { const n = [...prev]; n[index] = ''; return n; }); }}
                      className="absolute right-2 top-[34px] p-1 rounded hover:bg-white/10 transition-colors">
                      <X className="w-3.5 h-3.5" style={{ color: c.textMuted }} />
                    </button>
                  )}
                  {clienteDropdowns[index] && !form.cliente && (() => {
                    const filtrados = getClientesFiltrados(index);
                    if (filtrados.length === 0) return (
                      <div className="absolute z-50 w-full mt-1 rounded-lg border shadow-2xl overflow-hidden"
                        style={{ background: isDark ? '#1a1a1a' : '#ffffff', borderColor: c.border, boxShadow: '0 10px 40px rgba(0,0,0,0.5)' }}>
                        <div className="px-4 py-3 text-sm" style={{ color: c.textMuted }}>No se encontraron clientes</div>
                      </div>
                    );
                    return (
                      <div className="absolute z-50 w-full mt-1 rounded-lg border shadow-2xl max-h-48 overflow-y-auto"
                        style={{ background: isDark ? '#1a1a1a' : '#ffffff', borderColor: c.border, boxShadow: '0 10px 40px rgba(0,0,0,0.5)' }}>
                        {filtrados.map(cl => (
                          <button key={cl.id}
                            onClick={() => {
                              actualizarFormulario(form.id, 'cliente', cl.nombre);
                              setClienteSearches(prev => { const n = [...prev]; n[index] = cl.nombre; return n; });
                              setClienteDropdowns(prev => { const n = [...prev]; n[index] = false; return n; });
                            }}
                            className="w-full text-left px-4 py-2.5 text-sm transition-all flex items-center justify-between"
                            style={{ color: c.text, background: isDark ? '#1a1a1a' : '#ffffff', borderBottom: `1px solid ${c.border}` }}
                            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = isDark ? '#2a2a2a' : '#f3f4f6'; }}
                            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = isDark ? '#1a1a1a' : '#ffffff'; }}>
                            <span>{cl.nombre}</span>
                            {cl.zona && <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: 'rgba(168,85,247,0.1)', color: '#a855f7' }}>{cl.zona}</span>}
                          </button>
                        ))}
                      </div>
                    );
                  })()}
                </div>

                {/* Producto */}
                <div>
                  <label className="block text-xs font-medium mb-2 flex items-center gap-2" style={{ color: c.textSecondary }}><Package className="w-4 h-4 text-green-400" /> Producto</label>
                  <select value={form.tipoAve} onChange={e => actualizarFormulario(form.id, 'tipoAve', e.target.value)}
                    className="w-full px-4 py-3 border rounded-lg text-sm focus:outline-none focus:border-green-500 transition-all"
                    style={{ background: c.bgCard, borderColor: c.border, color: c.text }}>
                    <option value="" style={{ background: c.bgPage, color: c.text }}>Seleccionar producto...</option>
                    {getProductosParaCliente(form.cliente).map(t => <option key={t.id} value={t.nombre} style={{ background: c.bgPage, color: c.text }}>{t.nombre}</option>)}
                  </select>
                </div>

                {/* Variedad - filtrada por costos del cliente */}
                {necesitaVariedad && (
                  <div>
                    <label className="block text-xs font-medium mb-2" style={{ color: c.textSecondary }}>Variedad</label>
                    <select value={form.variedad || ''} onChange={e => actualizarFormulario(form.id, 'variedad', e.target.value)}
                      className="w-full px-4 py-3 border rounded-lg text-sm focus:outline-none focus:border-purple-500 transition-all"
                      style={{ background: c.bgCard, borderColor: c.border, color: c.text }}>
                      <option value="" style={{ background: c.bgPage, color: c.text }}>Seleccionar variedad...</option>
                      {getVariedadesParaCliente(form.cliente, form.tipoAve).map((v: string) => <option key={v} value={v} style={{ background: c.bgPage, color: c.text }}>{v}</option>)}
                    </select>
                  </div>
                )}

                {/* Presentación */}
                <div>
                  <label className="block text-xs font-medium mb-2 flex items-center gap-2" style={{ color: c.textSecondary }}><Package className="w-4 h-4 text-amber-400" /> Presentación</label>
                  <select value={form.presentacion} onChange={e => actualizarFormulario(form.id, 'presentacion', e.target.value)}
                    disabled={!form.tipoAve}
                    className="w-full px-4 py-3 border rounded-lg text-sm focus:outline-none focus:border-amber-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ background: c.bgCard, borderColor: c.border, color: c.text }}>
                    <option value="" style={{ background: c.bgPage, color: c.text }}>Seleccionar presentación...</option>
                    {presentacionesTipo.map(p => <option key={p.id} value={p.nombre} style={{ background: c.bgPage, color: c.text }}>{p.nombre}</option>)}
                  </select>
                </div>

                {/* Sexo */}
                {necesitaSexo && (
                  <>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs font-medium mb-2" style={{ color: c.textSecondary }}>{esVivo ? 'Jabas de Machos' : 'Machos'}</label>
                        <input type="number" value={form.cantidadMachos || ''} onChange={e => actualizarFormulario(form.id, 'cantidadMachos', e.target.value)}
                          placeholder="0" min="0" className="w-full px-4 py-3 border rounded-lg text-sm focus:outline-none focus:border-blue-500 transition-all"
                          style={{ background: c.bgCard, borderColor: c.border, color: c.text }} />
                      </div>
                      <div>
                        <label className="block text-xs font-medium mb-2" style={{ color: c.textSecondary }}>{esVivo ? 'Jabas de Hembras' : 'Hembras'}</label>
                        <input type="number" value={form.cantidadHembras || ''} onChange={e => actualizarFormulario(form.id, 'cantidadHembras', e.target.value)}
                          placeholder="0" min="0" className="w-full px-4 py-3 border rounded-lg text-sm focus:outline-none focus:border-pink-500 transition-all"
                          style={{ background: c.bgCard, borderColor: c.border, color: c.text }} />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-2" style={{ color: c.textSecondary }}>Total {esVivo ? '(Jabas)' : ''}</label>
                      <input type="text" value={form.cantidadTotal} readOnly
                        className="w-full px-4 py-3 rounded-lg text-sm font-bold text-center"
                        style={{ background: isDark ? 'rgba(20,83,45,0.2)' : 'rgba(22,163,74,0.08)', border: `1px solid ${isDark ? 'rgba(22,101,52,0.3)' : 'rgba(22,163,74,0.25)'}`, color: isDark ? '#4ade80' : '#166534' }} />
                    </div>
                  </>
                )}

                {/* Cantidad sin sexo */}
                {!necesitaSexo && form.tipoAve && (
                  <div>
                    <label className="block text-xs font-medium mb-2" style={{ color: c.textSecondary }}>
                      {esVivo || esCatOtro ? 'Cantidad de Jabas' : 'Cantidad Total'}
                    </label>
                    <input type="number" value={form.cantidadTotal} onChange={e => actualizarFormulario(form.id, 'cantidadTotal', e.target.value)}
                      placeholder={esVivo || esCatOtro ? 'Nº de jabas' : '0'} min="1"
                      className="w-full px-4 py-3 border rounded-lg text-sm focus:outline-none focus:border-green-500 transition-all"
                      style={{ background: c.bgCard, borderColor: c.border, color: c.text }} />
                    {esVivo && form.cantidadTotal && (
                      <p className="text-[10px] mt-1 flex items-center gap-1" style={{ color: isDark ? '#fbbf24' : '#b45309' }}> {form.cantidadTotal} jaba(s) se pesarán por bloque en Pesaje</p>
                    )}
                  </div>
                )}

                {/* Unidades por Jaba — SOLO vivo con jabas */}
                {esVivo && form.cantidadTotal && parseInt(form.cantidadTotal) > 0 && (
                  <div>
                    <label className="block text-xs font-medium mb-2 flex items-center gap-1" style={{ color: c.textSecondary }}><Grid3x3 className="w-3 h-3" /> Unidades por Jaba</label>
                    <input type="number" value={form.unidadesPorJaba || ''} onChange={e => actualizarFormulario(form.id, 'unidadesPorJaba', e.target.value)}
                      placeholder="Ej: 8, 10, 12..." min="1"
                      className="w-full px-4 py-3 border border-amber-800/30 rounded-lg text-sm focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/20 transition-all"
                      style={{ background: c.bgCard, color: c.text }} />
                    {form.totalAves && parseInt(form.totalAves) > 0 && (
                      <div className="mt-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-between"
                        style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)' }}>
                        <span style={{ color: c.textSecondary }}>Total aves</span>
                        <span className="font-bold font-mono" style={{ color: isDark ? '#4ade80' : '#166534' }}>{form.totalAves} unidades</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="mt-4 pt-3 border-t" style={{ borderColor: c.border }}>
                <div className="text-xs" style={{ color: c.textMuted }}>Cambios guardados automáticamente</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Botones de acción ───────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 mb-8">
        <button onClick={mandarACola}
          className="px-6 py-4 border border-blue-700/30 rounded-xl font-semibold transition-all hover:border-blue-600/50 hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-3 group"
          style={{ background: c.bgCardAlt, color: c.text }}>
          <div className="p-2 bg-blue-900/30 rounded-lg group-hover:bg-blue-900/40 transition-colors"><ShoppingCart className="w-5 h-5 text-blue-400" /></div>
          <span>Enviar a Cola de Pedidos</span>
          <ChevronRight className="w-5 h-5 text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity" />
        </button>

        <button onClick={confirmarPedidos} disabled={pedidosEnCola.length === 0}
          className={`px-6 py-4 rounded-xl font-semibold transition-all hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-3 group border ${pedidosEnCola.length > 0
            ? 'border-amber-700/30 hover:border-amber-600/50'
            : 'cursor-not-allowed'}`}
          style={pedidosEnCola.length > 0
            ? { background: c.bgCardAlt, color: c.text }
            : { background: c.bgCard, borderColor: c.border, color: c.textMuted }}>
          <div className={`p-2 rounded-lg ${pedidosEnCola.length > 0 ? '' : ''}`} style={pedidosEnCola.length > 0 ? { background: isDark ? 'rgba(120,53,15,0.3)' : 'rgba(245,158,11,0.1)' } : { background: isDark ? 'rgba(31,41,55,0.3)' : 'rgba(0,0,0,0.05)' }}>
            <CheckCircle className="w-5 h-5" style={{ color: pedidosEnCola.length > 0 ? (isDark ? '#fbbf24' : '#d97706') : (isDark ? '#4b5563' : '#9ca3af') }} />
          </div>
          <span className="flex items-center gap-2">
            Confirmar Pedidos
            {pedidosEnCola.length > 0 && <span className="px-2 py-1 text-xs rounded-lg" style={{ background: isDark ? 'rgba(120,53,15,0.3)' : 'rgba(245,158,11,0.1)', color: isDark ? '#fcd34d' : '#92400e' }}>{pedidosEnCola.reduce((acc, p) => acc + p.subPedidos.length, 0)}</span>}
          </span>
          {pedidosEnCola.length > 0 && <ChevronRight className="w-5 h-5 opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: isDark ? '#fbbf24' : '#d97706' }} />}
        </button>
      </div>

      {/* ── Cola de Pedidos ─────────────────────────────────────── */}
      {pedidosEnCola.length > 0 && (
        <div className="border rounded-2xl p-5 mb-8" style={{ background: c.bgCardAlt, borderColor: c.border }}>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 border border-amber-700/30 rounded-xl" style={{ background: c.bgCardAlt }}><Layers className="w-6 h-6 text-amber-400" /></div>
              <div>
                <h2 className="text-xl font-bold" style={{ color: c.text }}>Pedidos en Cola</h2>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-sm" style={{ color: c.textSecondary }}>{pedidosEnCola.length} cliente(s) - {pedidosEnCola.reduce((acc, p) => acc + p.subPedidos.length, 0)} pedidos</span>
                  <div className="w-1 h-1 rounded-full" style={{ background: c.border }} />
                  <span className="text-sm font-medium" style={{ color: isDark ? '#fbbf24' : '#b45309' }}>Listos para confirmar</span>
                </div>
              </div>
            </div>
            <div className="px-3 py-1 border rounded-lg" style={{ background: isDark ? 'rgba(120,53,15,0.2)' : 'rgba(245,158,11,0.1)', borderColor: isDark ? 'rgba(180,83,9,0.3)' : 'rgba(245,158,11,0.3)' }}>
              <span className="text-sm font-medium" style={{ color: isDark ? '#fbbf24' : '#b45309' }}>Total: {pedidosEnCola.length}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {pedidosEnCola
              .filter(p => !searchTerm || p.cliente.toLowerCase().includes(searchTerm.toLowerCase()) || p.numeroPedido.toLowerCase().includes(searchTerm.toLowerCase()))
              .map(pedido => (
                <div key={pedido.id} className="border rounded-xl p-4 transition-all group relative overflow-hidden"
                  style={{ background: c.bgCard, borderColor: c.border }}>
                  <button onClick={() => eliminarDeCola(pedido.id)}
                    className="absolute top-3 right-3 w-8 h-8 rounded-full bg-red-900/20 border border-red-700/30 flex items-center justify-center transition-all hover:bg-red-900/30 hover:scale-110 z-10">
                    <X className="w-4 h-4 text-red-400" />
                  </button>

                  <div className="mb-4">
                    <div className="flex items-center gap-2 mb-2"><Users className="w-4 h-4 text-blue-400" /><span className="text-xs" style={{ color: c.textSecondary }}>Cliente</span></div>
                    <p className="font-medium truncate" style={{ color: c.text }}>{pedido.cliente}</p>
                    <p className="text-xs text-blue-400 font-mono mt-1">{pedido.numeroPedido}</p>
                  </div>

                  <div className="mb-4">
                    <div className="flex items-center gap-2 mb-2"><Package className="w-4 h-4 text-green-400" /><span className="text-xs" style={{ color: c.textSecondary }}>Sub-pedidos</span></div>
                    <div className="flex items-center gap-3">
                      <div className="text-2xl font-bold" style={{ color: isDark ? '#4ade80' : '#166534' }}>{pedido.subPedidos.length}</div>
                      <div className="flex-1">
                        <div className="h-2 rounded-full overflow-hidden" style={{ background: c.bgCardAlt }}>
                          <div className="h-full bg-gradient-to-r from-green-600 to-amber-500 rounded-full" style={{ width: `${Math.min(100, (pedido.subPedidos.length / 10) * 100)}%` }} />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Mini preview */}
                  <div className="space-y-1 mb-3">
                    {pedido.subPedidos.slice(0, 2).map(sub => {
                      const esVivo = sub.presentacion?.toLowerCase().includes('vivo');
                      return (
                        <div key={sub.id} className="text-[10px] px-2 py-1 rounded truncate"
                          style={{ color: c.textSecondary, background: c.bgCard }}>
                          {sub.tipoAve} · {sub.presentacion}
                          {esVivo && sub.totalAves ? ` · 🐔 ${sub.totalAves} aves`
                            : esVivo && sub.cantidadTotal ? ` · 🧺 ${sub.cantidadTotal} jabas`
                              : sub.cantidadTotal ? ` · ${sub.cantidadTotal}` : ''}
                        </div>
                      );
                    })}
                    {pedido.subPedidos.length > 2 && <p className="text-[10px] text-center" style={{ color: c.textMuted }}>+{pedido.subPedidos.length - 2} más...</p>}
                  </div>

                  <Dialog>
                    <DialogTrigger asChild>
                      <button onClick={() => abrirDetalle(pedido)}
                        className="w-full px-4 py-2.5 border rounded-lg font-medium transition-all hover:scale-[1.02] flex items-center justify-center gap-2 group"
                        style={{ background: c.bgCardAlt, borderColor: c.border, color: c.text }}>
                        <Eye className="w-4 h-4" /> Ver / Editar
                        <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </button>
                    </DialogTrigger>

                    <DialogContent className="sm:max-w-[600px] max-h-[88vh] overflow-y-auto border rounded-2xl overflow-hidden"
                      style={{ background: c.bgModal, borderColor: c.border }}>
                      <DialogHeader className="p-6 border-b" style={{ borderColor: c.border }}>
                        <DialogTitle className="text-xl flex items-center gap-3" style={{ color: c.text }}>
                          <div className="p-2 border border-amber-700/30 rounded-lg" style={{ background: c.bgCardAlt }}><Users className="w-5 h-5 text-amber-400" /></div>
                          <div>
                            <div>Detalle del Pedido</div>
                            <div className="text-sm font-normal" style={{ color: c.textSecondary }}>
                              {pedidoSeleccionado?.cliente} · {pedidoSeleccionado?.numeroPedido}
                            </div>
                          </div>
                        </DialogTitle>
                      </DialogHeader>

                      {pedidoSeleccionado && (
                        <div className="p-6 space-y-6">
                          {/* Sub-pedidos existentes */}
                          <div>
                            <h3 className="text-lg font-bold flex items-center gap-2 mb-4" style={{ color: c.text }}>
                              <Layers className="w-5 h-5 text-amber-400" /> Sub-pedidos ({pedidoSeleccionado.subPedidos.length})
                            </h3>
                            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                              {pedidoSeleccionado.subPedidos.map((sub, idx) => {
                                const esEditandoEste = editandoSubId === sub.id;
                                const esVivo = sub.presentacion?.toLowerCase().includes('vivo');
                                return (
                                  <div key={sub.id} className={`border rounded-xl transition-all ${esEditandoEste ? 'border-amber-700/40 bg-amber-900/10' : ''}`}
                                    style={!esEditandoEste ? { borderColor: c.border, background: c.bgCard } : {}}>
                                    {esEditandoEste ? (
                                      <div className="p-4">
                                        <div className="flex items-center justify-between mb-3">
                                          <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                                            <Edit2 className="w-3 h-3" /> Editando sub-pedido #{idx + 1}
                                          </span>
                                          <button onClick={() => setEditandoSubId(null)} className="p-1 hover:text-gray-300" style={{ color: c.textMuted }}>
                                            <X className="w-3.5 h-3.5" />
                                          </button>
                                        </div>
                                        {renderSubForm(
                                          editandoSubData,
                                          setEditandoSubData,
                                          guardarEdicion,
                                          <><Save className="w-4 h-4" /> Guardar cambios</>,
                                          'bg-gradient-to-r from-amber-900/40 to-green-900/40 border border-amber-700/30 hover:from-amber-900/50 hover:to-green-900/50',
                                          pedido.cliente
                                        )}
                                      </div>
                                    ) : (
                                      <div className="p-4 flex justify-between items-start">
                                        <div className="flex items-start gap-3 flex-1 min-w-0">
                                          <div className="w-8 h-8 rounded-lg border border-blue-700/30 flex items-center justify-center shrink-0" style={{ background: c.bgCardAlt }}>
                                            <span className="text-sm font-bold text-blue-400">#{idx + 1}</span>
                                          </div>
                                          <div className="flex-1 min-w-0">
                                            <div className="font-medium truncate" style={{ color: c.text }}>
                                              {sub.tipoAve}{sub.variedad ? ` - ${sub.variedad}` : ''}
                                            </div>
                                            <div className="text-xs flex items-center gap-2 mt-1" style={{ color: c.textSecondary }}>
                                              <Package className="w-3 h-3" /> {sub.presentacion}
                                            </div>
                                            <div className="flex flex-wrap gap-1.5 mt-2">
                                              {(sub.cantidadMachos || sub.cantidadHembras) ? (
                                                <>
                                                  <span className="text-[10px] px-2 py-0.5 rounded border" style={{ background: isDark ? 'rgba(30,58,138,0.2)' : 'rgba(59,130,246,0.1)', borderColor: isDark ? 'rgba(29,78,216,0.2)' : 'rgba(59,130,246,0.25)', color: isDark ? '#93c5fd' : '#1d4ed8' }}>♂ {sub.cantidadMachos || 0}</span>
                                                  <span className="text-[10px] px-2 py-0.5 rounded border" style={{ background: isDark ? 'rgba(131,24,67,0.2)' : 'rgba(236,72,153,0.1)', borderColor: isDark ? 'rgba(190,24,93,0.2)' : 'rgba(236,72,153,0.25)', color: isDark ? '#f9a8d4' : '#be185d' }}>♀ {sub.cantidadHembras || 0}</span>
                                                  <span className="text-[10px] px-2 py-0.5 rounded border" style={{ background: isDark ? 'rgba(20,83,45,0.2)' : 'rgba(22,163,74,0.1)', borderColor: isDark ? 'rgba(21,128,61,0.2)' : 'rgba(22,163,74,0.25)', color: isDark ? '#86efac' : '#166534' }}>Total: {sub.cantidadTotal}</span>
                                                </>
                                              ) : esVivo ? (
                                                <>
                                                  <span className="text-[10px] px-2 py-0.5 rounded border" style={{ background: isDark ? 'rgba(120,53,15,0.2)' : 'rgba(245,158,11,0.1)', borderColor: isDark ? 'rgba(180,83,9,0.2)' : 'rgba(245,158,11,0.25)', color: isDark ? '#fcd34d' : '#92400e' }}>🧺 {sub.cantidadTotal} jabas</span>
                                                  {sub.unidadesPorJaba && <span className="text-[10px] px-2 py-0.5 rounded border" style={{ background: c.bgCardAlt, borderColor: c.border, color: c.textSecondary }}>×{sub.unidadesPorJaba}/jaba</span>}
                                                  {sub.totalAves && <span className="text-[10px] px-2 py-0.5 rounded border font-bold" style={{ background: isDark ? 'rgba(20,83,45,0.2)' : 'rgba(22,163,74,0.1)', borderColor: isDark ? 'rgba(21,128,61,0.2)' : 'rgba(22,163,74,0.25)', color: isDark ? '#86efac' : '#166534' }}>🐔 {sub.totalAves} aves</span>}
                                                </>
                                              ) : (
                                                <span className="text-[10px] px-2 py-0.5 rounded border" style={{ background: isDark ? 'rgba(20,83,45,0.2)' : 'rgba(22,163,74,0.1)', borderColor: isDark ? 'rgba(21,128,61,0.2)' : 'rgba(22,163,74,0.25)', color: isDark ? '#86efac' : '#166534' }}>{sub.cantidadTotal} unidades</span>
                                              )}
                                            </div>
                                          </div>
                                        </div>
                                        <div className="flex flex-col gap-1 shrink-0 ml-2">
                                          <button onClick={() => iniciarEdicion(sub)} title="Editar"
                                            className="p-1.5 hover:bg-amber-900/20 rounded-lg transition-colors">
                                            <Edit2 className="w-4 h-4 text-amber-400" />
                                          </button>
                                          <button onClick={() => eliminarSubPedido(sub.id)} title="Eliminar"
                                            className="p-1.5 hover:bg-red-900/20 rounded-lg transition-colors">
                                            <X className="w-4 h-4 text-red-400" />
                                          </button>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>

                          {/* Agregar nuevo sub-pedido */}
                          {!editandoSubId && (
                            <div className="border rounded-xl p-5" style={{ background: c.bgCard, borderColor: c.border }}>
                              <h3 className="text-lg font-bold mb-4 flex items-center gap-2" style={{ color: c.text }}>
                                <Plus className="w-5 h-5 text-green-400" /> Agregar Otro Pedido
                              </h3>
                              {renderSubForm(
                                nuevoSubPedido,
                                setNuevoSubPedido,
                                agregarSubPedidoAlPedido,
                                <><Plus className="w-5 h-5" /> Agregar Sub-Pedido</>,
                                'bg-gradient-to-r from-green-900/30 to-amber-900/30 border border-green-700/30 hover:from-green-900/40 hover:to-amber-900/40 hover:border-green-600/40',
                                pedido.cliente
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </DialogContent>
                  </Dialog>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}