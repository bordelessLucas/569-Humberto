# Spec — `agent-api@v1` + Agent stub (Docker)

**Status:** próximo passo oficial de engenharia (consenso Edge + Cloud).  
**Escopo:** contrato versionado + stub do Garage Agent em Docker.  
**Fora deste doc:** JT/T808/1078 real, FFmpeg, FTP de vídeo, exportador terceirizada, instalador Windows/Linux de produção.

Fonte de decisão: `docs-ia/analise_arquitetura_garage_agent.md` §11 e §15.

---

## 1. Objetivo

Entregar, **sem hardware MC904**:

1. Contrato HTTP estável **Agent ↔ API cloud** (`agent-api@v1`).  
2. **Agent stub** em Docker que: ativa/registra, faz heartbeat, emite eventos simulados, puxa e acusa comandos.  
3. Permitir que o painel (hoje mock/Firestore) evolua para consumir o mesmo schema quando o backend real existir.

Política de produto já fechada:

- Sync de chegada = **autônoma no Agent** (edge-initiated).  
- Cloud = observe + policy + `PAUSE` / `RESUME` / `RETRY` / `FORCE_SYNC`.  
- Mídia **não** sobe para a nuvem.

---

## 2. Princípios do contrato

| Princípio | Regra |
| --- | --- |
| Versão | Prefixo `/v1/agent/...` (ou header `X-Agent-Api: v1`) |
| Direção | Agent **sempre** inicia conexão (outbound HTTPS). Sem porta inbound na garagem. |
| Auth | Token de Agent emitido no `activate` / `register`; renovação via heartbeat se necessário |
| Idempotência | `sessionId`, `eventId`, `commandId` estáveis; retries seguros |
| Origem | Campo `origin`: `simulado` (stub) \| `device` (MC904 real, futuro) |
| Sem mídia | Nenhum endpoint aceita upload de vídeo/imagem |
| Modelo flexível | Eventos e heartbeat devem aceitar múltiplos adapters/modelos sem acoplar o contrato a MC904, Hikvision ou MC401 |

---

## 3. Endpoints — Agent → API (cloud)

### 3.1 Ativação / registro

`POST /v1/agent/activate`

Request:

```json
{
  "activationCode": "BRD-X7K2-P91A",
  "agentId": "stub-docker-01",
  "version": "0.1.0-stub",
  "hostname": "garage-stub",
  "os": "linux"
}
```

Response `200`:

```json
{
  "garageId": "garage-centro",
  "tenantId": "lock-demo",
  "token": "<agent-jwt-or-opaque>",
  "apiBaseUrl": "https://api.example.com",
  "config": {
    "heartbeatSeconds": 10,
    "commandsWaitSeconds": 25,
    "storagePath": "/data/garage-media"
  }
}
```

Erros: `400` código inválido · `409` agent já vinculado · `401` código expirado.

Alternativa de re-registro (já ativado): `POST /v1/agent/register` com `token` + `agentId` + `version`.

---

### 3.2 Heartbeat

`POST /v1/agent/heartbeat`  
Header: `Authorization: Bearer <token>`

```json
{
  "agentId": "stub-docker-01",
  "garageId": "garage-centro",
  "version": "0.1.0-stub",
  "status": "online",
  "uptimeSeconds": 3600,
  "storage": {
    "path": "/data/garage-media",
    "capacityBytes": 5000000000000,
    "usedBytes": 1200000000000,
    "alert": false
  },
  "capabilities": {
    "transfer": "unknown",
    "adapters": [
      {
        "adapterId": "hikvision-ae-md5043-isapi",
        "manufacturer": "Hikvision",
        "models": ["AE-MD5043-SD/I/GLF/WI58"],
        "mode": "pull-lan",
        "protocol": "ISAPI",
        "transfer": "candidate"
      },
      {
        "adapterId": "mettax-jtt1078",
        "manufacturer": "MettaX Digital",
        "models": ["MC904", "MC401"],
        "mode": "terminal-initiated",
        "protocol": "JT/T808+JT/T1078+FTP",
        "transfer": "spike-required"
      }
    ],
    "ffmpeg": false,
    "thirdPartyExport": false
  },
  "devicesConnected": 0,
  "activeSessions": 0
}
```

`capabilities.transfer`: `unknown` \| `proven` \| `unsupported` (stub = `unknown` até spike MC904).
Adapters conhecidos nesta fase:

| Adapter | Status |
| --- | --- |
| `hikvision-ae-md5043-isapi` | Primeiro candidato a adapter real; validar endpoints ISAPI no firmware |
| `mettax-jtt1078` | Spike MC904/MC401; provar comandos históricos e FTP local em hardware |
| `hcnet-sdk` | Fallback Hikvision se ISAPI estiver limitado; depende de SDK nativo |

Response `200`: `{ "ok": true, "serverTime": "<iso>" }`  
Opcional: embutir `commands[]` curtas no heartbeat (além do long-poll).

---

### 3.3 Eventos (batch)

`POST /v1/agent/events`  
Header: `Authorization: Bearer <token>`

```json
{
  "agentId": "stub-docker-01",
  "garageId": "garage-centro",
  "events": [
    {
      "eventId": "evt_01HXYZ",
      "type": "device.seen",
      "at": "2026-09-16T18:00:00-03:00",
      "origin": "simulado",
      "payload": {
        "deviceId": "dev-stub-17",
        "serial": "MC904-STUB-17",
        "manufacturer": "MettaX",
        "model": "MC904",
        "adapterId": "mettax-mc904",
        "ip": "10.20.17.4",
        "mac": "AA:10:20:00:17:04",
        "vehicleId": "veh-17"
      }
    }
  ]
}
```

#### Tipos obrigatórios no stub

| `type` | Quando o stub emite |
| --- | --- |
| `agent.online` | Após activate bem-sucedido |
| `device.seen` | Início de ciclo simulado de chegada |
| `device.left` | Fim do ciclo / timeout |
| `auth.decision` | Após “validação” (allow/deny) |
| `session.started` | Abre sessão de sync |
| `session.progress` | % e bytes |
| `session.paused` | Se comando PAUSE |
| `session.failed` | Erro simulado ou comando |
| `session.completed` | 100% |
| `file.indexed` | Por arquivo “gravado” localmente (path opaco) |
| `storage.health` | No heartbeat ou periódico |
| `agent.degraded` | Disco cheio / fila travada (opcional no stub) |

#### Payload mínimo de sessão (progress/completed/failed)

```json
{
  "sessionId": "sync_stub_001",
  "vehicleId": "veh-17",
  "deviceId": "dev-stub-17",
  "cameraIds": ["cam-veh-17-1", "cam-veh-17-2"],
  "windowStart": "2026-09-16T08:00:00-03:00",
  "windowEnd": "2026-09-16T17:00:00-03:00",
  "progressPercent": 66,
  "bytesTransferred": 2100000000,
  "bytesTotal": 3200000000,
  "attempt": 1,
  "errorCode": null,
  "origin": "simulado"
}
```

Response `202`: `{ "accepted": 1, "duplicates": 0 }`

---

### 3.4 Policy (pull)

`GET /v1/agent/policy`  
Header: `Authorization: Bearer <token>`

```json
{
  "version": 3,
  "fetchedAt": "2026-09-16T18:01:00-03:00",
  "ttlSeconds": 300,
  "vehicles": [
    { "vehicleId": "veh-17", "allowed": true, "priority": 1 }
  ],
  "devices": [
    { "deviceId": "dev-stub-17", "vehicleId": "veh-17", "allowed": true }
  ]
}
```

Stub: se cloud offline, usa **última policy em cache** (arquivo local).

---

## 4. Endpoints — API → Agent (comandos via pull outbound)

### 4.1 Long-poll / fila

`GET /v1/agent/commands?waitSeconds=25`  
Header: `Authorization: Bearer <token>`

Response `200` (vazio ou lista):

```json
{
  "commands": [
    {
      "commandId": "cmd_01",
      "type": "FORCE_SYNC",
      "issuedAt": "2026-09-16T18:05:00-03:00",
      "expiresAt": "2026-09-16T18:15:00-03:00",
      "payload": { "vehicleId": "veh-17" }
    }
  ]
}
```

Fallback sem WSS: este long-poll. WSS opcional depois, mesmo schema de comando.

### 4.2 Ack

`POST /v1/agent/commands/{commandId}/ack`

```json
{
  "status": "accepted",
  "at": "2026-09-16T18:05:01-03:00",
  "detail": null
}
```

`status`: `accepted` \| `rejected` \| `done` \| `failed`

### 4.3 Comandos suportados no stub (MVP-A)

| `type` | Efeito no stub |
| --- | --- |
| `PAUSE_SESSION` | Pausa progresso simulado; emite `session.paused` |
| `RESUME_SESSION` | Retoma |
| `RETRY_SESSION` | Reinicia sessão failed |
| `FORCE_SYNC` | Dispara ciclo completo simulado (mesmo sem “chegada”) |
| `REFRESH_POLICY` | Força `GET /policy` |
| `SET_PRIORITY` | Ajusta ordem na fila local (log + evento) |

**Explicitamente fora do happy path:** `START_DOWNLOAD` como gatilho diário (chegada é local).

---

## 5. Agent stub — comportamento Docker

### 5.1 O que o stub faz

1. Lê env (`AGENT_API_BASE`, `ACTIVATION_CODE`, `AGENT_ID`, `STORAGE_PATH`).  
2. Chama `activate` (ou usa token persistido).  
3. Loop: heartbeat a cada N s + long-poll de commands.  
4. Ciclo **simulado** de chegada (timer ou `FORCE_SYNC`): emite a sequência de eventos da §3.3.  
5. Escreve arquivos **placeholder** em `$STORAGE_PATH` (ex. `.bin` vazio ou texto) e emite `file.indexed` com `localPath` opaco.  
6. **Não** fala JT/T, **não** abre socket para MC904, **não** usa FFmpeg.

### 5.2 Layout sugerido no monorepo (futuro)

```text
agent/
  Dockerfile
  docker-compose.yml      # stub + api-mock opcional
  README.md
  src/
    main.ts               # runtime loop
    client/agent-api.ts   # HTTP client do contrato
    state/local-store.ts  # token, policy cache, sessions
    sim/arrival.ts        # ciclo simulado
```

Nesta fase o doc define o **contrato e o comportamento**; a pasta `agent/` pode ser criada na sprint de implementação.

### 5.3 Variáveis de ambiente

| Env | Exemplo | Uso |
| --- | --- | --- |
| `AGENT_API_BASE` | `http://host.docker.internal:8787` | Base da API |
| `ACTIVATION_CODE` | `BRD-DEMO-0001` | Ativação |
| `AGENT_ID` | `stub-docker-01` | Id estável |
| `STORAGE_PATH` | `/data/garage-media` | Volume Docker |
| `HEARTBEAT_SECONDS` | `10` | Override |
| `SIM_ARRIVAL_SECONDS` | `120` | Intervalo do ciclo simulado (0 = só FORCE_SYNC) |
| `ORIGIN` | `simulado` | Fixo no stub |

### 5.4 `docker-compose` (alvo)

```yaml
services:
  garage-agent-stub:
    build: ./agent
    environment:
      AGENT_API_BASE: http://agent-api-mock:8787
      ACTIVATION_CODE: BRD-DEMO-0001
      AGENT_ID: stub-docker-01
      STORAGE_PATH: /data/garage-media
      SIM_ARRIVAL_SECONDS: "60"
    volumes:
      - garage-media:/data/garage-media
    restart: unless-stopped

  # Opcional na mesma compose: mock HTTP que implementa agent-api@v1
  agent-api-mock:
    image: # a definir na implementação
    ports:
      - "8787:8787"

volumes:
  garage-media:
```

### 5.5 Critérios de aceite do stub

- [ ] `activate` → token persistido em volume  
- [ ] Heartbeat contínuo com `capabilities.transfer=unknown`  
- [ ] Sem API: stub continua ciclo local e bufferiza eventos; ao voltar, `POST /events` reconcilia  
- [ ] `FORCE_SYNC` via commands → ciclo completo de eventos  
- [ ] `PAUSE` / `RESUME` alteram progresso simulado  
- [ ] Arquivos placeholder em `/data/garage-media` + `file.indexed`  
- [ ] Zero dependência de JT/T, MC904 ou FFmpeg  

---

## 6. Alinhamento com o painel atual

| Hoje (SPA) | Depois desta spec |
| --- | --- |
| `startGarageIngest` mock in-process | Stub Docker emite os mesmos conceitos via `/events` |
| `origin: simulado` | Mantém até adapter real |
| Dashboard KPIs | Passam a projetar sessões vindas dos eventos (quando API real) |

Não é obrigatório plugar o SPA no stub no mesmo PR — mas o **schema de evento/sessão** deve ser o mesmo que o domínio já usa (`sessionStatus`, progresso, vehicleId, garageId).

---

## 7. Explicitamente fora (não implementar neste passo)

- JT/T808 / JT/T1078 / CMS MettaX  
- Hikvision AE-MD5043 real / ISAPI / SDK Hikvision  
- MC401 real / app de configuração / leitura de Micro SD  
- Discovery real de IP/MAC na LAN  
- FFmpeg / corte 15 min  
- FTP (upgrade ou “vídeo”)  
- ThirdPartyExporter  
- Instalador `.exe` / `.deb` de produção  
- Upload de mídia para Firebase/S3  

---

## 8. Ordem de implementação desta spec

1. Congelar este documento como `agent-api@v1` (review + merge).  
2. Criar `agent/` + Dockerfile + cliente HTTP do contrato.  
3. Mock mínimo da API (`agent-api-mock`) ou handlers no backend de fase.  
4. Stub: activate → heartbeat → events simulados → commands.  
5. Teste manual: `docker compose up` + inspecionar eventos/heartbeat.  
6. Só então: discovery LAN + spike MC904 (fora deste doc).

---

## 9. Referências

- `docs-ia/analise_arquitetura_garage_agent.md` — decisões oficiais  
- `docs-ia/contexto.md` — produto Full Lock  
- `src/services/edge/` — esqueleto in-process (não substitui o stub Docker)  
- Manuais MC904 em `arquivosContext/` — spike futuro, não este passo  
