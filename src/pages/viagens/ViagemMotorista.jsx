import { useEffect, useState } from "react";
import { useGps } from "../../contexts/GpsContext";





import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
  doc,
  limit,
} from "firebase/firestore";
import { db } from "../../services/firebase";
import { useAuth } from "../../contexts/AuthContext";
import { useNavigate } from "react-router-dom";

/* ================= ESTILOS ================= */
const styles = {
  container: {
    minHeight: "100vh",
    background: "#020617",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  card: {
    width: "100%",
    maxWidth: 520,
    background: "#0f172a",
    padding: 24,
    borderRadius: 8,
    color: "#fff",
  },
  voltar: {
    background: "transparent",
    color: "#60a5fa",
    border: "none",
    cursor: "pointer",
    fontSize: 14,
    marginBottom: 10,
  },
  title: { fontSize: 22, textAlign: "center", marginBottom: 16 },
  formBox: { maxWidth: 360, margin: "0 auto" },
  input: {
    width: "100%",
    height: 44,
    padding: "0 12px",
    borderRadius: 6,
    border: "none",
    marginBottom: 10,
    boxSizing: "border-box",
    fontSize: 14,
    lineHeight: "44px",
  },
  btnPrimary: {
    width: "100%",
    height: 44,
    background: "#2563eb",
    color: "#fff",
    border: "none",
    borderRadius: 6,
    fontWeight: "bold",
    cursor: "pointer",
    marginTop: 6,
  },
  btnDanger: {
    width: "100%",
    height: 44,
    background: "#dc2626",
    color: "#fff",
    border: "none",
    borderRadius: 6,
    fontWeight: "bold",
    cursor: "pointer",
    marginTop: 6,
  },
  btnSecondary: {
    background: "#334155",
    color: "#fff",
    border: "none",
    borderRadius: 6,
    padding: "6px 10px",
    marginRight: 6,
    cursor: "pointer",
  },
  list: {
    marginTop: 20,
    background: "#020617",
    padding: 12,
    borderRadius: 6,
  },
  item: {
    borderBottom: "1px solid #1e293b",
    paddingBottom: 8,
    marginBottom: 8,
    fontSize: 14,
  },
  erro: {
    background: "#7f1d1d",
    padding: 8,
    borderRadius: 6,
    marginBottom: 10,
    textAlign: "center",
  },
};

/* ================= COMPONENTE ================= */
export default function ViagemMotorista() {
  const navigate = useNavigate();
  const { userData, user } = useAuth();

  if (!userData || !user) {
    return (
      <div style={styles.container}>
        <div style={{ color: "#fff" }}>Carregando dados do usuário...</div>
      </div>
    );
  }

 const isADM =
  userData.role === "ADM" || userData.role === "SUPER_ADM";
const isMotorista = userData.role === "MOTORISTA";

  
const { viagemAtiva, iniciarViagemLocal, finalizarViagemLocal } = useGps();







  if (!isADM && !isMotorista) {
    return (
      <div style={styles.container}>
        <div style={{ color: "#fff" }}>Acesso restrito</div>
      </div>
    );
  }

  

  const [viagens, setViagens] = useState([]);
  const [erro, setErro] = useState(null);

  const [veiculos, setVeiculos] = useState([]);
  const [veiculoId, setVeiculoId] = useState("");

  const [destino, setDestino] = useState("");
  const [kmInicial, setKmInicial] = useState("");
  const [kmFinal, setKmFinal] = useState("");
  const [observacoes, setObservacoes] = useState("");

  /* ===== EDIÇÃO ===== */
  const [editandoId, setEditandoId] = useState(null);
  const [editDestino, setEditDestino] = useState("");
  const [editKmInicial, setEditKmInicial] = useState("");
  const [editKmFinal, setEditKmFinal] = useState("");
  const [editObs, setEditObs] = useState("");

  /* ===== BUSCAR VEÍCULOS ===== */
  useEffect(() => {
    const q = query(
      collection(db, "vehicles"),
      where("tenantId", "==", userData.tenantId),
      orderBy("modelo")
    );

    const unsub = onSnapshot(q, (snap) => {
      setVeiculos(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });

    return () => unsub();
  }, [userData]);

  /* ===== BUSCAR VIAGENS ===== */
 useEffect(() => {
  // 🔹 lista de viagens
  const qLista = isADM
    ? query(
        collection(db, "trips"),
        where("tenantId", "==", userData.tenantId),
        orderBy("inicio", "desc")
      )
    : query(
        collection(db, "trips"),
        where("tenantId", "==", userData.tenantId),
        where("driverId", "==", user.uid),
        orderBy("inicio", "desc")
      );

  const unsubLista = onSnapshot(qLista, (snap) => {
    setViagens(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  });

  // 🔒 viagem ativa (1 por vez)
  

  return () => {
    unsubLista();
  };
}, [userData, user, isADM]);


  /* ===== INICIAR CORRIDA ===== */
  async function iniciarCorrida() {
  setErro(null);

  if (viagemAtiva) {
    setErro("Finalize a corrida ativa antes de iniciar outra.");
    return;
  }

  if (!veiculoId || !destino || !kmInicial) {
    setErro("Veículo, destino e km inicial são obrigatórios.");
    return;
  }

  const v = veiculos.find((v) => v.id === veiculoId);

  const docRef = await addDoc(collection(db, "trips"), {
    tenantId: userData.tenantId,
    driverId: user.uid,
    driverName: userData.nome || user.displayName || "Motorista",
    vehicleId: veiculoId,
    vehicleName: `${v?.modelo || ""} - ${v?.placa || ""}`,
    destino,
    kmInicial: Number(kmInicial),
    status: "ATIVA",
    inicio: serverTimestamp(),
    fim: null,               // 🔴 IMPORTANTE
    createdAt: serverTimestamp(),
  });

  // 🚀 AGORA SIM — VIAGEM EXISTE
  iniciarViagemLocal();

  setVeiculoId("");
  setDestino("");
  setKmInicial("");
}


  /* ===== FINALIZAR ===== */
  async function finalizarCorrida() {
  setErro(null);

  if (!kmFinal || !observacoes) {
    setErro("Km final e observações são obrigatórios.");
    return;
  }

  if (Number(kmFinal) < Number(viagemAtiva.kmInicial)) {
    setErro("Km final não pode ser menor que o inicial.");
    return;
  }

  await updateDoc(doc(db, "trips", viagemAtiva.id), {
    kmFinal: Number(kmFinal),
    observacoes,
    fim: serverTimestamp(),
    status: "FINALIZADA",
  });

  // 🛑 AGORA SIM
  finalizarViagemLocal();

  setKmFinal("");
  setObservacoes("");
}


  /* ===== EDIÇÃO ===== */
  function iniciarEdicao(v) {
    setEditandoId(v.id);
    setEditDestino(v.destino || "");
    setEditKmInicial(v.kmInicial ?? "");
    setEditKmFinal(v.kmFinal ?? "");
    setEditObs(v.observacoes || "");
  }

  async function salvarEdicao(v) {
    if (!isADM && v.driverId !== user.uid) return;

    if (!editDestino || !editKmInicial) {
      setErro("Destino e km inicial são obrigatórios.");
      return;
    }

    if (editKmFinal && Number(editKmFinal) < Number(editKmInicial)) {
      setErro("Km final não pode ser menor que o inicial.");
      return;
    }

    const payload = {
      destino: editDestino,
      kmInicial: Number(editKmInicial),
      observacoes: editObs,
    };

    if (editKmFinal !== "") payload.kmFinal = Number(editKmFinal);

    await updateDoc(doc(db, "trips", v.id), payload);
    setEditandoId(null);
  }

  async function excluir(id) {
    if (!isADM) return;
    await deleteDoc(doc(db, "trips", id));
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <button style={styles.voltar} onClick={() => navigate("/home")}>
          ← Voltar
        </button>

        <h2 style={styles.title}>Viagem</h2>

        {erro && <div style={styles.erro}>{erro}</div>}

        {/* FORM */}
        <div style={styles.formBox}>
          {!viagemAtiva && (
            <>
              <select
                value={veiculoId}
                onChange={(e) => setVeiculoId(e.target.value)}
                style={styles.input}
              >
                <option value="">Selecione o veículo</option>
                {veiculos.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.modelo} - {v.placa}
                  </option>
                ))}
              </select>

              <input
                placeholder="Destino"
                value={destino}
                onChange={(e) => setDestino(e.target.value)}
                style={styles.input}
              />

              <input
                placeholder="Km inicial"
                type="number"
                value={kmInicial}
                onChange={(e) => setKmInicial(e.target.value)}
                style={styles.input}
              />

              <button style={styles.btnPrimary} onClick={iniciarCorrida}>
                Iniciar Corrida
              </button>
            </>
          )}

          {viagemAtiva && (
            <>
              <input
                placeholder="Km final"
                type="number"
                value={kmFinal}
                onChange={(e) => setKmFinal(e.target.value)}
                style={styles.input}
              />
              <input
                placeholder="Observações"
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
                style={styles.input}
              />
              <button style={styles.btnDanger} onClick={finalizarCorrida}>
                Finalizar Corrida
              </button>
            </>
          )}
        </div>

        {/* LISTA */}
        <div style={styles.list}>
          {viagens.map((v) => {
            const podeEditar = isADM || v.driverId === user.uid;

            return (
              <div key={v.id} style={styles.item}>
                {editandoId === v.id ? (
                  <>
                    <input
                      value={editDestino}
                      onChange={(e) => setEditDestino(e.target.value)}
                      style={styles.input}
                    />
                    <input
                      type="number"
                      value={editKmInicial}
                      onChange={(e) => setEditKmInicial(e.target.value)}
                      style={styles.input}
                    />
                    <input
                      type="number"
                      value={editKmFinal}
                      onChange={(e) => setEditKmFinal(e.target.value)}
                      style={styles.input}
                    />
                    <input
                      value={editObs}
                      onChange={(e) => setEditObs(e.target.value)}
                      style={styles.input}
                    />

                    <button
                      style={styles.btnPrimary}
                      onClick={() => salvarEdicao(v)}
                    >
                      Salvar
                    </button>
                  </>
                ) : (
                  <>
                    <strong>{v.destino}</strong> – {v.vehicleName} <br />
                    Motorista: {v.driverName} <br />
                    Km: {v.kmInicial} → {v.kmFinal ?? "-"} <br />
                    Obs: {v.observacoes ?? "-"} <br />

                    {podeEditar && (
                      <button
                        style={styles.btnSecondary}
                        onClick={() => iniciarEdicao(v)}
                      >
                        Editar
                      </button>
                    )}

                    {isADM && (
                      <button
                        style={styles.btnDanger}
                        onClick={() => excluir(v.id)}
                      >
                        Excluir
                      </button>
                    )}
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

