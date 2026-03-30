import { useCallback, useRef, useState } from 'react';
import { AdGateConfig } from '@/store/AdContext';

export interface AdGateOverlayState {
  visible:  boolean;
  duration: number;
  label:    string;
}

export function useAdGate() {
  const [overlay] = useState<AdGateOverlayState>({
    visible:  false,
    duration: 0,
    label:    '',
  });

  const dismiss = useCallback(() => {}, []);

  const gateAction = useCallback(
    async (
      _config: AdGateConfig,
      action: () => void,
      _label = '',
    ) => {
      action();
    },
    [],
  );

  return { gateAction, overlay, dismiss };
}
