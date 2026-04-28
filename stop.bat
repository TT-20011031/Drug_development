@echo off
echo Stopping all services...

for /f "tokens=5" %%a in ('netstat -aon 2^>nul ^| findstr ":9603 "') do (
    taskkill /PID %%a /F >nul 2>&1
)
for /f "tokens=5" %%a in ('netstat -aon 2^>nul ^| findstr ":9604 "') do (
    taskkill /PID %%a /F >nul 2>&1
)

echo All services stopped.
ping 127.0.0.1 -n 3 >nul
