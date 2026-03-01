import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "./firebase";

/* ================= CRIAR MOTORISTA ================= */
export async function criarMotorista(dados, tenantId) {
  if (!tenantId) {
    throw new Error("tenantId não informado");
  }

  await addDoc(collection(db, "drivers"), {
    ...dados,
    tenantId, // 🔥 obrigatório para as regras
    createdAt: serverTimestamp(),
  });
}

/* ================= EDITAR MOTORISTA ================= */
export async function editarMotorista(id, dados) {
  await updateDoc(doc(db, "drivers", id), {
    ...dados,
  });
}

/* ================= EXCLUIR MOTORISTA ================= */
export async function excluirMotorista(id) {
  await deleteDoc(doc(db, "drivers", id));
}
