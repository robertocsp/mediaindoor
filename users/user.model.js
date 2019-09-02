const Role = require('../_helpers/role');
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const schema = new Schema({
    username: { type: String, unique: true, required: true },
    hash: { type: String, required: true },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    isSU: { type: Boolean, required: 1, default: 0 },
    createdDate: { type: Date, default: Date.now },
    groups: [
        {
            group: { type: Schema.Types.ObjectId, ref: 'Group' },
            role: {
                type: String, enum: [Role.AdminGrupo, Role.AdminLocal,
                    Role.ComumGrupo, Role.ComumLocal]
            }
        }],
    places: [
        {
            place: { type: Schema.Types.ObjectId, ref: 'Place' },
            role: {
                type: String, enum: [Role.AdminLocal, Role.ComumLocal]
            }
        }],
});

schema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('User', schema);