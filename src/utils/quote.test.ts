import { describe, test, expect } from '@jest/globals'
import { getQuoteTotal, satsToWei } from './quote'
import { type PegoutQuote } from '../api'

    const pegoutQuote: PegoutQuote = {
      quote: {
        lbcAddress: 'an address',
        liquidityProviderRskAddress: 'an address',
        btcRefundAddress: 'an address',
        rskRefundAddress: 'an address',
        lpBtcAddr: 'an address',
        callFee: BigInt('8000000000000000000'),
        penaltyFee: BigInt(10),
        nonce: BigInt(9),
        depositAddr: 'an address',
        gasFee: BigInt('1500000000000000000'),
        value: BigInt('3000000000000000000'),
        agreementTimestamp: 7,
        depositDateLimit: 6,
        depositConfirmations: 5,
        transferConfirmations: 4,
        transferTime: 3,
        expireDate: 2,
        expireBlocks: 1,
        chainId: 31,
      },
      quoteHash: 'a hash'
    }

describe('getQuoteTotal function should', () => {
  test('fail if quote is empty', () => {
    expect(() => { getQuoteTotal(null as any) }).toThrow('empty quote')
    expect(() => { getQuoteTotal(undefined as any) }).toThrow('empty quote')
  })
  test('fail if quote detail is empty', () => {
    expect(() => { getQuoteTotal({} as PegoutQuote) }).toThrow('empty quote detail')
  })
  test('sum properly quote value', () => {
    expect(getQuoteTotal(pegoutQuote)).toBe(BigInt('12500000000000000000'))
  })
  test('replace missing values with 0', () => {
    const quotes: any[] = [
      { quote: { callFee: 5 } },
      { quote: { value: 5 } },
      { quote: { gasFee: 5 } },
    ]
    quotes.forEach(quote => { expect(getQuoteTotal(quote)).toBe(BigInt(5)) })
  })
})

describe('satsToWei function should', () => {
  test('convert sats to wei', () => {
    const cases: [string, string][] = [
      ['0', '0'],
      ['1', '10000000000'],
      ['100000000', '1000000000000000000'],
      ['10000000', '100000000000000000'],
      ['1000000', '10000000000000000'],
      ['2100000000000000', '21000000000000000000000000'],
      ['9223372036854775807', '92233720368547758070000000000']
    ]
    for (const [sats, wei] of cases) {
      expect(satsToWei(BigInt(sats))).toBe(BigInt(wei))
    }
  })
  test('fail if sats is negative', () => {
    expect(() => { satsToWei(BigInt(-1)) }).toThrow('Negative sats value')
  })
})
