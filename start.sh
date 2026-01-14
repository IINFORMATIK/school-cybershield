#!/bin/bash

# School CyberShield - Quick Start Script for Linux/Mac
# This script will start both the Python backend and React frontend

echo ""
echo "===================================================="
echo "  School CyberShield - Cyber Security Audit System"
echo "===================================================="
echo ""

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "[ERROR] Python 3 is not installed"
    echo "Please install Python 3.8+ from https://www.python.org"
    exit 1
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "[ERROR] Node.js is not installed or not in PATH"
    echo "Please install Node.js 16+ from https://nodejs.org"
    exit 1
fi

echo "[OK] Python and Node.js are installed"
echo ""

# Install Python requirements if not already installed
echo "[*] Checking Python dependencies..."
if ! python3 -c "import flask" 2>/dev/null; then
    echo "[*] Installing Python dependencies from requirements.txt..."
    pip3 install -r requirements.txt
    if [ $? -ne 0 ]; then
        echo "[ERROR] Failed to install Python dependencies"
        exit 1
    fi
    echo "[OK] Python dependencies installed"
else
    echo "[OK] Python dependencies are already installed"
fi

echo ""
echo "===================================================="
echo "  Starting School CyberShield Services"
echo "===================================================="
echo ""
echo "[1] Starting Python Backend Agent on localhost:5000"
echo "[2] Starting React Frontend on localhost:5173"
echo ""

# Start Python backend in background
echo "[*] Starting Python agent..."
python3 agent.py &
AGENT_PID=$!
sleep 2

# Start React frontend
echo "[*] Starting React frontend..."
npm run dev &
FRONTEND_PID=$!

echo ""
echo "===================================================="
echo "  Services Starting..."
echo "===================================================="
echo ""
echo "Frontend: http://localhost:5173"
echo "Backend:  http://localhost:5000"
echo ""
echo "Process IDs:"
echo "  Agent:    $AGENT_PID"
echo "  Frontend: $FRONTEND_PID"
echo ""
echo "To stop all services, press Ctrl+C"
echo ""

# Wait for processes
wait

# Cleanup on exit
kill $AGENT_PID $FRONTEND_PID 2>/dev/null
echo "Services stopped."
