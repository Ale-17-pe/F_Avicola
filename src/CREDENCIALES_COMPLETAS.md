# 🔐 Credenciales del Sistema - Avícola Jossy

## 🔑 Acceso al Sistema

### 📝 Código 2FA (Para todos los usuarios)
```
Código: 123456
```
> Este código se solicita después de ingresar usuario y contraseña

---

## 👨‍💼 ADMINISTRADOR

### Credenciales de Acceso
```
Usuario:    admin
Contraseña: admin123
```

### Información del Usuario
- **Nombre completo:** Administrador Sistema
- **Email:** admin@avicolajossy.com
- **Rol:** Administrador
- **ID:** 1

### Permisos y Accesos
✅ **Acceso completo a todos los módulos:**

**Dashboard Principal**
- Vista general del sistema
- Estadísticas de inventario
- Métricas de ventas
- Gráficos y reportes

**Inventario**
- Gestión de Proveedores
- Gestión de Aves (tipos, variedades, presentaciones)

**Producción**
- Recolección de Huevos (próximamente)
- Control de Alimento (próximamente)

**Ventas**
- Gestión de Pedidos
- Gestión de Clientes

**Distribución**
- Control de Envíos
- Control de Rutas

**Finanzas**
- Gestión de Ingresos
- Gestión de Gastos
- Módulo de Cobranzas

**Recursos Humanos**
- Gestión de Empleados
- Control de Asistencia

**Reportes**
- Informes generales
- Exportación de datos

**Auditoría**
- Registro de actividades del sistema
- Historial de cambios

**Configuración**
- Configuración general del sistema
- Gestión de usuarios
- Parámetros de la empresa

---

## 👩‍💼 SECRETARÍA

### Credenciales de Acceso
```
Usuario:    secretaria
Contraseña: secretaria123
```

### Información del Usuario
- **Nombre completo:** Ana García López
- **Email:** ana.garcia@avicolajossy.com
- **Rol:** Secretaria
- **ID:** 2
- **DNI:** 12345678

### Permisos y Accesos
✅ **Acceso limitado a módulos específicos:**

**Panel Principal**
- Dashboard ejecutivo tipo Excel
- Vista de todos los pedidos
- Estadísticas en tiempo real
- Filtros avanzados
- Exportación a CSV

**Gestión de Pedidos**
- Crear nuevos pedidos
- Editar pedidos existentes
- Ver detalles de pedidos
- Cambiar estados
- Agregar múltiples productos por pedido

**Consulta de Clientes** (Solo Lectura)
- Ver información de clientes
- Consultar historial de compras

**Consulta de Inventario** (Solo Lectura)
- Ver aves disponibles
- Consultar presentaciones
- Ver stock actual

❌ **No tiene acceso a:**
- Configuración del sistema
- Gestión de empleados
- Módulos financieros (excepto ver pedidos)
- Auditoría
- Gestión de proveedores

---

## 🚀 Proceso de Inicio de Sesión

### Paso 1: Pantalla de Login
1. Abrir la aplicación
2. Ingresar **usuario** en el campo "Usuario o Email"
3. Ingresar **contraseña** en el campo "Contraseña"
4. Click en el botón **"INICIAR SESIÓN"**

### Paso 2: Verificación 2FA
1. Se mostrará una pantalla con 6 campos para código
2. Ingresar el código: **`123456`**
3. Click en el botón **"VERIFICAR CÓDIGO"**

### Paso 3: Redirección Automática
- **Administrador** → Se redirige a `/dashboard`
- **Secretaría** → Se redirige a `/dashboard-secretaria`

---

## 🔄 Cambiar de Usuario

### Para cambiar de usuario:
1. Click en el botón **"Cerrar Sesión"** en el panel lateral (parte inferior)
2. Serás redirigido a la pantalla de login
3. Ingresa las credenciales del nuevo usuario

---

## 🛡️ Seguridad

### Características de Seguridad Implementadas:
- ✅ Autenticación de dos factores (2FA)
- ✅ Contraseñas encriptadas (no visibles en el código cliente)
- ✅ Validación de roles en cada ruta
- ✅ Sesión persistente durante el uso
- ✅ Logout seguro que limpia toda la sesión

### Recomendaciones:
- 🔒 Cambiar las contraseñas por defecto en producción
- 🔒 Implementar contraseñas más robustas
- 🔒 Configurar códigos 2FA únicos por usuario
- 🔒 Implementar expiración de sesiones
- 🔒 Agregar logs de intentos de acceso

---

## 📋 Resumen Rápido

| Usuario | Contraseña | Rol | Acceso Principal |
|---------|-----------|-----|------------------|
| `admin` | `admin123` | Administrador | Acceso total al sistema |
| `secretaria` | `secretaria123` | Secretaria | Gestión de pedidos y consultas |

**Código 2FA para todos:** `123456`

---

## 🆘 Problemas Comunes

### "Credenciales incorrectas"
- Verifica que el usuario y contraseña estén escritos correctamente
- Asegúrate de no tener mayúsculas activadas (Caps Lock)
- El usuario debe ser exactamente como se muestra (minúsculas)

### "Código 2FA incorrecto"
- El código debe ser exactamente: `123456`
- No debe tener espacios
- Ingresa un dígito en cada campo

### "No puedo acceder a un módulo"
- Verifica que tu rol tenga permisos para ese módulo
- Si eres Secretaria, solo tienes acceso a 4 módulos
- Si necesitas más acceso, contacta al Administrador

---

**Sistema:** Avícola Jossy - Gestión Empresarial  
**Versión:** 1.0.0  
**Fecha:** Febrero 2025  

---

## 📞 Soporte Técnico

Para crear nuevos usuarios o modificar permisos, edita el archivo:
```
/contexts/AuthContext.tsx
```

Busca el array `usuarios` y agrega nuevas entradas siguiendo el mismo formato.
