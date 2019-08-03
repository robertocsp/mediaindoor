const mongoose = require('mongoose');

mongoose.connect(process.env.MONGODB_URI, { useCreateIndex: true, useNewUrlParser: true });
mongoose.Promise = global.Promise;

module.exports = {
    User: require('../users/user.model'),
    Group: require('../groups/group.model'),
    Place: require('../places/place.model'),
    Ad: require('../advertisements/ad.model')
}
