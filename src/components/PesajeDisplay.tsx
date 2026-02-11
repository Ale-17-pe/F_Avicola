import { useState, useEffect, useRef } from 'react';
import { Scale, Package, CheckCircle, Wifi, WifiOff } from 'lucide-react';

// ===================== PANTALLA DISPLAY DE PESAJE =====================
// Pantalla dedicada para mostrar SOLO el peso en tiempo real
// Se comunica con PesajeOperador a través de BroadcastChannel

interface PedidoInfo {
  cliente: string;
  tipoAve: string;
  cantidad: number;
  presentacion: string;
}

interface BloqueInfo {
  numero: number;
  peso: number;
}

export function PesajeDisplay() {
  const [pesoActual, setPesoActual] = useState<number>(0);
  const [estable, setEstable] = useState(false);
  const [pedidoInfo, setPedidoInfo] = useState<PedidoInfo | null>(null);
  const [bloqueActual, setBloqueActual] = useState(1);
  const [totalBloques, setTotalBloques] = useState(0);
  const [pesoTotal, setPesoTotal] = useState(0);
  const [conectado, setConectado] = useState(false);
  const [ultimoTicket, setUltimoTicket] = useState<string | null>(null);
  const [bloquesRegistrados, setBloquesRegistrados] = useState<BloqueInfo[]>([]);
  const [hora, setHora] = useState('');

  const broadcastRef = useRef<BroadcastChannel | null>(null);

  // Reloj en tiempo real
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      setHora(now.toLocaleTimeString('es-PE', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      }));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Escuchar mensajes del operador
  useEffect(() => {
    broadcastRef.current = new BroadcastChannel('pesaje-display');

    broadcastRef.current.onmessage = (event) => {
      const data = event.data;
      setConectado(true);

      switch (data.type) {
        case 'weight-update':
          setPesoActual(data.weight);
          setEstable(data.stable);
          setUltimoTicket(null);
          break;

        case 'pedido-selected':
          setPedidoInfo(data.pedido);
          setTotalBloques(data.totalBloques);
          setBloqueActual(data.bloqueActual);
          setPesoTotal(0);
          setBloquesRegistrados([]);
          setUltimoTicket(null);
          setPesoActual(0);
          break;

        case 'bloque-registrado':
          setBloqueActual(data.siguienteBloque);
          setPesoTotal(data.pesoTotal);
          setBloquesRegistrados(prev => [...prev, {
            numero: data.bloque,
            peso: data.peso,
          }]);
          setPesoActual(0);
          if (data.completado) {
            setBloqueActual(data.totalBloques);
          }
          break;

        case 'ticket-emitido':
          setUltimoTicket(data.ticket);
          setPesoTotal(data.pesoTotal);
          setPedidoInfo(null);
          setPesoActual(0);
          setBloquesRegistrados([]);
          break;
      }
    };

    return () => broadcastRef.current?.close();
  }, []);

  // Detectar desconexión
  useEffect(() => {
    const timeout = setTimeout(() => {
      // Si no recibimos mensajes en 10s, marcar como desconectado
    }, 10000);
    return () => clearTimeout(timeout);
  }, [pesoActual]);

  const todosCompletados = totalBloques > 0 && bloquesRegistrados.length >= totalBloques;

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{
        background: 'linear-gradient(135deg, #000000 0%, #0a0a0a 50%, #050505 100%)',
        fontFamily: "'Inter', 'Segoe UI', sans-serif",
      }}
    >
      {/* ===== HEADER MINIMALISTA ===== */}
      <div className="flex items-center justify-between px-8 py-4"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.3)' }}
          >
            <Scale className="w-4 h-4" style={{ color: '#22c55e' }} />
          </div>
          <div>
            <h1 className="text-base font-bold tracking-wider">
              <span style={{ color: '#22c55e' }}>AVÍCOLA </span>
              <span style={{ color: '#ccaa00' }}>JOSSY</span>
            </h1>
            <p className="text-[10px] text-gray-600 uppercase tracking-widest">Display de Pesaje</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Hora */}
          <span className="text-xl font-mono font-bold text-gray-400">{hora}</span>

          {/* Estado conexión */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg"
            style={{
              background: conectado ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
              border: `1px solid ${conectado ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`,
            }}
          >
            {conectado
              ? <Wifi className="w-4 h-4" style={{ color: '#22c55e' }} />
              : <WifiOff className="w-4 h-4" style={{ color: '#ef4444' }} />
            }
            <span className="text-xs font-semibold" style={{ color: conectado ? '#22c55e' : '#ef4444' }}>
              {conectado ? 'Conectado' : 'Sin señal'}
            </span>
          </div>
        </div>
      </div>

      {/* ===== CONTENIDO PRINCIPAL ===== */}
      <div className="flex-1 flex flex-col items-center justify-center px-8 py-6">
        {ultimoTicket ? (
          /* ===== TICKET EMITIDO ===== */
          <div className="text-center animate-pulse">
            <CheckCircle className="w-24 h-24 mx-auto mb-6" style={{ color: '#22c55e' }} />
            <h2 className="text-4xl font-extrabold text-white mb-2">Ticket Emitido</h2>
            <p className="text-2xl font-mono font-bold" style={{ color: '#ccaa00' }}>{ultimoTicket}</p>
            <p className="text-xl font-mono mt-4" style={{ color: '#22c55e' }}>
              Peso Total: {pesoTotal.toFixed(2)} Kg
            </p>
          </div>
        ) : pedidoInfo ? (
          /* ===== PESAJE ACTIVO ===== */
          <div className="w-full max-w-4xl">
            {/* Info del pedido */}
            <div className="text-center mb-6">
              <div className="inline-flex items-center gap-3 px-5 py-2.5 rounded-2xl mb-4"
                style={{ background: 'rgba(204,170,0,0.08)', border: '1px solid rgba(204,170,0,0.2)' }}
              >
                <Package className="w-5 h-5" style={{ color: '#ccaa00' }} />
                <span className="text-lg font-bold text-white">{pedidoInfo.cliente}</span>
                <span className="text-sm text-gray-400">•</span>
                <span className="text-sm" style={{ color: '#22c55e' }}>{pedidoInfo.tipoAve}</span>
                <span className="text-sm text-gray-400">•</span>
                <span className="text-sm text-gray-400">{pedidoInfo.cantidad} unids.</span>
                <span className="text-sm text-gray-400">•</span>
                <span className="text-sm" style={{ color: '#3b82f6' }}>{pedidoInfo.presentacion}</span>
              </div>

              {/* Bloque actual */}
              {!todosCompletados && (
                <div className="mb-4">
                  <span className="text-sm font-bold uppercase tracking-widest px-4 py-1.5 rounded-full"
                    style={{ background: 'rgba(204,170,0,0.15)', color: '#ccaa00' }}
                  >
                    Bloque {bloqueActual} de {totalBloques}
                  </span>
                </div>
              )}
            </div>

            {/* ===== PESO GIGANTE ===== */}
            <div
              className="rounded-3xl p-12 text-center mb-8 relative overflow-hidden"
              style={{
                background: todosCompletados
                  ? 'rgba(34,197,94,0.05)'
                  : 'rgba(0,0,0,0.3)',
                border: `3px solid ${todosCompletados ? 'rgba(34,197,94,0.4)' : estable ? 'rgba(34,197,94,0.3)' : 'rgba(245,158,11,0.3)'}`,
                boxShadow: todosCompletados
                  ? '0 0 60px rgba(34,197,94,0.1), inset 0 0 60px rgba(34,197,94,0.03)'
                  : '0 0 60px rgba(0,0,0,0.3), inset 0 0 60px rgba(0,0,0,0.1)',
              }}
            >
              {todosCompletados ? (
                <div>
                  <p className="text-lg text-green-400 uppercase tracking-widest mb-3 font-bold">
                    ✓ Pesaje Completado
                  </p>
                  <p className="font-extrabold font-mono leading-none" style={{ fontSize: '120px', color: '#22c55e' }}>
                    {pesoTotal.toFixed(2)}
                  </p>
                  <p className="text-3xl font-bold mt-2" style={{ color: '#22c55e80' }}>Kg Total</p>
                </div>
              ) : (
                <div>
                  <p className="text-sm text-gray-500 uppercase tracking-widest mb-2">
                    {estable ? 'Peso Estable' : 'Leyendo peso...'}
                  </p>
                  <p
                    className="font-extrabold font-mono leading-none transition-colors"
                    style={{
                      fontSize: '140px',
                      color: pesoActual > 0
                        ? (estable ? '#22c55e' : '#f59e0b')
                        : '#333',
                      textShadow: pesoActual > 0
                        ? `0 0 40px ${estable ? 'rgba(34,197,94,0.3)' : 'rgba(245,158,11,0.3)'}`
                        : 'none',
                    }}
                  >
                    {pesoActual.toFixed(2)}
                  </p>
                  <p className="text-3xl font-bold mt-2" style={{ color: estable ? '#22c55e80' : '#f59e0b80' }}>
                    Kg
                  </p>
                  {!estable && pesoActual > 0 && (
                    <p className="text-sm mt-3 animate-pulse" style={{ color: '#f59e0b' }}>
                      ⏳ Estabilizando...
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* ===== BARRA DE PROGRESO + BLOQUES ===== */}
            <div className="flex items-center gap-2 mb-4">
              {Array.from({ length: totalBloques }, (_, i) => {
                const registrado = bloquesRegistrados.find(b => b.numero === i + 1);
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <div
                      className="w-full h-3 rounded-full transition-all duration-500"
                      style={{
                        background: registrado
                          ? '#22c55e'
                          : i + 1 === bloqueActual && !todosCompletados
                          ? 'rgba(204,170,0,0.5)'
                          : 'rgba(255,255,255,0.06)',
                        boxShadow: registrado ? '0 0 8px rgba(34,197,94,0.4)' : 'none',
                      }}
                    />
                    <span className="text-[10px] font-mono" style={{
                      color: registrado ? '#22c55e' : '#666',
                    }}>
                      {registrado ? `${registrado.peso.toFixed(1)}` : `B${i + 1}`}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Peso acumulado */}
            {bloquesRegistrados.length > 0 && (
              <div className="text-center">
                <span className="text-sm text-gray-500">Peso acumulado: </span>
                <span className="text-lg font-bold font-mono" style={{ color: '#22c55e' }}>
                  {pesoTotal.toFixed(2)} Kg
                </span>
                <span className="text-sm text-gray-600 ml-2">
                  ({bloquesRegistrados.length} de {totalBloques} bloques)
                </span>
              </div>
            )}
          </div>
        ) : (
          /* ===== ESPERANDO ===== */
          <div className="text-center">
            <Scale className="w-28 h-28 mx-auto mb-6" style={{ color: '#22c55e15' }} />
            <h2 className="text-3xl font-bold text-gray-600 mb-2">Esperando pedido</h2>
            <p className="text-gray-700 text-lg">
              Seleccione un pedido en la pantalla del operador
            </p>
          </div>
        )}
      </div>

      {/* ===== FOOTER ===== */}
      <div className="px-8 py-3 flex items-center justify-between"
        style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
      >
        <span className="text-xs text-gray-700">
          {new Date().toLocaleDateString('es-PE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </span>
        <span className="text-xs text-gray-700 tracking-widest uppercase">
          Avícola Jossy — Sistema de Gestión
        </span>
      </div>
    </div>
  );
}
