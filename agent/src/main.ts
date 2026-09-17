import { stat } from 'node:fs/promises'
import { AgentApiClient } from './client/agent-api.ts'
import { env } from './env.ts'
import { log } from './log.ts'
import { ArrivalSimulator, event } from './sim/arrival.ts'
import { LocalStore } from './state/local-store.ts'
import type { AgentEvent } from './types.ts'

const startedAt = Date.now()
const store = new LocalStore(env.storagePath)
const client = new AgentApiClient({ apiBase: env.apiBase, agentId: env.agentId, version: env.version })
await store.load()

async function activateOrRegister(): Promise<void> {
  const state = store.snapshot()
  try {
    const activation = state.token
      ? await client.register(state.token)
      : await client.activate({ activationCode: env.activationCode, hostname: env.hostname, os: env.os })
    await store.saveActivation({
      token: activation.token,
      garageId: activation.garageId,
      tenantId: activation.tenantId,
      config: {
        heartbeatSeconds: env.heartbeatSeconds || activation.config.heartbeatSeconds,
        commandsWaitSeconds: activation.config.commandsWaitSeconds,
        storagePath: env.storagePath || activation.config.storagePath,
      },
    })
    log('agent activated', { garageId: activation.garageId, tenantId: activation.tenantId })
  } catch (error) {
    log('activation failed; using persisted state if available', { error: String(error) })
    if (!state.token || !state.garageId) throw error
  }
}

async function sendOrBuffer(events: AgentEvent[]): Promise<void> {
  const state = store.snapshot()
  if (!state.token || !state.garageId) {
    await store.bufferEvents(events)
    return
  }
  const buffered = await store.drainEvents()
  const batch = [...buffered, ...events]
  try {
    const result = await client.sendEvents(state.token, state.garageId, batch)
    log('events sent', result)
  } catch (error) {
    await store.restoreEvents(batch)
    log('events buffered', { count: batch.length, error: String(error) })
  }
}

const simulator = new ArrivalSimulator(
  env.storagePath,
  () => store.nextSequence(),
  (sessionId) => store.setLastSessionId(sessionId),
  sendOrBuffer,
  () => store.snapshot().policy,
)

await activateOrRegister()
await sendOrBuffer([event('agent.online', { agentId: env.agentId, version: env.version })])

async function refreshPolicy(): Promise<void> {
  const state = store.snapshot()
  if (!state.token) return
  try {
    const policy = await client.getPolicy(state.token)
    await store.savePolicy(policy)
    log('policy refreshed', { version: policy.version })
  } catch (error) {
    log('policy refresh failed; keeping cached policy', { error: String(error) })
  }
}

async function heartbeatLoop(): Promise<void> {
  for (;;) {
    const state = store.snapshot()
    if (state.token && state.garageId) {
      try {
        const storage = await storageHealth(env.storagePath)
        await client.heartbeat(state.token, state.garageId, storage, Math.round((Date.now() - startedAt) / 1000), simulator.isActive() ? 1 : 0)
        await sendOrBuffer([event('storage.health', storage)])
        log('heartbeat sent', { activeSessions: simulator.isActive() ? 1 : 0 })
      } catch (error) {
        log('heartbeat failed', { error: String(error) })
      }
    }
    await sleep((state.config?.heartbeatSeconds ?? env.heartbeatSeconds) * 1000)
  }
}

async function commandLoop(): Promise<void> {
  for (;;) {
    const state = store.snapshot()
    if (state.token) {
      try {
        const response = await client.getCommands(state.token, state.config?.commandsWaitSeconds ?? 25)
        if (response.commands.length === 0) {
          await sleep(1000)
          continue
        }
        for (const command of response.commands) {
          log('command received', command)
          const status = await simulator.handleCommand(command)
          await client.ackCommand(state.token, command.commandId, status, status === 'rejected' ? 'Command is not valid for current stub state.' : null)
          if (command.type === 'REFRESH_POLICY') await refreshPolicy()
        }
      } catch (error) {
        log('command poll failed', { error: String(error) })
        await sleep(5000)
      }
    }
  }
}

async function timerLoop(): Promise<void> {
  if (env.simArrivalSeconds <= 0) return
  for (;;) {
    await sleep(env.simArrivalSeconds * 1000)
    void simulator.run('veh-17', 'timer')
  }
}

await refreshPolicy()
void heartbeatLoop()
void commandLoop()
void timerLoop()

process.on('SIGTERM', () => {
  log('received SIGTERM')
  process.exit(0)
})

async function storageHealth(storagePath: string) {
  const stats = await stat(storagePath)
  const capacityBytes = 5_000_000_000_000
  const usedBytes = stats.size + store.snapshot().sequence * 128_000_000
  return {
    path: storagePath,
    capacityBytes,
    usedBytes,
    alert: usedBytes / capacityBytes >= 0.85,
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
