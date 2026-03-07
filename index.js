/**
 * ============================================================
 *  EletricaPRO — Cloud Functions  (Firebase Functions v4 / Node 18)
 *  Funcionalidades:
 *    1. approvePro       – Callable: admin aprova solicitação PRO
 *    2. rejectPro        – Callable: admin rejeita solicitação PRO
 *    3. checkProExpiry   – Scheduled: toda meia-noite verifica expiração
 *    4. onProRequest     – Trigger Firestore: notifica admin por e-mail
 *    5. revokeProManual  – Callable: admin revoga PRO manualmente
 * ============================================================
 */

const functions = require("firebase-functions");
const admin     = require("firebase-admin");

admin.initializeApp();

const db = admin.firestore();

// ──────────────────────────────────────────────────────────────
//  CONFIG — edite conforme necessário
// ──────────────────────────────────────────────────────────────
const CONFIG = {
  // UID(s) de admin no Firebase Auth — apenas esses podem aprovar
  adminUids: ["SEU_UID_ADMIN_AQUI"],   // <-- substitua pelo seu UID

  // Duração dos planos em dias
  plans: {
    monthly:  30,
    annual:   365,
    lifetime: null   // null = sem expiração
  },

  // Preços exibidos (apenas referência para admin — não valida valor)
  prices: {
    monthly:  "R$ 19,90/mês",
    annual:   "R$ 149,90/ano",
    lifetime: "R$ 299,90 único"
  }
};

// ──────────────────────────────────────────────────────────────
//  HELPER: verifica se o chamador é admin
// ──────────────────────────────────────────────────────────────
function assertAdmin(context) {
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated", "Você precisa estar autenticado."
    );
  }
  if (!CONFIG.adminUids.includes(context.auth.uid)) {
    throw new functions.https.HttpsError(
      "permission-denied", "Acesso restrito a administradores."
    );
  }
}

// ──────────────────────────────────────────────────────────────
//  HELPER: calcula proUntil com base no plano
// ──────────────────────────────────────────────────────────────
function calcProUntil(plan) {
  const days = CONFIG.plans[plan];
  if (days === null) return null; // lifetime
  const d = new Date();
  d.setDate(d.getDate() + days);
  return admin.firestore.Timestamp.fromDate(d);
}

// ══════════════════════════════════════════════════════════════
//  1. approvePro
//     Chamada pelo admin para aprovar uma solicitação pendente
//     Payload: { requestId: string }
// ══════════════════════════════════════════════════════════════
exports.approvePro = functions.https.onCall(async (data, context) => {
  assertAdmin(context);

  const { requestId } = data;
  if (!requestId) {
    throw new functions.https.HttpsError("invalid-argument", "requestId obrigatório.");
  }

  const reqRef = db.collection("pro_requests").doc(requestId);
  const reqSnap = await reqRef.get();

  if (!reqSnap.exists) {
    throw new functions.https.HttpsError("not-found", "Solicitação não encontrada.");
  }

  const req = reqSnap.data();

  if (req.status === "approved") {
    return { success: true, message: "Já estava aprovado." };
  }

  const plan      = req.plan || "lifetime";
  const uid       = req.uid;
  const proUntil  = calcProUntil(plan);
  const now       = admin.firestore.FieldValue.serverTimestamp();

  // Batch: atualiza users/{uid} + pro_requests/{id}
  const batch = db.batch();

  const userRef = db.collection("users").doc(uid);
  batch.set(userRef, {
    pro:        true,
    proType:    plan,
    proUntil:   proUntil,
    proSince:   now,
    updatedAt:  now
  }, { merge: true });

  batch.update(reqRef, {
    status:     "approved",
    approvedAt: now,
    approvedBy: context.auth.uid,
    plan:       plan
  });

  await batch.commit();

  functions.logger.info(`PRO aprovado: uid=${uid} plan=${plan}`);

  return {
    success:  true,
    message:  `PRO ${plan} ativado para ${req.email || uid}`,
    plan,
    proUntil: proUntil ? proUntil.toDate().toISOString() : "vitalício"
  };
});

// ══════════════════════════════════════════════════════════════
//  2. rejectPro
//     Payload: { requestId: string, reason?: string }
// ══════════════════════════════════════════════════════════════
exports.rejectPro = functions.https.onCall(async (data, context) => {
  assertAdmin(context);

  const { requestId, reason = "Pagamento não confirmado." } = data;
  if (!requestId) {
    throw new functions.https.HttpsError("invalid-argument", "requestId obrigatório.");
  }

  const reqRef  = db.collection("pro_requests").doc(requestId);
  const reqSnap = await reqRef.get();

  if (!reqSnap.exists) {
    throw new functions.https.HttpsError("not-found", "Solicitação não encontrada.");
  }

  await reqRef.update({
    status:     "rejected",
    rejectedAt: admin.firestore.FieldValue.serverTimestamp(),
    rejectedBy: context.auth.uid,
    reason
  });

  functions.logger.info(`PRO rejeitado: requestId=${requestId}`);
  return { success: true, message: "Solicitação rejeitada." };
});

// ══════════════════════════════════════════════════════════════
//  3. revokeProManual
//     Admin revoga acesso PRO de um usuário
//     Payload: { uid: string, reason?: string }
// ══════════════════════════════════════════════════════════════
exports.revokeProManual = functions.https.onCall(async (data, context) => {
  assertAdmin(context);

  const { uid, reason = "Revogado pelo administrador." } = data;
  if (!uid) {
    throw new functions.https.HttpsError("invalid-argument", "uid obrigatório.");
  }

  const now = admin.firestore.FieldValue.serverTimestamp();

  await db.collection("users").doc(uid).set({
    pro:       false,
    proType:   null,
    proUntil:  null,
    revokedAt: now,
    revokedBy: context.auth.uid,
    revokeReason: reason,
    updatedAt: now
  }, { merge: true });

  functions.logger.info(`PRO revogado: uid=${uid} reason=${reason}`);
  return { success: true, message: `PRO revogado para uid=${uid}` };
});

// ══════════════════════════════════════════════════════════════
//  4. checkProExpiry — Agendado: todo dia às 01:00 (horário Brasília)
//     Marca pro=false para usuários com proUntil no passado
// ══════════════════════════════════════════════════════════════
exports.checkProExpiry = functions.pubsub
  .schedule("0 1 * * *")
  .timeZone("America/Sao_Paulo")
  .onRun(async () => {
    const now    = admin.firestore.Timestamp.now();
    const snap   = await db.collection("users")
      .where("pro", "==", true)
      .where("proType", "in", ["monthly", "annual"])
      .where("proUntil", "<=", now)
      .get();

    if (snap.empty) {
      functions.logger.info("checkProExpiry: nenhum PRO expirado.");
      return null;
    }

    const batch = db.batch();
    snap.docs.forEach(doc => {
      batch.update(doc.ref, {
        pro:      false,
        expiredAt: now,
        updatedAt: now
      });
      functions.logger.info(`PRO expirado: uid=${doc.id}`);
    });

    await batch.commit();
    functions.logger.info(`checkProExpiry: ${snap.size} usuário(s) expirado(s).`);
    return null;
  });

// ══════════════════════════════════════════════════════════════
//  5. onProRequest — Trigger: nova solicitação criada
//     Grava log estruturado (pode ser estendido para e-mail/push)
// ══════════════════════════════════════════════════════════════
exports.onProRequest = functions.firestore
  .document("pro_requests/{docId}")
  .onCreate(async (snap, context) => {
    const data = snap.data();
    functions.logger.info("Nova solicitação PRO recebida", {
      docId:     context.params.docId,
      uid:       data.uid,
      email:     data.email,
      plan:      data.plan,
      createdAt: data.createdAt
    });

    // ── Opcional: grave um documento de notificação para o admin ──
    await db.collection("admin_notifications").add({
      type:      "pro_request",
      requestId: context.params.docId,
      uid:       data.uid,
      email:     data.email,
      plan:      data.plan,
      planLabel: CONFIG.prices[data.plan] || data.plan,
      read:      false,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    return null;
  });

// ══════════════════════════════════════════════════════════════
//  6. renewPro (Callable) — Admin renova assinatura de um usuário
//     Payload: { uid: string, plan: 'monthly'|'annual' }
// ══════════════════════════════════════════════════════════════
exports.renewPro = functions.https.onCall(async (data, context) => {
  assertAdmin(context);

  const { uid, plan } = data;
  if (!uid || !plan) {
    throw new functions.https.HttpsError("invalid-argument", "uid e plan são obrigatórios.");
  }
  if (!["monthly", "annual", "lifetime"].includes(plan)) {
    throw new functions.https.HttpsError("invalid-argument", "plan inválido.");
  }

  const proUntil = calcProUntil(plan);
  const now      = admin.firestore.FieldValue.serverTimestamp();

  await db.collection("users").doc(uid).set({
    pro:       true,
    proType:   plan,
    proUntil:  proUntil,
    renewedAt: now,
    updatedAt: now
  }, { merge: true });

  return {
    success: true,
    message: `PRO renovado (${plan}) para uid=${uid}`,
    proUntil: proUntil ? proUntil.toDate().toISOString() : "vitalício"
  };
});
