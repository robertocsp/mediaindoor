const expressJwt = require('express-jwt');
const { secret } = require('../config/config.json');
const Role = require('../_helpers/role');

module.exports.authorize = authorize;
module.exports.authorizeCurrentUser = authorizeCurrentUser;

function authorize(roles = []) {
    // roles param can be a single role string (e.g. Role.User or 'User') 
    // or an array of roles (e.g. [Role.Admin, Role.User] or ['Admin', 'User'])
    if (typeof roles === 'string') {
        roles = [roles];
    }

    return [
        // authenticate JWT token and attach user to request object (req.user)
        expressJwt({ secret }),

        // authorize based on user role
        (req, res, next) => {

            if (roles.length && !roles.includes(req.user.role)  && req.user.role !== Role.SuperAdmin) {
                // user's role is not authorized
                return res.status(401).json({ message: 'Unauthorized' });
            }

            // authentication and authorization successful
            next();
        }
    ];
}

function authorizeCurrentUser(){
    return (req, res, next) => {
        const currentUser = req.user;
        const id = req.params.id;
    
        // only allow admins to access other user records
        if (id !== currentUser.sub && currentUser.role !== Role.SuperAdmin) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        next();
    };
}