const express = require('express');
const path = require('path');
const myServer = require('./server');
const io = require('socket.io-emitter')({ host: '127.0.0.1', port: 6379 });

module.exports = function(server){

  //API Routes
  const router = express.Router()
  server.use('/api', router)

  const anuncianteService = require('../services/anuncianteService')
  anuncianteService.register(router, '/anunciante')

  server.get('/:channel/:sid', function(req, res){
	io.emit('message', 'global-message');
	io.to(req.params.sid).emit('message', 'private-message');
	io.to(req.params.channel).emit('message', req.params.channel + '-message');

    res.status(200).json({ channel: req.params.channel })
  })

  /*
  router.all('*', function (req, res, next) {
      res.header('Access-Control-Allow-Origin', '*');
      res.header('Access-Control-Allow-Methods', 'PUT, GET, POST, DELETE, OPTIONS');
      res.header('Access-Control-Allow-Headers', 'Content-Type');
      next();
  })
  */
}
