const expectThrow  = require('./helpers/expectThrow.js').expectThrow;
const { assertRevert } = require('./helpers/assertRevert');


const Standard20TokenMock = artifacts.require('Standard20TokenMock');
const PrivateListContract = artifacts.require('PrivateList');
const MAXNUMCANDIDATES=5;
const ADMIN_ACCOUNT= web3.eth.accounts[0];
const CANDIDATE_ACCOUNT= web3.eth.accounts[1];
const VOTER_ACCOUNT= web3.eth.accounts[2];
const BOUNTY_POOL_ACCOUNT= 0x00;
const TOTAL_TOKENS=1000;
const STAKED_AMOUNT=100;
const INITIAL_TTL = 10;

let PrivateList;
let FrontierToken;


contract('PrivateList', function (accounts) {
  beforeEach(async() => {
    FrontierToken = await Standard20TokenMock.new(VOTER_ACCOUNT, VOTER_ACCOUNT, TOTAL_TOKENS,{from: ADMIN_ACCOUNT});
    let tokenAddress= await FrontierToken.address;
    PrivateList = await PrivateListContract.new(tokenAddress, MAXNUMCANDIDATES, INITIAL_TTL, {from:accounts[0]});
  })

  describe('Creating the contract', async () => {

      it('Should have set as an owner the creator of the List', async () => {
        let owner = await PrivateList.owner.call();
        assert.strictEqual(ADMIN_ACCOUNT, owner);
      })

      it('Should have the total number of candidates to the specified in constructor', async () => {
        let numCandidates = await PrivateList.maxNumCandidates.call();
        assert.equal(MAXNUMCANDIDATES, await numCandidates);
      })

      it('Should have set the correct token as the token voting address', async () => {
        let contractTokenAddress = await PrivateList.token.call();
        let testingTokenAddress= await FrontierToken.address;
        assert.strictEqual(contractTokenAddress,testingTokenAddress);
      })

      it('Period should have been set to 0', async () => {
        let currentPeriod= await PrivateList.currentPeriod.call();
        assert.equal(0, currentPeriod.toNumber());
      })

      it('Default TTL should have been set to INITIAL_TTL', async () => {
        let ttl = await PrivateList.periodTTL.call();
        assert.strictEqual(INITIAL_TTL, ttl.toNumber());
      })

      it('Balance of Voter should be set to TOTAL_TOKENS', async () => {
        let balance= await FrontierToken.balanceOf.call(VOTER_ACCOUNT);
        assert.equal(TOTAL_TOKENS, balance.toNumber());
      });

  });

  describe('Adding candidates', async () => {

      it('Should add a candidate if it is required by the owner', async () => {
        let newCandidate= CANDIDATE_ACCOUNT;
        await PrivateList.addCandidate(newCandidate);
        let isInTheList = await PrivateList.candidatesList.call(newCandidate);
        assert.strictEqual(true, isInTheList);
      })

      it('Should NOT add a candidate if it is required by an account different than the owner', async () => {
        let newCandidate= CANDIDATE_ACCOUNT;
        await assertRevert(PrivateList.addCandidate(newCandidate,{from:accounts[2]}))
      })

      it('Should increase the analysts counter after adding a new candidate ', async () => {
        let initialNumberOfCandidates= await PrivateList.candidateCounter.call();
        let newCandidate= await CANDIDATE_ACCOUNT;
        await PrivateList.addCandidate(newCandidate);
        let updatedNumberOfCandidates= await PrivateList.candidateCounter.call();
        assert.equal(1, updatedNumberOfCandidates);
      })

      it('Should increase the analysts counter N times before the MAX is reached', async () => {
        let initialNumberOfCandidates= await PrivateList.candidateCounter.call();
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
        let newCandidate= await CANDIDATE_ACCOUNT;
        await PrivateList.addCandidate(newCandidate);
        await assertRevert(PrivateList.addCandidate(newCandidate));
        let updatedNumberOfCandidates= await PrivateList.candidateCounter.call();
        assert.equal(1, updatedNumberOfCandidates);
      })
  });

  describe('Removing candidates', async () => {

    it('Should remove a candidate if it is required by the owner', async () => {
      let newCandidate= CANDIDATE_ACCOUNT;
      await PrivateList.addCandidate(newCandidate);
      await PrivateList.removeCandidate(newCandidate);
      let isInTheList = await PrivateList.candidatesList.call(newCandidate);
      assert.strictEqual(false, isInTheList);
    })

    it('Should NOT remove a candidate if it is required by an account different than the owner', async () => {
      let newCandidate= CANDIDATE_ACCOUNT;
      await assertRevert(PrivateList.addCandidate(newCandidate,{from:accounts[2]}))
    })

    it('Should decrease the analysts counter after removing a candidate ', async () => {
      let initialNumberOfCandidates= await PrivateList.candidateCounter.call();
      let newCandidate= await CANDIDATE_ACCOUNT;
      await PrivateList.addCandidate(newCandidate);
      await PrivateList.removeCandidate(newCandidate);
      let updatedNumberOfCandidates= await PrivateList.candidateCounter.call();
      assert.equal(0, updatedNumberOfCandidates);
    })
  });

  describe('Adding voters', async () => {

      it('Should add a voter if it is required by the owner', async () => {
        let newVoter= VOTER_ACCOUNT;
        await PrivateList.addVoter(newVoter);
        let isInTheList = await PrivateList.voterList.call(newVoter);
        assert.strictEqual(true, isInTheList);
      })

      it('Should NOT add a candidate if it is required by an account different than the owner', async () => {
        let newVoter= VOTER_ACCOUNT;
        await assertRevert(PrivateList.addVoter(newVoter,{from:accounts[2]}))
      })

      it('Should throw if the analyst is added twice', async () => {
        let initialNumberOfCandidates= await PrivateList.candidateCounter.call();
        let newCandidate= await VOTER_ACCOUNT;
        await PrivateList.addCandidate(newCandidate);
        await assertRevert(PrivateList.addCandidate(newCandidate));
        let updatedNumberOfCandidates= await PrivateList.candidateCounter.call();
        assert.equal(1, updatedNumberOfCandidates);
      })
  });

  describe('Removing voters', async () => {

      it('Should remove a voter if it is required by the owner', async () => {
        let newVoter= VOTER_ACCOUNT;
        await PrivateList.addVoter(newVoter);
        await PrivateList.removeVoter(newVoter);
        let isInTheList = await PrivateList.voterList.call(newVoter);
        assert.strictEqual(false, isInTheList);
      })

      it('Should NOT remove a candidate if it is required by an account different than the owner', async () => {
        let newVoter= VOTER_ACCOUNT;
        await assertRevert(PrivateList.removeVoter(newVoter,{from:accounts[2]}))
      })
  });

  describe('Staking', async () => {

      it('Should approve an amount of tokens using the token (Stake)', async () => {
        let listAddress= await PrivateList.address;
        let isApproved= await FrontierToken.approve(listAddress, STAKED_AMOUNT,{from:VOTER_ACCOUNT});
        let totalStaked = await FrontierToken.allowance.call(VOTER_ACCOUNT, listAddress);
        assert.equal(STAKED_AMOUNT,totalStaked);
      });

      it('Should increase the number of votes in the period', async () => {
        let listAddress= await PrivateList.address;
        let newVoter= VOTER_ACCOUNT;
        await PrivateList.addVoter(newVoter);
        await FrontierToken.approve(listAddress, STAKED_AMOUNT,{from:VOTER_ACCOUNT});
        await PrivateList.buyTokenVotes(STAKED_AMOUNT, {from:VOTER_ACCOUNT});
        let votesBalance = await PrivateList.votesBalance.call(0, VOTER_ACCOUNT);
        assert.equal(STAKED_AMOUNT, votesBalance);
      });


  });

  describe('Voting', async () => {
      it('Should throw if the vote comes from a voter without enough stake', async () => {
        let newCandidate= CANDIDATE_ACCOUNT;
        await PrivateList.addCandidate(newCandidate);
        let newVoter= VOTER_ACCOUNT;
        await PrivateList.addVoter(newVoter);
        await assertRevert(PrivateList.vote(CANDIDATE_ACCOUNT,STAKED_AMOUNT,{from:newVoter}))
      });

      it('Token should not enable transferFrom from admin', async () => {
        await FrontierToken.approve(ADMIN_ACCOUNT,STAKED_AMOUNT,{from:VOTER_ACCOUNT});
        let isAllowed= await FrontierToken.allowance.call(VOTER_ACCOUNT, ADMIN_ACCOUNT);
        let isTransfered = await FrontierToken.transferFrom.call(ADMIN_ACCOUNT, 0x00, STAKED_AMOUNT)
        assert.equal(false, isTransfered);
      });

      it('Token should enable transferFrom from Voter', async () => {
        await FrontierToken.approve(ADMIN_ACCOUNT,STAKED_AMOUNT,{from:VOTER_ACCOUNT});
        let isAllowed= await FrontierToken.allowance.call(VOTER_ACCOUNT, ADMIN_ACCOUNT);
        let isTransfered = await FrontierToken.transferFrom.call(VOTER_ACCOUNT, 0x00, STAKED_AMOUNT)
        assert.equal(true, isTransfered);
      });

      it('Approval should have been set', async () => {
        let isApproved = await FrontierToken.approve.call(ADMIN_ACCOUNT,STAKED_AMOUNT,{from:VOTER_ACCOUNT});
        assert.equal(true, isApproved);
      });

      it('Balance of Voter should be set to TOTAL_AMOUNT', async () => {
        await FrontierToken.approve(ADMIN_ACCOUNT,STAKED_AMOUNT,{from:VOTER_ACCOUNT});
        let balance= await FrontierToken.balanceOf.call(VOTER_ACCOUNT);
        assert.equal(TOTAL_TOKENS, balance.toNumber());
      });

      it('Should add votes if the voter approved the specified stake', async () => {
        let newCandidate= CANDIDATE_ACCOUNT;
        await PrivateList.addCandidate(newCandidate);
        let newVoter= VOTER_ACCOUNT;
        let listAddress= await PrivateList.address;
        await PrivateList.addVoter(newVoter);
        await FrontierToken.approve(listAddress,STAKED_AMOUNT,{from:VOTER_ACCOUNT});
        await FrontierToken.allowance.call(VOTER_ACCOUNT, listAddress);
        await PrivateList.vote(CANDIDATE_ACCOUNT,STAKED_AMOUNT,{from:VOTER_ACCOUNT});
        let totalVotes= await PrivateList.votesReceived.call(CANDIDATE_ACCOUNT);
        assert.equal(STAKED_AMOUNT,totalVotes.toNumber());
      });

      it('Should have increased the balance of tokens of the voting pool by the number of votes', async () => {
        let newCandidate= CANDIDATE_ACCOUNT;
        await PrivateList.addCandidate(newCandidate);
        let newVoter= VOTER_ACCOUNT;
        let listAddress= await PrivateList.address;
        await PrivateList.addVoter(newVoter);
        await FrontierToken.approve(listAddress,STAKED_AMOUNT,{from:VOTER_ACCOUNT});
        await FrontierToken.allowance.call(VOTER_ACCOUNT, listAddress);
        await PrivateList.vote(CANDIDATE_ACCOUNT,STAKED_AMOUNT,{from:VOTER_ACCOUNT});
        let totalVotes= await PrivateList.votesReceived.call(CANDIDATE_ACCOUNT);
        let bountyPoolBalance= await FrontierToken.balanceOf.call(BOUNTY_POOL_ACCOUNT);
        assert.equal(totalVotes.toNumber(),bountyPoolBalance.toNumber());
      });

  });






});
