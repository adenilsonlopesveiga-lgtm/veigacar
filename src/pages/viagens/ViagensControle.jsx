import { useEffect, useState } from "react";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  deleteDoc,
  updateDoc,
  doc,
  Timestamp,
} from "firebase/firestore";
import { db } from "../../services/firebase";
import { useAuth } from "../../contexts/AuthContext";
import { useNavigate } from "react-router-dom";



/* ================= UTILIDADES ================= */
function calcularHorasExtras(inicioTs, fimTs) {
  if (!inicioTs || !fimTs) return 0;
  

  const inicio = inicioTs.toDate();
  const fim = fimTs.toDate();
  const dia = inicio.getDay(); // 0 dom, 6 sab

  // sábado ou domingo → tudo é hora extra
  if (dia === 0 || dia === 6) {
    return Math.floor((fim - inicio) / 60000);
  }

  const limiteInicio = 7;
  const limiteFim = dia === 5 ? 16 : 17; // sexta até 16h

  let minutos = 0;

  const inicioDia = new Date(inicio);
  inicioDia.setHours(limiteInicio, 0, 0, 0);

  const fimDia = new Date(inicio);
  fimDia.setHours(limiteFim, 0, 0, 0);

  if (inicio < inicioDia) {
    minutos += Math.max(
      0,
      Math.floor((Math.min(fim, inicioDia) - inicio) / 60000)
    );
  }

  if (fim > fimDia) {
    minutos += Math.max(
      0,
      Math.floor((fim - Math.max(inicio, fimDia)) / 60000)
    );
  }

  return minutos;
}

/* ================= ESTILOS ================= */
const styles = {
  container: {
    minHeight: "100vh",
    background: "#020617",
    padding: 20,
    color: "#fff",
  },
  card: {
    maxWidth: 1100,
    margin: "0 auto 30px",
    background: "#0f172a",
    borderRadius: 8,
    padding: 20,
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  title: { fontSize: 22 },
  voltar: {
    background: "transparent",
    color: "#60a5fa",
    border: "none",
    cursor: "pointer",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    fontSize: 13,
    marginBottom: 20,
  },
  th: {
    borderBottom: "1px solid #334155",
    padding: 8,
    textAlign: "left",
    color: "#cbd5f5",
  },
  td: {
    borderBottom: "1px solid #1e293b",
    padding: 8,
    verticalAlign: "top",
  },
  input: {
    width: "100%",
    padding: 6,
    borderRadius: 4,
    border: "none",
    fontSize: 13,
  },
  actions: { display: "flex", gap: 6 },
  btnEdit: {
    background: "#334155",
    border: "none",
    color: "#fff",
    padding: "4px 8px",
    borderRadius: 4,
    cursor: "pointer",
  },
  btnSave: {
    background: "#2563eb",
    border: "none",
    color: "#fff",
    padding: "4px 8px",
    borderRadius: 4,
    cursor: "pointer",
  },
  btnDelete: {
    background: "#dc2626",
    border: "none",
    color: "#fff",
    padding: "4px 8px",
    borderRadius: 4,
    cursor: "pointer",
  },
};

/* ================= COMPONENTE ================= */
export default function ViagensControle() {
  const navigate = useNavigate();
  const { userData } = useAuth();

  if (!userData) return <div style={styles.container}>Carregando…</div>;
 const isAdmin =
  userData.role === "ADM" || userData.role === "SUPER_ADM";

if (!isAdmin) {
  return <p>Acesso restrito</p>;
}


  const [viagens, setViagens] = useState([]);
  const [horasExtras, setHorasExtras] = useState([]);
  const [kmPorVeiculo, setKmPorVeiculo] = useState([]);
  const [editId, setEditId] = useState(null);
  const [editData, setEditData] = useState({});
  const [isMobile, setIsMobile] = useState(false);

useEffect(() => {
  const checkMobile = () => {
    setIsMobile(window.innerWidth < 768);
  };

  checkMobile();
  window.addEventListener("resize", checkMobile);

  return () => window.removeEventListener("resize", checkMobile);
}, []);


  /* ===== BUSCAR VIAGENS ===== */
  useEffect(() => {
    const q = query(
      collection(db, "trips"),
      where("tenantId", "==", userData.tenantId),
      orderBy("inicio", "desc")
    );

    return onSnapshot(q, (snap) => {
      const dados = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setViagens(dados);

      /* ===== HORAS EXTRAS (AGRUPADAS POR DATA + MOTORISTA) ===== */
      const mapaExtras = {};
      dados.forEach((v) => {
        const minutos = calcularHorasExtras(v.inicio, v.fim);
        if (minutos <= 0) return;

        const data = v.inicio.toDate().toLocaleDateString();
        const chave = `${data}-${v.driverName}`;

        if (!mapaExtras[chave]) {
          mapaExtras[chave] = {
            data,
            motorista: v.driverName,
            minutos: 0,
          };
        }

        mapaExtras[chave].minutos += minutos;
      });
      setHorasExtras(Object.values(mapaExtras));

      /* ===== KM TOTAL POR VEÍCULO ===== */
      const mapaKm = {};
      dados.forEach((v) => {
        if (v.kmInicial == null || v.kmFinal == null) return;

        const km = v.kmFinal - v.kmInicial;
        if (km <= 0) return;

        const veiculo = v.vehicleName || "Veículo não informado";
        mapaKm[veiculo] = (mapaKm[veiculo] || 0) + km;
      });

      setKmPorVeiculo(
        Object.entries(mapaKm).map(([veiculo, km]) => ({ veiculo, km }))
      );
    });
  }, [userData]);

  /* ===== EDIÇÃO ===== */
  function iniciarEdicao(v) {
    setEditId(v.id);
    setEditData({
      destino: v.destino,
      vehicleName: v.vehicleName,
      kmInicial: v.kmInicial,
      kmFinal: v.kmFinal ?? "",
      observacoes: v.observacoes ?? "",
      inicio: v.inicio?.toDate().toISOString().slice(0, 16),
      fim: v.fim ? v.fim.toDate().toISOString().slice(0, 16) : "",
    });
  }

  async function salvarEdicao(id) {
    await updateDoc(doc(db, "trips", id), {
      destino: editData.destino,
      vehicleName: editData.vehicleName,
      kmInicial: Number(editData.kmInicial),
      kmFinal: editData.kmFinal !== "" ? Number(editData.kmFinal) : null,
      observacoes: editData.observacoes,
      inicio: Timestamp.fromDate(new Date(editData.inicio)),
      fim: editData.fim ? Timestamp.fromDate(new Date(editData.fim)) : null,
    });
    setEditId(null);
  }

  async function excluir(id) {
    if (!window.confirm("Deseja excluir esta viagem?")) return;
    await deleteDoc(doc(db, "trips", id));
  }

  function formatHora(ts) {
    if (!ts) return "-";
    return ts.toDate().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function kmTotal(v) {
    if (v.kmFinal == null) return "-";
    return v.kmFinal - v.kmInicial;
  }

  const totalExtras = horasExtras.reduce((a, b) => a + b.minutos, 0);

  return (
    <div style={styles.container}>
      {/* ================= VIAGENS ================= */}
      <div style={styles.card}>
        <div style={styles.header}>
          <h2 style={styles.title}>Controle de Viagens</h2>
          <button style={styles.voltar} onClick={() => navigate("/home")}>
            ← Voltar
          </button>
        </div>

        {/* ===== DESKTOP: TABELA ===== */}
{!isMobile && (
  <table style={styles.table}>
    <thead>
      <tr>
        <th style={styles.th}>Data</th>
        <th style={styles.th}>Destino</th>
        <th style={styles.th}>Motorista</th>
        <th style={styles.th}>Veículo</th>
        <th style={styles.th}>Saída</th>
        <th style={styles.th}>Chegada</th>
        <th style={styles.th}>KM</th>
        <th style={styles.th}>Obs</th>
        <th style={styles.th}>Ações</th>
      </tr>
    </thead>

    <tbody>
      {viagens.map((v) => (
        <tr key={v.id}>
          <td style={styles.td}>
            {v.inicio?.toDate().toLocaleDateString()}
          </td>

          {editId === v.id ? (
            <>
              <td style={styles.td}>
                <input
                  style={styles.input}
                  value={editData.destino}
                  onChange={(e) =>
                    setEditData({ ...editData, destino: e.target.value })
                  }
                />
              </td>
              <td style={styles.td}>{v.driverName}</td>
              <td style={styles.td}>
                <input
                  style={styles.input}
                  value={editData.vehicleName}
                  onChange={(e) =>
                    setEditData({
                      ...editData,
                      vehicleName: e.target.value,
                    })
                  }
                />
              </td>
              <td style={styles.td}>
                <input
                  type="datetime-local"
                  style={styles.input}
                  value={editData.inicio}
                  onChange={(e) =>
                    setEditData({ ...editData, inicio: e.target.value })
                  }
                />
              </td>
              <td style={styles.td}>
                <input
                  type="datetime-local"
                  style={styles.input}
                  value={editData.fim}
                  onChange={(e) =>
                    setEditData({ ...editData, fim: e.target.value })
                  }
                />
              </td>
              <td style={styles.td}>
                <input
                  type="number"
                  style={styles.input}
                  value={editData.kmInicial}
                  onChange={(e) =>
                    setEditData({
                      ...editData,
                      kmInicial: e.target.value,
                    })
                  }
                />
                <input
                  type="number"
                  style={styles.input}
                  value={editData.kmFinal}
                  onChange={(e) =>
                    setEditData({
                      ...editData,
                      kmFinal: e.target.value,
                    })
                  }
                />
              </td>
              <td style={styles.td}>
                <input
                  style={styles.input}
                  value={editData.observacoes}
                  onChange={(e) =>
                    setEditData({
                      ...editData,
                      observacoes: e.target.value,
                    })
                  }
                />
              </td>
              <td style={styles.td}>
                <button
                  style={styles.btnSave}
                  onClick={() => salvarEdicao(v.id)}
                >
                  Salvar
                </button>
              </td>
            </>
          ) : (
            <>
              <td style={styles.td}>{v.destino}</td>
              <td style={styles.td}>{v.driverName}</td>
              <td style={styles.td}>{v.vehicleName}</td>
              <td style={styles.td}>
                {v.kmInicial} km<br />
                {formatHora(v.inicio)}
              </td>
              <td style={styles.td}>
                {v.kmFinal ?? "-"} km<br />
                {formatHora(v.fim)}
              </td>
              <td style={styles.td}>{kmTotal(v)}</td>
              <td style={styles.td}>{v.observacoes || "-"}</td>
              <td style={styles.td}>
                <div style={styles.actions}>
                  <button
                    style={styles.btnEdit}
                    onClick={() => iniciarEdicao(v)}
                  >
                    Editar
                  </button>
                  <button
                    style={styles.btnDelete}
                    onClick={() => excluir(v.id)}
                  >
                    Excluir
                  </button>
                </div>
              </td>
            </>
          )}
        </tr>
      ))}
    </tbody>
  </table>
)}

{/* ===== MOBILE: CARDS ===== */}
{isMobile && (
  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
    {viagens.map((v) => (
      <div
        key={v.id}
        style={{
          background: "#020617",
          border: "1px solid #1e293b",
          borderRadius: 10,
          padding: 14,
        }}
      >
        {editId === v.id ? (
          /* ===== MODO EDIÇÃO (MOBILE) ===== */
          <>
            <input
              style={styles.input}
              value={editData.destino}
              placeholder="Destino"
              onChange={(e) =>
                setEditData({ ...editData, destino: e.target.value })
              }
            />

            <input
              style={styles.input}
              value={editData.vehicleName}
              placeholder="Veículo"
              onChange={(e) =>
                setEditData({ ...editData, vehicleName: e.target.value })
              }
            />

            <input
              type="datetime-local"
              style={styles.input}
              value={editData.inicio}
              onChange={(e) =>
                setEditData({ ...editData, inicio: e.target.value })
              }
            />

            <input
              type="datetime-local"
              style={styles.input}
              value={editData.fim}
              onChange={(e) =>
                setEditData({ ...editData, fim: e.target.value })
              }
            />

            <input
              type="number"
              style={styles.input}
              placeholder="KM Inicial"
              value={editData.kmInicial}
              onChange={(e) =>
                setEditData({ ...editData, kmInicial: e.target.value })
              }
            />

            <input
              type="number"
              style={styles.input}
              placeholder="KM Final"
              value={editData.kmFinal}
              onChange={(e) =>
                setEditData({ ...editData, kmFinal: e.target.value })
              }
            />

            <input
              style={styles.input}
              placeholder="Observações"
              value={editData.observacoes}
              onChange={(e) =>
                setEditData({ ...editData, observacoes: e.target.value })
              }
            />

            <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
              <button
                style={styles.btnSave}
                onClick={() => salvarEdicao(v.id)}
              >
                Salvar
              </button>

              <button
                style={styles.btnDelete}
                onClick={() => setEditId(null)}
              >
                Cancelar
              </button>
            </div>
          </>
        ) : (
          /* ===== MODO VISUAL (MOBILE) ===== */
          <>
            <strong>{v.destino}</strong>

            <p style={{ margin: "6px 0", color: "#94a3b8" }}>
              📅 {v.inicio?.toDate().toLocaleDateString()} • 👤 {v.driverName}
            </p>

            <p>🚗 <strong>{v.vehicleName}</strong></p>

            <p>
              ⏱ Saída: {v.inicio ? formatHora(v.inicio) : "-"} <br />
              ⏱ Chegada: {v.fim ? formatHora(v.fim) : "-"}
            </p>

            <p>
              📏 KM: {v.kmInicial} → {v.kmFinal ?? "-"}
            </p>

            <p style={{ color: "#cbd5f5" }}>
              📝 {v.observacoes || "Sem observações"}
            </p>

            <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
              <button
                style={styles.btnEdit}
                onClick={() => iniciarEdicao(v)}
              >
                Editar
              </button>

              <button
                style={styles.btnDelete}
                onClick={() => excluir(v.id)}
              >
                Excluir
              </button>
            </div>
          </>
        )}
      </div>
    ))}
  </div>
)}


      </div>

      {/* ================= HORAS EXTRAS ================= */}
      <div style={styles.card}>
        <h2 style={styles.title}>Horas Extras</h2>

        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Data</th>
              <th style={styles.th}>Motorista</th>
              <th style={styles.th}>Minutos Extras</th>
            </tr>
          </thead>
          <tbody>
            {horasExtras.map((h, i) => (
              <tr key={i}>
                <td style={styles.td}>{h.data}</td>
                <td style={styles.td}>{h.motorista}</td>
                <td style={styles.td}>{h.minutos}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <p>
          <strong>Total geral:</strong> {totalExtras} minutos
        </p>
      </div>

      {/* ================= KM TOTAL POR VEÍCULO ================= */}
      <div style={styles.card}>
        <h2 style={styles.title}>KM Total por Veículo</h2>

        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Veículo</th>
              <th style={styles.th}>KM Total Rodado</th>
            </tr>
          </thead>
          <tbody>
            {kmPorVeiculo.map((v, i) => (
              <tr key={i}>
                <td style={styles.td}>{v.veiculo}</td>
                <td style={styles.td}>
                  <strong>{v.km} km</strong>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
