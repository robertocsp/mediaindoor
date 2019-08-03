const express = require('express');
const router = express.Router();
const userService = require('./user.service');
const groupService = require('../groups/group.service');
const placeService = require('../places/place.service');
const authorize = require('../_helpers/authorize')
const Role = require('../_helpers/role');
const errorHandler = require('../_helpers/error-handler');
const { body, validationResult } = require('express-validator');

// routes
router.post('/authenticate', authenticate);
router.post('/register', authorize.authorize([Role.AdminGrupo, Role.AdminLocal]),
    validateRegister, checkValidationResult, register);
router.get('/', authorize.authorize(), getAll);
router.post('/usertoken', authorize.authorize(), getUserToken);
router.get('/current', getCurrent);
router.get('/:id', authorize.authorize([Role.AdminGrupo, Role.AdminLocal, Role.ComumGrupo, Role.ComumLocal]),
    validateUserByRole, getById);
router.put('/:id', authorize.authorize(), update);
router.delete('/:id', authorize.authorize(), _delete);

router.use(errorHandler);

module.exports = router;

function authenticate(req, res, next) {
    userService.authenticate(req.body)
        .then(result => result ? res.json(result) : res.status(400).json({ message: 'Username or password is incorrect' }))
        .catch(err => next(err));
}

function getUserToken(req, res, next) {
    userService.getUserToken(req.body)
        .then(result => result ? res.json(result) : res.status(400).json({ message: 'Username or password is incorrect' }))
        .catch(err => next(err));
}

function register(req, res, next) {
    console.log(req.body);
    
    userService.create(req.body)
        .then(result => {
            if (req.body.groups && (req.body.role === Role.AdminGrupo || req.body.role === Role.ComumGrupo)) {
                addUserToGroup(result, Arrays.isArray(req.body.groups) ? req.body.groups : [req.body.groups]);
            } else if (req.body.role === Role.AdminLocal || req.body.role === Role.ComumLocal) {
                addUserToPlace(result);
            }
            return res.json({ confirmation: result.confirmation });
        })
        .catch(err => next(err));

    function addUserToGroup(result, groups) {
        for (i in groups) {
            groupService.getById(groups[i]).then(group => {
                group.users.push(result.user._id);
                group.save();
            }).catch(err => {
                console.error(err);
            });
        }
    }

    function addUserToPlace(result) {
        placeService.getById(req.body.place).then(place => {
            place.users.push(result.user._id);
            place.save();
            addUserToGroup(result, [place.group]);
        }).catch(err => {
            console.error(err);
        });
    }
}

function getAll(req, res, next) {
    userService.getAll()
        .then(users => res.json(users))
        .catch(err => next(err));
}

function getCurrent(req, res, next) {
    userService.getById(req.user.sub)
        .then(user => user ? res.json(user) : res.sendStatus(404))
        .catch(err => next(err));
}

function getById(req, res, next) {
    userService.getById(req.params.id)
        .then(user => user ? res.json(user) : res.sendStatus(404))
        .catch(err => next(err));
}

function update(req, res, next) {
    userService.update(req.params.id, req.body)
        .then(() => res.json({}))
        .catch(err => next(err));
}

function _delete(req, res, next) {
    userService.delete(req.params.id)
        .then(() => res.json({}))
        .catch(err => next(err));
}

async function validateRegister(req, res, next) {
    let validations = [
        body('username', 'Campo Usuário é obrigatório.').trim().exists({ checkFalsy: true }),
        body('username', 'Campo Usuário deve ser um e-mail válido.')
            .optional({ checkFalsy: true }).isEmail(),
        body('username', 'Usuário "' + req.body.username + '" já existe.')
            .optional({ checkFalsy: true }).custom(async uname => {
                if (await userService.getOne({ username: uname })) {
                    return Promise.reject();
                }
            }),
        body('firstName', 'Campo Primeiro nome é obrigatório.').trim().exists({ checkFalsy: true }),
        body('lastName', 'Campo Sobrenome é obrigatório.').trim().exists({ checkFalsy: true }),
        body('role', 'Campo Papel é obrigatório.').trim().exists({ checkFalsy: true })
    ];

    if (req.user.role === Role.SuperAdmin) {
        addRoleValidation([
            Role.SuperAdmin,
            Role.AdminGrupo,
            Role.AdminLocal,
            Role.ComumGrupo,
            Role.ComumLocal
        ]);
        if (req.body.role === Role.AdminGrupo || req.body.role === Role.ComumGrupo) {
            addGroupValidation(true);
        } else if (req.body.role === Role.AdminLocal || req.body.role === Role.ComumLocal) {
            addPlaceValidation(true);
        }
    } else if (req.user.role === Role.AdminGrupo) {
        addRoleValidation([
            Role.AdminGrupo,
            Role.AdminLocal,
            Role.ComumGrupo,
            Role.ComumLocal
        ]);
        if (req.body.role === Role.AdminGrupo || req.body.role === Role.ComumGrupo) {
            addGroupValidation();
        } else {
            addPlaceValidation();
        }
    } else if (req.user.role === Role.AdminLocal) {
        addRoleValidation([
            Role.AdminLocal,
            Role.ComumLocal
        ]);
        addPlaceValidation();
    }

    await Promise.all(validations.map(validation => validation.run(req)));

    next();

    function addRoleValidation(roles) {
        validations.push(body('role', 'Campo Papel é inválido.')
            .optional({ checkFalsy: true }).isIn(roles).trim());
    }

    function addGroupValidation(isOptional) {
        let validation = body('groups', 'Campo Grupo é inválido.');
        if (isOptional) {
            validation = validation.optional({ checkFalsy: true });
        }
        validations.push(validation.custom(async groups => {
            if(!groups) {
                console.error('groupid "' + groups + '" inválido.');
                return Promise.reject('Campo Grupo é inválido.');
            }
            groups = Array.isArray(groups) ? groups : [groups];
            for (let i in groups) {
                try {
                    await groupService.getById(groups[i], req.user.sub, req.user.role).then(group => {
                        if (!group || Array.isArray(group) && !group.length) {
                            return Promise.reject({
                                stack: 'groupid "' + groups[i] + '" inválido.'
                            });
                        }
                    }).catch(err => {
                        console.error(err.stack);
                        return Promise.reject('Campo Grupo é inválido.');
                    });
                } catch (error) {
                    console.error(error);
                    return Promise.reject(error);
                }
            }
        }));
    }

    function addPlaceValidation(isOptional) {
        let validation = body('places');
        if (isOptional) {
            validation = validation.optional({ checkFalsy: true });
        }
        validation = validation.custom(async places => {
            if(!places) {
                console.error('placeid "' + places + '" inválido.');
                return Promise.reject('Campo Local é inválido.');
            }
            places = Array.isArray(places) ? places : [places];
            let userGroups;
            if (req.user.role === Role.AdminGrupo) {
                userGroups = await groupService.getByUser(req.user.sub);
            }
            for (let i in places) {
                let statemet;
                if (req.user.role === Role.AdminGrupo) {
                    const clause = { _id: places[i], group: { $in: userGroups } };
                    statemet = placeService.getBy(clause);
                } else {
                    statemet = placeService.getById(places[i], req.user.sub, req.user.role);
                }
                try {
                    await statemet.then(place => {
                        if (!place || Array.isArray(place) && !place.length) {
                            return Promise.reject({
                                stack: 'placeid "' + places[i] + '" inválido.'
                            });
                        }
                    }).catch(err => {
                        console.error(err.stack);
                        return Promise.reject('Campo Local é inválido.');
                    });
                } catch (error) {
                    console.error(error);
                    return Promise.reject(error);
                }
            }
        });
        validations.push(validation);
    }
}

function checkValidationResult(req, res, next) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(422).json({ errors: errors.array() });
    }
    next();
}

function validateUserByRole(req, res, next) {
    if (req.user.role !== Role.SuperAdmin && req.user.sub !== req.params.id) {
        if (req.user.role === Role.ComumGrupo || req.user.role === Role.ComumLocal) {
            return next({ name: 'UnauthorizedValidationError', message: 'Unauthorized' });
        }
        if (req.user.role === Role.AdminGrupo || req.user.role === Role.AdminLocal) {
            //const clause = { $and: [ { users: req.user.sub }, { users: req.params.id } ] };
            const clause = { users: [req.user.sub, req.params.id] };
            groupService.getBy(clause).then(groups => {
                if (groups.length == 0) {
                    return Promise.reject({ name: 'UnauthorizedValidationError', message: 'Unauthorized' });
                }
                return next();
            }).catch(err => {
                return next(err);
            });
        }

    } else {
        next();
    }
}