import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { waitForDatabase } from '../../services/api/client.ts'
import { DEMO_PASSWORD } from '../../services/api/mode.ts'
import { roleLabel } from '../access.ts'
import { LogoFrame } from '../components/BrandLogo.tsx'
import { errorMessage } from '../format.ts'
import { useLogin } from '../hooks/useFleet.ts'

const profiles = [
  { role: 'admin', name: 'Ana Ribeiro', email: 'admin@lock.com', note: 'Prepara frota, usuários e storage' },
  { role: 'operador', name: 'Bruno Costa', email: 'operador@lock.com', note: 'Acompanha chegada, fila e processamento' },
  { role: 'auditor', name: 'Clara Nunes', email: 'auditor@lock.com', note: 'Investiga lacunas e gravações' },
  { role: 'gestor', name: 'Diego Melo', email: 'gestor@lock.com', note: 'Consulta indicadores e vídeos' },
] as const

export function LoginPage() {
  const login = useLogin()
  const navigate = useNavigate()
  const [email, setEmail] = useState<string>(profiles[1].email)
  const [password, setPassword] = useState(DEMO_PASSWORD)
  const [databaseError, setDatabaseError] = useState<string | null>(null)
  const [databaseReady, setDatabaseReady] = useState(false)

  useEffect(() => {
    let active = true
    waitForDatabase()
      .then(() => {
        if (active) setDatabaseReady(true)
      })
      .catch((error: unknown) => {
        if (active) setDatabaseError(errorMessage(error))
      })
    return () => {
      active = false
    }
  }, [])

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    login.mutate({ email, password }, { onSuccess: () => navigate('/dashboard') })
  }

  return (
    <main className="grid min-h-screen place-items-center bg-canvas p-6">
      <section className="grid w-full max-w-lg gap-5 rounded-2xl border border-line bg-white p-6">
        <LogoFrame className="h-20" />
        <div className="grid gap-4">
        <p className="text-sm leading-6 text-ink-muted">Escolha o perfil. A senha dos quatro acessos é {DEMO_PASSWORD}.</p>
        <div className="grid gap-2">
          {profiles.map((profile) => {
            const selected = email === profile.email
            return (
              <button
                key={profile.email}
                type="button"
                className={`rounded-xl border px-3 py-2.5 text-left text-sm ${selected ? 'border-ink bg-neutral-50' : 'border-line bg-white hover:bg-neutral-50'}`}
                onClick={() => setEmail(profile.email)}
              >
                <span className="font-semibold">{roleLabel(profile.role)} · {profile.name}</span>
                <span className="mt-0.5 block text-xs font-normal normal-case tracking-normal text-ink">{profile.email}</span>
                <span className="mt-0.5 block text-xs font-normal normal-case tracking-normal text-ink-muted">{profile.note}</span>
              </button>
            )
          })}
        </div>
        <form className="grid gap-3" onSubmit={onSubmit}>
          <label>
            E-mail
            <input className="w-full" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="username" />
          </label>
          <label>
            Senha
            <input className="w-full" type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" />
          </label>
          {databaseError ? <p className="text-sm text-brand">{databaseError}</p> : null}
          {login.error ? <p className="text-sm text-brand">{errorMessage(login.error)}</p> : null}
          <button className="btn btn-primary" type="submit" disabled={login.isPending || !databaseReady}>
            {databaseReady ? 'Entrar' : 'Abrindo o banco…'}
          </button>
        </form>
        </div>
      </section>
    </main>
  )
}
