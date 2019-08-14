const Role = require('../_helpers/role');
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const schema = new Schema({
    groupname: { type: String, unique: true, required: true },
    users: [
        {
            user: { type: Schema.Types.ObjectId, ref: 'User' },
            role: {
                type: String, enum: [Role.AdminGrupo, Role.AdminLocal,
                Role.ComumGrupo, Role.ComumLocal]
            }
        }
    ],
    createdDate: { type: Date, default: Date.now }
});

schema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Group', schema);