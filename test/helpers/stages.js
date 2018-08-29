module.exports = {
  stagesFromBounds: async function (periodicStages, bounds) {
    for (let i = 0; i < bounds.length; i++) {
      if (i == 0) {
        await periodicStages.pushStage(bounds[i])
      } else if (bounds[i] != 0 && bounds[i] > bounds[i - 1]) {
        await periodicStages.pushStage(bounds[i] - (bounds[i] - 1))
      } else {
        return false
      }
    }
  }
}
