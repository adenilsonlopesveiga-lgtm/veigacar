import { useNavigate } from "react-router-dom";

export default function ControleViagens() {
const navigate = useNavigate();

return (
<div style={{
minHeight: "100vh",
background: "#020617",
color: "#fff",
padding: "60px 20px",
fontFamily: "Arial"
}}>
<div style={{maxWidth: 900, margin: "0 auto"}}>

```
    <h1 style={{fontSize: 38, color: "#60a5fa", marginBottom: 20}}>
      Controle de Viagens e Uso de Veículos
    </h1>

    <p style={{fontSize: 18, lineHeight: 1.7}}>
      Você não sabe quanto seus veículos realmente trabalham por dia?
      Ou precisa confiar apenas no que o motorista informa?
    </p>

    <p style={{fontSize: 18, lineHeight: 1.7, marginTop: 20}}>
      O Gestão de Frotas registra automaticamente cada saída e retorno
      do veículo direto pelo celular do motorista.
    </p>

    <ul style={{lineHeight:2, fontSize:17, marginTop:20}}>
      <li>Horário de início da viagem</li>
      <li>Destino da viagem e observações</li>
      <li>Horário de término</li>
      <li>Km inicial e final</li>
      <li>Motorista responsável</li>
      <li>Histórico completo de utilização</li>
      <li>Base para cálculo de horas extras</li>
    </ul>

    <p style={{fontSize:18, marginTop:25}}>
      Assim você possui controle real do uso dos veículos e consegue
      comprovar jornadas de trabalho e utilização operacional.
    </p>

    <div style={{marginTop:40, textAlign:"center"}}>

      <div style={{display:"flex", gap:14, justifyContent:"center", flexWrap:"wrap"}}>

        <button
          onClick={() => navigate("/primeiro-acesso")}
          style={{
            padding:"16px 34px",
            background:"#2563eb",
            border:"none",
            borderRadius:10,
            fontSize:18,
            color:"#fff",
            cursor:"pointer",
            fontWeight:"bold"
          }}
        >
          Testar grátis por 30 dias
        </button>

        <button
          onClick={() => navigate("/login")}
          style={{
            padding:"16px 28px",
            background:"transparent",
            border:"2px solid #60a5fa",
            borderRadius:10,
            fontSize:18,
            color:"#60a5fa",
            cursor:"pointer",
            fontWeight:"bold"
          }}
        >
          Já tenho conta
        </button>

      </div>

      <p style={{
        marginTop: 14,
        color: "#94a3b8",
        fontSize: 14
      }}>
        Sem cartão de crédito • Sem compromisso • Cancelamento imediato
      </p>

    </div>

  </div>
</div>

);
}
