import type { ReactNode } from 'react'
import { errorMessage } from '../format.ts'
import { statusMeta, type StatusTone } from '../status.ts'

const tones: Record<StatusTone, string> = {
  success: 'bg-neutral-100 text-neutral-900',
  info: 'bg-neutral-100 text-neutral-700',
  warning: 'bg-neutral-200 text-neutral-800',
  danger: 'bg-red-50 text-brand',
  neutral: 'bg-neutral-100 text-neutral-600',
}

export function StatusChip({ value }: { value: string }) {
  const meta = statusMeta(value)
  return <span className={`inline-flex rounded-md px-2 py-0.5 text-xs font-medium ${tones[meta.tone]}`}>{meta.label}</span>
}

export function ToneChip({ label, tone }: { label: string; tone: StatusTone }) {
  return <span className={`inline-flex rounded-md px-2 py-0.5 text-xs font-medium ${tones[tone]}`}>{label}</span>
}

export function ProgressBar({ value }: { value: number | null }) {
  if (value === null) return <span className="text-ink-muted">—</span>
  return (
    <span className="block h-1.5 w-28 overflow-hidden rounded-full bg-neutral-200" aria-label={`${value}%`}>
      <span className="block h-full bg-ink" style={{ width: `${value}%` }} />
    </span>
  )
}

export function PageHeader({ title, lede }: { title: string; lede: string }) {
  return (
    <header className="max-w-3xl">
      <h1 className="text-2xl font-semibold tracking-tight text-ink">{title}</h1>
      <p className="mt-1.5 text-sm leading-6 text-ink-muted">{lede}</p>
    </header>
  )
}

export function EmptyState({ children }: { children: ReactNode }) {
  return <p className="rounded-2xl border border-dashed border-line bg-white px-6 py-10 text-sm text-ink-muted">{children}</p>
}

export function QueryState({
  isLoading,
  error,
  children,
}: {
  isLoading: boolean
  error: unknown
  children: ReactNode
}) {
  if (isLoading) return <p className="text-sm text-ink-muted">Carregando…</p>
  if (error) return <p className="text-sm text-brand">{errorMessage(error)}</p>
  return children
}

interface Column<T> {
  id: string
  header: string
  cell: (row: T) => ReactNode
}

export function DataTable<T>({ columns, rows, empty }: { columns: Column<T>[]; rows: T[]; empty: string }) {
  if (rows.length === 0) return <EmptyState>{empty}</EmptyState>
  return (
    <div className="scroll-hidden overflow-auto rounded-2xl border border-line bg-white">
      <table className="w-full border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-line bg-neutral-50">
            {columns.map((column) => (
              <th key={column.id} className="px-4 py-2.5 text-xs font-medium text-ink-muted">
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={index} className="border-b border-line last:border-0 hover:bg-neutral-50 [&_a]:font-medium [&_a]:text-ink [&_a]:underline-offset-2 hover:[&_a]:text-brand">
              {columns.map((column) => (
                <td key={column.id} className="whitespace-nowrap px-4 py-3">{column.cell(row)}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
