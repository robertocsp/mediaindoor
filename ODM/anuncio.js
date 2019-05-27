const restful = require('node-restful')
const mongoose = restful.mongoose

const anuncioSchema = new mongoose.Schema({
    nome: {type: String, required: true},
    tipo: {type: String, required:true, uppercase: true,
        enum: ['VIDEO', 'IMAGEM']},
    tempo_exibicao: {type: Number, min: 0, required: true},

})

module.exports = restful.model('Anuncio', anuncioSchema)

