import { ButtonGray } from 'components/Button'
import { select, zoom, ZoomBehavior, zoomIdentity, ZoomTransform } from 'd3'
import React, { useEffect, useMemo, useRef } from 'react'
import { RefreshCcw, ZoomIn, ZoomOut } from 'react-feather'
import styled from 'styled-components/macro'

import { ZoomLevels } from './types'

const Wrapper = styled.div<{ count: number }>`
  display: grid;
  grid-template-columns: repeat(${({ count }) => count.toString()}, 1fr);
  grid-gap: 6px;

  position: absolute;
  bottom: 8px;
  right: 0;
  z-index: 2;
`

const Button = styled(ButtonGray)`
  &:hover {
    background-color: ${({ theme }) => theme.backgroundInteractive};
    color: ${({ theme }) => theme.textPrimary};
  }

  width: 32px;
  height: 32px;
  padding: 4px;
`

export default function Zoom({
  svg,
  setZoom,
  width,
  height,
  resetBrush,
  showResetButton,
  zoomLevels,
  resetKey,
}: {
  svg: SVGElement | null
  setZoom: (transform: ZoomTransform) => void
  width: number
  height: number
  resetBrush: () => void
  showResetButton: boolean
  zoomLevels: ZoomLevels
  resetKey: string
}) {
  const zoomBehavior = useRef<ZoomBehavior<Element, unknown>>()

  const [zoomIn, zoomOut, zoomInitial, zoomReset] = useMemo(
    () => [
      () =>
        svg &&
        zoomBehavior.current &&
        select(svg as Element)
          .transition()
          .call(zoomBehavior.current.scaleBy, 1.5),
      () =>
        svg &&
        zoomBehavior.current &&
        select(svg as Element)
          .transition()
          .call(zoomBehavior.current.scaleBy, 1 / 1.5),
      () => svg && zoomBehavior.current && select(svg as Element).call(zoomBehavior.current.transform, zoomIdentity),
      () => svg && zoomBehavior.current && select(svg as Element).call(zoomBehavior.current.transform, zoomIdentity),
    ],
    [svg]
  )

  useEffect(() => {
    if (!svg) return

    zoomBehavior.current = zoom()
      .scaleExtent([0.25, Math.max(20, zoomLevels.max)])
      .extent([
        [0, 0],
        [width, height],
      ])
      // Navigation is wheel-only. Disabling D3 drag prevents the chart from
      // retaining pointer ownership after the mouse button is released.
      .filter(() => false)
      .on('zoom', ({ transform }: { transform: ZoomTransform }) => setZoom(transform))

    const selection = select(svg as Element).call(zoomBehavior.current)
    const wheel = (event: WheelEvent) => {
      if (!zoomBehavior.current) return
      event.preventDefault()
      if (event.ctrlKey) {
        const factor = Math.exp(-event.deltaY * 0.002)
        selection.call(zoomBehavior.current.scaleBy, factor, [event.offsetX, event.offsetY])
      } else {
        const transform = select(svg as Element).property('__zoom') as ZoomTransform
        selection.call(zoomBehavior.current.translateBy, 0, -event.deltaY / (transform?.k ?? 1))
      }
    }
    svg.addEventListener('wheel', wheel, { passive: false })
    return () => svg.removeEventListener('wheel', wheel)
  }, [height, width, setZoom, svg, zoomBehavior, zoomLevels.max])

  useEffect(() => {
    // reset zoom to initial on zoomLevel change
    zoomInitial()
  }, [resetKey, zoomInitial, zoomLevels])

  return (
    <Wrapper count={showResetButton ? 3 : 2}>
      {showResetButton && (
        <Button
          onClick={() => {
            resetBrush()
            zoomReset()
          }}
          disabled={false}
        >
          <RefreshCcw size={16} />
        </Button>
      )}
      <Button onClick={zoomIn} disabled={false}>
        <ZoomIn size={16} />
      </Button>
      <Button onClick={zoomOut} disabled={false}>
        <ZoomOut size={16} />
      </Button>
    </Wrapper>
  )
}
