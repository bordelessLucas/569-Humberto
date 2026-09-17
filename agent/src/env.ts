import os from 'node:os'
import type { Origin } from './types.ts'

export const env = {
  apiBase: process.env.AGENT_API_BASE ?? 'http://localhost:8787',
  activationCode: process.env.ACTIVATION_CODE ?? 'BRD-DEMO-0001',
  agentId: process.env.AGENT_ID ?? 'stub-docker-01',
  version: process.env.AGENT_VERSION ?? '0.1.0-stub',
  hostname: process.env.HOSTNAME ?? os.hostname(),
  os: os.platform(),
  storagePath: process.env.STORAGE_PATH ?? '/data/garage-media',
  heartbeatSeconds: Number(process.env.HEARTBEAT_SECONDS ?? '10'),
  simArrivalSeconds: Number(process.env.SIM_ARRIVAL_SECONDS ?? '120'),
  origin: (process.env.ORIGIN ?? 'simulado') as Origin,
}
