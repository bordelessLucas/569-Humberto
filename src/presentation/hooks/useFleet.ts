import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type {
  AssignDeviceInput,
  CreateCameraInput,
  CreateDeviceInput,
  CreateGarageInput,
  CreatePlateInput,
  CoverageQuery,
  CreateUserInput,
  CreateVehicleInput,
  FileQuery,
  LoginInput,
  ReportQuery,
  StoragePolicy,
  SystemSettings,
  UpdateDeviceInput,
  UpdateGarageInput,
  UpdateUserInput,
  UpdateVehicleInput,
} from '../../domain/types.ts'
import { api } from '../../services/api/client.ts'
import { queryKeys } from '../../services/api/query-keys.ts'

export function useSession() {
  return useQuery({ queryKey: queryKeys.session, queryFn: () => api.getSession() })
}

export function useLogin() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: LoginInput) => api.login(input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.all })
    },
  })
}

export function useLogout() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => api.logout(),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.all })
    },
  })
}

export function useDashboard() {
  return useQuery({ queryKey: queryKeys.dashboard, queryFn: () => api.getDashboard() })
}

export function useUsers() {
  return useQuery({ queryKey: queryKeys.users, queryFn: () => api.listUsers() })
}

export function useGarages() {
  return useQuery({ queryKey: queryKeys.garages, queryFn: () => api.listGarages() })
}

export function useVehicles() {
  return useQuery({ queryKey: queryKeys.vehicles, queryFn: () => api.listVehicles() })
}

export function usePlates() {
  return useQuery({ queryKey: queryKeys.plates, queryFn: () => api.listPlates() })
}

export function useDevices() {
  return useQuery({ queryKey: queryKeys.devices, queryFn: () => api.listDevices() })
}

export function useCameras() {
  return useQuery({ queryKey: queryKeys.cameras, queryFn: () => api.listCameras() })
}

export function useConnections() {
  return useQuery({ queryKey: queryKeys.connections, queryFn: () => api.listConnections() })
}

export function useRecordings() {
  return useQuery({ queryKey: queryKeys.recordings, queryFn: () => api.listRecordings() })
}

export function useTransfers() {
  return useQuery({ queryKey: queryKeys.transfers, queryFn: () => api.listTransfers() })
}

export function useSyncRuns() {
  return useQuery({ queryKey: queryKeys.syncRuns, queryFn: () => api.listSyncRuns() })
}

export function useFiles(query: FileQuery) {
  return useQuery({ queryKey: [...queryKeys.files, query], queryFn: () => api.listFiles(query) })
}

export function useSegments() {
  return useQuery({ queryKey: queryKeys.segments, queryFn: () => api.listSegments() })
}

export function useProcessingJobs() {
  return useQuery({ queryKey: queryKeys.processing, queryFn: () => api.listProcessingJobs() })
}

export function useIntegrityIssues() {
  return useQuery({ queryKey: queryKeys.integrity, queryFn: () => api.listIntegrityIssues() })
}

export function useCameraAudits() {
  return useQuery({ queryKey: queryKeys.audits, queryFn: () => api.listCameraAudits() })
}

export function useAlerts() {
  return useQuery({ queryKey: queryKeys.alerts, queryFn: () => api.listAlerts() })
}

export function useStorage() {
  return useQuery({ queryKey: queryKeys.storage, queryFn: () => api.getStorage() })
}

export function useActivity() {
  return useQuery({ queryKey: queryKeys.activity, queryFn: () => api.listActivity() })
}

export function useReport(query: ReportQuery) {
  return useQuery({
    queryKey: ['fleet', 'report', query],
    queryFn: () => api.getReport(query),
    enabled: query.from.length > 0 && query.to.length > 0,
  })
}

function useRefresh() {
  const queryClient = useQueryClient()
  return async () => {
    await queryClient.invalidateQueries({ queryKey: queryKeys.all })
  }
}

export function useCreateUser() {
  const refresh = useRefresh()
  return useMutation({ mutationFn: (input: CreateUserInput) => api.createUser(input), onSuccess: refresh })
}

export function useCreateGarage() {
  const refresh = useRefresh()
  return useMutation({ mutationFn: (input: CreateGarageInput) => api.createGarage(input), onSuccess: refresh })
}

export function useCreateVehicle() {
  const refresh = useRefresh()
  return useMutation({ mutationFn: (input: CreateVehicleInput) => api.createVehicle(input), onSuccess: refresh })
}

export function useCreatePlate() {
  const refresh = useRefresh()
  return useMutation({ mutationFn: (input: CreatePlateInput) => api.createPlate(input), onSuccess: refresh })
}

export function useCreateDevice() {
  const refresh = useRefresh()
  return useMutation({ mutationFn: (input: CreateDeviceInput) => api.createDevice(input), onSuccess: refresh })
}

export function useAssignDevice() {
  const refresh = useRefresh()
  return useMutation({ mutationFn: (input: AssignDeviceInput) => api.assignDevice(input), onSuccess: refresh })
}

export function useCreateCamera() {
  const refresh = useRefresh()
  return useMutation({ mutationFn: (input: CreateCameraInput) => api.createCamera(input), onSuccess: refresh })
}

export function useSetFileProtection() {
  const refresh = useRefresh()
  return useMutation({
    mutationFn: (input: { id: string; protectedFile: boolean }) => api.setFileProtection(input.id, input.protectedFile),
    onSuccess: refresh,
  })
}

export function useAcknowledgeAlert() {
  const refresh = useRefresh()
  return useMutation({ mutationFn: (id: string) => api.acknowledgeAlert(id), onSuccess: refresh })
}

export function useUpdateStoragePolicy() {
  const refresh = useRefresh()
  return useMutation({ mutationFn: (input: StoragePolicy) => api.updateStoragePolicy(input), onSuccess: refresh })
}

export function useRunRetention() {
  const refresh = useRefresh()
  return useMutation({ mutationFn: () => api.runRetention(), onSuccess: refresh })
}

export function useVehicle(id: string) {
  return useQuery({ queryKey: ['fleet', 'vehicle', id], queryFn: () => api.getVehicle(id), enabled: id.length > 0 })
}

export function useSync(id: string) {
  return useQuery({ queryKey: ['fleet', 'sync', id], queryFn: () => api.getSync(id), enabled: id.length > 0 })
}

export function useMedia(id: string) {
  return useQuery({ queryKey: ['fleet', 'media', id], queryFn: () => api.getMedia(id), enabled: id.length > 0 })
}

export function useCoverage(query: CoverageQuery) {
  return useQuery({
    queryKey: ['fleet', 'coverage', query],
    queryFn: () => api.getCoverage(query),
    enabled: query.vehicleId.length > 0 && query.date.length > 0,
  })
}

export function useSettings() {
  return useQuery({ queryKey: ['fleet', 'settings'], queryFn: () => api.getSettings() })
}

export function useUpdateUser() {
  const refresh = useRefresh()
  return useMutation({ mutationFn: (input: { id: string } & UpdateUserInput) => api.updateUser(input.id, input), onSuccess: refresh })
}

export function useUpdateVehicle() {
  const refresh = useRefresh()
  return useMutation({ mutationFn: (input: { id: string } & UpdateVehicleInput) => api.updateVehicle(input.id, input), onSuccess: refresh })
}

export function useUpdateGarage() {
  const refresh = useRefresh()
  return useMutation({ mutationFn: (input: { id: string } & UpdateGarageInput) => api.updateGarage(input.id, input), onSuccess: refresh })
}

export function useUpdateDevice() {
  const refresh = useRefresh()
  return useMutation({ mutationFn: (input: { id: string } & UpdateDeviceInput) => api.updateDevice(input.id, input), onSuccess: refresh })
}

export function usePauseTransfer() {
  const refresh = useRefresh()
  return useMutation({ mutationFn: (id: string) => api.pauseTransfer(id), onSuccess: refresh })
}

export function useResumeTransfer() {
  const refresh = useRefresh()
  return useMutation({ mutationFn: (id: string) => api.resumeTransfer(id), onSuccess: refresh })
}

export function useRetryTransfer() {
  const refresh = useRefresh()
  return useMutation({ mutationFn: (id: string) => api.retryTransfer(id), onSuccess: refresh })
}

export function useSetPriority() {
  const refresh = useRefresh()
  return useMutation({ mutationFn: (input: { id: string; priority: number }) => api.setTransferPriority(input.id, input.priority), onSuccess: refresh })
}

export function useResolveIssue() {
  const refresh = useRefresh()
  return useMutation({ mutationFn: (id: string) => api.resolveIssue(id), onSuccess: refresh })
}

export function useUpdateSettings() {
  const refresh = useRefresh()
  return useMutation({ mutationFn: (input: SystemSettings) => api.updateSettings(input), onSuccess: refresh })
}

export function useExportReport() {
  return useMutation({
    mutationFn: (query: ReportQuery) => api.exportReport(query),
    onSuccess: (file) => {
      const blob = new Blob([file.content], { type: file.mimeType })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = file.filename
      link.click()
      URL.revokeObjectURL(url)
    },
  })
}
