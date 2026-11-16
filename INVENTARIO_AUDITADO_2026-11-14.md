# Inventario auditado — IMFOHSA R8.29.15

Fecha de corte: 14 de noviembre de 2026  
Origen: `R8.29.15_COPIA_CLARA_APROBADA`  
Alcance: distribución para servidor Windows amd64 o Linux amd64.

## Aplicación y ejecución

- Entrada pública: `index.html` — consulta «¿Dónde va mi pedido?».
- Acceso operativo protegido dentro de la misma aplicación.
- Servidor Windows: `IMFOHSA_SERVIDOR.exe`.
- Servidor Linux amd64: `IMFOHSA_SERVIDOR`.
- Ambos binarios fueron generados del mismo archivo `server_copia_aprobada_8946.go`.
- No se incluyen ejecutables históricos `server_*.exe`.
- Iniciadores incluidos para Windows y Linux.

## Datos persistentes incluidos

- Estado canónico: `data/state_cost_root.json`.
- Usuarios: `data/admins.json`.
- Pedidos operativos: 475.
- Pedidos maestros: 478.
- Clientes: 374.
- Mensajeros: 11.
- Vehículos: 11.
- Solicitudes de vehículo: 27.
- Asignaciones de panel: 75.
- Registros de combustible: 31.
- Costos manuales: 2.
- Registros de aprendizaje de rutas: 5,218.
- Evidencias y archivos conservados en `uploads/`: 1,052.

## Usuarios y permisos

- Usuarios configurados: 17.
- Usuarios activos: 16.
- Usuario inactivo conservado: 1.
- Pilotos activos: 11.
- Pilotos sin perfil vinculado: 0.
- Nombres de usuario duplicados: 0.
- Contraseñas almacenadas exclusivamente como hash.
- El servidor permite crear o actualizar hasta 20 usuarios.
- La interfaz permite crear, activar/desactivar, cambiar rol, vincular piloto y cambiar contraseña.
- Desactivar un piloto conserva pedidos, rutas, evidencias e historial.

## Recursos de interfaz

- Logotipos originales incluidos.
- Hojas de estilo claras aprobadas incluidas.
- JavaScript operativo aprobado incluido.
- Dependencias locales de `vendor/` incluidas.
- Recursos institucionales de `site-assets/` incluidos.

## Integración Odoo preparada

- Estado y prueba de conexión protegidos para administradores.
- Descarga incremental y deduplicada por ID de Odoo/SO.
- Devolución de estado mediante campo configurable.
- Secretos únicamente mediante variables de entorno.
- Contrato: `CONTRATO_INTEGRACION_ODOO.md`.
- Plantilla: `ODOO.env.example`.
- La sincronización queda desactivada hasta cargar credenciales y validar mapeos con BI/IT.

## Resultado de auditoría

- Archivos obligatorios faltantes: 0.
- Usuarios duplicados: 0.
- Pilotos inválidos: 0.
- Ejecutables históricos dentro de la distribución: 0.
- Validación de estructura y datos: APROBADA.

## Obligaciones de instalación

1. Extraer el ZIP completo; no ejecutar directamente desde el ZIP.
2. Mantener juntos binario, `index.html`, `data/`, `uploads/`, `vendor/` y `site-assets/`.
3. Configurar `IMFOHSA_ROOT` con la ruta absoluta de la aplicación.
4. Dar permisos de escritura al servicio sobre `data/` y `uploads/`.
5. Configurar HTTPS y dominio mediante proxy inverso estable.
6. Respaldar `data/` y `uploads/` antes de cada actualización.
7. Cambiar las contraseñas temporales al habilitar producción.
8. Probar Odoo con credenciales reales antes de activar sincronización programada.
