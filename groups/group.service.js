const Role = require('../_helpers/role');
const db = require('../config/database');
const Group = db.Group;

module.exports = {
    getAll,
    getById,
    getByUser,
    getBy,
    create,
    update,
    delete: _delete,
    checkUserGroup
};

async function getAll() {
    return await Group.find().populate('users', '-hash');
}

async function getById(id, userId, userRole) {
    if (!userId || userRole === Role.SuperAdmin) {
        return await Group.findById(id);
    }
    group = await Group.find({ _id: id, users: userId }).select('-users');
    if(group.length) {
        return group[0];
    }
    return;
}

async function getByUser(user) {
    return await Group.find({ users: user }).select('-users');
}

async function getBy(clause) {
    return await Group.find(clause).select('-users');
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
    const group = await getById(id, user.sub, user.role);

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
    if(user.role === Role.SuperAdmin) {
        return true;
    }
    return await Group.find({ _id: group, users: user.sub }) != 0;
}