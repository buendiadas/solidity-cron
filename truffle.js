require('dotenv').config()
require('babel-register')
require('babel-polyfill')
const HDWalletProvider = require("truffle-hdwallet-provider")
const mnemonic = "brand insane federal bargain nice pilot recall zero disagree action arrive hint"


module.exports = {
  networks: {
    development: {
      host: "localhost",
      port: 8545,
      network_id: "*",
      gas: 4600000
    },
    rinkeby: {
      host: "localhost",
      port: 8545,
      network_id: 4,
      gas: 4600000,
      gasPrice: 25000000000
    },
    rinkeby_infura: {
      provider: function() {
        return new HDWalletProvider(mnemonic, "https://rinkeby.infura.io/xzValG5J1iIcK29rdTFK")
      },
      network_id: 4
    }   
  }
}
