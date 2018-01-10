const Standard20TokenContract = artifacts.require('Standard20Token')
const PrivateListContract = artifacts.require('PrivateList')

let PrivateList
let FrontierToken


contract('PrivateList', function (accounts) {
  beforeEach(async() => {
    FrontierToken = await Standard20TokenContract.new()
    PrivateList = await PrivateListContract.new({from:accounts[0]})
  })

  it('Should have set as an owner the creator of the List', async () => {
    const owner = await PrivateList.owner.call()
    assert.strictEqual(accounts[0], owner)
  })

})
