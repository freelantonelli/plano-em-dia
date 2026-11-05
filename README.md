# Plano em Dia

Acompanhamento independente do Programa de Governo 2027–2030 registrado no TSE.

## Rodar

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # gera o site estático em out/
```

Publicar na Vercel: importar o repositório. Não precisa de configuração, o site é 100% estático.

## Dados

- `data/compromissos.json`: os compromissos extraídos do plano (trecho original, página, tipo, instrumento, órgão, como verificar). Só muda se o plano for reinterpretado.
- `data/atualizacoes.json`: o histórico de status. Para mudar o status de um item, **adicione** um registro, sem editar os anteriores:

```json
{ "id": "TRA-01", "data": "2027-03-10", "status": "no_congresso", "nota": "Proposta pautada na CCJ do Senado.", "fonte": "https://www25.senado.leg.br/..." }
```

O status atual é o registro mais recente. Status válidos: `nao_iniciado`, `em_andamento`, `no_congresso`, `parcial`, `cumprido`, `descumprido`.

Regra: sem fonte oficial, sem mudança de status. O histórico do Git funciona como registro de auditoria.

## Estrutura

- `app/page.tsx`: as telas (painel, detalhe, como cobrar, metodologia), com rotas por `#hash`
- `lib/dados.ts`: tipos, rótulos e cálculo do status
- `lib/cobrar.ts`: canais de cobrança por instrumento e modelo de pedido via LAI
