function randomColor(brightness){
    function randomChannel(brightness){
        var r = 255-brightness;
        var n = 0|((Math.random() * r) + brightness);
        var s = n.toString(16);
        return (s.length==1) ? '0'+s : s;
    }
    return '#' + randomChannel(brightness) + randomChannel(brightness) + randomChannel(brightness);
}

document.addEventListener("DOMContentLoaded", function(event) {
    var canvas = document.getElementById("gameCanvas"),
    ctx = canvas.getContext("2d");

    canvas.width = canvas.height = 300;

    var speed = 2,
        friction = 0.98,
        playerColor = randomColor(120),
        keys = [];

    var localPlayerState = {
        x: 150,
        y: 150,
        velY: 0,
        velX: 0
    }

    var fps = 60;
    var now;
    var then = Date.now();
    var interval = 1000 / fps;
    var delta;

    var gameState = {};
    var clientInputs = [];
    var inputSeqNumber = 0;

    var socket = io.connect();
    socket.on('ack-join', function (data) {
        gameState = data
        // Server connected. Begin rendering game.
        gameLoop();
    });
    socket.on('server-update', function(data) {
        gameState = data;
    });

    function calculateNewPosition(playerState, inputs) {
        if (inputs.up) {
            if (playerState.velY > -speed) {
                playerState.velY--;
            }
        }
        
        if (inputs.down) {
            if (playerState.velY < speed) {
                playerState.velY++;
            }
        }
        if (inputs.right) {
            if (playerState.velX < speed) {
                playerState.velX++;
            }
        }
        if (inputs.left) {
            if (playerState.velX > -speed) {
                playerState.velX--;
            }
        }

        playerState.velY *= friction;
        playerState.y += playerState.velY;
        playerState.velX *= friction;
        playerState.x += playerState.velX;

        // TODO: Consider removing this. Server reconciliation 
        // eliminates the need for boundary checking.
        if (playerState.x >= 295) {
            playerState.x = 295;
        } else if (playerState.x <= 5) {
            playerState.x = 5;
        }

        if (playerState.y > 295) {
            playerState.y = 295;
        } else if (playerState.y <= 5) {
            playerState.y = 5;
        }
    }

    function drawPlayer(playerState) {
        ctx.beginPath();
        ctx.arc(playerState.x, playerState.y, 5, 0, Math.PI * 2);
        ctx.fillStyle = playerColor;
        ctx.fill();
    }

    function drawMyServerPosition() {
        if (!gameState || !gameState.playerStates) return
        let myServerPosition = gameState.playerStates[socket.id];
        
        ctx.beginPath();
        ctx.arc(myServerPosition.x, myServerPosition.y, 5, 0, Math.PI * 2);
        ctx.fillStyle = "red";
        ctx.fill();
    }

    function drawGameState() {
        for (let playerSocketId in gameState.playerStates) {
            if ([playerSocketId] == socket.id) continue;
            let playerData = gameState.playerStates[playerSocketId];
            ctx.beginPath();
            ctx.arc(playerData.x, playerData.y, 5, 0, Math.PI * 2);
            ctx.fillStyle = playerData.color;
            ctx.fill();
        }
    }

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
            calculateNewPosition(serverPlayerState, input);
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
            color: playerColor,
            sequenceNumber: inputSeqNumber
        }

        serverReconciliation();
        
        ctx.clearRect(0, 0, 300, 300);
        calculateNewPosition(localPlayerState, loopInputs);
        drawPlayer(localPlayerState);
        drawMyServerPosition();
        drawGameState();
        
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