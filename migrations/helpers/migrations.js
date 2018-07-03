var fs = require('fs')

export function updateDeployed () {
  return new Promise((resolve, reject) => {
    web3.currentProvider.sendAsync({
      jsonrpc: '2.0',
      method: 'evm_mine',
      id: Date.now()
    }, (err, res) => {
      return err ? reject(err) : resolve(res)
    })
  })
}
