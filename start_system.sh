#!/bin/bash

# Configuration
PORT=3000
SERVER_FILE="backend/server.js"

echo "=============================================="
echo "   Starting Attendance Management System"
echo "=============================================="

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Navigate to the system directory
SYSTEM_DIR="$(dirname "$0")/system"
if [ ! -d "$SYSTEM_DIR" ]; then
    echo "❌ System directory not found at $SYSTEM_DIR. Please ensure the 'system' folder exists."
    exit 1
fi
cd "$SYSTEM_DIR"

# Check for node_modules and install dependencies if missing
if [ ! -d "node_modules" ]; then
    echo "📦 Dependencies not found. Installing..."
    npm install
    if [ $? -ne 0 ]; then
        echo "❌ Failed to install dependencies."
        exit 1
    fi
else
    echo "✅ Dependencies found."
fi

# Check if server file exists
if [ ! -f "$SERVER_FILE" ]; then
    echo "❌ Server file '$SERVER_FILE' not found!"
    exit 1
fi

echo "🔍 Checking Nginx status..."
if ! systemctl is-active --quiet nginx; then
    echo "⚠️ Nginx is not running. Attempting to start it..."
    if sudo systemctl start nginx; then
        echo "✅ Nginx started successfully."
    else
        echo "❌ Failed to start Nginx. Please check your configuration or permissions."
        exit 1
    fi
else
    echo "✅ Nginx is already running."
fi

# Deploy HTTPS site via nginx (self-signed by default). Set HTTPS=0 to skip.
if [ "${HTTPS:-1}" != "0" ]; then
    echo "🔐 Deploying HTTPS site via nginx (this may prompt for sudo)..."
    if [ -x "system/deploy_https.sh" ]; then
        sudo bash system/deploy_https.sh detect || {
            echo "❌ HTTPS deploy failed; aborting start."; exit 1; }
    else
        echo "⚠️ system/deploy_https.sh not found or not executable; skipping HTTPS deploy."
    fi
fi

echo "🚀 Starting server on port $PORT..."
echo "Press Ctrl+C to stop the server."
echo "=============================================="

# Start the server
node "$SERVER_FILE"
