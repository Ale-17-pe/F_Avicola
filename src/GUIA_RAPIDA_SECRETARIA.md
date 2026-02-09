# 🚀 Guía Rápida - Sistema de Secretaría

## 📋 Inicio de Sesión

### Paso 1: Acceder al sistema
1. Abrir la aplicación
2. Ingresar credenciales:
   - **Usuario:** `secretaria`
   - **Contraseña:** `secretaria123`
3. Click en "INICIAR SESIÓN"

### Paso 2: Verificación 2FA
1. Ingresar el código de 6 dígitos: `123456`
2. Click en "VERIFICAR CÓDIGO"
3. El sistema te redirigirá automáticamente al Panel de Secretaría

---

## 🎯 Navegación del Sistema

### Panel Lateral (Sidebar)

El menú de navegación está ubicado en el lado izquierdo de la pantalla y contiene:

1. **📊 Panel Principal**
   - Dashboard ejecutivo con tabla tipo Excel
   - Vista general de todos los pedidos
   - Estadísticas en tiempo real

2. **📦 Inventario**
   - **Tab Aves:** Ver tipos de aves, variedades y presentaciones
   - **Tab Proveedores:** Consultar proveedores
   - Solo lectura (no editable)

3. **🛒 Gestión de Pedidos**
   - Crear nuevos pedidos
   - Editar pedidos existentes
   - Administrar estados de pedidos

4. **👥 Consulta de Clientes**
   - Ver información de clientes
   - Consultar historial de compras
   - Solo lectura (no editable)

### Características del Sidebar

- **Desktop:** Puedes colapsar/expandir el menú con el botón ☰ en la esquina superior izquierda
- **Móvil/Tablet:** Toca el botón ☰ para abrir/cerrar el menú
- En la parte inferior verás tu información de usuario y el botón "Cerrar Sesión"

---

## 📊 Panel Principal (Dashboard)

### Estadísticas Principales

Al ingresar verás 4 tarjetas con información clave:

1. **Pedidos de Hoy** - Cantidad de pedidos realizados el día actual
2. **Ventas de Hoy** - Total en soles de las ventas completadas
3. **Pendientes** - Pedidos que aún no se han completado
4. **Total Pedidos** - Cantidad total de pedidos en el sistema

### Filtros de Búsqueda

**Barra de búsqueda:**
- Busca por número de pedido (ej: PED-001)
- Busca por nombre de cliente
- Busca por nombre de vendedor

**Filtro por Estado:**
- Todos los estados
- Pendiente (🟡)
- En Proceso (🔵)
- Completado (🟢)
- Cancelado (🔴)

**Filtro por Fecha:**
- Selecciona una fecha específica para ver pedidos de ese día

**Exportar a CSV:**
- Click en el botón "Exportar CSV" para descargar todos los pedidos filtrados

### Tabla de Pedidos

**Columnas mostradas:**
- N° PEDIDO - Número único del pedido
- FECHA/HORA - Cuándo se creó el pedido
- VENDEDOR - Quién registró el pedido
- CLIENTE - A quién se le vendió
- ITEMS - Cantidad de productos en el pedido
- TOTAL - Monto total en Soles (S/)
- ESTADO - Estado actual del pedido
- ACCIONES - Botones para ver, editar o eliminar

**Ver detalles de un pedido:**
- Click en el icono de paquete (📦) para expandir y ver todos los items del pedido
- Verás: Tipo de ave, Variedad, Sexo, Presentación, Cantidad, Peso, Precio/kg, Subtotal

---

## 🛒 Crear un Nuevo Pedido

### Paso 1: Abrir el formulario
1. Click en el botón "Nuevo Pedido" (dorado, esquina superior derecha)
2. Se abrirá un modal con el formulario

### Paso 2: Información General
1. **Vendedor:** Selecciona el vendedor (tu nombre o el de otro empleado autorizado)
2. **Cliente:** Selecciona el cliente de la lista
3. **Fecha:** Se llena automáticamente con la fecha actual (puedes cambiarla)
4. **Hora:** Se llena automáticamente con la hora actual (puedes cambiarla)

### Paso 3: Agregar Productos

**Campos del producto:**
1. **Tipo de Ave:** Selecciona (Pollo, Gallina, Pato, Pavo, etc.)
2. **Variedad:** Si el ave tiene variedades, selecciona una (ej: Blanco, Rojo)
3. **Sexo:** Si aplica, selecciona Macho o Hembra
4. **Presentación:** Selecciona cómo se entregará:
   - Vivo (sin merma)
   - Pelado (merma de 0.15 kg)
   - Destripado (merma de 0.20 kg)
5. **Cantidad:** Número de unidades
6. **Peso Total (kg):** Peso total en kilogramos
7. **Precio por Kg (S/):** Precio por kilogramo (cambia diariamente)

**Agregar el producto:**
- Click en el botón "Agregar" (verde)
- El producto aparecerá en la tabla inferior
- Puedes agregar múltiples productos
- Para eliminar un producto, click en la X roja

### Paso 4: Notas Adicionales (Opcional)
- Escribe cualquier observación o instrucción especial
- Ejemplo: "Entregar antes de las 2pm" o "Cliente requiere empaque especial"

### Paso 5: Crear el Pedido
- Revisa que toda la información esté correcta
- Verifica el total calculado automáticamente
- Click en "Crear Pedido" (botón dorado)
- El pedido se agregará a la tabla principal

---

## 💡 Consejos y Trucos

### Eficiencia en el Registro

1. **Usa los filtros:** Encuentra pedidos rápidamente filtrando por estado o fecha
2. **Exporta reportes:** Genera reportes diarios exportando a CSV
3. **Verifica precios:** Los precios cambian cada día, asegúrate de usar el precio correcto
4. **Revisa los totales:** El sistema calcula automáticamente, pero siempre verifica

### Cálculos Automáticos

El sistema calcula automáticamente:
- ✅ Subtotal de cada producto (Peso × Precio/kg)
- ✅ Total del pedido (suma de todos los subtotales)
- ✅ Aplicación de merma según presentación

### Estados de Pedidos

- **Pendiente:** Pedido creado, esperando procesamiento
- **En Proceso:** Se está preparando el pedido
- **Completado:** Pedido entregado al cliente
- **Cancelado:** Pedido cancelado por algún motivo

---

## 🔧 Solución de Problemas

### No puedo ver un pedido
- Verifica los filtros activos
- Asegúrate de no estar filtrando por fecha incorrecta
- Limpia la búsqueda

### El total no coincide
- El sistema calcula automáticamente
- Verifica que el peso y precio estén correctos
- La merma se aplica automáticamente según la presentación

### No puedo agregar un producto
- Verifica que todos los campos obligatorios (*) estén llenos
- Asegúrate de que el peso y precio sean mayores a 0
- Primero debes seleccionar el tipo de ave antes de la presentación

---

## 📞 Soporte

Si necesitas ayuda adicional, contacta al administrador del sistema.

---

**Avícola Jossy**  
Sistema de Gestión Empresarial  
Versión 1.0.0 - Febrero 2025