const express = require('express');
const path = require('path');

module.exports = function(server){

  //API Routes
  const router = express.Router()
  server.use('/api', router)

  const anuncianteService = require('../services/anuncianteService')
  anuncianteService.register(router, '/anunciante')


  server.get('/', function(req, res){
    res.send('Portal Anuncios TV')
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
