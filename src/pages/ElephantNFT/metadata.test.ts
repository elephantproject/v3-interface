import { DEFAULT_SAMPLE_NFT_IMAGES, fetchMetadata, metadataImageUrls } from './metadata'

describe('Elephant NFT metadata', () => {
  beforeEach(() => {
    window.sessionStorage.clear()
    jest.restoreAllMocks()
  })

  it('resolves the production collection folder to token JSON', async () => {
    const fetchMock = jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({ name: 'Elephant NFT Series 0 #1' }),
    } as Response)

    await expect(fetchMetadata('ipfs://collection-metadata/', 1)).resolves.toEqual({
      name: 'Elephant NFT Series 0 #1',
    })
    expect(fetchMock).toHaveBeenCalledWith('https://ipfs.io/ipfs/collection-metadata/1.json', { mode: 'cors' })
  })

  it('uses the production sample image gateways as card fallbacks', () => {
    expect(metadataImageUrls(null)).toEqual(DEFAULT_SAMPLE_NFT_IMAGES)
    expect(DEFAULT_SAMPLE_NFT_IMAGES).toHaveLength(3)
    expect(DEFAULT_SAMPLE_NFT_IMAGES[0]).toContain('QmUbU1GNVGGSoDDPhY1FcANQR1mPhkrK8YSqXZy8Tf76sc/1.png')
  })
})
