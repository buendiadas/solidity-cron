const advanceToBlock = require('./advanceToBlock')
let asciichart = require('asciichart')
const PeriodContract = artifacts.require('Period')
let s0

module.exports = async () => {
  Period = await PeriodContract.new(5)
  s0 = new Array(32)
  for (var i = 1; i < s0.length; i++) {
      console.log("[i] = " + i)
      const height = await Period.height.call()
      const lastEpochBlock = await Period.getLastEpochBlock.call();
      const calculatedPeriod = await Period.height.call()
      const blockOffset = await Period.blockOffset.call()
      const getOffset = await Period.getFirstEpochBlock.call();
      const epochOffset = await Period.epochOffset.call();
      const relativeIndex = await Period.getRelativeIndex.call();
      console.log("Height = " + height + "\n" +
          "Epoch offset" + epochOffset + "\n" + 
          "Block Offset = "+ blockOffset.toNumber() + "\n" + 
          "Last Epoch Block = " + lastEpochBlock.toNumber() + "\n" + 
          "First Block = " + getOffset.toNumber() + "\n" + 
          "Relative index = " + relativeIndex.toNumber());
      finalheight = await Period.height.call()
      s0[i] = finalheight.toNumber()
      await advanceToBlock.advanceToBlock(web3.eth.blockNumber + 1, web3);

      if (i == 6){
        await Period.setPeriodLength(3);
        s0[i] = finalheight.toNumber()
        console.log("\n" + "**********------------------------------------Change Period----------------------------------------*****************" + "\n")
      }
  }
  s0[0] = 0;
  console.log(s0)
  console.log(asciichart.plot(s0))
}
