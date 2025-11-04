import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { FaCopy, FaCheck, FaStar } from 'react-icons/fa';
import supabase from '../config/supabase';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

export default function Profile() {
  const { currentUser, getUserData } = useAuth();
  const [userData, setUserData] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [completedTrades, setCompletedTrades] = useState(0);
  const [averageRating, setAverageRating] = useState(0);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        const data = await getUserData();
        setUserData(data);

        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', currentUser.id)
          .single();
        
        if (profileError && profileError.code !== 'PGRST116') {
          console.error('Profile error:', profileError);
        }
        
        if (!profileData) {
          const { data: newProfile } = await supabase
            .from('profiles')
            .insert({ id: currentUser.id, coin_balance: 100 })
            .select()
            .single();
          setProfile(newProfile);
        } else {
          if (!profileData.referral_code) {
            const { data: referralCode } = await supabase.rpc('ensure_referral_code', { p_user_id: currentUser.id });
            if (referralCode) {
              const { data: updatedProfile } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', currentUser.id)
                .single();
              setProfile(updatedProfile || { ...profileData, referral_code: referralCode });
            } else {
              setProfile(profileData);
            }
          } else {
            setProfile(profileData);
          }
        }

        const { count } = await supabase
          .from('transactions')
          .select('*', { count: 'exact', head: true })
          .or(`buyer_id.eq.${currentUser.id},seller_id.eq.${currentUser.id}`)
          .eq('status', 'completed');

        setCompletedTrades(count || 0);

        const { data: ratings } = await supabase
          .from('ratings')
          .select('rating')
          .eq('rated_user_id', currentUser.id);

        if (ratings && ratings.length > 0) {
          const avg = ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length;
          setAverageRating(Number(avg.toFixed(1)));
        } else {
          setAverageRating(5.0);
        }
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    }

    if (currentUser) {
      loadData();
    }
  }, [currentUser, getUserData]);

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

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
        <p className="mt-4 text-gray-300">Loading profile...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto text-white space-y-6">
      <div className="rounded-lg bg-gray-800/60 backdrop-blur ring-1 ring-white/10 overflow-hidden">
        <div className="p-6">
          <div className="flex items-center">
            <div className="h-20 w-20 rounded-full bg-gradient-to-br from-indigo-600 to-purple-600 ring-2 ring-indigo-400/40 flex items-center justify-center text-white text-2xl font-bold">
              {(currentUser.user_metadata?.display_name?.charAt(0) || currentUser.email?.charAt(0) || 'U').toUpperCase()}
            </div>
            <div className="ml-6">
              <h1 className="text-2xl font-bold text-white">
                {currentUser.user_metadata?.display_name || 'User'}
              </h1>
              <p className="text-gray-300">{currentUser.email}</p>
            </div>
          </div>

          <div className="mt-6 border-t border-white/10 pt-6">
            <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-3">
              <div>
                <dt className="text-sm font-medium text-gray-400">Coin Balance</dt>
                <dd className="mt-1 text-xl font-semibold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-yellow-600">
                  {profile?.coin_balance || 0} coins
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-400">Trades Completed</dt>
                <dd className="mt-1 text-xl font-semibold text-white">
                  {completedTrades}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-400">Rating</dt>
                <dd className="mt-1 text-xl font-semibold text-white flex items-center gap-2">
                  <FaStar className="text-yellow-400" />
                  {averageRating} / 5.0
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </div>

      <div className="rounded-lg bg-gray-800/60 backdrop-blur ring-1 ring-white/10 overflow-hidden">
        <div className="p-6">
          <h2 className="text-xl font-bold text-white mb-4">Referral Program</h2>
          <div className="space-y-4">
            <div className="bg-gray-900/50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-300">Your Referral Code</span>
                {profile?.referral_code ? (
                  <code className="text-sm font-mono text-indigo-400 bg-gray-800 px-3 py-1 rounded">
                    {profile.referral_code}
                  </code>
                ) : (
                  <div className="text-sm text-gray-400">Generating...</div>
                )}
              </div>
            </div>
            <div className="bg-gray-900/50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm font-medium text-gray-300">Share Your Link</span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={referralUrl}
                  readOnly
                  className="flex-1 bg-gray-800 text-gray-300 text-sm px-3 py-2 rounded border border-gray-700"
                />
                <button
                  onClick={handleCopy}
                  className="px-4 py-2 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-sm font-semibold hover:from-indigo-500 hover:to-purple-500 transition-all flex items-center gap-2"
                >
                  {copied ? (
                    <>
                      <FaCheck className="w-4 h-4" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <FaCopy className="w-4 h-4" />
                      Copy
                    </>
                  )}
                </button>
              </div>
              <p className="text-xs text-gray-400 mt-2">
                When someone signs up with your code and posts their first item, you both get 200 coins!
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
