#!/bin/sh
set -e

# Setup Java and Android environment
export ANDROID_HOME=${ANDROID_HOME:-/usr/local/lib/android/sdk}
export PATH=$ANDROID_HOME/cmdline-tools/latest/bin:$ANDROID_HOME/platform-tools:$PATH

echo "Using ANDROID_HOME: $ANDROID_HOME"
if command -v java >/dev/null 2>&1; then
  echo "Java Version:"
  java -version
fi

echo "Building SmartTrip Release and Debug APKs..."
gradle :app:assembleRelease :app:assembleDebug --stacktrace --no-daemon

echo "Build complete! Generated APKs:"
find app/build/outputs/apk -name "*.apk" -ls

