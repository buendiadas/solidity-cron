/* global artifacts, contract, web3, beforeEach, assert, it, describe */
const AllowanceContract = artifacts.require('Allowance')
const { assertRevert } = require('./helpers/assertRevert')

contract('Allowance', function (accounts) {
  let AllowanceInstance
  const owner = web3.eth.accounts[0]
  const entityAddress = web3.eth.accounts[1]
  const entityName = 'entity-name'
  const allowanceValue = 20
  const period = 0

  // let voterAccounts = web3.eth.accounts.slice(1, 4)

  beforeEach(async () => {
    AllowanceInstance = await AllowanceContract.new({ from: owner })
  })

  describe('Adding Entities', async () => {
    it('Adds new valid entity', async () => {
      await AllowanceInstance.addEntity(
        entityAddress,
        entityName,
        allowanceValue,
        period,
        { from: owner }
      )
      const returnedAllowance = await AllowanceInstance.getEntityAllowance(
        entityAddress,
        period
      )
      assert.equal(
        returnedAllowance,
        allowanceValue,
        'Returned allowance not the same that was defined'
      )
    })

    it('Returns correct name', async () => {
      await AllowanceInstance.addEntity(
        entityAddress,
        entityName,
        allowanceValue,
        period,
        { from: owner }
      )
      const returnedName = await AllowanceInstance.getEntityName(
        entityAddress,
        period
      )
      assert.equal(
        returnedName,
        entityName,
        'Returned name not the same that was defined'
      )
    })

    it('Returns correct name and allowance', async () => {
      await AllowanceInstance.addEntity(
        entityAddress,
        entityName,
        allowanceValue,
        period,
        { from: owner }
      )
      const returnedNameAndAllowance = await AllowanceInstance.getEntityNameAndAllowance(
        entityAddress,
        period
      )
      assert.equal(
        returnedNameAndAllowance[0],
        entityName,
        'Returned name not the same that was defined'
      )
      assert.equal(
        returnedNameAndAllowance[1],
        allowanceValue,
        'Returned allowance not the same that was defined'
      )
    })

    it('Is able to delete entity', async () => {
      let returnedAllowance = -1
      await AllowanceInstance.addEntity(
        entityAddress,
        entityName,
        allowanceValue,
        period,
        { from: owner }
      )
      returnedAllowance = await AllowanceInstance.getEntityAllowance(
        entityAddress,
        period
      )
      assert.equal(
        returnedAllowance,
        allowanceValue,
        'Returned allowance not the same that was defined'
      )
      await AllowanceInstance.removeEntity(entityAddress, period, {
        from: owner
      })
      returnedAllowance = await AllowanceInstance.getEntityAllowance(
        entityAddress,
        period
      )
      assert.equal(returnedAllowance, 0, 'Returned allowance should be zero')
    })

    it('Reverts on invalid Entity', async () => {
      const invalidAllowanceValue = 101 // invalid value, for being >100
      await assertRevert(
        AllowanceInstance.addEntity(
          entityAddress,
          entityName,
          invalidAllowanceValue,
          period,
          { from: owner }
        )
      )
    })
  })
})
