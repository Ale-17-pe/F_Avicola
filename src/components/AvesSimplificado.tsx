import { useState } from "react";
import {
  Plus,
  Edit2,
  Trash2,
  X,
  Bird,
  PackageOpen,
  Filter,
  Search,
  ChevronDown,
  ChevronUp,
  ToggleLeft,
  ToggleRight,
  Egg,
  Package,
  Check,
  Zap,
  Copy,
} from "lucide-react";
import { useApp, TipoAve, Presentacion } from "../contexts/AppContext";
import { toast } from "sonner";

// Paleta de colores preseleccionados para tipos
const COLOR_PALETTE = [
  '#22c55e', '#ef4444', '#3b82f6', '#f59e0b', '#8b5cf6',
  '#ec4899', '#14b8a6', '#f97316', '#06b6d4', '#84cc16',
  '#6366f1', '#d946ef', '#0ea5e9', '#a3e635', '#fb923c',
];

// Presentaciones estándar predefinidas para creación rápida
const PRESENTACIONES_RAPIDAS = [
  { nombre: 'Vivo', merma: 0, desc: 'Sin procesamiento' },
  { nombre: 'Pelado', merma: 0.15, desc: 'Desplumado' },
  { nombre: 'Destripado', merma: 0.25, desc: 'Sin vísceras' },
  { nombre: 'Fileteado', merma: 0.35, desc: 'En piezas' },
  { nombre: 'Entero Limpio', merma: 0.20, desc: 'Limpio y empacado' },
];



export function AvesSimplificado() {
  const { 
    tiposAve, 
    addTipoAve, 
    updateTipoAve, 
    deleteTipoAve,
    presentaciones,
    addPresentacion,
    updatePresentacion,
    deletePresentacion
  } = useApp();

  // Mostrar todos los productos (Ave + Otro)


  const [isAddTipoModalOpen, setIsAddTipoModalOpen] = useState(false);
  const [editingTipo, setEditingTipo] = useState<TipoAve | null>(null);
  const [nuevoTipoForm, setNuevoTipoForm] = useState({
    nombre: "",
    tieneSexo: true,
    tieneVariedad: false,
    variedades: "",
    color: "#22c55e",
    categoria: 'Ave' as 'Ave' | 'Otro',
  });

  const [isPresentacionesModalOpen, setIsPresentacionesModalOpen] =
    useState(false);

  const [editingPresentacion, setEditingPresentacion] =
    useState<Presentacion | null>(null);
  const [nuevaPresentacionForm, setNuevaPresentacionForm] = useState({
    tipoAve: tiposAve[0]?.nombre || "Pollo",
    nombre: "",
    mermaKg: "",
    variedad: "",
    sexo: "" as '' | 'Macho' | 'Hembra',
  });

  const [filtroPresentacionTipo, setFiltroPresentacionTipo] =
    useState<string>("all");
  const [searchTerm, setSearchTerm] = useState<string>("");

  // Estado para creación rápida de presentaciones (batch)
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);
  const [batchTipoAve, setBatchTipoAve] = useState("");
  const [batchVariedad, setBatchVariedad] = useState<string>("");
  const [batchSelections, setBatchSelections] = useState<Record<string, boolean>>({});
  const [batchCustomMermas, setBatchCustomMermas] = useState<Record<string, string>>({});

  // Estado para post-creación de tipo (ofrecer crear presentaciones)
  const [postCreacionTipo, setPostCreacionTipo] = useState<string | null>(null);

  // Filtrar presentaciones
  const presentacionesFiltradas = presentaciones.filter((p) => {
    const matchesTipo =
      filtroPresentacionTipo === "all" || p.tipoAve === filtroPresentacionTipo;
    const matchesSearch =
      searchTerm === "" ||
      p.tipoAve.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.nombre.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesTipo && matchesSearch;
  });

  // Agrupar presentaciones por tipo para vista compacta
  const presentacionesPorTipo = presentacionesFiltradas.reduce(
    (acc, pres) => {
      if (!acc[pres.tipoAve]) {
        acc[pres.tipoAve] = [];
      }
      acc[pres.tipoAve].push(pres);
      return acc;
    },
    {} as Record<string, Presentacion[]>,
  );

  // Estado para tipos expandidos (inicialmente vacío para estar ocultos por defecto)
  const [expandedTypes, setExpandedTypes] = useState<string[]>([]);

  const toggleType = (tipo: string) => {
    setExpandedTypes((prev) =>
      prev.includes(tipo) ? prev.filter((t) => t !== tipo) : [...prev, tipo],
    );
  };

  const handleDeleteTipo = (id: string) => {
    const tipo = tiposAve.find(t => t.id === id);
    const presAsociadas = tipo ? presentaciones.filter(p => p.tipoAve === tipo.nombre).length : 0;
    const msg = presAsociadas > 0
      ? `¿Está seguro de eliminar "${tipo?.nombre}"? Se eliminarán también sus ${presAsociadas} presentaciones asociadas.`
      : `¿Está seguro de eliminar este tipo de ave?`;
    if (confirm(msg)) {
      deleteTipoAve(id);
    }
  };

  const handleEditTipo = (tipo: TipoAve) => {
    setEditingTipo(tipo);
    setNuevoTipoForm({
      nombre: tipo.nombre,
      tieneSexo: tipo.tieneSexo,
      tieneVariedad: tipo.tieneVariedad,
      variedades: tipo.variedades ? tipo.variedades.join(", ") : "",
      color: tipo.color,
      categoria: tipo.categoria || 'Ave',
    });
    setIsAddTipoModalOpen(true);
  };

  const handleSubmitTipo = (e: React.FormEvent) => {
    e.preventDefault();

    if (editingTipo) {
      const tipoActualizado: TipoAve = {
        id: editingTipo.id,
        nombre: nuevoTipoForm.nombre.trim(),
        tieneSexo: nuevoTipoForm.categoria === 'Otro' ? false : nuevoTipoForm.tieneSexo,
        tieneVariedad: nuevoTipoForm.tieneVariedad,
        variedades: nuevoTipoForm.tieneVariedad
          ? nuevoTipoForm.variedades.split(",").map((v) => v.trim())
          : undefined,
        color: nuevoTipoForm.color,
        categoria: nuevoTipoForm.categoria,
        estado: editingTipo.estado || 'Activo',
      };
      updateTipoAve(tipoActualizado);
      setEditingTipo(null);
      setNuevoTipoForm({
        nombre: "",
        tieneSexo: true,
        tieneVariedad: false,
        variedades: "",
        color: "#22c55e",
        categoria: 'Ave',
      });
    } else {
      const nombreNormalizado = nuevoTipoForm.nombre.trim().toLowerCase();
      const existente = tiposAve.find(
        (t) => t.nombre.toLowerCase() === nombreNormalizado,
      );

      // Si existe y tiene variedad, permitir agregar nuevas variedades
      if (existente) {
        if (nuevoTipoForm.tieneVariedad && existente.tieneVariedad && existente.variedades) {
          const nuevasVariedades = nuevoTipoForm.variedades
            .split(",")
            .map((v) => v.trim())
            .filter((v) => v.length > 0);
          const variedadesExistentes = existente.variedades.map(v => v.toLowerCase());
          const variedadesNuevas = nuevasVariedades.filter(
            (v) => !variedadesExistentes.includes(v.toLowerCase())
          );
          if (variedadesNuevas.length === 0) {
            alert(`Todas las variedades ingresadas ya existen en "${existente.nombre}".`);
            return;
          }
          const tipoActualizado: TipoAve = {
            ...existente,
            variedades: [...existente.variedades, ...variedadesNuevas],
          };
          updateTipoAve(tipoActualizado);
          toast.success(`${variedadesNuevas.length} variedad(es) agregada(s) a "${existente.nombre}": ${variedadesNuevas.join(', ')}`);
          setPostCreacionTipo(existente.nombre);
        } else {
          alert(`El tipo "${nuevoTipoForm.nombre}" ya existe.`);
          return;
        }
      } else {
        const nuevoTipo: TipoAve = {
          id: Date.now().toString(),
          nombre: nuevoTipoForm.nombre.trim(),
          tieneSexo: nuevoTipoForm.categoria === 'Otro' ? false : nuevoTipoForm.tieneSexo,
          tieneVariedad: nuevoTipoForm.tieneVariedad,
          variedades: nuevoTipoForm.tieneVariedad
            ? nuevoTipoForm.variedades.split(",").map((v) => v.trim())
            : undefined,
          color: nuevoTipoForm.color,
          categoria: nuevoTipoForm.categoria,
          estado: 'Activo',
        };
        addTipoAve(nuevoTipo);
        // Ofrecer crear presentaciones rápidas para el nuevo tipo
        setPostCreacionTipo(nuevoTipo.nombre);
      }
      setNuevoTipoForm({
        nombre: "",
        tieneSexo: true,
        tieneVariedad: false,
        variedades: "",
        color: "#22c55e",
        categoria: 'Ave',
      });
    }
    setIsAddTipoModalOpen(false);
  };

  // Handler para creación por lotes de presentaciones
  const handleBatchCreate = () => {
    if (!batchTipoAve) return;
    
    const selected = PRESENTACIONES_RAPIDAS.filter(p => batchSelections[p.nombre]);
    if (selected.length === 0) return;

    const tipoObj = tiposAve.find(t => t.nombre === batchTipoAve);
    let count = 0;

    for (const pres of selected) {
      const merma = batchCustomMermas[pres.nombre] ? parseFloat(batchCustomMermas[pres.nombre]) : pres.merma;
      
      // Si tiene variedades, crear solo para la variedad seleccionada
      if (tipoObj?.tieneVariedad && tipoObj.variedades && tipoObj.variedades.length > 0) {
        const variedadesTarget = batchVariedad ? [batchVariedad] : tipoObj.variedades;
        for (const variedad of variedadesTarget) {
          const existe = presentaciones.some(
            p => p.tipoAve === batchTipoAve && p.nombre === pres.nombre && p.variedad === variedad
          );
          if (!existe) {
            addPresentacion({
              id: `${Date.now()}-${count++}-${Math.random().toString(36).substr(2, 5)}`,
              tipoAve: batchTipoAve,
              nombre: pres.nombre,
              mermaKg: merma,
              variedad: variedad,
            });
          }
        }
      } 
      // Si tiene sexo, crear una por sexo
      else if (tipoObj?.tieneSexo) {
        for (const sexo of ['Macho', 'Hembra'] as const) {
          const existe = presentaciones.some(
            p => p.tipoAve === batchTipoAve && p.nombre === pres.nombre && p.sexo === sexo
          );
          if (!existe) {
            addPresentacion({
              id: `${Date.now()}-${count++}-${Math.random().toString(36).substr(2, 5)}`,
              tipoAve: batchTipoAve,
              nombre: pres.nombre,
              mermaKg: merma,
              sexo: sexo,
            });
          }
        }
      }
      // General
      else {
        const existe = presentaciones.some(
          p => p.tipoAve === batchTipoAve && p.nombre === pres.nombre
        );
        if (!existe) {
          addPresentacion({
            id: `${Date.now()}-${count++}-${Math.random().toString(36).substr(2, 5)}`,
            tipoAve: batchTipoAve,
            nombre: pres.nombre,
            mermaKg: merma,
          });
        }
      }
    }

    setIsBatchModalOpen(false);
    setPostCreacionTipo(null);
    setBatchSelections({});
    setBatchCustomMermas({});
    setBatchTipoAve("");
    setBatchVariedad("");
  };

  const handleSubmitPresentacion = (e: React.FormEvent) => {
    e.preventDefault();

    if (editingPresentacion) {
      updatePresentacion({
        ...editingPresentacion,
        tipoAve: nuevaPresentacionForm.tipoAve,
        nombre: nuevaPresentacionForm.nombre,
        mermaKg: parseFloat(nuevaPresentacionForm.mermaKg),
        variedad: nuevaPresentacionForm.variedad || undefined,
        sexo: (nuevaPresentacionForm.sexo as 'Macho' | 'Hembra') || undefined,
      });
      setEditingPresentacion(null);
    } else {
      const nuevaPresentacion: Presentacion = {
        id: Date.now().toString(),
        tipoAve: nuevaPresentacionForm.tipoAve,
        nombre: nuevaPresentacionForm.nombre,
        mermaKg: parseFloat(nuevaPresentacionForm.mermaKg),
        variedad: nuevaPresentacionForm.variedad || undefined,
        sexo: (nuevaPresentacionForm.sexo as 'Macho' | 'Hembra') || undefined,
      };
      addPresentacion(nuevaPresentacion);
    }

    setNuevaPresentacionForm({
      tipoAve: tiposAve[0]?.nombre || "Pollo",
      nombre: "",
      mermaKg: "",
      variedad: "",
      sexo: "",
    });
    setIsPresentacionesModalOpen(false);
  };

  const handleDeletePresentacion = (id: string) => {
    if (confirm("¿Está seguro de eliminar esta presentación?")) {
      deletePresentacion(id);
    }
  };

  return (
    <div className="min-h-screen p-4 md:p-6" style={{}}>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-white mb-2 flex items-center gap-3">
          <Package className="w-8 h-8 text-amber-400" />
          Gestión de Productos
        </h1>
        <p className="text-gray-300">
          Configuración completa de tipos de productos, presentaciones y mermas
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-gradient-to-r from-green-900/30 to-green-800/20 border border-green-800/30 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-300">Tipos de Productos</p>
              <p className="text-2xl font-bold text-white">{tiposAve.length}</p>
            </div>
            <Package className="w-8 h-8 text-green-400" />
          </div>
        </div>
        <div className="bg-gradient-to-r from-amber-900/30 to-amber-800/20 border border-amber-800/30 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-300">Presentaciones</p>
              <p className="text-2xl font-bold text-white">
                {presentaciones.length}
              </p>
            </div>
            <PackageOpen className="w-8 h-8 text-amber-400" />
          </div>
        </div>
        <div className="bg-gradient-to-r from-blue-900/30 to-blue-800/20 border border-blue-800/30 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-300">Tipos Únicos</p>
              <p className="text-2xl font-bold text-white">
                {[...new Set(presentaciones.map((p) => p.tipoAve))].length}
              </p>
            </div>
            <Filter className="w-8 h-8 text-blue-400" />
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-3 mb-6">
        <button
          onClick={() => setIsAddTipoModalOpen(true)}
          className="px-5 py-3 rounded-xl text-sm font-bold transition-all hover:scale-105 active:scale-95 flex items-center gap-2"
          style={{
            background:
              "linear-gradient(to right, #0d4a24, #166534, #b8941e, #ccaa00)",
            color: "white",
            boxShadow: "0 4px 20px rgba(204, 170, 0, 0.3)",
          }}
        >
          <Plus className="w-4 h-4" />
          Nuevo Tipo de Producto
        </button>
        <button
          onClick={() => setIsPresentacionesModalOpen(true)}
          className="px-5 py-3 rounded-xl text-sm font-bold transition-all hover:scale-105 active:scale-95 flex items-center gap-2"
          style={{
            background:
              "linear-gradient(to right, #0d4a24, #166534, #b8941e, #ccaa00)",
            color: "white",
            boxShadow: "0 4px 20px rgba(204, 170, 0, 0.3)",
          }}
        >
          <PackageOpen className="w-4 h-4" />
          Nueva Presentación
        </button>
        <button
          onClick={() => {
            setBatchTipoAve(tiposAve[0]?.nombre || '');
            setBatchSelections(
              PRESENTACIONES_RAPIDAS.reduce((acc, p) => ({ ...acc, [p.nombre]: true }), {})
            );
            setBatchCustomMermas({});
            setIsBatchModalOpen(true);
          }}
          className="px-5 py-3 rounded-xl text-sm font-bold transition-all hover:scale-105 active:scale-95 flex items-center gap-2"
          style={{
            background: "rgba(168, 85, 247, 0.15)",
            color: "#c084fc",
            border: "1px solid rgba(168, 85, 247, 0.3)",
          }}
        >
          <Zap className="w-4 h-4" />
          Creación Rápida
        </button>
      </div>

      {/* Tipos de Aves Section */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-white">Tipos de Productos</h2>
          <span className="text-sm text-gray-400 bg-black/30 px-3 py-1 rounded-lg">
            {tiposAve.length} registros
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {tiposAve.map((tipo) => (
            <div
              key={tipo.id}
              className="group relative bg-gradient-to-br from-black/40 to-black/20 rounded-xl p-4 border transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl cursor-pointer"
              style={{
                borderColor: `${tipo.color}30`,
                boxShadow: `0 4px 20px ${tipo.color}10`,
              }}
              onClick={() => handleEditTipo(tipo)}
            >
              <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    const updated = { ...tipo, estado: tipo.estado === 'Inactivo' ? 'Activo' as const : 'Inactivo' as const };
                    updateTipoAve(updated);
                  }}
                  className={`p-1.5 rounded-lg transition-colors ${tipo.estado === 'Inactivo' ? 'bg-red-500/20 hover:bg-green-500/30' : 'bg-green-500/20 hover:bg-red-500/30'}`}
                  title={tipo.estado === 'Inactivo' ? 'Activar' : 'Desactivar'}
                >
                  {tipo.estado === 'Inactivo' 
                    ? <ToggleLeft className="w-3.5 h-3.5 text-red-400" />
                    : <ToggleRight className="w-3.5 h-3.5 text-green-400" />
                  }
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEditTipo(tipo);
                  }}
                  className="p-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 transition-colors"
                >
                  <Edit2 className="w-3.5 h-3.5 text-amber-400" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteTipo(tipo.id);
                  }}
                  className="p-1.5 rounded-lg bg-red-500/20 hover:bg-red-500/30 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5 text-red-400" />
                </button>
              </div>

              <div className="flex items-center gap-3 mb-3">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110"
                  style={{
                    background: `linear-gradient(135deg, ${tipo.color}20, ${tipo.color}10)`,
                    border: `2px solid ${tipo.color}40`,
                  }}
                >
                  {tipo.categoria === 'Otro' ? <Egg className="w-6 h-6" style={{ color: tipo.color }} /> : <Bird className="w-6 h-6" style={{ color: tipo.color }} />}
                </div>
                <div>
                  <h3 className="text-white font-bold text-lg">
                    {tipo.nombre}
                  </h3>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    <span className={`px-2 py-0.5 rounded text-xs ${tipo.categoria === 'Otro' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-blue-500/20 text-blue-400'}`}>
                      {tipo.categoria === 'Otro' ? 'Otro Producto' : 'Ave'}
                    </span>
                    <span className="px-2 py-0.5 rounded text-xs bg-black/40 text-gray-300">
                      {tipo.tieneSexo
                        ? "Con Sexo"
                        : tipo.tieneVariedad
                          ? "Con Variedad"
                          : "Simple"}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                      tipo.estado === 'Inactivo'
                        ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                        : 'bg-green-500/20 text-green-400 border border-green-500/30'
                    }`}>
                      {tipo.estado === 'Inactivo' ? 'Inactivo' : 'Activo'}
                    </span>
                  </div>
                </div>
              </div>

              {tipo.tieneVariedad && tipo.variedades && (
                <div className="mt-3 pt-3 border-t border-white/10">
                  <p className="text-xs text-gray-400 mb-2">Variedades:</p>
                  <div className="flex flex-wrap gap-1">
                    {tipo.variedades.slice(0, 3).map((v, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-1 rounded text-xs"
                        style={{
                          background: `${tipo.color}20`,
                          color: tipo.color,
                          border: `1px solid ${tipo.color}30`,
                        }}
                      >
                        {v}
                      </span>
                    ))}
                    {tipo.variedades.length > 3 && (
                      <span className="px-2 py-1 rounded text-xs bg-black/40 text-gray-400">
                        +{tipo.variedades.length - 3}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Presentaciones Section */}
      <div>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
          <div>
            <h2 className="text-xl font-bold text-white">
              Presentaciones Comerciales
            </h2>
            <p className="text-sm text-gray-400 mt-1">
              Configuración de mermas por presentación
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar presentación..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 rounded-lg text-sm w-full sm:w-64"
                style={{
                  background: "rgba(0, 0, 0, 0.4)",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                  color: "white",
                }}
              />
            </div>

            <select
              value={filtroPresentacionTipo}
              onChange={(e) => setFiltroPresentacionTipo(e.target.value)}
              className="px-4 py-2 rounded-lg text-sm"
              style={{
                background: "rgba(0, 0, 0, 0.4)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                color: "white",
              }}
            >
              <option value="all">Todos los tipos</option>
              {tiposAve.map((tipo) => (
                <option key={tipo.id} value={tipo.nombre}>
                  {tipo.nombre}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Vista Agrupada por Tipo - Collapsible */}
        {Object.entries(presentacionesPorTipo).map(([tipo, presList]) => {
          const tipoInfo = tiposAve.find((t) => t.nombre === tipo);
          const isExpanded = expandedTypes.includes(tipo);
          // Para tipos con variedad, sub-agrupar presentaciones por variedad
          const tieneVariedades = tipoInfo?.tieneVariedad && tipoInfo.variedades?.length;
          const tieneSexo = tipoInfo?.tieneSexo && !tipoInfo?.tieneVariedad;
          // Sub-agrupar por variedad o por sexo
          const presAgrupadas = tieneVariedades
            ? presList.reduce((acc, p) => {
                const v = p.variedad || 'General';
                if (!acc[v]) acc[v] = [];
                acc[v].push(p);
                return acc;
              }, {} as Record<string, Presentacion[]>)
            : tieneSexo
              ? presList.reduce((acc, p) => {
                  const s = p.sexo || 'General';
                  if (!acc[s]) acc[s] = [];
                  acc[s].push(p);
                  return acc;
                }, {} as Record<string, Presentacion[]>)
              : null;

          return (
            <div key={tipo} className="mb-4">
              <button
                onClick={() => toggleType(tipo)}
                className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-black/20 to-transparent rounded-xl border border-white/5 hover:bg-white/5 transition-all group"
              >
                <div className="flex items-center gap-3">
                  {tipoInfo && (
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center transition-transform group-hover:scale-110"
                      style={{
                        background: `${tipoInfo.color}20`,
                        border: `1px solid ${tipoInfo.color}40`,
                      }}
                    >
                      {tipoInfo.categoria === 'Otro' 
                        ? <Egg className="w-4 h-4" style={{ color: tipoInfo.color }} />
                        : <Bird className="w-4 h-4" style={{ color: tipoInfo.color }} />
                      }
                    </div>
                  )}
                  <div className="text-left">
                    <h3 className="text-lg font-semibold text-white">{tipo}</h3>
                    <p className="text-sm text-gray-400">
                      {presList.length} presentaciones
                    </p>
                  </div>
                </div>
                {isExpanded ? (
                  <ChevronUp className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors" />
                )}
              </button>

              {isExpanded && presAgrupadas && (
                <div className="mt-4 space-y-5 animate-in slide-in-from-top-2">
                  {Object.entries(presAgrupadas).map(([grupo, presVar]) => (
                    <div key={grupo}>
                      <div className="flex items-center gap-2 mb-3 ml-1">
                        <span className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${tieneSexo ? (grupo === 'Macho' ? 'bg-blue-500/20 text-blue-300 border-blue-500/30' : grupo === 'Hembra' ? 'bg-pink-500/20 text-pink-300 border-pink-500/30' : 'bg-gray-500/20 text-gray-300 border-gray-500/30') : 'bg-purple-500/20 text-purple-300 border-purple-500/30'}`}>
                          {tieneSexo ? (grupo === 'Macho' ? '♂ Macho' : grupo === 'Hembra' ? '♀ Hembra' : grupo) : grupo}
                        </span>
                        <span className="text-xs text-gray-500">{presVar.length} presentaciones</span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {presVar.map((pres) => (
                          <div
                            key={pres.id}
                            className="group bg-gradient-to-br from-black/30 to-black/20 rounded-xl p-4 border hover:border-amber-500/30 transition-all duration-300"
                            style={{ borderColor: 'rgba(255, 255, 255, 0.1)' }}
                          >
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <h4 className="text-white font-medium">{pres.nombre}</h4>
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {pres.sexo && (
                                    <span className={`px-1.5 py-0.5 rounded text-[10px] ${pres.sexo === 'Macho' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/20' : 'bg-pink-500/20 text-pink-400 border border-pink-500/20'}`}>
                                      {pres.sexo === 'Macho' ? '♂ Macho' : '♀ Hembra'}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                  onClick={() => {
                                    setEditingPresentacion(pres);
                                    setNuevaPresentacionForm({ tipoAve: pres.tipoAve, nombre: pres.nombre, mermaKg: pres.mermaKg.toString(), variedad: pres.variedad || '', sexo: pres.sexo || '' });
                                    setIsPresentacionesModalOpen(true);
                                  }}
                                  className="p-1.5 rounded-lg bg-green-500/20 hover:bg-green-500/30 transition-colors"
                                >
                                  <Edit2 className="w-3.5 h-3.5 text-green-400" />
                                </button>
                                <button
                                  onClick={() => handleDeletePresentacion(pres.id)}
                                  className="p-1.5 rounded-lg bg-red-500/20 hover:bg-red-500/30 transition-colors"
                                >
                                  <Trash2 className="w-3.5 h-3.5 text-red-400" />
                                </button>
                              </div>
                            </div>
                            <div className="mt-4">
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-400">Merma</span>
                                <span className={`text-lg font-bold ${pres.mermaKg === 0 ? 'text-green-400' : 'text-amber-400'}`}>
                                  {pres.mermaKg.toFixed(2)} kg
                                </span>
                              </div>
                              <div className="w-full h-1.5 rounded-full bg-black/40 mt-1 overflow-hidden">
                                <div className="h-full rounded-full transition-all duration-500" style={{ width: `${Math.min(pres.mermaKg * 500, 100)}%`, background: pres.mermaKg === 0 ? 'linear-gradient(to right, #10b981, #22c55e)' : 'linear-gradient(to right, #f59e0b, #eab308)' }} />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {isExpanded && !presAgrupadas && (
                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 animate-in slide-in-from-top-2">
                  {presList.map((pres) => (
                    <div
                      key={pres.id}
                      className="group bg-gradient-to-br from-black/30 to-black/20 rounded-xl p-4 border hover:border-amber-500/30 transition-all duration-300"
                      style={{ borderColor: "rgba(255, 255, 255, 0.1)" }}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="text-white font-medium">
                            {pres.nombre}
                          </h4>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {pres.variedad && (
                              <span className="px-1.5 py-0.5 rounded text-[10px] bg-purple-500/20 text-purple-400 border border-purple-500/20">
                                {pres.variedad}
                              </span>
                            )}
                            {pres.sexo && (
                              <span className={`px-1.5 py-0.5 rounded text-[10px] ${pres.sexo === 'Macho' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/20' : 'bg-pink-500/20 text-pink-400 border border-pink-500/20'}`}>
                                {pres.sexo === 'Macho' ? '♂ Macho' : '♀ Hembra'}
                              </span>
                            )}
                            {!pres.variedad && !pres.sexo && (
                              <span className="text-xs text-gray-500">General</span>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => {
                              setEditingPresentacion(pres);
                              setNuevaPresentacionForm({
                                tipoAve: pres.tipoAve,
                                nombre: pres.nombre,
                                mermaKg: pres.mermaKg.toString(),
                                variedad: pres.variedad || '',
                                sexo: pres.sexo || '',
                              });
                              setIsPresentacionesModalOpen(true);
                            }}
                            className="p-1.5 rounded-lg bg-green-500/20 hover:bg-green-500/30 transition-colors"
                          >
                            <Edit2 className="w-3.5 h-3.5 text-green-400" />
                          </button>
                          <button
                            onClick={() => handleDeletePresentacion(pres.id)}
                            className="p-1.5 rounded-lg bg-red-500/20 hover:bg-red-500/30 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-red-400" />
                          </button>
                        </div>
                      </div>

                      <div className="mt-4">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-400">Merma</span>
                          <span
                            className={`text-lg font-bold ${pres.mermaKg === 0 ? "text-green-400" : "text-amber-400"}`}
                          >
                            {pres.mermaKg.toFixed(2)} kg
                          </span>
                        </div>
                        <div className="w-full h-1.5 rounded-full bg-black/40 mt-1 overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{
                              width: `${Math.min(pres.mermaKg * 500, 100)}%`,
                              background:
                                pres.mermaKg === 0
                                  ? "linear-gradient(to right, #10b981, #22c55e)"
                                  : "linear-gradient(to right, #f59e0b, #eab308)",
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Modal Agregar/Editar Tipo */}
      {isAddTipoModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{
            background:
              "radial-gradient(circle at center, rgba(13, 74, 36, 0.8) 0%, rgba(0, 0, 0, 0.95) 100%)",
          }}
        >
          <div
            className="relative w-full max-w-md rounded-2xl overflow-hidden"
            style={{
              background:
                "linear-gradient(135deg, rgba(0, 0, 0, 0.9) 0%, rgba(13, 74, 36, 0.3) 100%)",
              border: "1px solid rgba(204, 170, 0, 0.2)",
              boxShadow: "0 20px 60px rgba(0, 0, 0, 0.5)",
            }}
          >
            {/* Header */}
            <div
              className="p-6 border-b"
              style={{ borderColor: "rgba(204, 170, 0, 0.2)" }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="p-2 rounded-lg"
                    style={{ background: "rgba(204, 170, 0, 0.1)" }}
                  >
                    <Bird className="w-6 h-6 text-amber-400" />
                  </div>
                  <h3 className="text-xl font-bold text-white">
                    {editingTipo ? "Editar Tipo" : "Nuevo Tipo"}
                  </h3>
                </div>
                <button
                  onClick={() => {
                    setIsAddTipoModalOpen(false);
                    setEditingTipo(null);
                    setNuevoTipoForm({
                      nombre: "",
                      tieneSexo: true,
                      tieneVariedad: false,
                      variedades: "",
                      color: "#22c55e",
                      categoria: 'Ave',
                    });
                  }}
                  className="p-2 rounded-lg hover:scale-110 transition-all"
                  style={{ background: "rgba(239, 68, 68, 0.2)" }}
                >
                  <X className="w-5 h-5 text-red-400" />
                </button>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmitTipo} className="p-6 space-y-5">
              {/* Categoría */}
              <div>
                <label className="block text-sm font-medium mb-2 text-white">
                  Categoría *
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <label
                    className="flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all"
                    style={{
                      background: nuevoTipoForm.categoria === 'Ave' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(255, 255, 255, 0.05)',
                      border: `1px solid ${nuevoTipoForm.categoria === 'Ave' ? 'rgba(34, 197, 94, 0.3)' : 'rgba(255, 255, 255, 0.1)'}`,
                    }}
                  >
                    <input type="radio" name="categoria" checked={nuevoTipoForm.categoria === 'Ave'}
                      onChange={() => setNuevoTipoForm({ ...nuevoTipoForm, categoria: 'Ave' })}
                      className="w-4 h-4" />
                    <Bird className="w-5 h-5 text-green-400" />
                    <span className="text-white font-medium">Ave</span>
                  </label>
                  <label
                    className="flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all"
                    style={{
                      background: nuevoTipoForm.categoria === 'Otro' ? 'rgba(234, 179, 8, 0.1)' : 'rgba(255, 255, 255, 0.05)',
                      border: `1px solid ${nuevoTipoForm.categoria === 'Otro' ? 'rgba(234, 179, 8, 0.3)' : 'rgba(255, 255, 255, 0.1)'}`,
                    }}
                  >
                    <input type="radio" name="categoria" checked={nuevoTipoForm.categoria === 'Otro'}
                      onChange={() => setNuevoTipoForm({ ...nuevoTipoForm, categoria: 'Otro', tieneSexo: false })}
                      className="w-4 h-4" />
                    <Egg className="w-5 h-5 text-yellow-400" />
                    <span className="text-white font-medium">Otro Producto</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-white">
                  Nombre del Tipo *
                </label>
                <input
                  type="text"
                  required
                  value={nuevoTipoForm.nombre}
                  onChange={(e) =>
                    setNuevoTipoForm({
                      ...nuevoTipoForm,
                      nombre: e.target.value,
                    })
                  }
                  className="w-full px-4 py-3 rounded-xl text-white transition-all focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50"
                  style={{
                    background: "rgba(255, 255, 255, 0.05)",
                    border: "1px solid rgba(255, 255, 255, 0.1)",
                  }}
                  placeholder="Ej: Codorniz, Ganso"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-3 text-white">
                  Color Identificador
                </label>
                <div className="flex flex-wrap gap-2 mb-3">
                  {COLOR_PALETTE.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setNuevoTipoForm({ ...nuevoTipoForm, color })}
                      className="w-8 h-8 rounded-lg cursor-pointer transition-all hover:scale-110 flex items-center justify-center"
                      style={{
                        background: color,
                        border: nuevoTipoForm.color === color ? '3px solid white' : '2px solid rgba(255,255,255,0.15)',
                        boxShadow: nuevoTipoForm.color === color ? `0 0 12px ${color}60` : 'none',
                      }}
                    >
                      {nuevoTipoForm.color === color && <Check className="w-4 h-4 text-white drop-shadow-md" />}
                    </button>
                  ))}
                  <input
                    type="color"
                    value={nuevoTipoForm.color}
                    onChange={(e) => setNuevoTipoForm({ ...nuevoTipoForm, color: e.target.value })}
                    className="w-8 h-8 rounded-lg cursor-pointer border-2 border-white/20"
                    title="Color personalizado"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-md" style={{ background: nuevoTipoForm.color }} />
                  <span className="text-xs text-gray-400 font-mono">{nuevoTipoForm.color}</span>
                </div>
              </div>

              <div className="space-y-3">
                <div className="text-sm font-medium text-white mb-2">
                  Características
                </div>

                <label
                  className="flex items-center gap-3 p-4 rounded-xl cursor-pointer transition-all hover:bg-white/5"
                  style={{
                    background: nuevoTipoForm.tieneSexo
                      ? "rgba(59, 130, 246, 0.1)"
                      : "rgba(255, 255, 255, 0.05)",
                    border: `1px solid ${nuevoTipoForm.tieneSexo ? "rgba(59, 130, 246, 0.3)" : "rgba(255, 255, 255, 0.1)"}`,
                  }}
                >
                  <input
                    type="checkbox"
                    checked={nuevoTipoForm.tieneSexo}
                    onChange={(e) =>
                      setNuevoTipoForm({
                        ...nuevoTipoForm,
                        tieneSexo: e.target.checked,
                        tieneVariedad: e.target.checked
                          ? false
                          : nuevoTipoForm.tieneVariedad,
                      })
                    }
                    className="w-5 h-5 cursor-pointer"
                  />
                  <div>
                    <div className="font-medium text-white">Tiene sexo</div>
                    <div className="text-sm text-gray-400">
                      Distinción entre macho y hembra
                    </div>
                  </div>
                </label>

                <label
                  className="flex items-center gap-3 p-4 rounded-xl cursor-pointer transition-all hover:bg-white/5"
                  style={{
                    background: nuevoTipoForm.tieneVariedad
                      ? "rgba(168, 85, 247, 0.1)"
                      : "rgba(255, 255, 255, 0.05)",
                    border: `1px solid ${nuevoTipoForm.tieneVariedad ? "rgba(168, 85, 247, 0.3)" : "rgba(255, 255, 255, 0.1)"}`,
                  }}
                >
                  <input
                    type="checkbox"
                    checked={nuevoTipoForm.tieneVariedad}
                    onChange={(e) =>
                      setNuevoTipoForm({
                        ...nuevoTipoForm,
                        tieneVariedad: e.target.checked,
                        tieneSexo: e.target.checked
                          ? false
                          : nuevoTipoForm.tieneSexo,
                      })
                    }
                    className="w-5 h-5 cursor-pointer"
                  />
                  <div>
                    <div className="font-medium text-white">
                      Tiene variedades
                    </div>
                    <div className="text-sm text-gray-400">
                      Diferentes variedades del mismo tipo
                    </div>
                  </div>
                </label>
              </div>

              {nuevoTipoForm.tieneVariedad && (
                <div>
                  <label className="block text-sm font-medium mb-2 text-white">
                    Variedades (separadas por comas)
                  </label>
                  <input
                    type="text"
                    value={nuevoTipoForm.variedades}
                    onChange={(e) =>
                      setNuevoTipoForm({
                        ...nuevoTipoForm,
                        variedades: e.target.value,
                      })
                    }
                    className="w-full px-4 py-3 rounded-xl text-white"
                    style={{
                      background: "rgba(255, 255, 255, 0.05)",
                      border: "1px solid rgba(255, 255, 255, 0.1)",
                    }}
                    placeholder="Ej: Roja, Blanca, Negra, Criolla"
                  />
                </div>
              )}

              <button
                type="submit"
                className="w-full px-6 py-4 rounded-xl font-bold text-lg transition-all hover:scale-105 active:scale-95"
                style={{
                  background:
                    "linear-gradient(to right, #0d4a24, #166534, #b8941e, #ccaa00)",
                  color: "white",
                  boxShadow: "0 8px 32px rgba(204, 170, 0, 0.3)",
                }}
              >
                {editingTipo ? "Actualizar Tipo" : "Crear Tipo"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal Agregar/Editar Presentación */}
      {isPresentacionesModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{
            background:
              "radial-gradient(circle at center, rgba(13, 74, 36, 0.8) 0%, rgba(0, 0, 0, 0.95) 100%)",
          }}
        >
          <div
            className="relative w-full max-w-md rounded-2xl overflow-hidden"
            style={{
              background:
                "linear-gradient(135deg, rgba(0, 0, 0, 0.9) 0%, rgba(13, 74, 36, 0.3) 100%)",
              border: "1px solid rgba(204, 170, 0, 0.2)",
              boxShadow: "0 20px 60px rgba(0, 0, 0, 0.5)",
            }}
          >
            {/* Header */}
            <div
              className="p-6 border-b"
              style={{ borderColor: "rgba(204, 170, 0, 0.2)" }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="p-2 rounded-lg"
                    style={{ background: "rgba(204, 170, 0, 0.1)" }}
                  >
                    <PackageOpen className="w-6 h-6 text-amber-400" />
                  </div>
                  <h3 className="text-xl font-bold text-white">
                    {editingPresentacion
                      ? "Editar Presentación"
                      : "Nueva Presentación"}
                  </h3>
                </div>
                <button
                  onClick={() => {
                    setIsPresentacionesModalOpen(false);
                    setEditingPresentacion(null);
                    setNuevaPresentacionForm({
                      tipoAve: tiposAve[0]?.nombre || "Pollo",
                      nombre: "",
                      mermaKg: "",
                      variedad: "",
                      sexo: "",
                    });
                  }}
                  className="p-2 rounded-lg hover:scale-110 transition-all"
                  style={{ background: "rgba(239, 68, 68, 0.2)" }}
                >
                  <X className="w-5 h-5 text-red-400" />
                </button>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmitPresentacion} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-medium mb-2 text-white">
                  Tipo de Producto *
                </label>
                <select
                  value={nuevaPresentacionForm.tipoAve}
                  onChange={(e) =>
                    setNuevaPresentacionForm({
                      ...nuevaPresentacionForm,
                      tipoAve: e.target.value,
                    })
                  }
                  className="w-full px-4 py-3 rounded-xl text-white transition-all focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50"
                  style={{
                    background: "rgba(255, 255, 255, 0.05)",
                    border: "1px solid rgba(255, 255, 255, 0.1)",
                  }}
                  required
                >
                  {tiposAve.map((tipo) => (
                    <option
                      key={tipo.id}
                      value={tipo.nombre}
                      style={{ background: "#1a1a1a" }}
                    >
                      {tipo.nombre}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-white">
                  Nombre de Presentación *
                </label>
                <input
                  type="text"
                  required
                  value={nuevaPresentacionForm.nombre}
                  onChange={(e) =>
                    setNuevaPresentacionForm({
                      ...nuevaPresentacionForm,
                      nombre: e.target.value,
                    })
                  }
                  className="w-full px-4 py-3 rounded-xl text-white transition-all focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50"
                  style={{
                    background: "rgba(255, 255, 255, 0.05)",
                    border: "1px solid rgba(255, 255, 255, 0.1)",
                  }}
                  placeholder="Ej: Vivo, Pelado, Destripado, Fileteado"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-white">
                  Merma por Procesamiento (kg) *
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={nuevaPresentacionForm.mermaKg}
                    onChange={(e) =>
                      setNuevaPresentacionForm({
                        ...nuevaPresentacionForm,
                        mermaKg: e.target.value,
                      })
                    }
                    className="w-full px-4 py-3 rounded-xl text-white pr-12 transition-all focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50"
                    style={{
                      background: "rgba(255, 255, 255, 0.05)",
                      border: "1px solid rgba(255, 255, 255, 0.1)",
                    }}
                    placeholder="0.00"
                  />
                  <span className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400">
                    kg
                  </span>
                </div>
                <p className="text-xs text-gray-400 mt-2">
                  Peso promedio que se pierde durante el procesamiento. Ej: 0.15
                  para pelado
                </p>
              </div>

              {/* Variedad - solo si el tipo tiene variedades */}
              {(() => {
                const tipoSel = tiposAve.find(t => t.nombre === nuevaPresentacionForm.tipoAve);
                return tipoSel?.tieneVariedad && tipoSel.variedades && tipoSel.variedades.length > 0 ? (
                  <div>
                    <label className="block text-sm font-medium mb-2 text-white">
                      Variedad (opcional - para merma específica)
                    </label>
                    <select
                      value={nuevaPresentacionForm.variedad}
                      onChange={(e) => setNuevaPresentacionForm({ ...nuevaPresentacionForm, variedad: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl text-white"
                      style={{ background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)' }}
                    >
                      <option value="" style={{ background: '#1a1a1a' }}>General (todas las variedades)</option>
                      {tipoSel.variedades.map((v) => (
                        <option key={v} value={v} style={{ background: '#1a1a1a' }}>{v}</option>
                      ))}
                    </select>
                    <p className="text-xs text-gray-500 mt-1">Si selecciona una variedad, la merma aplicará solo a esa variedad</p>
                  </div>
                ) : null;
              })()}

              {/* Sexo - solo si el tipo tiene sexo */}
              {(() => {
                const tipoSel = tiposAve.find(t => t.nombre === nuevaPresentacionForm.tipoAve);
                return tipoSel?.tieneSexo ? (
                  <div>
                    <label className="block text-sm font-medium mb-2 text-white">
                      Sexo (opcional - para merma específica)
                    </label>
                    <select
                      value={nuevaPresentacionForm.sexo}
                      onChange={(e) => setNuevaPresentacionForm({ ...nuevaPresentacionForm, sexo: e.target.value as any })}
                      className="w-full px-4 py-3 rounded-xl text-white"
                      style={{ background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)' }}
                    >
                      <option value="" style={{ background: '#1a1a1a' }}>General (ambos sexos)</option>
                      <option value="Macho" style={{ background: '#1a1a1a' }}>♂ Macho</option>
                      <option value="Hembra" style={{ background: '#1a1a1a' }}>♀ Hembra</option>
                    </select>
                    <p className="text-xs text-gray-500 mt-1">Si selecciona un sexo, la merma aplicará solo a ese sexo</p>
                  </div>
                ) : null;
              })()}

              <button
                type="submit"
                className="w-full px-6 py-4 rounded-xl font-bold text-lg transition-all hover:scale-105 active:scale-95"
                style={{
                  background:
                    "linear-gradient(to right, #0d4a24, #166534, #b8941e, #ccaa00)",
                  color: "white",
                  boxShadow: "0 8px 32px rgba(204, 170, 0, 0.3)",
                }}
              >
                {editingPresentacion
                  ? "Actualizar Presentación"
                  : "Crear Presentación"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal Post-Creación de Tipo: Ofrecer crear presentaciones rápidas */}
      {postCreacionTipo && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{
            background: "radial-gradient(circle at center, rgba(13, 74, 36, 0.8) 0%, rgba(0, 0, 0, 0.95) 100%)",
          }}
        >
          <div
            className="relative w-full max-w-sm rounded-2xl overflow-hidden"
            style={{
              background: "linear-gradient(135deg, rgba(0, 0, 0, 0.9) 0%, rgba(13, 74, 36, 0.3) 100%)",
              border: "1px solid rgba(204, 170, 0, 0.2)",
              boxShadow: "0 20px 60px rgba(0, 0, 0, 0.5)",
            }}
          >
            <div className="p-6 space-y-5">
              <div className="text-center">
                <div className="w-14 h-14 rounded-2xl mx-auto mb-3 flex items-center justify-center" style={{ background: 'rgba(34,197,94,0.15)' }}>
                  <Check className="w-8 h-8 text-green-400" />
                </div>
                <h3 className="text-lg font-bold text-white">
                  Tipo "{postCreacionTipo}" creado
                </h3>
                <p className="text-sm text-gray-400 mt-1">
                  ¿Desea crear las presentaciones estándar para este tipo?
                </p>
              </div>

              <div className="flex flex-col gap-2">
                <button
                  onClick={() => {
                    setBatchTipoAve(postCreacionTipo);
                    setBatchSelections(
                      PRESENTACIONES_RAPIDAS.reduce((acc, p) => ({ ...acc, [p.nombre]: true }), {})
                    );
                    setBatchCustomMermas({});
                    setPostCreacionTipo(null);
                    setIsBatchModalOpen(true);
                  }}
                  className="w-full px-5 py-3.5 rounded-xl font-bold text-white transition-all hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2"
                  style={{
                    background: "linear-gradient(to right, #0d4a24, #166534, #b8941e, #ccaa00)",
                    boxShadow: "0 6px 20px rgba(204, 170, 0, 0.25)",
                  }}
                >
                  <Zap className="w-5 h-5" />
                  Sí, crear presentaciones
                </button>
                <button
                  onClick={() => setPostCreacionTipo(null)}
                  className="w-full px-5 py-3 rounded-xl font-medium text-gray-400 hover:text-white hover:bg-white/5 transition-all"
                >
                  No, lo haré después
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Creación Rápida por Lotes de Presentaciones */}
      {isBatchModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{
            background: "radial-gradient(circle at center, rgba(13, 74, 36, 0.8) 0%, rgba(0, 0, 0, 0.95) 100%)",
          }}
        >
          <div
            className="relative w-full max-w-lg rounded-2xl overflow-hidden max-h-[90vh] overflow-y-auto"
            style={{
              background: "linear-gradient(135deg, rgba(0, 0, 0, 0.9) 0%, rgba(13, 74, 36, 0.3) 100%)",
              border: "1px solid rgba(204, 170, 0, 0.2)",
              boxShadow: "0 20px 60px rgba(0, 0, 0, 0.5)",
            }}
          >
            {/* Header */}
            <div className="p-6 border-b" style={{ borderColor: "rgba(204, 170, 0, 0.2)" }}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg" style={{ background: "rgba(204, 170, 0, 0.1)" }}>
                    <Zap className="w-6 h-6 text-amber-400" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">Creación Rápida</h3>
                    <p className="text-xs text-gray-400">Seleccione presentaciones a crear</p>
                  </div>
                </div>
                <button
                  onClick={() => { setIsBatchModalOpen(false); setBatchSelections({}); setBatchCustomMermas({}); }}
                  className="p-2 rounded-lg hover:scale-110 transition-all"
                  style={{ background: "rgba(239, 68, 68, 0.2)" }}
                >
                  <X className="w-5 h-5 text-red-400" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-5">
              {/* Selector de Tipo */}
              <div>
                <label className="block text-sm font-medium mb-2 text-white">Tipo de Producto</label>
                <select
                  value={batchTipoAve}
                  onChange={(e) => { setBatchTipoAve(e.target.value); setBatchVariedad(""); setBatchSelections(PRESENTACIONES_RAPIDAS.reduce((acc, p) => ({ ...acc, [p.nombre]: true }), {})); }}
                  className="w-full px-4 py-3 rounded-xl text-white transition-all focus:ring-2 focus:ring-amber-500/50"
                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}
                >
                  <option value="" style={{ background: '#1a1a1a' }}>-- Seleccionar tipo --</option>
                  {tiposAve.map((tipo) => (
                    <option key={tipo.id} value={tipo.nombre} style={{ background: '#1a1a1a' }}>
                      {tipo.nombre}
                    </option>
                  ))}
                </select>
              </div>

              {/* Selector de Variedad (solo si el tipo tiene variedades) */}
              {(() => {
                const tipoSel = tiposAve.find(t => t.nombre === batchTipoAve);
                if (tipoSel?.tieneVariedad && tipoSel.variedades && tipoSel.variedades.length > 0) {
                  return (
                    <div>
                      <label className="block text-sm font-medium mb-2 text-white">Variedad</label>
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => setBatchVariedad("")}
                          className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${!batchVariedad ? 'ring-2 ring-amber-500 text-amber-300' : 'text-gray-400 hover:text-white'}`}
                          style={{ background: !batchVariedad ? 'rgba(204,170,0,0.15)' : 'rgba(255,255,255,0.05)', border: `1px solid ${!batchVariedad ? 'rgba(204,170,0,0.4)' : 'rgba(255,255,255,0.1)'}` }}
                        >
                          Todas ({tipoSel.variedades.length})
                        </button>
                        {tipoSel.variedades.map(v => (
                          <button
                            key={v}
                            type="button"
                            onClick={() => setBatchVariedad(v)}
                            className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${batchVariedad === v ? 'ring-2 ring-purple-500 text-purple-300' : 'text-gray-400 hover:text-white'}`}
                            style={{ background: batchVariedad === v ? 'rgba(168,85,247,0.15)' : 'rgba(255,255,255,0.05)', border: `1px solid ${batchVariedad === v ? 'rgba(168,85,247,0.4)' : 'rgba(255,255,255,0.1)'}` }}
                          >
                            {v}
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                }
                return null;
              })()}

              {batchTipoAve && (
                <>
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-white">Presentaciones a crear:</p>
                    <button
                      type="button"
                      onClick={() => {
                        const allSelected = PRESENTACIONES_RAPIDAS.every(p => batchSelections[p.nombre]);
                        setBatchSelections(
                          PRESENTACIONES_RAPIDAS.reduce((acc, p) => ({ ...acc, [p.nombre]: !allSelected }), {})
                        );
                      }}
                      className="text-xs text-amber-400 hover:text-amber-300 font-medium"
                    >
                      {PRESENTACIONES_RAPIDAS.every(p => batchSelections[p.nombre]) ? 'Deseleccionar todo' : 'Seleccionar todo'}
                    </button>
                  </div>

                  <div className="space-y-2">
                    {PRESENTACIONES_RAPIDAS.map((pres) => {
                      const tipoCheck = tiposAve.find(t => t.nombre === batchTipoAve);
                      const yaExiste = tipoCheck?.tieneVariedad && tipoCheck.variedades
                        ? batchVariedad
                          ? presentaciones.some(p => p.tipoAve === batchTipoAve && p.nombre === pres.nombre && p.variedad === batchVariedad)
                          : tipoCheck.variedades.every(v => presentaciones.some(p => p.tipoAve === batchTipoAve && p.nombre === pres.nombre && p.variedad === v))
                        : tipoCheck?.tieneSexo
                          ? (['Macho', 'Hembra'] as const).every(s => presentaciones.some(p => p.tipoAve === batchTipoAve && p.nombre === pres.nombre && p.sexo === s))
                          : presentaciones.some(p => p.tipoAve === batchTipoAve && p.nombre === pres.nombre);
                      return (
                        <label
                          key={pres.nombre}
                          className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all ${yaExiste ? 'opacity-40' : ''}`}
                          style={{
                            background: batchSelections[pres.nombre] && !yaExiste ? 'rgba(34,197,94,0.1)' : 'rgba(255,255,255,0.03)',
                            border: `1px solid ${batchSelections[pres.nombre] && !yaExiste ? 'rgba(34,197,94,0.3)' : 'rgba(255,255,255,0.08)'}`,
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={!!batchSelections[pres.nombre] && !yaExiste}
                            disabled={yaExiste}
                            onChange={(e) => setBatchSelections({ ...batchSelections, [pres.nombre]: e.target.checked })}
                            className="w-4 h-4 cursor-pointer accent-green-500"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-white font-medium">{pres.nombre}</span>
                              {yaExiste && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400">Ya existe</span>
                              )}
                            </div>
                            <span className="text-xs text-gray-500">{pres.desc}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              value={batchCustomMermas[pres.nombre] ?? pres.merma}
                              onChange={(e) => setBatchCustomMermas({ ...batchCustomMermas, [pres.nombre]: e.target.value })}
                              disabled={yaExiste}
                              className="w-16 px-2 py-1 rounded-lg text-white text-xs text-right"
                              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
                            />
                            <span className="text-[10px] text-gray-500">kg</span>
                          </div>
                        </label>
                      );
                    })}
                  </div>

                  {(() => {
                    const tipoObj = tiposAve.find(t => t.nombre === batchTipoAve);
                    // Contar cuántas se crearán realmente (excluyendo las que ya existen)
                    let totalToCreate = 0;
                    const presSeleccionadas = PRESENTACIONES_RAPIDAS.filter(p => batchSelections[p.nombre]);
                    for (const pres of presSeleccionadas) {
                      if (tipoObj?.tieneVariedad && tipoObj.variedades) {
                        const vars = batchVariedad ? [batchVariedad] : tipoObj.variedades;
                        for (const v of vars) {
                          if (!presentaciones.some(p => p.tipoAve === batchTipoAve && p.nombre === pres.nombre && p.variedad === v)) {
                            totalToCreate++;
                          }
                        }
                      } else if (tipoObj?.tieneSexo) {
                        for (const s of ['Macho', 'Hembra']) {
                          if (!presentaciones.some(p => p.tipoAve === batchTipoAve && p.nombre === pres.nombre && p.sexo === s)) {
                            totalToCreate++;
                          }
                        }
                      } else {
                        if (!presentaciones.some(p => p.tipoAve === batchTipoAve && p.nombre === pres.nombre)) {
                          totalToCreate++;
                        }
                      }
                    }
                    const varLabel = tipoObj?.tieneVariedad && tipoObj.variedades
                      ? batchVariedad ? `para ${batchVariedad}` : `para ${tipoObj.variedades.length} variedades`
                      : tipoObj?.tieneSexo ? 'por sexo (M/H)' : '';
                    
                    return totalToCreate > 0 ? (
                      <div className="p-3 rounded-xl text-center" style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)' }}>
                        <p className="text-sm text-green-400 font-medium">
                          Se crearán <span className="font-black text-lg">{totalToCreate}</span> presentaciones
                          {varLabel && (
                            <span className="text-xs text-gray-400 block">
                              {varLabel}
                            </span>
                          )}
                        </p>
                      </div>
                    ) : null;
                  })()}

                  <button
                    onClick={handleBatchCreate}
                    disabled={!PRESENTACIONES_RAPIDAS.some(p => batchSelections[p.nombre])}
                    className="w-full px-6 py-4 rounded-xl font-bold text-lg transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed"
                    style={{
                      background: "linear-gradient(to right, #0d4a24, #166534, #b8941e, #ccaa00)",
                      color: "white",
                      boxShadow: "0 8px 32px rgba(204, 170, 0, 0.3)",
                    }}
                  >
                    Crear Seleccionadas
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
