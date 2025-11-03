import * as admin from 'firebase-admin';
import { Transaction, TransactionStatus, TransactionType } from '../../types/economy';

const db = admin.firestore();
const WALLET_PATH = (userId: string) => `users/${userId}/economy/wallet`;
const TXN_PATH = (userId: string, txnId: string) => `users/${userId}/economy/wallet/transactions/${txnId}`;
const GLOBAL_TXN_PATH = (txnId: string) => `globalTransactions/${txnId}`;

/**
 * Get user's wallet balance
 */
export const getWalletBalance = async (userId: string): Promise<number> => {
  const walletDoc = await db.doc(WALLET_PATH(userId)).get();
  return walletDoc.exists ? (walletDoc.data()?.balance || 0) : 0;
};

/**
 * Execute a secure coin transfer between users using Firestore transactions
 */
interface TransferResult {
  success: boolean;
  transactionId?: string;
  error?: string;
}

export const transferCoins = async (
  fromUserId: string,
  toUserId: string,
  amount: number,
  type: TransactionType,
  metadata: Record<string, any> = {}
): Promise<TransferResult> => {
  if (amount <= 0) return { success: false, error: 'Amount must be positive' };
  if (fromUserId === toUserId) return { success: false, error: 'Cannot transfer to self' };

  const txnRef = db.collection('globalTransactions').doc();
  const txnId = txnRef.id;
  const now = admin.firestore.FieldValue.serverTimestamp();
  
  try {
    await db.runTransaction(async (transaction) => {
      // 1. Verify sender has sufficient balance (unless it's a system transaction)
      if (fromUserId !== 'system') {
        const fromWalletRef = db.doc(WALLET_PATH(fromUserId));
        const fromWallet = await transaction.get(fromWalletRef);
        const currentBalance = fromWallet.exists ? fromWallet.data()?.balance || 0 : 0;
        
        if (currentBalance < amount) {
          throw new Error('Insufficient balance');
        }
        
        // Update sender's balance
        transaction.update(fromWalletRef, {
          balance: admin.firestore.FieldValue.increment(-amount),
          lastUpdated: now
        });
      }

      // 2. Update recipient's balance (if not system)
      if (toUserId !== 'system') {
        const toWalletRef = db.doc(WALLET_PATH(toUserId));
        transaction.set(toWalletRef, 
          {
            balance: admin.firestore.FieldValue.increment(amount),
            lastUpdated: now,
            userId: toUserId
          },
          { merge: true }
        );
      }

      // 3. Create transaction records
      const txnData: Omit<Transaction, 'id'> = {
        type,
        amount,
        fromUserId,
        toUserId,
        status: TransactionStatus.COMPLETED,
        metadata,
        createdAt: now as any,
        updatedAt: now as any
      };

      // Save to global transactions
      transaction.set(txnRef, txnData);

      // Save to sender's transaction history (if not system)
      if (fromUserId !== 'system') {
        transaction.set(
          db.doc(TXN_PATH(fromUserId, txnId)),
          { ...txnData, isDebit: true }
        );
      }

      // Save to recipient's transaction history (if not system)
      if (toUserId !== 'system') {
        transaction.set(
          db.doc(TXN_PATH(toUserId, txnId)),
          { ...txnData, isDebit: false }
        );
      }
    });

    return { 
      success: true, 
      transactionId: txnRef.id 
    };
  } catch (error) {
    console.error('Transfer failed:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Transfer failed' 
    };
  }
};

/**
 * Charge a listing fee when a user lists an item
 */
export const chargeListingFee = async (
  userId: string,
  itemId: string,
  feeAmount: number
) => {
  return transferCoins(
    userId,
    'system',
    feeAmount,
    TransactionType.LISTING_FEE,
    { itemId, listingFee: feeAmount }
  );
};

/**
 * Process a purchase between buyer and seller
 */
export const processPurchase = async (
  buyerId: string,
  sellerId: string,
  amount: number,
  itemId: string,
  platformFeeRate: number = 0.05 // 5% platform fee
) => {
  const platformFee = Math.round(amount * platformFeeRate);
  const sellerAmount = amount - platformFee;

  // Transfer amount from buyer to platform (as escrow)
  const transferResult = await transferCoins(
    buyerId,
    'system',
    amount,
    TransactionType.ITEM_PURCHASE,
    { itemId, status: 'pending' }
  );

  if (!transferResult.success) {
    return transferResult;
  }

  // If successful, transfer from platform to seller (minus fees)
  return transferCoins(
    'system',
    sellerId,
    sellerAmount,
    TransactionType.ITEM_PURCHASE,
    { 
      itemId, 
      originalAmount: amount,
      platformFee,
      netAmount: sellerAmount
    }
  );
};
