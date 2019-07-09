var advanceToBlock = require('./helpers/advanceToBlock')
const moment = require('moment')
const time = require('./helpers/time')

var asciichart = require('asciichart')

const PeriodContract = artifacts.require('Daily')
let PeriodInstance
let initialOffset
let startTime
let startTimeMoment

contract('Daily Period', function (accounts) {
  beforeEach(async () => {
    PeriodInstance = await PeriodContract.new()
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
    it('Should return return the same period when increasing evm an arbitrary number of days', async () => {
      const periodsToadvance = 432
      const daysToAdvance = periodsToadvance
      const creationTimestamp = await PeriodInstance.creationTimestamp()
      const timeAfter = moment(startTimeMoment).add(daysToAdvance, 'days')
      await time.increaseTo(timeAfter.unix())
      const height = await PeriodInstance.height()
      assert.strictEqual(height.toNumber(), daysToAdvance)
    })
  })
})
