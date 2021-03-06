import { randomColor } from './colour'
import { drawPlayer, drawMyServerPosition, drawGameState, drawTileGrid, drawTiles, drawPunch } from './draw'
import { serverReconciliation } from './reconciliation'
import { interpolateEntities } from './interpolation'
import { FPS, FREQUENCY, INTERVAL } from '../../game/clientConfig'
import io from 'socket.io-client'
import playerStateHandler from '../../game/playerStateHandler'
import tileMapConfig from '../../game/tileMapConfig'
import { Punch, getDataForDrawingPunch } from '../../game/punch'

export var socket

document.addEventListener("DOMContentLoaded", function(event) {
    var canvas = document.getElementById("gameCanvas")
    var ctx = canvas.getContext("2d")

    canvas.width = tileMapConfig.WIDTH
    canvas.height = tileMapConfig.HEIGHT
    resize()

    var keys = [];

    var localPlayerState = {
        x: 150,
        y: 150,
        velY: 0,
        velX: 0,
        jumping: true,
        accelerationX: 0,
        accelerationY: 0,
        colour: randomColor(120),
        punchState: new Punch(),
        punchInProgress: false,
        punchLanded: false,
        health: 5
    }

    var now;
    var then = Date.now();
    var delta;

    var gameState = {
        playerStates: {} // contiene mapping de socketId a objeto
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
                let player = localGameState.playerStates[playerSocketId]
                // if entitiy already exists, update it with the new information.
                
                // TODO: Once we start interpolating, we won't be able to hardcode updates this way. Remove.
                player.x = entityFromServer.x
                player.y = entityFromServer.y
                
                // TODO: Velocity is fixed for now. Consider removing.
                player.velX = entityFromServer.velX
                player.velY = entityFromServer.velY
                
                player.punchInProgress = entityFromServer.punchInProgress
                player.punchSize = entityFromServer.punchSize

                player.health = entityFromServer.health

                // TODO: Sequence number is only useful for reconciliation of local player. Remove this.
                player.lastSeqNumber = entityFromServer.lastSeqNumber
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

        for (let playerSocketId in localGameState.playerStates) {
            if (!updatedGameState.playerStates[playerSocketId]) {
                delete localGameState.playerStates[playerSocketId]
            }
        }

    }
    
    function gameLoop() {
        requestAnimationFrame(gameLoop);

        now = Date.now();
        delta = now - then;

        if (delta <= INTERVAL) return;

        let loopInputs = {
            up: keys[87] || keys[32],
            down: keys[83],
            right: keys[68],
            left: keys[65],
            punch: keys[78],
            sequenceNumber: inputSeqNumber
        }

        // Big kludge. This is how server tells us how much health we have remaining
        if (gameState.playerStates[socket.id]) {
            localPlayerState.health = gameState.playerStates[socket.id].health
        }

        if (localPlayerState.health > 0) {
            serverReconciliation(clientInputs, gameState, localPlayerState)
            // Why in the world am I passing fixed FREQUENCY instead of dt?
            playerStateHandler.processAttackInputs(loopInputs, localPlayerState, FREQUENCY, gameState, socket.id)
            playerStateHandler.processInputs(loopInputs, localPlayerState, FREQUENCY, gameState, socket.id)
        }

        interpolateEntities(gameState);
        
        ctx.clearRect(0, 0, tileMapConfig.WIDTH, tileMapConfig.HEIGHT);
        drawTileGrid(ctx);
        drawTiles(ctx);
        drawGameState(gameState, ctx);
        
        // Don't draw player, or emit inputs to the server
        if (localPlayerState.health <= 0) return;

        drawPlayer(localPlayerState, ctx);
        // drawMyServerPosition(gameState, ctx);

        if (localPlayerState.punchInProgress && !localPlayerState.punchLanded) {
            let punchDrawData = getDataForDrawingPunch(localPlayerState);
            drawPunch(punchDrawData, ctx);
        }
        
        clientInputs.push(loopInputs);
        inputSeqNumber++;

        socket.emit('client-update', loopInputs);
        then = now - (delta % INTERVAL);
    }

    function resize() {
        var canvasRatio = canvas.height / canvas.width;
        var windowRatio = window.innerHeight / window.innerWidth;
        var width;
        var height;
    
        if (windowRatio < canvasRatio) {
            height = window.innerHeight;
            width = height / canvasRatio;
        } else {
            width = window.innerWidth;
            height = width * canvasRatio;
        }
    
        canvas.style.width = width + 'px';
        canvas.style.height = height + 'px';
    };

    window.addEventListener('resize', resize, false);

    window.onblur = function() {
        keys[87] = false
        keys[32] = false
        keys[83] = false
        keys[68] = false
        keys[65] = false
        keys[78] = false
    }

    document.body.addEventListener("keydown", function (e) {
        let keyCode = e.keyCode;
        if (keyCode === 87 || keyCode === 68 || keyCode === 83 || keyCode === 65 || keyCode === 32 || keyCode === 78) {
            e.preventDefault();
            keys[keyCode] = true;    
        }
    });
    document.body.addEventListener("keyup", function (e) {
        let keyCode = e.keyCode;
        if (keyCode === 87 || keyCode === 68 || keyCode === 83 || keyCode === 65 || keyCode === 32 || keyCode === 78) {
            e.preventDefault();
            keys[keyCode] = false;    
        }
    });
});

