/**
 * Types for the economy system
 */

export enum TransactionType {
  LISTING_FEE = 'LISTING_FEE',
  ITEM_PURCHASE = 'ITEM_PURCHASE',
  ADMIN_CREDIT = 'ADMIN_CREDIT',
  ADMIN_DEBIT = 'ADMIN_DEBIT',
  REFUND = 'REFUND',
  WITHDRAWAL = 'WITHDRAWAL',
  DEPOSIT = 'DEPOSIT'
}

export enum TransactionStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED'
}

export interface Wallet {
  balance: number;
  lastUpdated: FirebaseFirestore.Timestamp;
  userId: string;
}

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  fromUserId: string | 'system';
  toUserId: string | 'system';
  status: TransactionStatus;
  metadata?: {
    itemId?: string;
    listingFee?: number;
    description?: string;
  };
  createdAt: FirebaseFirestore.Timestamp;
  updatedAt: FirebaseFirestore.Timestamp;
}

export interface EconomyConfig {
  listingFee: number;
  transactionFeeRate: number; // e.g., 0.05 for 5%
  minListingPrice: number;
  maxListingPrice: number;
  dailyWithdrawalLimit: number;
}
