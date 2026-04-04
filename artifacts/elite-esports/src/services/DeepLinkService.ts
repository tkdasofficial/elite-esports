import * as Linking from 'expo-linking';
import { router } from 'expo-router';

export type AuthUrlParams = {
  code?: string;
  type?: string;
  access_token?: string;
  refresh_token?: string;
  error?: string;
  error_description?: string;
};

export type LinkValidation =
  | { status: 'valid'; params: AuthUrlParams }
  | { status: 'missing_code' }
  | { status: 'invalid_url' }
  | { status: 'error'; message: string };

type UrlListener = (url: string) => void;

const AUTH_CALLBACK_PATH = 'auth/callback';

function parseUrl(url: string): Record<string, string> {
  const result: Record<string, string> = {};
  const qIdx = url.indexOf('?');
  const hIdx = url.indexOf('#');

  const extractPairs = (segment: string) => {
    segment.split('&').forEach(pair => {
      const eq = pair.indexOf('=');
      if (eq !== -1) {
        const k = decodeURIComponent(pair.slice(0, eq).trim());
        const v = decodeURIComponent(pair.slice(eq + 1).trim());
        if (k && !result[k]) result[k] = v;
      }
    });
  };

  if (qIdx !== -1) {
    const end = hIdx > qIdx ? hIdx : url.length;
    extractPairs(url.slice(qIdx + 1, end));
  }
  if (hIdx !== -1) {
    extractPairs(url.slice(hIdx + 1));
  }
  return result;
}

class DeepLinkService {
  private static instance: DeepLinkService | null = null;

  private listeners: Set<UrlListener> = new Set();
  private bufferedUrl: string | null = null;
  private linkingSubscription: { remove: () => void } | null = null;
  private initialized = false;

  static getInstance(): DeepLinkService {
    if (!DeepLinkService.instance) {
      DeepLinkService.instance = new DeepLinkService();
    }
    return DeepLinkService.instance;
  }

  isAuthCallbackUrl(url: string): boolean {
    return url.includes(AUTH_CALLBACK_PATH);
  }

  validateLink(url: string): LinkValidation {
    if (!url || !this.isAuthCallbackUrl(url)) {
      return { status: 'invalid_url' };
    }

    const params = parseUrl(url);

    if (params.error) {
      return { status: 'error', message: params.error_description ?? params.error };
    }

    const hasCode = !!params.code;
    const hasImplicitTokens = !!(params.access_token && params.refresh_token);

    if (!hasCode && !hasImplicitTokens) {
      return { status: 'missing_code' };
    }

    return { status: 'valid', params };
  }

  parseAuthParams(url: string): AuthUrlParams {
    return parseUrl(url) as AuthUrlParams;
  }

  consumeBufferedUrl(): string | null {
    const url = this.bufferedUrl;
    this.bufferedUrl = null;
    return url;
  }

  subscribe(listener: UrlListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private handleIncomingUrl(url: string) {
    if (!this.isAuthCallbackUrl(url)) return;

    this.bufferedUrl = url;
    this.listeners.forEach(fn => fn(url));

    router.replace({
      pathname: '/auth/callback',
      params: this.parseAuthParams(url),
    });
  }

  init() {
    if (this.initialized) return;
    this.initialized = true;

    this.linkingSubscription = Linking.addEventListener('url', ({ url }) => {
      this.handleIncomingUrl(url);
    });
  }

  destroy() {
    this.linkingSubscription?.remove();
    this.linkingSubscription = null;
    this.listeners.clear();
    this.initialized = false;
  }
}

export const deepLinkService = DeepLinkService.getInstance();
