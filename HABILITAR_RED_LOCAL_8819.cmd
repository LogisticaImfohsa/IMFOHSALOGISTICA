@echo off
chcp 65001 >nul
echo Habilitando LOGISTICA IMFOHSA en la red local...
netsh advfirewall firewall add rule name="IMFOHSA Logistica 8819" dir=in action=allow protocol=TCP localport=8819 profile=private
if errorlevel 1 (
  echo.
  echo No se pudo crear la regla. Haga clic derecho sobre este archivo y seleccione:
  echo EJECUTAR COMO ADMINISTRADOR
) else (
  echo.
  echo LISTO. El puerto 8819 ya esta habilitado para la red privada.
  echo Enlace: http://192.168.2.158:8819/index.html?access=1^&v=82210
)
echo.
pause
