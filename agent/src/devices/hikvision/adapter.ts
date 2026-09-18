import type { DeviceAdapter, DiscoveredDevice, DownloadRequest, RecordingQuery, RemoteRecording } from '../types.ts'
import { HikvisionIsapiClient } from './isapi-client.ts'

interface HikvisionAdapterOptions {
  device: {
    ip: string
    username: string
    password: string
    serial: string | null
    mac: string | null
  }
  fetchImpl?: typeof fetch
}

export function createHikvisionIsapiAdapter(options: HikvisionAdapterOptions): DeviceAdapter {
  const client = new HikvisionIsapiClient({
    baseUrl: `http://${options.device.ip}`,
    username: options.device.username,
    password: options.device.password,
    fetchImpl: options.fetchImpl,
  })

  return {
    capability: {
      adapterId: 'hikvision-ae-md5043-isapi',
      manufacturer: 'Hikvision',
      models: ['AE-MD5043-SD/I/GLF/WI58'],
      mode: 'pull-lan',
      protocol: 'ISAPI',
      transfer: 'candidate',
    },

    async discover(): Promise<DiscoveredDevice[]> {
      return [{
        adapterId: 'hikvision-ae-md5043-isapi',
        deviceId: options.device.serial ?? `hikvision-${options.device.ip}`,
        manufacturer: 'Hikvision',
        model: 'AE-MD5043-SD/I/GLF/WI58',
        serial: options.device.serial,
        ip: options.device.ip,
        mac: options.device.mac,
        terminalId: null,
      }]
    },

    async identify(device) {
      return { deviceId: device.deviceId, vehicleId: null, serial: device.serial }
    },

    async listRecordings(_device: DiscoveredDevice, query: RecordingQuery): Promise<RemoteRecording[]> {
      const segments = await client.searchRecordings(query)
      return segments.map((segment) => ({
        externalId: segment.externalId,
        channel: query.channel,
        startsAt: segment.startsAt,
        endsAt: segment.endsAt,
        sizeBytes: segment.sizeBytes,
        playbackUri: segment.playbackUri,
        container: null,
      }))
    },

    async downloadRecording(_request: DownloadRequest) {
      throw new Error('Hikvision download must be wired to LocalMediaStore in the ingest runner task.')
    },
  }
}
