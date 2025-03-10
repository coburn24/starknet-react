import fs from 'fs'

import { Mock } from 'moq.ts'
import { Account, SequencerProvider, CompiledContract, json } from 'starknet'
import { Connector } from '~/connectors'

const DEFAULT_DEVNET_URL = 'http://localhost:5050'
const DEVNET_URL = process.env.DEVNET_URL || DEFAULT_DEVNET_URL

export const DEVNET_ACCOUNTS = [
  {
    address: '0x7e00d496e324876bbc8531f2d9a82bf154d1a04a50218ee74cdd372f75a551a',
    secret: '0xe3e70682c2094cac629f6fbed82c07cd',
  },
  {
    address: '0x69b49c2cc8b16e80e86bfc5b0614a59aa8c9b601569c7b80dde04d3f3151b79',
    secret: '0xf728b4fa42485e3a0a5d2f346baa9455',
  },
  {
    address: '0x7447084f620ba316a42c72ca5b8eefb3fe9a05ca5fe6430c65a69ecc4349b3b',
    secret: '0xeb1167b367a9c3787c65c1e582e2e662',
  },
]

export const devnetProvider = new SequencerProvider({ baseUrl: DEVNET_URL })
const originalWaitForTransaction = devnetProvider.waitForTransaction.bind(devnetProvider)
devnetProvider.waitForTransaction = (txHash, options) => {
  return originalWaitForTransaction(txHash, options || { retryInterval: 1000 })
}

export const invalidProvider = new SequencerProvider({ baseUrl: 'http://localhost:100' })

export const deventAccounts = DEVNET_ACCOUNTS.map(
  ({ address, secret }) => new Account(devnetProvider, address, secret)
)

export function mockedConnector(setup: (mock: Mock<Connector>) => void): Connector {
  const mock = new Mock<Connector>()
  setup(mock)
  return mock.object()
}

export const connectors = deventAccounts.map((account, index) =>
  mockedConnector((mock) => {
    mock
      .setup((conn) => conn.connect())
      .returnsAsync(account)
      .setup((conn) => conn.available())
      .returns(index > 1)
      .setup((conn) => conn.account())
      .returnsAsync(account)
      .setup((conn) =>
        conn.initEventListener(() => {
          return
        })
      )
      .returns(Promise.resolve())
      .setup((conn) =>
        conn.removeEventListener(() => {
          return
        })
      )
      .returns(Promise.resolve())
  })
)

function compileContract(name: string): CompiledContract {
  return json.parse(fs.readFileSync(`${__dirname}/contracts/${name}.json`).toString('ascii'))
}

export const compiledErc20 = compileContract('erc20')
export const compiledDapp = compileContract('dapp')
export const compiledStarknetId = compileContract('starknetId')
export const compiledNaming = compileContract('naming')

export const erc20ClassHash = '0x02864c45bd4ba3e66d8f7855adcadf07205c88f43806ffca664f1f624765207e'
export const dappClassHash = '0x04367b26fbb92235e8d1137d19c080e6e650a6889ded726d00658411cc1046f5'
