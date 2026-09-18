import type { DeviceAdapter } from './types.ts'

export class DeviceRegistry {
  private readonly adapters: Map<string, DeviceAdapter>

  constructor(adapters: DeviceAdapter[]) {
    this.adapters = new Map(adapters.map((adapter) => [adapter.capability.adapterId, adapter]))
  }

  list(): DeviceAdapter[] {
    return [...this.adapters.values()]
  }

  get(adapterId: string): DeviceAdapter | undefined {
    return this.adapters.get(adapterId)
  }
}
