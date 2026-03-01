import { onCall } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";

admin.initializeApp();

export const gerarChaveAcesso = onCall(async (request) => {
  const auth = request.auth;

  if (!auth) {
    throw new Error("Não autenticado");
  }

  const uid = auth.uid;

  const userSnap = await admin.firestore().doc(`users/${uid}`).get();

  if (!userSnap.exists || userSnap.data()?.isSuperAdmin !== true) {
    throw new Error("Acesso negado");
  }

  const { durationMinutes } = request.data;

  if (!durationMinutes || durationMinutes <= 0) {
    throw new Error("Duração inválida");
  }

  const codigo =
    "VG-" +
    Math.random().toString(36).substring(2, 6).toUpperCase() +
    "-" +
    Math.random().toString(36).substring(2, 6).toUpperCase();

  await admin.firestore().doc(`access_keys/${codigo}`).set({
    codigo,
    usada: false,
    durationMinutes,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    criadoPor: uid,
  });

  return { codigo };
});
