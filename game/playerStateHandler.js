const tileMapConfig = require('./tileMapConfig')
const tileUtils = require('./tileUtils')
const getHeightOfPlayerPixels = require('./playerUtils').getHeightOfPlayerPixels;
const getWidthOfPlayerPixels = require('./playerUtils').getWidthOfPlayerPixels;

const GRAVITY               = 9.8 * 100 // default (exagerated) gravity
const MAX_HORIZONTAL_SPEED  = tileMapConfig.METER * 12      // default max horizontal speed (15 tiles per second)
const MAX_VERTICAL_SPEED    = tileMapConfig.METER * 60      // default max vertical speed   (60 tiles per second)
const ACCEL                 = MAX_HORIZONTAL_SPEED * 2     
const FRICTION              = MAX_HORIZONTAL_SPEED * 6     // default take 1/6 second to stop from maxdx (horizontal friction)
const IMPULSE               = 21000    // default player jump impulse

function processInputs(clientInputs, playerState, dt, gameState, playerSocketId) {
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

    playerState.x  = playerState.x  + (dt * playerState.velX);

    // Colision entre jugadores en el X axis
    for (let enemyPlayerSockeId in gameState.playerStates) {
        // No evaluar colision entre el jugador y si mismo
        if (enemyPlayerSockeId === playerSocketId) {
            continue;
        }

        let enemyPlayerState = gameState.playerStates[enemyPlayerSockeId]

        if (playerState.x < enemyPlayerState.x + getWidthOfPlayerPixels() &&
            playerState.x + getWidthOfPlayerPixels() > enemyPlayerState.x &&
            playerState.y < enemyPlayerState.y + getHeightOfPlayerPixels() &&
            playerState.y + getHeightOfPlayerPixels() > enemyPlayerState.y) {
                if (playerState.velX > 0) {
                    // derecha
                    playerState.x = enemyPlayerState.x - getWidthOfPlayerPixels()
                    playerState.velX = 0
                } else if (playerState.velX < 0) {
                    // izquierda
                    playerState.x = enemyPlayerState.x + getWidthOfPlayerPixels()
                    playerState.velX = 0
                }
        }
    }

    let tilesVerticalEdges = getTilesOnTheVerticalEdges(playerState);

    if (playerState.velX > 0) {
        // moving right
        for (let tileOnRightEdge of tilesVerticalEdges.rightEdge) {
            if (tileOnRightEdge.isWall) {
                // collision occurred
                playerState.x = tileOnRightEdge.x - getWidthOfPlayerPixels();
                playerState.velX = 0;
                break;
            }
        }
    } else if (playerState.velX < 0) {
        // moving left
        for (let tileOnLeftEdge of tilesVerticalEdges.leftEdge) {
            if (tileOnLeftEdge.isWall) {
                // collision occurred
                playerState.x = tileOnLeftEdge.x + tileMapConfig.TILE;
                playerState.velX = 0;
                break;
            }
        }
    }

    playerState.y  = playerState.y  + (dt * playerState.velY);

    // Colision entre jugadores en el Y axis
    for (let enemyPlayerSockeId in gameState.playerStates) {
        // No evaluar colision entre el jugador y si mismo
        if (enemyPlayerSockeId === playerSocketId) {
            continue;
        }

        let enemyPlayerState = gameState.playerStates[enemyPlayerSockeId]

        if (playerState.x < enemyPlayerState.x + getWidthOfPlayerPixels() &&
            playerState.x + getWidthOfPlayerPixels() > enemyPlayerState.x &&
            playerState.y < enemyPlayerState.y + getHeightOfPlayerPixels() &&
            playerState.y + getHeightOfPlayerPixels() > enemyPlayerState.y) {
                if (playerState.velY > 0) {
                    // abajo
                    playerState.accelerationY = playerState.accelerationY - IMPULSE;
                    playerState.velY = 0
                    playerState.jumping = true;
                    playerState.y = enemyPlayerState.y - getHeightOfPlayerPixels()
                    playerState.jumping = false
                } else if (playerState.velY < 0) {
                    // arriba
                    playerState.y = enemyPlayerState.y + getHeightOfPlayerPixels()
                    playerState.velY = 0
                }
        }
    }
    
    let tilesHorizontalEdges = getTilesOnTheHorizontalEdges(playerState);
    let collision = false;
    if (playerState.velY > 0) {
        // moving downwards
        for (let tileOnBottomEdge of tilesHorizontalEdges.bottomEdge) {
            if (tileOnBottomEdge.isWall) {
                // collision occurred
                playerState.y = tileOnBottomEdge.y - getHeightOfPlayerPixels();
                playerState.velY = 0;
                playerState.jumping = false;
                collision = true;
                break;
            }
        }
        if (!collision) playerState.jumping = true;
    } else if (playerState.velY < 0) {
        // moving upwards
        for (let tileOnTopEdge of tilesHorizontalEdges.topEdge) {
            if (tileOnTopEdge.isWall) {
                // collision occurred
                playerState.y = tileOnTopEdge.y + tileMapConfig.TILE;
                playerState.velY = 0;
                break;
            }
        }
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
        playerState.y = tileMapConfig.HEIGHT + getHeightOfPlayerPixels();
        playerState.velY = 0;
    }
}

function getTilesOnTheVerticalEdges(playerState) {
    let TOP_EDGE_Y = playerState.y;
    let BOTTOM_EDGE_Y = playerState.y + getHeightOfPlayerPixels();
    let LEFT_EDGE_X = playerState.x;
    let RIGHT_EDGE_X = playerState.x + getWidthOfPlayerPixels();
    
    let LEFT_EDGE_TILE_INDEX = tileUtils.p2t(LEFT_EDGE_X);
    let RIGHT_EDGE_TILE_INDEX = tileUtils.p2t(RIGHT_EDGE_X);
    
    let vertical_tile_indexes = new Set();
    let tileDistVert = TOP_EDGE_Y;

    // Recolectar indices de los "tiles" que el jugador ocupa
    while (tileDistVert < BOTTOM_EDGE_Y) {
        vertical_tile_indexes.add(tileUtils.p2t(tileDistVert));
        
        // Caso especial, no recuerdo para que
        if (tileDistVert + tileMapConfig.TILE > BOTTOM_EDGE_Y) {
            vertical_tile_indexes.add(tileUtils.p2t(BOTTOM_EDGE_Y - 1));
            break;
        }

        tileDistVert += tileMapConfig.TILE;
    }

    let tilesVerticalEdges = {
        leftEdge: [],
        rightEdge: []
    }

    // En caso de que el jugador este exactamente en el boundary de un tile,
    // moverlo un poco a la izquierda
    if (RIGHT_EDGE_X % tileMapConfig.TILE === 0) {
        RIGHT_EDGE_X = RIGHT_EDGE_X - 1;
        RIGHT_EDGE_TILE_INDEX = tileUtils.p2t(RIGHT_EDGE_X);
    }
    
    // Agregar a tilesVerticalEdges todos los tiles que el jugador ocupa
    for (let vertIndex of vertical_tile_indexes) {
        tilesVerticalEdges.leftEdge.push({
            x: tileUtils.t2p(LEFT_EDGE_TILE_INDEX),
            y: tileUtils.t2p(vertIndex),
            width: tileMapConfig.TILE,
            height: tileMapConfig.TILE,
            isWall: (tileUtils.tcell(LEFT_EDGE_TILE_INDEX, vertIndex) === 10)
        })

        tilesVerticalEdges.rightEdge.push({
            x: tileUtils.t2p(RIGHT_EDGE_TILE_INDEX),
            y: tileUtils.t2p(vertIndex),
            width: tileMapConfig.TILE,
            height: tileMapConfig.TILE,
            isWall: (tileUtils.tcell(RIGHT_EDGE_TILE_INDEX, vertIndex) === 10)
        })
    }
    return tilesVerticalEdges;
}

function getTilesOnTheHorizontalEdges(playerState) {
    let TOP_EDGE_Y = playerState.y;
    let BOTTOM_EDGE_Y = playerState.y + getHeightOfPlayerPixels();
    let LEFT_EDGE_X = playerState.x;
    let RIGHT_EDGE_X = playerState.x + getWidthOfPlayerPixels();
    
    let TOP_EDGE_TILE_INDEX = tileUtils.p2t(TOP_EDGE_Y);
    let BOTTOM_EDGE_TILE_INDEX = tileUtils.p2t(BOTTOM_EDGE_Y);
    
    let horizontal_tile_indexes = new Set();
    let tileDistHorizontal = LEFT_EDGE_X;
    while (tileDistHorizontal < RIGHT_EDGE_X) {
        horizontal_tile_indexes.add(tileUtils.p2t(tileDistHorizontal));
        
        if (tileDistHorizontal + tileMapConfig.TILE > RIGHT_EDGE_X) {
            horizontal_tile_indexes.add(tileUtils.p2t(RIGHT_EDGE_X - 1));
            break;
        }

        tileDistHorizontal += tileMapConfig.TILE;
    }

    let tilesHorizontalEdges = {
        topEdge: [],
        bottomEdge: []
    }

    if (BOTTOM_EDGE_Y % tileMapConfig.TILE === 0) {
        BOTTOM_EDGE_Y = BOTTOM_EDGE_Y - 1;
        BOTTOM_EDGE_TILE_INDEX = tileUtils.p2t(BOTTOM_EDGE_Y);
    }

    for (let horIndex of horizontal_tile_indexes) {
        tilesHorizontalEdges.topEdge.push({
            x: tileUtils.t2p(horIndex),
            y: tileUtils.t2p(TOP_EDGE_TILE_INDEX),
            width: tileMapConfig.TILE,
            height: tileMapConfig.TILE,
            isWall: (tileUtils.tcell(horIndex, TOP_EDGE_TILE_INDEX) === 10)
        })

        tilesHorizontalEdges.bottomEdge.push({
            x: tileUtils.t2p(horIndex),
            y: tileUtils.t2p(BOTTOM_EDGE_TILE_INDEX),
            width: tileMapConfig.TILE,
            height: tileMapConfig.TILE,
            isWall: (tileUtils.tcell(horIndex, BOTTOM_EDGE_TILE_INDEX) === 10)
        })
    }
    return tilesHorizontalEdges;
}

function getTilesUnderPlayer(playerState) {
    let LEFT_EDGE_X = playerState.x;
    let RIGHT_EDGE_X = playerState.x + getWidthOfPlayerPixels();
    let BOTTOM_EDGE_Y = playerState.y + getHeightOfPlayerPixels();
    
    let rowUnderPlayerPixels = tileUtils.t2p(tileUtils.p2t(BOTTOM_EDGE_Y) + 1);

    let tileDistHor = LEFT_EDGE_X;
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
    getTilesUnderPlayer: getTilesUnderPlayer,
    getTilesOnTheHorizontalEdges: getTilesOnTheHorizontalEdges,
    getTilesOnTheVerticalEdges: getTilesOnTheVerticalEdges
}