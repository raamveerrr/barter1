# Backend (Node + Express) — Barter

This backend is a minimal demo server that shows the transaction flows described earlier. In production, I recommend using Firebase Cloud Functions and callable functions with the Admin SDK for stronger security.

Quick start (PowerShell):

```powershell
cd .\backend
npm install
# Set path to your Firebase service account JSON
$env:GOOGLE_APPLICATION_CREDENTIALS = "C:\path\to\serviceAccountKey.json"
npm run dev
```

Endpoints (demo):
- GET /api/health — health check
- POST /api/reserve { itemId } — reserve an item (header X-User-Id required)
- POST /api/buy { itemId, idempotencyKey } — buy an item (header X-User-Id required)
- POST /api/signup-bonus { uid, email } — initialize user with signup bonus (demo)

Auth: For demo only we use `X-User-Id` header to identify the caller. Replace with real Firebase Auth on the frontend and verify ID tokens server-side for production.

Notes:
- Add your Firebase service account JSON and set the `GOOGLE_APPLICATION_CREDENTIALS` environment variable.
- This server uses Firestore via Firebase Admin SDK; it will fail if Admin SDK is not initialized.
