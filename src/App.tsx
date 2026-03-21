/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState } from 'react';
import { BrowserRouter } from 'react-router-dom';
import SplashScreen from './components/SplashScreen';
import { AdOverlay } from './components/AdOverlay';
import { AppRouter } from './routes/AppRouter';
import { useCampaignStore } from './store/campaignStore';
import { useAdEngineStore } from './store/adEngineStore';
import { useUserStore } from './store/userStore';

export default function App() {
  const [showSplash, setShowSplash] = useState(true);

  const { isAuthenticated } = useUserStore();
  const { shouldShowWelcomeAd, recordWelcomeAd, shouldShowTimerAd, recordTimerAd } = useCampaignStore();
  const { activeCampaign, triggerAd, completeAd } = useAdEngineStore();

  useEffect(() => {
    if (!isAuthenticated || showSplash) return;

    if (shouldShowWelcomeAd()) {
      recordWelcomeAd();
      triggerAd('Welcome');
    }
  }, [isAuthenticated, showSplash]);

  useEffect(() => {
    if (!isAuthenticated || showSplash) return;

    const check = () => {
      if (shouldShowTimerAd()) {
        recordTimerAd();
        triggerAd('Timer');
      }
    };

    const interval = setInterval(check, 60 * 1000);
    return () => clearInterval(interval);
  }, [isAuthenticated, showSplash]);

  return (
    <>
      {showSplash && <SplashScreen onFinish={() => setShowSplash(false)} />}
      <BrowserRouter>
        <AppRouter />
      </BrowserRouter>
      {activeCampaign && (
        <AdOverlay campaign={activeCampaign} onComplete={completeAd} />
      )}
    </>
  );
}
