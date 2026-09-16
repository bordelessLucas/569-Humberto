export type { DeviceAdapter, DeviceDiscoveryHint, DiscoveredDevice, DownloadChunkResult, RemoteRecordingRef } from './device-adapter.ts'
export { AdapterNotReadyError } from './device-adapter.ts'
export { describeEdgeAgent, probeGarageNetwork, type EdgeAgentStatus } from './agent.ts'
export { getDeviceAdapter, listDeviceAdapters, registerDeviceAdapter } from './registry.ts'
export { MC904_CAPABILITIES, mettaxMc904Adapter } from './adapters/mettax-mc904.ts'
export {
  describeIngestCapableAgent,
  getGarageIngestStatus,
  startGarageIngest,
} from './pipeline.ts'
