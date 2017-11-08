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

    var gameState = {}

    var socket = io.connect('http://localhost:4000');
    socket.on('join-info', function (data) {
        console.log(data);
        // Server connected. Begin rendering game.
        gameLoop();
        // socket.emit('my other event', { my: 'data' });
    });
    socket.on('server-update', function(data) {
        gameState = data;
    })

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
        if (!gameState[socket.id]) {
            console.log("Server doesn't have my ID");
            return;
        }

        let myServerPosition = gameState[socket.id];
        
        ctx.beginPath();
        ctx.arc(myServerPosition.posX, myServerPosition.posY, 5, 0, Math.PI * 2);
        ctx.fillStyle = "red";
        ctx.fill();
    }

    function drawGameState() {
        console.log(gameState);
        for (let playerId in gameState) {
            if ([playerId] == socket.id) continue;
            let playerData = gameState[playerId];
            ctx.beginPath();
            ctx.arc(playerData.posX, playerData.posY, 5, 0, Math.PI * 2);
            ctx.fillStyle = playerData.color;
            ctx.fill();
        }
    }

    function gameLoop() {
        requestAnimationFrame(gameLoop);
        ctx.clearRect(0, 0, 300, 300);
        drawPlayer();
        drawMyServerPosition();
        drawGameState();
        socket.emit('client-update', { 
            posX: x, 
            posY: y,
            color: playerColor 
        });
    }

    document.body.addEventListener("keydown", function (e) {
        keys[e.keyCode] = true;
    });
    document.body.addEventListener("keyup", function (e) {
        keys[e.keyCode] = false;
    });
});