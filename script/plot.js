const advanceToBlock = require('./advanceToBlock')
let asciichart = require('asciichart')
const PeriodContract = artifacts.require('Period')
let s0

module.exports = async () => {
  Period = await PeriodContract.new(5)
  s0 = new Array(20)
  for (var i = 0; i < s0.length; i++) {
    const calculatedPeriod = await Period.getPeriodNumber()
    await advanceToBlock.advanceToBlock(web3.eth.blockNumber + 1, web3)
    s0[i] = await Period.getPeriodNumber()
  }
  console.log(s0)
  console.log(asciichart.plot(s0))
}
