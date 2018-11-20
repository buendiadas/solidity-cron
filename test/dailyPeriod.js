var advanceToBlock = require('./helpers/advanceToBlock')
const moment = require('moment')
const time = require('./helpers/time');

var asciichart = require('asciichart')

const PeriodContract = artifacts.require('Daily')
let PeriodInstance
const T = 1
let initialOffset
let startTime
let startTimeMoment

contract('Daily Period', function (accounts) {
  beforeEach(async () => {
    PeriodInstance = await PeriodContract.new(T)
    startTime = await web3.eth.getBlock(web3.eth.blockNumber).timestamp;

    startTimeMoment = await moment.unix(startTime)
    const timeAfter = moment(startTimeMoment).add(1, 'months')
  })
  describe('Calculating Height', async () => {
    it('Should start having a height of 0', async () => {
      const height = await PeriodInstance.height()
      assert.strictEqual(0, height.toNumber())
    }),
    it('Should return return the same period when increasing evm an arbitrary number of months', async () => {
      const periodsToadvance = 432;
      const daysToAdvance = T * periodsToadvance
      const creationTimestamp = await PeriodInstance.creationTimestamp();
      const timeAfter = moment(startTimeMoment).add(daysToAdvance, 'days')
      await time.increaseTo(timeAfter.unix())
      const height = await PeriodInstance.height()
      assert.strictEqual(height.toNumber(), daysToAdvance)
    })
  })
})