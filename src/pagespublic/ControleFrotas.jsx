import { useNavigate } from "react-router-dom";
import { useEffect } from "react";


export default function ControleFrotas() {
const navigate = useNavigate();

useEffect(() => {
document.title = "Sistema de Controle de Frotas Online para Empresas";

const metaDescription = document.querySelector('meta[name="description"]');
if (metaDescription) {
metaDescription.setAttribute(
"content",
"Software de gestão de frotas online. Controle veículos, motoristas, viagens e abastecimentos direto pelo celular. Ideal para empresas com carros, vans ou caminhões."
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

```
  <div style={{maxWidth: 900, margin: "0 auto"}}>

    <h1 style={{fontSize: 38, color: "#60a5fa", marginBottom: 20}}>
      Sistema de Controle de Frotas Online
    </h1>

    <p style={{fontSize: 18, lineHeight: 1.7, marginBottom: 20}}>
      O Gestão de Frotas é um sistema completo para empresas que precisam
      controlar veículos, motoristas, abastecimentos e viagens em tempo real.
    </p>

    <p style={{fontSize: 18, lineHeight: 1.7, marginBottom: 20}}>
      Ideal para transportadoras, prestadores de serviço, empresas com veículos
      próprios, entregas urbanas e equipes externas.
    </p>

    <h2 style={{color:"#93c5fd", marginTop:40}}>O que você pode controlar:</h2>

    <ul style={{lineHeight:2, fontSize:17}}>
      <li>Cadastro de veículos e frotas controle total</li>
      <li>Cadastro de motoristas para operar e registar o serviço no app</li>
      <li>Controle de abastecimentos detalhados</li>
      <li>Controle de viagens por GPS</li>
      <li>Relatórios completos</li>
      <li>Acesso pelo celular</li>
      <li>Funciona como aplicativo (PWA)</li>
    </ul>

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
