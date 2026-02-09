# 📚 Índice de Documentación - Avícola Jossy

---

## 🚀 INICIO RÁPIDO

### 🔑 **INICIO_AQUI.md** ⭐ **LEER PRIMERO**
```
Credenciales de acceso rápidas y visuales
Pasos para ingresar al sistema
Tips básicos para empezar
```

**Credenciales:**
- **Admin:** `admin` / `admin123` / `123456`
- **Secretaría:** `secretaria` / `secretaria123` / `123456`

---

## 📖 DOCUMENTACIÓN GENERAL

### 📄 **README.md**
```
Documentación completa del sistema
Módulos disponibles por rol
Características principales
Estructura del proyecto
Tecnologías utilizadas
```

### 🔐 **CREDENCIALES_COMPLETAS.md**
```
Todas las credenciales del sistema
Información detallada de usuarios
Permisos y accesos por rol
Proceso de login paso a paso
Solución de problemas comunes
```

---

## 👩‍💼 DOCUMENTACIÓN DE SECRETARÍA

### 📋 **CREDENCIALES_SECRETARIA.md**
```
Credenciales específicas de secretaría
Usuario: secretaria
Contraseña: secretaria123
Código 2FA: 123456
Permisos y restricciones
```

### 📊 **SISTEMA_SECRETARIA_RESUMEN.md**
```
Resumen completo del sistema de secretaría
Layout y navegación
Módulos implementados
Dashboard ejecutivo tipo Excel
Gestión de pedidos
Herencia de datos del administrador
```

### 🎯 **GUIA_RAPIDA_SECRETARIA.md**
```
Guía de usuario paso a paso
Cómo navegar por el sistema
Cómo crear pedidos
Cómo usar filtros y búsquedas
Consejos y trucos
Solución de problemas
```

---

## 🔧 DOCUMENTACIÓN TÉCNICA

### ⚙️ **RESUMEN_TECNICO_COMPLETO.md**
```
Estructura de archivos
Sistema de autenticación
Layouts y rutas
Dashboard de secretaría
Modal de nuevo pedido
Flujo de trabajo completo
Dependencias y tecnologías
```

---

## 📁 ARCHIVOS DEL PROYECTO

### 🔐 Autenticación
```
/contexts/AuthContext.tsx
- Sistema de autenticación multi-rol
- Validación de credenciales
- Gestión de sesiones
```

### 🎨 Layouts
```
/components/Layout.tsx
- Layout del administrador
- Sidebar con todos los módulos
- Responsive y colapsable

/components/LayoutSecretaria.tsx
- Layout de secretaría
- Sidebar simplificado (4 módulos)
- Información del usuario visible
```

### 📊 Dashboards
```
/components/Dashboard.tsx
- Dashboard del administrador
- Vista general del sistema
- Estadísticas y gráficos

/components/DashboardSecretaria.tsx
- Dashboard ejecutivo tipo Excel
- Tabla de pedidos en tiempo real
- Filtros avanzados
- Exportación CSV
```

### 🛒 Gestión de Pedidos
```
/components/Pedidos.tsx
- Gestión completa de pedidos
- Vista tabla/cuadrícula

/components/ModalNuevoPedido.tsx
- Crear nuevos pedidos
- Agregar múltiples productos
- Cálculos automáticos
- Herencia de datos de inventario
```

### 📦 Inventario
```
/components/Proveedores.tsx
- Gestión de proveedores

/components/Aves.tsx
- Gestión de tipos de aves
- Variedades y sexo
- Presentaciones con mermas
```

### 💰 Finanzas
```
/components/Finanzas.tsx
- Módulo principal con tabs
- Ingresos y Cobranzas

/components/Ingresos.tsx
- Gestión de ingresos

/components/Cobranzas.tsx
- Trabajadores de cobranza
- Gestión de motos
- Códigos QR (Yape/Plin)
```

### 👥 Otros Módulos
```
/components/Clientes.tsx       - Gestión de clientes
/components/Envios.tsx         - Control de envíos
/components/Control.tsx        - Control de distribución
/components/Empleados.tsx      - Gestión de empleados
/components/Asistencia.tsx     - Control de asistencia
/components/Informes.tsx       - Reportes e informes
/components/Auditoria.tsx      - Auditoría del sistema
/components/Configuracion.tsx  - Configuración general
```

---

## 🎯 GUÍAS POR ROL

### 👨‍💼 Para Administradores

**Leer:**
1. ✅ INICIO_AQUI.md
2. ✅ README.md
3. ✅ CREDENCIALES_COMPLETAS.md
4. ✅ RESUMEN_TECNICO_COMPLETO.md

**Credenciales:**
```
Usuario:    admin
Contraseña: admin123
Código 2FA: 123456
```

**Acceso:** Todos los módulos del sistema

---

### 👩‍💼 Para Secretaría

**Leer:**
1. ✅ INICIO_AQUI.md
2. ✅ CREDENCIALES_SECRETARIA.md
3. ✅ GUIA_RAPIDA_SECRETARIA.md
4. ✅ SISTEMA_SECRETARIA_RESUMEN.md

**Credenciales:**
```
Usuario:    secretaria
Contraseña: secretaria123
Código 2FA: 123456
```

**Acceso:** 4 módulos (Panel, Pedidos, Consulta Clientes, Consulta Inventario)

---

## 🔍 BÚSQUEDA RÁPIDA

### ¿Necesitas las credenciales?
→ **INICIO_AQUI.md** o **CREDENCIALES_COMPLETAS.md**

### ¿Cómo usar el sistema de secretaría?
→ **GUIA_RAPIDA_SECRETARIA.md**

### ¿Información técnica del proyecto?
→ **RESUMEN_TECNICO_COMPLETO.md**

### ¿Qué módulos están disponibles?
→ **README.md**

### ¿Cómo crear pedidos?
→ **GUIA_RAPIDA_SECRETARIA.md** (sección "Crear un Nuevo Pedido")

### ¿Cuáles son las presentaciones y mermas?
→ **SISTEMA_SECRETARIA_RESUMEN.md** o **README.md**

---

## 📊 Resumen de Características

### ✨ Inventario de Aves
- Tipos: Pollo, Gallina, Pato, Pavo, etc.
- Variedades por tipo
- Sexo: Macho/Hembra
- Presentaciones: Vivo (0kg), Pelado (0.15kg), Destripado (0.20kg)

### 💰 Gestión de Pedidos
- Múltiples productos por pedido
- Cálculo automático de totales
- Aplicación automática de mermas
- Estados: Pendiente, En Proceso, Completado, Cancelado

### 👥 Gestión de Cobranzas (NUEVO)
- Trabajadores con datos completos
- Registro de motos (placa, marca, modelo, año, color)
- Códigos QR para Yape y Plin
- Estado de trabajadores (Activo/Inactivo)

### 📊 Sistema de Reportes
- Filtros por fecha, estado, cliente
- Búsqueda en tiempo real
- Exportación a CSV
- Vista detallada expandible

---

## 🎨 Diseño

**Colores Corporativos:**
- 🟢 Verde: #22c55e
- 🟡 Dorado/Oro: #ccaa00
- ⚫ Negro/Gris: Fondo nocturno
- ⚪ Blanco: Textos

**Responsive:**
- ✅ Móvil
- ✅ Tablet (dispositivo principal)
- ✅ Desktop

---

## 🆘 Soporte

### Problemas con credenciales
→ Ver **CREDENCIALES_COMPLETAS.md** (sección "Problemas Comunes")

### No veo un módulo
→ Verificar rol en **README.md** (sección "Módulos del Sistema")

### Dudas técnicas
→ Consultar **RESUMEN_TECNICO_COMPLETO.md**

### Modificar usuarios
→ Editar `/contexts/AuthContext.tsx`

---

## 📈 Versión del Sistema

**Versión:** 1.0.0  
**Fecha:** Febrero 2025  
**Desarrollado para:** Avícola Jossy SAC  

---

## 🎯 Próximas Mejoras

- [ ] Módulo de Producción (Huevos y Alimento)
- [ ] Gestión de Gastos
- [ ] Reportes avanzados con gráficos
- [ ] Sistema de notificaciones
- [ ] App móvil nativa
- [ ] Impresión de pedidos
- [ ] Historial de precios por día

---

**AVÍCOLA JOSSY** 🐔  
Sistema de Gestión Empresarial Completo
