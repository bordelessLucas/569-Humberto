# Auditoria UI/UX — Dashboard (Full Lock)

Auditoria visual/UX do dashboard. Escopo: polir apresentação. **Não** alterar regras de negócio, papéis, pipeline de ingestão ou dados.

Leitura de design: painel operacional B2B Lock Brasil — P&B + vermelho só para sinal; densidade de cockpit moderada; Inter; raio 8px.

## Achados (prioridade)

### P0 — Clareza e hierarquia
1. KPI deveria liderar a página; painéis de ação (chegada / demo) competem no topo e empurram o status operacional para baixo.
2. Dois painéis de “simular chegada” (GarageArrival + Demo) no admin confundem qual fluxo usar.
3. Ledes longos misturam escopo de produto com operação do dia.

### P0 — Acessibilidade
4. Selects da chegada: `label` sem `htmlFor`/`id` explícitos; falta `name`.
5. Status da ingestão sem `aria-live` (atualização assíncrona).
6. Progress bars decorativas sem `aria-hidden` / valor anunciado de forma clara.
7. Tabela: `th` sem `scope="col"`; `key={index}` frágil; thead não sticky em scroll horizontal.
8. Loading genérico (“Carregando…”) sem estrutura; erro sem próximo passo.

### P1 — Sistema visual
9. KPI usa emerald/sky ad-hoc; design system pede success/info/warning/danger/brand.
10. Cards `rounded-2xl` vs DS (8px); chips de status `rounded-md` vs pill do DS.
11. Números de KPI sem `tabular-nums`; `padStart(2,'0')` estranho para totais ≥100.
12. % sob cada KPI sem contexto (“do quê?”) — ruído.
13. Motivo no relatório de falhas quebra layout em mobile (sem truncate/line-clamp).

### P1 — Densidade e ritmo
14. Espaçamento vertical irregular entre seções; headers de seção repetem o mesmo bloco sem alinhamento visual com o restante.
15. Demo: chips em wrap criam “nuvem” ilegível; falta `aria-current` no passo ativo.
16. ProgressBar estreita (`w-28`) na tabela some em telas estreitas.

### P2 — Microcopy e polish
17. CTA “Veículo entrou no Wi-Fi” ok; estados disabled sem feedback visual forte.
18. Nota de terceiros compete com status da ingestão — rebaixar hierarquia tipográfica.
19. Links de seção sem `focus-visible` explícito além do browser default.
20. Empty state de falhas ok; poderia reforçar tom operacional (“Nada pendente hoje”).

## Status

Implementado no front (sem mudança de lógica de domínio/API). Ver diff de `DashboardPage`, `GarageArrivalPanel`, `DemoPanel`, `ui.tsx`, `index.css`.
