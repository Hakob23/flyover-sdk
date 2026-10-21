import { assertTruthy } from '@rsksmart/bridges-core-sdk'
import { type FlyoverNetworks } from '@rsksmart/flyover-sdk'

export interface IntegrationTestConfig {
  network: keyof typeof FlyoverNetworks
  testMnemonic: string
  providerId: number
  nodeUrl: string
  rskAddress: string
  btcAddress: string
  pegoutAmount: bigint
  mempoolSpaceUrl: string
  flyoverConfigurationsAddress?: string
  pegOutEscrowAddress?: string
  pegoutClaimTimeoutSeconds?: number
}

function getConfig (): IntegrationTestConfig {
  const {
    TEST_NETWORK: network,
    TEST_MNEMONIC: mnemonic,
    TEST_PROVIDER_ID: providerId,
    TEST_NODE_URL: nodeUrl,
    TEST_RSK_ADDRESS: rskAddress,
    TEST_BTC_ADDRESS: btcAddress,
    TEST_PEGOUT_AMOUNT: pegoutAmount,
    TEST_MEMPOOL_SPACE_URL: mempoolSpaceUrl,
    TEST_FLYOVER_CONFIGURATIONS_ADDRESS: flyoverConfigurationsAddress,
    TEST_PEGOUT_ESCROW_ADDRESS: pegOutEscrowAddress,
    TEST_PEGOUT_CLAIM_TIMEOUT_SECONDS: pegoutClaimTimeoutSeconds
  } = process.env
  assertTruthy(mnemonic, 'Missing test configuration: TEST_MNEMONIC')
  assertTruthy(providerId, 'Missing test configuration: TEST_PROVIDER_ID')
  assertTruthy(nodeUrl, 'Missing test configuration: TEST_NODE_URL')
  assertTruthy(rskAddress, 'Missing test configuration: TEST_RSK_ADDRESS')
  assertTruthy(btcAddress, 'Missing test configuration: TEST_BTC_ADDRESS')
  assertTruthy(pegoutAmount, 'Missing test configuration: TEST_PEGOUT_AMOUNT')
  assertTruthy(mempoolSpaceUrl, 'Missing test configuration: TEST_MEMPOOL_SPACE_URL')
  assertTruthy(network, 'Missing test configuration: TEST_NETWORK')
  return {
    network: network as keyof typeof FlyoverNetworks,
    testMnemonic: mnemonic,
    providerId: Number(providerId),
    pegoutAmount: BigInt(pegoutAmount),
    nodeUrl,
    rskAddress,
    btcAddress,
    mempoolSpaceUrl,
    flyoverConfigurationsAddress,
    pegOutEscrowAddress,
    pegoutClaimTimeoutSeconds: pegoutClaimTimeoutSeconds ? Number(pegoutClaimTimeoutSeconds) : undefined
  }
}

export const integrationTestConfig = getConfig()
