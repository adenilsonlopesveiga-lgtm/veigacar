import { onCall } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";

admin.initializeApp();
const db = admin.firestore();

export const consumirChaveECriarEmpresa = onCall(
  async (request) => {
    const uid = request.auth?.uid;
    const { codigo, dadosEmpresa } = request.data;

    if (!uid) {
      throw new Error("Usuário não autenticado");
    }

    if (!codigo || !dadosEmpresa?.nome) {
      throw new Error("Dados incompletos");
    }

    // 🔑 buscar chave
    const snap = await db
      .collection("access_keys")
      .where("codigo", "==", codigo)
      .where("ativa", "==", true)
      .where("usada", "==", false)
      .limit(1)
      .get();

    if (snap.empty) {
      throw new Error("Chave inválida ou já utilizada");
    }

    const chaveDoc = snap.docs[0];

    // 🏢 criar empresa
    const empresaRef = db.collection("empresas").doc();
    const tenantId = empresaRef.id;

    await db.runTransaction(async (tx) => {
      tx.set(empresaRef, {
        nome: dadosEmpresa.nome,
        tenantId,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        createdBy: uid,
      });

      // 🔒 consumir chave
      tx.update(chaveDoc.ref, {
        usada: true,
        usadaPor: uid,
        usadaEm: admin.firestore.FieldValue.serverTimestamp(),
        tenantId,
      });

      // 👤 atualizar usuário
      tx.update(db.collection("users").doc(uid), {
        tenantId,
        role: "ADM",
      });
    });

    return { tenantId };
  }
);
