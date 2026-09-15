# Plano — Dashboard admin (garagens, frotas e falhas do dia)

## Objetivo

O administrador vê todas as garagens e frotas no dashboard, no estilo do mock do cliente (KPIs + tabela), e um relatório do dia com o que não baixou: garagem, frota e veículo.

## Escopo desta entrega

1. Estender `DashboardSummary` com `garages` e `dailyFailures`.
2. Incluir garagem e frota em cada linha de veículo do dashboard.
3. Calcular falhas do dia a partir de status `erro` / `pendente` e transferências falhas.
4. Reconstruir `DashboardPage` para o admin: KPIs coloridos, visão por garagem, relatório de falhas, tabela da frota.
5. Operador/auditor/gestor mantêm o dashboard operacional, sem o bloco de administração multi-garagem.

## Fora desta entrega

Troca de PostgreSQL, agente TRX-904, e-mail de alerta, filtros avançados de período.

## Arquivos

- `src/domain/types.ts`
- `src/services/api/mock/handlers.ts` (`buildDashboard`)
- `src/services/api/mock/seed.ts` (garantir falha em 2 garagens no cenário demo)
- `src/presentation/pages/DashboardPage.tsx`
- `docs-ia/checklist_sprints.md` (marcar o que cobriu)
