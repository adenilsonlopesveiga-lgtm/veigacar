import {
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  deleteDoc,
  doc,
  updateDoc,
  where,
  serverTimestamp,
} from "firebase/firestore";

import { db } from "./firebase";

/* ======================================================
   FLUXO ANTIGO (MANTIDO — PADRONIZADO)
====================================================== */

// 🔹 Criar empresa (fluxo antigo)
export async function criarEmpresa(empresa) {
  await addDoc(collection(db, "empresas"), {
    ...empresa,

    // ✅ PADRÃO CORRETO
    isActive: true,
    trialActive: true,
    licenseActive: false,

    createdAt: serverTimestamp(),
  });
}

// 🔹 Listar empresas
export async function listarEmpresas() {
  const q = query(
    collection(db, "empresas"),
    orderBy("createdAt", "asc")
  );

  const snapshot = await getDocs(q);

  return snapshot.docs.map((docItem) => ({
    id: docItem.id,
    ...docItem.data(),
  }));
}

// 🔹 Excluir empresa (NÃO USAR MAIS NO APP)
export async function excluirEmpresa(id) {
  await deleteDoc(doc(db, "empresas", id));
}

// 🔹 Editar empresa (FUNÇÃO CENTRAL)
export async function editarEmpresa(id, dados) {
  const ref = doc(db, "empresas", id);

  await updateDoc(ref, {
    ...dados,
    atualizadoEm: serverTimestamp(),
  });
}

/* ======================================================
   FLUXO NOVO — PRIMEIRO ACESSO COM CHAVE
====================================================== */

// 🔐 Validar chave de acesso
export async function validarChaveAcesso(codigo) {
  const q = query(
    collection(db, "access_keys"),
    where("codigo", "==", codigo),
    where("ativa", "==", true),
    where("usada", "==", false)
  );

  const snap = await getDocs(q);

  if (snap.empty) {
    throw new Error("Chave inválida, inativa ou já utilizada.");
  }

  const docKey = snap.docs[0];

  return {
    id: docKey.id,
    ...docKey.data(),
  };
}

// 🏢 Criar empresa no primeiro acesso (trial via chave)
export async function criarEmpresaComercial({
  nomeEmpresa,
  plano = "trial",
  uidAdmin,
  diasTeste = 7,
}) {
  const testeAte = new Date();
  testeAte.setDate(testeAte.getDate() + diasTeste);

  const empresaRef = await addDoc(collection(db, "empresas"), {
    nome: nomeEmpresa,

    // ✅ PADRÃO CORRETO
    isActive: true,

    plano, // trial | pago
    status: plano === "trial" ? "teste" : "ativo",

    trialActive: plano === "trial",
    trialEndsAt: plano === "trial" ? testeAte : null,

    licenseActive: false,
    licenseEndsAt: null,

    criadaEm: serverTimestamp(),
    criadaPor: uidAdmin,
  });

  // usa o próprio ID como tenantId
  await updateDoc(doc(db, "empresas", empresaRef.id), {
    tenantId: empresaRef.id,
  });

  return {
    tenantId: empresaRef.id,
    empresaId: empresaRef.id,
  };
}

// 🔑 Consumir chave de acesso
export async function consumirChaveAcesso({
  chaveId,
  uidAdmin,
  tenantId,
}) {
  await updateDoc(doc(db, "access_keys", chaveId), {
    usada: true,
    usadaPor: uidAdmin,
    tenantId,
    usadaEm: serverTimestamp(),
  });
}

/* ======================================================
   PRIMEIRO ACESSO — TRIAL AUTOMÁTICO (SEM CHAVE)
====================================================== */

import {
  createUserWithEmailAndPassword,
} from "firebase/auth";
import { auth } from "./firebase";

export async function criarEmpresaTrial({
  nomeEmpresa,
  email,
  senha,
  diasTeste = 7,
}) {
  // 1️⃣ Criar usuário ADM
  const cred = await createUserWithEmailAndPassword(
    auth,
    email,
    senha
  );

  const uid = cred.user.uid;

  // 2️⃣ Criar empresa em trial
  const testeAte = new Date();
  testeAte.setDate(testeAte.getDate() + diasTeste);

  const empresaRef = await addDoc(collection(db, "empresas"), {
    nome: nomeEmpresa,

    // ✅ PADRÃO CORRETO
    isActive: true,

    plano: "trial",
    status: "teste",

    trialActive: true,
    trialEndsAt: testeAte,

    licenseActive: false,
    licenseEndsAt: null,

    tenantId: uid,
    criadaEm: serverTimestamp(),
    criadaPor: uid,
  });

  // 3️⃣ Criar usuário ADM
  await addDoc(collection(db, "users"), {
    email,
    role: "ADM",
    tenantId: uid,
    createdAt: serverTimestamp(),
  });

  return {
    tenantId: uid,
    empresaId: empresaRef.id,
  };
}
