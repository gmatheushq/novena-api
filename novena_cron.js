const cron = require("node-cron");
const { db, messaging } = require("./firebase");
const admin = require("firebase-admin");
const cron = require("node-cron");

// ⚠️ Inicializa Firebase Admin UMA VEZ
if (!admin.apps.length) {
  const serviceAccount = JSON.parse(
    process.env.FIREBASE_SERVICE_ACCOUNT_JSON
  );

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();

/**
 * 🔔 Verifica novenas não rezadas e envia push
 * @param {"manha"|"noite"} periodo
 */
async function verificarNovenas(periodo) {
  console.log(`[CRON] Verificando novenas (${periodo})`);

  const hoje = new Date();
  const todayKey = hoje.toISOString().slice(0, 10); // YYYY-MM-DD

  const usersSnap = await db
    .collection("users")
    .where("novena.active", "==", true)
    .get();

  for (const doc of usersSnap.docs) {
    const user = doc.data();
    const uid = doc.id;

    const novena = user.novena;
    if (!novena) continue;

    // Se já rezou hoje, não notifica
    if (novena.lastPrayedDate === todayKey) continue;

    const token = user.fcmToken;
    if (!token) continue;

    const dia = novena.day || 1;
    const titulo = novena.title || "sua novena";

    const body =
      periodo === "manha"
        ? `Reze o ${dia}º dia da ${titulo}.`
        : `Não se esqueça de rezar o ${dia}º dia da ${titulo}.`;

    try {
      await admin.messaging().send({
        token,
        notification: {
          title: "Minha Jornada",
          body,
        },
        data: {
          screen: "jornada",
          focus: "novena",
        },
        android: { priority: "high" },
        apns: { payload: { aps: { sound: "default" } } },
      });

      console.log(`🔔 Push enviado para ${uid}`);
    } catch (e) {
      console.error(`❌ Erro push ${uid}`, e.message);
    }
  }
}

/**
 * ⏰ CRONS
 * 10:00 → manhã
 * 20:30 → noite
 */

// ⏰ 10:00
cron.schedule(
  "0 10 * * *",
  () => verificarNovenas("manha"),
  { timezone: "America/Sao_Paulo" }
);

// ⏰ 20:30
cron.schedule(
  "30 20 * * *",
  () => verificarNovenas("noite"),
  { timezone: "America/Sao_Paulo" }
);

console.log("⏰ Cron da Novena iniciado");
