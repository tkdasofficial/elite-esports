import { useEffect, useState } from 'react';
import { BrowserRouter } from 'react-router-dom';
import SplashScreen from './components/SplashScreen';
import { AdOverlay } from './components/AdOverlay';
import { AdTagOverlay } from './components/AdTagOverlay';
import { AppRouter } from './routes/AppRouter';
import { useCampaignStore } from './store/campaignStore';
import { useAdEngineStore } from './store/adEngineStore';
import { useAuthStore } from './store/authStore';
import { useUserStore } from './store/userStore';
import { useAdTagStore } from './store/adTagStore';
import { useMatchStore } from './store/matchStore';
import { useGameStore } from './store/gameStore';
import { useBannerStore } from './store/bannerStore';
import { useCategoryStore } from './store/categoryStore';
import { usePlatformStore } from './store/platformStore';
import { useNotificationStore } from './store/notificationStore';
import { supabase } from './lib/supabase';
import type { Session } from '@supabase/supabase-js';

async function loadPublicData() {
  await Promise.all([
    useMatchStore.getState().fetchMatches(),
    useGameStore.getState().fetchGames(),
    useBannerStore.getState().fetchBanners(),
    useCampaignStore.getState().fetchCampaigns(),
    useCategoryStore.getState().fetchCategories(),
    usePlatformStore.getState().fetchSettings(),
  ]);
}

async function loadProfile(session: Session) {
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, username, email, avatar, coins, rank, bio, phone, is_admin, status')
    .eq('id', session.user.id)
    .single();

  if (profile) {
    useUserStore.getState().login(
      {
        id:       profile.id,
        username: profile.username ?? '',
        email:    profile.email ?? session.user.email ?? '',
        avatar:   profile.avatar ?? '',
        coins:    profile.coins ?? 0,
        rank:     profile.rank ?? 'Bronze',
        bio:      profile.bio ?? '',
        phone:    profile.phone ?? '',
      },
      profile.is_admin === true,
    );
    await useUserStore.getState().fetchUserData(profile.id);
    await useNotificationStore.getState().fetchNotifications(profile.id);
  }
}

export default function App() {
  const isPublicProfileRoute = window.location.pathname.startsWith('/@');
  const [showSplash, setShowSplash] = useState(!isPublicProfileRoute);

  const { session, setSession, setInitialized } = useAuthStore();
  const { logout: logoutUser } = useUserStore();
  const { fetchActiveTags, activeTagAd, triggerTagAd, completeTagAd } = useAdTagStore();
  const { shouldShowWelcomeAd, recordWelcomeAd, shouldShowTimerAd, recordTimerAd } = useCampaignStore();
  const { activeCampaign, triggerAd, completeAd } = useAdEngineStore();

  useEffect(() => {
    fetchActiveTags();
    loadPublicData();

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      if (session) await loadProfile(session);
      setInitialized(true);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session);
      if (session) {
        await loadProfile(session);
      } else {
        logoutUser();
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const isAuthenticated = !!session;

  useEffect(() => {
    if (!isAuthenticated || showSplash) return;
    const runWelcome = async () => {
      await triggerTagAd('welcome_ad');
      if (shouldShowWelcomeAd()) {
        recordWelcomeAd();
        await triggerAd('Welcome');
      }
    };
    runWelcome();
  }, [isAuthenticated, showSplash]);

  useEffect(() => {
    if (!isAuthenticated || showSplash) return;
    const check = async () => {
      await triggerTagAd('timer_ad');
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
      {activeTagAd && (
        <AdTagOverlay tag={activeTagAd} onComplete={completeTagAd} />
      )}
      {activeCampaign && (
        <AdOverlay campaign={activeCampaign} onComplete={completeAd} />
      )}
    </>
  );
}
