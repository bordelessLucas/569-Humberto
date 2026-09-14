export type UserRole = 'admin' | 'operador' | 'auditor' | 'gestor'

export type OperationalStatus =
  | 'desconectado'
  | 'conectado'
  | 'concluido'
  | 'baixando'
  | 'pendente'
  | 'erro'
  | 'interrompido'

export type TransferStatus =
  | 'na_fila'
  | 'baixando'
  | 'pausado'
  | 'interrompido'
  | 'concluido'
  | 'erro'

export type ConnectionStatus = 'ativa' | 'encerrada'

export type DataOrigin = 'simulado' | 'equipamento'

export type FileKind = 'original' | 'mp4'

export type FileStatus =
  | 'identificado'
  | 'recebido'
  | 'convertendo'
  | 'convertido'
  | 'segmentado'
  | 'disponivel'
  | 'corrompido'
  | 'excluido'

export type ProcessingStage = 'recebido' | 'validacao' | 'conversao_mp4' | 'corte_15' | 'indexacao' | 'auditoria'

export type JobStatus = 'na_fila' | 'processando' | 'concluido' | 'erro'

export type IntegrityKind =
  | 'corrompido'
  | 'incompleto'
  | 'intervalo_ausente'
  | 'gravacao_faltante'

export type AlertKind = 'capacidade' | 'lacuna' | 'falha_sync' | 'arquivo_corrompido'

export type AlertSeverity = 'info' | 'warning' | 'critical'

export type SyncStatus = 'em_andamento' | 'interrompida' | 'concluida' | 'falha'

export type ActivityType =
  | 'connection.opened'
  | 'connection.closed'
  | 'recordings.discovered'
  | 'transfer.queued'
  | 'transfer.progress'
  | 'transfer.interrupted'
  | 'transfer.resumed'
  | 'file.converted'
  | 'segment.created'
  | 'audit.completed'
  | 'gap.detected'
  | 'alert.raised'
  | 'file.available'
  | 'retention.ran'
  | 'user.created'

export interface User {
  id: string
  name: string
  email: string
  role: UserRole
  active: boolean
}

export interface Session {
  token: string
  user: User
  expiresAt: string
}

export interface Garage {
  id: string
  name: string
  city: string
  wifiSsid: string
}

export interface Vehicle {
  id: string
  garageId: string
  name: string
  fleetNumber: string
  operationalStatus: OperationalStatus
  lastConnectionAt: string | null
  lastSyncAt: string | null
  lastJobMinutes: number | null
}

export interface Plate {
  id: string
  vehicleId: string
  value: string
  active: boolean
}

export interface Device {
  id: string
  vehicleId: string | null
  model: string
  serial: string
  firmware: string
  ip: string
  mac: string
  lastSeenAt: string | null
}

export interface Camera {
  id: string
  vehicleId: string
  deviceId: string
  name: string
  position: string
  online: boolean
}

export interface Connection {
  id: string
  deviceId: string
  vehicleId: string
  garageId: string
  ip: string
  mac: string
  status: ConnectionStatus
  connectedAt: string
  disconnectedAt: string | null
  origin: DataOrigin
}

export interface Recording {
  id: string
  vehicleId: string
  cameraId: string
  deviceId: string
  startsAt: string
  endsAt: string
  status: 'no_equipamento' | 'pendente' | 'baixada'
}

export interface Transfer {
  id: string
  vehicleId: string
  recordingId: string
  priority: number
  status: TransferStatus
  progress: number
  attempts: number
  resumeOffsetBytes: number
  bytesTotal: number
  origin: DataOrigin
}

export interface SyncRun {
  id: string
  vehicleId: string
  garageId: string
  startedAt: string
  finishedAt: string | null
  status: SyncStatus
  recordingsFound: number
  pending: number
  downloaded: number
  failed: number
  origin: DataOrigin
}

export interface MediaFile {
  id: string
  garageId: string
  vehicleId: string
  cameraId: string
  recordedAt: string
  kind: FileKind
  originalFileId: string | null
  path: string
  name: string
  status: FileStatus
  protected: boolean
  indexed: boolean
  sizeBytes: number
  sequence: number | null
}

export interface Segment {
  id: string
  fileId: string
  cameraId: string
  vehicleId: string
  sequence: number
  startsAt: string
  endsAt: string
  name: string
  durationMinutes: 15
}

export interface ProcessingJob {
  id: string
  fileId: string
  vehicleId: string
  stage: ProcessingStage
  status: JobStatus
  startedAt: string | null
  finishedAt: string | null
}

export interface IntegrityIssue {
  id: string
  fileId: string | null
  cameraId: string
  vehicleId: string
  kind: IntegrityKind
  description: string
  detectedAt: string
  origin: DataOrigin
  resolvedAt: string | null
}

export interface CameraAudit {
  id: string
  cameraId: string
  vehicleId: string
  inSync: boolean
  gapCount: number
  lastCheckedAt: string
  notes: string
}

export interface Alert {
  id: string
  kind: AlertKind
  severity: AlertSeverity
  message: string
  createdAt: string
  acknowledged: boolean
  vehicleId: string | null
}

export interface StoragePolicy {
  retentionDays: number
  autoDelete: boolean
  alertThresholdPercent: number
}

export interface StorageStatus {
  usedBytes: number
  availableBytes: number
  capacityBytes: number
  growthBytesPerDay: number
  alert: boolean
}

export interface StorageOverview {
  status: StorageStatus
  policy: StoragePolicy
}

export interface RetentionResult {
  deleted: number
  keptProtected: number
  ranAt: string
}

export interface Activity {
  id: string
  type: ActivityType
  message: string
  at: string
  vehicleId: string | null
}

export interface DashboardVehicleRow {
  vehicleId: string
  name: string
  plate: string
  status: OperationalStatus
  camerasReady: number
  camerasTotal: number
  durationMinutes: number | null
  progress: number | null
  lastUpdate: string | null
}

export interface DashboardSummary {
  concluded: number
  downloading: number
  pending: number
  withError: number
  total: number
  connected: number
  activeSyncs: number
  activeDownloads: number
  camerasOnline: number
  filesProcessed: number
  segments15: number
  storageUsedPercent: number
  updatedAt: string
  vehicles: DashboardVehicleRow[]
}

export interface OperationsReport {
  from: string
  to: string
  synchronizations: number
  downloads: number
  processings: number
  failures: number
  byVehicle: Array<{
    vehicleId: string
    name: string
    plate: string
    downloads: number
    failures: number
  }>
}

export interface ExportFile {
  filename: string
  mimeType: 'text/csv'
  content: string
}

export interface FileQuery {
  plate?: string
  vehicleId?: string
  date?: string
  time?: string
  cameraId?: string
  garageId?: string
  status?: FileStatus
}

export interface ReportQuery {
  from: string
  to: string
  vehicleId?: string
}

export interface LoginInput {
  email: string
  password: string
}

export interface CreateUserInput {
  name: string
  email: string
  role: UserRole
  password: string
}

export interface CreateGarageInput {
  name: string
  city: string
  wifiSsid: string
}

export interface CreateVehicleInput {
  garageId: string
  name: string
  plate: string
  fleetNumber: string
  deviceId?: string
}

export interface CreatePlateInput {
  vehicleId: string
  value: string
}

export interface CreateDeviceInput {
  model: string
  serial: string
  firmware: string
  ip: string
  mac: string
  vehicleId?: string
}

export interface CreateCameraInput {
  vehicleId: string
  deviceId: string
  name: string
  position: string
}

export interface AssignDeviceInput {
  deviceId: string
  vehicleId: string
}

export interface UpdateUserInput {
  name: string
  role: UserRole
  active: boolean
}

export interface UpdateVehicleInput {
  name: string
  garageId: string
  fleetNumber: string
  plate: string
}

export interface UpdateDeviceInput {
  model: string
  serial: string
  firmware: string
  ip: string
  mac: string
  vehicleId: string | null
}

export interface UpdateGarageInput {
  name: string
  city: string
  wifiSsid: string
}

export interface SystemSettings {
  autoSync: boolean
  segmentMinutes: 15
  alertOnGap: boolean
  alertOnCapacity: boolean
  retentionDays: number
  integrationStatus: 'aguardando_fabricante' | 'configurada'
  integrationNote: string
}

export interface VehicleDetail {
  vehicle: Vehicle
  plate: string
  garage: Garage
  device: Device | null
  cameras: Camera[]
  activity: Activity[]
  connections: Connection[]
}

export interface SyncDetail {
  sync: SyncRun
  vehicleName: string
  plate: string
  recordings: Recording[]
}

export interface MediaDetail {
  file: MediaFile
  original: MediaFile | null
  segments: Segment[]
  issues: IntegrityIssue[]
  jobs: ProcessingJob[]
  vehicleName: string
  plate: string
  cameraName: string
}

export interface CoverageBlock {
  label: string
  covered: boolean
  issueId: string | null
}

export interface CameraCoverageRow {
  cameraId: string
  name: string
  blocks: CoverageBlock[]
}

export interface CameraCoverage {
  vehicleId: string
  vehicleName: string
  plate: string
  date: string
  cameras: CameraCoverageRow[]
}

export interface CoverageQuery {
  vehicleId: string
  date: string
}

export interface DemoStep {
  id: string
  label: string
  done: boolean
}

export interface DemoState {
  status: 'idle' | 'running' | 'done'
  stepIndex: number
  steps: DemoStep[]
}
