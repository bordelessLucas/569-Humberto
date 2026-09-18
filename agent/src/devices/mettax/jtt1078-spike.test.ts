import test from 'node:test'
import assert from 'node:assert/strict'
import { JTT1078_HISTORY_FLOW, mettaxJtt1078Capability } from './jtt1078-spike.ts'

test('documents required JT/T1078 historical flow', () => {
  assert.deepEqual(JTT1078_HISTORY_FLOW.map((item) => item.command), ['0x0100', '0x0102', '0x9205', '0x1205', '0x9206', '0x1206', '0x9207'])
  assert.equal(mettaxJtt1078Capability.transfer, 'spike-required')
  assert.equal(mettaxJtt1078Capability.mode, 'terminal-initiated')
})
