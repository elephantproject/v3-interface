import { BigNumber } from '@ethersproject/bignumber'
import { formatUnits, parseUnits } from '@ethersproject/units'
import { useWeb3React } from '@web3-react/core'
import { useToggleAccountDrawer } from 'components/AccountDrawer'
import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useTransactionAdder } from 'state/transactions/hooks'
import { TransactionType } from 'state/transactions/types'
import styled from 'styled-components/macro'

import { ELEPHANT_NFT_ADDRESS, ELEPHANT_NFT_MARKETPLACE_ADDRESS } from '../../constants/elephant'
import {
  useElephantNftContract,
  useElephantNftMarketplaceContract,
  useElephantTokenContract,
} from '../../hooks/useElephantContracts'
import { calculateGasMargin } from '../../utils/calculateGasMargin'
import { recoverReceiptDeserializationTransaction } from '../../utils/recoverSubmittedTransaction'
import { ActionRow, Notice, PrimaryAction, SecondaryAction } from '../Elephant/shared'
import { DEFAULT_SAMPLE_TOKEN_ID, fetchMetadata, mapWithConcurrency, metadataImageUrls, NftMetadata } from './metadata'

type NftItem = {
  tokenId: string
  collection: string
  uri: string
  metadata: NftMetadata | null
}

type ListingItem = NftItem & {
  listingId: string
  seller: string
  price: BigNumber
}

const NftPage = styled.div`
  width: 100%;
  max-width: 1120px;
  padding: 0 1.5rem 3rem;
  margin: 0 auto;
`

const SeriesZeroPage = styled.div`
  align-items: center;
  display: flex;
  justify-content: center;
  min-height: calc(100vh - 130px);
  padding: 0 1rem 3rem;
  width: 100%;
`

const SeriesZeroCard = styled.section`
  background: linear-gradient(
    180deg,
    ${({ theme }) => theme.backgroundSurface},
    ${({ theme }) => theme.backgroundModule}
  );
  border: 1px solid ${({ theme }) => theme.backgroundOutline};
  border-radius: 8px;
  box-shadow: ${({ theme }) => theme.shallowShadow};
  overflow: hidden;
  padding: 1rem;
  width: min(100%, 440px);
`

const SeriesZeroTitle = styled.h1`
  color: ${({ theme }) => theme.textPrimary};
  font-size: 1.35rem;
  font-weight: 800;
  margin: 0 0 0.9rem;
  text-align: center;
`

const SeriesZeroPreview = styled.div`
  align-items: center;
  aspect-ratio: 1 / 1;
  background: ${({ theme }) => theme.backgroundModule};
  border: 1px solid ${({ theme }) => theme.backgroundOutline};
  border-radius: 8px;
  display: flex;
  justify-content: center;
  overflow: hidden;
  padding: 1rem;
`

const SeriesZeroImage = styled.img`
  height: 100%;
  image-rendering: pixelated;
  object-fit: contain;
  width: 100%;
`

const SeriesZeroStats = styled.div`
  align-items: center;
  color: ${({ theme }) => theme.textPrimary};
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  justify-content: space-between;
  margin: 0.9rem 0;
`

const SeriesZeroPrice = styled.p`
  align-items: center;
  display: flex;
  font-weight: 800;
  gap: 0.35rem;
  margin: 0;
`

const SeriesZeroTokenImage = styled.img`
  height: 1.2rem;
  object-fit: contain;
  width: 1.2rem;
`

const SeriesZeroSupply = styled.p`
  color: ${({ theme }) => theme.textSecondary};
  font-weight: 700;
  margin: 0;
`

const SeriesZeroActions = styled.div`
  display: grid;
  gap: 0.5rem;
`

const SeriesZeroAction = styled(PrimaryAction)`
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 800;
  min-height: 54px;
  width: 100%;
`

const SERIES_ZERO_PREVIEW_URL = 'https://i.ibb.co/F6HZ0D3/573.png'
const SERIES_ZERO_METADATA_CID = 'QmQzAfTQ3VifsYXK1Z3pQXD9d7HLcsBzKQ4Beyz2hyUagL'
const SERIES_ZERO_IMAGE_CID = 'QmUbU1GNVGGSoDDPhY1FcANQR1mPhkrK8YSqXZy8Tf76sc'

const DetailPage = styled.div`
  margin: 0 auto;
  max-width: 1040px;
  padding: 0 1.5rem 3rem;
  width: 100%;
`

const DetailLayout = styled.div`
  align-items: start;
  display: grid;
  gap: 2rem;
  grid-template-columns: minmax(280px, 420px) minmax(0, 1fr);

  ${({ theme }) => theme.deprecated_mediaWidth.deprecated_upToMedium`
    grid-template-columns: 1fr;
  `};
`

const DetailImagePanel = styled.div`
  background: radial-gradient(circle at 50% 15%, rgba(242, 174, 85, 0.18), transparent 46%),
    linear-gradient(180deg, ${({ theme }) => theme.backgroundSurface}, ${({ theme }) => theme.backgroundModule});
  border: 1px solid ${({ theme }) => theme.backgroundOutline};
  border-radius: 8px;
  box-shadow: ${({ theme }) => theme.shallowShadow};
  padding: 1rem;
`

const DetailImage = styled.img`
  aspect-ratio: 1 / 1;
  image-rendering: pixelated;
  object-fit: contain;
  width: 100%;
`

const DetailPanel = styled.div`
  background: linear-gradient(
    180deg,
    ${({ theme }) => theme.backgroundSurface},
    ${({ theme }) => theme.backgroundModule}
  );
  border: 1px solid ${({ theme }) => theme.backgroundOutline};
  border-radius: 8px;
  box-shadow: ${({ theme }) => theme.shallowShadow};
  padding: 1.25rem;
`

const DetailTitle = styled.h1`
  color: ${({ theme }) => theme.textPrimary};
  font-size: 2rem;
  font-weight: 800;
  margin: 0;
`

const DetailDescription = styled.p`
  color: ${({ theme }) => theme.textSecondary};
  line-height: 1.5;
  margin: 0.75rem 0 1rem;
`

const DetailActions = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  margin: 1rem 0;
`

const DetailPrimaryLink = styled(Link)`
  background: linear-gradient(135deg, #f2ae55, #b94a21);
  border-radius: 8px;
  box-shadow: 0 10px 24px rgba(185, 74, 33, 0.24);
  color: #fff;
  font-weight: 800;
  padding: 0.7rem 1rem;
  text-decoration: none;
  transition: transform 120ms ease, box-shadow 120ms ease;

  &:hover,
  &:focus {
    box-shadow: 0 12px 28px rgba(185, 74, 33, 0.32);
    transform: translateY(-1px);
  }
`

const DetailAttributeGrid = styled.div`
  display: grid;
  gap: 0.75rem;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
`

const DetailAttributeCard = styled.div`
  background: ${({ theme }) => theme.backgroundSurface};
  border: 1px solid ${({ theme }) => theme.backgroundOutline};
  border-radius: 8px;
  padding: 0.75rem;
`

const DetailTrait = styled.div`
  color: ${({ theme }) => theme.textSecondary};
  font-size: 0.85rem;
`

const DetailValue = styled.div`
  color: ${({ theme }) => theme.textPrimary};
  font-weight: 800;
  margin-top: 0.25rem;
`

const DetailStateMessage = styled.div`
  background: ${({ theme }) => theme.backgroundSurface};
  border: 1px solid ${({ theme }) => theme.backgroundOutline};
  border-radius: 8px;
  box-shadow: ${({ theme }) => theme.shallowShadow};
  color: ${({ theme }) => theme.textSecondary};
  padding: 1rem;
`

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  align-items: flex-end;
  margin-bottom: 1.5rem;

  ${({ theme }) => theme.deprecated_mediaWidth.deprecated_upToSmall`
    align-items: flex-start;
    flex-direction: column;
  `};
`

const HeaderTitle = styled.h1`
  color: ${({ theme }) => theme.textPrimary};
  font-size: 2rem;
  font-weight: 800;
  margin: 0;
`

const HeaderSubtitle = styled.p`
  color: ${({ theme }) => theme.textSecondary};
  margin: 0.35rem 0 0;
  overflow-wrap: anywhere;
`

const Count = styled.div`
  color: ${({ theme }) => theme.textPrimary};
  background: ${({ theme }) => theme.backgroundSurface};
  border: 1px solid ${({ theme }) => theme.backgroundOutline};
  border-radius: 8px;
  box-shadow: ${({ theme }) => theme.shallowShadow};
  padding: 0.55rem 0.8rem;
  font-weight: 800;
`

const NftGrid = styled.div<{ $compact?: boolean }>`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(${({ $compact }) => ($compact ? '240px' : '260px')}, 1fr));
  gap: 1rem;
`

const NftCardSurface = styled.div`
  display: block;
  background: linear-gradient(
    180deg,
    ${({ theme }) => theme.backgroundSurface},
    ${({ theme }) => theme.backgroundModule}
  );
  border: 1px solid ${({ theme }) => theme.backgroundOutline};
  border-radius: 8px;
  overflow: hidden;
  box-shadow: ${({ theme }) => theme.shallowShadow};
  transition: transform 120ms ease, box-shadow 120ms ease, border-color 120ms ease;

  &:hover,
  &:focus-within {
    border-color: ${({ theme }) => theme.accentActionSoft};
    transform: translateY(-2px);
  }
`

const Preview = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  aspect-ratio: 1 / 1;
  color: ${({ theme }) => theme.textSecondary};
  background: radial-gradient(circle at 50% 15%, rgba(242, 174, 85, 0.18), transparent 46%),
    ${({ theme }) => theme.backgroundModule};
  padding: 1rem;
`

const PreviewImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: contain;
`

const Address = styled.code`
  display: block;
  color: ${({ theme }) => theme.textSecondary};
  background: ${({ theme }) => theme.backgroundSurface};
  border: 1px solid ${({ theme }) => theme.backgroundOutline};
  border-radius: 6px;
  font-size: 0.78rem;
  margin-top: 0.75rem;
  overflow-wrap: anywhere;
  padding: 0.45rem;
`

const CardLink = styled(Link)`
  display: block;
  color: inherit;
  text-decoration: none;
`

const CardBody = styled.div`
  padding: 1rem;
`

const CardTitle = styled.h2`
  color: ${({ theme }) => theme.textPrimary};
  font-size: 1.1rem;
  font-weight: 800;
  margin: 0;
`

const CardDescription = styled.p`
  color: ${({ theme }) => theme.textSecondary};
  line-height: 1.45;
  margin: 0.5rem 0 0;
`

const StateMessage = styled.div`
  color: ${({ theme }) => theme.textSecondary};
  background: ${({ theme }) => theme.backgroundSurface};
  border: 1px solid ${({ theme }) => theme.backgroundOutline};
  border-radius: 8px;
  box-shadow: ${({ theme }) => theme.shallowShadow};
  padding: 1rem;
`

const BackLink = styled(Link)`
  color: ${({ theme }) => theme.accentAction};
  display: inline-block;
  font-weight: 800;
  margin-bottom: 0.75rem;
  text-decoration: none;

  &:hover,
  &:focus {
    text-decoration: underline;
  }
`

const ListingPage = styled.div<{ $wide?: boolean }>`
  width: 100%;
  max-width: ${({ $wide }) => ($wide ? '940px' : '720px')};
  padding: 0 1.5rem 3rem;
  margin: 0 auto;
`

const ListingPanel = styled.div`
  background: linear-gradient(
    180deg,
    ${({ theme }) => theme.backgroundSurface},
    ${({ theme }) => theme.backgroundModule}
  );
  border: 1px solid ${({ theme }) => theme.backgroundOutline};
  border-radius: 8px;
  box-shadow: ${({ theme }) => theme.shallowShadow};
  padding: 1.25rem;
`

const ListingLayout = styled.div<{ $wide?: boolean }>`
  display: grid;
  grid-template-columns: minmax(${({ $wide }) => ($wide ? '240px, 320px' : '220px, 300px')}) minmax(0, 1fr);
  gap: 1.25rem;
  align-items: start;

  ${({ theme }) => theme.deprecated_mediaWidth.deprecated_upToSmall`
    grid-template-columns: 1fr;
  `};
`

const ListingPreview = styled.div`
  background: radial-gradient(circle at 50% 15%, rgba(242, 174, 85, 0.18), transparent 46%),
    ${({ theme }) => theme.backgroundModule};
  border: 1px solid ${({ theme }) => theme.backgroundOutline};
  border-radius: 8px;
  padding: 1rem;
`

const ListingImage = styled.img`
  width: 100%;
  aspect-ratio: 1 / 1;
  object-fit: contain;
`

const ListingName = styled.h2`
  color: ${({ theme }) => theme.textPrimary};
  font-size: 1rem;
  font-weight: 800;
  margin: 0.75rem 0 0;
`

const ListingTitle = styled.h1`
  color: ${({ theme }) => theme.textPrimary};
  font-size: 2rem;
  font-weight: 800;
  margin: 0;
`

const ListingDescription = styled.p`
  color: ${({ theme }) => theme.textSecondary};
  line-height: 1.5;
  margin: 0.75rem 0 1.25rem;
`

const ListingLabel = styled.label`
  color: ${({ theme }) => theme.textPrimary};
  display: block;
  font-weight: 800;
  margin-bottom: 0.5rem;
`

const ListingInputRow = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  border: 1px solid ${({ theme }) => theme.backgroundOutline};
  border-radius: 8px;
  overflow: hidden;
`

const ListingPriceInput = styled.input`
  background: ${({ theme }) => theme.backgroundModule};
  border: none;
  color: ${({ theme }) => theme.textPrimary};
  font-size: 1.25rem;
  min-width: 0;
  outline: none;
  padding: 0.9rem;
`

const ListingTokenSuffix = styled.div`
  background: ${({ theme }) => theme.backgroundSurface};
  border-left: 1px solid ${({ theme }) => theme.backgroundOutline};
  color: ${({ theme }) => theme.textPrimary};
  font-weight: 800;
  height: 100%;
  padding: 0.9rem;
`

const ListingButtonRow = styled.div`
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
  margin-top: 1.25rem;
`

const ListingButton = styled.button`
  background: linear-gradient(135deg, #f2ae55, #b94a21);
  border: none;
  border-radius: 8px;
  box-shadow: 0 10px 24px rgba(185, 74, 33, 0.24);
  color: #fff;
  cursor: pointer;
  font-weight: 800;
  padding: 0.75rem 1rem;

  &:disabled {
    cursor: not-allowed;
    opacity: 0.55;
  }
`

const ListingSecondaryButton = styled(ListingButton)`
  background: ${({ theme }) => theme.backgroundInteractive};
  border: 1px solid ${({ theme }) => theme.backgroundOutline};
  box-shadow: none;
  color: ${({ theme }) => theme.textPrimary};
`

const ListingState = styled.div<{ $error?: boolean }>`
  color: ${({ $error, theme }) => ($error ? theme.accentFailure : theme.textSecondary)};
  background: ${({ theme }) => theme.backgroundModule};
  border: 1px solid ${({ $error, theme }) => ($error ? theme.accentFailure : theme.backgroundOutline)};
  border-radius: 8px;
  margin-top: 1rem;
  overflow-wrap: anywhere;
  padding: 1rem;
`

function amount(value: BigNumber) {
  return Number(formatUnits(value, 18)).toLocaleString(undefined, {
    maximumFractionDigits: 6,
  })
}

function NftImage({ item }: { item: NftItem }) {
  const urls = metadataImageUrls(item.metadata)
  const [index, setIndex] = useState(0)
  return urls[index] ? (
    <PreviewImage
      src={urls[index]}
      alt={item.metadata?.name ?? `Elephant NFT #${item.tokenId}`}
      onError={() => setIndex((current) => current + 1)}
    />
  ) : (
    <span>No image metadata</span>
  )
}

function DetailNftImage({ name, urls }: { name: string; urls: string[] }) {
  const [index, setIndex] = useState(0)
  const url = urls[index]

  return url ? (
    <DetailImage src={url} alt={name} onError={() => setIndex((current) => current + 1)} />
  ) : (
    <DetailStateMessage>Unable to load NFT image.</DetailStateMessage>
  )
}

function ListingNftImage({ item }: { item: NftItem }) {
  const urls = metadataImageUrls(item.metadata)
  const [index, setIndex] = useState(0)
  return urls[index] ? (
    <ListingImage
      src={urls[index]}
      alt={item.metadata?.name ?? `Elephant NFT #${item.tokenId}`}
      onError={() => setIndex((current) => current + 1)}
    />
  ) : null
}

function NftCard({ item, children }: { item: NftItem; children?: React.ReactNode }) {
  return (
    <NftCardSurface>
      <Preview>
        <NftImage item={item} />
      </Preview>
      <CardBody>
        <CardTitle>
          {item.metadata?.name ?? (item.tokenId ? `Elephant NFT #${item.tokenId}` : 'Elephant NFT Series #0')}
        </CardTitle>
        {item.metadata?.description && <CardDescription>{item.metadata.description}</CardDescription>}
        {children}
      </CardBody>
    </NftCardSurface>
  )
}

async function loadNft(collection: string, tokenId: BigNumber | string, contract: any): Promise<NftItem> {
  const id = tokenId.toString()
  const uri = await contract.tokenURI(id).catch(() => '')
  return {
    tokenId: id,
    collection,
    uri,
    metadata: uri ? await fetchMetadata(uri, id) : null,
  }
}

function useTransactionNotice() {
  const addTransaction = useTransactionAdder()
  const [pending, setPending] = useState(false)
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')
  const run = useCallback(
    async (label: string, action: () => Promise<any>) => {
      setPending(true)
      setNotice('')
      setError('')
      try {
        const transaction = await action()
        addTransaction(transaction, {
          type: TransactionType.CUSTOM,
          pendingTitle: label,
          confirmedTitle: `${label} confirmed`,
          failedTitle: `${label} failed`,
          descriptor: 'Elephant NFT',
        })
        setNotice(`${label} submitted: ${transaction.hash}`)
        try {
          await transaction.wait()
        } catch (receiptError) {
          if (!recoverReceiptDeserializationTransaction(receiptError)) throw receiptError
        }
        setNotice(`${label} confirmed.`)
        return true
      } catch (transactionError: any) {
        setError(
          transactionError?.reason ?? transactionError?.data?.message ?? transactionError?.message ?? `${label} failed.`
        )
        return false
      } finally {
        setPending(false)
      }
    },
    [addTransaction]
  )
  return { pending, notice, error, run }
}

export function ElephantNftOverview() {
  const marketplace = useElephantNftMarketplaceContract(false)
  const [collections, setCollections] = useState<
    Array<{ address: string; name: string; metadata: NftMetadata | null }>
  >([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let stale = false
    async function load() {
      if (!marketplace) return
      try {
        const count = (await marketplace.knownCollectionCount()).toNumber()
        const loaded = await mapWithConcurrency(
          Array.from({ length: count }, (_, index) => index),
          6,
          async (index) => {
            const address = await marketplace.knownCollectionAt(index)
            const collection = await marketplace.getCollection(address)
            const metadataUri = collection.metadataURI ?? collection[2]
            let metadata = metadataUri ? await fetchMetadata(metadataUri) : null
            if (!metadata) {
              try {
                const sample = await marketplace.getTokenMetadata(address, DEFAULT_SAMPLE_TOKEN_ID)
                const sampleUri = sample.tokenURI ?? sample[1] ?? ''
                metadata = sampleUri ? await fetchMetadata(sampleUri, DEFAULT_SAMPLE_TOKEN_ID) : null
              } catch {
                // The production preview image remains available as a fallback.
              }
            }
            return {
              address,
              name: collection.name ?? collection[1] ?? 'NFT Collection',
              metadata,
              approved: collection.approved ?? collection[0],
            }
          }
        )
        if (!stale) setCollections(loaded.filter((item) => item.approved))
      } catch (loadError: any) {
        if (!stale) setError(loadError?.message ?? 'Unable to load NFT collections.')
      } finally {
        if (!stale) setLoading(false)
      }
    }
    load()
    return () => {
      stale = true
    }
  }, [marketplace])

  return (
    <NftPage>
      <Header>
        <div>
          <HeaderTitle>NFT Marketplace</HeaderTitle>
          <HeaderSubtitle>Approved marketplace collections and contract metadata</HeaderSubtitle>
        </div>
        <Count>{loading ? 'Loading...' : `${collections.length} approved`}</Count>
      </Header>
      {loading ? (
        <StateMessage>Loading approved collections...</StateMessage>
      ) : collections.length ? (
        <NftGrid>
          {collections.map((collection) => {
            const item: NftItem = {
              collection: collection.address,
              tokenId: '',
              uri: '',
              metadata: collection.metadata,
            }
            return (
              <CardLink key={collection.address} to={`/nft/collection/${collection.address}`}>
                <NftCard item={item}>
                  <Address>{collection.address}</Address>
                </NftCard>
              </CardLink>
            )
          })}
        </NftGrid>
      ) : (
        <StateMessage>No approved NFT collections were found.</StateMessage>
      )}
      {error && <Notice $error>{error}</Notice>}
    </NftPage>
  )
}

export default function ElephantNftMint() {
  const { account } = useWeb3React()
  const nft = useElephantNftContract()
  const elephant = useElephantTokenContract()
  const [cost, setCost] = useState(BigNumber.from(0))
  const [allowance, setAllowance] = useState(BigNumber.from(0))
  const [supply, setSupply] = useState('0')
  const [maxSupply, setMaxSupply] = useState('10000')
  const transaction = useTransactionNotice()

  const refresh = useCallback(async () => {
    if (!nft) return
    const [nextCost, nextSupply, nextMaxSupply] = await Promise.all([nft.cost(), nft.totalSupply(), nft.maxSupply()])
    setCost(nextCost)
    setSupply(nextSupply.toString())
    setMaxSupply(nextMaxSupply.toString())
    if (account && elephant) {
      setAllowance(await elephant.allowance(account, ELEPHANT_NFT_ADDRESS))
    }
  }, [account, elephant, nft])

  useEffect(() => {
    refresh()
  }, [refresh])

  const price = cost
  const needsApproval = allowance.lt(price)

  return (
    <SeriesZeroPage>
      <SeriesZeroCard>
        <SeriesZeroTitle>Elephant NFT Series #0</SeriesZeroTitle>
        <SeriesZeroPreview>
          <SeriesZeroImage src={SERIES_ZERO_PREVIEW_URL} alt="Elephant NFT" />
        </SeriesZeroPreview>
        <SeriesZeroStats>
          <SeriesZeroPrice>
            Price: {amount(cost)}
            <SeriesZeroTokenImage src="/elephantcoin.png" alt="ELEPHANT" />
          </SeriesZeroPrice>
          <SeriesZeroSupply>
            Minted: {supply}/{maxSupply}
          </SeriesZeroSupply>
        </SeriesZeroStats>
        <SeriesZeroActions>
          <SeriesZeroAction
            disabled={!account || !needsApproval || transaction.pending || price.isZero()}
            onClick={async () => {
              if (
                elephant &&
                (await transaction.run('NFT approval', () => elephant.approve(ELEPHANT_NFT_ADDRESS, price)))
              )
                refresh()
            }}
          >
            Approve
          </SeriesZeroAction>
          <SeriesZeroAction
            disabled={!account || needsApproval || transaction.pending || price.isZero()}
            onClick={async () => {
              if (nft && (await transaction.run('NFT mint', () => nft.mint(1)))) refresh()
            }}
          >
            Mint
          </SeriesZeroAction>
        </SeriesZeroActions>
        {transaction.notice && <Notice>{transaction.notice}</Notice>}
        {transaction.error && <Notice $error>{transaction.error}</Notice>}
      </SeriesZeroCard>
    </SeriesZeroPage>
  )
}

export function ElephantNftAccount() {
  const { account } = useWeb3React()
  const toggleAccountDrawer = useToggleAccountDrawer()
  const nft = useElephantNftContract(false)
  const [items, setItems] = useState<NftItem[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    let stale = false
    async function load() {
      if (!account || !nft) return
      setLoading(true)
      const ids: BigNumber[] = await nft.walletOfOwner(account)
      const loaded = await mapWithConcurrency(ids, 6, (id) => loadNft(ELEPHANT_NFT_ADDRESS, id, nft))
      if (!stale) {
        setItems(loaded)
        setLoading(false)
      }
    }
    load()
    return () => {
      stale = true
    }
  }, [account, nft])

  return (
    <NftPage>
      <Header>
        <div>
          <HeaderTitle>Your Elephant NFTs</HeaderTitle>
          <HeaderSubtitle>NFTs held by the connected wallet.</HeaderSubtitle>
        </div>
        {account && <Count>{loading ? 'Loading...' : `${items.length} owned`}</Count>}
      </Header>
      {!account ? (
        <StateMessage>
          <PrimaryAction onClick={toggleAccountDrawer}>Connect wallet</PrimaryAction>
        </StateMessage>
      ) : loading ? (
        <StateMessage>Loading NFTs…</StateMessage>
      ) : (
        <NftGrid>
          {items.map((item) => (
            <NftCard key={item.tokenId} item={item}>
              <ActionRow>
                <SecondaryAction as={Link} to={`/nft/${item.tokenId}`}>
                  View
                </SecondaryAction>
                <PrimaryAction as={Link} to={`/nft/${item.tokenId}/list`}>
                  List for sale
                </PrimaryAction>
              </ActionRow>
            </NftCard>
          ))}
        </NftGrid>
      )}
    </NftPage>
  )
}

export function ElephantNftCollection() {
  const { collectionAddress = ELEPHANT_NFT_ADDRESS } = useParams()
  const { account } = useWeb3React()
  const marketplace = useElephantNftMarketplaceContract()
  const elephant = useElephantTokenContract()
  const [listings, setListings] = useState<ListingItem[]>([])
  const [allowances, setAllowances] = useState<Record<string, BigNumber>>({})
  const [loading, setLoading] = useState(true)
  const transaction = useTransactionNotice()

  const refresh = useCallback(async () => {
    if (!marketplace) return
    setLoading(true)
    const nextId = (await marketplace.nextListingId()).toNumber()
    const loaded = await mapWithConcurrency(
      Array.from({ length: nextId }, (_, index) => index),
      8,
      async (listingId) => {
        try {
          const listing = await marketplace.getListing(listingId)
          if (!listing.active || listing.collection.toLowerCase() !== collectionAddress.toLowerCase()) return undefined
          const metadataResult = await marketplace.getTokenMetadata(listing.collection, listing.tokenId)
          const uri = metadataResult.tokenURI ?? metadataResult[1] ?? ''
          return {
            listingId: listing.id.toString(),
            tokenId: listing.tokenId.toString(),
            collection: listing.collection,
            seller: listing.seller,
            price: listing.price,
            uri,
            metadata: uri ? await fetchMetadata(uri, listing.tokenId.toString()) : null,
          } as ListingItem
        } catch {
          return undefined
        }
      }
    )
    setListings(loaded.filter((item): item is ListingItem => !!item))
    setLoading(false)
  }, [collectionAddress, marketplace])

  useEffect(() => {
    refresh()
  }, [refresh])

  async function buy(listing: ListingItem) {
    if (!account || !marketplace || !elephant) return
    const allowance =
      allowances[listing.listingId] ?? (await elephant.allowance(account, ELEPHANT_NFT_MARKETPLACE_ADDRESS))
    setAllowances((current) => ({
      ...current,
      [listing.listingId]: allowance,
    }))
    if (allowance.lt(listing.price)) {
      const approved = await transaction.run('Marketplace approval', () =>
        elephant.approve(ELEPHANT_NFT_MARKETPLACE_ADDRESS, listing.price)
      )
      if (approved)
        setAllowances((current) => ({
          ...current,
          [listing.listingId]: listing.price,
        }))
      return
    }
    if (await transaction.run('NFT purchase', () => marketplace.buyNFT(listing.listingId))) refresh()
  }

  return (
    <NftPage>
      <BackLink to="/nft/overview">Back to collections</BackLink>
      <Header>
        <div>
          <HeaderTitle>Elephant NFT listings</HeaderTitle>
          <HeaderSubtitle>{collectionAddress}</HeaderSubtitle>
        </div>
        <Count>{loading ? 'Loading...' : `${listings.length} for sale`}</Count>
      </Header>
      {loading ? (
        <StateMessage>Loading NFTs for sale...</StateMessage>
      ) : listings.length === 0 ? (
        <StateMessage>No active NFT listings were found for this collection.</StateMessage>
      ) : (
        <NftGrid $compact>
          {listings.map((listing) => (
            <NftCard key={listing.listingId} item={listing}>
              <p>{amount(listing.price)} ELEPHANT</p>
              <Address>Seller: {listing.seller}</Address>
              <ActionRow>
                {account?.toLowerCase() === listing.seller.toLowerCase() ? (
                  <SecondaryAction as={Link} to={`/nft/listing/${listing.listingId}/edit`}>
                    Manage listing
                  </SecondaryAction>
                ) : (
                  <PrimaryAction disabled={!account || transaction.pending} onClick={() => buy(listing)}>
                    Buy NFT
                  </PrimaryAction>
                )}
              </ActionRow>
            </NftCard>
          ))}
        </NftGrid>
      )}
      {transaction.notice && <Notice>{transaction.notice}</Notice>}
      {transaction.error && <Notice $error>{transaction.error}</Notice>}
    </NftPage>
  )
}

export function ElephantNftDetail() {
  const { id = '' } = useParams()
  const [metadata, setMetadata] = useState<NftMetadata>()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let stale = false

    async function loadDetail() {
      setLoading(true)
      setError('')
      try {
        const nextMetadata = await fetchMetadata(`${SERIES_ZERO_METADATA_CID}/${id}.json`)
        if (!nextMetadata) throw new Error('Unable to load NFT metadata')
        if (!stale) setMetadata(nextMetadata)
      } catch {
        if (!stale) setError('Unable to load NFT details.')
      } finally {
        if (!stale) setLoading(false)
      }
    }

    loadDetail()
    return () => {
      stale = true
    }
  }, [id])

  if (loading) {
    return (
      <DetailPage>
        <DetailStateMessage>Loading NFT details...</DetailStateMessage>
      </DetailPage>
    )
  }

  if (error || !metadata) {
    return (
      <DetailPage>
        <DetailStateMessage>{error || 'Unable to load NFT details.'}</DetailStateMessage>
      </DetailPage>
    )
  }

  const edition = metadata.edition ?? id
  const name = metadata.name ?? `NFT #${id}`
  const imageUrls = metadataImageUrls({ image: `${SERIES_ZERO_IMAGE_CID}/${edition}.png` }, false)

  return (
    <DetailPage>
      <DetailLayout>
        <DetailImagePanel>
          <DetailNftImage key={id} name={name} urls={imageUrls} />
        </DetailImagePanel>
        <DetailPanel>
          <DetailTitle>{name}</DetailTitle>
          <DetailDescription>{metadata.description ?? ''}</DetailDescription>
          <DetailActions>
            <DetailPrimaryLink to={`/nft/${id}/list`}>List NFT</DetailPrimaryLink>
          </DetailActions>
          <DetailAttributeGrid>
            {(metadata.attributes ?? []).map((attribute) => (
              <DetailAttributeCard key={`${attribute.trait_type}-${attribute.value}`}>
                <DetailTrait>{attribute.trait_type}</DetailTrait>
                <DetailValue>{attribute.value}</DetailValue>
              </DetailAttributeCard>
            ))}
          </DetailAttributeGrid>
        </DetailPanel>
      </DetailLayout>
    </DetailPage>
  )
}

export function ElephantNftList() {
  const { id = '0' } = useParams()
  const { account } = useWeb3React()
  const navigate = useNavigate()
  const nft = useElephantNftContract()
  const marketplace = useElephantNftMarketplaceContract()
  const [price, setPrice] = useState('')
  const [owner, setOwner] = useState('')
  const [approved, setApproved] = useState(false)
  const [loading, setLoading] = useState(true)
  const [item, setItem] = useState<NftItem>()
  const transaction = useTransactionNotice()

  useEffect(() => {
    let stale = false
    async function load() {
      if (!nft) return
      setLoading(true)
      try {
        const [preview, tokenOwner, tokenApproval, allApproval] = await Promise.all([
          loadNft(ELEPHANT_NFT_ADDRESS, id, nft),
          nft.ownerOf(id),
          nft.getApproved(id),
          account ? nft.isApprovedForAll(account, ELEPHANT_NFT_MARKETPLACE_ADDRESS) : Promise.resolve(false),
        ])
        if (stale) return
        setItem(preview)
        setOwner(tokenOwner)
        setApproved(allApproval || tokenApproval.toLowerCase() === ELEPHANT_NFT_MARKETPLACE_ADDRESS.toLowerCase())
      } finally {
        if (!stale) setLoading(false)
      }
    }
    load()
    return () => {
      stale = true
    }
  }, [account, id, nft])

  const parsedPrice = (() => {
    try {
      const parsed = parseUnits(price || '0', 18)
      return parsed.gt(0) ? parsed : undefined
    } catch {
      return undefined
    }
  })()
  const ownsToken = Boolean(account && owner && account.toLowerCase() === owner.toLowerCase())

  async function approveMarketplace() {
    if (!nft) return
    const success = await transaction.run('NFT approval', async () => {
      const estimatedGas = await nft.estimateGas.approve(ELEPHANT_NFT_MARKETPLACE_ADDRESS, id)
      return nft.approve(ELEPHANT_NFT_MARKETPLACE_ADDRESS, id, { gasLimit: calculateGasMargin(estimatedGas) })
    })
    if (success) setApproved(true)
  }

  async function listNft() {
    if (!marketplace || !parsedPrice) return
    const success = await transaction.run('NFT listing', async () => {
      const estimatedGas = await marketplace.estimateGas.listNFT(ELEPHANT_NFT_ADDRESS, id, parsedPrice)
      return marketplace.listNFT(ELEPHANT_NFT_ADDRESS, id, parsedPrice, {
        gasLimit: calculateGasMargin(estimatedGas),
      })
    })
    if (success) navigate(`/nft/collection/${ELEPHANT_NFT_ADDRESS}`)
  }

  return (
    <ListingPage>
      <BackLink to={`/nft/${id}`}>Back to NFT</BackLink>
      <ListingPanel>
        <ListingTitle>List NFT #{id}</ListingTitle>
        <ListingDescription>
          Choose a listing price in ELEPHANT tokens. The marketplace will hold the NFT in escrow.
        </ListingDescription>
        <ListingLayout>
          <ListingPreview>
            {item && <ListingNftImage item={item} />}
            <ListingName>{item?.metadata?.name ?? `NFT #${id}`}</ListingName>
          </ListingPreview>
          <div>
            <ListingLabel htmlFor="nft-list-price">Listing price</ListingLabel>
            <ListingInputRow>
              <ListingPriceInput
                id="nft-list-price"
                inputMode="decimal"
                placeholder="0.00"
                value={price}
                onChange={(event) => setPrice(event.target.value)}
              />
              <ListingTokenSuffix>ELEPHANT</ListingTokenSuffix>
            </ListingInputRow>
            {loading && <ListingState>Loading NFT approval state...</ListingState>}
            {!loading && !ownsToken && (
              <ListingState $error>Connect the wallet that owns this NFT to list it.</ListingState>
            )}
            {transaction.notice && <ListingState>{transaction.notice}</ListingState>}
            {transaction.error && <ListingState $error>{transaction.error}</ListingState>}
            <ListingButtonRow>
              <ListingSecondaryButton
                disabled={!ownsToken || approved || transaction.pending}
                onClick={approveMarketplace}
              >
                {approved ? 'Approved' : transaction.pending ? 'Approving...' : 'Approve NFT'}
              </ListingSecondaryButton>
              <ListingButton
                disabled={!ownsToken || !approved || !parsedPrice || transaction.pending}
                onClick={listNft}
              >
                {transaction.pending ? 'Listing...' : 'List NFT'}
              </ListingButton>
            </ListingButtonRow>
          </div>
        </ListingLayout>
      </ListingPanel>
    </ListingPage>
  )
}

export function ElephantNftEditListing() {
  const { listingId = '0' } = useParams()
  const { account } = useWeb3React()
  const navigate = useNavigate()
  const marketplace = useElephantNftMarketplaceContract()
  const [price, setPrice] = useState('')
  const [currentPrice, setCurrentPrice] = useState('')
  const [seller, setSeller] = useState('')
  const [collection, setCollection] = useState('')
  const [collectionName, setCollectionName] = useState('')
  const [tokenId, setTokenId] = useState('')
  const [item, setItem] = useState<NftItem>()
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const transaction = useTransactionNotice()

  useEffect(() => {
    let stale = false
    async function load() {
      if (!marketplace) return
      setLoading(true)
      setLoadError('')
      try {
        const details = await marketplace.getListingDetails(listingId)
        const listing = details.listing ?? details[0]
        const listingTokenId = (listing.tokenId ?? listing[2]).toString()
        const listingCollection = listing.collection ?? listing[1]
        const listingPrice = listing.price ?? listing[4]
        const uri = details.tokenURI ?? details[2] ?? ''
        if (stale) return
        setSeller(listing.seller ?? listing[3])
        setCollection(listingCollection)
        setCollectionName(details.collectionName ?? details[1] ?? 'NFT Collection')
        setTokenId(listingTokenId)
        setCurrentPrice(amount(listingPrice))
        setPrice(
          formatUnits(listingPrice, 18)
            .replace(/\.0+$/, '')
            .replace(/(\.\d*?)0+$/, '$1')
        )
        setItem({
          collection: listingCollection,
          tokenId: listingTokenId,
          uri,
          metadata: uri ? await fetchMetadata(uri, listingTokenId) : null,
        })
      } catch {
        if (!stale) setLoadError('Unable to load this listing.')
      } finally {
        if (!stale) setLoading(false)
      }
    }
    load()
    return () => {
      stale = true
    }
  }, [listingId, marketplace])

  const parsedPrice = (() => {
    try {
      const parsed = parseUnits(price || '0', 18)
      return parsed.gt(0) ? parsed : undefined
    } catch {
      return undefined
    }
  })()
  const isSeller = Boolean(account && seller && account.toLowerCase() === seller.toLowerCase())

  async function update() {
    if (!marketplace || !parsedPrice) return
    const success = await transaction.run('Listing update', async () => {
      const estimatedGas = await marketplace.estimateGas.updateListingPrice(listingId, parsedPrice)
      return marketplace.updateListingPrice(listingId, parsedPrice, { gasLimit: calculateGasMargin(estimatedGas) })
    })
    if (success) navigate(`/nft/collection/${ELEPHANT_NFT_ADDRESS}`)
  }

  return (
    <ListingPage $wide>
      <BackLink to="/nft/account">Back to View NFTs</BackLink>
      <ListingPanel>
        <ListingTitle>Change Listing Price</ListingTitle>
        <ListingDescription>
          Adjust the sale price for this NFT listing. The new price is saved after the blockchain transaction confirms.
        </ListingDescription>
        <ListingLayout $wide>
          <ListingPreview>
            {item && <ListingNftImage item={item} />}
            <ListingName>{item?.metadata?.name ?? `NFT #${tokenId}`}</ListingName>
          </ListingPreview>
          <div>
            <ListingLabel htmlFor="nft-edit-price">Listing price</ListingLabel>
            <ListingInputRow>
              <ListingPriceInput
                id="nft-edit-price"
                inputMode="decimal"
                placeholder="0.00"
                value={price}
                onChange={(event) => setPrice(event.target.value)}
              />
              <ListingTokenSuffix>ELEPHANT</ListingTokenSuffix>
            </ListingInputRow>
            {collectionName && <ListingState>Collection: {collectionName}</ListingState>}
            {collection && <ListingState>Collection address: {collection}</ListingState>}
            {currentPrice && <ListingState>Current price: {currentPrice} ELEPHANT</ListingState>}
            {loading && <ListingState>Loading listing...</ListingState>}
            {!loading && !isSeller && <ListingState $error>Connect the wallet that created this listing.</ListingState>}
            {transaction.notice && <ListingState>{transaction.notice}</ListingState>}
            {(loadError || transaction.error) && <ListingState $error>{loadError || transaction.error}</ListingState>}
            <ListingButtonRow>
              <ListingButton disabled={loading || !isSeller || !parsedPrice || transaction.pending} onClick={update}>
                {transaction.pending ? 'Updating...' : 'Update Price'}
              </ListingButton>
            </ListingButtonRow>
          </div>
        </ListingLayout>
      </ListingPanel>
    </ListingPage>
  )
}
