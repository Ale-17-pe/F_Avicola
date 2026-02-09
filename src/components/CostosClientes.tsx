import { useState } from "react";
import {
  Plus,
  Edit2,
  Trash2,
  Search,
  DollarSign,
  User,
  Bird,
  X,
  TrendingUp,
  ChevronDown,
  ChevronUp,
  Settings,
  Calendar,
  History,
  TrendingDown,
  Minus,
  ArrowUpDown,
} from "lucide-react";
import {
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";
import { useApp } from "../contexts/AppContext";

export function CostosClientes() {
  const {
    clientes,
    tiposAve,
    costosClientes,
    setCostosClientes,
  } = useApp();

  const [searchTerm, setSearchTerm] = useState("");
  const [expandedClients, setExpandedClients] = useState<
    Set<string>
  >(new Set(["1"]));
  const [isGestionModalOpen, setIsGestionModalOpen] =
    useState(false);
  const [isHistorialModalOpen, setIsHistorialModalOpen] =
    useState(false);
  const [selectedClienteId, setSelectedClienteId] = useState<
    string | null
  >(null);
  const [historialClienteId, setHistorialClienteId] = useState<
    string | null
  >(null);
  const [preciosForm, setPreciosForm] = useState<{
    [tipoAveId: string]: string;
  }>({});

  // Estado para agendar precios (HOY o MAÑANA)
  const [diaSeleccionado, setDiaSeleccionado] = useState<
    "hoy" | "manana"
  >("hoy");

  // Filtros para el historial
  const [filtroFechaDesde, setFiltroFechaDesde] = useState("");
  const [filtroFechaHasta, setFiltroFechaHasta] = useState("");
  const [filtroTipoAve, setFiltroTipoAve] =
    useState<string>("");
  const [ordenFecha, setOrdenFecha] = useState<"desc" | "asc">(
    "desc",
  );

  // Estado para editar precio individual
  const [isEditPrecioModalOpen, setIsEditPrecioModalOpen] =
    useState(false);
  const [editingCosto, setEditingCosto] = useState<
    (typeof costosClientes)[0] | null
  >(null);
  const [editPrecio, setEditPrecio] = useState("");
  const [editFecha, setEditFecha] = useState("");

  const filteredClientes = clientes.filter((cliente) =>
    cliente.nombre
      .toLowerCase()
      .includes(searchTerm.toLowerCase()),
  );

  const toggleClientExpansion = (clienteId: string) => {
    const newExpanded = new Set(expandedClients);
    if (newExpanded.has(clienteId)) {
      newExpanded.delete(clienteId);
    } else {
      newExpanded.add(clienteId);
    }
    setExpandedClients(newExpanded);
  };

  const getCostosDelCliente = (clienteId: string) => {
    return costosClientes.filter(
      (c) => c.clienteId === clienteId,
    );
  };

  // Obtener precios de HOY y AYER solamente
  const getPreciosHoyYAyer = (clienteId: string) => {
    const costos = getCostosDelCliente(clienteId);
    const hoy = new Date().toISOString().split("T")[0];
    const ayer = new Date(Date.now() - 86400000)
      .toISOString()
      .split("T")[0];

    return costos.filter(
      (c) => c.fecha === hoy || c.fecha === ayer,
    );
  };

  // Agrupar precios por fecha (HOY y AYER)
  const getPreciosAgrupadosPorFecha = (clienteId: string) => {
    const costos = getPreciosHoyYAyer(clienteId);
    const hoy = new Date().toISOString().split("T")[0];
    const ayer = new Date(Date.now() - 86400000)
      .toISOString()
      .split("T")[0];

    const grupos: {
      fecha: string;
      label: string;
      costos: typeof costosClientes;
    }[] = [];

    const costosHoy = costos.filter((c) => c.fecha === hoy);
    const costosAyer = costos.filter((c) => c.fecha === ayer);

    if (costosHoy.length > 0) {
      grupos.push({
        fecha: hoy,
        label: "HOY",
        costos: costosHoy,
      });
    }

    if (costosAyer.length > 0) {
      grupos.push({
        fecha: ayer,
        label: "AYER",
        costos: costosAyer,
      });
    }

    return grupos;
  };

  // Obtener precios más recientes por cliente
  const getPreciosMasRecientes = (clienteId: string) => {
    const costos = getCostosDelCliente(clienteId);
    const fechasMasRecientes = new Map<
      string,
      (typeof costosClientes)[0]
    >();

    costos.forEach((costo) => {
      const key = costo.tipoAveId;
      const existing = fechasMasRecientes.get(key);
      if (!existing || costo.fecha > existing.fecha) {
        fechasMasRecientes.set(key, costo);
      }
    });

    return Array.from(fechasMasRecientes.values());
  };

  // Obtener historial agrupado por fecha con filtros
  const getHistorialPorFecha = (clienteId: string) => {
    let costos = getCostosDelCliente(clienteId);

    // Aplicar filtro de rango de fechas
    if (filtroFechaDesde) {
      costos = costos.filter(
        (c) => c.fecha >= filtroFechaDesde,
      );
    }
    if (filtroFechaHasta) {
      costos = costos.filter(
        (c) => c.fecha <= filtroFechaHasta,
      );
    }

    // Aplicar filtro por tipo de ave
    if (filtroTipoAve) {
      costos = costos.filter(
        (c) => c.tipoAveId === filtroTipoAve,
      );
    }

    const porFecha = new Map<string, typeof costosClientes>();

    costos.forEach((costo) => {
      const fechaKey = costo.fecha;
      if (!porFecha.has(fechaKey)) {
        porFecha.set(fechaKey, []);
      }
      porFecha.get(fechaKey)!.push(costo);
    });

    // Ordenar por fecha según el orden seleccionado
    return Array.from(porFecha.entries()).sort((a, b) =>
      ordenFecha === "desc"
        ? b[0].localeCompare(a[0])
        : a[0].localeCompare(b[0]),
    );
  };

  // Función para limpiar filtros
  const limpiarFiltros = () => {
    setFiltroFechaDesde("");
    setFiltroFechaHasta("");
    setFiltroTipoAve("");
    setOrdenFecha("desc");
  };

  // Calcular cambio de precio
  const getChangePrecio = (
    precioActual: number,
    precioAnterior: number | null,
  ) => {
    if (precioAnterior === null)
      return { tipo: "nuevo", diferencia: 0 };
    const diferencia = precioActual - precioAnterior;

    if (diferencia > 0) return { tipo: "subio", diferencia };
    if (diferencia < 0) return { tipo: "bajo", diferencia };
    return { tipo: "igual", diferencia: 0 };
  };

  const handleOpenGestionModal = (clienteId: string) => {
    setSelectedClienteId(clienteId);
    setDiaSeleccionado("hoy"); // Iniciar en HOY por defecto
    // Inicializar formulario con precios más recientes
    const preciosMasRecientes =
      getPreciosMasRecientes(clienteId);
    const preciosInicial: { [tipoAveId: string]: string } = {};
    preciosMasRecientes.forEach((costo) => {
      preciosInicial[costo.tipoAveId] =
        costo.precioPorKg.toString();
    });
    setPreciosForm(preciosInicial);
    setIsGestionModalOpen(true);
  };

  const handleOpenHistorialModal = (clienteId: string) => {
    setHistorialClienteId(clienteId);
    setIsHistorialModalOpen(true);
  };

  const handleCloseGestionModal = () => {
    setIsGestionModalOpen(false);
    setSelectedClienteId(null);
    setPreciosForm({});
    setDiaSeleccionado("hoy"); // Reset al cerrar
  };

  // Función para cambiar de día y cargar precios correspondientes
  const handleCambioDia = (dia: "hoy" | "manana") => {
    setDiaSeleccionado(dia);

    if (!selectedClienteId) return;

    const fecha =
      dia === "hoy"
        ? new Date().toISOString().split("T")[0]
        : new Date(Date.now() + 86400000)
            .toISOString()
            .split("T")[0];

    // Cargar precios de ese día si existen
    const costosDelDia = costosClientes.filter(
      (c) =>
        c.clienteId === selectedClienteId && c.fecha === fecha,
    );

    const preciosDelDia: { [tipoAveId: string]: string } = {};

    if (costosDelDia.length > 0) {
      // Si hay precios para ese día, cargarlos
      costosDelDia.forEach((costo) => {
        preciosDelDia[costo.tipoAveId] =
          costo.precioPorKg.toString();
      });
    } else if (dia === "manana") {
      // Si es mañana y no hay precios, copiar los de hoy como sugerencia
      const preciosMasRecientes = getPreciosMasRecientes(
        selectedClienteId,
      );
      preciosMasRecientes.forEach((costo) => {
        preciosDelDia[costo.tipoAveId] =
          costo.precioPorKg.toString();
      });
    }

    setPreciosForm(preciosDelDia);
  };

  const handleSubmitGestion = (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedClienteId) return;

    const cliente = clientes.find(
      (c) => c.id === selectedClienteId,
    );
    if (!cliente) return;

    const nuevaFecha =
      diaSeleccionado === "hoy"
        ? diaSeleccionado === "hoy"
          ? new Date().toISOString().split("T")[0]
          : new Date(Date.now() + 86400000)
              .toISOString()
              .split("T")[0]
        : new Date(Date.now() + 86400000)
            .toISOString()
            .split("T")[0];
    let costosActualizados = [...costosClientes];

    // Procesar cada tipo de ave
    tiposAve.forEach((tipoAve) => {
      const precioStr = preciosForm[tipoAve.id];
      const preciosMasRecientes = getPreciosMasRecientes(
        selectedClienteId,
      );
      const costoExistente = preciosMasRecientes.find(
        (c) => c.tipoAveId === tipoAve.id,
      );

      if (
        precioStr &&
        precioStr.trim() !== "" &&
        parseFloat(precioStr) > 0
      ) {
        // Hay un precio válido - crear nuevo registro histórico
        const precio = parseFloat(precioStr);

        // Crear nuevo registro (no actualizar, para mantener historial)
        const nuevoCosto = {
          id:
            Date.now().toString() +
            "-" +
            tipoAve.id +
            "-" +
            Math.random(),
          clienteId: selectedClienteId,
          clienteNombre: cliente.nombre,
          tipoAveId: tipoAve.id,
          tipoAveNombre: tipoAve.nombre,
          precioPorKg: precio,
          fecha: nuevaFecha,
        };
        costosActualizados.push(nuevoCosto);
      }
    });

    setCostosClientes(costosActualizados);
    handleCloseGestionModal();
  };

  const handleEliminarPrecio = (costoId: string) => {
    if (confirm("¿Está seguro de eliminar este precio?")) {
      setCostosClientes(
        costosClientes.filter((c) => c.id !== costoId),
      );
    }
  };

  // Funciones para editar precio individual
  const handleOpenEditPrecioModal = (
    costo: (typeof costosClientes)[0],
  ) => {
    setEditingCosto(costo);
    setEditPrecio(costo.precioPorKg.toString());
    setEditFecha(costo.fecha);
    setIsEditPrecioModalOpen(true);
  };

  const handleCloseEditPrecioModal = () => {
    setIsEditPrecioModalOpen(false);
    setEditingCosto(null);
    setEditPrecio("");
    setEditFecha("");
  };

  const handleSubmitEditPrecio = (e: React.FormEvent) => {
    e.preventDefault();

    if (!editingCosto || !editPrecio || !editFecha) return;

    const nuevoPrecio = parseFloat(editPrecio);
    if (isNaN(nuevoPrecio) || nuevoPrecio <= 0) {
      alert("Por favor ingrese un precio válido");
      return;
    }

    // Actualizar el precio
    const costosActualizados = costosClientes.map((c) =>
      c.id === editingCosto.id
        ? { ...c, precioPorKg: nuevoPrecio, fecha: editFecha }
        : c,
    );

    setCostosClientes(costosActualizados);
    handleCloseEditPrecioModal();
  };

  // Estadísticas
  const totalCostos = costosClientes.length;
  const precioPromedio =
    costosClientes.length > 0
      ? (
          costosClientes.reduce(
            (acc, c) => acc + c.precioPorKg,
            0,
          ) / costosClientes.length
        ).toFixed(2)
      : "0.00";
  const precioMinimo =
    costosClientes.length > 0
      ? Math.min(
          ...costosClientes.map((c) => c.precioPorKg),
        ).toFixed(2)
      : "0.00";
  const precioMaximo =
    costosClientes.length > 0
      ? Math.max(
          ...costosClientes.map((c) => c.precioPorKg),
        ).toFixed(2)
      : "0.00";

  // Datos para gráfico
  const preciosPorTipoAve = tiposAve
    .map((tipo) => {
      const costosDelTipo = costosClientes.filter(
        (c) => c.tipoAveId === tipo.id,
      );
      const promedio =
        costosDelTipo.length > 0
          ? costosDelTipo.reduce(
              (acc, c) => acc + c.precioPorKg,
              0,
            ) / costosDelTipo.length
          : 0;
      return {
        nombre: tipo.nombre,
        precio: parseFloat(promedio.toFixed(2)),
        color: tipo.color,
      };
    })
    .filter((item) => item.precio > 0);

  const clienteSeleccionado = clientes.find(
    (c) => c.id === selectedClienteId,
  );

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4 md:mb-6">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-1 md:mb-2">
            Costos por Cliente
          </h2>
          <p className="text-sm md:text-base text-gray-400">
            Gestiona los precios de forma visual por cliente
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <div
          className="backdrop-blur-xl rounded-lg md:rounded-xl p-4 md:p-6"
          style={{
            background: "rgba(0, 0, 0, 0.3)",
            border: "1px solid rgba(255, 255, 255, 0.2)",
          }}
        >
          <div className="flex items-center justify-between mb-2">
            <p className="text-gray-400 text-xs md:text-sm">
              Total Precios
            </p>
            <DollarSign className="w-4 h-4 md:w-5 md:h-5 text-gray-400" />
          </div>
          <p className="text-2xl md:text-3xl font-bold text-white">
            {totalCostos}
          </p>
        </div>

        <div
          className="backdrop-blur-xl rounded-lg md:rounded-xl p-4 md:p-6"
          style={{
            background: "rgba(0, 0, 0, 0.3)",
            border: "1px solid rgba(204, 170, 0, 0.3)",
          }}
        >
          <div className="flex items-center justify-between mb-2">
            <p className="text-gray-400 text-xs md:text-sm">
              Promedio
            </p>
            <TrendingUp
              className="w-4 h-4 md:w-5 md:h-5"
              style={{ color: "#ccaa00" }}
            />
          </div>
          <p
            className="text-2xl md:text-3xl font-bold"
            style={{ color: "#ccaa00" }}
          >
            S/ {precioPromedio}
          </p>
        </div>

        <div
          className="backdrop-blur-xl rounded-lg md:rounded-xl p-4 md:p-6"
          style={{
            background: "rgba(0, 0, 0, 0.3)",
            border: "1px solid rgba(34, 197, 94, 0.3)",
          }}
        >
          <div className="flex items-center justify-between mb-2">
            <p className="text-gray-400 text-xs md:text-sm">
              Mínimo
            </p>
            <DollarSign
              className="w-4 h-4 md:w-5 md:h-5"
              style={{ color: "#22c55e" }}
            />
          </div>
          <p
            className="text-2xl md:text-3xl font-bold"
            style={{ color: "#22c55e" }}
          >
            S/ {precioMinimo}
          </p>
        </div>

        <div
          className="backdrop-blur-xl rounded-lg md:rounded-xl p-4 md:p-6"
          style={{
            background: "rgba(0, 0, 0, 0.3)",
            border: "1px solid rgba(239, 68, 68, 0.3)",
          }}
        >
          <div className="flex items-center justify-between mb-2">
            <p className="text-gray-400 text-xs md:text-sm">
              Máximo
            </p>
            <DollarSign
              className="w-4 h-4 md:w-5 md:h-5"
              style={{ color: "#ef4444" }}
            />
          </div>
          <p
            className="text-2xl md:text-3xl font-bold"
            style={{ color: "#ef4444" }}
          >
            S/ {precioMaximo}
          </p>
        </div>
      </div>

      {/* Búsqueda */}
      <div
        className="backdrop-blur-xl rounded-lg md:rounded-xl p-3 md:p-4"
        style={{
          background: "rgba(0, 0, 0, 0.3)",
          border: "1px solid rgba(255, 255, 255, 0.1)",
        }}
      >
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 md:w-5 md:h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar cliente..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 md:pl-12 pr-3 md:pr-4 py-2.5 md:py-3 rounded-lg text-sm md:text-base text-white placeholder-gray-400"
            style={{
              background: "rgba(255, 255, 255, 0.05)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
            }}
          />
        </div>
      </div>

      {/* Tarjetas de Clientes */}
      <div className="grid grid-cols-1 gap-4">
        {filteredClientes.map((cliente) => {
          const costosCliente = getCostosDelCliente(cliente.id);
          const isExpanded = expandedClients.has(cliente.id);

          return (
            <div
              key={cliente.id}
              className="backdrop-blur-xl rounded-lg md:rounded-xl overflow-hidden transition-all"
              style={{
                background: "rgba(0, 0, 0, 0.3)",
                border: "1px solid rgba(204, 170, 0, 0.3)",
              }}
            >
              {/* Header del Cliente */}
              <div className="p-4 md:p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3 flex-1">
                    <div
                      className="w-12 h-12 md:w-14 md:h-14 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{
                        background:
                          "linear-gradient(135deg, #ccaa00, #b8941e)",
                      }}
                    >
                      <User className="w-6 h-6 md:w-7 md:h-7 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg md:text-xl font-bold text-white truncate">
                        {cliente.nombre}
                      </h3>
                      <p className="text-xs md:text-sm text-gray-400">
                        {costosCliente.length}{" "}
                        {costosCliente.length === 1
                          ? "precio configurado"
                          : "precios configurados"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() =>
                        handleOpenGestionModal(cliente.id)
                      }
                      className="px-3 md:px-4 py-2 md:py-2.5 rounded-lg font-bold transition-all hover:scale-105 flex items-center gap-2"
                      style={{
                        background:
                          "linear-gradient(to right, #0d4a24, #166534, #b8941e, #ccaa00)",
                        color: "white",
                        boxShadow:
                          "0 4px 15px rgba(204, 170, 0, 0.4)",
                      }}
                    >
                      <Settings className="w-4 h-4" />
                      <span className="hidden sm:inline text-sm">
                        Gestionar
                      </span>
                    </button>
                    <button
                      onClick={() =>
                        handleOpenHistorialModal(cliente.id)
                      }
                      className="p-2 md:p-2.5 rounded-lg transition-all hover:scale-105"
                      style={{
                        background: "rgba(255, 255, 255, 0.1)",
                        border:
                          "1px solid rgba(255, 255, 255, 0.2)",
                      }}
                    >
                      <History className="w-5 h-5 text-gray-400" />
                    </button>
                    <button
                      onClick={() =>
                        toggleClientExpansion(cliente.id)
                      }
                      className="p-2 md:p-2.5 rounded-lg transition-all hover:scale-105"
                      style={{
                        background: "rgba(255, 255, 255, 0.1)",
                        border:
                          "1px solid rgba(255, 255, 255, 0.2)",
                      }}
                    >
                      {isExpanded ? (
                        <ChevronUp className="w-5 h-5 text-gray-400" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-gray-400" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Precios del Cliente (expandible) */}
                {isExpanded &&
                  (() => {
                    const preciosAgrupados =
                      getPreciosAgrupadosPorFecha(cliente.id);

                    return (
                      <div
                        className="space-y-4 mt-4 pt-4 border-t"
                        style={{
                          borderColor:
                            "rgba(255, 255, 255, 0.1)",
                        }}
                      >
                        {preciosAgrupados.length > 0 ? (
                          preciosAgrupados.map((grupo) => (
                            <div key={grupo.fecha}>
                              {/* Etiqueta de día */}
                              <div className="flex items-center gap-2 mb-3">
                                <div
                                  className="px-3 py-1 rounded-lg"
                                  style={{
                                    background:
                                      grupo.label === "HOY"
                                        ? "rgba(34, 197, 94, 0.2)"
                                        : "rgba(255, 255, 255, 0.1)",
                                    border:
                                      grupo.label === "HOY"
                                        ? "1px solid rgba(34, 197, 94, 0.3)"
                                        : "1px solid rgba(255, 255, 255, 0.2)",
                                  }}
                                >
                                  <p
                                    className="text-xs font-bold"
                                    style={{
                                      color:
                                        grupo.label === "HOY"
                                          ? "#22c55e"
                                          : "#ffffff",
                                    }}
                                  >
                                    {grupo.label}
                                  </p>
                                </div>
                                <p className="text-xs text-gray-500">
                                  {grupo.fecha}
                                </p>
                              </div>

                              {/* Grid de precios */}
                              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 mb-3">
                                {grupo.costos.map((costo) => {
                                  const tipoAve = tiposAve.find(
                                    (t) =>
                                      t.id === costo.tipoAveId,
                                  );

                                  return (
                                    <div
                                      key={costo.id}
                                      className="p-3 rounded-lg transition-all hover:scale-105"
                                      style={{
                                        background:
                                          "rgba(255, 255, 255, 0.05)",
                                        border: `2px solid ${tipoAve?.color || "#888"}20`,
                                      }}
                                    >
                                      <div className="flex items-center gap-2 mb-2">
                                        <div
                                          className="w-8 h-8 rounded-lg flex items-center justify-center"
                                          style={{
                                            backgroundColor:
                                              tipoAve?.color ||
                                              "#888",
                                          }}
                                        >
                                          <Bird className="w-4 h-4 text-white" />
                                        </div>
                                        <p className="font-bold text-white text-sm flex-1 truncate">
                                          {costo.tipoAveNombre}
                                        </p>
                                      </div>
                                      <div className="flex items-end justify-between">
                                        <div>
                                          <p className="text-xs text-gray-400 mb-1">
                                            Precio/Kg
                                          </p>
                                          <p
                                            className="text-xl font-bold"
                                            style={{
                                              color:
                                                tipoAve?.color ||
                                                "#888",
                                            }}
                                          >
                                            S/{" "}
                                            {costo.precioPorKg.toFixed(
                                              2,
                                            )}
                                          </p>
                                        </div>
                                        <button
                                          onClick={() =>
                                            handleOpenEditPrecioModal(
                                              costo,
                                            )
                                          }
                                          className="p-1.5 rounded-lg transition-all hover:scale-110"
                                          style={{
                                            background:
                                              "rgba(204, 170, 0, 0.2)",
                                            border:
                                              "1px solid rgba(204, 170, 0, 0.3)",
                                          }}
                                        >
                                          <Edit2
                                            className="w-3.5 h-3.5"
                                            style={{
                                              color: "#ccaa00",
                                            }}
                                          />
                                        </button>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="text-center py-8">
                            <Bird className="w-12 h-12 mx-auto mb-3 text-gray-600" />
                            <p className="text-gray-400 text-sm">
                              No hay precios de hoy o ayer
                            </p>
                            <button
                              onClick={() =>
                                handleOpenGestionModal(
                                  cliente.id,
                                )
                              }
                              className="mt-3 px-4 py-2 rounded-lg text-sm font-bold transition-all hover:scale-105"
                              style={{
                                background:
                                  "rgba(204, 170, 0, 0.2)",
                                border:
                                  "1px solid rgba(204, 170, 0, 0.3)",
                                color: "#ccaa00",
                              }}
                            >
                              Agregar Precios
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })()}
              </div>
            </div>
          );
        })}
      </div>

      {filteredClientes.length === 0 && (
        <div className="text-center py-12">
          <User className="w-16 h-16 mx-auto mb-4 text-gray-600" />
          <p className="text-gray-400">
            No se encontraron clientes
          </p>
        </div>
      )}

      {/* Gráfico */}
      {preciosPorTipoAve.length > 0 && (
        <div
          className="backdrop-blur-xl rounded-lg md:rounded-xl p-4 md:p-6"
          style={{
            background: "rgba(0, 0, 0, 0.3)",
            border: "1px solid rgba(204, 170, 0, 0.3)",
          }}
        >
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp
              className="w-5 h-5"
              style={{ color: "#ccaa00" }}
            />
            <h3 className="text-base md:text-lg font-bold text-white">
              Precio Promedio por Tipo de Ave
            </h3>
          </div>
          <div style={{ width: '100%', height: '250px', minHeight: '250px', minWidth: 0 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={preciosPorTipoAve}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="rgba(255,255,255,0.1)"
                />
                <XAxis
                  dataKey="nombre"
                  stroke="#888"
                  tick={{ fontSize: 12 }}
                />
                <YAxis
                  stroke="#888"
                  tick={{ fontSize: 12 }}
                  label={{
                    value: "Precio S/",
                    angle: -90,
                    position: "insideLeft",
                    style: { fill: "#888" },
                  }}
                />
                <Tooltip
                  contentStyle={{
                    background: "rgba(0, 0, 0, 0.9)",
                    border: "1px solid rgba(204, 170, 0, 0.5)",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                  labelStyle={{ color: "#fff" }}
                  formatter={(value: number) => [
                    `S/ ${value.toFixed(2)}`,
                    "Precio",
                  ]}
                />
                <Bar dataKey="precio" radius={[8, 8, 0, 0]}>
                  {preciosPorTipoAve.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.color}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Modal de Gestión de Precios */}
      {isGestionModalOpen && clienteSeleccionado && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 overflow-y-auto"
          style={{ background: "rgba(0, 0, 0, 0.85)" }}
          onClick={handleCloseGestionModal}
        >
          <div
            className="backdrop-blur-2xl rounded-2xl sm:rounded-3xl w-full max-w-2xl p-4 sm:p-6 max-h-[90vh] overflow-y-auto"
            style={{
              background:
                "linear-gradient(135deg, rgba(0, 0, 0, 0.7) 0%, rgba(13, 74, 36, 0.3) 50%, rgba(0, 0, 0, 0.7) 100%)",
              border: "2px solid rgba(204, 170, 0, 0.3)",
              boxShadow:
                "0 30px 60px -12px rgba(0, 0, 0, 0.8), 0 0 100px rgba(204, 170, 0, 0.15)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div
              className="flex items-center justify-between mb-4 sm:mb-6 pb-4 border-b"
              style={{ borderColor: "rgba(204, 170, 0, 0.2)" }}
            >
              <div className="flex items-center gap-3 sm:gap-4">
                <div
                  className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl flex items-center justify-center flex-shrink-0"
                  style={{
                    background:
                      "linear-gradient(135deg, #ccaa00, #b8941e)",
                    boxShadow:
                      "0 10px 30px rgba(204, 170, 0, 0.4)",
                  }}
                >
                  <Settings className="w-6 h-6 sm:w-7 sm:h-7 text-black" />
                </div>
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-white">
                    Gestionar Precios
                  </h2>
                  <p className="text-xs sm:text-sm text-gray-400">
                    {clienteSeleccionado.nombre}
                  </p>
                </div>
              </div>
              <button
                onClick={handleCloseGestionModal}
                className="p-2 sm:p-3 rounded-xl transition-all hover:scale-110 hover:rotate-90"
                style={{
                  background: "rgba(239, 68, 68, 0.2)",
                  border: "1px solid rgba(239, 68, 68, 0.3)",
                }}
              >
                <X
                  className="w-5 h-5 sm:w-6 sm:h-6"
                  style={{ color: "#ef4444" }}
                />
              </button>
            </div>

            <form
              onSubmit={handleSubmitGestion}
              className="space-y-3 sm:space-y-4"
            >
              {/* Selector de Día (HOY / MAÑANA) */}
              <div className="flex gap-2 mb-4">
                <button
                  type="button"
                  onClick={() => handleCambioDia("hoy")}
                  className="flex-1 px-4 py-3 rounded-lg font-bold transition-all hover:scale-105 flex items-center justify-center gap-2"
                  style={{
                    background:
                      diaSeleccionado === "hoy"
                        ? "linear-gradient(to right, #0d4a24, #166534, #b8941e, #ccaa00)"
                        : "rgba(255, 255, 255, 0.05)",
                    border:
                      diaSeleccionado === "hoy"
                        ? "2px solid rgba(204, 170, 0, 0.5)"
                        : "1px solid rgba(255, 255, 255, 0.2)",
                    color:
                      diaSeleccionado === "hoy"
                        ? "#ffffff"
                        : "#888",
                    boxShadow:
                      diaSeleccionado === "hoy"
                        ? "0 4px 15px rgba(204, 170, 0, 0.4)"
                        : "none",
                  }}
                >
                  <Calendar className="w-4 h-4" />
                  <div className="text-left">
                    <p className="text-xs">HOY</p>
                    <p className="text-xs font-normal opacity-75">
                      {new Date().toISOString().split("T")[0]}
                    </p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handleCambioDia("manana")}
                  className="flex-1 px-4 py-3 rounded-lg font-bold transition-all hover:scale-105 flex items-center justify-center gap-2"
                  style={{
                    background:
                      diaSeleccionado === "manana"
                        ? "linear-gradient(to right, #0d4a24, #166534, #b8941e, #ccaa00)"
                        : "rgba(255, 255, 255, 0.05)",
                    border:
                      diaSeleccionado === "manana"
                        ? "2px solid rgba(204, 170, 0, 0.5)"
                        : "1px solid rgba(255, 255, 255, 0.2)",
                    color:
                      diaSeleccionado === "manana"
                        ? "#ffffff"
                        : "#888",
                    boxShadow:
                      diaSeleccionado === "manana"
                        ? "0 4px 15px rgba(204, 170, 0, 0.4)"
                        : "none",
                  }}
                >
                  <Calendar className="w-4 h-4" />
                  <div className="text-left">
                    <p className="text-xs">MAÑANA</p>
                    <p className="text-xs font-normal opacity-75">
                      {
                        new Date(Date.now() + 86400000)
                          .toISOString()
                          .split("T")[0]
                      }
                    </p>
                  </div>
                </button>
              </div>

              

              <p className="text-sm text-gray-400 mb-4">
                Configure los precios por Kg para cada tipo de
                ave. Deje vacío para eliminar el precio.
              </p>

              {/* Grid de Tipos de Ave */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                {tiposAve.map((tipoAve) => {
                  const costoExistente = costosClientes.find(
                    (c) =>
                      c.clienteId === selectedClienteId &&
                      c.tipoAveId === tipoAve.id,
                  );

                  return (
                    <div
                      key={tipoAve.id}
                      className="p-4 rounded-lg transition-all"
                      style={{
                        background: "rgba(255, 255, 255, 0.05)",
                        border: `2px solid ${tipoAve.color}30`,
                      }}
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <div
                          className="w-12 h-12 rounded-lg flex items-center justify-center"
                          style={{
                            backgroundColor: tipoAve.color,
                          }}
                        >
                          <Bird className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <p className="font-bold text-white">
                            {tipoAve.nombre}
                          </p>
                          {costoExistente && (
                            <p className="text-xs text-gray-400">
                              Actual: S/{" "}
                              {costoExistente.precioPorKg.toFixed(
                                2,
                              )}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={preciosForm[tipoAve.id] || ""}
                          onChange={(e) =>
                            setPreciosForm({
                              ...preciosForm,
                              [tipoAve.id]: e.target.value,
                            })
                          }
                          className="w-full pl-10 pr-3 py-2.5 rounded-lg text-sm text-white placeholder-gray-400 transition-all focus:ring-2"
                          style={{
                            background:
                              "rgba(255, 255, 255, 0.08)",
                            border: `1.5px solid ${tipoAve.color}50`,
                            outlineColor: tipoAve.color,
                          }}
                          placeholder="0.00"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Botones */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={handleCloseGestionModal}
                  className="flex-1 px-4 py-2.5 sm:py-3 rounded-lg sm:rounded-xl font-bold transition-all hover:scale-105 text-sm sm:text-base"
                  style={{
                    background: "rgba(255, 255, 255, 0.1)",
                    border:
                      "1px solid rgba(255, 255, 255, 0.2)",
                    color: "#ffffff",
                  }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2.5 sm:py-3 rounded-lg sm:rounded-xl font-bold transition-all hover:scale-105 text-sm sm:text-base"
                  style={{
                    background:
                      "linear-gradient(to right, #0d4a24, #166534, #b8941e, #ccaa00)",
                    color: "white",
                    boxShadow:
                      "0 4px 15px rgba(204, 170, 0, 0.4)",
                  }}
                >
                  Guardar Cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Historial de Precios */}
      {isHistorialModalOpen && historialClienteId && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 overflow-y-auto"
          style={{ background: "rgba(0, 0, 0, 0.85)" }}
          onClick={() => setIsHistorialModalOpen(false)}
        >
          <div
            className="backdrop-blur-2xl rounded-2xl sm:rounded-3xl w-full max-w-2xl p-4 sm:p-6 max-h-[90vh] overflow-y-auto"
            style={{
              background:
                "linear-gradient(135deg, rgba(0, 0, 0, 0.7) 0%, rgba(13, 74, 36, 0.3) 50%, rgba(0, 0, 0, 0.7) 100%)",
              border: "2px solid rgba(204, 170, 0, 0.3)",
              boxShadow:
                "0 30px 60px -12px rgba(0, 0, 0, 0.8), 0 0 100px rgba(204, 170, 0, 0.15)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div
              className="flex items-center justify-between mb-4 sm:mb-6 pb-4 border-b"
              style={{ borderColor: "rgba(204, 170, 0, 0.2)" }}
            >
              <div className="flex items-center gap-3 sm:gap-4">
                <div
                  className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl flex items-center justify-center flex-shrink-0"
                  style={{
                    background:
                      "linear-gradient(135deg, #ccaa00, #b8941e)",
                    boxShadow:
                      "0 10px 30px rgba(204, 170, 0, 0.4)",
                  }}
                >
                  <History className="w-6 h-6 sm:w-7 sm:h-7 text-black" />
                </div>
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-white">
                    Historial de Precios
                  </h2>
                  <p className="text-xs sm:text-sm text-gray-400">
                    {clienteSeleccionado?.nombre}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsHistorialModalOpen(false)}
                className="p-2 sm:p-3 rounded-xl transition-all hover:scale-110 hover:rotate-90"
                style={{
                  background: "rgba(239, 68, 68, 0.2)",
                  border: "1px solid rgba(239, 68, 68, 0.3)",
                }}
              >
                <X
                  className="w-5 h-5 sm:w-6 sm:h-6"
                  style={{ color: "#ef4444" }}
                />
              </button>
            </div>

            {/* Filtros */}
            <div className="mb-4 space-y-3">
              <div
                className="backdrop-blur-xl rounded-lg p-3"
                style={{
                  background: "rgba(0, 0, 0, 0.3)",
                  border: "1px solid rgba(204, 170, 0, 0.2)",
                }}
              >
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Filtro Fecha Desde */}
                  <div>
                    <label className="block text-xs font-bold mb-1.5 text-gray-400">
                      Desde
                    </label>
                    <input
                      type="date"
                      value={filtroFechaDesde}
                      onChange={(e) =>
                        setFiltroFechaDesde(e.target.value)
                      }
                      className="w-full px-3 py-2 rounded-lg text-sm text-white"
                      style={{
                        background: "rgba(255, 255, 255, 0.05)",
                        border:
                          "1px solid rgba(204, 170, 0, 0.3)",
                      }}
                    />
                  </div>

                  {/* Filtro Fecha Hasta */}
                  <div>
                    <label className="block text-xs font-bold mb-1.5 text-gray-400">
                      Hasta
                    </label>
                    <input
                      type="date"
                      value={filtroFechaHasta}
                      onChange={(e) =>
                        setFiltroFechaHasta(e.target.value)
                      }
                      className="w-full px-3 py-2 rounded-lg text-sm text-white"
                      style={{
                        background: "rgba(255, 255, 255, 0.05)",
                        border:
                          "1px solid rgba(204, 170, 0, 0.3)",
                      }}
                    />
                  </div>

                  {/* Filtro Tipo de Ave */}
                  <div>
                    <label className="block text-xs font-bold mb-1.5 text-gray-400">
                      Tipo de Ave
                    </label>
                    <select
                      value={filtroTipoAve}
                      onChange={(e) =>
                        setFiltroTipoAve(e.target.value)
                      }
                      className="w-full px-3 py-2 rounded-lg text-sm text-white"
                      style={{
                        background: "rgba(255, 255, 255, 0.05)",
                        border:
                          "1px solid rgba(204, 170, 0, 0.3)",
                      }}
                    >
                      <option value="">Todas</option>
                      {tiposAve.map((tipo) => (
                        <option key={tipo.id} value={tipo.id}>
                          {tipo.nombre}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Orden y Limpiar Filtros */}
                <div
                  className="flex items-center justify-between mt-3 pt-3 border-t"
                  style={{
                    borderColor: "rgba(255, 255, 255, 0.1)",
                  }}
                >
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() =>
                        setOrdenFecha(
                          ordenFecha === "desc"
                            ? "asc"
                            : "desc",
                        )
                      }
                      className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all hover:scale-105 flex items-center gap-1.5"
                      style={{
                        background: "rgba(204, 170, 0, 0.2)",
                        border:
                          "1px solid rgba(204, 170, 0, 0.3)",
                        color: "#ccaa00",
                      }}
                    >
                      <ArrowUpDown className="w-3 h-3" />
                      {ordenFecha === "desc"
                        ? "Más reciente"
                        : "Más antiguo"}
                    </button>
                  </div>
                  <button
                    onClick={limpiarFiltros}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all hover:scale-105"
                    style={{
                      background: "rgba(255, 255, 255, 0.1)",
                      border:
                        "1px solid rgba(255, 255, 255, 0.2)",
                      color: "#ffffff",
                    }}
                  >
                    Limpiar Filtros
                  </button>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              {getHistorialPorFecha(historialClienteId).map(
                ([fecha, costos]) => (
                  <div
                    key={fecha}
                    className="backdrop-blur-xl rounded-lg md:rounded-xl p-4 md:p-6"
                    style={{
                      background: "rgba(0, 0, 0, 0.3)",
                      border:
                        "1px solid rgba(255, 255, 255, 0.1)",
                    }}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <p className="text-sm md:text-base font-bold text-white">
                          {fecha}
                        </p>
                      </div>
                      <span className="text-xs text-gray-500">
                        {costos.length}{" "}
                        {costos.length === 1
                          ? "precio"
                          : "precios"}
                      </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {costos.map((costo) => {
                        const tipoAve = tiposAve.find(
                          (t) => t.id === costo.tipoAveId,
                        );

                        return (
                          <div
                            key={costo.id}
                            className="p-3 rounded-lg relative"
                            style={{
                              background:
                                "rgba(255, 255, 255, 0.05)",
                              border: `2px solid ${tipoAve?.color || "#888"}30`,
                            }}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <div
                                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                                  style={{
                                    backgroundColor:
                                      tipoAve?.color || "#888",
                                  }}
                                >
                                  <Bird className="w-4 h-4 text-white" />
                                </div>
                                <p className="font-bold text-white text-sm truncate">
                                  {costo.tipoAveNombre}
                                </p>
                              </div>
                              <button
                                onClick={() =>
                                  handleOpenEditPrecioModal(
                                    costo,
                                  )
                                }
                                className="p-1.5 rounded-lg transition-all hover:scale-110"
                                style={{
                                  background:
                                    "rgba(204, 170, 0, 0.2)",
                                  border:
                                    "1px solid rgba(204, 170, 0, 0.3)",
                                }}
                              >
                                <Edit2
                                  className="w-3 h-3"
                                  style={{ color: "#ccaa00" }}
                                />
                              </button>
                            </div>
                            <p
                              className="text-2xl font-bold"
                              style={{
                                color: tipoAve?.color || "#888",
                              }}
                            >
                              S/ {costo.precioPorKg.toFixed(2)}
                            </p>
                            <p className="text-xs text-gray-400 mt-1">
                              por Kg
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ),
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal de Edición de Precio */}
      {isEditPrecioModalOpen &&
        editingCosto &&
        (() => {
          const tipoAveEditing = tiposAve.find(
            (t) => t.id === editingCosto.tipoAveId,
          );
          return (
            <div
              className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-4 md:p-6 overflow-y-auto"
              style={{ background: "rgba(0, 0, 0, 0.85)" }}
              onClick={handleCloseEditPrecioModal}
            >
              <div
                className="backdrop-blur-2xl rounded-2xl w-full max-w-md p-4 sm:p-6"
                style={{
                  background:
                    "linear-gradient(135deg, rgba(0, 0, 0, 0.7) 0%, rgba(13, 74, 36, 0.3) 50%, rgba(0, 0, 0, 0.7) 100%)",
                  border: "2px solid rgba(204, 170, 0, 0.3)",
                  boxShadow:
                    "0 30px 60px -12px rgba(0, 0, 0, 0.8), 0 0 100px rgba(204, 170, 0, 0.15)",
                }}
                onClick={(e) => e.stopPropagation()}
              >
                {/* Header */}
                <div
                  className="flex items-center justify-between mb-4 pb-4 border-b"
                  style={{
                    borderColor: "rgba(204, 170, 0, 0.2)",
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center"
                      style={{
                        background:
                          "linear-gradient(135deg, #ccaa00, #b8941e)",
                        boxShadow:
                          "0 10px 30px rgba(204, 170, 0, 0.4)",
                      }}
                    >
                      <Edit2 className="w-6 h-6 text-black" />
                    </div>
                    <div>
                      <h2 className="text-lg sm:text-xl font-bold text-white">
                        Editar Precio
                      </h2>
                      <p className="text-xs text-gray-400">
                        {editingCosto.clienteNombre}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handleCloseEditPrecioModal}
                    className="p-2 rounded-xl transition-all hover:scale-110 hover:rotate-90"
                    style={{
                      background: "rgba(239, 68, 68, 0.2)",
                      border:
                        "1px solid rgba(239, 68, 68, 0.3)",
                    }}
                  >
                    <X
                      className="w-5 h-5"
                      style={{ color: "#ef4444" }}
                    />
                  </button>
                </div>

                <form
                  onSubmit={handleSubmitEditPrecio}
                  className="space-y-4"
                >
                  <p className="text-sm text-gray-400">
                    Edite el precio y/o la fecha del registro
                    histórico.
                  </p>

                  {/* Tipo de Ave */}
                  <div
                    className="p-4 rounded-lg"
                    style={{
                      background: "rgba(255, 255, 255, 0.05)",
                      border: `2px solid ${tipoAveEditing?.color || "#888"}30`,
                    }}
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div
                        className="w-12 h-12 rounded-lg flex items-center justify-center"
                        style={{
                          backgroundColor:
                            tipoAveEditing?.color || "#888",
                        }}
                      >
                        <Bird className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <p className="font-bold text-white">
                          {editingCosto.tipoAveNombre}
                        </p>
                        <p className="text-xs text-gray-400">
                          Actual: S/{" "}
                          {editingCosto.precioPorKg.toFixed(2)}
                        </p>
                      </div>
                    </div>

                    {/* Precio */}
                    <div className="mb-3">
                      <label className="block text-xs font-bold mb-1.5 text-gray-400">
                        Precio por Kg
                      </label>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={editPrecio}
                          onChange={(e) =>
                            setEditPrecio(e.target.value)
                          }
                          className="w-full pl-10 pr-3 py-2.5 rounded-lg text-sm text-white placeholder-gray-400 transition-all focus:ring-2"
                          style={{
                            background:
                              "rgba(255, 255, 255, 0.08)",
                            border: `1.5px solid ${tipoAveEditing?.color || "#888"}50`,
                            outlineColor:
                              tipoAveEditing?.color || "#888",
                          }}
                          placeholder="0.00"
                          required
                        />
                      </div>
                    </div>

                    {/* Fecha */}
                    <div>
                      <label className="block text-xs font-bold mb-1.5 text-gray-400">
                        Fecha
                      </label>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type="date"
                          value={editFecha}
                          onChange={(e) =>
                            setEditFecha(e.target.value)
                          }
                          className="w-full pl-10 pr-3 py-2.5 rounded-lg text-sm text-white"
                          style={{
                            background:
                              "rgba(255, 255, 255, 0.08)",
                            border: `1.5px solid ${tipoAveEditing?.color || "#888"}50`,
                          }}
                          required
                        />
                      </div>
                    </div>
                  </div>

                  {/* Botones */}
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={handleCloseEditPrecioModal}
                      className="flex-1 px-4 py-2.5 rounded-lg font-bold transition-all hover:scale-105 text-sm"
                      style={{
                        background: "rgba(255, 255, 255, 0.1)",
                        border:
                          "1px solid rgba(255, 255, 255, 0.2)",
                        color: "#ffffff",
                      }}
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="flex-1 px-4 py-2.5 rounded-lg font-bold transition-all hover:scale-105 text-sm"
                      style={{
                        background:
                          "linear-gradient(to right, #0d4a24, #166534, #b8941e, #ccaa00)",
                        color: "white",
                        boxShadow:
                          "0 4px 15px rgba(204, 170, 0, 0.4)",
                      }}
                    >
                      Guardar Cambios
                    </button>
                  </div>
                </form>
              </div>
            </div>
          );
        })()}
    </div>
  );
}