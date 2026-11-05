import compromissosJson from "../data/compromissos.json";
import atualizacoesJson from "../data/atualizacoes.json";
import verificacoesJson from "../data/verificacoes.json";

export type Tipo = "meta" | "entrega" | "diretriz";
export type Natureza = "novo" | "continuidade" | "ampliacao";
export type Instrumento = "lei" | "pec" | "regulamentacao" | "execucao" | "orcamento" | "internacional";
export type Status =
  | "nao_iniciado"
  | "em_andamento"
  | "no_congresso"
  | "parcial"
  | "cumprido"
  | "descumprido";

export interface Compromisso {
  id: string;
  eixo: number;
  titulo: string;
  trecho: string;
  pag: number;
  tipo: Tipo;
  natureza: Natureza;
  instrumento: Instrumento;
  orgao: string;
  verificacao: string;
  situacao_plano?: string;
}

/** Cada mudança de status é um registro com data e fonte. O status atual é o último registro. */
export interface Atualizacao {
  id: string;
  data: string; // AAAA-MM-DD
  status: Status;
  nota: string;
  fonte: string; // URL
}

export interface CompromissoComStatus extends Compromisso {
  status: Status;
  historico: Atualizacao[];
  verificado_em: string;
}

export const REPO = "https://github.com/freelantonelli/plano-em-dia";
export const DIAS_PARA_DESATUALIZADO = 90;

export const EIXOS: Record<number, { nome: string; curto: string }> = {
  1: { nome: "Fortalecer a democracia, a participação social e modernizar o Estado", curto: "Democracia e Estado" },
  2: { nome: "Combater as desigualdades", curto: "Desigualdades" },
  3: { nome: "Proteger a vida com uma segurança pública mais eficiente e integrada", curto: "Segurança pública" },
  4: { nome: "Garantir o direito à educação", curto: "Educação" },
  5: { nome: "Fortalecer a saúde com equidade, inovação e soberania", curto: "Saúde" },
  6: { nome: "Ampliar o acesso à cultura e ao esporte", curto: "Cultura e esporte" },
  7: { nome: "Fortalecer o direito à cidade", curto: "Cidades" },
  8: { nome: "Promover uma economia mais sustentável, produtiva e digital", curto: "Economia" },
  9: { nome: "Segurança alimentar e produção agrícola", curto: "Alimentação e agro" },
  10: { nome: "Ampliar a segurança energética e liderar a transição de baixo carbono", curto: "Energia" },
  11: { nome: "Promover a sustentabilidade ambiental e climática", curto: "Meio ambiente" },
  12: { nome: "Valorizar o trabalho em suas múltiplas formas", curto: "Trabalho" },
  13: { nome: "Defender a soberania nacional e o protagonismo internacional", curto: "Soberania" },
};

export const STATUS: Record<Status, { rotulo: string; desc: string }> = {
  nao_iniciado: { rotulo: "Não iniciado", desc: "Nenhuma ação verificável no novo mandato ainda." },
  em_andamento: { rotulo: "Em andamento", desc: "Há ação concreta do Executivo (ato, edital, obra, orçamento), mas a entrega não foi concluída." },
  no_congresso: { rotulo: "No Congresso", desc: "Depende de votação. A proposta já foi enviada e está tramitando." },
  parcial: { rotulo: "Cumprido em parte", desc: "Parte do que foi prometido foi entregue, ou a meta foi atingida só em parte." },
  cumprido: { rotulo: "Cumprido", desc: "Entregue como descrito no plano, com fonte oficial." },
  descumprido: { rotulo: "Não cumprido", desc: "Abandonado, revertido ou com prazo vencido sem entrega." },
};

export const TIPOS: Record<Tipo, { rotulo: string; desc: string }> = {
  meta: { rotulo: "Meta", desc: "Tem número, prazo ou alvo mensurável." },
  entrega: { rotulo: "Entrega", desc: "Ação específica que existe ou não: criar, aprovar, instituir, concluir." },
  diretriz: { rotulo: "Diretriz", desc: "Intenção genérica (\"fortalecer\", \"ampliar\") sem alvo definido. Difícil de cobrar." },
};

export const NATUREZAS: Record<Natureza, string> = {
  novo: "Proposta nova",
  continuidade: "Continuidade",
  ampliacao: "Ampliação",
};

export const INSTRUMENTOS: Record<Instrumento, { rotulo: string; desc: string }> = {
  pec: { rotulo: "Emenda constitucional", desc: "Precisa de 3/5 da Câmara e do Senado, em dois turnos." },
  lei: { rotulo: "Lei", desc: "Precisa ser aprovada pelo Congresso." },
  regulamentacao: { rotulo: "Decreto ou norma", desc: "O Executivo pode fazer sozinho, por decreto, portaria ou resolução." },
  execucao: { rotulo: "Execução", desc: "Depende de gestão do Executivo: programa, sistema, serviço." },
  orcamento: { rotulo: "Orçamento", desc: "Depende de recursos na lei orçamentária e de execução." },
  internacional: { rotulo: "Internacional", desc: "Depende de negociação com outros países." },
};

export const INICIO_MANDATO = "janeiro de 2027";

const compromissos = compromissosJson as Compromisso[];
const atualizacoes = atualizacoesJson as Atualizacao[];
const verificacoes = verificacoesJson as Record<string, string>;

export function carregar(): CompromissoComStatus[] {
  return compromissos.map((c) => {
    const historico = atualizacoes
      .filter((a) => a.id === c.id)
      .sort((a, b) => a.data.localeCompare(b.data));
    const ultimo = historico[historico.length - 1];
    const datas = [verificacoes[c.id] ?? verificacoes._padrao, ...historico.map((h) => h.data)].filter(Boolean).sort();
    return { ...c, status: ultimo ? ultimo.status : "nao_iniciado", historico, verificado_em: datas[datas.length - 1] };
  });
}

export function ultimaAtualizacao(): string | null {
  if (!atualizacoes.length) return null;
  return atualizacoes.map((a) => a.data).sort().slice(-1)[0];
}
