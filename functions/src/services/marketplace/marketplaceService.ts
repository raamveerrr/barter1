import * as admin from 'firebase-admin';
import { TransactionType } from '../../types/economy';
import { transferCoins } from '../economy/walletService';

const db = admin.firestore();

/**
 * Lists a new item for sale
 */
export const listItem = async (
  userId: string,
  campusId: string,
  itemData: any
) => {
  const itemRef = db.collection(`campus/${campusId}/items`).doc();
  const now = admin.firestore.FieldValue.serverTimestamp();
  
  const item = {
    ...itemData,
    id: itemRef.id,
    ownerId: userId,
    campusId,
    status: 'available',
    createdAt: now,
    updatedAt: now,
  };

  await itemRef.set(item);
  return { success: true, itemId: itemRef.id };
};

/**
 * Processes an item purchase
 */
export const processPurchase = async (
  buyerId: string,
  itemId: string,
  campusId: string,
  idempotencyKey?: string
) => {
  return await db.runTransaction(async (transaction) => {
    // 1. Get the item
    const itemRef = db.doc(`campus/${campusId}/items/${itemId}`);
    const itemDoc = await transaction.get(itemRef);
    
    if (!itemDoc.exists) {
      throw new Error('Item not found');
    }
    
    const item = itemDoc.data()!;
    
    // 2. Validate item is available
    if (item.status !== 'available') {
      throw new Error('Item is not available for purchase');
    }
    
    // 3. Prevent self-purchase
    if (item.ownerId === buyerId) {
      throw new Error('Cannot purchase your own item');
    }
    
    // 4. Process payment
    const transferResult = await transferCoins(
      buyerId,
      item.ownerId,
      item.price,
      TransactionType.ITEM_PURCHASE,
      {
        itemId,
        campusId,
        idempotencyKey,
        originalPrice: item.price,
        platformFee: Math.round(item.price * 0.05), // 5% platform fee
      }
    );
    
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

/**
 * Updates an item listing
 */
export const updateListing = async (
  userId: string,
  itemId: string,
  campusId: string,
  updates: Record<string, any>
) => {
  const itemRef = db.doc(`campus/${campusId}/items/${itemId}`);
  const itemDoc = await itemRef.get();
  
  if (!itemDoc.exists) {
    throw new Error('Item not found');
  }
  
  const item = itemDoc.data()!;
  
  // Verify ownership
  if (item.ownerId !== userId) {
    throw new Error('You do not own this item');
  }
  
  // Prevent status changes through this function
  if ('status' in updates) {
    throw new Error('Cannot update status through this function');
  }
  
  // Update the item
  await itemRef.update({
    ...updates,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });
  
  return { success: true };
};

/**
 * Removes a listing
 */
export const removeListing = async (
  userId: string,
  itemId: string,
  campusId: string
) => {
  const itemRef = db.doc(`campus/${campusId}/market/items/${itemId}`);
  const itemDoc = await itemRef.get();
  
  if (!itemDoc.exists) {
    throw new Error('Item not found');
  }
  
  const item = itemDoc.data()!;
  
  // Verify ownership or admin
  if (item.ownerId !== userId && !(item as any).isAdmin) {
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
