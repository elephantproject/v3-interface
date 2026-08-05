import { ChainId, IV2SubgraphProvider, V2SubgraphPool, V2_SUPPORTED } from 'elephantswap-smart-order-router'
import { Token } from 'elephantswapv3-sdk-core'
import { Pair } from 'elephantswapv2-sdk'
import elephantDefaultTokenList from 'elephantdexdefault-token-list'

import { SupportedChainId } from 'constants/chains'

const BASE_SYMBOLS = [
  'WONE',
  'USDC',
  'USDT',
  '1USDC',
  'ethUSDT',
  'ETH',
  'WBTC',
  'arbUSDC',
  'arbUSDT',
  'arbDAI',
]

const HARMONY_BASES = BASE_SYMBOLS.map((symbol) =>
  elephantDefaultTokenList.tokens.find(
    (token) => token.chainId === SupportedChainId.HARMONY && token.symbol === symbol
  )
)
  .filter((token): token is NonNullable<typeof token> => token !== undefined)
  .map((token) => new Token(token.chainId, token.address, token.decimals, token.symbol, token.name))

export function enableHarmonyV2Routing(): void {
  if (!V2_SUPPORTED.includes(ChainId.HARMONY)) {
    V2_SUPPORTED.push(ChainId.HARMONY)
  }
}

function pairCombinations(tokens: Token[]): [Token, Token][] {
  return tokens.flatMap((token, index) => tokens.slice(index + 1).map((other) => [token, other] as [Token, Token]))
}

/**
 * Supplies Harmony V2 pool candidates without relying on the retired Uniswap
 * pool-list endpoint used by the upstream AlphaRouter defaults. The router's
 * V2 pool provider still verifies every candidate and reads live reserves.
 */
export class ElephantV2SubgraphProvider implements IV2SubgraphProvider {
  async getPools(tokenIn?: Token, tokenOut?: Token): Promise<V2SubgraphPool[]> {
    const requestedTokens = [tokenIn, tokenOut].filter((token): token is Token => token !== undefined)
    const requestedPairs =
      tokenIn && tokenOut
        ? [
            [tokenIn, tokenOut] as [Token, Token],
            ...HARMONY_BASES.flatMap(
              (base) =>
                [
                  [tokenIn, base],
                  [tokenOut, base],
                ] as [Token, Token][]
            ),
          ]
        : []
    const candidates = [...requestedPairs, ...pairCombinations([...HARMONY_BASES, ...requestedTokens])]
    const pools = new Map<string, V2SubgraphPool>()

    for (const [tokenA, tokenB] of candidates) {
      if (tokenA.equals(tokenB)) continue

      const [token0, token1] = tokenA.sortsBefore(tokenB) ? [tokenA, tokenB] : [tokenB, tokenA]
      const id = Pair.getAddress(token0, token1)
      const isDirect =
        tokenIn &&
        tokenOut &&
        ((token0.equals(tokenIn) && token1.equals(tokenOut)) ||
          (token0.equals(tokenOut) && token1.equals(tokenIn)))
      const touchesRequestedToken = requestedTokens.some((token) => token.equals(token0) || token.equals(token1))
      const reserve = isDirect ? 1_000_000_000 : touchesRequestedToken ? 1_000_000 : 1_000

      pools.set(id, {
        id,
        token0: { id: token0.address },
        token1: { id: token1.address },
        supply: reserve,
        reserve,
        reserveUSD: reserve,
      })
    }

    return [...pools.values()]
  }
}
