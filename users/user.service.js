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

function authenticateUser(user, params) {
    const { hash, ...userWithoutHash } = user.toObject();
    let payload = { sub: user.id, role: user.role };
    if(params.group) {
        payload.group = params.group;
    }
    if(params.place) {
        payload.place = params.place;
    }
    const token = jwt.sign(payload, secretTokenPriv, { algorithm: 'RS256', expiresIn: '1y' });
    return {
        ...userWithoutHash,
        token,
        group: params.group,
        place: params.place
    };
}

async function authenticate({ username, password, group, place }) {
    const user = await User.findOne({ username }).select('-createdDate');
    if (user && bcrypt.compareSync(password, user.hash)) {
        if (user.role === Role.SuperAdmin) {
            return authenticateUser(user, {});
        } else if (user.role === Role.AdminGrupo || user.role === Role.ComumGrupo) {
            return authenticateUserFromGroup();
        } else if (user.role === Role.AdminLocal || user.role === Role.ComumLocal) {
            return authenticateUserFromPlace();
        }
    }

    function authenticateUserFromGroup() {
        if (group) {
            return groupService.getById(group, user._id, user.role)
                .then(group => {
                    /*
                    if (!group.users.some(function (user) {
                        return user.equals(user._id);
                    })) {
                        return;
                    }
                    */
                    if (!group) {
                        return;
                    }
                    return authenticateUser(user, { group: group });
                })
                .catch(err => {
                    throw Error(err);
                });
        }
        return groupService.getByUser(user._id)
            .then(groups => {
                if (groups.length !== 1) {
                    return {
                        groups: groups
                    };
                }
                return authenticateUser(user, { group: groups[0] });
            })
            .catch(err => {
                throw Error(err);
            });
    }

    function authenticateUserFromPlace() {
        if (place) {
            return placeService.getById(place, user._id, user.role)
                .then(place => {
                    if (!place) {
                        return;
                    }
                    return authenticateUser(user, { place: place });
                })
                .catch(err => {
                    throw Error(err);
                });
        }
        return placeService.getByUser(user._id)
            .then(places => {
                if (places.length !== 1) {
                    return {
                        places: places
                    };
                }
                return authenticateUser(user, { place: places[0] });
            })
            .catch(err => {
                throw Error(err);
            });
    }
}

async function getUserToken({ username, password, group, place }) {
    const user = await User.findOne({ username });
    if (user && bcrypt.compareSync(password, user.hash)) {
        return authenticateUser(user, {});
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