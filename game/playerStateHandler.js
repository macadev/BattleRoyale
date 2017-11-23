const tileMapConfig = require('./tileMapConfig')
const tileUtils = require('./tileUtils')

const GRAVITY               = 9.8 * 12 // default (exagerated) gravity
const MAX_HORIZONTAL_SPEED  = tileMapConfig.METER * 15      // default max horizontal speed (15 tiles per second)
const MAX_VERTICAL_SPEED    = tileMapConfig.METER * 60      // default max vertical speed   (60 tiles per second)
const ACCEL                 = MAX_HORIZONTAL_SPEED * 2     
const FRICTION              = MAX_HORIZONTAL_SPEED * 6     // default take 1/6 second to stop from maxdx (horizontal friction)
const IMPULSE               = 3000    // default player jump impulse

function processInputs(clientInputs, playerState, dt) {
    let wasleft    = playerState.velX  < 0;
    let wasright   = playerState.velX  > 0;
    
    playerState.accelerationX = 0;
    playerState.accelerationY = GRAVITY;

    if (clientInputs.up) {
        playerState.accelerationY = playerState.accelerationY - IMPULSE;
    }

    if (clientInputs.right) {
        playerState.accelerationX = playerState.accelerationX + ACCEL;
    } else if (wasright) {
        playerState.accelerationX = playerState.accelerationX - FRICTION;
    }

    if (clientInputs.left) {
        playerState.accelerationX = playerState.accelerationX - ACCEL;
    } else if (wasleft) {
        playerState.accelerationX = playerState.accelerationX + FRICTION;
    }

    playerState.x  = playerState.x  + (dt * playerState.velX);
    playerState.y  = playerState.y  + (dt * playerState.velY);
    playerState.velX = bound(playerState.velX + (dt * playerState.accelerationX), -MAX_HORIZONTAL_SPEED, MAX_HORIZONTAL_SPEED);
    playerState.velY = bound(playerState.velY + (dt * playerState.accelerationY), -MAX_VERTICAL_SPEED, MAX_VERTICAL_SPEED);

    if ((wasleft  && (playerState.velX > 0)) || (wasright && (playerState.velX < 0))) {
        playerState.velX = 0; // clamp at zero to prevent friction from making us jiggle side to side
    }

    let TOP_EDGE_Y =  playerState.y;
    let LEFT_EDGE_X = playerState.x;
    let RIGHT_EDGE_X = playerState.x + tileMapConfig.TILE * 1.5;
    let BOTTOM_EDGE_Y = playerState.y + tileMapConfig.TILE * 2.5;
    
    let UPPER_LEFT_CORNER_X = playerState.x;
    let UPPER_RIGHT_CORNER_X = playerState.x + tileMapConfig.TILE * 1.5;

    let bottomRightCornerTile = tileUtils.cell(RIGHT_EDGE_X, BOTTOM_EDGE_Y);
    let bottomLeftCornerTile = tileUtils.cell(LEFT_EDGE_X, BOTTOM_EDGE_Y);
    let bottomMiddleTile = tileUtils.cell(playerState.x + tileMapConfig.TILE * 0.75, BOTTOM_EDGE_Y);

    let topLeftCornerTile = tileUtils.cell(LEFT_EDGE_X, TOP_EDGE_Y);
    let topRightCornerTile = tileUtils.cell(RIGHT_EDGE_X, TOP_EDGE_Y);
    let topMiddleTile = tileUtils.cell(playerState.x + tileMapConfig * 0.75);

    if (playerState.velY > 0) {
        // Player moving downwards
        if (bottomLeftCornerTile === 10 || bottomRightCornerTile === 10 || bottomMiddleTile === 10) {
            console.log("Collision on bottom edge detected.");
            playerState.y = playerState.y - BOTTOM_EDGE_Y % tileMapConfig.TILE;
            playerState.velY = 0;
        }
    } else if (playerState.velY < 0) {
        // Player moving upwards
        if (topLeftCornerTile === 10 || topRightCornerTile === 10 || topMiddleTile === 10) {
            console.log("Collision on top edge detected");
            playerState.y = playerState.y + (tileMapConfig.TILE - TOP_EDGE_Y % tileMapConfig.TILE);
            playerState.velY = 0;
        }
    }

    TOP_EDGE_Y =  playerState.y;
    LEFT_EDGE_X = playerState.x;
    RIGHT_EDGE_X = playerState.x + tileMapConfig.TILE * 1.5;
    BOTTOM_EDGE_Y = playerState.y + tileMapConfig.TILE * 2.5;
    
    UPPER_LEFT_CORNER_X = playerState.x;
    UPPER_RIGHT_CORNER_X = playerState.x + tileMapConfig.TILE * 1.5;

    bottomRightCornerTile = tileUtils.cell(RIGHT_EDGE_X, BOTTOM_EDGE_Y);
    bottomLeftCornerTile = tileUtils.cell(LEFT_EDGE_X, BOTTOM_EDGE_Y);
    bottomMiddleTile = tileUtils.cell(playerState.x + tileMapConfig.TILE * 0.75, BOTTOM_EDGE_Y);

    topLeftCornerTile = tileUtils.cell(LEFT_EDGE_X, TOP_EDGE_Y);
    topRightCornerTile = tileUtils.cell(RIGHT_EDGE_X, TOP_EDGE_Y);
    topMiddleTile = tileUtils.cell(playerState.x + tileMapConfig * 0.75);

    let leftEdgeMiddleTile = tileUtils.cell(LEFT_EDGE_X, playerState.y + playerState.y * 1.25);
    let rightEdgeMiddleTile = tileUtils.cell(RIGHT_EDGE_X, playerState.y + playerState.y * 1.25);

    if (playerState.velX < 0) {
        // Player moving left
        if (topLeftCornerTile === 10 || bottomLeftCornerTile === 10 || leftEdgeMiddleTile === 10) {
            console.log("Collision detected on left edge");
            playerState.x = playerState.x + (tileMapConfig.TILE - playerState.x % 32);
            playerState.velX = 0;
        }
    }

    // if (playerState.x > tileMapConfig.WIDTH - tileMapConfig.EDGE_BUFFER) {
    //     playerState.x = tileMapConfig.WIDTH - tileMapConfig.EDGE_BUFFER;
    // } else if (playerState.x <= 0 + tileMapConfig.EDGE_BUFFER) {
    //     playerState.x = tileMapConfig.EDGE_BUFFER;
    // }

    // if (playerState.y > tileMapConfig.HEIGHT - tileMapConfig.EDGE_BUFFER) {
    //     playerState.y = tileMapConfig.HEIGHT - tileMapConfig.EDGE_BUFFER;
    // } else if (playerState.y <= 0 + tileMapConfig.EDGE_BUFFER) {
    //     playerState.y = tileMapConfig.EDGE_BUFFER;
    // }
}

function bound(x, min, max) {
    return Math.max(min, Math.min(max, x));
}

module.exports = {
    processInputs: processInputs
}