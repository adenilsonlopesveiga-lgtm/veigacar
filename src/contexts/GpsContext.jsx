import { createContext, useEffect, useState, useContext } from "react";
import { collection, query, where, limit, onSnapshot } from "firebase/firestore";

import { db } from "../services/firebase";
import { useAuth } from "./AuthContext";
import { useEmpresas } from "./EmpresaContext";
import { useGpsTracker } from "../hooks/useGpsTracker";

const GpsContext = createContext(null);

export function GpsProvider({ children }) {
  const { user, userData } = useAuth();
  const { empresas } = useEmpresas();
  const empresaAtiva = empresas?.[0] || null;

  const [viagemAtivaLocal, setViagemAtivaLocal] = useState(false);
  const [viagemAtivaSnapshot, setViagemAtivaSnapshot] = useState(null);

  /* 🔍 CONFIRMAÇÃO VIA FIRESTORE */
  useEffect(() => {
    if (!user || !empresaAtiva) {
      setViagemAtivaSnapshot(null);
      return;
    }

    const q = query(
      collection(db, "trips"),
      where("tenantId", "==", empresaAtiva.tenantId),
      where("driverId", "==", user.uid),
      where("fim", "==", null),
      limit(1)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        const docSnap = snapshot.docs[0];
        setViagemAtivaSnapshot({ id: docSnap.id, ...docSnap.data() });
      } else {
        setViagemAtivaSnapshot(null);
      }
    });

    return () => unsubscribe();
  }, [user, empresaAtiva]);

  const gpsAtivo = viagemAtivaLocal || !!viagemAtivaSnapshot;

  useGpsTracker({
    ativo: gpsAtivo,
    user,
    empresaAtiva,
    driverName: userData?.nome,
    viagemId: viagemAtivaSnapshot?.id || null,
  });

  return (
    <GpsContext.Provider
      value={{
        viagemAtiva: viagemAtivaSnapshot,
        iniciarViagemLocal: () => setViagemAtivaLocal(true),
        finalizarViagemLocal: () => setViagemAtivaLocal(false),
      }}
    >
      {children}
    </GpsContext.Provider>
  );
}

/* ✅ EXPORT DO HOOK (AGORA CORRETO) */
export function useGps() {
  const context = useContext(GpsContext);

  if (!context) {
    throw new Error("useGps deve ser usado dentro de GpsProvider");
  }

  return context;
}
