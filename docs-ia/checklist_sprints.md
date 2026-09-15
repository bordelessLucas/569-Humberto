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
- [x] **Etapa 1 — domínio:** `ClientCompany`, veículo sem base fixa (`lastSeenGarageId`), `DownloadSessionStatus` / `sessionStatus`, `VehiclePeriodHistory`, clientes Light/Enel, retenção automática desligada
- [x] **Etapa 2 — esqueleto:** `src/services/edge/` com `DeviceAdapter`, registry e adapter `pending-first-mdvr` (falha até datasheet; sem protocolo inventado)
- [x] **Etapa 3 — histórico (modelo):** seed + detalhe do veículo com períodos/backlog; dashboard considera backlog no relatório do dia
- [x] **Etapa 4 — dashboard alinhado ao domínio:** cliente, última base, backlog; **não** ligado a eventos reais do agente

## Bloqueado / próximo

### Edge Agent com hardware (continua Etapa 2)

- [ ] Datasheet / SDK / API / CMS do primeiro MDVR (TRX-904 ou o que o cliente confirmar)
- [ ] Implementar o primeiro `DeviceAdapter` real
- [ ] Serviço deployável na LAN da base (descoberta → download → disco → eventos)

### Etapas 5–8

- [ ] Cadastros e autorização endurecidos (papel Operador validado; regras Firestore por papel)
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
- [ ] Trocar banco para PostgreSQL só depois do alinhamento (contrato REST estável)
