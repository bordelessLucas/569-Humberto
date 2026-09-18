import type { AdapterCapability } from '../../types.ts'

export const mettaxJtt1078Capability: AdapterCapability = {
  adapterId: 'mettax-jtt1078',
  manufacturer: 'MettaX Digital',
  models: ['MC904', 'MC401'],
  mode: 'terminal-initiated',
  protocol: 'JT/T808+JT/T1078+FTP',
  transfer: 'spike-required',
}

export const JTT1078_HISTORY_FLOW = [
  { command: '0x0100', name: 'terminal registration', direction: 'terminal->agent' },
  { command: '0x0102', name: 'terminal authentication', direction: 'terminal->agent' },
  { command: '0x9205', name: 'query resource list', direction: 'agent->terminal' },
  { command: '0x1205', name: 'terminal upload resource list', direction: 'terminal->agent' },
  { command: '0x9206', name: 'file upload command to local FTP receiver', direction: 'agent->terminal' },
  { command: '0x1206', name: 'file upload completion', direction: 'terminal->agent' },
  { command: '0x9207', name: 'file upload control pause/continue/cancel', direction: 'agent->terminal' },
] as const

export function assertMettaxSpikeCanRun(input: { hasHardware: boolean; hasJttConfigProcedure: boolean; hasLocalFtpReceiver: boolean }): void {
  if (!input.hasHardware) throw new Error('MettaX JT/T1078 spike requires physical MC904 or MC401 hardware.')
  if (!input.hasJttConfigProcedure) throw new Error('MettaX JT/T1078 spike requires procedure to configure platform IP/domain and port.')
  if (!input.hasLocalFtpReceiver) throw new Error('MettaX JT/T1078 spike requires a local FTP receiver for 0x9206.')
}
