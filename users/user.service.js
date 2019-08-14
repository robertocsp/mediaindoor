const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const FlakeIdGen = require('flake-idgen'),
    intformat = require('biguint-format'),
    generator = new FlakeIdGen();
const Role = require('../_helpers/role');
const fs = require('fs');
const groupService = require('../groups/group.service');
const placeService = require('../places/place.service');
const db = require('../config/database');
const User = db.User;

module.exports = {
    authenticate,
    getUserToken,
    getAll,
    getOne,
    getById,
    create,
    update,
    delete: _delete
};

let secretTokenPriv = fs.readFileSync('keys/jwt-secret.ppk');

function authenticateUser(user) {
    const { hash, ...userWithoutHash } = user.toObject();
    let payload = { sub: user.id, isSU: user.isSU };
    const token = jwt.sign(payload, secretTokenPriv, { algorithm: 'RS256', expiresIn: '1y' });
    return {
        ...userWithoutHash,
        token
    };
}

async function authenticate({ username, password }) {
    const user = await User.findOne({ username }).select('-createdDate');
    if (user && bcrypt.compareSync(password, user.hash)) {
        return authenticateUser(user);
    }
}

async function getUserToken({ username, password }) {
    const user = await User.findOne({ username });
    if (user && bcrypt.compareSync(password, user.hash)) {
        return authenticateUser(user);
    }
}

async function getAll() {
    return await User.find().select('-hash');
}

async function getOne(clause) {
    return await User.findOne(clause).select('-hash -createdDate');
}

async function getById(id) {
    return await User.findById(id).select('-hash -createdDate');
}

async function create(userParam) {
    const user = new User(userParam);

    // hash autogen password to validate email
    const password = intformat(generator.next(), 'dec');
    user.hash = bcrypt.hashSync(password + process.env.PASS_SECRET, 10);

    // save user
    return await user.save().then(savedUser => {
        return {
            confirmation: password,
            user: savedUser
        };
    });
}

async function update(id, userParam) {
    const user = await User.findById(id);

    // validate
    if (!user) throw 'User not found';
    if (user.username !== userParam.username && await User.findOne({ username: userParam.username })) {
        throw 'Username "' + userParam.username + '" is already taken';
    }

    // hash password if it was entered
    if (userParam.password) {
        userParam.hash = bcrypt.hashSync(userParam.password, 10);
    }

    // copy userParam properties to user
    Object.assign(user, userParam);

    await user.save();
}

async function _delete(id) {
    await User.findByIdAndRemove(id);
}