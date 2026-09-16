import { useState, type FormEvent } from 'react'
import { canManageSetup } from '../access.ts'
import { DataTable, PageHeader, QueryState } from '../components/ui.tsx'
import { errorMessage, formatBytes } from '../format.ts'
import {
  useCameras,
  useCreateCamera,
  useCreateDevice,
  useCreateGarage,
  useCreateUser,
  useDevices,
  useGarages,
  useSession,
  useSettings,
  useStorage,
  useUpdateSettings,
  useUpdateUser,
  useUsers,
  useVehicles,
  useRunRetention,
} from '../hooks/useFleet.ts'

export function GaragesPage() {
  const garages = useGarages()
  const session = useSession()
  const createGarage = useCreateGarage()
  const canEdit = session.data?.user.role ? canManageSetup(session.data.user.role) : false
  const [name, setName] = useState('')
  const [city, setCity] = useState('')
  const [wifiSsid, setWifiSsid] = useState('')

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    createGarage.mutate({ name, city, wifiSsid }, { onSuccess: () => { setName(''); setCity(''); setWifiSsid('') } })
  }

  return (
    <div>
      <PageHeader title="Garagens" lede="Base, rede e ponto de entrada da frota. O administrador prepara; o operador consulta." />
      <div className="mt-6 flex flex-col gap-4">
        {canEdit ? (
          <form className="flex flex-wrap items-end gap-3" onSubmit={onSubmit}>
            <label>Nome<input value={name} onChange={(event) => setName(event.target.value)} required /></label>
            <label>Cidade<input value={city} onChange={(event) => setCity(event.target.value)} required /></label>
            <label>SSID<input value={wifiSsid} onChange={(event) => setWifiSsid(event.target.value)} required /></label>
            <button className="btn btn-primary" type="submit">Cadastrar</button>
          </form>
        ) : <p className="text-sm leading-6 text-ink-muted">Somente leitura.</p>}
        <QueryState isLoading={garages.isLoading} error={garages.error}>
          <DataTable
            rows={garages.data ?? []}
            empty="Nenhuma garagem."
            columns={[
              { id: 'name', header: 'Garagem', cell: (row) => row.name },
              { id: 'city', header: 'Cidade', cell: (row) => row.city },
              { id: 'ssid', header: 'Rede', cell: (row) => row.wifiSsid },
            ]}
          />
        </QueryState>
      </div>
    </div>
  )
}

export function DevicesPage() {
  const devices = useDevices()
  const vehicles = useVehicles()
  const session = useSession()
  const createDevice = useCreateDevice()
  const canEdit = session.data?.user.role ? canManageSetup(session.data.user.role) : false
  const [serial, setSerial] = useState('')
  const [mac, setMac] = useState('')
  const [ip, setIp] = useState('')

  return (
    <div>
      <PageHeader title="Equipamentos" lede="MDVR/Dashcam, serial, MAC, IP e firmware. A associação ao veículo é cadastral, não detecção de rede." />
      <div className="mt-6 flex flex-col gap-4">
        {canEdit ? (
          <form className="flex flex-wrap items-end gap-3" onSubmit={(event) => {
            event.preventDefault()
            createDevice.mutate({ model: 'MC904', serial, firmware: '2.1.4', ip, mac }, { onSuccess: () => { setSerial(''); setMac(''); setIp('') } })
          }}>
            <label>Serial<input value={serial} onChange={(event) => setSerial(event.target.value)} required /></label>
            <label>MAC<input value={mac} onChange={(event) => setMac(event.target.value)} required /></label>
            <label>IP<input value={ip} onChange={(event) => setIp(event.target.value)} required /></label>
            <button className="btn btn-primary" type="submit">Cadastrar MC904</button>
          </form>
        ) : <p className="text-sm leading-6 text-ink-muted">Somente leitura.</p>}
        <QueryState isLoading={devices.isLoading} error={devices.error}>
          <DataTable
            rows={devices.data ?? []}
            empty="Nenhum equipamento."
            columns={[
              { id: 'model', header: 'Modelo', cell: (row) => row.model },
              { id: 'serial', header: 'Serial', cell: (row) => row.serial },
              { id: 'firmware', header: 'Firmware', cell: (row) => row.firmware },
              { id: 'mac', header: 'MAC', cell: (row) => row.mac },
              { id: 'ip', header: 'IP', cell: (row) => row.ip },
              { id: 'vehicle', header: 'Veículo', cell: (row) => vehicles.data?.find((item) => item.id === row.vehicleId)?.name ?? 'Livre' },
            ]}
          />
        </QueryState>
      </div>
    </div>
  )
}

export function CamerasPage() {
  const cameras = useCameras()
  const vehicles = useVehicles()
  const devices = useDevices()
  const session = useSession()
  const createCamera = useCreateCamera()
  const canEdit = session.data?.user.role ? canManageSetup(session.data.user.role) : false

  return (
    <div>
      <PageHeader title="Câmeras" lede="Associação da câmera ao veículo e ao equipamento. CAM01 frontal, CAM02 cabine, CAM03 traseira." />
      <div className="mt-6 flex flex-col gap-4">
        {canEdit ? (
          <form className="flex flex-wrap items-end gap-3" onSubmit={(event) => {
            event.preventDefault()
            const form = new FormData(event.currentTarget)
            createCamera.mutate({
              vehicleId: String(form.get('vehicleId') ?? ''),
              deviceId: String(form.get('deviceId') ?? ''),
              name: String(form.get('name') ?? ''),
              position: String(form.get('position') ?? ''),
            })
          }}>
            <label>Nome<input name="name" required /></label>
            <label>Posição<input name="position" required /></label>
            <label>Veículo<select name="vehicleId">{(vehicles.data ?? []).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
            <label>Equipamento<select name="deviceId">{(devices.data ?? []).map((item) => <option key={item.id} value={item.id}>{item.serial}</option>)}</select></label>
            <button className="btn btn-primary" type="submit">Associar</button>
          </form>
        ) : null}
        {createCamera.error ? <p className="text-sm text-brand">{errorMessage(createCamera.error)}</p> : null}
        <QueryState isLoading={cameras.isLoading} error={cameras.error}>
          <DataTable
            rows={cameras.data ?? []}
            empty="Nenhuma câmera."
            columns={[
              { id: 'name', header: 'Câmera', cell: (row) => row.name },
              { id: 'position', header: 'Posição', cell: (row) => row.position },
              { id: 'vehicle', header: 'Veículo', cell: (row) => vehicles.data?.find((item) => item.id === row.vehicleId)?.name ?? row.vehicleId },
              { id: 'device', header: 'Equipamento', cell: (row) => devices.data?.find((item) => item.id === row.deviceId)?.serial ?? row.deviceId },
              { id: 'online', header: 'Situação', cell: (row) => row.online ? 'Online' : 'Offline' },
            ]}
          />
        </QueryState>
      </div>
    </div>
  )
}

export function StoragePage() {
  const storage = useStorage()
  const session = useSession()
  const retention = useRunRetention()
  const canEdit = session.data?.user.role ? canManageSetup(session.data.user.role) : false
  const overview = storage.data
  const used = overview ? Math.round((overview.status.usedBytes / overview.status.capacityBytes) * 100) : 0

  return (
    <div>
      <PageHeader title="Armazenamento" lede="Espaço usado, retenção informativa e arquivos protegidos. Exclusão automática está fora desta fase — só exclusão manual." />
      <div className="mt-6 flex flex-col gap-4">
        <QueryState isLoading={storage.isLoading} error={storage.error}>
          {overview ? (
            <section className="rounded-2xl border border-line bg-white p-5">
              <p>{formatBytes(overview.status.usedBytes)} de {formatBytes(overview.status.capacityBytes)}. {overview.status.alert ? 'Alerta de capacidade aberto.' : 'Sem alerta de capacidade.'}</p>
              <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-neutral-200"><span className="block h-full bg-brand" style={{ width: `${used}%` }} /></div>
              <p className="text-sm leading-6 text-ink-muted">
                Retenção de referência: {overview.policy.retentionDays} dias. Exclusão automática desligada nesta fase
                {overview.policy.autoDelete ? ' (flag legado ainda ligada no store — política do produto: manual).' : '.'}
              </p>
              {canEdit ? <button className="btn btn-danger" type="button" onClick={() => retention.mutate()}>Simular exclusão manual</button> : <p className="text-sm leading-6 text-ink-muted">Somente leitura.</p>}
              {retention.data ? <p className="text-sm leading-6 text-ink-muted">Excluídos: {retention.data.deleted}. Protegidos mantidos: {retention.data.keptProtected}.</p> : null}
            </section>
          ) : null}
        </QueryState>
      </div>
    </div>
  )
}

export function UsersPage() {
  const users = useUsers()
  const createUser = useCreateUser()
  const updateUser = useUpdateUser()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<'admin' | 'operador' | 'auditor' | 'gestor'>('operador')

  return (
    <div>
      <PageHeader title="Usuários" lede="Cadastro, edição, ativação e perfil. Só o administrador entra aqui." />
      <div className="mt-6 flex flex-col gap-4">
        <form className="flex flex-wrap items-end gap-3" onSubmit={(event) => {
          event.preventDefault()
          createUser.mutate({ name, email, password, role }, { onSuccess: () => { setName(''); setEmail(''); setPassword('') } })
        }}>
          <label>Nome<input value={name} onChange={(event) => setName(event.target.value)} required /></label>
          <label>E-mail<input value={email} onChange={(event) => setEmail(event.target.value)} required /></label>
          <label>Senha<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} required /></label>
          <label>
            Perfil
            <select value={role} onChange={(event) => setRole(event.target.value as typeof role)}>
              <option value="admin">Administrador</option>
              <option value="operador">Operador</option>
              <option value="auditor">Auditor</option>
              <option value="gestor">Gestor</option>
            </select>
          </label>
          <button className="btn btn-primary" type="submit">Cadastrar</button>
        </form>
        {createUser.error ? <p className="text-sm text-brand">{errorMessage(createUser.error)}</p> : null}
        <QueryState isLoading={users.isLoading} error={users.error}>
          <DataTable
            rows={users.data ?? []}
            empty="Nenhum usuário."
            columns={[
              { id: 'name', header: 'Nome', cell: (row) => row.name },
              { id: 'email', header: 'E-mail', cell: (row) => row.email },
              { id: 'role', header: 'Perfil', cell: (row) => (
                <select value={row.role} onChange={(event) => updateUser.mutate({ id: row.id, name: row.name, role: event.target.value as typeof row.role, active: row.active })}>
                  <option value="admin">Administrador</option>
                  <option value="operador">Operador</option>
                  <option value="auditor">Auditor</option>
                  <option value="gestor">Gestor</option>
                </select>
              ) },
              { id: 'active', header: 'Situação', cell: (row) => (
                <button type="button" className="btn btn-secondary" onClick={() => updateUser.mutate({ id: row.id, name: row.name, role: row.role, active: !row.active })}>
                  {row.active ? 'Ativo' : 'Inativo'}
                </button>
              ) },
            ]}
          />
        </QueryState>
        {updateUser.error ? <p className="text-sm text-brand">{errorMessage(updateUser.error)}</p> : null}
      </div>
    </div>
  )
}

export function SettingsPage() {
  const settings = useSettings()
  const update = useUpdateSettings()
  const current = settings.data

  return (
    <div>
      <PageHeader title="Configurações" lede="Processamento, alertas, retenção e integração. A conversão não vira um botão de operação." />
      <div className="mt-6 flex flex-col gap-4">
        <QueryState isLoading={settings.isLoading} error={settings.error}>
          {current ? (
            <form className="grid gap-3 rounded-2xl border border-line bg-white p-5" onSubmit={(event) => {
              event.preventDefault()
              const form = new FormData(event.currentTarget)
              update.mutate({
                ...current,
                autoSync: form.get('autoSync') === 'on',
                alertOnGap: form.get('alertOnGap') === 'on',
                alertOnCapacity: form.get('alertOnCapacity') === 'on',
                retentionDays: Number(form.get('retentionDays')),
                integrationNote: String(form.get('integrationNote') ?? current.integrationNote),
              })
            }}>
              <label>Sincronização automática<input name="autoSync" type="checkbox" defaultChecked={current.autoSync} /></label>
              <label>Alerta de lacuna<input name="alertOnGap" type="checkbox" defaultChecked={current.alertOnGap} /></label>
              <label>Alerta de capacidade<input name="alertOnCapacity" type="checkbox" defaultChecked={current.alertOnCapacity} /></label>
              <label>Retenção (dias)<input name="retentionDays" type="number" min={1} defaultValue={current.retentionDays} /></label>
              <p className="text-sm leading-6 text-ink-muted">Corte fixo em {current.segmentMinutes} minutos, padrão Enel. Status da integração: {current.integrationStatus === 'aguardando_fabricante' ? 'aguardando fabricante' : 'configurada'}.</p>
              <label>Nota da integração<textarea name="integrationNote" defaultValue={current.integrationNote} rows={3} /></label>
              <button className="btn btn-primary" type="submit">Salvar</button>
              {update.error ? <p className="text-sm text-brand">{errorMessage(update.error)}</p> : null}
            </form>
          ) : null}
        </QueryState>
      </div>
    </div>
  )
}
