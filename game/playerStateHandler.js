const tileMapConfig = require('./tileMapConfig')
const tileUtils = require('./tileUtils')
const getHeightOfPlayerPixels = require('./playerUtils').getHeightOfPlayerPixels;
const getWidthOfPlayerPixels = require('./playerUtils').getWidthOfPlayerPixels;

const GRAVITY               = 9.8 * 22 // default (exagerated) gravity
const MAX_HORIZONTAL_SPEED  = tileMapConfig.METER * 15      // default max horizontal speed (15 tiles per second)
const MAX_VERTICAL_SPEED    = tileMapConfig.METER * 60      // default max vertical speed   (60 tiles per second)
const ACCEL                 = MAX_HORIZONTAL_SPEED * 2     
const FRICTION              = MAX_HORIZONTAL_SPEED * 6     // default take 1/6 second to stop from maxdx (horizontal friction)
const IMPULSE               = 10000    // default player jump impulse

function processInputs(clientInputs, playerState, dt) {
    let wasleft    = playerState.velX  < 0;
    let wasright   = playerState.velX  > 0;
    
    playerState.accelerationX = 0;
    playerState.accelerationY = GRAVITY;

    if (clientInputs.up && !playerState.jumping) {
        playerState.accelerationY = playerState.accelerationY - IMPULSE;
        playerState.jumping = true;
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
    let x_overlaps, y_overlaps;
    let collision_occurred;
    for (let wall of surroundingWalls) {
        x_overlaps = (playerState.x < wall.x + wall.width) && (playerState.x + getWidthOfPlayerPixels() > wall.x)
        y_overlaps = (playerState.y < wall.y + wall.height) && (playerState.y + getHeightOfPlayerPixels() > wall.y)
        collision_occurred = x_overlaps && y_overlaps
        if (collision_occurred) {
            playerState.x = old_x;
            playerState.velX = 0;
            break;
        }
    }

    playerState.y  = playerState.y  + (dt * playerState.velY);
    
    surroundingWalls = getSurroundingTiles(playerState);
    collision_occurred = false;
    for (let wall of surroundingWalls) {
        x_overlaps = (playerState.x < wall.x + wall.width) && (playerState.x + getWidthOfPlayerPixels() > wall.x)
        y_overlaps = (playerState.y < wall.y + wall.height) && (playerState.y + getHeightOfPlayerPixels() > wall.y)
        collision_occurred = x_overlaps && y_overlaps

        if (collision_occurred) {
            playerState.y = old_y;
            playerState.velY = 0;
            break;
        }
    }

    // check if player is standing on floor
    let tilesUnderPlayer = getTilesUnderPlayer(playerState);
    let collidingWithFloor = false;
    if (collision_occurred) {
        tilesUnderPlayer.forEach((tile) => {
            if (tile.isWall) playerState.jumping = false;
        })
    } else {
        playerState.jumping = true;
    }

    playerState.velX = bound(playerState.velX + (dt * playerState.accelerationX), -MAX_HORIZONTAL_SPEED, MAX_HORIZONTAL_SPEED);
    playerState.velY = bound(playerState.velY + (dt * playerState.accelerationY), -MAX_VERTICAL_SPEED, MAX_VERTICAL_SPEED);

    if ((wasleft  && (playerState.velX > 0)) || (wasright && (playerState.velX < 0))) {
        playerState.velX = 0; // clamp at zero to prevent friction from making us jiggle side to side
    }

    handleCollisionsWithTileGridBoundaries(playerState);
}

function handleCollisionsWithTileGridBoundaries(playerState) {
    if (playerState.x + getWidthOfPlayerPixels() > tileMapConfig.WIDTH) {
        playerState.x = tileMapConfig.WIDTH - getWidthOfPlayerPixels();
        playerState.velX = 0;
    } else if (playerState.x < 0) {
        playerState.x = 0;
        playerState.velX = 0;
    }

    if (playerState.y < 0) {
        playerState.y = 0;
        playerState.velY = 0;
    } else if (playerState.y + getHeightOfPlayerPixels() > tileMapConfig.HEIGHT) {
        playerState.y = tileMapConfig.HEIGHT;
        playerState.velY = 0;
    }
}

function getTilesUnderPlayer(playerState) {
    let LEFT_EDGE_X = playerState.x;
    let RIGHT_EDGE_X = playerState.x + getWidthOfPlayerPixels();
    let BOTTOM_EDGE_Y = playerState.y + getHeightOfPlayerPixels();
    
    let rowUnderPlayerPixels = tileUtils.t2p(tileUtils.p2t(BOTTOM_EDGE_Y) + 1);

    let tileDistHor = LEFT_EDGE_X; // 164.4 // 212.4
    let tilesUnderPlayer = [];
    let edgeOfHorizontalDist;
    while (tileDistHor <= RIGHT_EDGE_X) {
        edgeOfHorizontalDist = tileUtils.t2p(tileUtils.p2t(tileDistHor));
        tilesUnderPlayer.push({
            x: edgeOfHorizontalDist,
            y: rowUnderPlayerPixels,
            width: tileMapConfig.TILE,
            height: tileMapConfig.TILE,
            isWall: (tileUtils.cell(edgeOfHorizontalDist, rowUnderPlayerPixels) === 10)
        });

        if (tileDistHor + tileMapConfig.TILE > RIGHT_EDGE_X) {
            edgeOfHorizontalDist = tileUtils.t2p(tileUtils.p2t(RIGHT_EDGE_X));
            tilesUnderPlayer.push({
                x: edgeOfHorizontalDist,
                y: rowUnderPlayerPixels,
                width: tileMapConfig.TILE,
                height: tileMapConfig.TILE,
                isWall: (tileUtils.cell(edgeOfHorizontalDist, rowUnderPlayerPixels) === 10)
            });
            
            break;
        }

        tileDistHor += 32;
    }

    return tilesUnderPlayer;
}

function getSurroundingTiles(playerState, allTiles) {
    let TOP_EDGE_Y =  playerState.y;
    let LEFT_EDGE_X = playerState.x;
    let RIGHT_EDGE_X = playerState.x + getWidthOfPlayerPixels();
    let BOTTOM_EDGE_Y = playerState.y + getHeightOfPlayerPixels();
    
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
    getSurroundingTiles: getSurroundingTiles,
    getTilesUnderPlayer: getTilesUnderPlayer
}