import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import supabase from '../config/supabase';
import { useAuth } from '../contexts/AuthContext';
import { FaCoins, FaGift, FaRocket, FaHandshake } from 'react-icons/fa';

const RewardTracker = () => {
  const { currentUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) return;

    const loadProfile = async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', currentUser.id)
          .single();

        if (error) throw error;
        setProfile(data);
      } catch (error) {
        console.error('Error loading profile:', error);
      } finally {
        setLoading(false);
      }
    };

    loadProfile();

    const channel = supabase
      .channel('profile-updates')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${currentUser.id}`,
        },
        (payload) => {
          setProfile(payload.new);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUser]);

  if (!currentUser || loading || !profile) {
    return (
      <div className="rounded-lg bg-gray-800/60 backdrop-blur ring-1 ring-white/10 p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-700 rounded w-1/2 mb-4"></div>
          <div className="h-4 bg-gray-700 rounded w-3/4"></div>
        </div>
      </div>
    );
  }

  const getNextReward = () => {
    if (!profile.has_posted_first_item) {
      return {
        icon: <FaGift className="w-6 h-6" />,
        title: 'Post your first item now and earn 25 bonus Coins! 💰',
        action: 'Post Item',
        link: '/my-items',
        color: 'from-yellow-500/20 to-yellow-600/20 border-yellow-500/30',
      };
    } else if (!profile.has_made_first_sale) {
      return {
        icon: <FaRocket className="w-6 h-6" />,
        title: 'Great! Make your first sale to unlock a 150 Coin bonus! 🚀',
        action: 'View Marketplace',
        link: '/marketplace',
        color: 'from-purple-500/20 to-purple-600/20 border-purple-500/30',
      };
    } else {
      return {
        icon: <FaHandshake className="w-6 h-6" />,
        title: 'Refer a friend! When they post their first item, you both get 200 Coins! 🤝',
        action: 'Get Referral Code',
        link: '/referral',
        color: 'from-indigo-500/20 to-indigo-600/20 border-indigo-500/30',
      };
    }
  };

  const nextReward = getNextReward();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-lg bg-gradient-to-br from-gray-800/60 to-gray-900/60 backdrop-blur ring-1 ring-white/10 overflow-hidden"
    >
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 flex items-center justify-center">
              <FaCoins className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">Your Coin Balance</h3>
              <p className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-yellow-600">
                {profile.coin_balance} Coins
              </p>
            </div>
          </div>
        </div>

        <div className={`p-4 rounded-xl bg-gradient-to-r ${nextReward.color} border`}>
          <div className="flex items-start gap-3">
            <div className="text-indigo-400 mt-1">{nextReward.icon}</div>
            <div className="flex-1">
              <p className="text-white font-medium mb-3">{nextReward.title}</p>
              <Link
                to={nextReward.link}
                className="inline-flex items-center px-4 py-2 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-sm font-semibold hover:from-indigo-500 hover:to-purple-500 transition-all shadow-[0_0_15px_rgba(99,102,241,0.3)]"
              >
                {nextReward.action}
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-6 pt-6 border-t border-white/10">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl mb-1">
                {profile.has_posted_first_item ? '✅' : '⏳'}
              </div>
              <p className="text-xs text-gray-400">First Post</p>
              <p className="text-xs text-gray-300 font-semibold">+25 Coins</p>
            </div>
            <div>
              <div className="text-2xl mb-1">
                {profile.has_made_first_sale ? '✅' : '⏳'}
              </div>
              <p className="text-xs text-gray-400">First Sale</p>
              <p className="text-xs text-gray-300 font-semibold">+150 Coins</p>
            </div>
            <div>
              <div className="text-2xl mb-1">
                {profile.referral_bonus_paid_out ? '✅' : '⏳'}
              </div>
              <p className="text-xs text-gray-400">Referral</p>
              <p className="text-xs text-gray-300 font-semibold">+200 Coins</p>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default RewardTracker;

