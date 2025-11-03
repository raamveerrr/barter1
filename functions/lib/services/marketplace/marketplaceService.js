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
exports.removeListing = exports.updateListing = exports.processPurchase = exports.listItem = void 0;
const admin = __importStar(require("firebase-admin"));
const economy_1 = require("../../types/economy");
const walletService_1 = require("../economy/walletService");
const db = admin.firestore();
/**
 * Lists a new item for sale
 */
const listItem = async (userId, campusId, itemData) => {
    const itemRef = db.collection(`campus/${campusId}/items`).doc();
    const now = admin.firestore.FieldValue.serverTimestamp();
    const item = Object.assign(Object.assign({}, itemData), { id: itemRef.id, ownerId: userId, campusId, status: 'available', createdAt: now, updatedAt: now });
    await itemRef.set(item);
    return { success: true, itemId: itemRef.id };
};
exports.listItem = listItem;
/**
 * Processes an item purchase
 */
const processPurchase = async (buyerId, itemId, campusId, idempotencyKey) => {
    return await db.runTransaction(async (transaction) => {
        // 1. Get the item
        const itemRef = db.doc(`campus/${campusId}/items/${itemId}`);
        const itemDoc = await transaction.get(itemRef);
        if (!itemDoc.exists) {
            throw new Error('Item not found');
        }
        const item = itemDoc.data();
        // 2. Validate item is available
        if (item.status !== 'available') {
            throw new Error('Item is not available for purchase');
        }
        // 3. Prevent self-purchase
        if (item.ownerId === buyerId) {
            throw new Error('Cannot purchase your own item');
        }
        // 4. Process payment
        const transferResult = await (0, walletService_1.transferCoins)(buyerId, item.ownerId, item.price, economy_1.TransactionType.ITEM_PURCHASE, {
            itemId,
            campusId,
            idempotencyKey,
            originalPrice: item.price,
            platformFee: Math.round(item.price * 0.05), // 5% platform fee
        });
        if (!transferResult.success) {
            throw new Error(transferResult.error || 'Payment failed');
        }
        // 5. Update item status
        transaction.update(itemRef, {
            status: 'sold',
            buyerId,
            soldAt: admin.firestore.FieldValue.serverTimestamp(),
            soldPrice: item.price,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        return {
            success: true,
            transactionId: transferResult.transactionId,
            itemId: itemRef.id
        };
    });
};
exports.processPurchase = processPurchase;
/**
 * Updates an item listing
 */
const updateListing = async (userId, itemId, campusId, updates) => {
    const itemRef = db.doc(`campus/${campusId}/items/${itemId}`);
    const itemDoc = await itemRef.get();
    if (!itemDoc.exists) {
        throw new Error('Item not found');
    }
    const item = itemDoc.data();
    // Verify ownership
    if (item.ownerId !== userId) {
        throw new Error('You do not own this item');
    }
    // Prevent status changes through this function
    if ('status' in updates) {
        throw new Error('Cannot update status through this function');
    }
    // Update the item
    await itemRef.update(Object.assign(Object.assign({}, updates), { updatedAt: admin.firestore.FieldValue.serverTimestamp() }));
    return { success: true };
};
exports.updateListing = updateListing;
/**
 * Removes a listing
 */
const removeListing = async (userId, itemId, campusId) => {
    const itemRef = db.doc(`campus/${campusId}/market/items/${itemId}`);
    const itemDoc = await itemRef.get();
    if (!itemDoc.exists) {
        throw new Error('Item not found');
    }
    const item = itemDoc.data();
    // Verify ownership or admin
    if (item.ownerId !== userId && !item.isAdmin) {
        throw new Error('You do not have permission to remove this listing');
    }
    // Soft delete by marking as removed
    await itemRef.update({
        status: 'removed',
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        removedAt: admin.firestore.FieldValue.serverTimestamp(),
        removedBy: userId,
    });
    return { success: true };
};
exports.removeListing = removeListing;
//# sourceMappingURL=marketplaceService.js.map