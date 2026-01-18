import express from "express";
import cors from "cors";


{
  "name": "novena-api",
  "version": "1.0.0",
  "description": "API de novenas com reutilização de orações e expansão de conteúdo por dia",
  "main": "server.js",
  "type": "commonjs",
  "scripts": {
    "dev": "node server.js"
  },
  "dependencies": {
    "cors": "^2.8.5",
    "express": "^4.19.2"
  }
}


novena-api/src/server.js

const express = require("express");
const cors = require("cors";

const globalTexts = require("./data/globalTexts");
const nsGracas = require("./data/novenas/nossa-senhora-das-gracas");
const templateMascara = require("./data/novenas/template-mascara");

const { expandDay } = require("./lib/expand");

const app = express();
app.use(cors());
app.use(express.json());

const novenas = [nsGracas, templateMascara];

app.get("/", (req, res) => {
  res.json({
    ok: true,
    service: "novena-api",
    endpoints: [
      "GET /novenas",
      "GET /novenas/:id",
      "GET /novenas/:id/dias/:dia?expand=1",
      "GET /texts/global",
      "GET /texts/global/:key"
    ]
  });
});

app.get("/novenas", (req, res) => {
  const list = novenas.map((n) => ({
    id: n.id,
    ...n.meta
  }));
  res.json(list);
});


app.get("/novenas/:id", (req, res) => {
  const novena = novenas.find((n) => n.id === req.params.id);
  if (!novena) return res.status(404).json({ error: "Novena não encontrada" });
  res.json(novena);
});

app.get("/novenas/:id/dias/:dia", (req, res) => {
  const novena = novenas.find((n) => n.id === req.params.id);
  if (!novena) return res.status(404).json({ error: "Novena não encontrada" });

  const expand = req.query.expand === undefined ? "1" : String(req.query.expand);
  const dayNumber = Number(req.params.dia);
  const maxDays = Number(novena.meta?.daysCount || 9);

  if (!Number.isInteger(dayNumber) || dayNumber < 1 || dayNumber > maxDays) {
    return res.status(400).json({ error: "Dia inválido" });
  }

  if (expand === "0") {
    const day = novena.days.find((d) => d.day === dayNumber);
    if (!day) return res.status(404).json({ error: "Dia não encontrado" });

    return res.json({
      day: day.day,
      title: day.title,
      opening: novena.defaults?.opening || [],
      body: day.body || [],
      closing: novena.defaults?.closing || []
    });
  }

  try {
    const expanded = expandDay(novena, dayNumber, globalTexts);
    if (!expanded) return res.status(404).json({ error: "Dia não encontrado" });
    res.json(expanded);
  } catch (err) {
    res.status(500).json({ error: err.message || "Erro ao expandir conteúdo" });
  }
});

app.get("/texts/global", (req, res) => {
  res.json(Object.values(globalTexts));
});


app.get("/texts/global/:key", (req, res) => {
  const t = globalTexts[req.params.key];
  if (!t) return res.status(404).json({ error: "Texto global não encontrado" });
  res.json(t);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`novena-api rodando em http://localhost:${PORT}`);
});


novena-api/src/lib/expand.js

function resolveRef(ref, { globalTexts, localTexts }) {
  const [scope, key] = String(ref).split(":");

  if (scope === "global") {
    const t = globalTexts[key];
    if (!t) throw new Error(`Texto global inexistente: ${key}`);
    return {
      type: "prayer",
      scope: "global",
      key,
      title: t.title,
      content: t.content
    };
  }

  if (scope === "local") {
    const t = localTexts[key];
    if (!t) throw new Error(`Texto local inexistente: ${key}`);
    return {
      type: "prayer",
      scope: "local",
      key,
      title: t.title,
      content: t.content
    };
  }

  throw new Error(`Ref inválida: ${ref}`);
}

function expandBlocks(blocks, ctx) {
  if (!Array.isArray(blocks)) return [];
  return blocks
    .map((b) => {
      if (b == null) return null;
      if (typeof b === "string") return { type: "text", content: b };

      if (b.ref) return resolveRef(b.ref, ctx);
      if (b.text) return { type: "text", content: b.text };
      if (b.rubric) return { type: "rubric", content: b.rubric };

      return b;
    })
    .filter(Boolean);
}

function expandDay(novena, dayNumber, globalTexts) {
  const day = novena.days.find((d) => d.day === Number(dayNumber));
  if (!day) return null;

  const ctx = { globalTexts, localTexts: novena.localTexts || {} };

  const openingDefault = novena.defaults?.opening || [];
  const closingDefault = novena.defaults?.closing || [];

  const openingOverride = day.override?.opening;
  const closingOverride = day.override?.closing;

  const opening =
    openingOverride === undefined || openingOverride === null
      ? expandBlocks(openingDefault, ctx)
      : expandBlocks(openingOverride, ctx);

  const body = expandBlocks(day.body || [], ctx);

  const closing =
    closingOverride === undefined || closingOverride === null
      ? expandBlocks(closingDefault, ctx)
      : expandBlocks(closingOverride, ctx);

  return {
    day: day.day,
    title: day.title,
    parts: {
      opening,
      body,
      closing
    }
  };
}

module.exports = { expandDay, expandBlocks, resolveRef };


novena-api/src/data/globalTexts.js

module.exports = {
  pn: {
    key: "pn",
    title: "Pai-Nosso",
    content:
      "Pai Nosso que estais no Céu, santificado seja o vosso Nome, venha a nós o vosso Reino, seja feita a vossa vontade assim na terra como no Céu. O pão nosso de cada dia nos dai hoje, perdoai-nos as nossas ofensas assim como nós perdoamos a quem nos tem ofendido, e não nos deixeis cair em tentação, mas livrai-nos do Mal. Amém."
  },
  am: {
    key: "am",
    title: "Ave-Maria",
    content:
      "Ave Maria, cheia de graça, o Senhor é convosco, bendita sois vós entre as mulheres, e bendito é o fruto do vosso ventre, Jesus. Santa Maria, Mãe de Deus, rogai por nós, pecadores, agora e na hora da nossa morte. Amém."
  },
  gp: {
    key: "gp",
    title: "Glória ao Pai",
    content:
      "Glória ao Pai, ao Filho e ao Espírito Santo. Como era no princípio, agora e sempre. Amém."
  }
};


novena-api/src/data/novenas/nossa-senhora-das-gracas.js
=========
module.exports = {
  id: "novena-nossa-senhora-das-gracas",
  meta: {
    nome: "Novena de Nossa Senhora das Graças",
    periodo: { inicio: "11-18", fim: "11-26" },
    mes: "Novembro",
    type: "novena",
    daysCount: 9,
    label:
      "Devoção ligada à Medalha Milagrosa e à intercessão de Maria pelas graças de Deus."
  },

  localTexts: {
    inicial: {
      title: "Oração inicial (todos os dias)",
      content:
        "Ó Maria Santíssima, Mãe de Deus e nossa Mãe, que aparecestes a Santa Catarina Labouré como Nossa Senhora das Graças, cheios de confiança recorremos a vós. Vós vos manifestastes como a Mãe que derrama graças abundantes sobre todos os que as pedem com fé e humildade.\n\nVinde em nosso auxílio, Mãe bondosa. Abri nosso coração para acolher a misericórdia de Deus e concedei-nos a graça de rezar esta novena com fé sincera, confiança filial e verdadeiro desejo de conversão. Que, por vossa intercessão poderosa, possamos receber as graças necessárias para nossa vida espiritual, corporal e para a nossa salvação eterna, se assim for da vontade de Deus.\nAmém."
    },
    final: {
      title: "Oração final (todos os dias)",
      content:
        "Ó Maria concebida sem pecado, rogai por nós que recorremos a vós.\nÓ Nossa Senhora das Graças, derramai sobre nós as graças de que necessitamos para viver na fé, na esperança e no amor.\nSede nossa Mãe, nossa proteção e nosso refúgio, hoje e sempre.\nAmém."
    }
  },

  defaults: {
    opening: [{ ref: "local:inicial" }],
    closing: [
      { rubric: "Pedido pessoal" },
      { ref: "global:pn" },
      { ref: "global:am" },
      { ref: "global:gp" },
      { ref: "local:final" }
    ]
  },

  days: [
    {
      day: 1,
      title: "Nossa Senhora das Graças, Canal das Bênçãos de Deus",
      body: [
        {
          text:
            "Ó Nossa Senhora das Graças, Deus vos escolheu como canal por onde Sua misericórdia se derrama sobre a humanidade. Os raios que saem de vossas mãos representam as graças que o Senhor concede àqueles que confiam em vossa intercessão materna.\n\nAjudai-nos a reconhecer que toda graça vem de Deus, mas que Ele quis contar convosco para nos aproximar ainda mais de Seu amor. Ensinai-nos a viver em atitude de gratidão, reconhecendo diariamente os dons que recebemos, mesmo aqueles que passam despercebidos.\n\nQue nunca nos esqueçamos de recorrer a vós nas necessidades da alma e do corpo, certos de que uma Mãe jamais abandona seus filhos."
        }
      ]
    },
    {
      day: 2,
      title: "Nossa Senhora das Graças, Mãe Misericordiosa",
      body: [
        {
          text:
            "Ó Mãe cheia de ternura, vosso coração está sempre aberto para acolher nossos sofrimentos, quedas e fragilidades. Conheceis nossas dores mais profundas e nossas lutas silenciosas.\n\nQuando nos sentimos indignos ou afastados de Deus, ensinai-nos a confiar na Sua misericórdia infinita. Levai-nos pela mão de volta ao caminho da graça, ajudando-nos a acreditar que o amor de Deus é maior do que qualquer pecado.\n\nSede nosso refúgio nos momentos de angústia e nossa esperança quando tudo parecer perdido."
        }
      ]
    },
    {
      day: 3,
      title: "Nossa Senhora das Graças, Modelo de Fé",
      body: [
        {
          text:
            "Ó Virgem Santíssima, vossa fé foi plena, humilde e constante. Mesmo sem compreender todos os mistérios, confiastes totalmente na Palavra de Deus e permanecestes firmes até aos pés da cruz.\n\nEnsinai-nos a ter uma fé viva, que não dependa apenas de milagres, mas que se sustente também nas provações. Fortalecei-nos quando somos tentados a desanimar e ajudai-nos a permanecer fiéis ao Senhor em todos os momentos.\n\nQue aprendamos convosco a acreditar, esperar e amar, mesmo nas noites mais escuras da vida."
        }
      ]
    },
    {
      day: 4,
      title: "Nossa Senhora das Graças, Refúgio dos Aflitos",
      body: [
        {
          text:
            "Ó Mãe compassiva, sois o consolo dos que sofrem, a força dos fracos e a esperança dos desanimados. A vós recorremos quando o peso da vida parece maior do que nossas forças.\n\nAcolhei em vosso coração materno todos os que enfrentam doenças, dores emocionais, angústias espirituais e dificuldades familiares. Alcançai-nos a graça da paz interior e da confiança no amor de Deus.\n\nEnsinai-nos a oferecer nossos sofrimentos unidos aos de Cristo, certos de que nenhuma dor é inútil quando colocada nas mãos do Senhor."
        }
      ]
    },
    {
      day: 5,
      title: "Nossa Senhora das Graças, Protetora dos Pecadores",
      body: [
        {
          text:
            "Ó Mãe cheia de misericórdia, vós não rejeitais nenhum de vossos filhos. Mesmo quando nos afastamos de Deus, vosso olhar permanece cheio de amor e esperança.\n\nIntercedei pelos pecadores, para que encontrem o caminho da conversão e da reconciliação. Ajudai-nos a reconhecer nossas faltas com humildade e a buscar sinceramente o perdão do Senhor.\n\nQue jamais nos acostumemos ao pecado, mas desejemos sempre uma vida nova na graça de Deus."
        }
      ]
    },
    {
      day: 6,
      title: "Nossa Senhora das Graças, Fonte de Esperança",
      body: [
        {
          text:
            "Ó Senhora das Graças, em tempos de dificuldade sois sinal de esperança para o povo de Deus. Quando tudo parece escuro, lembrai-nos de que Deus nunca abandona Seus filhos.\n\nRenovai nossa confiança e ajudai-nos a perseverar na fé, mesmo diante das provações. Que aprendamos a esperar com paciência e a confiar que o Senhor age no tempo certo.\n\nSustentai-nos com vossa presença materna e conduzi-nos sempre pelo caminho do bem."
        }
      ]
    },
    {
      day: 7,
      title: "Nossa Senhora das Graças, Intercessora Poderosa",
      body: [
        {
          text:
            "Ó Mãe Santíssima, vossa intercessão junto a Deus é cheia de amor e poder. Apresentai ao Senhor nossas súplicas, necessidades e intenções mais profundas.\n\nSabemos que nada pedimos em vão quando confiamos em vós. Alcançai-nos as graças que mais necessitamos, sobretudo aquelas que nos conduzem à salvação e à santidade.\n\nAumentai nossa confiança na oração e ensinai-nos a nunca desistir de rezar."
        }
      ]
    },
    {
      day: 8,
      title: "Nossa Senhora das Graças, Exemplo de Amor e Serviço",
      body: [
        {
          text:
            "Ó Virgem Maria, vossa vida foi inteiramente dedicada ao amor e ao serviço de Deus e dos irmãos. Em tudo buscastes fazer a vontade do Pai.\n\nEnsinai-nos a viver a caridade no dia a dia, sendo pacientes, generosos e atentos às necessidades dos outros. Que nossa fé se manifeste em gestos concretos de amor, perdão e solidariedade.\n\nFazei de nós instrumentos das graças de Deus na vida daqueles que encontramos."
        }
      ]
    },
    {
      day: 9,
      title: "Nossa Senhora das Graças, Mãe e Protetora",
      body: [
        {
          text:
            "Ó Mãe querida, acolhei esta novena que rezamos com fé e confiança. Recebei nossas orações e apresentai-as a Deus, para que sejamos atendidos conforme Sua santa vontade.\n\nConsagrai-nos ao vosso coração materno, protegei nossas famílias e conduzi-nos sempre a Jesus. Que nunca nos afastemos do caminho da fé e que vivamos sob vossa constante proteção.\n\nObrigado, Mãe das Graças, por vossa presença em nossa vida."
        }
      ]
    }
  ]
};


novena-api/src/data/novenas/template-mascara.js

module.exports = {
  id: "novena-SEU-ID-AQUI",
  meta: {
    nome: "Novena - SEU NOME AQUI",
    periodo: { inicio: "MM-DD", fim: "MM-DD" },
    mes: "MÊS",
    type: "novena",
    daysCount: 9,
    label: "DESCRIÇÃO CURTA"
  },

  localTexts: {
    inicial: {
      title: "Oração inicial (todos os dias)",
      content: "COLE AQUI SUA ORAÇÃO INICIAL (DA NOVENA)"
    },
    final: {
      title: "Oração final (todos os dias)",
      content: "COLE AQUI SUA ORAÇÃO FINAL (DA NOVENA)"
    }
  },

  defaults: {
    opening: [{ ref: "local:inicial" }],
    closing: [
      { rubric: "Pedido pessoal" },
      { ref: "global:pn" },
      { ref: "global:am" },
      { ref: "global:gp" },
      { ref: "local:final" }
    ]
  },

  days: [
    { day: 1, title: "TÍTULO DO DIA 1", body: [{ text: "TEXTO DO DIA 1 (miolo)" }] },
    { day: 2, title: "TÍTULO DO DIA 2", body: [{ text: "TEXTO DO DIA 2 (miolo)" }] },
    { day: 3, title: "TÍTULO DO DIA 3", body: [{ text: "TEXTO DO DIA 3 (miolo)" }] },
    { day: 4, title: "TÍTULO DO DIA 4", body: [{ text: "TEXTO DO DIA 4 (miolo)" }] },
    { day: 5, title: "TÍTULO DO DIA 5", body: [{ text: "TEXTO DO DIA 5 (miolo)" }] },
    { day: 6, title: "TÍTULO DO DIA 6", body: [{ text: "TEXTO DO DIA 6 (miolo)" }] },
    { day: 7, title: "TÍTULO DO DIA 7", body: [{ text: "TEXTO DO DIA 7 (miolo)" }] },
    { day: 8, title: "TÍTULO DO DIA 8", body: [{ text: "TEXTO DO DIA 8 (miolo)" }] },
    { day: 9, title: "TÍTULO DO DIA 9", body: [{ text: "TEXTO DO DIA 9 (miolo)" }] }

  ]
};

# COMO RODAR:
# 1) dentro da pasta novena-api:
#    npm install
#    npm run dev
#
# TESTES:
# - GET http://localhost:3000/novenas
# - GET http://localhost:3000/novenas/novena-nossa-senhora-das-gracas
# - GET http://localhost:3000/novenas/novena-nossa-senhora-das-gracas/dias/1?expand=1
# - GET http://localhost:3000/novenas/novena-nossa-senhora-das-gracas/dias/1?expand=0
# - GET http://localhost:3000/texts/global
# - GET http://localhost:3000/texts/global/pn
