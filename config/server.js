const port = 3030;

const https = require('https');
const bodyParser = require('body-parser');
const express = require('express');
const app = express();
const server = require('http').Server(app);
const io = require('socket.io')(server);
const redis = require('socket.io-redis');
const errorHandler = require('../_helpers/error-handler');

io.adapter(redis({ host: 'localhost', port: 6379 }));


//Este middleware diz para o server, se os dados foram passados por um formulario.
app.use(bodyParser.urlencoded({ extended: true }))

//Verificar se dentro da requisicao o corpo do conteudo é um JSON
app.use(bodyParser.json())

app.use(express.static(__dirname + '/public'));

// api routes
app.use('/users', require('../users/users.controller'));
app.use('/groups', require('../groups/groups.controller'));
app.use('/places', require('../places/places.controller'));
app.use('/ads', require('../advertisements/ads.controller'));

// global error handler
app.use(errorHandler);

server.listen(port, function(){
  console.log(`backend is running on port ${port}.`)
})

module.exports = app

io.on('connection', function (socket) {
	socket.on('joinChannel', function(channel){
		socket.join(channel);
	});
  
});