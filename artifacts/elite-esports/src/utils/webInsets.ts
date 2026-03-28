import { Platform } from 'react-native';

export const isInIframe = Platform.OS === 'web' && (() => {
  if (typeof window === 'undefined') return false;
  try { return window.self !== window.top; } catch { return true; }
})();

export const WEB_TOP_INSET = isInIframe ? 67 : 0;
export const WEB_BOTTOM_INSET = isInIframe ? 34 : 0;
