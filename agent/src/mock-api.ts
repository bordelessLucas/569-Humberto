import http from 'node:http'
import { env } from './env.ts'
import { log } from './log.ts'
import type { AckStatus, AgentCommand, AgentEvent } from './types.ts'

const port = Number(process.env.PORT ?? '8787')
const activationCode = process.env.ACTIVATION_CODE ?? 'BRD-DEMO-0001'
const token = 'mock-agent-token'
const commands: AgentCommand[] = []
const state = {
  activations: [] as unknown[],
  heartbeats: [] as unknown[],
  events: [] as AgentEvent[],
  acks: [] as Array<{ commandId: string; status: AckStatus; at: string; detail: string | null }>,
}

const server = http.createServer(async (request, response) => {
  try {
    const url = new URL(request.url ?? '/', `http://${request.headers.host}`)
    if (request.method === 'POST' && url.pathname === '/v1/agent/activate') {
      const body = await readJson(request)
      if (body.activationCode !== activationCode) return json(response, 400, { error: 'invalid_activation_code' })
      state.activations.push(body)
      return json(response, 200, activationResponse())
    }
    if (request.method === 'POST' && url.pathname === '/v1/agent/register') {
      requireAuth(request)
      state.activations.push(await readJson(request))
      return json(response, 200, activationResponse())
    }
    if (request.method === 'POST' && url.pathname === '/v1/agent/heartbeat') {
      requireAuth(request)
      const body = await readJson(request)
      state.heartbeats.push(body)
      log('mock heartbeat', { agentId: body.agentId, activeSessions: body.activeSessions })
      return json(response, 200, { ok: true, serverTime: new Date().toISOString() })
    }
    if (request.method === 'POST' && url.pathname === '/v1/agent/events') {
      requireAuth(request)
      const body = await readJson(request)
      const incoming = Array.isArray(body.events) ? body.events as AgentEvent[] : []
      const known = new Set(state.events.map((item) => item.eventId))
      const fresh = incoming.filter((item) => !known.has(item.eventId))
      state.events.push(...fresh)
      log('mock events', { accepted: fresh.length, duplicates: incoming.length - fresh.length })
      return json(response, 202, { accepted: fresh.length, duplicates: incoming.length - fresh.length })
    }
    if (request.method === 'GET' && url.pathname === '/v1/agent/policy') {
      requireAuth(request)
      return json(response, 200, {
        version: 3,
        fetchedAt: new Date().toISOString(),
        ttlSeconds: 300,
        vehicles: [{ vehicleId: 'veh-17', allowed: true, priority: 1 }],
        devices: [{ deviceId: 'dev-stub-17', vehicleId: 'veh-17', allowed: true }],
      })
    }
    if (request.method === 'GET' && url.pathname === '/v1/agent/commands') {
      requireAuth(request)
      return json(response, 200, { commands: commands.splice(0, commands.length) })
    }
    const ackMatch = url.pathname.match(/^\/v1\/agent\/commands\/([^/]+)\/ack$/)
    if (request.method === 'POST' && ackMatch) {
      requireAuth(request)
      const body = await readJson(request)
      state.acks.push({ commandId: decodeURIComponent(ackMatch[1]), status: body.status, at: body.at, detail: body.detail ?? null })
      return json(response, 200, { ok: true })
    }
    if (request.method === 'POST' && url.pathname === '/mock/commands') {
      const body = await readJson(request)
      const command = makeCommand(body.type, body.payload ?? {})
      commands.push(command)
      return json(response, 201, command)
    }
    if (request.method === 'GET' && url.pathname === '/mock/state') {
      return json(response, 200, { ...state, pendingCommands: commands })
    }
    return json(response, 404, { error: 'not_found' })
  } catch (error) {
    const status = error instanceof HttpError ? error.status : 500
    return json(response, status, { error: String(error) })
  }
})

server.listen(port, () => log('agent-api mock listening', { port }))

function activationResponse() {
  return {
    garageId: 'garage-centro',
    tenantId: 'lock-demo',
    token,
    apiBaseUrl: `http://localhost:${port}`,
    config: {
      heartbeatSeconds: env.heartbeatSeconds,
      commandsWaitSeconds: 25,
      storagePath: env.storagePath,
      retentionDays: env.retentionDays,
      maxConcurrentVehicles: env.maxConcurrentVehicles,
      maxConcurrentDownloads: env.maxConcurrentDownloads,
      maxConcurrentUploads: env.maxConcurrentUploads,
    },
  }
}

function makeCommand(type: AgentCommand['type'], payload: Record<string, unknown>): AgentCommand {
  const issuedAt = new Date()
  const expiresAt = new Date(issuedAt.getTime() + 10 * 60 * 1000)
  return {
    commandId: `cmd_${Date.now()}_${Math.random().toString(16).slice(2)}`,
    type,
    issuedAt: issuedAt.toISOString(),
    expiresAt: expiresAt.toISOString(),
    payload,
  }
}

async function readJson(request: http.IncomingMessage): Promise<Record<string, any>> {
  const chunks: Buffer[] = []
  for await (const chunk of request) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
  const raw = Buffer.concat(chunks).toString('utf8')
  return raw ? JSON.parse(raw) : {}
}

function json(response: http.ServerResponse, status: number, body: unknown): void {
  response.writeHead(status, { 'content-type': 'application/json' })
  response.end(`${JSON.stringify(body)}\n`)
}

function requireAuth(request: http.IncomingMessage): void {
  if (request.headers.authorization !== `Bearer ${token}`) throw new HttpError(401, 'unauthorized')
}

class HttpError extends Error {
  readonly status: number

  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}
