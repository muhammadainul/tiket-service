const debug = require('debug');
const passport = require('passport');

module.exports = {
    isSecured: async (req, res, next) => {
        const log = debug('tiket-service:isSecured')
        passport.authenticate('jwt', (err, user, info) => {
            log('err, user, info', { err, user, info });
            if (err) return res.status(400).json({ error: err });
            if (!user) 
                return res.status(570).json({
                     message: 'Unauthorized access. Please login.', 
                     error: err 
                });
                
            req.logIn(user, { session: false }, err => {
                if (err) return res.json({ error: err });
                next();
            });
        })(req, res, next);
    }
};
