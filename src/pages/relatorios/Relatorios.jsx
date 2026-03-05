import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

import {
  collection,
  query,
  where,
  getDocs,
  orderBy,
  Timestamp,
} from "firebase/firestore";
import { db } from "../../services/firebase";
import { useEmpresas } from "../../contexts/EmpresaContext";

/* =======================
   ESTILOS
======================= */
const styles = {
  container: {
    minHeight: "100vh",
    background: "radial-gradient(circle at top, #020617, #000)",
    padding: 20,
    color: "#fff",
  },
  card: {
    maxWidth: 1200,
    margin: "0 auto",
    background: "rgba(2,6,23,0.9)",
    borderRadius: 14,
    padding: 24,
    boxShadow: "0 20px 60px rgba(0,0,0,0.6)",
  },
  header: {
    display: "flex",
    alignItems: "center",
    gap: 16,
    marginBottom: 24,
  },
  logo: { height: 60 },
  empresa: { fontSize: 20, fontWeight: "bold" },

  filtros: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
    gap: 12,
    marginBottom: 24,
  },
  input: {
    padding: 10,
    borderRadius: 8,
    border: "1px solid #1e293b",
    background: "#020617",
    color: "#fff",
  },
  button: {
    padding: 12,
    borderRadius: 10,
    border: "none",
    background: "#2563eb",
    color: "#fff",
    fontWeight: "bold",
    cursor: "pointer",
  },

  resumo: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
    gap: 14,
    marginBottom: 30,
  },
  resumoCard: {
    background: "#020617",
    border: "1px solid #1e293b",
    borderRadius: 12,
    padding: 16,
    textAlign: "center",
  },

  section: { marginBottom: 32 },
  sectionTitle: { fontSize: 16, fontWeight: "bold", marginBottom: 10 },

  tableWrapper: { overflowX: "auto" },
  table: { width: "100%", borderCollapse: "collapse" },
  th: {
    borderBottom: "1px solid #334155",
    padding: 8,
    textAlign: "left",
    fontSize: 13,
    color: "#94a3b8",
  },
  td: {
    borderBottom: "1px solid #1e293b",
    padding: 8,
    fontSize: 13,
  },
};

/* =======================
   UTIL — HORAS EXTRAS (retorna MINUTOS)
======================= */
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
    minutos += Math.max(0, Math.floor((fim - Math.max(inicio, fimDia)) / 60000));
  }

  return minutos;
}

/* =======================
   FUNÇÕES AUXILIARES
======================= */
function formatarDataBR(data) {
  if (!data) return "";
  const [ano, mes, dia] = data.split("-");
  return `${dia}/${mes}/${ano.slice(2)}`;
}

/* =======================
   COMPONENTE
======================= */
export default function Relatorios() {
  const navigate = useNavigate();
  const { empresas, loadingEmpresas } = useEmpresas();
  const empresaAtual = empresas?.[0];

  // 🔹 filtros (selects)
  const [motoristas, setMotoristas] = useState([]);
  const [veiculos, setVeiculos] = useState([]);
  const [motoristaId, setMotoristaId] = useState("todos");
  const [veiculoId, setVeiculoId] = useState("todos");

  /* MAPA VEICULOS (id -> nome) */
  const [mapaVeiculos, setMapaVeiculos] = useState({});

  /* FILTROS */
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");

  /* VIAGENS */
  const [viagens, setViagens] = useState([]);
  const [loadingViagens, setLoadingViagens] = useState(false);
  const [totalKm, setTotalKm] = useState(0);
  const [kmPorVeiculo, setKmPorVeiculo] = useState([]);
  const [totalHoras, setTotalHoras] = useState(0);
  const [totalExtras, setTotalExtras] = useState(0); // MINUTOS

  /* ABASTECIMENTOS */
  const [abastecimentos, setAbastecimentos] = useState([]);
  const [loadingAbastecimentos, setLoadingAbastecimentos] = useState(false);
  const [totalAbastecimentos, setTotalAbastecimentos] = useState(0);
  const [totalLitros, setTotalLitros] = useState(0);
  const [totalGasto, setTotalGasto] = useState(0);

  // Mantém gasolina/etanol (se você ainda quiser nos cards)
  const [totalGasolina, setTotalGasolina] = useState(0);
  const [totalEtanol, setTotalEtanol] = useState(0);

  // Dinâmicos
  const [resumoCombustivel, setResumoCombustivel] = useState({});
  const [resumoVeiculo, setResumoVeiculo] = useState({});

  /* FINANCEIRO */
  const [valorServico, setValorServico] = useState(0);
  const [valorHoraExtra, setValorHoraExtra] = useState(0);
  const [valorViagensExtras, setValorViagensExtras] = useState(0);

  /* =======================
     BUSCAR VIAGENS
  ======================= */
  async function buscarViagens() {
    if (!empresaAtual?.tenantId || !dataInicio || !dataFim) return;

    try {
      setLoadingViagens(true);

      const inicio = Timestamp.fromDate(new Date(`${dataInicio}T00:00:00`));
      const fim = Timestamp.fromDate(new Date(`${dataFim}T23:59:59`));

      let q = query(
        collection(db, "trips"),
        where("tenantId", "==", empresaAtual.tenantId),
        where("inicio", ">=", inicio),
        where("inicio", "<=", fim),
        orderBy("inicio", "asc") // obrigatório
      );

      // filtro por motorista
      if (motoristaId !== "todos") {
        q = query(q, where("driverId", "==", motoristaId));
      }

      // filtro por veículo
      if (veiculoId !== "todos") {
        q = query(q, where("vehicleId", "==", veiculoId));
      }

      const snapshot = await getDocs(q);

      const lista = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setViagens(lista);

      // totalHoras fica aqui (não depende de mapaVeiculos)
      let horasTotal = 0;
      lista.forEach((v) => {
        if (v.inicio && v.fim) {
          const horas = (v.fim.toDate() - v.inicio.toDate()) / 3600000;
          if (horas > 0) horasTotal += horas;
        }
      });
      setTotalHoras(horasTotal);
    } catch (e) {
      console.error("Erro ao buscar viagens:", e);
    } finally {
      setLoadingViagens(false);
    }
  }

  /* =======================
     RESUMO ABASTECIMENTOS
     (combustível + veículo)
  ======================= */
  function calcularResumoAbastecimentos(lista) {
    let litros = 0;
    let total = 0;
    let gasolina = 0;
    let etanol = 0;

    const resumoComb = {};
    const resumoVeic = {};

    lista.forEach((a) => {
      const d = a.dados || a; // suporta estrutura antiga e nova

      const l = Number(d.litros || 0);
      const v = Number(d.valorTotal || 0);
      const comb = d.tipoCombustivel || "Outro";

      litros += l;
      total += v;

      if (comb === "Gasolina") gasolina += v;
      if (comb === "Etanol") etanol += v;

      /* ===== POR COMBUSTÍVEL ===== */
      if (!resumoComb[comb]) {
        resumoComb[comb] = { litros: 0, valor: 0 };
      }
      resumoComb[comb].litros += l;
      resumoComb[comb].valor += v;

      /* ===== POR VEÍCULO ===== */
      const veicId = d.vehicleId || d.veiculoId;
      const nomeVeiculo =
        (veicId && mapaVeiculos[veicId]) || d.vehicleName || "Veículo não informado";

      if (!resumoVeic[nomeVeiculo]) {
        resumoVeic[nomeVeiculo] = { litros: 0, valor: 0 };
      }
      resumoVeic[nomeVeiculo].litros += l;
      resumoVeic[nomeVeiculo].valor += v;
    });

    setTotalAbastecimentos(lista.length);
    setTotalLitros(litros);
    setTotalGasto(total);
    setTotalGasolina(gasolina);
    setTotalEtanol(etanol);

    setResumoCombustivel(resumoComb);
    setResumoVeiculo(resumoVeic);
  }

  /* =======================
     BUSCAR ABASTECIMENTOS (com filtros alinhados)
  ======================= */
  async function buscarAbastecimentos() {
    if (!empresaAtual?.tenantId || !dataInicio || !dataFim) return;

    try {
      setLoadingAbastecimentos(true);

      const inicio = Timestamp.fromDate(new Date(`${dataInicio}T00:00:00`));
      const fim = Timestamp.fromDate(new Date(`${dataFim}T23:59:59`));

      // monta query base + filtros (para estrutura antiga e nova)
      const montarQuery = (campoTenant, estrutura) => {
        let q = query(
          collection(db, "abastecimentos"),
          where(campoTenant, "==", empresaAtual.tenantId),
          where("createdAt", ">=", inicio),
          where("createdAt", "<=", fim),
          orderBy("createdAt", "asc")
        );

        // motorista / veiculo (antigo: dados.driverId / dados.vehicleId)
        if (motoristaId !== "todos") {
          q = query(
            q,
            where(estrutura === "antiga" ? "dados.driverId" : "driverId", "==", motoristaId)
          );
        }

        if (veiculoId !== "todos") {
          q = query(
            q,
            where(estrutura === "antiga" ? "dados.vehicleId" : "vehicleId", "==", veiculoId)
          );
        }

        return q;
      };

      const q1 = montarQuery("dados.tenantId", "antiga");
      const q2 = montarQuery("tenantId", "nova");

      const [snap1, snap2] = await Promise.all([getDocs(q1), getDocs(q2)]);

      // unir e remover duplicados
      const map = new Map();
      snap1.docs.forEach((doc) => map.set(doc.id, { id: doc.id, ...doc.data() }));
      snap2.docs.forEach((doc) => map.set(doc.id, { id: doc.id, ...doc.data() }));

      const lista = Array.from(map.values()).sort(
        (a, b) => (a.createdAt?.seconds || 0) - (b.createdAt?.seconds || 0)
      );

      setAbastecimentos(lista);
      calcularResumoAbastecimentos(lista);
    } catch (e) {
      console.error("Erro ao buscar abastecimentos:", e);
    } finally {
      setLoadingAbastecimentos(false);
    }
  }

  /* =======================
     EFFECTS
  ======================= */

  // Buscar veículos para mostrar nome no relatório
  useEffect(() => {
    async function buscarVeiculos() {
      if (!empresaAtual?.tenantId) return;

      const snap = await getDocs(
        query(collection(db, "vehicles"), where("tenantId", "==", empresaAtual.tenantId))
      );

      const lista = [];
      const mapa = {};

      snap.docs.forEach((doc) => {
        const v = doc.data();
        const nome = v.vehicleName || v.placa || v.modelo || "Veículo";

        lista.push({ id: doc.id, nome });
        mapa[doc.id] = nome;
      });

      setVeiculos(lista);
      setMapaVeiculos(mapa);
    }

    buscarVeiculos();
  }, [empresaAtual?.tenantId]);

  // Buscar motoristas (MOVIDO para cima — não pode ficar após return)
  useEffect(() => {
    async function buscarMotoristas() {
      if (!empresaAtual?.tenantId) return;

      const snap = await getDocs(
        query(collection(db, "users"), where("tenantId", "==", empresaAtual.tenantId))
      );

      const lista = snap.docs.map((d) => ({
        id: d.id,
        nome: d.data().nome || d.data().email || "Sem nome",
      }));

      setMotoristas(lista);
    }

    buscarMotoristas();
  }, [empresaAtual?.tenantId]);

  // Buscar dados quando filtros mudarem
  useEffect(() => {
    if (dataInicio && dataFim && empresaAtual?.tenantId) {
      buscarViagens();
      buscarAbastecimentos();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dataInicio, dataFim, empresaAtual?.tenantId, motoristaId, veiculoId]);

  // KM total + KM por veículo DERIVADOS DAS VIAGENS FILTRADAS (substitui carregarKmPorVeiculo)
  useEffect(() => {
    if (!viagens || viagens.length === 0) {
      setTotalKm(0);
      setKmPorVeiculo([]);
      return;
    }

    let total = 0;
    const mapa = {};

    viagens.forEach((v) => {
      if (v.kmInicial == null || v.kmFinal == null) return;

      const km = Number(v.kmFinal) - Number(v.kmInicial);
      if (!Number.isFinite(km) || km <= 0) return;

      total += km;

      const nomeVeiculo =
        v.vehicleName ||
        (v.vehicleId && mapaVeiculos[v.vehicleId]) ||
        "Veículo não informado";

      mapa[nomeVeiculo] = (mapa[nomeVeiculo] || 0) + km;
    });

    setTotalKm(total);
    setKmPorVeiculo(Object.entries(mapa).map(([veiculo, km]) => ({ veiculo, km })));
  }, [viagens, mapaVeiculos]);

  // Recalcular minutos extras sempre que viagens mudarem
  useEffect(() => {
    if (!viagens || viagens.length === 0) {
      setTotalExtras(0);
      return;
    }

    let minutosExtras = 0;
    viagens.forEach((v) => {
      minutosExtras += calcularHorasExtras(v.inicio, v.fim);
    });

    setTotalExtras(minutosExtras);
  }, [viagens]);

  // Se mapaVeiculos carregar depois, refaz o resumo por veículo usando os abastecimentos já carregados
  useEffect(() => {
    if (!abastecimentos || abastecimentos.length === 0) return;
    calcularResumoAbastecimentos(abastecimentos);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapaVeiculos]);

  // guards
  if (loadingEmpresas) {
    return <div style={{ padding: 20 }}>Carregando empresa...</div>;
  }
  if (!empresaAtual) {
    return <div style={{ padding: 20 }}>Nenhuma empresa encontrada.</div>;
  }

  /* =======================
     FINANCEIRO
  ======================= */
  const horasExtras = totalExtras / 60;
  const valorExtrasCalculado = horasExtras * Number(valorHoraExtra || 0);

  const totalGeral =
    Number(valorServico || 0) +
    Number(valorExtrasCalculado || 0) +
    Number(valorViagensExtras || 0);

  /* ===== ORDENAR RESUMOS ===== */
  const resumoCombustivelOrdenado = useMemo(() => {
    return Object.entries(resumoCombustivel || {}).sort(
      (a, b) => (b[1]?.valor || 0) - (a[1]?.valor || 0)
    );
  }, [resumoCombustivel]);

  const resumoVeiculoOrdenado = useMemo(() => {
    return Object.entries(resumoVeiculo || {}).sort(
      (a, b) => (b[1]?.valor || 0) - (a[1]?.valor || 0)
    );
  }, [resumoVeiculo]);

  /* =======================
     PDF
  ======================= */
  function gerarPdfRelatorio() {
    const doc = new jsPDF("p", "mm", "a4");

    const logo = new Image();
    logo.src = "/logo.png";
    doc.addImage(logo, "PNG", 10, 10, 30, 30);

    let y = 45;

    doc.setFontSize(14);
    doc.text(`Relatório - ${empresaAtual?.nome}`, 10, y);
    y += 6;

    doc.setFontSize(10);
    doc.text(
      `Período: ${formatarDataBR(dataInicio)} até ${formatarDataBR(dataFim)}`,
      10,
      y
    );
    y += 6;

    doc.setFontSize(9);
    doc.setTextColor(120);
    doc.text(
      "Todos esses dados se referem exclusivamente aos gerados pelos motoristas oficiais da empresa que foram lançados no App Gestão de Frotas.",
      10,
      y
    );
    y += 8;
    doc.setTextColor(0);

    doc.setFontSize(11);
    doc.text("Resumo Geral", 10, y);
    y += 4;

    autoTable(doc, {
      startY: y,
      head: [["Indicador", "Valor"]],
      body: [
        ["Total de Viagens", viagens.length],
        ["KM Rodados", `${Number(totalKm || 0).toFixed(1)} km`],
        ["Horas Dirigindo", `${Number(totalHoras || 0).toFixed(2)} h`],
        ["Minutos Extras", totalExtras],
        ["Total Abastecimentos", totalAbastecimentos],
        ["Total Litros", `${Number(totalLitros || 0).toFixed(2)} L`],
        ["Total Gasto", `R$ ${Number(totalGasto || 0).toFixed(2)}`],
      ],
      theme: "grid",
      styles: { fontSize: 9 },
    });

    y = doc.lastAutoTable.finalY + 8;

    doc.setFontSize(11);
    doc.text("KM Total por Veículo", 10, y);
    y += 4;

    autoTable(doc, {
      startY: y,
      head: [["Veículo", "KM Total"]],
      body:
        kmPorVeiculo.length === 0
          ? [["Nenhum registro", "-"]]
          : kmPorVeiculo.map((v) => [v.veiculo, `${Number(v.km || 0).toFixed(1)} km`]),
      theme: "grid",
      styles: { fontSize: 9 },
    });

    y = doc.lastAutoTable.finalY + 8;

    doc.setFontSize(11);
    doc.text("Detalhamento das Viagens", 10, y);
    y += 4;

    autoTable(doc, {
      startY: y,
      pageBreak: "auto",
      head: [
        [
          "Data",
          "Motorista",
          "Veículo",
          "Destino",
          "KM Inicial / Final",
          "Saída / Chegada",
          "Observações",
        ],
      ],
      body: viagens.map((v) => [
        v.inicio?.toDate().toLocaleDateString() || "-",
        v.driverName || "-",
        v.vehicleName || "-",
        v.destino || "-",
        v.kmInicial != null && v.kmFinal != null ? `${v.kmInicial} / ${v.kmFinal}` : "-",
        v.inicio && v.fim
          ? `${v.inicio.toDate().toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })} / ${v.fim.toDate().toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}`
          : "-",
        v.observacoes || "-",
      ]),
      theme: "grid",
      styles: { fontSize: 7, cellPadding: 2 },
      columnStyles: {
        0: { cellWidth: 18 },
        1: { cellWidth: 26 },
        2: { cellWidth: 26 },
        3: { cellWidth: 30 },
        4: { cellWidth: 22 },
        5: { cellWidth: 26 },
        6: { cellWidth: "auto" },
      },
    });

    y = doc.lastAutoTable.finalY + 8;

    doc.setFontSize(11);
    doc.text("Detalhamento dos Abastecimentos", 10, y);
    y += 4;

    autoTable(doc, {
      startY: y,
      pageBreak: "auto",
      head: [["Data", "Motorista", "Veículo", "Combustível", "Litros", "Valor", "Obs"]],
      body: abastecimentos.map((a) => {
        const d = a.dados || {};
        const combustivel = d.tipoCombustivel || a.tipoCombustivel || "-";

        const litros =
          d.litros != null
            ? Number(d.litros).toFixed(2)
            : a.litros != null
            ? Number(a.litros).toFixed(2)
            : "-";

        const valor =
          d.valorTotal != null
            ? `R$ ${Number(d.valorTotal).toFixed(2)}`
            : a.valorTotal != null
            ? `R$ ${Number(a.valorTotal).toFixed(2)}`
            : "R$ 0,00";

        const veicId = d.vehicleId || a.vehicleId || d.veiculoId || a.veiculoId;

        return [
          a.createdAt?.toDate ? a.createdAt.toDate().toLocaleDateString() : "-",
          d.driverName || a.driverName || "-",
          (veicId && mapaVeiculos[veicId]) || d.vehicleName || a.vehicleName || "-",
          combustivel,
          litros,
          valor,
          d.observacoes || a.observacoes || "-",
        ];
      }),
      theme: "grid",
      styles: { fontSize: 7, cellPadding: 2 },
    });

    y = doc.lastAutoTable.finalY + 8;

    doc.setFontSize(11);
    doc.text("Gasto por Combustível", 10, y);
    y += 4;

    autoTable(doc, {
      startY: y,
      head: [["Combustível", "Litros", "Valor"]],
      body: Object.entries(resumoCombustivel).map(([tipo, d]) => [
        tipo,
        `${d.litros.toFixed(2)} L`,
        `R$ ${d.valor.toFixed(2)}`,
      ]),
      theme: "grid",
      styles: { fontSize: 9 },
    });

    y = doc.lastAutoTable.finalY + 8;

    doc.setFontSize(11);
    doc.text("Gasto por Veículo", 10, y);
    y += 4;

    autoTable(doc, {
      startY: y,
      head: [["Veículo", "Litros", "Valor"]],
      body: Object.entries(resumoVeiculo).map(([veic, d]) => [
        veic,
        `${d.litros.toFixed(2)} L`,
        `R$ ${d.valor.toFixed(2)}`,
      ]),
      theme: "grid",
      styles: { fontSize: 9 },
    });

    y = doc.lastAutoTable.finalY + 8;

    doc.setFontSize(11);
    doc.text("Resumo Financeiro", 10, y);
    y += 4;

    autoTable(doc, {
      startY: y,
      head: [["Descrição", "Valor"]],
      body: [
        ["Valor do Serviço", `R$ ${Number(valorServico).toFixed(2)}`],
        ["Horas Extras", `R$ ${Number(valorExtrasCalculado).toFixed(2)}`],
        ["Viagens Extras", `R$ ${Number(valorViagensExtras).toFixed(2)}`],
        ["Total Geral", `R$ ${Number(totalGeral).toFixed(2)}`],
      ],
      theme: "grid",
      styles: { fontSize: 9 },
    });

    const pageHeight = doc.internal.pageSize.height;

    doc.setFontSize(9);
    doc.text("_______________________________________________", 10, pageHeight - 30);
    doc.text("Assinatura / Responsável", 10, pageHeight - 22);

    doc.setFontSize(8);
    doc.setTextColor(120);
    doc.text(
      "Todos os dados deste relatório foram gerados exclusivamente a partir das informações lançadas no aplicativo Gestão de Frotas.",
      10,
      pageHeight - 10
    );

    doc.save(`relatorio_${empresaAtual?.nome}_${dataInicio}_${dataFim}.pdf`);
  }

  /* =========================
     RENDER
  ========================= */
  return (
    <div style={styles.container}>
      <div style={styles.card}>
        {/* ===== CABEÇALHO ===== */}
        <div style={styles.header}>
          <img src="/logo.png" alt="Gestão de Frotas" style={styles.logo} />
          <div style={styles.empresa}>Relatório — {empresaAtual?.nome}</div>
        </div>

        {/* ===== FILTROS ===== */}
        <div style={styles.filtros}>
          <input
            type="date"
            style={styles.input}
            value={dataInicio}
            onChange={(e) => setDataInicio(e.target.value)}
          />

          <select style={styles.input} value={motoristaId} onChange={(e) => setMotoristaId(e.target.value)}>
            <option value="todos">Todos os motoristas</option>
            {motoristas.map((m) => (
              <option key={m.id} value={m.id}>
                {m.nome}
              </option>
            ))}
          </select>

          <select style={styles.input} value={veiculoId} onChange={(e) => setVeiculoId(e.target.value)}>
            <option value="todos">Todos os veículos</option>
            {veiculos.map((v) => (
              <option key={v.id} value={v.id}>
                {v.nome}
              </option>
            ))}
          </select>

          <input
            type="date"
            style={styles.input}
            value={dataFim}
            onChange={(e) => setDataFim(e.target.value)}
          />

          <button
            style={styles.button}
            onClick={() => {
              buscarViagens();
              buscarAbastecimentos();
            }}
          >
            Aplicar filtros
          </button>
        </div>

        {/* ===== RESUMO VIAGENS ===== */}
        <div style={styles.resumo}>
          <div style={styles.resumoCard}>
            <div>Total de Viagens</div>
            <strong>{viagens.length}</strong>
          </div>

          <div style={styles.resumoCard}>
            <div>KM Rodados</div>
            <strong>{Number(totalKm || 0).toFixed(1)} km</strong>
          </div>

          <div style={styles.resumoCard}>
            <div>Horas Dirigindo</div>
            <strong>{Number(totalHoras || 0).toFixed(2)} h</strong>
          </div>

          <div style={styles.resumoCard}>
            <div>Horas / Minutos Extras</div>
            <strong>{totalExtras} min</strong>
          </div>
        </div>

        {/* ===== TABELA VIAGENS ===== */}
        <div style={styles.section}>
          <div style={styles.sectionTitle}>Detalhamento das Viagens</div>

          {loadingViagens ? (
            <p>Carregando viagens...</p>
          ) : (
            <div style={styles.tableWrapper}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Data</th>
                    <th style={styles.th}>Motorista</th>
                    <th style={styles.th}>Veículo</th>
                    <th style={styles.th}>Destino</th>
                    <th style={styles.th}>KM Inicial / Final</th>
                    <th style={styles.th}>Saída / Chegada</th>
                    <th style={styles.th}>Obs</th>
                  </tr>
                </thead>
                <tbody>
                  {viagens.map((v) => (
                    <tr key={v.id}>
                      <td style={styles.td}>{v.inicio?.toDate().toLocaleDateString()}</td>
                      <td style={styles.td}>{v.driverName || "-"}</td>
                      <td style={styles.td}>{v.vehicleName || "-"}</td>
                      <td style={styles.td}>{v.destino || "-"}</td>

                      <td style={styles.td}>
                        {v.kmInicial != null ? v.kmInicial : "-"} / {v.kmFinal != null ? v.kmFinal : "-"}
                      </td>

                      <td style={styles.td}>
                        {v.inicio
                          ? v.inicio.toDate().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
                          : "-"}{" "}
                        /{" "}
                        {v.fim
                          ? v.fim.toDate().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
                          : "-"}
                      </td>

                      <td style={styles.td}>{v.observacoes || "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ===== RESUMO ABASTECIMENTOS ===== */}
        <div style={styles.section}>
          <div style={styles.sectionTitle}>Resumo de Abastecimentos</div>

          <div style={styles.resumo}>
            <div style={styles.resumoCard}>
              <div>Total Abastecimentos</div>
              <strong>{totalAbastecimentos}</strong>
            </div>

            <div style={styles.resumoCard}>
              <div>Total Litros</div>
              <strong>{Number(totalLitros || 0).toFixed(2)} L</strong>
            </div>

            <div style={styles.resumoCard}>
              <div>Total Gasto por Empresa</div>
              <div style={{ fontSize: 22, fontWeight: "bold", marginTop: 6 }}>
                R$ {Number(totalGasto || 0).toFixed(2)}
              </div>
            </div>
          </div>
        </div>

        {/* ===== KM TOTAL POR VEÍCULO ===== */}
        <div style={styles.section}>
          <div style={styles.sectionTitle}>KM Total por Veículo</div>

          {kmPorVeiculo.length === 0 ? (
            <p style={{ color: "#94a3b8" }}>Nenhum KM registrado no período.</p>
          ) : (
            <div style={styles.tableWrapper}>
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
                        <strong>{Number(v.km || 0).toFixed(1)} km</strong>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ===== GASTO POR COMBUSTÍVEL ===== */}
        <div style={styles.section}>
          <div style={styles.sectionTitle}>Gasto por Combustível</div>

          <div style={styles.resumo}>
            {resumoCombustivelOrdenado.map(([tipo, d]) => (
              <div key={tipo} style={styles.resumoCard}>
                <div>{tipo}</div>
                <strong>{d.litros.toFixed(2)} L</strong>
                <div>R$ {d.valor.toFixed(2)}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ===== GASTO POR VEÍCULO ===== */}
        <div style={styles.section}>
          <div style={styles.sectionTitle}>Gasto por Veículo</div>

          <div style={styles.resumo}>
            {resumoVeiculoOrdenado.map(([veic, d]) => (
              <div key={veic} style={styles.resumoCard}>
                <div>{veic}</div>
                <strong>{d.litros.toFixed(2)} L</strong>
                <div>R$ {d.valor.toFixed(2)}</div>
              </div>
            ))}
          </div>
        </div>

       {/* ===== TABELA ABASTECIMENTOS ===== */}
<div style={styles.section}>
  <div style={styles.sectionTitle}>Detalhamento dos Abastecimentos</div>

  {loadingAbastecimentos ? (
    <p>Carregando abastecimentos...</p>
  ) : (
    <div style={styles.tableWrapper}>
      <table style={styles.table}>
        <thead>
          <tr>
            <th style={styles.th}>Data</th>
            <th style={styles.th}>Motorista</th>
            <th style={styles.th}>Veículo</th>
            <th style={styles.th}>Combustível</th>
            <th style={styles.th}>Litros</th>
            <th style={styles.th}>Valor</th>
            <th style={styles.th}>Obs</th>
          </tr>
        </thead>
        <tbody>
          {abastecimentos.map((a) => {
            const d = a.dados || {};

            const veicId =
              d.vehicleId ||
              a.vehicleId ||
              d.veiculoId ||
              a.veiculoId ||
              null;

            const dataAbastecimento =
              a.createdAt?.toDate?.() ||
              d.createdAt?.toDate?.() ||
              null;

            const litros =
              d.litros != null
                ? Number(d.litros).toFixed(2)
                : a.litros != null
                ? Number(a.litros).toFixed(2)
                : "-";

            const valor =
              d.valorTotal != null
                ? `R$ ${Number(d.valorTotal).toFixed(2)}`
                : a.valorTotal != null
                ? `R$ ${Number(a.valorTotal).toFixed(2)}`
                : "R$ 0.00";

            return (
              <tr key={a.id}>
                <td style={styles.td}>
                  {dataAbastecimento
                    ? dataAbastecimento.toLocaleDateString()
                    : "-"}
                </td>

                <td style={styles.td}>
                  {d.driverName || a.driverName || "-"}
                </td>

                <td style={styles.td}>
                  {(veicId && mapaVeiculos[veicId]) ||
                    d.vehicleName ||
                    a.vehicleName ||
                    "-"}
                </td>

                <td style={styles.td}>
                  {d.tipoCombustivel || a.tipoCombustivel || "-"}
                </td>

                <td style={styles.td}>{litros}</td>

                <td style={styles.td}>{valor}</td>

                <td style={styles.td}>
                  {d.observacoes || a.observacoes || "-"}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  )}
</div>

        {/* ===== RESUMO FINANCEIRO ===== */}
        <div style={styles.section}>
          <div style={styles.sectionTitle}>Resumo Financeiro</div>

          <div style={styles.filtros}>
            <input
              type="number"
              style={styles.input}
              placeholder="Valor do serviço"
              onChange={(e) => setValorServico(e.target.value)}
            />
            <input
              type="number"
              style={styles.input}
              placeholder="Valor hora extra"
              onChange={(e) => setValorHoraExtra(e.target.value)}
            />
            <input
              type="number"
              style={styles.input}
              placeholder="Viagens extras"
              onChange={(e) => setValorViagensExtras(e.target.value)}
            />
          </div>

          <div style={styles.resumo}>
            <div style={styles.resumoCard}>
              <div>Valor Horas Extras</div>
              <strong>R$ {Number(valorExtrasCalculado || 0).toFixed(2)}</strong>
            </div>
            <div style={styles.resumoCard}>
              <div>Total Geral</div>
              <strong>R$ {Number(totalGeral || 0).toFixed(2)}</strong>
            </div>
          </div>
        </div>

        <button style={{ ...styles.button, width: "100%" }} onClick={gerarPdfRelatorio}>
          Gerar PDF
        </button>
      </div>

      <button
        style={{ ...styles.button, width: "100%", marginTop: 16 }}
        onClick={() => navigate("/home")}
      >
        Voltar
      </button>
    </div>
  );
}
