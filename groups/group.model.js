const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const schema = new Schema({
    groupname: { type: String, unique: true, required: true },
	users: [{type: Schema.Types.ObjectId, ref: 'User'}],
    createdDate: { type: Date, default: Date.now }
});

schema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Group', schema);