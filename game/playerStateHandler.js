const canvasConfig = require('./canvasConfig')

const GRAVITY  = 9.8 * 8 // default (exagerated) gravity
const MAX_HORIZONTAL_SPEED  = 60      // default max horizontal speed (15 tiles per second)
const MAX_VERTICAL_SPEED    = 60      // default max vertical speed   (60 tiles per second)
const ACCEL    = 45     
const FRICTION = 1/8     // default take 1/6 second to stop from maxdx (horizontal friction)
const IMPULSE  = 2000    // default player jump impulse

function processInputs(clientInputs, playerState, dt) {
    // console.log(playerState); // TODO: WHY AM I GETTING NaNs?
    playerState.accelerationX = 0;
    playerState.accelerationY = GRAVITY;
    
    if (clientInputs.up) {
        playerState.accelerationY = playerState.accelerationY - IMPULSE;
        // if (playerState.velY > -SPEED) {
        //     playerState.velY--;
        // }
    }

    // if (clientInputs.down) {
    //     if (playerState.velY < SPEED) {
    //         playerState.velY++;
    //     }
    // }

    if (clientInputs.right) {
        playerState.accelerationX = playerState.accelerationX + ACCEL;
        // if (playerState.velX < SPEED) {
        //     playerState.velX++;
        // }
    }

    if (clientInputs.left) {
        playerState.accelerationX = playerState.accelerationX - ACCEL;
        // if (playerState.velX > -SPEED) {
        //     playerState.velX--;
        // }
    }

    playerState.x  = playerState.x  + (dt * playerState.velX);
    playerState.y  = playerState.y  + (dt * playerState.velY);
    playerState.velX = bound(playerState.velX + (dt * playerState.accelerationX), -MAX_HORIZONTAL_SPEED, MAX_HORIZONTAL_SPEED);
    playerState.velY = bound(playerState.velY + (dt * playerState.accelerationY), -MAX_VERTICAL_SPEED, MAX_VERTICAL_SPEED);
    // console.log("Server X", serverPlayerState.x);
    // console.log("Server Y", serverPlayerState.y);

    // playerState.velY *= FRICTION;
    // playerState.y += playerState.velY;
    // playerState.velX *= FRICTION;
    // playerState.x += playerState.velX;

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

function bound(x, min, max) {
    return Math.max(min, Math.min(max, x));
}

module.exports = {
    processInputs: processInputs
}