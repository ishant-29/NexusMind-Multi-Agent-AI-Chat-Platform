@echo off
echo ========================================
echo Starting NexusMind Microservices
echo ========================================
echo.

echo Starting Auth Service (Port 4000)...
start "Auth Service" cmd /k "cd services\auth-service && npm run dev"
timeout /t 2 /nobreak >nul

echo Starting User Service (Port 4001)...
start "User Service" cmd /k "cd services\user-service && npm run dev"
timeout /t 2 /nobreak >nul

echo Starting Conversation Service (Port 4002)...
start "Conversation Service" cmd /k "cd services\conversation-service && npm run dev"
timeout /t 2 /nobreak >nul

echo Starting File Service (Port 4003)...
start "File Service" cmd /k "cd services\file-service && npm run dev"
timeout /t 2 /nobreak >nul

echo Starting Agent Service (Port 7777)...
start "Agent Service" cmd /k "cd services\agent-service && set PYTHONUTF8=1 && python main.py"
timeout /t 2 /nobreak >nul

echo.
echo ========================================
echo All services started!
echo ========================================
echo.
echo Services running:
echo - Auth Service: http://localhost:4000
echo - User Service: http://localhost:4001
echo - Conversation Service: http://localhost:4002
echo - File Service: http://localhost:4003
echo - Agent Service: http://localhost:7777
echo.
echo Press any key to exit...
pause >nul
