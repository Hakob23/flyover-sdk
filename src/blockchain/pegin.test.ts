import { describe, test, jest, expect } from '@jest/globals'
import { BlockchainConnection, ethers, FlyoverConfig } from '@rsksmart/bridges-core-sdk'
import { PegInContract } from './pegin'
import JSONbig from 'json-bigint'

jest.mock('ethers')

const serializer = JSONbig({ useNativeBigInt: true })
const signerMock = jest.mocked({})
const connectionMock = jest.mocked({
  getChainHeight: async () => Promise.resolve(1),
  getAbstraction: function () { return this.signer },
  get signer () {
    return signerMock
  }
} as BlockchainConnection)

describe('PegInContract class should', () => {
  test('initialize correctly', () => {
    const config: FlyoverConfig = { network: 'Regtest', captchaTokenResolver: async () => Promise.resolve('') }
    const lbc = new PegInContract(connectionMock, config)
    expect(ethers.Contract).toBeCalled()
    expect(lbc).toHaveProperty('peginContract', expect.anything())
  })

  describe('getEip712Domain function should', () => {
    const contractMock = {
      eip712Domain: jest.fn()
        .mockImplementation(async () => Promise.resolve(['', 'Flyover PegIn', '1', 1234, '0x1234567890abcdef1234567890abcdef12345678'])),
    }
    const contractClassMock = jest.mocked(ethers.Contract)
    contractClassMock.mockImplementation(() => contractMock as any)
    const config: FlyoverConfig = { network: 'Regtest', captchaTokenResolver: async () => Promise.resolve('') }
    const lbc = new PegInContract(connectionMock, config)

    test('return correct domain', async () => {
      const domain = await lbc.getEip712Domain()
      expect(serializer.stringify(domain)).toEqual(serializer.stringify({
        name: 'Flyover PegIn',
        version: '1',
        chainId: 1234,
        verifyingContract: '0x1234567890abcdef1234567890abcdef12345678'
      }))
    })
  })
})
