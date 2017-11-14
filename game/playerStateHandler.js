const SPEED = 2
const FRICTION = 0.98

function processInputs(clientInputs, playerState) {
    if (clientInputs.up) {
        // if (playerState.velY > -SPEED) {
        //     playerState.velY--;
        // }
        playerState.velY = -2
    }

    if (clientInputs.down) {
        // if (playerState.velY < SPEED) {
        //     playerState.velY++;
        // }
        playerState.velY = 2
    }
    if (clientInputs.right) {
        // if (playerState.velX < SPEED) {
        //     playerState.velX++;
        // }
        playerState.velX = 2
    }
    if (clientInputs.left) {
        // if (playerState.velX > -SPEED) {
        //     playerState.velX--;
        // }
        playerState.velX = -2
    }

    // playerState.velY *= FRICTION;
    playerState.y += playerState.velY;
    // playerState.velX *= FRICTION;
    playerState.x += playerState.velX;

    if (playerState.x >= 295) {
        playerState.x = 295;
    } else if (playerState.x <= 5) {
        playerState.x = 5;
    }

    if (playerState.y > 295) {
        playerState.y = 295;
    } else if (playerState.y <= 5) {
        playerState.y = 5;
    }

    playerState.velX = 0;
    playerState.velY = 0;
}

module.exports = {
    processInputs: processInputs
}