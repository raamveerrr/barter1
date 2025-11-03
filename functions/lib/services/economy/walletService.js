"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.processPurchase = exports.chargeListingFee = exports.transferCoins = exports.getWalletBalance = void 0;
const admin = __importStar(require("firebase-admin"));
const economy_1 = require("../../types/economy");
const db = admin.firestore();
const WALLET_PATH = (userId) => `users/${userId}/economy/wallet`;
const TXN_PATH = (userId, txnId) => `users/${userId}/economy/transactions/${txnId}`;
const GLOBAL_TXN_PATH = (txnId) => `globalTransactions/${txnId}`;
/**
 * Get user's wallet balance
 */
const getWalletBalance = async (userId) => {
    var _a;
    const walletDoc = await db.doc(WALLET_PATH(userId)).get();
    return walletDoc.exists ? (((_a = walletDoc.data()) === null || _a === void 0 ? void 0 : _a.balance) || 0) : 0;
};
exports.getWalletBalance = getWalletBalance;
const transferCoins = async (fromUserId, toUserId, amount, type, metadata = {}) => {
    if (amount <= 0)
        return { success: false, error: 'Amount must be positive' };
    if (fromUserId === toUserId)
        return { success: false, error: 'Cannot transfer to self' };
    const txnRef = db.collection('globalTransactions').doc();
    const txnId = txnRef.id;
    const now = admin.firestore.FieldValue.serverTimestamp();
    try {
        await db.runTransaction(async (transaction) => {
            var _a;
            // 1. Verify sender has sufficient balance (unless it's a system transaction)
            if (fromUserId !== 'system') {
                const fromWalletRef = db.doc(WALLET_PATH(fromUserId));
                const fromWallet = await transaction.get(fromWalletRef);
                const currentBalance = fromWallet.exists ? ((_a = fromWallet.data()) === null || _a === void 0 ? void 0 : _a.balance) || 0 : 0;
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
                transaction.set(toWalletRef, {
                    balance: admin.firestore.FieldValue.increment(amount),
                    lastUpdated: now,
                    userId: toUserId
                }, { merge: true });
            }
            // 3. Create transaction records
            const txnData = {
                type,
                amount,
                fromUserId,
                toUserId,
                status: economy_1.TransactionStatus.COMPLETED,
                metadata,
                createdAt: now,
                updatedAt: now
            };
            // Save to global transactions
            transaction.set(txnRef, txnData);
            // Save to sender's transaction history (if not system)
            if (fromUserId !== 'system') {
                transaction.set(db.doc(TXN_PATH(fromUserId, txnId)), Object.assign(Object.assign({}, txnData), { isDebit: true }));
            }
            // Save to recipient's transaction history (if not system)
            if (toUserId !== 'system') {
                transaction.set(db.doc(TXN_PATH(toUserId, txnId)), Object.assign(Object.assign({}, txnData), { isDebit: false }));
            }
        });
        return {
            success: true,
            transactionId: txnRef.id
        };
    }
    catch (error) {
        console.error('Transfer failed:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Transfer failed'
        };
    }
};
exports.transferCoins = transferCoins;
/**
 * Charge a listing fee when a user lists an item
 */
const chargeListingFee = async (userId, itemId, feeAmount) => {
    return (0, exports.transferCoins)(userId, 'system', feeAmount, economy_1.TransactionType.LISTING_FEE, { itemId, listingFee: feeAmount });
};
exports.chargeListingFee = chargeListingFee;
/**
 * Process a purchase between buyer and seller
 */
const processPurchase = async (buyerId, sellerId, amount, itemId, platformFeeRate = 0.05 // 5% platform fee
) => {
    const platformFee = Math.round(amount * platformFeeRate);
    const sellerAmount = amount - platformFee;
    // Transfer amount from buyer to platform (as escrow)
    const transferResult = await (0, exports.transferCoins)(buyerId, 'system', amount, economy_1.TransactionType.ITEM_PURCHASE, { itemId, status: 'pending' });
    if (!transferResult.success) {
        return transferResult;
    }
    // If successful, transfer from platform to seller (minus fees)
    return (0, exports.transferCoins)('system', sellerId, sellerAmount, economy_1.TransactionType.ITEM_PURCHASE, {
        itemId,
        originalAmount: amount,
        platformFee,
        netAmount: sellerAmount
    });
};
exports.processPurchase = processPurchase;
//# sourceMappingURL=walletService.js.map