import { assertTruthy, ethers, executeContractView } from '@rsksmart/bridges-core-sdk'

/** The PegOutEscrow functions, events and errors the tests use when calling the contract directly. */
export const PEGOUT_ESCROW_ABI = [
  'function requestPegOut(bytes destinationAddress, address refundAddress) payable returns (bytes32)',
  'function cancelPegOut(bytes32 requestHash)',
  'event PegOutCancelled(bytes32 indexed requestHash)',
  'error NotServiceable(uint256 amount, uint256 minAmount, uint256 maxAmount)',
  'error InvalidState(bytes32 requestHash, uint8 expected, uint8 actual)',
  // declared in the Flyover library, so it is not part of IPegOutEscrow
  'error InvalidSender(address expected, address actual)'
]

export const FLYOVER_CONFIGURATIONS_ABI = [
  'function getPegOutConfiguration() view returns (tuple(uint256 fixedFee, uint256 percentageFee, uint256 minAmount, uint256 maxAmount, tuple(uint256 maxAmount, uint256 confirmations)[] confirmationTiers, uint256 penaltyFee, uint256 claimWindow, uint256 claimWindowBlocks, uint256 callTime, uint256 expireTime, uint256 expireBlocks, uint256 maxMinerFee))'
]

/** The peg-out configuration fields the tests need to build values in and out of range. */
export interface PegOutLimits {
  fixedFee: bigint
  percentageFee: bigint
  maxMinerFee: bigint
  minAmount: bigint
  maxAmount: bigint
}

export async function readPegOutLimits (configurations: ethers.Contract): Promise<PegOutLimits> {
  const config = await executeContractView<Record<keyof PegOutLimits, ethers.BigNumber>>(configurations, 'getPegOutConfiguration')
  return {
    fixedFee: config.fixedFee.toBigInt(),
    percentageFee: config.percentageFee.toBigInt(),
    maxMinerFee: config.maxMinerFee.toBigInt(),
    minAmount: config.minAmount.toBigInt(),
    maxAmount: config.maxAmount.toBigInt()
  }
}

/** The RBTC an account paid in gas for a mined transaction. */
export async function gasCost (provider: ethers.providers.Provider, txHash: string): Promise<bigint> {
  const [tx, receipt] = await Promise.all([provider.getTransaction(txHash), provider.getTransactionReceipt(txHash)])
  const gasPrice = receipt.effectiveGasPrice ?? tx.gasPrice
  assertTruthy(gasPrice, `Missing gas price for ${txHash}`)
  return receipt.gasUsed.toBigInt() * gasPrice.toBigInt()
}

/** Calls a contract function without sending a transaction, so no gas is spent and no state changes. */
export async function staticCall (contract: ethers.Contract, method: string, ...args: unknown[]): Promise<unknown> {
  const fn = contract.callStatic[method]
  assertTruthy(fn, `Unknown function ${method}`)
  return fn(...args)
}

/** Name of the custom error the call reverts with, decoded with the contract's ABI. */
export async function revertErrorName (call: Promise<unknown>, contract: ethers.Contract): Promise<string> {
  try {
    await call
  } catch (error) {
    const data = findRevertData(error)
    assertTruthy(data, `The call failed without revert data: ${String(error)}`)
    return contract.interface.parseError(data).name
  }
  throw new Error('Expected the call to revert')
}

function findRevertData (error: unknown): string | undefined {
  // ethers v5 wraps the node's JSON-RPC error, and the revert data sits on one of the nested levels
  let current: unknown = error
  for (let depth = 0; depth < 4 && typeof current === 'object' && current !== null; depth++) {
    const { data, error: inner } = current as { data?: unknown, error?: unknown }
    if (typeof data === 'string' && data.startsWith('0x')) {
      return data
    }
    current = inner
  }
  return undefined
}
