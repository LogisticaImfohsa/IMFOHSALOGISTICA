@echo off
setlocal
cd /d "%~dp0"
set "IMFOHSA_PORT=8971"
set "IMFOHSA_BIND=0.0.0.0"
set "IMFOHSA_DISABLE_TUNNEL=1"
set "IMFOHSA_SKIP_PUBLIC_VERIFY=1"
title IMFOHSA R8.29.15 COPIA COMPLETA - NO CERRAR
echo Iniciando la copia completa de IMFOHSA...
echo Acceso local: http://127.0.0.1:8971/index.html?v=82915c29
echo Para otra computadora de la misma red use la IP de este equipo y el puerto 8971.
start "" /b powershell.exe -NoProfile -WindowStyle Hidden -Command "Start-Sleep -Seconds 3; Start-Process 'http://127.0.0.1:8971/index.html?v=82915c29'"
"%~dp0server_copia_aprobada_8946_c29.exe"
echo.
echo El servidor se detuvo. Presione una tecla para cerrar.
pause
endlocal
