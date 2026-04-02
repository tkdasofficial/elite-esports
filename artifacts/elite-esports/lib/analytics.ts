import { Platform } from 'react-native';
import EliteAnalytics from './elite-analytics-sdk';
import { SUPABASE_CONFIG } from '../src/config/supabase.config';

const analytics = new EliteAnalytics({
  supabaseUrl: SUPABASE_CONFIG.url,
  supabaseAnonKey: SUPABASE_CONFIG.anonKey,
  platform: Platform.OS as 'android' | 'ios' | 'web',
  appVersion: '1.0.0',
});

analytics.init();

export default analytics;
