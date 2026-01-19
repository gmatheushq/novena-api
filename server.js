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

  console.log("Seed inicial inserido ✅ (2 novenas)");
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
