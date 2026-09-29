# SmartTrip - Android APK & Web App

Modern navigation, real-time trip tracking, fuel logging, and vehicle maintenance management.

## 📱 How to Get and Release the Android APK

### Option 1: Automatic GitHub Actions Release (Recommended)
This repository includes a pre-configured automated CI/CD pipeline in [`.github/workflows/build-apk.yml`](.github/workflows/build-apk.yml).

1. Push your code to your GitHub repository `main` branch, or navigate to **GitHub Actions** > **Build and Release Android APK**.
2. Click **Run workflow** (`workflow_dispatch`).
3. The runner automatically sets up Java 17 and Gradle 9.3.1, builds both release and debug APKs, and publishes them under **Releases**:
   - `SmartTrip-v1.0.0-release.apk`
   - `SmartTrip-v1.0.0-debug.apk`
4. Download the `.apk` file directly to your Android device and install it.

---

### Option 2: Build Locally with Gradle
If you have the Android SDK and Java 17 installed locally on your development machine:

```bash
# Make build script executable and run
chmod +x build-apk.sh
./build-apk.sh

# Or run Gradle directly:
gradle :app:assembleRelease
```

Generated APKs will be located at:
- **Release APK**: `app/build/outputs/apk/release/app-release.apk`
- **Debug APK**: `app/build/outputs/apk/debug/app-debug.apk`

---

### Option 3: Instant Progressive Web App (PWA) Install
SmartTrip is fully offline-capable and PWA-ready:
1. Open the app in **Google Chrome** or **Samsung Internet** on your Android device:
   `https://ais-pre-w7f5pphrqgapsh26fdzu7s-214665352347.asia-southeast1.run.app`
2. Tap the browser menu (`⋮`) and select **"Install app"** or **"Add to Home screen"**.
3. The app installs as a standalone Android application with background GPS support and full offline storage via IndexedDB.
