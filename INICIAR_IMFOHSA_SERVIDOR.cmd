@echo off
setlocal
cd /d "%~dp0"
set "IMFOHSA_ROOT=%~dp0"
if not defined IMFOHSA_PORT set "IMFOHSA_PORT=8946"
if not defined IMFOHSA_ENV set "IMFOHSA_ENV=production"
echo Iniciando IMFOHSA desde %IMFOHSA_ROOT%
echo Puerto: %IMFOHSA_PORT%
"%~dp0IMFOHSA_SERVIDOR.exe"

