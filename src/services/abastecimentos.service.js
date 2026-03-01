import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "./firebase";

export async function criarAbastecimento({ dados }) {
  if (!dados?.tenantId) {
    throw new Error("tenantId ausente");
  }

  if (!dados?.driverId) {
    throw new Error("driverId ausente");
  }

  await addDoc(collection(db, "abastecimentos"), {
    dados,
    createdAt: serverTimestamp(),
  });
}
