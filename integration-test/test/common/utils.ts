import { type BitcoinDataSource, BitcoindRpcDataSource, Mempool } from '@rsksmart/flyover-sdk'

export const sleepSeconds = async (seconds: number): Promise<void> => new Promise(resolve => setTimeout(resolve, seconds * 1000))

/**
 * This fake token resolver can be used to mock the captcha token resolver function.
 * This assumes that the keys being used are the google test keys that allow any string
 * to be a valid token.
 *
 * @returns {Promise<string>} - A promise that resolves with a fake captcha token.
 */
export const fakeTokenResolver: () => Promise<string> = async () => Promise.resolve('a-captcha-token')

/**
 * Returns a BitcoinDataSource instance based on the network.
 *
 * @param network - The network to use (regtest, mainnet, testnet)
 * @returns A BitcoinDataSource instance.
 */
export function getBitcoinDataSource (network: string): BitcoinDataSource {
  const normalizedNetwork = network.toLowerCase()
  if (normalizedNetwork === 'regtest') {
    return new BitcoindRpcDataSource({
      rpcport: parseInt(process.env.TEST_BTC_RPC_PORT ?? '5555'),
      rpcuser: process.env.TEST_BTC_RPC_USER ?? 'test',
      rpcpassword: process.env.TEST_BTC_RPC_PASSWORD ?? 'test',
      rpcconnect: process.env.TEST_BTC_RPC_CONNECT ?? '127.0.0.1'
    })
  } else if (normalizedNetwork === 'mainnet' || normalizedNetwork === 'testnet') {
    return new Mempool(normalizedNetwork)
  } else {
    throw new Error('Invalid Bitcoin network')
  }
}
