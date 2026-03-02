import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  collection,
  onSnapshot,
  query,
  orderBy,
  where,
  deleteDoc,
  doc,
  updateDoc,
} from "firebase/firestore";
import { db } from "../../services/firebase";
import { criarAbastecimento } from "../../services/abastecimentos.service";
import { useAuth } from "../../contexts/AuthContext";

/* ================= ESTILOS ================= */
const styles = {
  container: {
  minHeight: "100vh",
  background: "#020617",   // 🔥 garante fundo preto total
  display: "flex",
  justifyContent: "flex-start", // 🔥 não centraliza vertical
  alignItems: "center",
  padding: 0,
  },
  card: {
    width: "100%",
    maxWidth: 760,
    background: "#020617",
    padding: 24,
    borderRadius: 8,
  },
  voltar: {
    background: "transparent",
    color: "#60a5fa",
    border: "none",
    cursor: "pointer",
    fontSize: 14,
    marginBottom: 10,
  },
  title: {
    textAlign: "center",
    fontSize: 22,
    color: "#fff",
  },
  subtitle: {
    textAlign: "center",
    color: "#94a3b8",
    marginBottom: 20,
    fontSize: 14,
  },
  resumoBox: {
    background: "#020617",
    border: "1px solid #1e293b",
    borderRadius: 6,
    padding: 12,
    marginBottom: 16,
    color: "#fff",
    fontSize: 14,
  },
  aviso: {
    marginTop: 10,
    fontSize: 12,
    color: "#cbd5f5",
    fontStyle: "italic",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: 10,
    marginBottom: 20,
  },
  input: {
    padding: 12,
    borderRadius: 6,
    border: "none",
  },
  btnSalvar: {
    padding: 12,
    background: "#2563eb",
    color: "#fff",
    border: "none",
    borderRadius: 6,
    cursor: "pointer",
    fontWeight: "bold",
  },
  lista: {
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },
  item: {
    background: "#0f172a",
    padding: 10,
    borderRadius: 6,
    color: "#fff",
    fontSize: 14,
  },
  acoes: {
    display: "flex",
    gap: 6,
    marginTop: 6,
  },
  btnEditar: {
    background: "#2563eb",
    color: "#fff",
    border: "none",
    padding: "6px 10px",
    borderRadius: 4,
    cursor: "pointer",
    fontSize: 12,
  },
  btnExcluir: {
    background: "#dc2626",
    color: "#fff",
    border: "none",
    padding: "6px 10px",
    borderRadius: 4,
    cursor: "pointer",
    fontSize: 12,
  },
  erro: {
    marginTop: 10,
    padding: 10,
    borderRadius: 6,
    background: "#7f1d1d",
    color: "#fff",
    fontSize: 12,
  },
};

export default function Abastecimento() {
  const navigate = useNavigate();
  const { user, userData } = useAuth();

  const tenantId = userData?.tenantId || null;
  const role = userData?.role || null;
  const driverId = user?.uid || null;
  const driverName = userData?.nome || "Motorista";

  const [veiculos, setVeiculos] = useState([]);
  const [abastecimentos, setAbastecimentos] = useState([]);
  const [editandoId, setEditandoId] = useState(null);

  const [vehicleId, setVehicleId] = useState("");
  const [kmAtual, setKmAtual] = useState("");
  const [litros, setLitros] = useState("");
  const [valorTotal, setValorTotal] = useState("");
  const [tipoCombustivel, setTipoCombustivel] = useState("");
  const [erro, setErro] = useState(null);

  /* ================= VEÍCULOS ================= */
  useEffect(() => {
    if (!tenantId) return;

    const q = query(
      collection(db, "vehicles"),
      where("tenantId", "==", tenantId),
      orderBy("createdAt", "asc")
    );

    return onSnapshot(q, (snap) => {
      setVeiculos(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
  }, [tenantId]);

  /* ================= ABASTECIMENTOS ================= */
  useEffect(() => {
    if (!tenantId) return;

    let q;

    if (role === "ADM") {
      q = query(
        collection(db, "abastecimentos"),
        where("dados.tenantId", "==", tenantId),
        orderBy("createdAt", "desc")
      );
    } else {
      if (!driverId) return;
      q = query(
        collection(db, "abastecimentos"),
        where("dados.tenantId", "==", tenantId),
        where("dados.driverId", "==", driverId),
        orderBy("createdAt", "desc")
      );
    }

    return onSnapshot(
      q,
      (snap) => {
        setAbastecimentos(
          snap.docs.map((doc) => ({
            id: doc.id,
            ...doc.data().dados,
            createdAt: doc.data().createdAt?.toDate(),
          }))
        );
        setErro(null);
      },
      () => setErro("Erro ao carregar abastecimentos")
    );
  }, [tenantId, role, driverId]);

  /* ================= MAPAS / RESUMO EMPRESA ================= */
  const mapaVeiculos = useMemo(() => {
    const m = {};
    veiculos.forEach((v) => {
      m[v.id] = `${v.modelo} - ${v.placa}`;
    });
    return m;
  }, [veiculos]);

  const resumoEmpresa = useMemo(() => {
    const r = { total: 0, porCombustivel: {} };

    abastecimentos.forEach((a) => {
      r.total += a.valorTotal || 0;

      r.porCombustivel[a.tipoCombustivel] ??= {
        litros: 0,
        valor: 0,
        qtd: 0,
      };

      r.porCombustivel[a.tipoCombustivel].litros += a.litros || 0;
      r.porCombustivel[a.tipoCombustivel].valor += a.valorTotal || 0;
      r.porCombustivel[a.tipoCombustivel].qtd += 1;
    });

    return r;
  }, [abastecimentos]);

  function normalizarNumero(valor) {
  if (typeof valor !== "string") return Number(valor) || 0;
  const normalizado = valor.replace(",", ".");
  const numero = Number(normalizado);
  return Number.isNaN(numero) ? null : numero;
}


  /* ================= SALVAR / EDITAR ================= */
  async function handleSalvar(e) {
    e.preventDefault();
    setErro(null);

    

    if (!tenantId || !vehicleId || !kmAtual || !litros || !tipoCombustivel) {
      alert("Preencha todos os campos obrigatórios");
      return;
    }

    const litrosNum = normalizarNumero(litros);
const kmAtualNum = normalizarNumero(kmAtual);
if (kmAtualNum === null || kmAtualNum < 0) {
  alert("Informe um KM válido");
  return;
}
const valorTotalNum = valorTotal ? normalizarNumero(valorTotal) : 0;

if (litrosNum === null || litrosNum <= 0) {
  alert("Informe uma quantidade válida de litros");
  return;
}

const payload = {
  vehicleId,
  kmAtual: kmAtualNum,
  litros: litrosNum,          // 🔥 agora aceita 35,612
  valorTotal: valorTotalNum,  // 🔥 seguro para soma
  tipoCombustivel,
};


    try {
      if (editandoId) {
        await updateDoc(doc(db, "abastecimentos", editandoId), {
          dados: {
            ...payload,
            tenantId,
            driverId,
            driverName, // 👈 NOME DO MOTORISTA SALVO
          },
        });
        setEditandoId(null);
      } else {
        await criarAbastecimento({
          dados: {
            ...payload,
            tenantId,
            driverId,
            driverName, // 👈 NOME DO MOTORISTA SALVO
          },
        });
      }

      setVehicleId("");
      setKmAtual("");
      setLitros("");
      setValorTotal("");
      setTipoCombustivel("");
    } catch (err) {
      setErro(err.message || "Erro ao salvar");
    }
  }

  function handleEditar(a) {
    setEditandoId(a.id);
    setVehicleId(a.vehicleId);
    setKmAtual(a.kmAtual);
    setLitros(a.litros);
    setValorTotal(a.valorTotal);
    setTipoCombustivel(a.tipoCombustivel);
  }

  async function handleExcluir(id) {
    if (!window.confirm("Deseja excluir este abastecimento?")) return;
    await deleteDoc(doc(db, "abastecimentos", id));
  }

  function podeEditarExcluir(a) {
    return role === "ADM" || a.driverId === driverId;
  }

  /* ================= RENDER ================= */
  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <button style={styles.voltar} onClick={() => navigate("/home")}>
          ← Voltar
        </button>

        <h2 style={styles.title}>Abastecimento</h2>

        {/* RESUMO EMPRESA */}
        <div style={styles.resumoBox}>
          <strong>Total geral da empresa:</strong> R$ {resumoEmpresa.total.toFixed(2)}
          {Object.entries(resumoEmpresa.porCombustivel).map(([tipo, r]) => (
            <div key={tipo}>
              • {tipo}: {r.qtd} abastecimentos — {r.litros} L — R$ {r.valor.toFixed(2)}
            </div>
          ))}
          <div style={styles.aviso}>
            Esses dados de abastecimentos se referem exclusivamente aos realizados
            pelos motoristas oficiais e lançados no App Gestão de Frotas.
          </div>
        </div>

        {/* FORM */}
        <form onSubmit={handleSalvar} style={styles.form}>
          <select
            value={vehicleId}
            onChange={(e) => setVehicleId(e.target.value)}
            style={styles.input}
          >
            <option value="">Selecione o veículo</option>
            {veiculos.map((v) => (
              <option key={v.id} value={v.id}>
                {v.modelo} - {v.placa}
              </option>
            ))}
          </select>

          <select
            value={tipoCombustivel}
            onChange={(e) => setTipoCombustivel(e.target.value)}
            style={styles.input}
          >
            <option value="">Tipo de combustível</option>
            <option value="Gasolina">Gasolina</option>
            <option value="Etanol">Etanol</option>
            <option value="Diesel">Diesel</option>
          </select>

          <input
            placeholder="Km atual"
            value={kmAtual}
            onChange={(e) => setKmAtual(e.target.value)}
            style={styles.input}
          />

          <input
  placeholder="Litros (ex: 35,612)"
  value={litros}
  inputMode="decimal"
  onChange={(e) => setLitros(e.target.value)}
  style={styles.input}
/>

          <input
            placeholder="Valor total"
            value={valorTotal}
            onChange={(e) => setValorTotal(e.target.value)}
            style={styles.input}
          />

          <button style={styles.btnSalvar}>
            {editandoId ? "Atualizar" : "Salvar"}
          </button>
        </form>

        {erro && <div style={styles.erro}>{erro}</div>}

        {/* HISTÓRICO */}
        <div style={styles.lista}>
          {abastecimentos.map((a) => (
            <div key={a.id} style={styles.item}>
              <strong>{mapaVeiculos[a.vehicleId]}</strong>
              <div>
  {a.tipoCombustivel} — {Number(a.litros).toFixed(3)} L — R$ {Number(a.valorTotal).toFixed(2)}
</div>

              <div>Motorista: {a.driverName}</div>
              <div>
                {a.createdAt?.toLocaleDateString()}{" "}
                {a.createdAt?.toLocaleTimeString()}
              </div>

              {podeEditarExcluir(a) && (
                <div style={styles.acoes}>
                  <button
                    style={styles.btnEditar}
                    onClick={() => handleEditar(a)}
                  >
                    Editar
                  </button>
                  <button
                    style={styles.btnExcluir}
                    onClick={() => handleExcluir(a.id)}
                  >
                    Excluir
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
