# Checklist de sprints

A ordem antiga, que ia direto para Firebase Auth e cadastro no Firestore, foi substituída pelo contrato REST. O mock cobre o escopo funcional. A produção troca a implementação, não a tela.

## Sprint 0 — Setup

- [x] Vite + React + TypeScript estrito
- [x] Pastas de apresentação, domínio e serviços
- [x] Firebase isolado em `src/services/firebase.ts`, fora do fluxo de dados
- [x] Memory bank

## Sprint 1b — Perfis e 21 telas

- [x] Administrador, Operador, Auditor e Gestor, com matriz de acesso
- [x] Rotas do painel, da conexão ao player, sem módulo separado de placa
- [x] Fila com pausa, retomada e nova tentativa. Sem botão de converter MP4
- [x] Auditoria de câmeras com lacuna da CAM02
- [x] Logo Lock Brasil e tokens alinhados à marca

## Sprint 1 — Contrato, mock e demonstração

- [x] Contratos REST em `src/services/api/contracts.ts`
- [x] Cliente HTTP pronto para o mesmo contrato
- [x] Mock API, dados simulados e TanStack Query
- [x] Modo demonstração: chegada, fila, interrupção, retomada, MP4, 15 min, auditoria, lacuna, alerta, arquivo disponível
- [x] Telas dos blocos de captura e de processamento, lendo só o API client

## Sprint 2 — Ajuste com o cliente

- [ ] Rodar a demonstração com o cliente e corrigir o fluxo que ele não reconhecer
- [ ] Fechar papel Operador, prazo de retenção, formato de exportação e se o vídeo é stream ou download
- [ ] Confirmar datasheet, SDK, API ou CMS do TRX-904

## Sprint 3 — Backend real

- [ ] Implementar os mesmos paths do contrato
- [ ] Autorização no backend
- [ ] PostgreSQL para cadastro, histórico, índice e relatórios
- [ ] Fila de trabalho no servidor
- [ ] WebSocket em `/realtime` com os tipos de evento já nomeados no contrato
- [ ] Trocar `VITE_API_MODE` para `real`

## Sprint 4 — Garagem e equipamento

- [ ] Agente na rede da garagem
- [ ] Storage real, FFmpeg e FFprobe
- [ ] DeviceAdapter
- [ ] Integração TRX-904, só depois da confirmação do fabricante
