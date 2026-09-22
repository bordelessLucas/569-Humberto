import path from 'node:path'
import type { CloudObjectRef } from '../types.ts'

export interface UploadInput {
  localPath: string
  objectKey: string
  sizeBytes: number
  checksum: string | null
  retentionDays: number
}

export interface CloudStorageProvider {
  upload(input: UploadInput): Promise<CloudObjectRef>
  exists(objectKey: string): Promise<boolean>
  verify(object: CloudObjectRef): Promise<CloudObjectRef>
}

export class MockCloudStorageProvider implements CloudStorageProvider {
  private readonly bucket: string
  private readonly uploaded = new Map<string, CloudObjectRef>()

  constructor(bucket = 'customer-cloud-storage-pending') {
    this.bucket = bucket
  }

  async upload(input: UploadInput): Promise<CloudObjectRef> {
    const uploadedAt = new Date()
    const expiresAt = new Date(uploadedAt.getTime() + input.retentionDays * 24 * 60 * 60 * 1000)
    const object: CloudObjectRef = {
      provider: 'mock',
      bucket: this.bucket,
      key: normalizeObjectKey(input.objectKey || path.basename(input.localPath)),
      sizeBytes: input.sizeBytes,
      checksum: input.checksum,
      uploadedAt: uploadedAt.toISOString(),
      expiresAt: expiresAt.toISOString(),
      verificationStatus: 'pending',
    }
    this.uploaded.set(object.key, object)
    return object
  }

  async exists(objectKey: string): Promise<boolean> {
    return this.uploaded.has(normalizeObjectKey(objectKey))
  }

  async verify(object: CloudObjectRef): Promise<CloudObjectRef> {
    const verified = { ...object, verificationStatus: 'verified' as const }
    this.uploaded.set(verified.key, verified)
    return verified
  }
}

function normalizeObjectKey(key: string): string {
  return key.replaceAll('\\', '/').replace(/^\/+/, '')
}
