import type { DemoState, Recording, Transfer } from '../../../domain/types.ts'
import { DEMO_DEVICE_ID, DEMO_GARAGE_ID, DEMO_STEPS, DEMO_VEHICLE_ID } from './seed.ts'
import { getState, markStoreDirty, pushActivity, rememberSession, resetState, stamp, type FleetStore } from './store.ts'

let runToken = 0

export function getDemoState(): DemoState {
  return structuredClone(getState().demo)
}

export function resetDemo(): void {
  runToken += 1
  const userId = getState().session?.user.id ?? null
  resetState()
  if (userId) rememberSession(userId)
}

export async function playArrival(onUpdate: () => void): Promise<void> {
  const current = getState().demo
  if (current.status === 'running') return

  if (current.status === 'done') resetDemo()

  const token = ++runToken
  const store = getState()
  store.demo.status = 'running'
  store.demo.stepIndex = -1
  store.demo.steps = DEMO_STEPS.map((step) => ({ ...step }))
  onUpdate()

  for (let index = 0; index < store.demo.steps.length; index += 1) {
    if (token !== runToken) return
    const step = store.demo.steps[index]
    if (!step) return
    await applyStep(getState(), step.id)
    if (token !== runToken) return
    const demo = getState().demo
    demo.stepIndex = index
    const doneStep = demo.steps[index]
    if (doneStep) doneStep.done = true
    markStoreDirty()
    onUpdate()
    await delay(step.id === 'download' || step.id === 'resume' ? 900 : 650)
  }

  if (token !== runToken) return
  getState().demo.status = 'done'
  onUpdate()
}

async function applyStep(store: FleetStore, stepId: string): Promise<void> {
  const vehicle = requireVehicle(store)
  const device = store.devices.find((item) => item.id === DEMO_DEVICE_ID)
  if (!device) return

  if (stepId === 'arrive') {
    pushActivity(store, {
      type: 'connection.opened',
      vehicleId: vehicle.id,
      message: 'Caminhão 17 identificado na área do Wi-Fi da Garagem Centro.',
    })
    return
  }

  if (stepId === 'connected') {
    const at = stamp(store)
    vehicle.operationalStatus = 'conectado'
    vehicle.lastConnectionAt = at
    vehicle.lastSeenGarageId = DEMO_GARAGE_ID
    device.lastSeenAt = at
    store.connections.unshift({
      id: 'con-17-a',
      deviceId: device.id,
      vehicleId: vehicle.id,
      garageId: DEMO_GARAGE_ID,
      ip: device.ip,
      mac: device.mac,
      status: 'ativa',
      connectedAt: at,
      disconnectedAt: null,
      origin: 'simulado',
    })
    pushActivity(store, {
      type: 'connection.opened',
      vehicleId: vehicle.id,
      message: 'Caminhão 17 conectado. IP e MAC conferem com o cadastro.',
    })
    return
  }

  if (stepId === 'cameras') {
    for (const camera of store.cameras.filter((item) => item.vehicleId === vehicle.id)) {
      camera.online = true
    }
    pushActivity(store, {
      type: 'recordings.discovered',
      vehicleId: vehicle.id,
      message: '4 câmeras encontradas no MC904 do Caminhão 17.',
    })
    return
  }

  if (stepId === 'recordings') {
    store.recordings = store.recordings.filter((item) => item.vehicleId !== vehicle.id)
    store.recordings.push(...createRecordings())
    store.syncRuns.unshift({
      id: 'sync-17',
      vehicleId: vehicle.id,
      garageId: DEMO_GARAGE_ID,
      startedAt: stamp(store),
      finishedAt: null,
      status: 'em_andamento',
      sessionStatus: 'baixando',
      unauthorizedReason: null,
      recordingsFound: 42,
      pending: 0,
      downloaded: 0,
      failed: 0,
      origin: 'simulado',
    })
    vehicle.lastSeenGarageId = DEMO_GARAGE_ID
    pushActivity(store, {
      type: 'recordings.discovered',
      vehicleId: vehicle.id,
      message: '42 gravações identificadas no equipamento.',
    })
    return
  }

  if (stepId === 'pending') {
    const pending = recordingsOf(store).slice(0, 17)
    for (const recording of pending) recording.status = 'pendente'
    const sync = store.syncRuns.find((item) => item.id === 'sync-17')
    if (sync) sync.pending = 17
    vehicle.operationalStatus = 'pendente'
    pushActivity(store, {
      type: 'recordings.discovered',
      vehicleId: vehicle.id,
      message: '17 gravações pendentes. 25 já constavam como baixadas.',
    })
    return
  }

  if (stepId === 'queue') {
    const pending = recordingsOf(store).filter((item) => item.status === 'pendente')
    store.transfers = store.transfers.filter((item) => item.vehicleId !== vehicle.id)
    pending.forEach((recording, index) => {
      store.transfers.push(queueItem(recording, index))
    })
    pushActivity(store, {
      type: 'transfer.queued',
      vehicleId: vehicle.id,
      message: 'Fila criada com 17 itens. Prioridade alta no bloco mais antigo.',
    })
    return
  }

  if (stepId === 'download') {
    const job = firstJob(store)
    if (!job) return
    vehicle.operationalStatus = 'baixando'
    job.status = 'baixando'
    job.attempts = 1
    for (const progress of [12, 24, 36]) {
      job.progress = progress
      job.resumeOffsetBytes = Math.round((job.bytesTotal * progress) / 100)
      pushActivity(store, {
        type: 'transfer.progress',
        vehicleId: vehicle.id,
        message: `Download do Caminhão 17 em ${progress}%.`,
      })
      await delay(280)
    }
    return
  }

  if (stepId === 'interrupt') {
    const job = firstJob(store)
    const connection = activeConnection(store)
    if (job) {
      job.status = 'interrompido'
      job.resumeOffsetBytes = Math.round((job.bytesTotal * job.progress) / 100)
    }
    if (connection) {
      connection.status = 'encerrada'
      connection.disconnectedAt = stamp(store)
    }
    vehicle.operationalStatus = 'interrompido'
    const sync = store.syncRuns.find((item) => item.id === 'sync-17')
    if (sync) sync.status = 'interrompida'
    pushActivity(store, {
      type: 'transfer.interrupted',
      vehicleId: vehicle.id,
      message: 'Download interrompido. Progresso parcial preservado para retomada.',
    })
    pushActivity(store, {
      type: 'connection.closed',
      vehicleId: vehicle.id,
      message: 'Caminhão 17 saiu da rede da garagem.',
    })
    return
  }

  if (stepId === 'upload') {
    const job = firstJob(store)
    if (!job) return
    job.status = 'enviando_nuvem'
    job.downloadFromDeviceStatus = 'baixado'
    job.uploadToCloudStatus = 'enviando'
    job.verificationStatus = 'pendente'
    job.bytesUploaded = Math.round(job.bytesTotal * 0.72)
    vehicle.operationalStatus = 'baixando'
    pushActivity(store, {
      type: 'transfer.progress',
      vehicleId: vehicle.id,
      message: 'Download local concluido. Upload para a nuvem do cliente em andamento.',
    })
    return
  }

  if (stepId === 'verify') {
    const job = firstJob(store)
    if (!job) return
    const uploadedAt = stamp(store)
    const expiresAt = addDaysIso(uploadedAt, store.storagePolicy.retentionDays)
    job.status = 'validando_upload'
    job.uploadToCloudStatus = 'concluido'
    job.verificationStatus = 'validado'
    job.bytesUploaded = job.bytesTotal
    job.uploadedSize = job.bytesTotal
    job.sourceSize = job.bytesTotal
    job.checksum = 'simulated-checksum-pending-real-device'
    job.cloudObjectKey = 'client-enel/garage-centro/veh-17/2026/09/14/dev-17/camera-1/CAM17-FRONTAL-20260914-0800.raw'
    job.uploadedAt = uploadedAt
    job.expiresAt = expiresAt
    pushActivity(store, {
      type: 'file.available',
      vehicleId: vehicle.id,
      message: 'Upload validado na nuvem do cliente. Retencao configurada para 7 dias.',
    })
    return
  }

  if (stepId === 'reconnect') {
    const at = stamp(store)
    vehicle.operationalStatus = 'conectado'
    vehicle.lastConnectionAt = at
    device.lastSeenAt = at
    store.connections.unshift({
      id: 'con-17-b',
      deviceId: device.id,
      vehicleId: vehicle.id,
      garageId: DEMO_GARAGE_ID,
      ip: device.ip,
      mac: device.mac,
      status: 'ativa',
      connectedAt: at,
      disconnectedAt: null,
      origin: 'simulado',
    })
    pushActivity(store, {
      type: 'connection.opened',
      vehicleId: vehicle.id,
      message: 'Caminhão 17 reconectado. Sincronização pode continuar.',
    })
    return
  }

  if (stepId === 'resume') {
    const job = firstJob(store)
    if (!job) return
    job.status = 'baixando'
    job.attempts += 1
    vehicle.operationalStatus = 'baixando'
    pushActivity(store, {
      type: 'transfer.resumed',
      vehicleId: vehicle.id,
      message: `Download retomado a partir de ${job.progress}%. Tentativa ${job.attempts}.`,
    })
    for (const progress of [58, 81, 100]) {
      job.progress = progress
      job.resumeOffsetBytes = Math.round((job.bytesTotal * progress) / 100)
      await delay(280)
    }
    job.status = 'concluido'
    const recording = store.recordings.find((item) => item.id === job.recordingId)
    if (recording) recording.status = 'baixada'
    const sync = store.syncRuns.find((item) => item.id === 'sync-17')
    if (sync) {
      sync.downloaded = 1
      sync.pending = 16
    }
    return
  }

  if (stepId === 'mp4') {
    const at = stamp(store)
    const originalId = 'file-17-original'
    const convertedId = 'file-17-mp4'
    store.files.unshift(
      {
        id: originalId,
        garageId: DEMO_GARAGE_ID,
        vehicleId: vehicle.id,
        cameraId: 'cam-veh-17-1',
        recordedAt: '2026-09-14T08:00:00-03:00',
        kind: 'original',
        originalFileId: null,
        path: 'garagem-centro/caminhao-17/2026-09-14/frontal/CAM17-FRONTAL-20260914-0800.raw',
        name: 'CAM17-FRONTAL-20260914-0800.raw',
        status: 'recebido',
        protected: false,
        indexed: true,
        sizeBytes: 900_000_000,
        sequence: null,
      },
      {
        id: convertedId,
        garageId: DEMO_GARAGE_ID,
        vehicleId: vehicle.id,
        cameraId: 'cam-veh-17-1',
        recordedAt: '2026-09-14T08:00:00-03:00',
        kind: 'mp4',
        originalFileId: originalId,
        path: 'garagem-centro/caminhao-17/2026-09-14/frontal/CAM17-FRONTAL-20260914-0800.mp4',
        name: 'CAM17-FRONTAL-20260914-0800.mp4',
        status: 'convertido',
        protected: false,
        indexed: true,
        sizeBytes: 640_000_000,
        sequence: null,
      },
    )
    store.processingJobs.unshift({
      id: 'job-17-mp4',
      fileId: convertedId,
      vehicleId: vehicle.id,
      stage: 'conversao_mp4',
      status: 'concluido',
      startedAt: at,
      finishedAt: at,
    })
    pushActivity(store, {
      type: 'file.converted',
      vehicleId: vehicle.id,
      message: 'Original registrado e convertido para MP4.',
    })
    return
  }

  if (stepId === 'segments') {
    const at = stamp(store)
    const blocks = [
      ['08:00', '08:15', 1],
      ['08:15', '08:30', 2],
      ['08:30', '08:45', 3],
    ] as const
    for (const [start, end, sequence] of blocks) {
      const name = `CAM17-FRONTAL-20260914-${start.replace(':', '')}-seq0${sequence}.mp4`
      store.segments.push({
        id: `seg-17-${sequence}`,
        fileId: 'file-17-mp4',
        cameraId: 'cam-veh-17-1',
        vehicleId: vehicle.id,
        sequence,
        startsAt: `2026-09-14T${start}:00-03:00`,
        endsAt: `2026-09-14T${end}:00-03:00`,
        name,
        durationMinutes: 15,
      })
    }
    const converted = store.files.find((item) => item.id === 'file-17-mp4')
    if (converted) converted.status = 'segmentado'
    store.processingJobs.unshift({
      id: 'job-17-cut',
      fileId: 'file-17-mp4',
      vehicleId: vehicle.id,
      stage: 'corte_15',
      status: 'concluido',
      startedAt: at,
      finishedAt: at,
    })
    pushActivity(store, {
      type: 'segment.created',
      vehicleId: vehicle.id,
      message: 'Vídeo cortado em 3 blocos de 15 minutos. Nomeação automática aplicada.',
    })
    return
  }

  if (stepId === 'audit') {
    const at = stamp(store)
    store.cameraAudits = store.cameraAudits.filter((item) => item.vehicleId !== vehicle.id)
    for (const camera of store.cameras.filter((item) => item.vehicleId === vehicle.id)) {
      store.cameraAudits.unshift({
        id: `audit-${camera.id}`,
        cameraId: camera.id,
        vehicleId: vehicle.id,
        inSync: true,
        gapCount: 0,
        lastCheckedAt: at,
        notes: 'Conferência individual concluída. Aguardando fechamento das lacunas.',
      })
    }
    store.processingJobs.unshift({
      id: 'job-17-audit',
      fileId: 'file-17-mp4',
      vehicleId: vehicle.id,
      stage: 'auditoria',
      status: 'concluido',
      startedAt: at,
      finishedAt: at,
    })
    pushActivity(store, {
      type: 'audit.completed',
      vehicleId: vehicle.id,
      message: 'Auditoria das 4 câmeras concluída.',
    })
    return
  }

  if (stepId === 'gap') {
    const lateral = store.cameraAudits.find((item) => item.cameraId === 'cam-veh-17-2')
    if (lateral) {
      lateral.inSync = false
      lateral.gapCount = 1
      lateral.notes = 'Lacuna entre 10:00 e 10:15.'
    }
    store.integrityIssues.unshift({
      id: 'iss-17-gap',
      fileId: null,
      cameraId: 'cam-veh-17-2',
      vehicleId: vehicle.id,
      kind: 'intervalo_ausente',
      description: 'Intervalo ausente de 10:00 a 10:15 na CAM02 do Caminhão 17.',
      detectedAt: stamp(store),
      origin: 'simulado',
      resolvedAt: null,
    })
    pushActivity(store, {
      type: 'gap.detected',
      vehicleId: vehicle.id,
      message: '1 lacuna detectada na câmera lateral.',
    })
    return
  }

  if (stepId === 'alert') {
    store.alerts.unshift({
      id: 'alert-17',
      kind: 'lacuna',
      severity: 'warning',
      message: 'Caminhão 17: lacuna de 15 minutos na câmera lateral.',
      createdAt: stamp(store),
      acknowledged: false,
      vehicleId: vehicle.id,
    })
    pushActivity(store, {
      type: 'alert.raised',
      vehicleId: vehicle.id,
      message: 'Alerta aberto para a lacuna da câmera lateral.',
    })
    return
  }

  if (stepId === 'available') {
    const at = stamp(store)
    const converted = store.files.find((item) => item.id === 'file-17-mp4')
    if (converted) {
      converted.status = 'disponivel'
      converted.indexed = true
    }
    vehicle.operationalStatus = 'concluido'
    vehicle.lastSyncAt = at
    vehicle.lastJobMinutes = 45
    const sync = store.syncRuns.find((item) => item.id === 'sync-17')
    if (sync) {
      sync.status = 'concluida'
      sync.finishedAt = at
    }
    store.storageStatus.usedBytes += 640_000_000
    store.storageStatus.availableBytes = store.storageStatus.capacityBytes - store.storageStatus.usedBytes
    const usedPercent = (store.storageStatus.usedBytes / store.storageStatus.capacityBytes) * 100
    store.storageStatus.alert = usedPercent >= store.storagePolicy.alertThresholdPercent
    pushActivity(store, {
      type: 'file.available',
      vehicleId: vehicle.id,
      message: 'Arquivo disponivel na nuvem do cliente e indexado no dashboard. 16 itens seguem na fila.',
    })
  }
}

function createRecordings(): Recording[] {
  const cameras = ['cam-veh-17-1', 'cam-veh-17-2', 'cam-veh-17-3']
  return Array.from({ length: 42 }, (_, index) => {
    const cameraId = cameras[index % cameras.length] ?? cameras[0]
    const hour = 6 + Math.floor(index / 6)
    const minute = (index % 6) * 10
    const start = `2026-09-14T${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00-03:00`
    return {
      id: `rec-17-${String(index + 1).padStart(2, '0')}`,
      vehicleId: DEMO_VEHICLE_ID,
      cameraId,
      deviceId: DEMO_DEVICE_ID,
      startsAt: start,
      endsAt: start,
      status: index < 17 ? 'no_equipamento' : 'baixada',
    }
  })
}

function queueItem(recording: Recording, index: number): Transfer {
  return {
    id: `tr-17-${String(index + 1).padStart(2, '0')}`,
    vehicleId: recording.vehicleId,
    recordingId: recording.id,
    priority: index === 0 ? 1 : index < 6 ? 2 : 3,
    status: 'na_fila',
    progress: 0,
    attempts: 0,
    resumeOffsetBytes: 0,
    bytesTotal: 900_000_000,
    origin: 'simulado',
  }
}

function recordingsOf(store: FleetStore): Recording[] {
  return store.recordings.filter((item) => item.vehicleId === DEMO_VEHICLE_ID)
}

function firstJob(store: FleetStore): Transfer | undefined {
  return store.transfers.find((item) => item.id === 'tr-17-01')
}

function activeConnection(store: FleetStore) {
  return store.connections.find((item) => item.vehicleId === DEMO_VEHICLE_ID && item.status === 'ativa')
}

function requireVehicle(store: FleetStore) {
  const vehicle = store.vehicles.find((item) => item.id === DEMO_VEHICLE_ID)
  if (!vehicle) throw new Error('Veículo da demonstração não encontrado.')
  return vehicle
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}

function addDaysIso(value: string, days: number): string {
  const date = new Date(value)
  date.setDate(date.getDate() + days)
  return date.toISOString()
}
