const { assertRevert } = require('./helpers/assertRevert')
const StackContract = artifacts.require('Stack')
const capacity = Math.floor(Math.random() * (10 - 5) + 5) // Setting an arbitrary period between 10 and 5 Blocks
let Stack

contract('Stack', function (accounts) {
  beforeEach(async () => {
    Stack = await StackContract.new(capacity)
  })
  describe('Initializing', async () => {
    it('Should have the stack pointer initialized to 0', async () => {
      const stackPointer = await Stack.stackPointer.call()
      assert.strictEqual(stackPointer.toNumber(), 0)
    })
    it('Should have an empty storage', async () => {
      const slotSize = await Stack.height.call()
      assert.strictEqual(slotSize.toNumber(), 0)
    })
    it('Should have properly initialized capacity', async () => {
      const totalCapacity = await Stack.totalCapacity.call()
      assert.strictEqual(totalCapacity.toNumber(), capacity)
    })
  })
  describe('Pushing a slot', async () => {
    it('Should increase the height by one when pushing', async () => {
      const initialHeight = await Stack.height.call()
      const slotSize = Math.floor(Math.random() * (capacity - 1) + 1)
      await Stack.push(slotSize)
      const finalHeight = await Stack.height.call()
      assert.strictEqual(finalHeight.toNumber(), initialHeight.toNumber() + 1)
    })
    it('Should increase the Stack pointer by imput size when pushing', async () => {
      const slotSize = Math.floor(Math.random() * (capacity - 1) + 1)
      await Stack.push(slotSize)
      const storedValue = await Stack.strg.call(0)
      assert.strictEqual(slotSize.storedValue)
    })
    it('Should have stored the value on storage array when pushing', async () => {
      const initialPointer = await Stack.stackPointer.call()
      const slotSize = Math.floor(Math.random() * (capacity - 1) + 1)
      await Stack.push(slotSize)
      const finalPointer = await Stack.stackPointer.call()
      assert.strictEqual(finalPointer.toNumber(), initialPointer.toNumber() + slotSize)
    })
    it('Should throw when trying to push over capacity', async () => {
      const initialPointer = await Stack.stackPointer.call()
      const slotSize = capacity + 1
      await assertRevert(Stack.push(slotSize))
    })
  })
  describe('Querying positions on Slot', async () => {
    it('Should return true when querying a value behind a unique pushed bound', async () => {
      await Stack.push(2)
      const isInBounds = await Stack.positionIsOnSlot(0, 1)
      assert.strictEqual(true, isInBounds)
    })
    it('Should return false when quering a value above a unique pushed bound', async () => {
      await Stack.push(2)
      const isInBounds = await Stack.positionIsOnSlot(0, 3)
      assert.strictEqual(false, isInBounds)
    })
    it('Should return true when quering a value between two pushed bounds', async () => {
      await Stack.push(2)
      await Stack.push(2)
      const isInBounds = await Stack.positionIsOnSlot(1, 3)
      assert.strictEqual(true, isInBounds)
    })
    it('Should return false when quering a value below of bounds of two pushed bounds', async () => {
      await Stack.push(2)
      await Stack.push(2)
      const isInBounds = await Stack.positionIsOnSlot(1, 1)
      assert.strictEqual(false, isInBounds)
    })
    it('Should return false when quering a value above of bounds of two pushed bounds', async () => {
      await Stack.push(2)
      await Stack.push(2)
      const isInBounds = await Stack.positionIsOnSlot(1, 5)
      assert.strictEqual(false, isInBounds)
    })
  })
  describe('Popping a slot', async () => {
    it('Should decrease the height by one when popping', async () => {
      const slotSize = Math.floor(Math.random() * (capacity - 1) + 1)
      await Stack.push(slotSize)
      const initialHeight = await Stack.height.call()
      await Stack.pop()
      const finalHeight = await Stack.height.call()
      assert.strictEqual(finalHeight.toNumber(), initialHeight.toNumber() - 1)
    })
    it('Should decrease the Stack pointer by imput size when popping', async () => {
      const slotSize = Math.floor(Math.random() * (capacity - 1) + 1)
      await Stack.push(slotSize)
      const initialPointer = await Stack.stackPointer.call()
      await Stack.pop()
      const finalPointer = await Stack.stackPointer.call()
      assert.strictEqual(finalPointer.toNumber(), initialPointer.toNumber() - slotSize)
    })
    it('Should throw when trying to push over capacity', async () => {
      const initialPointer = await Stack.stackPointer.call()
      const slotSize = capacity + 1
      await assertRevert(Stack.push(slotSize))
    })
  })
  describe('Emptying the stack', async () => {
    it('Should return 0 as a height after emptying the stack', async () => {
      const slotSize = 3
      await Stack.push(slotSize)
      await Stack.push(1)
      await Stack.empty()
      const finalHeight = await Stack.height.call()
      assert.strictEqual(0,finalHeight.toNumber())
    })
  })
})
