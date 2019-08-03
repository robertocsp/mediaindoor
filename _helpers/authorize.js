const expressJwt = require('express-jwt');
const Role = require('../_helpers/role');
const fs = require('fs');

module.exports.authorize = authorize;
module.exports.isLogged = isLogged;

let secretTokenPub = fs.readFileSync('keys/jwt-secret.pub');

function authorize(roles = []) {
    // roles param can be a single role string (e.g. Role.User or 'User') 
    // or an array of roles (e.g. [Role.Admin, Role.User] or ['Admin', 'User'])
    if (typeof roles === 'string') {
        roles = [roles];
    }

    return (req, res, next) => {

        if (!roles.includes(req.user.role) && req.user.role !== Role.SuperAdmin) {
            // user's role is not authorized
            return res.status(401).json({ message: 'Unauthorized' });
        }

        // authentication and authorization successful
        next();
    };
}

function isLogged() {
    // authenticate JWT token and attach user to request object (req.user)
    return expressJwt({ secret: secretTokenPub, algorithms: 'RS256' });
}