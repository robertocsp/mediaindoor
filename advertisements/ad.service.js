const db = require('../config/database');
const Ad = db.Ad;

module.exports = {
    getAll,
    getById,
    getBy,
    getByGroup,
    getByPlace,
    create,
    update,
    delete: _delete
};

async function getAll(page, itemsPerPage, user) {
    if (user.isSU) {
        let ads = await Ad.find()
            .populate('places', 'placename')
            .populate('groups', 'groupname')
            .skip((page - 1) * itemsPerPage)
            .limit(itemsPerPage * 1);
        let adsCount = await Ad.countDocuments();
        return { adsCount: adsCount, ads: ads };
    }
}

async function getById(id) {
    return await Ad.findById(id);
}

async function getBy(clause, sort) {
    let q = Ad.find(clause);
    if(sort) {
        q.sort(sort);
    }
    return await q;
}

async function getByGroup(group) {
    return await Ad.find({ groups: group });
}

async function getByPlace(place) {
    return await Ad.find({ places: place });
}

async function create(adParam) {
    // validate
    if (await Ad.findOne({ adname: adParam.adname })) {
        throw 'Adname "' + adParam.adname + '" is already taken';
    }

    const ad = new Ad(adParam);

    // save ad
    await ad.save();
}

async function update(ad, adParam) {
    // const ad = await Ad.findById(id);

    // validate
    if (!ad) throw 'Ad not found';
    if (ad.adname !== adParam.adname && await Ad.findOne({ adname: adParam.adname })) {
        throw 'Adname "' + adParam.adname + '" is already taken';
    }
    // copy adParam properties to ad
    Object.assign(ad, adParam);
    await ad.save();
}

async function _delete(id) {
    return await Ad.findByIdAndRemove(id);
}