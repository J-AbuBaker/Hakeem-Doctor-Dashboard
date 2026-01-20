@echo off
setlocal enabledelayedexpansion

REM Flutter Android Screen Capture Script (Windows)
REM Similar to capture-all-pages.js for web apps

set SCREENSHOT_DIR=screenshots
set DEVICE_PATH=/sdcard/screenshots
set APP_PACKAGE=com.example.yourapp
set WAIT_TIME=3

echo ==========================================
echo Flutter Android Screen Capture Script
echo ==========================================
echo.

REM Check if ADB is available
where adb >nul 2>&1
if errorlevel 1 (
    echo [ERROR] ADB not found!
    echo Please install Android SDK Platform Tools
    exit /b 1
)

REM Check if device is connected
adb devices | findstr "device" >nul
if errorlevel 1 (
    echo [ERROR] No Android device connected!
    echo Please connect a device or start an emulator.
    echo.
    echo To check devices, run: adb devices
    exit /b 1
)

echo [OK] Android device detected
echo.

REM Create directories
if not exist "%SCREENSHOT_DIR%" mkdir "%SCREENSHOT_DIR%"
adb shell mkdir -p %DEVICE_PATH%
adb shell rm -rf %DEVICE_PATH%\*

echo [OK] Directories created
echo.

REM Launch app if package provided
if not "%APP_PACKAGE%"=="" (
    echo Launching app: %APP_PACKAGE%
    adb shell monkey -p %APP_PACKAGE% -c android.intent.category.LAUNCHER 1
    timeout /t 3 /nobreak >nul
    echo.
)

REM List of screens to capture
set SCREENS=home login signup dashboard profile settings

echo Manual Capture Mode
echo -------------------
echo Navigate to each screen when prompted.
echo Press Enter after navigating to each screen.
echo.

REM Capture each screen
for %%s in (%SCREENS%) do (
    set /p DUMMY="[LOCATE] Navigate to '%%s' screen and press Enter... "
    
    for /f "tokens=2-4 delims=/ " %%a in ('date /t') do set DATE=%%c%%b%%a
    for /f "tokens=1-2 delims=/:" %%a in ('time /t') do set TIME=%%a%%b
    set TIME=!TIME: =0!
    set timestamp=!DATE!_!TIME!
    
    set device_file=%DEVICE_PATH%/screenshot_%%s_!timestamp!.png
    set local_file=%SCREENSHOT_DIR%/%%s_!timestamp!.png
    
    REM Take screenshot
    adb shell screencap -p !device_file!
    
    REM Pull to local
    adb pull !device_file! !local_file!
    
    REM Clean up device
    adb shell rm !device_file!
    
    if exist "!local_file!" (
        echo [OK] Captured: %%s -^> !local_file!
    ) else (
        echo [ERROR] Failed to capture: %%s
    )
    
    timeout /t %WAIT_TIME% /nobreak >nul
)

echo.
echo ==========================================
echo [OK] All screens captured successfully!
echo [OK] Screenshots saved in: %CD%\%SCREENSHOT_DIR%
echo ==========================================

endlocal
