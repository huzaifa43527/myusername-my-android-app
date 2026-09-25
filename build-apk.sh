#!/bin/sh

# Setup Java and Android environment
export ANDROID_HOME=${ANDROID_HOME:-/usr/local/lib/android/sdk}
export PATH=$ANDROID_HOME/cmdline-tools/latest/bin:$ANDROID_HOME/platform-tools:$PATH

echo "Using ANDROID_HOME: $ANDROID_HOME"
echo "Java Version:"
java -version

echo "Building SmartTrip Debug APK..."
gradle :app:assembleDebug --stacktrace --no-daemon
