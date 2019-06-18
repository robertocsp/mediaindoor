const config = require('../config/config.json');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const db = require('../config/database');
const Group = db.Group;

module.exports = {
    getAll,
    getById,
    getByUser,
    create,
    update,
    delete: _delete
};

async function getAll() {
    return await Group.find().populate('users', '-hash').select();
}

async function getById(id) {
    return await Group.findById(id).select();
}

async function getByUser(user) {
    return await Group.find( { users: user } );
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

async function update(id, groupParam) {
    const group = await Group.findById(id);

    // validate
    if (!group) throw 'Group not found';
    if (group.groupname !== groupParam.groupname && await Group.findOne({ groupname: groupParam.groupname })) {
        throw 'Groupname "' + groupParam.groupname + '" is already taken';
    }

    // copy groupParam properties to group
    Object.assign(group, groupParam);

    await group.save();
}

async function _delete(id) {
    await Group.findByIdAndRemove(id);
}