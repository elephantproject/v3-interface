import gql from 'graphql-tag'
import JSBI from 'jsbi'

interface V3Tick {
  tick: number | string
  liquidityNet: JSBI | number | string
  price0?: string
  price1?: string
}

export interface AllV3TicksQuery {
  ticks: V3Tick[]
}

export interface AllV3TicksQueryVariables {
  poolAddress: string
  skip: number
}

export const ALL_V3_TICKS_QUERY = gql`
  query AllV3Ticks($poolAddress: String!, $skip: Int!) {
    ticks(first: 1000, skip: $skip, where: { poolAddress: $poolAddress }, orderBy: tickIdx) {
      tick: tickIdx
      liquidityNet
      price0
      price1
    }
  }
`

export type Ticks = AllV3TicksQuery['ticks']
export type TickData = Ticks[number]
