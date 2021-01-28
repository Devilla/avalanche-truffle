const Dai = artifacts.require('Dai')
const EthSwap = artifacts.require('EthSwap')

 require('chai')
    .use(require('chai-as-promised'))
    .should()


contract('EthSwap', ([deployer, investor]) => {
  let dai, ethSwap
  before(async () => {
    dai = await Dai.deployed(43113)
    ethSwap = await EthSwap.new(dai.address)

    // Mint Dai
    await dai.mint(ethSwap.address, 1000000000000000);
  })

  describe('DAI deployment', async () =>{
    it('contract has a name', async () => {
      const name = await dai.name()
      assert.equal(name, 'Dai Stablecoin')
    })
  })

  describe('EthSwap deployment', async () =>{
    it('contract has a name', async () => {
      const name = await ethSwap.name()
      assert.equal(name, 'EthSwap Network Exchange')
    })

    it('contract has DAI tokens', async () => {
      let balance = await dai.balanceOf(ethSwap.address)
      assert.equal(balance.toString(), 1000000000000000)
    })
  })

  describe('Buy DAI Tokens', async () => {
    let result

    before( async () => {
      result = await ethSwap.buyTokens({ from : investor, value: web3.utils.toWei('0.00001', 'ether')})
    })
    it('allows user to buy tokens from EthSwap for a fixed price', async () => {
      // Check token balance after purchase
      let investorBalance = await dai.balanceOf(investor)
      assert.equal(investorBalance.toString(), 1000000000000000)

      // Check ethSwap balance after purchase
      let ethSwapBalance = await dai.balanceOf(ethSwap.address)
      assert.equal(ethSwapBalance.toString(), 0)
      let ethBalance = await web3.eth.getBalance(ethSwap.address)
      assert.equal(ethBalance, web3.utils.toWei('0.00001', 'ether'))

      // Check logs event was emitted with correct data
      let event = result.logs[0].args
      assert.equal(event.account, investor)
      assert.equal(event.token, dai.address)
      assert.equal(event.amount.toString(), 1000000000000000)
      assert.equal(event.rate.toString(), '100')
    })
  })

 describe('Sell DAI Tokens', async () => {
    let result

    before( async () => {
      // investor must approve the token before transaction
      await dai.approve(ethSwap.address, 1000000000000000, { from: investor})
      // investor sells tokens
      result = await ethSwap.sellToken(1000000000000000, { from: investor })
    })
    it('allows user to sell tokens to EthSwap for a fixed price', async () => {
      // Check token balance after sell
      let investorBalance = await dai.balanceOf(investor)
      assert.equal(investorBalance.toString(), 0)

      // Check ethSwap balance after purchase
      let ethSwapBalance = await dai.balanceOf(ethSwap.address)
      assert.equal(ethSwapBalance, 1000000000000000)
      let ethBalance = await web3.eth.getBalance(ethSwap.address)
      assert.equal(ethBalance, web3.utils.toWei('0', 'ether'))

      // Check logs event was emitted with correct data
      let event = result.logs[0].args
      assert.equal(event.account, investor)
      assert.equal(event.token, dai.address)
      assert.equal(event.amount.toString(), 1000000000000000)
      assert.equal(event.rate.toString(), '100')

      // FAILURE: investor can't sell more tokens than they have
      await ethSwap.sellToken(1000000000000000, { from: investor }).should.be.rejected
    })
  })
})
