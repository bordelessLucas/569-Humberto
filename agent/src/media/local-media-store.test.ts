import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, readFile, stat } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { LocalMediaStore } from './local-media-store.ts'

test('writes part file then renames atomically after validation', async () => {
  const root = await mkdtemp(path.join(tmpdir(), 'full-lock-media-'))
  const store = new LocalMediaStore(root)
  const result = await store.writeFinalized('veh-1/cam-1/file.bin', Buffer.from('video-bytes'), 11)

  assert.equal(result.bytesWritten, 11)
  assert.equal(await readFile(result.finalPath, 'utf8'), 'video-bytes')
  await assert.rejects(() => stat(`${result.finalPath}.part`))
  assert.match(result.sha256, /^[a-f0-9]{64}$/)
})

test('rejects when expected size does not match', async () => {
  const root = await mkdtemp(path.join(tmpdir(), 'full-lock-media-'))
  const store = new LocalMediaStore(root)
  await assert.rejects(
    () => store.writeFinalized('veh-1/cam-1/file.bin', Buffer.from('short'), 10),
    /size mismatch/,
  )
})
