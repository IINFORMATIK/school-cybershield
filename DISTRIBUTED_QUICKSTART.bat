@echo off
REM CyberShield Distributed Setup Quick Reference
REM Windows Batch Version

setlocal enabledelayedexpansion

cls
echo.
echo ==========================================
echo   CyberShield Distributed Setup Guide
echo ==========================================
echo.
echo.

REM Find IP addresses
echo Step 1: Finding your network IP address...
echo.
echo Your network IP addresses:
for /f "tokens=2 delims=:" %%A in ('ipconfig ^| find "IPv4"') do (
    echo %%A
)
echo.
echo Note the IP address (usually 192.168.x.x)
echo.
pause

cls
echo.
echo ==========================================
echo   CENTRAL PC (Main Monitoring Station)
echo ==========================================
echo.
echo 1. Make sure Python is installed:
echo    python --version
echo.
echo 2. Ensure required packages are installed:
echo    pip install flask flask-cors psutil scapy
echo.
echo 3. Start the central agent:
echo    python agent.py
echo.
echo 4. The server will run on:
echo    http://localhost:5000
echo.
echo 5. Test if working:
echo    curl http://localhost:5000/api/system
echo.
pause

cls
echo.
echo ==========================================
echo   CLIENT PC (Remote Computer to Monitor)
echo ==========================================
echo.
echo Option A: Using Setup Script (Recommended)
echo =========================================
echo   1. Copy to client PC:
echo      - setup_client.bat
echo      - agent_client.py
echo.
echo   2. Note central PC IP from previous step
echo.
echo   3. Run on client PC:
echo      setup_client.bat 192.168.1.100
echo.
echo      (Replace 192.168.1.100 with central PC IP)
echo.
echo   4. Follow the setup wizard
echo.
echo.
echo Option B: Manual Setup
echo ======================
echo   1. Copy agent_client.py to client PC
echo.
echo   2. Install requirements:
echo      pip install requests psutil
echo.
echo   3. Run with central PC IP:
echo      python agent_client.py http://192.168.1.100:5000
echo.
echo      (Replace 192.168.1.100 with central PC IP)
echo.
pause

cls
echo.
echo ==========================================
echo   VERIFICATION
echo ==========================================
echo.
echo 1. Check if central server is running:
echo    http://localhost:5000/api/system
echo.
echo 2. Check if clients connected:
echo    http://localhost:5000/api/clients
echo.
echo Expected response:
echo {
echo   "clientCount": 3,
echo   "clients": [
echo     {"hostname": "Lab1-PC01", "status": "Online", ...},
echo     {"hostname": "Lab2-PC02", "status": "Online", ...},
echo     ...
echo   ]
echo }
echo.
pause

cls
echo.
echo ==========================================
echo   DASHBOARD UPDATE
echo ==========================================
echo.
echo New tab: "Удаленные ПК" (Remote PCs)
echo.
echo Shows:
echo   ✓ All connected client machines
echo   ✓ Real-time CPU/RAM/Disk usage from each PC
echo   ✓ Security status (Firewall/Antivirus)
echo   ✓ Last seen timestamp
echo   ✓ Online/Offline status
echo.
echo Opens React dashboard:
echo   http://localhost:3000
echo.
pause

cls
echo.
echo ==========================================
echo   TROUBLESHOOTING
echo ==========================================
echo.
echo Problem: Client can't connect to server
echo Solution:
echo   1. Check central IP is correct:
echo      ipconfig
echo   2. Check firewall allows port 5000:
echo      netsh advfirewall show allprofiles
echo   3. Restart client if already running
echo.
echo Problem: Server firewall blocking connections
echo Solution (Central PC):
echo   netsh advfirewall firewall add rule ^
echo   name="Python Server" dir=in action=allow ^
echo   protocol=tcp localport=5000
echo.
echo Problem: Client shows but no data updates
echo Solution:
echo   1. Check client log messages
echo   2. Verify network connectivity: ping central-ip
echo   3. Restart client: press Ctrl+C then run again
echo   4. Check Python version: python --version ^(need 3.8+^)
echo.
echo Problem: "ModuleNotFoundError: No module named 'requests'"
echo Solution:
echo   pip install requests
echo.
pause

cls
echo.
echo ==========================================
echo   FILES OVERVIEW
echo ==========================================
echo.
echo CENTRAL AGENT:
echo   agent.py
echo     - Main server application
echo     - Manages client connections
echo     - Provides API endpoints
echo.
echo CLIENT AGENT:
echo   agent_client.py
echo     - Lightweight client for remote PCs
echo     - Collects system metrics
echo     - Sends to central server
echo.
echo SETUP TOOLS:
echo   setup_client.bat
echo     - Automated setup for client PCs
echo     - Installs dependencies
echo     - Creates auto-start task
echo.
echo   DISTRIBUTED_SETUP.md
echo     - Detailed technical documentation
echo     - API reference
echo     - Network architecture
echo.
echo   DISTRIBUTED_QUICKSTART.sh
echo     - Linux/Mac quick start
echo.
pause

cls
echo.
echo ==========================================
echo   NEXT STEPS
echo ==========================================
echo.
echo 1. Start central agent on your main PC:
echo    python agent.py
echo.
echo 2. Note your PC's IP address (from Step 1)
echo.
echo 3. On each remote PC, run:
echo    setup_client.bat [YOUR_IP]
echo    
echo    or manually:
echo    python agent_client.py http://[YOUR_IP]:5000
echo.
echo 4. Open dashboard:
echo    http://localhost:3000
echo.
echo 5. Go to "Удаленные ПК" tab to see all connected PCs
echo.
echo For more details, see: DISTRIBUTED_SETUP.md
echo.
pause
