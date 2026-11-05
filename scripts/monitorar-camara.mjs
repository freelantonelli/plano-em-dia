// Consulta a API de Dados Abertos da Câmara para cada proposição ligada a um compromisso.
// Quando a situação muda, grava o novo estado e escreve um resumo em mudancas.md
// (o workflow transforma esse resumo em uma issue para revisão humana).
// Nada aqui altera o status público de um compromisso: isso só acontece com aprovação manual.

import { readFile, writeFile } from "node:fs/promises";

const API = "https://dadosabertos.camara.leg.br/api/v2";
const MAPA = "data/monitor/proposicoes.json";
const ESTADO = "data/monitor/estado.json";

async function getJson(url) {
  for (let tentativa = 1; tentativa <= 3; tentativa++) {
    try {
      const r = await fetch(url, { headers: { Accept: "application/json", "User-Agent": "plano-em-dia-monitor" } });
      if (r.ok) return await r.json();
      console.warn(`HTTP ${r.status} em ${url}`);
    } catch (e) {
      console.warn(`Falha em ${url}: ${e.message}`);
    }
    await new Promise((res) => setTimeout(res, 2000 * tentativa));
  }
  throw new Error(`Não foi possível consultar ${url}`);
}

async function idDaProposicao({ siglaTipo, numero, ano }) {
  const q = new URLSearchParams({ siglaTipo, numero: String(numero), ano: String(ano) });
  const r = await getJson(`${API}/proposicoes?${q}`);
  return r.dados?.[0]?.id ?? null;
}

const mapa = JSON.parse(await readFile(MAPA, "utf8"));
const estado = JSON.parse(await readFile(ESTADO, "utf8"));
const mudancas = [];
let erros = 0;

for (const [compromisso, prop] of Object.entries(mapa)) {
  if (compromisso.startsWith("_")) continue;
  const nome = `${prop.siglaTipo} ${prop.numero}/${prop.ano}`;
  try {
    const anterior = estado[compromisso];
    const id = anterior?.id ?? (await idDaProposicao(prop));
    if (!id) { console.warn(`${compromisso}: ${nome} não encontrada na Câmara`); erros++; continue; }

    const { dados } = await getJson(`${API}/proposicoes/${id}`);
    const s = dados.statusProposicao ?? {};
    const atual = {
      id,
      proposicao: nome,
      dataHora: s.dataHora ?? null,
      situacao: s.descricaoSituacao ?? null,
      tramitacao: s.descricaoTramitacao ?? null,
      orgao: s.siglaOrgao ?? null,
      despacho: s.despacho ?? null,
      url: `https://www.camara.leg.br/proposicoesWeb/fichadetramitacao?idProposicao=${id}`,
    };

    const assinatura = (x) => [x?.dataHora, x?.situacao, x?.tramitacao].join("|");
    if (!anterior) {
      console.log(`${compromisso}: primeira leitura de ${nome} (${atual.situacao ?? "sem situação"})`);
    } else if (assinatura(anterior) !== assinatura(atual)) {
      mudancas.push({ compromisso, anterior, atual });
    }
    estado[compromisso] = atual;
  } catch (e) {
    console.error(`${compromisso}: ${e.message}`);
    erros++;
  }
}

await writeFile(ESTADO, JSON.stringify(estado, null, 2) + "\n");

if (mudancas.length) {
  const corpo = [
    `O robô detectou ${mudancas.length} mudança(s) de tramitação na Câmara.`,
    "",
    "**Antes de mudar qualquer status no site:** confira a fonte e, se for o caso, adicione um registro em `data/atualizacoes.json`.",
    "",
    ...mudancas.map(({ compromisso, anterior, atual }) => [
      `### ${compromisso} · ${atual.proposicao}`,
      `- Antes: ${anterior.situacao ?? "—"} (${anterior.dataHora ?? "—"})`,
      `- Agora: **${atual.situacao ?? "—"}** (${atual.dataHora ?? "—"})`,
      `- Tramitação: ${atual.tramitacao ?? "—"}${atual.orgao ? ` · ${atual.orgao}` : ""}`,
      atual.despacho ? `- Despacho: ${atual.despacho}` : "",
      `- Fonte: ${atual.url}`,
      "",
    ].filter(Boolean).join("\n")),
  ].join("\n");
  await writeFile("mudancas.md", corpo);
  console.log(corpo);
} else {
  console.log("Nenhuma mudança.");
}

if (erros && erros === Object.keys(mapa).filter((k) => !k.startsWith("_")).length) process.exit(1);
