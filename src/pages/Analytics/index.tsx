import { gql, useQuery } from '@apollo/client'
import { Trans } from '@lingui/macro'
import { useMemo, useState } from 'react'
import { RefreshCw } from 'react-feather'
import styled from 'styled-components/macro'
import { ThemedText } from 'theme'

import { apolloClient, HARMONY_V3_SUBGRAPH_URL } from '../../graphql/thegraph/apollo'

const V3_ANALYTICS_QUERY = gql`
  query V3AnalyticsOverview {
    _meta {
      block {
        number
      }
      hasIndexingErrors
    }
    factories(first: 1) {
      id
      poolCount
      txCount
      totalVolumeUSD
      totalFeesUSD
      totalValueLockedUSD
    }
    pools(first: 20, orderBy: totalValueLockedUSD, orderDirection: desc) {
      id
      feeTier
      txCount
      volumeUSD
      feesUSD
      totalValueLockedUSD
      totalValueLockedToken0
      totalValueLockedToken1
      token0 {
        id
        symbol
        name
      }
      token1 {
        id
        symbol
        name
      }
    }
    tokens(first: 20, orderBy: totalValueLockedUSD, orderDirection: desc) {
      id
      symbol
      name
      txCount
      volumeUSD
      feesUSD
      totalValueLocked
      totalValueLockedUSD
      derivedETH
    }
    bundles(first: 1) {
      ethPriceUSD
    }
    uniswapDayDatas(first: 30, orderBy: date, orderDirection: desc) {
      id
      date
      tvlUSD
      volumeUSD
      feesUSD
      txCount
    }
  }
`

interface FactoryAnalytics {
  id: string
  poolCount: string
  txCount: string
  totalVolumeUSD: string
  totalFeesUSD: string
  totalValueLockedUSD: string
}

interface TokenAnalytics {
  id: string
  symbol: string | null
  name: string | null
  txCount: string
  volumeUSD: string
  feesUSD: string
  totalValueLocked: string
  totalValueLockedUSD: string
  derivedETH: string
}

interface PoolAnalytics {
  id: string
  feeTier: string
  txCount: string
  volumeUSD: string
  feesUSD: string
  totalValueLockedUSD: string
  totalValueLockedToken0: string
  totalValueLockedToken1: string
  token0: Pick<TokenAnalytics, 'id' | 'symbol' | 'name'>
  token1: Pick<TokenAnalytics, 'id' | 'symbol' | 'name'>
}

interface DayAnalytics {
  id: string
  date: number
  tvlUSD: string
  volumeUSD: string
  feesUSD: string
  txCount: string
}

interface V3AnalyticsData {
  _meta?: {
    block: { number: number }
    hasIndexingErrors: boolean
  }
  factories: FactoryAnalytics[]
  pools: PoolAnalytics[]
  tokens: TokenAnalytics[]
  bundles: { ethPriceUSD: string }[]
  uniswapDayDatas: DayAnalytics[]
}

const Page = styled.main`
  width: 100%;
  max-width: 1120px;
  padding: 68px 16px 48px;

  @media only screen and (max-width: ${({ theme }) => `${theme.breakpoint.md}px`}) {
    padding-top: 48px;
  }

  @media only screen and (max-width: ${({ theme }) => `${theme.breakpoint.sm}px`}) {
    padding: 20px 12px 32px;
  }
`

const Header = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 24px;
`

const HeaderCopy = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`

const Status = styled.div`
  color: ${({ theme }) => theme.textSecondary};
  font-size: 13px;
  line-height: 20px;
`

const RefreshButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-height: 40px;
  padding: 8px 12px;
  color: ${({ theme }) => theme.textPrimary};
  background: ${({ theme }) => theme.backgroundSurface};
  border: 1px solid ${({ theme }) => theme.backgroundOutline};
  border-radius: 12px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;

  &:hover {
    border-color: ${({ theme }) => theme.accentAction};
  }

  &:disabled {
    cursor: default;
    opacity: 0.6;
  }
`

const MetricGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
  margin-bottom: 24px;

  @media only screen and (max-width: ${({ theme }) => `${theme.breakpoint.md}px`}) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  @media only screen and (max-width: ${({ theme }) => `${theme.breakpoint.sm}px`}) {
    grid-template-columns: 1fr;
  }
`

const MetricCard = styled.div`
  min-width: 0;
  padding: 18px;
  background: ${({ theme }) => theme.backgroundSurface};
  border: 1px solid ${({ theme }) => theme.backgroundOutline};
  border-radius: 16px;
`

const MetricLabel = styled.div`
  margin-bottom: 8px;
  color: ${({ theme }) => theme.textSecondary};
  font-size: 13px;
  font-weight: 500;
`

const MetricValue = styled.div`
  overflow: hidden;
  color: ${({ theme }) => theme.textPrimary};
  font-size: 24px;
  font-weight: 600;
  line-height: 32px;
  text-overflow: ellipsis;
  white-space: nowrap;
`

const MetricDetail = styled.div`
  margin-top: 4px;
  color: ${({ theme }) => theme.textSecondary};
  font-size: 12px;
`

const TrendGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  margin-bottom: 24px;

  @media only screen and (max-width: ${({ theme }) => `${theme.breakpoint.md}px`}) {
    grid-template-columns: 1fr;
  }
`

const TrendCard = styled.div`
  min-width: 0;
  padding: 18px;
  background: ${({ theme }) => theme.backgroundSurface};
  border: 1px solid ${({ theme }) => theme.backgroundOutline};
  border-radius: 16px;
`

const TrendHeading = styled.div`
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 16px;
`

const Bars = styled.div`
  display: flex;
  align-items: flex-end;
  gap: 5px;
  height: 150px;
`

const Bar = styled.div`
  flex: 1;
  min-width: 3px;
  border-radius: 4px 4px 1px 1px;
  background: linear-gradient(180deg, #f3b65f 0%, #b94824 100%);
`

const ChartLabels = styled.div`
  display: flex;
  justify-content: space-between;
  margin-top: 8px;
  color: ${({ theme }) => theme.textSecondary};
  font-size: 11px;
`

const SearchInput = styled.input`
  width: min(100%, 360px);
  min-height: 42px;
  margin-bottom: 12px;
  padding: 9px 13px;
  color: ${({ theme }) => theme.textPrimary};
  background: ${({ theme }) => theme.backgroundSurface};
  border: 1px solid ${({ theme }) => theme.backgroundOutline};
  border-radius: 12px;
  font-size: 14px;
  outline: none;

  &:focus {
    border-color: ${({ theme }) => theme.accentAction};
  }
`

const ReserveDetail = styled.div`
  margin-top: 4px;
  color: ${({ theme }) => theme.textSecondary};
  font-size: 12px;
`

const Notice = styled.div<{ $error?: boolean }>`
  margin-bottom: 24px;
  padding: 16px;
  color: ${({ $error, theme }) => ($error ? theme.accentFailure : theme.textSecondary)};
  background: ${({ theme }) => theme.backgroundSurface};
  border: 1px solid ${({ $error, theme }) => ($error ? theme.accentFailure : theme.backgroundOutline)};
  border-radius: 14px;
  font-size: 14px;
  line-height: 21px;
  overflow-wrap: anywhere;
`

const Section = styled.section`
  margin-top: 24px;
`

const SectionTitle = styled.h2`
  margin: 0 0 12px;
  color: ${({ theme }) => theme.textPrimary};
  font-size: 20px;
  font-weight: 600;
`

const TableCard = styled.div`
  overflow-x: auto;
  background: ${({ theme }) => theme.backgroundSurface};
  border: 1px solid ${({ theme }) => theme.backgroundOutline};
  border-radius: 16px;
`

const Table = styled.table`
  width: 100%;
  min-width: 700px;
  border-collapse: collapse;

  th,
  td {
    padding: 14px 16px;
    border-bottom: 1px solid ${({ theme }) => theme.backgroundOutline};
    text-align: right;
    white-space: nowrap;
  }

  th:first-child,
  td:first-child {
    text-align: left;
  }

  th {
    color: ${({ theme }) => theme.textSecondary};
    font-size: 12px;
    font-weight: 500;
  }

  td {
    color: ${({ theme }) => theme.textPrimary};
    font-size: 14px;
  }

  tr:last-child td {
    border-bottom: 0;
  }
`

const EmptyRow = styled.td`
  height: 80px;
  color: ${({ theme }) => theme.textSecondary} !important;
  text-align: center !important;
`

const Address = styled.div`
  margin-top: 3px;
  color: ${({ theme }) => theme.textSecondary};
  font-family: ${({ theme }) => theme.fonts.code};
  font-size: 11px;
`

const compactNumber = new Intl.NumberFormat('en-US', {
  notation: 'compact',
  maximumFractionDigits: 2,
})

const wholeNumber = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 })

function formatNumber(value: string | number | undefined, prefix = ''): string {
  if (value === undefined) return '-'
  const numericValue = Number(value)
  if (!Number.isFinite(numericValue)) return '-'
  return `${prefix}${compactNumber.format(numericValue)}`
}

function formatFeeTier(feeTier: string): string {
  const numericFee = Number(feeTier)
  return Number.isFinite(numericFee) ? `${numericFee / 10_000}%` : '-'
}

function shortAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

function tokenLabel(token: Pick<TokenAnalytics, 'symbol' | 'name'>): string {
  return token.symbol || token.name || 'Unknown token'
}

function formatTokenAmount(value: string | undefined): string {
  if (value === undefined) return '-'
  const numericValue = Number(value)
  if (!Number.isFinite(numericValue)) return '-'
  return numericValue.toLocaleString(undefined, { maximumFractionDigits: 4 })
}

function formatUsdPrice(value: number): string {
  if (!Number.isFinite(value) || value <= 0) return '-'
  return `$${value.toLocaleString(undefined, { maximumSignificantDigits: 6 })}`
}

function formatDate(timestamp: number): string {
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(new Date(timestamp * 1000))
}

function TrendChart({
  title,
  data,
  value,
}: {
  title: string
  data: DayAnalytics[]
  value: (day: DayAnalytics) => number
}) {
  const maximum = Math.max(...data.map(value), 0)
  const latest = data[data.length - 1]

  return (
    <TrendCard>
      <TrendHeading>
        <ThemedText.DeprecatedSubHeader fontWeight={600}>{title}</ThemedText.DeprecatedSubHeader>
        <ThemedText.DeprecatedBody color="textSecondary">
          {latest ? formatNumber(value(latest), '$') : '-'}
        </ThemedText.DeprecatedBody>
      </TrendHeading>
      {data.length && maximum > 0 ? (
        <>
          <Bars>
            {data.map((day) => {
              const dayValue = value(day)
              const height = Math.max((dayValue / maximum) * 100, dayValue > 0 ? 3 : 0)
              return (
                <Bar
                  key={day.id}
                  style={{ height: `${height}%` }}
                  title={`${formatDate(day.date)}: ${formatNumber(dayValue, '$')}`}
                />
              )
            })}
          </Bars>
          <ChartLabels>
            <span>{formatDate(data[0].date)}</span>
            <span>{formatDate(latest.date)}</span>
          </ChartLabels>
        </>
      ) : (
        <Notice>Historical USD data will appear after the pricing anchor is reindexed.</Notice>
      )}
    </TrendCard>
  )
}

export default function Analytics() {
  const [search, setSearch] = useState('')
  const { data, error, loading, refetch } = useQuery<V3AnalyticsData>(V3_ANALYTICS_QUERY, {
    client: apolloClient,
    pollInterval: 30_000,
    notifyOnNetworkStatusChange: true,
  })

  const factory = data?.factories[0]
  const wonePriceUSD = Number(data?.bundles[0]?.ethPriceUSD ?? 0)
  const indexedBlock = data?._meta?.block.number
  const hasNoIndexedEntities = !loading && !error && !factory && !data?.pools.length && !data?.tokens.length
  const pricingUnavailable = !loading && !!factory && wonePriceUSD <= 0
  const days = useMemo(() => [...(data?.uniswapDayDatas ?? [])].reverse(), [data?.uniswapDayDatas])
  const latestDay = days[days.length - 1]
  const normalizedSearch = search.trim().toLowerCase()
  const pools = useMemo(
    () =>
      (data?.pools ?? []).filter((pool) =>
        [pool.id, pool.token0.symbol, pool.token0.name, pool.token1.symbol, pool.token1.name]
          .filter(Boolean)
          .some((value) => value?.toLowerCase().includes(normalizedSearch))
      ),
    [data?.pools, normalizedSearch]
  )
  const tokens = useMemo(
    () =>
      (data?.tokens ?? []).filter((token) =>
        [token.id, token.symbol, token.name]
          .filter(Boolean)
          .some((value) => value?.toLowerCase().includes(normalizedSearch))
      ),
    [data?.tokens, normalizedSearch]
  )

  return (
    <Page>
      <Header>
        <HeaderCopy>
          <ThemedText.LargeHeader>
            <Trans>ElephantSwap Analytics</Trans>
          </ThemedText.LargeHeader>
          <Status>
            V3 on Harmony ·{' '}
            {indexedBlock
              ? `Indexed through Harmony block ${wholeNumber.format(indexedBlock)}`
              : 'Connecting to the V3 subgraph'}
            {data?._meta?.hasIndexingErrors ? ' · Indexing errors reported' : ''}
          </Status>
        </HeaderCopy>
        <RefreshButton type="button" onClick={() => refetch()} disabled={loading}>
          <RefreshCw size={16} />
          <Trans>Refresh</Trans>
        </RefreshButton>
      </Header>

      {error && (
        <Notice $error>
          <strong>Unable to load V3 analytics.</strong> {error.message}
          <br />
          Endpoint: {HARMONY_V3_SUBGRAPH_URL}
        </Notice>
      )}

      {hasNoIndexedEntities && (
        <Notice>
          The V3 subgraph is responding at block {indexedBlock ? wholeNumber.format(indexedBlock) : '-'}, but no
          factory, pool, or token entities have been indexed yet. This page refreshes every 30 seconds and will populate
          as the deployment catches up.
        </Notice>
      )}

      {pricingUnavailable && (
        <Notice $error>
          The subgraph is indexing pools, but its WONE/USDC pricing anchor is still zero. Raw reserves remain visible
          below. Redeploy and reindex the updated V3 subgraph to restore TVL, volume, fee, and token-price metrics.
        </Notice>
      )}

      <MetricGrid>
        <MetricCard>
          <MetricLabel>Total value locked</MetricLabel>
          <MetricValue>{formatNumber(factory?.totalValueLockedUSD, '$')}</MetricValue>
          <MetricDetail>WONE price: {formatUsdPrice(wonePriceUSD)}</MetricDetail>
        </MetricCard>
        <MetricCard>
          <MetricLabel>Total volume</MetricLabel>
          <MetricValue>{formatNumber(factory?.totalVolumeUSD, '$')}</MetricValue>
        </MetricCard>
        <MetricCard>
          <MetricLabel>Total fees</MetricLabel>
          <MetricValue>{formatNumber(factory?.totalFeesUSD, '$')}</MetricValue>
        </MetricCard>
        <MetricCard>
          <MetricLabel>Latest indexed day volume</MetricLabel>
          <MetricValue>{formatNumber(latestDay?.volumeUSD, '$')}</MetricValue>
          <MetricDetail>{latestDay ? formatDate(latestDay.date) : 'Waiting for daily data'}</MetricDetail>
        </MetricCard>
        <MetricCard>
          <MetricLabel>Transactions</MetricLabel>
          <MetricValue>{formatNumber(factory?.txCount)}</MetricValue>
        </MetricCard>
        <MetricCard>
          <MetricLabel>Pools</MetricLabel>
          <MetricValue>{formatNumber(factory?.poolCount)}</MetricValue>
        </MetricCard>
      </MetricGrid>

      <TrendGrid>
        <TrendChart title="TVL history" data={days} value={(day) => Number(day.tvlUSD)} />
        <TrendChart title="Daily volume" data={days} value={(day) => Number(day.volumeUSD)} />
      </TrendGrid>

      <SearchInput
        type="search"
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        placeholder="Search pools, tokens, or addresses"
        aria-label="Search analytics"
      />

      <Section>
        <SectionTitle>Top pools by TVL</SectionTitle>
        <TableCard>
          <Table>
            <thead>
              <tr>
                <th>Pool</th>
                <th>Fee tier</th>
                <th>TVL</th>
                <th>Total volume</th>
                <th>Total fees</th>
                <th>Transactions</th>
              </tr>
            </thead>
            <tbody>
              {pools.length ? (
                pools.map((pool) => (
                  <tr key={pool.id}>
                    <td>
                      {tokenLabel(pool.token0)} / {tokenLabel(pool.token1)}
                      <ReserveDetail>
                        {formatTokenAmount(pool.totalValueLockedToken0)} {tokenLabel(pool.token0)} +{' '}
                        {formatTokenAmount(pool.totalValueLockedToken1)} {tokenLabel(pool.token1)}
                      </ReserveDetail>
                      <Address>{shortAddress(pool.id)}</Address>
                    </td>
                    <td>{formatFeeTier(pool.feeTier)}</td>
                    <td>{formatNumber(pool.totalValueLockedUSD, '$')}</td>
                    <td>{formatNumber(pool.volumeUSD, '$')}</td>
                    <td>{formatNumber(pool.feesUSD, '$')}</td>
                    <td>{formatNumber(pool.txCount)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <EmptyRow colSpan={6}>
                    {loading ? 'Loading pools...' : search ? 'No pools match this search' : 'No indexed V3 pools yet'}
                  </EmptyRow>
                </tr>
              )}
            </tbody>
          </Table>
        </TableCard>
      </Section>

      <Section>
        <SectionTitle>Top tokens by TVL</SectionTitle>
        <TableCard>
          <Table>
            <thead>
              <tr>
                <th>Token</th>
                <th>Price</th>
                <th>Token liquidity</th>
                <th>TVL</th>
                <th>Total volume</th>
                <th>Total fees</th>
                <th>Transactions</th>
              </tr>
            </thead>
            <tbody>
              {tokens.length ? (
                tokens.map((token) => (
                  <tr key={token.id}>
                    <td>
                      {tokenLabel(token)}
                      <Address>{shortAddress(token.id)}</Address>
                    </td>
                    <td>{formatUsdPrice(Number(token.derivedETH) * wonePriceUSD)}</td>
                    <td>{formatTokenAmount(token.totalValueLocked)}</td>
                    <td>{formatNumber(token.totalValueLockedUSD, '$')}</td>
                    <td>{formatNumber(token.volumeUSD, '$')}</td>
                    <td>{formatNumber(token.feesUSD, '$')}</td>
                    <td>{formatNumber(token.txCount)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <EmptyRow colSpan={7}>
                    {loading
                      ? 'Loading tokens...'
                      : search
                      ? 'No tokens match this search'
                      : 'No indexed V3 tokens yet'}
                  </EmptyRow>
                </tr>
              )}
            </tbody>
          </Table>
        </TableCard>
      </Section>
    </Page>
  )
}
