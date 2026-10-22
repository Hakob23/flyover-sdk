import { Connection, FlyoverConfig, isRskAddress } from "@rsksmart/bridges-core-sdk"
import { Contract } from "ethers"
import abi from './pegin-abi'
import { FlyoverNetworks, FlyoverSupportedNetworks } from "../constants/networks"
import { getEip712Domain } from "./lbc"

export class PegInContract {
  private readonly peginContract: Contract

  constructor (rskConnection: Connection, config: FlyoverConfig) {
    const address = FlyoverNetworks[config.network as FlyoverSupportedNetworks]?.pegInContractAddress
    if (address === undefined || !isRskAddress(address)) {
      throw new Error('invalid address')
    }
    const peginContract = new Contract(address, abi, rskConnection.getAbstraction())
    this.peginContract = peginContract
  }

  async getAddress (): Promise<string> {
    return this.peginContract.address
  }

  async getEip712Domain (): Promise<{ name: string, version: string, chainId: bigint, verifyingContract: string }> {
    return getEip712Domain(this.peginContract)
  }
}
