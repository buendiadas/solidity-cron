const EthJs = require('ethjs')
const truffleConfig = require('../../truffle.js')
//const eth = new EthJs(truffleConfig.networks.development2.provider())

const promisify = (inner) =>
  new Promise((resolve, reject) =>
    inner((err, res) => {
      if (err) { reject(err) }

      resolve(res)
    })
  )

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
    if (await promisify(web3.eth.blockNumber) > number) {
      // throw Error(`block number ${number} is in the past (current is ${eth.blockNumber})`)
      throw Error(`block number ${number} is in the past (current is dededede)`)
    }

    let currBlock = await promisify(web3.eth.blockNumber)
    while (currBlock < number) {
      await advanceBlock()
      currBlock = await promisify(web3.eth.blockNumber)
    }
  }
}
