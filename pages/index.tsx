import type { NextPage } from 'next'
import Head from 'next/head'

import WalletConnectProvider from '@walletconnect/web3-provider'
import Web3Modal from 'web3modal'
import { providers } from 'ethers'
import { useCallback, useEffect, useReducer } from 'react'


function ellipseAddress(address = '', width = 10): string {
  if (!address) {
    return ''
  }
  return `${address.slice(0, width)}...${address.slice(-width)}`
}

const providerOptions = {
  walletconnect: {
    package: WalletConnectProvider, // required
    options: {
      rpc: {
        1: "https://eth-archival.gateway.pokt.network/v1/lb/62b65b7e123e6f0039835fcd",
        3: "https://eth-ropsten.gateway.pokt.network/v1/lb/62b64f94123e6f0039834d46",
      },
    },
  },
}


let web3Modal: Web3Modal | undefined
if (typeof window !== 'undefined') {
  web3Modal = new Web3Modal({
    network: 'ropsten', // optional
    cacheProvider: true,
    providerOptions, // required
  })
}

type StateType = {
  provider?: any
  web3Provider?: any
  address?: string
  chainId?: number
}

type ActionType =
  | {
      type: 'SET_WEB3_PROVIDER'
      provider?: StateType['provider']
      web3Provider?: StateType['web3Provider']
      address?: StateType['address']
      chainId?: StateType['chainId']
    }
  | {
      type: 'SET_ADDRESS'
      address?: StateType['address']
    }
  | {
      type: 'SET_CHAIN_ID'
      chainId?: StateType['chainId']
    }
  | {
      type: 'RESET_WEB3_PROVIDER'
    }

const initialState: StateType = {
  provider: null,
  web3Provider: null,
  address: undefined,
  chainId: undefined,
}

function reducer(state: StateType, action: ActionType): StateType {
  switch (action.type) {
    case 'SET_WEB3_PROVIDER':
      return {
        ...state,
        provider: action.provider,
        web3Provider: action.web3Provider,
        address: action.address,
        chainId: action.chainId,
      }
    case 'SET_ADDRESS':
      return {
        ...state,
        address: action.address,
      }
    case 'SET_CHAIN_ID':
      return {
        ...state,
        chainId: action.chainId,
      }
    case 'RESET_WEB3_PROVIDER':
      return initialState
    default:
      throw new Error()
  }
}


const Home: NextPage = () => {

  const [state, dispatch] = useReducer(reducer, initialState)
  const { provider, web3Provider, address } = state

  const connect = useCallback(async function () {
    if (web3Modal === undefined)
      return;
    // This is the initial `provider` that is returned when
    // using web3Modal to connect. Can be MetaMask or WalletConnect.
    const provider = await web3Modal.connect()

    // We plug the initial `provider` into ethers.js and get back
    // a Web3Provider. This will add on methods from ethers.js and
    // event listeners such as `.on()` will be different.
    const web3Provider = new providers.Web3Provider(provider)

    const signer = web3Provider.getSigner()
    const address = await signer.getAddress()

    const network = await web3Provider.getNetwork()

    dispatch({
      type: 'SET_WEB3_PROVIDER',
      provider,
      web3Provider,
      address,
      chainId: network.chainId,
    })
  }, [])

  const disconnect = useCallback(
    async function () {
      if (web3Modal === undefined)
        return;
      await web3Modal.clearCachedProvider()
      if (provider?.disconnect && typeof provider.disconnect === 'function') {
        await provider.disconnect()
      }
      dispatch({
        type: 'RESET_WEB3_PROVIDER',
      })
    },
    [provider]
  )

  // Auto connect to the cached provider
  useEffect(() => {
    if (web3Modal) {
      if (web3Modal.cachedProvider) {
        connect()
      }
    }
  }, [connect])

  // A `provider` should come with EIP-1193 events. We'll listen for those events
  // here so that when a user switches accounts or networks, we can update the
  // local React state with that new information.
  useEffect(() => {
    if (provider?.on) {
      const handleAccountsChanged = (accounts: string[]) => {
        // eslint-disable-next-line no-console
        console.log('accountsChanged', accounts)
        dispatch({
          type: 'SET_ADDRESS',
          address: accounts[0],
        })
      }

      // https://docs.ethers.io/v5/concepts/best-practices/#best-practices--network-changes
      const handleChainChanged = (_hexChainId: string) => {
        console.log(_hexChainId);
        window.location.reload()
      }

      const handleDisconnect = (error: { code: number; message: string }) => {
        // eslint-disable-next-line no-console
        console.log('disconnect', error)
        disconnect()
      }

      provider.on('accountsChanged', handleAccountsChanged)
      provider.on('chainChanged', handleChainChanged)
      provider.on('disconnect', handleDisconnect)

      // Subscription Cleanup
      return () => {
        if (provider.removeListener) {
          provider.removeListener('accountsChanged', handleAccountsChanged)
          provider.removeListener('chainChanged', handleChainChanged)
          provider.removeListener('disconnect', handleDisconnect)
        }
      }
    }
  }, [provider, disconnect])

  return (
    <div>
      <Head>
        <title>Supersig</title>
        <meta name="description" content="SuperSig multisig for Ethereum" />
      </Head>

      <header>
        {address && (
          <div className="grid">
            <div>
            </div>
            <div>
              <p className="mb-1">Address:</p>
              <p>{ellipseAddress(address)}</p>
            </div>
          </div>
        )}
      </header>

      <main>
        <div className='text-center'>
          <h1 className='text-3xl font-bold'>
            Welcome to <a href="supersig">SuperSig!</a>
          </h1>
          {web3Provider ? (
            <button className="button" type="button" onClick={disconnect}>
              Disconnect
            </button>
          ) : (
            <button className="button" type="button" onClick={connect}>
              Connect
            </button>
          )}
        </div>
      </main>

    </div>
  )
}

export default Home
