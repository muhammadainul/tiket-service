const debug = require('debug');
const passportJWT = require('passport-jwt');
const JWTStrategy = passportJWT.Strategy;
const ExtractJWT = passportJWT.ExtractJwt;

const { Users } = require('../models');

module.exports = function (passport) {
    const log = debug('tiket-service:serialize')
    passport.serializeUser((user, done) => {
        log('seriaLizeUser', user)
        done(null, user)
    })

    passport.deserializeUser(async (id, done) => {
        log('deserializeUser', id);
        try {
            const result = await Users.findone({ 
                where: { id },
                raw: true
            });
            if (!isEmpty(result)) {
                log('results', result)
                return done(null, result);
            } else {
                return done(null, false);
            }
        } catch (error) {
            throw error
        }
    })
    
    // PASSPORT JWT
    passport.use(
        new JWTStrategy(
        {
            jwtFromRequest: ExtractJWT.fromHeader('simandesk_token'),
            secretOrKey: config.myConfig.sessionSecret
        },
        (async (jwtPayload, done) => {
            log('jwtPassport', { jwtPayload })
            try {
               return done(null, jwtPayload)
            } catch (error) {
                done(error)
            }
        }) 
    ))
}