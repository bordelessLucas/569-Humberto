import test from 'node:test'
import assert from 'node:assert/strict'
import { AgentApiClient } from './agent-api.ts'

test('heartbeat sends structured adapter capabilities', async () => {
  const calls: Array<{ url: string; body: any }> = []
  const originalFetch = globalThis.fetch
  globalThis.fetch = (async (url: string | URL, init?: RequestInit) => {
    calls.push({ url: String(url), body: JSON.parse(String(init?.body)) })
    return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { 'content-type': 'application/json' } })
  }) as typeof fetch

  try {
    const client = new AgentApiClient({ apiBase: 'http://agent-api.local', agentId: 'agent-1', version: '0.2.0' })
    await client.heartbeat(
      'token',
      'garage-1',
      { path: '/data/garage-media', capacityBytes: 100, usedBytes: 10, alert: false },
      60,
      0,
    )

    assert.equal(calls.length, 1)
    assert.equal(calls[0].body.capabilities.adapters[0].adapterId, 'hikvision-ae-md5043-isapi')
    assert.equal(calls[0].body.capabilities.adapters[0].mode, 'pull-lan')
    assert.equal(calls[0].body.capabilities.adapters[1].adapterId, 'mettax-jtt1078')
    assert.equal(calls[0].body.capabilities.adapters[1].mode, 'terminal-initiated')
  } finally {
    globalThis.fetch = originalFetch
  }
})
