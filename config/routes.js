const io = require('socket.io-emitter')({ host: 'redis', port: 6379 });

module.exports = function (server) {

  // api routes
  server.use('/api/v1/users', require('../users/users.controller'));
  server.use('/api/v1/groups', require('../groups/groups.controller'));
  server.use('/api/v1/places', require('../places/places.controller'));
  server.use('/api/v1/ads', require('../advertisements/ads.controller'));

  server.get('/:channel/:sid', function (req, res) {
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
