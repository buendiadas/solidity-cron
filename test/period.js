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
  describe('Calculating offset', async () => {
    it('Should have set the initial offset to the current block number', async () => {
      const currentBlock = await web3.eth.blockNumber
      const storedInitialBlockOffset = await PeriodInstance.blockOffset.call()
      assert.strictEqual(storedInitialBlockOffset.toNumber(), currentBlock)
    })
    it('Should increase offset by N times the period amount after moving N Periods forward', async () => {
      const currentBlock = await web3.eth.blockNumber
      const currentOffset = await PeriodInstance.getOffset()
      const periodsToadvance = 4
      const blocksToAdvance = T * periodsToadvance
      const expectedOffset = currentOffset.toNumber() + blocksToAdvance
      await advanceToBlock.advanceToBlock(web3.eth.blockNumber + blocksToAdvance)
      const finalOffset = await PeriodInstance.getOffset()
      assert.strictEqual(expectedOffset, finalOffset.toNumber())
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
    it('Should keep the same height before the end of the new calculated Period', async () => {
      const currentHeight = await PeriodInstance.height.call()
      const currentRelativeIndex = await PeriodInstance.getRelativeIndex.call()
      const expectedHeight = currentHeight.toNumber()
      const blocksToAdvance = T
      await PeriodInstance.setPeriodLength(T - 1)
      await advanceToBlock.advanceToBlock(web3.eth.blockNumber + blocksToAdvance)
      const computedHeight = await PeriodInstance.height.call()
      assert.strictEqual(expectedHeight, computedHeight.toNumber())
    })
    it('Should start working with the new period after the current period has ended', async () => {
      const currentHeight = await PeriodInstance.height.call()
      const currentRelativeIndex = await PeriodInstance.getRelativeIndex.call()
      await PeriodInstance.setPeriodLength(2)
      const blocksToAdvance = T + 3
      await advanceToBlock.advanceToBlock(web3.eth.blockNumber + blocksToAdvance)
      const computedHeight = await PeriodInstance.height.call()
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
})
