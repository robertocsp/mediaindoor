const express = require('express');
const router = express.Router();
const groupService = require('./group.service');
const authorize = require('../_helpers/authorize')
const Role = require('../_helpers/role');

// routes
router.post('/register', authorize.authorize(), register);
router.get('/', authorize.authorize(), getAll);
router.get('/:id', authorize.authorize([Role.AdminGrupo]), getById);
router.get('/user/:id', authorize.authorize([Role.AdminGrupo]), getByUser);
router.put('/:id', authorize.authorize([Role.AdminGrupo]), update);
router.delete('/:id', authorize.authorize(), _delete);

module.exports = router;

function register(req, res, next) {
        groupService.create(req.body)
                .then(() => res.json({}))
                .catch(err => next(err));
}

function getAll(req, res, next) {
        groupService.getAll()
                .then(groups => res.json(groups))
                .catch(err => next(err));
}

function getById(req, res, next) {
        groupService.getById(req.params.id, req.user)
                .then(group => user ? res.json(group) : res.sendStatus(404))
                .catch(err => next(err));
}

function getByUser(req, res, next) {
        groupService.getByUser(req.params.id)
                .then(groups => groups ? res.json(groups) : res.sendStatus(404))
                .catch(err => next(err));
}

function update(req, res, next) {
        groupService.update(req.params.id, req.user, req.body)
                .then(() => res.json({}))
                .catch(err => next(err));
}

function _delete(req, res, next) {
        groupService.delete(req.params.id)
                .then(() => res.json({}))
                .catch(err => next(err));
}