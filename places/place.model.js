const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const schema = new Schema({
    placekey: { type: String, unique: true, required: true },
    placename: { type: String, required: true },
    segment: { type: String, required: true },
    group: { type: Schema.Types.ObjectId, ref: 'Group', required: true },
    docnumber: { type: String, required: true },
    contact: { type: String, required: true },
    users: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    ispublic: { type: Boolean, default: false },
    adsquantity: { type: Number, default: 5 },
    tags: [String],
    createdDate: { type: Date, default: Date.now }
});

schema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Place', schema);