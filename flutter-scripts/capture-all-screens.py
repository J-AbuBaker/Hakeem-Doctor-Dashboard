#!/usr/bin/env python3
"""
Flutter Android Screen Capture Script
Captures screenshots while navigating through the app
Similar to the web capture-all-pages.js script
"""

import subprocess
import os
import time
import json
from datetime import datetime
from pathlib import Path

class FlutterScreenCapture:
    def __init__(self, config=None):
        self.config = config or {}
        self.screenshot_dir = self.config.get('screenshot_dir', 'screenshots')
        self.device_path = self.config.get('device_path', '/sdcard/screenshots')
        self.app_package = self.config.get('app_package', '')
        self.screens = self.config.get('screens', [])
        self.wait_time = self.config.get('wait_time', 2)
        
    def run_adb_command(self, command):
        """Execute ADB command"""
        try:
            result = subprocess.run(
                f"adb {command}",
                shell=True,
                capture_output=True,
                text=True,
                check=False
            )
            return result.returncode == 0, result.stdout, result.stderr
        except Exception as e:
            return False, "", str(e)
    
    def check_device_connected(self):
        """Check if Android device is connected"""
        success, output, _ = self.run_adb_command("devices")
        if not success:
            return False
        return "device" in output.lower() and "List of devices" not in output
    
    def setup_directories(self):
        """Create necessary directories"""
        Path(self.screenshot_dir).mkdir(parents=True, exist_ok=True)
        self.run_adb_command(f"shell mkdir -p {self.device_path}")
        self.run_adb_command(f"shell rm -rf {self.device_path}/*")
        print("✓ Directories created")
    
    def capture_screenshot(self, screen_name):
        """Capture a screenshot and pull it to local machine"""
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        device_file = f"{self.device_path}/screenshot_{screen_name}_{timestamp}.png"
        local_file = os.path.join(self.screenshot_dir, f"{screen_name}_{timestamp}.png")
        
        # Take screenshot on device
        success, _, _ = self.run_adb_command(f"shell screencap -p {device_file}")
        if not success:
            print(f"✗ Failed to capture {screen_name}")
            return None
        
        # Pull screenshot to local machine
        success, _, _ = self.run_adb_command(f"pull {device_file} {local_file}")
        if success:
            # Clean up device file
            self.run_adb_command(f"shell rm {device_file}")
            
            file_size = os.path.getsize(local_file)
            print(f"✓ Captured: {screen_name} -> {local_file} ({file_size} bytes)")
            return local_file
        else:
            print(f"✗ Failed to pull {screen_name}")
            return None
    
    def launch_app(self):
        """Launch the Flutter app"""
        if not self.app_package:
            return False
        
        print(f"Launching app: {self.app_package}")
        success, _, _ = self.run_adb_command(
            f"shell monkey -p {self.app_package} -c android.intent.category.LAUNCHER 1"
        )
        if success:
            time.sleep(3)  # Wait for app to launch
            return True
        return False
    
    def capture_all_screens(self, manual_mode=True):
        """Main function to capture all screens"""
        print("=" * 60)
        print("Flutter Android Screen Capture")
        print("=" * 60)
        print()
        
        # Check if device is connected
        if not self.check_device_connected():
            print("❌ Error: No Android device connected!")
            print("Please connect a device or start an emulator.")
            print("\nTo check devices, run: adb devices")
            return False
        
        print("✓ Android device detected")
        print()
        
        self.setup_directories()
        
        # Launch app if package provided
        if self.app_package:
            self.launch_app()
        
        captured_screens = []
        
        if manual_mode:
            print("Manual Capture Mode")
            print("-" * 60)
            print("Navigate to each screen when prompted.")
            print("Press Enter after navigating to each screen.")
            print()
            
            for screen in self.screens:
                input(f"📍 Navigate to '{screen}' screen and press Enter...")
                file_path = self.capture_screenshot(screen)
                if file_path:
                    captured_screens.append({
                        'name': screen,
                        'path': file_path,
                        'timestamp': datetime.now().isoformat()
                    })
                time.sleep(self.wait_time)
        else:
            print("Automated Capture Mode")
            print("-" * 60)
            print("Capturing screens automatically...")
            print("(This requires screen navigation setup)")
            
            for screen in self.screens:
                file_path = self.capture_screenshot(screen)
                if file_path:
                    captured_screens.append({
                        'name': screen,
                        'path': file_path,
                        'timestamp': datetime.now().isoformat()
                    })
                time.sleep(self.wait_time)
        
        # Save metadata
        metadata_file = os.path.join(self.screenshot_dir, 'screenshots.json')
        with open(metadata_file, 'w') as f:
            json.dump({
                'captured_at': datetime.now().isoformat(),
                'total_screens': len(captured_screens),
                'screenshots': captured_screens
            }, f, indent=2)
        
        print()
        print("=" * 60)
        print(f"✓ Successfully captured {len(captured_screens)} screens")
        print(f"✓ Screenshots saved in: {os.path.abspath(self.screenshot_dir)}")
        print(f"✓ Metadata saved in: {metadata_file}")
        print("=" * 60)
        
        return True


def main():
    """Main entry point"""
    import sys
    
    # Default configuration - customize for your app
    config = {
        'app_package': 'com.example.yourapp',  # Change to your app package
        'screens': [
            'home',
            'login',
            'signup',
            'dashboard',
            'profile',
            'settings',
            # Add all your screen names here
        ],
        'wait_time': 2,
        'screenshot_dir': 'screenshots',
        'device_path': '/sdcard/screenshots'
    }
    
    # Allow package override via command line
    if len(sys.argv) > 1:
        config['app_package'] = sys.argv[1]
    
    capturer = FlutterScreenCapture(config)
    capturer.capture_all_screens(manual_mode=True)


if __name__ == "__main__":
    main()
