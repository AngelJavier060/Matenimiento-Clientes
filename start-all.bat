@echo off
chcp 65001 >nul
title Vehicle Maintenance System

:: ──────────────────────────────────────────────
::  VEHICLE MAINTENANCE SYSTEM - START ALL
::  Mata procesos anteriores y arranca todo
:: ──────────────────────────────────────────────

call :EchoHeader

:: 1. Matar procesos anteriores
echo [1/4] 🔪 Matando procesos anteriores...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":8080" 2^>nul') do taskkill /F /PID %%a >nul 2>&1
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":4200" 2^>nul') do taskkill /F /PID %%a >nul 2>&1
timeout /t 2 /nobreak >nul
echo    Puertos 8080 y 4200 liberados.
echo.

echo [2/4] 🚀 Iniciando BACKEND (Spring Boot)...
start "Backend" cmd /c "cd /d "%~dp0backend" && mvn clean spring-boot:run"
echo    Backend corriendo en http://localhost:8080
echo    (esperando 15s para que compile...)
timeout /t 15 /nobreak >nul
echo.

echo [3/4] 🌐 Iniciando FRONTEND (Angular)...
start "Frontend" cmd /c "cd /d "%~dp0frontend" && ng serve -o"
echo    Frontend corriendo en http://localhost:4200
timeout /t 5 /nobreak >nul
echo.

echo ========================================
echo  ✅ SISTEMA INICIADO CORRECTAMENTE
echo ========================================
echo.
echo  Backend:  http://localhost:8080
echo  Frontend: http://localhost:4200
echo  Register: http://localhost:4200/register
echo  Swagger:  http://localhost:8080/swagger-ui.html
echo.
pause
exit /b

:EchoHeader
echo.
echo ╔══════════════════════════════════════════════════╗
echo ║    VEHICLE MAINTENANCE SYSTEM                    ║
echo ║    Unified Client ^& Vehicle Registration         ║
echo ╚══════════════════════════════════════════════════╝
echo.
goto :eof
