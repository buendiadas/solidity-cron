const config = require('../config')
const { assertRevert } = require('./helpers/assertRevert')
const TRLContract = artifacts.require('TRL')
const ProxyContract = artifacts.require('Proxy')
const VoteTokenContract =  artifacts.require('VoteToken')
const Standard20TokenMock = artifacts.require('Standard20TokenMock')
const PeriodContract = artifacts.require('PeriodMock');
const VaultContract = artifacts.require('Vault')
const OwnedRegistryContract = artifacts.require('OwnedRegistryMock')

contract('Reputation', function (accounts) {
  let TRLInstance
  let PeriodInstance
  let VoteTokenInstance
  let ProxyInstance
  let ProxyTRLInstance
  let Vault
  let ScoringInstance
  let startTime

  let adminAccount = web3.eth.accounts[0]
  let voterAccounts = web3.eth.accounts.slice(1, 4)
  let candidateAccounts = web3.eth.accounts.slice(5, 8)

  const WINDOW_SIZE = config.reputationWindowSize
  const linWeightsSmaller = config.reputationWeights

  let FrontierTokenInstance
  let CandidateRegistryInstance
  let VoterRegistryInstance
  let PeriodicStagesInstance

  before('Deploying required contracts', async () => {
    FrontierTokenInstance = await Standard20TokenMock.new(voterAccounts, config.totalTokens, {from: adminAccount})
    CandidateRegistryInstance = await OwnedRegistryContract.new(candidateAccounts, {from: adminAccount})
    VoterRegistryInstance = await OwnedRegistryContract.new(voterAccounts, {from: adminAccount})
    Vault = await VaultContract.new({from: adminAccount})
  })

  beforeEach(async () => {
    ProxyInstance = await ProxyContract.new({from:adminAccount})
    TRLInstance = await TRLContract.new({from: adminAccount})
    ProxyTRLInstance = await TRLContract.at(ProxyInstance.address)
    await ProxyInstance.setContractLogic(TRLInstance.address)
    VoteTokenInstance = await VoteTokenContract.new({from:adminAccount})
    PeriodInstance = await PeriodContract.new()

    await ProxyTRLInstance.setCandidateRegistry(CandidateRegistryInstance.address)
    await ProxyTRLInstance.setVoterRegistry(VoterRegistryInstance.address)
    await ProxyTRLInstance.setVault(Vault.address)
    await VoteTokenInstance.setPeriod(PeriodInstance.address)
    await ProxyTRLInstance.setToken(FrontierTokenInstance.address)
    await ProxyTRLInstance.setVoteToken(VoteTokenInstance.address)

    await VoteTokenInstance.transferOwnership(ProxyInstance.address, {from: adminAccount})
    await ProxyTRLInstance.setCandidateRegistry(CandidateRegistryInstance.address)
    await ProxyTRLInstance.setVoterRegistry(VoterRegistryInstance.address)
    await ProxyTRLInstance.setVault(Vault.address)

    await ProxyTRLInstance.setPeriod(PeriodInstance.address)

  })

  const absLinWeights = [0.39999999999999997, 0.3, 0.19999999999999998, 0.10000000000000002, 0.0]
  const absRatWeights = [0.4461021786749173, 0.21733183063649814, 0.14366002364107508, 0.10729039740282821, 0.0856155696446811]
  const absExpWeights = [0.6399171800385933, 0.23304644109045747, 0.08487136366873695, 0.03090863922781419, 0.011256375974398092]

  const MUL_CONSTANT = 1000000000
  const linWeights = absLinWeights.map(currWeight => parseInt(currWeight * MUL_CONSTANT))
  const ratWeights = absRatWeights.map(currWeight => parseInt(currWeight * MUL_CONSTANT))
  const expWeights = absExpWeights.map(currWeight => parseInt(currWeight * MUL_CONSTANT))

  const analyst1Scores = [628, 644, 489, 463, 409, 593, 585, 616, 412, 556]
  const analyst2Scores = [477, 481, 631, 346, 409, 527, 585, 479, 301, 496]

  const expectedAnalyst1LastPeriodScoreLin = 527.7000
  const expectedAnalyst1LastPeriodScoreRat = 539.6030
  const expectedAnalyst1LastPeriodScoreExp = 528.8464

  const expectedAnalyst2LastPeriodScoreLin = 443.000
  const expectedAnalyst2LastPeriodScoreRat = 463.3810
  const expectedAnalyst2LastPeriodScoreExp = 452.2129

  const expectedAnalyst1FirstPeriodScoreLin = 446.0000
  const expectedAnalyst1FirstPeriodScoreRat = 423.7742
  const expectedAnalyst1FirstPeriodScoreExp = 558.4598

  const expectedAnalyst2FirstPeriodScoreLin = 335.5000
  const expectedAnalyst2FirstPeriodScoreRat = 318.2424
  const expectedAnalyst2FirstPeriodScoreExp = 418.9633

  const votesRecord = [60, 59, 61, 41, 56]
  const stakedTokens = 999

  let epoch
  let TRLScoring

  describe('Weighted Scoring Pure Function Test With ProxyTRLInstance', async () => {
    it('Should yeld the same values as the Python algorithm', async () => {
      const score = await ProxyTRLInstance.scoring(0, adminAccount)

      let actualAnalyst1LastPeriodScoreLin = await ProxyTRLInstance.weightedScore(linWeights, analyst1Scores, WINDOW_SIZE)
      actualAnalyst1LastPeriodScoreLin = Number((actualAnalyst1LastPeriodScoreLin / MUL_CONSTANT).toFixed(4))
      assert.equal(expectedAnalyst1LastPeriodScoreLin, actualAnalyst1LastPeriodScoreLin)

      let actualAnalyst1LastPeriodScoreRat = await ProxyTRLInstance.weightedScore(ratWeights, analyst1Scores, WINDOW_SIZE)
      actualAnalyst1LastPeriodScoreRat = Number((actualAnalyst1LastPeriodScoreRat / MUL_CONSTANT).toFixed(4))
      assert.equal(expectedAnalyst1LastPeriodScoreRat, actualAnalyst1LastPeriodScoreRat)

      let actualAnalyst1LastPeriodScoreExp = await ProxyTRLInstance.weightedScore(expWeights, analyst1Scores, WINDOW_SIZE)
      actualAnalyst1LastPeriodScoreExp = Number((actualAnalyst1LastPeriodScoreExp / MUL_CONSTANT).toFixed(4))
      assert.equal(expectedAnalyst1LastPeriodScoreExp, actualAnalyst1LastPeriodScoreExp)

      let actualAnalyst2LastPeriodScoreLin = await ProxyTRLInstance.weightedScore(linWeights, analyst2Scores, WINDOW_SIZE)
      actualAnalyst2LastPeriodScoreLin = Number((actualAnalyst2LastPeriodScoreLin / MUL_CONSTANT).toFixed(4))
      assert.equal(expectedAnalyst2LastPeriodScoreLin, actualAnalyst2LastPeriodScoreLin)

      let actualAnalyst2LastPeriodScoreRat = await ProxyTRLInstance.weightedScore(ratWeights, analyst2Scores, WINDOW_SIZE)
      actualAnalyst2LastPeriodScoreRat = Number((actualAnalyst2LastPeriodScoreRat / MUL_CONSTANT).toFixed(4))
      assert.equal(expectedAnalyst2LastPeriodScoreRat, actualAnalyst2LastPeriodScoreRat)

      let actualAnalyst2LastPeriodScoreExp = await ProxyTRLInstance.weightedScore(expWeights, analyst2Scores, WINDOW_SIZE)
      actualAnalyst2LastPeriodScoreExp = Number((actualAnalyst2LastPeriodScoreExp / MUL_CONSTANT).toFixed(4))
      assert.equal(expectedAnalyst2LastPeriodScoreExp, actualAnalyst2LastPeriodScoreExp)
    })

    it('Should yeld correct values when the window size is smaller than the sample', async () => {
      let actualAnalyst1FirstPeriodScoreLin = await ProxyTRLInstance.weightedScore(linWeights, [analyst1Scores[0], analyst1Scores[1]], WINDOW_SIZE)
      actualAnalyst1FirstPeriodScoreLin = Number((actualAnalyst1FirstPeriodScoreLin / MUL_CONSTANT).toFixed(4))
      assert.equal(expectedAnalyst1FirstPeriodScoreLin, actualAnalyst1FirstPeriodScoreLin)

      let actualAnalyst1FirstPeriodScoreRat = await ProxyTRLInstance.weightedScore(ratWeights, [analyst1Scores[0], analyst1Scores[1]], WINDOW_SIZE)
      actualAnalyst1FirstPeriodScoreRat = Number((actualAnalyst1FirstPeriodScoreRat / MUL_CONSTANT).toFixed(4))
      assert.equal(expectedAnalyst1FirstPeriodScoreRat, actualAnalyst1FirstPeriodScoreRat)

      let actualAnalyst1FirstPeriodScoreExp = await ProxyTRLInstance.weightedScore(expWeights, [analyst1Scores[0], analyst1Scores[1]], WINDOW_SIZE)
      actualAnalyst1FirstPeriodScoreExp = Number((actualAnalyst1FirstPeriodScoreExp / MUL_CONSTANT).toFixed(4))
      assert.equal(expectedAnalyst1FirstPeriodScoreExp, actualAnalyst1FirstPeriodScoreExp)

      let actualAnalyst2FirstPeriodScoreLin = await ProxyTRLInstance.weightedScore(linWeights, [analyst2Scores[0], analyst2Scores[1]], WINDOW_SIZE)
      actualAnalyst2FirstPeriodScoreLin = Number((actualAnalyst2FirstPeriodScoreLin / MUL_CONSTANT).toFixed(4))
      assert.equal(expectedAnalyst2FirstPeriodScoreLin, actualAnalyst2FirstPeriodScoreLin)

      let actualAnalyst2FirstPeriodScoreRat = await ProxyTRLInstance.weightedScore(ratWeights, [analyst2Scores[0], analyst2Scores[1]], WINDOW_SIZE)
      actualAnalyst2FirstPeriodScoreRat = Number((actualAnalyst2FirstPeriodScoreRat / MUL_CONSTANT).toFixed(4))
      assert.equal(expectedAnalyst2FirstPeriodScoreRat, actualAnalyst2FirstPeriodScoreRat)

      let actualAnalyst2FirstPeriodScoreExp = await ProxyTRLInstance.weightedScore(expWeights, [analyst2Scores[0], analyst2Scores[1]], WINDOW_SIZE)
      actualAnalyst2FirstPeriodScoreExp = Number((actualAnalyst2FirstPeriodScoreExp / MUL_CONSTANT).toFixed(4))
      assert.equal(expectedAnalyst2FirstPeriodScoreExp, actualAnalyst2FirstPeriodScoreExp)
    })
  })
  describe('Reputation Function should work', async () => {
    it('Should work', async () => {
      await FrontierTokenInstance.approve(ProxyTRLInstance.address, stakedTokens, {from: voterAccounts[0]})
      const rep1ExpectedResult = 52800000000
      await ProxyTRLInstance.setWindowSize(WINDOW_SIZE, {from: adminAccount})
      await ProxyTRLInstance.setReputationLinWeights(linWeightsSmaller, {from: adminAccount})

       for (let i = 0; i < 5; i++) {
          await ProxyTRLInstance.buyTokenVotes(votesRecord[i], {from: voterAccounts[0]})
          await ProxyTRLInstance.vote(candidateAccounts[0], votesRecord[i], {from: voterAccounts[0]})
          epoch = await ProxyTRLInstance.height.call()
          TRLScoring = await ProxyTRLInstance.scoring.call(epoch, candidateAccounts[0])
          await PeriodInstance.next();
      }

      let res = await ProxyTRLInstance.reputation(epoch, candidateAccounts[0])
      assert.equal(rep1ExpectedResult, res)
    })
    it('Should revert when weights are not set', async () => {
      await FrontierTokenInstance.approve(ProxyTRLInstance.address, stakedTokens, {from: voterAccounts[0]})
      await ProxyTRLInstance.setWindowSize(WINDOW_SIZE, {from: adminAccount})

      // Buying votes and voting for the user
      for (let i = 0; i < 5; i++) {
        await ProxyTRLInstance.buyTokenVotes(votesRecord[i], {from: voterAccounts[0]})
        await ProxyTRLInstance.vote(candidateAccounts[0], votesRecord[i], {from: voterAccounts[0]})
        epoch = await ProxyTRLInstance.height.call()
        TRLScoring = await ProxyTRLInstance.scoring.call(epoch, candidateAccounts[0])
        await PeriodInstance.next();
      }
      await assertRevert(ProxyTRLInstance.reputation(epoch, candidateAccounts[0]))
    })

    it('Should revert when non-owner tries to set reputation weights', async () => {
      await FrontierTokenInstance.approve(ProxyTRLInstance.address, stakedTokens, {from: voterAccounts[0]})

      await ProxyTRLInstance.setWindowSize(WINDOW_SIZE)
      await assertRevert(ProxyTRLInstance.setReputationLinWeights(linWeightsSmaller, {from: voterAccounts[1]}))
    })

    it('Should revert when reputation weights size is different than window size', async () => {
      await FrontierTokenInstance.approve(ProxyTRLInstance.address, stakedTokens, {from: voterAccounts[0]})

      let shortLinWeights = [400000000, 300000000, 200000000, 100000000]
      await ProxyTRLInstance.setWindowSize(shortLinWeights.length + 1)

      await assertRevert(ProxyTRLInstance.setReputationLinWeights(shortLinWeights))
    })
    it('Should set the correct window size', async () => {
      await FrontierTokenInstance.approve(ProxyTRLInstance.address, stakedTokens, {from: voterAccounts[0]})

      await ProxyTRLInstance.setWindowSize(WINDOW_SIZE)
      let windowSize = await ProxyTRLInstance.reputationWindowSize.call()

      assert.equal(WINDOW_SIZE, windowSize)
    })
    it('Should revert when value is 0 or greater than 100', async () => {
      await FrontierTokenInstance.approve(ProxyTRLInstance.address, stakedTokens, {from: voterAccounts[0]})

      await assertRevert(ProxyTRLInstance.setWindowSize(0))
      await assertRevert(ProxyTRLInstance.setWindowSize(101))
    })
  })
})
