import { BigNumber } from '@ethersproject/bignumber'
import { Contract } from '@ethersproject/contracts'
import { formatUnits } from '@ethersproject/units'
import { useWeb3React } from '@web3-react/core'
import ERC20_ABI from 'abis/erc20.json'
import { useToggleAccountDrawer } from 'components/AccountDrawer'
import IUniswapV2PairJson from 'elephantdexcore/build/IUniswapV2Pair.json'
import { useCallback, useEffect, useState } from 'react'
import { useTransactionAdder } from 'state/transactions/hooks'
import { TransactionType } from 'state/transactions/types'
import { recoverReceiptDeserializationTransaction } from 'utils/recoverSubmittedTransaction'

import { ARCHIVED_ELEPHANT_FARM_PIDS, ZERO_ADDRESS } from '../../constants/elephant'
import { useElephantMasterBreederContract, useElephantTokenContract } from '../../hooks/useElephantContracts'
import {
  ActionRow,
  ElephantCard,
  ElephantHero,
  ElephantPage,
  Grid,
  Notice,
  PageSubtitle,
  PageTitle,
  PrimaryAction,
} from '../Elephant/shared'

type ArchivedPosition = {
  pid: number
  amount: BigNumber
  lpToken: string
  label: string
  decimals: number
}

function formatBalance(amount: BigNumber, decimals: number) {
  const value = Number(formatUnits(amount, decimals))
  return Number.isFinite(value) ? value.toLocaleString(undefined, { maximumFractionDigits: 8 }) : '0'
}

async function readTokenSymbol(contract: Contract) {
  try {
    return await contract.symbol()
  } catch {
    return 'Unknown'
  }
}

export default function ArchivedStaking() {
  const { account, provider } = useWeb3React()
  const toggleAccountDrawer = useToggleAccountDrawer()
  const masterBreeder = useElephantMasterBreederContract()
  const [positions, setPositions] = useState<ArchivedPosition[]>([])
  const [loading, setLoading] = useState(false)
  const [pendingPid, setPendingPid] = useState<number>()
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')
  const addTransaction = useTransactionAdder()

  const refresh = useCallback(async () => {
    if (!account || !provider || !masterBreeder) {
      setPositions([])
      return
    }

    setLoading(true)
    setError('')
    try {
      const loaded = await Promise.all(
        ARCHIVED_ELEPHANT_FARM_PIDS.map(async (pid) => {
          const [userInfo, poolInfo] = await Promise.all([
            masterBreeder.userInfo(pid, account),
            masterBreeder.poolInfo(pid),
          ])
          const amount: BigNumber = userInfo.amount ?? userInfo[0]
          if (amount.isZero()) return undefined

          const lpToken: string = poolInfo.lpToken ?? poolInfo[0]
          const lp = new Contract(lpToken, IUniswapV2PairJson.abi, provider)
          const erc20 = new Contract(lpToken, ERC20_ABI, provider)
          const decimals = await erc20.decimals().catch(() => 18)
          let label = `Archived V2 farm #${pid}`
          try {
            const [token0Address, token1Address] = await Promise.all([lp.token0(), lp.token1()])
            const [symbol0, symbol1] = await Promise.all([
              readTokenSymbol(new Contract(token0Address, ERC20_ABI, provider)),
              readTokenSymbol(new Contract(token1Address, ERC20_ABI, provider)),
            ])
            label = `${symbol0} / ${symbol1}`
          } catch {
            const symbol = await readTokenSymbol(erc20)
            label = `${symbol} farm #${pid}`
          }

          return { pid, amount, lpToken, label, decimals }
        })
      )
      setPositions(loaded.filter((position): position is ArchivedPosition => !!position))
    } catch (loadError: any) {
      setError(loadError?.reason ?? loadError?.message ?? 'Unable to load archived V2 farms.')
    } finally {
      setLoading(false)
    }
  }, [account, masterBreeder, provider])

  useEffect(() => {
    refresh()
  }, [refresh])

  async function withdraw(position: ArchivedPosition) {
    if (!masterBreeder) return
    setPendingPid(position.pid)
    setNotice('')
    setError('')
    try {
      const transaction = await masterBreeder.withdraw(position.pid, position.amount, ZERO_ADDRESS)
      addTransaction(transaction, {
        type: TransactionType.CUSTOM,
        pendingTitle: 'Unlocking archived liquidity',
        confirmedTitle: 'Archived liquidity unlocked',
        failedTitle: 'Unlock archived liquidity failed',
        descriptor: position.label,
      })
      setNotice(`Withdrawal submitted: ${transaction.hash}`)
      try {
        await transaction.wait()
      } catch (receiptError) {
        if (!recoverReceiptDeserializationTransaction(receiptError)) throw receiptError
      }
      await refresh()
      setNotice(`${position.label} LP tokens unlocked.`)
    } catch (withdrawError: any) {
      setError(withdrawError?.reason ?? withdrawError?.message ?? 'Unable to withdraw this farm position.')
    } finally {
      setPendingPid(undefined)
    }
  }

  return (
    <ElephantPage>
      <ElephantHero>
        <h1>Archived V2 farm liquidity</h1>
        <p>View expired ElephantSwap V2 farm positions and withdraw the LP tokens still held by MasterBreeder.</p>
      </ElephantHero>

      {!account ? (
        <ElephantCard style={{ marginTop: 16 }}>
          <PageTitle>Connect your wallet</PageTitle>
          <PageSubtitle>
            Your archived positions are read directly from the production V2 staking contract.
          </PageSubtitle>
          <ActionRow>
            <PrimaryAction onClick={toggleAccountDrawer}>Connect wallet</PrimaryAction>
          </ActionRow>
        </ElephantCard>
      ) : loading ? (
        <ElephantCard style={{ marginTop: 16 }}>Loading archived farms…</ElephantCard>
      ) : positions.length ? (
        <Grid>
          {positions.map((position) => (
            <ElephantCard key={position.pid}>
              <PageTitle>{position.label}</PageTitle>
              <PageSubtitle>Expired farm #{position.pid}</PageSubtitle>
              <p>{formatBalance(position.amount, position.decimals)} LP tokens</p>
              <Notice>{position.lpToken}</Notice>
              <ActionRow>
                <PrimaryAction disabled={pendingPid !== undefined} onClick={() => withdraw(position)}>
                  {pendingPid === position.pid ? 'Unlocking…' : 'Unlock LP tokens'}
                </PrimaryAction>
              </ActionRow>
            </ElephantCard>
          ))}
        </Grid>
      ) : (
        <ElephantCard style={{ marginTop: 16 }}>
          No LP tokens remain in the archived V2 farms for this wallet.
        </ElephantCard>
      )}

      {notice && <Notice>{notice}</Notice>}
      {error && <Notice $error>{error}</Notice>}
    </ElephantPage>
  )
}

export function UnlockElephant() {
  const { account } = useWeb3React()
  const toggleAccountDrawer = useToggleAccountDrawer()
  const elephant = useElephantTokenContract()
  const [unlockable, setUnlockable] = useState<BigNumber>(BigNumber.from(0))
  const [pending, setPending] = useState(false)
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')
  const addTransaction = useTransactionAdder()

  const refresh = useCallback(async () => {
    if (!account || !elephant) {
      setUnlockable(BigNumber.from(0))
      return
    }
    try {
      setUnlockable(await elephant.canUnlockAmount(account))
    } catch {
      setError('Unable to load locked ELEPHANT balance.')
    }
  }, [account, elephant])

  useEffect(() => {
    refresh()
  }, [refresh])

  async function unlock() {
    if (!elephant) return
    setPending(true)
    setError('')
    try {
      const transaction = await elephant.unlock()
      addTransaction(transaction, {
        type: TransactionType.CUSTOM,
        pendingTitle: 'Unlocking ELEPHANT',
        confirmedTitle: 'ELEPHANT unlocked',
        failedTitle: 'Unlock ELEPHANT failed',
        descriptor: 'ELEPHANT',
      })
      setNotice(`Unlock submitted: ${transaction.hash}`)
      try {
        await transaction.wait()
      } catch (receiptError) {
        if (!recoverReceiptDeserializationTransaction(receiptError)) throw receiptError
      }
      await refresh()
      setNotice('ELEPHANT tokens unlocked.')
    } catch (unlockError: any) {
      setError(unlockError?.reason ?? unlockError?.message ?? 'Unlock transaction failed.')
    } finally {
      setPending(false)
    }
  }

  return (
    <ElephantPage>
      <ElephantHero>
        <h1>Unlock ELEPHANT</h1>
        <p>Claim unlocked ELEPHANT to restake, buy NFTs, or play at the casino.</p>
      </ElephantHero>
      <ElephantCard style={{ marginTop: 16 }}>
        <PageTitle>{formatBalance(unlockable, 18)} ELEPHANT</PageTitle>
        <PageSubtitle>Currently available to unlock</PageSubtitle>
        <ActionRow>
          {!account ? (
            <PrimaryAction onClick={toggleAccountDrawer}>Connect wallet</PrimaryAction>
          ) : (
            <PrimaryAction disabled={pending || unlockable.isZero()} onClick={unlock}>
              {pending ? 'Unlocking…' : 'Unlock ELEPHANT'}
            </PrimaryAction>
          )}
        </ActionRow>
        {notice && <Notice>{notice}</Notice>}
        {error && <Notice $error>{error}</Notice>}
      </ElephantCard>
    </ElephantPage>
  )
}
