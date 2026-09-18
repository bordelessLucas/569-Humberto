import test from 'node:test'
import assert from 'node:assert/strict'
import { DeviceRegistry } from './registry.ts'
import type { DeviceAdapter } from './types.ts'

const fakeAdapter: DeviceAdapter = {
  capability: {
    adapterId: 'fake-adapter',
    manufacturer: 'Fake',
    models: ['F1'],
    mode: 'pull-lan',
    protocol: 'HTTP',
    transfer: 'candidate',
  },
  async discover() {
    return []
  },
  async identify(device) {
    return { deviceId: device.deviceId, vehicleId: null, serial: device.serial }
  },
  async listRecordings() {
    return []
  },
  async downloadRecording() {
    return { bytesWritten: 0, sha256: 'empty', finalPath: '/tmp/empty', resumed: false }
  },
}

test('registry returns adapters by id', () => {
  const registry = new DeviceRegistry([fakeAdapter])
  assert.equal(registry.list()[0].capability.adapterId, 'fake-adapter')
  assert.equal(registry.get('fake-adapter'), fakeAdapter)
  assert.equal(registry.get('missing'), undefined)
})
