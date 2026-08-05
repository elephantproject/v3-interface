const GATEWAYS = ['https://ipfs.io/ipfs/', 'https://cloudflare-ipfs.com/ipfs/', 'https://gateway.pinata.cloud/ipfs/']

export const DEFAULT_SAMPLE_TOKEN_ID = 1
export const DEFAULT_SAMPLE_NFT_IMAGES = GATEWAYS.map(
  (gateway) => `${gateway}QmUbU1GNVGGSoDDPhY1FcANQR1mPhkrK8YSqXZy8Tf76sc/${DEFAULT_SAMPLE_TOKEN_ID}.png`
)

const METADATA_CACHE_PREFIX = 'elephant:nft-metadata:'
const METADATA_CACHE_TTL = 1000 * 60 * 60

export type NftMetadata = {
  name?: string
  description?: string
  image?: string
  image_url?: string
  edition?: number | string
  attributes?: Array<{
    trait_type: string
    value: string | number
  }>
}

function metadataUrls(uri: string): string[] {
  const trimmed = uri.trim()
  if (!trimmed) return []
  if (/^https?:\/\//i.test(trimmed)) return [trimmed]
  const hash = trimmed.replace(/^ipfs:\/\//i, '').replace(/^\/ipfs\//i, '')
  return GATEWAYS.map((gateway) => `${gateway}${hash}`)
}

function metadataCandidates(uri: string, tokenId?: string | number): string[] {
  const trimmed = uri.trim()
  if (!trimmed) return []
  if (tokenId === undefined || /\.json(?:\?.*)?$/i.test(trimmed)) return [trimmed]
  if (trimmed.includes('{id}')) return [trimmed.replace('{id}', tokenId.toString())]
  return [`${trimmed.replace(/\/+$/, '')}/${tokenId}.json`, trimmed]
}

function readCachedMetadata(key: string): NftMetadata | null {
  try {
    const cached = window.sessionStorage.getItem(`${METADATA_CACHE_PREFIX}${key}`)
    if (!cached) return null
    const parsed = JSON.parse(cached) as {
      timestamp: number
      value: NftMetadata
    }
    if (Date.now() - parsed.timestamp > METADATA_CACHE_TTL) return null
    return parsed.value
  } catch {
    return null
  }
}

function cacheMetadata(key: string, value: NftMetadata) {
  try {
    window.sessionStorage.setItem(`${METADATA_CACHE_PREFIX}${key}`, JSON.stringify({ timestamp: Date.now(), value }))
  } catch {
    // Browser storage is best-effort only.
  }
}

export async function fetchMetadata(uri: string, tokenId?: string | number): Promise<NftMetadata | null> {
  const key = `${uri}:${tokenId ?? ''}`
  const cached = readCachedMetadata(key)
  if (cached) return cached

  for (const candidate of metadataCandidates(uri, tokenId)) {
    for (const url of metadataUrls(candidate)) {
      try {
        const response = await fetch(url, { mode: 'cors' })
        if (!response.ok) continue
        const metadata = (await response.json()) as NftMetadata
        cacheMetadata(key, metadata)
        return metadata
      } catch {
        // Try the next public IPFS gateway or URI candidate.
      }
    }
  }
  return null
}

export function metadataImageUrls(metadata: NftMetadata | null, fallback = true): string[] {
  const image = metadata?.image ?? metadata?.image_url ?? ''
  return Array.from(new Set([...metadataUrls(image), ...(fallback ? DEFAULT_SAMPLE_NFT_IMAGES : [])]))
}

export async function mapWithConcurrency<T, R>(
  values: T[],
  concurrency: number,
  mapper: (value: T) => Promise<R>
): Promise<R[]> {
  const results = new Array<R>(values.length)
  let cursor = 0
  async function worker() {
    while (cursor < values.length) {
      const index = cursor++
      results[index] = await mapper(values[index])
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, values.length) }, worker))
  return results
}
