# Contrato de integración Odoo — IMFOHSA R8.29.15

## Objetivo

La aplicación incorpora un conector de servidor para Odoo mediante JSON-RPC. Las credenciales se reciben únicamente por variables de entorno. La importación Excel permanece disponible como contingencia.

## Variables obligatorias

- `IMFOHSA_ODOO_URL`
- `IMFOHSA_ODOO_DATABASE`
- `IMFOHSA_ODOO_USERNAME`
- `IMFOHSA_ODOO_API_KEY`

Para devolver estados también se requiere `IMFOHSA_ODOO_STATUS_FIELD`.

## Endpoints protegidos

Todos requieren una sesión administrativa válida de IMFOHSA.

- `GET /api/odoo/status`: configuración no sensible y última sincronización.
- `POST /api/odoo/test`: autentica el usuario técnico contra Odoo.
- `POST /api/odoo/pull?since=YYYY-MM-DD HH:MM:SS`: descarga incremental de `sale.order`.
- `POST /api/odoo/push` con `{"orderId":"..."}`: devuelve el estado del pedido al campo configurado.

## Lectura predeterminada

Modelo: `sale.order`.

Campos: `id`, `name`, `partner_id`, `partner_shipping_id`, `user_id`, `amount_total`, `date_order`, `commitment_date`, `write_date` y `state`.

Se leen pedidos en estado `sale` o `done`, con máximo de 5,000 registros por llamada. El vínculo persistente se conserva en `odooId`; la SO se conserva en `orderNo`. La combinación evita insertar nuevamente el mismo pedido.

## Escritura predeterminada

La aplicación solo escribe el estado logístico en el campo indicado por `IMFOHSA_ODOO_STATUS_FIELD`. No modifica importes, clientes, líneas de venta ni inventario.

## Decisiones pendientes de BI/IT

1. Confirmar versión de Odoo y disponibilidad de JSON-RPC.
2. Crear el usuario técnico y API key con permisos mínimos.
3. Crear o confirmar el campo personalizado de estado.
4. Confirmar si las direcciones requieren campos personalizados adicionales.
5. Definir periodicidad de ejecución y monitoreo externo.
6. Probar primero contra una base de pruebas.

## Seguridad

Nunca coloque la API key en `index.html`, archivos JavaScript, repositorios o la ZIP. Debe configurarse en el gestor de secretos, servicio systemd, contenedor o plataforma de despliegue.
