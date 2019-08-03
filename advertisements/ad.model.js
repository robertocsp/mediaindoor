const mongoose = require('mongoose');
const Schema = mongoose.Schema;

/*
types:
1 - IMG
2 - VIDEO
3 - HTML
*/
const schema = new Schema({
    adname: { type: String, unique: true, required: true },
    groups: [{ type: Schema.Types.ObjectId, ref: 'Group' }],
    places: [{ type: Schema.Types.ObjectId, ref: 'Place' }],
    type: { type: Number, min: 1, max: 3, required: true },
    mimetype: { type: String },
    duration: { type: Number, max: 60 },
    weight: { type: Number },
    tags: [String],
    mediapath: { type: String },
    createdDate: { type: Date, default: Date.now }
});

schema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Ad', schema);