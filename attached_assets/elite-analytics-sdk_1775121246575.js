/**
 * Elite eSports Analytics SDK v1.0.0
 * 
 * Embed this in your mobile app to send telemetry data to the admin dashboard.
 * 
 * Usage:
 *   import EliteAnalytics from './elite-analytics-sdk.js';
 * 
 *   const analytics = new EliteAnalytics({
 *     supabaseUrl: 'https://your-project.supabase.co',
 *     supabaseAnonKey: 'your-anon-key',
 *     appVersion: '1.0.0',
 *     platform: 'android', // or 'ios', 'web'
 *   });
 * 
 *   // Auto-tracks app_open, app_close, errors
 *   analytics.init();
 * 
 *   // Manual tracking
 *   analytics.track('screen_view', { screen: 'HomeScreen' });
 *   analytics.track('match_join', { matchId: '...' });
 *   analytics.setUserId('user-uuid');
 */

class EliteAnalytics {
  constructor(config) {
    this.supabaseUrl = config.supabaseUrl;
    this.supabaseAnonKey = config.supabaseAnonKey;
    this.appVersion = config.appVersion || '1.0.0';
    this.platform = config.platform || 'android';
    this.userId = config.userId || null;
    this.sessionId = this._generateSessionId();
    this.queue = [];
    this.flushInterval = config.flushIntervalMs || 10000; // 10s
    this.maxBatchSize = config.maxBatchSize || 25;
    this.deviceInfo = this._getDeviceInfo();
    this._timer = null;
    this._initialized = false;
  }

  init() {
    if (this._initialized) return;
    this._initialized = true;

    // Track app open
    this.track('app_open', { timestamp: new Date().toISOString() });

    // Auto flush on interval
    this._timer = setInterval(() => this.flush(), this.flushInterval);

    // Track errors
    if (typeof window !== 'undefined') {
      window.addEventListener('error', (e) => {
        this.track('error', {
          message: e.message,
          filename: e.filename,
          lineno: e.lineno,
          colno: e.colno,
        });
      });

      window.addEventListener('unhandledrejection', (e) => {
        this.track('error', {
          message: e.reason?.message || String(e.reason),
          type: 'unhandled_promise',
        });
      });

      // Track app close / background
      window.addEventListener('beforeunload', () => {
        this.track('app_close', { timestamp: new Date().toISOString() });
        this.flush(true); // sync flush
      });

      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') {
          this.track('app_background', { timestamp: new Date().toISOString() });
          this.flush(true);
        } else {
          this.track('app_foreground', { timestamp: new Date().toISOString() });
        }
      });
    }

    // Heartbeat every 60s
    setInterval(() => {
      this.track('heartbeat', { uptime_ms: Date.now() - this._startTime });
    }, 60000);

    this._startTime = Date.now();
    return this;
  }

  setUserId(userId) {
    this.userId = userId;
  }

  track(eventType, payload = {}) {
    this.queue.push({
      event_type: eventType,
      session_id: this.sessionId,
      user_id: this.userId,
      platform: this.platform,
      app_version: this.appVersion,
      device_info: this.deviceInfo,
      payload: payload,
    });

    if (this.queue.length >= this.maxBatchSize) {
      this.flush();
    }
  }

  async flush(sync = false) {
    if (this.queue.length === 0) return;

    const events = this.queue.splice(0, this.maxBatchSize);
    const url = `${this.supabaseUrl}/functions/v1/app-analytics`;
    const body = JSON.stringify({ action: 'ingest', events });

    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': this.supabaseAnonKey,
      },
      body,
    };

    if (sync && typeof navigator !== 'undefined' && navigator.sendBeacon) {
      const blob = new Blob([body], { type: 'application/json' });
      navigator.sendBeacon(url, blob);
      return;
    }

    try {
      await fetch(url, options);
    } catch (err) {
      // Re-queue on failure
      this.queue.unshift(...events);
      console.warn('[EliteAnalytics] Flush failed:', err.message);
    }
  }

  destroy() {
    if (this._timer) clearInterval(this._timer);
    this.flush(true);
    this._initialized = false;
  }

  _generateSessionId() {
    return 'sess_' + Date.now().toString(36) + '_' + Math.random().toString(36).substr(2, 8);
  }

  _getDeviceInfo() {
    if (typeof window === 'undefined') return { runtime: 'node' };
    const ua = navigator.userAgent || '';
    return {
      userAgent: ua,
      language: navigator.language,
      screenWidth: screen?.width,
      screenHeight: screen?.height,
      timezone: Intl?.DateTimeFormat()?.resolvedOptions()?.timeZone,
    };
  }
}

// Support both ES module and script tag
if (typeof module !== 'undefined' && module.exports) {
  module.exports = EliteAnalytics;
}
if (typeof window !== 'undefined') {
  window.EliteAnalytics = EliteAnalytics;
}
