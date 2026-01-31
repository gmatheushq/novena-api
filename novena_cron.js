const cron = require("node-cron");
const { admin, firestore } = require("./firebase_admin");

function ordinalPt(day) {
  const map = {
    1: "primeiro",
    2: "segundo",
    3: "terceiro",
    4: "quarto",
    5: "quinto",
    6: "sexto",
    7: "sétimo",
    8: "oitavo",
    9: "nono",
  };
  return map[day] || `${day}º`;
}

/**
 * 🔔 Verifica novenas não rezadas e envia push
 * @param {"manha"|"noite"} periodo
 */
async function verificarNovenas(periodo) {
  console.log(`[CRON] Verificando novenas (${periodo})`);

  const todayKey = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

  const usersSnap = await firestore
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

    const day = Number(novena.day || 1);
    const titulo = (novena.title || "").trim() || "sua novena";

    const diaTxt = ordinalPt(day);

    // Você pediu: sem “novena a ...” extra — o título já tem “NOVENA...”
    const body =
      periodo === "manha"
        ? `Reze o ${diaTxt} dia da ${titulo}.`
        : `Não se esqueça de rezar o ${diaTxt} dia da ${titulo}.`;

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
 * ⏰ CRONS (America/Sao_Paulo)
 * 10:00 → manhã
 * 20:30 → noite
 */
cron.schedule("0 10 * * *", () => verificarNovenas("manha"), {
  timezone: "America/Sao_Paulo",
});

cron.schedule("30 20 * * *", () => verificarNovenas("noite"), {
  timezone: "America/Sao_Paulo",
});

console.log("⏰ Cron da Novena iniciado");
