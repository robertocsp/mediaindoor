const express = require('express');
const router = express.Router();
const placeService = require('./place.service');
const authorize = require('../_helpers/authorize')
const Role = require('../_helpers/role');

// routes
router.post('/register', authorize.authorize([Role.SuperAdmin]), register);
router.get('/', authorize.authorize([Role.SuperAdmin]), getAll);
router.get('/:id', authorize.authorize(), getById);
router.get('/user/:id', authorize.authorize(), authorize.authorizeCurrentUser(), getByUser);
router.put('/:id', authorize.authorize(), update);
router.delete('/:id', authorize.authorize(), _delete);

module.exports = router;

function register(req, res, next) {
   placeService.create(req.body)
        .then(() => res.json({}))
        .catch(err => next(err));
}

function getAll(req, res, next) {
   placeService.getAll()
        .then(users => res.json(users))
        .catch(err => next(err));
}

function getById(req, res, next) {
   placeService.getById(req.params.id)
        .then(user => user ? res.json(user) : res.sendStatus(404))
        .catch(err => next(err));
}

function getByUser(req, res, next) {
   placeService.getByUser(req.params.id)
        .then(user => user ? res.json(user) : res.sendStatus(404))
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