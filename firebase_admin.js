// firebase_admin.js
const admin = require("firebase-admin");

// Usa UMA env var só (recomendo esta)
const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
if (!raw) {
  throw new Error("Faltou a env FIREBASE_SERVICE_ACCOUNT no Render");
}

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(JSON.parse(raw)),
  });
}

const firestore = admin.firestore();

module.exports = { admin, firestore };
