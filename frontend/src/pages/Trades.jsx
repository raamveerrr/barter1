import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import supabase from '../config/supabase';
import { useAuth } from '../contexts/AuthContext';
import { FaCoins, FaCheckCircle, FaArrowRight, FaUser, FaStore } from 'react-icons/fa';

export default function Trades() {
  const [trades, setTrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const { currentUser } = useAuth();

  useEffect(() => {
    if (!currentUser) return;

    const loadTrades = async () => {
      try {
        const { data, error } = await supabase
          .from('transactions')
          .select('*')
          .or(`buyer_id.eq.${currentUser.id},seller_id.eq.${currentUser.id}`)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setTrades(data || []);
      } catch (error) {
        console.error('Error loading trades:', error);
      } finally {
        setLoading(false);
      }
    };

    loadTrades();

    const channel = supabase
      .channel('trades-updates')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'transactions',
          filter: `buyer_id=eq.${currentUser.id}`,
        },
        (payload) => {
          setTrades((prev) => [payload.new, ...prev]);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'transactions',
          filter: `seller_id=eq.${currentUser.id}`,
        },
        (payload) => {
          setTrades((prev) => [payload.new, ...prev]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUser]);

  const filteredTrades = trades.filter((trade) => {
    if (filter === 'all') return true;
    if (filter === 'bought') return trade.buyer_id === currentUser?.id;
    if (filter === 'sold') return trade.seller_id === currentUser?.id;
    return trade.status === filter;
  });

  const getTradeRole = (trade) => {
    if (trade.buyer_id === currentUser?.id) return 'buyer';
    if (trade.seller_id === currentUser?.id) return 'seller';
    return null;
  };

  const getStatusBadge = (status) => {
    const styles = {
      completed: 'bg-gradient-to-r from-green-500/20 to-emerald-500/20 text-green-400 ring-1 ring-green-500/30',
      pending: 'bg-gradient-to-r from-yellow-500/20 to-amber-500/20 text-yellow-400 ring-1 ring-yellow-500/30',
      cancelled: 'bg-gradient-to-r from-red-500/20 to-rose-500/20 text-red-400 ring-1 ring-red-500/30',
    };
    return styles[status] || styles.completed;
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
        <p className="mt-4 text-gray-300">Loading trades...</p>
      </div>
    );
  }

  return (
    <div className="text-white">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h1 className="text-2xl font-bold">Trade History</h1>
        <div className="flex gap-2">
          {['all', 'bought', 'sold'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                filter === f
                  ? 'bg-indigo-600 text-white shadow-[0_0_15px_rgba(99,102,241,0.3)]'
                  : 'bg-gray-800/60 text-gray-300 hover:bg-gray-700/60'
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {filteredTrades.length === 0 ? (
        <div className="text-center py-12 rounded-lg bg-gray-900/70 ring-1 ring-white/10">
          <FaCoins className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-300">No trades found.</p>
          <p className="text-sm text-gray-400 mt-2">
            {filter === 'all'
              ? 'Your trade history will appear here once you start trading.'
              : `No ${filter} trades found.`}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <AnimatePresence>
            {filteredTrades.map((trade) => {
              const role = getTradeRole(trade);
              const isBuyer = role === 'buyer';
              const isSeller = role === 'seller';

              return (
                <motion.div
                  key={trade.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="rounded-lg bg-gray-800/60 backdrop-blur ring-1 ring-white/10 p-6 hover:ring-indigo-500/30 transition-all"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-12 h-12 rounded-full flex items-center justify-center ${
                          isBuyer
                            ? 'bg-gradient-to-br from-indigo-500/20 to-purple-500/20 ring-1 ring-indigo-500/30'
                            : 'bg-gradient-to-br from-green-500/20 to-emerald-500/20 ring-1 ring-green-500/30'
                        }`}
                      >
                        {isBuyer ? (
                          <FaUser className="w-6 h-6 text-indigo-400" />
                        ) : (
                          <FaStore className="w-6 h-6 text-green-400" />
                        )}
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-white">{trade.item_title}</h3>
                        <p className="text-sm text-gray-400">
                          {new Date(trade.created_at).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadge(trade.status)}`}>
                      {trade.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                    <div className="bg-gray-900/50 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">
                          {isBuyer ? 'You Paid' : 'You Received'}
                        </span>
                        <FaCoins className="w-4 h-4 text-yellow-400" />
                      </div>
                      <p className={`text-2xl font-bold ${isBuyer ? 'text-red-400' : 'text-green-400'}`}>
                        {isBuyer ? '-' : '+'}
                        {trade.price} coins
                      </p>
                    </div>

                    <div className="bg-gray-900/50 rounded-lg p-4">
                      <span className="text-xs font-medium text-gray-400 uppercase tracking-wide block mb-2">
                        {isBuyer ? 'Seller' : 'Buyer'}
                      </span>
                      <p className="text-white font-semibold">
                        {isBuyer ? trade.seller_name : trade.buyer_name}
                      </p>
                    </div>
                  </div>

                  {isSeller && (
                    <div className="flex items-center gap-2 text-sm text-gray-400 bg-gray-900/30 rounded-lg p-3">
                      <FaCheckCircle className="w-4 h-4 text-green-400" />
                      <span>You received {trade.price} coins for this sale</span>
                    </div>
                  )}

                  {isBuyer && (
                    <div className="flex items-center gap-2 text-sm text-gray-400 bg-gray-900/30 rounded-lg p-3">
                      <FaArrowRight className="w-4 h-4 text-indigo-400" />
                      <span>You purchased this item for {trade.price} coins</span>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
