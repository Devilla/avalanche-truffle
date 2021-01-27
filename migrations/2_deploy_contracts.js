const Storage = artifacts.require("Storage");

module.exports = function (deployer) {
  deployer.deploy(Storage);

  // Deploy Dai
  await deployer.deploy(Dai, '5777');
  const dai = await Dai.deployed();

  //Deploy EthSwap with Dai
  await deployer.deploy(EthSwap, dai.address);
  ethSwap =  await EthSwap.deployed();
  // Mint 0.001 Dai to EthSwap
  await dai.transfer(ethSwap.address, '1000000000000000000000000');

};
