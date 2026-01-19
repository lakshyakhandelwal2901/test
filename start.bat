@echo off
setlocal enabledelayedexpansion

echo.
echo ========================================
echo Invoice Management App - Full Startup
echo ========================================
echo.

REM Check if Docker is running
echo [1/5] Checking Docker...
docker ps >nul 2>&1
if errorlevel 1 (
    echo Docker is not running. Please start Docker Desktop first.
    exit /b 1
)

REM Start Database
echo [2/5] Starting PostgreSQL Database...
docker-compose -f %CD%\docker-compose.yml up -d
timeout /t 3 /nobreak
echo [OK] Database started
echo.

REM Seed Database
echo [3/5] Seeding Database...
cd /d "%CD%\server"
call npm install >nul 2>&1
call npx prisma migrate deploy >nul 2>&1
call node prisma/seed.js
echo [OK] Database seeded
echo.

REM Install dependencies and start Backend
echo [4/5] Starting Backend Server (port 5000)...
cd /d "%CD%\server"
start "Invoice Backend" cmd /k npm run dev
timeout /t 3 /nobreak
echo [OK] Backend running
echo.

REM Install dependencies and start Frontend
echo [5/5] Starting Frontend Server (port 3001)...
cd /d "%CD%\client"
call npm install >nul 2>&1
start "Invoice Frontend" cmd /k npm run dev -- --port 3001
timeout /t 3 /nobreak
echo [OK] Frontend running
echo.

echo ========================================
echo [OK] All Services Started Successfully!
echo ========================================
echo.
echo Access the Application:
echo   Frontend:  http://localhost:3001
echo   Backend:   http://localhost:5000
echo   Database:  postgresql://invoiceuser:invoicepass@localhost:5432/invoice_db
echo.
echo Demo Credentials:
echo   Email:    demo@example.com
echo   Password: password123
echo.
echo Press Ctrl+C in each terminal to stop the services
echo.
pause
