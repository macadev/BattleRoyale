const express = require('express')
const errorhandler = require('errorhandler')

var app = express()
var server = require('http').Server(app)
var io = require('socket.io')(server)

process.env.NODE_ENV = 'development'

var rooms = []

io.on('connection', function (socket) {
    var roomName = 'game-1'
    socket.join(roomName)
    socket.emit('join-info', { room: roomName  });
    socket.on('my other event', function (data) {
        console.log(data);
    });
});

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
