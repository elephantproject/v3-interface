import { Trans } from '@lingui/macro'
import styled from 'styled-components/macro'
import { ThemedText } from 'theme'

const RangeModeWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
`

const SegmentedControl = styled.div`
  background: ${({ theme }) => theme.backgroundSurface};
  border: 1px solid ${({ theme }) => theme.backgroundOutline};
  border-radius: 999px;
  display: grid;
  grid-template-columns: 1fr 1fr;
  padding: 3px;
  width: 100%;
`

const RangeModeButton = styled.button<{ active: boolean }>`
  appearance: none;
  background: ${({ active, theme }) => (active ? theme.backgroundInteractive : 'transparent')};
  border: 0;
  border-radius: 999px;
  color: ${({ theme }) => theme.textPrimary};
  cursor: pointer;
  font-size: 14px;
  font-weight: ${({ active }) => (active ? 600 : 500)};
  padding: 10px 16px;
  transition: background-color 125ms ease;

  &:hover {
    background: ${({ theme }) => theme.backgroundInteractive};
  }
`

interface PresetsButtonsProps {
  fullRange: boolean
  onSetCustomRange: () => void
  onSetFullRange: () => void
}

export default function PresetsButtons({ fullRange, onSetCustomRange, onSetFullRange }: PresetsButtonsProps) {
  return (
    <RangeModeWrapper>
      <ThemedText.DeprecatedLabel>
        <Trans>Set price range</Trans>
      </ThemedText.DeprecatedLabel>
      <SegmentedControl>
        <RangeModeButton active={fullRange} aria-pressed={fullRange} onClick={onSetFullRange} type="button">
          <Trans>Full range</Trans>
        </RangeModeButton>
        <RangeModeButton active={!fullRange} aria-pressed={!fullRange} onClick={onSetCustomRange} type="button">
          <Trans>Custom range</Trans>
        </RangeModeButton>
      </SegmentedControl>
      <ThemedText.DeprecatedBody color="textSecondary" fontSize={13} lineHeight="18px">
        {fullRange ? (
          <Trans>
            Providing full range liquidity ensures continuous market participation across all possible prices, offering
            simplicity but with potential for higher impermanent loss.
          </Trans>
        ) : (
          <Trans>
            Custom range allows you to concentrate your liquidity within specific price bounds, enhancing capital
            efficiency and fee earnings but requiring more active management.
          </Trans>
        )}
      </ThemedText.DeprecatedBody>
    </RangeModeWrapper>
  )
}
