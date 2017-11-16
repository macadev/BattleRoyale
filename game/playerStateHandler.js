const canvasConfig = require('./canvasConfig')

const SPEED = 2
const FRICTION = 0.98

function processInputs(clientInputs, playerState) {
    if (clientInputs.up) {
        if (playerState.velY > -SPEED) {
            playerState.velY--;
        }
    }

    if (clientInputs.down) {
        if (playerState.velY < SPEED) {
            playerState.velY++;
        }
    }
    if (clientInputs.right) {
        if (playerState.velX < SPEED) {
            playerState.velX++;
        }
    }
    if (clientInputs.left) {
        if (playerState.velX > -SPEED) {
            playerState.velX--;
        }
    }

    playerState.velY *= FRICTION;
    playerState.y += playerState.velY;
    playerState.velX *= FRICTION;
    playerState.x += playerState.velX;

    if (playerState.x > canvasConfig.width - canvasConfig.edgeBuffer) {
        playerState.x = canvasConfig.width - canvasConfig.edgeBuffer;
    } else if (playerState.x <= 0 + canvasConfig.edgeBuffer) {
        playerState.x = canvasConfig.edgeBuffer;
    }

    if (playerState.y > canvasConfig.height - canvasConfig.edgeBuffer) {
        playerState.y = canvasConfig.height - canvasConfig.edgeBuffer;
    } else if (playerState.y <= 0 + canvasConfig.edgeBuffer) {
        playerState.y = canvasConfig.edgeBuffer;
    }
}

module.exports = {
    processInputs: processInputs
}