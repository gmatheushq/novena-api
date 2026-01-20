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

  const lourdes = upsertNovena({
    slug: makeSlug("NOVENA D"),
    titulo: "NOVENA D",
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
    subtitulo: "Cristo comigo, Cristo em mim, Cristo atrás e à minha frente",
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
    slug: makeSlug("NOVENA D"),
    titulo: "NOVENA D",
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
    slug: makeSlug("NOVENA D"),
    titulo: "NOVENA D",
    periodo_inicio: "02/04",
    periodo_fim: "10/04",
    subtitulo: "'Quem verdadeiramente ama, voluntariamente sofre'",
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
    subtitulo: "'Se fores aquilo que Deus quer, colocareis fogo no mundo'",
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
    slug: makeSlug("NOVENA D"),
    titulo: "NOVENA D",
    periodo_inicio: "31/05",
    periodo_fim: "08/06",
    subtitulo: "“Apóstolo do Brasil, semeador do Evangelho",
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

  //TREZENA A SANTO ANTÔNIO

  const antonio = upsertNovena({
    slug: makeSlug("TREZENA A SANTO ANTÔNIO"),
    titulo: "TREZENA A SANTO ANTÔNIO",
    periodo_inicio: "31/05",
    periodo_fim: "12/06",
    subtitulo: "Da intimidade com a Palavra nasceu a luz de sua doutrina",
    como_rezar: COMO_REZAR_PADRAO,
    sinal_da_cruz: SINAL_DA_CRUZ_PADRAO,
    oracao_inicial: `Ó Deus de infinita bondade, que concedestes a Santo Antônio a graça de anunciar o Evangelho com sabedoria, amor e poder, fazendo dele luz para os fiéis, consolo para os aflitos e auxílio para os necessitados, nós Vos louvamos e bendizemos por tão grande dom à Igreja.

Por intercessão de Santo Antônio, concedei-nos a graça de rezar esta trezena com fé sincera, coração confiante e espírito humilde. Que, a exemplo deste grande santo, aprendamos a amar Vossa Palavra, a viver a caridade e a confiar plenamente em Vossa providência. Concedei-nos também as graças que necessitamos para nossa vida e salvação, conforme a Vossa santa vontade.
Amém.`,
    oracao_final: `Ó glorioso Santo Antônio,
amigo dos pobres e auxílio dos necessitados,
rogai por nós junto a Deus.
Alcançai-nos as graças de que precisamos,
fortalecei nossa fé
e conduzi-nos sempre pelo caminho do bem.
Amém.`
  });

  upsertDia(
    antonio.id,
    1,
    "PRIMEIRO DIA – SANTO ANTÔNIO, CHAMADO POR DEUS",
    `Santo Antônio, desde jovem ouvistes o chamado de Deus e respondestes com generosidade, deixando tudo para seguir Cristo.

Ajudai-nos a escutar o chamado de Deus em nossa vida. Que saibamos responder com coragem e fidelidade, sem medo das renúncias.

Ensinai-nos a confiar que Deus conduz nossos passos.

(Fazer o pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    antonio.id,
    2,
    "SEGUNDO DIA – SANTO ANTÔNIO, AMANTE DA PALAVRA DE DEUS",
    `Santo Antônio, vossa vida foi profundamente marcada pelo amor à Palavra de Deus, que estudáveis, meditáveis e anunciáveis com zelo.

Ajudai-nos a amar as Sagradas Escrituras. Que a Palavra de Deus ilumine nossas decisões e fortaleça nossa fé.

Ensinai-nos a viver segundo o Evangelho.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    antonio.id,
    3,
    "TERCEIRO DIA – SANTO ANTÔNIO, PODEROSO PREGADOR",
    `Santo Antônio, fostes grande pregador, capaz de tocar os corações e conduzir muitos à conversão.

Ajudai-nos a testemunhar nossa fé com palavras e atitudes. Que nossa vida seja anúncio vivo do Evangelho.

Dai-nos coragem para viver e proclamar a verdade cristã.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    antonio.id,
    4,
    "QUARTO DIA – SANTO ANTÔNIO, DEFENSOR DOS POBRES",
    `Santo Antônio, vosso coração era sensível às necessidades dos pobres, dos aflitos e dos esquecidos.

Ajudai-nos a reconhecer Cristo nos que sofrem. Que sejamos generosos, solidários e atentos às dores do próximo.

Ensinai-nos a viver a verdadeira caridade cristã.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    antonio.id,
    5,
    "QUINTO DIA – SANTO ANTÔNIO, AMIGO DOS AFLITOS",
    `Santo Antônio, tantos recorrem a vós em momentos de angústia e encontram consolo e esperança.

Intercedei por nós em nossas dificuldades. Ajudai-nos a confiar em Deus mesmo nas horas mais difíceis.

Que jamais percamos a esperança na misericórdia divina.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    antonio.id,
    6,
    "SEXTO DIA – SANTO ANTÔNIO, INTERCESSOR DAS CAUSAS DIFÍCEIS",
    `Santo Antônio, sois conhecido como poderoso intercessor nas causas difíceis e urgentes.

Apresentai a Deus nossas necessidades e pedidos. Fortalecei nossa fé para confiar que nada é impossível para Deus.

Ensinai-nos a esperar com paciência e confiança.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    antonio.id,
    7,
    "SÉTIMO DIA – SANTO ANTÔNIO, EXEMPLO DE HUMILDADE",
    `Santo Antônio, apesar de vossa sabedoria e dons, permanecestes profundamente humilde.

Livrai-nos do orgulho e da vaidade. Ensinai-nos a reconhecer que tudo vem de Deus.

Que saibamos servir com simplicidade e amor.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    antonio.id,
    8,
    "OITAVO DIA – SANTO ANTÔNIO, MODELO DE VIDA CONSAGRADA",
    `Santo Antônio, vivestes com fidelidade os votos religiosos, entregando-vos totalmente a Deus.

Ajudai-nos a viver com fidelidade nossa vocação, seja ela qual for. Que sejamos fiéis aos compromissos assumidos com Deus.

Ensinai-nos a viver com coração indiviso.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

  upsertDia(
    antonio.id,
    9,
    "NONO DIA – SANTO ANTÔNIO, AMANTE DA EUCARISTIA",
    `Santo Antônio, encontráveis na Eucaristia força, luz e intimidade com Cristo.

Ajudai-nos a amar o Santíssimo Sacramento. Que a Eucaristia seja o centro de nossa vida cristã.

Ensinai-nos a viver em comunhão com Jesus.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

    upsertDia(
    antonio.id,
    10,
    "DÉCIMO DIA – SANTO ANTÔNIO, PROTETOR DAS FAMÍLIAS",
    `Santo Antônio, muitas famílias recorrem à vossa intercessão com confiança.

Protegei nossos lares. Ajudai-nos a viver o amor, o perdão e a fé em família.

Que nossos lares sejam lugares de paz e oração.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

    upsertDia(
    antonio.id,
    11,
    "DÉCIMO PRIMEIRO DIA – SANTO ANTÔNIO, GUIA DOS JOVENS",
    `Santo Antônio, sede guia e proteção para os jovens, que enfrentam tantos desafios.

Ajudai-os a fazer boas escolhas e a seguir o caminho do bem. Que encontrem em Deus o sentido de sua vida.

Protegei-os de todo mal.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

    upsertDia(
    antonio.id,
    12,
    "DÉCIMO SEGUNDO DIA – SANTO ANTÔNIO, EXEMPLO DE CONFIANÇA EM DEUS",
    `Santo Antônio, em tudo confiastes na providência divina.

Ajudai-nos a confiar mais em Deus e menos em nossas próprias forças. Que saibamos entregar nossas preocupações ao Senhor.

Ensinai-nos o abandono confiante nas mãos de Deus.

(Pedido pessoal)

Pai-Nosso
Ave-Maria
Glória ao Pai`
  );

    upsertDia(
    antonio.id,
    13,
    "DÉCIMO TERCEIRO DIA – ",
    `Santo Antônio, acolhei esta trezena que rezamos com fé e amor. Apresentai a Deus nossos pedidos e necessidades.

Intercedei por nossa vida espiritual, por nossas famílias e por todos os que recorrem a vós com confiança.

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
    subtitulo: "Crux sacra sit mihi lux",
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
    subtitulo: "Nada desejar senão Cristo pobre e crucificado",
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








