import test from 'node:test'
import assert from 'node:assert/strict'
import { createHikvisionIsapiAdapter } from './adapter.ts'

test('hikvision adapter maps ISAPI segments to remote recordings', async () => {
  const adapter = createHikvisionIsapiAdapter({
    device: { ip: '192.168.1.64', username: 'admin', password: 'secret', serial: 'HK-1', mac: 'AA:BB' },
    fetchImpl: async (url) => {
      if (String(url).endsWith('/ISAPI/ContentMgmt/search')) {
        return new Response(`
          <CMSearchResult>
            <searchMatchItem>
              <playbackURI>rtsp://playback/1</playbackURI>
              <startTime>2026-09-18T08:00:00Z</startTime>
              <endTime>2026-09-18T08:15:00Z</endTime>
              <size>123</size>
            </searchMatchItem>
          </CMSearchResult>`, { status: 200 })
      }
      return new Response('not found', { status: 404 })
    },
  })

  const [device] = await adapter.discover()
  const recordings = await adapter.listRecordings(device, {
    channel: 1,
    startsAt: '2026-09-18T08:00:00Z',
    endsAt: '2026-09-18T09:00:00Z',
    stream: 'main',
  })

  assert.equal(adapter.capability.adapterId, 'hikvision-ae-md5043-isapi')
  assert.equal(device.serial, 'HK-1')
  assert.equal(recordings[0].playbackUri, 'rtsp://playback/1')
  assert.equal(recordings[0].sizeBytes, 123)
})
