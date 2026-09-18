import test from 'node:test'
import assert from 'node:assert/strict'
import { buildDefaultDeviceRegistry } from './index.ts'

test('default registry includes implementation candidates', () => {
  const registry = buildDefaultDeviceRegistry()
  const ids = registry.list().map((adapter) => adapter.capability.adapterId)
  assert.ok(ids.includes('mettax-spike-placeholder'))
})
