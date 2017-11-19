const express = require('express')
const errorhandler = require('errorhandler')
const playerStateHandler = require('./game/playerStateHandler')
const serverConfig = require('./game/serverConfig')
const clientConfig = require('./game/clientConfig')

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
        velY: 0,
        accelerationX: 0,
        accelerationY: 0,
        lastSeqNumber: -1
    }
    
    socket.emit('ack-join', gameState)
    
    socket.on('client-update', (clientInputs) => {
        frameInputs.push({
            socketId: socket.id,
            inputs: clientInputs
        })
    })

    socket.on('disconnect', () => {
        console.log("disconnect taking place", socket.id)
        delete gameState.playerStates[socket.id]
    })
});

setInterval(() => {
    frameInputs.forEach((frameInput) => {
        // Inputs were queued and player disconnected. Can't process them.
        if (!gameState.playerStates[frameInput.socketId]) return
        
        // Update player position on server. Acknowledge last input.
        playerStateHandler.processInputs(frameInput.inputs, gameState.playerStates[frameInput.socketId], clientConfig.FREQUENCY)
        gameState.playerStates[frameInput.socketId].lastSeqNumber = frameInput.inputs.sequenceNumber
    })
    frameInputs = []
    io.emit('server-update', gameState)
}, serverConfig.TIMESTEP)

app.use(express.static('public', {}))

app.get('/', function(req, res) {
    res.render('index')
})

// Handle 404
app.use((req, res) => {
    res.status(404).send('404: Page not Found')
})

if (process.env.NODE_ENV === 'development') {
    console.log("In development")
    app.use(errorhandler())
}

server.listen(4000, '0.0.0.0')
