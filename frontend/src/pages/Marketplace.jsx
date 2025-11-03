import { useState, useEffect } from 'react';
import supabase from '../config/supabase';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import PurchaseButton from '../components/PurchaseButton';

export default function Marketplace() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState(null);
  const { currentUser, getUserData } = useAuth();

  useEffect(() => {
    const loadUserData = async () => {
      const data = await getUserData();
      setUserData(data);
    };
    loadUserData();
  }, [getUserData]);

  useEffect(() => {
    const campusId = 'default-campus';

    let isMounted = true;

    const load = async () => {
      const { data, error } = await supabase
        .from('items')
        .select('*')
        .eq('campus_id', campusId)
        .order('created_at', { ascending: false });
      if (!isMounted) return;
      if (!error) setItems((data || []).filter(i => i.status === 'available' && i.owner_id !== currentUser.id));
      setLoading(false);
    };

    load();

    // Realtime subscription
    const channel = supabase
      .channel('realtime-items')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'items' }, (payload) => {
        setItems((prev) => {
          const next = [...prev];
          const row = payload.new || payload.old;
          if (!row) return prev;
          if (row.campus_id !== campusId) return prev;
          // Remove any existing entry for this id
          const idx = next.findIndex(i => i.id === row.id);
          if (idx !== -1) next.splice(idx, 1);
          // On inserts/updates, re-add if matches filter
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            if (row.status === 'available' && row.owner_id !== currentUser.id) {
              // maintain order by created_at desc
              const updated = [row, ...next];
              updated.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
              return updated;
            }
            return next;
          }
          return next; // for DELETE already removed
        });
      })
      .subscribe();

    return () => {
      isMounted = false;
      supabase.removeChannel(channel);
    };
  }, [currentUser.id]);

  const handlePurchaseSuccess = () => {
    toast.success('Purchase completed successfully!');
    // You might want to refresh the items list here
  };

  if (loading) {
    return (
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading items...</p>
      </div>
    );
  }

  return (
    <div className="text-white">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Marketplace</h1>
        <div className="rounded-lg bg-gray-800/60 ring-1 ring-white/10 px-4 py-2 text-sm">
          Balance: <span className="font-semibold text-indigo-400">{userData?.coins || 0} coins</span>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-300">No items available in the marketplace.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((item) => (
            <div key={item.id} className="rounded-lg bg-gray-800/60 backdrop-blur ring-1 ring-white/10 overflow-hidden">
              {item.imageUrl && (
                <img
                  src={item.imageUrl}
                  alt={item.title}
                  className="w-full h-48 object-cover"
                />
              )}
              <div className="p-4">
                <h3 className="text-lg font-semibold text-white">{item.title}</h3>
                <p className="text-sm text-gray-300 mt-1">{item.description}</p>
                <div className="mt-4 flex justify-between items-center">
                  <span className="text-indigo-400 font-semibold">{item.price} coins</span>
                  <PurchaseButton 
                    itemId={item.id} 
                    sellerId={item.ownerId} 
                    price={item.price}
                    onSuccess={handlePurchaseSuccess}
                  />
                </div>
                <div className="mt-2 text-sm text-gray-300">
                  Listed by: {item.seller_name}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}