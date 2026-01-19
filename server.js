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
    subtitulo: "A Mãe que apresenta a Luz ao mundo.",
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

  console.log("Seed inicial inserido ");
}

seedIfEmpty();

// ---------- App ----------
const app = express();
app.use(express.json({ limit: "2mb" }));
app.use(helmet());
app.use(morgan("dev"));

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








