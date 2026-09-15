export type StatusTone = 'success' | 'info' | 'warning' | 'danger' | 'neutral'

const labels: Record<string, { label: string; tone: StatusTone }> = {
  nao_autorizado: { label: 'Não autorizado', tone: 'danger' },
  parcial: { label: 'Parcial', tone: 'warning' },
  baixado: { label: 'Baixado', tone: 'success' },
  falhou: { label: 'Falhou', tone: 'danger' },
  concluido: { label: 'Concluído', tone: 'success' },
  baixando: { label: 'Baixando', tone: 'info' },
  pendente: { label: 'Pendente', tone: 'warning' },
  erro: { label: 'Com erro', tone: 'danger' },
  desconectado: { label: 'Desconectado', tone: 'neutral' },
  conectado: { label: 'Conectado', tone: 'info' },
  interrompido: { label: 'Interrompido', tone: 'danger' },
  pausado: { label: 'Pausado', tone: 'warning' },
  na_fila: { label: 'Na fila', tone: 'warning' },
  ativa: { label: 'Ativa', tone: 'success' },
  encerrada: { label: 'Encerrada', tone: 'neutral' },
  em_andamento: { label: 'Em andamento', tone: 'info' },
  interrompida: { label: 'Interrompida', tone: 'danger' },
  concluida: { label: 'Concluída', tone: 'success' },
  falha: { label: 'Falha', tone: 'danger' },
  processando: { label: 'Processando', tone: 'info' },
  disponivel: { label: 'Disponível', tone: 'success' },
  convertido: { label: 'Convertido', tone: 'info' },
  segmentado: { label: 'Segmentado', tone: 'info' },
  recebido: { label: 'Recebido', tone: 'neutral' },
  identificado: { label: 'Identificado', tone: 'neutral' },
  convertendo: { label: 'Convertendo', tone: 'info' },
  corrompido: { label: 'Corrompido', tone: 'danger' },
  excluido: { label: 'Excluído', tone: 'neutral' },
  no_equipamento: { label: 'No equipamento', tone: 'neutral' },
  baixada: { label: 'Baixada', tone: 'success' },
  intervalo_ausente: { label: 'Intervalo ausente', tone: 'warning' },
  incompleto: { label: 'Incompleto', tone: 'warning' },
  gravacao_faltante: { label: 'Gravação faltante', tone: 'danger' },
  simulado: { label: 'Simulado', tone: 'neutral' },
  equipamento: { label: 'Equipamento', tone: 'info' },
}

export function statusMeta(value: string): { label: string; tone: StatusTone } {
  return labels[value] ?? { label: value, tone: 'neutral' }
}

export function priorityLabel(priority: number): string {
  if (priority === 1) return 'Alta'
  if (priority === 2) return 'Média'
  return 'Baixa'
}
