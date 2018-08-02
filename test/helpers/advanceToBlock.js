const EthJs = require('ethjs')
const truffleConfig = require('../../truffle.js')
const eth = new EthJs(truffleConfig.networks.development2.provider())

module.exports = {
  advanceBlock: function () {
    return new Promise((resolve, reject) => {
      web3.currentProvider.sendAsync({
        jsonrpc: '2.0',
        method: 'evm_mine',
        id: Date.now()
      }, (err, res) => {
        return err ? reject(err) : resolve(res)
      })
    })
  },

  // Advances the block number so that the last mined block is `number`.
  advanceToBlock: async function (number) {
    let advanceBlock = this.advanceBlock
    if (eth.blockNumber > number) {
      throw Error(`block number ${number} is in the past (current is ${eth.blockNumber})`)
    }

    while (eth.blockNumber < number) {
      await advanceBlock()
    }
  }
}
