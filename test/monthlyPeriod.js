var advanceToBlock = require('./helpers/advanceToBlock')
const moment = require('moment')
const time = require('./helpers/time')
const PeriodContract = artifacts.require('Monthly')
const periodsToadvance = 432
let PeriodInstance
const T = 1
let initialOffset
let startTime
let startTimeMoment


contract('Montly Period', function (accounts) {
  beforeEach(async () => {
    PeriodInstance = await PeriodContract.new(T)
    startTime = await web3.eth.getBlock(web3.eth.blockNumber).timestamp
    startTimeMoment = await moment.unix(startTime)
  })
  describe('Calculating Height', async () => {
    it('Should start having a height of 0', async () => {
      const height = await PeriodInstance.height()
      assert.strictEqual(0, height.toNumber())
    }),
    it('Should return 1 as length when being a  daily', async () => {
      const length = await PeriodInstance.length()
      assert.strictEqual(1, length.toNumber())
    }),
    it('Should return return the same period when increasing evm an arbitrary number of months', async () => {
      const monthsToAdvance = T * periodsToadvance
      const creationTimestamp = await PeriodInstance.creationTimestamp()
      const timeAfter = moment(startTimeMoment).add(monthsToAdvance, 'months')
      await time.increaseTo(timeAfter.unix())
      const heightOf = await PeriodInstance.heightOf(timeAfter.unix())
      const height = await PeriodInstance.height()
      assert.strictEqual(height.toNumber(), monthsToAdvance)
    })
  })
})
