import gql from 'graphql-tag'

interface PoolDayData {
  date: number
  token0Price: string
  token1Price: string
}

interface PoolHourData {
  periodStartUnix: number
  token0Price: string
  token1Price: string
}

export interface PoolDayPriceHistoryQuery {
  poolDayDatas: PoolDayData[]
}

export interface PoolHourPriceHistoryQuery {
  poolHourDatas: PoolHourData[]
}

export interface PoolPriceHistoryQueryVariables {
  poolAddress: string
  first: number
  startTime: number
}

export const POOL_DAY_PRICE_HISTORY_QUERY = gql`
  query PoolDayPriceHistory($poolAddress: String!, $first: Int!, $startTime: Int!) {
    poolDayDatas(
      first: $first
      where: { pool: $poolAddress, date_gte: $startTime }
      orderBy: date
      orderDirection: desc
    ) {
      date
      token0Price
      token1Price
    }
  }
`

export const POOL_HOUR_PRICE_HISTORY_QUERY = gql`
  query PoolHourPriceHistory($poolAddress: String!, $first: Int!, $startTime: Int!) {
    poolHourDatas(
      first: $first
      where: { pool: $poolAddress, periodStartUnix_gte: $startTime }
      orderBy: periodStartUnix
      orderDirection: desc
    ) {
      periodStartUnix
      token0Price
      token1Price
    }
  }
`
