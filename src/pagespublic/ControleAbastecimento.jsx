import { useNavigate } from "react-router-dom";
import { useEffect } from "react";


export default function ControleAbastecimento() {
const navigate = useNavigate();

useEffect(() => {
document.title = "Controle de Abastecimento de Veículos | Sistema Online de Frota";

const metaDescription = document.querySelector('meta[name="description"]');
if (metaDescription) {
metaDescription.setAttribute(
"content",
"Sistema online para controle de abastecimento de veículos da empresa. Registre litros, valores, motorista e quilometragem direto pelo celular."
);
}
}, []);


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
      Controle de Abastecimento de Veículos
    </h1>

    <p style={{fontSize: 18, lineHeight: 1.7}}>
      Você não sabe quanto sua empresa realmente gasta com combustível?
      Seu motorista abastece mas você não tem como conferir?
    </p>

    <p style={{fontSize: 18, lineHeight: 1.7, marginTop: 20}}>
      O Gestão de Frotas registra cada abastecimento realizado pelos motoristas
      direto pelo celular, salvando:
    </p>

    <ul style={{lineHeight:2, fontSize:17, marginTop:20}}>
      <li>Km do veículo</li>
      <li>Litros abastecidos</li>
      <li>Valor pago</li>
      <li>Tipo de combustível</li>
      <li>Motorista responsável</li>
      <li>Data e hora automática</li>
    </ul>

    <p style={{fontSize:18, marginTop:25}}>
      Assim você identifica desperdícios, desvios e consumo anormal imediatamente. O sistema gera controle separado por veiculo, por tipo de combustível e por motorista.
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
