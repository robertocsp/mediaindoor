const mongoose = require('mongoose');

const url = 'mongodb://localhost/db_anunciostv'

module.exports = mongoose.connect(url, { useNewUrlParser: true })
