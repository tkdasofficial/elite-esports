import { Routes, Route, Navigate, useLocation, Outlet } from 'react-router-dom';
import { useAuthStore } from '@/src/store/authStore';
import { useUserStore } from '@/src/store/userStore';
import { Header } from '@/src/components/layout/Header';
import { BottomBar } from '@/src/components/layout/BottomBar';
import { AnimatePresence, motion } from 'motion/react';

// Auth Pages
import Login from '@/src/auth/Login';
import SignUp from '@/src/auth/SignUp';
import ForgotPassword from '@/src/auth/ForgotPassword';
import ResetPassword from '@/src/auth/ResetPassword';
import VerifyEmail from '@/src/auth/VerifyEmail';

// App Pages
import Home from '@/src/app/Home';
import ProfileSetup from '@/src/app/ProfileSetup';
import Leaderboard from '@/src/app/Leaderboard';
import Live from '@/src/app/Live';
import Wallet from '@/src/app/Wallet';
import Profile from '@/src/app/Profile';
import PublicProfile from '@/src/app/PublicProfile';
import Notifications from '@/src/app/Notifications';
import NotificationDetail from '@/src/app/NotificationDetail';
import MatchDetails from '@/src/app/MatchDetails';
import MyMatches from '@/src/app/MyMatches';
import MyTeam from '@/src/app/MyTeam';
import Settings from '@/src/app/Settings';
import EditProfile from '@/src/app/EditProfile';
import AddGameProfile from '@/src/app/AddGameProfile';
import EditGameProfile from '@/src/app/EditGameProfile';
import TermsAndConditions from '@/src/app/TermsAndConditions';
import PrivacyPolicy from '@/src/app/PrivacyPolicy';
import HelpCenter from '@/src/app/HelpCenter';
import About from '@/src/app/About';
import BlockedUsers from '@/src/app/BlockedUsers';
import TournamentsAll from '@/src/app/TournamentsAll';
import AllTransactions from '@/src/app/AllTransactions';

// Admin Pages
import { AdminLayout } from '@/src/components/layout/AdminLayout';
import AdminDashboard from '@/src/admin/AdminDashboard';
import AdminMatches from '@/src/admin/AdminMatches';
import AdminMatchForm from '@/src/admin/AdminMatchForm';
import AdminUsers from '@/src/admin/AdminUsers';
import AdminEconomy from '@/src/admin/AdminEconomy';
import AdminCampaign from '@/src/admin/AdminCampaign';
import AdminTags from '@/src/admin/AdminTags';
import AdminSettings from '@/src/admin/AdminSettings';
import AdminGames from '@/src/admin/AdminGames';
import AdminNotifications from '@/src/admin/AdminNotifications';
import AdminSupport from '@/src/admin/AdminSupport';
import AdminRules from '@/src/admin/AdminRules';
import AdminReferrals from '@/src/admin/AdminReferrals';
import AdminCategory from '@/src/admin/AdminCategory';
import AdminMatchParticipants from '@/src/admin/AdminMatchParticipants';

const HEADER_PATHS = new Set(['/', '/leaderboard', '/live', '/wallet', '/profile']);

const UserLayout = () => {
  const location = useLocation();
  const showHeader = HEADER_PATHS.has(location.pathname);

  return (
    <div className="h-full w-full bg-black flex justify-center">
      <div className="h-full w-full md:max-w-[768px] lg:max-w-[1024px] bg-brand-dark relative flex flex-col shadow-2xl overflow-hidden md:border-x md:border-white/5">
        {showHeader && <Header />}
        <div className="flex-1 relative overflow-hidden">
          <AnimatePresence initial={false}>
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15, ease: 'easeInOut' }}
              className="absolute inset-0 scrollable-content flex flex-col"
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </div>
        <BottomBar />
      </div>
    </div>
  );
};

export const AppRouter = () => {
  const { session, initialized } = useAuthStore();
  const { profileSetupComplete, user, isAdmin: isAdminFromStore } = useUserStore();
  const location = useLocation();

  // ── Public profile pages — no auth required ──────────────────
  if (location.pathname.startsWith('/@')) {
    return (
      <Routes>
        <Route path="*" element={<PublicProfile />} />
      </Routes>
    );
  }

  if (!initialized) {
    return (
      <div className="h-full w-full bg-brand-dark flex items-center justify-center">
        <span className="w-8 h-8 border-2 border-brand-primary/30 border-t-brand-primary rounded-full animate-spin" />
      </div>
    );
  }

  const isAuthenticated = !!session;

  if (!isAuthenticated) {
    return (
      <div className="h-full w-full bg-brand-dark overflow-hidden">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </div>
    );
  }

  const userEmail = session.user?.email ?? '';
  const isAdmin =
    isAdminFromStore ||
    userEmail === import.meta.env.VITE_ADMIN_EMAIL ||
    session.user?.app_metadata?.role === 'admin' ||
    session.user?.user_metadata?.role === 'admin';

  // Existing users with a saved username are considered set up already
  const needsProfileSetup = !isAdmin && !profileSetupComplete && !user?.username;

  // Redirect non-admin new users to profile setup
  if (needsProfileSetup && location.pathname !== '/profile-setup') {
    return <Navigate to="/profile-setup" replace />;
  }

  // Serve profile setup standalone (no header/bottom bar)
  if (!isAdmin && location.pathname === '/profile-setup') {
    return (
      <div className="h-full w-full bg-app-bg overflow-hidden">
        <Routes>
          <Route path="/profile-setup" element={<ProfileSetup />} />
          <Route path="*" element={<Navigate to="/profile-setup" replace />} />
        </Routes>
      </div>
    );
  }

  const isAdminPage = location.pathname.startsWith('/admin');

  // Admins are only allowed on admin pages — redirect to dashboard otherwise
  if (isAdmin && !isAdminPage) {
    return <Navigate to="/admin/dashboard" replace />;
  }

  // Non-admins cannot access admin pages
  if (!isAdmin && isAdminPage) {
    return <Navigate to="/" replace />;
  }

  if (isAdmin) {
    return (
      <div className="h-full w-full bg-black">
        <Routes>
          <Route element={<AdminLayout />}>
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/admin/matches" element={<AdminMatches />} />
            <Route path="/admin/matches/new" element={<AdminMatchForm />} />
            <Route path="/admin/matches/edit/:id" element={<AdminMatchForm />} />
            <Route path="/admin/matches/:id/participants" element={<AdminMatchParticipants />} />
            <Route path="/admin/users" element={<AdminUsers />} />
            <Route path="/admin/economy" element={<AdminEconomy />} />
            <Route path="/admin/campaign" element={<AdminCampaign />} />
            <Route path="/admin/tags" element={<AdminTags />} />
            <Route path="/admin/settings" element={<AdminSettings />} />
            <Route path="/admin/games" element={<AdminGames />} />
            <Route path="/admin/notifications" element={<AdminNotifications />} />
            <Route path="/admin/support" element={<AdminSupport />} />
            <Route path="/admin/rules" element={<AdminRules />} />
            <Route path="/admin/referrals" element={<AdminReferrals />} />
            <Route path="/admin/categories" element={<AdminCategory />} />
            <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
          </Route>
          <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
        </Routes>
      </div>
    );
  }

  return (
    <Routes>
      <Route element={<UserLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/leaderboard" element={<Leaderboard />} />
        <Route path="/live" element={<Live />} />
        <Route path="/wallet" element={<Wallet />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/notifications" element={<Notifications />} />
        <Route path="/notifications/:id" element={<NotificationDetail />} />
        <Route path="/match/:id" element={<MatchDetails />} />
        <Route path="/my-matches" element={<MyMatches />} />
        <Route path="/my-team" element={<MyTeam />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/edit-profile" element={<EditProfile />} />
        <Route path="/add-game" element={<AddGameProfile />} />
        <Route path="/edit-game/:id" element={<EditGameProfile />} />
        <Route path="/tournaments" element={<TournamentsAll />} />
        <Route path="/transactions" element={<AllTransactions />} />
        <Route path="/terms" element={<TermsAndConditions />} />
        <Route path="/privacy-policy" element={<PrivacyPolicy />} />
        <Route path="/help-center" element={<HelpCenter />} />
        <Route path="/about" element={<About />} />
        <Route path="/blocked-users" element={<BlockedUsers />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
};
