import type { ReactNode } from 'react'
import { errorMessage } from '../format.ts'
import { statusMeta, type StatusTone } from '../status.ts'

const tones: Record<StatusTone, string> = {
  success: 'bg-neutral-900 text-white',
  info: 'bg-neutral-100 text-neutral-800',
  warning: 'bg-neutral-200 text-neutral-900',
  danger: 'bg-red-50 text-brand',
  neutral: 'bg-neutral-100 text-neutral-600',
}

export function StatusChip({ value }: { value: string }) {
  const meta = statusMeta(value)
  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-medium tracking-wide ${tones[meta.tone]}`}>
      {meta.label}
    </span>
  )
}

export function ToneChip({ label, tone }: { label: string; tone: StatusTone }) {
  return <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-medium tracking-wide ${tones[tone]}`}>{label}</span>
}

export function ProgressBar({ value }: { value: number | null }) {
  if (value === null) return <span className="text-ink-muted">—</span>
  return (
    <span className="inline-flex min-w-[7rem] max-w-full items-center gap-2" aria-label={`${value}%`}>
      <span className="block h-1.5 min-w-[4.5rem] flex-1 overflow-hidden rounded-full bg-neutral-200" aria-hidden="true">
        <span className="block h-full bg-ink transition-[width] duration-300 ease-out" style={{ width: `${value}%` }} />
      </span>
      <span className="shrink-0 text-[11px] font-medium tabular-nums text-ink-muted">{value}%</span>
    </span>
  )
}

export function PageHeader({ title, lede }: { title: string; lede: string }) {
  return (
    <header className="max-w-3xl">
      <h1 className="text-pretty text-2xl font-semibold tracking-tight text-ink">{title}</h1>
      <p className="mt-1.5 text-sm leading-6 text-ink-muted text-pretty">{lede}</p>
    </header>
  )
}

export function EmptyState({ children }: { children: ReactNode }) {
  return <p className="rounded-lg border border-dashed border-line bg-white px-6 py-10 text-center text-sm text-ink-muted">{children}</p>
}

export function QueryState({
  isLoading,
  error,
  children,
  loadingLabel = 'Carregando…',
  showSkeleton = true,
}: {
  isLoading: boolean
  error: unknown
  children: ReactNode
  loadingLabel?: string
  showSkeleton?: boolean
}) {
  if (isLoading) {
    if (!showSkeleton) return null
    return (
      <div className="rounded-lg border border-line bg-white px-4 py-8" role="status" aria-live="polite">
        <p className="text-sm text-ink-muted">{loadingLabel}</p>
        <div className="mt-4 grid grid-cols-2 gap-3 xl:grid-cols-5" aria-hidden="true">
          {Array.from({ length: 5 }).map((_, index) => (
            <span key={index} className="h-20 animate-pulse rounded-lg bg-neutral-100" />
          ))}
        </div>
      </div>
    )
  }
  if (error) {
    return (
      <p className="rounded-lg border border-brand/20 bg-red-50/50 px-4 py-3 text-sm text-brand" role="alert">
        {errorMessage(error)} Recarregue a página ou tente novamente em instantes.
      </p>
    )
  }
  return children
}

interface Column<T> {
  id: string
  header: string
  cell: (row: T) => ReactNode
}

export function DataTable<T>({
  columns,
  rows,
  empty,
  rowKey,
}: {
  columns: Column<T>[]
  rows: T[]
  empty: string
  rowKey?: (row: T) => string
}) {
  if (rows.length === 0) return <EmptyState>{empty}</EmptyState>
  return (
    <div className="scroll-hidden overflow-auto rounded-lg border border-line bg-white">
      <table className="w-full border-collapse text-left text-sm">
        <thead className="sticky top-0 z-10">
          <tr className="border-b border-line bg-neutral-50">
            {columns.map((column) => (
              <th key={column.id} scope="col" className="px-4 py-2.5 text-left text-[11px] font-medium tracking-wide text-ink-muted">
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr
              key={rowKey?.(row) ?? index}
              className="border-b border-line last:border-0 hover:bg-neutral-50/80 [&_a]:font-medium [&_a]:text-ink [&_a]:underline-offset-2 hover:[&_a]:text-brand"
            >
              {columns.map((column) => (
                <td key={column.id} className="whitespace-nowrap px-4 py-3 align-middle">
                  {column.cell(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
