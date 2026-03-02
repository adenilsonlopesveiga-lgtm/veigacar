import { useEffect, useMemo, useRef, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

import {
  collection,
  onSnapshot,
  query,
  where,
  orderBy,
  limit,
} from "firebase/firestore";
import { db } from "../../services/firebase";
import { useEmpresas } from "../../contexts/EmpresaContext";
import { useNavigate } from "react-router-dom";

/* ================= UTILIDADES ================= */

const CORES = [
  "#22c55e",
  "#3b82f6",
  "#f97316",
  "#a855f7",
  "#ef4444",
  "#14b8a6",
  "#eab308",
];

function corMotorista(id) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }
  return CORES[Math.abs(hash) % CORES.length];
}

function criarIcone(cor) {
  return L.divIcon({
    html: `
      <svg width="36" height="36" viewBox="0 0 24 24" fill="${cor}"
        xmlns="http://www.w3.org/2000/svg">
        <path d="M5 11l1-3c.5-1.5 1.5-2 3-2h6c1.5 0 2.5.5 3 2l1 3v6a1 1 0 01-1 1h-1a1 1 0 01-1-1v-1H7v1a1 1 0 01-1 1H5a1 1 0 01-1-1v-6z"/>
      </svg>
    `,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
  });
}

/* ================= AJUSTE MAPA ================= */

function AjustarMapa({ posicoes }) {
  const map = useMap();

  useEffect(() => {
    if (!posicoes.length) return;
    const bounds = posicoes.map((p) => [p.latitude, p.longitude]);
    map.fitBounds(bounds, { padding: [50, 50], animate: false });
  }, [posicoes, map]);

  return null;
}


/* 👇 COLE AQUI */
function ResizeFix() {
  const map = useMap();

  useEffect(() => {
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 200);

    return () => clearTimeout(timer);
  }, [map]);

  return null;
}
/* ================= COMPONENTE ================= */

export default function GpsAdm() {
  const navigate = useNavigate();
  const { empresas } = useEmpresas();
  const empresaAtiva = empresas?.[0];

  const [posicoes, setPosicoes] = useState([]);

  const posicoesRef = useRef(new Map());
  const gpsUnsubsRef = useRef(new Map());

  function calcularStatusGps(log) {
  // se ainda não tem timestamp, assume ATIVO (GPS acabou de chegar)
  if (!log?.createdAt) return "Ativo";

  const agora = Date.now();
  const ultimo = log.createdAt.toDate().getTime();
  const diffMin = (agora - ultimo) / 60000;

  if (diffMin > 5) return "Offline";

  if (log.speed != null) {
    if (log.speed > 2) return "Ativo";
    return "Parado";
  }

  return "Ativo";
}




  /* ===== LISTENER FIRESTORE ===== */
  useEffect(() => {
    if (!empresaAtiva) return;

    console.log("📡 GPS ADM iniciado");

    const qViagens = query(
      collection(db, "trips"),
      where("tenantId", "==", empresaAtiva.tenantId),
      where("fim", "==", null)
    );

    const unsubViagens = onSnapshot(qViagens, (snap) => {
      const viagensAtivas = new Set();

      snap.docs.forEach((doc) => {
        const viagem = { id: doc.id, ...doc.data() };
        viagensAtivas.add(viagem.id);

        if (gpsUnsubsRef.current.has(viagem.id)) return;

        console.log("🚗 Escutando viagem:", viagem.id);

        const qGps = query(
  collection(db, "gps_logs"),
   where("tenantId", "==", empresaAtiva.tenantId),
  orderBy("createdAt", "asc")
);

const unsubGps = onSnapshot(qGps, (gpsSnap) => {
  gpsSnap.docChanges().forEach((change) => {
    if (change.type !== "added") return;

    const data = change.doc.data();

    // sempre sobrescreve → mantém só a posição atual
    posicoesRef.current.set(viagem.driverId, {
      ...data,
      driverId: viagem.driverId,
      driverName:
        viagem.driverName || data.driverName || "Motorista",
    });
  });
});

      

        gpsUnsubsRef.current.set(viagem.id, unsubGps);
      });

      // 🧹 limpa listeners de viagens finalizadas
      gpsUnsubsRef.current.forEach((unsub, viagemId) => {
        if (!viagensAtivas.has(viagemId)) {
          console.log("🧹 Parando listener da viagem:", viagemId);
          unsub();
          gpsUnsubsRef.current.delete(viagemId);
        }
      });
    });

    return () => {
      console.log("🛑 GPS ADM desligado");
      unsubViagens();
      gpsUnsubsRef.current.forEach((u) => u());
      gpsUnsubsRef.current.clear();
    };
  }, [empresaAtiva]);

  /* ===== REPAINT MAPA A CADA 2s ===== */
  useEffect(() => {
    const interval = setInterval(() => {
      setPosicoes(Array.from(posicoesRef.current.values()));
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  const centro = useMemo(() => {
    if (posicoes.length)
      return [posicoes[0].latitude, posicoes[0].longitude];
    return [-15.77972, -47.92972];
  }, [posicoes]);

  return (
    <div style={styles.container}>
      <h2>GPS — ADM</h2>

      <div style={styles.map}>
       <MapContainer
  center={centro}
  zoom={15}
  style={{ height: "100%", width: "100%" }}
  scrollWheelZoom={true}
>
  

  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

          {posicoes.map((p) => (
            <Marker
              key={p.driverId}
              position={[p.latitude, p.longitude]}
              icon={criarIcone(corMotorista(p.driverId))}
            >
              <Popup>
                <strong>{p.driverName}</strong>
                <br />
                Precisão: {p.accuracy ?? "-"} m
              </Popup>
            </Marker>
          ))}

          <AjustarMapa posicoes={posicoes}
       />
        </MapContainer>
      </div>

      {/* STATUS */}
      <div style={styles.cards}>
        {posicoes.map((p) => {
          const segundos = p.createdAt?.toDate
            ? Math.floor((Date.now() - p.createdAt.toDate()) / 1000)
            : null;

          const status =
            segundos === null
              ? "desconhecido"
              : segundos < 20
              ? "ativo"
              : segundos < 60
              ? "parado"
              : "offline";

          return (
            <div key={p.driverId} style={styles.card}>
              <strong style={{ color: corMotorista(p.driverId) }}>
                {p.driverName}
              </strong>
              <div>Status: {status}</div>
              <div>Precisão: {p.accuracy ?? "-"} m</div>
            </div>
          );
        })}
      </div>

      <button onClick={() => navigate("/home")}>Voltar</button>
    </div>
  );
}

/* ================= ESTILOS ================= */

const styles = {
 container: {
  minHeight: "100vh",
  background: "#020617",
  color: "#fff",
  padding: 20,
  display: "flex",
  flexDirection: "column",
},
map: {
  height: "70vh",   // 👈 altura baseada na tela
  width: "100%",
  border: "1px solid #334155",
  borderRadius: 10,
  overflow: "hidden",
  marginBottom: 20,
},
  cards: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill,minmax(220px,1fr))",
    gap: 12,
  },
  card: {
    background: "#0f172a",
    border: "1px solid #334155",
    borderRadius: 10,
    padding: 12,
    fontSize: 13,
  },
};
