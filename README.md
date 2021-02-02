# avalanche-truffle
Using Truffle with the Avalanche C-Chain

## Introduction
Truffle Suite is a toolkit for launching decentralized applications (dapps) on the EVM. With Truffle you can write and compile smart contracts, build artifacts, run migrations and interact with deployed contracts. This tutorial illustrates how Truffle can be used with Avalanche's C-Chain, which is an instance of the EVM.

## Requirements
You've completed [Run an Avalanche Node](https://github.com/ava-labs/avalanchego/blob/master/README.md) and are familiar with [Avalanche's architecture](https://docs.avax.network/learn/platform-overview).

### Run an Avalanche Node
## Installation

Avalanche is an incredibly lightweight protocol, so the minimum computer requirements are quite modest.

- Hardware: 2 GHz or faster CPU, 4 GB RAM, 2 GB hard disk.
- OS: Ubuntu >= 18.04 or Mac OS X >= Catalina.
- Software: [Go](https://golang.org/doc/install) version >= 1.15.5 and set up [`$GOPATH`](https://github.com/golang/go/wiki/SettingGOPATH).
- Network: IPv4 or IPv6 network connection, with an open public port.

### Native Install

Clone the AvalancheGo repository:

```sh
go get -v -d github.com/ava-labs/avalanchego/...
cd $GOPATH/src/github.com/ava-labs/avalanchego
```

#### Building the Avalanche Executable

Build Avalanche using the build script:

```sh
./scripts/build.sh
```

The Avalanche binary, named `avalanchego`, is in the `build` directory.

### Docker Install

- Make sure you have docker installed on your machine (so commands like `docker run` etc. are available).
- Build the docker image of latest avalanchego branch by `./scripts/build_image.sh`.
- Check the built image by `docker image ls`, you should see some image tagged
  `avalanchego-xxxxxxxx`, where `xxxxxxxx` is the commit id of the Avalanche source it was built from.
- Test Avalanche by `docker run -ti -p 9650:9650 -p 9651:9651 avalanchego-xxxxxxxx /avalanchego/build/avalanchego
   --network-id=local --staking-enabled=false --snow-sample-size=1 --snow-quorum-size=1`. (For a production deployment,
  you may want to extend the docker image with required credentials for
  staking and TLS.)

## Running Avalanche

### Connecting to Mainnet

To connect to the Avalanche Mainnet, run:

```sh
./build/avalanchego
```

You should see some pretty ASCII art and log messages.

You can use `Ctrl+C` to kill the node.

### Connecting to Fuji

To connect to the Fuji Testnet, run:

```sh
./build/avalanchego --network-id=fuji
```

### Creating a Local Testnet

To create a single node testnet, run:

```sh
./build/avalanchego --network-id=local --staking-enabled=false --snow-sample-size=1 --snow-quorum-size=1
```

This launches an Avalanche network with one node.

## Dependencies
Avash is a tool for running a local Avalanche network. It's similar to Truffle's Ganache.
NodeJS v8.9.4 or later.
Truffle, which you can install with npm install -g truffle

## Start up a local Avalanche network
Avash allows you to spin up private test network deployments with up to 15 AvalancheGo nodes out-of-the-box. Avash supports automation of regular tasks via lua scripts. This enables rapid testing against a wide variety of configurations. The first time you use avash you'll need to install and build it.
Start a local five node Avalanche network:
```
cd /path/to/avash
# build Avash if you haven't done so
go build
# start Avash
./avash
# start a five node staking network
runscript scripts/five_node_staking.lua
```
A five node Avalanche network is running on your machine. When you want to exit Avash, run exit, but don't do that now, and don't close this terminal tab.

## Create truffle directory and install dependencies
Open a new terminal tab to so we can create a truffle directory and install some further dependencies.

First, navigate to the directory within which you intend to create your truffle working directory:
```
cd /path/to/directory
```
Create and enter a new directory named truffle:
```
mkdir truffle; cd truffle
```
Use npm to install web3, which is a library through which we can talk to the EVM:
```
npm install web3 -s
```
We'll use web3 to set an HTTP Provider which is how web3 will speak to the EVM. Lastly, create a boilerplace truffle project:
```
truffle init
```
Update truffle-config.js
One of the files created when you ran truffle init is truffle-config.js. Add the following to truffle-config.js.
```
const Web3 = require('web3');
const protocol = "http";
const ip = "localhost";
const port = 9650;
module.exports = {
  networks: {
   development: {
     provider: function() {
      return new Web3.providers.HttpProvider(`${protocol}://${ip}:${port}/ext/bc/C/rpc`)
     },
     network_id: "*",
     gas: 3000000,
     gasPrice: 470000000000,
     timeoutBlocks: 60 // must be greater than Web3's default (50)
   }
  }
};
```
Note that you can change the protocol, ip and port if you want to direct API calls to a different AvalancheGo node. Also note that we're setting the gasPrice and gas to the appropriate values for the Avalanche C-Chain.

## Add Storage.sol
In the contracts directory add a new file called Storage.sol and add the following block of code:
```
// SPDX-License-Identifier: MIT
pragma solidity >=0.4.22 <0.8.0;

/**
 * @title Storage
 * @dev Store & retrieve value in a variable
 */
contract Storage {

    uint256 number;

    /**
     * @dev Store value in variable
     * @param num value to store
     */
    function store(uint256 num) public {
        number = num;
    }

    /**
     * @dev Return value 
     * @return value of 'number'
     */
    function retrieve() public view returns (uint256){
        return number;
    }
}
```
Storage is a solidity smart contract which lets us write a number to the blockchain via a store function and then read the number back from the blockchain via a retrieve function.

## Add new migration
Create a new file in the migrations directory named 2_deploy_contracts.js, and add the following block of code. This handles deploying the Storage smart contract to the blockchain.
const Storage = artifacts.require("Storage");
```
module.exports = function (deployer) {
  deployer.deploy(Storage);
};
```
## Compile Contracts with Truffle

Any time you make a change to Storage.sol you need to run truffle compile.
```truffle compile```
You should see:
```
Compiling your contracts...
===========================
> Compiling ./contracts/Migrations.sol
> Compiling ./contracts/Storage.sol
> Artifacts written to /path/to/build/contracts
> Compiled successfully using:
   - solc: 0.5.16+commit.9c3226ce.Emscripten.clang
```
## Create, fund and unlock an account on the C-Chain

When deploying smart contracts to the C-Chain, truffle will default to the first available account provided by your C-Chain client as the from address used during migrations.

### Create an account
Truffle has a very useful console which we can use to interact with the blockchain and our contract. Open the console:
```
truffle console --network development
```
Then, in the console, create the account:
```
truffle(development)> let account = await web3.eth.personal.newAccount()
```
This returns:
```
undefined
```
Print the account:
```
truffle(development)> account
```
This prints the account:
```
'0x090172CD36e9f4906Af17B2C36D662E69f162282'
```
Unlock your account:
```
truffle(development)> await web3.eth.personal.unlockAccount(account[0])
true
```

### Fund your account
Follow the steps in the Transfer AVAX Between X-Chain and C-Chain tutorial to fund the newly created account. You'll need to send at least 135422040 nAVAX to the account to cover the cost of contract deployments.

## Run Migrations
Now everything is in place to run migrations and deploy the Storage contract:
```
truffle migrate --network development
```
You should see:
```
Migrations dry-run (simulation)
===============================
> Network name:    'development-fork'
> Network id:      1
> Block gas limit: 8000000 (0x7a1200)


1_initial_migration.js
======================

   Replacing 'Migrations'
   ----------------------
   > block number:        25053
   > block timestamp:     1611664511
   > account:             0xDBe18A793Ae04ebE3e1Ed89764c4e15954799A17
   > balance:             4.66610851
   > gas used:            176943 (0x2b32f)
   > gas price:           470 gwei
   > value sent:          0 ETH
   > total cost:          0.08316321 ETH

   -------------------------------------
   > Total cost:          0.08316321 ETH


2_deploy_contracts.js
=====================

   Replacing 'Storage'
   -------------------
   > block number:        25055
   > block timestamp:     1611664512
   > account:             0xDBe18A793Ae04ebE3e1Ed89764c4e15954799A17
   > balance:             4.60805082
   > gas used:            96189 (0x177bd)
   > gas price:           470 gwei
   > value sent:          0 ETH
   > total cost:          0.04520883 ETH

   -------------------------------------
   > Total cost:          0.04520883 ETH


Summary
=======
> Total deployments:   2
> Final cost:          0.12837204 ETH





Starting migrations...
======================
> Network name:    'development'
> Network id:      1
> Block gas limit: 8000000 (0x7a1200)


1_initial_migration.js
======================

   Replacing 'Migrations'
   ----------------------
   > transaction hash:    0x91feb388f2ff3fd03c14be8a0d94351366b1cde0716981df65238de9ac55255c
   > Blocks: 0            Seconds: 0
   > contract address:    0xE2F7Ed031aF0B7A27f3bF11AAa2e1aFD6501442E
   > block number:        25053
   > block timestamp:     1611664512
   > account:             0xDBe18A793Ae04ebE3e1Ed89764c4e15954799A17
   > balance:             4.74927172
   > gas used:            191943 (0x2edc7)
   > gas price:           470 gwei
   > value sent:          0 ETH
   > total cost:          0.09021321 ETH


   > Saving migration to chain.
   > Saving artifacts
   -------------------------------------
   > Total cost:          0.09021321 ETH


2_deploy_contracts.js
=====================

   Replacing 'Storage'
   -------------------
   > transaction hash:    0x0c6bb15eb865e8077d67e055789624c24fcc69defedbf3522ac3f6bb8e1b3fce
   > Blocks: 0            Seconds: 0
   > contract address:    0xe269848b62025E1BDFd3643c5cDc3D8a4D70Ca2f
   > block number:        25055
   > block timestamp:     1611664514
   > account:             0xDBe18A793Ae04ebE3e1Ed89764c4e15954799A17
   > balance:             4.74927172
   > gas used:            96189 (0x177bd)
   > gas price:           470 gwei
   > value sent:          0 ETH
   > total cost:          0.04520883 ETH


   > Saving migration to chain.
   > Saving artifacts
   -------------------------------------
   > Total cost:          0.04520883 ETH


Summary
=======
> Total deployments:   2
> Final cost:          0.13542204 ETH
```

If you didn't create an account on the C-Chain you'll see this error:
```Error: Expected parameter 'from' not passed to function.```
If you didn't fund the account, you'll see this error:
```
Error:  *** Deployment Failed ***

"Migrations" could not deploy due to insufficient funds
   * Account:  0x090172CD36e9f4906Af17B2C36D662E69f162282
   * Balance:  0 wei
   * Message:  sender doesn't have enough funds to send tx. The upfront cost is: 1410000000000000000 and the sender's account only has: 0
   * Try:
      + Using an adequately funded account
```      
If you didn't unlock the account, you'll see this error:
```
Error:  *** Deployment Failed ***

"Migrations" -- Returned error: authentication needed: password or unlock.
```
## Interacting with your contract
Now the Storage contract has been deployed. Let's write a number to the blockchain and then read it back. Open the truffle console again:
```
truffle console --network development
```
Get an instance of the deployed Storage contract:
```
truffle(development)> let instance = await Storage.deployed()
```
This returns:
```
undefined
```
### Writing a number to the blockchain
Now that you have an instance of the Storage contract, call it's store method and pass in a number to write to the blockchain.
```
truffle(development)> instance.store(1234)
```
If you see this error:
```
Error: Returned error: authentication needed: password or unlock
```
Then run this again: 
```
node web3_script.js
```
You should see something like:
```
{
  tx: '0x11e58447abebf7eee4d8f6bdaaf832e48c40bbcf76f295e5b642ab4a09f51676',
  receipt: {
    blockHash: '0xad6f129c6f4a06e19c017a03f857cb90ac266880262c2b3e6ebd19c32a41f863',
    blockNumber: 25061,
    contractAddress: null,
    cumulativeGasUsed: 41458,
    from: '0xdbe18a793ae04ebe3e1ed89764c4e15954799a17',
    gasUsed: 41458,
    logs: [],
    logsBloom: '0x00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000',
    status: true,
    to: '0xe269848b62025e1bdfd3643c5cdc3d8a4d70ca2f',
    transactionHash: '0x11e58447abebf7eee4d8f6bdaaf832e48c40bbcf76f295e5b642ab4a09f51676',
    transactionIndex: 0,
    rawLogs: []
  },
  logs: []
}
````
### Reading a number from the blockhain

To read the number from the blockchain, call the retrieve method of the Storage contract instance.
```
truffle(development)> let i = await instance.retrieve()
```
This should return:
```
undefined
```
The result of the call to retrieve is a BN (big number). Call its .toNumber method to see the value:
```
truffle(development)> i.toNumber()
```
You should see the number you stored.
```
1234
```

## Summary
Now you have the tools you need to launch a local Avalanche network, create a truffle project, as well as create, compile, deploy and interact with Solidity contracts.
