import { Trans } from '@lingui/macro'
import { ColumnCenter } from 'components/Column'
import Loader from 'components/Icons/LoadingSpinner'
import { format } from 'd3'
import { FeeAmount } from 'elephantswapv3-sdk'
import { Currency, Price, Token } from 'elephantswapv3-sdk-core'
import { useColor } from 'hooks/useColor'
import { saturate } from 'polished'
import React, { ReactNode, useCallback, useMemo, useState } from 'react'
import { BarChart2 } from 'react-feather'
import { batch } from 'react-redux'
import { Bound } from 'state/mint/v3/actions'
import styled, { useTheme } from 'styled-components/macro'

import { ThemedText } from '../../theme'
import { Chart } from './Chart'
import { useDensityChartData, usePoolPriceHistory } from './hooks'
import { PriceHistoryPeriod, ZoomLevels } from './types'

const ZOOM_LEVELS: Record<FeeAmount, ZoomLevels> = {
  [FeeAmount.LOWEST]: {
    initialMin: 0.999,
    initialMax: 1.001,
    min: 0.00001,
    max: 1.5,
  },
  [FeeAmount.LOW]: {
    initialMin: 0.999,
    initialMax: 1.001,
    min: 0.00001,
    max: 1.5,
  },
  [FeeAmount.MEDIUM]: {
    initialMin: 0.5,
    initialMax: 2,
    min: 0.00001,
    max: 20,
  },
  [FeeAmount.HIGH]: {
    initialMin: 0.5,
    initialMax: 2,
    min: 0.00001,
    max: 20,
  },
}

const ChartWrapper = styled.div`
  position: relative;
  justify-content: center;
  align-content: center;
  min-height: 360px;
`

const ChartSurface = styled.div`
  background: ${({ theme }) => theme.backgroundModule};
  border: 1px solid ${({ theme }) => theme.backgroundOutline};
  border-radius: 16px;
  min-height: 400px;
  overflow: hidden;
  padding: 16px;
  position: relative;
`

const FallbackCurve = styled.svg`
  height: 100%;
  inset: 0;
  opacity: 0.42;
  position: absolute;
  width: 100%;
`

const MissingDataCard = styled.div`
  align-items: center;
  background: ${({ theme }) => theme.backgroundSurface};
  border: 1px solid ${({ theme }) => theme.backgroundOutline};
  border-radius: 16px;
  display: grid;
  gap: 10px;
  grid-template-columns: auto 1fr;
  max-width: 290px;
  padding: 14px 16px;
  position: relative;
`

const PeriodControls = styled.div`
  display: flex;
  gap: 4px;
  margin-top: 12px;
`

const PeriodButton = styled.button<{ selected: boolean }>`
  background: ${({ selected, theme }) => (selected ? theme.backgroundInteractive : 'transparent')};
  border: 1px solid ${({ selected, theme }) => (selected ? theme.backgroundOutline : 'transparent')};
  border-radius: 8px;
  color: ${({ selected, theme }) => (selected ? theme.textPrimary : theme.textSecondary)};
  cursor: pointer;
  font-size: 12px;
  font-weight: 600;
  padding: 7px 10px;

  &:hover {
    color: ${({ theme }) => theme.textPrimary};
  }
`

const PERIODS: { label: string; value: PriceHistoryPeriod }[] = [
  { label: 'All time', value: 'ALL' },
  { label: '1Y', value: '1Y' },
  { label: '1M', value: '1M' },
  { label: '1D', value: '1D' },
]

function InfoBox({ message, loading = false }: { message?: ReactNode; loading?: boolean }) {
  return (
    <ColumnCenter style={{ height: 246, justifyContent: 'center', position: 'relative' }}>
      <FallbackCurve aria-hidden="true" preserveAspectRatio="none" viewBox="0 0 640 240">
        <path
          d="M0 150 C70 62 145 56 216 145 S355 232 424 145 S566 54 640 145"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
        />
        <path
          d="M62 220 H112 M180 220 H230 M298 220 H348 M416 220 H466 M534 220 H584"
          stroke="currentColor"
          strokeLinecap="round"
          strokeWidth="5"
        />
      </FallbackCurve>
      {loading ? (
        <Loader size="40px" />
      ) : (
        <MissingDataCard>
          <BarChart2 size={24} />
          <div>
            <ThemedText.DeprecatedLabel>
              <Trans>Missing chart data</Trans>
            </ThemedText.DeprecatedLabel>
            <ThemedText.DeprecatedBody color="textSecondary" fontSize={12} marginTop="4px">
              {message}
            </ThemedText.DeprecatedBody>
          </div>
        </MissingDataCard>
      )}
    </ColumnCenter>
  )
}

export default function LiquidityChartRangeInput({
  currencyA,
  currencyB,
  feeAmount,
  ticksAtLimit,
  price,
  priceLower,
  priceUpper,
  onLeftRangeInput,
  onRightRangeInput,
  interactive,
}: {
  currencyA?: Currency
  currencyB?: Currency
  feeAmount?: FeeAmount
  ticksAtLimit: { [bound in Bound]?: boolean | undefined }
  price?: number
  priceLower?: Price<Token, Token>
  priceUpper?: Price<Token, Token>
  onLeftRangeInput: (typedValue: string) => void
  onRightRangeInput: (typedValue: string) => void
  interactive: boolean
}) {
  const theme = useTheme()
  const [historyPeriod, setHistoryPeriod] = useState<PriceHistoryPeriod>('1M')

  const tokenAColor = useColor(currencyA?.wrapped)
  const tokenBColor = useColor(currencyB?.wrapped)

  const isSorted = currencyA && currencyB && currencyA?.wrapped.sortsBefore(currencyB?.wrapped)

  const { isLoading, error, formattedData } = useDensityChartData({
    currencyA,
    currencyB,
    feeAmount,
  })
  const { history, isLoading: historyLoading } = usePoolPriceHistory({
    currencyA,
    currencyB,
    feeAmount,
    period: historyPeriod,
  })

  const onBrushDomainChangeEnded = useCallback(
    (domain: [number, number], mode: string | undefined) => {
      let leftRangeValue = Number(domain[0])
      const rightRangeValue = Number(domain[1])

      if (leftRangeValue <= 0) {
        leftRangeValue = 1 / 10 ** 6
      }

      batch(() => {
        // simulate user input for auto-formatting and other validations
        if (
          (!ticksAtLimit[isSorted ? Bound.LOWER : Bound.UPPER] || mode === 'handle' || mode === 'reset') &&
          leftRangeValue > 0
        ) {
          onLeftRangeInput(leftRangeValue.toFixed(6))
        }

        if ((!ticksAtLimit[isSorted ? Bound.UPPER : Bound.LOWER] || mode === 'reset') && rightRangeValue > 0) {
          // todo: remove this check. Upper bound for large numbers
          // sometimes fails to parse to tick.
          if (rightRangeValue < 1e35) {
            onRightRangeInput(rightRangeValue.toFixed(6))
          }
        }
      })
    },
    [isSorted, onLeftRangeInput, onRightRangeInput, ticksAtLimit]
  )

  interactive = interactive && Boolean(formattedData?.length)

  const brushDomain: [number, number] | undefined = useMemo(() => {
    const leftPrice = isSorted ? priceLower : priceUpper?.invert()
    const rightPrice = isSorted ? priceUpper : priceLower?.invert()

    return leftPrice && rightPrice
      ? [parseFloat(leftPrice?.toSignificant(6)), parseFloat(rightPrice?.toSignificant(6))]
      : undefined
  }, [isSorted, priceLower, priceUpper])

  const brushLabelValue = useCallback(
    (d: 'w' | 'e', x: number) => {
      if (!price) return ''

      if (d === 'w' && ticksAtLimit[isSorted ? Bound.LOWER : Bound.UPPER]) return '0'
      if (d === 'e' && ticksAtLimit[isSorted ? Bound.UPPER : Bound.LOWER]) return '∞'

      const percent = (x < price ? -1 : 1) * ((Math.max(x, price) - Math.min(x, price)) / price) * 100

      return price ? `${format(Math.abs(percent) > 1 ? '.2~s' : '.2~f')(percent)}%` : ''
    },
    [isSorted, price, ticksAtLimit]
  )

  const isUninitialized = !currencyA || !currencyB || (formattedData === undefined && !isLoading)

  return (
    <ChartSurface>
      {isUninitialized ? (
        <InfoBox message={<Trans>Select a pair and fee tier to preview your position.</Trans>} />
      ) : isLoading ? (
        <InfoBox loading />
      ) : error ? (
        <InfoBox message={<Trans>Use the inputs below to set your range.</Trans>} />
      ) : !formattedData || formattedData.length === 0 || !price ? (
        <InfoBox message={<Trans>Use the inputs below to set your range.</Trans>} />
      ) : (
        <ChartWrapper>
          <Chart
            data={{ series: formattedData, current: price, history }}
            dimensions={{ width: 400, height: 340 }}
            margins={{ top: 10, right: 44, bottom: 10, left: 0 }}
            styles={{
              area: {
                selection: theme.accentAction,
              },
              brush: {
                handle: {
                  west: saturate(0.1, tokenAColor) ?? theme.accentFailure,
                  east: saturate(0.1, tokenBColor) ?? theme.accentAction,
                },
              },
            }}
            interactive={interactive}
            brushLabels={brushLabelValue}
            brushDomain={brushDomain}
            onBrushDomainChange={onBrushDomainChangeEnded}
            zoomLevels={ZOOM_LEVELS[feeAmount ?? FeeAmount.MEDIUM]}
            ticksAtLimit={ticksAtLimit}
          />
          <PeriodControls aria-label="Price history period">
            {PERIODS.map((period) => (
              <PeriodButton
                key={period.value}
                type="button"
                selected={historyPeriod === period.value}
                onClick={() => setHistoryPeriod(period.value)}
              >
                {period.label}
              </PeriodButton>
            ))}
            {historyLoading && <Loader size="18px" />}
          </PeriodControls>
        </ChartWrapper>
      )}
    </ChartSurface>
  )
}
