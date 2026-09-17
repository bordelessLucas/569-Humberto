import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import type { AgentConfig, AgentEvent, AgentPolicy, LocalState } from '../types.ts'

const initialState: LocalState = {
  token: null,
  garageId: null,
  tenantId: null,
  config: null,
  policy: null,
  bufferedEvents: [],
  lastSessionId: null,
  sequence: 0,
}

export class LocalStore {
  private readonly filePath: string
  private state: LocalState = structuredClone(initialState)
  private readonly storagePath: string

  constructor(storagePath: string) {
    this.storagePath = storagePath
    this.filePath = path.join(storagePath, '.agent-state.json')
  }

  async load(): Promise<LocalState> {
    await mkdir(this.storagePath, { recursive: true })
    try {
      const raw = await readFile(this.filePath, 'utf8')
      this.state = { ...structuredClone(initialState), ...JSON.parse(raw) }
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error
      await this.save()
    }
    return this.snapshot()
  }

  snapshot(): LocalState {
    return structuredClone(this.state)
  }

  async saveActivation(input: { token: string; garageId: string; tenantId: string; config: AgentConfig }): Promise<void> {
    this.state.token = input.token
    this.state.garageId = input.garageId
    this.state.tenantId = input.tenantId
    this.state.config = input.config
    await this.save()
  }

  async savePolicy(policy: AgentPolicy): Promise<void> {
    this.state.policy = policy
    await this.save()
  }

  async bufferEvents(events: AgentEvent[]): Promise<void> {
    this.state.bufferedEvents.push(...events)
    await this.save()
  }

  async drainEvents(): Promise<AgentEvent[]> {
    const events = this.state.bufferedEvents
    this.state.bufferedEvents = []
    await this.save()
    return events
  }

  async restoreEvents(events: AgentEvent[]): Promise<void> {
    this.state.bufferedEvents = [...events, ...this.state.bufferedEvents]
    await this.save()
  }

  async nextSequence(): Promise<number> {
    this.state.sequence += 1
    await this.save()
    return this.state.sequence
  }

  async setLastSessionId(sessionId: string): Promise<void> {
    this.state.lastSessionId = sessionId
    await this.save()
  }

  private async save(): Promise<void> {
    await mkdir(this.storagePath, { recursive: true })
    await writeFile(this.filePath, `${JSON.stringify(this.state, null, 2)}\n`)
  }
}
