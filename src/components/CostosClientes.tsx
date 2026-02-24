import { useState, useMemo } from "react";
import {
  Search,
  DollarSign,
  User,
  Bird,
  X,
  ChevronDown,
  ChevronUp,
  Settings,
  Trash2,
  Check,
  Users,
  TrendingUp,
  TrendingDown,
  CheckSquare,
  Square,
} from "lucide-react";
import { useApp } from "../contexts/AppContext";
import { toast } from "sonner";

// ============ TIPOS ============
interface PrecioGeneral {
  tipoAveId: string;
  tipoAveNombre: string;
  variedad: string;
  color: string;
  precioVivo: number;
  precioPelado: number;
  precioDestripado: number;
  selected: boolean;
}

interface PrecioCliente {
  id: string;
  tipoAveId: string;
  tipoAveNombre: string;
  variedad: string;
  color: string;
  precioVivo: number;
  precioPelado: number;
  precioDestripado: number;
}

export function CostosClientes() {
  const {
    clientes,
    tiposAve,
    costosClientes,
    setCostosClientes,
  } = useApp();

  // ============ ESTADOS ============
  const [searchTerm, setSearchTerm] = useState("");
  const [filterTipoAve, setFilterTipoAve] = useState<string>("all");
  const [filterPrecioMin, setFilterPrecioMin] = useState("");
  const [filterPrecioMax, setFilterPrecioMax] = useState("");
  const [expandedClients, setExpandedClients] = useState<Set<string>>(new Set());
  const [selectedClientes, setSelectedClientes] = useState<Set<string>>(new Set());

  // Estado para Costos Generales
  const [preciosGenerales, setPreciosGenerales] = useState<PrecioGeneral[]>([]);
  const [editingGeneralCell, setEditingGeneralCell] = useState<string | null>(null);
  const [editingGeneralValue, setEditingGeneralValue] = useState("");

  // Estado para el modal de gestion individual
  const [isGestionModalOpen, setIsGestionModalOpen] = useState(false);
  const [selectedClienteId, setSelectedClienteId] = useState<string | null>(null);

  // Estado para edicion inline de precios de clientes
  const [editingClientCell, setEditingClientCell] = useState<string | null>(null);
  const [editingClientValue, setEditingClientValue] = useState("");

  // Estado para ajuste masivo
  const [isAjusteMasivoOpen, setIsAjusteMasivoOpen] = useState(false);
  const [ajusteTipo, setAjusteTipo] = useState<"subir" | "bajar">("subir");
  const [ajustePorcentaje, setAjustePorcentaje] = useState("");
  const [ajusteMonto, setAjusteMonto] = useState("");
  const [ajusteMetodo, setAjusteMetodo] = useState<"porcentaje" | "monto">("porcentaje");
  const [ajusteFilterTipoAve, setAjusteFilterTipoAve] = useState<string>("all");
  const [ajusteFilterVariedad, setAjusteFilterVariedad] = useState<string>("all");
  const [ajusteFilterPresentacion, setAjusteFilterPresentacion] = useState<string>("all");

  // ============ AVES ACTIVAS ============
  const avesActivas = useMemo(
    () => tiposAve.filter((t) => (t.categoria === "Ave" || !t.categoria) && t.estado !== "Inactivo"),
    [tiposAve]
  );

  // ============ GENERAR FILAS DE PRECIOS GENERALES ============
  const generarPreciosGenerales = (): PrecioGeneral[] => {
    const filas: PrecioGeneral[] = [];
    avesActivas.forEach((tipo) => {
      if (tipo.tieneSexo && !tipo.tieneVariedad) {
        filas.push({
          tipoAveId: tipo.id,
          tipoAveNombre: tipo.nombre,
          variedad: "Mixto",
          color: tipo.color,
          precioVivo: 0,
          precioPelado: 0,
          precioDestripado: 0,
          selected: false,
        });
      } else if (tipo.tieneVariedad && tipo.variedades) {
        tipo.variedades.forEach((v) => {
          filas.push({
            tipoAveId: tipo.id,
            tipoAveNombre: tipo.nombre,
            variedad: v,
            color: tipo.color,
            precioVivo: 0,
            precioPelado: 0,
            precioDestripado: 0,
            selected: false,
          });
        });
      } else {
        filas.push({
          tipoAveId: tipo.id,
          tipoAveNombre: tipo.nombre,
          variedad: "-",
          color: tipo.color,
          precioVivo: 0,
          precioPelado: 0,
          precioDestripado: 0,
          selected: false,
        });
      }
    });
    return filas;
  };

  // Inicializar precios generales si estan vacios
  if (preciosGenerales.length === 0 && avesActivas.length > 0) {
    const saved = localStorage.getItem("avicola_preciosGenerales");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const base = generarPreciosGenerales();
        const merged = base.map((b) => {
          const found = parsed.find(
            (p: PrecioGeneral) => p.tipoAveId === b.tipoAveId && p.variedad === b.variedad
          );
          return found
            ? {
                ...b,
                precioVivo: found.precioVivo || 0,
                precioPelado: found.precioPelado || 0,
                precioDestripado: found.precioDestripado || 0,
              }
            : b;
        });
        setPreciosGenerales(merged);
      } catch {
        setPreciosGenerales(generarPreciosGenerales());
      }
    } else {
      setPreciosGenerales(generarPreciosGenerales());
    }
  }

  // Guardar precios generales
  const guardarPreciosGenerales = (precios: PrecioGeneral[]) => {
    setPreciosGenerales(precios);
    localStorage.setItem("avicola_preciosGenerales", JSON.stringify(precios));
  };

  // ============ PRECIOS POR CLIENTE ============
  const getPreciosCliente = (clienteId: string): PrecioCliente[] => {
    const costos = costosClientes.filter((c) => c.clienteId === clienteId);
    const mapaPrecios = new Map<string, PrecioCliente>();

    costos.forEach((c) => {
      const variedad = c.variedad || (c.sexo ? "Mixto" : "-");
      const key = `${c.tipoAveId}_${variedad}`;
      const tipoAve = tiposAve.find((t) => t.id === c.tipoAveId);
      mapaPrecios.set(key, {
        id: c.id,
        tipoAveId: c.tipoAveId,
        tipoAveNombre: tipoAve?.nombre || c.tipoAveNombre,
        variedad,
        color: tipoAve?.color || "#888",
        precioVivo: c.precioVivo || (c.presentacion === "Vivo" ? c.precioPorKg : 0),
        precioPelado: c.precioPelado || (c.presentacion === "Pelado" ? c.precioPorKg : 0),
        precioDestripado: c.precioDestripado || (c.presentacion === "Destripado" ? c.precioPorKg : 0),
      });
    });

    return Array.from(mapaPrecios.values());
  };

  // ============ FILTRADO DE CLIENTES ============
  const filteredClientes = useMemo(() => {
    return clientes.filter((cliente) => {
      const matchesSearch = cliente.nombre.toLowerCase().includes(searchTerm.toLowerCase());

      if (filterTipoAve !== "all") {
        const preciosCliente = getPreciosCliente(cliente.id);
        const tieneAve = preciosCliente.some((p) => p.tipoAveId === filterTipoAve);
        if (!tieneAve) return false;
      }

      if (filterPrecioMin || filterPrecioMax) {
        const preciosCliente = getPreciosCliente(cliente.id);
        const min = parseFloat(filterPrecioMin) || 0;
        const max = parseFloat(filterPrecioMax) || Infinity;
        const tieneEnRango = preciosCliente.some((p) => {
          const precios = [p.precioVivo, p.precioPelado, p.precioDestripado].filter((v) => v > 0);
          return precios.some((pr) => pr >= min && pr <= max);
        });
        if (!tieneEnRango && preciosCliente.length > 0) return false;
      }

      return matchesSearch;
    });
  }, [clientes, searchTerm, filterTipoAve, filterPrecioMin, filterPrecioMax, costosClientes]);

  // ============ HANDLERS GENERALES ============
  const handleEditGeneralCell = (
    rowIdx: number,
    field: "precioVivo" | "precioPelado" | "precioDestripado"
  ) => {
    const key = `${rowIdx}_${field}`;
    setEditingGeneralCell(key);
    setEditingGeneralValue(preciosGenerales[rowIdx][field].toString());
  };

  const handleSaveGeneralCell = (
    rowIdx: number,
    field: "precioVivo" | "precioPelado" | "precioDestripado"
  ) => {
    const valor = parseFloat(editingGeneralValue) || 0;
    const nuevos = [...preciosGenerales];
    nuevos[rowIdx] = { ...nuevos[rowIdx], [field]: valor };
    guardarPreciosGenerales(nuevos);
    setEditingGeneralCell(null);
  };

  const toggleGeneralRowSelection = (rowIdx: number) => {
    const nuevos = [...preciosGenerales];
    nuevos[rowIdx] = { ...nuevos[rowIdx], selected: !nuevos[rowIdx].selected };
    guardarPreciosGenerales(nuevos);
  };

  const toggleSelectAllGeneral = () => {
    const allSelected = preciosGenerales.every((p) => p.selected);
    const nuevos = preciosGenerales.map((p) => ({ ...p, selected: !allSelected }));
    guardarPreciosGenerales(nuevos);
  };

  // ============ SELECCION DE CLIENTES ============
  const toggleClienteSelection = (clienteId: string) => {
    const newSet = new Set(selectedClientes);
    if (newSet.has(clienteId)) newSet.delete(clienteId);
    else newSet.add(clienteId);
    setSelectedClientes(newSet);
  };

  const toggleSelectAllClientes = () => {
    if (selectedClientes.size === filteredClientes.length) {
      setSelectedClientes(new Set());
    } else {
      setSelectedClientes(new Set(filteredClientes.map((c) => c.id)));
    }
  };

  // ============ APLICAR PRECIOS GENERALES A CLIENTES ============
  const aplicarPreciosAClientes = () => {
    const filasSeleccionadas = preciosGenerales.filter((p) => p.selected);
    if (filasSeleccionadas.length === 0) {
      toast.error("Seleccione al menos un producto de la tabla general");
      return;
    }
    if (selectedClientes.size === 0) {
      toast.error("Seleccione al menos un cliente");
      return;
    }

    const hoy = new Date().toISOString().split("T")[0];
    const nuevosCostos = [...costosClientes];

    selectedClientes.forEach((clienteId) => {
      const cliente = clientes.find((c) => c.id === clienteId);
      if (!cliente) return;

      filasSeleccionadas.forEach((fila) => {
        const idxToRemove: number[] = [];
        nuevosCostos.forEach((c, idx) => {
          if (c.clienteId === clienteId && c.tipoAveId === fila.tipoAveId) {
            const varMatch = (c.variedad || (c.sexo ? "Mixto" : "-")) === fila.variedad;
            if (varMatch) idxToRemove.push(idx);
          }
        });
        idxToRemove.reverse().forEach((idx) => nuevosCostos.splice(idx, 1));

        const label =
          fila.variedad !== "-" && fila.variedad !== "Mixto"
            ? `${fila.tipoAveNombre} - ${fila.variedad}`
            : fila.tipoAveNombre;

        nuevosCostos.push({
          id: `${Date.now()}-${clienteId}-${fila.tipoAveId}-${fila.variedad}-${Math.random()}`,
          clienteId,
          clienteNombre: cliente.nombre,
          tipoAveId: fila.tipoAveId,
          tipoAveNombre: label,
          variedad: fila.variedad !== "-" ? fila.variedad : undefined,
          precioPorKg: fila.precioVivo || fila.precioPelado || fila.precioDestripado,
          precioVivo: fila.precioVivo,
          precioPelado: fila.precioPelado,
          precioDestripado: fila.precioDestripado,
          fecha: hoy,
        });
      });
    });

    setCostosClientes(nuevosCostos);
    toast.success(`Precios aplicados a ${selectedClientes.size} cliente(s)`);
    setSelectedClientes(new Set());
    guardarPreciosGenerales(preciosGenerales.map((p) => ({ ...p, selected: false })));
  };

  // ============ HANDLER INDIVIDUAL (GESTIONAR) ============
  const handleOpenGestionModal = (clienteId: string) => {
    setSelectedClienteId(clienteId);
    setIsGestionModalOpen(true);
  };

  const handleCloseGestionModal = () => {
    setIsGestionModalOpen(false);
    setSelectedClienteId(null);
  };

  // Estado interno del modal de gestion
  const [gestionPrecios, setGestionPrecios] = useState<{
    [key: string]: { vivo: string; pelado: string; destripado: string };
  }>({});

  const initGestionPrecios = (clienteId: string) => {
    const precios: { [key: string]: { vivo: string; pelado: string; destripado: string } } = {};
    const existentes = getPreciosCliente(clienteId);

    avesActivas.forEach((tipo) => {
      if (tipo.tieneSexo && !tipo.tieneVariedad) {
        const key = `${tipo.id}_Mixto`;
        const exist = existentes.find((e) => e.tipoAveId === tipo.id && e.variedad === "Mixto");
        precios[key] = {
          vivo: exist ? (exist.precioVivo > 0 ? exist.precioVivo.toString() : "") : "",
          pelado: exist ? (exist.precioPelado > 0 ? exist.precioPelado.toString() : "") : "",
          destripado: exist ? (exist.precioDestripado > 0 ? exist.precioDestripado.toString() : "") : "",
        };
      } else if (tipo.tieneVariedad && tipo.variedades) {
        tipo.variedades.forEach((v) => {
          const key = `${tipo.id}_${v}`;
          const exist = existentes.find((e) => e.tipoAveId === tipo.id && e.variedad === v);
          precios[key] = {
            vivo: exist ? (exist.precioVivo > 0 ? exist.precioVivo.toString() : "") : "",
            pelado: exist ? (exist.precioPelado > 0 ? exist.precioPelado.toString() : "") : "",
            destripado: exist
              ? exist.precioDestripado > 0
                ? exist.precioDestripado.toString()
                : ""
              : "",
          };
        });
      } else {
        const key = `${tipo.id}_-`;
        const exist = existentes.find((e) => e.tipoAveId === tipo.id && e.variedad === "-");
        precios[key] = {
          vivo: exist ? (exist.precioVivo > 0 ? exist.precioVivo.toString() : "") : "",
          pelado: exist ? (exist.precioPelado > 0 ? exist.precioPelado.toString() : "") : "",
          destripado: exist ? (exist.precioDestripado > 0 ? exist.precioDestripado.toString() : "") : "",
        };
      }
    });
    setGestionPrecios(precios);
  };

  const handleSubmitGestion = () => {
    if (!selectedClienteId) return;
    const cliente = clientes.find((c) => c.id === selectedClienteId);
    if (!cliente) return;

    const hoy = new Date().toISOString().split("T")[0];
    const nuevosCostos = [...costosClientes];

    Object.entries(gestionPrecios).forEach(([key, precios]) => {
      const [tipoAveId, ...rest] = key.split("_");
      const variedad = rest.join("_");
      const vivo = parseFloat(precios.vivo) || 0;
      const pelado = parseFloat(precios.pelado) || 0;
      const destripado = parseFloat(precios.destripado) || 0;

      if (vivo === 0 && pelado === 0 && destripado === 0) return;

      const tipo = tiposAve.find((t) => t.id === tipoAveId);
      if (!tipo) return;

      const label =
        variedad !== "-" && variedad !== "Mixto"
          ? `${tipo.nombre} - ${variedad}`
          : tipo.nombre;

      const idxToRemove: number[] = [];
      nuevosCostos.forEach((c, idx) => {
        if (c.clienteId === selectedClienteId && c.tipoAveId === tipoAveId) {
          const varMatch = (c.variedad || (c.sexo ? "Mixto" : "-")) === variedad;
          if (varMatch) idxToRemove.push(idx);
        }
      });
      idxToRemove.reverse().forEach((idx) => nuevosCostos.splice(idx, 1));

      nuevosCostos.push({
        id: `${Date.now()}-${selectedClienteId}-${tipoAveId}-${variedad}-${Math.random()}`,
        clienteId: selectedClienteId,
        clienteNombre: cliente.nombre,
        tipoAveId,
        tipoAveNombre: label,
        variedad: variedad !== "-" ? variedad : undefined,
        precioPorKg: vivo || pelado || destripado,
        precioVivo: vivo,
        precioPelado: pelado,
        precioDestripado: destripado,
        fecha: hoy,
      });
    });

    setCostosClientes(nuevosCostos);
    toast.success(`Precios asignados para ${cliente.nombre}`);
    handleCloseGestionModal();
  };

  // ============ ELIMINAR PRECIO INDIVIDUAL ============
  const handleEliminarPrecioCliente = (costoId: string, clienteNombre: string) => {
    if (confirm(`Eliminar este producto de ${clienteNombre}?`)) {
      setCostosClientes(costosClientes.filter((c) => c.id !== costoId));
      toast.success("Producto eliminado");
    }
  };

  // ============ EDICION INLINE DE CLIENTE ============
  const handleEditClientCell = (costoId: string, field: string, value: number) => {
    setEditingClientCell(`${costoId}_${field}`);
    setEditingClientValue(value.toString());
  };

  const handleSaveClientCell = (
    costoId: string,
    field: "precioVivo" | "precioPelado" | "precioDestripado"
  ) => {
    const valor = parseFloat(editingClientValue) || 0;
    const costosActualizados = costosClientes.map((c) => {
      if (c.id === costoId) {
        const updated = { ...c, [field]: valor };
        updated.precioPorKg =
          updated.precioVivo || updated.precioPelado || updated.precioDestripado || 0;
        return updated;
      }
      return c;
    });
    setCostosClientes(costosActualizados);
    setEditingClientCell(null);
  };

  // ============ TOGGLE EXPANSION ============
  const toggleClientExpansion = (clienteId: string) => {
    const n = new Set(expandedClients);
    if (n.has(clienteId)) n.delete(clienteId);
    else n.add(clienteId);
    setExpandedClients(n);
  };

  // ============ VARIEDADES DISPONIBLES PARA FILTRO AJUSTE ============
  const ajusteVariedadesDisponibles = useMemo(() => {
    if (ajusteFilterTipoAve === "all") return [];
    const tipo = tiposAve.find((t) => t.id === ajusteFilterTipoAve);
    if (!tipo) return [];
    if (tipo.tieneSexo && !tipo.tieneVariedad) return ["Mixto"];
    if (tipo.tieneVariedad && tipo.variedades) return tipo.variedades;
    return ["-"];
  }, [ajusteFilterTipoAve, tiposAve]);

  // ============ AJUSTE MASIVO ============
  const handleAjusteMasivo = () => {
    if (selectedClientes.size === 0) {
      toast.error("Seleccione al menos un cliente");
      return;
    }

    const porcentaje = parseFloat(ajustePorcentaje) || 0;
    const monto = parseFloat(ajusteMonto) || 0;

    if (ajusteMetodo === "porcentaje" && porcentaje === 0) {
      toast.error("Ingrese un porcentaje valido");
      return;
    }
    if (ajusteMetodo === "monto" && monto === 0) {
      toast.error("Ingrese un monto valido");
      return;
    }

    const factor = ajusteTipo === "subir" ? 1 : -1;

    let registrosAfectados = 0;
    const costosActualizados = costosClientes.map((c) => {
      if (!selectedClientes.has(c.clienteId)) return c;

      // Filtro por tipo de ave
      if (ajusteFilterTipoAve !== "all" && c.tipoAveId !== ajusteFilterTipoAve) return c;

      // Filtro por variedad
      if (ajusteFilterVariedad !== "all") {
        const costVar = c.variedad || (c.sexo ? "Mixto" : "-");
        if (costVar !== ajusteFilterVariedad) return c;
      }

      const updated = { ...c };
      const aplicarVivo = ajusteFilterPresentacion === "all" || ajusteFilterPresentacion === "Vivo";
      const aplicarPelado = ajusteFilterPresentacion === "all" || ajusteFilterPresentacion === "Pelado";
      const aplicarDestripado = ajusteFilterPresentacion === "all" || ajusteFilterPresentacion === "Destripado";

      if (ajusteMetodo === "porcentaje") {
        const mult = 1 + (factor * porcentaje) / 100;
        if (aplicarVivo) updated.precioVivo = Math.max(0, (updated.precioVivo || 0) * mult);
        if (aplicarPelado) updated.precioPelado = Math.max(0, (updated.precioPelado || 0) * mult);
        if (aplicarDestripado) updated.precioDestripado = Math.max(0, (updated.precioDestripado || 0) * mult);
      } else {
        const delta = factor * monto;
        if (aplicarVivo) updated.precioVivo = Math.max(0, (updated.precioVivo || 0) + delta);
        if (aplicarPelado) updated.precioPelado = Math.max(0, (updated.precioPelado || 0) + delta);
        if (aplicarDestripado) updated.precioDestripado = Math.max(0, (updated.precioDestripado || 0) + delta);
      }
      updated.precioPorKg = updated.precioVivo || updated.precioPelado || updated.precioDestripado || 0;
      registrosAfectados++;
      return updated;
    });

    if (registrosAfectados === 0) {
      toast.error("No se encontraron registros que coincidan con los filtros seleccionados");
      return;
    }

    setCostosClientes(costosActualizados);
    toast.success(
      `Precios ${ajusteTipo === "subir" ? "incrementados" : "reducidos"} en ${registrosAfectados} registro(s) de ${selectedClientes.size} cliente(s)`
    );
    setIsAjusteMasivoOpen(false);
    setAjustePorcentaje("");
    setAjusteMonto("");
    setAjusteFilterTipoAve("all");
    setAjusteFilterVariedad("all");
    setAjusteFilterPresentacion("all");
  };

  const clienteSeleccionado = clientes.find((c) => c.id === selectedClienteId);

  return (
    <div className="space-y-5">
      {/* ========== SECCION 1: COSTOS GENERALES ========== */}
      <div
        className="backdrop-blur-xl rounded-xl overflow-hidden"
        style={{
          background: "rgba(0, 0, 0, 0.4)",
          border: "1px solid rgba(204, 170, 0, 0.3)",
        }}
      >
        <div
          className="px-4 sm:px-6 py-4 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-3"
          style={{
            borderColor: "rgba(204, 170, 0, 0.2)",
            background: "linear-gradient(135deg, rgba(204, 170, 0, 0.1), rgba(0, 0, 0, 0.5))",
          }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, #ccaa00, #b8941e)" }}
            >
              <DollarSign className="w-5 h-5 text-black" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-white">Costos Generales</h2>
              <p className="text-xs text-gray-400">
                Tabla de precios base por tipo de ave y presentacion
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {preciosGenerales.some((p) => p.selected) && selectedClientes.size > 0 && (
              <button
                onClick={aplicarPreciosAClientes}
                className="px-4 py-2 rounded-lg text-sm font-bold transition-all hover:scale-105 flex items-center gap-2"
                style={{
                  background: "linear-gradient(to right, #0d4a24, #166534, #b8941e, #ccaa00)",
                  color: "white",
                  boxShadow: "0 4px 15px rgba(204, 170, 0, 0.4)",
                }}
              >
                <Check className="w-4 h-4" />
                Aplicar a {selectedClientes.size} cliente(s)
              </button>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full" style={{ minWidth: "650px" }}>
            <thead>
              <tr
                className="bg-black/40 border-b"
                style={{ borderColor: "rgba(204, 170, 0, 0.15)" }}
              >
                <th className="px-3 py-3 text-center w-10">
                  <button
                    onClick={toggleSelectAllGeneral}
                    className="p-1 rounded hover:bg-amber-500/20 transition-colors"
                  >
                    {preciosGenerales.every((p) => p.selected) ? (
                      <CheckSquare className="w-4 h-4 text-amber-400" />
                    ) : (
                      <Square className="w-4 h-4 text-gray-500" />
                    )}
                  </button>
                </th>
                <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-amber-400">
                  Tipo de Ave
                </th>
                <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-amber-400">
                  Variedad
                </th>
                <th className="px-4 py-3 text-right text-xs font-bold uppercase tracking-wider text-amber-400">
                  Vivo
                </th>
                <th className="px-4 py-3 text-right text-xs font-bold uppercase tracking-wider text-amber-400">
                  Pelado
                </th>
                <th className="px-4 py-3 text-right text-xs font-bold uppercase tracking-wider text-amber-400">
                  Destripado
                </th>
              </tr>
            </thead>
            <tbody>
              {preciosGenerales.map((fila, idx) => (
                <tr
                  key={`${fila.tipoAveId}_${fila.variedad}`}
                  className={`border-b transition-colors hover:bg-white/5 ${fila.selected ? "bg-amber-500/10" : ""}`}
                  style={{ borderColor: "rgba(255, 255, 255, 0.05)" }}
                >
                  <td className="px-3 py-3 text-center">
                    <button
                      onClick={() => toggleGeneralRowSelection(idx)}
                      className="p-1 rounded hover:bg-amber-500/20 transition-colors"
                    >
                      {fila.selected ? (
                        <CheckSquare className="w-4 h-4 text-amber-400" />
                      ) : (
                        <Square className="w-4 h-4 text-gray-500" />
                      )}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-7 h-7 rounded-lg flex items-center justify-center"
                        style={{
                          background: `${fila.color}20`,
                          border: `1px solid ${fila.color}40`,
                        }}
                      >
                        <Bird className="w-3.5 h-3.5" style={{ color: fila.color }} />
                      </div>
                      <span className="text-white font-bold text-sm">{fila.tipoAveNombre}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-gray-300 text-sm">{fila.variedad}</span>
                  </td>
                  {(["precioVivo", "precioPelado", "precioDestripado"] as const).map((field) => {
                    const cellKey = `${idx}_${field}`;
                    const isEditing = editingGeneralCell === cellKey;
                    return (
                      <td key={field} className="px-4 py-3 text-right">
                        {isEditing ? (
                          <div className="flex items-center justify-end gap-1">
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              value={editingGeneralValue}
                              onChange={(e) => setEditingGeneralValue(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") handleSaveGeneralCell(idx, field);
                                if (e.key === "Escape") setEditingGeneralCell(null);
                              }}
                              autoFocus
                              className="w-24 px-2 py-1 rounded-lg text-sm text-right text-white bg-gray-800 border border-amber-500/50 focus:outline-none focus:border-amber-400"
                            />
                            <button
                              onClick={() => handleSaveGeneralCell(idx, field)}
                              className="p-1 rounded hover:bg-green-500/20"
                            >
                              <Check className="w-3.5 h-3.5 text-green-400" />
                            </button>
                          </div>
                        ) : (
                          <span
                            className={`cursor-pointer hover:bg-amber-500/10 px-2 py-1 rounded transition-colors text-sm font-bold tabular-nums ${fila[field] > 0 ? "text-white" : "text-gray-600"}`}
                            onDoubleClick={() => handleEditGeneralCell(idx, field)}
                            title="Doble clic para editar"
                          >
                            {fila[field] > 0 ? `S/ ${fila[field].toFixed(2)}` : "\u2014"}
                          </span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {preciosGenerales.length === 0 && (
          <div className="text-center py-8">
            <Bird className="w-12 h-12 mx-auto mb-3 text-gray-600" />
            <p className="text-gray-400 text-sm">No hay aves activas registradas</p>
          </div>
        )}

        {preciosGenerales.some((p) => p.selected) && (
          <div
            className="px-4 py-3 border-t flex items-center gap-2 text-xs text-amber-400"
            style={{
              borderColor: "rgba(204, 170, 0, 0.15)",
              background: "rgba(204, 170, 0, 0.05)",
            }}
          >
            <CheckSquare className="w-4 h-4" />
            <span>
              {preciosGenerales.filter((p) => p.selected).length} producto(s) seleccionado(s) —
              Seleccione clientes abajo y presione "Aplicar"
            </span>
          </div>
        )}
      </div>

      {/* ========== ACCIONES MASIVAS ========== */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <button
          onClick={() => setIsAjusteMasivoOpen(true)}
          className="px-4 py-2.5 rounded-xl text-sm font-bold transition-all hover:scale-105 flex items-center gap-2"
          style={{
            background: "rgba(168, 85, 247, 0.15)",
            border: "1px solid rgba(168, 85, 247, 0.3)",
            color: "#a855f7",
          }}
        >
          <TrendingUp className="w-4 h-4" />
          Ajuste Masivo de Precios
        </button>

        {selectedClientes.size > 0 && (
          <span className="px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30">
            {selectedClientes.size} cliente(s) seleccionado(s)
          </span>
        )}
      </div>

      {/* ========== SECCION 2: BUSQUEDA Y FILTROS ========== */}
      <div
        className="backdrop-blur-xl rounded-xl p-3 sm:p-4"
        style={{
          background: "rgba(0, 0, 0, 0.3)",
          border: "1px solid rgba(255, 255, 255, 0.1)",
        }}
      >
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar cliente..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-lg text-sm text-white placeholder-gray-400"
              style={{
                background: "rgba(255, 255, 255, 0.05)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
              }}
            />
          </div>
          <select
            value={filterTipoAve}
            onChange={(e) => setFilterTipoAve(e.target.value)}
            className="px-3 py-2.5 rounded-lg text-sm text-white"
            style={{
              background: "rgba(255, 255, 255, 0.05)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
            }}
          >
            <option value="all">Todos los tipos</option>
            {avesActivas.map((t) => (
              <option key={t.id} value={t.id}>
                {t.nombre}
              </option>
            ))}
          </select>
          <div className="flex gap-2">
            <input
              type="number"
              placeholder="Precio min"
              value={filterPrecioMin}
              onChange={(e) => setFilterPrecioMin(e.target.value)}
              className="w-28 px-3 py-2.5 rounded-lg text-sm text-white placeholder-gray-500"
              style={{
                background: "rgba(255, 255, 255, 0.05)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
              }}
            />
            <input
              type="number"
              placeholder="Precio max"
              value={filterPrecioMax}
              onChange={(e) => setFilterPrecioMax(e.target.value)}
              className="w-28 px-3 py-2.5 rounded-lg text-sm text-white placeholder-gray-500"
              style={{
                background: "rgba(255, 255, 255, 0.05)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
              }}
            />
          </div>
        </div>

        {/* Boton seleccionar todos los clientes */}
        <div
          className="mt-3 flex items-center gap-3 pt-3 border-t"
          style={{ borderColor: "rgba(255, 255, 255, 0.05)" }}
        >
          <button
            onClick={toggleSelectAllClientes}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all hover:scale-105"
            style={{
              background:
                selectedClientes.size === filteredClientes.length && filteredClientes.length > 0
                  ? "rgba(204, 170, 0, 0.2)"
                  : "rgba(255, 255, 255, 0.05)",
              border: "1px solid rgba(204, 170, 0, 0.2)",
              color: "#ccaa00",
            }}
          >
            {selectedClientes.size === filteredClientes.length && filteredClientes.length > 0 ? (
              <CheckSquare className="w-3.5 h-3.5" />
            ) : (
              <Square className="w-3.5 h-3.5" />
            )}
            Seleccionar todos ({filteredClientes.length})
          </button>
        </div>
      </div>

      {/* ========== SECCION 3: TARJETAS DE CLIENTES ========== */}
      <div className="grid grid-cols-1 gap-4">
        {filteredClientes.map((cliente) => {
          const preciosCliente = getPreciosCliente(cliente.id);
          const isExpanded = expandedClients.has(cliente.id);
          const isSelected = selectedClientes.has(cliente.id);

          return (
            <div
              key={cliente.id}
              className={`backdrop-blur-xl rounded-xl overflow-hidden transition-all ${isSelected ? "ring-2 ring-amber-500/50" : ""}`}
              style={{
                background: "rgba(0, 0, 0, 0.3)",
                border: isSelected
                  ? "1px solid rgba(204, 170, 0, 0.5)"
                  : "1px solid rgba(204, 170, 0, 0.2)",
              }}
            >
              {/* Header del Cliente */}
              <div className="p-4 sm:p-5">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    {/* Checkbox de seleccion */}
                    <button
                      onClick={() => toggleClienteSelection(cliente.id)}
                      className="p-1 rounded hover:bg-amber-500/20 transition-colors flex-shrink-0"
                    >
                      {isSelected ? (
                        <CheckSquare className="w-5 h-5 text-amber-400" />
                      ) : (
                        <Square className="w-5 h-5 text-gray-500" />
                      )}
                    </button>
                    <div
                      className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: "linear-gradient(135deg, #ccaa00, #b8941e)" }}
                    >
                      <User className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base sm:text-lg font-bold text-white truncate">
                        {cliente.nombre}
                      </h3>
                      <p className="text-xs text-gray-400">
                        {preciosCliente.length}{" "}
                        {preciosCliente.length === 1 ? "producto" : "productos"} configurados
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => {
                        handleOpenGestionModal(cliente.id);
                        initGestionPrecios(cliente.id);
                      }}
                      className="px-3 py-2 rounded-lg font-bold transition-all hover:scale-105 flex items-center gap-1.5 text-xs sm:text-sm"
                      style={{
                        background:
                          "linear-gradient(to right, #0d4a24, #166534, #b8941e, #ccaa00)",
                        color: "white",
                        boxShadow: "0 4px 15px rgba(204, 170, 0, 0.3)",
                      }}
                    >
                      <Settings className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Gestionar</span>
                    </button>
                    <button
                      onClick={() => toggleClientExpansion(cliente.id)}
                      className="p-2 rounded-lg transition-all hover:scale-105"
                      style={{
                        background: "rgba(255, 255, 255, 0.1)",
                        border: "1px solid rgba(255, 255, 255, 0.2)",
                      }}
                    >
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4 text-gray-400" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-gray-400" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Tabla de precios del cliente (expandible) */}
                {isExpanded && (
                  <div
                    className="mt-4 pt-4 border-t"
                    style={{ borderColor: "rgba(255, 255, 255, 0.1)" }}
                  >
                    {preciosCliente.length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="w-full" style={{ minWidth: "500px" }}>
                          <thead>
                            <tr
                              className="bg-black/30 border-b"
                              style={{ borderColor: "rgba(255, 255, 255, 0.05)" }}
                            >
                              <th className="px-3 py-2 text-left text-xs font-bold uppercase tracking-wider text-amber-400">
                                Producto
                              </th>
                              <th className="px-3 py-2 text-left text-xs font-bold uppercase tracking-wider text-amber-400">
                                Variedad
                              </th>
                              <th className="px-3 py-2 text-right text-xs font-bold uppercase tracking-wider text-amber-400">
                                Vivo
                              </th>
                              <th className="px-3 py-2 text-right text-xs font-bold uppercase tracking-wider text-amber-400">
                                Pelado
                              </th>
                              <th className="px-3 py-2 text-right text-xs font-bold uppercase tracking-wider text-amber-400">
                                Destripado
                              </th>
                              <th className="px-3 py-2 text-center text-xs font-bold uppercase tracking-wider text-amber-400 w-10"></th>
                            </tr>
                          </thead>
                          <tbody>
                            {preciosCliente.map((precio) => (
                              <tr
                                key={precio.id}
                                className="border-b hover:bg-white/5 transition-colors"
                                style={{ borderColor: "rgba(255, 255, 255, 0.03)" }}
                              >
                                <td className="px-3 py-2.5">
                                  <div className="flex items-center gap-2">
                                    <div
                                      className="w-6 h-6 rounded flex items-center justify-center"
                                      style={{
                                        background: `${precio.color}20`,
                                        border: `1px solid ${precio.color}40`,
                                      }}
                                    >
                                      <Bird
                                        className="w-3 h-3"
                                        style={{ color: precio.color }}
                                      />
                                    </div>
                                    <span className="text-white font-medium text-sm">
                                      {precio.tipoAveNombre}
                                    </span>
                                  </div>
                                </td>
                                <td className="px-3 py-2.5 text-gray-300 text-sm">
                                  {precio.variedad}
                                </td>
                                {(
                                  ["precioVivo", "precioPelado", "precioDestripado"] as const
                                ).map((field) => {
                                  const cellKey = `${precio.id}_${field}`;
                                  const isEditingThis = editingClientCell === cellKey;
                                  return (
                                    <td key={field} className="px-3 py-2.5 text-right">
                                      {isEditingThis ? (
                                        <div className="flex items-center justify-end gap-1">
                                          <input
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            value={editingClientValue}
                                            onChange={(e) =>
                                              setEditingClientValue(e.target.value)
                                            }
                                            onKeyDown={(e) => {
                                              if (e.key === "Enter")
                                                handleSaveClientCell(precio.id, field);
                                              if (e.key === "Escape")
                                                setEditingClientCell(null);
                                            }}
                                            autoFocus
                                            className="w-20 px-2 py-1 rounded text-sm text-right text-white bg-gray-800 border border-amber-500/50 focus:outline-none"
                                          />
                                          <button
                                            onClick={() =>
                                              handleSaveClientCell(precio.id, field)
                                            }
                                            className="p-0.5 rounded hover:bg-green-500/20"
                                          >
                                            <Check className="w-3 h-3 text-green-400" />
                                          </button>
                                        </div>
                                      ) : (
                                        <span
                                          className={`cursor-pointer hover:bg-amber-500/10 px-2 py-1 rounded transition-colors text-sm font-bold tabular-nums ${precio[field] > 0 ? "text-white" : "text-gray-600"}`}
                                          onDoubleClick={() =>
                                            handleEditClientCell(
                                              precio.id,
                                              field,
                                              precio[field]
                                            )
                                          }
                                          title="Doble clic para editar"
                                        >
                                          {precio[field] > 0
                                            ? `S/ ${precio[field].toFixed(2)}`
                                            : "\u2014"}
                                        </span>
                                      )}
                                    </td>
                                  );
                                })}
                                <td className="px-3 py-2.5 text-center">
                                  <button
                                    onClick={() =>
                                      handleEliminarPrecioCliente(precio.id, cliente.nombre)
                                    }
                                    className="p-1.5 rounded-lg hover:bg-red-500/20 transition-colors"
                                    title="Eliminar producto"
                                  >
                                    <Trash2 className="w-3.5 h-3.5 text-red-400" />
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="text-center py-6">
                        <Bird className="w-10 h-10 mx-auto mb-2 text-gray-600" />
                        <p className="text-gray-400 text-sm">Sin precios configurados</p>
                        <button
                          onClick={() => {
                            handleOpenGestionModal(cliente.id);
                            initGestionPrecios(cliente.id);
                          }}
                          className="mt-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all hover:scale-105"
                          style={{
                            background: "rgba(204, 170, 0, 0.15)",
                            border: "1px solid rgba(204, 170, 0, 0.3)",
                            color: "#ccaa00",
                          }}
                        >
                          Asignar Precios
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {filteredClientes.length === 0 && (
        <div className="text-center py-12">
          <User className="w-16 h-16 mx-auto mb-4 text-gray-600" />
          <p className="text-gray-400">No se encontraron clientes</p>
        </div>
      )}

      {/* ========== MODAL: GESTIONAR PRECIOS INDIVIDUAL ========== */}
      {isGestionModalOpen && clienteSeleccionado && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 overflow-y-auto"
          style={{ background: "rgba(0, 0, 0, 0.85)" }}
          onClick={handleCloseGestionModal}
        >
          <div
            className="backdrop-blur-2xl rounded-2xl w-full max-w-3xl p-4 sm:p-6 max-h-[90vh] overflow-y-auto"
            style={{
              background:
                "linear-gradient(135deg, rgba(0, 0, 0, 0.7) 0%, rgba(13, 74, 36, 0.3) 50%, rgba(0, 0, 0, 0.7) 100%)",
              border: "2px solid rgba(204, 170, 0, 0.3)",
              boxShadow: "0 30px 60px rgba(0, 0, 0, 0.8)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div
              className="flex items-center justify-between mb-5 pb-4 border-b"
              style={{ borderColor: "rgba(204, 170, 0, 0.2)" }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center"
                  style={{ background: "linear-gradient(135deg, #ccaa00, #b8941e)" }}
                >
                  <Settings className="w-6 h-6 text-black" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Asignar Precios</h2>
                  <p className="text-sm text-gray-400">{clienteSeleccionado.nombre}</p>
                </div>
              </div>
              <button
                onClick={handleCloseGestionModal}
                className="p-2 rounded-xl hover:scale-110 hover:rotate-90 transition-all"
                style={{
                  background: "rgba(239, 68, 68, 0.2)",
                  border: "1px solid rgba(239, 68, 68, 0.3)",
                }}
              >
                <X className="w-5 h-5 text-red-400" />
              </button>
            </div>

            <p className="text-sm text-gray-400 mb-4">
              Asigne precios por Kg para cada tipo de ave y presentacion. Solo aparecen aves{" "}
              <span className="text-green-400 font-bold">Activas</span>. Los precios existentes
              se pre-cargan automaticamente.
            </p>

            {/* Tabla de asignacion */}
            <div className="overflow-x-auto mb-4">
              <table className="w-full" style={{ minWidth: "550px" }}>
                <thead>
                  <tr
                    className="bg-black/30 border-b"
                    style={{ borderColor: "rgba(255, 255, 255, 0.1)" }}
                  >
                    <th className="px-3 py-2.5 text-left text-xs font-bold uppercase tracking-wider text-amber-400">
                      Producto
                    </th>
                    <th className="px-3 py-2.5 text-left text-xs font-bold uppercase tracking-wider text-amber-400">
                      Variedad
                    </th>
                    <th className="px-3 py-2.5 text-right text-xs font-bold uppercase tracking-wider text-amber-400">
                      Vivo (S/)
                    </th>
                    <th className="px-3 py-2.5 text-right text-xs font-bold uppercase tracking-wider text-amber-400">
                      Pelado (S/)
                    </th>
                    <th className="px-3 py-2.5 text-right text-xs font-bold uppercase tracking-wider text-amber-400">
                      Destripado (S/)
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(gestionPrecios).map(([key, precios]) => {
                    const [tipoAveId, ...rest] = key.split("_");
                    const variedad = rest.join("_");
                    const tipo = tiposAve.find((t) => t.id === tipoAveId);
                    if (!tipo) return null;

                    return (
                      <tr
                        key={key}
                        className="border-b hover:bg-white/5"
                        style={{ borderColor: "rgba(255, 255, 255, 0.03)" }}
                      >
                        <td className="px-3 py-2.5">
                          <div className="flex items-center gap-2">
                            <div
                              className="w-7 h-7 rounded-lg flex items-center justify-center"
                              style={{
                                background: `${tipo.color}20`,
                                border: `1px solid ${tipo.color}40`,
                              }}
                            >
                              <Bird className="w-3.5 h-3.5" style={{ color: tipo.color }} />
                            </div>
                            <span className="text-white font-medium text-sm">{tipo.nombre}</span>
                          </div>
                        </td>
                        <td className="px-3 py-2.5 text-gray-300 text-sm">{variedad}</td>
                        {(["vivo", "pelado", "destripado"] as const).map((campo) => (
                          <td key={campo} className="px-3 py-2.5 text-right">
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              value={precios[campo]}
                              onChange={(e) => {
                                setGestionPrecios((prev) => ({
                                  ...prev,
                                  [key]: { ...prev[key], [campo]: e.target.value },
                                }));
                              }}
                              className="w-24 px-2 py-1.5 rounded-lg text-sm text-right text-white placeholder-gray-500"
                              style={{
                                background: "rgba(255, 255, 255, 0.08)",
                                border: `1px solid ${tipo.color}30`,
                              }}
                              placeholder="0.00"
                            />
                          </td>
                        ))}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Botones */}
            <div
              className="flex gap-3 pt-4 border-t"
              style={{ borderColor: "rgba(204, 170, 0, 0.15)" }}
            >
              <button
                onClick={handleCloseGestionModal}
                className="flex-1 px-4 py-2.5 rounded-xl font-bold transition-all hover:scale-105 text-sm"
                style={{
                  background: "rgba(255, 255, 255, 0.1)",
                  border: "1px solid rgba(255, 255, 255, 0.2)",
                  color: "#fff",
                }}
              >
                Cancelar
              </button>
              <button
                onClick={handleSubmitGestion}
                className="flex-1 px-4 py-2.5 rounded-xl font-bold transition-all hover:scale-105 text-sm"
                style={{
                  background: "linear-gradient(to right, #0d4a24, #166534, #b8941e, #ccaa00)",
                  color: "white",
                  boxShadow: "0 4px 15px rgba(204, 170, 0, 0.4)",
                }}
              >
                Guardar Precios
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========== MODAL: AJUSTE MASIVO ========== */}
      {isAjusteMasivoOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6"
          style={{ background: "rgba(0, 0, 0, 0.85)" }}
          onClick={() => setIsAjusteMasivoOpen(false)}
        >
          <div
            className="backdrop-blur-2xl rounded-2xl w-full max-w-md p-5 sm:p-6"
            style={{
              background:
                "linear-gradient(135deg, rgba(0, 0, 0, 0.7) 0%, rgba(168, 85, 247, 0.15) 50%, rgba(0, 0, 0, 0.7) 100%)",
              border: "2px solid rgba(168, 85, 247, 0.3)",
              boxShadow: "0 30px 60px rgba(0, 0, 0, 0.8)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div
              className="flex items-center justify-between mb-5 pb-4 border-b"
              style={{ borderColor: "rgba(168, 85, 247, 0.2)" }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center"
                  style={{ background: "linear-gradient(135deg, #a855f7, #7c3aed)" }}
                >
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Ajuste Masivo</h2>
                  <p className="text-sm text-gray-400">
                    Modificar precios de clientes seleccionados
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsAjusteMasivoOpen(false)}
                className="p-2 rounded-xl hover:scale-110 transition-all"
                style={{ background: "rgba(239, 68, 68, 0.2)" }}
              >
                <X className="w-5 h-5 text-red-400" />
              </button>
            </div>

            {selectedClientes.size === 0 ? (
              <div className="text-center py-6">
                <Users className="w-12 h-12 mx-auto mb-3 text-gray-600" />
                <p className="text-gray-400 text-sm">Primero seleccione clientes en la lista</p>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-purple-300">
                  Se ajustaran los precios de{" "}
                  <span className="font-bold text-white">{selectedClientes.size}</span> cliente(s)
                </p>

                {/* Filtros granulares: Tipo de Ave, Variedad, Presentacion */}
                <div className="space-y-3 p-3 rounded-xl" style={{ background: "rgba(168, 85, 247, 0.05)", border: "1px solid rgba(168, 85, 247, 0.15)" }}>
                  <p className="text-xs font-bold text-purple-300 uppercase tracking-wider">Aplicar a:</p>
                  
                  <div>
                    <label className="block text-xs font-bold mb-1 text-gray-400">Tipo de Ave</label>
                    <select
                      value={ajusteFilterTipoAve}
                      onChange={(e) => { setAjusteFilterTipoAve(e.target.value); setAjusteFilterVariedad("all"); }}
                      className="w-full px-3 py-2 rounded-lg text-sm text-white"
                      style={{ background: "rgba(255, 255, 255, 0.08)", border: "1px solid rgba(168, 85, 247, 0.3)" }}
                    >
                      <option value="all">Todos los tipos</option>
                      {avesActivas.map((t) => (
                        <option key={t.id} value={t.id}>{t.nombre}</option>
                      ))}
                    </select>
                  </div>

                  {ajusteFilterTipoAve !== "all" && ajusteVariedadesDisponibles.length > 1 && (
                    <div>
                      <label className="block text-xs font-bold mb-1 text-gray-400">Variedad</label>
                      <select
                        value={ajusteFilterVariedad}
                        onChange={(e) => setAjusteFilterVariedad(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg text-sm text-white"
                        style={{ background: "rgba(255, 255, 255, 0.08)", border: "1px solid rgba(168, 85, 247, 0.3)" }}
                      >
                        <option value="all">Todas las variedades</option>
                        {ajusteVariedadesDisponibles.map((v) => (
                          <option key={v} value={v}>{v}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-bold mb-1 text-gray-400">Presentacion</label>
                    <select
                      value={ajusteFilterPresentacion}
                      onChange={(e) => setAjusteFilterPresentacion(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg text-sm text-white"
                      style={{ background: "rgba(255, 255, 255, 0.08)", border: "1px solid rgba(168, 85, 247, 0.3)" }}
                    >
                      <option value="all">Todas las presentaciones</option>
                      <option value="Vivo">Vivo</option>
                      <option value="Pelado">Pelado</option>
                      <option value="Destripado">Destripado</option>
                    </select>
                  </div>
                </div>

                {/* Tipo de ajuste: Subir / Bajar */}
                <div className="flex gap-2">
                  <button
                    onClick={() => setAjusteTipo("subir")}
                    className={`flex-1 px-4 py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2 text-sm ${ajusteTipo === "subir" ? "ring-2 ring-green-500" : ""}`}
                    style={{
                      background:
                        ajusteTipo === "subir"
                          ? "rgba(34, 197, 94, 0.2)"
                          : "rgba(255, 255, 255, 0.05)",
                      border:
                        ajusteTipo === "subir"
                          ? "1px solid rgba(34, 197, 94, 0.4)"
                          : "1px solid rgba(255, 255, 255, 0.1)",
                      color: ajusteTipo === "subir" ? "#22c55e" : "#888",
                    }}
                  >
                    <TrendingUp className="w-4 h-4" />
                    Subir Precios
                  </button>
                  <button
                    onClick={() => setAjusteTipo("bajar")}
                    className={`flex-1 px-4 py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2 text-sm ${ajusteTipo === "bajar" ? "ring-2 ring-red-500" : ""}`}
                    style={{
                      background:
                        ajusteTipo === "bajar"
                          ? "rgba(239, 68, 68, 0.2)"
                          : "rgba(255, 255, 255, 0.05)",
                      border:
                        ajusteTipo === "bajar"
                          ? "1px solid rgba(239, 68, 68, 0.4)"
                          : "1px solid rgba(255, 255, 255, 0.1)",
                      color: ajusteTipo === "bajar" ? "#ef4444" : "#888",
                    }}
                  >
                    <TrendingDown className="w-4 h-4" />
                    Bajar Precios
                  </button>
                </div>

                {/* Metodo: Porcentaje / Monto fijo */}
                <div className="flex gap-2">
                  <button
                    onClick={() => setAjusteMetodo("porcentaje")}
                    className="flex-1 px-3 py-2 rounded-lg text-xs font-bold transition-all"
                    style={{
                      background:
                        ajusteMetodo === "porcentaje"
                          ? "rgba(168, 85, 247, 0.2)"
                          : "rgba(255, 255, 255, 0.05)",
                      border: `1px solid ${ajusteMetodo === "porcentaje" ? "rgba(168, 85, 247, 0.4)" : "rgba(255, 255, 255, 0.1)"}`,
                      color: ajusteMetodo === "porcentaje" ? "#c084fc" : "#888",
                    }}
                  >
                    Porcentaje %
                  </button>
                  <button
                    onClick={() => setAjusteMetodo("monto")}
                    className="flex-1 px-3 py-2 rounded-lg text-xs font-bold transition-all"
                    style={{
                      background:
                        ajusteMetodo === "monto"
                          ? "rgba(168, 85, 247, 0.2)"
                          : "rgba(255, 255, 255, 0.05)",
                      border: `1px solid ${ajusteMetodo === "monto" ? "rgba(168, 85, 247, 0.4)" : "rgba(255, 255, 255, 0.1)"}`,
                      color: ajusteMetodo === "monto" ? "#c084fc" : "#888",
                    }}
                  >
                    Monto fijo S/
                  </button>
                </div>

                {/* Input */}
                {ajusteMetodo === "porcentaje" ? (
                  <div>
                    <label className="block text-xs font-bold mb-1.5 text-gray-400">
                      Porcentaje de ajuste (%)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      value={ajustePorcentaje}
                      onChange={(e) => setAjustePorcentaje(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl text-white text-lg font-bold text-center"
                      style={{
                        background: "rgba(255, 255, 255, 0.08)",
                        border: "1px solid rgba(168, 85, 247, 0.3)",
                      }}
                      placeholder="Ej: 5"
                    />
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs font-bold mb-1.5 text-gray-400">
                      Monto de ajuste (S/)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={ajusteMonto}
                      onChange={(e) => setAjusteMonto(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl text-white text-lg font-bold text-center"
                      style={{
                        background: "rgba(255, 255, 255, 0.08)",
                        border: "1px solid rgba(168, 85, 247, 0.3)",
                      }}
                      placeholder="Ej: 0.50"
                    />
                  </div>
                )}

                {/* Botones */}
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => setIsAjusteMasivoOpen(false)}
                    className="flex-1 px-4 py-2.5 rounded-xl font-bold text-sm transition-all hover:scale-105"
                    style={{
                      background: "rgba(255, 255, 255, 0.1)",
                      border: "1px solid rgba(255, 255, 255, 0.2)",
                      color: "#fff",
                    }}
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleAjusteMasivo}
                    className="flex-1 px-4 py-2.5 rounded-xl font-bold text-sm transition-all hover:scale-105"
                    style={{
                      background:
                        ajusteTipo === "subir"
                          ? "linear-gradient(to right, #0d4a24, #166534, #22c55e)"
                          : "linear-gradient(to right, #7f1d1d, #991b1b, #ef4444)",
                      color: "white",
                      boxShadow:
                        ajusteTipo === "subir"
                          ? "0 4px 15px rgba(34, 197, 94, 0.3)"
                          : "0 4px 15px rgba(239, 68, 68, 0.3)",
                    }}
                  >
                    {ajusteTipo === "subir" ? "Subir" : "Bajar"} Precios
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
