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
  const steps = state?.steps ?? []
  const doneCount = steps.filter((step) => step.done).length

  return (
    <section className="rounded-lg border border-dashed border-line bg-white p-5" aria-label="Modo demonstração">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 max-w-xl">
          <p className="text-[11px] font-medium tracking-wide text-ink-muted">Demonstração</p>
          <h2 className="mt-1 text-pretty text-base font-semibold tracking-tight text-ink">Roteiro do Caminhão 17</h2>
          <p className="mt-1 text-sm leading-6 text-ink-muted">
            Percurso guiado da conexão ao arquivo disponível — separado da ingestão operacional da base.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" className="btn btn-primary" onClick={onStart} disabled={running} aria-busy={running}>
            {running ? 'Em andamento…' : 'Simular chegada'}
          </button>
          <button type="button" className="btn btn-secondary" onClick={onReset} disabled={running}>
            Reiniciar
          </button>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between gap-3 text-xs text-ink-muted">
        <span>
          Progresso do roteiro:{' '}
          <span className="font-medium tabular-nums text-ink">
            {doneCount}/{steps.length || '—'}
          </span>
        </span>
        {running ? <span className="font-medium text-brand">Rodando</span> : null}
      </div>

      <ol className="scroll-hidden mt-3 flex gap-1.5 overflow-x-auto pb-1">
        {steps.map((step, index) => {
          const current = state?.status === 'running' && state.stepIndex === index
          const tone = step.done
            ? 'border-neutral-300 bg-neutral-100 text-ink'
            : current
              ? 'border-brand bg-red-50 text-brand'
              : 'border-line bg-canvas text-ink-muted'
          return (
            <li
              key={step.id}
              aria-current={current ? 'step' : undefined}
              className={`shrink-0 rounded-full border px-2.5 py-1 text-xs font-medium whitespace-nowrap ${tone}`}
            >
              <span className="mr-1 tabular-nums text-[10px] opacity-60">{String(index + 1).padStart(2, '0')}</span>
              {step.label}
            </li>
          )
        })}
      </ol>
    </section>
  )
}
