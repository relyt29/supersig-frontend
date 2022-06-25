import type { NextPage } from 'next'
import Head from 'next/head'

import WalletConnectProvider from '@walletconnect/web3-provider'
import Web3Modal from 'web3modal'
import {ethers} from 'ethers'
import { useCallback, useEffect, useState, useReducer, ChangeEvent } from 'react'
import { PrivyClient, SiweSession } from '@privy-io/privy-browser'
import styles from '../styles/Home.module.css'


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
  session?: any
  privyClient?: any
  chainId?: number
}

type ActionType =
  | {
      type: 'SET_WEB3_PROVIDER'
      provider?: StateType['provider']
      web3Provider?: StateType['web3Provider']
      address?: StateType['address']
      session?: StateType['session']
      privyClient?: StateType['privyClient']
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
  session: undefined,
  privyClient: undefined,
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
        session: action.session,
        privyClient: action.privyClient,
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
  const { provider, web3Provider, address, session, privyClient } = state
  const [stateCalldata, setStateCalldata] = useState("")
  const [stateTarget, setStateTarget] = useState("")
  const [stateMultisigAddress, setStateMultisigAddress] = useState("")

  const [localUIMSigAddr, setLocalUIMSigAddr] = useState("")
  const handleLocalUIMsigAddrChange = (event: ChangeEvent<HTMLInputElement>) => {
    setLocalUIMSigAddr(event.target.value)
  }
  const [localUITarget, setLocalUITarget] = useState("")
  const handleLocalUITargetChange = (event: ChangeEvent<HTMLInputElement>) => {
    setLocalUITarget(event.target.value)
  }

  const [localUICalldata, setLocalUICalldata] = useState("")
  const handleLocalUICalldataChange = (event: ChangeEvent<HTMLInputElement>) => {
    setLocalUICalldata(event.target.value)
  }

  const [stateFriend1Calldata, setStateFriend1Calldata] = useState("")
  const [stateFriend1Target, setStateFriend1Target] = useState("")
  const [stateFriend2Calldata, setStateFriend2Calldata] = useState("")
  const [stateFriend2Target, setStateFriend2Target] = useState("")

  const [localFriend1Addr, setLocalFriend1Addr] = useState("")
  const handleLocalFriend1AddrChange = (event: ChangeEvent<HTMLInputElement>) => {
    setLocalFriend1Addr(event.target.value)
  }
  const [localFriend2Addr, setLocalFriend2Addr] = useState("")
  const handleLocalFriend2AddrChange = (event: ChangeEvent<HTMLInputElement>) => {
    setLocalFriend2Addr(event.target.value)
  }


  const connect = useCallback(async function () {
    if (web3Modal === undefined)
      return;
    // This is the initial `provider` that is returned when
    // using web3Modal to connect. Can be MetaMask or WalletConnect.
    const provider = await web3Modal.connect()

    // We plug the initial `provider` into ethers.js and get back
    // a Web3Provider. This will add on methods from ethers.js and
    // event listeners such as `.on()` will be different.
    const web3Provider = new ethers.providers.Web3Provider(provider)

    const signer = web3Provider.getSigner()
    const address = await signer.getAddress()

    const network = await web3Provider.getNetwork()

    const session = new SiweSession("f0xlZfPKXum67BR2OS-CHMPGT8nwhWEnJJtcBMlTcE0=", window.ethereum)
    const privyClient = new PrivyClient({session: session})


    dispatch({
      type: 'SET_WEB3_PROVIDER',
      provider,
      web3Provider,
      address,
      session,
      privyClient,
      chainId: network.chainId,
    })
  }, [])

  const fetchDataFromPrivy = async () => {
    try {

      console.log(`Getting Data for ${localFriend1Addr}`)
      const [calldata1Friend, target1Friend] = await privyClient.get(localFriend1Addr, ['calldata', 'target']);
      if (calldata1Friend != undefined)
        setStateFriend1Calldata(calldata1Friend.text())
      if (target1Friend != undefined)
        setStateFriend1Target(target1Friend.text())
      console.log(`Getting Data for ${localFriend2Addr}`)
      const [calldata2Friend, target2Friend] = await privyClient.get(localFriend2Addr, ['calldata', 'target']);
      if (calldata2Friend != undefined)
        setStateFriend1Calldata(calldata2Friend.text())
      if (target2Friend != undefined)
        setStateFriend1Target(target2Friend.text())
    } catch (error) {
      console.error(error);
    }
  }


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

  const handleSaveInfo = async () => {
    //event.preventDefault();
    console.log("Saving info");
    console.log(localUIMSigAddr);
    console.log(localUITarget);
    console.log(localUICalldata);
    const sessionAddress = await session.address();
    if (!sessionAddress) return
    const [msig, tgt, cdata] = await privyClient.put(sessionAddress, [
          {field: 'msigaddr', value: localUIMSigAddr},
          {field: 'target', value: localUITarget},
          {field: 'calldata', value: localUICalldata},
        ]);
  }

  const submitTransaction = async () => {
    console.log("TODO")
  }

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
            <div>
              <button className={styles.btnb} type="button" onClick={disconnect}>
                Disconnect
              </button>
              <button className={styles.btnb} type='button' onClick={fetchDataFromPrivy}>Get From Privy</button>
              <div className='grid grid-cols-4 gap-4'>
                <label>Multisig Address: 
                  <input className={styles.inpt} type="text" value={localUIMSigAddr} onChange={handleLocalUIMsigAddrChange}></input>
                </label>
                <label>End Target: 
                  <input className={styles.inpt} type="text" value={localUITarget} onChange={handleLocalUITargetChange}></input>
                </label>
                <label>Desired Calldata: 
                  <input className={styles.inpt} type="text" value={localUICalldata} onChange={handleLocalUICalldataChange}></input>
                </label>
                <button className={styles.btnb} type="button" onClick={handleSaveInfo}>Save to Privy</button>

                <label>Friend 1 Address:<input className={styles.inpt} value={localFriend1Addr} onChange={handleLocalFriend1AddrChange}></input></label>
                <label>Friend 1 Target: 
                  <input className={styles.inpt} type="text" value={stateFriend1Target} readOnly></input>
                </label>
                <label>Friend 1 Calldata: 
                  <input className={styles.inpt} type="text" value={stateFriend1Calldata} readOnly></input>
                </label>
                <div></div>

                <label>Friend 2 Address:<input className={styles.inpt} value={localFriend2Addr} onChange={handleLocalFriend2AddrChange}></input></label>
                <label>Friend 2 Target: 
                  <input className={styles.inpt} type="text" value={stateFriend2Target} readOnly></input>
                </label>
                <label>Friend 2 Calldata: 
                  <input className={styles.inpt} type="text" value={stateFriend2Calldata} readOnly></input>
                </label>
                <div></div>
              </div>
              <div>
                <button className={styles.btnb} type="button" onClick={submitTransaction}>Submit Transaction</button>
              </div>
            </div>
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
