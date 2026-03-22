import { useEffect, useState } from 'react';
import { BrowserRouter } from 'react-router-dom';
import SplashScreen from './components/SplashScreen';
import { AdOverlay } from './components/AdOverlay';
import { AppRouter } from './routes/AppRouter';
import { useCampaignStore } from './store/campaignStore';
import { useAdEngineStore } from './store/adEngineStore';
import { useAuthStore } from './store/authStore';
import { useUserStore } from './store/userStore';
import { supabase } from './lib/supabase';
import type { Session } from '@supabase/supabase-js';

async function loadProfile(session: Session, loginUser: ReturnType<typeof useUserStore>['login']) {
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, username, email, avatar, coins, rank, bio, phone, is_admin, status')
    .eq('id', session.user.id)
    .single();

  if (profile) {
    loginUser(
      {
        id: profile.id,
        username: profile.username ?? '',
        email: profile.email ?? session.user.email ?? '',
        avatar: profile.avatar ?? '',
        coins: profile.coins ?? 0,
        rank: profile.rank ?? 'Bronze',
        bio: profile.bio ?? '',
        phone: profile.phone ?? '',
      },
      profile.is_admin === true,
    );
  }
}

export default function App() {
  // Skip splash for public profile routes (/@username)
  const isPublicProfileRoute = window.location.pathname.startsWith('/@');
  const [showSplash, setShowSplash] = useState(!isPublicProfileRoute);

  const { session, setSession, setInitialized } = useAuthStore();
  const { login: loginUser, logout: logoutUser } = useUserStore();
  const { shouldShowWelcomeAd, recordWelcomeAd, shouldShowTimerAd, recordTimerAd } = useCampaignStore();
  const { activeCampaign, triggerAd, completeAd } = useAdEngineStore();

  useEffect(() => {
    // On mount: restore existing session and load profile
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      if (session) await loadProfile(session, loginUser);
      setInitialized(true);
    });

    // On login / logout / token refresh
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session);
      if (session) {
        await loadProfile(session, loginUser);
      } else {
        logoutUser();
      }
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
