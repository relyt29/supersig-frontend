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

const contractABI = [{"name":"Proposed","inputs":[{"name":"proposer","type":"address","indexed":true},{"name":"proposalId","type":"uint256","indexed":true}],"anonymous":false,"type":"event"},{"name":"Executed","inputs":[{"name":"executor","type":"address","indexed":true},{"name":"proposalId","type":"uint256","indexed":true}],"anonymous":false,"type":"event"},{"stateMutability":"payable","type":"constructor","inputs":[{"name":"_owners","type":"address[]"},{"name":"_minimum","type":"uint256"}],"outputs":[]},{"stateMutability":"nonpayable","type":"function","name":"propose","inputs":[{"name":"id","type":"uint256"},{"name":"target","type":"address"},{"name":"calldata_hash","type":"bytes32"},{"name":"_value","type":"uint256"}],"outputs":[]},{"stateMutability":"nonpayable","type":"function","name":"approve","inputs":[{"name":"id","type":"uint256"}],"outputs":[]},{"stateMutability":"nonpayable","type":"function","name":"execute","inputs":[{"name":"id","type":"uint256"},{"name":"calldata","type":"bytes"}],"outputs":[]},{"stateMutability":"nonpayable","type":"function","name":"revoke_approval","inputs":[{"name":"id","type":"uint256"}],"outputs":[]},{"stateMutability":"payable","type":"fallback"},{"stateMutability":"view","type":"function","name":"owners","inputs":[{"name":"arg0","type":"uint256"}],"outputs":[{"name":"","type":"address"}]},{"stateMutability":"view","type":"function","name":"minimum","inputs":[],"outputs":[{"name":"","type":"uint256"}]},{"stateMutability":"view","type":"function","name":"myself","inputs":[],"outputs":[{"name":"","type":"address"}]},{"stateMutability":"view","type":"function","name":"proposals","inputs":[{"name":"arg0","type":"uint256"}],"outputs":[{"name":"","type":"tuple","components":[{"name":"target","type":"address"},{"name":"calldata_hash","type":"bytes32"},{"name":"value","type":"uint256"}]}]},{"stateMutability":"view","type":"function","name":"approvals","inputs":[{"name":"arg0","type":"uint256"}],"outputs":[{"name":"","type":"uint256"}]}]
const contractBytecode = "60206109f760003960005160456020826109f701600039600051116109f2576020816109f70160003960005180604052600081604581116109f257801561007257905b60206020820260208601016109f7016000396000518060a01c6109f2576020820260600152600101818118610042575b5050505060405180600055602081026000602082601f0104604581116109f25780156100b257905b6020810260600151816001015560010181811861009a575b505050506020610a17600039600051604655306047556109106100e16300000000396109106000016300000000f3600436101561000d57610909565b60003560e01c63125231ae8118610121576024358060a01c61090b576040523461090b5760006048600435602052600052604060002054141561006a5760006048600435602052600052604060002060028101905054141561006d565b60015b156100cf5760176060527f50726f706f73616c20616c7265616479206578697374730000000000000000006080526060506060518060800181600003601f1636823750506308c379a06020526020604052601f19601f6060510116604401603cfd5b6048600435602052600052604060002060405181556044356001820155606435600282015550600435337f047933b4d6d5561046580f25334035991926e1531252edfc5f6faa07bb9de2d260006060a3005b63b759f9548118610372573461090b57600060405260006000546045811161090b57801561017157905b80600101546060523360605118610166576001604052610171565b60010181811861014b575b50506040516101fb5760216060527f4f6e6c79206f776e6572732063616e20617070726f76652070726f706f73616c6080527f730000000000000000000000000000000000000000000000000000000000000060a0526060506060518060800181600003601f1636823750506308c379a06020526020604052601f19601f6060510116604401603cfd5b604a600435602052600052604060002080548060605260018201602082026000602082601f01046045811161090b57801561024957905b808401546020820260800152600101818118610232575b50505050505060006060516045811161090b57801561031057905b602081026080015161092052336109205118610305576027610940527f596f75206861766520616c726561647920617070726f76656420746869732070610960527f726f706f73616c00000000000000000000000000000000000000000000000000610980526109405061094051806109600181600003601f1636823750506308c379a061090052602061092052601f19601f61094051011660440161091cfd5b600101818118610264575b505060496004356020526000526040600020546001818183011061090b57808201905090506049600435602052600052604060002055604a600435602052600052604060002080546044811161090b5760018101825533816001840101555050005b6359efcb158118610688576024356004016107d081351161090b578035806040526020820181816060375050503461090b576048600435602052600052604060002054156103c15760006103da565b6048600435602052600052604060002060028101905054155b15610445576017610840527f50726f706f73616c20646f6573206e6f74206578697374000000000000000000610860526108405061084051806108600181600003601f1636823750506308c379a061080052602061082052601f19601f61084051011660440161081cfd5b604654604960043560205260005260406000205410156104ea57603e610840527f50726f706f73616c20686173206e6f74206265656e20617070726f7665642062610860527f7920746865206d696e696d756d206e756d626572206f66206f776e6572730000610880526108405061084051806108600181600003601f1636823750506308c379a061080052602061082052601f19601f61084051011660440161081cfd5b60405160602060486004356020526000526040600020600181019050541461057257601c610840527f43616c6c64617461206861736820646f6573206e6f74206d6174636800000000610860526108405061084051806108600181600003601f1636823750506308c379a061080052602061082052601f19601f61084051011660440161081cfd5b60486004356020526000526040600020805461084052600181015461086052600281015461088052506048600435602052600052604060002060008155600060018201556000600282015550600060496004356020526000526040600020556001604a6004356020526000526040600020556000604a600435602052600052604060002060018101905055604050614e20615700604051606061088051610840515af1610624573d600060003e3d6000fd5b6156e0614e203d808211610638578161063a565b805b9050905081528051806108a05260208201816108c0838360045afa905090505050600435337f6f6c6d78a4851d4c222c8404fc92372ee84b7b81054305ae8ea3c83c2dabd42e60006156e0a3005b639f5943738118610837573461090b57604a600435602052600052604060002080548060405260018201602082026000602082601f01046045811161090b5780156106e657905b8084015460208202606001526001018181186106cf575b50505050505060006045905b80610900523360206109005160405181101561090b570260600151186107c357600060206109005160405181101561090b57026060015260405180604a600435602052600052604060002055602081026001604a6004356020526000526040600020016000602083601f01046045811161090b57801561078557905b60208102606001518184015560010181811861076e575b50505050506049600435602052600052604060002054600180821061090b578082039050905060496004356020526000526040600020555050610835565b6001018181186106f25750506015610900527f4e6f20617070726f76616c20746f207265766f6b650000000000000000000000610920526109005061090051806109200181600003601f1636823750506308c379a06108c05260206108e052601f19601f6109005101166044016108dcfd5b005b63025e7c278118610861573461090b5760043560005481101561090b576001015460405260206040f35b6352d6804d811861087d573461090b5760465460405260206040f35b63d276fd938118610899573461090b5760475460405260206040f35b63013cf08b81186108d5573461090b57604860043560205260005260406000208054604052600181015460605260028101546080525060606040f35b6363035f6681186108ff573461090b57604960043560205260005260406000205460405260206040f35b5061090956610909565b005b600080fd005b600080fd0000000000000000000000000000000000000000000000000000000000000040000000000000000000000000000000000000000000000000000000000000000300000000000000000000000000000000000000000000000000000000000000030000000000000000000000000dedbbdca6ca14cf3c5d5eaa54a00a5097c6d68a00000000000000000000000032a48f9c6f80080622d0214c293be35eb79c3019000000000000000000000000c0d5223ba10d2d9d4970b76e70eba102bbbc68b7"

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


  const [deployFriend1Address, setDeployFriend1Address] = useState("")
  const handleDeployFriend1AddressChange = (event: ChangeEvent<HTMLInputElement>) => {
    setDeployFriend1Address(event.target.value)
  }
  const [deployFriend2Address, setDeployFriend2Address] = useState("")
  const handleDeployFriend2AddressChange = (event: ChangeEvent<HTMLInputElement>) => {
    setDeployFriend2Address(event.target.value)
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
        setStateFriend2Calldata(calldata2Friend.text())
      if (target2Friend != undefined)
        setStateFriend2Target(target2Friend.text())
    } catch (error) {
      console.error(error);
    }
  }

  const deployMultisig = async () => {
    if (deployFriend1Address != "" && deployFriend2Address != "") {
      try {
        const factory = new ethers.ContractFactory(contractABI, contractBytecode, web3Provider.getSigner());

        //const contract = await factory.deploy([deployFriend1Address, deployFriend2Address], 3);
        await factory.deploy([deployFriend1Address, deployFriend2Address], 3);
      } catch (err) {
        alert(`Need to have set 2 correctly formatted friend addresses | one ${deployFriend1Address} | two ${deployFriend2Address}`)
        console.log(err)
      }
    } else {
      alert(`Need to have set 2 correct friend addresses | one ${deployFriend1Address} | two ${deployFriend2Address}`)
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
    //const [msig, tgt, cdata] = await privyClient.put(sessionAddress, [
    await privyClient.put(sessionAddress, [
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
                <div>
                </div>

              </div>
              <div>
                <button className={styles.btnb} type="button" onClick={submitTransaction}>Submit Transaction</button>
              </div>
              <hr className='mt-8 mb-3'/>
              <div>
                <h1 className='text-3xl font-bold'>
                  Deploy new Multisig
                </h1>
              </div>
              <div>
                <label>Friend 1 Address:
                  <input className={styles.inpt} value={deployFriend1Address} onChange={handleDeployFriend1AddressChange}></input>
                </label>
                <label>Friend 2 Address:
                  <input className={styles.inpt} value={deployFriend2Address} onChange={handleDeployFriend2AddressChange}></input>
                </label>
              </div>
              <div>
                <button className={styles.btnb} type="button" onClick={deployMultisig}>Deploy New Multisig</button>
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
