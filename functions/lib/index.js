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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteListing = exports.updateItemListing = exports.createListing = exports.processPurchaseItemCallable = exports.processPurchaseItem = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const marketplaceService_1 = require("./services/marketplace/marketplaceService");
// Initialize Firebase Admin
admin.initializeApp();
// Firestore instance
const db = admin.firestore();
/**
 * Processes an item purchase
 */
// CORS middleware
const cors_1 = __importDefault(require("cors"));
const corsHandler = (0, cors_1.default)({ origin: true });
// Helper to handle CORS preflight
const handleCors = (req, res, next) => {
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if (req.method === 'OPTIONS') {
        res.status(204).send('');
        return;
    }
    next();
};
exports.processPurchaseItem = functions.https.onRequest(async (req, res) => {
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
                const { itemId, campusId, idempotencyKey } = req.body;
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
                    const result = await (0, marketplaceService_1.processPurchase)(userId, itemId, campusId, idempotencyKey);
                    // Send success response
                    res.status(200).json({ success: true, data: result });
                }
                catch (authError) {
                    console.error('Authentication error:', authError);
                    res.status(401).json({ success: false, error: 'Unauthorized - Invalid token' });
                }
            }
            catch (error) {
                const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
                console.error('Purchase error:', error);
                res.status(500).json({
                    success: false,
                    error: errorMessage
                });
            }
        });
    });
});
// Keep the original callable function for backward compatibility
exports.processPurchaseItemCallable = functions
    .region('us-central1')
    .runWith({
    cors: true,
})
    .https.onCall(async (data, context) => {
    // Verify authentication
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'You must be logged in to make a purchase');
    }
    const { itemId, campusId, idempotencyKey } = data;
    const buyerId = context.auth.uid;
    if (!itemId || !campusId) {
        throw new functions.https.HttpsError('invalid-argument', 'itemId and campusId are required');
    }
    try {
        const result = await (0, marketplaceService_1.processPurchase)(buyerId, itemId, campusId, idempotencyKey);
        return {
            success: true,
            transactionId: result.transactionId
        };
    }
    catch (error) {
        console.error('Purchase error:', error);
        throw new functions.https.HttpsError('internal', error instanceof Error ? error.message : 'Failed to process purchase');
    }
});
/**
 * Lists a new item for sale
 */
exports.createListing = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'You must be logged in to list an item');
    }
    try {
        const result = await (0, marketplaceService_1.listItem)(context.auth.uid, data.campusId, data);
        return { success: true, itemId: result.itemId };
    }
    catch (error) {
        console.error('Create listing error:', error);
        const errorMessage = error instanceof Error ? error.message : 'Failed to create listing';
        throw new functions.https.HttpsError('internal', errorMessage);
    }
});
/**
 * Updates an existing listing
 */
exports.updateItemListing = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'You must be logged in to update a listing');
    }
    try {
        await (0, marketplaceService_1.updateListing)(context.auth.uid, data.itemId, data.campusId, data.updates);
        return { success: true };
    }
    catch (error) {
        console.error('Update listing error:', error);
        const errorMessage = error instanceof Error ? error.message : 'Failed to update listing';
        throw new functions.https.HttpsError('internal', errorMessage);
    }
});
/**
 * Removes a listing
 */
exports.deleteListing = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'You must be logged in to remove a listing');
    }
    try {
        await (0, marketplaceService_1.removeListing)(context.auth.uid, data.itemId, data.campusId);
        return { success: true };
    }
    catch (error) {
        console.error('Remove listing error:', error);
        const errorMessage = error instanceof Error ? error.message : 'Failed to remove listing';
        throw new functions.https.HttpsError('internal', errorMessage);
    }
});
//# sourceMappingURL=index.js.map