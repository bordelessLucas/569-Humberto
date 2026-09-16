/**
 * Contrato do adaptador de equipamento (Edge Agent).
 *
 * Datasheet do MC904 (MettaX) já está em arquivosContext/.
 * Download real só após especificação de SDK/API de listagem/transferência na LAN.
 * Implementações concretas ficam em adapters/ e no registry.
 */

export type DeviceDiscoveryHint = {
  garageId: string
  /** Origem sempre explícita enquanto não houver hardware. */
  origin: 'simulado' | 'equipamento'
}

export type DiscoveredDevice = {
  adapterId: string
  model: string
  serial: string | null
  ip: string | null
  mac: string | null
  /** Identificação lida do equipamento, se o protocolo permitir (ainda pendente). */
  claimedPlate: string | null
}

export type RemoteRecordingRef = {
  externalId: string
  cameraIndex: number
  startsAt: string
  endsAt: string
  sizeBytes: number | null
}

export type DownloadChunkResult = {
  bytesWritten: number
  done: boolean
  localPath: string
}

export interface DeviceAdapter {
  readonly id: string
  readonly manufacturer: string
  readonly models: string[]
  /** true somente quando o datasheet/protocolo estiver confirmado. */
  readonly ready: boolean

  discover(hint: DeviceDiscoveryHint): Promise<DiscoveredDevice[]>
  identify(device: DiscoveredDevice): Promise<{ plate: string | null; serial: string | null }>
  listRecordings(device: DiscoveredDevice, since: string | null): Promise<RemoteRecordingRef[]>
  download(
    device: DiscoveredDevice,
    recording: RemoteRecordingRef,
    localPath: string,
    resumeOffsetBytes: number,
  ): Promise<DownloadChunkResult>
}

export class AdapterNotReadyError extends Error {
  constructor(adapterId: string, detail?: string) {
    super(detail ?? `Adapter "${adapterId}" ainda não está pronto para operação na LAN.`)
    this.name = 'AdapterNotReadyError'
  }
}
