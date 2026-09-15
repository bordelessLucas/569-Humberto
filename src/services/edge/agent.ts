/**
 * Edge Agent — serviço local da base (esqueleto).
 *
 * Responsabilidades futuras (após hardware):
 * descoberta → identificação → validação → listagem → fila → download → disco → eventos.
 *
 * Este módulo NÃO roda download real. O painel continua usando o mock/API até existir agente deployado na LAN.
 */

import { AdapterNotReadyError } from './device-adapter.ts'
import { getDeviceAdapter, listDeviceAdapters } from './registry.ts'

export type EdgeAgentStatus = {
  garageId: string
  mode: 'skeleton'
  adapters: Array<{ id: string; ready: boolean; manufacturer: string }>
  note: string
}

export function describeEdgeAgent(garageId: string): EdgeAgentStatus {
  return {
    garageId,
    mode: 'skeleton',
    adapters: listDeviceAdapters().map((item) => ({
      id: item.id,
      ready: item.ready,
      manufacturer: item.manufacturer,
    })),
    note: 'Motor local aguarda datasheet do primeiro MDVR. Downloads reais não partem do browser.',
  }
}

export async function probeGarageNetwork(garageId: string, adapterId = 'pending-first-mdvr'): Promise<never> {
  const adapter = getDeviceAdapter(adapterId)
  if (!adapter?.ready) throw new AdapterNotReadyError(adapterId)
  return adapter.discover({ garageId, origin: 'equipamento' }) as Promise<never>
}
