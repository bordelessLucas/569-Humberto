import { useMemo, useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { canManageSetup } from '../access.ts'
import { DataTable, PageHeader, QueryState, StatusChip } from '../components/ui.tsx'
import { errorMessage, formatDateTime } from '../format.ts'
import {
  useCameras,
  useCreateVehicle,
  useDevices,
  useGarages,
  usePlates,
  useSession,
  useUpdateVehicle,
  useVehicle,
  useVehicles,
} from '../hooks/useFleet.ts'

export function FleetPage() {
  const vehicles = useVehicles()
  const plates = usePlates()
  const devices = useDevices()
  const cameras = useCameras()
  const garages = useGarages()
  const session = useSession()
  const createVehicle = useCreateVehicle()
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('')
  const [garageId, setGarageId] = useState('')
  const [name, setName] = useState('')
  const [plate, setPlate] = useState('')
  const [fleetNumber, setFleetNumber] = useState('')
  const canEdit = session.data?.user.role ? canManageSetup(session.data.user.role) : false

  const rows = useMemo(() => {
    return (vehicles.data ?? []).filter((vehicle) => {
      const plateValue = plates.data?.find((item) => item.vehicleId === vehicle.id && item.active)?.value ?? ''
      const text = `${vehicle.name} ${vehicle.fleetNumber} ${plateValue}`.toLowerCase()
      if (query && !text.includes(query.toLowerCase())) return false
      if (status && vehicle.operationalStatus !== status) return false
      if (garageId && vehicle.garageId !== garageId) return false
      return true
    })
  }, [vehicles.data, plates.data, query, status, garageId])

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const selectedGarage = garageId || garages.data?.[0]?.id
    if (!selectedGarage) return
    createVehicle.mutate(
      { name, plate, fleetNumber, garageId: selectedGarage },
      { onSuccess: () => { setName(''); setPlate(''); setFleetNumber('') } },
    )
  }

  return (
    <div>
      <PageHeader title="Frota" lede="Placa, número da frota, garagem e equipamento no mesmo cadastro. A placa não é um módulo separado." />
      <div className="mt-6 flex flex-col gap-4">
        <form className="flex flex-wrap items-end gap-3">
          <label>Buscar<input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Nome ou placa" /></label>
          <label>
            Status
            <select value={status} onChange={(event) => setStatus(event.target.value)}>
              <option value="">Todos</option>
              <option value="concluido">Concluído</option>
              <option value="baixando">Baixando</option>
              <option value="pendente">Pendente</option>
              <option value="erro">Com erro</option>
              <option value="conectado">Conectado</option>
              <option value="desconectado">Desconectado</option>
            </select>
          </label>
          <label>
            Garagem
            <select value={garageId} onChange={(event) => setGarageId(event.target.value)}>
              <option value="">Todas</option>
              {(garages.data ?? []).map((garage) => <option key={garage.id} value={garage.id}>{garage.name}</option>)}
            </select>
          </label>
        </form>
        {canEdit ? (
          <form className="flex flex-wrap items-end gap-3" onSubmit={onSubmit}>
            <label>Veículo<input value={name} onChange={(event) => setName(event.target.value)} required /></label>
            <label>Frota<input value={fleetNumber} onChange={(event) => setFleetNumber(event.target.value)} required /></label>
            <label>Placa<input value={plate} onChange={(event) => setPlate(event.target.value)} required /></label>
            <button className="btn btn-primary" type="submit">Cadastrar</button>
          </form>
        ) : <p className="text-sm leading-6 text-ink-muted">Este perfil consulta a frota. Cadastro e edição ficam com o administrador.</p>}
        {createVehicle.error ? <p className="text-sm text-brand">{errorMessage(createVehicle.error)}</p> : null}
        <QueryState isLoading={vehicles.isLoading} error={vehicles.error}>
          <DataTable
            rows={rows}
            empty="Nenhum veículo para este filtro."
            columns={[
              { id: 'name', header: 'Veículo', cell: (row) => <Link to={`/vehicles/${row.id}`}>{row.name}</Link> },
              { id: 'fleet', header: 'Frota', cell: (row) => row.fleetNumber },
              { id: 'plate', header: 'Placa', cell: (row) => plates.data?.find((item) => item.vehicleId === row.id && item.active)?.value ?? '—' },
              { id: 'garage', header: 'Garagem', cell: (row) => garages.data?.find((item) => item.id === row.garageId)?.name ?? '—' },
              { id: 'device', header: 'Equipamento', cell: (row) => devices.data?.find((item) => item.vehicleId === row.id)?.serial ?? '—' },
              { id: 'cameras', header: 'Câmeras', cell: (row) => String(cameras.data?.filter((item) => item.vehicleId === row.id).length ?? 0) },
              { id: 'status', header: 'Status', cell: (row) => <StatusChip value={row.operationalStatus} /> },
            ]}
          />
        </QueryState>
      </div>
    </div>
  )
}

export function VehiclePage() {
  const params = useParams()
  const id = params.id ?? ''
  const detail = useVehicle(id)
  const session = useSession()
  const update = useUpdateVehicle()
  const navigate = useNavigate()
  const canEdit = session.data?.user.role ? canManageSetup(session.data.user.role) : false
  const data = detail.data

  return (
    <div>
      <PageHeader title={data?.vehicle.name ?? 'Veículo'} lede="Placa, garagem, equipamento, câmeras, histórico e status." />
      <div className="mt-6 flex flex-col gap-4">
        <QueryState isLoading={detail.isLoading} error={detail.error}>
          {data ? (
            <>
              <p className="text-sm leading-6 text-ink-muted">Placa {data.plate} · Frota {data.vehicle.fleetNumber} · <StatusChip value={data.vehicle.operationalStatus} /></p>
              <p className="text-sm leading-6 text-ink-muted">Última conexão {formatDateTime(data.vehicle.lastConnectionAt)} · Última sincronização {formatDateTime(data.vehicle.lastSyncAt)}</p>
              <section className="rounded-2xl border border-line bg-white p-5">
                <h2 className="mb-3 text-base font-semibold tracking-tight">Equipamento e câmeras</h2>
                <p>{data.device ? `${data.device.model} · ${data.device.serial} · firmware ${data.device.firmware} · ${data.device.ip} · ${data.device.mac}` : 'Sem equipamento associado.'}</p>
                <p>{data.cameras.map((camera) => camera.name).join(' · ') || 'Sem câmeras.'}</p>
                <p>
                  <Link to="/connections">Ver conexões</Link>
                  {' · '}
                  <Link to="/synchronizations">Ver sincronizações</Link>
                  {' · '}
                  <Link to="/camera-audit">Auditar câmeras</Link>
                </p>
              </section>
              {canEdit ? (
                <form
                  className="flex flex-wrap items-end gap-3"
                  onSubmit={(event) => {
                    event.preventDefault()
                    const form = new FormData(event.currentTarget)
                    update.mutate({
                      id,
                      name: String(form.get('name') ?? ''),
                      fleetNumber: String(form.get('fleetNumber') ?? ''),
                      plate: String(form.get('plate') ?? ''),
                      garageId: String(form.get('garageId') ?? data.vehicle.garageId),
                    })
                  }}
                >
                  <label>Nome<input name="name" defaultValue={data.vehicle.name} required /></label>
                  <label>Frota<input name="fleetNumber" defaultValue={data.vehicle.fleetNumber} required /></label>
                  <label>Placa<input name="plate" defaultValue={data.plate} required /></label>
                  <label>Garagem<input name="garageId" defaultValue={data.vehicle.garageId} required /></label>
                  <button className="btn btn-primary" type="submit">Salvar</button>
                  <button className="btn btn-secondary" type="button" onClick={() => navigate('/fleet')}>Voltar</button>
                </form>
              ) : null}
              {update.error ? <p className="text-sm text-brand">{errorMessage(update.error)}</p> : null}
              <h2 className="mb-3 text-base font-semibold tracking-tight">Histórico</h2>
              <DataTable
                rows={data.activity}
                empty="Sem atividades deste veículo."
                columns={[
                  { id: 'at', header: 'Quando', cell: (row) => formatDateTime(row.at) },
                  { id: 'message', header: 'Registro', cell: (row) => row.message },
                ]}
              />
            </>
          ) : null}
        </QueryState>
      </div>
    </div>
  )
}
