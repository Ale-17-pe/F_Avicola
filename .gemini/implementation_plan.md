# Plan de Implementación - 6 Correcciones Críticas

## 1. Sub-pedido form en NuevoPedido (Gallina)

**Problema:** El formulario de sub-pedido no tiene campos de "Jabas" ni "Unidades por Jaba"
**Solución:** Agregar campos `unidadesPorJaba` al formulario de sub-pedido (líneas 1349-1363)
**Archivo:** NuevoPedido.tsx

## 2. ListaPedidos - Sección Pesaje

**Problema:** No hay sección de "Pedidos en Pesaje" en la tabla, los pedidos con estado 'Pesaje' no se muestran
**Solución:** Agregar filtro `pedidosEnPesaje` y renderizar sección con datos vacíos de pesaje
**Archivo:** ListaPedidos.tsx

## 3. PesajeOperador - Pesos de contenedores (YA RESUELTO)

**Problema:** Los pesos no venían de GestionContenedores
**Estado:** ✅ Ya corregido - GestionContenedores y ModalContenedores ahora usan AppContext

## 4. PesajeOperador - Auto-completar zona del cliente

**Problema:** La zona se elige manualmente, debería auto-completarse según el cliente
**Solución:** Al seleccionar pedido, buscar zona del cliente en `clientes` de AppContext y hacer setZonaId()
**Archivo:** PesajeOperador.tsx

## 5. Envíos - Estado correcto + Conductor confirma entrega

**Problema:** Después del pesaje el pedido aparece como "Entregado" pero debería ser "En Entrega"
**Solución:**

- PesajeOperador: cambiar estado post-pesaje de 'Entregado' a 'En Entrega'
- GestionConductor: agregar botón "Confirmar Entrega" con doble confirmación
- Solo al confirmar en Conductor => estado = 'Entregado'/'Completado'
  **Archivos:** PesajeOperador.tsx, GestionConductor.tsx, Envios.tsx

## 6. GestionCobranza - Precio individual + Fórmula de Peso

**Problema:** No jala precios de CostosClientes; fórmula de peso incorrecta
**Solución:** Importar costosClientes, buscar precio por cliente+tipoAve; corregir ecuación:
Peso Neto = Peso Bruto + Merma - Tara - Devolución
**Archivo:** GestionCobranza.tsx
