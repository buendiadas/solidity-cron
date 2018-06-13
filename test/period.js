var advanceToBlock = require('./helpers/advanceToBlock')
var asciichart = require('asciichart')

const PeriodContract = artifacts.require('Period')
let Period
const T = Math.floor(Math.random() * (10 - 5) + 5) // Setting an arbitrary period between 10 and 5 Blocks
let initialOffset

contract('Period', function (accounts) {
  beforeEach(async () => {
    Period = await PeriodContract.new(T)
    initialOffset = await Period.initOffset()
  })
  describe('Calculating period number', async () => {
    it('Should have set the initial offset to the current block number', async () => {
      const currentBlock = await web3.eth.blockNumber
      assert.strictEqual(initialOffset.toNumber(), currentBlock)
    })
    it('Should start at period 0', async () => {
      const offset = await Period.initOffset()
      const currentPeriod = await Period.getPeriodNumber()
      assert.strictEqual(currentPeriod.toNumber(), 0)
    })
    it('Should return return the same period when increasing evm an arbitrary number of periods', async () => {
      const periodsToadvance = Math.floor(Math.random() * (20 - T) + T)
      const blocksToAdvance = T * periodsToadvance
      await advanceToBlock.advanceToBlock(web3.eth.blockNumber + blocksToAdvance)
      const calculatedPeriod = await Period.getPeriodNumber()
      assert.strictEqual(calculatedPeriod.toNumber(), periodsToadvance)
    })
  })
  describe('Calculating offset', async () => {
    it('Should have set the initial offset to the current block number', async () => {
      const currentBlock = await web3.eth.blockNumber
      assert.strictEqual(initialOffset.toNumber(), currentBlock)
    })
    it('Should increase offset by N times the period amount after moving N Periods forward', async () => {
      const currentBlock = await web3.eth.blockNumber
      const currentOffset = await Period.getOffset()
      const periodsToadvance = Math.floor(Math.random() * (20 - T) + T)
      const blocksToAdvance = T * periodsToadvance
      const expectedOffset = currentOffset.toNumber() + blocksToAdvance
      await advanceToBlock.advanceToBlock(web3.eth.blockNumber + blocksToAdvance)
      const finalOffset = await Period.getOffset()
      assert.strictEqual(expectedOffset, finalOffset.toNumber())
    })
  })
  describe('Calculating relative indexes', async () => {
    it('Should keep the same relative index after increasing a period', async () => {
      const initialRelativeIndex = await Period.getRelativeIndex()
      const periodsToadvance = Math.floor(Math.random() * (20 - T) + T)
      const blocksToAdvance = T * periodsToadvance
      await advanceToBlock.advanceToBlock(web3.eth.blockNumber + blocksToAdvance)
      const finalRelativeIndex = await Period.getRelativeIndex()
      assert.strictEqual(finalRelativeIndex.toNumber(), initialRelativeIndex.toNumber())
    })
    it('Should keep the add by one the relative index after increasing a block, when not in bounds', async () => {
      const initialRelativeIndex = 1
      const currentRelativeIndex = await Period.getRelativeIndex()
      const blocksToMoveBackwards = currentRelativeIndex - initialRelativeIndex
      const currentPeriod = await Period.getPeriodNumber()
      const blocksToAddToEVM = T - blocksToMoveBackwards + 1
      await advanceToBlock.advanceToBlock(web3.eth.blockNumber + blocksToAddToEVM)
      const finalRelativeIndex = await Period.getRelativeIndex()
      assert.strictEqual(finalRelativeIndex.toNumber(), initialRelativeIndex + 1)
    })
  })
})
