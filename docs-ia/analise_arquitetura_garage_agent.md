# Análise da arquitetura proposta (Garage Agent + nuvem só-metadados)

Documento de captura e crítica da recomendação estrutural discutida com outro agente de IA.  
Objetivo: anotar **tudo o que importa**, avaliar **viabilidade** com pouco acesso ao servidor do cliente, e registrar **concordâncias / discordâncias** vs o `contexto.md` do Full Lock / Humberto.

**Data:** 2026-09-16  
**Atualizado:** 2026-09-16 — §11–16 substituídas por **consenso** do conselho Edge + Cloud (pendências fechadas).  
**Contexto do time:** pouco acesso físico/remoto ao servidor do cliente; precisa de sistema robusto; MDVR = MettaX MC904; vídeo não sobe para a nuvem Borderless.

---

## 1. Resumo em uma frase (da proposta)

Instalar um **Borderless Garage Agent** no servidor local da garagem que fala com a nuvem por **conexão outbound** (HTTPS/WSS), executa JT/T + download na LAN, guarda mídia **100% local**, e sobe para a nuvem **somente metadados/status/comandos**.

---

## 2. Anotações — arquitetura geral

### 2.1 Diagrama lógico (proposto)

```text
Dashboard + API + comandos  (nuvem Borderless)
          ▲
          │ HTTPS / WebSocket seguro
          │ conexão iniciada pelo CLIENTE (outbound)
          │
┌─────────┴──────────────────────────┐
│ SERVIDOR LOCAL DO CLIENTE         │
│ Borderless Garage Agent           │
│ JT/T Gateway                      │
│ Media Worker                      │
│ Banco/local metadata              │
│ Storage LOCAL                     │
│ /dados/videos  /dados/imagens     │
└─────────────┬─────────────────────┘
              │ LAN / Wi-Fi
              ▼
           MC904
```

### 2.2 Princípio de armazenamento

| Onde | O quê |
| --- | --- |
| Servidor do cliente | Arquivos pesados (vídeo/imagem) — **100%** |
| Nuvem Borderless | Só coisas leves: chegada, conexão, contagens, progresso %, última sync, uso de disco |

**Explicitamente fora da nuvem Borderless:**

- vídeo no Firebase Storage  
- imagem no S3 da Borderless  
- upload das gravações para a infraestrutura Borderless  

**Motivo citado:** custo de armazenamento + alinhamento ao requisito do cliente.

### 2.3 Diagrama físico (proposto)

```text
MC904 → Wi-Fi da garagem → Servidor LOCAL → HD/SSD/NAS do cliente
Servidor LOCAL → (só metadata/status) → Backend Borderless
```

Separação clara: mídia local; telemetria operacional na nuvem.

---

## 3. Anotações — conexão nuvem ↔ servidor do cliente

### 3.1 O problema que a proposta resolve

Faltava o “elo”: como o painel/API Borderless fala com um servidor que a Borderless **não hospeda** e ao qual o time **quase não tem acesso**.

### 3.2 Garage Agent (nome proposto)

Software instalado **permanentemente** no servidor da garagem.

No boot:

1. sobe o serviço  
2. registra-se na API (`POST /edge/register`)  
3. mantém canal com a nuvem  

Exemplo de registro:

```json
{
  "garageId": "GARAGE-001",
  "agentId": "server-garagem-01",
  "version": "1.0.4"
}
```

### 3.3 Canal de comando (preferência da proposta)

| Opção | Uso |
| --- | --- |
| **WebSocket seguro (WSS)** | Preferido — push de comandos + status |
| **Polling** `GET /edge/commands` a cada ~5s | Fallback |

**Vantagem crítica (para o nosso caso):**

- **Não** abrir o servidor do cliente para a internet  
- **Não** depender de IP público, port forward, NAT, CGNAT, DNS dinâmico  

Modelo errado (evitar):

```text
Internet → porta aberta → servidor cliente
```

Modelo certo (proposto):

```text
servidor cliente → internet → API Borderless  (outbound 443)
```

Redes empresariais quase sempre permitem HTTPS outbound.

### 3.4 Comando remoto (exemplo)

Dashboard vê: servidor online, versão, disco livre, heartbeat, MC904s, syncs.

Backend envia:

```json
{ "command": "SYNC_DEVICE", "deviceId": "MC904-0021" }
```

Agent local: procura device → lista gravações → transfere → salva em `/media` → responde `SYNC_COMPLETE`.

**Ideia-chave:** a Borderless **comanda e observa**; a **execução** é sempre dentro da garagem.

### 3.5 Heartbeat / presença

Exemplos de telemetria leve:

- Agent online / offline  
- versão do agent  
- último heartbeat (segundos)  
- disco livre / % usado  
- MC904 conectados  
- sincronizações ativas  

---

## 4. Anotações — MC904 e JT/T

### 4.1 O que a proposta aproveita dos manuais

- Wi-Fi 2.4 GHz AP/Station  
- 4G / wireless upload (contexto do fabricante)  
- Gravação em SD  
- Protocolos **JT/T808** e **JT/T1078**  

### 4.2 Topologia interna da garagem (proposta)

```text
MC904 #1 / #2
    ↓ Wi-Fi LAN
Garage Agent
  ├── JT/T Gateway (808 + 1078)
  ├── FTP Receiver
  ├── Media Worker
  ├── Local DB
  └── Local Storage
```

### 4.3 IP na LAN

- Servidor: IP fixo interno (ex. `192.168.50.10`) — faz sentido  
- MC904: DHCP ou reserva DHCP — opcional  
- Ideal proposto: MC904 **inicia** conexão JT/T para `192.168.50.10:8080` (agent não “caça” device na rede)

### 4.4 Bootstrap ainda desconhecido (fornecedor)

Os PDFs **não** explicam como cadastrar no MC904 o endereço da plataforma JT/T.

Pergunta específica recomendada ao fornecedor:

> Precisamos configurar o MC904 para se conectar automaticamente a um servidor JT/T808/JT/T1078 próprio via Wi-Fi. Qual menu, ferramenta CMS ou protocolo define IP/domínio da plataforma, porta e identificação do terminal?

Depois de configurado (visão ideal da proposta):

```text
caminhão chega → MC904 no Wi-Fi → abre JT/T → Agent reconhece → resto automático
```

### 4.5 Dois bootstraps inevitáveis (proposta)

1. Alguém instala o Agent **uma vez** no servidor  
2. Alguém configura **uma vez** cada MC904 (Wi-Fi + endereço JT/T)  

Depois: operação diária sem intervenção do cliente.

---

## 5. Anotações — instalação sem acesso contínuo

### 5.1 Aceitar a verdade técnica

Software **não** aparece sozinho em máquina remota. Sem o primeiro install, não há Agent.

### 5.2 Caminhos de instalação

| Ambiente | Forma proposta |
| --- | --- |
| Windows | `Borderless-Garage-Setup.exe` (quase 1 clique) → serviço Windows |
| Linux | `curl … \| sudo bash` ou `.deb` |

Instalador faria: Agent + serviço + pastas + deps + DB local + Garage ID + teste de internet + registro na API + auto-start.

### 5.3 Código de ativação (forte)

No dashboard: gera `BRD-X7K2-P91A`.  
No instalador: cola o código → `POST /agent/activate` → recebe `garageId`, `token`, config (heartbeat, path de storage).

Resultado: garagem registrada **sem IP público**.

---

## 6. Anotações — dados (dois bancos)

### 6.1 Cloud DB (leve)

Entidades sugeridas: garages, devices, vehicles, syncSessions…

Campos de sessão exemplo: garageId, deviceId, vehicleId, status, startedAt, finishedAt, fileCount, totalSize, progress.

**Sem blobs de mídia.**

Exemplo de payload:

```json
{
  "vehicle": "Caminhão 12",
  "device": "MC904-091",
  "status": "READY",
  "files": 82,
  "size": 34789238123,
  "localPath": "opaque-id",
  "finishedAt": "2026-09-16T15:31:00"
}
```

`localPath` opaco — a nuvem **não precisa** do caminho físico real; basta um id de lote (`mediaBatch: b_938274`).

### 6.2 Local (pesado + índice)

PostgreSQL **ou** SQLite + filesystem:

```text
/data/vehicles/truck-12/2026/09/16/camera-1..4/
```

---

## 7. Anotações — terceirizada (fora do núcleo Full Lock, mas na arquitetura)

Fluxo proposto:

```text
MC904 → servidor cliente → /data/ready → ThirdPartyExporter → API/SFTP/S3/SMB da terceirizada
```

Vídeo **não** passa pela infraestrutura Borderless.  
Nuvem só acompanha status de entrega (preparando, enviando, 82/82, concluído).

Alinhado ao escopo: análise de imagens **não é** produto Full Lock; só handoff local + telemetria opcional.

---

## 8. Anotações — estrutura de módulos (proposto)

### CLOUD

- Frontend  
- Backend API  
- Auth  
- Garage / Vehicle / Device management  
- Commands  
- Sync status  
- Agent version management  
- **ZERO media storage**

### EDGE / CLIENTE — Borderless Garage Agent

- Device Manager (registry MC904)  
- JT/T Gateway (808 + 1078)  
- Sync Manager  
- FTP Receiver  
- Media Processor (+ FFmpeg)  
- Local Database  
- Local Storage  
- Third Party Exporter  

### Fluxo real final (proposto)

```text
Chegada → Wi-Fi → JT/T → identifica → Dashboard "chegou"
→ consulta gravações → transfer → arquivos LOCAIS
→ processa → Dashboard progresso → 100% → "pronto para análise"
→ (opcional) entrega terceirizada
```

### Desenvolvimento sem servidor do cliente

Desenvolver com Docker + simulador MC904/JT/T + pasta local como storage.  
Instalação física = etapa de implantação, não de coding diário.

**Começar pelo Garage Agent + contrato `agent-api@v1` em paralelo** (consenso §11): peça que liga cloud ↔ local ↔ MC904, com schema estável desde o dia 1.

---

## 9. Avaliação — isso é inviável?

### Veredito: **viável e alinhada ao produto** — com ressalvas de escopo e de protocolo

Para o cenário “Borderless longe do servidor do cliente + vídeo não sobe + operação robusta”, a proposta **não é inviável**. É, em linhas gerais, a arquitetura correta da indústria para edge + cloud de comando/observação.

| Critério | Avaliação |
| --- | --- |
| Pouco acesso ao servidor do cliente | **Forte** — outbound + instalador + ativação |
| Custo / sem mídia na nuvem | **Forte** — bate com requisito confirmado |
| Robustez operacional | **Boa se** o Agent for autônomo localmente (ver §10) |
| Dependência do MC904 | **Risco real** — JT/T1078 para bulk download na LAN ainda **não está documentado** nos PDFs |
| Complexidade de MVP | **Alta se** implementar todos os módulos de uma vez |

**Não é mágica:** sem (1) install único e (2) config única do MC904, o sistema não “liga sozinho”. A proposta admite isso corretamente.

---

## 10. Pontos de concordância (com o contexto Full Lock)

1. **Mídia 100% local** — já é decisão de produto.  
2. **Nuvem = metadados + painel + auth** — coerente com Firebase/API atual como fase, e com backend “real” depois.  
3. **Edge Agent por base** — já está na ordem técnica do `contexto.md` (Etapa 2).  
4. **JT/T808/1078 como candidato** — já anotado a partir dos manuais MC904.  
5. **Sem abrir porta inbound** — excelente para o nosso acesso limitado.  
6. **Instalador + código de ativação** — melhor caminho prático sem VPN permanente no cliente.  
7. **Terceirizada fora do path Borderless** — alinhado ao “fora de escopo”.  
8. **Desenvolver com simulador/Docker** — correto; não esperar hardware para modelar o Agent.  
9. **Pergunta específica ao fornecedor** (IP/porta/terminal JT/T) — melhor que pedir “API genérica”.  
10. **IP fixo só na LAN do servidor** — faz sentido; IP público não.

---

## 11. Conselho técnico — consenso (pendências fechadas)

Dois especialistas seniores debateram as pendências em paralelo e chegaram ao **mesmo veredito** em todos os cinco pontos.

| Persona | Foco |
| --- | --- |
| **Agente A** — Edge/Fleet Ingest | Robustez LAN, MC904, Agent autônomo, ordem de entregas edge |
| **Agente B** — Cloud/Fleet Platform | Multi-base, contrato Agent↔API, MVP, command/observe plane |

### 11.0 Política oficial (consenso)

> **Edge-initiated + cloud-supervised.**  
> Mídia e decisão de baixar vivem na LAN. Nuvem observa, autoriza (policy) e comanda exceções (pause / resume / retry / force).  
> JT/T1078 e FTP de vídeo são **hipóteses a provar**, não features.  
> Contrato Agent↔API fecha **em paralelo** ao Agent. MVP = só motor de ingestão + status.

---

### 11.1 Sync autônomo — **DECISÃO: aprovado**

**Consenso A+B:** Agent detecta chegada e inicia sync **sozinho** (WAN pode estar offline). Nuvem **não** é gatilho do happy path.

| Papel | Responsabilidade |
| --- | --- |
| Agent | `detect → identify → authorize(cache) → discover → queue → store → validate → emit events` |
| Cloud | Observa eventos; envia só `PAUSE` / `RESUME` / `RETRY` / `FORCE_SYNC` / `REFRESH_POLICY` |
| Policy | Cache local com TTL; se cloud offline, usa última policy válida |

**Não fazer:** exigir `SYNC_DEVICE` da nuvem para cada caminhão que chega.

---

### 11.2 MVP enxuto — **DECISÃO: aprovado (fases)**

**Consenso A+B:** um pipeline por vez. Não empacotar FFmpeg + FTP + exportador terceirizado com o motor JT/T.

| Fase | Entrega |
| --- | --- |
| **MVP-A** | Detectar, autorizar, descobrir pendências, baixar, validar, indexar metadados, eventos → cloud |
| **MVP-B** | FFmpeg local (MP4 + blocos 15 min) como job **pós-ingest**, mesmo contrato de status |
| **Pós-MVP** | Exportador terceirizada; retenção automática; outros MDVR |

Contrato de arquivo “raw/ingested” estável **antes** de conversão/corte.

---

### 11.3 JT/T1078 — **DECISÃO: candidato + spike (não fato)**

**Consenso A+B:** manuais citam 808/1078; **não** provam bulk histórico na LAN.

- Adapter `mettax-mc904` permanece `ready: false` até spike verde ou doc/SDK.  
- Spike time-boxed: hardware + CMS/SDK → `capabilities.transfer = proven | unknown | unsupported`.  
- Contrato Agent↔API fala operações **abstratas** (`list_recordings`, `download_segment`), não “1078 embutido”.  
- Fallback só com evidência — nunca chute (nem FTP como plano A).

---

### 11.4 FTP de vídeo — **DECISÃO: fora do MVP**

**Consenso A+B:** nos PDFs, FTP = **upgrade de firmware**, não API de gravação.

- Não desenhar fila/pipeline de ingest em cima de FTP.  
- Reavaliar **somente** se lab/fabricante provar listagem+get de mídia.  
- Se outro canal surgir (CMS, HTTP, etc.), entra como **novo adapter**, não como “FTP genérico”.

---

### 11.5 Contrato Agent↔API em paralelo — **DECISÃO: aprovado**

**Consenso A+B:** fechar contrato **agora**, junto com o esqueleto do Agent — não “só Agent primeiro”.

Schema mínimo acordado:

**Identidade**
- `POST /agents/register` (ou `/agent/activate` com código)
- `POST /agents/heartbeat` — tenant, base, version, caps, storage

**Policy (pull)**
- `GET /agents/{id}/policy` — allow/deny, prioridades
- Deltas de veículos/devices desde `since`

**Eventos (Agent → API, batch)**
- `device.seen` / `device.left`
- `auth_decision`
- `session.started` / `progress` / `paused` / `failed` / `completed`
- `file.indexed`
- `storage.health` / `agent.degraded`

Campos mínimos de sessão: `sessionId`, `baseId`, `vehicleId`, `deviceId`, `cameraId[]`, `window`, `%`, `bytes`, `attempt`, `errorCode`, `origin`

**Comandos (API → Agent via outbound long-poll/WSS)**
- `PAUSE_SESSION` · `RESUME_SESSION` · `RETRY_SESSION` · `FORCE_SYNC` · `REFRESH_POLICY` · `SET_PRIORITY`
- Ack: `accepted | rejected | done | failed`
- **Sem** `START_DOWNLOAD` obrigatório no happy path

**Verdade de dados**
- Local: mídia + progresso bruto  
- Cloud: cadastros/autorização + projeção de eventos  
- Sessões reconciliam por id idempotente

Painel/mock atuais passam a falar o mesmo `agent-api@v1`; Agent real só troca `origin: simulado → device`.

---

### 11.6 Ordem das 4 primeiras entregas (consenso Edge + Cloud)

1. **Runtime + outbound + heartbeat** — processo local, identidade da base, WSS/HTTPS, fila de comandos, path de disco (sem MDVR ainda).  
2. **Contrato versionado + estado local** — SQLite/arquivo (sessão, períodos, fila, resume) alinhado ao schema cloud/painel.  
3. **Discovery LAN** — presença IP/MAC / fingerprint; eventos `device.seen|left`; **sem inventar download**.  
4. **Spike MC904 (list/download)** — lab com hardware; só então adapter `ready: true`.

Depois: FFmpeg/15 min (MVP-B), exportador terceirizada, segundo modelo MDVR.

---

### 11.7 Itens que permanecem abertos (não eram as 5 pendências, mas o conselho reforçou)

- Confirmar OS do servidor (Windows vs Linux) antes do instalador.  
- Branding do Agent no cliente (Full Lock vs Borderless).  
- Pergunta ao fornecedor: menu/CMS para IP/porta/terminal JT/T.  

---

## 12. É a melhor opção para o nosso caso?

### Comparando alternativas

| Alternativa | Por que piora no nosso caso |
| --- | --- |
| SPA + Firebase baixando do MDVR | Impossível / inseguro / browser não é motor |
| Abrir VPN/porta no servidor do cliente | Exige acesso e rede que não temos |
| Subir vídeo para S3/Firebase | Custo + contradiz requisito |
| Só painel mock sem Agent | Não entrega o MVP real |
| Agent só local sem nuvem | Cliente multi-base sem visão central |
| Sync só por comando cloud | Quebra quando WAN da base falha |

### Conclusão (atualizada após consenso)

**Sim — Agent outbound + mídia local + nuvem de metadados/comandos é a arquitetura oficial**, com as decisões da §11 já fechadas:

1. Agent autônomo no loop de chegada  
2. MVP-A só ingest + status  
3. JT/T sob spike; FTP de vídeo fora  
4. Contrato `agent-api@v1` em paralelo às entregas 1–2  
5. Painel atual = superfície de status + simulador até o Agent real  

---

## 13. Implicações para o repositório Humberto (agora)

| Já temos | Próximo real (pós-consenso) |
| --- | --- |
| Domínio, dashboard, ingestão **simulada** | Spec OpenAPI `agent-api@v1` + Agent stub Docker (heartbeat/events/commands) |
| Adapter `mettax-mc904` (`ready: false`) | Spike hardware/CMS; só então implementação de transferência |
| Firestore/metadados de fase | Endpoints activate/register/heartbeat/events/commands |
| Docs de contexto | Instalador + ativação (fase implantação) |

**Não** tratar o pipeline simulado no SPA como Agent de produção — é protótipo de fluxo/UX até existir binário no servidor do cliente.

---

## 14. Checklist do que pedir ao cliente / fornecedor

### Fornecedor MC904

- [ ] Como configurar IP/domínio + porta da plataforma JT/T808/1078  
- [ ] Terminal ID / autenticação  
- [ ] Se o terminal **inicia** a conexão (client) ou espera (server)  
- [ ] Se JT/T1078 cobre download histórico completo via Wi-Fi Station  
- [ ] Ferramenta CMS / senha admin / procedimento por unidade  

### Cliente (infra da base)

- [ ] OS do servidor (Windows/Linux)  
- [ ] Quem executa o instalador uma vez  
- [ ] Path de disco/NAS para mídia  
- [ ] SSID/senha Wi-Fi da garagem (ou processo de TI)  
- [ ] Se haverá exportação para terceirizada (API/SFTP/pasta) — pós-MVP  

---

## 15. Decisão recomendada (Borderless) — oficial

**Adotar a arquitetura proposta como alvo oficial**, com o consenso da §11:

> Padrão: Garage Agent outbound → mídia local → nuvem só metadados/comandos;  
> sync de chegada **autônoma no edge**;  
> cloud = observe + policy + pause/retry/force;  
> JT/T sujeito a spike/fornecedor; FTP de vídeo fora até prova;  
> contrato Agent↔API versionado em paralelo ao Agent stub.

**Próximo passo de engenharia:** ver spec completa em [`docs-ia/spec_agent_api_v1_stub.md`](./spec_agent_api_v1_stub.md) — contrato `agent-api@v1` (activate, heartbeat, events, commands) + Agent stub em Docker, **ainda sem JT/T real**.

Resumo do que a spec cobre:

1. Endpoints Agent→API: activate, heartbeat, events, policy.  
2. Comandos API→Agent (long-poll outbound): PAUSE / RESUME / RETRY / FORCE_SYNC / REFRESH_POLICY / SET_PRIORITY.  
3. Stub Docker: ciclo simulado de chegada, placeholder em volume, `origin: simulado`, `capabilities.transfer=unknown`.  
4. Aceite do stub + ordem de implementação + o que fica fora (JT/T, FFmpeg, FTP, terceiros).

---

## 16. Ata do conselho (referência)

| # | Pendência | Agente A (Edge) | Agente B (Cloud) | Consenso |
| --- | --- | --- | --- | --- |
| 1 | Sync só por nuvem? | Autônomo + cloud supervise | Edge-first; comandos = exceção | **Autônomo** |
| 2 | MVP com FFmpeg/FTP/terceiros? | Pacote A = só ingest | MVP-A / MVP-B / pós | **Enxuto fases** |
| 3 | JT/T1078 certo? | Candidato + spike | Candidato + `ready:false` | **Hipótese + spike** |
| 4 | FTP de vídeo? | Fora do happy path | Fora até evidência | **Fora do MVP** |
| 5 | Contrato em paralelo? | Sim, mesma sprint | `agent-api@v1` agora | **Em paralelo** |

---

## 17. Referência cruzada

- `docs-ia/contexto.md` — fonte de verdade do produto  
- `docs-ia/checklist_sprints.md` — ordem de etapas  
- `src/services/edge/` — esqueleto atual (ainda no monorepo do painel; Agent de produção será processo separado)  
- Manuais: `arquivosContext/user_manual_mc904.pdf`, `arquivosContext/MC904 Product Parameters.pdf`
