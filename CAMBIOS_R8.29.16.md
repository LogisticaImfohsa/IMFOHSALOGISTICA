# IMFOHSA R8.29.16 — Corrección inicio de ruta del mensajero (2026-11-17)

## Problema
Al presionar "Confirmar e iniciar ruta" el mensajero veía
"Conexión inestable · reintentando 1/3, 2/3" y luego
"No se pudo confirmar la acción después de 3 intentos".

## Causa real
1. La ruta del día no había sido enviada oficialmente por Logística
   (el mensajero tenía `routePublishedDate` de una fecha anterior). El
   servidor rechaza el inicio con 409 "La ruta aún no ha sido enviada
   oficialmente por Logística".
2. El mensajero que entra con usuario y contraseña ve sus gestiones en
   vista previa aunque la ruta no esté enviada, y la app le mostraba
   "Lista para iniciar" y le permitía tomar la foto del odómetro.
3. El módulo de reintentos (r82915i) trataba cualquier rechazo del
   servidor como falla de conexión, ocultaba el motivo real y reintentaba.
4. El aviso "Salida posterior al límite" se calculaba con la hora de una
   asignación anterior.

## Cambios (solo index.html; el servidor Go no cambió)
- Reintentos: un rechazo del servidor (4xx) se muestra con su motivo real y
  no se reintenta. Solo se reintenta ante fallas de red o errores 5xx.
- Reintentos: el inicio de ruta se reconoce como aplicado si el servidor ya
  lo registró aunque la respuesta se haya perdido (evita error falso).
- Mensajero: si la ruta de HOY no está enviada, la app muestra
  "Ruta en preparación", deshabilita "Preparar"/"Iniciar" y no pide la foto.
  Se habilita sola cuando Logística envía la ruta (refresco automático).
- Etiqueta de versión visible: R8.29.16.

## Pruebas realizadas
- Ruta no enviada: botón bloqueado, mensaje claro, sin foto, 1 sola
  solicitud con el motivo real.
- Ruta enviada hoy: inicio correcto ("En ruta", odómetro guardado).
- Respuesta perdida con inicio guardado: la app lo detecta y continúa.
