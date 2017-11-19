const canvasConfig = require('./canvasConfig')

const GRAVITY  = 9.8 * 12 // default (exagerated) gravity
const MAX_HORIZONTAL_SPEED  = 120      // default max horizontal speed (15 tiles per second)
const MAX_VERTICAL_SPEED    = 120      // default max vertical speed   (60 tiles per second)
const ACCEL    = 45     
const FRICTION = 1/8     // default take 1/6 second to stop from maxdx (horizontal friction)
const IMPULSE  = 2000    // default player jump impulse

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

    if (playerState.x > canvasConfig.WIDTH - canvasConfig.EDGE_BUFFER) {
        playerState.x = canvasConfig.WIDTH - canvasConfig.EDGE_BUFFER;
    } else if (playerState.x <= 0 + canvasConfig.EDGE_BUFFER) {
        playerState.x = canvasConfig.EDGE_BUFFER;
    }

    if (playerState.y > canvasConfig.HEIGHT - canvasConfig.EDGE_BUFFER) {
        playerState.y = canvasConfig.HEIGHT - canvasConfig.EDGE_BUFFER;
    } else if (playerState.y <= 0 + canvasConfig.EDGE_BUFFER) {
        playerState.y = canvasConfig.EDGE_BUFFER;
    }
}

function bound(x, min, max) {
    return Math.max(min, Math.min(max, x));
}

module.exports = {
    processInputs: processInputs
}