import test from 'node:test'
import assert from 'node:assert/strict'
import { HikvisionIsapiClient } from './isapi-client.ts'

test('searchRecordings posts to ContentMgmt search', async () => {
  const calls: Array<{ url: string; method: string; body: string | null }> = []
  const client = new HikvisionIsapiClient({
    baseUrl: 'http://192.168.1.64',
    username: 'admin',
    password: 'secret',
    fetchImpl: async (url, init) => {
      calls.push({ url: String(url), method: String(init?.method), body: init?.body ? String(init.body) : null })
      return new Response('<CMSearchResult><numOfMatches>0</numOfMatches></CMSearchResult>', { status: 200 })
    },
  })

  const result = await client.searchRecordings({ channel: 1, startsAt: '2026-09-18T08:00:00Z', endsAt: '2026-09-18T09:00:00Z' })

  assert.equal(calls[0].url, 'http://192.168.1.64/ISAPI/ContentMgmt/search')
  assert.equal(calls[0].method, 'POST')
  assert.match(calls[0].body ?? '', /trackID/)
  assert.deepEqual(result, [])
})

test('downloadByPlaybackUri calls ContentMgmt download', async () => {
  const client = new HikvisionIsapiClient({
    baseUrl: 'http://192.168.1.64',
    username: 'admin',
    password: 'secret',
    fetchImpl: async () => new Response('abc', { status: 200 }),
  })

  const bytes = await client.downloadByPlaybackUri('rtsp://example/playback')
  assert.equal(Buffer.from(bytes).toString('utf8'), 'abc')
})
