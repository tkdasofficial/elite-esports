import { Routes, Route, Navigate, useLocation, Outlet } from 'react-router-dom';
import { useAuthStore } from '@/src/store/authStore';
import { Header } from '@/src/components/layout/Header';
import { BottomBar } from '@/src/components/layout/BottomBar';
import { AnimatePresence, motion } from 'motion/react';

// Pages
import Home from '@/src/pages/Home';
import Leaderboard from '@/src/pages/Leaderboard';
import Live from '@/src/pages/Live';
import Wallet from '@/src/pages/Wallet';
import Profile from '@/src/pages/Profile';
import Login from '@/src/pages/Login';
import SignUp from '@/src/pages/SignUp';
import ForgotPassword from '@/src/pages/ForgotPassword';
import ResetPassword from '@/src/pages/ResetPassword';
import VerifyEmail from '@/src/pages/VerifyEmail';
import Notifications from '@/src/pages/Notifications';
import NotificationDetail from '@/src/pages/NotificationDetail';
import MatchDetails from '@/src/pages/MatchDetails';
import MyMatches from '@/src/pages/MyMatches';
import MyTeam from '@/src/pages/MyTeam';
import Settings from '@/src/pages/Settings';
import EditProfile from '@/src/pages/EditProfile';
import AddGameProfile from '@/src/pages/AddGameProfile';
import EditGameProfile from '@/src/pages/EditGameProfile';
import TermsAndConditions from '@/src/pages/TermsAndConditions';
import PrivacyPolicy from '@/src/pages/PrivacyPolicy';
import HelpCenter from '@/src/pages/HelpCenter';
import About from '@/src/pages/About';
import BlockedUsers from '@/src/pages/BlockedUsers';
import TournamentsAll from '@/src/pages/TournamentsAll';
import AllTransactions from '@/src/pages/AllTransactions';

// Admin Pages
import { AdminLayout } from '@/src/components/layout/AdminLayout';
import AdminDashboard from '@/src/pages/AdminDashboard';
import AdminMatches from '@/src/pages/AdminMatches';
import AdminMatchForm from '@/src/pages/AdminMatchForm';
import AdminUsers from '@/src/pages/AdminUsers';
import AdminEconomy from '@/src/pages/AdminEconomy';
import AdminCampaign from '@/src/pages/AdminCampaign';
import AdminTags from '@/src/pages/AdminTags';
import AdminSettings from '@/src/pages/AdminSettings';
import AdminGames from '@/src/pages/AdminGames';
import AdminNotifications from '@/src/pages/AdminNotifications';
import AdminSupport from '@/src/pages/AdminSupport';
import AdminRules from '@/src/pages/AdminRules';
import AdminReferrals from '@/src/pages/AdminReferrals';
import AdminCategory from '@/src/pages/AdminCategory';
import AdminMatchParticipants from '@/src/pages/AdminMatchParticipants';

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
  const location = useLocation();

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
  const isAdmin = userEmail === import.meta.env.VITE_ADMIN_EMAIL || 
                  session.user?.app_metadata?.role === 'admin' ||
                  session.user?.user_metadata?.role === 'admin';

  const isAdminPage = location.pathname.startsWith('/admin');

  if (isAdmin && !isAdminPage) {
    return <Navigate to="/admin/dashboard" replace />;
  }

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
