import type { Connection, Garage, SyncRun, Vehicle } from './types.ts'

interface GarageLookup {
  garages: Garage[]
  connections: Connection[]
  syncRuns: SyncRun[]
}

/** Resolve a última base vista pelo veículo (sessão), sem vínculo permanente. */
export function lastGarageForVehicle(store: GarageLookup, vehicle: Vehicle): Garage | null {
  if (vehicle.lastSeenGarageId) {
    const known = store.garages.find((item) => item.id === vehicle.lastSeenGarageId)
    if (known) return known
  }
  const connection = store.connections
    .filter((item) => item.vehicleId === vehicle.id)
    .sort((a, b) => b.connectedAt.localeCompare(a.connectedAt))[0]
  if (connection) {
    return store.garages.find((item) => item.id === connection.garageId) ?? null
  }
  const sync = store.syncRuns
    .filter((item) => item.vehicleId === vehicle.id)
    .sort((a, b) => b.startedAt.localeCompare(a.startedAt))[0]
  if (sync) {
    return store.garages.find((item) => item.id === sync.garageId) ?? null
  }
  return null
}
