import { BridgeError, type Connection, executeContractView, type FlyoverConfig, isRskAddress } from '@rsksmart/bridges-core-sdk'
import { type BigNumber, type BytesLike, Contract, type ContractReceipt, type ContractTransaction, type Signer } from 'ethers'
import abi from './pegout-escrow-abi'
import { FlyoverNetworks, type FlyoverSupportedNetworks } from '../constants/networks'
import { FlyoverError } from '../client/httpClient'

/** States of a commit-first peg-out in the PegOutEscrow, in the contract's enum order. */
export const PEGOUT_STATES = ['NONE', 'REQUESTED', 'CLAIMED', 'CANCELLED', 'FULFILLED', 'REFUNDED'] as const
export type PegoutState = typeof PEGOUT_STATES[number]

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
    const receipt = await this.send(
      'requestPegOut', [destinationAddress, refundAddress, { value }], FlyoverError.pegoutRequestReverted
    )
    const requestHash: string | undefined = receipt.events?.find(e => e.event === 'PegOutRequested')?.args?.requestHash
    if (requestHash === undefined) {
      throw FlyoverError.withReason(`requestPegOut transaction ${receipt.transactionHash} emitted no PegOutRequested event`)
    }
    return {
      requestHash: requestHash.startsWith('0x') ? requestHash.slice(2) : requestHash,
      txHash: receipt.transactionHash,
      nonce: await this.readNonce(requestHash, receipt.blockNumber)
    }
  }

  /**
   * Sends PegOutEscrow.cancelPegOut and waits for it to be mined.
   *
   * @param requestHash the id of the peg-out, with or without the 0x prefix
   * @returns the transaction hash
   *
   * @throws { BridgeError } When the transaction cannot be sent
   * @throws { FlyoverError } When the transaction is mined but reverts; the error carries its hash
   */
  async cancelPegOut (requestHash: string): Promise<string> {
    const receipt = await this.send('cancelPegOut', [with0x(requestHash)], FlyoverError.pegoutCancelReverted)
    return receipt.transactionHash
  }

  /**
   * Reads the escrow state of a peg-out id. An id the escrow never issued, or one it re-keyed when an LP
   * claimed it, reads NONE.
   */
  async getPegOutState (requestHash: string, blockTag: number): Promise<PegoutState> {
    const state = await executeContractView<number>(this.escrowContract, 'getPegOutState', with0x(requestHash), { blockTag })
    return PEGOUT_STATES[state] ?? 'NONE'
  }

  /** Reads the refund address of a stored peg-out. Reverts unless the id is REQUESTED or CLAIMED. */
  async getRefundAddress (requestHash: string, blockTag: number): Promise<string> {
    const quote = await executeContractView<{ rskRefundAddress: string }>(
      this.escrowContract, 'getPegOutQuote', with0x(requestHash), { blockTag }
    )
    return quote.rskRefundAddress
  }

  /** Address of the account that signs this contract's transactions. */
  async getSenderAddress (): Promise<string> {
    // ethers sets the signer to null when the contract is built on a read-only connection
    const signer: Signer | null = this.escrowContract.signer
    if (signer === null) {
      throw FlyoverError.withReason('a signing RSK connection is required to send PegOutEscrow transactions')
    }
    return signer.getAddress()
  }

  private async send (
    method: string,
    args: unknown[],
    onRevert: (args: { txHash: string, reason: string }) => FlyoverError
  ): Promise<ContractReceipt> {
    let tx: ContractTransaction
    try {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      tx = await this.escrowContract[method]!(...args)
    } catch (error) {
      throw new BridgeError({
        timestamp: Date.now(),
        recoverable: true,
        message: `error executing function ${method}`,
        details: { error: errorMessage(error) }
      })
    }
    try {
      return await tx.wait()
    } catch (error) {
      throw onRevert({ txHash: tx.hash, reason: errorMessage(error) })
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

function with0x (hash: string): string {
  return hash.startsWith('0x') ? hash : '0x' + hash
}
