const port = 3030;

const https = require('https');
const bodyParser = require('body-parser');
const express = require('express');
const server = express();


//Este middleware diz para o server, se os dados foram passados por um formulario.
server.use(bodyParser.urlencoded({ extended: true }))

//Verificar se dentro da requisicao o corpo do conteudo é um JSON
server.use(bodyParser.json())

server.listen(port, function(){
  console.log(`backend is running on port ${port}.`)
})

module.exports = server
