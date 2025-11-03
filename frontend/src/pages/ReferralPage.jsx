import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import supabase from '../config/supabase';
import { useAuth } from '../contexts/AuthContext';
import { FaCopy, FaCheck, FaHandshake, FaCoins } from 'react-icons/fa';
import toast from 'react-hot-toast';

const ReferralPage = () => {
  const { currentUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [copied, setCopied] = useState(false);
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
        toast.error('Failed to load referral information');
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [currentUser]);

  const referralUrl = profile
    ? `${window.location.origin}/signup?ref=${profile.referral_code}`
    : '';

  const handleCopy = async () => {
    if (!referralUrl) return;

    try {
      await navigator.clipboard.writeText(referralUrl);
      setCopied(true);
      toast.success('Referral link copied!');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error('Failed to copy link');
    }
  };

  const handleCopyCode = async () => {
    if (!profile?.referral_code) return;

    try {
      await navigator.clipboard.writeText(profile.referral_code);
      toast.success('Referral code copied!');
    } catch (error) {
      toast.error('Failed to copy code');
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto text-white">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-700 rounded w-1/3 mb-6"></div>
          <div className="h-64 bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="max-w-4xl mx-auto text-white text-center">
        <p className="text-gray-400">Failed to load referral information</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto text-white">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-4xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400">
          Refer & Earn
        </h1>
        <p className="text-gray-300 text-lg">
          Share your referral code and earn 200 coins when your friend signs up and posts their first item!
        </p>
      </motion.div>

      <div className="grid gap-6 md:grid-cols-2">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="rounded-lg bg-gradient-to-br from-gray-800/60 to-gray-900/60 backdrop-blur ring-1 ring-white/10 p-6"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 flex items-center justify-center">
              <FaHandshake className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-white">Your Referral Code</h2>
          </div>

          <div className="bg-gray-900/50 rounded-lg p-4 mb-4">
            <div className="flex items-center justify-between">
              <code className="text-xl font-mono text-indigo-400">{profile.referral_code}</code>
              <button
                onClick={handleCopyCode}
                className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors"
                title="Copy code"
              >
                <FaCopy className="w-4 h-4 text-gray-300" />
              </button>
            </div>
          </div>

          <div className="p-4 rounded-lg bg-gradient-to-r from-indigo-500/20 to-purple-500/20 border border-indigo-500/30">
            <p className="text-sm text-gray-300">
              <strong className="text-white">How it works:</strong> When someone signs up with your code and posts
              their first item, both of you get 200 coins!
            </p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="rounded-lg bg-gradient-to-br from-gray-800/60 to-gray-900/60 backdrop-blur ring-1 ring-white/10 p-6"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-full bg-gradient-to-r from-yellow-500 to-yellow-600 flex items-center justify-center">
              <FaCoins className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-white">Share Your Link</h2>
          </div>

          <div className="bg-gray-900/50 rounded-lg p-4 mb-4">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={referralUrl}
                readOnly
                className="flex-1 bg-transparent text-gray-300 text-sm truncate"
              />
              <button
                onClick={handleCopy}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-sm font-semibold hover:from-indigo-500 hover:to-purple-500 transition-all"
              >
                {copied ? (
                  <>
                    <FaCheck className="w-4 h-4" />
                    Copied!
                  </>
                ) : (
                  <>
                    <FaCopy className="w-4 h-4" />
                    Copy Link
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3 rounded-lg bg-gray-900/30">
              <span className="text-xl">✅</span>
              <div>
                <p className="text-white font-medium">Friend signs up with your code</p>
                <p className="text-sm text-gray-400">They get 100 coins automatically</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 rounded-lg bg-gray-900/30">
              <span className="text-xl">✅</span>
              <div>
                <p className="text-white font-medium">Friend posts their first item</p>
                <p className="text-sm text-gray-400">Both of you get 200 coins!</p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="mt-8 rounded-lg bg-gradient-to-r from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 p-6"
      >
        <h3 className="text-xl font-bold text-white mb-3">Reward Status</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4 rounded-lg bg-gray-900/30">
            <div className="text-3xl mb-2">
              {profile.referral_bonus_paid_out ? '✅' : '⏳'}
            </div>
            <p className="text-white font-semibold">Referral Bonus</p>
            <p className="text-sm text-gray-400">
              {profile.referral_bonus_paid_out ? 'Earned!' : 'Pending'}
            </p>
          </div>
          <div className="text-center p-4 rounded-lg bg-gray-900/30">
            <div className="text-3xl mb-2">
              {profile.has_posted_first_item ? '✅' : '⏳'}
            </div>
            <p className="text-white font-semibold">First Post Bonus</p>
            <p className="text-sm text-gray-400">
              {profile.has_posted_first_item ? 'Earned!' : 'Not yet'}
            </p>
          </div>
          <div className="text-center p-4 rounded-lg bg-gray-900/30">
            <div className="text-3xl mb-2">
              {profile.has_made_first_sale ? '✅' : '⏳'}
            </div>
            <p className="text-white font-semibold">First Sale Bonus</p>
            <p className="text-sm text-gray-400">
              {profile.has_made_first_sale ? 'Earned!' : 'Not yet'}
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default ReferralPage;

