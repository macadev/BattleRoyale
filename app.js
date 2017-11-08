const express = require('express')
const errorhandler = require('errorhandler')

var app = express()
var server = require('http').Server(app)
var io = require('socket.io')(server)

process.env.NODE_ENV = 'development'

var rooms = []

var gameState = {}

io.on('connection', (socket) => {
    var roomName = 'game-1'
    socket.join(roomName)
    
    socket.emit('join-info', { room: roomName  })
    
    socket.on('client-update', (data) => {
        gameState[socket.id] = data;
    })

    socket.on('disconnect', () => {
        console.log("disconnect taking place", socket.id)
        delete gameState[socket.id]
    })
});

setInterval(() => {
    io.emit('server-update', gameState);
}, 30)

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

server.listen(4000)
