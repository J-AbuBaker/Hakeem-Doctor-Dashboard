# Flutter Screen Capture Scripts

This directory contains scripts to capture all screens of your Flutter Android application, similar to the web app's `capture-all-pages.js`.

## Quick Start

### Prerequisites

1. **Android SDK Platform Tools** (includes ADB)
   - Download from: https://developer.android.com/studio/releases/platform-tools
   - Add to PATH: `%LOCALAPPDATA%\Android\Sdk\platform-tools\` (Windows)

2. **Connected Android Device or Emulator**
   - Physical device: Enable USB debugging in Developer Options
   - Emulator: Should work automatically

3. **Python 3** (for Python script only)
   - Download from: https://www.python.org/downloads/

### Verify Setup

```bash
# Check ADB
adb version

# List connected devices
adb devices
```

### Usage

#### Option 1: Python Script (Recommended)

```bash
# Make executable (Mac/Linux)
chmod +x capture-all-screens.py

# Run the script
python capture-all-screens.py

# Or with custom app package
python capture-all-screens.py com.your.app.package
```

#### Option 2: Bash Script (Mac/Linux)

```bash
# Make executable
chmod +x capture-all-screens.sh

# Run the script
./capture-all-screens.sh

# Or with custom app package
./capture-all-screens.sh com.your.app.package
```

#### Option 3: Batch Script (Windows)

```batch
REM Run the script
capture-all-screens.bat
```

## Customization

### Edit Screen List

Open the script file and modify the `screens` list:

**Python (`capture-all-screens.py`):**
```python
'screens': [
    'home',
    'login',
    'signup',
    'dashboard',
    'profile',
    # Add your screens here
],
```

**Bash/Windows:**
```bash
SCREENS=(
    "home"
    "login"
    "signup"
    # Add your screens here
)
```

### Change App Package

**Python:**
```python
'app_package': 'com.your.app.package'
```

**Command line:**
```bash
python capture-all-screens.py com.your.app.package
```

## How It Works

1. **Checks device connection** - Verifies Android device/emulator is connected
2. **Creates directories** - Sets up local and device directories for screenshots
3. **Launches app** (optional) - Opens your Flutter app if package is provided
4. **Manual capture mode** - Prompts you to navigate to each screen
5. **Captures screenshots** - Takes screenshot and pulls to local machine
6. **Saves metadata** - Creates JSON file with capture information

## Output Structure

```
screenshots/
  ├── home_20240115_143022.png
  ├── login_20240115_143045.png
  ├── signup_20240115_143108.png
  ├── dashboard_20240115_143130.png
  ├── profile_20240115_143152.png
  └── screenshots.json (metadata)
```

## Troubleshooting

### "No Android device connected"

- Connect a physical device via USB
- Or start an Android emulator
- Run `adb devices` to verify connection

### "ADB not found"

- Install Android SDK Platform Tools
- Add to PATH: `%LOCALAPPDATA%\Android\Sdk\platform-tools\`
- Restart terminal/command prompt

### "Permission denied"

- On physical device: Accept USB debugging prompt
- Grant storage permissions:
  ```bash
  adb shell pm grant com.your.app android.permission.WRITE_EXTERNAL_STORAGE
  ```

### Low-quality screenshots

Increase device DPI temporarily:
```bash
adb shell wm density 420
# Take screenshots
adb shell wm density reset
```

## Advanced: Automated Navigation

For automated screen navigation, see `FLUTTER_SCREEN_CAPTURE_GUIDE.md` in the root directory for examples using:
- ADB input commands (tap, swipe)
- Flutter integration tests
- Screenshot packages

## See Also

- [FLUTTER_SCREEN_CAPTURE_GUIDE.md](../FLUTTER_SCREEN_CAPTURE_GUIDE.md) - Comprehensive guide with all methods
- [scripts/capture-all-pages.js](../scripts/capture-all-pages.js) - Web app equivalent script
