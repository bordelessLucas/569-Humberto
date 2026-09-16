# Checklist de sprints

O painel funcional está no ar localmente, com Tailwind e persistência no Firestore. As telas não mudam quando o banco mudar. O PostgreSQL substitui `src/services/database/`. O modo `real` continua reservado ao backend.

Ordem de implementação (fonte: `contexto.md` §15): domínio → Edge Agent → histórico → dashboard → cadastros → relatórios → robustez → novos adapters.

## Feito

- [x] Vite + React + TypeScript estrito, Tailwind, TanStack Query
- [x] Administrador, Operador, Auditor e Gestor, com matriz de acesso e 21 rotas
- [x] Contrato REST, cliente HTTP e mock
- [x] Firestore como banco desta fase, com Auth por e-mail. Senha fora do banco
- [x] Perfis de teste `admin@lock.com`, `operador@lock.com`, `auditor@lock.com`, `gestor@lock.com`
- [x] Modo demonstração da chegada do Caminhão 17
- [x] Interface em preto, branco, cinza e vermelho, com a logo no quadro da sidebar
- [x] Dashboard admin: KPIs, visão de garagens e relatório do dia (ainda com dados mock)
- [x] **Etapa 1 — domínio:** `ClientCompany`, veículo sem base fixa, histórico incremental, retenção auto desligada
- [x] **Manuais MC904:** confirmado que é o MDVR **do veículo** (MettaX), não o roteador da garagem
- [x] **Etapa 2 — adapter parcial:** `src/services/edge/adapters/mettax-mc904.ts` com capacidades do datasheet (`ready: false` até API de transferência)
- [x] Seed/UI alinhados a modelo **MC904** e 4 câmeras
- [x] **Etapa 3 — histórico (modelo):** seed + detalhe do veículo; dashboard considera backlog
- [x] **Pipeline de chegada:** Wi-Fi → identificar → validar → pendências → download (simulado) → disco da base → dashboard (`GarageArrivalPanel`)
- [x] Fronteira explícita: análise por terceiros **fora do escopo**
- [x] Arquitetura oficial Agent outbound (`analise_arquitetura_garage_agent.md`)
- [x] Spec `agent-api@v1` + stub Docker documentada (`spec_agent_api_v1_stub.md`) — sem JT/T

## Bloqueado / próximo

### Edge Agent — stub Docker (agora)

- [ ] Implementar pasta `agent/` + Dockerfile + cliente do contrato (`spec_agent_api_v1_stub.md`)
- [ ] Mock da API (`activate` / `heartbeat` / `events` / `commands`)
- [ ] Stub: ciclo simulado + volume `/data/garage-media` + pause/resume/force

### Edge Agent — transferência real (depois do stub)

- [ ] Spec/SDK/API **JT/T1078** (ou CMS MettaX) — spike
- [ ] Hardware MC904 na LAN para validar descoberta/transferência
- [ ] Serviço deployável de produção na base
- [ ] Esclarecer se “TRX-904” é o mesmo que MC904

### Etapas 5–8

- [ ] Cadastros e autorização endurecidos
- [ ] Relatórios com filtros e exportação
- [ ] Robustez (retry, retomada, multi-veículo)
- [ ] Novos adapters

### Paralelo (painel / infra)

- [ ] Rodar a demonstração com o cliente e corrigir o fluxo
- [ ] Fechar retenção, proteção de arquivo, visão admin de todas as bases
- [ ] Fechar exportação, canal de alerta, stream vs download no painel
- [ ] Restringir `firestore.rules` por coleção e papel
- [ ] Impedir que o reinício da demo apague cadastro feito na mão
- [ ] Desativar usuário também no Firebase Auth
- [ ] Publicar o SPA
- [ ] Trocar banco para PostgreSQL só depois do alinhamento
