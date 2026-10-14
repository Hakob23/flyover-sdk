# Flyover-SDK Integration tests
The Flyover integration test suite can be run by executing `npm run test:integration`

## Environment variables
To run the integration test suite, the following environment variables are required:
- **TEST_NETWORK**: network to use when creating FlyoverSDK instance.
- **TEST_MNEMONIC**: seed prhase for the test wallet that will be used to sign the pegout transaction
- **TEST_PROVIDER_ID**: id of the liquidity provider that will be used to run the integration test suite.
- **TEST_NODE_URL**: url of the RSK node that will be used.
- **TEST_RSK_ADDRESS**: RSK address to use as pegin destination address.
- **TEST_BTC_ADDRESS**: BTC address to use as pegout destination address.
- **TEST_PEGIN_AMOUNT**: amount of the test pegins.
- **TEST_PEGOUT_AMOUNT**: amount of the test pegouts.
- **TEST_MEMPOOL_SPACE_URL**: MempoolSpace API url. This is used to fetch some UTXO information during the tests.

The commit-first peg-out suites also need the `v3.0.0` contracts deployed on that node (`DeployFlyover` from liquidity-bridge-contract deploys and wires all of them):
- **TEST_FLYOVER_CONFIGURATIONS_ADDRESS**: address of the `FlyoverConfigurations` contract.
- **TEST_PEGOUT_ESCROW_ADDRESS**: address of the `PegOutEscrow` contract.
- **TEST_PEGOUT_CONTRACT_ADDRESS**: address of the `PegOutContract`, needed by the happy path when it differs from the network default.
- **TEST_LPS_URL**: base url of the liquidity provider that claims the peg-out in the happy path.
- **TEST_PEGOUT_CLAIM_TIMEOUT_SECONDS** (optional): how long to wait for a liquidity provider to claim a peg-out. The cases that need a claim are skipped when it is unset.

The happy path also mines regtest BTC blocks through the node set by **TEST_BTC_RPC_CONNECT**, **TEST_BTC_RPC_PORT**, **TEST_BTC_RPC_USER** and **TEST_BTC_RPC_PASSWORD**, so it only runs on regtest.
