const tileMapConfig = require('./tileMapConfig')

function getHeightOfPlayerPixels() {
    return tileMapConfig.TILE * 2.5;
}

function getWidthOfPlayerPixels() {
    return tileMapConfig.TILE * 1.5;
}

module.exports = {
    getHeightOfPlayerPixels: getHeightOfPlayerPixels,
    getWidthOfPlayerPixels: getWidthOfPlayerPixels
}