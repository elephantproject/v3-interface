import { Contract } from '@ethersproject/contracts'
import { formatUnits, parseUnits } from '@ethersproject/units'
import { useWeb3React } from '@web3-react/core'
import { ButtonPrimary, ButtonSecondary } from 'components/Button'
import { BlueCard } from 'components/Card'
import { AutoColumn } from 'components/Column'
import { CardBGImage, CardSection, DataCard } from 'components/earn/styled'
import Modal from 'components/Modal'
import { RowBetween } from 'components/Row'
import IUniswapV2FactoryJson from 'elephantdexcore/build/IUniswapV2Factory.json'
import IUniswapV2PairJson from 'elephantdexcore/build/IUniswapV2Pair.json'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { X } from 'react-feather'
import styled from 'styled-components/macro'

import { V2_FACTORY_ADDRESSES } from '../../constants/addresses'
import { ELEPHANT_PIT_ADDRESS, ELEPHANT_PIT_BREEDER_ADDRESS, ELEPHANT_PIT_FEE_PAIRS } from '../../constants/elephant'
import {
  useElephantPitBreederContract,
  useElephantPitContract,
  useElephantTokenContract,
} from '../../hooks/useElephantContracts'
import { useTransactionAdder } from '../../state/transactions/hooks'
import { TransactionType } from '../../state/transactions/types'
import { calculateGasMargin } from '../../utils/calculateGasMargin'
import { recoverReceiptDeserializationTransaction } from '../../utils/recoverSubmittedTransaction'

type PitBalances = {
  elephant: string
  xElephant: string
  underlying: string
  allowance: string
  ratio?: number
}

const EMPTY_BALANCES: PitBalances = {
  elephant: '0',
  xElephant: '0',
  underlying: '0',
  allowance: '0',
}

const PageWrapper = styled(AutoColumn)`
  max-width: 640px;
  width: 99%;
  margin: 24px auto 64px;
`

const BottomSection = styled(AutoColumn)`
  border-radius: 9px;
  width: 99%;
  position: relative;
`

const StyledBottomCard = styled(DataCard)`
  background: ${({ theme }) => theme.deprecated_bg3};
  margin-top: -40px;
  padding: 32px 1em 1em;
  z-index: 1;
`

const CustomCard = styled(DataCard)`
  background: radial-gradient(80% 80% at 2% 0%, #167965 0%, #7e321b 100%);
  overflow: hidden;
  z-index: 1;
`

const DataRow = styled(RowBetween)`
  justify-content: center;
  gap: 9px;

  > button {
    width: 160px;
    padding: 8px;
    border-radius: 8px;
    font-size: 16px;
  }
`

const WhiteText = styled.p<{ $title?: boolean }>`
  color: white;
  font-size: ${({ $title }) => ($title ? '16px' : '14px')};
  font-weight: ${({ $title }) => ($title ? 600 : 400)};
  margin: 0;
`

const BodyText = styled.p`
  color: ${({ theme }) => theme.textPrimary};
  margin: 0;
  line-height: 1.5;
`

const Balance = styled.div`
  color: ${({ theme }) => theme.textPrimary};
  font-size: 36px;
  font-weight: 600;
`

const Ratio = styled.span`
  color: ${({ theme }) => theme.textSecondary};
  font-size: 14px;
  font-style: italic;
  margin-left: 0.2em;
`

const ModalContent = styled(AutoColumn)`
  width: 100%;
  padding: 1em;
  overscroll-behavior: none;
`

const ModalTitle = styled.h2`
  color: ${({ theme }) => theme.textPrimary};
  font-size: 20px;
  margin: 0;
`

const CloseButton = styled.button`
  border: 0;
  background: transparent;
  color: ${({ theme }) => theme.textSecondary};
  cursor: pointer;
  padding: 4px;
`

const AmountPanel = styled.div`
  background: ${({ theme }) => theme.backgroundModule};
  border: 1px solid ${({ theme }) => theme.backgroundOutline};
  border-radius: 12px;
  padding: 12px 14px;
`

const AmountInput = styled.input`
  width: 100%;
  border: 0;
  outline: 0;
  background: transparent;
  color: ${({ theme }) => theme.textPrimary};
  font-size: 28px;
`

const AvailableRow = styled(RowBetween)`
  color: ${({ theme }) => theme.textSecondary};
  font-size: 13px;
  margin-top: 8px;
`

const MaxButton = styled.button`
  border: 0;
  background: transparent;
  color: ${({ theme }) => theme.accentAction};
  cursor: pointer;
  font-weight: 600;
`

const ErrorText = styled.p`
  color: ${({ theme }) => theme.accentFailure};
  font-size: 14px;
  margin: 0;
  overflow-wrap: anywhere;
`

const CenterText = styled(BodyText)`
  font-size: 14px;
  text-align: center;
`

function displayAmount(value: string, digits = 6) {
  const number = Number(formatUnits(value, 18))
  return Number.isFinite(number) ? number.toLocaleString(undefined, { maximumFractionDigits: digits }) : '0'
}

function transactionErrorMessage(error: any, fallback: string) {
  return error?.reason ?? error?.data?.message ?? error?.error?.message ?? error?.message ?? fallback
}

export default function Pit() {
  const { account, chainId, provider } = useWeb3React()
  const elephant = useElephantTokenContract()
  const pit = useElephantPitContract()
  const pitBreeder = useElephantPitBreederContract()
  const [balances, setBalances] = useState<PitBalances>(EMPTY_BALANCES)
  const [modal, setModal] = useState<'deposit' | 'claim' | 'withdraw' | undefined>()
  const [amount, setAmount] = useState('')
  const [pending, setPending] = useState('')
  const [error, setError] = useState('')
  const [claimPairs, setClaimPairs] = useState<Array<readonly [string, string]> | undefined>()
  const addTransaction = useTransactionAdder()

  const refresh = useCallback(async () => {
    if (!account || !elephant || !pit) {
      setBalances(EMPTY_BALANCES)
      return
    }

    try {
      const [elephantBalance, pitBalance, pitSupply, pitUnderlying, allowance] = await Promise.all([
        elephant.balanceOf(account),
        pit.balanceOf(account),
        pit.totalSupply(),
        elephant.balanceOf(ELEPHANT_PIT_ADDRESS),
        elephant.allowance(account, ELEPHANT_PIT_ADDRESS),
      ])
      const underlying = pitSupply.isZero() ? pitBalance : pitBalance.mul(pitUnderlying).div(pitSupply)
      const ratio = pitSupply.isZero()
        ? undefined
        : Number(formatUnits(pitUnderlying, 18)) / Number(formatUnits(pitSupply, 18))
      setBalances({
        elephant: elephantBalance.toString(),
        xElephant: pitBalance.toString(),
        underlying: underlying.toString(),
        allowance: allowance.toString(),
        ratio,
      })
      setError('')
    } catch {
      setError('Unable to load xElephant balances from Harmony.')
    }
  }, [account, elephant, pit])

  useEffect(() => {
    refresh()
  }, [refresh])

  const closeModal = useCallback(() => {
    setModal(undefined)
    setAmount('')
    setPending('')
    setError('')
    setClaimPairs(undefined)
  }, [])

  const runTransaction = useCallback(
    async (label: string, action: () => Promise<any>) => {
      setPending(label)
      setError('')
      try {
        const transaction = await action()
        addTransaction(transaction, {
          type: TransactionType.CUSTOM,
          pendingTitle: label,
          confirmedTitle: label.replace(/ing\b/, 'ed'),
          failedTitle: `${label} failed`,
          descriptor: 'xElephant',
        })
        try {
          await transaction.wait()
        } catch (receiptError) {
          if (!recoverReceiptDeserializationTransaction(receiptError)) throw receiptError
        }
        await refresh()
        closeModal()
      } catch (transactionError: any) {
        setError(transactionErrorMessage(transactionError, `${label} failed.`))
        setPending('')
      }
    },
    [addTransaction, closeModal, refresh]
  )

  const parsedAmount = useMemo(() => {
    try {
      return parseUnits(amount || '0', 18)
    } catch {
      return undefined
    }
  }, [amount])

  const needsApproval = Boolean(parsedAmount && parsedAmount.gt(balances.allowance))

  const loadClaimablePairs = useCallback(async () => {
    if (!provider || !chainId || !pitBreeder) return
    const factoryAddress = V2_FACTORY_ADDRESSES[chainId]
    if (!factoryAddress) return

    setPending('Loading rewards')
    setError('')
    try {
      const factory = new Contract(factoryAddress, IUniswapV2FactoryJson.abi, provider)
      const pairs = await Promise.all(
        ELEPHANT_PIT_FEE_PAIRS.map(async ([token0, token1]) => {
          const pairAddress = await factory.getPair(token0, token1)
          if (/^0x0{40}$/i.test(pairAddress)) return undefined
          const pair = new Contract(pairAddress, IUniswapV2PairJson.abi, provider)
          const balance = await pair.balanceOf(ELEPHANT_PIT_BREEDER_ADDRESS)
          return balance.gt(1) ? ([token0, token1] as const) : undefined
        })
      )
      const fundedPairs = pairs.filter((pair): pair is readonly [string, string] => Boolean(pair))
      // Production's curated list avoids arbitrary malicious pairs. A few old
      // allowlisted pools can still contain unburnable dust or have lost their
      // bridge route, so preflight each conversion before assembling the batch.
      const convertiblePairs = await Promise.all(
        fundedPairs.map(async (pair) => {
          try {
            await pitBreeder.estimateGas.convert(pair[0], pair[1])
            return pair
          } catch {
            return undefined
          }
        })
      )
      setClaimPairs(convertiblePairs.filter((pair): pair is readonly [string, string] => Boolean(pair)))
    } catch (claimError: any) {
      setError(transactionErrorMessage(claimError, 'Unable to load xElephant rewards.'))
      setClaimPairs([])
    } finally {
      setPending('')
    }
  }, [chainId, pitBreeder, provider])

  useEffect(() => {
    if (modal === 'claim' && claimPairs === undefined) loadClaimablePairs()
  }, [claimPairs, loadClaimablePairs, modal])

  const claim = useCallback(async () => {
    if (!pitBreeder || !claimPairs?.length) return
    const from = claimPairs.map(([token0]) => token0)
    const to = claimPairs.map(([, token1]) => token1)
    await runTransaction('Claiming xElephant rewards', async () => {
      const estimatedGas = await pitBreeder.estimateGas.convertMultiple(from, to)
      return pitBreeder.convertMultiple(from, to, {
        gasLimit: calculateGasMargin(estimatedGas),
      })
    })
  }, [claimPairs, pitBreeder, runTransaction])

  const staked = Number(formatUnits(balances.xElephant, 18)) > 0

  return (
    <PageWrapper gap="24px" justify="center">
      <Modal isOpen={modal === 'deposit'} onDismiss={closeModal} maxHeight={90}>
        <ModalContent gap="24px">
          <RowBetween>
            <ModalTitle>Deposit ELEPHANT</ModalTitle>
            <CloseButton onClick={closeModal} aria-label="Close">
              <X />
            </CloseButton>
          </RowBetween>
          <AmountPanel>
            <AmountInput
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              inputMode="decimal"
              placeholder="0.0"
            />
            <AvailableRow>
              <span>Available to deposit: {displayAmount(balances.elephant)} ELEPHANT</span>
              <MaxButton onClick={() => setAmount(formatUnits(balances.elephant, 18))}>MAX</MaxButton>
            </AvailableRow>
          </AmountPanel>
          <RowBetween gap="12px">
            <ButtonSecondary
              disabled={!!pending || !parsedAmount?.gt(0) || !needsApproval}
              onClick={() =>
                elephant &&
                runTransaction('Approving ELEPHANT', () => elephant.approve(ELEPHANT_PIT_ADDRESS, parsedAmount))
              }
            >
              {needsApproval ? 'Approve' : 'Approved'}
            </ButtonSecondary>
            <ButtonPrimary
              disabled={!!pending || !parsedAmount?.gt(0) || needsApproval}
              onClick={() => pit && runTransaction('Depositing ELEPHANT', () => pit.enter(parsedAmount))}
            >
              {pending || 'Deposit'}
            </ButtonPrimary>
          </RowBetween>
          {error && <ErrorText>{error}</ErrorText>}
        </ModalContent>
      </Modal>

      <Modal isOpen={modal === 'withdraw'} onDismiss={closeModal} maxHeight={90}>
        <ModalContent gap="24px">
          <RowBetween>
            <ModalTitle>Withdraw xELEPHANT</ModalTitle>
            <CloseButton onClick={closeModal} aria-label="Close">
              <X />
            </CloseButton>
          </RowBetween>
          <AmountPanel>
            <AmountInput
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              inputMode="decimal"
              placeholder="0.0"
            />
            <AvailableRow>
              <span>Available to withdraw: {displayAmount(balances.xElephant)} xELEPHANT</span>
              <MaxButton onClick={() => setAmount(formatUnits(balances.xElephant, 18))}>MAX</MaxButton>
            </AvailableRow>
          </AmountPanel>
          <ButtonPrimary
            disabled={!!pending || !parsedAmount?.gt(0)}
            onClick={() => pit && runTransaction('Withdrawing xELEPHANT', () => pit.leave(parsedAmount))}
          >
            {pending || 'Withdraw'}
          </ButtonPrimary>
          {error && <ErrorText>{error}</ErrorText>}
        </ModalContent>
      </Modal>

      <Modal isOpen={modal === 'claim'} onDismiss={closeModal} maxHeight={90}>
        <ModalContent gap="24px">
          <RowBetween>
            <ModalTitle>Claim</ModalTitle>
            <CloseButton onClick={closeModal} aria-label="Close">
              <X />
            </CloseButton>
          </RowBetween>
          <CenterText style={{ fontSize: 32 }}>💎</CenterText>
          {pending === 'Loading rewards' ? (
            <CenterText>Loading trading fee rewards…</CenterText>
          ) : claimPairs?.length ? (
            <>
              <CenterText>
                When you claim rewards, collected LP fees will be used to market buy ELEPHANT.
                <br />
                <br />
                The purchased ELEPHANT tokens will then be distributed to the xElephant stakers as a reward.
              </CenterText>
              <ButtonPrimary disabled={!!pending} onClick={claim}>
                {pending || 'Claim'}
              </ButtonPrimary>
            </>
          ) : (
            <CenterText>
              There are no trading fee rewards available
              <br />
              to claim right now.
              <br />
              <br />
              Please wait a little bit and then check back here again.
            </CenterText>
          )}
          {error && <ErrorText>{error}</ErrorText>}
        </ModalContent>
      </Modal>

      <BottomSection gap="24px" justify="center">
        <CustomCard>
          <CardSection>
            <CardBGImage desaturate />
            <AutoColumn className="z" gap="16px">
              <WhiteText $title>xElephant - DEX fee sharing</WhiteText>
              <WhiteText>Stake your ELEPHANT tokens and earn 1/3rd of V2 trading fees.</WhiteText>
              <br />
            </AutoColumn>
          </CardSection>
        </CustomCard>
        <StyledBottomCard>
          <CardBGImage desaturate />
          <AutoColumn gap="8px">
            <BodyText>
              Your xELEPHANT Balance
              {balances.ratio !== undefined && <Ratio>(1 xELEPHANT = {balances.ratio.toPrecision(5)} ELEPHANT)</Ratio>}
            </BodyText>
            <Balance>{displayAmount(balances.xElephant, 4)}</Balance>
          </AutoColumn>
        </StyledBottomCard>
      </BottomSection>

      {account && staked && (
        <BodyText>You have {displayAmount(balances.underlying, 2)} ELEPHANT tokens staked in the xElephant.</BodyText>
      )}
      {account && !staked && (
        <BodyText>
          You have {displayAmount(balances.elephant, 2)} ELEPHANT tokens available to deposit to the xElephant.
        </BodyText>
      )}

      {account && (
        <DataRow>
          <ButtonPrimary onClick={() => setModal('deposit')}>Deposit</ButtonPrimary>
          <ButtonPrimary onClick={() => setModal('claim')}>Claim</ButtonPrimary>
          <ButtonPrimary onClick={() => setModal('withdraw')}>Withdraw</ButtonPrimary>
        </DataRow>
      )}

      <BlueCard>
        <CenterText>
          <span role="img" aria-label="wizard-icon" style={{ marginRight: 8 }}>
            💡
          </span>
          <b>Important:</b> Your ELEPHANT rewards will only be visible after you withdraw your xELEPHANT tokens from the
          pool.
        </CenterText>
      </BlueCard>
    </PageWrapper>
  )
}
