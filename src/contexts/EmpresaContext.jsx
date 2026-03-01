import {
  createContext,
  useContext,
  useEffect,
  useState,
  useMemo,
} from "react";
import {
  collection,
  onSnapshot,
  orderBy,
  query,
  where,
} from "firebase/firestore";
import { db } from "../services/firebase";
import { useAuth } from "./AuthContext";

const EmpresaContext = createContext(null);

export function EmpresaProvider({ children }) {
  const { userData } = useAuth(); // 🔐 vem do AuthContext
  const tenantId = userData?.tenantId || null;

  const [empresas, setEmpresas] = useState([]);
  const [loadingEmpresas, setLoadingEmpresas] = useState(true);
  const [primeiroAcesso, setPrimeiroAcesso] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    // ⛔ Ainda não carregou o usuário
    if (!tenantId) {
      setEmpresas([]);
      setLoadingEmpresas(false);
      setError(null);
      return;
    }

    console.log("🔥 EmpresaContext iniciado. tenantId:", tenantId);
    setLoadingEmpresas(true);
    setError(null);

    const q = query(
  collection(db, "empresas"),
  where("tenantId", "==", tenantId),
  orderBy("createdAt", "asc")
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const lista = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        console.log("🔥 Empresas no contexto:", lista);
        setEmpresas(lista);
        setPrimeiroAcesso(lista.length === 0);

        setLoadingEmpresas(false);
      },
      (err) => {
        console.error("❌ EmpresaContext snapshot error:", err);
        setEmpresas([]);
        setLoadingEmpresas(false);
        setError(err);
      }
    );

    return () => unsubscribe();
  }, [tenantId]);

 const value = useMemo(
  () => ({
    empresas,
    loadingEmpresas,
    primeiroAcesso,
    error,
  }),
  [empresas, loadingEmpresas, primeiroAcesso, error]
);


  return (
    <EmpresaContext.Provider value={value}>
      {children}
    </EmpresaContext.Provider>
  );
}

export function useEmpresas() {
  
  const ctx = useContext(EmpresaContext);
  if (!ctx) {
    throw new Error(
      "useEmpresas deve ser usado dentro de <EmpresaProvider />"
    );
  }
  return ctx;
}

export function useEmpresa() {
  const ctx = useContext(EmpresaContext);
  if (!ctx) {
    throw new Error(
      "useEmpresa deve ser usado dentro de <EmpresaProvider />"
    );
  }
  return ctx;
}

