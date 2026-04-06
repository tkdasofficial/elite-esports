import React, {
  createContext, useContext, useEffect, useRef,
  useState, useCallback, useMemo, ReactNode,
} from 'react';
import { Alert, Platform } from 'react-native';
import {
  initNCM,
  subscribeNCMRealtime,
  deregisterDevice,
  getNCMDeviceId,
  checkBatterySaverActive,
  requestBatteryOptimizationExemption,
} from '@/services/NCMService';
import { useAuth } from '@/store/AuthContext';

interface NCMContextValue {
  duid: string | null;
  batterySaverActive: boolean;
  requestBatteryExemption: () => Promise<void>;
}

const NCMContext = createContext<NCMContextValue | null>(null);

export function NCMProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [duid, setDuid] = useState<string | null>(null);
  const [batterySaverActive, setBatterySaverActive] = useState(false);
  const unsubRef = useRef<(() => void) | null>(null);
  const prevUserIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!user) {
      if (unsubRef.current) {
        unsubRef.current();
        unsubRef.current = null;
      }
      if (prevUserIdRef.current) {
        deregisterDevice(prevUserIdRef.current).catch(() => {});
        prevUserIdRef.current = null;
      }
      return;
    }

    prevUserIdRef.current = user.id;
    let cancelled = false;

    (async () => {
      await initNCM(user);
      const id = await getNCMDeviceId();
      if (!cancelled) setDuid(id);

      if (Platform.OS === 'android') {
        const active = await checkBatterySaverActive();
        if (!cancelled) setBatterySaverActive(active);

        if (active) {
          Alert.alert(
            'Battery Saver Detected',
            'Battery saver mode may delay or block notifications. Tap "Fix Now" to exempt Elite eSports from battery restrictions and ensure you always receive alerts.',
            [
              { text: 'Later', style: 'cancel' },
              {
                text: 'Fix Now',
                onPress: requestBatteryOptimizationExemption,
              },
            ],
          );
        }
      }

      const unsub = subscribeNCMRealtime(user.id);
      if (!cancelled) {
        unsubRef.current = unsub;
      } else {
        unsub();
      }
    })();

    return () => {
      cancelled = true;
      if (unsubRef.current) {
        unsubRef.current();
        unsubRef.current = null;
      }
    };
  }, [user]);

  const requestBatteryExemption = useCallback(async () => {
    await requestBatteryOptimizationExemption();
  }, []);

  const value = useMemo(
    () => ({ duid, batterySaverActive, requestBatteryExemption }),
    [duid, batterySaverActive, requestBatteryExemption],
  );

  return <NCMContext.Provider value={value}>{children}</NCMContext.Provider>;
}

export function useNCM(): NCMContextValue {
  const ctx = useContext(NCMContext);
  if (!ctx) throw new Error('useNCM must be used within NCMProvider');
  return ctx;
}
