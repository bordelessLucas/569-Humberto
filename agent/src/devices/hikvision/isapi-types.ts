export interface HikvisionSearchInput {
  channel: number
  startsAt: string
  endsAt: string
}

export interface HikvisionRecordingSegment {
  externalId: string
  playbackUri: string
  startsAt: string
  endsAt: string
  sizeBytes: number | null
}
