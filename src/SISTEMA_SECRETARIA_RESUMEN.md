# 📋 Sistema de Secretaría - Avícola Jossy

## ✅ Implementación Completada

### 🔐 Credenciales de Acceso

**Usuario:** `secretaria`  
**Contraseña:** `secretaria123`  
**Código 2FA:** `123456`

**Empleado:** Ana García López  
**DNI:** 12345678  
**Cargo:** Secretaria

---

## 🎨 Layout y Navegación

### Panel Lateral (Sidebar)

**Ubicación:** `/components/LayoutSecretaria.tsx`

**Módulos en el menú:**
1. 📊 **Panel Principal** - Dashboard ejecutivo tipo Excel
2. 📦 **Inventario** - Proveedores y Aves (tabs integrados)
3. 🛒 **Gestión de Pedidos** - Crear y administrar pedidos
4. 👥 **Consulta de Clientes** - Ver información de clientes (solo lectura)

**Características del Layout:**
- ✅ Logo de Avícola Jossy en la parte superior
- ✅ Menú de navegación con iconos intuitivos
- ✅ Información del usuario actual (nombre, apellido, rol)
- ✅ Botón de cerrar sesión
- ✅ Responsive (móvil, tablet, desktop)
- ✅ Sidebar colapsable en desktop
- ✅ Sidebar deslizable en móvil/tablet
- ✅ Colores corporativos (dorado/oro y verde)

---

## 📊 Módulos Implementados

### 1. **Dashboard Principal - Panel Ejecutivo Tipo Excel**

**Ubicación:** `/components/DashboardSecretaria.tsx`

**Características principales:**
- ✅ **Tabla tipo Excel ejecutiva** - Vista profesional y automatizada
- ✅ **Estadísticas en tiempo real:**
  - Pedidos de hoy
  - Ventas del día
  - Pedidos pendientes
  - Total de pedidos
- ✅ **Sistema de filtros avanzado:**
  - Búsqueda por número de pedido, cliente o vendedor
  - Filtro por estado (Pendiente, En Proceso, Completado, Cancelado)
  - Filtro por fecha
- ✅ **Expansión de detalles:** Click para ver items completos del pedido
- ✅ **Exportación a CSV:** Descarga de todos los pedidos filtrados
- ✅ **Colores de estado visuales:**
  - 🟢 Verde: Completado
  - 🔵 Azul: En Proceso
  - 🟡 Amarillo: Pendiente
  - 🔴 Rojo: Cancelado

**Datos mostrados por pedido:**
- N° de Pedido (PED-XXX)
- Fecha y Hora
- Vendedor (nombre completo del trabajador)
- Cliente
- Cantidad de items
- Total en Soles (S/)
- Estado del pedido
- Acciones (Ver, Editar, Eliminar)

---

### 2. **Módulo de Gestión de Pedidos**

**Ubicación:** `/components/ModalNuevoPedido.tsx`

**Herencia de datos:**
- ✅ Tipos de aves desde el Inventario de Administrador
- ✅ Presentaciones con mermas específicas (Vivo, Pelado, Destripado)
- ✅ Variedades de aves
- ✅ Distinción de sexo (Macho/Hembra)

**Funcionalidades:**
- ✅ **Información general del pedido:**
  - Selección de vendedor (empleados con rol Secretaria/Administrador)
  - Selección de cliente
  - Fecha y hora del pedido
  
- ✅ **Agregar productos al pedido:**
  - Tipo de ave (Pollo, Gallina, Pato, Pavo, etc.)
  - Variedad (si aplica)
  - Sexo (si aplica)
  - Presentación (Vivo, Pelado, Destripado) con merma automática
  - Cantidad de unidades
  - Peso total en kg
  - Precio por kg (configurable)
  - Cálculo automático de subtotal

- ✅ **Tabla de items agregados:**
  - Vista detallada de todos los productos
  - Posibilidad de eliminar items
  - Cálculo automático del total del pedido

- ✅ **Notas adicionales:**
  - Campo para observaciones e instrucciones especiales

---

## 📝 Información de Pedidos

### Estructura de datos:

Cada pedido contiene:

```
- ID único
- Número de pedido (PED-XXX)
- Fecha y hora
- Vendedor (ID y nombre completo)
- Cliente (ID y nombre)
- Items del pedido:
  * Tipo de ave
  * Variedad (opcional)
  * Sexo (opcional)
  * Presentación
  * Cantidad
  * Peso en kg
  * Precio unitario por kg
  * Subtotal calculado
  * Merma aplicada
- Total del pedido
- Estado (pendiente/proceso/completado/cancelado)
- Notas adicionales
```

---

## 🔄 Integración con el Sistema

**Datos heredados del módulo de Administrador:**
1. **Tipos de Aves** (desde `/components/Aves.tsx`):
   - Pollo, Gallina, Pato, Pavo, etc.
   - Con configuración de sexo y variedades

2. **Presentaciones** (con mermas específicas):
   - Vivo: 0 kg de merma
   - Pelado: 0.15 kg de merma
   - Destripado: 0.20 kg de merma

3. **Empleados** (desde `/contexts/AppContext.tsx`):
   - Lista de vendedores disponibles
   - Datos completos (nombre, apellido, cargo)

---

## 💡 Características Especiales

### ✨ Automatización:
- **Cálculo automático de subtotales** al agregar productos
- **Cálculo automático del total** del pedido
- **Aplicación automática de mermas** según presentación
- **Numeración automática** de pedidos (PED-XXX)

### 📊 Visualización Tipo Excel:
- **Tabla profesional** con headers destacados en dorado
- **Filas alternadas** para mejor lectura
- **Expansión de detalles** con subtabla de items
- **Totales destacados** en verde para fácil identificación
- **Datos precisos** sin ruido visual innecesario

### 🔍 Sistema de Filtrado:
- **Búsqueda en tiempo real** por múltiples campos
- **Filtros combinables** (estado + fecha)
- **Contador de resultados** actualizado
- **Exportación de datos filtrados**

---

## 📱 Uso del Sistema

### Para crear un nuevo pedido:

1. Click en "Nuevo Pedido" (botón dorado superior derecho)
2. Seleccionar vendedor y cliente
3. Configurar fecha y hora
4. Agregar productos:
   - Seleccionar tipo de ave
   - Elegir variedad y sexo (si aplica)
   - Seleccionar presentación
   - Ingresar cantidad y peso
   - Definir precio por kg
   - Click en "Agregar"
5. Repetir para todos los productos
6. Agregar notas si es necesario
7. Click en "Crear Pedido"

### Para consultar pedidos:

1. Usar la barra de búsqueda para filtrar
2. Seleccionar estado específico si se desea
3. Filtrar por fecha
4. Click en el icono de paquete para ver detalles completos
5. Exportar a CSV si se necesita un reporte

---

## 🎯 Ventajas del Sistema

✅ **Eficiencia:** Registro rápido de pedidos con cálculos automáticos  
✅ **Precisión:** Datos exactos con aplicación automática de mermas  
✅ **Visibilidad:** Vista completa de todos los pedidos en formato ejecutivo  
✅ **Trazabilidad:** Cada pedido registra vendedor, cliente y detalles completos  
✅ **Reportes:** Exportación fácil a CSV para análisis  
✅ **Intuitivo:** Interfaz clara y fácil de usar  
✅ **Profesional:** Diseño empresarial optimizado para trabajo nocturno  
✅ **Responsive:** Funciona perfectamente en tablets (dispositivo principal)

---

**Sistema desarrollado para:** Avícola Jossy  
**Fecha:** 03 de Febrero de 2025  
**Versión:** 1.0.0