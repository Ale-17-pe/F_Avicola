# 🐔 Sistema de Gestión - Avícola Jossy

Sistema empresarial completo para gestión avícola con múltiples módulos y roles de usuario.

---

## 🔐 CREDENCIALES DE ACCESO

### 👨‍💼 **ADMINISTRADOR**
```
Usuario:    admin
Contraseña: admin123
Código 2FA: 123456
```
**Acceso:** Panel completo de administración con todos los módulos

---

### 👩‍💼 **SECRETARÍA**
```
Usuario:    secretaria
Contraseña: secretaria123
Código 2FA: 123456
```
**Acceso:** Panel de secretaría con gestión de pedidos y consultas

---

## 🚀 Inicio Rápido

### 1. Acceder al Sistema
1. Abrir la aplicación
2. Ingresar usuario y contraseña
3. Click en "INICIAR SESIÓN"

### 2. Verificación 2FA
1. Ingresar código: **123456**
2. Click en "VERIFICAR CÓDIGO"
3. Redirección automática según rol

---

## 📊 Módulos del Sistema

### 🔧 **PANEL DE ADMINISTRADOR**

#### **Dashboard Principal**
- Vista general del sistema
- Estadísticas de inventario, ventas y finanzas
- Gráficos en tiempo real

#### **Inventario**
- **Proveedores:** Gestión completa de proveedores
- **Aves:** Tipos, variedades, presentaciones con mermas

#### **Producción** (Próximamente)
- Recolección de Huevos
- Control de Alimento

#### **Ventas**
- **Pedidos:** Gestión completa de pedidos
- **Clientes:** Administración de clientes

#### **Distribución**
- **Envíos:** Control de envíos y entregas
- **Control:** Seguimiento de rutas

#### **Finanzas**
- **Ingresos:** Gestión de ingresos y ventas
- **Cobranzas:** Gestión de trabajadores de cobranza, motos y códigos QR (Yape/Plin)
- **Gastos:** Control de gastos (próximamente)

#### **Recursos Humanos**
- **Empleados:** Gestión de personal
- **Asistencia:** Control de asistencia

#### **Reportes**
- **Informes:** Reportes generales y exportación

#### **Auditoría**
- Registro de actividades del sistema

#### **Configuración**
- Configuración general del sistema

---

### 📋 **PANEL DE SECRETARÍA**

#### **Panel Principal**
- Dashboard ejecutivo tipo Excel
- Tabla de pedidos en tiempo real
- Estadísticas del día
- Filtros avanzados
- Exportación a CSV

#### **Inventario** (Solo Lectura)
- **Tab Aves:** Ver tipos de aves, variedades y presentaciones
- **Tab Proveedores:** Consultar información de proveedores
- Vista completa del inventario disponible

#### **Gestión de Pedidos**
- Crear nuevos pedidos con múltiples productos
- Editar pedidos existentes
- Ver detalles completos
- Cálculo automático de totales y mermas

#### **Consulta de Clientes** (Solo Lectura)
- Ver información de clientes
- Historial de compras

---

## 🎨 Características del Diseño

### Colores Corporativos
- **Verde:** #22c55e - Logo y acentos principales
- **Dorado/Oro:** #ccaa00 - Botones y elementos destacados
- **Negro/Gris Oscuro:** Fondo optimizado para uso nocturno
- **Blanco:** Textos y elementos principales

### Responsive
- ✅ **Móvil:** Diseño optimizado para smartphones
- ✅ **Tablet:** Interfaz principal (dispositivo preferido)
- ✅ **Desktop:** Vista completa con sidebar colapsable

---

## 📦 Características Principales

### ✨ Inventario de Aves
- Tipos de aves: Pollo, Gallina, Pato, Pavo, etc.
- Variedades por tipo (Blanco, Rojo, etc.)
- Distinción de sexo (Macho/Hembra)
- Presentaciones con mermas específicas:
  - **Vivo:** 0 kg de merma
  - **Pelado:** 0.15 kg de merma
  - **Destripado:** 0.20 kg de merma

### 💰 Gestión de Pedidos
- Múltiples productos por pedido
- Cálculo automático de subtotales y totales
- Aplicación automática de mermas
- Selección de vendedor y cliente
- Notas adicionales por pedido
- Estados: Pendiente, En Proceso, Completado, Cancelado

### 👥 Gestión de Cobranzas
- Trabajadores de cobranza con información completa
- Registro de motos (placa, marca, modelo, año, color)
- Códigos QR para Yape y Plin
- Estado de trabajadores (Activo/Inactivo)

### 📊 Sistema de Reportes
- Filtros avanzados por fecha, estado, cliente
- Búsqueda en tiempo real
- Exportación a CSV
- Vista detallada de pedidos

---

## 📁 Estructura del Proyecto

```
/
├── components/
│   ├── Layout.tsx                  # Layout del administrador
│   ├── LayoutSecretaria.tsx        # Layout de secretaría
│   ├── Login.tsx                   # Pantalla de login con 2FA
│   ├── Dashboard.tsx               # Dashboard del administrador
│   ├── DashboardSecretaria.tsx     # Dashboard de secretaría
│   ├── Proveedores.tsx             # Gestión de proveedores
│   ├── Aves.tsx                    # Gestión de aves
│   ├── Pedidos.tsx                 # Gestión de pedidos
│   ├── ModalNuevoPedido.tsx        # Modal para crear pedidos
│   ├── Clientes.tsx                # Gestión de clientes
│   ├── Envios.tsx                  # Control de envíos
│   ├── Control.tsx                 # Control de distribución
│   ├── Finanzas.tsx                # Módulo de finanzas (tabs)
│   ├── Ingresos.tsx                # Gestión de ingresos
│   ├── Cobranzas.tsx               # Gestión de cobranzas
│   ├── Empleados.tsx               # Gestión de empleados
│   ├── Asistencia.tsx              # Control de asistencia
│   ├── Informes.tsx                # Reportes e informes
│   ├── Auditoria.tsx               # Auditoría del sistema
│   └── Configuracion.tsx           # Configuración general
│
├── contexts/
│   ├── AppContext.tsx              # Contexto global de datos
│   └── AuthContext.tsx             # Contexto de autenticación
│
├── routes.ts                       # Definición de rutas
├── App.tsx                         # Componente principal
│
└── Documentación/
    ├── README.md                   # Este archivo
    ├── CREDENCIALES_COMPLETAS.md   # Credenciales detalladas
    ├── SISTEMA_SECRETARIA_RESUMEN.md
    ├── GUIA_RAPIDA_SECRETARIA.md
    └── RESUMEN_TECNICO_COMPLETO.md
```

---

## 🛠️ Tecnologías Utilizadas

- **React** 18.x - Biblioteca principal
- **TypeScript** - Tipado estático
- **React Router** 7.x - Navegación
- **Tailwind CSS** v4 - Estilos
- **Lucide React** - Iconos
- **Context API** - Gestión de estado global

---

## 📝 Notas Importantes

### Gestión de Precios
- Los precios cambian **cada día** como regla de negocio
- El sistema permite ingresar precios específicos por pedido
- Recomendación: Actualizar precios diariamente

### Mermas por Presentación
- **Vivo:** Sin pérdida de peso
- **Pelado:** 0.15 kg menos por unidad
- **Destripado:** 0.20 kg menos por unidad
- Las mermas se aplican automáticamente en los cálculos

### Roles y Permisos
- **Administrador:** Acceso total al sistema
- **Secretaría:** Acceso limitado a gestión de pedidos y consultas
- Los permisos se validan en cada ruta

---

## 🆘 Problemas Comunes

### No puedo iniciar sesión
- Verifica que el usuario sea exactamente: `admin` o `secretaria`
- Las contraseñas son sensibles a mayúsculas
- El código 2FA debe ser exactamente: `123456`

### No veo un módulo
- Verifica que tu rol tenga permisos para ese módulo
- El rol de Secretaría solo ve 4 módulos
- Contacta al administrador si necesitas más acceso

### Los cálculos no coinciden
- El sistema calcula automáticamente
- Verifica que el peso y precio estén correctos
- Las mermas se aplican según la presentación seleccionada

---

## 📞 Soporte

Para modificar usuarios, roles o permisos, edita:
- `/contexts/AuthContext.tsx` - Usuarios y autenticación
- `/contexts/AppContext.tsx` - Datos del sistema

---

## 📄 Licencia

Sistema desarrollado exclusivamente para **Avícola Jossy**

---

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
- [ ] API REST para integración
- [ ] Impresión de pedidos y facturas
- [ ] Historial de precios por día