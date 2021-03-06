const Role = require('../_helpers/role');
const ObjectId = require('mongodb').ObjectID;
const db = require('../config/database');
const Group = db.Group;

module.exports = {
    getAll,
    getAllPaginated,
    getById,
    getByIdAndUser,
    getByIdUserAndRoles,
    getByUser,
    getByUserAndRoles,
    getByUserAndRolesAndNotInId,
    getByUserAndNotInId,
    getByIdsAndNotEqUser,
    getBy,
    deleteUserFromGroups,
    addUserToGroup,
    create,
    update,
    delete: _delete,
    checkUserGroup
};

async function getAll(user) {
    if (user.isSU) {
        return await Group.find().populate('users.user', '-hash');
    }
    return await getByUserAndRoles(user.sub, [Role.AdminGrupo, Role.ComumGrupo]);
}

async function getAllPaginated(page, itemsPerPage, user) {
    if (user.isSU) {
        let groups = await Group.find()
            .skip((page - 1) * itemsPerPage)
            .limit(itemsPerPage * 1)
            .populate('users.user', '-hash').select();
        let groupsCount = await Group.countDocuments();
        return { groupsCount: groupsCount, groups: groups };
    }

    let groups = await Group.find({
        'users': {
            $elemMatch: {
                'user': user.sub, 'role': {
                    $in: [Role.AdminGrupo, Role.ComumGrupo]
                }
            }
        }
    })
        .skip((page - 1) * itemsPerPage)
        .limit(itemsPerPage * 1)
        .populate('users.user', '-hash').select();
    let groupsCount = await Group.countDocuments({
        'users': {
            $elemMatch: {
                'user': user.sub, 'role': {
                    $in: [Role.AdminGrupo, Role.ComumGrupo]
                }
            }
        }
    });
    return { groupsCount: groupsCount, groups: groups };
}

async function getById(id) {
    return await Group.findById(id).populate('users.user', '-hash');
}

async function getByIdAndUser(id, userId) {
    return await getByIdUserAndRoles(id, userId);
}

async function getByIdUserAndRoles(id, userId, roles) {
    let clause = { _id: id, 'users': { $elemMatch: { 'user': userId } } };
    if (roles && roles.length) {
        clause['users']['$elemMatch']['role'] = { $in: roles };
    }
    group = await getBy(clause);
    if (group.length) {
        return group[0];
    }
    return;
}

async function getByUser(userId) {
    return await getBy({ 'users.user': userId });
}

async function getByUserAndRoles(userId, roles) {
    return await getBy({ 'users': { $elemMatch: { 'user': userId, 'role': { $in: roles } } } });
}

async function getByUserAndRolesAndNotInId(groups, userId, roles, selection = '-users') {
    return await getBy({ _id: { $nin: groups }, 'users': { $elemMatch: { 'user': userId, 'role': { $in: roles } } } }, selection);
}

async function getByUserAndNotInId(groups, userId) {
    return await Group.find({ _id: { $nin: groups }, 'users.user': userId });
}

async function getByIdsAndNotEqUser(groups, userId) {
    return await Group.find({ _id: { $in: groups }, 'users.user': { $ne: userId } });
}

async function getBy(clause, selection = '-users') {
    return await Group.find(clause).select(selection);
}

async function deleteUserFromGroups(user) {
    return await Group.update({},
        { $pull: { users: { user: user } } },
        { multi: true });
}

async function addUserToGroup(groupId, userData) {
    await Group.update({ _id: groupId }, { $push: { users: userData } });
    return await Group.findOne({ _id: groupId });
}

async function create(groupParam) {
    // validate
    if (await Group.findOne({ groupname: groupParam.groupname })) {
        throw 'Groupname "' + groupParam.groupname + '" is already taken';
    }

    const group = new Group(groupParam);

    // save group
    await group.save();
}

async function update(id, user, groupParam) {
    const group = user.isSU ? await getById(id) : await getByIdUserAndRoles(id, user.sub, [Role.AdminGrupo]);

    // validate
    if (!group) throw 'Group not found';
    if (groupParam.groupname && group.groupname !== groupParam.groupname && await Group.findOne({ groupname: groupParam.groupname })) {
        throw 'Groupname "' + groupParam.groupname + '" is already taken';
    }

    // copy groupParam properties to group
    Object.assign(group, groupParam);

    await group.save();
}

async function _delete(id) {
    await Group.findByIdAndRemove(id);
}

async function checkUserGroup(group, user) {
    if (user.isSU) {
        return true;
    }
    return await getByIdUserAndRoles(group, user.sub, [Role.AdminGrupo]) ? true : false;
}