@echo off
setlocal enabledelayedexpansion

echo ============================================
echo   ShouXianGu Product Dev - Start
echo ============================================
echo.

set BP=9527
set FP=9528
set "RD=%~dp0"

echo [1/4] Cleaning ports...
for /f "tokens=5" %%a in ('netstat -aon 2^>nul ^| findstr ":9527 "') do (
    taskkill /PID %%a /F >nul 2>&1
)
for /f "tokens=5" %%a in ('netstat -aon 2^>nul ^| findstr ":9528 "') do (
    taskkill /PID %%a /F >nul 2>&1
)
echo    Done.

echo.
echo [2/4] Starting backend on port 9527...
start "Backend-9527" /min /d "%RD%backend" .venv\Scripts\python.exe main.py

echo [3/4] Waiting for backend...
ping 127.0.0.1 -n 4 >nul

echo [4/4] Starting frontend on port 9528...
start "Frontend-9528" /min /d "%RD%frontend" cmd /c "npm run dev -- -p 9528"

ping 127.0.0.1 -n 6 >nul

echo.
echo ============================================
echo   All services started!
echo   Frontend: http://localhost:9528
echo   Backend:  http://localhost:9527
echo   API Docs: http://localhost:9527/docs
echo ============================================
echo.
echo Press any key to open browser...
pause >nul

start "" "http://localhost:9528"

endlocal
