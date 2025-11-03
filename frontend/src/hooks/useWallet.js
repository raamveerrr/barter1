import { useState, useEffect } from 'react';
import { 
  doc, 
  collection, 
  query, 
  orderBy, 
  limit, 
  onSnapshot, 
  getDoc 
} from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { db, functions } from '../config/firebase';

export function useWallet(user) {
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Real-time balance updates
  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const walletRef = doc(db, 'users', user.uid, 'economy', 'wallet');
    const unsubscribe = onSnapshot(
      walletRef,
      (doc) => {
        if (doc.exists()) {
          setBalance(doc.data().balance || 0);
        }
        setLoading(false);
      },
      (err) => {
        console.error('Error fetching wallet:', err);
        setError('Failed to load wallet data');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  // Load transaction history
  useEffect(() => {
    if (!user) return;

    const transactionsRef = collection(db, 'users', user.uid, 'economy', 'wallet', 'transactions');
    const q = query(transactionsRef, orderBy('createdAt', 'desc'), limit(50));
    
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const txs = [];
        snapshot.forEach((doc) => {
          txs.push({ id: doc.id, ...doc.data() });
        });
        setTransactions(txs);
      },
      (err) => {
        console.error('Error fetching transactions:', err);
        setError('Failed to load transaction history');
      }
    );

    return () => unsubscribe();
  }, [user]);

  // Function to refresh wallet data
  const refreshWallet = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const walletRef = doc(db, 'users', user.uid, 'economy', 'wallet');
      const walletDoc = await getDoc(walletRef);
      if (walletDoc.exists()) {
        setBalance(walletDoc.data().balance || 0);
      }
    } catch (err) {
      console.error('Error refreshing wallet:', err);
      setError('Failed to refresh wallet');
    } finally {
      setLoading(false);
    }
  };

  // Function to process a purchase
  const processPurchase = async (itemId, sellerId, amount) => {
    if (!user) throw new Error('User not authenticated');
    
    try {
      const processTrade = httpsCallable(functions, 'processTrade');
      const result = await processTrade({
        itemId,
        sellerId,
        amount,
        idempotencyKey: `purchase_${Date.now()}_${itemId}`
      });
      
      return result.data;
    } catch (error) {
      console.error('Purchase failed:', error);
      throw new Error(error.message || 'Failed to process purchase');
    }
  };

  // Function to list an item for sale
  const listItem = async (itemData) => {
    if (!user) throw new Error('User not authenticated');
    
    try {
      const listItemFn = httpsCallable(functions, 'listItem');
      const result = await listItemFn({
        ...itemData,
        ownerId: user.uid,
        status: 'available',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      
      return result.data;
    } catch (error) {
      console.error('Failed to list item:', error);
      throw new Error(error.message || 'Failed to list item');
    }
  };

  return {
    balance,
    transactions,
    loading,
    error,
    refreshWallet,
    processPurchase,
    listItem,
  };
}

export default useWallet;
