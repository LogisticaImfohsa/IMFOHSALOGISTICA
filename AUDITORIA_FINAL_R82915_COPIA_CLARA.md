# Auditoría final — R8.29.15 copia clara aprobada

Fecha: 30 de octubre de 2026 (Guatemala)

## Alcance

- Copia modificada: `R8.29.15_COPIA_CLARA_APROBADA`.
- Original protegido: `R8.29.15_BLOQUEADA_ORIGINAL` (sin modificaciones; `index.html` conserva fecha 23/10/2026 15:29).
- Interfaz exclusivamente clara, conservando el menú lateral corporativo oscuro.

## Resultado automatizado

- 9 de 9 módulos cargan y conservan navegación: Dashboard, Planificador, Pedidos y despachos, Ventas, Mensajeros, Flotilla, Solicitud de vehículo, Combustibles y costos y Configuración.
- Hoja final de diseño cargada una sola vez en todos los módulos.
- 0 listas desplegables con la opción seleccionada duplicada.
- 0 controles de cambio a modo oscuro.
- Sin errores JavaScript durante el recorrido de los módulos.
- El único `401` observado ocurre antes de iniciar sesión y corresponde al control normal de acceso no autenticado.

## Diseño y contraste

- Fondos operativos claros y texto principal oscuro.
- Campos y listas: fondo blanco y texto oscuro.
- Encabezados de tablas: azul corporativo `rgb(8, 44, 69)` con texto blanco; contraste superior a WCAG AA.
- Colores oscuros detectados por el escáner se limitan a encabezados corporativos de tablas, no a mezclas de tema.
- Calendario con estados diferenciados para reserva, mantenimiento, disponibilidad e incidencia.

## Dashboard

- Semana operativa de lunes a sábado.
- Domingo opcional mediante “Incluir domingo”.
- Cumplimiento presentado en formato lineal.
- Se conservan efectividad por corte, carga del equipo, causas de no entrega y alertas.

## Planificador de rutas

- Se conserva el Planificador original y sus funciones.
- Carga masiva original disponible.
- Carga Excel individual por mensajero disponible.
- Mensajeros presentes aparecen aunque todavía no tengan ruta.
- Mensajeros marcados como ausentes no aparecen para asignación ni en el panel de rutas del día.
- Modo tradicional conserva validación manual del punto.
- Modo rápido libera y publica sin exigir pin; la ubicación observada queda pendiente del GPS real.
- Publicación rápida simulada: aprobada, sin bloqueo por punto y con mensaje correcto.
- Quitar gestión de ruta: elimina mensajero, posición y publicación, y devuelve la gestión completa a “No asignados”.
- Kilometraje y tiempo GPS comienzan en cero y no se calculan con la ruta planificada.
- El servidor acepta `gpsPing`, acumula recorrido real, descarta saltos físicamente improbables y actualiza por tiempo real.

### Corrección C9 — compartir ruta rápida

- Se corrigió el enlace entre la acción visible **Compartir ruta** y el publicador de modo rápido.
- Las gestiones rápidas ya no pasan por la validación antigua `r82915PublishRouteVerified`, que exigía coordenadas antes de publicar.
- Las dos gestiones actuales de Daniel Choc (`S350324` y `S350323`) conservan `geoReleaseBypass=true`, `geoValidationMode=observed_delivery`, `releaseApproved=true` y coordenadas pendientes.
- Prueba automatizada ejecutada llamando a la función visible `shareDriver`: publicación aprobada, sin solicitud de pin, ruta asignada a Daniel Choc y GPS pendiente hasta la entrega.
- La prueba también confirmó que quitar una gestión elimina su publicación y la devuelve íntegramente a **No asignados**.
- Después de guardar, el cliente vuelve a consultar `/api/state` y solamente muestra éxito si el servidor confirma mensajero, fecha y todas las gestiones de la ruta.

## Mensajeros, pedidos y ventas

- Pedidos y despachos conserva registros, estados, importación y exportación.
- Mensajeros conserva turnos, disponibilidad, métricas y acciones.
- Al guardar ausencia, las gestiones activas se devuelven a pendientes de reasignación.
- El cambio de nombre de vendedor conserva y reasocia sus pedidos mediante índice de acceso/nombre anterior.
- Las actualizaciones se guardan en el estado central y se difunden por el canal de tiempo real.

## Flotilla y solicitud de vehículo

- Flotilla conserva 11 vehículos, incluyendo paneles Toyota HiAce y Toyota LiteAce.
- Solicitud de vehículo conserva calendario, reservas, mantenimiento y formulario compartible.
- Se eliminó la espera obligatoria de siete días en servidor y formulario público.
- Verificación de formulario: acepta como fecha de salida y retorno el mismo día (30/10/2026).
- La asignación continúa sujeta a disponibilidad y ausencia de conflictos.

## Evidencias técnicas

- `node --check r82915-copy-approved.js`: aprobado.
- `server_copia_audit_v2.exe`: compilado y ejecutado.
- `qa-admin-report.json`: recorrido de nueve módulos.
- `qa-dark-report.json`: escaneo de superficies oscuras.
- `qa-rapid-report.json`: publicación rápida y desasignación completa.

## Revisión complementaria C14/C15

- Se unificaron las dos acciones históricas para quitar una gestión (`unassignStop` y `r773UnassignManagement`) en una sola operación persistente y con lectura de confirmación del servidor.
- El mapa excluye pedidos y recorridos que no pertenecen al corte operativo seleccionado.
- Las alertas de salida tardía dejan de repetirse como alerta activa después de iniciar o cerrar la ruta; el dato histórico continúa disponible en auditoría.
- Mensajeros muestra **Km recorridos**, no ruta planificada: usa GPS durante el recorrido y odómetro confirmado al cerrar.
- Una ruta sin posiciones GPS comienza en `0 km · 0 min`; cerrar una ruta deja el atraso activo en `0 min` sin borrar su antecedente de auditoría.
- La bitácora mensual incorpora las sesiones reales `r770_route_session` y el cierre vigente del mensajero; combustible y depreciación se calculan sobre kilómetros ejecutados, no sobre kilómetros planificados.
- El valor de factura importado se conserva como dato comercial y no se mezcla con costo logístico por entrega.
- Auditoría en navegador sobre la versión `82915c15`: acceso administrativo correcto, Dashboard operativo, carga individual visible, 11 mensajeros visibles con y sin ruta, métrica sin texto duplicado y cero errores de consola observados.

## Revisión complementaria C17 — 30/10/2026

- Se sustituyó el servidor anterior por la compilación de auditoría más reciente de esta misma copia; el túnel público confirmado sirve `82915c17`.
- Solicitud de vehículo: anticipación obligatoria fijada en **0 días** en estado cargado, formulario, configuración y validación del servidor. Se corrigió el caso en que el valor numérico `0` era interpretado erróneamente como `7`.
- El botón histórico y el menú moderno para quitar una gestión usan la misma rutina de desasignación completa, con guardado, lectura de confirmación y segundo intento controlado si el servidor conserva una asignación.
- La ruta rápida conserva la liberación sin pin previo y exige GPS observado durante la ejecución; distancia y tiempo permanecen en cero si no existe recorrido GPS real.
- El JavaScript complementario superó `node --check` y el recurso público respondió HTTP 200 con la marca de versión C17.
- Hash verificado de `R8.29.15_BLOQUEADA_ORIGINAL/index.html`: `EAEA27CF319F11B31E38BDF1413A2D25465762806C288C5E8E00704AC38DFB9E` (la original no fue editada).

## Nota de operación

### Corrección focalizada C18

- Flotilla calcula **Asignado** únicamente cuando la reserva cubre la fecha seleccionada; una solicitud futura no bloquea el vehículo hoy.
- Solicitud de vehículo conserva anticipación `0` en interfaz y servidor recompilado.
- Los puntos GPS observados respetan el corte operativo seleccionado.
- Quitar una gestión registra una marca persistente, limpia pedido maestro y visita compartida, y se reconcilia al recibir actualizaciones en tiempo real; la vista móvil deja de reconstruirla.
- Servidor C18 recompilado desde la fuente actual y enlace público verificado con HTTP 200.

La captura GPS real está implementada y auditada en código/flujo simulado. La precisión final depende del GPS y permisos de ubicación del teléfono del mensajero; debe realizarse una prueba física de campo antes de usarla como medición contractual.
