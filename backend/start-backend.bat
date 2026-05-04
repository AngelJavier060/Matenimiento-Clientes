@echo off
chcp 65001 >nul
title Vehicle Maintenance API

:: ──────────────────────────────────────────────
::  VEHICLE MAINTENANCE API - STARTER
::  Siempre mata el proceso anterior primero
:: ──────────────────────────────────────────────

call :EchoHeader

:: 1. Matar cualquier proceso en el puerto 8080
echo [1/3] 🔍 Buscando procesos en puerto 8080...
for /f "tokens=5" %%p in ('netstat -ano ^| findstr ":8080" 2^>nul') do (
    echo    -> Matando PID: %%p
    taskkill /F /PID %%p >nul 2>&1
)
timeout /t 2 /nobreak >nul
echo    Puerto 8080 liberado.
echo.

:: 2. Limpiar compilacion anterior
echo [2/3] 🧹 Limpiando compilacion anterior...
if exist "%~dp0target" (
    rmdir /s /q "%~dp0target"
    echo    Build anterior eliminado.
) else (
    echo    No hay build previa.
)
echo.

:: 3. Arrancar backend
echo [3/3] 🚀 Iniciando backend...
echo.
cd /d "%~dp0"
mvn spring-boot:run
if %errorlevel% neq 0 (
    echo.
    echo ⚠️  Error al iniciar. Ejecuta individualmente:
    echo    mvn clean spring-boot:run
    echo.
    pause
)
exit /b

:: ─────────── Funciones ───────────
:EchoHeader
echo.
echo ╔══════════════════════════════════════════╗
echo ║   VEHICLE MAINTENANCE API                ║
echo ║   http://localhost:8080                   ║
echo ╚══════════════════════════════════════════╝
echo.
goto :eof
