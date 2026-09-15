import { pendingFirstMdvrAdapter } from './adapters/pending-first-mdvr.ts'
import type { DeviceAdapter } from './device-adapter.ts'

const adapters: DeviceAdapter[] = [pendingFirstMdvrAdapter]

export function listDeviceAdapters(): DeviceAdapter[] {
  return [...adapters]
}

export function getDeviceAdapter(id: string): DeviceAdapter | undefined {
  return adapters.find((item) => item.id === id)
}

export function registerDeviceAdapter(adapter: DeviceAdapter): void {
  const index = adapters.findIndex((item) => item.id === adapter.id)
  if (index >= 0) adapters[index] = adapter
  else adapters.push(adapter)
}
