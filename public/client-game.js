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

    var x = 150,
        y = 150,
        velY = 0,
        velX = 0,
        speed = 2,
        friction = 0.98,
        playerColor = randomColor(120),
        keys = [];

    var fps = 60;
    var now;
    var then = Date.now();
    var interval = 1000 / fps;
    var delta;

    var gameState = {};
    var clientInputs = [];
    var inputSeqNumber = 0;

    var socket = io.connect();
    socket.on('join-info', function (data) {
        // Server connected. Begin rendering game.
        gameLoop();
    });
    socket.on('server-update', function(data) {
        gameState = data;
    });

    function drawPlayer() {
        if (keys[38]) {
            if (velY > -speed) {
                velY--;
            }
        }
        
        if (keys[40]) {
            if (velY < speed) {
                velY++;
            }
        }
        if (keys[39]) {
            if (velX < speed) {
                velX++;
            }
        }
        if (keys[37]) {
            if (velX > -speed) {
                velX--;
            }
        }

        velY *= friction;
        y += velY;
        velX *= friction;
        x += velX;

        if (x >= 295) {
            x = 295;
        } else if (x <= 5) {
            x = 5;
        }

        if (y > 295) {
            y = 295;
        } else if (y <= 5) {
            y = 5;
        }

        ctx.beginPath();
        ctx.arc(x, y, 5, 0, Math.PI * 2);
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
        for (let input of clientInputs) {
            if (input.sequenceNumber <= gameState.playerStates[socket.id].lastSeqNumber) {
                inputToProcessIndex++;
                continue;
            } else {
                // Found new input that hasn't been acknowledged
                break;
            }
        }
    }
    
    function gameLoop() {
        requestAnimationFrame(gameLoop);

        now = Date.now();
        delta = now - then;

        if (delta <= interval) return;

        serverReconciliation();
        
        ctx.clearRect(0, 0, 300, 300);
        drawPlayer();
        drawMyServerPosition();
        drawGameState();

        let loopInputs = {
            up: keys[38],
            down: keys[40],
            right: keys[39],
            left: keys[37],
            color: playerColor,
            sequenceNumber: inputSeqNumber
        }
        
        clientInputs.push(loopInputs);
        inputSeqNumber++;

        console.log(gameState)
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