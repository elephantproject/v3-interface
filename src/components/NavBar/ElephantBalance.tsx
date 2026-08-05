import { BigNumber } from '@ethersproject/bignumber'
import { useWeb3React } from '@web3-react/core'
import Modal from 'components/Modal'
import { SupportedChainId } from 'constants/chains'
import { ARCHIVED_ELEPHANT_FARM_PIDS } from 'constants/elephant'
import { ELEPHANT_HARMONY, USDC_HARMONY, WRAPPED_NATIVE_CURRENCY } from 'constants/tokens'
import { CurrencyAmount } from 'elephantswapv3-sdk-core'
import { useElephantMasterBreederContract, useElephantTokenContract } from 'hooks/useElephantContracts'
import { useV2Pair } from 'hooks/useV2Pairs'
import { useSingleCallResult, useSingleContractMultipleData } from 'lib/hooks/multicall'
import { useTokenBalance } from 'lib/hooks/useCurrencyBalance'
import { useEffect, useMemo, useRef, useState } from 'react'
import { X } from 'react-feather'
import { animated, useSpring } from 'react-spring'
import styled, { keyframes } from 'styled-components/macro'

const ELEPHANT_BURN_ADDRESS = '0x7bdef7bdef7bdef7bdef7bdef7bdef7bdef6e7ad'
const WONE_HARMONY = WRAPPED_NATIVE_CURRENCY[SupportedChainId.HARMONY]

const BalanceButton = styled.button`
  display: flex;
  align-items: center;
  height: 40px;
  padding: 4px 12px;
  border: 0;
  border-radius: 8px;
  color: white;
  background: linear-gradient(135deg, #f3b65f, #b94824);
  font-size: 15px;
  font-weight: 700;
  white-space: nowrap;
  cursor: pointer;

  &:hover {
    opacity: 0.8;
  }

  &:active {
    opacity: 0.9;
  }

  @media screen and (max-width: 480px) {
    padding: 4px 10px;
  }
`

const HeaderBalance = styled(animated.span)`
  margin-right: 6px;

  @media screen and (max-width: 480px) {
    display: none;
  }
`

const ModalContent = styled.div`
  width: 100%;
  padding: 16px;
  color: white;
  background: radial-gradient(86% 85% at 5% 0%, #f3b65f 0%, #000 100%);
`

const ModalHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 16px;
  font-weight: 700;
`

const CloseButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4px;
  border: 0;
  color: white;
  background: transparent;
  cursor: pointer;

  &:hover {
    transform: scale(1.1);
  }
`

const Divider = styled.div`
  height: 1px;
  margin: 12px 0;
  background: rgba(255, 255, 255, 0.85);
`

const BalanceSummary = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 2px 0;
  font-size: 20px;
  font-weight: 700;
`

const spinToken = keyframes`
  0% {
    transform: perspective(1000px) rotateY(0deg);
  }

  100% {
    transform: perspective(1000px) rotateY(360deg);
  }
`

const TokenImage = styled.img`
  width: 50px;
  height: 50px;
  object-fit: contain;
  animation: ${spinToken} 9s infinite linear;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.5));
`

const StatList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`

const StatRow = styled.div`
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 16px;
  font-size: 16px;

  > span:last-child {
    flex-shrink: 0;
    font-weight: 600;
    text-align: right;
  }
`

function toAmount(rawValue?: string) {
  return rawValue ? CurrencyAmount.fromRawAmount(ELEPHANT_HARMONY, rawValue) : undefined
}

function formatAmount(amount?: CurrencyAmount<typeof ELEPHANT_HARMONY>, decimals = 2) {
  return amount?.toFixed(decimals, { groupSeparator: ',' }) ?? '-'
}

function formatUsd(value?: number, decimals = 0) {
  if (value === undefined || !Number.isFinite(value)) return '-'
  return `$${value.toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })}`
}

export function ElephantBalance() {
  const { account, chainId } = useWeb3React()
  const [isOpen, setIsOpen] = useState(false)
  const isHarmony = chainId === SupportedChainId.HARMONY
  const elephantContract = useElephantTokenContract(false)
  const masterBreederContract = useElephantMasterBreederContract(false)
  const activeElephantContract = isHarmony ? elephantContract : null
  const activeMasterBreederContract = isHarmony ? masterBreederContract : null
  const walletBalance = useTokenBalance(account ?? undefined, isHarmony ? ELEPHANT_HARMONY : undefined)

  const lockedBalanceCall = useSingleCallResult(activeElephantContract, 'lockOf', [account ?? undefined])
  const totalBalanceCall = useSingleCallResult(activeElephantContract, 'totalBalanceOf', [account ?? undefined])
  const totalSupplyCall = useSingleCallResult(activeElephantContract, 'totalSupply')
  const unlockedSupplyCall = useSingleCallResult(activeElephantContract, 'unlockedSupply')
  const burnedCall = useSingleCallResult(activeElephantContract, 'balanceOf', [ELEPHANT_BURN_ADDRESS])
  const lockPercentageCall = useSingleCallResult(activeMasterBreederContract, 'PERCENT_LOCK_BONUS_REWARD')

  const pendingRewardInputs = useMemo(
    () => (account && isHarmony ? ARCHIVED_ELEPHANT_FARM_PIDS.map((pid) => [pid, account]) : []),
    [account, isHarmony]
  )
  const pendingRewardCalls = useSingleContractMultipleData(
    activeMasterBreederContract,
    'pendingReward',
    pendingRewardInputs
  )

  const pendingTotal = useMemo(() => {
    if (
      !account ||
      pendingRewardCalls.length !== pendingRewardInputs.length ||
      pendingRewardCalls.some((call) => call.loading)
    ) {
      return undefined
    }
    return pendingRewardCalls.reduce((total, call) => total.add(call.result?.[0]?.toString() ?? '0'), BigNumber.from(0))
  }, [account, pendingRewardCalls, pendingRewardInputs.length])

  const lockPercentage = lockPercentageCall.result?.[0]
  const lockedPendingRaw =
    pendingTotal && lockPercentage ? pendingTotal.mul(lockPercentage.toString()).div(100) : undefined
  const unlockedPendingRaw = pendingTotal && lockedPendingRaw ? pendingTotal.sub(lockedPendingRaw) : undefined
  const walletRaw = walletBalance ? BigNumber.from(walletBalance.quotient.toString()) : undefined
  const aggregateRaw = walletRaw ? walletRaw.add(unlockedPendingRaw ?? BigNumber.from(0)) : undefined

  const aggregateBalance = toAmount(aggregateRaw?.toString())
  const headerBalance = useMemo(() => {
    if (!aggregateBalance) return undefined

    const balance = Number(aggregateBalance.toExact())
    return Number.isFinite(balance) ? balance : undefined
  }, [aggregateBalance])
  const balanceOwner = account && chainId ? `${chainId}:${account.toLowerCase()}` : undefined
  const previousBalanceOwner = useRef<string>()
  const hasDisplayedBalance = useRef(false)
  const [{ displayedBalance }, balanceAnimation] = useSpring(() => ({ displayedBalance: 0 }))

  useEffect(() => {
    const ownerChanged = previousBalanceOwner.current !== balanceOwner
    if (ownerChanged) {
      previousBalanceOwner.current = balanceOwner
      hasDisplayedBalance.current = false
    }

    if (headerBalance === undefined) return

    if (!hasDisplayedBalance.current) {
      balanceAnimation.set({ displayedBalance: headerBalance })
      hasDisplayedBalance.current = true
      return
    }

    balanceAnimation.start({
      displayedBalance: headerBalance,
      config: { mass: 1, tension: 120, friction: 20, precision: 0.01 },
    })
  }, [balanceAnimation, balanceOwner, headerBalance])

  const lockedPending = toAmount(lockedPendingRaw?.toString())
  const unlockedPending = toAmount(unlockedPendingRaw?.toString())
  const lockedBalance = toAmount(lockedBalanceCall.result?.[0]?.toString())
  const totalBalance = toAmount(totalBalanceCall.result?.[0]?.toString()) ?? walletBalance
  const totalSupply = toAmount(totalSupplyCall.result?.[0]?.toString())
  const unlockedSupply = toAmount(unlockedSupplyCall.result?.[0]?.toString())
  const totalBurned = toAmount(burnedCall.result?.[0]?.toString())

  const [, elephantWonePair] = useV2Pair(isHarmony ? ELEPHANT_HARMONY : undefined, isHarmony ? WONE_HARMONY : undefined)
  const [, woneUsdcPair] = useV2Pair(isHarmony ? WONE_HARMONY : undefined, isHarmony ? USDC_HARMONY : undefined)
  const elephantPrice = useMemo(() => {
    if (!elephantWonePair || !woneUsdcPair || !WONE_HARMONY) return undefined
    try {
      const oneElephant = CurrencyAmount.fromRawAmount(ELEPHANT_HARMONY, '1000000000000000000')
      const valueInWone = elephantWonePair.priceOf(ELEPHANT_HARMONY).quote(oneElephant)
      return Number(woneUsdcPair.priceOf(WONE_HARMONY).quote(valueInWone).toExact())
    } catch {
      return undefined
    }
  }, [elephantWonePair, woneUsdcPair])

  if (!isHarmony) return null

  const circulationMarketCap =
    unlockedSupply && elephantPrice ? Number(unlockedSupply.toExact()) * elephantPrice : undefined
  const totalMarketCap = totalSupply && elephantPrice ? Number(totalSupply.toExact()) * elephantPrice : undefined

  return (
    <>
      <BalanceButton type="button" onClick={() => setIsOpen(true)} aria-label="View ELEPHANT balance breakdown">
        {account && (
          <HeaderBalance>
            {displayedBalance.to((balance) =>
              Math.round(balance).toLocaleString(undefined, { maximumFractionDigits: 0 })
            )}
          </HeaderBalance>
        )}
        ELEPHANT
      </BalanceButton>
      <Modal isOpen={isOpen} onDismiss={() => setIsOpen(false)} maxWidth={420} hideBorder>
        <ModalContent>
          <ModalHeader>
            <span>Your ELEPHANT Breakdown</span>
            <CloseButton type="button" onClick={() => setIsOpen(false)} aria-label="Close ELEPHANT breakdown">
              <X size={22} />
            </CloseButton>
          </ModalHeader>
          <Divider />
          {account && (
            <>
              <BalanceSummary>
                <TokenImage src="/elephantcoin.png" alt="ELEPHANT" />
                <span>{formatAmount(aggregateBalance)}</span>
              </BalanceSummary>
              <Divider />
              <StatList>
                <StatRow>
                  <span title="Unlocked pending farm rewards">🔓 Pending</span>
                  <span>{formatAmount(unlockedPending)}</span>
                </StatRow>
                <StatRow>
                  <span title="Pending farm rewards that will be locked">🔒 Locked</span>
                  <span>{formatAmount(lockedPending)}</span>
                </StatRow>
              </StatList>
              <Divider />
              <StatList>
                <StatRow>
                  <span>Locked Balance:</span>
                  <span>{formatAmount(lockedBalance)}</span>
                </StatRow>
                <StatRow>
                  <span>Total Balance:</span>
                  <span>{formatAmount(totalBalance)}</span>
                </StatRow>
              </StatList>
              <Divider />
            </>
          )}
          <StatList>
            <StatRow>
              <span>ELEPHANT circulation:</span>
              <span>{formatAmount(unlockedSupply, 0)}</span>
            </StatRow>
            <StatRow>
              <span>ELEPHANT Total burned:</span>
              <span>{formatAmount(totalBurned, 0)}</span>
            </StatRow>
            <StatRow>
              <span>ELEPHANT total supply:</span>
              <span>{formatAmount(totalSupply, 0)}</span>
            </StatRow>
          </StatList>
          {elephantPrice !== undefined && (
            <>
              <Divider />
              <StatList>
                <StatRow>
                  <span>ELEPHANT price:</span>
                  <span>{formatUsd(elephantPrice, 10)}</span>
                </StatRow>
                <StatRow>
                  <span>ELEPHANT circ. market cap:</span>
                  <span>{formatUsd(circulationMarketCap)}</span>
                </StatRow>
                <StatRow>
                  <span>ELEPHANT total market cap:</span>
                  <span>{formatUsd(totalMarketCap)}</span>
                </StatRow>
              </StatList>
            </>
          )}
        </ModalContent>
      </Modal>
    </>
  )
}
