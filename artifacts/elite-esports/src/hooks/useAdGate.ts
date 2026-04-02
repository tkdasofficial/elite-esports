import { useCallback, useRef, useState } from 'react';
import { useAds } from '@/store/AdContext';

export interface AdOverlayState {
  visible:  boolean;
  label:    string;
  duration: number;
}

const HIDDEN: AdOverlayState = { visible: false, label: '', duration: 15 };

export function useAdGate() {
  const { showInterstitial, showRewarded, adBusy } = useAds();
  const [overlay, setOverlay] = useState<AdOverlayState>(HIDDEN);
  const skipRef = useRef<(() => void) | null>(null);

  const showOverlay = (label: string) => {
    setOverlay({ visible: true, label, duration: 15 });
  };
  const hideOverlay = () => {
    setOverlay(HIDDEN);
    skipRef.current = null;
  };

  const dismiss = useCallback(() => {
    hideOverlay();
    skipRef.current?.();
  }, []);

  const gateWithInterstitial = useCallback(
    (action: () => void, label = 'Loading Ad...') => {
      showOverlay(label);
      skipRef.current = action;
      showInterstitial(() => {
        hideOverlay();
        action();
      });
    },
    [showInterstitial],
  );

  const gateWithRewarded = useCallback(
    (onRewarded: () => void, action: () => void, label = 'Loading Ad...') => {
      showOverlay(label);
      skipRef.current = action;
      showRewarded(
        () => { onRewarded(); },
        () => {
          hideOverlay();
          action();
        },
      );
    },
    [showRewarded],
  );

  return { gateWithInterstitial, gateWithRewarded, overlay, dismiss, adBusy };
}
