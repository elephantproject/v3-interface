import { CurrencyAmount, Token } from 'elephantswapv3-sdk-core'

import { formatCurrencyBalance } from './formatCurrencyAmount'

const ELEPHANT = new Token(1666600000, '0xC30a7F9c216B945Ff8ACFB389e955A637eB0f478', 18, 'ELEPHANT')
const OTHER = new Token(1666600000, '0x0000000000000000000000000000000000000001', 18, 'OTHER')

describe('formatCurrencyBalance', () => {
  it('shows ELEPHANT balances with exactly two decimal places', () => {
    const balance = CurrencyAmount.fromRawAmount(ELEPHANT, '123456789012345678901')

    expect(formatCurrencyBalance(balance)).toBe('123.45')
  })

  it('uses the same two-decimal formatting for other currencies', () => {
    const balance = CurrencyAmount.fromRawAmount(OTHER, '123456789012345678901')

    expect(formatCurrencyBalance(balance)).toBe('123.45')
  })

  it('keeps trailing zeroes', () => {
    const balance = CurrencyAmount.fromRawAmount(OTHER, '1000000000000000000')

    expect(formatCurrencyBalance(balance)).toBe('1.00')
  })
})
