import { useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { navFor, roleLabel } from '../access.ts'
import { useLogout, useSession } from '../hooks/useFleet.ts'
import { LogoFrame } from './BrandLogo.tsx'

export function AppShell() {
  const session = useSession()
  const logout = useLogout()
  const navigate = useNavigate()
  const location = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)
  const role = session.data?.user.role
  const links = role ? navFor(role) : []
  const groups = ['Operação', 'Frota', 'Evidências', 'Sistema'] as const

  return (
    <div className="flex h-dvh overflow-hidden bg-canvas">
      {menuOpen ? (
        <button type="button" className="fixed inset-0 z-30 bg-black/40 sm:hidden" aria-label="Fechar menu" onClick={() => setMenuOpen(false)} />
      ) : null}
      <aside className={`${menuOpen ? 'translate-x-0' : '-translate-x-full'} fixed inset-y-0 left-0 z-40 flex w-64 shrink-0 flex-col bg-sidebar text-white transition-transform sm:static sm:translate-x-0`}>
        <div className="px-3 pt-4 pb-2">
          <LogoFrame />
        </div>
        <nav className="scroll-hidden flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto px-3 py-3" aria-label="Seções">
          {groups.map((group) => {
            const items = links.filter((item) => item.group === group)
            if (items.length === 0) return null
            return (
              <div key={group}>
                <p className="mb-1.5 px-2 text-[11px] font-medium text-white/40">{group}</p>
                <div className="flex flex-col gap-0.5">
                  {items.map((item) => (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      onClick={() => setMenuOpen(false)}
                      className={({ isActive }) => {
                        const current = isActive || (item.path !== '/dashboard' && location.pathname.startsWith(`${item.path}/`))
                        return `rounded-lg px-2.5 py-2 text-[13px] font-medium no-underline ${current ? 'bg-brand text-white' : 'text-white/70 hover:bg-white/8 hover:text-white'}`
                      }}
                    >
                      {item.label}
                    </NavLink>
                  ))}
                </div>
              </div>
            )
          })}
        </nav>
        <div className="grid gap-2 border-t border-white/10 px-3 py-3">
          <div className="min-w-0 px-1">
            <p className="truncate text-sm font-medium">{session.data?.user.name}</p>
            <p className="text-xs text-white/45">{role ? roleLabel(role) : ''}</p>
          </div>
          <button
            type="button"
            className="btn rounded-lg border border-white/15 text-white hover:bg-white/8"
            onClick={() => logout.mutate(undefined, { onSuccess: () => navigate('/login') })}
          >
            Sair
          </button>
        </div>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center gap-3 border-b border-line bg-white px-4 py-3 sm:hidden">
          <button type="button" className="btn btn-secondary" onClick={() => setMenuOpen(true)}>
            Menu
          </button>
          <LogoFrame className="h-8" />
        </header>
        <main className="scroll-hidden min-h-0 flex-1 overflow-y-auto px-4 py-6 md:px-8 md:py-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
