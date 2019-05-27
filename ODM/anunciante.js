const restful = require('node-restful')
const mongoose = restful.mongoose
const anuncio = require('./anuncio')

const anuncianteSchema = new mongoose.Schema({
    nome: {type: String, required: true},
    endereco: {type: String, required: true},
    anuncios:[anuncio]

})

module.exports = restful.model('Anunciante', anuncianteSchema)

/*
nome:empresa B
endereco:endereco da empresa B
*/