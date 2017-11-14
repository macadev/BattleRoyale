import { randomColor } from './colour'
import io from 'socket.io-client'
import playerStateHandler from '../../game/playerStateHandler'
import { drawPlayer, drawMyServerPosition, drawGameState } from './draw'
import { serverReconciliation } from './reconciliation'
import { interpolateEntities } from './interpolation'

export var socket

document.addEventListener("DOMContentLoaded", function(event) {
    var canvas = document.getElementById("gameCanvas"),
    ctx = canvas.getContext("2d");

    canvas.width = canvas.height = 300;

    var keys = [];

    var localPlayerState = {
        x: 150,
        y: 150,
        velY: 0,
        velX: 0,
        colour: randomColor(120)
    }

    var fps = 60;
    var now;
    var then = Date.now();
    var interval = 1000 / fps;
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
            if (playerSocketId === socket.id) continue;

            if (!localGameState.playerStates[playerSocketId].posBuffer) {
                localGameState.playerStates[playerSocketId].posBuffer = []    
            }
            localGameState.playerStates[playerSocketId].posBuffer.push(
                {
                    x: entityFromServer.x,
                    y: entityFromServer.y,
                    timestamp: new Date()
                }
            )
        }
    }
    
    function gameLoop() {
        requestAnimationFrame(gameLoop);

        now = Date.now();
        delta = now - then;

        if (delta <= interval) return;

        let loopInputs = {
            up: keys[38],
            down: keys[40],
            right: keys[39],
            left: keys[37],
            sequenceNumber: inputSeqNumber
        }

        serverReconciliation(clientInputs, gameState, localPlayerState)
        // interpolateEntities()
        
        ctx.clearRect(0, 0, 300, 300);
        playerStateHandler.processInputs(loopInputs, localPlayerState)
        drawPlayer(localPlayerState, ctx);
        drawMyServerPosition(gameState, ctx);
        drawGameState(gameState, ctx);
        
        clientInputs.push(loopInputs);
        inputSeqNumber++;

        socket.emit('client-update', loopInputs);
        then = now - (delta % interval);
    }

    document.body.addEventListener("keydown", function (e) {
        keys[e.keyCode] = true;
    });
    document.body.addEventListener("keyup", function (e) {
        keys[e.keyCode] = false;
    });
});