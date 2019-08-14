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
router.post('/usertoken', authorize.isSuperUser(), getUserToken);
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
    userService.create(req.body)
        .then(result => {
            if (req.body.groups) {
                addUserToGroup(result, Array.isArray(req.body.groups) ? req.body.groups : [req.body.groups]);
            }
            
            if (req.body.places) {
                addUserToPlace(result, Array.isArray(req.body.places) ? req.body.places : [req.body.places]);
            }
            return res.json({ confirmation: result.confirmation });
        })
        .catch(err => next(err));

    function addUserToGroup(result, groups) {
        for (i in groups) {
            groupService.getById(groups[i].group).then(group => {
                group.users.push({ user: result.user._id, role: groups[i].role });
                group.save();
            }).catch(err => {
                console.error(err);
            });
        }
    }

    function addUserToPlace(result, places) {
        for (i in places) {
            placeService.getById(places[i].place).then(place => {
                place.users.push({ user: result.user._id, role: places[i].role });
                place.save();
                addUserToGroup(result, [{group: place.group, role: places[i].role}]);
            }).catch(err => {
                console.error(err);
            });
        }
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
        body('lastName', 'Campo Sobrenome é obrigatório.').trim().exists({ checkFalsy: true })
    ];

    if (!req.user.isSU) {
        // verificar se o grupo e/ou local a ser cadastrado, para um determinado usuário, 
        // é permitido para o nível de acesso do cadastrante para aquele grupo e/ou local.
        let userAdminGroups = await groupService.getByUserAndRoles(req.user.sub, [Role.AdminGrupo]);
        let userAdminPlaces = await placeService.getByUserAndRoles(req.user.sub, [Role.AdminLocal]);
        validations.push(body('groups').custom(async groups => {
            if(userAdminGroups.length === 0 && userAdminPlaces.length === 0) {
                return Promise.reject('Erro Inesperado!');
            }
            if (!groups && !req.body.places) {
                return Promise.reject('Dados inválidos!');
            }
        }));
        addGroupValidation(true);
        addPlaceValidation(true, userAdminGroups);
    }

    await Promise.all(validations.map(validation => validation.run(req)));

    next();

    function addGroupValidation(isOptional) {
        const roles = [Role.AdminGrupo, Role.AdminLocal, Role.ComumGrupo, Role.ComumLocal];
        let validation = body('groups', 'Campo Grupo é inválido.');
        if (isOptional) {
            validation = validation.optional({ checkFalsy: true });
        }
        validations.push(validation.custom(async groups => {
            if(isOptional && !groups) {
                return;
            } else if(!isOptional && !groups) {
                return Promise.reject('Campo Grupo é inválido.');
            }
            groups = Array.isArray(groups) ? groups : [groups];
            for (let i in groups) {
                if (!roles.includes(groups[i].role)) {
                    return Promise.reject('Campo Perfil é inválido.');
                }
                try {
                    await groupService.getByIdUserAndRoles(groups[i].group, req.user.sub, [Role.AdminGrupo]).then(group => {
                        if (!group || Array.isArray(group) && !group.length) {
                            return Promise.reject({
                                stack: 'groupid "' + groups[i].group + '" inválido.'
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

    function addPlaceValidation(isOptional, userGroups) {
        const roles = [Role.AdminLocal, Role.ComumLocal];
        let validation = body('places');
        if (isOptional) {
            validation = validation.optional({ checkFalsy: true });
        }
        validation = validation.custom(async places => {
            if(isOptional && !places) {
                return;
            } else if(!isOptional && !places) {
                return Promise.reject('Campo Local é inválido.');
            }
            places = Array.isArray(places) ? places : [places];
            
            for (let i in places) {
                if (!roles.includes(places[i].role)) {
                    return Promise.reject('Campo Perfil é inválido.');
                }
                let statemet;
                if (userGroups.length) {
                    const clause = { 
                        _id: places[i].place,
                        $or: [
                            { group: { $in: userGroups } },
                            { 'users': { $elemMatch: { 'user': req.user.sub, 'role': { $in: [Role.AdminLocal] } } } } 
                        ] 
                    };
                    statemet = placeService.getBy(clause);
                } else {
                    statemet = placeService.getByIdUserAndRoles(places[i].place, req.user.sub, [Role.AdminLocal]);
                }
                try {
                    await statemet.then(place => {
                        if (!place || Array.isArray(place) && !place.length) {
                            return Promise.reject({
                                stack: 'placeid "' + places[i].place + '" inválido.'
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

    function addRoleValidation(roles) {
        validations.push(body('role', 'Campo Papel é inválido.')
            .optional({ checkFalsy: true }).isIn(roles).trim());
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
    if (!req.user.isSU && req.user.sub !== req.params.id) {
        /*
        if (req.user.role === Role.ComumGrupo || req.user.role === Role.ComumLocal) {
            return next({ name: 'UnauthorizedValidationError', message: 'Unauthorized' });
        }
        */
        //const clause = { $and: [ { users: req.user.sub }, { users: req.params.id } ] };
        const clause = { users: [req.user.sub, req.params.id] };
        //{}
        groupService.getBy(clause).then(groups => {
            if (groups.length == 0) {
                return Promise.reject({ name: 'UnauthorizedValidationError', message: 'Unauthorized' });
            }
            return next();
        }).catch(err => {
            return next(err);
        });

    } else {
        next();
    }
}