/**
 * Edge Agent — serviço local da base (esqueleto).
 *
 * Equipamento alvo confirmado pelos manuais: MettaX MC904 (MDVR no veículo).
 * Ainda falta a especificação de transferência de vídeo na LAN (candidato JT/T1078).
 *
 * Este módulo NÃO roda download real. O painel continua no mock/API até o agente na LAN.
 */

import { AdapterNotReadyError } from './device-adapter.ts'
import { getDeviceAdapter, listDeviceAdapters } from './registry.ts'

export type EdgeAgentStatus = {
  garageId: string
  mode: 'skeleton'
  targetDevice: 'MettaX MC904'
  adapters: Array<{ id: string; ready: boolean; manufacturer: string; models: string[] }>
  note: string
  remainingBlockers: string[]
}

export function describeEdgeAgent(garageId: string): EdgeAgentStatus {
  return {
    garageId,
    mode: 'skeleton',
    targetDevice: 'MettaX MC904',
    adapters: listDeviceAdapters().map((item) => ({
      id: item.id,
      ready: item.ready,
      manufacturer: item.manufacturer,
      models: [...item.models],
    })),
    note: 'Produto/manual MC904 recebidos. Downloads reais não partem do browser; falta API/SDK de listagem e transferência.',
    remainingBlockers: [
      'Documento/SDK de JT/T1078 (ou API CMS) para listar e baixar gravações via Wi-Fi Station na LAN da base',
      'Como ler identificação do veículo (placa/ID) pelo equipamento na rede',
      'Credenciais / autenticação remota para sessão de download',
      'Hardware em mãos para validar descoberta (IP/MAC) no Wi-Fi da garagem',
    ],
  }
}

export async function probeGarageNetwork(garageId: string, adapterId = 'mettax-mc904'): Promise<never> {
  const adapter = getDeviceAdapter(adapterId)
  if (!adapter?.ready) throw new AdapterNotReadyError(adapterId)
  return adapter.discover({ garageId, origin: 'equipamento' }) as Promise<never>
}
