const { assertRevert } = require('./helpers/assertRevert')

const OwnedRegistryContract = artifacts.require('OwnedRegistry')
const MAXNUMCANDIDATES = 5
const ADMIN_ACCOUNT = web3.eth.accounts[0]
const NOT_ADMIN_ACCOUNT = web3.eth.accounts[1]
const TEST_ACCOUNT = web3.eth.accounts[2]

let Registry

contract('OwnedRegistry', function (accounts) {
  beforeEach(async () => {
    Registry = await OwnedRegistryContract.new(5, {from: ADMIN_ACCOUNT})
  })
  describe('Whitelisting accounts', async () => {
    it('Should whiteList an account if it is required by the owner', async () => {
      await Registry.whiteList(TEST_ACCOUNT, {from: ADMIN_ACCOUNT})
      let isWhitelisted = await Registry.isWhitelisted.call(TEST_ACCOUNT)
      assert.strictEqual(true, isWhitelisted)
    })
    it('Should NOT whitelist an account if it is required by an account different than the owner', async () => {
      await assertRevert(Registry.whiteList(TEST_ACCOUNT, {from: NOT_ADMIN_ACCOUNT}))
    })
    it('Should increase the registry index after whitelisting an account ', async () => {
      let initialIndex = await Registry.listingCounter.call()
      await Registry.whiteList(TEST_ACCOUNT, {from: ADMIN_ACCOUNT})
      let updatedNumberOfListings = await Registry.listingCounter.call()
      assert.equal(initialIndex.toNumber() + 1, updatedNumberOfListings.toNumber())
    })
    it('Should increase the listing Counter counter N times before the MAX is reached', async () => {
      let initialNumberOfListings = await Registry.listingCounter.call()
      let i = 0
      while (i < MAXNUMCANDIDATES) {
        await Registry.whiteList(TEST_ACCOUNT + i, {from: ADMIN_ACCOUNT})
        i++
      }
      let updatedNumberOfListings = await Registry.listingCounter.call()
      assert.equal(initialNumberOfListings.toNumber() + MAXNUMCANDIDATES, updatedNumberOfListings.toNumber())
    })
    it('Should throw if the analyst is added twice', async () => {
      await Registry.whiteList(TEST_ACCOUNT)
      await assertRevert(Registry.whiteList(TEST_ACCOUNT, {from: ADMIN_ACCOUNT}))
    })
  })
  describe('Removing listings', async () => {
    it('Should remove a candidate if it is required by the owner', async () => {
      await Registry.whiteList(TEST_ACCOUNT)
      await Registry.remove(TEST_ACCOUNT)
      let isInTheList = await Registry.isWhitelisted.call(TEST_ACCOUNT)
      assert.strictEqual(false, isInTheList)
    })
    it('Should NOT remove an account if it is required by an account different than the owner', async () => {
      await assertRevert(Registry.remove(TEST_ACCOUNT, {from: NOT_ADMIN_ACCOUNT}))
    })
    it('Should decrease the listing counter after removing a listing ', async () => {
      let initialNumberOfListings = await Registry.listingCounter.call()
      await Registry.whiteList(TEST_ACCOUNT)
      await Registry.remove(TEST_ACCOUNT)
      let updatedNumberOfListings = await Registry.listingCounter.call()
      assert.equal(initialNumberOfListings.toNumber(), updatedNumberOfListings.toNumber())
    })
  })
})
