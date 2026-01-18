import novenasDB from "./novena.json" with { type: "json" };

const montarDiaDaNovena = (dadosDaNovena, numeroDia) => {
  const diaEspecifico = dadosDaNovena.dias.find(d => d.numero === numeroDia);
  if (!diaEspecifico) return [{ passo: "ERRO", titulo: "Dia não encontrado", texto: "" }];

  return dadosDaNovena.roteiro.map(item => {
    if (item.tipo === "dia") {
      return { 
        passo: "ORAÇÃO DO DIA",
        titulo: diaEspecifico.titulo, 
        texto: diaEspecifico.texto_markdown 
      };
    }
    
    // Mapeamento correto das chaves do seu JSON
    const categorias = {
      "fixo": "fixos",
      "acao": "acoes",
      "comum": "comuns"
    };

    const chaveCategoria = categorias[item.tipo];
    const fonte = dadosDaNovena[chaveCategoria]; 
    const conteudo = fonte ? fonte[item.ref] : null;

    if (!conteudo) {
      return { 
        passo: "ERRO", 
        titulo: "Referência não encontrada", 
        texto: `Verifique a ref: "${item.ref}" em "${chaveCategoria}"` 
      };
    }

    return {
      passo: item.tipo.toUpperCase(),
      titulo: conteudo.titulo,
      texto: conteudo.texto_markdown || "(Oração decorada/conhecida)"
    };
  });
};

// --- EXECUÇÃO E IMPRESSÃO ---
const slug = 'nossa-senhora-das-gracas';
const novena = novenasDB.novenas.find(n => n.slug === slug);

if (novena) {
  console.log(`✅ Novena: ${novena.catalogo.titulo}`);
  
  const roteiro = montarDiaDaNovena(novena, 1);
  
  console.log("\n--- INICIANDO ORAÇÃO ---");
  roteiro.forEach((item, index) => {
    console.log(`\n[${index + 1}] ${item.passo}: ${item.titulo}`);
    console.log(item.texto);
  });
  console.log("\n--- FIM DA ORAÇÃO ---");
} else {
  console.log("❌ Novena não encontrada.");
}