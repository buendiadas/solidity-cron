const config = require('../config')
const { assertRevert } = require('./helpers/assertRevert')
const TRLContract = artifacts.require('TRL')
const ProxyContract = artifacts.require('Proxy')

/// /

const advanceToBlock = require('./helpers/advanceToBlock')
const Standard20TokenMock = artifacts.require('Standard20TokenMock')
const PeriodicStageContract = artifacts.require('PeriodicStages')
const PeriodContract = artifacts.require('Period')
const OwnedRegistryContract = artifacts.require('OwnedRegistryMock')
///

contract('Reputation', function (accounts) {
  let TRLInstance
  let ProxyInstance
  let ProxyTRLInstance

  let ScoringInstance
  let PeriodInstance
  let startTime
  let adminAccount = web3.eth.accounts[0]
  let voterAccounts = web3.eth.accounts.slice(1, 4)
  let candidateAccounts = web3.eth.accounts.slice(5, 8)

  let FrontierTokenInstance
  let CandidateRegistryInstance
  let VoterRegistryInstance
  let PeriodicStagesInstance

  before('Deploying required contracts', async () => {
    FrontierTokenInstance = await Standard20TokenMock.new(voterAccounts, config.totalTokens, {from: adminAccount})
    // FrontierTokenInstance = await Standard20TokenMock.new(voterAccounts, 40000000, {from: adminAccount})
    CandidateRegistryInstance = await OwnedRegistryContract.new(candidateAccounts, {from: adminAccount})
    VoterRegistryInstance = await OwnedRegistryContract.new(voterAccounts, {from: adminAccount})

    ProxyInstance = await ProxyContract.new()
    TRLInstance = await TRLContract.new({from: adminAccount})
    ProxyTRLInstance = await TRLContract.at(ProxyInstance.address)
    await ProxyInstance.setContractLogic(TRLInstance.address)
  })

  beforeEach(async () => {
    TRLInstance = await TRLContract.new({from: adminAccount})
    await TRLInstance.setToken(FrontierTokenInstance.address)
    await TRLInstance.setCandidateRegistry(CandidateRegistryInstance.address)
    await TRLInstance.setVoterRegistry(VoterRegistryInstance.address)
    await TRLInstance.initPeriod(config.ttl)
    await TRLInstance.initStages(config.activeTime, config.claimTime)
    let periodicStagesAddress = await TRLInstance.periodicStages.call()
    PeriodicStagesInstance = await PeriodicStageContract.at(periodicStagesAddress)
    let periodAddress = await PeriodicStagesInstance.period.call()
    PeriodInstance = await PeriodContract.at(periodAddress)
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

  describe('Weighted Scoring Pure Function Test With ProxyTRLInstance', async () => {
    it('Should yeld the same values as the Python algorithm', async () => {
      const score = await TRLInstance.scoring(0, adminAccount)

      let actualAnalyst1LastPeriodScoreLin = await ProxyTRLInstance.weightedScore(linWeights, analyst1Scores)
      actualAnalyst1LastPeriodScoreLin = Number((actualAnalyst1LastPeriodScoreLin / MUL_CONSTANT).toFixed(4))
      assert.equal(expectedAnalyst1LastPeriodScoreLin, actualAnalyst1LastPeriodScoreLin)

      let actualAnalyst1LastPeriodScoreRat = await ProxyTRLInstance.weightedScore(ratWeights, analyst1Scores)
      actualAnalyst1LastPeriodScoreRat = Number((actualAnalyst1LastPeriodScoreRat / MUL_CONSTANT).toFixed(4))
      assert.equal(expectedAnalyst1LastPeriodScoreRat, actualAnalyst1LastPeriodScoreRat)

      let actualAnalyst1LastPeriodScoreExp = await ProxyTRLInstance.weightedScore(expWeights, analyst1Scores)
      actualAnalyst1LastPeriodScoreExp = Number((actualAnalyst1LastPeriodScoreExp / MUL_CONSTANT).toFixed(4))
      assert.equal(expectedAnalyst1LastPeriodScoreExp, actualAnalyst1LastPeriodScoreExp)

      let actualAnalyst2LastPeriodScoreLin = await ProxyTRLInstance.weightedScore(linWeights, analyst2Scores)
      actualAnalyst2LastPeriodScoreLin = Number((actualAnalyst2LastPeriodScoreLin / MUL_CONSTANT).toFixed(4))
      assert.equal(expectedAnalyst2LastPeriodScoreLin, actualAnalyst2LastPeriodScoreLin)

      let actualAnalyst2LastPeriodScoreRat = await ProxyTRLInstance.weightedScore(ratWeights, analyst2Scores)
      actualAnalyst2LastPeriodScoreRat = Number((actualAnalyst2LastPeriodScoreRat / MUL_CONSTANT).toFixed(4))
      assert.equal(expectedAnalyst2LastPeriodScoreRat, actualAnalyst2LastPeriodScoreRat)

      let actualAnalyst2LastPeriodScoreExp = await ProxyTRLInstance.weightedScore(expWeights, analyst2Scores)
      actualAnalyst2LastPeriodScoreExp = Number((actualAnalyst2LastPeriodScoreExp / MUL_CONSTANT).toFixed(4))
      assert.equal(expectedAnalyst2LastPeriodScoreExp, actualAnalyst2LastPeriodScoreExp)
        // assert.equal(0, score)
    })

    it('Should yeld correct values when the window size is smaller than the sample', async () => {
      let actualAnalyst1FirstPeriodScoreLin = await ProxyTRLInstance.weightedScore(linWeights, [analyst1Scores[0], analyst1Scores[1]])
      actualAnalyst1FirstPeriodScoreLin = Number((actualAnalyst1FirstPeriodScoreLin / MUL_CONSTANT).toFixed(4))
      assert.equal(expectedAnalyst1FirstPeriodScoreLin, actualAnalyst1FirstPeriodScoreLin)

      let actualAnalyst1FirstPeriodScoreRat = await ProxyTRLInstance.weightedScore(ratWeights, [analyst1Scores[0], analyst1Scores[1]])
      actualAnalyst1FirstPeriodScoreRat = Number((actualAnalyst1FirstPeriodScoreRat / MUL_CONSTANT).toFixed(4))
      assert.equal(expectedAnalyst1FirstPeriodScoreRat, actualAnalyst1FirstPeriodScoreRat)

      let actualAnalyst1FirstPeriodScoreExp = await ProxyTRLInstance.weightedScore(expWeights, [analyst1Scores[0], analyst1Scores[1]])
      actualAnalyst1FirstPeriodScoreExp = Number((actualAnalyst1FirstPeriodScoreExp / MUL_CONSTANT).toFixed(4))
      assert.equal(expectedAnalyst1FirstPeriodScoreExp, actualAnalyst1FirstPeriodScoreExp)

      let actualAnalyst2FirstPeriodScoreLin = await ProxyTRLInstance.weightedScore(linWeights, [analyst2Scores[0], analyst2Scores[1]])
      actualAnalyst2FirstPeriodScoreLin = Number((actualAnalyst2FirstPeriodScoreLin / MUL_CONSTANT).toFixed(4))
      assert.equal(expectedAnalyst2FirstPeriodScoreLin, actualAnalyst2FirstPeriodScoreLin)

      let actualAnalyst2FirstPeriodScoreRat = await ProxyTRLInstance.weightedScore(ratWeights, [analyst2Scores[0], analyst2Scores[1]])
      actualAnalyst2FirstPeriodScoreRat = Number((actualAnalyst2FirstPeriodScoreRat / MUL_CONSTANT).toFixed(4))
      assert.equal(expectedAnalyst2FirstPeriodScoreRat, actualAnalyst2FirstPeriodScoreRat)

      let actualAnalyst2FirstPeriodScoreExp = await ProxyTRLInstance.weightedScore(expWeights, [analyst2Scores[0], analyst2Scores[1]])
      actualAnalyst2FirstPeriodScoreExp = Number((actualAnalyst2FirstPeriodScoreExp / MUL_CONSTANT).toFixed(4))
      assert.equal(expectedAnalyst2FirstPeriodScoreExp, actualAnalyst2FirstPeriodScoreExp)
    })
  })

  describe('Weighted Scoring Pure Function Test With TRLInstance', async () => {
    it('Should yeld the same values as the Python algorithm', async () => {
      const score = await TRLInstance.scoring(0, adminAccount)

      let actualAnalyst1LastPeriodScoreLin = await TRLInstance.weightedScore(linWeights, analyst1Scores)
      actualAnalyst1LastPeriodScoreLin = Number((actualAnalyst1LastPeriodScoreLin / MUL_CONSTANT).toFixed(4))
      assert.equal(expectedAnalyst1LastPeriodScoreLin, actualAnalyst1LastPeriodScoreLin)

      let actualAnalyst1LastPeriodScoreRat = await TRLInstance.weightedScore(ratWeights, analyst1Scores)
      actualAnalyst1LastPeriodScoreRat = Number((actualAnalyst1LastPeriodScoreRat / MUL_CONSTANT).toFixed(4))
      assert.equal(expectedAnalyst1LastPeriodScoreRat, actualAnalyst1LastPeriodScoreRat)

      let actualAnalyst1LastPeriodScoreExp = await TRLInstance.weightedScore(expWeights, analyst1Scores)
      actualAnalyst1LastPeriodScoreExp = Number((actualAnalyst1LastPeriodScoreExp / MUL_CONSTANT).toFixed(4))
      assert.equal(expectedAnalyst1LastPeriodScoreExp, actualAnalyst1LastPeriodScoreExp)

      let actualAnalyst2LastPeriodScoreLin = await TRLInstance.weightedScore(linWeights, analyst2Scores)
      actualAnalyst2LastPeriodScoreLin = Number((actualAnalyst2LastPeriodScoreLin / MUL_CONSTANT).toFixed(4))
      assert.equal(expectedAnalyst2LastPeriodScoreLin, actualAnalyst2LastPeriodScoreLin)

      let actualAnalyst2LastPeriodScoreRat = await TRLInstance.weightedScore(ratWeights, analyst2Scores)
      actualAnalyst2LastPeriodScoreRat = Number((actualAnalyst2LastPeriodScoreRat / MUL_CONSTANT).toFixed(4))
      assert.equal(expectedAnalyst2LastPeriodScoreRat, actualAnalyst2LastPeriodScoreRat)

      let actualAnalyst2LastPeriodScoreExp = await TRLInstance.weightedScore(expWeights, analyst2Scores)
      actualAnalyst2LastPeriodScoreExp = Number((actualAnalyst2LastPeriodScoreExp / MUL_CONSTANT).toFixed(4))
      assert.equal(expectedAnalyst2LastPeriodScoreExp, actualAnalyst2LastPeriodScoreExp)
        // assert.equal(0, score)
    })

    it('Should yeld correct values when the window size is smaller than the sample', async () => {
      let actualAnalyst1FirstPeriodScoreLin = await TRLInstance.weightedScore(linWeights, [analyst1Scores[0], analyst1Scores[1]])
      actualAnalyst1FirstPeriodScoreLin = Number((actualAnalyst1FirstPeriodScoreLin / MUL_CONSTANT).toFixed(4))
      assert.equal(expectedAnalyst1FirstPeriodScoreLin, actualAnalyst1FirstPeriodScoreLin)

      let actualAnalyst1FirstPeriodScoreRat = await TRLInstance.weightedScore(ratWeights, [analyst1Scores[0], analyst1Scores[1]])
      actualAnalyst1FirstPeriodScoreRat = Number((actualAnalyst1FirstPeriodScoreRat / MUL_CONSTANT).toFixed(4))
      assert.equal(expectedAnalyst1FirstPeriodScoreRat, actualAnalyst1FirstPeriodScoreRat)

      let actualAnalyst1FirstPeriodScoreExp = await TRLInstance.weightedScore(expWeights, [analyst1Scores[0], analyst1Scores[1]])
      actualAnalyst1FirstPeriodScoreExp = Number((actualAnalyst1FirstPeriodScoreExp / MUL_CONSTANT).toFixed(4))
      assert.equal(expectedAnalyst1FirstPeriodScoreExp, actualAnalyst1FirstPeriodScoreExp)

      let actualAnalyst2FirstPeriodScoreLin = await TRLInstance.weightedScore(linWeights, [analyst2Scores[0], analyst2Scores[1]])
      actualAnalyst2FirstPeriodScoreLin = Number((actualAnalyst2FirstPeriodScoreLin / MUL_CONSTANT).toFixed(4))
      assert.equal(expectedAnalyst2FirstPeriodScoreLin, actualAnalyst2FirstPeriodScoreLin)

      let actualAnalyst2FirstPeriodScoreRat = await TRLInstance.weightedScore(ratWeights, [analyst2Scores[0], analyst2Scores[1]])
      actualAnalyst2FirstPeriodScoreRat = Number((actualAnalyst2FirstPeriodScoreRat / MUL_CONSTANT).toFixed(4))
      assert.equal(expectedAnalyst2FirstPeriodScoreRat, actualAnalyst2FirstPeriodScoreRat)

      let actualAnalyst2FirstPeriodScoreExp = await TRLInstance.weightedScore(expWeights, [analyst2Scores[0], analyst2Scores[1]])
      actualAnalyst2FirstPeriodScoreExp = Number((actualAnalyst2FirstPeriodScoreExp / MUL_CONSTANT).toFixed(4))
      assert.equal(expectedAnalyst2FirstPeriodScoreExp, actualAnalyst2FirstPeriodScoreExp)
    })
  })
  describe('Reputation Function should work', async () => {
    it('Should work', async () => {
      let epoch
      const stakedTokens = 999
      let TRLScoring
      await FrontierTokenInstance.approve(TRLInstance.address, stakedTokens, {from: voterAccounts[0]})

      const votesRecord = [60, 59, 61, 41, 56]
      const expectedResult = 52800000000

      let linWeights = [400000000, 300000000, 200000000, 100000000, 0]

      await TRLInstance.setReputationLinWeights(linWeights)

      // Buying votes and voting for the user
      for (let i = 0; i < 5; i++) {
        await TRLInstance.buyTokenVotes(votesRecord[i], {from: voterAccounts[0]})
        await TRLInstance.vote(candidateAccounts[0], votesRecord[i], {from: voterAccounts[0]})
        epoch = await TRLInstance.currentPeriod.call()
        TRLScoring = await TRLInstance.scoring.call(epoch, candidateAccounts[0])
        await advanceToBlock.advanceToBlock(web3.eth.blockNumber + 1 * config.ttl)
      }

      let res = await TRLInstance.reputation(epoch, candidateAccounts[0])
      assert.equal(expectedResult, res)
    })
    it('Should revert when weights are not set', async() => {
      let epoch
      const stakedTokens = 999
      let TRLScoring
      await FrontierTokenInstance.approve(TRLInstance.address, stakedTokens, {from: voterAccounts[0]})

      const votesRecord = [60, 59, 61, 41, 56]
      const expectedResult = 52800000000

      // Buying votes and voting for the user
      for (let i = 0; i < 5; i++) {
        await TRLInstance.buyTokenVotes(votesRecord[i], {from: voterAccounts[0]})
        await TRLInstance.vote(candidateAccounts[0], votesRecord[i], {from: voterAccounts[0]})
        epoch = await TRLInstance.currentPeriod.call()
        TRLScoring = await TRLInstance.scoring.call(epoch, candidateAccounts[0])
        await advanceToBlock.advanceToBlock(web3.eth.blockNumber + 1 * config.ttl)
      }
      await assertRevert(TRLInstance.reputation(epoch, candidateAccounts[0]))
    })

    it('Should revert when non-owner tries to set reputation weights', async() => {
      let epoch
      const stakedTokens = 999
      let TRLScoring
      await FrontierTokenInstance.approve(TRLInstance.address, stakedTokens, {from: voterAccounts[0]})

      const votesRecord = [60, 59, 61, 41, 56]
      const expectedResult = 52800000000
      let linWeights = [400000000, 300000000, 200000000, 100000000, 0]
      await assertRevert(TRLInstance.setReputationLinWeights(linWeights, {from: voterAccounts[1]}))
    })

    it('Should revert when reputation weights size is different than window size', async() => {
      let epoch
      const stakedTokens = 999
      let TRLScoring
      await FrontierTokenInstance.approve(TRLInstance.address, stakedTokens, {from: voterAccounts[0]})

      const votesRecord = [60, 59, 61, 41, 56]
      const expectedResult = 52800000000

      // set the wrong number of weights, 4 instead of 5
      let linWeights = [400000000, 300000000, 200000000, 100000000]
      await assertRevert(TRLInstance.setReputationLinWeights(linWeights))
    })
  })
})
