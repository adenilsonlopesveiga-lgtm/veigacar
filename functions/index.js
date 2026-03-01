/**
 * =========================================================
 *  IMPORTS OBRIGATÓRIOS
 * =========================================================
 */
const admin = require("firebase-admin");
const { onCall, HttpsError } = require("firebase-functions/v2/https");

admin.initializeApp();

/**
 * =========================================================
 *  🔑 GERAR CHAVE DE ACESSO (SUPER ADMIN)
 * =========================================================
 */
exports.gerarChaveAcesso = onCall(
  { region: "us-central1" },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "Usuário não autenticado");
    }

    const uid = request.auth.uid;

    const userSnap = await admin
      .firestore()
      .collection("users")
      .doc(uid)
      .get();

    if (!userSnap.exists || userSnap.data().isSuperAdmin !== true) {
      throw new HttpsError(
        "permission-denied",
        "Apenas Super Admin pode gerar chave"
      );
    }

    const { durationMinutes } = request.data || {};

    const minutos =
      durationMinutes && durationMinutes > 0
        ? durationMinutes
        : 365 * 24 * 60;

    const codigo =
      "VG-" +
      Math.random().toString(36).substring(2, 6).toUpperCase() +
      "-" +
      Math.random().toString(36).substring(2, 6).toUpperCase();

    await admin.firestore().doc(`access_keys/${codigo}`).set({
      codigo,
      usada: false,
      durationMinutes: minutos,
      criadoPor: uid,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return { codigo };
  }
);

/**
 * =========================================================
 *  🔓 ATIVAR LICENÇA COM CHAVE (ADM)
 * =========================================================
 */
exports.ativarLicencaComChave = onCall(
  { region: "us-central1" },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "Usuário não autenticado");
    }

    const { codigo, tenantId } = request.data || {};

    if (!codigo || !tenantId) {
      throw new HttpsError("invalid-argument", "Dados incompletos");
    }

    const codigoNormalizado = String(codigo).trim().toUpperCase();
    const chaveRef = admin.firestore().doc(`access_keys/${codigoNormalizado}`);
    const chaveSnap = await chaveRef.get();

    if (!chaveSnap.exists) {
      throw new HttpsError("not-found", "Chave inválida");
    }

    if (chaveSnap.data().usada === true) {
      throw new HttpsError("failed-precondition", "Chave já utilizada");
    }

    const minutos = Number(chaveSnap.data().durationMinutes) || 60;
    const licenseEndsAt = new Date(Date.now() + minutos * 60 * 1000);

    await admin.firestore().doc(`empresas/${tenantId}`).update({
      licenseActive: true,
      licenseEndsAt,
      trialActive: false,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    await chaveRef.update({
      usada: true,
      usadaEm: admin.firestore.FieldValue.serverTimestamp(),
      tenantId,
    });

    return { success: true };
  }
);

/**
 * =========================================================
 *  👤 CRIAR MOTORISTA (ADM / SUPER_ADM)
 * =========================================================
 */
exports.criarMotorista = onCall(
  { region: "us-central1" },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "Usuário não autenticado");
    }

    const requesterUid = request.auth.uid;

    const requesterDoc = await admin
      .firestore()
      .collection("users")
      .doc(requesterUid)
      .get();

    if (
      !requesterDoc.exists ||
      !["ADM", "SUPER_ADM"].includes(requesterDoc.data().role)
    ) {
      throw new HttpsError(
        "permission-denied",
        "Apenas ADM pode criar motoristas"
      );
    }

    const { nome, email, senha, tenantId } = request.data || {};

    if (!nome || !email || !senha || !tenantId) {
      throw new HttpsError("invalid-argument", "Dados incompletos");
    }

    const userRecord = await admin.auth().createUser({
      email,
      password: senha,
    });

    await admin.firestore().collection("users").doc(userRecord.uid).set({
      uid: userRecord.uid,
      nome,
      email,
      role: "MOTORISTA",
      tenantId,
      active: true,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return { success: true };
  }
);

/**
 * =========================================================
 *  ❌ EXCLUIR MOTORISTA (ADM / SUPER_ADM)
 * =========================================================
 */
exports.excluirMotorista = onCall(
  { region: "us-central1" },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "Usuário não autenticado");
    }

    const requesterUid = request.auth.uid;

    const requesterDoc = await admin
      .firestore()
      .collection("users")
      .doc(requesterUid)
      .get();

    if (
      !requesterDoc.exists ||
      !["ADM", "SUPER_ADM"].includes(requesterDoc.data().role)
    ) {
      throw new HttpsError(
        "permission-denied",
        "Apenas ADM pode excluir motoristas"
      );
    }

    const { uid } = request.data || {};

    if (!uid) {
      throw new HttpsError("invalid-argument", "UID não informado");
    }

    await admin.auth().deleteUser(uid);
    await admin.firestore().collection("users").doc(uid).delete();

    return { success: true };
  }
);

/**
 * =========================================================
 *  📋 LISTAR MOTORISTAS (ADM / SUPER_ADM)
 * =========================================================
 */
exports.listarMotoristas = onCall(
  { region: "us-central1" },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "Usuário não autenticado");
    }

    const requesterUid = request.auth.uid;

    const requesterDoc = await admin
      .firestore()
      .collection("users")
      .doc(requesterUid)
      .get();

    if (
      !requesterDoc.exists ||
      !["ADM", "SUPER_ADM"].includes(requesterDoc.data().role)
    ) {
      throw new HttpsError(
        "permission-denied",
        "Apenas ADM pode listar motoristas"
      );
    }

    const tenantId = requesterDoc.data().tenantId;

    const snap = await admin
      .firestore()
      .collection("users")
      .where("tenantId", "==", tenantId)
      .where("role", "==", "MOTORISTA")
      .get();

    const motoristas = snap.docs.map((doc) => ({
      uid: doc.id,
      nome: doc.data().nome || "",
      email: doc.data().email || "",
    }));

    return { motoristas };
  }
);

/**
 * =========================================================
 *  🚀 CRIAR EMPRESA TRIAL (PRIMEIRO ACESSO)
 * =========================================================
 */
exports.criarEmpresaTrial = onCall(
  { region: "us-central1" },
  async (request) => {
    const {
      nomeEmpresa,
      cnpj = "",
      telefone = "",
      email,
      senha,
    } = request.data || {};

    if (!nomeEmpresa || !email || !senha) {
      throw new HttpsError("invalid-argument", "Dados incompletos");
    }

    const userRecord = await admin.auth().createUser({
      email,
      password: senha,
    });

    const uid = userRecord.uid;
    const tenantId = uid;

    const trialEndsAt = new Date(
      Date.now() + 7 * 24 * 60 * 60 * 1000
    );

    await admin.firestore().collection("empresas").doc(tenantId).set({
      tenantId,
      nome: nomeEmpresa,
      cnpj: cnpj || null,
      telefone: telefone || null,
      trialActive: true,
      trialEndsAt,
      licenseActive: false,
      active: true,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    await admin.firestore().collection("users").doc(uid).set({
      uid,
      tenantId,
      role: "ADM",
      email,
      active: true,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return { uid };
  }
);
