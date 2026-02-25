import { useState, useEffect, useRef } from 'react';
import {
  FileSpreadsheet, DollarSign, Scale, Package, Save, Edit3,
  CheckCircle, Calendar, Download, RefreshCw, Search,
  ChevronDown, ChevronUp, TrendingUp, AlertTriangle,
  ChevronLeft, ChevronRight
} from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

// ─── INTERFACES ───────────────────────────────────────────────────────────────
interface FilaCartera {
  id: string; pedidoId: string; cliente: string; tipo: string;
  presentacion: string; cantidad: number; cantidadLabel: string;
  merma: number; tara: number; contenedorTipo: string;
  devolucionPeso: number; devolucionCantidad: number;
  repesada: number; adicionPeso: number;
  pesoPedido: number; pesoContenedor: number; pesoBruto: number;
  pesoNeto: number; precio: number; total: number;
  confirmado: boolean; editando: boolean; fecha: string;
  zona: string; conductor: string;
}
interface PedidoPesajeData {
  id: string; numeroPedido: string; cliente: string; producto: string;
  cantidad: number; cantidadJabas?: number; presentacion: string;
  contenedor: string; pesoContenedores?: number; pesoBruto?: number;
  conductor?: any; fechaPesaje?: string;
  cantidadMachos?: number; cantidadHembras?: number; variedad?: string;
}

// ─── TOKENS ───────────────────────────────────────────────────────────────────
const GOLD = '#ccaa00';
const G30  = 'rgba(204,170,0,0.30)';
const G20  = 'rgba(204,170,0,0.20)';
const G15  = 'rgba(204,170,0,0.15)';
const G10  = 'rgba(204,170,0,0.10)';
const G08  = 'rgba(204,170,0,0.08)';
const G06  = 'rgba(204,170,0,0.06)';
const G04  = 'rgba(204,170,0,0.04)';

const COL = {
  pedido:     '#22c55e',
  contenedor: '#fca5a5',
  bruto:      '#fcd34d',
  merma:      '#e2e8f0',
  devolucion: '#f87171',
  repesada:   '#38bdf8',   // sky-400
  adicion:    '#a3e635',   // lime-400
  neto:       '#22d3ee',
  total:      '#fbbf24',
  tipo:       '#6ee7b7',
  zona:       '#d8b4fe',
};

// ─── HELPERS ──────────────────────────────────────────────────────────────────
const hoyStr    = () => new Date().toISOString().split('T')[0];
const addDays   = (dateStr: string, n: number) => {
  const d = new Date(dateStr); d.setDate(d.getDate() + n);
  return d.toISOString().split('T')[0];
};
const fmtDate   = (dateStr: string) => new Date(dateStr + 'T00:00:00').toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' });

// ─── SKELETON ─────────────────────────────────────────────────────────────────
const Shimmer = ({ className = '' }: { className?: string }) => (
  <div className={`relative overflow-hidden rounded ${className}`} style={{ background: G06 }}>
    <motion.div className="absolute inset-0"
      style={{ background: `linear-gradient(90deg,transparent,${G15},transparent)` }}
      animate={{ x: ['-100%', '100%'] }}
      transition={{ duration: 1.4, repeat: Infinity, ease: 'linear' }} />
  </div>
);
const SkeletonView = () => (
  <div className="space-y-4">
    <div className="flex justify-between items-center">
      <div className="flex items-center gap-3">
        <Shimmer className="w-11 h-11 rounded-xl" />
        <div className="space-y-2"><Shimmer className="h-6 w-48" /><Shimmer className="h-3 w-56" /></div>
      </div>
      <div className="flex gap-2">
        <Shimmer className="h-9 w-32 rounded-xl" /><Shimmer className="h-9 w-20 rounded-xl" /><Shimmer className="h-9 w-16 rounded-xl" />
      </div>
    </div>
    <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
      {[...Array(5)].map((_,i) => (
        <div key={i} className="rounded-xl p-3 space-y-2" style={{ background:'rgba(0,0,0,0.3)', border:`1px solid ${G15}` }}>
          <div className="flex justify-between"><Shimmer className="h-2.5 w-16" /><Shimmer className="h-4 w-4 rounded" /></div>
          <Shimmer className="h-6 w-20" />
        </div>
      ))}
    </div>
    <div className="flex justify-between gap-3">
      <Shimmer className="h-9 flex-1 rounded-xl" />
      <div className="flex gap-2"><Shimmer className="h-9 w-24 rounded-xl" /><Shimmer className="h-9 w-28 rounded-xl" /></div>
    </div>
    <Shimmer className="h-10 w-full rounded-xl" />
    <div className="rounded-xl overflow-hidden" style={{ border:`1px solid ${G20}` }}>
      <div className="px-4 py-2.5 flex justify-between" style={{ background:G06 }}>
        <Shimmer className="h-4 w-44" /><Shimmer className="h-5 w-16 rounded-full" />
      </div>
      <table className="w-full" style={{ minWidth:'1400px' }}>
        <thead><tr style={{ background:G04 }}>
          {[...Array(16)].map((_,i) => <th key={i} className="px-2 py-2"><Shimmer className="h-2.5 w-14" /></th>)}
        </tr></thead>
        <tbody>
          {[...Array(5)].map((_,i) => (
            <tr key={i} style={{ borderBottom:`1px solid ${G06}`, opacity: 1 - i*0.15 }}>
              {[...Array(16)].map((_,j) => <td key={j} className="px-2 py-2"><Shimmer className="h-6 w-full" /></td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

// ─── COMPONENT ────────────────────────────────────────────────────────────────
export function DashboardSecretaria() {
  const context = useApp();
  const { costosClientes, presentaciones, clientes, tiposAve } = context;
  const pedidosConfirmados = context.pedidosConfirmados || [];

  const [filasCartera, setFilasCartera]           = useState<FilaCartera[]>([]);
  const [loading, setLoading]                     = useState(true);
  const [initialLoad, setInitialLoad]             = useState(true);
  const [fechaSeleccionada, setFechaSeleccionada] = useState(hoyStr());
  const [busqueda, setBusqueda]                   = useState('');
  const [editandoAll, setEditandoAll]             = useState(false);
  const [sortColumn, setSortColumn]               = useState('');
  const [sortDir, setSortDir]                     = useState<'asc'|'desc'>('asc');
  const [confirmModal, setConfirmModal]           = useState<{open:boolean;filaId:string|null;cliente:string}>({open:false,filaId:null,cliente:''});
  const [hoveredRow, setHoveredRow]               = useState<string|null>(null);
  const [showCal, setShowCal]                     = useState(false);
  const [statsCollapsed, setStatsCollapsed]       = useState(true);
  const calRef                                    = useRef<HTMLDivElement>(null);

  // cerrar calendario si click fuera
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (calRef.current && !calRef.current.contains(e.target as Node)) setShowCal(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const storageKey = (f: string) => `carteraCobro_${f}`;

  useEffect(() => {
    const t = setTimeout(() => setInitialLoad(false), 1600);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    setLoading(true);
    try {
      const data = localStorage.getItem(storageKey(fechaSeleccionada));
      if (data) {
        const parsed = JSON.parse(data);
        const migrados = parsed.map((f: any) => ({
          ...f,
          repesada: f.repesada ?? 0,
          merma: f.merma ?? 0,
          devolucionPeso: f.devolucionPeso ?? 0,
          adicionPeso: f.adicionPeso ?? 0,
          pesoNeto: f.pesoNeto ?? 0,
          precio: f.precio ?? 0,
          total: f.total ?? 0,
          pesoPedido: f.pesoPedido ?? 0,
          pesoBruto: f.pesoBruto ?? 0,
          pesoContenedor: f.pesoContenedor ?? 0,
        }));
        setFilasCartera(migrados);
      } else {
        generarDesdePesajeControl();
      }
    } catch (e) {
      console.error(e);
      setFilasCartera([]);
    } finally {
      setLoading(false);
    }
  }, [fechaSeleccionada, pedidosConfirmados]);

  function generarDesdePesajeControl() {
    try {
      const delDia = (pedidosConfirmados || []).filter(p => 
        p.ticketEmitido && p.fechaPesaje === fechaSeleccionada
      );

      if (delDia.length === 0) { 
        setFilasCartera([]); 
        return; 
      }

      const nuevasFilas: FilaCartera[] = delDia.map(p => {
        const esVivo = p.presentacion?.toLowerCase().includes('vivo');
        const cantidadDisplay = p.cantidad;
        const cantidadLabel = esVivo ? `${p.cantidadJabas || 0} jabas` : 'unids';

        // Calcular merma por presentación (con variedad y sexo específicos)
        const tipoAveBase = p.tipoAve?.replace(/\s*\(M:\d+,\s*H:\d+\)/, '') || '';
        
        // Intentar match específico por variedad/sexo, luego general
        let pres = presentaciones.find(pr => 
          pr.tipoAve.toLowerCase() === tipoAveBase.toLowerCase() && 
          pr.nombre.toLowerCase() === p.presentacion?.toLowerCase() &&
          (p.variedad ? pr.variedad === p.variedad : !pr.variedad) &&
          (p.sexo ? pr.sexo === p.sexo : !pr.sexo)
        );
        // Fallback: match solo por variedad
        if (!pres && p.variedad) {
          pres = presentaciones.find(pr => 
            pr.tipoAve.toLowerCase() === tipoAveBase.toLowerCase() && 
            pr.nombre.toLowerCase() === p.presentacion?.toLowerCase() &&
            pr.variedad === p.variedad
          );
        }
        // Fallback: match general por tipo/presentacion
        if (!pres) {
          pres = presentaciones.find(pr => 
            pr.tipoAve.toLowerCase() === tipoAveBase.toLowerCase() && 
            pr.nombre.toLowerCase() === p.presentacion?.toLowerCase()
          );
        }

        const mermaPorUnidad = pres?.mermaKg || 0;
        const mermaTotal = mermaPorUnidad * p.cantidad;

        const pesoContenedor = p.pesoTotalContenedores || 0;
        const pesoBruto = p.pesoBrutoTotal || 0;
        // Devolución y repesada del conductor
        const devolucionFromConductor = p.pesoDevolucion || 0;
        const repesadaFromConductor = p.pesoRepesada || 0;
        // Fórmula: Peso Neto = (Base + Merma) - Peso Contenedor - Devoluciones
        // Si hay repesada, usar repesada como base en vez de pesoBruto
        const base = repesadaFromConductor > 0 ? repesadaFromConductor : pesoBruto;
        const pesoNeto = (base + mermaTotal) - pesoContenedor - devolucionFromConductor;
        const pesoPedido = pesoBruto - pesoContenedor;

        // LÓGICA DE PRECIO AUTO-RELLENABLE (Segunda petición del usuario)
        let precio = 0;
        const clienteObj = clientes.find(c => c.nombre === p.cliente);
        const tipoAveObj = tiposAve.find(t => t.nombre === tipoAveBase);

        if (clienteObj && tipoAveObj) {
          // Buscamos costos específicos del cliente para este tipo de ave
          const costosDelCliente = costosClientes.filter(cc => 
            cc.clienteId === clienteObj.id && 
            cc.tipoAveId === tipoAveObj.id
          );

          // Buscar por variedad y sexo específicos
          const variedadBuscada = p.variedad || 'Mixto';
          const sexoBuscado = p.sexo;
          
          // 1. Match exacto por variedad + sexo
          let costoEncontrado = costosDelCliente.find(cc => 
            (cc.variedad === variedadBuscada || (!cc.variedad && variedadBuscada === 'Mixto')) &&
            (sexoBuscado ? cc.sexo === sexoBuscado : true)
          );

          // 2. Match por variedad solamente
          if (!costoEncontrado) {
            costoEncontrado = costosDelCliente.find(cc => 
              cc.variedad === variedadBuscada || (!cc.variedad && variedadBuscada === 'Mixto')
            );
          }

          // 3. Fallback: primer costo del cliente para ese ave
          if (!costoEncontrado) {
            costoEncontrado = costosDelCliente[0];
          }

          if (costoEncontrado) {
            const presNorm = p.presentacion?.toLowerCase();
            // Selección inteligente del precio según presentación de CostosClientes.tsx
            if (presNorm.includes('vivo')) {
              precio = costoEncontrado.precioVivo || costoEncontrado.precioPorKg || 0;
            } else if (presNorm.includes('pelado')) {
              precio = costoEncontrado.precioPelado || costoEncontrado.precioPorKg || 0;
            } else if (presNorm.includes('destripado')) {
              precio = costoEncontrado.precioDestripado || costoEncontrado.precioPorKg || 0;
            } else {
              precio = costoEncontrado.precioPorKg || 0;
            }
          }
        }

        const total = pesoNeto * precio;

        return {
          id: p.id,
          pedidoId: p.numeroPedido || p.id,
          cliente: p.cliente,
          tipo: p.tipoAve + (p.variedad ? ` (${p.variedad})` : ''),
          presentacion: p.presentacion,
          cantidad: cantidadDisplay,
          cantidadLabel,
          merma: mermaTotal,
          tara: pesoContenedor, // Mostramos la tara del contenedor aquí también
          contenedorTipo: p.contenedor,
          devolucionPeso: devolucionFromConductor,
          devolucionCantidad: 0,
          repesada: repesadaFromConductor,
          adicionPeso: 0,
          pesoPedido: Math.max(0, pesoPedido),
          pesoContenedor,
          pesoBruto: pesoBruto,
          pesoNeto: Math.max(0, pesoNeto),
          precio,
          total: Math.max(0, total),
          confirmado: false,
          editando: false,
          fecha: fechaSeleccionada,
          zona: p.zonaEntrega || '—',
          conductor: p.conductor || '—',
        };
      });

      setFilasCartera(nuevasFilas);
    } catch (error) {
      console.error('Error generando cartera:', error);
      setFilasCartera([]);
    }
  }

  useEffect(() => {
    if (filasCartera.length>0)
      localStorage.setItem(storageKey(fechaSeleccionada), JSON.stringify(filasCartera));
  }, [filasCartera, fechaSeleccionada]);

  // Recalcular: Peso Neto = (Peso Bruto + Merma) - Peso Contenedor - Devoluciones
  // Si hay repesada, usarla en lugar de pesoBruto
  // Total = Peso Neto × Precio
  const recalcularFila = (f: FilaCartera): FilaCartera => {
    const base    = f.repesada > 0 ? f.repesada : f.pesoBruto;
    const pesoNeto= (base + f.merma) - f.pesoContenedor - f.devolucionPeso + f.adicionPeso;
    return { ...f, pesoNeto: Math.max(0,pesoNeto), total: Math.max(0,pesoNeto)*f.precio };
  };

  const actualizarCampo = (id:string, campo:keyof FilaCartera, valor:any) =>
    setFilasCartera(prev=>prev.map(f=>f.id!==id?f:recalcularFila({...f,[campo]:valor})));

  const confirmarFila = (id:string) => {
    const fila = filasCartera.find(f=>f.id===id);
    if (fila) setConfirmModal({open:true,filaId:id,cliente:fila.cliente});
  };
  const ejecutarConfirm = () => {
    if (!confirmModal.filaId) return;
    setFilasCartera(prev=>prev.map(f=>f.id===confirmModal.filaId?{...f,confirmado:true,editando:false}:f));
    toast.success(`Boleta emitida — ${confirmModal.cliente}`);
    setConfirmModal({open:false,filaId:null,cliente:''});
  };
  const editarFila     = (id:string) =>
    setFilasCartera(prev=>prev.map(f=>f.id===id?{...f,editando:true,confirmado:false}:f));
  const confirmarTodas = () => { setFilasCartera(prev=>prev.map(f=>({...f,confirmado:true,editando:false}))); setEditandoAll(false); toast.success('Todas confirmadas'); };
  const editarTodas    = () => { setFilasCartera(prev=>prev.map(f=>({...f,editando:true,confirmado:false}))); setEditandoAll(true); };
  const refrescar      = () => { setLoading(true); setTimeout(()=>{ generarDesdePesajeControl(); setLoading(false); toast.success('Actualizado'); },400); };
  const irDia          = (n:number) => setFechaSeleccionada(prev=>addDays(prev,n));

  const exportarCSV = () => {
    const headers=['Cliente','Tipo','Pres','Cant','P.Pedido','P.Cont','P.Bruto','Repesada','Merma','Devol','Adicion','P.Neto','Precio','Total','Zona','Conductor'];
    const rows=filasFiltradas.map(f=>[f.cliente,f.tipo,f.presentacion,`${f.cantidad} ${f.cantidadLabel}`,f.pesoPedido.toFixed(2),f.pesoContenedor.toFixed(2),f.pesoBruto.toFixed(2),f.repesada.toFixed(2),f.merma.toFixed(2),f.devolucionPeso.toFixed(2),f.adicionPeso.toFixed(2),f.pesoNeto.toFixed(2),f.precio.toFixed(2),f.total.toFixed(2),f.zona,f.conductor]);
    const blob=new Blob([[headers.join(','),...rows.map(r=>r.join(','))].join('\n')],{type:'text/csv'});
    Object.assign(document.createElement('a'),{href:URL.createObjectURL(blob),download:`cartera_${fechaSeleccionada}.csv`}).click();
  };

  const filasFiltradas  = filasCartera.filter(f=>!busqueda||[f.cliente,f.tipo,f.conductor].some(s=>s.toLowerCase().includes(busqueda.toLowerCase())));
  const filasOrdenadas  = [...filasFiltradas].sort((a,b)=>{ if(!sortColumn)return 0; const va=(a as any)[sortColumn],vb=(b as any)[sortColumn]; return va<vb?(sortDir==='asc'?-1:1):va>vb?(sortDir==='asc'?1:-1):0; });
  const handleSort      = (col:string) => { if(sortColumn===col)setSortDir(d=>d==='asc'?'desc':'asc'); else{setSortColumn(col);setSortDir('asc');} };

  const tot = (key: keyof FilaCartera) => filasOrdenadas.reduce((s,f)=>s+(f[key] as number||0),0);

  const totalVentas         = tot('total');
  const totalPesoPedido     = tot('pesoPedido');
  const totalPesoContenedor = tot('pesoContenedor');
  const totalPesoBruto      = tot('pesoBruto');
  const totalPesoNeto       = tot('pesoNeto');

  // ─── EditInput — tipo texto, sin flechas, directo ─────────────────────────
  const EditInput = ({ value, onChange, disabled=false, color=COL.merma }: {
    value:number; onChange:(v:number)=>void; disabled?:boolean; color?:string;
  }) => {
    const [local, setLocal] = useState(value.toFixed(2));
    useEffect(()=>{ setLocal(value.toFixed(2)); },[value]);
    return (
      <input
        type="text"
        inputMode="decimal"
        value={local}
        onChange={e=>setLocal(e.target.value)}
        onBlur={e=>{ const n=parseFloat(e.target.value); if(!isNaN(n)) onChange(n); else setLocal(value.toFixed(2)); }}
        onKeyDown={e=>{ if(e.key==='Enter'){ const n=parseFloat(local); if(!isNaN(n)) onChange(n); (e.target as HTMLInputElement).blur(); } }}
        disabled={disabled}
        style={disabled
          ? { background:'transparent', border:'1px solid transparent', color:'#4b5563', cursor:'default', width:'100%', padding:'3px 6px', borderRadius:6, textAlign:'right', fontSize:12, fontFamily:'ui-monospace,monospace' }
          : { background:'rgba(20,17,5,0.9)', border:`1px solid ${G30}`, color, width:'100%', padding:'3px 6px', borderRadius:6, textAlign:'right', fontSize:12, fontFamily:'ui-monospace,monospace', outline:'none' }
        }
        onFocus={e=>{ if(!disabled) e.target.style.borderColor=GOLD; }}
        onBlurCapture={e=>{ if(!disabled) e.target.style.borderColor=G30; }}
      />
    );
  };

  // ─── Mini Calendar ────────────────────────────────────────────────────────
  const MiniCal = () => {
    const [calMonth, setCalMonth] = useState(() => {
      const d = new Date(fechaSeleccionada+'T00:00:00');
      return { year: d.getFullYear(), month: d.getMonth() };
    });
    const { year, month } = calMonth;
    const firstDay  = new Date(year, month, 1).getDay(); // 0=Sun
    const daysInMonth = new Date(year, month+1, 0).getDate();
    const prevMonth = () => setCalMonth(p => p.month===0 ? {year:p.year-1,month:11} : {year:p.year,month:p.month-1});
    const nextMonth = () => setCalMonth(p => p.month===11 ? {year:p.year+1,month:0} : {year:p.year,month:p.month+1});
    const monthName = new Date(year,month,1).toLocaleDateString('es-ES',{month:'long',year:'numeric'});
    const today     = hoyStr();

    const cells: (number|null)[] = [];
    for(let i=0;i<firstDay;i++) cells.push(null);
    for(let d=1;d<=daysInMonth;d++) cells.push(d);

    const selectDay = (day:number) => {
      const str = `${year}-${String(month+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
      setFechaSeleccionada(str);
      setShowCal(false);
    };

    return (
      <motion.div ref={calRef}
        initial={{opacity:0,y:-8,scale:0.96}} animate={{opacity:1,y:0,scale:1}} exit={{opacity:0,y:-8,scale:0.96}}
        transition={{duration:0.18}}
        className="absolute top-full mt-2 z-50 rounded-xl overflow-hidden shadow-2xl"
        style={{background:'rgba(12,10,3,0.98)', border:`1px solid ${G30}`, minWidth:260, right:0}}>
        {/* cal header */}
        <div className="flex items-center justify-between px-4 py-3" style={{borderBottom:`1px solid ${G15}`}}>
          <button onClick={prevMonth} className="p-1 rounded-lg hover:bg-white/5 transition-colors">
            <ChevronLeft className="w-4 h-4 text-gray-400" />
          </button>
          <span className="text-sm font-bold capitalize" style={{color:GOLD}}>{monthName}</span>
          <button onClick={nextMonth} className="p-1 rounded-lg hover:bg-white/5 transition-colors">
            <ChevronRight className="w-4 h-4 text-gray-400" />
          </button>
        </div>
        {/* day names */}
        <div className="grid grid-cols-7 px-3 pt-2 pb-1">
          {['D','L','M','X','J','V','S'].map(d=>(
            <div key={d} className="text-center text-[10px] font-bold text-gray-600 py-1">{d}</div>
          ))}
        </div>
        {/* days */}
        <div className="grid grid-cols-7 px-3 pb-3 gap-y-0.5">
          {cells.map((day,i) => {
            if (!day) return <div key={i} />;
            const str = `${year}-${String(month+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
            const isSelected = str === fechaSeleccionada;
            const isToday    = str === today;
            const isFuture   = str > today;
            return (
              <button key={i} onClick={()=>!isFuture&&selectDay(day)}
                disabled={isFuture}
                className="w-8 h-8 mx-auto rounded-lg text-xs font-semibold transition-all flex items-center justify-center"
                style={isSelected
                  ? {background:GOLD, color:'#000', fontWeight:900}
                  : isToday
                    ? {background:G15, color:GOLD, border:`1px solid ${G30}`}
                    : isFuture
                      ? {color:'#2d2d2d', cursor:'not-allowed'}
                      : {color:'#9ca3af', cursor:'pointer'}
                }
                onMouseEnter={e=>{ if(!isSelected&&!isFuture) (e.target as HTMLElement).style.background=G10; }}
                onMouseLeave={e=>{ if(!isSelected&&!isFuture) (e.target as HTMLElement).style.background='transparent'; }}
              >
                {day}
              </button>
            );
          })}
        </div>
        {/* quick shortcuts */}
        <div className="flex gap-2 px-3 pb-3">
          {['Hoy','Ayer','Ant.'].map((label,i)=>{
            const str = addDays(today, -i);
            return (
              <button key={label} onClick={()=>{ setFechaSeleccionada(str); setShowCal(false); }}
                className="flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all"
                style={fechaSeleccionada===str
                  ? {background:GOLD, color:'#000'}
                  : {background:G08, border:`1px solid ${G15}`, color:GOLD}
                }>
                {label}
              </button>
            );
          })}
        </div>
      </motion.div>
    );
  };

  if (initialLoad) return <SkeletonView />;

  const esHoy = fechaSeleccionada === hoyStr();

  return (
    <motion.div initial={{opacity:0}} animate={{opacity:1}} transition={{duration:0.3}}
      className="space-y-4">

      {/* HEADER */}
      <motion.div initial={{y:-10,opacity:0}} animate={{y:0,opacity:1}} transition={{delay:0.04}}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl" style={{background:G08, border:`1px solid ${G30}`, boxShadow:`0 0 20px ${G10}`}}>
            <DollarSign className="w-5 h-5" style={{color:GOLD}} />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight leading-none">Cartera de Cobro</h1>
            <p className="text-gray-500 text-xs mt-0.5">Registro diario de pesajes y cobros</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button onClick={refrescar} disabled={loading}
            className="px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all hover:scale-105 disabled:opacity-50"
            style={{background:'rgba(59,130,246,0.1)', border:'1px solid rgba(59,130,246,0.25)', color:'#3b82f6'}}>
            <RefreshCw className={`w-3.5 h-3.5 ${loading?'animate-spin':''}`} /> Actualizar
          </button>
          <button onClick={exportarCSV}
            className="px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all hover:scale-105"
            style={{background:'rgba(34,197,94,0.1)', border:'1px solid rgba(34,197,94,0.25)', color:'#22c55e'}}>
            <Download className="w-3.5 h-3.5" /> CSV
          </button>
        </div>
      </motion.div>

      {/* METRIC CARDS - Collapsible */}
      <div>
        <button 
          onClick={() => setStatsCollapsed(!statsCollapsed)}
          className="flex items-center gap-2 mb-2 text-xs font-semibold uppercase tracking-wider transition-colors hover:text-amber-400"
          style={{ color: 'rgba(156,163,175,0.7)' }}
        >
          {statsCollapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          Estadísticas {statsCollapsed ? '(expandir)' : ''}
        </button>
        <AnimatePresence>
          {!statsCollapsed && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }} 
              animate={{ height: 'auto', opacity: 1 }} 
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
      <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
        {[
          {label:'Total Ventas',    value:`S/ ${totalVentas.toFixed(2)}`,          icon:DollarSign, col:COL.pedido,     border:'rgba(34,197,94,0.25)'},
          {label:'Peso Pedido',     value:`${totalPesoPedido.toFixed(1)} kg`,       icon:Scale,      col:COL.pedido,     border:'rgba(34,197,94,0.25)'},
          {label:'Peso Contenedor', value:`${totalPesoContenedor.toFixed(1)} kg`,   icon:Package,    col:COL.contenedor, border:'rgba(239,68,68,0.25)'},
          {label:'Peso Bruto',      value:`${totalPesoBruto.toFixed(1)} kg`,        icon:Scale,      col:COL.bruto,      border:'rgba(245,158,11,0.25)'},
          {label:'Peso Neto',       value:`${totalPesoNeto.toFixed(1)} kg`,         icon:Package,    col:COL.neto,       border:'rgba(6,182,212,0.25)'},
        ].map((m,i) => (
          <motion.div key={m.label}
            initial={{opacity:0,y:6}} animate={{opacity:1,y:0}} transition={{delay:0.08+i*0.06}}
            whileHover={{y:-2,transition:{duration:0.12}}}
            className="rounded-xl p-3 relative overflow-hidden"
            style={{background:'rgba(0,0,0,0.35)', border:`1px solid ${m.border}`}}>
            <div className="absolute top-0 left-0 right-0 h-[2px]"
              style={{background:`linear-gradient(90deg,transparent,${m.col}50,transparent)`}} />
            <div className="flex items-center justify-between mb-1.5">
              <p className="text-[9px] text-gray-500 font-semibold uppercase tracking-wider">{m.label}</p>
              <m.icon className="w-3.5 h-3.5" style={{color:m.col}} />
            </div>
            <p className="text-lg md:text-xl font-bold tabular-nums" style={{color:m.col}}>{m.value}</p>
          </motion.div>
        ))}
      </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* CONTROLS */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
          <input type="text" placeholder="Buscar cliente, tipo..."
            value={busqueda} onChange={e=>setBusqueda(e.target.value)}
            className="pl-9 pr-4 py-2 rounded-xl text-xs text-white placeholder-gray-600 outline-none w-56"
            style={{background:'rgba(0,0,0,0.4)', border:`1px solid ${G15}`}}
            onFocus={e=>(e.target.style.borderColor=G30)}
            onBlur={e=>(e.target.style.borderColor=G15)}
          />
        </div>
        <div className="flex items-center gap-2">
          <button onClick={editarTodas}
            className="px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all hover:scale-105"
            style={{background:'rgba(245,158,11,0.1)', border:'1px solid rgba(245,158,11,0.3)', color:'#f59e0b'}}>
            <Edit3 className="w-3.5 h-3.5" /> Editar Todo
          </button>
          <button onClick={confirmarTodas}
            className="px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all hover:scale-105"
            style={{background:'rgba(34,197,94,0.1)', border:'1px solid rgba(34,197,94,0.3)', color:'#22c55e'}}>
            <Save className="w-3.5 h-3.5" /> Confirmar Todo
          </button>
        </div>
      </div>

      {/* DATE NAVIGATOR — el elemento clave */}
      <div className="flex items-center gap-0 rounded-xl overflow-hidden relative"
        style={{background:G04, border:`1px solid ${G20}`}}>
        {/* flecha izquierda — día anterior */}
        <button onClick={()=>irDia(-1)}
          className="flex items-center justify-center px-3 py-2.5 transition-all group"
          style={{borderRight:`1px solid ${G15}`}}
          onMouseEnter={e=>(e.currentTarget.style.background=G10)}
          onMouseLeave={e=>(e.currentTarget.style.background='transparent')}
          title="Día anterior">
          <ChevronLeft className="w-4 h-4 group-hover:text-yellow-400 transition-colors" style={{color:GOLD}} />
        </button>

        {/* fecha central — clickable para abrir calendario */}
        <button onClick={()=>setShowCal(v=>!v)}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 px-3 transition-all"
          onMouseEnter={e=>(e.currentTarget.style.background=G08)}
          onMouseLeave={e=>(e.currentTarget.style.background='transparent')}>
          <Calendar className="w-3.5 h-3.5" style={{color:GOLD}} />
          <span className="text-sm font-bold" style={{color:GOLD}}>
            {esHoy ? '● HOY' : fmtDate(fechaSeleccionada)}
          </span>
          <span className="text-xs text-gray-500">
            {!esHoy && fechaSeleccionada}
          </span>
          <ChevronDown className="w-3 h-3 text-gray-500 ml-1" style={{transform:showCal?'rotate(180deg)':'', transition:'transform 0.2s'}} />
        </button>

        {/* flecha derecha — día siguiente (bloqueado si es hoy o futuro) */}
        <button onClick={()=>!esHoy&&irDia(1)}
          className="flex items-center justify-center px-3 py-2.5 transition-all group"
          style={{borderLeft:`1px solid ${G15}`, opacity:esHoy?0.3:1, cursor:esHoy?'not-allowed':'pointer'}}
          onMouseEnter={e=>{ if(!esHoy)(e.currentTarget.style.background=G10); }}
          onMouseLeave={e=>(e.currentTarget.style.background='transparent')}
          title="Día siguiente">
          <ChevronRight className="w-4 h-4 group-hover:text-yellow-400 transition-colors" style={{color:GOLD}} />
        </button>

        {/* stat pills a la derecha */}
        <div className="flex items-center gap-3 px-4 border-l" style={{borderColor:G15}}>
          <span className="text-xs text-gray-500">{filasCartera.length} registros</span>
          <span className="text-xs font-semibold" style={{color:COL.pedido}}>
            {filasCartera.filter(f=>f.confirmado).length} ✓
          </span>
        </div>

        {/* dropdown calendario */}
        <AnimatePresence>
          {showCal && <MiniCal />}
        </AnimatePresence>
      </div>

      {/* TABLE */}
      <motion.div initial={{opacity:0,y:6}} animate={{opacity:1,y:0}} transition={{delay:0.2}}
        className="rounded-xl overflow-hidden"
        style={{background:'rgba(0,0,0,0.3)', border:`1px solid ${G20}`, boxShadow:`0 0 30px ${G04}`}}>

        {/* table bar */}
        <div className="px-4 py-2.5 border-b flex items-center justify-between"
          style={{background:`linear-gradient(to right,${G06},rgba(0,0,0,0.3))`, borderColor:G15}}>
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <FileSpreadsheet className="w-4 h-4" style={{color:GOLD}} />
            Cartera de Cobro
            <span className="text-xs font-normal text-gray-500">— Detalle diario</span>
          </h2>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full"
            style={{background:G10, border:`1px solid ${G30}`}}>
            <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{background:GOLD}} />
            <span className="text-xs font-bold" style={{color:GOLD}}>{filasOrdenadas.length} filas</span>
          </div>
        </div>

        {loading ? (
          <div className="py-12 flex flex-col items-center gap-3">
            <motion.div animate={{rotate:360}} transition={{duration:1.1,repeat:Infinity,ease:'linear'}}
              className="w-9 h-9 rounded-full border-4"
              style={{borderColor:G20, borderTopColor:GOLD}} />
            <p className="text-gray-500 text-sm">Cargando...</p>
          </div>
        ) : filasOrdenadas.length===0 ? (
          <div className="py-16 text-center">
            <motion.div animate={{y:[0,-6,0]}} transition={{duration:2.5,repeat:Infinity}}>
              <FileSpreadsheet className="w-14 h-14 mx-auto mb-3 text-gray-700" />
            </motion.div>
            <p className="text-gray-400 mb-1">No hay registros para este día</p>
            <button onClick={refrescar}
              className="mt-3 px-4 py-2 rounded-xl text-sm font-semibold transition-all hover:scale-105"
              style={{background:'rgba(59,130,246,0.1)', border:'1px solid rgba(59,130,246,0.25)', color:'#3b82f6'}}>
              <RefreshCw className="w-3.5 h-3.5 inline mr-1.5" />Cargar desde pesaje
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full" style={{minWidth:'1500px', borderCollapse:'collapse'}}>

              {/* THEAD */}
              <thead>
                <tr style={{background:G04, borderBottom:`2px solid ${G15}`}}>
                  {[
                    {key:'cliente',        label:'CLIENTE'},
                    {key:'tipo',           label:'TIPO'},
                    {key:'presentacion',   label:'PRES.'},
                    {key:'cantidad',       label:'CANT.'},
                    {key:'pesoPedido',     label:'P.PEDIDO kg'},
                    {key:'pesoContenedor', label:'P.CONT. kg'},
                    {key:'pesoBruto',      label:'P.BRUTO kg'},
                    {key:'repesada',       label:'REPESADA kg'},
                    {key:'merma',          label:'MERMA kg'},
                    {key:'devolucionPeso', label:'DEVOL. kg'},
                    {key:'adicionPeso',    label:'ADICIÓN kg'},
                    {key:'pesoNeto',       label:'P.NETO kg'},
                    {key:'precio',         label:'PRECIO S/'},
                    {key:'total',          label:'TOTAL S/'},
                    {key:'zona',           label:'ZONA'},
                    {key:'conductor',      label:'CONDUCTOR'},
                    {key:'acciones',       label:''},
                  ].map(col=>(
                    <th key={col.key}
                      className="px-2 py-2 text-left cursor-pointer select-none transition-colors"
                      onMouseEnter={e=>(e.currentTarget.style.background=G06)}
                      onMouseLeave={e=>(e.currentTarget.style.background='transparent')}
                      onClick={()=>col.key!=='acciones'&&handleSort(col.key)}>
                      <div className="flex items-center gap-0.5">
                        <span className="text-[9px] font-bold uppercase tracking-widest" style={{color:GOLD}}>
                          {col.label}
                        </span>
                        {sortColumn===col.key&&(
                          sortDir==='asc'
                            ?<ChevronUp className="w-2.5 h-2.5 text-amber-400"/>
                            :<ChevronDown className="w-2.5 h-2.5 text-amber-400"/>
                        )}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>

              {/* TBODY */}
              <tbody>
                <AnimatePresence>
                  {filasOrdenadas.map((fila,idx)=>{
                    const puedeEditar = fila.editando||editandoAll;
                    const isHov       = hoveredRow===fila.id;
                    const rowBg       = fila.confirmado
                      ? 'rgba(34,197,94,0.04)'
                      : idx%2!==0 ? G04 : 'transparent';

                    return (
                      <motion.tr key={fila.id}
                        initial={{opacity:0,y:4}} animate={{opacity:1,y:0}} exit={{opacity:0}}
                        transition={{delay:idx*0.015}}
                        onMouseEnter={()=>setHoveredRow(fila.id)}
                        onMouseLeave={()=>setHoveredRow(null)}
                        style={{
                          borderBottom:`1px solid ${G06}`,
                          background:isHov ? G08 : rowBg,
                          transition:'background 0.1s ease',
                        }}>

                        {/* CLIENTE — solo nombre + pedidoId, sin avatar */}
                        <td className="px-2 py-2 whitespace-nowrap">
                          <span className="text-white font-semibold text-xs block truncate max-w-[120px]" title={fila.cliente}>
                            {fila.cliente}
                          </span>
                          <span className="text-[9px] text-gray-600 font-mono">#{fila.pedidoId.slice(-5)}</span>
                        </td>

                        {/* TIPO — solo el nombre, sin variedad en paréntesis redundante */}
                        <td className="px-2 py-2 whitespace-nowrap">
                          <span className="text-xs font-semibold" style={{color:COL.tipo}}>{fila.tipo}</span>
                        </td>

                        {/* PRESENTACIÓN */}
                        <td className="px-2 py-2 whitespace-nowrap">
                          {fila.presentacion?.toLowerCase().includes('vivo') ? (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded"
                              style={{background:'rgba(245,158,11,0.12)', border:'1px solid rgba(245,158,11,0.30)', color:COL.bruto}}>
                              Vivo
                            </span>
                          ) : (
                            <span className="text-[10px] text-gray-400">{fila.presentacion}</span>
                          )}
                        </td>

                        {/* CANTIDAD */}
                        <td className="px-2 py-2 text-right whitespace-nowrap">
                          <span className="text-white font-bold text-xs tabular-nums">{fila.cantidad}</span>
                          <div className="text-[9px] text-gray-600">{fila.cantidadLabel}</div>
                        </td>

                        {/* P. PEDIDO */}
                        <td className="px-2 py-2 text-right whitespace-nowrap">
                          <span className="font-bold text-xs tabular-nums" style={{color:COL.pedido}}>{fila.pesoPedido.toFixed(2)}</span>
                        </td>

                        {/* P. CONTENEDOR */}
                        <td className="px-2 py-2 text-right whitespace-nowrap">
                          <span className="text-xs tabular-nums" style={{color:COL.contenedor}}>{fila.pesoContenedor.toFixed(2)}</span>
                          <div className="text-[9px] text-gray-700">{fila.contenedorTipo}</div>
                        </td>

                        {/* P. BRUTO */}
                        <td className="px-2 py-2 text-right whitespace-nowrap">
                          <span className="font-bold text-xs tabular-nums" style={{color:COL.bruto}}>{fila.pesoBruto.toFixed(2)}</span>
                        </td>

                        {/* REPESADA — editable, sky-400 */}
                        <td className="px-2 py-2 whitespace-nowrap" style={{minWidth:80}}>
                          <EditInput value={fila.repesada} onChange={v=>actualizarCampo(fila.id,'repesada',v)} disabled={!puedeEditar} color={COL.repesada} />
                        </td>

                        {/* MERMA — editable */}
                        <td className="px-2 py-2 whitespace-nowrap" style={{minWidth:80}}>
                          <EditInput value={fila.merma} onChange={v=>actualizarCampo(fila.id,'merma',v)} disabled={!puedeEditar} color={COL.merma} />
                        </td>

                        {/* DEVOLUCIÓN — editable */}
                        <td className="px-2 py-2 whitespace-nowrap" style={{minWidth:80}}>
                          <EditInput value={fila.devolucionPeso} onChange={v=>actualizarCampo(fila.id,'devolucionPeso',v)} disabled={!puedeEditar} color={COL.devolucion} />
                        </td>

                        {/* ADICIÓN — editable, lime-400 */}
                        <td className="px-2 py-2 whitespace-nowrap" style={{minWidth:80}}>
                          <EditInput value={fila.adicionPeso} onChange={v=>actualizarCampo(fila.id,'adicionPeso',v)} disabled={!puedeEditar} color={COL.adicion} />
                        </td>

                        {/* P. NETO — pill cyan */}
                        <td className="px-2 py-2 text-right whitespace-nowrap">
                          <span className="font-bold text-xs tabular-nums px-1.5 py-0.5 rounded-md"
                            style={{background:'rgba(6,182,212,0.10)', border:'1px solid rgba(6,182,212,0.25)', color:COL.neto}}>
                            {fila.pesoNeto.toFixed(2)}
                          </span>
                        </td>

                        {/* PRECIO — editable */}
                        <td className="px-2 py-2 whitespace-nowrap" style={{minWidth:80}}>
                          <EditInput value={fila.precio} onChange={v=>actualizarCampo(fila.id,'precio',v)} disabled={!puedeEditar} color={COL.total} />
                        </td>

                        {/* TOTAL — pill amber */}
                        <td className="px-2 py-2 text-right whitespace-nowrap">
                          <span className="font-black text-xs tabular-nums px-1.5 py-0.5 rounded-md"
                            style={{background:'rgba(251,191,36,0.10)', border:'1px solid rgba(251,191,36,0.30)', color:COL.total}}>
                            S/{fila.total.toFixed(2)}
                          </span>
                        </td>

                        {/* ZONA */}
                        <td className="px-2 py-2 whitespace-nowrap">
                          <span className="text-[10px] font-semibold" style={{color:COL.zona}}>{fila.zona}</span>
                        </td>

                        {/* CONDUCTOR */}
                        <td className="px-2 py-2 whitespace-nowrap">
                          <span className="text-white text-[10px] truncate block max-w-[90px]">{fila.conductor}</span>
                        </td>

                        {/* ACCIONES */}
                        <td className="px-2 py-2 whitespace-nowrap">
                          <div className="flex items-center gap-1">
                            {fila.confirmado && !fila.editando ? (
                              <motion.button whileHover={{scale:1.15}} whileTap={{scale:0.9}}
                                onClick={()=>editarFila(fila.id)}
                                className="p-1.5 rounded-lg"
                                style={{background:'rgba(245,158,11,0.10)', border:'1px solid rgba(245,158,11,0.30)'}}>
                                <Edit3 className="w-3 h-3 text-amber-400" />
                              </motion.button>
                            ) : (
                              <motion.button whileHover={{scale:1.15}} whileTap={{scale:0.9}}
                                onClick={()=>confirmarFila(fila.id)}
                                className="p-1.5 rounded-lg"
                                style={{background:'rgba(34,197,94,0.10)', border:'1px solid rgba(34,197,94,0.30)'}}>
                                <CheckCircle className="w-3 h-3 text-green-400" />
                              </motion.button>
                            )}
                            {fila.confirmado && (
                              <span className="w-1.5 h-1.5 rounded-full"
                                style={{background:'#22c55e', boxShadow:'0 0 4px #22c55e'}} />
                            )}
                          </div>
                        </td>
                      </motion.tr>
                    );
                  })}
                </AnimatePresence>
              </tbody>

              {/* TFOOT */}
              <tfoot>
                <tr style={{background:G06, borderTop:`2px solid ${G20}`}}>
                  <td className="px-2 py-2.5" colSpan={4}>
                    <span className="text-[10px] font-black uppercase tracking-widest flex items-center gap-1" style={{color:GOLD}}>
                      <TrendingUp className="w-3 h-3" /> TOTALES
                    </span>
                  </td>
                  <td className="px-2 py-2.5 text-right"><span className="font-bold text-xs tabular-nums" style={{color:COL.pedido}}>{tot('pesoPedido').toFixed(2)}</span></td>
                  <td className="px-2 py-2.5 text-right"><span className="font-bold text-xs tabular-nums" style={{color:COL.contenedor}}>{tot('pesoContenedor').toFixed(2)}</span></td>
                  <td className="px-2 py-2.5 text-right"><span className="font-bold text-xs tabular-nums" style={{color:COL.bruto}}>{tot('pesoBruto').toFixed(2)}</span></td>
                  <td className="px-2 py-2.5 text-right"><span className="font-bold text-xs tabular-nums" style={{color:COL.repesada}}>{tot('repesada').toFixed(2)}</span></td>
                  <td className="px-2 py-2.5 text-right"><span className="font-bold text-xs tabular-nums text-white">{tot('merma').toFixed(2)}</span></td>
                  <td className="px-2 py-2.5 text-right"><span className="font-bold text-xs tabular-nums" style={{color:COL.devolucion}}>{tot('devolucionPeso').toFixed(2)}</span></td>
                  <td className="px-2 py-2.5 text-right"><span className="font-bold text-xs tabular-nums" style={{color:COL.adicion}}>{tot('adicionPeso').toFixed(2)}</span></td>
                  <td className="px-2 py-2.5 text-right">
                    <span className="font-bold text-xs tabular-nums px-1.5 py-0.5 rounded-md"
                      style={{background:'rgba(6,182,212,0.10)', border:'1px solid rgba(6,182,212,0.25)', color:COL.neto}}>
                      {tot('pesoNeto').toFixed(2)}
                    </span>
                  </td>
                  <td />
                  <td className="px-2 py-2.5 text-right">
                    <span className="font-black text-sm tabular-nums px-2 py-1 rounded-lg"
                      style={{background:'rgba(251,191,36,0.12)', border:`1px solid rgba(251,191,36,0.35)`, color:COL.total}}>
                      S/{tot('total').toFixed(2)}
                    </span>
                  </td>
                  <td colSpan={3} />
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </motion.div>

      {/* MODAL */}
      <AnimatePresence>
        {confirmModal.open && (
          <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{background:'rgba(0,0,0,0.88)', backdropFilter:'blur(10px)'}}
            onClick={()=>setConfirmModal({open:false,filaId:null,cliente:''})}>
            <motion.div initial={{scale:0.92,y:12}} animate={{scale:1,y:0}} exit={{scale:0.92,y:12}}
              className="rounded-2xl w-full max-w-sm"
              style={{background:'rgba(10,9,5,0.98)', border:`1px solid ${G30}`, boxShadow:`0 20px 50px -12px ${G10}`}}
              onClick={e=>e.stopPropagation()}>
              <div className="p-6">
                <motion.div initial={{scale:0}} animate={{scale:1}} transition={{type:'spring',stiffness:220,delay:0.06}}
                  className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4"
                  style={{background:G08, border:`2px solid ${G30}`}}>
                  <AlertTriangle className="w-6 h-6" style={{color:GOLD}} />
                </motion.div>
                <h3 className="text-lg font-bold text-white text-center mb-2">¿Confirmar liquidación?</h3>
                <p className="text-gray-400 text-sm text-center mb-4">
                  Emitir boleta para <span className="font-bold" style={{color:GOLD}}>{confirmModal.cliente}</span>
                </p>
                <div className="mb-5 p-2.5 rounded-xl text-center"
                  style={{background:'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.20)'}}>
                  <p className="text-red-400 text-[10px] font-bold uppercase tracking-wider">
                    ⚠ Acción irreversible
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-2.5">
                  <button onClick={()=>setConfirmModal({open:false,filaId:null,cliente:''})}
                    className="py-2.5 rounded-xl text-sm font-semibold text-gray-300 hover:bg-white/5 transition-all"
                    style={{border:'1px solid rgba(255,255,255,0.10)'}}>
                    Cancelar
                  </button>
                  <button onClick={ejecutarConfirm}
                    className="py-2.5 rounded-xl text-sm font-bold text-black hover:brightness-110 transition-all"
                    style={{background:`linear-gradient(135deg,${GOLD},#a88800)`, boxShadow:`0 4px 16px ${G30}`}}>
                    Confirmar
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}