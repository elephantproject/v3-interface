import { BigNumber } from '@ethersproject/bignumber'
import type { BuildOnChainGasModelFactoryType, IOnChainGasModelFactory } from 'elephantswap-smart-order-router'
import { CurrencyAmount } from 'elephantswapv3-sdk-core'

/**
 * V3 and mixed-route gas models are constructed even for V2-only quotes.
 * Harmony has no guaranteed V3 USD/WONE reference pool, so use neutral gas
 * adjustments and allow the V2 gas model to price V2 routes independently.
 */
export class HarmonyOnChainGasModelFactory implements IOnChainGasModelFactory {
  async buildGasModel({ quoteToken }: BuildOnChainGasModelFactoryType) {
    return {
      estimateGasCost: () => ({
        gasEstimate: BigNumber.from(0),
        gasCostInToken: CurrencyAmount.fromRawAmount(quoteToken, 0),
        gasCostInUSD: CurrencyAmount.fromRawAmount(quoteToken, 0),
      }),
    }
  }
}
