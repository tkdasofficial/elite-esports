import { useEffect, useState } from 'react';
import { BrowserRouter } from 'react-router-dom';
import SplashScreen from './components/SplashScreen';
import { AdOverlay } from './components/AdOverlay';
import { AppRouter } from './routes/AppRouter';
import { useCampaignStore } from './store/campaignStore';
import { useAdEngineStore } from './store/adEngineStore';
import { useAuthStore } from './store/authStore';
import { supabase } from './lib/supabase';

export default function App() {
  // Skip splash for public profile routes (/@username)
  const isPublicProfileRoute = window.location.pathname.startsWith('/@');
  const [showSplash, setShowSplash] = useState(!isPublicProfileRoute);

  const { session, setSession, setInitialized } = useAuthStore();
  const { shouldShowWelcomeAd, recordWelcomeAd, shouldShowTimerAd, recordTimerAd } = useCampaignStore();
  const { activeCampaign, triggerAd, completeAd } = useAdEngineStore();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setInitialized(true);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const isAuthenticated = !!session;

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
