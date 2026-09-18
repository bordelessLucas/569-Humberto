import { createHash } from 'node:crypto'
import { mkdir, rename, writeFile } from 'node:fs/promises'
import path from 'node:path'

export class LocalMediaStore {
  private readonly root: string

  constructor(root: string) {
    this.root = root
  }

  async writeFinalized(relativePath: string, bytes: Buffer, expectedSizeBytes: number | null) {
    const finalPath = path.join(this.root, relativePath)
    const partPath = `${finalPath}.part`
    await mkdir(path.dirname(finalPath), { recursive: true })
    await writeFile(partPath, bytes)

    if (expectedSizeBytes !== null && bytes.byteLength !== expectedSizeBytes) {
      throw new Error(`size mismatch: expected ${expectedSizeBytes}, received ${bytes.byteLength}`)
    }

    await rename(partPath, finalPath)
    return {
      finalPath,
      bytesWritten: bytes.byteLength,
      sha256: createHash('sha256').update(bytes).digest('hex'),
    }
  }
}
