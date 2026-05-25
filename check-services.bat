@echo off
echo.
echo ╔══════════════════════════════════════════════════════════════╗
echo ║           MetaWurks Services Status Check                   ║
echo ╚══════════════════════════════════════════════════════════════╝
echo.

echo Checking services...
echo.

REM Check Frontend
curl -s http://localhost:3000 >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Frontend ^(3000^): Running
) else (
    echo ❌ Frontend ^(3000^): Not running
)

REM Check Agent Service
curl -s http://localhost:7777/health >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Agent Service ^(7777^): Running
) else (
    echo ❌ Agent Service ^(7777^): Not running
)

REM Check Auth Service
curl -s http://localhost:4000/health >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Auth Service ^(4000^): Running
) else (
    echo ❌ Auth Service ^(4000^): Not running
)

REM Check User Service
curl -s http://localhost:4001/health >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ User Service ^(4001^): Running
) else (
    echo ❌ User Service ^(4001^): Not running
)

REM Check Conversation Service
curl -s http://localhost:4002/health >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Conversation Service ^(4002^): Running
) else (
    echo ❌ Conversation Service ^(4002^): Not running
)

REM Check File Service
curl -s http://localhost:4003/health >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ File Service ^(4003^): Running
) else (
    echo ❌ File Service ^(4003^): Not running
)

echo.
echo ═══════════════════════════════════════════════════════════════
echo.
echo If all services are running, open: http://localhost:3000
echo.
echo To check again, run: check-services.bat
echo To stop all services, run: kill-services.bat
echo.
pause
