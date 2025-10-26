#!/bin/bash

# Quick test script for local deployment verification

echo "🚀 SimChess - Pre-Deployment Checklist"
echo "======================================="
echo ""

# Check if we're in the right directory
if [ ! -f "app.py" ]; then
    echo "❌ Error: app.py not found. Run this script from the simchess directory."
    exit 1
fi

echo "✅ Found app.py"

# Check for requirements.txt
if [ ! -f "requirements.txt" ]; then
    echo "❌ Error: requirements.txt not found"
    exit 1
fi

echo "✅ Found requirements.txt"

# Check for render.yaml
if [ ! -f "render.yaml" ]; then
    echo "❌ Error: render.yaml not found"
    exit 1
fi

echo "✅ Found render.yaml"

# Test if Python is available
if ! command -v python3 &> /dev/null; then
    echo "❌ Python3 is not installed"
    exit 1
fi

echo "✅ Python3 is available"

# Test installation
echo ""
echo "📦 Testing package installation..."
echo "Installing dependencies (this may take a moment)..."

if pip3 install -r requirements.txt > /dev/null 2>&1; then
    echo "✅ All dependencies installed successfully"
else
    echo "⚠️  Warning: Some dependencies may have issues"
fi

# Test local server
echo ""
echo "🧪 Local Server Test"
echo "===================="
echo ""
echo "Starting server on http://localhost:10000"
echo "Press Ctrl+C to stop the server"
echo ""
echo "To test:"
echo "  1. Open http://localhost:10000 in your browser"
echo "  2. Create a game"
echo "  3. Open another browser window/tab and join with the game ID"
echo ""
echo "Starting server..."
echo ""

python3 app.py
