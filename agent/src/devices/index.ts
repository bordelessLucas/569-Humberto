import { DeviceRegistry } from './registry.ts'
import type { DeviceAdapter } from './types.ts'
import { mettaxJtt1078Capability } from './mettax/jtt1078-spike.ts'

const mettaxSpikePlaceholder: DeviceAdapter = {
  capability: { ...mettaxJtt1078Capability, adapterId: 'mettax-spike-placeholder' },
  async discover() {
    return []
  },
  async identify(device) {
    return { deviceId: device.deviceId, vehicleId: null, serial: device.serial }
  },
  async listRecordings() {
    throw new Error('MettaX JT/T1078 listRecordings is blocked until hardware spike proves 0x9205/0x1205.')
  },
  async downloadRecording() {
    throw new Error('MettaX JT/T1078 downloadRecording is blocked until hardware spike proves 0x9206/0x1206.')
  },
}

export function buildDefaultDeviceRegistry(): DeviceRegistry {
  return new DeviceRegistry([mettaxSpikePlaceholder])
}
