const express = require('express')
const errorhandler = require('errorhandler')
const gameStateManager = require('./game')

var app = express()
var server = require('http').Server(app)
var io = require('socket.io')(server)

process.env.NODE_ENV = 'development'

var rooms = []

var gameState = {
    playerStates: {}
}

var frameInputs = []

io.on('connection', (socket) => {
    var roomName = 'game-1'
    socket.join(roomName)

    gameState.playerStates[socket.id] = {
        x: 150,
        y: 150,
        velX: 0,
        velY: 0
    }
    
    socket.emit('join-info', { room: roomName  })
    
    socket.on('client-update', (clientInputs) => {
        frameInputs.push({
            socketId: socket.id,
            inputs: clientInputs
        })
        // gameStateManager.updatePlayerState(clientInputs, gameState.playerStates[socket.id]);
        // gameState[socket.id] = data;
    })

    socket.on('disconnect', () => {
        console.log("disconnect taking place", socket.id)
        delete gameState.playerStates[socket.id]
    })
});

setInterval(() => {
    // console.log("Input queue length", frameInputs.length);
    frameInputs.forEach((frameInput) => {
        // Inputs were queued and player disconnected. Can't process them.
        if (!gameState.playerStates[frameInput.socketId]) return;
        gameStateManager.updatePlayerState(frameInput.inputs, gameState.playerStates[frameInput.socketId]);
    })
    frameInputs = []
}, 17)

setInterval(() => {
    io.emit('server-update', gameState);
}, 45)

app.use(express.static('public', {}))

app.get('/', function(req, res) {
    res.render('index')
})

// Handle 404
app.use((req, res) => {
    res.status(404).send('404: Page not Found')
})

if (process.env.NODE_ENV === 'development') {
    console.log("In development");``
    app.use(errorhandler())
}

server.listen(4000, '0.0.0.0')
