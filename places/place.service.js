const config = require('../config/config.json');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const db = require('../config/database');
const Place = db.Place;

module.exports = {
    getAll,
    getById,
    getByUser,
    create,
    update,
    delete: _delete
};

async function getAll() {
    return await Place.find().populate('group', 'users', '-hash').select();
}

async function getById(id) {
    return await Place.findById(id).select();
}

async function getByUser(user) {
    return await Place.find( { users: user } );
}

async function create(placeParam) {
    // validate
    if (await Place.findOne({ placename: placeParam.placename })) {
        throw 'Placename "' + placeParam.placename + '" is already taken';
    }

    const place = new Place(placeParam);

    // save place
    await place.save();
}

async function update(id, placeParam) {
    const place = await Place.findById(id);

    // validate
    if (!place) throw 'Place not found';
    if (place.placename !== placeParam.placename && await Place.findOne({ placename: placeParam.placename })) {
        throw 'Placename "' + placeParam.placename + '" is already taken';
    }

    // copy placeParam properties to place
    Object.assign(place, placeParam);

    await place.save();
}

async function _delete(id) {
    await Place.findByIdAndRemove(id);
}