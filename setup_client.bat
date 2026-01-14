@echo off
REM CyberShield Client Setup Script
REM Usage: setup_client.bat <server_ip>
REM Example: setup_client.bat 192.168.1.100

setlocal enabledelayedexpansion

echo.
echo ====================================
echo   CyberShield Client Setup
echo ====================================
echo.

REM Check if server IP is provided
if "%1"=="" (
    echo Usage: setup_client.bat ^<server_ip^>
    echo.
    echo Example: setup_client.bat 192.168.1.100
    echo.
    pause
    exit /b 1
)

set SERVER_IP=%1
set SERVER_URL=http://%SERVER_IP%:5000

echo Configuring for server: %SERVER_URL%
echo.

REM Check Python is installed
echo Checking Python installation...
python --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Python is not installed or not in PATH
    echo Please install Python 3.8+ from python.org
    pause
    exit /b 1
)

echo Python found.
echo.

REM Install required packages
echo Installing required Python packages...
pip install requests psutil --quiet

if errorlevel 1 (
    echo WARNING: Some packages failed to install
    echo Please ensure pip is working correctly
)

echo.

REM Create configuration file
echo Creating configuration file...
(
    echo # CyberShield Client Configuration
    echo SERVER_URL=%SERVER_URL%
    echo UPDATE_INTERVAL=5
) > cybershield_client.conf

echo Configuration saved to: cybershield_client.conf
echo.

REM Create startup script
echo Creating startup script...
(
    echo @echo off
    echo cd /d "%%~dp0"
    echo python agent_client.py %SERVER_URL%
    echo pause
) > start_client.bat

echo Startup script created: start_client.bat
echo.

REM Offer to create Windows Task
echo.
echo Optional: Would you like to create a Windows Task for auto-start?
echo (This requires Administrator privileges)
echo.
set /p CREATE_TASK="Create Task? (y/n): "

if /i "%CREATE_TASK%"=="y" (
    echo Creating Windows Task...
    
    REM Get full path to startup script
    set SCRIPT_PATH=%cd%\start_client.bat
    
    REM Create task (requires admin)
    taskkill /f /im pythonw.exe /fi "WINDOWTITLE eq CyberShield*" >nul 2>&1
    
    echo Creating scheduled task...
    powershell -Command "Start-Process powershell -ArgumentList 'schtasks /create /tn CyberShieldClient /tr \"!SCRIPT_PATH!\" /sc onstart /rl highest /f' -Verb RunAs -Wait" >nul 2>&1
    
    if errorlevel 0 (
        echo Task created successfully. Client will start automatically on boot.
    ) else (
        echo Could not create task. You can run start_client.bat manually.
    )
) else (
    echo Task creation skipped.
)

echo.
echo ====================================
echo Setup Complete!
echo ====================================
echo.
echo To start the client manually, run:
echo   start_client.bat
echo.
echo The client will connect to: %SERVER_URL%
echo.
echo Press any key to exit...
pause >nul
