const TRLContract = artifacts.require('TRL')

contract('TRL22222', function (accounts) {
  const rinkebyDeployedAddress = TRLContract.networks['4'].address

  describe('Testing stuff', async () => {
    it('Hello World', async () => {
      assert.strictEqual(1, 1)
    })
    it('Testnet contract', async () => {
      let deployedTRLContract = await TRLContract.at(rinkebyDeployedAddress)
      console.log(deployedTRLContract)
      assert.strictEqual(1, 1)
    })
  })
})
