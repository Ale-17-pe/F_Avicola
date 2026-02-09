import { useState } from 'react';
import { Plus, X, Search, Package, User, DollarSign, Calendar, Bird } from 'lucide-react';
import { useApp } from '../contexts/AppContext';

interface PedidoItem {
  id: string;
  tipoAve: string;
  variedad?: string;
  sexo?: string;
  presentacion: string;
  cantidad: number;
  pesoKg: number;
  precioUnitario: number;
  subtotal: number;
  mermaKg: number;
}

interface FormularioPedido {
  vendedor: string;
  vendedorId: string;
  cliente: string;
  clienteId: string;
  fecha: string;
  hora: string;
  items: PedidoItem[];
  notas: string;
}

interface ModalNuevoPedidoProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (pedido: any) => void;
}

export function ModalNuevoPedido({ isOpen, onClose, onSubmit }: ModalNuevoPedidoProps) {
  const { tiposAve, empleados } = useApp();

  // Presentaciones disponibles (heredadas de Aves)
  const presentaciones = [
    { id: '1', tipoAve: 'Pollo', nombre: 'Vivo', mermaKg: 0 },
    { id: '2', tipoAve: 'Pollo', nombre: 'Pelado', mermaKg: 0.15 },
    { id: '3', tipoAve: 'Pollo', nombre: 'Destripado', mermaKg: 0.20 },
    { id: '4', tipoAve: 'Gallina', nombre: 'Vivo', mermaKg: 0 },
    { id: '5', tipoAve: 'Gallina', nombre: 'Pelado', mermaKg: 0.15 },
    { id: '6', tipoAve: 'Gallina', nombre: 'Destripado', mermaKg: 0.20 },
    { id: '7', tipoAve: 'Pato', nombre: 'Vivo', mermaKg: 0 },
    { id: '8', tipoAve: 'Pato', nombre: 'Pelado', mermaKg: 0.15 },
    { id: '9', tipoAve: 'Pato', nombre: 'Destripado', mermaKg: 0.20 },
    { id: '10', tipoAve: 'Pavo', nombre: 'Vivo', mermaKg: 0 },
    { id: '11', tipoAve: 'Pavo', nombre: 'Pelado', mermaKg: 0.15 },
    { id: '12', tipoAve: 'Pavo', nombre: 'Destripado', mermaKg: 0.20 },
  ];

  // Clientes de ejemplo
  const clientes = [
    { id: '1', nombre: 'Restaurante El Sabor', contacto: 'Juan Pérez' },
    { id: '2', nombre: 'Pollería Don José', contacto: 'José Martínez' },
    { id: '3', nombre: 'Mercado Central', contacto: 'María López' },
    { id: '4', nombre: 'Supermercado La Esquina', contacto: 'Carlos Ruiz' },
  ];

  const empleadosVendedores = empleados.filter(e => 
    e.cargo === 'Secretaria' || e.cargo === 'Administrador'
  );

  const [formulario, setFormulario] = useState<FormularioPedido>({
    vendedor: '',
    vendedorId: '',
    cliente: '',
    clienteId: '',
    fecha: new Date().toISOString().split('T')[0],
    hora: new Date().toTimeString().split(' ')[0].substring(0, 5),
    items: [],
    notas: ''
  });

  const [itemActual, setItemActual] = useState({
    tipoAve: '',
    variedad: '',
    sexo: '',
    presentacion: '',
    cantidad: 1,
    pesoKg: 0,
    precioUnitario: 0,
  });

  const agregarItem = () => {
    if (!itemActual.tipoAve || !itemActual.presentacion || itemActual.pesoKg <= 0) {
      alert('Complete todos los campos requeridos');
      return;
    }

    const presentacionSeleccionada = presentaciones.find(
      p => p.tipoAve === itemActual.tipoAve && p.nombre === itemActual.presentacion
    );

    const nuevoItem: PedidoItem = {
      id: Date.now().toString(),
      tipoAve: itemActual.tipoAve,
      variedad: itemActual.variedad || undefined,
      sexo: itemActual.sexo || undefined,
      presentacion: itemActual.presentacion,
      cantidad: itemActual.cantidad,
      pesoKg: itemActual.pesoKg,
      precioUnitario: itemActual.precioUnitario,
      subtotal: itemActual.pesoKg * itemActual.precioUnitario,
      mermaKg: presentacionSeleccionada?.mermaKg || 0
    };

    setFormulario({
      ...formulario,
      items: [...formulario.items, nuevoItem]
    });

    // Resetear item actual
    setItemActual({
      tipoAve: '',
      variedad: '',
      sexo: '',
      presentacion: '',
      cantidad: 1,
      pesoKg: 0,
      precioUnitario: 0,
    });
  };

  const eliminarItem = (id: string) => {
    setFormulario({
      ...formulario,
      items: formulario.items.filter(item => item.id !== id)
    });
  };

  const calcularTotal = () => {
    return formulario.items.reduce((sum, item) => sum + item.subtotal, 0);
  };

  const handleSubmit = () => {
    if (!formulario.vendedor || !formulario.cliente || formulario.items.length === 0) {
      alert('Complete todos los campos requeridos y agregue al menos un item');
      return;
    }

    const pedido = {
      ...formulario,
      numero: `PED-${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`,
      total: calcularTotal(),
      estado: 'pendiente'
    };

    onSubmit(pedido);
    onClose();
  };

  const tipoAveSeleccionado = tiposAve.find(t => t.nombre === itemActual.tipoAve);
  const presentacionesFiltradas = presentaciones.filter(p => p.tipoAve === itemActual.tipoAve);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-br from-zinc-900 to-zinc-800 border border-zinc-700 rounded-xl max-w-5xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-amber-500/20 to-amber-600/20 border-b border-amber-500/50 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Package className="w-6 h-6 text-amber-400" />
            <h2 className="text-xl text-white font-bold">Nuevo Pedido</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Información General */}
          <div className="bg-zinc-800/50 border border-zinc-700 rounded-xl p-5">
            <h3 className="text-amber-400 font-medium mb-4 flex items-center gap-2">
              <User className="w-5 h-5" />
              Información General
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-400 text-sm mb-2">Vendedor *</label>
                <select
                  value={formulario.vendedorId}
                  onChange={(e) => {
                    const emp = empleadosVendedores.find(emp => emp.id === e.target.value);
                    setFormulario({
                      ...formulario,
                      vendedorId: e.target.value,
                      vendedor: emp ? `${emp.nombre} ${emp.apellido}` : ''
                    });
                  }}
                  className="w-full px-4 py-2.5 bg-zinc-900 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-amber-500"
                >
                  <option value="">Seleccione un vendedor</option>
                  {empleadosVendedores.map(emp => (
                    <option key={emp.id} value={emp.id}>
                      {emp.nombre} {emp.apellido} - {emp.cargo}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-gray-400 text-sm mb-2">Cliente *</label>
                <select
                  value={formulario.clienteId}
                  onChange={(e) => {
                    const cli = clientes.find(c => c.id === e.target.value);
                    setFormulario({
                      ...formulario,
                      clienteId: e.target.value,
                      cliente: cli?.nombre || ''
                    });
                  }}
                  className="w-full px-4 py-2.5 bg-zinc-900 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-amber-500"
                >
                  <option value="">Seleccione un cliente</option>
                  {clientes.map(cli => (
                    <option key={cli.id} value={cli.id}>
                      {cli.nombre} - {cli.contacto}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-gray-400 text-sm mb-2">Fecha *</label>
                <input
                  type="date"
                  value={formulario.fecha}
                  onChange={(e) => setFormulario({ ...formulario, fecha: e.target.value })}
                  className="w-full px-4 py-2.5 bg-zinc-900 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-gray-400 text-sm mb-2">Hora *</label>
                <input
                  type="time"
                  value={formulario.hora}
                  onChange={(e) => setFormulario({ ...formulario, hora: e.target.value })}
                  className="w-full px-4 py-2.5 bg-zinc-900 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>
          </div>

          {/* Agregar Items */}
          <div className="bg-zinc-800/50 border border-zinc-700 rounded-xl p-5">
            <h3 className="text-amber-400 font-medium mb-4 flex items-center gap-2">
              <Bird className="w-5 h-5" />
              Agregar Producto
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-gray-400 text-sm mb-2">Tipo de Ave *</label>
                <select
                  value={itemActual.tipoAve}
                  onChange={(e) => setItemActual({ ...itemActual, tipoAve: e.target.value, presentacion: '' })}
                  className="w-full px-4 py-2.5 bg-zinc-900 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-amber-500"
                >
                  <option value="">Seleccione</option>
                  {tiposAve.map(tipo => (
                    <option key={tipo.id} value={tipo.nombre}>{tipo.nombre}</option>
                  ))}
                </select>
              </div>

              {tipoAveSeleccionado?.tieneVariedad && (
                <div>
                  <label className="block text-gray-400 text-sm mb-2">Variedad</label>
                  <select
                    value={itemActual.variedad}
                    onChange={(e) => setItemActual({ ...itemActual, variedad: e.target.value })}
                    className="w-full px-4 py-2.5 bg-zinc-900 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="">Seleccione</option>
                    {tipoAveSeleccionado.variedades?.map(v => (
                      <option key={v} value={v}>{v}</option>
                    ))}
                  </select>
                </div>
              )}

              {tipoAveSeleccionado?.tieneSexo && (
                <div>
                  <label className="block text-gray-400 text-sm mb-2">Sexo</label>
                  <select
                    value={itemActual.sexo}
                    onChange={(e) => setItemActual({ ...itemActual, sexo: e.target.value })}
                    className="w-full px-4 py-2.5 bg-zinc-900 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="">Seleccione</option>
                    <option value="Macho">Macho</option>
                    <option value="Hembra">Hembra</option>
                  </select>
                </div>
              )}

              <div>
                <label className="block text-gray-400 text-sm mb-2">Presentación *</label>
                <select
                  value={itemActual.presentacion}
                  onChange={(e) => setItemActual({ ...itemActual, presentacion: e.target.value })}
                  className="w-full px-4 py-2.5 bg-zinc-900 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-amber-500"
                  disabled={!itemActual.tipoAve}
                >
                  <option value="">Seleccione</option>
                  {presentacionesFiltradas.map(p => (
                    <option key={p.id} value={p.nombre}>
                      {p.nombre} {p.mermaKg > 0 && `(Merma: ${p.mermaKg}kg)`}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-gray-400 text-sm mb-2">Cantidad *</label>
                <input
                  type="number"
                  min="1"
                  value={itemActual.cantidad}
                  onChange={(e) => setItemActual({ ...itemActual, cantidad: parseInt(e.target.value) })}
                  className="w-full px-4 py-2.5 bg-zinc-900 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-gray-400 text-sm mb-2">Peso Total (kg) *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={itemActual.pesoKg}
                  onChange={(e) => setItemActual({ ...itemActual, pesoKg: parseFloat(e.target.value) || 0 })}
                  className="w-full px-4 py-2.5 bg-zinc-900 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-gray-400 text-sm mb-2">Precio por Kg (S/) *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={itemActual.precioUnitario}
                  onChange={(e) => setItemActual({ ...itemActual, precioUnitario: parseFloat(e.target.value) || 0 })}
                  className="w-full px-4 py-2.5 bg-zinc-900 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex items-end">
                <button
                  onClick={agregarItem}
                  className="w-full px-4 py-2.5 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white rounded-lg transition-all flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Agregar
                </button>
              </div>
            </div>
          </div>

          {/* Lista de Items */}
          {formulario.items.length > 0 && (
            <div className="bg-zinc-800/50 border border-zinc-700 rounded-xl p-5">
              <h3 className="text-amber-400 font-medium mb-4">Items del Pedido</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-zinc-900/50">
                    <tr>
                      <th className="text-left px-3 py-2 text-gray-400 text-xs">TIPO AVE</th>
                      <th className="text-left px-3 py-2 text-gray-400 text-xs">VARIEDAD</th>
                      <th className="text-left px-3 py-2 text-gray-400 text-xs">SEXO</th>
                      <th className="text-left px-3 py-2 text-gray-400 text-xs">PRESENTACIÓN</th>
                      <th className="text-right px-3 py-2 text-gray-400 text-xs">CANT</th>
                      <th className="text-right px-3 py-2 text-gray-400 text-xs">PESO (KG)</th>
                      <th className="text-right px-3 py-2 text-gray-400 text-xs">PRECIO/KG</th>
                      <th className="text-right px-3 py-2 text-gray-400 text-xs">SUBTOTAL</th>
                      <th className="text-center px-3 py-2 text-gray-400 text-xs">ACCIÓN</th>
                    </tr>
                  </thead>
                  <tbody>
                    {formulario.items.map((item) => (
                      <tr key={item.id} className="border-t border-zinc-700">
                        <td className="px-3 py-2 text-white text-sm">{item.tipoAve}</td>
                        <td className="px-3 py-2 text-gray-300 text-sm">{item.variedad || '-'}</td>
                        <td className="px-3 py-2 text-gray-300 text-sm">{item.sexo || '-'}</td>
                        <td className="px-3 py-2 text-gray-300 text-sm">{item.presentacion}</td>
                        <td className="px-3 py-2 text-right text-white text-sm">{item.cantidad}</td>
                        <td className="px-3 py-2 text-right text-white text-sm">{item.pesoKg.toFixed(2)}</td>
                        <td className="px-3 py-2 text-right text-white text-sm">S/ {item.precioUnitario.toFixed(2)}</td>
                        <td className="px-3 py-2 text-right text-green-400 font-medium text-sm">S/ {item.subtotal.toFixed(2)}</td>
                        <td className="px-3 py-2 text-center">
                          <button
                            onClick={() => eliminarItem(item.id)}
                            className="text-red-400 hover:text-red-300 transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-zinc-900/50 border-t-2 border-amber-500/30">
                    <tr>
                      <td colSpan={7} className="px-3 py-3 text-right text-amber-400 font-bold">TOTAL:</td>
                      <td className="px-3 py-3 text-right text-green-400 font-bold text-base">S/ {calcularTotal().toFixed(2)}</td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}

          {/* Notas */}
          <div>
            <label className="block text-gray-400 text-sm mb-2">Notas adicionales</label>
            <textarea
              value={formulario.notas}
              onChange={(e) => setFormulario({ ...formulario, notas: e.target.value })}
              rows={3}
              className="w-full px-4 py-2.5 bg-zinc-900 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-amber-500"
              placeholder="Observaciones, instrucciones especiales, etc."
            />
          </div>

          {/* Botones */}
          <div className="flex gap-3 justify-end">
            <button
              onClick={onClose}
              className="px-6 py-2.5 bg-zinc-700 hover:bg-zinc-600 text-white rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleSubmit}
              className="px-6 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-black font-medium rounded-lg transition-all"
            >
              Crear Pedido
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
