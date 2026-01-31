// firebase_admin.js
const admin = require("firebase-admin");

// Usa UMA env var só (recomendo esta)
const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
if (!raw) throw new Error("Faltou a env FIREBASE_SERVICE_ACCOUNT no Render");

const sa = JSON.parse(raw);

// se vier com "\\n" em vez de "\n"
if (sa.private_key && sa.private_key.includes("\\n")) {
  sa.private_key = sa.private_key.replace(/\\n/g, "\n");
}

admin.initializeApp({
  credential: admin.credential.cert(sa),
});


const firestore = admin.firestore();

module.exports = { admin, firestore };
