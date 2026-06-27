@echo off
REM ═══════════════════════════════════════════════
REM  Lanzador local de FEM VOTACIONS (desarrollo)
REM  Doble clic para servir la app por HTTP y abrir el navegador.
REM  Los modulos ES NO funcionan por doble clic en index.html (file://).
REM ═══════════════════════════════════════════════
cd /d "%~dp0"

where node >nul 2>nul
if errorlevel 1 (
  echo.
  echo [ERROR] No se ha encontrado Node.js.
  echo Instalalo desde https://nodejs.org y vuelve a intentarlo.
  echo.
  pause
  exit /b 1
)

echo.
echo  Arrancando FEM VOTACIONS...
echo  Se abrira el navegador automaticamente.
echo  Cierra esta ventana (o Ctrl+C) para detener el servidor.
echo.
node server.js

pause
