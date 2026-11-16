# Estado de la integración con Odoo

Esta entrega corresponde a la copia de trabajo vigente R8.29.15 y conserva su estado operativo, usuarios, archivos cargados y modificaciones.

## Lo que está implementado

- Importación de pedidos mediante archivos Excel exportados desde Odoo.
- Importación y actualización de clientes por Excel/CSV.
- Conservación de número de SO, vendedor, cliente, dirección, valor y productos reconocidos.
- Endpoint local `/api/import-xlsx` para interpretar archivos de pedidos.

## Lo que todavía no está implementado

La aplicación no contiene actualmente un cliente XML-RPC o JSON-RPC para conectarse directamente con Odoo. Tampoco están configurados en el servidor la URL de Odoo, base de datos, usuario técnico, API key, modelos, dominios de consulta ni reglas de sincronización.

Por esa razón, llamar a una pantalla o columna “Odoo” no equivale a una conexión directa: los datos llegan hoy mediante importación de archivos.

## Requisitos para habilitar la conexión directa

1. URL estable de la instancia Odoo y nombre de la base de datos.
2. Usuario técnico exclusivo y API key con permisos mínimos.
3. Definición de modelos y campos de origen, por ejemplo `sale.order`, `sale.order.line`, clientes, vendedores, direcciones y valores.
4. Reglas de sincronización: altas, modificaciones, cancelaciones, conflictos y deduplicación por SO/ID externo.
5. Servicio del lado del servidor; las credenciales nunca deben exponerse en `index.html`.
6. Registro de errores, reintentos e idempotencia para evitar pedidos duplicados.
7. Pruebas contra una base de pruebas de Odoo antes de producción.

La conexión puede incorporarse sin reemplazar la aplicación actual: la importación Excel debe permanecer como respaldo operativo.
