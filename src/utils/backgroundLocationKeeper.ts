/**
 * Utilities to keep GPS tracking active in the browser when the screen is locked / off
 * or the user switches tabs:
 * 1. Screen Wake Lock API (keeps display active when trip is on).
 * 2. Silent Web Audio oscillator loop (prevents mobile browser process throttling/suspension when screen turns off).
 * 3. Service Worker message keep-alive heartbeat.
 */

class BackgroundLocationKeeper {
  private wakeLock: any = null;
  private audioCtx: AudioContext | null = null;
  private oscillator: OscillatorNode | null = null;
  private gainNode: GainNode | null = null;
  private isKeepingAlive: boolean = false;
  private heartbeatInterval: number | null = null;

  /**
   * Request Screen WakeLock so mobile doesn't sleep prematurely while on dashboard
   */
  public async requestWakeLock(): Promise<boolean> {
    try {
      if ('wakeLock' in navigator && (navigator as any).wakeLock) {
        this.wakeLock = await (navigator as any).wakeLock.request('screen');
        this.wakeLock.addEventListener('release', () => {
          this.wakeLock = null;
        });
        return true;
      }
    } catch {
      // Wake Lock may be rejected if tab is backgrounded or battery saver is enabled
    }
    return false;
  }

  /**
   * Release Screen Wake Lock
   */
  public releaseWakeLock() {
    if (this.wakeLock) {
      try {
        this.wakeLock.release();
      } catch {
        // Ignore error
      }
      this.wakeLock = null;
    }
  }

  /**
   * Starts a completely inaudible (gain 0.0001, frequency 20Hz) audio cycle.
   * Browsers (Chrome, Safari, Firefox on Android & iOS) will NOT suspend
   * the JavaScript context or GPS geolocation while media is playing in the background.
   */
  public startKeepAlive() {
    if (this.isKeepingAlive) return;
    this.isKeepingAlive = true;

    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        this.audioCtx = new AudioContextClass();

        // Create an oscillator producing a 20Hz sub-audible tone
        this.oscillator = this.audioCtx.createOscillator();
        this.oscillator.type = 'sine';
        this.oscillator.frequency.setValueAtTime(20, this.audioCtx.currentTime);

        // Near-zero gain so it is completely silent to human ears
        this.gainNode = this.audioCtx.createGain();
        this.gainNode.gain.setValueAtTime(0.00001, this.audioCtx.currentTime);

        this.oscillator.connect(this.gainNode);
        this.gainNode.connect(this.audioCtx.destination);

        this.oscillator.start();

        if (this.audioCtx.state === 'suspended') {
          this.audioCtx.resume();
        }
      }
    } catch {
      // Fallback silently if audio context is blocked
    }

    // Ping Service Worker if available
    this.startServiceWorkerHeartbeat();

    // Also acquire wake lock
    this.requestWakeLock();
  }

  /**
   * Sends periodic heartbeats to the service worker to prevent worker idle timeout
   */
  private startServiceWorkerHeartbeat() {
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      this.heartbeatInterval = window.setInterval(() => {
        try {
          navigator.serviceWorker.controller?.postMessage({
            type: 'KEEP_ALIVE_GPS',
            timestamp: Date.now(),
          });
        } catch {
          // Ignore
        }
      }, 10000);
    }
  }

  /**
   * Stops the keep alive audio and releases wake lock when trip ends
   */
  public stopKeepAlive() {
    this.isKeepingAlive = false;

    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }

    if (this.oscillator) {
      try {
        this.oscillator.stop();
        this.oscillator.disconnect();
      } catch {
        // Ignore
      }
      this.oscillator = null;
    }

    if (this.gainNode) {
      try {
        this.gainNode.disconnect();
      } catch {
        // Ignore
      }
      this.gainNode = null;
    }

    if (this.audioCtx) {
      try {
        this.audioCtx.close();
      } catch {
        // Ignore
      }
      this.audioCtx = null;
    }

    this.releaseWakeLock();
  }

  /**
   * Check if currently active
   */
  public isActive(): boolean {
    return this.isKeepingAlive;
  }
}

export const backgroundLocationKeeper = new BackgroundLocationKeeper();
