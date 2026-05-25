@echo off
echo ========================================
echo Killing All Services
echo ========================================
echo.

echo Killing Node.js processes...
taskkill /F /IM node.exe 2>nul
taskkill /F /IM nodemon.exe 2>nul

echo Killing Python processes...
taskkill /F /IM python.exe 2>nul

echo.
echo ========================================
echo All services killed!
echo ========================================
echo.
echo You can now run: start-services.bat
echo.
pause
