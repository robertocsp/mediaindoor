const mongoose = require('mongoose');
const Schema = mongoose.Schema;

/*
types:
1 - HTML
2- IMG
3 - VIDEO
*/
const schema = new Schema({
    adname: { type: String, unique: true, required: true },
    places: [{type: Schema.Types.ObjectId, ref: 'Place'}],
    type: { type: Number, min: 1, max: 3, required: true },
    duration: { type: Number, max: 60, required: true },
    targetaudience: [String],
    createdDate: { type: Date, default: Date.now }
});

schema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Ad', schema);