const express = require('express');
const router = express.Router();
const adService = require('./ad.service');
const placeService = require('../places/place.service');
const authorize = require('../_helpers/authorize')
const Role = require('../_helpers/role');
const ObjectId = require('mongodb').ObjectID;
const io = require('socket.io-emitter')({ host: 'redis', port: 6379 });
const FlakeIdGen = require('flake-idgen'),
        intformat = require('biguint-format'),
        generator = new FlakeIdGen()

// routes
router.post('/register', authorize.authorize(), uploadAd, register, updatePlace);
router.get('/', authorize.authorize([Role.SuperAdmin]), getAll);
router.get('/:id', authorize.authorize(), getById);
router.get('/place/:id', authorize.authorize(), getByPlace);
router.put('/:id', authorize.authorize(), update);
router.delete('/:id', authorize.authorize(), _delete);

module.exports = router;

function uploadAd(req, res, next) {
        let uploadFile;
        let uploadPath;

        if (!req.files || Object.keys(req.files).length == 0) {
                res.status(400).send('No files were uploaded.');
                return;
        }

        //console.log('req.files >>>', req.files); // eslint-disable-line
        console.log('UPLOAD!!!');
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
        if (!req.body.places || req.body.places && !Array.isArray(req.body.places) && typeof req.body.places === 'string' && req.body.places.trim() === '') {
                delete req.body.places;
        } else if (req.body.places && !Array.isArray(req.body.places)) {
                req.body.places = [req.body.places];
        }
        if (!req.body.groups || req.body.groups && !Array.isArray(req.body.groups) && typeof req.body.groups === 'string' && req.body.groups.trim() === '') {
                delete req.body.groups;
        } else if (req.body.groups && !Array.isArray(req.body.groups)) {
                req.body.groups = [req.body.groups];
        }
        console.log('CREATE!!!');
        adService.create(req.body)
                .then(() => {
                        console.log('NEXTTTT');
                        next();
                })
                .catch(err => {
                        console.log(err);
                        removeFile(req.body.mediapath);
                        next(err);
                });
}

async function updatePlace(req, res, next) {
        console.log('UPDATE!!!');
        if (req.body.groups) {
                for (let group of req.body.groups) {
                        console.log(group);
                        groupPlaces = await placeService.getBy({ group: group }, 'places').then(places => places).catch(err => next(err));

                        adService.getBy({
                                $or: [{ groups: ObjectId(group) },
                                { places: { $in: groupPlaces } }]
                        })
                                .then(ads => {
                                        console.log('ADS CONTROLLER :: ' + ads);
                                        for (let place of groupPlaces) {
                                                io.to(place._id).emit('ads-message', JSON.stringify(ads));
                                        }
                                })
                                .catch(err => next(err));
                }
        }
        if (req.body.places) {
                for (let place of req.body.places) {
                        place = await placeService.getById(place).then(place => place).catch(err => next(err));
                        adService.getBy({
                                $or: [{ groups: ObjectId(place.group) },
                                { places: ObjectId(place._id) }]
                        })
                                .then(ads => {
                                        console.log('ADS CONTROLLER');
                                        io.to(place._id).emit('ads-message', JSON.stringify(ads));
                                })
                                .catch(err => next(err));
                }
        }
        res.json({});
}

function getAll(req, res, next) {
        adService.getAll()
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
        adService.update(req.params.id, req.body)
                .then(() => res.json({}))
                .catch(err => next(err));
}

function _delete(req, res, next) {
        adService.getById(req.params.id)
                .then(ad => {
                        if (ad) {
                                removeFile(ad.mediapath);
                        }
                })
                .catch(err => next(err));

        adService.delete(req.params.id)
                .then(() => res.json({}))
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