import type { DemoState } from '../../../domain/types.ts'
import type { FleetStore } from './store.ts'

export const DEMO_STEPS: DemoState['steps'] = [
  { id: 'arrive', label: 'Simular chegada', done: false },
  { id: 'connected', label: 'Caminhão 17 conectado', done: false },
  { id: 'cameras', label: '3 câmeras encontradas', done: false },
  { id: 'recordings', label: '42 gravações identificadas', done: false },
  { id: 'pending', label: '17 pendentes', done: false },
  { id: 'queue', label: 'Fila criada', done: false },
  { id: 'download', label: 'Download', done: false },
  { id: 'interrupt', label: 'Interrupção', done: false },
  { id: 'reconnect', label: 'Reconexão', done: false },
  { id: 'resume', label: 'Resume', done: false },
  { id: 'mp4', label: 'MP4', done: false },
  { id: 'segments', label: '15 min', done: false },
  { id: 'audit', label: 'Auditoria', done: false },
  { id: 'gap', label: '1 lacuna detectada', done: false },
  { id: 'alert', label: 'Alerta', done: false },
  { id: 'available', label: 'Arquivo disponível', done: false },
]

export const DEMO_VEHICLE_ID = 'veh-17'
export const DEMO_GARAGE_ID = 'garage-centro'
export const DEMO_DEVICE_ID = 'dev-17'

export function createSeed(): FleetStore {
  return {
    clockMinutes: 8 * 60,
    users: [
      { id: 'user-admin', name: 'Ana Ribeiro', email: 'admin@lock.com', role: 'admin', active: true },
      { id: 'user-operador', name: 'Bruno Costa', email: 'operador@lock.com', role: 'operador', active: true },
      { id: 'user-auditor', name: 'Clara Nunes', email: 'auditor@lock.com', role: 'auditor', active: true },
      { id: 'user-gestor', name: 'Diego Melo', email: 'gestor@lock.com', role: 'gestor', active: true },
    ],
    credentials: [
      { userId: 'user-admin', password: 'borderless' },
      { userId: 'user-operador', password: 'borderless' },
      { userId: 'user-auditor', password: 'borderless' },
      { userId: 'user-gestor', password: 'borderless' },
    ],
    session: null,
    clients: [
      { id: 'client-light', name: 'Light', code: 'LIGHT', active: true },
      { id: 'client-enel', name: 'Enel', code: 'ENEL', active: true },
    ],
    garages: [
      {
        id: DEMO_GARAGE_ID,
        name: 'Garagem Centro',
        city: 'São Paulo',
        wifiSsid: 'LOCK-CENTRO',
      },
      {
        id: 'garage-norte',
        name: 'Garagem Norte',
        city: 'Guarulhos',
        wifiSsid: 'LOCK-NORTE',
      },
    ],
    vehicles: [
      vehicle('veh-01', 'client-enel', 'garage-centro', 'Caminhão 01', 'concluido', '07:12', '07:40', 860),
      vehicle('veh-02', 'client-enel', 'garage-centro', 'Caminhão 02', 'baixando', '07:36', null, null),
      vehicle('veh-03', 'client-light', 'garage-norte', 'Caminhão 03', 'pendente', '06:50', null, null),
      vehicle('veh-04', 'client-enel', 'garage-centro', 'Caminhão 04', 'erro', '07:05', null, null),
      vehicle('veh-05', 'client-light', 'garage-norte', 'Caminhão 05', 'concluido', '05:40', '06:10', 540),
      vehicle('veh-17', 'client-enel', null, 'Caminhão 17', 'desconectado', null, null, null),
    ],
    plates: [
      plate('plt-01', 'veh-01', 'ABC1D23'),
      plate('plt-02', 'veh-02', 'RJK4F56'),
      plate('plt-03', 'veh-03', 'QWE7H89'),
      plate('plt-04', 'veh-04', 'MNQ2P34'),
      plate('plt-05', 'veh-05', 'TYU5J67'),
      plate('plt-17', 'veh-17', 'RXT4C17'),
    ],
    devices: [
      device('dev-01', 'veh-01', 'TRX904-0108', '10.20.1.8', 'AA:10:20:00:01:08', '07:12'),
      device('dev-02', 'veh-02', 'TRX904-0214', '10.20.2.14', 'AA:10:20:00:02:14', '07:36'),
      device('dev-03', 'veh-03', 'TRX904-0302', '10.20.3.2', 'AA:10:20:00:03:02', '06:50'),
      device('dev-04', 'veh-04', 'TRX904-0419', '10.20.4.19', 'AA:10:20:00:04:19', '07:05'),
      device('dev-05', 'veh-05', 'TRX904-0507', '10.20.5.7', 'AA:10:20:00:05:07', '05:40'),
      device(DEMO_DEVICE_ID, DEMO_VEHICLE_ID, 'TRX904-1704', '10.20.17.4', 'AA:10:20:00:17:04', null),
    ],
    cameras: [
      ...camerasFor('veh-01', 'dev-01', true),
      ...camerasFor('veh-02', 'dev-02', true),
      ...camerasFor('veh-03', 'dev-03', false),
      ...camerasFor('veh-04', 'dev-04', true),
      ...camerasFor('veh-05', 'dev-05', true),
      ...camerasFor(DEMO_VEHICLE_ID, DEMO_DEVICE_ID, false),
    ],
    connections: [
      {
        id: 'con-02',
        deviceId: 'dev-02',
        vehicleId: 'veh-02',
        garageId: 'garage-centro',
        ip: '10.20.2.14',
        mac: 'AA:10:20:00:02:14',
        status: 'ativa',
        connectedAt: at('07:36'),
        disconnectedAt: null,
        origin: 'simulado',
      },
    ],
    recordings: [],
    transfers: [
      {
        id: 'tr-02',
        vehicleId: 'veh-02',
        recordingId: 'rec-02-seed',
        priority: 1,
        status: 'baixando',
        progress: 72,
        attempts: 1,
        resumeOffsetBytes: 1_080_000_000,
        bytesTotal: 1_500_000_000,
        origin: 'simulado',
      },
    ],
    syncRuns: [
      {
        id: 'sync-01',
        vehicleId: 'veh-01',
        garageId: 'garage-centro',
        startedAt: at('07:12'),
        finishedAt: at('07:40'),
        status: 'concluida',
        sessionStatus: 'concluido',
        unauthorizedReason: null,
        recordingsFound: 18,
        pending: 0,
        downloaded: 18,
        failed: 0,
        origin: 'simulado',
      },
      {
        id: 'sync-04',
        vehicleId: 'veh-04',
        garageId: 'garage-centro',
        startedAt: at('07:05'),
        finishedAt: at('07:18'),
        status: 'falha',
        sessionStatus: 'erro',
        unauthorizedReason: null,
        recordingsFound: 9,
        pending: 6,
        downloaded: 2,
        failed: 1,
        origin: 'simulado',
      },
    ],
    periodHistory: [
      period('hist-01', 'veh-01', 'cam-veh-01-1', '2026-09-13T00:00:00-03:00', '2026-09-13T23:59:59-03:00', 'baixado', 'garage-centro', '07:40'),
      period('hist-02', 'veh-01', 'cam-veh-01-2', '2026-09-13T00:00:00-03:00', '2026-09-13T23:59:59-03:00', 'baixado', 'garage-centro', '07:40'),
      period('hist-03', 'veh-03', 'cam-veh-03-1', '2026-09-12T00:00:00-03:00', '2026-09-12T23:59:59-03:00', 'pendente', 'garage-norte', '06:50'),
      period('hist-04', 'veh-03', 'cam-veh-03-1', '2026-09-13T00:00:00-03:00', '2026-09-13T23:59:59-03:00', 'pendente', 'garage-norte', '06:50'),
      period('hist-05', 'veh-04', 'cam-veh-04-1', '2026-09-14T00:00:00-03:00', '2026-09-14T07:00:00-03:00', 'falhou', 'garage-centro', '07:18'),
      period('hist-06', 'veh-17', 'cam-veh-17-1', '2026-09-11T00:00:00-03:00', '2026-09-11T23:59:59-03:00', 'baixado', 'garage-centro', null),
      period('hist-07', 'veh-17', 'cam-veh-17-1', '2026-09-12T00:00:00-03:00', '2026-09-12T23:59:59-03:00', 'pendente', null, null),
      period('hist-08', 'veh-17', 'cam-veh-17-1', '2026-09-13T00:00:00-03:00', '2026-09-13T23:59:59-03:00', 'pendente', null, null),
    ],
    files: [
      file({
        id: 'file-01-mp4',
        vehicleId: 'veh-01',
        cameraId: 'cam-veh-01-1',
        garageId: 'garage-centro',
        name: 'CAM01-FRONTAL-20260913-1800-seq01.mp4',
        path: 'garagem-centro/caminhao-01/2026-09-13/frontal/CAM01-FRONTAL-20260913-1800-seq01.mp4',
        recordedAt: '2026-09-13T18:00:00-03:00',
        kind: 'mp4',
        status: 'disponivel',
        protected: false,
        sizeBytes: 480_000_000,
      }),
      file({
        id: 'file-05-protected',
        vehicleId: 'veh-05',
        cameraId: 'cam-veh-05-1',
        garageId: 'garage-norte',
        name: 'CAM05-FRONTAL-20260801-0900-seq01.mp4',
        path: 'garagem-norte/caminhao-05/2026-08-01/frontal/CAM05-FRONTAL-20260801-0900-seq01.mp4',
        recordedAt: '2026-08-01T09:00:00-03:00',
        kind: 'mp4',
        status: 'disponivel',
        protected: true,
        sizeBytes: 510_000_000,
      }),
      file({
        id: 'file-05-old',
        vehicleId: 'veh-05',
        cameraId: 'cam-veh-05-2',
        garageId: 'garage-norte',
        name: 'CAM05-LATERAL-20260801-0900-seq01.mp4',
        path: 'garagem-norte/caminhao-05/2026-08-01/lateral/CAM05-LATERAL-20260801-0900-seq01.mp4',
        recordedAt: '2026-08-01T09:15:00-03:00',
        kind: 'mp4',
        status: 'disponivel',
        protected: false,
        sizeBytes: 390_000_000,
      }),
    ],
    segments: [
      {
        id: 'seg-01',
        fileId: 'file-01-mp4',
        cameraId: 'cam-veh-01-1',
        vehicleId: 'veh-01',
        sequence: 1,
        startsAt: '2026-09-13T18:00:00-03:00',
        endsAt: '2026-09-13T18:15:00-03:00',
        name: 'CAM01-FRONTAL-20260913-1800-seq01.mp4',
        durationMinutes: 15,
      },
    ],
    processingJobs: [
      {
        id: 'job-02',
        fileId: 'pendente-02',
        vehicleId: 'veh-02',
        stage: 'conversao_mp4',
        status: 'processando',
        startedAt: at('07:36'),
        finishedAt: null,
      },
    ],
    integrityIssues: [
      {
        id: 'iss-04',
        fileId: null,
        cameraId: 'cam-veh-04-2',
        vehicleId: 'veh-04',
        kind: 'corrompido',
        description: 'Arquivo da CAM02 do Caminhão 04 não passou na conferência.',
        detectedAt: at('07:18'),
        origin: 'simulado',
        resolvedAt: null,
      },
      {
        id: 'iss-01-gap',
        fileId: null,
        cameraId: 'cam-veh-01-2',
        vehicleId: 'veh-01',
        kind: 'intervalo_ausente',
        description: 'CAM02 15:30 → 15:45. Gravação ausente no Caminhão 01, placa ABC1D23.',
        detectedAt: at('16:05'),
        origin: 'simulado',
        resolvedAt: null,
      },
    ],
    cameraAudits: [],
    alerts: [
      {
        id: 'alert-04',
        kind: 'arquivo_corrompido',
        severity: 'critical',
        message: 'Caminhão 04: arquivo corrompido na câmera lateral.',
        createdAt: at('07:18'),
        acknowledged: false,
        vehicleId: 'veh-04',
      },
    ],
    storageStatus: {
      usedBytes: 2_450_000_000_000,
      capacityBytes: 8_000_000_000_000,
      availableBytes: 5_550_000_000_000,
      growthBytesPerDay: 40_000_000_000,
      alert: false,
    },
    storagePolicy: {
      retentionDays: 90,
      autoDelete: false,
      alertThresholdPercent: 85,
    },
    settings: {
      autoSync: true,
      segmentMinutes: 15,
      alertOnGap: true,
      alertOnCapacity: true,
      retentionDays: 90,
      integrationStatus: 'aguardando_fabricante',
      integrationNote: 'Aguardando datasheet do primeiro MDVR. Exclusão de vídeo é manual nesta fase. Vídeos não sobem para a nuvem.',
    },
    activity: [
      {
        id: 'act-01',
        type: 'file.available',
        message: 'Caminhão 01 sincronizado. Arquivos disponíveis.',
        at: at('07:40'),
        vehicleId: 'veh-01',
      },
      {
        id: 'act-02',
        type: 'transfer.progress',
        message: 'Caminhão 02 em download, 72%.',
        at: at('07:36'),
        vehicleId: 'veh-02',
      },
      {
        id: 'act-04',
        type: 'alert.raised',
        message: 'Caminhão 04: falha de sincronização e arquivo corrompido.',
        at: at('07:18'),
        vehicleId: 'veh-04',
      },
    ],
    demo: {
      status: 'idle',
      stepIndex: -1,
      steps: DEMO_STEPS.map((step) => ({ ...step })),
    },
  }
}

function vehicle(
  id: string,
  clientId: string,
  lastSeenGarageId: string | null,
  name: string,
  operationalStatus: FleetStore['vehicles'][number]['operationalStatus'],
  connected: string | null,
  synced: string | null,
  lastJobMinutes: number | null,
): FleetStore['vehicles'][number] {
  return {
    id,
    clientId,
    name,
    active: true,
    operationalStatus,
    lastConnectionAt: connected ? at(connected) : null,
    lastSyncAt: synced ? at(synced) : null,
    lastJobMinutes,
    fleetNumber: id.replace('veh-', ''),
    lastSeenGarageId,
  }
}

function period(
  id: string,
  vehicleId: string,
  cameraId: string,
  periodStart: string,
  periodEnd: string,
  status: FleetStore['periodHistory'][number]['status'],
  lastGarageId: string | null,
  completed: string | null,
): FleetStore['periodHistory'][number] {
  return {
    id,
    vehicleId,
    cameraId,
    periodStart,
    periodEnd,
    status,
    lastGarageId,
    lastAttemptAt: completed ? at(completed) : null,
    completedAt: status === 'baixado' && completed ? at(completed) : null,
    bytesDownloaded: status === 'baixado' ? 480_000_000 : 0,
    notes: status === 'pendente' ? 'Backlog aguardando retorno à base' : null,
  }
}

function plate(id: string, vehicleId: string, value: string): FleetStore['plates'][number] {
  return { id, vehicleId, value, active: true }
}

function device(
  id: string,
  vehicleId: string,
  serial: string,
  ip: string,
  mac: string,
  seen: string | null,
): FleetStore['devices'][number] {
  return {
    id,
    vehicleId,
    model: 'TRX-904',
    serial,
    firmware: '2.1.4',
    ip,
    mac,
    lastSeenAt: seen ? at(seen) : null,
  }
}

function camerasFor(vehicleId: string, deviceId: string, online: boolean): FleetStore['cameras'] {
  return [
    { id: `cam-${vehicleId}-1`, vehicleId, deviceId, name: 'CAM01 Frontal', position: 'frontal', online },
    { id: `cam-${vehicleId}-2`, vehicleId, deviceId, name: 'CAM02 Cabine', position: 'cabine', online },
    { id: `cam-${vehicleId}-3`, vehicleId, deviceId, name: 'CAM03 Traseira', position: 'traseira', online },
  ]
}

function file(input: Omit<FleetStore['files'][number], 'indexed' | 'originalFileId' | 'sequence'>): FleetStore['files'][number] {
  return {
    ...input,
    originalFileId: null,
    indexed: input.status === 'disponivel',
    sequence: 1,
  }
}

function at(time: string): string {
  return `2026-09-14T${time}:00-03:00`
}
