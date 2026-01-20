#!/bin/bash

# Flutter Android Screen Capture Script
# Similar to capture-all-pages.js for web apps

set -e

SCREENSHOT_DIR="screenshots"
DEVICE_PATH="/sdcard/screenshots"
APP_PACKAGE="${1:-com.example.yourapp}"  # Change to your app package
WAIT_TIME=3

echo "=========================================="
echo "Flutter Android Screen Capture Script"
echo "=========================================="
echo ""

# Check if ADB is available
if ! command -v adb &> /dev/null; then
    echo "❌ Error: ADB not found!"
    echo "Please install Android SDK Platform Tools"
    exit 1
fi

# Check if device is connected
if ! adb devices | grep -q "device$"; then
    echo "❌ Error: No Android device connected!"
    echo "Please connect a device or start an emulator."
    echo ""
    echo "To check devices, run: adb devices"
    exit 1
fi

echo "✓ Android device detected"
echo ""

# Create directories
mkdir -p "$SCREENSHOT_DIR"
adb shell mkdir -p "$DEVICE_PATH"
adb shell rm -rf "${DEVICE_PATH}/*"

echo "✓ Directories created"
echo ""

# Launch app if package provided
if [ -n "$APP_PACKAGE" ]; then
    echo "Launching app: $APP_PACKAGE"
    adb shell monkey -p "$APP_PACKAGE" -c android.intent.category.LAUNCHER 1
    sleep 3
    echo ""
fi

# List of screens to capture
SCREENS=(
    "home"
    "login"
    "signup"
    "dashboard"
    "profile"
    "settings"
)

echo "Manual Capture Mode"
echo "-------------------"
echo "Navigate to each screen when prompted."
echo "Press Enter after navigating to each screen."
echo ""

# Capture each screen
for screen in "${SCREENS[@]}"; do
    read -p "📍 Navigate to '$screen' screen and press Enter... "
    
    timestamp=$(date +"%Y%m%d_%H%M%S")
    device_file="${DEVICE_PATH}/screenshot_${screen}_${timestamp}.png"
    local_file="${SCREENSHOT_DIR}/${screen}_${timestamp}.png"
    
    # Take screenshot
    adb shell screencap -p "$device_file"
    
    # Pull to local
    adb pull "$device_file" "$local_file"
    
    # Clean up device
    adb shell rm "$device_file"
    
    if [ -f "$local_file" ]; then
        file_size=$(stat -f%z "$local_file" 2>/dev/null || stat -c%s "$local_file" 2>/dev/null)
        echo "✓ Captured: $screen -> $local_file ($file_size bytes)"
    else
        echo "✗ Failed to capture: $screen"
    fi
    
    sleep $WAIT_TIME
done

echo ""
echo "=========================================="
echo "✓ All screens captured successfully!"
echo "✓ Screenshots saved in: $(pwd)/$SCREENSHOT_DIR"
echo "=========================================="
