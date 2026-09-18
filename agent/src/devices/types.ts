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
