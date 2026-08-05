import { BrushBehavior, brushY, D3BrushEvent, ScaleLinear, select } from 'd3'
import usePrevious from 'hooks/usePrevious'
import { useCallback, useEffect, useRef, useState } from 'react'
import styled from 'styled-components/macro'

const Handle = styled.circle<{ color: string }>`
  fill: ${({ theme }) => theme.backgroundSurface};
  stroke: ${({ color }) => color};
  stroke-width: 3;
  pointer-events: none;
`

const BRUSH_MARGIN = 2

const toPixels = (extent: [number, number], yScale: ScaleLinear<number, number>): [number, number] => [
  yScale(extent[1]),
  yScale(extent[0]),
]

const compare = (first: [number, number], second: [number, number], yScale: ScaleLinear<number, number>): boolean =>
  toPixels(first, yScale).every((value, index) => value.toFixed(1) === toPixels(second, yScale)[index].toFixed(1))

export function VerticalBrush({
  id,
  yScale,
  interactive,
  brushExtent,
  setBrushExtent,
  innerWidth,
  innerHeight,
  lowerHandleColor,
  upperHandleColor,
}: {
  id: string
  yScale: ScaleLinear<number, number>
  interactive: boolean
  brushExtent: [number, number]
  setBrushExtent: (extent: [number, number], mode: string | undefined) => void
  innerWidth: number
  innerHeight: number
  lowerHandleColor: string
  upperHandleColor: string
}) {
  const brushRef = useRef<SVGGElement | null>(null)
  const behavior = useRef<BrushBehavior<SVGGElement> | null>(null)
  const [localExtent, setLocalExtent] = useState(brushExtent)
  const previousExtent = usePrevious(brushExtent)

  const brushed = useCallback(
    (event: D3BrushEvent<unknown>) => {
      if (!event.selection) return
      const [top, bottom] = event.selection as [number, number]
      const extent: [number, number] = [yScale.invert(bottom), yScale.invert(top)]
      setLocalExtent(extent)

      if (event.type === 'end' && !compare(brushExtent, extent, yScale)) {
        setBrushExtent(extent, event.mode)
      }
    },
    [brushExtent, setBrushExtent, yScale]
  )

  useEffect(() => setLocalExtent(brushExtent), [brushExtent])

  useEffect(() => {
    if (!brushRef.current) return

    behavior.current = brushY<SVGGElement>()
      .extent([
        [0, BRUSH_MARGIN],
        [innerWidth, innerHeight - BRUSH_MARGIN],
      ])
      .handleSize(28)
      .filter(() => interactive)
      .on('brush end', brushed)

    const group = select(brushRef.current)
    group.call(behavior.current as any)
    group
      .selectAll('.selection')
      .attr('stroke', 'none')
      .attr('fill', `url(#${id}-vertical-selection)`)
      .attr('fill-opacity', 0.16)
    group.selectAll('.handle').attr('fill', 'transparent').attr('stroke', 'transparent')

    if (previousExtent && compare(brushExtent, previousExtent, yScale)) {
      group.call(behavior.current.move as any, toPixels(brushExtent, yScale))
    }
  }, [brushExtent, brushed, id, innerHeight, innerWidth, interactive, previousExtent, yScale])

  useEffect(() => {
    if (brushRef.current && behavior.current) {
      behavior.current.move(select(brushRef.current) as any, toPixels(brushExtent, yScale) as any)
    }
  }, [brushExtent, yScale])

  const [top, bottom] = toPixels(localExtent, yScale)

  return (
    <>
      <defs>
        <linearGradient id={`${id}-vertical-selection`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop stopColor={upperHandleColor} />
          <stop stopColor={lowerHandleColor} offset="1" />
        </linearGradient>
      </defs>
      <g ref={brushRef} />
      {top >= 0 && top <= innerHeight && <Handle cx={innerWidth - 7} cy={top} r={7} color={upperHandleColor} />}
      {bottom >= 0 && bottom <= innerHeight && (
        <Handle cx={innerWidth - 7} cy={bottom} r={7} color={lowerHandleColor} />
      )}
    </>
  )
}
