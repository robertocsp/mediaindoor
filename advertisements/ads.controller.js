const express = require('express');
const router = express.Router();
const adService = require('./ad.service');
const placeService = require('../places/place.service');
const authorize = require('../_helpers/authorize')
const util = require('../_helpers/util')
const Role = require('../_helpers/role');
const ObjectId = require('mongodb').ObjectID;
const io = require('socket.io-emitter')({ host: 'redis', port: 6379 });
const FlakeIdGen = require('flake-idgen'),
        intformat = require('biguint-format'),
        generator = new FlakeIdGen()

// routes
router.post('/register', validateAdRegister, uploadAd, register, updatePlace);
router.get('/', getAll);
router.get('/:id', authorize.authorize(), getById);
router.get('/place/:id', authorize.authorize(), getByPlace);
router.put('/:id', validateAdRegister, uploadAd, update, updatePlace);
router.delete('/:id', validateAdDelete, _delete);

module.exports = router;
//TODO IMPLEMENTAR AS VALIDAÇÕES
function validateAdRegister(req, res, next) {
        if(res.statusCode === 413) {
                return;
        }
        if (!req.body.places || req.body.places && !Array.isArray(req.body.places) && typeof req.body.places === 'string' && req.body.places.trim() === '') {
                req.body.places = [];
        } else if (req.body.places && !Array.isArray(req.body.places)) {
                req.body.places = req.body.places.split(',');
        }
        if (!req.body.groups || req.body.groups && !Array.isArray(req.body.groups) && typeof req.body.groups === 'string' && req.body.groups.trim() === '') {
                req.body.groups = [];
        } else if (req.body.groups && !Array.isArray(req.body.groups)) {
                req.body.groups = req.body.groups.split(',');
        }
        next();
}

async function uploadAd(req, res, next) {
        if(req.params.id) {
                req.currentAd = await adService.getById(req.params.id);
        }

        let uploadFile;
        let uploadPath;

        if (!req.files || Object.keys(req.files).length == 0) {
                if(req.currentAd) {
                        next();
                } else {
                        res.status(400).send('No files were uploaded.');
                }
                return;
        }
        if(req.currentAd) {
                removeFile(req.currentAd.mediapath);
        }

        //console.log('req.files >>>', req.files); // eslint-disable-line

        uploadFile = req.files.mediapath;
        folderid = intformat(generator.next(), 'dec');
        uploadPath = __dirname + '/../staticfiles/uploads/' + folderid + '/' + uploadFile.name;

        uploadFile.mv(uploadPath, function (err) {
                if (err) {
                        next(err);
                }
                req.body.mediapath = '/uploads/' + folderid + '/' + uploadFile.name;
                next();
        });
}

function register(req, res, next) {
        adService.create(req.body)
                .then(() => {
                        next();
                })
                .catch(err => {
                        console.log(err);
                        removeFile(req.body.mediapath);
                        next(err);
                });
}

async function updatePlace(req, res, next) {
        if(req.currentAd) {
                if(req.currentAdGroups && req.body.groups) {
                        req.body.groups = util.arrayUnique(req.currentAdGroups.concat(req.body.groups));
                } else if(req.currentAdGroups) {
                        req.body.groups = req.currentAdGroups;
                }
                if(req.currentAdPlaces && req.body.places) {
                        req.body.places = util.arrayUnique(req.currentAdPlaces.concat(req.body.places));
                } else if(req.currentAdPlaces) {
                        req.body.places = req.currentAdPlaces;
                }
        }
        await emitMessageToClient(req.body.groups, req.body.places, next);
        res.json({});
}

async function emitMessageToClient(groupsList, placesList, next) {
        if (groupsList) {
                for (let group of groupsList) {
                        groupPlaces = await placeService.getBy({ group: group }, 'places').then(places => places).catch(err => next(err));
                        groupPlaces = Array.prototype.map.call(groupPlaces, function(item) { return item._id; });
                        await emitMessageToPlaces(util.arrayDiff(groupPlaces.concat(placesList)));
                }
        }
        await emitMessageToPlaces(placesList);

        async function emitMessageToPlaces(placesList) {
                if (placesList) {
                        for (let place of placesList) {
                                place = await placeService.getById(place).then(place => place).catch(err => next(err));
                                adService.getBy({
                                        $or: [{ groups: ObjectId(place.group) },
                                        { places: ObjectId(place._id) }]
                                }, '-weight')
                                        .then(ads => {
                                                io.to(place._id).emit('ads-message', JSON.stringify(ads));
                                        })
                                        .catch(err => next(err));
                        }
                }
        }
}

function getAll(req, res, next) {
        adService.getAll(req.query._page, req.query._limit, req.user)
                .then(ads => res.json(ads))
                .catch(err => next(err));
}

function getById(req, res, next) {
        adService.getById(req.params.id)
                .then(ad => ad ? res.json(ad) : res.sendStatus(404))
                .catch(err => next(err));
}

function getByPlace(req, res, next) {
        adService.getByPlace(req.params.id)
                .then(ads => ads ? res.json(ads) : res.sendStatus(404))
                .catch(err => next(err));
}

function update(req, res, next) {
        req.currentAdGroups = req.currentAd.groups;
        req.currentAdPlaces = req.currentAd.places;
        adService.update(req.currentAd, req.body)
                .then(() => next())
                .catch(err => next(err));
}

function validateAdDelete(req, res, next) {
        next();
}

function _delete(req, res, next) {
        adService.delete(req.params.id)
                .then((ad) => {
                        if (ad) {
                                removeFile(ad.mediapath);
                                emitMessageToClient(ad.groups, ad.places, next);
                                res.json({});
                        } else {
                                res.status(204).send('No ad found.');
                        }
                })
                .catch(err => next(err));
}

function removeFile(mediapath) {
        const fs = require('fs');
        const path = __dirname + '/../staticfiles' + mediapath;
        try {
                fs.unlinkSync(path);
                fs.rmdir(path.substr(0, path.lastIndexOf('/')), err => console.error(err));
                //file removed
        }
        catch (err) {
                console.error(err);
        }
}