const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const schema = new Schema({
    placename: { type: String, unique: true, required: true },
    segment: { type: String, required: true },
    group: {type: Schema.Types.ObjectId, ref: 'Group'},
    docnumber: { type: String, required: true },
    contact: { type: String, required: true },
    users: [{type: Schema.Types.ObjectId, ref: 'User'}],
    ispublic: { type: Boolean, default: false },
    targetaudience: [String],
    createdDate: { type: Date, default: Date.now }
});

schema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Place', schema);