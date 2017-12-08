import { randomColor } from './colour'
import { drawPlayer, drawMyServerPosition, drawGameState, drawTileGrid, drawTiles } from './draw'
import { serverReconciliation } from './reconciliation'
import { interpolateEntities } from './interpolation'
import { FPS, FREQUENCY, INTERVAL } from '../../game/clientConfig'
import io from 'socket.io-client'
import playerStateHandler from '../../game/playerStateHandler'
import tileMapConfig from '../../game/tileMapConfig'

export var socket

document.addEventListener("DOMContentLoaded", function(event) {
    var canvas = document.getElementById("gameCanvas")
    var ctx = canvas.getContext("2d")

    canvas.width = tileMapConfig.WIDTH
    canvas.height = tileMapConfig.HEIGHT

    var keys = [];

    var localPlayerState = {
        x: 150,
        y: 150,
        velY: 0,
        velX: 0,
        jumping: true,
        accelerationX: 0,
        accelerationY: 0,
        colour: randomColor(120)
    }

    var now;
    var then = Date.now();
    var delta;

    var gameState = {
        playerStates: {}
    };
    var clientInputs = [];
    var inputSeqNumber = 0;

    socket = io.connect();
    socket.on('ack-join', function (updatedGameState) {
        // Very odd what I'm doing here. Need to find a cleaner option.
        gameState = updatedGameState
        processGameStateUpdateFromServer(updatedGameState, gameState);
        
        // Server connected. Begin rendering game.
        gameLoop();
    });

    socket.on('server-update', function(updatedGameState) {
        processGameStateUpdateFromServer(updatedGameState, gameState);
    });

    // This function is used in order to keep the position buffer up to date. This buffer
    // is used to interpolate entities so that they look smooth despite of lag.
    function processGameStateUpdateFromServer(updatedGameState, localGameState) {
        for (let playerSocketId in updatedGameState.playerStates) 
        {
            var entityFromServer = updatedGameState.playerStates[playerSocketId]
            
            if (localGameState.playerStates[playerSocketId]) {
                // if entitiy already exists, update it with the new information.
                
                // TODO: Once we start interpolating, we won't be able to hardcode updates this way. Remove.
                localGameState.playerStates[playerSocketId].x = entityFromServer.x
                localGameState.playerStates[playerSocketId].y = entityFromServer.y
                
                // TODO: Velocity is fixed for now. Consider removing.
                localGameState.playerStates[playerSocketId].velX = entityFromServer.velX
                localGameState.playerStates[playerSocketId].velY = entityFromServer.velY

                // TODO: Sequence number is only useful for reconciliation of local player. Remove this.
                localGameState.playerStates[playerSocketId].lastSeqNumber = entityFromServer.lastSeqNumber
            }
            
            /*****************************************************************/
            /* Eventually this function will just contain what you see below */
            /*****************************************************************/

            if (!localGameState.playerStates[playerSocketId]) {
                // if entity is new, add it to the local state
                localGameState.playerStates[playerSocketId] = entityFromServer;
            }

            // Don't need to store position buffer for the client's player
            if (playerSocketId === socket.id) {
                continue;
            }

            if (!localGameState.playerStates[playerSocketId].posBuffer) {
                localGameState.playerStates[playerSocketId].posBuffer = []    
            }
            localGameState.playerStates[playerSocketId].posBuffer.push(
                {
                    x: entityFromServer.x,
                    y: entityFromServer.y,
                    timestamp: new Date().getTime()
                }
            )
        }
    }
    
    function gameLoop() {
        requestAnimationFrame(gameLoop);

        now = Date.now();
        delta = now - then;

        if (delta <= INTERVAL) return;

        let loopInputs = {
            up: keys[38],
            down: keys[40],
            right: keys[39],
            left: keys[37],
            sequenceNumber: inputSeqNumber
        }

        serverReconciliation(clientInputs, gameState, localPlayerState)
        playerStateHandler.processInputs(loopInputs, localPlayerState, FREQUENCY)
        interpolateEntities(gameState);
        
        ctx.clearRect(0, 0, tileMapConfig.WIDTH, tileMapConfig.HEIGHT);
        drawTileGrid(ctx);
        drawTiles(ctx);
        drawGameState(gameState, ctx);
        drawPlayer(localPlayerState, ctx);
        // drawMyServerPosition(gameState, ctx);
        
        clientInputs.push(loopInputs);
        inputSeqNumber++;

        socket.emit('client-update', loopInputs);
        then = now - (delta % INTERVAL);
    }

    document.body.addEventListener("keydown", function (e) {
        let keyCode = e.keyCode;
        if (keyCode === 38 || keyCode === 40 || keyCode === 39 || keyCode === 37) {
            e.preventDefault();
            keys[keyCode] = true;    
        }
    });
    document.body.addEventListener("keyup", function (e) {
        let keyCode = e.keyCode;
        if (keyCode === 38 || keyCode === 40 || keyCode === 39 || keyCode === 37) {
            e.preventDefault();
            keys[keyCode] = false;    
        }
    });
});