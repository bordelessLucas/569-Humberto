# Garage Agent stub

Stub Docker do `agent-api@v1` para validar o fluxo Full Lock sem hardware real.

Ele faz:

- `activate` ou reutiliza token persistido em `/data/garage-media/.agent-state.json`
- heartbeat com capacidades estruturadas de adapters
- long-poll de comandos
- ciclo simulado de chegada por timer ou `FORCE_SYNC`
- eventos `device.seen`, `auth.decision`, `session.*`, `file.indexed`, `device.left`
- arquivos placeholder no volume local
- buffer local de eventos quando a API fica indisponivel
- registry interno de adapters candidatos

Ele nao faz:

- JT/T808 ou JT/T1078 de producao
- descoberta real de IP/MAC
- download real do Hikvision/MettaX
- FFmpeg
- upload de video

## Adapters candidatos

| Adapter | Modo | Status |
| --- | --- | --- |
| `hikvision-ae-md5043-isapi` | Agent faz pull pela LAN/Wi-Fi via ISAPI | Primeiro caminho real planejado; depende de capability probe no firmware |
| `mettax-jtt1078` | Equipamento inicia sessao JT/T; Agent comanda historico e recebe por FTP local | Spike obrigatorio com hardware MC904/MC401 |

Regras:

- RTSP nao conta como download historico.
- FTP de upgrade de firmware nao conta como API de video.
- FTP para video so entra no fluxo MettaX via JT/T1078 `0x9206`.
- Videos permanecem no storage local da garagem.

## Rodar

```bash
cd agent
docker compose up --build
```

## API mock

O `agent-api-mock` expoe:

- `POST /v1/agent/activate`
- `POST /v1/agent/register`
- `POST /v1/agent/heartbeat`
- `POST /v1/agent/events`
- `GET /v1/agent/policy`
- `GET /v1/agent/commands?waitSeconds=25`
- `POST /v1/agent/commands/:commandId/ack`
- `POST /mock/commands` para enfileirar comandos manualmente
- `GET /mock/state` para inspecionar heartbeats, eventos e comandos

Exemplo de comando:

```bash
curl -X POST http://localhost:8787/mock/commands \
  -H "content-type: application/json" \
  -d "{\"type\":\"FORCE_SYNC\",\"payload\":{\"vehicleId\":\"veh-17\"}}"
```
