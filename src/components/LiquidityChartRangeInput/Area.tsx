import { area, curveStepAfter, ScaleLinear } from 'd3'
import React, { useMemo } from 'react'
import styled from 'styled-components/macro'

import { ChartEntry } from './types'

const Path = styled.path<{ fill?: string }>`
  opacity: 0.5;
  stroke: ${({ fill, theme }) => fill ?? theme.accentAction};
  fill: ${({ fill, theme }) => fill ?? theme.accentAction};
`

export const Area = ({
  series,
  xScale,
  yScale,
  xValue,
  yValue,
  fill,
  vertical = false,
}: {
  series: ChartEntry[]
  xScale: ScaleLinear<number, number>
  yScale: ScaleLinear<number, number>
  xValue: (d: ChartEntry) => number
  yValue: (d: ChartEntry) => number
  fill?: string
  vertical?: boolean
}) =>
  useMemo(
    () => (
      <Path
        fill={fill}
        d={
          (vertical
            ? area<ChartEntry>()
                .curve(curveStepAfter)
                .y((d) => yScale(yValue(d)))
                .x0(xScale(0))
                .x1((d) => xScale(xValue(d)))(series)
            : area<ChartEntry>()
                .curve(curveStepAfter)
                .x((d) => xScale(xValue(d)))
                .y1((d) => yScale(yValue(d)))
                .y0(yScale(0))(series)) ?? undefined
        }
      />
    ),
    [fill, series, vertical, xScale, xValue, yScale, yValue]
  )
