const express = require('express');
const router = express.Router();
const placeService = require('./place.service');
const authorize = require('../_helpers/authorize')
const Role = require('../_helpers/role');
const groupService = require('../groups/group.service');

// routes
router.post('/register', authorize.authorize([Role.AdminGrupo]), register);
router.put('/:id', authorize.authorize([Role.AdminGrupo, Role.AdminLocal]), update);
router.delete('/:id', authorize.authorize([Role.AdminGrupo, Role.AdminLocal]), _delete);
router.get('/', getAll);
router.get('/:id', authorize.authorize([Role.AdminGrupo, Role.AdminLocal]), getById);
router.get('/user/:id', authorize.authorize([Role.AdminGrupo, Role.AdminLocal]), getByUser);
router.get('/group/:id', authorize.authorize([Role.AdminGrupo, Role.AdminLocal]), getByGroup);
router.get('/nigroup/:id', authorize.authorize([Role.AdminGrupo, Role.AdminLocal]), getByNotInGroup);

module.exports = router;

function register(req, res, next) {
        groupService.checkUserGroup(req.body.group, req.user)
                .then(result => {
                        if (result) {
                                placeService.create(req.body)
                                        .then(() => res.json({}))
                                        .catch(err => next(err));
                        }
                        else
                                res.sendStatus(400);
                })
                .catch(err => next(err));
}

function getAll(req, res, next) {
        placeService.getAll(req.user)
                .then(places => res.json(places))
                .catch(err => next(err));
}

function getById(req, res, next) {
        placeService.getById(req.params.id, req.user)
                .then(place => place ? res.json(place) : res.sendStatus(404))
                .catch(err => next(err));
}

function getByUser(req, res, next) {
        placeService.getByUser(req.params.id)
                .then(places => places ? res.json(places) : res.sendStatus(404))
                .catch(err => next(err));
}

function getByGroup(req, res, next) {
        placeService.getByGroup(req.params.id)
                .then(places => places ? res.json(places) : res.sendStatus(404))
                .catch(err => next(err));
}

function getByNotInGroup(req, res, next) {
        placeService.getByNotInGroup(req.params.id, req.user)
                .then(places => places ? res.json(places) : res.sendStatus(404))
                .catch(err => next(err));
}

function update(req, res, next) {
        placeService.update(req.params.id, req.body)
                .then(() => res.json({}))
                .catch(err => next(err));
}

function _delete(req, res, next) {
        placeService.delete(req.params.id)
                .then(() => res.json({}))
                .catch(err => next(err));
}