const db = require('../config/database');
const Place = db.Place;
const Role = require('../_helpers/role');
const groupService = require('../groups/group.service');

module.exports = {
    getAll,
    getBy,
    getById,
    getByIdAndUser,
    getByIdUserAndRoles,
    getByUser,
    getByUserAndRoles,
    getByGroup,
    getByNotInGroup,
    create,
    update,
    delete: _delete
};

async function getAll(user) {
    if(user.isSU) {
        return await Place.find().populate('group').populate('users', '-hash');
    }
    const userGroups = await groupService.getByUserAndRoles(user.sub, [Role.AdminGrupo, Role.ComumGrupo]);
    const clause = {
        $or: [
            { group: { $in: userGroups } },
            { 'users.user': user.sub } 
        ] 
    };
    return await getBy(clause);
}

async function getById(id) {
    return await Place.findById(id);
}

async function getByIdAndUser(id, userId) {
    return await getByIdUserAndRoles(id, userId);
}

async function getByIdUserAndRoles(id, userId, roles) {
    let clause = { _id: id, 'users': { $elemMatch: { 'user': userId } } };
    if(roles && roles.length) {
        clause['users']['$elemMatch']['role'] = { $in: roles };
    }
    place = await getBy(clause);
    if(place.length) {
        return place[0];
    }
    return;
}

async function getByUser(userId) {
    return await getBy({ 'users.user': userId });
}

async function getByUserAndRoles(userId, roles) {
    
    return await getBy({ 'users': { $elemMatch: { 'user': userId, 'role': { $in: roles } } } });
}

async function getByGroup(groupId) {
    return await getBy({ 'group': groupId });
}

async function getByNotInGroup(groupId, user) {
    const groups = groupId.split(';');
    if(user.isSU) {
        return await getBy({ 'group': { $nin: groups } });
    }
    const userGroups = await groupService.getByUserAndRolesAndNotInId(groups, user.sub, [Role.AdminGrupo, Role.ComumGrupo]);
    const clause = {
        $or: [
            { group: { $in: userGroups } },
            { 'users.user': user.sub } 
        ] 
    };
    return await placeService.getBy(clause);
}

async function getBy(clause, select) {
    return await Place.find(clause).select(select ? select : '-users');
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