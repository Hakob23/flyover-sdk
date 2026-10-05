import { describe, test, jest, expect, beforeEach } from '@jest/globals'
import { type BlockchainConnection, ethers, type FlyoverConfig } from '@rsksmart/bridges-core-sdk'
import { PegOutEscrowContract } from './pegoutEscrow'

jest.mock('ethers')

const { BigNumber } = jest.requireActual<typeof ethers>('ethers')

const connectionMock = jest.mocked({
  getChainHeight: async () => Promise.resolve(1),
  getAbstraction: function () { return this.signer },
  get signer () { return jest.mocked({}) }
} as BlockchainConnection)

const ESCROW_ADDRESS = '0x8901a2bbf639bfd21a97004ba4d7ae2bd00b8da8'
const REQUEST_HASH = '0x' + 'ab'.repeat(32)
const TX_HASH = '0x' + 'cd'.repeat(32)
const DESTINATION = new Uint8Array([1, 2, 3])
const REFUND_ADDRESS = '0x79568c2989232dCa1840087D73d403602364c0D4'
const VALUE = BigInt('5605000000000000')

const config: FlyoverConfig = {
  network: 'Regtest',
  captchaTokenResolver: async () => Promise.resolve(''),
  customPegOutEscrowAddress: ESCROW_ADDRESS
}

function receipt (events: unknown[]): unknown {
  return { transactionHash: TX_HASH, blockNumber: 1234, events }
}

describe('PegOutEscrowContract should', () => {
  let requestPegOut: jest.Mock<any>
  let getPegOutQuote: jest.Mock<any>
  let wait: jest.Mock<any>

  beforeEach(() => {
    wait = jest.fn<any>().mockResolvedValue(receipt([{ event: 'PegOutRequested', args: { requestHash: REQUEST_HASH } }]))
    requestPegOut = jest.fn<any>().mockResolvedValue({ hash: TX_HASH, wait })
    getPegOutQuote = jest.fn<any>().mockResolvedValue({ nonce: BigNumber.from(7) })
    jest.mocked(ethers.Contract).mockImplementation(() => ({ address: ESCROW_ADDRESS, requestPegOut, getPegOutQuote }) as any)
  })

  test('throw when neither a network default nor a custom address is available', () => {
    const noAddress: FlyoverConfig = { network: 'Mainnet', captchaTokenResolver: async () => Promise.resolve('') }
    expect(() => new PegOutEscrowContract(connectionMock, noAddress)).toThrow(/invalid PegOutEscrow address/)
  })

  test('use the custom address', async () => {
    const escrow = new PegOutEscrowContract(connectionMock, config)
    expect(ethers.Contract).toHaveBeenLastCalledWith(ESCROW_ADDRESS, expect.anything(), expect.anything())
    await expect(escrow.getAddress()).resolves.toBe(ESCROW_ADDRESS)
  })

  test('send one requestPegOut transaction with the value and return the id, hash and nonce', async () => {
    const result = await new PegOutEscrowContract(connectionMock, config).requestPegOut(DESTINATION, REFUND_ADDRESS, VALUE)

    expect(requestPegOut).toBeCalledTimes(1)
    expect(requestPegOut).toBeCalledWith(DESTINATION, REFUND_ADDRESS, { value: VALUE })
    expect(result).toEqual({ requestHash: REQUEST_HASH.slice(2), txHash: TX_HASH, nonce: BigInt(7) })
  })

  test('read the nonce at the block the request was mined in', async () => {
    await new PegOutEscrowContract(connectionMock, config).requestPegOut(DESTINATION, REFUND_ADDRESS, VALUE)
    expect(getPegOutQuote).toBeCalledWith(REQUEST_HASH, { blockTag: 1234 })
  })

  test('return no nonce when the request was claimed in the same block', async () => {
    getPegOutQuote.mockRejectedValue(new Error('QuoteNotFound'))
    const result = await new PegOutEscrowContract(connectionMock, config).requestPegOut(DESTINATION, REFUND_ADDRESS, VALUE)
    expect(result).toEqual({ requestHash: REQUEST_HASH.slice(2), txHash: TX_HASH, nonce: undefined })
  })

  test('throw a BridgeError when the transaction cannot be sent', async () => {
    requestPegOut.mockRejectedValue(new Error('cannot estimate gas'))
    await expect(new PegOutEscrowContract(connectionMock, config).requestPegOut(DESTINATION, REFUND_ADDRESS, VALUE))
      .rejects.toMatchObject({ message: 'error executing function requestPegOut', details: { error: 'cannot estimate gas' } })
  })

  test('throw an error carrying the transaction hash when the mined transaction reverted', async () => {
    wait.mockRejectedValue(new Error('transaction failed'))
    await expect(new PegOutEscrowContract(connectionMock, config).requestPegOut(DESTINATION, REFUND_ADDRESS, VALUE))
      .rejects.toMatchObject({ message: 'Peg-out request reverted', details: { txHash: TX_HASH, reason: 'transaction failed' } })
  })

  test('throw when the receipt has no PegOutRequested event', async () => {
    wait.mockResolvedValue(receipt([{ event: 'EscrowPegOutChangePaid', args: {} }]))
    await expect(new PegOutEscrowContract(connectionMock, config).requestPegOut(DESTINATION, REFUND_ADDRESS, VALUE))
      .rejects.toMatchObject({ details: `requestPegOut transaction ${TX_HASH} emitted no PegOutRequested event` })
  })
})
