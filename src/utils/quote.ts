import { assertTruthy } from '@rsksmart/bridges-core-sdk'
import { type PegoutQuote } from '../api'

export function getQuoteTotal (quote: PegoutQuote): bigint {
  assertTruthy(quote, 'empty quote')
  const detail = quote.quote
  assertTruthy(detail, 'empty quote detail')
  return BigInt(detail.callFee ?? 0) + BigInt(detail.gasFee ?? 0) + BigInt(detail.value ?? 0)
}

export function satsToWei (sats: bigint): bigint {
  if (sats < 0) {
    throw new Error('Negative sats value')
  }
  return sats * (BigInt(10) ** BigInt(10))
}
