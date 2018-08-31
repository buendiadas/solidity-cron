var advanceToBlock = require('./helpers/advanceToBlock')
var asciichart = require('asciichart')

const PeriodContract = artifacts.require('Period')
let PeriodInstance
const T = 10
let initialOffset

contract('Period', function (accounts) {
  beforeEach(async () => {
    PeriodInstance = await PeriodContract.new(T)
  })
  describe('Calculating period number', async () => {
    it('Should have set the initial offset to the current block number', async () => {
      const currentBlock = await web3.eth.blockNumber
      const blockOffset = await PeriodInstance.blockOffset.call()
      assert.strictEqual(currentBlock, blockOffset.toNumber())
    })
    it('Should start at period 0', async () => {
      const currentPeriod = await PeriodInstance.height()
      assert.strictEqual(currentPeriod.toNumber(), 0)
    })
    it('Should return return the same period when increasing evm an arbitrary number of periods', async () => {
      const periodsToadvance = 4
      const blocksToAdvance = T * periodsToadvance
      await advanceToBlock.advanceToBlock(web3.eth.blockNumber + blocksToAdvance)
      const calculatedPeriod = await PeriodInstance.height()
      assert.strictEqual(calculatedPeriod.toNumber(), periodsToadvance)
    })
  })
  describe('Calculating First Epoch"s Block', async () => {
    it('Should have set the first epoch block to the current block number', async () => {
      const currentBlock = await web3.eth.blockNumber
      const storedInitialBlockOffset = await PeriodInstance.getFirstEpochBlock()
      assert.strictEqual(storedInitialBlockOffset.toNumber(), currentBlock)
    })
    it('Should keep the same first epoch block while making a transition to a new age', async () => {
      const currentBlock = await web3.eth.blockNumber
      const storedInitialBlockOffset = await PeriodInstance.getFirstEpochBlock()
      await PeriodInstance.setPeriodLength(T + 1)
      const isInTransition = await PeriodInstance.isAgeTransition();
      assert.strictEqual(true,isInTransition);
      const computedInitialBlockOffset = await PeriodInstance.getFirstEpochBlock()
      assert.strictEqual(storedInitialBlockOffset.toNumber(), computedInitialBlockOffset.toNumber())
    })
    it('Should increase the first epoch block by N times the period amount after moving N epochs forward', async () => {
      const currentBlock = await web3.eth.blockNumber
      const firstEpochBlock = await PeriodInstance.getFirstEpochBlock()
      const periodsToadvance = 4
      const blocksToAdvance = T * periodsToadvance
      const expectedFirstBlock = firstEpochBlock.toNumber() + blocksToAdvance
      await advanceToBlock.advanceToBlock(web3.eth.blockNumber + blocksToAdvance)
      const finalFirstBlock= await PeriodInstance.getFirstEpochBlock()
      assert.strictEqual(expectedFirstBlock, finalFirstBlock.toNumber())
    })
  })
  describe('Calculating Last Epoch"s Block', async () => {
    it('Should have set the first epoch block to the current block number + T', async () => {
      const currentBlock = await web3.eth.blockNumber
      const calculatedLastEpoch = await PeriodInstance.getLastEpochBlock.call()
      assert.strictEqual(currentBlock + T - 1, calculatedLastEpoch.toNumber())
    })
    it('Should keep the same last epoch block while making a transition to a new age', async () => {
      const currentBlock = await web3.eth.blockNumber
      const storedLastBlockOffset = await PeriodInstance.getLastEpochBlock()
      await PeriodInstance.setPeriodLength(T + 1)
      const isInTransition = await PeriodInstance.isAgeTransition();
      assert.strictEqual(true,isInTransition);
      const computedLastBlockOffset = await PeriodInstance.getLastEpochBlock()
      assert.strictEqual(storedLastBlockOffset.toNumber(), computedLastBlockOffset.toNumber())
    })
    it('Should increase the first epoch block by N times the period amount after moving N epochs forward', async () => {
      const currentBlock = await web3.eth.blockNumber
      const lastEpochBlock = await PeriodInstance.getLastEpochBlock()
      const periodsToadvance = 4
      const blocksToAdvance = T * periodsToadvance
      const expectedLastBlock = lastEpochBlock.toNumber() + blocksToAdvance
      await advanceToBlock.advanceToBlock(web3.eth.blockNumber + blocksToAdvance)
      const finalLastBlock = await PeriodInstance.getLastEpochBlock()
      assert.strictEqual(expectedLastBlock, finalLastBlock.toNumber())
    })
  })
  describe('Modifying the Period Length', async () => {
    it('Should modify the period (T) to a new value', async () => {
      await PeriodInstance.setPeriodLength(T + 1)
      const newPeriodLength = await PeriodInstance.T.call()
      assert.strictEqual(T + 1, newPeriodLength.toNumber())
    })
    it('Should keep the same height before the end of the current epoch', async () => {
      const currentHeight = await PeriodInstance.height.call()
      const expectedHeight = currentHeight.toNumber() + 1
      const blocksToAdvance = T * (expectedHeight - currentHeight)
      await advanceToBlock.advanceToBlock(web3.eth.blockNumber + blocksToAdvance)
      await PeriodInstance.setPeriodLength(T + 1)
      assert(PeriodInstance.getRelativeIndex != 0)
      const computedHeight = await PeriodInstance.height.call()
      assert.strictEqual(expectedHeight, computedHeight.toNumber())
    })
    it('Should keep the same age height before the end of the epoch', async () => {
      const currentAgeHeight = await PeriodInstance.ageHeight.call()
      const currentRelativeIndex = await PeriodInstance.getRelativeIndex.call()
      const expectedHeight = currentAgeHeight.toNumber()
      const blocksToAdvance = T
      await PeriodInstance.setPeriodLength(T - 1)
      await advanceToBlock.advanceToBlock(web3.eth.blockNumber + blocksToAdvance)
      const computedHeight = await PeriodInstance.ageHeight.call()
      assert.strictEqual(expectedHeight, computedHeight.toNumber())
    })
    it('Should start working with the new period length after the current epoch has ended', async () => {
      const currentHeight = await PeriodInstance.height.call()
      const currentRelativeIndex = await PeriodInstance.getRelativeIndex.call() 
      await PeriodInstance.setPeriodLength(2) 
      const blocksToAdvance = T 
      await advanceToBlock.advanceToBlock(web3.eth.blockNumber + blocksToAdvance);
      const computedHeight = await PeriodInstance.height.call() 
      const afterRelativeIndex = await PeriodInstance.getRelativeIndex.call()
      const expectedHeight = currentHeight.toNumber() + 2 
      assert.strictEqual(expectedHeight, computedHeight.toNumber())
    })
  })
  describe('Calculating relative indexes', async () => {
    it('Should keep the same relative index after increasing a period', async () => {
      const initialRelativeIndex = await PeriodInstance.getRelativeIndex()
      const periodsToadvance = 4
      const blocksToAdvance = T * periodsToadvance
      await advanceToBlock.advanceToBlock(web3.eth.blockNumber + blocksToAdvance)
      const finalRelativeIndex = await PeriodInstance.getRelativeIndex()
      assert.strictEqual(finalRelativeIndex.toNumber(), initialRelativeIndex.toNumber())
    })
    it('Should keep the add by one the relative index after increasing a block, when not in bounds', async () => {
      const initialRelativeIndex = 1
      const currentRelativeIndex = await PeriodInstance.getRelativeIndex()
      const blocksToMoveBackwards = currentRelativeIndex - initialRelativeIndex
      const currentPeriod = await PeriodInstance.height()
      const blocksToAddToEVM = T - blocksToMoveBackwards + 1
      await advanceToBlock.advanceToBlock(web3.eth.blockNumber + blocksToAddToEVM)
      const finalRelativeIndex = await PeriodInstance.getRelativeIndex()
      assert.strictEqual(finalRelativeIndex.toNumber(), initialRelativeIndex + 1)
    })
  })
  describe('Hard Changing period Length', async () => {
    it('Should increase the age number', async () => {
      const initialAge = await PeriodInstance.age.call();
      await PeriodInstance.hardAgeTransition(T + 1)
      const finalAge = await PeriodInstance.age.call();
      assert.strictEqual(initialAge.toNumber() + 1, finalAge.toNumber())
    })
  })
})
