import { useMemo, useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { canManageSetup } from '../access.ts'
import { DataTable, PageHeader, QueryState, StatusChip } from '../components/ui.tsx'
import { errorMessage, formatDateTime } from '../format.ts'
import {
  useCameras,
  useClients,
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
  const clients = useClients()
  const garages = useGarages()
  const session = useSession()
  const createVehicle = useCreateVehicle()
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('')
  const [clientId, setClientId] = useState('')
  const [garageId, setGarageId] = useState('')
  const [name, setName] = useState('')
  const [plate, setPlate] = useState('')
  const [fleetNumber, setFleetNumber] = useState('')
  const [newClientId, setNewClientId] = useState('')
  const canEdit = session.data?.user.role ? canManageSetup(session.data.user.role) : false

  const rows = useMemo(() => {
    return (vehicles.data ?? []).filter((vehicle) => {
      const plateValue = plates.data?.find((item) => item.vehicleId === vehicle.id && item.active)?.value ?? ''
      const text = `${vehicle.name} ${vehicle.fleetNumber} ${plateValue}`.toLowerCase()
      if (query && !text.includes(query.toLowerCase())) return false
      if (status && vehicle.operationalStatus !== status) return false
      if (clientId && vehicle.clientId !== clientId) return false
      if (garageId && vehicle.lastSeenGarageId !== garageId) return false
      return true
    })
  }, [vehicles.data, plates.data, query, status, clientId, garageId])

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const selectedClient = newClientId || clients.data?.[0]?.id
    if (!selectedClient) return
    createVehicle.mutate(
      { name, plate, fleetNumber, clientId: selectedClient },
      { onSuccess: () => { setName(''); setPlate(''); setFleetNumber('') } },
    )
  }

  return (
    <div>
      <PageHeader title="Frota" lede="Veículo independente de base. A empresa/cliente fica no cadastro; a base aparece só pela última sessão." />
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
            Cliente
            <select value={clientId} onChange={(event) => setClientId(event.target.value)}>
              <option value="">Todos</option>
              {(clients.data ?? []).map((client) => <option key={client.id} value={client.id}>{client.name}</option>)}
            </select>
          </label>
          <label>
            Última base
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
            <label>
              Cliente
              <select value={newClientId || clients.data?.[0]?.id || ''} onChange={(event) => setNewClientId(event.target.value)} required>
                {(clients.data ?? []).map((client) => <option key={client.id} value={client.id}>{client.name}</option>)}
              </select>
            </label>
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
              { id: 'client', header: 'Cliente', cell: (row) => clients.data?.find((item) => item.id === row.clientId)?.name ?? '—' },
              { id: 'garage', header: 'Última base', cell: (row) => garages.data?.find((item) => item.id === row.lastSeenGarageId)?.name ?? '—' },
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
  const clients = useClients()
  const garages = useGarages()
  const session = useSession()
  const update = useUpdateVehicle()
  const navigate = useNavigate()
  const canEdit = session.data?.user.role ? canManageSetup(session.data.user.role) : false
  const data = detail.data

  return (
    <div>
      <PageHeader title={data?.vehicle.name ?? 'Veículo'} lede="Cliente, placa, equipamento, câmeras, histórico de períodos e sessões por base." />
      <div className="mt-6 flex flex-col gap-4">
        <QueryState isLoading={detail.isLoading} error={detail.error}>
          {data ? (
            <>
              <p className="text-sm leading-6 text-ink-muted">
                Placa {data.plate} · Frota {data.vehicle.fleetNumber} · Cliente {data.client.name} · <StatusChip value={data.vehicle.operationalStatus} />
              </p>
              <p className="text-sm leading-6 text-ink-muted">
                Última base {data.lastSeenGarage?.name ?? '—'} · Última conexão {formatDateTime(data.vehicle.lastConnectionAt)} · Última sincronização {formatDateTime(data.vehicle.lastSyncAt)}
              </p>
              <section className="rounded-lg border border-line bg-white p-5">
                <h2 className="mb-3 text-base font-semibold tracking-tight">Equipamento e câmeras</h2>
                <p>{data.device ? `${data.device.model} · ${data.device.serial} · firmware ${data.device.firmware} · ${data.device.ip} · ${data.device.mac}` : 'Sem equipamento associado.'}</p>
                <p>{data.cameras.map((camera) => camera.name).join(' · ') || 'Sem câmeras.'}</p>
              </section>
              <section className="rounded-lg border border-line bg-white p-5">
                <h2 className="mb-3 text-base font-semibold tracking-tight">Histórico incremental (períodos)</h2>
                <DataTable
                  rows={data.periodHistory}
                  empty="Sem períodos registrados. Backlog aparece aqui quando o veículo ficar dias fora."
                  columns={[
                    { id: 'start', header: 'Início', cell: (row) => formatDateTime(row.periodStart) },
                    { id: 'end', header: 'Fim', cell: (row) => formatDateTime(row.periodEnd) },
                    { id: 'status', header: 'Status', cell: (row) => <StatusChip value={row.status} /> },
                    { id: 'cam', header: 'Câmera', cell: (row) => data.cameras.find((camera) => camera.id === row.cameraId)?.name ?? row.cameraId },
                    {
                      id: 'garage',
                      header: 'Última base',
                      cell: (row) => garages.data?.find((item) => item.id === row.lastGarageId)?.name ?? '—',
                    },
                    { id: 'notes', header: 'Nota', cell: (row) => row.notes ?? '—' },
                  ]}
                />
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
                      clientId: String(form.get('clientId') ?? data.vehicle.clientId),
                      active: form.get('active') === 'on',
                    })
                  }}
                >
                  <label>Nome<input name="name" defaultValue={data.vehicle.name} required /></label>
                  <label>Frota<input name="fleetNumber" defaultValue={data.vehicle.fleetNumber} required /></label>
                  <label>Placa<input name="plate" defaultValue={data.plate} required /></label>
                  <label>
                    Cliente
                    <select name="clientId" defaultValue={data.vehicle.clientId} required>
                      {(clients.data ?? [data.client]).map((client) => <option key={client.id} value={client.id}>{client.name}</option>)}
                    </select>
                  </label>
                  <label className="flex items-center gap-2 normal-case tracking-normal">
                    <input name="active" type="checkbox" defaultChecked={data.vehicle.active} />
                    Ativo
                  </label>
                  <button className="btn btn-primary" type="submit">Salvar</button>
                  <button className="btn btn-secondary" type="button" onClick={() => navigate('/fleet')}>Voltar</button>
                </form>
              ) : null}
              {update.error ? <p className="text-sm text-brand">{errorMessage(update.error)}</p> : null}
              <h2 className="mb-3 text-base font-semibold tracking-tight">Atividades</h2>
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
