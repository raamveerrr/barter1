import { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  limit, 
  onSnapshot,
  doc,
  getDoc
} from 'firebase/firestore';
import { db, functions } from '../config/firebase';
import { httpsCallable } from 'firebase/functions';

export function useMarketplace(campusId) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [item, setItem] = useState(null);
  const [userItems, setUserItems] = useState([]);

  // Fetch all items for the campus
  useEffect(() => {
    if (!campusId) return;
    
    setLoading(true);
    const itemsRef = collection(db, 'campus', campusId, 'items');
    const q = query(
      itemsRef,
      where('status', '==', 'available'),
      orderBy('createdAt', 'desc'),
      limit(50)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const itemsList = [];
        snapshot.forEach((doc) => {
          itemsList.push({ id: doc.id, ...doc.data() });
        });
        setItems(itemsList);
        setLoading(false);
      },
      (err) => {
        console.error('Error fetching items:', err);
        setError('Failed to load marketplace items');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [campusId]);

  // Fetch a single item by ID
  const getItem = async (itemId) => {
    if (!campusId || !itemId) return null;
    
    try {
      setLoading(true);
      const itemRef = doc(db, 'campus', campusId, 'items', itemId);
      const itemDoc = await getDoc(itemRef);
      
      if (!itemDoc.exists()) {
        throw new Error('Item not found');
      }
      
      const itemData = { id: itemDoc.id, ...itemDoc.data() };
      setItem(itemData);
      return itemData;
    } catch (err) {
      console.error('Error fetching item:', err);
      setError(err.message || 'Failed to load item');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Fetch items listed by current user
  const fetchUserItems = async (userId) => {
    if (!campusId || !userId) return;
    
    try {
      setLoading(true);
      const itemsRef = collection(db, 'campus', campusId, 'items');
      const q = query(
        itemsRef,
        where('ownerId', '==', userId),
        orderBy('createdAt', 'desc')
      );
      
      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const userItemsList = [];
          snapshot.forEach((doc) => {
            userItemsList.push({ id: doc.id, ...doc.data() });
          });
          setUserItems(userItemsList);
        },
        (err) => {
          console.error('Error fetching user items:', err);
          setError('Failed to load your listings');
        }
      );
      
      return unsubscribe;
    } catch (err) {
      console.error('Error in fetchUserItems:', err);
      setError('Failed to load your listings');
    } finally {
      setLoading(false);
    }
  };

  // Purchase an item
  const purchaseItem = async (itemId, sellerId, amount) => {
    try {
      setLoading(true);
      const processTrade = httpsCallable(functions, 'processTrade');
      const result = await processTrade({
        itemId,
        sellerId,
        amount,
        campusId,
        idempotencyKey: `purchase_${Date.now()}_${itemId}`
      });
      
      return result.data;
    } catch (error) {
      console.error('Purchase failed:', error);
      throw new Error(error.message || 'Failed to process purchase');
    } finally {
      setLoading(false);
    }
  };

  // List a new item for sale
  const listItem = async (itemData) => {
    try {
      setLoading(true);
      const listItemFn = httpsCallable(functions, 'listItem');
      const result = await listItemFn({
        ...itemData,
        campusId,
        status: 'available',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      
      return result.data;
    } catch (error) {
      console.error('Failed to list item:', error);
      throw new Error(error.message || 'Failed to list item');
    } finally {
      setLoading(false);
    }
  };

  // Update an existing listing
  const updateListing = async (itemId, updates) => {
    try {
      setLoading(true);
      const updateItemFn = httpsCallable(functions, 'updateItem');
      const result = await updateItemFn({
        itemId,
        campusId,
        updates: {
          ...updates,
          updatedAt: new Date().toISOString(),
        },
      });
      
      return result.data;
    } catch (error) {
      console.error('Failed to update listing:', error);
      throw new Error(error.message || 'Failed to update listing');
    } finally {
      setLoading(false);
    }
  };

  // Remove a listing
  const removeListing = async (itemId) => {
    try {
      setLoading(true);
      const removeItemFn = httpsCallable(functions, 'removeItem');
      const result = await removeItemFn({
        itemId,
        campusId,
      });
      
      return result.data;
    } catch (error) {
      console.error('Failed to remove listing:', error);
      throw new Error(error.message || 'Failed to remove listing');
    } finally {
      setLoading(false);
    }
  };

  return {
    items,
    item,
    userItems,
    loading,
    error,
    getItem,
    fetchUserItems,
    purchaseItem,
    listItem,
    updateListing,
    removeListing,
  };
}

export default useMarketplace;
