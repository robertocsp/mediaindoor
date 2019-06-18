const express = require('express');
const router = express.Router();
const groupService = require('./group.service');
const authorize = require('../_helpers/authorize')
const Role = require('../_helpers/role');

// routes
router.post('/register', authorize.authorize([Role.SuperAdmin]), register);
router.get('/', authorize.authorize([Role.SuperAdmin]), getAll);
router.get('/:id', authorize.authorize(), authorize.authorizeCurrentUser(), getById);
router.get('/user/:id', authorize.authorize(), authorize.authorizeCurrentUser(), getByUser);
router.put('/:id', authorize.authorize(), authorize.authorizeCurrentUser(), update);
router.delete('/:id', authorize.authorize(), authorize.authorizeCurrentUser(), _delete);

module.exports = router;

function register(req, res, next) {
   groupService.create(req.body)
        .then(() => res.json({}))
        .catch(err => next(err));
}

function getAll(req, res, next) {
   groupService.getAll()
        .then(users => res.json(users))
        .catch(err => next(err));
}

function getById(req, res, next) {
   groupService.getById(req.params.id)
        .then(user => user ? res.json(user) : res.sendStatus(404))
        .catch(err => next(err));
}

function getByUser(req, res, next) {
   groupService.getByUser(req.params.id)
        .then(user => user ? res.json(user) : res.sendStatus(404))
        .catch(err => next(err));
}

function update(req, res, next) {
   groupService.update(req.params.id, req.body)
        .then(() => res.json({}))
        .catch(err => next(err));
}

function _delete(req, res, next) {
   groupService.delete(req.params.id)
        .then(() => res.json({}))
        .catch(err => next(err));
}