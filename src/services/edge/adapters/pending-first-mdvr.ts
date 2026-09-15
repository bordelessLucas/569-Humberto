import { AdapterNotReadyError, type DeviceAdapter, type DeviceDiscoveryHint, type DiscoveredDevice, type DownloadChunkResult, type RemoteRecordingRef } from '../device-adapter.ts'

/**
 * Placeholder do primeiro adapter.
 * Não inventa FTP/SMB/HTTP/SDK. Só existe para o registry e para falhar de forma clara.
 */
export const pendingFirstMdvrAdapter: DeviceAdapter = {
  id: 'pending-first-mdvr',
  manufacturer: 'aguardando_cliente',
  models: ['pendente'],
  ready: false,

  async discover(_hint: DeviceDiscoveryHint): Promise<DiscoveredDevice[]> {
    throw new AdapterNotReadyError('pending-first-mdvr')
  },

  async identify(_device: DiscoveredDevice) {
    throw new AdapterNotReadyError('pending-first-mdvr')
  },

  async listRecordings(_device: DiscoveredDevice, _since: string | null): Promise<RemoteRecordingRef[]> {
    throw new AdapterNotReadyError('pending-first-mdvr')
  },

  async download(
    _device: DiscoveredDevice,
    _recording: RemoteRecordingRef,
    _localPath: string,
    _resumeOffsetBytes: number,
  ): Promise<DownloadChunkResult> {
    throw new AdapterNotReadyError('pending-first-mdvr')
  },
}
