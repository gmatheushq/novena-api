import express from "express";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json({ limit: "1mb" }));

// =====================
// Helpers
// =====================
const nowISO = () => new Date().toISOString();

function clampDay(day, max) {
  const d = Number(day);
  if (!Number.isFinite(d) || d < 1 || d > max) return null;
  return d;
}

function slugifyPt(s) {
  return String(s)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

/**
 * Gera id a partir do nome. Mantido por compat.
 * MAS: agora aceitamos `id` explícito no seed (recomendado).
 */
function makeId(nome, type) {
  const base = slugifyPt(nome);
  if (type === "plan") return base.startsWith("plano_") ? base : `plano_${base}`;
  return base.startsWith("novena_") ? base : `novena_${base}`;
}

function isValidSection(x) {
  return (
    x &&
    typeof x === "object" &&
    typeof x.type === "string" &&
    typeof x.text === "string"
  );
}

// =====================
// Seed (mínimo)
// - Você pode adicionar outras novenas depois.
// - Repare que aqui a gente fixa o `id` pra casar com o modelo do Atanásio.
// =====================
const seed = [
  {
  novenaId: "novena_santo_atanasio",
  day: 1,
  title: "Primeiro dia – Santo Atanásio, defensor da verdade",
  sections: [
    { type: "title", text: "Sinal da Cruz" },
    { type: "prayer", text: "Em nome do Pai, do Filho e do Espírito Santo. Amém." },

    { type: "title", text: "Oração Inicial" },
    {
      type: "prayer",
      text: `Ó glorioso Santo Atanásio, bispo e doutor da Igreja, defensor incansável da verdadeira fé, com confiança recorremos à vossa intercessão.

Vós que enfrentastes perseguições e sofrimentos para preservar a verdade sobre a divindade de Cristo, ajudai-nos a permanecer firmes na fé e fiéis ao Evangelho.

Concedei-nos a graça de rezar esta novena com fé sincera, para que, fortalecidos por vosso exemplo, possamos viver na verdade e alcançar as graças que necessitamos, se forem da vontade de Deus.

Amém.`
    },

    { type: "title", text: "Oração do dia" },
    {
      type: "text",
      text: `Ó Santo Atanásio, defendestes com coragem a verdade da fé cristã.

Ensinai-nos a amar e testemunhar a verdade, mesmo quando ela exige sacrifício.

Que nossa vida seja fiel ao Evangelho de Cristo.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
    },

    { type: "title", text: "Oração Final" },
    {
      type: "prayer",
      text: `Ó Santo Atanásio, defensor da verdadeira fé e doutor da Igreja, rogai por nós.

Ajudai-nos a permanecer firmes na verdade de Cristo e fiéis à Igreja.

Amém.`
    }
  ]
},
{
  novenaId: "novena_santo_atanasio",
  day: 2,
  title: "Segundo dia – Santo Atanásio, fé em Cristo verdadeiro Deus",
  sections: [
    { type: "title", text: "Sinal da Cruz" },
    { type: "prayer", text: "Em nome do Pai, do Filho e do Espírito Santo. Amém." },

    { type: "title", text: "Oração Inicial" },
    {
      type: "prayer",
      text: `Ó glorioso Santo Atanásio, bispo e doutor da Igreja, defensor incansável da verdadeira fé, com confiança recorremos à vossa intercessão.

Vós que enfrentastes perseguições e sofrimentos para preservar a verdade sobre a divindade de Cristo, ajudai-nos a permanecer firmes na fé e fiéis ao Evangelho.

Concedei-nos a graça de rezar esta novena com fé sincera, para que, fortalecidos por vosso exemplo, possamos viver na verdade e alcançar as graças que necessitamos, se forem da vontade de Deus.

Amém.`
    },

    { type: "title", text: "Oração do dia" },
    {
      type: "text",
      text: `Ó Santo Atanásio, proclamastes que Jesus Cristo é verdadeiro Deus e verdadeiro homem.

Ajudai-nos a professar nossa fé com clareza e convicção.

Que nunca nos afastemos da doutrina da Igreja.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
    },

    { type: "title", text: "Oração Final" },
    {
      type: "prayer",
      text: `Ó Santo Atanásio, defensor da verdadeira fé e doutor da Igreja, rogai por nós.

Ajudai-nos a permanecer firmes na verdade de Cristo e fiéis à Igreja.

Amém.`
    }
  ]
},
{
  novenaId: "novena_santo_atanasio",
  day: 3,
  title: "Terceiro dia – Santo Atanásio, coragem na perseguição",
  sections: [
    { type: "title", text: "Sinal da Cruz" },
    { type: "prayer", text: "Em nome do Pai, do Filho e do Espírito Santo. Amém." },

    { type: "title", text: "Oração Inicial" },
    {
      type: "prayer",
      text: `Ó glorioso Santo Atanásio, bispo e doutor da Igreja, defensor incansável da verdadeira fé, com confiança recorremos à vossa intercessão.

Vós que enfrentastes perseguições e sofrimentos para preservar a verdade sobre a divindade de Cristo, ajudai-nos a permanecer firmes na fé e fiéis ao Evangelho.

Concedei-nos a graça de rezar esta novena com fé sincera, para que, fortalecidos por vosso exemplo, possamos viver na verdade e alcançar as graças que necessitamos, se forem da vontade de Deus.

Amém.`
    },

    { type: "title", text: "Oração do dia" },
    {
      type: "text",
      text: `Ó Santo Atanásio, suportastes exílios e perseguições por amor à verdade.

Fortalecei-nos para enfrentar as dificuldades da vida cristã.

Que confiemos sempre na proteção de Deus.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
    },

    { type: "title", text: "Oração Final" },
    {
      type: "prayer",
      text: `Ó Santo Atanásio, defensor da verdadeira fé e doutor da Igreja, rogai por nós.

Ajudai-nos a permanecer firmes na verdade de Cristo e fiéis à Igreja.

Amém.`
    }
  ]
},
{
  novenaId: "novena_santo_atanasio",
  day: 4,
  title: "Quarto dia – Santo Atanásio, amor à Igreja",
  sections: [
    { type: "title", text: "Sinal da Cruz" },
    { type: "prayer", text: "Em nome do Pai, do Filho e do Espírito Santo. Amém." },

    { type: "title", text: "Oração Inicial" },
    {
      type: "prayer",
      text: `Ó glorioso Santo Atanásio, bispo e doutor da Igreja, defensor incansável da verdadeira fé, com confiança recorremos à vossa intercessão.

Vós que enfrentastes perseguições e sofrimentos para preservar a verdade sobre a divindade de Cristo, ajudai-nos a permanecer firmes na fé e fiéis ao Evangelho.

Concedei-nos a graça de rezar esta novena com fé sincera, para que, fortalecidos por vosso exemplo, possamos viver na verdade e alcançar as graças que necessitamos, se forem da vontade de Deus.

Amém.`
    },

    { type: "title", text: "Oração do dia" },
    {
      type: "text",
      text: `Ó Santo Atanásio, amastes profundamente a Igreja e lutastes por sua unidade.

Intercedei pelo Papa, pelos bispos e por todos os fiéis.

Ajudai-nos a amar e servir a Igreja com fidelidade.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
    },

    { type: "title", text: "Oração Final" },
    {
      type: "prayer",
      text: `Ó Santo Atanásio, defensor da verdadeira fé e doutor da Igreja, rogai por nós.

Ajudai-nos a permanecer firmes na verdade de Cristo e fiéis à Igreja.

Amém.`
    }
  ]
},
{
  novenaId: "novena_santo_atanasio",
  day: 5,
  title: "Quinto dia – Santo Atanásio, vida de oração",
  sections: [
    { type: "title", text: "Sinal da Cruz" },
    { type: "prayer", text: "Em nome do Pai, do Filho e do Espírito Santo. Amém." },

    { type: "title", text: "Oração Inicial" },
    {
      type: "prayer",
      text: `Ó glorioso Santo Atanásio, bispo e doutor da Igreja, defensor incansável da verdadeira fé, com confiança recorremos à vossa intercessão.

Vós que enfrentastes perseguições e sofrimentos para preservar a verdade sobre a divindade de Cristo, ajudai-nos a permanecer firmes na fé e fiéis ao Evangelho.

Concedei-nos a graça de rezar esta novena com fé sincera, para que, fortalecidos por vosso exemplo, possamos viver na verdade e alcançar as graças que necessitamos, se forem da vontade de Deus.

Amém.`
    },

    { type: "title", text: "Oração do dia" },
    {
      type: "text",
      text: `Ó Santo Atanásio, encontrastes na oração força para perseverar na missão.

Ensinai-nos a buscar a Deus na oração constante.

Que nossa vida seja sustentada pela intimidade com o Senhor.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
    },

    { type: "title", text: "Oração Final" },
    {
      type: "prayer",
      text: `Ó Santo Atanásio, defensor da verdadeira fé e doutor da Igreja, rogai por nós.

Ajudai-nos a permanecer firmes na verdade de Cristo e fiéis à Igreja.

Amém.`
    }
  ]
},
{
  novenaId: "novena_santo_atanasio",
  day: 6,
  title: "Sexto dia – Santo Atanásio, humildade e fidelidade",
  sections: [
    { type: "title", text: "Sinal da Cruz" },
    { type: "prayer", text: "Em nome do Pai, do Filho e do Espírito Santo. Amém." },

    { type: "title", text: "Oração Inicial" },
    {
      type: "prayer",
      text: `Ó glorioso Santo Atanásio, bispo e doutor da Igreja, defensor incansável da verdadeira fé, com confiança recorremos à vossa intercessão.

Vós que enfrentastes perseguições e sofrimentos para preservar a verdade sobre a divindade de Cristo, ajudai-nos a permanecer firmes na fé e fiéis ao Evangelho.

Concedei-nos a graça de rezar esta novena com fé sincera, para que, fortalecidos por vosso exemplo, possamos viver na verdade e alcançar as graças que necessitamos, se forem da vontade de Deus.

Amém.`
    },

    { type: "title", text: "Oração do dia" },
    {
      type: "text",
      text: `Ó Santo Atanásio, mesmo com grande saber, permanecestes humilde diante de Deus.

Ajudai-nos a viver com humildade e fidelidade à vontade divina.

Que reconheçamos que toda verdade vem de Deus.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
    },

    { type: "title", text: "Oração Final" },
    {
      type: "prayer",
      text: `Ó Santo Atanásio, defensor da verdadeira fé e doutor da Igreja, rogai por nós.

Ajudai-nos a permanecer firmes na verdade de Cristo e fiéis à Igreja.

Amém.`
    }
  ]
},
{
  novenaId: "novena_santo_atanasio",
  day: 7,
  title: "Sétimo dia – Santo Atanásio, zelo pela fé",
  sections: [
    { type: "title", text: "Sinal da Cruz" },
    { type: "prayer", text: "Em nome do Pai, do Filho e do Espírito Santo. Amém." },

    { type: "title", text: "Oração Inicial" },
    {
      type: "prayer",
      text: `Ó glorioso Santo Atanásio, bispo e doutor da Igreja, defensor incansável da verdadeira fé, com confiança recorremos à vossa intercessão.

Vós que enfrentastes perseguições e sofrimentos para preservar a verdade sobre a divindade de Cristo, ajudai-nos a permanecer firmes na fé e fiéis ao Evangelho.

Concedei-nos a graça de rezar esta novena com fé sincera, para que, fortalecidos por vosso exemplo, possamos viver na verdade e alcançar as graças que necessitamos, se forem da vontade de Deus.

Amém.`
    },

    { type: "title", text: "Oração do dia" },
    {
      type: "text",
      text: `Ó Santo Atanásio, dedicastes vossa vida a proteger o rebanho de Cristo.

Intercedei por todos os que anunciam o Evangelho.

Que sejamos zelosos na vivência e defesa da fé.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
    },

    { type: "title", text: "Oração Final" },
    {
      type: "prayer",
      text: `Ó Santo Atanásio, defensor da verdadeira fé e doutor da Igreja, rogai por nós.

Ajudai-nos a permanecer firmes na verdade de Cristo e fiéis à Igreja.

Amém.`
    }
  ]
},
{
  novenaId: "novena_santo_atanasio",
  day: 8,
  title: "Oitavo dia – Santo Atanásio, exemplo de perseverança",
  sections: [
    { type: "title", text: "Sinal da Cruz" },
    { type: "prayer", text: "Em nome do Pai, do Filho e do Espírito Santo. Amém." },

    { type: "title", text: "Oração Inicial" },
    {
      type: "prayer",
      text: `Ó glorioso Santo Atanásio, bispo e doutor da Igreja, defensor incansável da verdadeira fé, com confiança recorremos à vossa intercessão.

Vós que enfrentastes perseguições e sofrimentos para preservar a verdade sobre a divindade de Cristo, ajudai-nos a permanecer firmes na fé e fiéis ao Evangelho.

Concedei-nos a graça de rezar esta novena com fé sincera, para que, fortalecidos por vosso exemplo, possamos viver na verdade e alcançar as graças que necessitamos, se forem da vontade de Deus.

Amém.`
    },

    { type: "title", text: "Oração do dia" },
    {
      type: "text",
      text: `Ó Santo Atanásio, perseverastes na fé até o fim, mesmo em meio às provações.

Ajudai-nos a permanecer firmes no caminho cristão.

Que nunca desanimemos diante das dificuldades.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
    },

    { type: "title", text: "Oração Final" },
    {
      type: "prayer",
      text: `Ó Santo Atanásio, defensor da verdadeira fé e doutor da Igreja, rogai por nós.

Ajudai-nos a permanecer firmes na verdade de Cristo e fiéis à Igreja.

Amém.`
    }
  ]
},
{
  novenaId: "novena_santo_atanasio",
  day: 9,
  title: "Nono dia – Santo Atanásio, intercessor poderoso",
  sections: [
    { type: "title", text: "Sinal da Cruz" },
    { type: "prayer", text: "Em nome do Pai, do Filho e do Espírito Santo. Amém." },

    { type: "title", text: "Oração Inicial" },
    {
      type: "prayer",
      text: `Ó glorioso Santo Atanásio, bispo e doutor da Igreja, defensor incansável da verdadeira fé, com confiança recorremos à vossa intercessão.

Vós que enfrentastes perseguições e sofrimentos para preservar a verdade sobre a divindade de Cristo, ajudai-nos a permanecer firmes na fé e fiéis ao Evangelho.

Concedei-nos a graça de rezar esta novena com fé sincera, para que, fortalecidos por vosso exemplo, possamos viver na verdade e alcançar as graças que necessitamos, se forem da vontade de Deus.

Amém.`
    },

    { type: "title", text: "Oração do dia" },
    {
      type: "text",
      text: `Ó glorioso Santo Atanásio, confiamos em vossa poderosa intercessão junto a Deus.

Apresentai ao Senhor nossas intenções, necessidades e pedidos.

Conduzi-nos sempre no caminho da fé, da verdade e da salvação.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
    },

    { type: "title", text: "Oração Final" },
    {
      type: "prayer",
      text: `Ó Santo Atanásio, defensor da verdadeira fé e doutor da Igreja, rogai por nós.

Ajudai-nos a permanecer firmes na verdade de Cristo e fiéis à Igreja.

Amém.`
    }
  ]
},

// ===== Novena a Nossa Senhora de Fátima =====
{
  novenaId: "novena_nossa_senhora_de_fatima",
  day: 1,
  title: "Primeiro dia – Nossa Senhora de Fátima, chamado à conversão",
  sections: [
    { type: "title", text: "Sinal da Cruz" },
    { type: "prayer", text: "Em nome do Pai, do Filho e do Espírito Santo. Amém." },

    { type: "title", text: "Oração Inicial" },
    {
      type: "prayer",
      text: `Ó Nossa Senhora de Fátima, Mãe amorosa e mensageira da paz, que aparecestes aos pastorinhos para chamar o mundo à conversão, à oração e à penitência, com confiança recorremos à vossa intercessão.

Vós nos convidais a confiar no amor misericordioso de Deus e a oferecer nossa vida pela salvação das almas. Ajudai-nos a viver com fé sincera, esperança firme e caridade perseverante.

Concedei-nos a graça de rezar esta novena com devoção, para que, por vossa intercessão materna, possamos alcançar as graças que necessitamos, se forem da vontade de Deus.

Amém.`
    },

    { type: "title", text: "Oração do dia" },
    {
      type: "text",
      text: `Ó Nossa Senhora de Fátima, chamastes o mundo à conversão do coração.

Ajudai-nos a reconhecer nossos pecados e a buscar uma vida nova em Cristo.

Que vivamos reconciliados com Deus e com os irmãos.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
    },

    { type: "title", text: "Oração Final" },
    {
      type: "prayer",
      text: `Ó Nossa Senhora de Fátima, Mãe da Igreja e Rainha do Santo Rosário, rogai por nós.

Ajudai-nos a viver segundo o Evangelho, perseverantes na oração e na conversão.

Amém.`
    }
  ]
},
{
  novenaId: "novena_nossa_senhora_de_fatima",
  day: 2,
  title: "Segundo dia – Nossa Senhora de Fátima, mensageira da paz",
  sections: [
    { type: "title", text: "Sinal da Cruz" },
    { type: "prayer", text: "Em nome do Pai, do Filho e do Espírito Santo. Amém." },

    { type: "title", text: "Oração Inicial" },
    {
      type: "prayer",
      text: `Ó Nossa Senhora de Fátima, Mãe amorosa e mensageira da paz, que aparecestes aos pastorinhos para chamar o mundo à conversão, à oração e à penitência, com confiança recorremos à vossa intercessão.

Vós nos convidais a confiar no amor misericordioso de Deus e a oferecer nossa vida pela salvação das almas. Ajudai-nos a viver com fé sincera, esperança firme e caridade perseverante.

Concedei-nos a graça de rezar esta novena com devoção, para que, por vossa intercessão materna, possamos alcançar as graças que necessitamos, se forem da vontade de Deus.

Amém.`
    },

    { type: "title", text: "Oração do dia" },
    {
      type: "text",
      text: `Ó Mãe Santíssima, trouxestes ao mundo a mensagem da paz que vem de Deus.

Ajudai-nos a ser instrumentos de paz em nossas famílias e comunidades.

Que afastemos de nosso coração o ódio e a violência.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
    },

    { type: "title", text: "Oração Final" },
    {
      type: "prayer",
      text: `Ó Nossa Senhora de Fátima, Mãe da Igreja e Rainha do Santo Rosário, rogai por nós.

Ajudai-nos a viver segundo o Evangelho, perseverantes na oração e na conversão.

Amém.`
    }
  ]
},
{
  novenaId: "novena_nossa_senhora_de_fatima",
  day: 3,
  title: "Terceiro dia – Nossa Senhora de Fátima, convite à oração",
  sections: [
    { type: "title", text: "Sinal da Cruz" },
    { type: "prayer", text: "Em nome do Pai, do Filho e do Espírito Santo. Amém." },

    { type: "title", text: "Oração Inicial" },
    {
      type: "prayer",
      text: `Ó Nossa Senhora de Fátima, Mãe amorosa e mensageira da paz, que aparecestes aos pastorinhos para chamar o mundo à conversão, à oração e à penitência, com confiança recorremos à vossa intercessão.

Vós nos convidais a confiar no amor misericordioso de Deus e a oferecer nossa vida pela salvação das almas. Ajudai-nos a viver com fé sincera, esperança firme e caridade perseverante.

Concedei-nos a graça de rezar esta novena com devoção, para que, por vossa intercessão materna, possamos alcançar as graças que necessitamos, se forem da vontade de Deus.

Amém.`
    },

    { type: "title", text: "Oração do dia" },
    {
      type: "text",
      text: `Ó Nossa Senhora de Fátima, pedistes que rezássemos com perseverança, especialmente o Santo Rosário.

Ensinai-nos a amar a oração e a confiar na força da intercessão.

Que nossa vida seja sustentada pela oração constante.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
    },

    { type: "title", text: "Oração Final" },
    {
      type: "prayer",
      text: `Ó Nossa Senhora de Fátima, Mãe da Igreja e Rainha do Santo Rosário, rogai por nós.

Ajudai-nos a viver segundo o Evangelho, perseverantes na oração e na conversão.

Amém.`
    }
  ]
},
{
  novenaId: "novena_nossa_senhora_de_fatima",
  day: 4,
  title: "Quarto dia – Nossa Senhora de Fátima, penitência e sacrifício",
  sections: [
    { type: "title", text: "Sinal da Cruz" },
    { type: "prayer", text: "Em nome do Pai, do Filho e do Espírito Santo. Amém." },

    { type: "title", text: "Oração Inicial" },
    {
      type: "prayer",
      text: `Ó Nossa Senhora de Fátima, Mãe amorosa e mensageira da paz, que aparecestes aos pastorinhos para chamar o mundo à conversão, à oração e à penitência, com confiança recorremos à vossa intercessão.

Vós nos convidais a confiar no amor misericordioso de Deus e a oferecer nossa vida pela salvação das almas. Ajudai-nos a viver com fé sincera, esperança firme e caridade perseverante.

Concedei-nos a graça de rezar esta novena com devoção, para que, por vossa intercessão materna, possamos alcançar as graças que necessitamos, se forem da vontade de Deus.

Amém.`
    },

    { type: "title", text: "Oração do dia" },
    {
      type: "text",
      text: `Ó Mãe querida, pedistes ofertas e sacrifícios pela conversão dos pecadores.

Ajudai-nos a oferecer nossas dificuldades com amor e fé.

Que saibamos unir nossos sacrifícios aos de Cristo.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
    },

    { type: "title", text: "Oração Final" },
    {
      type: "prayer",
      text: `Ó Nossa Senhora de Fátima, Mãe da Igreja e Rainha do Santo Rosário, rogai por nós.

Ajudai-nos a viver segundo o Evangelho, perseverantes na oração e na conversão.

Amém.`
    }
  ]
},
{
  novenaId: "novena_nossa_senhora_de_fatima",
  day: 5,
  title: "Quinto dia – Nossa Senhora de Fátima, amor ao Coração Imaculado",
  sections: [
    { type: "title", text: "Sinal da Cruz" },
    { type: "prayer", text: "Em nome do Pai, do Filho e do Espírito Santo. Amém." },

    { type: "title", text: "Oração Inicial" },
    {
      type: "prayer",
      text: `Ó Nossa Senhora de Fátima, Mãe amorosa e mensageira da paz, que aparecestes aos pastorinhos para chamar o mundo à conversão, à oração e à penitência, com confiança recorremos à vossa intercessão.

Vós nos convidais a confiar no amor misericordioso de Deus e a oferecer nossa vida pela salvação das almas. Ajudai-nos a viver com fé sincera, esperança firme e caridade perseverante.

Concedei-nos a graça de rezar esta novena com devoção, para que, por vossa intercessão materna, possamos alcançar as graças que necessitamos, se forem da vontade de Deus.

Amém.`
    },

    { type: "title", text: "Oração do dia" },
    {
      type: "text",
      text: `Ó Nossa Senhora de Fátima, revelastes o vosso Imaculado Coração como refúgio e caminho para Deus.

Consagrai-nos ao vosso Coração Imaculado.

Que encontremos em vós proteção, consolo e esperança.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
    },

    { type: "title", text: "Oração Final" },
    {
      type: "prayer",
      text: `Ó Nossa Senhora de Fátima, Mãe da Igreja e Rainha do Santo Rosário, rogai por nós.

Ajudai-nos a viver segundo o Evangelho, perseverantes na oração e na conversão.

Amém.`
    }
  ]
},
{
  novenaId: "novena_nossa_senhora_de_fatima",
  day: 6,
  title: "Sexto dia – Nossa Senhora de Fátima, cuidado com as almas",
  sections: [
    { type: "title", text: "Sinal da Cruz" },
    { type: "prayer", text: "Em nome do Pai, do Filho e do Espírito Santo. Amém." },

    { type: "title", text: "Oração Inicial" },
    {
      type: "prayer",
      text: `Ó Nossa Senhora de Fátima, Mãe amorosa e mensageira da paz, que aparecestes aos pastorinhos para chamar o mundo à conversão, à oração e à penitência, com confiança recorremos à vossa intercessão.

Vós nos convidais a confiar no amor misericordioso de Deus e a oferecer nossa vida pela salvação das almas. Ajudai-nos a viver com fé sincera, esperança firme e caridade perseverante.

Concedei-nos a graça de rezar esta novena com devoção, para que, por vossa intercessão materna, possamos alcançar as graças que necessitamos, se forem da vontade de Deus.

Amém.`
    },

    { type: "title", text: "Oração do dia" },
    {
      type: "text",
      text: `Ó Mãe Santíssima, manifestastes grande amor pelas almas e desejo de sua salvação.

Ajudai-nos a viver com espírito missionário e caridade.

Que trabalhemos pela salvação das almas com nossas orações e ações.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
    },

    { type: "title", text: "Oração Final" },
    {
      type: "prayer",
      text: `Ó Nossa Senhora de Fátima, Mãe da Igreja e Rainha do Santo Rosário, rogai por nós.

Ajudai-nos a viver segundo o Evangelho, perseverantes na oração e na conversão.

Amém.`
    }
  ]
},
{
  novenaId: "novena_nossa_senhora_de_fatima",
  day: 7,
  title: "Sétimo dia – Nossa Senhora de Fátima, fé nas provações",
  sections: [
    { type: "title", text: "Sinal da Cruz" },
    { type: "prayer", text: "Em nome do Pai, do Filho e do Espírito Santo. Amém." },

    { type: "title", text: "Oração Inicial" },
    {
      type: "prayer",
      text: `Ó Nossa Senhora de Fátima, Mãe amorosa e mensageira da paz, que aparecestes aos pastorinhos para chamar o mundo à conversão, à oração e à penitência, com confiança recorremos à vossa intercessão.

Vós nos convidais a confiar no amor misericordioso de Deus e a oferecer nossa vida pela salvação das almas. Ajudai-nos a viver com fé sincera, esperança firme e caridade perseverante.

Concedei-nos a graça de rezar esta novena com devoção, para que, por vossa intercessão materna, possamos alcançar as graças que necessitamos, se forem da vontade de Deus.

Amém.`
    },

    { type: "title", text: "Oração do dia" },
    {
      type: "text",
      text: `Ó Nossa Senhora de Fátima, fortalecestes os pastorinhos nas provações.

Ajudai-nos a permanecer firmes na fé diante das dificuldades.

Que nunca percamos a confiança no amor de Deus.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
    },

    { type: "title", text: "Oração Final" },
    {
      type: "prayer",
      text: `Ó Nossa Senhora de Fátima, Mãe da Igreja e Rainha do Santo Rosário, rogai por nós.

Ajudai-nos a viver segundo o Evangelho, perseverantes na oração e na conversão.

Amém.`
    }
  ]
},
{
  novenaId: "novena_nossa_senhora_de_fatima",
  day: 8,
  title: "Oitavo dia – Nossa Senhora de Fátima, esperança para o mundo",
  sections: [
    { type: "title", text: "Sinal da Cruz" },
    { type: "prayer", text: "Em nome do Pai, do Filho e do Espírito Santo. Amém." },

    { type: "title", text: "Oração Inicial" },
    {
      type: "prayer",
      text: `Ó Nossa Senhora de Fátima, Mãe amorosa e mensageira da paz, que aparecestes aos pastorinhos para chamar o mundo à conversão, à oração e à penitência, com confiança recorremos à vossa intercessão.

Vós nos convidais a confiar no amor misericordioso de Deus e a oferecer nossa vida pela salvação das almas. Ajudai-nos a viver com fé sincera, esperança firme e caridade perseverante.

Concedei-nos a graça de rezar esta novena com devoção, para que, por vossa intercessão materna, possamos alcançar as graças que necessitamos, se forem da vontade de Deus.

Amém.`
    },

    { type: "title", text: "Oração do dia" },
    {
      type: "text",
      text: `Ó Mãe da esperança, anunciastes que, por fim, vosso Imaculado Coração triunfará.

Renovai nossa esperança e confiança nas promessas de Deus.

Que vivamos na certeza da vitória do bem.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
    },

    { type: "title", text: "Oração Final" },
    {
      type: "prayer",
      text: `Ó Nossa Senhora de Fátima, Mãe da Igreja e Rainha do Santo Rosário, rogai por nós.

Ajudai-nos a viver segundo o Evangelho, perseverantes na oração e na conversão.

Amém.`
    }
  ]
},
{
  novenaId: "novena_nossa_senhora_de_fatima",
  day: 9,
  title: "Nono dia – Nossa Senhora de Fátima, intercessora poderosa",
  sections: [
    { type: "title", text: "Sinal da Cruz" },
    { type: "prayer", text: "Em nome do Pai, do Filho e do Espírito Santo. Amém." },

    { type: "title", text: "Oração Inicial" },
    {
      type: "prayer",
      text: `Ó Nossa Senhora de Fátima, Mãe amorosa e mensageira da paz, que aparecestes aos pastorinhos para chamar o mundo à conversão, à oração e à penitência, com confiança recorremos à vossa intercessão.

Vós nos convidais a confiar no amor misericordioso de Deus e a oferecer nossa vida pela salvação das almas. Ajudai-nos a viver com fé sincera, esperança firme e caridade perseverante.

Concedei-nos a graça de rezar esta novena com devoção, para que, por vossa intercessão materna, possamos alcançar as graças que necessitamos, se forem da vontade de Deus.

Amém.`
    },

    { type: "title", text: "Oração do dia" },
    {
      type: "text",
      text: `Ó gloriosa Nossa Senhora de Fátima, confiamos em vossa poderosa intercessão.

Apresentai a Deus nossos pedidos, necessidades e intenções.

Conduzi-nos sempre no caminho da fé, da paz e da salvação.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
    },

    { type: "title", text: "Oração Final" },
    {
      type: "prayer",
      text: `Ó Nossa Senhora de Fátima, Mãe da Igreja e Rainha do Santo Rosário, rogai por nós.

Ajudai-nos a viver segundo o Evangelho, perseverantes na oração e na conversão.

Amém.`
    }
  ]
},

// ===== Novena a Santa Rita de Cássia =====
{
  novenaId: "novena_santa_rita_de_cassia",
  day: 1,
  title: "Primeiro dia – Santa Rita, modelo de fé e confiança",
  sections: [
    { type: "title", text: "Sinal da Cruz" },
    { type: "prayer", text: "Em nome do Pai, do Filho e do Espírito Santo. Amém." },

    { type: "title", text: "Oração Inicial" },
    {
      type: "prayer",
      text: `Ó Santa Rita de Cássia, esposa fiel, mãe dedicada, religiosa obediente e poderosa intercessora nas causas impossiveis, com confiança recorremos à vossa intercessao.

Vós que aceitastes com paciencia as provacoes da vida e permanecestes firmes no amor a Cristo crucificado, ajudai-nos a confiar na misericordia de Deus em todas as circunstancias.

Concedei-nos a graça de rezar esta novena com fé sincera, para que, por vossa intercessao, possamos alcançar as graças que necessitamos, se forem da vontade de Deus.

Amém.`
    },

    { type: "title", text: "Oração do dia" },
    {
      type: "text",
      text: `Ó Santa Rita, desde jovem colocastes vossa vida nas maos de Deus.

Ensinai-nos a confiar no Senhor mesmo quando os caminhos parecem dificeis.

Que nossa fé seja firme e perseverante.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
    },

    { type: "title", text: "Oração Final" },
    {
      type: "prayer",
      text: `Ó Santa Rita de Cássia, exemplo de fé, paciencia e amor, rogai por nós.

Ajudai-nos a confiar em Deus nas provacoes e a viver segundo o Evangelho.

Amém.`
    }
  ]
},
{
  novenaId: "novena_santa_rita_de_cassia",
  day: 2,
  title: "Segundo dia – Santa Rita, esposa paciente e fiel",
  sections: [
    { type: "title", text: "Sinal da Cruz" },
    { type: "prayer", text: "Em nome do Pai, do Filho e do Espírito Santo. Amém." },

    { type: "title", text: "Oração Inicial" },
    {
      type: "prayer",
      text: `Ó Santa Rita de Cássia, esposa fiel, mãe dedicada, religiosa obediente e poderosa intercessora nas causas impossiveis, com confiança recorremos à vossa intercessao.

Vós que aceitastes com paciencia as provacoes da vida e permanecestes firmes no amor a Cristo crucificado, ajudai-nos a confiar na misericordia de Deus em todas as circunstancias.

Concedei-nos a graça de rezar esta novena com fé sincera, para que, por vossa intercessao, possamos alcançar as graças que necessitamos, se forem da vontade de Deus.

Amém.`
    },

    { type: "title", text: "Oração do dia" },
    {
      type: "text",
      text: `Ó Santa Rita, suportastes com paciencia as dificuldades do matrimonio.

Intercedei pelas familias, para que vivam no amor, no perdao e na paz.

Ajudai-nos a cultivar relacoes baseadas na caridade.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
    },

    { type: "title", text: "Oração Final" },
    {
      type: "prayer",
      text: `Ó Santa Rita de Cássia, exemplo de fé, paciencia e amor, rogai por nós.

Ajudai-nos a confiar em Deus nas provacoes e a viver segundo o Evangelho.

Amém.`
    }
  ]
},
{
  novenaId: "novena_santa_rita_de_cassia",
  day: 3,
  title: "Terceiro dia – Santa Rita, mãe de oração",
  sections: [
    { type: "title", text: "Sinal da Cruz" },
    { type: "prayer", text: "Em nome do Pai, do Filho e do Espírito Santo. Amém." },

    { type: "title", text: "Oração Inicial" },
    {
      type: "prayer",
      text: `Ó Santa Rita de Cássia, esposa fiel, mãe dedicada, religiosa obediente e poderosa intercessora nas causas impossiveis, com confiança recorremos à vossa intercessao.

Vós que aceitastes com paciencia as provacoes da vida e permanecestes firmes no amor a Cristo crucificado, ajudai-nos a confiar na misericordia de Deus em todas as circunstancias.

Concedei-nos a graça de rezar esta novena com fé sincera, para que, por vossa intercessao, possamos alcançar as graças que necessitamos, se forem da vontade de Deus.

Amém.`
    },

    { type: "title", text: "Oração do dia" },
    {
      type: "text",
      text: `Ó Santa Rita, elevastes a Deus constantes oracoes por vossos filhos.

Intercedei por todas as mães e por seus filhos.

Que saibamos confiar nossos entes queridos ao cuidado de Deus.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
    },

    { type: "title", text: "Oração Final" },
    {
      type: "prayer",
      text: `Ó Santa Rita de Cássia, exemplo de fé, paciencia e amor, rogai por nós.

Ajudai-nos a confiar em Deus nas provacoes e a viver segundo o Evangelho.

Amém.`
    }
  ]
},
{
  novenaId: "novena_santa_rita_de_cassia",
  day: 4,
  title: "Quarto dia – Santa Rita, amor ao perdão",
  sections: [
    { type: "title", text: "Sinal da Cruz" },
    { type: "prayer", text: "Em nome do Pai, do Filho e do Espírito Santo. Amém." },

    { type: "title", text: "Oração Inicial" },
    {
      type: "prayer",
      text: `Ó Santa Rita de Cássia, esposa fiel, mãe dedicada, religiosa obediente e poderosa intercessora nas causas impossiveis, com confiança recorremos à vossa intercessao.

Vós que aceitastes com paciencia as provacoes da vida e permanecestes firmes no amor a Cristo crucificado, ajudai-nos a confiar na misericordia de Deus em todas as circunstancias.

Concedei-nos a graça de rezar esta novena com fé sincera, para que, por vossa intercessao, possamos alcançar as graças que necessitamos, se forem da vontade de Deus.

Amém.`
    },

    { type: "title", text: "Oração do dia" },
    {
      type: "text",
      text: `Ó Santa Rita, escolhestes o perdao em lugar do odio e da vinganca.

Ensinai-nos a perdoar de coracao aqueles que nos ofendem.

Que sejamos instrumentos da paz de Cristo.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
    },

    { type: "title", text: "Oração Final" },
    {
      type: "prayer",
      text: `Ó Santa Rita de Cássia, exemplo de fé, paciencia e amor, rogai por nós.

Ajudai-nos a confiar em Deus nas provacoes e a viver segundo o Evangelho.

Amém.`
    }
  ]
},
{
  novenaId: "novena_santa_rita_de_cassia",
  day: 5,
  title: "Quinto dia – Santa Rita, vida de sofrimento oferecido",
  sections: [
    { type: "title", text: "Sinal da Cruz" },
    { type: "prayer", text: "Em nome do Pai, do Filho e do Espírito Santo. Amém." },

    { type: "title", text: "Oração Inicial" },
    {
      type: "prayer",
      text: `Ó Santa Rita de Cássia, esposa fiel, mãe dedicada, religiosa obediente e poderosa intercessora nas causas impossiveis, com confiança recorremos à vossa intercessao.

Vós que aceitastes com paciencia as provacoes da vida e permanecestes firmes no amor a Cristo crucificado, ajudai-nos a confiar na misericordia de Deus em todas as circunstancias.

Concedei-nos a graça de rezar esta novena com fé sincera, para que, por vossa intercessao, possamos alcançar as graças que necessitamos, se forem da vontade de Deus.

Amém.`
    },

    { type: "title", text: "Oração do dia" },
    {
      type: "text",
      text: `Ó Santa Rita, aceitastes os sofrimentos unidos a Paixao de Cristo.

Ajudai-nos a oferecer nossas dores com fé e amor.

Que encontremos na cruz fonte de esperanca.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
    },

    { type: "title", text: "Oração Final" },
    {
      type: "prayer",
      text: `Ó Santa Rita de Cássia, exemplo de fé, paciencia e amor, rogai por nós.

Ajudai-nos a confiar em Deus nas provacoes e a viver segundo o Evangelho.

Amém.`
    }
  ]
},
{
  novenaId: "novena_santa_rita_de_cassia",
  day: 6,
  title: "Sexto dia – Santa Rita, amor a Cristo crucificado",
  sections: [
    { type: "title", text: "Sinal da Cruz" },
    { type: "prayer", text: "Em nome do Pai, do Filho e do Espírito Santo. Amém." },

    { type: "title", text: "Oração Inicial" },
    {
      type: "prayer",
      text: `Ó Santa Rita de Cássia, esposa fiel, mãe dedicada, religiosa obediente e poderosa intercessora nas causas impossiveis, com confiança recorremos à vossa intercessao.

Vós que aceitastes com paciencia as provacoes da vida e permanecestes firmes no amor a Cristo crucificado, ajudai-nos a confiar na misericordia de Deus em todas as circunstancias.

Concedei-nos a graça de rezar esta novena com fé sincera, para que, por vossa intercessao, possamos alcançar as graças que necessitamos, se forem da vontade de Deus.

Amém.`
    },

    { type: "title", text: "Oração do dia" },
    {
      type: "text",
      text: `Ó Santa Rita, fostes marcada pelo sinal da cruz como prova de vosso amor a Jesus.

Ajudai-nos a contemplar Cristo crucificado com fé e gratidao.

Que nossa vida seja unida ao sacrificio do Senhor.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
    },

    { type: "title", text: "Oração Final" },
    {
      type: "prayer",
      text: `Ó Santa Rita de Cássia, exemplo de fé, paciencia e amor, rogai por nós.

Ajudai-nos a confiar em Deus nas provacoes e a viver segundo o Evangelho.

Amém.`
    }
  ]
},
{
  novenaId: "novena_santa_rita_de_cassia",
  day: 7,
  title: "Sétimo dia – Santa Rita, obediência e humildade",
  sections: [
    { type: "title", text: "Sinal da Cruz" },
    { type: "prayer", text: "Em nome do Pai, do Filho e do Espírito Santo. Amém." },

    { type: "title", text: "Oração Inicial" },
    {
      type: "prayer",
      text: `Ó Santa Rita de Cássia, esposa fiel, mãe dedicada, religiosa obediente e poderosa intercessora nas causas impossiveis, com confiança recorremos à vossa intercessao.

Vós que aceitastes com paciencia as provacoes da vida e permanecestes firmes no amor a Cristo crucificado, ajudai-nos a confiar na misericordia de Deus em todas as circunstancias.

Concedei-nos a graça de rezar esta novena com fé sincera, para que, por vossa intercessao, possamos alcançar as graças que necessitamos, se forem da vontade de Deus.

Amém.`
    },

    { type: "title", text: "Oração do dia" },
    {
      type: "text",
      text: `Ó Santa Rita, vivestes a obediencia e a humildade na vida religiosa.

Ensinai-nos a servir a Deus com simplicidade e fidelidade.

Que nossa vida seja oferta agradavel ao Senhor.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
    },

    { type: "title", text: "Oração Final" },
    {
      type: "prayer",
      text: `Ó Santa Rita de Cássia, exemplo de fé, paciencia e amor, rogai por nós.

Ajudai-nos a confiar em Deus nas provacoes e a viver segundo o Evangelho.

Amém.`
    }
  ]
},
{
  novenaId: "novena_santa_rita_de_cassia",
  day: 8,
  title: "Oitavo dia – Santa Rita, esperança nas causas difíceis",
  sections: [
    { type: "title", text: "Sinal da Cruz" },
    { type: "prayer", text: "Em nome do Pai, do Filho e do Espírito Santo. Amém." },

    { type: "title", text: "Oração Inicial" },
    {
      type: "prayer",
      text: `Ó Santa Rita de Cássia, esposa fiel, mãe dedicada, religiosa obediente e poderosa intercessora nas causas impossiveis, com confiança recorremos à vossa intercessao.

Vós que aceitastes com paciencia as provacoes da vida e permanecestes firmes no amor a Cristo crucificado, ajudai-nos a confiar na misericordia de Deus em todas as circunstancias.

Concedei-nos a graça de rezar esta novena com fé sincera, para que, por vossa intercessao, possamos alcançar as graças que necessitamos, se forem da vontade de Deus.

Amém.`
    },

    { type: "title", text: "Oração do dia" },
    {
      type: "text",
      text: `Ó Santa Rita, sois conhecida como advogada das causas impossiveis.

Renovai nossa esperanca diante das situacoes mais dificeis.

Que nunca percamos a confianca no poder de Deus.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
    },

    { type: "title", text: "Oração Final" },
    {
      type: "prayer",
      text: `Ó Santa Rita de Cássia, exemplo de fé, paciencia e amor, rogai por nós.

Ajudai-nos a confiar em Deus nas provacoes e a viver segundo o Evangelho.

Amém.`
    }
  ]
},
{
  novenaId: "novena_santa_rita_de_cassia",
  day: 9,
  title: "Nono dia – Santa Rita, intercessora poderosa",
  sections: [
    { type: "title", text: "Sinal da Cruz" },
    { type: "prayer", text: "Em nome do Pai, do Filho e do Espírito Santo. Amém." },

    { type: "title", text: "Oração Inicial" },
    {
      type: "prayer",
      text: `Ó Santa Rita de Cássia, esposa fiel, mãe dedicada, religiosa obediente e poderosa intercessora nas causas impossiveis, com confiança recorremos à vossa intercessao.

Vós que aceitastes com paciencia as provacoes da vida e permanecestes firmes no amor a Cristo crucificado, ajudai-nos a confiar na misericordia de Deus em todas as circunstancias.

Concedei-nos a graça de rezar esta novena com fé sincera, para que, por vossa intercessao, possamos alcançar as graça
s que necessitamos, se forem da vontade de Deus.

Amém.`
    },

    { type: "title", text: "Oração do dia" },
    {
      type: "text",
      text: `Ó gloriosa Santa Rita de Cássia, confiamos em vossa poderosa intercessao.

Apresentai a Deus nossas necessidades, pedidos e intencoes.

Conduzi-nos sempre no caminho da fé, da paciencia e da salvacao.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
    },

    { type: "title", text: "Oração Final" },
    {
      type: "prayer",
      text: `Ó Santa Rita de Cássia, exemplo de fé, paciencia e amor, rogai por nós.

Ajudai-nos a confiar em Deus nas provacoes e a viver segundo o Evangelho.

Amém.`
    }
  ]
},

// ===== Novena a Nossa Senhora Auxiliadora =====
{
  novenaId: "novena_nossa_senhora_auxiliadora",
  day: 1,
  title: "Primeiro dia – Nossa Senhora Auxiliadora, auxílio dos cristãos",
  sections: [
    { type: "title", text: "Sinal da Cruz" },
    { type: "prayer", text: "Em nome do Pai, do Filho e do Espírito Santo. Amém." },

    { type: "title", text: "Oração Inicial" },
    {
      type: "prayer",
      text: `Ó Nossa Senhora Auxiliadora, Mãe poderosa e cheia de ternura, auxílio dos cristãos em todas as necessidades, com confiança recorremos à vossa intercessão.

Vós que sempre socorrestes os que a vós recorrem com fé, acompanhai-nos nas dificuldades da vida e fortalecei-nos na caminhada cristã.

Concedei-nos a graça de rezar esta novena com fé sincera, para que, sob vossa proteção materna, possamos alcançar as graças que necessitamos, se forem da vontade de Deus.

Amém.`
    },

    { type: "title", text: "Oração do dia" },
    {
      type: "text",
      text: `Ó Nossa Senhora Auxiliadora, sois chamada auxílio dos cristãos em todas as lutas e provações.

Ajudai-nos a confiar sempre em vossa proteção materna.

Que nunca nos falte a fé diante das dificuldades.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
    },

    { type: "title", text: "Oração Final" },
    {
      type: "prayer",
      text: `Ó Nossa Senhora Auxiliadora, auxílio seguro dos cristãos, rogai por nós.

Ajudai-nos a viver na fé, na esperança e no amor, confiantes em vossa proteção materna.

Amém.`
    }
  ]
},
{
  novenaId: "novena_nossa_senhora_auxiliadora",
  day: 2,
  title: "Segundo dia – Nossa Senhora Auxiliadora, mãe que protege",
  sections: [
    { type: "title", text: "Sinal da Cruz" },
    { type: "prayer", text: "Em nome do Pai, do Filho e do Espírito Santo. Amém." },

    { type: "title", text: "Oração Inicial" },
    {
      type: "prayer",
      text: `Ó Nossa Senhora Auxiliadora, Mãe poderosa e cheia de ternura, auxílio dos cristãos em todas as necessidades, com confiança recorremos à vossa intercessão.

Vós que sempre socorrestes os que a vós recorrem com fé, acompanhai-nos nas dificuldades da vida e fortalecei-nos na caminhada cristã.

Concedei-nos a graça de rezar esta novena com fé sincera, para que, sob vossa proteção materna, possamos alcançar as graças que necessitamos, se forem da vontade de Deus.

Amém.`
    },

    { type: "title", text: "Oração do dia" },
    {
      type: "text",
      text: `Ó Mãe Auxiliadora, cuidais com amor de todos os vossos filhos.

Protegei nossas famílias e livrai-nos de todo mal.

Que sintamos sempre vossa presença em nossa vida.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
    },

    { type: "title", text: "Oração Final" },
    {
      type: "prayer",
      text: `Ó Nossa Senhora Auxiliadora, auxílio seguro dos cristãos, rogai por nós.

Ajudai-nos a viver na fé, na esperança e no amor, confiantes em vossa proteção materna.

Amém.`
    }
  ]
},
{
  novenaId: "novena_nossa_senhora_auxiliadora",
  day: 3,
  title: "Terceiro dia – Nossa Senhora Auxiliadora, confiança na providência",
  sections: [
    { type: "title", text: "Sinal da Cruz" },
    { type: "prayer", text: "Em nome do Pai, do Filho e do Espírito Santo. Amém." },

    { type: "title", text: "Oração Inicial" },
    {
      type: "prayer",
      text: `Ó Nossa Senhora Auxiliadora, Mãe poderosa e cheia de ternura, auxílio dos cristãos em todas as necessidades, com confiança recorremos à vossa intercessão.

Vós que sempre socorrestes os que a vós recorrem com fé, acompanhai-nos nas dificuldades da vida e fortalecei-nos na caminhada cristã.

Concedei-nos a graça de rezar esta novena com fé sincera, para que, sob vossa proteção materna, possamos alcançar as graças que necessitamos, se forem da vontade de Deus.

Amém.`
    },

    { type: "title", text: "Oração do dia" },
    {
      type: "text",
      text: `Ó Nossa Senhora Auxiliadora, ensinai-nos a confiar na providência de Deus.

Ajudai-nos a entregar nossas preocupações ao Senhor.

Que vivamos na paz e na confiança.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
    },

    { type: "title", text: "Oração Final" },
    {
      type: "prayer",
      text: `Ó Nossa Senhora Auxiliadora, auxílio seguro dos cristãos, rogai por nós.

Ajudai-nos a viver na fé, na esperança e no amor, confiantes em vossa proteção materna.

Amém.`
    }
  ]
},
{
  novenaId: "novena_nossa_senhora_auxiliadora",
  day: 4,
  title: "Quarto dia – Nossa Senhora Auxiliadora, defesa nas dificuldades",
  sections: [
    { type: "title", text: "Sinal da Cruz" },
    { type: "prayer", text: "Em nome do Pai, do Filho e do Espírito Santo. Amém." },

    { type: "title", text: "Oração Inicial" },
    {
      type: "prayer",
      text: `Ó Nossa Senhora Auxiliadora, Mãe poderosa e cheia de ternura, auxílio dos cristãos em todas as necessidades, com confiança recorremos à vossa intercessão.

Vós que sempre socorrestes os que a vós recorrem com fé, acompanhai-nos nas dificuldades da vida e fortalecei-nos na caminhada cristã.

Concedei-nos a graça de rezar esta novena com fé sincera, para que, sob vossa proteção materna, possamos alcançar as graças que necessitamos, se forem da vontade de Deus.

Amém.`
    },

    { type: "title", text: "Oração do dia" },
    {
      type: "text",
      text: `Ó Mãe poderosa, vós sois defesa segura nos momentos de aflição.

Socorrei-nos nas tribulações do corpo e da alma.

Que encontremos em vós força e consolo.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
    },

    { type: "title", text: "Oração Final" },
    {
      type: "prayer",
      text: `Ó Nossa Senhora Auxiliadora, auxílio seguro dos cristãos, rogai por nós.

Ajudai-nos a viver na fé, na esperança e no amor, confiantes em vossa proteção materna.

Amém.`
    }
  ]
},
{
  novenaId: "novena_nossa_senhora_auxiliadora",
  day: 5,
  title: "Quinto dia – Nossa Senhora Auxiliadora, mãe da Igreja",
  sections: [
    { type: "title", text: "Sinal da Cruz" },
    { type: "prayer", text: "Em nome do Pai, do Filho e do Espírito Santo. Amém." },

    { type: "title", text: "Oração Inicial" },
    {
      type: "prayer",
      text: `Ó Nossa Senhora Auxiliadora, Mãe poderosa e cheia de ternura, auxílio dos cristãos em todas as necessidades, com confiança recorremos à vossa intercessão.

Vós que sempre socorrestes os que a vós recorrem com fé, acompanhai-nos nas dificuldades da vida e fortalecei-nos na caminhada cristã.

Concedei-nos a graça de rezar esta novena com fé sincera, para que, sob vossa proteção materna, possamos alcançar as graças que necessitamos, se forem da vontade de Deus.

Amém.`
    },

    { type: "title", text: "Oração do dia" },
    {
      type: "text",
      text: `Ó Nossa Senhora Auxiliadora, acompanhastes e protegeis a Igreja ao longo dos tempos.

Intercedei pelo Papa, pelos bispos, sacerdotes e por todo o povo de Deus.

Que a Igreja permaneça fiel a Cristo.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
    },

    { type: "title", text: "Oração Final" },
    {
      type: "prayer",
      text: `Ó Nossa Senhora Auxiliadora, auxílio seguro dos cristãos, rogai por nós.

Ajudai-nos a viver na fé, na esperança e no amor, confiantes em vossa proteção materna.

Amém.`
    }
  ]
},
{
  novenaId: "novena_nossa_senhora_auxiliadora",
  day: 6,
  title: "Sexto dia – Nossa Senhora Auxiliadora, educadora na fé",
  sections: [
    { type: "title", text: "Sinal da Cruz" },
    { type: "prayer", text: "Em nome do Pai, do Filho e do Espírito Santo. Amém." },

    { type: "title", text: "Oração Inicial" },
    {
      type: "prayer",
      text: `Ó Nossa Senhora Auxiliadora, Mãe poderosa e cheia de ternura, auxílio dos cristãos em todas as necessidades, com confiança recorremos à vossa intercessão.

Vós que sempre socorrestes os que a vós recorrem com fé, acompanhai-nos nas dificuldades da vida e fortalecei-nos na caminhada cristã.

Concedei-nos a graça de rezar esta novena com fé sincera, para que, sob vossa proteção materna, possamos alcançar as graças que necessitamos, se forem da vontade de Deus.

Amém.`
    },

    { type: "title", text: "Oração do dia" },
    {
      type: "text",
      text: `Ó Nossa Senhora Auxiliadora, inspirastes São João Bosco na educação dos jovens.

Ajudai-nos a crescer na fé e a educar com amor e paciência.

Protegei os jovens e conduzi-os a Cristo.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
    },

    { type: "title", text: "Oração Final" },
    {
      type: "prayer",
      text: `Ó Nossa Senhora Auxiliadora, auxílio seguro dos cristãos, rogai por nós.

Ajudai-nos a viver na fé, na esperança e no amor, confiantes em vossa proteção materna.

Amém.`
    }
  ]
},
{
  novenaId: "novena_nossa_senhora_auxiliadora",
  day: 7,
  title: "Sétimo dia – Nossa Senhora Auxiliadora, esperança dos aflitos",
  sections: [
    { type: "title", text: "Sinal da Cruz" },
    { type: "prayer", text: "Em nome do Pai, do Filho e do Espírito Santo. Amém." },

    { type: "title", text: "Oração Inicial" },
    {
      type: "prayer",
      text: `Ó Nossa Senhora Auxiliadora, Mãe poderosa e cheia de ternura, auxílio dos cristãos em todas as necessidades, com confiança recorremos à vossa intercessão.

Vós que sempre socorrestes os que a vós recorrem com fé, acompanhai-nos nas dificuldades da vida e fortalecei-nos na caminhada cristã.

Concedei-nos a graça de rezar esta novena com fé sincera, para que, sob vossa proteção materna, possamos alcançar as graças que necessitamos, se forem da vontade de Deus.

Amém.`
    },

    { type: "title", text: "Oração do dia" },
    {
      type: "text",
      text: `Ó Mãe Auxiliadora, sois esperança para os aflitos e desanimados.

Consolai os que sofrem e fortalecei os que perderam a esperança.

Que encontremos em vós refúgio seguro.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
    },

    { type: "title", text: "Oração Final" },
    {
      type: "prayer",
      text: `Ó Nossa Senhora Auxiliadora, auxílio seguro dos cristãos, rogai por nós.

Ajudai-nos a viver na fé, na esperança e no amor, confiantes em vossa proteção materna.

Amém.`
    }
  ]
},
{
  novenaId: "novena_nossa_senhora_auxiliadora",
  day: 8,
  title: "Oitavo dia – Nossa Senhora Auxiliadora, modelo de fé",
  sections: [
    { type: "title", text: "Sinal da Cruz" },
    { type: "prayer", text: "Em nome do Pai, do Filho e do Espírito Santo. Amém." },

    { type: "title", text: "Oração Inicial" },
    {
      type: "prayer",
      text: `Ó Nossa Senhora Auxiliadora, Mãe poderosa e cheia de ternura, auxílio dos cristãos em todas as necessidades, com confiança recorremos à vossa intercessão.

Vós que sempre socorrestes os que a vós recorrem com fé, acompanhai-nos nas dificuldades da vida e fortalecei-nos na caminhada cristã.

Concedei-nos a graça de rezar esta novena com fé sincera, para que, sob vossa proteção materna, possamos alcançar as graças que necessitamos, se forem da vontade de Deus.

Amém.`
    },

    { type: "title", text: "Oração do dia" },
    {
      type: "text",
      text: `Ó Nossa Senhora Auxiliadora, vivestes uma fé total e confiante em Deus.

Ensinai-nos a viver com fé firme e perseverante.

Que sigamos vosso exemplo de entrega ao Senhor.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
    },

    { type: "title", text: "Oração Final" },
    {
      type: "prayer",
      text: `Ó Nossa Senhora Auxiliadora, auxílio seguro dos cristãos, rogai por nós.

Ajudai-nos a viver na fé, na esperança e no amor, confiantes em vossa proteção materna.

Amém.`
    }
  ]
},
{
  novenaId: "novena_nossa_senhora_auxiliadora",
  day: 9,
  title: "Nono dia – Nossa Senhora Auxiliadora, intercessora poderosa",
  sections: [
    { type: "title", text: "Sinal da Cruz" },
    { type: "prayer", text: "Em nome do Pai, do Filho e do Espírito Santo. Amém." },

    { type: "title", text: "Oração Inicial" },
    {
      type: "prayer",
      text: `Ó Nossa Senhora Auxiliadora, Mãe poderosa e cheia de ternura, auxílio dos cristãos em todas as necessidades, com confiança recorremos à vossa intercessão.

Vós que sempre socorrestes os que a vós recorrem com fé, acompanhai-nos nas dificuldades da vida e fortalecei-nos na caminhada cristã.

Concedei-nos a graça de rezar esta novena com fé sincera, para que, sob vossa proteção materna, possamos alcançar as graças que necessitamos, se forem da vontade de Deus.

Amém.`
    },

    { type: "title", text: "Oração do dia" },
    {
      type: "text",
      text: `Ó gloriosa Nossa Senhora Auxiliadora, confiamos em vossa poderosa intercessão.

Apresentai a Deus nossas necessidades, pedidos e intenções.

Conduzi-nos sempre no caminho da fé, da esperança e da salvação.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
    },

    { type: "title", text: "Oração Final" },
    {
      type: "prayer",
      text: `Ó Nossa Senhora Auxiliadora, auxílio seguro dos cristãos, rogai por nós.

Ajudai-nos a viver na fé, na esperança e no amor, confiantes em vossa proteção materna.

Amém.`
    }
  ]
}


];


// =====================
// ✅ Conteúdo embutido (EXEMPLOS) — preenche o Map `days` ao iniciar
// Você continua do mesmo jeito: adicionando itens em daysSeed
// =====================
const daysSeed = [
    // ===== Novena da Imaculada Conceição (daysSeed) =====
// ===== Novena da Imaculada Conceição =====
{
  novenaId: "novena_imaculada_conceicao",
  day: 1,
  title: "Primeiro dia – Maria, escolhida por Deus",
  sections: [
    { type: "title", text: "Sinal da Cruz" },
    { type: "prayer", text: "Em nome do Pai, do Filho e do Espírito Santo. Amém." },

    { type: "title", text: "Oração Inicial" },
    {
      type: "prayer",
      text: `Ó Maria Santíssima, Virgem Imaculada, concebida sem pecado original, Mãe de Deus e nossa Mãe, cheios de confiança recorremos a vós.

Vós fostes escolhida desde toda a eternidade para ser a morada pura do Filho de Deus. Preservada de toda mancha do pecado, sois para nós sinal de esperança, modelo de fé, humildade e obediência.

Alcançai-nos a graça de rezarmos esta novena com o coração sincero e cheio de fé, para que, por vossa poderosa intercessão, possamos alcançar as graças que necessitamos, se forem da vontade de Deus.

Amém.`
    },

    { type: "title", text: "Oração do Dia" },
    {
      type: "text",
      text: `Ó Imaculada Conceição, antes mesmo da criação do mundo, Deus já vos havia escolhido para ser a Mãe do Salvador.

Vossa vida inteira foi um “sim” generoso à vontade do Pai. Ajudai-nos a compreender que também somos chamados por Deus a viver segundo Seus planos, mesmo quando não os entendemos plenamente.

Concedei-nos um coração dócil, capaz de confiar em Deus em todas as circunstâncias.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
    },

    { type: "title", text: "Oração Final" },
    {
      type: "prayer",
      text: `Ó Maria concebida sem pecado, rogai por nós que recorremos a vós.

Ó Imaculada Conceição, sede nossa Mãe, nossa proteção e nosso refúgio, hoje e sempre.

Amém.`
    }
  ]
},
{
  novenaId: "novena_imaculada_conceicao",
  day: 2,
  title: "Segundo dia – Maria, cheia de graça",
  sections: [
    { type: "title", text: "Sinal da Cruz" },
    { type: "prayer", text: "Em nome do Pai, do Filho e do Espírito Santo. Amém." },

    { type: "title", text: "Oração Inicial" },
    {
      type: "prayer",
      text: `Ó Maria Santíssima, Virgem Imaculada, concebida sem pecado original, Mãe de Deus e nossa Mãe, cheios de confiança recorremos a vós.

Vós fostes escolhida desde toda a eternidade para ser a morada pura do Filho de Deus. Preservada de toda mancha do pecado, sois para nós sinal de esperança, modelo de fé, humildade e obediência.

Alcançai-nos a graça de rezarmos esta novena com o coração sincero e cheio de fé, para que, por vossa poderosa intercessão, possamos alcançar as graças que necessitamos, se forem da vontade de Deus.

Amém.`
    },

    { type: "title", text: "Oração do Dia" },
    {
      type: "text",
      text: `Ó Virgem Imaculada, o anjo vos saudou como “cheia de graça”, pois em vós não havia sombra de pecado.

Ajudai-nos a rejeitar o mal e a buscar uma vida santa, livre das amarras do pecado que nos afastam de Deus.

Que, a vosso exemplo, possamos viver na graça divina e crescer diariamente no amor ao Senhor.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
    },

    { type: "title", text: "Oração Final" },
    {
      type: "prayer",
      text: `Ó Maria concebida sem pecado, rogai por nós que recorremos a vós.

Ó Imaculada Conceição, sede nossa Mãe, nossa proteção e nosso refúgio, hoje e sempre.

Amém.`
    }
  ]
},
{
  novenaId: "novena_imaculada_conceicao",
  day: 3,
  title: "Terceiro dia – Maria, humilde serva do Senhor",
  sections: [
    { type: "title", text: "Sinal da Cruz" },
    { type: "prayer", text: "Em nome do Pai, do Filho e do Espírito Santo. Amém." },

    { type: "title", text: "Oração Inicial" },
    {
      type: "prayer",
      text: `Ó Maria Santíssima, Virgem Imaculada, concebida sem pecado original, Mãe de Deus e nossa Mãe, cheios de confiança recorremos a vós.

Vós fostes escolhida desde toda a eternidade para ser a morada pura do Filho de Deus. Preservada de toda mancha do pecado, sois para nós sinal de esperança, modelo de fé, humildade e obediência.

Alcançai-nos a graça de rezarmos esta novena com o coração sincero e cheio de fé, para que, por vossa poderosa intercessão, possamos alcançar as graças que necessitamos, se forem da vontade de Deus.

Amém.`
    },

    { type: "title", text: "Oração do Dia" },
    {
      type: "text",
      text: `Ó Mãe Imaculada, mesmo sendo elevada por Deus, vos declarastes apenas sua serva.

Ensinai-nos a verdadeira humildade, que não busca honras nem reconhecimento, mas deseja apenas servir com amor.

Livrai-nos do orgulho e ajudai-nos a viver com simplicidade e caridade.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
    },

    { type: "title", text: "Oração Final" },
    {
      type: "prayer",
      text: `Ó Maria concebida sem pecado, rogai por nós que recorremos a vós.

Ó Imaculada Conceição, sede nossa Mãe, nossa proteção e nosso refúgio, hoje e sempre.

Amém.`
    }
  ]
},
{
  novenaId: "novena_imaculada_conceicao",
  day: 4,
  title: "Quarto dia – Maria, obediente à vontade divina",
  sections: [
    { type: "title", text: "Sinal da Cruz" },
    { type: "prayer", text: "Em nome do Pai, do Filho e do Espírito Santo. Amém." },

    { type: "title", text: "Oração Inicial" },
    {
      type: "prayer",
      text: `Ó Maria Santíssima, Virgem Imaculada, concebida sem pecado original, Mãe de Deus e nossa Mãe, cheios de confiança recorremos a vós.

Vós fostes escolhida desde toda a eternidade para ser a morada pura do Filho de Deus. Preservada de toda mancha do pecado, sois para nós sinal de esperança, modelo de fé, humildade e obediência.

Alcançai-nos a graça de rezarmos esta novena com o coração sincero e cheio de fé, para que, por vossa poderosa intercessão, possamos alcançar as graças que necessitamos, se forem da vontade de Deus.

Amém.`
    },

    { type: "title", text: "Oração do Dia" },
    {
      type: "text",
      text: `Ó Virgem fiel, vós aceitastes o plano de Deus sem reservas nem condições.

Ajudai-nos a confiar no Senhor mesmo nos momentos de dificuldade, quando a dor e a dúvida visitam nosso coração.

Que aprendamos convosco a dizer todos os dias: faça-se em mim segundo a Tua Palavra.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
    },

    { type: "title", text: "Oração Final" },
    {
      type: "prayer",
      text: `Ó Maria concebida sem pecado, rogai por nós que recorremos a vós.

Ó Imaculada Conceição, sede nossa Mãe, nossa proteção e nosso refúgio, hoje e sempre.

Amém.`
    }
  ]
},
{
  novenaId: "novena_imaculada_conceicao",
  day: 5,
  title: "Quinto dia – Maria, Mãe do Salvador",
  sections: [
    { type: "title", text: "Sinal da Cruz" },
    { type: "prayer", text: "Em nome do Pai, do Filho e do Espírito Santo. Amém." },

    { type: "title", text: "Oração Inicial" },
    {
      type: "prayer",
      text: `Ó Maria Santíssima, Virgem Imaculada, concebida sem pecado original, Mãe de Deus e nossa Mãe, cheios de confiança recorremos a vós.

Vós fostes escolhida desde toda a eternidade para ser a morada pura do Filho de Deus. Preservada de toda mancha do pecado, sois para nós sinal de esperança, modelo de fé, humildade e obediência.

Alcançai-nos a graça de rezarmos esta novena com o coração sincero e cheio de fé, para que, por vossa poderosa intercessão, possamos alcançar as graças que necessitamos, se forem da vontade de Deus.

Amém.`
    },

    { type: "title", text: "Oração do Dia" },
    {
      type: "text",
      text: `Ó Imaculada Conceição, em vosso ventre puro o Verbo se fez carne para a salvação da humanidade.

Ajudai-nos a acolher Jesus em nosso coração e em nossa vida, para que Ele seja nosso Senhor e Salvador.

Conduzi-nos sempre para mais perto de vosso Filho.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
    },

    { type: "title", text: "Oração Final" },
    {
      type: "prayer",
      text: `Ó Maria concebida sem pecado, rogai por nós que recorremos a vós.

Ó Imaculada Conceição, sede nossa Mãe, nossa proteção e nosso refúgio, hoje e sempre.

Amém.`
    }
  ]
},
{
  novenaId: "novena_imaculada_conceicao",
  day: 6,
  title: "Sexto dia – Maria, modelo de fé",
  sections: [
    { type: "title", text: "Sinal da Cruz" },
    { type: "prayer", text: "Em nome do Pai, do Filho e do Espírito Santo. Amém." },

    { type: "title", text: "Oração Inicial" },
    {
      type: "prayer",
      text: `Ó Maria Santíssima, Virgem Imaculada, concebida sem pecado original, Mãe de Deus e nossa Mãe, cheios de confiança recorremos a vós.

Vós fostes escolhida desde toda a eternidade para ser a morada pura do Filho de Deus. Preservada de toda mancha do pecado, sois para nós sinal de esperança, modelo de fé, humildade e obediência.

Alcançai-nos a graça de rezarmos esta novena com o coração sincero e cheio de fé, para que, por vossa poderosa intercessão, possamos alcançar as graças que necessitamos, se forem da vontade de Deus.

Amém.`
    },

    { type: "title", text: "Oração do Dia" },
    {
      type: "text",
      text: `Ó Mãe da fé, mesmo sem compreender tudo, vós acreditastes nas promessas de Deus.

Fortalecei nossa fé nos momentos de prova, quando somos tentados a desanimar.

Que nunca nos afastemos do Senhor, mas confiemos plenamente em Sua misericórdia.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
    },

    { type: "title", text: "Oração Final" },
    {
      type: "prayer",
      text: `Ó Maria concebida sem pecado, rogai por nós que recorremos a vós.

Ó Imaculada Conceição, sede nossa Mãe, nossa proteção e nosso refúgio, hoje e sempre.

Amém.`
    }
  ]
},
{
  novenaId: "novena_imaculada_conceicao",
  day: 7,
  title: "Sétimo dia – Maria, Mãe de misericórdia",
  sections: [
    { type: "title", text: "Sinal da Cruz" },
    { type: "prayer", text: "Em nome do Pai, do Filho e do Espírito Santo. Amém." },

    { type: "title", text: "Oração Inicial" },
    {
      type: "prayer",
      text: `Ó Maria Santíssima, Virgem Imaculada, concebida sem pecado original, Mãe de Deus e nossa Mãe, cheios de confiança recorremos a vós.

Vós fostes escolhida desde toda a eternidade para ser a morada pura do Filho de Deus. Preservada de toda mancha do pecado, sois para nós sinal de esperança, modelo de fé, humildade e obediência.

Alcançai-nos a graça de rezarmos esta novena com o coração sincero e cheio de fé, para que, por vossa poderosa intercessão, possamos alcançar as graças que necessitamos, se forem da vontade de Deus.

Amém.`
    },

    { type: "title", text: "Oração do Dia" },
    {
      type: "text",
      text: `Ó Imaculada Conceição, vós sois refúgio dos pecadores e consoladora dos aflitos.

Olhai com ternura para nossas dores, angústias e necessidades.

Intercedei por todos os que sofrem, pelos doentes, pelos pobres e pelos que perderam a esperança.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
    },

    { type: "title", text: "Oração Final" },
    {
      type: "prayer",
      text: `Ó Maria concebida sem pecado, rogai por nós que recorremos a vós.

Ó Imaculada Conceição, sede nossa Mãe, nossa proteção e nosso refúgio, hoje e sempre.

Amém.`
    }
  ]
},
{
  novenaId: "novena_imaculada_conceicao",
  day: 8,
  title: "Oitavo dia – Maria, esperança dos cristãos",
  sections: [
    { type: "title", text: "Sinal da Cruz" },
    { type: "prayer", text: "Em nome do Pai, do Filho e do Espírito Santo. Amém." },

    { type: "title", text: "Oração Inicial" },
    {
      type: "prayer",
      text: `Ó Maria Santíssima, Virgem Imaculada, concebida sem pecado original, Mãe de Deus e nossa Mãe, cheios de confiança recorremos a vós.

Vós fostes escolhida desde toda a eternidade para ser a morada pura do Filho de Deus. Preservada de toda mancha do pecado, sois para nós sinal de esperança, modelo de fé, humildade e obediência.

Alcançai-nos a graça de rezarmos esta novena com o coração sincero e cheio de fé, para que, por vossa poderosa intercessão, possamos alcançar as graças que necessitamos, se forem da vontade de Deus.

Amém.`
    },

    { type: "title", text: "Oração do Dia" },
    {
      type: "text",
      text: `Ó Virgem Imaculada, em vós contemplamos a vitória da graça sobre o pecado.

Renovai nossa esperança, para que nunca desistamos do bem nem da busca pela santidade.

Conduzi-nos firmes no caminho do Céu.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
    },

    { type: "title", text: "Oração Final" },
    {
      type: "prayer",
      text: `Ó Maria concebida sem pecado, rogai por nós que recorremos a vós.

Ó Imaculada Conceição, sede nossa Mãe, nossa proteção e nosso refúgio, hoje e sempre.

Amém.`
    }
  ]
},
{
  novenaId: "novena_imaculada_conceicao",
  day: 9,
  title: "Nono dia – Maria, nossa Mãe e intercessora",
  sections: [
    { type: "title", text: "Sinal da Cruz" },
    { type: "prayer", text: "Em nome do Pai, do Filho e do Espírito Santo. Amém." },

    { type: "title", text: "Oração Inicial" },
    {
      type: "prayer",
      text: `Ó Maria Santíssima, Virgem Imaculada, concebida sem pecado original, Mãe de Deus e nossa Mãe, cheios de confiança recorremos a vós.

Vós fostes escolhida desde toda a eternidade para ser a morada pura do Filho de Deus. Preservada de toda mancha do pecado, sois para nós sinal de esperança, modelo de fé, humildade e obediência.

Alcançai-nos a graça de rezarmos esta novena com o coração sincero e cheio de fé, para que, por vossa poderosa intercessão, possamos alcançar as graças que necessitamos, se forem da vontade de Deus.

Amém.`
    },

    { type: "title", text: "Oração do Dia" },
    {
      type: "text",
      text: `Ó Mãe Santíssima, acolhei esta novena que rezamos com amor e confiança.

Apresentai nossos pedidos a Deus e alcançai-nos as graças necessárias para nossa salvação.

Consagrai-nos inteiramente ao vosso Coração Imaculado e conduzi-nos sempre a Jesus.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
    },

    { type: "title", text: "Oração Final" },
    {
      type: "prayer",
      text: `Ó Maria concebida sem pecado, rogai por nós que recorremos a vós.

Ó Imaculada Conceição, sede nossa Mãe, nossa proteção e nosso refúgio, hoje e sempre.

Amém.`
    }
  ]
},
// ===== Novena de Nossa Senhora das Graças =====
{
  novenaId: "novena_nossa_senhora_das_graças",
  day: 1,
  title: "Primeiro dia – Nossa Senhora das Graças, canal das bênçãos de Deus",
  sections: [
    { type: "title", text: "Sinal da Cruz" },
    { type: "prayer", text: "Em nome do Pai, do Filho e do Espírito Santo. Amém." },

    { type: "title", text: "Oração Inicial" },
    {
      type: "prayer",
      text: `Ó Maria Santíssima, Mãe de Deus e nossa Mãe, que aparecestes a Santa Catarina Labouré como a Senhora das Graças, cheios de confiança recorremos a vós.

Vós pedistes que fosse cunhada a medalha que traz vossa imagem e prometestes grandes graças àqueles que a usassem com fé. Concedei-nos um coração aberto à ação de Deus, para que possamos acolher as graças que o Senhor deseja derramar sobre nós.

Ensinai-nos a confiar na misericórdia divina e a buscar sempre uma vida de santidade, seguindo vosso exemplo de amor e fidelidade.

Amém.`
    },

    { type: "title", text: "Oração do Dia" },
    {
      type: "text",
      text: `Ó Nossa Senhora das Graças, Deus vos escolheu como instrumento para derramar Suas bênçãos sobre a humanidade.

Ajudai-nos a reconhecer que toda graça vem do Senhor e que vós sois a Mãe que intercede por nós junto a Ele.

Que saibamos viver com gratidão e confiança, acolhendo com fé as graças que Deus nos concede.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
    },

    { type: "title", text: "Oração Final" },
    {
      type: "prayer",
      text: `Ó Maria concebida sem pecado, rogai por nós que recorremos a vós.

Ó Nossa Senhora das Graças, derramai sobre nós as graças de que necessitamos para viver na fé, na esperança e no amor.

Amém.`
    }
  ]
},
{
  novenaId: "novena_nossa_senhora_das_graças",
  day: 2,
  title: "Segundo dia – Nossa Senhora das Graças, Mãe misericordiosa",
  sections: [
    { type: "title", text: "Sinal da Cruz" },
    { type: "prayer", text: "Em nome do Pai, do Filho e do Espírito Santo. Amém." },

    { type: "title", text: "Oração Inicial" },
    {
      type: "prayer",
      text: `Ó Maria Santíssima, Mãe de Deus e nossa Mãe, que aparecestes a Santa Catarina Labouré como a Senhora das Graças, cheios de confiança recorremos a vós.

Vós pedistes que fosse cunhada a medalha que traz vossa imagem e prometestes grandes graças àqueles que a usassem com fé. Concedei-nos um coração aberto à ação de Deus, para que possamos acolher as graças que o Senhor deseja derramar sobre nós.

Ensinai-nos a confiar na misericórdia divina e a buscar sempre uma vida de santidade, seguindo vosso exemplo de amor e fidelidade.

Amém.`
    },

    { type: "title", text: "Oração do Dia" },
    {
      type: "text",
      text: `Ó Mãe cheia de bondade, vós conheceis nossas dores, fraquezas e necessidades.

Olhai por nós com ternura e apresentai nossas súplicas ao vosso Filho Jesus.

Ajudai-nos a confiar na misericórdia de Deus, mesmo quando nos sentimos indignos de Suas graças.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
    },

    { type: "title", text: "Oração Final" },
    {
      type: "prayer",
      text: `Ó Maria concebida sem pecado, rogai por nós que recorremos a vós.

Ó Nossa Senhora das Graças, derramai sobre nós as graças de que necessitamos para viver na fé, na esperança e no amor.

Amém.`
    }
  ]
},
{
  novenaId: "novena_nossa_senhora_das_graças",
  day: 3,
  title: "Terceiro dia – Nossa Senhora das Graças, modelo de fé",
  sections: [
    { type: "title", text: "Sinal da Cruz" },
    { type: "prayer", text: "Em nome do Pai, do Filho e do Espírito Santo. Amém." },

    { type: "title", text: "Oração Inicial" },
    {
      type: "prayer",
      text: `Ó Maria Santíssima, Mãe de Deus e nossa Mãe, que aparecestes a Santa Catarina Labouré como a Senhora das Graças, cheios de confiança recorremos a vós.

Vós pedistes que fosse cunhada a medalha que traz vossa imagem e prometestes grandes graças àqueles que a usassem com fé. Concedei-nos um coração aberto à ação de Deus, para que possamos acolher as graças que o Senhor deseja derramar sobre nós.

Ensinai-nos a confiar na misericórdia divina e a buscar sempre uma vida de santidade, seguindo vosso exemplo de amor e fidelidade.

Amém.`
    },

    { type: "title", text: "Oração do Dia" },
    {
      type: "text",
      text: `Ó Virgem Santíssima, vossa fé foi plena e inabalável desde a Anunciação até a cruz.

Ensinai-nos a acreditar nas promessas de Deus, mesmo nas dificuldades e provações da vida.

Fortalecei nossa fé para que possamos permanecer firmes no caminho do Senhor.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
    },

    { type: "title", text: "Oração Final" },
    {
      type: "prayer",
      text: `Ó Maria concebida sem pecado, rogai por nós que recorremos a vós.

Ó Nossa Senhora das Graças, derramai sobre nós as graças de que necessitamos para viver na fé, na esperança e no amor.

Amém.`
    }
  ]
},
{
  novenaId: "novena_nossa_senhora_das_graças",
  day: 4,
  title: "Quarto dia – Nossa Senhora das Graças, refúgio dos aflitos",
  sections: [
    { type: "title", text: "Sinal da Cruz" },
    { type: "prayer", text: "Em nome do Pai, do Filho e do Espírito Santo. Amém." },

    { type: "title", text: "Oração Inicial" },
    {
      type: "prayer",
      text: `Ó Maria Santíssima, Mãe de Deus e nossa Mãe, que aparecestes a Santa Catarina Labouré como a Senhora das Graças, cheios de confiança recorremos a vós.

Vós pedistes que fosse cunhada a medalha que traz vossa imagem e prometestes grandes graças àqueles que a usassem com fé. Concedei-nos um coração aberto à ação de Deus, para que possamos acolher as graças que o Senhor deseja derramar sobre nós.

Ensinai-nos a confiar na misericórdia divina e a buscar sempre uma vida de santidade, seguindo vosso exemplo de amor e fidelidade.

Amém.`
    },

    { type: "title", text: "Oração do Dia" },
    {
      type: "text",
      text: `Ó Mãe compassiva, vós sois consolo para os que sofrem e esperança para os desanimados.

Acolhei em vosso coração materno todos os que passam por dores físicas, espirituais ou emocionais.

Alcançai-nos a graça da paz, da força e da perseverança.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
    },

    { type: "title", text: "Oração Final" },
    {
      type: "prayer",
      text: `Ó Maria concebida sem pecado, rogai por nós que recorremos a vós.

Ó Nossa Senhora das Graças, derramai sobre nós as graças de que necessitamos para viver na fé, na esperança e no amor.

Amém.`
    }
  ]
},
{
  novenaId: "novena_nossa_senhora_das_graças",
  day: 5,
  title: "Quinto dia – Nossa Senhora das Graças, protetora dos pecadores",
  sections: [
    { type: "title", text: "Sinal da Cruz" },
    { type: "prayer", text: "Em nome do Pai, do Filho e do Espírito Santo. Amém." },

    { type: "title", text: "Oração Inicial" },
    {
      type: "prayer",
      text: `Ó Maria Santíssima, Mãe de Deus e nossa Mãe, que aparecestes a Santa Catarina Labouré como a Senhora das Graças, cheios de confiança recorremos a vós.

Vós pedistes que fosse cunhada a medalha que traz vossa imagem e prometestes grandes graças àqueles que a usassem com fé. Concedei-nos um coração aberto à ação de Deus, para que possamos acolher as graças que o Senhor deseja derramar sobre nós.

Ensinai-nos a confiar na misericórdia divina e a buscar sempre uma vida de santidade, seguindo vosso exemplo de amor e fidelidade.

Amém.`
    },

    { type: "title", text: "Oração do Dia" },
    {
      type: "text",
      text: `Ó Mãe cheia de amor, vós não rejeitais nenhum de vossos filhos.

Intercedei pelos pecadores, para que encontrem o caminho da conversão e da reconciliação com Deus.

Ajudai-nos a reconhecer nossas faltas e a buscar sinceramente o perdão do Senhor.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
    },

    { type: "title", text: "Oração Final" },
    {
      type: "prayer",
      text: `Ó Maria concebida sem pecado, rogai por nós que recorremos a vós.

Ó Nossa Senhora das Graças, derramai sobre nós as graças de que necessitamos para viver na fé, na esperança e no amor.

Amém.`
    }
  ]
},
{
  novenaId: "novena_nossa_senhora_das_graças",
  day: 6,
  title: "Sexto dia – Nossa Senhora das Graças, fonte de esperança",
  sections: [
    { type: "title", text: "Sinal da Cruz" },
    { type: "prayer", text: "Em nome do Pai, do Filho e do Espírito Santo. Amém." },

    { type: "title", text: "Oração Inicial" },
    {
      type: "prayer",
      text: `Ó Maria Santíssima, Mãe de Deus e nossa Mãe, que aparecestes a Santa Catarina Labouré como a Senhora das Graças, cheios de confiança recorremos a vós.

Vós pedistes que fosse cunhada a medalha que traz vossa imagem e prometestes grandes graças àqueles que a usassem com fé. Concedei-nos um coração aberto à ação de Deus, para que possamos acolher as graças que o Senhor deseja derramar sobre nós.

Ensinai-nos a confiar na misericórdia divina e a buscar sempre uma vida de santidade, seguindo vosso exemplo de amor e fidelidade.

Amém.`
    },

    { type: "title", text: "Oração do Dia" },
    {
      type: "text",
      text: `Ó Senhora das Graças, quando tudo parece difícil, sois sinal de esperança para o povo de Deus.

Renovai nossa confiança e ajudai-nos a não desanimar diante das provações da vida.

Que possamos caminhar sempre sustentados pela fé e pela esperança cristã.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
    },

    { type: "title", text: "Oração Final" },
    {
      type: "prayer",
      text: `Ó Maria concebida sem pecado, rogai por nós que recorremos a vós.

Ó Nossa Senhora das Graças, derramai sobre nós as graças de que necessitamos para viver na fé, na esperança e no amor.

Amém.`
    }
  ]
},
{
  novenaId: "novena_nossa_senhora_das_graças",
  day: 7,
  title: "Sétimo dia – Nossa Senhora das Graças, intercessora poderosa",
  sections: [
    { type: "title", text: "Sinal da Cruz" },
    { type: "prayer", text: "Em nome do Pai, do Filho e do Espírito Santo. Amém." },

    { type: "title", text: "Oração Inicial" },
    {
      type: "prayer",
      text: `Ó Maria Santíssima, Mãe de Deus e nossa Mãe, que aparecestes a Santa Catarina Labouré como a Senhora das Graças, cheios de confiança recorremos a vós.

Vós pedistes que fosse cunhada a medalha que traz vossa imagem e prometestes grandes graças àqueles que a usassem com fé. Concedei-nos um coração aberto à ação de Deus, para que possamos acolher as graças que o Senhor deseja derramar sobre nós.

Ensinai-nos a confiar na misericórdia divina e a buscar sempre uma vida de santidade, seguindo vosso exemplo de amor e fidelidade.

Amém.`
    },

    { type: "title", text: "Oração do Dia" },
    {
      type: "text",
      text: `Ó Mãe Santíssima, vossa intercessão junto a Deus é cheia de amor e poder.

Apresentai ao Senhor nossas necessidades, angústias e intenções mais profundas.

Alcançai-nos as graças que mais necessitamos para nossa vida e salvação.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
    },

    { type: "title", text: "Oração Final" },
    {
      type: "prayer",
      text: `Ó Maria concebida sem pecado, rogai por nós que recorremos a vós.

Ó Nossa Senhora das Graças, derramai sobre nós as graças de que necessitamos para viver na fé, na esperança e no amor.

Amém.`
    }
  ]
},
{
  novenaId: "novena_nossa_senhora_das_graças",
  day: 8,
  title: "Oitavo dia – Nossa Senhora das Graças, exemplo de amor e serviço",
  sections: [
    { type: "title", text: "Sinal da Cruz" },
    { type: "prayer", text: "Em nome do Pai, do Filho e do Espírito Santo. Amém." },

    { type: "title", text: "Oração Inicial" },
    {
      type: "prayer",
      text: `Ó Maria Santíssima, Mãe de Deus e nossa Mãe, que aparecestes a Santa Catarina Labouré como a Senhora das Graças, cheios de confiança recorremos a vós.

Vós pedistes que fosse cunhada a medalha que traz vossa imagem e prometestes grandes graças àqueles que a usassem com fé. Concedei-nos um coração aberto à ação de Deus, para que possamos acolher as graças que o Senhor deseja derramar sobre nós.

Ensinai-nos a confiar na misericórdia divina e a buscar sempre uma vida de santidade, seguindo vosso exemplo de amor e fidelidade.

Amém.`
    },

    { type: "title", text: "Oração do Dia" },
    {
      type: "text",
      text: `Ó Virgem Maria, vossa vida foi inteiramente dedicada ao amor e ao serviço de Deus e dos irmãos.

Ensinai-nos a viver a caridade, o perdão e a solidariedade no dia a dia.

Que sejamos instrumentos das graças de Deus na vida dos outros.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
    },

    { type: "title", text: "Oração Final" },
    {
      type: "prayer",
      text: `Ó Maria concebida sem pecado, rogai por nós que recorremos a vós.

Ó Nossa Senhora das Graças, derramai sobre nós as graças de que necessitamos para viver na fé, na esperança e no amor.

Amém.`
    }
  ]
},
{
  novenaId: "novena_nossa_senhora_das_graças",
  day: 9,
  title: "Nono dia – Nossa Senhora das Graças, Mãe e protetora",
  sections: [
    { type: "title", text: "Sinal da Cruz" },
    { type: "prayer", text: "Em nome do Pai, do Filho e do Espírito Santo. Amém." },

    { type: "title", text: "Oração Inicial" },
    {
      type: "prayer",
      text: `Ó Maria Santíssima, Mãe de Deus e nossa Mãe, que aparecestes a Santa Catarina Labouré como a Senhora das Graças, cheios de confiança recorremos a vós.

Vós pedistes que fosse cunhada a medalha que traz vossa imagem e prometestes grandes graças àqueles que a usassem com fé. Concedei-nos um coração aberto à ação de Deus, para que possamos acolher as graças que o Senhor deseja derramar sobre nós.

Ensinai-nos a confiar na misericórdia divina e a buscar sempre uma vida de santidade, seguindo vosso exemplo de amor e fidelidade.

Amém.`
    },

    { type: "title", text: "Oração do Dia" },
    {
      type: "text",
      text: `Ó Mãe querida, colocamos esta novena sob vossa proteção materna.

Recebei nossas orações e apresentai-as a Deus, para que sejamos atendidos conforme Sua santa vontade.

Consagrai-nos ao vosso coração e conduzi-nos sempre a Jesus.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
    },

    { type: "title", text: "Oração Final" },
    {
      type: "prayer",
      text: `Ó Maria concebida sem pecado, rogai por nós que recorremos a vós.

Ó Nossa Senhora das Graças, derramai sobre nós as graças de que necessitamos para viver na fé, na esperança e no amor.

Amém.`
    }
  ]
},
// ===== Novena de Nossa Senhora das Graças =====
{
  novenaId: "novena_nossa_senhora_das_graças",
  day: 1,
  title: "Primeiro dia – Nossa Senhora das Graças, canal das bênçãos de Deus",
  sections: [
    { type: "title", text: "Sinal da Cruz" },
    { type: "prayer", text: "Em nome do Pai, do Filho e do Espírito Santo. Amém." },

    { type: "title", text: "Oração Inicial" },
    {
      type: "prayer",
      text: `Ó Maria Santíssima, Mãe de Deus e nossa Mãe, que aparecestes a Santa Catarina Labouré como a Senhora das Graças, cheios de confiança recorremos a vós.

Vós pedistes que fosse cunhada a medalha que traz vossa imagem e prometestes grandes graças àqueles que a usassem com fé. Concedei-nos um coração aberto à ação de Deus, para que possamos acolher as graças que o Senhor deseja derramar sobre nós.

Ensinai-nos a confiar na misericórdia divina e a buscar sempre uma vida de santidade, seguindo vosso exemplo de amor e fidelidade.

Amém.`
    },

    { type: "title", text: "Oração do Dia" },
    {
      type: "text",
      text: `Ó Nossa Senhora das Graças, Deus vos escolheu como instrumento para derramar Suas bênçãos sobre a humanidade.

Ajudai-nos a reconhecer que toda graça vem do Senhor e que vós sois a Mãe que intercede por nós junto a Ele.

Que saibamos viver com gratidão e confiança, acolhendo com fé as graças que Deus nos concede.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
    },

    { type: "title", text: "Oração Final" },
    {
      type: "prayer",
      text: `Ó Maria concebida sem pecado, rogai por nós que recorremos a vós.

Ó Nossa Senhora das Graças, derramai sobre nós as graças de que necessitamos para viver na fé, na esperança e no amor.

Amém.`
    }
  ]
},
{
  novenaId: "novena_nossa_senhora_das_graças",
  day: 2,
  title: "Segundo dia – Nossa Senhora das Graças, Mãe misericordiosa",
  sections: [
    { type: "title", text: "Sinal da Cruz" },
    { type: "prayer", text: "Em nome do Pai, do Filho e do Espírito Santo. Amém." },

    { type: "title", text: "Oração Inicial" },
    {
      type: "prayer",
      text: `Ó Maria Santíssima, Mãe de Deus e nossa Mãe, que aparecestes a Santa Catarina Labouré como a Senhora das Graças, cheios de confiança recorremos a vós.

Vós pedistes que fosse cunhada a medalha que traz vossa imagem e prometestes grandes graças àqueles que a usassem com fé. Concedei-nos um coração aberto à ação de Deus, para que possamos acolher as graças que o Senhor deseja derramar sobre nós.

Ensinai-nos a confiar na misericórdia divina e a buscar sempre uma vida de santidade, seguindo vosso exemplo de amor e fidelidade.

Amém.`
    },

    { type: "title", text: "Oração do Dia" },
    {
      type: "text",
      text: `Ó Mãe cheia de bondade, vós conheceis nossas dores, fraquezas e necessidades.

Olhai por nós com ternura e apresentai nossas súplicas ao vosso Filho Jesus.

Ajudai-nos a confiar na misericórdia de Deus, mesmo quando nos sentimos indignos de Suas graças.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
    },

    { type: "title", text: "Oração Final" },
    {
      type: "prayer",
      text: `Ó Maria concebida sem pecado, rogai por nós que recorremos a vós.

Ó Nossa Senhora das Graças, derramai sobre nós as graças de que necessitamos para viver na fé, na esperança e no amor.

Amém.`
    }
  ]
},
{
  novenaId: "novena_nossa_senhora_das_graças",
  day: 3,
  title: "Terceiro dia – Nossa Senhora das Graças, modelo de fé",
  sections: [
    { type: "title", text: "Sinal da Cruz" },
    { type: "prayer", text: "Em nome do Pai, do Filho e do Espírito Santo. Amém." },

    { type: "title", text: "Oração Inicial" },
    {
      type: "prayer",
      text: `Ó Maria Santíssima, Mãe de Deus e nossa Mãe, que aparecestes a Santa Catarina Labouré como a Senhora das Graças, cheios de confiança recorremos a vós.

Vós pedistes que fosse cunhada a medalha que traz vossa imagem e prometestes grandes graças àqueles que a usassem com fé. Concedei-nos um coração aberto à ação de Deus, para que possamos acolher as graças que o Senhor deseja derramar sobre nós.

Ensinai-nos a confiar na misericórdia divina e a buscar sempre uma vida de santidade, seguindo vosso exemplo de amor e fidelidade.

Amém.`
    },

    { type: "title", text: "Oração do Dia" },
    {
      type: "text",
      text: `Ó Virgem Santíssima, vossa fé foi plena e inabalável desde a Anunciação até a cruz.

Ensinai-nos a acreditar nas promessas de Deus, mesmo nas dificuldades e provações da vida.

Fortalecei nossa fé para que possamos permanecer firmes no caminho do Senhor.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
    },

    { type: "title", text: "Oração Final" },
    {
      type: "prayer",
      text: `Ó Maria concebida sem pecado, rogai por nós que recorremos a vós.

Ó Nossa Senhora das Graças, derramai sobre nós as graças de que necessitamos para viver na fé, na esperança e no amor.

Amém.`
    }
  ]
},
{
  novenaId: "novena_nossa_senhora_das_graças",
  day: 4,
  title: "Quarto dia – Nossa Senhora das Graças, refúgio dos aflitos",
  sections: [
    { type: "title", text: "Sinal da Cruz" },
    { type: "prayer", text: "Em nome do Pai, do Filho e do Espírito Santo. Amém." },

    { type: "title", text: "Oração Inicial" },
    {
      type: "prayer",
      text: `Ó Maria Santíssima, Mãe de Deus e nossa Mãe, que aparecestes a Santa Catarina Labouré como a Senhora das Graças, cheios de confiança recorremos a vós.

Vós pedistes que fosse cunhada a medalha que traz vossa imagem e prometestes grandes graças àqueles que a usassem com fé. Concedei-nos um coração aberto à ação de Deus, para que possamos acolher as graças que o Senhor deseja derramar sobre nós.

Ensinai-nos a confiar na misericórdia divina e a buscar sempre uma vida de santidade, seguindo vosso exemplo de amor e fidelidade.

Amém.`
    },

    { type: "title", text: "Oração do Dia" },
    {
      type: "text",
      text: `Ó Mãe compassiva, vós sois consolo para os que sofrem e esperança para os desanimados.

Acolhei em vosso coração materno todos os que passam por dores físicas, espirituais ou emocionais.

Alcançai-nos a graça da paz, da força e da perseverança.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
    },

    { type: "title", text: "Oração Final" },
    {
      type: "prayer",
      text: `Ó Maria concebida sem pecado, rogai por nós que recorremos a vós.

Ó Nossa Senhora das Graças, derramai sobre nós as graças de que necessitamos para viver na fé, na esperança e no amor.

Amém.`
    }
  ]
},
{
  novenaId: "novena_nossa_senhora_das_graças",
  day: 5,
  title: "Quinto dia – Nossa Senhora das Graças, protetora dos pecadores",
  sections: [
    { type: "title", text: "Sinal da Cruz" },
    { type: "prayer", text: "Em nome do Pai, do Filho e do Espírito Santo. Amém." },

    { type: "title", text: "Oração Inicial" },
    {
      type: "prayer",
      text: `Ó Maria Santíssima, Mãe de Deus e nossa Mãe, que aparecestes a Santa Catarina Labouré como a Senhora das Graças, cheios de confiança recorremos a vós.

Vós pedistes que fosse cunhada a medalha que traz vossa imagem e prometestes grandes graças àqueles que a usassem com fé. Concedei-nos um coração aberto à ação de Deus, para que possamos acolher as graças que o Senhor deseja derramar sobre nós.

Ensinai-nos a confiar na misericórdia divina e a buscar sempre uma vida de santidade, seguindo vosso exemplo de amor e fidelidade.

Amém.`
    },

    { type: "title", text: "Oração do Dia" },
    {
      type: "text",
      text: `Ó Mãe cheia de amor, vós não rejeitais nenhum de vossos filhos.

Intercedei pelos pecadores, para que encontrem o caminho da conversão e da reconciliação com Deus.

Ajudai-nos a reconhecer nossas faltas e a buscar sinceramente o perdão do Senhor.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
    },

    { type: "title", text: "Oração Final" },
    {
      type: "prayer",
      text: `Ó Maria concebida sem pecado, rogai por nós que recorremos a vós.

Ó Nossa Senhora das Graças, derramai sobre nós as graças de que necessitamos para viver na fé, na esperança e no amor.

Amém.`
    }
  ]
},
{
  novenaId: "novena_nossa_senhora_das_graças",
  day: 6,
  title: "Sexto dia – Nossa Senhora das Graças, fonte de esperança",
  sections: [
    { type: "title", text: "Sinal da Cruz" },
    { type: "prayer", text: "Em nome do Pai, do Filho e do Espírito Santo. Amém." },

    { type: "title", text: "Oração Inicial" },
    {
      type: "prayer",
      text: `Ó Maria Santíssima, Mãe de Deus e nossa Mãe, que aparecestes a Santa Catarina Labouré como a Senhora das Graças, cheios de confiança recorremos a vós.

Vós pedistes que fosse cunhada a medalha que traz vossa imagem e prometestes grandes graças àqueles que a usassem com fé. Concedei-nos um coração aberto à ação de Deus, para que possamos acolher as graças que o Senhor deseja derramar sobre nós.

Ensinai-nos a confiar na misericórdia divina e a buscar sempre uma vida de santidade, seguindo vosso exemplo de amor e fidelidade.

Amém.`
    },

    { type: "title", text: "Oração do Dia" },
    {
      type: "text",
      text: `Ó Senhora das Graças, quando tudo parece difícil, sois sinal de esperança para o povo de Deus.

Renovai nossa confiança e ajudai-nos a não desanimar diante das provações da vida.

Que possamos caminhar sempre sustentados pela fé e pela esperança cristã.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
    },

    { type: "title", text: "Oração Final" },
    {
      type: "prayer",
      text: `Ó Maria concebida sem pecado, rogai por nós que recorremos a vós.

Ó Nossa Senhora das Graças, derramai sobre nós as graças de que necessitamos para viver na fé, na esperança e no amor.

Amém.`
    }
  ]
},
{
  novenaId: "novena_nossa_senhora_das_graças",
  day: 7,
  title: "Sétimo dia – Nossa Senhora das Graças, intercessora poderosa",
  sections: [
    { type: "title", text: "Sinal da Cruz" },
    { type: "prayer", text: "Em nome do Pai, do Filho e do Espírito Santo. Amém." },

    { type: "title", text: "Oração Inicial" },
    {
      type: "prayer",
      text: `Ó Maria Santíssima, Mãe de Deus e nossa Mãe, que aparecestes a Santa Catarina Labouré como a Senhora das Graças, cheios de confiança recorremos a vós.

Vós pedistes que fosse cunhada a medalha que traz vossa imagem e prometestes grandes graças àqueles que a usassem com fé. Concedei-nos um coração aberto à ação de Deus, para que possamos acolher as graças que o Senhor deseja derramar sobre nós.

Ensinai-nos a confiar na misericórdia divina e a buscar sempre uma vida de santidade, seguindo vosso exemplo de amor e fidelidade.

Amém.`
    },

    { type: "title", text: "Oração do Dia" },
    {
      type: "text",
      text: `Ó Mãe Santíssima, vossa intercessão junto a Deus é cheia de amor e poder.

Apresentai ao Senhor nossas necessidades, angústias e intenções mais profundas.

Alcançai-nos as graças que mais necessitamos para nossa vida e salvação.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
    },

    { type: "title", text: "Oração Final" },
    {
      type: "prayer",
      text: `Ó Maria concebida sem pecado, rogai por nós que recorremos a vós.

Ó Nossa Senhora das Graças, derramai sobre nós as graças de que necessitamos para viver na fé, na esperança e no amor.

Amém.`
    }
  ]
},
{
  novenaId: "novena_nossa_senhora_das_graças",
  day: 8,
  title: "Oitavo dia – Nossa Senhora das Graças, exemplo de amor e serviço",
  sections: [
    { type: "title", text: "Sinal da Cruz" },
    { type: "prayer", text: "Em nome do Pai, do Filho e do Espírito Santo. Amém." },

    { type: "title", text: "Oração Inicial" },
    {
      type: "prayer",
      text: `Ó Maria Santíssima, Mãe de Deus e nossa Mãe, que aparecestes a Santa Catarina Labouré como a Senhora das Graças, cheios de confiança recorremos a vós.

Vós pedistes que fosse cunhada a medalha que traz vossa imagem e prometestes grandes graças àqueles que a usassem com fé. Concedei-nos um coração aberto à ação de Deus, para que possamos acolher as graças que o Senhor deseja derramar sobre nós.

Ensinai-nos a confiar na misericórdia divina e a buscar sempre uma vida de santidade, seguindo vosso exemplo de amor e fidelidade.

Amém.`
    },

    { type: "title", text: "Oração do Dia" },
    {
      type: "text",
      text: `Ó Virgem Maria, vossa vida foi inteiramente dedicada ao amor e ao serviço de Deus e dos irmãos.

Ensinai-nos a viver a caridade, o perdão e a solidariedade no dia a dia.

Que sejamos instrumentos das graças de Deus na vida dos outros.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
    },

    { type: "title", text: "Oração Final" },
    {
      type: "prayer",
      text: `Ó Maria concebida sem pecado, rogai por nós que recorremos a vós.

Ó Nossa Senhora das Graças, derramai sobre nós as graças de que necessitamos para viver na fé, na esperança e no amor.

Amém.`
    }
  ]
},
{
  novenaId: "novena_nossa_senhora_das_graças",
  day: 9,
  title: "Nono dia – Nossa Senhora das Graças, Mãe e protetora",
  sections: [
    { type: "title", text: "Sinal da Cruz" },
    { type: "prayer", text: "Em nome do Pai, do Filho e do Espírito Santo. Amém." },

    { type: "title", text: "Oração Inicial" },
    {
      type: "prayer",
      text: `Ó Maria Santíssima, Mãe de Deus e nossa Mãe, que aparecestes a Santa Catarina Labouré como a Senhora das Graças, cheios de confiança recorremos a vós.

Vós pedistes que fosse cunhada a medalha que traz vossa imagem e prometestes grandes graças àqueles que a usassem com fé. Concedei-nos um coração aberto à ação de Deus, para que possamos acolher as graças que o Senhor deseja derramar sobre nós.

Ensinai-nos a confiar na misericórdia divina e a buscar sempre uma vida de santidade, seguindo vosso exemplo de amor e fidelidade.

Amém.`
    },

    { type: "title", text: "Oração do Dia" },
    {
      type: "text",
      text: `Ó Mãe querida, colocamos esta novena sob vossa proteção materna.

Recebei nossas orações e apresentai-as a Deus, para que sejamos atendidos conforme Sua santa vontade.

Consagrai-nos ao vosso coração e conduzi-nos sempre a Jesus.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
    },

    { type: "title", text: "Oração Final" },
    {
      type: "prayer",
      text: `Ó Maria concebida sem pecado, rogai por nós que recorremos a vós.

Ó Nossa Senhora das Graças, derramai sobre nós as graças de que necessitamos para viver na fé, na esperança e no amor.

Amém.`
    }
  ]
},

// ===== Novena de Natal =====
{
  novenaId: "novena_novena_de_natal",
  day: 1,
  title: "Primeiro dia – A esperança do povo de Deus",
  sections: [
    { type: "title", text: "Sinal da Cruz" },
    { type: "prayer", text: "Em nome do Pai, do Filho e do Espírito Santo. Amém." },

    { type: "title", text: "Oração Inicial" },
    {
      type: "prayer",
      text: `Ó Deus de amor e misericórdia, que preparastes o mundo para a vinda do vosso Filho Jesus, nós vos louvamos e bendizemos por tão grande mistério de salvação.

Ao nos aproximarmos do Natal do Senhor, concedei-nos a graça de viver este tempo com fé, esperança e amor, preparando não apenas nossas casas, mas principalmente nossos corações para acolher o Salvador.

Que esta novena nos ajude a crescer na confiança em Deus e no compromisso com o bem, seguindo o exemplo da Sagrada Família de Nazaré.

Amém.`
    },

    { type: "title", text: "Oração do dia" },
    {
      type: "text",
      text: `Durante séculos, o povo de Deus esperou a vinda do Messias prometido.

Neste primeiro dia da novena, pedimos a graça de renovar nossa esperança e confiança nas promessas do Senhor.

Que saibamos esperar com paciência e fé, certos de que Deus cumpre sempre Sua Palavra.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
    },

    { type: "title", text: "Oração Final" },
    {
      type: "prayer",
      text: `Ó Deus de infinita bondade, nós vos agradecemos pela vinda do vosso Filho Jesus ao mundo.

Concedei-nos viver o verdadeiro espírito do Natal, levando amor, esperança e paz a todos.

Que o nascimento do Salvador renove nossa fé e fortaleça nossa caminhada cristã.

Amém.`
    }
  ]
},
{
  novenaId: "novena_novena_de_natal",
  day: 2,
  title: "Segundo dia – A fé de Maria",
  sections: [
    { type: "title", text: "Sinal da Cruz" },
    { type: "prayer", text: "Em nome do Pai, do Filho e do Espírito Santo. Amém." },

    { type: "title", text: "Oração Inicial" },
    {
      type: "prayer",
      text: `Ó Deus de amor e misericórdia, que preparastes o mundo para a vinda do vosso Filho Jesus, nós vos louvamos e bendizemos por tão grande mistério de salvação.

Ao nos aproximarmos do Natal do Senhor, concedei-nos a graça de viver este tempo com fé, esperança e amor, preparando não apenas nossas casas, mas principalmente nossos corações para acolher o Salvador.

Que esta novena nos ajude a crescer na confiança em Deus e no compromisso com o bem, seguindo o exemplo da Sagrada Família de Nazaré.

Amém.`
    },

    { type: "title", text: "Oração do dia" },
    {
      type: "text",
      text: `Maria acolheu o anúncio do anjo com fé e disponibilidade, tornando-se a Mãe do Salvador.

Peçamos a graça de aprender com Maria a dizer sim a Deus, mesmo quando não compreendemos plenamente Seus desígnios.

Que nossa fé seja simples, profunda e perseverante.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
    },

    { type: "title", text: "Oração Final" },
    {
      type: "prayer",
      text: `Ó Deus de infinita bondade, nós vos agradecemos pela vinda do vosso Filho Jesus ao mundo.

Concedei-nos viver o verdadeiro espírito do Natal, levando amor, esperança e paz a todos.

Que o nascimento do Salvador renove nossa fé e fortaleça nossa caminhada cristã.

Amém.`
    }
  ]
},
{
  novenaId: "novena_novena_de_natal",
  day: 3,
  title: "Terceiro dia – A justiça de São José",
  sections: [
    { type: "title", text: "Sinal da Cruz" },
    { type: "prayer", text: "Em nome do Pai, do Filho e do Espírito Santo. Amém." },

    { type: "title", text: "Oração Inicial" },
    {
      type: "prayer",
      text: `Ó Deus de amor e misericórdia, que preparastes o mundo para a vinda do vosso Filho Jesus, nós vos louvamos e bendizemos por tão grande mistério de salvação.

Ao nos aproximarmos do Natal do Senhor, concedei-nos a graça de viver este tempo com fé, esperança e amor, preparando não apenas nossas casas, mas principalmente nossos corações para acolher o Salvador.

Que esta novena nos ajude a crescer na confiança em Deus e no compromisso com o bem, seguindo o exemplo da Sagrada Família de Nazaré.

Amém.`
    },

    { type: "title", text: "Oração do dia" },
    {
      type: "text",
      text: `São José foi homem justo e fiel, escolhido por Deus para cuidar de Maria e do Menino Jesus.

Peçamos sua intercessão para que sejamos pessoas íntegras, obedientes à vontade de Deus e comprometidas com o bem.

Que o exemplo de São José inspire nossas famílias.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
    },

    { type: "title", text: "Oração Final" },
    {
      type: "prayer",
      text: `Ó Deus de infinita bondade, nós vos agradecemos pela vinda do vosso Filho Jesus ao mundo.

Concedei-nos viver o verdadeiro espírito do Natal, levando amor, esperança e paz a todos.

Que o nascimento do Salvador renove nossa fé e fortaleça nossa caminhada cristã.

Amém.`
    }
  ]
},
{
  novenaId: "novena_novena_de_natal",
  day: 4,
  title: "Quarto dia – A caminhada até Belém",
  sections: [
    { type: "title", text: "Sinal da Cruz" },
    { type: "prayer", text: "Em nome do Pai, do Filho e do Espírito Santo. Amém." },

    { type: "title", text: "Oração Inicial" },
    {
      type: "prayer",
      text: `Ó Deus de amor e misericórdia, que preparastes o mundo para a vinda do vosso Filho Jesus, nós vos louvamos e bendizemos por tão grande mistério de salvação.

Ao nos aproximarmos do Natal do Senhor, concedei-nos a graça de viver este tempo com fé, esperança e amor, preparando não apenas nossas casas, mas principalmente nossos corações para acolher o Salvador.

Que esta novena nos ajude a crescer na confiança em Deus e no compromisso com o bem, seguindo o exemplo da Sagrada Família de Nazaré.

Amém.`
    },

    { type: "title", text: "Oração do dia" },
    {
      type: "text",
      text: `Maria e José enfrentaram dificuldades e incertezas até chegar a Belém.

Neste dia, rezamos por todos aqueles que passam por provações e não encontram acolhida.

Que saibamos reconhecer Cristo presente nos pobres e necessitados.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
    },

    { type: "title", text: "Oração Final" },
    {
      type: "prayer",
      text: `Ó Deus de infinita bondade, nós vos agradecemos pela vinda do vosso Filho Jesus ao mundo.

Concedei-nos viver o verdadeiro espírito do Natal, levando amor, esperança e paz a todos.

Que o nascimento do Salvador renove nossa fé e fortaleça nossa caminhada cristã.

Amém.`
    }
  ]
},
{
  novenaId: "novena_novena_de_natal",
  day: 5,
  title: "Quinto dia – O nascimento de Jesus",
  sections: [
    { type: "title", text: "Sinal da Cruz" },
    { type: "prayer", text: "Em nome do Pai, do Filho e do Espírito Santo. Amém." },

    { type: "title", text: "Oração Inicial" },
    {
      type: "prayer",
      text: `Ó Deus de amor e misericórdia, que preparastes o mundo para a vinda do vosso Filho Jesus, nós vos louvamos e bendizemos por tão grande mistério de salvação.

Ao nos aproximarmos do Natal do Senhor, concedei-nos a graça de viver este tempo com fé, esperança e amor, preparando não apenas nossas casas, mas principalmente nossos corações para acolher o Salvador.

Que esta novena nos ajude a crescer na confiança em Deus e no compromisso com o bem, seguindo o exemplo da Sagrada Família de Nazaré.

Amém.`
    },

    { type: "title", text: "Oração do dia" },
    {
      type: "text",
      text: `Jesus nasceu em uma gruta simples, mostrando ao mundo o valor da humildade.

Peçamos a graça de acolher o Salvador com simplicidade de coração, desapegados do orgulho e do excesso.

Que o nascimento de Jesus renove nossa vida e nossa fé.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
    },

    { type: "title", text: "Oração Final" },
    {
      type: "prayer",
      text: `Ó Deus de infinita bondade, nós vos agradecemos pela vinda do vosso Filho Jesus ao mundo.

Concedei-nos viver o verdadeiro espírito do Natal, levando amor, esperança e paz a todos.

Que o nascimento do Salvador renove nossa fé e fortaleça nossa caminhada cristã.

Amém.`
    }
  ]
},
{
  novenaId: "novena_novena_de_natal",
  day: 6,
  title: "Sexto dia – Os pastores adoram o Menino",
  sections: [
    { type: "title", text: "Sinal da Cruz" },
    { type: "prayer", text: "Em nome do Pai, do Filho e do Espírito Santo. Amém." },

    { type: "title", text: "Oração Inicial" },
    {
      type: "prayer",
      text: `Ó Deus de amor e misericórdia, que preparastes o mundo para a vinda do vosso Filho Jesus, nós vos louvamos e bendizemos por tão grande mistério de salvação.

Ao nos aproximarmos do Natal do Senhor, concedei-nos a graça de viver este tempo com fé, esperança e amor, preparando não apenas nossas casas, mas principalmente nossos corações para acolher o Salvador.

Que esta novena nos ajude a crescer na confiança em Deus e no compromisso com o bem, seguindo o exemplo da Sagrada Família de Nazaré.

Amém.`
    },

    { type: "title", text: "Oração do dia" },
    {
      type: "text",
      text: `Os pastores foram os primeiros a receber o anúncio do nascimento de Jesus.

Aprendamos com eles a reconhecer Deus nas coisas simples e a acolher com alegria a Boa-Nova.

Que nossos corações estejam sempre atentos à voz do Senhor.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
    },

    { type: "title", text: "Oração Final" },
    {
      type: "prayer",
      text: `Ó Deus de infinita bondade, nós vos agradecemos pela vinda do vosso Filho Jesus ao mundo.

Concedei-nos viver o verdadeiro espírito do Natal, levando amor, esperança e paz a todos.

Que o nascimento do Salvador renove nossa fé e fortaleça nossa caminhada cristã.

Amém.`
    }
  ]
},
{
  novenaId: "novena_novena_de_natal",
  day: 7,
  title: "Sétimo dia – Os Reis Magos buscam o Senhor",
  sections: [
    { type: "title", text: "Sinal da Cruz" },
    { type: "prayer", text: "Em nome do Pai, do Filho e do Espírito Santo. Amém." },

    { type: "title", text: "Oração Inicial" },
    {
      type: "prayer",
      text: `Ó Deus de amor e misericórdia, que preparastes o mundo para a vinda do vosso Filho Jesus, nós vos louvamos e bendizemos por tão grande mistério de salvação.

Ao nos aproximarmos do Natal do Senhor, concedei-nos a graça de viver este tempo com fé, esperança e amor, preparando não apenas nossas casas, mas principalmente nossos corações para acolher o Salvador.

Que esta novena nos ajude a crescer na confiança em Deus e no compromisso com o bem, seguindo o exemplo da Sagrada Família de Nazaré.

Amém.`
    },

    { type: "title", text: "Oração do dia" },
    {
      type: "text",
      text: `Guiados pela estrela, os Reis Magos partiram em busca do Menino Jesus.

Que também nós saibamos seguir os sinais que Deus coloca em nosso caminho.

Ofereçamos ao Senhor o melhor de nós mesmos, como dom de amor e fé.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
    },

    { type: "title", text: "Oração Final" },
    {
      type: "prayer",
      text: `Ó Deus de infinita bondade, nós vos agradecemos pela vinda do vosso Filho Jesus ao mundo.

Concedei-nos viver o verdadeiro espírito do Natal, levando amor, esperança e paz a todos.

Que o nascimento do Salvador renove nossa fé e fortaleça nossa caminhada cristã.

Amém.`
    }
  ]
},
{
  novenaId: "novena_novena_de_natal",
  day: 8,
  title: "Oitavo dia – A paz trazida por Cristo",
  sections: [
    { type: "title", text: "Sinal da Cruz" },
    { type: "prayer", text: "Em nome do Pai, do Filho e do Espírito Santo. Amém." },

    { type: "title", text: "Oração Inicial" },
    {
      type: "prayer",
      text: `Ó Deus de amor e misericórdia, que preparastes o mundo para a vinda do vosso Filho Jesus, nós vos louvamos e bendizemos por tão grande mistério de salvação.

Ao nos aproximarmos do Natal do Senhor, concedei-nos a graça de viver este tempo com fé, esperança e amor, preparando não apenas nossas casas, mas principalmente nossos corações para acolher o Salvador.

Que esta novena nos ajude a crescer na confiança em Deus e no compromisso com o bem, seguindo o exemplo da Sagrada Família de Nazaré.

Amém.`
    },

    { type: "title", text: "Oração do dia" },
    {
      type: "text",
      text: `O nascimento de Jesus trouxe ao mundo a paz prometida por Deus.

Rezemos para que essa paz reine em nossas famílias, comunidades e nações.

Que sejamos instrumentos da paz de Cristo no mundo.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
    },

    { type: "title", text: "Oração Final" },
    {
      type: "prayer",
      text: `Ó Deus de infinita bondade, nós vos agradecemos pela vinda do vosso Filho Jesus ao mundo.

Concedei-nos viver o verdadeiro espírito do Natal, levando amor, esperança e paz a todos.

Que o nascimento do Salvador renove nossa fé e fortaleça nossa caminhada cristã.

Amém.`
    }
  ]
},
{
  novenaId: "novena_novena_de_natal",
  day: 9,
  title: "Nono dia – Jesus, luz do mundo",
  sections: [
    { type: "title", text: "Sinal da Cruz" },
    { type: "prayer", text: "Em nome do Pai, do Filho e do Espírito Santo. Amém." },

    { type: "title", text: "Oração Inicial" },
    {
      type: "prayer",
      text: `Ó Deus de amor e misericórdia, que preparastes o mundo para a vinda do vosso Filho Jesus, nós vos louvamos e bendizemos por tão grande mistério de salvação.

Ao nos aproximarmos do Natal do Senhor, concedei-nos a graça de viver este tempo com fé, esperança e amor, preparando não apenas nossas casas, mas principalmente nossos corações para acolher o Salvador.

Que esta novena nos ajude a crescer na confiança em Deus e no compromisso com o bem, seguindo o exemplo da Sagrada Família de Nazaré.

Amém.`
    },

    { type: "title", text: "Oração do dia" },
    {
      type: "text",
      text: `Jesus é a luz que veio iluminar todos os povos.

Ao concluir esta novena, peçamos a graça de viver como filhos da luz, testemunhando o amor de Deus com nossas palavras e ações.

Que o Natal do Senhor transforme nossas vidas.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
    },

    { type: "title", text: "Oração Final" },
    {
      type: "prayer",
      text: `Ó Deus de infinita bondade, nós vos agradecemos pela vinda do vosso Filho Jesus ao mundo.

Concedei-nos viver o verdadeiro espírito do Natal, levando amor, esperança e paz a todos.

Que o nascimento do Salvador renove nossa fé e fortaleça nossa caminhada cristã.

Amém.`
    }
  ]
},

// ===== Novena a Santa Maria, Mãe de Deus =====
{
  novenaId: "novena_santa_maria_mae_de_deus",
  day: 1,
  title: "Primeiro dia – Maria, Mãe escolhida por Deus",
  sections: [
    { type: "title", text: "Sinal da Cruz" },
    { type: "prayer", text: "Em nome do Pai, do Filho e do Espírito Santo. Amém." },

    { type: "title", text: "Oração Inicial" },
    {
      type: "prayer",
      text: `Ó Santa Maria, Mãe de Deus e nossa Mãe, escolhida pelo Pai para trazer ao mundo o Salvador, com confiança recorremos a vós.

Vós aceitastes com fé e humildade o mistério da Encarnação, tornando-vos verdadeira Mãe do Filho de Deus. Ajudai-nos a acolher Jesus em nossa vida e a viver segundo a vontade do Senhor.

Concedei-nos a graça de rezar esta novena com devoção sincera, para que, por vossa intercessão materna, possamos alcançar as graças que necessitamos, se forem da vontade de Deus.

Amém.`
    },

    { type: "title", text: "Oração do dia" },
    {
      type: "text",
      text: `Ó Santa Maria, Mãe de Deus, fostes escolhida desde toda a eternidade para ser a Mãe do Salvador.

Vosso sim permitiu que o Verbo se fizesse carne e habitasse entre nós.

Ajudai-nos a reconhecer o chamado de Deus em nossa vida e a responder com confiança e generosidade.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
    },

    { type: "title", text: "Oração Final" },
    {
      type: "prayer",
      text: `Ó Santa Maria, Mãe de Deus, rogai por nós que recorremos a vós.

Ajudai-nos a viver como verdadeiros filhos de Deus, seguindo vosso exemplo de fé, humildade e amor.

Amém.`
    }
  ]
},
{
  novenaId: "novena_santa_maria_mae_de_deus",
  day: 2,
  title: "Segundo dia – Maria, Mãe da fé",
  sections: [
    { type: "title", text: "Sinal da Cruz" },
    { type: "prayer", text: "Em nome do Pai, do Filho e do Espírito Santo. Amém." },

    { type: "title", text: "Oração Inicial" },
    {
      type: "prayer",
      text: `Ó Santa Maria, Mãe de Deus e nossa Mãe, escolhida pelo Pai para trazer ao mundo o Salvador, com confiança recorremos a vós.

Vós aceitastes com fé e humildade o mistério da Encarnação, tornando-vos verdadeira Mãe do Filho de Deus. Ajudai-nos a acolher Jesus em nossa vida e a viver segundo a vontade do Senhor.

Concedei-nos a graça de rezar esta novena com devoção sincera, para que, por vossa intercessão materna, possamos alcançar as graças que necessitamos, se forem da vontade de Deus.

Amém.`
    },

    { type: "title", text: "Oração do dia" },
    {
      type: "text",
      text: `Ó Maria Santíssima, acreditastes plenamente na Palavra do Senhor.

Mesmo sem compreender tudo, confiastes nas promessas de Deus e entregastes vossa vida a Ele.

Fortalecei nossa fé, para que saibamos confiar em Deus em todos os momentos.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
    },

    { type: "title", text: "Oração Final" },
    {
      type: "prayer",
      text: `Ó Santa Maria, Mãe de Deus, rogai por nós que recorremos a vós.

Ajudai-nos a viver como verdadeiros filhos de Deus, seguindo vosso exemplo de fé, humildade e amor.

Amém.`
    }
  ]
},
{
  novenaId: "novena_santa_maria_mae_de_deus",
  day: 3,
  title: "Terceiro dia – Maria, Mãe humilde e obediente",
  sections: [
    { type: "title", text: "Sinal da Cruz" },
    { type: "prayer", text: "Em nome do Pai, do Filho e do Espírito Santo. Amém." },

    { type: "title", text: "Oração Inicial" },
    {
      type: "prayer",
      text: `Ó Santa Maria, Mãe de Deus e nossa Mãe, escolhida pelo Pai para trazer ao mundo o Salvador, com confiança recorremos a vós.

Vós aceitastes com fé e humildade o mistério da Encarnação, tornando-vos verdadeira Mãe do Filho de Deus. Ajudai-nos a acolher Jesus em nossa vida e a viver segundo a vontade do Senhor.

Concedei-nos a graça de rezar esta novena com devoção sincera, para que, por vossa intercessão materna, possamos alcançar as graças que necessitamos, se forem da vontade de Deus.

Amém.`
    },

    { type: "title", text: "Oração do dia" },
    {
      type: "text",
      text: `Ó Mãe de Deus, vossa humildade agradou ao Senhor e vossa obediência realizou Seu plano de salvação.

Ensinai-nos a viver com humildade, afastando de nós o orgulho e a vaidade.

Que aprendamos a obedecer à vontade de Deus com amor e fidelidade.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
    },

    { type: "title", text: "Oração Final" },
    {
      type: "prayer",
      text: `Ó Santa Maria, Mãe de Deus, rogai por nós que recorremos a vós.

Ajudai-nos a viver como verdadeiros filhos de Deus, seguindo vosso exemplo de fé, humildade e amor.

Amém.`
    }
  ]
},
{
  novenaId: "novena_santa_maria_mae_de_deus",
  day: 4,
  title: "Quarto dia – Maria, Mãe do Salvador",
  sections: [
    { type: "title", text: "Sinal da Cruz" },
    { type: "prayer", text: "Em nome do Pai, do Filho e do Espírito Santo. Amém." },

    { type: "title", text: "Oração Inicial" },
    {
      type: "prayer",
      text: `Ó Santa Maria, Mãe de Deus e nossa Mãe, escolhida pelo Pai para trazer ao mundo o Salvador, com confiança recorremos a vós.

Vós aceitastes com fé e humildade o mistério da Encarnação, tornando-vos verdadeira Mãe do Filho de Deus. Ajudai-nos a acolher Jesus em nossa vida e a viver segundo a vontade do Senhor.

Concedei-nos a graça de rezar esta novena com devoção sincera, para que, por vossa intercessão materna, possamos alcançar as graças que necessitamos, se forem da vontade de Deus.

Amém.`
    },

    { type: "title", text: "Oração do dia" },
    {
      type: "text",
      text: `Ó Santa Maria, em vosso ventre o Filho de Deus se fez homem para nossa salvação.

Ajudai-nos a acolher Jesus como centro de nossa vida e a seguir Seus ensinamentos.

Conduzi-nos sempre para mais perto de vosso Filho, nosso Senhor.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
    },

    { type: "title", text: "Oração Final" },
    {
      type: "prayer",
      text: `Ó Santa Maria, Mãe de Deus, rogai por nós que recorremos a vós.

Ajudai-nos a viver como verdadeiros filhos de Deus, seguindo vosso exemplo de fé, humildade e amor.

Amém.`
    }
  ]
},
{
  novenaId: "novena_santa_maria_mae_de_deus",
  day: 5,
  title: "Quinto dia – Maria, Mãe de misericórdia",
  sections: [
    { type: "title", text: "Sinal da Cruz" },
    { type: "prayer", text: "Em nome do Pai, do Filho e do Espírito Santo. Amém." },

    { type: "title", text: "Oração Inicial" },
    {
      type: "prayer",
      text: `Ó Santa Maria, Mãe de Deus e nossa Mãe, escolhida pelo Pai para trazer ao mundo o Salvador, com confiança recorremos a vós.

Vós aceitastes com fé e humildade o mistério da Encarnação, tornando-vos verdadeira Mãe do Filho de Deus. Ajudai-nos a acolher Jesus em nossa vida e a viver segundo a vontade do Senhor.

Concedei-nos a graça de rezar esta novena com devoção sincera, para que, por vossa intercessão materna, possamos alcançar as graças que necessitamos, se forem da vontade de Deus.

Amém.`
    },

    { type: "title", text: "Oração do dia" },
    {
      type: "text",
      text: `Ó Mãe cheia de ternura, vós acompanheis vossos filhos em suas dores e sofrimentos.

Intercedei por todos os que passam por dificuldades, angústias e provações.

Alcançai-nos a graça da confiança na misericórdia de Deus.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
    },

    { type: "title", text: "Oração Final" },
    {
      type: "prayer",
      text: `Ó Santa Maria, Mãe de Deus, rogai por nós que recorremos a vós.

Ajudai-nos a viver como verdadeiros filhos de Deus, seguindo vosso exemplo de fé, humildade e amor.

Amém.`
    }
  ]
},
{
  novenaId: "novena_santa_maria_mae_de_deus",
  day: 6,
  title: "Sexto dia – Maria, Mãe da Igreja",
  sections: [
    { type: "title", text: "Sinal da Cruz" },
    { type: "prayer", text: "Em nome do Pai, do Filho e do Espírito Santo. Amém." },

    { type: "title", text: "Oração Inicial" },
    {
      type: "prayer",
      text: `Ó Santa Maria, Mãe de Deus e nossa Mãe, escolhida pelo Pai para trazer ao mundo o Salvador, com confiança recorremos a vós.

Vós aceitastes com fé e humildade o mistério da Encarnação, tornando-vos verdadeira Mãe do Filho de Deus. Ajudai-nos a acolher Jesus em nossa vida e a viver segundo a vontade do Senhor.

Concedei-nos a graça de rezar esta novena com devoção sincera, para que, por vossa intercessão materna, possamos alcançar as graças que necessitamos, se forem da vontade de Deus.

Amém.`
    },

    { type: "title", text: "Oração do dia" },
    {
      type: "text",
      text: `Ó Santa Maria, Mãe de Deus, estivestes presente com os apóstolos, sustentando-os na fé e na oração.

Ajudai-nos a amar a Igreja e a viver unidos como irmãos em Cristo.

Intercedei por todos os pastores e fiéis, para que permaneçam firmes na fé.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
    },

    { type: "title", text: "Oração Final" },
    {
      type: "prayer",
      text: `Ó Santa Maria, Mãe de Deus, rogai por nós que recorremos a vós.

Ajudai-nos a viver como verdadeiros filhos de Deus, seguindo vosso exemplo de fé, humildade e amor.

Amém.`
    }
  ]
},
{
  novenaId: "novena_santa_maria_mae_de_deus",
  day: 7,
  title: "Sétimo dia – Maria, Mãe e intercessora",
  sections: [
    { type: "title", text: "Sinal da Cruz" },
    { type: "prayer", text: "Em nome do Pai, do Filho e do Espírito Santo. Amém." },

    { type: "title", text: "Oração Inicial" },
    {
      type: "prayer",
      text: `Ó Santa Maria, Mãe de Deus e nossa Mãe, escolhida pelo Pai para trazer ao mundo o Salvador, com confiança recorremos a vós.

Vós aceitastes com fé e humildade o mistério da Encarnação, tornando-vos verdadeira Mãe do Filho de Deus. Ajudai-nos a acolher Jesus em nossa vida e a viver segundo a vontade do Senhor.

Concedei-nos a graça de rezar esta novena com devoção sincera, para que, por vossa intercessão materna, possamos alcançar as graças que necessitamos, se forem da vontade de Deus.

Amém.`
    },

    { type: "title", text: "Oração do dia" },
    {
      type: "text",
      text: `Ó Mãe Santíssima, vós intercedeis continuamente por nós junto a vosso Filho Jesus.

Apresentai a Deus nossas súplicas, necessidades e intenções mais profundas.

Confiamos em vossa intercessão materna e em vosso amor por nós.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
    },

    { type: "title", text: "Oração Final" },
    {
      type: "prayer",
      text: `Ó Santa Maria, Mãe de Deus, rogai por nós que recorremos a vós.

Ajudai-nos a viver como verdadeiros filhos de Deus, seguindo vosso exemplo de fé, humildade e amor.

Amém.`
    }
  ]
},
{
  novenaId: "novena_santa_maria_mae_de_deus",
  day: 8,
  title: "Oitavo dia – Maria, Mãe da esperança",
  sections: [
    { type: "title", text: "Sinal da Cruz" },
    { type: "prayer", text: "Em nome do Pai, do Filho e do Espírito Santo. Amém." },

    { type: "title", text: "Oração Inicial" },
    {
      type: "prayer",
      text: `Ó Santa Maria, Mãe de Deus e nossa Mãe, escolhida pelo Pai para trazer ao mundo o Salvador, com confiança recorremos a vós.

Vós aceitastes com fé e humildade o mistério da Encarnação, tornando-vos verdadeira Mãe do Filho de Deus. Ajudai-nos a acolher Jesus em nossa vida e a viver segundo a vontade do Senhor.

Concedei-nos a graça de rezar esta novena com devoção sincera, para que, por vossa intercessão materna, possamos alcançar as graças que necessitamos, se forem da vontade de Deus.

Amém.`
    },

    { type: "title", text: "Oração do dia" },
    {
      type: "text",
      text: `Ó Santa Maria, Mãe de Deus, em vós encontramos esperança e consolo.

Ajudai-nos a não desanimar diante das dificuldades da vida, mas a confiar sempre no Senhor.

Renovai nossa esperança e fortalecei nossa caminhada cristã.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
    },

    { type: "title", text: "Oração Final" },
    {
      type: "prayer",
      text: `Ó Santa Maria, Mãe de Deus, rogai por nós que recorremos a vós.

Ajudai-nos a viver como verdadeiros filhos de Deus, seguindo vosso exemplo de fé, humildade e amor.

Amém.`
    }
  ]
},
{
  novenaId: "novena_santa_maria_mae_de_deus",
  day: 9,
  title: "Nono dia – Maria, Mãe e protetora dos filhos de Deus",
  sections: [
    { type: "title", text: "Sinal da Cruz" },
    { type: "prayer", text: "Em nome do Pai, do Filho e do Espírito Santo. Amém." },

    { type: "title", text: "Oração Inicial" },
    {
      type: "prayer",
      text: `Ó Santa Maria, Mãe de Deus e nossa Mãe, escolhida pelo Pai para trazer ao mundo o Salvador, com confiança recorremos a vós.

Vós aceitastes com fé e humildade o mistério da Encarnação, tornando-vos verdadeira Mãe do Filho de Deus. Ajudai-nos a acolher Jesus em nossa vida e a viver segundo a vontade do Senhor.

Concedei-nos a graça de rezar esta novena com devoção sincera, para que, por vossa intercessão materna, possamos alcançar as graças que necessitamos, se forem da vontade de Deus.

Amém.`
    },

    { type: "title", text: "Oração do dia" },
    {
      type: "text",
      text: `Ó Mãe querida, acolhei esta novena que rezamos com fé e devoção.

Protegei-nos sob vosso manto e conduzi-nos sempre no caminho do bem.

Consagrai-nos ao vosso cuidado materno e levai-nos sempre a Jesus.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
    },

    { type: "title", text: "Oração Final" },
    {
      type: "prayer",
      text: `Ó Santa Maria, Mãe de Deus, rogai por nós que recorremos a vós.

Ajudai-nos a viver como verdadeiros filhos de Deus, seguindo vosso exemplo de fé, humildade e amor.

Amém.`
    }
  ]
},
// ===== Novena da Epifania =====
{
  novenaId: "novena_epifania",
  day: 1,
  title: "Primeiro dia – A luz de Cristo se manifesta ao mundo",
  sections: [
    { type: "title", text: "Sinal da Cruz" },
    { type: "prayer", text: "Em nome do Pai, do Filho e do Espírito Santo. Amém." },

    { type: "title", text: "Oração Inicial" },
    {
      type: "prayer",
      text: `Ó Deus eterno e todo-poderoso, que na Epifania revelastes vosso Filho Jesus como Salvador de todos os povos, nós vos louvamos e bendizemos por tão grande mistério.

Assim como guiastes os Reis Magos pela estrela até o Menino Jesus, conduzi também nossos passos no caminho da fé, para que possamos reconhecer Cristo como luz do mundo e Senhor de nossas vidas.

Concedei-nos a graça de rezar esta novena com fé sincera, para que, iluminados por Cristo, vivamos segundo vossa vontade.

Amém.`
    },

    { type: "title", text: "Oração do dia" },
    {
      type: "text",
      text: `Na Epifania, Jesus se manifesta como luz para todos os povos.

A estrela que guiou os Reis Magos é sinal de que Deus conduz aqueles que O procuram com coração sincero.

Peçamos a graça de reconhecer a presença de Deus em nossa vida e de seguir Sua luz com fidelidade.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
    },

    { type: "title", text: "Oração Final" },
    {
      type: "prayer",
      text: `Ó Deus de luz e amor, que revelastes vosso Filho Jesus como Salvador de todos os povos, nós vos agradecemos por este mistério de fé.

Concedei-nos viver iluminados por Cristo, seguindo Sua luz e anunciando Seu amor ao mundo.

Amém.`
    }
  ]
},
{
  novenaId: "novena_epifania",
  day: 2,
  title: "Segundo dia – Os Reis Magos buscam o Senhor",
  sections: [
    { type: "title", text: "Sinal da Cruz" },
    { type: "prayer", text: "Em nome do Pai, do Filho e do Espírito Santo. Amém." },

    { type: "title", text: "Oração Inicial" },
    {
      type: "prayer",
      text: `Ó Deus eterno e todo-poderoso, que na Epifania revelastes vosso Filho Jesus como Salvador de todos os povos, nós vos louvamos e bendizemos por tão grande mistério.

Assim como guiastes os Reis Magos pela estrela até o Menino Jesus, conduzi também nossos passos no caminho da fé, para que possamos reconhecer Cristo como luz do mundo e Senhor de nossas vidas.

Concedei-nos a graça de rezar esta novena com fé sincera, para que, iluminados por Cristo, vivamos segundo vossa vontade.

Amém.`
    },

    { type: "title", text: "Oração do dia" },
    {
      type: "text",
      text: `Os Reis Magos partiram de terras distantes em busca do Rei recém-nascido.

Ensinai-nos, Senhor, a ter um coração disposto a buscar a verdade, mesmo quando o caminho é longo e exigente.

Que jamais nos acomodemos, mas avancemos sempre na fé.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
    },

    { type: "title", text: "Oração Final" },
    {
      type: "prayer",
      text: `Ó Deus de luz e amor, que revelastes vosso Filho Jesus como Salvador de todos os povos, nós vos agradecemos por este mistério de fé.

Concedei-nos viver iluminados por Cristo, seguindo Sua luz e anunciando Seu amor ao mundo.

Amém.`
    }
  ]
},
{
  novenaId: "novena_epifania",
  day: 3,
  title: "Terceiro dia – A fé que move os passos",
  sections: [
    { type: "title", text: "Sinal da Cruz" },
    { type: "prayer", text: "Em nome do Pai, do Filho e do Espírito Santo. Amém." },

    { type: "title", text: "Oração Inicial" },
    {
      type: "prayer",
      text: `Ó Deus eterno e todo-poderoso, que na Epifania revelastes vosso Filho Jesus como Salvador de todos os povos, nós vos louvamos e bendizemos por tão grande mistério.

Assim como guiastes os Reis Magos pela estrela até o Menino Jesus, conduzi também nossos passos no caminho da fé, para que possamos reconhecer Cristo como luz do mundo e Senhor de nossas vidas.

Concedei-nos a graça de rezar esta novena com fé sincera, para que, iluminados por Cristo, vivamos segundo vossa vontade.

Amém.`
    },

    { type: "title", text: "Oração do dia" },
    {
      type: "text",
      text: `Guiados pela estrela, os Magos confiaram nos sinais de Deus.

Peçamos a graça de uma fé viva, que nos conduza nas decisões do dia a dia.

Que saibamos escutar a voz de Deus e responder com prontidão.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
    },

    { type: "title", text: "Oração Final" },
    {
      type: "prayer",
      text: `Ó Deus de luz e amor, que revelastes vosso Filho Jesus como Salvador de todos os povos, nós vos agradecemos por este mistério de fé.

Concedei-nos viver iluminados por Cristo, seguindo Sua luz e anunciando Seu amor ao mundo.

Amém.`
    }
  ]
},
{
  novenaId: "novena_epifania",
  day: 4,
  title: "Quarto dia – A adoração do Menino Jesus",
  sections: [
    { type: "title", text: "Sinal da Cruz" },
    { type: "prayer", text: "Em nome do Pai, do Filho e do Espírito Santo. Amém." },

    { type: "title", text: "Oração Inicial" },
    {
      type: "prayer",
      text: `Ó Deus eterno e todo-poderoso, que na Epifania revelastes vosso Filho Jesus como Salvador de todos os povos, nós vos louvamos e bendizemos por tão grande mistério.

Assim como guiastes os Reis Magos pela estrela até o Menino Jesus, conduzi também nossos passos no caminho da fé, para que possamos reconhecer Cristo como luz do mundo e Senhor de nossas vidas.

Concedei-nos a graça de rezar esta novena com fé sincera, para que, iluminados por Cristo, vivamos segundo vossa vontade.

Amém.`
    },

    { type: "title", text: "Oração do dia" },
    {
      type: "text",
      text: `Ao encontrarem o Menino, os Magos O adoraram.

Reconheceram em Jesus o verdadeiro Rei e Salvador.

Ajudai-nos a adorar a Cristo com humildade e devoção, colocando-O no centro de nossa vida.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
    },

    { type: "title", text: "Oração Final" },
    {
      type: "prayer",
      text: `Ó Deus de luz e amor, que revelastes vosso Filho Jesus como Salvador de todos os povos, nós vos agradecemos por este mistério de fé.

Concedei-nos viver iluminados por Cristo, seguindo Sua luz e anunciando Seu amor ao mundo.

Amém.`
    }
  ]
},
{
  novenaId: "novena_epifania",
  day: 5,
  title: "Quinto dia – Os dons oferecidos ao Senhor",
  sections: [
    { type: "title", text: "Sinal da Cruz" },
    { type: "prayer", text: "Em nome do Pai, do Filho e do Espírito Santo. Amém." },

    { type: "title", text: "Oração Inicial" },
    {
      type: "prayer",
      text: `Ó Deus eterno e todo-poderoso, que na Epifania revelastes vosso Filho Jesus como Salvador de todos os povos, nós vos louvamos e bendizemos por tão grande mistério.

Assim como guiastes os Reis Magos pela estrela até o Menino Jesus, conduzi também nossos passos no caminho da fé, para que possamos reconhecer Cristo como luz do mundo e Senhor de nossas vidas.

Concedei-nos a graça de rezar esta novena com fé sincera, para que, iluminados por Cristo, vivamos segundo vossa vontade.

Amém.`
    },

    { type: "title", text: "Oração do dia" },
    {
      type: "text",
      text: `Ouro, incenso e mirra foram oferecidos ao Menino Jesus como sinais de fé e entrega.

Que também nós saibamos oferecer ao Senhor o melhor de nossa vida, nosso amor, nosso tempo e nossas ações.

Ajudai-nos a viver como verdadeira oferta a Deus.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
    },

    { type: "title", text: "Oração Final" },
    {
      type: "prayer",
      text: `Ó Deus de luz e amor, que revelastes vosso Filho Jesus como Salvador de todos os povos, nós vos agradecemos por este mistério de fé.

Concedei-nos viver iluminados por Cristo, seguindo Sua luz e anunciando Seu amor ao mundo.

Amém.`
    }
  ]
},
{
  novenaId: "novena_epifania",
  day: 6,
  title: "Sexto dia – Cristo, Rei de todos os povos",
  sections: [
    { type: "title", text: "Sinal da Cruz" },
    { type: "prayer", text: "Em nome do Pai, do Filho e do Espírito Santo. Amém." },

    { type: "title", text: "Oração Inicial" },
    {
      type: "prayer",
      text: `Ó Deus eterno e todo-poderoso, que na Epifania revelastes vosso Filho Jesus como Salvador de todos os povos, nós vos louvamos e bendizemos por tão grande mistério.

Assim como guiastes os Reis Magos pela estrela até o Menino Jesus, conduzi também nossos passos no caminho da fé, para que possamos reconhecer Cristo como luz do mundo e Senhor de nossas vidas.

Concedei-nos a graça de rezar esta novena com fé sincera, para que, iluminados por Cristo, vivamos segundo vossa vontade.

Amém.`
    },

    { type: "title", text: "Oração do dia" },
    {
      type: "text",
      text: `Na Epifania, Jesus se revela como Rei universal, enviado para todos.

Que nosso coração esteja aberto para acolher Cristo e anunciar Seu amor a todos, sem distinção.

Fazei-nos instrumentos de unidade e paz.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
    },

    { type: "title", text: "Oração Final" },
    {
      type: "prayer",
      text: `Ó Deus de luz e amor, que revelastes vosso Filho Jesus como Salvador de todos os povos, nós vos agradecemos por este mistério de fé.

Concedei-nos viver iluminados por Cristo, seguindo Sua luz e anunciando Seu amor ao mundo.

Amém.`
    }
  ]
},
{
  novenaId: "novena_epifania",
  day: 7,
  title: "Sétimo dia – O retorno por outro caminho",
  sections: [
    { type: "title", text: "Sinal da Cruz" },
    { type: "prayer", text: "Em nome do Pai, do Filho e do Espírito Santo. Amém." },

    { type: "title", text: "Oração Inicial" },
    {
      type: "prayer",
      text: `Ó Deus eterno e todo-poderoso, que na Epifania revelastes vosso Filho Jesus como Salvador de todos os povos, nós vos louvamos e bendizemos por tão grande mistério.

Assim como guiastes os Reis Magos pela estrela até o Menino Jesus, conduzi também nossos passos no caminho da fé, para que possamos reconhecer Cristo como luz do mundo e Senhor de nossas vidas.

Concedei-nos a graça de rezar esta novena com fé sincera, para que, iluminados por Cristo, vivamos segundo vossa vontade.

Amém.`
    },

    { type: "title", text: "Oração do dia" },
    {
      type: "text",
      text: `Após encontrarem Jesus, os Magos retornaram por outro caminho.

O encontro com Cristo transforma nossa vida e nos chama à conversão.

Concedei-nos a graça de mudar o que precisa ser mudado e seguir o caminho do bem.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
    },

    { type: "title", text: "Oração Final" },
    {
      type: "prayer",
      text: `Ó Deus de luz e amor, que revelastes vosso Filho Jesus como Salvador de todos os povos, nós vos agradecemos por este mistério de fé.

Concedei-nos viver iluminados por Cristo, seguindo Sua luz e anunciando Seu amor ao mundo.

Amém.`
    }
  ]
},
{
  novenaId: "novena_epifania",
  day: 8,
  title: "Oitavo dia – Jesus, estrela que nos guia",
  sections: [
    { type: "title", text: "Sinal da Cruz" },
    { type: "prayer", text: "Em nome do Pai, do Filho e do Espírito Santo. Amém." },

    { type: "title", text: "Oração Inicial" },
    {
      type: "prayer",
      text: `Ó Deus eterno e todo-poderoso, que na Epifania revelastes vosso Filho Jesus como Salvador de todos os povos, nós vos louvamos e bendizemos por tão grande mistério.

Assim como guiastes os Reis Magos pela estrela até o Menino Jesus, conduzi também nossos passos no caminho da fé, para que possamos reconhecer Cristo como luz do mundo e Senhor de nossas vidas.

Concedei-nos a graça de rezar esta novena com fé sincera, para que, iluminados por Cristo, vivamos segundo vossa vontade.

Amém.`
    },

    { type: "title", text: "Oração do dia" },
    {
      type: "text",
      text: `Cristo é a estrela que ilumina nosso caminho e dissipa as trevas.

Ajudai-nos a confiar em Sua luz, mesmo nos momentos de incerteza e dificuldade.

Que nunca percamos de vista a luz do Senhor.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
    },

    { type: "title", text: "Oração Final" },
    {
      type: "prayer",
      text: `Ó Deus de luz e amor, que revelastes vosso Filho Jesus como Salvador de todos os povos, nós vos agradecemos por este mistério de fé.

Concedei-nos viver iluminados por Cristo, seguindo Sua luz e anunciando Seu amor ao mundo.

Amém.`
    }
  ]
},
{
  novenaId: "novena_epifania",
  day: 9,
  title: "Nono dia – Testemunhas da luz de Cristo",
  sections: [
    { type: "title", text: "Sinal da Cruz" },
    { type: "prayer", text: "Em nome do Pai, do Filho e do Espírito Santo. Amém." },

    { type: "title", text: "Oração Inicial" },
    {
      type: "prayer",
      text: `Ó Deus eterno e todo-poderoso, que na Epifania revelastes vosso Filho Jesus como Salvador de todos os povos, nós vos louvamos e bendizemos por tão grande mistério.

Assim como guiastes os Reis Magos pela estrela até o Menino Jesus, conduzi também nossos passos no caminho da fé, para que possamos reconhecer Cristo como luz do mundo e Senhor de nossas vidas.

Concedei-nos a graça de rezar esta novena com fé sincera, para que, iluminados por Cristo, vivamos segundo vossa vontade.

Amém.`
    },

    { type: "title", text: "Oração do dia" },
    {
      type: "text",
      text: `Ao concluir esta novena, peçamos a graça de sermos testemunhas da luz de Cristo no mundo.

Que nossa vida revele a presença de Deus por meio do amor, da fé e das boas obras.

Conduzi-nos sempre no caminho da salvação.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
    },

    { type: "title", text: "Oração Final" },
    {
      type: "prayer",
      text: `Ó Deus de luz e amor, que revelastes vosso Filho Jesus como Salvador de todos os povos, nós vos agradecemos por este mistério de fé.

Concedei-nos viver iluminados por Cristo, seguindo Sua luz e anunciando Seu amor ao mundo.

Amém.`
    }
  ]
},
// ===== Novena a São Sebastião =====
{
  novenaId: "novena_sao_sebastiao",
  day: 1,
  title: "Primeiro dia – São Sebastião, testemunha da fé",
  sections: [
    { type: "title", text: "Sinal da Cruz" },
    { type: "prayer", text: "Em nome do Pai, do Filho e do Espírito Santo. Amém." },

    { type: "title", text: "Oração Inicial" },
    {
      type: "prayer",
      text: `Ó glorioso São Sebastião, fiel servo de Deus e valente testemunha da fé cristã, com confiança recorremos à vossa poderosa intercessão.

Vós que permanecestes firmes na fé mesmo diante da perseguição e do martírio, ajudai-nos a viver com coragem, fidelidade e amor ao Evangelho.

Concedei-nos a graça de rezar esta novena com fé sincera, para que, por vossa intercessão, possamos alcançar as graças que necessitamos, se forem da vontade de Deus.

Amém.`
    },

    { type: "title", text: "Oração do dia" },
    {
      type: "text",
      text: `Ó São Sebastião, desde o início de vossa vida cristã, testemunhastes com firmeza a fé em Jesus Cristo.

Ensinai-nos a professar nossa fé com coragem, mesmo diante das dificuldades e perseguições.

Que jamais tenhamos vergonha do Evangelho.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
    },

    { type: "title", text: "Oração Final" },
    {
      type: "prayer",
      text: `Ó São Sebastião, glorioso mártir e fiel servo de Deus, rogai por nós.

Ajudai-nos a viver com fé, coragem e fidelidade ao Evangelho de Jesus Cristo.

Amém.`
    }
  ]
},
{
  novenaId: "novena_sao_sebastiao",
  day: 2,
  title: "Segundo dia – São Sebastião, soldado de Cristo",
  sections: [
    { type: "title", text: "Sinal da Cruz" },
    { type: "prayer", text: "Em nome do Pai, do Filho e do Espírito Santo. Amém." },

    { type: "title", text: "Oração Inicial" },
    {
      type: "prayer",
      text: `Ó glorioso São Sebastião, fiel servo de Deus e valente testemunha da fé cristã, com confiança recorremos à vossa poderosa intercessão.

Vós que permanecestes firmes na fé mesmo diante da perseguição e do martírio, ajudai-nos a viver com coragem, fidelidade e amor ao Evangelho.

Concedei-nos a graça de rezar esta novena com fé sincera, para que, por vossa intercessão, possamos alcançar as graças que necessitamos, se forem da vontade de Deus.

Amém.`
    },

    { type: "title", text: "Oração do dia" },
    {
      type: "text",
      text: `Ó São Sebastião, servistes como soldado terreno, mas escolhestes ser fiel soldado de Cristo.

Ajudai-nos a lutar contra o mal, permanecendo firmes na fé e na verdade.

Que nossa vida seja um combate constante pelo bem.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
    },

    { type: "title", text: "Oração Final" },
    {
      type: "prayer",
      text: `Ó São Sebastião, glorioso mártir e fiel servo de Deus, rogai por nós.

Ajudai-nos a viver com fé, coragem e fidelidade ao Evangelho de Jesus Cristo.

Amém.`
    }
  ]
},
{
  novenaId: "novena_sao_sebastiao",
  day: 3,
  title: "Terceiro dia – São Sebastião, exemplo de coragem",
  sections: [
    { type: "title", text: "Sinal da Cruz" },
    { type: "prayer", text: "Em nome do Pai, do Filho e do Espírito Santo. Amém." },

    { type: "title", text: "Oração Inicial" },
    {
      type: "prayer",
      text: `Ó glorioso São Sebastião, fiel servo de Deus e valente testemunha da fé cristã, com confiança recorremos à vossa poderosa intercessão.

Vós que permanecestes firmes na fé mesmo diante da perseguição e do martírio, ajudai-nos a viver com coragem, fidelidade e amor ao Evangelho.

Concedei-nos a graça de rezar esta novena com fé sincera, para que, por vossa intercessão, possamos alcançar as graças que necessitamos, se forem da vontade de Deus.

Amém.`
    },

    { type: "title", text: "Oração do dia" },
    {
      type: "text",
      text: `Ó São Sebastião, enfrentastes o sofrimento e a morte com coragem e confiança em Deus.

Fortalecei-nos nos momentos de medo e provação, para que não desanimemos diante das dificuldades.

Que nossa confiança esteja sempre no Senhor.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
    },

    { type: "title", text: "Oração Final" },
    {
      type: "prayer",
      text: `Ó São Sebastião, glorioso mártir e fiel servo de Deus, rogai por nós.

Ajudai-nos a viver com fé, coragem e fidelidade ao Evangelho de Jesus Cristo.

Amém.`
    }
  ]
},
{
  novenaId: "novena_sao_sebastiao",
  day: 4,
  title: "Quarto dia – São Sebastião, defensor dos perseguidos",
  sections: [
    { type: "title", text: "Sinal da Cruz" },
    { type: "prayer", text: "Em nome do Pai, do Filho e do Espírito Santo. Amém." },

    { type: "title", text: "Oração Inicial" },
    {
      type: "prayer",
      text: `Ó glorioso São Sebastião, fiel servo de Deus e valente testemunha da fé cristã, com confiança recorremos à vossa poderosa intercessão.

Vós que permanecestes firmes na fé mesmo diante da perseguição e do martírio, ajudai-nos a viver com coragem, fidelidade e amor ao Evangelho.

Concedei-nos a graça de rezar esta novena com fé sincera, para que, por vossa intercessão, possamos alcançar as graças que necessitamos, se forem da vontade de Deus.

Amém.`
    },

    { type: "title", text: "Oração do dia" },
    {
      type: "text",
      text: `Ó São Sebastião, fostes defensor dos cristãos perseguidos e fortalecestes muitos na fé.

Intercedei por todos os que sofrem perseguição por causa do Evangelho.

Ajudai-nos a ser solidários com os que sofrem injustiça.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
    },

    { type: "title", text: "Oração Final" },
    {
      type: "prayer",
      text: `Ó São Sebastião, glorioso mártir e fiel servo de Deus, rogai por nós.

Ajudai-nos a viver com fé, coragem e fidelidade ao Evangelho de Jesus Cristo.

Amém.`
    }
  ]
},
{
  novenaId: "novena_sao_sebastiao",
  day: 5,
  title: "Quinto dia – São Sebastião, modelo de fidelidade",
  sections: [
    { type: "title", text: "Sinal da Cruz" },
    { type: "prayer", text: "Em nome do Pai, do Filho e do Espírito Santo. Amém." },

    { type: "title", text: "Oração Inicial" },
    {
      type: "prayer",
      text: `Ó glorioso São Sebastião, fiel servo de Deus e valente testemunha da fé cristã, com confiança recorremos à vossa poderosa intercessão.

Vós que permanecestes firmes na fé mesmo diante da perseguição e do martírio, ajudai-nos a viver com coragem, fidelidade e amor ao Evangelho.

Concedei-nos a graça de rezar esta novena com fé sincera, para que, por vossa intercessão, possamos alcançar as graças que necessitamos, se forem da vontade de Deus.

Amém.`
    },

    { type: "title", text: "Oração do dia" },
    {
      type: "text",
      text: `Ó São Sebastião, permanecestes fiel a Cristo até o fim de vossa vida.

Ensinai-nos a ser fiéis a Deus em todas as circunstâncias.

Que nunca abandonemos o caminho do Senhor.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
    },

    { type: "title", text: "Oração Final" },
    {
      type: "prayer",
      text: `Ó São Sebastião, glorioso mártir e fiel servo de Deus, rogai por nós.

Ajudai-nos a viver com fé, coragem e fidelidade ao Evangelho de Jesus Cristo.

Amém.`
    }
  ]
},
{
  novenaId: "novena_sao_sebastiao",
  day: 6,
  title: "Sexto dia – São Sebastião, protetor contra as epidemias",
  sections: [
    { type: "title", text: "Sinal da Cruz" },
    { type: "prayer", text: "Em nome do Pai, do Filho e do Espírito Santo. Amém." },

    { type: "title", text: "Oração Inicial" },
    {
      type: "prayer",
      text: `Ó glorioso São Sebastião, fiel servo de Deus e valente testemunha da fé cristã, com confiança recorremos à vossa poderosa intercessão.

Vós que permanecestes firmes na fé mesmo diante da perseguição e do martírio, ajudai-nos a viver com coragem, fidelidade e amor ao Evangelho.

Concedei-nos a graça de rezar esta novena com fé sincera, para que, por vossa intercessão, possamos alcançar as graças que necessitamos, se forem da vontade de Deus.

Amém.`
    },

    { type: "title", text: "Oração do dia" },
    {
      type: "text",
      text: `Ó São Sebastião, invocado como protetor contra as doenças e epidemias.

Intercedei por todos os enfermos e por aqueles que cuidam da saúde dos outros.

Concedei-nos saúde do corpo e da alma.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
    },

    { type: "title", text: "Oração Final" },
    {
      type: "prayer",
      text: `Ó São Sebastião, glorioso mártir e fiel servo de Deus, rogai por nós.

Ajudai-nos a viver com fé, coragem e fidelidade ao Evangelho de Jesus Cristo.

Amém.`
    }
  ]
},
{
  novenaId: "novena_sao_sebastiao",
  day: 7,
  title: "Sétimo dia – São Sebastião, intercessor poderoso",
  sections: [
    { type: "title", text: "Sinal da Cruz" },
    { type: "prayer", text: "Em nome do Pai, do Filho e do Espírito Santo. Amém." },

    { type: "title", text: "Oração Inicial" },
    {
      type: "prayer",
      text: `Ó glorioso São Sebastião, fiel servo de Deus e valente testemunha da fé cristã, com confiança recorremos à vossa poderosa intercessão.

Vós que permanecestes firmes na fé mesmo diante da perseguição e do martírio, ajudai-nos a viver com coragem, fidelidade e amor ao Evangelho.

Concedei-nos a graça de rezar esta novena com fé sincera, para que, por vossa intercessão, possamos alcançar as graças que necessitamos, se forem da vontade de Deus.

Amém.`
    },

    { type: "title", text: "Oração do dia" },
    {
      type: "text",
      text: `Ó glorioso São Sebastião, confiamos em vossa poderosa intercessão junto a Deus.

Apresentai ao Senhor nossas necessidades, angústias e intenções.

Alcançai-nos as graças que mais necessitamos.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
    },

    { type: "title", text: "Oração Final" },
    {
      type: "prayer",
      text: `Ó São Sebastião, glorioso mártir e fiel servo de Deus, rogai por nós.

Ajudai-nos a viver com fé, coragem e fidelidade ao Evangelho de Jesus Cristo.

Amém.`
    }
  ]
},
{
  novenaId: "novena_sao_sebastiao",
  day: 8,
  title: "Oitavo dia – São Sebastião, exemplo de perseverança",
  sections: [
    { type: "title", text: "Sinal da Cruz" },
    { type: "prayer", text: "Em nome do Pai, do Filho e do Espírito Santo. Amém." },

    { type: "title", text: "Oração Inicial" },
    {
      type: "prayer",
      text: `Ó glorioso São Sebastião, fiel servo de Deus e valente testemunha da fé cristã, com confiança recorremos à vossa poderosa intercessão.

Vós que permanecestes firmes na fé mesmo diante da perseguição e do martírio, ajudai-nos a viver com coragem, fidelidade e amor ao Evangelho.

Concedei-nos a graça de rezar esta novena com fé sincera, para que, por vossa intercessão, possamos alcançar as graças que necessitamos, se forem da vontade de Deus.

Amém.`
    },

    { type: "title", text: "Oração do dia" },
    {
      type: "text",
      text: `Ó São Sebastião, mesmo ferido e perseguido, não desististes de anunciar a fé.

Ajudai-nos a perseverar no caminho cristão, mesmo diante das dificuldades.

Que sejamos firmes até o fim.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
    },

    { type: "title", text: "Oração Final" },
    {
      type: "prayer",
      text: `Ó São Sebastião, glorioso mártir e fiel servo de Deus, rogai por nós.

Ajudai-nos a viver com fé, coragem e fidelidade ao Evangelho de Jesus Cristo.

Amém.`
    }
  ]
},
{
  novenaId: "novena_sao_sebastiao",
  day: 9,
  title: "Nono dia – São Sebastião, mártir da Igreja",
  sections: [
    { type: "title", text: "Sinal da Cruz" },
    { type: "prayer", text: "Em nome do Pai, do Filho e do Espírito Santo. Amém." },

    { type: "title", text: "Oração Inicial" },
    {
      type: "prayer",
      text: `Ó glorioso São Sebastião, fiel servo de Deus e valente testemunha da fé cristã, com confiança recorremos à vossa poderosa intercessão.

Vós que permanecestes firmes na fé mesmo diante da perseguição e do martírio, ajudai-nos a viver com coragem, fidelidade e amor ao Evangelho.

Concedei-nos a graça de rezar esta novena com fé sincera, para que, por vossa intercessão, possamos alcançar as graças que necessitamos, se forem da vontade de Deus.

Amém.`
    },

    { type: "title", text: "Oração do dia" },
    {
      type: "text",
      text: `Ó São Sebastião, derramastes vosso sangue como testemunho supremo de amor a Cristo.

Ajudai-nos a viver uma fé autêntica e comprometida com o Evangelho.

Conduzi-nos sempre para mais perto de Deus.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
    },

    { type: "title", text: "Oração Final" },
    {
      type: "prayer",
      text: `Ó São Sebastião, glorioso mártir e fiel servo de Deus, rogai por nós.

Ajudai-nos a viver com fé, coragem e fidelidade ao Evangelho de Jesus Cristo.

Amém.`
    }
  ]
},

// ===== Novena a São Francisco de Sales =====
{
  novenaId: "novena_sao_francisco_de_sales",
  day: 1,
  title: "Primeiro dia – São Francisco de Sales, chamado à santidade",
  sections: [
    { type: "title", text: "Sinal da Cruz" },
    { type: "prayer", text: "Em nome do Pai, do Filho e do Espírito Santo. Amém." },

    { type: "title", text: "Oração Inicial" },
    {
      type: "prayer",
      text: `Ó glorioso São Francisco de Sales, bispo santo e doutor da Igreja, mestre da mansidão e do amor cristão, com confiança recorremos à vossa intercessão.

Vós que ensinastes que a santidade é possível a todos, em qualquer estado de vida, ajudai-nos a viver o Evangelho com simplicidade, paciência e caridade.

Concedei-nos a graça de rezar esta novena com fé sincera, para que, por vossa intercessão, possamos crescer no amor a Deus e ao próximo e alcançar as graças que necessitamos, se forem da vontade do Senhor.

Amém.`
    },

    { type: "title", text: "Oração do dia" },
    {
      type: "text",
      text: `Ó São Francisco de Sales, desde jovem sentistes o chamado de Deus para uma vida totalmente entregue ao serviço da Igreja.

Ensinai-nos a reconhecer que todos somos chamados à santidade, vivendo com fidelidade nossas responsabilidades diárias.

Ajudai-nos a buscar a Deus em todas as coisas.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
    },

    { type: "title", text: "Oração Final" },
    {
      type: "prayer",
      text: `Ó São Francisco de Sales, doutor da Igreja e mestre da mansidão, rogai por nós.

Ajudai-nos a viver o Evangelho com amor, paciência e fidelidade, seguindo sempre o caminho da santidade.

Amém.`
    }
  ]
},
{
  novenaId: "novena_sao_francisco_de_sales",
  day: 2,
  title: "Segundo dia – São Francisco de Sales, modelo de mansidão",
  sections: [
    { type: "title", text: "Sinal da Cruz" },
    { type: "prayer", text: "Em nome do Pai, do Filho e do Espírito Santo. Amém." },

    { type: "title", text: "Oração Inicial" },
    {
      type: "prayer",
      text: `Ó glorioso São Francisco de Sales, bispo santo e doutor da Igreja, mestre da mansidão e do amor cristão, com confiança recorremos à vossa intercessão.

Vós que ensinastes que a santidade é possível a todos, em qualquer estado de vida, ajudai-nos a viver o Evangelho com simplicidade, paciência e caridade.

Concedei-nos a graça de rezar esta novena com fé sincera, para que, por vossa intercessão, possamos crescer no amor a Deus e ao próximo e alcançar as graças que necessitamos, se forem da vontade do Senhor.

Amém.`
    },

    { type: "title", text: "Oração do dia" },
    {
      type: "text",
      text: `Ó São Francisco de Sales, fostes conhecido por vossa mansidão e paciência, mesmo diante das dificuldades e perseguições.

Ensinai-nos a controlar nossas palavras e atitudes, respondendo sempre com amor e serenidade.

Que saibamos vencer o mal com o bem.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
    },

    { type: "title", text: "Oração Final" },
    {
      type: "prayer",
      text: `Ó São Francisco de Sales, doutor da Igreja e mestre da mansidão, rogai por nós.

Ajudai-nos a viver o Evangelho com amor, paciência e fidelidade, seguindo sempre o caminho da santidade.

Amém.`
    }
  ]
},
{
  novenaId: "novena_sao_francisco_de_sales",
  day: 3,
  title: "Terceiro dia – São Francisco de Sales, doutor do amor",
  sections: [
    { type: "title", text: "Sinal da Cruz" },
    { type: "prayer", text: "Em nome do Pai, do Filho e do Espírito Santo. Amém." },

    { type: "title", text: "Oração Inicial" },
    {
      type: "prayer",
      text: `Ó glorioso São Francisco de Sales, bispo santo e doutor da Igreja, mestre da mansidão e do amor cristão, com confiança recorremos à vossa intercessão.

Vós que ensinastes que a santidade é possível a todos, em qualquer estado de vida, ajudai-nos a viver o Evangelho com simplicidade, paciência e caridade.

Concedei-nos a graça de rezar esta novena com fé sincera, para que, por vossa intercessão, possamos crescer no amor a Deus e ao próximo e alcançar as graças que necessitamos, se forem da vontade do Senhor.

Amém.`
    },

    { type: "title", text: "Oração do dia" },
    {
      type: "text",
      text: `Ó São Francisco de Sales, vossos ensinamentos revelam que o amor é o caminho seguro para Deus.

Ajudai-nos a amar a Deus sobre todas as coisas e ao próximo como a nós mesmos.

Que nossas ações sejam sempre guiadas pela caridade.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
    },

    { type: "title", text: "Oração Final" },
    {
      type: "prayer",
      text: `Ó São Francisco de Sales, doutor da Igreja e mestre da mansidão, rogai por nós.

Ajudai-nos a viver o Evangelho com amor, paciência e fidelidade, seguindo sempre o caminho da santidade.

Amém.`
    }
  ]
},
{
  novenaId: "novena_sao_francisco_de_sales",
  day: 4,
  title: "Quarto dia – São Francisco de Sales, mestre da vida espiritual",
  sections: [
    { type: "title", text: "Sinal da Cruz" },
    { type: "prayer", text: "Em nome do Pai, do Filho e do Espírito Santo. Amém." },

    { type: "title", text: "Oração Inicial" },
    {
      type: "prayer",
      text: `Ó glorioso São Francisco de Sales, bispo santo e doutor da Igreja, mestre da mansidão e do amor cristão, com confiança recorremos à vossa intercessão.

Vós que ensinastes que a santidade é possível a todos, em qualquer estado de vida, ajudai-nos a viver o Evangelho com simplicidade, paciência e caridade.

Concedei-nos a graça de rezar esta novena com fé sincera, para que, por vossa intercessão, possamos crescer no amor a Deus e ao próximo e alcançar as graças que necessitamos, se forem da vontade do Senhor.

Amém.`
    },

    { type: "title", text: "Oração do dia" },
    {
      type: "text",
      text: `Ó São Francisco de Sales, com sabedoria orientastes muitas almas no caminho da fé.

Ensinai-nos a cultivar a oração, a confiança em Deus e a perseverança na vida espiritual.

Que saibamos crescer diariamente na amizade com o Senhor.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
    },

    { type: "title", text: "Oração Final" },
    {
      type: "prayer",
      text: `Ó São Francisco de Sales, doutor da Igreja e mestre da mansidão, rogai por nós.

Ajudai-nos a viver o Evangelho com amor, paciência e fidelidade, seguindo sempre o caminho da santidade.

Amém.`
    }
  ]
},
{
  novenaId: "novena_sao_francisco_de_sales",
  day: 5,
  title: "Quinto dia – São Francisco de Sales, defensor da fé",
  sections: [
    { type: "title", text: "Sinal da Cruz" },
    { type: "prayer", text: "Em nome do Pai, do Filho e do Espírito Santo. Amém." },

    { type: "title", text: "Oração Inicial" },
    {
      type: "prayer",
      text: `Ó glorioso São Francisco de Sales, bispo santo e doutor da Igreja, mestre da mansidão e do amor cristão, com confiança recorremos à vossa intercessão.

Vós que ensinastes que a santidade é possível a todos, em qualquer estado de vida, ajudai-nos a viver o Evangelho com simplicidade, paciência e caridade.

Concedei-nos a graça de rezar esta novena com fé sincera, para que, por vossa intercessão, possamos crescer no amor a Deus e ao próximo e alcançar as graças que necessitamos, se forem da vontade do Senhor.

Amém.`
    },

    { type: "title", text: "Oração do dia" },
    {
      type: "text",
      text: `Ó São Francisco de Sales, com paciência e amor defendestes a fé católica e conduzistes muitos de volta à Igreja.

Ajudai-nos a testemunhar nossa fé com respeito, humildade e firmeza.

Que sejamos instrumentos de unidade e paz.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
    },

    { type: "title", text: "Oração Final" },
    {
      type: "prayer",
      text: `Ó São Francisco de Sales, doutor da Igreja e mestre da mansidão, rogai por nós.

Ajudai-nos a viver o Evangelho com amor, paciência e fidelidade, seguindo sempre o caminho da santidade.

Amém.`
    }
  ]
},
{
  novenaId: "novena_sao_francisco_de_sales",
  day: 6,
  title: "Sexto dia – São Francisco de Sales, exemplo de humildade",
  sections: [
    { type: "title", text: "Sinal da Cruz" },
    { type: "prayer", text: "Em nome do Pai, do Filho e do Espírito Santo. Amém." },

    { type: "title", text: "Oração Inicial" },
    {
      type: "prayer",
      text: `Ó glorioso São Francisco de Sales, bispo santo e doutor da Igreja, mestre da mansidão e do amor cristão, com confiança recorremos à vossa intercessão.

Vós que ensinastes que a santidade é possível a todos, em qualquer estado de vida, ajudai-nos a viver o Evangelho com simplicidade, paciência e caridade.

Concedei-nos a graça de rezar esta novena com fé sincera, para que, por vossa intercessão, possamos crescer no amor a Deus e ao próximo e alcançar as graças que necessitamos, se forem da vontade do Senhor.

Amém.`
    },

    { type: "title", text: "Oração do dia" },
    {
      type: "text",
      text: `Ó São Francisco de Sales, mesmo com grande sabedoria e autoridade, permanecestes humilde diante de Deus.

Ensinai-nos a reconhecer nossas limitações e a confiar totalmente na graça divina.

Livrai-nos do orgulho e conduzi-nos no caminho da simplicidade.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
    },

    { type: "title", text: "Oração Final" },
    {
      type: "prayer",
      text: `Ó São Francisco de Sales, doutor da Igreja e mestre da mansidão, rogai por nós.

Ajudai-nos a viver o Evangelho com amor, paciência e fidelidade, seguindo sempre o caminho da santidade.

Amém.`
    }
  ]
},
{
  novenaId: "novena_sao_francisco_de_sales",
  day: 7,
  title: "Sétimo dia – São Francisco de Sales, pastor zeloso",
  sections: [
    { type: "title", text: "Sinal da Cruz" },
    { type: "prayer", text: "Em nome do Pai, do Filho e do Espírito Santo. Amém." },

    { type: "title", text: "Oração Inicial" },
    {
      type: "prayer",
      text: `Ó glorioso São Francisco de Sales, bispo santo e doutor da Igreja, mestre da mansidão e do amor cristão, com confiança recorremos à vossa intercessão.

Vós que ensinastes que a santidade é possível a todos, em qualquer estado de vida, ajudai-nos a viver o Evangelho com simplicidade, paciência e caridade.

Concedei-nos a graça de rezar esta novena com fé sincera, para que, por vossa intercessão, possamos crescer no amor a Deus e ao próximo e alcançar as graças que necessitamos, se forem da vontade do Senhor.

Amém.`
    },

    { type: "title", text: "Oração do dia" },
    {
      type: "text",
      text: `Ó São Francisco de Sales, como bispo, cuidastes com amor e dedicação do povo que vos foi confiado.

Intercedei por todos os pastores da Igreja, para que sejam fiéis, pacientes e cheios de caridade.

Ajudai-nos a colaborar com a missão da Igreja.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
    },

    { type: "title", text: "Oração Final" },
    {
      type: "prayer",
      text: `Ó São Francisco de Sales, doutor da Igreja e mestre da mansidão, rogai por nós.

Ajudai-nos a viver o Evangelho com amor, paciência e fidelidade, seguindo sempre o caminho da santidade.

Amém.`
    }
  ]
},
{
  novenaId: "novena_sao_francisco_de_sales",
  day: 8,
  title: "Oitavo dia – São Francisco de Sales, apóstolo da Palavra",
  sections: [
    { type: "title", text: "Sinal da Cruz" },
    { type: "prayer", text: "Em nome do Pai, do Filho e do Espírito Santo. Amém." },

    { type: "title", text: "Oração Inicial" },
    {
      type: "prayer",
      text: `Ó glorioso São Francisco de Sales, bispo santo e doutor da Igreja, mestre da mansidão e do amor cristão, com confiança recorremos à vossa intercessão.

Vós que ensinastes que a santidade é possível a todos, em qualquer estado de vida, ajudai-nos a viver o Evangelho com simplicidade, paciência e caridade.

Concedei-nos a graça de rezar esta novena com fé sincera, para que, por vossa intercessão, possamos crescer no amor a Deus e ao próximo e alcançar as graças que necessitamos, se forem da vontade do Senhor.

Amém.`
    },

    { type: "title", text: "Oração do dia" },
    {
      type: "text",
      text: `Ó São Francisco de Sales, utilizastes a palavra escrita e falada para evangelizar e conduzir almas a Deus.

Ajudai-nos a usar bem nossas palavras, para edificar, consolar e anunciar o Evangelho.

Que sejamos verdadeiros testemunhos do amor cristão.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
    },

    { type: "title", text: "Oração Final" },
    {
      type: "prayer",
      text: `Ó São Francisco de Sales, doutor da Igreja e mestre da mansidão, rogai por nós.

Ajudai-nos a viver o Evangelho com amor, paciência e fidelidade, seguindo sempre o caminho da santidade.

Amém.`
    }
  ]
},
{
  novenaId: "novena_sao_francisco_de_sales",
  day: 9,
  title: "Nono dia – São Francisco de Sales, intercessor junto a Deus",
  sections: [
    { type: "title", text: "Sinal da Cruz" },
    { type: "prayer", text: "Em nome do Pai, do Filho e do Espírito Santo. Amém." },

    { type: "title", text: "Oração Inicial" },
    {
      type: "prayer",
      text: `Ó glorioso São Francisco de Sales, bispo santo e doutor da Igreja, mestre da mansidão e do amor cristão, com confiança recorremos à vossa intercessão.

Vós que ensinastes que a santidade é possível a todos, em qualquer estado de vida, ajudai-nos a viver o Evangelho com simplicidade, paciência e caridade.

Concedei-nos a graça de rezar esta novena com fé sincera, para que, por vossa intercessão, possamos crescer no amor a Deus e ao próximo e alcançar as graças que necessitamos, se forem da vontade do Senhor.

Amém.`
    },

    { type: "title", text: "Oração do dia" },
    {
      type: "text",
      text: `Ó glorioso São Francisco de Sales, confiamos em vossa poderosa intercessão.

Apresentai a Deus nossas intenções, necessidades e pedidos.

Ajudai-nos a viver uma fé sincera, marcada pela mansidão, pela caridade e pela perseverança.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
    },

    { type: "title", text: "Oração Final" },
    {
      type: "prayer",
      text: `Ó São Francisco de Sales, doutor da Igreja e mestre da mansidão, rogai por nós.

Ajudai-nos a viver o Evangelho com amor, paciência e fidelidade, seguindo sempre o caminho da santidade.

Amém.`
    }
  ]
},
// ===== Novena a Santo Antão =====
{
  novenaId: "novena_santo_antao",
  day: 1,
  title: "Primeiro dia – Santo Antão, chamado por Deus",
  sections: [
    { type: "title", text: "Sinal da Cruz" },
    { type: "prayer", text: "Em nome do Pai, do Filho e do Espírito Santo. Amém." },

    { type: "title", text: "Oração Inicial" },
    {
      type: "prayer",
      text: `Ó glorioso Santo Antão, fiel servo de Deus e exemplo de vida santa, com confiança recorremos à vossa intercessão.

Vós que, tocado pelo Evangelho, deixastes tudo para seguir Cristo no silêncio, na oração e na penitência, ajudai-nos a buscar a Deus acima de todas as coisas.

Concedei-nos a graça de rezar esta novena com fé sincera, para que, por vossa intercessão, possamos alcançar as graças que necessitamos, se forem da vontade de Deus.

Amém.`
    },

    { type: "title", text: "Oração do dia" },
    {
      type: "text",
      text: `Ó Santo Antão, ao ouvir a Palavra de Deus, deixastes tudo para seguir Cristo com radicalidade.

Ensinai-nos a escutar a voz do Senhor e a responder com generosidade ao Seu chamado.

Que também nós saibamos desapegar-nos do que nos afasta de Deus.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
    },

    { type: "title", text: "Oração Final" },
    {
      type: "prayer",
      text: `Ó Santo Antão, exemplo de santidade e fidelidade a Deus, rogai por nós.

Ajudai-nos a seguir o caminho do Evangelho com fé, humildade e perseverança.

Amém.`
    }
  ]
},
{
  novenaId: "novena_santo_antao",
  day: 2,
  title: "Segundo dia – Santo Antão, exemplo de desapego",
  sections: [
    { type: "title", text: "Sinal da Cruz" },
    { type: "prayer", text: "Em nome do Pai, do Filho e do Espírito Santo. Amém." },

    { type: "title", text: "Oração Inicial" },
    {
      type: "prayer",
      text: `Ó glorioso Santo Antão, fiel servo de Deus e exemplo de vida santa, com confiança recorremos à vossa intercessão.

Vós que, tocado pelo Evangelho, deixastes tudo para seguir Cristo no silêncio, na oração e na penitência, ajudai-nos a buscar a Deus acima de todas as coisas.

Concedei-nos a graça de rezar esta novena com fé sincera, para que, por vossa intercessão, possamos alcançar as graças que necessitamos, se forem da vontade de Deus.

Amém.`
    },

    { type: "title", text: "Oração do dia" },
    {
      type: "text",
      text: `Ó Santo Antão, vossa vida foi marcada pelo desapego dos bens materiais.

Ajudai-nos a compreender que somente Deus é nosso verdadeiro tesouro.

Livrai-nos do apego excessivo às coisas deste mundo e ensinai-nos a viver com simplicidade.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
    },

    { type: "title", text: "Oração Final" },
    {
      type: "prayer",
      text: `Ó Santo Antão, exemplo de santidade e fidelidade a Deus, rogai por nós.

Ajudai-nos a seguir o caminho do Evangelho com fé, humildade e perseverança.

Amém.`
    }
  ]
},
{
  novenaId: "novena_santo_antao",
  day: 3,
  title: "Terceiro dia – Santo Antão, homem de oração",
  sections: [
    { type: "title", text: "Sinal da Cruz" },
    { type: "prayer", text: "Em nome do Pai, do Filho e do Espírito Santo. Amém." },

    { type: "title", text: "Oração Inicial" },
    {
      type: "prayer",
      text: `Ó glorioso Santo Antão, fiel servo de Deus e exemplo de vida santa, com confiança recorremos à vossa intercessão.

Vós que, tocado pelo Evangelho, deixastes tudo para seguir Cristo no silêncio, na oração e na penitência, ajudai-nos a buscar a Deus acima de todas as coisas.

Concedei-nos a graça de rezar esta novena com fé sincera, para que, por vossa intercessão, possamos alcançar as graças que necessitamos, se forem da vontade de Deus.

Amém.`
    },

    { type: "title", text: "Oração do dia" },
    {
      type: "text",
      text: `Ó Santo Antão, passastes longos anos em oração silenciosa, buscando a intimidade com Deus.

Ensinai-nos a valorizar a oração como fonte de força e de paz para nossa vida.

Que saibamos reservar tempo para estar na presença do Senhor.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
    },

    { type: "title", text: "Oração Final" },
    {
      type: "prayer",
      text: `Ó Santo Antão, exemplo de santidade e fidelidade a Deus, rogai por nós.

Ajudai-nos a seguir o caminho do Evangelho com fé, humildade e perseverança.

Amém.`
    }
  ]
},
{
  novenaId: "novena_santo_antao",
  day: 4,
  title: "Quarto dia – Santo Antão, lutador contra as tentações",
  sections: [
    { type: "title", text: "Sinal da Cruz" },
    { type: "prayer", text: "Em nome do Pai, do Filho e do Espírito Santo. Amém." },

    { type: "title", text: "Oração Inicial" },
    {
      type: "prayer",
      text: `Ó glorioso Santo Antão, fiel servo de Deus e exemplo de vida santa, com confiança recorremos à vossa intercessão.

Vós que, tocado pelo Evangelho, deixastes tudo para seguir Cristo no silêncio, na oração e na penitência, ajudai-nos a buscar a Deus acima de todas as coisas.

Concedei-nos a graça de rezar esta novena com fé sincera, para que, por vossa intercessão, possamos alcançar as graças que necessitamos, se forem da vontade de Deus.

Amém.`
    },

    { type: "title", text: "Oração do dia" },
    {
      type: "text",
      text: `Ó Santo Antão, enfrentastes as tentações com coragem e confiança em Deus.

Ajudai-nos a resistir às tentações do mal e a permanecer firmes na fé.

Que, fortalecidos pela graça divina, saibamos vencer as provações da vida.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
    },

    { type: "title", text: "Oração Final" },
    {
      type: "prayer",
      text: `Ó Santo Antão, exemplo de santidade e fidelidade a Deus, rogai por nós.

Ajudai-nos a seguir o caminho do Evangelho com fé, humildade e perseverança.

Amém.`
    }
  ]
},
{
  novenaId: "novena_santo_antao",
  day: 5,
  title: "Quinto dia – Santo Antão, modelo de penitência",
  sections: [
    { type: "title", text: "Sinal da Cruz" },
    { type: "prayer", text: "Em nome do Pai, do Filho e do Espírito Santo. Amém." },

    { type: "title", text: "Oração Inicial" },
    {
      type: "prayer",
      text: `Ó glorioso Santo Antão, fiel servo de Deus e exemplo de vida santa, com confiança recorremos à vossa intercessão.

Vós que, tocado pelo Evangelho, deixastes tudo para seguir Cristo no silêncio, na oração e na penitência, ajudai-nos a buscar a Deus acima de todas as coisas.

Concedei-nos a graça de rezar esta novena com fé sincera, para que, por vossa intercessão, possamos alcançar as graças que necessitamos, se forem da vontade de Deus.

Amém.`
    },

    { type: "title", text: "Oração do dia" },
    {
      type: "text",
      text: `Ó Santo Antão, vossa vida foi marcada pela penitência e pela entrega total a Deus.

Ensinai-nos a aceitar os sacrifícios do dia a dia com paciência e amor.

Que nossa vida seja oferecida a Deus como sinal de conversão sincera.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
    },

    { type: "title", text: "Oração Final" },
    {
      type: "prayer",
      text: `Ó Santo Antão, exemplo de santidade e fidelidade a Deus, rogai por nós.

Ajudai-nos a seguir o caminho do Evangelho com fé, humildade e perseverança.

Amém.`
    }
  ]
},
{
  novenaId: "novena_santo_antao",
  day: 6,
  title: "Sexto dia – Santo Antão, mestre de sabedoria",
  sections: [
    { type: "title", text: "Sinal da Cruz" },
    { type: "prayer", text: "Em nome do Pai, do Filho e do Espírito Santo. Amém." },

    { type: "title", text: "Oração Inicial" },
    {
      type: "prayer",
      text: `Ó glorioso Santo Antão, fiel servo de Deus e exemplo de vida santa, com confiança recorremos à vossa intercessão.

Vós que, tocado pelo Evangelho, deixastes tudo para seguir Cristo no silêncio, na oração e na penitência, ajudai-nos a buscar a Deus acima de todas as coisas.

Concedei-nos a graça de rezar esta novena com fé sincera, para que, por vossa intercessão, possamos alcançar as graças que necessitamos, se forem da vontade de Deus.

Amém.`
    },

    { type: "title", text: "Oração do dia" },
    {
      type: "text",
      text: `Ó Santo Antão, mesmo sem estudos formais, fostes cheio da sabedoria que vem de Deus.

Ajudai-nos a buscar a verdadeira sabedoria, que nasce da humildade e da fé.

Que nossas palavras e atitudes reflitam o amor de Deus.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
    },

    { type: "title", text: "Oração Final" },
    {
      type: "prayer",
      text: `Ó Santo Antão, exemplo de santidade e fidelidade a Deus, rogai por nós.

Ajudai-nos a seguir o caminho do Evangelho com fé, humildade e perseverança.

Amém.`
    }
  ]
},
{
  novenaId: "novena_santo_antao",
  day: 7,
  title: "Sétimo dia – Santo Antão, guia espiritual",
  sections: [
    { type: "title", text: "Sinal da Cruz" },
    { type: "prayer", text: "Em nome do Pai, do Filho e do Espírito Santo. Amém." },

    { type: "title", text: "Oração Inicial" },
    {
      type: "prayer",
      text: `Ó glorioso Santo Antão, fiel servo de Deus e exemplo de vida santa, com confiança recorremos à vossa intercessão.

Vós que, tocado pelo Evangelho, deixastes tudo para seguir Cristo no silêncio, na oração e na penitência, ajudai-nos a buscar a Deus acima de todas as coisas.

Concedei-nos a graça de rezar esta novena com fé sincera, para que, por vossa intercessão, possamos alcançar as graças que necessitamos, se forem da vontade de Deus.

Amém.`
    },

    { type: "title", text: "Oração do dia" },
    {
      type: "text",
      text: `Ó Santo Antão, muitos procuravam vossos conselhos para crescer na fé.

Intercedei por todos os que buscam orientação espiritual e desejam viver segundo a vontade de Deus.

Que sejamos dóceis à ação do Espírito Santo em nossa vida.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
    },

    { type: "title", text: "Oração Final" },
    {
      type: "prayer",
      text: `Ó Santo Antão, exemplo de santidade e fidelidade a Deus, rogai por nós.

Ajudai-nos a seguir o caminho do Evangelho com fé, humildade e perseverança.

Amém.`
    }
  ]
},
{
  novenaId: "novena_santo_antao",
  day: 8,
  title: "Oitavo dia – Santo Antão, exemplo de perseverança",
  sections: [
    { type: "title", text: "Sinal da Cruz" },
    { type: "prayer", text: "Em nome do Pai, do Filho e do Espírito Santo. Amém." },

    { type: "title", text: "Oração Inicial" },
    {
      type: "prayer",
      text: `Ó glorioso Santo Antão, fiel servo de Deus e exemplo de vida santa, com confiança recorremos à vossa intercessão.

Vós que, tocado pelo Evangelho, deixastes tudo para seguir Cristo no silêncio, na oração e na penitência, ajudai-nos a buscar a Deus acima de todas as coisas.

Concedei-nos a graça de rezar esta novena com fé sincera, para que, por vossa intercessão, possamos alcançar as graças que necessitamos, se forem da vontade de Deus.

Amém.`
    },

    { type: "title", text: "Oração do dia" },
    {
      type: "text",
      text: `Ó Santo Antão, permanecestes fiel a Deus até o fim de vossa vida.

Ajudai-nos a perseverar na fé, mesmo diante das dificuldades e desafios.

Que nunca nos afastemos do caminho do Senhor.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
    },

    { type: "title", text: "Oração Final" },
    {
      type: "prayer",
      text: `Ó Santo Antão, exemplo de santidade e fidelidade a Deus, rogai por nós.

Ajudai-nos a seguir o caminho do Evangelho com fé, humildade e perseverança.

Amém.`
    }
  ]
},
{
  novenaId: "novena_santo_antao",
  day: 9,
  title: "Nono dia – Santo Antão, intercessor junto a Deus",
  sections: [
    { type: "title", text: "Sinal da Cruz" },
    { type: "prayer", text: "Em nome do Pai, do Filho e do Espírito Santo. Amém." },

    { type: "title", text: "Oração Inicial" },
    {
      type: "prayer",
      text: `Ó glorioso Santo Antão, fiel servo de Deus e exemplo de vida santa, com confiança recorremos à vossa intercessão.

Vós que, tocado pelo Evangelho, deixastes tudo para seguir Cristo no silêncio, na oração e na penitência, ajudai-nos a buscar a Deus acima de todas as coisas.

Concedei-nos a graça de rezar esta novena com fé sincera, para que, por vossa intercessão, possamos alcançar as graças que necessitamos, se forem da vontade de Deus.

Amém.`
    },

    { type: "title", text: "Oração do dia" },
    {
      type: "text",
      text: `Ó glorioso Santo Antão, confiamos em vossa poderosa intercessão.

Apresentai a Deus nossos pedidos e necessidades, e alcançai-nos as graças que mais precisamos para nossa vida espiritual.

Conduzi-nos sempre para mais perto de Cristo.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
    },

    { type: "title", text: "Oração Final" },
    {
      type: "prayer",
      text: `Ó Santo Antão, exemplo de santidade e fidelidade a Deus, rogai por nós.

Ajudai-nos a seguir o caminho do Evangelho com fé, humildade e perseverança.

Amém.`
    }
  ]
},
// ===== Novena a Santo Tomás de Aquino =====
{
  novenaId: "novena_santo_tomas_de_aquino",
  day: 1,
  title: "Primeiro dia – Santo Tomás de Aquino, buscador da verdade",
  sections: [
    { type: "title", text: "Sinal da Cruz" },
    { type: "prayer", text: "Em nome do Pai, do Filho e do Espírito Santo. Amém." },

    { type: "title", text: "Oração Inicial" },
    {
      type: "prayer",
      text: `Ó glorioso Santo Tomás de Aquino, doutor da Igreja e mestre da sabedoria cristã, com confiança recorremos à vossa intercessão.

Vós que dedicastes vossa vida ao estudo, à oração e ao serviço da verdade, ajudai-nos a unir a fé e a razão, buscando sempre a luz de Deus em todas as coisas.

Concedei-nos a graça de rezar esta novena com fé sincera, para que, por vossa intercessão, possamos crescer no amor à verdade, na vida espiritual e alcançar as graças que necessitamos, se forem da vontade do Senhor.

Amém.`
    },

    { type: "title", text: "Oração do dia" },
    {
      type: "text",
      text: `Ó Santo Tomás de Aquino, vossa vida foi dedicada à busca da verdade que vem de Deus.

Ensinai-nos a amar a verdade e a rejeitar tudo o que nos afasta do bem.

Que nossa inteligência seja iluminada pela fé.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
    },

    { type: "title", text: "Oração Final" },
    {
      type: "prayer",
      text: `Ó Santo Tomás de Aquino, doutor da Igreja e mestre da verdade, rogai por nós.

Ajudai-nos a unir fé e razão, vivendo sempre segundo a vontade de Deus.

Amém.`
    }
  ]
},
{
  novenaId: "novena_santo_tomas_de_aquino",
  day: 2,
  title: "Segundo dia – Santo Tomás de Aquino, exemplo de fé e razão",
  sections: [
    { type: "title", text: "Sinal da Cruz" },
    { type: "prayer", text: "Em nome do Pai, do Filho e do Espírito Santo. Amém." },

    { type: "title", text: "Oração Inicial" },
    {
      type: "prayer",
      text: `Ó glorioso Santo Tomás de Aquino, doutor da Igreja e mestre da sabedoria cristã, com confiança recorremos à vossa intercessão.

Vós que dedicastes vossa vida ao estudo, à oração e ao serviço da verdade, ajudai-nos a unir a fé e a razão, buscando sempre a luz de Deus em todas as coisas.

Concedei-nos a graça de rezar esta novena com fé sincera, para que, por vossa intercessão, possamos crescer no amor à verdade, na vida espiritual e alcançar as graças que necessitamos, se forem da vontade do Senhor.

Amém.`
    },

    { type: "title", text: "Oração do dia" },
    {
      type: "text",
      text: `Ó Santo Tomás de Aquino, mostrastes que a fé e a razão caminham juntas.

Ajudai-nos a compreender melhor nossa fé e a aprofundar nosso conhecimento de Deus.

Que jamais nos afastemos da verdade revelada.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
    },

    { type: "title", text: "Oração Final" },
    {
      type: "prayer",
      text: `Ó Santo Tomás de Aquino, doutor da Igreja e mestre da verdade, rogai por nós.

Ajudai-nos a unir fé e razão, vivendo sempre segundo a vontade de Deus.

Amém.`
    }
  ]
},
{
  novenaId: "novena_santo_tomas_de_aquino",
  day: 3,
  title: "Terceiro dia – Santo Tomás de Aquino, amante da oração",
  sections: [
    { type: "title", text: "Sinal da Cruz" },
    { type: "prayer", text: "Em nome do Pai, do Filho e do Espírito Santo. Amém." },

    { type: "title", text: "Oração Inicial" },
    {
      type: "prayer",
      text: `Ó glorioso Santo Tomás de Aquino, doutor da Igreja e mestre da sabedoria cristã, com confiança recorremos à vossa intercessão.

Vós que dedicastes vossa vida ao estudo, à oração e ao serviço da verdade, ajudai-nos a unir a fé e a razão, buscando sempre a luz de Deus em todas as coisas.

Concedei-nos a graça de rezar esta novena com fé sincera, para que, por vossa intercessão, possamos crescer no amor à verdade, na vida espiritual e alcançar as graças que necessitamos, se forem da vontade do Senhor.

Amém.`
    },

    { type: "title", text: "Oração do dia" },
    {
      type: "text",
      text: `Ó Santo Tomás de Aquino, mesmo em meio aos estudos, nunca deixastes de buscar a Deus na oração.

Ensinai-nos a unir estudo, trabalho e oração em nossa vida cotidiana.

Que nossa alma esteja sempre voltada para o Senhor.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
    },

    { type: "title", text: "Oração Final" },
    {
      type: "prayer",
      text: `Ó Santo Tomás de Aquino, doutor da Igreja e mestre da verdade, rogai por nós.

Ajudai-nos a unir fé e razão, vivendo sempre segundo a vontade de Deus.

Amém.`
    }
  ]
},
{
  novenaId: "novena_santo_tomas_de_aquino",
  day: 4,
  title: "Quarto dia – Santo Tomás de Aquino, humilde diante de Deus",
  sections: [
    { type: "title", text: "Sinal da Cruz" },
    { type: "prayer", text: "Em nome do Pai, do Filho e do Espírito Santo. Amém." },

    { type: "title", text: "Oração Inicial" },
    {
      type: "prayer",
      text: `Ó glorioso Santo Tomás de Aquino, doutor da Igreja e mestre da sabedoria cristã, com confiança recorremos à vossa intercessão.

Vós que dedicastes vossa vida ao estudo, à oração e ao serviço da verdade, ajudai-nos a unir a fé e a razão, buscando sempre a luz de Deus em todas as coisas.

Concedei-nos a graça de rezar esta novena com fé sincera, para que, por vossa intercessão, possamos crescer no amor à verdade, na vida espiritual e alcançar as graças que necessitamos, se forem da vontade do Senhor.

Amém.`
    },

    { type: "title", text: "Oração do dia" },
    {
      type: "text",
      text: `Ó Santo Tomás de Aquino, apesar de vosso grande saber, reconhecíeis com humildade que todo conhecimento vem de Deus.

Ajudai-nos a viver a humildade, reconhecendo nossas limitações e confiando na graça divina.

Livrai-nos do orgulho intelectual.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
    },

    { type: "title", text: "Oração Final" },
    {
      type: "prayer",
      text: `Ó Santo Tomás de Aquino, doutor da Igreja e mestre da verdade, rogai por nós.

Ajudai-nos a unir fé e razão, vivendo sempre segundo a vontade de Deus.

Amém.`
    }
  ]
},
{
  novenaId: "novena_santo_tomas_de_aquino",
  day: 5,
  title: "Quinto dia – Santo Tomás de Aquino, defensor da fé",
  sections: [
    { type: "title", text: "Sinal da Cruz" },
    { type: "prayer", text: "Em nome do Pai, do Filho e do Espírito Santo. Amém." },

    { type: "title", text: "Oração Inicial" },
    {
      type: "prayer",
      text: `Ó glorioso Santo Tomás de Aquino, doutor da Igreja e mestre da sabedoria cristã, com confiança recorremos à vossa intercessão.

Vós que dedicastes vossa vida ao estudo, à oração e ao serviço da verdade, ajudai-nos a unir a fé e a razão, buscando sempre a luz de Deus em todas as coisas.

Concedei-nos a graça de rezar esta novena com fé sincera, para que, por vossa intercessão, possamos crescer no amor à verdade, na vida espiritual e alcançar as graças que necessitamos, se forem da vontade do Senhor.

Amém.`
    },

    { type: "title", text: "Oração do dia" },
    {
      type: "text",
      text: `Ó Santo Tomás de Aquino, defendestes a fé católica com sabedoria e clareza.

Ajudai-nos a testemunhar nossa fé com coragem e fidelidade.

Que sejamos firmes na verdade, mas sempre cheios de caridade.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
    },

    { type: "title", text: "Oração Final" },
    {
      type: "prayer",
      text: `Ó Santo Tomás de Aquino, doutor da Igreja e mestre da verdade, rogai por nós.

Ajudai-nos a unir fé e razão, vivendo sempre segundo a vontade de Deus.

Amém.`
    }
  ]
},
{
  novenaId: "novena_santo_tomas_de_aquino",
  day: 6,
  title: "Sexto dia – Santo Tomás de Aquino, mestre da vida moral",
  sections: [
    { type: "title", text: "Sinal da Cruz" },
    { type: "prayer", text: "Em nome do Pai, do Filho e do Espírito Santo. Amém." },

    { type: "title", text: "Oração Inicial" },
    {
      type: "prayer",
      text: `Ó glorioso Santo Tomás de Aquino, doutor da Igreja e mestre da sabedoria cristã, com confiança recorremos à vossa intercessão.

Vós que dedicastes vossa vida ao estudo, à oração e ao serviço da verdade, ajudai-nos a unir a fé e a razão, buscando sempre a luz de Deus em todas as coisas.

Concedei-nos a graça de rezar esta novena com fé sincera, para que, por vossa intercessão, possamos crescer no amor à verdade, na vida espiritual e alcançar as graças que necessitamos, se forem da vontade do Senhor.

Amém.`
    },

    { type: "title", text: "Oração do dia" },
    {
      type: "text",
      text: `Ó Santo Tomás de Aquino, vossos ensinamentos orientam a vida moral do cristão.

Ensinai-nos a viver segundo os mandamentos de Deus e as virtudes cristãs.

Que nossas escolhas reflitam o amor ao bem e à justiça.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
    },

    { type: "title", text: "Oração Final" },
    {
      type: "prayer",
      text: `Ó Santo Tomás de Aquino, doutor da Igreja e mestre da verdade, rogai por nós.

Ajudai-nos a unir fé e razão, vivendo sempre segundo a vontade de Deus.

Amém.`
    }
  ]
},
{
  novenaId: "novena_santo_tomas_de_aquino",
  day: 7,
  title: "Sétimo dia – Santo Tomás de Aquino, amor à Eucaristia",
  sections: [
    { type: "title", text: "Sinal da Cruz" },
    { type: "prayer", text: "Em nome do Pai, do Filho e do Espírito Santo. Amém." },

    { type: "title", text: "Oração Inicial" },
    {
      type: "prayer",
      text: `Ó glorioso Santo Tomás de Aquino, doutor da Igreja e mestre da sabedoria cristã, com confiança recorremos à vossa intercessão.

Vós que dedicastes vossa vida ao estudo, à oração e ao serviço da verdade, ajudai-nos a unir a fé e a razão, buscando sempre a luz de Deus em todas as coisas.

Concedei-nos a graça de rezar esta novena com fé sincera, para que, por vossa intercessão, possamos crescer no amor à verdade, na vida espiritual e alcançar as graças que necessitamos, se forem da vontade do Senhor.

Amém.`
    },

    { type: "title", text: "Oração do dia" },
    {
      type: "text",
      text: `Ó Santo Tomás de Aquino, tivestes profundo amor pelo mistério da Eucaristia.

Ajudai-nos a reconhecer a presença real de Cristo no Santíssimo Sacramento.

Que nossa participação na Eucaristia fortaleça nossa fé e nosso amor a Deus.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
    },

    { type: "title", text: "Oração Final" },
    {
      type: "prayer",
      text: `Ó Santo Tomás de Aquino, doutor da Igreja e mestre da verdade, rogai por nós.

Ajudai-nos a unir fé e razão, vivendo sempre segundo a vontade de Deus.

Amém.`
    }
  ]
},
{
  novenaId: "novena_santo_tomas_de_aquino",
  day: 8,
  title: "Oitavo dia – Santo Tomás de Aquino, exemplo de santidade",
  sections: [
    { type: "title", text: "Sinal da Cruz" },
    { type: "prayer", text: "Em nome do Pai, do Filho e do Espírito Santo. Amém." },

    { type: "title", text: "Oração Inicial" },
    {
      type: "prayer",
      text: `Ó glorioso Santo Tomás de Aquino, doutor da Igreja e mestre da sabedoria cristã, com confiança recorremos à vossa intercessão.

Vós que dedicastes vossa vida ao estudo, à oração e ao serviço da verdade, ajudai-nos a unir a fé e a razão, buscando sempre a luz de Deus em todas as coisas.

Concedei-nos a graça de rezar esta novena com fé sincera, para que, por vossa intercessão, possamos crescer no amor à verdade, na vida espiritual e alcançar as graças que necessitamos, se forem da vontade do Senhor.

Amém.`
    },

    { type: "title", text: "Oração do dia" },
    {
      type: "text",
      text: `Ó Santo Tomás de Aquino, vossa vida foi marcada pela santidade e pela fidelidade a Deus.

Ensinai-nos que o verdadeiro conhecimento conduz à santidade.

Que busquemos sempre viver unidos a Cristo.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
    },

    { type: "title", text: "Oração Final" },
    {
      type: "prayer",
      text: `Ó Santo Tomás de Aquino, doutor da Igreja e mestre da verdade, rogai por nós.

Ajudai-nos a unir fé e razão, vivendo sempre segundo a vontade de Deus.

Amém.`
    }
  ]
},
{
  novenaId: "novena_santo_tomas_de_aquino",
  day: 9,
  title: "Nono dia – Santo Tomás de Aquino, intercessor dos estudantes e da Igreja",
  sections: [
    { type: "title", text: "Sinal da Cruz" },
    { type: "prayer", text: "Em nome do Pai, do Filho e do Espírito Santo. Amém." },

    { type: "title", text: "Oração Inicial" },
    {
      type: "prayer",
      text: `Ó glorioso Santo Tomás de Aquino, doutor da Igreja e mestre da sabedoria cristã, com confiança recorremos à vossa intercessão.

Vós que dedicastes vossa vida ao estudo, à oração e ao serviço da verdade, ajudai-nos a unir a fé e a razão, buscando sempre a luz de Deus em todas as coisas.

Concedei-nos a graça de rezar esta novena com fé sincera, para que, por vossa intercessão, possamos crescer no amor à verdade, na vida espiritual e alcançar as graças que necessitamos, se forem da vontade do Senhor.

Amém.`
    },

    { type: "title", text: "Oração do dia" },
    {
      type: "text",
      text: `Ó glorioso Santo Tomás de Aquino, confiamos em vossa poderosa intercessão.

Apresentai a Deus nossas intenções, especialmente pelos estudantes, professores e todos os que buscam a verdade.

Conduzi-nos no caminho da fé, da sabedoria e da santidade.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
    },

    { type: "title", text: "Oração Final" },
    {
      type: "prayer",
      text: `Ó Santo Tomás de Aquino, doutor da Igreja e mestre da verdade, rogai por nós.

Ajudai-nos a unir fé e razão, vivendo sempre segundo a vontade de Deus.

Amém.`
    }
  ]
},

// ===== Novena a São João Bosco =====
{
  novenaId: "novena_sao_joao_bosco",
  day: 1,
  title: "Primeiro dia – São João Bosco, chamado por Deus desde jovem",
  sections: [
    { type: "title", text: "Sinal da Cruz" },
    { type: "prayer", text: "Em nome do Pai, do Filho e do Espírito Santo. Amém." },

    { type: "title", text: "Oração Inicial" },
    {
      type: "prayer",
      text: `Ó glorioso São João Bosco, pai e mestre da juventude, cheio de zelo apostólico e amor pelos jovens, com confiança recorremos à vossa intercessão.

Vós que dedicastes toda a vossa vida à educação cristã, à evangelização e à salvação das almas, ajudai-nos a viver com alegria, fé e confiança em Deus.

Concedei-nos a graça de rezar esta novena com coração sincero, para que, por vossa intercessão, possamos crescer no amor a Deus, no serviço ao próximo e alcançar as graças que necessitamos, se forem da vontade do Senhor.

Amém.`
    },

    { type: "title", text: "Oração do dia" },
    {
      type: "text",
      text: `Ó São João Bosco, desde jovem sentistes o chamado de Deus para uma grande missão.

Ensinai-nos a escutar a voz do Senhor e a responder com generosidade ao Seu chamado.

Que saibamos confiar nos planos de Deus para nossa vida.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
    },

    { type: "title", text: "Oração Final" },
    {
      type: "prayer",
      text: `Ó São João Bosco, pai e mestre da juventude, rogai por nós.

Ajudai-nos a viver com alegria, fé e amor, servindo a Deus e ao próximo com generosidade.

Amém.`
    }
  ]
},
{
  novenaId: "novena_sao_joao_bosco",
  day: 2,
  title: "Segundo dia – São João Bosco, amigo dos jovens",
  sections: [
    { type: "title", text: "Sinal da Cruz" },
    { type: "prayer", text: "Em nome do Pai, do Filho e do Espírito Santo. Amém." },

    { type: "title", text: "Oração Inicial" },
    {
      type: "prayer",
      text: `Ó glorioso São João Bosco, pai e mestre da juventude, cheio de zelo apostólico e amor pelos jovens, com confiança recorremos à vossa intercessão.

Vós que dedicastes toda a vossa vida à educação cristã, à evangelização e à salvação das almas, ajudai-nos a viver com alegria, fé e confiança em Deus.

Concedei-nos a graça de rezar esta novena com coração sincero, para que, por vossa intercessão, possamos crescer no amor a Deus, no serviço ao próximo e alcançar as graças que necessitamos, se forem da vontade do Senhor.

Amém.`
    },

    { type: "title", text: "Oração do dia" },
    {
      type: "text",
      text: `Ó São João Bosco, dedicastes vosso coração e vossa vida aos jovens, especialmente aos mais pobres e abandonados.

Ajudai-nos a amar, compreender e orientar os jovens com paciência e caridade.

Que saibamos ser sinais do amor de Deus para todos.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
    },

    { type: "title", text: "Oração Final" },
    {
      type: "prayer",
      text: `Ó São João Bosco, pai e mestre da juventude, rogai por nós.

Ajudai-nos a viver com alegria, fé e amor, servindo a Deus e ao próximo com generosidade.

Amém.`
    }
  ]
},
{
  novenaId: "novena_sao_joao_bosco",
  day: 3,
  title: "Terceiro dia – São João Bosco, educador cristão",
  sections: [
    { type: "title", text: "Sinal da Cruz" },
    { type: "prayer", text: "Em nome do Pai, do Filho e do Espírito Santo. Amém." },

    { type: "title", text: "Oração Inicial" },
    {
      type: "prayer",
      text: `Ó glorioso São João Bosco, pai e mestre da juventude, cheio de zelo apostólico e amor pelos jovens, com confiança recorremos à vossa intercessão.

Vós que dedicastes toda a vossa vida à educação cristã, à evangelização e à salvação das almas, ajudai-nos a viver com alegria, fé e confiança em Deus.

Concedei-nos a graça de rezar esta novena com coração sincero, para que, por vossa intercessão, possamos crescer no amor a Deus, no serviço ao próximo e alcançar as graças que necessitamos, se forem da vontade do Senhor.

Amém.`
    },

    { type: "title", text: "Oração do dia" },
    {
      type: "text",
      text: `Ó São João Bosco, ensinastes que educar é um ato de amor e responsabilidade.

Ajudai-nos a educar com bondade, firmeza e exemplo de vida cristã.

Que nossos ensinamentos conduzam sempre ao bem e à verdade.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
    },

    { type: "title", text: "Oração Final" },
    {
      type: "prayer",
      text: `Ó São João Bosco, pai e mestre da juventude, rogai por nós.

Ajudai-nos a viver com alegria, fé e amor, servindo a Deus e ao próximo com generosidade.

Amém.`
    }
  ]
},
{
  novenaId: "novena_sao_joao_bosco",
  day: 4,
  title: "Quarto dia – São João Bosco, modelo de paciência e alegria",
  sections: [
    { type: "title", text: "Sinal da Cruz" },
    { type: "prayer", text: "Em nome do Pai, do Filho e do Espírito Santo. Amém." },

    { type: "title", text: "Oração Inicial" },
    {
      type: "prayer",
      text: `Ó glorioso São João Bosco, pai e mestre da juventude, cheio de zelo apostólico e amor pelos jovens, com confiança recorremos à vossa intercessão.

Vós que dedicastes toda a vossa vida à educação cristã, à evangelização e à salvação das almas, ajudai-nos a viver com alegria, fé e confiança em Deus.

Concedei-nos a graça de rezar esta novena com coração sincero, para que, por vossa intercessão, possamos crescer no amor a Deus, no serviço ao próximo e alcançar as graças que necessitamos, se forem da vontade do Senhor.

Amém.`
    },

    { type: "title", text: "Oração do dia" },
    {
      type: "text",
      text: `Ó São João Bosco, mesmo diante das dificuldades, mantivestes a alegria e a confiança em Deus.

Ensinai-nos a viver com serenidade e esperança, superando os desafios com fé.

Que a alegria cristã seja sinal da presença de Deus em nossa vida.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
    },

    { type: "title", text: "Oração Final" },
    {
      type: "prayer",
      text: `Ó São João Bosco, pai e mestre da juventude, rogai por nós.

Ajudai-nos a viver com alegria, fé e amor, servindo a Deus e ao próximo com generosidade.

Amém.`
    }
  ]
},
{
  novenaId: "novena_sao_joao_bosco",
  day: 5,
  title: "Quinto dia – São João Bosco, zeloso evangelizador",
  sections: [
    { type: "title", text: "Sinal da Cruz" },
    { type: "prayer", text: "Em nome do Pai, do Filho e do Espírito Santo. Amém." },

    { type: "title", text: "Oração Inicial" },
    {
      type: "prayer",
      text: `Ó glorioso São João Bosco, pai e mestre da juventude, cheio de zelo apostólico e amor pelos jovens, com confiança recorremos à vossa intercessão.

Vós que dedicastes toda a vossa vida à educação cristã, à evangelização e à salvação das almas, ajudai-nos a viver com alegria, fé e confiança em Deus.

Concedei-nos a graça de rezar esta novena com coração sincero, para que, por vossa intercessão, possamos crescer no amor a Deus, no serviço ao próximo e alcançar as graças que necessitamos, se forem da vontade do Senhor.

Amém.`
    },

    { type: "title", text: "Oração do dia" },
    {
      type: "text",
      text: `Ó São João Bosco, anunciastes o Evangelho com ardor e criatividade.

Ajudai-nos a testemunhar nossa fé com palavras e atitudes.

Que sejamos missionários no ambiente em que vivemos.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
    },

    { type: "title", text: "Oração Final" },
    {
      type: "prayer",
      text: `Ó São João Bosco, pai e mestre da juventude, rogai por nós.

Ajudai-nos a viver com alegria, fé e amor, servindo a Deus e ao próximo com generosidade.

Amém.`
    }
  ]
},
{
  novenaId: "novena_sao_joao_bosco",
  day: 6,
  title: "Sexto dia – São João Bosco, confiança em Maria Auxiliadora",
  sections: [
    { type: "title", text: "Sinal da Cruz" },
    { type: "prayer", text: "Em nome do Pai, do Filho e do Espírito Santo. Amém." },

    { type: "title", text: "Oração Inicial" },
    {
      type: "prayer",
      text: `Ó glorioso São João Bosco, pai e mestre da juventude, cheio de zelo apostólico e amor pelos jovens, com confiança recorremos à vossa intercessão.

Vós que dedicastes toda a vossa vida à educação cristã, à evangelização e à salvação das almas, ajudai-nos a viver com alegria, fé e confiança em Deus.

Concedei-nos a graça de rezar esta novena com coração sincero, para que, por vossa intercessão, possamos crescer no amor a Deus, no serviço ao próximo e alcançar as graças que necessitamos, se forem da vontade do Senhor.

Amém.`
    },

    { type: "title", text: "Oração do dia" },
    {
      type: "text",
      text: `Ó São João Bosco, tivestes profunda devoção a Maria Auxiliadora.

Ensinai-nos a confiar na intercessão da Virgem Maria em todas as necessidades.

Que Maria nos conduza sempre a Jesus.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
    },

    { type: "title", text: "Oração Final" },
    {
      type: "prayer",
      text: `Ó São João Bosco, pai e mestre da juventude, rogai por nós.

Ajudai-nos a viver com alegria, fé e amor, servindo a Deus e ao próximo com generosidade.

Amém.`
    }
  ]
},
{
  novenaId: "novena_sao_joao_bosco",
  day: 7,
  title: "Sétimo dia – São João Bosco, pastor dedicado",
  sections: [
    { type: "title", text: "Sinal da Cruz" },
    { type: "prayer", text: "Em nome do Pai, do Filho e do Espírito Santo. Amém." },

    { type: "title", text: "Oração Inicial" },
    {
      type: "prayer",
      text: `Ó glorioso São João Bosco, pai e mestre da juventude, cheio de zelo apostólico e amor pelos jovens, com confiança recorremos à vossa intercessão.

Vós que dedicastes toda a vossa vida à educação cristã, à evangelização e à salvação das almas, ajudai-nos a viver com alegria, fé e confiança em Deus.

Concedei-nos a graça de rezar esta novena com coração sincero, para que, por vossa intercessão, possamos crescer no amor a Deus, no serviço ao próximo e alcançar as graças que necessitamos, se forem da vontade do Senhor.

Amém.`
    },

    { type: "title", text: "Oração do dia" },
    {
      type: "text",
      text: `Ó São João Bosco, cuidastes das almas com zelo, amor e sacrifício.

Intercedei por todos os educadores, catequistas e pastores da Igreja.

Ajudai-nos a servir com generosidade e fidelidade.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
    },

    { type: "title", text: "Oração Final" },
    {
      type: "prayer",
      text: `Ó São João Bosco, pai e mestre da juventude, rogai por nós.

Ajudai-nos a viver com alegria, fé e amor, servindo a Deus e ao próximo com generosidade.

Amém.`
    }
  ]
},
{
  novenaId: "novena_sao_joao_bosco",
  day: 8,
  title: "Oitavo dia – São João Bosco, exemplo de confiança em Deus",
  sections: [
    { type: "title", text: "Sinal da Cruz" },
    { type: "prayer", text: "Em nome do Pai, do Filho e do Espírito Santo. Amém." },

    { type: "title", text: "Oração Inicial" },
    {
      type: "prayer",
      text: `Ó glorioso São João Bosco, pai e mestre da juventude, cheio de zelo apostólico e amor pelos jovens, com confiança recorremos à vossa intercessão.

Vós que dedicastes toda a vossa vida à educação cristã, à evangelização e à salvação das almas, ajudai-nos a viver com alegria, fé e confiança em Deus.

Concedei-nos a graça de rezar esta novena com coração sincero, para que, por vossa intercessão, possamos crescer no amor a Deus, no serviço ao próximo e alcançar as graças que necessitamos, se forem da vontade do Senhor.

Amém.`
    },

    { type: "title", text: "Oração do dia" },
    {
      type: "text",
      text: `Ó São João Bosco, mesmo diante das dificuldades materiais e humanas, confiastes plenamente na Providência Divina.

Ensinai-nos a confiar em Deus e a não desanimar diante das provações.

Que nossa fé seja firme e perseverante.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
    },

    { type: "title", text: "Oração Final" },
    {
      type: "prayer",
      text: `Ó São João Bosco, pai e mestre da juventude, rogai por nós.

Ajudai-nos a viver com alegria, fé e amor, servindo a Deus e ao próximo com generosidade.

Amém.`
    }
  ]
},
{
  novenaId: "novena_sao_joao_bosco",
  day: 9,
  title: "Nono dia – São João Bosco, intercessor da juventude e da Igreja",
  sections: [
    { type: "title", text: "Sinal da Cruz" },
    { type: "prayer", text: "Em nome do Pai, do Filho e do Espírito Santo. Amém." },

    { type: "title", text: "Oração Inicial" },
    {
      type: "prayer",
      text: `Ó glorioso São João Bosco, pai e mestre da juventude, cheio de zelo apostólico e amor pelos jovens, com confiança recorremos à vossa intercessão.

Vós que dedicastes toda a vossa vida à educação cristã, à evangelização e à salvação das almas, ajudai-nos a viver com alegria, fé e confiança em Deus.

Concedei-nos a graça de rezar esta novena com coração sincero, para que, por vossa intercessão, possamos crescer no amor a Deus, no serviço ao próximo e alcançar as graças que necessitamos, se forem da vontade do Senhor.

Amém.`
    },

    { type: "title", text: "Oração do dia" },
    {
      type: "text",
      text: `Ó glorioso São João Bosco, confiamos em vossa poderosa intercessão.

Apresentai a Deus nossas intenções, especialmente pelos jovens, pelas famílias e pela Igreja.

Conduzi-nos no caminho da fé, da esperança e do amor.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
    },

    { type: "title", text: "Oração Final" },
    {
      type: "prayer",
      text: `Ó São João Bosco, pai e mestre da juventude, rogai por nós.

Ajudai-nos a viver com alegria, fé e amor, servindo a Deus e ao próximo com generosidade.

Amém.`
    }
  ]
},
// ===== Novena a Nossa Senhora das Candeias =====
{
  novenaId: "novena_nossa_senhora_das_candeias",
  day: 1,
  title: "Primeiro dia – Nossa Senhora das Candeias, Mãe da Luz",
  sections: [
    { type: "title", text: "Sinal da Cruz" },
    { type: "prayer", text: "Em nome do Pai, do Filho e do Espírito Santo. Amém." },

    { type: "title", text: "Oração Inicial" },
    {
      type: "prayer",
      text: `Ó Nossa Senhora das Candeias, Mãe Santíssima que apresentastes o Menino Jesus no templo como luz para iluminar todas as nações, com confiança recorremos à vossa intercessão.

Vós levastes em vossos braços a Luz do mundo e ensinastes a humanidade a caminhar na fé, na obediência e na esperança.

Concedei-nos a graça de rezar esta novena com coração sincero, para que, iluminados por Cristo, possamos viver segundo a vontade de Deus e alcançar as graças que necessitamos, se forem de Seu agrado.

Amém.`
    },

    { type: "title", text: "Oração do dia" },
    {
      type: "text",
      text: `Ó Nossa Senhora das Candeias, apresentastes Jesus como luz que dissipa as trevas do mundo.

Ajudai-nos a acolher Cristo em nossa vida e a caminhar sempre na Sua luz.

Que jamais nos afastemos do caminho da verdade.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
    },

    { type: "title", text: "Oração Final" },
    {
      type: "prayer",
      text: `Ó Nossa Senhora das Candeias, Mãe da Luz e da Esperança, rogai por nós.

Ajudai-nos a caminhar sempre iluminados por Cristo, vivendo na fé, na esperança e no amor.

Amém.`
    }
  ]
},
{
  novenaId: "novena_nossa_senhora_das_candeias",
  day: 2,
  title: "Segundo dia – Nossa Senhora das Candeias, obediência a Deus",
  sections: [
    { type: "title", text: "Sinal da Cruz" },
    { type: "prayer", text: "Em nome do Pai, do Filho e do Espírito Santo. Amém." },

    { type: "title", text: "Oração Inicial" },
    {
      type: "prayer",
      text: `Ó Nossa Senhora das Candeias, Mãe Santíssima que apresentastes o Menino Jesus no templo como luz para iluminar todas as nações, com confiança recorremos à vossa intercessão.

Vós levastes em vossos braços a Luz do mundo e ensinastes a humanidade a caminhar na fé, na obediência e na esperança.

Concedei-nos a graça de rezar esta novena com coração sincero, para que, iluminados por Cristo, possamos viver segundo a vontade de Deus e alcançar as graças que necessitamos, se forem de Seu agrado.

Amém.`
    },

    { type: "title", text: "Oração do dia" },
    {
      type: "text",
      text: `Ó Mãe Santíssima, cumpristes fielmente a Lei do Senhor ao apresentar vosso Filho no templo.

Ensinai-nos a viver na obediência à vontade de Deus, mesmo quando não compreendemos plenamente Seus desígnios.

Que nossa vida seja marcada pela fidelidade.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
    },

    { type: "title", text: "Oração Final" },
    {
      type: "prayer",
      text: `Ó Nossa Senhora das Candeias, Mãe da Luz e da Esperança, rogai por nós.

Ajudai-nos a caminhar sempre iluminados por Cristo, vivendo na fé, na esperança e no amor.

Amém.`
    }
  ]
},
{
  novenaId: "novena_nossa_senhora_das_candeias",
  day: 3,
  title: "Terceiro dia – Nossa Senhora das Candeias, exemplo de humildade",
  sections: [
    { type: "title", text: "Sinal da Cruz" },
    { type: "prayer", text: "Em nome do Pai, do Filho e do Espírito Santo. Amém." },

    { type: "title", text: "Oração Inicial" },
    {
      type: "prayer",
      text: `Ó Nossa Senhora das Candeias, Mãe Santíssima que apresentastes o Menino Jesus no templo como luz para iluminar todas as nações, com confiança recorremos à vossa intercessão.

Vós levastes em vossos braços a Luz do mundo e ensinastes a humanidade a caminhar na fé, na obediência e na esperança.

Concedei-nos a graça de rezar esta novena com coração sincero, para que, iluminados por Cristo, possamos viver segundo a vontade de Deus e alcançar as graças que necessitamos, se forem de Seu agrado.

Amém.`
    },

    { type: "title", text: "Oração do dia" },
    {
      type: "text",
      text: `Ó Nossa Senhora das Candeias, mesmo sendo Mãe de Deus, apresentastes uma simples oferta no templo.

Ensinai-nos a viver com humildade, desapegados do orgulho e da vaidade.

Que nosso coração seja simples e sincero diante de Deus.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
    },

    { type: "title", text: "Oração Final" },
    {
      type: "prayer",
      text: `Ó Nossa Senhora das Candeias, Mãe da Luz e da Esperança, rogai por nós.

Ajudai-nos a caminhar sempre iluminados por Cristo, vivendo na fé, na esperança e no amor.

Amém.`
    }
  ]
},
{
  novenaId: "novena_nossa_senhora_das_candeias",
  day: 4,
  title: "Quarto dia – Nossa Senhora das Candeias, Mãe da esperança",
  sections: [
    { type: "title", text: "Sinal da Cruz" },
    { type: "prayer", text: "Em nome do Pai, do Filho e do Espírito Santo. Amém." },

    { type: "title", text: "Oração Inicial" },
    {
      type: "prayer",
      text: `Ó Nossa Senhora das Candeias, Mãe Santíssima que apresentastes o Menino Jesus no templo como luz para iluminar todas as nações, com confiança recorremos à vossa intercessão.

Vós levastes em vossos braços a Luz do mundo e ensinastes a humanidade a caminhar na fé, na obediência e na esperança.

Concedei-nos a graça de rezar esta novena com coração sincero, para que, iluminados por Cristo, possamos viver segundo a vontade de Deus e alcançar as graças que necessitamos, se forem de Seu agrado.

Amém.`
    },

    { type: "title", text: "Oração do dia" },
    {
      type: "text",
      text: `Ó Mãe Santíssima, Simeão e Ana reconheceram em vosso Filho a esperança de Israel.

Ajudai-nos a manter viva a esperança, mesmo nas dificuldades da vida.

Que confiemos sempre nas promessas do Senhor.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
    },

    { type: "title", text: "Oração Final" },
    {
      type: "prayer",
      text: `Ó Nossa Senhora das Candeias, Mãe da Luz e da Esperança, rogai por nós.

Ajudai-nos a caminhar sempre iluminados por Cristo, vivendo na fé, na esperança e no amor.

Amém.`
    }
  ]
},
{
  novenaId: "novena_nossa_senhora_das_candeias",
  day: 5,
  title: "Quinto dia – Nossa Senhora das Candeias, consoladora dos aflitos",
  sections: [
    { type: "title", text: "Sinal da Cruz" },
    { type: "prayer", text: "Em nome do Pai, do Filho e do Espírito Santo. Amém." },

    { type: "title", text: "Oração Inicial" },
    {
      type: "prayer",
      text: `Ó Nossa Senhora das Candeias, Mãe Santíssima que apresentastes o Menino Jesus no templo como luz para iluminar todas as nações, com confiança recorremos à vossa intercessão.

Vós levastes em vossos braços a Luz do mundo e ensinastes a humanidade a caminhar na fé, na obediência e na esperança.

Concedei-nos a graça de rezar esta novena com coração sincero, para que, iluminados por Cristo, possamos viver segundo a vontade de Deus e alcançar as graças que necessitamos, se forem de Seu agrado.

Amém.`
    },

    { type: "title", text: "Oração do dia" },
    {
      type: "text",
      text: `Ó Nossa Senhora das Candeias, a profecia de Simeão anunciou dores, mas também a salvação.

Consolai todos os que sofrem no corpo e na alma.

Alcançai-nos a graça da fortaleza e da paz interior.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
    },

    { type: "title", text: "Oração Final" },
    {
      type: "prayer",
      text: `Ó Nossa Senhora das Candeias, Mãe da Luz e da Esperança, rogai por nós.

Ajudai-nos a caminhar sempre iluminados por Cristo, vivendo na fé, na esperança e no amor.

Amém.`
    }
  ]
},
{
  novenaId: "novena_nossa_senhora_das_candeias",
  day: 6,
  title: "Sexto dia – Nossa Senhora das Candeias, Mãe que apresenta Cristo ao mundo",
  sections: [
    { type: "title", text: "Sinal da Cruz" },
    { type: "prayer", text: "Em nome do Pai, do Filho e do Espírito Santo. Amém." },

    { type: "title", text: "Oração Inicial" },
    {
      type: "prayer",
      text: `Ó Nossa Senhora das Candeias, Mãe Santíssima que apresentastes o Menino Jesus no templo como luz para iluminar todas as nações, com confiança recorremos à vossa intercessão.

Vós levastes em vossos braços a Luz do mundo e ensinastes a humanidade a caminhar na fé, na obediência e na esperança.

Concedei-nos a graça de rezar esta novena com coração sincero, para que, iluminados por Cristo, possamos viver segundo a vontade de Deus e alcançar as graças que necessitamos, se forem de Seu agrado.

Amém.`
    },

    { type: "title", text: "Oração do dia" },
    {
      type: "text",
      text: `Ó Mãe Santíssima, apresentastes Jesus não apenas no templo, mas à humanidade inteira.

Ajudai-nos a apresentar Cristo ao mundo por meio de nossas palavras e atitudes.

Que sejamos testemunhas vivas do Evangelho.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
    },

    { type: "title", text: "Oração Final" },
    {
      type: "prayer",
      text: `Ó Nossa Senhora das Candeias, Mãe da Luz e da Esperança, rogai por nós.

Ajudai-nos a caminhar sempre iluminados por Cristo, vivendo na fé, na esperança e no amor.

Amém.`
    }
  ]
},
{
  novenaId: "novena_nossa_senhora_das_candeias",
  day: 7,
  title: "Sétimo dia – Nossa Senhora das Candeias, guia dos que caminham na fé",
  sections: [
    { type: "title", text: "Sinal da Cruz" },
    { type: "prayer", text: "Em nome do Pai, do Filho e do Espírito Santo. Amém." },

    { type: "title", text: "Oração Inicial" },
    {
      type: "prayer",
      text: `Ó Nossa Senhora das Candeias, Mãe Santíssima que apresentastes o Menino Jesus no templo como luz para iluminar todas as nações, com confiança recorremos à vossa intercessão.

Vós levastes em vossos braços a Luz do mundo e ensinastes a humanidade a caminhar na fé, na obediência e na esperança.

Concedei-nos a graça de rezar esta novena com coração sincero, para que, iluminados por Cristo, possamos viver segundo a vontade de Deus e alcançar as graças que necessitamos, se forem de Seu agrado.

Amém.`
    },

    { type: "title", text: "Oração do dia" },
    {
      type: "text",
      text: `Ó Nossa Senhora das Candeias, vós sois luz no caminho dos que buscam a Deus.

Conduzi-nos com segurança pelas estradas da vida.

Que nunca nos percamos nas trevas do pecado.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
    },

    { type: "title", text: "Oração Final" },
    {
      type: "prayer",
      text: `Ó Nossa Senhora das Candeias, Mãe da Luz e da Esperança, rogai por nós.

Ajudai-nos a caminhar sempre iluminados por Cristo, vivendo na fé, na esperança e no amor.

Amém.`
    }
  ]
},
{
  novenaId: "novena_nossa_senhora_das_candeias",
  day: 8,
  title: "Oitavo dia – Nossa Senhora das Candeias, protetora das famílias",
  sections: [
    { type: "title", text: "Sinal da Cruz" },
    { type: "prayer", text: "Em nome do Pai, do Filho e do Espírito Santo. Amém." },

    { type: "title", text: "Oração Inicial" },
    {
      type: "prayer",
      text: `Ó Nossa Senhora das Candeias, Mãe Santíssima que apresentastes o Menino Jesus no templo como luz para iluminar todas as nações, com confiança recorremos à vossa intercessão.

Vós levastes em vossos braços a Luz do mundo e ensinastes a humanidade a caminhar na fé, na obediência e na esperança.

Concedei-nos a graça de rezar esta novena com coração sincero, para que, iluminados por Cristo, possamos viver segundo a vontade de Deus e alcançar as graças que necessitamos, se forem de Seu agrado.

Amém.`
    },

    { type: "title", text: "Oração do dia" },
    {
      type: "text",
      text: `Ó Mãe Santíssima, apresentastes Jesus acompanhado de São José, em união e amor familiar.

Protegei nossas famílias e ajudai-as a viver na fé, na paz e na união.

Que nossos lares sejam iluminados pela presença de Cristo.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
    },

    { type: "title", text: "Oração Final" },
    {
      type: "prayer",
      text: `Ó Nossa Senhora das Candeias, Mãe da Luz e da Esperança, rogai por nós.

Ajudai-nos a caminhar sempre iluminados por Cristo, vivendo na fé, na esperança e no amor.

Amém.`
    }
  ]
},
{
  novenaId: "novena_nossa_senhora_das_candeias",
  day: 9,
  title: "Nono dia – Nossa Senhora das Candeias, intercessora junto a Deus",
  sections: [
    { type: "title", text: "Sinal da Cruz" },
    { type: "prayer", text: "Em nome do Pai, do Filho e do Espírito Santo. Amém." },

    { type: "title", text: "Oração Inicial" },
    {
      type: "prayer",
      text: `Ó Nossa Senhora das Candeias, Mãe Santíssima que apresentastes o Menino Jesus no templo como luz para iluminar todas as nações, com confiança recorremos à vossa intercessão.

Vós levastes em vossos braços a Luz do mundo e ensinastes a humanidade a caminhar na fé, na obediência e na esperança.

Concedei-nos a graça de rezar esta novena com coração sincero, para que, iluminados por Cristo, possamos viver segundo a vontade de Deus e alcançar as graças que necessitamos, se forem de Seu agrado.

Amém.`
    },

    { type: "title", text: "Oração do dia" },
    {
      type: "text",
      text: `Ó Nossa Senhora das Candeias, confiamos em vossa poderosa intercessão.

Apresentai a Deus nossos pedidos, necessidades e intenções.

Iluminai nossa vida com a luz de Cristo e conduzi-nos sempre no caminho da salvação.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
    },

    { type: "title", text: "Oração Final" },
    {
      type: "prayer",
      text: `Ó Nossa Senhora das Candeias, Mãe da Luz e da Esperança, rogai por nós.

Ajudai-nos a caminhar sempre iluminados por Cristo, vivendo na fé, na esperança e no amor.

Amém.`
    }
  ]
},
// ===== Novena da Purificação =====
{
  novenaId: "novena_purificacao",
  day: 1,
  title: "Primeiro dia – A obediência à Lei do Senhor",
  sections: [
    { type: "title", text: "Sinal da Cruz" },
    { type: "prayer", text: "Em nome do Pai, do Filho e do Espírito Santo. Amém." },

    { type: "title", text: "Oração Inicial" },
    {
      type: "prayer",
      text: `Ó Deus santo e misericordioso, que no mistério da Purificação apresentastes vosso Filho no templo e manifestastes ao mundo a Luz que ilumina todas as nações, nós vos louvamos e bendizemos.

Pela obediência e humildade de Maria Santíssima, ensinai-nos a viver com coração puro, dócil à vossa vontade e aberto à ação da graça.

Concedei-nos a graça de rezar esta novena com fé sincera, para que, purificados no coração e fortalecidos no espírito, possamos viver segundo vosso amor e alcançar as graças que necessitamos, se forem da vossa vontade.

Amém.`
    },

    { type: "title", text: "Oração do dia" },
    {
      type: "text",
      text: `No mistério da Purificação, Maria e José cumprem fielmente a Lei do Senhor.

Peçamos a graça de viver na obediência a Deus, mesmo quando não compreendemos plenamente Seus desígnios.

Que nossa vida seja marcada pela fidelidade e pela confiança.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
    },

    { type: "title", text: "Oração Final" },
    {
      type: "prayer",
      text: `Ó Deus de luz e misericórdia, que na Purificação revelastes vosso Filho como salvação do mundo, nós vos agradecemos por tão grande mistério.

Purificai nosso coração, fortalecei nossa fé e conduzi-nos sempre na luz de Cristo.

Amém.`
    }
  ]
},
{
  novenaId: "novena_purificacao",
  day: 2,
  title: "Segundo dia – Maria, modelo de humildade",
  sections: [
    { type: "title", text: "Sinal da Cruz" },
    { type: "prayer", text: "Em nome do Pai, do Filho e do Espírito Santo. Amém." },

    { type: "title", text: "Oração Inicial" },
    {
      type: "prayer",
      text: `Ó Deus santo e misericordioso, que no mistério da Purificação apresentastes vosso Filho no templo e manifestastes ao mundo a Luz que ilumina todas as nações, nós vos louvamos e bendizemos.

Pela obediência e humildade de Maria Santíssima, ensinai-nos a viver com coração puro, dócil à vossa vontade e aberto à ação da graça.

Concedei-nos a graça de rezar esta novena com fé sincera, para que, purificados no coração e fortalecidos no espírito, possamos viver segundo vosso amor e alcançar as graças que necessitamos, se forem da vossa vontade.

Amém.`
    },

    { type: "title", text: "Oração do dia" },
    {
      type: "text",
      text: `A Mãe de Deus, isenta de pecado, apresenta-se no templo como qualquer outra mulher.

Ensinai-nos, Senhor, a verdadeira humildade, que reconhece nossa dependência de Deus.

Que saibamos viver com simplicidade e coração sincero.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
    },

    { type: "title", text: "Oração Final" },
    {
      type: "prayer",
      text: `Ó Deus de luz e misericórdia, que na Purificação revelastes vosso Filho como salvação do mundo, nós vos agradecemos por tão grande mistério.

Purificai nosso coração, fortalecei nossa fé e conduzi-nos sempre na luz de Cristo.

Amém.`
    }
  ]
},
{
  novenaId: "novena_purificacao",
  day: 3,
  title: "Terceiro dia – Jesus, luz para iluminar as nações",
  sections: [
    { type: "title", text: "Sinal da Cruz" },
    { type: "prayer", text: "Em nome do Pai, do Filho e do Espírito Santo. Amém." },

    { type: "title", text: "Oração Inicial" },
    {
      type: "prayer",
      text: `Ó Deus santo e misericordioso, que no mistério da Purificação apresentastes vosso Filho no templo e manifestastes ao mundo a Luz que ilumina todas as nações, nós vos louvamos e bendizemos.

Pela obediência e humildade de Maria Santíssima, ensinai-nos a viver com coração puro, dócil à vossa vontade e aberto à ação da graça.

Concedei-nos a graça de rezar esta novena com fé sincera, para que, purificados no coração e fortalecidos no espírito, possamos viver segundo vosso amor e alcançar as graças que necessitamos, se forem da vossa vontade.

Amém.`
    },

    { type: "title", text: "Oração do dia" },
    {
      type: "text",
      text: `Na apresentação no templo, Jesus é proclamado luz para todos os povos.

Ajudai-nos a acolher Cristo como luz de nossa vida, dissipando as trevas do pecado e da indiferença.

Que caminhemos sempre guiados por Sua luz.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
    },

    { type: "title", text: "Oração Final" },
    {
      type: "prayer",
      text: `Ó Deus de luz e misericórdia, que na Purificação revelastes vosso Filho como salvação do mundo, nós vos agradecemos por tão grande mistério.

Purificai nosso coração, fortalecei nossa fé e conduzi-nos sempre na luz de Cristo.

Amém.`
    }
  ]
},
{
  novenaId: "novena_purificacao",
  day: 4,
  title: "Quarto dia – A esperança de Simeão e Ana",
  sections: [
    { type: "title", text: "Sinal da Cruz" },
    { type: "prayer", text: "Em nome do Pai, do Filho e do Espírito Santo. Amém." },

    { type: "title", text: "Oração Inicial" },
    {
      type: "prayer",
      text: `Ó Deus santo e misericordioso, que no mistério da Purificação apresentastes vosso Filho no templo e manifestastes ao mundo a Luz que ilumina todas as nações, nós vos louvamos e bendizemos.

Pela obediência e humildade de Maria Santíssima, ensinai-nos a viver com coração puro, dócil à vossa vontade e aberto à ação da graça.

Concedei-nos a graça de rezar esta novena com fé sincera, para que, purificados no coração e fortalecidos no espírito, possamos viver segundo vosso amor e alcançar as graças que necessitamos, se forem da vossa vontade.

Amém.`
    },

    { type: "title", text: "Oração do dia" },
    {
      type: "text",
      text: `Simeão e Ana reconheceram no Menino Jesus o cumprimento das promessas de Deus.

Ensinai-nos a esperar com paciência e fé a realização da vossa vontade.

Que nossa esperança jamais se perca diante das dificuldades.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
    },

    { type: "title", text: "Oração Final" },
    {
      type: "prayer",
      text: `Ó Deus de luz e misericórdia, que na Purificação revelastes vosso Filho como salvação do mundo, nós vos agradecemos por tão grande mistério.

Purificai nosso coração, fortalecei nossa fé e conduzi-nos sempre na luz de Cristo.

Amém.`
    }
  ]
},
{
  novenaId: "novena_purificacao",
  day: 5,
  title: "Quinto dia – A profecia da dor e da salvação",
  sections: [
    { type: "title", text: "Sinal da Cruz" },
    { type: "prayer", text: "Em nome do Pai, do Filho e do Espírito Santo. Amém." },

    { type: "title", text: "Oração Inicial" },
    {
      type: "prayer",
      text: `Ó Deus santo e misericordioso, que no mistério da Purificação apresentastes vosso Filho no templo e manifestastes ao mundo a Luz que ilumina todas as nações, nós vos louvamos e bendizemos.

Pela obediência e humildade de Maria Santíssima, ensinai-nos a viver com coração puro, dócil à vossa vontade e aberto à ação da graça.

Concedei-nos a graça de rezar esta novena com fé sincera, para que, purificados no coração e fortalecidos no espírito, possamos viver segundo vosso amor e alcançar as graças que necessitamos, se forem da vossa vontade.

Amém.`
    },

    { type: "title", text: "Oração do dia" },
    {
      type: "text",
      text: `Simeão anuncia que uma espada de dor transpassará o coração de Maria.

Ajudai-nos a aceitar os sofrimentos da vida unidos a Cristo.

Que saibamos transformar a dor em oferta de amor e salvação.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
    },

    { type: "title", text: "Oração Final" },
    {
      type: "prayer",
      text: `Ó Deus de luz e misericórdia, que na Purificação revelastes vosso Filho como salvação do mundo, nós vos agradecemos por tão grande mistério.

Purificai nosso coração, fortalecei nossa fé e conduzi-nos sempre na luz de Cristo.

Amém.`
    }
  ]
},
{
  novenaId: "novena_purificacao",
  day: 6,
  title: "Sexto dia – A purificação do coração",
  sections: [
    { type: "title", text: "Sinal da Cruz" },
    { type: "prayer", text: "Em nome do Pai, do Filho e do Espírito Santo. Amém." },

    { type: "title", text: "Oração Inicial" },
    {
      type: "prayer",
      text: `Ó Deus santo e misericordioso, que no mistério da Purificação apresentastes vosso Filho no templo e manifestastes ao mundo a Luz que ilumina todas as nações, nós vos louvamos e bendizemos.

Pela obediência e humildade de Maria Santíssima, ensinai-nos a viver com coração puro, dócil à vossa vontade e aberto à ação da graça.

Concedei-nos a graça de rezar esta novena com fé sincera, para que, purificados no coração e fortalecidos no espírito, possamos viver segundo vosso amor e alcançar as graças que necessitamos, se forem da vossa vontade.

Amém.`
    },

    { type: "title", text: "Oração do dia" },
    {
      type: "text",
      text: `O rito da Purificação recorda-nos a necessidade de um coração limpo diante de Deus.

Concedei-nos a graça da conversão sincera e do arrependimento verdadeiro.

Purificai nosso coração de todo pecado e egoísmo.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
    },

    { type: "title", text: "Oração Final" },
    {
      type: "prayer",
      text: `Ó Deus de luz e misericórdia, que na Purificação revelastes vosso Filho como salvação do mundo, nós vos agradecemos por tão grande mistério.

Purificai nosso coração, fortalecei nossa fé e conduzi-nos sempre na luz de Cristo.

Amém.`
    }
  ]
},
{
  novenaId: "novena_purificacao",
  day: 7,
  title: "Sétimo dia – A oferta a Deus",
  sections: [
    { type: "title", text: "Sinal da Cruz" },
    { type: "prayer", text: "Em nome do Pai, do Filho e do Espírito Santo. Amém." },

    { type: "title", text: "Oração Inicial" },
    {
      type: "prayer",
      text: `Ó Deus santo e misericordioso, que no mistério da Purificação apresentastes vosso Filho no templo e manifestastes ao mundo a Luz que ilumina todas as nações, nós vos louvamos e bendizemos.

Pela obediência e humildade de Maria Santíssima, ensinai-nos a viver com coração puro, dócil à vossa vontade e aberto à ação da graça.

Concedei-nos a graça de rezar esta novena com fé sincera, para que, purificados no coração e fortalecidos no espírito, possamos viver segundo vosso amor e alcançar as graças que necessitamos, se forem da vossa vontade.

Amém.`
    },

    { type: "title", text: "Oração do dia" },
    {
      type: "text",
      text: `Maria e José oferecem ao Senhor o que tinham de mais precioso: seu próprio Filho.

Ensinai-nos a oferecer nossa vida, nosso trabalho e nossas alegrias ao Senhor.

Que sejamos oferta viva e agradável a Deus.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
    },

    { type: "title", text: "Oração Final" },
    {
      type: "prayer",
      text: `Ó Deus de luz e misericórdia, que na Purificação revelastes vosso Filho como salvação do mundo, nós vos agradecemos por tão grande mistério.

Purificai nosso coração, fortalecei nossa fé e conduzi-nos sempre na luz de Cristo.

Amém.`
    }
  ]
},
{
  novenaId: "novena_purificacao",
  day: 8,
  title: "Oitavo dia – A presença de Deus no templo",
  sections: [
    { type: "title", text: "Sinal da Cruz" },
    { type: "prayer", text: "Em nome do Pai, do Filho e do Espírito Santo. Amém." },

    { type: "title", text: "Oração Inicial" },
    {
      type: "prayer",
      text: `Ó Deus santo e misericordioso, que no mistério da Purificação apresentastes vosso Filho no templo e manifestastes ao mundo a Luz que ilumina todas as nações, nós vos louvamos e bendizemos.

Pela obediência e humildade de Maria Santíssima, ensinai-nos a viver com coração puro, dócil à vossa vontade e aberto à ação da graça.

Concedei-nos a graça de rezar esta novena com fé sincera, para que, purificados no coração e fortalecidos no espírito, possamos viver segundo vosso amor e alcançar as graças que necessitamos, se forem da vossa vontade.

Amém.`
    },

    { type: "title", text: "Oração do dia" },
    {
      type: "text",
      text: `No templo, Deus se faz presente de modo simples e silencioso.

Ajudai-nos a reconhecer vossa presença em nossa vida cotidiana.

Que nossos corações sejam templo vivo do Espírito Santo.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
    },

    { type: "title", text: "Oração Final" },
    {
      type: "prayer",
      text: `Ó Deus de luz e misericórdia, que na Purificação revelastes vosso Filho como salvação do mundo, nós vos agradecemos por tão grande mistério.

Purificai nosso coração, fortalecei nossa fé e conduzi-nos sempre na luz de Cristo.

Amém.`
    }
  ]
},
{
  novenaId: "novena_purificacao",
  day: 9,
  title: "Nono dia – Caminhar na luz de Cristo",
  sections: [
    { type: "title", text: "Sinal da Cruz" },
    { type: "prayer", text: "Em nome do Pai, do Filho e do Espírito Santo. Amém." },

    { type: "title", text: "Oração Inicial" },
    {
      type: "prayer",
      text: `Ó Deus santo e misericordioso, que no mistério da Purificação apresentastes vosso Filho no templo e manifestastes ao mundo a Luz que ilumina todas as nações, nós vos louvamos e bendizemos.

Pela obediência e humildade de Maria Santíssima, ensinai-nos a viver com coração puro, dócil à vossa vontade e aberto à ação da graça.

Concedei-nos a graça de rezar esta novena com fé sincera, para que, purificados no coração e fortalecidos no espírito, possamos viver segundo vosso amor e alcançar as graças que necessitamos, se forem da vossa vontade.

Amém.`
    },

    { type: "title", text: "Oração do dia" },
    {
      type: "text",
      text: `Ao concluir esta novena, pedimos a graça de viver sempre iluminados por Cristo.

Que nossa vida seja testemunho de fé, esperança e amor.

Conduzi-nos no caminho da salvação e da vida eterna.

(Pedido pessoal)

Pai-Nosho
Ave-Maria
Glória ao Pai`
    },

    { type: "title", text: "Oração Final" },
    {
      type: "prayer",
      text: `Ó Deus de luz e misericórdia, que na Purificação revelastes vosso Filho como salvação do mundo, nós vos agradecemos por tão grande mistério.

Purificai nosso coração, fortalecei nossa fé e conduzi-nos sempre na luz de Cristo.

Amém.`
    }
  ]
},

// ===== Novena a São Brás =====
{
  novenaId: "novena_sao_bras",
  day: 1,
  title: "Primeiro dia – São Brás, servo fiel de Deus",
  sections: [
    { type: "title", text: "Sinal da Cruz" },
    { type: "prayer", text: "Em nome do Pai, do Filho e do Espírito Santo. Amém." },

    { type: "title", text: "Oração Inicial" },
    {
      type: "prayer",
      text: `Ó glorioso São Brás, fiel servo de Deus e mártir da Igreja, com confiança recorremos à vossa poderosa intercessão.

Vós que testemunhastes a fé com coragem e amor, ajudai-nos a viver firmes no Evangelho, confiantes na proteção divina em todas as circunstâncias da vida.

Concedei-nos a graça de rezar esta novena com fé sincera, para que, por vossa intercessão, possamos alcançar as graças que necessitamos, se forem da vontade de Deus.

Amém.`
    },

    { type: "title", text: "Oração do dia" },
    {
      type: "text",
      text: `Ó São Brás, dedicastes vossa vida ao serviço de Deus e do próximo.

Ensinai-nos a viver com fidelidade à nossa vocação cristã.

Que saibamos colocar Deus em primeiro lugar em nossa vida.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
    },

    { type: "title", text: "Oração Final" },
    {
      type: "prayer",
      text: `Ó São Brás, fiel mártir e servo de Deus, rogai por nós.

Protegei-nos em nossas necessidades e ajudai-nos a viver com fé, esperança e amor.

Amém.`
    }
  ]
},
{
  novenaId: "novena_sao_bras",
  day: 2,
  title: "Segundo dia – São Brás, pastor zeloso",
  sections: [
    { type: "title", text: "Sinal da Cruz" },
    { type: "prayer", text: "Em nome do Pai, do Filho e do Espírito Santo. Amém." },

    { type: "title", text: "Oração Inicial" },
    {
      type: "prayer",
      text: `Ó glorioso São Brás, fiel servo de Deus e mártir da Igreja, com confiança recorremos à vossa poderosa intercessão.

Vós que testemunhastes a fé com coragem e amor, ajudai-nos a viver firmes no Evangelho, confiantes na proteção divina em todas as circunstâncias da vida.

Concedei-nos a graça de rezar esta novena com fé sincera, para que, por vossa intercessão, possamos alcançar as graças que necessitamos, se forem da vontade de Deus.

Amém.`
    },

    { type: "title", text: "Oração do dia" },
    {
      type: "text",
      text: `Ó São Brás, como bispo cuidastes do povo que vos foi confiado com amor e dedicação.

Intercedei por todos os pastores da Igreja, para que sejam fiéis e cheios de caridade.

Ajudai-nos a viver em comunhão com a Igreja.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
    },

    { type: "title", text: "Oração Final" },
    {
      type: "prayer",
      text: `Ó São Brás, fiel mártir e servo de Deus, rogai por nós.

Protegei-nos em nossas necessidades e ajudai-nos a viver com fé, esperança e amor.

Amém.`
    }
  ]
},
{
  novenaId: "novena_sao_bras",
  day: 3,
  title: "Terceiro dia – São Brás, exemplo de fé",
  sections: [
    { type: "title", text: "Sinal da Cruz" },
    { type: "prayer", text: "Em nome do Pai, do Filho e do Espírito Santo. Amém." },

    { type: "title", text: "Oração Inicial" },
    {
      type: "prayer",
      text: `Ó glorioso São Brás, fiel servo de Deus e mártir da Igreja, com confiança recorremos à vossa poderosa intercessão.

Vós que testemunhastes a fé com coragem e amor, ajudai-nos a viver firmes no Evangelho, confiantes na proteção divina em todas as circunstâncias da vida.

Concedei-nos a graça de rezar esta novena com fé sincera, para que, por vossa intercessão, possamos alcançar as graças que necessitamos, se forem da vontade de Deus.

Amém.`
    },

    { type: "title", text: "Oração do dia" },
    {
      type: "text",
      text: `Ó São Brás, permanecestes firme na fé mesmo diante da perseguição.

Fortalecei nossa fé nos momentos de dificuldade e provação.

Que jamais nos afastemos do caminho do Senhor.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
    },

    { type: "title", text: "Oração Final" },
    {
      type: "prayer",
      text: `Ó São Brás, fiel mártir e servo de Deus, rogai por nós.

Protegei-nos em nossas necessidades e ajudai-nos a viver com fé, esperança e amor.

Amém.`
    }
  ]
},
{
  novenaId: "novena_sao_bras",
  day: 4,
  title: "Quarto dia – São Brás, protetor contra os males da garganta",
  sections: [
    { type: "title", text: "Sinal da Cruz" },
    { type: "prayer", text: "Em nome do Pai, do Filho e do Espírito Santo. Amém." },

    { type: "title", text: "Oração Inicial" },
    {
      type: "prayer",
      text: `Ó glorioso São Brás, fiel servo de Deus e mártir da Igreja, com confiança recorremos à vossa poderosa intercessão.

Vós que testemunhastes a fé com coragem e amor, ajudai-nos a viver firmes no Evangelho, confiantes na proteção divina em todas as circunstâncias da vida.

Concedei-nos a graça de rezar esta novena com fé sincera, para que, por vossa intercessão, possamos alcançar as graças que necessitamos, se forem da vontade de Deus.

Amém.`
    },

    { type: "title", text: "Oração do dia" },
    {
      type: "text",
      text: `Ó São Brás, invocado como protetor contra os males da garganta.

Intercedei por todos os que sofrem de enfermidades do corpo e da alma.

Concedei-nos saúde e fortaleza segundo a vontade de Deus.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
    },

    { type: "title", text: "Oração Final" },
    {
      type: "prayer",
      text: `Ó São Brás, fiel mártir e servo de Deus, rogai por nós.

Protegei-nos em nossas necessidades e ajudai-nos a viver com fé, esperança e amor.

Amém.`
    }
  ]
},
{
  novenaId: "novena_sao_bras",
  day: 5,
  title: "Quinto dia – São Brás, exemplo de caridade",
  sections: [
    { type: "title", text: "Sinal da Cruz" },
    { type: "prayer", text: "Em nome do Pai, do Filho e do Espírito Santo. Amém." },

    { type: "title", text: "Oração Inicial" },
    {
      type: "prayer",
      text: `Ó glorioso São Brás, fiel servo de Deus e mártir da Igreja, com confiança recorremos à vossa poderosa intercessão.

Vós que testemunhastes a fé com coragem e amor, ajudai-nos a viver firmes no Evangelho, confiantes na proteção divina em todas as circunstâncias da vida.

Concedei-nos a graça de rezar esta novena com fé sincera, para que, por vossa intercessão, possamos alcançar as graças que necessitamos, se forem da vontade de Deus.

Amém.`
    },

    { type: "title", text: "Oração do dia" },
    {
      type: "text",
      text: `Ó São Brás, vossa vida foi marcada pela caridade e pelo cuidado com os necessitados.

Ensinai-nos a amar o próximo com gestos concretos de bondade e solidariedade.

Que nossa vida seja sinal do amor de Deus.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
    },

    { type: "title", text: "Oração Final" },
    {
      type: "prayer",
      text: `Ó São Brás, fiel mártir e servo de Deus, rogai por nós.

Protegei-nos em nossas necessidades e ajudai-nos a viver com fé, esperança e amor.

Amém.`
    }
  ]
},
{
  novenaId: "novena_sao_bras",
  day: 6,
  title: "Sexto dia – São Brás, testemunha da esperança cristã",
  sections: [
    { type: "title", text: "Sinal da Cruz" },
    { type: "prayer", text: "Em nome do Pai, do Filho e do Espírito Santo. Amém." },

    { type: "title", text: "Oração Inicial" },
    {
      type: "prayer",
      text: `Ó glorioso São Brás, fiel servo de Deus e mártir da Igreja, com confiança recorremos à vossa poderosa intercessão.

Vós que testemunhastes a fé com coragem e amor, ajudai-nos a viver firmes no Evangelho, confiantes na proteção divina em todas as circunstâncias da vida.

Concedei-nos a graça de rezar esta novena com fé sincera, para que, por vossa intercessão, possamos alcançar as graças que necessitamos, se forem da vontade de Deus.

Amém.`
    },

    { type: "title", text: "Oração do dia" },
    {
      type: "text",
      text: `Ó São Brás, mesmo diante do martírio, confiastes plenamente em Deus.

Ajudai-nos a manter viva a esperança, mesmo nos momentos de sofrimento.

Que confiemos sempre na misericórdia divina.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
    },

    { type: "title", text: "Oração Final" },
    {
      type: "prayer",
      text: `Ó São Brás, fiel mártir e servo de Deus, rogai por nós.

Protegei-nos em nossas necessidades e ajudai-nos a viver com fé, esperança e amor.

Amém.`
    }
  ]
},
{
  novenaId: "novena_sao_bras",
  day: 7,
  title: "Sétimo dia – São Brás, fortaleza na adversidade",
  sections: [
    { type: "title", text: "Sinal da Cruz" },
    { type: "prayer", text: "Em nome do Pai, do Filho e do Espírito Santo. Amém." },

    { type: "title", text: "Oração Inicial" },
    {
      type: "prayer",
      text: `Ó glorioso São Brás, fiel servo de Deus e mártir da Igreja, com confiança recorremos à vossa poderosa intercessão.

Vós que testemunhastes a fé com coragem e amor, ajudai-nos a viver firmes no Evangelho, confiantes na proteção divina em todas as circunstâncias da vida.

Concedei-nos a graça de rezar esta novena com fé sincera, para que, por vossa intercessão, possamos alcançar as graças que necessitamos, se forem da vontade de Deus.

Amém.`
    },

    { type: "title", text: "Oração do dia" },
    {
      type: "text",
      text: `Ó São Brás, enfrentastes as adversidades com coragem e fé.

Ensinai-nos a suportar as dificuldades da vida com paciência e confiança em Deus.

Que sejamos fortalecidos pela graça divina.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
    },

    { type: "title", text: "Oração Final" },
    {
      type: "prayer",
      text: `Ó São Brás, fiel mártir e servo de Deus, rogai por nós.

Protegei-nos em nossas necessidades e ajudai-nos a viver com fé, esperança e amor.

Amém.`
    }
  ]
},
{
  novenaId: "novena_sao_bras",
  day: 8,
  title: "Oitavo dia – São Brás, modelo de perseverança",
  sections: [
    { type: "title", text: "Sinal da Cruz" },
    { type: "prayer", text: "Em nome do Pai, do Filho e do Espírito Santo. Amém." },

    { type: "title", text: "Oração Inicial" },
    {
      type: "prayer",
      text: `Ó glorioso São Brás, fiel servo de Deus e mártir da Igreja, com confiança recorremos à vossa poderosa intercessão.

Vós que testemunhastes a fé com coragem e amor, ajudai-nos a viver firmes no Evangelho, confiantes na proteção divina em todas as circunstâncias da vida.

Concedei-nos a graça de rezar esta novena com fé sincera, para que, por vossa intercessão, possamos alcançar as graças que necessitamos, se forem da vontade de Deus.

Amém.`
    },

    { type: "title", text: "Oração do dia" },
    {
      type: "text",
      text: `Ó São Brás, perseverastes na fé até o fim de vossa vida.

Ajudai-nos a permanecer firmes no caminho cristão, sem desanimar.

Que sejamos fiéis a Deus em todas as circunstâncias.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
    },

    { type: "title", text: "Oração Final" },
    {
      type: "prayer",
      text: `Ó São Brás, fiel mártir e servo de Deus, rogai por nós.

Protegei-nos em nossas necessidades e ajudai-nos a viver com fé, esperança e amor.

Amém.`
    }
  ]
},
{
  novenaId: "novena_sao_bras",
  day: 9,
  title: "Nono dia – São Brás, intercessor poderoso",
  sections: [
    { type: "title", text: "Sinal da Cruz" },
    { type: "prayer", text: "Em nome do Pai, do Filho e do Espírito Santo. Amém." },

    { type: "title", text: "Oração Inicial" },
    {
      type: "prayer",
      text: `Ó glorioso São Brás, fiel servo de Deus e mártir da Igreja, com confiança recorremos à vossa poderosa intercessão.

Vós que testemunhastes a fé com coragem e amor, ajudai-nos a viver firmes no Evangelho, confiantes na proteção divina em todas as circunstâncias da vida.

Concedei-nos a graça de rezar esta novena com fé sincera, para que, por vossa intercessão, possamos alcançar as graças que necessitamos, se forem da vontade de Deus.

Amém.`
    },

    { type: "title", text: "Oração do dia" },
    {
      type: "text",
      text: `Ó glorioso São Brás, confiamos em vossa poderosa intercessão junto a Deus.

Apresentai ao Senhor nossos pedidos, necessidades e intenções.

Conduzi-nos sempre no caminho da fé e da salvação.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
    },

    { type: "title", text: "Oração Final" },
    {
      type: "prayer",
      text: `Ó São Brás, fiel mártir e servo de Deus, rogai por nós.

Protegei-nos em nossas necessidades e ajudai-nos a viver com fé, esperança e amor.

Amém.`
    }
  ]
},
// ===== Novena a Nossa Senhora de Lourdes =====
{
  novenaId: "novena_nossa_senhora_de_lourdes",
  day: 1,
  title: "Primeiro dia – Nossa Senhora de Lourdes, Mãe Imaculada",
  sections: [
    { type: "title", text: "Sinal da Cruz" },
    { type: "prayer", text: "Em nome do Pai, do Filho e do Espírito Santo. Amém." },

    { type: "title", text: "Oração Inicial" },
    {
      type: "prayer",
      text: `Ó Nossa Senhora de Lourdes, Mãe Imaculada e cheia de misericórdia, que aparecestes a Santa Bernadete como sinal do amor de Deus pelos pobres e sofredores, com confiança recorremos à vossa intercessão.

Vós convidais à oração, à penitência e à conversão do coração. Ajudai-nos a viver com fé sincera, confiando na misericórdia divina e na força da graça.

Concedei-nos a graça de rezar esta novena com devoção, para que, por vossa intercessão materna, possamos alcançar as graças que necessitamos, se forem da vontade de Deus.

Amém.`
    },

    { type: "title", text: "Oração do dia" },
    {
      type: "text",
      text: `Ó Nossa Senhora de Lourdes, proclamastes vossa Imaculada Conceição como sinal da pureza e da graça de Deus.

Ajudai-nos a buscar um coração puro e aberto à ação do Senhor.

Que saibamos rejeitar o pecado e viver na graça divina.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
    },

    { type: "title", text: "Oração Final" },
    {
      type: "prayer",
      text: `Ó Nossa Senhora de Lourdes, Mãe Imaculada e refúgio dos pecadores, rogai por nós.

Ajudai-nos a viver na fé, na esperança e no amor, confiantes na misericórdia de Deus.

Amém.`
    }
  ]
},
{
  novenaId: "novena_nossa_senhora_de_lourdes",
  day: 2,
  title: "Segundo dia – Nossa Senhora de Lourdes, Mãe dos pobres",
  sections: [
    { type: "title", text: "Sinal da Cruz" },
    { type: "prayer", text: "Em nome do Pai, do Filho e do Espírito Santo. Amém." },

    { type: "title", text: "Oração Inicial" },
    {
      type: "prayer",
      text: `Ó Nossa Senhora de Lourdes, Mãe Imaculada e cheia de misericórdia, que aparecestes a Santa Bernadete como sinal do amor de Deus pelos pobres e sofredores, com confiança recorremos à vossa intercessão.

Vós convidais à oração, à penitência e à conversão do coração. Ajudai-nos a viver com fé sincera, confiando na misericórdia divina e na força da graça.

Concedei-nos a graça de rezar esta novena com devoção, para que, por vossa intercessão materna, possamos alcançar as graças que necessitamos, se forem da vontade de Deus.

Amém.`
    },

    { type: "title", text: "Oração do dia" },
    {
      type: "text",
      text: `Ó Mãe Santíssima, escolhestes manifestar-vos a uma jovem simples e humilde.

Ensinai-nos a valorizar a simplicidade, a humildade e a confiança em Deus.

Que saibamos reconhecer Cristo nos pobres e necessitados.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
    },

    { type: "title", text: "Oração Final" },
    {
      type: "prayer",
      text: `Ó Nossa Senhora de Lourdes, Mãe Imaculada e refúgio dos pecadores, rogai por nós.

Ajudai-nos a viver na fé, na esperança e no amor, confiantes na misericórdia de Deus.

Amém.`
    }
  ]
},
{
  novenaId: "novena_nossa_senhora_de_lourdes",
  day: 3,
  title: "Terceiro dia – Nossa Senhora de Lourdes, chamado à oração",
  sections: [
    { type: "title", text: "Sinal da Cruz" },
    { type: "prayer", text: "Em nome do Pai, do Filho e do Espírito Santo. Amém." },

    { type: "title", text: "Oração Inicial" },
    {
      type: "prayer",
      text: `Ó Nossa Senhora de Lourdes, Mãe Imaculada e cheia de misericórdia, que aparecestes a Santa Bernadete como sinal do amor de Deus pelos pobres e sofredores, com confiança recorremos à vossa intercessão.

Vós convidais à oração, à penitência e à conversão do coração. Ajudai-nos a viver com fé sincera, confiando na misericórdia divina e na força da graça.

Concedei-nos a graça de rezar esta novena com devoção, para que, por vossa intercessão materna, possamos alcançar as graças que necessitamos, se forem da vontade de Deus.

Amém.`
    },

    { type: "title", text: "Oração do dia" },
    {
      type: "text",
      text: `Ó Nossa Senhora de Lourdes, convidastes o mundo à oração perseverante.

Ajudai-nos a cultivar uma vida de oração sincera e constante.

Que encontremos na oração força, paz e esperança.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
    },

    { type: "title", text: "Oração Final" },
    {
      type: "prayer",
      text: `Ó Nossa Senhora de Lourdes, Mãe Imaculada e refúgio dos pecadores, rogai por nós.

Ajudai-nos a viver na fé, na esperança e no amor, confiantes na misericórdia de Deus.

Amém.`
    }
  ]
},
{
  novenaId: "novena_nossa_senhora_de_lourdes",
  day: 4,
  title: "Quarto dia – Nossa Senhora de Lourdes, convite à conversão",
  sections: [
    { type: "title", text: "Sinal da Cruz" },
    { type: "prayer", text: "Em nome do Pai, do Filho e do Espírito Santo. Amém." },

    { type: "title", text: "Oração Inicial" },
    {
      type: "prayer",
      text: `Ó Nossa Senhora de Lourdes, Mãe Imaculada e cheia de misericórdia, que aparecestes a Santa Bernadete como sinal do amor de Deus pelos pobres e sofredores, com confiança recorremos à vossa intercessão.

Vós convidais à oração, à penitência e à conversão do coração. Ajudai-nos a viver com fé sincera, confiando na misericórdia divina e na força da graça.

Concedei-nos a graça de rezar esta novena com devoção, para que, por vossa intercessão materna, possamos alcançar as graças que necessitamos, se forem da vontade de Deus.

Amém.`
    },

    { type: "title", text: "Oração do dia" },
    {
      type: "text",
      text: `Ó Mãe cheia de bondade, chamastes os pecadores à conversão do coração.

Ajudai-nos a reconhecer nossas faltas e a buscar o perdão de Deus.

Que nossa vida seja marcada por uma verdadeira mudança interior.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
    },

    { type: "title", text: "Oração Final" },
    {
      type: "prayer",
      text: `Ó Nossa Senhora de Lourdes, Mãe Imaculada e refúgio dos pecadores, rogai por nós.

Ajudai-nos a viver na fé, na esperança e no amor, confiantes na misericórdia de Deus.

Amém.`
    }
  ]
},
{
  novenaId: "novena_nossa_senhora_de_lourdes",
  day: 5,
  title: "Quinto dia – Nossa Senhora de Lourdes, fonte de cura e esperança",
  sections: [
    { type: "title", text: "Sinal da Cruz" },
    { type: "prayer", text: "Em nome do Pai, do Filho e do Espírito Santo. Amém." },

    { type: "title", text: "Oração Inicial" },
    {
      type: "prayer",
      text: `Ó Nossa Senhora de Lourdes, Mãe Imaculada e cheia de misericórdia, que aparecestes a Santa Bernadete como sinal do amor de Deus pelos pobres e sofredores, com confiança recorremos à vossa intercessão.

Vós convidais à oração, à penitência e à conversão do coração. Ajudai-nos a viver com fé sincera, confiando na misericórdia divina e na força da graça.

Concedei-nos a graça de rezar esta novena com devoção, para que, por vossa intercessão materna, possamos alcançar as graças que necessitamos, se forem da vontade de Deus.

Amém.`
    },

    { type: "title", text: "Oração do dia" },
    {
      type: "text",
      text: `Ó Nossa Senhora de Lourdes, sois sinal de cura do corpo e da alma.

Intercedei por todos os doentes e sofredores.

Concedei-nos saúde, força e confiança na vontade de Deus.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
    },

    { type: "title", text: "Oração Final" },
    {
      type: "prayer",
      text: `Ó Nossa Senhora de Lourdes, Mãe Imaculada e refúgio dos pecadores, rogai por nós.

Ajudai-nos a viver na fé, na esperança e no amor, confiantes na misericórdia de Deus.

Amém.`
    }
  ]
},
{
  novenaId: "novena_nossa_senhora_de_lourdes",
  day: 6,
  title: "Sexto dia – Nossa Senhora de Lourdes, conforto dos aflitos",
  sections: [
    { type: "title", text: "Sinal da Cruz" },
    { type: "prayer", text: "Em nome do Pai, do Filho e do Espírito Santo. Amém." },

    { type: "title", text: "Oração Inicial" },
    {
      type: "prayer",
      text: `Ó Nossa Senhora de Lourdes, Mãe Imaculada e cheia de misericórdia, que aparecestes a Santa Bernadete como sinal do amor de Deus pelos pobres e sofredores, com confiança recorremos à vossa intercessão.

Vós convidais à oração, à penitência e à conversão do coração. Ajudai-nos a viver com fé sincera, confiando na misericórdia divina e na força da graça.

Concedei-nos a graça de rezar esta novena com devoção, para que, por vossa intercessão materna, possamos alcançar as graças que necessitamos, se forem da vontade de Deus.

Amém.`
    },

    { type: "title", text: "Oração do dia" },
    {
      type: "text",
      text: `Ó Mãe compassiva, conheceis as dores e angústias de vossos filhos.

Consolai os que sofrem, os que choram e os que perderam a esperança.

Que encontrem em vós consolo e amparo.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
    },

    { type: "title", text: "Oração Final" },
    {
      type: "prayer",
      text: `Ó Nossa Senhora de Lourdes, Mãe Imaculada e refúgio dos pecadores, rogai por nós.

Ajudai-nos a viver na fé, na esperança e no amor, confiantes na misericórdia de Deus.

Amém.`
    }
  ]
},
{
  novenaId: "novena_nossa_senhora_de_lourdes",
  day: 7,
  title: "Sétimo dia – Nossa Senhora de Lourdes, Mãe da fé",
  sections: [
    { type: "title", text: "Sinal da Cruz" },
    { type: "prayer", text: "Em nome do Pai, do Filho e do Espírito Santo. Amém." },

    { type: "title", text: "Oração Inicial" },
    {
      type: "prayer",
      text: `Ó Nossa Senhora de Lourdes, Mãe Imaculada e cheia de misericórdia, que aparecestes a Santa Bernadete como sinal do amor de Deus pelos pobres e sofredores, com confiança recorremos à vossa intercessão.

Vós convidais à oração, à penitência e à conversão do coração. Ajudai-nos a viver com fé sincera, confiando na misericórdia divina e na força da graça.

Concedei-nos a graça de rezar esta novena com devoção, para que, por vossa intercessão materna, possamos alcançar as graças que necessitamos, se forem da vontade de Deus.

Amém.`
    },

    { type: "title", text: "Oração do dia" },
    {
      type: "text",
      text: `Ó Nossa Senhora de Lourdes, fortalecestes a fé de Santa Bernadete e de tantos peregrinos.

Aumentai nossa fé, para que confiemos plenamente em Deus.

Que nunca duvidemos do Seu amor e de Suas promessas.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
    },

    { type: "title", text: "Oração Final" },
    {
      type: "prayer",
      text: `Ó Nossa Senhora de Lourdes, Mãe Imaculada e refúgio dos pecadores, rogai por nós.

Ajudai-nos a viver na fé, na esperança e no amor, confiantes na misericórdia de Deus.

Amém.`
    }
  ]
},
{
  novenaId: "novena_nossa_senhora_de_lourdes",
  day: 8,
  title: "Oitavo dia – Nossa Senhora de Lourdes, guia dos peregrinos",
  sections: [
    { type: "title", text: "Sinal da Cruz" },
    { type: "prayer", text: "Em nome do Pai, do Filho e do Espírito Santo. Amém." },

    { type: "title", text: "Oração Inicial" },
    {
      type: "prayer",
      text: `Ó Nossa Senhora de Lourdes, Mãe Imaculada e cheia de misericórdia, que aparecestes a Santa Bernadete como sinal do amor de Deus pelos pobres e sofredores, com confiança recorremos à vossa intercessão.

Vós convidais à oração, à penitência e à conversão do coração. Ajudai-nos a viver com fé sincera, confiando na misericórdia divina e na força da graça.

Concedei-nos a graça de rezar esta novena com devoção, para que, por vossa intercessão materna, possamos alcançar as graças que necessitamos, se forem da vontade de Deus.

Amém.`
    },

    { type: "title", text: "Oração do dia" },
    {
      type: "text",
      text: `Ó Mãe Santíssima, conduzis vossos filhos no caminho da fé.

Ajudai-nos a caminhar com perseverança rumo ao Senhor.

Que nossa vida seja uma peregrinação de amor e esperança.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
    },

    { type: "title", text: "Oração Final" },
    {
      type: "prayer",
      text: `Ó Nossa Senhora de Lourdes, Mãe Imaculada e refúgio dos pecadores, rogai por nós.

Ajudai-nos a viver na fé, na esperança e no amor, confiantes na misericórdia de Deus.

Amém.`
    }
  ]
},
{
  novenaId: "novena_nossa_senhora_de_lourdes",
  day: 9,
  title: "Nono dia – Nossa Senhora de Lourdes, intercessora poderosa",
  sections: [
    { type: "title", text: "Sinal da Cruz" },
    { type: "prayer", text: "Em nome do Pai, do Filho e do Espírito Santo. Amém." },

    { type: "title", text: "Oração Inicial" },
    {
      type: "prayer",
      text: `Ó Nossa Senhora de Lourdes, Mãe Imaculada e cheia de misericórdia, que aparecestes a Santa Bernadete como sinal do amor de Deus pelos pobres e sofredores, com confiança recorremos à vossa intercessão.

Vós convidais à oração, à penitência e à conversão do coração. Ajudai-nos a viver com fé sincera, confiando na misericórdia divina e na força da graça.

Concedei-nos a graça de rezar esta novena com devoção, para que, por vossa intercessão materna, possamos alcançar as graças que necessitamos, se forem da vontade de Deus.

Amém.`
    },

    { type: "title", text: "Oração do dia" },
    {
      type: "text",
      text: `Ó Nossa Senhora de Lourdes, confiamos em vossa poderosa intercessão.

Apresentai a Deus nossas intenções, necessidades e pedidos.

Conduzi-nos sempre no caminho da fé, da cura e da salvação.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
    },

    { type: "title", text: "Oração Final" },
    {
      type: "prayer",
      text: `Ó Nossa Senhora de Lourdes, Mãe Imaculada e refúgio dos pecadores, rogai por nós.

Ajudai-nos a viver na fé, na esperança e no amor, confiantes na misericórdia de Deus.

Amém.`
    }
  ]
},

// ===== Novena a São Patrício =====
{
  novenaId: "novena_sao_patricio",
  day: 1,
  title: "Primeiro dia – São Patrício, chamado por Deus",
  sections: [
    { type: "title", text: "Sinal da Cruz" },
    { type: "prayer", text: "Em nome do Pai, do Filho e do Espírito Santo. Amém." },

    { type: "title", text: "Oração Inicial" },
    {
      type: "prayer",
      text: `Ó glorioso São Patrício, bispo e missionário zeloso, apóstolo da Irlanda e fiel servo de Deus, com confiança recorremos à vossa intercessão.

Vós que anunciastes o Evangelho com coragem, perseverança e profunda fé na Santíssima Trindade, ajudai-nos a permanecer firmes na fé e a testemunhar Cristo em nossa vida diária.

Concedei-nos a graça de rezar esta novena com fé sincera, para que, por vossa intercessão, possamos crescer na fé, na esperança e no amor, e alcançar as graças que necessitamos, se forem da vontade de Deus.

Amém.`
    },

    { type: "title", text: "Oração do dia" },
    {
      type: "text",
      text: `Ó São Patrício, desde jovem fostes chamado por Deus para uma grande missão.

Ensinai-nos a reconhecer o chamado do Senhor em nossa vida e a responder com generosidade e confiança.

Que saibamos seguir a vontade de Deus em todas as circunstâncias.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
    },

    { type: "title", text: "Oração Final" },
    {
      type: "prayer",
      text: `Ó São Patrício, apóstolo e pastor fiel, rogai por nós.

Ajudai-nos a viver firmes na fé, perseverantes na oração e comprometidos com o Evangelho de Jesus Cristo.

Amém.`
    }
  ]
},
{
  novenaId: "novena_sao_patricio",
  day: 2,
  title: "Segundo dia – São Patrício, exemplo de fé e confiança",
  sections: [
    { type: "title", text: "Sinal da Cruz" },
    { type: "prayer", text: "Em nome do Pai, do Filho e do Espírito Santo. Amém." },

    { type: "title", text: "Oração Inicial" },
    {
      type: "prayer",
      text: `Ó glorioso São Patrício, bispo e missionário zeloso, apóstolo da Irlanda e fiel servo de Deus, com confiança recorremos à vossa intercessão.

Vós que anunciastes o Evangelho com coragem, perseverança e profunda fé na Santíssima Trindade, ajudai-nos a permanecer firmes na fé e a testemunhar Cristo em nossa vida diária.

Concedei-nos a graça de rezar esta novena com fé sincera, para que, por vossa intercessão, possamos crescer na fé, na esperança e no amor, e alcançar as graças que necessitamos, se forem da vontade de Deus.

Amém.`
    },

    { type: "title", text: "Oração do dia" },
    {
      type: "text",
      text: `Ó São Patrício, mesmo diante das dificuldades e perseguições, nunca perdestes a confiança em Deus.

Ajudai-nos a fortalecer nossa fé e a confiar plenamente na providência divina.

Que jamais nos afastemos do Senhor.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
    },

    { type: "title", text: "Oração Final" },
    {
      type: "prayer",
      text: `Ó São Patrício, apóstolo e pastor fiel, rogai por nós.

Ajudai-nos a viver firmes na fé, perseverantes na oração e comprometidos com o Evangelho de Jesus Cristo.

Amém.`
    }
  ]
},
{
  novenaId: "novena_sao_patricio",
  day: 3,
  title: "Terceiro dia – São Patrício, apóstolo missionário",
  sections: [
    { type: "title", text: "Sinal da Cruz" },
    { type: "prayer", text: "Em nome do Pai, do Filho e do Espírito Santo. Amém." },

    { type: "title", text: "Oração Inicial" },
    {
      type: "prayer",
      text: `Ó glorioso São Patrício, bispo e missionário zeloso, apóstolo da Irlanda e fiel servo de Deus, com confiança recorremos à vossa intercessão.

Vós que anunciastes o Evangelho com coragem, perseverança e profunda fé na Santíssima Trindade, ajudai-nos a permanecer firmes na fé e a testemunhar Cristo em nossa vida diária.

Concedei-nos a graça de rezar esta novena com fé sincera, para que, por vossa intercessão, possamos crescer na fé, na esperança e no amor, e alcançar as graças que necessitamos, se forem da vontade de Deus.

Amém.`
    },

    { type: "title", text: "Oração do dia" },
    {
      type: "text",
      text: `Ó São Patrício, dedicastes vossa vida à evangelização e à conversão dos povos.

Ensinai-nos a ser missionários em nosso ambiente, anunciando o Evangelho com palavras e ações.

Que sejamos instrumentos do amor de Deus.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
    },

    { type: "title", text: "Oração Final" },
    {
      type: "prayer",
      text: `Ó São Patrício, apóstolo e pastor fiel, rogai por nós.

Ajudai-nos a viver firmes na fé, perseverantes na oração e comprometidos com o Evangelho de Jesus Cristo.

Amém.`
    }
  ]
},
{
  novenaId: "novena_sao_patricio",
  day: 4,
  title: "Quarto dia – São Patrício, testemunha da Santíssima Trindade",
  sections: [
    { type: "title", text: "Sinal da Cruz" },
    { type: "prayer", text: "Em nome do Pai, do Filho e do Espírito Santo. Amém." },

    { type: "title", text: "Oração Inicial" },
    {
      type: "prayer",
      text: `Ó glorioso São Patrício, bispo e missionário zeloso, apóstolo da Irlanda e fiel servo de Deus, com confiança recorremos à vossa intercessão.

Vós que anunciastes o Evangelho com coragem, perseverança e profunda fé na Santíssima Trindade, ajudai-nos a permanecer firmes na fé e a testemunhar Cristo em nossa vida diária.

Concedei-nos a graça de rezar esta novena com fé sincera, para que, por vossa intercessão, possamos crescer na fé, na esperança e no amor, e alcançar as graças que necessitamos, se forem da vontade de Deus.

Amém.`
    },

    { type: "title", text: "Oração do dia" },
    {
      type: "text",
      text: `Ó São Patrício, proclamastes com clareza e fé o mistério da Santíssima Trindade.

Ajudai-nos a viver em comunhão com o Pai, o Filho e o Espírito Santo.

Que nossa vida reflita a presença de Deus Uno e Trino.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
    },

    { type: "title", text: "Oração Final" },
    {
      type: "prayer",
      text: `Ó São Patrício, apóstolo e pastor fiel, rogai por nós.

Ajudai-nos a viver firmes na fé, perseverantes na oração e comprometidos com o Evangelho de Jesus Cristo.

Amém.`
    }
  ]
},
{
  novenaId: "novena_sao_patricio",
  day: 5,
  title: "Quinto dia – São Patrício, perseverança na adversidade",
  sections: [
    { type: "title", text: "Sinal da Cruz" },
    { type: "prayer", text: "Em nome do Pai, do Filho e do Espírito Santo. Amém." },

    { type: "title", text: "Oração Inicial" },
    {
      type: "prayer",
      text: `Ó glorioso São Patrício, bispo e missionário zeloso, apóstolo da Irlanda e fiel servo de Deus, com confiança recorremos à vossa intercessão.

Vós que anunciastes o Evangelho com coragem, perseverança e profunda fé na Santíssima Trindade, ajudai-nos a permanecer firmes na fé e a testemunhar Cristo em nossa vida diária.

Concedei-nos a graça de rezar esta novena com fé sincera, para que, por vossa intercessão, possamos crescer na fé, na esperança e no amor, e alcançar as graças que necessitamos, se forem da vontade de Deus.

Amém.`
    },

    { type: "title", text: "Oração do dia" },
    {
      type: "text",
      text: `Ó São Patrício, suportastes provações com paciência e fidelidade.

Ensinai-nos a perseverar na fé diante das dificuldades e sofrimentos.

Que encontremos força na oração e na confiança em Deus.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
    },

    { type: "title", text: "Oração Final" },
    {
      type: "prayer",
      text: `Ó São Patrício, apóstolo e pastor fiel, rogai por nós.

Ajudai-nos a viver firmes na fé, perseverantes na oração e comprometidos com o Evangelho de Jesus Cristo.

Amém.`
    }
  ]
},
{
  novenaId: "novena_sao_patricio",
  day: 6,
  title: "Sexto dia – São Patrício, humildade e obediência",
  sections: [
    { type: "title", text: "Sinal da Cruz" },
    { type: "prayer", text: "Em nome do Pai, do Filho e do Espírito Santo. Amém." },

    { type: "title", text: "Oração Inicial" },
    {
      type: "prayer",
      text: `Ó glorioso São Patrício, bispo e missionário zeloso, apóstolo da Irlanda e fiel servo de Deus, com confiança recorremos à vossa intercessão.

Vós que anunciastes o Evangelho com coragem, perseverança e profunda fé na Santíssima Trindade, ajudai-nos a permanecer firmes na fé e a testemunhar Cristo em nossa vida diária.

Concedei-nos a graça de rezar esta novena com fé sincera, para que, por vossa intercessão, possamos crescer na fé, na esperança e no amor, e alcançar as graças que necessitamos, se forem da vontade de Deus.

Amém.`
    },

    { type: "title", text: "Oração do dia" },
    {
      type: "text",
      text: `Ó São Patrício, vivestes com humildade e total obediência à vontade de Deus.

Ajudai-nos a cultivar um coração humilde e dócil ao Senhor.

Que saibamos servir a Deus e ao próximo com amor.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
    },

    { type: "title", text: "Oração Final" },
    {
      type: "prayer",
      text: `Ó São Patrício, apóstolo e pastor fiel, rogai por nós.

Ajudai-nos a viver firmes na fé, perseverantes na oração e comprometidos com o Evangelho de Jesus Cristo.

Amém.`
    }
  ]
},
{
  novenaId: "novena_sao_patricio",
  day: 7,
  title: "Sétimo dia – São Patrício, defensor da fé cristã",
  sections: [
    { type: "title", text: "Sinal da Cruz" },
    { type: "prayer", text: "Em nome do Pai, do Filho e do Espírito Santo. Amém." },

    { type: "title", text: "Oração Inicial" },
    {
      type: "prayer",
      text: `Ó glorioso São Patrício, bispo e missionário zeloso, apóstolo da Irlanda e fiel servo de Deus, com confiança recorremos à vossa intercessão.

Vós que anunciastes o Evangelho com coragem, perseverança e profunda fé na Santíssima Trindade, ajudai-nos a permanecer firmes na fé e a testemunhar Cristo em nossa vida diária.

Concedei-nos a graça de rezar esta novena com fé sincera, para que, por vossa intercessão, possamos crescer na fé, na esperança e no amor, e alcançar as graças que necessitamos, se forem da vontade de Deus.

Amém.`
    },

    { type: "title", text: "Oração do dia" },
    {
      type: "text",
      text: `Ó São Patrício, defendestes a fé com coragem e sabedoria.

Ajudai-nos a permanecer firmes na verdade do Evangelho.

Que nossa vida seja testemunho fiel da fé cristã.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
    },

    { type: "title", text: "Oração Final" },
    {
      type: "prayer",
      text: `Ó São Patrício, apóstolo e pastor fiel, rogai por nós.

Ajudai-nos a viver firmes na fé, perseverantes na oração e comprometidos com o Evangelho de Jesus Cristo.

Amém.`
    }
  ]
},
{
  novenaId: "novena_sao_patricio",
  day: 8,
  title: "Oitavo dia – São Patrício, exemplo de oração constante",
  sections: [
    { type: "title", text: "Sinal da Cruz" },
    { type: "prayer", text: "Em nome do Pai, do Filho e do Espírito Santo. Amém." },

    { type: "title", text: "Oração Inicial" },
    {
      type: "prayer",
      text: `Ó glorioso São Patrício, bispo e missionário zeloso, apóstolo da Irlanda e fiel servo de Deus, com confiança recorremos à vossa intercessão.

Vós que anunciastes o Evangelho com coragem, perseverança e profunda fé na Santíssima Trindade, ajudai-nos a permanecer firmes na fé e a testemunhar Cristo em nossa vida diária.

Concedei-nos a graça de rezar esta novena com fé sincera, para que, por vossa intercessão, possamos crescer na fé, na esperança e no amor, e alcançar as graças que necessitamos, se forem da vontade de Deus.

Amém.`
    },

    { type: "title", text: "Oração do dia" },
    {
      type: "text",
      text: `Ó São Patrício, vossa vida foi marcada por profunda oração e intimidade com Deus.

Ensinai-nos a valorizar a oração como fonte de força e santidade.

Que nossa confiança esteja sempre no Senhor.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
    },

    { type: "title", text: "Oração Final" },
    {
      type: "prayer",
      text: `Ó São Patrício, apóstolo e pastor fiel, rogai por nós.

Ajudai-nos a viver firmes na fé, perseverantes na oração e comprometidos com o Evangelho de Jesus Cristo.

Amém.`
    }
  ]
},
{
  novenaId: "novena_sao_patricio",
  day: 9,
  title: "Nono dia – São Patrício, intercessor junto a Deus",
  sections: [
    { type: "title", text: "Sinal da Cruz" },
    { type: "prayer", text: "Em nome do Pai, do Filho e do Espírito Santo. Amém." },

    { type: "title", text: "Oração Inicial" },
    {
      type: "prayer",
      text: `Ó glorioso São Patrício, bispo e missionário zeloso, apóstolo da Irlanda e fiel servo de Deus, com confiança recorremos à vossa intercessão.

Vós que anunciastes o Evangelho com coragem, perseverança e profunda fé na Santíssima Trindade, ajudai-nos a permanecer firmes na fé e a testemunhar Cristo em nossa vida diária.

Concedei-nos a graça de rezar esta novena com fé sincera, para que, por vossa intercessão, possamos crescer na fé, na esperança e no amor, e alcançar as graças que necessitamos, se forem da vontade de Deus.

Amém.`
    },

    { type: "title", text: "Oração do dia" },
    {
      type: "text",
      text: `Ó glorioso São Patrício, confiamos em vossa poderosa intercessão.

Apresentai a Deus nossos pedidos, necessidades e intenções.

Conduzi-nos sempre no caminho da fé, da esperança e da salvação.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
    },

    { type: "title", text: "Oração Final" },
    {
      type: "prayer",
      text: `Ó São Patrício, apóstolo e pastor fiel, rogai por nós.

Ajudai-nos a viver firmes na fé, perseverantes na oração e comprometidos com o Evangelho de Jesus Cristo.

Amém.`
    }
  ]
},
// ===== Novena a São José =====
{
  novenaId: "novena_sao_jose",
  day: 1,
  title: "Primeiro dia – São José, homem justo e fiel",
  sections: [
    { type: "title", text: "Sinal da Cruz" },
    { type: "prayer", text: "Em nome do Pai, do Filho e do Espírito Santo. Amém." },

    { type: "title", text: "Oração Inicial" },
    {
      type: "prayer",
      text: `Ó glorioso São José, esposo da Virgem Maria e pai adotivo de Jesus, homem justo e fiel, com confiança recorremos à vossa poderosa intercessão.

Vós fostes escolhido por Deus para proteger a Sagrada Família e cooperar silenciosamente no plano da salvação. Ajudai-nos a viver na obediência, no trabalho honesto e na confiança plena na providência divina.

Concedei-nos a graça de rezar esta novena com fé sincera, para que, por vossa intercessão, possamos crescer na fé, na esperança e no amor, e alcançar as graças que necessitamos, se forem da vontade de Deus.

Amém.`
    },

    { type: "title", text: "Oração do dia" },
    {
      type: "text",
      text: `Ó São José, fostes chamado homem justo por vossa fidelidade à Lei de Deus.

Ensinai-nos a viver com retidão, honestidade e confiança no Senhor.

Que nossa vida seja guiada pela vontade de Deus.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
    },

    { type: "title", text: "Oração Final" },
    {
      type: "prayer",
      text: `Ó São José, protetor da Sagrada Família e da Igreja, rogai por nós.

Ajudai-nos a viver com fé, obediência e amor, seguindo sempre o exemplo de Jesus e Maria.

Amém.`
    }
  ]
},
{
  novenaId: "novena_sao_jose",
  day: 2,
  title: "Segundo dia – São José, esposo de Maria",
  sections: [
    { type: "title", text: "Sinal da Cruz" },
    { type: "prayer", text: "Em nome do Pai, do Filho e do Espírito Santo. Amém." },

    { type: "title", text: "Oração Inicial" },
    {
      type: "prayer",
      text: `Ó glorioso São José, esposo da Virgem Maria e pai adotivo de Jesus, homem justo e fiel, com confiança recorremos à vossa poderosa intercessão.

Vós fostes escolhido por Deus para proteger a Sagrada Família e cooperar silenciosamente no plano da salvação. Ajudai-nos a viver na obediência, no trabalho honesto e na confiança plena na providência divina.

Concedei-nos a graça de rezar esta novena com fé sincera, para que, por vossa intercessão, possamos crescer na fé, na esperança e no amor, e alcançar as graças que necessitamos, se forem da vontade de Deus.

Amém.`
    },

    { type: "title", text: "Oração do dia" },
    {
      type: "text",
      text: `Ó São José, amastes e cuidastes de Maria com respeito, fidelidade e dedicação.

Ajudai-nos a viver relações marcadas pelo amor, pela responsabilidade e pelo respeito mútuo.

Que nossas famílias sejam sustentadas pela graça de Deus.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
    },

    { type: "title", text: "Oração Final" },
    {
      type: "prayer",
      text: `Ó São José, protetor da Sagrada Família e da Igreja, rogai por nós.

Ajudai-nos a viver com fé, obediência e amor, seguindo sempre o exemplo de Jesus e Maria.

Amém.`
    }
  ]
},
{
  novenaId: "novena_sao_jose",
  day: 3,
  title: "Terceiro dia – São José, pai e protetor de Jesus",
  sections: [
    { type: "title", text: "Sinal da Cruz" },
    { type: "prayer", text: "Em nome do Pai, do Filho e do Espírito Santo. Amém." },

    { type: "title", text: "Oração Inicial" },
    {
      type: "prayer",
      text: `Ó glorioso São José, esposo da Virgem Maria e pai adotivo de Jesus, homem justo e fiel, com confiança recorremos à vossa poderosa intercessão.

Vós fostes escolhido por Deus para proteger a Sagrada Família e cooperar silenciosamente no plano da salvação. Ajudai-nos a viver na obediência, no trabalho honesto e na confiança plena na providência divina.

Concedei-nos a graça de rezar esta novena com fé sincera, para que, por vossa intercessão, possamos crescer na fé, na esperança e no amor, e alcançar as graças que necessitamos, se forem da vontade de Deus.

Amém.`
    },

    { type: "title", text: "Oração do dia" },
    {
      type: "text",
      text: `Ó São José, protegeste o Menino Jesus com coragem e zelo.

Intercedei por todas as famílias, para que sejam protegidas de todo mal.

Ajudai-nos a cuidar com amor daqueles que Deus nos confia.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
    },

    { type: "title", text: "Oração Final" },
    {
      type: "prayer",
      text: `Ó São José, protetor da Sagrada Família e da Igreja, rogai por nós.

Ajudai-nos a viver com fé, obediência e amor, seguindo sempre o exemplo de Jesus e Maria.

Amém.`
    }
  ]
},
{
  novenaId: "novena_sao_jose",
  day: 4,
  title: "Quarto dia – São José, obediente à vontade de Deus",
  sections: [
    { type: "title", text: "Sinal da Cruz" },
    { type: "prayer", text: "Em nome do Pai, do Filho e do Espírito Santo. Amém." },

    { type: "title", text: "Oração Inicial" },
    {
      type: "prayer",
      text: `Ó glorioso São José, esposo da Virgem Maria e pai adotivo de Jesus, homem justo e fiel, com confiança recorremos à vossa poderosa intercessão.

Vós fostes escolhido por Deus para proteger a Sagrada Família e cooperar silenciosamente no plano da salvação. Ajudai-nos a viver na obediência, no trabalho honesto e na confiança plena na providência divina.

Concedei-nos a graça de rezar esta novena com fé sincera, para que, por vossa intercessão, possamos crescer na fé, na esperança e no amor, e alcançar as graças que necessitamos, se forem da vontade de Deus.

Amém.`
    },

    { type: "title", text: "Oração do dia" },
    {
      type: "text",
      text: `Ó São José, obedecestes prontamente às ordens de Deus reveladas em sonho.

Ensinai-nos a escutar a voz do Senhor e a cumprir Sua vontade com prontidão.

Que sejamos dóceis à ação divina em nossa vida.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
    },

    { type: "title", text: "Oração Final" },
    {
      type: "prayer",
      text: `Ó São José, protetor da Sagrada Família e da Igreja, rogai por nós.

Ajudai-nos a viver com fé, obediência e amor, seguindo sempre o exemplo de Jesus e Maria.

Amém.`
    }
  ]
},
{
  novenaId: "novena_sao_jose",
  day: 5,
  title: "Quinto dia – São José, trabalhador dedicado",
  sections: [
    { type: "title", text: "Sinal da Cruz" },
    { type: "prayer", text: "Em nome do Pai, do Filho e do Espírito Santo. Amém." },

    { type: "title", text: "Oração Inicial" },
    {
      type: "prayer",
      text: `Ó glorioso São José, esposo da Virgem Maria e pai adotivo de Jesus, homem justo e fiel, com confiança recorremos à vossa poderosa intercessão.

Vós fostes escolhido por Deus para proteger a Sagrada Família e cooperar silenciosamente no plano da salvação. Ajudai-nos a viver na obediência, no trabalho honesto e na confiança plena na providência divina.

Concedei-nos a graça de rezar esta novena com fé sincera, para que, por vossa intercessão, possamos crescer na fé, na esperança e no amor, e alcançar as graças que necessitamos, se forem da vontade de Deus.

Amém.`
    },

    { type: "title", text: "Oração do dia" },
    {
      type: "text",
      text: `Ó São José, pelo trabalho sustentastes com dignidade a Sagrada Família.

Ajudai-nos a valorizar o trabalho como meio de santificação.

Intercedei por todos os trabalhadores e desempregados.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
    },

    { type: "title", text: "Oração Final" },
    {
      type: "prayer",
      text: `Ó São José, protetor da Sagrada Família e da Igreja, rogai por nós.

Ajudai-nos a viver com fé, obediência e amor, seguindo sempre o exemplo de Jesus e Maria.

Amém.`
    }
  ]
},
{
  novenaId: "novena_sao_jose",
  day: 6,
  title: "Sexto dia – São José, modelo de silêncio e humildade",
  sections: [
    { type: "title", text: "Sinal da Cruz" },
    { type: "prayer", text: "Em nome do Pai, do Filho e do Espírito Santo. Amém." },

    { type: "title", text: "Oração Inicial" },
    {
      type: "prayer",
      text: `Ó glorioso São José, esposo da Virgem Maria e pai adotivo de Jesus, homem justo e fiel, com confiança recorremos à vossa poderosa intercessão.

Vós fostes escolhido por Deus para proteger a Sagrada Família e cooperar silenciosamente no plano da salvação. Ajudai-nos a viver na obediência, no trabalho honesto e na confiança plena na providência divina.

Concedei-nos a graça de rezar esta novena com fé sincera, para que, por vossa intercessão, possamos crescer na fé, na esperança e no amor, e alcançar as graças que necessitamos, se forem da vontade de Deus.

Amém.`
    },

    { type: "title", text: "Oração do dia" },
    {
      type: "text",
      text: `Ó São José, vivestes no silêncio, realizando grandes obras sem buscar reconhecimento.

Ensinai-nos a humildade e a simplicidade de coração.

Que saibamos servir a Deus sem vaidade.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
    },

    { type: "title", text: "Oração Final" },
    {
      type: "prayer",
      text: `Ó São José, protetor da Sagrada Família e da Igreja, rogai por nós.

Ajudai-nos a viver com fé, obediência e amor, seguindo sempre o exemplo de Jesus e Maria.

Amém.`
    }
  ]
},
{
  novenaId: "novena_sao_jose",
  day: 7,
  title: "Sétimo dia – São José, guarda da Igreja",
  sections: [
    { type: "title", text: "Sinal da Cruz" },
    { type: "prayer", text: "Em nome do Pai, do Filho e do Espírito Santo. Amém." },

    { type: "title", text: "Oração Inicial" },
    {
      type: "prayer",
      text: `Ó glorioso São José, esposo da Virgem Maria e pai adotivo de Jesus, homem justo e fiel, com confiança recorremos à vossa poderosa intercessão.

Vós fostes escolhido por Deus para proteger a Sagrada Família e cooperar silenciosamente no plano da salvação. Ajudai-nos a viver na obediência, no trabalho honesto e na confiança plena na providência divina.

Concedei-nos a graça de rezar esta novena com fé sincera, para que, por vossa intercessão, possamos crescer na fé, na esperança e no amor, e alcançar as graças que necessitamos, se forem da vontade de Deus.

Amém.`
    },

    { type: "title", text: "Oração do dia" },
    {
      type: "text",
      text: `Ó São José, fostes constituído protetor da Igreja universal.

Intercedei por todos os fiéis, sacerdotes e pastores da Igreja.

Protegei-nos contra os perigos do corpo e da alma.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
    },

    { type: "title", text: "Oração Final" },
    {
      type: "prayer",
      text: `Ó São José, protetor da Sagrada Família e da Igreja, rogai por nós.

Ajudai-nos a viver com fé, obediência e amor, seguindo sempre o exemplo de Jesus e Maria.

Amém.`
    }
  ]
},
{
  novenaId: "novena_sao_jose",
  day: 8,
  title: "Oitavo dia – São José, esperança nas dificuldades",
  sections: [
    { type: "title", text: "Sinal da Cruz" },
    { type: "prayer", text: "Em nome do Pai, do Filho e do Espírito Santo. Amém." },

    { type: "title", text: "Oração Inicial" },
    {
      type: "prayer",
      text: `Ó glorioso São José, esposo da Virgem Maria e pai adotivo de Jesus, homem justo e fiel, com confiança recorremos à vossa poderosa intercessão.

Vós fostes escolhido por Deus para proteger a Sagrada Família e cooperar silenciosamente no plano da salvação. Ajudai-nos a viver na obediência, no trabalho honesto e na confiança plena na providência divina.

Concedei-nos a graça de rezar esta novena com fé sincera, para que, por vossa intercessão, possamos crescer na fé, na esperança e no amor, e alcançar as graças que necessitamos, se forem da vontade de Deus.

Amém.`
    },

    { type: "title", text: "Oração do dia" },
    {
      type: "text",
      text: `Ó São José, mesmo diante das incertezas, confiastes plenamente em Deus.

Ajudai-nos a manter a esperança nas provações da vida.

Que jamais percamos a confiança na providência divina.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
    },

    { type: "title", text: "Oração Final" },
    {
      type: "prayer",
      text: `Ó São José, protetor da Sagrada Família e da Igreja, rogai por nós.

Ajudai-nos a viver com fé, obediência e amor, seguindo sempre o exemplo de Jesus e Maria.

Amém.`
    }
  ]
},
{
  novenaId: "novena_sao_jose",
  day: 9,
  title: "Nono dia – São José, intercessor poderoso",
  sections: [
    { type: "title", text: "Sinal da Cruz" },
    { type: "prayer", text: "Em nome do Pai, do Filho e do Espírito Santo. Amém." },

    { type: "title", text: "Oração Inicial" },
    {
      type: "prayer",
      text: `Ó glorioso São José, esposo da Virgem Maria e pai adotivo de Jesus, homem justo e fiel, com confiança recorremos à vossa poderosa intercessão.

Vós fostes escolhido por Deus para proteger a Sagrada Família e cooperar silenciosamente no plano da salvação. Ajudai-nos a viver na obediência, no trabalho honesto e na confiança plena na providência divina.

Concedei-nos a graça de rezar esta novena com fé sincera, para que, por vossa intercessão, possamos crescer na fé, na esperança e no amor, e alcançar as graças que necessitamos, se forem da vontade de Deus.

Amém.`
    },

    { type: "title", text: "Oração do dia" },
    {
      type: "text",
      text: `Ó glorioso São José, confiamos em vossa poderosa intercessão junto a Deus.

Apresentai ao Senhor nossas intenções, necessidades e pedidos.

Conduzi-nos sempre no caminho da fé, da salvação e da vida eterna.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
    },

    { type: "title", text: "Oração Final" },
    {
      type: "prayer",
      text: `Ó São José, protetor da Sagrada Família e da Igreja, rogai por nós.

Ajudai-nos a viver com fé, obediência e amor, seguindo sempre o exemplo de Jesus e Maria.

Amém.`
    }
  ]
},
// ===== Novena da Anunciação do Senhor =====
{
  novenaId: "novena_anunciacao_do_senhor",
  day: 1,
  title: "Primeiro dia – O plano de Deus revelado",
  sections: [
    { type: "title", text: "Sinal da Cruz" },
    { type: "prayer", text: "Em nome do Pai, do Filho e do Espírito Santo. Amém." },

    { type: "title", text: "Oração Inicial" },
    {
      type: "prayer",
      text: `Ó Deus eterno e todo-poderoso, que no mistério da Anunciação revelastes vosso plano de salvação e o Verbo se fez carne no seio da Virgem Maria, nós vos louvamos e bendizemos.

Pela humildade e obediência de Maria, ensinai-nos a acolher vossa vontade com fé sincera e coração disponível.

Concedei-nos a graça de rezar esta novena com devoção, para que, unidos a Cristo, possamos viver segundo vosso amor e alcançar as graças que necessitamos, se forem da vossa vontade.

Amém.`
    },

    { type: "title", text: "Oração do dia" },
    {
      type: "text",
      text: `No anúncio do anjo, Deus revela seu plano de amor para a humanidade.

Ajudai-nos a confiar em vossos desígnios, mesmo quando não os compreendemos plenamente.

Que saibamos reconhecer a ação de Deus em nossa vida.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
    },

    { type: "title", text: "Oração Final" },
    {
      type: "prayer",
      text: `Ó Deus de amor e misericórdia, que na Anunciação revelastes o mistério da Encarnação do vosso Filho, nós vos agradecemos.

Concedei-nos viver segundo o exemplo de Maria, acolhendo vossa vontade com fé, humildade e amor.

Amém.`
    }
  ]
},
{
  novenaId: "novena_anunciacao_do_senhor",
  day: 2,
  title: "Segundo dia – Maria, cheia de graça",
  sections: [
    { type: "title", text: "Sinal da Cruz" },
    { type: "prayer", text: "Em nome do Pai, do Filho e do Espírito Santo. Amém." },

    { type: "title", text: "Oração Inicial" },
    {
      type: "prayer",
      text: `Ó Deus eterno e todo-poderoso, que no mistério da Anunciação revelastes vosso plano de salvação e o Verbo se fez carne no seio da Virgem Maria, nós vos louvamos e bendizemos.

Pela humildade e obediência de Maria, ensinai-nos a acolher vossa vontade com fé sincera e coração disponível.

Concedei-nos a graça de rezar esta novena com devoção, para que, unidos a Cristo, possamos viver segundo vosso amor e alcançar as graças que necessitamos, se forem da vossa vontade.

Amém.`
    },

    { type: "title", text: "Oração do dia" },
    {
      type: "text",
      text: `Maria é saudada pelo anjo como cheia de graça.

Ensinai-nos a viver abertos à graça de Deus e a buscar uma vida santa.

Que rejeitemos o pecado e caminhemos na luz do Senhor.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
    },

    { type: "title", text: "Oração Final" },
    {
      type: "prayer",
      text: `Ó Deus de amor e misericórdia, que na Anunciação revelastes o mistério da Encarnação do vosso Filho, nós vos agradecemos.

Concedei-nos viver segundo o exemplo de Maria, acolhendo vossa vontade com fé, humildade e amor.

Amém.`
    }
  ]
},
{
  novenaId: "novena_anunciacao_do_senhor",
  day: 3,
  title: "Terceiro dia – Maria, exemplo de fé",
  sections: [
    { type: "title", text: "Sinal da Cruz" },
    { type: "prayer", text: "Em nome do Pai, do Filho e do Espírito Santo. Amém." },

    { type: "title", text: "Oração Inicial" },
    {
      type: "prayer",
      text: `Ó Deus eterno e todo-poderoso, que no mistério da Anunciação revelastes vosso plano de salvação e o Verbo se fez carne no seio da Virgem Maria, nós vos louvamos e bendizemos.

Pela humildade e obediência de Maria, ensinai-nos a acolher vossa vontade com fé sincera e coração disponível.

Concedei-nos a graça de rezar esta novena com devoção, para que, unidos a Cristo, possamos viver segundo vosso amor e alcançar as graças que necessitamos, se forem da vossa vontade.

Amém.`
    },

    { type: "title", text: "Oração do dia" },
    {
      type: "text",
      text: `Mesmo diante do mistério, Maria acreditou na Palavra do Senhor.

Fortalecei nossa fé para que confiemos plenamente em Deus.

Que nossa vida seja marcada pela confiança e pela entrega.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
    },

    { type: "title", text: "Oração Final" },
    {
      type: "prayer",
      text: `Ó Deus de amor e misericórdia, que na Anunciação revelastes o mistério da Encarnação do vosso Filho, nós vos agradecemos.

Concedei-nos viver segundo o exemplo de Maria, acolhendo vossa vontade com fé, humildade e amor.

Amém.`
    }
  ]
},
{
  novenaId: "novena_anunciacao_do_senhor",
  day: 4,
  title: "Quarto dia – O sim de Maria",
  sections: [
    { type: "title", text: "Sinal da Cruz" },
    { type: "prayer", text: "Em nome do Pai, do Filho e do Espírito Santo. Amém." },

    { type: "title", text: "Oração Inicial" },
    {
      type: "prayer",
      text: `Ó Deus eterno e todo-poderoso, que no mistério da Anunciação revelastes vosso plano de salvação e o Verbo se fez carne no seio da Virgem Maria, nós vos louvamos e bendizemos.

Pela humildade e obediência de Maria, ensinai-nos a acolher vossa vontade com fé sincera e coração disponível.

Concedei-nos a graça de rezar esta novena com devoção, para que, unidos a Cristo, possamos viver segundo vosso amor e alcançar as graças que necessitamos, se forem da vossa vontade.

Amém.`
    },

    { type: "title", text: "Oração do dia" },
    {
      type: "text",
      text: `Com seu sim, Maria acolheu a vontade de Deus e tornou-se Mãe do Salvador.

Ajudai-nos a dizer sim a Deus em nosso dia a dia.

Que sejamos dóceis e obedientes à Sua vontade.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
    },

    { type: "title", text: "Oração Final" },
    {
      type: "prayer",
      text: `Ó Deus de amor e misericórdia, que na Anunciação revelastes o mistério da Encarnação do vosso Filho, nós vos agradecemos.

Concedei-nos viver segundo o exemplo de Maria, acolhendo vossa vontade com fé, humildade e amor.

Amém.`
    }
  ]
},
{
  novenaId: "novena_anunciacao_do_senhor",
  day: 5,
  title: "Quinto dia – O Verbo se faz carne",
  sections: [
    { type: "title", text: "Sinal da Cruz" },
    { type: "prayer", text: "Em nome do Pai, do Filho e do Espírito Santo. Amém." },

    { type: "title", text: "Oração Inicial" },
    {
      type: "prayer",
      text: `Ó Deus eterno e todo-poderoso, que no mistério da Anunciação revelastes vosso plano de salvação e o Verbo se fez carne no seio da Virgem Maria, nós vos louvamos e bendizemos.

Pela humildade e obediência de Maria, ensinai-nos a acolher vossa vontade com fé sincera e coração disponível.

Concedei-nos a graça de rezar esta novena com devoção, para que, unidos a Cristo, possamos viver segundo vosso amor e alcançar as graças que necessitamos, se forem da vossa vontade.

Amém.`
    },

    { type: "title", text: "Oração do dia" },
    {
      type: "text",
      text: `No mistério da Anunciação, o Filho de Deus assume nossa humanidade.

Ajudai-nos a acolher Jesus como centro de nossa vida.

Que Cristo habite em nosso coração e em nossas ações.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
    },

    { type: "title", text: "Oração Final" },
    {
      type: "prayer",
      text: `Ó Deus de amor e misericórdia, que na Anunciação revelastes o mistério da Encarnação do vosso Filho, nós vos agradecemos.

Concedei-nos viver segundo o exemplo de Maria, acolhendo vossa vontade com fé, humildade e amor.

Amém.`
    }
  ]
},
{
  novenaId: "novena_anunciacao_do_senhor",
  day: 6,
  title: "Sexto dia – Maria, serva do Senhor",
  sections: [
    { type: "title", text: "Sinal da Cruz" },
    { type: "prayer", text: "Em nome do Pai, do Filho e do Espírito Santo. Amém." },

    { type: "title", text: "Oração Inicial" },
    {
      type: "prayer",
      text: `Ó Deus eterno e todo-poderoso, que no mistério da Anunciação revelastes vosso plano de salvação e o Verbo se fez carne no seio da Virgem Maria, nós vos louvamos e bendizemos.

Pela humildade e obediência de Maria, ensinai-nos a acolher vossa vontade com fé sincera e coração disponível.

Concedei-nos a graça de rezar esta novena com devoção, para que, unidos a Cristo, possamos viver segundo vosso amor e alcançar as graças que necessitamos, se forem da vossa vontade.

Amém.`
    },

    { type: "title", text: "Oração do dia" },
    {
      type: "text",
      text: `Maria se declara serva do Senhor, vivendo em total disponibilidade.

Ensinai-nos a servir a Deus e ao próximo com humildade e amor.

Que nossa vida seja serviço fiel ao Reino de Deus.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
    },

    { type: "title", text: "Oração Final" },
    {
      type: "prayer",
      text: `Ó Deus de amor e misericórdia, que na Anunciação revelastes o mistério da Encarnação do vosso Filho, nós vos agradecemos.

Concedei-nos viver segundo o exemplo de Maria, acolhendo vossa vontade com fé, humildade e amor.

Amém.`
    }
  ]
},
{
  novenaId: "novena_anunciacao_do_senhor",
  day: 7,
  title: "Sétimo dia – A ação do Espírito Santo",
  sections: [
    { type: "title", text: "Sinal da Cruz" },
    { type: "prayer", text: "Em nome do Pai, do Filho e do Espírito Santo. Amém." },

    { type: "title", text: "Oração Inicial" },
    {
      type: "prayer",
      text: `Ó Deus eterno e todo-poderoso, que no mistério da Anunciação revelastes vosso plano de salvação e o Verbo se fez carne no seio da Virgem Maria, nós vos louvamos e bendizemos.

Pela humildade e obediência de Maria, ensinai-nos a acolher vossa vontade com fé sincera e coração disponível.

Concedei-nos a graça de rezar esta novena com devoção, para que, unidos a Cristo, possamos viver segundo vosso amor e alcançar as graças que necessitamos, se forem da vossa vontade.

Amém.`
    },

    { type: "title", text: "Oração do dia" },
    {
      type: "text",
      text: `O Espírito Santo realiza o mistério da Encarnação.

Ajudai-nos a ser dóceis à ação do Espírito em nossa vida.

Que sejamos guiados por Sua luz e Sua força.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
    },

    { type: "title", text: "Oração Final" },
    {
      type: "prayer",
      text: `Ó Deus de amor e misericórdia, que na Anunciação revelastes o mistério da Encarnação do vosso Filho, nós vos agradecemos.

Concedei-nos viver segundo o exemplo de Maria, acolhendo vossa vontade com fé, humildade e amor.

Amém.`
    }
  ]
},
{
  novenaId: "novena_anunciacao_do_senhor",
  day: 8,
  title: "Oitavo dia – Maria, modelo de obediência",
  sections: [
    { type: "title", text: "Sinal da Cruz" },
    { type: "prayer", text: "Em nome do Pai, do Filho e do Espírito Santo. Amém." },

    { type: "title", text: "Oração Inicial" },
    {
      type: "prayer",
      text: `Ó Deus eterno e todo-poderoso, que no mistério da Anunciação revelastes vosso plano de salvação e o Verbo se fez carne no seio da Virgem Maria, nós vos louvamos e bendizemos.

Pela humildade e obediência de Maria, ensinai-nos a acolher vossa vontade com fé sincera e coração disponível.

Concedei-nos a graça de rezar esta novena com devoção, para que, unidos a Cristo, possamos viver segundo vosso amor e alcançar as graças que necessitamos, se forem da vossa vontade.

Amém.`
    },

    { type: "title", text: "Oração do dia" },
    {
      type: "text",
      text: `Maria aceitou plenamente a vontade de Deus, sem reservas.

Ensinai-nos a obedecer a Deus com confiança e perseverança.

Que nossa vida seja expressão de fidelidade ao Senhor.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
    },

    { type: "title", text: "Oração Final" },
    {
      type: "prayer",
      text: `Ó Deus de amor e misericórdia, que na Anunciação revelastes o mistério da Encarnação do vosso Filho, nós vos agradecemos.

Concedei-nos viver segundo o exemplo de Maria, acolhendo vossa vontade com fé, humildade e amor.

Amém.`
    }
  ]
},
{
  novenaId: "novena_anunciacao_do_senhor",
  day: 9,
  title: "Nono dia – Cristo, Salvador do mundo",
  sections: [
    { type: "title", text: "Sinal da Cruz" },
    { type: "prayer", text: "Em nome do Pai, do Filho e do Espírito Santo. Amém." },

    { type: "title", text: "Oração Inicial" },
    {
      type: "prayer",
      text: `Ó Deus eterno e todo-poderoso, que no mistério da Anunciação revelastes vosso plano de salvação e o Verbo se fez carne no seio da Virgem Maria, nós vos louvamos e bendizemos.

Pela humildade e obediência de Maria, ensinai-nos a acolher vossa vontade com fé sincera e coração disponível.

Concedei-nos a graça de rezar esta novena com devoção, para que, unidos a Cristo, possamos viver segundo vosso amor e alcançar as graças que necessitamos, se forem da vossa vontade.

Amém.`
    },

    { type: "title", text: "Oração do dia" },
    {
      type: "text",
      text: `Pela Anunciação, inicia-se o mistério da salvação da humanidade.

Ajudai-nos a viver unidos a Cristo e a testemunhar Seu amor ao mundo.

Que nossa vida anuncie a Boa-Nova da salvação.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
    },

    { type: "title", text: "Oração Final" },
    {
      type: "prayer",
      text: `Ó Deus de amor e misericórdia, que na Anunciação revelastes o mistério da Encarnação do vosso Filho, nós vos agradecemos.

Concedei-nos viver segundo o exemplo de Maria, acolhendo vossa vontade com fé, humildade e amor.

Amém.`
    }
  ]
},

// ===== Novena a Santa Gemma Galgani =====
{
  novenaId: "novena_santa_gemma_galgani",
  day: 1,
  title: "Primeiro dia – Santa Gemma, amor a Cristo crucificado",
  sections: [
    { type: "title", text: "Sinal da Cruz" },
    { type: "prayer", text: "Em nome do Pai, do Filho e do Espírito Santo. Amém." },

    { type: "title", text: "Oração Inicial" },
    {
      type: "prayer",
      text: `Ó Santa Gemma Galgani, virgem fiel e apaixonada por Cristo crucificado, com confiança recorremos à vossa intercessão.

Vós que unistes vossa vida aos sofrimentos de Jesus e aceitastes com amor a cruz, ajudai-nos a compreender o valor redentor do sofrimento vivido com fé.

Concedei-nos a graça de rezar esta novena com coração sincero, para que, seguindo vosso exemplo de amor, humildade e entrega, possamos alcançar as graças que necessitamos, se forem da vontade de Deus.

Amém.`
    },

    { type: "title", text: "Oração do dia" },
    {
      type: "text",
      text: `Ó Santa Gemma, desde jovem fostes profundamente unida a Jesus crucificado.

Ensinai-nos a amar a Cristo acima de todas as coisas.

Que saibamos contemplar a cruz como fonte de salvação e de amor.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
    },

    { type: "title", text: "Oração Final" },
    {
      type: "prayer",
      text: `Ó Santa Gemma Galgani, modelo de amor a Cristo crucificado, rogai por nós.

Ajudai-nos a viver unidos a Jesus, aceitando a cruz com fé e confiança.

Amém.`
    }
  ]
},
{
  novenaId: "novena_santa_gemma_galgani",
  day: 2,
  title: "Segundo dia – Santa Gemma, exemplo de fé",
  sections: [
    { type: "title", text: "Sinal da Cruz" },
    { type: "prayer", text: "Em nome do Pai, do Filho e do Espírito Santo. Amém." },

    { type: "title", text: "Oração Inicial" },
    {
      type: "prayer",
      text: `Ó Santa Gemma Galgani, virgem fiel e apaixonada por Cristo crucificado, com confiança recorremos à vossa intercessão.

Vós que unistes vossa vida aos sofrimentos de Jesus e aceitastes com amor a cruz, ajudai-nos a compreender o valor redentor do sofrimento vivido com fé.

Concedei-nos a graça de rezar esta novena com coração sincero, para que, seguindo vosso exemplo de amor, humildade e entrega, possamos alcançar as graças que necessitamos, se forem da vontade de Deus.

Amém.`
    },

    { type: "title", text: "Oração do dia" },
    {
      type: "text",
      text: `Ó Santa Gemma, mesmo em meio às dores e incompreensões, permanecestes firme na fé.

Ajudai-nos a confiar em Deus nos momentos de prova e sofrimento.

Que nossa fé seja perseverante e sincera.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
    },

    { type: "title", text: "Oração Final" },
    {
      type: "prayer",
      text: `Ó Santa Gemma Galgani, modelo de amor a Cristo crucificado, rogai por nós.

Ajudai-nos a viver unidos a Jesus, aceitando a cruz com fé e confiança.

Amém.`
    }
  ]
},
{
  novenaId: "novena_santa_gemma_galgani",
  day: 3,
  title: "Terceiro dia – Santa Gemma, humildade e simplicidade",
  sections: [
    { type: "title", text: "Sinal da Cruz" },
    { type: "prayer", text: "Em nome do Pai, do Filho e do Espírito Santo. Amém." },

    { type: "title", text: "Oração Inicial" },
    {
      type: "prayer",
      text: `Ó Santa Gemma Galgani, virgem fiel e apaixonada por Cristo crucificado, com confiança recorremos à vossa intercessão.

Vós que unistes vossa vida aos sofrimentos de Jesus e aceitastes com amor a cruz, ajudai-nos a compreender o valor redentor do sofrimento vivido com fé.

Concedei-nos a graça de rezar esta novena com coração sincero, para que, seguindo vosso exemplo de amor, humildade e entrega, possamos alcançar as graças que necessitamos, se forem da vontade de Deus.

Amém.`
    },

    { type: "title", text: "Oração do dia" },
    {
      type: "text",
      text: `Ó Santa Gemma, vivestes com simplicidade e profundo espírito de humildade.

Ensinai-nos a rejeitar o orgulho e a buscar um coração simples diante de Deus.

Que saibamos servir com amor e discrição.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
    },

    { type: "title", text: "Oração Final" },
    {
      type: "prayer",
      text: `Ó Santa Gemma Galgani, modelo de amor a Cristo crucificado, rogai por nós.

Ajudai-nos a viver unidos a Jesus, aceitando a cruz com fé e confiança.

Amém.`
    }
  ]
},
{
  novenaId: "novena_santa_gemma_galgani",
  day: 4,
  title: "Quarto dia – Santa Gemma, aceitação do sofrimento",
  sections: [
    { type: "title", text: "Sinal da Cruz" },
    { type: "prayer", text: "Em nome do Pai, do Filho e do Espírito Santo. Amém." },

    { type: "title", text: "Oração Inicial" },
    {
      type: "prayer",
      text: `Ó Santa Gemma Galgani, virgem fiel e apaixonada por Cristo crucificado, com confiança recorremos à vossa intercessão.

Vós que unistes vossa vida aos sofrimentos de Jesus e aceitastes com amor a cruz, ajudai-nos a compreender o valor redentor do sofrimento vivido com fé.

Concedei-nos a graça de rezar esta novena com coração sincero, para que, seguindo vosso exemplo de amor, humildade e entrega, possamos alcançar as graças que necessitamos, se forem da vontade de Deus.

Amém.`
    },

    { type: "title", text: "Oração do dia" },
    {
      type: "text",
      text: `Ó Santa Gemma, aceitastes o sofrimento como participação na Paixão de Cristo.

Ajudai-nos a oferecer nossas dores e dificuldades ao Senhor.

Que saibamos transformar o sofrimento em oferta de amor.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
    },

    { type: "title", text: "Oração Final" },
    {
      type: "prayer",
      text: `Ó Santa Gemma Galgani, modelo de amor a Cristo crucificado, rogai por nós.

Ajudai-nos a viver unidos a Jesus, aceitando a cruz com fé e confiança.

Amém.`
    }
  ]
},
{
  novenaId: "novena_santa_gemma_galgani",
  day: 5,
  title: "Quinto dia – Santa Gemma, amor à oração",
  sections: [
    { type: "title", text: "Sinal da Cruz" },
    { type: "prayer", text: "Em nome do Pai, do Filho e do Espírito Santo. Amém." },

    { type: "title", text: "Oração Inicial" },
    {
      type: "prayer",
      text: `Ó Santa Gemma Galgani, virgem fiel e apaixonada por Cristo crucificado, com confiança recorremos à vossa intercessão.

Vós que unistes vossa vida aos sofrimentos de Jesus e aceitastes com amor a cruz, ajudai-nos a compreender o valor redentor do sofrimento vivido com fé.

Concedei-nos a graça de rezar esta novena com coração sincero, para que, seguindo vosso exemplo de amor, humildade e entrega, possamos alcançar as graças que necessitamos, se forem da vontade de Deus.

Amém.`
    },

    { type: "title", text: "Oração do dia" },
    {
      type: "text",
      text: `Ó Santa Gemma, encontrastes na oração força e consolo.

Ensinai-nos a cultivar uma vida de oração constante e confiante.

Que encontremos em Deus nossa paz e nossa esperança.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
    },

    { type: "title", text: "Oração Final" },
    {
      type: "prayer",
      text: `Ó Santa Gemma Galgani, modelo de amor a Cristo crucificado, rogai por nós.

Ajudai-nos a viver unidos a Jesus, aceitando a cruz com fé e confiança.

Amém.`
    }
  ]
},
{
  novenaId: "novena_santa_gemma_galgani",
  day: 6,
  title: "Sexto dia – Santa Gemma, pureza de coração",
  sections: [
    { type: "title", text: "Sinal da Cruz" },
    { type: "prayer", text: "Em nome do Pai, do Filho e do Espírito Santo. Amém." },

    { type: "title", text: "Oração Inicial" },
    {
      type: "prayer",
      text: `Ó Santa Gemma Galgani, virgem fiel e apaixonada por Cristo crucificado, com confiança recorremos à vossa intercessão.

Vós que unistes vossa vida aos sofrimentos de Jesus e aceitastes com amor a cruz, ajudai-nos a compreender o valor redentor do sofrimento vivido com fé.

Concedei-nos a graça de rezar esta novena com coração sincero, para que, seguindo vosso exemplo de amor, humildade e entrega, possamos alcançar as graças que necessitamos, se forem da vontade de Deus.

Amém.`
    },

    { type: "title", text: "Oração do dia" },
    {
      type: "text",
      text: `Ó Santa Gemma, vivestes com pureza de corpo e de alma.

Ajudai-nos a buscar a santidade no pensamento, nas palavras e nas ações.

Que nosso coração seja morada digna de Deus.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
    },

    { type: "title", text: "Oração Final" },
    {
      type: "prayer",
      text: `Ó Santa Gemma Galgani, modelo de amor a Cristo crucificado, rogai por nós.

Ajudai-nos a viver unidos a Jesus, aceitando a cruz com fé e confiança.

Amém.`
    }
  ]
},
{
  novenaId: "novena_santa_gemma_galgani",
  day: 7,
  title: "Sétimo dia – Santa Gemma, obediência e entrega",
  sections: [
    { type: "title", text: "Sinal da Cruz" },
    { type: "prayer", text: "Em nome do Pai, do Filho e do Espírito Santo. Amém." },

    { type: "title", text: "Oração Inicial" },
    {
      type: "prayer",
      text: `Ó Santa Gemma Galgani, virgem fiel e apaixonada por Cristo crucificado, com confiança recorremos à vossa intercessão.

Vós que unistes vossa vida aos sofrimentos de Jesus e aceitastes com amor a cruz, ajudai-nos a compreender o valor redentor do sofrimento vivido com fé.

Concedei-nos a graça de rezar esta novena com coração sincero, para que, seguindo vosso exemplo de amor, humildade e entrega, possamos alcançar as graças que necessitamos, se forem da vontade de Deus.

Amém.`
    },

    { type: "title", text: "Oração do dia" },
    {
      type: "text",
      text: `Ó Santa Gemma, aceitastes com obediência a vontade de Deus em vossa vida.

Ensinai-nos a confiar nos planos do Senhor, mesmo quando são difíceis.

Que saibamos dizer sim à vontade divina.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
    },

    { type: "title", text: "Oração Final" },
    {
      type: "prayer",
      text: `Ó Santa Gemma Galgani, modelo de amor a Cristo crucificado, rogai por nós.

Ajudai-nos a viver unidos a Jesus, aceitando a cruz com fé e confiança.

Amém.`
    }
  ]
},
{
  novenaId: "novena_santa_gemma_galgani",
  day: 8,
  title: "Oitavo dia – Santa Gemma, intimidade com Jesus",
  sections: [
    { type: "title", text: "Sinal da Cruz" },
    { type: "prayer", text: "Em nome do Pai, do Filho e do Espírito Santo. Amém." },

    { type: "title", text: "Oração Inicial" },
    {
      type: "prayer",
      text: `Ó Santa Gemma Galgani, virgem fiel e apaixonada por Cristo crucificado, com confiança recorremos à vossa intercessão.

Vós que unistes vossa vida aos sofrimentos de Jesus e aceitastes com amor a cruz, ajudai-nos a compreender o valor redentor do sofrimento vivido com fé.

Concedei-nos a graça de rezar esta novena com coração sincero, para que, seguindo vosso exemplo de amor, humildade e entrega, possamos alcançar as graças que necessitamos, se forem da vontade de Deus.

Amém.`
    },

    { type: "title", text: "Oração do dia" },
    {
      type: "text",
      text: `Ó Santa Gemma, vivestes profunda intimidade com Jesus na Eucaristia e na oração.

Ajudai-nos a buscar maior união com Cristo.

Que nossa vida seja marcada pela presença de Deus.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
    },

    { type: "title", text: "Oração Final" },
    {
      type: "prayer",
      text: `Ó Santa Gemma Galgani, modelo de amor a Cristo crucificado, rogai por nós.

Ajudai-nos a viver unidos a Jesus, aceitando a cruz com fé e confiança.

Amém.`
    }
  ]
},
{
  novenaId: "novena_santa_gemma_galgani",
  day: 9,
  title: "Nono dia – Santa Gemma, intercessora dos aflitos",
  sections: [
    { type: "title", text: "Sinal da Cruz" },
    { type: "prayer", text: "Em nome do Pai, do Filho e do Espírito Santo. Amém." },

    { type: "title", text: "Oração Inicial" },
    {
      type: "prayer",
      text: `Ó Santa Gemma Galgani, virgem fiel e apaixonada por Cristo crucificado, com confiança recorremos à vossa intercessão.

Vós que unistes vossa vida aos sofrimentos de Jesus e aceitastes com amor a cruz, ajudai-nos a compreender o valor redentor do sofrimento vivido com fé.

Concedei-nos a graça de rezar esta novena com coração sincero, para que, seguindo vosso exemplo de amor, humildade e entrega, possamos alcançar as graças que necessitamos, se forem da vontade de Deus.

Amém.`
    },

    { type: "title", text: "Oração do dia" },
    {
      type: "text",
      text: `Ó gloriosa Santa Gemma Galgani, confiamos em vossa poderosa intercessão.

Apresentai a Deus nossos pedidos, especialmente pelos que sofrem no corpo e na alma.

Conduzi-nos sempre no caminho da fé, da esperança e do amor.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
    },

    { type: "title", text: "Oração Final" },
    {
      type: "prayer",
      text: `Ó Santa Gemma Galgani, modelo de amor a Cristo crucificado, rogai por nós.

Ajudai-nos a viver unidos a Jesus, aceitando a cruz com fé e confiança.

Amém.`
    }
  ]
},
// ===== Novena a São Jorge =====
{
  novenaId: "novena_sao_jorge",
  day: 1,
  title: "Primeiro dia – São Jorge, soldado de Cristo",
  sections: [
    { type: "title", text: "Sinal da Cruz" },
    { type: "prayer", text: "Em nome do Pai, do Filho e do Espírito Santo. Amém." },

    { type: "title", text: "Oração Inicial" },
    {
      type: "prayer",
      text: `Ó glorioso São Jorge, valente mártir e fiel servo de Deus, com confiança recorremos à vossa poderosa intercessão.

Vós que enfrentastes o mal com coragem, fé e total confiança em Cristo, ajudai-nos a combater o pecado, as injustiças e tudo o que nos afasta de Deus.

Concedei-nos a graça de rezar esta novena com fé sincera, para que, fortalecidos por vosso exemplo, possamos vencer as batalhas da vida espiritual e alcançar as graças que necessitamos, se forem da vontade de Deus.

Amém.`
    },

    { type: "title", text: "Oração do dia" },
    {
      type: "text",
      text: `Ó São Jorge, escolhestes servir a Cristo com fidelidade, mesmo diante das perseguições.

Ensinai-nos a ser verdadeiros soldados de Cristo, firmes na fé e corajosos no testemunho do Evangelho.

Que nunca neguemos nossa fé por medo ou comodismo.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
    },

    { type: "title", text: "Oração Final" },
    {
      type: "prayer",
      text: `Ó São Jorge, valente mártir e defensor da fé, rogai por nós.

Ajudai-nos a vencer as batalhas da vida com fé, coragem e confiança em Deus.

Amém.`
    }
  ]
},
{
  novenaId: "novena_sao_jorge",
  day: 2,
  title: "Segundo dia – São Jorge, exemplo de coragem",
  sections: [
    { type: "title", text: "Sinal da Cruz" },
    { type: "prayer", text: "Em nome do Pai, do Filho e do Espírito Santo. Amém." },

    { type: "title", text: "Oração Inicial" },
    {
      type: "prayer",
      text: `Ó glorioso São Jorge, valente mártir e fiel servo de Deus, com confiança recorremos à vossa poderosa intercessão.

Vós que enfrentastes o mal com coragem, fé e total confiança em Cristo, ajudai-nos a combater o pecado, as injustiças e tudo o que nos afasta de Deus.

Concedei-nos a graça de rezar esta novena com fé sincera, para que, fortalecidos por vosso exemplo, possamos vencer as batalhas da vida espiritual e alcançar as graças que necessitamos, se forem da vontade de Deus.

Amém.`
    },

    { type: "title", text: "Oração do dia" },
    {
      type: "text",
      text: `Ó São Jorge, enfrentastes os inimigos da fé com bravura e confiança em Deus.

Ajudai-nos a enfrentar os desafios da vida com coragem e esperança.

Que nossa força venha sempre do Senhor.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
    },

    { type: "title", text: "Oração Final" },
    {
      type: "prayer",
      text: `Ó São Jorge, valente mártir e defensor da fé, rogai por nós.

Ajudai-nos a vencer as batalhas da vida com fé, coragem e confiança em Deus.

Amém.`
    }
  ]
},
{
  novenaId: "novena_sao_jorge",
  day: 3,
  title: "Terceiro dia – São Jorge, fidelidade a Deus",
  sections: [
    { type: "title", text: "Sinal da Cruz" },
    { type: "prayer", text: "Em nome do Pai, do Filho e do Espírito Santo. Amém." },

    { type: "title", text: "Oração Inicial" },
    {
      type: "prayer",
      text: `Ó glorioso São Jorge, valente mártir e fiel servo de Deus, com confiança recorremos à vossa poderosa intercessão.

Vós que enfrentastes o mal com coragem, fé e total confiança em Cristo, ajudai-nos a combater o pecado, as injustiças e tudo o que nos afasta de Deus.

Concedei-nos a graça de rezar esta novena com fé sincera, para que, fortalecidos por vosso exemplo, possamos vencer as batalhas da vida espiritual e alcançar as graças que necessitamos, se forem da vontade de Deus.

Amém.`
    },

    { type: "title", text: "Oração do dia" },
    {
      type: "text",
      text: `Ó São Jorge, permanecestes fiel a Deus até o martírio.

Ensinai-nos a ser fiéis a Cristo em todas as circunstâncias.

Que nossa vida seja testemunho de fidelidade e amor a Deus.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
    },

    { type: "title", text: "Oração Final" },
    {
      type: "prayer",
      text: `Ó São Jorge, valente mártir e defensor da fé, rogai por nós.

Ajudai-nos a vencer as batalhas da vida com fé, coragem e confiança em Deus.

Amém.`
    }
  ]
},
{
  novenaId: "novena_sao_jorge",
  day: 4,
  title: "Quarto dia – São Jorge, defensor do bem",
  sections: [
    { type: "title", text: "Sinal da Cruz" },
    { type: "prayer", text: "Em nome do Pai, do Filho e do Espírito Santo. Amém." },

    { type: "title", text: "Oração Inicial" },
    {
      type: "prayer",
      text: `Ó glorioso São Jorge, valente mártir e fiel servo de Deus, com confiança recorremos à vossa poderosa intercessão.

Vós que enfrentastes o mal com coragem, fé e total confiança em Cristo, ajudai-nos a combater o pecado, as injustiças e tudo o que nos afasta de Deus.

Concedei-nos a graça de rezar esta novena com fé sincera, para que, fortalecidos por vosso exemplo, possamos vencer as batalhas da vida espiritual e alcançar as graças que necessitamos, se forem da vontade de Deus.

Amém.`
    },

    { type: "title", text: "Oração do dia" },
    {
      type: "text",
      text: `Ó São Jorge, lutastes contra o mal e defendestes a verdade.

Ajudai-nos a rejeitar o pecado e a viver segundo a justiça.

Que sejamos defensores do bem em nossas atitudes diárias.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
    },

    { type: "title", text: "Oração Final" },
    {
      type: "prayer",
      text: `Ó São Jorge, valente mártir e defensor da fé, rogai por nós.

Ajudai-nos a vencer as batalhas da vida com fé, coragem e confiança em Deus.

Amém.`
    }
  ]
},
{
  novenaId: "novena_sao_jorge",
  day: 5,
  title: "Quinto dia – São Jorge, confiança na providência divina",
  sections: [
    { type: "title", text: "Sinal da Cruz" },
    { type: "prayer", text: "Em nome do Pai, do Filho e do Espírito Santo. Amém." },

    { type: "title", text: "Oração Inicial" },
    {
      type: "prayer",
      text: `Ó glorioso São Jorge, valente mártir e fiel servo de Deus, com confiança recorremos à vossa poderosa intercessão.

Vós que enfrentastes o mal com coragem, fé e total confiança em Cristo, ajudai-nos a combater o pecado, as injustiças e tudo o que nos afasta de Deus.

Concedei-nos a graça de rezar esta novena com fé sincera, para que, fortalecidos por vosso exemplo, possamos vencer as batalhas da vida espiritual e alcançar as graças que necessitamos, se forem da vontade de Deus.

Amém.`
    },

    { type: "title", text: "Oração do dia" },
    {
      type: "text",
      text: `Ó São Jorge, mesmo diante da morte, confiastes plenamente em Deus.

Ajudai-nos a confiar na providência divina nos momentos de dificuldade.

Que nunca percamos a fé diante das provações.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
    },

    { type: "title", text: "Oração Final" },
    {
      type: "prayer",
      text: `Ó São Jorge, valente mártir e defensor da fé, rogai por nós.

Ajudai-nos a vencer as batalhas da vida com fé, coragem e confiança em Deus.

Amém.`
    }
  ]
},
{
  novenaId: "novena_sao_jorge",
  day: 6,
  title: "Sexto dia – São Jorge, fortaleza nas lutas espirituais",
  sections: [
    { type: "title", text: "Sinal da Cruz" },
    { type: "prayer", text: "Em nome do Pai, do Filho e do Espírito Santo. Amém." },

    { type: "title", text: "Oração Inicial" },
    {
      type: "prayer",
      text: `Ó glorioso São Jorge, valente mártir e fiel servo de Deus, com confiança recorremos à vossa poderosa intercessão.

Vós que enfrentastes o mal com coragem, fé e total confiança em Cristo, ajudai-nos a combater o pecado, as injustiças e tudo o que nos afasta de Deus.

Concedei-nos a graça de rezar esta novena com fé sincera, para que, fortalecidos por vosso exemplo, possamos vencer as batalhas da vida espiritual e alcançar as graças que necessitamos, se forem da vontade de Deus.

Amém.`
    },

    { type: "title", text: "Oração do dia" },
    {
      type: "text",
      text: `Ó São Jorge, sois invocado como protetor nas batalhas espirituais.

Intercedei por nós contra as tentações e perigos da alma.

Fortalecei-nos com a graça de Deus.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
    },

    { type: "title", text: "Oração Final" },
    {
      type: "prayer",
      text: `Ó São Jorge, valente mártir e defensor da fé, rogai por nós.

Ajudai-nos a vencer as batalhas da vida com fé, coragem e confiança em Deus.

Amém.`
    }
  ]
},
{
  novenaId: "novena_sao_jorge",
  day: 7,
  title: "Sétimo dia – São Jorge, exemplo de perseverança",
  sections: [
    { type: "title", text: "Sinal da Cruz" },
    { type: "prayer", text: "Em nome do Pai, do Filho e do Espírito Santo. Amém." },

    { type: "title", text: "Oração Inicial" },
    {
      type: "prayer",
      text: `Ó glorioso São Jorge, valente mártir e fiel servo de Deus, com confiança recorremos à vossa poderosa intercessão.

Vós que enfrentastes o mal com coragem, fé e total confiança em Cristo, ajudai-nos a combater o pecado, as injustiças e tudo o que nos afasta de Deus.

Concedei-nos a graça de rezar esta novena com fé sincera, para que, fortalecidos por vosso exemplo, possamos vencer as batalhas da vida espiritual e alcançar as graças que necessitamos, se forem da vontade de Deus.

Amém.`
    },

    { type: "title", text: "Oração do dia" },
    {
      type: "text",
      text: `Ó São Jorge, perseverastes na fé até o fim de vossa vida.

Ajudai-nos a perseverar no caminho cristão, mesmo diante das dificuldades.

Que sejamos firmes e constantes na fé.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
    },

    { type: "title", text: "Oração Final" },
    {
      type: "prayer",
      text: `Ó São Jorge, valente mártir e defensor da fé, rogai por nós.

Ajudai-nos a vencer as batalhas da vida com fé, coragem e confiança em Deus.

Amém.`
    }
  ]
},
{
  novenaId: "novena_sao_jorge",
  day: 8,
  title: "Oitavo dia – São Jorge, protetor dos aflitos",
  sections: [
    { type: "title", text: "Sinal da Cruz" },
    { type: "prayer", text: "Em nome do Pai, do Filho e do Espírito Santo. Amém." },

    { type: "title", text: "Oração Inicial" },
    {
      type: "prayer",
      text: `Ó glorioso São Jorge, valente mártir e fiel servo de Deus, com confiança recorremos à vossa poderosa intercessão.

Vós que enfrentastes o mal com coragem, fé e total confiança em Cristo, ajudai-nos a combater o pecado, as injustiças e tudo o que nos afasta de Deus.

Concedei-nos a graça de rezar esta novena com fé sincera, para que, fortalecidos por vosso exemplo, possamos vencer as batalhas da vida espiritual e alcançar as graças que necessitamos, se forem da vontade de Deus.

Amém.`
    },

    { type: "title", text: "Oração do dia" },
    {
      type: "text",
      text: `Ó São Jorge, muitos recorrem a vós em momentos de aflição e perigo.

Intercedei por todos os que sofrem, que vivem angustiados ou ameaçados pelo mal.

Concedei-nos paz e proteção.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
    },

    { type: "title", text: "Oração Final" },
    {
      type: "prayer",
      text: `Ó São Jorge, valente mártir e defensor da fé, rogai por nós.

Ajudai-nos a vencer as batalhas da vida com fé, coragem e confiança em Deus.

Amém.`
    }
  ]
},
{
  novenaId: "novena_sao_jorge",
  day: 9,
  title: "Nono dia – São Jorge, intercessor poderoso",
  sections: [
    { type: "title", text: "Sinal da Cruz" },
    { type: "prayer", text: "Em nome do Pai, do Filho e do Espírito Santo. Amém." },

    { type: "title", text: "Oração Inicial" },
    {
      type: "prayer",
      text: `Ó glorioso São Jorge, valente mártir e fiel servo de Deus, com confiança recorremos à vossa poderosa intercessão.

Vós que enfrentastes o mal com coragem, fé e total confiança em Cristo, ajudai-nos a combater o pecado, as injustiças e tudo o que nos afasta de Deus.

Concedei-nos a graça de rezar esta novena com fé sincera, para que, fortalecidos por vosso exemplo, possamos vencer as batalhas da vida espiritual e alcançar as graças que necessitamos, se forem da vontade de Deus.

Amém.`
    },

    { type: "title", text: "Oração do dia" },
    {
      type: "text",
      text: `Ó glorioso São Jorge, confiamos em vossa poderosa intercessão junto a Deus.

Apresentai ao Senhor nossas necessidades, intenções e pedidos.

Conduzi-nos sempre no caminho da fé, da coragem e da salvação.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
    },

    { type: "title", text: "Oração Final" },
    {
      type: "prayer",
      text: `Ó São Jorge, valente mártir e defensor da fé, rogai por nós.

Ajudai-nos a vencer as batalhas da vida com fé, coragem e confiança em Deus.

Amém.`
    }
  ]
},
// ===== Novena a Santa Gianna Beretta Molla =====
{
  novenaId: "novena_santa_gianna_beretta_molla",
  day: 1,
  title: "Primeiro dia – Santa Gianna, mulher de fé",
  sections: [
    { type: "title", text: "Sinal da Cruz" },
    { type: "prayer", text: "Em nome do Pai, do Filho e do Espírito Santo. Amém." },

    { type: "title", text: "Oração Inicial" },
    {
      type: "prayer",
      text: `Ó Santa Gianna Beretta Molla, mulher de fé profunda, esposa dedicada, mãe amorosa e testemunha do valor sagrado da vida, com confiança recorremos à vossa intercessão.

Vós que vivestes a vocação cristã no cotidiano, unindo fé, família, trabalho e amor ao próximo, ajudai-nos a viver com fidelidade o chamado que Deus nos faz.

Concedei-nos a graça de rezar esta novena com fé sincera, para que, seguindo vosso exemplo de amor, coragem e entrega, possamos alcançar as graças que necessitamos, se forem da vontade de Deus.

Amém.`
    },

    { type: "title", text: "Oração do dia" },
    {
      type: "text",
      text: `Ó Santa Gianna, vivestes uma fé simples e profunda em todas as circunstâncias da vida.

Ensinai-nos a confiar em Deus em cada momento, nas alegrias e nas dificuldades.

Que nossa fé seja viva e perseverante.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
    },

    { type: "title", text: "Oração Final" },
    {
      type: "prayer",
      text: `Ó Santa Gianna Beretta Molla, exemplo de amor à vida, à família e a Deus, rogai por nós.

Ajudai-nos a viver com fé, coragem e fidelidade ao Evangelho.

Amém.`
    }
  ]
},
{
  novenaId: "novena_santa_gianna_beretta_molla",
  day: 2,
  title: "Segundo dia – Santa Gianna, amor à vida",
  sections: [
    { type: "title", text: "Sinal da Cruz" },
    { type: "prayer", text: "Em nome do Pai, do Filho e do Espírito Santo. Amém." },

    { type: "title", text: "Oração Inicial" },
    {
      type: "prayer",
      text: `Ó Santa Gianna Beretta Molla, mulher de fé profunda, esposa dedicada, mãe amorosa e testemunha do valor sagrado da vida, com confiança recorremos à vossa intercessão.

Vós que vivestes a vocação cristã no cotidiano, unindo fé, família, trabalho e amor ao próximo, ajudai-nos a viver com fidelidade o chamado que Deus nos faz.

Concedei-nos a graça de rezar esta novena com fé sincera, para que, seguindo vosso exemplo de amor, coragem e entrega, possamos alcançar as graças que necessitamos, se forem da vontade de Deus.

Amém.`
    },

    { type: "title", text: "Oração do dia" },
    {
      type: "text",
      text: `Ó Santa Gianna, defendestes a vida humana desde sua concepção até o fim natural.

Ajudai-nos a reconhecer e respeitar o dom sagrado da vida.

Que sejamos sempre defensores da dignidade humana.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
    },

    { type: "title", text: "Oração Final" },
    {
      type: "prayer",
      text: `Ó Santa Gianna Beretta Molla, exemplo de amor à vida, à família e a Deus, rogai por nós.

Ajudai-nos a viver com fé, coragem e fidelidade ao Evangelho.

Amém.`
    }
  ]
},
{
  novenaId: "novena_santa_gianna_beretta_molla",
  day: 3,
  title: "Terceiro dia – Santa Gianna, esposa dedicada",
  sections: [
    { type: "title", text: "Sinal da Cruz" },
    { type: "prayer", text: "Em nome do Pai, do Filho e do Espírito Santo. Amém." },

    { type: "title", text: "Oração Inicial" },
    {
      type: "prayer",
      text: `Ó Santa Gianna Beretta Molla, mulher de fé profunda, esposa dedicada, mãe amorosa e testemunha do valor sagrado da vida, com confiança recorremos à vossa intercessão.

Vós que vivestes a vocação cristã no cotidiano, unindo fé, família, trabalho e amor ao próximo, ajudai-nos a viver com fidelidade o chamado que Deus nos faz.

Concedei-nos a graça de rezar esta novena com fé sincera, para que, seguindo vosso exemplo de amor, coragem e entrega, possamos alcançar as graças que necessitamos, se forem da vontade de Deus.

Amém.`
    },

    { type: "title", text: "Oração do dia" },
    {
      type: "text",
      text: `Ó Santa Gianna, vivestes o matrimônio com amor, fidelidade e entrega.

Intercedei pelas famílias, para que vivam unidas no amor e na fé.

Ajudai-nos a construir lares firmados em Deus.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
    },

    { type: "title", text: "Oração Final" },
    {
      type: "prayer",
      text: `Ó Santa Gianna Beretta Molla, exemplo de amor à vida, à família e a Deus, rogai por nós.

Ajudai-nos a viver com fé, coragem e fidelidade ao Evangelho.

Amém.`
    }
  ]
},
{
  novenaId: "novena_santa_gianna_beretta_molla",
  day: 4,
  title: "Quarto dia – Santa Gianna, mãe amorosa",
  sections: [
    { type: "title", text: "Sinal da Cruz" },
    { type: "prayer", text: "Em nome do Pai, do Filho e do Espírito Santo. Amém." },

    { type: "title", text: "Oração Inicial" },
    {
      type: "prayer",
      text: `Ó Santa Gianna Beretta Molla, mulher de fé profunda, esposa dedicada, mãe amorosa e testemunha do valor sagrado da vida, com confiança recorremos à vossa intercessão.

Vós que vivestes a vocação cristã no cotidiano, unindo fé, família, trabalho e amor ao próximo, ajudai-nos a viver com fidelidade o chamado que Deus nos faz.

Concedei-nos a graça de rezar esta novena com fé sincera, para que, seguindo vosso exemplo de amor, coragem e entrega, possamos alcançar as graças que necessitamos, se forem da vontade de Deus.

Amém.`
    },

    { type: "title", text: "Oração do dia" },
    {
      type: "text",
      text: `Ó Santa Gianna, acolhestes a maternidade como dom e missão.

Ajudai todas as mães a viverem sua vocação com amor e coragem.

Protegei as crianças e fortalecei as famílias.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
    },

    { type: "title", text: "Oração Final" },
    {
      type: "prayer",
      text: `Ó Santa Gianna Beretta Molla, exemplo de amor à vida, à família e a Deus, rogai por nós.

Ajudai-nos a viver com fé, coragem e fidelidade ao Evangelho.

Amém.`
    }
  ]
},
{
  novenaId: "novena_santa_gianna_beretta_molla",
  day: 5,
  title: "Quinto dia – Santa Gianna, testemunho de caridade",
  sections: [
    { type: "title", text: "Sinal da Cruz" },
    { type: "prayer", text: "Em nome do Pai, do Filho e do Espírito Santo. Amém." },

    { type: "title", text: "Oração Inicial" },
    {
      type: "prayer",
      text: `Ó Santa Gianna Beretta Molla, mulher de fé profunda, esposa dedicada, mãe amorosa e testemunha do valor sagrado da vida, com confiança recorremos à vossa intercessão.

Vós que vivestes a vocação cristã no cotidiano, unindo fé, família, trabalho e amor ao próximo, ajudai-nos a viver com fidelidade o chamado que Deus nos faz.

Concedei-nos a graça de rezar esta novena com fé sincera, para que, seguindo vosso exemplo de amor, coragem e entrega, possamos alcançar as graças que necessitamos, se forem da vontade de Deus.

Amém.`
    },

    { type: "title", text: "Oração do dia" },
    {
      type: "text",
      text: `Ó Santa Gianna, dedicastes vossa vida ao cuidado dos doentes e necessitados.

Ensinai-nos a servir o próximo com amor, generosidade e compaixão.

Que nossas ações revelem a presença de Cristo.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
    },

    { type: "title", text: "Oração Final" },
    {
      type: "prayer",
      text: `Ó Santa Gianna Beretta Molla, exemplo de amor à vida, à família e a Deus, rogai por nós.

Ajudai-nos a viver com fé, coragem e fidelidade ao Evangelho.

Amém.`
    }
  ]
},
{
  novenaId: "novena_santa_gianna_beretta_molla",
  day: 6,
  title: "Sexto dia – Santa Gianna, coragem no sofrimento",
  sections: [
    { type: "title", text: "Sinal da Cruz" },
    { type: "prayer", text: "Em nome do Pai, do Filho e do Espírito Santo. Amém." },

    { type: "title", text: "Oração Inicial" },
    {
      type: "prayer",
      text: `Ó Santa Gianna Beretta Molla, mulher de fé profunda, esposa dedicada, mãe amorosa e testemunha do valor sagrado da vida, com confiança recorremos à vossa intercessão.

Vós que vivestes a vocação cristã no cotidiano, unindo fé, família, trabalho e amor ao próximo, ajudai-nos a viver com fidelidade o chamado que Deus nos faz.

Concedei-nos a graça de rezar esta novena com fé sincera, para que, seguindo vosso exemplo de amor, coragem e entrega, possamos alcançar as graças que necessitamos, se forem da vontade de Deus.

Amém.`
    },

    { type: "title", text: "Oração do dia" },
    {
      type: "text",
      text: `Ó Santa Gianna, aceitastes o sofrimento confiando plenamente em Deus.

Ajudai-nos a enfrentar as dores da vida com fé e esperança.

Que saibamos oferecer nossos sofrimentos ao Senhor.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
    },

    { type: "title", text: "Oração Final" },
    {
      type: "prayer",
      text: `Ó Santa Gianna Beretta Molla, exemplo de amor à vida, à família e a Deus, rogai por nós.

Ajudai-nos a viver com fé, coragem e fidelidade ao Evangelho.

Amém.`
    }
  ]
},
{
  novenaId: "novena_santa_gianna_beretta_molla",
  day: 7,
  title: "Sétimo dia – Santa Gianna, entrega total a Deus",
  sections: [
    { type: "title", text: "Sinal da Cruz" },
    { type: "prayer", text: "Em nome do Pai, do Filho e do Espírito Santo. Amém." },

    { type: "title", text: "Oração Inicial" },
    {
      type: "prayer",
      text: `Ó Santa Gianna Beretta Molla, mulher de fé profunda, esposa dedicada, mãe amorosa e testemunha do valor sagrado da vida, com confiança recorremos à vossa intercessão.

Vós que vivestes a vocação cristã no cotidiano, unindo fé, família, trabalho e amor ao próximo, ajudai-nos a viver com fidelidade o chamado que Deus nos faz.

Concedei-nos a graça de rezar esta novena com fé sincera, para que, seguindo vosso exemplo de amor, coragem e entrega, possamos alcançar as graças que necessitamos, se forem da vontade de Deus.

Amém.`
    },

    { type: "title", text: "Oração do dia" },
    {
      type: "text",
      text: `Ó Santa Gianna, colocastes a vontade de Deus acima de tudo.

Ensinai-nos a viver com generosidade e confiança nos planos do Senhor.

Que saibamos dizer sim a Deus em todas as circunstâncias.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
    },

    { type: "title", text: "Oração Final" },
    {
      type: "prayer",
      text: `Ó Santa Gianna Beretta Molla, exemplo de amor à vida, à família e a Deus, rogai por nós.

Ajudai-nos a viver com fé, coragem e fidelidade ao Evangelho.

Amém.`
    }
  ]
},
{
  novenaId: "novena_santa_gianna_beretta_molla",
  day: 8,
  title: "Oitavo dia – Santa Gianna, santidade no cotidiano",
  sections: [
    { type: "title", text: "Sinal da Cruz" },
    { type: "prayer", text: "Em nome do Pai, do Filho e do Espírito Santo. Amém." },

    { type: "title", text: "Oração Inicial" },
    {
      type: "prayer",
      text: `Ó Santa Gianna Beretta Molla, mulher de fé profunda, esposa dedicada, mãe amorosa e testemunha do valor sagrado da vida, com confiança recorremos à vossa intercessão.

Vós que vivestes a vocação cristã no cotidiano, unindo fé, família, trabalho e amor ao próximo, ajudai-nos a viver com fidelidade o chamado que Deus nos faz.

Concedei-nos a graça de rezar esta novena com fé sincera, para que, seguindo vosso exemplo de amor, coragem e entrega, possamos alcançar as graças que necessitamos, se forem da vontade de Deus.

Amém.`
    },

    { type: "title", text: "Oração do dia" },
    {
      type: "text",
      text: `Ó Santa Gianna, mostrais que a santidade é possível na vida comum.

Ajudai-nos a buscar a santidade em nossas tarefas diárias.

Que vivamos com alegria, responsabilidade e amor cristão.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
    },

    { type: "title", text: "Oração Final" },
    {
      type: "prayer",
      text: `Ó Santa Gianna Beretta Molla, exemplo de amor à vida, à família e a Deus, rogai por nós.

Ajudai-nos a viver com fé, coragem e fidelidade ao Evangelho.

Amém.`
    }
  ]
},
{
  novenaId: "novena_santa_gianna_beretta_molla",
  day: 9,
  title: "Nono dia – Santa Gianna, intercessora das famílias e da vida",
  sections: [
    { type: "title", text: "Sinal da Cruz" },
    { type: "prayer", text: "Em nome do Pai, do Filho e do Espírito Santo. Amém." },

    { type: "title", text: "Oração Inicial" },
    {
      type: "prayer",
      text: `Ó Santa Gianna Beretta Molla, mulher de fé profunda, esposa dedicada, mãe amorosa e testemunha do valor sagrado da vida, com confiança recorremos à vossa intercessão.

Vós que vivestes a vocação cristã no cotidiano, unindo fé, família, trabalho e amor ao próximo, ajudai-nos a viver com fidelidade o chamado que Deus nos faz.

Concedei-nos a graça de rezar esta novena com fé sincera, para que, seguindo vosso exemplo de amor, coragem e entrega, possamos alcançar as graças que necessitamos, se forem da vontade de Deus.

Amém.`
    },

    { type: "title", text: "Oração do dia" },
    {
      type: "text",
      text: `Ó gloriosa Santa Gianna Beretta Molla, confiamos em vossa poderosa intercessão.

Apresentai a Deus nossas intenções, especialmente pelas famílias, pelas mães e pela defesa da vida.

Conduzi-nos sempre no caminho da fé, do amor e da salvação.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
    },

    { type: "title", text: "Oração Final" },
    {
      type: "prayer",
      text: `Ó Santa Gianna Beretta Molla, exemplo de amor à vida, à família e a Deus, rogai por nós.

Ajudai-nos a viver com fé, coragem e fidelidade ao Evangelho.

Amém.`
    }
  ]
},

// ===== Novena a Santa Catarina de Siena =====
{
  novenaId: "novena_santa_catarina_de_siena",
  day: 1,
  title: "Primeiro dia – Santa Catarina, amor a Cristo",
  sections: [
    { type: "title", text: "Sinal da Cruz" },
    { type: "prayer", text: "Em nome do Pai, do Filho e do Espírito Santo. Amém." },

    { type: "title", text: "Oração Inicial" },
    {
      type: "prayer",
      text: `Ó Santa Catarina de Siena, virgem consagrada, doutora da Igreja e ardente amante de Cristo, com confiança recorremos à vossa intercessão.

Vós que unistes profunda vida de oração com intenso amor pela Igreja e pelos irmãos, ajudai-nos a viver na verdade, na caridade e na fidelidade ao Evangelho.

Concedei-nos a graça de rezar esta novena com fé sincera, para que, seguindo vosso exemplo de amor a Deus e à Igreja, possamos alcançar as graças que necessitamos, se forem da vontade do Senhor.

Amém.`
    },

    { type: "title", text: "Oração do dia" },
    {
      type: "text",
      text: `Ó Santa Catarina, desde jovem entregastes vosso coração inteiramente a Jesus.

Ensinai-nos a amar a Cristo acima de todas as coisas.

Que nossa vida seja centrada no amor a Deus.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
    },

    { type: "title", text: "Oração Final" },
    {
      type: "prayer",
      text: `Ó Santa Catarina de Siena, doutora da Igreja e serva fiel de Cristo, rogai por nós.

Ajudai-nos a viver na caridade, na verdade e no amor à Igreja.

Amém.`
    }
  ]
},
{
  novenaId: "novena_santa_catarina_de_siena",
  day: 2,
  title: "Segundo dia – Santa Catarina, vida de oração",
  sections: [
    { type: "title", text: "Sinal da Cruz" },
    { type: "prayer", text: "Em nome do Pai, do Filho e do Espírito Santo. Amém." },

    { type: "title", text: "Oração Inicial" },
    {
      type: "prayer",
      text: `Ó Santa Catarina de Siena, virgem consagrada, doutora da Igreja e ardente amante de Cristo, com confiança recorremos à vossa intercessão.

Vós que unistes profunda vida de oração com intenso amor pela Igreja e pelos irmãos, ajudai-nos a viver na verdade, na caridade e na fidelidade ao Evangelho.

Concedei-nos a graça de rezar esta novena com fé sincera, para que, seguindo vosso exemplo de amor a Deus e à Igreja, possamos alcançar as graças que necessitamos, se forem da vontade do Senhor.

Amém.`
    },

    { type: "title", text: "Oração do dia" },
    {
      type: "text",
      text: `Ó Santa Catarina, encontrastes na oração a força para viver e servir.

Ajudai-nos a cultivar uma vida de oração profunda e perseverante.

Que busquemos sempre a intimidade com Deus.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
    },

    { type: "title", text: "Oração Final" },
    {
      type: "prayer",
      text: `Ó Santa Catarina de Siena, doutora da Igreja e serva fiel de Cristo, rogai por nós.

Ajudai-nos a viver na caridade, na verdade e no amor à Igreja.

Amém.`
    }
  ]
},
{
  novenaId: "novena_santa_catarina_de_siena",
  day: 3,
  title: "Terceiro dia – Santa Catarina, humildade e obediência",
  sections: [
    { type: "title", text: "Sinal da Cruz" },
    { type: "prayer", text: "Em nome do Pai, do Filho e do Espírito Santo. Amém." },

    { type: "title", text: "Oração Inicial" },
    {
      type: "prayer",
      text: `Ó Santa Catarina de Siena, virgem consagrada, doutora da Igreja e ardente amante de Cristo, com confiança recorremos à vossa intercessão.

Vós que unistes profunda vida de oração com intenso amor pela Igreja e pelos irmãos, ajudai-nos a viver na verdade, na caridade e na fidelidade ao Evangelho.

Concedei-nos a graça de rezar esta novena com fé sincera, para que, seguindo vosso exemplo de amor a Deus e à Igreja, possamos alcançar as graças que necessitamos, se forem da vontade do Senhor.

Amém.`
    },

    { type: "title", text: "Oração do dia" },
    {
      type: "text",
      text: `Ó Santa Catarina, vivestes com humildade e obediência à vontade de Deus.

Ensinai-nos a reconhecer nossas limitações e a confiar na graça divina.

Que saibamos dizer sim ao Senhor em todas as circunstâncias.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
    },

    { type: "title", text: "Oração Final" },
    {
      type: "prayer",
      text: `Ó Santa Catarina de Siena, doutora da Igreja e serva fiel de Cristo, rogai por nós.

Ajudai-nos a viver na caridade, na verdade e no amor à Igreja.

Amém.`
    }
  ]
},
{
  novenaId: "novena_santa_catarina_de_siena",
  day: 4,
  title: "Quarto dia – Santa Catarina, amor à Igreja",
  sections: [
    { type: "title", text: "Sinal da Cruz" },
    { type: "prayer", text: "Em nome do Pai, do Filho e do Espírito Santo. Amém." },

    { type: "title", text: "Oração Inicial" },
    {
      type: "prayer",
      text: `Ó Santa Catarina de Siena, virgem consagrada, doutora da Igreja e ardente amante de Cristo, com confiança recorremos à vossa intercessão.

Vós que unistes profunda vida de oração com intenso amor pela Igreja e pelos irmãos, ajudai-nos a viver na verdade, na caridade e na fidelidade ao Evangelho.

Concedei-nos a graça de rezar esta novena com fé sincera, para que, seguindo vosso exemplo de amor a Deus e à Igreja, possamos alcançar as graças que necessitamos, se forem da vontade do Senhor.

Amém.`
    },

    { type: "title", text: "Oração do dia" },
    {
      type: "text",
      text: `Ó Santa Catarina, amastes profundamente a Igreja e trabalhaste por sua unidade.

Intercedei pela Igreja, pelo Papa e por todos os seus pastores.

Ajudai-nos a amar e servir a Igreja com fidelidade.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
    },

    { type: "title", text: "Oração Final" },
    {
      type: "prayer",
      text: `Ó Santa Catarina de Siena, doutora da Igreja e serva fiel de Cristo, rogai por nós.

Ajudai-nos a viver na caridade, na verdade e no amor à Igreja.

Amém.`
    }
  ]
},
{
  novenaId: "novena_santa_catarina_de_siena",
  day: 5,
  title: "Quinto dia – Santa Catarina, coragem na verdade",
  sections: [
    { type: "title", text: "Sinal da Cruz" },
    { type: "prayer", text: "Em nome do Pai, do Filho e do Espírito Santo. Amém." },

    { type: "title", text: "Oração Inicial" },
    {
      type: "prayer",
      text: `Ó Santa Catarina de Siena, virgem consagrada, doutora da Igreja e ardente amante de Cristo, com confiança recorremos à vossa intercessão.

Vós que unistes profunda vida de oração com intenso amor pela Igreja e pelos irmãos, ajudai-nos a viver na verdade, na caridade e na fidelidade ao Evangelho.

Concedei-nos a graça de rezar esta novena com fé sincera, para que, seguindo vosso exemplo de amor a Deus e à Igreja, possamos alcançar as graças que necessitamos, se forem da vontade do Senhor.

Amém.`
    },

    { type: "title", text: "Oração do dia" },
    {
      type: "text",
      text: `Ó Santa Catarina, anunciastes a verdade com coragem e firmeza.

Ajudai-nos a viver e testemunhar a verdade do Evangelho sem medo.

Que nossas palavras e atitudes reflitam a luz de Cristo.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
    },

    { type: "title", text: "Oração Final" },
    {
      type: "prayer",
      text: `Ó Santa Catarina de Siena, doutora da Igreja e serva fiel de Cristo, rogai por nós.

Ajudai-nos a viver na caridade, na verdade e no amor à Igreja.

Amém.`
    }
  ]
},
{
  novenaId: "novena_santa_catarina_de_siena",
  day: 6,
  title: "Sexto dia – Santa Catarina, caridade com o próximo",
  sections: [
    { type: "title", text: "Sinal da Cruz" },
    { type: "prayer", text: "Em nome do Pai, do Filho e do Espírito Santo. Amém." },

    { type: "title", text: "Oração Inicial" },
    {
      type: "prayer",
      text: `Ó Santa Catarina de Siena, virgem consagrada, doutora da Igreja e ardente amante de Cristo, com confiança recorremos à vossa intercessão.

Vós que unistes profunda vida de oração com intenso amor pela Igreja e pelos irmãos, ajudai-nos a viver na verdade, na caridade e na fidelidade ao Evangelho.

Concedei-nos a graça de rezar esta novena com fé sincera, para que, seguindo vosso exemplo de amor a Deus e à Igreja, possamos alcançar as graças que necessitamos, se forem da vontade do Senhor.

Amém.`
    },

    { type: "title", text: "Oração do dia" },
    {
      type: "text",
      text: `Ó Santa Catarina, servistes os pobres, os doentes e os sofredores com grande amor.

Ensinai-nos a praticar a caridade concreta no dia a dia.

Que vejamos Cristo presente em cada irmão.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
    },

    { type: "title", text: "Oração Final" },
    {
      type: "prayer",
      text: `Ó Santa Catarina de Siena, doutora da Igreja e serva fiel de Cristo, rogai por nós.

Ajudai-nos a viver na caridade, na verdade e no amor à Igreja.

Amém.`
    }
  ]
},
{
  novenaId: "novena_santa_catarina_de_siena",
  day: 7,
  title: "Sétimo dia – Santa Catarina, vida de sacrifício",
  sections: [
    { type: "title", text: "Sinal da Cruz" },
    { type: "prayer", text: "Em nome do Pai, do Filho e do Espírito Santo. Amém." },

    { type: "title", text: "Oração Inicial" },
    {
      type: "prayer",
      text: `Ó Santa Catarina de Siena, virgem consagrada, doutora da Igreja e ardente amante de Cristo, com confiança recorremos à vossa intercessão.

Vós que unistes profunda vida de oração com intenso amor pela Igreja e pelos irmãos, ajudai-nos a viver na verdade, na caridade e na fidelidade ao Evangelho.

Concedei-nos a graça de rezar esta novena com fé sincera, para que, seguindo vosso exemplo de amor a Deus e à Igreja, possamos alcançar as graças que necessitamos, se forem da vontade do Senhor.

Amém.`
    },

    { type: "title", text: "Oração do dia" },
    {
      type: "text",
      text: `Ó Santa Catarina, aceitastes sacrifícios por amor a Deus e à Igreja.

Ajudai-nos a oferecer nossas dificuldades como oferta de amor.

Que saibamos unir nossos sofrimentos aos de Cristo.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
    },

    { type: "title", text: "Oração Final" },
    {
      type: "prayer",
      text: `Ó Santa Catarina de Siena, doutora da Igreja e serva fiel de Cristo, rogai por nós.

Ajudai-nos a viver na caridade, na verdade e no amor à Igreja.

Amém.`
    }
  ]
},
{
  novenaId: "novena_santa_catarina_de_siena",
  day: 8,
  title: "Oitavo dia – Santa Catarina, sabedoria espiritual",
  sections: [
    { type: "title", text: "Sinal da Cruz" },
    { type: "prayer", text: "Em nome do Pai, do Filho e do Espírito Santo. Amém." },

    { type: "title", text: "Oração Inicial" },
    {
      type: "prayer",
      text: `Ó Santa Catarina de Siena, virgem consagrada, doutora da Igreja e ardente amante de Cristo, com confiança recorremos à vossa intercessão.

Vós que unistes profunda vida de oração com intenso amor pela Igreja e pelos irmãos, ajudai-nos a viver na verdade, na caridade e na fidelidade ao Evangelho.

Concedei-nos a graça de rezar esta novena com fé sincera, para que, seguindo vosso exemplo de amor a Deus e à Igreja, possamos alcançar as graças que necessitamos, se forem da vontade do Senhor.

Amém.`
    },

    { type: "title", text: "Oração do dia" },
    {
      type: "text",
      text: `Ó Santa Catarina, fostes enriquecida com profunda sabedoria espiritual.

Ajudai-nos a buscar a verdadeira sabedoria que vem de Deus.

Que nossa vida seja iluminada pelo Espírito Santo.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
    },

    { type: "title", text: "Oração Final" },
    {
      type: "prayer",
      text: `Ó Santa Catarina de Siena, doutora da Igreja e serva fiel de Cristo, rogai por nós.

Ajudai-nos a viver na caridade, na verdade e no amor à Igreja.

Amém.`
    }
  ]
},
{
  novenaId: "novena_santa_catarina_de_siena",
  day: 9,
  title: "Nono dia – Santa Catarina, intercessora poderosa",
  sections: [
    { type: "title", text: "Sinal da Cruz" },
    { type: "prayer", text: "Em nome do Pai, do Filho e do Espírito Santo. Amém." },

    { type: "title", text: "Oração Inicial" },
    {
      type: "prayer",
      text: `Ó Santa Catarina de Siena, virgem consagrada, doutora da Igreja e ardente amante de Cristo, com confiança recorremos à vossa intercessão.

Vós que unistes profunda vida de oração com intenso amor pela Igreja e pelos irmãos, ajudai-nos a viver na verdade, na caridade e na fidelidade ao Evangelho.

Concedei-nos a graça de rezar esta novena com fé sincera, para que, seguindo vosso exemplo de amor a Deus e à Igreja, possamos alcançar as graças que necessitamos, se forem da vontade do Senhor.

Amém.`
    },

    { type: "title", text: "Oração do dia" },
    {
      type: "text",
      text: `Ó gloriosa Santa Catarina de Siena, confiamos em vossa poderosa intercessão.

Apresentai a Deus nossas intenções, necessidades e pedidos.

Conduzi-nos sempre no caminho da fé, da verdade e da salvação.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
    },

    { type: "title", text: "Oração Final" },
    {
      type: "prayer",
      text: `Ó Santa Catarina de Siena, doutora da Igreja e serva fiel de Cristo, rogai por nós.

Ajudai-nos a viver na caridade, na verdade e no amor à Igreja.

Amém.`
    }
  ]
},
// ===== Novena a São José de Anchieta =====
{
  novenaId: "novena_sao_jose_de_anchieta",
  day: 1,
  title: "Primeiro dia – São José de Anchieta, chamado missionário",
  sections: [
    { type: "title", text: "Sinal da Cruz" },
    { type: "prayer", text: "Em nome do Pai, do Filho e do Espírito Santo. Amém." },

    { type: "title", text: "Oração Inicial" },
    {
      type: "prayer",
      text: `Ó São José de Anchieta, missionário ardoroso, apóstolo do Brasil e fiel servidor do Evangelho, com confiança recorremos à vossa intercessão.

Vós que dedicastes vossa vida à evangelização, à educação e à defesa dos mais frágeis, ajudai-nos a viver com fé, coragem e amor à Igreja.

Concedei-nos a graça de rezar esta novena com fé sincera, para que, seguindo vosso exemplo de zelo missionário e fidelidade a Cristo, possamos alcançar as graças que necessitamos, se forem da vontade de Deus.

Amém.`
    },

    { type: "title", text: "Oração do dia" },
    {
      type: "text",
      text: `Ó São José de Anchieta, desde jovem atendestes ao chamado de Deus para anunciar o Evangelho.

Ensinai-nos a escutar a voz do Senhor e a responder com generosidade à Sua vontade.

Que nossa vida seja missionária em palavras e atitudes.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
    },

    { type: "title", text: "Oração Final" },
    {
      type: "prayer",
      text: `Ó São José de Anchieta, apóstolo do Brasil e fiel servidor de Cristo, rogai por nós.

Ajudai-nos a viver o Evangelho com zelo missionário, fé e amor.

Amém.`
    }
  ]
},
{
  novenaId: "novena_sao_jose_de_anchieta",
  day: 2,
  title: "Segundo dia – São José de Anchieta, amor à evangelização",
  sections: [
    { type: "title", text: "Sinal da Cruz" },
    { type: "prayer", text: "Em nome do Pai, do Filho e do Espírito Santo. Amém." },

    { type: "title", text: "Oração Inicial" },
    {
      type: "prayer",
      text: `Ó São José de Anchieta, missionário ardoroso, apóstolo do Brasil e fiel servidor do Evangelho, com confiança recorremos à vossa intercessão.

Vós que dedicastes vossa vida à evangelização, à educação e à defesa dos mais frágeis, ajudai-nos a viver com fé, coragem e amor à Igreja.

Concedei-nos a graça de rezar esta novena com fé sincera, para que, seguindo vosso exemplo de zelo missionário e fidelidade a Cristo, possamos alcançar as graças que necessitamos, se forem da vontade de Deus.

Amém.`
    },

    { type: "title", text: "Oração do dia" },
    {
      type: "text",
      text: `Ó São José de Anchieta, anunciastes Cristo com ardor e dedicação entre os povos.

Ajudai-nos a testemunhar o Evangelho com coragem e alegria.

Que sejamos instrumentos de Deus na evangelização.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
    },

    { type: "title", text: "Oração Final" },
    {
      type: "prayer",
      text: `Ó São José de Anchieta, apóstolo do Brasil e fiel servidor de Cristo, rogai por nós.

Ajudai-nos a viver o Evangelho com zelo missionário, fé e amor.

Amém.`
    }
  ]
},
{
  novenaId: "novena_sao_jose_de_anchieta",
  day: 3,
  title: "Terceiro dia – São José de Anchieta, defensor dos mais fracos",
  sections: [
    { type: "title", text: "Sinal da Cruz" },
    { type: "prayer", text: "Em nome do Pai, do Filho e do Espírito Santo. Amém." },

    { type: "title", text: "Oração Inicial" },
    {
      type: "prayer",
      text: `Ó São José de Anchieta, missionário ardoroso, apóstolo do Brasil e fiel servidor do Evangelho, com confiança recorremos à vossa intercessão.

Vós que dedicastes vossa vida à evangelização, à educação e à defesa dos mais frágeis, ajudai-nos a viver com fé, coragem e amor à Igreja.

Concedei-nos a graça de rezar esta novena com fé sincera, para que, seguindo vosso exemplo de zelo missionário e fidelidade a Cristo, possamos alcançar as graças que necessitamos, se forem da vontade de Deus.

Amém.`
    },

    { type: "title", text: "Oração do dia" },
    {
      type: "text",
      text: `Ó São José de Anchieta, defendestes os indígenas e os mais vulneráveis.

Ensinai-nos a lutar pela justiça, pela dignidade humana e pela paz.

Que saibamos reconhecer Cristo nos pobres e oprimidos.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
    },

    { type: "title", text: "Oração Final" },
    {
      type: "prayer",
      text: `Ó São José de Anchieta, apóstolo do Brasil e fiel servidor de Cristo, rogai por nós.

Ajudai-nos a viver o Evangelho com zelo missionário, fé e amor.

Amém.`
    }
  ]
},
{
  novenaId: "novena_sao_jose_de_anchieta",
  day: 4,
  title: "Quarto dia – São José de Anchieta, educador na fé",
  sections: [
    { type: "title", text: "Sinal da Cruz" },
    { type: "prayer", text: "Em nome do Pai, do Filho e do Espírito Santo. Amém." },

    { type: "title", text: "Oração Inicial" },
    {
      type: "prayer",
      text: `Ó São José de Anchieta, missionário ardoroso, apóstolo do Brasil e fiel servidor do Evangelho, com confiança recorremos à vossa intercessão.

Vós que dedicastes vossa vida à evangelização, à educação e à defesa dos mais frágeis, ajudai-nos a viver com fé, coragem e amor à Igreja.

Concedei-nos a graça de rezar esta novena com fé sincera, para que, seguindo vosso exemplo de zelo missionário e fidelidade a Cristo, possamos alcançar as graças que necessitamos, se forem da vontade de Deus.

Amém.`
    },

    { type: "title", text: "Oração do dia" },
    {
      type: "text",
      text: `Ó São José de Anchieta, dedicastes grande parte de vossa vida à educação cristã.

Ajudai-nos a transmitir a fé com amor, paciência e sabedoria.

Que sejamos educadores pelo exemplo de vida.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
    },

    { type: "title", text: "Oração Final" },
    {
      type: "prayer",
      text: `Ó São José de Anchieta, apóstolo do Brasil e fiel servidor de Cristo, rogai por nós.

Ajudai-nos a viver o Evangelho com zelo missionário, fé e amor.

Amém.`
    }
  ]
},
{
  novenaId: "novena_sao_jose_de_anchieta",
  day: 5,
  title: "Quinto dia – São José de Anchieta, vida de oração",
  sections: [
    { type: "title", text: "Sinal da Cruz" },
    { type: "prayer", text: "Em nome do Pai, do Filho e do Espírito Santo. Amém." },

    { type: "title", text: "Oração Inicial" },
    {
      type: "prayer",
      text: `Ó São José de Anchieta, missionário ardoroso, apóstolo do Brasil e fiel servidor do Evangelho, com confiança recorremos à vossa intercessão.

Vós que dedicastes vossa vida à evangelização, à educação e à defesa dos mais frágeis, ajudai-nos a viver com fé, coragem e amor à Igreja.

Concedei-nos a graça de rezar esta novena com fé sincera, para que, seguindo vosso exemplo de zelo missionário e fidelidade a Cristo, possamos alcançar as graças que necessitamos, se forem da vontade de Deus.

Amém.`
    },

    { type: "title", text: "Oração do dia" },
    {
      type: "text",
      text: `Ó São José de Anchieta, encontrastes na oração a força para a missão.

Ensinai-nos a cultivar uma vida de oração constante e confiante.

Que nossa intimidade com Deus sustente nossas ações.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
    },

    { type: "title", text: "Oração Final" },
    {
      type: "prayer",
      text: `Ó São José de Anchieta, apóstolo do Brasil e fiel servidor de Cristo, rogai por nós.

Ajudai-nos a viver o Evangelho com zelo missionário, fé e amor.

Amém.`
    }
  ]
},
{
  novenaId: "novena_sao_jose_de_anchieta",
  day: 6,
  title: "Sexto dia – São José de Anchieta, perseverança nas provações",
  sections: [
    { type: "title", text: "Sinal da Cruz" },
    { type: "prayer", text: "Em nome do Pai, do Filho e do Espírito Santo. Amém." },

    { type: "title", text: "Oração Inicial" },
    {
      type: "prayer",
      text: `Ó São José de Anchieta, missionário ardoroso, apóstolo do Brasil e fiel servidor do Evangelho, com confiança recorremos à vossa intercessão.

Vós que dedicastes vossa vida à evangelização, à educação e à defesa dos mais frágeis, ajudai-nos a viver com fé, coragem e amor à Igreja.

Concedei-nos a graça de rezar esta novena com fé sincera, para que, seguindo vosso exemplo de zelo missionário e fidelidade a Cristo, possamos alcançar as graças que necessitamos, se forem da vontade de Deus.

Amém.`
    },

    { type: "title", text: "Oração do dia" },
    {
      type: "text",
      text: `Ó São José de Anchieta, enfrentastes doenças e dificuldades sem desanimar.

Ajudai-nos a perseverar na fé diante das provações da vida.

Que confiemos sempre na graça de Deus.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
    },

    { type: "title", text: "Oração Final" },
    {
      type: "prayer",
      text: `Ó São José de Anchieta, apóstolo do Brasil e fiel servidor de Cristo, rogai por nós.

Ajudai-nos a viver o Evangelho com zelo missionário, fé e amor.

Amém.`
    }
  ]
},
{
  novenaId: "novena_sao_jose_de_anchieta",
  day: 7,
  title: "Sétimo dia – São José de Anchieta, zelo pela Igreja",
  sections: [
    { type: "title", text: "Sinal da Cruz" },
    { type: "prayer", text: "Em nome do Pai, do Filho e do Espírito Santo. Amém." },

    { type: "title", text: "Oração Inicial" },
    {
      type: "prayer",
      text: `Ó São José de Anchieta, missionário ardoroso, apóstolo do Brasil e fiel servidor do Evangelho, com confiança recorremos à vossa intercessão.

Vós que dedicastes vossa vida à evangelização, à educação e à defesa dos mais frágeis, ajudai-nos a viver com fé, coragem e amor à Igreja.

Concedei-nos a graça de rezar esta novena com fé sincera, para que, seguindo vosso exemplo de zelo missionário e fidelidade a Cristo, possamos alcançar as graças que necessitamos, se forem da vontade de Deus.

Amém.`
    },

    { type: "title", text: "Oração do dia" },
    {
      type: "text",
      text: `Ó São José de Anchieta, trabalhastes com amor pela edificação da Igreja.

Intercedei pelo Papa, pelos bispos, sacerdotes e missionários.

Que a Igreja permaneça fiel ao Evangelho.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
    },

    { type: "title", text: "Oração Final" },
    {
      type: "prayer",
      text: `Ó São José de Anchieta, apóstolo do Brasil e fiel servidor de Cristo, rogai por nós.

Ajudai-nos a viver o Evangelho com zelo missionário, fé e amor.

Amém.`
    }
  ]
},
{
  novenaId: "novena_sao_jose_de_anchieta",
  day: 8,
  title: "Oitavo dia – São José de Anchieta, amor a Maria",
  sections: [
    { type: "title", text: "Sinal da Cruz" },
    { type: "prayer", text: "Em nome do Pai, do Filho e do Espírito Santo. Amém." },

    { type: "title", text: "Oração Inicial" },
    {
      type: "prayer",
      text: `Ó São José de Anchieta, missionário ardoroso, apóstolo do Brasil e fiel servidor do Evangelho, com confiança recorremos à vossa intercessão.

Vós que dedicastes vossa vida à evangelização, à educação e à defesa dos mais frágeis, ajudai-nos a viver com fé, coragem e amor à Igreja.

Concedei-nos a graça de rezar esta novena com fé sincera, para que, seguindo vosso exemplo de zelo missionário e fidelidade a Cristo, possamos alcançar as graças que necessitamos, se forem da vontade de Deus.

Amém.`
    },

    { type: "title", text: "Oração do dia" },
    {
      type: "text",
      text: `Ó São José de Anchieta, fostes profundamente devoto da Virgem Maria.

Ajudai-nos a amar e confiar na intercessão da Mãe de Deus.

Que Maria nos conduza sempre a Jesus.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
    },

    { type: "title", text: "Oração Final" },
    {
      type: "prayer",
      text: `Ó São José de Anchieta, apóstolo do Brasil e fiel servidor de Cristo, rogai por nós.

Ajudai-nos a viver o Evangelho com zelo missionário, fé e amor.

Amém.`
    }
  ]
},
{
  novenaId: "novena_sao_jose_de_anchieta",
  day: 9,
  title: "Nono dia – São José de Anchieta, intercessor do Brasil",
  sections: [
    { type: "title", text: "Sinal da Cruz" },
    { type: "prayer", text: "Em nome do Pai, do Filho e do Espírito Santo. Amém." },

    { type: "title", text: "Oração Inicial" },
    {
      type: "prayer",
      text: `Ó São José de Anchieta, missionário ardoroso, apóstolo do Brasil e fiel servidor do Evangelho, com confiança recorremos à vossa intercessão.

Vós que dedicastes vossa vida à evangelização, à educação e à defesa dos mais frágeis, ajudai-nos a viver com fé, coragem e amor à Igreja.

Concedei-nos a graça de rezar esta novena com fé sincera, para que, seguindo vosso exemplo de zelo missionário e fidelidade a Cristo, possamos alcançar as graças que necessitamos, se forem da vontade de Deus.

Amém.`
    },

    { type: "title", text: "Oração do dia" },
    {
      type: "text",
      text: `Ó glorioso São José de Anchieta, confiamos em vossa poderosa intercessão.

Apresentai a Deus nossas intenções, necessidades e pedidos, especialmente pelo Brasil e seu povo.

Conduzi-nos sempre no caminho da fé, da esperança e da salvação.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
    },

    { type: "title", text: "Oração Final" },
    {
      type: "prayer",
      text: `Ó São José de Anchieta, apóstolo do Brasil e fiel servidor de Cristo, rogai por nós.

Ajudai-nos a viver o Evangelho com zelo missionário, fé e amor.

Amém.`
    }
  ]
},

// ===== Trezena a Santo Antônio =====
{
  novenaId: "trezena_santo_antonio",
  day: 1,
  title: "Primeiro dia – Santo Antônio, chamado por Deus",
  sections: [
    { type: "title", text: "Sinal da Cruz" },
    { type: "prayer", text: "Em nome do Pai, do Filho e do Espírito Santo. Amém." },

    { type: "title", text: "Oração Inicial" },
    {
      type: "prayer",
      text: `Ó glorioso Santo Antônio, fiel servo de Deus, doutor da Igreja e grande intercessor dos que sofrem, com confiança recorremos à vossa poderosa intercessão.

Vós que anunciastes o Evangelho com ardor, humildade e profunda caridade, ajudai-nos a viver segundo a vontade de Deus, buscando sempre o bem, a verdade e o amor ao próximo.

Concedei-nos a graça de rezar esta trezena com fé sincera, para que, por vossa intercessão, possamos alcançar as graças que necessitamos, se forem da vontade de Deus.

Amém.`
    },

    { type: "title", text: "Oração do dia" },
    {
      type: "text",
      text: `Ó Santo Antônio, desde jovem ouvistes o chamado de Deus e entregastes vossa vida ao serviço do Evangelho.

Ensinai-nos a escutar a voz do Senhor e a responder com generosidade.

Que saibamos colocar Deus em primeiro lugar.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
    },

    { type: "title", text: "Oração Final" },
    {
      type: "prayer",
      text: `Ó Santo Antônio, grande pregador do Evangelho e amigo dos pobres, rogai por nós.

Ajudai-nos a viver segundo a vontade de Deus, com fé, esperança e amor.

Amém.`
    }
  ]
},
{
  novenaId: "trezena_santo_antonio",
  day: 2,
  title: "Segundo dia – Santo Antônio, amor à Palavra de Deus",
  sections: [
    { type: "title", text: "Sinal da Cruz" },
    { type: "prayer", text: "Em nome do Pai, do Filho e do Espírito Santo. Amém." },

    { type: "title", text: "Oração Inicial" },
    {
      type: "prayer",
      text: `Ó glorioso Santo Antônio, fiel servo de Deus, doutor da Igreja e grande intercessor dos que sofrem, com confiança recorremos à vossa poderosa intercessão.

Vós que anunciastes o Evangelho com ardor, humildade e profunda caridade, ajudai-nos a viver segundo a vontade de Deus, buscando sempre o bem, a verdade e o amor ao próximo.

Concedei-nos a graça de rezar esta trezena com fé sincera, para que, por vossa intercessão, possamos alcançar as graças que necessitamos, se forem da vontade de Deus.

Amém.`
    },

    { type: "title", text: "Oração do dia" },
    {
      type: "text",
      text: `Ó Santo Antônio, fostes grande pregador da Palavra divina.

Ajudai-nos a amar a Palavra de Deus e a colocá-la em prática em nossa vida.

Que ela ilumine nossas decisões e ações.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
    },

    { type: "title", text: "Oração Final" },
    {
      type: "prayer",
      text: `Ó Santo Antônio, grande pregador do Evangelho e amigo dos pobres, rogai por nós.

Ajudai-nos a viver segundo a vontade de Deus, com fé, esperança e amor.

Amém.`
    }
  ]
},
{
  novenaId: "trezena_santo_antonio",
  day: 3,
  title: "Terceiro dia – Santo Antônio, exemplo de humildade",
  sections: [
    { type: "title", text: "Sinal da Cruz" },
    { type: "prayer", text: "Em nome do Pai, do Filho e do Espírito Santo. Amém." },

    { type: "title", text: "Oração Inicial" },
    {
      type: "prayer",
      text: `Ó glorioso Santo Antônio, fiel servo de Deus, doutor da Igreja e grande intercessor dos que sofrem, com confiança recorremos à vossa poderosa intercessão.

Vós que anunciastes o Evangelho com ardor, humildade e profunda caridade, ajudai-nos a viver segundo a vontade de Deus, buscando sempre o bem, a verdade e o amor ao próximo.

Concedei-nos a graça de rezar esta trezena com fé sincera, para que, por vossa intercessão, possamos alcançar as graças que necessitamos, se forem da vontade de Deus.

Amém.`
    },

    { type: "title", text: "Oração do dia" },
    {
      type: "text",
      text: `Ó Santo Antônio, mesmo dotado de grande sabedoria, permanecestes humilde diante de Deus.

Ensinai-nos a viver com simplicidade e humildade de coração.

Que rejeitemos o orgulho e a vaidade.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
    },

    { type: "title", text: "Oração Final" },
    {
      type: "prayer",
      text: `Ó Santo Antônio, grande pregador do Evangelho e amigo dos pobres, rogai por nós.

Ajudai-nos a viver segundo a vontade de Deus, com fé, esperança e amor.

Amém.`
    }
  ]
},
{
  novenaId: "trezena_santo_antonio",
  day: 4,
  title: "Quarto dia – Santo Antônio, defensor dos pobres",
  sections: [
    { type: "title", text: "Sinal da Cruz" },
    { type: "prayer", text: "Em nome do Pai, do Filho e do Espírito Santo. Amém." },

    { type: "title", text: "Oração Inicial" },
    {
      type: "prayer",
      text: `Ó glorioso Santo Antônio, fiel servo de Deus, doutor da Igreja e grande intercessor dos que sofrem, com confiança recorremos à vossa poderosa intercessão.

Vós que anunciastes o Evangelho com ardor, humildade e profunda caridade, ajudai-nos a viver segundo a vontade de Deus, buscando sempre o bem, a verdade e o amor ao próximo.

Concedei-nos a graça de rezar esta trezena com fé sincera, para que, por vossa intercessão, possamos alcançar as graças que necessitamos, se forem da vontade de Deus.

Amém.`
    },

    { type: "title", text: "Oração do dia" },
    {
      type: "text",
      text: `Ó Santo Antônio, dedicastes vossa vida ao cuidado dos pobres e necessitados.

Ajudai-nos a praticar a caridade concreta com os que sofrem.

Que vejamos Cristo presente nos mais necessitados.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
    },

    { type: "title", text: "Oração Final" },
    {
      type: "prayer",
      text: `Ó Santo Antônio, grande pregador do Evangelho e amigo dos pobres, rogai por nós.

Ajudai-nos a viver segundo a vontade de Deus, com fé, esperança e amor.

Amém.`
    }
  ]
},
{
  novenaId: "trezena_santo_antonio",
  day: 5,
  title: "Quinto dia – Santo Antônio, zelo pela fé",
  sections: [
    { type: "title", text: "Sinal da Cruz" },
    { type: "prayer", text: "Em nome do Pai, do Filho e do Espírito Santo. Amém." },

    { type: "title", text: "Oração Inicial" },
    {
      type: "prayer",
      text: `Ó glorioso Santo Antônio, fiel servo de Deus, doutor da Igreja e grande intercessor dos que sofrem, com confiança recorremos à vossa poderosa intercessão.

Vós que anunciastes o Evangelho com ardor, humildade e profunda caridade, ajudai-nos a viver segundo a vontade de Deus, buscando sempre o bem, a verdade e o amor ao próximo.

Concedei-nos a graça de rezar esta trezena com fé sincera, para que, por vossa intercessão, possamos alcançar as graças que necessitamos, se forem da vontade de Deus.

Amém.`
    },

    { type: "title", text: "Oração do dia" },
    {
      type: "text",
      text: `Ó Santo Antônio, defendestes a fé com coragem e verdade.

Ensinai-nos a viver e testemunhar nossa fé sem medo.

Que sejamos firmes na verdade e cheios de caridade.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
    },

    { type: "title", text: "Oração Final" },
    {
      type: "prayer",
      text: `Ó Santo Antônio, grande pregador do Evangelho e amigo dos pobres, rogai por nós.

Ajudai-nos a viver segundo a vontade de Deus, com fé, esperança e amor.

Amém.`
    }
  ]
},
{
  novenaId: "trezena_santo_antonio",
  day: 6,
  title: "Sexto dia – Santo Antônio, homem de oração",
  sections: [
    { type: "title", text: "Sinal da Cruz" },
    { type: "prayer", text: "Em nome do Pai, do Filho e do Espírito Santo. Amém." },

    { type: "title", text: "Oração Inicial" },
    {
      type: "prayer",
      text: `Ó glorioso Santo Antônio, fiel servo de Deus, doutor da Igreja e grande intercessor dos que sofrem, com confiança recorremos à vossa poderosa intercessão.

Vós que anunciastes o Evangelho com ardor, humildade e profunda caridade, ajudai-nos a viver segundo a vontade de Deus, buscando sempre o bem, a verdade e o amor ao próximo.

Concedei-nos a graça de rezar esta trezena com fé sincera, para que, por vossa intercessão, possamos alcançar as graças que necessitamos, se forem da vontade de Deus.

Amém.`
    },

    { type: "title", text: "Oração do dia" },
    {
      type: "text",
      text: `Ó Santo Antônio, encontrastes na oração a força para vossa missão.

Ajudai-nos a cultivar uma vida de oração constante.

Que nossa intimidade com Deus sustente nossa caminhada.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
    },

    { type: "title", text: "Oração Final" },
    {
      type: "prayer",
      text: `Ó Santo Antônio, grande pregador do Evangelho e amigo dos pobres, rogai por nós.

Ajudai-nos a viver segundo a vontade de Deus, com fé, esperança e amor.

Amém.`
    }
  ]
},
{
  novenaId: "trezena_santo_antonio",
  day: 7,
  title: "Sétimo dia – Santo Antônio, amor à Eucaristia",
  sections: [
    { type: "title", text: "Sinal da Cruz" },
    { type: "prayer", text: "Em nome do Pai, do Filho e do Espírito Santo. Amém." },

    { type: "title", text: "Oração Inicial" },
    {
      type: "prayer",
      text: `Ó glorioso Santo Antônio, fiel servo de Deus, doutor da Igreja e grande intercessor dos que sofrem, com confiança recorremos à vossa poderosa intercessão.

Vós que anunciastes o Evangelho com ardor, humildade e profunda caridade, ajudai-nos a viver segundo a vontade de Deus, buscando sempre o bem, a verdade e o amor ao próximo.

Concedei-nos a graça de rezar esta trezena com fé sincera, para que, por vossa intercessão, possamos alcançar as graças que necessitamos, se forem da vontade de Deus.

Amém.`
    },

    { type: "title", text: "Oração do dia" },
    {
      type: "text",
      text: `Ó Santo Antônio, tivestes profundo amor pelo Santíssimo Sacramento.

Ajudai-nos a reconhecer a presença viva de Cristo na Eucaristia.

Que nossa participação fortaleça nossa fé.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
    },

    { type: "title", text: "Oração Final" },
    {
      type: "prayer",
      text: `Ó Santo Antônio, grande pregador do Evangelho e amigo dos pobres, rogai por nós.

Ajudai-nos a viver segundo a vontade de Deus, com fé, esperança e amor.

Amém.`
    }
  ]
},
{
  novenaId: "trezena_santo_antonio",
  day: 8,
  title: "Oitavo dia – Santo Antônio, paciência nas provações",
  sections: [
    { type: "title", text: "Sinal da Cruz" },
    { type: "prayer", text: "Em nome do Pai, do Filho e do Espírito Santo. Amém." },

    { type: "title", text: "Oração Inicial" },
    {
      type: "prayer",
      text: `Ó glorioso Santo Antônio, fiel servo de Deus, doutor da Igreja e grande intercessor dos que sofrem, com confiança recorremos à vossa poderosa intercessão.

Vós que anunciastes o Evangelho com ardor, humildade e profunda caridade, ajudai-nos a viver segundo a vontade de Deus, buscando sempre o bem, a verdade e o amor ao próximo.

Concedei-nos a graça de rezar esta trezena com fé sincera, para que, por vossa intercessão, possamos alcançar as graças que necessitamos, se forem da vontade de Deus.

Amém.`
    },

    { type: "title", text: "Oração do dia" },
    {
      type: "text",
      text: `Ó Santo Antônio, enfrentastes dificuldades e provações com confiança em Deus.

Ensinai-nos a suportar as dificuldades com paciência e fé.

Que nunca percamos a esperança.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
    },

    { type: "title", text: "Oração Final" },
    {
      type: "prayer",
      text: `Ó Santo Antônio, grande pregador do Evangelho e amigo dos pobres, rogai por nós.

Ajudai-nos a viver segundo a vontade de Deus, com fé, esperança e amor.

Amém.`
    }
  ]
},
{
  novenaId: "trezena_santo_antonio",
  day: 9,
  title: "Nono dia – Santo Antônio, intercessor dos aflitos",
  sections: [
    { type: "title", text: "Sinal da Cruz" },
    { type: "prayer", text: "Em nome do Pai, do Filho e do Espírito Santo. Amém." },

    { type: "title", text: "Oração Inicial" },
    {
      type: "prayer",
      text: `Ó glorioso Santo Antônio, fiel servo de Deus, doutor da Igreja e grande intercessor dos que sofrem, com confiança recorremos à vossa poderosa intercessão.

Vós que anunciastes o Evangelho com ardor, humildade e profunda caridade, ajudai-nos a viver segundo a vontade de Deus, buscando sempre o bem, a verdade e o amor ao próximo.

Concedei-nos a graça de rezar esta trezena com fé sincera, para que, por vossa intercessão, possamos alcançar as graças que necessitamos, se forem da vontade de Deus.

Amém.`
    },

    { type: "title", text: "Oração do dia" },
    {
      type: "text",
      text: `Ó Santo Antônio, tantos recorrem a vós em suas aflições.

Intercedei por todos os que sofrem no corpo e na alma.

Concedei-nos consolo e paz.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
    },

    { type: "title", text: "Oração Final" },
    {
      type: "prayer",
      text: `Ó Santo Antônio, grande pregador do Evangelho e amigo dos pobres, rogai por nós.

Ajudai-nos a viver segundo a vontade de Deus, com fé, esperança e amor.

Amém.`
    }
  ]
},
{
  novenaId: "trezena_santo_antonio",
  day: 10,
  title: "Décimo dia – Santo Antônio, defensor da justiça",
  sections: [
    { type: "title", text: "Sinal da Cruz" },
    { type: "prayer", text: "Em nome do Pai, do Filho e do Espírito Santo. Amém." },

    { type: "title", text: "Oração Inicial" },
    {
      type: "prayer",
      text: `Ó glorioso Santo Antônio, fiel servo de Deus, doutor da Igreja e grande intercessor dos que sofrem, com confiança recorremos à vossa poderosa intercessão.

Vós que anunciastes o Evangelho com ardor, humildade e profunda caridade, ajudai-nos a viver segundo a vontade de Deus, buscando sempre o bem, a verdade e o amor ao próximo.

Concedei-nos a graça de rezar esta trezena com fé sincera, para que, por vossa intercessão, possamos alcançar as graças que necessitamos, se forem da vontade de Deus.

Amém.`
    },

    { type: "title", text: "Oração do dia" },
    {
      type: "text",
      text: `Ó Santo Antônio, denunciastes as injustiças e defendestes os oprimidos.

Ajudai-nos a buscar a justiça e a viver com retidão.

Que nossas atitudes reflitam o amor de Deus.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
    },

    { type: "title", text: "Oração Final" },
    {
      type: "prayer",
      text: `Ó Santo Antônio, grande pregador do Evangelho e amigo dos pobres, rogai por nós.

Ajudai-nos a viver segundo a vontade de Deus, com fé, esperança e amor.

Amém.`
    }
  ]
},
{
  novenaId: "trezena_santo_antonio",
  day: 11,
  title: "Décimo primeiro dia – Santo Antônio, amor ao próximo",
  sections: [
    { type: "title", text: "Sinal da Cruz" },
    { type: "prayer", text: "Em nome do Pai, do Filho e do Espírito Santo. Amém." },

    { type: "title", text: "Oração Inicial" },
    {
      type: "prayer",
      text: `Ó glorioso Santo Antônio, fiel servo de Deus, doutor da Igreja e grande intercessor dos que sofrem, com confiança recorremos à vossa poderosa intercessão.

Vós que anunciastes o Evangelho com ardor, humildade e profunda caridade, ajudai-nos a viver segundo a vontade de Deus, buscando sempre o bem, a verdade e o amor ao próximo.

Concedei-nos a graça de rezar esta trezena com fé sincera, para que, por vossa intercessão, possamos alcançar as graças que necessitamos, se forem da vontade de Deus.

Amém.`
    },

    { type: "title", text: "Oração do dia" },
    {
      type: "text",
      text: `Ó Santo Antônio, vossa vida foi marcada pela caridade fraterna.

Ensinai-nos a amar o próximo com gestos concretos de bondade.

Que sejamos sinais do amor de Deus.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
    },

    { type: "title", text: "Oração Final" },
    {
      type: "prayer",
      text: `Ó Santo Antônio, grande pregador do Evangelho e amigo dos pobres, rogai por nós.

Ajudai-nos a viver segundo a vontade de Deus, com fé, esperança e amor.

Amém.`
    }
  ]
},
{
  novenaId: "trezena_santo_antonio",
  day: 12,
  title: "Décimo segundo dia – Santo Antônio, confiança na providência",
  sections: [
    { type: "title", text: "Sinal da Cruz" },
    { type: "prayer", text: "Em nome do Pai, do Filho e do Espírito Santo. Amém." },

    { type: "title", text: "Oração Inicial" },
    {
      type: "prayer",
      text: `Ó glorioso Santo Antônio, fiel servo de Deus, doutor da Igreja e grande intercessor dos que sofrem, com confiança recorremos à vossa poderosa intercessão.

Vós que anunciastes o Evangelho com ardor, humildade e profunda caridade, ajudai-nos a viver segundo a vontade de Deus, buscando sempre o bem, a verdade e o amor ao próximo.

Concedei-nos a graça de rezar esta trezena com fé sincera, para que, por vossa intercessão, possamos alcançar as graças que necessitamos, se forem da vontade de Deus.

Amém.`
    },

    { type: "title", text: "Oração do dia" },
    {
      type: "text",
      text: `Ó Santo Antônio, confiastes plenamente na providência divina.

Ajudai-nos a confiar em Deus em todas as circunstâncias da vida.

Que entreguemos a Ele nossas preocupações.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
    },

    { type: "title", text: "Oração Final" },
    {
      type: "prayer",
      text: `Ó Santo Antônio, grande pregador do Evangelho e amigo dos pobres, rogai por nós.

Ajudai-nos a viver segundo a vontade de Deus, com fé, esperança e amor.

Amém.`
    }
  ]
},
{
  novenaId: "trezena_santo_antonio",
  day: 13,
  title: "Décimo terceiro dia – Santo Antônio, intercessor poderoso",
  sections: [
    { type: "title", text: "Sinal da Cruz" },
    { type: "prayer", text: "Em nome do Pai, do Filho e do Espírito Santo. Amém." },

    { type: "title", text: "Oração Inicial" },
    {
      type: "prayer",
      text: `Ó glorioso Santo Antônio, fiel servo de Deus, doutor da Igreja e grande intercessor dos que sofrem, com confiança recorremos à vossa poderosa intercessão.

Vós que anunciastes o Evangelho com ardor, humildade e profunda caridade, ajudai-nos a viver segundo a vontade de Deus, buscando sempre o bem, a verdade e o amor ao próximo.

Concedei-nos a graça de rezar esta trezena com fé sincera, para que, por vossa intercessão, possamos alcançar as graças que necessitamos, se forem da vontade de Deus.

Amém.`
    },

    { type: "title", text: "Oração do dia" },
    {
      type: "text",
      text: `Ó glorioso Santo Antônio, confiamos em vossa poderosa intercessão.

Apresentai a Deus nossos pedidos, necessidades e intenções.

Conduzi-nos sempre no caminho da fé, da caridade e da salvação.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
    },

    { type: "title", text: "Oração Final" },
    {
      type: "prayer",
      text: `Ó Santo Antônio, grande pregador do Evangelho e amigo dos pobres, rogai por nós.

Ajudai-nos a viver segundo a vontade de Deus, com fé, esperança e amor.

Amém.`
    }
  ]
},
// ===== Novena a São João Batista =====
{
  novenaId: "novena_sao_joao_batista",
  day: 1,
  title: "Primeiro dia – São João Batista, escolhido por Deus",
  sections: [
    { type: "title", text: "Sinal da Cruz" },
    { type: "prayer", text: "Em nome do Pai, do Filho e do Espírito Santo. Amém." },

    { type: "title", text: "Oração Inicial" },
    {
      type: "prayer",
      text: `Ó São João Batista, precursor do Senhor, voz que clama no deserto e fiel testemunha da verdade, com confiança recorremos à vossa intercessão.

Vós fostes escolhido desde o ventre materno para preparar os caminhos do Salvador e chamar o povo à conversão. Ajudai-nos a endireitar os caminhos do nosso coração e a viver segundo o Evangelho.

Concedei-nos a graça de rezar esta novena com fé sincera, para que, por vossa intercessão, possamos crescer na conversão, na humildade e na fidelidade a Cristo, e alcançar as graças que necessitamos, se forem da vontade de Deus.

Amém.`
    },

    { type: "title", text: "Oração do dia" },
    {
      type: "text",
      text: `Ó São João Batista, fostes escolhido por Deus para uma missão única e santa.

Ensinai-nos a reconhecer o chamado do Senhor em nossa vida.

Que saibamos responder com generosidade e fidelidade.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
    },

    { type: "title", text: "Oração Final" },
    {
      type: "prayer",
      text: `Ó São João Batista, precursor do Senhor e fiel testemunha da verdade, rogai por nós.

Ajudai-nos a preparar os caminhos do Senhor em nossa vida e a viver segundo o Evangelho.

Amém.`
    }
  ]
},
{
  novenaId: "novena_sao_joao_batista",
  day: 2,
  title: "Segundo dia – São João Batista, voz que clama no deserto",
  sections: [
    { type: "title", text: "Sinal da Cruz" },
    { type: "prayer", text: "Em nome do Pai, do Filho e do Espírito Santo. Amém." },

    { type: "title", text: "Oração Inicial" },
    {
      type: "prayer",
      text: `Ó São João Batista, precursor do Senhor, voz que clama no deserto e fiel testemunha da verdade, com confiança recorremos à vossa intercessão.

Vós fostes escolhido desde o ventre materno para preparar os caminhos do Salvador e chamar o povo à conversão. Ajudai-nos a endireitar os caminhos do nosso coração e a viver segundo o Evangelho.

Concedei-nos a graça de rezar esta novena com fé sincera, para que, por vossa intercessão, possamos crescer na conversão, na humildade e na fidelidade a Cristo, e alcançar as graças que necessitamos, se forem da vontade de Deus.

Amém.`
    },

    { type: "title", text: "Oração do dia" },
    {
      type: "text",
      text: `Ó São João Batista, anunciastes com coragem a chegada do Messias.

Ajudai-nos a anunciar o Evangelho com palavras e atitudes.

Que sejamos testemunhas da verdade em nosso tempo.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
    },

    { type: "title", text: "Oração Final" },
    {
      type: "prayer",
      text: `Ó São João Batista, precursor do Senhor e fiel testemunha da verdade, rogai por nós.

Ajudai-nos a preparar os caminhos do Senhor em nossa vida e a viver segundo o Evangelho.

Amém.`
    }
  ]
},
{
  novenaId: "novena_sao_joao_batista",
  day: 3,
  title: "Terceiro dia – São João Batista, chamado à conversão",
  sections: [
    { type: "title", text: "Sinal da Cruz" },
    { type: "prayer", text: "Em nome do Pai, do Filho e do Espírito Santo. Amém." },

    { type: "title", text: "Oração Inicial" },
    {
      type: "prayer",
      text: `Ó São João Batista, precursor do Senhor, voz que clama no deserto e fiel testemunha da verdade, com confiança recorremos à vossa intercessão.

Vós fostes escolhido desde o ventre materno para preparar os caminhos do Salvador e chamar o povo à conversão. Ajudai-nos a endireitar os caminhos do nosso coração e a viver segundo o Evangelho.

Concedei-nos a graça de rezar esta novena com fé sincera, para que, por vossa intercessão, possamos crescer na conversão, na humildade e na fidelidade a Cristo, e alcançar as graças que necessitamos, se forem da vontade de Deus.

Amém.`
    },

    { type: "title", text: "Oração do dia" },
    {
      type: "text",
      text: `Ó São João Batista, chamastes o povo à conversão sincera.

Ensinai-nos a reconhecer nossos pecados e a buscar a misericórdia de Deus.

Que nossa vida seja marcada pela mudança de coração.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
    },

    { type: "title", text: "Oração Final" },
    {
      type: "prayer",
      text: `Ó São João Batista, precursor do Senhor e fiel testemunha da verdade, rogai por nós.

Ajudai-nos a preparar os caminhos do Senhor em nossa vida e a viver segundo o Evangelho.

Amém.`
    }
  ]
},
{
  novenaId: "novena_sao_joao_batista",
  day: 4,
  title: "Quarto dia – São João Batista, exemplo de humildade",
  sections: [
    { type: "title", text: "Sinal da Cruz" },
    { type: "prayer", text: "Em nome do Pai, do Filho e do Espírito Santo. Amém." },

    { type: "title", text: "Oração Inicial" },
    {
      type: "prayer",
      text: `Ó São João Batista, precursor do Senhor, voz que clama no deserto e fiel testemunha da verdade, com confiança recorremos à vossa intercessão.

Vós fostes escolhido desde o ventre materno para preparar os caminhos do Salvador e chamar o povo à conversão. Ajudai-nos a endireitar os caminhos do nosso coração e a viver segundo o Evangelho.

Concedei-nos a graça de rezar esta novena com fé sincera, para que, por vossa intercessão, possamos crescer na conversão, na humildade e na fidelidade a Cristo, e alcançar as graças que necessitamos, se forem da vontade de Deus.

Amém.`
    },

    { type: "title", text: "Oração do dia" },
    {
      type: "text",
      text: `Ó São João Batista, reconhecestes que Cristo devia crescer e vós diminuir.

Ensinai-nos a viver a verdadeira humildade.

Que coloquemos Deus no centro de nossa vida.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
    },

    { type: "title", text: "Oração Final" },
    {
      type: "prayer",
      text: `Ó São João Batista, precursor do Senhor e fiel testemunha da verdade, rogai por nós.

Ajudai-nos a preparar os caminhos do Senhor em nossa vida e a viver segundo o Evangelho.

Amém.`
    }
  ]
},
{
  novenaId: "novena_sao_joao_batista",
  day: 5,
  title: "Quinto dia – São João Batista, testemunha da verdade",
  sections: [
    { type: "title", text: "Sinal da Cruz" },
    { type: "prayer", text: "Em nome do Pai, do Filho e do Espírito Santo. Amém." },

    { type: "title", text: "Oração Inicial" },
    {
      type: "prayer",
      text: `Ó São João Batista, precursor do Senhor, voz que clama no deserto e fiel testemunha da verdade, com confiança recorremos à vossa intercessão.

Vós fostes escolhido desde o ventre materno para preparar os caminhos do Salvador e chamar o povo à conversão. Ajudai-nos a endireitar os caminhos do nosso coração e a viver segundo o Evangelho.

Concedei-nos a graça de rezar esta novena com fé sincera, para que, por vossa intercessão, possamos crescer na conversão, na humildade e na fidelidade a Cristo, e alcançar as graças que necessitamos, se forem da vontade de Deus.

Amém.`
    },

    { type: "title", text: "Oração do dia" },
    {
      type: "text",
      text: `Ó São João Batista, defendestes a verdade mesmo diante da perseguição.

Ajudai-nos a permanecer fiéis à verdade do Evangelho.

Que nunca nos calemos diante da injustiça e do pecado.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
    },

    { type: "title", text: "Oração Final" },
    {
      type: "prayer",
      text: `Ó São João Batista, precursor do Senhor e fiel testemunha da verdade, rogai por nós.

Ajudai-nos a preparar os caminhos do Senhor em nossa vida e a viver segundo o Evangelho.

Amém.`
    }
  ]
},
{
  novenaId: "novena_sao_joao_batista",
  day: 6,
  title: "Sexto dia – São João Batista, vida de penitência",
  sections: [
    { type: "title", text: "Sinal da Cruz" },
    { type: "prayer", text: "Em nome do Pai, do Filho e do Espírito Santo. Amém." },

    { type: "title", text: "Oração Inicial" },
    {
      type: "prayer",
      text: `Ó São João Batista, precursor do Senhor, voz que clama no deserto e fiel testemunha da verdade, com confiança recorremos à vossa intercessão.

Vós fostes escolhido desde o ventre materno para preparar os caminhos do Salvador e chamar o povo à conversão. Ajudai-nos a endireitar os caminhos do nosso coração e a viver segundo o Evangelho.

Concedei-nos a graça de rezar esta novena com fé sincera, para que, por vossa intercessão, possamos crescer na conversão, na humildade e na fidelidade a Cristo, e alcançar as graças que necessitamos, se forem da vontade de Deus.

Amém.`
    },

    { type: "title", text: "Oração do dia" },
    {
      type: "text",
      text: `Ó São João Batista, vivestes com simplicidade e espírito de penitência.

Ensinai-nos a viver com sobriedade e desapego.

Que saibamos oferecer pequenos sacrifícios por amor a Deus.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
    },

    { type: "title", text: "Oração Final" },
    {
      type: "prayer",
      text: `Ó São João Batista, precursor do Senhor e fiel testemunha da verdade, rogai por nós.

Ajudai-nos a preparar os caminhos do Senhor em nossa vida e a viver segundo o Evangelho.

Amém.`
    }
  ]
},
{
  novenaId: "novena_sao_joao_batista",
  day: 7,
  title: "Sétimo dia – São João Batista, alegria em servir a Cristo",
  sections: [
    { type: "title", text: "Sinal da Cruz" },
    { type: "prayer", text: "Em nome do Pai, do Filho e do Espírito Santo. Amém." },

    { type: "title", text: "Oração Inicial" },
    {
      type: "prayer",
      text: `Ó São João Batista, precursor do Senhor, voz que clama no deserto e fiel testemunha da verdade, com confiança recorremos à vossa intercessão.

Vós fostes escolhido desde o ventre materno para preparar os caminhos do Salvador e chamar o povo à conversão. Ajudai-nos a endireitar os caminhos do nosso coração e a viver segundo o Evangelho.

Concedei-nos a graça de rezar esta novena com fé sincera, para que, por vossa intercessão, possamos crescer na conversão, na humildade e na fidelidade a Cristo, e alcançar as graças que necessitamos, se forem da vontade de Deus.

Amém.`
    },

    { type: "title", text: "Oração do dia" },
    {
      type: "text",
      text: `Ó São João Batista, alegrastes-vos ao reconhecer a presença do Senhor.

Ajudai-nos a encontrar alegria no serviço a Deus.

Que nossa vida reflita a alegria do Evangelho.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
    },

    { type: "title", text: "Oração Final" },
    {
      type: "prayer",
      text: `Ó São João Batista, precursor do Senhor e fiel testemunha da verdade, rogai por nós.

Ajudai-nos a preparar os caminhos do Senhor em nossa vida e a viver segundo o Evangelho.

Amém.`
    }
  ]
},
{
  novenaId: "novena_sao_joao_batista",
  day: 8,
  title: "Oitavo dia – São João Batista, fidelidade até o martírio",
  sections: [
    { type: "title", text: "Sinal da Cruz" },
    { type: "prayer", text: "Em nome do Pai, do Filho e do Espírito Santo. Amém." },

    { type: "title", text: "Oração Inicial" },
    {
      type: "prayer",
      text: `Ó São João Batista, precursor do Senhor, voz que clama no deserto e fiel testemunha da verdade, com confiança recorremos à vossa intercessão.

Vós fostes escolhido desde o ventre materno para preparar os caminhos do Salvador e chamar o povo à conversão. Ajudai-nos a endireitar os caminhos do nosso coração e a viver segundo o Evangelho.

Concedei-nos a graça de rezar esta novena com fé sincera, para que, por vossa intercessão, possamos crescer na conversão, na humildade e na fidelidade a Cristo, e alcançar as graças que necessitamos, se forem da vontade de Deus.

Amém.`
    },

    { type: "title", text: "Oração do dia" },
    {
      type: "text",
      text: `Ó São João Batista, destes a vida em testemunho da fé.

Fortalecei-nos para permanecermos fiéis a Cristo em todas as circunstâncias.

Que não temamos seguir o Senhor com coragem.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
    },

    { type: "title", text: "Oração Final" },
    {
      type: "prayer",
      text: `Ó São João Batista, precursor do Senhor e fiel testemunha da verdade, rogai por nós.

Ajudai-nos a preparar os caminhos do Senhor em nossa vida e a viver segundo o Evangelho.

Amém.`
    }
  ]
},
{
  novenaId: "novena_sao_joao_batista",
  day: 9,
  title: "Nono dia – São João Batista, intercessor junto a Deus",
  sections: [
    { type: "title", text: "Sinal da Cruz" },
    { type: "prayer", text: "Em nome do Pai, do Filho e do Espírito Santo. Amém." },

    { type: "title", text: "Oração Inicial" },
    {
      type: "prayer",
      text: `Ó São João Batista, precursor do Senhor, voz que clama no deserto e fiel testemunha da verdade, com confiança recorremos à vossa intercessão.

Vós fostes escolhido desde o ventre materno para preparar os caminhos do Salvador e chamar o povo à conversão. Ajudai-nos a endireitar os caminhos do nosso coração e a viver segundo o Evangelho.

Concedei-nos a graça de rezar esta novena com fé sincera, para que, por vossa intercessão, possamos crescer na conversão, na humildade e na fidelidade a Cristo, e alcançar as graças que necessitamos, se forem da vontade de Deus.

Amém.`
    },

    { type: "title", text: "Oração do dia" },
    {
      type: "text",
      text: `Ó glorioso São João Batista, confiamos em vossa poderosa intercessão.

Apresentai a Deus nossos pedidos, necessidades e intenções.

Conduzi-nos sempre no caminho da conversão, da verdade e da salvação.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
    },

    { type: "title", text: "Oração Final" },
    {
      type: "prayer",
      text: `Ó São João Batista, precursor do Senhor e fiel testemunha da verdade, rogai por nós.

Ajudai-nos a preparar os caminhos do Senhor em nossa vida e a viver segundo o Evangelho.

Amém.`
    }
  ]
},

// ===== Novena a São Pedro e São Paulo =====
{
  novenaId: "novena_sao_pedro_e_sao_paulo",
  day: 1,
  title: "Primeiro dia – São Pedro, chamado por Cristo",
  sections: [
    { type: "title", text: "Sinal da Cruz" },
    { type: "prayer", text: "Em nome do Pai, do Filho e do Espírito Santo. Amém." },

    { type: "title", text: "Oração Inicial" },
    {
      type: "prayer",
      text: `Ó gloriosos São Pedro e São Paulo, colunas da Igreja, apóstolos escolhidos por Cristo para anunciar o Evangelho e conduzir o povo de Deus, com confiança recorremos à vossa poderosa intercessão.

São Pedro, firme na fé e pastor do rebanho do Senhor. São Paulo, incansável missionário e anunciador da Boa-Nova aos povos. Ajudai-nos a viver unidos à Igreja, perseverantes na fé e zelosos no testemunho cristão.

Concedei-nos a graça de rezar esta novena com fé sincera, para que, seguindo vosso exemplo de amor a Cristo e dedicação à missão, possamos alcançar as graças que necessitamos, se forem da vontade de Deus.

Amém.`
    },

    { type: "title", text: "Oração do dia" },
    {
      type: "text",
      text: `Ó São Pedro, fostes chamado por Jesus para segui-Lo e tornar-vos pescador de homens.

Ensinai-nos a escutar o chamado do Senhor e a segui-Lo com confiança.

Que nossa vida seja resposta fiel ao amor de Cristo.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
    },

    { type: "title", text: "Oração Final" },
    {
      type: "prayer",
      text: `Ó gloriosos São Pedro e São Paulo, apóstolos e pilares da Igreja, rogai por nós.

Ajudai-nos a viver firmes na fé, unidos à Igreja e comprometidos com o Evangelho de Jesus Cristo.

Amém.`
    }
  ]
},
{
  novenaId: "novena_sao_pedro_e_sao_paulo",
  day: 2,
  title: "Segundo dia – São Pedro, fé confessada em Cristo",
  sections: [
    { type: "title", text: "Sinal da Cruz" },
    { type: "prayer", text: "Em nome do Pai, do Filho e do Espírito Santo. Amém." },

    { type: "title", text: "Oração Inicial" },
    {
      type: "prayer",
      text: `Ó gloriosos São Pedro e São Paulo, colunas da Igreja, apóstolos escolhidos por Cristo para anunciar o Evangelho e conduzir o povo de Deus, com confiança recorremos à vossa poderosa intercessão.

São Pedro, firme na fé e pastor do rebanho do Senhor. São Paulo, incansável missionário e anunciador da Boa-Nova aos povos. Ajudai-nos a viver unidos à Igreja, perseverantes na fé e zelosos no testemunho cristão.

Concedei-nos a graça de rezar esta novena com fé sincera, para que, seguindo vosso exemplo de amor a Cristo e dedicação à missão, possamos alcançar as graças que necessitamos, se forem da vontade de Deus.

Amém.`
    },

    { type: "title", text: "Oração do dia" },
    {
      type: "text",
      text: `Ó São Pedro, proclamastes com fé que Jesus é o Cristo, o Filho do Deus vivo.

Ajudai-nos a professar nossa fé com coragem e fidelidade.

Que nunca neguemos o Senhor por medo ou fraqueza.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
    },

    { type: "title", text: "Oração Final" },
    {
      type: "prayer",
      text: `Ó gloriosos São Pedro e São Paulo, apóstolos e pilares da Igreja, rogai por nós.

Ajudai-nos a viver firmes na fé, unidos à Igreja e comprometidos com o Evangelho de Jesus Cristo.

Amém.`
    }
  ]
},
{
  novenaId: "novena_sao_pedro_e_sao_paulo",
  day: 3,
  title: "Terceiro dia – São Pedro, pastor da Igreja",
  sections: [
    { type: "title", text: "Sinal da Cruz" },
    { type: "prayer", text: "Em nome do Pai, do Filho e do Espírito Santo. Amém." },

    { type: "title", text: "Oração Inicial" },
    {
      type: "prayer",
      text: `Ó gloriosos São Pedro e São Paulo, colunas da Igreja, apóstolos escolhidos por Cristo para anunciar o Evangelho e conduzir o povo de Deus, com confiança recorremos à vossa poderosa intercessão.

São Pedro, firme na fé e pastor do rebanho do Senhor. São Paulo, incansável missionário e anunciador da Boa-Nova aos povos. Ajudai-nos a viver unidos à Igreja, perseverantes na fé e zelosos no testemunho cristão.

Concedei-nos a graça de rezar esta novena com fé sincera, para que, seguindo vosso exemplo de amor a Cristo e dedicação à missão, possamos alcançar as graças que necessitamos, se forem da vontade de Deus.

Amém.`
    },

    { type: "title", text: "Oração do dia" },
    {
      type: "text",
      text: `Ó São Pedro, fostes escolhido para apascentar o rebanho do Senhor.

Intercedei pelo Papa e por todos os pastores da Igreja.

Ajudai-nos a viver em comunhão e obediência à Igreja.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
    },

    { type: "title", text: "Oração Final" },
    {
      type: "prayer",
      text: `Ó gloriosos São Pedro e São Paulo, apóstolos e pilares da Igreja, rogai por nós.

Ajudai-nos a viver firmes na fé, unidos à Igreja e comprometidos com o Evangelho de Jesus Cristo.

Amém.`
    }
  ]
},
{
  novenaId: "novena_sao_pedro_e_sao_paulo",
  day: 4,
  title: "Quarto dia – São Paulo, convertido pelo amor de Cristo",
  sections: [
    { type: "title", text: "Sinal da Cruz" },
    { type: "prayer", text: "Em nome do Pai, do Filho e do Espírito Santo. Amém." },

    { type: "title", text: "Oração Inicial" },
    {
      type: "prayer",
      text: `Ó gloriosos São Pedro e São Paulo, colunas da Igreja, apóstolos escolhidos por Cristo para anunciar o Evangelho e conduzir o povo de Deus, com confiança recorremos à vossa poderosa intercessão.

São Pedro, firme na fé e pastor do rebanho do Senhor. São Paulo, incansável missionário e anunciador da Boa-Nova aos povos. Ajudai-nos a viver unidos à Igreja, perseverantes na fé e zelosos no testemunho cristão.

Concedei-nos a graça de rezar esta novena com fé sincera, para que, seguindo vosso exemplo de amor a Cristo e dedicação à missão, possamos alcançar as graças que necessitamos, se forem da vontade de Deus.

Amém.`
    },

    { type: "title", text: "Oração do dia" },
    {
      type: "text",
      text: `Ó São Paulo, vossa vida foi transformada pelo encontro com Cristo ressuscitado.

Ajudai-nos a permitir que o Senhor transforme nosso coração.

Que vivamos em constante conversão.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
    },

    { type: "title", text: "Oração Final" },
    {
      type: "prayer",
      text: `Ó gloriosos São Pedro e São Paulo, apóstolos e pilares da Igreja, rogai por nós.

Ajudai-nos a viver firmes na fé, unidos à Igreja e comprometidos com o Evangelho de Jesus Cristo.

Amém.`
    }
  ]
},
{
  novenaId: "novena_sao_pedro_e_sao_paulo",
  day: 5,
  title: "Quinto dia – São Paulo, apóstolo das nações",
  sections: [
    { type: "title", text: "Sinal da Cruz" },
    { type: "prayer", text: "Em nome do Pai, do Filho e do Espírito Santo. Amém." },

    { type: "title", text: "Oração Inicial" },
    {
      type: "prayer",
      text: `Ó gloriosos São Pedro e São Paulo, colunas da Igreja, apóstolos escolhidos por Cristo para anunciar o Evangelho e conduzir o povo de Deus, com confiança recorremos à vossa poderosa intercessão.

São Pedro, firme na fé e pastor do rebanho do Senhor. São Paulo, incansável missionário e anunciador da Boa-Nova aos povos. Ajudai-nos a viver unidos à Igreja, perseverantes na fé e zelosos no testemunho cristão.

Concedei-nos a graça de rezar esta novena com fé sincera, para que, seguindo vosso exemplo de amor a Cristo e dedicação à missão, possamos alcançar as graças que necessitamos, se forem da vontade de Deus.

Amém.`
    },

    { type: "title", text: "Oração do dia" },
    {
      type: "text",
      text: `Ó São Paulo, anunciastes o Evangelho com ardor e coragem aos povos.

Ensinai-nos a ser missionários em nosso ambiente de vida.

Que testemunhemos Cristo com palavras e atitudes.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
    },

    { type: "title", text: "Oração Final" },
    {
      type: "prayer",
      text: `Ó gloriosos São Pedro e São Paulo, apóstolos e pilares da Igreja, rogai por nós.

Ajudai-nos a viver firmes na fé, unidos à Igreja e comprometidos com o Evangelho de Jesus Cristo.

Amém.`
    }
  ]
},
{
  novenaId: "novena_sao_pedro_e_sao_paulo",
  day: 6,
  title: "Sexto dia – São Pedro e São Paulo, testemunhas da fé",
  sections: [
    { type: "title", text: "Sinal da Cruz" },
    { type: "prayer", text: "Em nome do Pai, do Filho e do Espírito Santo. Amém." },

    { type: "title", text: "Oração Inicial" },
    {
      type: "prayer",
      text: `Ó gloriosos São Pedro e São Paulo, colunas da Igreja, apóstolos escolhidos por Cristo para anunciar o Evangelho e conduzir o povo de Deus, com confiança recorremos à vossa poderosa intercessão.

São Pedro, firme na fé e pastor do rebanho do Senhor. São Paulo, incansável missionário e anunciador da Boa-Nova aos povos. Ajudai-nos a viver unidos à Igreja, perseverantes na fé e zelosos no testemunho cristão.

Concedei-nos a graça de rezar esta novena com fé sincera, para que, seguindo vosso exemplo de amor a Cristo e dedicação à missão, possamos alcançar as graças que necessitamos, se forem da vontade de Deus.

Amém.`
    },

    { type: "title", text: "Oração do dia" },
    {
      type: "text",
      text: `Ó São Pedro e São Paulo, enfrentastes perseguições e sofrimentos por amor a Cristo.

Fortalecei-nos nas provações da vida cristã.

Que permaneçamos firmes na fé, mesmo diante das dificuldades.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
    },

    { type: "title", text: "Oração Final" },
    {
      type: "prayer",
      text: `Ó gloriosos São Pedro e São Paulo, apóstolos e pilares da Igreja, rogai por nós.

Ajudai-nos a viver firmes na fé, unidos à Igreja e comprometidos com o Evangelho de Jesus Cristo.

Amém.`
    }
  ]
},
{
  novenaId: "novena_sao_pedro_e_sao_paulo",
  day: 7,
  title: "Sétimo dia – São Pedro e São Paulo, unidade na diversidade",
  sections: [
    { type: "title", text: "Sinal da Cruz" },
    { type: "prayer", text: "Em nome do Pai, do Filho e do Espírito Santo. Amém." },

    { type: "title", text: "Oração Inicial" },
    {
      type: "prayer",
      text: `Ó gloriosos São Pedro e São Paulo, colunas da Igreja, apóstolos escolhidos por Cristo para anunciar o Evangelho e conduzir o povo de Deus, com confiança recorremos à vossa poderosa intercessão.

São Pedro, firme na fé e pastor do rebanho do Senhor. São Paulo, incansável missionário e anunciador da Boa-Nova aos povos. Ajudai-nos a viver unidos à Igreja, perseverantes na fé e zelosos no testemunho cristão.

Concedei-nos a graça de rezar esta novena com fé sincera, para que, seguindo vosso exemplo de amor a Cristo e dedicação à missão, possamos alcançar as graças que necessitamos, se forem da vontade de Deus.

Amém.`
    },

    { type: "title", text: "Oração do dia" },
    {
      type: "text",
      text: `Ó gloriosos apóstolos, mesmo com caminhos diferentes, servistes ao mesmo Senhor.

Ajudai-nos a viver a unidade na diversidade dentro da Igreja.

Que sejamos instrumentos de comunhão e paz.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
    },

    { type: "title", text: "Oração Final" },
    {
      type: "prayer",
      text: `Ó gloriosos São Pedro e São Paulo, apóstolos e pilares da Igreja, rogai por nós.

Ajudai-nos a viver firmes na fé, unidos à Igreja e comprometidos com o Evangelho de Jesus Cristo.

Amém.`
    }
  ]
},
{
  novenaId: "novena_sao_pedro_e_sao_paulo",
  day: 8,
  title: "Oitavo dia – São Pedro e São Paulo, mártires de Cristo",
  sections: [
    { type: "title", text: "Sinal da Cruz" },
    { type: "prayer", text: "Em nome do Pai, do Filho e do Espírito Santo. Amém." },

    { type: "title", text: "Oração Inicial" },
    {
      type: "prayer",
      text: `Ó gloriosos São Pedro e São Paulo, colunas da Igreja, apóstolos escolhidos por Cristo para anunciar o Evangelho e conduzir o povo de Deus, com confiança recorremos à vossa poderosa intercessão.

São Pedro, firme na fé e pastor do rebanho do Senhor. São Paulo, incansável missionário e anunciador da Boa-Nova aos povos. Ajudai-nos a viver unidos à Igreja, perseverantes na fé e zelosos no testemunho cristão.

Concedei-nos a graça de rezar esta novena com fé sincera, para que, seguindo vosso exemplo de amor a Cristo e dedicação à missão, possamos alcançar as graças que necessitamos, se forem da vontade de Deus.

Amém.`
    },

    { type: "title", text: "Oração do dia" },
    {
      type: "text",
      text: `Ó São Pedro e São Paulo, destes a vida como testemunho supremo de fidelidade ao Senhor.

Ensinai-nos a viver com entrega total ao Evangelho.

Que nossa vida seja oferta agradável a Deus.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
    },

    { type: "title", text: "Oração Final" },
    {
      type: "prayer",
      text: `Ó gloriosos São Pedro e São Paulo, apóstolos e pilares da Igreja, rogai por nós.

Ajudai-nos a viver firmes na fé, unidos à Igreja e comprometidos com o Evangelho de Jesus Cristo.

Amém.`
    }
  ]
},
{
  novenaId: "novena_sao_pedro_e_sao_paulo",
  day: 9,
  title: "Nono dia – São Pedro e São Paulo, intercessores da Igreja",
  sections: [
    { type: "title", text: "Sinal da Cruz" },
    { type: "prayer", text: "Em nome do Pai, do Filho e do Espírito Santo. Amém." },

    { type: "title", text: "Oração Inicial" },
    {
      type: "prayer",
      text: `Ó gloriosos São Pedro e São Paulo, colunas da Igreja, apóstolos escolhidos por Cristo para anunciar o Evangelho e conduzir o povo de Deus, com confiança recorremos à vossa poderosa intercessão.

São Pedro, firme na fé e pastor do rebanho do Senhor. São Paulo, incansável missionário e anunciador da Boa-Nova aos povos. Ajudai-nos a viver unidos à Igreja, perseverantes na fé e zelosos no testemunho cristão.

Concedei-nos a graça de rezar esta novena com fé sincera, para que, seguindo vosso exemplo de amor a Cristo e dedicação à missão, possamos alcançar as graças que necessitamos, se forem da vontade de Deus.

Amém.`
    },

    { type: "title", text: "Oração do dia" },
    {
      type: "text",
      text: `Ó gloriosos São Pedro e São Paulo, confiamos em vossa poderosa intercessão.

Apresentai a Deus nossas intenções, necessidades e pedidos.

Conduzi-nos sempre no caminho da fé, da unidade e da salvação.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
    },

    { type: "title", text: "Oração Final" },
    {
      type: "prayer",
      text: `Ó gloriosos São Pedro e São Paulo, apóstolos e pilares da Igreja, rogai por nós.

Ajudai-nos a viver firmes na fé, unidos à Igreja e comprometidos com o Evangelho de Jesus Cristo.

Amém.`
    }
  ]
},
// ===== Novena a São Bento =====
{
  novenaId: "novena_sao_bento",
  day: 1,
  title: "Primeiro dia – São Bento, busca de Deus",
  sections: [
    { type: "title", text: "Sinal da Cruz" },
    { type: "prayer", text: "Em nome do Pai, do Filho e do Espírito Santo. Amém." },

    { type: "title", text: "Oração Inicial" },
    {
      type: "prayer",
      text: `Ó glorioso São Bento, patriarca dos monges do Ocidente, mestre da vida espiritual e fiel servidor de Deus, com confiança recorremos à vossa poderosa intercessão.

Vós que ensinastes a buscar a Deus na oração, no trabalho e na vida equilibrada, ajudai-nos a viver com fé, disciplina e confiança na proteção divina.

Concedei-nos a graça de rezar esta novena com fé sincera, para que, por vossa intercessão, sejamos protegidos contra todo mal e possamos alcançar as graças que necessitamos, se forem da vontade de Deus.

Amém.`
    },

    { type: "title", text: "Oração do dia" },
    {
      type: "text",
      text: `Ó São Bento, desde jovem buscastes a Deus acima de todas as coisas.

Ensinai-nos a colocar Deus no centro de nossa vida.

Que nosso coração esteja sempre voltado para o Senhor.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
    },

    { type: "title", text: "Oração Final" },
    {
      type: "prayer",
      text: `Ó São Bento, mestre da vida espiritual e poderoso intercessor, rogai por nós.

Ajudai-nos a viver na fé, na obediência e na confiança em Deus.

Amém.`
    }
  ]
},
{
  novenaId: "novena_sao_bento",
  day: 2,
  title: "Segundo dia – São Bento, vida de oração",
  sections: [
    { type: "title", text: "Sinal da Cruz" },
    { type: "prayer", text: "Em nome do Pai, do Filho e do Espírito Santo. Amém." },

    { type: "title", text: "Oração Inicial" },
    {
      type: "prayer",
      text: `Ó glorioso São Bento, patriarca dos monges do Ocidente, mestre da vida espiritual e fiel servidor de Deus, com confiança recorremos à vossa poderosa intercessão.

Vós que ensinastes a buscar a Deus na oração, no trabalho e na vida equilibrada, ajudai-nos a viver com fé, disciplina e confiança na proteção divina.

Concedei-nos a graça de rezar esta novena com fé sincera, para que, por vossa intercessão, sejamos protegidos contra todo mal e possamos alcançar as graças que necessitamos, se forem da vontade de Deus.

Amém.`
    },

    { type: "title", text: "Oração do dia" },
    {
      type: "text",
      text: `Ó São Bento, fizestes da oração o alicerce de vossa vida.

Ajudai-nos a cultivar uma vida de oração fiel e perseverante.

Que encontremos na oração força e paz.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
    },

    { type: "title", text: "Oração Final" },
    {
      type: "prayer",
      text: `Ó São Bento, mestre da vida espiritual e poderoso intercessor, rogai por nós.

Ajudai-nos a viver na fé, na obediência e na confiança em Deus.

Amém.`
    }
  ]
},
{
  novenaId: "novena_sao_bento",
  day: 3,
  title: "Terceiro dia – São Bento, trabalho e disciplina",
  sections: [
    { type: "title", text: "Sinal da Cruz" },
    { type: "prayer", text: "Em nome do Pai, do Filho e do Espírito Santo. Amém." },

    { type: "title", text: "Oração Inicial" },
    {
      type: "prayer",
      text: `Ó glorioso São Bento, patriarca dos monges do Ocidente, mestre da vida espiritual e fiel servidor de Deus, com confiança recorremos à vossa poderosa intercessão.

Vós que ensinastes a buscar a Deus na oração, no trabalho e na vida equilibrada, ajudai-nos a viver com fé, disciplina e confiança na proteção divina.

Concedei-nos a graça de rezar esta novena com fé sincera, para que, por vossa intercessão, sejamos protegidos contra todo mal e possamos alcançar as graças que necessitamos, se forem da vontade de Deus.

Amém.`
    },

    { type: "title", text: "Oração do dia" },
    {
      type: "text",
      text: `Ó São Bento, ensinastes o valor do trabalho unido à oração.

Ensinai-nos a viver com responsabilidade e dedicação em nossas tarefas.

Que nosso trabalho seja oferecido a Deus.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
    },

    { type: "title", text: "Oração Final" },
    {
      type: "prayer",
      text: `Ó São Bento, mestre da vida espiritual e poderoso intercessor, rogai por nós.

Ajudai-nos a viver na fé, na obediência e na confiança em Deus.

Amém.`
    }
  ]
},
{
  novenaId: "novena_sao_bento",
  day: 4,
  title: "Quarto dia – São Bento, humildade e obediência",
  sections: [
    { type: "title", text: "Sinal da Cruz" },
    { type: "prayer", text: "Em nome do Pai, do Filho e do Espírito Santo. Amém." },

    { type: "title", text: "Oração Inicial" },
    {
      type: "prayer",
      text: `Ó glorioso São Bento, patriarca dos monges do Ocidente, mestre da vida espiritual e fiel servidor de Deus, com confiança recorremos à vossa poderosa intercessão.

Vós que ensinastes a buscar a Deus na oração, no trabalho e na vida equilibrada, ajudai-nos a viver com fé, disciplina e confiança na proteção divina.

Concedei-nos a graça de rezar esta novena com fé sincera, para que, por vossa intercessão, sejamos protegidos contra todo mal e possamos alcançar as graças que necessitamos, se forem da vontade de Deus.

Amém.`
    },

    { type: "title", text: "Oração do dia" },
    {
      type: "text",
      text: `Ó São Bento, vivestes na humildade e na obediência à vontade de Deus.

Ajudai-nos a vencer o orgulho e a viver com coração dócil.

Que saibamos obedecer a Deus com amor.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
    },

    { type: "title", text: "Oração Final" },
    {
      type: "prayer",
      text: `Ó São Bento, mestre da vida espiritual e poderoso intercessor, rogai por nós.

Ajudai-nos a viver na fé, na obediência e na confiança em Deus.

Amém.`
    }
  ]
},
{
  novenaId: "novena_sao_bento",
  day: 5,
  title: "Quinto dia – São Bento, combate espiritual",
  sections: [
    { type: "title", text: "Sinal da Cruz" },
    { type: "prayer", text: "Em nome do Pai, do Filho e do Espírito Santo. Amém." },

    { type: "title", text: "Oração Inicial" },
    {
      type: "prayer",
      text: `Ó glorioso São Bento, patriarca dos monges do Ocidente, mestre da vida espiritual e fiel servidor de Deus, com confiança recorremos à vossa poderosa intercessão.

Vós que ensinastes a buscar a Deus na oração, no trabalho e na vida equilibrada, ajudai-nos a viver com fé, disciplina e confiança na proteção divina.

Concedei-nos a graça de rezar esta novena com fé sincera, para que, por vossa intercessão, sejamos protegidos contra todo mal e possamos alcançar as graças que necessitamos, se forem da vontade de Deus.

Amém.`
    },

    { type: "title", text: "Oração do dia" },
    {
      type: "text",
      text: `Ó São Bento, enfrentastes com fé as tentações e armadilhas do mal.

Protegei-nos contra todo perigo espiritual e material.

Que sejamos fortalecidos pela graça de Deus.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
    },

    { type: "title", text: "Oração Final" },
    {
      type: "prayer",
      text: `Ó São Bento, mestre da vida espiritual e poderoso intercessor, rogai por nós.

Ajudai-nos a viver na fé, na obediência e na confiança em Deus.

Amém.`
    }
  ]
},
{
  novenaId: "novena_sao_bento",
  day: 6,
  title: "Sexto dia – São Bento, paz do coração",
  sections: [
    { type: "title", text: "Sinal da Cruz" },
    { type: "prayer", text: "Em nome do Pai, do Filho e do Espírito Santo. Amém." },

    { type: "title", text: "Oração Inicial" },
    {
      type: "prayer",
      text: `Ó glorioso São Bento, patriarca dos monges do Ocidente, mestre da vida espiritual e fiel servidor de Deus, com confiança recorremos à vossa poderosa intercessão.

Vós que ensinastes a buscar a Deus na oração, no trabalho e na vida equilibrada, ajudai-nos a viver com fé, disciplina e confiança na proteção divina.

Concedei-nos a graça de rezar esta novena com fé sincera, para que, por vossa intercessão, sejamos protegidos contra todo mal e possamos alcançar as graças que necessitamos, se forem da vontade de Deus.

Amém.`
    },

    { type: "title", text: "Oração do dia" },
    {
      type: "text",
      text: `Ó São Bento, vivestes em profunda paz interior, fruto da confiança em Deus.

Ajudai-nos a encontrar a verdadeira paz em Cristo.

Que afastemos de nosso coração a ansiedade e o medo.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
    },

    { type: "title", text: "Oração Final" },
    {
      type: "prayer",
      text: `Ó São Bento, mestre da vida espiritual e poderoso intercessor, rogai por nós.

Ajudai-nos a viver na fé, na obediência e na confiança em Deus.

Amém.`
    }
  ]
},
{
  novenaId: "novena_sao_bento",
  day: 7,
  title: "Sétimo dia – São Bento, amor à comunidade",
  sections: [
    { type: "title", text: "Sinal da Cruz" },
    { type: "prayer", text: "Em nome do Pai, do Filho e do Espírito Santo. Amém." },

    { type: "title", text: "Oração Inicial" },
    {
      type: "prayer",
      text: `Ó glorioso São Bento, patriarca dos monges do Ocidente, mestre da vida espiritual e fiel servidor de Deus, com confiança recorremos à vossa poderosa intercessão.

Vós que ensinastes a buscar a Deus na oração, no trabalho e na vida equilibrada, ajudai-nos a viver com fé, disciplina e confiança na proteção divina.

Concedei-nos a graça de rezar esta novena com fé sincera, para que, por vossa intercessão, sejamos protegidos contra todo mal e possamos alcançar as graças que necessitamos, se forem da vontade de Deus.

Amém.`
    },

    { type: "title", text: "Oração do dia" },
    {
      type: "text",
      text: `Ó São Bento, organizastes a vida comunitária com sabedoria e caridade.

Ensinai-nos a viver em comunhão com nossos irmãos.

Que sejamos instrumentos de paz e unidade.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
    },

    { type: "title", text: "Oração Final" },
    {
      type: "prayer",
      text: `Ó São Bento, mestre da vida espiritual e poderoso intercessor, rogai por nós.

Ajudai-nos a viver na fé, na obediência e na confiança em Deus.

Amém.`
    }
  ]
},
{
  novenaId: "novena_sao_bento",
  day: 8,
  title: "Oitavo dia – São Bento, protetor contra o mal",
  sections: [
    { type: "title", text: "Sinal da Cruz" },
    { type: "prayer", text: "Em nome do Pai, do Filho e do Espírito Santo. Amém." },

    { type: "title", text: "Oração Inicial" },
    {
      type: "prayer",
      text: `Ó glorioso São Bento, patriarca dos monges do Ocidente, mestre da vida espiritual e fiel servidor de Deus, com confiança recorremos à vossa poderosa intercessão.

Vós que ensinastes a buscar a Deus na oração, no trabalho e na vida equilibrada, ajudai-nos a viver com fé, disciplina e confiança na proteção divina.

Concedei-nos a graça de rezar esta novena com fé sincera, para que, por vossa intercessão, sejamos protegidos contra todo mal e possamos alcançar as graças que necessitamos, se forem da vontade de Deus.

Amém.`
    },

    { type: "title", text: "Oração do dia" },
    {
      type: "text",
      text: `Ó São Bento, sois invocado como poderoso protetor contra o mal.

Intercedei por nós para que sejamos guardados de todo perigo.

Que confiemos sempre na proteção de Deus.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
    },

    { type: "title", text: "Oração Final" },
    {
      type: "prayer",
      text: `Ó São Bento, mestre da vida espiritual e poderoso intercessor, rogai por nós.

Ajudai-nos a viver na fé, na obediência e na confiança em Deus.

Amém.`
    }
  ]
},
{
  novenaId: "novena_sao_bento",
  day: 9,
  title: "Nono dia – São Bento, intercessor poderoso",
  sections: [
    { type: "title", text: "Sinal da Cruz" },
    { type: "prayer", text: "Em nome do Pai, do Filho e do Espírito Santo. Amém." },

    { type: "title", text: "Oração Inicial" },
    {
      type: "prayer",
      text: `Ó glorioso São Bento, patriarca dos monges do Ocidente, mestre da vida espiritual e fiel servidor de Deus, com confiança recorremos à vossa poderosa intercessão.

Vós que ensinastes a buscar a Deus na oração, no trabalho e na vida equilibrada, ajudai-nos a viver com fé, disciplina e confiança na proteção divina.

Concedei-nos a graça de rezar esta novena com fé sincera, para que, por vossa intercessão, sejamos protegidos contra todo mal e possamos alcançar as graças que necessitamos, se forem da vontade de Deus.

Amém.`
    },

    { type: "title", text: "Oração do dia" },
    {
      type: "text",
      text: `Ó glorioso São Bento, confiamos em vossa poderosa intercessão junto a Deus.

Apresentai ao Senhor nossas intenções, necessidades e pedidos.

Conduzi-nos sempre no caminho da fé, da paz e da salvação.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
    },

    { type: "title", text: "Oração Final" },
    {
      type: "prayer",
      text: `Ó São Bento, mestre da vida espiritual e poderoso intercessor, rogai por nós.

Ajudai-nos a viver na fé, na obediência e na confiança em Deus.

Amém.`
    }
  ]
},

// ===== Novena a Nossa Senhora do Carmo =====
{
  novenaId: "novena_nossa_senhora_do_carmo",
  day: 1,
  title: "Primeiro dia – Nossa Senhora do Carmo, Mãe e Rainha",
  sections: [
    { type: "title", text: "Sinal da Cruz" },
    { type: "prayer", text: "Em nome do Pai, do Filho e do Espírito Santo. Amém." },

    { type: "title", text: "Oração Inicial" },
    {
      type: "prayer",
      text: `Ó Nossa Senhora do Carmo, Mãe e Rainha do Monte Carmelo, modelo de oração, silêncio e escuta da Palavra de Deus, com confiança recorremos à vossa intercessão materna.

Vós que prometestes especial proteção àqueles que usam com devoção o vosso santo escapulário, ajudai-nos a viver unidos a Cristo, perseverantes na fé e fiéis ao Evangelho.

Concedei-nos a graça de rezar esta novena com fé sincera, para que, sob vossa proteção, possamos crescer na vida espiritual e alcançar as graças que necessitamos, se forem da vontade de Deus.

Amém.`
    },

    { type: "title", text: "Oração do dia" },
    {
      type: "text",
      text: `Ó Nossa Senhora do Carmo, sois Mãe amorosa e Rainha solícita de todos os que a vós recorrem.

Ajudai-nos a confiar sempre em vossa proteção materna.

Que nos sintamos seguros sob vosso manto.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
    },

    { type: "title", text: "Oração Final" },
    {
      type: "prayer",
      text: `Ó Nossa Senhora do Carmo, Mãe e Rainha do Carmelo, rogai por nós.

Ajudai-nos a viver unidos a Cristo, perseverantes na fé e confiantes em vossa proteção materna.

Amém.`
    }
  ]
},
{
  novenaId: "novena_nossa_senhora_do_carmo",
  day: 2,
  title: "Segundo dia – Nossa Senhora do Carmo, modelo de oração",
  sections: [
    { type: "title", text: "Sinal da Cruz" },
    { type: "prayer", text: "Em nome do Pai, do Filho e do Espírito Santo. Amém." },

    { type: "title", text: "Oração Inicial" },
    {
      type: "prayer",
      text: `Ó Nossa Senhora do Carmo, Mãe e Rainha do Monte Carmelo, modelo de oração, silêncio e escuta da Palavra de Deus, com confiança recorremos à vossa intercessão materna.

Vós que prometestes especial proteção àqueles que usam com devoção o vosso santo escapulário, ajudai-nos a viver unidos a Cristo, perseverantes na fé e fiéis ao Evangelho.

Concedei-nos a graça de rezar esta novena com fé sincera, para que, sob vossa proteção, possamos crescer na vida espiritual e alcançar as graças que necessitamos, se forem da vontade de Deus.

Amém.`
    },

    { type: "title", text: "Oração do dia" },
    {
      type: "text",
      text: `Ó Mãe Santíssima, vossa vida foi marcada pela oração silenciosa e confiante.

Ensinai-nos a buscar a Deus no silêncio do coração.

Que nossa vida seja sustentada pela oração.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
    },

    { type: "title", text: "Oração Final" },
    {
      type: "prayer",
      text: `Ó Nossa Senhora do Carmo, Mãe e Rainha do Carmelo, rogai por nós.

Ajudai-nos a viver unidos a Cristo, perseverantes na fé e confiantes em vossa proteção materna.

Amém.`
    }
  ]
},
{
  novenaId: "novena_nossa_senhora_do_carmo",
  day: 3,
  title: "Terceiro dia – Nossa Senhora do Carmo, escuta da Palavra",
  sections: [
    { type: "title", text: "Sinal da Cruz" },
    { type: "prayer", text: "Em nome do Pai, do Filho e do Espírito Santo. Amém." },

    { type: "title", text: "Oração Inicial" },
    {
      type: "prayer",
      text: `Ó Nossa Senhora do Carmo, Mãe e Rainha do Monte Carmelo, modelo de oração, silêncio e escuta da Palavra de Deus, com confiança recorremos à vossa intercessão materna.

Vós que prometestes especial proteção àqueles que usam com devoção o vosso santo escapulário, ajudai-nos a viver unidos a Cristo, perseverantes na fé e fiéis ao Evangelho.

Concedei-nos a graça de rezar esta novena com fé sincera, para que, sob vossa proteção, possamos crescer na vida espiritual e alcançar as graças que necessitamos, se forem da vontade de Deus.

Amém.`
    },

    { type: "title", text: "Oração do dia" },
    {
      type: "text",
      text: `Ó Nossa Senhora do Carmo, guardáveis a Palavra de Deus em vosso coração.

Ajudai-nos a escutar e viver a Palavra do Senhor.

Que ela ilumine nossos passos.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
    },

    { type: "title", text: "Oração Final" },
    {
      type: "prayer",
      text: `Ó Nossa Senhora do Carmo, Mãe e Rainha do Carmelo, rogai por nós.

Ajudai-nos a viver unidos a Cristo, perseverantes na fé e confiantes em vossa proteção materna.

Amém.`
    }
  ]
},
{
  novenaId: "novena_nossa_senhora_do_carmo",
  day: 4,
  title: "Quarto dia – Nossa Senhora do Carmo, Mãe da esperança",
  sections: [
    { type: "title", text: "Sinal da Cruz" },
    { type: "prayer", text: "Em nome do Pai, do Filho e do Espírito Santo. Amém." },

    { type: "title", text: "Oração Inicial" },
    {
      type: "prayer",
      text: `Ó Nossa Senhora do Carmo, Mãe e Rainha do Monte Carmelo, modelo de oração, silêncio e escuta da Palavra de Deus, com confiança recorremos à vossa intercessão materna.

Vós que prometestes especial proteção àqueles que usam com devoção o vosso santo escapulário, ajudai-nos a viver unidos a Cristo, perseverantes na fé e fiéis ao Evangelho.

Concedei-nos a graça de rezar esta novena com fé sincera, para que, sob vossa proteção, possamos crescer na vida espiritual e alcançar as graças que necessitamos, se forem da vontade de Deus.

Amém.`
    },

    { type: "title", text: "Oração do dia" },
    {
      type: "text",
      text: `Ó Mãe do Carmo, sois sinal de esperança para os que confiam em Deus.

Sustentai-nos nos momentos de dificuldade e provação.

Que nunca percamos a esperança cristã.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
    },

    { type: "title", text: "Oração Final" },
    {
      type: "prayer",
      text: `Ó Nossa Senhora do Carmo, Mãe e Rainha do Carmelo, rogai por nós.

Ajudai-nos a viver unidos a Cristo, perseverantes na fé e confiantes em vossa proteção materna.

Amém.`
    }
  ]
},
{
  novenaId: "novena_nossa_senhora_do_carmo",
  day: 5,
  title: "Quinto dia – Nossa Senhora do Carmo, protetora dos filhos",
  sections: [
    { type: "title", text: "Sinal da Cruz" },
    { type: "prayer", text: "Em nome do Pai, do Filho e do Espírito Santo. Amém." },

    { type: "title", text: "Oração Inicial" },
    {
      type: "prayer",
      text: `Ó Nossa Senhora do Carmo, Mãe e Rainha do Monte Carmelo, modelo de oração, silêncio e escuta da Palavra de Deus, com confiança recorremos à vossa intercessão materna.

Vós que prometestes especial proteção àqueles que usam com devoção o vosso santo escapulário, ajudai-nos a viver unidos a Cristo, perseverantes na fé e fiéis ao Evangelho.

Concedei-nos a graça de rezar esta novena com fé sincera, para que, sob vossa proteção, possamos crescer na vida espiritual e alcançar as graças que necessitamos, se forem da vontade de Deus.

Amém.`
    },

    { type: "title", text: "Oração do dia" },
    {
      type: "text",
      text: `Ó Nossa Senhora do Carmo, protegei vossos filhos em todos os perigos do corpo e da alma.

Livrai-nos do mal e conduzi-nos no caminho do bem.

Que vivamos sempre sob vossa proteção.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
    },

    { type: "title", text: "Oração Final" },
    {
      type: "prayer",
      text: `Ó Nossa Senhora do Carmo, Mãe e Rainha do Carmelo, rogai por nós.

Ajudai-nos a viver unidos a Cristo, perseverantes na fé e confiantes em vossa proteção materna.

Amém.`
    }
  ]
},
{
  novenaId: "novena_nossa_senhora_do_carmo",
  day: 6,
  title: "Sexto dia – Nossa Senhora do Carmo, escapulário como sinal de fé",
  sections: [
    { type: "title", text: "Sinal da Cruz" },
    { type: "prayer", text: "Em nome do Pai, do Filho e do Espírito Santo. Amém." },

    { type: "title", text: "Oração Inicial" },
    {
      type: "prayer",
      text: `Ó Nossa Senhora do Carmo, Mãe e Rainha do Monte Carmelo, modelo de oração, silêncio e escuta da Palavra de Deus, com confiança recorremos à vossa intercessão materna.

Vós que prometestes especial proteção àqueles que usam com devoção o vosso santo escapulário, ajudai-nos a viver unidos a Cristo, perseverantes na fé e fiéis ao Evangelho.

Concedei-nos a graça de rezar esta novena com fé sincera, para que, sob vossa proteção, possamos crescer na vida espiritual e alcançar as graças que necessitamos, se forem da vontade de Deus.

Amém.`
    },

    { type: "title", text: "Oração do dia" },
    {
      type: "text",
      text: `Ó Mãe Santíssima, nos destes o escapulário como sinal de vossa proteção e compromisso cristão.

Ajudai-nos a viver com fidelidade as promessas do nosso batismo.

Que sejamos verdadeiros filhos vossos.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
    },

    { type: "title", text: "Oração Final" },
    {
      type: "prayer",
      text: `Ó Nossa Senhora do Carmo, Mãe e Rainha do Carmelo, rogai por nós.

Ajudai-nos a viver unidos a Cristo, perseverantes na fé e confiantes em vossa proteção materna.

Amém.`
    }
  ]
},
{
  novenaId: "novena_nossa_senhora_do_carmo",
  day: 7,
  title: "Sétimo dia – Nossa Senhora do Carmo, guia na vida espiritual",
  sections: [
    { type: "title", text: "Sinal da Cruz" },
    { type: "prayer", text: "Em nome do Pai, do Filho e do Espírito Santo. Amém." },

    { type: "title", text: "Oração Inicial" },
    {
      type: "prayer",
      text: `Ó Nossa Senhora do Carmo, Mãe e Rainha do Monte Carmelo, modelo de oração, silêncio e escuta da Palavra de Deus, com confiança recorremos à vossa intercessão materna.

Vós que prometestes especial proteção àqueles que usam com devoção o vosso santo escapulário, ajudai-nos a viver unidos a Cristo, perseverantes na fé e fiéis ao Evangelho.

Concedei-nos a graça de rezar esta novena com fé sincera, para que, sob vossa proteção, possamos crescer na vida espiritual e alcançar as graças que necessitamos, se forem da vontade de Deus.

Amém.`
    },

    { type: "title", text: "Oração do dia" },
    {
      type: "text",
      text: `Ó Nossa Senhora do Carmo, conduzis vossos filhos no caminho da santidade.

Ajudai-nos a crescer na vida espiritual com perseverança.

Que sejamos dóceis à ação de Deus.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
    },

    { type: "title", text: "Oração Final" },
    {
      type: "prayer",
      text: `Ó Nossa Senhora do Carmo, Mãe e Rainha do Carmelo, rogai por nós.

Ajudai-nos a viver unidos a Cristo, perseverantes na fé e confiantes em vossa proteção materna.

Amém.`
    }
  ]
},
{
  novenaId: "novena_nossa_senhora_do_carmo",
  day: 8,
  title: "Oitavo dia – Nossa Senhora do Carmo, consoladora dos aflitos",
  sections: [
    { type: "title", text: "Sinal da Cruz" },
    { type: "prayer", text: "Em nome do Pai, do Filho e do Espírito Santo. Amém." },

    { type: "title", text: "Oração Inicial" },
    {
      type: "prayer",
      text: `Ó Nossa Senhora do Carmo, Mãe e Rainha do Monte Carmelo, modelo de oração, silêncio e escuta da Palavra de Deus, com confiança recorremos à vossa intercessão materna.

Vós que prometestes especial proteção àqueles que usam com devoção o vosso santo escapulário, ajudai-nos a viver unidos a Cristo, perseverantes na fé e fiéis ao Evangelho.

Concedei-nos a graça de rezar esta novena com fé sincera, para que, sob vossa proteção, possamos crescer na vida espiritual e alcançar as graças que necessitamos, se forem da vontade de Deus.

Amém.`
    },

    { type: "title", text: "Oração do dia" },
    {
      type: "text",
      text: `Ó Mãe do Carmo, sois consolo dos aflitos e refúgio dos pecadores.

Consolai os que sofrem e fortalecei os que estão abatidos.

Que encontremos em vós conforto e paz.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
    },

    { type: "title", text: "Oração Final" },
    {
      type: "prayer",
      text: `Ó Nossa Senhora do Carmo, Mãe e Rainha do Carmelo, rogai por nós.

Ajudai-nos a viver unidos a Cristo, perseverantes na fé e confiantes em vossa proteção materna.

Amém.`
    }
  ]
},
{
  novenaId: "novena_nossa_senhora_do_carmo",
  day: 9,
  title: "Nono dia – Nossa Senhora do Carmo, intercessora poderosa",
  sections: [
    { type: "title", text: "Sinal da Cruz" },
    { type: "prayer", text: "Em nome do Pai, do Filho e do Espírito Santo. Amém." },

    { type: "title", text: "Oração Inicial" },
    {
      type: "prayer",
      text: `Ó Nossa Senhora do Carmo, Mãe e Rainha do Monte Carmelo, modelo de oração, silêncio e escuta da Palavra de Deus, com confiança recorremos à vossa intercessão materna.

Vós que prometestes especial proteção àqueles que usam com devoção o vosso santo escapulário, ajudai-nos a viver unidos a Cristo, perseverantes na fé e fiéis ao Evangelho.

Concedei-nos a graça de rezar esta novena com fé sincera, para que, sob vossa proteção, possamos crescer na vida espiritual e alcançar as graças que necessitamos, se forem da vontade de Deus.

Amém.`
    },

    { type: "title", text: "Oração do dia" },
    {
      type: "text",
      text: `Ó gloriosa Nossa Senhora do Carmo, confiamos em vossa poderosa intercessão.

Apresentai a Deus nossas intenções, necessidades e pedidos.

Conduzi-nos sempre no caminho da fé, da esperança e da salvação.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
    },

    { type: "title", text: "Oração Final" },
    {
      type: "prayer",
      text: `Ó Nossa Senhora do Carmo, Mãe e Rainha do Carmelo, rogai por nós.

Ajudai-nos a viver unidos a Cristo, perseverantes na fé e confiantes em vossa proteção materna.

Amém.`
    }
  ]
},
{
  novenaId: "novena_santa_ana_e_sao_joaquim",
  title: "NOVENA A SANTA ANA E SAO JOAQUIM",
  howToPray: [
    "1. Sinal da Cruz",
    "2. Oração Inicial",
    "3. Oração do dia",
    "4. Pai-Nosso",
    "5. Ave-Maria",
    "6. Glória ao Pai",
    "7. Oração Final"
  ],
  sections: [
    {
      type: "fixed",
      title: "SINAL DA CRUZ",
      text: "Em nome do Pai, do Filho e do Espírito Santo. Amém."
    },
    {
      type: "fixed",
      title: "ORACAO INICIAL (TODOS OS DIAS)",
      text: `Ó gloriosos Santa Ana e São Joaquim, pais da Virgem Maria e avós de Jesus, exemplos de fé, esperança e fidelidade a Deus, com confiança recorremos à vossa intercessão.

Vós que educastes Maria no amor a Deus e na observância de Sua vontade, ajudai-nos a viver com fé sincera, a fortalecer nossas famílias e a transmitir os valores cristãos às novas gerações.

Concedei-nos a graça de rezar esta novena com devoção, para que, por vossa intercessão, possamos alcançar as graças que necessitamos, se forem da vontade de Deus.

Amém.`
    },
    {
      type: "day",
      day: 1,
      title: "PRIMEIRO DIA – SANTA ANA E SAO JOAQUIM, EXEMPLOS DE FÉ",
      text: `Ó Santa Ana e São Joaquim, mesmo nas dificuldades, confiastes plenamente em Deus.

Ensinai-nos a viver com fé firme e perseverante.

Que nunca percamos a confiança no Senhor.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
    },
    {
      type: "day",
      day: 2,
      title: "SEGUNDO DIA – SANTA ANA E SAO JOAQUIM, MODELOS DE ESPERANCA",
      text: `Ó santos avós de Jesus, soubestes esperar com paciência o cumprimento das promessas de Deus.

Ajudai-nos a cultivar a esperança cristã em todas as circunstâncias.

Que saibamos esperar no tempo do Senhor.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
    },
    {
      type: "day",
      day: 3,
      title: "TERCEIRO DIA – SANTA ANA E SAO JOAQUIM, FAMILIA ABENCOADA",
      text: `Ó Santa Ana e São Joaquim, formastes uma família abençoada por Deus.

Intercedei por nossas famílias, para que vivam na fé, no amor e na união.

Que nossos lares sejam lugares de oração e paz.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
    },
    {
      type: "day",
      day: 4,
      title: "QUARTO DIA – SANTA ANA E SAO JOAQUIM, EDUCADORES NA FÉ",
      text: `Ó santos avós, educastes Maria no amor a Deus e na fidelidade à Sua Palavra.

Ajudai pais e avós a transmitirem a fé com amor e exemplo.

Que as novas gerações cresçam na graça de Deus.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
    },
    {
      type: "day",
      day: 5,
      title: "QUINTO DIA – SANTA ANA E SAO JOAQUIM, CONFIANCA NA PROVIDENCIA",
      text: `Ó Santa Ana e São Joaquim, confiastes na providência divina em todos os momentos.

Ensinai-nos a entregar nossas preocupações ao Senhor.

Que nossa vida seja marcada pela confiança em Deus.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
    },
    {
      type: "day",
      day: 6,
      title: "SEXTO DIA – SANTA ANA E SAO JOAQUIM, HUMILDADE E OBEDIENCIA",
      text: `Ó santos escolhidos por Deus, vivestes com humildade e obediência à Sua vontade.

Ajudai-nos a viver com coração dócil e obediente.

Que saibamos acolher os planos de Deus para nossa vida.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
    },
    {
      type: "day",
      day: 7,
      title: "SETIMO DIA – SANTA ANA E SAO JOAQUIM, AMOR E PERSEVERANCA",
      text: `Ó Santa Ana e São Joaquim, vivestes unidos no amor e na perseverança.

Ajudai-nos a fortalecer os laços familiares com paciência e caridade.

Que o amor seja sempre o fundamento de nossas relações.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
    },
    {
      type: "day",
      day: 8,
      title: "OITAVO DIA – SANTA ANA E SAO JOAQUIM, INTERCESSORES DAS FAMILIAS",
      text: `Ó santos avós de Jesus, sois intercessores das famílias cristãs.

Apresentai a Deus nossas famílias, necessidades e intenções.

Protegei especialmente os idosos, os avós e as crianças.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
    },
    {
      type: "day",
      day: 9,
      title: "NONO DIA – SANTA ANA E SAO JOAQUIM, INTERCESSORES PODEROSOS",
      text: `Ó gloriosos Santa Ana e São Joaquim, confiamos em vossa poderosa intercessão.

Apresentai a Deus nossos pedidos e necessidades.

Conduzi-nos sempre no caminho da fé, do amor e da salvação.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
    },
    {
      type: "fixed",
      title: "ORACAO FINAL (TODOS OS DIAS)",
      text: `Ó Santa Ana e São Joaquim, exemplos de fé e amor familiar, rogai por nós.

Ajudai-nos a viver segundo a vontade de Deus, fortalecendo nossas famílias na fé e na caridade.

Amém.`
    }
  ]
},
[
  {
    novenaId: "novena_sao_joao_maria_vianney",
    title: "NOVENA A SAO JOAO MARIA VIANNEY",
    howToPray: [
      "1. Sinal da Cruz",
      "2. Oração Inicial",
      "3. Oração do dia",
      "4. Pai-Nosso",
      "5. Ave-Maria",
      "6. Glória ao Pai",
      "7. Oração Final"
    ],
    sections: [
      {
        type: "fixed",
        title: "SINAL DA CRUZ",
        text: "Em nome do Pai, do Filho e do Espírito Santo. Amém."
      },
      {
        type: "fixed",
        title: "ORACAO INICIAL (TODOS OS DIAS)",
        text: `Ó São João Maria Vianney, santo Cura d’Ars, modelo de sacerdote segundo o Coração de Cristo, com confiança recorremos à vossa intercessão.

Vós que vivestes inteiramente dedicado à oração, à penitência e ao cuidado das almas, ajudai-nos a amar a Deus sobre todas as coisas e a buscar a santidade em nossa vida cotidiana.

Concedei-nos a graça de rezar esta novena com fé sincera, para que, por vossa intercessão, possamos crescer no amor a Deus, na fidelidade à Igreja e alcançar as graças que necessitamos, se forem da vontade de Deus.

Amém.`
      },
      {
        type: "day",
        day: 1,
        title: "PRIMEIRO DIA – SAO JOAO MARIA VIANNEY, HOMEM DE FÉ",
        text: `Ó São João Maria Vianney, mesmo com limitações humanas, confiastes plenamente em Deus.

Ensinai-nos a confiar no Senhor em todas as circunstâncias da vida.

Que nossa fé seja simples, firme e perseverante.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
      },
      {
        type: "day",
        day: 2,
        title: "SEGUNDO DIA – SAO JOAO MARIA VIANNEY, AMOR A ORACAO",
        text: `Ó Santo Cura d’Ars, fizestes da oração o centro de vossa vida.

Ajudai-nos a cultivar uma vida de oração constante e profunda.

Que busquemos sempre a presença de Deus.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
      },
      {
        type: "day",
        day: 3,
        title: "TERCEIRO DIA – SAO JOAO MARIA VIANNEY, ZELO PELAS ALMAS",
        text: `Ó São João Maria Vianney, dedicastes vossa vida à salvação das almas.

Ensinai-nos a amar o próximo e a desejar sua salvação.

Que sejamos instrumentos da misericórdia de Deus.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
      },
      {
        type: "day",
        day: 4,
        title: "QUARTO DIA – SAO JOAO MARIA VIANNEY, AMOR AO SACRAMENTO DA CONFISSAO",
        text: `Ó São João Maria Vianney, passastes longas horas reconciliando os pecadores com Deus.

Ajudai-nos a valorizar o sacramento da Confissão.

Que busquemos sempre a misericórdia divina.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
      },
      {
        type: "day",
        day: 5,
        title: "QUINTO DIA – SAO JOAO MARIA VIANNEY, HUMILDADE E SIMPLICIDADE",
        text: `Ó Santo Cura d’Ars, vivestes com humildade e simplicidade de coração.

Ensinai-nos a rejeitar o orgulho e a vaidade.

Que saibamos servir a Deus com coração sincero.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
      },
      {
        type: "day",
        day: 6,
        title: "SEXTO DIA – SAO JOAO MARIA VIANNEY, AMOR A EUCARISTIA",
        text: `Ó São João Maria Vianney, encontrastes na Eucaristia a força de vossa missão.

Ajudai-nos a reconhecer a presença real de Cristo no Santíssimo Sacramento.

Que nossa participação na Eucaristia fortaleça nossa fé.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
      },
      {
        type: "day",
        day: 7,
        title: "SETIMO DIA – SAO JOAO MARIA VIANNEY, PACIENCIA NAS PROVACOES",
        text: `Ó São João Maria Vianney, enfrentastes dificuldades e incompreensões com paciência e fé.

Ensinai-nos a aceitar as provações unidos a Cristo.

Que nunca desanimemos diante das dificuldades.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
      },
      {
        type: "day",
        day: 8,
        title: "OITAVO DIA – SAO JOAO MARIA VIANNEY, EXEMPLO DE SANTIDADE",
        text: `Ó São João Maria Vianney, vossa vida simples tornou-se testemunho de santidade.

Ajudai-nos a buscar a santidade em nossas ações diárias.

Que nossa vida seja agradável a Deus.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
      },
      {
        type: "day",
        day: 9,
        title: "NONO DIA – SAO JOAO MARIA VIANNEY, INTERCESSOR DOS SACERDOTES",
        text: `Ó glorioso São João Maria Vianney, confiamos em vossa poderosa intercessão.

Apresentai a Deus nossas intenções, especialmente pelos sacerdotes e vocações.

Conduzi-nos sempre no caminho da fé, da misericórdia e da salvação.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
      },
      {
        type: "fixed",
        title: "ORACAO FINAL (TODOS OS DIAS)",
        text: `Ó São João Maria Vianney, santo Cura d’Ars e patrono dos sacerdotes, rogai por nós.

Ajudai-nos a amar a Deus, a Igreja e os sacramentos com todo o coração.

Amém.`
      }
    ]
  },

  {
    novenaId: "novena_santa_filomena",
    title: "NOVENA A SANTA FILOMENA",
    howToPray: [
      "1. Sinal da Cruz",
      "2. Oração Inicial",
      "3. Oração do dia",
      "4. Pai-Nosso",
      "5. Ave-Maria",
      "6. Glória ao Pai",
      "7. Oração Final"
    ],
    sections: [
      {
        type: "fixed",
        title: "SINAL DA CRUZ",
        text: "Em nome do Pai, do Filho e do Espírito Santo. Amém."
      },
      {
        type: "fixed",
        title: "ORACAO INICIAL (TODOS OS DIAS)",
        text: `Ó Santa Filomena, virgem e mártir, poderosa intercessora junto a Deus e exemplo de pureza, fé e coragem, com confiança recorremos à vossa intercessão.

Vós que permanecestes fiéis a Cristo até o martírio, ajudai-nos a viver firmes na fé, a guardar a pureza do coração e a confiar plenamente no amor de Deus.

Concedei-nos a graça de rezar esta novena com fé sincera, para que, por vossa intercessão, possamos alcançar as graças que necessitamos, se forem da vontade de Deus.

Amém.`
      },
      {
        type: "day",
        day: 1,
        title: "PRIMEIRO DIA – SANTA FILOMENA, MODELO DE FÉ",
        text: `Ó Santa Filomena, desde jovem escolhestes servir somente a Deus.

Ensinai-nos a viver uma fé firme e confiante.

Que coloquemos Deus acima de todas as coisas.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
      },
      {
        type: "day",
        day: 2,
        title: "SEGUNDO DIA – SANTA FILOMENA, AMOR A PUREZA",
        text: `Ó Santa Filomena, consagrastes a Deus vossa pureza de corpo e alma.

Ajudai-nos a viver com coração puro e intenções retas.

Que sejamos templos vivos do Espírito Santo.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
      },
      {
        type: "day",
        day: 3,
        title: "TERCEIRO DIA – SANTA FILOMENA, CORAGEM NA PROVACAO",
        text: `Ó Santa Filomena, enfrentastes perseguições e sofrimentos com coragem.

Fortalecei-nos nas dificuldades da vida cristã.

Que jamais abandonemos nossa fé diante das provações.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
      },
      {
        type: "day",
        day: 4,
        title: "QUARTO DIA – SANTA FILOMENA, FIDELIDADE A CRISTO",
        text: `Ó Santa Filomena, permanecestes fiel a Cristo até o fim.

Ensinai-nos a ser fiéis ao Senhor em todas as circunstâncias.

Que nossa vida seja testemunho do Evangelho.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
      },
      {
        type: "day",
        day: 5,
        title: "QUINTO DIA – SANTA FILOMENA, FORCA NA ORACAO",
        text: `Ó Santa Filomena, encontrastes na oração força para suportar o martírio.

Ajudai-nos a buscar na oração a força necessária para nossa caminhada.

Que nossa vida seja sustentada pela oração constante.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
      },
      {
        type: "day",
        day: 6,
        title: "SEXTO DIA – SANTA FILOMENA, ESPERANCA NAS DIFICULDADES",
        text: `Ó Santa Filomena, mesmo diante da morte, mantivestes viva a esperança em Deus.

Ajudai-nos a confiar no Senhor nos momentos mais difíceis.

Que nunca percamos a esperança cristã.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
      },
      {
        type: "day",
        day: 7,
        title: "SETIMO DIA – SANTA FILOMENA, EXEMPLO DE OBEDIENCIA",
        text: `Ó Santa Filomena, obedecestes a Deus com total entrega.

Ensinai-nos a acolher a vontade divina em nossa vida.

Que saibamos dizer sim a Deus com amor.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
      },
      {
        type: "day",
        day: 8,
        title: "OITAVO DIA – SANTA FILOMENA, INTERCESSORA DOS AFLITOS",
        text: `Ó Santa Filomena, sois conhecida por socorrer os aflitos e necessitados.

Intercedei por todos os que sofrem no corpo e na alma.

Concedei-nos consolo, força e paz.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
      },
      {
        type: "day",
        day: 9,
        title: "NONO DIA – SANTA FILOMENA, INTERCESSORA PODEROSA",
        text: `Ó gloriosa Santa Filomena, confiamos em vossa poderosa intercessão.

Apresentai a Deus nossas intenções, necessidades e pedidos.

Conduzi-nos sempre no caminho da fé, da pureza e da salvação.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
      },
      {
        type: "fixed",
        title: "ORACAO FINAL (TODOS OS DIAS)",
        text: `Ó Santa Filomena, virgem e mártir fiel a Cristo, rogai por nós.

Ajudai-nos a viver na fé, na pureza e na confiança em Deus.

Amém.`
      }
    ]
  }
]
[
  {
    novenaId: "novena_santa_clara",
    title: "NOVENA A SANTA CLARA",
    howToPray: [
      "1. Sinal da Cruz",
      "2. Oração Inicial",
      "3. Oração do dia",
      "4. Pai-Nosso",
      "5. Ave-Maria",
      "6. Glória ao Pai",
      "7. Oração Final"
    ],
    sections: [
      {
        type: "fixed",
        title: "SINAL DA CRUZ",
        text: "Em nome do Pai, do Filho e do Espírito Santo. Amém."
      },
      {
        type: "fixed",
        title: "ORACAO INICIAL (TODOS OS DIAS)",
        text: `Ó Santa Clara, virgem consagrada e fiel seguidora de São Francisco, mulher de profunda fé, pobreza e amor a Jesus Eucarístico, com confiança recorremos à vossa intercessão.

Vós que escolhestes Cristo como único tesouro e vivestes na simplicidade e na confiança absoluta em Deus, ajudai-nos a buscar as coisas do alto e a viver desapegados dos bens passageiros.

Concedei-nos a graça de rezar esta novena com fé sincera, para que, seguindo vosso exemplo de amor, oração e entrega, possamos alcançar as graças que necessitamos, se forem da vontade de Deus.

Amém.`
      },
      {
        type: "day",
        day: 1,
        title: "PRIMEIRO DIA – SANTA CLARA, CHAMADA POR DEUS",
        text: `Ó Santa Clara, respondestes com generosidade ao chamado de Deus, deixando tudo para seguir a Cristo.

Ensinai-nos a escutar a voz do Senhor e a responder com coragem e fidelidade.

Que Deus seja sempre o centro de nossa vida.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
      },
      {
        type: "day",
        day: 2,
        title: "SEGUNDO DIA – SANTA CLARA, AMOR A POBREZA EVANGELICA",
        text: `Ó Santa Clara, escolhestes a pobreza como caminho de liberdade e amor a Deus.

Ajudai-nos a viver com simplicidade e desapego.

Que confiemos sempre na providência divina.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
      },
      {
        type: "day",
        day: 3,
        title: "TERCEIRO DIA – SANTA CLARA, VIDA DE ORACAO",
        text: `Ó Santa Clara, fizestes da oração o sustento de vossa vida espiritual.

Ensinai-nos a buscar a Deus na oração constante e confiante.

Que encontremos na oração força e paz.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
      },
      {
        type: "day",
        day: 4,
        title: "QUARTO DIA – SANTA CLARA, AMOR A EUCARISTIA",
        text: `Ó Santa Clara, tivestes profunda devoção a Jesus presente na Eucaristia.

Ajudai-nos a reconhecer e amar a presença real de Cristo no Santíssimo Sacramento.

Que nossa fé eucarística seja cada vez mais viva.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
      },
      {
        type: "day",
        day: 5,
        title: "QUINTO DIA – SANTA CLARA, CONFIANCA EM DEUS",
        text: `Ó Santa Clara, mesmo diante das dificuldades, confiastes plenamente em Deus.

Ensinai-nos a confiar no Senhor em todas as circunstâncias da vida.

Que nunca percamos a esperança.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
      },
      {
        type: "day",
        day: 6,
        title: "SEXTO DIA – SANTA CLARA, HUMILDADE E SIMPLICIDADE",
        text: `Ó Santa Clara, vivestes com humildade e simplicidade de coração.

Ajudai-nos a vencer o orgulho e a vaidade.

Que saibamos servir a Deus com coração sincero.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
      },
      {
        type: "day",
        day: 7,
        title: "SETIMO DIA – SANTA CLARA, FORTALEZA NAS PROVACOES",
        text: `Ó Santa Clara, enfrentastes enfermidades e provações com fé e serenidade.

Ajudai-nos a aceitar nossas dificuldades unidos a Cristo.

Que sejamos fortalecidos pela graça de Deus.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
      },
      {
        type: "day",
        day: 8,
        title: "OITAVO DIA – SANTA CLARA, LUZ NA FÉ",
        text: `Ó Santa Clara, vosso nome reflete a clareza da fé e da confiança em Deus.

Iluminai nosso caminho para que vivamos segundo o Evangelho.

Que nossa vida seja testemunho da luz de Cristo.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
      },
      {
        type: "day",
        day: 9,
        title: "NONO DIA – SANTA CLARA, INTERCESSORA PODEROSA",
        text: `Ó gloriosa Santa Clara, confiamos em vossa poderosa intercessão junto a Deus.

Apresentai ao Senhor nossas intenções, necessidades e pedidos.

Conduzi-nos sempre no caminho da fé, da esperança e da salvação.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
      },
      {
        type: "fixed",
        title: "ORACAO FINAL (TODOS OS DIAS)",
        text: `Ó Santa Clara, modelo de fé, pobreza e amor a Cristo, rogai por nós.

Ajudai-nos a viver com coração puro, confiantes em Deus e perseverantes na oração.

Amém.`
      }
    ]
  },

  {
    novenaId: "novena_nossa_senhora_da_assuncao",
    title: "NOVENA DE NOSSA SENHORA DA ASSUNCAO",
    howToPray: [
      "1. Sinal da Cruz",
      "2. Oração Inicial",
      "3. Oração do dia",
      "4. Pai-Nosso",
      "5. Ave-Maria",
      "6. Glória ao Pai",
      "7. Oração Final"
    ],
    sections: [
      {
        type: "fixed",
        title: "SINAL DA CRUZ",
        text: "Em nome do Pai, do Filho e do Espírito Santo. Amém."
      },
      {
        type: "fixed",
        title: "ORACAO INICIAL (TODOS OS DIAS)",
        text: `Ó Nossa Senhora da Assunção, Mãe de Deus e nossa Mãe, que fostes elevada ao céu em corpo e alma como sinal da vitória de Cristo sobre a morte, com confiança recorremos à vossa intercessão materna.

Vós que participastes plenamente da glória do vosso Filho, ajudai-nos a viver com os olhos voltados para o céu, sem descuidar das responsabilidades da vida terrena.

Concedei-nos a graça de rezar esta novena com fé sincera, para que, sustentados por vossa proteção, possamos caminhar com esperança rumo à vida eterna e alcançar as graças que necessitamos, se forem da vontade de Deus.

Amém.`
      },
      {
        type: "day",
        day: 1,
        title: "PRIMEIRO DIA – NOSSA SENHORA DA ASSUNCAO, SINAL DE ESPERANCA",
        text: `Ó Nossa Senhora da Assunção, vossa elevação ao céu é sinal da esperança que nos aguarda.

Ajudai-nos a viver confiantes na promessa da vida eterna.

Que nossa esperança esteja sempre em Deus.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
      },
      {
        type: "day",
        day: 2,
        title: "SEGUNDO DIA – NOSSA SENHORA DA ASSUNCAO, MÃE GLORIFICADA",
        text: `Ó Mãe Santíssima, fostes glorificada por Deus por vossa fidelidade e amor.

Ensinai-nos a viver com humildade e obediência à vontade divina.

Que sigamos vosso exemplo de fidelidade.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
      },
      {
        type: "day",
        day: 3,
        title: "TERCEIRO DIA – NOSSA SENHORA DA ASSUNCAO, VITORIA SOBRE A MORTE",
        text: `Ó Nossa Senhora da Assunção, em vós contemplamos a vitória da vida sobre a morte.

Ajudai-nos a vencer o pecado e tudo o que nos afasta de Deus.

Que vivamos sempre na graça divina.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
      },
      {
        type: "day",
        day: 4,
        title: "QUARTO DIA – NOSSA SENHORA DA ASSUNCAO, MODELO DE SANTIDADE",
        text: `Ó Mãe gloriosa, vossa vida foi marcada pela santidade e pela entrega total a Deus.

Ensinai-nos a buscar a santidade em nossa vida diária.

Que sejamos fiéis em pequenas e grandes coisas.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
      },
      {
        type: "day",
        day: 5,
        title: "QUINTO DIA – NOSSA SENHORA DA ASSUNCAO, MÃE DA IGREJA GLORIOSA",
        text: `Ó Nossa Senhora da Assunção, sois Mãe da Igreja peregrina e gloriosa no céu.

Intercedei pela Igreja em sua missão no mundo.

Ajudai-nos a viver em comunhão com a Igreja.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
      },
      {
        type: "day",
        day: 6,
        title: "SEXTO DIA – NOSSA SENHORA DA ASSUNCAO, CONFORTO DOS AFLITOS",
        text: `Ó Mãe glorificada, olhai por todos os que sofrem e choram nesta vida.

Consolai os aflitos e fortalecei os desanimados.

Que encontremos em vós consolo e esperança.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
      },
      {
        type: "day",
        day: 7,
        title: "SETIMO DIA – NOSSA SENHORA DA ASSUNCAO, ESPERANCA DA RESSURREICAO",
        text: `Ó Nossa Senhora da Assunção, sois sinal da ressurreição prometida aos fiéis.

Ajudai-nos a viver com fé na ressurreição dos mortos.

Que nossa vida seja orientada para o céu.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
      },
      {
        type: "day",
        day: 8,
        title: "OITAVO DIA – NOSSA SENHORA DA ASSUNCAO, INTERCESSORA JUNTO A DEUS",
        text: `Ó Mãe Santíssima, glorificada no céu, intercedei por nós junto a vosso Filho.

Apresentai a Deus nossas intenções e necessidades.

Que confiemos sempre em vossa intercessão materna.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
      },
      {
        type: "day",
        day: 9,
        title: "NONO DIA – NOSSA SENHORA DA ASSUNCAO, MÃE DA VIDA ETERNA",
        text: `Ó gloriosa Nossa Senhora da Assunção, confiamos em vossa poderosa intercessão.

Conduzi-nos sempre no caminho da fé, da esperança e da vida eterna.

Ajudai-nos a viver de modo digno da glória que nos espera.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
      },
      {
        type: "fixed",
        title: "ORACAO FINAL (TODOS OS DIAS)",
        text: `Ó Nossa Senhora da Assunção, elevada ao céu em corpo e alma, rogai por nós.

Ajudai-nos a caminhar com fé e esperança, buscando as coisas do alto e vivendo segundo a vontade de Deus.

Amém.`
      }
    ]
  }
],

[
  {
    novenaId: "novena_sao_roque",
    title: "NOVENA A SAO ROQUE",
    howToPray: [
      "1. Sinal da Cruz",
      "2. Oração Inicial",
      "3. Oração do dia",
      "4. Pai-Nosso",
      "5. Ave-Maria",
      "6. Glória ao Pai",
      "7. Oração Final"
    ],
    sections: [
      {
        type: "fixed",
        title: "SINAL DA CRUZ",
        text: "Em nome do Pai, do Filho e do Espírito Santo. Amém."
      },
      {
        type: "fixed",
        title: "ORACAO INICIAL (TODOS OS DIAS)",
        text: `Ó glorioso São Roque, fiel servo de Deus, exemplo de caridade e confiança na providência divina, com confiança recorremos à vossa poderosa intercessão.

Vós que dedicastes vossa vida ao cuidado dos doentes, especialmente dos atingidos pela peste, ensinai-nos a viver a caridade, a compaixão e a entrega ao próximo.

Concedei-nos a graça de rezar esta novena com fé sincera, para que, por vossa intercessão, sejamos fortalecidos na fé, protegidos nas enfermidades e alcancemos as graças que necessitamos, se forem da vontade de Deus.

Amém.`
      },
      {
        type: "day",
        day: 1,
        title: "PRIMEIRO DIA – SAO ROQUE, EXEMPLO DE FÉ",
        text: `Ó São Roque, desde jovem escolhestes viver segundo a vontade de Deus.

Ensinai-nos a colocar nossa confiança no Senhor em todos os momentos da vida.

Que nossa fé seja firme e perseverante.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
      },
      {
        type: "day",
        day: 2,
        title: "SEGUNDO DIA – SAO ROQUE, AMOR AOS POBRES",
        text: `Ó São Roque, repartistes vossos bens com os pobres e necessitados.

Ajudai-nos a viver a caridade concreta e generosa.

Que saibamos reconhecer Cristo nos mais necessitados.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
      },
      {
        type: "day",
        day: 3,
        title: "TERCEIRO DIA – SAO ROQUE, SERVIDOR DOS DOENTES",
        text: `Ó São Roque, dedicastes vossa vida a cuidar dos doentes com amor e sacrifício.

Intercedei por todos os enfermos e por aqueles que cuidam deles.

Concedei-nos saúde do corpo e da alma.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
      },
      {
        type: "day",
        day: 4,
        title: "QUARTO DIA – SAO ROQUE, CONFIANCA NA PROVIDENCIA",
        text: `Ó São Roque, mesmo abandonado e enfermo, confiastes plenamente em Deus.

Ensinai-nos a confiar na providência divina nas horas difíceis.

Que nunca percamos a esperança.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
      },
      {
        type: "day",
        day: 5,
        title: "QUINTO DIA – SAO ROQUE, HUMILDADE E DESAPEGO",
        text: `Ó São Roque, vivestes com humildade e desapego dos bens materiais.

Ajudai-nos a viver com simplicidade e coração livre.

Que busquemos as riquezas do céu.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
      },
      {
        type: "day",
        day: 6,
        title: "SEXTO DIA – SAO ROQUE, PACIENCIA NO SOFRIMENTO",
        text: `Ó São Roque, suportastes o sofrimento físico com paciência e fé.

Ensinai-nos a oferecer nossas dores unidos a Cristo.

Que saibamos transformar o sofrimento em oração.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
      },
      {
        type: "day",
        day: 7,
        title: "SETIMO DIA – SAO ROQUE, PROTETOR CONTRA AS DOENCAS",
        text: `Ó São Roque, sois invocado como protetor contra as doenças e epidemias.

Intercedei por nós para que sejamos preservados de todo mal.

Protegei nossas famílias e comunidades.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
      },
      {
        type: "day",
        day: 8,
        title: "OITAVO DIA – SAO ROQUE, EXEMPLO DE CARIDADE PERSEVERANTE",
        text: `Ó São Roque, mesmo nas dificuldades, jamais deixastes de amar e servir.

Ajudai-nos a perseverar na caridade e no bem.

Que nossa vida seja sinal do amor de Deus.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
      },
      {
        type: "day",
        day: 9,
        title: "NONO DIA – SAO ROQUE, INTERCESSOR PODEROSO",
        text: `Ó glorioso São Roque, confiamos em vossa poderosa intercessão junto a Deus.

Apresentai ao Senhor nossas intenções, necessidades e pedidos.

Conduzi-nos sempre no caminho da fé, da caridade e da salvação.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
      },
      {
        type: "fixed",
        title: "ORACAO FINAL (TODOS OS DIAS)",
        text: `Ó São Roque, exemplo de caridade e confiança em Deus, rogai por nós.

Protegei-nos nas enfermidades e ajudai-nos a viver com fé, esperança e amor.

Amém.`
      }
    ]
  },

  {
    novenaId: "novena_santa_monica",
    title: "NOVENA A SANTA MONICA",
    howToPray: [
      "1. Sinal da Cruz",
      "2. Oração Inicial",
      "3. Oração do dia",
      "4. Pai-Nosso",
      "5. Ave-Maria",
      "6. Glória ao Pai",
      "7. Oração Final"
    ],
    sections: [
      {
        type: "fixed",
        title: "SINAL DA CRUZ",
        text: "Em nome do Pai, do Filho e do Espírito Santo. Amém."
      },
      {
        type: "fixed",
        title: "ORACAO INICIAL (TODOS OS DIAS)",
        text: `Ó Santa Mônica, mulher de fé perseverante, mãe dedicada e incansável na oração, com confiança recorremos à vossa poderosa intercessão.

Vós que, com lágrimas, súplicas e esperança, confiastes vossos filhos à misericórdia de Deus, ajudai-nos a nunca desistir daqueles que amamos.

Concedei-nos a graça de rezar esta novena com fé sincera, para que, seguindo vosso exemplo de perseverança e confiança, possamos alcançar as graças que necessitamos, se forem da vontade de Deus.

Amém.`
      },
      {
        type: "day",
        day: 1,
        title: "PRIMEIRO DIA – SANTA MONICA, MULHER DE FÉ",
        text: `Ó Santa Mônica, vivestes uma fé firme mesmo em meio às dificuldades.

Ensinai-nos a confiar em Deus em todas as circunstâncias da vida.

Que nossa fé seja constante e perseverante.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
      },
      {
        type: "day",
        day: 2,
        title: "SEGUNDO DIA – SANTA MONICA, MÃE ORANTE",
        text: `Ó Santa Mônica, vossa vida foi marcada pela oração incessante por vossos filhos.

Ajudai-nos a confiar nossas famílias ao Senhor por meio da oração.

Que nunca nos cansemos de rezar.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
      },
      {
        type: "day",
        day: 3,
        title: "TERCEIRO DIA – SANTA MONICA, EXEMPLO DE PACIENCIA",
        text: `Ó Santa Mônica, suportastes longos anos de sofrimento com paciência e esperança.

Ensinai-nos a esperar no tempo de Deus sem desanimar.

Que aprendamos a viver a paciência cristã.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
      },
      {
        type: "day",
        day: 4,
        title: "QUARTO DIA – SANTA MONICA, CONFIANCA NA MISERICORDIA DE DEUS",
        text: `Ó Santa Mônica, acreditastes firmemente que Deus ouviria vossas súplicas.

Ajudai-nos a confiar na misericórdia divina, mesmo quando tudo parece perdido.

Que nunca percamos a esperança.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
      },
      {
        type: "day",
        day: 5,
        title: "QUINTO DIA – SANTA MONICA, AMOR PELA FAMILIA",
        text: `Ó Santa Mônica, dedicastes vossa vida ao cuidado espiritual e material de vossa família.

Intercedei por todas as famílias, especialmente as que enfrentam dificuldades.

Que nossos lares sejam fortalecidos pela fé.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
      },
      {
        type: "day",
        day: 6,
        title: "SEXTO DIA – SANTA MONICA, FORCA NO SOFRIMENTO",
        text: `Ó Santa Mônica, transformastes o sofrimento em oração e entrega a Deus.

Ajudai-nos a oferecer nossas dores com fé e amor.

Que saibamos confiar em Deus mesmo nas provações.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
      },
      {
        type: "day",
        day: 7,
        title: "SETIMO DIA – SANTA MONICA, PERSEVERANCA NA ORACAO",
        text: `Ó Santa Mônica, jamais desististes de rezar pela conversão de vosso filho.

Ensinai-nos a perseverar na oração, mesmo quando não vemos resultados imediatos.

Que nossa esperança esteja sempre em Deus.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
      },
      {
        type: "day",
        day: 8,
        title: "OITAVO DIA – SANTA MONICA, ALEGRIA DA CONVERSAO",
        text: `Ó Santa Mônica, fostes consolada pela conversão de Santo Agostinho.

Ajudai-nos a confiar que Deus transforma os corações.

Que saibamos agradecer pelas graças recebidas.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
      },
      {
        type: "day",
        day: 9,
        title: "NONO DIA – SANTA MONICA, INTERCESSORA DAS MÃES E FAMILIAS",
        text: `Ó gloriosa Santa Mônica, confiamos em vossa poderosa intercessão.

Apresentai a Deus nossos pedidos, especialmente pelas mães, pais e famílias.

Conduzi-nos sempre no caminho da fé, da esperança e da salvação.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
      },
      {
        type: "fixed",
        title: "ORACAO FINAL (TODOS OS DIAS)",
        text: `Ó Santa Mônica, modelo de perseverança, fé e amor materno, rogai por nós.

Ajudai-nos a confiar sempre em Deus e a nunca desistir daqueles que amamos.

Amém.`
      }
    ]
  }
],

[
  {
    novenaId: "novena_santo_agostinho",
    title: "NOVENA A SANTO AGOSTINHO",
    howToPray: [
      "1. Sinal da Cruz",
      "2. Oração Inicial",
      "3. Oração do dia",
      "4. Pai-Nosso",
      "5. Ave-Maria",
      "6. Glória ao Pai",
      "7. Oração Final"
    ],
    sections: [
      {
        type: "fixed",
        title: "SINAL DA CRUZ",
        text: "Em nome do Pai, do Filho e do Espírito Santo. Amém."
      },
      {
        type: "fixed",
        title: "ORACAO INICIAL (TODOS OS DIAS)",
        text: `Ó Santo Agostinho, doutor da Igreja, mestre da verdade e exemplo de conversão sincera, com confiança recorremos à vossa intercessão.

Vós que, após longa busca, encontrastes em Deus a verdade que sacia o coração humano, ajudai-nos a buscar o Senhor com sinceridade e humildade.

Concedei-nos a graça de rezar esta novena com fé sincera, para que, seguindo vosso exemplo de conversão, amor à verdade e fidelidade à Igreja, possamos alcançar as graças que necessitamos, se forem da vontade de Deus.

Amém.`
      },
      {
        type: "day",
        day: 1,
        title: "PRIMEIRO DIA – SANTO AGOSTINHO, BUSCADOR DA VERDADE",
        text: `Ó Santo Agostinho, vosso coração inquieto só encontrou descanso em Deus.

Ensinai-nos a buscar a verdade com sinceridade e perseverança.

Que nunca nos contentemos com o que nos afasta do Senhor.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
      },
      {
        type: "day",
        day: 2,
        title: "SEGUNDO DIA – SANTO AGOSTINHO, CONVERSAO DO CORACAO",
        text: `Ó Santo Agostinho, fostes transformado pela graça de Deus.

Ajudai-nos a abrir o coração à conversão sincera.

Que saibamos abandonar o pecado e escolher a vida nova em Cristo.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
      },
      {
        type: "day",
        day: 3,
        title: "TERCEIRO DIA – SANTO AGOSTINHO, FORCA DA GRAÇA DIVINA",
        text: `Ó Santo Agostinho, reconhecestes que tudo é dom da graça de Deus.

Ensinai-nos a confiar na ação da graça em nossa vida.

Que dependamos sempre do auxílio divino.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
      },
      {
        type: "day",
        day: 4,
        title: "QUARTO DIA – SANTO AGOSTINHO, AMOR A PALAVRA DE DEUS",
        text: `Ó Santo Agostinho, encontrastes na Palavra de Deus luz para vossa vida.

Ajudai-nos a amar, meditar e viver a Sagrada Escritura.

Que a Palavra do Senhor transforme nosso coração.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
      },
      {
        type: "day",
        day: 5,
        title: "QUINTO DIA – SANTO AGOSTINHO, HUMILDADE E FÉ",
        text: `Ó Santo Agostinho, aprendestes a reconhecer vossas limitações diante de Deus.

Ensinai-nos a viver com humildade e fé sincera.

Que confiemos mais em Deus do que em nós mesmos.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
      },
      {
        type: "day",
        day: 6,
        title: "SEXTO DIA – SANTO AGOSTINHO, AMOR A IGREJA",
        text: `Ó Santo Agostinho, amastes profundamente a Igreja, Corpo de Cristo.

Ajudai-nos a viver em comunhão com a Igreja e seus pastores.

Que sejamos fiéis à doutrina e à missão da Igreja.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
      },
      {
        type: "day",
        day: 7,
        title: "SETIMO DIA – SANTO AGOSTINHO, VIDA DE ORACAO",
        text: `Ó Santo Agostinho, encontrastes na oração o caminho da intimidade com Deus.

Ensinai-nos a rezar com o coração aberto e confiante.

Que nossa vida seja sustentada pela oração constante.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
      },
      {
        type: "day",
        day: 8,
        title: "OITAVO DIA – SANTO AGOSTINHO, AMOR E CARIDADE",
        text: `Ó Santo Agostinho, ensinastes que amar é o centro da vida cristã.

Ajudai-nos a viver a caridade com sinceridade e generosidade.

Que o amor seja a marca de nossas ações.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
      },
      {
        type: "day",
        day: 9,
        title: "NONO DIA – SANTO AGOSTINHO, INTERCESSOR DOS QUE BUSCAM A DEUS",
        text: `Ó glorioso Santo Agostinho, confiamos em vossa poderosa intercessão.

Apresentai a Deus nossas intenções, especialmente pelos que buscam sentido, verdade e conversão.

Conduzi-nos sempre no caminho da fé, da verdade e da salvação.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
      },
      {
        type: "fixed",
        title: "ORACAO FINAL (TODOS OS DIAS)",
        text: `Ó Santo Agostinho, doutor da graça e mestre da verdade, rogai por nós.

Ajudai-nos a buscar a Deus com todo o coração e a viver segundo o Evangelho.

Amém.`
      }
    ]
  },

  {
    novenaId: "novena_nossa_senhora_das_dores",
    title: "NOVENA DE NOSSA SENHORA DAS DORES",
    howToPray: [
      "1. Sinal da Cruz",
      "2. Oração Inicial",
      "3. Oração do dia",
      "4. Pai-Nosso",
      "5. Ave-Maria",
      "6. Glória ao Pai",
      "7. Oração Final"
    ],
    sections: [
      {
        type: "fixed",
        title: "SINAL DA CRUZ",
        text: "Em nome do Pai, do Filho e do Espírito Santo. Amém."
      },
      {
        type: "fixed",
        title: "ORACAO INICIAL (TODOS OS DIAS)",
        text: `Ó Nossa Senhora das Dores, Mãe dolorosa e cheia de amor, que permanecestes firme junto à cruz de vosso Filho, com confiança recorremos à vossa intercessão materna.

Vós que participastes intimamente da Paixão de Cristo, ensinai-nos a unir nossos sofrimentos aos de Jesus, vivendo com fé, esperança e confiança na vontade de Deus.

Concedei-nos a graça de rezar esta novena com coração sincero, para que, consolados por vossa presença materna, possamos alcançar as graças que necessitamos, se forem da vontade de Deus.

Amém.`
      },
      {
        type: "day",
        day: 1,
        title: "PRIMEIRO DIA – NOSSA SENHORA DAS DORES, MÃE QUE SOFRE COM O FILHO",
        text: `Ó Nossa Senhora das Dores, vosso coração foi transpassado ao ver o sofrimento de Jesus.

Ensinai-nos a aceitar as dores da vida unidos a Cristo.

Que saibamos confiar em Deus mesmo na dor.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
      },
      {
        type: "day",
        day: 2,
        title: "SEGUNDO DIA – NOSSA SENHORA DAS DORES, FIDELIDADE A DEUS",
        text: `Ó Mãe dolorosa, permanecestes fiel a Deus mesmo nas maiores provações.

Ajudai-nos a permanecer firmes na fé diante das dificuldades.

Que nunca nos afastemos do Senhor.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
      },
      {
        type: "day",
        day: 3,
        title: "TERCEIRO DIA – NOSSA SENHORA DAS DORES, HUMILDADE NA PROVACAO",
        text: `Ó Nossa Senhora das Dores, aceitastes com humildade o plano de Deus.

Ensinai-nos a acolher a vontade divina sem revolta.

Que nosso coração seja dócil e confiante.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
      },
      {
        type: "day",
        day: 4,
        title: "QUARTO DIA – NOSSA SENHORA DAS DORES, FORCA NO SOFRIMENTO",
        text: `Ó Mãe das Dores, encontrastes força no amor a Deus.

Ajudai-nos a encontrar sentido cristão no sofrimento.

Que nossas dores sejam oferecidas como oração.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
      },
      {
        type: "day",
        day: 5,
        title: "QUINTO DIA – NOSSA SENHORA DAS DORES, MÃE DA COMPASSAO",
        text: `Ó Nossa Senhora das Dores, sois Mãe compassiva de todos os que sofrem.

Consolai os aflitos, os doentes e os desanimados.

Que encontrem em vós amparo e consolo.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
      },
      {
        type: "day",
        day: 6,
        title: "SEXTO DIA – NOSSA SENHORA DAS DORES, UNIAO COM A CRUZ DE CRISTO",
        text: `Ó Mãe dolorosa, estivestes unida à cruz até o fim.

Ajudai-nos a carregar nossa cruz com amor e fé.

Que sejamos fortalecidos pela graça de Deus.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
      },
      {
        type: "day",
        day: 7,
        title: "SETIMO DIA – NOSSA SENHORA DAS DORES, ESPERANCA NA RESSURREICAO",
        text: `Ó Nossa Senhora das Dores, mesmo na dor, mantivestes viva a esperança.

Ajudai-nos a crer que o sofrimento não é o fim.

Que confiemos na promessa da ressurreição.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
      },
      {
        type: "day",
        day: 8,
        title: "OITAVO DIA – NOSSA SENHORA DAS DORES, MÃE DA IGREJA SOFREDORA",
        text: `Ó Mãe das Dores, acompanhais a Igreja em suas dores e perseguições.

Intercedei pelos cristãos perseguidos e sofredores.

Que a Igreja seja fortalecida na fé.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
      },
      {
        type: "day",
        day: 9,
        title: "NONO DIA – NOSSA SENHORA DAS DORES, INTERCESSORA DOS AFLITOS",
        text: `Ó gloriosa Nossa Senhora das Dores, confiamos em vossa poderosa intercessão.

Apresentai a Deus nossas dores, pedidos e necessidades.

Conduzi-nos sempre no caminho da fé, da esperança e da salvação.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
      },
      {
        type: "fixed",
        title: "ORACAO FINAL (TODOS OS DIAS)",
        text: `Ó Nossa Senhora das Dores, Mãe que sofre conosco e por nós, rogai por nós.

Ajudai-nos a unir nossas dores às de Cristo e a viver confiantes no amor de Deus.

Amém.`
      }
    ]
  }
],

[
  {
    novenaId: "novena_sao_pio_de_pietrelcina",
    title: "NOVENA DE SAO PIO DE PIETRELCINA",
    howToPray: [
      "1. Sinal da Cruz",
      "2. Oração Inicial",
      "3. Oração do dia",
      "4. Pai-Nosso",
      "5. Ave-Maria",
      "6. Glória ao Pai",
      "7. Oração Final"
    ],
    sections: [
      {
        type: "fixed",
        title: "SINAL DA CRUZ",
        text: "Em nome do Pai, do Filho e do Espírito Santo. Amém."
      },
      {
        type: "fixed",
        title: "ORACAO INICIAL (TODOS OS DIAS)",
        text: `Ó São Pio de Pietrelcina, humilde frade capuchinho, fiel imitador de Cristo crucificado e grande instrumento da misericórdia divina, com confiança recorremos à vossa poderosa intercessão.

Vós que vivestes profundamente unido à Paixão de Cristo, dedicando-vos à oração, à penitência e ao cuidado das almas, ajudai-nos a viver com fé sincera, paciência nas provações e amor a Deus e ao próximo.

Concedei-nos a graça de rezar esta novena com coração sincero, para que, por vossa intercessão, possamos crescer na fé, na conversão e alcançar as graças que necessitamos, se forem da vontade de Deus.

Amém.`
      },
      {
        type: "day",
        day: 1,
        title: "PRIMEIRO DIA – SAO PIO, HOMEM DE FÉ PROFUNDA",
        text: `Ó São Pio de Pietrelcina, vivestes uma fé firme e confiante em Deus.

Ensinai-nos a confiar no Senhor em todas as circunstâncias da vida.

Que nossa fé seja viva e perseverante.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
      },
      {
        type: "day",
        day: 2,
        title: "SEGUNDO DIA – SAO PIO, AMOR A ORACAO",
        text: `Ó São Pio, fizestes da oração o centro de vossa vida.

Ajudai-nos a buscar a Deus na oração constante e confiante.

Que encontremos na oração força e paz.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
      },
      {
        type: "day",
        day: 3,
        title: "TERCEIRO DIA – SAO PIO, UNIAO COM A PAIXAO DE CRISTO",
        text: `Ó São Pio, participastes intimamente dos sofrimentos de Cristo.

Ensinai-nos a oferecer nossas dores unidas à cruz do Senhor.

Que saibamos transformar o sofrimento em amor.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
      },
      {
        type: "day",
        day: 4,
        title: "QUARTO DIA – SAO PIO, AMOR AO SACRAMENTO DA CONFISSAO",
        text: `Ó São Pio, dedicastes longas horas ao confessionário, reconciliando as almas com Deus.

Ajudai-nos a valorizar o sacramento da Confissão.

Que busquemos sempre a misericórdia divina.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
      },
      {
        type: "day",
        day: 5,
        title: "QUINTO DIA – SAO PIO, HUMILDADE E OBEDIENCIA",
        text: `Ó São Pio, mesmo diante das incompreensões, permanecestes humilde e obediente.

Ensinai-nos a viver com humildade e confiança na vontade de Deus.

Que saibamos aceitar Suas decisões com amor.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
      },
      {
        type: "day",
        day: 6,
        title: "SEXTO DIA – SAO PIO, AMOR A EUCARISTIA",
        text: `Ó São Pio, celebrastes a Santa Missa com profunda devoção.

Ajudai-nos a reconhecer a presença real de Cristo na Eucaristia.

Que nossa participação na Missa fortaleça nossa fé.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
      },
      {
        type: "day",
        day: 7,
        title: "SETIMO DIA – SAO PIO, PACIENCIA NAS PROVACOES",
        text: `Ó São Pio, suportastes doenças e perseguições com paciência e fé.

Ensinai-nos a aceitar as provações da vida confiando em Deus.

Que nunca percamos a esperança.

(Pedido pessoal)

Pai-Nos-so
Ave-Maria
Glória ao Pai`
      },
      {
        type: "day",
        day: 8,
        title: "OITAVO DIA – SAO PIO, CARIDADE PARA COM O PROXIMO",
        text: `Ó São Pio, dedicastes vossa vida ao cuidado espiritual e material dos necessitados.

Ajudai-nos a viver a caridade com gestos concretos de amor.

Que sejamos instrumentos da misericórdia divina.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
      },
      {
        type: "day",
        day: 9,
        title: "NONO DIA – SAO PIO, INTERCESSOR PODEROSO",
        text: `Ó glorioso São Pio de Pietrelcina, confiamos em vossa poderosa intercessão.

Apresentai a Deus nossas intenções, necessidades e pedidos.

Conduzi-nos sempre no caminho da fé, da conversão e da salvação.

(Pedido pessoal)

Pai-NosSo
Ave-Maria
Glória ao Pai`
      },
      {
        type: "fixed",
        title: "ORACAO FINAL (TODOS OS DIAS)",
        text: `Ó São Pio de Pietrelcina, fiel seguidor de Cristo crucificado, rogai por nós.

Ajudai-nos a viver na fé, na oração e na confiança na misericórdia de Deus.

Amém.`
      }
    ]
  },

  {
    novenaId: "novena_sao_vicente_de_paulo",
    title: "NOVENA DE SAO VICENTE DE PAULO",
    howToPray: [
      "1. Sinal da Cruz",
      "2. Oração Inicial",
      "3. Oração do dia",
      "4. Pai-Nosso",
      "5. Ave-Maria",
      "6. Glória ao Pai",
      "7. Oração Final"
    ],
    sections: [
      {
        type: "fixed",
        title: "SINAL DA CRUZ",
        text: "Em nome do Pai, do Filho e do Espírito Santo. Amém."
      },
      {
        type: "fixed",
        title: "ORACAO INICIAL (TODOS OS DIAS)",
        text: `Ó São Vicente de Paulo, apóstolo da caridade e servo fiel dos pobres, com confiança recorremos à vossa poderosa intercessão.

Vós que dedicastes toda a vossa vida ao serviço dos necessitados, dos doentes e abandonados, ensinai-nos a reconhecer Cristo nos pobres e a servir com amor sincero e coração generoso.

Concedei-nos a graça de rezar esta novena com fé sincera, para que, por vossa intercessão, possamos crescer na caridade, na humildade e alcançar as graças que necessitamos, se forem da vontade de Deus.

Amém.`
      },
      {
        type: "day",
        day: 1,
        title: "PRIMEIRO DIA – SAO VICENTE DE PAULO, AMOR AOS POBRES",
        text: `Ó São Vicente de Paulo, vossa vida foi marcada pelo amor aos pobres e sofredores.

Ensinai-nos a amar e servir os mais necessitados.

Que nossa caridade seja concreta e sincera.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
      },
      {
        type: "day",
        day: 2,
        title: "SEGUNDO DIA – SAO VICENTE DE PAULO, CORACAO COMPASSIVO",
        text: `Ó São Vicente de Paulo, vosso coração se comoveu diante da miséria humana.

Ajudai-nos a ter um coração sensível às dores do próximo.

Que saibamos agir movidos pela compaixão.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
      },
      {
        type: "day",
        day: 3,
        title: "TERCEIRO DIA – SAO VICENTE DE PAULO, SERVICO DESINTERESSADO",
        text: `Ó São Vicente de Paulo, servistes sem buscar reconhecimento ou recompensa.

Ensinai-nos a servir com humildade e desapego.

Que façamos o bem por amor a Deus.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
      },
      {
        type: "day",
        day: 4,
        title: "QUARTO DIA – SAO VICENTE DE PAULO, FÉ QUE SE TORNA CARIDADE",
        text: `Ó São Vicente de Paulo, vossa fé se manifestou em obras de amor.

Ajudai-nos a viver uma fé viva, expressa em gestos concretos.

Que nossas ações testemunhem o Evangelho.

(Pedido pessoal)

Pai-Nos-so
Ave-Maria
Glória ao Pai`
      },
      {
        type: "day",
        day: 5,
        title: "QUINTO DIA – SAO VICENTE DE PAULO, ZELO PELA IGREJA",
        text: `Ó São Vicente de Paulo, trabalhastes com amor pela renovação da Igreja.

Intercedei pelos sacerdotes, religiosos e leigos.

Que todos sirvam a Deus com fidelidade e caridade.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
      },
      {
        type: "day",
        day: 6,
        title: "SEXTO DIA – SAO VICENTE DE PAULO, HUMILDADE E SIMPLICIDADE",
        text: `Ó São Vicente de Paulo, vivestes com humildade e simplicidade evangélica.

Ensinai-nos a rejeitar o orgulho e a vaidade.

Que vivamos com coração simples e confiante em Deus.

(Pedido pessoal)

Pai-NosSo
Ave-Maria
Glória ao Pai`
      },
      {
        type: "day",
        day: 7,
        title: "SETIMO DIA – SAO VICENTE DE PAULO, CONFIANCA NA PROVIDENCIA",
        text: `Ó São Vicente de Paulo, confiastes sempre na providência divina.

Ajudai-nos a entregar nossas preocupações ao Senhor.

Que nunca percamos a esperança em Deus.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
      },
      {
        type: "day",
        day: 8,
        title: "OITAVO DIA – SAO VICENTE DE PAULO, EDUCADOR NA CARIDADE",
        text: `Ó São Vicente de Paulo, ensinastes muitos a servir os pobres com amor.

Ajudai-nos a formar corações generosos e solidários.

Que sejamos exemplos de caridade cristã.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
      },
      {
        type: "day",
        day: 9,
        title: "NONO DIA – SAO VICENTE DE PAULO, INTERCESSOR DOS NECESSITADOS",
        text: `Ó glorioso São Vicente de Paulo, confiamos em vossa poderosa intercessão.

Apresentai a Deus nossas intenções, especialmente pelos pobres, doentes e abandonados.

Conduzi-nos sempre no caminho da caridade, da fé e da salvação.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
      },
      {
        type: "fixed",
        title: "ORACAO FINAL (TODOS OS DIAS)",
        text: `Ó São Vicente de Paulo, apóstolo da caridade e pai dos pobres, rogai por nós.

Ajudai-nos a servir a Cristo presente nos necessitados, vivendo o Evangelho com amor e generosidade.

Amém.`
      }
    ]
  }
],
[
  {
    novenaId: "novena_santos_arcanjos",
    title: "NOVENA AOS SANTOS ARCANJOS (SAO MIGUEL, SAO GABRIEL E SAO RAFAEL)",
    howToPray: [
      "1. Sinal da Cruz",
      "2. Oração Inicial",
      "3. Oração do dia",
      "4. Pai-Nosso",
      "5. Ave-Maria",
      "6. Glória ao Pai",
      "7. Oração Final"
    ],
    sections: [
      {
        type: "fixed",
        title: "SINAL DA CRUZ",
        text: "Em nome do Pai, do Filho e do Espírito Santo. Amém."
      },
      {
        type: "fixed",
        title: "ORACAO INICIAL (TODOS OS DIAS)",
        text: `Ó gloriosos Santos Arcanjos Miguel, Gabriel e Rafael, fiéis servos de Deus e mensageiros da Sua vontade, com confiança recorremos à vossa poderosa intercessão.

Vós que estais sempre diante do trono do Altíssimo, combatendo o mal, anunciando a Palavra de Deus e trazendo cura e proteção aos homens, ajudai-nos a viver segundo a vontade divina.

Concedei-nos a graça de rezar esta novena com fé sincera, para que, protegidos por vossa intercessão, possamos caminhar firmes na fé e alcançar as graças que necessitamos, se forem da vontade de Deus.

Amém.`
      },
      {
        type: "day",
        day: 1,
        title: "PRIMEIRO DIA – SAO MIGUEL ARCANJO, DEFENSOR DA FÉ",
        text: `Ó São Miguel Arcanjo, príncipe da milícia celeste, defensor do povo de Deus.

Protegei-nos contra as ciladas do inimigo e fortalecei-nos no combate espiritual.

Que sejamos firmes na fé e fiéis ao Senhor.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
      },
      {
        type: "day",
        day: 2,
        title: "SEGUNDO DIA – SAO MIGUEL ARCANJO, PROTETOR CONTRA O MAL",
        text: `Ó São Miguel Arcanjo, vencedor do mal e guardião da Igreja.

Livrai-nos de todo perigo espiritual e material.

Que confiemos sempre na proteção de Deus.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
      },
      {
        type: "day",
        day: 3,
        title: "TERCEIRO DIA – SAO GABRIEL ARCANJO, MENSAGEIRO DE DEUS",
        text: `Ó São Gabriel Arcanjo, mensageiro fiel dos desígnios divinos.

Ajudai-nos a escutar a voz de Deus e acolher Sua Palavra com fé.

Que saibamos dizer sim à vontade do Senhor.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
      },
      {
        type: "day",
        day: 4,
        title: "QUARTO DIA – SAO GABRIEL ARCANJO, ANUNCIADOR DA SALVACAO",
        text: `Ó São Gabriel Arcanjo, anunciastes à Virgem Maria o mistério da Encarnação.

Ajudai-nos a viver com alegria o Evangelho da salvação.

Que Cristo seja anunciado por nossa vida.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
      },
      {
        type: "day",
        day: 5,
        title: "QUINTO DIA – SAO RAFAEL ARCANJO, MEDICINA DE DEUS",
        text: `Ó São Rafael Arcanjo, companheiro dos que caminham e curador dos enfermos.

Intercedei por todos os doentes do corpo e da alma.

Concedei-nos saúde, força e esperança.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
      },
      {
        type: "day",
        day: 6,
        title: "SEXTO DIA – SAO RAFAEL ARCANJO, GUIA DOS CAMINHANTES",
        text: `Ó São Rafael Arcanjo, que conduzistes Tobias em segurança.

Guii-nos em nossos caminhos e decisões.

Que trilhemos sempre o caminho do bem e da verdade.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
      },
      {
        type: "day",
        day: 7,
        title: "SETIMO DIA – SANTOS ARCANJOS, SERVOS DA VONTADE DE DEUS",
        text: `Ó gloriosos Arcanjos, sempre prontos a cumprir as ordens do Senhor.

Ensinai-nos a viver na obediência e na fidelidade a Deus.

Que nossa vida seja serviço e louvor ao Senhor.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
      },
      {
        type: "day",
        day: 8,
        title: "OITAVO DIA – SANTOS ARCANJOS, PROTETORES DO POVO DE DEUS",
        text: `Ó Santos Arcanjos, guardiães dos lares, da Igreja e das nações.

Protegei nossas famílias e comunidades.

Que vivamos sob a guarda e a paz de Deus.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
      },
      {
        type: "day",
        day: 9,
        title: "NONO DIA – SANTOS ARCANJOS, INTERCESSORES PODEROSOS",
        text: `Ó gloriosos Santos Arcanjos Miguel, Gabriel e Rafael, confiamos em vossa poderosa intercessão.

Apresentai a Deus nossas intenções, necessidades e pedidos.

Conduzi-nos sempre no caminho da fé, da proteção e da salvação.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
      },
      {
        type: "fixed",
        title: "ORACAO FINAL (TODOS OS DIAS)",
        text: `Ó Santos Arcanjos Miguel, Gabriel e Rafael, servos fiéis do Altíssimo, rogai por nós.

Protegei-nos, iluminai-nos e conduzi-nos sempre segundo a vontade de Deus.

Amém.`
      }
    ]
  },

  {
    novenaId: "novena_santa_teresinha_do_menino_jesus",
    title: "NOVENA DE SANTA TERESINHA DO MENINO JESUS",
    howToPray: [
      "1. Sinal da Cruz",
      "2. Oração Inicial",
      "3. Oração do dia",
      "4. Pai-Nosso",
      "5. Ave-Maria",
      "6. Glória ao Pai",
      "7. Oração Final"
    ],
    sections: [
      {
        type: "fixed",
        title: "SINAL DA CRUZ",
        text: "Em nome do Pai, do Filho e do Espírito Santo. Amém."
      },
      {
        type: "fixed",
        title: "ORACAO INICIAL (TODOS OS DIAS)",
        text: `Ó Santa Teresinha do Menino Jesus e da Sagrada Face, pequena grande santa do amor, doutora da Igreja e missionária do coração de Deus, com confiança recorremos à vossa intercessão.

Vós que ensinastes o caminho da pequena via espiritual, feito de simplicidade, confiança e amor total a Deus, ajudai-nos a viver cada dia oferecendo pequenas coisas com grande amor.

Concedei-nos a graça de rezar esta novena com fé sincera, para que, seguindo vosso exemplo de humildade e abandono em Deus, possamos alcançar as graças que necessitamos, se forem da vontade divina.

Amém.`
      },
      {
        type: "day",
        day: 1,
        title: "PRIMEIRO DIA – SANTA TERESINHA, CAMINHO DA PEQUENA VIA",
        text: `Ó Santa Teresinha, ensinastes que a santidade está nas pequenas coisas feitas com amor.

Ajudai-nos a viver a pequena via no dia a dia.

Que saibamos amar nas coisas simples.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
      },
      {
        type: "day",
        day: 2,
        title: "SEGUNDO DIA – SANTA TERESINHA, CONFIANCA FILIAL EM DEUS",
        text: `Ó Santa Teresinha, vivestes como uma criança nos braços do Pai.

Ensinai-nos a confiar plenamente em Deus.

Que abandonemos nossas preocupações em Suas mãos.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
      },
      {
        type: "day",
        day: 3,
        title: "TERCEIRO DIA – SANTA TERESINHA, AMOR A ORACAO",
        text: `Ó Santa Teresinha, fizestes da oração um diálogo simples e sincero com Deus.

Ajudai-nos a rezar com o coração.

Que nossa oração seja expressão de amor.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
      },
      {
        type: "day",
        day: 4,
        title: "QUARTO DIA – SANTA TERESINHA, HUMILDADE E SIMPLICIDADE",
        text: `Ó Santa Teresinha, escolhestes o caminho da humildade e do esquecimento de si.

Ensinai-nos a vencer o orgulho e a vaidade.

Que vivamos com coração simples.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
      },
      {
        type: "day",
        day: 5,
        title: "QUINTO DIA – SANTA TERESINHA, AMOR AOS IRMAOS",
        text: `Ó Santa Teresinha, amastes intensamente vossas irmãs com gestos simples.

Ajudai-nos a viver a caridade no cotidiano.

Que nosso amor seja paciente e verdadeiro.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
      },
      {
        type: "day",
        day: 6,
        title: "SEXTO DIA – SANTA TERESINHA, CONFIANCA NA MISERICORDIA",
        text: `Ó Santa Teresinha, confiastes totalmente na misericórdia de Deus.

Ensinai-nos a esperar tudo do amor divino.

Que nunca percamos a esperança.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
      },
      {
        type: "day",
        day: 7,
        title: "SETIMO DIA – SANTA TERESINHA, SOFRIMENTO OFERECIDO COM AMOR",
        text: `Ó Santa Teresinha, oferecestes vossos sofrimentos com alegria e amor.

Ajudai-nos a unir nossas dores a Cristo.

Que saibamos sofrer com fé.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
      },
      {
        type: "day",
        day: 8,
        title: "OITAVO DIA – SANTA TERESINHA, ZELO MISSIONARIO",
        text: `Ó Santa Teresinha, mesmo no claustro, fostes missionária pelo amor.

Despertai em nós o desejo de anunciar Cristo.

Que sejamos missionários no coração.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
      },
      {
        type: "day",
        day: 9,
        title: "NONO DIA – SANTA TERESINHA, CHUVA DE ROSAS",
        text: `Ó gloriosa Santa Teresinha, prometestes passar o céu fazendo o bem na terra.

Intercedei por nós junto a Deus.

Concedei-nos as graças que confiantes vos pedimos.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
      },
      {
        type: "fixed",
        title: "ORACAO FINAL (TODOS OS DIAS)",
        text: `Ó Santa Teresinha do Menino Jesus, doutora do amor e da confiança em Deus, rogai por nós.

Ajudai-nos a viver a pequena via, confiantes no amor misericordioso do Pai.

Amém.`
      }
    ]
  }
],

[
  {
    novenaId: "novena_sao_francisco_de_assis",
    title: "NOVENA DE SAO FRANCISCO DE ASSIS",
    howToPray: [
      "1. Sinal da Cruz",
      "2. Oração Inicial",
      "3. Oração do dia",
      "4. Pai-Nosso",
      "5. Ave-Maria",
      "6. Glória ao Pai",
      "7. Oração Final"
    ],
    sections: [
      {
        type: "fixed",
        title: "SINAL DA CRUZ",
        text: "Em nome do Pai, do Filho e do Espírito Santo. Amém."
      },
      {
        type: "fixed",
        title: "ORACAO INICIAL (TODOS OS DIAS)",
        text: `Ó São Francisco de Assis, pobre de Cristo, servo humilde e alegre do Evangelho, exemplo de amor a Deus, aos irmãos e a toda a criação, com confiança recorremos à vossa poderosa intercessão.

Vós que renunciastes a tudo para seguir fielmente a Jesus, vivendo na pobreza, na simplicidade e na perfeita alegria, ajudai-nos a desapegar o coração das coisas passageiras e a buscar somente a vontade de Deus.

Concedei-nos a graça de rezar esta novena com fé sincera, para que, seguindo vosso exemplo de humildade, caridade e paz, possamos alcançar as graças que necessitamos, se forem da vontade de Deus.

Amém.`
      },
      {
        type: "day",
        day: 1,
        title: "PRIMEIRO DIA – SAO FRANCISCO DE ASSIS, CHAMADO A CONVERSAO",
        text: `Ó São Francisco, ouvistes o chamado de Cristo a reconstruir a Sua Igreja.

Ensinai-nos a escutar a voz do Senhor e a converter nosso coração.

Que nossa vida seja resposta fiel ao Evangelho.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
      },
      {
        type: "day",
        day: 2,
        title: "SEGUNDO DIA – SAO FRANCISCO DE ASSIS, AMOR A POBREZA",
        text: `Ó São Francisco, escolhestes a pobreza como caminho de liberdade e união com Cristo.

Ajudai-nos a viver com simplicidade e desapego.

Que nosso coração seja rico apenas do amor de Deus.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
      },
      {
        type: "day",
        day: 3,
        title: "TERCEIRO DIA – SAO FRANCISCO DE ASSIS, HUMILDADE E OBEDIENCIA",
        text: `Ó São Francisco, vivestes na humildade e na obediência à vontade de Deus.

Ensinai-nos a vencer o orgulho e a confiar plenamente no Senhor.

Que saibamos obedecer com amor.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
      },
      {
        type: "day",
        day: 4,
        title: "QUARTO DIA – SAO FRANCISCO DE ASSIS, AMOR A CRIACAO",
        text: `Ó São Francisco, reconhecestes em todas as criaturas sinais do amor de Deus.

Ajudai-nos a cuidar da criação com respeito e gratidão.

Que saibamos louvar a Deus por todas as Suas obras.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
      },
      {
        type: "day",
        day: 5,
        title: "QUINTO DIA – SAO FRANCISCO DE ASSIS, AMOR AOS IRMAOS",
        text: `Ó São Francisco, amastes a todos sem distinção, especialmente os pobres e sofredores.

Ensinai-nos a viver a fraternidade e a caridade sincera.

Que vejamos Cristo em cada irmão.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
      },
      {
        type: "day",
        day: 6,
        title: "SEXTO DIA – SAO FRANCISCO DE ASSIS, VIDA DE ORACAO",
        text: `Ó São Francisco, encontrastes na oração a força para viver o Evangelho.

Ajudai-nos a cultivar uma vida de oração simples e profunda.

Que nossa intimidade com Deus sustente nossa caminhada.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
      },
      {
        type: "day",
        day: 7,
        title: "SETIMO DIA – SAO FRANCISCO DE ASSIS, PAZ E PERDAO",
        text: `Ó São Francisco, fostes instrumento da paz e do perdão de Deus.

Ensinai-nos a promover a paz onde houver discórdia.

Que sejamos construtores da reconciliação.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
      },
      {
        type: "day",
        day: 8,
        title: "OITAVO DIA – SAO FRANCISCO DE ASSIS, ALEGRIA NO SENHOR",
        text: `Ó São Francisco, vivestes a verdadeira alegria mesmo nas dificuldades.

Ajudai-nos a encontrar nossa alegria em Deus.

Que vivamos a perfeita alegria cristã.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
      },
      {
        type: "day",
        day: 9,
        title: "NONO DIA – SAO FRANCISCO DE ASSIS, CONFORME A CRISTO",
        text: `Ó glorioso São Francisco de Assis, fostes profundamente unido a Cristo crucificado.

Intercedei por nós para que vivamos configurados a Jesus.

Conduzi-nos sempre no caminho da fé, da caridade e da salvação.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
      },
      {
        type: "fixed",
        title: "ORACAO FINAL (TODOS OS DIAS)",
        text: `Ó São Francisco de Assis, servo fiel e amigo de Deus, rogai por nós.

Ajudai-nos a viver o Evangelho com simplicidade, amor e paz.

Amém.`
      }
    ]
  },

  {
    novenaId: "novena_nossa_senhora_aparecida",
    title: "NOVENA A NOSSA SENHORA APARECIDA",
    howToPray: [
      "1. Sinal da Cruz",
      "2. Oração Inicial",
      "3. Oração do dia",
      "4. Pai-Nosso",
      "5. Ave-Maria",
      "6. Glória ao Pai",
      "7. Oração Final"
    ],
    sections: [
      {
        type: "fixed",
        title: "SINAL DA CRUZ",
        text: "Em nome do Pai, do Filho e do Espírito Santo. Amém."
      },
      {
        type: "fixed",
        title: "ORACAO INICIAL (TODOS OS DIAS)",
        text: `Ó Nossa Senhora Aparecida, Mãe querida do povo brasileiro, escolhida por Deus para manifestar Seu amor aos simples e humildes, com confiança recorremos à vossa intercessão materna.

Vós que aparecestes nas águas do rio Paraíba, trazendo esperança e fé ao vosso povo, ajudai-nos a confiar sempre na providência divina e a viver como verdadeiros filhos de Deus.

Concedei-nos a graça de rezar esta novena com fé sincera, para que, sob vossa proteção materna, possamos crescer na fé, na esperança e no amor, e alcançar as graças que necessitamos, se forem da vontade de Deus.

Amém.`
      },
      {
        type: "day",
        day: 1,
        title: "PRIMEIRO DIA – NOSSA SENHORA APARECIDA, MÃE DO POVO BRASILEIRO",
        text: `Ó Nossa Senhora Aparecida, sois a Mãe querida e padroeira do Brasil.

Acolhei sob vosso manto protetor todo o povo brasileiro.

Que vivamos unidos na fé e na esperança.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
      },
      {
        type: "day",
        day: 2,
        title: "SEGUNDO DIA – NOSSA SENHORA APARECIDA, MÃE DOS HUMILDES",
        text: `Ó Mãe Aparecida, escolhestes manifestar-vos aos simples pescadores.

Ensinai-nos a viver com humildade e confiança em Deus.

Que saibamos reconhecer as maravilhas do Senhor.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
      },
      {
        type: "day",
        day: 3,
        title: "TERCEIRO DIA – NOSSA SENHORA APARECIDA, MÃE DA ESPERANCA",
        text: `Ó Nossa Senhora Aparecida, renovais a esperança dos que sofrem.

Consolai os aflitos e fortalecei os desanimados.

Que nunca percamos a esperança em Deus.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
      },
      {
        type: "day",
        day: 4,
        title: "QUARTO DIA – NOSSA SENHORA APARECIDA, MÃE QUE INTERCEDE",
        text: `Ó Mãe Aparecida, intercedei por nós junto a vosso Filho Jesus.

Apresentai a Ele nossas necessidades e pedidos.

Que confiemos sempre em vossa intercessão materna.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
      },
      {
        type: "day",
        day: 5,
        title: "QUINTO DIA – NOSSA SENHORA APARECIDA, MÃE DA FAMILIA",
        text: `Ó Nossa Senhora Aparecida, protegei nossas famílias.

Ajudai-nos a viver no amor, no perdão e na união.

Que nossos lares sejam lugares de fé e oração.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
      },
      {
        type: "day",
        day: 6,
        title: "SEXTO DIA – NOSSA SENHORA APARECIDA, MÃE DOS POBRES E AFLITOS",
        text: `Ó Mãe Aparecida, estais sempre ao lado dos pobres e sofredores.

Consolai os doentes, os desempregados e os abandonados.

Que encontrem em vós conforto e esperança.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
      },
      {
        type: "day",
        day: 7,
        title: "SETIMO DIA – NOSSA SENHORA APARECIDA, MÃE DA IGREJA",
        text: `Ó Nossa Senhora Aparecida, acompanhai a Igreja em sua missão evangelizadora.

Intercedei pelo Papa, pelos bispos, sacerdotes e por todo o povo de Deus.

Que a Igreja seja fiel ao Evangelho.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
      },
      {
        type: "day",
        day: 8,
        title: "OITAVO DIA – NOSSA SENHORA APARECIDA, MÃE DA PAZ",
        text: `Ó Mãe Aparecida, trazei a paz aos nossos corações, famílias e à nossa nação.

Ajudai-nos a viver na justiça, na fraternidade e no amor.

Que sejamos construtores da paz.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
      },
      {
        type: "day",
        day: 9,
        title: "NONO DIA – NOSSA SENHORA APARECIDA, INTERCESSORA PODEROSA",
        text: `Ó gloriosa Nossa Senhora Aparecida, confiamos em vossa poderosa intercessão.

Apresentai a Deus nossas intenções, necessidades e pedidos.

Conduzi-nos sempre no caminho da fé, da esperança e da salvação.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
      },
      {
        type: "fixed",
        title: "ORACAO FINAL (TODOS OS DIAS)",
        text: `Ó Nossa Senhora Aparecida, Mãe amada e padroeira do Brasil, rogai por nós.

Ajudai-nos a viver como verdadeiros filhos de Deus, firmes na fé, na esperança e no amor.

Amém.`
      }
    ]
  }
],
[
  {
    novenaId: "novena_santa_edwiges",
    title: "NOVENA DE SANTA EDWIGES",
    howToPray: [
      "1. Sinal da Cruz",
      "2. Oração Inicial",
      "3. Oração do dia",
      "4. Pai-Nosso",
      "5. Ave-Maria",
      "6. Glória ao Pai",
      "7. Oração Final"
    ],
    sections: [
      {
        type: "fixed",
        title: "SINAL DA CRUZ",
        text: "Em nome do Pai, do Filho e do Espírito Santo. Amém."
      },
      {
        type: "fixed",
        title: "ORACAO INICIAL (TODOS OS DIAS)",
        text: `Ó Santa Edwiges, mulher de profunda fé, caridade e humildade, exemplo de confiança total em Deus mesmo nas dificuldades materiais, com confiança recorremos à vossa poderosa intercessão.

Vós que soubestes administrar com sabedoria os bens terrenos, colocando-os a serviço dos pobres e necessitados, ensinai-nos a viver com desprendimento, fé e confiança na providência divina.

Concedei-nos a graça de rezar esta novena com fé sincera, para que, seguindo vosso exemplo de amor a Deus e ao próximo, possamos alcançar as graças que necessitamos, se forem da vontade de Deus.

Amém.`
      },
      {
        type: "day",
        day: 1,
        title: "PRIMEIRO DIA – SANTA EDWIGES, EXEMPLO DE FÉ",
        text: `Ó Santa Edwiges, mesmo cercada de riquezas, escolhestes viver com o coração voltado para Deus.

Ensinai-nos a colocar nossa confiança no Senhor acima de todas as coisas.

Que nossa fé seja firme e verdadeira.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
      },
      {
        type: "day",
        day: 2,
        title: "SEGUNDO DIA – SANTA EDWIGES, DESAPEGO DOS BENS MATERIAIS",
        text: `Ó Santa Edwiges, soubestes usar os bens materiais para a glória de Deus e o bem dos irmãos.

Ajudai-nos a não nos prender às riquezas passageiras.

Que nosso tesouro esteja no céu.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
      },
      {
        type: "day",
        day: 3,
        title: "TERCEIRO DIA – SANTA EDWIGES, CARIDADE PARA COM OS POBRES",
        text: `Ó Santa Edwiges, dedicastes vossa vida ao cuidado dos pobres, doentes e endividados.

Ensinai-nos a praticar a caridade concreta e generosa.

Que vejamos Cristo nos necessitados.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
      },
      {
        type: "day",
        day: 4,
        title: "QUARTO DIA – SANTA EDWIGES, CONFIANCA NA PROVIDENCIA",
        text: `Ó Santa Edwiges, mesmo nas dificuldades, confiastes plenamente na providência divina.

Ajudai-nos a entregar nossas preocupações nas mãos de Deus.

Que nunca nos falte a esperança.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
      },
      {
        type: "day",
        day: 5,
        title: "QUINTO DIA – SANTA EDWIGES, HUMILDADE DE CORACAO",
        text: `Ó Santa Edwiges, apesar de vossa posição, vivestes com humildade e simplicidade.

Ensinai-nos a vencer o orgulho e a viver com coração simples.

Que saibamos servir com amor.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
      },
      {
        type: "day",
        day: 6,
        title: "SEXTO DIA – SANTA EDWIGES, FORTALEZA NAS PROVACOES",
        text: `Ó Santa Edwiges, suportastes perdas, sofrimentos e incompreensões com fé.

Ajudai-nos a enfrentar as provações unidos a Cristo.

Que sejamos fortalecidos pela graça de Deus.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
      },
      {
        type: "day",
        day: 7,
        title: "SETIMO DIA – SANTA EDWIGES, MODELO DE VIDA FAMILIAR",
        text: `Ó Santa Edwiges, vivestes com dedicação à família e à fé cristã.

Intercedei por nossas famílias, para que vivam na união, no amor e na confiança em Deus.

Que nossos lares sejam abençoados.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
      },
      {
        type: "day",
        day: 8,
        title: "OITAVO DIA – SANTA EDWIGES, PROTETORA DOS NECESSITADOS",
        text: `Ó Santa Edwiges, sois invocada como protetora dos pobres e endividados.

Intercedei por todos os que enfrentam dificuldades financeiras.

Concedei-nos equilíbrio, paz e confiança em Deus.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
      },
      {
        type: "day",
        day: 9,
        title: "NONO DIA – SANTA EDWIGES, INTERCESSORA PODEROSA",
        text: `Ó gloriosa Santa Edwiges, confiamos em vossa poderosa intercessão.

Apresentai a Deus nossas intenções, necessidades e pedidos.

Conduzi-nos sempre no caminho da fé, da caridade e da salvação.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
      },
      {
        type: "fixed",
        title: "ORACAO FINAL (TODOS OS DIAS)",
        text: `Ó Santa Edwiges, exemplo de fé, caridade e confiança na providência divina, rogai por nós.

Ajudai-nos a viver com desapego, generosidade e confiança em Deus em todas as circunstâncias da vida.

Amém.`
      }
    ]
  },

  {
    novenaId: "novena_sao_geraldo_majella",
    title: "NOVENA DE SAO GERALDO MAJELLA",
    howToPray: [
      "1. Sinal da Cruz",
      "2. Oração Inicial",
      "3. Oração do dia",
      "4. Pai-Nosso",
      "5. Ave-Maria",
      "6. Glória ao Pai",
      "7. Oração Final"
    ],
    sections: [
      {
        type: "fixed",
        title: "SINAL DA CRUZ",
        text: "Em nome do Pai, do Filho e do Espírito Santo. Amém."
      },
      {
        type: "fixed",
        title: "ORACAO INICIAL (TODOS OS DIAS)",
        text: `Ó São Geraldo Majella, humilde religioso redentorista, exemplo de obediência, pureza e amor total a Deus, com confiança recorremos à vossa poderosa intercessão.

Vós que aceitastes com alegria a vontade divina em todas as circunstâncias da vida e vos tornastes auxílio especial dos pobres, das famílias e das mães, ajudai-nos a viver com fé simples, coração obediente e confiança na providência de Deus.

Concedei-nos a graça de rezar esta novena com fé sincera, para que, por vossa intercessão, possamos crescer na santidade e alcançar as graças que necessitamos, se forem da vontade de Deus.

Amém.`
      },
      {
        type: "day",
        day: 1,
        title: "PRIMEIRO DIA – SAO GERALDO MAJELLA, AMOR A VONTADE DE DEUS",
        text: `Ó São Geraldo Majella, fizestes da vontade de Deus a regra de toda a vossa vida.

Ensinai-nos a aceitar os planos do Senhor com confiança e alegria.

Que saibamos dizer sempre: seja feita a vontade de Deus.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
      },
      {
        type: "day",
        day: 2,
        title: "SEGUNDO DIA – SAO GERALDO MAJELLA, EXEMPLO DE OBEDIENCIA",
        text: `Ó São Geraldo, vivestes em perfeita obediência, mesmo nas pequenas coisas.

Ajudai-nos a viver com coração dócil e obediente.

Que saibamos servir a Deus com humildade.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
      },
      {
        type: "day",
        day: 3,
        title: "TERCEIRO DIA – SAO GERALDO MAJELLA, HUMILDADE E SIMPLICIDADE",
        text: `Ó São Geraldo, escolhestes o caminho da humildade e da simplicidade.

Ensinai-nos a vencer o orgulho e a vaidade.

Que nossa vida seja simples e agradável a Deus.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
      },
      {
        type: "day",
        day: 4,
        title: "QUARTO DIA – SAO GERALDO MAJELLA, CONFIANCA NA PROVIDENCIA",
        text: `Ó São Geraldo, confiastes plenamente na providência divina.

Ajudai-nos a entregar nossas preocupações nas mãos de Deus.

Que nunca nos falte a esperança.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
      },
      {
        type: "day",
        day: 5,
        title: "QUINTO DIA – SAO GERALDO MAJELLA, AMOR A ORACAO",
        text: `Ó São Geraldo, fizestes da oração a força de vossa vida espiritual.

Ensinai-nos a rezar com fé, simplicidade e perseverança.

Que nossa oração seja sincera e confiante.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
      },
      {
        type: "day",
        day: 6,
        title: "SEXTO DIA – SAO GERALDO MAJELLA, PACIENCIA NAS PROVACOES",
        text: `Ó São Geraldo, suportastes doenças e dificuldades com paciência e fé.

Ajudai-nos a aceitar as provações unidos a Cristo.

Que saibamos oferecer nossos sofrimentos a Deus.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
      },
      {
        type: "day",
        day: 7,
        title: "SETIMO DIA – SAO GERALDO MAJELLA, AMOR AO PROXIMO",
        text: `Ó São Geraldo, vossa vida foi marcada pela caridade e atenção aos necessitados.

Ensinai-nos a amar o próximo com gestos concretos.

Que sejamos instrumentos do amor de Deus.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
      },
      {
        type: "day",
        day: 8,
        title: "OITAVO DIA – SAO GERALDO MAJELLA, PROTETOR DAS MÃES E DAS FAMILIAS",
        text: `Ó São Geraldo Majella, sois conhecido como protetor das mães e das famílias.

Intercedei pelas gestantes, crianças e lares cristãos.

Que nossas famílias vivam na fé, no amor e na confiança em Deus.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
      },
      {
        type: "day",
        day: 9,
        title: "NONO DIA – SAO GERALDO MAJELLA, INTERCESSOR PODEROSO",
        text: `Ó glorioso São Geraldo Majella, confiamos em vossa poderosa intercessão.

Apresentai a Deus nossas intenções, necessidades e pedidos.

Conduzi-nos sempre no caminho da fé, da obediência e da salvação.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
      },
      {
        type: "fixed",
        title: "ORACAO FINAL (TODOS OS DIAS)",
        text: `Ó São Geraldo Majella, exemplo de obediência, humildade e confiança em Deus, rogai por nós.

Ajudai-nos a viver segundo a vontade do Senhor, com fé simples e coração entregue.

Amém.`
      }
    ]
  }
],

[
  {
    novenaId: "novena_sao_joao_paulo_ii",
    title: "NOVENA A SAO JOAO PAULO II",
    howToPray: [
      "1. Sinal da Cruz",
      "2. Oração Inicial",
      "3. Oração do dia",
      "4. Pai-Nosso",
      "5. Ave-Maria",
      "6. Glória ao Pai",
      "7. Oração Final"
    ],
    sections: [
      {
        type: "fixed",
        title: "SINAL DA CRUZ",
        text: "Em nome do Pai, do Filho e do Espírito Santo. Amém."
      },
      {
        type: "fixed",
        title: "ORACAO INICIAL (TODOS OS DIAS)",
        text: `Ó São João Paulo II, pastor zeloso, testemunha corajosa da fé e incansável anunciador do Evangelho, com confiança recorremos à vossa poderosa intercessão.

Vós que proclamastes ao mundo: “Não tenhais medo”, ajudai-nos a viver a fé com coragem, esperança e amor, permanecendo firmes em Cristo e fiéis à Igreja.

Concedei-nos a graça de rezar esta novena com fé sincera, para que, seguindo vosso exemplo de santidade, entrega e amor a Deus e ao próximo, possamos alcançar as graças que necessitamos, se forem da vontade de Deus.

Amém.`
      },
      {
        type: "day",
        day: 1,
        title: "PRIMEIRO DIA – SAO JOAO PAULO II, HOMEM DE FÉ",
        text: `Ó São João Paulo II, vivestes uma fé profunda e inabalável em Deus.

Ensinai-nos a confiar no Senhor em todas as circunstâncias da vida.

Que nossa fé seja firme, viva e perseverante.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
      },
      {
        type: "day",
        day: 2,
        title: "SEGUNDO DIA – SAO JOAO PAULO II, AMOR A CRISTO",
        text: `Ó São João Paulo II, fizestes de Cristo o centro de vossa vida e missão.

Ajudai-nos a amar Jesus acima de todas as coisas.

Que nossa vida seja totalmente entregue a Ele.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
      },
      {
        type: "day",
        day: 3,
        title: "TERCEIRO DIA – SAO JOAO PAULO II, DEVOTO DE MARIA",
        text: `Ó São João Paulo II, sob o lema “Totus Tuus”, confiastes-vos inteiramente à Virgem Maria.

Ensinai-nos a confiar em Maria como Mãe e guia no caminho da fé.

Que ela nos conduza sempre a Jesus.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
      },
      {
        type: "day",
        day: 4,
        title: "QUARTO DIA – SAO JOAO PAULO II, DEFENSOR DA VIDA",
        text: `Ó São João Paulo II, fostes incansável defensor da vida humana desde a concepção até a morte natural.

Ajudai-nos a respeitar, proteger e promover a vida em todas as suas fases.

Que sejamos testemunhas da cultura da vida.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
      },
      {
        type: "day",
        day: 5,
        title: "QUINTO DIA – SAO JOAO PAULO II, PASTOR DA IGREJA",
        text: `Ó São João Paulo II, conduzistes a Igreja com amor, firmeza e fidelidade.

Intercedei pelo Papa, pelos bispos, sacerdotes e por todo o povo de Deus.

Que a Igreja permaneça fiel ao Evangelho.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
      },
      {
        type: "day",
        day: 6,
        title: "SEXTO DIA – SAO JOAO PAULO II, AMOR AOS JOVENS",
        text: `Ó São João Paulo II, tivestes especial carinho e atenção pelos jovens.

Ajudai os jovens a encontrarem em Cristo o sentido de suas vidas.

Que vivam com esperança, pureza e coragem.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
      },
      {
        type: "day",
        day: 7,
        title: "SETIMO DIA – SAO JOAO PAULO II, TESTEMUNHA DO SOFRIMENTO",
        text: `Ó São João Paulo II, vivestes o sofrimento unido à cruz de Cristo.

Ensinai-nos a oferecer nossas dores com fé e esperança.

Que saibamos transformar o sofrimento em amor.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
      },
      {
        type: "day",
        day: 8,
        title: "OITAVO DIA – SAO JOAO PAULO II, MENSAGEIRO DA PAZ",
        text: `Ó São João Paulo II, anunciastes ao mundo a paz, a reconciliação e o perdão.

Ajudai-nos a ser construtores da paz em nossas famílias e comunidades.

Que vivamos na justiça e no amor.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
      },
      {
        type: "day",
        day: 9,
        title: "NONO DIA – SAO JOAO PAULO II, INTERCESSOR PODEROSO",
        text: `Ó glorioso São João Paulo II, confiamos em vossa poderosa intercessão.

Apresentai a Deus nossas intenções, necessidades e pedidos.

Conduzi-nos sempre no caminho da fé, da esperança e da salvação.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
      },
      {
        type: "fixed",
        title: "ORACAO FINAL (TODOS OS DIAS)",
        text: `Ó São João Paulo II, fiel servidor de Cristo e da Igreja, rogai por nós.

Ajudai-nos a viver sem medo, firmes na fé e comprometidos com o Evangelho.

Amém.`
      }
    ]
  },

  {
    novenaId: "novena_sao_judas_tadeu",
    title: "NOVENA A SAO JUDAS TADEU",
    howToPray: [
      "1. Sinal da Cruz",
      "2. Oração Inicial",
      "3. Oração do dia",
      "4. Pai-Nosso",
      "5. Ave-Maria",
      "6. Glória ao Pai",
      "7. Oração Final"
    ],
    sections: [
      {
        type: "fixed",
        title: "SINAL DA CRUZ",
        text: "Em nome do Pai, do Filho e do Espírito Santo. Amém."
      },
      {
        type: "fixed",
        title: "ORACAO INICIAL (TODOS OS DIAS)",
        text: `Ó glorioso São Judas Tadeu, apóstolo fiel de Jesus Cristo e poderoso intercessor nas causas difíceis e desesperadas, com confiança recorremos à vossa intercessão.

Vós que permanecestes firmes na fé e no amor a Cristo, mesmo diante das perseguições, ajudai-nos a confiar em Deus quando tudo parece impossível.

Concedei-nos a graça de rezar esta novena com fé sincera, para que, por vossa poderosa intercessão, possamos alcançar as graças que necessitamos, se forem da vontade de Deus.

Amém.`
      },
      {
        type: "day",
        day: 1,
        title: "PRIMEIRO DIA – SAO JUDAS TADEU, APOSTOLO DE CRISTO",
        text: `Ó São Judas Tadeu, fostes escolhido por Jesus para ser Seu apóstolo.

Ensinai-nos a seguir Cristo com fidelidade e amor.

Que nossa vida seja testemunho do Evangelho.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
      },
      {
        type: "day",
        day: 2,
        title: "SEGUNDO DIA – SAO JUDAS TADEU, FÉ FIRME NAS DIFICULDADES",
        text: `Ó São Judas Tadeu, permanecestes firme na fé em meio às tribulações.

Ajudai-nos a confiar em Deus nas dificuldades da vida.

Que nunca percamos a fé e a esperança.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
      },
      {
        type: "day",
        day: 3,
        title: "TERCEIRO DIA – SAO JUDAS TADEU, ESPERANCA NAS CAUSAS IMPOSSIVEIS",
        text: `Ó São Judas Tadeu, sois conhecido como o santo das causas impossíveis.

Intercedei por nós nos momentos de maior aflição.

Que aprendamos a confiar totalmente na providência divina.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
      },
      {
        type: "day",
        day: 4,
        title: "QUARTO DIA – SAO JUDAS TADEU, ZELO PELO EVANGELHO",
        text: `Ó São Judas Tadeu, anunciastes o Evangelho com coragem e dedicação.

Ensinai-nos a viver e testemunhar nossa fé sem medo.

Que sejamos missionários no dia a dia.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
      },
      {
        type: "day",
        day: 5,
        title: "QUINTO DIA – SAO JUDAS TADEU, FIDELIDADE ATE O FIM",
        text: `Ó São Judas Tadeu, permanecestes fiel a Cristo até o martírio.

Ajudai-nos a perseverar na fé até o fim.

Que sejamos fiéis a Deus em todas as circunstâncias.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
      },
      {
        type: "day",
        day: 6,
        title: "SEXTO DIA – SAO JUDAS TADEU, CONFIANCA NA MISERICORDIA DE DEUS",
        text: `Ó São Judas Tadeu, ensinai-nos a confiar na infinita misericórdia de Deus.

Ajudai-nos a entregar nossas angústias ao Senhor.

Que encontremos paz em Seu amor.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
      },
      {
        type: "day",
        day: 7,
        title: "SETIMO DIA – SAO JUDAS TADEU, FORCA NA ORACAO",
        text: `Ó São Judas Tadeu, encontrastes na oração a força para a missão.

Ensinai-nos a rezar com fé, perseverança e confiança.

Que nossa oração seja sincera e confiante.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
      },
      {
        type: "day",
        day: 8,
        title: "OITAVO DIA – SAO JUDAS TADEU, CONFORTO DOS AFLITOS",
        text: `Ó São Judas Tadeu, sois consolo para os aflitos e desesperados.

Intercedei por todos os que sofrem no corpo e na alma.

Concedei-nos esperança, força e paz.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
      },
      {
        type: "day",
        day: 9,
        title: "NONO DIA – SAO JUDAS TADEU, INTERCESSOR PODEROSO",
        text: `Ó glorioso São Judas Tadeu, confiamos em vossa poderosa intercessão.

Apresentai a Deus nossas intenções, necessidades e pedidos.

Conduzi-nos sempre no caminho da fé, da esperança e da salvação.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
      },
      {
        type: "fixed",
        title: "ORACAO FINAL (TODOS OS DIAS)",
        text: `Ó São Judas Tadeu, apóstolo fiel e poderoso intercessor nas causas difíceis, rogai por nós.

Ajudai-nos a confiar sempre em Deus e a jamais perder a esperança.

Amém.`
      }
    ]
  }
],
[
  {
    novenaId: "novena_almas_do_purgatorio",
    title: "NOVENA DAS ALMAS DO PURGATORIO",
    howToPray: [
      "1. Sinal da Cruz",
      "2. Oração Inicial",
      "3. Oração do dia",
      "4. Pai-Nosso",
      "5. Ave-Maria",
      "6. Glória ao Pai",
      "7. Oração Final"
    ],
    sections: [
      {
        type: "fixed",
        title: "SINAL DA CRUZ",
        text: "Em nome do Pai, do Filho e do Espírito Santo. Amém."
      },
      {
        type: "fixed",
        title: "ORACAO INICIAL (TODOS OS DIAS)",
        text: `Ó Deus eterno e todo-poderoso, que sois rico em misericórdia e amor, com fé e confiança elevamos a Vós nossas orações pelas almas do purgatório.

Tende piedade das almas que sofrem, purificadas pelo vosso amor, e concedei-lhes o descanso eterno e a luz perpétua.

Concedei-nos a graça de rezar esta novena com caridade sincera, para que, oferecendo nossas orações, possamos aliviar o sofrimento das almas e crescer na esperança da vida eterna.

Amém.`
      },
      {
        type: "day",
        day: 1,
        title: "PRIMEIRO DIA – ALMAS DO PURGATORIO, ESPERANCA DA VIDA ETERNA",
        text: `Ó almas benditas do purgatório, que aguardais a plenitude da vida eterna.

Intercedei por nós junto a Deus.

Que aprendamos a viver com os olhos voltados para o céu.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
      },
      {
        type: "day",
        day: 2,
        title: "SEGUNDO DIA – ALMAS DO PURGATORIO, PURIFICADAS PELO AMOR DE DEUS",
        text: `Ó almas santas, purificadas pelo fogo do amor divino.

Que vossas dores sejam aliviadas pelas nossas orações.

Ensinai-nos a buscar a santidade de vida.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
      },
      {
        type: "day",
        day: 3,
        title: "TERCEIRO DIA – ALMAS DO PURGATORIO, MISERICORDIA DIVINA",
        text: `Ó almas benditas, confiais totalmente na misericórdia de Deus.

Ajudai-nos a confiar na infinita misericórdia do Senhor.

Que saibamos recorrer sempre ao perdão divino.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
      },
      {
        type: "day",
        day: 4,
        title: "QUARTO DIA – ALMAS DO PURGATORIO, COMUNHAO DOS SANTOS",
        text: `Ó almas do purgatório, sois parte da comunhão dos santos.

Uni nossas orações às vossas.

Que vivamos em comunhão com a Igreja do céu, da terra e do purgatório.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
      },
      {
        type: "day",
        day: 5,
        title: "QUINTO DIA – ALMAS DO PURGATORIO, GRATIDAO PELAS ORACOES",
        text: `Ó almas santas, agradeceis cada oração oferecida por vós.

Ajudai-nos a sermos perseverantes na oração pelos falecidos.

Que nunca nos esqueçamos daqueles que partiram.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
      },
      {
        type: "day",
        day: 6,
        title: "SEXTO DIA – ALMAS DO PURGATORIO, EXEMPLO DE CONFIANCA",
        text: `Ó almas benditas, mesmo no sofrimento, confiais no amor de Deus.

Ensinai-nos a confiar no Senhor em meio às provações.

Que nossa fé seja fortalecida.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
      },
      {
        type: "day",
        day: 7,
        title: "SETIMO DIA – ALMAS DO PURGATORIO, INTERCESSORAS POR NOS",
        text: `Ó almas santas do purgatório, quando chegardes à glória do céu.

Lembrai-vos de nós diante de Deus.

Intercedei por nossas necessidades.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
      },
      {
        type: "day",
        day: 8,
        title: "OITAVO DIA – ALMAS DO PURGATORIO, ESPERANCA NA GLORIA CELESTE",
        text: `Ó almas benditas, aguardais com esperança o encontro definitivo com Deus.

Ajudai-nos a viver com fé na ressurreição.

Que nossa vida seja preparação para o céu.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
      },
      {
        type: "day",
        day: 9,
        title: "NONO DIA – ALMAS DO PURGATORIO, DESCANSO ETERNO",
        text: `Ó almas santas do purgatório, confiamos à misericórdia de Deus vossa libertação.

Que o Senhor vos conceda o descanso eterno.

E que a luz perpétua vos ilumine.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
      },
      {
        type: "fixed",
        title: "ORACAO FINAL (TODOS OS DIAS)",
        text: `Ó Deus de bondade infinita, concedei às almas do purgatório o descanso eterno.

Que a luz perpétua as ilumine e que alcancem a glória do céu.

Dai-nos também a graça de viver de modo santo, para um dia estarmos convosco na eternidade.

Amém.`
      }
    ]
  },

  {
    novenaId: "novena_sao_miguel_arcanjo",
    title: "NOVENA DE SAO MIGUEL ARCANJO",
    howToPray: [
      "1. Sinal da Cruz",
      "2. Oração Inicial",
      "3. Oração do dia",
      "4. Pai-Nosso",
      "5. Ave-Maria",
      "6. Glória ao Pai",
      "7. Oração Final"
    ],
    sections: [
      {
        type: "fixed",
        title: "SINAL DA CRUZ",
        text: "Em nome do Pai, do Filho e do Espírito Santo. Amém."
      },
      {
        type: "fixed",
        title: "ORACAO INICIAL (TODOS OS DIAS)",
        text: `Ó glorioso São Miguel Arcanjo, príncipe da milícia celeste, fiel defensor da glória de Deus e protetor do povo cristão, com confiança recorremos à vossa poderosa intercessão.

Vós que lutastes contra o mal e permanecestes fiéis ao Senhor, ajudai-nos no combate espiritual de cada dia, defendendo-nos contra as ciladas do inimigo e conduzindo-nos no caminho da fé, da verdade e da salvação.

Concedei-nos a graça de rezar esta novena com fé sincera, para que, sob vossa proteção, possamos viver firmes na fé e alcançar as graças que necessitamos, se forem da vontade de Deus.

Amém.`
      },
      {
        type: "day",
        day: 1,
        title: "PRIMEIRO DIA – SAO MIGUEL ARCANJO, DEFENSOR DA GLORIA DE DEUS",
        text: `Ó São Miguel Arcanjo, proclamastes com fidelidade: “Quem como Deus?”.

Ensinai-nos a colocar Deus acima de todas as coisas.

Que vivamos sempre para a glória do Senhor.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
      },
      {
        type: "day",
        day: 2,
        title: "SEGUNDO DIA – SAO MIGUEL ARCANJO, PROTETOR CONTRA O MAL",
        text: `Ó São Miguel Arcanjo, defensor do povo de Deus contra o maligno.

Protegei-nos contra todo perigo espiritual e material.

Que sejamos guardados pela força divina.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
      },
      {
        type: "day",
        day: 3,
        title: "TERCEIRO DIA – SAO MIGUEL ARCANJO, COMBATENTE ESPIRITUAL",
        text: `Ó São Miguel Arcanjo, chefe dos exércitos celestes.

Ajudai-nos a vencer as tentações e os ataques do mal.

Que sejamos fortes na fé e na oração.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
      },
      {
        type: "day",
        day: 4,
        title: "QUARTO DIA – SAO MIGUEL ARCANJO, GUARDAO DA IGREJA",
        text: `Ó São Miguel Arcanjo, protetor da Santa Igreja de Deus.

Defendei o Papa, os bispos, sacerdotes e todo o povo cristão.

Que a Igreja permaneça fiel ao Evangelho.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
      },
      {
        type: "day",
        day: 5,
        title: "QUINTO DIA – SAO MIGUEL ARCANJO, VENCEDOR DE SATANAS",
        text: `Ó São Miguel Arcanjo, vencedor das forças do mal.

Livrai-nos das armadilhas do inimigo.

Que vivamos sob a proteção do Altíssimo.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
      },
      {
        type: "day",
        day: 6,
        title: "SEXTO DIA – SAO MIGUEL ARCANJO, AUXILIO NA HORA DA MORTE",
        text: `Ó São Miguel Arcanjo, assisti as almas na hora decisiva da passagem para a eternidade.

Defendei-nos no último combate.

Conduzi-nos à presença de Deus.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
      },
      {
        type: "day",
        day: 7,
        title: "SETIMO DIA – SAO MIGUEL ARCANJO, DEFENSOR DAS ALMAS",
        text: `Ó São Miguel Arcanjo, que apresentais as almas diante do trono de Deus.

Intercedei por nós e pelas almas do purgatório.

Que alcancemos a misericórdia divina.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
      },
      {
        type: "day",
        day: 8,
        title: "OITAVO DIA – SAO MIGUEL ARCANJO, GUARDAO DOS LARES",
        text: `Ó São Miguel Arcanjo, protegei nossas casas e famílias.

Livrai-nos de todo mal e discórdia.

Que reine a paz de Deus em nossos lares.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
      },
      {
        type: "day",
        day: 9,
        title: "NONO DIA – SAO MIGUEL ARCANJO, INTERCESSOR PODEROSO",
        text: `Ó glorioso São Miguel Arcanjo, confiamos em vossa poderosa intercessão.

Apresentai a Deus nossas intenções, necessidades e pedidos.

Conduzi-nos sempre no caminho da fé, da proteção e da salvação.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
      },
      {
        type: "fixed",
        title: "ORACAO FINAL (TODOS OS DIAS)",
        text: `Ó São Miguel Arcanjo, defensor da fé e protetor do povo de Deus, rogai por nós.

Defendei-nos no combate espiritual e conduzi-nos à vitória em Cristo.

Amém.`
      }
    ]
  }
],
[
  {
    quaresmaId: "quaresma_sao_miguel_arcanjo_40_dias",
    title: "QUARESMA DE SAO MIGUEL ARCANJO (40 DIAS)",
    howToPray: [
      "1. Sinal da Cruz",
      "2. Oração Inicial",
      "3. Meditação do dia",
      "4. Pai-Nosso",
      "5. Ave-Maria",
      "6. Glória ao Pai",
      "7. Oração a São Miguel Arcanjo",
      "8. Oração Final"
    ],
    sections: [
      {
        type: "fixed",
        title: "SINAL DA CRUZ",
        text: "Em nome do Pai, do Filho e do Espírito Santo. Amém."
      },

      {
        type: "fixed",
        title: "ORACAO INICIAL (TODOS OS DIAS)",
        text: `Ó glorioso São Miguel Arcanjo, príncipe da milícia celeste, fiel defensor da glória de Deus e protetor do povo cristão, com confiança iniciamos esta Quaresma em vossa honra.

Vós que combatestes o mal e permanecestes fiéis ao Senhor, ajudai-nos neste tempo de oração, penitência e conversão, para que sejamos fortalecidos no combate espiritual e conduzidos no caminho da santidade.

Concedei-nos a graça de viver estes quarenta dias com fé sincera, disciplina espiritual e amor a Deus, para que, sob vossa proteção, alcancemos as graças necessárias à nossa salvação, se forem da vontade de Deus.

Amém.`
      },

      {
        type: "fixed",
        title: "MEDITACOES PARA OS 40 DIAS",
        text: `Estas intenções podem ser rezadas uma por dia, seguindo a ordem.`
      },

      {
        type: "day",
        day: 1,
        title: "DIA 1 – HUMILDADE DIANTE DE DEUS",
        text: `Senhor, ensinai-me a verdadeira humildade: reconhecer que tudo o que sou e tenho vem de Vós. Livrai-me da soberba que me afasta da graça e fazeis meu coração pequeno e duro. Com São Miguel, eu renuncio ao orgulho e escolho servir, obedecer e adorar.

Que eu saiba aceitar correções, pedir perdão e aprender com simplicidade. Que minha vida seja para a glória de Deus, e não para a minha vaidade.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
      },

      {
        type: "day",
        day: 2,
        title: "DIA 2 – CONFIANCA NA PROVIDENCIA DIVINA",
        text: `Pai amado, muitas vezes me inquieto com o amanhã e tento controlar o que não depende de mim. Hoje eu entrego a Vós meus medos, necessidades e planos. Dai-me a paz de confiar que nunca me faltará o necessário para cumprir a vossa vontade.

Com São Miguel, eu escolho a fé em vez da ansiedade. Guardai-me do desânimo e fazei-me perseverar, acreditando que Deus conduz todas as coisas para o bem dos que O amam.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
      },

      {
        type: "day",
        day: 3,
        title: "DIA 3 – ARREPENDIMENTO DOS PECADOS",
        text: `Senhor Jesus, eu reconheço minhas faltas e me volto para a vossa misericórdia. Que este dia seja marcado por contrição sincera, sem desculpas e sem endurecimento. Mostrai-me onde preciso mudar e dai-me coragem para abandonar o pecado.

São Miguel, defensor da santidade, ajudai-me a odiar o pecado e amar a graça. Que meu arrependimento seja verdadeiro e produza frutos de conversão.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
      },

      {
        type: "day",
        day: 4,
        title: "DIA 4 – DESEJO DE CONVERSAO",
        text: `Deus Santo, acendei em mim o desejo de mudar de vida. Que eu não me conforme com a mediocridade espiritual, nem com hábitos que me afastam de Vós. Dai-me fome da Palavra, sede de oração e amor pelos sacramentos.

São Miguel, sustentai minha decisão de recomeçar. Que eu dê passos concretos: renunciar ao que me faz cair, buscar a Confissão, cultivar virtudes e viver em amizade com Deus.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
      },

      {
        type: "day",
        day: 5,
        title: "DIA 5 – PUREZA DO CORACAO",
        text: `Senhor, purificai meu coração: minhas intenções, desejos, pensamentos e afetos. Livrai-me de tudo o que contamina por dentro: inveja, rancor, impureza, desordem, vaidade e egoísmo. Dai-me um coração simples, transparente e voltado para Vós.

São Miguel, guardião do povo de Deus, protegei-me das tentações e fortalecei-me na luta pela pureza. Que eu escolha o bem com liberdade e firmeza.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
      },

      {
        type: "day",
        day: 6,
        title: "DIA 6 – FIDELIDADE A DEUS",
        text: `Senhor, tornai-me fiel nas pequenas e grandes coisas. Que eu não seja cristão apenas quando é conveniente, mas em todo tempo: no silêncio, nas escolhas, no trabalho, nas amizades, no uso do celular, na vida escondida que só Vós vedes.

São Miguel, confirmai minha fidelidade. Que eu permaneça firme na graça, fiel à oração diária e fiel ao Evangelho, mesmo quando ninguém aplaude.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
      },

      {
        type: "day",
        day: 7,
        title: "DIA 7 – OBEDIENCIA A VONTADE DIVINA",
        text: `Pai, ensinai-me a obedecer por amor. Que eu pare de negociar com a vossa vontade e aprenda a dizer “faça-se”. Mostrai-me o que devo mudar, o que devo aceitar, o que devo iniciar e o que devo deixar.

São Miguel, que fostes obediente e fiel, ajudai-me a vencer a resistência interior. Que eu confie que a vontade de Deus é sempre boa, santa e perfeita.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
      },

      {
        type: "day",
        day: 8,
        title: "DIA 8 – FORTALEZA NAS TENTACOES",
        text: `Senhor, as tentações me revelam minha fragilidade, mas também podem fortalecer minha fé. Dai-me fortaleza para resistir: fugir do que me faz cair, cortar ocasiões de pecado e perseverar quando o combate apertar.

São Miguel, príncipe da milícia celeste, defendei-me no combate. Que eu não negocie com o mal, mas reaja com oração, vigilância e disciplina.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
      },

      {
        type: "day",
        day: 9,
        title: "DIA 9 – DOMINIO PROPRIO",
        text: `Espírito Santo, educai meus impulsos e paixões. Que eu tenha domínio próprio na fala, nos desejos, na comida, no sono, na ira e na curiosidade. Dai-me maturidade espiritual para escolher o bem, mesmo quando o coração pede o mais fácil.

São Miguel, ajudai-me a ser firme e equilibrado. Que eu aprenda a dizer “não” ao que me escraviza e “sim” ao que me santifica.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
      },

      {
        type: "day",
        day: 10,
        title: "DIA 10 – VIDA DE ORACAO",
        text: `Senhor, sem oração eu me enfraqueço e me perco. Hoje eu renovo meu compromisso de rezar com fidelidade: ainda que pouco, mas com constância, atenção e amor. Ensina-me a rezar com o coração, sem pressa e sem distração voluntária.

São Miguel, guardião da presença de Deus, conduzi-me à oração verdadeira. Que eu coloque Deus em primeiro lugar e viva sustentado pela graça.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
      },

      {
        type: "day",
        day: 11,
        title: "DIA 11 – AMOR A VERDADE",
        text: `Jesus, Vós sois a Verdade. Livrai-me da mentira, da manipulação e de tudo o que é engano. Que eu ame a verdade mesmo quando ela me corrige e me humilha. Dai-me sinceridade comigo mesmo e retidão diante de Deus.

São Miguel, defensor da verdade, ajudai-me a rejeitar a confusão e o erro. Que eu busque a luz do Evangelho e caminhe com clareza de consciência.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
      },

      {
        type: "day",
        day: 12,
        title: "DIA 12 – ZELO PELA FÉ",
        text: `Senhor, aumentai meu zelo pela fé. Que eu não seja morno, nem indiferente. Dai-me desejo de conhecer melhor a doutrina, amar a Igreja, viver os sacramentos e testemunhar Cristo com coragem.

São Miguel, protegei minha fé contra o relativismo e a tibieza. Que eu defenda a verdade com caridade e viva como discípulo fiel de Jesus.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
      },

      {
        type: "day",
        day: 13,
        title: "DIA 13 – PACIENCIA NAS PROVACOES",
        text: `Pai, quando a provação chega, eu me agito e reclamo. Ensinai-me a paciência cristã: confiar, esperar e perseverar. Que eu não perca a paz, nem abandone o bem por cansaço.

São Miguel, sustentai-me quando o peso for grande. Que eu aceite com fé aquilo que não posso mudar e lute com coragem pelo que devo transformar.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
      },

      {
        type: "day",
        day: 14,
        title: "DIA 14 – ESPIRITO DE SACRIFICIO",
        text: `Senhor, eu uno meus sacrifícios à cruz de Cristo. Dai-me espírito de renúncia: saber abrir mão do supérfluo, controlar meus desejos e oferecer a Vós pequenas mortificações com amor, sem ostentação.

São Miguel, fortalecei-me para viver com disciplina. Que este tempo seja um caminho real de penitência e amor reparador.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
      },

      {
        type: "day",
        day: 15,
        title: "DIA 15 – DESAPEGO DAS COISAS MATERIAIS",
        text: `Pai, livrai meu coração da escravidão das coisas. Que eu use os bens com gratidão e simplicidade, sem transformar dinheiro, consumo e status em ídolos. Dai-me um coração pobre, livre e generoso.

São Miguel, guardai-me da avareza e do apego. Que eu aprenda a partilhar e a confiar que Deus é minha verdadeira riqueza.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
      },

      {
        type: "day",
        day: 16,
        title: "DIA 16 – CONFIANCA EM SAO MIGUEL",
        text: `São Miguel Arcanjo, eu coloco sob vossa proteção minha mente, minha casa e meu coração. Aumentai em mim a confiança na assistência do céu. Que eu não viva com medo, mas com fé: Deus é mais forte do que qualquer ataque do mal.

Senhor, ensinai-me a recorrer a São Miguel com humildade e perseverança, principalmente quando eu estiver fraco e tentado.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
      },

      {
        type: "day",
        day: 17,
        title: "DIA 17 – PROTECAO CONTRA O MAL",
        text: `Senhor, eu reconheço que existe combate espiritual. Protegei-me do mal visível e invisível, daquilo que me seduz para longe de Vós. Que eu fuja das ocasiões perigosas, renuncie a práticas e conteúdos que abrem brechas e busque a proteção na oração e na graça.

São Miguel, defendei-me no combate. Guardai-me sob vossa espada e conduzi-me à luz de Cristo.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
      },

      {
        type: "day",
        day: 18,
        title: "DIA 18 – VITORIA SOBRE O PECADO",
        text: `Jesus, eu não quero ser escravo do pecado. Dai-me firmeza para cortar o que me faz cair e humildade para pedir ajuda quando necessário. Que eu não confie só em minha força, mas na graça que vem de Deus.

São Miguel, ajudai-me a lutar com coragem e perseverança. Que eu recomece quantas vezes for preciso, até vencer, pela misericórdia do Senhor.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
      },

      {
        type: "day",
        day: 19,
        title: "DIA 19 – FORCA NO COMBATE ESPIRITUAL",
        text: `Senhor, dai-me armas espirituais: a Palavra, os sacramentos, a oração, o jejum e a caridade. Ensina-me a vigiar minha mente e meus sentidos. Que eu não seja ingênuo diante do mal, nem desesperado, mas firme e vigilante.

São Miguel, fortalecei minha coragem. Que eu lute com constância e permaneça de pé, sustentado pela graça.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
      },

      {
        type: "day",
        day: 20,
        title: "DIA 20 – VIDA NA GRAÇA DE DEUS",
        text: `Pai, o maior tesouro é viver em estado de graça. Dai-me amor pela Confissão, desejo de comunhão frequente e fidelidade ao Evangelho. Que eu fuja do pecado mortal, mas também do que me esfria e me distrai de Deus.

São Miguel, guardai minha alma. Que eu seja cuidadoso com minha vida interior e escolha sempre aquilo que me aproxima de Cristo.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
      },

      {
        type: "day",
        day: 21,
        title: "DIA 21 – AMOR A IGREJA",
        text: `Senhor, eu amo a Igreja porque ela é vosso Corpo. Aumentai em mim a comunhão: com o Papa, com os bispos, sacerdotes e com minha comunidade. Livrai-me da crítica vazia, da divisão e do orgulho.

São Miguel, protetor da Igreja, defendei-a contra os ataques e purificai-nos por dentro. Que eu seja filho fiel, que constrói e serve.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
      },

      {
        type: "day",
        day: 22,
        title: "DIA 22 – FIDELIDADE AO EVANGELHO",
        text: `Jesus, dai-me coragem para viver o Evangelho sem adaptações ao pecado e sem vergonhas humanas. Que eu não relativize a verdade, nem negocie com o mundo aquilo que Vós me pedis.

São Miguel, fortalecei minha firmeza. Que minha vida fale de Cristo com coerência: no trabalho, em casa, nas escolhas, nas amizades e no coração.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
      },

      {
        type: "day",
        day: 23,
        title: "DIA 23 – ZELO PELA SALVACAO DAS ALMAS",
        text: `Senhor, dai-me zelo pela salvação das almas: começar pela minha, e também pelas pessoas que amo e encontro. Que eu reze por quem está afastado, ofereça sacrifícios e, quando for oportuno, testemunhe com amor.

São Miguel, ajudai-me a ser intercessor. Que eu não seja indiferente diante do sofrimento espiritual do mundo, mas seja instrumento de luz.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
      },

      {
        type: "day",
        day: 24,
        title: "DIA 24 – CARIDADE PARA COM O PROXIMO",
        text: `Jesus, ensinai-me a caridade concreta: paciência, serviço, escuta, generosidade e compaixão. Que eu não ame só com palavras, mas com atitudes. Dai-me um coração que se comove e mãos que ajudam.

São Miguel, afastai de mim o egoísmo e a dureza. Que eu veja Cristo no outro e pratique o bem com alegria.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
      },

      {
        type: "day",
        day: 25,
        title: "DIA 25 – MISERICORDIA E PERDAO",
        text: `Pai, como eu posso pedir perdão se não perdoo? Hoje eu entrego minhas mágoas e feridas. Curai meu coração e dai-me a graça de perdoar de verdade: sem vingança, sem guardar rancor, sem alimentar ódio.

São Miguel, defendei-me do espírito de divisão. Que eu seja instrumento de reconciliação e viva a paz que vem de Deus.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
      },

      {
        type: "day",
        day: 26,
        title: "DIA 26 – PUREZA DE INTENCOES",
        text: `Senhor, purificai minhas intenções. Que eu faça o bem pelo bem, por amor a Deus, e não por vaidade, interesse ou aplauso. Livrai-me da duplicidade e do desejo de aparecer.

São Miguel, guardai meu coração da soberba espiritual. Que eu sirva com sinceridade e ofereça tudo a Deus.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
      },

      {
        type: "day",
        day: 27,
        title: "DIA 27 – SILENCIO INTERIOR",
        text: `Deus, ensina-me o silêncio interior: calar o excesso de ruídos, pensamentos dispersos e inquietações. Que eu saiba fazer pausas, escutar o Espírito Santo e perceber a vossa presença.

São Miguel, conduzi-me à serenidade. Que eu não viva dominado por pressa e ansiedade, mas por recolhimento e oração.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
      },

      {
        type: "day",
        day: 28,
        title: "DIA 28 – DISCERNIMENTO ESPIRITUAL",
        text: `Espírito Santo, dai-me discernimento para reconhecer o que vem de Deus e o que não vem. Que eu não confunda sentimentos com direção divina, nem aceite qualquer voz como verdadeira. Ensina-me a decidir com prudência e humildade.

São Miguel, protegei-me do engano. Que eu busque conselho, ore antes de agir e escolha sempre o que agrada a Deus.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
      },

      {
        type: "day",
        day: 29,
        title: "DIA 29 – CONFIANCA NAS PROMESSAS DE DEUS",
        text: `Senhor, muitas vezes eu olho para as dificuldades e esqueço vossas promessas. Hoje eu renovo minha esperança: Deus não abandona, Deus sustenta, Deus cumpre o que promete. Fortalecei minha fé quando tudo parecer lento ou silencioso.

São Miguel, guardai meu coração do desânimo. Que eu persevere, confiando na fidelidade de Deus.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
      },

      {
        type: "day",
        day: 30,
        title: "DIA 30 – PERSEVERANCA NA FÉ",
        text: `Pai, eu quero perseverar. Dai-me constância para não abandonar a oração, nem a vida sacramental, nem o esforço de conversão. Que eu não me canse de recomeçar.

São Miguel, fortalecei minha firmeza. Que eu seja estável, fiel e perseverante, especialmente quando eu me sentir fraco.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
      },

      {
        type: "day",
        day: 31,
        title: "DIA 31 – VIGILANCIA ESPIRITUAL",
        text: `Senhor, ensinai-me a vigiar: meus pensamentos, minhas palavras, o que eu consumo, minhas companhias e escolhas. Que eu não deixe o mal entrar por distração. Dai-me sobriedade e prontidão.

São Miguel, ajudai-me a viver atento. Que eu fuja do que me derruba e busque o que me edifica, sem ingenuidade e sem medo.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
      },

      {
        type: "day",
        day: 32,
        title: "DIA 32 – PROTECAO DA FAMILIA",
        text: `Deus, eu consagro minha família a Vós. Protegei nosso lar, nossas conversas, nossas decisões e nossa fé. Curai feridas, restaure laços e afastai todo espírito de divisão, violência e impureza.

São Miguel, guardião dos lares, defendei-nos. Que a paz de Cristo reine em nossa casa e que nossa família caminhe para a santidade.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
      },

      {
        type: "day",
        day: 33,
        title: "DIA 33 – PAZ DO CORACAO",
        text: `Senhor, dai-me a paz que o mundo não pode dar. Acalmai minhas ansiedades, curai minhas preocupações e fortalecei minha confiança. Que eu não viva agitado por dentro, mas centrado em Deus.

São Miguel, protegei minha mente e meu coração. Que eu tenha serenidade para rezar, trabalhar e amar, sustentado pela graça.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
      },

      {
        type: "day",
        day: 34,
        title: "DIA 34 – FORTALEZA NA CRUZ",
        text: `Jesus, quando a cruz pesa, eu quero permanecer convosco. Dai-me fortaleza para não fugir das responsabilidades, não desistir do bem e não abandonar a fé. Ensina-me a carregar a cruz com amor e esperança.

São Miguel, sustentai-me no sofrimento. Que eu transforme minhas dores em oferta e permaneça fiel até o fim.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
      },

      {
        type: "day",
        day: 35,
        title: "DIA 35 – AMOR A SANTIDADE",
        text: `Senhor, colocai em mim amor pela santidade. Que eu deseje ser santo de verdade, não por perfeccionismo, mas por amor a Deus. Dai-me alegria em buscar as virtudes e firmeza em combater meus vícios.

São Miguel, conduzi-me no caminho santo. Que eu seja fiel no ordinário e constante na oração.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
      },

      {
        type: "day",
        day: 36,
        title: "DIA 36 – VITORIA DE CRISTO SOBRE O MAL",
        text: `Jesus, eu proclamo: Vós vencestes o mal na cruz e na ressurreição. Hoje eu renovo minha confiança na vitória de Cristo. Que eu não me deixe dominar pelo medo nem pelo pessimismo, pois Deus reina.

São Miguel, anunciai esta vitória em minha vida. Que eu caminhe na luz, rejeitando trevas e escolhendo a graça.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
      },

      {
        type: "day",
        day: 37,
        title: "DIA 37 – ENTREGA TOTAL A DEUS",
        text: `Pai, eu me entrego a Vós. Minha vida, minhas escolhas, meus projetos, meu futuro e minhas feridas. Recebei-me como sou e conduzi-me como quereis. Que eu confie plenamente, mesmo sem entender tudo.

São Miguel, ajudai-me a ser dócil. Que minha entrega seja sincera e renovada a cada dia.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
      },

      {
        type: "day",
        day: 38,
        title: "DIA 38 – PREPARACAO PARA A VIDA ETERNA",
        text: `Senhor, ensinai-me a viver com os olhos no céu. Que eu não esqueça a eternidade e não coloque meu coração apenas nas coisas passageiras. Dai-me sabedoria para fazer escolhas que tenham peso de eternidade.

São Miguel, conduzi-me no caminho da salvação. Que eu viva em estado de graça e com esperança firme na vida eterna.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
      },

      {
        type: "day",
        day: 39,
        title: "DIA 39 – ESPERANCA NA SALVACAO",
        text: `Pai, eu renovo minha esperança: Deus quer salvar, curar e restaurar. Livrai-me do desânimo e da sensação de que não há saída. Que eu espere em Vós com confiança, mesmo quando as coisas parecem difíceis.

São Miguel, fortalecei minha esperança. Que eu caminhe com perseverança, sustentado pela misericórdia divina.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
      },

      {
        type: "day",
        day: 40,
        title: "DIA 40 – CONSAGRAÇAO A SAO MIGUEL ARCANJO",
        text: `São Miguel Arcanjo, ao final destes quarenta dias, eu me coloco de modo especial sob vossa proteção. Defendei-me no combate, guardai minha alma, minha casa e minha família. Ajudai-me a permanecer fiel a Deus, firme na fé e constante na oração.

Senhor, por intercessão de São Miguel, consagro-Vos minha vida: que eu pertença a Cristo e viva para a glória do Pai.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
      },

      {
        type: "fixed",
        title: "ORACAO A SAO MIGUEL ARCANJO (TODOS OS DIAS)",
        text: `São Miguel Arcanjo,
defendei-nos no combate.
Sede nosso refúgio contra as maldades e ciladas do demônio.
Ordene-lhe Deus, instantemente o pedimos;
e vós, Príncipe da Milícia Celeste,
pela virtude divina,
precipitai no inferno a Satanás
e aos outros espíritos malignos
que andam pelo mundo para perder as almas.
Amém.`
      },

      {
        type: "fixed",
        title: "ORACAO FINAL (TODOS OS DIAS)",
        text: `Ó glorioso São Miguel Arcanjo, príncipe e protetor do povo de Deus, guardai-nos sob vossa poderosa proteção.

Ajudai-nos a perseverar na fé, a vencer o mal e a caminhar com firmeza rumo à santidade.

Que ao final desta Quaresma estejamos mais unidos a Deus, fortalecidos na graça e protegidos por vossa intercessão.

Amém.`
      }
    ]
  }
],

[
  {
    novenaId: "novena_divino_espirito_santo",
    title: "NOVENA AO DIVINO ESPIRITO SANTO",
    sections: [
      { type: "title", text: "COMO REZAR TODOS OS DIAS" },
      {
        type: "text",
        text: `1. Sinal da Cruz
2. Oração Inicial
3. Oração do dia
4. Pai-Nosso
5. Ave-Maria
6. Glória ao Pai
7. Oração Final`
      },

      { type: "title", text: "SINAL DA CRUZ" },
      { type: "prayer", text: `Em nome do Pai, do Filho e do Espírito Santo. Amém.` },

      { type: "title", text: "ORACAO INICIAL (TODOS OS DIAS)" },
      {
        type: "prayer",
        text: `Ó Divino Espírito Santo, amor do Pai e do Filho, fonte de luz, força e santidade, com humildade e confiança recorremos a Vós.

Vinde, Espírito Santo, iluminai nossas mentes, inflamai nossos corações com o vosso amor e conduzi-nos no caminho da verdade, da fé e da salvação.

Concedei-nos a graça de rezar esta novena com coração aberto e dócil, para que, acolhendo vossa ação em nossa vida, possamos crescer na santidade e alcançar as graças que necessitamos, se forem da vontade de Deus.

Amém.`
      },

      { type: "title", text: "PRIMEIRO DIA – ESPIRITO SANTO, PROMESSA DO PAI" },
      {
        type: "prayer",
        text: `Ó Divino Espírito Santo, sois a promessa do Pai enviada por Jesus à Sua Igreja.

Ajudai-nos a confiar nas promessas de Deus.

Que vivamos sustentados pela esperança cristã.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
      },

      { type: "title", text: "SEGUNDO DIA – ESPIRITO SANTO, LUZ DAS ALMAS" },
      {
        type: "prayer",
        text: `Ó Espírito Santo, luz divina que ilumina os corações.

Iluminai nossa mente para compreendermos a vontade de Deus.

Que caminhemos sempre na verdade.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
      },

      { type: "title", text: "TERCEIRO DIA – ESPIRITO SANTO, FOGO DO AMOR DIVINO" },
      {
        type: "prayer",
        text: `Ó Espírito Santo, fogo que purifica e inflama o coração humano.

Aquecei nosso coração com o vosso amor.

Que amemos a Deus e ao próximo com sinceridade.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
      },

      { type: "title", text: "QUARTO DIA – ESPIRITO SANTO, DOM DA SABEDORIA" },
      {
        type: "prayer",
        text: `Ó Espírito Santo, concedei-nos o dom da sabedoria.

Ajudai-nos a ver todas as coisas à luz de Deus.

Que escolhamos sempre o que agrada ao Senhor.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
      },

      { type: "title", text: "QUINTO DIA – ESPIRITO SANTO, DOM DO ENTENDIMENTO" },
      {
        type: "prayer",
        text: `Ó Espírito Santo, concedei-nos o dom do entendimento.

Ajudai-nos a compreender as verdades da fé.

Que nossa vida seja guiada pelo Evangelho.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
      },

      { type: "title", text: "SEXTO DIA – ESPIRITO SANTO, DOM DO CONSELHO" },
      {
        type: "prayer",
        text: `Ó Espírito Santo, dom do conselho, guia seguro de nossas decisões.

Orientai-nos nos caminhos da vida.

Que saibamos discernir a vontade de Deus.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
      },

      { type: "title", text: "SETIMO DIA – ESPIRITO SANTO, DOM DA FORTALEZA" },
      {
        type: "prayer",
        text: `Ó Espírito Santo, fortalecei-nos nas dificuldades e provações.

Dai-nos coragem para testemunhar nossa fé.

Que sejamos firmes diante das tentações.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
      },

      { type: "title", text: "OITAVO DIA – ESPIRITO SANTO, DOM DA PIEDADE" },
      {
        type: "prayer",
        text: `Ó Espírito Santo, enchei nosso coração com o dom da piedade.

Ajudai-nos a amar a Deus como Pai e a viver como Seus filhos.

Que nossa oração seja sincera e confiante.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
      },

      { type: "title", text: "NONO DIA – ESPIRITO SANTO, DOM DO TEMOR DE DEUS" },
      {
        type: "prayer",
        text: `Ó Espírito Santo, concedei-nos o santo temor de Deus.

Ajudai-nos a respeitar e amar o Senhor acima de tudo.

Que vivamos afastados do pecado e unidos à graça divina.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
      },

      { type: "title", text: "ORACAO FINAL (TODOS OS DIAS)" },
      {
        type: "prayer",
        text: `Ó Divino Espírito Santo, santificador das almas, renovai-nos com vossa graça.

Conduzi-nos no caminho da santidade, da verdade e do amor.

Permanecei sempre conosco e fazei de nossa vida um louvor à Santíssima Trindade.

Amém.`
      }
    ]
  },

  {
    novenaId: "novena_sagrado_coracao_de_jesus",
    title: "NOVENA AO SAGRADO CORACAO DE JESUS",
    sections: [
      { type: "title", text: "COMO REZAR TODOS OS DIAS" },
      {
        type: "text",
        text: `1. Sinal da Cruz
2. Oração Inicial
3. Oração do dia
4. Pai-Nosso
5. Ave-Maria
6. Glória ao Pai
7. Oração Final`
      },

      { type: "title", text: "SINAL DA CRUZ" },
      { type: "prayer", text: `Em nome do Pai, do Filho e do Espírito Santo. Amém.` },

      { type: "title", text: "ORACAO INICIAL (TODOS OS DIAS)" },
      {
        type: "prayer",
        text: `Ó Sagrado Coração de Jesus, fornalha ardente de amor, fonte de misericórdia e compaixão infinita, com humildade e confiança nos colocamos diante de Vós.

Vós que tanto amastes os homens e tão pouco sois amado, acolhei-nos em Vosso Coração manso e humilde, perdoai nossos pecados e renovai nosso amor por Vós.

Concedei-nos a graça de rezar esta novena com fé sincera, para que, unidos ao Vosso Coração, possamos crescer na caridade, na confiança e alcançar as graças que necessitamos, se forem da vontade de Deus.

Amém.`
      },

      { type: "title", text: "PRIMEIRO DIA – SAGRADO CORACAO DE JESUS, AMOR INFINITO" },
      {
        type: "prayer",
        text: `Ó Sagrado Coração de Jesus, símbolo do amor infinito de Deus pelos homens.

Ensinai-nos a amar como Vós amais.

Que nosso coração seja semelhante ao Vosso.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
      },

      { type: "title", text: "SEGUNDO DIA – SAGRADO CORACAO DE JESUS, MISERICORDIA DIVINA" },
      {
        type: "prayer",
        text: `Ó Sagrado Coração de Jesus, fonte inesgotável de misericórdia.

Ajudai-nos a confiar em Vosso amor misericordioso.

Que recorramos sempre ao Vosso Coração.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
      },

      { type: "title", text: "TERCEIRO DIA – SAGRADO CORACAO DE JESUS, CORACAO MANSO E HUMILDE" },
      {
        type: "prayer",
        text: `Ó Sagrado Coração de Jesus, manso e humilde de coração.

Ensinai-nos a viver na humildade e na mansidão.

Que afastemos de nós o orgulho e a dureza de coração.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
      },

      { type: "title", text: "QUARTO DIA – SAGRADO CORACAO DE JESUS, PACIENCIA E PERDAO" },
      {
        type: "prayer",
        text: `Ó Sagrado Coração de Jesus, paciente e rico em perdão.

Ajudai-nos a perdoar como Vós perdoais.

Que nosso coração seja capaz de misericórdia.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
      },

      { type: "title", text: "QUINTO DIA – SAGRADO CORACAO DE JESUS, FONTE DE CONSOLACAO" },
      {
        type: "prayer",
        text: `Ó Sagrado Coração de Jesus, consolo dos aflitos e esperança dos que sofrem.

Consolai os corações feridos e desanimados.

Que encontremos em Vós descanso e paz.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
      },

      { type: "title", text: "SEXTO DIA – SAGRADO CORACAO DE JESUS, ZELO PELA SALVACAO DAS ALMAS" },
      {
        type: "prayer",
        text: `Ó Sagrado Coração de Jesus, desejais a salvação de todos.

Inflamai nosso coração com zelo apostólico.

Que desejemos conduzir as almas a Vós.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
      },

      { type: "title", text: "SETIMO DIA – SAGRADO CORACAO DE JESUS, AMOR A EUCARISTIA" },
      {
        type: "prayer",
        text: `Ó Sagrado Coração de Jesus, presente na Eucaristia por amor a nós.

Ajudai-nos a amar e adorar o Santíssimo Sacramento.

Que nossa fé eucarística seja viva.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
      },

      { type: "title", text: "OITAVO DIA – SAGRADO CORACAO DE JESUS, REPARACAO DOS PECADOS" },
      {
        type: "prayer",
        text: `Ó Sagrado Coração de Jesus, ferido pelos pecados da humanidade.

Aceitai nossas orações como reparação.

Que vivamos em espírito de conversão.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
      },

      { type: "title", text: "NONO DIA – SAGRADO CORACAO DE JESUS, INTERCESSOR PODEROSO" },
      {
        type: "prayer",
        text: `Ó Sagrado Coração de Jesus, confiamos plenamente em Vosso amor.

Recebei nossas intenções e necessidades.

Conduzi-nos sempre no caminho da fé, da esperança e da salvação.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
      },

      { type: "title", text: "ORACAO FINAL (TODOS OS DIAS)" },
      {
        type: "prayer",
        text: `Ó Sagrado Coração de Jesus, em Vós confiamos.

Fazei nosso coração semelhante ao Vosso, cheio de amor, misericórdia e fidelidade.

Reinai em nossos corações, em nossas famílias e em todo o mundo.

Amém.`
      }
    ]
  }
],

[
  {
    novenaId: "novena_sagrada_familia",
    title: "NOVENA A SAGRADA FAMILIA (JESUS, MARIA E JOSE)",
    sections: [
      { type: "title", text: "COMO REZAR TODOS OS DIAS" },
      {
        type: "text",
        text: `1. Sinal da Cruz
2. Oração Inicial
3. Oração do dia
4. Pai-Nosso
5. Ave-Maria
6. Glória ao Pai
7. Oração Final`
      },

      { type: "title", text: "SINAL DA CRUZ" },
      { type: "prayer", text: `Em nome do Pai, do Filho e do Espírito Santo. Amém.` },

      { type: "title", text: "ORACAO INICIAL (TODOS OS DIAS)" },
      {
        type: "prayer",
        text: `Ó Sagrada Família de Nazaré, Jesus, Maria e José, modelo perfeito de amor, unidade e fidelidade a Deus, com confiança recorremos à vossa intercessão.

Vós que vivestes na simplicidade, no trabalho, na oração e no amor mútuo, ajudai nossas famílias a viverem segundo a vontade de Deus, fortalecidas na fé, na esperança e na caridade.

Concedei-nos a graça de rezar esta novena com coração sincero, para que, seguindo vosso exemplo de vida santa, possamos alcançar as graças que necessitamos, se forem da vontade de Deus.

Amém.`
      },

      { type: "title", text: "PRIMEIRO DIA – SAGRADA FAMILIA, PLANO DE DEUS" },
      {
        type: "prayer",
        text: `Ó Sagrada Família, escolhida por Deus para acolher o Salvador.

Ensinai-nos a confiar nos planos divinos para nossa família.

Que saibamos acolher a vontade de Deus com fé.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
      },

      { type: "title", text: "SEGUNDO DIA – SAGRADA FAMILIA, AMOR E UNIAO" },
      {
        type: "prayer",
        text: `Ó Sagrada Família, vivestes unidos pelo amor e pela presença de Deus.

Ajudai nossas famílias a viverem na união, no respeito e no perdão.

Que o amor seja sempre o fundamento de nossos lares.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
      },

      { type: "title", text: "TERCEIRO DIA – SAGRADA FAMILIA, VIDA DE ORACAO" },
      {
        type: "prayer",
        text: `Ó Sagrada Família, vossa casa era lugar de oração e confiança em Deus.

Ensinai-nos a rezar juntos em família.

Que nossos lares sejam sustentados pela oração.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
      },

      { type: "title", text: "QUARTO DIA – SAGRADA FAMILIA, TRABALHO E DIGNIDADE" },
      {
        type: "prayer",
        text: `Ó Sagrada Família, santificastes o trabalho cotidiano com simplicidade e dedicação.

Ajudai-nos a valorizar o trabalho como dom de Deus.

Que nosso esforço seja oferecido com amor.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
      },

      { type: "title", text: "QUINTO DIA – SAGRADA FAMILIA, OBEDIENCIA E HUMILDADE" },
      {
        type: "prayer",
        text: `Ó Sagrada Família, vivestes na obediência à vontade de Deus.

Ensinai-nos a viver com humildade e confiança.

Que saibamos aceitar os desafios com fé.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
      },

      { type: "title", text: "SEXTO DIA – SAGRADA FAMILIA, PROTECAO NAS DIFICULDADES" },
      {
        type: "prayer",
        text: `Ó Sagrada Família, enfrentastes perseguições e dificuldades com fé e união.

Protegei nossas famílias nos momentos de provação.

Que nunca nos falte a esperança.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
      },

      { type: "title", text: "SETIMO DIA – SAGRADA FAMILIA, EDUCACAO NA FÉ" },
      {
        type: "prayer",
        text: `Ó Sagrada Família, educastes Jesus no amor e na fidelidade a Deus.

Ajudai pais e responsáveis a educarem os filhos na fé cristã.

Que as novas gerações cresçam na graça de Deus.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
      },

      { type: "title", text: "OITAVO DIA – SAGRADA FAMILIA, MODELO DE VIDA CRISTA" },
      {
        type: "prayer",
        text: `Ó Sagrada Família, sois exemplo perfeito de vida cristã.

Ajudai-nos a viver o Evangelho em nossas casas.

Que nossas famílias sejam testemunhas de Cristo.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
      },

      { type: "title", text: "NONO DIA – SAGRADA FAMILIA, INTERCESSORA DAS FAMILIAS" },
      {
        type: "prayer",
        text: `Ó gloriosa Sagrada Família de Nazaré, confiamos em vossa poderosa intercessão.

Apresentai a Deus nossas famílias, necessidades e pedidos.

Conduzi-nos sempre no caminho da fé, do amor e da salvação.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
      },

      { type: "title", text: "ORACAO FINAL (TODOS OS DIAS)" },
      {
        type: "prayer",
        text: `Ó Sagrada Família de Nazaré, Jesus, Maria e José, protegei nossas famílias.

Ajudai-nos a viver na fé, na união e no amor, para que nossos lares sejam verdadeiras igrejas domésticas.

Amém.`
      }
    ]
  },

  {
    novenaId: "novena_pentecostes",
    title: "NOVENA DE PENTECOSTES",
    sections: [
      { type: "title", text: "COMO REZAR TODOS OS DIAS" },
      {
        type: "text",
        text: `1. Sinal da Cruz
2. Oração Inicial
3. Oração do dia
4. Pai-Nosso
5. Ave-Maria
6. Glória ao Pai
7. Oração Final`
      },

      { type: "title", text: "SINAL DA CRUZ" },
      { type: "prayer", text: `Em nome do Pai, do Filho e do Espírito Santo. Amém.` },

      { type: "title", text: "ORACAO INICIAL (TODOS OS DIAS)" },
      {
        type: "prayer",
        text: `Ó Espírito Santo, promessa do Pai e dom do Ressuscitado, que descestes sobre os apóstolos em Pentecostes, com humildade e confiança abrimos nosso coração à vossa ação.

Vinde, Espírito Santo, renovai-nos interiormente, fortalecei nossa fé, inflamai-nos com o fogo do vosso amor e conduzi-nos na verdade plena.

Concedei-nos a graça de rezar esta novena com coração dócil, para que, preparados para a vinda do Espírito, sejamos renovados em nossa vida cristã e alcancemos as graças que necessitamos, se forem da vontade de Deus.

Amém.`
      },

      { type: "title", text: "PRIMEIRO DIA – ESPIRITO SANTO, PROMESSA DE JESUS" },
      {
        type: "prayer",
        text: `Ó Espírito Santo, Jesus prometeu enviar-vos como Consolador.

Ajudai-nos a confiar nas promessas do Senhor.

Que aguardemos vossa vinda com fé e esperança.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
      },

      { type: "title", text: "SEGUNDO DIA – ESPIRITO SANTO, FOGO DIVINO" },
      {
        type: "prayer",
        text: `Ó Espírito Santo, fogo que purifica e transforma.

Queimai em nós tudo o que não vem de Deus.

Inflamai nosso coração com o amor divino.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
      },

      { type: "title", text: "TERCEIRO DIA – ESPIRITO SANTO, LUZ DOS CORACOES" },
      {
        type: "prayer",
        text: `Ó Espírito Santo, luz que ilumina as almas.

Iluminai nossa mente para compreendermos a Palavra de Deus.

Que caminhemos sempre na verdade.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
      },

      { type: "title", text: "QUARTO DIA – ESPIRITO SANTO, CONSOLADOR DOS AFLITOS" },
      {
        type: "prayer",
        text: `Ó Espírito Santo, Consolador prometido por Jesus.

Consolai os corações feridos e abatidos.

Que encontremos em vós força e paz.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
      },

      { type: "title", text: "QUINTO DIA – ESPIRITO SANTO, DOM DA SABEDORIA" },
      {
        type: "prayer",
        text: `Ó Espírito Santo, concedei-nos o dom da sabedoria.

Ajudai-nos a ver tudo à luz de Deus.

Que escolhamos sempre o bem.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
      },

      { type: "title", text: "SEXTO DIA – ESPIRITO SANTO, DOM DA FORTALEZA" },
      {
        type: "prayer",
        text: `Ó Espírito Santo, dai-nos fortaleza para testemunhar nossa fé.

Sustentai-nos nas dificuldades e provações.

Que não tenhamos medo de seguir Cristo.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
      },

      { type: "title", text: "SETIMO DIA – ESPIRITO SANTO, UNIDADE DA IGREJA" },
      {
        type: "prayer",
        text: `Ó Espírito Santo, sois o vínculo de unidade da Igreja.

Unificai os corações dos fiéis.

Que vivamos em comunhão e caridade.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
      },

      { type: "title", text: "OITAVO DIA – ESPIRITO SANTO, RENOVADOR DA FACE DA TERRA" },
      {
        type: "prayer",
        text: `Ó Espírito Santo, renovador da face da terra.

Renovai nossas famílias, comunidades e a Igreja.

Que sejamos instrumentos da vossa ação.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
      },

      { type: "title", text: "NONO DIA – ESPIRITO SANTO, PLENITUDE DOS DONS" },
      {
        type: "prayer",
        text: `Ó Divino Espírito Santo, confiamos na vossa ação transformadora.

Derramai sobre nós vossos dons e graças.

Fazei-nos testemunhas vivas do Evangelho.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
      },

      { type: "title", text: "ORACAO FINAL (TODOS OS DIAS)" },
      {
        type: "prayer",
        text: `Ó Espírito Santo, Senhor e fonte de vida, descei sobre nós.

Renovai-nos com vossa graça, fortalecei nossa fé e conduzi-nos no caminho da santidade.

Permanecei sempre conosco e fazei de nossa vida um louvor à Santíssima Trindade.

Amém.`
      }
    ]
  }
],

[
  {
    novenaId: "novena_santo_expedito",
    title: "NOVENA DE SANTO EXPEDITO",
    sections: [
      { type: "title", text: "COMO REZAR TODOS OS DIAS" },
      {
        type: "text",
        text: `1. Sinal da Cruz
2. Oração Inicial
3. Oração do dia
4. Pai-Nosso
5. Ave-Maria
6. Glória ao Pai
7. Oração Final`
      },

      { type: "title", text: "SINAL DA CRUZ" },
      {
        type: "prayer",
        text: `Em nome do Pai, do Filho e do Espírito Santo. Amém.`
      },

      { type: "title", text: "ORACAO INICIAL (TODOS OS DIAS)" },
      {
        type: "prayer",
        text: `Ó glorioso Santo Expedito, fiel mártir de Cristo e intercessor nas causas urgentes e difíceis, com confiança recorremos à vossa poderosa intercessão.

Vós que, sem demora, escolhestes servir a Deus e rejeitar as tentações do inimigo, ajudai-nos a responder prontamente ao chamado do Senhor e a confiar em Sua providência.

Concedei-nos a graça de rezar esta novena com fé sincera, para que, por vossa intercessão, possamos alcançar as graças urgentes que necessitamos, se forem da vontade de Deus.

Amém.`
      },

      { type: "title", text: "PRIMEIRO DIA – SANTO EXPEDITO, PRONTIDAO EM SEGUIR A CRISTO" },
      {
        type: "prayer",
        text: `Ó Santo Expedito, escolhestes seguir a Cristo sem hesitação.

Ensinai-nos a dizer sim a Deus sem demora.

Que não adiemos nossa conversão.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
      },

      { type: "title", text: "SEGUNDO DIA – SANTO EXPEDITO, FÉ NAS CAUSAS URGENTES" },
      {
        type: "prayer",
        text: `Ó Santo Expedito, sois invocado nas causas urgentes.

Ajudai-nos a confiar em Deus nos momentos de necessidade imediata.

Que nossa fé seja firme e confiante.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
      },

      { type: "title", text: "TERCEIRO DIA – SANTO EXPEDITO, VITORIA SOBRE AS TENTACOES" },
      {
        type: "prayer",
        text: `Ó Santo Expedito, vencestes as tentações com decisão e coragem.

Ajudai-nos a resistir ao mal e escolher o bem.

Que sejamos fortes na fé.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
      },

      { type: "title", text: "QUARTO DIA – SANTO EXPEDITO, CONFIANCA NA PROVIDENCIA" },
      {
        type: "prayer",
        text: `Ó Santo Expedito, confiastes plenamente na providência divina.

Ajudai-nos a entregar nossas preocupações a Deus.

Que não sejamos dominados pelo medo ou pela dúvida.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
      },

      { type: "title", text: "QUINTO DIA – SANTO EXPEDITO, FIDELIDADE ATE O FIM" },
      {
        type: "prayer",
        text: `Ó Santo Expedito, permanecestes fiel a Cristo até o martírio.

Ajudai-nos a perseverar na fé até o fim.

Que sejamos fiéis a Deus em todas as circunstâncias.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
      },

      { type: "title", text: "SEXTO DIA – SANTO EXPEDITO, FORCA NA ORACAO" },
      {
        type: "prayer",
        text: `Ó Santo Expedito, encontrastes na oração a força para enfrentar as provações.

Ensinai-nos a rezar com confiança e perseverança.

Que nossa oração seja sincera e confiante.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
      },

      { type: "title", text: "SETIMO DIA – SANTO EXPEDITO, ESPERANCA NAS DIFICULDADES" },
      {
        type: "prayer",
        text: `Ó Santo Expedito, mantivestes viva a esperança mesmo diante do sofrimento.

Ajudai-nos a não desanimar diante das dificuldades.

Que nossa esperança esteja sempre em Deus.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
      },

      { type: "title", text: "OITAVO DIA – SANTO EXPEDITO, EXEMPLO DE CORAGEM" },
      {
        type: "prayer",
        text: `Ó Santo Expedito, enfrentastes o martírio com coragem e amor a Cristo.

Ensinai-nos a testemunhar nossa fé com valentia.

Que sejamos firmes na fé e no amor a Deus.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
      },

      { type: "title", text: "NONO DIA – SANTO EXPEDITO, INTERCESSOR PODEROSO" },
      {
        type: "prayer",
        text: `Ó glorioso Santo Expedito, confiamos em vossa poderosa intercessão.

Apresentai a Deus nossas intenções, necessidades e pedidos.

Conduzi-nos sempre no caminho da fé, da esperança e da salvação.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
      },

      { type: "title", text: "ORACAO FINAL (TODOS OS DIAS)" },
      {
        type: "prayer",
        text: `Ó Santo Expedito, mártir fiel e intercessor das causas urgentes, rogai por nós.

Ajudai-nos a viver com fé, prontidão e confiança na vontade de Deus.

Amém.`
      }
    ]
  }
]
]

// Publica automaticamente os dias seed
for (const d of daysSeed) publishDay(d);

// =====================
// Auth helper
// =====================
const requireUserId = (req) => req.header("x-user-id")?.trim() || null;

// =====================
// Routes
// =====================
app.get("/health", (req, res) => res.json({ ok: true, time: nowISO() }));

/**
 * GET /v1/novenas
 * query:
 *  - q=texto
 *  - type=novena|plan
 *  - status=draft|active
 *  - mes=Janeiro|...
 */
app.get("/v1/novenas", (req, res) => {
  const q = (req.query.q || "").toString().trim().toLowerCase();
  const type = (req.query.type || "").toString().trim().toLowerCase();
  const status = (req.query.status || "").toString().trim().toLowerCase();
  const mes = (req.query.mes || "").toString().trim().toLowerCase();

  let items = [...novenas.values()];

  if (q) {
    items = items.filter(
      (n) =>
        n.title.toLowerCase().includes(q) ||
        (n.label || "").toLowerCase().includes(q) ||
        (n.periodo || "").toLowerCase().includes(q) ||
        (n.mes || "").toLowerCase().includes(q) ||
        n.id.toLowerCase().includes(q)
    );
  }
  if (type) items = items.filter((n) => n.type === type);
  if (status) items = items.filter((n) => n.status === status);
  if (mes) items = items.filter((n) => (n.mes || "").toLowerCase().includes(mes));

  res.json({ items, total: items.length });
});

app.get("/v1/novenas/:novenaId", (req, res) => {
  const resolved = resolveNovenaId(req.params.novenaId);
  if (!resolved) return res.status(404).json({ error: "NOVENA_NOT_FOUND" });

  res.json(novenas.get(resolved));
});

/**
 * GET /v1/novenas/:novenaId/days/:day
 * Retorna o dia publicado; se não existir, retorna placeholder.
 */
app.get("/v1/novenas/:novenaId/days/:day", (req, res) => {
  const resolved = resolveNovenaId(req.params.novenaId);
  if (!resolved) return res.status(404).json({ error: "NOVENA_NOT_FOUND" });

  const novena = novenas.get(resolved);
  const day = clampDay(req.params.day, novena.daysCount);
  if (!day) return res.status(400).json({ error: "INVALID_DAY" });

  const key = `${novena.id}:${day}`;
  const data = days.get(key);

  if (!data) {
    return res.json({
      novenaId: novena.id,
      day,
      title: `Dia ${day}`,
      sections: [{ type: "text", text: "Conteúdo ainda não publicado." }],
      optional: null,
      version: 1
    });
  }

  res.json(data);
});

/**
 * Orações comuns
 */
app.get("/v1/prayers/common", (req, res) => {
  res.json({ items: commonPrayers, total: commonPrayers.length });
});

/**
 * Lista meses (pra UI)
 */
app.get("/v1/months", (req, res) => {
  const set = new Set();
  for (const n of novenas.values()) if (n.mes) set.add(n.mes);
  res.json({ items: [...set], total: set.size });
});

/**
 * Admin: publicar/editar um dia
 * POST /v1/admin/novenas/:novenaId/days/:day
 * body: { title, sections[], optional?, version? }
 */
app.post("/v1/admin/novenas/:novenaId/days/:day", (req, res) => {
  const resolved = resolveNovenaId(req.params.novenaId);
  if (!resolved) return res.status(404).json({ error: "NOVENA_NOT_FOUND" });

  const novena = novenas.get(resolved);
  const day = clampDay(req.params.day, novena.daysCount);
  if (!day) return res.status(400).json({ error: "INVALID_DAY" });

  const body = req.body || {};
  const title = body.title;
  const sections = body.sections;

  if (!title || !Array.isArray(sections)) {
    return res
      .status(400)
      .json({ error: "INVALID_BODY", hint: "Require { title, sections[] }" });
  }

  const result = publishDay({
    novenaId: novena.id,
    day,
    title,
    sections,
    optional: body.optional ?? null,
    version: body.version ?? 1
  });

  if (!result.ok) return res.status(400).json(result);

  res.json({ ok: true, saved: result.saved });
});

/**
 * Admin: publicar a novena (muda status)
 * POST /v1/admin/novenas/:novenaId/publish
 * body: { status: "active" | "draft" }
 */
app.post("/v1/admin/novenas/:novenaId/publish", (req, res) => {
  const resolved = resolveNovenaId(req.params.novenaId);
  if (!resolved) return res.status(404).json({ error: "NOVENA_NOT_FOUND" });

  const novena = novenas.get(resolved);
  const status = String(req.body?.status || "active").toLowerCase();

  if (!["active", "draft"].includes(status)) {
    return res.status(400).json({ error: "INVALID_STATUS", hint: 'Use "active" ou "draft"' });
  }

  novena.status = status;
  novena.updatedAt = nowISO();
  res.json({ ok: true, novena });
});

// =====================
// Progress (mock em memória)
// =====================
app.get("/v1/users/me/progress", (req, res) => {
  const userId = requireUserId(req);
  if (!userId) return res.status(401).json({ error: "MISSING_X_USER_ID" });

  const resolved = resolveNovenaId(req.query.novenaId);
  if (!resolved) return res.status(400).json({ error: "MISSING_OR_INVALID_NOVENA_ID" });

  const novena = novenas.get(resolved);
  const user = (progress[userId] ||= Object.create(null));

  const p = user[novena.id] || {
    novenaId: novena.id,
    currentDay: 1,
    completedDays: [],
    streak: 0,
    lastCompletedAt: null,
    updatedAt: nowISO()
  };

  res.json(p);
});

app.post("/v1/users/me/progress/complete-day", (req, res) => {
  const userId = requireUserId(req);
  if (!userId) return res.status(401).json({ error: "MISSING_X_USER_ID" });

  const { novenaId, day, completedAt } = req.body || {};
  const resolved = resolveNovenaId(novenaId);
  if (!resolved) return res.status(404).json({ error: "NOVENA_NOT_FOUND" });

  const novena = novenas.get(resolved);
  const d = clampDay(day, novena.daysCount);
  if (!d) return res.status(400).json({ error: "INVALID_DAY" });

  const user = (progress[userId] ||= Object.create(null));
  const p = (user[novena.id] ||= {
    novenaId: novena.id,
    currentDay: 1,
    completedDays: [],
    streak: 0,
    lastCompletedAt: null,
    updatedAt: nowISO()
  });

  if (!p.completedDays.includes(d)) p.completedDays.push(d);
  p.completedDays.sort((a, b) => a - b);

  let next = 1;
  while (p.completedDays.includes(next) && next <= novena.daysCount) next++;
  p.currentDay = Math.min(next, novena.daysCount);

  p.lastCompletedAt = completedAt ? String(completedAt) : nowISO();
  p.updatedAt = nowISO();

  res.json({ ok: true, progress: p });
});

// =====================
// Start
// =====================
const PORT = process.env.PORT || 3333;
app.listen(PORT, () => {
  console.log(`Novenas API rodando em http://localhost:${PORT}`);
});
