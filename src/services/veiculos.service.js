import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "./firebase";

/* ================= CRIAR VEÍCULO ================= */
export async function criarVeiculo(dados, tenantId) {
  if (!tenantId) {
    throw new Error("tenantId não informado");
  }

  await addDoc(collection(db, "vehicles"), {
    ...dados,
    tenantId, // 🔥 TEM que ser o tenant do usuário logado
    createdAt: serverTimestamp(),
  });
}

/* ================= EDITAR VEÍCULO ================= */
export async function editarVeiculo(id, dados) {
  await updateDoc(doc(db, "vehicles", id), {
    ...dados,
  });
}

/* ================= EXCLUIR VEÍCULO ================= */
export async function excluirVeiculo(id) {
  await deleteDoc(doc(db, "vehicles", id));
}
