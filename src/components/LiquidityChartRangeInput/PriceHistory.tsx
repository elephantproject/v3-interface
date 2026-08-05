import { axisBottom, curveMonotoneX, line, ScaleLinear, ScaleTime, select } from 'd3'
import { useMemo } from 'react'
import styled from 'styled-components/macro'

import { PriceHistoryPoint } from './types'

const HistoryPath = styled.path`
  fill: none;
  stroke: ${({ theme }) => theme.textPrimary};
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 2;
`

const StyledAxis = styled.g`
  line,
  .domain {
    display: none;
  }

  text {
    color: ${({ theme }) => theme.textSecondary};
    font-size: 10px;
  }
`

export function PriceHistory({
  points,
  xScale,
  yScale,
  innerHeight,
}: {
  points: PriceHistoryPoint[]
  xScale: ScaleTime<number, number>
  yScale: ScaleLinear<number, number>
  innerHeight: number
}) {
  const path = useMemo(
    () =>
      line<PriceHistoryPoint>()
        .curve(curveMonotoneX)
        .x((point) => xScale(point.timestamp))
        .y((point) => yScale(point.price))(points) ?? undefined,
    [points, xScale, yScale]
  )

  const axisRef = (axis: SVGGElement) => {
    axis && select(axis).call(axisBottom(xScale).ticks(5).tickSize(0).tickPadding(8))
  }

  return (
    <>
      <HistoryPath d={path} />
      <StyledAxis ref={axisRef} transform={`translate(0, ${innerHeight})`} />
    </>
  )
}
