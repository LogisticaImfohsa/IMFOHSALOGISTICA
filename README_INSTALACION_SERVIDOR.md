# IMFOHSA R8.29.15 — distribución auditada

Esta carpeta es una sola aplicación. El ejecutable, `index.html`, `data/`,
`uploads/`, `vendor/` y `site-assets/` deben permanecer juntos.

## Windows

1. Extraiga la ZIP completa en una carpeta definitiva.
2. No ejecute un `.exe` antiguo de otra copia.
3. Ejecute `INICIAR_IMFOHSA_SERVIDOR.cmd`.
4. Para cambiar el puerto, defina `IMFOHSA_PORT` antes de iniciar.

El iniciador fija `IMFOHSA_ROOT` a esta carpeta. Así el servidor siempre lee
los usuarios y la información incluidos en `data/`, aunque el servicio se
inicie desde otra ubicación.

## Linux

El paquete ya incluye `IMFOHSA_SERVIDOR` para Linux amd64. Ejecute:

```bash
chmod +x IMFOHSA_SERVIDOR INICIAR_IMFOHSA_SERVIDOR.sh
./INICIAR_IMFOHSA_SERVIDOR.sh
```

El archivo Go queda incluido para auditoría y para recompilar en otra
arquitectura si el servidor no es Linux amd64.

En systemd use esta carpeta como `WorkingDirectory` y conserve
`IMFOHSA_ROOT` apuntando a ella.

No publique `index.html` como un sitio estático independiente. El proxy debe
enviar `/`, `/api/`, `/vendedor/`, `/compartir-*`, `/captura` y `/uploads/`
al mismo proceso IMFOHSA. El ejemplo de `deploy/nginx-imfohsa.conf.example`
usa una sola regla general y evita que los enlaces públicos terminen en el
acceso administrativo.

## Datos que no deben reemplazarse

- `data/state_cost_root.json`: estado operativo vigente.
- `data/admins.json`: usuarios y relación con mensajeros.
- `uploads/`: evidencias y fotografías.

Haga copia de esos tres elementos antes de actualizar archivos de programa.

## Accesos de prueba

- Administrador: `WFUENTES`
- Mensajeros: los usuarios activos de `data/admins.json`
- Contraseña temporal común: `Imfohsa1234/`

Cambie las contraseñas después de comprobar la instalación.

## Conexión Odoo para BI / IT

1. Copie `ODOO.env.example` a la configuración segura del servicio.
2. Complete URL, base, usuario técnico y API key; no los escriba en HTML.
3. Inicie la aplicación y autentíquese como administrador.
4. Pruebe `GET /api/odoo/status` y luego `POST /api/odoo/test`.
5. Revise `CONTRATO_INTEGRACION_ODOO.md` antes de habilitar descarga o devolución de estados.

La distribución queda preparada, pero una conexión real solo puede aprobarse
con acceso a la instancia y credenciales de Odoo de la empresa.

