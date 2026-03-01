import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../services/firebase";

const AuthContext = createContext(null);

/* ================= HOOK ================= */
export function useAuth() {
  return useContext(AuthContext);
}

/* ================= PROVIDER ================= */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
  const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
    setLoading(true);

    if (!firebaseUser) {
      setUser(null);
      setUserData(null);
      setLoading(false);
      return;
    }

    setUser(firebaseUser);

    // 🔥 MUITO IMPORTANTE:
    // garante que o Firestore reconheça o login
    await firebaseUser.getIdToken(true);

    try {
      const userRef = doc(db, "users", firebaseUser.uid);
      const snap = await getDoc(userRef);

      if (snap.exists()) {
        setUserData(snap.data());
      } else {
        console.warn("Usuário não encontrado no Firestore.");
        setUserData(null);
      }
    } catch (err) {
      console.error("Erro ao buscar userData:", err);
      setUserData(null);
    }

    setLoading(false);
  });

  return () => unsub();
}, []);

  return (
    <AuthContext.Provider value={{ user, userData, loading }}>
      {children}
    </AuthContext.Provider>
  );
}
