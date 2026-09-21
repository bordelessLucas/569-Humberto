import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../../services/api/client.ts'
import { DEMO_PASSWORD } from '../../services/api/mode.ts'
import { roleLabel } from '../access.ts'
import { LogoFrame } from '../components/BrandLogo.tsx'
import { errorMessage } from '../format.ts'

const profiles = [
  { role: 'admin', name: 'Ana Ribeiro', email: 'admin@fulllock.local', note: 'Prepara frota, usuários e storage' },
  { role: 'operador', name: 'Bruno Costa', email: 'operador@fulllock.local', note: 'Acompanha chegada, fila e processamento' },
  { role: 'auditor', name: 'Clara Nunes', email: 'auditor@fulllock.local', note: 'Investiga lacunas e gravações' },
  { role: 'gestor', name: 'Diego Melo', email: 'gestor@fulllock.local', note: 'Consulta indicadores e vídeos' },
] as const

export function LoginPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState<string>(profiles[1].email)
  const [password, setPassword] = useState(DEMO_PASSWORD)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setPending(true)
    setError(null)
    try {
      await api.login({ email, password })
      navigate('/dashboard')
    } catch (error) {
      setError(errorMessage(error))
    } finally {
      setPending(false)
    }
  }

  return (
    <main className="grid min-h-screen place-items-center bg-canvas p-6">
      <section className="grid w-full max-w-lg gap-5 rounded-lg border border-line bg-white p-6">
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
          {error ? <p className="text-sm text-brand">{error}</p> : null}
          <button className="btn btn-primary" type="submit" disabled={pending}>
            {pending ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
        </div>
      </section>
    </main>
  )
}
