import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { env } from '../env.ts'
import type { AgentCommand, AgentEvent, AgentPolicy } from '../types.ts'

const vehicleId = 'veh-17'
const deviceId = 'dev-stub-17'
const cameraIds = ['cam-veh-17-1', 'cam-veh-17-2', 'cam-veh-17-3', 'cam-veh-17-4']
const bytesTotal = 3_200_000_000

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

  constructor(
    storagePath: string,
    nextSequence: () => Promise<number>,
    rememberSession: (sessionId: string) => Promise<void>,
    emit: EventSink,
    policy: () => AgentPolicy | null,
  ) {
    this.storagePath = storagePath
    this.nextSequence = nextSequence
    this.rememberSession = rememberSession
    this.emit = emit
    this.policy = policy
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

    await this.emit([this.sessionEvent('session.started', null, targetVehicleId)])
    for (const next of [12, 28, 45, 66, 84, 100]) {
      while (this.paused) await sleep(500)
      if (this.failed) return
      this.progress = next
      await sleep(700)
      await this.emit([this.sessionEvent(next === 100 ? 'session.completed' : 'session.progress', null, targetVehicleId)])
    }

    await this.writePlaceholderFiles(targetVehicleId)
    await this.emit([event('device.left', { deviceId, vehicleId: targetVehicleId })])
    this.active = false
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

  private async writePlaceholderFiles(targetVehicleId: string): Promise<void> {
    const dir = path.join(this.storagePath, 'vehicles', targetVehicleId, '2026', '09', '16')
    await mkdir(dir, { recursive: true })
    const events: AgentEvent[] = []
    for (const [index, cameraId] of cameraIds.entries()) {
      const name = `${targetVehicleId}_${cameraId}_2026-09-16T080000.bin`
      const filePath = path.join(dir, name)
      await writeFile(filePath, `placeholder media for ${targetVehicleId} ${cameraId}\n`)
      events.push(event('file.indexed', {
        sessionId: this.sessionId,
        vehicleId: targetVehicleId,
        deviceId,
        cameraId,
        sequence: index + 1,
        bytes: 31,
        localPath: `media://${targetVehicleId}/2026/09/16/${name}`,
        origin: env.origin,
      }))
    }
    await this.emit(events)
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
