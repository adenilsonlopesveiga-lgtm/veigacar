import { useEffect, useRef } from "react";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "../services/firebase";

export function useGpsTracker({
  ativo,
  user,
  empresaAtiva,
  driverName,
  viagemId,
}) {
  const watchIdRef = useRef(null);
  const ultimoSaveRef = useRef(0);
  const ativoRef = useRef(false);

  async function salvarGPS(posicao) {
  if (!user || !empresaAtiva || !ativoRef.current || !viagemId) return;

  const agora = Date.now();

  if (agora - ultimoSaveRef.current < 10000) return;

  try {
    await addDoc(collection(db, "gps_logs"), {
      tenantId: empresaAtiva.tenantId,
      driverId: user.uid,
      driverName: driverName || "Motorista",
      viagemId: viagemId,
      latitude: posicao.coords.latitude,
      longitude: posicao.coords.longitude,
      accuracy: posicao.coords.accuracy,
      createdAt: serverTimestamp(),
    });

    ultimoSaveRef.current = agora;
  } catch (err) {
    console.error("Erro ao salvar GPS:", err);
  }
}


  useEffect(() => {
    ativoRef.current = ativo;

    // 🛑 DESLIGA GPS
    if (!ativo || !viagemId) {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      return;
    }

    // 🚀 NOVA VIAGEM → RESET DO TEMPO
    ultimoSaveRef.current = 0;

    if (!navigator.geolocation) {
      console.error("Geolocalização não suportada");
      return;
    }

    // 🔁 GARANTE QUE NÃO EXISTE WATCH DUPLICADO
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
    }

    watchIdRef.current = navigator.geolocation.watchPosition(
      salvarGPS,
      (err) => console.error("Erro GPS:", err),
      {
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: 20000,
      }
    );

    console.log("📡 GPS INICIADO");

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
  }, [ativo, user, empresaAtiva, driverName, viagemId]);
}
