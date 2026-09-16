import { useEffect, useState } from 'react'
import { errorMessage } from '../format.ts'
import { useGarageIngestStatus, useGarages, useStartGarageIngest, useVehicles } from '../hooks/useFleet.ts'
import { ProgressBar, StatusChip } from './ui.tsx'

export function GarageArrivalPanel({ enabled }: { enabled: boolean }) {
  const garages = useGarages()
  const vehicles = useVehicles()
  const ingest = useGarageIngestStatus(enabled)
  const start = useStartGarageIngest()
  const [garageId, setGarageId] = useState('')
  const [vehicleId, setVehicleId] = useState('')

  useEffect(() => {
    if (!garageId && garages.data?.[0]) setGarageId(garages.data[0].id)
  }, [garageId, garages.data])

  useEffect(() => {
    if (!vehicleId && vehicles.data?.[0]) setVehicleId(vehicles.data[0].id)
  }, [vehicleId, vehicles.data])

  const status = ingest.data
  const running =
    status != null &&
    status.phase !== 'idle' &&
    status.phase !== 'concluido' &&
    status.phase !== 'nao_autorizado' &&
    status.phase !== 'erro'

  return (
    <section className="rounded-lg border border-line bg-white p-5" aria-label="Chegada na garagem">
      <div className="mb-4 max-w-3xl">
        <h2 className="text-pretty text-base font-semibold tracking-tight text-ink">Chegada na base</h2>
        <p className="mt-1 text-sm leading-6 text-ink-muted">
          Quando o MC904 entra no Wi-Fi da garagem, o servidor local detecta o veículo e puxa as gravações pendentes.
        </p>
      </div>

      <form
        className="flex flex-wrap items-end gap-3"
        onSubmit={(event) => {
          event.preventDefault()
          if (!garageId || !vehicleId) return
          start.mutate({ garageId, vehicleId })
        }}
      >
        <label htmlFor="ingest-garage">
          Garagem
          <select
            id="ingest-garage"
            name="garageId"
            autoComplete="off"
            value={garageId}
            onChange={(event) => setGarageId(event.target.value)}
            required
            disabled={running || start.isPending}
          >
            {(garages.data ?? []).map((garage) => (
              <option key={garage.id} value={garage.id}>
                {garage.name} · {garage.wifiSsid}
              </option>
            ))}
          </select>
        </label>
        <label htmlFor="ingest-vehicle">
          Veículo
          <select
            id="ingest-vehicle"
            name="vehicleId"
            autoComplete="off"
            value={vehicleId}
            onChange={(event) => setVehicleId(event.target.value)}
            required
            disabled={running || start.isPending}
          >
            {(vehicles.data ?? []).map((vehicle) => (
              <option key={vehicle.id} value={vehicle.id}>
                {vehicle.name} · frota {vehicle.fleetNumber}
              </option>
            ))}
          </select>
        </label>
        <button className="btn btn-primary" type="submit" disabled={running || start.isPending} aria-busy={running || start.isPending}>
          {running || start.isPending ? 'Ingestão em andamento…' : 'Veículo entrou no Wi-Fi'}
        </button>
      </form>

      {start.error ? (
        <p className="mt-3 text-sm text-brand" role="alert">
          {errorMessage(start.error)}
        </p>
      ) : null}

      {status && status.phase !== 'idle' ? (
        <div
          className="mt-4 rounded-lg border border-line bg-neutral-50 p-4"
          aria-live="polite"
          aria-atomic="true"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate font-medium text-ink">
                {status.vehicleName ?? 'Veículo'}
                <span className="text-ink-muted"> · </span>
                <span translate="no">{status.plate ?? '—'}</span>
              </p>
              <p className="truncate text-xs text-ink-muted">
                {status.garageName}
                <span className="text-ink-muted/50"> · </span>
                MC904 <span translate="no">{status.deviceSerial ?? '—'}</span>
                <span className="text-ink-muted/50"> · </span>
                {status.origin}
              </p>
            </div>
            <StatusChip value={status.phase} />
          </div>
          <p className="mt-3 text-sm leading-6 text-ink">{status.message}</p>
          <div className="mt-3 max-w-md">
            <ProgressBar value={status.progress} />
          </div>
          {status.filesStored > 0 ? (
            <p className="mt-2 text-xs tabular-nums text-ink-muted">{status.filesStored} arquivo(s) no servidor da base</p>
          ) : null}
          <p className="mt-3 border-t border-line/80 pt-3 text-[11px] leading-5 text-ink-muted">{status.outOfScopeNote}</p>
        </div>
      ) : null}
    </section>
  )
}
