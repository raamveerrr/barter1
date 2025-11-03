import { useState, useEffect } from 'react';
import supabase from '../config/supabase';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

export default function Trades() {
  const [trades, setTrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const { currentUser } = useAuth();

  useEffect(() => {
    const load = async () => {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .contains('participants', [currentUser.id])
        .order('created_at', { ascending: false });
      if (!error) setTrades(data || []);
      setLoading(false);
    };
    load();
  }, [currentUser.id]);

  const getTradeStatusClass = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading trades...</p>
      </div>
    );
  }

  return (
    <div className="text-white">
      <h1 className="text-2xl font-bold mb-6">My Trades</h1>

      {trades.length === 0 ? (
        <div className="text-center py-12 rounded-lg bg-gray-900/70 ring-1 ring-white/10">
          <p className="text-gray-300">No trades found.</p>
          <p className="text-sm text-gray-400 mt-2">
            Your trade history will appear here once you start trading.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {trades.map((trade) => (
            <div key={trade.id} className="rounded-lg bg-gray-800/60 backdrop-blur ring-1 ring-white/10 p-6">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-semibold text-white">
                    Trade #{trade.id.slice(-8)}
                  </h3>
                  <p className="text-sm text-gray-400 mt-1">
                    {new Date(trade.created_at).toLocaleString()}
                  </p>
                </div>
                <span
                  className={`px-2 py-1 rounded-full text-xs font-semibold ${getTradeStatusClass(
                    trade.status
                  )}`}
                >
                  {trade.status}
                </span>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-400">Item</h4>
                  <p className="mt-1 font-semibold text-white">{trade.item_title}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-400">Price</h4>
                  <p className="mt-1 font-semibold text-indigo-400">{trade.price} coins</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-400">Seller</h4>
                  <p className="mt-1 text-white">{trade.seller_name}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-400">Buyer</h4>
                  <p className="mt-1 text-white">{trade.buyer_name}</p>
                </div>
              </div>

              {trade.status === 'pending' && (
                <div className="mt-6 flex justify-end space-x-4">
                  <button
                    onClick={() => toast('Coming soon!')}
                    className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Complete Trade
                  </button>
                  <button
                    onClick={() => toast('Coming soon!')}
                    className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Cancel Trade
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}