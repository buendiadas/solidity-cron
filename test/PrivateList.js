const expectThrow = require('./helpers/expectThrow.js').expectThrow;
const Standard20TokenContract = artifacts.require('Standard20Token');
const PrivateListContract = artifacts.require('PrivateList');
const MAXNUMCANDIDATES=5;

let PrivateList;
let FrontierToken;


contract('PrivateList', function (accounts) {
  beforeEach(async() => {
    FrontierToken = await Standard20TokenContract.new();
    let tokenAddress= await FrontierToken.address;
    PrivateList = await PrivateListContract.new(tokenAddress, MAXNUMCANDIDATES,{from:accounts[0]});
  })

  describe('Creating the contract', async () => {

      it('Should have set as an owner the creator of the List', async () => {
        let owner = await PrivateList.owner.call();
        assert.strictEqual(accounts[0], owner);
      })

      it('Should have the total number of candidates to the specified in constructor', async () => {
        let numCandidates = await PrivateList.maxNumCandidates.call();
        assert.equal(MAXNUMCANDIDATES, await numCandidates);
      })
  });

  describe('Adding candidates', async () => {

      it('Should add a candidate if it is required by the owner', async () => {
        let newCandidate= accounts[1];
        await PrivateList.addCandidate(newCandidate);
        let isInTheList = await PrivateList.candidatesList.call(newCandidate);
        assert.strictEqual(true, isInTheList);
      })

      it('Should NOT add a candidate if it is required by an account different than the owner', async () => {
        let newCandidate= accounts[1];
        await expectThrow(PrivateList.addCandidate(newCandidate,{from:accounts[2]}))
      })

      it('Should increase the analysts counter after adding a new candidate ', async () => {
        let initialNumberOfCandidates= await PrivateList.candidateCounter.call();
        let newCandidate= await accounts[2];
        await PrivateList.addCandidate(newCandidate);
        let updatedNumberOfCandidates= await PrivateList.candidateCounter.call();
        assert.equal(1, updatedNumberOfCandidates);
      })

      it('Should increase the analysts counter N times before the MAX is reached', async () => {
        let initialNumberOfCandidates= await PrivateList.candidateCounter.call();
        let newCandidate= await accounts[2];
        let i = 0;
        while (i< MAXNUMCANDIDATES){
          await PrivateList.addCandidate(accounts[i+2]);
          i++;
        }
        let updatedNumberOfCandidates= await PrivateList.candidateCounter.call();
        assert.equal(MAXNUMCANDIDATES, updatedNumberOfCandidates);
      })

      it('Should throw if the analyst is added twice', async () => {
        let initialNumberOfCandidates= await PrivateList.candidateCounter.call();
        let newCandidate= await accounts[2];
        await PrivateList.addCandidate(newCandidate);
        await expectThrow(PrivateList.addCandidate(newCandidate));
        let updatedNumberOfCandidates= await PrivateList.candidateCounter.call();
        assert.equal(1, updatedNumberOfCandidates);
      })
    });



})
