import { DEFAULT_LOCALE, SupportedLocale } from 'constants/locales'
import { Currency, CurrencyAmount, Fraction } from 'elephantswapv3-sdk-core'
import JSBI from 'jsbi'
import formatLocaleNumber from 'lib/utils/formatLocaleNumber'

export function formatCurrencyAmount(
  amount: CurrencyAmount<Currency> | undefined,
  sigFigs: number,
  locale: SupportedLocale = DEFAULT_LOCALE,
  fixedDecimals?: number
): string {
  if (!amount) {
    return '-'
  }

  if (JSBI.equal(amount.quotient, JSBI.BigInt(0))) {
    return '0'
  }

  if (amount.divide(amount.decimalScale).lessThan(new Fraction(1, 100000))) {
    return `<${formatLocaleNumber({ number: 0.00001, locale })}`
  }

  return formatLocaleNumber({ number: amount, locale, sigFigs, fixedDecimals })
}

/** Formats wallet balances consistently without converting through a JavaScript number. */
export function formatCurrencyBalance(amount: CurrencyAmount<Currency>): string {
  const supportedDecimals = Math.min(2, amount.currency.decimals)
  const value = amount.toFixed(supportedDecimals)

  if (supportedDecimals === 2) return value
  const [whole, fraction = ''] = value.split('.')
  return `${whole}.${fraction.padEnd(2, '0')}`
}
