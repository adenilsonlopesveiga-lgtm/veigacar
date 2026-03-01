import { useNavigate } from "react-router-dom";

export default function ControleMotoristas() {
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
      Controle de Motoristas da Empresa
    </h1>

    <p style={{fontSize: 18, lineHeight: 1.7}}>
      Sua empresa possui vários motoristas e você não consegue saber
      quem utilizou cada veículo?
    </p>

    <p style={{fontSize: 18, lineHeight: 1.7, marginTop: 20}}>
      Com o Gestão de Frotas cada motorista possui login próprio e todas
      as ações ficam registradas automaticamente no sistema.
    </p>

    <ul style={{lineHeight:2, fontSize:17, marginTop:20}}>
      <li>Identificação do motorista em cada viagem</li>
      <li>Responsável por cada abastecimento</li>
      <li>Histórico completo de utilização</li>
      <li>Registro automático de data e hora</li>
      <li>Evita uso indevido do veículo</li>
      <li>Mais segurança para a empresa</li>
    </ul>

    <p style={{fontSize:18, marginTop:25}}>
      Você passa a saber exatamente quem utilizou o veículo, quando utilizou
      e o que foi feito durante a operação.
    </p>

    <div style={{marginTop:40, textAlign:"center"}}>
      <div style={{marginTop:40, textAlign:"center"}}>

  <div style={{display:"flex", gap:14, justifyContent:"center", flexWrap:"wrap"}}>

```
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
```

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
</div>

);
}
