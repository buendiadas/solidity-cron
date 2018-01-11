const expectThrow = require('./utils').expectThrow;
const Standard20TokenContract = artifacts.require('Standard20Token');
const PrivateListContract = artifacts.require('PrivateList');

let PrivateList;
let FrontierToken;


contract('PrivateList', function (accounts) {
  beforeEach(async() => {
    FrontierToken = await Standard20TokenContract.new();
    PrivateList = await PrivateListContract.new({from:accounts[0]});
  })

  it('Should have set as an owner the creator of the List', async () => {
    let owner = await PrivateList.owner.call();
    assert.strictEqual(accounts[0], owner);
  })

  it('Should add a candidate if it is required by the owner', async () => {
    let newCandidate= accounts[1];
    await PrivateList.addCandidate(newCandidate);
    let isInTheList = await PrivateList.candidatesList.call(newCandidate);
    assert.strictEqual(true, isInTheList);
  })

  it('Should NOT add a candidate if it is required by an account different than the owner', async () => {
    let newCandidate= accounts[1];
    await expectThrow(await PrivateList.addCandidate(newCandidate,{from:accounts[2]}))
  })


})
