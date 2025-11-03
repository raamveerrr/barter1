import { useState, useEffect } from 'react';
import supabase from '../config/supabase';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

export default function MyItems() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAddingItem, setIsAddingItem] = useState(false);
  const { currentUser } = useAuth();

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [image, setImage] = useState(null);

  useEffect(() => {
    const campusId = 'default-campus';
    let isMounted = true;

    const load = async () => {
      const { data, error } = await supabase
        .from('items')
        .select('*')
        .eq('owner_id', currentUser.id)
        .eq('campus_id', campusId)
        .order('created_at', { ascending: false });
      if (!isMounted) return;
      if (!error) setItems(data || []);
      setLoading(false);
    };
    load();

    const channel = supabase
      .channel('realtime-myitems')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'items' }, (payload) => {
        const row = payload.new || payload.old;
        if (!row || row.owner_id !== currentUser.id || row.campus_id !== campusId) return;
        setItems((prev) => {
          const next = [...prev];
          const idx = next.findIndex(i => i.id === row.id);
          if (idx !== -1) next.splice(idx, 1);
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            const updated = [row, ...next];
            updated.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
            return updated;
          }
          return next; // DELETE handled by removal above
        });
      })
      .subscribe();

    return () => {
      isMounted = false;
      supabase.removeChannel(channel);
    };
  }, [currentUser.id]);

  const handleImageChange = (e) => {
    if (e.target.files[0]) {
      setImage(e.target.files[0]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      
      let image_url = '';
      if (image) {
        const filePath = `items/${currentUser.id}/${Date.now()}_${image.name}`;
        const { error: upErr } = await supabase.storage.from('items').upload(filePath, image, { upsert: true });
        if (upErr) throw upErr;
        const { data: pub } = supabase.storage.from('items').getPublicUrl(filePath);
        image_url = pub?.publicUrl || '';
      }

      const campus_id = 'default-campus';
      const { data: inserted, error } = await supabase.from('items').insert({
        title,
        description,
        price: Number(price),
        image_url,
        owner_id: currentUser.id,
        seller_name: currentUser.user_metadata?.display_name || currentUser.email,
        campus_id,
        status: 'available'
      }).select('*').single();
      if (error) throw error;
      // Optimistic refresh
      if (inserted) {
        setItems((prev) => [inserted, ...prev]);
      }

      setTitle('');
      setDescription('');
      setPrice('');
      setImage(null);
      setIsAddingItem(false);
      toast.success('Item listed successfully!');
    } catch (error) {
      toast.error('Failed to list item: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (itemId) => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      try {
        const { error } = await supabase.from('items').delete().eq('id', itemId);
        if (error) throw error;
        toast.success('Item deleted successfully!');
      } catch (error) {
        toast.error('Failed to delete item: ' + error.message);
      }
    }
  };

  if (loading && !isAddingItem) {
    return (
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading your items...</p>
      </div>
    );
  }

  return (
    <div className="text-white">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">My Items</h1>
        <button
          onClick={() => setIsAddingItem(!isAddingItem)}
          className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-500"
        >
          {isAddingItem ? 'Cancel' : 'Add New Item'}
        </button>
      </div>

      {isAddingItem && (
        <form onSubmit={handleSubmit} className="bg-gray-900/70 ring-1 ring-white/10 p-6 rounded-lg shadow mb-6">
          <div className="space-y-4">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-300">
                Title
              </label>
              <input
                type="text"
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="mt-1 block w-full rounded-md border-gray-700 bg-gray-800 text-white placeholder-gray-400 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
            </div>
            
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-300">
                Description
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                rows={3}
                className="mt-1 block w-full rounded-md border-gray-700 bg-gray-800 text-white placeholder-gray-400 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
            </div>
            
            <div>
              <label htmlFor="price" className="block text-sm font-medium text-gray-300">
                Price (in coins)
              </label>
              <input
                type="number"
                id="price"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                required
                min="1"
                className="mt-1 block w-full rounded-md border-gray-700 bg-gray-800 text-white placeholder-gray-400 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
            </div>
            
            <div>
              <label htmlFor="image" className="block text-sm font-medium text-gray-300">
                Image
              </label>
              <input
                type="file"
                id="image"
                accept="image/*"
                onChange={handleImageChange}
                className="mt-1 block w-full text-sm text-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-600/20 file:text-indigo-300 hover:file:bg-indigo-600/30"
              />
            </div>
            
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-600"
            >
              {loading ? 'Listing...' : 'List Item'}
            </button>
          </div>
        </form>
      )}

      {items.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-300">You haven't listed any items yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((item) => (
            <div key={item.id} className="rounded-lg bg-gray-800/60 backdrop-blur ring-1 ring-white/10 overflow-hidden">
              {item.image_url && (
                <img
                  src={item.image_url}
                  alt={item.title}
                  className="w-full h-48 object-cover"
                />
              )}
              <div className="p-4">
                <h3 className="text-lg font-semibold text-white">{item.title}</h3>
                <p className="text-sm text-gray-300 mt-1">{item.description}</p>
                <div className="mt-4 flex justify-between items-center">
                  <span className="text-indigo-400 font-semibold">{item.price} coins</span>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="text-red-400 hover:text-red-300"
                  >
                    Delete
                  </button>
                </div>
                <div className="mt-2 text-sm text-gray-300">Status: {item.status}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}