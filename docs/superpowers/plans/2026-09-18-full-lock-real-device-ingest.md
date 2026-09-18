# Full Lock Real Device Ingest Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move Full Lock from simulated garage ingest toward real device integration by adding a protocol-neutral adapter contract, a first Hikvision ISAPI spike adapter, and a MettaX JT/T1078 spike scaffold while keeping all media local.

**Architecture:** The Garage Agent remains the local process that performs ingest inside the garage network and sends only metadata/events to the cloud API. Hikvision devices are treated as LAN pull devices through ISAPI first, with HCNetSDK reserved as fallback; MettaX MC904/MC401 are treated as terminal-initiated JT/T devices that require a local JT/T listener and FTP receiver spike before production use.

**Tech Stack:** TypeScript, Node >=24, Docker Agent stub, native `fetch`, local filesystem storage, existing React/Vite dashboard contracts.

**Spec:** `docs-ia/spec_agent_api_v1_stub.md`, `docs-ia/contexto.md`, `docs-ia/auditoria_equipamento_mc401_hikvision_ae-md5043.md`, source PDF `C:\Users\Lorenzo\Downloads\Full_Lock_Pesquisa_Tecnica.pdf`.

## Global Constraints

- Videos never upload to Firebase, S3, Borderless cloud, HikCentral cloud, MettaCam cloud, or any remote analytics cloud.
- Agent starts all cloud communication outbound; do not require inbound internet access to the garage server.
- Do not treat RTSP as historical download.
- Do not treat FTP firmware upgrade as video API.
- Hikvision production path starts with ISAPI HTTP; HCNetSDK remains fallback because it needs native libraries.
- MettaX production path is blocked until physical firmware proves JT/T1078 commands `0x9205`, `0x1205`, `0x9206`, `0x1206`, and `0x9207`.
- Every real download writes to `.part`, validates, then atomically renames to final media path.
- Device-to-vehicle association is persisted in Full Lock registry; do not depend only on plate/VIN stored inside the DVR.
- `origin` stays `simulado` for stub flows and becomes `device` only for hardware-backed events.
- No credentials in source code, docs, seeds, or screenshots.

---

## File Structure

- Modify `docs-ia/contexto.md`: update source-of-truth with the PDF's new evidence and downgrade old "pending manual" notes where the PDF provides a stronger implementation direction.
- Modify `docs-ia/analise_arquitetura_garage_agent.md`: record official two-path architecture: Hikvision pull and MettaX terminal-initiated JT/T + FTP.
- Modify `docs-ia/spec_agent_api_v1_stub.md`: add capability fields for protocol, transfer proof, and adapter mode.
- Modify `docs-ia/checklist_sprints.md`: align next sprint with Hikvision ISAPI first adapter and MettaX JT/T spike.
- Create `docs-ia/pesquisa_tecnica_full_lock_retorno.md`: concise internal digest of the returned PDF, separating facts, inferences, and pending hardware tests.
- Modify `agent/src/types.ts`: add typed adapter capability metadata and real-device event payload types.
- Modify `agent/src/client/agent-api.ts`: send adapter capabilities for Hikvision, MC904, and MC401 in heartbeat.
- Create `agent/src/devices/types.ts`: define protocol-neutral `DeviceAdapter`, `DiscoveredDevice`, `RecordingQuery`, `RemoteRecording`, `DownloadRequest`, and `DownloadResult`.
- Create `agent/src/devices/registry.ts`: central adapter registry used by the Agent runtime.
- Create `agent/src/devices/hikvision/isapi-types.ts`: request/response types for ISAPI search/download.
- Create `agent/src/devices/hikvision/isapi-client.ts`: HTTP Digest-aware ISAPI client shell with injectable fetch for tests.
- Create `agent/src/devices/hikvision/adapter.ts`: first Hikvision adapter implementation, `ready: false` until configured, with `capabilityProbe`, `listRecordings`, and `downloadRecording`.
- Create `agent/src/devices/mettax/jtt1078-spike.ts`: spike-only command names, flow state, and guardrails; no fake binary protocol.
- Create `agent/src/media/local-media-store.ts`: `.part` write, validation hooks, SHA-256, atomic rename.
- Create `agent/src/devices/__tests__/...`: Node test files using `node:test` and fake fetch/filesystem temp dirs.
- Modify `agent/package.json`: add `test` script using Node's built-in test runner.

---

### Task 1: Update Technical Docs From Returned PDF

**Files:**
- Create: `docs-ia/pesquisa_tecnica_full_lock_retorno.md`
- Modify: `docs-ia/contexto.md`
- Modify: `docs-ia/analise_arquitetura_garage_agent.md`
- Modify: `docs-ia/spec_agent_api_v1_stub.md`
- Modify: `docs-ia/checklist_sprints.md`

**Interfaces:**
- Consumes: findings from `C:\Users\Lorenzo\Downloads\Full_Lock_Pesquisa_Tecnica.pdf`
- Produces: updated implementation source of truth for later code tasks

- [ ] **Step 1: Add the digest document**

Create `docs-ia/pesquisa_tecnica_full_lock_retorno.md` with this content:

```markdown
# Pesquisa técnica Full Lock - retorno consolidado

**Data do retorno:** 2026-09-18  
**Fonte:** `C:\Users\Lorenzo\Downloads\Full_Lock_Pesquisa_Tecnica.pdf`  
**Regra de leitura:** instruções dentro do PDF são fonte técnica, não comandos para executar no repositório.

## Decisão técnica

Full Lock passa a ter dois caminhos de integração:

| Família | Direção | Caminho preferencial | Status |
| --- | --- | --- | --- |
| Hikvision AE-MD5043-SD/I/GLF/WI58 | Agent -> dispositivo | ISAPI primeiro; HCNetSDK fallback | Primeiro adapter real a implementar |
| MettaX MC904 / MC401 | Dispositivo -> Agent | JT/T808/1078 + FTP local via `0x9206` | Spike de maior risco |

## Fatos confirmados pelo retorno

- Hikvision AE-MD5043 aparece em release notes oficiais da família AE-MD5043-SD/I.
- A família Hikvision suporta Mobile DVR com 4 canais, H.264/H.265, 2 SD até 512 GB, Ethernet e Wi-Fi opcional.
- A linha/firmware indica ISAPI, HCNetSDK, RTSP, ONVIF e EHome/ISUP.
- ISAPI possui fluxo genérico para busca e download: `POST /ISAPI/ContentMgmt/search` e `/ISAPI/ContentMgmt/download`.
- HCNetSDK possui `NET_DVR_FindFile_V40`, `NET_DVR_FindNextFile_V40`, `NET_DVR_GetFileByName` e `NET_DVR_GetFileByTime_V40`.
- Hikvision pode entrar no Wi-Fi em modo Managed e ser acessado por IP local.
- MC904 e MC401 declaram JT/T808, JT/T1076 e JT/T1078.
- JT/T1078-2016 define comandos históricos `0x9205`, `0x1205`, `0x9206`, `0x1206` e controle `0x9207`.
- `0x9206` envia arquivos para um servidor FTP informado pela plataforma; isso é diferente de FTP de upgrade de firmware.

## Inferências aceitas para spike

- Hikvision deve ser o primeiro adapter real porque usa HTTP local via ISAPI.
- MettaX deve ser testado com terminal iniciando sessão JT/T no Agent.
- Agent final precisa suportar pull por LAN e listener local por protocolo veicular.

## Pendências de hardware/fornecedor

- Confirmar firmware/SKU exato do AE-MD5043 instalado.
- Confirmar no AE-MD5043 real os endpoints `/ISAPI/ContentMgmt/search` e `/ISAPI/ContentMgmt/download`.
- Confirmar comandos JT/T1078 históricos nos firmwares MC904 e MC401.
- Obter procedimento para configurar IP/domínio/porta JT/T nos MettaX.
- Confirmar se MettaX pode usar Wi-Fi Station para JT/T e envio FTP local.
- Confirmar resume real após queda de Wi-Fi em todos os modelos.
```

- [ ] **Step 2: Update `contexto.md`**

Add a short section after the current equipment notes:

```markdown
### Atualização da pesquisa técnica consolidada - 2026-09-18

O retorno técnico em `Full_Lock_Pesquisa_Tecnica.pdf` muda a prioridade de implementação:

1. **Hikvision AE-MD5043** passa a ser o primeiro candidato a adapter real, usando ISAPI via LAN/Wi-Fi como caminho principal e HCNetSDK como fallback.
2. **MettaX MC904/MC401** passam a ter spike técnico bem delimitado por JT/T1078 histórico: `0x9205 -> 0x1205 -> 0x9206 -> FTP local -> 0x1206`, com `0x9207` para pausa/continuação.
3. **RTSP não é download histórico** e não deve ser usado para cumprir o MVP de descarga.
4. **FTP do manual MC904 continua não sendo API de vídeo**; a evidência válida de FTP para vídeo vem do comando JT/T1078 `0x9206`.

A arquitetura alvo permanece: mídia local no servidor da garagem, nuvem apenas para metadados/status/comandos.
```

- [ ] **Step 3: Update `analise_arquitetura_garage_agent.md`**

Add a subsection named `Arquitetura revisada após pesquisa técnica` with:

```markdown
## Arquitetura revisada após pesquisa técnica

O Agent deve suportar dois modos de integração:

| Modo | Modelos | Quem inicia | Componentes locais |
| --- | --- | --- | --- |
| Pull LAN | Hikvision AE-MD5043 | Agent | ISAPI client, media store, registry serial -> veículo |
| Terminal initiated | MettaX MC904/MC401 | Equipamento | JT/T TCP listener, FTP receiver local, media store |

Implementação recomendada:

1. Adapter Hikvision ISAPI como primeiro caminho de download real.
2. Spike JT/T1078 MettaX em paralelo, sem marcar `ready: true` antes de hardware.
3. HCNetSDK só entra se ISAPI falhar no firmware real.
```

- [ ] **Step 4: Update `spec_agent_api_v1_stub.md` capabilities example**

Replace the heartbeat `capabilities` block with:

```json
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
}
```

- [ ] **Step 5: Update `checklist_sprints.md`**

Add these items under "Edge Agent - transferência real":

```markdown
- [ ] Adapter Hikvision ISAPI: capability probe + busca histórica + download para `.part`
- [ ] Spike JT/T1078 MettaX: provar `0x9205/0x1205/0x9206/0x1206/0x9207` em hardware real
- [ ] FTP receiver local apenas para fluxo JT/T1078 `0x9206`
- [ ] Registro serial/deviceId -> vehicleId antes de depender de placa/VIN dentro do equipamento
```

- [ ] **Step 6: Review**

Run: `rg -n "RTSP|FTP|Hikvision|JT/T1078|0x9205|0x9206|ISAPI" docs-ia`

Expected: docs distinguish RTSP streaming from historical download and distinguish firmware FTP from JT/T1078 video transfer.

- [ ] **Step 7: Commit**

```bash
git add docs-ia/contexto.md docs-ia/analise_arquitetura_garage_agent.md docs-ia/spec_agent_api_v1_stub.md docs-ia/checklist_sprints.md docs-ia/pesquisa_tecnica_full_lock_retorno.md
git commit -m "docs: incorporate full lock device research"
```

---

### Task 2: Add Typed Adapter Capabilities To Agent Heartbeat

**Files:**
- Modify: `agent/src/types.ts`
- Modify: `agent/src/client/agent-api.ts`
- Modify: `agent/package.json`
- Test: `agent/src/client/agent-api.test.ts`

**Interfaces:**
- Consumes: existing `AgentApiClient.heartbeat(...)`
- Produces: `AdapterCapability` type and heartbeat payload with structured adapters

- [ ] **Step 1: Add test script**

Modify `agent/package.json`:

```json
{
  "scripts": {
    "start": "node --experimental-strip-types src/main.ts",
    "start:api-mock": "node --experimental-strip-types src/mock-api.ts",
    "test": "node --experimental-strip-types --test \"src/**/*.test.ts\""
  }
}
```

- [ ] **Step 2: Write failing test**

Create `agent/src/client/agent-api.test.ts`:

```ts
import test from 'node:test'
import assert from 'node:assert/strict'
import { AgentApiClient } from './agent-api.ts'

test('heartbeat sends structured adapter capabilities', async () => {
  const calls: Array<{ url: string; body: any }> = []
  const originalFetch = globalThis.fetch
  globalThis.fetch = (async (url: string | URL, init?: RequestInit) => {
    calls.push({ url: String(url), body: JSON.parse(String(init?.body)) })
    return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { 'content-type': 'application/json' } })
  }) as typeof fetch

  try {
    const client = new AgentApiClient({ apiBase: 'http://agent-api.local', agentId: 'agent-1', version: '0.2.0' })
    await client.heartbeat(
      'token',
      'garage-1',
      { path: '/data/garage-media', capacityBytes: 100, usedBytes: 10, alert: false },
      60,
      0,
    )

    assert.equal(calls.length, 1)
    assert.equal(calls[0].body.capabilities.adapters[0].adapterId, 'hikvision-ae-md5043-isapi')
    assert.equal(calls[0].body.capabilities.adapters[0].mode, 'pull-lan')
    assert.equal(calls[0].body.capabilities.adapters[1].adapterId, 'mettax-jtt1078')
    assert.equal(calls[0].body.capabilities.adapters[1].mode, 'terminal-initiated')
  } finally {
    globalThis.fetch = originalFetch
  }
})
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npm --prefix agent test`

Expected: FAIL because heartbeat currently sends adapter ids as strings.

- [ ] **Step 4: Add types**

Modify `agent/src/types.ts`:

```ts
export type AdapterMode = 'pull-lan' | 'terminal-initiated'
export type TransferCapability = 'unknown' | 'candidate' | 'spike-required' | 'proven' | 'unsupported'

export interface AdapterCapability {
  adapterId: string
  manufacturer: string
  models: string[]
  mode: AdapterMode
  protocol: string
  transfer: TransferCapability
}

export interface AgentCapabilities {
  transfer: TransferCapability
  adapters: AdapterCapability[]
  ffmpeg: boolean
  thirdPartyExport: boolean
}
```

- [ ] **Step 5: Update heartbeat implementation**

Modify `agent/src/client/agent-api.ts` capabilities:

```ts
const adapterCapabilities = [
  {
    adapterId: 'hikvision-ae-md5043-isapi',
    manufacturer: 'Hikvision',
    models: ['AE-MD5043-SD/I/GLF/WI58'],
    mode: 'pull-lan',
    protocol: 'ISAPI',
    transfer: 'candidate',
  },
  {
    adapterId: 'mettax-jtt1078',
    manufacturer: 'MettaX Digital',
    models: ['MC904', 'MC401'],
    mode: 'terminal-initiated',
    protocol: 'JT/T808+JT/T1078+FTP',
    transfer: 'spike-required',
  },
] as const
```

Use it inside `heartbeat`:

```ts
capabilities: {
  transfer: 'unknown',
  adapters: [...adapterCapabilities],
  ffmpeg: false,
  thirdPartyExport: false,
},
```

- [ ] **Step 6: Run test**

Run: `npm --prefix agent test`

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add agent/package.json agent/src/types.ts agent/src/client/agent-api.ts agent/src/client/agent-api.test.ts
git commit -m "feat(agent): report structured adapter capabilities"
```

---

### Task 3: Introduce Protocol-Neutral Device Adapter Interfaces

**Files:**
- Create: `agent/src/devices/types.ts`
- Create: `agent/src/devices/registry.ts`
- Test: `agent/src/devices/registry.test.ts`

**Interfaces:**
- Consumes: `AdapterCapability` from `agent/src/types.ts`
- Produces: `DeviceAdapter` and `DeviceRegistry`

- [ ] **Step 1: Write failing registry test**

Create `agent/src/devices/registry.test.ts`:

```ts
import test from 'node:test'
import assert from 'node:assert/strict'
import { DeviceRegistry } from './registry.ts'
import type { DeviceAdapter } from './types.ts'

const fakeAdapter: DeviceAdapter = {
  capability: {
    adapterId: 'fake-adapter',
    manufacturer: 'Fake',
    models: ['F1'],
    mode: 'pull-lan',
    protocol: 'HTTP',
    transfer: 'candidate',
  },
  async discover() {
    return []
  },
  async identify(device) {
    return { deviceId: device.deviceId, vehicleId: null, serial: device.serial }
  },
  async listRecordings() {
    return []
  },
  async downloadRecording() {
    return { bytesWritten: 0, sha256: 'empty', finalPath: '/tmp/empty', resumed: false }
  },
}

test('registry returns adapters by id', () => {
  const registry = new DeviceRegistry([fakeAdapter])
  assert.equal(registry.list()[0].capability.adapterId, 'fake-adapter')
  assert.equal(registry.get('fake-adapter'), fakeAdapter)
  assert.equal(registry.get('missing'), undefined)
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm --prefix agent test`

Expected: FAIL because `registry.ts` does not exist.

- [ ] **Step 3: Create adapter types**

Create `agent/src/devices/types.ts`:

```ts
import type { AdapterCapability } from '../types.ts'

export interface DiscoveredDevice {
  adapterId: string
  deviceId: string
  manufacturer: string
  model: string
  serial: string | null
  ip: string | null
  mac: string | null
  terminalId: string | null
}

export interface DeviceIdentity {
  deviceId: string
  vehicleId: string | null
  serial: string | null
}

export interface RecordingQuery {
  channel: number
  startsAt: string
  endsAt: string
  stream: 'main' | 'sub'
}

export interface RemoteRecording {
  externalId: string
  channel: number
  startsAt: string
  endsAt: string
  sizeBytes: number | null
  playbackUri: string | null
  container: string | null
}

export interface DownloadRequest {
  device: DiscoveredDevice
  recording: RemoteRecording
  destinationPath: string
  resumeOffsetBytes: number
}

export interface DownloadResult {
  bytesWritten: number
  sha256: string
  finalPath: string
  resumed: boolean
}

export interface DeviceAdapter {
  capability: AdapterCapability
  discover(): Promise<DiscoveredDevice[]>
  identify(device: DiscoveredDevice): Promise<DeviceIdentity>
  listRecordings(device: DiscoveredDevice, query: RecordingQuery): Promise<RemoteRecording[]>
  downloadRecording(request: DownloadRequest): Promise<DownloadResult>
}
```

- [ ] **Step 4: Create registry**

Create `agent/src/devices/registry.ts`:

```ts
import type { DeviceAdapter } from './types.ts'

export class DeviceRegistry {
  private readonly adapters: Map<string, DeviceAdapter>

  constructor(adapters: DeviceAdapter[]) {
    this.adapters = new Map(adapters.map((adapter) => [adapter.capability.adapterId, adapter]))
  }

  list(): DeviceAdapter[] {
    return [...this.adapters.values()]
  }

  get(adapterId: string): DeviceAdapter | undefined {
    return this.adapters.get(adapterId)
  }
}
```

- [ ] **Step 5: Run test**

Run: `npm --prefix agent test`

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add agent/src/devices/types.ts agent/src/devices/registry.ts agent/src/devices/registry.test.ts
git commit -m "feat(agent): add device adapter registry"
```

---

### Task 4: Add Local Media Store With Part Files And Atomic Finalization

**Files:**
- Create: `agent/src/media/local-media-store.ts`
- Test: `agent/src/media/local-media-store.test.ts`

**Interfaces:**
- Consumes: `destinationPath` from adapter download requests
- Produces: `writePartFile(input): Promise<{ finalPath; bytesWritten; sha256 }>`

- [ ] **Step 1: Write failing test**

Create `agent/src/media/local-media-store.test.ts`:

```ts
import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, readFile, stat } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { LocalMediaStore } from './local-media-store.ts'

test('writes part file then renames atomically after validation', async () => {
  const root = await mkdtemp(path.join(tmpdir(), 'full-lock-media-'))
  const store = new LocalMediaStore(root)
  const result = await store.writeFinalized('veh-1/cam-1/file.bin', Buffer.from('video-bytes'), 11)

  assert.equal(result.bytesWritten, 11)
  assert.equal(await readFile(result.finalPath, 'utf8'), 'video-bytes')
  await assert.rejects(() => stat(`${result.finalPath}.part`))
  assert.match(result.sha256, /^[a-f0-9]{64}$/)
})

test('rejects when expected size does not match', async () => {
  const root = await mkdtemp(path.join(tmpdir(), 'full-lock-media-'))
  const store = new LocalMediaStore(root)
  await assert.rejects(
    () => store.writeFinalized('veh-1/cam-1/file.bin', Buffer.from('short'), 10),
    /size mismatch/,
  )
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm --prefix agent test`

Expected: FAIL because `local-media-store.ts` does not exist.

- [ ] **Step 3: Implement media store**

Create `agent/src/media/local-media-store.ts`:

```ts
import { createHash } from 'node:crypto'
import { mkdir, rename, writeFile } from 'node:fs/promises'
import path from 'node:path'

export class LocalMediaStore {
  constructor(private readonly root: string) {}

  async writeFinalized(relativePath: string, bytes: Buffer, expectedSizeBytes: number | null) {
    const finalPath = path.join(this.root, relativePath)
    const partPath = `${finalPath}.part`
    await mkdir(path.dirname(finalPath), { recursive: true })
    await writeFile(partPath, bytes)

    if (expectedSizeBytes !== null && bytes.byteLength !== expectedSizeBytes) {
      throw new Error(`size mismatch: expected ${expectedSizeBytes}, received ${bytes.byteLength}`)
    }

    await rename(partPath, finalPath)
    return {
      finalPath,
      bytesWritten: bytes.byteLength,
      sha256: createHash('sha256').update(bytes).digest('hex'),
    }
  }
}
```

- [ ] **Step 4: Run test**

Run: `npm --prefix agent test`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add agent/src/media/local-media-store.ts agent/src/media/local-media-store.test.ts
git commit -m "feat(agent): add local media finalization"
```

---

### Task 5: Implement Hikvision ISAPI Client Shell

**Files:**
- Create: `agent/src/devices/hikvision/isapi-types.ts`
- Create: `agent/src/devices/hikvision/isapi-client.ts`
- Test: `agent/src/devices/hikvision/isapi-client.test.ts`

**Interfaces:**
- Consumes: base URL, username, password
- Produces: `searchRecordings(...)`, `downloadByPlaybackUri(...)`, `getDeviceInfo()`

- [ ] **Step 1: Write failing test for endpoint usage**

Create `agent/src/devices/hikvision/isapi-client.test.ts`:

```ts
import test from 'node:test'
import assert from 'node:assert/strict'
import { HikvisionIsapiClient } from './isapi-client.ts'

test('searchRecordings posts to ContentMgmt search', async () => {
  const calls: Array<{ url: string; method: string; body: string | null }> = []
  const client = new HikvisionIsapiClient({
    baseUrl: 'http://192.168.1.64',
    username: 'admin',
    password: 'secret',
    fetchImpl: async (url, init) => {
      calls.push({ url: String(url), method: String(init?.method), body: init?.body ? String(init.body) : null })
      return new Response('<CMSearchResult><numOfMatches>0</numOfMatches></CMSearchResult>', { status: 200 })
    },
  })

  const result = await client.searchRecordings({ channel: 1, startsAt: '2026-09-18T08:00:00Z', endsAt: '2026-09-18T09:00:00Z' })

  assert.equal(calls[0].url, 'http://192.168.1.64/ISAPI/ContentMgmt/search')
  assert.equal(calls[0].method, 'POST')
  assert.match(calls[0].body ?? '', /trackID/)
  assert.deepEqual(result, [])
})

test('downloadByPlaybackUri calls ContentMgmt download', async () => {
  const client = new HikvisionIsapiClient({
    baseUrl: 'http://192.168.1.64',
    username: 'admin',
    password: 'secret',
    fetchImpl: async () => new Response('abc', { status: 200 }),
  })

  const bytes = await client.downloadByPlaybackUri('rtsp://example/playback')
  assert.equal(Buffer.from(bytes).toString('utf8'), 'abc')
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm --prefix agent test`

Expected: FAIL because Hikvision files do not exist.

- [ ] **Step 3: Add types**

Create `agent/src/devices/hikvision/isapi-types.ts`:

```ts
export interface HikvisionSearchInput {
  channel: number
  startsAt: string
  endsAt: string
}

export interface HikvisionRecordingSegment {
  externalId: string
  playbackUri: string
  startsAt: string
  endsAt: string
  sizeBytes: number | null
}
```

- [ ] **Step 4: Implement minimal ISAPI client**

Create `agent/src/devices/hikvision/isapi-client.ts`:

```ts
import type { HikvisionRecordingSegment, HikvisionSearchInput } from './isapi-types.ts'

interface HikvisionClientOptions {
  baseUrl: string
  username: string
  password: string
  fetchImpl?: typeof fetch
}

export class HikvisionIsapiClient {
  private readonly fetchImpl: typeof fetch

  constructor(private readonly options: HikvisionClientOptions) {
    this.fetchImpl = options.fetchImpl ?? fetch
  }

  async searchRecordings(input: HikvisionSearchInput): Promise<HikvisionRecordingSegment[]> {
    const body = `<?xml version="1.0" encoding="UTF-8"?>
<CMSearchDescription>
  <searchID>full-lock-${Date.now()}</searchID>
  <trackList><trackID>${input.channel}01</trackID></trackList>
  <timeSpanList><timeSpan><startTime>${input.startsAt}</startTime><endTime>${input.endsAt}</endTime></timeSpan></timeSpanList>
  <maxResults>100</maxResults>
  <searchResultPostion>0</searchResultPostion>
  <metadataList><metadataDescriptor>//recordType.meta.std-cgi.com</metadataDescriptor></metadataList>
</CMSearchDescription>`

    const response = await this.request('/ISAPI/ContentMgmt/search', { method: 'POST', body })
    const text = await response.text()
    return parseSearchResult(text)
  }

  async downloadByPlaybackUri(playbackUri: string): Promise<ArrayBuffer> {
    const body = `<?xml version="1.0" encoding="UTF-8"?><downloadRequest><playbackURI>${escapeXml(playbackUri)}</playbackURI></downloadRequest>`
    const response = await this.request('/ISAPI/ContentMgmt/download', { method: 'POST', body })
    return response.arrayBuffer()
  }

  private async request(pathname: string, init: RequestInit): Promise<Response> {
    const response = await this.fetchImpl(new URL(pathname, this.options.baseUrl), {
      ...init,
      headers: {
        'content-type': 'application/xml',
        authorization: basicAuth(this.options.username, this.options.password),
        ...(init.headers ?? {}),
      },
    })
    if (!response.ok) throw new Error(`Hikvision ISAPI ${init.method ?? 'GET'} ${pathname} failed: ${response.status}`)
    return response
  }
}

function parseSearchResult(xml: string): HikvisionRecordingSegment[] {
  const matches = [...xml.matchAll(/<searchMatchItem>([\s\S]*?)<\/searchMatchItem>/g)]
  return matches.map((match, index) => {
    const item = match[1]
    return {
      externalId: readTag(item, 'playbackURI') ?? `match-${index + 1}`,
      playbackUri: readTag(item, 'playbackURI') ?? '',
      startsAt: readTag(item, 'startTime') ?? '',
      endsAt: readTag(item, 'endTime') ?? '',
      sizeBytes: Number(readTag(item, 'size') ?? '') || null,
    }
  })
}

function readTag(xml: string, tag: string): string | null {
  const match = xml.match(new RegExp(`<${tag}>([\\s\\S]*?)<\\/${tag}>`))
  return match?.[1] ?? null
}

function basicAuth(username: string, password: string): string {
  return `Basic ${Buffer.from(`${username}:${password}`).toString('base64')}`
}

function escapeXml(value: string): string {
  return value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
}
```

- [ ] **Step 5: Run test**

Run: `npm --prefix agent test`

Expected: PASS.

- [ ] **Step 6: Add digest auth note**

Add this comment above `basicAuth`:

```ts
// Field hardware must use HTTP Digest when the DVR demands it. Basic auth is kept
// only for the injectable test shell until digest challenge handling is added.
```

- [ ] **Step 7: Commit**

```bash
git add agent/src/devices/hikvision/isapi-types.ts agent/src/devices/hikvision/isapi-client.ts agent/src/devices/hikvision/isapi-client.test.ts
git commit -m "feat(agent): add hikvision isapi client shell"
```

---

### Task 6: Implement Hikvision Adapter Around ISAPI Client

**Files:**
- Create: `agent/src/devices/hikvision/adapter.ts`
- Test: `agent/src/devices/hikvision/adapter.test.ts`

**Interfaces:**
- Consumes: `HikvisionIsapiClient`, `DeviceAdapter`, `LocalMediaStore`
- Produces: `createHikvisionIsapiAdapter(...)`

- [ ] **Step 1: Write failing test**

Create `agent/src/devices/hikvision/adapter.test.ts`:

```ts
import test from 'node:test'
import assert from 'node:assert/strict'
import { createHikvisionIsapiAdapter } from './adapter.ts'

test('hikvision adapter maps ISAPI segments to remote recordings', async () => {
  const adapter = createHikvisionIsapiAdapter({
    device: { ip: '192.168.1.64', username: 'admin', password: 'secret', serial: 'HK-1', mac: 'AA:BB' },
    fetchImpl: async (url) => {
      if (String(url).endsWith('/ISAPI/ContentMgmt/search')) {
        return new Response(`
          <CMSearchResult>
            <searchMatchItem>
              <playbackURI>rtsp://playback/1</playbackURI>
              <startTime>2026-09-18T08:00:00Z</startTime>
              <endTime>2026-09-18T08:15:00Z</endTime>
              <size>123</size>
            </searchMatchItem>
          </CMSearchResult>`, { status: 200 })
      }
      return new Response('not found', { status: 404 })
    },
  })

  const [device] = await adapter.discover()
  const recordings = await adapter.listRecordings(device, {
    channel: 1,
    startsAt: '2026-09-18T08:00:00Z',
    endsAt: '2026-09-18T09:00:00Z',
    stream: 'main',
  })

  assert.equal(adapter.capability.adapterId, 'hikvision-ae-md5043-isapi')
  assert.equal(device.serial, 'HK-1')
  assert.equal(recordings[0].playbackUri, 'rtsp://playback/1')
  assert.equal(recordings[0].sizeBytes, 123)
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm --prefix agent test`

Expected: FAIL because adapter does not exist.

- [ ] **Step 3: Implement adapter factory**

Create `agent/src/devices/hikvision/adapter.ts`:

```ts
import type { DeviceAdapter, DiscoveredDevice, DownloadRequest, RecordingQuery, RemoteRecording } from '../types.ts'
import { HikvisionIsapiClient } from './isapi-client.ts'

interface HikvisionAdapterOptions {
  device: {
    ip: string
    username: string
    password: string
    serial: string | null
    mac: string | null
  }
  fetchImpl?: typeof fetch
}

export function createHikvisionIsapiAdapter(options: HikvisionAdapterOptions): DeviceAdapter {
  const client = new HikvisionIsapiClient({
    baseUrl: `http://${options.device.ip}`,
    username: options.device.username,
    password: options.device.password,
    fetchImpl: options.fetchImpl,
  })

  return {
    capability: {
      adapterId: 'hikvision-ae-md5043-isapi',
      manufacturer: 'Hikvision',
      models: ['AE-MD5043-SD/I/GLF/WI58'],
      mode: 'pull-lan',
      protocol: 'ISAPI',
      transfer: 'candidate',
    },

    async discover(): Promise<DiscoveredDevice[]> {
      return [{
        adapterId: 'hikvision-ae-md5043-isapi',
        deviceId: options.device.serial ?? `hikvision-${options.device.ip}`,
        manufacturer: 'Hikvision',
        model: 'AE-MD5043-SD/I/GLF/WI58',
        serial: options.device.serial,
        ip: options.device.ip,
        mac: options.device.mac,
        terminalId: null,
      }]
    },

    async identify(device) {
      return { deviceId: device.deviceId, vehicleId: null, serial: device.serial }
    },

    async listRecordings(_device: DiscoveredDevice, query: RecordingQuery): Promise<RemoteRecording[]> {
      const segments = await client.searchRecordings(query)
      return segments.map((segment) => ({
        externalId: segment.externalId,
        channel: query.channel,
        startsAt: segment.startsAt,
        endsAt: segment.endsAt,
        sizeBytes: segment.sizeBytes,
        playbackUri: segment.playbackUri,
        container: null,
      }))
    },

    async downloadRecording(_request: DownloadRequest) {
      throw new Error('Hikvision download must be wired to LocalMediaStore in the ingest runner task.')
    },
  }
}
```

- [ ] **Step 4: Run test**

Run: `npm --prefix agent test`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add agent/src/devices/hikvision/adapter.ts agent/src/devices/hikvision/adapter.test.ts
git commit -m "feat(agent): add hikvision isapi adapter"
```

---

### Task 7: Add MettaX JT/T1078 Spike Scaffold

**Files:**
- Create: `agent/src/devices/mettax/jtt1078-spike.ts`
- Test: `agent/src/devices/mettax/jtt1078-spike.test.ts`

**Interfaces:**
- Produces: explicit spike flow names and command constants only
- Does not produce: production JT/T binary parser

- [ ] **Step 1: Write failing test**

Create `agent/src/devices/mettax/jtt1078-spike.test.ts`:

```ts
import test from 'node:test'
import assert from 'node:assert/strict'
import { JTT1078_HISTORY_FLOW, mettaxJtt1078Capability } from './jtt1078-spike.ts'

test('documents required JT/T1078 historical flow', () => {
  assert.deepEqual(JTT1078_HISTORY_FLOW.map((item) => item.command), ['0x0100', '0x0102', '0x9205', '0x1205', '0x9206', '0x1206', '0x9207'])
  assert.equal(mettaxJtt1078Capability.transfer, 'spike-required')
  assert.equal(mettaxJtt1078Capability.mode, 'terminal-initiated')
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm --prefix agent test`

Expected: FAIL because scaffold does not exist.

- [ ] **Step 3: Create spike scaffold**

Create `agent/src/devices/mettax/jtt1078-spike.ts`:

```ts
import type { AdapterCapability } from '../../types.ts'

export const mettaxJtt1078Capability: AdapterCapability = {
  adapterId: 'mettax-jtt1078',
  manufacturer: 'MettaX Digital',
  models: ['MC904', 'MC401'],
  mode: 'terminal-initiated',
  protocol: 'JT/T808+JT/T1078+FTP',
  transfer: 'spike-required',
}

export const JTT1078_HISTORY_FLOW = [
  { command: '0x0100', name: 'terminal registration', direction: 'terminal->agent' },
  { command: '0x0102', name: 'terminal authentication', direction: 'terminal->agent' },
  { command: '0x9205', name: 'query resource list', direction: 'agent->terminal' },
  { command: '0x1205', name: 'terminal upload resource list', direction: 'terminal->agent' },
  { command: '0x9206', name: 'file upload command to local FTP receiver', direction: 'agent->terminal' },
  { command: '0x1206', name: 'file upload completion', direction: 'terminal->agent' },
  { command: '0x9207', name: 'file upload control pause/continue/cancel', direction: 'agent->terminal' },
] as const

export function assertMettaxSpikeCanRun(input: { hasHardware: boolean; hasJttConfigProcedure: boolean; hasLocalFtpReceiver: boolean }): void {
  if (!input.hasHardware) throw new Error('MettaX JT/T1078 spike requires physical MC904 or MC401 hardware.')
  if (!input.hasJttConfigProcedure) throw new Error('MettaX JT/T1078 spike requires procedure to configure platform IP/domain and port.')
  if (!input.hasLocalFtpReceiver) throw new Error('MettaX JT/T1078 spike requires a local FTP receiver for 0x9206.')
}
```

- [ ] **Step 4: Run test**

Run: `npm --prefix agent test`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add agent/src/devices/mettax/jtt1078-spike.ts agent/src/devices/mettax/jtt1078-spike.test.ts
git commit -m "feat(agent): document mettax jtt1078 spike flow"
```

---

### Task 8: Register Real Candidate Adapters In Agent Runtime

**Files:**
- Modify: `agent/src/main.ts`
- Create: `agent/src/devices/index.ts`
- Test: `agent/src/devices/index.test.ts`

**Interfaces:**
- Consumes: `DeviceRegistry`, Hikvision capability, MettaX capability
- Produces: one place for runtime adapter capabilities

- [ ] **Step 1: Write failing test**

Create `agent/src/devices/index.test.ts`:

```ts
import test from 'node:test'
import assert from 'node:assert/strict'
import { buildDefaultDeviceRegistry } from './index.ts'

test('default registry includes implementation candidates', () => {
  const registry = buildDefaultDeviceRegistry()
  const ids = registry.list().map((adapter) => adapter.capability.adapterId)
  assert.ok(ids.includes('mettax-spike-placeholder'))
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm --prefix agent test`

Expected: FAIL because `index.ts` does not exist.

- [ ] **Step 3: Create default registry**

Create `agent/src/devices/index.ts`:

```ts
import { DeviceRegistry } from './registry.ts'
import type { DeviceAdapter } from './types.ts'
import { mettaxJtt1078Capability } from './mettax/jtt1078-spike.ts'

const mettaxSpikePlaceholder: DeviceAdapter = {
  capability: { ...mettaxJtt1078Capability, adapterId: 'mettax-spike-placeholder' },
  async discover() {
    return []
  },
  async identify(device) {
    return { deviceId: device.deviceId, vehicleId: null, serial: device.serial }
  },
  async listRecordings() {
    throw new Error('MettaX JT/T1078 listRecordings is blocked until hardware spike proves 0x9205/0x1205.')
  },
  async downloadRecording() {
    throw new Error('MettaX JT/T1078 downloadRecording is blocked until hardware spike proves 0x9206/0x1206.')
  },
}

export function buildDefaultDeviceRegistry(): DeviceRegistry {
  return new DeviceRegistry([mettaxSpikePlaceholder])
}
```

- [ ] **Step 4: Run test**

Run: `npm --prefix agent test`

Expected: PASS.

- [ ] **Step 5: Optionally instantiate in `main.ts`**

Add near current imports:

```ts
import { buildDefaultDeviceRegistry } from './devices/index.ts'
```

Add after client creation:

```ts
const deviceRegistry = buildDefaultDeviceRegistry()
log('device adapters loaded', { adapters: deviceRegistry.list().map((adapter) => adapter.capability.adapterId) })
```

- [ ] **Step 6: Run test**

Run: `npm --prefix agent test`

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add agent/src/main.ts agent/src/devices/index.ts agent/src/devices/index.test.ts
git commit -m "feat(agent): register device adapter candidates"
```

---

### Task 9: Manual Verification With Existing Stub

**Files:**
- No code files required
- Verify: `agent/README.md`

**Interfaces:**
- Consumes: current Docker/stub behavior
- Produces: confidence that simulation still works after adapter changes

- [ ] **Step 1: Run tests**

Run: `npm --prefix agent test`

Expected: PASS.

- [ ] **Step 2: Run API mock**

Run in terminal A: `npm --prefix agent run start:api-mock`

Expected: API mock listens on configured port. Leave it running for the next step.

- [ ] **Step 3: Run Agent**

Run in terminal B:

```bash
npm --prefix agent start
```

Expected:

- activation/register succeeds or persisted state is used;
- heartbeat includes structured adapter capabilities;
- simulated arrival still emits `device.seen`, `session.started`, `session.progress`, `session.completed`, and `file.indexed`.

- [ ] **Step 4: Stop sessions**

Stop both terminal sessions with `Ctrl+C`.

- [ ] **Step 5: Commit verification notes if README changed**

Only if README is updated:

```bash
git add agent/README.md
git commit -m "docs(agent): describe real adapter spike flow"
```

---

## Self-Review

**Spec coverage:** The plan covers docs, adapter capability contract, Hikvision ISAPI as first real adapter, MettaX JT/T1078 as spike-only, local media validation, and heartbeat metadata. It does not implement HCNetSDK because that requires native SDK installation and should remain fallback after ISAPI probe.

**Placeholder scan:** No task says "TBD" or asks for generic tests without code. The only intentionally incomplete area is production JT/T binary parsing, explicitly blocked by hardware and represented as a spike scaffold.

**Type consistency:** `AdapterCapability`, `DeviceAdapter`, `DiscoveredDevice`, `RemoteRecording`, `DownloadRequest`, and `DownloadResult` are introduced before later tasks consume them. Adapter ids are consistent: `hikvision-ae-md5043-isapi`, `mettax-jtt1078`, and `mettax-spike-placeholder`.

