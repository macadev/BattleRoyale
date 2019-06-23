const express = require('express')
const errorhandler = require('errorhandler')
const playerStateHandler = require('./game/playerStateHandler')
const serverConfig = require('./game/serverConfig')
const clientConfig = require('./game/clientConfig')
const { Punch } = require('./game/punch')

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
        jumping: true,
        lastSeqNumber: -1,
        punchInProgress: false,
        punchSize: undefined,
        punchState: new Punch(),
        punchLanded: false,
        health: 5
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
    removeDeadPlayersFromGameSimulation()

    let processedPlayerSocketIds = new Set()
    frameInputs.forEach((frameInput) => {
        processedPlayerSocketIds.add(frameInput.socketId)

        let playerBeingProcessed = gameState.playerStates[frameInput.socketId]
        // Inputs were queued and player disconnected. Can't process them.
        if (!playerBeingProcessed) return
        
        // Update player position on server. Acknowledge last input.
        playerStateHandler.processAttackInputs(frameInput.inputs, playerBeingProcessed, clientConfig.FREQUENCY, gameState, frameInput.socketId)
        playerStateHandler.processInputs(frameInput.inputs, playerBeingProcessed, clientConfig.FREQUENCY, gameState, frameInput.socketId)
        playerBeingProcessed.lastSeqNumber = frameInput.inputs.sequenceNumber

        playerBeingProcessed.punchSize = playerBeingProcessed.punchState.getCurrentState().punchSize
    })

    // Continue simulation for players that didn't send inputs
    for (let playerSocketId in gameState.playerStates) {
        if (processedPlayerSocketIds.has(playerSocketId)) continue;
        let playerBeingProcessed = gameState.playerStates[playerSocketId]
        playerStateHandler.processInputs({}, playerBeingProcessed, clientConfig.FREQUENCY, gameState, playerSocketId)
        playerStateHandler.processAttackInputs({}, playerBeingProcessed, clientConfig.FREQUENCY, gameState, playerSocketId)
    }

    frameInputs = []
    io.emit('server-update', gameState)
}, serverConfig.TIMESTEP)

function removeDeadPlayersFromGameSimulation() {
    for (let playerSocketId in gameState.playerStates) {
        if (gameState.playerStates[playerSocketId].health <= 0) {
            delete gameState.playerStates[playerSocketId];
        }
    }
}

app.set('views', __dirname + '/public');
app.set('view engine', 'pug');
app.use(express.static(__dirname + '/public'))

app.get('/', function(req, res) {
    res.render('./index')
})

// Handle 404
app.use((req, res) => {
    res.status(404).send('404: Page not Found')
})

if (process.env.NODE_ENV === 'development') {
    console.log("In development")
    app.use(errorhandler())
}

server.listen(5000, '0.0.0.0')
