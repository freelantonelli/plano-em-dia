import type { Compromisso, Instrumento } from "./dados";

export interface Canal {
  nome: string;
  url: string;
  quando: string;
}

export const CANAIS = {
  falabr: {
    nome: "Fala.BR (ouvidoria e Lei de Acesso à Informação)",
    url: "https://falabr.cgu.gov.br",
    quando: "Para perguntar ao ministério responsável o que já foi feito e qual é o cronograma. Pedidos via LAI têm prazo legal de 20 dias, prorrogáveis por mais 10.",
  },
  camara: {
    nome: "Câmara dos Deputados",
    url: "https://www.camara.leg.br",
    quando: "Para achar a proposta, ver quem é o relator e em qual comissão ela está, e contatar os deputados do seu estado.",
  },
  senado: {
    nome: "e-Cidadania do Senado",
    url: "https://www12.senado.leg.br/ecidadania",
    quando: "Para opinar sobre propostas em tramitação e enviar mensagens aos senadores.",
  },
  transparencia: {
    nome: "Portal da Transparência",
    url: "https://portaldatransparencia.gov.br",
    quando: "Para conferir quanto foi previsto e quanto foi gasto em cada programa.",
  },
  tcu: {
    nome: "Ouvidoria do TCU",
    url: "https://portal.tcu.gov.br/ouvidoria",
    quando: "Para denunciar uso irregular de recursos federais ou obra parada sem justificativa.",
  },
  participa: {
    nome: "Brasil Participativo",
    url: "https://brasilparticipativo.presidencia.gov.br",
    quando: "Para participar de consultas públicas e do processo do PPA.",
  },
} satisfies Record<string, Canal>;

const POR_INSTRUMENTO: Record<Instrumento, { resumo: string; canais: Canal[] }> = {
  pec: {
    resumo: "Quem decide é o Congresso. Pressão sobre relator, presidentes das Casas e bancada do seu estado tem mais efeito do que sobre o ministério.",
    canais: [CANAIS.camara, CANAIS.senado, CANAIS.falabr],
  },
  lei: {
    resumo: "Primeiro, confira se o governo já enviou o projeto. Se não enviou, cobre o ministério. Se enviou, cobre o Congresso.",
    canais: [CANAIS.falabr, CANAIS.camara, CANAIS.senado],
  },
  regulamentacao: {
    resumo: "O Executivo pode fazer isso sozinho, então a responsabilidade é inteira do ministério. Peça o cronograma por escrito.",
    canais: [CANAIS.falabr, CANAIS.participa],
  },
  execucao: {
    resumo: "Depende de gestão. Pergunte ao ministério quais números e prazos estão sendo usados para medir o andamento.",
    canais: [CANAIS.falabr, CANAIS.transparencia],
  },
  orcamento: {
    resumo: "Dinheiro previsto não é dinheiro gasto. Compare a dotação com a execução e, se houver obra parada, acione o TCU.",
    canais: [CANAIS.transparencia, CANAIS.falabr, CANAIS.tcu],
  },
  internacional: {
    resumo: "O resultado depende de outros países. Dá para cobrar as iniciativas brasileiras, não o desfecho.",
    canais: [CANAIS.falabr, CANAIS.camara],
  },
};

export function comoCobrar(c: Compromisso) {
  return POR_INSTRUMENTO[c.instrumento];
}

export function modeloPedidoLAI(c: Compromisso): string {
  return `Com base na Lei nº 12.527/2011 (Lei de Acesso à Informação), solicito ao(à) ${c.orgao} as seguintes informações sobre o compromisso abaixo, que consta do Programa de Governo registrado no TSE (pág. ${c.pag}):

"${c.trecho}"

1. Quais ações já foram realizadas para cumprir este compromisso, com datas e atos oficiais (decretos, portarias, editais, contratos)?
2. Qual é o cronograma previsto para a conclusão?
3. Qual é a unidade responsável e qual indicador está sendo usado para medir o andamento?
4. Qual é o valor previsto e o valor executado no orçamento para esta ação, se houver?

Peço que a resposta seja enviada em formato digital.`;
}
