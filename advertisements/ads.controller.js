const express = require('express');
const router = express.Router();
const adService = require('./ad.service');
const authorize = require('../_helpers/authorize')
const Role = require('../_helpers/role');

// routes
router.post('/register', authorize.authorize([Role.SuperAdmin]), register);
router.get('/', authorize.authorize([Role.SuperAdmin]), getAll);
router.get('/:id', authorize.authorize(), getById);
router.get('/place/:id', authorize.authorize(), getByPlace);
router.put('/:id', authorize.authorize(), update);
router.delete('/:id', authorize.authorize(), _delete);

module.exports = router;

function register(req, res, next) {
   adService.create(req.body)
        .then(() => res.json({}))
        .catch(err => next(err));
}

function getAll(req, res, next) {
   adService.getAll()
        .then(users => res.json(users))
        .catch(err => next(err));
}

function getById(req, res, next) {
   adService.getById(req.params.id)
        .then(user => user ? res.json(user) : res.sendStatus(404))
        .catch(err => next(err));
}

function getByPlace(req, res, next) {
   adService.getByPlace(req.params.id)
        .then(user => user ? res.json(user) : res.sendStatus(404))
        .catch(err => next(err));
}

function update(req, res, next) {
   adService.update(req.params.id, req.body)
        .then(() => res.json({}))
        .catch(err => next(err));
}

function _delete(req, res, next) {
   adService.delete(req.params.id)
        .then(() => res.json({}))
        .catch(err => next(err));
}