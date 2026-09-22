export type Origin = 'simulado' | 'device'

export type CommandType =
  | 'PAUSE_SESSION'
  | 'RESUME_SESSION'
  | 'RETRY_SESSION'
  | 'FORCE_SYNC'
  | 'REFRESH_POLICY'
  | 'SET_PRIORITY'

export type AckStatus = 'accepted' | 'rejected' | 'done' | 'failed'

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

export interface AgentConfig {
  heartbeatSeconds: number
  commandsWaitSeconds: number
  storagePath: string
  retentionDays: number
  maxConcurrentVehicles: number
  maxConcurrentDownloads: number
  maxConcurrentUploads: number
}

export interface ActivationResponse {
  garageId: string
  tenantId: string
  token: string
  apiBaseUrl: string
  config: AgentConfig
}

export interface AgentEvent {
  eventId: string
  type: string
  at: string
  origin: Origin
  payload: Record<string, unknown>
}

export interface AgentCommand {
  commandId: string
  type: CommandType
  issuedAt: string
  expiresAt: string
  payload: Record<string, unknown>
}

export interface AgentPolicy {
  version: number
  fetchedAt: string
  ttlSeconds: number
  vehicles: Array<{ vehicleId: string; allowed: boolean; priority: number }>
  devices: Array<{ deviceId: string; vehicleId: string; allowed: boolean }>
}

export interface LocalState {
  token: string | null
  garageId: string | null
  tenantId: string | null
  config: AgentConfig | null
  policy: AgentPolicy | null
  bufferedEvents: AgentEvent[]
  lastSessionId: string | null
  sequence: number
}

export type TransferStageStatus = 'queued' | 'running' | 'completed' | 'failed'
export type VerificationStatus = 'not_available' | 'pending' | 'verified' | 'failed'

export interface CloudObjectRef {
  provider: 'mock' | 'customer-cloud'
  bucket: string
  key: string
  sizeBytes: number
  checksum: string | null
  uploadedAt: string
  expiresAt: string
  verificationStatus: VerificationStatus
}
