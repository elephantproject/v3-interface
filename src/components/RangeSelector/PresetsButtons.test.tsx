import { fireEvent, screen } from '@testing-library/react'
import { render } from 'test-utils/render'

import PresetsButtons from './PresetsButtons'

describe('PresetsButtons', () => {
  it('sets the position to full range', () => {
    const onSetFullRange = jest.fn()
    render(<PresetsButtons fullRange={false} onSetCustomRange={jest.fn()} onSetFullRange={onSetFullRange} />)

    fireEvent.click(screen.getByRole('button', { name: 'Full range' }))

    expect(onSetFullRange).toHaveBeenCalledTimes(1)
  })

  it('sets the position to a custom range', () => {
    const onSetCustomRange = jest.fn()
    render(<PresetsButtons fullRange onSetCustomRange={onSetCustomRange} onSetFullRange={jest.fn()} />)

    fireEvent.click(screen.getByRole('button', { name: 'Custom range' }))

    expect(onSetCustomRange).toHaveBeenCalledTimes(1)
  })
})
