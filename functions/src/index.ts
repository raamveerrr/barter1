import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { processPurchase, listItem, updateListing, removeListing } from './services/marketplace/marketplaceService';

// Initialize Firebase Admin
admin.initializeApp();

// Firestore instance
const db = admin.firestore();

// Type definitions
interface PurchaseRequest {
  itemId: string;
  campusId: string;
  idempotencyKey?: string;
}

interface ListItemRequest {
  campusId: string;
  title: string;
  description: string;
  price: number;
  category: string;
  photos: string[];
  tags?: string[];
}

interface UpdateListingRequest {
  itemId: string;
  campusId: string;
  updates: {
    title?: string;
    description?: string;
    price?: number;
    category?: string;
    photos?: string[];
    tags?: string[];
  };
}

interface RemoveListingRequest {
  itemId: string;
  campusId: string;
}

interface BaseResponse {
  success: boolean;
  error?: string;
}

/**
 * Processes an item purchase
 */
// CORS middleware
import cors from 'cors';

const corsHandler = cors({ origin: true });
// Helper to handle CORS preflight
const handleCors = (req: any, res: any, next: any) => {
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }
  
  next();
};

export const processPurchaseItem = functions.https.onRequest(
  async (req: functions.https.Request, res: functions.Response<any>) => {
    // Handle CORS
    handleCors(req, res, () => {
      corsHandler(req, res, async () => {
        try {
          // Verify the request method
          if (req.method !== 'POST') {
            res.status(405).json({ success: false, error: 'Method not allowed' });
            return;
          }

          // Parse the request body
          const { itemId, campusId, idempotencyKey } = req.body as PurchaseRequest;
          
          // Get the Firebase auth token from the Authorization header
          const authHeader = req.headers.authorization;
          if (!authHeader || !authHeader.startsWith('Bearer ')) {
            res.status(401).json({ success: false, error: 'Unauthorized - No token provided' });
            return;
          }

          const idToken = authHeader.split('Bearer ')[1];
          
          try {
            // Verify the ID token
            const decodedToken = await admin.auth().verifyIdToken(idToken);
            const userId = decodedToken.uid;

            // Call the processPurchase function
            const result = await processPurchase(userId, itemId, campusId, idempotencyKey);
            
            // Send success response
            res.status(200).json({ success: true, data: result });
          } catch (authError) {
            console.error('Authentication error:', authError);
            res.status(401).json({ success: false, error: 'Unauthorized - Invalid token' });
          }
        } catch (error: unknown) {
          const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
          console.error('Purchase error:', error);
          res.status(500).json({ 
            success: false, 
            error: errorMessage 
          });
        }
      });
    });
  }
);

// Keep the original callable function for backward compatibility
export const processPurchaseItemCallable = functions
  .region('us-central1')
  .runWith({
    cors: true,
  })
  .https.onCall(
    async (data: PurchaseRequest, context: functions.https.CallableContext) => {
      // Verify authentication
      if (!context.auth) {
        throw new functions.https.HttpsError(
          'unauthenticated',
          'You must be logged in to make a purchase'
        );
      }

      const { itemId, campusId, idempotencyKey } = data;
      const buyerId = context.auth.uid;

      if (!itemId || !campusId) {
        throw new functions.https.HttpsError(
          'invalid-argument',
          'itemId and campusId are required'
        );
      }

      try {
        const result = await processPurchase(buyerId, itemId, campusId, idempotencyKey);
        return { 
          success: true, 
          transactionId: result.transactionId 
        };
      } catch (error) {
        console.error('Purchase error:', error);
        throw new functions.https.HttpsError(
          'internal',
          error instanceof Error ? error.message : 'Failed to process purchase'
        );
      }
    }
  );

/**
 * Lists a new item for sale
 */
export const createListing = functions.https.onCall(
  async (data: ListItemRequest, context: functions.https.CallableContext) => {
    if (!context.auth) {
      throw new functions.https.HttpsError(
        'unauthenticated',
        'You must be logged in to list an item'
      );
    }

    try {
      const result = await listItem(
        context.auth.uid,
        data.campusId,
        data
      );

      return { success: true, itemId: result.itemId };
    } catch (error: unknown) {
      console.error('Create listing error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to create listing';
      throw new functions.https.HttpsError('internal', errorMessage);
    }
  }
);

/**
 * Updates an existing listing
 */
export const updateItemListing = functions.https.onCall(
  async (data: UpdateListingRequest, context: functions.https.CallableContext) => {
    if (!context.auth) {
      throw new functions.https.HttpsError(
        'unauthenticated',
        'You must be logged in to update a listing'
      );
    }

    try {
      await updateListing(
        context.auth.uid,
        data.itemId,
        data.campusId,
        data.updates
      );
      
      return { success: true };
    } catch (error: unknown) {
      console.error('Update listing error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to update listing';
      throw new functions.https.HttpsError('internal', errorMessage);
    }
  }
);

/**
 * Removes a listing
 */
export const deleteListing = functions.https.onCall(
  async (data: RemoveListingRequest, context: functions.https.CallableContext) => {
    if (!context.auth) {
      throw new functions.https.HttpsError(
        'unauthenticated',
        'You must be logged in to remove a listing'
      );
    }

    try {
      await removeListing(
        context.auth.uid,
        data.itemId,
        data.campusId
      );
      
      return { success: true };
    } catch (error: unknown) {
      console.error('Remove listing error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to remove listing';
      throw new functions.https.HttpsError('internal', errorMessage);
    }
  }
);