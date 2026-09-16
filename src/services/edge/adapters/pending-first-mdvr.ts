/**
 * Placeholder legado — substituído pelo adapter MettaX MC904.
 * Mantido no registry para não quebrar referências antigas a `pending-first-mdvr`.
 */

import { AdapterNotReadyError, type DeviceAdapter, type DeviceDiscoveryHint, type DiscoveredDevice, type DownloadChunkResult, type RemoteRecordingRef } from '../device-adapter.ts'

export const pendingFirstMdvrAdapter: DeviceAdapter = {
  id: 'pending-first-mdvr',
  manufacturer: 'legado',
  models: ['use-mettax-mc904'],
  ready: false,

  async discover(_hint: DeviceDiscoveryHint): Promise<DiscoveredDevice[]> {
    throw new AdapterNotReadyError('pending-first-mdvr', 'Use o adapter mettax-mc904.')
  },

  async identify(_device: DiscoveredDevice) {
    throw new AdapterNotReadyError('pending-first-mdvr', 'Use o adapter mettax-mc904.')
  },

  async listRecordings(_device: DiscoveredDevice, _since: string | null): Promise<RemoteRecordingRef[]> {
    throw new AdapterNotReadyError('pending-first-mdvr', 'Use o adapter mettax-mc904.')
  },

  async download(
    _device: DiscoveredDevice,
    _recording: RemoteRecordingRef,
    _localPath: string,
    _resumeOffsetBytes: number,
  ): Promise<DownloadChunkResult> {
    throw new AdapterNotReadyError('pending-first-mdvr', 'Use o adapter mettax-mc904.')
  },
}
