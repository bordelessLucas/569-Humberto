import type {
  Alert,
  AssignDeviceInput,
  Camera,
  Connection,
  CreateCameraInput,
  CreateDeviceInput,
  CreateGarageInput,
  CreatePlateInput,
  CreateUserInput,
  CreateVehicleInput,
  ClientCompany,
  DashboardSummary,
  Device,
  ExportFile,
  FileQuery,
  Garage,
  IntegrityIssue,
  LoginInput,
  MediaFile,
  OperationsReport,
  Plate,
  ProcessingJob,
  Recording,
  ReportQuery,
  RetentionResult,
  Segment,
  Session,
  StorageOverview,
  StoragePolicy,
  SyncRun,
  Transfer,
  User,
  Vehicle,
  Activity,
  CameraAudit,
  CameraCoverage,
  CoverageQuery,
  MediaDetail,
  SyncDetail,
  SystemSettings,
  GarageIngestInput,
  GarageIngestStatus,
  UpdateDeviceInput,
  UpdateGarageInput,
  UpdateUserInput,
  UpdateVehicleInput,
  VehicleDetail,
} from '../../domain/types.ts'

export const restContract = {
  login: { method: 'POST', path: '/auth/login' },
  logout: { method: 'POST', path: '/auth/logout' },
  session: { method: 'GET', path: '/auth/session' },
  users: { method: 'GET', path: '/users' },
  createUser: { method: 'POST', path: '/users' },
  garages: { method: 'GET', path: '/garages' },
  createGarage: { method: 'POST', path: '/garages' },
  clients: { method: 'GET', path: '/clients' },
  vehicles: { method: 'GET', path: '/vehicles' },
  createVehicle: { method: 'POST', path: '/vehicles' },
  plates: { method: 'GET', path: '/plates' },
  createPlate: { method: 'POST', path: '/plates' },
  devices: { method: 'GET', path: '/devices' },
  createDevice: { method: 'POST', path: '/devices' },
  assignDevice: { method: 'POST', path: '/devices/assign' },
  cameras: { method: 'GET', path: '/cameras' },
  createCamera: { method: 'POST', path: '/cameras' },
  connections: { method: 'GET', path: '/connections' },
  recordings: { method: 'GET', path: '/recordings' },
  transfers: { method: 'GET', path: '/transfers' },
  syncRuns: { method: 'GET', path: '/sync-runs' },
  files: { method: 'GET', path: '/files' },
  protectFile: { method: 'POST', path: '/files/:id/protection' },
  segments: { method: 'GET', path: '/segments' },
  processingJobs: { method: 'GET', path: '/processing-jobs' },
  integrityIssues: { method: 'GET', path: '/integrity-issues' },
  cameraAudits: { method: 'GET', path: '/camera-audits' },
  alerts: { method: 'GET', path: '/alerts' },
  acknowledgeAlert: { method: 'POST', path: '/alerts/:id/acknowledge' },
  storage: { method: 'GET', path: '/storage' },
  updateStoragePolicy: { method: 'PUT', path: '/storage/policy' },
  runRetention: { method: 'POST', path: '/storage/retention/run' },
  dashboard: { method: 'GET', path: '/dashboard' },
  activity: { method: 'GET', path: '/activity' },
  report: { method: 'GET', path: '/reports/operations' },
  exportReport: { method: 'GET', path: '/reports/operations/export' },
  realtime: { method: 'GET', path: '/realtime' },
  updateUser: { method: 'PATCH', path: '/users/:id' },
  updateVehicle: { method: 'PATCH', path: '/vehicles/:id' },
  vehicle: { method: 'GET', path: '/vehicles/:id' },
  updateGarage: { method: 'PATCH', path: '/garages/:id' },
  updateDevice: { method: 'PATCH', path: '/devices/:id' },
  syncRun: { method: 'GET', path: '/sync-runs/:id' },
  media: { method: 'GET', path: '/files/:id' },
  coverage: { method: 'GET', path: '/camera-audits/coverage' },
  pauseTransfer: { method: 'POST', path: '/transfers/:id/pause' },
  resumeTransfer: { method: 'POST', path: '/transfers/:id/resume' },
  retryTransfer: { method: 'POST', path: '/transfers/:id/retry' },
  transferPriority: { method: 'PATCH', path: '/transfers/:id/priority' },
  resolveIssue: { method: 'POST', path: '/integrity-issues/:id/resolve' },
  settings: { method: 'GET', path: '/settings' },
  updateSettings: { method: 'PUT', path: '/settings' },
  edgeIngestStatus: { method: 'GET', path: '/edge/ingest' },
  startGarageIngest: { method: 'POST', path: '/edge/ingest' },
} as const

export const realtimeEventTypes = [
  'connection.opened',
  'connection.closed',
  'recordings.discovered',
  'transfer.queued',
  'transfer.progress',
  'transfer.interrupted',
  'transfer.resumed',
  'file.converted',
  'segment.created',
  'audit.completed',
  'gap.detected',
  'alert.raised',
  'file.available',
] as const

export interface FleetApi {
  login(input: LoginInput): Promise<Session>
  logout(): Promise<void>
  getSession(): Promise<Session | null>
  listUsers(): Promise<User[]>
  createUser(input: CreateUserInput): Promise<User>
  listGarages(): Promise<Garage[]>
  createGarage(input: CreateGarageInput): Promise<Garage>
  listClients(): Promise<ClientCompany[]>
  listVehicles(): Promise<Vehicle[]>
  createVehicle(input: CreateVehicleInput): Promise<Vehicle>
  listPlates(): Promise<Plate[]>
  createPlate(input: CreatePlateInput): Promise<Plate>
  listDevices(): Promise<Device[]>
  createDevice(input: CreateDeviceInput): Promise<Device>
  assignDevice(input: AssignDeviceInput): Promise<Device>
  listCameras(): Promise<Camera[]>
  createCamera(input: CreateCameraInput): Promise<Camera>
  listConnections(): Promise<Connection[]>
  listRecordings(): Promise<Recording[]>
  listTransfers(): Promise<Transfer[]>
  listSyncRuns(): Promise<SyncRun[]>
  listFiles(query?: FileQuery): Promise<MediaFile[]>
  setFileProtection(id: string, protectedFile: boolean): Promise<MediaFile>
  listSegments(): Promise<Segment[]>
  listProcessingJobs(): Promise<ProcessingJob[]>
  listIntegrityIssues(): Promise<IntegrityIssue[]>
  listCameraAudits(): Promise<CameraAudit[]>
  listAlerts(): Promise<Alert[]>
  acknowledgeAlert(id: string): Promise<Alert>
  getStorage(): Promise<StorageOverview>
  updateStoragePolicy(input: StoragePolicy): Promise<StorageOverview>
  runRetention(): Promise<RetentionResult>
  getDashboard(): Promise<DashboardSummary>
  listActivity(): Promise<Activity[]>
  getReport(query: ReportQuery): Promise<OperationsReport>
  exportReport(query: ReportQuery): Promise<ExportFile>
  updateUser(id: string, input: UpdateUserInput): Promise<User>
  getVehicle(id: string): Promise<VehicleDetail>
  updateVehicle(id: string, input: UpdateVehicleInput): Promise<VehicleDetail>
  updateGarage(id: string, input: UpdateGarageInput): Promise<Garage>
  updateDevice(id: string, input: UpdateDeviceInput): Promise<Device>
  getSync(id: string): Promise<SyncDetail>
  getMedia(id: string): Promise<MediaDetail>
  getCoverage(query: CoverageQuery): Promise<CameraCoverage>
  pauseTransfer(id: string): Promise<Transfer>
  resumeTransfer(id: string): Promise<Transfer>
  retryTransfer(id: string): Promise<Transfer>
  setTransferPriority(id: string, priority: number): Promise<Transfer>
  resolveIssue(id: string): Promise<IntegrityIssue>
  getSettings(): Promise<SystemSettings>
  updateSettings(input: SystemSettings): Promise<SystemSettings>
  getGarageIngestStatus(): Promise<GarageIngestStatus>
  startGarageIngest(input: GarageIngestInput): Promise<GarageIngestStatus>
}
