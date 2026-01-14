@echo off
REM School CyberShield - Quick Start Script for Windows
REM This script will start both the Python backend and React frontend

echo.
echo ====================================================
echo   School CyberShield - Cyber Security Audit System
echo ====================================================
echo.

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Python is not installed or not in PATH
    echo Please install Python 3.8+ from https://www.python.org
    pause
    exit /b 1
)

REM Check if Node.js is installed
node --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Node.js is not installed or not in PATH
    echo Please install Node.js 16+ from https://nodejs.org
    pause
    exit /b 1
)

echo [OK] Python and Node.js are installed
echo.

REM Install Python requirements if not already installed
echo [*] Checking Python dependencies...
pip show flask >nul 2>&1
if errorlevel 1 (
    echo [*] Installing Python dependencies from requirements.txt...
    pip install -r requirements.txt
    if errorlevel 1 (
        echo [ERROR] Failed to install Python dependencies
        pause
        exit /b 1
    )
    echo [OK] Python dependencies installed
) else (
    echo [OK] Python dependencies are already installed
)

echo.
echo ====================================================
echo   Starting School CyberShield Services
echo ====================================================
echo.
echo [1] Starting Python Backend Agent on localhost:5000
echo [2] Starting React Frontend on localhost:5173
echo.
echo Make sure to run this script as Administrator for proper ARP scanning!
echo.
pause

REM Start Python backend in new window
echo [*] Starting Python agent...
start "CyberShield Agent" python agent.py

REM Wait for backend to start
timeout /t 2 /nobreak

REM Start React frontend in new window
echo [*] Starting React frontend...
start "CyberShield Frontend" npm run dev

echo.
echo ====================================================
echo   Services Starting...
echo ====================================================
echo.
echo Frontend: http://localhost:5173
echo Backend:  http://localhost:5000
echo.
echo Close any window to stop that service.
echo Both windows must be running for full functionality.
echo.
pause
