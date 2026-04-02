/**
 * Elite eSports Analytics SDK v1.0.0
 *
 * Sends telemetry data to the admin dashboard via Supabase Edge Function.
 *
 * Usage:
 *   import EliteAnalytics from './elite-analytics-sdk';
 *
 *   const analytics = new EliteAnalytics({
 *     supabaseUrl: 'https://your-project.supabase.co',
 *     supabaseAnonKey: 'your-anon-key',
 *     appVersion: '1.0.0',
 *     platform: 'android',
 *   });
 *   analytics.init();
 *
 *   analytics.track('screen_view', { screen: 'HomeScreen' });
 *   analytics.track('match_join', { matchId: '...' });
 *   analytics.setUserId('user-uuid');
 */

export interface EliteAnalyticsConfig {
  supabaseUrl: string;
  supabaseAnonKey: string;
  platform: 'android' | 'ios' | 'web';
  appVersion?: string;
  userId?: string;
  flushIntervalMs?: number;
  maxBatchSize?: number;
}

interface AnalyticsEvent {
  event_type: string;
  session_id: string;
  user_id: string | null;
  platform: string;
  app_version: string;
  device_info: Record<string, unknown>;
  payload: Record<string, unknown>;
}

class EliteAnalytics {
  private supabaseUrl: string;
  private supabaseAnonKey: string;
  private appVersion: string;
  private platform: string;
  private userId: string | null;
  private sessionId: string;
  private queue: AnalyticsEvent[];
  private flushInterval: number;
  private maxBatchSize: number;
  private deviceInfo: Record<string, unknown>;
  private _timer: ReturnType<typeof setInterval> | null;
  private _initialized: boolean;
  private _startTime: number;

  constructor(config: EliteAnalyticsConfig) {
    this.supabaseUrl = config.supabaseUrl;
    this.supabaseAnonKey = config.supabaseAnonKey;
    this.appVersion = config.appVersion || '1.0.0';
    this.platform = config.platform || 'android';
    this.userId = config.userId || null;
    this.sessionId = this._generateSessionId();
    this.queue = [];
    this.flushInterval = config.flushIntervalMs || 10000;
    this.maxBatchSize = config.maxBatchSize || 25;
    this.deviceInfo = this._getDeviceInfo();
    this._timer = null;
    this._initialized = false;
    this._startTime = Date.now();
  }

  init(): this {
    if (this._initialized) return this;
    this._initialized = true;

    this.track('app_open', { timestamp: new Date().toISOString() });

    this._timer = setInterval(() => this.flush(), this.flushInterval);

    if (typeof window !== 'undefined') {
      window.addEventListener('error', (e: ErrorEvent) => {
        this.track('error', {
          message: e.message,
          filename: e.filename,
          lineno: e.lineno,
          colno: e.colno,
        });
      });

      window.addEventListener('unhandledrejection', (e: PromiseRejectionEvent) => {
        this.track('error', {
          message: (e.reason as Error)?.message || String(e.reason),
          type: 'unhandled_promise',
        });
      });

      window.addEventListener('beforeunload', () => {
        this.track('app_close', { timestamp: new Date().toISOString() });
        this.flush(true);
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

    setInterval(() => {
      this.track('heartbeat', { uptime_ms: Date.now() - this._startTime });
    }, 60000);

    this._startTime = Date.now();
    return this;
  }

  setUserId(userId: string): void {
    this.userId = userId;
  }

  track(eventType: string, payload: Record<string, unknown> = {}): void {
    this.queue.push({
      event_type: eventType,
      session_id: this.sessionId,
      user_id: this.userId,
      platform: this.platform,
      app_version: this.appVersion,
      device_info: this.deviceInfo,
      payload,
    });

    if (this.queue.length >= this.maxBatchSize) {
      this.flush();
    }
  }

  async flush(sync = false): Promise<void> {
    if (this.queue.length === 0) return;

    const events = this.queue.splice(0, this.maxBatchSize);
    const url = `${this.supabaseUrl}/functions/v1/app-analytics`;
    const body = JSON.stringify({ action: 'ingest', events });

    const options: RequestInit = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: this.supabaseAnonKey,
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
      this.queue.unshift(...events);
      console.warn('[EliteAnalytics] Flush failed:', (err as Error).message);
    }
  }

  destroy(): void {
    if (this._timer) clearInterval(this._timer);
    this.flush(true);
    this._initialized = false;
  }

  private _generateSessionId(): string {
    return 'sess_' + Date.now().toString(36) + '_' + Math.random().toString(36).substr(2, 8);
  }

  private _getDeviceInfo(): Record<string, unknown> {
    if (typeof window === 'undefined') return { runtime: 'react-native' };
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

export default EliteAnalytics;
