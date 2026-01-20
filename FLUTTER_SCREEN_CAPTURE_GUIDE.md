# Flutter Android Screen Capture Guide

This guide explains how to capture all screens of your Flutter Android application, similar to capturing web pages in a browser.

## Overview

There are several methods to capture screens in Flutter Android apps:
1. **ADB (Android Debug Bridge)** - Most common and reliable
2. **Flutter Screenshot Package** - Programmatic capture during runtime
3. **Automated UI Testing** - Capture screens during integration tests
4. **Manual ADB Scripts** - Simple automation scripts

## Prerequisites

### Required Tools

1. **Android SDK** (includes ADB)
   - Usually located at: `%LOCALAPPDATA%\Android\Sdk\platform-tools\` (Windows)
   - Or: `~/Android/Sdk/platform-tools/` (Mac/Linux)

2. **Flutter SDK** - Already installed if you're developing Flutter apps

3. **Connected Android Device or Emulator**
   - Physical device: Enable USB debugging
   - Emulator: Already configured for debugging

### Verify Installation

```bash
# Check ADB
adb version

# Check Flutter
flutter doctor

# List connected devices
adb devices
```

## Method 1: Using ADB (Recommended for Complete App Screenshots)

### Basic ADB Screenshot

Capture a single screenshot:

```bash
# Take a screenshot and save to device
adb shell screencap -p /sdcard/screenshot.png

# Pull screenshot to your computer
adb pull /sdcard/screenshot.png ./screenshots/
```

### Automated Screen Capture Script

Create a script to navigate through your app and capture all screens.

#### Windows Batch Script (`capture-all-screens.bat`)

```batch
@echo off
setlocal enabledelayedexpansion

echo Flutter Android Screen Capture Script
echo =====================================

set SCREENSHOT_DIR=screenshots
set DEVICE_PATH=/sdcard/screenshots

:: Create local directory
if not exist %SCREENSHOT_DIR% mkdir %SCREENSHOT_DIR%

:: Create device directory
adb shell mkdir -p %DEVICE_PATH%

:: Clear old screenshots
adb shell rm -rf %DEVICE_PATH%\*

echo.
echo Please navigate through your app manually.
echo The script will capture screenshots every 3 seconds.
echo Press Ctrl+C to stop.
echo.

:loop
    set timestamp=%date:~-4,4%%date:~-7,2%%date:~-10,2%_%time:~0,2%%time:~3,2%%time:~6,2%
    set timestamp=!timestamp: =0!
    
    adb shell screencap -p %DEVICE_PATH%\screenshot_!timestamp!.png
    echo Captured: screenshot_!timestamp!.png
    
    timeout /t 3 /nobreak >nul
goto loop
```

#### Bash Script for Mac/Linux (`capture-all-screens.sh`)

```bash
#!/bin/bash

SCREENSHOT_DIR="screenshots"
DEVICE_PATH="/sdcard/screenshots"

echo "Flutter Android Screen Capture Script"
echo "====================================="

# Create local directory
mkdir -p "$SCREENSHOT_DIR"

# Create device directory
adb shell mkdir -p "$DEVICE_PATH"

# Clear old screenshots
adb shell rm -rf "${DEVICE_PATH}/*"

echo ""
echo "Please navigate through your app manually."
echo "The script will capture screenshots every 3 seconds."
echo "Press Ctrl+C to stop."
echo ""

while true; do
    timestamp=$(date +"%Y%m%d_%H%M%S")
    filename="screenshot_${timestamp}.png"
    
    adb shell screencap -p "${DEVICE_PATH}/${filename}"
    echo "Captured: ${filename}"
    
    sleep 3
done
```

#### Python Automated Script (`capture-all-screens.py`)

```python
#!/usr/bin/env python3
"""
Flutter Android Screen Capture Script
Captures screenshots while navigating through the app
"""

import subprocess
import os
import time
from datetime import datetime

SCREENSHOT_DIR = "screenshots"
DEVICE_PATH = "/sdcard/screenshots"

def run_adb_command(command):
    """Execute ADB command"""
    try:
        result = subprocess.run(
            f"adb {command}",
            shell=True,
            capture_output=True,
            text=True
        )
        return result.returncode == 0, result.stdout, result.stderr
    except Exception as e:
        return False, "", str(e)

def setup_directories():
    """Create necessary directories"""
    os.makedirs(SCREENSHOT_DIR, exist_ok=True)
    run_adb_command(f"shell mkdir -p {DEVICE_PATH}")
    run_adb_command(f"shell rm -rf {DEVICE_PATH}/*")

def capture_screenshot(screen_name):
    """Capture a screenshot and pull it to local machine"""
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    device_file = f"{DEVICE_PATH}/screenshot_{timestamp}_{screen_name}.png"
    local_file = os.path.join(SCREENSHOT_DIR, f"{screen_name}_{timestamp}.png")
    
    # Take screenshot on device
    success, _, _ = run_adb_command(f"shell screencap -p {device_file}")
    if not success:
        print(f"Failed to capture {screen_name}")
        return False
    
    # Pull screenshot to local machine
    success, _, _ = run_adb_command(f"pull {device_file} {local_file}")
    if success:
        print(f"✓ Captured: {screen_name} -> {local_file}")
        # Clean up device file
        run_adb_command(f"shell rm {device_file}")
        return True
    else:
        print(f"✗ Failed to pull {screen_name}")
        return False

def capture_all_screens():
    """Main function to capture all screens"""
    print("Flutter Android Screen Capture")
    print("=" * 40)
    
    # Check if device is connected
    success, output, _ = run_adb_command("devices")
    if "device" not in output.lower():
        print("Error: No Android device connected!")
        print("Please connect a device or start an emulator.")
        return
    
    setup_directories()
    
    screens = [
        "home",
        "login",
        "signup",
        "dashboard",
        "profile",
        "settings",
        # Add all your screen names here
    ]
    
    print("\nManual Capture Mode")
    print("Navigate to each screen when prompted.")
    print("Press Enter after navigating to each screen.\n")
    
    for screen in screens:
        input(f"Navigate to '{screen}' screen and press Enter...")
        capture_screenshot(screen)
        time.sleep(1)  # Small delay between captures
    
    print(f"\n✓ All screens captured in '{SCREENSHOT_DIR}' directory")

if __name__ == "__main__":
    capture_all_screens()
```

### Using the Scripts

1. **Connect your Android device or start an emulator**
   ```bash
   adb devices
   ```

2. **Run the script**:
   - Windows: `capture-all-screens.bat`
   - Mac/Linux: `chmod +x capture-all-screens.sh && ./capture-all-screens.sh`
   - Python: `python capture-all-screens.py`

3. **Navigate through your app manually** and the script will capture screenshots

## Method 2: Automated Navigation with ADB

### Automated Screen Navigation Script

This script automatically navigates through your app using ADB commands:

```python
#!/usr/bin/env python3
"""
Automated Flutter Screen Capture with ADB Navigation
"""

import subprocess
import time
import os

def adb(command):
    """Execute ADB command"""
    return subprocess.run(f"adb {command}", shell=True)

def tap(x, y):
    """Tap at coordinates"""
    adb(f"shell input tap {x} {y}")

def swipe(x1, y1, x2, y2, duration=300):
    """Swipe gesture"""
    adb(f"shell input swipe {x1} {y1} {x2} {y2} {duration}")

def back():
    """Press back button"""
    adb("shell input keyevent KEYCODE_BACK")

def home():
    """Press home button"""
    adb("shell input keyevent KEYCODE_HOME")

def capture(screen_name):
    """Capture screenshot"""
    timestamp = int(time.time())
    device_path = f"/sdcard/screenshot_{screen_name}_{timestamp}.png"
    local_path = f"screenshots/{screen_name}_{timestamp}.png"
    
    os.makedirs("screenshots", exist_ok=True)
    adb(f"shell screencap -p {device_path}")
    adb(f"pull {device_path} {local_path}")
    adb(f"shell rm {device_path}")
    print(f"Captured: {screen_name}")

def capture_all_screens():
    """Navigate and capture all screens"""
    
    # Launch your app (replace with your app package)
    app_package = "com.example.yourapp"
    adb(f"shell monkey -p {app_package} -c android.intent.category.LAUNCHER 1")
    time.sleep(3)
    
    # Example navigation - adjust coordinates for your app
    # Capture home screen
    capture("home")
    time.sleep(2)
    
    # Navigate to login
    tap(500, 800)  # Adjust coordinates
    time.sleep(2)
    capture("login")
    time.sleep(2)
    
    # Navigate to dashboard after login
    # (You'll need to input credentials programmatically)
    back()
    time.sleep(1)
    
    # Continue for all screens...
    
    print("All screens captured!")

if __name__ == "__main__":
    capture_all_screens()
```

## Method 3: Using Flutter Screenshot Package

### Installation

Add to `pubspec.yaml`:

```yaml
dependencies:
  screenshot: ^2.1.0
```

### Implementation

```dart
import 'package:screenshot/screenshot.dart';
import 'dart:io';
import 'package:path_provider/path_provider.dart';

class ScreenCaptureService {
  final ScreenshotController screenshotController = ScreenshotController();
  
  Future<void> captureAllScreens() async {
    // List of all your screen widgets
    final screens = [
      HomeScreen(),
      LoginScreen(),
      SignupScreen(),
      DashboardScreen(),
      // Add all your screens
    ];
    
    final Directory appDocDir = await getApplicationDocumentsDirectory();
    final String screenshotDir = '${appDocDir.path}/screenshots';
    await Directory(screenshotDir).create(recursive: true);
    
    for (int i = 0; i < screens.length; i++) {
      final screen = screens[i];
      final image = await screenshotController.captureFromWidget(
        screen,
        delay: const Duration(seconds: 1),
      );
      
      final file = File('$screenshotDir/screen_$i.png');
      await file.writeAsBytes(image);
      print('Captured: ${screen.runtimeType}');
    }
  }
}
```

### Usage in Your App

```dart
class MyApp extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    final captureService = ScreenCaptureService();
    
    return MaterialApp(
      home: Scaffold(
        body: Screenshot(
          controller: captureService.screenshotController,
          child: YourWidget(),
        ),
        floatingActionButton: FloatingActionButton(
          onPressed: () => captureService.captureAllScreens(),
          child: Icon(Icons.camera_alt),
        ),
      ),
    );
  }
}
```

## Method 4: Using Flutter Integration Tests

### Create Test File (`test_driver/capture_screens.dart`)

```dart
import 'package:flutter_driver/flutter_driver.dart';
import 'package:test/test.dart';

void main() {
  group('Screen Capture Test', () {
    FlutterDriver driver;
    
    setUpAll(() async {
      driver = await FlutterDriver.connect();
    });
    
    tearDownAll(() async {
      if (driver != null) {
        driver.close();
      }
    });
    
    Future<void> captureScreen(String name) async {
      final screenshot = await driver.screenshot();
      final file = File('screenshots/$name.png');
      await file.create(recursive: true);
      await file.writeAsBytes(screenshot);
      print('Captured: $name');
    }
    
    test('capture all screens', () async {
      // Navigate and capture home
      await captureScreen('home');
      
      // Navigate to login
      final loginButton = find.text('Login');
      await driver.tap(loginButton);
      await Future.delayed(Duration(seconds: 2));
      await captureScreen('login');
      
      // Continue for all screens...
    });
  });
}
```

### Run the Test

```bash
flutter drive --target=test_driver/capture_screens.dart
```

## Method 5: Using Flutter's Golden Tests

Golden tests can also capture screenshots for UI testing:

```dart
import 'package:flutter_test/flutter_test.dart';

void main() {
  testWidgets('Golden test - Home Screen', (WidgetTester tester) async {
    await tester.pumpWidget(MyApp());
    
    // Wait for animations
    await tester.pumpAndSettle();
    
    // Capture golden file
    await expectLater(
      find.byType(MyHomePage),
      matchesGoldenFile('screenshots/home_screen.png'),
    );
  });
}
```

## Complete Automated Solution

### Node.js Script (Similar to Your Web App)

```javascript
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

class FlutterScreenCapture {
  constructor(config) {
    this.screenshotDir = config.screenshotDir || 'screenshots';
    this.devicePath = config.devicePath || '/sdcard/screenshots';
    this.appPackage = config.appPackage; // e.g., 'com.example.app'
    this.screens = config.screens || [];
  }

  exec(command) {
    try {
      return execSync(command, { encoding: 'utf8' });
    } catch (error) {
      console.error(`Error: ${error.message}`);
      return null;
    }
  }

  setup() {
    // Create local directory
    if (!fs.existsSync(this.screenshotDir)) {
      fs.mkdirSync(this.screenshotDir, { recursive: true });
    }
    
    // Create device directory
    this.exec(`adb shell mkdir -p ${this.devicePath}`);
    this.exec(`adb shell rm -rf ${this.devicePath}/*`);
    
    console.log('✓ Directories created');
  }

  capture(screenName) {
    const timestamp = Date.now();
    const deviceFile = `${this.devicePath}/screenshot_${screenName}_${timestamp}.png`;
    const localFile = path.join(this.screenshotDir, `${screenName}_${timestamp}.png`);
    
    // Take screenshot
    this.exec(`adb shell screencap -p ${deviceFile}`);
    
    // Pull to local
    this.exec(`adb pull ${deviceFile} ${localFile}`);
    
    // Clean up device
    this.exec(`adb shell rm ${deviceFile}`);
    
    console.log(`✓ Captured: ${screenName} -> ${localFile}`);
    return localFile;
  }

  launchApp() {
    console.log('Launching app...');
    this.exec(`adb shell monkey -p ${this.appPackage} -c android.intent.category.LAUNCHER 1`);
    return new Promise(resolve => setTimeout(resolve, 3000));
  }

  async captureAll() {
    console.log('Flutter Android Screen Capture');
    console.log('='.repeat(40));
    
    // Check device connection
    const devices = this.exec('adb devices');
    if (!devices || !devices.includes('device')) {
      console.error('❌ No Android device connected!');
      return;
    }
    
    this.setup();
    
    if (this.appPackage) {
      await this.launchApp();
    }
    
    console.log('\nManual Capture Mode:');
    console.log('Navigate to each screen and press Enter\n');
    
    for (const screen of this.screens) {
      await new Promise(resolve => {
        const readline = require('readline').createInterface({
          input: process.stdin,
          output: process.stdout
        });
        readline.question(`Navigate to '${screen}' and press Enter...`, () => {
          readline.close();
          resolve();
        });
      });
      
      this.capture(screen);
    }
    
    console.log(`\n✓ All ${this.screens.length} screens captured!`);
  }
}

// Usage
const capturer = new FlutterScreenCapture({
  appPackage: 'com.example.yourapp',
  screens: [
    'home',
    'login',
    'signup',
    'dashboard',
    'profile',
    'settings'
  ]
});

capturer.captureAll();
```

## Best Practices

### 1. Organize Screenshots by Feature

```bash
screenshots/
  ├── auth/
  │   ├── login.png
  │   └── signup.png
  ├── dashboard/
  │   ├── home.png
  │   └── appointments.png
  └── profile/
      └── settings.png
```

### 2. Use Consistent Naming

```bash
# Good naming convention
{feature}_{screen}_{timestamp}.png
# Example: auth_login_20240115_143022.png
```

### 3. Add Metadata

Create a `screenshots.json` file:

```json
{
  "screenshots": [
    {
      "name": "login",
      "path": "screenshots/auth_login.png",
      "timestamp": "2024-01-15T14:30:22Z",
      "device": "Pixel 5",
      "resolution": "1080x2340"
    }
  ]
}
```

### 4. Generate PDF Report (Similar to Web App)

Use a library like `pdf-lib` or `jspdf` to create a PDF from all screenshots:

```javascript
const PDFDocument = require('pdfkit');
const fs = require('fs');

function createPDFReport(screenshots) {
  const doc = new PDFDocument();
  doc.pipe(fs.createWriteStream('flutter-screens-report.pdf'));
  
  screenshots.forEach((screenshot, index) => {
    if (index > 0) doc.addPage();
    doc.text(screenshot.name, { align: 'center' });
    doc.image(screenshot.path, {
      fit: [500, 700],
      align: 'center',
      valign: 'center'
    });
  });
  
  doc.end();
}
```

## Troubleshooting

### Device Not Found

```bash
# List devices
adb devices

# If device shows as "unauthorized", accept USB debugging on device
# Or restart ADB server
adb kill-server
adb start-server
```

### Permission Denied

```bash
# Grant storage permissions
adb shell pm grant com.example.app android.permission.WRITE_EXTERNAL_STORAGE
adb shell pm grant com.example.app android.permission.READ_EXTERNAL_STORAGE
```

### Low-Quality Screenshots

Use higher DPI settings:

```bash
adb shell wm density 420  # Higher DPI
adb shell screencap -p /sdcard/screenshot.png
adb shell wm density reset  # Reset DPI
```

## Quick Reference

### Essential ADB Commands

```bash
# List devices
adb devices

# Take screenshot
adb shell screencap -p /sdcard/screen.png
adb pull /sdcard/screen.png .

# Record screen (video)
adb shell screenrecord /sdcard/video.mp4

# Tap at coordinates
adb shell input tap X Y

# Swipe
adb shell input swipe X1 Y1 X2 Y2

# Press back button
adb shell input keyevent KEYCODE_BACK

# Launch app
adb shell monkey -p com.package.name -c android.intent.category.LAUNCHER 1
```

## Conclusion

Choose the method that best fits your needs:
- **ADB Scripts**: Best for complete control and automation
- **Flutter Screenshot Package**: Best for programmatic capture within the app
- **Integration Tests**: Best for automated testing and capture
- **Manual ADB**: Quick and simple for one-off captures

For a complete solution similar to your web app's capture script, use the Node.js or Python automated scripts that combine ADB commands with navigation logic.
