import { BridgeError, type Connection, executeContractView, type FlyoverConfig, isRskAddress } from '@rsksmart/bridges-core-sdk'
import { type BigNumber, type BytesLike, Contract, type ContractReceipt, type ContractTransaction } from 'ethers'
import abi from './pegout-escrow-abi'
import { FlyoverNetworks, type FlyoverSupportedNetworks } from '../constants/networks'
import { FlyoverError } from '../client/httpClient'

/** A commit-first peg-out request mined on the PegOutEscrow. */
export interface PegoutRequest {
  /** Id of the peg-out until an LP claims it, without the 0x prefix */
  requestHash: string
  /** Hash of the requestPegOut transaction */
  txHash: string
  /**
   * Escrow nonce of the request, which keeps tracking it after an LP claims it. Undefined only when
   * an LP claimed the request in the same block it was mined in.
   */
  nonce?: bigint
}

/** Wrapper around the on-chain PegOutEscrow contract, which holds commit-first peg-out requests. */
export class PegOutEscrowContract {
  private readonly escrowContract: Contract

  constructor (rskConnection: Connection, config: FlyoverConfig) {
    const address = config.customPegOutEscrowAddress ??
      FlyoverNetworks[config.network as FlyoverSupportedNetworks]?.pegOutEscrowAddress
    if (address === undefined || !isRskAddress(address)) {
      throw new Error('invalid PegOutEscrow address. Provide customPegOutEscrowAddress in the Flyover config for this network')
    }
    this.escrowContract = new Contract(address, abi, rskConnection.getAbstraction())
  }

  async getAddress (): Promise<string> {
    return this.escrowContract.address
  }

  /**
   * Sends PegOutEscrow.requestPegOut with the given value and waits for it to be mined.
   *
   * @param destinationAddress the decoded BTC destination address
   * @param refundAddress the RSK address that can cancel the request and receives every refund
   * @param value the RBTC to escrow, in wei
   *
   * @throws { BridgeError } When the transaction cannot be sent
   * @throws { FlyoverError } When the transaction is mined but reverts; the error carries its hash
   */
  async requestPegOut (destinationAddress: BytesLike, refundAddress: string, value: bigint): Promise<PegoutRequest> {
    let tx: ContractTransaction
    try {
      tx = await this.escrowContract.requestPegOut(destinationAddress, refundAddress, { value })
    } catch (error) {
      throw new BridgeError({
        timestamp: Date.now(),
        recoverable: true,
        message: 'error executing function requestPegOut',
        details: { error: errorMessage(error) }
      })
    }

    let receipt: ContractReceipt
    try {
      receipt = await tx.wait()
    } catch (error) {
      throw FlyoverError.pegoutRequestReverted({ txHash: tx.hash, reason: errorMessage(error) })
    }

    const requestHash: string | undefined = receipt.events?.find(e => e.event === 'PegOutRequested')?.args?.requestHash
    if (requestHash === undefined) {
      throw FlyoverError.withReason(`requestPegOut transaction ${tx.hash} emitted no PegOutRequested event`)
    }
    return {
      requestHash: requestHash.startsWith('0x') ? requestHash.slice(2) : requestHash,
      txHash: receipt.transactionHash,
      nonce: await this.readNonce(requestHash, receipt.blockNumber)
    }
  }

  private async readNonce (requestHash: string, blockTag: number): Promise<bigint | undefined> {
    try {
      const quote = await executeContractView<{ nonce: BigNumber }>(
        this.escrowContract, 'getPegOutQuote', requestHash, { blockTag }
      )
      return BigInt(quote.nonce.toString())
    } catch {
      // an LP claimed the request in the same block, so the request id no longer resolves there
      return undefined
    }
  }
}

function errorMessage (error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}
