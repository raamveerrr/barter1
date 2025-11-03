import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';

export default function Home() {
  const { currentUser } = useAuth();

  return (
    <div className="relative isolate overflow-hidden bg-gradient-to-b from-gray-900 via-gray-900 to-black py-16 sm:py-24">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-600/20 via-fuchsia-500/10 to-transparent" />
      <div className="mx-auto max-w-4xl text-center">
        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-fuchsia-400 to-amber-300">
          Trade Smarter with Coins
        </h1>
        <p className="mt-6 text-lg leading-8 text-gray-300">
          A sleek marketplace for your campus with a crypto-inspired vibe. List, trade, and grow your coin balance.
        </p>
        <div className="mt-10 flex items-center justify-center gap-x-6">
          {currentUser ? (
            <Link
              to="/marketplace"
              className="rounded-md bg-indigo-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-[0_0_20px_rgba(79,70,229,0.4)] hover:bg-indigo-500"
            >
              Browse Marketplace
            </Link>
          ) : (
            <>
              <Link
                to="/signup"
                className="rounded-md bg-indigo-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-[0_0_20px_rgba(79,70,229,0.4)] hover:bg-indigo-500"
              >
                Get started
              </Link>
              <Link
                to="/login"
                className="text-sm font-semibold leading-6 text-gray-300 hover:text-white"
              >
                Log in <span aria-hidden="true">→</span>
              </Link>
            </>
          )}
        </div>
      </div>

      {currentUser && (
        <div className="mt-16">
          <h2 className="text-2xl font-bold mb-6 text-center text-white">Quick Actions</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Link
              to="/my-items"
              className="block p-6 rounded-lg bg-gray-800/60 backdrop-blur shadow hover:shadow-lg transition-shadow ring-1 ring-white/10"
            >
              <h3 className="text-lg font-semibold text-white">My Items</h3>
              <p className="mt-2 text-sm text-gray-300">
                View and manage your listed items
              </p>
            </Link>
            <Link
              to="/trades"
              className="block p-6 rounded-lg bg-gray-800/60 backdrop-blur shadow hover:shadow-lg transition-shadow ring-1 ring-white/10"
            >
              <h3 className="text-lg font-semibold text-white">Active Trades</h3>
              <p className="mt-2 text-sm text-gray-300">
                Track your ongoing trades
              </p>
            </Link>
            <Link
              to="/profile"
              className="block p-6 rounded-lg bg-gray-800/60 backdrop-blur shadow hover:shadow-lg transition-shadow ring-1 ring-white/10"
            >
              <h3 className="text-lg font-semibold text-white">Profile</h3>
              <p className="mt-2 text-sm text-gray-300">
                View your profile and coin balance
              </p>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}