require('dotenv').config()
require('babel-register')
require('babel-polyfill')
const HDWalletProvider = require('truffle-hdwallet-provider')
const mnemonic = 'brand insane federal bargain nice pilot recall zero disagree action arrive hint'

module.exports = {
  networks: {
    development: {
      host: 'localhost',
      port: 8545,
      network_id: '1212',
      gas: 6721975,
      gasPrice: 1

    },
    development_integration_test: {
      host: 'localhost',
      port: 7545,
      network_id: '1212',
      gas: 6721975

    },
    development_migration_test: {
      host: 'localhost',
      port: 8546,
      network_id: '1212',
      gas: 6721975
    },
    rinkeby: {
      host: 'localhost',
      port: 8545,
      network_id: 4,
      gas: 6721975,
      gasPrice: 4
    },
    rinkeby_infura: {
      provider: function () {
        return new HDWalletProvider(mnemonic, 'https://rinkeby.infura.io/xzValG5J1iIcK29rdTFK')
      },
      network_id: 4
    },
    rinkeby_frontier: {
      provider: function () {
        return new HDWalletProvider(mnemonic, 'http://18.188.91.154:8545')
      },
      network_id: 4
    }
  },
  mocha: {
    reporter: 'eth-gas-reporter',
    reporterOptions : {
      currency: 'CHF',
      gasPrice: 21
    }
  }
}
