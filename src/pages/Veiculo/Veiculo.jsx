import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { collection, onSnapshot, query,   where, orderBy } from "firebase/firestore";
import { db } from "../../services/firebase";
import { useAuth } from "../../contexts/AuthContext";

import {
  criarVeiculo,
  editarVeiculo,
  excluirVeiculo,
} from "../../services/veiculos.service";
import { useEmpresas } from "../../contexts/EmpresaContext";

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
    maxWidth: 520,
    background: "#020617",
    padding: 24,
    borderRadius: 8,
  },
  topo: {
    marginBottom: 10,
  },
  voltar: {
    background: "transparent",
    color: "#60a5fa",
    border: "none",
    cursor: "pointer",
    fontSize: 14,
  },
  title: {
    textAlign: "center",
    margin: 0,
    fontSize: 22,
  },
  subtitle: {
    textAlign: "center",
    color: "#94a3b8",
    marginBottom: 20,
    fontSize: 14,
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
  select: {
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
    gap: 10,
  },
  item: {
    background: "#0f172a",
    padding: 12,
    borderRadius: 6,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    color: "#ffffff", // 🔥 ESTA LINHA RESOLVE TUDO
  },
  small: {
    fontSize: 12,
    color: "#94a3b8",
  },
  acoes: {
    display: "flex",
    gap: 6,
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
};

/* ================= COMPONENTE ================= */
export default function Veiculo() {
  const navigate = useNavigate();

  const { empresas, loadingEmpresas } = useEmpresas();

  const [modelo, setModelo] = useState("");
  const [placa, setPlaca] = useState("");
  const [ano, setAno] = useState("");
  const [empresaId, setEmpresaId] = useState("");

  const [veiculos, setVeiculos] = useState([]);
  const [editandoId, setEditandoId] = useState(null);
  const { userData } = useAuth();


  /* 🔥 ESCUTA VEÍCULOS */
 useEffect(() => {
  if (!userData?.tenantId) {
    setVeiculos([]);
    return;
  }

  const q = query(
    collection(db, "vehicles"),
    where("tenantId", "==", userData.tenantId)
  );

  const unsub = onSnapshot(
    q,
    (snap) => {
      setVeiculos(
        snap.docs.map((d) => ({ id: d.id, ...d.data() }))
      );
    },
    (error) => {
      console.warn("🔥 Snapshot veículos cancelado:", error.code);
      setVeiculos([]);
    }
  );

  return () => {
    unsub(); // 🚨 ESSENCIAL
  };
}, [userData?.tenantId]);


  async function handleSalvar(e) {
    e.preventDefault();

    
    
    if (!modelo || !placa || !ano || !empresaId) {
      alert("Preencha todos os campos");
      return;
    }

    

    const dados = { modelo, placa, ano, empresaId };

    if (editandoId) {
      await editarVeiculo(editandoId, dados);
    } else {
      await criarVeiculo(dados, userData.tenantId);

    }

    setModelo("");
    setPlaca("");
    setAno("");
    setEmpresaId("");
    setEditandoId(null);
  }

  function handleEditar(v) {
    setModelo(v.modelo);
    setPlaca(v.placa);
    setAno(v.ano);
    setEmpresaId(v.empresaId);
    setEditandoId(v.id);
  }

  async function handleExcluir(id) {
    if (window.confirm("Excluir veículo?")) {
      await excluirVeiculo(id);
    }
  }

  function nomeEmpresa(id) {
    const emp = empresas.find((e) => e.id === id);
    return emp ? emp.nome : "—";
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.topo}>
          <button style={styles.voltar} onClick={() => navigate("/home")}>
            ← Voltar
          </button>
        </div>

        <h2 style={styles.title}>Veículo</h2>
        <p style={styles.subtitle}>Cadastro de veículos</p>

        <form onSubmit={handleSalvar} style={styles.form}>
          <input
            placeholder="Modelo do Veículo"
            value={modelo}
            onChange={(e) => setModelo(e.target.value)}
            style={styles.input}
          />

          <input
            placeholder="Placa"
            value={placa}
            onChange={(e) => setPlaca(e.target.value)}
            style={styles.input}
          />

          <input
            placeholder="Ano"
            value={ano}
            onChange={(e) => setAno(e.target.value)}
            style={styles.input}
          />

          <select
            value={empresaId}
            onChange={(e) => setEmpresaId(e.target.value)}
            style={styles.select}
          >
            <option value="">Selecione a empresa</option>

            {loadingEmpresas && (
              <option disabled>Carregando empresas...</option>
            )}

            {!loadingEmpresas &&
              empresas.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.nome}
                </option>
              ))}
          </select>

          <button style={styles.btnSalvar}>
            {editandoId ? "Atualizar" : "Salvar"}
          </button>
        </form>

        <div style={styles.lista}>
          {veiculos.map((v) => (
            <div key={v.id} style={styles.item}>
              <div>
                <strong>{v.modelo}</strong>
                <div style={styles.small}>Placa: {v.placa}</div>
                <div style={styles.small}>Ano: {v.ano}</div>
                <div style={styles.small}>
                  Empresa: {nomeEmpresa(v.empresaId)}
                </div>
              </div>

              <div style={styles.acoes}>
                <button
                  style={styles.btnEditar}
                  onClick={() => handleEditar(v)}
                >
                  Editar
                </button>
                <button
                  style={styles.btnExcluir}
                  onClick={() => handleExcluir(v.id)}
                >
                  Excluir
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

