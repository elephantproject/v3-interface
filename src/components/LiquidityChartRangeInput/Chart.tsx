import { extent, max, min, scaleLinear, scaleTime, ZoomTransform } from 'd3'
import { MouseEvent, useEffect, useMemo, useRef, useState } from 'react'
import { Bound } from 'state/mint/v3/actions'
import styled, { useTheme } from 'styled-components/macro'

import { Area } from './Area'
import { AxisRight } from './AxisRight'
import { Line } from './Line'
import { PriceHistory } from './PriceHistory'
import { ChartEntry, LiquidityChartRangeInputProps } from './types'
import { VerticalBrush } from './VerticalBrush'
import Zoom from './Zoom'

const xAccessor = (d: ChartEntry) => d.activeLiquidity
const yAccessor = (d: ChartEntry) => d.price0

const HoverLine = styled.line`
  stroke: ${({ theme }) => theme.textSecondary};
  stroke-dasharray: 3 3;
  stroke-width: 1;
`

const HoverPoint = styled.circle`
  fill: ${({ theme }) => theme.backgroundSurface};
  stroke: ${({ theme }) => theme.textPrimary};
  stroke-width: 2;
`

export function Chart({
  id = 'liquidityChartRangeInput',
  data: { series, current, history },
  ticksAtLimit,
  styles,
  dimensions: { width, height },
  margins,
  interactive = true,
  brushDomain,
  onBrushDomainChange,
  zoomLevels,
}: LiquidityChartRangeInputProps) {
  const theme = useTheme()
  const zoomRef = useRef<SVGSVGElement | null>(null)

  const [zoom, setZoom] = useState<ZoomTransform | null>(null)
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)

  const [innerHeight, innerWidth] = useMemo(
    () => [height - margins.top - margins.bottom, width - margins.left - margins.right],
    [width, height, margins]
  )

  const { liquidityScale, timeScale, yScale } = useMemo(() => {
    const historicalMin = min(history, (point) => point.price)
    const historicalMax = max(history, (point) => point.price)
    const priceMin = Math.min(current * zoomLevels.initialMin, historicalMin ?? current)
    const priceMax = Math.max(current * zoomLevels.initialMax, historicalMax ?? current)
    const padding = Math.max((priceMax - priceMin) * 0.08, current * 0.0001)
    const timeDomain = extent(history, (point) => point.timestamp) as [Date | undefined, Date | undefined]
    const scales = {
      liquidityScale: scaleLinear()
        .domain([0, max(series, xAccessor)] as number[])
        .range([innerWidth, innerWidth * 0.76]),
      timeScale: scaleTime()
        .domain(
          timeDomain[0] && timeDomain[1]
            ? [timeDomain[0], timeDomain[1]]
            : [new Date(Date.now() - 86_400_000), new Date()]
        )
        .range([0, innerWidth]),
      yScale: scaleLinear()
        .domain([Math.max(0, priceMin - padding), priceMax + padding])
        .range([innerHeight, 0]),
    }

    if (zoom) {
      const newYScale = zoom.rescaleY(scales.yScale)
      scales.yScale.domain(newYScale.domain())
    }

    return scales
  }, [current, history, zoomLevels.initialMin, zoomLevels.initialMax, innerWidth, series, innerHeight, zoom])

  const hoveredPoint = hoveredIndex === null ? history[history.length - 1] : history[hoveredIndex]
  const firstPoint = history[0]
  const priceChange =
    hoveredPoint && firstPoint && firstPoint.price > 0
      ? ((hoveredPoint.price - firstPoint.price) / firstPoint.price) * 100
      : undefined
  const resetKey = `${history[0]?.timestamp.getTime() ?? 0}-${history[history.length - 1]?.timestamp.getTime() ?? 0}`

  const onMouseMove = (event: MouseEvent<SVGSVGElement>) => {
    if (!history.length) return
    const bounds = event.currentTarget.getBoundingClientRect()
    const x = ((event.clientX - bounds.left) / bounds.width) * width - margins.left
    const timestamp = timeScale.invert(Math.max(0, Math.min(innerWidth, x))).getTime()
    let closest = 0
    for (let index = 1; index < history.length; index++) {
      if (
        Math.abs(history[index].timestamp.getTime() - timestamp) <
        Math.abs(history[closest].timestamp.getTime() - timestamp)
      ) {
        closest = index
      }
    }
    setHoveredIndex(closest)
  }

  useEffect(() => {
    // reset zoom as necessary
    setZoom(null)
  }, [zoomLevels])

  useEffect(() => {
    if (!brushDomain) {
      onBrushDomainChange(yScale.domain() as [number, number], undefined)
    }
  }, [brushDomain, onBrushDomainChange, yScale])

  return (
    <>
      <Zoom
        svg={zoomRef.current}
        setZoom={setZoom}
        width={innerWidth}
        height={
          // allow zooming inside the x-axis
          height
        }
        resetBrush={() => {
          onBrushDomainChange(
            [current * zoomLevels.initialMin, current * zoomLevels.initialMax] as [number, number],
            'reset'
          )
        }}
        showResetButton={Boolean(ticksAtLimit[Bound.LOWER] || ticksAtLimit[Bound.UPPER])}
        zoomLevels={zoomLevels}
        resetKey={resetKey}
      />
      <div>
        <strong>
          {hoveredPoint
            ? `≈ ${hoveredPoint.price.toLocaleString(undefined, { maximumSignificantDigits: 7 })}`
            : 'Price history unavailable'}
        </strong>
        {priceChange !== undefined && (
          <span style={{ color: priceChange >= 0 ? theme.accentSuccess : theme.accentFailure, marginLeft: 8 }}>
            {priceChange >= 0 ? '+' : ''}
            {priceChange.toFixed(2)}%
          </span>
        )}
        {hoveredPoint && (
          <span style={{ color: theme.textSecondary, fontSize: 12, marginLeft: 8 }}>
            {hoveredPoint.timestamp.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
          </span>
        )}
      </div>
      <svg
        ref={zoomRef}
        width="100%"
        height="100%"
        viewBox={`0 0 ${width} ${height}`}
        style={{ overflow: 'visible' }}
        onMouseMove={onMouseMove}
        onMouseLeave={() => setHoveredIndex(null)}
      >
        <defs>
          <clipPath id={`${id}-chart-clip`}>
            <rect x="0" y="0" width={innerWidth} height={innerHeight} />
          </clipPath>

          {brushDomain && (
            // mask to highlight selected area
            <mask id={`${id}-chart-area-mask`}>
              <rect
                fill="white"
                x="0"
                y={yScale(brushDomain[1])}
                width={innerWidth}
                height={yScale(brushDomain[0]) - yScale(brushDomain[1])}
              />
            </mask>
          )}
        </defs>

        <g transform={`translate(${margins.left},${margins.top})`}>
          <g clipPath={`url(#${id}-chart-clip)`}>
            {history.length > 1 && (
              <PriceHistory points={history} xScale={timeScale} yScale={yScale} innerHeight={innerHeight} />
            )}
            <Area
              series={series}
              xScale={liquidityScale}
              yScale={yScale}
              xValue={xAccessor}
              yValue={yAccessor}
              vertical
            />

            {brushDomain && (
              // duplicate area chart with mask for selected area
              <g mask={`url(#${id}-chart-area-mask)`}>
                <Area
                  series={series}
                  xScale={liquidityScale}
                  yScale={yScale}
                  xValue={xAccessor}
                  yValue={yAccessor}
                  fill={styles.area.selection}
                  vertical
                />
              </g>
            )}

            <Line value={current} yScale={yScale} innerWidth={innerWidth} innerHeight={innerHeight} />

            <AxisRight yScale={yScale} innerWidth={innerWidth} />
            {hoveredPoint && (
              <g pointerEvents="none">
                <HoverLine
                  x1={timeScale(hoveredPoint.timestamp)}
                  y1="0"
                  x2={timeScale(hoveredPoint.timestamp)}
                  y2={innerHeight}
                />
                <HoverPoint cx={timeScale(hoveredPoint.timestamp)} cy={yScale(hoveredPoint.price)} r="4" />
              </g>
            )}
          </g>

          <VerticalBrush
            id={id}
            yScale={yScale}
            interactive={interactive}
            brushExtent={brushDomain ?? (yScale.domain() as [number, number])}
            innerWidth={innerWidth}
            innerHeight={innerHeight}
            setBrushExtent={onBrushDomainChange}
            lowerHandleColor={styles.brush.handle.west}
            upperHandleColor={styles.brush.handle.east}
          />
        </g>
      </svg>
    </>
  )
}
