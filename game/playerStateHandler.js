const tileMapConfig = require('./tileMapConfig')
const tileUtils = require('./tileUtils')

const GRAVITY               = 9.8 * 22 // default (exagerated) gravity
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

    let old_x = playerState.x;
    let old_y = playerState.y;

    playerState.x  = playerState.x  + (dt * playerState.velX);
    let surroundingWalls = getSurroundingTiles(playerState);

    let x_overlaps;
    let y_overlaps;
    let collision;
    let collision_occurred = false;
    for (let wall of surroundingWalls) {
        x_overlaps = (playerState.x < wall.x + wall.width) && (playerState.x + tileMapConfig.TILE * 1.5 > wall.x)
        y_overlaps = (playerState.y < wall.y + wall.height) && (playerState.y + tileMapConfig.TILE * 2.5 > wall.y)
        collision = x_overlaps && y_overlaps
        if (collision) {
            collision_occurred = true;
        }
    }

    if (collision_occurred) {
        playerState.x = old_x;
        playerState.velX = 0;
    }

    playerState.y  = playerState.y  + (dt * playerState.velY);
    surroundingWalls = getSurroundingTiles(playerState);
    
    collision_occurred = false;
    for (let wall of surroundingWalls) {
        x_overlaps = (playerState.x < wall.x + wall.width) && (playerState.x + tileMapConfig.TILE * 1.5 > wall.x)
        y_overlaps = (playerState.y < wall.y + wall.height) && (playerState.y + tileMapConfig.TILE * 2.5 > wall.y)
        collision = x_overlaps && y_overlaps
        if (collision) {
            collision_occurred = true;
        }
    }

    if (collision_occurred) {
        playerState.y = old_y;
        playerState.velY = 0;
    }

    playerState.velX = bound(playerState.velX + (dt * playerState.accelerationX), -MAX_HORIZONTAL_SPEED, MAX_HORIZONTAL_SPEED);
    playerState.velY = bound(playerState.velY + (dt * playerState.accelerationY), -MAX_VERTICAL_SPEED, MAX_VERTICAL_SPEED);

    if ((wasleft  && (playerState.velX > 0)) || (wasright && (playerState.velX < 0))) {
        playerState.velX = 0; // clamp at zero to prevent friction from making us jiggle side to side
    }

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

function getSurroundingTiles(playerState, allTiles) {
    let TOP_EDGE_Y =  playerState.y;
    let LEFT_EDGE_X = playerState.x;
    let RIGHT_EDGE_X = playerState.x + tileMapConfig.TILE * 1.5;
    let BOTTOM_EDGE_Y = playerState.y + tileMapConfig.TILE * 2.5;
    
    let vertical_tile_indexes = new Set();
    let horizontal_tile_indexes = new Set();

    let tileDistVert = TOP_EDGE_Y;
    while (tileDistVert < BOTTOM_EDGE_Y) {
        vertical_tile_indexes.add(tileUtils.p2t(tileDistVert));
        
        if (tileDistVert + tileMapConfig.TILE > BOTTOM_EDGE_Y) {
            vertical_tile_indexes.add(tileUtils.p2t(BOTTOM_EDGE_Y));
            break;
        }

        tileDistVert += 32;
    }

    let tileDistHor = LEFT_EDGE_X;
    while (tileDistHor <= RIGHT_EDGE_X) {
        horizontal_tile_indexes.add(tileUtils.p2t(tileDistHor));

        if (tileDistHor + tileMapConfig.TILE > RIGHT_EDGE_X) {
            horizontal_tile_indexes.add(tileUtils.p2t(RIGHT_EDGE_X));
            break;
        }

        tileDistHor += 32;
    }

    let surroundingWalls = []
    for (let vertIndex of vertical_tile_indexes) {
        for (let horIndex of horizontal_tile_indexes) {
            if (!allTiles) {
                if (tileUtils.tcell(horIndex, vertIndex) !== 10) continue; 
            }
            surroundingWalls.push({
                x: tileUtils.t2p(horIndex),
                y: tileUtils.t2p(vertIndex),
                width: tileMapConfig.TILE,
                height: tileMapConfig.TILE
            })
        }
    }
    
    return surroundingWalls;
}

function bound(x, min, max) {
    return Math.max(min, Math.min(max, x));
}

module.exports = {
    processInputs: processInputs,
    getSurroundingTiles: getSurroundingTiles
}