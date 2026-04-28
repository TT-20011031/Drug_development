@echo off
setlocal enabledelayedexpansion

echo ============================================
echo   ShouXianGu Product Dev - Start
echo ============================================
echo.

set BP=9603
set FP=9604
set "RD=%~dp0"

echo [1/4] Cleaning ports...
for /f "tokens=5" %%a in ('netstat -aon 2^>nul ^| findstr ":9603 "') do (
    taskkill /PID %%a /F >nul 2>&1
)
for /f "tokens=5" %%a in ('netstat -aon 2^>nul ^| findstr ":9604 "') do (
    taskkill /PID %%a /F >nul 2>&1
)
echo    Done.

echo.
echo [2/4] Starting backend on port 9603...
start "Backend-9603" /min /d "%RD%backend" .venv\Scripts\python.exe main.py

echo [3/4] Waiting for backend...
ping 127.0.0.1 -n 4 >nul

echo [4/4] Starting frontend on port 9604...
start "Frontend-9604" /min /d "%RD%frontend" cmd /c "npm run dev -- -p 9604"

ping 127.0.0.1 -n 6 >nul

echo.
echo ============================================
echo   All services started!
echo   Frontend: http://localhost:9604
echo   Backend:  http://localhost:9603
echo   API Docs: http://localhost:9603/docs
echo ============================================
echo.
echo Press any key to open browser...
pause >nul

start "" "http://localhost:9604"

endlocal
