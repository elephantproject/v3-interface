import { useWeb3React } from '@web3-react/core'
import { SupportedChainId } from 'constants/chains'
import { CurrencyAmount, Token } from 'elephantswapv3-sdk-core'

import { PermitInfo, PermitType, useERC20Permit } from './useERC20Permit'
import useTransactionDeadline from './useTransactionDeadline'

const REMOVE_V2_LIQUIDITY_PERMIT_INFO: PermitInfo = {
  version: '1',
  name: 'Uniswap V2',
  type: PermitType.AMOUNT,
}

export function useV2LiquidityTokenPermit(
  liquidityAmount: CurrencyAmount<Token> | null | undefined,
  spender: string | null | undefined
) {
  const { chainId } = useWeb3React()
  const transactionDeadline = useTransactionDeadline()
  // Harmony's deployed Elephant LP contracts stored their EIP-712 domain with
  // chain ID 1 even though wallets sign on Harmony chain ID 1666600000. Those
  // signatures can never pass the pair's permit check, so use a normal ERC-20
  // approval transaction instead.
  const permitInfo = chainId === SupportedChainId.HARMONY ? null : REMOVE_V2_LIQUIDITY_PERMIT_INFO
  return useERC20Permit(liquidityAmount, spender, transactionDeadline, permitInfo)
}
