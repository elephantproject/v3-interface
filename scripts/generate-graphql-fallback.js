/* eslint-env node */

const fs = require('fs')
const path = require('path')

const dataOutput = path.join(__dirname, '../src/graphql/data/__generated__/types-and-hooks.ts')
const thegraphOutput = path.join(__dirname, '../src/graphql/thegraph/__generated__/types-and-hooks.ts')

function hasGeneratedClient(output) {
  try {
    return fs.statSync(output).size > 0
  } catch {
    return false
  }
}

function writeFallback(output, source) {
  if (hasGeneratedClient(output)) return
  fs.mkdirSync(path.dirname(output), { recursive: true })
  fs.writeFileSync(output, source)
}

const queryResult = `{
  data: undefined,
  loading: false,
  error: undefined,
  refetch: async () => ({ data: undefined }),
  fetchMore: async () => ({ data: undefined }),
}`

const dataTypes = [
  'AssetActivityPartsFragment',
  'AssetQueryVariables',
  'ContractInput',
  'NftActivityFilterInput',
  'NftApprovalPartsFragment',
  'NftApproveForAllPartsFragment',
  'NftAsset',
  'NftAssetEdge',
  'NftAssetsFilterInput',
  'NftAssetTraitInput',
  'NftCollection',
  'NftRouteResponse',
  'NftTrade',
  'NftTradeInput',
  'NftTransferPartsFragment',
  'PermitInput',
  'PortfolioBalancesQuery',
  'SearchTokensQuery',
  'TokenAmountInput',
  'TokenApprovalPartsFragment',
  'TokenPriceQuery',
  'TokenQuery',
  'TokenTradeInput',
  'TokenTradeRouteInput',
  'TokenTradeRoutesInput',
  'TokenTransferPartsFragment',
  'TopTokens100Query',
  'TradePoolInput',
].map((name) => `export type ${name} = any`).join('\n')

const dataHooks = [
  'useAssetQuery',
  'useCollectionQuery',
  'useCollectionSearchQuery',
  'useDetailsQuery',
  'useNftActivityQuery',
  'useNftBalanceQuery',
  'useNftUniversalRouterAddressQuery',
  'usePortfolioBalancesQuery',
  'useRecentlySearchedAssetsQuery',
  'useSearchTokensQuery',
  'useTokenPriceQuery',
  'useTokenQuery',
  'useTokenSpotPriceQuery',
  'useTopTokens100Query',
  'useTopTokensSparklineQuery',
  'useTransactionListQuery',
  'useTrendingCollectionsQuery',
  'useTrendingTokensQuery',
  'useUniswapPricesQuery',
].map((name) => `export const ${name} = (..._args: any[]) => (${queryResult})`).join('\n')

const dataLazyHooks = ['useNftRouteLazyQuery', 'usePortfolioBalancesLazyQuery']
  .map(
    (name) =>
      `export const ${name} = (..._args: any[]) => [async () => ({ data: undefined }), ${queryResult}] as const`,
  )
  .join('\n')

const dataSource = `// Generated local fallback for retired upstream GraphQL endpoints.
/* eslint-disable */
${dataTypes}

export enum Chain { Arbitrum = 'ARBITRUM', Bnb = 'BNB', Celo = 'CELO', Ethereum = 'ETHEREUM', EthereumGoerli = 'ETHEREUM_GOERLI', EthereumSepolia = 'ETHEREUM_SEPOLIA', Harmony = 'HARMONY', Optimism = 'OPTIMISM', Polygon = 'POLYGON', UnknownChain = 'UNKNOWN_CHAIN' }
export enum Currency { Usd = 'USD' }
export enum HistoryDuration { Hour = 'HOUR', Day = 'DAY', Week = 'WEEK', Month = 'MONTH', Year = 'YEAR', Max = 'MAX' }
export enum TokenStandard { Native = 'NATIVE', Erc20 = 'ERC20' }
export enum TransactionStatus { Confirmed = 'CONFIRMED', Failed = 'FAILED', Pending = 'PENDING' }
export enum ActivityType { Approve = 'APPROVE', CancelListing = 'CANCEL_LISTING', Listing = 'LISTING', Mint = 'MINT', Receive = 'RECEIVE', Sale = 'SALE', Send = 'SEND', Swap = 'SWAP', Transfer = 'TRANSFER', Unknown = 'UNKNOWN' }
export enum NftAssetSortableField { Price = 'PRICE' }
export enum NftMarketplace { Opensea = 'OPENSEA' }
export enum NftActivityType { CancelListing = 'CANCEL_LISTING', Listing = 'LISTING', Sale = 'SALE', Transfer = 'TRANSFER' }
export enum NftStandard { Erc1155 = 'ERC1155', Erc721 = 'ERC721' }
export enum OrderStatus { Cancelled = 'CANCELLED', Executed = 'EXECUTED', Expired = 'EXPIRED', Valid = 'VALID' }
export enum OrderType { Listing = 'LISTING' }
export enum MediaType { Audio = 'AUDIO', Embed = 'EMBED', Image = 'IMAGE', Raw = 'RAW', Video = 'VIDEO' }
export enum SafetyLevel { MediumWarning = 'MEDIUM_WARNING', Verified = 'VERIFIED' }
export enum TokenTradeType { ExactOutput = 'EXACT_OUTPUT' }

${dataHooks}
${dataLazyHooks}
`

const thegraphSource = `// Generated local fallback for the retired hosted subgraph endpoint.
/* eslint-disable */
export type AllV3TicksQuery = any
export type FeeTierDistributionQuery = any
export const useAllV3TicksQuery = (..._args: any[]) => (${queryResult})
`

writeFallback(dataOutput, dataSource)
writeFallback(thegraphOutput, thegraphSource)
