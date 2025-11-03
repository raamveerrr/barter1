import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaTimes, FaCoins } from 'react-icons/fa';
import { useAuth } from '../contexts/AuthContext';

const OnboardingModal = () => {
  const { currentUser } = useAuth();
  const [show, setShow] = useState(false);
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState(false);

  useEffect(() => {
    if (!currentUser) return;

    const checkOnboarding = () => {
      const seen = localStorage.getItem(`onboarding_seen_${currentUser.id}`);
      if (!seen) {
        setShow(true);
      } else {
        setHasSeenOnboarding(true);
      }
    };

    checkOnboarding();
  }, [currentUser]);

  const handleClose = () => {
    if (currentUser) {
      localStorage.setItem(`onboarding_seen_${currentUser.id}`, 'true');
    }
    setShow(false);
    setHasSeenOnboarding(true);
  };

  if (!currentUser || hasSeenOnboarding || !show) return null;

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={(e) => e.target === e.currentTarget && handleClose()}
        >
          <motion.div
            className="w-full max-w-2xl bg-gradient-to-b from-gray-900 to-black rounded-2xl shadow-2xl ring-1 ring-white/10 overflow-hidden"
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative p-8">
              <button
                onClick={handleClose}
                className="absolute top-4 right-4 p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800/50 transition-colors"
              >
                <FaTimes className="w-5 h-5" />
              </button>

              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 mb-4">
                  <FaCoins className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-3xl font-bold text-white mb-2">Welcome to Barter!</h2>
                <p className="text-gray-300">Earn coins as you trade and grow</p>
              </div>

              <div className="space-y-4">
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 }}
                  className="p-4 rounded-xl bg-gradient-to-r from-green-500/20 to-green-600/20 border border-green-500/30"
                >
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">✅</span>
                    <div className="flex-1">
                      <h3 className="text-white font-semibold mb-1">100 Coins - For Signing Up</h3>
                      <p className="text-gray-300 text-sm">You just got these! Start trading now.</p>
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                  className="p-4 rounded-xl bg-gradient-to-r from-yellow-500/20 to-yellow-600/20 border border-yellow-500/30"
                >
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">💰</span>
                    <div className="flex-1">
                      <h3 className="text-white font-semibold mb-1">25 Coins - For Posting Your First Item</h3>
                      <p className="text-gray-300 text-sm">List an item on the marketplace to unlock this reward.</p>
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                  className="p-4 rounded-xl bg-gradient-to-r from-purple-500/20 to-purple-600/20 border border-purple-500/30"
                >
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">🚀</span>
                    <div className="flex-1">
                      <h3 className="text-white font-semibold mb-1">150 Coins - For Your First Sale</h3>
                      <p className="text-gray-300 text-sm">A huge bonus when you make your first sale!</p>
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 }}
                  className="p-4 rounded-xl bg-gradient-to-r from-indigo-500/20 to-indigo-600/20 border border-indigo-500/30"
                >
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">🤝</span>
                    <div className="flex-1">
                      <h3 className="text-white font-semibold mb-1">200 Coins (for BOTH of you!)</h3>
                      <p className="text-gray-300 text-sm">
                        When your friend signs up with your code and posts their first item, you both get 200 coins!
                      </p>
                    </div>
                  </div>
                </motion.div>
              </div>

              <div className="mt-8 flex justify-center">
                <button
                  onClick={handleClose}
                  className="px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold hover:from-indigo-500 hover:to-purple-500 transition-all shadow-[0_0_20px_rgba(99,102,241,0.4)]"
                >
                  Let's Get Started!
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default OnboardingModal;

