import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

export default function Profile() {
  const { currentUser, getUserData } = useAuth();
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadUserData() {
      try {
        const data = await getUserData();
        setUserData(data);
      } catch (error) {
        console.error('Error loading user data:', error);
      } finally {
        setLoading(false);
      }
    }

    loadUserData();
  }, [getUserData]);

  if (loading) {
    return (
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading profile...</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto text-white">
      <div className="rounded-lg bg-gray-800/60 backdrop-blur ring-1 ring-white/10 overflow-hidden">
        <div className="p-6">
          <div className="flex items-center">
            <div className="h-20 w-20 rounded-full bg-indigo-600 ring-2 ring-indigo-400/40 flex items-center justify-center text-white text-2xl font-bold">
              {currentUser.user_metadata?.display_name?.charAt(0) || currentUser.email?.charAt(0)}
            </div>
            <div className="ml-6">
              <h1 className="text-2xl font-bold text-white">
                {currentUser.user_metadata?.display_name || 'User'}
              </h1>
              <p className="text-gray-300">{currentUser.email}</p>
            </div>
          </div>

          <div className="mt-6 border-t border-white/10 pt-6">
            <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
              <div>
                <dt className="text-sm font-medium text-gray-400">Coin Balance</dt>
                <dd className="mt-1 text-xl font-semibold text-indigo-400">
                  {userData?.coins || 0} coins
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-400">Trades Completed</dt>
                <dd className="mt-1 text-xl font-semibold text-white">
                  {userData?.trades || 0}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-400">Rating</dt>
                <dd className="mt-1 text-xl font-semibold text-white">
                  {userData?.rating || 5.0} / 5.0
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-400">Member Since</dt>
                <dd className="mt-1 text-xl font-semibold text-white">
                  {new Date(userData?.created_at).toLocaleDateString()}
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </div>

      <div className="mt-6">
        <h2 className="text-lg font-semibold text-white mb-4">Recent Activity</h2>
        {/* Add recent activity component here when implemented */}
        <div className="rounded-lg bg-gray-900/70 ring-1 ring-white/10 p-6 text-center text-gray-300">
          Recent activity will be shown here
        </div>
      </div>
    </div>
  );
}