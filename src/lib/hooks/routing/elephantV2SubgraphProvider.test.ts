import { Token } from 'elephantswapv3-sdk-core'
import { Pair } from 'elephantswapv2-sdk'

import { SupportedChainId } from 'constants/chains'

import { ChainId, V2_SUPPORTED } from 'elephantswap-smart-order-router'

import { ElephantV2SubgraphProvider, enableHarmonyV2Routing } from './elephantV2SubgraphProvider'

const WONE = new Token(SupportedChainId.HARMONY, '0xcF664087a5bB0237a0BAd6742852ec6c8d69A27a', 18, 'WONE')
const ELEPHANT = new Token(SupportedChainId.HARMONY, '0xC30a7F9c216B945Ff8ACFB389e955A637eB0f478', 18, 'ELEPHANT')
const USDC = new Token(SupportedChainId.HARMONY, '0xBC594CABd205bD993e7FfA6F3e9ceA75c1110da5', 6, 'USDC')

describe('ElephantV2SubgraphProvider', () => {
  it('enables the AlphaRouter V2 quoter on Harmony', () => {
    enableHarmonyV2Routing()

    expect(V2_SUPPORTED).toContain(ChainId.HARMONY)
  })

  it('includes direct and base-routed Harmony V2 candidates', async () => {
    const pools = await new ElephantV2SubgraphProvider().getPools(ELEPHANT, USDC)
    const addresses = new Set(pools.map(({ id }) => id))

    expect(addresses.has(Pair.getAddress(ELEPHANT, USDC))).toBe(true)
    expect(addresses.has(Pair.getAddress(ELEPHANT, WONE))).toBe(true)
    expect(addresses.has(Pair.getAddress(WONE, USDC))).toBe(true)
  })
})
