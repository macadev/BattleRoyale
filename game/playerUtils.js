const tileMapConfig = require('./tileMapConfig')

const PLAYER_HEIGHT = tileMapConfig.TILE * 2.5
const PLAYER_WIDTH = tileMapConfig.TILE * 1.5

function getHeightOfPlayerPixels() {
    return PLAYER_HEIGHT
}

function getWidthOfPlayerPixels() {
    return PLAYER_WIDTH
}

module.exports = {
    getHeightOfPlayerPixels: getHeightOfPlayerPixels,
    getWidthOfPlayerPixels: getWidthOfPlayerPixels
}