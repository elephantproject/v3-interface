import { useQuery } from '@apollo/client'
import { useWeb3React } from '@web3-react/core'
import { V3_CORE_FACTORY_ADDRESSES } from 'constants/addresses'
import { FeeAmount, Pool } from 'elephantswapv3-sdk'
import { Currency } from 'elephantswapv3-sdk-core'
import { apolloClient } from 'graphql/thegraph/apollo'
import {
  POOL_DAY_PRICE_HISTORY_QUERY,
  POOL_HOUR_PRICE_HISTORY_QUERY,
  PoolDayPriceHistoryQuery,
  PoolHourPriceHistoryQuery,
  PoolPriceHistoryQueryVariables,
} from 'graphql/thegraph/PoolPriceHistoryQuery'
import { TickProcessed, usePoolActiveLiquidity } from 'hooks/usePoolTickData'
import { useCallback, useMemo } from 'react'

import { ChartEntry, PriceHistoryPeriod, PriceHistoryPoint } from './types'

const HISTORY_POINT_COUNTS: Record<PriceHistoryPeriod, number> = {
  ALL: 1000,
  '1Y': 365,
  '1M': 31,
  '1D': 24,
}

const HISTORY_SECONDS: Record<PriceHistoryPeriod, number> = {
  ALL: 0,
  '1Y': 365 * 86_400,
  '1M': 30 * 86_400,
  '1D': 86_400,
}

export function usePoolPriceHistory({
  currencyA,
  currencyB,
  feeAmount,
  period,
}: {
  currencyA?: Currency
  currencyB?: Currency
  feeAmount?: FeeAmount
  period: PriceHistoryPeriod
}) {
  const { chainId } = useWeb3React()
  const poolAddress =
    currencyA && currencyB && feeAmount
      ? Pool.getAddress(
          currencyA.wrapped,
          currencyB.wrapped,
          feeAmount,
          undefined,
          chainId ? V3_CORE_FACTORY_ADDRESSES[chainId] : undefined
        ).toLowerCase()
      : undefined
  const isSorted = currencyA && currencyB ? currencyA.wrapped.sortsBefore(currencyB.wrapped) : true
  const startTime = useMemo(() => {
    const now = Math.floor(Date.now() / 1000)
    return HISTORY_SECONDS[period] ? now - HISTORY_SECONDS[period] : 0
  }, [period])
  const variables = {
    poolAddress: poolAddress ?? '',
    first: HISTORY_POINT_COUNTS[period],
    startTime,
  }
  const hourly = period === '1D'

  const dayResult = useQuery<PoolDayPriceHistoryQuery, PoolPriceHistoryQueryVariables>(POOL_DAY_PRICE_HISTORY_QUERY, {
    variables,
    skip: !poolAddress || hourly,
    client: apolloClient,
    pollInterval: 30_000,
  })
  const hourResult = useQuery<PoolHourPriceHistoryQuery, PoolPriceHistoryQueryVariables>(
    POOL_HOUR_PRICE_HISTORY_QUERY,
    { variables, skip: !poolAddress || !hourly, client: apolloClient, pollInterval: 30_000 }
  )

  const history = useMemo<PriceHistoryPoint[]>(() => {
    const rows = hourly
      ? (hourResult.data?.poolHourDatas ?? []).map((row) => ({
          timestamp: row.periodStartUnix,
          token0Price: row.token0Price,
          token1Price: row.token1Price,
        }))
      : (dayResult.data?.poolDayDatas ?? []).map((row) => ({
          timestamp: row.date,
          token0Price: row.token0Price,
          token1Price: row.token1Price,
        }))

    return rows
      .map((row) => ({
        timestamp: new Date(row.timestamp * 1000),
        price: Number(isSorted ? row.token0Price : row.token1Price),
      }))
      .filter((point) => Number.isFinite(point.price) && point.price > 0)
      .reverse()
  }, [dayResult.data?.poolDayDatas, hourResult.data?.poolHourDatas, hourly, isSorted])

  return {
    history,
    isLoading: hourly ? hourResult.loading : dayResult.loading,
    error: hourly ? hourResult.error : dayResult.error,
  }
}

export function useDensityChartData({
  currencyA,
  currencyB,
  feeAmount,
}: {
  currencyA?: Currency
  currencyB?: Currency
  feeAmount?: FeeAmount
}) {
  const { isLoading, error, data } = usePoolActiveLiquidity(currencyA, currencyB, feeAmount)

  const formatData = useCallback(() => {
    if (!data?.length) {
      return undefined
    }

    const newData: ChartEntry[] = []
    const isSorted = currencyA && currencyB ? currencyA.wrapped.sortsBefore(currencyB.wrapped) : true

    for (let i = 0; i < data.length; i++) {
      const t: TickProcessed = data[i]

      const token0Price = parseFloat(t.price0)
      const chartEntry = {
        activeLiquidity: parseFloat(t.liquidityActive.toString()),
        price0: isSorted ? token0Price : 1 / token0Price,
      }

      if (chartEntry.activeLiquidity > 0 && Number.isFinite(chartEntry.price0)) {
        newData.push(chartEntry)
      }
    }

    return newData.sort((first, second) => first.price0 - second.price0)
  }, [currencyA, currencyB, data])

  return useMemo(() => {
    return {
      isLoading,
      error,
      formattedData: !isLoading ? formatData() : undefined,
    }
  }, [isLoading, error, formatData])
}
