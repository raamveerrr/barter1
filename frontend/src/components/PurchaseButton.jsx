import React, { useState, useEffect } from 'react';
import supabase from '../config/supabase';
import { useAuth } from '../contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { FaCoins, FaCheckCircle, FaSpinner } from 'react-icons/fa';

// ConfirmationModal Component
const ConfirmationModal = ({ price, onConfirm, onCancel, isLoading, error }) => (
  <motion.div
    className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    onClick={(e) => e.target === e.currentTarget && !isLoading && onCancel()}
  >
    <motion.div
      className="w-full max-w-sm rounded-lg bg-gray-800/95 ring-1 ring-white/10 p-6 shadow-xl"
      initial={{ scale: 0.95, y: 20 }}
      animate={{ scale: 1, y: 0 }}
      exit={{ scale: 0.95, y: 20 }}
      onClick={(e) => e.stopPropagation()}
    >
      <h3 className="text-lg font-semibold text-white">Confirm Purchase</h3>
      <p className="mt-2 text-sm text-gray-300">
        Are you sure you want to purchase this item for{' '}
        <span className="font-semibold text-indigo-400">{price} coins</span>{' '}
        <FaCoins className="inline text-yellow-400" />?
      </p>
      {error && (
        <motion.p
          className="mt-3 text-sm text-red-400"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {error}
        </motion.p>
      )}
      <div className="mt-6 flex justify-end gap-3">
        <button
          onClick={onCancel}
          disabled={isLoading}
          className="rounded-md border border-gray-600 bg-gray-700/50 px-4 py-2 text-sm font-medium text-gray-300 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Cancel
        </button>
        <button
          onClick={onConfirm}
          disabled={isLoading}
          className="inline-flex items-center gap-2 rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:bg-indigo-400 disabled:cursor-not-allowed"
        >
          {isLoading && <FaSpinner className="animate-spin" />}
          {isLoading ? 'Processing…' : 'Confirm'}
        </button>
      </div>
    </motion.div>
  </motion.div>
);

// TransactionSuccessSplash Component
const TransactionSuccessSplash = ({ amount, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 2500); // Show for 2.5 seconds
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <motion.div
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-gradient-to-b from-gray-900 via-gray-900 to-black"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-indigo-600/30 via-fuchsia-500/20 to-transparent" />
      
      <motion.div
        className="flex flex-col items-center"
        initial={{ scale: 0.8, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.4, delay: 0.2, type: 'spring', stiffness: 200 }}
        >
          <FaCheckCircle className="text-7xl sm:text-8xl text-green-400 drop-shadow-[0_0_30px_rgba(74,222,128,0.5)]" />
        </motion.div>
        
        <motion.h2
          className="mt-6 text-3xl sm:text-4xl font-extrabold text-white"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.4 }}
        >
          Transaction Successful!
        </motion.h2>
        
        <motion.div
          className="mt-4 flex items-center gap-2 text-xl sm:text-2xl font-semibold text-indigo-400"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.6 }}
        >
          <span>You've spent</span>
          <span className="text-yellow-400">{amount}</span>
          <FaCoins className="text-yellow-400" />
        </motion.div>
      </motion.div>
    </motion.div>
  );
};

// PurchaseButton Component
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
      if (rpcError) {
        throw new Error(rpcError.message || 'Purchase failed');
      }
      
      if (!data || !data.success) {
        throw new Error('Purchase failed. Please try again.');
      }
      
      setShowModal(false);
      setShowSuccess(true);
      
      if (onSuccess) {
        onSuccess(data);
      }
    } catch (err) {
      console.error('Purchase failed:', err);
      const errorMessage = err.message || err.error?.message || 'Failed to complete purchase. Please try again.';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <button 
        onClick={() => {
          setShowModal(true);
          setError(null);
        }} 
        className="inline-flex items-center gap-2 rounded-md bg-indigo-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
      >
        <FaCoins className="text-yellow-400" /> Buy for {price}
      </button>

      <AnimatePresence>
        {showModal && (
          <ConfirmationModal
            price={price}
            onConfirm={handlePurchase}
            onCancel={() => {
              if (!isLoading) {
                setShowModal(false);
                setError(null);
              }
            }}
            isLoading={isLoading}
            error={error}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showSuccess && (
          <TransactionSuccessSplash
            amount={price}
            onClose={() => setShowSuccess(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
};

export default PurchaseButton;
