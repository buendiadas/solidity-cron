require('babel-register')
require('babel-polyfill')

module.exports = {
  networks: {
    development: {
      host: 'localhost',
      port: 8545,
      network_id: '*',
      gas: 4600000
    },
    rinkeby: {
      host: 'localhost',
      port: 8545,
      network_id: 4,
      gas: 4600000,
      gasPrice: 25000000000
    }
  },
  mocha: {
    reporter: 'eth-gas-reporter',
    reporterOptions: {
      currency: 'USD',
      gasPrice: 21
    }
  }
}
