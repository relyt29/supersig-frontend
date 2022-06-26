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

const abiCoder = new ethers.utils.AbiCoder()

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

const contractABI = [{"name":"Proposed","inputs":[{"name":"proposer","type":"address","indexed":true},{"name":"proposalId","type":"uint256","indexed":true}],"anonymous":false,"type":"event"},{"name":"Executed","inputs":[{"name":"executor","type":"address","indexed":true},{"name":"proposalId","type":"uint256","indexed":true}],"anonymous":false,"type":"event"},{"stateMutability":"payable","type":"constructor","inputs":[{"name":"_owners","type":"address[]"},{"name":"_minimum","type":"uint256"}],"outputs":[]},{"stateMutability":"nonpayable","type":"function","name":"propose","inputs":[{"name":"id","type":"uint256"},{"name":"_hash","type":"bytes32"}],"outputs":[]},{"stateMutability":"nonpayable","type":"function","name":"approve","inputs":[{"name":"id","type":"uint256"}],"outputs":[]},{"stateMutability":"nonpayable","type":"function","name":"execute","inputs":[{"name":"id","type":"uint256"},{"name":"target","type":"address"},{"name":"calldata","type":"bytes"},{"name":"_value","type":"uint256"}],"outputs":[]},{"stateMutability":"nonpayable","type":"function","name":"revoke_approval","inputs":[{"name":"id","type":"uint256"}],"outputs":[]},{"stateMutability":"payable","type":"fallback"},{"stateMutability":"view","type":"function","name":"owners","inputs":[{"name":"arg0","type":"uint256"}],"outputs":[{"name":"","type":"address"}]},{"stateMutability":"view","type":"function","name":"minimum","inputs":[],"outputs":[{"name":"","type":"uint256"}]},{"stateMutability":"view","type":"function","name":"proposals","inputs":[{"name":"arg0","type":"uint256"}],"outputs":[{"name":"","type":"tuple","components":[{"name":"_hash","type":"bytes32"}]}]},{"stateMutability":"view","type":"function","name":"approvals","inputs":[{"name":"arg0","type":"uint256"}],"outputs":[{"name":"","type":"uint256"}]}] 
const contractBytecode = "60206109ce60003960005160456020826109ce01600039600051116109c9576020816109ce0160003960005180604052600081604581116109c957801561007257905b60206020820260208601016109ce016000396000518060a01c6109c9576020820260600152600101818118610042575b5050505060405180600055602081026000602082601f0104604581116109c95780156100b257905b6020810260600151816001015560010181811861009a575b5050505060206109ee6000396000516046556108eb6100dd6300000015396108eb6000016300000015f3600436101561000d576108e4565b60003560e01c635258352181186100da57346108e65760006047600435602052600052604060002054146100985760176040527f50726f706f73616c20616c7265616479206578697374730000000000000000006060526040506040518060600181600003601f1636823750506308c379a06000526020602052601f19601f6040510116604401601cfd5b60476004356020526000526040600020602435815550600435337f047933b4d6d5561046580f25334035991926e1531252edfc5f6faa07bb9de2d260006040a3005b63b759f954811861032b57346108e65760006040526000600054604581116108e657801561012a57905b8060010154606052336060511861011f57600160405261012a565b600101818118610104575b50506040516101b45760216060527f4f6e6c79206f776e6572732063616e20617070726f76652070726f706f73616c6080527f730000000000000000000000000000000000000000000000000000000000000060a0526060506060518060800181600003601f1636823750506308c379a06020526020604052601f19601f6060510116604401603cfd5b6049600435602052600052604060002080548060605260018201602082026000602082601f0104604581116108e657801561020257905b8084015460208202608001526001018181186101eb575b5050505050506000606051604581116108e65780156102c957905b6020810260800151610920523361092051186102be576027610940527f596f75206861766520616c726561647920617070726f76656420746869732070610960527f726f706f73616c00000000000000000000000000000000000000000000000000610980526109405061094051806109600181600003601f1636823750506308c379a061090052602061092052601f19601f61094051011660440161091cfd5b60010181811861021d575b50506048600435602052600052604060002054600181818301106108e657808201905090506048600435602052600052604060002055604960043560205260005260406000208054604481116108e65760018101825533816001840101555050005b634d20b887811861068f576024358060a01c6108e6576040526044356004016107d08135116108e657803580606052602082018181608037505050346108e65760476004356020526000526040600020546103e6576017610860527f50726f706f73616c20646f6573206e6f74206578697374000000000000000000610880526108605061086051806108800181600003601f1636823750506308c379a061082052602061084052601f19601f61086051011660440161083cfd5b6046546048600435602052600052604060002054101561048b57603e610860527f50726f706f73616c20686173206e6f74206265656e20617070726f7665642062610880527f7920746865206d696e696d756d206e756d626572206f66206f776e65727300006108a0526108605061086051806108800181600003601f1636823750506308c379a061082052602061084052601f19601f61086051011660440161083cfd5b6060604051611120528061114052806111200160605180825260208201818183608060045afa90505050805180602083010181600003601f163682375050601f19601f825160200101169050810190506064356111605261110052611100805160208201209050610860526108605160476004356020526000526040600020541461059b576024610880527f50726f706f73616c206861736820646f6573206e6f742070726f7669646564206108a0527f64617461000000000000000000000000000000000000000000000000000000006108c0526108805061088051806108a00181600003601f1636823750506308c379a061084052602061086052601f19601f61088051011660440161085cfd5b6047600435602052600052604060002080546108805250604760043560205260005260406000206000815550600060486004356020526000526040600020556001604960043560205260005260406000205560006049600435602052600052604060002060018101905055606050614e2061570060605160806064356040515af161062b573d600060003e3d6000fd5b6156e0614e203d80821161063f5781610641565b805b9050905081528051806108a05260208201816108c0838360045afa905090505050600435337f6f6c6d78a4851d4c222c8404fc92372ee84b7b81054305ae8ea3c83c2dabd42e60006156e0a3005b639f594373811861083e57346108e6576049600435602052600052604060002080548060405260018201602082026000602082601f0104604581116108e65780156106ed57905b8084015460208202606001526001018181186106d6575b50505050505060006045905b8061090052336020610900516040518110156108e6570260600151186107ca5760006020610900516040518110156108e657026060015260405180604960043560205260005260406000205560208102600160496004356020526000526040600020016000602083601f0104604581116108e657801561078c57905b602081026060015181840155600101818118610775575b5050505050604860043560205260005260406000205460018082106108e657808203905090506048600435602052600052604060002055505061083c565b6001018181186106f95750506015610900527f4e6f20617070726f76616c20746f207265766f6b650000000000000000000000610920526109005061090051806109200181600003601f1636823750506308c379a06108c05260206108e052601f19601f6109005101166044016108dcfd5b005b63025e7c27811861086857346108e6576004356000548110156108e6576001015460405260206040f35b6352d6804d811861088457346108e65760465460405260206040f35b63013cf08b81186108b057346108e6576047600435602052600052604060002080546040525060206040f35b6363035f6681186108da57346108e657604860043560205260005260406000205460405260206040f35b506108e4566108e4565b005b600080fd005b600080fd0000000000000000000000000000000000000000000000000000000000000040000000000000000000000000000000000000000000000000000000000000000300000000000000000000000000000000000000000000000000000000000000030000000000000000000000000dedbbdca6ca14cf3c5d5eaa54a00a5097c6d68a00000000000000000000000032a48f9c6f80080622d0214c293be35eb79c3019000000000000000000000000c0d5223ba10d2d9d4970b76e70eba102bbbc68b78054604481116108e65760018101825533816001840101555050005b634d20b887811861068f576024358060a01c6108e6576040526044356004016107d08135116108e657803580606052602082018181608037505050346108e65760476004356020526000526040600020546103e6576017610860527f50726f706f73616c20646f6573206e6f74206578697374000000000000000000610880526108605061086051806108800181600003601f1636823750506308c379a061082052602061084052601f19601f61086051011660440161083cfd5b6046546048600435602052600052604060002054101561048b57603e610860527f50726f706f73616c20686173206e6f74206265656e20617070726f7665642062610880527f7920746865206d696e696d756d206e756d626572206f66206f776e65727300006108a0526108605061086051806108800181600003601f1636823750506308c379a061082052602061084052601f19601f61086051011660440161083cfd5b6060604051611120528061114052806111200160605180825260208201818183608060045afa90505050805180602083010181600003601f163682375050601f19601f825160200101169050810190506064356111605261110052611100805160208201209050610860526108605160476004356020526000526040600020541461059b576024610880527f50726f706f73616c206861736820646f6573206e6f742070726f7669646564206108a0527f64617461000000000000000000000000000000000000000000000000000000006108c0526108805061088051806108a00181600003601f1636823750506308c379a061084052602061086052601f19601f61088051011660440161085cfd5b6047600435602052600052604060002080546108805250604760043560205260005260406000206000815550600060486004356020526000526040600020556001604960043560205260005260406000205560006049600435602052600052604060002060018101905055606050614e2061570060605160806064356040515af161062b573d600060003e3d6000fd5b6156e0614e203d80821161063f5781610641565b805b9050905081528051806108a05260208201816108c0838360045afa905090505050600435337f6f6c6d78a4851d4c222c8404fc92372ee84b7b81054305ae8ea3c83c2dabd42e60006156e0a3005b639f594373811861083e57346108e6576049600435602052600052604060002080548060405260018201602082026000602082601f0104604581116108e65780156106ed57905b8084015460208202606001526001018181186106d6575b50505050505060006045905b8061090052336020610900516040518110156108e6570260600151186107ca5760006020610900516040518110156108e657026060015260405180604960043560205260005260406000205560208102600160496004356020526000526040600020016000602083601f0104604581116108e657801561078c57905b602081026060015181840155600101818118610775575b5050505050604860043560205260005260406000205460018082106108e657808203905090506048600435602052600052604060002055505061083c565b6001018181186106f95750506015610900527f4e6f20617070726f76616c20746f207265766f6b650000000000000000000000610920526109005061090051806109200181600003601f1636823750506308c379a06108c05260206108e052601f19601f6109005101166044016108dcfd5b005b63025e7c27811861086857346108e6576004356000548110156108e6576001015460405260206040f35b6352d6804d811861088457346108e65760465460405260206040f35b63013cf08b81186108b057346108e6576047600435602052600052604060002080546040525060206040f35b6363035f6681186108da57346108e657604860043560205260005260406000205460405260206040f35b506108e4566108e4565b005b600080fd005b600080fd0000000000000000000000000000000000000000000000000000000000000040000000000000000000000000000000000000000000000000000000000000000300000000000000000000000000000000000000000000000000000000000000030000000000000000000000000dedbbdca6ca14cf3c5d5eaa54a00a5097c6d68a00000000000000000000000032a48f9c6f80080622d0214c293be35eb79c3019000000000000000000000000c0d5223ba10d2d9d4970b76e70eba102bbbc68b7"

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

  const [stateMeMultiSigAddr, setLocalUIMSigAddr] = useState("")
  const handleLocalUIMsigAddrChange = (event: ChangeEvent<HTMLInputElement>) => {
    setLocalUIMSigAddr(event.target.value)
  }
  const [stateMeTarget, setLocalUITarget] = useState("")
  const handleLocalUITargetChange = (event: ChangeEvent<HTMLInputElement>) => {
    setLocalUITarget(event.target.value)
  }

  const [stateMeCalldata, setLocalUICalldata] = useState("")
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

  const [stateProposalId, setStateProposalId] = useState("")
  const handleProposalIdChange = (event: ChangeEvent<HTMLInputElement>) => {
    setStateProposalId(event.target.value)
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
      const signer = await web3Provider.getSigner();
      const myaddr = await signer.getAddress();
      //const factory = new ethers.ContractFactory(contractABI, contractBytecode, signer);
      const ownersArray = [myaddr, deployFriend1Address, deployFriend2Address];
      console.log(ownersArray)
      const deployData = "0x60206109ce60003960005160456020826109ce01600039600051116109c9576020816109ce0160003960005180604052600081604581116109c957801561007257905b60206020820260208601016109ce016000396000518060a01c6109c9576020820260600152600101818118610042575b5050505060405180600055602081026000602082601f0104604581116109c95780156100b257905b6020810260600151816001015560010181811861009a575b5050505060206109ee6000396000516046556108eb6100dd6300000015396108eb6000016300000015f3600436101561000d576108e4565b60003560e01c635258352181186100da57346108e65760006047600435602052600052604060002054146100985760176040527f50726f706f73616c20616c7265616479206578697374730000000000000000006060526040506040518060600181600003601f1636823750506308c379a06000526020602052601f19601f6040510116604401601cfd5b60476004356020526000526040600020602435815550600435337f047933b4d6d5561046580f25334035991926e1531252edfc5f6faa07bb9de2d260006040a3005b63b759f954811861032b57346108e65760006040526000600054604581116108e657801561012a57905b8060010154606052336060511861011f57600160405261012a565b600101818118610104575b50506040516101b45760216060527f4f6e6c79206f776e6572732063616e20617070726f76652070726f706f73616c6080527f730000000000000000000000000000000000000000000000000000000000000060a0526060506060518060800181600003601f1636823750506308c379a06020526020604052601f19601f6060510116604401603cfd5b6049600435602052600052604060002080548060605260018201602082026000602082601f0104604581116108e657801561020257905b8084015460208202608001526001018181186101eb575b5050505050506000606051604581116108e65780156102c957905b6020810260800151610920523361092051186102be576027610940527f596f75206861766520616c726561647920617070726f76656420746869732070610960527f726f706f73616c00000000000000000000000000000000000000000000000000610980526109405061094051806109600181600003601f1636823750506308c379a061090052602061092052601f19601f61094051011660440161091cfd5b60010181811861021d575b50506048600435602052600052604060002054600181818301106108e657808201905090506048600435602052600052604060002055604960043560205260005260406000208054604481116108e65760018101825533816001840101555050005b634d20b887811861068f576024358060a01c6108e6576040526044356004016107d08135116108e657803580606052602082018181608037505050346108e65760476004356020526000526040600020546103e6576017610860527f50726f706f73616c20646f6573206e6f74206578697374000000000000000000610880526108605061086051806108800181600003601f1636823750506308c379a061082052602061084052601f19601f61086051011660440161083cfd5b6046546048600435602052600052604060002054101561048b57603e610860527f50726f706f73616c20686173206e6f74206265656e20617070726f7665642062610880527f7920746865206d696e696d756d206e756d626572206f66206f776e65727300006108a0526108605061086051806108800181600003601f1636823750506308c379a061082052602061084052601f19601f61086051011660440161083cfd5b6060604051611120528061114052806111200160605180825260208201818183608060045afa90505050805180602083010181600003601f163682375050601f19601f825160200101169050810190506064356111605261110052611100805160208201209050610860526108605160476004356020526000526040600020541461059b576024610880527f50726f706f73616c206861736820646f6573206e6f742070726f7669646564206108a0527f64617461000000000000000000000000000000000000000000000000000000006108c0526108805061088051806108a00181600003601f1636823750506308c379a061084052602061086052601f19601f61088051011660440161085cfd5b6047600435602052600052604060002080546108805250604760043560205260005260406000206000815550600060486004356020526000526040600020556001604960043560205260005260406000205560006049600435602052600052604060002060018101905055606050614e2061570060605160806064356040515af161062b573d600060003e3d6000fd5b6156e0614e203d80821161063f5781610641565b805b9050905081528051806108a05260208201816108c0838360045afa905090505050600435337f6f6c6d78a4851d4c222c8404fc92372ee84b7b81054305ae8ea3c83c2dabd42e60006156e0a3005b639f594373811861083e57346108e6576049600435602052600052604060002080548060405260018201602082026000602082601f0104604581116108e65780156106ed57905b8084015460208202606001526001018181186106d6575b50505050505060006045905b8061090052336020610900516040518110156108e6570260600151186107ca5760006020610900516040518110156108e657026060015260405180604960043560205260005260406000205560208102600160496004356020526000526040600020016000602083601f0104604581116108e657801561078c57905b602081026060015181840155600101818118610775575b5050505050604860043560205260005260406000205460018082106108e657808203905090506048600435602052600052604060002055505061083c565b6001018181186106f95750506015610900527f4e6f20617070726f76616c20746f207265766f6b650000000000000000000000610920526109005061090051806109200181600003601f1636823750506308c379a06108c05260206108e052601f19601f6109005101166044016108dcfd5b005b63025e7c27811861086857346108e6576004356000548110156108e6576001015460405260206040f35b6352d6804d811861088457346108e65760465460405260206040f35b63013cf08b81186108b057346108e6576047600435602052600052604060002080546040525060206040f35b6363035f6681186108da57346108e657604860043560205260005260406000205460405260206040f35b506108e4566108e4565b005b600080fd005b600080fd"
      const deployArguments = `000000000000000000000000000000000000000000000000000000000000004000000000000000000000000000000000000000000000000000000000000000030000000000000000000000000000000000000000000000000000000000000003000000000000000000000000${String(myaddr).toLowerCase().substring(2)}000000000000000000000000${String(deployFriend1Address).toLowerCase().substring(2)}000000000000000000000000${String(deployFriend2Address).toLowerCase().substring(2)}`
      const txRequest =  {
        to: null,
        from: myaddr,
        data: deployData+deployArguments,
        chainId: 4,
        value: 0,
        type: 2,
        maxFeePerGas: 20000000000,
        maxPriorityFeePerGas: 1501000000,
        gasLimit: 1000000,
      };
      await signer.sendTransaction(txRequest);
      //await factory.deploy(ownersArray, ownersArray.length);
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

  const pushHashToContract = async () => {
    console.log("Pushing Hash to contract")
    const encodedData = abiCoder.encode(['address', 'bytes', 'uint256'], [stateMeTarget, ethers.utils.hexlify("0x" + stateMeCalldata), 0])
    const hashedEncodedData = ethers.utils.keccak256(encodedData);
    const contract = new ethers.Contract(stateMeMultiSigAddr, contractABI, web3Provider.getSigner());
    const txhash = await contract.propose(stateProposalId, hashedEncodedData);
    alert(`Transaction sent: ${txhash}`)
  }

  const approveProposal = async () => {
    console.log("Approving proposal")
    const contract = new ethers.Contract(stateMeMultiSigAddr, contractABI, web3Provider.getSigner());
    const txhash = await contract.approve(stateProposalId);
    alert(`Transaction sent: ${txhash}`)
  }

  const submitTransaction = async () => {
    console.log("Submitting execution transaction")
    const contract = new ethers.Contract(stateMeMultiSigAddr, contractABI, web3Provider.getSigner());
    const txhash = await contract.execute(stateProposalId, stateMeTarget, "0x" + stateMeCalldata, 0);
    alert(`Transaction sent: ${txhash}`)
  }

  const handleSaveInfo = async () => {
    //event.preventDefault();
    console.log("Saving info");
    console.log(stateMeMultiSigAddr);
    console.log(stateMeTarget);
    console.log(stateMeCalldata);
    const sessionAddress = await session.address();
    if (!sessionAddress) return
    const [tgt, cdata] = await privyClient.put(sessionAddress, [
          {field: 'target', value: stateMeTarget},
          {field: 'calldata', value: stateMeCalldata},
        ]);
    alert(`Saved Target ${tgt.text()} and calldata ${cdata.text()} to privy.`)
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
        <title>Stupidsig</title>
        <meta name="description" content="StupidSig multisig for Ethereum" />
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
            SuperSig Dashboard!
          </h1>
          {web3Provider ? (
            <div>
              <div>
                <button className={styles.btnb} type="button" onClick={disconnect}>
                  Disconnect
                </button>
              </div>
              <div>
                <label>Proposal ID: <input className={styles.inpt} type="number" min="1" value={stateProposalId} onChange={handleProposalIdChange}></input></label>
              </div>
              <div className='grid grid-cols-3 gap-4'>
                <label>Multisig Address: 
                  <input className={styles.inpt} type="text" value={stateMeMultiSigAddr} onChange={handleLocalUIMsigAddrChange}></input>
                </label>
                <label>Target Address: 
                  <input className={styles.inpt} type="text" value={stateMeTarget} onChange={handleLocalUITargetChange}></input>
                </label>
                <label>Desired Calldata: 
                  <input className={styles.inpt} type="text" value={stateMeCalldata} onChange={handleLocalUICalldataChange}></input>
                </label>

                <label>Friend 1 Address:<input className={styles.inpt} value={localFriend1Addr} onChange={handleLocalFriend1AddrChange}></input></label>
                <label>Friend 1 Target: 
                  <input className={styles.inpt} type="text" value={stateFriend1Target} readOnly></input>
                </label>
                <label>Friend 1 Calldata: 
                  <input className={styles.inpt} type="text" value={stateFriend1Calldata} readOnly></input>
                </label>

                <label>Friend 2 Address:<input className={styles.inpt} value={localFriend2Addr} onChange={handleLocalFriend2AddrChange}></input></label>
                <label>Friend 2 Target: 
                  <input className={styles.inpt} type="text" value={stateFriend2Target} readOnly></input>
                </label>
                <label>Friend 2 Calldata: 
                  <input className={styles.inpt} type="text" value={stateFriend2Calldata} readOnly></input>
                </label>

              </div>
              <div className='mt-4 mb-4'>
                <button className={styles.btnb} type='button' onClick={fetchDataFromPrivy}>Get From Privy</button>
                <button className={styles.btnb} type="button" onClick={handleSaveInfo}>Save to Privy</button>
                <button className={styles.btnb} type="button" onClick={pushHashToContract}>Push Hash to Contract</button>
                <button className={styles.btnb} type="button" onClick={approveProposal}>Approve Proposal</button>
                <button className={styles.btnb} type="button" onClick={submitTransaction}>Submit Transaction</button>
              </div>
              <hr className='mt-8 mb-3'/>
              <div>
                <h1 className='text-3xl font-bold'>
                  Deploy new Supersig 
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
