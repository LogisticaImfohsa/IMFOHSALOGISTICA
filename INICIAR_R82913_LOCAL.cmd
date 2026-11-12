@echo off
setlocal
cd /d "%~dp0"
set "IMFOHSA_PORT=8893"
set "IMFOHSA_BIND=127.0.0.1"
set "IMFOHSA_DISABLE_TUNNEL=1"
title IMFOHSA R8.29.13 - NO CERRAR
echo Iniciando IMFOHSA R8.29.13...
echo Esta ventana debe permanecer abierta durante las pruebas.
start "" /b powershell.exe -NoProfile -WindowStyle Hidden -Command "Start-Sleep -Seconds 3; Start-Process 'http://127.0.0.1:8893/index.html?access=1^&v=82913'"
"%~dp0server_imfohsa.exe" 1>"%~dp0R82913_SERVIDOR.log" 2>&1
echo.
echo El servidor se detuvo. Revise R82913_SERVIDOR.log
type "%~dp0R82913_SERVIDOR.log"
pause
endlocal
