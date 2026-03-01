import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useEmpresas } from "../../contexts/EmpresaContext";
import { editarEmpresa } from "../../services/empresas.service";
import { serverTimestamp } from "firebase/firestore";

/* ================= ESTILOS ================= */
const styles = {
  container: {
    minHeight: "100vh",
    background: "#020617",
    display: "flex",
    justifyContent: "flex-start",
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
    color: "#fff",
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
  btnSalvar: {
    padding: 12,
    background: "#2563eb",
    color: "#fff",
    border: "none",
    borderRadius: 6,
    cursor: "pointer",
    fontWeight: "bold",
  },
  btnDesativar: {
    padding: 12,
    background: "#dc2626",
    color: "#fff",
    border: "none",
    borderRadius: 6,
    cursor: "pointer",
    fontWeight: "bold",
  },
  aviso: {
    background: "#0f172a",
    color: "#facc15",
    padding: 10,
    borderRadius: 6,
    fontSize: 13,
    marginBottom: 12,
    textAlign: "center",
  },
};

/* ================= COMPONENTE ================= */
export default function Empresa() {
  const navigate = useNavigate();
  const { empresas, loadingEmpresas } = useEmpresas();

  const empresa = empresas?.[0]; // SEMPRE UMA EMPRESA

  const [nome, setNome] = useState("");
  const [cnpj, setCnpj] = useState("");
  const [telefone, setTelefone] = useState("");
  const [editando, setEditando] = useState(false);

  useEffect(() => {
    if (empresa) {
      setNome(empresa.nome || "");
      setCnpj(empresa.cnpj || "");
      setTelefone(empresa.telefone || "");
    }
  }, [empresa]);

const empresaDesativada =
  empresa?.licenseActive !== true && empresa?.isActive === false;


  async function handleSalvar(e) {
    e.preventDefault();
    if (!empresa || empresaDesativada) return;

    await editarEmpresa(empresa.id, {
      cnpj,
      telefone,
    });

    setEditando(false);
    alert("Empresa atualizada com sucesso");
  }

  async function handleDesativar() {
  if (!window.confirm("Deseja realmente desativar a empresa?")) return;

  await editarEmpresa(empresa.id, {
    isActive: false,
    trialActive: false,
    licenseActive: false,
    desativadaEm: serverTimestamp(),
    atualizadoEm: serverTimestamp(),
  });

  navigate("/ativar-licenca", { replace: true });
}


  if (loadingEmpresas) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <p style={{ color: "#fff" }}>Carregando empresa...</p>
        </div>
      </div>
    );
  }

  if (!empresa) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <p style={{ color: "#fff" }}>Nenhuma empresa encontrada.</p>
          <button style={styles.btnSalvar} onClick={() => navigate("/home")}>
            Voltar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.topo}>
          <button style={styles.voltar} onClick={() => navigate("/home")}>
            ← Voltar
          </button>
        </div>

        <h2 style={styles.title}>Empresa</h2>
        <p style={styles.subtitle}>Editar dados da empresa</p>

        {empresaDesativada && (
          <div style={styles.aviso}>
            ⚠️ Empresa desativada — acesso somente leitura.
          </div>
        )}

        <form onSubmit={handleSalvar} style={styles.form}>
          <input
            placeholder="Nome da empresa"
            value={nome}
            style={styles.input}
            disabled
          />

          <input
            placeholder="CNPJ"
            value={cnpj}
            onChange={(e) => setCnpj(e.target.value)}
            style={styles.input}
            disabled={!editando || empresaDesativada}
          />

          <input
            placeholder="Telefone"
            value={telefone}
            onChange={(e) => setTelefone(e.target.value)}
            style={styles.input}
            disabled={!editando || empresaDesativada}
          />

          {!empresaDesativada && editando && (
            <>
              <button style={styles.btnSalvar}>Salvar alterações</button>

              <button
                type="button"
                style={{ ...styles.btnSalvar, background: "#475569" }}
                onClick={() => {
                  setEditando(false);
                  setCnpj(empresa.cnpj || "");
                  setTelefone(empresa.telefone || "");
                }}
              >
                Cancelar
              </button>
            </>
          )}
        </form>

        {!empresaDesativada && !editando && (
          <>
            <button
              style={styles.btnSalvar}
              onClick={() => setEditando(true)}
            >
              Editar
            </button>

            <button
              style={styles.btnDesativar}
              onClick={handleDesativar}
            >
              Desativar empresa
            </button>
          </>
        )}
      </div>
    </div>
  );
}
