import { ScaleLinear } from 'd3'
import React, { useMemo } from 'react'
import styled from 'styled-components/macro'

const StyledLine = styled.line`
  opacity: 0.5;
  stroke-width: 2;
  stroke: ${({ theme }) => theme.textPrimary};
  fill: none;
`

export const Line = ({
  value,
  xScale,
  yScale,
  innerWidth,
  innerHeight,
}: {
  value: number
  xScale?: ScaleLinear<number, number>
  yScale?: ScaleLinear<number, number>
  innerWidth?: number
  innerHeight: number
}) =>
  useMemo(
    () =>
      yScale && innerWidth ? (
        <StyledLine x1="0" y1={yScale(value)} x2={innerWidth} y2={yScale(value)} />
      ) : xScale ? (
        <StyledLine x1={xScale(value)} y1="0" x2={xScale(value)} y2={innerHeight} />
      ) : null,
    [innerHeight, innerWidth, value, xScale, yScale]
  )
