import type { DemoState } from '../../domain/types.ts'

export function DemoPanel({
  state,
  running,
  onStart,
  onReset,
}: {
  state: DemoState | null
  running: boolean
  onStart: () => void
  onReset: () => void
}) {
  return (
    <section className="rounded-2xl border border-line bg-white p-5" aria-label="Modo demonstração">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold tracking-tight">Modo demonstração</h2>
          <p className="mt-1 max-w-xl text-sm leading-6 text-ink-muted">Chegada do Caminhão 17, da conexão até o arquivo disponível.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" className="btn btn-primary" onClick={onStart} disabled={running}>
            {running ? 'Em andamento' : 'Simular chegada'}
          </button>
          <button type="button" className="btn btn-secondary" onClick={onReset} disabled={running}>
            Reiniciar
          </button>
        </div>
      </div>
      <ol className="mt-4 flex flex-wrap gap-1.5">
        {(state?.steps ?? []).map((step, index) => {
          const current = state?.status === 'running' && state.stepIndex === index
          const tone = step.done ? 'border-neutral-300 bg-neutral-100 text-ink' : current ? 'border-brand bg-red-50 text-brand' : 'border-line bg-canvas text-ink-muted'
          return (
            <li key={step.id} className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${tone}`}>
              {step.label}
            </li>
          )
        })}
      </ol>
    </section>
  )
}
