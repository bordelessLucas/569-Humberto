import { createHash } from 'node:crypto'
import { mkdir, rm, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { env } from '../env.ts'
import { MockCloudStorageProvider } from '../storage/cloud-storage.ts'
import type { AgentCommand, AgentEvent, AgentPolicy, LocalState } from '../types.ts'

const vehicleId = 'veh-17'
const deviceId = 'dev-stub-17'
const cameraIds = ['cam-veh-17-1', 'cam-veh-17-2', 'cam-veh-17-3', 'cam-veh-17-4']
const bytesTotal = 3_200_000_000
const cloudStorage = new MockCloudStorageProvider()

export type EventSink = (events: AgentEvent[]) => Promise<void>

export class ArrivalSimulator {
  private active = false
  private paused = false
  private failed = false
  private sessionId: string | null = null
  private progress = 0
  private attempt = 1
  private readonly storagePath: string
  private readonly nextSequence: () => Promise<number>
  private readonly rememberSession: (sessionId: string) => Promise<void>
  private readonly emit: EventSink
  private readonly policy: () => AgentPolicy | null
  private readonly localState: () => LocalState

  constructor(
    storagePath: string,
    nextSequence: () => Promise<number>,
    rememberSession: (sessionId: string) => Promise<void>,
    emit: EventSink,
    policy: () => AgentPolicy | null,
    localState: () => LocalState,
  ) {
    this.storagePath = storagePath
    this.nextSequence = nextSequence
    this.rememberSession = rememberSession
    this.emit = emit
    this.policy = policy
    this.localState = localState
  }

  isActive(): boolean {
    return this.active && !this.failed
  }

  async handleCommand(command: AgentCommand): Promise<'accepted' | 'rejected' | 'done' | 'failed'> {
    if (command.type === 'FORCE_SYNC') {
      void this.run(String(command.payload.vehicleId ?? vehicleId), 'force')
      return 'accepted'
    }
    if (command.type === 'PAUSE_SESSION') {
      if (!this.active || this.paused) return 'rejected'
      this.paused = true
      await this.emit([this.sessionEvent('session.paused', null)])
      return 'accepted'
    }
    if (command.type === 'RESUME_SESSION') {
      if (!this.active || !this.paused) return 'rejected'
      this.paused = false
      return 'accepted'
    }
    if (command.type === 'RETRY_SESSION') {
      if (!this.failed) return 'rejected'
      this.failed = false
      this.progress = 0
      this.attempt += 1
      void this.run(String(command.payload.vehicleId ?? vehicleId), 'retry')
      return 'accepted'
    }
    if (command.type === 'REFRESH_POLICY' || command.type === 'SET_PRIORITY') return 'done'
    return 'rejected'
  }

  async run(targetVehicleId = vehicleId, reason: 'timer' | 'force' | 'retry' = 'timer'): Promise<void> {
    if (this.active) return
    this.active = true
    this.paused = false
    this.failed = false
    this.progress = 0
    const sequence = await this.nextSequence()
    this.sessionId = `sync_stub_${String(sequence).padStart(4, '0')}`
    await this.rememberSession(this.sessionId)

    const allowed = this.isAllowed(targetVehicleId)
    await this.emit([
      event('device.seen', {
        deviceId,
        serial: 'MC904-STUB-17',
        ip: '10.20.17.4',
        mac: 'AA:10:20:00:17:04',
        vehicleId: targetVehicleId,
        trigger: reason,
      }),
      event('auth.decision', { vehicleId: targetVehicleId, deviceId, allowed, reason: allowed ? null : 'policy_denied' }),
    ])

    if (!allowed) {
      this.active = false
      await this.emit([event('device.left', { deviceId, vehicleId: targetVehicleId })])
      return
    }

    try {
      await this.emit([this.sessionEvent('session.started', null, targetVehicleId)])
      for (const next of [12, 28, 45, 66, 84, 100]) {
        while (this.paused) await sleep(500)
        if (this.failed) return
        this.progress = next
        await sleep(700)
        await this.emit([this.sessionEvent(next === 100 ? 'download.completed' : 'session.progress', null, targetVehicleId)])
      }

      await this.uploadPlaceholderFiles(targetVehicleId)
      await this.emit([event('device.left', { deviceId, vehicleId: targetVehicleId })])
    } catch (error) {
      await this.emit([this.sessionEvent('upload.failed', String(error), targetVehicleId)])
    } finally {
      this.active = false
    }
  }

  async fail(errorCode = 'simulated_failure'): Promise<void> {
    if (!this.active) return
    this.failed = true
    await this.emit([this.sessionEvent('session.failed', errorCode)])
    this.active = false
  }

  private isAllowed(targetVehicleId: string): boolean {
    const policy = this.policy()
    if (!policy) return true
    return policy.vehicles.find((item) => item.vehicleId === targetVehicleId)?.allowed ?? true
  }

  private sessionEvent(type: string, errorCode: string | null, targetVehicleId = vehicleId): AgentEvent {
    return event(type, {
      sessionId: this.sessionId,
      vehicleId: targetVehicleId,
      deviceId,
      cameraIds,
      windowStart: '2026-09-16T08:00:00-03:00',
      windowEnd: '2026-09-16T17:00:00-03:00',
      progressPercent: this.progress,
      bytesTransferred: Math.round((bytesTotal * this.progress) / 100),
      bytesTotal,
      attempt: this.attempt,
      errorCode,
      origin: env.origin,
    })
  }

  private async uploadPlaceholderFiles(targetVehicleId: string): Promise<void> {
    const spoolDir = path.join(this.storagePath, 'spool', 'ready-upload', targetVehicleId, '2026', '09', '16')
    const archiveDate = '2026/09/16'
    const state = this.localState()
    const tenantId = state.tenantId ?? 'tenant-pending'
    const garageId = state.garageId ?? 'garage-pending'
    await mkdir(spoolDir, { recursive: true })
    await this.emit([event('upload.started', {
      sessionId: this.sessionId,
      vehicleId: targetVehicleId,
      provider: 'mock',
      retentionDays: env.retentionDays,
    })])

    const events: AgentEvent[] = []
    for (const [index, cameraId] of cameraIds.entries()) {
      const name = `${targetVehicleId}_${cameraId}_2026-09-16T080000.bin`
      const filePath = path.join(spoolDir, name)
      const bytes = Buffer.from(`placeholder media for ${targetVehicleId} ${cameraId}\n`)
      const checksum = createHash('sha256').update(bytes).digest('hex')
      await writeFile(filePath, bytes)
      const objectKey = [
        tenantId,
        garageId,
        targetVehicleId,
        archiveDate,
        deviceId,
        `camera-${index + 1}`,
        name,
      ].join('/')
      const uploaded = await cloudStorage.upload({
        localPath: filePath,
        objectKey,
        sizeBytes: bytes.byteLength,
        checksum,
        retentionDays: env.retentionDays,
      })
      const verified = await cloudStorage.verify(uploaded)
      await rm(filePath, { force: true })
      events.push(event('file.indexed', {
        sessionId: this.sessionId,
        vehicleId: targetVehicleId,
        deviceId,
        cameraId,
        sequence: index + 1,
        sourceSize: bytes.byteLength,
        uploadedSize: verified.sizeBytes,
        checksum: verified.checksum,
        cloudObjectKey: verified.key,
        uploadedAt: verified.uploadedAt,
        expiresAt: verified.expiresAt,
        downloadFromDeviceStatus: 'completed',
        uploadToCloudStatus: 'completed',
        verificationStatus: verified.verificationStatus,
        localSpoolStatus: 'deleted',
        origin: env.origin,
      }))
    }
    await this.emit([
      ...events,
      event('upload.completed', {
        sessionId: this.sessionId,
        vehicleId: targetVehicleId,
        filesUploaded: events.length,
        retentionDays: env.retentionDays,
      }),
      event('sync.completed', {
        sessionId: this.sessionId,
        vehicleId: targetVehicleId,
        downloadFromDeviceStatus: 'completed',
        uploadToCloudStatus: 'completed',
        verificationStatus: 'verified',
      }),
    ])
  }
}

export function event(type: string, payload: Record<string, unknown>): AgentEvent {
  return {
    eventId: `evt_${Date.now()}_${Math.random().toString(16).slice(2)}`,
    type,
    at: new Date().toISOString(),
    origin: env.origin,
    payload,
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
