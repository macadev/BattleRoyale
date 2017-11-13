import { randomColor } from './colour'
import io from 'socket.io-client'
import playerStateHandler from '../../game/playerStateHandler'
import { drawPlayer, drawMyServerPosition, drawGameState } from './draw'

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

    var gameState = {};
    var clientInputs = [];
    var inputSeqNumber = 0;

    socket = io.connect();
    socket.on('ack-join', function (data) {
        gameState = data
        // Server connected. Begin rendering game.
        gameLoop();
    });

    socket.on('server-update', function(data) {
        gameState = data;
    });

    function serverReconciliation() {
        var inputToProcessIndex = 0;
        // Number of inputs in queue hovers around 4. This is not as expensive
        // as it seems.
        for (let input of clientInputs) {
            if (input.sequenceNumber <= gameState.playerStates[socket.id].lastSeqNumber) {
                inputToProcessIndex++;
                continue;
            } else {
                // Found new input that hasn't been acknowledged
                break;
            }
        }
        // Remove inputs that have been acknowledged by the server
        clientInputs.splice(0, inputToProcessIndex);

        // Apply un-acked inputs on position indicated by server
        var serverPlayerState = Object.assign({}, gameState.playerStates[socket.id])
        for (let input of clientInputs) {
            playerStateHandler.processInputs(input, serverPlayerState)
        }

        if (
            serverPlayerState.x !== localPlayerState.x || 
            serverPlayerState.y !== localPlayerState.y
        ) {
            // Client and server do not coincide on the client position.
            // Enforce position dictated by the server.
            localPlayerState.x = serverPlayerState.x;
            localPlayerState.y = serverPlayerState.y;
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
            color: localPlayerState.colour,
            sequenceNumber: inputSeqNumber
        }

        serverReconciliation();
        
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