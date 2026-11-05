"use client";

import { useEffect, useMemo, useState } from "react";
import {
  carregar,
  ultimaAtualizacao,
  EIXOS,
  STATUS,
  TIPOS,
  NATUREZAS,
  INSTRUMENTOS,
  INICIO_MANDATO,
  type CompromissoComStatus,
  type Status,
  type Tipo,
  type Instrumento,
} from "../lib/dados";
import { comoCobrar, modeloPedidoLAI, CANAIS } from "../lib/cobrar";
import mandatoAtual from "../data/mandato-2023-2026.json";

const TODOS = carregar();
const ORDEM_STATUS: Status[] = ["cumprido", "parcial", "em_andamento", "no_congresso", "nao_iniciado", "descumprido"];
const PLANO_TSE = "https://divulgacandcontas.tse.jus.br";

type Vista = "compromissos" | "mandato-atual" | "como-cobrar" | "metodologia";

function lerHash(): { vista: Vista; item: string | null } {
  const h = typeof window === "undefined" ? "" : window.location.hash.replace("#", "");
  if (h.startsWith("item-")) return { vista: "compromissos", item: h.slice(5).toUpperCase() };
  if (h === "como-cobrar" || h === "metodologia" || h === "mandato-atual") return { vista: h, item: null };
  return { vista: "compromissos", item: null };
}

function irPara(hash: string) {
  if (hash) window.location.hash = hash;
  else history.replaceState(null, "", window.location.pathname + window.location.search);
  window.dispatchEvent(new HashChangeEvent("hashchange"));
}

function contarStatus(lista: CompromissoComStatus[]) {
  const c = Object.fromEntries(ORDEM_STATUS.map((s) => [s, 0])) as Record<Status, number>;
  lista.forEach((x) => c[x.status]++);
  return c;
}

function BarraStatus({ lista }: { lista: CompromissoComStatus[] }) {
  const c = contarStatus(lista);
  const total = lista.length || 1;
  return (
    <div className="bar" role="img" aria-label={ORDEM_STATUS.map((s) => `${STATUS[s].rotulo}: ${c[s]}`).join(", ")}>
      {ORDEM_STATUS.map((s) =>
        c[s] ? <div key={s} style={{ width: `${(c[s] / total) * 100}%`, background: `var(--s-${s})` }} /> : null
      )}
    </div>
  );
}

function StatusTag({ s }: { s: Status }) {
  return (
    <span className="status">
      <span className="dot" style={{ background: `var(--s-${s})` }} />
      {STATUS[s].rotulo}
    </span>
  );
}

export default function Page() {
  const [vista, setVista] = useState<Vista>("compromissos");
  const [itemId, setItemId] = useState<string | null>(null);
  const [busca, setBusca] = useState("");
  const [eixo, setEixo] = useState<number | 0>(0);
  const [tipo, setTipo] = useState<Tipo | "">("");
  const [status, setStatus] = useState<Status | "">("");
  const [instr, setInstr] = useState<Instrumento | "">("");

  useEffect(() => {
    const sync = () => {
      const { vista, item } = lerHash();
      setVista(vista);
      setItemId(item);
    };
    sync();
    window.addEventListener("hashchange", sync);
    return () => window.removeEventListener("hashchange", sync);
  }, []);

  const filtrados = useMemo(() => {
    const q = busca.trim().toLowerCase();
    return TODOS.filter(
      (c) =>
        (!eixo || c.eixo === eixo) &&
        (!tipo || c.tipo === tipo) &&
        (!status || c.status === status) &&
        (!instr || c.instrumento === instr) &&
        (!q || `${c.titulo} ${c.trecho} ${c.orgao} ${c.id}`.toLowerCase().includes(q))
    );
  }, [busca, eixo, tipo, status, instr]);

  const aberto = itemId ? TODOS.find((c) => c.id === itemId) ?? null : null;
  const temFiltro = busca || eixo || tipo || status || instr;
  const limpar = () => { setBusca(""); setEixo(0); setTipo(""); setStatus(""); setInstr(""); };

  const contTipo = (t: Tipo) => TODOS.filter((c) => c.tipo === t).length;
  const dependeCongresso = TODOS.filter((c) => c.instrumento === "lei" || c.instrumento === "pec").length;
  const atualizado = ultimaAtualizacao();

  return (
    <>
      <header className="top">
        <div className="wrap">
          <a className="brand" href="#" onClick={(e) => { e.preventDefault(); irPara(""); }}>
            <b>Plano em Dia</b>
            <span>Acompanhamento independente · 2027–2030</span>
          </a>
          <nav className="nav">
            <a href="#" className={vista === "compromissos" ? "on" : ""} onClick={(e) => { e.preventDefault(); irPara(""); }}>Compromissos</a>
            <a href="#mandato-atual" className={vista === "mandato-atual" ? "on" : ""}>2023–2026</a>
            <a href="#como-cobrar" className={vista === "como-cobrar" ? "on" : ""}>Como cobrar</a>
            <a href="#metodologia" className={vista === "metodologia" ? "on" : ""}>Metodologia</a>
          </nav>
        </div>
      </header>

      <main className="wrap">
        {vista === "compromissos" && (
          <>
            <section className="hero">
              <h1>O que foi prometido para 2027–2030, e o que está sendo feito</h1>
              <p>
                {TODOS.length} compromissos tirados do Programa de Governo registrado no TSE, cada um com o trecho
                original, a página, o órgão que deve responder por ele e o caminho certo para cobrar.
              </p>
              <div className="notice">
                <i />
                <span>
                  O novo mandato começa em {INICIO_MANDATO}. Alguns compromissos já avançaram antes da posse e
                  aparecem com o status atual. Cada mudança de status entra com data e link para a fonte.
                  {atualizado ? ` Última atualização: ${atualizado.split("-").reverse().join("/")}.` : ""}
                </span>
              </div>
            </section>

            <div className="nums">
              <div className="num"><b>{TODOS.length}</b><span>compromissos acompanhados</span></div>
              <div className="num"><b>{contTipo("meta")}</b><span>com meta mensurável</span></div>
              <div className="num"><b>{contTipo("diretriz")}</b><span>diretrizes genéricas, difíceis de cobrar</span></div>
              <div className="num"><b>{dependeCongresso}</b><span>dependem de aprovação do Congresso</span></div>
            </div>

            <div style={{ marginTop: 18 }}>
              <BarraStatus lista={TODOS} />
              <div className="legend">
                {ORDEM_STATUS.map((s) => (
                  <span key={s}><span className="dot" style={{ background: `var(--s-${s})` }} />{STATUS[s].rotulo} · {contarStatus(TODOS)[s]}</span>
                ))}
              </div>
            </div>

            <section className="section">
              <h2>Por eixo do plano</h2>
              <p className="sub">O plano tem 13 eixos. Clique em um eixo para filtrar a lista.</p>
              <div className="eixos">
                {Object.entries(EIXOS).map(([k, e]) => {
                  const n = Number(k);
                  const doEixo = TODOS.filter((c) => c.eixo === n);
                  const cumpridos = doEixo.filter((c) => c.status === "cumprido").length;
                  return (
                    <button key={k} className={`eixo ${eixo === n ? "on" : ""}`} onClick={() => setEixo(eixo === n ? 0 : n)}>
                      <span className="h">{e.curto}<small>{doEixo.length}</small></span>
                      <BarraStatus lista={doEixo} />
                      <span className="n">{cumpridos} de {doEixo.length} cumpridos</span>
                    </button>
                  );
                })}
              </div>
            </section>

            <section className="section" id="lista">
              <h2>Compromissos</h2>
              <p className="sub">Busque por tema, programa ou ministério.</p>
              <div className="filters">
                <input placeholder="Buscar: creche, SUS, 6x1, Petrobras…" value={busca} onChange={(e) => setBusca(e.target.value)} aria-label="Buscar compromissos" />
                <select value={eixo} onChange={(e) => setEixo(Number(e.target.value))} aria-label="Eixo">
                  <option value={0}>Todos os eixos</option>
                  {Object.entries(EIXOS).map(([k, e]) => <option key={k} value={k}>{e.curto}</option>)}
                </select>
                <select value={tipo} onChange={(e) => setTipo(e.target.value as Tipo | "")} aria-label="Tipo">
                  <option value="">Todos os tipos</option>
                  {(Object.keys(TIPOS) as Tipo[]).map((t) => <option key={t} value={t}>{TIPOS[t].rotulo}</option>)}
                </select>
                <select value={status} onChange={(e) => setStatus(e.target.value as Status | "")} aria-label="Status">
                  <option value="">Todos os status</option>
                  {ORDEM_STATUS.map((s) => <option key={s} value={s}>{STATUS[s].rotulo}</option>)}
                </select>
                <select value={instr} onChange={(e) => setInstr(e.target.value as Instrumento | "")} aria-label="Depende de">
                  <option value="">Depende de…</option>
                  {(Object.keys(INSTRUMENTOS) as Instrumento[]).map((i) => <option key={i} value={i}>{INSTRUMENTOS[i].rotulo}</option>)}
                </select>
                {temFiltro ? <button className="clear" onClick={limpar}>Limpar filtros</button> : null}
              </div>
              <div className="count">{filtrados.length} de {TODOS.length} compromissos</div>
              <div className="list">
                {filtrados.map((c) => (
                  <button key={c.id} className="item" onClick={() => irPara(`item-${c.id.toLowerCase()}`)}>
                    <span className="t">{c.titulo}</span>
                    <StatusTag s={c.status} />
                    <span className="meta">
                      <span className={`chip tipo-${c.tipo}`}>{TIPOS[c.tipo].rotulo}</span>
                      <span className="chip">{EIXOS[c.eixo].curto}</span>
                      <span className="chip">{INSTRUMENTOS[c.instrumento].rotulo}</span>
                      <span>{c.orgao}</span>
                    </span>
                  </button>
                ))}
                {!filtrados.length && <div className="empty">Nenhum compromisso com esses filtros.</div>}
              </div>
            </section>
          </>
        )}

        {vista === "mandato-atual" && <MandatoAtual />}
        {vista === "como-cobrar" && <ComoCobrarPagina />}
        {vista === "metodologia" && <Metodologia />}
      </main>

      <footer className="foot">
        <div className="wrap">
          <span>Projeto independente, sem vínculo com governo, partido ou campanha.</span>
          <span>Fonte primária: Programa de Governo registrado no <a href={PLANO_TSE}>TSE (DivulgaCandContas)</a>.</span>
        </div>
      </footer>

      {aberto && <Detalhe c={aberto} onClose={() => irPara("")} />}
    </>
  );
}

function Detalhe({ c, onClose }: { c: CompromissoComStatus; onClose: () => void }) {
  const cobrar = comoCobrar(c);
  const [mostrarLAI, setMostrarLAI] = useState(false);
  const [copiado, setCopiado] = useState(false);
  const texto = modeloPedidoLAI(c);

  useEffect(() => {
    const esc = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", esc);
    document.body.style.overflow = "hidden";
    return () => { window.removeEventListener("keydown", esc); document.body.style.overflow = ""; };
  }, [onClose]);

  const copiar = async () => {
    try { await navigator.clipboard.writeText(texto); setCopiado(true); setTimeout(() => setCopiado(false), 2000); }
    catch { setMostrarLAI(true); }
  };

  return (
    <>
      <div className="scrim" onClick={onClose} />
      <aside className="drawer" role="dialog" aria-modal="true" aria-label={c.titulo}>
        <div className="close">
          <span>{c.id} · {EIXOS[c.eixo].curto}</span>
          <button onClick={onClose}>Fechar</button>
        </div>
        <div className="in">
          <StatusTag s={c.status} />
          <h3>{c.titulo}</h3>
          <blockquote className="quote">{c.trecho}</blockquote>
          <div className="src">Programa de Governo, página {c.pag} · Eixo {c.eixo}: {EIXOS[c.eixo].nome}</div>

          <dl className="facts">
            <dt>Tipo</dt><dd><b>{TIPOS[c.tipo].rotulo}</b>: {TIPOS[c.tipo].desc}</dd>
            <dt>Natureza</dt><dd>{NATUREZAS[c.natureza]}</dd>
            <dt>Depende de</dt><dd><b>{INSTRUMENTOS[c.instrumento].rotulo}</b>: {INSTRUMENTOS[c.instrumento].desc}</dd>
            <dt>Quem responde</dt><dd>{c.orgao}</dd>
            <dt>Como saber se foi cumprido</dt><dd>{c.verificacao}</dd>
          </dl>

          {c.situacao_plano && (
            <div className="box warn">
              <h4>Situação antes do novo mandato</h4>
              <p>{c.situacao_plano}</p>
            </div>
          )}

          <div className="box">
            <h4>Histórico</h4>
            {c.historico.length ? (
              <ul className="timeline">
                {c.historico.map((h, i) => (
                  <li key={i}>
                    <span>{h.data.split("-").reverse().join("/")}</span>
                    <span><StatusTag s={h.status} /> {h.nota} <a href={h.fonte}>Fonte</a></span>
                  </li>
                ))}
              </ul>
            ) : (
              <p style={{ margin: 0 }}>Nenhuma atualização registrada. O mandato começa em {INICIO_MANDATO}.</p>
            )}
          </div>

          <div className="box">
            <h4>Como cobrar</h4>
            <p>{cobrar.resumo}</p>
            <ul>
              {cobrar.canais.map((k) => (
                <li key={k.url}><a href={k.url}>{k.nome}</a><div>{k.quando}</div></li>
              ))}
            </ul>
            <div style={{ display: "flex", gap: 8, marginTop: 14, flexWrap: "wrap" }}>
              <button className="btn" onClick={copiar}>{copiado ? "Copiado" : "Copiar pedido pronto (LAI)"}</button>
              <button className="btn ghost" onClick={() => setMostrarLAI(!mostrarLAI)}>{mostrarLAI ? "Esconder texto" : "Ver texto"}</button>
            </div>
            {mostrarLAI && <textarea className="lai" readOnly value={texto} />}
          </div>
        </div>
      </aside>
    </>
  );
}

function ComoCobrarPagina() {
  return (
    <div className="prose">
      <section className="hero" style={{ paddingBottom: 0 }}>
        <h1>Como cobrar do jeito certo</h1>
        <p>
          Cobrar a pessoa errada não dá resultado. Uma lei parada no Senado não anda com reclamação ao ministério, e uma
          portaria atrasada não depende do Congresso. Cada compromisso deste painel diz de que tipo de decisão ele depende.
        </p>
      </section>

      <h2>1. Descubra de quem é a decisão</h2>
      <table>
        <thead><tr><th>Depende de</th><th>Quem decide</th><th>Onde cobrar</th></tr></thead>
        <tbody>
          <tr><td>Emenda constitucional ou lei</td><td>Congresso Nacional (o governo propõe e negocia)</td><td><a href={CANAIS.camara.url}>Câmara</a>, <a href={CANAIS.senado.url}>e-Cidadania</a> e parlamentares do seu estado</td></tr>
          <tr><td>Decreto ou norma</td><td>Só o Executivo</td><td><a href={CANAIS.falabr.url}>Fala.BR</a>, direto no ministério</td></tr>
          <tr><td>Execução</td><td>Ministério responsável</td><td><a href={CANAIS.falabr.url}>Fala.BR</a> e <a href={CANAIS.transparencia.url}>Portal da Transparência</a></td></tr>
          <tr><td>Orçamento</td><td>Executivo propõe, Congresso aprova, Executivo gasta</td><td><a href={CANAIS.transparencia.url}>Portal da Transparência</a>; se houver irregularidade, <a href={CANAIS.tcu.url}>TCU</a></td></tr>
          <tr><td>Internacional</td><td>Itamaraty, mas o resultado depende de outros países</td><td><a href={CANAIS.falabr.url}>Fala.BR</a> (Ministério das Relações Exteriores)</td></tr>
        </tbody>
      </table>

      <h2>2. Faça uma pergunta que exija resposta</h2>
      <p>
        A Lei de Acesso à Informação (Lei nº 12.527/2011) obriga o órgão a responder em até 20 dias, prorrogáveis por mais 10.
        Uma pergunta específica (o que foi feito, qual é o cronograma, quanto foi gasto) é mais difícil de contornar do que
        uma reclamação genérica. Cada compromisso tem um botão <b>Copiar pedido pronto (LAI)</b> com o trecho do plano e a
        página. É só colar no Fala.BR.
      </p>

      <h2>3. Publique a resposta</h2>
      <p>
        Uma resposta oficial é uma fonte. Se o órgão responder com datas e atos, ela serve para atualizar o status do
        compromisso aqui. Se não responder no prazo, cabe recurso, e a falta de resposta também é informação.
      </p>

      <h2>Canais</h2>
      <ul>
        {Object.values(CANAIS).map((k) => (
          <li key={k.url}><a href={k.url}>{k.nome}</a>: {k.quando}</li>
        ))}
      </ul>
    </div>
  );
}

function Metodologia() {
  return (
    <div className="prose">
      <section className="hero" style={{ paddingBottom: 0 }}>
        <h1>Metodologia</h1>
        <p>
          A credibilidade do painel depende de aplicar o mesmo critério a tudo. Um item não cumprido aparece com o mesmo
          destaque que um cumprido.
        </p>
      </section>

      <h2>De onde vêm os compromissos</h2>
      <p>
        A fonte é o documento &quot;Diretrizes para o Programa de Transformação do Brasil&quot;, registrado no TSE em agosto
        de 2026 (84 páginas, 13 eixos). Selecionamos {TODOS.length} compromissos que descrevem algo a ser feito no próximo
        mandato. Ficaram de fora o balanço do mandato atual e as declarações de princípio. Cada item cita o trecho original e
        a página, para quem quiser conferir.
      </p>

      <h3>Tipos de compromisso</h3>
      <table>
        <tbody>
          {(Object.keys(TIPOS) as Tipo[]).map((t) => (
            <tr key={t}><td style={{ width: 120 }}><b>{TIPOS[t].rotulo}</b></td><td>{TIPOS[t].desc}</td></tr>
          ))}
        </tbody>
      </table>
      <p>
        Diretrizes ficam no painel porque também fazem parte do que foi prometido. Mas, como não têm alvo, só podem ser
        avaliadas pelo andamento, nunca como cumpridas de forma definitiva.
      </p>

      <h3>Status</h3>
      <table>
        <tbody>
          {ORDEM_STATUS.map((s) => (
            <tr key={s}><td style={{ width: 170 }}><StatusTag s={s} /></td><td>{STATUS[s].desc}</td></tr>
          ))}
        </tbody>
      </table>

      <h3>Regras de atualização</h3>
      <ul>
        <li>Toda mudança de status precisa de um link para a fonte. A preferência é por fonte oficial (Diário Oficial, Agência Senado ou Câmara, painéis do governo, respostas via LAI, relatórios de órgãos de controle). Na falta dela, vale reportagem de veículo reconhecido, que será trocada pela fonte oficial assim que houver uma.</li>
        <li>Anúncio não é entrega. Um programa lançado vira &quot;Em andamento&quot;, e só passa a &quot;Cumprido&quot; quando o resultado descrito no plano for verificável.</li>
        <li>Cada atualização fica registrada com data, nota e link, e o histórico completo aparece em cada compromisso.</li>
      </ul>

      <h3>Limitações</h3>
      <ul>
        <li><b>O plano não nomeia responsáveis.</b> O campo &quot;Quem responde&quot; indica o órgão que hoje tem essa atribuição. Se a estrutura de ministérios mudar em 2027, o campo será revisado.</li>
        <li><b>A seleção é editorial.</b> Outra equipe poderia separar o plano de outra forma. Sugestões de inclusão ou correção são bem-vindas.</li>
        <li><b>Alguns resultados não dependem só do governo</b>, como juros (Banco Central), leis (Congresso) e acordos internacionais. Isso está indicado em cada item.</li>
      </ul>
    </div>
  );
}

function MandatoAtual() {
  type St = "cumprido" | "parcial" | "descumprido";
  const placares = mandatoAtual.placares;
  const itens = mandatoAtual.itens as { titulo: string; status: St; nota: string; fonte: string }[];
  const fmt = (d: string) => d.split("-").reverse().join("/");
  return (
    <div>
      <section className="hero" style={{ paddingBottom: 0 }}>
        <h1>O mandato 2023–2026: o que foi cumprido das promessas de 2022</h1>
        <p>
          Este painel não refaz a contagem do mandato atual. Ela já é feita por veículos com metodologia publicada, que
          chegam a números diferentes porque contam promessas diferentes. Abaixo estão os dois balanços e os itens que
          conseguimos confirmar um a um, cada um com fonte.
        </p>
      </section>

      <section className="section">
        <h2>Balanços independentes</h2>
        <p className="sub">Os números não são comparáveis entre si: cada um usa uma lista e um critério diferentes.</p>
        <div className="eixos" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))" }}>
          {placares.map((p) => {
            const partes: [string, number, string][] = [
              ["cumprido", p.cumprido, "Cumpridas"],
              ["parcial", p.parcial, "Em parte"],
              ["em_andamento", p.andamento, "Não concluídas"],
              ["descumprido", p.descumprido, "Não cumpridas"],
            ];
            return (
              <div key={p.fonte} className="num" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "baseline" }}>
                  <b style={{ fontSize: 20 }}>{p.fonte}</b>
                  <span>{fmt(p.data)}</span>
                </div>
                <div style={{ fontFamily: "var(--serif)", fontSize: 30, fontWeight: 600, lineHeight: 1 }}>
                  {p.cumprido}<span style={{ fontSize: 16, color: "var(--muted)", fontWeight: 500 }}> de {p.total} cumpridas</span>
                </div>
                <div className="bar">
                  {partes.map(([k, n]) => n ? <div key={k} style={{ width: `${(n / p.total) * 100}%`, background: `var(--s-${k})` }} /> : null)}
                </div>
                <div className="legend" style={{ marginTop: 0 }}>
                  {partes.filter(([, n]) => n).map(([k, n, r]) => (
                    <span key={k}><span className="dot" style={{ background: `var(--s-${k})` }} />{r} · {n}</span>
                  ))}
                </div>
                <span>{p.recorte}</span>
                <span style={{ color: "var(--ink)" }}>{p.nota}</span>
                <a href={p.url} style={{ fontSize: 13 }}>Ver a fonte</a>
              </div>
            );
          })}
        </div>
      </section>

      <section className="section">
        <h2>Promessas confirmadas item a item</h2>
        <p className="sub">
          Só entram aqui as promessas com status confirmado em fonte própria. A lista completa das 36 promessas está no
          projeto Promessas dos Políticos, do g1.
        </p>
        <div className="list">
          {itens.map((i) => (
            <div key={i.titulo} className="item" style={{ cursor: "default" }}>
              <span className="t">{i.titulo}</span>
              <StatusTag s={i.status} />
              <span className="meta" style={{ display: "block" }}>
                {i.nota} <a href={i.fonte}>Fonte</a>
              </span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
