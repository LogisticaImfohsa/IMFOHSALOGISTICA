# Pruebas obligatorias después de instalar

Todas las pruebas deben usar el dominio HTTPS definitivo.

1. `/index.html` abre «¿Dónde va mi pedido?».
2. El acceso operativo permite iniciar sesión como administrador.
3. Un usuario con rol `mensajero` abre únicamente su aplicación móvil.
4. Un enlace generado de vendedor abre la consulta de ese vendedor.
5. Un enlace generado de solicitud de panel abre el formulario público.
6. `/uploads/...` permite consultar una evidencia existente.
7. Guardar una modificación actualiza `data/state_cost_root.json`.
8. `GET /api/odoo/status` exige sesión administrativa.
9. `POST /api/odoo/test` confirma credenciales en la base de pruebas de Odoo.

Si una ruta pública muestra brevemente la portada y luego el acceso
administrativo, el proxy está publicando archivos estáticos o descartando la
ruta/consulta. Corrija el proxy; no modifique los tokens guardados.
