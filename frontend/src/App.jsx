import { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Toaster } from 'react-hot-toast';
import Navbar from './components/Navbar';
import PageTransition from './components/PageTransition';
import SplashScreen from './components/SplashScreen';
import FloatingMessagesButton from './components/MessagesList';
import OnboardingModal from './components/OnboardingModal';

// Pages
import Login from './pages/Login';
import Signup from './pages/Signup';
import Home from './pages/Home';
import Marketplace from './pages/Marketplace';
import MyItems from './pages/MyItems';
import Trades from './pages/Trades';
import Profile from './pages/Profile';
import ReferralPage from './pages/ReferralPage';

function PrivateRoute({ children }) {
  const { currentUser } = useAuth();
  return currentUser ? children : <Navigate to="/login" />;
}

function App() {
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setShowSplash(false), 2000);
    return () => clearTimeout(t);
  }, []);
  return (
    <Router>
      <AuthProvider>
        <div className="min-h-screen overflow-hidden bg-gradient-to-b from-gray-900 via-gray-900 to-black">
          <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-600/20 via-fuchsia-500/10 to-transparent" />
          <AnimatePresence>{showSplash ? <SplashScreen /> : null}</AnimatePresence>
          <Navbar />
          <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
            <PageTransition>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/" element={<Home />} />
              <Route
                path="/marketplace"
                element={
                  <PrivateRoute>
                    <Marketplace />
                  </PrivateRoute>
                }
              />
              <Route
                path="/my-items"
                element={
                  <PrivateRoute>
                    <MyItems />
                  </PrivateRoute>
                }
              />
              <Route
                path="/trades"
                element={
                  <PrivateRoute>
                    <Trades />
                  </PrivateRoute>
                }
              />
              <Route
                path="/profile"
                element={
                  <PrivateRoute>
                    <Profile />
                  </PrivateRoute>
                }
              />
              <Route
                path="/referral"
                element={
                  <PrivateRoute>
                    <ReferralPage />
                  </PrivateRoute>
                }
              />
            </Routes>
            </PageTransition>
          </main>
          <FloatingMessagesButton />
          <OnboardingModal />
        </div>
        <Toaster />
      </AuthProvider>
    </Router>
  );
}

export default App;
