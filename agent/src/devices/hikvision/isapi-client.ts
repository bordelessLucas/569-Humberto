import type { HikvisionRecordingSegment, HikvisionSearchInput } from './isapi-types.ts'

interface HikvisionClientOptions {
  baseUrl: string
  username: string
  password: string
  fetchImpl?: typeof fetch
}

export class HikvisionIsapiClient {
  private readonly options: HikvisionClientOptions
  private readonly fetchImpl: typeof fetch

  constructor(options: HikvisionClientOptions) {
    this.options = options
    this.fetchImpl = options.fetchImpl ?? fetch
  }

  async searchRecordings(input: HikvisionSearchInput): Promise<HikvisionRecordingSegment[]> {
    const body = `<?xml version="1.0" encoding="UTF-8"?>
<CMSearchDescription>
  <searchID>full-lock-${Date.now()}</searchID>
  <trackList><trackID>${input.channel}01</trackID></trackList>
  <timeSpanList><timeSpan><startTime>${input.startsAt}</startTime><endTime>${input.endsAt}</endTime></timeSpan></timeSpanList>
  <maxResults>100</maxResults>
  <searchResultPostion>0</searchResultPostion>
  <metadataList><metadataDescriptor>//recordType.meta.std-cgi.com</metadataDescriptor></metadataList>
</CMSearchDescription>`

    const response = await this.request('/ISAPI/ContentMgmt/search', { method: 'POST', body })
    const text = await response.text()
    return parseSearchResult(text)
  }

  async downloadByPlaybackUri(playbackUri: string): Promise<ArrayBuffer> {
    const body = `<?xml version="1.0" encoding="UTF-8"?><downloadRequest><playbackURI>${escapeXml(playbackUri)}</playbackURI></downloadRequest>`
    const response = await this.request('/ISAPI/ContentMgmt/download', { method: 'POST', body })
    return response.arrayBuffer()
  }

  private async request(pathname: string, init: RequestInit): Promise<Response> {
    const response = await this.fetchImpl(new URL(pathname, this.options.baseUrl), {
      ...init,
      headers: {
        'content-type': 'application/xml',
        authorization: basicAuth(this.options.username, this.options.password),
        ...(init.headers ?? {}),
      },
    })
    if (!response.ok) throw new Error(`Hikvision ISAPI ${init.method ?? 'GET'} ${pathname} failed: ${response.status}`)
    return response
  }
}

function parseSearchResult(xml: string): HikvisionRecordingSegment[] {
  const matches = [...xml.matchAll(/<searchMatchItem>([\s\S]*?)<\/searchMatchItem>/g)]
  return matches.map((match, index) => {
    const item = match[1]
    return {
      externalId: readTag(item, 'playbackURI') ?? `match-${index + 1}`,
      playbackUri: readTag(item, 'playbackURI') ?? '',
      startsAt: readTag(item, 'startTime') ?? '',
      endsAt: readTag(item, 'endTime') ?? '',
      sizeBytes: Number(readTag(item, 'size') ?? '') || null,
    }
  })
}

function readTag(xml: string, tag: string): string | null {
  const match = xml.match(new RegExp(`<${tag}>([\\s\\S]*?)<\\/${tag}>`))
  return match?.[1] ?? null
}

// Field hardware must use HTTP Digest when the DVR demands it. Basic auth is kept
// only for the injectable test shell until digest challenge handling is added.
function basicAuth(username: string, password: string): string {
  return `Basic ${Buffer.from(`${username}:${password}`).toString('base64')}`
}

function escapeXml(value: string): string {
  return value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
}
