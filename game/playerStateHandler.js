const tileMapConfig = require('./tileMapConfig')

const GRAVITY               = 9.8 * 12 // default (exagerated) gravity
const MAX_HORIZONTAL_SPEED  = 120      // default max horizontal speed (15 tiles per second)
const MAX_VERTICAL_SPEED    = 400      // default max vertical speed   (60 tiles per second)
const ACCEL                 = 540     
const FRICTION              = 0.98     // default take 1/6 second to stop from maxdx (horizontal friction)
const IMPULSE               = 500    // default player jump impulse

function processInputs(clientInputs, playerState, dt) {
    playerState.accelerationX = 0;
    playerState.accelerationY = GRAVITY;
    
    if (clientInputs.up) {
        playerState.accelerationY = playerState.accelerationY - IMPULSE;
    }

    if (clientInputs.right) {
        playerState.accelerationX = playerState.accelerationX + ACCEL;
    }

    if (clientInputs.left) {
        playerState.accelerationX = playerState.accelerationX - ACCEL;
    }

    playerState.x  = playerState.x  + (dt * playerState.velX);
    playerState.y  = playerState.y  + (dt * playerState.velY);
    playerState.velX = bound(playerState.velX + (dt * playerState.accelerationX), -MAX_HORIZONTAL_SPEED, MAX_HORIZONTAL_SPEED);
    playerState.velY = bound(playerState.velY + (dt * playerState.accelerationY), -MAX_VERTICAL_SPEED, MAX_VERTICAL_SPEED);

    console.log(playerState.velX);
    playerState.velX = playerState.velX * FRICTION;

    if (playerState.x > tileMapConfig.WIDTH - tileMapConfig.EDGE_BUFFER) {
        playerState.x = tileMapConfig.WIDTH - tileMapConfig.EDGE_BUFFER;
    } else if (playerState.x <= 0 + tileMapConfig.EDGE_BUFFER) {
        playerState.x = tileMapConfig.EDGE_BUFFER;
    }

    if (playerState.y > tileMapConfig.HEIGHT - tileMapConfig.EDGE_BUFFER) {
        playerState.y = tileMapConfig.HEIGHT - tileMapConfig.EDGE_BUFFER;
    } else if (playerState.y <= 0 + tileMapConfig.EDGE_BUFFER) {
        playerState.y = tileMapConfig.EDGE_BUFFER;
    }
}

function bound(x, min, max) {
    return Math.max(min, Math.min(max, x));
}

module.exports = {
    processInputs: processInputs
}