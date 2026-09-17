import type { AckStatus, ActivationResponse, AgentCommand, AgentEvent, AgentPolicy } from '../types.ts'

interface ClientOptions {
  apiBase: string
  agentId: string
  version: string
}

export class AgentApiClient {
  private readonly options: ClientOptions

  constructor(options: ClientOptions) {
    this.options = options
  }

  async activate(input: { activationCode: string; hostname: string; os: string }): Promise<ActivationResponse> {
    return this.request('/v1/agent/activate', {
      method: 'POST',
      body: {
        activationCode: input.activationCode,
        agentId: this.options.agentId,
        version: this.options.version,
        hostname: input.hostname,
        os: input.os,
      },
    })
  }

  async register(token: string): Promise<ActivationResponse> {
    return this.request('/v1/agent/register', {
      method: 'POST',
      token,
      body: {
        agentId: this.options.agentId,
        version: this.options.version,
      },
    })
  }

  async heartbeat(token: string, garageId: string, storage: { path: string; capacityBytes: number; usedBytes: number; alert: boolean }, uptimeSeconds: number, activeSessions: number) {
    return this.request('/v1/agent/heartbeat', {
      method: 'POST',
      token,
      body: {
        agentId: this.options.agentId,
        garageId,
        version: this.options.version,
        status: 'online',
        uptimeSeconds,
        storage,
        capabilities: {
          transfer: 'unknown',
          adapters: ['mettax-mc904'],
          ffmpeg: false,
          thirdPartyExport: false,
        },
        devicesConnected: activeSessions > 0 ? 1 : 0,
        activeSessions,
      },
    })
  }

  async sendEvents(token: string, garageId: string, events: AgentEvent[]): Promise<{ accepted: number; duplicates: number }> {
    return this.request('/v1/agent/events', {
      method: 'POST',
      token,
      body: { agentId: this.options.agentId, garageId, events },
    })
  }

  async getPolicy(token: string): Promise<AgentPolicy> {
    return this.request('/v1/agent/policy', { method: 'GET', token })
  }

  async getCommands(token: string, waitSeconds: number): Promise<{ commands: AgentCommand[] }> {
    return this.request(`/v1/agent/commands?waitSeconds=${waitSeconds}`, { method: 'GET', token })
  }

  async ackCommand(token: string, commandId: string, status: AckStatus, detail: string | null = null): Promise<void> {
    await this.request(`/v1/agent/commands/${encodeURIComponent(commandId)}/ack`, {
      method: 'POST',
      token,
      body: { status, at: new Date().toISOString(), detail },
    })
  }

  private async request<T>(pathname: string, options: { method: string; token?: string; body?: unknown }): Promise<T> {
    const response = await fetch(new URL(pathname, this.options.apiBase), {
      method: options.method,
      headers: {
        ...(options.body === undefined ? {} : { 'content-type': 'application/json' }),
        ...(options.token ? { authorization: `Bearer ${options.token}` } : {}),
      },
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
    })
    if (!response.ok) {
      const text = await response.text()
      throw new Error(`${options.method} ${pathname} failed: ${response.status} ${text}`)
    }
    if (response.status === 204) return undefined as T
    return response.json() as Promise<T>
  }
}
