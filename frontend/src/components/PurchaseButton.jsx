import React, { useState } from 'react';
import supabase from '../config/supabase';
import { useAuth } from '../contexts/AuthContext';
import { FaCoins } from 'react-icons/fa';

// Components (Tailwind-based, consistent with app styles)
const ConfirmationModal = ({ price, onConfirm, onCancel, isLoading, error }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={(e) => e.target === e.currentTarget && !isLoading && onCancel()}>
    <div className="w-full max-w-sm rounded-lg bg-white p-6 shadow">
      <h3 className="text-lg font-semibold text-gray-900">Confirm Purchase</h3>
      <p className="mt-2 text-sm text-gray-600">Are you sure you want to purchase this item for <span className="font-semibold text-indigo-600">{price} coins</span> <FaCoins className="inline text-yellow-500" />?</p>
      {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
      <div className="mt-6 flex justify-end gap-3">
        <button onClick={onCancel} disabled={isLoading} className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60">Cancel</button>
        <button onClick={onConfirm} disabled={isLoading} className="inline-flex items-center gap-2 rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:bg-indigo-400">
          {isLoading ? 'Processing…' : 'Confirm'}
        </button>
      </div>
    </div>
  </div>
);

const PurchaseButton = ({ itemId, sellerId, price, onSuccess }) => {
  const [showModal, setShowModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const { currentUser } = useAuth();

  const handlePurchase = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      if (!currentUser) throw new Error('You must be logged in to purchase');
      const { data, error: rpcError } = await supabase.rpc('process_purchase', {
        p_buyer: currentUser.id,
        p_item: itemId
      });
      if (rpcError) throw rpcError;
      setShowSuccess(true);
      setShowModal(false);
      
      // Call the onSuccess callback if provided
      if (onSuccess) {
        onSuccess(data);
      }
    } catch (err) {
      console.error('Purchase failed:', err);
      setError(err.message || 'Failed to complete purchase. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuccessAnimationEnd = () => {
    setShowSuccess(false);
  };

  return (
    <>
      <button onClick={() => setShowModal(true)} className="inline-flex items-center gap-2 rounded-md bg-indigo-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500">
        <FaCoins className="text-yellow-400" /> Buy for {price}
      </button>

      {showModal && (
        <ConfirmationModal
          price={price}
          onConfirm={handlePurchase}
          onCancel={() => !isLoading && setShowModal(false)}
          isLoading={isLoading}
          error={error}
        />
      )}

      {/* Success splash removed for consistency; rely on page updates/toasts */}
    </>
  );
};

export default PurchaseButton;
