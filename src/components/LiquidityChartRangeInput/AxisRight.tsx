import { Axis as D3Axis, axisRight, NumberValue, ScaleLinear, select } from 'd3'
import React, { useMemo } from 'react'
import styled from 'styled-components/macro'

const StyledGroup = styled.g`
  line {
    stroke: ${({ theme }) => theme.backgroundOutline};
    stroke-dasharray: 2 3;
  }

  text {
    color: ${({ theme }) => theme.textSecondary};
    font-size: 10px;
  }
`

const Axis = ({ axisGenerator }: { axisGenerator: D3Axis<NumberValue> }) => {
  const axisRef = (axis: SVGGElement) => {
    axis &&
      select(axis)
        .call(axisGenerator)
        .call((group) => group.select('.domain').remove())
  }

  return <g ref={axisRef} />
}

export function AxisRight({ yScale, innerWidth }: { yScale: ScaleLinear<number, number>; innerWidth: number }) {
  return useMemo(
    () => (
      <StyledGroup transform={`translate(${innerWidth}, 0)`}>
        <Axis axisGenerator={axisRight(yScale).ticks(7).tickSize(-innerWidth)} />
      </StyledGroup>
    ),
    [innerWidth, yScale]
  )
}
