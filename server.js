/**
 * NOVENA API (arquivo único)
 * --------------------------------------------
 * Como rodar:
 * 1) npm init -y
 * 2) npm i express better-sqlite3 helmet morgan slugify zod
 * 3) node server.js
 *
 * API em: http://localhost:3000
 *
 * Endpoints:
 * GET    /health
 * GET    /novenas?q=&limit=&offset=
 * POST   /novenas
 * GET    /novenas/:idOrSlug?includeDays=true
 * PATCH  /novenas/:idOrSlug
 * DELETE /novenas/:idOrSlug
 *
 * GET    /novenas/:idOrSlug/dias
 * PUT    /novenas/:idOrSlug/dias/:diaNumero
 * DELETE /novenas/:idOrSlug/dias/:diaNumero
 * GET    /novenas/:idOrSlug/dias/:diaNumero/roteiro
 */



const express = require("express");
const helmet = require("helmet");
const morgan = require("morgan");
const slugify = require("slugify");
const { z } = require("zod");
const Database = require("better-sqlite3");

// ---------- Config ----------
const PORT = process.env.PORT || 3000;
const DB_PATH = process.env.DB_PATH || "./data.sqlite";

// ---------- Helpers ----------
function makeSlug(str) {
  return slugify(str, { lower: true, strict: true, trim: true });
}
function nowISO() {
  return new Date().toISOString();
}
function isNumericId(x) {
  return /^\d+$/.test(String(x));
}

// ---------- DB ----------
const db = new Database(DB_PATH);
db.pragma("foreign_keys = ON");

db.exec(`
CREATE TABLE IF NOT EXISTS novenas (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT NOT NULL UNIQUE,
  titulo TEXT NOT NULL,
  periodo_inicio TEXT,
  periodo_fim TEXT,
  subtitulo TEXT,
  como_rezar TEXT,
  sinal_da_cruz TEXT,
  oracao_inicial TEXT,
  oracao_final TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS novena_dias (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  novena_id INTEGER NOT NULL,
  dia_numero INTEGER NOT NULL CHECK (dia_numero >= 1 AND dia_numero <= 9),
  titulo TEXT NOT NULL,
  texto TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (novena_id) REFERENCES novenas(id) ON DELETE CASCADE,
  UNIQUE (novena_id, dia_numero)
);

CREATE INDEX IF NOT EXISTS idx_novenas_slug ON novenas(slug);
CREATE INDEX IF NOT EXISTS idx_dias_novena_id ON novena_dias(novena_id);
`);

// ---------- Seed (2 exemplos enviados) ----------
const COMO_REZAR_PADRAO = `Sinal da Cruz
Oração Inicial
Oração do Dia
Pedido pessoal
Pai-Nosso
Ave-Maria
Glória ao Pai
Oração Final`;

const SINAL_DA_CRUZ_PADRAO = `Em nome do Pai, do Filho e do Espírito Santo. Amém.`;

function upsertNovena(n) {
  const existing = db.prepare("SELECT * FROM novenas WHERE slug = ?").get(n.slug);
  if (!existing) {
    const info = db
      .prepare(`
        INSERT INTO novenas
        (slug, titulo, periodo_inicio, periodo_fim, subtitulo, como_rezar, sinal_da_cruz, oracao_inicial, oracao_final, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `)
      .run(
        n.slug,
        n.titulo,
        n.periodo_inicio ?? null,
        n.periodo_fim ?? null,
        n.subtitulo ?? null,
        n.como_rezar ?? null,
        n.sinal_da_cruz ?? null,
        n.oracao_inicial ?? null,
        n.oracao_final ?? null,
        nowISO()
      );
    return db.prepare("SELECT * FROM novenas WHERE id = ?").get(info.lastInsertRowid);
  }

  db.prepare(`
    UPDATE novenas SET
      titulo = ?, periodo_inicio = ?, periodo_fim = ?, subtitulo = ?,
      como_rezar = ?, sinal_da_cruz = ?, oracao_inicial = ?, oracao_final = ?,
      updated_at = ?
    WHERE id = ?
  `).run(
    n.titulo,
    n.periodo_inicio ?? null,
    n.periodo_fim ?? null,
    n.subtitulo ?? null,
    n.como_rezar ?? null,
    n.sinal_da_cruz ?? null,
    n.oracao_inicial ?? null,
    n.oracao_final ?? null,
    nowISO(),
    existing.id
  );

  return db.prepare("SELECT * FROM novenas WHERE id = ?").get(existing.id);
}

function upsertDia(novenaId, dia_numero, titulo, texto) {
  const existing = db
    .prepare("SELECT * FROM novena_dias WHERE novena_id = ? AND dia_numero = ?")
    .get(novenaId, dia_numero);

  if (!existing) {
    db.prepare(`
      INSERT INTO novena_dias (novena_id, dia_numero, titulo, texto, updated_at)
      VALUES (?, ?, ?, ?, ?)
    `).run(novenaId, dia_numero, titulo, texto, nowISO());
  } else {
    db.prepare(`
      UPDATE novena_dias SET titulo = ?, texto = ?, updated_at = ?
      WHERE novena_id = ? AND dia_numero = ?
    `).run(titulo, texto, nowISO(), novenaId, dia_numero);
  }
}

function seedIfEmpty() {
  const count = db.prepare("SELECT COUNT(*) AS c FROM novenas").get().c;
  if (count > 0) return;

  // 1) Nossa Senhora das Graças
  const nsGracas = upsertNovena({
    slug: makeSlug("NOVENA DE NOSSA SENHORA DAS GRAÇAS"),
    titulo: "NOVENA DE NOSSA SENHORA DAS GRAÇAS",
    periodo_inicio: "29/11",
    periodo_fim: "07/12",
    subtitulo: "A força dos humildes e a intercessora poderosa a quem Deus nada nega",
    como_rezar: COMO_REZAR_PADRAO,
    sinal_da_cruz: SINAL_DA_CRUZ_PADRAO,
    oracao_inicial: `Ó Maria Santíssima, Mãe de Deus e nossa Mãe, que aparecestes a Santa Catarina Labouré como Nossa Senhora das Graças, cheios de confiança recorremos a vós. Vós vos manifestastes como a Mãe que derrama graças abundantes sobre todos os que as pedem com fé e humildade.

Vinde em nosso auxílio, Mãe bondosa. Abri nosso coração para acolher a misericórdia de Deus e concedei-nos a graça de rezar esta novena com fé sincera, confiança filial e verdadeiro desejo de conversão. Que, por vossa intercessão poderosa, possamos receber as graças necessárias para nossa vida espiritual, corporal e para a nossa salvação eterna, se assim for da vontade de Deus.
Amém.`,
    oracao_final: `Ó Maria concebida sem pecado, rogai por nós que recorremos a vós.
Ó Nossa Senhora das Graças, derramai sobre nós as graças de que necessitamos para viver na fé, na esperança e no amor.
Sede nossa Mãe, nossa proteção e nosso refúgio, hoje e sempre.
Amém.`
  });

  upsertDia(
    nsGracas.id,
    1,
    "PRIMEIRO DIA – NOSSA SENHORA DAS GRAÇAS, CANAL DAS BÊNÇÃOS DE DEUS",
    `Ó Nossa Senhora das Graças, Deus vos escolheu como canal por onde Sua misericórdia se derrama sobre a humanidade. Os raios que saem de vossas mãos representam as graças que o Senhor concede àqueles que confiam em vossa intercessão materna.

Ajudai-nos a reconhecer que toda graça vem de Deus, mas que Ele quis contar convosco para nos aproximar ainda mais de Seu amor. Ensinai-nos a viver em atitude de gratidão, reconhecendo diariamente os dons que recebemos, mesmo aqueles que passam despercebidos.

Que nunca nos esqueçamos de recorrer a vós nas necessidades da alma e do corpo, certos de que uma Mãe jamais abandona seus filhos.

(Fazer o pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    nsGracas.id,
    2,
    "SEGUNDO DIA – NOSSA SENHORA DAS GRAÇAS, MÃE MISERICORDIOSA",
    `Ó Mãe cheia de ternura, vosso coração está sempre aberto para acolher nossos sofrimentos, quedas e fragilidades. Conheceis nossas dores mais profundas e nossas lutas silenciosas.

Quando nos sentimos indignos ou afastados de Deus, ensinai-nos a confiar na Sua misericórdia infinita. Levai-nos pela mão de volta ao caminho da graça, ajudando-nos a acreditar que o amor de Deus é maior do que qualquer pecado.

Sede nosso refúgio nos momentos de angústia e nossa esperança quando tudo parecer perdido.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    nsGracas.id,
    3,
    "TERCEIRO DIA – NOSSA SENHORA DAS GRAÇAS, MODELO DE FÉ",
    `Ó Virgem Santíssima, vossa fé foi plena, humilde e constante. Mesmo sem compreender todos os mistérios, confiastes totalmente na Palavra de Deus e permanecestes firmes até aos pés da cruz.

Ensinai-nos a ter uma fé viva, que não dependa apenas de milagres, mas que se sustente também nas provações. Fortalecei-nos quando somos tentados a desanimar e ajudai-nos a permanecer fiéis ao Senhor em todos os momentos.

Que aprendamos convosco a acreditar, esperar e amar, mesmo nas noites mais escuras da vida.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    nsGracas.id,
    4,
    "QUARTO DIA – NOSSA SENHORA DAS GRAÇAS, REFÚGIO DOS AFLITOS",
    `Ó Mãe compassiva, sois o consolo dos que sofrem, a força dos fracos e a esperança dos desanimados. A vós recorremos quando o peso da vida parece maior do que nossas forças.

Acolhei em vosso coração materno todos os que enfrentam doenças, dores emocionais, angústias espirituais e dificuldades familiares. Alcançai-nos a graça da paz interior e da confiança no amor de Deus.

Ensinai-nos a oferecer nossos sofrimentos unidos aos de Cristo, certos de que nenhuma dor é inútil quando colocada nas mãos do Senhor.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    nsGracas.id,
    5,
    "QUINTO DIA – NOSSA SENHORA DAS GRAÇAS, PROTETORA DOS PECADORES",
    `Ó Mãe cheia de misericórdia, vós não rejeitais nenhum de vossos filhos. Mesmo quando nos afastamos de Deus, vosso olhar permanece cheio de amor e esperança.

Intercedei pelos pecadores, para que encontrem o caminho da conversão e da reconciliação. Ajudai-nos a reconhecer nossas faltas com humildade e a buscar sinceramente o perdão do Senhor.

Que jamais nos acostumemos ao pecado, mas desejemos sempre uma vida nova na graça de Deus.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    nsGracas.id,
    6,
    "SEXTO DIA – NOSSA SENHORA DAS GRAÇAS, FONTE DE ESPERANÇA",
    `Ó Senhora das Graças, em tempos de dificuldade sois sinal de esperança para o povo de Deus. Quando tudo parece escuro, lembrai-nos de que Deus nunca abandona Seus filhos.

Renovai nossa confiança e ajudai-nos a perseverar na fé, mesmo diante das provações. Que aprendamos a esperar com paciência e a confiar que o Senhor age no tempo certo.

Sustentai-nos com vossa presença materna e conduzi-nos sempre pelo caminho do bem.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    nsGracas.id,
    7,
    "SÉTIMO DIA – NOSSA SENHORA DAS GRAÇAS, INTERCESSORA PODEROSA",
    `Ó Mãe Santíssima, vossa intercessão junto a Deus é cheia de amor e poder. Apresentai ao Senhor nossas súplicas, necessidades e intenções mais profundas.

Sabemos que nada pedimos em vão quando confiamos em vós. Alcançai-nos as graças que mais necessitamos, sobretudo aquelas que nos conduzem à salvação e à santidade.

Aumentai nossa confiança na oração e ensinai-nos a nunca desistir de rezar.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    nsGracas.id,
    8,
    "OITAVO DIA – NOSSA SENHORA DAS GRAÇAS, EXEMPLO DE AMOR E SERVIÇO",
    `Ó Virgem Maria, vossa vida foi inteiramente dedicada ao amor e ao serviço de Deus e dos irmãos. Em tudo buscastes fazer a vontade do Pai.

Ensinai-nos a viver a caridade no dia a dia, sendo pacientes, generosos e atentos às necessidades dos outros. Que nossa fé se manifeste em gestos concretos de amor, perdão e solidariedade.

Fazei de nós instrumentos das graças de Deus na vida daqueles que encontramos.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    nsGracas.id,
    9,
    "NONO DIA – NOSSA SENHORA DAS GRAÇAS, MÃE E PROTETORA",
    `Ó Mãe querida, acolhei esta novena que rezamos com fé e confiança. Recebei nossas orações e apresentai-as a Deus, para que sejamos atendidos conforme Sua santa vontade.

Consagrai-nos ao vosso coração materno, protegei nossas famílias e conduzi-nos sempre a Jesus. Que nunca nos afastemos do caminho da fé e que vivamos sob vossa constante proteção.

Obrigado, Mãe das Graças, por vossa presença em nossa vida.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  // 2) Imaculada Conceição
  const imaculada = upsertNovena({
    slug: makeSlug("NOVENA DA IMACULADA CONCEIÇÃO"),
    titulo: "NOVENA DA IMACULADA CONCEIÇÃO",
    periodo_inicio: "18/11",
    periodo_fim: "27/11",
    subtitulo: "A fonte inesgotável de favores celestiais para quem não vê mais saída nos problemas terreno",
    como_rezar: COMO_REZAR_PADRAO,
    sinal_da_cruz: SINAL_DA_CRUZ_PADRAO,
    oracao_inicial: `Ó Maria Santíssima, Virgem Imaculada, concebida sem a mancha do pecado original, Mãe de Deus e nossa Mãe, cheios de confiança recorremos a vós. Desde toda a eternidade fostes escolhida pelo Pai para ser a morada pura do Seu Filho, preservada pelo poder da graça e cheia do Espírito Santo.

Olhai por nós, Mãe Imaculada, e concedei-nos a graça de rezar esta novena com fé sincera, coração humilde e verdadeiro desejo de conversão. Que, por vossa poderosa intercessão, possamos alcançar as graças que necessitamos para nossa vida e salvação, se assim for da vontade de Deus.
Amém.`,
    oracao_final: `Ó Maria concebida sem pecado, rogai por nós que recorremos a vós.
Ó Imaculada Conceição, sede nossa Mãe, nossa proteção e nosso refúgio, hoje e sempre.
Amém.`
  });

  upsertDia(
    imaculada.id,
    1,
    "PRIMEIRO DIA – MARIA, ESCOLHIDA POR DEUS",
    `Ó Imaculada Conceição, antes mesmo da criação do mundo, Deus já vos havia escolhido para ser a Mãe do Salvador. Toda a vossa vida foi marcada pela ação da graça divina e pela total entrega à vontade do Pai.

Em vós contemplamos o plano perfeito de Deus, que age com amor e sabedoria em favor da humanidade. Mesmo antes do vosso nascimento, fostes preparada para cumprir uma missão única e sublime.

Ajudai-nos a compreender que também somos chamados por Deus e que nossa vida tem um propósito. Ensinai-nos a confiar nos desígnios do Senhor, mesmo quando não os compreendemos plenamente.

(Fazer o pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    imaculada.id,
    2,
    "SEGUNDO DIA – MARIA, CHEIA DE GRAÇA",
    `Ó Virgem Imaculada, o anjo vos saudou como “cheia de graça”, pois em vós a graça de Deus agiu de forma plena e perfeita. Preservada de todo pecado, fostes sinal da vitória do amor divino sobre o mal.

Ajudai-nos a rejeitar tudo aquilo que nos afasta de Deus e a buscar uma vida santa, guiada pela graça. Que, a vosso exemplo, possamos crescer diariamente no amor ao Senhor e no desejo sincero de conversão.

Ensinai-nos a valorizar a vida de graça recebida no Batismo e a vivê-la com fidelidade.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    imaculada.id,
    3,
    "TERCEIRO DIA – MARIA, HUMILDE SERVA DO SENHOR",
    `Ó Mãe Imaculada, mesmo sendo elevada por Deus acima de todas as criaturas, vos declarastes apenas Sua serva. Vossa humildade agradou ao Senhor e fez de vós instrumento dócil em Suas mãos.

Ensinai-nos a verdadeira humildade, que não busca honras nem reconhecimento, mas deseja apenas servir com amor. Livrai-nos do orgulho e da vaidade, que tantas vezes nos afastam da graça de Deus.

Que saibamos viver com simplicidade, caridade e espírito de serviço.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    imaculada.id,
    4,
    "QUARTO DIA – MARIA, OBEDIENTE À VONTADE DIVINA",
    `Ó Virgem fiel, aceitastes o plano de Deus com plena confiança e sem reservas. Vosso “faça-se” ecoa até hoje como exemplo de obediência e fé.

Ajudai-nos a confiar no Senhor, especialmente nos momentos de dificuldade, quando a dor e a dúvida visitam nosso coração. Ensinai-nos a dizer, todos os dias, com amor e entrega: “faça-se em mim segundo a Tua Palavra”.

Que aprendamos convosco a acolher a vontade de Deus como caminho de salvação.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    imaculada.id,
    5,
    "QUINTO DIA – MARIA, MÃE DO SALVADOR",
    `Ó Imaculada Conceição, em vosso ventre puro o Verbo se fez carne para a salvação da humanidade. Fostes escolhida para trazer ao mundo Aquele que é o Caminho, a Verdade e a Vida.

Ajudai-nos a acolher Jesus em nosso coração e em nossa vida. Que Ele seja o centro de nossas escolhas, palavras e ações.

Conduzi-nos sempre para mais perto de vosso Filho e ensinai-nos a amá-Lo acima de todas as coisas.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    imaculada.id,
    6,
    "SEXTO DIA – MARIA, MODELO DE FÉ",
    `Ó Mãe da fé, mesmo sem compreender plenamente os mistérios de Deus, acreditastes em Suas promessas. Permanecestes firme na esperança, mesmo nas horas de maior sofrimento.

Fortalecei nossa fé nos momentos de provação, quando somos tentados a desanimar. Que nunca nos afastemos do Senhor, mas confiemos plenamente em Sua misericórdia.

Ensinai-nos a viver uma fé sincera, perseverante e confiante.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    imaculada.id,
    7,
    "SÉTIMO DIA – MARIA, MÃE DE MISERICÓRDIA",
    `Ó Imaculada Conceição, sois refúgio dos pecadores e consoladora dos aflitos. Vosso coração materno está sempre aberto para acolher nossos sofrimentos e fragilidades.

Intercedei por todos os que sofrem, pelos doentes, pelos pobres, pelos aflitos e pelos que perderam a esperança. Alcançai-nos a graça da conversão, da paz e da confiança em Deus.

Que jamais nos afastemos de vosso amor materno.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    imaculada.id,
    8,
    "OITAVO DIA – MARIA, ESPERANÇA DOS CRISTÃOS",
    `Ó Virgem Imaculada, em vós contemplamos a vitória da graça sobre o pecado e a certeza da vida nova prometida por Deus.

Renovai nossa esperança para que nunca desistamos do bem nem da busca pela santidade. Sustentai-nos nas dificuldades e conduzi-nos firmes no caminho que leva ao Céu.

Que, confiantes em vossa intercessão, caminhemos sempre na luz do Senhor.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    imaculada.id,
    9,
    "NONO DIA – MARIA, NOSSA MÃE E INTERCESSORA",
    `Ó Mãe Santíssima, acolhei esta novena que rezamos com amor e confiança. Apresentai nossos pedidos a Deus e alcançai-nos as graças necessárias para nossa vida espiritual e salvação.

Consagrai-nos inteiramente ao vosso Coração Imaculado. Protegei nossas famílias, fortalei nossa fé e conduzi-nos sempre a Jesus.

Obrigado, Mãe Imaculada, por vosso amor e proteção.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

//novena de natal

  const natal = upsertNovena({
    slug: makeSlug("NOVENA DE NATAL"),
    titulo: "NOVENA DE NATAL",
    periodo_inicio: "16/12",
    periodo_fim: "24/12",
    subtitulo: "Preparando o coração para o nascimento de Jesus",
    como_rezar: COMO_REZAR_PADRAO,
    sinal_da_cruz: SINAL_DA_CRUZ_PADRAO,
    oracao_inicial: `Senhor Deus, Pai de amor e misericórdia, ao nos aproximarmos da festa do Natal, preparamos nosso coração para acolher o mistério do Vosso Filho que se fez homem por amor a nós. Enviai sobre nós o Vosso Espírito Santo, para que esta novena seja tempo de graça, conversão e esperança.

Que, ao meditarmos o nascimento de Jesus, possamos abrir nossa vida à Sua presença salvadora. Concedei-nos a graça de viver este tempo com fé sincera, amor verdadeiro e profunda alegria cristã, para que o Natal do Senhor produza frutos abundantes em nossa vida.
Amém.`,

    oracao_final: `Senhor Jesus, que Vos fizestes pequeno por amor a nós, ajudai-nos a viver o verdadeiro espírito do Natal.
Enchei nosso coração de fé, esperança e caridade.
Que a alegria do Vosso nascimento permaneça em nossa vida, hoje e sempre.
Amém.`
  });

  upsertDia(
    natal.id,
    1,
    "PRIMEIRO DIA – O TEMPO DA ESPERA",
    `Senhor Jesus, durante séculos o povo de Deus aguardou com esperança a vinda do Salvador. A história da salvação é marcada pela promessa e pela confiança no cumprimento da Palavra de Deus.

Neste primeiro dia da novena, ensinai-nos a viver o tempo da espera com paciência e fé. Ajudai-nos a compreender que o Natal não é apenas uma data, mas um convite a esperar o Senhor todos os dias, com o coração vigilante e aberto.

Que saibamos esperar com esperança, confiantes de que Deus jamais abandona Seu povo.

(Fazer o pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    natal.id,
    2,
    "SEGUNDO DIA – A PROMESSA DE DEUS",
    `Senhor Deus, fiel às Suas promessas, anunciastes desde o início a vinda do Messias. Vossos profetas prepararam o caminho para o Salvador, alimentando a esperança do povo.

Ajudai-nos a confiar em Vossa Palavra, mesmo quando o tempo passa e as promessas parecem distantes. Fortalecei nossa fé para que jamais duvidemos de Vosso amor e de Vosso cuidado.

Que o Natal renove em nós a certeza de que Deus cumpre tudo o que promete.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    natal.id,
    3,
    "TERCEIRO DIA –MARIA, MÃE DO SALVADOR",
    `Virgem Maria, escolhida para ser a Mãe do Filho de Deus, vós acolhestes o anúncio do anjo com humildade e confiança. Em vosso “sim”, a salvação entrou no mundo.

Ensinai-nos a acolher Jesus em nossa vida com a mesma fé e disponibilidade. Que nosso coração seja uma morada digna para o Salvador que vem ao nosso encontro.

Acompanhai-nos neste caminho de preparação para o Natal do Senhor.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    natal.id,
    4,
    "QUARTO DIA – JOSÉ, HOMEM JUSTO E FIEL",
    `São José, homem justo e silencioso, fostes escolhido para proteger a Sagrada Família. Com confiança, aceitastes a vontade de Deus e cuidastes de Maria e do Menino Jesus.

Ensinai-nos a obedecer a Deus com fidelidade, mesmo quando não compreendemos Seus planos. Ajudai-nos a viver com responsabilidade, amor e espírito de serviço.

Que, a vosso exemplo, saibamos confiar plenamente no Senhor.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    natal.id,
    5,
    "QUINTO DIA – MARIA, O CAMINHO ATÉ BELÉM",
    `Senhor Jesus, Maria e José enfrentaram dificuldades e incertezas no caminho até Belém. Mesmo cansados, confiaram na providência de Deus.

Ajudai-nos a perseverar nas dificuldades da vida, confiantes de que o Senhor caminha conosco. Que possamos transformar nossos desafios em oportunidades de fé e crescimento espiritual.

Preparai nosso coração para acolher-Vos com simplicidade e amor.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    natal.id,
    6,
    "SEXTO DIA – O NASCIMENTO DO SALVADOR",
    `Menino Jesus, nascido na simplicidade de uma manjedoura, viestes ao mundo para nos revelar o amor infinito de Deus. Escolhestes a pobreza e a humildade para nos ensinar o verdadeiro valor da vida.

Ajudai-nos a reconhecer Vossa presença nos pequenos gestos, nas pessoas simples e nas situações do dia a dia. Que o Natal nos ensine a viver com mais amor, partilha e solidariedade.

Que possamos acolher-Vos com alegria e gratidão.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    natal.id,
    7,
    "SÉTIMO DIA – MARIA, OS PASTORES, OS PRIMEIROS A ADORAR",
    `Senhor Jesus, os pastores, simples e humildes, foram os primeiros a receber o anúncio do Vosso nascimento. Com alegria, foram ao Vosso encontro e Vos adoraram.

Ensinai-nos a ter um coração simples e disponível, capaz de reconhecer Vossa presença. Ajudai-nos a escutar a voz de Deus e a responder com prontidão ao Seu chamado.

Que nossa vida seja um testemunho vivo do Vosso amor.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    natal.id,
    8,
    "OITAVO DIA – A LUZ QUE ILUMINA O MUNDO",
    `Jesus, Luz do mundo, viestes para dissipar as trevas do pecado e da desesperança. Vosso nascimento trouxe ao mundo a luz da salvação.

Iluminai nosso caminho e afastai de nós tudo aquilo que nos impede de viver como filhos da luz. Que o Natal renove em nós o desejo de viver segundo o Evangelho.

Fazei-nos instrumentos da Vossa luz no mundo.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    natal.id,
    9,
    "NONO DIA – O NATAL EM NOSSO CORAÇÃO",
    `Senhor Jesus, ao final desta novena, desejamos preparar em nosso coração um lugar para Vosso nascimento. Que não falte espaço para o amor, o perdão e a paz.

Transformai nossa vida com Vossa presença e fazei de nosso lar um sinal da Vossa paz. Que o Natal não seja apenas uma celebração exterior, mas um verdadeiro encontro convosco.

Vinde, Senhor Jesus, nascer em nosso coração.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

//  NOVENA A SANTA MARIA, MÃE DE DEUS

const stamaria = upsertNovena({
    slug: makeSlug("NOVENA A SANTA MARIA, MÃE DE DEUS  "),
    titulo: "NOVENA A SANTA MARIA, MÃE DE DEUS  ",
    periodo_inicio: "24/12",
    periodo_fim: "01/01",
    subtitulo: "Santa Maria, Mãe de Deus e nossa Mãe",
    como_rezar: COMO_REZAR_PADRAO,
    sinal_da_cruz: SINAL_DA_CRUZ_PADRAO,
    oracao_inicial: `Ó Santa Maria, Mãe de Deus e nossa Mãe, escolhida pelo Pai para dar ao mundo o Seu Filho amado, nós vos louvamos e bendizemos pelo grande mistério da Encarnação. Em vosso seio virginal, o Verbo eterno se fez carne para a salvação da humanidade.

Acolhei-nos como vossos filhos e ensinai-nos a amar Jesus como vós O amastes. Concedei-nos a graça de rezar esta novena com fé sincera, coração humilde e espírito de confiança, para que, por vossa intercessão materna, alcancemos as graças de que necessitamos para nossa vida e salvação, conforme a vontade de Deus.
Amém.`,
    oracao_final: `Ó Santa Maria, Mãe de Deus, rogai por nós.
Sede nossa Mãe, nossa proteção e nosso refúgio.
Conduzi-nos sempre a Jesus, caminho, verdade e vida.
Amém.`
  });

  upsertDia(
    stamaria.id,
    1,
    "PRIMEIRO DIA – MARIA, MÃE DE DEUS",
    `Ó Santa Maria, proclamada Mãe de Deus pela Igreja, reconhecemos em vós o grande mistério do amor divino. Em vosso seio, Aquele que é Deus eterno assumiu nossa humanidade para nos salvar.

Ajudai-nos a contemplar com reverência esse mistério de fé e a reconhecer a grandeza do amor de Deus por nós. Que nossa vida seja resposta agradecida a esse dom tão sublime.

Ensinai-nos a honrar-vos como Mãe de Deus e nossa Mãe, confiando sempre em vossa proteção.

(Fazer o pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    stamaria.id,
    2,
    "SEGUNDO DIA – MARIA, MÃE DA VIDA",
    `Ó Mãe Santíssima, em vosso seio o Autor da vida tomou carne. Vós acolhestes com amor e cuidado Aquele que veio trazer vida nova à humanidade.

Ajudai-nos a respeitar e defender a vida em todas as suas fases. Ensinai-nos a cuidar com amor daqueles que nos foram confiados e a valorizar o dom da vida como graça de Deus.

Que aprendamos a viver com gratidão e responsabilidade diante da vida.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    stamaria.id,
    3,
    "TERCEIRO DIA – MARIA, MÃE DA FÉ",
    `Ó Virgem fiel, vossa fé sustentou cada passo de vossa missão. Mesmo sem compreender plenamente os desígnios de Deus, confiastes inteiramente em Sua Palavra.

Ensinai-nos a viver uma fé firme, capaz de permanecer mesmo nas dificuldades e provações. Ajudai-nos a confiar no Senhor quando o caminho parece escuro.

Que nossa fé cresça a cada dia, sustentada pela oração e pela confiança em Deus.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    stamaria.id,
    4,
    "QUARTO DIA – MARIA, MÃE DA ESPERANÇA",
    `Ó Mãe cheia de esperança, mesmo diante das incertezas, guardastes no coração a certeza das promessas de Deus.

Renovai nossa esperança quando somos tentados ao desânimo. Ajudai-nos a confiar que Deus age em nosso favor, mesmo quando não percebemos.

Que aprendamos a esperar com paciência e perseverança, certos do amor fiel do Senhor.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    stamaria.id,
    5,
    "QUINTO DIA – MARIA, MÃE DO AMOR",
    `Ó Santa Maria, vosso coração esteve sempre aberto ao amor de Deus e ao amor pelos irmãos. Em vossa vida, o amor foi vivido com entrega total e fidelidade.

Ensinai-nos a amar como Jesus nos ensinou, com generosidade, perdão e misericórdia. Ajudai-nos a viver a caridade no dia a dia, especialmente com aqueles que mais precisam.

Que sejamos sinais do amor de Deus no mundo.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    stamaria.id,
    6,
    "SEXTO DIA – MARIA, MÃE DOS SOFREDORES",
    `Ó Mãe dolorosa, que estivestes ao pé da cruz, conhecendo a dor e o sofrimento, olhai com compaixão para todos os que sofrem.

Intercedei pelos doentes, aflitos, abandonados e desesperançados. Alcançai-lhes conforto, força e paz.

Ajudai-nos a unir nossos sofrimentos aos de Cristo, oferecendo-os com fé e confiança.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    stamaria.id,
    7,
    "SÉTIMO DIA – MARIA, MÃE DA IGREJA",
    `Ó Mãe Santíssima, confiada por Jesus como Mãe de todos os discípulos, acompanhastes a Igreja nascente com oração e amor.

Intercedei pelo Papa, pelos bispos, sacerdotes, religiosos e por todo o povo de Deus. Ajudai-nos a amar a Igreja e a viver nossa fé em comunhão.

Que sejamos fiéis ao Evangelho e testemunhas do amor de Cristo no mundo.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    stamaria.id,
    8,
    "OITAVO DIA – MARIA, MÃE DA PAZ",
    `Ó Rainha da Paz, em vossos braços o Príncipe da Paz veio ao mundo. Vosso coração é fonte de serenidade e reconciliação.

Intercedei pela paz em nossas famílias, comunidades e no mundo inteiro. Ajudai-nos a ser instrumentos de paz, promovendo o diálogo, o perdão e a reconciliação.

Que a paz de Cristo reine em nossos corações.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    stamaria.id,
    9,
    "NONO DIA – MARIA, NOSSA MÃE E INTERCESSORA",
    `Ó Santa Maria, Mãe de Deus e nossa Mãe, acolhei esta novena que rezamos com fé e amor. Apresentai a Deus nossos pedidos e necessidades.

Consagrai-nos ao vosso coração materno e conduzi-nos sempre a Jesus. Protegei nossas famílias e fortalecei nossa caminhada cristã.

Obrigado, Mãe querida, por vosso cuidado constante e por vossa intercessão poderosa.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  // NOVENA DA EPIFANIA

  const epifania = upsertNovena({
    slug: makeSlug("NOVENA DA EPIFANIA DO SENHOR"),
    titulo: "NOVENA DA EPIFANIA DO SENHOR",
    periodo_inicio: "28/12",
    periodo_fim: "05/01",
    subtitulo: "O Menino se revela como luz das nações",
    como_rezar: COMO_REZAR_PADRAO,
    sinal_da_cruz: SINAL_DA_CRUZ_PADRAO,
    oracao_inicial: `Senhor Deus, Pai de bondade, na Epifania Vosso Filho se manifestou como luz para todos os povos, revelando-se não apenas a Israel, mas a toda a humanidade. Nós Vos louvamos por esse mistério de amor, no qual Jesus Cristo é reconhecido como Salvador do mundo inteiro.

Concedei-nos a graça de rezar esta novena com fé sincera e coração aberto, para que possamos reconhecer a presença do Vosso Filho em nossa vida. Que, iluminados por Sua luz, caminhemos com confiança no caminho da salvação e sejamos testemunhas do Vosso amor no mundo.
Amém.`,
    oracao_final: `Senhor Jesus Cristo, luz das nações, iluminai nosso coração e nossa vida.
Conduzi-nos sempre pelo caminho da verdade e da salvação.
Que, guiados por Vossa luz, possamos um dia contemplar-Vos face a face na glória do Céu.
Amém.`
  });

  upsertDia(
    epifania.id,
    1,
    "PRIMEIRO DIA – JESUS, LUZ PARA TODAS AS NAÇÕES",
    `Senhor Jesus, na Epifania Vos manifestastes como luz que brilha para todos os povos, sem distinção. Vossa presença ilumina as trevas do pecado e da ignorância, trazendo esperança e salvação.

Ajudai-nos a acolher Vossa luz em nossa vida e a permitir que ela transforme nosso coração. Que nunca nos acostumemos à escuridão, mas busquemos sempre caminhar na verdade e no amor.

Iluminai nossas escolhas e conduzi-nos pelo caminho da vida eterna.

(Fazer o pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    epifania.id,
    2,
    "SEGUNDO DIA – A ESTRELA QUE GUIA AO SALVADOR",
    `Senhor Jesus, uma estrela guiou os Magos até Belém, conduzindo-os ao encontro convosco. Esse sinal luminoso foi expressão da fidelidade de Deus, que guia os que O buscam com sinceridade.

Ajudai-nos a reconhecer os sinais que Deus coloca em nosso caminho. Que saibamos escutar Sua voz e seguir Sua orientação, mesmo quando o caminho parece longo ou difícil.

Fazei-nos atentos à Vossa presença e dóceis à Vossa vontade.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    epifania.id,
    3,
    "TERCEIRO DIA – OS MAGOS EM CAMINHO",
    `Senhor Jesus, os Magos deixaram tudo para buscar o Rei recém-nascido. Sua caminhada foi marcada pela fé, pela coragem e pela perseverança.

Ensinai-nos a sair de nossas comodidades e a colocar-Vos no centro de nossa vida. Que não tenhamos medo de caminhar quando sois Vós que nos chamais.

Fortalecei nossa fé para que jamais desistamos da busca pelo Senhor.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    epifania.id,
    4,
    "QUARTO DIA – A ADORAÇÃO AO MENINO DEUS",
    `Menino Jesus, os Magos prostraram-se diante de Vós e Vos adoraram, reconhecendo-Vos como verdadeiro Deus e verdadeiro Rei.

Ensinai-nos a adorar-Vos com humildade e reverência. Que nossa oração seja sincera e nossa vida um louvor constante ao Vosso nome.

Ajudai-nos a colocar Deus acima de todas as coisas e a reconhecer Vossa presença em nosso dia a dia.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    epifania.id,
    5,
    "QUINTO DIA – OURO, INCENSO E MIRRA",
    `Senhor Jesus, os Magos ofereceram ouro, incenso e mirra, símbolos de realeza, divindade e sacrifício.

Ensinai-nos a oferecer-Vos o melhor de nós mesmos: nosso tempo, nossa fé, nosso amor e nossa fidelidade. Que nossa vida seja uma oferta agradável a Deus.

Ajudai-nos a viver com generosidade e espírito de entrega.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    epifania.id,
    6,
    "SEXTO DIA – JESUS, REI DOS CORAÇÕES",
    `Menino Jesus, embora nascido na simplicidade, sois o verdadeiro Rei do universo. Vosso reino não é de poder humano, mas de amor, justiça e paz.

Reinai em nosso coração e em nossa vida. Ajudai-nos a rejeitar tudo o que nos afasta de Vosso reino e a viver segundo os valores do Evangelho.

Que sejamos fiéis súditos do Vosso amor.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    epifania.id,
    7,
    "SÉTIMO DIA – A REVELAÇÃO A TODOS OS POVOS",
    `Senhor Jesus, na Epifania manifestastes que a salvação é destinada a todos os povos e nações. Em Vós, todos são chamados a participar da vida divina.

Ajudai-nos a viver a fraternidade e a acolher todos como irmãos. Que sejamos instrumentos de unidade, respeito e amor no mundo.

Fazei de nós testemunhas da Vossa luz entre todos os povos.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    epifania.id,
    8,
    "OITAVO DIA – UM NOVO CAMINHO",
    `Senhor Jesus, após o encontro convosco, os Magos retornaram por outro caminho, transformados pela experiência com o Salvador.

Que o encontro convosco também transforme nossa vida. Ajudai-nos a abandonar caminhos de pecado e a trilhar uma vida nova, iluminada por Vossa graça.

Renovai nosso coração e nossas atitudes.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    epifania.id,
    9,
    "NONO DIA – TESTEMUNHAS DA LUZ",
    `Senhor Jesus, ao final desta novena, desejamos ser testemunhas da Vossa luz no mundo. Que nossa vida reflita Vossa presença e vosso amor.

Enviai-nos como anunciadores do Evangelho, para que outros possam encontrar-Vos e reconhecer-Vos como Salvador.

Concedei-nos perseverança na fé e fidelidade até o fim.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

//NOVENA A SÃO SEBASTIAO

const sebastiao = upsertNovena({
    slug: makeSlug("NOVENA A SÃO SEBASTIÃO"),
    titulo: "NOVENA A SÃO SEBASTIÃO",
    periodo_inicio: "11/01",
    periodo_fim: "19/01",
    subtitulo: "São Sebastião, intercessor nas tribulações, guardião do povo fiel",
    como_rezar: COMO_REZAR_PADRAO,
    sinal_da_cruz: SINAL_DA_CRUZ_PADRAO,
    oracao_inicial: `Ó glorioso São Sebastião, fiel servo de Deus e corajoso mártir de Cristo, nós recorremos à vossa poderosa intercessão. Vós que permanecestes firmes na fé, mesmo diante das perseguições, das dores e da morte, ajudai-nos a viver com fidelidade o Evangelho de Jesus Cristo.

Intercedei por nós junto ao Senhor, para que, ao rezarmos esta novena, sejamos fortalecidos na fé, na esperança e no amor. Alcançai-nos as graças de que necessitamos para nossa vida espiritual e corporal, se assim for da vontade de Deus, e ensinai-nos a perseverar até o fim no caminho da salvação.
Amém.`,
    oracao_final: `Ó glorioso São Sebastião, mártir fiel de Cristo,
rogai por nós, para que sejamos fortalecidos na fé,
firmes na esperança e perseverantes no amor.
Protegei-nos de todo mal e conduzi-nos à vida eterna.
Amém.
`
  });

  upsertDia(
    sebastiao.id,
    1,
    "PRIMEIRO DIA – SÃO SEBASTIÃO, TESTEMUNHA DA FÉ",
    `Ó São Sebastião, desde jovem escolhestes servir a Deus com fidelidade. Mesmo vivendo em meio a um ambiente hostil à fé cristã, jamais negastes o nome de Jesus.

Ajudai-nos a dar testemunho da nossa fé com coragem, especialmente em um mundo que tantas vezes rejeita os valores do Evangelho. Que não tenhamos medo de professar nossa fé com palavras e atitudes.

Fortalecei-nos para que sejamos cristãos autênticos em todas as circunstâncias da vida.

(Fazer o pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    sebastiao.id,
    2,
    "SEGUNDO DIA – SÃO SEBASTIÃO, SERVO FIEL DE CRISTO",
    `Ó glorioso mártir, vossa vida foi inteiramente dedicada ao serviço de Cristo e à defesa dos cristãos perseguidos. Mesmo ocupando posição de destaque, escolhestes servir com humildade e amor.

Ensinai-nos a colocar Deus acima de tudo e a viver nossa vocação com fidelidade. Ajudai-nos a servir ao Senhor e aos irmãos sem buscar reconhecimento, mas apenas a Sua glória.

Que nossa vida seja sinal do amor de Deus no mundo.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    sebastiao.id,
    3,
    "TERCEIRO DIA – SÃO SEBASTIÃO, EXEMPLO DE CORAGEM",
    `Ó São Sebastião, diante das ameaças e dos sofrimentos, não recuastes nem abandonastes a fé. Vossa coragem foi sustentada pela confiança total em Deus.

Ajudai-nos a enfrentar com coragem as dificuldades da vida, sem desânimo ou medo. Que saibamos confiar no Senhor mesmo nas horas mais difíceis.

Fortalecei nosso coração para que jamais nos afastemos de Deus.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    sebastiao.id,
    4,
    "QUARTO DIA – SÃO SEBASTIÃO, FORTALEZA NA PROVAÇÃO",
    `Ó fiel mártir, mesmo ferido e quase morto, não desististes de vossa missão. Vosso testemunho revela que a força que vem de Deus supera qualquer dor.

Intercedei por todos os que enfrentam enfermidades, perseguições e sofrimentos físicos ou espirituais. Alcançai-nos força, paciência e perseverança.

Ensinai-nos a oferecer nossas dores a Deus com fé e confiança.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    sebastiao.id,
    5,
    "QUINTO DIA – SÃO SEBASTIÃO, DEFENSOR DOS CRISTÃOS",
    `Ó São Sebastião, fostes defensor dos cristãos perseguidos, encorajando-os a permanecer firmes na fé e na esperança.

Intercedei pela Igreja, para que permaneça fiel ao Evangelho. Protegei os que sofrem perseguição por causa da fé e fortalecei todos os cristãos.

Que jamais nos falte coragem para defender a verdade e o amor de Cristo.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    sebastiao.id,
    6,
    "SEXTO DIA – SÃO SEBASTIÃO, MODELO DE FIDELIDADE",
    `Ó glorioso São Sebastião, até o fim permanecestes fiel a Cristo, entregando vossa própria vida por amor ao Senhor.

Ajudai-nos a viver com fidelidade nossos compromissos cristãos. Que não nos deixemos levar pela acomodação ou pelo medo.

Ensinai-nos a perseverar na fé, confiantes na graça de Deus.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    sebastiao.id,
    7,
    "SÉTIMO DIA – SÃO SEBASTIÃO, INTERCESSOR PODEROSO",
    `Ó glorioso mártir, a Igreja reconhece em vós um poderoso intercessor junto a Deus, especialmente nas horas de perigo, enfermidade e tribulação.

Apresentai ao Senhor nossas necessidades e súplicas. Alcançai-nos as graças que mais necessitamos para nossa vida e salvação.

Aumentai nossa confiança na oração e na intercessão dos santos.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    sebastiao.id,
    8,
    "OITAVO DIA – SÃO SEBASTIÃO, PROTETOR CONTRA OS MALES",
    `Ó São Sebastião, invocado como protetor contra as doenças, epidemias e perigos, confiamos à vossa intercessão nossas vidas e nossas famílias.

Protegei-nos de todo mal do corpo e da alma. Alcançai-nos saúde, paz e confiança na providência divina.

Que, protegidos por vossa intercessão, caminhemos sempre sob a graça de Deus.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    sebastiao.id,
    9,
    "NONO DIA – SÃO SEBASTIÃO, MÁRTIR DA ESPERANÇA",
    `Ó glorioso São Sebastião, vosso martírio foi testemunho de esperança na vida eterna. Mesmo diante da morte, permanecestes firme na fé.

Ajudai-nos a viver com os olhos voltados para o Céu, confiantes na promessa da ressurreição. Que jamais percamos a esperança, mesmo nas tribulações.

Conduzi-nos no caminho da fé até a glória eterna.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );


// NOVENA A SÃO FRANCISCO DE SALES

const sales = upsertNovena({
    slug: makeSlug("NOVENA A SÃO FRANCISCO DE SALES"),
    titulo: "NOVENA A SÃO FRANCISCO DE SALES",
    periodo_inicio: "15/01",
    periodo_fim: "23/01",
    subtitulo: "São Francisco de Sales, padroeiro dos comunicadores",
    como_rezar: COMO_REZAR_PADRAO,
    sinal_da_cruz: SINAL_DA_CRUZ_PADRAO,
    oracao_inicial: `Ó glorioso São Francisco de Sales, bispo zeloso, doutor da Igreja e mestre da mansidão cristã, nós recorremos à vossa intercessão confiante. Vós que soubestes anunciar o Evangelho com amor, paciência e firmeza, ensinai-nos a viver nossa fé com serenidade e confiança em Deus.

Intercedei por nós junto ao Senhor, para que, ao rezarmos esta novena, aprendamos a buscar a santidade no cotidiano, com humildade, equilíbrio e amor. Alcançai-nos as graças de que necessitamos para nossa vida espiritual e para o cumprimento da vontade de Deus, se assim for de Seu agrado.
Amém`,
    oracao_final: `Ó São Francisco de Sales,
mestre da mansidão e da caridade,
ensinai-nos a amar a Deus sobre todas as coisas
e a viver o Evangelho com fidelidade e alegria.
Rogai por nós, hoje e sempre.
Amém.`
  });

  upsertDia(
    sales.id,
    1,
    "PRIMEIRO DIA – SÃO FRANCISCO DE SALES, BUSCADOR DA SANTIDADE",
    `Ó São Francisco de Sales, desde jovem buscastes a santidade com ardor e perseverança. Em meio às lutas interiores e às dificuldades da vida, jamais deixastes de confiar na misericórdia de Deus.

Ajudai-nos a compreender que a santidade é um chamado para todos e que pode ser vivida no dia a dia, nas pequenas coisas, com fidelidade e amor.

Ensinai-nos a não desanimar diante de nossas fraquezas, mas a confiar sempre na graça divina.

(Fazer o pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    sales.id,
    2,
    "SEGUNDO DIA – SÃO FRANCISCO DE SALES, EXEMPLO DE MANSIDÃO",
    `Ó santo da mansidão, vossa vida foi marcada pela paciência, pela doçura e pela serenidade, mesmo diante das contrariedades e perseguições.

Ensinai-nos a dominar nossos impulsos, palavras e atitudes. Ajudai-nos a responder ao mal com o bem e a viver a caridade mesmo nas situações mais difíceis.

Que nossa vida reflita a mansidão do Coração de Cristo.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    sales.id,
    3,
    "TERCEIRO DIA – SÃO FRANCISCO DE SALES, MESTRE DA ORAÇÃO",
    `Ó São Francisco de Sales, ensinastes que a oração é o fundamento da vida cristã e o alimento da alma. Vós convidáveis todos a cultivar uma relação íntima com Deus.

Ajudai-nos a rezar com constância, simplicidade e confiança. Que a oração seja para nós fonte de força, paz e discernimento.

Ensinai-nos a unir oração e ação, vivendo sempre na presença de Deus.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    sales.id,
    4,
    "QUARTO DIA – SÃO FRANCISCO DE SALES, APÓSTOLO DA CARIDADE",
    `Ó santo doutor, toda a vossa missão foi marcada pela caridade. Anunciastes a verdade com amor e jamais separastes a fé da misericórdia.

Ensinai-nos a viver a caridade nas palavras, nos gestos e nas atitudes. Que saibamos corrigir com amor, servir com humildade e amar sem medidas.

Fazei de nós instrumentos da caridade de Cristo no mundo.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    sales.id,
    5,
    "QUINTO DIA – SÃO FRANCISCO DE SALES, GUIA DAS ALMAS",
    `Ó São Francisco de Sales, fostes sábio diretor espiritual e conduzistes muitas almas no caminho da santidade, com prudência e discernimento.

Ajudai-nos a escutar a voz de Deus e a buscar Sua vontade em todas as coisas. Concedei-nos sabedoria para orientar nossas escolhas e fidelidade para seguir o caminho do bem.

Que jamais nos afastemos da verdade do Evangelho.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    sales.id,
    6,
    "SEXTO DIA – SÃO FRANCISCO DE SALES, MODELO DE HUMILDADE",
    `Ó santo humilde, mesmo dotado de grande sabedoria e conhecimento, permanecestes simples e acessível a todos.

Livrai-nos do orgulho e da vaidade. Ensinai-nos a reconhecer nossas limitações e a confiar na ação de Deus em nossa vida.

Que aprendamos a viver com humildade e espírito de serviço.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    sales.id,
    7,
    "SÉTIMO DIA – SÃO FRANCISCO DE SALES, DEFENSOR DA VERDADE",
    `Ó doutor da Igreja, defendestes a fé católica com coragem, clareza e amor, sem jamais recorrer à violência ou ao ódio.

Ajudai-nos a testemunhar a verdade com respeito e caridade. Que saibamos anunciar o Evangelho com palavras e com a própria vida.

Concedei-nos firmeza na fé e equilíbrio nas atitudes.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    sales.id,
    8,
    "OITAVO DIA – SÃO FRANCISCO DE SALES, SANTO DO COTIDIANO",
    `Ó São Francisco de Sales, ensinastes que a santidade não está reservada a poucos, mas é possível em todas as vocações e estados de vida.

Ajudai-nos a santificar nossas atividades diárias, nosso trabalho, nossa família e nossas relações. Que tudo o que fizermos seja para a glória de Deus.

Ensinai-nos a viver com alegria a vocação que recebemos.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    sales.id,
    9,
    "NONO DIA – SÃO FRANCISCO DE SALES, INTERCESSOR PODEROSO",
    `Ó glorioso São Francisco de Sales, acolhei esta novena que rezamos com fé e confiança. Apresentai ao Senhor nossas necessidades e intenções.

Intercedei por nossas famílias, por nossa vida espiritual e por todos aqueles que necessitam de luz, paz e orientação. Conduzi-nos no caminho da santidade e da vida eterna.

Obrigado por vosso exemplo e vossa intercessão constante.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

const candeias = upsertNovena({
    slug: makeSlug("NOVENA A NOSSA SENHORA DAS CANDEIAS"),
    titulo: "NOVENA A NOSSA SENHORA DAS CANDEIAS",
    periodo_inicio: "24/01",
    periodo_fim: "01/02",
    subtitulo: "A Mãe que apresenta a Luz ao mundo",
    como_rezar: COMO_REZAR_PADRAO,
    sinal_da_cruz: SINAL_DA_CRUZ_PADRAO,
    oracao_inicial: `Ó Maria Santíssima, Nossa Senhora das Candeias, Mãe da Luz verdadeira, que apresentastes o Menino Jesus no Templo como luz para iluminar as nações, nós recorremos à vossa intercessão com fé e confiança.

Vós que levastes em vossos braços Aquele que é a Luz do mundo, iluminai nosso caminho e afastai de nossa vida toda escuridão do pecado, do medo e da desesperança. Concedei-nos a graça de rezar esta novena com coração sincero, para que, guiados pela luz de Cristo, vivamos na fé, na esperança e no amor, alcançando as graças necessárias para nossa vida e salvação, conforme a vontade de Deus.
Amém.`,
    oracao_final: `Ó Nossa Senhora das Candeias,
Mãe da Luz e nossa Mãe,
iluminai nosso caminho com a luz de Cristo.
Protegei-nos de todo mal
e conduzi-nos à vida eterna.
Amém.`
  });

  upsertDia(
    candeias.id,
    1,
    "PRIMEIRO DIA – NOSSA SENHORA DAS CANDEIAS, MÃE DA LUZ",
    `Ó Nossa Senhora das Candeias, vós apresentastes ao mundo a Luz que jamais se apaga: Jesus Cristo, vosso Filho amado.

Ajudai-nos a reconhecer essa luz em nossa vida e a acolhê-la com fé. Que jamais caminhemos nas trevas do pecado, mas sigamos sempre iluminados pela presença de Cristo.

Iluminai nosso coração e nossas escolhas, para que vivamos segundo a vontade de Deus.

(Fazer o pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    candeias.id,
    2,
    "SEGUNDO DIA – NOSSA SENHORA DAS CANDEIAS, OBEDIENTE À LEI DO SENHOR",
    `Ó Mãe fiel, mesmo sendo pura e cheia de graça, apresentastes-vos no Templo em obediência à Lei do Senhor, oferecendo vosso Filho a Deus.

Ensinai-nos a viver na obediência e na humildade, aceitando com amor os caminhos que Deus nos propõe. Que saibamos cumprir nossa missão com fidelidade, mesmo nas pequenas coisas.

Ajudai-nos a confiar plenamente nos desígnios do Senhor.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    candeias.id,
    3,
    "TERCEIRO DIA – NOSSA SENHORA DAS CANDEIAS, MODELO DE FÉ",
    `Ó Virgem Santíssima, vossa fé sustentou cada passo de vossa missão. No silêncio e na confiança, guardáveis tudo em vosso coração.

Ajudai-nos a fortalecer nossa fé, especialmente quando não compreendemos os acontecimentos da vida. Que aprendamos a confiar em Deus em todas as circunstâncias.

Sede nossa guia nos momentos de dúvida e incerteza.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    candeias.id,
    4,
    "QUARTO DIA – NOSSA SENHORA DAS CANDEIAS, MÃE DA ESPERANÇA",
    `Ó Mãe cheia de esperança, mesmo ouvindo as palavras proféticas sobre dores futuras, permanecestes firme na confiança em Deus.

Renovai nossa esperança quando enfrentamos dificuldades e sofrimentos. Ajudai-nos a acreditar que Deus transforma a dor em salvação e a cruz em vida nova.

Que jamais percamos a esperança nas promessas do Senhor.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    candeias.id,
    5,
    "QUINTO DIA – NOSSA SENHORA DAS CANDEIAS, COMPANHEIRA DOS QUE SOFREM",
    `Ó Mãe dolorosa, que aceitastes em vosso coração a espada da dor anunciada por Simeão, olhai por todos os que sofrem.

Intercedei pelos aflitos, doentes, angustiados e desesperançados. Concedei-lhes conforto, força e paz.

Ajudai-nos a unir nossos sofrimentos aos de Cristo, oferecendo-os com fé e amor.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    candeias.id,
    6,
    "SEXTO DIA – NOSSA SENHORA DAS CANDEIAS, LUZ NO CAMINHO",
    `Ó Mãe da Luz, conduzi-nos sempre pelo caminho do bem. Iluminai nossas decisões e afastai de nós todo erro e toda escuridão.

Ajudai-nos a discernir a vontade de Deus em nossa vida e a caminhar com segurança sob a luz do Evangelho.

Que sejamos guiados pela luz de Cristo em todas as nossas ações.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    candeias.id,
    7,
    "SÉTIMO DIA – NOSSA SENHORA DAS CANDEIAS, PROTETORA DAS FAMÍLIAS",
    `Ó Mãe Santíssima, apresentastes Jesus no Templo e O consagrastes ao Pai. Olhai com amor para nossas famílias.

Protegei nossos lares, fortalecei os vínculos de amor e afastai todo mal. Que nossas casas sejam iluminadas pela presença de Cristo.

Intercedei para que reine a paz, o diálogo e a fé em nossas famílias.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    candeias.id,
    8,
    "OITAVO DIA – NOSSA SENHORA DAS CANDEIAS, GUIA DOS CRISTÃOS",
    `Ó Virgem fiel, sede nossa guia no caminho da fé. Ajudai-nos a viver como verdadeiros discípulos de Jesus, sendo luz para os outros.

Que nossa vida reflita a luz de Cristo por meio de gestos de amor, caridade e misericórdia.

Fazei de nós instrumentos da luz de Deus no mundo.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    candeias.id,
    9,
    "NONO DIA – NOSSA SENHORA DAS CANDEIAS, NOSSA MÃE E INTERCESSORA",
    `Ó Nossa Senhora das Candeias, acolhei esta novena que rezamos com fé e confiança. Apresentai a Deus nossos pedidos e necessidades.

Iluminai nossa vida, fortalecei nossa fé e conduzi-nos sempre a Jesus, a Luz verdadeira. Protegei-nos em todos os momentos e ajudai-nos a caminhar rumo à vida eterna.

Obrigado, Mãe querida, por vossa luz e proteção.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

//NOVENA DA PURIFICAÇÃO DE MARIA

  const purificacao = upsertNovena({
    slug: makeSlug("NOVENA DA PURIFICAÇÃO DE MARIA"),
    titulo: "NOVENA DA PURIFICAÇÃO DE MARIA",
    periodo_inicio: "24/01",
    periodo_fim: "01/02",
    subtitulo: "Da pureza de Maria nasce a esperança",
    como_rezar: COMO_REZAR_PADRAO,
    sinal_da_cruz: SINAL_DA_CRUZ_PADRAO,
    oracao_inicial: `Ó Maria Santíssima, Mãe puríssima e obediente ao Senhor, que vos apresentastes no Templo para cumprir a Lei, mesmo sendo cheia de graça e isenta de toda mancha do pecado, acolhei-nos sob vossa proteção materna.

Vós nos ensinais que a verdadeira pureza nasce da obediência, da humildade e do amor a Deus. Concedei-nos a graça de rezar esta novena com coração sincero, desejoso de purificação interior, para que, livres do pecado e renovados pela graça, possamos viver segundo a vontade do Senhor e alcançar as graças necessárias para nossa vida e salvação, conforme Seu divino querer.
Amém.`,
    oracao_final: `Ó Maria Santíssima,
Mãe puríssima e obediente ao Senhor,
purificai nosso coração e nossa vida.
Conduzi-nos no caminho da santidade
e ajudai-nos a viver sempre na graça de Deus.
Amém.
`
  });

  upsertDia(
    purificacao.id,
    1,
    "PRIMEIRO DIA – MARIA, EXEMPLO DE PUREZA",
    `Ó Maria Santíssima, sois o mais perfeito exemplo de pureza de corpo e de alma. Toda a vossa vida foi entregue a Deus com coração indiviso.

Ajudai-nos a buscar a pureza em nossos pensamentos, palavras e ações. Ensinai-nos a viver com um coração limpo, livre do pecado e aberto à graça.

Que nosso desejo maior seja agradar a Deus em tudo.

(Fazer o pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    purificacao.id,
    2,
    "SEGUNDO DIA – MARIA, OBEDIENTE À LEI DO SENHOR",
    `Ó Mãe fiel, mesmo não necessitando de purificação, submetestes-vos à Lei por amor e obediência a Deus.

Ensinai-nos a obedecer com humildade aos mandamentos do Senhor e aos ensinamentos da Igreja. Que saibamos acolher a vontade de Deus mesmo quando não a compreendemos plenamente.

Ajudai-nos a viver na fidelidade e na confiança.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    purificacao.id,
    3,
    "TERCEIRO DIA – MARIA, HUMILDE SERVA DE DEUS",
    `Ó Virgem Santíssima, vossa humildade vos levou a cumprir silenciosamente a vontade divina, sem buscar honras ou privilégios.

Livrai-nos do orgulho e da vaidade. Ensinai-nos a viver com simplicidade, reconhecendo nossa dependência de Deus.

Que nossa vida seja marcada pela humildade e pelo serviço.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    purificacao.id,
    4,
    "QUARTO DIA – MARIA, OFERTA AGRADÁVEL AO SENHOR",
    `Ó Mãe obediente, ao apresentar Jesus no Templo, oferecestes ao Pai o maior dom da humanidade.

Ajudai-nos a oferecer a Deus nossa vida, nossas alegrias e nossos sofrimentos. Que tudo o que somos e temos seja colocado a serviço do Senhor.

Ensinai-nos a viver como oferta viva e agradável a Deus.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    purificacao.id,
    5,
    "QUINTO DIA – MARIA, MÃE QUE ACOLHE A DOR",
    `Ó Maria Santíssima, ao ouvir a profecia de Simeão, aceitastes com fé a dor que atravessaria vosso coração.

Ajudai-nos a acolher o sofrimento com confiança em Deus. Consolai os que sofrem no corpo e na alma.

Que saibamos unir nossas dores às de Cristo, oferecendo-as para a salvação do mundo.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    purificacao.id,
    6,
    "SEXTO DIA – MARIA, CAMINHO DE PURIFICAÇÃO INTERIOR",
    `Ó Mãe puríssima, conduzi-nos no caminho da conversão e da purificação do coração.

Ajudai-nos a reconhecer nossos pecados e a buscar com sinceridade o perdão de Deus. Que aprendamos a viver na graça, evitando tudo o que nos afasta do Senhor.

Renovai nosso coração pelo poder do Espírito Santo.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    purificacao.id,
    7,
    "SÉTIMO DIA – MARIA, LUZ NA VIDA DOS FIÉIS",
    `Ó Virgem fiel, vossa vida ilumina o caminho dos cristãos. Em vós aprendemos a viver com fé, pureza e obediência.

Iluminai nossas escolhas e decisões. Ajudai-nos a caminhar segundo a luz do Evangelho.

Que sejamos sinais da luz de Cristo no mundo.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    purificacao.id,
    8,
    "OITAVO DIA – MARIA, PROTETORA DAS ALMAS",
    `Ó Mãe Santíssima, guardai-nos sob vossa proteção. Defendei-nos das tentações e dos perigos que ameaçam nossa alma.

Intercedei para que vivamos em estado de graça e perseveremos no caminho do bem até o fim.

Que confiemos sempre em vosso cuidado materno.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    purificacao.id,
    9,
    "NONO DIA – MARIA, NOSSA MÃE E INTERCESSORA",
    `Ó Maria Santíssima, acolhei esta novena que rezamos com fé e amor. Apresentai nossos pedidos a Deus e alcançai-nos as graças necessárias para nossa purificação interior.

Conduzi-nos a Jesus, fonte de toda pureza e salvação. Protegei-nos hoje e sempre, e ajudai-nos a viver como filhos fiéis de Deus.

Obrigado, Mãe puríssima, por vosso exemplo e intercessão.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

// NOVENA A SÃO BRÁS
const bras = upsertNovena({
    slug: makeSlug("NOVENA A SÃO BRÁS"),
    titulo: "NOVENA A SÃO BRÁS",
    periodo_inicio: "25/01",
    periodo_fim: "02/02",
    subtitulo: "Pela intercessão de São Brás, sejamos livres de todo mal",
    como_rezar: COMO_REZAR_PADRAO,
    sinal_da_cruz: SINAL_DA_CRUZ_PADRAO,
    oracao_inicial: `Ó glorioso São Brás, bispo fiel e mártir de Cristo, que dedicastes vossa vida ao cuidado das almas e ao alívio dos sofrimentos do povo, nós recorremos à vossa poderosa intercessão. Vós que, pela graça de Deus, fostes instrumento de cura e proteção, especialmente contra os males da garganta, olhai por nós com bondade.

Intercedei por nós junto ao Senhor, para que, ao rezarmos esta novena, sejamos fortalecidos na fé, na esperança e no amor. Alcançai-nos as graças de que necessitamos para nossa vida espiritual e corporal, se assim for da vontade de Deus, e ensinai-nos a confiar sempre em Sua misericórdia.
Amém.`,
    oracao_final: `Ó glorioso São Brás,
bispo fiel e mártir de Cristo,
protegei-nos contra os males da garganta
e alcançai-nos saúde do corpo e da alma.
Fortalecei-nos na fé e conduzi-nos à vida eterna.
Amém.`
  });

  upsertDia(
    bras.id,
    1,
    "PRIMEIRO DIA – SÃO BRÁS, SERVO FIEL DE DEUS",
    `Ó São Brás, desde o início de vossa missão escolhestes servir a Deus com fidelidade e zelo pastoral. Como bispo, cuidastes do povo confiado a vós com amor e dedicação.

Ajudai-nos a viver nossa fé com fidelidade e responsabilidade. Que saibamos cumprir nossa missão cristã com amor, mesmo nas dificuldades.

Ensinai-nos a colocar Deus acima de todas as coisas.

(Fazer o pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    bras.id,
    2,
    "SEGUNDO DIA – SÃO BRÁS, EXEMPLO DE CARIDADE",
    `Ó glorioso São Brás, vosso coração era movido pela caridade cristã. Vós cuidáveis dos doentes e aflitos, levando-lhes consolo e esperança.

Ensinai-nos a amar o próximo com gestos concretos de caridade. Que sejamos atentos às necessidades dos que sofrem no corpo e na alma.

Ajudai-nos a viver o amor de Cristo no dia a dia.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    bras.id,
    3,
    "TERCEIRO DIA – SÃO BRÁS, INSTRUMENTO DE CURA",
    `Ó São Brás, por vossa intercessão Deus concedeu curas e sinais de Sua misericórdia. Por isso, sois invocado como protetor contra os males da garganta.

Intercedei por todos os que sofrem enfermidades, especialmente doenças da garganta, do corpo e da alma. Alcançai-nos saúde, conforto e paz.

Que saibamos confiar sempre no poder curador de Deus.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    bras.id,
    4,
    "QUARTO DIA – SÃO BRÁS, DEFENSOR DA FÉ",
    `Ó fiel mártir, não temestes as ameaças nem as perseguições. Permanecestes firme na fé, preferindo obedecer a Deus antes que aos homens.

Ajudai-nos a defender nossa fé com coragem e coerência. Que não tenhamos medo de testemunhar o Evangelho com palavras e atitudes.

Fortalecei-nos para permanecermos fiéis até o fim.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    bras.id,
    5,
    "QUINTO DIA – SÃO BRÁS, MODELO DE CONFIANÇA EM DEUS",
    `Ó São Brás, mesmo diante do sofrimento e da morte, confiastes plenamente em Deus. Vossa esperança estava firmada na vida eterna.

Ensinai-nos a confiar no Senhor em todos os momentos, especialmente nas provações. Que jamais percamos a esperança, mesmo nas dificuldades.

Ajudai-nos a abandonar-nos nas mãos de Deus.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    bras.id,
    6,
    "SEXTO DIA – SÃO BRÁS, PROTETOR DOS AFLITOS",
    `Ó santo bondoso, sede refúgio para os que sofrem, os doentes, os angustiados e os que passam por momentos difíceis.

Intercedei para que encontremos alívio em nossas dores e força para enfrentar os desafios da vida. Que sejamos consolados pela graça de Deus.

Ajudai-nos também a consolar aqueles que sofrem.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    bras.id,
    7,
    "SÉTIMO DIA – SÃO BRÁS, PASTOR ZELOSO",
    `Ó São Brás, como pastor, conduzistes o rebanho com amor e fidelidade, dando a própria vida por Cristo.

Intercedei pela Igreja, pelos bispos, sacerdotes e por todos os que exercem o ministério pastoral. Que sejam fortalecidos na fé e no amor.

Ajudai-nos a amar e respeitar nossos pastores.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    bras.id,
    8,
    "OITAVO DIA – SÃO BRÁS, EXEMPLO DE PERSEVERANÇA",
    `Ó glorioso mártir, até o fim permanecestes firme na fé, sem renunciar a Cristo.

Ajudai-nos a perseverar no caminho do bem, mesmo quando somos tentados a desanimar. Que nossa fé seja constante e nossa esperança inabalável.

Conduzi-nos sempre no caminho da salvação.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    bras.id,
    9,
    "NONO DIA – SÃO BRÁS, NOSSO INTERCESSOR JUNTO A DEUS",
    `Ó São Brás, acolhei esta novena que rezamos com fé e confiança. Apresentai a Deus nossos pedidos e necessidades.

Intercedei por nossa saúde, por nossa vida espiritual e por nossas famílias. Protegei-nos de todo mal e conduzi-nos à vida eterna.

Obrigado por vossa intercessão e proteção constante.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  //NOVENA NOSSA SENHORA DE LOURDES

  const lourdes = upsertNovena({
    slug: makeSlug("NOSSA SENHORA DE LOURDES"),
    titulo: "NOSSA SENHORA DE LOURDES",
    periodo_inicio: "02/02",
    periodo_fim: "10/02",
    subtitulo: "Com Maria de Lourdes, buscamos cura e paz.",
    como_rezar: COMO_REZAR_PADRAO,
    sinal_da_cruz: SINAL_DA_CRUZ_PADRAO,
    oracao_inicial: `Ó Maria Santíssima, Nossa Senhora de Lourdes, que aparecestes a Santa Bernadette como sinal do amor e da misericórdia de Deus, nós recorremos à vossa intercessão com fé e confiança. Vós vos revelastes como a Imaculada Conceição e convidastes à oração, à penitência e à conversão do coração.

Olhai por nós, Mãe compassiva. Concedei-nos a graça de rezar esta novena com fé sincera, espírito humilde e confiança filial, para que, por vossa intercessão materna, alcancemos as graças necessárias para nossa vida espiritual e corporal, conforme a vontade de Deus.
Amém.`,
    oracao_final: `Ó Nossa Senhora de Lourdes,
Mãe da misericórdia e da esperança,
intercedei por nós junto a vosso Filho Jesus.
Concedei-nos saúde do corpo e da alma,
fortaleza na fé e perseverança no amor.
Amém.`
  });

  upsertDia(
    lourdes.id,
    1,
    "PRIMEIRO DIA – NOSSA SENHORA DE LOURDES, MÃE DA MISERICÓRDIA",
    `Ó Nossa Senhora de Lourdes, em vossas aparições manifestastes o rosto misericordioso de Deus, acolhendo os pequenos, os pobres e os sofredores.

Ajudai-nos a confiar na misericórdia divina, mesmo quando nos sentimos fracos e indignos. Ensinai-nos a recorrer a Deus com humildade e esperança.

Que jamais duvidemos do amor de Deus por nós.

(Fazer o pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    lourdes.id,
    2,
    "SEGUNDO DIA – NOSSA SENHORA DE LOURDES, CHAMADO À CONVERSÃO",
    `Ó Mãe Santíssima, em Lourdes convidastes todos à penitência e à conversão do coração.

Ajudai-nos a reconhecer nossos pecados e a buscar sinceramente o perdão de Deus. Que nossa vida seja transformada pela graça e renovada no amor.

Conduzi-nos no caminho da conversão verdadeira.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    lourdes.id,
    3,
    "TERCEIRO DIA – NOSSA SENHORA DE LOURDES, EXEMPLO DE HUMILDADE",
    `Ó Virgem Maria, escolhestes manifestar-vos a uma jovem simples e humilde, revelando que Deus se agrada dos pequenos.

Livrai-nos do orgulho e da autossuficiência. Ensinai-nos a viver com humildade e confiança, reconhecendo nossa dependência de Deus.

Que nosso coração seja simples e aberto à graça.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    lourdes.id,
    4,
    "QUARTO DIA – NOSSA SENHORA DE LOURDES, MÃE DOS SOFREDORES",
    `Ó Mãe compassiva, Lourdes tornou-se lugar de consolo para os doentes, aflitos e sofredores.

Olhai com ternura para todos os que sofrem no corpo e na alma. Intercedei pelos enfermos, pelos desanimados e pelos que carregam cruzes pesadas.

Concedei-lhes conforto, força e paz.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    lourdes.id,
    5,
    "QUINTO DIA – NOSSA SENHORA DE LOURDES, FONTE DE CURA E ESPERANÇA",
    `Ó Nossa Senhora de Lourdes, Deus quis fazer brotar uma fonte de água como sinal de cura e esperança.

Ajudai-nos a confiar que Deus pode curar nossas feridas, visíveis e invisíveis. Renovai nossa esperança quando tudo parece impossível.

Que jamais percamos a confiança no poder de Deus.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    lourdes.id,
    6,
    "SEXTO DIA – NOSSA SENHORA DE LOURDES, MÃE DA ORAÇÃO",
    `Ó Virgem Santíssima, em Lourdes convidastes à oração perseverante e confiante.

Ensinai-nos a rezar com o coração, a buscar Deus na oração diária e a confiar em Sua providência.

Que a oração seja nossa força nas dificuldades e nossa alegria nos momentos de paz.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    lourdes.id,
    7,
    "SÉTIMO DIA – NOSSA SENHORA DE LOURDES, GUIA NO CAMINHO DA FÉ",
    `Ó Mãe fiel, conduzi-nos no caminho da fé verdadeira. Ajudai-nos a permanecer firmes no Evangelho, mesmo diante das provações.

Iluminai nossas escolhas e fortalecei nossa confiança em Deus.

Que caminhemos sempre sob vossa proteção materna.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    lourdes.id,
    8,
    "OITAVO DIA – NOSSA SENHORA DE LOURDES, PROTETORA DOS FRACOS",
    `Ó Nossa Senhora de Lourdes, sede refúgio para os fracos, os pobres e os que se sentem abandonados.

Ajudai-nos a reconhecer Cristo nos que sofrem e a praticar a caridade com generosidade.

Que sejamos instrumentos do amor de Deus na vida dos outros.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    lourdes.id,
    9,
    "NONO DIA – NOSSA SENHORA DE LOURDES, NOSSA MÃE E INTERCESSORA",
    `Ó Mãe Santíssima, acolhei esta novena que rezamos com fé e confiança. Apresentai a Deus nossos pedidos e necessidades.

Conduzi-nos a Jesus, fonte de toda salvação. Protegei nossas famílias, fortalecei nossa fé e alcançai-nos as graças necessárias para nossa vida.

Obrigado, Nossa Senhora de Lourdes, por vosso amor e intercessão.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  //NOVENA A SÃO PATRÍCIO

  const patricio = upsertNovena({
    slug: makeSlug("NOVENA A SÃO PATRÍCIO"),
    titulo: "NOVENA A SÃO PATRÍCIO",
    periodo_inicio: "08/03",
    periodo_fim: "16/03",
    subtitulo: "“Cristo comigo, Cristo em mim, Cristo atrás e à minha frente”",
    como_rezar: COMO_REZAR_PADRAO,
    sinal_da_cruz: SINAL_DA_CRUZ_PADRAO,
    oracao_inicial: `Ó glorioso São Patrício, bispo fiel e missionário incansável, escolhido por Deus para levar a luz do Evangelho ao povo da Irlanda, nós recorremos à vossa intercessão com fé e confiança. Vós que, mesmo diante das provações, perseguições e perigos, jamais desististes da missão confiada pelo Senhor, ensinai-nos a confiar plenamente na providência divina.

Intercedei por nós junto a Deus, para que, ao rezarmos esta novena, sejamos fortalecidos na fé, na esperança e no amor. Alcançai-nos as graças de que necessitamos para nossa vida espiritual e para o cumprimento da vontade de Deus, se assim for de Seu agrado.
Amém.
`,
    oracao_final: `Ó glorioso São Patrício,
missionário fiel e apóstolo da fé,
intercedei por nós junto a Deus.
Fortalecei-nos na fé,
protegei-nos de todo mal
e conduzi-nos à vida eterna.
Amém.`
  });

  upsertDia(
    patricio.id,
    1,
    "PRIMEIRO DIA – SÃO PATRÍCIO, CHAMADO POR DEUS",
    `Ó São Patrício, desde jovem fostes chamado por Deus de maneira misteriosa, passando por sofrimentos que prepararam vosso coração para a missão.

Ajudai-nos a compreender que Deus age também nas dificuldades da vida. Que saibamos reconhecer Seu chamado mesmo nos momentos de dor e incerteza.

Ensinai-nos a confiar nos planos de Deus para nossa vida.

(Fazer o pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    patricio.id,
    2,
    "SEGUNDO DIA – SÃO PATRÍCIO, HOMEM DE ORAÇÃO",
    `Ó santo missionário, vossa força vinha da oração constante e da intimidade com Deus.

Ensinai-nos a cultivar uma vida de oração fiel e perseverante. Que aprendamos a buscar em Deus a força para enfrentar os desafios do dia a dia.

Que a oração seja nossa proteção e nosso refúgio.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    patricio.id,
    3,
    "TERCEIRO DIA – SÃO PATRÍCIO, MISSIONÁRIO DO EVANGELHO",
    `Ó São Patrício, obedecendo ao chamado de Deus, retornastes à terra onde havíeis sofrido para anunciar o Evangelho com coragem e amor.

Ajudai-nos a anunciar Cristo com palavras e atitudes. Que não tenhamos medo de testemunhar nossa fé onde quer que estejamos.

Fazei de nós instrumentos da evangelização.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    patricio.id,
    4,
    "QUARTO DIA – ÃO PATRÍCIO, DEFENSOR DA SANTÍSSIMA TRINDADE",
    `Ó São Patrício, com simplicidade ensinastes o mistério da Santíssima Trindade, ajudando o povo a compreender o amor de Deus Pai, Filho e Espírito Santo.

Ajudai-nos a viver em comunhão com a Trindade Santa. Que nossa fé seja firme e esclarecida, sustentada pelo amor divino.

Ensinai-nos a professar nossa fé com clareza e fidelidade.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    patricio.id,
    5,
    "QUINTO DIA – SÃO PATRÍCIO, EXEMPLO DE HUMILDADE",
    `Ó glorioso São Patrício, apesar dos frutos de vossa missão, permanecestes humilde, reconhecendo que tudo vinha de Deus.

Livrai-nos do orgulho e da vaidade. Ensinai-nos a reconhecer que toda obra boa é fruto da graça divina.

Que aprendamos a servir a Deus com coração simples e humilde.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    patricio.id,
    6,
    "SEXTO DIA – SÃO PATRÍCIO, FORTE NAS PROVAÇÕES",
    `Ó fiel servo de Deus, enfrentastes perseguições, perigos e incompreensões, mas jamais abandonastes a fé.

Ajudai-nos a permanecer firmes nas provações da vida. Que não desanimemos diante das dificuldades, mas confiemos sempre no Senhor.

Fortalecei nossa fé e nossa perseverança.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    patricio.id,
    7,
    "SÉTIMO DIA – SÃO PATRÍCIO, PROTETOR CONTRA O MAL",
    `Ó São Patrício, confiastes plenamente no poder de Deus contra todo mal e toda adversidade.

Protegei-nos contra as armadilhas do inimigo e contra tudo aquilo que nos afasta de Deus. Que vivamos sob a proteção do Senhor.

Ajudai-nos a confiar na força da oração e da fé.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    patricio.id,
    8,
    "OITAVO DIA – SÃO PATRÍCIO, PASTOR ZELOSO",
    `Ó santo bispo, cuidastes do povo que Deus vos confiou com amor, dedicação e espírito pastoral.

Intercedei pelos bispos, sacerdotes e missionários. Que sejam fiéis à missão de anunciar o Evangelho.

Ajudai-nos a amar a Igreja e a colaborar com sua missão.


(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    patricio.id,
    9,
    "NONO DIA – SÃO PATRÍCIO, TESTEMUNHA DA ESPERANÇA",
    `Ó glorioso São Patrício, vossa vida foi testemunho de esperança e confiança na promessa da vida eterna.

Ajudai-nos a viver com os olhos voltados para o Céu. Que jamais percamos a esperança, mesmo nas tribulações.

Conduzi-nos no caminho da fé até a glória eterna.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  //NOVENA A SÃO JOSÉ

  const jose = upsertNovena({
    slug: makeSlug("NOVENA A SÃO JOSÉ"),
    titulo: "NOVENA A SÃO JOSÉ",
    periodo_inicio: "10/03",
    periodo_fim: "18/03",
    subtitulo: "Trabalhador fiel, sustentou a Sagrada Família",
    como_rezar: COMO_REZAR_PADRAO,
    sinal_da_cruz: SINAL_DA_CRUZ_PADRAO,
    oracao_inicial: `Ó glorioso São José, esposo da Virgem Maria e pai adotivo de Jesus, a vós recorremos com confiança filial. Deus vos escolheu para guardar Seus maiores tesouros na terra e confiou-vos a missão de proteger a Sagrada Família com amor, fidelidade e obediência.

Olhai por nós, poderoso intercessor. Concedei-nos a graça de rezar esta novena com fé sincera e coração humilde, para que, por vossa intercessão, alcancemos as graças necessárias para nossa vida espiritual, familiar e profissional, se assim for da vontade de Deus. Ensinai-nos a confiar sempre na providência divina e a viver segundo os desígnios do Senhor.
Amém.`,
    oracao_final: `Ó glorioso São José,
protetor da Igreja e das famílias,
guardião fiel de Jesus e Maria,
rogai por nós.
Ajudai-nos a viver na fé, na esperança e no amor
e conduzi-nos à vida eterna.
Amém.
`
  });

  upsertDia(
    jose.id,
    1,
    "PRIMEIRO DIA – SÃO JOSÉ, HOMEM JUSTO",
    `Ó São José, a Sagrada Escritura vos chama de homem justo. Vossa vida foi marcada pela fidelidade a Deus e pela retidão de coração.

Ajudai-nos a viver com justiça, honestidade e fidelidade aos mandamentos do Senhor. Que nossas escolhas sejam sempre guiadas pela vontade de Deus.

Ensinai-nos a buscar a santidade nas atitudes simples do dia a dia.

(Fazer o pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    jose.id,
    2,
    "SEGUNDO DIA – SÃO JOSÉ, ESPOSO FIEL DE MARIA",
    `Ó São José, escolhestes amar e respeitar Maria com um amor puro, fiel e generoso, assumindo com responsabilidade a missão que Deus vos confiou.

Ajudai-nos a viver relações marcadas pelo respeito, pela fidelidade e pelo amor verdadeiro. Protegei os esposos e as famílias.

Que nossos lares sejam lugares de paz, fé e amor.


(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    jose.id,
    3,
    "TERCEIRO DIA – SÃO JOSÉ, PAI SOLICITO DE JESUS",
    `Ó São José, cuidastes de Jesus com ternura, dedicação e responsabilidade, ensinando-Lhe o valor do trabalho e da obediência.

Ajudai-nos a cuidar com amor daqueles que Deus nos confiou. Protegei as crianças, os jovens e todos os que precisam de cuidado e orientação.

Ensinai-nos a viver a paternidade e a maternidade com responsabilidade e amor.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    jose.id,
    4,
    "QUARTO DIA – SÃO JOSÉ, EXEMPLO DE OBEDIÊNCIA",
    `Ó fiel São José, obedecestes prontamente à vontade de Deus, mesmo quando ela exigia sacrifícios e renúncias.

Ajudai-nos a escutar a voz de Deus e a obedecer com confiança, mesmo quando o caminho é difícil ou incerto.

Que aprendamos convosco a dizer “sim” aos planos do Senhor.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    jose.id,
    5,
    "QUINTO DIA – SÃO JOSÉ, TRABALHADOR FIEL",
    `Ó São José, com o trabalho de vossas mãos sustentastes a Sagrada Família, vivendo com dignidade e simplicidade.

Abençoai nosso trabalho e nossos esforços diários. Ajudai-nos a trabalhar com honestidade, responsabilidade e espírito de serviço.

Que nunca nos falte o necessário para viver com dignidade.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    jose.id,
    6,
    "SEXTO DIA – SÃO JOSÉ, MODELO DE HUMILDADE E SILÊNCIO",
    `Ó São José, vivestes no silêncio, sem buscar reconhecimento, mas cumprindo fielmente a missão confiada por Deus.

Ensinai-nos o valor do silêncio, da humildade e da confiança em Deus. Livrai-nos do orgulho e da vaidade.

Que saibamos servir a Deus com coração simples e sincero.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    jose.id,
    7,
    "SÉTIMO DIA – SÃO JOSÉ, PROTETOR DAS FAMÍLIAS",
    `Ó São José, guardião da Sagrada Família, protegei nossos lares e nossas famílias.

Afastai de nós todo mal, toda discórdia e toda falta de fé. Que nossos lares sejam lugares de amor, perdão e oração.

Intercedei para que nossas famílias permaneçam unidas e firmes na fé.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    jose.id,
    8,
    "OITAVO DIA – SÃO JOSÉ, INTERCESSOR PODEROSO",
    `Ó glorioso São José, a Igreja vos reconhece como poderoso intercessor junto a Deus.

Apresentai ao Senhor nossas necessidades e intenções. Alcançai-nos as graças que mais necessitamos para nossa vida espiritual e material.

Aumentai nossa confiança na oração e na providência divina.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    jose.id,
    9,
    "NONO DIA – SÃO JOSÉ, PADROEIRO DA BOA MORTE",
    `Ó São José, que tivestes a graça de morrer nos braços de Jesus e Maria, sede nosso intercessor na hora da morte.

Ajudai-nos a viver bem para morrer bem, na graça de Deus. Protegei-nos no último momento de nossa vida e conduzi-nos à glória eterna.

Que, sob vossa proteção, alcancemos a salvação prometida por Cristo.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  //NOVENA DA ANUNCIAÇÃO DO SENHOR

  const anunciacao = upsertNovena({
    slug: makeSlug("NOVENA DA ANUNCIAÇÃO DO SENHOR"),
    titulo: "NOVENA DA ANUNCIAÇÃO DO SENHOR",
    periodo_inicio: "16/03",
    periodo_fim: "24/03",
    subtitulo: "Verbum caro factum est",
    como_rezar: COMO_REZAR_PADRAO,
    sinal_da_cruz: SINAL_DA_CRUZ_PADRAO,
    oracao_inicial: `Senhor Deus, Pai de infinito amor, no mistério da Anunciação revelastes ao mundo o vosso plano de salvação. Pela ação do Espírito Santo, o Vosso Filho eterno fez-Se carne no seio da Virgem Maria, iniciando a obra da nossa redenção.

Nós Vos louvamos e bendizemos por tão grande mistério de amor. Concedei-nos a graça de rezar esta novena com fé sincera, coração aberto e espírito obediente, para que, a exemplo de Maria, saibamos acolher a Vossa vontade em nossa vida. Que este tempo de oração produza frutos de conversão, confiança e amor, e nos conceda as graças necessárias para nossa vida e salvação, conforme o Vosso divino querer.
Amém.`,
    oracao_final: `Ó Deus de amor e misericórdia,
que pelo “sim” da Virgem Maria
fizestes Vosso Filho habitar entre nós,
concedei-nos um coração obediente e fiel.
Que acolhamos Vossa vontade com amor
e vivamos sempre na graça do Senhor.
Por Cristo, nosso Senhor.
Amém.
`
  });

  upsertDia(
    anunciacao.id,
    1,
    "PRIMEIRO DIA – O ANÚNCIO DO PLANO DE DEUS",
    `No silêncio de Nazaré, Deus revelou Seu plano eterno de salvação. A Anunciação não foi apenas um anúncio, mas o início da realização da promessa feita à humanidade.

Senhor, ajudai-nos a reconhecer que também falais conosco no silêncio do coração. Muitas vezes, Vossa voz se manifesta de forma simples, discreta, mas cheia de amor.

Que saibamos escutar com atenção e acolher com fé aquilo que Deus nos pede.

(Fazer o pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    anunciacao.id,
    2,
    "SEGUNDO DIA – MARIA, CHEIA DE GRAÇA",
    `O anjo saudou Maria como “cheia de graça”. Nela, a graça de Deus encontrou plena acolhida e perfeita correspondência.

Virgem Santíssima, ajudai-nos a viver na graça de Deus, afastando-nos do pecado e buscando uma vida santa. Ensinai-nos a valorizar a graça recebida no Batismo e a renová-la diariamente pela oração e pelos sacramentos.

Que nosso coração seja morada digna do Senhor.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    anunciacao.id,
    3,
    "TERCEIRO DIA – O SIM LIVRE E CONSCIENTE DE MARIA",
    `Diante do anúncio do anjo, Maria não foi forçada nem constrangida. Seu “sim” foi livre, consciente e cheio de amor.

Senhor, ensinai-nos a dizer “sim” à Vossa vontade, mesmo quando ela exige renúncia e confiança. Que não sejamos guiados pelo medo, mas pela fé.

Ajudai-nos a responder ao Vosso chamado com generosidade e entrega.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    anunciacao.id,
    4,
    "QUARTO DIA – A HUMILDADE DA SERVA DO SENHOR",
    `Maria se reconhece como “serva do Senhor”. Sua grandeza está na humildade e na total dependência de Deus.

Livrai-nos do orgulho e da autossuficiência. Ensinai-nos a viver com humildade, reconhecendo que tudo o que somos e temos vem de Deus.

Que nossa vida seja um serviço fiel à vontade do Pai.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    anunciacao.id,
    5,
    "QUINTO DIA – O MISTÉRIO DA ENCARNAÇÃO",
    `No momento da Anunciação, o Verbo eterno se fez carne. Deus entrou na história humana para nos salvar.

Senhor Jesus, nós Vos adoramos e agradecemos por Vosso amor infinito. Ajudai-nos a acolher-Vos em nossa vida, permitindo que Vossa presença transforme nosso coração.

Que jamais sejamos indiferentes ao mistério da Encarnação.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    anunciacao.id,
    6,
    "SEXTO DIA – A AÇÃO DO ESPÍRITO SANTO",
    `Foi pela ação do Espírito Santo que o Filho de Deus se encarnou no seio de Maria. O Espírito é o grande protagonista da obra da salvação.

Espírito Santo, conduzi-nos e iluminai nossas escolhas. Ajudai-nos a confiar em Vossa ação em nossa vida, mesmo quando não compreendemos plenamente os caminhos de Deus.

Renovai nosso coração e fortalecei nossa fé.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    anunciacao.id,
    7,
    "SÉTIMO DIA – MARIA, MODELO DE FÉ E CONFIANÇA",
    `Maria acreditou nas promessas de Deus e entregou-Se totalmente à Sua vontade. Sua fé foi maior do que o medo e a incerteza.

Ajudai-nos a confiar em Deus nos momentos difíceis. Que nossa fé seja firme, mesmo quando não vemos respostas imediatas.

Ensinai-nos a caminhar na confiança e na esperança.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    anunciacao.id,
    8,
    "OITAVO DIA – A ANUNCIAÇÃO E NOSSA VOCAÇÃO",
    `O “sim” de Maria abriu caminho para a salvação do mundo. Cada vocação, vivida com fidelidade, também contribui para o plano de Deus.

Senhor, ajudai-nos a descobrir e viver nossa vocação com alegria e responsabilidade. Que sejamos fiéis no estado de vida ao qual fomos chamados.

Usai nossa vida como instrumento do Vosso amor.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    anunciacao.id,
    9,
    "NONO DIA – A ANUNCIAÇÃO E A ESPERANÇA DA SALVAÇÃO",
    `A Anunciação marca o início da nossa redenção. Em Maria, a esperança se tornou realidade.

Senhor Deus, ao final desta novena, renovai nossa esperança. Que vivamos confiantes na Vossa promessa de salvação e perseverantes na fé até o fim.

Que, a exemplo de Maria, saibamos acolher Cristo todos os dias em nossa vida.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  const gemma = upsertNovena({
    slug: makeSlug("NOVENA A SANTA GEMMA"),
    titulo: "NOVENA A SANTA GEMMA",
    periodo_inicio: "02/04",
    periodo_fim: "10/04",
    subtitulo: "“Quem verdadeiramente ama, voluntariamente sofre”",
    como_rezar: COMO_REZAR_PADRAO,
    sinal_da_cruz: SINAL_DA_CRUZ_PADRAO,
    oracao_inicial: `Ó Deus de infinita misericórdia, que adornastes Santa Gemma Galgani com profundo amor pela Paixão de Vosso Filho e a conduzistes pelos caminhos da humildade, do sofrimento e da união íntima convosco, nós Vos louvamos e bendizemos.

Por intercessão de Santa Gemma, concedei-nos a graça de rezar esta novena com fé sincera, coração humilde e espírito de abandono. Que, unidos à cruz de Cristo, saibamos oferecer nossas dores, lutas e alegrias para a salvação do mundo e para nossa santificação. Concedei-nos também as graças que necessitamos para nossa vida, se assim for da Vossa santa vontade.
Amém.`,
    oracao_final: `Ó Deus, que concedestes a Santa Gemma Galgani
uma profunda união com a Paixão de Vosso Filho,
concedei-nos, por sua intercessão,
amor à cruz, fidelidade na oração
e perseverança na fé.
Por Cristo, nosso Senhor.
Amém.`
  });

  upsertDia(
    gemma.id,
    1,
    "PRIMEIRO DIA – SANTA GEMMA, ALMA APAIXONADA POR JESUS",
    `Santa Gemma, desde jovem fostes profundamente atraída pelo amor de Jesus. Vosso coração desejava pertencer inteiramente a Ele, sem reservas.

Ajudai-nos a amar Jesus acima de todas as coisas. Que nossa vida não seja dividida, mas totalmente entregue ao Senhor.

Ensinai-nos a buscar uma relação íntima e sincera com Cristo.

(Fazer o pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    gemma.id,
    2,
    "SEGUNDO DIA – SANTA GEMMA, AMANTE DA CRUZ",
    `Ó Santa Gemma, vossa vida foi marcada pelo sofrimento aceito com amor e oferecido a Deus. Vistes na cruz não um castigo, mas um caminho de união com Cristo.

Ajudai-nos a compreender o valor redentor do sofrimento. Que saibamos unir nossas dores às de Jesus, oferecendo-as com fé e confiança.

Fortalecei-nos nas provações da vida.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    gemma.id,
    3,
    "TERCEIRO DIA – SANTA GEMMA, EXEMPLO DE HUMILDADE",
    `Santa Gemma, apesar das graças extraordinárias que recebestes, permanecestes profundamente humilde, escondida aos olhos do mundo.

Livrai-nos do orgulho e da vaidade. Ensinai-nos a viver com simplicidade, reconhecendo que tudo vem de Deus.

Que aprendamos a servir sem buscar reconhecimento.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    gemma.id,
    4,
    "QUARTO DIA – SANTA GEMMA, VIDA DE ORAÇÃO",
    `Ó Santa Gemma, encontráveis na oração força, consolo e intimidade com Deus. Vosso diálogo constante com o Senhor sustentava vossa vida espiritual.

Ajudai-nos a cultivar uma vida de oração fiel e perseverante. Que aprendamos a rezar com o coração, confiando plenamente em Deus.

Que a oração seja nossa fonte de força diária.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    gemma.id,
    5,
    "QUINTO DIA – SANTA GEMMA, PUREZA DE CORAÇÃO",
    `Santa Gemma, vosso coração era puro e totalmente voltado para Deus. Vivestes com grande amor à santidade e à obediência.

Ajudai-nos a buscar a pureza de coração e de intenções. Que fujamos do pecado e vivamos na graça de Deus.

Conduzi-nos no caminho da santidade.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    gemma.id,
    6,
    "SEXTO DIA – SANTA GEMMA, UNIÃO COM A PAIXÃO DE CRISTO",
    `Ó Santa Gemma, fostes profundamente unida à Paixão de Jesus, participando de Seus sofrimentos com amor e abandono.

Ajudai-nos a contemplar a Paixão de Cristo com fé e gratidão. Que aprendamos a oferecer nossas dores pela conversão dos pecadores.

Que nossa vida seja marcada pelo amor ao Cristo crucificado.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    gemma.id,
    7,
    "SÉTIMO DIA – SANTA GEMMA, OBEDIÊNCIA E ABANDONO",
    `Santa Gemma, mesmo diante das incompreensões e das provações, permanecestes obediente e abandonada à vontade de Deus.

Ensinai-nos a confiar nos desígnios do Senhor, mesmo quando não os compreendemos. Que saibamos abandonar-nos com confiança nas mãos de Deus.

Fortalecei nossa fé e nossa perseverança.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    gemma.id,
    8,
    "OITAVO DIA – SANTA GEMMA, AMOR À EUCARISTIA",
    `Ó Santa Gemma, encontráveis na Eucaristia força, consolo e profunda união com Jesus.

Ajudai-nos a amar o Santíssimo Sacramento. Que a Eucaristia seja o centro de nossa vida cristã.

Ensinai-nos a viver em comunhão com Cristo presente no altar.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    gemma.id,
    9,
    "NONO DIA – SANTA GEMMA, INTERCESSORA DOS AFLITOS",
    `Santa Gemma, que tanto sofrestes nesta vida, sede intercessora para os que passam por dores físicas, espirituais e emocionais.

Acolhei esta novena que rezamos com fé e confiança. Apresentai a Deus nossos pedidos e necessidades.

Ajudai-nos a viver unidos a Cristo até o fim e a alcançar a glória eterna.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  //NOVENA A SÃO JORGE

const jorge = upsertNovena({
    slug: makeSlug("NOVENA A SÃO JORGE"),
    titulo: "NOVENA A SÃO JORGE",
    periodo_inicio: "14/04",
    periodo_fim: "22/04",
    subtitulo: "O martírio selou sua fidelidade a Jesus",
    como_rezar: COMO_REZAR_PADRAO,
    sinal_da_cruz: SINAL_DA_CRUZ_PADRAO,
    oracao_inicial: `Ó glorioso São Jorge, valente soldado de Cristo e mártir fiel do Evangelho, nós recorremos à vossa poderosa intercessão. Vós que enfrentastes as forças do mal com coragem, fé e total confiança em Deus, ensinai-nos a combater o bom combate da fé.

Olhai por nós, protetor fiel. Concedei-nos a graça de rezar esta novena com fé sincera, coração confiante e espírito perseverante, para que, fortalecidos pela graça de Deus e por vossa intercessão, sejamos vencedores nas batalhas espirituais da vida e alcancemos as graças necessárias para nossa vida e salvação, conforme a vontade do Senhor.
Amém.`,
    oracao_final: `Ó glorioso São Jorge,
valente defensor da fé cristã,
protegei-nos nas batalhas da vida
e ajudai-nos a vencer todo mal.
Fortalecei nossa fé,
guardai-nos sob a proteção de Deus
e conduzi-nos à vida eterna.
Amém.`
  });

  upsertDia(
    jorge.id,
    1,
    "PRIMEIRO DIA – SÃO JORGE, SOLDADO FIEL DE CRISTO",
    `Ó São Jorge, vossa vida foi marcada pela fidelidade absoluta a Jesus Cristo. Mesmo sendo soldado do exército romano, escolhestes servir antes de tudo ao Rei dos Céus.

Ajudai-nos a colocar Deus acima de qualquer interesse humano. Que nossa vida seja testemunho de fidelidade ao Evangelho, mesmo quando isso exige sacrifício.

Ensinai-nos a lutar com coragem pelas coisas de Deus.

(Fazer o pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    jorge.id,
    2,
    "SEGUNDO DIA – SÃO JORGE, EXEMPLO DE CORAGEM NA FÉ",
    `Ó glorioso mártir, não temestes as ameaças nem as perseguições. Vossa coragem nasceu da fé profunda em Cristo.

Ajudai-nos a vencer o medo que paralisa nossa fé. Que saibamos enfrentar as dificuldades da vida confiando no poder de Deus.

Fortalecei-nos para permanecermos firmes na fé em todas as circunstâncias.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    jorge.id,
    3,
    "TERCEIRO DIA – SÃO JORGE, DEFENSOR DA VERDADE",
    `Ó São Jorge, preferistes perder honras e a própria vida a negar a verdade do Evangelho.

Ajudai-nos a viver na verdade, rejeitando toda forma de injustiça, mentira e pecado. Que nossas palavras e atitudes reflitam os valores cristãos.

Dai-nos firmeza para defender a fé com amor e coerência.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    jorge.id,
    4,
    "QUARTO DIA – SÃO JORGE, VENCEDOR DO MAL",
    `Ó valente guerreiro de Cristo, sois representado vencendo o dragão, símbolo do mal e do pecado.

Ajudai-nos a vencer as tentações, os vícios e tudo aquilo que nos afasta de Deus. Protegei-nos contra as forças do mal que ameaçam nossa vida espiritual.

Que, revestidos da armadura da fé, sejamos sempre vencedores em Cristo.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    jorge.id,
    5,
    "QUINTO DIA – SÃO JORGE, MODELO DE FORTALEZA NAS PROVAÇÕES",
    `Ó São Jorge, mesmo diante de grandes sofrimentos, permanecestes firme e confiante em Deus.

Ajudai-nos a suportar com paciência e esperança as provações da vida. Que jamais desanimemos diante das dificuldades.

Ensinai-nos a confiar no Senhor em meio às lutas diárias.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    jorge.id,
    6,
    "SEXTO DIA – SÃO JORGE, PROTETOR DOS AFLITOS",
    `Ó glorioso São Jorge, sede amparo para os que sofrem, os aflitos, os perseguidos e os que se sentem oprimidos.

Intercedei por aqueles que enfrentam batalhas espirituais, familiares, profissionais ou de saúde. Alcançai-lhes força, paz e libertação.

Que encontremos em Deus nossa segurança e proteção.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    jorge.id,
    7,
    "SÉTIMO DIA – SÃO JORGE, EXEMPLO DE FIDELIDADE ATÉ O FIM",
    `Ó fiel mártir, até o último momento permanecestes fiel a Cristo, selando vossa fé com o próprio sangue.

Ajudai-nos a perseverar na fé até o fim de nossa vida. Que não nos afastemos do Senhor diante das dificuldades ou tentações.

Fortalecei nossa esperança na vida eterna.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    jorge.id,
    8,
    "OITAVO DIA – SÃO JORGE, INTERCESSOR PODEROSO",
    `Ó São Jorge, a Igreja reconhece em vós um poderoso intercessor nas lutas espirituais e nas dificuldades da vida.

Apresentai a Deus nossos pedidos e necessidades. Intercedei por nossas famílias, nosso trabalho e nossa vida espiritual.

Aumentai nossa confiança na oração e na proteção divina.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    jorge.id,
    9,
    "NONO DIA – SÃO JORGE, VITORIOSO EM CRISTO",
    `Ó glorioso São Jorge, vossa vitória não foi humana, mas espiritual. Em Cristo, vencestes o mal e alcançastes a coroa da glória eterna.

Ajudai-nos a viver confiantes na vitória de Cristo sobre todo mal. Que nossa vida seja marcada pela fé, pela coragem e pela esperança.

Conduzi-nos no caminho da salvação até a glória eterna.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );


//NOVENA A SANTA GIANNA BERETTA MOLLA  

const gianna = upsertNovena({
    slug: makeSlug("NOVENA A SANTA GIANNA BERETTA MOLLA  "),
    titulo: "NOVENA A SANTA GIANNA BERETTA MOLLA  ",
    periodo_inicio: "19/04",
    periodo_fim: "27/04",
    subtitulo: "Médica por profissão, santa por amor",
    como_rezar: COMO_REZAR_PADRAO,
    sinal_da_cruz: SINAL_DA_CRUZ_PADRAO,
    oracao_inicial: `Ó Deus de infinita bondade, que chamastes Santa Gianna Beretta Molla a viver a santidade no cotidiano, como esposa, mãe e médica, nós Vos louvamos por seu testemunho luminoso de fé, amor e entrega total à vida.

Por sua intercessão, concedei-nos a graça de rezar esta novena com fé sincera, coração generoso e espírito de confiança. Que, a exemplo de Santa Gianna, saibamos amar profundamente a vida, servir com alegria e acolher a vontade de Deus mesmo nos momentos de sacrifício. Concedei-nos também as graças que necessitamos para nossa vida e salvação, se assim for da Vossa santa vontade.
Amém.
`,
    oracao_final: `Ó Deus de amor e misericórdia,
que nos destes em Santa Gianna Beretta Molla
um exemplo luminoso de amor à vida,
concedei-nos, por sua intercessão,
fidelidade à Vossa vontade,
coragem no amor e perseverança na fé.
Por Cristo, nosso Senhor.
Amém.`
  });

  upsertDia(
    gianna.id,
    1,
    "PRIMEIRO DIA – SANTA GIANNA, CHAMADA À SANTIDADE NO COTIDIANO",
    `Santa Gianna, vivestes a santidade não em feitos extraordinários aos olhos do mundo, mas na fidelidade diária às pequenas e grandes responsabilidades da vida.

Ajudai-nos a compreender que a santidade é possível em nossa realidade concreta: no trabalho, na família, nas decisões diárias. Que não busquemos a santidade longe da vida real, mas no amor vivido a cada dia.

Ensinai-nos a transformar o cotidiano em caminho de santificação.

(Fazer o pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    gianna.id,
    2,
    "SEGUNDO DIA – SANTA GIANNA, MULHER DE FÉ PROFUNDA",
    `Santa Gianna, vossa vida foi sustentada por uma fé viva, alimentada pela oração, pelos sacramentos e pela confiança em Deus.

Ajudai-nos a fortalecer nossa fé, especialmente nos momentos de dúvida e dificuldade. Que aprendamos a buscar em Deus a força necessária para enfrentar os desafios da vida.

Ensinai-nos a confiar no Senhor em todas as circunstâncias.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    gianna.id,
    3,
    "TERCEIRO DIA – SANTA GIANNA, AMOR À VIDA",
    `Santa Gianna, reconhecestes a vida humana como dom sagrado de Deus, digno de ser amado, protegido e defendido desde a concepção até a morte natural.

Ajudai-nos a respeitar, amar e defender a vida em todas as suas fases. Que sejamos instrumentos da cultura da vida em um mundo tantas vezes marcado pela indiferença.

Ensinai-nos a olhar cada vida com os olhos de Deus.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    gianna.id,
    4,
    "QUARTO DIA – SANTA GIANNA, ESPOSA AMOROSA E FIEL",
    `Santa Gianna, vivestes o matrimônio como verdadeira vocação, marcada pelo amor, pela fidelidade e pela entrega generosa.

Intercedei pelos esposos, para que vivam seu matrimônio com amor sincero, diálogo, respeito e fé. Ajudai-nos a construir lares fundamentados no amor cristão.

Que nossas famílias sejam lugares de vida, fé e esperança.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    gianna.id,
    5,
    "QUINTO DIA – SANTA GIANNA, MÃE GENEROSA E CORAJOSA",
    `Santa Gianna, vivestes a maternidade como dom precioso, oferecendo vossa própria vida para que vossa filha pudesse viver.

Ajudai as mães a viverem sua missão com amor, coragem e confiança em Deus. Protegei as gestantes e as crianças, especialmente as mais vulneráveis.

Que aprendamos a amar com generosidade e espírito de sacrifício.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    gianna.id,
    6,
    "SEXTO DIA – SANTA GIANNA, MÉDICA A SERVIÇO DA VIDA",
    `Santa Gianna, exercestes a medicina como verdadeira missão, unindo competência profissional, ética e caridade cristã.

Intercedei pelos profissionais da saúde, para que atuem sempre com respeito à vida, à dignidade humana e à vontade de Deus. Ajudai-nos a servir ao próximo com amor e responsabilidade.

Que nosso trabalho seja sempre expressão de amor ao próximo.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    gianna.id,
    7,
    "SÉTIMO DIA – SANTA GIANNA, TESTEMUNHO DE SACRIFÍCIO E ENTREGA",
    `Santa Gianna, em vosso momento mais difícil, escolhestes confiar plenamente em Deus, oferecendo vossa vida por amor.

Ajudai-nos a aceitar com fé os sacrifícios que a vida nos apresenta. Que saibamos oferecer nossas dores e renúncias como ato de amor a Deus e aos irmãos.

Ensinai-nos o verdadeiro significado do amor que se doa.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    gianna.id,
    8,
    "OITAVO DIA – SANTA GIANNA, MODELO PARA AS FAMÍLIAS",
    `Santa Gianna, vossa vida é exemplo luminoso para as famílias cristãs, chamadas a viver o amor, a fé e a fidelidade no dia a dia.

Intercedei por nossas famílias, para que sejam protegidas de todo mal e fortalecidas na fé. Que nelas reinem o amor, o perdão e a oração.

Ajudai-nos a construir famílias segundo o coração de Deus.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    gianna.id,
    9,
    "NONO DIA – SANTA GIANNA, INTERCESSORA PODEROSA JUNTO A DEUS",
    `Santa Gianna Beretta Molla, acolhei esta novena que rezamos com fé e confiança. Apresentai a Deus nossos pedidos, necessidades e intenções.

Intercedei por nossa vida, por nossas famílias e por todos aqueles que necessitam de esperança, cura e paz. Conduzi-nos no caminho da santidade até a vida eterna.

Obrigado por vosso exemplo e vossa intercessão constante.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  //NOVENA A SANTA CATARINA DE SIENA 

const catarina = upsertNovena({
    slug: makeSlug("NOVENA A SANTA CATARINA DE SIENA"),
    titulo: "NOVENA A SANTA CATARINA DE SIENA",
    periodo_inicio: "20/04",
    periodo_fim: "28/04",
    subtitulo: "“Se fores aquilo que Deus quer, colocareis fogo no mundo”",
    como_rezar: COMO_REZAR_PADRAO,
    sinal_da_cruz: SINAL_DA_CRUZ_PADRAO,
    oracao_inicial: `Ó Deus eterno e misericordioso, que inflamastes o coração de Santa Catarina de Siena com ardente amor por Vós, pela verdade e pela Santa Igreja, nós Vos louvamos e bendizemos por tão grande testemunho de fé e coragem.

Por intercessão de Santa Catarina, concedei-nos a graça de rezar esta novena com coração sincero, espírito humilde e desejo verdadeiro de conversão. Que, iluminados por sua vida e ensinamentos, aprendamos a amar-Vos acima de todas as coisas, a servir a Igreja com fidelidade e a viver o Evangelho com coragem e coerência. Concedei-nos também as graças que necessitamos para nossa vida e salvação, conforme a Vossa santa vontade.
Amém.`,
    oracao_final: `Ó Deus eterno,
que concedestes a Santa Catarina de Siena
ardente amor pela verdade e pela Igreja,
concedei-nos, por sua intercessão,
fidelidade ao Evangelho,
coragem para viver a fé
e perseverança até a vida eterna.
Por Cristo, nosso Senhor.
Amém.`
  });

  upsertDia(
    catarina.id,
    1,
    "PRIMEIRO DIA – SANTA CATARINA, AMANTE APAIXONADA DE DEUS",
    `Santa Catarina, desde jovem vosso coração ardia de amor por Deus. Nada neste mundo era capaz de saciar vossa alma senão a união com o Senhor.

Ajudai-nos a colocar Deus no centro de nossa vida. Que não busquemos falsas seguranças, mas encontremos em Deus nossa verdadeira alegria e paz.

Ensinai-nos a amar o Senhor com todo o coração, alma e entendimento.

(Fazer o pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    catarina.id,
    2,
    "SEGUNDO DIA – SANTA CATARINA, EXEMPLO DE ORAÇÃO PROFUNDA",
    `Santa Catarina, vossa vida foi sustentada por intensa vida de oração e intimidade com Deus. No silêncio e no recolhimento, encontráveis força e sabedoria.

Ajudai-nos a cultivar uma vida de oração fiel e perseverante. Que aprendamos a escutar a voz de Deus no silêncio do coração.

Ensinai-nos a rezar não apenas com palavras, mas com a vida inteira.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    catarina.id,
    3,
    "TERCEIRO DIA – SANTA CATARINA, OBEDIÊNCIA À VONTADE DE DEUS",
    `Santa Catarina, mesmo desejando a vida retirada, aceitastes com generosidade a missão que Deus vos confiou no mundo.

Ajudai-nos a discernir e acolher a vontade de Deus em nossa vida. Que saibamos dizer “sim” aos Seus desígnios, mesmo quando exigem renúncia e coragem.

Ensinai-nos a confiar plenamente nos planos do Senhor.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    catarina.id,
    4,
    "QUARTO DIA – SANTA CATARINA, AMOR À IGREJA",
    `Santa Catarina, vosso amor pela Igreja era ardente e sincero. Não temestes corrigir, aconselhar e exortar com caridade, sempre buscando a unidade e a fidelidade ao Evangelho.

Intercedei pela Santa Igreja, pelo Papa, pelos bispos, sacerdotes e por todo o povo de Deus. Que todos vivam na verdade, na santidade e no amor.

Ajudai-nos a amar e servir a Igreja com fidelidade.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    catarina.id,
    5,
    "QUINTO DIA – SANTA CATARINA, DEFENSORA DA VERDADE",
    `Santa Catarina, com coragem e sabedoria, defendestes a verdade do Evangelho, mesmo diante de incompreensões e resistências.

Ajudai-nos a viver na verdade e a rejeitar toda forma de mentira, injustiça e pecado. Que nossas palavras e atitudes reflitam os valores do Evangelho.

Concedei-nos coragem para testemunhar a fé com amor e firmeza.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    catarina.id,
    6,
    "SEXTO DIA – SANTA CATARINA, SERVA DOS POBRES E SOFREDORES",
    `Santa Catarina, vosso amor a Deus se manifestava no cuidado com os pobres, doentes e abandonados.

Ajudai-nos a reconhecer Cristo nos que sofrem. Que sejamos sensíveis às dores do próximo e pratiquemos a caridade com generosidade.

Ensinai-nos a servir com humildade e compaixão.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    catarina.id,
    7,
    "SÉTIMO DIA – SANTA CATARINA, HUMILDADE E FORTALEZA",
    `Santa Catarina, apesar das grandes graças recebidas, permanecestes humilde e totalmente dependente de Deus.

Livrai-nos do orgulho e da autossuficiência. Ensinai-nos a viver com humildade e confiança, reconhecendo que tudo vem de Deus.

Fortalecei-nos para permanecermos fiéis nas provações.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    catarina.id,
    8,
    "OITAVO DIA – SANTA CATARINA, UNIÃO COM CRISTO CRUCIFICADO",
    `Santa Catarina, vossa vida foi profundamente marcada pela contemplação da Paixão de Cristo e pelo desejo de participar de Seus sofrimentos por amor.

Ajudai-nos a contemplar a cruz com fé e gratidão. Que saibamos unir nossas dores às de Cristo, oferecendo-as pela salvação das almas.

Ensinai-nos o valor redentor do sacrifício vivido com amor.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    catarina.id,
    9,
    "NONO DIA – SANTA CATARINA, INTERCESSORA E DOUTORA DA IGREJA",
    `Santa Catarina de Siena, doutora da Igreja e fiel serva de Deus, acolhei esta novena que rezamos com fé e confiança.

Apresentai a Deus nossos pedidos e necessidades. Intercedei por nossa vida espiritual, por nossa fidelidade ao Evangelho e por nossa perseverança até o fim.

Conduzi-nos no caminho da santidade e da vida eterna.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  //NOVENA A SANTO ATANÁSIO 

  const atanasio = upsertNovena({
    slug: makeSlug("NOVENA A SANTO ATANÁSIO"),
    titulo: "NOVENA A SANTO ATANÁSIO ",
    periodo_inicio: "24/04",
    periodo_fim: "02/05",
    subtitulo: "Defensor da fé apostólica e da divindade do Verbo",
    como_rezar: COMO_REZAR_PADRAO,
    sinal_da_cruz: SINAL_DA_CRUZ_PADRAO,
    oracao_inicial: `Ó Deus eterno e todo-poderoso, que suscitastes Santo Atanásio como intrépido defensor da verdadeira fé, concedendo-lhe coragem, sabedoria e fidelidade inabalável à verdade do Vosso Filho, nós Vos louvamos e bendizemos por tão grande testemunho.

Por intercessão de Santo Atanásio, concedei-nos a graça de rezar esta novena com fé sincera, coração firme e amor profundo à verdade. Fortalecei-nos para que, em meio às confusões e desafios do nosso tempo, permaneçamos fiéis à doutrina da Igreja e ao Evangelho de Jesus Cristo. Concedei-nos também as graças de que necessitamos para nossa vida e salvação, conforme a Vossa santa vontade.
Amém.`,
    oracao_final: `Ó Deus todo-poderoso,
que fortalecestes Santo Atanásio
na defesa da verdadeira fé,
concedei-nos, por sua intercessão,
fidelidade inabalável ao Evangelho,
coragem para testemunhar a verdade
e perseverança até a vida eterna.
Por Cristo, nosso Senhor.
Amém.`
  });

  upsertDia(
    atanasio.id,
    1,
    "PRIMEIRO DIA – SANTO ATANÁSIO, DEFENSOR DA DIVINDADE DE CRISTO",
    `Santo Atanásio, fostes chamado a defender a verdade central da nossa fé: Jesus Cristo é verdadeiro Deus e verdadeiro homem.

Ajudai-nos a professar com firmeza nossa fé em Cristo, Filho eterno do Pai. Que jamais relativizemos a verdade do Evangelho por medo ou conveniência.

Ensinai-nos a amar profundamente Jesus Cristo e a reconhecê-Lo como Senhor de nossa vida.

(Fazer o pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    atanasio.id,
    2,
    "SEGUNDO DIA – SANTO ATANÁSIO, AMOR À VERDADE",
    `Santo Atanásio, enfrentastes perseguições, calúnias e exílios por amor à verdade, sem jamais trair a fé recebida da Igreja.

Ajudai-nos a viver na verdade, mesmo quando ela é difícil ou impopular. Que não negociemos nossa fé por interesses humanos.

Concedei-nos coragem para permanecer fiéis ao Evangelho em todas as circunstâncias.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    atanasio.id,
    3,
    "TERCEIRO DIA – SANTO ATANÁSIO, FIDELIDADE À IGREJA",
    `Santo Atanásio, mesmo perseguido e incompreendido, jamais vos afastastes da Igreja nem rompestes a comunhão.

Intercedei para que amemos a Igreja com fidelidade e respeito. Que saibamos permanecer unidos ao Magistério e à Tradição.

Ajudai-nos a viver nossa fé em comunhão e obediência.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    atanasio.id,
    4,
    "QUARTO DIA – SANTO ATANÁSIO, CORAGEM NAS PERSEGUIÇÕES",
    `Santo Atanásio, fostes exilado diversas vezes, mas nunca abandonastes a missão confiada por Deus.

Ajudai-nos a enfrentar as perseguições, incompreensões e dificuldades com fé e perseverança. Que não desanimemos diante das provações.

Ensinai-nos a confiar que Deus sustenta os que permanecem fiéis.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    atanasio.id,
    5,
    "QUINTO DIA – SANTO ATANÁSIO, PASTOR ZELOSO",
    `Santo Atanásio, cuidastes do rebanho confiado a vós com amor, firmeza e espírito pastoral.

Intercedei pelos bispos, sacerdotes e pastores da Igreja. Que sejam fiéis à verdade e corajosos na missão.

Ajudai-nos a rezar por nossos pastores e a colaborar com a missão da Igreja.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    atanasio.id,
    6,
    "SEXTO DIA – SANTO ATANÁSIO, HOMEM DE ORAÇÃO",
    `Santo Atanásio, vossa força vinha da oração e da intimidade com Deus, especialmente nos momentos de solidão e exílio.

Ensinai-nos a buscar na oração a força para permanecer firmes na fé. Que nossa vida espiritual seja sólida e perseverante.

Ajudai-nos a confiar mais em Deus do que em nossas próprias forças.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    atanasio.id,
    7,
    "SÉTIMO DIA – SANTO ATANÁSIO, DEFENSOR DA FÉ CONTRA OS ERROS",
    `Santo Atanásio, com sabedoria e firmeza, combatestes as heresias que ameaçavam a fé da Igreja.

Ajudai-nos a conhecer melhor nossa fé e a discernir os erros que nos afastam da verdade. Que sejamos firmes, mas sempre caridosos.

Concedei-nos clareza de mente e fidelidade ao Evangelho.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    atanasio.id,
    8,
    "OITAVO DIA – SANTO ATANÁSIO, EXEMPLO DE PERSEVERANÇA",
    `Santo Atanásio, apesar de longos anos de luta, jamais desististes da missão confiada por Deus.

Ajudai-nos a perseverar na fé até o fim. Que não nos deixemos vencer pelo cansaço espiritual nem pelo desânimo.

Fortalecei nossa esperança na vitória final de Cristo.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    atanasio.id,
    9,
    "NONO DIA – SANTO ATANÁSIO, DOUTOR DA IGREJA E INTERCESSOR PODEROSO",
    `Santo Atanásio, doutor da Igreja e fiel servo da verdade, acolhei esta novena que rezamos com fé e confiança.

Apresentai a Deus nossos pedidos e necessidades. Intercedei por nossa fidelidade à fé católica e por nossa perseverança até a vida eterna.

Conduzi-nos no caminho da verdade, da santidade e da salvação.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

//NOVENA A NOSSA SENHORA DE FÁTIMA

const fatima = upsertNovena({
    slug: makeSlug("NOVENA A NOSSA SENHORA DE FÁTIMA"),
    titulo: "NOVENA A NOSSA SENHORA DE FÁTIMA",
    periodo_inicio: "04/05",
    periodo_fim: "12/05",
    subtitulo: "Rezar, reparar, confiar",
    como_rezar: COMO_REZAR_PADRAO,
    sinal_da_cruz: SINAL_DA_CRUZ_PADRAO,
    oracao_inicial: `Ó Maria Santíssima, Nossa Senhora de Fátima, que aparecestes aos três pastorinhos como Mãe cheia de amor e misericórdia, chamando o mundo à oração, à penitência e à conversão do coração, nós recorremos a vós com fé e confiança filial.

Vós que viestes do Céu para nos recordar o caminho da salvação, acolhei-nos sob vossa proteção materna. Concedei-nos a graça de rezar esta novena com coração sincero, espírito humilde e desejo verdadeiro de mudança de vida. Que, por vossa poderosa intercessão, alcancemos as graças necessárias para nossa vida espiritual, para nossas famílias e para a paz do mundo, conforme a santa vontade de Deus.
Amém.`,
    oracao_final: `Ó Nossa Senhora de Fátima,
Mãe da misericórdia e da paz,
acolhei-nos sob vosso Imaculado Coração.
Conduzi-nos à conversão, à oração e à santidade.
Protegei nossas famílias
e alcançai-nos a paz do coração e do mundo.
Amém.`
  });

  upsertDia(
    fatima.id,
    1,
    "PRIMEIRO DIA – NOSSA SENHORA DE FÁTIMA, MÃE QUE NOS VISITA",
    `Nossa Senhora de Fátima, vós descestes do Céu para visitar vossos filhos, mostrando que Deus não abandona a humanidade, mesmo quando ela se afasta Dele.

Ajudai-nos a reconhecer a presença amorosa de Deus em nossa vida. Que nunca nos esqueçamos de que o Céu se inclina sobre a terra para nos conduzir à salvação.

Ensinai-nos a acolher vossas mensagens com fé e gratidão.

(Fazer o pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    fatima.id,
    2,
    "SEGUNDO DIA – NOSSA SENHORA DE FÁTIMA, CHAMADO À CONVERSÃO",
    `Ó Mãe Santíssima, em Fátima chamastes o mundo à conversão sincera do coração, convidando-nos a abandonar o pecado e a voltar para Deus.

Ajudai-nos a reconhecer nossas faltas e a buscar o perdão do Senhor com humildade. Que nossa vida seja transformada pela graça divina.

Conduzi-nos no caminho da conversão verdadeira e duradoura.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    fatima.id,
    3,
    "TERCEIRO DIA – NOSSA SENHORA DE FÁTIMA, MÃE DA ORAÇÃO",
    `Nossa Senhora de Fátima, pedistes insistentemente que rezássemos, especialmente o Santo Rosário, como caminho de salvação e de paz.

Ensinai-nos a amar a oração e a perseverar nela todos os dias. Que o Rosário seja para nós fonte de graça, proteção e intimidade com Deus.

Ajudai-nos a rezar com o coração e com confiança filial.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    fatima.id,
    4,
    "QUARTO DIA – NOSSA SENHORA DE FÁTIMA, MÃE DA PENITÊNCIA",
    `Ó Mãe compassiva, convidastes os pastorinhos a oferecer sacrifícios e penitências pela conversão dos pecadores.

Ajudai-nos a compreender o valor do sacrifício vivido com amor. Que saibamos oferecer nossas dificuldades, dores e renúncias pela salvação das almas.

Ensinai-nos a viver uma vida de penitência unida ao amor de Cristo.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    fatima.id,
    5,
    "QUINTO DIA – NOSSA SENHORA DE FÁTIMA, MÃE DO IMACULADO CORAÇÃO",
    `Nossa Senhora de Fátima, revelastes o vosso Imaculado Coração como refúgio e caminho que conduz a Deus.

Ajudai-nos a consagrar nossa vida ao vosso Coração Imaculado. Que encontremos em vós proteção, consolo e segurança espiritual.

Conduzi-nos sempre para mais perto de Jesus.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    fatima.id,
    6,
    "SEXTO DIA – NOSSA SENHORA DE FÁTIMA, INTERCESSORA DOS PECADORES",
    `Ó Mãe misericordiosa, manifestastes grande preocupação com a salvação das almas, pedindo orações pelos pecadores.

Intercedei por aqueles que estão afastados de Deus. Alcançai-lhes a graça da conversão e do retorno ao caminho da fé.

Que nosso coração também se abra à misericórdia e à caridade.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    fatima.id,
    7,
    "SÉTIMO DIA – NOSSA SENHORA DE FÁTIMA, RAINHA DA PAZ",
    `Nossa Senhora de Fátima, vós pedistes orações pela paz no mundo e no coração dos homens.

Intercedei pela paz em nossas famílias, comunidades e nações. Ajudai-nos a ser instrumentos de paz, promovendo o amor, o perdão e a reconciliação.

Que a paz de Cristo reine em nossos corações.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    fatima.id,
    8,
    "OITAVO DIA – NOSSA SENHORA DE FÁTIMA, MODELO DE FÉ E OBEDIÊNCIA",
    `Ó Virgem fiel, vosso “sim” a Deus abriu caminho para a salvação do mundo. Em Fátima, chamais-nos a viver com fé e obediência.

Ajudai-nos a confiar plenamente em Deus, mesmo quando não compreendemos Seus planos. Que nossa fé seja firme e perseverante.

Ensinai-nos a viver segundo a vontade do Senhor.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    fatima.id,
    9,
    "NONO DIA – NOSSA SENHORA DE FÁTIMA, NOSSA MÃE E ESPERANÇA",
    `Nossa Senhora de Fátima, acolhei esta novena que rezamos com amor e confiança. Apresentai a Deus nossos pedidos e necessidades.

Renovai nossa esperança e fortalecei nossa fé. Conduzi-nos no caminho da santidade e da salvação, até a glória eterna.

Obrigado, Mãe querida, por vosso cuidado e intercessão constante.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  //NOVENA A SANTA RITA DE CÁSSIA

  const rita = upsertNovena({
    slug: makeSlug("NOVENA A SANTA RITA DE CÁSSIA"),
    titulo: "NOVENA A SANTA RITA DE CÁSSIA",
    periodo_inicio: "13/05",
    periodo_fim: "21/05",
    subtitulo: "Da chaga do espinho, nasceu a esperança que não decepciona",
    como_rezar: COMO_REZAR_PADRAO,
    sinal_da_cruz: SINAL_DA_CRUZ_PADRAO,
    oracao_inicial: `Ó Deus de misericórdia infinita, que concedestes a Santa Rita de Cássia a graça de viver com fidelidade em todos os estados de vida — como esposa, mãe e religiosa — e a tornastes sinal de esperança nas situações mais difíceis, nós Vos louvamos e bendizemos.

Por intercessão de Santa Rita, concedei-nos a graça de rezar esta novena com fé sincera, coração confiante e espírito perseverante. Que, a exemplo desta santa tão amada, saibamos confiar plenamente em Vós, mesmo nas dores, contrariedades e causas que aos olhos humanos parecem impossíveis. Concedei-nos também as graças de que necessitamos para nossa vida e salvação, conforme a Vossa santa vontade.
Amém.`,
    oracao_final: `Ó Deus de misericórdia,
que fizestes de Santa Rita de Cássia
um exemplo luminoso de fé nas provações,
concedei-nos, por sua intercessão,
confiança inabalável em Vós,
paciência nas dores
e esperança nas causas difíceis.
Por Cristo, nosso Senhor.
Amém.
`
  });

  upsertDia(
    rita.id,
    1,
    "PRIMEIRO DIA – SANTA RITA, MULHER CHAMADA POR DEUS",
    `Santa Rita, desde o início de vossa vida, fostes escolhida por Deus para uma missão especial, mesmo enfrentando caminhos que não eram os que desejáveis.

Ajudai-nos a confiar nos desígnios de Deus, mesmo quando nossos planos são contrariados. Que aprendamos a aceitar a vontade do Senhor com fé e abandono.

Ensinai-nos a reconhecer que Deus conduz nossa história com amor.

(Fazer o pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    rita.id,
    2,
    "SEGUNDO DIA – SANTA RITA, ESPOSA PACIENTE E FIEL",
    `Santa Rita, vivestes um matrimônio marcado por dificuldades, sofrimento e incompreensões, mas respondestes com paciência, oração e amor.

Intercedei pelos esposos e pelas famílias que enfrentam crises e dificuldades. Ajudai-nos a viver o perdão, o diálogo e a fidelidade.

Que aprendamos a transformar a dor em caminho de graça.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    rita.id,
    3,
    "TERCEIRO DIA – SANTA RITA, MÃE DEDICADA E SOFRIDA",
    `Santa Rita, como mãe conhecestes profundas dores e angústias, entregando tudo nas mãos de Deus.

Consolai as mães que sofrem pelos filhos. Intercedei pelos jovens, para que encontrem o caminho do bem e da fé.

Ajudai-nos a confiar que Deus age mesmo nas situações mais dolorosas.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    rita.id,
    4,
    "QUARTO DIA – SANTA RITA, EXEMPLO DE PERDÃO",
    `Santa Rita, respondestes ao ódio com perdão e à violência com oração, vivendo o Evangelho de Cristo de forma heroica.

Ajudai-nos a perdoar de coração aqueles que nos feriram. Libertai-nos do rancor, da mágoa e do desejo de vingança.

Que aprendamos a viver o perdão que cura e liberta.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    rita.id,
    5,
    "QUINTO DIA – SANTA RITA, CHAMADA À VIDA CONSAGRADA",
    `Santa Rita, após tantas perdas, fostes chamada à vida religiosa, onde vivestes na humildade, na obediência e na oração constante.

Ajudai-nos a escutar o chamado de Deus e a responder com generosidade. Que sejamos fiéis à vocação que o Senhor nos confiou.

Ensinai-nos a buscar a santidade em qualquer estado de vida.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    rita.id,
    6,
    "SEXTO DIA – SANTA RITA, AMANTE DA PAIXÃO DE CRISTO",
    `Santa Rita, vosso coração esteve profundamente unido à Paixão de Cristo, participando de Seus sofrimentos com amor e entrega.

Ajudai-nos a contemplar a cruz com fé e confiança. Que saibamos unir nossas dores às de Jesus, oferecendo-as com amor.

Ensinai-nos a encontrar sentido cristão no sofrimento vivido com Deus.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    rita.id,
    7,
    "SÉTIMO DIA – SANTA RITA, EXEMPLO DE HUMILDADE E OBEDIÊNCIA",
    `Santa Rita, mesmo favorecida por graças extraordinárias, permanecestes humilde e obediente em tudo.

Livrai-nos do orgulho e da autossuficiência. Ensinai-nos a viver com humildade e confiança na providência divina.

Que nossa vida seja marcada pela simplicidade e pela fidelidade.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    rita.id,
    8,
    "OITAVO DIA – SANTA RITA, SANTA DAS CAUSAS IMPOSSÍVEIS",
    `Santa Rita, o povo cristão vos invoca como poderosa intercessora nas causas difíceis e humanamente impossíveis.

Intercedei por nossas necessidades mais urgentes e por aquelas situações que parecem sem solução. Fortalecei nossa fé e nossa esperança.

Que nunca deixemos de confiar no poder de Deus.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    rita.id,
    9,
    "NONO DIA – SANTA RITA, NOSSA INTERCESSORA JUNTO A DEUS",
    `Santa Rita de Cássia, acolhei esta novena que rezamos com fé e confiança. Apresentai a Deus nossos pedidos, dores e esperanças.

Intercedei por nossa vida espiritual, por nossas famílias e por todas as causas que colocamos sob vossa proteção. Conduzi-nos no caminho da santidade e da vida eterna.

Obrigado por vosso exemplo de fé, paciência e amor.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  //NOVENA A NOSSA SENHORA AUXILIADORA

  const auxiliadora = upsertNovena({
    slug: makeSlug("NOVENA A NOSSA SENHORA AUXILIADORA"),
    titulo: "NOVENA A NOSSA SENHORA AUXILIADORA",
    periodo_inicio: "15/05",
    periodo_fim: "23/05",
    subtitulo: "Confiai em Maria Auxiliadora e vereis o que são milagres",
    como_rezar: COMO_REZAR_PADRAO,
    sinal_da_cruz: SINAL_DA_CRUZ_PADRAO,
    oracao_inicial: `Ó Maria Santíssima, Nossa Senhora Auxiliadora dos Cristãos, Mãe amorosa e poderosa intercessora, a vós recorremos com confiança filial. Desde os primeiros tempos da Igreja, sois reconhecida como auxílio seguro do povo de Deus nas lutas, perseguições e necessidades da vida.

Olhai por nós, Mãe querida. Concedei-nos a graça de rezar esta novena com fé sincera, coração confiante e espírito perseverante, para que, amparados por vossa proteção materna, sejamos fortalecidos na fé, na esperança e no amor. Alcançai-nos as graças de que necessitamos para nossa vida espiritual, familiar e comunitária, conforme a santa vontade de Deus.
Amém.`,
    oracao_final: `Ó Nossa Senhora Auxiliadora dos Cristãos,
Mãe poderosa e cheia de amor,
sede nosso auxílio em todas as necessidades.
Protegei nossas famílias, fortalecei nossa fé
e conduzi-nos sempre a Jesus.
Hoje e sempre, sejais nossa Auxiliadora.
Amém.`
  });

  upsertDia(
    auxiliadora.id,
    1,
    "PRIMEIRO DIA – NOSSA SENHORA AUXILIADORA, MÃE QUE PROTEGE",
    `Nossa Senhora Auxiliadora, desde sempre sois reconhecida como Mãe protetora dos que a vós recorrem com confiança.

Ajudai-nos a sentir vossa presença materna em nossa vida. Protegei-nos dos perigos visíveis e invisíveis e guardai-nos sob vosso manto de amor.

Que jamais nos esqueçamos de recorrer a vós nos momentos de necessidade.

(Fazer o pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    auxiliadora.id,
    2,
    "SEGUNDO DIA – NOSSA SENHORA AUXILIADORA, AUXÍLIO NAS DIFICULDADES",
    `Ó Mãe Auxiliadora, o povo cristão sempre experimentou vosso auxílio nas horas mais difíceis.

Socorrei-nos em nossas angústias, problemas e aflições. Ajudai-nos a confiar que nunca estamos sozinhos, pois vós caminhais conosco.

Renovai nossa esperança quando tudo parece difícil.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    auxiliadora.id,
    3,
    "TERCEIRO DIA – NOSSA SENHORA AUXILIADORA, DEFESA DOS CRISTÃOS",
    `Nossa Senhora Auxiliadora, sois defensora fiel dos cristãos e guardiã da fé.

Protegei-nos contra tudo o que ameaça nossa vida espiritual. Ajudai-nos a permanecer firmes na fé e fiéis ao Evangelho de Jesus Cristo.

Que nunca nos afastemos da verdade do Senhor.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    auxiliadora.id,
    4,
    "QUARTO DIA – NOSSA SENHORA AUXILIADORA, MÃE DA IGREJA",
    `Ó Maria Santíssima, sois Auxiliadora da Igreja e de todos os seus filhos.

Intercedei pelo Papa, pelos bispos, sacerdotes, religiosos e por todo o povo de Deus. Que a Igreja permaneça fiel à sua missão de anunciar o Evangelho.

Ajudai-nos a amar, respeitar e servir a Igreja com fidelidade.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    auxiliadora.id,
    5,
    "QUINTO DIA – NOSSA SENHORA AUXILIADORA, AUXÍLIO DAS FAMÍLIAS",
    `Nossa Senhora Auxiliadora, sede amparo e proteção para nossas famílias.

Ajudai os lares que enfrentam dificuldades, desunião, doenças ou falta de fé. Que em nossas casas reinem o amor, o diálogo, o perdão e a oração.

Protegei especialmente as famílias mais necessitadas.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    auxiliadora.id,
    6,
    "SEXTO DIA – NOSSA SENHORA AUXILIADORA, AMPARO DOS JOVENS",
    `Ó Mãe Auxiliadora, tende especial cuidado pelos jovens, que tantas vezes enfrentam desafios, tentações e inseguranças.

Protegei-os e conduzi-os no caminho do bem. Ajudai-os a fazer escolhas justas e a viver segundo os valores do Evangelho.

Que encontrem em vós uma Mãe e uma guia segura.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    auxiliadora.id,
    7,
    "SÉTIMO DIA – NOSSA SENHORA AUXILIADORA, CONSOLADORA DOS AFLITOS",
    `Nossa Senhora Auxiliadora, sois consolo para os que sofrem no corpo e na alma.

Olhai pelos doentes, pelos aflitos, pelos desanimados e por todos os que carregam cruzes pesadas. Alcançai-lhes conforto, força e paz.

Ajudai-nos também a sermos instrumentos de consolo para os outros.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    auxiliadora.id,
    8,
    "OITAVO DIA – NOSSA SENHORA AUXILIADORA, MODELO DE CONFIANÇA EM DEUS",
    `Ó Virgem Santíssima, em todos os momentos de vossa vida confiastes plenamente na vontade de Deus.

Ensinai-nos a confiar no Senhor, mesmo quando não compreendemos Seus planos. Que nossa fé seja firme e perseverante.

Ajudai-nos a entregar nossa vida nas mãos de Deus com confiança filial.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    auxiliadora.id,
    9,
    "NONO DIA – NOSSA SENHORA AUXILIADORA, NOSSA ESPERANÇA E INTERCESSORA",
    `Nossa Senhora Auxiliadora, acolhei esta novena que rezamos com fé e amor. Apresentai a Deus nossos pedidos, necessidades e esperanças.

Sede sempre nosso auxílio nas lutas da vida. Conduzi-nos a Jesus e ajudai-nos a perseverar na fé até a vida eterna.

Obrigado, Mãe querida, por vosso cuidado e proteção constantes.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  //NOVENA A SÃO JOSÉ DE ANCHIETA 

  const anchieta = upsertNovena({
    slug: makeSlug("NOVENA A SÃO JOSÉ DE ANCHIETA"),
    titulo: "NOVENA A SÃO JOSÉ DE ANCHIETA",
    periodo_inicio: "31/05",
    periodo_fim: "08/06",
    subtitulo: "Apóstolo do Brasil, semeador do Evangelho",
    como_rezar: COMO_REZAR_PADRAO,
    sinal_da_cruz: SINAL_DA_CRUZ_PADRAO,
    oracao_inicial: `Ó Deus de infinita bondade, que chamastes São José de Anchieta a anunciar o Evangelho em terras brasileiras, fazendo dele missionário incansável, educador sábio e defensor dos mais fracos, nós Vos louvamos e bendizemos por tão grande testemunho de fé, coragem e amor.

Por intercessão de São José de Anchieta, concedei-nos a graça de rezar esta novena com fé sincera, coração generoso e espírito missionário. Que, a exemplo deste santo apóstolo, saibamos anunciar Cristo com palavras e com a vida, amando o próximo e buscando sempre a justiça, a paz e a verdade. Concedei-nos também as graças de que necessitamos para nossa vida e salvação, conforme a Vossa santa vontade.
Amém.`,
    oracao_final: `Ó Deus de amor e misericórdia,
que fizestes de São José de Anchieta
um incansável anunciador do Evangelho,
concedei-nos, por sua intercessão,
zelo missionário, amor à Igreja
e coragem para viver a fé.
Por Cristo, nosso Senhor.
Amém.`
  });

  upsertDia(
    anchieta.id,
    1,
    "PRIMEIRO DIA – SÃO JOSÉ DE ANCHIETA, CHAMADO MISSIONÁRIO",
    `São José de Anchieta, desde jovem respondestes com generosidade ao chamado de Deus, deixando vossa terra natal para anunciar o Evangelho em terras distantes.

Ajudai-nos a escutar o chamado de Deus em nossa vida. Que não tenhamos medo de sair de nós mesmos para servir ao Senhor e aos irmãos.

Ensinai-nos a viver com espírito missionário em nosso dia a dia.


(Fazer o pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    anchieta.id,
    2,
    "SEGUNDO DIA – SÃO JOSÉ DE ANCHIETA, EVANGELIZADOR INCANSÁVEL",
    `São José de Anchieta, dedicastes toda a vossa vida à evangelização, anunciando Jesus Cristo com zelo, criatividade e amor.

Ajudai-nos a testemunhar nossa fé com coragem e alegria. Que saibamos anunciar o Evangelho com palavras, atitudes e exemplo de vida.

Fazei de nós instrumentos da Boa-Nova no mundo.


(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    anchieta.id,
    3,
    "TERCEIRO DIA – SÃO JOSÉ DE ANCHIETA, DEFENSOR DOS POBRES E OPRIMIDOS",
    `São José de Anchieta, fostes incansável defensor dos povos indígenas e dos mais vulneráveis, lutando pela dignidade humana e pela justiça.

Ajudai-nos a reconhecer Cristo nos pobres, nos excluídos e nos que sofrem. Que sejamos sensíveis às injustiças e comprometidos com o bem comum.

Ensinai-nos a viver a caridade com coragem e verdade.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    anchieta.id,
    4,
    "QUARTO DIA – SÃO JOSÉ DE ANCHIETA, HOMEM DE ORAÇÃO",
    `São José de Anchieta, em meio às grandes atividades missionárias, mantivestes profunda vida de oração e união com Deus.

Ajudai-nos a cultivar uma vida de oração fiel e perseverante. Que encontremos na oração força, discernimento e paz.

Ensinai-nos a confiar mais em Deus do que em nossas próprias forças.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    anchieta.id,
    5,
    "QUINTO DIA – SÃO JOSÉ DE ANCHIETA, EDUCADOR E FORMADOR",
    `São José de Anchieta, fostes grande educador, utilizando a palavra, a escrita e a cultura como instrumentos de evangelização.

Intercedei pelos educadores, catequistas e formadores. Que desempenhem sua missão com sabedoria, paciência e amor.

Ajudai-nos a crescer no conhecimento da fé e no amor à verdade.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    anchieta.id,
    6,
    "SEXTO DIA – SÃO JOSÉ DE ANCHIETA, EXEMPLO DE HUMILDADE E OBEDIÊNCIA",
    `São José de Anchieta, mesmo realizando grandes obras, permanecestes humilde e obediente à vontade de Deus e à Igreja.

Livrai-nos do orgulho e da vaidade. Ensinai-nos a servir com humildade, reconhecendo que toda obra boa vem de Deus.

Que saibamos viver com espírito de obediência e simplicidade.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    anchieta.id,
    7,
    "SÉTIMO DIA – SÃO JOSÉ DE ANCHIETA, MISSIONÁRIO DA PAZ",
    `São José de Anchieta, fostes instrumento de paz em meio a conflitos, promovendo o diálogo, a reconciliação e o entendimento.

Ajudai-nos a ser construtores da paz em nossas famílias, comunidades e sociedade. Que rejeitemos a violência e busquemos sempre a reconciliação.

Fazei de nós instrumentos da paz de Cristo.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    anchieta.id,
    8,
    "OITAVO DIA – SÃO JOSÉ DE ANCHIETA, AMOR À IGREJA",
    `São José de Anchieta, servistes a Igreja com fidelidade e dedicação total, colocando vossos dons a serviço do Reino de Deus.

Intercedei pela Igreja no Brasil e no mundo. Que permaneça fiel à missão de anunciar o Evangelho e servir aos mais necessitados.

Ajudai-nos a amar e servir a Igreja com fidelidade e zelo.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    anchieta.id,
    9,
    "NONO DIA – SÃO JOSÉ DE ANCHIETA, APÓSTOLO DO BRASIL E INTERCESSOR PODEROSO",
    `São José de Anchieta, apóstolo do Brasil e fiel servo de Deus, acolhei esta novena que rezamos com fé e confiança.

Apresentai a Deus nossos pedidos e necessidades. Intercedei por nossa vida espiritual, por nosso país e por todos aqueles que necessitam de esperança, fé e paz.

Conduzi-nos no caminho da santidade e da vida eterna.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );



 
  //NOVENA A SÃO JOÃO BATISTA

  const batista = upsertNovena({
    slug: makeSlug("NOVENA A SÃO JOÃO BATISTA"),
    titulo: "NOVENA A SÃO JOÃO BATISTA",
    periodo_inicio: "15/06",
    periodo_fim: "23/06",
    subtitulo: "Voz que clama no deserto, preparando os caminhos do Senhor",
    como_rezar: COMO_REZAR_PADRAO,
    sinal_da_cruz: SINAL_DA_CRUZ_PADRAO,
    oracao_inicial: `Ó Deus de infinita bondade, que escolhestes São João Batista para preparar os caminhos do Senhor e anunciá-Lo como o Cordeiro que tira o pecado do mundo, nós Vos louvamos e bendizemos por tão grande missão confiada a este vosso servo fiel.

Por intercessão de São João Batista, concedei-nos a graça de rezar esta novena com fé sincera, coração arrependido e desejo verdadeiro de conversão. Que, a exemplo deste grande profeta, saibamos preparar em nossa vida o caminho para Jesus, vivendo na verdade, na humildade e na fidelidade à Vossa vontade. Concedei-nos também as graças que necessitamos para nossa vida e salvação, conforme o Vosso santo querer.
Amém.`,
    oracao_final: `Ó Deus todo-poderoso,
que levantastes São João Batista
para preparar os caminhos do Senhor,
concedei-nos, por sua intercessão,
um coração convertido, humilde e fiel.
Que preparemos nossa vida
para acolher Jesus Cristo, nosso Salvador.
Amém.`
  });

  upsertDia(
    batista.id,
    1,
    "PRIMEIRO DIA – SÃO JOÃO BATISTA, ESCOLHIDO DESDE O VENTRE MATERNO",
    `São João Batista, antes mesmo de nascer, já fostes consagrado ao Senhor e escolhido para uma missão única na história da salvação.

Ajudai-nos a reconhecer que também fomos chamados por Deus desde sempre. Que descubramos nossa missão e a vivamos com fidelidade.

Ensinai-nos a confiar que Deus tem um plano para cada vida.

(Fazer o pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    batista.id,
    2,
    "SEGUNDO DIA – SÃO JOÃO BATISTA, PROFETA DO ALTÍSSIMO",
    `São João Batista, fostes o último e o maior dos profetas, escolhido para anunciar a chegada do Messias.

Ajudai-nos a escutar a voz de Deus e a discernir Seus apelos em nossa vida. Que sejamos atentos aos sinais do Senhor e fiéis à Sua Palavra.

Ensinai-nos a viver guiados pela verdade do Evangelho.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    batista.id,
    3,
    "TERCEIRO DIA – SÃO JOÃO BATISTA, VOZ QUE CLAMA NO DESERTO",
    `São João Batista, no deserto proclamastes a necessidade da conversão e do arrependimento sincero.

Ajudai-nos a reconhecer nossos pecados e a buscar a conversão do coração. Que abandonemos tudo o que nos afasta de Deus.

Ensinai-nos a preparar os caminhos do Senhor em nossa vida.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    batista.id,
    4,
    "QUARTO DIA – SÃO JOÃO BATISTA, EXEMPLO DE HUMILDADE",
    `São João Batista, mesmo sendo reconhecido pelo povo, jamais buscastes glória para vós, mas apontastes sempre para Cristo.

Livrai-nos do orgulho e da vaidade. Ensinai-nos a diminuir para que Cristo cresça em nós.

Que nossa vida glorifique a Deus e não a nós mesmos.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    batista.id,
    5,
    "QUINTO DIA – SÃO JOÃO BATISTA, TESTEMUNHA DA VERDADE",
    `São João Batista, defendestes a verdade com coragem, mesmo sabendo que isso vos custaria a liberdade e a própria vida.

Ajudai-nos a viver na verdade e a rejeitar toda forma de mentira e injustiça. Que sejamos fiéis ao Evangelho, mesmo nas dificuldades.

Dai-nos coragem para testemunhar nossa fé.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    batista.id,
    6,
    "SEXTO DIA – SÃO JOÃO BATISTA, PRECURSOR DO CORDEIRO DE DEUS",
    `São João Batista, reconhecestes em Jesus o Cordeiro de Deus e conduzistes muitos a Ele.

Ajudai-nos a conduzir as pessoas a Cristo com nosso exemplo de vida. Que nossas palavras e atitudes apontem sempre para Jesus.

Ensinai-nos a amar profundamente o Salvador.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    batista.id,
    7,
    "SÉTIMO DIA – SÃO JOÃO BATISTA, MODELO DE VIDA SIMPLES E DESAPEGADA",
    `São João Batista, escolhestes uma vida simples, desapegada dos bens e voltada inteiramente para Deus.

Ajudai-nos a viver com simplicidade e desprendimento. Que não coloquemos nosso coração nas coisas passageiras.

Ensinai-nos a buscar as coisas do alto.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    batista.id,
    8,
    "OITAVO DIA – SÃO JOÃO BATISTA, FIEL ATÉ O MARTÍRIO",
    `São João Batista, permanecestes fiel à missão até o fim, selando vosso testemunho com o próprio sangue.

Ajudai-nos a perseverar na fé até o fim da vida. Que não recuemos diante das dificuldades ou perseguições.

Fortalecei nossa esperança na vida eterna.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    batista.id,
    9,
    "NONO DIA – SÃO JOÃO BATISTA, INTERCESSOR JUNTO A DEUS",
    `São João Batista, acolhei esta novena que rezamos com fé e confiança. Apresentai a Deus nossos pedidos e necessidades.

Intercedei por nossa conversão, por nossa vida espiritual e por nossa perseverança no caminho do bem. Conduzi-nos sempre a Jesus, o Cordeiro de Deus que tira o pecado do mundo.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  //NOVENA A SÃO PEDRO E SÃO PAULO

  const pedropaulo = upsertNovena({
    slug: makeSlug("NOVENA A SÃO PEDRO E SÃO PAULO"),
    titulo: "NOVENA A SÃO PEDRO E SÃO PAULO",
    periodo_inicio: "20/06",
    periodo_fim: "28/06",
    subtitulo: "Enviados a anunciar Cristo até os confins do mundo",
    como_rezar: COMO_REZAR_PADRAO,
    sinal_da_cruz: SINAL_DA_CRUZ_PADRAO,
    oracao_inicial: `Ó Deus eterno e todo-poderoso, que escolhestes São Pedro e São Paulo como colunas da vossa Igreja, confiando a um a missão de confirmar os irmãos na fé e ao outro a tarefa de anunciar o Evangelho a todas as nações, nós Vos louvamos e bendizemos por tão grandes testemunhas do amor e da verdade.

Por intercessão de São Pedro e São Paulo, concedei-nos a graça de rezar esta novena com fé sincera, coração firme e espírito missionário. Que, seguindo o exemplo destes santos apóstolos, aprendamos a amar profundamente a Igreja, a viver com fidelidade o Evangelho e a perseverar na fé até o fim. Concedei-nos também as graças que necessitamos para nossa vida e salvação, conforme a Vossa santa vontade.
Amém.`,
    oracao_final: `Ó gloriosos São Pedro e São Paulo,
colunas da Igreja e testemunhas fiéis de Cristo,
rogai por nós junto a Deus.
Fortalecei nossa fé,
inflamai nosso coração no amor ao Evangelho
e conduzi-nos no caminho da salvação.
Amém.`
  });

  upsertDia(
    pedropaulo.id,
    1,
    "PRIMEIRO DIA – SÃO PEDRO E SÃO PAULO, ESCOLHIDOS POR CRISTO",
    `São Pedro e São Paulo, escolhidos diretamente por Cristo, fostes chamados não por vossos méritos, mas pela graça de Deus.

Ajudai-nos a reconhecer que também somos chamados pelo Senhor, apesar de nossas limitações. Que saibamos acolher nossa vocação com humildade e gratidão.

Ensinai-nos a confiar mais na graça de Deus do que em nossas próprias forças.

(Fazer o pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    pedropaulo.id,
    2,
    "SEGUNDO DIA – SÃO PEDRO, ROCHA DA FÉ",
    `São Pedro, Jesus confiou-vos as chaves do Reino dos Céus e fez de vós a rocha sobre a qual edificou a Sua Igreja.

Ajudai-nos a permanecer firmes na fé da Igreja. Que jamais nos afastemos da verdade ensinada por Cristo e transmitida pelos apóstolos.

Intercedei para que sejamos fiéis à Igreja em todas as circunstâncias.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    pedropaulo.id,
    3,
    "TERCEIRO DIA – SÃO PAULO, APÓSTOLO DAS NAÇÕES",
    `São Paulo, após o encontro com Cristo, dedicastes toda a vossa vida ao anúncio do Evangelho, levando a Boa-Nova aos povos mais distantes.

Ajudai-nos a viver com espírito missionário. Que sejamos anunciadores de Cristo com palavras e atitudes, onde quer que estejamos.

Ensinai-nos a não ter medo de testemunhar nossa fé.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    pedropaulo.id,
    4,
    "QUARTO DIA – SÃO PEDRO, EXEMPLO DE CONVERSÃO E HUMILDADE",
    `São Pedro, mesmo tendo negado o Senhor, fostes perdoado e restaurado por Seu amor misericordioso.

Ajudai-nos a confiar no perdão de Deus quando caímos. Que saibamos levantar-nos, arrependidos, e recomeçar com fé renovada.

Ensinai-nos a humildade e a confiança na misericórdia divina.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    pedropaulo.id,
    5,
    "QUINTO DIA – SÃO PAULO, TRANSFORMADO PELA GRAÇA",
    `São Paulo, de perseguidor da Igreja, tornastes-vos seu mais ardoroso defensor, mostrando o poder transformador da graça de Deus.

Ajudai-nos a permitir que Cristo transforme nossa vida. Que não resistamos à ação do Espírito Santo em nosso coração.

Ensinai-nos a viver uma conversão sincera e profunda.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    pedropaulo.id,
    6,
    "SEXTO DIA – SÃO PEDRO E SÃO PAULO, AMOR À IGREJA",
    `São Pedro e São Paulo, amastes a Igreja com todo o coração e destes a vida por ela.

Intercedei pelo Papa, pelos bispos, sacerdotes e por todo o povo de Deus. Que a Igreja permaneça fiel à sua missão e unida na caridade.

Ajudai-nos a amar, defender e servir a Igreja com fidelidade.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    pedropaulo.id,
    7,
    "SÉTIMO DIA – SÃO PEDRO E SÃO PAULO, CORAGEM NAS PROVAÇÕES",
    `São Pedro e São Paulo, enfrentastes perseguições, prisões e sofrimentos por amor a Cristo.

Ajudai-nos a permanecer firmes na fé diante das dificuldades da vida. Que não desanimemos nas provações, mas confiemos no Senhor.

Fortalecei nossa coragem e perseverança cristã.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    pedropaulo.id,
    8,
    "OITAVO DIA – SÃO PEDRO E SÃO PAULO, TESTEMUNHAS DA VERDADE",
    `São Pedro e São Paulo, anunciastes a verdade do Evangelho sem concessões, mesmo diante da morte.

Ajudai-nos a viver na verdade e a rejeitar tudo o que nos afasta de Deus. Que nossa vida seja testemunho fiel de Cristo.

Concedei-nos sabedoria e fidelidade à verdade.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    pedropaulo.id,
    9,
    "NONO DIA – SÃO PEDRO E SÃO PAULO, GLORIFICADOS NO CÉU",
    `São Pedro e São Paulo, após uma vida de entrega total, alcançastes a glória eterna prometida por Cristo.

Acolhei esta novena que rezamos com fé e confiança. Apresentai a Deus nossos pedidos e necessidades.

Intercedei por nós, para que perseveremos na fé até o fim e alcancemos a vida eterna.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  //NOVENA A SÃO BENTO 

  const bento = upsertNovena({
    slug: makeSlug("NOVENA A SÃO BENTO"),
    titulo: "NOVENA A SÃO BENTO",
    periodo_inicio: "02/07",
    periodo_fim: "10/07",
    subtitulo: "“Crux sacra sit mihi lux”",
    como_rezar: COMO_REZAR_PADRAO,
    sinal_da_cruz: SINAL_DA_CRUZ_PADRAO,
    oracao_inicial: `Ó Deus eterno e todo-poderoso, que escolhestes São Bento como mestre da vida espiritual, guia seguro no caminho da santidade e poderoso defensor contra as ciladas do mal, nós Vos louvamos e bendizemos por tão grande dom concedido à Igreja.

Por intercessão de São Bento, concedei-nos a graça de rezar esta novena com fé sincera, coração vigilante e desejo verdadeiro de conversão. Que, seguindo seus ensinamentos de oração, trabalho, humildade e obediência, sejamos fortalecidos na fé, protegidos contra todo mal e conduzidos no caminho da paz. Concedei-nos também as graças que necessitamos para nossa vida e salvação, conforme a Vossa santa vontade.
Amém.`,
    oracao_final: `Ó glorioso São Bento,
pai espiritual e fiel servo de Deus,
protegei-nos contra todo mal
e conduzi-nos no caminho da santidade.
Que, fortalecidos pela fé e pela oração,
vivamos sempre na paz de Cristo.
Amém.`
  });

  upsertDia(
    bento.id,
    1,
    "PRIMEIRO DIA – SÃO BENTO, BUSCADOR DE DEUS",
    `São Bento, desde jovem abandonastes as vaidades do mundo para buscar somente a Deus e viver segundo Sua vontade.

Ajudai-nos a colocar Deus no centro de nossa vida. Que não nos deixemos seduzir pelo que passa, mas busquemos o que é eterno.

Ensinai-nos a viver com o coração voltado para Deus.

(Fazer o pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    bento.id,
    2,
    "SEGUNDO DIA – SÃO BENTO, MESTRE DA VIDA INTERIOR",
    `São Bento, vossa vida foi marcada pelo silêncio, pela oração e pela escuta atenta da voz de Deus.

Ajudai-nos a cultivar a vida interior. Que aprendamos a silenciar o coração para ouvir o Senhor.

Ensinai-nos a rezar com perseverança e confiança.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    bento.id,
    3,
    "TERCEIRO DIA – SÃO BENTO, EXEMPLO DE HUMILDADE",
    `São Bento, apesar de vossa sabedoria e autoridade espiritual, vivestes na humildade, reconhecendo que tudo vinha de Deus.

Livrai-nos do orgulho e da autossuficiência. Ensinai-nos a viver com humildade e simplicidade de coração.

Que saibamos depender mais de Deus do que de nós mesmos.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    bento.id,
    4,
    "QUARTO DIA – SÃO BENTO, MODELO DE OBEDIÊNCIA",
    `São Bento, ensinastes que a obediência é caminho seguro para a paz interior e para a santidade.

Ajudai-nos a obedecer à vontade de Deus, aos Seus mandamentos e aos ensinamentos da Igreja.

Que saibamos acolher a vontade divina mesmo quando ela exige renúncia.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    bento.id,
    5,
    "QUINTO DIA – SÃO BENTO, DEFENSOR CONTRA O MAL",
    `São Bento, pela graça de Deus, fostes poderoso defensor contra as ciladas do inimigo, vencendo o mal com a fé e a oração.

Protegei-nos contra todo mal espiritual e corporal. Afastai de nós as tentações, os perigos e tudo o que nos afasta de Deus.

Que vivamos sempre sob a proteção do Senhor.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    bento.id,
    6,
    "SEXTO DIA – SÃO BENTO, MESTRE DO EQUILÍBRIO CRISTÃO",
    `São Bento, ensinastes o equilíbrio entre oração e trabalho, mostrando que toda a vida pode ser oferecida a Deus.

Ajudai-nos a viver com equilíbrio, responsabilidade e espírito de serviço. Que nosso trabalho seja realizado com honestidade e oferecido ao Senhor.

Ensinai-nos a santificar o cotidiano.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    bento.id,
    7,
    "SÉTIMO DIA – SÃO BENTO, PROMOTOR DA PAZ",
    `São Bento, vossa vida e vossa regra conduzem à paz do coração e à harmonia na convivência fraterna.

Intercedei para que reine a paz em nossas famílias, comunidades e no mundo. Ajudai-nos a ser instrumentos da paz de Cristo.

Que aprendamos a viver na caridade e no perdão.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    bento.id,
    8,
    "OITAVO DIA – SÃO BENTO, GUIA NO CAMINHO DA SANTIDADE",
    `São Bento, por vossos ensinamentos, conduzistes muitos no caminho da santidade e da vida eterna.

Ajudai-nos a perseverar no bem, mesmo diante das dificuldades. Que não desanimemos na caminhada cristã.

Fortalecei nossa esperança e nossa fé.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    bento.id,
    9,
    "NONO DIA – SÃO BENTO, NOSSO PODEROSO INTERCESSOR",
    `São Bento, acolhei esta novena que rezamos com fé e confiança. Apresentai a Deus nossos pedidos e necessidades.

Intercedei por nossa proteção espiritual, por nossa conversão e por nossa perseverança na fé até o fim.

Conduzi-nos no caminho da salvação e da vida eterna.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  //NOVENA A NOSSA SENHORA DO CARMO

  const carmo = upsertNovena({
    slug: makeSlug("NOVENA A NOSSA SENHORA DO CARMO"),
    titulo: "NOVENA A NOSSA SENHORA DO CARMO",
    periodo_inicio: "07/07",
    periodo_fim: "15/07",
    subtitulo: "Virgem Santíssima, Mãe e Esplendor do Carmelo",
    como_rezar: COMO_REZAR_PADRAO,
    sinal_da_cruz: SINAL_DA_CRUZ_PADRAO,
    oracao_inicial: `Ó Maria Santíssima, Nossa Senhora do Carmo, Mãe e Rainha do Monte Carmelo, estrela luminosa que guia os filhos de Deus pelo caminho da oração, do silêncio e da fidelidade, a vós recorremos com confiança filial.

Vós que prometestes vossa proteção especial àqueles que, com fé, se consagram a vós e usam o santo Escapulário, acolhei-nos sob vosso manto materno. Concedei-nos a graça de rezar esta novena com coração sincero, espírito humilde e profundo amor a Deus. Por vossa poderosa intercessão, alcançai-nos as graças de que necessitamos para nossa vida espiritual, para nossas famílias e para nossa salvação, conforme a santa vontade do Senhor.
Amém.`,
    oracao_final: `Ó Nossa Senhora do Carmo,
Mãe e Rainha cheia de ternura,
acolhei-nos sob vosso manto protetor.
Guiai-nos no caminho da oração,
da fidelidade e da santidade.
Protegei-nos hoje e sempre
e conduzi-nos à vida eterna.
Amém.`
  });

  upsertDia(
    carmo.id,
    1,
    "PRIMEIRO DIA – NOSSA SENHORA DO CARMO, MÃE QUE NOS CONDUZ A DEUS",
    `Nossa Senhora do Carmo, sois Mãe amorosa que conduz seus filhos ao encontro com Deus.

Ajudai-nos a caminhar sempre na presença do Senhor. Que nossa vida seja orientada pela fé e pelo desejo sincero de agradar a Deus.

Ensinai-nos a confiar plenamente na condução divina.

(Fazer o pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    carmo.id,
    2,
    "SEGUNDO DIA – NOSSA SENHORA DO CARMO, SENHORA DO SILÊNCIO E DA ORAÇÃO",
    `Ó Mãe do Carmelo, sois modelo de silêncio interior e profunda vida de oração.

Ajudai-nos a cultivar o silêncio do coração para escutar a voz de Deus. Que a oração seja sustento e força em nossa vida diária.

Ensinai-nos a rezar com perseverança e confiança.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    carmo.id,
    3,
    "TERCEIRO DIA – NOSSA SENHORA DO CARMO, ESTRELA DA VIDA ESPIRITUAL",
    `Nossa Senhora do Carmo, como estrela brilhante, iluminai nosso caminho rumo à santidade.

Ajudai-nos a crescer na vida espiritual e a não nos desviar do caminho do bem. Que vossa luz nos guie nas decisões da vida.

Conduzi-nos sempre mais perto de Jesus.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    carmo.id,
    4,
    "QUARTO DIA – NOSSA SENHORA DO CARMO, MÃE DO ESCAPULÁRIO",
    `Ó Mãe querida, entregastes o santo Escapulário como sinal de proteção, pertença e compromisso com uma vida cristã fiel.

Ajudai-nos a viver dignamente as promessas ligadas ao Escapulário. Que sejamos fiéis a Deus, à oração e à caridade.

Protegei-nos em todos os perigos do corpo e da alma.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    carmo.id,
    5,
    "QUINTO DIA – NOSSA SENHORA DO CARMO, PROTETORA NAS DIFICULDADES",
    `Nossa Senhora do Carmo, sois auxílio seguro nos momentos de dor, angústia e incerteza.

Socorrei-nos em nossas necessidades e provações. Ajudai-nos a confiar que jamais somos abandonados por vós.

Renovai nossa esperança quando tudo parece difícil.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    carmo.id,
    6,
    "SEXTO DIA – NOSSA SENHORA DO CARMO, MODELO DE OBEDIÊNCIA E HUMILDADE",
    `Ó Virgem Santíssima, aceitastes com humildade e obediência a vontade de Deus em toda a vossa vida.

Ajudai-nos a aceitar os planos do Senhor, mesmo quando exigem renúncia. Que aprendamos convosco a dizer “sim” a Deus todos os dias.

Ensinai-nos a viver com humildade e confiança.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    carmo.id,
    7,
    "SÉTIMO DIA – NOSSA SENHORA DO CARMO, MÃE DA ESPERANÇA",
    `Nossa Senhora do Carmo, sois sinal de esperança segura para os que confiam em Deus.

Ajudai-nos a não desanimar diante das dificuldades da vida. Que nossa esperança esteja sempre firmada no Senhor.

Consolai os aflitos e fortalecei os desanimados.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    carmo.id,
    8,
    "OITAVO DIA – NOSSA SENHORA DO CARMO, INTERCESSORA PODEROSA",
    `Ó Mãe do Carmelo, vossa intercessão junto a Deus é fonte de muitas graças para os vossos filhos.

Apresentai ao Senhor nossas súplicas e necessidades. Alcançai-nos as graças que mais precisamos para nossa vida espiritual.

Que aprendamos a confiar plenamente em vossa intercessão.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    carmo.id,
    9,
    "NONO DIA – NOSSA SENHORA DO CARMO, NOSSA MÃE E PROTETORA ETERNA",
    `Nossa Senhora do Carmo, acolhei esta novena que rezamos com fé e amor. Apresentai a Deus nossos pedidos e agradecimentos.

Sede sempre nossa Mãe, nossa proteção e nossa guia no caminho da fé. Conduzi-nos com segurança até Jesus e à vida eterna.

Obrigado, Mãe querida, por vosso amor constante.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  // NOVENA A SANT'ANA E SÃO JOAQUIM

  const stnjqm = upsertNovena({
    slug: makeSlug("NOVENA A SANT'ANA E SÃO JOAQUIM"),
    titulo: "NOVENA A SANT'ANA E SÃO JOAQUIM",
    periodo_inicio: "17/07",
    periodo_fim: "25/07",
    subtitulo: "Na fidelidade do lar, Deus preparou a Mãe do Salvador",
    como_rezar: COMO_REZAR_PADRAO,
    sinal_da_cruz: SINAL_DA_CRUZ_PADRAO,
    oracao_inicial: `Ó Deus de infinita bondade, que escolhestes Santa Ana e São Joaquim para serem os pais da Virgem Maria e cooperadores humildes do vosso plano de salvação, nós Vos louvamos e bendizemos por este exemplo luminoso de fé, perseverança e amor familiar.

Por intercessão de Santa Ana e São Joaquim, concedei-nos a graça de rezar esta novena com fé sincera, coração confiante e espírito agradecido. Que, à luz de sua vida santa, aprendamos a confiar em Vossa providência, a viver a fé no seio da família e a educar as novas gerações no amor a Deus. Concedei-nos também as graças que necessitamos para nossa vida e salvação, conforme a Vossa santa vontade.
Amém.
`,
    oracao_final: `Ó Deus de amor e misericórdia,
que nos destes em Santa Ana e São Joaquim
exemplos de fé, família e esperança,
concedei-nos, por sua intercessão,
lares santos, fé perseverante
e confiança total em Vossa providência.
Por Cristo, nosso Senhor.
Amém.`
  });

  upsertDia(
    stnjqm.id,
    1,
    "PRIMEIRO DIA – SANTA ANA E SÃO JOAQUIM, JUSTOS DIANTE DE DEUS",
    `Santa Ana e São Joaquim, fostes reconhecidos como justos e fiéis diante de Deus, mesmo em meio às provações e à espera silenciosa.

Ajudai-nos a viver com retidão e fidelidade ao Senhor. Que nossa vida seja agradável a Deus em pensamentos, palavras e ações.

Ensinai-nos a perseverar na fé, mesmo quando as respostas tardam.

(Fazer o pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    stnjqm.id,
    2,
    "SEGUNDO DIA – SANTA ANA E SÃO JOAQUIM, EXEMPLO DE FÉ CONFIANTE",
    `Santa Ana e São Joaquim, confiastes plenamente em Deus, mesmo quando tudo parecia impossível aos olhos humanos.

Ajudai-nos a confiar na providência divina. Que não percamos a esperança diante das dificuldades e das demoras da vida.

Ensinai-nos a esperar com paciência e fé.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    stnjqm.id,
    3,
    "TERCEIRO DIA – SANTA ANA E SÃO JOAQUIM, MODELOS DE VIDA FAMILIAR",
    `Santa Ana e São Joaquim, vivestes o matrimônio como vocação sagrada, fundamentada no amor, na fidelidade e na oração.

Intercedei por nossas famílias. Que nossos lares sejam lugares de fé, diálogo, perdão e amor cristão.

Ajudai-nos a construir famílias segundo o coração de Deus.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    stnjqm.id,
    4,
    "QUARTO DIA – SANTA ANA E SÃO JOAQUIM, EDUCADORES NA FÉ",
    `Santa Ana e São Joaquim, fostes escolhidos para educar Maria, a futura Mãe do Salvador, ensinando-lhe o amor a Deus e à Sua Lei.

Ajudai pais e educadores a transmitirem a fé com amor e exemplo. Que as novas gerações cresçam no temor do Senhor.

Ensinai-nos a educar com sabedoria, paciência e fé.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    stnjqm.id,
    5,
    "QUINTO DIA – SANTA ANA E SÃO JOAQUIM, MODELOS DE HUMILDADE",
    `Santa Ana e São Joaquim, mesmo escolhidos para tão grande missão, vivestes na simplicidade e no silêncio.

Ajudai-nos a viver com humildade e espírito simples. Que saibamos reconhecer que toda graça vem de Deus.

Livrai-nos do orgulho e da autossuficiência.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    stnjqm.id,
    6,
    "SEXTO DIA – SANTA ANA E SÃO JOAQUIM, AVÓS DE JESUS",
    `Santa Ana e São Joaquim, sois honrados como avós de Jesus e protetores dos avós de todo o mundo.

Intercedei pelos avós, para que sejam fontes de amor, sabedoria e fé para suas famílias. Ajudai-os a transmitir valores cristãos com ternura.

Abençoai especialmente os idosos e os solitários.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    stnjqm.id,
    7,
    "SÉTIMO DIA – SANTA ANA E SÃO JOAQUIM, CONSOLADORES DOS AFLITOS",
    `Santa Ana e São Joaquim, conhecestes a dor da espera, a humilhação e a prova, mas nunca perdestes a confiança em Deus.

Consolai os aflitos, os desanimados e os que sofrem. Ajudai-nos a confiar que Deus age no tempo certo.

Renovai nossa esperança e nossa fé.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    stnjqm.id,
    8,
    "OITAVO DIA – SANTA ANA E SÃO JOAQUIM, INTERCESSORES PODEROSOS",
    `Santa Ana e São Joaquim, o povo cristão recorre a vós com confiança, reconhecendo vossa poderosa intercessão junto a Deus.

Apresentai ao Senhor nossos pedidos e necessidades. Alcançai-nos as graças que mais necessitamos para nossa vida espiritual e familiar.

Que nunca deixemos de confiar em vossa intercessão.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    stnjqm.id,
    9,
    "NONO DIA – SANTA ANA E SÃO JOAQUIM, MODELOS DE ESPERANÇA E FIDELIDADE",
    `Santa Ana e São Joaquim, após uma vida de fé e entrega, fostes recompensados com a alegria de cooperar no plano da salvação.

Acolhei esta novena que rezamos com amor e confiança. Intercedei por nossas famílias, por nossa perseverança na fé e por nossa caminhada rumo à vida eterna.

Conduzi-nos sempre mais perto de Jesus, por Maria.


(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

// NOVENA A SÃO JOÃO MARIA VIANNEY

  const vianney = upsertNovena({
    slug: makeSlug("NOVENA A SÃO JOÃO MARIA VIANNEY"),
    titulo: "NOVENA A SÃO JOÃO MARIA VIANNEY",
    periodo_inicio: "27/07",
    periodo_fim: "04/08",
    subtitulo: "Misericórdia que converte",
    como_rezar: COMO_REZAR_PADRAO,
    sinal_da_cruz: SINAL_DA_CRUZ_PADRAO,
    oracao_inicial: `Ó Deus de infinita misericórdia, que concedestes à Igreja em São João Maria Vianney um pastor segundo o Vosso Coração, simples, humilde e totalmente entregue ao cuidado das almas, nós Vos louvamos e bendizemos por este testemunho tão luminoso de santidade sacerdotal.

Por intercessão de São João Maria Vianney, concedei-nos a graça de rezar esta novena com coração contrito, espírito humilde e profundo desejo de conversão. Que, ao contemplarmos sua vida e seu amor pelas almas, sejamos tocados pela misericórdia divina e conduzidos a uma vida mais fiel ao Evangelho. Concedei-nos também as graças que necessitamos para nossa vida e salvação, conforme a Vossa santa vontade.
Amém.`,
    oracao_final: `Ó Deus de infinita misericórdia,
que nos destes em São João Maria Vianney
um pastor humilde e santo,
concedei-nos, por sua intercessão,
um coração arrependido,
amor à Eucaristia
e desejo sincero de conversão.
Por Cristo, nosso Senhor.
Amém.`
  });

  upsertDia(
    vianney.id,
    1,
    "PRIMEIRO DIA – SÃO JOÃO MARIA VIANNEY, HOMEM CHAMADO POR DEUS",
    `São João Maria Vianney, apesar de vossas limitações humanas, aceitastes o chamado de Deus com confiança e abandono total.

Ajudai-nos a confiar que Deus chama e capacita aqueles que escolhe. Que não nos deixemos paralisar pelo medo ou pela sensação de indignidade.

Ensinai-nos a dizer “sim” a Deus com simplicidade de coração.

(Fazer o pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    vianney.id,
    2,
    "SEGUNDO DIA – SÃO JOÃO MARIA VIANNEY, AMANTE DA ORAÇÃO",
    `São João Maria Vianney, encontráveis na oração silenciosa a força para enfrentar as dificuldades do ministério e da vida.

Ajudai-nos a redescobrir o valor da oração. Que saibamos permanecer na presença de Deus, mesmo quando não encontramos palavras.

Ensinai-nos a rezar com o coração e com perseverança.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    vianney.id,
    3,
    "TERCEIRO DIA – SÃO JOÃO MARIA VIANNEY, AMIGO DA EUCARISTIA",
    `São João Maria Vianney, vosso coração ardia de amor por Jesus presente na Eucaristia.

Ajudai-nos a amar o Santíssimo Sacramento. Que a Eucaristia seja o centro de nossa vida cristã e fonte de conversão.

Ensinai-nos a reconhecer em Jesus o maior tesouro de nossa vida.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    vianney.id,
    4,
    "QUARTO DIA – SÃO JOÃO MARIA VIANNEY, CONFESSOR DAS ALMAS",
    `São João Maria Vianney, passastes longas horas no confessionário, acolhendo, escutando e reconciliando as almas com Deus.

Ajudai-nos a buscar o sacramento da Reconciliação com sinceridade e confiança. Que não tenhamos medo da misericórdia divina.

Ensinai-nos o valor do arrependimento e da conversão sincera.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    vianney.id,
    5,
    "QUINTO DIA – SÃO JOÃO MARIA VIANNEY, PASTOR CHEIO DE ZELO",
    `São João Maria Vianney, vosso coração sacerdotal ardia de amor pelas almas confiadas a vós.

Ajudai-nos a compreender o valor de cada alma diante de Deus. Que sejamos responsáveis por nossa vida espiritual e atentos à salvação dos outros.

Intercedei por nossos sacerdotes, para que sejam pastores segundo o coração de Cristo.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    vianney.id,
    6,
    "SEXTO DIA – SÃO JOÃO MARIA VIANNEY, MODELO DE HUMILDADE",
    `São João Maria Vianney, mesmo reconhecido por muitos, permanecestes profundamente humilde e dependente de Deus.

Livrai-nos do orgulho e da vaidade espiritual. Ensinai-nos a reconhecer nossas fraquezas e a confiar na graça divina.

Que aprendamos a servir sem buscar reconhecimento.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    vianney.id,
    7,
    "SÉTIMO DIA – SÃO JOÃO MARIA VIANNEY, SOFRIMENTO OFERECIDO A DEUS",
    `São João Maria Vianney, aceitastes os sofrimentos físicos e espirituais como oferta de amor pela conversão das almas.

Ajudai-nos a oferecer nossas dores e dificuldades a Deus. Que saibamos unir nossos sofrimentos aos de Cristo.

Ensinai-nos a encontrar sentido redentor na cruz.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    vianney.id,
    8,
    "OITAVO DIA – SÃO JOÃO MARIA VIANNEY, AMOR À IGREJA",
    `São João Maria Vianney, vivestes em total obediência e amor à Igreja, servindo com fidelidade até o fim.

Ajudai-nos a amar a Igreja e a permanecer fiéis ao Evangelho. Que saibamos viver em comunhão, mesmo nas dificuldades.

Intercedei pela santidade do clero e do povo de Deus.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    vianney.id,
    9,
    "NONO DIA – SÃO JOÃO MARIA VIANNEY, NOSSO INTERCESSOR JUNTO A DEUS",
    `São João Maria Vianney, acolhei esta novena que rezamos com fé e confiança. Apresentai a Deus nossos pedidos e necessidades.

Intercedei por nossa conversão, por nossa vida espiritual e por nossa perseverança no caminho da santidade. Conduzi-nos ao Coração misericordioso de Jesus.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  // NOVENA A SANTA FILOMENA

  const filomena = upsertNovena({
    slug: makeSlug("NOVENA A SANTA FILOMENA"),
    titulo: "NOVENA A SANTA FILOMENA",
    periodo_inicio: "02/08",
    periodo_fim: "10/08",
    subtitulo: "Virgem e mártir, fiel a Cristo até o fim",
    como_rezar: COMO_REZAR_PADRAO,
    sinal_da_cruz: SINAL_DA_CRUZ_PADRAO,
    oracao_inicial: `Ó Deus eterno e todo-poderoso, que Vos dignastes glorificar Santa Filomena, jovem mártir de fé pura e coração totalmente consagrado a Vós, nós Vos louvamos e bendizemos por este testemunho tão simples e ao mesmo tempo tão poderoso de amor fiel até o fim.

Por intercessão de Santa Filomena, concedei-nos a graça de rezar esta novena com confiança de filhos, coração humilde e fé perseverante. Que, tocados por seu exemplo de pureza, coragem e entrega total, aprendamos a amar-Vos acima de todas as coisas e a confiar plenamente em Vossa providência. Concedei-nos também as graças que necessitamos para nossa vida e salvação, conforme a Vossa santa vontade.
Amém.`,
    oracao_final: `Ó Deus todo-poderoso,
que glorificastes Santa Filomena
com a palma do martírio
e a tornastes sinal de esperança para os fiéis,
concedei-nos, por sua intercessão,
pureza de coração,
coragem na fé
e confiança total em Vossa providência.
Por Cristo, nosso Senhor.
Amém.
`
  });

  upsertDia(
    filomena.id,
    1,
    "PRIMEIRO DIA – SANTA FILOMENA, AMADA E ESCOLHIDA POR DEUS",
    `Santa Filomena, desde vossa juventude fostes escolhida por Deus para uma missão especial, vivendo inteiramente para Ele.

Ajudai-nos a compreender que também somos amados e escolhidos por Deus. Que saibamos reconhecer nossa dignidade e nossa vocação cristã.

Ensinai-nos a viver conscientes do amor que Deus tem por nós.

(Fazer o pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    filomena.id,
    2,
    "SEGUNDO DIA – SANTA FILOMENA, CORAÇÃO CONSAGRADO A DEUS",
    `Santa Filomena, fizestes de vosso coração uma oferta total a Deus, escolhendo amá-Lo acima de tudo.

Ajudai-nos a consagrar nossa vida ao Senhor. Que nada ocupe o lugar que pertence somente a Deus em nosso coração.

Ensinai-nos a amar com fidelidade e pureza de intenção.


(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    filomena.id,
    3,
    "TERCEIRO DIA – SANTA FILOMENA, EXEMPLO DE PUREZA",
    `Santa Filomena, conservastes vosso corpo e vossa alma puros por amor a Cristo.

Ajudai-nos a viver a pureza de coração, de pensamentos e de ações. Que saibamos respeitar nosso corpo e o dos outros como templo do Espírito Santo.

Ensinai-nos a viver com integridade e fidelidade ao Evangelho.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    filomena.id,
    4,
    "QUARTO DIA – SANTA FILOMENA, CORAGEM NA PROVAÇÃO",
    `Santa Filomena, enfrentastes perseguições, dores e ameaças sem jamais renegar vossa fé.

Ajudai-nos a permanecer firmes na fé quando somos provados. Que não cedamos ao medo, mas confiemos na força que vem de Deus.

Ensinai-nos a viver a fé com coragem e constância.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    filomena.id,
    5,
    "QUINTO DIA – SANTA FILOMENA, FIDELIDADE ATÉ O MARTÍRIO",
    `Santa Filomena, preferistes entregar vossa própria vida a trair o amor de Cristo.

Ajudai-nos a ser fiéis a Deus em todas as circunstâncias, mesmo quando isso exige sacrifício.

Ensinai-nos que o verdadeiro amor é aquele que se doa sem reservas.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    filomena.id,
    6,
    "SEXTO DIA – SANTA FILOMENA, PODEROSA INTERCESSORA",
    `Santa Filomena, escolhida por Deus para ser instrumento de muitas graças, sois conhecida como poderosa intercessora junto ao Céu.

Intercedei por nós em nossas necessidades espirituais e materiais. Alcançai-nos as graças que mais precisamos.

Aumentai nossa confiança na ação de Deus.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    filomena.id,
    7,
    "SÉTIMO DIA – SANTA FILOMENA, AMIGA DOS AFLITOS",
    `Santa Filomena, muitos recorrem a vós nos momentos de dor, aflição e desespero, e encontram consolo e esperança.

Olhai por aqueles que sofrem no corpo e na alma. Consolai os desanimados e fortalecei os que carregam cruzes pesadas.

Ensinai-nos a confiar quando tudo parece difícil.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    filomena.id,
    8,
    "OITAVO DIA – SANTA FILOMENA, MODELO DE CONFIANÇA EM DEUS",
    `Santa Filomena, mesmo jovem, confiastes plenamente em Deus, entregando-Lhe toda a vossa vida.

Ajudai-nos a confiar em Deus com simplicidade e abandono. Que aprendamos a descansar em Sua vontade.

Ensinai-nos a viver com fé confiante e perseverante.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    filomena.id,
    9,
    "NONO DIA – SANTA FILOMENA, NOSSA INTERCESSORA E AMIGA NO CÉU",
    `Santa Filomena, acolhei esta novena que rezamos com fé e amor. Apresentai a Deus nossos pedidos, intenções e agradecimentos.

Caminhai conosco, fortalecei nossa fé e ajudai-nos a perseverar no caminho da santidade até a vida eterna.

Obrigado, Santa Filomena, por vosso carinho e intercessão constante.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  // NOVENA A SANTA CLARA

const clara = upsertNovena({
    slug: makeSlug("NOVENA A SANTA CLARA"),
    titulo: "NOVENA A SANTA CLARA",
    periodo_inicio: "02/08",
    periodo_fim: "02/08",
    subtitulo: "“Nunca perca de vista o seu ponto de partida”",
    como_rezar: COMO_REZAR_PADRAO,
    sinal_da_cruz: SINAL_DA_CRUZ_PADRAO,
    oracao_inicial: `Ó Deus de infinita luz e bondade, que chamastes Santa Clara a seguir Vosso Filho com coração indiviso, vivendo na pobreza, na oração e na confiança absoluta em Vossa providência, nós Vos louvamos e bendizemos por este testemunho tão puro e luminoso de amor total a Vós.

Por intercessão de Santa Clara, concedei-nos a graça de rezar esta novena com coração simples, espírito desprendido e desejo sincero de união convosco. Que, iluminados por sua vida e exemplo, aprendamos a confiar plenamente em Vós, a viver com humildade e a buscar as coisas do alto. Concedei-nos também as graças que necessitamos para nossa vida e salvação, conforme a Vossa santa vontade.
Amém.`,
    oracao_final: `Ó Deus de eterna luz,
que fizestes de Santa Clara
um reflexo puro do Vosso amor,
concedei-nos, por sua intercessão,
um coração simples,
fé confiante
e amor indiviso por Vós.
Por Cristo, nosso Senhor.
Amém.
`
  });

  upsertDia(
    clara.id,
    1,
    "PRIMEIRO DIA – SANTA CLARA, CHAMADA PELA LUZ DE CRISTO",
    `Santa Clara, vosso coração foi tocado pela luz de Cristo e nada mais vos satisfez senão segui-Lo de perto.

Ajudai-nos a reconhecer o chamado de Deus em nossa vida. Que não nos deixemos seduzir pelas luzes passageiras deste mundo.

Ensinai-nos a buscar a verdadeira Luz que vem de Deus.

(Fazer o pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    clara.id,
    2,
    "SEGUNDO DIA – SANTA CLARA, CORAÇÃO TOTALMENTE ENTREGUE A DEUS",
    `Santa Clara, deixastes tudo para pertencer inteiramente a Deus, sem reservas nem condições.

Ajudai-nos a entregar nosso coração ao Senhor. Que aprendamos a confiar e a abandonar-nos em Suas mãos.

Ensinai-nos a amar a Deus acima de todas as coisas.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    clara.id,
    3,
    "TERCEIRO DIA – SANTA CLARA, AMANTE DA POBREZA EVANGÉLICA",
    `Santa Clara, escolhestes a pobreza não como privação, mas como liberdade para amar mais a Deus.

Ajudai-nos a desapegar o coração do que é supérfluo. Que aprendamos a viver com simplicidade e gratidão.

Ensinai-nos que a verdadeira riqueza está em Deus.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    clara.id,
    4,
    "QUARTO DIA – SANTA CLARA, MULHER DA ORAÇÃO SILENCIOSA",
    `Santa Clara, vossa vida foi profundamente marcada pela oração constante e silenciosa diante do Senhor.

Ajudai-nos a encontrar tempo para a oração. Que aprendamos a permanecer na presença de Deus com confiança e amor.

Ensinai-nos a escutar Deus no silêncio do coração.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    clara.id,
    5,
    "QUINTO DIA – SANTA CLARA, CONFIANÇA ABSOLUTA NA PROVIDÊNCIA",
    `Santa Clara, mesmo nas dificuldades e privações, jamais duvidastes do cuidado amoroso de Deus.

Ajudai-nos a confiar na providência divina. Que não nos deixemos dominar pelo medo do amanhã.

Ensinai-nos a descansar em Deus com fé e serenidade.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    clara.id,
    6,
    "SEXTO DIA – SANTA CLARA, FORÇA NA FRAQUEZA",
    `Santa Clara, mesmo na doença e na fragilidade física, permanecestes forte no espírito e unida a Deus.

Ajudai-nos a aceitar nossas limitações com fé. Que saibamos oferecer nossas fraquezas como oração.

Ensinai-nos que a força verdadeira vem de Deus.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    clara.id,
    7,
    "SÉTIMO DIA – SANTA CLARA, DEFENSORA CONFIANTE NO PODER DE DEUS",
    `Santa Clara, confiaste plenamente no Senhor diante dos perigos, colocando tudo sob Sua proteção.

Ajudai-nos a recorrer a Deus nos momentos de ameaça e medo. Que aprendamos a confiar mais na oração do que em nossas próprias forças.

Ensinai-nos a vencer o mal com a fé.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    clara.id,
    8,
    "OITAVO DIA – SANTA CLARA, MODELO DE VIDA CONSAGRADA",
    `Santa Clara, vivestes com fidelidade total a vocação que Deus vos confiou.

Ajudai-nos a viver com fidelidade nossa própria vocação. Que sejamos coerentes com os compromissos assumidos com Deus.

Ensinai-nos a perseverar no amor até o fim.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    clara.id,
    9,
    "NONO DIA – SANTA CLARA, LUZ QUE NOS CONDUZ A DEUS",
    `Santa Clara, após uma vida de entrega total, sois agora luz no Céu para aqueles que recorrem a vós.

Acolhei esta novena que rezamos com fé e carinho. Apresentai a Deus nossos pedidos, necessidades e agradecimentos.

Conduzi-nos no caminho da santidade, da confiança e da paz interior.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  //NOVENA DE NOSSA SENHORA DA ASSUNÇÃO

  const assuncao = upsertNovena({
    slug: makeSlug("NOVENA DE NOSSA SENHORA DA ASSUNÇÃO"),
    titulo: "NOVENA DE NOSSA SENHORA DA ASSUNÇÃO",
    periodo_inicio: "02/08",
    periodo_fim: "10/08",
    subtitulo: "O céu abre suas portas à Mãe do Redentor",
    como_rezar: COMO_REZAR_PADRAO,
    sinal_da_cruz: SINAL_DA_CRUZ_PADRAO,
    oracao_inicial: `Ó Maria Santíssima, Nossa Senhora da Assunção, Mãe de Deus e nossa Mãe, que fostes elevada em corpo e alma à glória do Céu, como primícia da ressurreição prometida a todos os que permanecem fiéis ao Senhor, nós vos louvamos e bendizemos por tão grande dom concedido por Deus à humanidade.

Acolhei-nos sob vosso olhar materno e concedei-nos a graça de rezar esta novena com coração confiante, espírito humilde e esperança viva. Que, contemplando vossa glorificação, aprendamos a viver com os olhos voltados para o Céu, sem deixar de cumprir com amor nossa missão na terra. Intercedei por nós e alcançai-nos as graças que necessitamos para nossa vida e salvação, conforme a santa vontade de Deus.
Amém.`,
    oracao_final: `Ó Maria Santíssima, Nossa Senhora da Assunção,
elevada em corpo e alma à glória do Céu,
sede para nós sinal de esperança segura.
Ajudai-nos a viver com fé,
a perseverar no amor
e a caminhar rumo à vida eterna.
Rogai por nós, agora e sempre.
Amém.`
  });

  upsertDia(
    assuncao.id,
    1,
    "PRIMEIRO DIA – NOSSA SENHORA DA ASSUNÇÃO, MÃE GLORIFICADA NO CÉU",
    `Nossa Senhora da Assunção, Deus vos exaltou e vos acolheu na glória do Céu como Mãe do Seu Filho e sinal de esperança para toda a Igreja.

Ajudai-nos a elevar o coração às coisas do alto. Que nossa vida não se limite ao que é passageiro, mas busque o que é eterno.

Ensinai-nos a viver com esperança firme na promessa da vida eterna.

(Fazer o pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    assuncao.id,
    2,
    "SEGUNDO DIA – NOSSA SENHORA DA ASSUNÇÃO, VITÓRIA DA GRAÇA",
    `Ó Mãe gloriosa, em vós a graça venceu plenamente o pecado e a morte.

Ajudai-nos a confiar no poder da graça de Deus em nossa vida. Que não nos deixemos vencer pelo desânimo nem pelo pecado.

Ensinai-nos a caminhar com confiança na misericórdia divina.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    assuncao.id,
    3,
    "TERCEIRO DIA – NOSSA SENHORA DA ASSUNÇÃO, ESPERANÇA DO POVO DE DEUS",
    `Nossa Senhora da Assunção, sois sinal claro do destino final que Deus prepara para aqueles que O amam.

Ajudai-nos a não perder a esperança, mesmo nas dificuldades da vida. Que aprendamos a olhar além das dores presentes.

Ensinai-nos a esperar com fé e perseverança.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    assuncao.id,
    4,
    "QUARTO DIA – NOSSA SENHORA DA ASSUNÇÃO, MODELO DE FIDELIDADE",
    `Ó Virgem fiel, vossa vida inteira foi um “sim” generoso à vontade de Deus, vivido com amor até o fim.

Ajudai-nos a ser fiéis a Deus em todas as circunstâncias. Que saibamos cumprir Sua vontade com confiança e humildade.

Ensinai-nos a permanecer firmes no caminho do bem.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    assuncao.id,
    5,
    "QUINTO DIA – NOSSA SENHORA DA ASSUNÇÃO, MÃE QUE INTERCEDE POR NÓS",
    `Nossa Senhora da Assunção, glorificada no Céu, continuais a interceder por vossos filhos na terra.

Olhai por nossas necessidades espirituais e materiais. Apresentai ao vosso Filho Jesus nossas súplicas e intenções.

Ajudai-nos a confiar sempre em vossa poderosa intercessão.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    assuncao.id,
    6,
    "SEXTO DIA – NOSSA SENHORA DA ASSUNÇÃO, CONSOLADORA DOS AFLITOS",
    `Ó Mãe gloriosa, que conheceis as dores humanas, consolai os que sofrem no corpo e na alma.

Alcançai conforto para os aflitos, esperança para os desanimados e paz para os corações angustiados.

Ensinai-nos a confiar que o sofrimento não é o fim, mas caminho para a glória.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    assuncao.id,
    7,
    "SÉTIMO DIA – NOSSA SENHORA DA ASSUNÇÃO, MÃE DA IGREJA PEREGRINA",
    `Nossa Senhora da Assunção, sois Mãe da Igreja que ainda caminha neste mundo rumo à plenitude do Reino.

Intercedei pelo Papa, pelos bispos, sacerdotes e por todo o povo de Deus. Que a Igreja permaneça fiel à sua missão.

Ajudai-nos a caminhar unidos na fé, na esperança e na caridade.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    assuncao.id,
    8,
    "OITAVO DIA – NOSSA SENHORA DA ASSUNÇÃO, CHAMADO À SANTIDADE",
    `Ó Mãe glorificada, vossa Assunção nos recorda que somos chamados à santidade e à vida eterna.

Ajudai-nos a viver com coerência cristã. Que nossas escolhas diárias nos conduzam mais perto de Deus.

Ensinai-nos a buscar a santidade com humildade e perseverança.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    assuncao.id,
    9,
    "NONO DIA – NOSSA SENHORA DA ASSUNÇÃO, NOSSA MÃE E NOSSA ESPERANÇA",
    `Nossa Senhora da Assunção, acolhei esta novena que rezamos com amor e confiança. Apresentai a Deus nossos pedidos, dores e agradecimentos.

Sede nossa Mãe, nossa guia e nossa esperança. Conduzi-nos com segurança até a glória eterna, onde esperamos um dia estar convosco junto de Jesus.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  //NOVENA A SÃO ROQUE

  const roque = upsertNovena({
    slug: makeSlug("NOVENA A SÃO ROQUE"),
    titulo: "NOVENA A SÃO ROQUE",
    periodo_inicio: "07/08",
    periodo_fim: "15/08",
    subtitulo: "Na dor alheia, reconheceu o rosto de Cristo",
    como_rezar: COMO_REZAR_PADRAO,
    sinal_da_cruz: SINAL_DA_CRUZ_PADRAO,
    oracao_inicial: `Ó Deus de infinita misericórdia, que concedestes a São Roque a graça de confiar plenamente em Vós em meio às dores, enfermidades e abandono, fazendo dele sinal vivo de esperança para os doentes e aflitos, nós Vos louvamos e bendizemos por tão grande testemunho de fé e caridade.

Por intercessão de São Roque, concedei-nos a graça de rezar esta novena com coração confiante, espírito humilde e abandono total em Vossa providência. Que, ao contemplarmos sua vida de entrega e confiança, sejamos fortalecidos na fé, consolados nas dores e conduzidos a uma esperança que não decepciona. Concedei-nos também as graças que necessitamos para nossa vida e salvação, conforme a Vossa santa vontade.
Amém.`,
    oracao_final: `Ó Deus de misericórdia,
que nos destes em São Roque
um exemplo de confiança, caridade e esperança,
concedei-nos, por sua intercessão,
força na enfermidade,
paz na tribulação
e fé perseverante até o fim.
Por Cristo, nosso Senhor.
Amém.`
  });

  upsertDia(
    roque.id,
    1,
    "PRIMEIRO DIA – SÃO ROQUE, HOMEM DE FÉ DESDE A JUVENTUDE",
    `São Roque, desde cedo vosso coração foi entregue a Deus, e escolhestes seguir o caminho da fé, da simplicidade e da confiança.

Ajudai-nos a entregar nossa vida a Deus desde agora. Que não adiemos nossa conversão nem nossa entrega ao Senhor.

Ensinai-nos a viver com fé sincera e coração disponível.

(Fazer o pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    roque.id,
    2,
    "SEGUNDO DIA – SÃO ROQUE, PEREGRINO CONFIANTE EM DEUS",
    `São Roque, deixastes tudo para seguir como peregrino, confiando apenas na providência divina.

Ajudai-nos a confiar mais em Deus do que em nossas seguranças humanas. Que aprendamos a caminhar com fé, mesmo sem ver claramente o caminho.

Ensinai-nos o abandono confiante nas mãos de Deus.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    roque.id,
    3,
    "TERCEIRO DIA – SÃO ROQUE, AMIGO DOS DOENTES",
    `São Roque, dedicastes vossa vida a cuidar dos doentes, especialmente dos atingidos por doenças graves e contagiosas.

Intercedei por todos os enfermos do corpo e da alma. Consolai os que sofrem e fortalecei os que enfrentam a dor.

Ajudai-nos a reconhecer Cristo presente nos doentes.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    roque.id,
    4,
    "QUARTO DIA – SÃO ROQUE, TESTEMUNHO DE CARIDADE SEM MEDO",
    `São Roque, não tivestes medo de aproximar-vos dos que sofriam, mesmo colocando em risco a própria vida.

Ajudai-nos a viver a caridade com coragem e generosidade. Que não sejamos indiferentes à dor do próximo.

Ensinai-nos a amar como Cristo ama.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    roque.id,
    5,
    "QUINTO DIA – SÃO ROQUE, SOFRIMENTO ACEITO COM FÉ",
    `São Roque, quando fostes atingido pela doença, aceitastes o sofrimento com paciência e total confiança em Deus.

Ajudai-nos a oferecer nossas dores ao Senhor. Que saibamos viver o sofrimento sem revolta, mas com fé e esperança.

Ensinai-nos a confiar mesmo na prova.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    roque.id,
    6,
    "SEXTO DIA – SÃO ROQUE, CONFIANÇA NA PROVIDÊNCIA DIVINA",
    `São Roque, abandonado e isolado, confiastes inteiramente no cuidado de Deus, que jamais vos faltou.

Ajudai-nos a confiar que Deus nunca nos abandona, mesmo quando nos sentimos sozinhos.

Ensinai-nos a reconhecer os sinais silenciosos do cuidado divino.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    roque.id,
    7,
    "SÉTIMO DIA – SÃO ROQUE, HUMILDADE NO ANONIMATO",
    `São Roque, aceitastes o esquecimento e a humilhação sem murmurar, oferecendo tudo a Deus.

Ajudai-nos a viver a humildade verdadeira. Que não busquemos reconhecimento, mas apenas agradar a Deus.

Ensinai-nos a servir em silêncio e amor.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    roque.id,
    8,
    "OITAVO DIA – SÃO ROQUE, ESPERANÇA NA PROVA FINAL",
    `São Roque, permanecestes fiel até o fim, mesmo sem reconhecimento humano.

Ajudai-nos a perseverar na fé até o fim da vida. Que não desanimemos nas dificuldades, mas confiemos na promessa eterna.

Fortalecei nossa esperança na vida eterna.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    roque.id,
    9,
    "NONO DIA – SÃO ROQUE, NOSSO INTERCESSOR E PROTETOR",
    `São Roque, acolhei esta novena que rezamos com fé e confiança. Apresentai a Deus nossos pedidos, especialmente aqueles ligados à saúde, às dores e às aflições.

Intercedei por nós junto ao Senhor. Protegei-nos nas doenças do corpo e da alma e conduzi-nos no caminho da salvação e da paz.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  //NOVENA A SANTA MÔNICA

  const monica = upsertNovena({
    slug: makeSlug("NOVENA A SANTA MÔNICA"),
    titulo: "NOVENA A SANTA MÔNICA",
    periodo_inicio: "18/08",
    periodo_fim: "26/08",
    subtitulo: "Mãe perseverante, mulher de fé inabalável, intercessora das famílias e dos filhos afastados",
    como_rezar: COMO_REZAR_PADRAO,
    sinal_da_cruz: SINAL_DA_CRUZ_PADRAO,
    oracao_inicial: `Ó Deus de infinita misericórdia, que concedestes a Santa Mônica a graça de perseverar na oração, nas lágrimas e na esperança, transformando seu amor materno em instrumento de conversão e salvação, nós Vos louvamos e bendizemos por tão belo testemunho de fé confiante.

Por intercessão de Santa Mônica, concedei-nos a graça de rezar esta novena com coração perseverante, fé inabalável e esperança viva. Que, ao contemplarmos sua vida marcada pela oração constante e pela confiança absoluta em Vós, aprendamos a nunca desistir daqueles que amamos e a confiar que Vossa graça age mesmo quando tudo parece perdido. Concedei-nos também as graças que necessitamos para nossa vida e salvação, conforme a Vossa santa vontade.
Amém.`,
    oracao_final: `Ó Deus de misericórdia infinita,
que nos destes em Santa Mônica
um exemplo luminoso de perseverança na oração,
concedei-nos, por sua intercessão,
fé que não desanima,
esperança que não se apaga
e amor que tudo confia.
Por Cristo, nosso Senhor.
Amém.
`
  });

  upsertDia(
    monica.id,
    1,
    "PRIMEIRO DIA – SANTA MÔNICA, MULHER DE FÉ FIRME",
    `Santa Mônica, desde cedo colocastes vossa vida nas mãos de Deus, mesmo em meio às dificuldades familiares e às dores do coração.

Ajudai-nos a construir nossa vida sobre a fé. Que não nos afastemos de Deus diante das provações.

Ensinai-nos a confiar no Senhor em todos os momentos.

(Fazer o pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    monica.id,
    2,
    "SEGUNDO DIA – SANTA MÔNICA, ESPOSA PACIENTE",
    `Santa Mônica, vivestes um matrimônio marcado por dificuldades, mas respondestes com paciência, oração e mansidão.

Intercedei pelos casamentos que enfrentam crises, incompreensões e sofrimento. Ajudai-nos a viver o amor com paciência e fé.

Ensinai-nos a transformar a dor em oração.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    monica.id,
    3,
    "TERCEIRO DIA – SANTA MÔNICA, MÃE QUE REZA SEM DESISTIR",
    `Santa Mônica, por longos anos apresentastes vosso filho a Deus com lágrimas, súplicas e confiança perseverante.

Ajudai-nos a rezar sem desanimar por aqueles que amamos. Que não percamos a esperança, mesmo quando a resposta parece distante.

Ensinai-nos a confiar no tempo de Deus.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    monica.id,
    4,
    "QUARTO DIA – SANTA MÔNICA, LÁGRIMAS QUE GERAM VIDA NOVA",
    `Santa Mônica, vossas lágrimas não foram em vão; tornaram-se sementes de conversão e santidade.

Ajudai-nos a oferecer nossas lágrimas a Deus. Que saibamos confiar que nenhuma dor oferecida com fé é desperdiçada.

Ensinai-nos a esperar com esperança viva.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    monica.id,
    5,
    "QUINTO DIA – SANTA MÔNICA, ESPERANÇA CONTRA TODA ESPERANÇA",
    `Santa Mônica, mesmo quando tudo parecia perdido, jamais deixastes de esperar na misericórdia de Deus.

Ajudai-nos a não perder a esperança diante das situações difíceis. Que aprendamos a esperar quando não há sinais visíveis de mudança.

Ensinai-nos a confiar plenamente na graça divina.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    monica.id,
    6,
    "SEXTO DIA – SANTA MÔNICA, CONFIANÇA NA AÇÃO DE DEUS",
    `Santa Mônica, compreendestes que a conversão não é obra humana, mas ação da graça de Deus.

Ajudai-nos a entregar nossas preocupações ao Senhor. Que saibamos confiar mais em Deus do que em nossas tentativas humanas.

Ensinai-nos o abandono confiante na providência divina.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    monica.id,
    7,
    "SÉTIMO DIA – SANTA MÔNICA, ALEGRIA DA CONVERSÃO",
    `Santa Mônica, Deus vos concedeu a alegria de ver a conversão de vosso filho, como fruto de vossa perseverança.

Ajudai-nos a crer que Deus pode transformar qualquer coração. Que nunca duvidemos do poder da misericórdia divina.

Ensinai-nos a agradecer pelas pequenas vitórias da fé.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    monica.id,
    8,
    "OITAVO DIA – SANTA MÔNICA, MODELO DE AMOR QUE ENTREGA",
    `Santa Mônica, vosso amor não foi possessivo, mas entregue a Deus, confiando que Ele sabe cuidar melhor dos que amamos.

Ajudai-nos a entregar nossos filhos, familiares e intenções nas mãos de Deus. Que saibamos amar sem controlar.

Ensinai-nos o amor que confia e entrega.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    monica.id,
    9,
    "NONO DIA – SANTA MÔNICA, NOSSA INTERCESSORA PERSEVERANTE",
    `Santa Mônica, acolhei esta novena que rezamos com fé, lágrimas e confiança. Apresentai a Deus nossos pedidos, especialmente aqueles que carregamos há muito tempo no coração.

Intercedei por nossas famílias, por nossos filhos e por todos os que estão afastados de Deus. Fortalecei nossa perseverança e conduzi-nos à paz do coração.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  //NOVENA A SANTO AGOSTINHO 

  const agostinho = upsertNovena({
    slug: makeSlug("NOVENA A SANTO AGOSTINHO"),
    titulo: "NOVENA A SANTO AGOSTINHO",
    periodo_inicio: "19/08",
    periodo_fim: "27/08",
    subtitulo: "“Fizeste-nos, Senhor, para ti, e o nosso coração anda inquieto enquanto não descansar em ti”",
    como_rezar: COMO_REZAR_PADRAO,
    sinal_da_cruz: SINAL_DA_CRUZ_PADRAO,
    oracao_inicial: `Ó Deus eterno e misericordioso, que conduzistes Santo Agostinho pelos caminhos da inquietação, da busca e da verdade, até que seu coração encontrasse descanso somente em Vós, nós Vos louvamos e bendizemos por este testemunho tão humano e tão divino de conversão e amor.

Por intercessão de Santo Agostinho, concedei-nos a graça de rezar esta novena com coração sincero, mente aberta e desejo verdadeiro de conversão. Que, ao contemplarmos sua vida marcada pela busca da verdade e pelo encontro transformador convosco, aprendamos a não fugir de nossas inquietações, mas a entregá-las a Vós, fonte de toda verdade e amor. Concedei-nos também as graças que necessitamos para nossa vida e salvação, conforme a Vossa santa vontade.
Amém.
`,
    oracao_final: `Ó Deus de misericórdia e verdade,
que conduzistes Santo Agostinho
das inquietações à paz do Vosso amor,
concedei-nos, por sua intercessão,
um coração sincero,
amor à verdade
e descanso somente em Vós.
Por Cristo, nosso Senhor.
Amém.`
  });

  upsertDia(
    agostinho.id,
    1,
    "PRIMEIRO DIA – SANTO AGOSTINHO, CORAÇÃO INQUIETO QUE BUSCA",
    `Santo Agostinho, vosso coração esteve inquieto por muito tempo, buscando sentido, alegria e verdade em muitos lugares.

Ajudai-nos a reconhecer nossas inquietações interiores. Que não fujamos de nossas perguntas mais profundas, mas as levemos a Deus.

Ensinai-nos que nosso coração só encontra descanso no Senhor.

(Fazer o pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    agostinho.id,
    2,
    "SEGUNDO DIA – SANTO AGOSTINHO, BUSCA SINCERA DA VERDADE",
    `Santo Agostinho, buscastes a verdade com intensidade, passando por erros e ilusões até encontrá-la plenamente em Deus.

Ajudai-nos a buscar a verdade com sinceridade. Que não nos acomodemos em meias verdades nem em falsas seguranças.

Ensinai-nos a amar a verdade, mesmo quando ela nos confronta.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    agostinho.id,
    3,
    "TERCEIRO DIA – SANTO AGOSTINHO, MISERICÓRDIA QUE TRANSFORMA",
    `Santo Agostinho, experimentastes profundamente a misericórdia de Deus, que vos acolheu e transformou vossa vida.

Ajudai-nos a confiar na misericórdia divina. Que não tenhamos medo de nossas quedas nem de nossas fragilidades.

Ensinai-nos a crer que Deus pode fazer novas todas as coisas.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    agostinho.id,
    4,
    "QUARTO DIA – SANTO AGOSTINHO, CONVERSÃO DO CORAÇÃO",
    `Santo Agostinho, o encontro com Deus mudou radicalmente vossa vida, vossos desejos e vossos caminhos.

Ajudai-nos a abrir o coração à conversão. Que saibamos dizer “basta” ao pecado e “sim” à graça de Deus.

Ensinai-nos a permitir que Deus transforme nossa vida por inteiro.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    agostinho.id,
    5,
    "QUINTO DIA – SANTO AGOSTINHO, AMOR À PALAVRA DE DEUS",
    `Santo Agostinho, a Palavra de Deus iluminou vossa mente e inflamou vosso coração.

Ajudai-nos a amar as Sagradas Escrituras. Que a Palavra de Deus seja luz para nossas decisões e força para nossa fé.

Ensinai-nos a escutar Deus que nos fala.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    agostinho.id,
    6,
    "SEXTO DIA – SANTO AGOSTINHO, HUMILDADE DIANTE DE DEUS",
    `Santo Agostinho, reconhecestes vossas limitações e aprendestes a depender totalmente da graça de Deus.

Livrai-nos do orgulho espiritual e da autossuficiência. Ensinai-nos a viver na humildade verdadeira.

Que saibamos reconhecer que tudo é dom de Deus.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    agostinho.id,
    7,
    "SÉTIMO DIA – SANTO AGOSTINHO, AMOR À IGREJA",
    `Santo Agostinho, amastes profundamente a Igreja, servindo-a como bispo, pastor e doutor.

Ajudai-nos a amar a Igreja, mesmo com suas fragilidades humanas. Que sejamos fiéis ao Evangelho e à comunhão.

Ensinai-nos a servir a Igreja com amor e verdade.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    agostinho.id,
    8,
    "OITAVO DIA – SANTO AGOSTINHO, AMOR QUE ORDENA A VIDA",
    `Santo Agostinho, aprendestes que amar corretamente é colocar Deus acima de todas as coisas.

Ajudai-nos a ordenar nossos amores. Que Deus seja o centro de nossa vida e que tudo o mais encontre seu lugar Nele.

Ensinai-nos a amar com liberdade e verdade.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    agostinho.id,
    9,
    "NONO DIA – SANTO AGOSTINHO, NOSSO INTERCESSOR E MESTRE",
    `Santo Agostinho, acolhei esta novena que rezamos com fé e confiança. Apresentai a Deus nossos pedidos, inquietações e agradecimentos.

Intercedei por nossa conversão contínua, por nossa vida espiritual e por nossa perseverança no amor de Deus até o fim.

Ajudai-nos a encontrar descanso em Deus, agora e para sempre.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

//NOVENA DE NOSSA SENHORA DAS DORES

  const dores = upsertNovena({
    slug: makeSlug("NOVENA DE NOSSA SENHORA DAS DORES"),
    titulo: "NOVENA DE NOSSA SENHORA DAS DORES",
    periodo_inicio: "06/09",
    periodo_fim: "14/09",
    subtitulo: "Unida ao sofrimento do Filho, participou do mistério da redenção",
    como_rezar: COMO_REZAR_PADRAO,
    sinal_da_cruz: SINAL_DA_CRUZ_PADRAO,
    oracao_inicial: `Ó Maria Santíssima, Nossa Senhora das Dores, Mãe dolorosa e cheia de amor, que permanecestes de pé junto à cruz de vosso Filho, partilhando de Suas dores com fé silenciosa e coração entregue à vontade do Pai, nós nos aproximamos de vós com respeito, confiança e ternura filial.

Acolhei-nos em vosso Coração transpassado. Concedei-nos a graça de rezar esta novena com coração aberto, espírito humilde e profunda confiança. Que, ao contemplarmos vossas dores unidas às dores de Cristo, aprendamos a viver nossos sofrimentos com fé, a não perder a esperança nas provações e a encontrar na cruz um caminho de amor e salvação. Intercedei por nós e alcançai-nos as graças que necessitamos para nossa vida e salvação, conforme a santa vontade de Deus.
Amém.`,
    oracao_final: `Ó Maria Santíssima, Nossa Senhora das Dores,
acolhei-nos em vosso Coração transpassado.
Ajudai-nos a carregar nossas cruzes com fé,
a sofrer sem perder a esperança
e a confiar que, em Deus,
toda dor pode ser transformada em vida nova.
Rogai por nós, agora e sempre.
Amém.
`
  });

  upsertDia(
    dores.id,
    1,
    "PRIMEIRO DIA – NOSSA SENHORA DAS DORES, MÃE QUE ACOLHE O SOFRIMENTO",
    `Nossa Senhora das Dores, desde o início da vida de Jesus, vosso coração foi marcado pela dor e pela entrega.

Ajudai-nos a acolher nossas dores com fé. Que não fujamos do sofrimento, mas o apresentemos a Deus com confiança.

Ensinai-nos a sofrer sem perder o amor.

(Fazer o pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    dores.id,
    2,
    "SEGUNDO DIA – NOSSA SENHORA DAS DORES, ESPADA NO CORAÇÃO",
    `Ó Mãe dolorosa, a profecia de Simeão se cumpriu: uma espada transpassou vosso coração.

Ajudai-nos a compreender que a dor faz parte do caminho cristão. Que não nos revoltemos diante das provas da vida.

Ensinai-nos a unir nossas dores às vossas e às de Cristo.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    dores.id,
    3,
    "TERCEIRO DIA – NOSSA SENHORA DAS DORES, SILÊNCIO QUE CONFIA",
    `Nossa Senhora das Dores, em meio às maiores dores, guardastes o silêncio cheio de fé e abandono em Deus.

Ajudai-nos a silenciar o coração nas horas difíceis. Que aprendamos a confiar mesmo quando não compreendemos.

Ensinai-nos a descansar em Deus no silêncio da dor.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    dores.id,
    4,
    "QUARTO DIA – NOSSA SENHORA DAS DORES, MÃE QUE CAMINHA COM O FILHO",
    `Ó Mãe dolorosa, acompanhastes Jesus no caminho do Calvário, sem abandoná-Lo um só instante.

Ajudai-nos a permanecer fiéis a Deus nas horas de cruz. Que não abandonemos o Senhor quando a dor chega.

Ensinai-nos a caminhar com Cristo mesmo no sofrimento.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    dores.id,
    5,
    "QUINTO DIA – NOSSA SENHORA DAS DORES, MÃE AO PÉ DA CRUZ",
    `Nossa Senhora das Dores, permanecestes firme ao pé da cruz, oferecendo vosso Filho ao Pai por amor à humanidade.

Ajudai-nos a permanecer firmes nas provações. Que saibamos oferecer nossas dores como ato de amor.

Ensinai-nos a confiar que a cruz não é o fim.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    dores.id,
    6,
    "SEXTO DIA – NOSSA SENHORA DAS DORES, MÃE QUE PERDE E CONFIA",
    `Ó Mãe dolorosa, experimentastes a dor da perda, do luto e da separação.

Consolai os que choram a perda de entes queridos. Ajudai-nos a confiar que a morte não tem a última palavra.

Ensinai-nos a esperar na promessa da ressurreição.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    dores.id,
    7,
    "SÉTIMO DIA – NOSSA SENHORA DAS DORES, COMPANHEIRA DOS AFLITOS",
    `Nossa Senhora das Dores, conheceis as lágrimas humanas e sois próxima dos que sofrem.

Olhai pelos aflitos, doentes, desanimados e angustiados. Ajudai-nos a sentir vossa presença materna em nossas dores.

Ensinai-nos a confiar que nunca sofremos sozinhos.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    dores.id,
    8,
    "OITAVO DIA – NOSSA SENHORA DAS DORES, ESPERANÇA NA NOITE ESCURA",
    `Ó Mãe dolorosa, mesmo na noite mais escura, conservastes a esperança viva no coração.

Ajudai-nos a não perder a esperança nas horas mais difíceis. Que aprendamos a esperar contra toda esperança.

Ensinai-nos a confiar no amor de Deus que age no silêncio.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    dores.id,
    9,
    "NONO DIA – NOSSA SENHORA DAS DORES, MÃE DA ESPERANÇA E DA VIDA NOVA",
    `Nossa Senhora das Dores, após a cruz veio a ressurreição, e vossa dor foi transformada em alegria.

Acolhei esta novena que rezamos com lágrimas, fé e confiança. Apresentai a Deus nossas dores, pedidos e agradecimentos.

Conduzi-nos da cruz à vida nova, da dor à esperança, da tristeza à paz.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );



//NOVENA DE SÃO PIO DE PIETRELCINA

const pio = upsertNovena({
    slug: makeSlug("NOVENA DE SÃO PIO DE PIETRELCINA"),
    titulo: "NOVENA DE SÃO PIO DE PIETRELCINA",
    periodo_inicio: "14/09",
    periodo_fim: "22/09",
    subtitulo: "Ore, espere e não se preocupe. A preocupação é inútil. Nosso Senhor misericordioso escutará a sua oração",
    como_rezar: COMO_REZAR_PADRAO,
    sinal_da_cruz: SINAL_DA_CRUZ_PADRAO,
    oracao_inicial: `Ó Deus eterno e misericordioso, que concedestes a São Pio de Pietrelcina a graça singular de participar intimamente da cruz de Vosso Filho, unindo sofrimento, oração e amor pelas almas, nós Vos louvamos e bendizemos por este testemunho tão forte de fé viva e entrega total.

Por intercessão de São Pio, concedei-nos a graça de rezar esta novena com coração sincero, fé confiante e profundo desejo de conversão. Que, ao contemplarmos sua vida marcada pela Eucaristia, pela confissão e pela união com a cruz de Cristo, sejamos transformados pela misericórdia divina e fortalecidos para carregar nossas próprias cruzes com amor. Concedei-nos também as graças que necessitamos para nossa vida e salvação, conforme a Vossa santa vontade.
Amém.`,
    oracao_final: `Ó Deus de infinita misericórdia,
que nos destes em São Pio de Pietrelcina
um testemunho vivo da cruz e da misericórdia,
concedei-nos, por sua intercessão,
amor à Eucaristia,
confiança na confissão
e força para carregar nossas cruzes com fé.
Por Cristo, nosso Senhor.
Amém.`
  });

  upsertDia(
    pio.id,
    1,
    "PRIMEIRO DIA – SÃO PIO, HOMEM TOTALMENTE ENTREGUE A DEUS",
    `São Pio, desde jovem entregastes toda a vossa vida a Deus, aceitando com amor o caminho da vocação sacerdotal.

Ajudai-nos a entregar nossa vida ao Senhor sem reservas. Que aprendamos a confiar em Deus mesmo quando não compreendemos Seus caminhos.

Ensinai-nos a viver abandonados na vontade divina.

(Fazer o pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    pio.id,
    2,
    "SEGUNDO DIA – SÃO PIO, AMANTE DA ORAÇÃO",
    `São Pio, vossa vida foi sustentada pela oração constante, profunda e confiante.

Ajudai-nos a redescobrir a força da oração. Que aprendamos a rezar com o coração e a perseverar mesmo na aridez.

Ensinai-nos a confiar no poder da oração.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    pio.id,
    3,
    "TERCEIRO DIA – SÃO PIO, HOMEM DA EUCARISTIA",
    `São Pio, celebráveis a Santa Missa com profundo amor e reverência, unido intimamente ao sacrifício de Cristo.

Ajudai-nos a amar a Eucaristia. Que a Santa Missa seja o centro de nossa vida cristã.

Ensinai-nos a reconhecer Jesus vivo e presente no altar.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    pio.id,
    4,
    "QUARTO DIA – SÃO PIO, CONFESSOR DAS ALMAS",
    `São Pio, passastes longas horas no confessionário, instrumento da misericórdia de Deus para tantos pecadores.

Ajudai-nos a buscar o sacramento da Reconciliação com humildade e sinceridade. Que não tenhamos medo da misericórdia divina.

Ensinai-nos o verdadeiro arrependimento e a conversão do coração.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    pio.id,
    5,
    "QUINTO DIA – SÃO PIO, UNIDO À CRUZ DE CRISTO",
    `São Pio, carregastes no corpo e na alma as marcas da paixão de Cristo, unindo-vos profundamente ao Seu sofrimento.

Ajudai-nos a aceitar nossas cruzes com fé. Que saibamos oferecer nossas dores em união com Jesus.

Ensinai-nos a encontrar sentido redentor no sofrimento.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    pio.id,
    6,
    "SEXTO DIA – SÃO PIO, HUMILDADE E OBEDIÊNCIA",
    `São Pio, mesmo incompreendido e provado, permanecestes humilde e obediente à Igreja.

Ajudai-nos a viver a humildade verdadeira. Que saibamos obedecer com fé, mesmo quando somos contrariados.

Ensinai-nos a confiar que Deus age também através das provações.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    pio.id,
    7,
    "SÉTIMO DIA – SÃO PIO, AMOR PELAS ALMAS",
    `São Pio, vosso coração sacerdotal ardia de amor pela salvação das almas.

Ajudai-nos a nos preocupar com nossa salvação e com a dos outros. Que vivamos uma fé viva, concreta e comprometida.

Intercedei por todos os que se afastaram de Deus.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    pio.id,
    8,
    "OITAVO DIA – SÃO PIO, CONFIANÇA NA PROVIDÊNCIA DIVINA",
    `São Pio, mesmo em meio às dificuldades, confiastes plenamente na providência de Deus.

Ajudai-nos a confiar que Deus nunca nos abandona. Que aprendamos a descansar em Suas mãos.

Ensinai-nos a viver com fé confiante e abandono filial.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    pio.id,
    9,
    "NONO DIA – SÃO PIO, NOSSO PODEROSO INTERCESSOR",
    `São Pio de Pietrelcina, acolhei esta novena que rezamos com fé e confiança. Apresentai a Deus nossos pedidos, dores e agradecimentos.

Intercedei por nossa conversão, por nossa perseverança na fé e por nossa união com Cristo. Ajudai-nos a carregar nossa cruz com amor e a viver sempre na graça de Deus.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  //NOVENA DE SÃO VICENTE DE PAULO

  const vicente = upsertNovena({
    slug: makeSlug("NOVENA DE SÃO VICENTE DE PAULO"),
    titulo: "NOVENA DE SÃO VICENTE DE PAULO",
    periodo_inicio: "18/09",
    periodo_fim: "26/09",
    subtitulo: "Servir os pobres é servir o próprio Cristo",
    como_rezar: COMO_REZAR_PADRAO,
    sinal_da_cruz: SINAL_DA_CRUZ_PADRAO,
    oracao_inicial: `Ó Deus de infinita misericórdia, que suscitastes São Vicente de Paulo como reflexo vivo do Vosso amor pelos pobres, sofredores e abandonados, nós Vos louvamos e bendizemos por este testemunho luminoso de caridade concreta, fé viva e serviço humilde.

Por intercessão de São Vicente de Paulo, concedei-nos a graça de rezar esta novena com coração sensível, espírito generoso e fé operante. Que, ao contemplarmos sua vida marcada pelo amor aos pobres e pela total confiança em Vossa providência, aprendamos a reconhecer Cristo nos que sofrem e a servi-Lo com amor sincero. Concedei-nos também as graças que necessitamos para nossa vida e salvação, conforme a Vossa santa vontade.
Amém.`,
    oracao_final: `Ó Deus de infinita caridade,
que nos destes em São Vicente de Paulo
um exemplo vivo de amor aos pobres,
concedei-nos, por sua intercessão,
um coração misericordioso,
mãos prontas para servir
e fé que se traduz em obras.
Por Cristo, nosso Senhor.
Amém.`
  });

  upsertDia(
    vicente.id,
    1,
    "PRIMEIRO DIA – SÃO VICENTE DE PAULO, CORAÇÃO TOCADO PELA MISERICÓRDIA",
    `São Vicente de Paulo, vosso coração foi profundamente tocado pela dor dos pobres e pela misericórdia de Deus.

Ajudai-nos a abrir os olhos e o coração para o sofrimento do próximo. Que não sejamos indiferentes à dor alheia.

Ensinai-nos a amar com um amor que age.

(Fazer o pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    vicente.id,
    2,
    "SEGUNDO DIA – SÃO VICENTE DE PAULO, DISCÍPULO ATENTO DE CRISTO",
    `São Vicente de Paulo, aprendestes a reconhecer Cristo presente nos pobres e necessitados.

Ajudai-nos a enxergar Jesus nos irmãos mais frágeis. Que saibamos servir com respeito, dignidade e amor verdadeiro.

Ensinai-nos a ver além das aparências.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    vicente.id,
    3,
    "TERCEIRO DIA – SÃO VICENTE DE PAULO, CARIDADE QUE SE TORNA AÇÃO",
    `São Vicente de Paulo, não vos contentastes apenas com palavras; transformastes a caridade em obras concretas.

Ajudai-nos a viver uma fé que se manifesta em ações. Que nossas mãos sejam instrumentos do amor de Deus.

Ensinai-nos a agir com generosidade e prontidão.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    vicente.id,
    4,
    "QUARTO DIA – SÃO VICENTE DE PAULO, HUMILDADE NO SERVIÇO",
    `São Vicente de Paulo, servistes os pobres com humildade, sem buscar reconhecimento ou elogios.

Ajudai-nos a servir sem vaidade. Que façamos o bem por amor a Deus, e não para sermos vistos.

Ensinai-nos a humildade verdadeira.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    vicente.id,
    5,
    "QUINTO DIA – SÃO VICENTE DE PAULO, CONFIANÇA NA PROVIDÊNCIA",
    `São Vicente de Paulo, mesmo diante da escassez, confiastes plenamente na providência divina.

Ajudai-nos a confiar que Deus cuida de tudo. Que não nos deixemos dominar pelo medo da falta ou da insegurança.

Ensinai-nos a viver abandonados nas mãos de Deus.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    vicente.id,
    6,
    "SEXTO DIA – SÃO VICENTE DE PAULO, AMOR PREFERENCIAL PELOS POBRES",
    `São Vicente de Paulo, escolhestes dedicar vossa vida aos mais pobres, reconhecendo neles o rosto sofredor de Cristo.

Intercedei por todos os que vivem na pobreza, na fome e no abandono. Ajudai-nos a ser solidários e justos.

Ensinai-nos a amar com prioridade aqueles que mais sofrem.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    vicente.id,
    7,
    "SÉTIMO DIA – SÃO VICENTE DE PAULO, ORGANIZADOR DA CARIDADE",
    `São Vicente de Paulo, compreendestes que a caridade precisa ser organizada para alcançar mais pessoas.

Ajudai-nos a trabalhar unidos pelo bem comum. Que saibamos colaborar, partilhar e servir em comunhão.

Ensinai-nos que a caridade cresce quando é partilhada.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    vicente.id,
    8,
    "OITAVO DIA – SÃO VICENTE DE PAULO, PACIÊNCIA E PERSEVERANÇA NO BEM",
    `São Vicente de Paulo, perseverastes na caridade mesmo diante das dificuldades, críticas e cansaço.

Ajudai-nos a não desanimar na prática do bem. Que sejamos fiéis mesmo quando não vemos resultados imediatos.

Ensinai-nos a perseverar no amor.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    vicente.id,
    9,
    "NONO DIA – SÃO VICENTE DE PAULO, NOSSO INTERCESSOR NA CARIDADE",
    `São Vicente de Paulo, acolhei esta novena que rezamos com fé e amor. Apresentai a Deus nossos pedidos, intenções e agradecimentos.

Intercedei para que sejamos cristãos comprometidos com o amor concreto, com a justiça e com a misericórdia. Conduzi-nos a viver uma fé que transforma o mundo pelo amor.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  //NOVENA AOS SANTOS ARCANJOS
//(SAO MIGUEL, SAO GABRIEL E SAO RAFAEL)

const arcanjo = upsertNovena({
    slug: makeSlug("NOVENA AOS SANTOS ARCANJOS"),
    titulo: "NOVENA AOS SANTOS ARCANJOS",
    periodo_inicio: "20/09",
    periodo_fim: "28/09",
    subtitulo: "Pela voz de Gabriel, pelo escudo de Miguel e pelas mãos de Rafael, Deus nos conduz",
    como_rezar: COMO_REZAR_PADRAO,
    sinal_da_cruz: SINAL_DA_CRUZ_PADRAO,
    oracao_inicial: `Ó Deus eterno e todo-poderoso, que em Vossa infinita sabedoria criastes os Santos Arcanjos para servirem ao Vosso plano de amor, protegerem Vosso povo e anunciarem Vossa vontade, nós Vos louvamos e bendizemos por este dom tão precioso concedido à Igreja.

Por intercessão dos Santos Arcanjos São Miguel, São Gabriel e São Rafael, concedei-nos a graça de rezar esta novena com fé viva, coração vigilante e espírito dócil à Vossa vontade. Que, guiados por esses mensageiros celestes, sejamos protegidos no combate espiritual, iluminados pela Palavra de Deus e fortalecidos no caminho da cura, da fé e da salvação. Concedei-nos também as graças que necessitamos para nossa vida e salvação, conforme a Vossa santa vontade.
Amém.`,
    oracao_final: `Ó Deus todo-poderoso,
que confiastes aos Santos Arcanjos
a missão de proteger, anunciar e curar,
concedei-nos, por sua intercessão,
proteção no combate espiritual,
luz para discernir Vossa vontade
e força para caminhar na fé.
Por Cristo, nosso Senhor.
Amém.`
  });

  upsertDia(
    arcanjo.id,
    1,
    "PRIMEIRO DIA – OS SANTOS ARCANJOS, SERVOS FIÉIS DE DEUS",
    `Santos Arcanjos, fostes criados para servir fielmente ao Senhor e cumprir Sua vontade com prontidão e amor.

Ajudai-nos a reconhecer que também somos chamados a servir a Deus em nossa vida diária. Que sejamos fiéis naquilo que o Senhor nos confia.

Ensinai-nos a viver com obediência e amor à vontade divina.

(Fazer o pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    arcanjo.id,
    2,
    "SEGUNDO DIA – SÃO MIGUEL ARCANJO, DEFENSOR NO COMBATE ESPIRITUAL",
    `São Miguel Arcanjo, príncipe das milícias celestes, defensor do povo de Deus contra as forças do mal.

Protegei-nos no combate espiritual. Defendei-nos das tentações, das ciladas do inimigo e de todo mal que ameaça nossa alma.

Ensinai-nos a confiar no poder de Deus que vence todo mal.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    arcanjo.id,
    3,
    "TERCEIRO DIA – SÃO MIGUEL ARCANJO, ZELO PELA GLÓRIA DE DEUS",
    `São Miguel Arcanjo, vosso nome proclama: “Quem como Deus?”. Vossa vida é um grito de fidelidade e adoração.

Ajudai-nos a colocar Deus acima de tudo. Que rejeitemos tudo o que tenta ocupar o lugar que pertence somente ao Senhor.

Ensinai-nos a viver para a glória de Deus.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    arcanjo.id,
    4,
    "QUARTO DIA – SÃO GABRIEL ARCANJO, MENSAGEIRO DA PALAVRA DE DEUS",
    `São Gabriel Arcanjo, mensageiro fiel, fostes enviado para anunciar os desígnios de Deus e levar Sua Palavra aos corações.

Ajudai-nos a escutar a Palavra de Deus com atenção e abertura. Que saibamos acolher o que Deus nos pede.

Ensinai-nos a dizer “sim” à vontade divina, como Maria.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    arcanjo.id,
    5,
    "QUINTO DIA – SÃO GABRIEL ARCANJO, PORTADOR DA BOA-NOVA",
    `São Gabriel Arcanjo, anunciastes a alegria da salvação e a vinda do Salvador ao mundo.

Ajudai-nos a ser portadores da Boa-Nova. Que nossas palavras e atitudes anunciem a esperança que vem de Deus.

Ensinai-nos a comunicar a fé com amor e verdade.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    arcanjo.id,
    6,
    "SEXTO DIA – SÃO RAFAEL ARCANJO, COMPANHEIRO DE CAMINHO",
    `São Rafael Arcanjo, fostes enviado para acompanhar, proteger e conduzir no caminho seguro.

Caminhai conosco em nossas jornadas. Ajudai-nos a tomar decisões justas e a seguir o caminho do bem.

Ensinai-nos a confiar que Deus caminha conosco.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    arcanjo.id,
    7,
    "SÉTIMO DIA – SÃO RAFAEL ARCANJO, CURA DO CORPO E DA ALMA",
    `São Rafael Arcanjo, instrumento da cura de Deus, fostes enviado para restaurar a saúde e trazer alívio.

Intercedei por nossa cura física, emocional e espiritual. Tocai nossas feridas e fortalecei nossa esperança.

Ensinai-nos a confiar no Deus que cura e restaura.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    arcanjo.id,
    8,
    "OITAVO DIA – OS SANTOS ARCANJOS, GUIAS NA VONTADE DE DEUS",
    `Santos Arcanjos, vossa missão é conduzir os homens no caminho da vontade divina.

Ajudai-nos a discernir os caminhos de Deus em nossa vida. Que saibamos escolher o que nos conduz à santidade.

Ensinai-nos a viver atentos à voz de Deus.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    arcanjo.id,
    9,
    "NONO DIA – OS SANTOS ARCANJOS, NOSSOS PROTETORES E INTERCESSORES",
    `Santos Arcanjos Miguel, Gabriel e Rafael, acolhei esta novena que rezamos com fé e confiança. Apresentai a Deus nossos pedidos, necessidades e agradecimentos.

Protegei-nos, iluminai-nos e conduzi-nos no caminho da salvação. Que, sob vossa guarda, vivamos na paz, na fé e na fidelidade a Deus até o fim.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  //NOVENA DE SANTA TERESINHA DO MENINO JESUS

  const teresinha = upsertNovena({
    slug: makeSlug("NOVENA DE SANTA TERESINHA DO MENINO JESUS"),
    titulo: "NOVENA DE SANTA TERESINHA DO MENINO JESUS",
    periodo_inicio: "22/09",
    periodo_fim: "30/09",
    subtitulo: "“Farei cair uma chuva de rosas sobre o mundo”",
    como_rezar: COMO_REZAR_PADRAO,
    sinal_da_cruz: SINAL_DA_CRUZ_PADRAO,
    oracao_inicial: `Ó Deus de infinita ternura, que revelastes os mistérios do Vosso Reino aos pequenos e humildes, e fizestes de Santa Teresinha do Menino Jesus uma testemunha luminosa do amor simples, confiante e total, nós Vos louvamos e bendizemos por este dom tão precioso concedido à Igreja.

Por intercessão de Santa Teresinha, concedei-nos a graça de rezar esta novena com coração simples, espírito de criança e confiança filial. Que, aprendendo com ela o caminho da Pequena Via, saibamos amar-Vos nas pequenas coisas do dia a dia, confiar em Vossa misericórdia e viver cada momento como oportunidade de santidade. Concedei-nos também as graças que necessitamos para nossa vida e salvação, conforme a Vossa santa vontade.
Amém.`,
    oracao_final: `Ó Deus de infinita ternura,
que fizestes de Santa Teresinha
uma mestra do amor confiante,
concedei-nos, por sua intercessão,
um coração simples,
confiança filial
e amor fiel nas pequenas coisas.
Por Cristo, nosso Senhor.
Amém.`
  });

  upsertDia(
    teresinha.id,
    1,
    "PRIMEIRO DIA – SANTA TERESINHA, CRIANÇA DIANTE DE DEUS",
    `Santa Teresinha, escolhestes viver como uma criança nos braços do Pai, confiando plenamente em Seu amor.

Ajudai-nos a abandonar o orgulho e a autossuficiência. Que aprendamos a nos colocar diante de Deus com simplicidade e confiança.

Ensinai-nos a viver como filhos que confiam no amor do Pai.

(Fazer o pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    teresinha.id,
    2,
    "SEGUNDO DIA – SANTA TERESINHA, CONFIANÇA NA MISERICÓRDIA",
    `Santa Teresinha, vossa vida foi marcada por uma confiança ilimitada na misericórdia de Deus.

Ajudai-nos a confiar na bondade divina, mesmo diante de nossas fraquezas. Que nunca duvidemos do amor misericordioso de Deus.

Ensinai-nos a lançar-nos nos braços do Pai.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    teresinha.id,
    3,
    "TERCEIRO DIA – SANTA TERESINHA, A PEQUENA VIA DO AMOR",
    `Santa Teresinha, ensinastes que a santidade se encontra nas pequenas coisas feitas com grande amor.

Ajudai-nos a santificar o cotidiano. Que aprendamos a amar a Deus nos gestos simples, nas renúncias escondidas e no serviço silencioso.

Ensinai-nos que o amor transforma tudo.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    teresinha.id,
    4,
    "QUARTO DIA – SANTA TERESINHA, AMOR QUE SE OFERECE",
    `Santa Teresinha, fizestes de vossa vida uma oferta de amor, mesmo sem grandes obras aos olhos do mundo.

Ajudai-nos a oferecer nossa vida a Deus como dom de amor. Que não busquemos reconhecimento, mas apenas amar.

Ensinai-nos a viver para agradar a Deus.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    teresinha.id,
    5,
    "QUINTO DIA – SANTA TERESINHA, PACIÊNCIA E HUMILDADE",
    `Santa Teresinha, aceitastes com humildade as limitações, incompreensões e dificuldades do dia a dia.

Ajudai-nos a viver a paciência e a humildade. Que saibamos acolher as pequenas cruzes com amor e serenidade.

Ensinai-nos a crescer na virtude pelo amor.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    teresinha.id,
    6,
    "SEXTO DIA – SANTA TERESINHA, AMOR À CRUZ",
    `Santa Teresinha, abraçastes o sofrimento com confiança, unindo-o ao amor de Cristo.

Ajudai-nos a aceitar nossas dores com fé. Que saibamos oferecer nossos sofrimentos como ato de amor.

Ensinai-nos que o sofrimento vivido com amor salva.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    teresinha.id,
    7,
    "SÉTIMO DIA – SANTA TERESINHA, CORAÇÃO MISSIONÁRIO",
    `Santa Teresinha, mesmo sem sair do convento, tornastes-vos missionária pelo amor e pela oração.

Ajudai-nos a rezar pelas missões e pelos que anunciam o Evangelho. Que sejamos missionários no coração e nas atitudes.

Ensinai-nos que o amor alcança o mundo inteiro.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    teresinha.id,
    8,
    "OITAVO DIA – SANTA TERESINHA, ESPERANÇA NA NOITE DA FÉ",
    `Santa Teresinha, mesmo na escuridão da fé, permanecestes firme na confiança e no amor.

Ajudai-nos a confiar quando não sentimos Deus. Que aprendamos a amar mesmo na aridez espiritual.

Ensinai-nos a viver a fé pura, sem consolações.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    teresinha.id,
    9,
    "NONO DIA – SANTA TERESINHA, CHUVA DE ROSAS DO CÉU",
    `Santa Teresinha, prometestes passar o vosso Céu fazendo o bem na terra e derramando uma chuva de rosas sobre os que confiam em vós.

Acolhei esta novena que rezamos com fé e amor. Apresentai a Deus nossos pedidos, necessidades e agradecimentos.

Intercedei por nós e ajudai-nos a viver na confiança, no amor e na simplicidade até o fim.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  //NOVENA DE SÃO FRANCISCO DE ASSIS

  const assis = upsertNovena({
    slug: makeSlug("NOVENA DE SÃO FRANCISCO DE ASSIS"),
    titulo: "NOVENA DE SÃO FRANCISCO DE ASSIS",
    periodo_inicio: "25/09",
    periodo_fim: "03/10",
    subtitulo: "“Senhor, fazei de mim um instrumento de vossa paz”",
    como_rezar: COMO_REZAR_PADRAO,
    sinal_da_cruz: SINAL_DA_CRUZ_PADRAO,
    oracao_inicial: `Ó Deus altíssimo, bom e todo-poderoso, que tocastes o coração de São Francisco de Assis e o chamastes a seguir Vosso Filho Jesus Cristo na pobreza, na humildade e no amor perfeito, nós Vos louvamos e bendizemos por este testemunho tão luminoso de vida evangélica.

Por intercessão de São Francisco de Assis, concedei-nos a graça de rezar esta novena com coração simples, espírito desprendido e desejo sincero de conversão. Que, ao contemplarmos sua vida marcada pela alegria, pela pobreza evangélica e pelo amor a todas as criaturas, aprendamos a viver o Evangelho com radicalidade, confiança e paz. Concedei-nos também as graças que necessitamos para nossa vida e salvação, conforme a Vossa santa vontade.
Amém.`,
    oracao_final: `Ó Deus altíssimo e glorioso,
que fizestes de São Francisco de Assis
um espelho vivo do Evangelho,
concedei-nos, por sua intercessão,
um coração pobre e livre,
amor ardente por Cristo
e alegria verdadeira no Vosso serviço.
Por Cristo, nosso Senhor.
Amém.
`
  });

  upsertDia(
    assis.id,
    1,
    "PRIMEIRO DIA – PRIMEIRO DIA – SÃO FRANCISCO, CORAÇÃO TOCADO POR DEUS",
    `São Francisco, Deus tocou vosso coração e transformou vossa vida, chamando-vos a deixar tudo para segui-Lo.

Ajudai-nos a escutar o chamado de Deus em nossa vida. Que não resistamos à Sua voz nem adiemos nossa conversão.

Ensinai-nos a responder com generosidade ao chamado do Senhor.

(Fazer o pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    assis.id,
    2,
    "SEGUNDO DIA – SÃO FRANCISCO, DESAPEGO DAS RIQUEZAS",
    `São Francisco, deixastes as riquezas do mundo para abraçar a pobreza evangélica e encontrar a verdadeira liberdade.

Ajudai-nos a desapegar o coração do que nos prende. Que aprendamos a confiar mais em Deus do que nos bens materiais.

Ensinai-nos que a verdadeira riqueza é o amor de Deus.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    assis.id,
    3,
    "TERCEIRO DIA – SÃO FRANCISCO, AMOR À PALAVRA DE DEUS",
    `São Francisco, vivestes o Evangelho de forma simples e radical, fazendo da Palavra de Deus a regra de vossa vida.

Ajudai-nos a amar o Evangelho. Que saibamos viver aquilo que escutamos e professamos.

Ensinai-nos a transformar a Palavra em vida concreta.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    assis.id,
    4,
    "QUARTO DIA – SÃO FRANCISCO, HUMILDADE E SIMPLICIDADE",
    `São Francisco, escolhestes o caminho da humildade, reconhecendo-vos pequeno diante de Deus.

Ajudai-nos a viver com simplicidade e humildade de coração. Que não busquemos honras nem reconhecimento.

Ensinai-nos a sermos pequenos para que Deus seja grande em nós.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    assis.id,
    5,
    "QUINTO DIA – SÃO FRANCISCO, AMOR À CRUZ DE CRISTO",
    `São Francisco, contemplastes com profundo amor a paixão de Cristo e desejastes conformar-vos totalmente a Ele.

Ajudai-nos a abraçar nossa cruz com fé. Que saibamos unir nossos sofrimentos aos de Cristo.

Ensinai-nos a amar Jesus crucificado.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    assis.id,
    6,
    "SEXTO DIA – SÃO FRANCISCO, PAZ E RECONCILIAÇÃO",
    `São Francisco, fostes instrumento da paz de Deus num mundo ferido por divisões e conflitos.

Ajudai-nos a ser instrumentos de paz. Que levemos reconciliação onde há ódio, perdão onde há ofensa e amor onde há indiferença.

Ensinai-nos a construir a paz com gestos concretos.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    assis.id,
    7,
    "SÉTIMO DIA – SÃO FRANCISCO, AMOR À CRIAÇÃO",
    `São Francisco, reconhecestes todas as criaturas como irmãs, louvando a Deus por meio da criação.

Ajudai-nos a respeitar e cuidar da criação. Que saibamos louvar a Deus por tudo o que Ele criou.

Ensinai-nos a viver em harmonia com a natureza e com os irmãos.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    assis.id,
    8,
    "OITAVO DIA – SÃO FRANCISCO, ALEGRIA PERFEITA",
    `São Francisco, aprendestes que a verdadeira alegria nasce da união com Deus, mesmo nas dificuldades.

Ajudai-nos a buscar a alegria que vem de Deus. Que não nos deixemos vencer pela tristeza ou pelo desânimo.

Ensinai-nos a encontrar alegria na fidelidade ao Evangelho.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    assis.id,
    9,
    "NONO DIA – SÃO FRANCISCO, CONFORME A CRISTO ATÉ O FIM",
    `São Francisco, ao final de vossa vida, fostes plenamente configurado a Cristo, tornando-vos testemunha viva do Evangelho.

Acolhei esta novena que rezamos com fé e amor. Apresentai a Deus nossos pedidos, intenções e agradecimentos.

Ajudai-nos a viver e morrer no amor de Deus, seguindo Jesus com fidelidade, simplicidade e paz.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  //NOVENA A NOSSA SENHORA APARECIDA

  const aparecida = upsertNovena({
    slug: makeSlug("NOVENA A NOSSA SENHORA APARECIDA"),
    titulo: "NOVENA A NOSSA SENHORA APARECIDA",
    periodo_inicio: "03/10",
    periodo_fim: "11/10",
    subtitulo: "Padroeira do Brasil, Mãe dos pobres, dos simples e dos que confiam",
    como_rezar: COMO_REZAR_PADRAO,
    sinal_da_cruz: SINAL_DA_CRUZ_PADRAO,
    oracao_inicial: `Ó Maria Santíssima, Nossa Senhora Aparecida, Mãe querida e Padroeira do Brasil, que Vos deixastes encontrar nas águas humildes do rio Paraíba, manifestando o cuidado amoroso de Deus pelos pequenos e esquecidos, nós nos aproximamos de vós com confiança filial e coração agradecido.

Acolhei-nos sob vosso manto protetor e concedei-nos a graça de rezar esta novena com fé sincera, esperança viva e amor confiante. Que, ao contemplarmos vossa presença materna em nossa história, aprendamos a confiar em Deus nas dificuldades, a reconhecer Sua ação nos momentos simples da vida e a caminhar com fidelidade no seguimento de Jesus. Intercedei por nós e alcançai-nos as graças que necessitamos para nossa vida e salvação, conforme a santa vontade de Deus.
Amém.`,
    oracao_final: `Ó Maria Santíssima, Nossa Senhora Aparecida,
Mãe amada e Padroeira do Brasil,
acolhei-nos sob vosso manto protetor.
Ajudai-nos a confiar em Deus,
a perseverar na fé
e a caminhar com esperança e amor.
Rogai por nós, hoje e sempre.
Amém.`
  });

  upsertDia(
    aparecida.id,
    1,
    "PRIMEIRO DIA – NOSSA SENHORA APARECIDA, MÃE QUE SE FAZ PRESENTE",
    `Nossa Senhora Aparecida, vos fizestes presente na vida de um povo simples, mostrando que Deus não abandona seus filhos.

Ajudai-nos a reconhecer vossa presença em nossa vida. Que saibamos perceber os sinais de Deus mesmo nas situações mais simples.

Ensinai-nos a confiar que nunca estamos sozinhos.

(Fazer o pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    aparecida.id,
    2,
    "SEGUNDO DIA – NOSSA SENHORA APARECIDA, MÃE DOS HUMILDES",
    `Ó Mãe Aparecida, escolhestes manifestar-vos aos humildes, revelando o amor preferencial de Deus pelos pequenos.

Ajudai-nos a viver com humildade de coração. Que não desprezemos o simples nem confiemos apenas em nossas forças.

Ensinai-nos a reconhecer nossa dependência de Deus.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    aparecida.id,
    3,
    "TERCEIRO DIA – NOSSA SENHORA APARECIDA, MÃE DA ESPERANÇA",
    `Nossa Senhora Aparecida, quando tudo parecia infrutífero, vossa presença transformou o desânimo em esperança.

Ajudai-nos a não perder a esperança nas dificuldades. Que aprendamos a confiar mesmo quando os esforços parecem inúteis.

Ensinai-nos a esperar no tempo de Deus.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    aparecida.id,
    4,
    "QUARTO DIA – NOSSA SENHORA APARECIDA, MÃE QUE INTERCEDE",
    `Ó Mãe Aparecida, como em Caná, intercedeis junto a Jesus pelas necessidades de vossos filhos.

Apresentai ao vosso Filho nossas dores, necessidades e pedidos. Ajudai-nos a confiar em vossa poderosa intercessão.

Ensinai-nos a recorrer a vós com confiança filial.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    aparecida.id,
    5,
    "QUINTO DIA – NOSSA SENHORA APARECIDA, MÃE DOS AFLITOS",
    `Nossa Senhora Aparecida, sois refúgio seguro para os aflitos, os pobres e os que sofrem.

Olhai por aqueles que vivem na dor, na doença e na angústia. Consolai os corações feridos e desanimados.

Ensinai-nos a buscar em vós conforto e paz.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    aparecida.id,
    6,
    "SEXTO DIA – NOSSA SENHORA APARECIDA, MÃE QUE CONDUZ A JESUS",
    `Ó Mãe querida, toda a vossa vida aponta para Jesus, vosso Filho e nosso Salvador.

Ajudai-nos a caminhar sempre em direção a Cristo. Que nossa vida seja conduzida pela fé e pela obediência ao Evangelho.

Ensinai-nos a escutar e praticar a Palavra de Deus.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    aparecida.id,
    7,
    "SÉTIMO DIA – NOSSA SENHORA APARECIDA, MÃE DA IGREJA E DO POVO",
    `Nossa Senhora Aparecida, sois Mãe da Igreja e Padroeira do povo brasileiro.

Intercedei por nossa Igreja, por nossas famílias e por nossa nação. Ajudai-nos a viver na fé, na justiça e na fraternidade.

Ensinai-nos a amar a Igreja e a viver em comunhão.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    aparecida.id,
    8,
    "OITAVO DIA – NOSSA SENHORA APARECIDA, MÃE QUE PROTEGE",
    `Ó Mãe Aparecida, sob vosso manto encontramos proteção e segurança.

Protegei-nos dos perigos do corpo e da alma. Guardai nossas famílias e nosso caminho.

Ensinai-nos a confiar em vossa proteção materna.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    aparecida.id,
    9,
    "NONO DIA – NOSSA SENHORA APARECIDA, NOSSA MÃE E NOSSA PADROEIRA",
    `Nossa Senhora Aparecida, acolhei esta novena que rezamos com amor e confiança. Apresentai a Deus nossos pedidos, agradecimentos e intenções.

Sede sempre nossa Mãe, nossa Padroeira e nossa intercessora. Conduzi-nos com ternura até Jesus e ajudai-nos a viver na fé, na esperança e no amor até a vida eterna.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  //NOVENA DE SANTA EDWIGES

  const edwiges = upsertNovena({
    slug: makeSlug("NOVENA DE SANTA EDWIGES"),
    titulo: "NOVENA DE SANTA EDWIGES",
    periodo_inicio: "07/10",
    periodo_fim: "15/10",
    subtitulo: "Senhora dos necessitados e aflitos",
    como_rezar: COMO_REZAR_PADRAO,
    sinal_da_cruz: SINAL_DA_CRUZ_PADRAO,
    oracao_inicial: `Ó Deus de infinita bondade e providência, que concedestes a Santa Edwiges a graça de viver com fé firme em meio às responsabilidades da família, às dificuldades da vida e às exigências do poder terreno, fazendo dela instrumento de caridade, justiça e confiança em Vós, nós Vos louvamos e bendizemos por este testemunho tão humano e tão santo.

Por intercessão de Santa Edwiges, concedei-nos a graça de rezar esta novena com coração confiante, espírito humilde e fé perseverante. Que, ao contemplarmos sua vida marcada pela generosidade, pela confiança em Vossa providência e pelo amor aos pobres, aprendamos a entregar nossas preocupações a Vós e a viver com esperança mesmo nas situações mais difíceis. Concedei-nos também as graças que necessitamos para nossa vida e salvação, conforme a Vossa santa vontade.
Amém.`,
    oracao_final: `Ó Deus de misericórdia e providência,
que nos destes em Santa Edwiges
um exemplo de fé, caridade e confiança,
concedei-nos, por sua intercessão,
alívio nas dificuldades,
paz nas preocupações
e esperança firme em Vosso cuidado.
Por Cristo, nosso Senhor.
Amém.`
  });

  upsertDia(
    edwiges.id,
    1,
    "PRIMEIRO DIA – SANTA EDWIGES, MULHER DE FÉ EM TODAS AS CIRCUNSTÂNCIAS",
    `Santa Edwiges, vivestes a fé no meio das responsabilidades familiares, sociais e políticas, sem jamais vos afastar de Deus.

Ajudai-nos a viver nossa fé nas situações concretas da vida. Que não percamos a confiança em Deus diante das preocupações diárias.

Ensinai-nos a colocar Deus no centro de tudo.

(Fazer o pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    edwiges.id,
    2,
    "SEGUNDO DIA – SANTA EDWIGES, CONFIANÇA NA PROVIDÊNCIA DE DEUS",
    `Santa Edwiges, mesmo diante das dificuldades, confiastes plenamente que Deus nunca abandona os que n’Ele esperam.

Ajudai-nos a confiar na providência divina. Que não sejamos dominados pelo medo da falta ou da insegurança.

Ensinai-nos a entregar nossas necessidades a Deus com fé.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    edwiges.id,
    3,
    "TERCEIRO DIA – SANTA EDWIGES, AMIGA DOS POBRES E AFLITOS",
    `Santa Edwiges, vosso coração foi sensível à dor dos pobres, dos endividados e dos esquecidos.

Ajudai-nos a olhar com compaixão para os que sofrem. Que aprendamos a partilhar, ajudar e socorrer com generosidade.

Ensinai-nos a reconhecer Cristo nos necessitados.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    edwiges.id,
    4,
    "QUARTO DIA – SANTA EDWIGES, CARIDADE QUE SE TORNA AÇÃO",
    `Santa Edwiges, transformastes vossa fé em obras concretas de caridade e justiça.

Ajudai-nos a viver uma fé ativa. Que nossas orações se traduzam em gestos de amor e solidariedade.

Ensinai-nos a fazer o bem com alegria.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    edwiges.id,
    5,
    "QUINTO DIA – SANTA EDWIGES, INTERCESSORA NAS DIFICULDADES FINANCEIRAS",
    `Santa Edwiges, a vós recorrem tantos que enfrentam dívidas, dificuldades econômicas e situações aparentemente sem saída.

Intercedei por nós em nossas necessidades materiais. Ajudai-nos a encontrar soluções justas e caminhos honestos.

Ensinai-nos a confiar que Deus provê no tempo certo.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    edwiges.id,
    6,
    "SEXTO DIA – SANTA EDWIGES, PACIÊNCIA NA PROVAÇÃO",
    `Santa Edwiges, enfrentastes perdas, sofrimentos e provações sem perder a fé nem a esperança.

Ajudai-nos a suportar as dificuldades com paciência cristã. Que não nos revoltemos, mas confiemos no amor de Deus.

Ensinai-nos a esperar com serenidade.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    edwiges.id,
    7,
    "SÉTIMO DIA – SANTA EDWIGES, HUMILDADE NO PODER E NA VIDA",
    `Santa Edwiges, mesmo ocupando posição elevada, vivestes com humildade e espírito de serviço.

Ajudai-nos a viver com humildade, independentemente de nossa posição ou condição. Que saibamos servir e não dominar.

Ensinai-nos a reconhecer que tudo vem de Deus.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    edwiges.id,
    8,
    "OITAVO DIA – SANTA EDWIGES, ESPERANÇA NAS CAUSAS DIFÍCEIS",
    `Santa Edwiges, sois conhecida como intercessora nas causas difíceis e urgentes.

Ajudai-nos a não perder a esperança quando tudo parece impossível. Que confiemos que Deus pode abrir caminhos onde não vemos saída.

Ensinai-nos a perseverar na oração.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    edwiges.id,
    9,
    "NONO DIA – SANTA EDWIGES, NOSSA INTERCESSORA JUNTO A DEUS",
    `Santa Edwiges, acolhei esta novena que rezamos com fé e confiança. Apresentai a Deus nossos pedidos, preocupações e agradecimentos.

Intercedei por nossa vida, por nossas necessidades materiais e espirituais e por nossa perseverança na fé. Ajudai-nos a viver com confiança, generosidade e paz no coração.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  //NOVENA DE SÃO GERALDO MAJELLA
  
  const geraldo = upsertNovena({
    slug: makeSlug("NOVENA DE SÃO GERALDO MAJELLA"),
    titulo: "NOVENA DE SÃO GERALDO MAJELLA",
    periodo_inicio: "07/10",
    periodo_fim: "15/10",
    subtitulo: "“A vontade de Deus é o paraíso do meu coração”",
    como_rezar: COMO_REZAR_PADRAO,
    sinal_da_cruz: SINAL_DA_CRUZ_PADRAO,
    oracao_inicial: `Ó Deus de infinita bondade, que chamastes São Geraldo Majella a viver a santidade no silêncio, na humildade e na obediência amorosa, fazendo de sua vida simples um testemunho luminoso do Vosso amor, nós Vos louvamos e bendizemos por este dom tão precioso concedido à Igreja.

Por intercessão de São Geraldo Majella, concedei-nos a graça de rezar esta novena com coração simples, espírito confiante e desejo sincero de viver segundo a Vossa vontade. Que, ao contemplarmos sua vida marcada pela pureza, pela caridade e pela confiança total em Vós, aprendamos a santificar nossas ações diárias e a confiar plenamente em Vosso cuidado paterno. Concedei-nos também as graças que necessitamos para nossa vida e salvação, conforme a Vossa santa vontade.
Amém.`,
    oracao_final: `Ó Deus de infinita bondade,
que nos destes em São Geraldo Majella
um exemplo de humildade, obediência e confiança,
concedei-nos, por sua intercessão,
um coração simples,
fé perseverante
e amor fiel em todas as circunstâncias.
Por Cristo, nosso Senhor.
Amém.`
  });

  upsertDia(
    geraldo.id,
    1,
    "PRIMEIRO DIA – SÃO GERALDO MAJELLA, CORAÇÃO SIMPLES DIANTE DE DEUS",
    `São Geraldo, vivestes com coração simples e humilde, buscando apenas agradar a Deus em tudo.

Ajudai-nos a viver com simplicidade de coração. Que não compliquemos nossa fé, mas confiemos em Deus como filhos.

Ensinai-nos a agradar a Deus nas pequenas coisas.

(Fazer o pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    geraldo.id,
    2,
    "SEGUNDO DIA – SÃO GERALDO MAJELLA, OBEDIÊNCIA AMOROSA",
    `São Geraldo, aceitastes com alegria a obediência, reconhecendo nela a vontade de Deus.

Ajudai-nos a obedecer com amor e confiança. Que saibamos acolher as orientações de Deus mesmo quando exigem renúncia.

Ensinai-nos a confiar que a vontade de Deus é sempre amor.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    geraldo.id,
    3,
    "TERCEIRO DIA – SÃO GERALDO MAJELLA, AMOR À ORAÇÃO",
    `São Geraldo, vossa vida foi sustentada pela oração constante e confiante.

Ajudai-nos a cultivar a oração em nossa vida diária. Que aprendamos a conversar com Deus com simplicidade e fé.

Ensinai-nos a confiar no poder da oração.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    geraldo.id,
    4,
    "QUARTO DIA – SÃO GERALDO MAJELLA, PUREZA DE CORAÇÃO",
    `São Geraldo, conservastes um coração puro, totalmente voltado para Deus.

Ajudai-nos a buscar a pureza de coração, pensamentos e ações. Que saibamos respeitar nosso corpo e nossa alma como dom de Deus.

Ensinai-nos a viver com integridade e fidelidade.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    geraldo.id,
    5,
    "QUINTO DIA – SÃO GERALDO MAJELLA, CONFIANÇA NA PROVIDÊNCIA",
    `São Geraldo, mesmo na pobreza e nas dificuldades, confiastes plenamente na providência divina.

Ajudai-nos a confiar que Deus cuida de nós em todas as circunstâncias. Que não nos deixemos dominar pela ansiedade.

Ensinai-nos a descansar nas mãos de Deus.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    geraldo.id,
    6,
    "SEXTO DIA – SÃO GERALDO MAJELLA, AMOR AO PRÓXIMO",
    `São Geraldo, vossa vida foi marcada pela caridade simples e discreta.

Ajudai-nos a amar o próximo com gestos concretos de bondade. Que saibamos servir sem esperar reconhecimento.

Ensinai-nos a amar como Jesus ama.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    geraldo.id,
    7,
    "SÉTIMO DIA – SÃO GERALDO MAJELLA, AMIGO DAS MÃES E DAS CRIANÇAS",
    `São Geraldo, sois conhecido como protetor das mães, das gestantes e das crianças.

Intercedei por todas as mães, especialmente as que enfrentam dificuldades, medos ou dores. Protegei as gestantes e as crianças desde o ventre materno.

Ensinai-nos a confiar na proteção de Deus sobre a família.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    geraldo.id,
    8,
    "OITAVO DIA – SÃO GERALDO MAJELLA, SANTIDADE NO COTIDIANO",
    `São Geraldo, mostrastes que a santidade se vive nas tarefas simples do dia a dia.

Ajudai-nos a santificar nossa rotina. Que façamos tudo com amor e ofereçamos cada ação a Deus.

Ensinai-nos a encontrar Deus nas pequenas coisas.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    geraldo.id,
    9,
    "NONO DIA – SÃO GERALDO MAJELLA, NOSSO INTERCESSOR JUNTO A DEUS",
    `São Geraldo Majella, acolhei esta novena que rezamos com fé e confiança. Apresentai a Deus nossos pedidos, necessidades e agradecimentos.

Intercedei por nossa vida, por nossas famílias e por nossa perseverança no caminho da santidade. Ajudai-nos a viver com simplicidade, confiança e amor até o fim.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  //NOVENA A SÃO JOÃO PAULO II
const jpii = upsertNovena({
    slug: makeSlug("NOVENA A SÃO JOÃO PAULO II"),
    titulo: "NOVENA A SÃO JOÃO PAULO II",
    periodo_inicio: "13/10",
    periodo_fim: "21/10",
    subtitulo: "'O amor me explicou tudo'",
    como_rezar: COMO_REZAR_PADRAO,
    sinal_da_cruz: SINAL_DA_CRUZ_PADRAO,
    oracao_inicial: `Ó Deus eterno e misericordioso, que escolhestes São João Paulo II para conduzir a Igreja com fé firme, coragem evangélica e profundo amor a Cristo e à Virgem Maria, nós Vos louvamos e bendizemos por este testemunho luminoso de santidade, esperança e entrega total.

Por intercessão de São João Paulo II, concedei-nos a graça de rezar esta novena com coração aberto, fé viva e desejo sincero de santidade. Que, ao contemplarmos sua vida marcada pela oração, pela cruz e pela confiança absoluta em Vós, sejamos fortalecidos na fé, renovados na esperança e animados a viver o Evangelho sem medo. Concedei-nos também as graças que necessitamos para nossa vida e salvação, conforme a Vossa santa vontade.
Amém.`,
    oracao_final: `Ó Deus de infinita bondade,
que nos destes em São João Paulo II
um pastor segundo o Vosso coração,
concedei-nos, por sua intercessão,
fé firme,
esperança viva
e coragem para viver o Evangelho sem medo.
Por Cristo, nosso Senhor.
Amém.`
  });

  upsertDia(
    jpii.id,
    1,
    "PRIMEIRO DIA – SÃO JOÃO PAULO II, CHAMADO DESDE JOVEM",
    `São João Paulo II, desde jovem Deus preparou vosso coração por meio das alegrias e das dores da vida.

Ajudai-nos a reconhecer que Deus age também através de nossas perdas, lutas e desafios.

Ensinai-nos a confiar que tudo pode ser caminho de santidade.

(Fazer o pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    jpii.id,
    2,
    "SEGUNDO DIA – SÃO JOÃO PAULO II, HOMEM DA ORAÇÃO PROFUNDA",
    `São João Paulo II, vossa força vinha da oração silenciosa e fiel diante de Deus.

Ajudai-nos a redescobrir a oração como fonte de vida. Que saibamos buscar Deus no silêncio e na fidelidade diária.

Ensinai-nos a rezar com o coração inteiro.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    jpii.id,
    3,
    "TERCEIRO DIA – SÃO JOÃO PAULO II, AMOR À EUCARISTIA",
    `São João Paulo II, a Eucaristia foi o centro de vossa vida e de vosso ministério.

Ajudai-nos a amar profundamente Jesus presente no Santíssimo Sacramento. Que a Santa Missa seja fonte de força e renovação.

Ensinai-nos a viver da Eucaristia.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    jpii.id,
    4,
    "QUARTO DIA – SÃO JOÃO PAULO II, TOTUS TUUS A MARIA",
    `São João Paulo II, entregastes toda a vossa vida à Virgem Maria com o lema “Totus Tuus”.

Ajudai-nos a confiar nossa vida à proteção materna de Maria. Que aprendamos a caminhar com Ela até Jesus.

Ensinai-nos a viver uma devoção verdadeira e filial à Mãe de Deus.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    jpii.id,
    5,
    "QUINTO DIA – SÃO JOÃO PAULO II, DEFENSOR DA VIDA E DA DIGNIDADE HUMANA",
    `São João Paulo II, levantastes vossa voz em defesa da vida, da família e da dignidade de cada pessoa humana.

Ajudai-nos a valorizar a vida desde a concepção até o fim natural. Que sejamos defensores da verdade e do amor.

Ensinai-nos a respeitar cada pessoa como imagem de Deus.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    jpii.id,
    6,
    "SEXTO DIA – SÃO JOÃO PAULO II, CORAGEM DIANTE DA CRUZ",
    `São João Paulo II, enfrentastes o sofrimento, a perseguição e a doença com fé e abandono total em Deus.

Ajudai-nos a carregar nossas cruzes com coragem. Que saibamos oferecer nossas dores como oração.

Ensinai-nos a não fugir da cruz, mas a vivê-la com esperança.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    jpii.id,
    7,
    "SÉTIMO DIA – SÃO JOÃO PAULO II, PAPA DA ESPERANÇA",
    `São João Paulo II, anunciastes ao mundo inteiro: “Não tenhais medo! Abri as portas a Cristo”.

Ajudai-nos a viver sem medo, confiando plenamente em Deus. Que nossa fé seja fonte de esperança para os outros.

Ensinai-nos a confiar no poder transformador de Cristo.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    jpii.id,
    8,
    "OITAVO DIA – SÃO JOÃO PAULO II, AMOR PELA IGREJA",
    `São João Paulo II, amastes profundamente a Igreja e servistes a ela até o último suspiro.

Ajudai-nos a amar a Igreja, mesmo em suas fragilidades. Que sejamos fiéis ao Evangelho e à comunhão.

Ensinai-nos a servir a Igreja com amor e verdade.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    jpii.id,
    9,
    "NONO DIA – ",
    `

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  //NOVENA A SÃO CARLO ACUTIS

  const acutis = upsertNovena({
    slug: makeSlug("NOVENA A SÃO CARLO ACUTIS"),
    titulo: "NOVENA A SÃO CARLO ACUTIS",
    periodo_inicio: "03/10",
    periodo_fim: "11/10",
    subtitulo: "“A Eucaristia é a minha autoestrada para o céu”",
    como_rezar: COMO_REZAR_PADRAO,
    sinal_da_cruz: SINAL_DA_CRUZ_PADRAO,
    oracao_inicial: `Ó Deus de infinita bondade, que em São Carlo Acutis nos destes um testemunho luminoso de fé vivida com alegria, simplicidade e profundo amor à Eucaristia, nós Vos louvamos e bendizemos por este jovem santo que soube unir o Céu à vida cotidiana, a tecnologia à santidade, e o amor a Cristo ao serviço dos irmãos.

Por intercessão de São Carlo Acutis, concedei-nos a graça de rezar esta novena com coração aberto, fé viva e desejo sincero de santidade. Que, ao contemplarmos sua vida tão próxima da nossa, aprendamos a amar a Eucaristia, a viver a fé com alegria e a usar tudo o que somos e temos para a glória de Deus. Concedei-nos também as graças que necessitamos para nossa vida e salvação, conforme a Vossa santa vontade.
Amém.
`,
    oracao_final: `Ó Deus de infinita misericórdia,
que nos destes em São Carlo Acutis
um testemunho jovem, alegre e atual de santidade,
concedei-nos, por sua intercessão,
amor profundo à Eucaristia,
fé viva no cotidiano
e coragem para buscar o Céu.
Por Cristo, nosso Senhor.
Amém.`
  });

  upsertDia(
    acutis.id,
    1,
    "PRIMEIRO DIA – SÃO CARLO ACUTIS, JOVEM APAIXONADO POR DEUS",
    `São Carlo Acutis, desde muito jovem colocastes Deus no centro de vossa vida, fazendo da fé o alicerce de tudo.

Ajudai-nos a colocar Deus em primeiro lugar. Que não deixemos que nada ocupe o espaço que pertence somente ao Senhor.

Ensinai-nos que a verdadeira felicidade nasce da amizade com Deus.

(Fazer o pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    acutis.id,
    2,
    "SEGUNDO DIA – SÃO CARLO ACUTIS, AMOR PROFUNDO À EUCARISTIA",
    `São Carlo Acutis, chamáveis a Eucaristia de “minha autoestrada para o Céu”.

Ajudai-nos a amar Jesus presente no Santíssimo Sacramento. Que a Santa Missa seja o centro de nossa vida.

Ensinai-nos a reconhecer que a Eucaristia é o maior milagre.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    acutis.id,
    3,
    "TERCEIRO DIA – SÃO CARLO ACUTIS, VIDA DE ORAÇÃO SIMPLES E FIEL",
    `São Carlo Acutis, vossa vida era marcada pela oração simples, constante e confiante.

Ajudai-nos a rezar com fidelidade, mesmo nas pequenas coisas. Que aprendamos a conversar com Deus todos os dias.

Ensinai-nos que a oração sustenta a vida cristã.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    acutis.id,
    4,
    "QUARTO DIA – SÃO CARLO ACUTIS, SANTIDADE NO COTIDIANO",
    `São Carlo Acutis, mostrastes que a santidade se vive na escola, em casa, entre amigos, na vida comum.

Ajudai-nos a buscar a santidade onde estamos. Que saibamos transformar o cotidiano em oferta a Deus.

Ensinai-nos que não precisamos ser extraordinários, mas fiéis.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    acutis.id,
    5,
    "QUINTO DIA – SÃO CARLO ACUTIS, TESTEMUNHA DA CARIDADE",
    `São Carlo Acutis, vosso coração era sensível aos pobres, aos sofredores e aos esquecidos.

Ajudai-nos a amar o próximo com gestos concretos. Que saibamos reconhecer Cristo nos que sofrem.

Ensinai-nos que a fé verdadeira se expressa no amor.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    acutis.id,
    6,
    "SEXTO DIA – SÃO CARLO ACUTIS, USO SANTO DOS TALENTOS",
    `São Carlo Acutis, usastes a tecnologia, a inteligência e os dons recebidos para anunciar Deus.

Ajudai-nos a usar nossos talentos para o bem. Que tudo o que fazemos seja para a glória de Deus.

Ensinai-nos que nossos dons são missão.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    acutis.id,
    7,
    "SÉTIMO DIA – SÃO CARLO ACUTIS, AMOR À IGREJA E À VIRGEM MARIA",
    `São Carlo Acutis, amastes profundamente a Igreja e cultivastes grande devoção à Virgem Maria.

Ajudai-nos a amar a Igreja com fidelidade. Que aprendamos a caminhar com Maria até Jesus.

Ensinai-nos a viver uma devoção simples e verdadeira.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    acutis.id,
    8,
    "OITAVO DIA – SÃO CARLO ACUTIS, ACEITAÇÃO DA CRUZ COM FÉ",
    `São Carlo Acutis, enfrentastes a doença e a morte com serenidade, oferecendo tudo por amor a Deus.

Ajudai-nos a aceitar nossas cruzes com fé. Que saibamos confiar em Deus mesmo na dor.

Ensinai-nos que o sofrimento oferecido gera vida eterna.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    acutis.id,
    9,
    "NONO DIA – SÃO CARLO ACUTIS, NOSSO AMIGO E INTERCESSOR NO CÉU",
    `São Carlo Acutis, acolhei esta novena que rezamos com fé, amor e confiança. Apresentai a Deus nossos pedidos, sonhos e intenções.

Intercedei por nós, especialmente pelos jovens, pelas famílias e por todos os que desejam viver a fé com alegria. Ajudai-nos a buscar a santidade sem medo, com o coração alegre e os olhos voltados para o Céu.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  //NOVENA A SÃO JUDAS TADEU

  const tadeu = upsertNovena({
    slug: makeSlug("NOVENA A SÃO JUDAS TADEU"),
    titulo: "NOVENA A SÃO JUDAS TADEU",
    periodo_inicio: "19/10",
    periodo_fim: "27/10",
    subtitulo: "A esperança sustentada pela confiança em Deus",
    como_rezar: COMO_REZAR_PADRAO,
    sinal_da_cruz: SINAL_DA_CRUZ_PADRAO,
    oracao_inicial: `Ó Deus de infinita misericórdia, que escolhestes São Judas Tadeu, apóstolo fiel e testemunha do Vosso amor, para ser sinal de esperança aos que sofrem e aos que se encontram em situações humanas aparentemente sem solução, nós Vos louvamos e bendizemos por este grande intercessor que jamais abandona os que confiam em Vós.

Por intercessão de São Judas Tadeu, concedei-nos a graça de rezar esta novena com fé viva, coração confiante e perseverança na oração. Que, ao contemplarmos sua fidelidade a Cristo e sua coragem diante das dificuldades, aprendamos a não desanimar nas provações e a confiar que, para Deus, nada é impossível. Concedei-nos também as graças que necessitamos para nossa vida e salvação, conforme a Vossa santa vontade.
Amém.`,
    oracao_final: `Ó Deus de infinita misericórdia,
que nos destes em São Judas Tadeu
um apóstolo fiel e intercessor nas causas difíceis,
concedei-nos, por sua intercessão,
esperança nas tribulações,
fé perseverante
e confiança absoluta em Vosso amor.
Por Cristo, nosso Senhor.
Amém.`
  });

  upsertDia(
    tadeu.id,
    1,
    "PRIMEIRO DIA – SÃO JUDAS TADEU, CHAMADO POR JESUS",
    `São Judas Tadeu, fostes escolhido por Jesus para fazer parte do grupo dos Doze e anunciar o Reino de Deus.

Ajudai-nos a recordar que também somos chamados por Cristo. Que levemos a sério nossa vocação cristã.

Ensinai-nos a responder com fidelidade ao chamado de Deus.

(Fazer o pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    tadeu.id,
    2,
    "SEGUNDO DIA – SÃO JUDAS TADEU, AMIGO FIEL DE CRISTO",
    `São Judas Tadeu, permanecestes fiel a Jesus mesmo quando muitos O abandonaram.

Ajudai-nos a permanecer fiéis a Cristo nas dificuldades. Que não nos afastemos de Deus nos momentos de prova.

Ensinai-nos a amar Jesus com perseverança.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    tadeu.id,
    3,
    "TERCEIRO DIA – SÃO JUDAS TADEU, TESTEMUNHA DA ESPERANÇA",
    `São Judas Tadeu, sois conhecido como o santo das causas impossíveis, sinal de esperança para os aflitos.

Ajudai-nos a não perder a esperança quando tudo parece sem saída. Que aprendamos a confiar no poder de Deus.

Ensinai-nos a esperar contra toda esperança.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    tadeu.id,
    4,
    "QUARTO DIA – SÃO JUDAS TADEU, CORAGEM NA MISSÃO",
    `São Judas Tadeu, anunciastes o Evangelho com coragem, enfrentando perseguições e sofrimentos.

Ajudai-nos a testemunhar nossa fé sem medo. Que não tenhamos vergonha do Evangelho.

Ensinai-nos a viver com coragem cristã.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    tadeu.id,
    5,
    "QUINTO DIA – SÃO JUDAS TADEU, FÉ PROVADA NA DIFICULDADE",
    `São Judas Tadeu, enfrentastes desafios e perigos confiando totalmente em Deus.

Ajudai-nos a manter a fé nas tribulações. Que saibamos transformar a dor em oração.

Ensinai-nos a confiar mesmo quando não compreendemos.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    tadeu.id,
    6,
    "SEXTO DIA – SÃO JUDAS TADEU, INTERCESSOR PODEROSO",
    `São Judas Tadeu, muitos recorrem a vós nas situações mais difíceis e urgentes.

Intercedei por nós junto a Deus. Apresentai nossas causas impossíveis, nossos medos e angústias.

Ensinai-nos a confiar na intercessão dos santos.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    tadeu.id,
    7,
    "SÉTIMO DIA – SÃO JUDAS TADEU, CONFIANÇA NA MISERICÓRDIA",
    `São Judas Tadeu, proclamastes a misericórdia de Deus que nunca abandona seus filhos.

Ajudai-nos a confiar na misericórdia divina. Que nunca pensemos que Deus se esqueceu de nós.

Ensinai-nos a lançar-nos nos braços do Pai.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    tadeu.id,
    8,
    "OITAVO DIA – SÃO JUDAS TADEU, PERSEVERANÇA ATÉ O FIM",
    `São Judas Tadeu, permanecestes fiel até o martírio, entregando vossa vida por Cristo.

Ajudai-nos a perseverar na fé até o fim. Que sejamos firmes mesmo nas dificuldades.

Ensinai-nos a viver com fidelidade e amor.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    tadeu.id,
    9,
    "NONO DIA – SÃO JUDAS TADEU, NOSSA ESPERANÇA EM DEUS",
    `São Judas Tadeu, acolhei esta novena que rezamos com fé e confiança. Apresentai a Deus nossos pedidos, especialmente aqueles que parecem impossíveis.

Intercedei por nossa vida, por nossas famílias e por nossa perseverança na fé. Ajudai-nos a confiar que Deus sempre age, mesmo quando não vemos o caminho.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  //NOVENA DAS ALMAS DO PURGATÓRIO.

  const almas = upsertNovena({
    slug: makeSlug("NOVENA DAS ALMAS DO PURGATÓRIO"),
    titulo: "NOVENA DAS ALMAS DO PURGATÓRIO",
    periodo_inicio: "24/10",
    periodo_fim: "01/11",
    subtitulo: "A esperança não decepciona aqueles que aguardam no Senhor",
    como_rezar: COMO_REZAR_PADRAO,
    sinal_da_cruz: SINAL_DA_CRUZ_PADRAO,
    oracao_inicial: `Ó Deus de infinita misericórdia, que amais todas as almas criadas por Vós e desejais que nenhuma se perca, nós Vos louvamos e bendizemos pelo dom da redenção e pela esperança da vida eterna. Em Vosso amor, permitis que as almas que partiram deste mundo sejam purificadas para entrar na plenitude da Vossa presença.

Recebei, Senhor, esta novena que oferecemos em sufrágio pelas almas do Purgatório. Concedei-nos a graça de rezar com coração compassivo, espírito de caridade e fé viva. Que nossas orações, sacrifícios e ofertas alcancem alívio às almas sofredoras e apressam o momento em que poderão contemplar Vosso rosto. E que, ao intercedermos por elas, sejamos também purificados e conduzidos no caminho da santidade.
Amém.`,
    oracao_final: `Ó Deus de infinita misericórdia,
concedei às almas do Purgatório
o descanso eterno
e fazei brilhar sobre elas a Vossa luz.
Que, livres de toda mancha,
possam louvar-Vos para sempre
na alegria do Céu.
Por Cristo, nosso Senhor.
Amém.`
  });

  upsertDia(
    almas.id,
    1,
    "PRIMEIRO DIA – AS ALMAS DO PURGATÓRIO, AMADAS POR DEUS",
    `Ó almas santas do Purgatório, sois profundamente amadas por Deus e destinadas à glória eterna.

Ajudai-nos a recordar que a vida não termina aqui. Que vivamos com os olhos voltados para o Céu.

Senhor, tende misericórdia das almas que mais sofrem.

(Fazer o pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    almas.id,
    2,
    "SEGUNDO DIA – AS ALMAS DO PURGATÓRIO, PURIFICADAS NO AMOR",
    `Ó almas benditas, estais sendo purificadas para entrar na presença santa de Deus.

Ensinai-nos a aceitar a purificação já nesta vida, por meio da conversão e do amor.

Senhor, alivai as dores das almas que mais necessitam.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    almas.id,
    3,
    "TERCEIRO DIA – AS ALMAS DO PURGATÓRIO, SEDENTAS DE DEUS",
    `Ó almas santas, vosso maior desejo é contemplar a Deus face a face.

Despertai em nós o desejo do Céu. Que não nos apeguemos excessivamente às coisas passageiras.

Senhor, apressai o encontro dessas almas convosco.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    almas.id,
    4,
    "QUARTO DIA – AS ALMAS DO PURGATÓRIO, SOCORRIDAS PELA ORAÇÃO",
    `Ó almas benditas, não podeis mais merecer, mas dependeis de nossas orações.

Ajudai-nos a compreender o valor da oração pelos falecidos. Que sejamos fiéis nessa obra de misericórdia.

Senhor, recebei nossas orações como alívio para essas almas.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    almas.id,
    5,
    "QUINTO DIA – AS ALMAS DO PURGATÓRIO, ESQUECIDAS PELOS VIVOS",
    `Ó almas santas, muitas vezes sois esquecidas pelos que ainda vivem na terra.

Despertai em nós um coração atento e caridoso. Que nunca nos esqueçamos de rezar por vós.

Senhor, socorrei especialmente as almas mais abandonadas.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    almas.id,
    6,
    "SEXTO DIA – AS ALMAS DO PURGATÓRIO, UNIDAS À CRUZ DE CRISTO",
    `Ó almas benditas, vossas dores estão unidas ao sacrifício redentor de Cristo.

Ajudai-nos a oferecer nossos sofrimentos por amor a Deus e pelas almas.

Senhor, aplicai os méritos da cruz às almas que sofrem no Purgatório.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    almas.id,
    7,
    "SÉTIMO DIA – AS ALMAS DO PURGATÓRIO, ESPERANÇA DA GLÓRIA",
    `Ó almas santas, viveis na esperança certa da glória eterna.

Ensinai-nos a esperar com paciência e fé. Que não desanimemos nas provações da vida.

Senhor, fortalecei a esperança das almas que aguardam Vossa luz.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    almas.id,
    8,
    "OITAVO DIA – AS ALMAS DO PURGATÓRIO, GRATIDÃO PELAS ORAÇÕES",
    `Ó almas benditas, sois profundamente gratas por cada oração oferecida por vós.

Ajudai-nos a compreender que nenhuma oração é inútil aos olhos de Deus.

Senhor, acolhei com amor cada sufrágio oferecido.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    almas.id,
    9,
    "NONO DIA – AS ALMAS DO PURGATÓRIO, INTERCESSORAS NO CÉU",
    `Ó almas santas, quando chegardes à glória do Céu, lembrai-vos de nós diante de Deus.

Recebei esta novena como expressão de nosso amor e caridade. Que nossas orações vos conduzam rapidamente à luz eterna.

Senhor, concedei o descanso eterno às almas do Purgatório.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  // NOVENA DE SÃO MIGUEL ARCANJO

  const miguel = upsertNovena({
    slug: makeSlug("NOVENA DE SÃO MIGUEL ARCANJO"),
    titulo: "NOVENA DE SÃO MIGUEL ARCANJO",
    periodo_inicio: "20/09",
    periodo_fim: "28/09",
    subtitulo: "Príncipe das milícias celestes",
    como_rezar: COMO_REZAR_PADRAO,
    sinal_da_cruz: SINAL_DA_CRUZ_PADRAO,
    oracao_inicial: `Ó Deus todo-poderoso e eterno, que constituístes São Miguel Arcanjo como príncipe das milícias celestes e defensor do Vosso povo contra as forças do mal, nós Vos louvamos e bendizemos por este poderoso protetor que jamais abandona os que confiam em Vós.

Por intercessão de São Miguel Arcanjo, concedei-nos a graça de rezar esta novena com fé vigilante, coração firme e espírito confiante. Que, sustentados por sua proteção, sejamos fortalecidos no combate espiritual, livres das ciladas do inimigo e conduzidos no caminho da verdade, da justiça e da paz. Concedei-nos também as graças que necessitamos para nossa vida e salvação, conforme a Vossa santa vontade.
Amém.`,
    oracao_final: `São Miguel Arcanjo,
defendei-nos no combate.
Sede nosso auxílio contra as maldades
e ciladas do demônio.
Que Deus manifeste sobre ele o Seu poder,
nós Vos suplicamos.
E vós, príncipe da milícia celeste,
pelo poder divino,
precipitai no inferno a Satanás
e aos outros espíritos malignos
que andam pelo mundo
para perder as almas.
Amém.`
  });

  upsertDia(
    miguel.id,
    1,
    "PRIMEIRO DIA – SÃO MIGUEL ARCANJO, DEFENSOR DA GLÓRIA DE DEUS",
    `São Miguel Arcanjo, vosso nome proclama: “Quem como Deus?”

Ajudai-nos a colocar Deus acima de tudo. Que rejeitemos tudo o que tenta ocupar o lugar que pertence somente ao Senhor.

Ensinai-nos a viver para a glória de Deus.

(Fazer o pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    miguel.id,
    2,
    "SEGUNDO DIA – SÃO MIGUEL ARCANJO, GUERREIRO DO CÉU",
    `São Miguel Arcanjo, fostes escolhido para combater e vencer as forças do mal.

Defendei-nos nas lutas espirituais. Protegei-nos das tentações, dos enganos e de todo mal visível ou invisível.

Ensinai-nos a confiar no poder de Deus que vence todo mal.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    miguel.id,
    3,
    "TERCEIRO DIA – SÃO MIGUEL ARCANJO, PROTETOR DO POVO DE DEUS",
    `São Miguel Arcanjo, fostes enviado para proteger o povo fiel do Senhor.

Guardai nossas famílias, nossas casas e nossos caminhos. Livrai-nos dos perigos do corpo e da alma.

Ensinai-nos a viver sob a proteção do Céu.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    miguel.id,
    4,
    "QUARTO DIA – SÃO MIGUEL ARCANJO, FIDELIDADE SEM RESERVAS",
    `São Miguel Arcanjo, permanecestes fiel a Deus desde o princípio, sem hesitação nem orgulho.

Ajudai-nos a viver a fidelidade a Deus em todas as circunstâncias. Que não sejamos vencidos pelo pecado nem pela dúvida.

Ensinai-nos a escolher Deus todos os dias.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    miguel.id,
    5,
    "QUINTO DIA – SÃO MIGUEL ARCANJO, LUZ NA ESCURIDÃO",
    `São Miguel Arcanjo, fostes luz contra as trevas e verdade contra a mentira.

Iluminai nossas decisões e pensamentos. Ajudai-nos a discernir o bem do mal.

Ensinai-nos a caminhar sempre na verdade.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    miguel.id,
    6,
    "SEXTO DIA – SÃO MIGUEL ARCANJO, DEFESA CONTRA AS TENTAÇÕES",
    `São Miguel Arcanjo, defensor poderoso nas horas de provação.

Afastai de nós as tentações que nos afastam de Deus. Fortalecei-nos quando somos fracos.

Ensinai-nos a recorrer ao Céu no momento da luta.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    miguel.id,
    7,
    "SÉTIMO DIA – SÃO MIGUEL ARCANJO, GUARDA DAS ALMAS",
    `São Miguel Arcanjo, sois guardião das almas que pertencem a Deus.

Protegei nossa alma do pecado mortal. Ajudai-nos a viver na graça de Deus.

Ensinai-nos a valorizar a salvação eterna.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    miguel.id,
    8,
    "OITAVO DIA – SÃO MIGUEL ARCANJO, AUXÍLIO NA HORA DA MORTE",
    `São Miguel Arcanjo, estai presente na hora de nossa morte, conduzindo-nos à presença de Deus.

Ajudai-nos a viver preparados para a eternidade. Que nossa vida seja vivida em vigilância e fé.

Ensinai-nos a esperar com confiança o encontro com Deus.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    miguel.id,
    9,
    "NONO DIA – SÃO MIGUEL ARCANJO, NOSSO PODEROSO INTERCESSOR",
    `São Miguel Arcanjo, acolhei esta novena que rezamos com fé e confiança. Apresentai a Deus nossos pedidos, intenções e agradecimentos.

Defendei-nos no combate espiritual, protegei-nos em vida e conduzi-nos, um dia, à alegria eterna do Céu.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );
  
  const espiritosanto = upsertNovena({
    slug: makeSlug("NOVENA AO DIVINO ESPÍRITO SANTO"),
    titulo: "NOVENA AO DIVINO ESPÍRITO SANTO",
    periodo_inicio: "sexta-feira após a Ascensão do Senhor",
    periodo_fim: "sábado antes de Pentecostes",
    subtitulo: "Vinde, Espírito Santo, enchei os corações dos vossos fiéis e acendei neles o fogo do vosso amor",
    como_rezar: COMO_REZAR_PADRAO,
    sinal_da_cruz: SINAL_DA_CRUZ_PADRAO,
    oracao_inicial: `Ó Divino Espírito Santo,
amor eterno do Pai e do Filho,
alma da Igreja e fonte de toda santidade,
nós Vos adoramos, louvamos e bendizemos.

Vinde, Espírito Santo, e enchei os nossos corações.
Iluminai nossa mente, fortalecei nossa vontade e inflamai nosso coração com o Vosso amor.
Afastai de nós tudo o que nos impede de ouvir a voz de Deus e conduzi-nos pelo caminho da verdade, da paz e da santidade.

Concedei-nos a graça de rezar esta novena com coração dócil, espírito aberto e sincero desejo de conversão. Derramai sobre nós Vossos dons e frutos, e concedei-nos, se for da vontade de Deus, as graças que necessitamos para nossa vida e salvação.
Amém.`,
    oracao_final: `Vinde, Espírito Santo,
enchei os corações dos Vossos fiéis
e acendei neles o fogo do Vosso amor.

Enviai o Vosso Espírito
e tudo será criado,
e renovareis a face da terra.

Ó Deus, que instruístes os corações dos fiéis
com a luz do Espírito Santo,
fazei que apreciemos retamente todas as coisas
segundo o mesmo Espírito
e gozemos sempre de Sua consolação.
Por Cristo, nosso Senhor.
Amém.`
  });

  upsertDia(
    espiritosanto.id,
    1,
    "PRIMEIRO DIA – DIVINO ESPÍRITO SANTO, LUZ DA ALMA",
    `Vinde, Espírito Santo, luz divina que ilumina toda escuridão.

Iluminai nossa mente e nosso coração. Ajudai-nos a enxergar nossa vida à luz de Deus e a reconhecer o caminho que devemos seguir.

Livrai-nos da confusão, da dúvida e do erro.

(Fazer o pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    espiritosanto.id,
    2,
    "SEGUNDO DIA – DIVINO ESPÍRITO SANTO, FOGO DE AMOR",
    `Vinde, Espírito Santo, fogo que aquece os corações frios e renova os cansados.

Inflamai nosso coração com o amor de Deus. Curai nossa indiferença espiritual e renovai nosso desejo de amar.

Que nosso amor seja sincero e fiel.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    espiritosanto.id,
    3,
    "TERCEIRO DIA – DIVINO ESPÍRITO SANTO, DOADOR DOS DONS",
    `Vinde, Espírito Santo, e derramai sobre nós Vossos santos dons.

Concedei-nos sabedoria, entendimento, conselho, fortaleza, ciência, piedade e temor de Deus. Que esses dons nos conduzam à santidade.

Ajudai-nos a viver segundo a vontade do Pai.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    espiritosanto.id,
    4,
    "QUARTO DIA – DIVINO ESPÍRITO SANTO, MESTRE INTERIOR",
    `Vinde, Espírito Santo, mestre da verdade e guia seguro das almas.

Ensinai-nos a ouvir a voz de Deus no silêncio do coração. Ajudai-nos a discernir o bem e a rejeitar o mal.

Que sejamos dóceis à Vossa ação.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    espiritosanto.id,
    5,
    "QUINTO DIA – DIVINO ESPÍRITO SANTO, CONSOLADOR DOS AFLITOS",
    `Vinde, Espírito Santo, doce consolador das almas feridas.

Consolai os corações aflitos, curai as feridas da alma e fortalecei os que sofrem.

Derramai sobre nós a paz que vem de Deus.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    espiritosanto.id,
    6,
    "SEXTO DIA – DIVINO ESPÍRITO SANTO, FORÇA NA FRAQUEZA",
    `Vinde, Espírito Santo, força dos fracos e auxílio dos que lutam.

Sustentai-nos nas tentações, nas quedas e nos momentos de desânimo. Dai-nos fortaleza para perseverar no bem.

Que nunca desistamos de buscar a santidade.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    espiritosanto.id,
    7,
    "SÉTIMO DIA – DIVINO ESPÍRITO SANTO, FONTE DE UNIDADE",
    `Vinde, Espírito Santo, e renovai a face da Igreja.

Concedei-nos espírito de comunhão, humildade e amor fraterno. Curai as divisões e fortalecei os laços de unidade.

Fazei-nos instrumentos de paz.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    espiritosanto.id,
    8,
    "OITAVO DIA – DIVINO ESPÍRITO SANTO, SANTIFICADOR DAS ALMAS",
    `Vinde, Espírito Santo, e santificai-nos.

Purificai nosso coração de todo pecado e desordem. Ajudai-nos a crescer na graça e na fidelidade a Deus.

Que nossa vida seja um louvor ao Senhor.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    espiritosanto.id,
    9,
    "NONO DIA – DIVINO ESPÍRITO SANTO, ENVIO EM MISSÃO",
    `Vinde, Espírito Santo, e fazei de nós testemunhas vivas do Evangelho.

Concedei-nos coragem para anunciar a fé, viver o amor e servir com alegria. Enviai-nos como instrumentos da Vossa graça no mundo.

Que tudo o que fizermos seja para a glória de Deus.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  //NOVENA AO SAGRADO CORAÇÃO DE JESUS

  const scj = upsertNovena({
    slug: makeSlug("NOVENA AO SAGRADO CORAÇÃO DE JESUS"),
    titulo: "NOVENA AO SAGRADO CORAÇÃO DE JESUS",
    periodo_inicio: "quarta-feira após a Solenidade de Corpus Christi",
    periodo_fim: "quinta-feira seguinte",
    subtitulo: "Manso e humilde de coração, fazei nosso coração semelhante ao Vosso",
    como_rezar: COMO_REZAR_PADRAO,
    sinal_da_cruz: SINAL_DA_CRUZ_PADRAO,
    oracao_inicial: `Ó Jesus Cristo, Filho amado do Pai, que nos revelastes no Vosso Sagrado Coração o amor infinito de Deus pelos homens, nós Vos adoramos, louvamos e bendizemos. Vosso Coração, manso e humilde, foi aberto na cruz como fonte de misericórdia, perdão e vida nova para toda a humanidade.

Nós nos aproximamos de Vós com confiança, trazendo nossas alegrias, dores, pecados e esperanças. Concedei-nos a graça de rezar esta novena com coração sincero, espírito humilde e desejo verdadeiro de conversão. Que, ao contemplarmos Vosso Sagrado Coração, aprendamos a amar como Vós amais, a perdoar como Vós perdoais e a confiar sem reservas no amor do Pai. Concedei-nos também, se for de Vossa vontade, as graças que necessitamos para nossa vida e salvação.
Amém.`,
    oracao_final: `Sagrado Coração de Jesus,
em Vós confio.
Fazei meu coração semelhante ao Vosso,
manso, humilde e cheio de amor.
Recebei minha vida,
minhas lutas e minhas esperanças,
e conduzi-me sempre no caminho da salvação.
Amém.`
  });

  upsertDia(
    scj.id,
    1,
    "PRIMEIRO DIA – SAGRADO CORAÇÃO DE JESUS, AMOR INFINITO DO PAI",
    `Sagrado Coração de Jesus, sois a revelação viva do amor do Pai por nós.

Ajudai-nos a acreditar no amor de Deus, mesmo quando nos sentimos indignos ou feridos. Que jamais duvidemos de Vosso amor.

Ensinai-nos a descansar no amor do Pai.

(Fazer o pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    scj.id,
    2,
    "SEGUNDO DIA – SAGRADO CORAÇÃO DE JESUS, MANSO E HUMILDE",
    `Coração manso e humilde de Jesus, ensinai-nos a aprender de Vós.

Ajudai-nos a vencer o orgulho, a dureza e a impaciência. Dai-nos um coração semelhante ao Vosso.

Formai em nós a humildade verdadeira.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    scj.id,
    3,
    "TERCEIRO DIA – SAGRADO CORAÇÃO DE JESUS, FONTE DE MISERICÓRDIA",
    `Sagrado Coração de Jesus, de Vós brota misericórdia sem limites.

Perdoai nossos pecados e curai nossas feridas interiores. Ajudai-nos a confiar na Vossa misericórdia.

Ensinai-nos a ser misericordiosos com os outros.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    scj.id,
    4,
    "QUARTO DIA – SAGRADO CORAÇÃO DE JESUS, AMOR FERIDO E REJEITADO",
    `Sagrado Coração de Jesus, tantas vezes sois ferido pela indiferença e pelo pecado.

Aceitai nossa oração como ato de reparação. Ajudai-nos a consolar Vosso Coração com nossa fidelidade.

Ensinai-nos a amar quando não somos amados.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    scj.id,
    5,
    "QUINTO DIA – SAGRADO CORAÇÃO DE JESUS, OBEDIÊNCIA AO PAI",
    `Sagrado Coração de Jesus, vivestes inteiramente unido à vontade do Pai.

Ajudai-nos a aceitar a vontade de Deus, mesmo quando ela nos custa. Que aprendamos a dizer “sim” com confiança.

Ensinai-nos a viver na obediência amorosa.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    scj.id,
    6,
    "SEXTO DIA – SAGRADO CORAÇÃO DE JESUS, FONTE DE PAZ",
    `Sagrado Coração de Jesus, sois nossa paz verdadeira.

Acalmai nossas inquietações, curai nossas ansiedades e devolvei-nos a serenidade interior.

Ensinai-nos a confiar em Vós em todas as circunstâncias.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    scj.id,
    7,
    "SÉTIMO DIA – SAGRADO CORAÇÃO DE JESUS, AMOR QUE SE ENTREGA NA CRUZ",
    `Sagrado Coração de Jesus, Vosso amor se revelou plenamente na cruz.

Ajudai-nos a compreender o valor do sacrifício. Que saibamos oferecer nossas dores unidas às Vossas.

Ensinai-nos a amar até o fim.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    scj.id,
    8,
    "OITAVO DIA – SAGRADO CORAÇÃO DE JESUS, MORADA DOS QUE CONFIAM",
    `Sagrado Coração de Jesus, sois refúgio seguro para todos os que confiam em Vós.

Acolhei-nos em Vosso Coração. Guardai-nos nas provações e fortalecei nossa fé.

Ensinai-nos a viver sempre unidos a Vós.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    scj.id,
    9,
    "NONO DIA – SAGRADO CORAÇÃO DE JESUS, REI E CENTRO DE NOSSAS VIDAS",
    `Sagrado Coração de Jesus, acolhei esta novena que rezamos com amor e confiança.

Reinai em nosso coração, em nossas famílias e em nossa vida. Fazei de nós instrumentos do Vosso amor no mundo.

Concedei-nos perseverança na fé e fidelidade até o fim.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  // NOVENA À SAGRADA FAMÍLIA

  const familia = upsertNovena({
    slug: makeSlug("NOVENA À SAGRADA FAMÍLIA"),
    titulo: "NOVENA À SAGRADA FAMÍLIA",
    subtitulo: "Jesus, Maria e José, minha família vossa é",
    como_rezar: COMO_REZAR_PADRAO,
    sinal_da_cruz: SINAL_DA_CRUZ_PADRAO,
    oracao_inicial: `Ó Jesus, Maria e José, Sagrada Família de Nazaré, modelo perfeito de amor, união e fidelidade a Deus, nós nos aproximamos de vós com confiança e coração aberto. Em vossa casa simples, Deus foi amado, servido e obedecido em todas as coisas, transformando a vida cotidiana em caminho de santidade.

Acolhei-nos em vosso lar. Ensinai-nos a viver o amor verdadeiro, a paciência nas dificuldades, a fé nas provações e a esperança nas incertezas. Concedei-nos a graça de rezar esta novena com espírito humilde e desejo sincero de conversão. Abençoai nossas famílias, nosso trabalho e nosso caminho, e alcançai-nos, se for da vontade de Deus, as graças que necessitamos para nossa vida e salvação.
Amém.`,
    oracao_final: `Jesus, Maria e José,
Sagrada Família de Nazaré,
protegei nossas famílias.
Ajudai-nos a viver unidos no amor,
firmes na fé
e confiantes na providência de Deus.
Fazei de nossos lares
lugares de paz, oração e esperança.
Amém.`
  });

  upsertDia(
    familia.id,
    1,
    "PRIMEIRO DIA – SAGRADA FAMÍLIA, CASA ONDE DEUS HABITA",
    `Sagrada Família de Nazaré, vossa casa foi morada viva de Deus entre os homens.

Ajudai-nos a fazer de nossa casa um lugar onde Deus é amado e respeitado. Que nossos lares sejam espaços de fé, oração e paz.

Ensinai-nos a acolher Deus em nossa vida diária.

(Fazer o pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    familia.id,
    2,
    "SEGUNDO DIA – JESUS, FILHO OBEDIENTE",
    `Jesus, em Nazaré vivestes submisso a Maria e José, santificando a obediência e o amor filial.

Ajudai-nos a viver a obediência com amor. Que saibamos respeitar, escutar e servir uns aos outros.

Ensinai-nos a obedecer por amor, e não por medo.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    familia.id,
    3,
    "TERCEIRO DIA – MARIA, MÃE ATENTA E AMOROSA",
    `Maria Santíssima, em silêncio e ternura cuidastes de Jesus e de José, guardando tudo em vosso coração.

Ajudai-nos a amar com paciência e delicadeza. Que saibamos escutar mais e julgar menos.

Ensinai-nos a amar como mãe, mesmo quando é difícil.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    familia.id,
    4,
    "QUARTO DIA – SÃO JOSÉ, PAI JUSTO E PROTETOR",
    `São José, fostes o guardião fiel da Sagrada Família, trabalhador honesto e homem de fé silenciosa.

Protegei nossas famílias. Ajudai-nos a viver a responsabilidade, o trabalho digno e a confiança em Deus.

Ensinai-nos a servir sem buscar reconhecimento.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    familia.id,
    5,
    "QUINTO DIA – SAGRADA FAMÍLIA, UNIÃO NO AMOR",
    `Sagrada Família, vivestes unida no amor, mesmo em meio às dificuldades, viagens e incertezas.

Ajudai-nos a fortalecer a união em nossas famílias. Que saibamos perdoar, dialogar e recomeçar sempre.

Ensinai-nos que o amor se constrói dia após dia.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    familia.id,
    6,
    "SEXTO DIA – SAGRADA FAMÍLIA, FÉ NAS PROVAÇÕES",
    `Jesus, Maria e José, enfrentastes perseguições, pobreza e insegurança confiando sempre em Deus.

Ajudai-nos a confiar em Deus nas dificuldades familiares. Que não percamos a fé nas crises e provações.

Ensinai-nos a esperar mesmo quando tudo parece incerto.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    familia.id,
    7,
    "SÉTIMO DIA – SAGRADA FAMÍLIA, VIDA SIMPLES E SANTA",
    `Sagrada Família de Nazaré, santificastes a vida simples e o trabalho cotidiano.

Ajudai-nos a encontrar Deus nas tarefas diárias. Que aprendamos a viver a santidade no comum da vida.

Ensinai-nos que a santidade nasce da fidelidade diária.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    familia.id,
    8,
    "OITAVO DIA – SAGRADA FAMÍLIA, ESCOLA DE AMOR E PERDÃO",
    `Jesus, Maria e José, em vosso lar reinaram o amor, a compreensão e o perdão.

Ajudai-nos a perdoar em nossas famílias. Que saibamos recomeçar mesmo após as feridas.

Ensinai-nos a amar como Deus ama.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    familia.id,
    9,
    "NONO DIA – SAGRADA FAMÍLIA, BÊNÇÃO PARA TODAS AS FAMÍLIAS",
    `Sagrada Família de Nazaré, acolhei esta novena que rezamos com amor e confiança.

Abençoai nossas famílias, nossos lares e nossas relações. Guardai-nos na fé, na esperança e no amor.

Fazei de nossas famílias reflexo do amor de Deus no mundo.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

 // NOVENA DE PENTECOSTES

const pentecostes = upsertNovena({
    slug: makeSlug("NOVENA DE PENTECOSTES"),
    titulo: "NOVENA DE PENTECOSTES",
    periodo_inicio: "sexta-feira após a Solenidade da Ascensão do Senhor",
    periodo_fim: "sábado antes de Pentecostes",
    subtitulo: "Vinde, Espírito Santo",
    como_rezar: COMO_REZAR_PADRAO,
    sinal_da_cruz: SINAL_DA_CRUZ_PADRAO,
    oracao_inicial: `Ó Deus Pai todo-poderoso, que após a Ressurreição de Vosso Filho enviastes o Espírito Santo sobre Maria e os Apóstolos reunidos em oração, nós Vos louvamos e bendizemos por este dom precioso que renova a face da terra e transforma os corações.

Nós nos colocamos hoje no Cenáculo, unidos a Maria, esperando com fé a efusão do Espírito Santo. Abri nosso coração para receber Sua ação, purificai nossa vida, fortalecei nossa fé e renovai nossa esperança. Concedei-nos a graça de rezar esta novena com perseverança e coração dócil, para que sejamos renovados interiormente e enviados como testemunhas do Evangelho. Concedei-nos também, se for de Vossa vontade, as graças que necessitamos para nossa vida e salvação.
Amém.`,
    oracao_final: `Vinde, Espírito Santo,
enchei os corações dos Vossos fiéis
e acendei neles o fogo do Vosso amor.

Enviai o Vosso Espírito
e tudo será criado,
e renovareis a face da terra.

Ó Deus, que instruístes os corações dos fiéis
com a luz do Espírito Santo,
fazei que apreciemos retamente todas as coisas
segundo o mesmo Espírito
e gozemos sempre de Sua consolação.
Por Cristo, nosso Senhor.
Amém.`
  });

  upsertDia(
    pentecostes.id,
    1,
    "PRIMEIRO DIA – PENTECOSTES, PROMESSA DO PAI",
    `Espírito Santo, fostes prometido por Jesus como dom do Pai para fortalecer Seus discípulos.

Ajudai-nos a confiar nas promessas de Deus. Que aprendamos a esperar com fé, mesmo quando não vemos imediatamente os frutos.

Ensinai-nos a perseverar na oração.

(Fazer o pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    pentecostes.id,
    2,
    "SEGUNDO DIA – PENTECOSTES, ESPÍRITO DE UNIDADE",
    `Espírito Santo, reunistes os discípulos em um só coração e uma só alma.

Curai as divisões em nossa vida, em nossa família e na Igreja. Concedei-nos espírito de comunhão e amor fraterno.

Ensinai-nos a viver unidos em Deus.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    pentecostes.id,
    3,
    "TERCEIRO DIA – PENTECOSTES, FOGO QUE TRANSFORMA",
    `Espírito Santo, descestes como línguas de fogo sobre os Apóstolos.

Inflamai nosso coração com o Vosso amor. Queimais em nós tudo o que não vem de Deus e renovai nossa vida interior.

Ensinai-nos a viver com fervor espiritual.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    pentecostes.id,
    4,
    "QUARTO DIA – PENTECOSTES, LUZ QUE ILUMINA",
    `Espírito Santo, sois luz que dissipa as trevas e conduz à verdade.

Iluminai nossa mente e nossas decisões. Ajudai-nos a discernir a vontade de Deus em nossa vida.

Ensinai-nos a caminhar na verdade.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    pentecostes.id,
    5,
    "QUINTO DIA – PENTECOSTES, CORAGEM NA MISSÃO",
    `Espírito Santo, transformastes discípulos medrosos em testemunhas corajosas.

Dai-nos coragem para viver e anunciar a fé. Que não tenhamos medo de testemunhar o Evangelho.

Ensinai-nos a confiar no poder de Deus que age em nós.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    pentecostes.id,
    6,
    "SEXTO DIA – PENTECOSTES, DOM DOS CARISMAS",
    `Espírito Santo, distribuís dons e carismas para a edificação da Igreja.

Ajudai-nos a reconhecer e usar bem os dons que recebemos. Que coloquemos tudo a serviço do bem.

Ensinai-nos a servir com humildade e amor.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    pentecostes.id,
    7,
    "SÉTIMO DIA – PENTECOSTES, ESPÍRITO QUE CONSOLA",
    `Espírito Santo, sois o Consolador prometido por Jesus.

Consolai os corações aflitos, curai as feridas da alma e fortalecei os que sofrem.

Ensinai-nos a confiar na presença de Deus em todas as circunstâncias.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    pentecostes.id,
    8,
    "OITAVO DIA – PENTECOSTES, SANTIFICADOR DAS ALMAS",
    `Espírito Santo, sois Aquele que santifica e renova os corações.

Purificai nossa vida de todo pecado. Ajudai-nos a crescer na graça e na santidade.

Ensinai-nos a desejar a santidade com sinceridade.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    pentecostes.id,
    9,
    "NONO DIA – PENTECOSTES, IGREJA EM MISSÃO",
    `Espírito Santo, no dia de Pentecostes nasceu a Igreja missionária.

Acolhei esta novena que rezamos com fé e confiança. Renovai nossa vida e enviai-nos como discípulos missionários.

Que sejamos instrumentos do Vosso amor no mundo.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  // NOVENA DE SANTO EXPEDITO

const expedito = upsertNovena({
    slug: makeSlug("NOVENA DE SANTO EXPEDITO"),
    titulo: "NOVENA DE SANTO EXPEDITO",
    periodo_inicio: "10/04",
    periodo_fim: "18/04",
    subtitulo: "Intercessor nas causas justas e urgentes",
    como_rezar: COMO_REZAR_PADRAO,
    sinal_da_cruz: SINAL_DA_CRUZ_PADRAO,
    oracao_inicial: `Ó Deus todo-poderoso e misericordioso, que fortalecestes Santo Expedito com coragem, fidelidade e prontidão para seguir Cristo até o martírio, nós Vos louvamos e bendizemos por este santo que nos ensina a não adiar nossa conversão nem nossa resposta ao Vosso chamado.

Por intercessão de Santo Expedito, concedei-nos a graça de rezar esta novena com fé confiante, coração decidido e esperança viva. Ajudai-nos a enfrentar com coragem as situações difíceis, urgentes e aparentemente sem solução. Que, sustentados pela vossa graça, saibamos agir no tempo certo, confiando plenamente na Vossa providência. Concedei-nos também, se for da Vossa vontade, as graças que necessitamos para nossa vida e salvação.
Amém.`,
    oracao_final: `Santo Expedito,
mártir fiel de Cristo,
intercedei por nós nas causas urgentes.
Ajudai-nos a não adiar nossa conversão,
a confiar na providência de Deus
e a agir com fé e coragem.
Amém.
`
  });

  upsertDia(
    expedito.id,
    1,
    "PRIMEIRO DIA – SANTO EXPEDITO, CHAMADO À CONVERSÃO IMEDIATA",
    `Santo Expedito, ouvistes o chamado de Deus e não adiastes vossa resposta.

Ajudai-nos a não postergar nossa conversão. Que saibamos dizer “sim” a Deus hoje, sem desculpas nem adiamentos.

Ensinai-nos que o tempo de Deus é agora.

(Fazer o pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    expedito.id,
    2,
    "SEGUNDO DIA – SANTO EXPEDITO, CORAGEM NA DECISÃO",
    `Santo Expedito, escolhestes Cristo com firmeza, mesmo diante das dificuldades.

Ajudai-nos a tomar decisões corretas, guiadas pela fé e não pelo medo.

Ensinai-nos a confiar em Deus quando precisamos escolher.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    expedito.id,
    3,
    "TERCEIRO DIA – SANTO EXPEDITO, FIDELIDADE SEM RETORNO",
    `Santo Expedito, não olhastes para trás depois de escolher Cristo.

Ajudai-nos a permanecer firmes no caminho do bem. Que não sejamos vencidos pela tentação de desistir.

Ensinai-nos a ser fiéis até o fim.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    expedito.id,
    4,
    "QUARTO DIA – SANTO EXPEDITO, FORÇA NAS DIFICULDADES",
    `Santo Expedito, enfrentastes perseguições e sofrimentos confiando em Deus.

Ajudai-nos a enfrentar os desafios da vida com fé. Que não desanimemos diante das dificuldades.

Ensinai-nos a confiar na força que vem de Deus.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    expedito.id,
    5,
    "QUINTO DIA – SANTO EXPEDITO, INTERCESSOR DAS CAUSAS URGENTES",
    `Santo Expedito, sois conhecido como poderoso intercessor nas causas urgentes.

Apresentai a Deus nossas necessidades imediatas. Intercedei por aquilo que humanamente parece impossível.

Ensinai-nos a confiar na providência divina.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    expedito.id,
    6,
    "SEXTO DIA – SANTO EXPEDITO, OBEDIÊNCIA À VONTADE DE DEUS",
    `Santo Expedito, obedecestes prontamente à vontade de Deus.

Ajudai-nos a obedecer com amor e confiança. Que não resistamos à graça divina.

Ensinai-nos a viver segundo a vontade do Pai.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    expedito.id,
    7,
    "SÉTIMO DIA – SANTO EXPEDITO, VITÓRIA SOBRE A TENTAÇÃO",
    `Santo Expedito, vencestes as tentações que tentavam atrasar vosso compromisso com Deus.

Ajudai-nos a vencer tudo o que nos afasta do Senhor. Que saibamos rejeitar o pecado e o adiamento do bem.

Ensinai-nos a escolher Deus todos os dias.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    expedito.id,
    8,
    "OITAVO DIA – SANTO EXPEDITO, TESTEMUNHO DE ESPERANÇA",
    `Santo Expedito, mesmo nas provações, permanecestes cheio de esperança em Deus.

Ajudai-nos a manter a esperança viva, mesmo quando tudo parece difícil.

Ensinai-nos a confiar que Deus age no tempo certo.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    expedito.id,
    9,
    "NONO DIA – SANTO EXPEDITO, NOSSO PODEROSO INTERCESSOR",
    `Santo Expedito, acolhei esta novena que rezamos com fé e confiança.

Intercedei por nossas necessidades urgentes, fortalecei nossa fé e ajudai-nos a viver com prontidão e fidelidade ao Evangelho.

Que saibamos agradecer pelas graças alcançadas e confiar sempre na ação de Deus.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  //NOVENA A SANTA FAUSTINA KOWALSKA 

  const trocar = upsertNovena({
    slug: makeSlug("NOVENA A SANTA FAUSTINA KOWALSKA"),
    titulo: "NOVENA A SANTA FAUSTINA KOWALSKA",
    periodo_inicio: "26/09",
    periodo_fim: "04/10",
    subtitulo: "“Jesus, eu confio em Vós”",
    como_rezar: COMO_REZAR_PADRAO,
    sinal_da_cruz: SINAL_DA_CRUZ_PADRAO,
    oracao_inicial: `Ó Deus de infinita misericórdia, que escolhestes Santa Faustina Kowalska para revelar ao mundo as profundezas do Vosso amor misericordioso, nós Vos louvamos e bendizemos por este testemunho simples, humilde e totalmente entregue à Vossa vontade.

Por intercessão de Santa Faustina, concedei-nos a graça de rezar esta novena com coração confiante, alma humilde e fé viva. Ajudai-nos a mergulhar no mistério da Vossa misericórdia, a confiar plenamente em Vós e a testemunhar Vosso amor no cotidiano. Concedei-nos também, se for da Vossa vontade, as graças que necessitamos para nossa vida e salvação.
Amém.`,
    oracao_final: `Ó Jesus misericordioso,
em Vós confio.
Pela intercessão de Santa Faustina,
mergulhai-nos no oceano da Vossa misericórdia,
curai nossas feridas
e conduzi-nos no caminho da santidade.
Amém.`
  });

  upsertDia(
    trocar.id,
    1,
    "PRIMEIRO DIA – SANTA FAUSTINA, CHAMADA À CONFIANÇA TOTAL",
    `Santa Faustina, Jesus vos ensinou a confiar totalmente em Sua misericórdia.

Ajudai-nos a confiar em Deus mesmo quando não entendemos Seus caminhos. Que aprendamos a dizer com o coração: Jesus, eu confio em Vós.

Ensinai-nos a abandonar-nos nas mãos do Senhor.

(Fazer o pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    trocar.id,
    2,
    "SEGUNDO DIA – SANTA FAUSTINA, HUMILDADE PROFUNDA",
    `Santa Faustina, vivestes escondida, simples e humilde, agradando a Deus no silêncio.

Ajudai-nos a viver a humildade verdadeira. Que não busquemos reconhecimento, mas apenas a vontade de Deus.

Ensinai-nos a servir com amor silencioso.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    trocar.id,
    3,
    "TERCEIRO DIA – SANTA FAUSTINA, AMOR À VONTADE DE DEUS",
    `Santa Faustina, aceitastes a vontade de Deus mesmo quando ela vos trouxe sofrimento.

Ajudai-nos a amar a vontade divina em todas as circunstâncias. Que aprendamos a dizer “sim” mesmo na dor.

Ensinai-nos a confiar que Deus nunca erra.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    trocar.id,
    4,
    "QUARTO DIA – SANTA FAUSTINA, CONFIDENTE DA MISERICÓRDIA",
    `Santa Faustina, fostes escolhida para anunciar ao mundo a misericórdia infinita de Deus.

Ajudai-nos a acolher a misericórdia divina em nossa vida. Que não tenhamos medo de nos aproximar de Jesus.

Ensinai-nos que a misericórdia é maior que todo pecado.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    trocar.id,
    5,
    "QUINTO DIA – SANTA FAUSTINA, AMOR AO SOFRIMENTO OFERECIDO",
    `Santa Faustina, unistes vossos sofrimentos à cruz de Cristo.

Ajudai-nos a oferecer nossas dores por amor. Que saibamos transformar o sofrimento em oração.

Ensinai-nos o valor redentor da cruz.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    trocar.id,
    6,
    "SEXTO DIA – SANTA FAUSTINA, VIDA DE ORAÇÃO CONSTANTE",
    `Santa Faustina, vossa vida era sustentada pela oração profunda e confiante.

Ajudai-nos a cultivar uma vida de oração fiel. Que busquemos Jesus todos os dias.

Ensinai-nos a rezar com simplicidade e amor.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    trocar.id,
    7,
    "SÉTIMO DIA – SANTA FAUSTINA, AMOR PELA EUCARISTIA",
    `Santa Faustina, encontráveis força e consolo na presença de Jesus Eucarístico.

Ajudai-nos a amar profundamente a Eucaristia. Que ela seja o centro de nossa vida.

Ensinai-nos a reconhecer Jesus vivo no altar.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    trocar.id,
    8,
    "OITAVO DIA – SANTA FAUSTINA, MISERICÓRDIA PARA COM O PRÓXIMO",
    `Santa Faustina, aprendestes que quem recebe misericórdia deve oferecê-la aos outros.

Ajudai-nos a ser misericordiosos. Que saibamos perdoar, compreender e amar.

Ensinai-nos a viver a misericórdia no dia a dia.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    trocar.id,
    9,
    "NONO DIA – SANTA FAUSTINA, NOSSA INTERCESSORA JUNTO A JESUS",
    `Santa Faustina, acolhei esta novena que rezamos com fé e confiança.

Intercedei por nós junto a Jesus Misericordioso. Ajudai-nos a viver na confiança, na humildade e no amor.

Que jamais nos afastemos da misericórdia de Deus.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

    console.log("Seed inicial inserido ");
}

seedIfEmpty();

// ---------- App ----------
const app = express();
app.use(express.json({ limit: "2mb" }));
app.use(helmet());
app.use(morgan("dev"));
app.use("/images", express.static(path.join(__dirname, "public", "images")));

/* ====== 👇 COLE AQUI 👇 ====== */

const IMAGENS = [
  {
    slug: "sao-carlo-acutis",
    name: "São Carlo Acutis",
    aliases: ["acutis", "carlo acutis", "sao carlo acutis", "são carlo acutis"],
    file: "beato-carlo-acutis.png"
  },
  {
    slug: "santo-agostinho",
    name: "Santo Agostinho",
    aliases: ["agostinho", "sao agostinho", "santo agostinho"],
    file: "santo-agostinho.png"
  },
  {
    slug: "sao-jose-de-anchieta",
    name: "São José de Anchieta",
    aliases: ["anchieta", "jose de anchieta", "sao jose de anchieta"],
    file: "sao-jose-de-anchieta.png"
  },
  {
    slug: "anunciacao-do-senhor",
    name: "Anunciação do Senhor",
    aliases: ["anunciacao", "anunciação", "anunciacao do senhor", "anunciação do senhor"],
    file: "anunciacao-do-senhor.png"
  },
  {
    slug: "nossa-senhora-aparecida",
    name: "Nossa Senhora Aparecida",
    aliases: ["aparecida", "nossa senhora aparecida", "ns aparecida"],
    file: "nossa-senhora-aparecida.png"
  },
  {
    slug: "sao-francisco-de-assis",
    name: "São Francisco de Assis",
    aliases: ["assis", "francisco de assis", "sao francisco", "sao francisco de assis"],
    file: "sao-francisco-de-assis.png"
  },
  {
    slug: "assuncao-de-maria",
    name: "Assunção de Maria",
    aliases: ["assuncao", "assunção", "assuncao de maria", "assunção de maria"],
    file: "assuncao-de-maria.png"
  },
  {
    slug: "santo-atanasio",
    name: "Santo Atanásio",
    aliases: ["atanasio", "atanásio", "santo atanásio", "santo atanasio"],
    file: "santo-atanasio.png"
  },
  {
    slug: "nossa-senhora-auxiliadora",
    name: "Nossa Senhora Auxiliadora",
    aliases: ["auxiliadora", "auxiliadora dos cristaos", "nossa senhora auxiliadora", "ns auxiliadora"],
    file: "nossa-senhora-auxiliadora.png"
  },
  {
    slug: "sao-joao-batista",
    name: "São João Batista",
    aliases: ["batista", "joao batista", "sao joao batista", "são joão batista"],
    file: "sao-joao-batista.png"
  },
  {
    slug: "sao-bento",
    name: "São Bento",
    aliases: ["bento", "sao bento", "são bento"],
    file: "sao-bento.png"
  },
  {
    slug: "sao-bras",
    name: "São Brás",
    aliases: ["bras", "brás", "sao bras", "são brás"],
    file: "sao-bras.png"
  },
  {
    slug: "nossa-senhora-das-candeias",
    name: "Nossa Senhora das Candeias",
    aliases: ["candeias", "candelaria", "candelária", "nossa senhora das candeias", "ns das candeias"],
    file: "nossa-senhora-das-candeias.png"
  },
  {
    slug: "nossa-senhora-do-carmo",
    name: "Nossa Senhora do Carmo",
    aliases: ["carmo", "nossa senhora do carmo", "ns do carmo"],
    file: "nossa-senhora-do-carmo.png"
  },
  {
    slug: "santa-catarina",
    name: "Santa Catarina",
    aliases: ["catarina", "santa catarina"],
    file: "santa-catarina.png"
  },
  {
    slug: "santa-clara",
    name: "Santa Clara",
    aliases: ["clara", "santa clara"],
    file: "santa-clara.png"
  },
  {
    slug: "nossa-senhora-da-conceicao",
    name: "Nossa Senhora da Conceição",
    aliases: ["conceicao", "conceição", "imaculada conceicao", "imaculada conceição", "nossa senhora da conceicao", "ns da conceicao"],
    file: "nossa-senhora-da-conceicao.png"
  },
  {
    slug: "nossa-senhora-das-dores",
    name: "Nossa Senhora das Dores",
    aliases: ["dores", "nossa senhora das dores", "ns das dores"],
    file: "nossa-senhora-das-dores.png"
  },
  {
    slug: "santa-edwiges",
    name: "Santa Edwiges",
    aliases: ["edwirges", "edwiges", "santa edwiges"],
    file: "santa-edwiges.png"
  },
  {
    slug: "epifania-do-senhor",
    name: "Epifania do Senhor",
    aliases: ["epifania", "epifania do senhor", "reis magos", "dia de reis"],
    file: "epifania-do-senhor.png"
  },
  {
    slug: "espirito-santo",
    name: "Espírito Santo",
    aliases: ["espirito santo", "espírito santo", "divino espirito santo", "divino espírito santo"],
    file: "espirito-santo.png"
  },
  {
    slug: "santo-expedito",
    name: "Santo Expedito",
    aliases: ["expedito", "santo expedito"],
    file: "santo-expedito.png"
  },
  {
    slug: "nossa-senhora-de-fatima",
    name: "Nossa Senhora de Fátima",
    aliases: ["fatima", "fátima", "nossa senhora de fatima", "ns de fatima"],
    file: "nossa-senhora-de-fatima.png"
  },
  {
    slug: "santa-faustina-kowalska",
    name: "Santa Faustina Kowalska",
    aliases: ["faustina", "santa faustina", "faustina kowalska", "divina misericordia", "divina misericórdia"],
    file: "santa-faustina-kowalska.png"
  },
  {
    slug: "santa-filomena",
    name: "Santa Filomena",
    aliases: ["filomena", "santa filomena"],
    file: "santa-filomena.png"
  },
  {
    slug: "santa-gemma-galgani",
    name: "Santa Gemma Galgani",
    aliases: ["gemma", "santa gemma", "gemma galgani"],
    file: "santa-gemma-galgani.png"
  },
  {
    slug: "santa-giana-beretta-molla",
    name: "Santa Gianna Beretta Molla",
    aliases: ["giana", "gianna", "giana beretta molla", "gianna beretta molla", "santa gianna"],
    file: "santa-giana-beretta-molla.png"
  },
  {
    slug: "nossa-senhora-das-gracas",
    name: "Nossa Senhora das Graças",
    aliases: ["gracas", "graças", "nossa senhora das gracas", "ns das gracas", "medalha milagrosa", "medalha milagrosa"],
    file: "nossa-senhora-das-gracas.png"
  },
  {
    slug: "sao-jorge",
    name: "São Jorge",
    aliases: ["jorge", "sao jorge", "são jorge"],
    file: "sao-jorge.png"
  },
  {
    slug: "sao-jose",
    name: "São José",
    aliases: ["jose", "josé", "sao jose", "são josé"],
    file: "sao-jose.png"
  },
  {
    slug: "santa-maria-mae-de-deus",
    name: "Santa Maria, mãe de Deus",
    aliases: ["maria", "santa maria", "santa maria mae de deus", "santa maria mãe de deus", "mae de deus", "mãe de deus"],
    file: "virgem-maria.png"
  },
  {
    slug: "santa-monica",
    name: "Santa Mônica",
    aliases: ["monica", "mônica", "santa monica"],
    file: "santa-monica.png"
  },
  {
    slug: "sao-pedro-e-sao-paulo",
    name: "São Pedro e São Paulo",
    aliases: ["pedro", "paulo", "pedro e paulo", "sao pedro", "sao paulo", "sao pedro e sao paulo"],
    file: "sao-pedro-e-sao-paulo.png"
  },
  {
    slug: "pentecostes",
    name: "Pentecostes",
    aliases: ["pentecostes", "pentecostés", "espirito santo pentecostes", "pentecostes espirito santo"],
    file: "pentecostes.png"
  },
  {
    slug: "purificacao-de-maria",
    name: "Purificação de Maria",
    aliases: ["purificacao", "purificação", "purificacao de maria", "purificação de maria", "apresentacao do senhor", "apresentação do senhor"],
    file: "purificacao-de-maria.png"
  },
  {
    slug: "santa-rita-de-cassia",
    name: "Santa Rita de Cássia",
    aliases: ["rita", "santa rita", "santa rita de cassia", "cássia"],
    file: "santa-rita-de-cassia.png"
  },
  {
    slug: "sao-roque",
    name: "São Roque",
    aliases: ["roque", "sao roque", "são roque"],
    file: "sao-roque.png"
  },
  {
    slug: "sagrado-coracao-de-jesus",
    name: "Sagrado Coração de Jesus",
    aliases: ["sagrado coracao", "sagrado coração", "coracao de jesus", "coração de jesus"],
    file: "sagrado-coracao-de-jesus.png"
  },
  {
    slug: "sao-francisco-de-sales",
    name: "São Francisco de Sales",
    aliases: ["sales", "francisco de sales", "sao francisco de sales"],
    file: "sao-francisco-de-sales.png"
  },
  {
    slug: "sao-sebastiao",
    name: "São Sebastião",
    aliases: ["sebastiao", "sebastião", "sao sebastiao", "são sebastião"],
    file: "sao-sebastiao.png"
  },
  {
    slug: "santana-sao-joaquim-e-maria",
    name: "Sant’Ana, São Joaquim e Maria",
    aliases: ["santana", "sant ana", "santa ana", "joaquim", "sao joaquim", "santana sao joaquim", "sant ana e sao joaquim"],
    file: "santana-sao-joaquim-e-maria.png"
  },
  {
    slug: "sao-judas-tadeu",
    name: "São Judas Tadeu",
    aliases: ["tadeu", "judas tadeu", "sao judas", "sao judas tadeu", "são judas tadeu"],
    file: "sao-judas-tadeu.png"
  },
  {
    slug: "santa-teresinha-do-menino-jesus",
    name: "Santa Teresinha do Menino Jesus",
    aliases: ["teresinha", "terezinha", "santa teresinha", "santa teresinha do menino jesus", "teresa do menino jesus"],
    file: "santa-teresinha-do-menino-jesus.png"
  },
  {
    slug: "sao-joao-maria-vianney",
    name: "São João Maria Vianney",
    aliases: ["vianney", "joao vianney", "sao joao maria vianney", "cura d ars", "cura d'ars"],
    file: "sao-joao-maria-vianney.png"
  },
  {
    slug: "almas-do-purgatorio",
    name: "Almas do Purgatório",
    aliases: ["purgatorio", "purgatório", "almas do purgatorio", "almas do purgatório"],
    file: "almas-do-purgatorio.png"
  }
];

/* ====== FUNÇÕES AUXILIARES ====== */

function normalize(s = "") {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function scoreItem(item, qNorm) {
  const nameNorm = normalize(item.name);
  const aliasesNorm = (item.aliases || []).map(normalize);
  let score = 0;

  if (nameNorm === qNorm) score += 100;
  if (nameNorm.includes(qNorm)) score += 60;
  if (aliasesNorm.includes(qNorm)) score += 80;
  if (aliasesNorm.some(a => a.includes(qNorm))) score += 50;

  const words = qNorm.split(" ");
  const bag = [nameNorm, ...aliasesNorm].join(" ");
  score += words.filter(w => w.length >= 3 && bag.includes(w)).length * 8;

  return score;
}

function imageUrl(req, file) {
  return `${req.protocol}://${req.get("host")}/images/${file}`;
}

// ---------- Schemas ----------


// ---------- Schemas ----------
const NovenaCreateSchema = z.object({
  titulo: z.string().min(3),
  periodo_inicio: z.string().optional().nullable(),
  periodo_fim: z.string().optional().nullable(),
  subtitulo: z.string().optional().nullable(),
  como_rezar: z.string().optional().nullable(),
  sinal_da_cruz: z.string().optional().nullable(),
  oracao_inicial: z.string().optional().nullable(),
  oracao_final: z.string().optional().nullable(),
  slug: z.string().optional().nullable()
});
const NovenaUpdateSchema = NovenaCreateSchema.partial();

const DiaSchema = z.object({
  dia_numero: z.number().int().min(1).max(9),
  titulo: z.string().min(3),
  texto: z.string().min(3)
});

// ---------- DB Access ----------
function getNovenaBySlugOrId(identifier) {
  if (isNumericId(identifier)) {
    return db.prepare("SELECT * FROM novenas WHERE id = ?").get(Number(identifier));
  }
  return db.prepare("SELECT * FROM novenas WHERE slug = ?").get(String(identifier));
}
function getDiasByNovenaId(novenaId) {
  return db
    .prepare("SELECT * FROM novena_dias WHERE novena_id = ? ORDER BY dia_numero ASC")
    .all(novenaId);
}

// ---------- Routes ----------
app.get("/health", (req, res) => res.json({ ok: true, ts: nowISO() }));

app.get("/novenas", (req, res) => {
  const q = (req.query.q || "").toString().trim();
  const limit = Math.min(Number(req.query.limit || 50), 200);
  const offset = Math.max(Number(req.query.offset || 0), 0);

  let items;
  if (q) {
    items = db
      .prepare(
        `SELECT * FROM novenas
         WHERE titulo LIKE ? OR subtitulo LIKE ? OR slug LIKE ?
         ORDER BY titulo ASC
         LIMIT ? OFFSET ?`
      )
      .all(`%${q}%`, `%${q}%`, `%${q}%`, limit, offset);
  } else {
    items = db
      .prepare("SELECT * FROM novenas ORDER BY titulo ASC LIMIT ? OFFSET ?")
      .all(limit, offset);
  }

  res.json({ items, q: q || null, limit, offset });
});

app.get("/novenas/:idOrSlug", (req, res) => {
  const includeDays = (req.query.includeDays || "false").toString() === "true";
  const novena = getNovenaBySlugOrId(req.params.idOrSlug);
  if (!novena) return res.status(404).json({ error: "Novena não encontrada" });

  if (!includeDays) return res.json(novena);
  const dias = getDiasByNovenaId(novena.id);
  return res.json({ ...novena, dias });
});

app.get("/imagens", (req, res) => {
  const { q } = req.query;

  if (!q) {
    return res.json({
      items: IMAGENS.map(i => ({
        slug: i.slug,
        name: i.name,
        image: imageUrl(req, i.file)
      }))
    });
  }

  const qNorm = normalize(q);
  const ranked = IMAGENS
    .map(i => ({ i, score: scoreItem(i, qNorm) }))
    .filter(x => x.score > 0)
    .sort((a, b) => b.score - a.score);

  if (!ranked.length) {
    return res.status(404).json({ error: "Nenhuma imagem encontrada" });
  }

  const best = ranked[0].i;
  res.json({
    query: q,
    match: {
      slug: best.slug,
      name: best.name,
      image: imageUrl(req, best.file)
    }
  });
});

app.get("/imagens/:slug", (req, res) => {
  const found = IMAGENS.find(i => i.slug === req.params.slug);
  if (!found) return res.status(404).json({ error: "Slug não encontrado" });

  res.json({
    slug: found.slug,
    name: found.name,
    image: imageUrl(req, found.file)
  });
});


app.post("/novenas", (req, res) => {
  const parsed = NovenaCreateSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const data = parsed.data;
  const slug = (data.slug && data.slug.trim()) ? makeSlug(data.slug) : makeSlug(data.titulo);

  try {
    const info = db
      .prepare(`
        INSERT INTO novenas
        (slug, titulo, periodo_inicio, periodo_fim, subtitulo, como_rezar, sinal_da_cruz, oracao_inicial, oracao_final, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `)
      .run(
        slug,
        data.titulo,
        data.periodo_inicio ?? null,
        data.periodo_fim ?? null,
        data.subtitulo ?? null,
        data.como_rezar ?? null,
        data.sinal_da_cruz ?? null,
        data.oracao_inicial ?? null,
        data.oracao_final ?? null,
        nowISO()
      );

    const created = getNovenaBySlugOrId(info.lastInsertRowid);
    return res.status(201).json(created);
  } catch (e) {
    if (String(e.message).includes("UNIQUE")) {
      return res.status(409).json({ error: "Slug já existe. Use outro slug." });
    }
    return res.status(500).json({ error: "Erro ao criar novena", details: String(e.message) });
  }
});

app.patch("/novenas/:idOrSlug", (req, res) => {
  const novena = getNovenaBySlugOrId(req.params.idOrSlug);
  if (!novena) return res.status(404).json({ error: "Novena não encontrada" });

  const parsed = NovenaUpdateSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const data = parsed.data;

  const next = {
    slug: data.slug != null ? makeSlug(data.slug) : novena.slug,
    titulo: data.titulo ?? novena.titulo,
    periodo_inicio: data.periodo_inicio ?? novena.periodo_inicio,
    periodo_fim: data.periodo_fim ?? novena.periodo_fim,
    subtitulo: data.subtitulo ?? novena.subtitulo,
    como_rezar: data.como_rezar ?? novena.como_rezar,
    sinal_da_cruz: data.sinal_da_cruz ?? novena.sinal_da_cruz,
    oracao_inicial: data.oracao_inicial ?? novena.oracao_inicial,
    oracao_final: data.oracao_final ?? novena.oracao_final
  };

  try {
    db.prepare(`
      UPDATE novenas SET
        slug = ?, titulo = ?, periodo_inicio = ?, periodo_fim = ?, subtitulo = ?,
        como_rezar = ?, sinal_da_cruz = ?, oracao_inicial = ?, oracao_final = ?,
        updated_at = ?
      WHERE id = ?
    `).run(
      next.slug,
      next.titulo,
      next.periodo_inicio,
      next.periodo_fim,
      next.subtitulo,
      next.como_rezar,
      next.sinal_da_cruz,
      next.oracao_inicial,
      next.oracao_final,
      nowISO(),
      novena.id
    );

    return res.json(getNovenaBySlugOrId(novena.id));
  } catch (e) {
    if (String(e.message).includes("UNIQUE")) {
      return res.status(409).json({ error: "Slug já existe. Use outro slug." });
    }
    return res.status(500).json({ error: "Erro ao atualizar novena", details: String(e.message) });
  }
});

app.delete("/novenas/:idOrSlug", (req, res) => {
  const novena = getNovenaBySlugOrId(req.params.idOrSlug);
  if (!novena) return res.status(404).json({ error: "Novena não encontrada" });

  db.prepare("DELETE FROM novenas WHERE id = ?").run(novena.id);
  return res.json({ ok: true });
});

app.get("/novenas/:idOrSlug/dias", (req, res) => {
  const novena = getNovenaBySlugOrId(req.params.idOrSlug);
  if (!novena) return res.status(404).json({ error: "Novena não encontrada" });

  const items = getDiasByNovenaId(novena.id);
  return res.json({ novena_id: novena.id, items });
});

app.put("/novenas/:idOrSlug/dias/:diaNumero", (req, res) => {
  const novena = getNovenaBySlugOrId(req.params.idOrSlug);
  if (!novena) return res.status(404).json({ error: "Novena não encontrada" });

  const dia_numero = Number(req.params.diaNumero);
  const parsed = DiaSchema.safeParse({ ...req.body, dia_numero });
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const { titulo, texto } = parsed.data;

  const existing = db
    .prepare("SELECT * FROM novena_dias WHERE novena_id = ? AND dia_numero = ?")
    .get(novena.id, dia_numero);

  if (!existing) {
    db.prepare(`
      INSERT INTO novena_dias (novena_id, dia_numero, titulo, texto, updated_at)
      VALUES (?, ?, ?, ?, ?)
    `).run(novena.id, dia_numero, titulo, texto, nowISO());
  } else {
    db.prepare(`
      UPDATE novena_dias SET titulo = ?, texto = ?, updated_at = ?
      WHERE novena_id = ? AND dia_numero = ?
    `).run(titulo, texto, nowISO(), novena.id, dia_numero);
  }

  const saved = db
    .prepare("SELECT * FROM novena_dias WHERE novena_id = ? AND dia_numero = ?")
    .get(novena.id, dia_numero);

  return res.json(saved);
});

app.delete("/novenas/:idOrSlug/dias/:diaNumero", (req, res) => {
  const novena = getNovenaBySlugOrId(req.params.idOrSlug);
  if (!novena) return res.status(404).json({ error: "Novena não encontrada" });

  const dia_numero = Number(req.params.diaNumero);
  db.prepare("DELETE FROM novena_dias WHERE novena_id = ? AND dia_numero = ?").run(novena.id, dia_numero);
  return res.json({ ok: true });
});

app.get("/novenas/:idOrSlug/dias/:diaNumero/roteiro", (req, res) => {
  const novena = getNovenaBySlugOrId(req.params.idOrSlug);
  if (!novena) return res.status(404).json({ error: "Novena não encontrada" });

  const dia_numero = Number(req.params.diaNumero);
  const dia = db
    .prepare("SELECT * FROM novena_dias WHERE novena_id = ? AND dia_numero = ?")
    .get(novena.id, dia_numero);

  if (!dia) return res.status(404).json({ error: "Dia não encontrado" });

  const blocks = [];

  if (novena.como_rezar) {
    blocks.push({ type: "como_rezar", title: "Como rezar todos os dias", text: novena.como_rezar });
  }
  if (novena.sinal_da_cruz) {
    blocks.push({ type: "sinal_da_cruz", title: "Sinal da Cruz", text: novena.sinal_da_cruz });
  }
  if (novena.oracao_inicial) {
    blocks.push({ type: "oracao_inicial", title: "Oração Inicial", text: novena.oracao_inicial });
  }

  blocks.push({ type: "oracao_do_dia", title: dia.titulo, text: dia.texto });

  // Bloco padrão final (você pode remover se quiser)
  blocks.push({
    type: "sequencia_final",
    title: "Em seguida",
    text: "Pedido pessoal\nPai-Nosso\nAve-Maria\nGlória ao Pai"
  });

  if (novena.oracao_final) {
    blocks.push({ type: "oracao_final", title: "Oração Final", text: novena.oracao_final });
  }

  return res.json({
    novena: {
      id: novena.id,
      slug: novena.slug,
      titulo: novena.titulo,
      periodo_inicio: novena.periodo_inicio,
      periodo_fim: novena.periodo_fim,
      subtitulo: novena.subtitulo
    },
    dia: { dia_numero: dia.dia_numero, titulo: dia.titulo },
    blocks
  });
});

// ---------- Start ----------
app.listen(PORT, () => {
  console.log(`✅ Novena API rodando: http://localhost:${PORT}`);
  console.log(`DB: ${DB_PATH}`);
});








