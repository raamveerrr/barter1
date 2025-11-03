require('dotenv').config();
const express = require('express');
const admin = require('firebase-admin');
const path = require('path');

const app = express();
app.use(express.json());

// Initialize Firebase Admin if credentials are provided
let db = null;
try {
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    admin.initializeApp({
      credential: admin.credential.cert(require(process.env.GOOGLE_APPLICATION_CREDENTIALS))
    });
    db = admin.firestore();
    console.log('Firebase Admin initialized');
  } else {
    console.warn('GOOGLE_APPLICATION_CREDENTIALS not set — endpoints that require Firebase will fail.');
  }
} catch (err) {
  console.error('Firebase Admin init error:', err);
}

// Simple health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// NOTE: For demo only. In production prefer Cloud Functions and proper auth.
// Header-based user id (demo only): X-User-Id: <uid>
function getDemoUid(req) {
  return req.header('X-User-Id') || null;
}

// POST /api/reserve { itemId }
app.post('/api/reserve', async (req, res) => {
  const uid = getDemoUid(req);
  if (!uid) return res.status(401).json({ error: 'Missing X-User-Id header for demo auth' });
  const { itemId } = req.body;
  if (!itemId) return res.status(400).json({ error: 'itemId required' });

  if (!db) return res.status(500).json({ error: 'Firestore not initialized' });

  const itemRef = db.collection('items').doc(itemId);
  const TTL_MS = 5 * 60 * 1000; // 5 minutes
  const reservedUntil = admin.firestore.Timestamp.fromDate(new Date(Date.now() + TTL_MS));

  try {
    await db.runTransaction(async (tx) => {
      const snap = await tx.get(itemRef);
      if (!snap.exists) throw new Error('Item not found');
      const item = snap.data();
      if (item.status !== 'available') throw new Error('Item not available');
      if (item.reservedBy && item.reservedUntil && item.reservedUntil.toMillis() > Date.now()) {
        throw new Error('Item already reserved');
      }
      tx.update(itemRef, { reservedBy: uid, reservedUntil, status: 'reserved' });
    });
    return res.json({ success: true, reservedUntil: reservedUntil.toDate() });
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
});

// POST /api/buy { itemId, idempotencyKey }
app.post('/api/buy', async (req, res) => {
  const uid = getDemoUid(req);
  if (!uid) return res.status(401).json({ error: 'Missing X-User-Id header for demo auth' });
  const { itemId, idempotencyKey } = req.body;
  if (!itemId) return res.status(400).json({ error: 'itemId required' });

  if (!db) return res.status(500).json({ error: 'Firestore not initialized' });

  const itemRef = db.collection('items').doc(itemId);
  const userRef = db.collection('users').doc(uid);

  try {
    // Simple idempotency check
    if (idempotencyKey) {
      const prev = await db.collection('transactions').where('idempotencyKey', '==', idempotencyKey).limit(1).get();
      if (!prev.empty) return res.json({ success: true, note: 'Already processed', txnId: prev.docs[0].id });
    }

    const result = await db.runTransaction(async (tx) => {
      const itemSnap = await tx.get(itemRef);
      if (!itemSnap.exists) throw new Error('Item not found');
      const item = itemSnap.data();
      if (item.status !== 'available' && item.status !== 'reserved') throw new Error('Item not available');
      if (item.reservedBy && item.reservedBy !== uid) throw new Error('Reserved by another user');

      const buyerSnap = await tx.get(userRef);
      if (!buyerSnap.exists) throw new Error('Buyer user doc not found');
      const buyer = buyerSnap.data();
      const price = item.price || 0;
      if ((buyer.coinBalance || 0) < price) throw new Error('Insufficient coins');

      const sellerRef = db.collection('users').doc(item.ownerId);
      const sellerSnap = await tx.get(sellerRef);
      if (!sellerSnap.exists) throw new Error('Seller user not found');
      const seller = sellerSnap.data();

      const txnRef = db.collection('transactions').doc();
      const txnData = {
        txnId: txnRef.id,
        idempotencyKey: idempotencyKey || null,
        type: 'sale',
        amount: price,
        itemId,
        buyerId: uid,
        sellerId: item.ownerId,
        participants: [uid, item.ownerId],
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        status: 'completed'
      };

      tx.update(userRef, { coinBalance: (buyer.coinBalance || 0) - price });
      tx.update(sellerRef, { coinBalance: (seller.coinBalance || 0) + price });
      tx.update(itemRef, { status: 'sold', buyerId: uid, soldAt: admin.firestore.FieldValue.serverTimestamp(), reservedBy: null, reservedUntil: null });
      tx.set(txnRef, txnData);

      return { txnId: txnRef.id };
    });

    return res.json({ success: true, txnId: result.txnId });
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
});

// POST /api/signup-bonus { uid, email }
app.post('/api/signup-bonus', async (req, res) => {
  const { uid, email } = req.body;
  if (!uid || !email) return res.status(400).json({ error: 'uid and email required' });
  if (!db) return res.status(500).json({ error: 'Firestore not initialized' });

  const domainOk = /@vitap\.edu\.in$/i.test(email);
  const userRef = db.collection('users').doc(uid);

  try {
    await db.runTransaction(async (tx) => {
      const snap = await tx.get(userRef);
      if (snap.exists) return; // already initialized
      const startingCoins = domainOk ? 100 : 0;
      tx.set(userRef, {
        uid,
        email,
        coinBalance: startingCoins,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        role: domainOk ? 'student' : 'guest'
      });

      if (startingCoins > 0) {
        const txnRef = db.collection('transactions').doc();
        tx.set(txnRef, {
          txnId: txnRef.id,
          type: 'signup_bonus',
          amount: startingCoins,
          currency: 'coins',
          buyerId: null,
          sellerId: null,
          participants: [uid],
          timestamp: admin.firestore.FieldValue.serverTimestamp(),
          status: 'completed'
        });
      }
    });

    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Backend listening on ${PORT}`));
