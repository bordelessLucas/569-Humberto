/**
 * MettaX MC904 — primeiro MDVR alvo (veículo), NÃO o roteador da garagem.
 *
 * Fontes em arquivosContext/:
 * - user_manual_mc904.pdf (Installation User Manual)
 * - MC904 Product Parameters.pdf (v1.0, 2024-04-23)
 *
 * O que os manuais CONFIRMAM (hardware/capacidade):
 * - Fabricante: MettaX Digital (Shenzhen)
 * - Linux + ARM; gravação local em 2× TF/SD (até 512G cada)
 * - Até 4 câmeras AHD 1080P (+ IP opcional → 5 canais)
 * - H.264/H.265; Wi-Fi 2.4GHz 802.11b/g/n em modo AP e Station
 * - Protocolos de plataforma: JT/T808, JT/T1076, JT/T1078
 * - Upgrade: U-disk / SD / FTP remoto automático
 * - ADAS/DMS/BSD no equipamento — FORA do núcleo Full Lock
 *
 * O que os manuais NÃO entregam (ainda bloqueia download real):
 * - SDK/API de listagem e download de gravações pela LAN
 * - Como a placa/ID do veículo é lida via rede
 * - Layout do filesystem proprietário no cartão (não assumir FAT/montagem USB)
 * - Credenciais padrão / autenticação remota para transferência
 *
 * Hipótese de integração (não inventar implementação):
 * JT/T1078 é o candidato principal para vídeo sobre a pilha JT/T808.
 * FTP só está documentado para upgrade de firmware — não usar como “API de vídeo” sem prova.
 */

import {
  AdapterNotReadyError,
  type DeviceAdapter,
  type DeviceDiscoveryHint,
  type DiscoveredDevice,
  type DownloadChunkResult,
  type RemoteRecordingRef,
} from '../device-adapter.ts'

export const MC904_CAPABILITIES = {
  manufacturer: 'MettaX Digital',
  models: ['MC904', 'MC904-EU', 'MC904-LA', 'MC904-NA'] as const,
  wifi: { band: '2.4GHz', standards: ['802.11b', '802.11g', '802.11n'], modes: ['AP', 'Station'] as const },
  cameras: { analogMax: 4, withOptionalIpMax: 5, codecs: ['H.264', 'H.265'] as const },
  storage: { slots: 2, media: 'TF/SD', maxPerSlotGb: 512 },
  platformProtocols: ['JT/T808-2011', 'JT/T808-2019', 'JT/T1076-2016', 'JT/T1078-2016'] as const,
  upgradeChannels: ['usb', 'sd', 'ftp_remote'] as const,
  /** Candidato técnico; implementação só após doc de protocolo/SDK. */
  downloadProtocolCandidate: 'JT/T1078' as const,
  outOfScopeForFullLock: ['ADAS', 'DMS', 'DMSX', 'BSD', '360', '4G_live_surveillance'] as const,
} as const

const BLOCKED =
  'MC904: datasheet de produto recebido; falta especificação de SDK/API para listar e baixar gravações na LAN (candidato JT/T1078).'

export const mettaxMc904Adapter: DeviceAdapter = {
  id: 'mettax-mc904',
  manufacturer: MC904_CAPABILITIES.manufacturer,
  models: [...MC904_CAPABILITIES.models],
  /** false até existir doc de transferência de vídeo (não só parâmetros de produto). */
  ready: false,

  async discover(_hint: DeviceDiscoveryHint): Promise<DiscoveredDevice[]> {
    throw new AdapterNotReadyError('mettax-mc904', BLOCKED)
  },

  async identify(_device: DiscoveredDevice) {
    throw new AdapterNotReadyError('mettax-mc904', BLOCKED)
  },

  async listRecordings(_device: DiscoveredDevice, _since: string | null): Promise<RemoteRecordingRef[]> {
    throw new AdapterNotReadyError('mettax-mc904', BLOCKED)
  },

  async download(
    _device: DiscoveredDevice,
    _recording: RemoteRecordingRef,
    _localPath: string,
    _resumeOffsetBytes: number,
  ): Promise<DownloadChunkResult> {
    throw new AdapterNotReadyError('mettax-mc904', BLOCKED)
  },
}
