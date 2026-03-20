import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useUserStore } from '@/src/store/userStore';
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
import Notifications from '@/src/pages/Notifications';
import MatchDetails from '@/src/pages/MatchDetails';
import MyMatches from '@/src/pages/MyMatches';
import MyTeam from '@/src/pages/MyTeam';
import Settings from '@/src/pages/Settings';
import EditProfile from '@/src/pages/EditProfile';
import AddGameProfile from '@/src/pages/AddGameProfile';
import EditGameProfile from '@/src/pages/EditGameProfile';

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

export const AppRouter = () => {
  const { isAuthenticated, isAdmin } = useUserStore();
  const location = useLocation();

  if (!isAuthenticated) {
    return (
      <div className="h-full w-full bg-brand-dark overflow-hidden">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </div>
    );
  }

  const showGlobalHeader = ['/', '/leaderboard', '/live', '/wallet', '/profile'].includes(location.pathname);
  const isAdminPage = location.pathname.startsWith('/admin');

  // Admin Redirection: If admin is logged in and tries to access user pages, redirect to admin dashboard
  if (isAdmin && !isAdminPage) {
    return <Navigate to="/admin/dashboard" replace />;
  }

  // User Redirection: If regular user tries to access admin pages, redirect to home
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
            <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
          </Route>
          <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
        </Routes>
      </div>
    );
  }

  return (
    <div className="h-full w-full bg-black flex justify-center">
      {/* Responsive Frame Container */}
      <div className="h-full w-full md:max-w-[768px] lg:max-w-[1024px] bg-brand-dark relative flex flex-col shadow-2xl overflow-hidden md:border-x md:border-white/5">
        <Routes>
          <Route path="/notifications" element={<Notifications />} />
          <Route path="*" element={
            <>
              {showGlobalHeader && <Header />}
              <div className="flex-1 flex flex-col overflow-hidden">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={location.pathname}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="flex-1 scrollable-content flex flex-col"
                  >
                    <Routes location={location}>
                      <Route path="/" element={<Home />} />
                      <Route path="/leaderboard" element={<Leaderboard />} />
                      <Route path="/live" element={<Live />} />
                      <Route path="/wallet" element={<Wallet />} />
                      <Route path="/profile" element={<Profile />} />
                      <Route path="/match/:id" element={<MatchDetails />} />
                      <Route path="/my-matches" element={<MyMatches />} />
                      <Route path="/my-team" element={<MyTeam />} />
                      <Route path="/settings" element={<Settings />} />
                      <Route path="/edit-profile" element={<EditProfile />} />
                      <Route path="/add-game" element={<AddGameProfile />} />
                      <Route path="/edit-game/:id" element={<EditGameProfile />} />
                      
                      <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                  </motion.div>
                </AnimatePresence>
              </div>
              <BottomBar />
            </>
          } />
        </Routes>
      </div>
    </div>
  );
};

