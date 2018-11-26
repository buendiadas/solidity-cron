const TracksCreationContract = artifacts.require('Traceable')
let TracksCreationInstance
let PeriodInstance
let deployBlockNumber
let deployTimestamp

contract('Traceable', function (accounts) {
  beforeEach(async () => {
    TracksCreationInstance = await TracksCreationContract.new()
    deployTimestamp = await web3.eth.getBlock(web3.eth.blockNumber).timestamp
    deployBlockNumber = web3.eth.blockNumber
  })
  describe('Calculating Height', async () => {
    it('Should record the transaction block properly', async () => {
      const contractBlock = await TracksCreationInstance.creationBlock()
      assert.equal(deployBlockNumber, contractBlock.toNumber())
    })
    it('Should record the transaction timestamp properly', async () => {
      const contractTimestamp = await TracksCreationInstance.creationTimestamp()
      assert.equal(deployTimestamp, contractTimestamp.toNumber())
    })
  })
})
