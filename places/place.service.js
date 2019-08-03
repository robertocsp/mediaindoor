const db = require('../config/database');
const Place = db.Place;
const Role = require('../_helpers/role');

module.exports = {
    getAll,
    getBy,
    getById,
    getByUser,
    create,
    update,
    delete: _delete
};

async function getAll() {
    return await Place.find().populate('group').populate('users', '-hash');
}

async function getById(id, userId, userRole) {
    if (!userId || userRole === Role.SuperAdmin) {
        return await Place.findById(id);
    }
    place = await Place.find({ _id: id, users: userId }).select('-users');
    if (place.length) {
        return place[0];
    }
    return;
}

async function getBy(clause, select) {
    return await Place.find(clause).select(select ? select : '-users');
}

async function getByUser(user) {
    return await Place.find({ users: user }).select('-users');
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