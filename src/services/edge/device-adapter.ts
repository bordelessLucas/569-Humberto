/**
 * Contrato do adaptador de equipamento (Edge Agent).
 *
 * NÃO implementa protocolo real até o cliente enviar datasheet do primeiro MDVR.
 * Qualquer implementação concreta deve ficar em adapters/ e ser registrada no registry.
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
  constructor(adapterId: string) {
    super(`Adapter "${adapterId}" aguarda datasheet/protocolo do fabricante.`)
    this.name = 'AdapterNotReadyError'
  }
}
