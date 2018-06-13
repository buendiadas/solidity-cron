module.exports = {
  stagesFromBounds: async function (stack, bounds) {
    for (let i = 0; i < bounds.length; i++) {
      if (i == 0) {
        await stack.push(bounds[i])
      } else if (bounds[i] != 0 && bounds[i] > bounds[i - 1]) {
        await stack.push(bounds[i] - (bounds[i] - 1))
      } else {
        return false
      }
    }
  }
}
