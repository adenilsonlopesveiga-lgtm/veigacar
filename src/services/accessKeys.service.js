import {
  collection,
  doc,
  setDoc,
  updateDoc,
  addDoc,
  getDocs,
  query,
  where,
  serverTimestamp,
} from "firebase/firestore";

import { createUserWithEmailAndPassword } from "firebase/auth";
import { db, auth } from "./firebase";
import { deleteField } from "firebase/firestore";


/* ======================================================
   CRIAR EMPRESA COM CHAVE (ONBOARDING)
====================================================== */
export async function criarEmpresaComChave({
  chave,
  nomeEmpresa,
  email,
  senha,
}) {
  if (!chave || !nomeEmpresa || !email || !senha) {
    throw new Error("Preencha todos os campos.");
  }

  const codigo = String(chave).trim();

  const q = query(
    collection(db, "access_keys"),
    where("codigo", "==", codigo)
  );

  const snapKeys = await getDocs(q);

  if (snapKeys.empty) {
    throw new Error("Chave inválida.");
  }

  const keyDoc = snapKeys.docs[0];
  const keyRef = keyDoc.ref;

  if (keyDoc.data().usada) {
    throw new Error("Esta chave já foi utilizada.");
  }

  const cred = await createUserWithEmailAndPassword(auth, email, senha);
  const uid = cred.user.uid;
  const tenantId = uid;

  const agora = new Date();
  const trialEndsAt = new Date(agora.getTime() + 5 * 60 * 1000);

  await setDoc(doc(db, "empresas", tenantId), {
    tenantId,
    nome: nomeEmpresa,
    trialActive: true,
    trialEndsAt,
    licenseActive: false,
    active: true,
    createdAt: serverTimestamp(),
  });

  await setDoc(doc(db, "users", uid), {
    uid,
    tenantId,
    role: "ADM",
    email,
    active: true,
    isSuperAdmin: false,
    createdAt: serverTimestamp(),
  });

  await updateDoc(keyRef, {
    usada: true,
    usadaEm: serverTimestamp(),
    usadaPorUid: uid,
  });

  return { uid, tenantId };
}

/* ======================================================
   🔑 GERAR CHAVE DE ACESSO (SUPER ADMIN)
====================================================== */
export async function gerarChaveAcesso({ durationMinutes }) {
  const codigo =
    "VG-" +
    Math.random().toString(36).substring(2, 6).toUpperCase() +
    "-" +
    Math.random().toString(36).substring(2, 6).toUpperCase();

  await addDoc(collection(db, "access_keys"), {
    codigo,
    usada: false,
    durationMinutes,
    createdAt: serverTimestamp(),
  });

  return codigo;
}

/* ======================================================
   🔓 ATIVAR LICENÇA COM CHAVE
====================================================== */
export async function ativarLicencaComChave({ codigo, tenantId }) {
  if (!codigo || !tenantId) {
    throw new Error("Código inválido.");
  }

  const q = query(
    collection(db, "access_keys"),
    where("codigo", "==", codigo)
  );

  const snapKeys = await getDocs(q);

  if (snapKeys.empty) {
    throw new Error("Chave não encontrada.");
  }

  const keyDoc = snapKeys.docs[0];
  const keyRef = keyDoc.ref;

  if (keyDoc.data().usada) {
    throw new Error("Chave já utilizada.");
  }

  const agora = new Date();
  const minutos = keyDoc.data().durationMinutes || 60;
  const licenseEndsAt = new Date(agora.getTime() + minutos * 60 * 1000);

 await db.collection("empresas").doc(tenantId).update({
  licenseActive: true,
  licenseEndsAt,
  trialActive: false,

  // 🔓 REATIVA EMPRESA
  isActive: true,
  active: true,

  // 🧹 REMOVE MARCA DE DESATIVAÇÃO
  desativadaEm: admin.firestore.FieldValue.delete(),

  updatedAt: admin.firestore.FieldValue.serverTimestamp(),
});






  await updateDoc(keyRef, {
    usada: true,
    usadaEm: serverTimestamp(),
    tenantId,
  });

  return true;
}
