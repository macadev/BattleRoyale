const express = require('express')
const errorhandler = require('errorhandler')

process.env.NODE_ENV = 'development'

var app = express()
app.use(express.static('public', {}))

app.get('/', function(req, res) {
    console.log("we in here")
    res.render('index')
})

// Handle 404
app.use((req, res) => {
    res.send('404: Page not Found', 404)
})

if (process.env.NODE_ENV === 'development') {
    // only use in development
    console.log("In development");
    app.use(errorhandler())
}

app.listen(3000)